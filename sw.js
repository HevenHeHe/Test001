/**
 * Service Worker - Neon Protocol Game Hub
 * Caches assets for offline play
 */

const CACHE_NAME = 'neon-protocol-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/utils.js',
  '/js/audio-engine.js',
  '/js/games-manifest.js',
  '/js/app.js',
  '/games/tetris/tetris.js',
  '/games/minesweeper/minesweeper.js'
];

// Install: cache assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(() => {
      // Silently fail for missing assets during dev
      console.log('Some assets not cached yet');
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
