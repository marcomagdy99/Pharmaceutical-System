/**
 * @file activities-tab-budget.js
 * @description Tab 4: Sales Promo Budget Engine (BU Allocation to LMs & LM Distribution to DMs)
 */

(function (window) {
  "use strict";

  const Core = window.ActivitiesCore;
  if (!Core) return;

  function renderBudgetTab() {
    Core._state.currentUser = Core.getAuthUser();
    const allLines = Core.getAllProductLines();
    const buSelect = document.getElementById("buBudgetLineSelect") || document.getElementById("buProductLineSelect");
    if (buSelect && buSelect.children.length === 0) {
      buSelect.innerHTML = allLines.map((l) => `<option value="${l.id}">${Core.escapeHTML(l.name)}</option>`).join("");
      if (allLines.length > 0) buSelect.value = allLines[0].id;
    }

    const lineId = buSelect?.value || (allLines[0] ? allLines[0].id : "");
    if (!lineId) return;
    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 100000, lmAllocations: {}, dmAllocations: {} };

    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    if (totalInput) totalInput.value = lineBudget.totalBudget || 0;

    const allUsers = Core.getAllUsers();
    const lmsForLine = allUsers.filter(
      (u) => u.role === Core.ROLES.LM && (u.lineIds && Array.isArray(u.lineIds) ? u.lineIds.includes(lineId) : u.lineId === lineId)
    );

    const tbody = document.getElementById("buLmAllocationTableBody") || document.getElementById("buLmAllocTableBody");
    if (tbody) {
      if (lmsForLine.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted, var(--gray-500));">${Core.t("noLmsForLine") || "No Line Managers found for this line."}</td></tr>`;
      } else {
        tbody.innerHTML = lmsForLine
          .map((lm) => {
            const alloc = (lineBudget.lmAllocations && lineBudget.lmAllocations[lm.id]) || 0;
            const dmsUnderLm = Core.getDmsUnderLmForLine(lm.id, lineId);
            const dmSum = dmsUnderLm.reduce(
              (sum, dm) => sum + ((lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0),
              0
            );

            return `
              <tr>
                <td>
                  <div style="font-weight:700; color:var(--text-color, var(--gray-800));">${Core.escapeHTML(Core.getUserDisplayName(lm.id))}</div>
                  <small style="color:var(--text-muted, var(--gray-500));">${Core.escapeHTML(lm.email || "")}</small>
                </td>
                <td><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">${Core.escapeHTML(lm.employeeCode || lm.id)}</span></td>
                <td>
                  <input type="number" class="form-control bu-lm-input" data-lmid="${lm.id}" value="${alloc}" min="0" step="1000" oninput="ActivitiesModule.calculateBuBudgetSummary()" style="width:160px; font-weight:700;" />
                </td>
                <td style="font-weight:700; color:var(--text-color, var(--gray-700));">${dmSum.toLocaleString()} ${Core.t("currency") || "EGP"}</td>
                <td>
                  <button type="button" class="btn btn-outline" style="font-size:0.8rem; padding:4px 10px;" onclick="ActivitiesModule.openLmDetailModal('${lm.id}', '${lineId}')">
                    ${Core.t("inspectDms") || "Inspect DMs"}
                  </button>
                </td>
              </tr>
            `;
          })
          .join("");
      }
    }

    calculateBuBudgetSummary();
  }

  function calculateBuBudgetSummary() {
    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    const total = parseFloat(totalInput?.value || 0);

    let allocatedSum = 0;
    document.querySelectorAll(".bu-lm-input").forEach((inp) => {
      allocatedSum += parseFloat(inp.value || 0);
    });

    const unallocated = total - allocatedSum;

    const totalDisplay = document.getElementById("buMetricTotal") || document.getElementById("buSummaryTotalDisplay");
    const allocDisplay = document.getElementById("buMetricAllocated") || document.getElementById("buSummaryAllocatedDisplay");
    const unallocDisplay = document.getElementById("buMetricRemaining") || document.getElementById("buSummaryUnallocatedDisplay");

    const curr = Core.t("currency") || "EGP";
    if (totalDisplay) totalDisplay.textContent = `${total.toLocaleString()} ${curr}`;
    if (allocDisplay) allocDisplay.textContent = `${allocatedSum.toLocaleString()} ${curr}`;
    if (unallocDisplay) {
      unallocDisplay.textContent = `${unallocated.toLocaleString()} ${curr}`;
      unallocDisplay.style.color = unallocated < 0 ? "var(--danger)" : "var(--primary)";
    }
  }

  function saveBuBudgetAllocations() {
    Core._state.currentUser = Core.getAuthUser();
    if (!Core.isActionAuthorized("allocate_bu_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedBudgetAction") || "غير مصرح لك بتعديل ميزانية قطاع الأعمال.", "danger");
      return;
    }
    const buSelect = document.getElementById("buBudgetLineSelect") || document.getElementById("buProductLineSelect");
    const allLines = Core.getAllProductLines();
    const lineId = buSelect?.value || (allLines[0] ? allLines[0].id : "");
    if (!lineId) return;
    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    const total = parseFloat(totalInput?.value || 0);

    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

    let totalLmAlloc = 0;
    const tempAllocations = {};
    document.querySelectorAll(".bu-lm-input").forEach((inp) => {
      const lmId = inp.dataset.lmid;
      if (lmId) {
        const val = Number(inp.value || 0);
        tempAllocations[lmId] = val;
        totalLmAlloc += val;
      }
    });

    if (total > 0 && totalLmAlloc > total) {
      Core.safeShowToast(
        Core.t("budgetOverAllocated") || `تحذير: إجمالي مخصصات مديري الخطوط (${totalLmAlloc.toLocaleString()}) يتجاوز الميزانية الكلية للخط (${total.toLocaleString()}).`,
        "warning"
      );
    }

    budgets[lineId].totalBudget = total;
    if (!budgets[lineId].lmAllocations) budgets[lineId].lmAllocations = {};
    budgets[lineId].lmAllocations = tempAllocations;

    Core.StoreAdapter.saveBudgets(budgets);
    Core.safeShowToast(Core.t("savedBudgetMessage") || "تم حفظ مخصصات الميزانية بنجاح", "success");
    renderBudgetTab();
  }

  function openLmDetailModal(lmId, lineId) {
    const lm = Core.getUserById(lmId);
    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || {};
    const dms = Core.getDmsUnderLmForLine(lmId, lineId);

    const lmName = lm ? Core.getUserDisplayName(lm.id) : lmId;
    const modal = document.getElementById("lmDetailModal");
    const titleEl = document.getElementById("lmDetailModalTitle");
    const bodyEl = document.getElementById("lmDetailModalBody");

    if (titleEl) {
      titleEl.textContent = `${Core.t("dmsUnderLm") || "District Managers under"} ${lmName}`;
    }

    if (dms.length === 0) {
      if (bodyEl) {
        bodyEl.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted, var(--gray-500)); font-size:14px;">
          ${Core.t("noDmsUnderLm") || "No District Managers found under this Line Manager for the selected line."}
        </div>`;
      }
    } else {
      let rows = "";
      let totalAlloc = 0;
      dms.forEach((dm) => {
        const alloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        totalAlloc += alloc;
        rows += `
          <tr style="border-bottom:1px solid var(--border-color, #e2e8f0);">
            <td style="padding:10px 12px; font-weight:600; color:var(--text-color, var(--gray-800));">${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</td>
            <td style="padding:10px 12px;"><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td style="padding:10px 12px; text-align:end; font-weight:700; color:var(--primary);">${alloc.toLocaleString()} ${Core.t("currency") || "EGP"}</td>
          </tr>
        `;
      });

      if (bodyEl) {
        bodyEl.innerHTML = `
          <div style="margin-bottom:14px; font-size:13px; color:var(--text-muted, var(--gray-600));">
            ${Core.t("totalDmAllocation") || "Total allocated to DMs"}: <strong style="color:var(--text-color, var(--gray-900));">${totalAlloc.toLocaleString()} ${Core.t("currency") || "EGP"}</strong>
          </div>
          <div class="table-responsive">
            <table class="table" style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid var(--border-color, #cbd5e1); text-align:start;">
                  <th style="padding:8px 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">${Core.t("name") || "District Manager"}</th>
                  <th style="padding:8px 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">${Core.t("code") || "Code"}</th>
                  <th style="padding:8px 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); text-align:end;">${Core.t("allocation") || "Allocated"}</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    if (modal) {
      modal.style.display = "flex";
      modal.classList.add("active");
    }
  }

  function closeLmDetailModal() {
    const modal = document.getElementById("lmDetailModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  function onBuLineChange() {
    renderBudgetTab();
  }

  function renderLmDistributionSection(lineId, lmUser) {
    const sec = document.getElementById("lmDistributionSection");
    if (!sec) return;
    sec.style.display = "block";

    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

    const dmsUnderLm = Core.getDmsUnderLmForLine(lmUser.id, lineId);

    const tbody = document.getElementById("lmDmAllocationTableBody") || document.getElementById("lmDmAllocTableBody");
    if (!tbody) return;

    if (dmsUnderLm.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted, var(--gray-500));">No District Managers assigned to you in this line.</td></tr>`;
      return;
    }

    tbody.innerHTML = dmsUnderLm
      .map((dm) => {
        const curAlloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        const dmServices = Core.StoreAdapter.getServices().filter((s) => s.lineId === lineId && s.requesterId === dm.id && s.status === Core.REQUEST_STATUS.APPROVED);
        const dmUtilized = dmServices.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

        return `
          <tr>
            <td>
              <div style="font-weight:700; color:var(--text-color, var(--gray-800));">${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</div>
              <small style="color:var(--text-muted, var(--gray-500));">${Core.escapeHTML(dm.email || "")}</small>
            </td>
            <td><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td>
              <input type="number" class="form-control lm-dm-alloc-input" data-dmid="${dm.id}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateLmAllocationPreview()" style="width:140px; font-weight:700; display:inline-block;" />
            </td>
            <td style="font-weight:700; color:var(--text-color, var(--gray-700));">${dmUtilized.toLocaleString()} ${Core.t("currency") || "EGP"}</td>
          </tr>
        `;
      })
      .join("");
  }

  function calculateLmAllocationPreview() {
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || (Core.getAllProductLines()[0] ? Core.getAllProductLines()[0].id : "");
    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {} };
    const myLmAlloc = (lineBudget.lmAllocations && Number(lineBudget.lmAllocations[Core._state.currentUser.id])) || 0;

    let distributed = 0;
    document.querySelectorAll(".lm-dm-alloc-input").forEach((inp) => {
      distributed += Number(inp.value || 0);
    });

    const remaining = myLmAlloc - distributed;
    const spentTitle = document.getElementById("srvMetricApprovedTitle");
    const spentEl = document.getElementById("srvMetricApproved");
    const remTitle = document.getElementById("srvMetricRemainingTitle");
    const remEl = document.getElementById("srvMetricRemaining");

    const curr = Core.t("currency") || "EGP";
    if (spentTitle) spentTitle.textContent = Core.t("distributedToDms") || "Distributed to DMs";
    if (spentEl) spentEl.textContent = `${distributed.toLocaleString()} ${curr}`;
    if (remTitle) remTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
    if (remEl) {
      remEl.textContent = `${remaining.toLocaleString()} ${curr}`;
      remEl.style.color = remaining < 0 ? "var(--danger)" : "var(--success)";
    }
  }

  function renderDmDistributionSection(lineId, user) {
    const tbody = document.getElementById("dmRepAllocationTableBody");
    if (!tbody) return;

    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {} };
    if (!lineBudget.repAllocations) lineBudget.repAllocations = {};

    const allUsers = Core.getAllUsers();
    const myReps = allUsers.filter((u) => {
      const isRep = u.role === Core.ROLES.REP || u.role === Core.ROLES.REP_ALT;
      const isMySub = u.managerId === user.id;
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      const matchLine = uLines.includes(lineId);
      return isRep && isMySub && matchLine;
    });

    if (myReps.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted, var(--gray-500));">
            ${Core.t("noServicesFound") || "No medical reps found assigned under your district for this product line."}
          </td>
        </tr>
      `;
      return;
    }

    const allServices = Core.StoreAdapter.getServices();
    tbody.innerHTML = myReps
      .map((rep) => {
        const curAlloc = (lineBudget.repAllocations && lineBudget.repAllocations[rep.id]) || 0;
        let repUtilized = 0;
        allServices.forEach((s) => {
          if (s.isShared && Array.isArray(s.shares)) {
            s.shares.forEach((sh) => {
              if (sh.lineId === lineId && sh.repId === rep.id && (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)) {
                repUtilized += Number(sh.shareAmount || 0);
              }
            });
          } else if (s.lineId === lineId && s.requesterId === rep.id && s.status === Core.REQUEST_STATUS.APPROVED) {
            repUtilized += Number(s.cost || 0);
          }
        });

        return `
          <tr>
            <td>
              <div style="font-weight:700; color:var(--text-color, var(--gray-800));">${Core.escapeHTML(Core.getUserDisplayName(rep.id))}</div>
              <small style="color:var(--text-muted, var(--gray-500));">${Core.escapeHTML(rep.email || "")}</small>
            </td>
            <td><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">${Core.escapeHTML(rep.employeeCode || rep.id)}</span></td>
            <td>
              <input type="number" class="form-control dm-rep-alloc-input" data-repid="${rep.id}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateDmAllocationPreview()" style="width:140px; font-weight:700; display:inline-block;" />
            </td>
            <td style="font-weight:700; color:var(--text-color, var(--gray-700));">${repUtilized.toLocaleString()} ${Core.t("currency") || "EGP"}</td>
          </tr>
        `;
      })
      .join("");
  }

  function calculateDmAllocationPreview() {
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || (Core.getAllProductLines()[0] ? Core.getAllProductLines()[0].id : "");
    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {} };
    const myDmAlloc = (lineBudget.dmAllocations && Number(lineBudget.dmAllocations[Core._state.currentUser.id])) || 0;

    let distributed = 0;
    document.querySelectorAll(".dm-rep-alloc-input").forEach((inp) => {
      distributed += Number(inp.value || 0);
    });

    const remaining = myDmAlloc - distributed;
    const spentTitle = document.getElementById("srvMetricApprovedTitle");
    const spentEl = document.getElementById("srvMetricApproved");
    const remTitle = document.getElementById("srvMetricRemainingTitle");
    const remEl = document.getElementById("srvMetricRemaining");

    const curr = Core.t("currency") || "EGP";
    if (spentTitle) spentTitle.textContent = Core.t("distributedToReps") || "Distributed to Reps";
    if (spentEl) spentEl.textContent = `${distributed.toLocaleString()} ${curr}`;
    if (remTitle) remTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
    if (remEl) {
      remEl.textContent = `${remaining.toLocaleString()} ${curr}`;
      remEl.style.color = remaining < 0 ? "var(--danger)" : "var(--success)";
    }
  }

  function saveDmRepAllocations() {
    Core._state.currentUser = Core.getAuthUser();
    if (!Core.isActionAuthorized("allocate_dm_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedRepBudgetAction") || "غير مصرح لك بتعديل مخصصات المندوبين.", "danger");
      return;
    }
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || (Core.getAllProductLines()[0] ? Core.getAllProductLines()[0].id : "");
    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {} };
    if (!budgets[lineId].repAllocations) budgets[lineId].repAllocations = {};

    let totalAlloc = 0;
    document.querySelectorAll(".dm-rep-alloc-input").forEach((inp) => {
      const repId = inp.dataset.repid;
      if (repId) {
        const val = Number(inp.value || 0);
        budgets[lineId].repAllocations[repId] = val;
        totalAlloc += val;
      }
    });

    const myDmAlloc = (budgets[lineId].dmAllocations && Number(budgets[lineId].dmAllocations[Core._state.currentUser.id])) || 0;
    if (myDmAlloc > 0 && totalAlloc > myDmAlloc) {
      Core.safeShowToast(Core.t("insufficientBudgetNotice") || "تحذير: إجمالي المخصص للمندوبين يتجاوز ميزانية المنطقة المتاحة لك.", "warning");
    }

    Core.StoreAdapter.saveBudgets(budgets);
    Core.safeShowToast(Core.t("savedRepBudgetMessage") || "تم حفظ مخصصات المندوبين بنجاح.", "success");
    if (window.ActivitiesServices && window.ActivitiesServices.renderServicesTab) {
      window.ActivitiesServices.renderServicesTab();
    }
  }

  function saveDmAllocations() {
    Core._state.currentUser = Core.getAuthUser();
    if (!Core.isActionAuthorized("allocate_lm_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedDmBudgetAction") || "غير مصرح لك بتعديل مخصصات مديري المناطق.", "danger");
      return;
    }
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || (Core.getAllProductLines()[0] ? Core.getAllProductLines()[0].id : "");
    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
    if (!budgets[lineId].dmAllocations) budgets[lineId].dmAllocations = {};

    let totalAlloc = 0;
    document.querySelectorAll(".lm-dm-alloc-input").forEach((inp) => {
      const dmId = inp.dataset.dmid;
      if (dmId) {
        const val = Number(inp.value || 0);
        budgets[lineId].dmAllocations[dmId] = val;
        totalAlloc += val;
      }
    });

    const myLmAlloc = (budgets[lineId].lmAllocations && Number(budgets[lineId].lmAllocations[Core._state.currentUser.id])) || 0;
    if (myLmAlloc > 0 && totalAlloc > myLmAlloc) {
      Core.safeShowToast(Core.t("insufficientBudgetNotice") || "تحذير: إجمالي المخصص لمديري المناطق يتجاوز ميزانية الخط المتاحة لك.", "warning");
    }

    Core.StoreAdapter.saveBudgets(budgets);
    Core.safeShowToast(Core.t("savedDmBudgetMessage") || "تم حفظ مخصصات مديري المناطق بنجاح.", "success");
    if (window.ActivitiesServices && window.ActivitiesServices.renderServicesTab) {
      window.ActivitiesServices.renderServicesTab();
    }
  }

  function onServiceBudgetLineChange() {
    Core._state.currentUser = Core.getAuthUser();
    if (window.ActivitiesServices && window.ActivitiesServices.renderServicesTab) {
      window.ActivitiesServices.renderServicesTab();
    }
  }

  window.ActivitiesBudget = {
    renderBudgetTab,
    calculateBuBudgetSummary,
    saveBuBudgetAllocations,
    openLmDetailModal,
    closeLmDetailModal,
    onBuLineChange,
    renderLmDistributionSection,
    calculateLmAllocationPreview,
    saveDmAllocations,
    renderDmDistributionSection,
    calculateDmAllocationPreview,
    saveDmRepAllocations,
    onServiceBudgetLineChange,
  };
})(window);