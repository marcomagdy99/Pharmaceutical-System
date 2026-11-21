/**
 * @file cache-bust.js
 * @description Centralized Mobile Cache Invalidation & Service Worker reload helper.
 * Cleans obsolete runtime caches and forces controller refresh upon version increment.
 */

(function () {
  "use strict";

  var FALLBACK_SW_VERSION = "v321";
  var VERSION_STORAGE_KEY = "pharmacare_sw_cleared_version";
  var isClearing = false;

  function detectExpectedVersion() {
    try {
      var scriptEl = typeof document !== "undefined" ? document.currentScript : null;
      if (!scriptEl && typeof document !== "undefined" && typeof document.querySelector === "function") {
        scriptEl = document.querySelector('script[src*="cache-bust.js"]');
      }
      var src = scriptEl && scriptEl.getAttribute ? scriptEl.getAttribute("src") : (scriptEl && scriptEl.src ? scriptEl.src : "");
      if (src) {
        var match = String(src).match(/[?&]v=([A-Za-z0-9._-]+)/);
        if (match && match[1]) return match[1];
      }
    } catch (e) {}
    return FALLBACK_SW_VERSION;
  }

  function cleanupLegacyFlags() {
    try {
      if (typeof localStorage === "undefined") return;
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf("pharmacare_sw_cleared_v") === 0) {
          toRemove.push(key);
        }
      }
      for (var j = 0; j < toRemove.length; j++) {
        localStorage.removeItem(toRemove[j]);
      }
    } catch (e) {}
  }

  window.forceClearCacheAndReload = async function () {
    if (isClearing) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      if (typeof window.showToast === "function") {
        window.showToast("Cannot refresh cache while offline. Please reconnect first.", "warning");
      }
      return;
    }
    isClearing = true;
    try {
      if ("caches" in window && window.caches && typeof window.caches.keys === "function") {
        var keys = await window.caches.keys();
        await Promise.all(keys.map(function (k) { return window.caches.delete(k); }));
      }
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker && typeof navigator.serviceWorker.getRegistrations === "function") {
        var regs = await navigator.serviceWorker.getRegistrations();
        for (var i = 0; i < regs.length; i++) {
          await regs[i].unregister();
        }
      }
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(VERSION_STORAGE_KEY);
        }
      } catch (e) {}
    } catch (e) {
      // Best-effort cleanup before reload
    } finally {
      isClearing = false;
    }
    if (window.location && typeof window.location.reload === "function") {
      window.location.reload();
    }
  };

  var expectedVersion = detectExpectedVersion();
  var expectedCacheName = "pharmacare-" + expectedVersion;
  var sessionReloadKey = "pharmacare_sw_reloaded_" + expectedVersion;

  // Never wipe caches or force reload when device is offline (preserves offline PWA)
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return;
  }

  try {
    cleanupLegacyFlags();
    var alreadyCleared = false;
    try {
      alreadyCleared = typeof localStorage !== "undefined" && localStorage.getItem(VERSION_STORAGE_KEY) === expectedVersion;
    } catch (e) {
      alreadyCleared = false;
    }
    if (alreadyCleared) return;

    if ("caches" in window && window.caches && typeof window.caches.keys === "function") {
      window.caches.keys().then(function (names) {
        var obsoleteNames = (Array.isArray(names) ? names : []).filter(function (n) {
          return n !== expectedCacheName;
        });
        return Promise.all(
          obsoleteNames.map(function (n) {
            return window.caches.delete(n).catch(function () { return false; });
          })
        ).then(function (results) {
          var deletedCount = results.filter(Boolean).length;
          var persistedFlag = false;
          try {
            if (typeof localStorage !== "undefined") {
              localStorage.setItem(VERSION_STORAGE_KEY, expectedVersion);
              persistedFlag = localStorage.getItem(VERSION_STORAGE_KEY) === expectedVersion;
            }
          } catch (e) {}

          var alreadyReloadedThisSession = false;
          var sessionGuardPersisted = false;
          try {
            if (typeof sessionStorage !== "undefined") {
              alreadyReloadedThisSession = sessionStorage.getItem(sessionReloadKey) === "1";
              if (!alreadyReloadedThisSession) {
                sessionStorage.setItem(sessionReloadKey, "1");
                sessionGuardPersisted = sessionStorage.getItem(sessionReloadKey) === "1";
              }
            }
          } catch (e) {}

          // Only reload when obsolete caches were actually purged, SW controls the page,
          // and at least one reload-loop guard was persisted safely.
          if (
            deletedCount > 0 &&
            !alreadyReloadedThisSession &&
            (persistedFlag || sessionGuardPersisted) &&
            typeof navigator !== "undefined" &&
            navigator.serviceWorker &&
            navigator.serviceWorker.controller &&
            window.location &&
            typeof window.location.reload === "function"
          ) {
            window.location.reload();
          }
        });
      }).catch(function () {});
    } else {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(VERSION_STORAGE_KEY, expectedVersion);
        }
      } catch (e) {}
    }
  } catch (e) {}
})();
