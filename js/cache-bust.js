/**
 * @file cache-bust.js
 * @description Centralized Mobile Cache Invalidation & Service Worker reload helper.
 * Cleans obsolete runtime caches and forces controller refresh upon version increment.
 */

window.forceClearCacheAndReload = async function () {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        await r.unregister();
      }
    }
  } catch (e) {}
  window.location.reload(true);
};

(function () {
  var EXPECTED_SW = "v234";
  var FLAG = "pharmacare_sw_cleared_" + EXPECTED_SW;
  try {
    if (localStorage.getItem(FLAG) !== "1") {
      if ("caches" in window) {
        caches.keys().then(function (names) {
          return Promise.all(
            names.map(function (n) {
              return caches.delete(n);
            })
          );
        }).then(function () {
          localStorage.setItem(FLAG, "1");
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      } else {
        localStorage.setItem(FLAG, "1");
      }
    }
  } catch (e) {}
})();
