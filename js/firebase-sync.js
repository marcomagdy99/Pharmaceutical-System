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
  let isSalesListening = false;
  let isLocalSalesPushInProgress = false;
  let salesPushDebounceTimer = null;
  let lastCloudSalesTimestamp = 0;

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

  function hasToastBeenShown(notifId) {
    try {
      const raw = sessionStorage.getItem("pharma_shown_notif_toasts");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.includes(String(notifId))) return true;
      }
    } catch (e) {}
    return false;
  }

  function markToastShown(notifId) {
    try {
      const raw = sessionStorage.getItem("pharma_shown_notif_toasts");
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr) && !arr.includes(String(notifId))) {
        arr.push(String(notifId));
        sessionStorage.setItem("pharma_shown_notif_toasts", JSON.stringify(arr));
      }
    } catch (e) {}
  }

  // Deep entity merger from Cloud into local window.DEMO_DATA
  function mergeCloudIntoLocal(cloudData, isInitialSync = false) {
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
      "territoryHistory",
      "importBatches",
      "pharmacyOverrides",
      "notifications"
    ];

    arrayCollections.forEach((collKey) => {
      if (Array.isArray(cloudData[collKey])) {
        if (!Array.isArray(window.DEMO_DATA[collKey])) {
          window.DEMO_DATA[collKey] = [];
        }
        const isMock = (it) => {
          if (!it || !it.id) return false;
          const id = String(it.id).trim();
          if (collKey === "doctors" && /^d\d+$/i.test(id)) return true;
          if (collKey === "pharmacies" && /^ph\d+$/i.test(id)) return true;
          if (collKey === "hospitals" && /^h\d+$/i.test(id)) return true;
          if (collKey === "visits" && (/^v\d+$/i.test(id) || /^today_v\d+$/i.test(id))) return true;
          if (collKey === "sales" && (/^s\d+$/i.test(id) || /^ds_s\d+$/i.test(id))) return true;
          if (collKey === "leaves" && /^l\d+$/i.test(id)) return true;
          return false;
        };

        // Filter local list of any legacy mock records
        window.DEMO_DATA[collKey] = window.DEMO_DATA[collKey].filter((it) => !isMock(it));
        const localList = window.DEMO_DATA[collKey];

        const newIncomingNotifs = [];

        // Merge or append real items by ID (or email for users)
        cloudData[collKey].forEach((cloudItem) => {
          if (!cloudItem || isMock(cloudItem)) return;
          if (collKey === "notifications") {
            if (cloudItem.titleEn) cloudItem.title = cloudItem.titleEn;
            if (cloudItem.messageEn) cloudItem.message = cloudItem.messageEn;
          }
          const itemId = cloudItem.id;
          if (itemId) {
            const localIdx = localList.findIndex((it) => {
              if (!it) return false;
              if (it.id === itemId) return true;
              if (collKey === "users") {
                const itEmail = (it.email || "").toLowerCase().trim();
                const cloudEmail = (cloudItem.email || "").toLowerCase().trim();
                if (itEmail && cloudEmail && itEmail === cloudEmail) return true;
              }
              return false;
            });
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
              if (collKey === "notifications") {
                newIncomingNotifs.push(cloudItem);
              }
            }
          }
        });

        // Ensure notifications are sorted newest first
        if (collKey === "notifications" && Array.isArray(window.DEMO_DATA.notifications)) {
          window.DEMO_DATA.notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          // Toast prompt strictly for live newly arrived notifications (never on initial page load / navigation)
          const authUser = (window.checkAuth ? window.checkAuth() : null) || (window.DEMO_DATA && window.DEMO_DATA.currentUser);
          const currentUid = authUser ? authUser.id : null;
          if (!isInitialSync && currentUid && newIncomingNotifs.length > 0 && typeof window.showToast === "function") {
            newIncomingNotifs.forEach((n) => {
              const nId = String(n.id || "");
              if ((n.userId === currentUid || n.userId === "all") && !n.read && !hasToastBeenShown(nId)) {
                markToastShown(nId);
                window.showToast(`🔔 ${n.title || n.message || "New Notification"}`, "info");
              }
            });
          }
        }

        // Ensure users list is strictly unique by email and ID
        if (collKey === "users") {
          const seenIds = new Set();
          const seenEmails = new Set();
          window.DEMO_DATA.users = localList.filter((u) => {
            if (!u) return false;
            const idKey = String(u.id);
            const emailKey = (u.email || "").toLowerCase().trim();
            if (seenIds.has(idKey) || (emailKey && seenEmails.has(emailKey))) {
              hasChanges = true;
              return false;
            }
            seenIds.add(idKey);
            if (emailKey) seenEmails.add(emailKey);
            return true;
          });
        }

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
      try {
        localStorage.setItem("pharma_company_settings", JSON.stringify(window.DEMO_DATA.companySettings));
      } catch (e) {}
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


  // Trigger distributor & sales specific views
  function notifyDistributorViews() {
    if (typeof window.renderImportBatches === "function") {
      try { window.renderImportBatches(); } catch (e) {}
    }
    if (typeof window.renderPendingAreas === "function") {
      try { window.renderPendingAreas(); } catch (e) {}
    }
    if (typeof window.renderPendingProducts === "function") {
      try { window.renderPendingProducts(); } catch (e) {}
    }
    if (typeof window.renderMappedAliases === "function") {
      try { window.renderMappedAliases(); } catch (e) {}
    }
    if (typeof window.renderDistributors === "function") {
      try { window.renderDistributors(); } catch (e) {}
    }
    if (typeof window.updateStats === "function") {
      try { window.updateStats(); } catch (e) {}
    }
    if (typeof window.renderDashboard === "function") {
      try { window.renderDashboard(); } catch (e) {}
    }
    if (typeof window.renderSalesReport === "function") {
      try { window.renderSalesReport(); } catch (e) {}
    }
    if (typeof window.renderAchievementsReport === "function") {
      try { window.renderAchievementsReport(); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("pharma:storage:synced", {
      detail: { key: "pharma_sales_data", source: "cloud" }
    }));
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

    // 6b. Distributor & Sales views
    notifyDistributorViews();

    // 6c. Apply branding settings if on login page or any branded view
    if (typeof window.applyBrandSettings === "function") {
      try {
        window.applyBrandSettings();
      } catch (e) {
        console.warn("[FirebaseSync] applyBrandSettings error:", e);
      }
    }

    // 6d. Realtime Notification UI
    if (typeof window.updateWorkflowNotifUI === "function") {
      try {
        window.updateWorkflowNotifUI();
      } catch (e) {
        console.warn("[FirebaseSync] updateWorkflowNotifUI error:", e);
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


  // Push distributor sales data to its own dedicated Firestore document
  async function pushSalesToCloud(immediate = false) {
    if (window._suppressCloudPush) return;
    if (!db) {
      db = initFirestore();
      if (!db) return;
    }
    if (!window.DEMO_DATA) return;

    clearTimeout(salesPushDebounceTimer);

    const executeSalesPush = async () => {
      try {
        isLocalSalesPushInProgress = true;
        updateSyncStatusUI("syncing");

        const sales = window.DEMO_DATA.distributorSales || [];
        const payloadString = JSON.stringify(sales);

        await db.collection("app_state").doc("distributor_sales").set({
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAtMs: Date.now(),
          rowCount: sales.length,
          payload: payloadString
        }, { merge: true });

        lastCloudSalesTimestamp = Date.now();
        console.log(`[FirebaseSync] Pushed ${sales.length} distributor sales records to Cloud Firestore.`);
        updateSyncStatusUI("synced");
      } catch (err) {
        console.error("[FirebaseSync] Error syncing sales to Firestore:", err);
        updateSyncStatusUI("error");
      } finally {
        setTimeout(() => {
          isLocalSalesPushInProgress = false;
        }, 300);
      }
    };

    if (immediate) {
      await executeSalesPush();
    } else {
      salesPushDebounceTimer = setTimeout(executeSalesPush, 400);
    }
  }

  // Realtime listener for distributor sales sheets
  function startSalesCloudListener() {
    if (isSalesListening || !db) return;
    isSalesListening = true;

    try {
      db.collection("app_state").doc("distributor_sales").onSnapshot((snapshot) => {
        if (!snapshot.exists) {
          // If cloud has no sales yet, but local laptop has sales, push local to cloud!
          if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.distributorSales) && window.DEMO_DATA.distributorSales.length > 0) {
            console.info("[FirebaseSync] Cloud distributor_sales empty. Pushing local sales to cloud...");
            pushSalesToCloud(true);
          }
          return;
        }

        if (isLocalSalesPushInProgress) return;

        const data = snapshot.data();
        if (!data || !data.payload) return;

        const cloudMs = data.updatedAtMs || 0;
        if (cloudMs > 0 && cloudMs <= lastCloudSalesTimestamp) {
          return;
        }
        lastCloudSalesTimestamp = cloudMs;

        try {
          let parsed = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
          if (Array.isArray(parsed)) {
            parsed = parsed.filter((s) => s && s.id && !s.id.startsWith("ds_s"));
            if (!window.DEMO_DATA) window.DEMO_DATA = {};
            const localCount = (window.DEMO_DATA.distributorSales || []).length;

            if (parsed.length === 0 && localCount > 0) {
              console.info("[FirebaseSync] Local sales exist but cloud is empty. Uploading local sales to cloud...");
              pushSalesToCloud(true);
              return;
            }

            if (JSON.stringify(window.DEMO_DATA.distributorSales) !== JSON.stringify(parsed)) {
              window.DEMO_DATA.distributorSales = parsed;
              localStorage.setItem("pharma_sales_data", JSON.stringify(parsed));
              console.log(`[FirebaseSync] Synced ${parsed.length} distributor sales rows from Cloud (was ${localCount}).`);
              updateSyncStatusUI("synced");
              notifyDistributorViews();
            }
          }
        } catch (err) {
          console.warn("[FirebaseSync] Failed to parse cloud sales payload:", err);
        }
      }, (error) => {
        console.warn("[FirebaseSync] Sales listener warning:", error);
      });
    } catch (err) {
      console.warn("[FirebaseSync] Sales listener setup error:", err);
    }
  }

  // Start Realtime Listener from Cloud Firestore
  function startCloudListener() {
    if (isListening || !db) return;
    isListening = true;
    let isInitialSnapshot = true;

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
            const hasNewChanges = mergeCloudIntoLocal(parsed, isInitialSnapshot);
            isInitialSnapshot = false;

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

    if (state === "syncing") {
      el.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #0d6efd; font-size: 0.75rem; font-weight: 600;">
        <span class="spinner-border spinner-border-sm" style="width: 10px; height: 10px;" role="status"></span>
        Syncing...
      </span>`;
    } else if (state === "synced") {
      el.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-size: 0.75rem; font-weight: 600;" title="Realtime Cloud Sync Active">
        <span style="font-size: 0.7rem;">●</span> Cloud Live
      </span>`;
    } else if (state === "error" || state === "offline") {
      el.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px; color: #f59e0b; font-size: 0.75rem; font-weight: 600;" title="Offline Mode Active">
        <span style="font-size: 0.7rem;">○</span> Local Offline
      </span>`;
    }
  }

  // Pull from cloud (startup or manual button trigger)
  async function fetchCloudInitial(isManual = false) {
    if (!db) {
      db = initFirestore();
      if (!db) {
        if (isManual && typeof window.showToast === "function") {
          window.showToast("Unable to connect to Firebase. Check internet connection.", "error");
        }
        return;
      }
    }

    const syncBtnIcon = document.getElementById("syncCloudIcon");
    if (syncBtnIcon) {
      syncBtnIcon.classList.add("fa-spin");
    }

    if (isManual && typeof window.showToast === "function") {
      window.showToast("Syncing with cloud...", "info");
    }

    try {
      updateSyncStatusUI("syncing");
      const doc = await db.collection("app_state").doc("master_data").get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.payload) {
          const parsed = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
          if (parsed && typeof parsed === "object") {
            const hasNewChanges = mergeCloudIntoLocal(parsed, true);
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
              window.showToast(`Synced successfully! Total users: ${count}`, "success");
            }
          }
        }
      } else {
        if (isManual && typeof window.showToast === "function") {
          window.showToast("No cloud data found yet.", "warning");
        }
      }

      // Also fetch distributor sales from Cloud
      try {
        const salesDoc = await db.collection("app_state").doc("distributor_sales").get();
        if (salesDoc.exists) {
          const sData = salesDoc.data();
          if (sData && sData.payload) {
            let parsedSales = typeof sData.payload === "string" ? JSON.parse(sData.payload) : sData.payload;
            if (Array.isArray(parsedSales)) {
              parsedSales = parsedSales.filter((s) => s && s.id && !s.id.startsWith("ds_s"));
              if (!window.DEMO_DATA) window.DEMO_DATA = {};
              const currentLocalSales = (window.DEMO_DATA.distributorSales || []).filter((s) => s && s.id && !s.id.startsWith("ds_s"));
              window.DEMO_DATA.distributorSales = parsedSales.length > 0 ? parsedSales : currentLocalSales;
              localStorage.setItem("pharma_sales_data", JSON.stringify(window.DEMO_DATA.distributorSales));
              if (parsedSales.length > 0) {
                lastCloudSalesTimestamp = sData.updatedAtMs || Date.now();
                console.log(`[FirebaseSync] Loaded ${parsedSales.length} distributor sales records from Cloud.`);
                notifyDistributorViews();
              } else if (currentLocalSales.length > 0) {
                pushSalesToCloud(true);
              }
            }
          }
        } else {
          // Cloud distributor_sales doc doesn't exist yet: push local sales if we have any
          if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.distributorSales)) {
            window.DEMO_DATA.distributorSales = window.DEMO_DATA.distributorSales.filter((s) => s && s.id && !s.id.startsWith("ds_s"));
            if (window.DEMO_DATA.distributorSales.length > 0) {
              console.info("[FirebaseSync] Pushing local sales to cloud...");
              pushSalesToCloud(true);
            }
          }
        }
      } catch (salesErr) {
        console.warn("[FirebaseSync] Error fetching distributor_sales in fetchCloudInitial:", salesErr);
      }
    } catch (err) {
      console.warn("[FirebaseSync] Fetch error:", err);
      updateSyncStatusUI("offline");
      if (isManual && typeof window.showToast === "function") {
        window.showToast("Error occurred during cloud sync.", "error");
      }
    } finally {
      if (syncBtnIcon) {
        syncBtnIcon.classList.remove("fa-spin");
      }
    }
  }

  // Hook into global scope
  window.pushLocalToCloud = pushLocalToCloud;
  window.pushSalesToCloud = pushSalesToCloud;
  window.syncFromCloudNow = fetchCloudInitial;

  // Initialize on load
  function init() {
    db = initFirestore();
    if (db) {
      fetchCloudInitial(false);
      startCloudListener();
      startSalesCloudListener();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
