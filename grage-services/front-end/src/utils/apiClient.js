const LOCAL_API_BASE_URL = 'http://localhost:5000';
const PRODUCTION_API_BASE_URL = 'https://autox-smart-garage-service.onrender.com';

export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_BASE_URL : LOCAL_API_BASE_URL)
).replace(/\/$/, '');

export const AUTH_TOKEN_STORAGE_KEY = 'authToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
export const AUTH_PERSISTENCE_STORAGE_KEY = 'authPersistence';

export const getAuthPersistence = () => {
  try {
    return localStorage.getItem(AUTH_PERSISTENCE_STORAGE_KEY) === 'session' ? 'session' : 'local';
  } catch (_error) {
    return 'local';
  }
};

export const setAuthPersistence = (mode) => {
  try {
    localStorage.setItem(AUTH_PERSISTENCE_STORAGE_KEY, mode === 'session' ? 'session' : 'local');
  } catch (_error) {
    // ignore storage errors
  }
};

export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (_error) {
    return null;
  }
};

export const setAuthToken = (token, persistence = 'local') => {
  try {
    if (token) {
      if (persistence === 'session') {
        sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      } else {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
        sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    }
  } catch (_error) {
    // ignore storage errors
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (_error) {
    return null;
  }
};

export const setRefreshToken = (token, persistence = 'local') => {
  try {
    if (token) {
      if (persistence === 'session') {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      } else {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
        sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    }
  } catch (_error) {
    // ignore storage errors
  }
};

export const clearRefreshToken = () => {
  try {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (_error) {
    // ignore storage errors
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (_error) {
    // ignore storage errors
  }
};

let refreshInFlight = null;

const refreshAccessToken = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('Refresh token missing');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const payload = await parseResponse(response);
    const nextAccessToken = payload?.token || payload?.accessToken;
    if (!nextAccessToken) {
      throw new Error('Failed to refresh access token');
    }

    setAuthToken(nextAccessToken);
    if (payload?.refreshToken) {
      setRefreshToken(payload.refreshToken);
    }

    return nextAccessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

const buildHeaders = (headers = {}, auth = true) => {
  const token = getAuthToken();
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth && token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const apiRequest = async (path, options = {}) => {
  const { auth = true, headers, __skipRefreshRetry = false, ...restOptions } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let response = await fetch(url, {
    ...restOptions,
    headers: buildHeaders(headers, auth),
  });

  const isRefreshEndpoint = String(path).includes('/refresh-token');
  if (response.status === 401 && auth && !__skipRefreshRetry && !isRefreshEndpoint) {
    try {
      await refreshAccessToken();
      response = await fetch(url, {
        ...restOptions,
        headers: buildHeaders(headers, auth),
      });
    } catch (_refreshError) {
      clearAuthToken();
      clearRefreshToken();
    }
  }

  return parseResponse(response);
};

export const apiGet = (path, options = {}) => apiRequest(path, { ...options, method: 'GET' });
export const apiPost = (path, body, options = {}) =>
  apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const apiPut = (path, body, options = {}) =>
  apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body || {}) });
export const apiPatch = (path, body, options = {}) =>
  apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body || {}) });
export const apiDelete = (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' });
