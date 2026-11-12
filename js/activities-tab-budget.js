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
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    if (totalInput) totalInput.value = lineBudget.totalBudget || 0;

    const allUsers = Core.getAllUsers();
    const lmsForLine = allUsers.filter(
      (u) => u.role === Core.ROLES.LM && (u.lineIds && Array.isArray(u.lineIds) ? u.lineIds.includes(lineId) : u.lineId === lineId)
    );

    const tbody = document.getElementById("buLmAllocationTableBody") || document.getElementById("buLmAllocTableBody");
    if (tbody) {
      if (lmsForLine.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="budget-empty-cell">${Core.t("noLmsForLine") || "No Line Managers found for this line."}</td></tr>`;
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
                  <div class="budget-user-name">${Core.escapeHTML(Core.getUserDisplayName(lm.id))}</div>
                  <small class="budget-user-email">${Core.escapeHTML(lm.email || "")}</small>
                </td>
                <td><span class="badge budget-code-badge">${Core.escapeHTML(lm.employeeCode || lm.id)}</span></td>
                <td>
                  <input type="number" class="form-control bu-lm-input budget-alloc-input-bu" data-lmid="${lm.id}" value="${alloc}" min="0" step="1000" oninput="ActivitiesModule.calculateBuBudgetSummary()" />
                </td>
                <td class="budget-sum-cell">${dmSum.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</td>
                <td>
                  <button type="button" class="btn btn-outline budget-inspect-btn" onclick="ActivitiesModule.openLmDetailModal('${lm.id}', '${lineId}')">
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
    const rawTotal = parseFloat(totalInput?.value);
    const total = (Number.isFinite(rawTotal) && rawTotal >= 0) ? rawTotal : 0;

    let allocatedSum = 0;
    document.querySelectorAll(".bu-lm-input").forEach((inp) => {
      const val = parseFloat(inp.value);
      allocatedSum += (Number.isFinite(val) && val >= 0) ? val : 0;
    });

    const unallocated = total - allocatedSum;

    const totalDisplay = document.getElementById("buMetricTotal") || document.getElementById("buSummaryTotalDisplay");
    const allocDisplay = document.getElementById("buMetricAllocated") || document.getElementById("buSummaryAllocatedDisplay");
    const unallocDisplay = document.getElementById("buMetricRemaining") || document.getElementById("buSummaryUnallocatedDisplay");

    const curr = Core.t("currency") || "EGP";
    if (totalDisplay) totalDisplay.textContent = `${total.toLocaleString("en-US")} ${curr}`;
    if (allocDisplay) allocDisplay.textContent = `${allocatedSum.toLocaleString("en-US")} ${curr}`;
    if (unallocDisplay) {
      unallocDisplay.textContent = `${unallocated.toLocaleString("en-US")} ${curr}`;
      unallocDisplay.style.color = unallocated < 0 ? "var(--danger)" : "var(--primary)";
    }
  }

  function saveBuBudgetAllocations() {
    Core._state.currentUser = Core.getAuthUser();
    if (!Core.isActionAuthorized("allocate_bu_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedBudgetAction") || "You are not authorized to edit business unit budget.", "danger");
      return;
    }
    const buSelect = document.getElementById("buBudgetLineSelect") || document.getElementById("buProductLineSelect");
    const allLines = Core.getAllProductLines();
    const lineId = buSelect?.value || (allLines[0] ? allLines[0].id : "");
    if (!lineId) return;
    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    const rawTotal = parseFloat(totalInput?.value);
    if (!Number.isFinite(rawTotal) || rawTotal < 0) {
      Core.safeShowToast(Core.t("invalidNumber") || "Please enter a valid positive number for total budget.", "warning");
      return;
    }
    const total = rawTotal;

    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

    let totalLmAlloc = 0;
    const tempAllocations = {};
    let hasInvalidNumber = false;
    document.querySelectorAll(".bu-lm-input").forEach((inp) => {
      const lmId = inp.dataset.lmid;
      if (lmId) {
        const val = Number(inp.value);
        if (!Number.isFinite(val) || val < 0) {
          hasInvalidNumber = true;
          return;
        }
        tempAllocations[lmId] = val;
        totalLmAlloc += val;
      }
    });

    if (hasInvalidNumber) {
      Core.safeShowToast(Core.t("invalidNumber") || "Please enter valid positive numbers for all allocations.", "warning");
      return;
    }

    // Hard constraint 1: Cannot allocate more than total line budget
    if (total > 0 && totalLmAlloc > total) {
      Core.safeShowToast(
        (Core.t("budgetOverAllocated") || "Total allocated exceeds available budget!") +
        ` (${totalLmAlloc.toLocaleString("en-US")} / ${total.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
        "danger"
      );
      return;
    }

    // Hard constraint 2: Cannot reduce LM allocation below already distributed DM amount
    for (const [lmId, val] of Object.entries(tempAllocations)) {
      const dmsUnderLm = Core.getDmsUnderLmForLine(lmId, lineId);
      const existingDmSum = dmsUnderLm.reduce(
        (sum, dm) => sum + ((budgets[lineId].dmAllocations && budgets[lineId].dmAllocations[dm.id]) || 0),
        0
      );
      if (val < existingDmSum) {
        Core.safeShowToast(
          (Core.t("budgetExceedsDistributed") || "Cannot reduce budget below already distributed amount.") +
          ` (${Core.getUserDisplayName(lmId)}: distributed ${existingDmSum.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}, proposed ${val.toLocaleString("en-US")})`,
          "danger"
        );
        return;
      }
    }

    budgets[lineId].totalBudget = total;
    if (!budgets[lineId].lmAllocations) budgets[lineId].lmAllocations = {};
    budgets[lineId].lmAllocations = tempAllocations;

    Core.StoreAdapter.saveBudgets(budgets);
    Core.safeShowToast(Core.t("savedBudgetMessage") || "Budget allocations saved successfully.", "success");
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
        bodyEl.innerHTML = `<div class="budget-modal-empty">
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
          <tr class="budget-detail-tr">
            <td class="budget-detail-td-name">${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</td>
            <td class="budget-detail-td-code"><span class="badge budget-code-badge">${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td class="budget-detail-td-val">${alloc.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</td>
          </tr>
        `;
      });

      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="budget-modal-summary">
            ${Core.t("totalDmAllocation") || "Total allocated to DMs"}: <strong class="budget-modal-total">${totalAlloc.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</strong>
          </div>
          <div class="table-responsive">
            <table class="table budget-detail-table">
              <thead>
                <tr class="budget-detail-tr-head">
                  <th class="budget-detail-th">${Core.t("name") || "District Manager"}</th>
                  <th class="budget-detail-th">${Core.t("code") || "Code"}</th>
                  <th class="budget-detail-th text-end">${Core.t("allocation") || "Allocated"}</th>
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
      tbody.innerHTML = `<tr><td colspan="4" class="budget-empty-cell">${Core.t("noDmsUnderLm") || "No District Managers assigned to you in this line."}</td></tr>`;
      return;
    }

    const allServices = Core.StoreAdapter.getServices();
    tbody.innerHTML = dmsUnderLm
      .map((dm) => {
        const curAlloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        let dmUtilized = 0;
        allServices.forEach((s) => {
          if (s.isShared && Array.isArray(s.shares)) {
            s.shares.forEach((sh) => {
              if (sh.lineId === lineId && (sh.dmId === dm.id || sh.requesterId === dm.id) && (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)) {
                dmUtilized += Number(sh.shareAmount || 0);
              }
            });
          } else if (s.lineId === lineId && s.requesterId === dm.id && s.status === Core.REQUEST_STATUS.APPROVED) {
            dmUtilized += Number(s.cost || 0);
          }
        });

        return `
          <tr>
            <td>
              <div class="budget-user-name">${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</div>
              <small class="budget-user-email">${Core.escapeHTML(dm.email || "")}</small>
            </td>
            <td><span class="badge budget-code-badge">${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td>
              <input type="number" class="form-control lm-dm-alloc-input budget-alloc-input" data-dmid="${dm.id}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateLmAllocationPreview()" />
            </td>
            <td class="budget-sum-cell">${dmUtilized.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</td>
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
    if (spentEl) spentEl.textContent = `${distributed.toLocaleString("en-US")} ${curr}`;
    if (remTitle) remTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
    if (remEl) {
      remEl.textContent = `${remaining.toLocaleString("en-US")} ${curr}`;
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
          <td colspan="4" class="budget-empty-cell">
            ${Core.t("noRepsFound") || "No medical reps found assigned under your district for this product line."}
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
              <div class="budget-user-name">${Core.escapeHTML(Core.getUserDisplayName(rep.id))}</div>
              <small class="budget-user-email">${Core.escapeHTML(rep.email || "")}</small>
            </td>
            <td><span class="badge budget-code-badge">${Core.escapeHTML(rep.employeeCode || rep.id)}</span></td>
            <td>
              <input type="number" class="form-control dm-rep-alloc-input budget-alloc-input" data-repid="${rep.id}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateDmAllocationPreview()" />
            </td>
            <td class="budget-sum-cell">${repUtilized.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</td>
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
    if (spentEl) spentEl.textContent = `${distributed.toLocaleString("en-US")} ${curr}`;
    if (remTitle) remTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
    if (remEl) {
      remEl.textContent = `${remaining.toLocaleString("en-US")} ${curr}`;
      remEl.style.color = remaining < 0 ? "var(--danger)" : "var(--success)";
    }
  }

  function saveDmRepAllocations() {
    Core._state.currentUser = Core.getAuthUser();
    if (!Core.isActionAuthorized("allocate_rep_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedRepBudgetAction") || "You are not authorized to edit representative allocations.", "danger");
      return;
    }
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || (Core.getAllProductLines()[0] ? Core.getAllProductLines()[0].id : "");
    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {} };
    if (!budgets[lineId].repAllocations) budgets[lineId].repAllocations = {};

    const allUsers = Core.getAllUsers();
    const myRepIds = allUsers.filter((u) => u.managerId === Core._state.currentUser.id).map((u) => u.id);

    let totalAlloc = 0;
    const tempAlloc = {};
    let hasInvalidRepNumber = false;
    document.querySelectorAll(".dm-rep-alloc-input").forEach((inp) => {
      const repId = inp.dataset.repid;
      if (repId && (myRepIds.includes(repId) || Core._state.currentUser.role === Core.ROLES.ADMIN)) {
        const val = Number(inp.value);
        if (!Number.isFinite(val) || val < 0) {
          hasInvalidRepNumber = true;
          return;
        }
        tempAlloc[repId] = val;
        totalAlloc += val;
      }
    });

    if (hasInvalidRepNumber) {
      Core.safeShowToast(Core.t("invalidNumber") || "Please enter valid positive numbers for all allocations.", "warning");
      return;
    }

    const myDmAlloc = (budgets[lineId].dmAllocations && Number(budgets[lineId].dmAllocations[Core._state.currentUser.id])) || 0;
    if (myDmAlloc > 0 && totalAlloc > myDmAlloc) {
      Core.safeShowToast(
        (Core.t("budgetOverAllocated") || "Total allocated to reps exceeds your available territory budget.") +
        ` (${totalAlloc.toLocaleString("en-US")} / ${myDmAlloc.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
        "danger"
      );
      return; // Hard constraint: do not save!
    }

    Object.assign(budgets[lineId].repAllocations, tempAlloc);
    Core.StoreAdapter.saveBudgets(budgets);
    Core.safeShowToast(Core.t("savedRepBudgetMessage") || "Rep allocations saved successfully.", "success");
    if (window.ActivitiesServices && window.ActivitiesServices.renderServicesTab) {
      window.ActivitiesServices.renderServicesTab();
    }
  }

  function saveDmAllocations() {
    Core._state.currentUser = Core.getAuthUser();
    if (!Core.isActionAuthorized("allocate_lm_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedDmBudgetAction") || "You are not authorized to edit district manager allocations.", "danger");
      return;
    }
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || (Core.getAllProductLines()[0] ? Core.getAllProductLines()[0].id : "");
    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
    if (!budgets[lineId].dmAllocations) budgets[lineId].dmAllocations = {};

    const allowedDms = Core.getDmsUnderLmForLine(Core._state.currentUser.id, lineId).map((d) => d.id);

    let totalAlloc = 0;
    const tempAlloc = {};
    let hasInvalidDmNumber = false;
    document.querySelectorAll(".lm-dm-alloc-input").forEach((inp) => {
      const dmId = inp.dataset.dmid;
      if (dmId && (allowedDms.includes(dmId) || Core._state.currentUser.role === Core.ROLES.ADMIN)) {
        const val = Number(inp.value);
        if (!Number.isFinite(val) || val < 0) {
          hasInvalidDmNumber = true;
          return;
        }
        tempAlloc[dmId] = val;
        totalAlloc += val;
      }
    });

    if (hasInvalidDmNumber) {
      Core.safeShowToast(Core.t("invalidNumber") || "Please enter valid positive numbers for all allocations.", "warning");
      return;
    }

    const myLmAlloc = (budgets[lineId].lmAllocations && Number(budgets[lineId].lmAllocations[Core._state.currentUser.id])) || 0;
    if (myLmAlloc > 0 && totalAlloc > myLmAlloc) {
      Core.safeShowToast(
        (Core.t("budgetOverAllocated") || "Total allocated to district managers exceeds your available line budget.") +
        ` (${totalAlloc.toLocaleString("en-US")} / ${myLmAlloc.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
        "danger"
      );
      return; // Hard constraint: do not save!
    }

    // Sub-budget protection: Cannot reduce DM budget below what they already allocated to Reps
    const allUsers = Core.getAllUsers();
    for (const [dmId, val] of Object.entries(tempAlloc)) {
      const repsUnderDm = allUsers.filter((u) => u.managerId === dmId);
      const existingRepSum = repsUnderDm.reduce(
        (sum, r) => sum + ((budgets[lineId].repAllocations && budgets[lineId].repAllocations[r.id]) || 0),
        0
      );
      if (val < existingRepSum) {
        Core.safeShowToast(
          (Core.t("budgetExceedsDistributed") || "Cannot reduce budget below already distributed amount.") +
          ` (${Core.getUserDisplayName(dmId)}: distributed ${existingRepSum.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}, proposed ${val.toLocaleString("en-US")})`,
          "danger"
        );
        return;
      }
    }

    Object.assign(budgets[lineId].dmAllocations, tempAlloc);
    Core.StoreAdapter.saveBudgets(budgets);
    Core.safeShowToast(Core.t("savedDmBudgetMessage") || "District manager allocations saved successfully.", "success");
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