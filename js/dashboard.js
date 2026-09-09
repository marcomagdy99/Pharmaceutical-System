/**
 * @file dashboard.js
 * @description Comprehensive role-adaptive dashboard engine for PharmaCare.
 * Includes: Team planned visits visibility for DMs with 7-day auto-expiry & double visit linking, LM hierarchy, and dynamic KPIs.
 */

const esc = window.escapeHtml || ((s) => s || "");

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
    visit_time: "Visit Time (HH:MM)",
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
    visit_time: "وقت الزيارة (HH:MM)",
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
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    const planDate = new Date(dateStr);
    const now = new Date();
    return (now.getTime() - planDate.getTime()) / (1000 * 3600 * 24) > 7;
  }
  const planDate = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diffDays =
    (todayMidnight.getTime() - planDate.getTime()) / (1000 * 3600 * 24);
  return diffDays > 7;
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
      if (data && data[dmId]) return data[dmId];
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
  const now = new Date();
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

window.onDmRepDropdownChange = function (repId) {
  window.currentDmSelectedRepId = repId;
};

window.confirmDmAccompaniment = function () {
  const currentUser = (window.checkAuth && window.checkAuth()) || {
    id: "dm1",
    name: "Karim Nasser",
  };
  const dateInput = document.getElementById("dmAccompanimentDateInput");
  const repSelect = document.getElementById("dmAccompaniedRepSelect");
  const selectedDate = (dateInput && dateInput.value) || getDmSelectedDate();
  const repId =
    repSelect && repSelect.value
      ? repSelect.value
      : window.currentDmSelectedRepId || "";

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  if (!repId) {
    if (typeof window.showToast === "function") {
      window.showToast(
        lang === "ar"
          ? "يرجى اختيار المندوب أولاً أو تحديد يوم عمل مكتبي"
          : "Please select a representative or choose Office Day first",
        "warning",
      );
    }
    return;
  }

  window.currentDmSelectedDate = selectedDate;
  window.currentDmConfirmedDate = selectedDate;
  window.currentDmConfirmedRepId = repId;
  window.currentDmSelectedRepId = repId;

  try {
    localStorage.setItem("pharma_dm_selected_date", selectedDate);
  } catch (e) {}

  setDmAccompaniment(currentUser.id, selectedDate, repId);

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const rep = allUsers.find((u) => u.id === repId);

  if (typeof window.showToast === "function") {
    if (rep) {
      window.showToast(
        lang === "ar"
          ? `تم تأكيد النزول الميداني مع ${rep.name} لتاريخ ${selectedDate}`
          : `Field accompaniment confirmed with ${rep.name} for ${selectedDate}`,
        "success",
      );
    } else {
      window.showToast(
        lang === "ar"
          ? `تم تأكيد تاريخ ${selectedDate} كيوم عمل مكتبي`
          : `Date ${selectedDate} confirmed as Office Work day`,
        "info",
      );
    }
  }

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

window.onDmSelectRep = window.onDmRepDropdownChange;

function renderDashboard() {
  const container = document.getElementById("pageContent");
  if (!container) return;

  const user = (window.checkAuth && window.checkAuth()) || {
    role: "admin",
    name: "System Admin",
  };
  const role = (user.role || "admin").toLowerCase();
  const userName = user.name || "User";

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
}

/**
 * Renders the Representative Dashboard.
 */
function renderRepDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const currentUserId = user?.id || "rep1";

  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
  const allDoctors = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
  
  // Single Source of Truth for sales records
  const allSales =
    (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
      ? window.DEMO_DATA.sales
      : (window.REPORTS_DATA && window.REPORTS_DATA.sales) || [];

  const repDoctors = allDoctors.filter(
    (d) => !d.repId || d.repId === currentUserId || d.repId === "rep1",
  );
  const totalDoctorsCount = repDoctors.length;

  const activePlanned = allVisits.filter(
    (v) =>
      (v.repId === currentUserId || v.repId === "rep1") &&
      v.status === "planned" &&
      !isPlannedVisitExpired(v.date),
  );
  const plannedAM = activePlanned.filter(
    (v) => v.period === "am" || v.period === "AM" || v.type === "hospital",
  );
  const plannedPM = activePlanned.filter(
    (v) =>
      v.period === "pm" || v.period === "PM" || v.type === "doctor" || !v.type,
  );

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const completedVisits = allVisits.filter(
    (v) =>
      (v.repId === currentUserId || v.repId === "rep1") &&
      v.status === "completed" &&
      v.date &&
      v.date.startsWith(currentYearMonth),
  );

  const monthlyVisitTarget = Math.max(
    1,
    Math.round(
      repDoctors.reduce((sum, d) => {
        if (d.class === "A") return sum + 4 / 3;
        if (d.class === "B") return sum + 1;
        return sum + 1;
      }, 0),
    ),
  );

  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentQuarterNum = Math.floor(currentMonthNum / 3) + 1;
  const quarterStartMonth = (currentQuarterNum - 1) * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  const quarterLabel = `Q${currentQuarterNum}`;

  const currentQuarterCompletedVisits = allVisits.filter((v) => {
    if (
      !(
        (v.repId === currentUserId || v.repId === "rep1") &&
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

  const coveredDoctorIds = new Set();
  currentQuarterCompletedVisits.forEach((v) => {
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

  const currentYear = new Date().toISOString().slice(0, 4);
  const repYTDSales = allSales.filter(
    (s) =>
      (s.repId === currentUserId || s.repId === "rep1") &&
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

  return `
    <div class="flex-col">
      <div class="welcome-banner rep" style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, ${userName}!</h2>
        <div class="welcome-subtitle" style="opacity: 0.9; margin-top: 4px;">${lang === "ar" ? "لوحة تحكم المندوب الطبي والمتابعة الميدانية" : "Medical Representative Field & Activity Overview"}</div>
      </div>

        <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
          <div class="stat-card">
            <div class="stat-label">${t.total_doctors}</div>
            <div class="stat-value primary counter" data-target="${totalDoctorsCount}">${totalDoctorsCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${t.visits_month}</div>
            <div class="stat-value success">
              <span class="counter" data-target="${completedVisits.length}">${completedVisits.length}</span>
              <span style="font-size: 0.9rem; color: var(--gray-500); font-weight: 600;"> / ${monthlyVisitTarget}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">${lang === "ar" ? `نسبة التغطية (${quarterLabel})` : `Overall Coverage (${quarterLabel})`}</div>
            <div class="stat-value success">
              <span class="counter" data-target="${overallCoveragePct}">${overallCoveragePct}</span>%
            </div>
            <div style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">
              ${coveredDoctorsCount} / ${totalDoctorsCount} ${lang === "ar" ? "أطباء" : "Doctors"}
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
            <div class="stat-value danger counter" data-target="${activePlanned.length}">${activePlanned.length}</div>
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
                        <strong class="planned-target-name">${esc(h.doctorName || h.targetName || "Hospital")}</strong>
                        <div class="planned-target-date"><span class="date-icon">📅</span> ${h.date}</div>
                      </div>
                      <button class="btn-convert-action" onclick="openCompletePlanModal('${h.id}', false)">
                        ✓ ${t.convert_to_actual}
                      </button>
                    </div>
                  `,
                        )
                        .join("")
                    : `<p style="color: var(--gray-400); margin: 0; font-style: italic; font-size: 0.85rem;">${t.no_planned_visits}</p>`
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
                        <strong class="planned-target-name">${esc(d.doctorName || d.targetName || "Doctor")}</strong>
                        <div class="planned-target-date"><span class="date-icon">📅</span> ${d.date}</div>
                      </div>
                      <button class="btn-convert-action" onclick="openCompletePlanModal('${d.id}', false)">
                        ✓ ${t.convert_to_actual}
                      </button>
                    </div>
                  `,
                        )
                        .join("")
                    : `<p style="color: var(--gray-400); margin: 0; font-style: italic; font-size: 0.85rem;">${t.no_planned_visits}</p>`
                }
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
                    <td style="padding: 10px; font-weight: 600;">${esc(v.doctorName || v.targetName)}</td>
                    <td style="padding: 10px; color: var(--gray-700);">
                      <div style="font-weight: 700; color: var(--primary); font-size: 0.82rem; white-space: nowrap;">${dt.dayName}</div>
                      <div style="font-weight: 600; font-size: 0.8rem; white-space: nowrap;">${v.date}</div>
                      <div style="font-size: 0.75rem; color: var(--gray-500); font-weight: 600; white-space: nowrap;">⏰ ${dt.time}</div>
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

  const myReps = allUsers.filter(
    (u) =>
      u.managerId === user.id && (u.role === "medical_rep" || u.role === "rep"),
  );
  const myRepIds = myReps.map((r) => r.id);

  const allLeaves = (window.DEMO_DATA && window.DEMO_DATA.leaves) || [];
  const pendingLeavesCount = allLeaves.filter(
    (l) =>
      myRepIds.includes(l.userId) &&
      (l.status === "pending" ||
        (l.approvals && l.approvals.dm && l.approvals.dm.status === "pending")),
  ).length;

  const pendingPlansCount = allVisits.filter(
    (v) => myRepIds.includes(v.repId) && v.status === "pending_approval",
  ).length;

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const monthlyTeamCompletedVisits = allVisits.filter(
    (v) =>
      myRepIds.includes(v.repId) &&
      v.status === "completed" &&
      v.date &&
      v.date.startsWith(currentYearMonth),
  ).length;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
  const scheduledDates = Object.keys(storedSchedule).sort();

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
      <div class="welcome-banner dm" style="background: linear-gradient(135deg, var(--success), #0f5132); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, District Manager ${userName}!</h2>
        <div class="welcome-subtitle" style="opacity: 0.9; margin-top: 4px;">${t.team_stats}</div>
      </div>

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

          <div class="dm-schedule-nav-btn" style="display: flex; align-items: center; gap: 8px;">
            <a href="plans-review.html" class="btn btn-sm btn-primary" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-weight: 700; border-radius: 8px; padding: 7px 16px; box-shadow: var(--shadow-sm);">
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
              <a href="plans-review.html" class="btn btn-primary btn-sm" style="text-decoration: none; font-weight: 700; padding: 6px 18px;">
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
                            const isHospital =
                              (sv.period || "").toUpperCase() === "AM";
                            const targetTypeBadge = isHospital
                              ? lang === "ar"
                                ? "مستشفى"
                                : "Hospital"
                              : lang === "ar"
                                ? "عيادة طبيب"
                                : "Clinic Visit";
                            const periodBadge = isHospital
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
                            <strong class="visit-doc-name">${esc(sv.doctorName || sv.targetName || "Doctor")}</strong>
                            ${periodBadge}
                          </div>
                          <div class="target-type-badge" style="font-size: 0.75rem; margin-top: 2px;">${targetTypeBadge}</div>
                        </td>
                        <td class="dm-covisit-products-col">
                          ${sv.products && sv.products.length ? `<span class="badge badge-product">💊 ${sv.products.join(", ")}</span>` : '<span class="text-muted">-</span>'}
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
              <a href="plans-review.html" class="btn btn-primary btn-sm" style="text-decoration: none; font-weight: 700; padding: 6px 18px;">
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
                              const isHospital =
                                (pv.period || "").toUpperCase() === "AM";
                              const targetTypeBadge = isHospital
                                ? lang === "ar"
                                  ? "مستشفى"
                                  : "Hospital"
                                : lang === "ar"
                                  ? "عيادة طبيب"
                                  : "Clinic Visit";
                              const periodBadge = isHospital
                                ? `<span class="badge" style="background: rgba(255, 193, 7, 0.2); color: #b45309; font-weight: 700; font-size: 0.72rem;">AM</span>`
                                : `<span class="badge" style="background: rgba(13, 110, 253, 0.15); color: #0d6efd; font-weight: 700; font-size: 0.72rem;">PM</span>`;

                              return `
                        <tr>
                          <td>
                            <strong class="visit-doc-name">${esc(pv.doctorName || pv.targetName || "Doctor")}</strong>
                            <div class="target-type-badge" style="font-size: 0.75rem;">${targetTypeBadge}</div>
                          </td>
                          <td>
                            ${periodBadge}
                          </td>
                          <td class="dm-covisit-products-col">
                            ${pv.products && pv.products.length ? `<span class="badge badge-product">💊 ${pv.products.join(", ")}</span>` : '<span class="text-muted">-</span>'}
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

                const salesStore =
                  (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
                    ? window.DEMO_DATA.sales
                    : (typeof REPORTS_DATA !== "undefined" && Array.isArray(REPORTS_DATA.sales))
                      ? REPORTS_DATA.sales
                      : [];

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
    </div>
  `;
}

/**
 * Renders the Line Manager (LM) Dashboard.
 */
function renderLMDashboard(userName, user) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = dashboardTranslations[lang] || dashboardTranslations.en;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  const myDMs = allUsers.filter(
    (u) =>
      u.managerId === user.id &&
      (u.role === "district_manager" || u.role === "dm"),
  );

  const dmIds = myDMs.map((d) => d.id);
  const myLineReps = allUsers.filter(
    (u) =>
      dmIds.includes(u.managerId) &&
      (u.role === "medical_rep" || u.role === "rep"),
  );
  const lineRepIds = myLineReps.map((r) => r.id);
  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  const currentYearMonth = new Date().toISOString().slice(0, 7);
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
      <div class="welcome-banner lm" style="background: linear-gradient(135deg, var(--warning), #995c00); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, Line Manager ${userName}!</h2>
        <div class="welcome-subtitle" style="opacity: 0.9; margin-top: 4px;">${t.line_overview}</div>
      </div>

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
                        const repNames =
                          repsForThisDM.map((r) => r.name).join(", ") ||
                          "No reps assigned";
                        return `
                          <tr>
                            <td style="padding: 10px; font-weight: 700;">
                              ${dm.name}
                              <div style="font-size: 0.75rem; color: var(--gray-500);">${dm.employeeCode || dm.code || "DM-001"}</div>
                            </td>
                            <td style="padding: 10px;">
                              <span style="font-weight: 600; color: var(--primary);">${repsForThisDM.length} Reps</span>
                              <div style="font-size: 0.78rem; color: var(--gray-600);">${repNames}</div>
                            </td>
                            <td style="padding: 10px;">
                              <span class="badge bg-success-subtle text-success" style="padding: 3px 8px; border-radius: 6px;">Active</span>
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
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

  const myLMs = allUsers.filter(
    (u) =>
      u.managerId === user.id && (u.role === "line_manager" || u.role === "lm"),
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

  return `
    <div class="flex-col">
      <div class="welcome-banner bu" style="background: linear-gradient(135deg, #6f42c1, #4b2a85); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, Business Unit Head ${userName}!</h2>
        <div class="welcome-subtitle" style="opacity: 0.9; margin-top: 4px;">${t.bu_overview}</div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">${t.total_lines}</div>
          <div class="stat-value primary counter" data-target="${lines.length}">${lines.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_lms}</div>
          <div class="stat-value success counter" data-target="${myLMs.length}">${myLMs.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_bu_dms}</div>
          <div class="stat-value warning counter" data-target="${myDMs.length}">${myDMs.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t.total_bu_reps}</div>
          <div class="stat-value purple counter" data-target="${myReps.length}">${myReps.length}</div>
        </div>
      </div>

      <div class="grid-2-col">
        <div class="dashboard-card">
          <h3 class="card-title" style="font-weight: 700; margin-bottom: 16px;">Product Lines & Assigned Leadership</h3>
          <div class="table-container">
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid var(--gray-200);">
                  <th style="padding: 10px;">${t.line_name}</th>
                  <th style="padding: 10px;">${t.assigned_lm}</th>
                  <th style="padding: 10px;">Field Force</th>
                </tr>
              </thead>
              <tbody>
                ${
                  lines.length > 0
                    ? lines
                        .map((line) => {
                          const assignedLM =
                            allUsers.find((u) => u.id === line.lineManagerId) ||
                            myLMs.find(
                              (lm) =>
                                lm.lineId === line.id ||
                                (lm.lineIds && lm.lineIds.includes(line.id)),
                            ) ||
                            myLMs[0];
                          const lineDMs = allUsers.filter(
                            (u) =>
                              (u.role === "district_manager" ||
                                u.role === "dm") &&
                              (u.lineId === line.id ||
                                (u.lineIds && u.lineIds.includes(line.id)) ||
                                (assignedLM && u.managerId === assignedLM.id)),
                          );
                          const lineDmIds = lineDMs.map((d) => d.id);
                          const lineReps = allUsers.filter(
                            (u) =>
                              (u.role === "medical_rep" || u.role === "rep") &&
                              (u.lineId === line.id ||
                                (u.lineIds && u.lineIds.includes(line.id)) ||
                                lineDmIds.includes(u.managerId)),
                          );
                          const dmsCount = lineDMs.length;
                          const repsCount = lineReps.length;
                          return `
                            <tr>
                              <td style="padding: 10px; font-weight: 700;">
                                ${line.name}
                                <div style="font-size: 0.75rem; color: var(--gray-500);">${(line.products || []).length} Products Active</div>
                              </td>
                              <td style="padding: 10px;">
                                <strong>${assignedLM ? assignedLM.name : "Unassigned"}</strong>
                                <div style="font-size: 0.75rem; color: var(--gray-500);">${assignedLM ? assignedLM.email : ""}</div>
                              </td>
                              <td style="padding: 10px;">
                                <span class="badge bg-primary-subtle text-primary" style="padding: 3px 8px; border-radius: 6px;">${dmsCount} DMs</span>
                                <span class="badge bg-success-subtle text-success" style="padding: 3px 8px; border-radius: 6px;">${repsCount} Reps</span>
                              </td>
                            </tr>
                          `;
                        })
                        .join("")
                    : `<tr><td colspan="3" style="text-align:center; padding:15px; color:var(--gray-500);">No product lines recorded.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="dashboard-card">
          <h3 class="card-title" style="font-weight: 700; margin-bottom: 16px;">${t.quick_actions}</h3>
          <div class="quick-actions-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <a href="reports.html" class="action-btn primary" style="text-decoration: none; text-align: center; padding: 14px; border-radius: 8px; background: var(--primary); color: white; font-weight: bold;">📊 BU Sales & Target</a>
            <a href="visits.html" class="action-btn success" style="text-decoration: none; text-align: center; padding: 14px; border-radius: 8px; background: var(--success); color: white; font-weight: bold;">📍 Territory Visits</a>
            <a href="leaves.html" class="action-btn warning" style="text-decoration: none; text-align: center; padding: 14px; border-radius: 8px; background: var(--warning); color: white; font-weight: bold;">🏖️ Approvals Inbox</a>
            <a href="calendar.html" class="action-btn" style="text-decoration: none; text-align: center; padding: 14px; border-radius: 8px; background: var(--gray-200); color: var(--gray-800); font-weight: bold;">📅 Team Calendar</a>
          </div>
        </div>
      </div>
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
  const allSales =
    (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
      ? window.DEMO_DATA.sales
      : (window.REPORTS_DATA && window.REPORTS_DATA.sales) || [];

  const currentYearMonth = new Date().toISOString().slice(0, 7);
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
      <div class="welcome-banner admin" style="background: linear-gradient(135deg, #212529, #343a40); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, Admin ${userName}!</h2>
        <div class="welcome-subtitle" style="opacity: 0.9; margin-top: 4px;">${t.system_overview}</div>
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
          <h3 class="card-title" style="font-weight: 700; margin-bottom: 16px;">${t.quick_links}</h3>
          <div class="quick-actions-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
            <a href="users.html" class="action-btn primary" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; background: var(--primary); color: white;">👥 ${t.manage_users}</a>
            <a href="reports.html" class="action-btn success" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; background: var(--success); color: white;">📈 ${t.upload_sales}</a>
            <a href="products.html" class="action-btn warning" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; background: var(--warning); color: white;">📦 ${t.manage_products}</a>
            <a href="areas.html" class="action-btn danger" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; background: var(--danger); color: white;">🗺️ ${t.manage_areas}</a>
          </div>
        </div>

        <div class="dashboard-card">
          <h3 class="card-title" style="font-weight: 700; margin-bottom: 16px;">${t.recent_activity}</h3>
          <ul class="activity-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;">
            <li class="activity-item primary" style="padding: 10px; background: var(--gray-50); border-left: 3px solid var(--primary); border-radius: 6px;">System Admin initialized database synchronization.</li>
            <li class="activity-item success" style="padding: 10px; background: var(--gray-50); border-left: 3px solid var(--success); border-radius: 6px;">Product Line "Cardio Line" verified with 4 products.</li>
            <li class="activity-item warning" style="padding: 10px; background: var(--gray-50); border-left: 3px solid var(--warning); border-radius: 6px;">Territory Area "Nasr City (CAI-N01)" assigned to rep1.</li>
          </ul>
        </div>
      </div>
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
      <div class="welcome-banner" style="background: linear-gradient(135deg, #6f42c1, #593196); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
        <h2 class="welcome-title" style="margin: 0; color: white;">${t.welcome_back}, ${userName}!</h2>
        <div style="opacity: 0.9; margin-top: 4px;">${t.hr_overview}</div>
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
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashDate">${lang === "ar" ? "تاريخ التنفيذ" : "Execution Date"}</label>
              <input type="date" id="dashVisitDate" class="form-control" required style="width: 100%; padding: 8px 12px; border-radius: 8px;" onchange="updateDashModalDayDisplay()">
              <div id="dashModalDayDisplay" style="margin-top: 4px; font-size: 0.82rem; font-weight: 700; color: var(--primary);"></div>
            </div>
            <div class="form-group">
              <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;" id="lblDashTime">${t.visit_time}</label>
              <input type="time" id="dashVisitTime" class="form-control" required style="width: 100%; padding: 8px 12px; border-radius: 8px;">
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
  const lblDouble = document.getElementById("lblDouble");
  if (lblDouble) lblDouble.innerText = t.double_visit;
  const lblAccompanied = document.getElementById("lblDashAccompanied");
  if (lblAccompanied) lblAccompanied.innerText = t.accompanied_by;
  const lblProducts = document.getElementById("lblDashProducts");
  if (lblProducts) lblProducts.innerText = t.products_discussed;
  const lblFeedback = document.getElementById("lblDashFeedback");
  if (lblFeedback) lblFeedback.innerText = t.visit_feedback;

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dateInput = document.getElementById("dashVisitDate");
  if (dateInput) {
    dateInput.value = (target && target.date) || todayISO;
    updateDashModalDayDisplay();
  }
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  document.getElementById("dashVisitTime").value = timeStr;
  document.getElementById("dashVisitComment").value =
    (target && target.comment) || "";

  const container = document.getElementById("dashProdContainer");
  if (container) {
    container.replaceChildren();
    const allLines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    let productsToShow = [];
    allLines.forEach((line) => {
      if (line.products) productsToShow.push(...line.products);
    });

    if (productsToShow.length === 0) {
      container.innerHTML =
        '<span style="color: var(--gray-500);">No products available.</span>';
    } else {
      const selectedProds = (target && target.products) || [];
      productsToShow.forEach((prod) => {
        const displayName =
          prod.dosage &&
          !prod.name.toLowerCase().includes(prod.dosage.toLowerCase())
            ? `${prod.name} ${prod.dosage}`
            : prod.name;
        const isChecked =
          selectedProds.includes(displayName) ||
          selectedProds.includes(prod.name);
        const lbl = document.createElement("label");
        lbl.className = "pill-item";
        lbl.style.cssText =
          "display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 8px; border-radius: 6px; font-size: 0.82rem;";
        lbl.innerHTML = `<input type="checkbox" name="dashProd" value="${displayName}" ${isChecked ? "checked" : ""}> ${displayName}`;
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
  targetVisitToCompleteId = null;
  isCurrentActionJoinDouble = false;
};

window.handleDashCompleteSubmit = function (e) {
  e.preventDefault();
  if (!targetVisitToCompleteId) return;

  const dateInput = document.getElementById("dashVisitDate");
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dateVal = dateInput && dateInput.value ? dateInput.value : todayISO;
  const timeVal =
    document.getElementById("dashVisitTime").value ||
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const commentVal = document.getElementById("dashVisitComment").value;
  const selectedProducts = Array.from(
    document.querySelectorAll('input[name="dashProd"]:checked'),
  ).map((c) => c.value);

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
  if (target) {
    target.status = "completed";
    target.date = dateVal;
    target.time = timeVal;
    target.entryDate = dateVal;
    target.comment = commentVal;
    target.products = selectedProducts;
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

document.addEventListener("DOMContentLoaded", () => {
  const user =
    (window.requireAuth && window.requireAuth()) ||
    (window.checkAuth && window.checkAuth());
  if (!user) return;
  window.currentUser = user;
  if (window.initPage) window.initPage("home");
  renderDashboard();
});