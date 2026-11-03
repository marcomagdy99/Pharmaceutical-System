/**
 * @file activities-tab-daily.js
 * @description Tab 1: Daily Field Activities & Weekly Sat-Fri Calendar Grid
 */

(function (window) {
  "use strict";
  const Core = window.ActivitiesCore;
  if (!Core) return;

  const ACTIVITY_ICONS = {
    "Visit": '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="4" r="2"/><path d="m9 20 3-6 3 6"/><path d="m6 12 6-3 6 3"/></svg>',
    "Office Work": '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/></svg>',
    "Training": '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    "Meeting": '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    "Conference": '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
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
    const userId = Core._state.currentUser?.id || "u1790626000001";

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

    const actIcon = ACTIVITY_ICONS[activity.type] || '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    let extraLink = "";
    if (activity.type === Core.ACTIVITY_TYPES.VISIT) {
      extraLink = `
        <div style="margin-top: 10px;">
          <a href="visits.html" class="btn btn-outline btn-sm visit-action-link" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
            <span><svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="4" r="2"/><path d="m9 20 3-6 3 6"/><path d="m6 12 6-3 6 3"/></svg></span> <span>${Core.t("goToVisits")}</span>
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
        ${activity.notes ? `<div class="activity-notes-text"><svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${Core.escapeHTML(activity.notes)}</div>` : ""}
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
    const userId = Core._state.currentUser?.id || "u1790626000001";

    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
    const secDay = companySettings.secondaryWeekendDay || (companySettings.isThursdayWeekend ? "thursday" : "none");
    const secMode = companySettings.secondaryWeekendMode || "full_day";

    for (let i = 0; i < 7; i++) {
      const dayDate = Core.addDays(weekStart, i);
      const dayStr = Core.formatDate(dayDate);
      const isSelected = dayStr === curDateStr;
      const dayKey = Core.WEEK_DAY_KEYS[i]; // 0: sat, 1: sun, ..., 5: thu, 6: fri
      
      const isFriday = i === 6;
      const isSecondary = (secDay === "saturday" && i === 0) || (secDay === "thursday" && i === 5);
      const isDayOff = isFriday || (isSecondary && secMode === "full_day");
      const isHalfDayOff = isSecondary && secMode === "pm_only";
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