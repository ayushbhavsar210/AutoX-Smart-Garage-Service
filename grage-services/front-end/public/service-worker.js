const CACHE_NAME = 'autox-gallery-v1';
const IMAGES_CACHE = 'autox-images-v1';
const DYNAMIC_CACHE = 'autox-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

const IMAGE_PATTERNS = [
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.png$/i,
  /\.webp$/i,
  /\.gif$/i,
];

const isImageRequest = (url) => {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url));
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== IMAGES_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Image requests - cache first strategy
  if (isImageRequest(url.pathname)) {
    event.respondWith(
      caches
        .open(IMAGES_CACHE)
        .then((cache) => {
          return cache.match(request).then((response) => {
            if (response) {
              return response;
            }
            return fetch(request)
              .then((fetchResponse) => {
                if (!fetchResponse || fetchResponse.status !== 200) {
                  return fetchResponse;
                }
                const responseToCache = fetchResponse.clone();
                cache.put(request, responseToCache);
                return fetchResponse;
              })
              .catch(() => {
                // Return placeholder or cached version
                return cache.match('/img/placeholder.png').catch(() => undefined);
              });
          });
        })
        .catch(() => fetch(request))
    );
    return;
  }

  // Dynamic requests - network first strategy with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).catch(() => undefined);
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-images') {
    event.waitUntil(syncImages());
  }
});

async function syncImages() {
  const cache = await caches.open(IMAGES_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    } catch (err) {
      // Retry later
    }
  }
}
