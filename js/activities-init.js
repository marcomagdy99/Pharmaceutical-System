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
    const role = (user && user.role) ? user.role.toLowerCase() : "";
    const tabBtnBudget = document.getElementById("tabBtnBudget");
    const tabBtnServices = document.getElementById("tabBtnServices");
    const lmDistSec = document.getElementById("lmDistributionSection");
    const dmDistSec = document.getElementById("dmDistributionSection");

    if (role === Core.ROLES.BU || role === Core.ROLES.ADMIN) {
      if (tabBtnBudget) tabBtnBudget.style.display = "inline-flex";
      if (role === Core.ROLES.BU && tabBtnServices) tabBtnServices.style.display = "none";
      if (role === Core.ROLES.ADMIN && tabBtnServices) tabBtnServices.style.display = "inline-flex";
      if (role === Core.ROLES.BU && Core._state.activeTab === Core.TABS.SERVICES) {
        switchTab(Core.TABS.BUDGET);
        return;
      }
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
    const role = (currentUser.role || "").toLowerCase();

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No geographic location requests submitted yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map((req) => {
      const typeBadge = req.requestType === "relocation"
        ? `<span class="badge bg-warning text-dark">Relocation</span>`
        : `<span class="badge bg-info text-dark">Initial Pin</span>`;

      const st = req.status || "pending";
      const isPending = st !== "approved" && st !== "rejected";

      let statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
      if (st === "approved") {
        statusBadge = `<span class="badge bg-success">Approved</span>`;
      } else if (st === "rejected") {
        statusBadge = `<span class="badge bg-danger">Rejected</span>`;
      } else if (st === "pending_dm") {
        statusBadge = `<span class="badge bg-warning text-dark">Pending DM</span>`;
      } else if (st === "pending_lm") {
        statusBadge = `<span class="badge bg-info text-dark">Pending LM</span>`;
      } else if (st === "pending_bu") {
        statusBadge = `<span class="badge bg-primary">Pending BU</span>`;
      } else if (st === "pending_gm") {
        statusBadge = `<span class="badge bg-dark">Pending GM</span>`;
      }

      let canApproveStage = false;
      if (isPending) {
        if (role === "admin" || role === "general_manager") {
          canApproveStage = true;
        } else if (st === "pending" || st === "pending_dm") {
          canApproveStage = (role === "district_manager" || role === "line_manager" || role === "business_unit");
        } else if (st === "pending_lm") {
          canApproveStage = (role === "line_manager" || role === "business_unit");
        } else if (st === "pending_bu") {
          canApproveStage = (role === "business_unit");
        } else if (st === "pending_gm") {
          canApproveStage = (role === "general_manager");
        }
      }

      let locInfo = `<code>${req.newLat.toFixed(5)}, ${req.newLng.toFixed(5)}</code>`;
      if (req.oldLat != null && req.oldLng != null) {
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${req.oldLat},${req.oldLng}&destination=${req.newLat},${req.newLng}`;
        locInfo += `<br><a href="${mapUrl}" target="_blank" class="small text-primary fw-bold">Compare on Map</a>`;
        if (req.distanceMeters) locInfo += ` <span class="badge bg-secondary">${req.distanceMeters}m</span>`;
      } else {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${req.newLat},${req.newLng}`;
        locInfo += `<br><a href="${mapUrl}" target="_blank" class="small text-primary fw-bold">View on Map</a>`;
      }

      let actionsHtml = "";
      if (isPending && canApproveStage) {
        actionsHtml = `
          <button type="button" class="btn btn-sm btn-success me-1" onclick="approveLocationReq('${req.id}')">Approve</button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="rejectLocationReq('${req.id}')">Reject</button>
        `;
      } else if (isPending) {
        const stageLabel = st.replace("pending_", "").toUpperCase() || "Manager";
        actionsHtml = `<small class="text-muted">Awaiting ${stageLabel}</small>`;
      } else {
        actionsHtml = `<small class="text-muted">${req.decisionBy || "Manager"} - ${req.decisionAt ? req.decisionAt.slice(0, 10) : ""}</small>`;
      }

      return `
        <tr>
          <td><strong>${window.escapeHtml(req.targetName || "")}</strong></td>
          <td>${window.escapeHtml(req.repName || "")}</td>
          <td>${typeBadge}</td>
          <td>${locInfo}</td>
          <td>${window.escapeHtml(req.newAddress || req.reason || "-")}</td>
          <td>${statusBadge}</td>
          <td><small>${req.submittedAt ? req.submittedAt.slice(0, 16).replace("T", " ") : "-"}</small></td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join("");
  }

  window.approveLocationReq = function(id) {
    if (!window.store || !window.store.accountLocationRequests) return;
    const user = Core.getAuthUser() || {};
    window.store.accountLocationRequests.approve(id, user);
    if (typeof window.showToast === "function") window.showToast("Location coordinates approved and updated successfully! ✅", "success");
    renderLocationRequestsTable();
  };

  window.rejectLocationReq = function(id) {
    if (!window.store || !window.store.accountLocationRequests) return;
    const reason = window.prompt("Rejection reason (optional):") || "";
    const user = Core.getAuthUser() || {};
    window.store.accountLocationRequests.reject(id, user, reason);
    if (typeof window.showToast === "function") window.showToast("Location request rejected.", "info");
    renderLocationRequestsTable();
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
        modal.addEventListener("click", (e) => {
          if (e.target === modal) close();
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
      setupDateNavigation();
    } catch (e) {
      console.warn("setupModalBackdropsAndShortcuts warning:", e);
    }

    // Render active tab IMMEDIATELY so the view is painted without delay
    try {
      if (Core._state.activeTab === Core.TABS.ACTIVITIES) {
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

    // Trigger budget sanitizer on startup to clear any stale cross-line DM allocations
    try {
      Core.StoreAdapter.getBudgets();
    } catch (e) {
      console.warn("getBudgets sanitizer warning:", e);
    }
  }

  // Reactive Wakeup: Listen for store changes across the app
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
    }
  });

  document.addEventListener("languageChanged", () => {
    setupRoleTabVisibility();
    if (Core._state.activeTab === Core.TABS.ACTIVITIES) window.ActivitiesDaily?.renderActivitiesView?.();
    else if (Core._state.activeTab === Core.TABS.EXPENSES) window.ActivitiesExpenses?.renderExpensesTab?.();
    else if (Core._state.activeTab === Core.TABS.SERVICES) window.ActivitiesServices?.renderServicesTab?.();
    else if (Core._state.activeTab === Core.TABS.BUDGET) window.ActivitiesBudget?.renderBudgetTab?.();
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
    openReceiptPreviewModal: (src) => window.ActivitiesDecisions?.openReceiptPreviewModal?.(src),
    closeReceiptPreviewModal: () => window.ActivitiesDecisions?.closeReceiptPreviewModal?.(),
    // Core Helpers
    addDays: Core.addDays,
    formatDate: Core.formatDate,
    getWeekStart: Core.getWeekStart,
    escapeHTML: Core.escapeHTML,
  };

  // Export Facade and Global Aliases for full backward-compatibility with inline HTML
  window.ActivitiesModule = ActivitiesModule;
  window.switchRequestsTab = ActivitiesModule.switchTab;
  window.openActivityModal = ActivitiesModule.openActivityModal;
  window.closeActivityModal = ActivitiesModule.closeActivityModal;
  window.deleteCurrentActivity = ActivitiesModule.deleteCurrentActivity;
  window.handleActivitySubmit = ActivitiesModule.handleActivitySubmit;
  window.openExpenseModal = ActivitiesModule.openExpenseModal;
  window.closeExpenseModal = ActivitiesModule.closeExpenseModal;
  window.handleExpenseSubmit = ActivitiesModule.handleExpenseSubmit;
  window.onReceiptFileSelected = ActivitiesModule.onReceiptFileSelected;
  window.openServiceModal = ActivitiesModule.openServiceModal;
  window.closeServiceModal = ActivitiesModule.closeServiceModal;
  window.onServiceFormLineChange = ActivitiesModule.onServiceFormLineChange;
  window.onServiceFormAreaChange = ActivitiesModule.onServiceFormAreaChange;
  window.onServiceFormShiftChange = ActivitiesModule.onServiceFormShiftChange;
  window.handleServiceSubmit = ActivitiesModule.handleServiceSubmit;
  window.onServiceBudgetLineChange = ActivitiesModule.onServiceBudgetLineChange;
  window.saveDmAllocations = ActivitiesModule.saveDmAllocations;
  window.onBuLineChange = ActivitiesModule.onBuLineChange;
  window.calculateBuBudgetSummary = ActivitiesModule.calculateBuBudgetSummary;
  window.saveBuBudgetAllocations = ActivitiesModule.saveBuBudgetAllocations;
  window.openLmDetailModal = ActivitiesModule.openLmDetailModal;
  window.closeLmDetailModal = ActivitiesModule.closeLmDetailModal;
  window.openDecisionModal = ActivitiesModule.openDecisionModal;
  window.closeDecisionModal = ActivitiesModule.closeDecisionModal;
  window.executeDecisionConfirm = ActivitiesModule.executeDecisionConfirm;
  window.openReceiptPreviewModal = ActivitiesModule.openReceiptPreviewModal;
  window.closeReceiptPreviewModal = ActivitiesModule.closeReceiptPreviewModal;
  window.filterExpenses = ActivitiesModule.filterExpenses;
  window.filterServices = ActivitiesModule.filterServices;
  window.renderExpensesTab = ActivitiesModule.renderExpensesTab;
  window.renderServicesTab = ActivitiesModule.renderServicesTab;
  window.saveBuAllocation = ActivitiesModule.saveBuBudgetAllocations;
  window.saveLmAllocation = ActivitiesModule.saveDmAllocations;
  window.saveDmRepAllocation = ActivitiesModule.saveDmRepAllocations;
  window.calculateDmAllocationPreview = ActivitiesModule.calculateDmAllocationPreview;
  window.handleReceiptFilePreview = (input) => ActivitiesModule.onReceiptFileSelected(input);
  window.onBuBudgetLineChange = ActivitiesModule.onBuLineChange;
  window.onExpenseLineFilterChange = ActivitiesModule.onExpenseLineFilterChange;
  window.calculateLmAllocationPreview = ActivitiesModule.calculateLmAllocationPreview;
  window.onSharedServiceToggle = (checked) => ActivitiesModule.onSharedServiceToggle(checked);
  window.addSharedLineRow = (defaultPercent) => ActivitiesModule.addSharedLineRow(defaultPercent);
  window.removeSharedLineRow = (idx) => ActivitiesModule.removeSharedLineRow(idx);
  window.onSharedLineChange = (idx, lineId) => ActivitiesModule.onSharedLineChange(idx, lineId);
  window.onSharedAreaChange = (idx, areaId) => ActivitiesModule.onSharedAreaChange(idx, areaId);
  window.onPrimarySharePercentInput = (val) => ActivitiesModule.onPrimarySharePercentInput(val);
  window.onSharedLinePercentInput = (idx, val) => ActivitiesModule.onSharedLinePercentInput(idx, val);
  window.handleServiceFileSelect = (e) => ActivitiesModule.handleServiceFileSelect(e);
  window.recalculateSharedBalances = ActivitiesModule.recalculateSharedBalances;

})(window);