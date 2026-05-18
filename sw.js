// Service Worker — Michail Barber PWA
const CACHE = 'michail-barber-v1';
const STATIC = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/config.js',
  '/js/api.js',
  '/js/db.js',
  '/js/state.js',
  '/js/auth.js',
  '/js/profile.js',
  '/js/admin.js',
  '/js/core.js',
  '/js/popup.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
];

// Install: cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first for API, cache first for static
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // API calls — always network
  if (url.pathname.startsWith('/.netlify/functions/') || 
      url.hostname === 'nominatim.openstreetmap.org') {
    return;
  }
  
  // Static assets — cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
