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
      buSelect.innerHTML = allLines.map((l) => `<option value="${Core.escapeHTML(l.id)}">${Core.escapeHTML(l.name)}</option>`).join("");
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
                  <input type="number" class="form-control bu-lm-input budget-alloc-input-bu" data-lmid="${Core.escapeHTML(lm.id)}" value="${alloc}" min="0" step="1000" oninput="ActivitiesModule.calculateBuBudgetSummary()" />
                </td>
                <td class="budget-sum-cell">${dmSum.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</td>
                <td>
                  <button type="button" class="btn btn-outline budget-inspect-btn" onclick="ActivitiesModule.openLmDetailModal('${Core.escapeHTML(lm.id)}', '${Core.escapeHTML(lineId)}')">
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
    const rawLineId = buSelect?.value;
    const allLines = Core.getAllProductLines();
    const validLine = allLines.find((l) => l.id === rawLineId);
    if (!rawLineId || rawLineId === "all" || !validLine) {
      Core.safeShowToast(Core.t("selectValidLineWarning") || "Please select a specific valid product line.", "warning");
      return;
    }
    const userLines = Core.getUserAssignedLines(Core._state.currentUser).map((l) => l.id);
    if (Core._state.currentUser.role !== Core.ROLES.ADMIN && (!userLines.includes(rawLineId) && userLines.length > 0)) {
      Core.safeShowToast(Core.t("unauthorizedLineAction") || "You are not authorized for this product line.", "danger");
      return;
    }
    const lineId = rawLineId;

    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    const rawTotal = parseFloat(totalInput?.value);
    if (!Number.isFinite(rawTotal) || rawTotal < 0) {
      Core.safeShowToast(Core.t("invalidNumber") || "Please enter a valid positive number for total budget.", "warning");
      return;
    }
    const total = rawTotal;

    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {}, auditLog: [] };
    if (!Array.isArray(budgets[lineId].auditLog)) budgets[lineId].auditLog = [];

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

    // Hard constraint 1: Cannot allocate more than total line budget (even if total === 0)
    if (totalLmAlloc > total) {
      Core.safeShowToast(
        (Core.t("budgetOverAllocated") || "Total allocated exceeds available budget!") +
        ` (${totalLmAlloc.toLocaleString("en-US")} / ${total.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
        "danger"
      );
      return;
    }

    // Hard constraint 2: Cannot reduce LM allocation below already distributed DM amount OR LM utilized amount
    const allServices = Core.StoreAdapter.getServices();
    for (const [lmId, val] of Object.entries(tempAllocations)) {
      const dmsUnderLm = Core.getDmsUnderLmForLine(lmId, lineId);
      const existingDmSum = dmsUnderLm.reduce(
        (sum, dm) => sum + ((budgets[lineId].dmAllocations && budgets[lineId].dmAllocations[dm.id]) || 0),
        0
      );
      let lmUtilized = 0;
      let lmPending = 0;
      const allUsers = Core.getAllUsers();
      const lmDmIds = new Set(dmsUnderLm.map(d => d.id));
      const lmReps = allUsers.filter(u => {
        const uRole = Core.getNormalizedRole ? Core.getNormalizedRole(u) : u.role;
        return (uRole === Core.ROLES.REP || uRole === Core.ROLES.REP_ALT) && (u.managerId === lmId || lmDmIds.has(u.managerId));
      });
      const lmTeamIds = new Set([lmId, ...lmDmIds, ...lmReps.map(r => r.id)]);

      allServices.forEach((s) => {
        if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") return;
        if (s.isShared && Array.isArray(s.shares)) {
          s.shares.forEach((sh) => {
            if (sh.lineId === lineId && (lmTeamIds.has(sh.lmId) || lmTeamIds.has(sh.dmId) || lmTeamIds.has(sh.repId) || lmTeamIds.has(sh.requesterId))) {
              if (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED) {
                lmUtilized += Number(sh.shareAmount || 0);
              } else if (String(sh.status || s.status || "").startsWith("pending")) {
                lmPending += Number(sh.shareAmount || 0);
              }
            }
          });
        } else if (s.lineId === lineId && lmTeamIds.has(s.requesterId)) {
          if (s.status === Core.REQUEST_STATUS.APPROVED) {
            lmUtilized += Number(s.cost || 0);
          } else if (String(s.status || "").startsWith("pending")) {
            lmPending += Number(s.cost || 0);
          }
        }
      });

      const lmFloor = Math.max(existingDmSum, lmUtilized + lmPending);
      if (val < lmFloor) {
        Core.safeShowToast(
          (Core.t("cannotReduceBelowUtilized") || "Cannot reduce allocation below already spent/utilized amount.") +
          ` (${Core.getUserDisplayName(lmId)}: required min ${lmFloor.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}, proposed ${val.toLocaleString("en-US")})`,
          "danger"
        );
        return;
      }
    }

    const oldTotal = budgets[lineId].totalBudget || 0;
    if (oldTotal !== total) {
      budgets[lineId].auditLog.push({
        timestamp: new Date().toISOString(),
        actorId: Core._state.currentUser.id,
        targetId: lineId,
        targetType: "line_total",
        oldValue: oldTotal,
        newValue: total
      });
    }

    if (!budgets[lineId].lmAllocations) budgets[lineId].lmAllocations = {};
    for (const [lmId, val] of Object.entries(tempAllocations)) {
      const oldVal = Number(budgets[lineId].lmAllocations[lmId] || 0);
      if (oldVal !== val) {
        budgets[lineId].auditLog.push({
          timestamp: new Date().toISOString(),
          actorId: Core._state.currentUser.id,
          targetId: lmId,
          targetType: "lm",
          oldValue: oldVal,
          newValue: val,
          lineId: lineId
        });
        Core.dispatchWorkflowNotification({
          userId: lmId,
          type: "budget_update",
          title: "Line Manager Budget Updated",
          message: `Your budget for line ${lineId} was updated from ${oldVal.toLocaleString("en-US")} to ${val.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}.`,
          link: "activities.html#services",
          icon: "💰",
          badgeClass: "bg-info",
          actorName: Core.getUserDisplayName(Core._state.currentUser.id),
          action: "updated"
        });
      }
    }

    budgets[lineId].totalBudget = total;
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

    const allUsers = Core.getAllUsers();
    const allServices = Core.StoreAdapter.getServices();
    tbody.innerHTML = dmsUnderLm
      .map((dm) => {
        const curAlloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        const repsUnderDmIds = new Set(
          allUsers
            .filter((u) => (u.managerId === dm.id || u.dmId === dm.id) && (u.role === Core.ROLES.REP || u.role === Core.ROLES.REP_ALT))
            .map((u) => u.id)
        );
        let dmUtilized = 0;
        allServices.forEach((s) => {
          if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") return;
          if (s.isShared && Array.isArray(s.shares)) {
            s.shares.forEach((sh) => {
              if (
                sh.lineId === lineId &&
                (sh.dmId === dm.id || sh.requesterId === dm.id || repsUnderDmIds.has(sh.repId)) &&
                (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)
              ) {
                dmUtilized += Number(sh.shareAmount || 0);
              }
            });
          } else if (
            s.lineId === lineId &&
            (s.requesterId === dm.id || repsUnderDmIds.has(s.requesterId)) &&
            s.status === Core.REQUEST_STATUS.APPROVED
          ) {
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
              <input type="number" class="form-control lm-dm-alloc-input budget-alloc-input" data-dmid="${Core.escapeHTML(dm.id)}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateLmAllocationPreview()" />
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
      const val = parseFloat(inp.value);
      if (Number.isFinite(val) && val >= 0) distributed += val;
    });

    // Calculate LM direct utilized for this line
    let directLmUtilized = 0;
    const allServices = Core.StoreAdapter.getServices();
    allServices.forEach((s) => {
      if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") return;
      if (s.isShared && Array.isArray(s.shares)) {
        s.shares.forEach((sh) => {
          if (sh.lineId === lineId && (sh.lmId === Core._state.currentUser.id || sh.requesterId === Core._state.currentUser.id) && (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)) {
            directLmUtilized += Number(sh.shareAmount || 0);
          }
        });
      } else if (s.lineId === lineId && s.requesterId === Core._state.currentUser.id && s.status === Core.REQUEST_STATUS.APPROVED) {
        directLmUtilized += Number(s.cost || 0);
      }
    });

    const committed = distributed + directLmUtilized;
    const remaining = Math.max(0, myLmAlloc - committed);
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
              <input type="number" class="form-control dm-rep-alloc-input budget-alloc-input" data-repid="${Core.escapeHTML(rep.id)}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateDmAllocationPreview()" />
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
      const val = parseFloat(inp.value);
      if (Number.isFinite(val) && val >= 0) distributed += val;
    });

    // Calculate DM direct utilized for this line
    let directDmUtilized = 0;
    const allServices = Core.StoreAdapter.getServices();
    allServices.forEach((s) => {
      if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") return;
      if (s.isShared && Array.isArray(s.shares)) {
        s.shares.forEach((sh) => {
          if (sh.lineId === lineId && (sh.dmId === Core._state.currentUser.id || sh.requesterId === Core._state.currentUser.id) && (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)) {
            directDmUtilized += Number(sh.shareAmount || 0);
          }
        });
      } else if (s.lineId === lineId && s.requesterId === Core._state.currentUser.id && s.status === Core.REQUEST_STATUS.APPROVED) {
        directDmUtilized += Number(s.cost || 0);
      }
    });

    const committed = distributed + directDmUtilized;
    const remaining = Math.max(0, myDmAlloc - committed);
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
    const rawLineId = lineSelect?.value;
    const allLines = Core.getAllProductLines();
    const validLine = allLines.find((l) => l.id === rawLineId);
    if (!rawLineId || rawLineId === "all" || !validLine) {
      Core.safeShowToast(Core.t("selectValidLineWarning") || "Please select a specific valid product line.", "warning");
      return;
    }
    const userLines = Core.getUserAssignedLines(Core._state.currentUser).map((l) => l.id);
    if (Core._state.currentUser.role !== Core.ROLES.ADMIN && (!userLines.includes(rawLineId) && userLines.length > 0)) {
      Core.safeShowToast(Core.t("unauthorizedLineAction") || "You are not authorized for this product line.", "danger");
      return;
    }
    const lineId = rawLineId;

    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {}, auditLog: [] };
    if (!budgets[lineId].repAllocations) budgets[lineId].repAllocations = {};
    if (!Array.isArray(budgets[lineId].auditLog)) budgets[lineId].auditLog = [];

    const allUsers = Core.getAllUsers();
    let myRepIds = [];
    const curRole = Core.getNormalizedRole ? Core.getNormalizedRole(Core._state.currentUser) : Core._state.currentUser.role;
    if (curRole === Core.ROLES.DM) {
      myRepIds = allUsers.filter((u) => u.managerId === Core._state.currentUser.id).map((u) => u.id);
    } else if (curRole === Core.ROLES.LM) {
      const myDms = allUsers.filter((u) => u.role === Core.ROLES.DM && u.managerId === Core._state.currentUser.id).map(d => d.id);
      myRepIds = allUsers.filter((u) => (u.role === Core.ROLES.REP || u.role === Core.ROLES.REP_ALT) && myDms.includes(u.managerId)).map(r => r.id);
    } else if (curRole === Core.ROLES.BU || curRole === Core.ROLES.ADMIN) {
      myRepIds = allUsers.filter((u) => u.role === Core.ROLES.REP || u.role === Core.ROLES.REP_ALT).map(r => r.id);
    }

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

    // Hierarchical ceiling check: Group proposed rep allocations by their respective DM (managerId)
    // Regardless of whether this screen was opened by DM, LM, BU, or Admin,
    // the total allocated to reps under any specific DM cannot exceed that specific DM's budget allocation.
    const allocByDm = {};
    for (const [repId, val] of Object.entries(tempAlloc)) {
      const repObj = allUsers.find((u) => u.id === repId);
      const dmId = repObj ? repObj.managerId : null;
      if (dmId) {
        allocByDm[dmId] = (allocByDm[dmId] || 0) + val;
      }
    }

    for (const [dmId, repSum] of Object.entries(allocByDm)) {
      const dmAlloc = (budgets[lineId].dmAllocations && Number(budgets[lineId].dmAllocations[dmId])) || 0;
      if (repSum > dmAlloc) {
        Core.safeShowToast(
          (Core.t("budgetOverAllocated") || "Total allocated to reps exceeds territory budget.") +
          ` (${Core.getUserDisplayName(dmId)}: allocated ${repSum.toLocaleString("en-US")} / ${dmAlloc.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
          "danger"
        );
        return; // Hard constraint: do not save!
      }
    }

    // Sub-budget protection: Cannot reduce Rep budget below what they already utilized
    const allServices = Core.StoreAdapter.getServices();
    for (const [repId, val] of Object.entries(tempAlloc)) {
      let repUtilized = 0;
      let repPending = 0;
      allServices.forEach((s) => {
        if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") return;
        if (s.isShared && Array.isArray(s.shares)) {
          s.shares.forEach((sh) => {
            if (sh.lineId === lineId && sh.repId === repId) {
              if (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED) {
                repUtilized += Number(sh.shareAmount || 0);
              } else if (String(sh.status || s.status || "").startsWith("pending")) {
                repPending += Number(sh.shareAmount || 0);
              }
            }
          });
        } else if (s.lineId === lineId && s.requesterId === repId) {
          if (s.status === Core.REQUEST_STATUS.APPROVED) {
            repUtilized += Number(s.cost || 0);
          } else if (String(s.status || "").startsWith("pending")) {
            repPending += Number(s.cost || 0);
          }
        }
      });

      const repFloor = repUtilized + repPending;
      if (val < repFloor) {
        Core.safeShowToast(
          (Core.t("cannotReduceBelowUtilized") || "Cannot reduce allocation below already spent/utilized amount.") +
          ` (${Core.getUserDisplayName(repId)}: required min ${repFloor.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}, proposed ${val.toLocaleString("en-US")})`,
          "danger"
        );
        return;
      }
    }

    for (const [repId, val] of Object.entries(tempAlloc)) {
      const oldVal = Number(budgets[lineId].repAllocations[repId] || 0);
      if (oldVal !== val) {
        budgets[lineId].auditLog.push({
          timestamp: new Date().toISOString(),
          actorId: Core._state.currentUser.id,
          targetId: repId,
          targetType: "rep",
          oldValue: oldVal,
          newValue: val,
          lineId: lineId
        });
        Core.dispatchWorkflowNotification({
          userId: repId,
          type: "budget_update",
          title: "Medical Representative Budget Updated",
          message: `Your budget for line ${lineId} was updated from ${oldVal.toLocaleString("en-US")} to ${val.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}.`,
          link: "activities.html#services",
          icon: "💰",
          badgeClass: "bg-info",
          actorName: Core.getUserDisplayName(Core._state.currentUser.id),
          action: "updated"
        });
      }
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
    if ((Core.getNormalizedRole ? Core.getNormalizedRole(Core._state.currentUser) : Core._state.currentUser.role) === Core.ROLES.DM) {
      Core.safeShowToast(Core.t("unauthorizedDmBudgetAction") || "You are not authorized to edit district manager allocations.", "danger");
      return;
    }
    if (!Core.isActionAuthorized("allocate_dm_budget", null, Core._state.currentUser)) {
      Core.safeShowToast(Core.t("unauthorizedDmBudgetAction") || "You are not authorized to edit district manager allocations.", "danger");
      return;
    }
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const rawLineId = lineSelect?.value;
    const allLines = Core.getAllProductLines();
    const validLine = allLines.find((l) => l.id === rawLineId);
    if (!rawLineId || rawLineId === "all" || !validLine) {
      Core.safeShowToast(Core.t("selectValidLineWarning") || "Please select a specific valid product line.", "warning");
      return;
    }
    const userLines = Core.getUserAssignedLines(Core._state.currentUser).map((l) => l.id);
    if (Core._state.currentUser.role !== Core.ROLES.ADMIN && (!userLines.includes(rawLineId) && userLines.length > 0)) {
      Core.safeShowToast(Core.t("unauthorizedLineAction") || "You are not authorized for this product line.", "danger");
      return;
    }
    const lineId = rawLineId;

    const budgets = Core.StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {}, auditLog: [] };
    if (!budgets[lineId].dmAllocations) budgets[lineId].dmAllocations = {};
    if (!Array.isArray(budgets[lineId].auditLog)) budgets[lineId].auditLog = [];

    const allowedDms = Core.getDmsUnderLmForLine(Core._state.currentUser.id, lineId).map((d) => d.id);

    let totalAlloc = 0;
    const tempAlloc = {};
    let hasInvalidDmNumber = false;
    document.querySelectorAll(".lm-dm-alloc-input").forEach((inp) => {
      const dmId = inp.dataset.dmid;
      if (dmId && (allowedDms.includes(dmId) || Core._state.currentUser.role === Core.ROLES.ADMIN || Core._state.currentUser.role === Core.ROLES.BU)) {
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
    if ((Core.getNormalizedRole ? Core.getNormalizedRole(Core._state.currentUser) : Core._state.currentUser.role) === Core.ROLES.LM) {
      if (totalAlloc > myLmAlloc) {
        Core.safeShowToast(
          (Core.t("budgetOverAllocated") || "Total allocated to district managers exceeds your available line budget.") +
          ` (${totalAlloc.toLocaleString("en-US")} / ${myLmAlloc.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
          "danger"
        );
        return; // Hard constraint: do not save!
      }
    } else if (Core._state.currentUser.role === Core.ROLES.BU) {
      const lineTotal = budgets[lineId].totalBudget || 0;
      if (totalAlloc > lineTotal) {
        Core.safeShowToast(
          (Core.t("budgetOverAllocated") || "Total allocated to district managers exceeds your available line budget.") +
          ` (${totalAlloc.toLocaleString("en-US")} / ${lineTotal.toLocaleString("en-US")} ${Core.t("currency") || "EGP"})`,
          "danger"
        );
        return;
      }
    }

    // Sub-budget protection: Cannot reduce DM budget below what they already allocated to Reps OR what DM utilized
    const allUsers = Core.getAllUsers();
    const allServices = Core.StoreAdapter.getServices();
    for (const [dmId, val] of Object.entries(tempAlloc)) {
      const repsUnderDm = allUsers.filter((u) => (u.managerId === dmId || u.dmId === dmId) && (u.role === Core.ROLES.REP || u.role === Core.ROLES.REP_ALT));
      const repsUnderDmIds = new Set(repsUnderDm.map((u) => u.id));
      const existingRepSum = repsUnderDm.reduce(
        (sum, r) => sum + ((budgets[lineId].repAllocations && budgets[lineId].repAllocations[r.id]) || 0),
        0
      );
      let dmUtilized = 0;
      let dmPending = 0;
      allServices.forEach((s) => {
        if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") return;
        if (s.isShared && Array.isArray(s.shares)) {
          s.shares.forEach((sh) => {
            if (
              sh.lineId === lineId &&
              (sh.dmId === dmId || sh.requesterId === dmId || repsUnderDmIds.has(sh.repId))
            ) {
              if (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED) {
                dmUtilized += Number(sh.shareAmount || 0);
              } else if (String(sh.status || s.status || "").startsWith("pending")) {
                dmPending += Number(sh.shareAmount || 0);
              }
            }
          });
        } else if (
          s.lineId === lineId &&
          (s.requesterId === dmId || repsUnderDmIds.has(s.requesterId))
        ) {
          if (s.status === Core.REQUEST_STATUS.APPROVED) {
            dmUtilized += Number(s.cost || 0);
          } else if (String(s.status || "").startsWith("pending")) {
            dmPending += Number(s.cost || 0);
          }
        }
      });

      const dmFloor = Math.max(existingRepSum, dmUtilized + dmPending);
      if (val < dmFloor) {
        Core.safeShowToast(
          (Core.t("cannotReduceBelowUtilized") || "Cannot reduce allocation below already spent/utilized amount.") +
          ` (${Core.getUserDisplayName(dmId)}: required min ${dmFloor.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}, proposed ${val.toLocaleString("en-US")})`,
          "danger"
        );
        return;
      }
    }

    for (const [dmId, val] of Object.entries(tempAlloc)) {
      const oldVal = Number(budgets[lineId].dmAllocations[dmId] || 0);
      if (oldVal !== val) {
        budgets[lineId].auditLog.push({
          timestamp: new Date().toISOString(),
          actorId: Core._state.currentUser.id,
          targetId: dmId,
          targetType: "dm",
          oldValue: oldVal,
          newValue: val,
          lineId: lineId
        });
        Core.dispatchWorkflowNotification({
          userId: dmId,
          type: "budget_update",
          title: "District Manager Budget Updated",
          message: `Your budget for line ${lineId} was updated from ${oldVal.toLocaleString("en-US")} to ${val.toLocaleString("en-US")} ${Core.t("currency") || "EGP"}.`,
          link: "activities.html#services",
          icon: "💰",
          badgeClass: "bg-info",
          actorName: Core.getUserDisplayName(Core._state.currentUser.id),
          action: "updated"
        });
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