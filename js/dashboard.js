/**
 * @file dashboard.js
 * @description Comprehensive role-adaptive dashboard engine for PharmaCare.
 * Includes: Team planned visits visibility for DMs with 7-day auto-expiry & double visit linking, LM hierarchy, and dynamic KPIs.
 */

const dashboardTranslations = {
  en: {
    welcome_back: "Welcome back",
    target_progress: "Target Progress",
    total_doctors: "Total Doctors",
    visits_month: "Visits This Month",
    target_achievement: "Target Achievement",
    active_planned: "Active Planned",
    todays_plan: "Planned Doctors & Hospitals",
    plan_expiry_note: "Auto-expires after 7 days if not executed",
    am_hospitals: "AM Planned Hospitals",
    pm_doctors: "PM Planned Doctors",
    pharm_planned: "Planned Pharmacies",
    filter_today: "Today",
    filter_tomorrow: "Tomorrow",
    filter_upcoming: "Upcoming",
    filter_all_planned: "All Planned",
    specific_date: "Specific Date",
    convert_to_actual: "Convert to Actual",
    no_planned_visits: "No active planned visits for this period.",
    recent_visits: "Recent Completed Visits",
    view_all_visits: "View All Visits",
    target_doctor: "Target / Doctor",
    date_time: "Date & Time",
    entry_type: "Entry Type",
    status: "Status",
    completed: "Completed",
    direct_actual: "Direct Actual",
    from_plan: "From Plan",
    quick_actions: "Quick Actions",
    new_visit: "New Visit",
    log_activity: "Log Activity",
    request_leave: "Request Leave",
    reports: "Reports",
    overall_coverage: "Overall Coverage",
    coverage_rule: "Class A: 4 visits/quarter | Class B: 3 visits/quarter",
    sales_achievement: "Sales Achievement (YTD)",
    visits_achievement: "Visits Achievement",
    visits_target: "Monthly Visits Target",
    visit_type: "Visit Type",
    single_visit: "Single",
    double_visit: "Double",
    accompanied_by: "Accompanied By (Select Companion(s))",
    visit_day: "Visit Day",
    visit_time: "Visit Time (HH:MM)",
    insertion_date: "Insertion Date",
    insertion_time: "Insertion Time",
    products_discussed: "Products Discussed",
    visit_feedback: "Visit Feedback",
    confirm_actual_visit: "Confirm Actual Visit",
    cancel: "Cancel",

    // District Manager
    team_stats: "Team Stats Overview",
    total_reps: "Total Reps",
    team_visits: "Team Visits",
    avg_coverage: "Avg Coverage",
    pending_leaves: "Pending Leaves",
    pending_actions: "Pending Actions",
    leave_requests: "Leave requests to approve",
    plans_review: "Plans to review",
    team_performance: "Team Performance",
    rep_name: "Rep Name",
    achievement: "Achievement",
    team_field_plan: "Today's & Weekly Team Field Plan",
    team_field_plan_desc:
      "Scheduled planned visits by your medical reps in the field",
    join_double_visit: "Join Double Visit",
    no_team_planned:
      "No planned visits scheduled by your reps for this period.",

    // Line Manager
    line_overview: "Line Overview & Team Structure",
    total_dms: "District Managers (DMs)",
    total_line_reps: "Total Reps in Line",
    line_visits: "Line Visits (This Month)",
    dm_name: "District Manager (DM)",
    reps_under_dm: "Assigned Reps",
    line_sales: "Line Monthly Sales",

    // Business Unit Head
    bu_overview: "Business Unit Overview & Full Team Hierarchy",
    total_lines: "Product Lines",
    total_lms: "Line Managers (LMs)",
    total_bu_dms: "District Managers (DMs)",
    total_bu_reps: "Field Medical Reps",
    line_name: "Product Line",
    assigned_lm: "Line Manager (LM)",
    dms_in_line: "District Managers",
    reps_in_line: "Medical Reps",
    bu_sales: "BU Aggregated Sales",

    // HR
    hr_overview: "Personnel & Announcements Portal",
    total_employees: "Total Employees",
    published_announcements: "Announcements",
    departments: "Departments",

    // Admin
    system_overview: "System Administration Overview",
    total_users: "Total Users",
    total_areas: "Total Areas",
    product_lines: "Product Lines",
    monthly_sales: "Monthly Sales",
    quick_links: "Quick Management Links",
    manage_users: "Manage Users",
    upload_sales: "Upload Sales",
    manage_products: "Manage Products",
    manage_areas: "Manage Areas",
    recent_activity: "Recent System Activity",
  },
  ar: {
    welcome_back: "مرحباً بك",
    target_progress: "تقدم الهدف",
    total_doctors: "إجمالي الأطباء",
    visits_month: "زيارات هذا الشهر",
    target_achievement: "تحقيق الهدف",
    active_planned: "زيارات الخطة النشطة",
    todays_plan: "الأطباء والمستشفيات في الخطة",
    plan_expiry_note: "تختفي تلقائياً بعد 7 أيام إذا لم تُنفذ",
    am_hospitals: "مستشفيات الصباح في الخطة",
    pm_doctors: "عيادات الأطباء في الخطة",
    pharm_planned: "صيدليات في الخطة (Pharmacies)",
    filter_today: "اليوم",
    filter_tomorrow: "غداً",
    filter_upcoming: "الزيارات القادمة",
    filter_all_planned: "جميع المخططة",
    specific_date: "تاريخ محدد",
    convert_to_actual: "تحويل لزيارة فعلية",
    no_planned_visits: "لا توجد زيارات مخططة نشطة لهذه الفترة.",
    recent_visits: "الزيارات الفعلية المنفذة مؤخراً",
    view_all_visits: "عرض كل الزيارات",
    target_doctor: "الهدف / الطبيب",
    date_time: "التاريخ والوقت",
    entry_type: "نوع الدخول",
    status: "الحالة",
    completed: "مكتمل",
    direct_actual: "فعلية مباشرة",
    from_plan: "من الخطة",
    quick_actions: "إجراءات سريعة",
    new_visit: "زيارة جديدة",
    log_activity: "تسجيل نشاط",
    request_leave: "طلب إجازة",
    reports: "التقارير",
    overall_coverage: "نسبة التغطية الكلية",
    coverage_rule: "Class A: 4 زيارات/كوارتر | Class B: 3 زيارات/كوارتر",
    sales_achievement: "تحقيق المبيعات (YTD)",
    visits_achievement: "تحقيق الزيارات",
    visits_target: "تارجت زيارات الشهر",
    visit_type: "نوع الزيارة",
    single_visit: "فردي (Single)",
    double_visit: "مزدوج (Double)",
    accompanied_by: "مرافق مع (اختر المرافقين)",
    visit_day: "يوم الزيارة",
    visit_time: "وقت الزيارة",
    insertion_date: "تاريخ الإدخال",
    insertion_time: "وقت الإدخال",
    products_discussed: "المنتجات التي تمت مناقشتها",
    visit_feedback: "ملاحظات الزيارة",
    confirm_actual_visit: "تأكيد الزيارة الفعلية",
    cancel: "إلغاء",

    // District Manager
    team_stats: "إحصائيات الفريق",
    total_reps: "إجمالي المندوبين",
    team_visits: "زيارات الفريق",
    avg_coverage: "متوسط التغطية",
    pending_leaves: "إجازات معلقة",
    pending_actions: "إجراءات معلقة",
    leave_requests: "طلبات إجازة للموافقة",
    plans_review: "خطط للمراجعة",
    team_performance: "أداء الفريق",
    rep_name: "اسم المندوب",
    achievement: "الإنجاز",
    team_field_plan: "خطة انتشار الفريق وزياراتهم المخططة",
    team_field_plan_desc: "الزيارات الميدانية المجدولة لمناديب منطقتك",
    join_double_visit: "نزول مرافق (Double)",
    no_team_planned: "لا توجد زيارات مخططة مجدولة لفريقك في هذه الفترة.",

    // Line Manager
    line_overview: "نظرة عامة على الخط وهيكل الفريق",
    total_dms: "مديري المناطق (DMs)",
    total_line_reps: "إجمالي المناديب في الخط",
    line_visits: "زيارات الخط (هذا الشهر)",
    dm_name: "مدير المنطقة (DM)",
    reps_under_dm: "المناديب التابعين له",
    line_sales: "مبيعات الخط الشهرية",

    // Business Unit Head
    bu_overview: "نظرة عامة على وحدة الأعمال وهيكل الفريق الكامل",
    total_lines: "خطوط الإنتاج",
    total_lms: "مديري الخطوط (LMs)",
    total_bu_dms: "مديري المناطق (DMs)",
    total_bu_reps: "المناديب الطبيين",
    line_name: "خط الإنتاج",
    assigned_lm: "مدير الخط (LM)",
    dms_in_line: "مديري المناطق",
    reps_in_line: "المناديب الطبيين",
    bu_sales: "مبيعات وحدة الأعمال المجمعة",

    // HR
    hr_overview: "بوابة شؤون الموظفين والإعلانات",
    total_employees: "إجمالي الموظفين",
    published_announcements: "الإعلانات المنشورة",
    departments: "الأقسام",

    // Admin
    system_overview: "نظرة عامة على النظام",
    total_users: "إجمالي المستخدمين",
    total_areas: "إجمالي المناطق",
    product_lines: "خطوط المنتجات",
    monthly_sales: "المبيعات الشهرية",
    quick_links: "روابط الإدارة السريعة",
    manage_users: "إدارة المستخدمين",
    upload_sales: "رفع المبيعات",
    manage_products: "إدارة المنتجات",
    manage_areas: "إدارة المناطق",
    recent_activity: "النشاط الأخير في النظام",
  },
};

if (window.translations) {
  window.translations.en = {
    ...window.translations.en,
    ...dashboardTranslations.en,
  };
  window.translations.ar = {
    ...window.translations.ar,
    ...dashboardTranslations.ar,
  };
} else {
  window.translations = dashboardTranslations;
}

function isPlannedVisitExpired(dateStr) {
  if (typeof window.isPlannedVisitExpired === "function") {
    return window.isPlannedVisitExpired(dateStr);
  }
  if (!dateStr) return false;
  const expiryDays = (typeof window.getPlannedVisitExpiryDays === "function")
    ? window.getPlannedVisitExpiryDays()
    : 7;
  const parts = dateStr.split("-");
  const now = (window.getSystemDate && window.getSystemDate()) || new Date();
  if (parts.length !== 3) {
    const planDate = new Date(dateStr);
    return (now.getTime() - planDate.getTime()) / (1000 * 3600 * 24) > expiryDays;
  }
  const planDate = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    0, 0, 0, 0
  );
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, 0, 0, 0
  );
  const diffDays =
    (todayMidnight.getTime() - planDate.getTime()) / (1000 * 3600 * 24);
  return diffDays > expiryDays;
}

function isPlanVisitAlreadyCompleted(planVisit, allVisits) {
  if (!planVisit) return false;
  if (planVisit.status === "completed") return true;
  if (!Array.isArray(allVisits)) return false;
  return allVisits.some((cv) => {
    if (cv.status !== "completed") return false;
    if (cv.date !== planVisit.date) return false;
    if (cv.id === planVisit.id) return true;
    const sameDoctorId = Boolean(
      cv.doctorId && planVisit.doctorId && cv.doctorId === planVisit.doctorId,
    );
    const sameDoctorName = Boolean(
      cv.doctorName &&
      planVisit.doctorName &&
      cv.doctorName.trim().toLowerCase() ===
        planVisit.doctorName.trim().toLowerCase(),
    );
    return sameDoctorId || sameDoctorName;
  });
}

function getDmAccompanimentSchedule(dmId) {
  try {
    const raw = localStorage.getItem("pharma_dm_accompaniments");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[dmId]) {
        let changed = false;
        Object.keys(data[dmId]).forEach((dateStr) => {
          if (typeof isPlannedVisitExpired === "function" && isPlannedVisitExpired(dateStr)) {
            delete data[dmId][dateStr];
            changed = true;
          }
        });
        if (changed) {
          try {
            localStorage.setItem("pharma_dm_accompaniments", JSON.stringify(data));
          } catch (err) {}
        }
        return data[dmId];
      }
    }
  } catch (e) {
    console.error("Error reading DM accompaniment schedule:", e);
  }
  return {};
}

function setDmAccompaniment(dmId, dateStr, repId) {
  try {
    const raw = localStorage.getItem("pharma_dm_accompaniments");
    const data = raw ? JSON.parse(raw) : {};
    if (!data[dmId]) data[dmId] = {};
    if (!repId) {
      delete data[dmId][dateStr];
    } else {
      data[dmId][dateStr] = repId;
    }
    localStorage.setItem("pharma_dm_accompaniments", JSON.stringify(data));
  } catch (e) {
    console.error("Error writing DM accompaniment schedule:", e);
  }

  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const dmUser = allUsers.find((u) => u.id === dmId) || {
    id: dmId,
    name: "Manager",
  };

  let updated = false;
  allVisits.forEach((v) => {
    if (v.date === dateStr) {
      if (repId && repId !== "none" && v.repId === repId) {
        v.visitType = "double";
        v.doubleWithUserId = dmId;
        v.doubleWithUserName = dmUser.name;
        if (v.status === "pending_approval") {
          v.status = "planned";
          v.approvedBy = dmId;
          v.approvedByName = dmUser.name;
          v.approvedAt = new Date().toISOString();
        }
        updated = true;
      } else if (
        v.doubleWithUserId === dmId &&
        (!repId || repId === "none" || v.repId !== repId)
      ) {
        v.visitType = "single";
        delete v.doubleWithUserId;
        delete v.doubleWithUserName;
        updated = true;
      }
    }
  });

  if (updated && typeof window.saveDataToStorage === "function") {
    window.saveDataToStorage();
  }
}

