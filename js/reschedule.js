/**
 * @file reschedule.js
 * @description Unified Reschedule & Missed Call Module for PharmaCare.
 */

// ==========================================
// Section: Reschedule / Missed Call Module
// ==========================================

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
            <span>🗓️</span>
            <span id="rescheduleModalHeading">Reschedule or Missed Call</span>
          </h4>
          <button type="button" onclick="closeRescheduleModal()" class="reschedule-close-btn">&times;</button>
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

        <form id="rescheduleForm" onsubmit="handleRescheduleSubmit(event)">
          <input type="hidden" id="rescheduleVisitId" value="">

          <div class="form-group mb-3">
            <label class="form-label fw-bold small">
              Action:
            </label>
            <div class="reschedule-actions-row">
              <label class="reschedule-radio-label">
                <input type="radio" name="rescheduleAction" value="reschedule" checked onchange="toggleRescheduleActionView()">
                <span>🗓️ Reschedule to Later Date</span>
              </label>
              <label class="reschedule-radio-label reschedule-radio-label-danger">
                <input type="radio" name="rescheduleAction" value="missed" onchange="toggleRescheduleActionView()">
                <span>🚫 Missed Call (Unavailable)</span>
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
            <select id="rescheduleQuickReason" class="form-control mb-2" onchange="onRescheduleQuickReasonChange()">
              <option value="">-- Select common reason or write below --</option>
              <option value="Doctor Traveling / Unavailable">✈️ Doctor Traveling / Unavailable</option>
              <option value="Emergency Surgery / Medical Conference">🏥 Emergency Surgery / Medical Conference</option>
              <option value="Clinic Closed / Secretary Apology">🔒 Clinic Closed / Secretary Apology</option>
              <option value="Severe Overcrowding / Doctor Short Time">⏳ Severe Overcrowding / Doctor Short Time</option>
              <option value="Weather / Route Emergency">🌧️ Weather / Route Emergency</option>
              <option value="other">✍️ Other (Specify details)</option>
            </select>
            <textarea id="rescheduleReasonText" class="form-control small" rows="3" required placeholder="Explain the reason for rescheduling or missing the visit..."></textarea>
          </div>

          <div class="reschedule-footer">
            <button type="button" class="btn btn-secondary px-3" onclick="closeRescheduleModal()">
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

