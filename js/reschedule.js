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
    if (v.repId === userId) {
      if (v.rescheduledTodayDate === dateStr) {
        count++;
      } else if (v.missedOnDate === dateStr) {
        count++;
      } else if (Array.isArray(v.rescheduleHistory)) {
        if (v.rescheduleHistory.some((h) => h.performedOnDate === dateStr && h.byUserId === userId)) {
          count++;
        }
      }
    }
  });
  return count;
}

function attachRescheduleModal() {
  if (document.getElementById("rescheduleVisitModal")) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const modalHtml = `
    <div class="modal-overlay" id="rescheduleVisitModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 3100; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
      <div class="modal-box" style="background: var(--surface, #ffffff); color: var(--text-color, #1e293b); width: 92%; max-width: 500px; max-height: 90vh; overflow-y: auto; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1); border: 1px solid var(--border-color, #e2e8f0); pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 12px;">
          <h4 style="margin: 0; font-weight: 700; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
            <span>🗓️</span>
            <span id="rescheduleModalHeading">${isAr ? "تأجيل الزيارة أو تعذر المقابلة" : "Reschedule or Missed Call"}</span>
          </h4>
          <button type="button" onclick="closeRescheduleModal()" style="border: none; background: none; font-size: 1.5rem; cursor: pointer; color: var(--gray-500, #64748b); line-height: 1;">&times;</button>
        </div>

        <!-- Daily Quota Info -->
        <div id="rescheduleQuotaBanner" style="background: rgba(13, 110, 253, 0.08); border: 1px solid rgba(13, 110, 253, 0.2); color: #0d6efd; padding: 8px 12px; border-radius: 8px; font-size: 0.82rem; margin-bottom: 14px; display: flex; align-items: center; gap: 6px;">
          <span>ℹ️</span>
          <span id="rescheduleQuotaText">...</span>
        </div>

        <!-- Target Info -->
        <div style="background: var(--surface-hover, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 12px; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;" id="rescheduleTargetName">-</div>
          <div style="font-size: 0.82rem; color: var(--gray-500, #64748b);" id="rescheduleCurrentSchedule">-</div>
        </div>

        <form id="rescheduleForm" onsubmit="handleRescheduleSubmit(event)">
          <input type="hidden" id="rescheduleVisitId" value="">

          <div class="form-group" style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.88rem;">
              ${isAr ? "الإجراء المطلوب:" : "Action:"}
            </label>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.88rem; font-weight: 600;">
                <input type="radio" name="rescheduleAction" value="reschedule" checked onchange="toggleRescheduleActionView()">
                <span>${isAr ? "🗓️ تأجيل لتاريخ لاحق" : "🗓️ Reschedule to Later Date"}</span>
              </label>
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.88rem; font-weight: 600; color: #dc3545;">
                <input type="radio" name="rescheduleAction" value="missed" onchange="toggleRescheduleActionView()">
                <span>${isAr ? "🚫 تعذر المقابلة (لم تتم)" : "🚫 Missed Call (Unavailable)"}</span>
              </label>
            </div>
          </div>

          <!-- Date fields for rescheduling -->
          <div id="rescheduleDateFields" style="display: block; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;">
                  ${isAr ? "التاريخ الجديد (إجباري):" : "New Date (Mandatory):"}
                </label>
                <input type="date" id="rescheduleNewDate" class="form-control" style="width: 100%; padding: 8px 12px; border-radius: 8px;">
              </div>
              <div class="form-group">
                <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;">
                  ${isAr ? "الفترة:" : "Period:"}
                </label>
                <select id="rescheduleNewPeriod" class="form-control" style="width: 100%; padding: 8px 12px; border-radius: 8px;">
                  <option value="am">${isAr ? "صباحية AM (مستشفيات)" : "AM (Hospitals)"}</option>
                  <option value="pm" selected>${isAr ? "مسائية PM (عيادات)" : "PM (Doctors)"}</option>
                  <option value="pharmacy">${isAr ? "صيدليات" : "Pharmacy"}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Reason Selection & Textarea (MANDATORY) -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;">
              ${isAr ? "سبب التأجيل أو تعذر المقابلة" : "Reason for Reschedule / Missed Call"} <span style="color: #dc3545;">* (${isAr ? "إجباري" : "Mandatory"})</span>:
            </label>
            <select id="rescheduleQuickReason" class="form-control" style="width: 100%; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;" onchange="onRescheduleQuickReasonChange()">
              <option value="">${isAr ? "-- اختر سبباً شائعاً أو اكتب بالتفصيل بالأسفل --" : "-- Select common reason or write below --"}</option>
              <option value="${isAr ? 'طبيب مسافر / غير متواجد' : 'Doctor Traveling / Unavailable'}">✈️ ${isAr ? 'طبيب مسافر / غير متواجد' : 'Doctor Traveling / Unavailable'}</option>
              <option value="${isAr ? 'عملية جراحية طارئة / مؤتمر طبي' : 'Emergency Surgery / Medical Conference'}">🏥 ${isAr ? 'عملية جراحية طارئة / مؤتمر طبي' : 'Emergency Surgery / Medical Conference'}</option>
              <option value="${isAr ? 'العيادة مغلقة / اعتذار السكرتارية' : 'Clinic Closed / Secretary Apology'}">🔒 ${isAr ? 'العيادة مغلقة / اعتذار السكرتارية' : 'Clinic Closed / Secretary Apology'}</option>
              <option value="${isAr ? 'ازدحام شديد وضيق وقت الطبيب' : 'Severe Overcrowding / Doctor Short Time'}">⏳ ${isAr ? 'ازدحام شديد وضيق وقت الطبيب' : 'Severe Overcrowding / Doctor Short Time'}</option>
              <option value="${isAr ? 'ظروف جوية أو طارئة في خط السير' : 'Weather / Route Emergency'}">🌧️ ${isAr ? 'ظروف جوية أو طارئة في خط السير' : 'Weather / Route Emergency'}</option>
              <option value="other">✍️ ${isAr ? 'سبب آخر (توضيح بالتفصيل)' : 'Other (Specify details)'}</option>
            </select>
            <textarea id="rescheduleReasonText" class="form-control" rows="3" required placeholder="${isAr ? 'اكتب سبب التأجيل أو تعذر المقابلة بالتفصيل هنا...' : 'Explain the reason for rescheduling or missing the visit...'}" style="width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem;"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 14px;">
            <button type="button" class="btn btn-secondary" onclick="closeRescheduleModal()" style="padding: 8px 16px; border-radius: 8px;">
              ${isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" class="btn btn-primary" id="btnSubmitReschedule" style="padding: 8px 20px; border-radius: 8px; font-weight: 700;">
              ${isAr ? "تأكيد وحفظ الإجراء" : "Confirm & Save"}
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

  const user = (typeof currentUser !== "undefined" && currentUser) || (window.checkAuth && window.checkAuth()) || { id: "rep1", name: "Ahmed Mostafa" };
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const today = (window.getSystemTodayStr && window.getSystemTodayStr()) || new Date().toISOString().split("T")[0];

  // 1. Quota Check: Max 2 reschedules per day
  const usedToday = getDailyRescheduleCount(user.id, today);
  if (usedToday >= 2) {
    const quotaMsg = isAr
      ? "⚠️ عفواً، لقد بلغت الحد الأقصى المسموح به لتأجيل أو تسجيل تعذر الزيارات اليوم (زيارتان فقط في اليوم الواحد). يرجى التواصل مع مديرك المباشر."
      : "⚠️ Sorry, you have reached the maximum daily limit for rescheduling or marking visits as missed (max 2 visits per day). Please consult your direct manager.";
    if (typeof showToast === "function") {
      showToast(quotaMsg, "warning");
    } else {
      alert(quotaMsg);
    }
    return;
  }

  // 2. Fetch Visit
  const allVisits = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const visit = allVisits.find((v) => String(v.id) === String(visitId));
  if (!visit) {
    if (typeof showToast === "function") showToast(isAr ? "تعذر العثور على الزيارة." : "Visit not found.", "error");
    return;
  }

  // Populate Target Info
  document.getElementById("rescheduleVisitId").value = visit.id;
  document.getElementById("rescheduleTargetName").textContent = visit.doctorName || visit.targetName || "Target";
  const currentPeriod = (visit.period || "pm").toUpperCase();
  document.getElementById("rescheduleCurrentSchedule").textContent = `${isAr ? "الموعد الحالي:" : "Current:"} ${visit.date} (${currentPeriod})`;

  // Update Quota Text
  const quotaTextEl = document.getElementById("rescheduleQuotaText");
  if (quotaTextEl) {
    quotaTextEl.textContent = isAr
      ? `الحد المسموح للتأجيل اليوم: (${usedToday} من 2 مستخدمة - متبقي لك ${2 - usedToday} تأجيل)`
      : `Daily limit: (${usedToday} of 2 used - ${2 - usedToday} remaining today)`;
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

function handleRescheduleSubmit(e) {
  e.preventDefault();

  const user = (typeof currentUser !== "undefined" && currentUser) || (window.checkAuth && window.checkAuth()) || { id: "rep1", name: "Ahmed Mostafa" };
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const today = (window.getSystemTodayStr && window.getSystemTodayStr()) || new Date().toISOString().split("T")[0];

  // Re-verify quota
  const usedToday = getDailyRescheduleCount(user.id, today);
  if (usedToday >= 2) {
    const quotaMsg = isAr
      ? "⚠️ عفواً، لقد بلغت الحد الأقصى المسموح به لتأجيل أو تسجيل تعذر الزيارات اليوم (زيارتان فقط في اليوم الواحد)."
      : "⚠️ Sorry, you have reached the maximum daily limit for rescheduling visits (max 2 per day).";
    if (typeof showToast === "function") showToast(quotaMsg, "warning");
    return;
  }

  const visitId = document.getElementById("rescheduleVisitId").value;
  const action = document.querySelector('input[name="rescheduleAction"]:checked')?.value || "reschedule";
  const reason = document.getElementById("rescheduleReasonText").value.trim();

  // Validate mandatory reason
  if (!reason || reason.length < 3) {
    const reasonMsg = isAr
      ? "⚠️ يرجى كتابة سبب التأجيل أو تعذر المقابلة (إجباري)."
      : "⚠️ Please provide a valid reason (mandatory).";
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
      if (typeof showToast === "function") showToast(isAr ? "يرجى تحديد التاريخ الجديد." : "Please select new date.", "warning");
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
      const dupMsg = isAr
        ? "⚠️ يوجد زيارة مسجلة بالفعل لهذا الطبيب في التاريخ الجديد المحدد. يرجى اختيار تاريخ آخر."
        : "⚠️ A visit is already scheduled for this doctor on the new date. Please choose another date.";
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

    const successMsg = isAr
      ? `تم تأجيل زيارة "${visit.doctorName || 'العميل'}" بنجاح إلى تاريخ ${newDate}.`
      : `Visit rescheduled successfully to ${newDate}.`;
    if (typeof showToast === "function") showToast(successMsg, "success");

  } else if (action === "missed") {
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

    const successMsg = isAr
      ? `تم تسجيل تعذر المقابلة لـ "${visit.doctorName || 'العميل'}" بنجاح.`
      : `Marked visit as missed call successfully.`;
    if (typeof showToast === "function") showToast(successMsg, "info");
  }

  closeRescheduleModal();

  // Refresh UI
  if (typeof renderVisitsTimeline === "function") {
    renderVisitsTimeline();
  }
  if (typeof renderStats === "function") {
    renderStats();
  }
  if (typeof renderDashboard === "function") {
    renderDashboard();
  }
}

window.getDailyRescheduleCount = getDailyRescheduleCount;
window.attachRescheduleModal = attachRescheduleModal;
window.openRescheduleModal = openRescheduleModal;
window.closeRescheduleModal = closeRescheduleModal;
window.toggleRescheduleActionView = toggleRescheduleActionView;
window.onRescheduleQuickReasonChange = onRescheduleQuickReasonChange;
window.handleRescheduleSubmit = handleRescheduleSubmit;