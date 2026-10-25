// Offline support. Network first (so updates show up straight away), falling back to the
// cached copy when offline or the network is slow. Bump CACHE when releasing.
const CACHE = 'loop-v2.0.1';
const SHELL = [
  './', './index.html', './css/app.css', './js/app.js', './js/store.js', './js/charts.js', './js/util.js', './js/icons.js',
  './js/core.js', './js/data.js', './js/health.js', './js/gym.js', './js/gym-data.js', './js/today.js', './js/settings.js',
  './manifest.webmanifest', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function fromNetwork(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { cache: 'no-cache', signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fromNetwork(url.href, 3000);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      if (cached) return cached;
      if (e.request.mode === 'navigate') return cache.match('./index.html');
      return Response.error();
    }
  })());
});
