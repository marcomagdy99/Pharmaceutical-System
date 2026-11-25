/**
 * @file reschedule.js
 * @description Unified Reschedule & Missed Call Module for PharmaCare.
 */

// ==========================================
// Section: Reschedule / Missed Call Module
// ==========================================

function getAuthenticatedRescheduleUser() {
  const user = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || null;
  if (!user || !user.id) return null;
  return user;
}

function getLocalTodayStr() {
  if (typeof window.getSystemTodayStr === "function") return window.getSystemTodayStr();
  const base = typeof window.getSystemDate === "function" ? new Date(window.getSystemDate().getTime()) : new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
}

function getLocalTomorrowStr() {
  const base = typeof window.getSystemDate === "function" ? new Date(window.getSystemDate().getTime()) : new Date();
  base.setDate(base.getDate() + 1);
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
}

function canManageVisitReschedule(user, visit) {
  if (!user || !user.id || !visit) return false;
  const role = window.normalizeRole ? window.normalizeRole(user.role) : String(user.role || "").toLowerCase();
  if (role === "general_manager" || role === "gm") return false;
  if (visit.repId === user.id) return true;
  if (role === "admin") return true;
  if (typeof window.getAllSubordinates === "function") {
    const subs = window.getAllSubordinates(user.id) || [];
    if (subs.some((s) => s.id === visit.repId)) return true;
  }
  const repUser = (window.store && window.store.users)
    ? window.store.users.getById(visit.repId)
    : ((window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) ? window.DEMO_DATA.users.find((u) => u.id === visit.repId) : null);
  if (repUser && (repUser.managerId === user.id || repUser.dmId === user.id)) return true;
  return false;
}

function isVisitReschedulable(visit) {
  if (!visit) return false;
  const status = String(visit.status || "planned").toLowerCase();
  return status === "planned" || status === "pending_approval" || status === "pending";
}

function getDailyRescheduleCount(userId, dateStr) {
  const allVisits = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  let count = 0;
  allVisits.forEach((v) => {
    if (Array.isArray(v.rescheduleHistory) && v.rescheduleHistory.length > 0) {
      const historyMatches = v.rescheduleHistory.filter(
        (h) => h.performedOnDate === dateStr && (h.byUserId === userId || (!h.byUserId && v.repId === userId))
      );
      count += historyMatches.length;
    } else if (v.repId === userId) {
      if (v.rescheduledTodayDate === dateStr || v.missedOnDate === dateStr) {
        count++;
      }
    }
  });
  return count;
}

