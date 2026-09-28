/**
 * @file firebase-sync.js
 * @description Cloud Firestore Realtime Synchronization for PharmaCare.
 * Keeps all devices (Mobile, Tablet, Desktop) synchronized in real-time,
 * while maintaining instantaneous local-first offline availability.
 */

(function () {
  "use strict";

  let db = null;
  let isListening = false;
  let isLocalPushInProgress = false;
  let pushDebounceTimer = null;
  let lastCloudTimestamp = 0;

  // Initialize Firebase & Firestore directly (No conflicting IndexedDB persistence layer)
  function initFirestore() {
    if (typeof firebase === "undefined") {
      console.warn("[FirebaseSync] Firebase SDK not loaded yet.");
      return null;
    }
    if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
      console.warn("[FirebaseSync] Missing firebaseConfig.");
      return null;
    }

    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
      }
      db = firebase.firestore();
      window.db = db;
      return db;
    } catch (err) {
      console.error("[FirebaseSync] Initialization error:", err);
      return null;
    }
  }

  // Deep entity merger from Cloud into local window.DEMO_DATA
  function mergeCloudIntoLocal(cloudData) {
    if (!window.DEMO_DATA || !cloudData) return false;
    let hasChanges = false;

    // List of collection arrays to sync
    const arrayCollections = [
      "users",
      "doctors",
      "hospitals",
      "pharmacies",
      "visits",
      "leaves",
      "sales",
      "announcements",
      "quizzes",
      "areas",
      "productLines",
      "distributors",
      "territoryHistory"
    ];

    arrayCollections.forEach((collKey) => {
      if (Array.isArray(cloudData[collKey])) {
        if (!Array.isArray(window.DEMO_DATA[collKey])) {
          window.DEMO_DATA[collKey] = [];
        }
        const localList = window.DEMO_DATA[collKey];

        // Merge or append items by ID
        cloudData[collKey].forEach((cloudItem) => {
          if (!cloudItem) return;
          const itemId = cloudItem.id;
          if (itemId) {
            const localIdx = localList.findIndex((it) => it && it.id === itemId);
            if (localIdx >= 0) {
              const localStr = JSON.stringify(localList[localIdx]);
              const cloudStr = JSON.stringify(cloudItem);
              if (localStr !== cloudStr) {
                localList[localIdx] = Object.assign({}, localList[localIdx], cloudItem);
                hasChanges = true;
              }
            } else {
              localList.push(cloudItem);
              hasChanges = true;
            }
          }
        });

        // If cloud collection has more items than local, mark changes
        if (cloudData[collKey].length > localList.length) {
          hasChanges = true;
        }
      }
    });

    // Object singletons (e.g. companySettings)
    if (cloudData.companySettings && typeof cloudData.companySettings === "object") {
      const curSettingsStr = JSON.stringify(window.DEMO_DATA.companySettings || {});
      const newSettingsStr = JSON.stringify(cloudData.companySettings);
      if (curSettingsStr !== newSettingsStr) {
        window.DEMO_DATA.companySettings = Object.assign(
          {},
          window.DEMO_DATA.companySettings || {},
          cloudData.companySettings
        );
        hasChanges = true;
      }
    }

    return hasChanges;
  }

  // Push local state to Firestore
  async function pushLocalToCloud(immediate = false) {
    if (window._suppressCloudPush) return;
    if (!db) {
      db = initFirestore();
      if (!db) return;
    }
    if (!window.DEMO_DATA) return;

    clearTimeout(pushDebounceTimer);

    const executePush = async () => {
      try {
        isLocalPushInProgress = true;
        updateSyncStatusUI("syncing");

        const { distributorSales, ...cleanMasterData } = window.DEMO_DATA;
        const payloadString = JSON.stringify(cleanMasterData);

        await db.collection("app_state").doc("master_data").set({
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAtMs: Date.now(),
          updatedBy: (window.currentUser && (window.currentUser.email || window.currentUser.id)) || "system",
          payload: payloadString
        }, { merge: true });

        lastCloudTimestamp = Date.now();
        console.log("[FirebaseSync] Master data successfully synced to Cloud Firestore.");
        updateSyncStatusUI("synced");
      } catch (err) {
        console.error("[FirebaseSync] Error syncing to Firestore:", err);
        updateSyncStatusUI("error");
      } finally {
        setTimeout(() => {
          isLocalPushInProgress = false;
        }, 300);
      }
    };

    if (immediate) {
      await executePush();
    } else {
      pushDebounceTimer = setTimeout(executePush, 350);
    }
  }

  // Trigger UI updates across known view components
  function notifyActiveViews(parsedData) {
    // 1. User Management view
    if (window.userMgmt && typeof window.userMgmt.render === "function") {
      try {
        window.userMgmt.render();
      } catch (e) {
        console.warn("[FirebaseSync] userMgmt.render error:", e);
      }
    }

    // 2. Visits Manager view
    if (window.visitsManager && typeof window.visitsManager.render === "function") {
      try {
        window.visitsManager.render();
      } catch (e) {
        console.warn("[FirebaseSync] visitsManager.render error:", e);
      }
    }

    // 3. Areas view
    if (window.areaMgmt && typeof window.areaMgmt.render === "function") {
      try {
        window.areaMgmt.render();
      } catch (e) {
        console.warn("[FirebaseSync] areaMgmt.render error:", e);
      }
    }

    // 4. Products view
    if (window.productMgmt && typeof window.productMgmt.render === "function") {
      try {
        window.productMgmt.render();
      } catch (e) {
        console.warn("[FirebaseSync] productMgmt.render error:", e);
      }
    }

    // 5. Dashboard view
    if (typeof window.renderDashboard === "function") {
      try {
        window.renderDashboard();
      } catch (e) {
        console.warn("[FirebaseSync] renderDashboard error:", e);
      }
    }

    // 6. Topbar
    if (typeof window.renderTopbar === "function") {
      try {
        window.renderTopbar();
      } catch (e) {
        console.warn("[FirebaseSync] renderTopbar error:", e);
      }
    }

    // 7. General event bus
    document.dispatchEvent(new CustomEvent("pharma:storage:synced", {
      detail: { key: "pharma_master_data", source: "cloud" }
    }));
    document.dispatchEvent(new CustomEvent("pharma:store:changed", {
      detail: { entity: "all", action: "cloud_sync", payload: parsedData }
    }));
  }

  // Start Realtime Listener from Cloud Firestore
  function startCloudListener() {
    if (isListening || !db) return;
    isListening = true;

    try {
      db.collection("app_state").doc("master_data").onSnapshot((snapshot) => {
        if (!snapshot.exists) {
          console.info("[FirebaseSync] Cloud master_data not found. Initializing seed upload...");
          if (window.DEMO_DATA) {
            pushLocalToCloud(true);
          }
          return;
        }

        // If this update was triggered by our own push, ignore to prevent echo loops
        if (isLocalPushInProgress) return;

        const data = snapshot.data();
        if (!data || !data.payload) return;

        const cloudMs = data.updatedAtMs || 0;
        if (cloudMs > 0 && cloudMs <= lastCloudTimestamp) {
          // Already have this version or newer
          return;
        }
        lastCloudTimestamp = cloudMs;

        try {
          const parsed = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
          if (parsed && typeof parsed === "object") {
            const hasNewChanges = mergeCloudIntoLocal(parsed);

            if (hasNewChanges) {
              console.log("[FirebaseSync] Received realtime updates from Cloud Firestore.");
              updateSyncStatusUI("synced");

              // Save locally to keep localStorage in sync without triggering an outgoing cloud push
              if (typeof window.saveDataToStorage === "function") {
                window._suppressCloudPush = true;
                window.saveDataToStorage();
                window._suppressCloudPush = false;
              }

              notifyActiveViews(parsed);
            }
          }
        } catch (err) {
          console.warn("[FirebaseSync] Failed to parse cloud payload:", err);
        }
      }, (error) => {
        console.warn("[FirebaseSync] Firestore snapshot listener warning:", error);
        updateSyncStatusUI("offline");
      });
    } catch (err) {
      console.warn("[FirebaseSync] Listener setup error:", err);
    }
  }

  // Visual Sync Status in Topbar
  function updateSyncStatusUI(state) {
    const el = document.getElementById("cloudSyncStatus");
    if (!el) return;

    const isAr = window.getCurrentLang && window.getCurrentLang() === "ar";
    if (state === "syncing") {
      el.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #0d6efd; font-size: 0.75rem; font-weight: 600;">
        <span class="spinner-border spinner-border-sm" style="width: 10px; height: 10px;" role="status"></span>
        ${isAr ? "مزامنة..." : "Syncing..."}
      </span>`;
    } else if (state === "synced") {
      el.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-size: 0.75rem; font-weight: 600;" title="Realtime Cloud Sync Active">
        <span style="font-size: 0.7rem;">●</span> ${isAr ? "سحابي مباشر" : "Cloud Live"}
      </span>`;
    } else if (state === "error" || state === "offline") {
      el.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #f59e0b; font-size: 0.75rem; font-weight: 600;" title="Offline Mode Active">
        <span style="font-size: 0.7rem;">○</span> ${isAr ? "محلي (أوفلاين)" : "Local Offline"}
      </span>`;
    }
  }

  // Pull from cloud (startup or manual button trigger)
  async function fetchCloudInitial(isManual = false) {
    if (!db) {
      db = initFirestore();
      if (!db) {
        if (isManual && typeof window.showToast === "function") {
          window.showToast(
            window.getCurrentLang && window.getCurrentLang() === "ar"
              ? "تعذر الاتصال بـ Firebase Firestore. تحقق من اتصال الإنترنت."
              : "Unable to connect to Firebase. Check internet connection.",
            "error"
          );
        }
        return;
      }
    }

    const syncBtnIcon = document.getElementById("syncCloudIcon");
    if (syncBtnIcon) {
      syncBtnIcon.classList.add("fa-spin");
    }

    if (isManual && typeof window.showToast === "function") {
      window.showToast(
        window.getCurrentLang && window.getCurrentLang() === "ar"
          ? "جاري المزامنة مع السحابة..."
          : "Syncing with cloud...",
        "info"
      );
    }

    try {
      updateSyncStatusUI("syncing");
      const doc = await db.collection("app_state").doc("master_data").get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.payload) {
          const parsed = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
          if (parsed && typeof parsed === "object") {
            const hasNewChanges = mergeCloudIntoLocal(parsed);
            lastCloudTimestamp = data.updatedAtMs || Date.now();

            // Always persist and notify if manual or if has new changes
            if (hasNewChanges || isManual) {
              if (typeof window.saveDataToStorage === "function") {
                window._suppressCloudPush = true;
                window.saveDataToStorage();
                window._suppressCloudPush = false;
              }
              notifyActiveViews(parsed);
            }

            updateSyncStatusUI("synced");

            if (isManual && typeof window.showToast === "function") {
              const count = window.DEMO_DATA && window.DEMO_DATA.users ? window.DEMO_DATA.users.length : 0;
              window.showToast(
                window.getCurrentLang && window.getCurrentLang() === "ar"
                  ? `تمت المزامنة بنجاح! إجمالي المستخدمين: ${count}`
                  : `Synced successfully! Total users: ${count}`,
                "success"
              );
            }
          }
        }
      } else {
        if (isManual && typeof window.showToast === "function") {
          window.showToast(
            window.getCurrentLang && window.getCurrentLang() === "ar"
              ? "لم يتم العثور على بيانات سحابية بعد."
              : "No cloud data found yet.",
            "warning"
          );
        }
      }
    } catch (err) {
      console.warn("[FirebaseSync] Fetch error:", err);
      updateSyncStatusUI("offline");
      if (isManual && typeof window.showToast === "function") {
        window.showToast(
          window.getCurrentLang && window.getCurrentLang() === "ar"
            ? "حدث خطأ أثناء المزامنة السحابية."
            : "Error occurred during cloud sync.",
          "error"
        );
      }
    } finally {
      if (syncBtnIcon) {
        syncBtnIcon.classList.remove("fa-spin");
      }
    }
  }

  // Hook into global scope
  window.pushLocalToCloud = pushLocalToCloud;
  window.syncFromCloudNow = fetchCloudInitial;

  // Initialize on load
  function init() {
    db = initFirestore();
    if (db) {
      fetchCloudInitial(false);
      startCloudListener();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