function openRescheduleModal(visitId) {
  attachRescheduleModal();

  const user = (typeof currentUser !== "undefined" && currentUser) || (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  if (!user || !user.id) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const today = (window.getSystemTodayStr && window.getSystemTodayStr()) || new Date().toISOString().split("T")[0];

  // 1. Quota Check: Max 2 reschedules per day
  const usedToday = getDailyRescheduleCount(user.id, today);
  if (usedToday >= 2) {
    const quotaMsg = "⚠️ Sorry, you have reached the maximum daily limit for rescheduling or marking visits as missed (max 2 visits per day). Please consult your direct manager.";
    showToast(quotaMsg, "warning");
    return;
  }

  // 2. Fetch Visit
  const allVisits = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const visit = allVisits.find((v) => String(v.id) === String(visitId));
  if (!visit) {
    if (typeof showToast === "function") showToast("Visit not found.", "error");
    return;
  }

  // Populate Target Info
  document.getElementById("rescheduleVisitId").value = visit.id;
  document.getElementById("rescheduleTargetName").textContent = visit.doctorName || visit.targetName || "Target";
  const currentPeriod = (visit.period || "pm").toUpperCase();
  document.getElementById("rescheduleCurrentSchedule").textContent = `Current: ${visit.date} (${currentPeriod})`;

  // Update Quota Text
  const quotaTextEl = document.getElementById("rescheduleQuotaText");
  if (quotaTextEl) {
    quotaTextEl.textContent = `Daily limit: (${usedToday} of 2 used - ${2 - usedToday} remaining today)`;
  }

  // Set Default Date to Tomorrow
  const tomorrow = (window.getSystemDate && window.getSystemDate()) || new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const _pad2 = (n) => String(n).padStart(2, "0");
  const tomorrowStr = `${tomorrow.getFullYear()}-${_pad2(tomorrow.getMonth() + 1)}-${_pad2(tomorrow.getDate())}`;
  const newDateInput = document.getElementById("rescheduleNewDate");
  if (newDateInput) {
    newDateInput.min = today;
    newDateInput.value = tomorrowStr;
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
  const { action, visit, oldDate, newDate, reason, targetRepId, user } = options;
  const repObj = (window.store && window.store.users) ? window.store.users.getById(targetRepId) : null;
  const recipientDmId = (repObj && repObj.managerId) || user.managerId || null;
  const repDisplayName = (repObj && repObj.name) || user.name || "Medical Representative";
  const doctorDisplayName = visit.doctorName || visit.targetName || "Doctor";
  const actionDate = action === "reschedule" ? oldDate : visit.date;

  let isAccompanied = false;
  if (recipientDmId) {
    try {
      const rawAcc = localStorage.getItem("pharma_dm_accompaniments");
      if (rawAcc) {
        const accMap = JSON.parse(rawAcc);
        if (accMap[actionDate] === targetRepId || (accMap[recipientDmId] && accMap[recipientDmId][actionDate] === targetRepId)) {
          isAccompanied = true;
        }
      }
    } catch (e) {}
  }
  if (visit.isAccompanied || visit.accompaniedWith || (Array.isArray(visit.managers) && visit.managers.length > 0)) {
    isAccompanied = true;
  }

  if (recipientDmId && typeof window.addWorkflowNotification === "function") {
    if (action === "reschedule") {
      if (isAccompanied) {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "warning",
          icon: "🚨",
          badgeClass: "bg-danger",
          title: "Joint Visit Alert: Rescheduled",
          message: `Rep ${repDisplayName} rescheduled joint visit with Dr. ${doctorDisplayName} from ${oldDate} to ${newDate}. Reason: ${reason}`,
          note: reason,
          link: "visits.html?date=" + newDate,
          actorName: repDisplayName,
          action: "reschedule"
        });
      } else {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "visit",
          icon: "🗓️",
          badgeClass: "bg-warning",
          title: "Visit Rescheduled",
          message: `Rep ${repDisplayName} rescheduled visit with Dr. ${doctorDisplayName} to ${newDate}. Reason: ${reason}`,
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
          icon: "🚫",
          badgeClass: "bg-danger",
          title: "Joint Visit Alert: Missed Call",
          message: `Rep ${repDisplayName} marked joint visit with Dr. ${doctorDisplayName} on ${visit.date} as missed. Reason: ${reason}`,
          note: reason,
          link: "visits.html?date=" + visit.date,
          actorName: repDisplayName,
          action: "missed"
        });
      } else {
        window.addWorkflowNotification({
          userId: recipientDmId,
          type: "visit",
          icon: "🚫",
          badgeClass: "bg-warning",
          title: "Missed Call Logged",
          message: `Rep ${repDisplayName} marked visit with Dr. ${doctorDisplayName} on ${visit.date} as missed. Reason: ${reason}`,
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
  e.preventDefault();

  const user = (typeof currentUser !== "undefined" && currentUser) || (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  if (!user || !user.id) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const today = (window.getSystemTodayStr && window.getSystemTodayStr()) || new Date().toISOString().split("T")[0];

  // Re-verify quota
  const usedToday = getDailyRescheduleCount(user.id, today);
  if (usedToday >= 2) {
    const quotaMsg = "⚠️ Sorry, you have reached the maximum daily limit for rescheduling visits (max 2 per day).";
    if (typeof showToast === "function") showToast(quotaMsg, "warning");
    return;
  }

  const visitId = document.getElementById("rescheduleVisitId").value;
  const action = document.querySelector('input[name="rescheduleAction"]:checked')?.value || "reschedule";
  const reason = document.getElementById("rescheduleReasonText").value.trim();

  // Validate mandatory reason
  if (!reason || reason.length < 3) {
    const reasonMsg = "⚠️ Please provide a valid reason (mandatory).";
    if (typeof showToast === "function") showToast(reasonMsg, "warning");
    document.getElementById("rescheduleReasonText").focus();
    return;
  }

  const allVisits = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const visit = allVisits.find((v) => String(v.id) === String(visitId));
  if (!visit) return;

  visit.rescheduleHistory = visit.rescheduleHistory || [];

  if (action === "reschedule") {
    const newDate = document.getElementById("rescheduleNewDate").value;
    const newPeriod = document.getElementById("rescheduleNewPeriod").value;

    if (!newDate) {
      if (typeof showToast === "function") showToast("Please select new date.", "warning");
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
      const dupMsg = "⚠️ A visit is already scheduled for this doctor on the new date. Please choose another date.";
      if (typeof showToast === "function") showToast(dupMsg, "warning");
      return;
    }

    const oldDate = visit.date;
    visit.date = newDate;
    visit.period = newPeriod;
    visit.rescheduledTodayDate = today;
    visit.lastRescheduleReason = reason;
    visit.rescheduleHistory.push({
      action: "reschedule",
      fromOriginalDate: oldDate,
      toNewDate: newDate,
      reason: reason,
      performedAt: new Date().toISOString(),
      performedOnDate: today,
      byUserId: user.id
    });

    if (window.store && window.store.visits) {
      window.store.visits.update(visit.id, visit);
    } else if (window.saveDataToStorage) {
      window.saveDataToStorage();
    }

    notifyManagerOnRescheduleOrMissed({
      action: "reschedule",
      visit,
      oldDate,
      newDate,
      reason,
      targetRepId,
      user
    });

    const successMsg = `Visit rescheduled successfully to ${newDate}.`;
    if (typeof showToast === "function") showToast(successMsg, "success");

  } else if (action === "missed") {
    const targetRepId = visit.repId || user.id;
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

    if (window.store && window.store.visits) {
      window.store.visits.update(visit.id, visit);
    } else if (window.saveDataToStorage) {
      window.saveDataToStorage();
    }

    notifyManagerOnRescheduleOrMissed({
      action: "missed",
      visit,
      oldDate: visit.date,
      newDate: null,
      reason,
      targetRepId,
      user
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