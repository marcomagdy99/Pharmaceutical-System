/**
 * @file calendar.js
 * @description Monthly Calendar Schedule Engine synchronized dynamically with Central Store visits, leaves, and HR public holidays.
 */

const esc = window.escapeHtml || ((s) => s || "");

const calendarTranslations = {
  en: {
    selectRep: "Viewing Schedule For:",
    allReps: "All Subordinates (Team View)",
    browseOrgTree: "Browse Org Hierarchy",
    viewAllTeam: "View All Team",
    selectAllTeam: "Select Entire Team",
    orgTreeTitle: "🏢 Select Team Member / Branch",
    orgTreeSubtitle: "Pick any level (BU, LM, DM, or Rep) or search directly",
    searchPlaceholder: "Search by name, role, or employee code...",
    selectBtn: "Select",
    selectedBtn: "✓ Selected",
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
    leaves: "Leaves",
    noEvents: "No events on this day.",
    statusCompleted: "Completed",
    statusPlanned: "Planned",
    statusApproved: "Approved",
    statusPending: "Pending",
  },
  ar: {
    selectRep: "عرض جدول المواعيد لـ:",
    allReps: "جميع التابعين (عرض الفريق)",
    browseOrgTree: "تصفح الهيكل الوظيفي",
    viewAllTeam: "عرض كل الفريق",
    selectAllTeam: "اختيار كامل الفريق",
    orgTreeTitle: "🏢 اختر الموظف أو الفرع الإداري",
    orgTreeSubtitle: "اختر أي مستوى (BU أو LM أو DM أو مندوب) أو ابحث مباشرة",
    searchPlaceholder: "ابحث بالاسم، المسمى الوظيفي، أو الكود...",
    selectBtn: "اختيار",
    selectedBtn: "✓ تم الاختيار",
    allTeamView: "جميع التابعين (عرض الفريق)",
    teamBadge: "الفريق",
    noResults: "لا يوجد موظفون يطابقون بحثك.",
    directReports: "تابعين مباشرين",
    close: "إغلاق",
    today: "اليوم",
    monthView: "شهر",
    weekView: "أسبوع",
    completedVisit: "زيارة مكتملة",
    plannedVisit: "زيارة مخططة",
    approvedLeave: "إجازة معتمدة",
    pendingLeave: "إجازة قيد الانتظار",
    trainingMeeting: "تدريب/اجتماع/مؤتمر",
    officeWork: "عمل مكتبي",
    publicHoliday: "إجازة رسمية عامة",
    days: [
      "السبت",
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
    ],
    months: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
    amActivities: "أنشطة الصباح",
    pmActivities: "أنشطة المساء",
    leaves: "الإجازات",
    noEvents: "لا توجد أحداث في هذا اليوم.",
    statusCompleted: "مكتمل",
    statusPlanned: "مخطط",
    statusApproved: "معتمد",
    statusPending: "قيد الانتظار",
  },
};

/**
 * Dynamically aggregates visits, leaves, and activities from Central Store and persistent storage.
 */
