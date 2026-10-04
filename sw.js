// Service Worker — Мои цели и задачи
// Чтобы «выпустить обновление» — поменяй CACHE_VERSION (например, pgt-v25-2)

const CACHE_VERSION = 'pgt-v25-26';
const RUNTIME_CACHE = 'pgt-runtime-v25-26';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) {
        return Promise.all(PRECACHE.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION && key !== RUNTIME_CACHE) return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === self.location.origin) {
    // HTML — network-first: всегда свежая версия страницы, кэш только для офлайна
    const isHtml = req.destination === 'document' ||
                   url.pathname === '/' ||
                   url.pathname.endsWith('/') ||
                   url.pathname.endsWith('.html');
    if (isHtml) {
      event.respondWith(
        fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(req, clone); });
          }
          return res;
        }).catch(function () { return caches.match(req); })
      );
      return;
    }
    // Остальное (иконки, манифест) — cache-first, это статика, она редко меняется
    event.respondWith(
      caches.match(req).then(function (cached) {
        const networkPromise = fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(req, clone); });
          }
          return res;
        }).catch(function () { return cached; });
        return cached || networkPromise;
      })
    );
    return;
  }

  // Внешние CDN — cache-first, как было
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        const networkPromise = fetch(req).then(function (res) {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(function () { return cached; });
        return cached || networkPromise;
      });
    })
  );
});