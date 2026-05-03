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

export const postPaymentRequest = async (path, payload) => {
  const urls = buildCandidateUrls(path);
  let lastNetworkError = null;

  for (const url of urls) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    }).catch((error) => {
      // Retry with fallback URL only when request could not be sent/reached.
      lastNetworkError = error;
      return null;
    });

    if (!response) {
      continue;
    }

    const result = await parseJsonSafely(response);
    if (!response.ok || !result?.success) {
      const message = result?.message || `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return result;
  }

  if (!lastNetworkError) {
    throw new Error('Unable to connect to payment server');
  }

  if (String(lastNetworkError.message || '').toLowerCase().includes('failed to fetch')) {
    throw new Error('Unable to connect to payment server. Please check the backend deployment and API base URL.');
  }

  throw lastNetworkError;
};
