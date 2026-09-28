/**
 * @file sw.js
 * @description Service Worker for PharmaCare PWA offline caching and reliable field performance.
 */

const CACHE_VERSION = 'v69';
const CACHE_NAME = `pharmacare-${CACHE_VERSION}`;
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
  './distributors.html',
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
  './css/products.css',
  './js/firebase-config.js',
  './js/app.js',
  './js/store.js',
  './js/login.js',
  './js/dashboard.js',
  './js/visits.js',
  './js/reschedule.js',
  './js/excel-templates-data.js',
  './js/chart.umd.min.js',
  './js/interactive-charts.js',
  './js/shared-report.js',
  './js/sales-report.js',
  './js/achievements-report.js',
  './js/timeline-report.js',
  './js/coverage-report.js',
  './js/doctors-report.js',
  './js/hospitals-report.js',
  './js/pharmacies-report.js',
  './js/distributors.js',
  './js/calendar.js',
  './js/plans-review.js',
  './js/products.js',
  './js/leaves.js',
  './js/quizzes.js',
  './js/users.js',
  './js/areas.js',
  './js/activities-core.js',
  './js/activities-tab-daily.js',
  './js/activities-tab-expenses.js',
  './js/activities-tab-services.js',
  './js/activities-tab-budget.js',
  './js/activities-decisions.js',
  './js/activities-init.js',
  './js/announcements.js',
  './js/profile.js',
  './manifest.json',
  // Essential External CDN Libraries for complete offline UI/functionality
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use resilient per-asset caching so individual CDN timeouts do not abort whole installation
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`PharmaCare SW: Non-critical pre-cache skipped for ${url}:`, err);
          })
        )
      );
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

  const reqUrl = event.request.url || '';
  if (reqUrl.includes('?v=')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, but update cache in background (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Not in cache yet: fetch from network and dynamically cache valid/opaque GET responses
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});
