// NaijaGaz service worker — network-first for everything.
// Online: fetch fresh, cache the response. Offline: serve from cache.
// No precache list. No version tokens beyond the cache name. Build script
// rewrites the cache name on each release to bust stale assets.

const CACHE = 'ng-c62ee70';

self.addEventListener('install', (event) => {
  // Don't auto-skip — wait for explicit SKIP_WAITING from the page so
  // the user is in control of the update moment via the update toast.
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Never cache the broker — order writes and status reads are always fresh.
  const url = new URL(req.url);
  if (url.hostname.includes('script.google.com')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const cloned = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cloned)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || new Response('Offline', { status: 503 })))
  );
});