function getDmSelectedDate() {
  if (window.currentDmSelectedDate) return window.currentDmSelectedDate;
  try {
    const savedDate = localStorage.getItem("pharma_dm_selected_date");
    if (savedDate) return savedDate;
  } catch (e) {}
  const now = (window.getSystemDate && window.getSystemDate()) || new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

window.onDmChangeDate = function (newDate) {
  window.currentDmSelectedDate = newDate || null;
  try {
    if (newDate) {
      localStorage.setItem("pharma_dm_selected_date", newDate);
    } else {
      localStorage.removeItem("pharma_dm_selected_date");
    }
  } catch (e) {}
  window.currentDmConfirmedDate = null;
  window.currentDmConfirmedRepId = null;
  window.currentDmSelectedRepId = "";
  renderDashboard();
};

window.deleteDmAccompanimentDate = function (dateStr) {
  const currentUser = (window.checkAuth && window.checkAuth()) || {
    id: "dm1",
    name: "Karim Nasser",
  };
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  setDmAccompaniment(currentUser.id, dateStr, null);
  if (window.currentDmConfirmedDate === dateStr) {
    window.currentDmConfirmedDate = null;
    window.currentDmConfirmedRepId = null;
    window.currentDmSelectedRepId = "";
  }
  if (typeof window.showToast === "function") {
    window.showToast(
      lang === "ar"
        ? `تم حذف النزول الميداني لتاريخ ${dateStr}`
        : `Accompaniment removed for ${dateStr}`,
      "info",
    );
  }
  renderDashboard();
};

window.switchDmScheduleTab = function (tab) {
  window.dmScheduleActiveTab = tab;
  renderDashboard();
};

window.buActiveLineFilter = window.buActiveLineFilter || "all";
window.switchBuLineFilter = function (lineId) {
  window.buActiveLineFilter = lineId;
  renderDashboard();
};

window.lmActiveLineFilter = window.lmActiveLineFilter || "all";
window.switchLmLineFilter = function (lineId) {
  window.lmActiveLineFilter = lineId;
  renderDashboard();
};

window.dmActiveLineFilter = window.dmActiveLineFilter || "all";
window.switchDmLineFilter = function (lineId) {
  window.dmActiveLineFilter = lineId;
  renderDashboard();
};

/**
 * Opens a modal displaying all field representatives assigned to a specific District Manager.
 * Accurately queries live users, roles, manager assignments, and line filters.
 * @param {string} dmId
 */
window.openDmTeamModal = function (dmId) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const allUsers =
    (window.store && window.store.users
      ? window.store.users.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.users) || [];

  const dm = allUsers.find((u) => u.id === dmId);
  if (!dm) return;

  const allLines =
    (window.store && window.store.productLines
      ? window.store.productLines.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

  const allAreas =
    (window.store && window.store.areas
      ? window.store.areas.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.areas) || [];

  const activeLmLine = window.lmActiveLineFilter || "all";

  const reps = allUsers.filter((r) => {
    const role = (r.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    if (!isRep) return false;
    if (r.managerId !== dm.id) return false;
    if (activeLmLine !== "all") {
      const rLines = r.lineIds || (r.lineId ? [r.lineId] : []);
      if (!rLines.includes(activeLmLine)) return false;
    }
    return true;
  });

  let overlay = document.getElementById("dmTeamModalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "dmTeamModalOverlay";
    overlay.className = "dm-team-modal-overlay";
    overlay.onclick = function (e) {
      if (e.target === overlay) window.closeDmTeamModal();
    };
    document.body.appendChild(overlay);
  }

  const dmLines = (dm.lineIds || (dm.lineId ? [dm.lineId] : []))
    .map((lid) => {
      const l = allLines.find((x) => x.id === lid);
      return l ? (isAr ? l.nameAr || l.name : l.name) : lid;
    })
    .filter(Boolean);

  const dmLineText =
    dmLines.length > 0
      ? dmLines.join(" • ")
      : isAr
        ? "بدون خط محدد"
        : "No Line Assigned";
  const dmCode = dm.employeeCode || dm.code || "DM";

  const getInitials = (name) => {
    if (!name) return "RP";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const repsCountText = `${reps.length} ${
    reps.length === 1
      ? isAr
        ? "مندوب ميداني"
        : "Field Rep"
      : isAr
        ? "مناديب ميدانيين"
        : "Field Reps"
  }`;

  const repsHtml =
    reps.length > 0
      ? reps
          .map((r) => {
            let areaName = r.area;
            if (!areaName && r.areaId) {
              const a = allAreas.find((x) => x.id === r.areaId);
              if (a) areaName = isAr ? a.nameAr || a.name : a.name;
            }
            if (!areaName && r.areaIds && r.areaIds.length > 0) {
              const areaNames = r.areaIds.map((aid) => {
                const a = allAreas.find((x) => x.id === aid);
                return a ? (isAr ? a.nameAr || a.name : a.name) : aid;
              });
              areaName = areaNames.join("، ");
            }
            if (!areaName) areaName = isAr ? "غير محدد" : "Unassigned";

            const repCode = r.employeeCode || r.code || "REP";
            const repName = isAr ? r.nameAr || r.name : r.name;
            const initials = getInitials(r.name);
            const isActive = (r.status || "Active").toLowerCase() === "active";

            return `
              <div class="dm-team-rep-card">
                <div class="dm-team-rep-avatar">${initials}</div>
                <div class="dm-team-rep-info">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div class="dm-team-rep-name">${repName}</div>
                    <span class="badge ${isActive ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}" style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px;">
                      ${isActive ? (isAr ? "نشط" : "Active") : isAr ? "غير نشط" : "Inactive"}
                    </span>
                  </div>
                  <div class="dm-team-rep-meta">
                    <span class="dm-team-rep-tag">🆔 ${repCode}</span>
                    <span class="dm-team-rep-tag">📍 ${areaName}</span>
                    ${r.phone ? `<span class="dm-team-rep-tag" title="${r.phone}">📞 <span dir="ltr">${r.phone}</span></span>` : ""}
                    ${r.email ? `<span class="dm-team-rep-tag" title="${r.email}">✉️ ${r.email}</span>` : ""}
                  </div>
                </div>
              </div>
            `;
          })
          .join("")
      : `
        <div style="text-align: center; padding: 30px 20px; color: var(--gray-500);">
          <div style="font-size: 2rem; margin-bottom: 8px;">👥</div>
          <div style="font-weight: 600;">${isAr ? "لا يوجد مناديب مسندين لهذا المدير حالياً" : "No representatives assigned under this manager yet"}</div>
        </div>
      `;

  overlay.innerHTML = `
    <div class="dm-team-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="dmTeamModalTitle">
      <div class="dm-team-modal-header">
        <div class="dm-team-modal-header-info">
          <h3 class="dm-team-modal-title" id="dmTeamModalTitle">
            <span>👥</span>
            <span>${isAr ? dm.nameAr || dm.name : dm.name}</span>
          </h3>
          <div class="dm-team-modal-subtitle">
            <span>🆔 ${dmCode}</span>
            <span>•</span>
            <span>🏷️ ${dmLineText}</span>
            <span>•</span>
            <span style="font-weight: 600; color: var(--primary);">${repsCountText}</span>
          </div>
        </div>
        <button type="button" class="dm-team-modal-close" onclick="window.closeDmTeamModal()" aria-label="Close" title="${isAr ? "إغلاق" : "Close"}">✕</button>
      </div>
      <div class="dm-team-modal-body">
        ${repsHtml}
      </div>
      <div class="dm-team-modal-footer">
        <button type="button" class="btn btn-secondary" onclick="window.closeDmTeamModal()" style="padding: 6px 18px; border-radius: 8px; font-weight: 600; font-size: 0.85rem;">
          ${isAr ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  `;

  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
};

window.closeDmTeamModal = function () {
  const overlay = document.getElementById("dmTeamModalOverlay");
  if (overlay) {
    overlay.classList.remove("show");
  }
  document.body.style.overflow = "";
};

if (!window._dmTeamModalEscListenerAttached) {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const overlay = document.getElementById("dmTeamModalOverlay");
      if (overlay && overlay.classList.contains("show")) {
        window.closeDmTeamModal();
      }
    }
  });
  window._dmTeamModalEscListenerAttached = true;
}

/**
 * Generates the HTML markup for interactive dashboard charts.
 * @param {string} lang
 */
