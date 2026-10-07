// Service Worker — Мои цели и задачи
//
// ВАЖНО: браузер отдаёт страницу из кэша, пока не изменится CACHE_VERSION.
// Поэтому перед каждым выпуском новой версии страницы увеличивайте номер
// (pgt-v25-91 → pgt-v25-92). Иначе те, у кого приложение уже установлено,
// останутся на старой версии.

const CACHE_VERSION = 'pgt-v25-0.99.03'
const RUNTIME_CACHE = 'pgt-runtime-v25-0.99.03';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

// Библиотеки, без которых основные экраны не работают без сети. Кладём их в кэш
// сразу при установке — иначе первое открытие без интернета показывает пустые
// места там, где должны быть Markdown, формулы и превью документов.
const PRECACHE_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
];

/** Положить ответ в кэш, если он пригоден для повторного использования. */
function cachePut(cacheName, request, response) {
  if (!response || response.status !== 200) return;
  if (response.type !== 'basic' && response.type !== 'cors') return;
  const copy = response.clone();
  caches.open(cacheName).then(function (cache) {
    cache.put(request, copy).catch(function () {});
  }).catch(function () {});
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) {
        return Promise.all(PRECACHE.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      })
      .then(function () {
        // Тяжёлые библиотеки — отдельным проходом: их сбой не должен задерживать
        // установку service worker.
        return caches.open(RUNTIME_CACHE).then(function (cache) {
          return Promise.all(PRECACHE_LIBS.map(function (url) {
            return cache.add(new Request(url, { mode: 'cors' })).catch(function () {});
          }));
        });
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // Старые runtime-кэши тоже удаляем: иначе они копятся после каждого
      // повышения версии и занимают место у пользователя.
      return Promise.all(keys.map(function (key) {
        if (key === CACHE_VERSION || key === RUNTIME_CACHE) return undefined;
        if (key.indexOf('pgt-runtime-') === 0 || key.indexOf('pgt-v25-') === 0) return caches.delete(key);
        return undefined;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Не трогаем Google API — иначе ответы кэшируются и не обновляются
  if (url.hostname.endsWith('googleapis.com')) return;
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
          cachePut(CACHE_VERSION, req, res);
          return res;
        }).catch(function () {
          return caches.match(req).then(function (c) {
            return c || new Response('Офлайн', { status: 503, statusText: 'Offline' });
          });
        })
      );
      return;
    }
    // sync.js — network-first, потому что мы его часто правим
    if (url.pathname.endsWith('sync.js')) {
      event.respondWith(
        fetch(req).then(function (res) {
          cachePut(CACHE_VERSION, req, res);
          return res;
        }).catch(function () {
          return caches.match(req).then(function (c) {
            return c || new Response('Офлайн', { status: 503, statusText: 'Offline' });
          });
        })
      );
      return;
    }
    // Остальное (иконки, манифест) — cache-first: это статика, она редко меняется
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          cachePut(CACHE_VERSION, req, res);
          return res;
        }).catch(function () {
          return new Response('Офлайн', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // Внешние CDN (pdf.js, mammoth, marked, katex, vis-network, jsdelivr, cdnjs):
  // отдаём из кэша сразу, но параллельно обновляем копию в фоне. Так страница
  // открывается мгновенно, а свежие версии библиотек подхватываются сами.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        const network = fetch(req).then(function (res) {
          cachePut(RUNTIME_CACHE, req, res);
          return res;
        }).catch(function () {
          return cached || new Response('Офлайн', { status: 503, statusText: 'Offline' });
        });
        return cached || network;
      });
    })
  );
});
