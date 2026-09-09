/**
 * @file activities.js
 * @description Daily activity logging with interactive modal handling and persistent storage.
 */

const activityTranslations = {
  en: {
    activitiesTitle: "PharmaCare - Activities",
    dailyActivities: "Daily Activities",
    today: "Today",
    amPeriod: "AM Period",
    pmPeriod: "PM Period",
    logActivity: "Log Activity",
    logActivityTitle: "Log Activity",
    weeklyOverview: "Weekly Overview (Sat - Thu)",
    period: "Period",
    activityType: "Activity Type",
    selectActivity: "Select Activity...",
    typeVisit: "Visit",
    typeOfficeWork: "Office Work",
    typeTraining: "Training",
    typeMeeting: "Meeting",
    typeConference: "Conference",
    notes: "Notes",
    cancel: "Cancel",
    save: "Save",
    statusLogged: "Logged",
    statusNotLogged: "Not Logged",
    goToVisits: "Go to Visits Page",
    noActivityLogged: "No activity logged for this period.",
    sat: "Sat",
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
  },
  ar: {
    activitiesTitle: "فارماكير - الأنشطة",
    dailyActivities: "الأنشطة اليومية",
    today: "اليوم",
    amPeriod: "فترة الصباح",
    pmPeriod: "فترة المساء",
    logActivity: "تسجيل نشاط",
    logActivityTitle: "تسجيل نشاط",
    weeklyOverview: "نظرة عامة أسبوعية (السبت - الخميس)",
    period: "الفترة",
    activityType: "نوع النشاط",
    selectActivity: "اختر النشاط...",
    typeVisit: "زيارة",
    typeOfficeWork: "عمل مكتبي",
    typeTraining: "تدريب",
    typeMeeting: "اجتماع",
    typeConference: "مؤتمر",
    notes: "ملاحظات",
    cancel: "إلغاء",
    save: "حفظ",
    statusLogged: "تم التسجيل",
    statusNotLogged: "لم يتم التسجيل",
    goToVisits: "الذهاب لصفحة الزيارات",
    noActivityLogged: "لم يتم تسجيل نشاط لهذه الفترة.",
    sat: "السبت",
    sun: "الأحد",
    mon: "الاثنين",
    tue: "الثلاثاء",
    wed: "الأربعاء",
    thu: "الخميس",
    fri: "الجمعة",
  },
};

if (window.translations) {
  Object.keys(activityTranslations).forEach((lang) => {
    window.translations[lang] = {
      ...window.translations[lang],
      ...activityTranslations[lang],
    };
  });
} else {
  window.translations = activityTranslations;
}

// Persistent Storage Handlers
function loadActivities() {
  try {
    const raw = localStorage.getItem("pharma_activities_data");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    "2026-09-02": {
      AM: { type: "Training", notes: "Product formulation deep dive." },
      PM: { type: "Visit", notes: "Completed clinical visits." },
    },
  };
}

function saveActivities(data) {
  try {
    localStorage.setItem("pharma_activities_data", JSON.stringify(data));
  } catch (e) {}
}

const demoActivities = loadActivities();
let currentDate = new Date(2026, 8, 2); // Default to demo date September 2, 2026

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

/**
 * Updates UI view cards for AM and PM periods.
 */
function updateView() {
  const dateStr = formatDate(currentDate);
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const dateOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const dateDisplay = document.getElementById("currentDateDisplay");
  if (dateDisplay) {
    dateDisplay.textContent = currentDate.toLocaleDateString(
      lang === "ar" ? "ar-EG" : "en-US",
      dateOptions,
    );
  }

  const dayData = demoActivities[dateStr] || {};
  renderPeriod("AM", dayData.AM, "amContent", "amStatusBadge");
  renderPeriod("PM", dayData.PM, "pmContent", "pmStatusBadge");
  renderWeeklyOverview();
  if (window.applyTranslations) window.applyTranslations();
}

