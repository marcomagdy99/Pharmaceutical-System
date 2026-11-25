/**
 * @file activities-init.js
 * @description Orchestrator & Initialization: Navigation, Lifecycle Events, Responsive Facade & Global Aliases
 */

(function (window) {
  "use strict";

  const Core = window.ActivitiesCore;
  if (!Core) return;

  function setupRoleTabVisibility() {
    Core._state.currentUser = Core.getAuthUser();
    const user = Core._state.currentUser;
    const role = Core.getNormalizedRole ? Core.getNormalizedRole(user) : ((user && user.role) ? user.role.toLowerCase() : "");
    const tabBtnBudget = document.getElementById("tabBtnBudget");
    const tabBtnServices = document.getElementById("tabBtnServices");
    const lmDistSec = document.getElementById("lmDistributionSection");
    const dmDistSec = document.getElementById("dmDistributionSection");

    if (role === Core.ROLES.BU || role === Core.ROLES.GM || role === Core.ROLES.ADMIN) {
      if (tabBtnBudget) tabBtnBudget.style.display = "inline-flex";
      if (tabBtnServices) tabBtnServices.style.display = "inline-flex";
    } else {
      if (tabBtnBudget) tabBtnBudget.style.display = "none";
      if (tabBtnServices) tabBtnServices.style.display = "inline-flex";
      if (role === Core.ROLES.LM && lmDistSec) {
        lmDistSec.style.display = "block";
      } else if (lmDistSec) {
        lmDistSec.style.display = "none";
      }
      if (role === Core.ROLES.DM && dmDistSec) {
        dmDistSec.style.display = "block";
      } else if (dmDistSec) {
        dmDistSec.style.display = "none";
      }
    }

    if (role !== Core.ROLES.LM && lmDistSec) {
      lmDistSec.style.display = "none";
    }
    if (role !== Core.ROLES.DM && dmDistSec) {
      dmDistSec.style.display = "none";
    }
  }

  function switchTab(tabId) {
    const user = Core._state.currentUser || Core.getAuthUser();
    const role = Core.getNormalizedRole ? Core.getNormalizedRole(user) : ((user && user.role) ? user.role.toLowerCase() : "");
    if (tabId === Core.TABS.BUDGET && role !== Core.ROLES.BU && role !== Core.ROLES.GM && role !== Core.ROLES.ADMIN) {
      Core.safeShowToast(Core.t("unauthorizedBudgetAction") || "Unauthorized", "danger");
      return;
    }
    Core._state.activeTab = tabId;
    document.querySelectorAll(".requests-tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".requests-tab-pane").forEach((pane) => pane.classList.remove("active"));

    if (tabId === Core.TABS.ACTIVITIES) {
      document.getElementById("tabBtnActivities")?.classList.add("active");
      document.getElementById("pane-activities")?.classList.add("active");
      window.ActivitiesDaily?.renderActivitiesView?.();
    } else if (tabId === Core.TABS.EXPENSES) {
      document.getElementById("tabBtnExpenses")?.classList.add("active");
      document.getElementById("pane-expenses")?.classList.add("active");
      window.ActivitiesExpenses?.renderExpensesTab?.();
    } else if (tabId === Core.TABS.SERVICES) {
      document.getElementById("tabBtnServices")?.classList.add("active");
      document.getElementById("pane-services")?.classList.add("active");
      window.ActivitiesServices?.renderServicesTab?.();
    } else if (tabId === Core.TABS.BUDGET) {
      document.getElementById("tabBtnBudget")?.classList.add("active");
      document.getElementById("pane-budget")?.classList.add("active");
      window.ActivitiesBudget?.renderBudgetTab?.();
    } else if (tabId === "tab-locations") {
      document.getElementById("tabBtnLocationRequests")?.classList.add("active");
      document.getElementById("pane-locations")?.classList.add("active");
      renderLocationRequestsTable();
    }
  }

  function renderLocationRequestsTable() {
    const tbody = document.getElementById("locationRequestsTableBody");
    if (!tbody) return;
    const requests = (window.store && window.store.accountLocationRequests)
      ? window.store.accountLocationRequests.getAll()
      : [];
    const currentUser = Core.getAuthUser() || {};
    const role = Core.getNormalizedRole ? Core.getNormalizedRole(currentUser) : (currentUser.role || "").toLowerCase();

    // Row filtering: Only show requests within user's scope (strict hierarchy scoping for GM, BU, LM, DM)
    const visibleRequests = requests.filter((req) => {
      const targetRepId = req.repId || req.userId;
      if (role === "admin" || role === Core.ROLES.ADMIN) return true;
      if (role === "medical_rep" || role === "rep" || role === Core.ROLES.REP || role === Core.ROLES.REP_ALT) return targetRepId === currentUser.id;
      if (role === "district_manager" || role === "line_manager" || role === "business_unit" || role === "general_manager" || role === Core.ROLES.DM || role === Core.ROLES.LM || role === Core.ROLES.BU || role === Core.ROLES.GM) {
        return targetRepId === currentUser.id ||
               (role !== "general_manager" && role !== Core.ROLES.GM && typeof window.canApproveFor === "function" && window.canApproveFor(targetRepId)) ||
               (typeof Core.getSubordinatesForUser === "function" && Core.getSubordinatesForUser(currentUser).some(s => s.id === targetRepId));
      }
      return false;
    });

    if (!tbody.dataset.listenerBound) {
      tbody.dataset.listenerBound = "true";
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-loc-action]");
        if (btn) {
          const action = btn.dataset.locAction;
          const reqId = btn.dataset.locId;
          if (action === "approve" && reqId && typeof approveLocationReq === "function") {
            approveLocationReq(reqId);
          } else if (action === "reject" && reqId && typeof rejectLocationReq === "function") {
            rejectLocationReq(reqId);
          }
        }
      });
    }

    if (visibleRequests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No geographic location requests submitted yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = visibleRequests.map((req) => {
      const typeBadge = req.requestType === "relocation"
        ? `<span class="badge bg-warning text-dark">Relocation</span>`
        : `<span class="badge bg-info text-dark">Initial Pin</span>`;

      const st = req.status || "pending";
      const isPending = st !== "approved" && st !== "rejected";

      const statusBadge = window.renderStatusBadge ? window.renderStatusBadge(st) : `<span class="badge bg-warning text-dark">Pending</span>`;

      let canApproveStage = false;
      const targetRepId = req.repId || req.userId;
      const belongsToMyHierarchy = Boolean(targetRepId && typeof window.canApproveFor === "function" && window.canApproveFor(targetRepId));
      if (isPending && targetRepId !== currentUser.id && role !== "general_manager" && role !== Core.ROLES.GM && (role === "admin" || belongsToMyHierarchy)) {
        if (role === "admin") {
          canApproveStage = true;
        } else if (st === "pending" || st === "pending_dm") {
          canApproveStage = (role === "district_manager" || role === "line_manager" || role === "business_unit");
        } else if (st === "pending_lm") {
          canApproveStage = (role === "line_manager" || role === "business_unit");
        } else if (st === "pending_bu") {
          canApproveStage = (role === "business_unit");
        }
      }

      const latNum = Number(req.newLat);
      const lngNum = Number(req.newLng);
      const latStr = !isNaN(latNum) && req.newLat != null ? latNum.toFixed(5) : "-";
      const lngStr = !isNaN(lngNum) && req.newLng != null ? lngNum.toFixed(5) : "-";
      let locInfo = `<code>${latStr}, ${lngStr}</code>`;
      if (req.oldLat != null && req.oldLng != null) {
        const oldLatNum = Number(req.oldLat);
        const oldLngNum = Number(req.oldLng);
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(oldLatNum + ',' + oldLngNum)}&destination=${encodeURIComponent(latNum + ',' + lngNum)}`;
        locInfo += `<br><a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="small text-primary fw-bold">Compare on Map</a>`;
        if (req.distanceMeters) locInfo += ` <span class="badge bg-secondary">${Number(req.distanceMeters)}m</span>`;
      } else if (!isNaN(latNum) && !isNaN(lngNum)) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latNum + ',' + lngNum)}`;
        locInfo += `<br><a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="small text-primary fw-bold">View on Map</a>`;
      }

      let actionsHtml = "";
      if (isPending && canApproveStage) {
        actionsHtml = `
          <div class="location-actions-wrap">
            <button type="button" class="btn btn-sm btn-location-approve" data-loc-action="approve" data-loc-id="${Core.escapeHTML(req.id)}" title="Approve GPS Pin"><svg class="btn-svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Approve</button>
            <button type="button" class="btn btn-sm btn-location-reject" data-loc-action="reject" data-loc-id="${Core.escapeHTML(req.id)}" title="Reject GPS Pin"><svg class="btn-svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</button>
          </div>
        `;
      } else if (isPending) {
        const stageLabel = st.replace("pending_", "").toUpperCase() || "Manager";
        actionsHtml = `<small class="text-muted">Awaiting ${Core.escapeHTML(stageLabel)}</small>`;
      } else {
        actionsHtml = `<small class="text-muted">${Core.escapeHTML(req.decisionBy || "Manager")} - ${req.decisionAt ? Core.escapeHTML(req.decisionAt.slice(0, 10)) : ""}</small>`;
      }

      return `
        <tr>
          <td><strong>${Core.escapeHTML(req.targetName || "")}</strong></td>
          <td>${Core.escapeHTML(req.repName || "")}</td>
          <td>${typeBadge}</td>
          <td>${locInfo}</td>
          <td>${Core.escapeHTML(req.newAddress || req.reason || "-")}</td>
          <td>${statusBadge}</td>
          <td><small>${req.submittedAt ? Core.escapeHTML(req.submittedAt.slice(0, 16).replace("T", " ")) : "-"}</small></td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join("");
  }

  window.approveLocationReq = function(id) {
    if (window.ActivitiesDecisions && typeof window.ActivitiesDecisions.openDecisionModal === "function") {
      window.ActivitiesDecisions.openDecisionModal("location", id, "approve");
    }
  };

  window.rejectLocationReq = function(id) {
    if (window.ActivitiesDecisions && typeof window.ActivitiesDecisions.openDecisionModal === "function") {
      window.ActivitiesDecisions.openDecisionModal("location", id, "reject");
    }
  };

  function setupModalBackdropsAndShortcuts() {
    const modalClosers = [
      { id: "activityModal", close: () => window.ActivitiesDaily?.closeActivityModal?.() },
      { id: "expenseModal", close: () => window.ActivitiesExpenses?.closeExpenseModal?.() },
      { id: "serviceModal", close: () => window.ActivitiesServices?.closeServiceModal?.() },
      { id: "decisionModal", close: () => window.ActivitiesDecisions?.closeDecisionModal?.() },
      { id: "receiptPreviewModal", close: () => window.ActivitiesDecisions?.closeReceiptPreviewModal?.() },
      { id: "lmDetailModal", close: () => window.ActivitiesBudget?.closeLmDetailModal?.() },
    ];

    modalClosers.forEach(({ id, close }) => {
      const modal = document.getElementById(id);
      if (modal) {
        let isBackdropMousedown = false;
        modal.addEventListener("mousedown", (e) => {
          isBackdropMousedown = (e.target === modal);
        });
        modal.addEventListener("click", (e) => {
          if (e.target === modal && isBackdropMousedown) close();
          isBackdropMousedown = false;
        });
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (document.getElementById("receiptPreviewModal")?.style.display === "flex") {
          window.ActivitiesDecisions?.closeReceiptPreviewModal?.();
        } else if (document.getElementById("decisionModal")?.style.display === "flex") {
          window.ActivitiesDecisions?.closeDecisionModal?.();
        } else if (document.getElementById("lmDetailModal")?.style.display === "flex") {
          window.ActivitiesBudget?.closeLmDetailModal?.();
        } else if (document.getElementById("serviceModal")?.style.display === "flex") {
          window.ActivitiesServices?.closeServiceModal?.();
        } else if (document.getElementById("expenseModal")?.style.display === "flex") {
          window.ActivitiesExpenses?.closeExpenseModal?.();
        } else if (document.getElementById("activityModal")?.style.display === "flex") {
          window.ActivitiesDaily?.closeActivityModal?.();
        }
      }
    });
  }

  function setupDateNavigation() {
    document.getElementById("prevDayBtn")?.addEventListener("click", () => {
      Core._state.currentDate = Core.addDays(Core._state.currentDate, -1);
      window.ActivitiesDaily?.renderActivitiesView?.();
    });

    document.getElementById("nextDayBtn")?.addEventListener("click", () => {
      Core._state.currentDate = Core.addDays(Core._state.currentDate, 1);
      window.ActivitiesDaily?.renderActivitiesView?.();
    });

    document.getElementById("todayBtn")?.addEventListener("click", () => {
      Core._state.currentDate = (window.getSystemDate && window.getSystemDate()) || new Date();
      window.ActivitiesDaily?.renderActivitiesView?.();
    });
  }

  function init() {
    try {
      if (typeof requireAuth === "function") requireAuth();
      if (typeof renderTopbar === "function") renderTopbar();
      Core._state.currentUser = Core.getAuthUser();
    } catch (e) {
      console.warn("Auth/topbar initialization warning:", e);
    }

    // Defensive guarantee: Ensure all modals are strictly closed and hidden on startup
    ["activityModal", "expenseModal", "serviceModal", "decisionModal", "receiptPreviewModal", "lmDetailModal"].forEach((mId) => {
      const el = document.getElementById(mId);
      if (el) {
        el.style.display = "none";
        el.classList.remove("active");
      }
    });

    try {
      setupRoleTabVisibility();
    } catch (e) {
      console.warn("setupRoleTabVisibility warning:", e);
    }

    try {
      setupModalBackdropsAndShortcuts();
    } catch (e) {
      console.warn("setupModalBackdropsAndShortcuts warning:", e);
    }

    try {
      setupDateNavigation();
    } catch (e) {
      console.warn("setupDateNavigation warning:", e);
    }

    const initialHash = (window.location.hash || "").replace("#", "");
    if (initialHash === "locations" || initialHash === "tab-locations") {
      Core._state.activeTab = "tab-locations";
    }

    // Render active tab IMMEDIATELY so the view is painted without delay
    try {
      if (Core._state.activeTab === "tab-locations") {
        document.getElementById("tabBtnLocationRequests")?.classList.add("active");
        document.getElementById("pane-locations")?.classList.add("active");
        renderLocationRequestsTable();
      } else if (Core._state.activeTab === Core.TABS.ACTIVITIES) {
        window.ActivitiesDaily?.renderActivitiesView?.();
      } else if (Core._state.activeTab === Core.TABS.EXPENSES) {
        window.ActivitiesExpenses?.renderExpensesTab?.();
      } else if (Core._state.activeTab === Core.TABS.SERVICES) {
        window.ActivitiesServices?.renderServicesTab?.();
      } else if (Core._state.activeTab === Core.TABS.BUDGET) {
        window.ActivitiesBudget?.renderBudgetTab?.();
      }
    } catch (e) {
      console.error("Failed to render active tab view:", e);
    }

    // Pre-populate filter dropdowns across tabs defensively in the background
    try {
      window.ActivitiesExpenses?.populateExpenseFilters?.();
    } catch (e) {
      console.warn("populateExpenseFilters warning:", e);
    }

    try {
      window.ActivitiesServices?.populateServiceFilters?.();
      window.ActivitiesServices?.renderServicesBudgetStrip?.();
    } catch (e) {
      console.warn("populateServiceFilters warning:", e);
    }

// Startup initialization complete
  }

  // Reactive Wakeup: Listen for store changes across the app
  window.addEventListener("hashchange", () => {
    const h = (window.location.hash || "").replace("#", "").toLowerCase();
    if (h === "locations" || h === "tab-locations") {
      switchTab("tab-locations");
    } else if (h === "expenses" || h === "tab-expenses") {
      switchTab(Core.TABS.EXPENSES);
    } else if (h === "services" || h === "tab-services") {
      switchTab(Core.TABS.SERVICES);
    } else if (h === "budget" || h === "tab-budget") {
      switchTab(Core.TABS.BUDGET);
    } else if (h === "activities" || h === "tab-activities") {
      switchTab(Core.TABS.ACTIVITIES);
    }
  });

  document.addEventListener("pharma:store:changed", (e) => {
    const entity = e.detail?.entity;
    if (entity === "activities" && Core._state.activeTab === Core.TABS.ACTIVITIES) {
      window.ActivitiesDaily?.renderActivitiesView?.();
    } else if (entity === "expenses" && Core._state.activeTab === Core.TABS.EXPENSES) {
      window.ActivitiesExpenses?.renderExpensesTab?.();
    } else if (entity === "services" && Core._state.activeTab === Core.TABS.SERVICES) {
      window.ActivitiesServices?.renderServicesTab?.();
    } else if (entity === "budgets") {
      if (Core._state.activeTab === Core.TABS.BUDGET) window.ActivitiesBudget?.renderBudgetTab?.();
      if (Core._state.activeTab === Core.TABS.SERVICES) window.ActivitiesServices?.renderServicesTab?.();
    } else if (entity === "locations" || entity === "accountLocationRequests") {
      if (Core._state.activeTab === "tab-locations") renderLocationRequestsTable();
    }
  });

  document.addEventListener("languageChanged", () => {
    setupRoleTabVisibility();
    // Invalidate dropdown cached user attributes so localized labels like "All Lines" re-render in the new language
    const expLineSelect = document.getElementById("expenseFilterLine");
    if (expLineSelect) expLineSelect.dataset.lastUser = "";
    const srvLineSelect = document.getElementById("serviceBudgetLineSelect");
    if (srvLineSelect) srvLineSelect.dataset.lastUser = "";

    if (Core._state.activeTab === Core.TABS.ACTIVITIES) window.ActivitiesDaily?.renderActivitiesView?.();
    else if (Core._state.activeTab === Core.TABS.EXPENSES) window.ActivitiesExpenses?.renderExpensesTab?.();
    else if (Core._state.activeTab === Core.TABS.SERVICES) window.ActivitiesServices?.renderServicesTab?.();
    else if (Core._state.activeTab === Core.TABS.BUDGET) window.ActivitiesBudget?.renderBudgetTab?.();
    else if (Core._state.activeTab === "tab-locations") {
      try {
        if (typeof renderLocationRequestsTable === "function") renderLocationRequestsTable();
      } catch (e) {}
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Assemble full window.ActivitiesModule Facade
  const ActivitiesModule = {
    init,
    switchTab,
    setupRoleTabVisibility,
    // Tab 1: Daily
    renderDailyActivities: () => window.ActivitiesDaily?.renderDailyActivities(),
    renderActivitiesView: () => window.ActivitiesDaily?.renderActivitiesView(),
    openActivityModal: (p, d) => window.ActivitiesDaily?.openActivityModal(p, d),
    closeActivityModal: () => window.ActivitiesDaily?.closeActivityModal(),
    deleteCurrentActivity: () => window.ActivitiesDaily?.deleteCurrentActivity(),
    handleActivitySubmit: (e) => window.ActivitiesDaily?.handleActivitySubmit(e),
    // Tab 2: Expenses
    openExpenseModal: () => window.ActivitiesExpenses?.openExpenseModal(),
    closeExpenseModal: () => window.ActivitiesExpenses?.closeExpenseModal(),
    handleExpenseSubmit: (e) => window.ActivitiesExpenses?.handleExpenseSubmit(e),
    onReceiptFileSelected: (e) => window.ActivitiesExpenses?.onReceiptFileSelected(e),
    onExpenseLineFilterChange: () => window.ActivitiesExpenses?.onExpenseLineFilterChange(),
    renderExpensesTab: () => window.ActivitiesExpenses?.renderExpensesTab(),
    filterExpenses: () => window.ActivitiesExpenses?.filterExpenses(),
    // Tab 3: Services
    openServiceModal: () => window.ActivitiesServices?.openServiceModal(),
    closeServiceModal: () => window.ActivitiesServices?.closeServiceModal(),
    onServiceFormLineChange: () => window.ActivitiesServices?.onServiceFormLineChange(),
    onServiceFormAreaChange: () => window.ActivitiesServices?.onServiceFormAreaChange(),
    onServiceFormShiftChange: () => window.ActivitiesServices?.onServiceFormShiftChange(),
    handleServiceSubmit: (e) => window.ActivitiesServices?.handleServiceSubmit(e),
    renderServicesTab: () => window.ActivitiesServices?.renderServicesTab(),
    filterServices: () => window.ActivitiesServices?.filterServices(),
    onSharedServiceToggle: (checked) => window.ActivitiesServices?.onSharedServiceToggle(checked),
    updatePrimaryShareDisplay: () => window.ActivitiesServices?.updatePrimaryShareDisplay(),
    addSharedLineRow: (defaultPercent) => window.ActivitiesServices?.addSharedLineRow(defaultPercent),
    removeSharedLineRow: (idx) => window.ActivitiesServices?.removeSharedLineRow(idx),
    onSharedLineChange: (idx, lineId) => window.ActivitiesServices?.onSharedLineChange(idx, lineId),
    onSharedAreaChange: (idx, areaId) => window.ActivitiesServices?.onSharedAreaChange(idx, areaId),
    onPrimarySharePercentInput: (val) => window.ActivitiesServices?.onPrimarySharePercentInput(val),
    onSharedLinePercentInput: (idx, val) => window.ActivitiesServices?.onSharedLinePercentInput(idx, val),
    recalculateSharedBalances: () => window.ActivitiesServices?.recalculateSharedBalances(),
    handleServiceFileSelect: (e) => window.ActivitiesServices?.handleServiceFileSelect(e),
    // Tab 4: Budget
    renderBudgetTab: () => window.ActivitiesBudget?.renderBudgetTab(),
    calculateBuBudgetSummary: () => window.ActivitiesBudget?.calculateBuBudgetSummary(),
    saveBuBudgetAllocations: () => window.ActivitiesBudget?.saveBuBudgetAllocations(),
    openLmDetailModal: (lmId, lineId) => window.ActivitiesBudget?.openLmDetailModal(lmId, lineId),
    closeLmDetailModal: () => window.ActivitiesBudget?.closeLmDetailModal?.(),
    onBuLineChange: () => window.ActivitiesBudget?.onBuLineChange?.(),
    calculateLmAllocationPreview: () => window.ActivitiesBudget?.calculateLmAllocationPreview?.(),
    onServiceBudgetLineChange: () => window.ActivitiesBudget?.onServiceBudgetLineChange?.(),
    saveDmAllocations: () => window.ActivitiesBudget?.saveDmAllocations?.(),
    renderDmDistributionSection: (lineId, user) => window.ActivitiesBudget?.renderDmDistributionSection?.(lineId, user),
    calculateDmAllocationPreview: () => window.ActivitiesBudget?.calculateDmAllocationPreview?.(),
    saveDmRepAllocations: () => window.ActivitiesBudget?.saveDmRepAllocations?.(),
    // Decisions & Zoom
    openDecisionModal: (type, id, dec) => window.ActivitiesDecisions?.openDecisionModal?.(type, id, dec),
    closeDecisionModal: () => window.ActivitiesDecisions?.closeDecisionModal?.(),
    executeDecisionConfirm: () => window.ActivitiesDecisions?.executeDecisionConfirm?.(),
    openReceiptPreviewModal: (src) => {
      const fn = window.ActivitiesExpenses?.openReceiptPreviewModal || window.ActivitiesDecisions?.openReceiptPreviewModal;
      return fn ? fn(src) : undefined;
    },
    closeReceiptPreviewModal: () => window.ActivitiesDecisions?.closeReceiptPreviewModal?.(),
    // Core Helpers
    addDays: Core.addDays,
    formatDate: Core.formatDate,
    getWeekStart: Core.getWeekStart,
    escapeHTML: Core.escapeHTML,
  };

  // Export Facade and Global Aliases with collision guards for backward compatibility
  window.ActivitiesModule = ActivitiesModule;
  const safeExport = (name, fn) => {
    try {
      if (typeof window[name] === "undefined" || window[name] === null) {
        window[name] = fn;
      }
    } catch (e) {}
  };

  safeExport("switchRequestsTab", ActivitiesModule.switchTab);
  safeExport("openActivityModal", ActivitiesModule.openActivityModal);
  safeExport("closeActivityModal", ActivitiesModule.closeActivityModal);
  safeExport("deleteCurrentActivity", ActivitiesModule.deleteCurrentActivity);
  safeExport("handleActivitySubmit", ActivitiesModule.handleActivitySubmit);
  safeExport("openExpenseModal", ActivitiesModule.openExpenseModal);
  safeExport("closeExpenseModal", ActivitiesModule.closeExpenseModal);
  safeExport("handleExpenseSubmit", ActivitiesModule.handleExpenseSubmit);
  safeExport("onReceiptFileSelected", ActivitiesModule.onReceiptFileSelected);
  safeExport("openServiceModal", ActivitiesModule.openServiceModal);
  safeExport("closeServiceModal", ActivitiesModule.closeServiceModal);
  safeExport("onServiceFormLineChange", ActivitiesModule.onServiceFormLineChange);
  safeExport("onServiceFormAreaChange", ActivitiesModule.onServiceFormAreaChange);
  safeExport("onServiceFormShiftChange", ActivitiesModule.onServiceFormShiftChange);
  safeExport("handleServiceSubmit", ActivitiesModule.handleServiceSubmit);
  safeExport("onServiceBudgetLineChange", ActivitiesModule.onServiceBudgetLineChange);
  safeExport("saveDmAllocations", ActivitiesModule.saveDmAllocations);
  safeExport("onBuLineChange", ActivitiesModule.onBuLineChange);
  safeExport("calculateBuBudgetSummary", ActivitiesModule.calculateBuBudgetSummary);
  safeExport("saveBuBudgetAllocations", ActivitiesModule.saveBuBudgetAllocations);
  safeExport("openLmDetailModal", ActivitiesModule.openLmDetailModal);
  safeExport("closeLmDetailModal", ActivitiesModule.closeLmDetailModal);
  safeExport("openDecisionModal", ActivitiesModule.openDecisionModal);
  safeExport("closeDecisionModal", ActivitiesModule.closeDecisionModal);
  safeExport("executeDecisionConfirm", ActivitiesModule.executeDecisionConfirm);
  safeExport("openReceiptPreviewModal", ActivitiesModule.openReceiptPreviewModal);
  safeExport("closeReceiptPreviewModal", ActivitiesModule.closeReceiptPreviewModal);
  safeExport("filterExpenses", ActivitiesModule.filterExpenses);
  safeExport("filterServices", ActivitiesModule.filterServices);
  safeExport("renderExpensesTab", ActivitiesModule.renderExpensesTab);
  safeExport("renderServicesTab", ActivitiesModule.renderServicesTab);
  safeExport("saveBuAllocation", ActivitiesModule.saveBuBudgetAllocations);
  safeExport("saveLmAllocation", ActivitiesModule.saveDmAllocations);
  safeExport("saveDmRepAllocation", ActivitiesModule.saveDmRepAllocations);
  safeExport("calculateDmAllocationPreview", ActivitiesModule.calculateDmAllocationPreview);
  safeExport("handleReceiptFilePreview", (input) => ActivitiesModule.onReceiptFileSelected(input));
  safeExport("onBuBudgetLineChange", ActivitiesModule.onBuLineChange);
  safeExport("onExpenseLineFilterChange", ActivitiesModule.onExpenseLineFilterChange);
  safeExport("calculateLmAllocationPreview", ActivitiesModule.calculateLmAllocationPreview);
  safeExport("onSharedServiceToggle", (checked) => ActivitiesModule.onSharedServiceToggle(checked));
  safeExport("addSharedLineRow", (defaultPercent) => ActivitiesModule.addSharedLineRow(defaultPercent));
  safeExport("removeSharedLineRow", (idx) => ActivitiesModule.removeSharedLineRow(idx));
  safeExport("onSharedLineChange", (idx, lineId) => ActivitiesModule.onSharedLineChange(idx, lineId));
  safeExport("onSharedAreaChange", (idx, areaId) => ActivitiesModule.onSharedAreaChange(idx, areaId));
  safeExport("onPrimarySharePercentInput", (val) => ActivitiesModule.onPrimarySharePercentInput(val));
  safeExport("onSharedLinePercentInput", (idx, val) => ActivitiesModule.onSharedLinePercentInput(idx, val));
  safeExport("handleServiceFileSelect", (e) => ActivitiesModule.handleServiceFileSelect(e));
  safeExport("recalculateSharedBalances", ActivitiesModule.recalculateSharedBalances);
  safeExport("renderLocationRequestsTable", ActivitiesModule.renderLocationRequestsTable || renderLocationRequestsTable);

})(window);