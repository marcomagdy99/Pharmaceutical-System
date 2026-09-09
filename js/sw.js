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
  './plans-review.html',
  './products.html',
  './leaves.html',
  './activities.html',
  './announcements.html',
  './quizzes.html',
  './users.html',
  './profile.html',
  './areas.html',
  './css/style.css',
  './css/dashboard.css',
  './css/reports.css',
  './css/visits.css',
  './css/users.css',
  './css/areas.css',
  './css/calendar.css',
  './css/activities.css',
  './css/announcements.css',
  './css/leaves.css',
  './css/profile.css',
  './css/quizzes.css',
  './css/login.css',
  './js/firebase-config.js',
  './js/app.js',
  './js/store.js',
  './js/login.js',
  './js/dashboard.js',
  './js/visits.js',
  './js/excel-templates-data.js',
  './js/shared-report.js',
  './js/sales-report.js',
  './js/timeline-report.js',
  './js/coverage-report.js',
  './js/doctors-report.js',
  './js/pharmacies-report.js',
  './js/calendar.js',
  './js/plans-review.js',
  './js/products.js',
  './js/leaves.js',
  './js/quizzes.js',
  './js/users.js',
  './js/areas.js',
  './js/activities.js',
  './js/announcements.js',
  './js/profile.js',
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