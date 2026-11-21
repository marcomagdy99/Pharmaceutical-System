/**
 * @file calendar.js
 * @description Monthly Calendar Schedule Engine synchronized dynamically with Central Store visits, leaves, and HR public holidays.
 */

const calendarTranslations = {
  en: {
    selectRep: "Viewing Schedule For:",
    allReps: "All Subordinates (Team View)",
    browseOrgTree: "Browse Org Hierarchy",
    viewAllTeam: "View All Team",
    selectAllTeam: "Select Entire Team",
    orgTreeTitle: "Select Team Member / Branch",
    orgTreeSubtitle: "Pick any level (BU, LM, DM, or Rep) or search directly",
    searchPlaceholder: "Search by name, role, or employee code...",
    selectBtn: "Select",
    selectedBtn: "Selected",
    allTeamView: "All Subordinates (Team View)",
    teamBadge: "Team",
    noResults: "No team members found matching your search.",
    directReports: "direct reports",
    close: "Close",
    today: "Today",
    monthView: "Month",
    weekView: "Week",
    completedVisit: "Completed Visit",
    plannedVisit: "Planned Visit",
    approvedLeave: "Approved Leave",
    pendingLeave: "Pending Leave",
    trainingMeeting: "Training/Meeting/Conference",
    officeWork: "Office Work",
    publicHoliday: "Official Public Holiday",
    days: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    amActivities: "AM Activities",
    pmActivities: "PM Activities",
    otherActivities: "Other Activities",
    leaves: "Leaves",
    noEvents: "No events on this day.",
    statusCompleted: "Completed",
    statusPlanned: "Planned",
    statusApproved: "Approved",
    statusPending: "Pending",
  },
};

const MAX_LEAVE_EXPANSION_DAYS = 366;

function _esc(val) {
  if (typeof window !== "undefined" && typeof window.escapeHtml === "function") {
    return window.escapeHtml(val);
  }
  return String(val == null ? "" : val).replace(/[&<>"'`]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;",
  }[ch]));
}

function getCalendarAuthUser() {
  if (typeof window !== "undefined" && typeof window.checkAuth === "function") {
    const u = window.checkAuth();
    if (u && u.id) return u;
  }
  return null;
}

function getNormalizedRole(role) {
  if (typeof window !== "undefined" && typeof window.normalizeRole === "function") {
    return window.normalizeRole(role);
  }
  if (!role) return "";
  const r = String(role).toLowerCase().trim();
  if (r === "dm" || r === "district_manager" || r === "district manager") return "district_manager";
  if (r === "lm" || r === "line_manager" || r === "line manager") return "line_manager";
  if (r === "bu" || r === "business_unit" || r === "business unit") return "business_unit";
  if (r === "rep" || r === "medical_rep" || r === "medical rep") return "medical_rep";
  if (r === "pm" || r === "product_manager" || r === "product manager") return "product_manager";
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "hr" || r === "human_resources" || r === "human resources") return "hr";
  if (r === "gm" || r === "general_manager" || r === "general manager") return "general_manager";
  return r;
}

function hasFullOrgCalendarAccess(user) {
  if (!user) return false;
  const role = getNormalizedRole(user.role);
  return role === "admin" || role === "hr" || role === "general_manager";
}

function isCalendarRep(user) {
  if (!user) return false;
  return getNormalizedRole(user.role) === "medical_rep";
}

function isUserInactive(u) {
  if (!u || !u.status) return false;
  const st = String(u.status).trim().toLowerCase();
  return st === "inactive" || st === "suspended" || st === "disabled";
}

function getAllCalendarUsers() {
  if (typeof window !== "undefined" && window.store && window.store.users && typeof window.store.users.getAll === "function") {
    const list = window.store.users.getAll();
    if (Array.isArray(list)) return list;
  }
  return (typeof window !== "undefined" && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users))
    ? window.DEMO_DATA.users
    : [];
}

function getCalendarHolidays() {
  if (typeof window !== "undefined" && window.store && window.store.publicHolidays && typeof window.store.publicHolidays.getAll === "function") {
    const list = window.store.publicHolidays.getAll();
    if (Array.isArray(list)) return list;
  }
  if (typeof window !== "undefined" && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.publicHolidays)) {
    return window.DEMO_DATA.publicHolidays;
  }
  return [];
}

/**
 * Dynamically aggregates visits, leaves, and activities from Central Store and persistent storage.
 */
