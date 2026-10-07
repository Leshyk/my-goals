// Service Worker — Мои цели и задачи
//
// ВАЖНО: браузер отдаёт страницу из кэша, пока не изменится CACHE_VERSION.
// Поэтому перед каждым выпуском новой версии страницы увеличивайте номер
// (0.99.10 → 0.99.11). Иначе те, у кого приложение уже установлено,
// останутся на старой версии.

const CACHE_VERSION = 'pgt-v25-0.99.16'
const RUNTIME_CACHE = 'pgt-runtime-v25-0.99.16';

const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg'
];

// Библиотеки, без которых основные экраны не работают без сети.
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

// ============================================================
// INSTALL
// ============================================================
// Предзагружаем статику в кэш.
// ❗ НЕ вызываем здесь self.skipWaiting(), чтобы новый воркер
//    оставался в состоянии «waiting» — тогда приложение сможет
//    показать плашку «Доступно обновление». Активация произойдёт
//    по команде SKIP_WAITING из message-обработчика ниже.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) {
        return Promise.all(PRECACHE.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      })
      .then(function () {
        return caches.open(RUNTIME_CACHE).then(function (cache) {
          return Promise.all(PRECACHE_LIBS.map(function (url) {
            return cache.add(new Request(url, { mode: 'cors' })).catch(function () {});
          }));
        });
      })
  );
});

// ============================================================
// ACTIVATE
// ============================================================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key === CACHE_VERSION || key === RUNTIME_CACHE) return undefined;
        if (key.indexOf('pgt-runtime-') === 0 || key.indexOf('pgt-v25-') === 0) {
          return caches.delete(key);
        }
        return undefined;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// ============================================================
// FETCH
// ============================================================
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Не трогаем Google API
  if (url.hostname.endsWith('googleapis.com')) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === self.location.origin) {
    // HTML — network-first
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

    // sync.js — network-first
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

    // Остальное — cache-first
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

  // Внешние CDN — cache-first + обновление в фоне
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

// ============================================================
// MESSAGE — команда активации от клиента
// ============================================================
// Приходит из index.html, когда пользователь нажал «Обновить»
// в плашке «Доступно обновление». Только тогда новый воркер
// активируется и замещает старый.
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});