function renderPeriod(period, data, contentId, badgeId) {
  const contentEl = document.getElementById(contentId);
  const badgeEl = document.getElementById(badgeId);
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const dict = activityTranslations[lang] || activityTranslations.en;

  if (!contentEl || !badgeEl) return;

  if (data) {
    badgeEl.textContent = dict.statusLogged;
    badgeEl.className = "badge bg-success text-white";
    badgeEl.style.backgroundColor = "var(--success)";

    let html = `
      <div style="margin-bottom: 0.5rem;">
        <strong style="color: var(--gray-800);"><span>${dict.activityType}</span>:</strong> 
        <span class="badge" style="background: var(--primary-light); color: var(--primary); font-weight: bold; margin-left: 6px;">${data.type}</span>
      </div>
      <div style="margin-bottom: 0.5rem; color: var(--gray-600); font-size: 0.9rem;">${data.notes || ""}</div>
    `;
    if (data.type === "Visit") {
      html += `<a href="visits.html" class="btn btn-outline" style="display:inline-block; margin-top:0.5rem; padding: 4px 10px; font-size: 0.82rem;">${dict.goToVisits} &rarr;</a>`;
    }
    contentEl.innerHTML = html;
  } else {
    badgeEl.textContent = dict.statusNotLogged;
    badgeEl.className = "badge bg-danger text-white";
    badgeEl.style.backgroundColor = "var(--danger)";
    contentEl.innerHTML = `<div style="color: var(--gray-500); font-style: italic; padding: 10px 0;">${dict.noActivityLogged}</div>`;
  }
}

function renderWeeklyOverview() {
  const grid = document.getElementById("weeklyGrid");
  if (!grid) return;
  grid.replaceChildren();

  const currDay = currentDate.getDay();
  let startOffset = currDay === 6 ? 0 : -(currDay + 1);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() + startOffset);

  const days = ["sat", "sun", "mon", "tue", "wed", "thu"];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const dict = activityTranslations[lang] || activityTranslations.en;

  days.forEach((dayKey, index) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + index);
    const dateStr = formatDate(d);
    const dayData = demoActivities[dateStr] || {};

    const amIcon = dayData.AM
      ? '<span style="color: var(--success); font-weight: bold;">✓</span>'
      : '<span style="color: var(--danger); font-weight: bold;">✕</span>';
    const pmIcon = dayData.PM
      ? '<span style="color: var(--success); font-weight: bold;">✓</span>'
      : '<span style="color: var(--danger); font-weight: bold;">✕</span>';

    const isSelected = dateStr === formatDate(currentDate);
    const card = document.createElement("div");
    card.className = "card";
    card.style.border = isSelected
      ? "2px solid var(--primary)"
      : "1px solid var(--gray-200)";
    card.style.borderRadius = "10px";
    card.style.cursor = "pointer";
    card.style.transition = "all 0.2s ease";
    card.onclick = () => {
      currentDate = new Date(d);
      updateView();
    };

    card.innerHTML = `
      <div style="text-align: center; padding: 0.85rem;">
        <div style="font-weight: 700; margin-bottom: 0.2rem;">${dict[dayKey]}</div>
        <div style="font-size: 0.78rem; color: var(--gray-500); margin-bottom: 0.5rem;">${d.getDate()} / ${d.getMonth() + 1}</div>
        <div style="display: flex; justify-content: space-around; font-size: 0.85rem; background: var(--gray-50); padding: 0.4rem; border-radius: 6px;">
          <div>AM: ${amIcon}</div>
          <div>PM: ${pmIcon}</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ============================================================================
// Modal & Action Wireups
// ============================================================================
window.openActivityModal = function (period) {
  const modal = document.getElementById("activityModal");
  if (!modal) return;

  document.getElementById("activityDate").value = formatDate(currentDate);
  document.getElementById("activityPeriod").value = period || "AM";
  document.getElementById("activityType").value = "";
  document.getElementById("activityNotes").value = "";

  modal.style.display = "flex";
  modal.classList.add("active");
};

window.closeActivityModal = function () {
  const modal = document.getElementById("activityModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
};

window.handleActivitySubmit = function (e) {
  e.preventDefault();
  const dateStr = document.getElementById("activityDate").value;
  const period = document.getElementById("activityPeriod").value;
  const type = document.getElementById("activityType").value;
  const notes = document.getElementById("activityNotes").value;

  if (!type) {
    showToast("Please select an activity type.", "warning");
    return;
  }

  if (!demoActivities[dateStr]) {
    demoActivities[dateStr] = {};
  }

  demoActivities[dateStr][period] = { type, notes };
  saveActivities(demoActivities);

  closeActivityModal();
  updateView();
};

function initActivities() {
  document.getElementById("prevDayBtn")?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateView();
  });

  document.getElementById("nextDayBtn")?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateView();
  });

  document.getElementById("todayBtn")?.addEventListener("click", () => {
    currentDate = new Date(2026, 8, 2);
    updateView();
  });

  updateView();
}

document.addEventListener("DOMContentLoaded", initActivities);