function getDynamicCalendarEvents() {
  const events = [];
  const currentCalendarUser = getCalendarAuthUser();
  if (!currentCalendarUser) return events;

  // 1. Synchronize visits from store or DEMO_DATA
  const visits =
    (window.store && window.store.visits && typeof window.store.visits.getAll === "function"
      ? window.store.visits.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  visits.forEach((v) => {
    if (!v) return;
    const isPharm =
      v.targetType === "pharmacy" ||
      String(v.period || "").toLowerCase() === "pharmacy" ||
      (v.doctorId && String(v.doctorId).startsWith("pharm"));
    events.push({
      id: v.id,
      date: v.date,
      type: "visit",
      targetType: isPharm ? "pharmacy" : v.targetType,
      period: isPharm ? "pharmacy" : String(v.period || "pm").toLowerCase(),
      title: v.doctorName || v.targetName || "Visit",
      status: String(v.status || "planned").toLowerCase(),
      repId: v.repId,
      lineId: v.lineId || null,
      doctorId: v.doctorId,
      visitType: v.visitType,
      doubleWithUserId: v.doubleWithUserId,
      doubleWithUserName: v.doubleWithUserName,
    });
  });

  // 2. Synchronize leaves from store or DEMO_DATA across all scheduled days
  const leaves =
    (window.store && window.store.leaves && typeof window.store.leaves.getAll === "function"
      ? window.store.leaves.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.leaves) || [];

  leaves.forEach((l) => {
    if (!l) return;
    const lStatus = String(l.status || "").trim().toLowerCase();
    if (lStatus === "rejected" || lStatus === "cancelled" || lStatus === "canceled") return;
    if (l.startDate && l.endDate) {
      const startStr = String(l.startDate).slice(0, 10);
      const endStr = String(l.endDate).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) return;
      const cur = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T00:00:00");
      if (isNaN(cur.getTime()) || isNaN(end.getTime()) || cur > end) return;

      const rawType = String(l.type || "annual");
      const leaveTitle = `${rawType.charAt(0).toUpperCase() + rawType.slice(1)} Leave`;
      let steps = 0;

      while (cur <= end && steps < MAX_LEAVE_EXPANSION_DAYS) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        events.push({
          id: l.id,
          date: dateStr,
          type: "leave",
          title: leaveTitle,
          leaveType: l.type,
          status: lStatus,
          repId: l.userId || l.repId,
          dayDuration: l.dayDuration,
        });

        cur.setDate(cur.getDate() + 1);
        steps++;
      }
    }
  });

  // 3. Synchronize logged daily activities from localStorage (Per-User Isolation)
  try {
    const allUsers = getAllCalendarUsers();
    const userList = [...allUsers];
    if (currentCalendarUser && currentCalendarUser.id && !userList.some((u) => u && u.id === currentCalendarUser.id)) {
      userList.push(currentCalendarUser);
    }

    userList.forEach((u) => {
      if (!u || !u.id) return;
      const userActKey = `pharma_activities_data_${u.id}`;
      const raw =
        localStorage.getItem(userActKey) ||
        (window.DEMO_MODE === true && u.id === "u1790626000001"
          ? localStorage.getItem("pharma_activities_data")
          : null);
      if (raw) {
        try {
          const activities = JSON.parse(raw);
          if (!activities || typeof activities !== "object") return;
          Object.keys(activities).forEach((dateStr) => {
            const dayActs = activities[dateStr] || {};
            ["AM", "PM"].forEach((period) => {
              const act = dayActs[period];
              if (act && act.type) {
                events.push({
                  date: dateStr,
                  type: String(act.type).toLowerCase().replace(/\s+/g, "_"),
                  period: period.toLowerCase(),
                  title: `${act.type}: ${act.notes || "Activity"}`,
                  status: "completed",
                  repId: u.id,
                });
              }
            });
          });
        } catch (err) {}
      }
    });
  } catch (e) {
    console.warn("Failed to load activities for calendar:", e);
  }

  return events;
}

let currentDate = window.getSystemDate ? window.getSystemDate() : new Date();
window.currentCalendarTargetId = "all";
window.currentCalendarTargetName = "All Subordinates (Team View)";
window.currentCalendarTargetRole = "Team";

function getRoleBadgeInfo(role) {
  const norm = getNormalizedRole(role);
  switch (norm) {
    case "admin":
      return {
        label: "System Admin",
        short: "Admin",
        badgeClass: "role-admin",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      };
    case "general_manager":
      return {
        label: "General Manager (GM)",
        short: "GM",
        badgeClass: "role-admin",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      };
    case "business_unit":
      return {
        label: "Business Unit (BU)",
        short: "BU",
        badgeClass: "role-business_unit",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>',
      };
    case "product_manager":
      return {
        label: "Product Manager (PM)",
        short: "PM",
        badgeClass: "role-business_unit",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
      };
    case "line_manager":
      return {
        label: "Line Manager (LM)",
        short: "LM",
        badgeClass: "role-line_manager",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
      };
    case "district_manager":
      return {
        label: "District Manager (DM)",
        short: "DM",
        badgeClass: "role-district_manager",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
      };
    case "medical_rep":
      return {
        label: "Medical Rep",
        short: "Rep",
        badgeClass: "role-medical_rep",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      };
    case "hr":
      return {
        label: "HR Manager",
        short: "HR",
        badgeClass: "role-hr",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="14" height="18" x="5" y="4" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><path d="M9 4V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
      };
    default:
      return {
        label: String(role || "User"),
        short: String(role || "User"),
        badgeClass: "badge bg-secondary",
        icon: '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      };
  }
}

function getUserHierarchyBreadcrumb(userId, allUsers) {
  const crumbs = [];
  const visited = new Set();
  let curr = allUsers.find((u) => u && u.id === userId);
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    const roleInfo = getRoleBadgeInfo(curr.role);
    const name = curr.name || curr.nameAr || curr.id;
    crumbs.unshift(`${roleInfo.short}: ${name}`);
    const normRole = getNormalizedRole(curr.role);
    if (!curr.managerId || normRole === "admin" || normRole === "general_manager") {
      break;
    }
    const mgr = allUsers.find((u) => u && u.id === curr.managerId);
    if (!mgr) break;
    const mgrRole = getNormalizedRole(mgr.role);
    if (mgrRole === "admin" || mgrRole === "general_manager") {
      break;
    }
    curr = mgr;
  }
  return crumbs.join(" ➔ ");
}

