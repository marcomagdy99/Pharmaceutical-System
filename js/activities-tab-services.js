/**
 * @file activities-tab-services.js
 * @description Tab 3: Doctor & Hospital Services, Dynamic Multi-Line & Intra-Line Shared Services Engine
 */

(function (window) {
  "use strict";
  const Core = window.ActivitiesCore;
  if (!Core) return;

  function populateServiceFilters() {
    Core._state.currentUser = Core.getAuthUser();
    const user = Core._state.currentUser;

    // 1. Line select in budget strip
    const lineSelect = document.getElementById("serviceBudgetLineSelect");
    if (lineSelect && lineSelect.children.length === 0) {
      const assignedLines = Core.getUserAssignedLines(user);
      if (assignedLines.length > 0) {
        lineSelect.innerHTML = assignedLines.map((l) => `<option value="${l.id}">${Core.escapeHTML(l.name)}</option>`).join("");
        lineSelect.value = assignedLines[0].id;
      }
    }

    // 2. Employee filter in table controls
    const empSelect = document.getElementById("serviceFilterEmployee");
    if (empSelect) {
      const role = (user?.role || "").toLowerCase();
      if (role === Core.ROLES.REP || role === Core.ROLES.REP_ALT) {
        empSelect.style.display = "none";
      } else {
        empSelect.style.display = "inline-block";
        const selectedLine = lineSelect?.value || "all";
        const subs = Core.getSubordinatesForUser(user, selectedLine);
        const curVal = empSelect.value;
        empSelect.innerHTML = `
          <option value="all">${Core.t("allEmployees")}</option>
          <option value="${user?.id || ""}">${Core.t("myRequestsOnly")}</option>
          ${subs
            .map(
              (s) =>
                `<option value="${s.id}">${Core.escapeHTML(Core.getUserDisplayName(s.id))} (${Core.escapeHTML(
                  Core.getUserRoleLabel(s.role)
                )})</option>`
            )
            .join("")}
        `;
        if (curVal && empSelect.querySelector(`option[value="${curVal}"]`)) {
          empSelect.value = curVal;
        } else {
          empSelect.value = "all";
        }
      }
    }
  }

  function renderServicesTab() {
    populateServiceFilters();
    filterServices();
    renderServicesBudgetStrip();
  }

  function getBudgetMetricsForUser(lineId, user) {
    const budgets = Core.StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {}, repAllocations: {} };
    const allServices = Core.StoreAdapter.getServices();

    let allocated = 0;
    let distributed = 0;
    let utilized = 0;
    let pending = 0;
    let remaining = 0;

    function getLineSharesList(s) {
      if (s.status === Core.REQUEST_STATUS.REJECTED || s.status === "rejected" || s.status === "cancelled") {
        return [];
      }
      if (s.isShared && Array.isArray(s.shares) && s.shares.length > 0) {
        return s.shares
          .filter((sh) => sh.lineId === lineId)
          .map((sh) => ({
            cost: Number(sh.shareAmount || 0),
            status: sh.status || s.status,
            repId: sh.repId || s.requesterId
          }));
      }
      if (s.lineId === lineId) {
        return [{
          cost: Number(s.cost || 0),
          status: s.status,
          repId: s.requesterId
        }];
      }
      return [];
    }

    const role = (user && user.role) ? user.role.toLowerCase() : "";

    if (role === Core.ROLES.LM) {
      allocated = (lineBudget.lmAllocations && Number(lineBudget.lmAllocations[user.id])) || 0;
      const dms = Core.getDmsUnderLmForLine(user.id, lineId);
      distributed = dms.reduce((sum, dm) => sum + ((lineBudget.dmAllocations && Number(lineBudget.dmAllocations[dm.id])) || 0), 0);

      allServices.forEach((s) => {
        const items = getLineSharesList(s);
        items.forEach((item) => {
          if (item.status === Core.REQUEST_STATUS.APPROVED) utilized += item.cost;
          if (item.status && item.status.startsWith("pending")) pending += item.cost;
        });
      });
      // For LM: Remaining is the unallocated budget not yet distributed to DMs
      remaining = allocated - distributed;
    } else if (role === Core.ROLES.DM) {
      allocated = (lineBudget.dmAllocations && Number(lineBudget.dmAllocations[user.id])) || 0;
      const allUsers = Core.getAllUsers();
      const myReps = allUsers.filter((u) => {
        const isRep = u.role === Core.ROLES.REP || u.role === Core.ROLES.REP_ALT;
        const isSub = u.managerId === user.id;
        const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
        return isRep && isSub && uLines.includes(lineId);
      });
      distributed = myReps.reduce((sum, rep) => sum + ((lineBudget.repAllocations && Number(lineBudget.repAllocations[rep.id])) || 0), 0);

      allServices.forEach((s) => {
        const items = getLineSharesList(s);
        items.forEach((item) => {
          const rep = Core.getUserById(item.repId);
          if (item.repId === user.id || (rep && rep.managerId === user.id)) {
            if (item.status === Core.REQUEST_STATUS.APPROVED) utilized += item.cost;
            if (item.status && item.status.startsWith("pending")) pending += item.cost;
          }
        });
      });
      // For DM: Remaining is the district budget not yet distributed to Reps
      remaining = allocated - distributed;
    } else if (role === Core.ROLES.REP || role === Core.ROLES.REP_ALT) {
      // For Medical Rep: Allocated budget set by DM, defaults to 0 if not set!
      allocated = (lineBudget.repAllocations && Number(lineBudget.repAllocations[user.id])) || 0;
      allServices.forEach((s) => {
        const items = getLineSharesList(s);
        items.forEach((item) => {
          if (item.repId === user.id) {
            if (item.status === Core.REQUEST_STATUS.APPROVED) utilized += item.cost;
            if (item.status && item.status.startsWith("pending")) pending += item.cost;
          }
        });
      });
      // For Rep: Remaining is their personal allocated budget minus utilized
      remaining = allocated - utilized;
    } else {
      // BU / Admin
      allocated = Number(lineBudget.totalBudget) || 0;
      if (lineBudget.lmAllocations) {
        distributed = Object.values(lineBudget.lmAllocations).reduce((sum, v) => sum + Number(v || 0), 0);
      }
      allServices.forEach((s) => {
        const items = getLineSharesList(s);
        items.forEach((item) => {
          if (item.status === Core.REQUEST_STATUS.APPROVED) utilized += item.cost;
          if (item.status && item.status.startsWith("pending")) pending += item.cost;
        });
      });
      remaining = allocated - distributed;
    }

    return { allocated, distributed, utilized, pending, remaining };
  }

  function renderServicesBudgetStrip() {
    const user = Core._state.currentUser;
    const lineSelect = document.getElementById("serviceBudgetLineSelect");
    if (!lineSelect) return;

    const assignedLines = Core.getUserAssignedLines(user);
    if (assignedLines.length === 0) return;

    if (!lineSelect.value || !assignedLines.some((l) => l.id === lineSelect.value)) {
      lineSelect.innerHTML = assignedLines.map((l) => `<option value="${l.id}">${Core.escapeHTML(l.name)}</option>`).join("");
      lineSelect.value = assignedLines[0].id;
    }

    const lineId = lineSelect.value;
    const metrics = getBudgetMetricsForUser(lineId, user);
    const role = (user && user.role) ? user.role.toLowerCase() : "";
    const curr = Core.t("currency") || "EGP";

    const aTitle = document.getElementById("srvMetricTotalTitle");
    const aEl = document.getElementById("srvMetricTotal");
    const uTitle = document.getElementById("srvMetricApprovedTitle");
    const uEl = document.getElementById("srvMetricApproved");
    const pTitle = document.getElementById("srvMetricPendingTitle");
    const pEl = document.getElementById("srvMetricPending");
    const rTitle = document.getElementById("srvMetricRemainingTitle");
    const rEl = document.getElementById("srvMetricRemaining");

    if (role === Core.ROLES.LM) {
      if (aTitle) aTitle.textContent = Core.t("totalAllocatedBudget") || "Total Line Budget";
      if (aEl) aEl.textContent = `${metrics.allocated.toLocaleString()} ${curr}`;

      if (uTitle) uTitle.textContent = Core.t("distributedToDms") || "Distributed to DMs";
      if (uEl) uEl.textContent = `${metrics.distributed.toLocaleString()} ${curr}`;

      if (pTitle) pTitle.textContent = Core.t("pendingServices") || "Pending In Requests";
      if (pEl) pEl.textContent = `${metrics.pending.toLocaleString()} ${curr}`;

      if (rTitle) rTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
      if (rEl) {
        rEl.textContent = `${metrics.remaining.toLocaleString()} ${curr}`;
        rEl.style.color = metrics.remaining < 0 ? "var(--danger)" : "var(--success)";
      }
    } else if (role === Core.ROLES.DM) {
      if (aTitle) aTitle.textContent = Core.t("districtBudget") || "District Budget";
      if (aEl) aEl.textContent = `${metrics.allocated.toLocaleString()} ${curr}`;

      if (uTitle) uTitle.textContent = Core.t("distributedToReps") || "Distributed to Reps";
      if (uEl) uEl.textContent = `${metrics.distributed.toLocaleString()} ${curr}`;

      if (pTitle) pTitle.textContent = Core.t("pendingServices") || "Pending In Requests";
      if (pEl) pEl.textContent = `${metrics.pending.toLocaleString()} ${curr}`;

      if (rTitle) rTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
      if (rEl) {
        rEl.textContent = `${metrics.remaining.toLocaleString()} ${curr}`;
        rEl.style.color = metrics.remaining < 0 ? "var(--danger)" : "var(--success)";
      }
    } else if (role === Core.ROLES.REP || role === Core.ROLES.REP_ALT) {
      if (aTitle) aTitle.textContent = Core.t("myAllocatedBudget") || "My Allocated Budget";
      if (aEl) aEl.textContent = `${metrics.allocated.toLocaleString()} ${curr}`;

      if (uTitle) uTitle.textContent = Core.t("approvedSpent") || "Approved & Utilized";
      if (uEl) uEl.textContent = `${metrics.utilized.toLocaleString()} ${curr}`;

      if (pTitle) pTitle.textContent = Core.t("pendingServices") || "Pending In Requests";
      if (pEl) pEl.textContent = `${metrics.pending.toLocaleString()} ${curr}`;

      if (rTitle) rTitle.textContent = Core.t("remainingBudget") || "Remaining Balance";
      if (rEl) {
        rEl.textContent = `${metrics.remaining.toLocaleString()} ${curr}`;
        rEl.style.color = metrics.remaining < 0 ? "var(--danger)" : "var(--success)";
      }
    } else {
      if (aTitle) aTitle.textContent = Core.t("totalAllocatedBudget") || "Total Line Budget";
      if (aEl) aEl.textContent = `${metrics.allocated.toLocaleString()} ${curr}`;

      if (uTitle) uTitle.textContent = Core.t("allocatedToLms") || "Allocated to LMs";
      if (uEl) uEl.textContent = `${metrics.distributed.toLocaleString()} ${curr}`;

      if (pTitle) pTitle.textContent = Core.t("pendingServices") || "Pending In Requests";
      if (pEl) pEl.textContent = `${metrics.pending.toLocaleString()} ${curr}`;

      if (rTitle) rTitle.textContent = Core.t("unallocatedRemaining") || "Remaining Balance";
      if (rEl) {
        rEl.textContent = `${metrics.remaining.toLocaleString()} ${curr}`;
        rEl.style.color = metrics.remaining < 0 ? "var(--danger)" : "var(--success)";
      }
    }

    const lmSection = document.getElementById("lmDistributionSection");
    const dmSection = document.getElementById("dmDistributionSection");

    if (role === Core.ROLES.LM) {
      if (lmSection) lmSection.style.display = "block";
      if (dmSection) dmSection.style.display = "none";
      if (window.ActivitiesBudget?.renderLmDistributionSection) {
        window.ActivitiesBudget.renderLmDistributionSection(lineId, user);
      }
    } else if (role === Core.ROLES.DM) {
      if (lmSection) lmSection.style.display = "none";
      if (dmSection) dmSection.style.display = "block";
      if (window.ActivitiesBudget?.renderDmDistributionSection) {
        window.ActivitiesBudget.renderDmDistributionSection(lineId, user);
      }
    } else {
      if (lmSection) lmSection.style.display = "none";
      if (dmSection) dmSection.style.display = "none";
    }
  }

  function canUserViewService(srv, user) {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    if (role === Core.ROLES.ADMIN || role === Core.ROLES.HR) return true;
    if (srv.requesterId === user.id) return true;

    if (role === Core.ROLES.BU) {
      const uLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id).map((l) => l.id) : (user.lineIds || (user.lineId ? [user.lineId] : []));
      const inSubordinates = typeof window.canApproveFor === "function" ? window.canApproveFor(srv.requesterId) : false;
      const matchesSingleLine = srv.lineId && uLines.includes(srv.lineId);
      const matchesSharedLine = srv.isShared && Array.isArray(srv.shares) && srv.shares.some((sh) => uLines.includes(sh.lineId));
      return inSubordinates || matchesSingleLine || matchesSharedLine;
    }

    if (srv.isShared && Array.isArray(srv.shares)) {
      if (srv.shares.some((sh) => sh.repId === user.id)) return true;
      if (role === Core.ROLES.DM && srv.shares.some((sh) => sh.dmId === user.id)) return true;
      if (role === Core.ROLES.LM && srv.shares.some((sh) => sh.lmId === user.id)) return true;
    }

    if (role === Core.ROLES.DM) {
      const requester = Core.getUserById(srv.requesterId);
      return requester && requester.managerId === user.id;
    }
    if (role === Core.ROLES.LM) {
      const requester = Core.getUserById(srv.requesterId);
      if (!requester) return false;
      if (requester.managerId === user.id) return true;
      const directMgr = Core.getUserById(requester.managerId);
      return directMgr && directMgr.managerId === user.id;
    }
    if (role === Core.ROLES.PM) {
      const userLines = user.lineIds || (user.lineId ? [user.lineId] : []);
      if (userLines.includes(srv.lineId)) return true;
      if (srv.isShared && Array.isArray(srv.shares) && srv.shares.some((sh) => userLines.includes(sh.lineId))) return true;
      if (srv.department === "marketing") return true;
    }
    return false;
  }

  function filterServices() {
    Core._state.currentUser = Core.getAuthUser();
    const allSrv = Core.StoreAdapter.getServices();
    const statusFilter = document.getElementById("serviceFilterStatus")?.value || "all";
    const deptFilter = document.getElementById("serviceFilterDept")?.value || "all";
    const empFilter = document.getElementById("serviceFilterEmployee")?.value || "all";

    const filtered = allSrv.filter((s) => {
      if (!canUserViewService(s, Core._state.currentUser)) return false;
      const matchStatus = statusFilter === "all" || s.status === statusFilter || (statusFilter === "pending" && s.status && s.status.startsWith("pending"));
      const matchDept = deptFilter === "all" || s.department === deptFilter;
      const matchEmp = empFilter === "all" || s.requesterId === empFilter || (s.isShared && Array.isArray(s.shares) && s.shares.some(sh => sh.repId === empFilter));
      return matchStatus && matchDept && matchEmp;
    });

    renderServicesTable(filtered);
  }

  function renderServicesTable(list) {
    const tbody = document.getElementById("servicesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="table-empty-row">${Core.t("noServicesFound")}</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((srv) => {
        let reqName = Core.getUserDisplayName(srv.requesterId);
        if (!reqName || reqName === "-" || reqName === "Unknown User") {
          if (srv.requesterName) reqName = srv.requesterName;
          else if (srv.shares && srv.shares[0] && srv.shares[0].repId) reqName = Core.getUserDisplayName(srv.shares[0].repId);
          else reqName = Core.getUserDisplayName(Core._state.currentUser?.id);
        }

        const actionsHtml = getServiceActionButtons(srv, Core._state.currentUser);
        const deptBadge = srv.department === "marketing"
          ? `<span class="svc-dept-pill marketing">Marketing</span>`
          : `<span class="svc-dept-pill sales">Sales</span>`;

        let lineCell = `<div class="svc-line-badge single"><span class="svc-line-dot"></span><span>${Core.escapeHTML(Core.getLineName(srv.lineId))}</span></div>`;
        if (srv.isShared && Array.isArray(srv.shares) && srv.shares.length > 0) {
          const uniqueLines = Array.from(new Set(srv.shares.map(sh => sh.lineId)));
          const isIntraLine = uniqueLines.length === 1;
          const badgeText = isIntraLine ? `🤝 Intra-Line` : `⚡ ${srv.shares.length} Lines Split`;
          const linesBreakdown = srv.shares.map(sh => `<span class="svc-mini-line-chip">${Core.escapeHTML(Core.getLineName(sh.lineId))}</span>`).join("<span class='svc-plus'>+</span>");
          lineCell = `
            <div class="svc-shared-line-cell">
              <span class="svc-split-tag ${isIntraLine ? 'intra' : 'multi'}">${Core.escapeHTML(badgeText)}</span>
              <div class="svc-lines-breakdown">${linesBreakdown}</div>
            </div>
          `;
        }

        let areaCell = `<div class="svc-area-chip"><span class="svc-pin">📍</span><span>${Core.escapeHTML(Core.getAreaName(srv.areaId))}</span></div>`;
        if (srv.isShared && Array.isArray(srv.shares) && srv.shares.length > 0) {
          const uniqueAreaIds = Array.from(new Set(srv.shares.map(sh => sh.areaId)));
          const areasChips = uniqueAreaIds.map(aId => `<div class="svc-area-chip"><span class="svc-pin">📍</span><span>${Core.escapeHTML(Core.getAreaName(aId))}</span></div>`).join("");
          areaCell = `<div class="svc-areas-stack">${areasChips}</div>`;
        }

        let targetName = srv.targetName;
        if (!targetName || targetName === srv.targetId || String(targetName).startsWith("doc_") || String(targetName).startsWith("hosp_")) {
          const docObj = (window.store && window.store.doctors && window.store.doctors.getById && window.store.doctors.getById(srv.targetId)) ||
                         (window.DEMO_DATA && window.DEMO_DATA.doctors && window.DEMO_DATA.doctors.find && window.DEMO_DATA.doctors.find(d => d.id === srv.targetId));
          if (docObj) {
            targetName = docObj.name;
          } else {
            const hospObj = (window.store && window.store.hospitals && window.store.hospitals.getById && window.store.hospitals.getById(srv.targetId)) ||
                            (window.DEMO_DATA && window.DEMO_DATA.hospitals && window.DEMO_DATA.hospitals.find && window.DEMO_DATA.hospitals.find(h => h.id === srv.targetId));
            if (hospObj) targetName = hospObj.name;
          }
        }
        targetName = targetName || srv.targetId || "-";

        const isAM = srv.shift === Core.PERIODS.AM;
        const targetCell = `
          <div class="svc-target-cell">
            <div class="svc-target-type">
              <span class="svc-shift-badge ${isAM ? 'am' : 'pm'}">${isAM ? '🏥 AM' : '👨‍⚕️ PM'}</span>
              <span class="svc-type-text">${isAM ? 'Hospital' : 'Doctor'}</span>
            </div>
            <div class="svc-target-name">${Core.escapeHTML(targetName)}</div>
          </div>
        `;

        const curr = Core.t("currency") || "EGP";
        let costCell = `
          <div class="svc-cost-container">
            <div class="svc-cost-grand-total">${Number(srv.cost).toLocaleString()} <span class="svc-curr">${curr}</span></div>
          </div>
        `;
        if (srv.isShared && Array.isArray(srv.shares) && srv.shares.length > 0) {
          const splitsHtml = srv.shares.map(sh => `
            <div class="svc-cost-split-item">
              <span class="svc-split-line-name">${Core.escapeHTML(Core.getLineName(sh.lineId))}</span>
              <span class="svc-split-share-pct">${sh.sharePercent}%</span>
              <span class="svc-split-share-amt">${Number(sh.shareAmount).toLocaleString()} ${curr}</span>
            </div>
          `).join("");
          costCell = `
            <div class="svc-cost-container">
              <div class="svc-cost-grand-total">${Number(srv.cost).toLocaleString()} <span class="svc-curr">${curr}</span></div>
              <div class="svc-cost-splits-box">${splitsHtml}</div>
            </div>
          `;
        }

        let attachmentHtml = "";
        if (srv.attachmentBase64) {
          attachmentHtml = `
            <div class="table-attachment-wrapper mt-1">
              <button type="button" class="btn btn-sm btn-outline" onclick="ActivitiesModule.openReceiptPreviewModal('${srv.attachmentBase64}')" title="${Core.t("viewAttachment")}">
                📎 ${Core.t("attachmentLabel")}
              </button>
            </div>
          `;
        }

        return `
          <tr>
            <td class="table-date-cell">
              <div class="svc-date-pill">
                <span class="svc-date-val">${srv.date || '-'}</span>
              </div>
            </td>
            <td>
              <div class="svc-user-chip">
                <span class="svc-user-avatar">👤</span>
                <span class="svc-user-name">${Core.escapeHTML(reqName)}</span>
              </div>
            </td>
            <td>${lineCell}</td>
            <td>${deptBadge}</td>
            <td>${areaCell}</td>
            <td>${targetCell}</td>
            <td>
              <div class="svc-title-cell">
                ${srv.category ? `<span class="svc-cat-badge" style="display:inline-block; font-size:0.75rem; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:10px; margin-bottom:4px; font-weight:700; border:1px solid #bae6fd;">${Core.escapeHTML(srv.category)}</span>` : ""}
                <div class="svc-title-text">${Core.escapeHTML(srv.title)}</div>
                ${srv.notes ? `<div class="svc-notes-sub">💬 ${Core.escapeHTML(srv.notes)}</div>` : ""}
                ${attachmentHtml}
              </div>
            </td>
            <td class="table-amount-cell">${costCell}</td>
            <td>${renderServiceStatusBadge(srv)}</td>
            <td class="table-actions-cell">${actionsHtml}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderServiceStatusBadge(srv) {
    if (srv.isShared && Array.isArray(srv.shares) && srv.shares.length > 0) {
      if (srv.status === Core.REQUEST_STATUS.APPROVED) {
        return `<div class="svc-status-pill approved"><span class="status-icon">✓</span> <span>${Core.t("approvedLabel")}</span></div>`;
      }
      if (srv.status === Core.REQUEST_STATUS.REJECTED) {
        return `<div class="svc-status-pill rejected"><span class="status-icon">✕</span> <span>${Core.t("rejectedLabel")}</span></div>`;
      }
      const sharesBadges = srv.shares.map((sh) => {
        const lineName = Core.getLineName(sh.lineId);
        let sTxt = "Pending";
        let sClass = "pending";
        let sIcon = "⏳";
        if (sh.status === Core.REQUEST_STATUS.APPROVED) {
          sTxt = "Approved";
          sClass = "approved";
          sIcon = "✓";
        } else if (sh.status === Core.REQUEST_STATUS.REJECTED) {
          sTxt = "Rejected";
          sClass = "rejected";
          sIcon = "✕";
        } else if (sh.status === Core.REQUEST_STATUS.PENDING_DM) {
          sTxt = "Pending DM";
          sClass = "pending";
          sIcon = "⏳";
        } else if (sh.status === Core.REQUEST_STATUS.PENDING_LM) {
          sTxt = "Pending LM";
          sClass = "pending";
          sIcon = "⏳";
        }
        return `
          <div class="svc-share-status-card ${sClass}">
            <span class="svc-share-line-lbl">${Core.escapeHTML(lineName)} (${sh.sharePercent}%)</span>
            <span class="svc-share-status-tag ${sClass}">${sIcon} ${sTxt}</span>
          </div>
        `;
      }).join("");
      return `<div class="svc-shared-status-group">${sharesBadges}</div>`;
    }

    const s = srv.status || "pending";
    let label = Core.t("statusPending");
    let css = "pending";
    let icon = "⏳";

    if (s === Core.REQUEST_STATUS.PENDING_DM) {
      label = `${Core.t("waitingDmPrefix")}${Core.getUserDisplayName(srv.nextApproverId)}`;
      css = "pending";
      icon = "⏳";
    } else if (s === Core.REQUEST_STATUS.PENDING_LM) {
      label = `${Core.t("waitingLmPrefix")}${Core.getUserDisplayName(srv.nextApproverId)}`;
      css = "pending";
      icon = "⏳";
    } else if (s === Core.REQUEST_STATUS.PENDING_BU || s === "pending_bu") {
      label = `${Core.t("waitingBuPrefix") || "Pending BU: "}${Core.getUserDisplayName(srv.nextApproverId)}`;
      css = "pending pending-bu";
      icon = "👑";
    } else if (s === Core.REQUEST_STATUS.PENDING_PM || s === "pending_pm") {
      label = `${Core.t("waitingPmPrefix") || "Pending PM: "}${Core.getUserDisplayName(srv.nextApproverId)}`;
      css = "pending pending-pm";
      icon = "📢";
    } else if (s === Core.REQUEST_STATUS.PENDING_GM || s === "pending_gm") {
      label = `${Core.t("waitingGmPrefix") || "Pending GM: "}${Core.getUserDisplayName(srv.nextApproverId)}`;
      css = "pending pending-gm";
      icon = "🎖️";
    } else if (s === Core.REQUEST_STATUS.APPROVED) {
      label = Core.t("approvedLabel");
      css = "approved";
      icon = "✓";
    } else if (s === Core.REQUEST_STATUS.REJECTED) {
      label = Core.t("rejectedLabel");
      css = "rejected";
      icon = "✕";
    }

    return `<div class="svc-status-pill ${css}"><span class="status-icon">${icon}</span> <span>${label}</span></div>`;
  }

  function getServiceActionButtons(srv, user) {
    if (!user) return "&mdash;";
    const canApprove = Core.isActionAuthorized("approve_service", srv, user);
    if (canApprove) {
      return `
        <button type="button" class="action-btn-success" onclick="ActivitiesModule.openDecisionModal('service', '${srv.id}', 'approve')" title="Approve">
          ✓
        </button>
        <button type="button" class="action-btn-danger" onclick="ActivitiesModule.openDecisionModal('service', '${srv.id}', 'reject')" title="Reject">
          ✕
        </button>
      `;
    }
    return "&mdash;";
  }

  function openServiceModal() {
    Core._state.currentUser = Core.getAuthUser();
    const modal = document.getElementById("serviceModal");
    if (!modal) return;
    document.getElementById("serviceForm")?.reset();

    Core._state.sharedLines = [];
    Core._state.currentServiceFileBase64 = null;
    const catSelect = document.getElementById("serviceFormCategorySelect");
    if (catSelect) catSelect.selectedIndex = 0;
    const fileInp = document.getElementById("serviceFormFileInput");
    if (fileInp) fileInp.value = "";
    const submitBtn = document.getElementById("btnSubmitService");
    if (submitBtn) submitBtn.disabled = false;
    const sharedToggle = document.getElementById("serviceFormSharedToggle");
    if (sharedToggle) sharedToggle.checked = false;
    const sharedSection = document.getElementById("sharedServiceSection");
    if (sharedSection) sharedSection.style.display = "none";
    const primaryInput = document.getElementById("sharedPrimaryPercentInput");
    if (primaryInput) primaryInput.value = "50";
    const partContainer = document.getElementById("sharedParticipatingLinesContainer");
    if (partContainer) partContainer.innerHTML = "";

    const userLines = Core.getUserAssignedLines(Core._state.currentUser);
    const lineSelect = document.getElementById("serviceFormLineSelect");
    if (lineSelect) {
      lineSelect.innerHTML = userLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      const activeBudgetLine = document.getElementById("serviceBudgetLineSelect")?.value;
      if (activeBudgetLine && userLines.some((l) => l.id === activeBudgetLine)) {
        lineSelect.value = activeBudgetLine;
      } else if (userLines.length > 0) {
        lineSelect.value = userLines[0].id;
      }
    }

    const dateInp = document.getElementById("serviceFormDateInput");
    if (dateInp) dateInp.value = Core.formatDate(Core._state.currentDate);

    onServiceFormLineChange();
    onServiceFormShiftChange();

    const costInp = document.getElementById("serviceFormCostInput");
    if (costInp && !costInp.dataset.hasSharedListener) {
      costInp.dataset.hasSharedListener = "true";
      costInp.addEventListener("input", () => {
        if (Core._state.sharedLines.length > 0) recalculateSharedBalances();
      });
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeServiceModal() {
    const modal = document.getElementById("serviceModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  function onServiceFormLineChange() {
    const lineSelect = document.getElementById("serviceFormLineSelect");
    const areaSelect = document.getElementById("serviceFormAreaSelect");
    if (!lineSelect || !areaSelect) return;

    const lineId = lineSelect.value;
    const areas = Core.getAreasForLine(lineId, Core._state.currentUser);
    if (!areas || areas.length === 0) {
      areaSelect.innerHTML = `<option value="" disabled selected>No areas assigned to you for this line</option>`;
      areaSelect.value = "";
    } else {
      areaSelect.innerHTML = areas.map((a) => `<option value="${a.id}">${a.name} (${a.code || a.id})</option>`).join("");
      if (Core._state.currentUser.areaId && areas.some((a) => a.id === Core._state.currentUser.areaId)) {
        areaSelect.value = Core._state.currentUser.areaId;
      } else {
        areaSelect.value = areas[0].id;
      }
    }

    onServiceFormShiftChange();
    updatePrimaryShareDisplay();
  }

  function onServiceFormAreaChange() {
    onServiceFormShiftChange();
    updatePrimaryShareDisplay();
  }

  function onServiceFormShiftChange() {
    const lineId = document.getElementById("serviceFormLineSelect")?.value;
    const areaId = document.getElementById("serviceFormAreaSelect")?.value;
    const shift = document.getElementById("serviceFormShiftSelect")?.value;

    const hospGroup = document.getElementById("serviceHospitalGroup");
    const docGroup = document.getElementById("serviceDoctorGroup");
    const hospSelect = document.getElementById("serviceFormHospitalSelect");
    const docSelect = document.getElementById("serviceFormDoctorSelect");

    const hospitals = (window.store && window.store.hospitals && window.store.hospitals.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
    const doctors = (window.store && window.store.doctors && window.store.doctors.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];

    if (hospSelect) {
      const filteredHosp = hospitals.filter((h) => (!lineId || !h.lineId || h.lineId === lineId) && (!areaId || !h.areaId || h.areaId === areaId));
      if (filteredHosp.length === 0) {
        hospSelect.innerHTML = `<option value="" disabled selected>No hospitals available</option>`;
      } else {
        hospSelect.innerHTML = filteredHosp.map((h) => `<option value="${h.id}">${h.name}</option>`).join("");
      }
    }

    if (docSelect) {
      const filteredDoc = doctors.filter((d) => (!lineId || !d.lineId || d.lineId === lineId) && (!areaId || !d.areaId || d.areaId === areaId));
      filteredDoc.sort(window.sortBilingualByName || ((a, b) => (a.name || "").localeCompare(b.name || "")));
      if (filteredDoc.length === 0) {
        docSelect.innerHTML = `<option value="" disabled selected>No doctors available</option>`;
      } else {
        const currentDocLang = (window.getCurrentLang && window.getCurrentLang()) || "en";
        docSelect.innerHTML = filteredDoc.map((d) => {
          const docName = (currentDocLang === "ar" && d.nameAr) ? d.nameAr : (d.name || d.nameAr || "");
          return `<option value="${d.id}">${docName} (${d.specialty || "-"})</option>`;
        }).join("");
      }
    }

    if (shift === Core.PERIODS.AM) {
      if (hospGroup) hospGroup.style.display = "block";
      if (docGroup) docGroup.style.display = "none";
      if (hospSelect) hospSelect.required = true;
      if (docSelect) docSelect.required = false;
    } else {
      if (hospGroup) hospGroup.style.display = "none";
      if (docGroup) docGroup.style.display = "block";
      if (hospSelect) hospSelect.required = false;
      if (docSelect) docSelect.required = true;
    }
  }

  function handleServiceFileSelect(event) {
    const file = event.target?.files?.[0];
    if (!file) {
      Core._state.currentServiceFileBase64 = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      Core._state.currentServiceFileBase64 = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function onSharedServiceToggle(checked) {
    const toggleEl = document.getElementById("serviceFormSharedToggle");
    const isChecked = typeof checked === "boolean" ? checked : (toggleEl ? toggleEl.checked : false);
    const section = document.getElementById("sharedServiceSection");
    if (!section) return;

    if (isChecked) {
      section.style.display = "block";
      updatePrimaryShareDisplay();
      if (Core._state.sharedLines.length === 0) {
        addSharedLineRow(50);
        const primaryInput = document.getElementById("sharedPrimaryPercentInput");
        if (primaryInput) primaryInput.value = "50";
      }
      recalculateSharedBalances();
    } else {
      section.style.display = "none";
      Core._state.sharedLines = [];
      const partContainer = document.getElementById("sharedParticipatingLinesContainer");
      if (partContainer) partContainer.innerHTML = "";
      const submitBtn = document.getElementById("btnSubmitService");
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function updatePrimaryShareDisplay() {
    const lineSelect = document.getElementById("serviceFormLineSelect");
    const areaSelect = document.getElementById("serviceFormAreaSelect");
    const primaryInfo = document.getElementById("sharedPrimaryInfoText");
    if (!primaryInfo) return;

    const lineName = lineSelect?.options[lineSelect.selectedIndex]?.text || Core.getLineName(lineSelect?.value);
    const areaName = areaSelect?.options[areaSelect.selectedIndex]?.text || Core.getAreaName(areaSelect?.value);
    const repName = Core.getUserDisplayName(Core._state.currentUser?.id);

    primaryInfo.innerHTML = `<span>${Core.escapeHTML(lineName)}</span> &mdash; <span>${Core.escapeHTML(areaName)}</span> <span class="shared-rep-badge">👤 ${Core.escapeHTML(repName)}</span>`;
    recalculateSharedBalances();
  }

  function addSharedLineRow(defaultPercent = 0) {
    const allLines = Core.getAllProductLines();
    const primaryLineId = document.getElementById("serviceFormLineSelect")?.value;
    const primaryAreaId = document.getElementById("serviceFormAreaSelect")?.value;

    const initialLine = allLines.find(l => l.id !== primaryLineId) || allLines[0];
    const initialLineId = initialLine ? initialLine.id : "";

    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const areasForLine = allAreas.filter(a => !initialLineId || a.lineId === initialLineId);
    let initialAreaId = "";
    if (initialLineId === primaryLineId && areasForLine.length > 1) {
      const altArea = areasForLine.find(a => a.id !== primaryAreaId);
      initialAreaId = altArea ? altArea.id : (areasForLine[0] ? areasForLine[0].id : "");
    } else {
      initialAreaId = areasForLine[0] ? areasForLine[0].id : "";
    }

    const rowObj = {
      lineId: initialLineId,
      areaId: initialAreaId,
      sharePercent: defaultPercent || 0,
      shareAmount: 0
    };

    Core._state.sharedLines.push(rowObj);
    renderSharedLinesRows();
    recalculateSharedBalances();
  }

  function removeSharedLineRow(index) {
    if (index >= 0 && index < Core._state.sharedLines.length) {
      Core._state.sharedLines.splice(index, 1);
      renderSharedLinesRows();
      recalculateSharedBalances();
    }
  }

  function renderSharedLinesRows() {
    const container = document.getElementById("sharedParticipatingLinesContainer");
    if (!container) return;
    container.innerHTML = "";

    const allLines = Core.getAllProductLines();
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];

    Core._state.sharedLines.forEach((row, idx) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "shared-line-row-card";

      const areasForLine = allAreas.filter(a => !row.lineId || a.lineId === row.lineId);
      if (!row.areaId && areasForLine.length > 0) row.areaId = areasForLine[0].id;

      const liveRep = Core.getLiveRepForArea(row.areaId);
      const repLabel = liveRep
        ? `${Core.getUserDisplayName(liveRep.id)} (${liveRep.employeeCode || liveRep.id})`
        : Core.t("sharedNoRepAssigned");
      const repIcon = liveRep ? "👤" : "⚠️";

      const linesOptions = allLines.map(l => `<option value="${l.id}" ${l.id === row.lineId ? "selected" : ""}>${l.name}</option>`).join("");
      const areasOptions = areasForLine.map(a => `<option value="${a.id}" ${a.id === row.areaId ? "selected" : ""}>${a.name} (${a.code || a.id})</option>`).join("");

      rowDiv.innerHTML = `
        <div class="shared-row-header">
          <span class="shared-row-title">🔹 ${Core.t("sharedParticipatingTitle")} #${idx + 1}</span>
          <button type="button" class="shared-remove-btn" onclick="ActivitiesModule.removeSharedLineRow(${idx})" title="Remove">✕</button>
        </div>
        <div class="shared-row-fields">
          <div class="shared-field-group">
            <label>${Core.t("sharedLineLabel")}</label>
            <select id="sharedLineSelect_${idx}" class="form-control" onchange="ActivitiesModule.onSharedLineChange(${idx}, this.value)">
              ${linesOptions}
            </select>
          </div>
          <div class="shared-field-group">
            <label>${Core.t("sharedAreaLabel")}</label>
            <select id="sharedAreaSelect_${idx}" class="form-control" onchange="ActivitiesModule.onSharedAreaChange(${idx}, this.value)">
              ${areasOptions}
            </select>
          </div>
        </div>
        <div class="shared-row-footer">
          <span id="sharedRepBadge_${idx}" class="shared-rep-badge">${repIcon} ${Core.escapeHTML(repLabel)}</span>
          <div class="shared-percent-control">
            <label>${Core.t("sharedShare")}:</label>
            <div class="shared-percent-input-wrapper">
              <input type="number" class="shared-percent-input" min="1" max="100" value="${row.sharePercent || 0}" oninput="ActivitiesModule.onSharedLinePercentInput(${idx}, this.value)">
              <span class="shared-percent-suffix">%</span>
            </div>
            <span id="sharedRowAmountBadge_${idx}" class="shared-amount-badge">${Number(row.shareAmount || 0).toLocaleString()} EGP</span>
          </div>
        </div>
      `;

      container.appendChild(rowDiv);
    });
  }

  function onSharedLineChange(index, lineId) {
    if (!Core._state.sharedLines[index]) return;
    Core._state.sharedLines[index].lineId = lineId;
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const areasForLine = allAreas.filter(a => !lineId || a.lineId === lineId);
    const newAreaId = areasForLine[0] ? areasForLine[0].id : "";
    Core._state.sharedLines[index].areaId = newAreaId;

    const areaSelect = document.getElementById(`sharedAreaSelect_${index}`);
    const badgeEl = document.getElementById(`sharedRepBadge_${index}`);

    if (areaSelect) {
      areaSelect.innerHTML = areasForLine.map(a => `<option value="${a.id}" ${a.id === newAreaId ? "selected" : ""}>${a.name} (${a.code || a.id})</option>`).join("");
      if (badgeEl) {
        const liveRep = Core.getLiveRepForArea(newAreaId);
        const repLabel = liveRep
          ? `${Core.getUserDisplayName(liveRep.id)} (${liveRep.employeeCode || liveRep.id})`
          : Core.t("sharedNoRepAssigned");
        const repIcon = liveRep ? "👤" : "⚠️";
        badgeEl.innerHTML = `${repIcon} ${Core.escapeHTML(repLabel)}`;
      }
    } else {
      renderSharedLinesRows();
    }
    recalculateSharedBalances();
  }

  function onSharedAreaChange(index, areaId) {
    if (!Core._state.sharedLines[index]) return;
    Core._state.sharedLines[index].areaId = areaId;

    const badgeEl = document.getElementById(`sharedRepBadge_${index}`);
    if (badgeEl) {
      const liveRep = Core.getLiveRepForArea(areaId);
      const repLabel = liveRep
        ? `${Core.getUserDisplayName(liveRep.id)} (${liveRep.employeeCode || liveRep.id})`
        : Core.t("sharedNoRepAssigned");
      const repIcon = liveRep ? "👤" : "⚠️";
      badgeEl.innerHTML = `${repIcon} ${Core.escapeHTML(repLabel)}`;
    } else {
      renderSharedLinesRows();
    }
    recalculateSharedBalances();
  }

  function onPrimarySharePercentInput(val) {
    if (val !== undefined) {
      const primaryInput = document.getElementById("sharedPrimaryPercentInput");
      if (primaryInput && primaryInput.value !== val) primaryInput.value = val;
    }
    recalculateSharedBalances();
  }

  function onSharedLinePercentInput(index, val) {
    if (!Core._state.sharedLines[index]) return;
    const num = val !== undefined ? parseFloat(val) : 0;
    Core._state.sharedLines[index].sharePercent = num || 0;
    recalculateSharedBalances();
  }

  function recalculateSharedBalances() {
    const costInp = document.getElementById("serviceFormCostInput");
    const totalCost = parseFloat(costInp?.value) || 0;
    const primaryInput = document.getElementById("sharedPrimaryPercentInput");
    const primaryPercent = parseFloat(primaryInput?.value) || 0;

    let partPercentSum = 0;
    Core._state.sharedLines.forEach((row, idx) => {
      const p = parseFloat(row.sharePercent) || 0;
      partPercentSum += p;
      row.shareAmount = Math.round((totalCost * p) / 100);
      const rowBadge = document.getElementById(`sharedRowAmountBadge_${idx}`);
      if (rowBadge) rowBadge.textContent = `${row.shareAmount.toLocaleString()} EGP`;
    });

    const primaryAmount = Math.round((totalCost * primaryPercent) / 100);
    const primaryBadge = document.getElementById("sharedPrimaryAmountBadge");
    if (primaryBadge) primaryBadge.textContent = `${primaryAmount.toLocaleString()} EGP`;

    const totalAllocatedPercent = primaryPercent + partPercentSum;
    const totalAllocatedAmount = primaryAmount + Core._state.sharedLines.reduce((s, r) => s + r.shareAmount, 0);

    const costText = document.getElementById("sharedValidatorTotalCost");
    if (costText) costText.textContent = `${totalCost.toLocaleString()} EGP`;

    const allocText = document.getElementById("sharedValidatorAllocated");
    if (allocText) allocText.textContent = `${totalAllocatedPercent}% (${totalAllocatedAmount.toLocaleString()} EGP)`;

    const badgeContainer = document.getElementById("sharedValidatorStatusBadge");
    const submitBtn = document.getElementById("btnSubmitService");

    if (badgeContainer) {
      if (totalAllocatedPercent === 100) {
        badgeContainer.innerHTML = `<span class="shared-status-pill success">✓ ${Core.t("sharedValidationComplete")}</span>`;
        if (submitBtn) submitBtn.disabled = false;
      } else {
        const rem = 100 - totalAllocatedPercent;
        const msg = Core.t("sharedValidationIncomplete").replace("{pct}", totalAllocatedPercent).replace("{rem}", rem);
        badgeContainer.innerHTML = `<span class="shared-status-pill warning">⚠️ ${msg}</span>`;
        if (submitBtn) submitBtn.disabled = true;
      }
    }
  }

  function handleServiceSubmit(e) {
    e.preventDefault();
    Core._state.currentUser = Core.getAuthUser();

    const lineSelect = document.getElementById("serviceFormLineSelect");
    const deptSelect = document.getElementById("serviceFormDeptSelect");
    const areaSelect = document.getElementById("serviceFormAreaSelect");
    const shiftSelect = document.getElementById("serviceFormShiftSelect");
    const docSelect = document.getElementById("serviceFormDoctorSelect");
    const hospSelect = document.getElementById("serviceFormHospitalSelect");
    const categorySelect = document.getElementById("serviceFormCategorySelect");
    const titleInput = document.getElementById("serviceFormTitleInput");
    const costInput = document.getElementById("serviceFormCostInput");
    const dateInput = document.getElementById("serviceFormDateInput");
    const notesInput = document.getElementById("serviceFormNotesInput");

    const lineId = lineSelect.value;
    const department = deptSelect.value;
    const areaId = areaSelect.value;
    const shift = shiftSelect.value;
    const category = categorySelect ? categorySelect.value : "";
    const title = titleInput.value.trim();
    const cost = parseFloat(costInput.value);
    const date = dateInput.value;
    const notes = notesInput.value.trim();

    if (!category) {
      Core.safeShowToast("Please select a service category.", "warning");
      return;
    }

    if (!cost || cost <= 0) {
      Core.safeShowToast("Please enter a valid cost.", "warning");
      return;
    }

    let targetType = "doctor";
    let targetId = "";
    let targetName = "";

    if (shift === Core.PERIODS.AM) {
      targetType = "hospital";
      targetId = hospSelect.value;
      const opt = hospSelect.options[hospSelect.selectedIndex];
      targetName = opt ? opt.text : targetId;
    } else {
      targetType = "doctor";
      targetId = docSelect.value;
      const opt = docSelect.options[docSelect.selectedIndex];
      targetName = opt ? opt.text : targetId;
    }

    if (!targetId) {
      Core.safeShowToast("Please select a target doctor or hospital.", "warning");
      return;
    }

    const isShared = document.getElementById("serviceFormSharedToggle")?.checked || false;
    let shares = [];

    let primaryPercent = 100;
    if (isShared) {
      if (Core._state.sharedLines.length === 0) {
        Core.safeShowToast("Please add at least one shared line or area.", "warning");
        return;
      }

      const primaryInput = document.getElementById("sharedPrimaryPercentInput");
      primaryPercent = parseFloat(primaryInput?.value) || 0;
      const partSum = Core._state.sharedLines.reduce((s, r) => s + (parseFloat(r.sharePercent) || 0), 0);
      const totalPct = primaryPercent + partSum;

      if (totalPct !== 100) {
        Core.safeShowToast(Core.t("sharedExceedsNotice") || "Total share percentages must equal exactly 100%.", "warning");
        return;
      }
    }

    // Budget validation for requesting user
    const userRole = (Core._state.currentUser?.role || "").toLowerCase();
    const isRep = userRole === Core.ROLES.REP || userRole === Core.ROLES.REP_ALT;
    const myShareCost = isShared ? Math.round((cost * primaryPercent) / 100) : cost;

    if (isRep) {
      const budgetMetrics = getBudgetMetricsForUser(lineId, Core._state.currentUser);
      if (budgetMetrics.allocated <= 0) {
        Core.safeShowToast(
          Core.t("noBudgetAllocated") || "Doctor services budget has not been allocated for this product line yet. Please consult your manager.",
          "warning"
        );
        return;
      }
      if (myShareCost > budgetMetrics.remaining) {
        const errMsg = `Requested cost (${myShareCost.toLocaleString()} EGP) exceeds your remaining promotional budget (${budgetMetrics.remaining.toLocaleString()} EGP).`;
        Core.safeShowToast(errMsg, "danger");
        return;
      }
    }

    if (isShared) {
      const primaryHierarchy = Core.getLiveHierarchyForArea(areaId, Core._state.currentUser.id);
      const primaryRepId = primaryHierarchy.repId || Core._state.currentUser.id;
      const primaryDmId = primaryHierarchy.dmId || Core._state.currentUser.managerId || "dm1";
      const primaryLmId = primaryHierarchy.lmId || "lm1";

      let primaryShareStatus = Core.REQUEST_STATUS.PENDING_DM;
      if (Core._state.currentUser.role === Core.ROLES.DM) primaryShareStatus = Core.REQUEST_STATUS.PENDING_LM;
      else if (Core._state.currentUser.role === Core.ROLES.LM || Core._state.currentUser.role === Core.ROLES.BU || Core._state.currentUser.role === Core.ROLES.ADMIN) primaryShareStatus = Core.REQUEST_STATUS.APPROVED;

      shares.push({
        lineId: lineId,
        areaId: areaId,
        repId: primaryRepId,
        dmId: primaryDmId,
        lmId: primaryLmId,
        sharePercent: primaryPercent,
        shareAmount: Math.round((cost * primaryPercent) / 100),
        status: primaryShareStatus,
        nextApproverId: primaryShareStatus === Core.REQUEST_STATUS.PENDING_DM ? primaryDmId : (primaryShareStatus === Core.REQUEST_STATUS.PENDING_LM ? primaryLmId : null),
        approvedBy: primaryShareStatus === Core.REQUEST_STATUS.APPROVED ? [Core._state.currentUser.id] : []
      });

      for (const row of Core._state.sharedLines) {
        if (!row.areaId) {
          Core.safeShowToast("Please select the area for each shared line.", "warning");
          return;
        }
        const rowHierarchy = Core.getLiveHierarchyForArea(row.areaId);
        const rowRepId = rowHierarchy.repId;
        const rowDmId = rowHierarchy.dmId;
        const rowLmId = rowHierarchy.lmId;

        let rowShareStatus = Core.REQUEST_STATUS.PENDING_DM;
        if (Core._state.currentUser.role === Core.ROLES.DM && rowDmId === Core._state.currentUser.id) {
          rowShareStatus = Core.REQUEST_STATUS.PENDING_LM;
        } else if (Core._state.currentUser.role === Core.ROLES.LM && rowLmId === Core._state.currentUser.id) {
          rowShareStatus = Core.REQUEST_STATUS.APPROVED;
        } else if (Core._state.currentUser.role === Core.ROLES.BU || Core._state.currentUser.role === Core.ROLES.ADMIN) {
          rowShareStatus = Core.REQUEST_STATUS.APPROVED;
        }

        const shareAmt = Math.round((cost * row.sharePercent) / 100);
        shares.push({
          lineId: row.lineId,
          areaId: row.areaId,
          repId: rowRepId,
          dmId: rowDmId,
          lmId: rowLmId,
          sharePercent: row.sharePercent,
          shareAmount: shareAmt,
          status: rowShareStatus,
          nextApproverId: rowShareStatus === Core.REQUEST_STATUS.PENDING_DM ? rowDmId : (rowShareStatus === Core.REQUEST_STATUS.PENDING_LM ? rowLmId : null),
          approvedBy: rowShareStatus === Core.REQUEST_STATUS.APPROVED ? [Core._state.currentUser.id] : []
        });
      }
    }

    let globalStatus = Core.REQUEST_STATUS.PENDING_DM;
    let nextApprover = null;

    if (isShared) {
      const allApproved = shares.every(s => s.status === Core.REQUEST_STATUS.APPROVED);
      globalStatus = allApproved ? Core.REQUEST_STATUS.APPROVED : Core.REQUEST_STATUS.PENDING_SHARED;
      nextApprover = null;
    } else {
      if (window.WorkflowEngine && typeof window.WorkflowEngine.resolveInitialServiceStatus === "function") {
        const initRes = window.WorkflowEngine.resolveInitialServiceStatus({
          department,
          lineId,
          areaId,
          cost,
        }, Core._state.currentUser);
        globalStatus = initRes.status;
        nextApprover = initRes.nextApproverId;
      } else {
        if (Core._state.currentUser.role === Core.ROLES.REP || Core._state.currentUser.role === Core.ROLES.REP_ALT) {
          globalStatus = Core.REQUEST_STATUS.PENDING_DM;
          nextApprover = Core._state.currentUser.managerId || "dm1";
        } else if (Core._state.currentUser.role === Core.ROLES.DM) {
          globalStatus = Core.REQUEST_STATUS.PENDING_LM;
          nextApprover = Core._state.currentUser.managerId || "lm1";
        } else {
          globalStatus = Core.REQUEST_STATUS.APPROVED;
          nextApprover = null;
        }
      }
    }

    const newService = {
      id: "srv_" + Date.now(),
      requesterId: Core._state.currentUser.id,
      requesterRole: Core._state.currentUser.role,
      lineId: lineId,
      department: department,
      areaId: areaId,
      shift: shift,
      targetType: targetType,
      targetId: targetId,
      targetName: targetName,
      category: category,
      title: title,
      cost: cost,
      date: date,
      notes: notes,
      isShared: isShared,
      shares: isShared ? shares : [],
      attachmentBase64: Core._state.currentServiceFileBase64 || null,
      status: globalStatus,
      nextApproverId: nextApprover,
      history: [
        {
          action: "submitted",
          at: new Date().toISOString(),
          by: Core._state.currentUser.id,
          role: Core._state.currentUser.role,
        },
      ],
    };

    Core.StoreAdapter.saveService(newService);

    const creatorName = Core.getUserDisplayName(Core._state.currentUser.id);
    if (isShared) {
      const notifiedReps = new Set();
      shares.forEach((sh) => {
        if (sh.repId && sh.repId !== Core._state.currentUser.id && !notifiedReps.has(sh.repId)) {
          notifiedReps.add(sh.repId);
          Core.dispatchWorkflowNotification({
            userId: sh.repId,
            type: "shared_service_request",
            title: `New Shared Service Request (${sh.sharePercent}%)`,
            message: `You have been included in a shared service request (${newService.title}) with a ${sh.sharePercent}% share (${sh.shareAmount.toLocaleString()} EGP) by ${creatorName}.`,
            link: "activities.html",
            icon: "🤝",
            badgeClass: "bg-info",
            actorName: creatorName,
            action: "shared_service",
          });
        }
      });

      const notifiedApprovers = new Set();
      shares.forEach((sh) => {
        if (sh.nextApproverId && sh.nextApproverId !== Core._state.currentUser.id && !notifiedApprovers.has(sh.nextApproverId)) {
          notifiedApprovers.add(sh.nextApproverId);
          Core.dispatchWorkflowNotification({
            userId: sh.nextApproverId,
            type: "shared_service_approval",
            title: "Shared Service Request Pending Approval",
            message: `A shared service request (${newService.title}) totaling ${newService.cost.toLocaleString()} EGP is awaiting your approval.`,
            link: "activities.html",
            icon: "⏳",
            badgeClass: "bg-warning",
            actorName: creatorName,
            action: "pending_approval",
          });
        }
      });
    } else {
      if (newService.nextApproverId && newService.nextApproverId !== Core._state.currentUser.id) {
        Core.dispatchWorkflowNotification({
          userId: newService.nextApproverId,
          type: "service_approval",
          title: "Service Request Pending Approval",
          message: `${creatorName} submitted a service request (${newService.title}) for ${newService.cost.toLocaleString()} EGP awaiting your approval.`,
          link: "activities.html",
          icon: "📋",
          badgeClass: "bg-warning",
          actorName: creatorName,
          action: "pending_approval",
        });
      }
    }

    closeServiceModal();
    renderServicesTab();
    Core.safeShowToast(Core.t("successAction"), "success");
  }

  window.ActivitiesServices = {
    populateServiceFilters,
    renderServicesTab,
    filterServices,
    renderServicesBudgetStrip,
    getBudgetMetricsForUser,
    renderServicesTable,
    renderServiceStatusBadge,
    getServiceActionButtons,
    openServiceModal,
    closeServiceModal,
    onServiceFormLineChange,
    onServiceFormShiftChange,
    onServiceFormAreaChange,
    handleServiceFileSelect,
    onSharedServiceToggle,
    updatePrimaryShareDisplay,
    addSharedLineRow,
    removeSharedLineRow,
    renderSharedLinesRows,
    onSharedLineChange,
    onSharedAreaChange,
    onPrimarySharePercentInput,
    onSharedLinePercentInput,
    recalculateSharedBalances,
    handleServiceSubmit,
    canUserViewService,
  };
})(window);