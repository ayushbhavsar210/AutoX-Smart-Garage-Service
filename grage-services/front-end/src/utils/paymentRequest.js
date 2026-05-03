import { API_BASE_URL } from './apiClient';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/$/, '');

const buildCandidateUrls = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const envBase = normalizeBaseUrl(API_BASE_URL);
  const isProduction = process.env.NODE_ENV === 'production';

  const candidates = [];

  if (envBase) {
    candidates.push(`${envBase}${normalizedPath}`);
  }

  if (!isProduction) {
    // CRA dev proxy fallback (relative path)
    candidates.push(normalizedPath);

    // Explicit local backend fallback for local development.
    candidates.push(`http://localhost:5000${normalizedPath}`);
  }

  return Array.from(new Set(candidates));
};

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return {
    success: response.ok,
    message: text,
  };
};

const postJson = async (url, payload) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    return { response, error: null };
  } catch (error) {
    return { response: null, error };
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isNetworkFailure = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('connection refused') ||
    message.includes('network request failed')
  );
};

export const postPaymentRequest = async (path, payload) => {
  const urls = buildCandidateUrls(path);
  let lastNetworkError = null;

  for (const url of urls) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { response, error } = await postJson(url, payload);

      if (!response) {
        lastNetworkError = error;
        if (attempt < 2 && isNetworkFailure(error)) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        break;
      }

      const result = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        const message = result?.message || `Request failed with status ${response.status}`;
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return result;
    }
  }

  if (!lastNetworkError) {
    throw new Error('Unable to connect to payment server');
  }

  if (isNetworkFailure(lastNetworkError)) {
    throw new Error('Unable to connect to payment server. Please check the backend deployment and API base URL.');
  }

  throw lastNetworkError;
};
