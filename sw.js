/**
 * @file sw.js
 * @description Service Worker for PharmaCare PWA offline caching and reliable field performance.
 */

const CACHE_NAME = 'pharmacare-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './visits.html',
  './reports.html',
  './calendar.html',
  './doctors.html',
  './pharmacies.html',
  './products.html',
  './leaves.html',
  './activities.html',
  './announcements.html',
  './quizzes.html',
  './users.html',
  './profile.html',
  './css/style.css',
  './css/dashboard.css',
  './css/reports.css',
  './js/app.js',
  './js/login.js',
  './js/dashboard.js',
  './js/visits.js',
  './js/reports.js',
  './js/calendar.js',
  './js/doctors.js',
  './js/pharmacies.js',
  './js/products.js',
  './js/leaves.js',
  './js/quizzes.js',
  './js/users.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('PharmaCare SW: Non-critical asset cache failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, but update cache in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