function getDynamicCalendarEvents() {
  const events = [];

  // 1. Synchronize visits from store or DEMO_DATA
  const visits =
    (window.store && window.store.visits
      ? window.store.visits.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  visits.forEach((v) => {
    events.push({
      id: v.id,
      date: v.date,
      type: "visit",
      period: (v.period || "pm").toLowerCase(),
      title: v.doctorName || v.targetName || "Visit",
      status: v.status || "planned",
      repId: v.repId,
      visitType: v.visitType,
      doubleWithUserName: v.doubleWithUserName,
    });
  });

  // 2. Synchronize leaves from store or DEMO_DATA across all scheduled days
  const leaves =
    (window.store && window.store.leaves
      ? window.store.leaves.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.leaves) || [];

  leaves.forEach((l) => {
    if (l.status === "rejected") return;
    if (l.startDate && l.endDate) {
      const cur = new Date(l.startDate + "T00:00:00");
      const end = new Date(l.endDate + "T00:00:00");
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        const leaveTitle = `${(l.type || "annual").charAt(0).toUpperCase() + (l.type || "annual").slice(1)} Leave`;
        events.push({
          id: l.id,
          date: dateStr,
          type: "leave",
          title: leaveTitle,
          leaveType: l.type,
          status: l.status,
          repId: l.userId,
          dayDuration: l.dayDuration,
        });

        cur.setDate(cur.getDate() + 1);
      }
    }
  });

  // 3. Synchronize logged daily activities from localStorage
  try {
    const raw = localStorage.getItem("pharma_activities_data");
    if (raw) {
      const activities = JSON.parse(raw);
      Object.keys(activities).forEach((dateStr) => {
        const dayActs = activities[dateStr] || {};
        ["AM", "PM"].forEach((period) => {
          const act = dayActs[period];
          if (act && act.type) {
            events.push({
              date: dateStr,
              type: act.type.toLowerCase().replace(/\s+/g, "_"),
              period: period.toLowerCase(),
              title: `${act.type}: ${act.notes || "Activity"}`,
              status: "completed",
              repId: "rep1",
            });
          }
        });
      });
    }
  } catch (e) {
    console.warn("Failed to load activities for calendar:", e);
  }

  return events;
}

let currentDate = new Date(2026, 8, 1);
window.currentCalendarTargetId = "all";
window.currentCalendarTargetName = "All Subordinates (Team View)";
window.currentCalendarTargetRole = "Team";

function getRoleBadgeInfo(role) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  switch (role) {
    case "admin":
      return {
        label: isAr ? "مدير النظام" : "System Admin",
        short: "Admin",
        badgeClass: "role-admin",
        icon: "👑",
      };
    case "business_unit":
      return {
        label: isAr ? "مدير وحدة (BU)" : "Business Unit (BU)",
        short: "BU",
        badgeClass: "role-business_unit",
        icon: "🏢",
      };
    case "line_manager":
      return {
        label: isAr ? "مدير خط (LM)" : "Line Manager (LM)",
        short: "LM",
        badgeClass: "role-line_manager",
        icon: "📁",
      };
    case "district_manager":
      return {
        label: isAr ? "مدير منطقة (DM)" : "District Manager (DM)",
        short: "DM",
        badgeClass: "role-district_manager",
        icon: "🗂️",
      };
    case "medical_rep":
      return {
        label: isAr ? "مندوب دعاية (Rep)" : "Medical Rep",
        short: "Rep",
        badgeClass: "role-medical_rep",
        icon: "👤",
      };
    case "hr":
      return {
        label: isAr ? "الموارد البشرية (HR)" : "HR Manager",
        short: "HR",
        badgeClass: "role-hr",
        icon: "📋",
      };
    default:
      return {
        label: role,
        short: role,
        badgeClass: "badge bg-secondary",
        icon: "👤",
      };
  }
}

function getUserHierarchyBreadcrumb(userId, allUsers) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const crumbs = [];
  let curr = allUsers.find((u) => u.id === userId);
  while (curr) {
    const roleInfo = getRoleBadgeInfo(curr.role);
    const name = isAr && curr.nameAr ? curr.nameAr : curr.name;
    crumbs.unshift(`${roleInfo.short}: ${name}`);
    if (!curr.managerId || curr.managerId === "admin1" || curr.role === "admin")
      break;
    curr = allUsers.find((u) => u.id === curr.managerId);
  }
  return crumbs.join(" ➔ ");
}

