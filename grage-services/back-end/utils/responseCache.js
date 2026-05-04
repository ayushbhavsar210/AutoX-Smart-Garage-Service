const cache = new Map();

const DEFAULT_TTL_MS = Number(process.env.API_CACHE_TTL_MS || 30000);

const makeCacheKey = (prefix, parts = []) => `${prefix}:${parts.map((part) => String(part ?? '')).join('|')}`;

const getCachedValue = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedValue = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + Math.max(1000, Number(ttlMs) || DEFAULT_TTL_MS),
  });
};

const clearCache = (prefix = '') => {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  clearCache,
  getCachedValue,
  makeCacheKey,
  setCachedValue,
};