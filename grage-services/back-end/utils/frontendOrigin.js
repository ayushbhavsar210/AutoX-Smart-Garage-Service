const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5000',
];

const normalizeOrigin = (value) => {
  if (!value) return null;

  try {
    return new URL(String(value).trim()).origin;
  } catch (_error) {
    return null;
  }
};

const getConfiguredOrigins = () => {
  const extraOrigins = String(process.env.FRONTEND_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const configuredFrontend = normalizeOrigin(process.env.FRONTEND_URL);

  return [...LOCAL_ORIGINS, configuredFrontend, ...extraOrigins].filter(Boolean);
};

const isAllowedFrontendOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  const allowedOrigins = getConfiguredOrigins();
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  try {
    const host = new URL(normalizedOrigin).hostname.toLowerCase();
    return host.endsWith('.vercel.app') || host.endsWith('.onrender.com');
  } catch (_error) {
    return false;
  }
};

const getFrontendBaseUrl = (req) => {
  const requestOrigin = normalizeOrigin(req?.get?.('origin') || req?.headers?.origin);
  if (requestOrigin && isAllowedFrontendOrigin(requestOrigin)) {
    return requestOrigin;
  }

  const configuredFrontend = normalizeOrigin(process.env.FRONTEND_URL);
  if (configuredFrontend) {
    return configuredFrontend;
  }

  return 'http://localhost:3000';
};

module.exports = {
  getConfiguredOrigins,
  getFrontendBaseUrl,
  isAllowedFrontendOrigin,
  normalizeOrigin,
};