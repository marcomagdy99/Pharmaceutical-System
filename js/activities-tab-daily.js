/**
 * @file activities-tab-daily.js
 * @description Tab 1: Daily Field Activities & Weekly Sat-Fri Calendar Grid
 */

(function (window) {
  "use strict";
  const Core = window.ActivitiesCore;
  if (!Core) return;

  const ACTIVITY_ICONS = {
    "Visit": "🚶‍♂️",
    "Office Work": "🏢",
    "Training": "📚",
    "Meeting": "👥",
    "Conference": "🎤",
  };

  function renderDailyActivities() {
    renderActivitiesView();
  }

  function renderActivitiesView() {
    if (!Core._state.currentDate || isNaN(new Date(Core._state.currentDate).getTime())) {
      Core._state.currentDate = (window.getSystemDate && window.getSystemDate()) || new Date();
    }
    if (!Core._state.currentUser) {
      Core._state.currentUser = Core.getAuthUser();
    }
    const curDate = Core._state.currentDate;
    const curDateStr = Core.formatDate(curDate);
    const userId = Core._state.currentUser?.id || "rep1";

    const dateDisp = document.getElementById("currentDateDisplay");
    if (dateDisp) {
      dateDisp.textContent = curDateStr;
    }

    const dayActivities = Core.StoreAdapter.getActivities(userId, curDateStr) || {};
    renderPeriodCard(Core.PERIODS.AM, dayActivities[Core.PERIODS.AM]);
    renderPeriodCard(Core.PERIODS.PM, dayActivities[Core.PERIODS.PM]);
    renderWeeklyOverview();
  }

  function renderPeriodCard(period, activity) {
    const isAm = period === Core.PERIODS.AM;
    const contentBox = document.getElementById(isAm ? "amContent" : "pmContent");
    const badge = document.getElementById(isAm ? "amStatusBadge" : "pmStatusBadge");
    if (!contentBox || !badge) return;

    if (!activity || !activity.type) {
      badge.textContent = `⏳ ${Core.t("statusNotLogged")}`;
      badge.className = "badge status-not-logged";
      contentBox.innerHTML = `
        <div class="empty-period-state">
          <p class="empty-period-text">${Core.t("noActivityLogged")}</p>
        </div>
      `;
      return;
    }

    badge.textContent = `✓ ${Core.t("statusLogged")}`;
    badge.className = "badge status-logged";

    const actIcon = ACTIVITY_ICONS[activity.type] || "📌";
    let extraLink = "";
    if (activity.type === Core.ACTIVITY_TYPES.VISIT) {
      extraLink = `
        <div style="margin-top: 10px;">
          <a href="visits.html" class="btn btn-outline btn-sm visit-action-link" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
            <span>🚶</span> <span>${Core.t("goToVisits")}</span>
          </a>
        </div>
      `;
    }

    contentBox.innerHTML = `
      <div class="logged-activity-card">
        <div class="activity-type-title">
          <span style="font-size:1.3rem;">${actIcon}</span>
          <strong style="font-size:1.05rem;">${Core.escapeHTML(activity.type)}</strong>
        </div>
        ${activity.notes ? `<div class="activity-notes-text">💬 ${Core.escapeHTML(activity.notes)}</div>` : ""}
        ${extraLink}
      </div>
    `;
  }

  function renderWeeklyOverview() {
    const grid = document.getElementById("weeklyGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!Core._state.currentDate || isNaN(new Date(Core._state.currentDate).getTime())) {
      Core._state.currentDate = (window.getSystemDate && window.getSystemDate()) || new Date();
    }
    if (!Core._state.currentUser) {
      Core._state.currentUser = Core.getAuthUser();
    }

    const weekStart = Core.getWeekStart(Core._state.currentDate);
    const curDateStr = Core.formatDate(Core._state.currentDate);
    const userId = Core._state.currentUser?.id || "rep1";

    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
    const isThursdayWeekend = !!companySettings.isThursdayWeekend;

    for (let i = 0; i < 7; i++) {
      const dayDate = Core.addDays(weekStart, i);
      const dayStr = Core.formatDate(dayDate);
      const isSelected = dayStr === curDateStr;
      const dayKey = Core.WEEK_DAY_KEYS[i];
      const isDayOff = i === 6 || (i === 5 && isThursdayWeekend);
      const acts = Core.StoreAdapter.getActivities(userId, dayStr) || {};

      const hasAm = !!(acts[Core.PERIODS.AM] && acts[Core.PERIODS.AM].type);
      const hasPm = !!(acts[Core.PERIODS.PM] && acts[Core.PERIODS.PM].type);

      const card = document.createElement("div");
      let cardClass = "week-card";
      if (isSelected) cardClass += " selected";
      if (isDayOff) cardClass += " day-off";
      card.className = cardClass;

      card.onclick = () => {
        Core._state.currentDate = dayDate;
        renderActivitiesView();
      };

      const dayName = Core.t(dayKey);
      const dateShort = Core.formatDateShort(dayDate);

      card.innerHTML = `
        <div class="week-card-inner">
          <div class="week-card-day-name">
            <span>${dayName}</span>
          </div>
          <div class="week-card-date-sub">${dateShort}</div>
          ${
            isDayOff
              ? `<div class="week-card-off-notice">${Core.t("dayOff")}</div>`
              : `<div class="week-card-shift-badges">
                  <span class="shift-badge ${hasAm ? "logged" : "not-logged"}">${hasAm ? "✓ AM" : "○ AM"}</span>
                  <span class="shift-badge ${hasPm ? "logged" : "not-logged"}">${hasPm ? "✓ PM" : "○ PM"}</span>
                 </div>`
          }
        </div>
      `;

      grid.appendChild(card);
    }
  }

  function openActivityModal(period, date) {
    const modal = document.getElementById("activityModal");
    if (!modal) return;
    const p = period || Core.PERIODS.AM;
    const d = date || Core.formatDate(Core._state.currentDate);
    const userId = Core._state.currentUser?.id;
    const existing = (Core.StoreAdapter.getActivities(userId, d) || {})[p] || {};

    const periodSel = document.getElementById("activityPeriod");
    if (periodSel) periodSel.value = p;
    const typeSel = document.getElementById("activityType");
    if (typeSel) typeSel.value = existing.type || "";
    const notesInp = document.getElementById("activityNotes");
    if (notesInp) notesInp.value = existing.notes || "";

    const delBtn = document.getElementById("btnDeleteActivity");
    if (delBtn) delBtn.style.display = existing.type ? "inline-flex" : "none";

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeActivityModal() {
    const modal = document.getElementById("activityModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  function handleActivitySubmit(e) {
    e.preventDefault();
    const period = document.getElementById("activityPeriod")?.value || Core.PERIODS.AM;
    const type = document.getElementById("activityType")?.value;
    const notes = document.getElementById("activityNotes")?.value || "";

    if (!type) {
      Core.safeShowToast(Core.t("selectActivityTypeWarning"), "warning");
      return;
    }

    const curDateStr = Core.formatDate(Core._state.currentDate);
    const userId = Core._state.currentUser?.id;
    Core.StoreAdapter.saveActivity(userId, curDateStr, period, {
      type,
      notes,
      updatedAt: new Date().toISOString(),
    });

    closeActivityModal();
    renderActivitiesView();
    Core.safeShowToast(Core.t("successAction"), "success");
  }

  function deleteCurrentActivity() {
    if (!confirm(Core.t("confirmDeleteActivity"))) return;
    const period = document.getElementById("activityPeriod")?.value || Core.PERIODS.AM;
    const curDateStr = Core.formatDate(Core._state.currentDate);
    const userId = Core._state.currentUser?.id;

    Core.StoreAdapter.deleteActivity(userId, curDateStr, period);
    closeActivityModal();
    renderActivitiesView();
    Core.safeShowToast(Core.t("activityDeleted"), "info");
  }

  window.ActivitiesDaily = {
    renderDailyActivities,
    renderActivitiesView,
    renderPeriodCard,
    renderWeeklyOverview,
    openActivityModal,
    closeActivityModal,
    handleActivitySubmit,
    deleteCurrentActivity,
  };
})(window);