function renderDashboardChartsMarkup(lang) {
  const isAr = lang === "ar";
  return `
    <div class="dashboard-card" style="margin-top: 20px; border-radius: 12px; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 class="card-title" style="margin: 0; font-weight: 700; font-size: 1.15rem;">
            📊 ${isAr ? "التحليلات والمؤشرات التفاعلية" : "Interactive Analytics & KPI Trends"}
          </h3>
          <small style="color: var(--gray-500); font-size: 0.82rem;">
            ${isAr ? "متابعة فورية للمبيعات، نسبة التغطية وتوزيع فئات الأطباء" : "Real-time trends for sales achievement, doctor coverage and category breakdown"}
          </small>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 20px;">
        <div style="background: var(--surface-hover, #f8fafc); border-radius: 10px; padding: 16px; border: 1px solid var(--border-color, #e2e8f0);">
          <h4 style="margin: 0 0 12px; font-weight: 700; font-size: 0.95rem; color: var(--gray-800);">
            📈 ${isAr ? "منحنى تحقيق المبيعات شهرياً" : "Monthly Sales vs Target Trend"}
          </h4>
          <div style="position: relative; height: 250px; width: 100%;">
            <canvas id="dashSalesTrendChart"></canvas>
          </div>
        </div>
        <div style="background: var(--surface-hover, #f8fafc); border-radius: 10px; padding: 16px; border: 1px solid var(--border-color, #e2e8f0); text-align: center;">
          <h4 style="margin: 0 0 12px; font-weight: 700; font-size: 0.95rem; color: var(--gray-800);">
            🎯 ${isAr ? "نسبة الوصول للأطباء (هذا الشهر)" : "Doctor Reach Gauge (This Month)"}
          </h4>
          <div style="position: relative; height: 210px; max-width: 250px; margin: 0 auto;">
            <canvas id="dashCoverageGaugeChart"></canvas>
          </div>
          <div id="dashCoverageGaugeLabel" style="font-weight: 800; font-size: 1.2rem; color: var(--primary); margin-top: -12px;"></div>
        </div>
        <div style="background: var(--surface-hover, #f8fafc); border-radius: 10px; padding: 16px; border: 1px solid var(--border-color, #e2e8f0); text-align: center;">
          <h4 style="margin: 0 0 12px; font-weight: 700; font-size: 0.95rem; color: var(--gray-800);">
            🥧 ${isAr ? "توزيع فئات الأطباء والمستشفيات" : "Doctor Classes & Hospitals"}
          </h4>
          <div style="position: relative; height: 210px; max-width: 250px; margin: 0 auto;">
            <canvas id="dashDoctorClassesChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Resolves real distributor sales and targets from the central store,
 * synthesizing them into unified sales records for dashboard widgets and charts.
 * Falls back to DEMO_DATA.sales if no real records exist yet.
 */
function getDashboardSalesData() {
  const storeTargets = (window.store && window.store.targets) ? window.store.targets.getAll() : [];
  const storeSales = (window.store && window.store.distributorSales) ? window.store.distributorSales.getAll() : [];
  const allLines = (window.store && window.store.productLines) ? window.store.productLines.getAll() : [];
  const allUsers = (window.store && window.store.users) ? window.store.users.getAll() : [];

  function getLineIdByProduct(productId) {
    if (!productId) return null;
    for (const l of allLines) {
      if (Array.isArray(l.products) && l.products.some((p) => p.id === productId)) {
        return l.id;
      }
    }
    return null;
  }

  if (storeSales.length > 0 || storeTargets.length > 0) {
    const map = {};

    // 1. Ingest targets
    storeTargets.forEach((t) => {
      if (!t.repId || !t.month) return;
      const targetVal = t.target != null
        ? (parseFloat(t.target) || 0)
        : ((parseFloat(t.targetUnits) || 0) * (parseFloat(t.unitPrice) || 0));
      const lineId = t.lineId || getLineIdByProduct(t.productId) || "";
      const key = `${t.repId}||${t.month}||${lineId}`;
      if (!map[key]) {
        const rep = allUsers.find((u) => u.id === t.repId);
        map[key] = {
          id: `synth_t_${key}`,
          repId: t.repId,
          repName: rep ? rep.name : t.repId,
          month: t.month,
          lineId: lineId || null,
          dmId: rep ? rep.managerId || null : null,
          lmId: null,
          target: 0,
          actual: 0,
          amount: 0,
        };
      }
      map[key].target += targetVal;
    });

    // 2. Ingest distributor actual sales
    storeSales.forEach((s) => {
      if (!s.repId) return;
      const mKey = s.month || (s.date ? s.date.slice(0, 7) : null);
      if (!mKey) return;
      const val = parseFloat(s.value) || 0;
      const lineId = s.lineId || getLineIdByProduct(s.productId) || "";
      const key = `${s.repId}||${mKey}||${lineId}`;
      if (!map[key]) {
        const rep = allUsers.find((u) => u.id === s.repId);
        map[key] = {
          id: `synth_s_${key}`,
          repId: s.repId,
          repName: rep ? rep.name : s.repId,
          month: mKey,
          lineId: lineId || null,
          dmId: s.dmId || (rep ? rep.managerId || null : null),
          lmId: s.lmId || null,
          target: 0,
          actual: 0,
          amount: 0,
        };
      }
      map[key].actual += val;
      map[key].amount += val;
      if (!map[key].dmId && s.dmId) map[key].dmId = s.dmId;
      if (!map[key].lmId && s.lmId) map[key].lmId = s.lmId;
    });

    const synthesized = Object.values(map);
    if (synthesized.length > 0) return synthesized;
  }

  // Graceful fallback to demo data
  return (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
    ? window.DEMO_DATA.sales
    : (window.REPORTS_DATA && window.REPORTS_DATA.sales) || [];
}

/**
 * Initializes and updates Chart.js charts on the active dashboard.
 * @param {Object} user 
 */
function initDashboardCharts(user) {
  if (typeof window.renderSalesTargetTrendChart !== "function") return;

  const currentUserId = user?.id || "rep1";
  const role = (user?.role || "rep").toLowerCase();
  const allSales = getDashboardSalesData();
  const allDoctors = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
  const allHospitals = (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  let scopedRepIds = null;
  if (role === "medical_rep" || role === "rep") {
    scopedRepIds = [currentUserId];
  } else if (role === "district_manager" || role === "dm" || role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu") {
    if (typeof window.getAllSubordinates === "function") {
      const allDownstreamUsers = window.getAllSubordinates(currentUserId);
      scopedRepIds = allDownstreamUsers
        .filter((u) => u.role === "medical_rep" || u.role === "rep")
        .map((u) => u.id);
    } else {
      // Fallback manual resolution
      if (role === "district_manager" || role === "dm") {
        scopedRepIds = allUsers.filter((u) => u.managerId === currentUserId).map((u) => u.id);
      } else if (role === "line_manager" || role === "lm") {
        const dms = allUsers.filter((u) => u.managerId === currentUserId).map((d) => d.id);
        scopedRepIds = allUsers.filter((u) => dms.includes(u.managerId)).map((u) => u.id);
      } else if (role === "business_unit" || role === "bu") {
        const lms = allUsers.filter((u) => u.managerId === currentUserId).map((l) => l.id);
        const dms = allUsers.filter((u) => lms.includes(u.managerId)).map((d) => d.id);
        scopedRepIds = allUsers.filter((u) => dms.includes(u.managerId)).map((u) => u.id);
      }
    }
  }

  // Determine active calendar year (auto-resets every year on January 1st)
  const currentCalendarYear = ((window.getSystemDate && window.getSystemDate()) || new Date()).getFullYear().toString();
  const hasCurrentYearSales = allSales.some((s) => s.month && s.month.startsWith(currentCalendarYear));
  let activeYear = currentCalendarYear;
  if (!hasCurrentYearSales && allSales.length > 0) {
    const allYears = allSales.map((s) => (s.month ? s.month.slice(0, 4) : "2026")).sort();
    activeYear = allYears[allYears.length - 1] || currentCalendarYear;
  }

  // 1. Sales vs Target Trend (Filtered strictly for active/current year)
  let filteredSales = allSales.filter((s) => s.month && s.month.startsWith(activeYear));
  if (scopedRepIds) {
    filteredSales = filteredSales.filter((s) => scopedRepIds.includes(s.repId));
  }
  const monthsMap = {};
  filteredSales.forEach((s) => {
    const m = s.month || (activeYear + "-01");
    if (!monthsMap[m]) monthsMap[m] = { target: 0, actual: 0 };
    monthsMap[m].target += parseFloat(s.target) || 0;
    monthsMap[m].actual += parseFloat(s.actual) || parseFloat(s.amount) || 0;
  });

  const sortedMonths = Object.keys(monthsMap).sort();
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const monthLabels = sortedMonths.map((m) => {
    const parts = m.split("-");
    const mIdx = parseInt(parts[1], 10) - 1;
    const names = isAr
      ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return names[mIdx] || m;
  });
  const trendTargets = sortedMonths.map((m) => monthsMap[m].target);
  const trendActuals = sortedMonths.map((m) => monthsMap[m].actual);

  window.renderSalesTargetTrendChart("dashSalesTrendChart", {
    labels: monthLabels.length ? monthLabels : undefined,
    targets: trendTargets.length ? trendTargets : undefined,
    actuals: trendActuals.length ? trendActuals : undefined,
  });

  // 2. Doctor Classes & Hospitals
  let scopedDoctors = allDoctors;
  let scopedHospitals = allHospitals;
  if (scopedRepIds) {
    scopedDoctors = allDoctors.filter((d) => scopedRepIds.includes(d.repId));
    scopedHospitals = allHospitals.filter((h) => !h.repId || scopedRepIds.includes(h.repId));
  }
  const classACount = scopedDoctors.filter((d) => d.class === "A").length;
  const classBCount = scopedDoctors.filter((d) => d.class === "B").length;
  const hospitalsCount = scopedHospitals.length + scopedDoctors.filter((d) => d.type === "hospital" || d.class === "hospital").length;

  window.renderDoctorClassesChart("dashDoctorClassesChart", classACount, classBCount, hospitalsCount);

  // 3. Monthly Doctor Reach Radial Gauge (Current Month)
  const nowGauge = new Date();
  const currentMonthStr = `${nowGauge.getFullYear()}-${String(nowGauge.getMonth() + 1).padStart(2, "0")}`;

  let scopedVisits = allVisits.filter((v) => {
    if (v.status !== "completed" || !v.date) return false;
    return v.date.startsWith(currentMonthStr);
  });
  if (scopedRepIds) {
    scopedVisits = scopedVisits.filter((v) => scopedRepIds.includes(v.repId));
  }
  const coveredDoctorIds = new Set();
  scopedVisits.forEach((v) => {
    if (v.doctorId) coveredDoctorIds.add(v.doctorId);
    else if (v.doctorName || v.targetName) {
      const matched = scopedDoctors.find(
        (d) => d.name === (v.doctorName || v.targetName) || d.nameAr === (v.doctorName || v.targetName)
      );
      if (matched) coveredDoctorIds.add(matched.id);
    }
  });
  const totalDocs = scopedDoctors.length;
  const coveredDocs = scopedDoctors.filter((d) => coveredDoctorIds.has(d.id)).length;
  const coveragePct = totalDocs > 0 ? Math.round((coveredDocs / totalDocs) * 100) : 0;

  window.renderCoverageGaugeChart("dashCoverageGaugeChart", "dashCoverageGaugeLabel", coveragePct);

  // 4. Per-Line Sales Trend Charts (LM & BU dashboards)
  const userLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUserId) : [];
  if (userLines.length > 0 && (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu")) {
    const monthNames = isAr
      ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    userLines.forEach(function (line) {
      const canvasId = "dashLineTrend_" + line.id;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      // Filter sales for this specific line in the active year, scoped to this manager's team
      const lineSales = allSales.filter(function (s) {
        const matchesRep = !scopedRepIds || (s.repId && scopedRepIds.includes(s.repId));
        return s.lineId === line.id && matchesRep && s.month && s.month.startsWith(activeYear);
      });
      const lineMonthsMap = {};
      lineSales.forEach(function (s) {
        var m = s.month || (activeYear + "-01");
        if (!lineMonthsMap[m]) lineMonthsMap[m] = { target: 0, actual: 0 };
        lineMonthsMap[m].target += parseFloat(s.target) || 0;
        lineMonthsMap[m].actual += parseFloat(s.actual) || parseFloat(s.amount) || 0;
      });

      var lineSortedMonths = Object.keys(lineMonthsMap).sort();
      var lineLabels = lineSortedMonths.map(function (m) {
        var parts = m.split("-");
        var mIdx = parseInt(parts[1], 10) - 1;
        return monthNames[mIdx] || m;
      });
      var lineTargets = lineSortedMonths.map(function (m) { return lineMonthsMap[m].target; });
      var lineActuals = lineSortedMonths.map(function (m) { return lineMonthsMap[m].actual; });

      window.renderSalesTargetTrendChart(canvasId, {
        labels: lineLabels.length ? lineLabels : undefined,
        targets: lineTargets.length ? lineTargets : undefined,
        actuals: lineActuals.length ? lineActuals : undefined
      });
    });
  }
}
window.initDashboardCharts = initDashboardCharts;

function renderDashboard() {
  const container = document.getElementById("pageContent");
  if (!container) return;

  const user = (window.checkAuth && window.checkAuth()) || {
    role: "admin",
    name: "System Admin",
  };
  const role = (user.role || "admin").toLowerCase();
  const userName = user.name || "User";
  if (typeof window.destroyAllCharts === "function") {
    window.destroyAllCharts();
  }

  container.replaceChildren();

  if (role === "medical_rep" || role === "rep") {
    container.innerHTML = renderRepDashboard(userName, user);
  } else if (role === "district_manager" || role === "dm") {
    container.innerHTML = renderDMDashboard(userName, user);
  } else if (role === "line_manager" || role === "lm") {
    container.innerHTML = renderLMDashboard(userName, user);
  } else if (role === "business_unit" || role === "bu") {
    container.innerHTML = renderBUDashboard(userName, user);
  } else if (role === "hr") {
    container.innerHTML = renderHRDashboard(userName);
  } else if (role === "admin") {
    container.innerHTML = renderAdminDashboard(userName, user);
  } else {
    container.innerHTML = renderRepDashboard(userName, user);
  }

  attachDashboardModal();
  animateCounters();
  if (window.applyTranslations) window.applyTranslations();
  setTimeout(() => {
    initDashboardCharts(user);
  }, 50);
}

/**
 * Renders the Representative Dashboard.
 */
function renderRepDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const currentUserId = user?.id || "rep1";

  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const allDoctors =
    (window.store && window.store.doctors
      ? window.store.doctors.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.doctors)) || [];

  // Single Source of Truth for sales records
  const allSales = getDashboardSalesData();

  const repAreas =
    window.store && window.store.areas
      ? window.store.areas.getByRep(currentUserId)
      : ((window.DEMO_DATA && window.DEMO_DATA.areas)
          ? window.DEMO_DATA.areas.filter((a) => a.repId === currentUserId)
          : []);
  const repAreaIds = repAreas.map((a) => a.id).filter(Boolean);
  const repAreaNames = repAreas.map((a) => String(a.name || "").toLowerCase().trim()).filter(Boolean);

  const repDoctors = allDoctors.filter(
    (d) =>
      d.repId === currentUserId ||
      (d.areaId && repAreaIds.includes(d.areaId)) ||
      (d.area && typeof d.area === "string" && repAreaNames.includes(d.area.toLowerCase().trim())),
  );
  const totalDoctorsCount = repDoctors.length;

  const allHospitals =
    (window.store && window.store.hospitals
      ? window.store.hospitals.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.hospitals)) || [];
  const repHospitals = allHospitals.filter(
    (h) =>
      h.repId === currentUserId ||
      (h.areaId && repAreaIds.includes(h.areaId)) ||
      (!h.repId && repAreaIds.length === 0),
  );
  const totalHospitalsCount = repHospitals.length;

  const now = (window.getSystemDate && window.getSystemDate()) || new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr =
    (typeof window.todayStr !== "undefined" && window.todayStr) ||
    (typeof window.getSystemTodayStr === "function" && window.getSystemTodayStr()) ||
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${pad(tomorrowDate.getMonth() + 1)}-${pad(tomorrowDate.getDate())}`;

  // All valid approved planned visits for this representative
  const allRepPlannedVisits = allVisits.filter(
    (v) =>
      v.repId === currentUserId &&
      v.status === "planned" &&
      v.date &&
      !isPlannedVisitExpired(v.date) &&
      !isPlanVisitAlreadyCompleted(v, allVisits),
  );
  allRepPlannedVisits.sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));

  const todayPlanned = allRepPlannedVisits.filter(
    (v) => v.date === todayStr || (v.date < todayStr && !isPlannedVisitExpired(v.date)),
  );
  const tomorrowPlanned = allRepPlannedVisits.filter((v) => v.date === tomorrowStr);
  const upcomingPlanned = allRepPlannedVisits.filter((v) => v.date > todayStr);

  let activeTab = window.currentRepPlanTab || "auto";
  if (activeTab === "auto") {
    if (todayPlanned.length > 0) activeTab = "today";
    else if (tomorrowPlanned.length > 0) activeTab = "tomorrow";
    else if (upcomingPlanned.length > 0) activeTab = "upcoming";
    else activeTab = "today";
  }

  let activePlanned = [];
  if (activeTab === "today") {
    activePlanned = todayPlanned;
  } else if (activeTab === "tomorrow") {
    activePlanned = tomorrowPlanned;
  } else if (activeTab === "upcoming") {
    activePlanned = upcomingPlanned;
  } else if (activeTab === "all") {
    activePlanned = allRepPlannedVisits;
  } else if (activeTab === "date" && window.currentRepPlanDate) {
    activePlanned = allRepPlannedVisits.filter((v) => v.date === window.currentRepPlanDate);
  } else {
    activePlanned = todayPlanned;
  }

  const isPharmVisit = (v) =>
    v.targetType === "pharmacy" ||
    (v.period || "").toLowerCase() === "pharmacy" ||
    (v.doctorId && String(v.doctorId).startsWith("pharm"));

  const plannedAM = activePlanned.filter(
    (v) =>
      !isPharmVisit(v) &&
      (v.period === "am" || v.period === "AM" || v.type === "hospital" || v.targetType === "hospital"),
  );
  const plannedPM = activePlanned.filter(
    (v) =>
      !isPharmVisit(v) &&
      (v.period === "pm" || v.period === "PM" || v.type === "doctor" || v.targetType === "doctor" || (!v.type && !v.period)),
  );
  const plannedPharm = activePlanned.filter((v) => isPharmVisit(v));

  const completedVisits = allVisits
    .filter((v) => v.repId === currentUserId && v.status === "completed")
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || ""));

  const currentMonthNum = now.getMonth();
  const currentQuarterNum = Math.floor(currentMonthNum / 3) + 1;
  const quarterStartMonth = (currentQuarterNum - 1) * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  const quarterLabel = `Q${currentQuarterNum}`;

  const currentQuarterCompletedVisits = allVisits.filter((v) => {
    if (
      !(
        v.repId === currentUserId &&
        v.status === "completed" &&
        v.date
      )
    ) {
      return false;
    }
    const vDate = new Date(v.date);
    const vYear = vDate.getFullYear();
    const vMonth = vDate.getMonth();
    return (
      vYear === now.getFullYear() &&
      vMonth >= quarterStartMonth &&
      vMonth <= quarterEndMonth
    );
  });

  const quarterCompletedVisitsAM = currentQuarterCompletedVisits.filter(
    (v) =>
      !isPharmVisit(v) &&
      (v.period === "am" || v.period === "AM" || v.type === "hospital"),
  );
  const quarterCompletedVisitsPM = currentQuarterCompletedVisits.filter(
    (v) =>
      !isPharmVisit(v) &&
      (v.period === "pm" || v.period === "PM" || v.type === "doctor" || !v.type),
  );

  // PM Clinics Quarterly Target: Dynamically calculated per doctor via getDoctorCallTarget based on assigned product line & class
  const quarterlyVisitTargetPM = Math.max(
    1,
    repDoctors.reduce((sum, d) => {
      const quarterlyTarget =
        (typeof window.getDoctorCallTarget === "function" && window.getDoctorCallTarget(d)) ||
        (d.class === "A" ? 4 : (d.class === "B" ? 3 : 1));
      return sum + quarterlyTarget;
    }, 0),
  );

  // AM Hospitals Quarterly Target: 6 visits per hospital per quarter (2 visits per month * 3 months)
  const quarterlyVisitTargetAM = totalHospitalsCount > 0 ? (totalHospitalsCount * 6) : 6;

  const currentMonthStr = todayStr.slice(0, 7);
  const currentMonthCompletedVisits = allVisits.filter(
    (v) =>
      v.repId === currentUserId &&
      v.status === "completed" &&
      v.date &&
      v.date.startsWith(currentMonthStr),
  );

  const coveredDoctorIds = new Set();
  currentMonthCompletedVisits.forEach((v) => {
    if (v.doctorId) {
      coveredDoctorIds.add(v.doctorId);
    } else if (v.doctorName || v.targetName) {
      const matched = repDoctors.find(
        (d) =>
          d.name === (v.doctorName || v.targetName) ||
          d.nameAr === (v.doctorName || v.targetName),
      );
      if (matched) coveredDoctorIds.add(matched.id);
    }
  });
  const coveredDoctorsCount = repDoctors.filter((d) =>
    coveredDoctorIds.has(d.id),
  ).length;
  const overallCoveragePct =
    totalDoctorsCount > 0
      ? Math.round((coveredDoctorsCount / totalDoctorsCount) * 100)
      : 0;

  const currentYear = todayStr.slice(0, 4);
  const repYTDSales = allSales.filter(
    (s) =>
      s.repId === currentUserId &&
      s.month &&
      s.month.startsWith(currentYear),
  );
  const actualSalesTotal = repYTDSales.reduce(
    (sum, s) => sum + (parseFloat(s.actual) || parseFloat(s.amount) || 0),
    0,
  );
  const targetSalesTotal = repYTDSales.reduce(
    (sum, s) => sum + (parseFloat(s.target) || 0),
    0,
  );
  const salesAchievementPct =
    targetSalesTotal > 0
      ? Math.round((actualSalesTotal / targetSalesTotal) * 100)
      : actualSalesTotal > 0 ? 100 : 0;

  const userLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
  const lineNames = userLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");

  return `
    <div class="flex-col">
      <div class="welcome-banner rep">
        <h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "المندوب الطبي" : "Medical Representative"} ${userName}!</h2>
        <div class="welcome-subtitle">${lineNames || (lang === "ar" ? "المندوب الطبي" : "Medical Representative")}</div>
      </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">${t.total_doctors}</div>
            <div class="stat-value primary counter" data-target="${totalDoctorsCount}">${totalDoctorsCount}</div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${lang === "ar" ? "أطباء اللستة المسندين" : "Assigned Doctor List"}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${lang === "ar" ? `زيارات العيادات (PM - ${quarterLabel})` : `Clinics (PM - ${quarterLabel})`}</div>
            <div class="stat-value success">
              <span class="counter" data-target="${quarterCompletedVisitsPM.length}">${quarterCompletedVisitsPM.length}</span>
              <span style="font-size: 0.9rem; color: var(--gray-500); font-weight: 600;"> / ${quarterlyVisitTargetPM}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${lang === "ar" ? `مستهدف الزيارات / الربع (${totalDoctorsCount} أطباء)` : `Target Visits / Quarter (${totalDoctorsCount} Doctors)`}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${lang === "ar" ? `زيارات المستشفيات (AM - ${quarterLabel})` : `Hospitals (AM - ${quarterLabel})`}</div>
            <div class="stat-value info" style="color: var(--primary, #2563eb);">
              <span class="counter" data-target="${quarterCompletedVisitsAM.length}">${quarterCompletedVisitsAM.length}</span>
              <span style="font-size: 0.9rem; color: var(--gray-500); font-weight: 600;"> / ${quarterlyVisitTargetAM}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${lang === "ar" ? `مستهدف الزيارات / الربع (${totalHospitalsCount} مستشفيات)` : `Target Visits / Quarter (${totalHospitalsCount} Hospitals)`}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${lang === "ar" ? "الأطباء الذين تم زيارتهم (هذا الشهر)" : "Doctors Visited (This Month)"}</div>
            <div class="stat-value success">
              <span class="counter" data-target="${coveredDoctorsCount}">${coveredDoctorsCount}</span>
              <span style="font-size: 0.95rem; color: var(--gray-500); font-weight: 600;"> / ${totalDoctorsCount}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${lang === "ar" ? `نسبة الوصول: ${overallCoveragePct}%` : `Reach: ${overallCoveragePct}%`} • ${lang === "ar" ? `${Math.max(0, totalDoctorsCount - coveredDoctorsCount)} متبقي` : `${Math.max(0, totalDoctorsCount - coveredDoctorsCount)} Left`}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${t.sales_achievement || "Sales Target %"}</div>
            <div class="stat-value warning"><span class="counter" data-target="${salesAchievementPct}">${salesAchievementPct}</span>%</div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${actualSalesTotal > 0 ? `${actualSalesTotal.toLocaleString()} / ${targetSalesTotal.toLocaleString()} EGP` : "0 EGP"}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${t.active_planned}</div>
            <div class="stat-value danger counter" data-target="${allRepPlannedVisits.length}">${allRepPlannedVisits.length}</div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${todayPlanned.length} ${lang === "ar" ? "اليوم" : "Today"} • ${upcomingPlanned.length} ${lang === "ar" ? "قادمة" : "Upcoming"}
            </div>
          </div>
        </div>

        <div class="dashboard-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px;">
            <div>
              <h3 class="card-title" style="margin: 0; font-weight: 700;">${t.todays_plan}</h3>
              <small style="color: var(--gray-500); font-size: 0.8rem;">⏰ ${t.plan_expiry_note}</small>
            </div>
            <a href="visits.html" class="btn btn-sm btn-primary" style="padding: 6px 14px; text-decoration: none; border-radius: 8px;">
              + ${t.new_visit}
            </a>
          </div>

          <div class="rep-plan-filter-toolbar">
            <div class="rep-plan-tabs">
              <button type="button" class="rep-plan-tab-btn ${activeTab === 'today' ? 'active' : ''}" onclick="switchRepPlanTab('today')">
                📅 ${t.filter_today} <span class="badge">${todayPlanned.length}</span>
              </button>
              <button type="button" class="rep-plan-tab-btn ${activeTab === 'tomorrow' ? 'active' : ''}" onclick="switchRepPlanTab('tomorrow')">
                🌅 ${t.filter_tomorrow} <span class="badge">${tomorrowPlanned.length}</span>
              </button>
              <button type="button" class="rep-plan-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}" onclick="switchRepPlanTab('upcoming')">
                🗓️ ${t.filter_upcoming} <span class="badge">${upcomingPlanned.length}</span>
              </button>
              <button type="button" class="rep-plan-tab-btn ${activeTab === 'all' ? 'active' : ''}" onclick="switchRepPlanTab('all')">
                🌐 ${t.filter_all_planned} <span class="badge">${allRepPlannedVisits.length}</span>
              </button>
            </div>
            <div class="rep-plan-date-picker-wrap">
              <label class="rep-plan-date-label">📅 ${t.specific_date}:</label>
              <input type="date" class="form-control form-control-sm rep-plan-date-input" value="${window.currentRepPlanDate || ''}" onchange="switchRepPlanDate(this.value)">
            </div>
          </div>

          <div class="plan-list">
            <div class="plan-item am">
              <div class="plan-item-header">
                <strong class="plan-header-title am">${t.am_hospitals}</strong>
                <span class="badge badge-plan-count am">${plannedAM.length}</span>
              </div>
              <div>
                ${
                  plannedAM.length > 0
                    ? plannedAM
                        .map(
                          (h) => `
                    <div class="planned-target-row">
                      <div class="planned-target-info">
                        <strong class="planned-target-name">${window.escapeHtml(h.doctorName || h.targetName || "Hospital")}</strong>
                        <div class="planned-target-date">
                          <span class="date-icon">📅</span> ${h.date} ${h.time ? `• ⏰ ${h.time}` : ""}
                          ${h.date === todayStr ? `<span class="badge" style="background: rgba(13, 110, 253, 0.12); color: #0d6efd; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "اليوم" : "Today"}</span>` : (h.date === tomorrowStr ? `<span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "غداً" : "Tomorrow"}</span>` : (h.date > todayStr ? `<span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4f46e5; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "قادمة" : "Upcoming"}</span>` : `<span class="badge" style="background: rgba(220, 53, 69, 0.12); color: #dc3545; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "مستحقة سابقة" : "Overdue"}</span>`))}
                          ${h.visitType === "double" ? `<span class="badge" style="background: rgba(111, 66, 193, 0.12); color: #6f42c1; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">🤝 ${lang === "ar" ? "مرافقة" : "Double"}</span>` : ""}
                        </div>
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        <button class="btn-convert-action" onclick="openCompletePlanModal('${h.id}', false)">
                          ✓ ${t.convert_to_actual}
                        </button>
                        <button type="button" class="btn-reschedule-action" onclick="openRescheduleModal('${h.id}')" style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" title="${lang === 'ar' ? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">
                          🗓️ ${lang === 'ar' ? 'تأجيل' : 'Reschedule'}
                        </button>
                      </div>
                    </div>
                  `,
                        )
                        .join("")
                    : `<p style="color: var(--gray-600); margin: 0; font-style: italic; font-size: 0.85rem;">${t.no_planned_visits}</p>`
                }
              </div>
            </div>

            <div class="plan-item pm">
              <div class="plan-item-header">
                <strong class="plan-header-title pm">${t.pm_doctors}</strong>
                <span class="badge badge-plan-count pm">${plannedPM.length}</span>
              </div>
              <div>
                ${
                  plannedPM.length > 0
                    ? plannedPM
                        .map(
                          (d) => `
                    <div class="planned-target-row">
                      <div class="planned-target-info">
                        <strong class="planned-target-name">${window.escapeHtml(d.doctorName || d.targetName || "Doctor")}</strong>
                        <div class="planned-target-date">
                          <span class="date-icon">📅</span> ${d.date} ${d.time ? `• ⏰ ${d.time}` : ""}
                          ${d.date === todayStr ? `<span class="badge" style="background: rgba(13, 110, 253, 0.12); color: #0d6efd; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "اليوم" : "Today"}</span>` : (d.date === tomorrowStr ? `<span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "غداً" : "Tomorrow"}</span>` : (d.date > todayStr ? `<span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4f46e5; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "قادمة" : "Upcoming"}</span>` : `<span class="badge" style="background: rgba(220, 53, 69, 0.12); color: #dc3545; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "مستحقة سابقة" : "Overdue"}</span>`))}
                          ${d.visitType === "double" ? `<span class="badge" style="background: rgba(111, 66, 193, 0.12); color: #6f42c1; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">🤝 ${lang === "ar" ? "مرافقة" : "Double"}</span>` : ""}
                        </div>
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        <button class="btn-convert-action" onclick="openCompletePlanModal('${d.id}', false)">
                          ✓ ${t.convert_to_actual}
                        </button>
                        <button type="button" class="btn-reschedule-action" onclick="openRescheduleModal('${d.id}')" style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" title="${lang === 'ar' ? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">
                          🗓️ ${lang === 'ar' ? 'تأجيل' : 'Reschedule'}
                        </button>
                      </div>
                    </div>
                  `,
                        )
                        .join("")
                    : `<p style="color: var(--gray-600); margin: 0; font-style: italic; font-size: 0.85rem;">${t.no_planned_visits}</p>`
                }
              </div>
            </div>

            ${plannedPharm.length > 0 ? `
            <div class="plan-item pharm">
              <div class="plan-item-header">
                <strong class="plan-header-title pharm">💊 ${t.pharm_planned}</strong>
                <span class="badge badge-plan-count pharm">${plannedPharm.length}</span>
              </div>
              <div>
                ${plannedPharm
                  .map(
                    (p) => `
                  <div class="planned-target-row">
                    <div class="planned-target-info">
                      <strong class="planned-target-name">${window.escapeHtml(p.doctorName || p.targetName || "Pharmacy")}</strong>
                      <div class="planned-target-date">
                        <span class="date-icon">📅</span> ${p.date} ${p.time ? `• ⏰ ${p.time}` : ""}
                        ${p.date === todayStr ? `<span class="badge" style="background: rgba(13, 110, 253, 0.12); color: #0d6efd; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "اليوم" : "Today"}</span>` : (p.date === tomorrowStr ? `<span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "غداً" : "Tomorrow"}</span>` : (p.date > todayStr ? `<span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4f46e5; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "قادمة" : "Upcoming"}</span>` : `<span class="badge" style="background: rgba(220, 53, 69, 0.12); color: #dc3545; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">${lang === "ar" ? "مستحقة سابقة" : "Overdue"}</span>`))}
                        ${p.visitType === "double" ? `<span class="badge" style="background: rgba(111, 66, 193, 0.12); color: #6f42c1; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-inline-start: 4px;">🤝 ${lang === "ar" ? "مرافقة" : "Double"}</span>` : ""}
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                      <button class="btn-convert-action" onclick="openCompletePlanModal('${p.id}', false)">
                        ✓ ${t.convert_to_actual}
                      </button>
                      <button type="button" class="btn-reschedule-action" onclick="openRescheduleModal('${p.id}')" style="background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" title="${lang === 'ar' ? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">
                        🗓️ ${lang === 'ar' ? 'تأجيل' : 'Reschedule'}
                      </button>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
            ` : ""}
          </div>
        </div>
          </div>
        </div>

        <div class="dashboard-card">
          <div class="table-header-row">
            <h3 style="margin: 0; font-weight: 700;">${t.recent_visits}</h3>
            <a href="visits.html" class="action-btn primary" style="text-decoration: none; padding: 6px 14px; border-radius: 8px;">${t.view_all_visits}</a>
          </div>
          <div class="table-container">
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid var(--gray-200);">
                  <th style="padding: 10px;">${t.target_doctor}</th>
                  <th style="padding: 10px;">${t.date_time}</th>
                  <th style="padding: 10px;">${t.entry_type}</th>
                  <th style="padding: 10px;">${t.status}</th>
                </tr>
              </thead>
              <tbody>
                ${completedVisits
                  .slice(0, 5)
                  .map((v) => {
                    const dt =
                      typeof window.formatVisitDateTime === "function"
                        ? window.formatVisitDateTime(v.date, v.time, lang)
                        : { dayName: "", time: v.time || "10:00" };
                    return `
                  <tr>
                    <td style="padding: 10px; font-weight: 600;">${window.escapeHtml(v.doctorName || v.targetName)}</td>
                    <td style="padding: 10px; color: var(--gray-700);">
                      <div style="font-weight: 700; color: var(--primary); font-size: 0.82rem; white-space: nowrap;">${dt.dayName}</div>
                      <div style="font-weight: 600; font-size: 0.8rem; white-space: nowrap;">📅 ${v.date}</div>
                      <div style="font-size: 0.75rem; color: var(--gray-500); font-weight: 600; white-space: nowrap;">⏰ ${dt.time}</div>
                      ${(() => {
                        const insD = v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date);
                        const insT = v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || "10:00"));
                        return `<div style="font-size: 0.72rem; color: #0d6efd; font-weight: 600; white-space: nowrap; margin-top: 3px;" title="Insertion Date & Time">📥 ${lang === 'ar' ? 'إدخال:' : 'Ins:'} ${insD} ${insT}</div>`;
                      })()}
                    </td>
                    <td style="padding: 10px;">
                      <span class="entry-type-badge ${v.source === "actual" ? "actual" : "plan"}">
                        ${v.source === "actual" ? t.direct_actual : t.from_plan}
                      </span>
                      ${v.visitType === "double" ? `<div class="double-companion-tag">[Double: ${v.doubleWithUserName || "Companion"}]</div>` : ""}
                    </td>
                    <td style="padding: 10px;">
                      <span class="status-badge completed">
                        ${t.completed}
                      </span>
                    </td>
                  </tr>
                `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        ${renderDashboardChartsMarkup(lang)}
      </div>
    `;
}