function renderCalendar() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const grid = document.getElementById("calendarGrid");
  const monthYearEl = document.getElementById("monthYearDisplay");
  const t = calendarTranslations[lang] || calendarTranslations.en;

  if (monthYearEl) {
    monthYearEl.textContent = t.months[currentDate.getMonth()] + " " + currentDate.getFullYear();
  }
  if (!grid) return;

  grid.replaceChildren();

  const currentUser = getCalendarAuthUser();
  if (!currentUser) return;

  t.days.forEach((day) => {
    const div = document.createElement("div");
    div.className = "calendar-day-header";
    div.textContent = day;
    grid.appendChild(div);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startDayIdx = firstDayOfMonth.getDay() + 1;
  if (startDayIdx > 6) startDayIdx -= 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const _now = new Date();
  const _todayStrLocal = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;
  const todayStr = window.getSystemTodayStr ? window.getSystemTodayStr() : _todayStrLocal;

  const fullOrgAccess = hasFullOrgCalendarAccess(currentUser);
  let targetId = isCalendarRep(currentUser)
    ? currentUser.id
    : (window.currentCalendarTargetId || "all");
  const publicHolidays = getCalendarHolidays();

  // Enforce RBAC scope inside renderCalendar() itself (defense-in-depth against direct window.currentCalendarTargetId tampering)
  if (!fullOrgAccess && targetId !== "all" && targetId !== currentUser.id) {
    const mySubs = typeof window.getAllSubordinates === "function"
      ? window.getAllSubordinates(currentUser.id)
      : [];
    if (!mySubs.some((s) => s && s.id === targetId)) {
      targetId = currentUser.id;
      window.currentCalendarTargetId = currentUser.id;
    }
  }

  // Pre-compute allowed user IDs once per render instead of 42 times inside the day loop
  let visibleUserIds = null;
  if (targetId !== "all") {
    visibleUserIds = new Set([targetId]);
    if (typeof window.getAllSubordinates === "function") {
      window.getAllSubordinates(targetId).forEach((sub) => {
        if (sub && !isUserInactive(sub)) visibleUserIds.add(sub.id);
      });
    }
  } else if (!fullOrgAccess) {
    visibleUserIds = new Set([currentUser.id]);
    if (typeof window.getAllSubordinates === "function") {
      window.getAllSubordinates(currentUser.id).forEach((sub) => {
        if (sub && !isUserInactive(sub)) visibleUserIds.add(sub.id);
      });
    }
  }

  // Retrieve dynamic events
  const allEvents = getDynamicCalendarEvents();
  const selectedLineId = window.selectedCalendarLineId || "all";

  for (let i = 0; i < 42; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";

    let cellDateObj;
    let dayNum;

    if (i < startDayIdx) {
      dayNum = prevMonthDays - startDayIdx + i + 1;
      cell.classList.add("different-month");
      cellDateObj = new Date(year, month - 1, dayNum);
    } else if (i >= startDayIdx + daysInMonth) {
      dayNum = i - startDayIdx - daysInMonth + 1;
      cell.classList.add("different-month");
      cellDateObj = new Date(year, month + 1, dayNum);
    } else {
      dayNum = i - startDayIdx + 1;
      cellDateObj = new Date(year, month, dayNum);
    }

    if (i % 7 === 6) {
      cell.classList.add("weekend");
    }

    const cellYear = cellDateObj.getFullYear();
    const cellMonth = String(cellDateObj.getMonth() + 1).padStart(2, "0");
    const cellDay = String(cellDateObj.getDate()).padStart(2, "0");
    const cellDateStr = `${cellYear}-${cellMonth}-${cellDay}`;
    if (cellDateStr === todayStr) {
      cell.classList.add("today");
    }

    const dayNumEl = document.createElement("div");
    dayNumEl.className = "day-number";
    dayNumEl.textContent = dayNum;
    cell.appendChild(dayNumEl);

    let dayEvents = allEvents.filter((e) => e.date === cellDateStr);

    if (visibleUserIds) {
      dayEvents = dayEvents.filter(
        (e) =>
          visibleUserIds.has(e.repId) ||
          (e.doubleWithUserId && visibleUserIds.has(e.doubleWithUserId)),
      );
    }

    // Filter by selected product line if scoped
    if (selectedLineId !== "all") {
      dayEvents = dayEvents.filter((e) => {
        if (e.type === "holiday") return true;
        if (e.lineId) return e.lineId === selectedLineId;
        if (!e.repId) return true;
        const repLines = typeof window.getUserLines === "function" ? window.getUserLines(e.repId) : [];
        return repLines.some((l) => l && l.id === selectedLineId);
      });
    }

    // Match all public holidays on this date (keep raw title; escape only at HTML sink)
    const matchedHolidays = publicHolidays.filter((ph) => ph && ph.date === cellDateStr);
    for (let hIdx = matchedHolidays.length - 1; hIdx >= 0; hIdx--) {
      dayEvents.unshift({
        type: "holiday",
        title: String(matchedHolidays[hIdx].title || t.publicHoliday),
        status: "holiday",
      });
    }

    const indicatorsEl = document.createElement("div");
    indicatorsEl.className = "event-indicators";

    let count = 0;
    const maxVisible = 3;

    dayEvents.forEach((evt) => {
      if (count >= maxVisible) return;
      const ind = document.createElement("div");
      ind.className = "event-indicator";

      if (evt.type === "holiday") {
        ind.classList.add("leave-block");
        ind.style.backgroundColor = "#198754";
        ind.style.color = "#ffffff";
        ind.textContent = evt.title;
      } else if (evt.type === "leave") {
        ind.classList.add("leave-block");
        ind.style.backgroundColor =
          evt.status === "approved" ? "var(--danger)" : "var(--warning)";
        ind.textContent = evt.title;
      } else {
        ind.classList.add("dot");
        if (evt.type === "visit") {
          ind.classList.add(
            evt.status === "completed" ? "completed" : "planned",
          );
        } else if (
          evt.type === "training" ||
          evt.type === "meeting" ||
          evt.type === "conference"
        ) {
          ind.classList.add("activity");
        } else if (evt.type === "office_work") {
          ind.classList.add("office");
        }
        ind.textContent = evt.title;
      }
      indicatorsEl.appendChild(ind);
      count++;
    });

    if (dayEvents.length > maxVisible) {
      const more = document.createElement("div");
      more.className = "more-events";
      more.textContent = `+${dayEvents.length - maxVisible} more`;
      indicatorsEl.appendChild(more);
    }

    cell.appendChild(indicatorsEl);
    cell.addEventListener("click", () => openDayDetail(cellDateObj, dayEvents));
    grid.appendChild(cell);
  }
}

function openDayDetail(dateObj, events) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;

  const titleEl = document.getElementById("detailDateTitle");
  if (titleEl && dateObj) {
    titleEl.textContent = `${t.months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  }

  const contentEl = document.getElementById("detailContent");
  if (!contentEl) return;
  contentEl.replaceChildren();

  const safeEvents = Array.isArray(events) ? events : [];
  if (safeEvents.length === 0) {
    contentEl.innerHTML = `<p style="color: var(--gray-500); padding: 15px;">${_esc(t.noEvents)}</p>`;
  } else {
    const isPharm = (e) =>
      e.targetType === "pharmacy" ||
      e.period === "pharmacy" ||
      (e.doctorId && String(e.doctorId).startsWith("pharm"));
    const isLeaveOrHoliday = (e) => e.type === "leave" || e.type === "holiday";

    const leaveEvents = safeEvents.filter(isLeaveOrHoliday);
    const amEvents = safeEvents.filter((e) => !isLeaveOrHoliday(e) && !isPharm(e) && e.period === "am");
    const pmEvents = safeEvents.filter((e) => !isLeaveOrHoliday(e) && !isPharm(e) && e.period === "pm");
    const pharmacyEvents = safeEvents.filter((e) => !isLeaveOrHoliday(e) && isPharm(e));
    const otherEvents = safeEvents.filter(
      (e) => !isLeaveOrHoliday(e) && !isPharm(e) && e.period !== "am" && e.period !== "pm",
    );

    if (leaveEvents.length > 0)
      renderDetailSection(t.leaves, leaveEvents, contentEl, t, lang);
    if (amEvents.length > 0)
      renderDetailSection(t.amActivities, amEvents, contentEl, t, lang);
    if (pmEvents.length > 0)
      renderDetailSection(t.pmActivities, pmEvents, contentEl, t, lang);
    if (pharmacyEvents.length > 0)
      renderDetailSection("Pharmacy Visits", pharmacyEvents, contentEl, t, lang);
    if (otherEvents.length > 0)
      renderDetailSection(t.otherActivities || "Other Activities", otherEvents, contentEl, t, lang);
  }

  const panel = document.getElementById("dayDetailPanel");
  const overlay = document.getElementById("detailOverlay");
  if (panel) panel.classList.add("active");
  if (overlay) overlay.classList.add("active");
  if (document.body) document.body.style.overflow = "hidden";
}

function renderDetailSection(title, evts, container, t, lang) {
  const sec = document.createElement("div");
  sec.className = "detail-section";
  sec.innerHTML = `<div class="detail-section-title">${_esc(title)}</div>`;

  const list = document.createElement("div");
  list.className = "detail-list";
  const allUsers = getAllCalendarUsers();

  evts.forEach((evt) => {
    const item = document.createElement("div");
    item.className = "detail-item";

    let iconClass = "";
    let badgeClass = "";
    let statusText = "";
    let iconChar = '<svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

    if (evt.type === "holiday") {
      iconClass = "icon-visit-completed";
      badgeClass = "badge-completed";
      statusText = "Official Holiday (No Deduction)";
      iconChar = '<svg class="badge-svg-icon text-success" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>';
    } else if (evt.type === "visit") {
      if (evt.status === "completed") {
        iconClass = "icon-visit-completed";
        badgeClass = "badge-completed";
        statusText = t.statusCompleted || "Completed";
      } else if (evt.status === "missed") {
        iconClass = "icon-visit-planned";
        badgeClass = "badge-pending";
        statusText = "Missed Call";
      } else if (evt.status === "rejected") {
        iconClass = "icon-visit-planned";
        badgeClass = "badge-rejected";
        statusText = "Rejected";
      } else {
        iconClass = "icon-visit-planned";
        badgeClass = "badge-planned";
        statusText = t.statusPlanned || "Planned";
      }
      iconChar =
        evt.targetType === "pharmacy" ||
        evt.period === "pharmacy" ||
        (evt.doctorId && String(evt.doctorId).startsWith("pharm"))
          ? '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>'
          : evt.period === "am"
            ? '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M12 6v6"/></svg>'
            : '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6a2 2 0 0 1-2 2h-1"/></svg>';
    } else if (evt.type === "leave") {
      iconClass =
        evt.status === "approved"
          ? "icon-leave-approved"
          : "icon-leave-pending";
      badgeClass =
        evt.status === "approved" ? "badge-approved" : "badge-pending";
      statusText =
        evt.status === "approved" ? t.statusApproved : t.statusPending;
      iconChar = '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>';
    } else if (evt.type === "office_work") {
      iconClass = "icon-office";
      badgeClass = "badge-office";
      statusText = t.statusCompleted;
      iconChar = '<svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>';
    } else {
      iconClass = "icon-activity";
      badgeClass = "badge-activity";
      statusText =
        evt.status === "completed" ? t.statusCompleted : t.statusPlanned;
      iconChar = '<svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    }

    let ownerText = "";
    if (evt.repId) {
      const u = allUsers.find((user) => user && user.id === evt.repId);
      if (u) {
        const uName = u.name || u.nameAr || u.id;
        ownerText = ` • <svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${_esc(uName)}`;
      }
    }

    item.innerHTML = `
      <div class="detail-item-info">
        <div class="detail-item-icon ${iconClass}">${iconChar}</div>
        <div class="detail-item-text">
          <span class="detail-item-title">${_esc(evt.title)}</span>
          <span class="detail-item-time">${_esc((evt.type || "").toUpperCase())}${ownerText}</span>
        </div>
      </div>
      <div class="badge ${badgeClass}">${_esc(statusText)}</div>
    `;
    list.appendChild(item);
  });

  sec.appendChild(list);
  container.appendChild(sec);
}

function closeDayDetail() {
  const panel = document.getElementById("dayDetailPanel");
  const overlay = document.getElementById("detailOverlay");
  if (panel) panel.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  if (document.body) document.body.style.overflow = "";
}

function openOrgTreeModal() {
  const currentUser = getCalendarAuthUser();
  if (!currentUser || isCalendarRep(currentUser)) return;

  const overlay = document.getElementById("orgTreeOverlay");
  const modal = document.getElementById("orgTreeModal");
  const searchInput = document.getElementById("orgTreeSearchInput");
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;

  if (overlay) overlay.style.display = "block";
  if (modal) modal.style.display = "flex";

  if (searchInput) {
    searchInput.value = "";
    searchInput.placeholder = t.searchPlaceholder;
    setTimeout(() => searchInput.focus(), 150);
  }

  renderOrgTreeNodes("");
}

function closeOrgTreeModal() {
  const overlay = document.getElementById("orgTreeOverlay");
  const modal = document.getElementById("orgTreeModal");
  if (overlay) overlay.style.display = "none";
  if (modal) modal.style.display = "none";
}

function toggleTreeNode(nodeId, event) {
  if (event && typeof event.stopPropagation === "function") event.stopPropagation();
  const childrenContainer = document.getElementById("children_" + nodeId);
  const toggleBtn = document.getElementById("toggle_" + nodeId);
  if (!childrenContainer || !toggleBtn) return;

  const isHidden = childrenContainer.style.display === "none";
  childrenContainer.style.display = isHidden ? "flex" : "none";
  toggleBtn.textContent = isHidden ? "▼" : "▶";
}

function selectCalendarTarget(targetId, targetName, targetRole) {
  const currentUser = getCalendarAuthUser();
  if (!currentUser) return;

  let overridden = false;
  if (isCalendarRep(currentUser)) {
    if (targetId !== currentUser.id) overridden = true;
    targetId = currentUser.id;
  } else if (!hasFullOrgCalendarAccess(currentUser)) {
    if (targetId !== "all" && targetId !== currentUser.id) {
      const subordinates = typeof window.getAllSubordinates === "function"
        ? window.getAllSubordinates(currentUser.id)
        : [];
      const isAllowed = subordinates.some((s) => s && s.id === targetId);
      if (!isAllowed) {
        console.warn(`[RBAC] User '${currentUser.id}' cannot view calendar of '${targetId}'. Defaulting.`);
        targetId = currentUser.id;
        overridden = true;
      }
    }
  }

  if (overridden) {
    targetName = null;
    targetRole = null;
  }

  const allUsers = getAllCalendarUsers();
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;

  let resolvedCanonicalRole = "";
  if (targetId === "all") {
    targetName = targetName || t.allTeamView;
    targetRole = targetRole || t.teamBadge;
  } else {
    const foundUser = allUsers.find((u) => u && u.id === targetId);
    if (foundUser) {
      resolvedCanonicalRole = foundUser.role || "";
      const badgeInfo = getRoleBadgeInfo(foundUser.role);
      if (!targetName) targetName = foundUser.name || foundUser.nameAr || foundUser.id;
      if (!targetRole) targetRole = badgeInfo.short;
    } else if (targetId === currentUser.id) {
      resolvedCanonicalRole = currentUser.role || "";
      const badgeInfo = getRoleBadgeInfo(currentUser.role);
      if (!targetName) targetName = currentUser.name || currentUser.nameAr || currentUser.id;
      if (!targetRole) targetRole = badgeInfo.short;
    }
  }

  window.currentCalendarTargetId = targetId;
  window.currentCalendarTargetName = targetName;
  window.currentCalendarTargetRole = targetRole;

  const roleBadge = document.getElementById("targetRoleBadge");
  const nameDisplay = document.getElementById("targetNameDisplay");
  const resetBtn = document.getElementById("btnResetCalendar");

  if (roleBadge) {
    roleBadge.textContent = targetRole || "";
    if (targetId === "all") {
      roleBadge.className = "target-role-badge badge bg-primary";
    } else {
      const badgeInfo = getRoleBadgeInfo(resolvedCanonicalRole || targetRole);
      roleBadge.className = `target-role-badge role-badge ${badgeInfo.badgeClass}`;
    }
  }

  if (nameDisplay) {
    nameDisplay.textContent = targetName || "";
  }

  if (resetBtn) {
    resetBtn.style.display = (targetId === "all" || isCalendarRep(currentUser)) ? "none" : "inline-flex";
  }

  closeOrgTreeModal();
  renderCalendar();
}

function resetCalendarToAll() {
  const currentUser = getCalendarAuthUser();
  if (!currentUser) return;
  if (isCalendarRep(currentUser)) {
    selectCalendarTarget(currentUser.id);
    return;
  }
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;
  selectCalendarTarget("all", t.allTeamView, t.teamBadge);
}

function bindOrgTreeDelegation(container) {
  if (!container || !container.dataset || container.dataset.orgTreeBound === "1") return;
  container.dataset.orgTreeBound = "1";
  container.addEventListener("click", (e) => {
    const actionEl = e.target && typeof e.target.closest === "function"
      ? e.target.closest("[data-action]")
      : null;
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === "select-target") {
      e.preventDefault();
      selectCalendarTarget(actionEl.dataset.userId);
    } else if (action === "toggle-node") {
      e.preventDefault();
      toggleTreeNode(actionEl.dataset.nodeId, e);
    }
  });
}

function renderOrgTreeNodes(searchTerm = "") {
  const container = document.getElementById("orgTreeContainer");
  if (!container) return;
  bindOrgTreeDelegation(container);

  const currentUser = getCalendarAuthUser();
  if (!currentUser) {
    container.replaceChildren();
    return;
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;
  const allUsers = getAllCalendarUsers();
  const fullOrgAccess = hasFullOrgCalendarAccess(currentUser);

  const query = String(searchTerm || "").trim().toLowerCase();
  if (query) {
    let filteredUsers = allUsers.filter((u) => {
      if (!u || isUserInactive(u)) return false;
      const nameMatch = u.name && String(u.name).toLowerCase().includes(query);
      const nameArMatch = u.nameAr && String(u.nameAr).toLowerCase().includes(query);
      const codeMatch =
        u.employeeCode && String(u.employeeCode).toLowerCase().includes(query);
      const roleMatch =
        (u.role && String(u.role).toLowerCase().includes(query)) ||
        getRoleBadgeInfo(u.role).short.toLowerCase().includes(query);
      return nameMatch || nameArMatch || codeMatch || roleMatch;
    });

    // Fail-closed scoping: non-full-org users ONLY ever see themselves + verified subordinates
    if (!fullOrgAccess) {
      const subs = typeof window.getAllSubordinates === "function"
        ? window.getAllSubordinates(currentUser.id)
        : [];
      const allowedIds = new Set([
        currentUser.id,
        ...subs.filter(Boolean).map((s) => s.id),
      ]);
      filteredUsers = filteredUsers.filter((u) => allowedIds.has(u.id));
    }

    const selectedLineId = window.selectedCalendarLineId || "all";
    if (selectedLineId !== "all") {
      filteredUsers = filteredUsers.filter((u) => {
        const uLines = typeof window.getUserLines === "function" ? window.getUserLines(u.id) : [];
        return uLines.some((l) => l && l.id === selectedLineId);
      });
    }

    if (filteredUsers.length === 0) {
      container.innerHTML = `
        <div class="search-empty-state">
          <div style="font-size: 2.5rem; margin-bottom: 8px;"><svg style="width:40px;height:40px;stroke:currentColor;fill:none;stroke-width:1.85;" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <h5>${_esc(t.noResults)}</h5>
        </div>
      `;
      return;
    }

    let searchHtml = '<div class="search-results-list">';
    filteredUsers.forEach((u) => {
      const uName = u.name || u.nameAr || u.id;
      const roleInfo = getRoleBadgeInfo(u.role);
      const breadcrumb = getUserHierarchyBreadcrumb(u.id, allUsers);
      const isSelected = window.currentCalendarTargetId === u.id;

      searchHtml += `
        <div class="search-result-card">
          <div class="search-result-info">
            <div class="d-flex align-items-center gap-2">
              <span class="role-badge ${_esc(roleInfo.badgeClass)}">${_esc(roleInfo.short)}</span>
              <span class="fw-bold" style="color: var(--gray-900);">${_esc(uName)}</span>
              <span class="text-muted small">(${_esc(u.employeeCode || u.id)})</span>
            </div>
            <div class="search-breadcrumb">${_esc(breadcrumb)}</div>
          </div>
          <button type="button" class="btn-select-node ${isSelected ? "active-target" : ""}"
            data-action="select-target" data-user-id="${_esc(u.id)}">
            ${_esc(isSelected ? t.selectedBtn : t.selectBtn)}
          </button>
        </div>
      `;
    });
    searchHtml += "</div>";
    container.innerHTML = searchHtml;
    return;
  }

  function renderUserNode(userNode, level = 0, visited = new Set()) {
    if (!userNode || !userNode.id || visited.has(userNode.id) || level > 20) return "";
    const nextVisited = new Set(visited);
    nextVisited.add(userNode.id);

    const isInactive = isUserInactive(userNode);
    const nodeName = userNode.name || userNode.nameAr || userNode.id;
    const roleInfo = getRoleBadgeInfo(userNode.role);
    const directs = allUsers.filter((u) => {
      if (!u || u.managerId !== userNode.id || nextVisited.has(u.id)) return false;
      const selectedLineId = window.selectedCalendarLineId || "all";
      if (selectedLineId !== "all") {
        const uLines = typeof window.getUserLines === "function" ? window.getUserLines(u.id) : [];
        return uLines.some((l) => l && l.id === selectedLineId);
      }
      return true;
    });
    const hasChildren = directs.length > 0;
    const isSelected = window.currentCalendarTargetId === userNode.id;

    const subCountStr = hasChildren
      ? `(${directs.length} ${t.directReports})`
      : "";

    let displayName = _esc(nodeName);
    let subline = `(${_esc(userNode.employeeCode || userNode.id)})`;
    let cardStyle = "";
    let actionBtnHtml = "";

    if (isInactive) {
      cardStyle = "border: 1px dashed #cbd5e1; background: #fffdf5;";
      const vacantBadge = `<span class="badge bg-warning text-dark me-1" style="font-size:0.7rem;">[Vacant]</span>`;
      if (getNormalizedRole(userNode.role) === "medical_rep") {
        const areaName = userNode.vacantArea || userNode.area || "Territory";
        displayName = `${vacantBadge} Area: ${_esc(areaName)}`;
        subline = `(Former: ${_esc(nodeName)})`;
      } else {
        displayName = `${vacantBadge} ${_esc(roleInfo.short)} Position`;
        subline = `(Position Open • Former: ${_esc(nodeName)})`;
      }
      actionBtnHtml = `<span class="badge bg-light text-muted border px-2 py-1" style="font-size:0.75rem;">Vacant</span>`;
    } else {
      actionBtnHtml = `
        <button type="button" class="btn-select-node ${isSelected ? "active-target" : ""}"
                data-action="select-target" data-user-id="${_esc(userNode.id)}">
          ${_esc(isSelected ? t.selectedBtn : t.selectBtn)}
        </button>
      `;
    }

    const safeNodeId = _esc(userNode.id);
    let html = `
      <div class="org-node-card" id="node_${safeNodeId}" style="${cardStyle}">
        <div class="org-node-row">
          <div class="org-node-left">
            <button type="button" class="org-node-toggle ${hasChildren ? "" : "no-children"}"
                    id="toggle_${safeNodeId}"
                    data-action="toggle-node" data-node-id="${safeNodeId}">
              ${hasChildren ? "▼" : "•"}
            </button>
            <span class="org-node-icon">${isInactive ? '<svg class="badge-svg-icon text-warning" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : roleInfo.icon}</span>
            <div class="org-node-details">
              <div class="org-node-header-line">
                <span class="role-badge ${_esc(roleInfo.badgeClass)}">${_esc(roleInfo.short)}</span>
                <span class="org-node-name">${displayName}</span>
                <span class="org-node-code text-muted small">${subline}</span>
              </div>
              ${hasChildren ? `<div class="org-node-subtext">${_esc(subCountStr)}</div>` : ""}
            </div>
          </div>
          ${actionBtnHtml}
        </div>
    `;

    if (hasChildren) {
      html += `<div class="org-node-children" id="children_${safeNodeId}">`;
      directs.forEach((child) => {
        html += renderUserNode(child, level + 1, nextVisited);
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  let treeHtml = '<div class="org-tree-root">';

  const selectedLineId = window.selectedCalendarLineId || "all";

  if (fullOrgAccess) {
    let topManagers = allUsers.filter((u) => {
      if (!u) return false;
      const r = getNormalizedRole(u.role);
      if (r === "admin" || r === "hr" || r === "medical_rep" || r === "rep") return false;
      if (r === "business_unit" || r === "bu" || r === "general_manager" || r === "gm") return true;
      if (
        r === "line_manager" ||
        r === "lm" ||
        r === "product_manager" ||
        r === "pm" ||
        r === "district_manager" ||
        r === "dm"
      ) {
        if (!u.managerId) return true;
        const mgr = allUsers.find((m) => m && m.id === u.managerId);
        if (!mgr) return false;
        const mr = getNormalizedRole(mgr.role);
        return mr === "admin" || mr === "hr" || mr === "general_manager" || mr === "gm";
      }
      return false;
    });
    if (selectedLineId !== "all") {
      topManagers = topManagers.filter((m) => {
        const mLines = typeof window.getUserLines === "function" ? window.getUserLines(m.id) : [];
        return mLines.some((l) => l && l.id === selectedLineId);
      });
    }
    topManagers.forEach((m) => {
      treeHtml += renderUserNode(m, 0, new Set());
    });
  } else {
    const managerNode = allUsers.find((u) => u && u.id === currentUser.id);
    if (managerNode) {
      treeHtml += renderUserNode(managerNode, 0, new Set());
    } else {
      let directs = allUsers.filter((u) => u && u.managerId === currentUser.id);
      if (selectedLineId !== "all") {
        directs = directs.filter((d) => {
          const dLines = typeof window.getUserLines === "function" ? window.getUserLines(d.id) : [];
          return dLines.some((l) => l && l.id === selectedLineId);
        });
      }
      directs.forEach((d) => {
        treeHtml += renderUserNode(d, 0, new Set());
      });
    }
  }

  treeHtml += "</div>";
  container.innerHTML = treeHtml;
}

function filterOrgTree(query) {
  renderOrgTreeNodes(query);
}

function populateCalendarLineFilter(user = null) {
  const lineSelect = document.getElementById("calendarLineFilter");
  if (!lineSelect) return;

  const currentUser = user || getCalendarAuthUser();
  if (!currentUser) {
    lineSelect.replaceChildren();
    lineSelect.disabled = true;
    return;
  }

  const isRep = isCalendarRep(currentUser);
  const userLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
  const curVal = lineSelect.value;

  lineSelect.replaceChildren();

  if (isRep) {
    if (userLines.length > 0) {
      if (userLines.length > 1) {
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "All Product Lines";
        lineSelect.appendChild(optAll);
      }
      userLines.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = l.name || l.nameAr || l.id;
        lineSelect.appendChild(opt);
      });
      if (curVal && Array.from(lineSelect.options).some((o) => o.value === curVal)) {
        lineSelect.value = curVal;
      } else {
        lineSelect.value = lineSelect.options[0]?.value || userLines[0].id;
      }
      window.selectedCalendarLineId = lineSelect.value;
      lineSelect.disabled = userLines.length <= 1;
    } else {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No Line Assigned";
      lineSelect.appendChild(opt);
      window.selectedCalendarLineId = "";
      lineSelect.disabled = true;
    }
    return;
  }

  // Managers & Admin / HR / GM
  lineSelect.disabled = false;
  const fullOrgAccess = hasFullOrgCalendarAccess(currentUser);

  if (fullOrgAccess || userLines.length > 1) {
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "All Product Lines";
    lineSelect.appendChild(optAll);
  }

  userLines.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = `${l.name || l.nameAr || l.id}`;
    lineSelect.appendChild(opt);
  });

  if (curVal && Array.from(lineSelect.options).some((o) => o.value === curVal)) {
    lineSelect.value = curVal;
  } else {
    lineSelect.value = lineSelect.options[0]?.value || "all";
  }
  window.selectedCalendarLineId = lineSelect.value;
}

window.onCalendarLineChange = function (selectedLineId) {
  const currentUser = getCalendarAuthUser();
  if (!currentUser) return;

  const lineSelect = document.getElementById("calendarLineFilter");
  const fullOrgAccess = hasFullOrgCalendarAccess(currentUser);
  const userLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
  const allowedLineIds = new Set(userLines.filter(Boolean).map((l) => l.id));

  if (isCalendarRep(currentUser)) {
    const canSelectAll = userLines.length > 1;
    const isAllowed =
      (selectedLineId === "all" && canSelectAll) ||
      allowedLineIds.has(selectedLineId) ||
      (userLines.length === 0 && selectedLineId === "");
    if (!isAllowed) {
      const repLine = window.selectedCalendarLineId || (userLines.length > 0 ? userLines[0].id : "");
      if (lineSelect) lineSelect.value = repLine;
      window.selectedCalendarLineId = repLine;
      return;
    }
  } else if (!fullOrgAccess) {
    const canSelectAll = userLines.length > 1;
    const isAllowed = (selectedLineId === "all" && canSelectAll) || allowedLineIds.has(selectedLineId);
    if (!isAllowed) {
      const fallback = window.selectedCalendarLineId || (userLines[0] ? userLines[0].id : "all");
      if (lineSelect) lineSelect.value = fallback;
      return;
    }
  }

  window.selectedCalendarLineId = selectedLineId;
  const targetId = window.currentCalendarTargetId;
  if (targetId && targetId !== "all") {
    const targetLines = typeof window.getUserLines === "function" ? window.getUserLines(targetId) : [];
    if (selectedLineId !== "all" && !targetLines.some((l) => l && l.id === selectedLineId)) {
      resetCalendarToAll();
      return;
    }
  }
  renderCalendar();
  if (document.getElementById("orgTreeModal")?.style.display !== "none") {
    renderOrgTreeNodes(document.getElementById("orgTreeSearchInput")?.value || "");
  }
};

function setupManagerFilter(user) {
  const managerFilter = document.getElementById("managerFilter");
  const btnOpenTree = document.getElementById("btnOpenTreePicker");
  const btnReset = document.getElementById("btnResetCalendar");
  const targetRoleBadge = document.getElementById("targetRoleBadge");
  const targetNameDisplay = document.getElementById("targetNameDisplay");
  if (!managerFilter || !user) return;

  const isRep = isCalendarRep(user);
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;

  managerFilter.classList.add("active");
  managerFilter.style.display = "flex";

  if (isRep) {
    if (btnOpenTree) btnOpenTree.style.display = "none";
    if (btnReset) btnReset.style.display = "none";
    if (targetRoleBadge) {
      targetRoleBadge.textContent = "Rep";
      targetRoleBadge.className = "target-role-badge role-badge role-medical_rep";
    }
    if (targetNameDisplay) {
      targetNameDisplay.textContent = user.name || user.nameAr || user.id;
    }
  } else {
    if (btnOpenTree) btnOpenTree.style.display = "inline-flex";
    if (window.currentCalendarTargetId === "all") {
      if (targetRoleBadge) {
        targetRoleBadge.textContent = t.teamBadge;
        targetRoleBadge.className = "target-role-badge badge bg-primary";
      }
      if (targetNameDisplay) targetNameDisplay.textContent = t.allTeamView;
      if (btnReset) btnReset.style.display = "none";
    } else {
      if (btnReset) btnReset.style.display = "inline-flex";
    }
  }
}

let calendarListenersBound = false;

function setupCalendar() {
  const user = getCalendarAuthUser();
  if (!user) return;

  if (isCalendarRep(user)) {
    window.currentCalendarTargetId = user.id;
    window.currentCalendarTargetName = user.name || user.nameAr || user.id;
    window.currentCalendarTargetRole = "Rep";
  }
  populateCalendarLineFilter(user);
  setupManagerFilter(user);
  renderCalendar();

  if (calendarListenersBound) return;
  calendarListenersBound = true;

  // Use day=1 to prevent JS Date month-overflow bug (e.g. Mar 31 - 1 month -> Mar 3!)
  document.getElementById("prevMonth")?.addEventListener("click", () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar();
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar();
  });

  document.getElementById("btnToday")?.addEventListener("click", () => {
    currentDate = window.getSystemDate ? window.getSystemDate() : new Date();
    renderCalendar();
  });

  document
    .getElementById("closeDetail")
    ?.addEventListener("click", closeDayDetail);
  document
    .getElementById("detailOverlay")
    ?.addEventListener("click", closeDayDetail);
  document
    .getElementById("orgTreeOverlay")
    ?.addEventListener("click", closeOrgTreeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDayDetail();
      closeOrgTreeModal();
    }
  });

  document.addEventListener("pharma:storage:synced", () => {
    const freshUser = getCalendarAuthUser();
    if (!freshUser) return;
    populateCalendarLineFilter(freshUser);
    setupManagerFilter(freshUser);
    renderCalendar();
    if (document.getElementById("orgTreeModal")?.style.display !== "none") {
      renderOrgTreeNodes(
        document.getElementById("orgTreeSearchInput")?.value || "",
      );
    }
  });

  document.addEventListener("languageChanged", () => {
    const freshUser = getCalendarAuthUser();
    if (!freshUser) return;
    populateCalendarLineFilter(freshUser);
    setupManagerFilter(freshUser);
    renderCalendar();
    if (document.getElementById("orgTreeModal")?.style.display !== "none") {
      renderOrgTreeNodes(
        document.getElementById("orgTreeSearchInput")?.value || "",
      );
    }
  });
}

const calendarApp = {
  openOrgTreeModal,
  closeOrgTreeModal,
  toggleTreeNode,
  selectCalendarTarget,
  resetCalendarToAll,
  filterOrgTree,
  renderCalendar,
  setupCalendar,
  populateCalendarLineFilter,
  onCalendarLineChange: window.onCalendarLineChange,
};

window.calendarApp = calendarApp;

window.openOrgTreeModal = function () {
  calendarApp.openOrgTreeModal();
};
window.closeOrgTreeModal = function () {
  calendarApp.closeOrgTreeModal();
};
window.toggleTreeNode = function (nodeId, event) {
  calendarApp.toggleTreeNode(nodeId, event);
};
window.selectCalendarTarget = function (id, name, role) {
  calendarApp.selectCalendarTarget(id, name, role);
};
window.resetCalendarToAll = function () {
  calendarApp.resetCalendarToAll();
};
window.filterOrgTree = function (query) {
  calendarApp.filterOrgTree(query);
};
window.renderCalendar = function () {
  calendarApp.renderCalendar();
};

document.addEventListener("DOMContentLoaded", setupCalendar);
