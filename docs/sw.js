// NaijaGaz service worker — precache + network-first.
//
// On install: precache the critical app shell so first-visit-after-load
// is instantly available offline.
// On fetch: try network first, fall back to cache. Broker calls bypass
// caching entirely (always-fresh data).
// On message (SKIP_WAITING): activate the new SW; the page reloads.

const CACHE = 'ng-5821f98';

const PRECACHE = [
  './',
  './index.html',
  './order.html',
  './track.html',
  './again.html',
  './orders.html',
  './admin.html',
  './settings.html',
  './shell.js',
  './config.js',
  './css/base.css',
  './manifest.webmanifest',
  './icon.svg',
  './logo.svg',
  './icon-192.png',
  './apple-touch-icon.png',
  './favicon.ico',
  './pkg/naijagaz_core/naijagaz_core.js',
  './pkg/naijagaz_core/naijagaz_core_bg.wasm',
];

self.addEventListener('install', (event) => {
  // Precache best-effort — never fail install on a 404.
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})))
    )
  );
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
      .catch(() =>
        caches.match(req).then((cached) => cached || new Response('Offline', { status: 503 }))
      )
  );
});