/**
 * Renders the District Manager (DM) Dashboard.
 */
function renderDMDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  const dmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
  const lineNames = dmLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");
  const activeDmLine = window.dmActiveLineFilter || "all";

  const allMyReps = allUsers.filter(
    (u) =>
      u.managerId === user.id && (u.role === "medical_rep" || u.role === "rep"),
  );
  const myReps = activeDmLine === "all"
    ? allMyReps
    : allMyReps.filter((r) => {
        const rLines = r.lineIds || (r.lineId ? [r.lineId] : []);
        return rLines.includes(activeDmLine);
      });
  const myRepIds = myReps.map((r) => r.id);

  const allLeaves =
    (window.store && window.store.leaves
      ? window.store.leaves.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];
  const pendingLeavesCount = allLeaves.filter(
    (l) =>
      l.status !== "rejected" &&
      l.status !== "approved" &&
      myRepIds.includes(l.userId) &&
      (!l.approvals || !l.approvals.dm || l.approvals.dm.status === "pending"),
  ).length;

  const pendingPlansCount = allVisits.filter(
    (v) => myRepIds.includes(v.repId) && v.status === "pending_approval",
  ).length;

  const now = new Date();
  const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentYearMonth = todayStr.slice(0, 7);
  const monthlyTeamCompletedVisits = allVisits.filter(
    (v) =>
      myRepIds.includes(v.repId) &&
      v.status === "completed" &&
      v.date &&
      v.date.startsWith(currentYearMonth),
  ).length;
  const selectedDate = getDmSelectedDate();

  const storedSchedule = getDmAccompanimentSchedule(user.id);
  const storedRepIdForDate = storedSchedule
    ? storedSchedule[selectedDate]
    : null;

  const isConfirmedForSelectedDate =
    (window.currentDmConfirmedDate === selectedDate &&
      !!window.currentDmConfirmedRepId) ||
    !!storedRepIdForDate;

  const activeConfirmedRepId = isConfirmedForSelectedDate
    ? window.currentDmConfirmedRepId || storedRepIdForDate
    : null;

  if (isConfirmedForSelectedDate && activeConfirmedRepId) {
    window.currentDmConfirmedDate = selectedDate;
    window.currentDmConfirmedRepId = activeConfirmedRepId;
  }

  const accompaniedRep =
    isConfirmedForSelectedDate && activeConfirmedRepId !== "none"
      ? myReps.find((r) => r.id === activeConfirmedRepId)
      : null;
  const isOfficeDay =
    isConfirmedForSelectedDate && activeConfirmedRepId === "none";

  const rawAccompaniedVisits = accompaniedRep
    ? allVisits.filter(
        (v) =>
          v.repId === accompaniedRep.id &&
          v.date === selectedDate &&
          v.targetType !== "pharmacy" &&
          !(v.doctorId && v.doctorId.toString().startsWith("pharm")) &&
          !(v.doctorId && v.doctorId.toString().startsWith("p")),
      )
    : [];

  const pendingAccompaniedVisits = rawAccompaniedVisits.filter(
    (v) =>
      (v.status === "planned" || v.status === "pending_approval") &&
      !isPlannedVisitExpired(v.date) &&
      !isPlanVisitAlreadyCompleted(v, allVisits),
  );
  pendingAccompaniedVisits.sort((a, b) => {
    const pA = (a.period || "").toLowerCase();
    const pB = (b.period || "").toLowerCase();
    if (pA === "am" && pB !== "am") return -1;
    if (pA !== "am" && pB === "am") return 1;
    return (a.time || "00:00").localeCompare(b.time || "00:00");
  });

  const dtSelected =
    typeof window.formatVisitDateTime === "function"
      ? window.formatVisitDateTime(selectedDate, "09:00", lang)
      : { dayName: "" };

  const activeTab = window.dmScheduleActiveTab || "all";

  const scheduledDates = Object.keys(storedSchedule)
    .filter((dateStr) => {
      if (isPlannedVisitExpired(dateStr)) return false;
      const repIdForDate = storedSchedule[dateStr];
      if (repIdForDate === "none") return dateStr >= todayStr;
      const hasActiveVisits = allVisits.some(
        (v) =>
          v.repId === repIdForDate &&
          v.date === dateStr &&
          (v.status === "planned" || v.status === "pending_approval") &&
          !isPlannedVisitExpired(v.date) &&
          !isPlanVisitAlreadyCompleted(v, allVisits)
      );
      return hasActiveVisits || dateStr >= todayStr;
    })
    .sort();

  const allScheduledVisits = [];
  scheduledDates.forEach((dateStr) => {
    const repIdForDate = storedSchedule[dateStr];
    if (repIdForDate && repIdForDate !== "none") {
      const repObj = myReps.find((r) => r.id === repIdForDate);
      const repVisits = allVisits.filter(
        (v) =>
          v.repId === repIdForDate &&
          v.date === dateStr &&
          (v.status === "planned" || v.status === "pending_approval") &&
          v.targetType !== "pharmacy" &&
          !(v.doctorId && v.doctorId.toString().startsWith("pharm")) &&
          !(v.doctorId && v.doctorId.toString().startsWith("p")) &&
          !isPlannedVisitExpired(v.date) &&
          !isPlanVisitAlreadyCompleted(v, allVisits),
      );
      repVisits.forEach((rv) => {
        allScheduledVisits.push({
          ...rv,
          repName: repObj ? repObj.name : "Rep",
          repCode: (repObj && (repObj.employeeCode || repObj.code)) || "Rep",
        });
      });
    }
  });

  allScheduledVisits.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const pA = (a.period || "").toLowerCase();
    const pB = (b.period || "").toLowerCase();
    if (pA === "am" && pB !== "am") return -1;
    if (pA !== "am" && pB === "am") return 1;
    return (a.time || "00:00").localeCompare(b.time || "00:00");
  });

  return `
    <div class="flex-col">
      <div class="welcome-banner dm">
        <h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مدير المنطقة" : "District Manager"} ${userName}!</h2>
        <div class="welcome-subtitle">${lineNames || (lang === "ar" ? "إدارة المناطق" : "District Management")}</div>
      </div>

      ${
        dmLines.length > 1
          ? `
        <div class="dashboard-line-filter">
          <span class="line-filter-label">🏷️ ${lang === "ar" ? "تصفية بالخط:" : "Filter by Line:"}</span>
          <button type="button" class="line-filter-btn ${activeDmLine === "all" ? "active" : ""}" onclick="window.switchDmLineFilter('all')">
            ${lang === "ar" ? `جميع الخطوط (${dmLines.length})` : `All Lines (${dmLines.length})`}
          </button>
          ${dmLines
            .map(
              (l) => `
            <button type="button" class="line-filter-btn ${activeDmLine === l.id ? "active" : ""}" onclick="window.switchDmLineFilter('${l.id}')">
              ${lang === "ar" ? (l.nameAr || l.name) : l.name}
            </button>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">${t.total_reps}</div>
          <div class="stat-value primary counter" data-target="${myReps.length}">${myReps.length}</div>
        </div>
        <a href="visits.html" class="stat-card" style="text-decoration: none; cursor: pointer; border-inline-start: 4px solid var(--success);">
          <div class="stat-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${lang === "ar" ? "زيارات الفريق (هذا الشهر)" : "Team Visits (This Month)"}</span>
            <span>📍</span>
          </div>
          <div class="stat-value success counter" data-target="${monthlyTeamCompletedVisits}">${monthlyTeamCompletedVisits}</div>
          <div class="stat-card-link" style="font-size: 0.75rem; margin-top: 4px; font-weight: 600;">
            ${lang === "ar" ? "عرض زيارات الشهر ←" : "View Team Visits →"}
          </div>
        </a>
        <a href="plans-review.html" class="stat-card" style="text-decoration: none; cursor: pointer; border-inline-start: 4px solid var(--warning);">
          <div class="stat-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${t.plans_review || (lang === "ar" ? "خطط للمراجعة" : "Plans to Review")}</span>
            <span>📋</span>
          </div>
          <div class="stat-value warning counter" data-target="${pendingPlansCount}">${pendingPlansCount}</div>
          <div class="stat-card-link" style="font-size: 0.75rem; margin-top: 4px; font-weight: 600;">
            ${lang === "ar" ? "مراجعة واعتماد الخطط ←" : "Review & Approve Plans →"}
          </div>
        </a>
        <a href="leaves.html" class="stat-card" style="text-decoration: none; cursor: pointer; border-inline-start: 4px solid var(--danger);">
          <div class="stat-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${t.leave_requests || (lang === "ar" ? "طلبات إجازة للموافقة" : "Leave Requests to Approve")}</span>
            <span>🏖️</span>
          </div>
          <div class="stat-value danger counter" data-target="${pendingLeavesCount}">${pendingLeavesCount}</div>
          <div class="stat-card-link" style="font-size: 0.75rem; margin-top: 4px; font-weight: 600;">
            ${lang === "ar" ? "مراجعة واعتماد الإجازات ←" : "Review & Approve Leaves →"}
          </div>
        </a>
      </div>

      <div class="dashboard-card" style="margin-bottom: 20px; border-inline-start: 4px solid var(--primary);">
        <div class="dm-schedule-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🤝</span>
              <h3 class="card-title" style="margin: 0; font-weight: 800; font-size: 1.15rem;">
                ${lang === "ar" ? "جدول النزول الميداني والمرافقة (Co-Visiting)" : "Field Accompaniment Schedule (Co-Visiting)"}
              </h3>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
              <button type="button" class="dm-schedule-tab-btn ${activeTab === "all" ? "active" : ""}" onclick="window.switchDmScheduleTab('all')">
                📋 ${lang === "ar" ? `كل الأيام المحددة (${scheduledDates.length})` : `All Scheduled Days (${scheduledDates.length})`}
              </button>
              <button type="button" class="dm-schedule-tab-btn ${activeTab === "daily" ? "active" : ""}" onclick="window.switchDmScheduleTab('daily')">
                📅 ${lang === "ar" ? "عرض يوم محدد" : "Daily View"}
              </button>
            </div>
          </div>

          <div class="dm-schedule-nav-btn">
            <a href="plans-review.html" class="btn btn-sm btn-primary">
              📋 <span>${lang === "ar" ? "مراجعة الخطط وجدولة النزول الميداني" : "Review Plans & Schedule Accompaniment"}</span>
            </a>
          </div>
        </div>

        ${
          activeTab === "all"
            ? `
          ${
            scheduledDates.length === 0
              ? `
            <div class="dm-prompt-banner">
              <div style="font-size: 2rem; margin-bottom: 8px;">📋</div>
              <strong style="font-size: 1.05rem; display: block; margin-bottom: 6px;">
                ${lang === "ar" ? "لم يتم جدولة أيام نزول ميداني مشتركة بعد" : "No field accompaniment days scheduled yet"}
              </strong>
              <p style="font-size: 0.88rem; margin-bottom: 14px; max-width: 520px; margin-left: auto; margin-right: auto;">
                ${lang === "ar" ? "انتقل إلى «مراجعة واعتماد الخطط» لمراجعة خطط مناديب فريقك واختيار الأيام التي ترغب بمرافقتهم فيها بالكامل." : 'Go to "Plans to Review" to review your team\'s planned schedules and choose full days to accompany them.'}
              </p>
              <a href="plans-review.html" class="btn btn-primary btn-sm">
                📋 ${lang === "ar" ? "الذهاب لمراجعة الخطط وحجز الأيام" : "Go to Plans to Review"}
              </a>
            </div>
          `
              : `
            <div class="dm-schedule-pills-container">
              ${scheduledDates
                .map((dateStr) => {
                  const repIdVal = storedSchedule[dateStr];
                  const repObj = myReps.find((r) => r.id === repIdVal);
                  const dt =
                    typeof window.formatVisitDateTime === "function"
                      ? window.formatVisitDateTime(dateStr, null, lang)
                      : { dayName: "" };
                  const isOffice = repIdVal === "none";
                  return `
                  <div class="dm-schedule-pill">
                    <span class="pill-date">📅 ${dt.dayName} ${dateStr}</span>
                    <span class="pill-divider">|</span>
                    ${
                      isOffice
                        ? `<span class="pill-office">🏢 ${lang === "ar" ? "مكتبي" : "Office"}</span>`
                        : `<span class="pill-rep">👤 ${repObj ? repObj.name : "Rep"}</span>`
                    }
                  </div>
                `;
                })
                .join("")}
            </div>

            <div class="table-container">
              <table class="data-table dm-covisit-table" style="width: 100%;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--gray-200);">
                    <th class="dm-covisit-sticky-col">${lang === "ar" ? "التاريخ واليوم" : "Date & Day"}</th>
                    <th>${lang === "ar" ? "المندوب المرافق" : "Accompanied Rep"}</th>
                    <th>${lang === "ar" ? "الهدف المخطط" : "Planned Target"}</th>
                    <th class="dm-covisit-products-col">${lang === "ar" ? "المنتجات" : "Products"}</th>
                    <th class="text-end covisit-action-cell">${lang === "ar" ? "إجراء المرافقة" : "Co-Visit Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    allScheduledVisits.length > 0
                      ? allScheduledVisits
                          .map((sv) => {
                            const dt =
                              typeof window.formatVisitDateTime === "function"
                                ? window.formatVisitDateTime(
                                    sv.date,
                                    sv.time,
                                    lang,
                                  )
                                : { dayName: "", time: sv.time || "10:00" };
                            const isPharm =
                              sv.targetType === "pharmacy" ||
                              (sv.period || "").toLowerCase() === "pharmacy" ||
                              (sv.doctorId && String(sv.doctorId).startsWith("pharm"));
                            const isHospital =
                              !isPharm && (sv.period || "").toUpperCase() === "AM";
                            const targetTypeBadge = isPharm
                              ? lang === "ar"
                                ? "صيدلية"
                                : "Pharmacy"
                              : isHospital
                                ? lang === "ar"
                                  ? "مستشفى"
                                  : "Hospital"
                                : lang === "ar"
                                  ? "عيادة طبيب"
                                  : "Clinic Visit";
                            const periodBadge = isPharm
                              ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700; font-size: 0.72rem;">💊 ${lang === "ar" ? "صيدلية" : "PHARM"}</span>`
                              : isHospital
                                ? `<span class="badge" style="background: rgba(255, 193, 7, 0.2); color: #b45309; font-weight: 700; font-size: 0.72rem;">AM</span>`
                                : `<span class="badge" style="background: rgba(13, 110, 253, 0.15); color: #0d6efd; font-weight: 700; font-size: 0.72rem;">PM</span>`;

                            return `
                      <tr>
                        <td class="dm-covisit-sticky-col" style="white-space: nowrap;">
                          <div style="font-weight: 700; color: var(--primary); font-size: 0.82rem;">📅 ${dt.dayName}</div>
                          <div style="font-weight: 600; font-size: 0.82rem;">${sv.date}</div>
                        </td>
                        <td style="white-space: nowrap;">
                          <strong style="color: var(--gray-800); font-size: 0.88rem;">👤 ${sv.repName}</strong>
                          <div style="font-size: 0.75rem; color: var(--gray-500);">${sv.repCode}</div>
                        </td>
                        <td>
                          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <strong class="visit-doc-name">${window.escapeHtml(sv.doctorName || sv.targetName || "Doctor")}</strong>
                            ${periodBadge}
                          </div>
                          <div class="target-type-badge" style="font-size: 0.75rem; margin-top: 2px;">${targetTypeBadge}</div>
                        </td>
                        <td class="dm-covisit-products-col">
                          ${(() => {
                            const prods = window.getVisitDisplayProducts ? window.getVisitDisplayProducts(sv) : (sv.products || []);
                            return prods.length ? `<span class="badge badge-product">💊 ${prods.join(", ")}</span>` : '<span class="text-muted">-</span>';
                          })()}
                        </td>
                        <td class="text-end covisit-action-cell">
                          <button class="btn-convert-action" onclick="openCompletePlanModal('${sv.id}', true)">
                            🤝 ${lang === "ar" ? "تسجيل الزيارة المزدوجة" : "Log Double Visit"}
                          </button>
                        </td>
                      </tr>
                    `;
                          })
                          .join("")
                      : `
                    <tr>
                      <td colspan="5" class="empty-table-msg" style="text-align: center; padding: 24px; font-style: italic;">
                        ${lang === "ar" ? "لا توجد زيارات مخططة للمناديب في الأيام المحددة أعلاه، أو أن الأيام المحددة إدارية/مكتبية." : "No planned visits scheduled by reps on the confirmed dates, or the days are set as office days."}
                      </td>
                    </tr>
                  `
                  }
                </tbody>
              </table>
            </div>
          `
          }
        `
            : `
          ${
            scheduledDates.length === 0
              ? `
            <div class="dm-prompt-banner">
              <div style="font-size: 2rem; margin-bottom: 8px;">📋</div>
              <strong style="font-size: 1.05rem; display: block; margin-bottom: 6px;">
                ${lang === "ar" ? "لم يتم جدولة أيام نزول ميداني مشتركة بعد" : "No field accompaniment days scheduled yet"}
              </strong>
              <p style="font-size: 0.88rem; margin-bottom: 14px; max-width: 520px; margin-left: auto; margin-right: auto;">
                ${lang === "ar" ? "انتقل إلى «مراجعة واعتماد الخطط» لمراجعة خطط مناديب فريقك واختيار الأيام التي ترغب بمرافقتهم فيها بالكامل." : 'Go to "Plans to Review" to review your team\'s planned schedules and choose full days to accompany them.'}
              </p>
              <a href="plans-review.html" class="btn btn-primary btn-sm">
                📋 ${lang === "ar" ? "الذهاب لمراجعة الخطط وحجز الأيام" : "Go to Plans to Review"}
              </a>
            </div>
          `
              : `
            <div class="dm-schedule-pills-container" style="align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--gray-700);">📅 ${lang === "ar" ? "الأيام المجدولة:" : "Scheduled Days:"}</span>
              ${scheduledDates
                .map((dateStr) => {
                  const repIdVal = storedSchedule[dateStr];
                  const repObj = myReps.find((r) => r.id === repIdVal);
                  const dt =
                    typeof window.formatVisitDateTime === "function"
                      ? window.formatVisitDateTime(dateStr, null, lang)
                      : { dayName: "" };
                  const isAct = dateStr === selectedDate;
                  return `
                  <button type="button" class="btn btn-sm ${isAct ? "btn-primary" : "btn-outline"}" style="border-radius: 8px; font-size: 0.8rem; font-weight: 700; padding: 4px 12px;" onclick="onDmChangeDate('${dateStr}')">
                    📅 ${dt.dayName ? dt.dayName + " " : ""}${dateStr} (${repObj ? repObj.name.split(" ")[0] : "Rep"})
                  </button>
                `;
                })
                .join("")}
            </div>

            ${
              !isConfirmedForSelectedDate
                ? `
              <div class="dm-prompt-banner">
                <div style="font-size: 1.8rem; margin-bottom: 6px;">📅</div>
                <strong style="font-size: 1.02rem; display: block; margin-bottom: 4px;">
                  ${lang === "ar" ? `تاريخ ${selectedDate}: لا يوجد نزول ميداني مجدول لهذا اليوم` : `Date ${selectedDate}: No field accompaniment scheduled for this day`}
                </strong>
                <span style="font-size: 0.85rem;">
                  ${lang === "ar" ? "اختر يوماً من الأيام المجدولة أعلاه أو انتقل إلى صفحة مراجعة الخطط لجدولة أيام جديدة." : "Select a date from the scheduled days above or go to Plans to Review to schedule new days."}
                </span>
              </div>
            `
                : isOfficeDay
                  ? `
              <div class="dm-office-banner">
                <div style="font-size: 1.6rem; margin-bottom: 4px;">🏢</div>
                <strong class="dm-office-title">${lang === "ar" ? `تاريخ ${selectedDate}: يوم مكتبي / عمل إداري ومتابعة` : `Date ${selectedDate}: Office Work / Administrative Day`}</strong>
              </div>
            `
                  : accompaniedRep
                    ? `
              <div class="dm-accompanied-banner">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem;">
                    ${accompaniedRep.name.charAt(0)}
                  </div>
                  <div>
                    <div class="dm-accompanied-title" style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <span>${lang === "ar" ? `نزول ميداني مشترك برفقة: ${accompaniedRep.name}` : `Joint Field Accompaniment with: ${accompaniedRep.name}`}</span>
                      <span class="badge" style="background: var(--primary); color: white; font-size: 0.72rem;">${accompaniedRep.employeeCode || "Rep"}</span>
                    </div>
                    <div class="dm-accompanied-sub" style="font-size: 0.8rem; margin-top: 2px;">
                      📅 ${dtSelected.dayName} ${selectedDate} ${selectedDate === todayStr ? (lang === "ar" ? "• (اليوم)" : "• (Today)") : ""} • ${pendingAccompaniedVisits.length} ${lang === "ar" ? "زيارة مخططة للنزول المشترك" : "planned joint visits"}
                    </div>
                  </div>
                </div>
                <div>
                  <a href="visits.html" class="btn btn-sm btn-primary" style="font-weight: 600; text-decoration: none;">
                    📍 ${lang === "ar" ? "فتح في الزيارات الميدانية" : "Open in Visits Page"}
                  </a>
                </div>
              </div>

              <div class="table-container">
                <table class="data-table dm-covisit-table" style="width: 100%;">
                  <thead>
                    <tr style="border-bottom: 2px solid var(--gray-200);">
                      <th>${lang === "ar" ? "الهدف المخطط" : "Planned Target"}</th>
                      <th>${lang === "ar" ? "الفترة" : "Period"}</th>
                      <th class="dm-covisit-products-col">${lang === "ar" ? "المنتجات" : "Products"}</th>
                      <th class="text-end covisit-action-cell">${lang === "ar" ? "إجراء المرافقة" : "Co-Visit Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      pendingAccompaniedVisits.length > 0
                        ? pendingAccompaniedVisits
                            .map((pv) => {
                              const isPharm =
                                pv.targetType === "pharmacy" ||
                                (pv.period || "").toLowerCase() === "pharmacy" ||
                                (pv.doctorId && String(pv.doctorId).startsWith("pharm"));
                              const isHospital =
                                !isPharm && (pv.period || "").toUpperCase() === "AM";
                              const targetTypeBadge = isPharm
                                ? lang === "ar"
                                  ? "صيدلية"
                                  : "Pharmacy"
                                : isHospital
                                  ? lang === "ar"
                                    ? "مستشفى"
                                    : "Hospital"
                                  : lang === "ar"
                                    ? "عيادة طبيب"
                                    : "Clinic Visit";
                              const periodBadge = isPharm
                                ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-weight: 700; font-size: 0.72rem;">💊 ${lang === "ar" ? "صيدلية" : "PHARM"}</span>`
                                : isHospital
                                  ? `<span class="badge" style="background: rgba(255, 193, 7, 0.2); color: #b45309; font-weight: 700; font-size: 0.72rem;">AM</span>`
                                  : `<span class="badge" style="background: rgba(13, 110, 253, 0.15); color: #0d6efd; font-weight: 700; font-size: 0.72rem;">PM</span>`;

                              return `
                        <tr>
                          <td>
                            <strong class="visit-doc-name">${window.escapeHtml(pv.doctorName || pv.targetName || "Doctor")}</strong>
                            <div class="target-type-badge" style="font-size: 0.75rem;">${targetTypeBadge}</div>
                          </td>
                          <td>
                            ${periodBadge}
                          </td>
                          <td class="dm-covisit-products-col">
                            ${(() => {
                              const prods = window.getVisitDisplayProducts ? window.getVisitDisplayProducts(pv) : (pv.products || []);
                              return prods.length ? `<span class="badge badge-product">💊 ${prods.join(", ")}</span>` : '<span class="text-muted">-</span>';
                            })()}
                          </td>
                          <td class="text-end covisit-action-cell">
                            <button class="btn-convert-action" onclick="openCompletePlanModal('${pv.id}', true)">
                              🤝 ${lang === "ar" ? "تسجيل الزيارة المزدوجة" : "Log Double Visit"}
                            </button>
                          </td>
                        </tr>
                      `;
                            })
                            .join("")
                        : `
                      <tr>
                        <td colspan="4" class="empty-table-msg" style="text-align: center; padding: 20px; font-style: italic;">
                          ${lang === "ar" ? `لا توجد زيارات مخططة للمندوب ${accompaniedRep ? accompaniedRep.name : ""} في تاريخ ${selectedDate}.` : `No planned visits scheduled by ${accompaniedRep ? accompaniedRep.name : "Rep"} on ${selectedDate}.`}
                        </td>
                      </tr>
                    `
                    }
                  </tbody>
                </table>
              </div>
            `
                    : ""
            }
          `
          }
        `
        }
      </div>

      <div class="dashboard-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h3 class="card-title" style="margin: 0; font-weight: 700;">${t.team_performance}</h3>
          <span class="team-perf-subtitle" style="font-size: 0.8rem; font-weight: 600;">
            ${new Date().getFullYear()} YTD
          </span>
        </div>
        <div class="table-container">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--gray-200);">
                <th style="padding: 10px;">${t.rep_name}</th>
                <th style="padding: 10px; text-align: right;">${t.achievement}</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const currentYear = new Date().getFullYear().toString();
                const allAreas =
                  (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
                const dmAreas = allAreas.filter(
                  (a) => a.dmId === user.id || myRepIds.includes(a.repId),
                );

                const salesStore = getDashboardSalesData();

                const rowsHtml = [];

                myReps.forEach((r) => {
                  const repYTDSales = salesStore.filter((s) => {
                    const rowRepId =
                      s.repId ||
                      (s.repName &&
                      s.repName.toLowerCase() === r.name.toLowerCase()
                        ? r.id
                        : null);
                    const isYearMatch = s.month
                      ? s.month.startsWith(currentYear)
                      : s.date
                        ? s.date.startsWith(currentYear)
                        : true;
                    return rowRepId === r.id && isYearMatch;
                  });

                  let totalActual = 0;
                  let totalTarget = 0;
                  repYTDSales.forEach((s) => {
                    totalActual +=
                      parseFloat(s.actual) || parseFloat(s.amount) || 0;
                    totalTarget += parseFloat(s.target) || 0;
                  });

                  const achPct =
                    totalTarget > 0
                      ? Math.round((totalActual / totalTarget) * 100)
                      : totalActual > 0
                        ? 100
                        : 0;

                  rowsHtml.push(`
                    <tr>
                      <td class="dm-rep-name" style="padding: 10px; font-weight: 600;">${r.name}</td>
                      <td class="dm-ach-pct" style="padding: 10px; font-weight: 700; text-align: right;">${achPct}%</td>
                    </tr>
                  `);
                });

                dmAreas.forEach((area) => {
                  const hasRep = allUsers.some(
                    (u) =>
                      u.id === area.repId &&
                      (u.role === "medical_rep" || u.role === "rep"),
                  );
                  if (!area.repId || !hasRep) {
                    rowsHtml.push(`
                      <tr>
                        <td class="dm-vacant-row" style="padding: 10px; font-weight: 600;">
                          ${area.name} <span class="badge badge-vacant" style="margin-inline-start: 6px; font-size: 0.72rem;">${lang === "ar" ? "شاغرة" : "Vacant Area"}</span>
                        </td>
                        <td class="dm-vacant-text" style="padding: 10px; font-weight: 700; text-align: right; font-style: italic;">
                          ${lang === "ar" ? "شاغر (Vacant)" : "Vacant"}
                        </td>
                      </tr>
                    `);
                  }
                });

                if (rowsHtml.length === 0) {
                  return `
                    <tr>
                      <td class="dm-vacant-row" style="padding: 10px; font-weight: 600;">${lang === "ar" ? "المنطقة" : "District Territory"}</td>
                      <td class="dm-vacant-text" style="padding: 10px; font-weight: 700; text-align: right; font-style: italic;">${lang === "ar" ? "شاغر (Vacant)" : "Vacant"}</td>
                    </tr>
                  `;
                }

                return rowsHtml.join("");
              })()}
            </tbody>
          </table>
        </div>
      </div>

      ${renderDashboardChartsMarkup(lang)}
    </div>
  `;
}

