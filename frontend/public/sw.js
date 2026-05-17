// Smart Hub Service Worker — v2.0
// Strategy: Network-first for HTML/JS/CSS. Cache-first for images/fonts only.
// ⚠️ BUMP CACHE_VERSION on every production deploy to bust old caches.

const CACHE_VERSION = 'v3-purge-csp';
const CACHE_NAME = `smarthub-${CACHE_VERSION}`;

// Minimal pre-cache — only truly static, rarely-changing assets
const PRECACHE_URLS = [
  '/favicon.ico',
  '/manifest.json'
];

// ---- Install: pre-cache minimal shell ----
self.addEventListener('install', event => {
  console.log('[SW] Installing:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Activate new SW immediately
  );
});

// ---- Activate: delete ALL old caches ----
self.addEventListener('activate', event => {
  console.log('[SW] Activating:', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim()) // Take control of all open pages
  );
});

// ---- Fetch: strategy based on resource type ----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET requests (POST, PUT, DELETE etc.)
  if (event.request.method !== 'GET') return;

  // 2. Skip API calls — NEVER cache dynamic data
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  // 3. Skip WebSocket upgrades
  if (event.request.headers.get('upgrade') === 'websocket') return;

  // 4. JS and CSS — always network-first so code changes show immediately
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 5. HTML pages — always fresh from network
  if (
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 6. Images and fonts — safe to cache for a day
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 7. Everything else — network-first with cache fallback
  event.respondWith(networkFirst(event.request));
});

// Network-first: try network, cache on success, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return a minimal offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response('<h1>Offline</h1><p>Smart Hub is offline. Please check your connection.</p>', {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    return Response.error();
  }
}

// Cache-first: serve from cache, update in background
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Refresh in background (stale-while-revalidate)
    fetch(request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response);
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}