function renderCalendar() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const grid = document.getElementById("calendarGrid");
  const t = calendarTranslations[lang] || calendarTranslations.en;

  const monthYearStr =
    t.months[currentDate.getMonth()] + " " + currentDate.getFullYear();
  document.getElementById("monthYearDisplay").textContent = monthYearStr;

  grid.replaceChildren();

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
  const todayStr = "2026-09-04";

  const targetId = window.currentCalendarTargetId || "all";
  const currentUser = (window.checkAuth && window.checkAuth()) || {
    role: "admin",
    id: "admin1",
  };

  const publicHolidays =
    (window.DEMO_DATA && window.DEMO_DATA.publicHolidays) || [
      { date: "2026-10-06", title: "Armed Forces Day" },
    ];

  // Retrieve dynamic events
  const allEvents = getDynamicCalendarEvents();

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

    if (targetId !== "all") {
      const targetUserIds = new Set([targetId]);
      if (window.getAllSubordinates) {
        window.getAllSubordinates(targetId).forEach((sub) => {
          if (sub.status !== "Inactive") targetUserIds.add(sub.id);
        });
      }
      dayEvents = dayEvents.filter((e) => targetUserIds.has(e.repId));
    } else {
      const hasFullOrgAccess =
        currentUser.role === "admin" || currentUser.role === "hr";
      if (!hasFullOrgAccess) {
        const mySubIds = new Set([currentUser.id]);
        if (window.getAllSubordinates) {
          window.getAllSubordinates(currentUser.id).forEach((sub) => {
            if (sub.status !== "Inactive") mySubIds.add(sub.id);
          });
        }
        dayEvents = dayEvents.filter((e) => mySubIds.has(e.repId));
      }
    }

    const matchedHoliday = publicHolidays.find((ph) => ph.date === cellDateStr);
    if (matchedHoliday) {
      dayEvents.unshift({
        type: "holiday",
        title: `🌴 ${esc(matchedHoliday.title)}`,
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
  if (titleEl) {
    titleEl.textContent = `${t.months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  }

  const contentEl = document.getElementById("detailContent");
  if (!contentEl) return;
  contentEl.replaceChildren();

  if (events.length === 0) {
    contentEl.innerHTML = `<p style="color: var(--gray-500); padding: 15px;">${t.noEvents}</p>`;
  } else {
    const amEvents = events.filter((e) => e.period === "am");
    const pmEvents = events.filter((e) => e.period === "pm");
    const leaveEvents = events.filter(
      (e) => e.type === "leave" || e.type === "holiday",
    );

    if (leaveEvents.length > 0)
      renderDetailSection(t.leaves, leaveEvents, contentEl, t, lang);
    if (amEvents.length > 0)
      renderDetailSection(t.amActivities, amEvents, contentEl, t, lang);
    if (pmEvents.length > 0)
      renderDetailSection(t.pmActivities, pmEvents, contentEl, t, lang);
  }

  const panel = document.getElementById("dayDetailPanel");
  const overlay = document.getElementById("detailOverlay");
  if (panel) panel.classList.add("active");
  if (overlay) overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function renderDetailSection(title, evts, container, t, lang) {
  const currentLang =
    lang || (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = currentLang === "ar";

  const sec = document.createElement("div");
  sec.className = "detail-section";
  sec.innerHTML = `<div class="detail-section-title">${esc(title)}</div>`;

  const list = document.createElement("div");
  list.className = "detail-list";

  evts.forEach((evt) => {
    const item = document.createElement("div");
    item.className = "detail-item";

    let iconClass = "";
    let badgeClass = "";
    let statusText = "";
    let iconChar = "📅";

    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

    if (evt.type === "holiday") {
      iconClass = "icon-visit-completed";
      badgeClass = "badge-completed";
      statusText = isAr
        ? "إجازة رسمية عامة"
        : "Official Holiday (No Deduction)";
      iconChar = "🌴";
    } else if (evt.type === "visit") {
      iconClass =
        evt.status === "completed"
          ? "icon-visit-completed"
          : "icon-visit-planned";
      badgeClass =
        evt.status === "completed" ? "badge-completed" : "badge-planned";
      statusText =
        evt.status === "completed" ? t.statusCompleted : t.statusPlanned;
      iconChar = "🏥";
    } else if (evt.type === "leave") {
      iconClass =
        evt.status === "approved"
          ? "icon-leave-approved"
          : "icon-leave-pending";
      badgeClass =
        evt.status === "approved" ? "badge-approved" : "badge-pending";
      statusText =
        evt.status === "approved" ? t.statusApproved : t.statusPending;
      iconChar = "🏖️";
    } else if (evt.type === "office_work") {
      iconClass = "icon-office";
      badgeClass = "badge-office";
      statusText = t.statusCompleted;
      iconChar = "💻";
    } else {
      iconClass = "icon-activity";
      badgeClass = "badge-activity";
      statusText =
        evt.status === "completed" ? t.statusCompleted : t.statusPlanned;
      iconChar = "👥";
    }

    let ownerText = "";
    if (evt.repId) {
      const u = allUsers.find((user) => user.id === evt.repId);
      if (u) {
        const uName = isAr && u.nameAr ? u.nameAr : u.name;
        ownerText = ` • 👤 ${esc(uName)}`;
      }
    }

    item.innerHTML = `
      <div class="detail-item-info">
        <div class="detail-item-icon ${iconClass}">${iconChar}</div>
        <div class="detail-item-text">
          <span class="detail-item-title">${esc(evt.title)}</span>
          <span class="detail-item-time">${esc((evt.type || "").toUpperCase())}${ownerText}</span>
        </div>
      </div>
      <div class="badge ${badgeClass}">${statusText}</div>
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
  document.body.style.overflow = "";
}

function openOrgTreeModal() {
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
  if (event) event.stopPropagation();
  const childrenContainer = document.getElementById("children_" + nodeId);
  const toggleBtn = document.getElementById("toggle_" + nodeId);
  if (!childrenContainer || !toggleBtn) return;

  const isHidden = childrenContainer.style.display === "none";
  childrenContainer.style.display = isHidden ? "flex" : "none";
  toggleBtn.textContent = isHidden ? "▼" : "▶";
}

function selectCalendarTarget(targetId, targetName, targetRole) {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const t = calendarTranslations[lang] || calendarTranslations.en;

  if (targetId === "all") {
    targetName = targetName || t.allTeamView;
    targetRole = targetRole || t.teamBadge;
  } else if (!targetName || !targetRole) {
    const foundUser = allUsers.find((u) => u.id === targetId);
    if (foundUser) {
      targetName = isAr && foundUser.nameAr ? foundUser.nameAr : foundUser.name;
      const badgeInfo = getRoleBadgeInfo(foundUser.role);
      targetRole = badgeInfo.short;
    }
  }

  window.currentCalendarTargetId = targetId;
  window.currentCalendarTargetName = targetName;
  window.currentCalendarTargetRole = targetRole;

  const roleBadge = document.getElementById("targetRoleBadge");
  const nameDisplay = document.getElementById("targetNameDisplay");
  const resetBtn = document.getElementById("btnResetCalendar");

  if (roleBadge) {
    roleBadge.textContent = targetRole;
    if (targetId === "all") {
      roleBadge.className = "target-role-badge badge bg-primary";
    } else {
      const badgeInfo = getRoleBadgeInfo(targetRole.toLowerCase());
      roleBadge.className = `target-role-badge role-badge ${badgeInfo.badgeClass}`;
    }
  }

  if (nameDisplay) {
    nameDisplay.textContent = targetName;
  }

  if (resetBtn) {
    resetBtn.style.display = targetId === "all" ? "none" : "inline-flex";
  }

  closeOrgTreeModal();
  renderCalendar();
}

function resetCalendarToAll() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = calendarTranslations[lang] || calendarTranslations.en;
  selectCalendarTarget("all", t.allTeamView, t.teamBadge);
}

function renderOrgTreeNodes(searchTerm = "") {
  const container = document.getElementById("orgTreeContainer");
  if (!container) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const t = calendarTranslations[lang] || calendarTranslations.en;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const currentUser = (window.checkAuth && window.checkAuth()) || {
    role: "admin",
    id: "admin1",
  };
  const hasFullOrgAccess =
    currentUser.role === "admin" || currentUser.role === "hr";

  const query = searchTerm.trim().toLowerCase();
  if (query) {
    let filteredUsers = allUsers.filter((u) => {
      if (u.status === "Inactive") return false;
      const nameMatch = u.name && u.name.toLowerCase().includes(query);
      const nameArMatch = u.nameAr && u.nameAr.toLowerCase().includes(query);
      const codeMatch =
        u.employeeCode && u.employeeCode.toLowerCase().includes(query);
      const roleMatch = u.role && u.role.toLowerCase().includes(query);
      return nameMatch || nameArMatch || codeMatch || roleMatch;
    });

    if (!hasFullOrgAccess && window.getAllSubordinates) {
      const allowedIds = new Set([
        currentUser.id,
        ...window.getAllSubordinates(currentUser.id).map((s) => s.id),
      ]);
      filteredUsers = filteredUsers.filter((u) => allowedIds.has(u.id));
    }

    if (filteredUsers.length === 0) {
      container.innerHTML = `
        <div class="search-empty-state">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <h5>${t.noResults}</h5>
        </div>
      `;
      return;
    }

    let searchHtml = '<div class="search-results-list">';
    filteredUsers.forEach((u) => {
      const uName = isAr && u.nameAr ? u.nameAr : u.name;
      const roleInfo = getRoleBadgeInfo(u.role);
      const breadcrumb = getUserHierarchyBreadcrumb(u.id, allUsers);
      const isSelected = window.currentCalendarTargetId === u.id;

      searchHtml += `
        <div class="search-result-card">
          <div class="search-result-info">
            <div class="d-flex align-items-center gap-2">
              <span class="role-badge ${roleInfo.badgeClass}">${roleInfo.short}</span>
              <span class="fw-bold" style="color: var(--gray-900);">${esc(uName)}</span>
              <span class="text-muted small">(${esc(u.employeeCode || u.id)})</span>
            </div>
            <div class="search-breadcrumb">${esc(breadcrumb)}</div>
          </div>
          <button class="btn-select-node ${isSelected ? "active-target" : ""}"
            onclick="selectCalendarTarget('${u.id}')">
            ${isSelected ? t.selectedBtn : t.selectBtn}
          </button>
        </div>
      `;
    });
    searchHtml += "</div>";
    container.innerHTML = searchHtml;
    return;
  }

  function renderUserNode(userNode, level = 0) {
    const isInactive = userNode.status === "Inactive";
    const nodeName = isAr && userNode.nameAr ? userNode.nameAr : userNode.name;
    const roleInfo = getRoleBadgeInfo(userNode.role);
    const directs = allUsers.filter((u) => u.managerId === userNode.id);
    const hasChildren = directs.length > 0;
    const isSelected = window.currentCalendarTargetId === userNode.id;

    const subCountStr = hasChildren
      ? `(${directs.length} ${t.directReports})`
      : "";

    let displayName = esc(nodeName);
    let subline = `(${esc(userNode.employeeCode || userNode.id)})`;
    let cardStyle = "";
    let actionBtnHtml = "";

    if (isInactive) {
      cardStyle = "border: 1px dashed #cbd5e1; background: #fffdf5;";
      const vacantBadge = `<span class="badge bg-warning text-dark me-1" style="font-size:0.7rem;">[Vacant / شاغر]</span>`;
      if (userNode.role === "medical_rep") {
        const areaName = userNode.vacantArea || userNode.area || "Territory";
        displayName = `${vacantBadge} Area: ${esc(areaName)}`;
        subline = `(Former: ${esc(nodeName)})`;
      } else {
        displayName = `${vacantBadge} ${roleInfo.short} Position`;
        subline = `(Position Open • Former: ${esc(nodeName)})`;
      }
      actionBtnHtml = `<span class="badge bg-light text-muted border px-2 py-1" style="font-size:0.75rem;">Vacant</span>`;
    } else {
      actionBtnHtml = `
        <button class="btn-select-node ${isSelected ? "active-target" : ""}" 
                onclick="selectCalendarTarget('${userNode.id}')">
          ${isSelected ? t.selectedBtn : t.selectBtn}
        </button>
      `;
    }

    let html = `
      <div class="org-node-card" id="node_${userNode.id}" style="${cardStyle}">
        <div class="org-node-row">
          <div class="org-node-left">
            <button class="org-node-toggle ${hasChildren ? "" : "no-children"}" 
                    id="toggle_${userNode.id}" 
                    onclick="toggleTreeNode('${userNode.id}', event)">
              ${hasChildren ? "▼" : "•"}
            </button>
            <span class="org-node-icon">${isInactive ? "⚠️" : roleInfo.icon}</span>
            <div class="org-node-details">
              <div class="org-node-header-line">
                <span class="role-badge ${roleInfo.badgeClass}">${roleInfo.short}</span>
                <span class="org-node-name">${displayName}</span>
                <span class="org-node-code text-muted small">${subline}</span>
              </div>
              ${hasChildren ? `<div class="org-node-subtext">${subCountStr}</div>` : ""}
            </div>
          </div>
          ${actionBtnHtml}
        </div>
    `;

    if (hasChildren) {
      html += `<div class="org-node-children" id="children_${userNode.id}">`;
      directs.forEach((child) => {
        html += renderUserNode(child, level + 1);
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  let treeHtml = '<div class="org-tree-root">';

  if (hasFullOrgAccess) {
    const topManagers = allUsers.filter(
      (u) =>
        u.role === "business_unit" ||
        (u.managerId === "admin1" && u.role !== "admin" && u.role !== "hr"),
    );
    topManagers.forEach((m) => {
      treeHtml += renderUserNode(m, 0);
    });
  } else {
    const managerNode = allUsers.find((u) => u.id === currentUser.id);
    if (managerNode) {
      treeHtml += renderUserNode(managerNode, 0);
    } else {
      const directs = allUsers.filter((u) => u.managerId === currentUser.id);
      directs.forEach((d) => {
        treeHtml += renderUserNode(d, 0);
      });
    }
  }

  treeHtml += "</div>";
  container.innerHTML = treeHtml;
}

function filterOrgTree(query) {
  renderOrgTreeNodes(query);
}

function setupManagerFilter(user) {
  const managerFilter = document.getElementById("managerFilter");
  if (!managerFilter) return;

  const hasAccess =
    (window.isManagerRole && window.isManagerRole(user)) ||
    user.role === "hr" ||
    user.role !== "medical_rep";

  if (hasAccess) {
    managerFilter.classList.add("active");
    managerFilter.style.display = "flex";

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = calendarTranslations[lang] || calendarTranslations.en;

    if (window.currentCalendarTargetId === "all") {
      const targetRoleBadge = document.getElementById("targetRoleBadge");
      const targetNameDisplay = document.getElementById("targetNameDisplay");
      if (targetRoleBadge) targetRoleBadge.textContent = t.teamBadge;
      if (targetNameDisplay) targetNameDisplay.textContent = t.allTeamView;
    }
  } else {
    managerFilter.classList.remove("active");
    managerFilter.style.display = "none";
  }
}

function setupCalendar() {
  const user = (window.checkAuth && window.checkAuth()) || {
    role: "admin",
    id: "admin1",
  };
  setupManagerFilter(user);
  renderCalendar();

  document.getElementById("prevMonth")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById("btnToday")?.addEventListener("click", () => {
    currentDate = new Date(2026, 8, 4);
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

  document.addEventListener("languageChanged", () => {
    setupManagerFilter(user);
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
};

window.calendarApp = calendarApp;

window.openOrgTreeModal = function () {
  calendarApp.openOrgTreeModal();
};
window.closeOrgTreeModal = function () {
  calendarApp.closeOrgTreeModal();
};
window.toggleTreeNode = function (nodeId) {
  calendarApp.toggleTreeNode(nodeId);
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