/**
 * Renders the Line Manager (LM) Dashboard.
 */
function renderLMDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const allUsers =
    (window.store && window.store.users
      ? window.store.users.getAll()
      : window.DEMO_DATA && window.DEMO_DATA.users) || [];

  const lmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
  const lineNames = lmLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");
  const activeLmLine = window.lmActiveLineFilter || "all";

  const allMyDMs = allUsers.filter((u) => {
    const r = (u.role || "").toLowerCase();
    const isDM = r === "district_manager" || r === "dm";
    if (!isDM) return false;
    return u.managerId === user.id;
  });

  const myDMs =
    activeLmLine === "all"
      ? allMyDMs
      : allMyDMs.filter((dm) => {
          const dmLines = dm.lineIds || (dm.lineId ? [dm.lineId] : []);
          return dmLines.includes(activeLmLine);
        });

  const dmIds = myDMs.map((d) => d.id);

  const allMyLineReps = allUsers.filter((u) => {
    const r = (u.role || "").toLowerCase();
    const isRep = r === "medical_rep" || r === "rep";
    if (!isRep) return false;
    const underDM = allMyDMs.some((d) => d.id === u.managerId);
    return underDM || u.managerId === user.id;
  });

  const myLineReps =
    activeLmLine === "all"
      ? allMyLineReps
      : allMyLineReps.filter((r) => {
          const rLines = r.lineIds || (r.lineId ? [r.lineId] : []);
          return rLines.includes(activeLmLine);
        });
  const lineRepIds = myLineReps.map((r) => r.id);
  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  const _lmNow = new Date();
  const _lmTodayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) ||
    `${_lmNow.getFullYear()}-${String(_lmNow.getMonth() + 1).padStart(2, "0")}-${String(_lmNow.getDate()).padStart(2, "0")}`;
  const currentYearMonth = _lmTodayStr.slice(0, 7);
  const monthlyLineCompletedVisits = allVisits.filter(
    (v) =>
      lineRepIds.includes(v.repId) &&
      v.status === "completed" &&
      v.date &&
      v.date.startsWith(currentYearMonth),
  ).length;

  const allLeaves = (window.DEMO_DATA && window.DEMO_DATA.leaves) || [];
  const lmSubordinateIds = [...dmIds, ...lineRepIds];
  const lmPendingLeavesCount = allLeaves.filter((l) => {
    if (l.status === "rejected" || l.status === "approved") return false;
    const isSubordinate = lmSubordinateIds.includes(l.userId);
    const app = l.approvals || {};
    return (
      isSubordinate &&
      app.lm &&
      app.lm.status === "pending" &&
      (app.dm ? app.dm.status === "approved" : true)
    );
  }).length;

  return `
    <div class="flex-col">
      <div class="welcome-banner lm">
        <h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مدير الخط" : "Line Manager"} ${userName}!</h2>
        <div class="welcome-subtitle">${lineNames || (lang === "ar" ? "إدارة خط الإنتاج" : "Product Line Management")}</div>
      </div>

      ${
        lmLines.length > 1
          ? `
        <div class="dashboard-line-filter">
          <span class="line-filter-label">🏷️ ${lang === "ar" ? "تصفية بالخط:" : "Filter by Line:"}</span>
          <button type="button" class="line-filter-btn ${activeLmLine === "all" ? "active" : ""}" onclick="window.switchLmLineFilter('all')">
            ${lang === "ar" ? `جميع الخطوط (${lmLines.length})` : `All Lines (${lmLines.length})`}
          </button>
          ${lmLines
            .map(
              (l) => `
            <button type="button" class="line-filter-btn ${activeLmLine === l.id ? "active" : ""}" onclick="window.switchLmLineFilter('${l.id}')">
              ${lang === "ar" ? (l.nameAr || l.name) : l.name}
            </button>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">${t.total_dms}</div>
          <div class="stat-value primary counter" data-target="${myDMs.length}">${myDMs.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_line_reps}</div>
          <div class="stat-value success counter" data-target="${myLineReps.length}">${myLineReps.length}</div>
        </div>
        <a href="visits.html" class="stat-card" style="text-decoration: none; cursor: pointer; border-inline-start: 4px solid var(--primary);">
          <div class="stat-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${t.line_visits || (lang === "ar" ? "زيارات الخط (هذا الشهر)" : "Line Visits (This Month)")}</span>
            <span>📍</span>
          </div>
          <div class="stat-value primary counter" data-target="${monthlyLineCompletedVisits}">${monthlyLineCompletedVisits}</div>
          <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px; font-weight: 600;">
            ${lang === "ar" ? "عرض سجل الزيارات ←" : "View Completed Visits →"}
          </div>
        </a>
        <a href="leaves.html" class="stat-card" style="text-decoration: none; cursor: pointer; border-inline-start: 4px solid var(--danger);">
          <div class="stat-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>${t.leave_requests || (lang === "ar" ? "طلبات إجازة للموافقة" : "Leave Requests to Approve")}</span>
            <span>🏖️</span>
          </div>
          <div class="stat-value danger counter" data-target="${lmPendingLeavesCount}">${lmPendingLeavesCount}</div>
          <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px; font-weight: 600;">
            ${lang === "ar" ? "مراجعة واعتماد الإجازات ←" : "Review & Approve Leaves →"}
          </div>
        </a>
      </div>

      <div class="dashboard-card" style="margin-bottom: 20px;">
        <h3 class="card-title" style="font-weight: 700; margin-bottom: 16px;">Line Hierarchy (DMs & Field Reps)</h3>
        <div class="table-container">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--gray-200);">
                <th style="padding: 10px;">${t.dm_name}</th>
                <th style="padding: 10px;">${t.reps_under_dm}</th>
                <th style="padding: 10px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                myDMs.length > 0
                  ? myDMs
                      .map((dm) => {
                        const repsForThisDM = myLineReps.filter(
                          (r) => r.managerId === dm.id,
                        );
                        return `
                          <tr>
                            <td style="padding: 10px; font-weight: 700;">
                              ${dm.name}
                              <div style="font-size: 0.75rem; color: var(--gray-500);">${dm.employeeCode || dm.code || "DM-001"}</div>
                            </td>
                            <td style="padding: 10px;">
                              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span class="badge bg-primary-subtle text-primary" style="font-size: 0.82rem; padding: 4px 10px; border-radius: 8px; font-weight: 600;">
                                  👥 ${repsForThisDM.length} ${repsForThisDM.length === 1 ? (lang === "ar" ? "مندوب" : "Rep") : (lang === "ar" ? "مناديب" : "Reps")}
                                </span>
                                ${
                                  repsForThisDM.length > 0
                                    ? `
                                  <button type="button" class="btn-view-team" onclick="window.openDmTeamModal('${dm.id}')" title="${lang === "ar" ? "عرض أعضاء الفريق" : "View Team Members"}">
                                    <span>👁️</span>
                                    <span>${lang === "ar" ? "عرض الفريق" : "View Team"}</span>
                                  </button>
                                `
                                    : `<span style="font-size: 0.78rem; color: var(--gray-500); font-style: italic;">${lang === "ar" ? "لا يوجد مناديب مسندين" : "No reps assigned"}</span>`
                                }
                              </div>
                            </td>
                            <td style="padding: 10px;">
                              <span class="badge bg-success-subtle text-success" style="padding: 3px 8px; border-radius: 6px;">${lang === "ar" ? "نشط" : "Active"}</span>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
                  : `<tr><td colspan="3" style="text-align:center; padding:15px; color:var(--gray-500);">No DMs assigned under this Line Manager yet.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>

      ${(() => {
        const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
        const myUserLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
        const rawLines = myUserLines.length > 0 ? myUserLines : allLines.filter(l => l.lineManagerId === user.id);
        const linesToShow = rawLines.filter(l => activeLmLine === "all" || l.id === activeLmLine);
        if (linesToShow.length === 0) return "";
        const isAr = lang === "ar";
        const currentYear = new Date().getFullYear().toString();
        const allSales = getDashboardSalesData();

        return `
      <div class="dashboard-card" style="margin-top: 20px; border-radius: 12px; padding: 20px;">
        <div style="margin-bottom: 1.25rem;">
          <h3 class="card-title" style="margin: 0; font-weight: 700; font-size: 1.15rem;">
            📈 ${isAr ? "منحنى ومستهدف المبيعات لكل خط مستقل" : "Monthly Sales & Target Trend (Per Line)"}
          </h3>
          <small style="color: var(--gray-500); font-size: 0.82rem;">
            ${isAr ? "كل خط إنتاج له تارجت ومبيعات ونسبة تحقيق مستقلة تماماً" : "Each product line has independent target, sales, and achievement %"}
          </small>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          ${linesToShow.map(line => {
            const lSales = allSales.filter(s => s.lineId === line.id && s.month && s.month.startsWith(currentYear));
            const lActual = lSales.reduce((sum, s) => sum + (parseFloat(s.actual) || parseFloat(s.amount) || 0), 0);
            const lTarget = lSales.reduce((sum, s) => sum + (parseFloat(s.target) || 0), 0);
            const lAch = lTarget > 0 ? Math.round((lActual / lTarget) * 100) : (lActual > 0 ? 100 : 0);
            const badgeColor = lAch >= 100 ? "#10b981" : lAch >= 80 ? "#3b82f6" : "#c2410c";

            return `
          <div style="background: var(--surface-hover, #f8fafc); border-radius: 10px; padding: 16px; border: 1px solid var(--border-color, #e2e8f0);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
              <h4 style="margin: 0; font-weight: 700; font-size: 0.95rem; color: var(--gray-800);">
                📦 ${line.name}
              </h4>
              <span style="background: rgba(0,0,0,0.05); color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 3px 8px; border-radius: 8px; font-weight: 800; font-size: 0.78rem;">
                ${isAr ? "تحقيق:" : "Ach:"} ${lAch}% (${lActual.toLocaleString()} / ${lTarget.toLocaleString()} EGP)
              </span>
            </div>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="dashLineTrend_${line.id}"></canvas>
            </div>
          </div>
          `;
          }).join("")}
        </div>
      </div>`;
      })()}
    </div>
  `;
}

/**
 * Renders the Business Unit Head (BU) Dashboard.
 */
function renderBUDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const myUserLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
  const myLineIds = myUserLines.map((l) => l.id);

  const myLMs = allUsers.filter(
    (u) =>
      u.managerId === user.id && (u.role === "line_manager" || u.role === "lm"),
  );

  const lines = allLines.filter(
    (l) =>
      myLineIds.includes(l.id) ||
      myLMs.some((lm) => lm.id === l.lineManagerId || (lm.lineIds && lm.lineIds.includes(l.id)))
  );

  const allDownstream = window.getAllSubordinates
    ? window.getAllSubordinates(user.id)
    : [];
  const myDMs = allDownstream.filter(
    (u) => u.role === "district_manager" || u.role === "dm",
  );
  const myReps = allDownstream.filter(
    (u) => u.role === "medical_rep" || u.role === "rep",
  );

  const buLines = myUserLines.length > 0 ? myUserLines : lines;
  const lineNames = buLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");
  const activeBuLine = window.buActiveLineFilter || "all";

  const filteredLines =
    activeBuLine === "all" ? lines : lines.filter((l) => l.id === activeBuLine);

  const displayLMs =
    activeBuLine === "all"
      ? myLMs
      : myLMs.filter((lm) => {
          const lmLineIds = lm.lineIds || (lm.lineId ? [lm.lineId] : []);
          const managesLine = lines.some(
            (l) =>
              l.id === activeBuLine &&
              (l.lineManagerId === lm.id || lmLineIds.includes(activeBuLine)),
          );
          return lmLineIds.includes(activeBuLine) || managesLine;
        });

  const displayDMs =
    activeBuLine === "all"
      ? myDMs
      : myDMs.filter((dm) =>
          (dm.lineIds || (dm.lineId ? [dm.lineId] : [])).includes(activeBuLine),
        );

  const displayReps =
    activeBuLine === "all"
      ? myReps
      : myReps.filter((r) =>
          (r.lineIds || (r.lineId ? [r.lineId] : [])).includes(activeBuLine),
        );

  return `
    <div class="flex-col">
      <div class="welcome-banner bu">
        <h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "رئيس وحدة الأعمال" : "Business Unit Head"} ${userName}!</h2>
        <div class="welcome-subtitle">${lineNames || (lang === "ar" ? "إدارة وحدة الأعمال" : "Business Unit Management")}</div>
      </div>

      ${
        lines.length > 1
          ? `
        <div class="dashboard-line-filter">
          <span class="line-filter-label">🏷️ ${lang === "ar" ? "تصفية بالخط:" : "Filter by Line:"}</span>
          <button type="button" class="line-filter-btn ${activeBuLine === "all" ? "active" : ""}" onclick="window.switchBuLineFilter('all')">
            ${lang === "ar" ? `جميع الخطوط (${lines.length})` : `All Lines (${lines.length})`}
          </button>
          ${lines
            .map(
              (l) => `
            <button type="button" class="line-filter-btn ${activeBuLine === l.id ? "active" : ""}" onclick="window.switchBuLineFilter('${l.id}')">
              ${lang === "ar" ? (l.nameAr || l.name) : l.name}
            </button>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">${t.total_lines}</div>
          <div class="stat-value primary counter" data-target="${filteredLines.length}">${filteredLines.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_lms}</div>
          <div class="stat-value success counter" data-target="${displayLMs.length}">${displayLMs.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_bu_dms}</div>
          <div class="stat-value warning counter" data-target="${displayDMs.length}">${displayDMs.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_bu_reps}</div>
          <div class="stat-value purple counter" data-target="${displayReps.length}">${displayReps.length}</div>
        </div>
      </div>

      <div class="grid-2-col">
        <div class="dashboard-card">
          <h3 class="card-title">Product Lines & Assigned Leadership</h3>
          <div class="table-container">
            <table class="data-table bu-leadership-table">
              <thead>
                <tr>
                  <th>${t.line_name}</th>
                  <th>${t.assigned_lm}</th>
                  <th>Field Force</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filteredLines.length > 0
                    ? filteredLines
                        .flatMap((line) => {
                          const assignedLM =
                            allUsers.find((u) => u.id === line.lineManagerId && (u.role === "line_manager" || u.role === "lm")) ||
                            myLMs.find((lm) => lm.lineId === line.id) ||
                            null;

                          const otherLMs = myLMs.filter((lm) => {
                            if (assignedLM && lm.id === assignedLM.id) return false;
                            if (lm.lineId === line.id) return true;
                            const lmLineIds = lm.lineIds || [];
                            if (!lmLineIds.includes(line.id)) return false;
                            return allUsers.some(
                              (u) =>
                                u.managerId === lm.id &&
                                (u.role === "district_manager" || u.role === "dm") &&
                                (u.lineIds || [u.lineId]).includes(line.id),
                            );
                          });

                          const lineManagers = assignedLM ? [assignedLM, ...otherLMs] : (otherLMs.length > 0 ? otherLMs : [null]);

                          return lineManagers.map((lm) => {
                            let dmsCount = 0;
                            let repsCount = 0;

                            if (lm) {
                              const lineDMs = allUsers.filter((u) => {
                                if (u.role !== "district_manager" && u.role !== "dm") return false;
                                const userLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
                                const inLine = userLineIds.length > 0 ? userLineIds.includes(line.id) : true;
                                return u.managerId === lm.id && inLine;
                              });
                              const lineDmIds = lineDMs.map((d) => d.id);
                              const lineReps = allUsers.filter((u) => {
                                if (u.role !== "medical_rep" && u.role !== "rep") return false;
                                const userLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
                                const inLine = userLineIds.length > 0 ? userLineIds.includes(line.id) : true;
                                return lineDmIds.includes(u.managerId) && inLine;
                              });
                              dmsCount = lineDMs.length;
                              repsCount = lineReps.length;
                            }

                            return `
                              <tr>
                                <td>
                                  <strong>${lang === "ar" ? (line.nameAr || line.name) : line.name}</strong>
                                  <div class="bu-line-subtext">${(line.products || []).length} ${lang === "ar" ? "منتجات نشطة" : "Products Active"}</div>
                                </td>
                                <td>
                                  ${
                                    lm
                                      ? `
                                    <strong>${lm.name}</strong>
                                    ${lm.email ? `<div class="bu-line-subtext">${lm.email}</div>` : ""}
                                  `
                                      : `<em class="text-muted">${lang === "ar" ? "غير معين" : "Unassigned"}</em>`
                                  }
                                </td>
                                <td>
                                  <div class="field-force-badges">
                                    <span class="badge bg-primary-subtle text-primary badge-dm-count">${dmsCount} ${dmsCount === 1 ? (lang === "ar" ? "مدير منطقة" : "DM") : (lang === "ar" ? "مديري مناطق" : "DMs")}</span>
                                    <span class="badge bg-success-subtle text-success badge-rep-count">${repsCount} ${repsCount === 1 ? (lang === "ar" ? "مندوب" : "Rep") : (lang === "ar" ? "مناديب" : "Reps")}</span>
                                  </div>
                                </td>
                              </tr>
                            `;
                          });
                        })
                        .join("") +
                      (activeBuLine === "all"
                        ? (() => {
                            const unassignedLMs = myLMs.filter((lm) => {
                              const lmLineIds = lm.lineIds || (lm.lineId ? [lm.lineId] : []);
                              const managesAnyLine = lines.some((l) => l.lineManagerId === lm.id || (l.id && lmLineIds.includes(l.id)));
                              return lmLineIds.length === 0 && !managesAnyLine;
                            });
                            return unassignedLMs.length > 0
                              ? unassignedLMs
                                  .map(
                                    (lm) => `
                                <tr class="bu-unassigned-row">
                                  <td>
                                    <em class="text-muted">${lang === "ar" ? "خط غير محدد" : "Unassigned Line"}</em>
                                  </td>
                                  <td>
                                    <strong>${lm.name}</strong>
                                    ${lm.email ? `<div class="bu-line-subtext">${lm.email}</div>` : ""}
                                  </td>
                                  <td>
                                    <span class="badge bg-secondary-subtle text-secondary">${lang === "ar" ? "بدون خط مسند" : "No Line Assigned"}</span>
                                  </td>
                                </tr>
                              `,
                                  )
                                  .join("")
                              : "";
                          })()
                        : "")
                    : `<tr><td colspan="3" class="text-center text-muted py-3">No product lines recorded.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="dashboard-card">
          <h3 class="card-title">${t.quick_actions}</h3>
          <div class="quick-actions-grid">
            <a href="reports.html" class="quick-action-link primary">📊 BU Sales & Target</a>
            <a href="visits.html" class="quick-action-link success">📍 Territory Visits</a>
            <a href="leaves.html" class="quick-action-link warning">🏖️ Approvals Inbox</a>
            <a href="calendar.html" class="quick-action-link neutral">📅 Team Calendar</a>
          </div>
        </div>
      </div>

      ${(() => {
        const allLinesLocal = (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
        const buUserLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
        const rawLines = buUserLines.length > 0 ? buUserLines : allLinesLocal;
        const linesToShow = rawLines.filter((l) => activeBuLine === "all" || l.id === activeBuLine);
        if (linesToShow.length === 0) return "";
        const isAr = lang === "ar";
        const currentYear = new Date().getFullYear().toString();
        const allSales = getDashboardSalesData();

        return `
      <div class="dashboard-card" style="margin-top: 20px; border-radius: 12px; padding: 20px;">
        <div style="margin-bottom: 1.25rem;">
          <h3 class="card-title" style="margin: 0; font-weight: 700; font-size: 1.15rem;">
            📈 ${isAr ? "منحنى ومستهدف المبيعات لكل خط في وحدة الأعمال" : "Monthly Sales & Target Trend (Per Line)"}
          </h3>
          <small style="color: var(--gray-500); font-size: 0.82rem;">
            ${isAr ? "مقارنة المبيعات الفعلية بالمستهدف لكل خط إنتاج مستقل في وحدة الأعمال" : "Actual vs Target comparison for each independent product line under your business unit"}
          </small>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          ${linesToShow.map(line => {
            const lSales = allSales.filter(s => s.lineId === line.id && s.month && s.month.startsWith(currentYear));
            const lActual = lSales.reduce((sum, s) => sum + (parseFloat(s.actual) || parseFloat(s.amount) || 0), 0);
            const lTarget = lSales.reduce((sum, s) => sum + (parseFloat(s.target) || 0), 0);
            const lAch = lTarget > 0 ? Math.round((lActual / lTarget) * 100) : (lActual > 0 ? 100 : 0);
            const badgeColor = lAch >= 100 ? "#10b981" : lAch >= 80 ? "#3b82f6" : "#c2410c";

            return `
          <div style="background: var(--surface-hover, #f8fafc); border-radius: 10px; padding: 16px; border: 1px solid var(--border-color, #e2e8f0);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
              <h4 style="margin: 0; font-weight: 700; font-size: 0.95rem; color: var(--gray-800);">
                📦 ${line.name}
              </h4>
              <span style="background: rgba(0,0,0,0.05); color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 3px 8px; border-radius: 8px; font-weight: 800; font-size: 0.78rem;">
                ${isAr ? "تحقيق:" : "Ach:"} ${lAch}% (${lActual.toLocaleString()} / ${lTarget.toLocaleString()} EGP)
              </span>
            </div>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="dashLineTrend_${line.id}"></canvas>
            </div>
          </div>
          `;
          }).join("")}
        </div>
      </div>`;
      })()}
    </div>
  `;
}

/**
 * Renders the Admin Dashboard.
 */
function renderAdminDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const usersCount =
    window.DEMO_DATA && window.DEMO_DATA.users
      ? window.DEMO_DATA.users.length
      : 0;
  const areasCount =
    window.DEMO_DATA && window.DEMO_DATA.areas
      ? window.DEMO_DATA.areas.length
      : 0;
  const linesCount =
    window.DEMO_DATA && window.DEMO_DATA.productLines
      ? window.DEMO_DATA.productLines.length
      : 0;

  // Single Source of Truth for sales records
  const allSales = getDashboardSalesData();

  const _adminNow = new Date();
  const _adminTodayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) ||
    `${_adminNow.getFullYear()}-${String(_adminNow.getMonth() + 1).padStart(2, "0")}-${String(_adminNow.getDate()).padStart(2, "0")}`;
  const currentYearMonth = _adminTodayStr.slice(0, 7);
  const currentMonthSales = allSales.filter(
    (s) => s.month === currentYearMonth,
  );
  const effectiveAdminSales =
    currentMonthSales.length > 0 ? currentMonthSales : allSales;
  const totalAdminSales = effectiveAdminSales.reduce(
    (sum, s) => sum + (parseFloat(s.actual) || parseFloat(s.amount) || 0),
    0,
  );
  const dataTargetAdminSales =
    totalAdminSales >= 1000
      ? Math.round(totalAdminSales / 1000)
      : totalAdminSales;
  const displayAdminSuffix = totalAdminSales >= 1000 ? "K" : "";

  return `
    <div class="flex-col">
      <div class="welcome-banner admin">
        <h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مسؤول النظام" : "System Administrator"} ${userName}!</h2>
        <div class="welcome-subtitle">${lang === "ar" ? "جميع خطوط الإنتاج والعمليات" : "All Product Lines & Operations"}</div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">${t.total_users}</div>
          <div class="stat-value primary counter" data-target="${usersCount}">${usersCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_areas}</div>
          <div class="stat-value success counter" data-target="${areasCount}">${areasCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.product_lines}</div>
          <div class="stat-value warning counter" data-target="${linesCount}">${linesCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.monthly_sales}</div>
          <div class="stat-value purple"><span class="counter" data-target="${dataTargetAdminSales}">${dataTargetAdminSales}</span>${displayAdminSuffix}</div>
        </div>
      </div>

      <div class="grid-2-col">
        <div class="dashboard-card">
          <h3 class="card-title">${t.quick_links}</h3>
          <div class="quick-actions-grid">
            <a href="users.html" class="quick-action-link primary">👥 ${t.manage_users}</a>
            <a href="reports.html" class="quick-action-link success">📈 ${t.upload_sales}</a>
            <a href="products.html" class="quick-action-link warning">📦 ${t.manage_products}</a>
            <a href="areas.html" class="quick-action-link danger">🗺️ ${t.manage_areas}</a>
          </div>
        </div>

        <div class="dashboard-card">
          <h3 class="card-title">${t.recent_activity}</h3>
          <ul class="activity-list">
            <li class="activity-item primary">System Admin initialized database synchronization.</li>
            <li class="activity-item success">Product Line "Cardio Line" verified with 4 products.</li>
            <li class="activity-item warning">Territory Area "Nasr City (CAI-N01)" assigned to rep1.</li>
          </ul>
        </div>
      </div>

      ${renderDashboardChartsMarkup(lang)}
    </div>
  `;
}

/**
 * Renders the HR Manager Dashboard.
 */
function renderHRDashboard(userName) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const allLeaves = (window.DEMO_DATA && window.DEMO_DATA.leaves) || [];
  let allAnnouncements =
    (window.DEMO_DATA && window.DEMO_DATA.announcements) || [];
  try {
    const savedAnn = localStorage.getItem("pharmaAnnouncements");
    if (savedAnn) {
      allAnnouncements = JSON.parse(savedAnn);
    }
  } catch (e) {}

  const totalEmployees = allUsers.length;
  const pendingLeavesCount = allLeaves.filter(
    (l) => l.status === "pending" || l.status === "pending_approval",
  ).length;
  const announcementsCount = allAnnouncements.length;
  const departments = new Set(
    allUsers.map((u) => u.department || u.role).filter(Boolean),
  );
  const departmentsCount = Math.max(1, departments.size);

  return `
    <div class="flex-col">
      <div class="welcome-banner hr" style="background: linear-gradient(135deg, #6f42c1, #593196); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, ${lang === "ar" ? "مدير الموارد البشرية" : "HR Manager"} ${userName}!</h2>
        <div class="welcome-subtitle" style="opacity: 0.9; margin-top: 4px; font-size: 0.875rem;">${lang === "ar" ? "الموارد البشرية وشؤون الموظفين" : "Human Resources & People Operations"}</div>
      </div>
      <div class="stat-grid">
        <a href="users.html" class="stat-card" style="text-decoration: none; color: inherit; cursor: pointer;"><div class="stat-label">${t.total_employees}</div><div class="stat-value primary counter" data-target="${totalEmployees}">${totalEmployees}</div></a>
        <a href="leaves.html#managerSection" class="stat-card" style="text-decoration: none; color: inherit; cursor: pointer;"><div class="stat-label">${t.pending_leaves}</div><div class="stat-value danger counter" data-target="${pendingLeavesCount}">${pendingLeavesCount}</div></a>
        <a href="announcements.html" class="stat-card" style="text-decoration: none; color: inherit; cursor: pointer;"><div class="stat-label">${t.published_announcements}</div><div class="stat-value success counter" data-target="${announcementsCount}">${announcementsCount}</div></a>
        <a href="users.html" class="stat-card" style="text-decoration: none; color: inherit; cursor: pointer;"><div class="stat-label">${t.departments}</div><div class="stat-value purple counter" data-target="${departmentsCount}">${departmentsCount}</div></a>
      </div>
    </div>
  `;
}

let targetVisitToCompleteId = null;
let isCurrentActionJoinDouble = false;

function attachDashboardModal() {
  if (document.getElementById("dashCompleteModal")) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;

  const modalHtml = `
    <div class="modal-overlay" id="dashCompleteModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 2500; align-items: center; justify-content: center; backdrop-filter: blur(3px);">
      <div class="modal-box" id="dashModalCard" style="width: 90%; max-width: 490px; max-height: 90vh; overflow-y: auto; padding: 24px; pointer-events: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--gray-200); padding-bottom: 12px;">
          <h4 id="dashModalTitle" style="margin: 0; font-weight: 700; font-size: 1.15rem;">${t.convert_to_actual}</h4>
          <button type="button" onclick="closeDashCompleteModal()" style="border: none; background: none; font-size: 1.5rem; cursor: pointer; color: var(--gray-500); line-height: 1;">&times;</button>
        </div>
        <form id="dashCompleteForm" onsubmit="handleDashCompleteSubmit(event)">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
            <div class="form-group">
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashDate">${lang === "ar" ? "يوم الزيارة" : "Visit Day"}</label>
              <input type="date" id="dashVisitDate" class="form-control" required style="width: 100%; padding: 8px 12px; border-radius: 8px;" onchange="updateDashModalDayDisplay()">
              <div id="dashModalDayDisplay" style="margin-top: 4px; font-size: 0.82rem; font-weight: 700; color: var(--primary);"></div>
            </div>
            <div class="form-group">
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashTime">${lang === "ar" ? "وقت الزيارة" : "Visit Time (HH:MM)"}</label>
              <input type="time" id="dashVisitTime" class="form-control" required style="width: 100%; padding: 8px 12px; border-radius: 8px;">
            </div>
          </div>
          <div id="dashInsertionMetaContainer" style="margin-bottom: 14px; background: rgba(13, 110, 253, 0.06); border: 1px solid rgba(13, 110, 253, 0.2); border-radius: 8px; padding: 8px 12px; font-size: 0.82rem; color: var(--text-color, var(--gray-700)); display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
            <div>
              <strong>${lang === "ar" ? "تاريخ الإدخال:" : "Insertion Date:"}</strong>
              <span id="dashInsertionDateDisplay" style="font-weight: 600; color: #0d6efd;">-</span>
            </div>
            <div>
              <strong>${lang === "ar" ? "وقت الإدخال:" : "Insertion Time:"}</strong>
              <span id="dashInsertionTimeDisplay" style="font-weight: 600; color: #0d6efd;">-</span>
            </div>
          </div>

          <div id="dashLockedDoubleBadge" style="display: none; margin-bottom: 14px; background: rgba(111,66,193,0.12); color: #6f42c1; border: 1px solid #6f42c1; padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; align-items: center; gap: 8px;">
            <span style="font-size: 1.1rem;">🤝</span>
            <span id="dashLockedDoubleText">Accompanied Double Visit</span>
          </div>

          <div class="form-group" id="dashVisitTypeContainer" style="margin-bottom: 14px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashType">${t.visit_type}</label>
            <div style="display: flex; gap: 16px; align-items: center; font-size: 0.88rem;">
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="dashVisitType" value="single" checked onchange="toggleDashDoubleVisit()">
                <span id="lblDashSingle">${t.single_visit}</span>
              </label>
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="dashVisitType" value="double" onchange="toggleDashDoubleVisit()">
                <span id="lblDashDouble">${t.double_visit}</span>
              </label>
            </div>
          </div>

          <div class="form-group" id="dashDoubleSection" style="display: none; margin-bottom: 14px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashAccompanied">${t.accompanied_by}</label>
            <div id="dashCompanionsContainer" style="display: flex; flex-wrap: wrap; gap: 8px;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashProducts">${t.products_discussed}</label>
            <div id="dashProdContainer" style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; max-height: 140px; overflow-y: auto; padding-right: 4px;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashFeedback">${t.visit_feedback}</label>
            <textarea id="dashVisitComment" class="form-control" rows="2" placeholder="Enter visit feedback..." style="width: 100%; padding: 8px 12px; border-radius: 8px;"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--gray-200); padding-top: 14px;">
            <button type="button" class="btn btn-secondary" onclick="closeDashCompleteModal()">${t.cancel}</button>
            <button type="submit" class="btn btn-primary" id="btnDashSubmit">${t.confirm_actual_visit}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

window.toggleDashDoubleVisit = function () {
  const checked = document.querySelector('input[name="dashVisitType"]:checked');
  const section = document.getElementById("dashDoubleSection");
  if (section && checked) {
    section.style.display = checked.value === "double" ? "block" : "none";
  }
};

function populateDashCompanions(repId) {
  const container = document.getElementById("dashCompanionsContainer");
  if (!container) return;
  container.replaceChildren();

  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const managerRoles = ["district_manager", "line_manager", "business_unit"];
  let managers = [];

  if (repId) {
    let chain = [];
    if (typeof window.getManagerChain === "function") {
      chain = window.getManagerChain(repId);
    } else {
      let curr = users.find((u) => u.id === repId);
      while (curr && curr.managerId) {
        curr = users.find((u) => u.id === curr.managerId);
        if (curr) chain.push(curr);
      }
    }
    managers = chain.filter(
      (u) => managerRoles.includes(u.role) && u.status !== "Inactive",
    );
  }

  if (managers.length === 0) {
    const fallbackRep = users.find((u) => u.id === "rep1");
    if (fallbackRep && typeof window.getManagerChain === "function") {
      managers = window
        .getManagerChain(fallbackRep.id)
        .filter(
          (u) => managerRoles.includes(u.role) && u.status !== "Inactive",
        );
    }
  }

  const roleTags = {
    district_manager: "DM",
    line_manager: "LM",
    business_unit: "BU",
  };

  managers.forEach((m) => {
    const tag = roleTags[m.role] || "Mgr";
    const val = `${m.name} (${tag})`;
    const lbl = document.createElement("label");
    lbl.className = "pill-item";
    lbl.style.cssText =
      "display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; border: 1px solid var(--gray-300); border-radius: 8px; font-size: 0.82rem;";
    lbl.innerHTML = `<input type="checkbox" name="dashDoubleCompanion" value="${val}"> ${val}`;
    container.appendChild(lbl);
  });
}

window.openCompletePlanModal = function (visitId, isJoinDouble = false) {
  targetVisitToCompleteId = visitId;
  isCurrentActionJoinDouble = !!isJoinDouble;

  const modal = document.getElementById("dashCompleteModal");
  if (!modal) return;

  const visits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const target = visits.find((v) => v.id === visitId);

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  const titleEl = document.getElementById("dashModalTitle");
  const typeContainer = document.getElementById("dashVisitTypeContainer");
  const lockedBadge = document.getElementById("dashLockedDoubleBadge");
  const lockedText = document.getElementById("dashLockedDoubleText");
  const doubleSection = document.getElementById("dashDoubleSection");

  if (isCurrentActionJoinDouble) {
    const rep = users.find((u) => u.id === (target && target.repId));
    const repName = rep
      ? lang === "ar"
        ? rep.nameAr || rep.name
        : rep.name
      : "Medical Rep";
    if (titleEl) titleEl.innerText = `🤝 ${t.join_double_visit} - ${repName}`;
    if (typeContainer) typeContainer.style.display = "none";
    if (lockedBadge) lockedBadge.style.display = "flex";
    if (lockedText) {
      lockedText.innerText =
        lang === "ar"
          ? `نزول مرافق (Double Visit) مع المندوب: ${repName}`
          : `Double Visit with Rep: ${repName}`;
    }
    if (doubleSection) doubleSection.style.display = "none";
  } else {
    if (titleEl) titleEl.innerText = t.convert_to_actual;
    if (typeContainer) typeContainer.style.display = "block";
    if (lockedBadge) lockedBadge.style.display = "none";

    const isDouble = target && target.visitType === "double";
    const singleRadio = document.querySelector(
      'input[name="dashVisitType"][value="single"]',
    );
    const doubleRadio = document.querySelector(
      'input[name="dashVisitType"][value="double"]',
    );
    if (isDouble && doubleRadio) {
      doubleRadio.checked = true;
    } else if (singleRadio) {
      singleRadio.checked = true;
    }

    const activeRepId =
      (target && target.repId) ||
      (window.checkAuth && window.checkAuth() ? window.checkAuth().id : null) ||
      "rep1";
    populateDashCompanions(activeRepId);
    toggleDashDoubleVisit();

    if (target && target.doubleWithUserName) {
      document
        .querySelectorAll('input[name="dashDoubleCompanion"]')
        .forEach((cb) => {
          if (target.doubleWithUserName.includes(cb.value)) cb.checked = true;
        });
    }
  }

  const lblTime = document.getElementById("lblDashTime");
  if (lblTime) lblTime.innerText = t.visit_time;
  const lblType = document.getElementById("lblDashType");
  if (lblType) lblType.innerText = t.visit_type;
  const lblSingle = document.getElementById("lblDashSingle");
  if (lblSingle) lblSingle.innerText = t.single_visit;
  const lblDouble =
    document.getElementById("lblDashDouble") ||
    document.getElementById("lblDouble");
  if (lblDouble) lblDouble.innerText = t.double_visit;
  const lblAccompanied = document.getElementById("lblDashAccompanied");
  if (lblAccompanied) lblAccompanied.innerText = t.accompanied_by;
  const lblProducts = document.getElementById("lblDashProducts");
  if (lblProducts) lblProducts.innerText = t.products_discussed;
  const lblFeedback = document.getElementById("lblDashFeedback");
  if (lblFeedback) lblFeedback.innerText = t.visit_feedback;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoISO = `${twoDaysAgo.getFullYear()}-${pad(twoDaysAgo.getMonth() + 1)}-${pad(twoDaysAgo.getDate())}`;

  const minAllowedBacklog = (typeof window.getVisitBacklogMinDateStr === "function")
    ? window.getVisitBacklogMinDateStr()
    : twoDaysAgoISO;

  const dateInput = document.getElementById("dashVisitDate");
  if (dateInput) {
    dateInput.max = todayISO;
    dateInput.min = minAllowedBacklog;
    if (target && target.date && target.date >= minAllowedBacklog && target.date <= todayISO) {
      dateInput.value = target.date;
    } else {
      dateInput.value = todayISO;
    }
    updateDashModalDayDisplay();
  }
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  document.getElementById("dashVisitTime").value = timeStr;

  const dashInsDateEl = document.getElementById("dashInsertionDateDisplay");
  const dashInsTimeEl = document.getElementById("dashInsertionTimeDisplay");
  if (dashInsDateEl) dashInsDateEl.innerText = `${todayISO} (${lang === "ar" ? "تلقائي الآن" : "Auto on Complete"})`;
  if (dashInsTimeEl) dashInsTimeEl.innerText = `${timeStr} (${lang === "ar" ? "تلقائي الآن" : "Auto on Complete"})`;

  const lblDate = document.getElementById("lblDashDate");
  if (lblDate) lblDate.innerText = t.visit_day || (lang === "ar" ? "يوم الزيارة" : "Visit Day");

  document.getElementById("dashVisitComment").value =
    (target && target.comment) || "";
  const giveawayInput = document.getElementById("dashVisitGiveawaySamples");
  if (giveawayInput) {
    giveawayInput.value = (target && target.giveawaySamples) || "";
  }

  const container = document.getElementById("dashProdContainer");
  if (container) {
    container.replaceChildren();
    const effectiveRepId = (target && target.repId) || (user && user.id);
    const repLines = (effectiveRepId && typeof window.getUserLines === "function")
      ? window.getUserLines(effectiveRepId)
      : [];
    const repLineIds = repLines.map((l) => l.id);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

    let linesToShow = allLines;
    if (repLines.length > 0) {
      linesToShow = allLines.filter((l) => repLineIds.includes(l.id));
    }
    let productsToShow = [];
    linesToShow.forEach((line) => {
      if (line.products) productsToShow.push(...line.products);
    });

    if (productsToShow.length === 0) {
      container.innerHTML =
        '<span style="color: var(--gray-500);">No products available.</span>';
    } else {
      const selectedProds = (target && (target.productIds && target.productIds.length ? target.productIds : target.products)) || [];
      productsToShow.forEach((prod) => {
        const displayName =
          prod.dosage &&
          !prod.name.toLowerCase().includes(prod.dosage.toLowerCase())
            ? `${prod.name} ${prod.dosage}`
            : prod.name;
        const isChecked =
          selectedProds.includes(prod.id) ||
          selectedProds.includes(displayName) ||
          selectedProds.includes(prod.name);
        const lbl = document.createElement("label");
        lbl.className = "pill-item";
        lbl.style.cssText =
          "display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 8px; border-radius: 6px; font-size: 0.82rem;";
        lbl.innerHTML = `<input type="checkbox" name="dashProd" value="${prod.id}" data-name="${displayName}" ${isChecked ? "checked" : ""}> ${displayName}`;
        container.appendChild(lbl);
      });
    }
  }

  modal.style.display = "flex";
  modal.classList.add("active");
};

function updateDashModalDayDisplay() {
  const dateInput = document.getElementById("dashVisitDate");
  const displayEl = document.getElementById("dashModalDayDisplay");
  if (!dateInput || !displayEl) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "ar";
  const dt =
    typeof window.formatVisitDateTime === "function"
      ? window.formatVisitDateTime(dateInput.value, null, lang)
      : { dayName: "" };
  displayEl.textContent = dt.dayName ? `📅 ${dt.dayName}` : "";
}

window.updateDashModalDayDisplay = updateDashModalDayDisplay;

window.closeDashCompleteModal = function () {
  const modal = document.getElementById("dashCompleteModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
  const submitBtn = document.getElementById("btnDashSubmit");
  if (submitBtn) {
    submitBtn.disabled = false;
    if (submitBtn.dataset.originalText) submitBtn.innerText = submitBtn.dataset.originalText;
  }
  targetVisitToCompleteId = null;
  isCurrentActionJoinDouble = false;
};

window.handleDashCompleteSubmit = function (e) {
  e.preventDefault();
  if (!targetVisitToCompleteId) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const submitBtn = document.getElementById("btnDashSubmit");
  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.innerText;
    submitBtn.innerText = lang === "ar" ? "جاري الحفظ... ⏳" : "Saving... ⏳";
  }

  const resetSubmitBtn = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.dataset.originalText) submitBtn.innerText = submitBtn.dataset.originalText;
    }
  };

  const dateInput = document.getElementById("dashVisitDate");
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dateVal = dateInput && dateInput.value ? dateInput.value : todayISO;
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoISO = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(twoDaysAgo.getDate()).padStart(2, "0")}`;

  const minAllowedBacklog = (typeof window.getVisitBacklogMinDateStr === "function")
    ? window.getVisitBacklogMinDateStr()
    : twoDaysAgoISO;
  const limitDays = (typeof window.getVisitBacklogLimitDays === "function")
    ? window.getVisitBacklogLimitDays()
    : 2;

  if (dateVal > todayISO) {
    resetSubmitBtn();
    const msg = lang === "ar"
      ? "لا يمكن تسجيل زيارة فعلية في تاريخ مستقبلي."
      : "Cannot log an actual visit in a future date.";
    if (typeof showToast === "function") showToast(msg, "warning");
    else alert(msg);
    return;
  }
  if (dateVal < minAllowedBacklog) {
    resetSubmitBtn();
    const msg = lang === "ar"
      ? (limitDays === 0
          ? "وفقاً لسياسة الشركة، يجب تسجيل الزيارات الفعلية في نفس اليوم فقط."
          : `وفقاً لسياسة الشركة، لا يمكن تسجيل زيارة فعلية بعد مرور أكثر من ${limitDays} ${limitDays === 1 ? "يوم" : limitDays === 2 ? "يومين" : "أيام"} على تاريخها.`)
      : (limitDays === 0
          ? "Company policy requires same-day visit logging only."
          : `Company policy does not allow logging visits older than ${limitDays} day(s).`);
    if (typeof showToast === "function") showToast(msg, "warning");
    else alert(msg);
    return;
  }
  const timeVal =
    document.getElementById("dashVisitTime").value ||
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const commentVal = document.getElementById("dashVisitComment").value;
  const giveawayVal = (document.getElementById("dashVisitGiveawaySamples")?.value || "").trim();
  const checkedProductInputs = Array.from(
    document.querySelectorAll('input[name="dashProd"]:checked'),
  );
  const selectedProductIds = checkedProductInputs.map((c) => c.value);
  const selectedProductNames = checkedProductInputs.map((c) => c.dataset.name || c.value);

  let visitType = "single";
  let doubleWithUserName = "";
  let doubleWithUserId = null;

  if (isCurrentActionJoinDouble) {
    visitType = "double";
    const authUser =
      (window.checkAuth && window.checkAuth()) ||
      (window.DEMO_DATA && window.DEMO_DATA.currentUser) ||
      {};
    const dmName = authUser.name || "District Manager";
    doubleWithUserName = `${dmName} (DM)`;
    doubleWithUserId = authUser.id;
  } else {
    const typeChecked = document.querySelector(
      'input[name="dashVisitType"]:checked',
    );
    visitType = typeChecked ? typeChecked.value : "single";
    if (visitType === "double") {
      const companions = Array.from(
        document.querySelectorAll('input[name="dashDoubleCompanion"]:checked'),
      ).map((c) => c.value);
      if (companions.length === 0) {
        resetSubmitBtn();
        const msg = lang === "ar"
          ? "يرجى تحديد المرافق في الزيارة المزدوجة."
          : "Please select at least one companion for the double visit.";
        if (typeof showToast === "function") showToast(msg, "warning");
        else alert(msg);
        return;
      }
      doubleWithUserName = companions.join(", ");
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const matchedMgr = allUsers.find((u) =>
        companions.some((compStr) => compStr.includes(u.name)),
      );
      if (matchedMgr) doubleWithUserId = matchedMgr.id;
    }
  }

  const visits =
    window.DEMO_DATA && window.DEMO_DATA.visits ? window.DEMO_DATA.visits : [];
  const target = visits.find((v) => v.id === targetVisitToCompleteId);
  if (!target) {
    resetSubmitBtn();
    return;
  }

  const authUser =
    (window.checkAuth && window.checkAuth()) ||
    (window.DEMO_DATA && window.DEMO_DATA.currentUser) ||
    {};
  const targetRepId = target.repId || authUser.id || "rep1";

  // SFE Audit Check: Validate public holiday and leave
  if (typeof window.checkVisitDateAllowed === "function") {
    const dateCheck = window.checkVisitDateAllowed(dateVal, targetRepId, lang);
    if (!dateCheck.allowed) {
      resetSubmitBtn();
      if (typeof showToast === "function") showToast(dateCheck.message, "warning");
      else alert(dateCheck.message);
      return;
    }
  }

  // SFE Audit Check: Validate minimum 10-minute buffer and no overlapping visits
  if (typeof window.checkVisitTimeConflict === "function") {
    const timeConflict = window.checkVisitTimeConflict(targetRepId, dateVal, timeVal, target.id);
    if (timeConflict.hasConflict) {
      resetSubmitBtn();
      const conflictingTarget = timeConflict.conflictingVisit.doctorName || timeConflict.conflictingVisit.doctorId || "";
      const conflictingTime = timeConflict.conflictingVisit.time || timeVal;
      const msg = timeConflict.exactMatch
        ? (lang === "ar"
            ? `⚠️ توجد زيارة مسجلة بالفعل في نفس هذا التوقيت تماماً (${conflictingTime}) لـ (${conflictingTarget}).`
            : `⚠️ Another visit is already recorded at the exact same time (${conflictingTime}) for (${conflictingTarget}).`)
        : (lang === "ar"
            ? `⚠️ الفارق الزمني بين الزيارات يجب ألا يقل عن ${timeConflict.minRequired} دقائق عند تفعيل تسجيل الزيارات بالموقع (GPS). توجد زيارة أخرى في (${conflictingTime}) لـ (${conflictingTarget}).`
            : `⚠️ Minimum time between visits must be at least ${timeConflict.minRequired} minutes when location tracking is active. Another visit exists at (${conflictingTime}) for (${conflictingTarget}).`);
      if (typeof showToast === "function") showToast(msg, "warning");
      else alert(msg);
      return;
    }
  }

  if (target) {
    target.status = "completed";
    target.date = dateVal;
    target.time = timeVal;
    const nowStamp = new Date();
    target.insertionDate = nowStamp.toISOString().slice(0, 10);
    target.insertionTime = `${String(nowStamp.getHours()).padStart(2, "0")}:${String(nowStamp.getMinutes()).padStart(2, "0")}`;
    target.completedAt = nowStamp.toISOString();
    if (!target.createdAt) target.createdAt = nowStamp.toISOString();
    target.entryDate = target.insertionDate;
    target.comment = commentVal;
    target.giveawaySamples = giveawayVal;
    target.productIds = selectedProductIds;
    target.products = selectedProductNames;
    target.visitType = visitType;
    target.doubleWithUserName = doubleWithUserName;
    if (doubleWithUserId) {
      target.doubleWithUserId = doubleWithUserId;
    } else if (visitType === "single") {
      delete target.doubleWithUserId;
    }
    target.source = "plan";

    if (window.saveDataToStorage) {
      window.saveDataToStorage();
    }
  }

  closeDashCompleteModal();
  renderDashboard();
  if (typeof showToast === "function") {
    showToast("Visit converted to actual successfully.", "success");
  }
};

function animateCounters() {
  document.querySelectorAll(".counter").forEach((counter) => {
    const target = parseFloat(counter.getAttribute("data-target")) || 0;
    counter.innerText = target;
  });
}

window.switchDemoUser = function (role) {
  const roleMap = {
    admin: "admin",
    bu: "business_unit",
    lm: "line_manager",
    dm: "district_manager",
    rep: "medical_rep",
    hr: "hr",
  };
  const targetRole = roleMap[role] || role;
  const user =
    window.DEMO_DATA && window.DEMO_DATA.users
      ? window.DEMO_DATA.users.find((u) => u.role === targetRole)
      : { role: targetRole, name: targetRole.toUpperCase() };

  if (user) {
    sessionStorage.removeItem("pharma_logged_out");
    sessionStorage.setItem("pharmaUser", JSON.stringify(user));
    localStorage.setItem("userRole", targetRole);
    localStorage.setItem("userId", user.id);
    window.location.reload();
  }
};

window.currentRepPlanTab = window.currentRepPlanTab || "auto";
window.currentRepPlanDate = window.currentRepPlanDate || null;

window.switchRepPlanTab = function (tab) {
  window.currentRepPlanTab = tab;
  window.currentRepPlanDate = null;
  renderDashboard();
};

window.switchRepPlanDate = function (dateStr) {
  if (dateStr) {
    window.currentRepPlanTab = "date";
    window.currentRepPlanDate = dateStr;
  } else {
    window.currentRepPlanTab = "today";
    window.currentRepPlanDate = null;
  }
  renderDashboard();
};

window.addEventListener("storage", (e) => {
  if (e.key === "pharma_master_data") {
    renderDashboard();
  }
});

document.addEventListener("pharma:storage:synced", () => {
  renderDashboard();
});

document.addEventListener("DOMContentLoaded", () => {
  const user =
    (window.requireAuth && window.requireAuth()) ||
    (window.checkAuth && window.checkAuth());
  if (!user) return;
  window.currentUser = user;
  if (window.initPage) window.initPage("home");
  renderDashboard();
});