function attachRescheduleModal() {
  if (document.getElementById("rescheduleVisitModal")) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  
  const modalHtml = `
    <div class="modal-overlay reschedule-modal-overlay" id="rescheduleVisitModal">
      <div class="modal-box reschedule-modal-box">
        <div class="reschedule-header">
          <h4 class="reschedule-title">
            <span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <span id="rescheduleModalHeading">Reschedule or Missed Call</span>
          </h4>
          <button type="button" id="btnCloseRescheduleTop" class="reschedule-close-btn">&times;</button>
        </div>

        <!-- Daily Quota Info -->
        <div id="rescheduleQuotaBanner" class="reschedule-quota-banner">
          <span>ℹ️</span>
          <span id="rescheduleQuotaText">...</span>
        </div>

        <!-- Target Info -->
        <div class="reschedule-target-box">
          <div class="reschedule-target-name" id="rescheduleTargetName">-</div>
          <div class="reschedule-target-sub" id="rescheduleCurrentSchedule">-</div>
        </div>

        <form id="rescheduleForm">
          <input type="hidden" id="rescheduleVisitId" value="">

          <div class="form-group mb-3">
            <label class="form-label fw-bold small">
              Action:
            </label>
            <div class="reschedule-actions-row">
              <label class="reschedule-radio-label">
                <input type="radio" name="rescheduleAction" value="reschedule" checked>
                <span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Reschedule to Later Date</span>
              </label>
              <label class="reschedule-radio-label reschedule-radio-label-danger">
                <input type="radio" name="rescheduleAction" value="missed">
                <span><svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Missed Call (Unavailable)</span>
              </label>
            </div>
          </div>

          <!-- Date fields for rescheduling -->
          <div id="rescheduleDateFields" class="mb-3">
            <div class="reschedule-date-grid">
              <div class="form-group">
                <label class="form-label fw-bold small">
                  New Date (Mandatory):
                </label>
                <input type="date" id="rescheduleNewDate" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label fw-bold small">
                  Period:
                </label>
                <select id="rescheduleNewPeriod" class="form-control">
                  <option value="am">AM (Hospitals)</option>
                  <option value="pm" selected>PM (Doctors)</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Reason Selection & Textarea (MANDATORY) -->
          <div class="form-group mb-3">
            <label class="form-label fw-bold small">
              Reason for Reschedule / Missed Call <span class="text-danger">* (Mandatory)</span>:
            </label>
            <select id="rescheduleQuickReason" class="form-control mb-2">
              <option value="">-- Select common reason or write below --</option>
              <option value="Doctor Traveling / Unavailable">Doctor Traveling / Unavailable</option>
              <option value="Emergency Surgery / Medical Conference">Emergency Surgery / Medical Conference</option>
              <option value="Clinic Closed / Secretary Apology">Clinic Closed / Secretary Apology</option>
              <option value="Severe Overcrowding / Doctor Short Time">⏳ Severe Overcrowding / Doctor Short Time</option>
              <option value="Weather / Route Emergency">Weather / Route Emergency</option>
              <option value="other">Other (Specify details)</option>
            </select>
            <textarea id="rescheduleReasonText" class="form-control small" rows="3" required placeholder="Explain the reason for rescheduling or missing the visit..."></textarea>
          </div>

          <div class="reschedule-footer">
            <button type="button" id="btnCancelReschedule" class="btn btn-secondary px-3">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary px-3 fw-bold" id="btnSubmitReschedule">
              Confirm & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("btnCloseRescheduleTop")?.addEventListener("click", closeRescheduleModal);
  document.getElementById("btnCancelReschedule")?.addEventListener("click", closeRescheduleModal);
  document.getElementById("rescheduleForm")?.addEventListener("submit", handleRescheduleSubmit);
  document.getElementById("rescheduleQuickReason")?.addEventListener("change", onRescheduleQuickReasonChange);
  document.querySelectorAll('input[name="rescheduleAction"]').forEach((r) => {
    r.addEventListener("change", toggleRescheduleActionView);
  });
}

function toggleRescheduleActionView() {
  const selectedAction = document.querySelector('input[name="rescheduleAction"]:checked')?.value || "reschedule";
  const dateFields = document.getElementById("rescheduleDateFields");
  const newDateInput = document.getElementById("rescheduleNewDate");
  if (selectedAction === "missed") {
    if (dateFields) dateFields.style.display = "none";
    if (newDateInput) newDateInput.removeAttribute("required");
  } else {
    if (dateFields) dateFields.style.display = "block";
    if (newDateInput) newDateInput.setAttribute("required", "required");
  }
}

function onRescheduleQuickReasonChange() {
  const quickSelect = document.getElementById("rescheduleQuickReason");
  const textarea = document.getElementById("rescheduleReasonText");
  if (!quickSelect || !textarea) return;
  const val = quickSelect.value;
  if (val && val !== "other") {
    textarea.value = val;
  } else if (val === "other") {
    textarea.value = "";
    textarea.focus();
  }
}

function isRescheduleRepUser(user) {
  if (!user) return false;
  if (typeof window.isRepRole === "function") return window.isRepRole(user);
  const r = window.normalizeRole ? window.normalizeRole(user.role) : String(user.role || "").toLowerCase();
  return r === "medical_rep" || r === "rep";
}

function checkVisitWasAccompanied(visit, targetRepId, dateStr, recipientDmId) {
  if (
    visit.isAccompanied ||
    visit.accompaniedWith ||
    visit.visitType === "double" ||
    visit.doubleWithUserId ||
    (Array.isArray(visit.managers) && visit.managers.length > 0)
  ) {
    return true;
  }
  try {
    const rawAcc = localStorage.getItem("pharma_dm_accompaniments");
    if (rawAcc) {
      const accMap = JSON.parse(rawAcc);
      if (accMap[dateStr] === targetRepId) return true;
      if (recipientDmId && accMap[recipientDmId] && accMap[recipientDmId][dateStr] === targetRepId) return true;
    }
  } catch (e) {}
  return false;
}

function releaseAccompanimentForDate(targetRepId, dateStr, allVisits) {
  if (!targetRepId || !dateStr) return;
  try {
    const storageKey = "pharma_dm_accompaniments";
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const cached = JSON.parse(raw);
    if (!cached || typeof cached !== "object") return;
    let changed = false;

    const hasActiveDoubleForDm = (dmId) => (allVisits || []).some((v) => {
      if (v.repId !== targetRepId || v.date !== dateStr) return false;
      const st = String(v.status || "").toLowerCase();
      if (st === "rejected" || st === "missed") return false;
      const isDouble = v.visitType === "double" || v.isAccompanied || v.accompaniedWith || Boolean(v.doubleWithUserId);
      if (!isDouble) return false;
      if (dmId && v.doubleWithUserId && v.doubleWithUserId !== dmId) return false;
      return true;
    });

    if (cached[dateStr] === targetRepId && !hasActiveDoubleForDm(null)) {
      delete cached[dateStr];
      changed = true;
    }

    Object.keys(cached).forEach((dmId) => {
      const scheduleObj = cached[dmId];
      if (scheduleObj && typeof scheduleObj === "object" && scheduleObj[dateStr] === targetRepId) {
        if (!hasActiveDoubleForDm(dmId)) {
          delete scheduleObj[dateStr];
          if (Object.keys(scheduleObj).length === 0) {
            delete cached[dmId];
          }
          changed = true;
        }
      }
    });

    if (changed) {
      localStorage.setItem(storageKey, JSON.stringify(cached));
    }
  } catch (e) {
    console.error("Error releasing accompaniment schedule:", e);
  }
}

function openRescheduleModal(visitId) {
  const user = getAuthenticatedRescheduleUser();
  if (!user) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const today = getLocalTodayStr();
  const isRep = isRescheduleRepUser(user);

  // 1. Quota Check: Max 2 reschedules per day applies only to Medical Reps
  const usedToday = getDailyRescheduleCount(user.id, today);
  if (isRep && usedToday >= 2) {
    const quotaMsg = "Sorry, you have reached the maximum daily limit for rescheduling or marking visits as missed (max 2 visits per day). Please consult your direct manager.";
    if (typeof showToast === "function") showToast(quotaMsg, "warning");
    return;
  }

  // 2. Fetch Visit & Validate Ownership / Status
  const allVisits = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const visit = allVisits.find((v) => String(v.id) === String(visitId));
  if (!visit) {
    if (typeof showToast === "function") showToast("Visit not found.", "error");
    return;
  }
  if (!canManageVisitReschedule(user, visit)) {
    if (typeof showToast === "function") showToast("Permission Denied: You cannot modify another representative's visit.", "error");
    return;
  }
  if (!isVisitReschedulable(visit)) {
    if (typeof showToast === "function") showToast("Completed, missed, or rejected visits cannot be rescheduled.", "warning");
    return;
  }

  attachRescheduleModal();

  // Populate Target Info
  document.getElementById("rescheduleVisitId").value = visit.id;
  document.getElementById("rescheduleTargetName").textContent = visit.doctorName || visit.targetName || "Target";
  const currentPeriod = (visit.period || "pm").toUpperCase();
  document.getElementById("rescheduleCurrentSchedule").textContent = `Current: ${visit.date} (${currentPeriod})`;

  // Update Quota Text
  const quotaTextEl = document.getElementById("rescheduleQuotaText");
  if (quotaTextEl) {
    quotaTextEl.textContent = isRep
      ? `Daily limit: (${usedToday} of 2 used - ${Math.max(0, 2 - usedToday)} remaining today)`
      : `Manager / Admin Override (Unlimited daily adjustments)`;
  }

  // Set Default Date to Tomorrow (local date without mutating shared Date instance)
  const tomorrowStr = getLocalTomorrowStr();
  const newDateInput = document.getElementById("rescheduleNewDate");
  if (newDateInput) {
    newDateInput.min = today;
    newDateInput.value = tomorrowStr;
  }

  const periodSelect = document.getElementById("rescheduleNewPeriod");
  if (periodSelect && visit.period) {
    periodSelect.value = visit.period.toLowerCase();
  }

  const radioReschedule = document.querySelector('input[name="rescheduleAction"][value="reschedule"]');
  if (radioReschedule) radioReschedule.checked = true;
  toggleRescheduleActionView();

  const quickReasonSelect = document.getElementById("rescheduleQuickReason");
  if (quickReasonSelect) quickReasonSelect.value = "";
  const reasonText = document.getElementById("rescheduleReasonText");
  if (reasonText) reasonText.value = "";

  const modal = document.getElementById("rescheduleVisitModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeRescheduleModal() {
  const modal = document.getElementById("rescheduleVisitModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function notifyManagerOnRescheduleOrMissed(options) {
  const { action, visit, oldDate, newDate, reason, targetRepId, user, wasAccompanied } = options;
  const repObj = (window.store && window.store.users)
    ? window.store.users.getById(targetRepId)
    : ((window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) ? window.DEMO_DATA.users.find((u) => u.id === targetRepId) : null);
  const recipientDmId = (repObj && repObj.managerId) || user.managerId || null;
  const repDisplayName = (repObj && repObj.name) || user.name || "Medical Representative";
  const rawTargetName = visit.doctorName || visit.targetName || "Target";
  const isPharm = visit.targetType === "pharmacy" || (visit.period || "").toLowerCase() === "pharmacy" || (visit.doctorId && String(visit.doctorId).startsWith("pharm"));
  const targetLabel = isPharm
    ? `Pharmacy ${rawTargetName}`
    : (/^dr\.?\s/i.test(rawTargetName) ? rawTargetName : `Dr. ${rawTargetName}`);
  const actionDate = action === "reschedule" ? oldDate : visit.date;

  const isAccompanied = typeof wasAccompanied === "boolean"
    ? wasAccompanied
    : checkVisitWasAccompanied(visit, targetRepId, actionDate, recipientDmId);

  if (recipientDmId && typeof window.addWorkflowNotification === "function") {
    if (action === "reschedule") {
      if (isAccompanied) {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "warning",
          icon: '<svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          badgeClass: "bg-danger",
          title: "Joint Visit Alert: Rescheduled",
          message: `Rep ${repDisplayName} rescheduled joint visit with ${targetLabel} from ${oldDate} to ${newDate}. Reason: ${reason}`,
          note: reason,
          link: "visits.html?date=" + newDate,
          actorName: repDisplayName,
          action: "reschedule"
        });
      } else {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "visit",
          icon: '<svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
          badgeClass: "bg-warning",
          title: "Visit Rescheduled",
          message: `Rep ${repDisplayName} rescheduled visit with ${targetLabel} to ${newDate}. Reason: ${reason}`,
          note: reason,
          link: "visits.html?date=" + newDate,
          actorName: repDisplayName,
          action: "reschedule"
        });
      }
    } else if (action === "missed") {
      if (isAccompanied) {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "warning",
          icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
          badgeClass: "bg-danger",
          title: "Joint Visit Alert: Missed Call",
          message: `Rep ${repDisplayName} marked joint visit with ${targetLabel} on ${visit.date} as missed. Reason: ${reason}`,
          note: reason,
          link: "visits.html?date=" + visit.date,
          actorName: repDisplayName,
          action: "missed"
        });
      } else {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "visit",
          icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
          badgeClass: "bg-warning",
          title: "Missed Call Logged",
          message: `Rep ${repDisplayName} marked visit with ${targetLabel} on ${visit.date} as missed. Reason: ${reason}`,
          note: reason,
          link: "visits.html?date=" + visit.date,
          actorName: repDisplayName,
          action: "missed"
        });
      }
    }
  }
}

function handleRescheduleSubmit(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();

  const user = getAuthenticatedRescheduleUser();
  if (!user) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const today = getLocalTodayStr();
  const isRep = isRescheduleRepUser(user);

  // Re-verify quota (Medical Reps only)
  const usedToday = getDailyRescheduleCount(user.id, today);
  if (isRep && usedToday >= 2) {
    const quotaMsg = "Sorry, you have reached the maximum daily limit for rescheduling visits (max 2 per day).";
    if (typeof showToast === "function") showToast(quotaMsg, "warning");
    return;
  }

  const visitId = document.getElementById("rescheduleVisitId").value;
  const action = document.querySelector('input[name="rescheduleAction"]:checked')?.value || "reschedule";
  const reason = document.getElementById("rescheduleReasonText").value.trim();

  // Validate mandatory reason
  if (!reason || reason.length < 3) {
    const reasonMsg = "Please provide a valid reason (mandatory).";
    if (typeof showToast === "function") showToast(reasonMsg, "warning");
    document.getElementById("rescheduleReasonText")?.focus();
    return;
  }

  const allVisits = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const visit = allVisits.find((v) => String(v.id) === String(visitId));
  if (!visit) return;

  if (!canManageVisitReschedule(user, visit)) {
    if (typeof showToast === "function") showToast("Permission Denied: You cannot modify another representative's visit.", "error");
    return;
  }

  if (!isVisitReschedulable(visit)) {
    if (typeof showToast === "function") showToast("Completed, missed, or rejected visits cannot be rescheduled.", "warning");
    return;
  }

  visit.rescheduleHistory = visit.rescheduleHistory || [];

  if (action === "reschedule") {
    const newDate = document.getElementById("rescheduleNewDate").value;
    const newPeriod = document.getElementById("rescheduleNewPeriod").value;

    if (!newDate) {
      if (typeof showToast === "function") showToast("Please select new date.", "warning");
      return;
    }

    if (newDate < today) {
      if (typeof showToast === "function") showToast("Cannot reschedule a visit to a past date.", "warning");
      return;
    }

    if (newDate === visit.date && String(newPeriod).toLowerCase() === String(visit.period || "pm").toLowerCase()) {
      if (typeof showToast === "function") showToast("Please select a different date or period.", "warning");
      return;
    }

    // 1. Verify that newDate is not a public holiday or employee leave
    const targetRepId = visit.repId || user.id;
    const checkDateFn = window.checkVisitDateAllowed || (typeof checkVisitDateAllowed === "function" ? checkVisitDateAllowed : null);
    if (checkDateFn) {
      const dateCheck = checkDateFn(newDate, targetRepId, lang);
      if (!dateCheck.allowed) {
        if (typeof showToast === "function") showToast(dateCheck.message, "warning");
        return;
      }
    }

    // 2. Verify that doctor is not already scheduled on newDate for this rep
    const docId = visit.doctorId || visit.targetId;
    const checkDupFn = window.isDoctorAlreadyVisitedToday || (typeof isDoctorAlreadyVisitedToday === "function" ? isDoctorAlreadyVisitedToday : null);
    if (docId && checkDupFn && checkDupFn(docId, newDate, targetRepId, visit.id)) {
      const dupMsg = "A visit is already scheduled for this doctor on the new date. Please choose another date.";
      if (typeof showToast === "function") showToast(dupMsg, "warning");
      return;
    }

    const oldDate = visit.date;
    const repObjForNotif = (window.store && window.store.users)
      ? window.store.users.getById(targetRepId)
      : ((window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) ? window.DEMO_DATA.users.find((u) => u.id === targetRepId) : null);
    const recipientDmId = (repObjForNotif && repObjForNotif.managerId) || user.managerId || null;
    const wasAccompanied = checkVisitWasAccompanied(visit, targetRepId, oldDate, recipientDmId);

    visit.date = newDate;
    visit.period = newPeriod;
    visit.rescheduledTodayDate = today;
    visit.lastRescheduleReason = reason;

    // Clear accompaniment markers so double-visit status does not leak onto the unbooked newDate
    if (visit.visitType === "double") visit.visitType = "single";
    delete visit.doubleWithUserId;
    delete visit.doubleWithUserName;
    delete visit.isAccompanied;
    delete visit.accompaniedWith;
    if (Array.isArray(visit.managers)) delete visit.managers;

    visit.rescheduleHistory.push({
      action: "reschedule",
      fromOriginalDate: oldDate,
      toNewDate: newDate,
      reason: reason,
      performedAt: new Date().toISOString(),
      performedOnDate: today,
      byUserId: user.id
    });

    if (window.store && window.store.visits && typeof window.store.visits.update === "function") {
      window.store.visits.update(visit.id, visit);
    } else {
      if (window.saveDataToStorage) window.saveDataToStorage();
      if (typeof document !== "undefined" && typeof CustomEvent === "function") {
        document.dispatchEvent(new CustomEvent("pharma:store:changed", { detail: { entity: "visits", action: "update", payload: visit } }));
      }
    }

    // Release accompaniment lock for oldDate if no other active double visits remain on that date
    releaseAccompanimentForDate(targetRepId, oldDate, allVisits);

    notifyManagerOnRescheduleOrMissed({
      action: "reschedule",
      visit,
      oldDate,
      newDate,
      reason,
      targetRepId,
      user,
      wasAccompanied
    });

    const successMsg = `Visit rescheduled successfully to ${newDate}.`;
    if (typeof showToast === "function") showToast(successMsg, "success");

  } else if (action === "missed") {
    const targetRepId = visit.repId || user.id;
    const repObjForNotif = (window.store && window.store.users)
      ? window.store.users.getById(targetRepId)
      : ((window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) ? window.DEMO_DATA.users.find((u) => u.id === targetRepId) : null);
    const recipientDmId = (repObjForNotif && repObjForNotif.managerId) || user.managerId || null;
    const wasAccompanied = checkVisitWasAccompanied(visit, targetRepId, visit.date, recipientDmId);

    visit.status = "missed";
    visit.missedReason = reason;
    visit.missedAt = new Date().toISOString();
    visit.missedOnDate = today;
    visit.rescheduledTodayDate = today;
    visit.rescheduleHistory.push({
      action: "missed",
      fromOriginalDate: visit.date,
      reason: reason,
      performedAt: new Date().toISOString(),
      performedOnDate: today,
      byUserId: user.id
    });

    if (window.store && window.store.visits && typeof window.store.visits.update === "function") {
      window.store.visits.update(visit.id, visit);
    } else {
      if (window.saveDataToStorage) window.saveDataToStorage();
      if (typeof document !== "undefined" && typeof CustomEvent === "function") {
        document.dispatchEvent(new CustomEvent("pharma:store:changed", { detail: { entity: "visits", action: "update", payload: visit } }));
      }
    }

    releaseAccompanimentForDate(targetRepId, visit.date, allVisits);

    notifyManagerOnRescheduleOrMissed({
      action: "missed",
      visit,
      oldDate: visit.date,
      newDate: null,
      reason,
      targetRepId,
      user,
      wasAccompanied
    });

    const successMsg = `Marked visit as missed call successfully.`;
    if (typeof showToast === "function") showToast(successMsg, "info");
  }

  closeRescheduleModal();

  // Refresh UI
  if (typeof renderVisitsTimeline === "function") {
    renderVisitsTimeline();
  }
  if (typeof renderDashboard === "function") {
    renderDashboard();
  }
  if (typeof window.renderCalendar === "function") {
    window.renderCalendar();
  } else if (typeof renderCalendar === "function") {
    renderCalendar();
  }
}

window.getDailyRescheduleCount = getDailyRescheduleCount;
window.attachRescheduleModal = attachRescheduleModal;
window.openRescheduleModal = openRescheduleModal;
window.closeRescheduleModal = closeRescheduleModal;
window.toggleRescheduleActionView = toggleRescheduleActionView;
window.onRescheduleQuickReasonChange = onRescheduleQuickReasonChange;
window.handleRescheduleSubmit = handleRescheduleSubmit;