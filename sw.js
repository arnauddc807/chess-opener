/* sw.js — offline shell.
 *
 * Strategy: stale-while-revalidate for same-origin GETs. The cached copy is
 * served immediately (so the app opens instantly and works offline), while a
 * fresh copy is fetched in the background for next time. That matters on
 * GitHub Pages, where the asset filenames never change: a plain cache-first
 * worker would pin every returning visitor to the first version they loaded.
 *
 * Bump CACHE whenever the shipped file list changes. */
var CACHE = 'chess-opener-v2';
var ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/styles.css',
  './js/chess.js', './js/openings.js', './js/pieces.js',
  './js/store.js', './js/board.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
          return res;
        }).catch(function () {
          /* offline: fall back to the cached shell for navigations */
          return cached || (req.mode === 'navigate' ? cache.match('./index.html') : undefined);
        });
        return cached || network;
      });
    })
  );
});
