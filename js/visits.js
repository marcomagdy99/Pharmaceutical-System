/**
 * @file visits.js
 * @description Visits Management Module supporting Multi-Doctor Bulk Planning, Direct Actual Logging, Co-Visiting (Double Visits), and 7-Day Auto-Expiry.
 */

const esc = window.escapeHtml || ((s) => s || "");

// ============================================================================
// Section 1: Localization Dictionary
// ============================================================================
const visitTranslations = {
  en: {
    visitsTitle: "Visits",
    addVisit: "Add Visit",
    logActualVisit: "Log Actual Visit",
    planVisit: "Plan Visits (Bulk)",
    statTotal: "Total:",
    statCompleted: "Completed:",
    statPending: "Active Pending:",
    tabToday: "Today's Plan",
    tabAll: "All Visits",
    amHospitals: "Hospitals",
    pmDoctors: "Doctors",
    filterAll: "All Statuses",
    filterPlanned: "Planned",
    filterCompleted: "Completed",
    filterAllPeriod: "All Periods",
    filterAM: "AM",
    filterPM: "PM",
    allReps: "All Team Reps",
    colDocHosp: "Doctor/Hospital",
    colDate: "Date",
    colPeriod: "Period",
    colType: "Type",
    colStatus: "Status",
    colProducts: "Products",
    colActions: "Actions",
    modalAddVisit: "Add New Visit",
    modalCompleteVisit: "Complete Visit",
    modalDate: "Date",
    modalPeriod: "Target Type / Period",
    modalAM: "AM (Hospital)",
    modalPM: "PM (Doctor)",
    modalPharmacy: "💊 Pharmacy",
    filterPharmacies: "Pharmacies",
    targetPharmacy: "Pharmacy",
    targetHospital: "Hospital",
    targetDoctor: "Doctor",
    modalTarget: "Doctor/Hospital/Pharmacy",
    modalAccompaniedRep: "Accompanied Rep",
    modalType: "Visit Type",
    modalSingle: "Single",
    modalDouble: "Double",
    modalSelectManager: "Accompanied By",
    modalProducts: "Products Discussed",
    modalComment: "Comment",
    btnCancel: "Cancel",
    btnSaveVisit: "Save Visit",
    btnComplete: "Complete Visit",
    btnDelete: "Delete",
    confirmDeleteVisitPrompt:
      "Are you sure you want to permanently delete this visit?",
    visitDeletedSuccess: "Visit deleted successfully.",
    noDeletePermission: "You do not have permission to delete this visit.",
    statusPlanned: "Planned",
    statusPending_approval: "Pending Approval",
    statusCompleted: "Completed",
    statusRejected: "Rejected",
    filterPendingApproval: "Pending Approval",
    typeSingle: "Single",
    typeDouble: "Double",
    directActual: "Direct Actual",
    fromPlan: "From Plan",
    selectAll: "Select All",
    btnExportCSV: "Export CSV",
    btnPrint: "Print",
    filterAllClasses: "All Target Classes",
    teamFilterLabel: "Team Filter:",
    tabDailyTimeline: "Daily Visits Timeline",
    timelineSelectDate: "Select Date:",
    btnShow: "Show",
    plannedExecuted: "Planned & Executed",
    jointVisitBadge: "Joint Visit (Co-Visiting)",
    totalEventsToday: "Total Events Today:",
    actualActivities: "Actual / Activities:",
    fromPlanStat: "From Plan:",
    jointVisitsCount: "Joint Visits:",
    noTimelineEvents: "No visits or activities recorded on this date",
    selectAnotherDate: "Select another date like 2026-09-02 or 2026-09-03",
    entryTimestamp: "Entry Timestamp:",
    loggedActivity: "Logged Activity",
    supervisoryVisit: "DM Single",
    jointVisitWithRep: "Joint Visit (Co-Visiting with Rep)",
    promptSelectDateAndShow: 'Select a date and click "Show" to view visits',
    promptSelectDateSub:
      "Choose your desired date and filters above, then click the Show button to load the daily visits timeline.",
  },
  ar: {
    visitsTitle: "الزيارات",
    addVisit: "إضافة زيارة",
    logActualVisit: "إدخال زيارة فعلية",
    planVisit: "تخطيط زيارات (مجمع)",
    statTotal: "الإجمالي:",
    statCompleted: "مكتمل:",
    statPending: "قيد الانتظار النشط:",
    tabToday: "خطة اليوم",
    tabDailyTimeline: "الخط الزمني للزيارات اليومية",
    tabAll: "كل الزيارات",
    amHospitals: "المستشفيات",
    pmDoctors: "الأطباء",
    filterAll: "كل الحالات",
    filterPlanned: "مخطط",
    filterCompleted: "مكتمل",
    filterAllPeriod: "كل الفترات",
    filterAM: "صباحاً",
    filterPM: "مساءً",
    allReps: "كل مناديب الفريق",
    teamFilterLabel: "تصفية الفريق:",
    colDocHosp: "الطبيب/المستشفى/الصيدلية",
    colDate: "التاريخ",
    colPeriod: "الفترة",
    colType: "النوع",
    colStatus: "الحالة",
    colProducts: "المنتجات",
    colActions: "إجراءات",
    modalAddVisit: "إضافة زيارة جديدة",
    modalCompleteVisit: "إكمال الزيارة",
    modalDate: "التاريخ",
    modalPeriod: "نوع الهدف / الفترة",
    modalAM: "صباحاً (مستشفى)",
    modalPM: "مساءً (طبيب)",
    modalPharmacy: "💊 صيدلية",
    filterPharmacies: "الصيدليات",
    targetPharmacy: "صيدلية",
    targetHospital: "مستشفى",
    targetDoctor: "طبيب",
    modalTarget: "الطبيب/المستشفى/الصيدلية",
    modalAccompaniedRep: "المندوب المرافق",
    modalType: "نوع الزيارة",
    modalSingle: "فردي",
    modalDouble: "مزدوج",
    modalSelectManager: "مرافق مع",
    modalProducts: "المنتجات التي تمت مناقشتها",
    modalComment: "تعليق",
    btnCancel: "إلغاء",
    btnSaveVisit: "حفظ الزيارة",
    btnComplete: "إكمال الزيارة",
    btnDelete: "حذف",
    confirmDeleteVisitPrompt: "هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟",
    visitDeletedSuccess: "تم حذف الزيارة بنجاح.",
    noDeletePermission: "ليس لديك صلاحية لحذف هذه الزيارة.",
    statusPlanned: "مخطط",
    statusPending_approval: "قيد المراجعة",
    statusCompleted: "مكتمل",
    statusRejected: "مرفوض",
    filterPendingApproval: "قيد المراجعة",
    typeSingle: "فردي",
    typeDouble: "مزدوج",
    directActual: "فعلية مباشرة",
    fromPlan: "من الخطة",
    selectAll: "تحديد الكل",
    btnExportCSV: "تصدير CSV",
    btnPrint: "طباعة",
    filterAllClasses: "كل فئات الأهداف",
    timelineSelectDate: "اختر التاريخ:",
    btnShow: "عرض",
    plannedExecuted: "زيارة من الخطة ومسجلة",
    jointVisitBadge: "زيارة مشتركة (نزول ميداني)",
    totalEventsToday: "إجمالي الأحداث اليوم:",
    actualActivities: "فعلية / أنشطة:",
    fromPlanStat: "من الخطة:",
    jointVisitsCount: "نزول مشترك:",
    noTimelineEvents: "لا توجد زيارات أو أنشطة مسجلة في هذا اليوم",
    selectAnotherDate: "اختر تاريخاً آخر مثل 2026-09-02 أو 2026-09-03",
    entryTimestamp: "توقيت التسجيل:",
    loggedActivity: "نشاط مسجل",
    supervisoryVisit: "DM Single",
    jointVisitWithRep: "زيارة مشتركة (نزول ميداني مع المندوب)",
    promptSelectDateAndShow: "حدد التاريخ واضغط على «عرض» لعرض الزيارات",
    promptSelectDateSub:
      "اختر التاريخ المطلوب وفلتر الفريق أعلاه، ثم اضغط على زر «عرض» لتحميل الخط الزمني لزيارات اليوم.",
  },
};

if (typeof translations !== "undefined") {
  if (translations.en && visitTranslations.en)
    Object.assign(translations.en, visitTranslations.en);
  if (translations.ar && visitTranslations.ar)
    Object.assign(translations.ar, visitTranslations.ar);
} else {
  window.translations = visitTranslations;
}

// ============================================================================
// Section 2: 7-Day Auto-Expiry Evaluation
// ============================================================================
function isPlannedVisitExpired(dateStr) {
  if (!dateStr) return false;
  const planDate = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - planDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  return diffDays > 7;
}

// ============================================================================
// Section 3: Active User Session & Role Scope
// ============================================================================
const currentUser = (window.checkAuth && window.checkAuth()) || {
  id: "rep1",
  role: "medical_rep",
  name: "Ahmed Mostafa",
};

const currentUserRole = window.normalizeRole
  ? window.normalizeRole(currentUser.role)
  : (currentUser.role || "medical_rep").toLowerCase();

const isManager =
  (window.isManagerRole
    ? window.isManagerRole(currentUser)
    : currentUserRole !== "medical_rep") || currentUserRole === "hr";

function getReportingReps() {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  if (
    currentUserRole === "admin" ||
    currentUserRole === "business_unit" ||
    currentUserRole === "hr"
  ) {
    return allUsers.filter((u) =>
      window.isRepRole
        ? window.isRepRole(u)
        : u.role === "medical_rep" || u.role === "rep",
    );
  }
  if (currentUserRole === "district_manager") {
    return allUsers.filter((u) => u.managerId === currentUser.id);
  }
  if (currentUserRole === "line_manager") {
    const dms = allUsers
      .filter((u) => u.managerId === currentUser.id)
      .map((d) => d.id);
    return allUsers.filter((u) => dms.includes(u.managerId));
  }
  return allUsers.filter((u) => u.id === currentUser.id);
}

// ============================================================================
// Section 4: Dynamic Master Target Getters
// ============================================================================
function getMockDoctors() {
  return (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
}

function getMockHospitals() {
  return (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
}

function getMockPharmacies() {
  if (
    window.DEMO_DATA &&
    Array.isArray(window.DEMO_DATA.pharmacies) &&
    window.DEMO_DATA.pharmacies.length > 0
  ) {
    return window.DEMO_DATA.pharmacies;
  }
  return [];
}

// ============================================================================
// Section 5: Visits Data State with Local Persistence
// ============================================================================
let demoVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

function persistVisits() {
  if (window.DEMO_DATA) {
    window.DEMO_DATA.visits = demoVisits;
    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
    }
  }
}

let currentEditVisitId = null;
const todayStr = "2026-09-02";
let hasLoadedTimelineOnce = false;

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("visitDate");
  if (dateInput) dateInput.value = todayStr;

  const timelineDatePicker = document.getElementById("timelineDatePicker");
  if (timelineDatePicker && !timelineDatePicker.value) {
    timelineDatePicker.value = todayStr;
  }

  timelineDatePicker?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      renderVisitsTimeline(true);
    }
  });

  setupRoleBasedView();
  renderVisits(false);
  updateTargetOptions();
});

function setupRoleBasedView() {
  const filterRep = document.getElementById("filterRep");
  const filterContainer = document.getElementById("managerRepFilterContainer");
  const planVisitBtn = document.getElementById("planVisitBtn");
  const addActualVisitBtn = document.getElementById("addActualVisitBtn");
  const titleSpan = document.getElementById("visitsPageTitle");
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  if (titleSpan) {
    titleSpan.setAttribute("data-i18n", "tabDailyTimeline");
    titleSpan.textContent =
      lang === "ar" ? "الخط الزمني للزيارات اليومية" : "Daily Visits Timeline";
  }

  if (isManager) {
    if (filterContainer) filterContainer.style.display = "flex";
    if (filterRep) {
      filterRep.style.display = "inline-block";
      populateManagerRepDropdown();
    }
    if (planVisitBtn) planVisitBtn.style.display = "none";
    if (addActualVisitBtn) addActualVisitBtn.style.display = "none";
  } else {
    if (filterContainer) filterContainer.style.display = "none";
    if (filterRep) filterRep.style.display = "none";
    if (planVisitBtn) planVisitBtn.style.display = "inline-flex";
    if (addActualVisitBtn) addActualVisitBtn.style.display = "inline-flex";
  }
}

function populateManagerRepDropdown() {
  const filterRep = document.getElementById("filterRep");
  if (!filterRep) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  filterRep.replaceChildren();

  if (currentUserRole === "line_manager") {
    const dms = allUsers.filter(
      (u) => u.managerId === currentUser.id && u.role === "district_manager",
    );
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent =
      lang === "ar"
        ? "🌐 كل الفريق (المديرين والمناديب)"
        : "🌐 All Team (DMs & Med Reps)";
    filterRep.appendChild(optAll);

    const optSelf = document.createElement("option");
    optSelf.value = currentUser.id;
    optSelf.className = "filter-opt-lm";
    optSelf.textContent =
      lang === "ar"
        ? `👔 ${currentUser.name} (LM - زياراتي)`
        : `👔 ${currentUser.name} (LM - My Visits)`;
    filterRep.appendChild(optSelf);

    const optAllDMs = document.createElement("option");
    optAllDMs.value = "all_dms";
    optAllDMs.className = "filter-opt-dm";
    optAllDMs.textContent =
      lang === "ar"
        ? "👥 جميع مديري المناطق (DMs فقط)"
        : "👥 All District Managers (DMs Only)";
    filterRep.appendChild(optAllDMs);

    const optAllReps = document.createElement("option");
    optAllReps.value = "all_reps";
    optAllReps.className = "filter-opt-rep";
    optAllReps.textContent =
      lang === "ar"
        ? "💼 جميع المناديب (Reps فقط)"
        : "💼 All Medical Reps (Reps Only)";
    filterRep.appendChild(optAllReps);

    if (dms.length > 0) {
      const dmGroup = document.createElement("optgroup");
      dmGroup.label =
        lang === "ar"
          ? "── مدراء المناطق (District Managers) ──"
          : "── District Managers (DMs) ──";
      dms.forEach((dm) => {
        const opt = document.createElement("option");
        opt.value = dm.id;
        opt.className = "filter-opt-dm";
        opt.textContent = `💼 ${dm.name} (${dm.employeeCode || "DM"})`;
        dmGroup.appendChild(opt);
      });
      filterRep.appendChild(dmGroup);
    }

    if (reps.length > 0) {
      const repGroup = document.createElement("optgroup");
      repGroup.label =
        lang === "ar"
          ? "── المناديب الطبيين (Medical Reps) ──"
          : "── Medical Representatives (Reps) ──";
      reps.forEach((rep) => {
        const dm = dms.find((d) => d.id === rep.managerId);
        const opt = document.createElement("option");
        opt.value = rep.id;
        opt.className = "filter-opt-rep";
        opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"}${dm ? ` - DM: ${dm.name}` : ""})`;
        repGroup.appendChild(opt);
      });
      filterRep.appendChild(repGroup);
    }
    return;
  }

  if (currentUserRole === "district_manager") {
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent =
      lang === "ar" ? "🌐 كل مناديب الفريق" : "🌐 All Team Reps";
    filterRep.appendChild(optAll);

    const selfOpt = document.createElement("option");
    selfOpt.value = currentUser.id;
    selfOpt.className = "filter-opt-dm";
    selfOpt.textContent =
      lang === "ar"
        ? `👔 ${currentUser.name} (DM - زياراتي والنزول المشترك)`
        : `👔 ${currentUser.name} (DM - My Visits & Joint Accompaniments)`;
    filterRep.appendChild(selfOpt);

    const myReps = getReportingReps();
    if (myReps.length > 0) {
      const repGroup = document.createElement("optgroup");
      repGroup.label =
        lang === "ar"
          ? "── المناديب الطبيين (Medical Reps) ──"
          : "── Medical Representatives (Reps) ──";
      myReps.forEach((rep) => {
        const opt = document.createElement("option");
        opt.value = rep.id;
        opt.className = "filter-opt-rep";
        opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || rep.code || "Rep"})`;
        repGroup.appendChild(opt);
      });
      filterRep.appendChild(repGroup);
    }
    return;
  }

  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent =
    lang === "ar"
      ? "🌐 كل الفريق (الكل بالكامل)"
      : "🌐 All Team (Entire Organization)";
  filterRep.appendChild(optAll);

  const optAllLMs = document.createElement("option");
  optAllLMs.value = "all_lms";
  optAllLMs.className = "filter-opt-lm";
  optAllLMs.textContent =
    lang === "ar"
      ? "👔 جميع مديري الخطوط (Line Managers فقط)"
      : "👔 All Line Managers (LMs Only)";
  filterRep.appendChild(optAllLMs);

  const optAllDMs = document.createElement("option");
  optAllDMs.value = "all_dms";
  optAllDMs.className = "filter-opt-dm";
  optAllDMs.textContent =
    lang === "ar"
      ? "👥 جميع مديري المناطق (District Managers فقط)"
      : "👥 All District Managers (DMs Only)";
  filterRep.appendChild(optAllDMs);

  const optAllReps = document.createElement("option");
  optAllReps.value = "all_reps";
  optAllReps.className = "filter-opt-rep";
  optAllReps.textContent =
    lang === "ar"
      ? "💼 جميع المناديب (Medical Reps فقط)"
      : "💼 All Medical Reps (Reps Only)";
  filterRep.appendChild(optAllReps);

  const lms = allUsers.filter((u) => u.role === "line_manager");
  if (lms.length > 0) {
    const lmGroup = document.createElement("optgroup");
    lmGroup.label =
      lang === "ar"
        ? "── مدراء الخطوط / الفريق (Line Managers) ──"
        : "── Line Managers / Team Leaders (LMs) ──";
    lms.forEach((lm) => {
      const opt = document.createElement("option");
      opt.value = lm.id;
      opt.className = "filter-opt-lm";
      opt.textContent = `👔 ${lm.name} (${lm.employeeCode || "LM"})`;
      lmGroup.appendChild(opt);
    });
    filterRep.appendChild(lmGroup);
  }

  const dms = allUsers.filter((u) => u.role === "district_manager");
  if (dms.length > 0) {
    const dmGroup = document.createElement("optgroup");
    dmGroup.label =
      lang === "ar"
        ? "── مدراء المناطق (District Managers) ──"
        : "── District Managers (DMs) ──";
    dms.forEach((dm) => {
      const lm = lms.find((l) => l.id === dm.managerId);
      const opt = document.createElement("option");
      opt.value = dm.id;
      opt.className = "filter-opt-dm";
      opt.textContent = `💼 ${dm.name} (${dm.employeeCode || "DM"}${lm ? ` - LM: ${lm.name}` : ""})`;
      dmGroup.appendChild(opt);
    });
    filterRep.appendChild(dmGroup);
  }

  const reps = allUsers.filter(
    (u) => u.role === "medical_rep" || u.role === "rep",
  );
  if (reps.length > 0) {
    const repGroup = document.createElement("optgroup");
    repGroup.label =
      lang === "ar"
        ? "── المناديب الطبيين (Medical Reps) ──"
        : "── Medical Representatives (Reps) ──";
    reps.forEach((rep) => {
      const dm = dms.find((d) => d.id === rep.managerId);
      const opt = document.createElement("option");
      opt.value = rep.id;
      opt.className = "filter-opt-rep";
      opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"}${dm ? ` - DM: ${dm.name}` : ""})`;
      repGroup.appendChild(opt);
    });
    filterRep.appendChild(repGroup);
  }
}

function getScopedVisits() {
  let list = demoVisits;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  if (!isManager) {
    list = list.filter((v) => v.repId === currentUser.id || v.repId === "rep1");
  } else if (
    currentUserRole === "admin" ||
    currentUserRole === "hr" ||
    currentUserRole === "business_unit"
  ) {
    const selectedRepFilter =
      document.getElementById("filterRep")?.value || "all";
    if (selectedRepFilter === "all") {
      // Keep all
    } else if (selectedRepFilter === "all_lms") {
      const lmIds = allUsers
        .filter((u) => u.role === "line_manager")
        .map((u) => u.id);
      list = list.filter(
        (v) => lmIds.includes(v.repId) || lmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_dms") {
      const dmIds = allUsers
        .filter((u) => u.role === "district_manager")
        .map((u) => u.id);
      list = list.filter(
        (v) => dmIds.includes(v.repId) || dmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_reps") {
      const repIds = allUsers
        .filter((u) => u.role === "medical_rep" || u.role === "rep")
        .map((u) => u.id);
      list = list.filter((v) => repIds.includes(v.repId));
    } else {
      list = list.filter(
        (v) =>
          v.repId === selectedRepFilter ||
          v.doubleWithUserId === selectedRepFilter,
      );
    }
  } else if (currentUserRole === "line_manager") {
    const dms = allUsers.filter(
      (u) => u.managerId === currentUser.id && u.role === "district_manager",
    );
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);

    const selectedFilter = document.getElementById("filterRep")?.value || "all";

    if (selectedFilter === "all") {
      list = list.filter(
        (v) =>
          dmIds.includes(v.repId) ||
          repIds.includes(v.repId) ||
          v.repId === currentUser.id ||
          dmIds.includes(v.doubleWithUserId) ||
          v.doubleWithUserId === currentUser.id,
      );
    } else if (selectedFilter === "all_dms") {
      list = list.filter(
        (v) => dmIds.includes(v.repId) || dmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedFilter === "all_reps") {
      list = list.filter((v) => repIds.includes(v.repId));
    } else {
      list = list.filter(
        (v) =>
          v.repId === selectedFilter || v.doubleWithUserId === selectedFilter,
      );
    }
  } else {
    const myRepsIds = getReportingReps().map((r) => r.id);
    const selectedRepFilter =
      document.getElementById("filterRep")?.value || "all";

    if (selectedRepFilter === "all") {
      list = list.filter(
        (v) =>
          myRepsIds.includes(v.repId) ||
          v.repId === currentUser.id ||
          v.doubleWithUserId === currentUser.id,
      );
    } else if (selectedRepFilter === currentUser.id) {
      list = list.filter(
        (v) =>
          v.repId === currentUser.id || v.doubleWithUserId === currentUser.id,
      );
    } else {
      list = list.filter(
        (v) =>
          v.repId === selectedRepFilter ||
          v.doubleWithUserId === selectedRepFilter,
      );
    }
  }

  return list.filter(
    (v) => v.status === "completed" || !isPlannedVisitExpired(v.date),
  );
}

// ============================================================================
// Section 6: Bulk Multi-Doctor Planning Engine
// ============================================================================
const visitsApp = {
  openBulkPlanModal() {
    const modal = document.getElementById("bulkPlanModal");
    if (!modal) return;

    document.getElementById("bulkPlanDate").value = todayStr;
    document.getElementById("bulkSearchInput").value = "";
    const pmRadio = document.querySelector(
      'input[name="bulkPeriod"][value="pm"]',
    );
    if (pmRadio) pmRadio.checked = true;

    this.renderBulkTargetsList();
    modal.style.display = "flex";
    modal.classList.add("active");
  },

  closeBulkPlanModal() {
    const modal = document.getElementById("bulkPlanModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  },

  renderBulkTargetsList() {
    const container = document.getElementById("bulkTargetsContainer");
    if (!container) return;

    const period =
      document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";
    const searchTerm = (document.getElementById("bulkSearchInput")?.value || "")
      .toLowerCase()
      .trim();
    const classFilter =
      document.getElementById("bulkClassFilter")?.value || "all";
    const selectAllCb = document.getElementById("bulkSelectAllToggle");
    if (selectAllCb) selectAllCb.checked = false;

    container.replaceChildren();
    const isHospital = period.toLowerCase() === "am";
    const sourceList = isHospital ? getMockHospitals() : getMockDoctors();

    const filtered = sourceList.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(searchTerm);
      const specMatch = item.specialty
        ? item.specialty.toLowerCase().includes(searchTerm)
        : false;
      const addrMatch = item.address
        ? item.address.toLowerCase().includes(searchTerm)
        : false;
      const classMatch =
        classFilter === "all" || isHospital ? true : item.class === classFilter;
      return (nameMatch || specMatch || addrMatch) && classMatch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--gray-500); font-style: italic;">No matching targets found.</div>`;
      this.updateBulkCounter();
      return;
    }

    filtered.forEach((target) => {
      const itemDiv = document.createElement("label");
      itemDiv.className = "bulk-target-item";
      itemDiv.innerHTML = `
        <input type="checkbox" class="bulk-target-cb" value="${target.id}" data-name="${target.name}" onchange="visitsApp.updateBulkCounter()">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: var(--gray-800); font-size: 0.9rem;">${target.name}</div>
          <div style="font-size: 0.75rem; color: var(--gray-500);">
            ${isHospital ? target.address || "Hospital" : `${target.specialty || "General"} • Class ${target.class || "A"}`}
          </div>
        </div>
        <span class="badge" style="background: ${isHospital ? "#fff3cd" : "#e7f1ff"}; color: ${isHospital ? "#664d03" : "#0d6efd"}; font-size: 0.72rem; font-weight: bold;">
          ${isHospital ? "Hospital" : `Class ${target.class || "A"}`}
        </span>
      `;
      container.appendChild(itemDiv);
    });

    this.updateBulkCounter();
  },

  filterBulkTargetsList() {
    this.renderBulkTargetsList();
  },

  toggleBulkSelectAll(isChecked) {
    document.querySelectorAll(".bulk-target-cb").forEach((cb) => {
      cb.checked = isChecked;
    });
    this.updateBulkCounter();
  },

  updateBulkCounter() {
    const allCheckboxes = document.querySelectorAll(".bulk-target-cb");
    const checkedBoxes = document.querySelectorAll(".bulk-target-cb:checked");
    const counterEl = document.getElementById("bulkSelectionCounter");
    const saveBtn = document.getElementById("btnSaveBulkPlan");
    const selectAllCb = document.getElementById("bulkSelectAllToggle");

    const count = checkedBoxes.length;
    if (counterEl) {
      counterEl.textContent = `Selected: ${count} Targets`;
    }
    if (saveBtn) {
      saveBtn.textContent =
        count > 0 ? `Save ${count} Planned Visits` : "Save Planned Visits";
    }
    if (selectAllCb && allCheckboxes.length > 0) {
      selectAllCb.checked = checkedBoxes.length === allCheckboxes.length;
    }
  },

  saveBulkPlanVisits() {
    const checkedBoxes = Array.from(
      document.querySelectorAll(".bulk-target-cb:checked"),
    );
    if (checkedBoxes.length === 0) {
      return showToast(
        "Please select at least one doctor or hospital.",
        "warning",
      );
    }

    const planDate = document.getElementById("bulkPlanDate").value || todayStr;
    const period =
      document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";
    const defaultTimes = [
      "09:30",
      "10:15",
      "11:00",
      "11:45",
      "13:00",
      "13:45",
      "14:30",
      "15:15",
      "16:00",
      "16:45",
    ];

    checkedBoxes.forEach((cb, index) => {
      const targetId = cb.value;
      const targetName = cb.getAttribute("data-name") || "Doctor";
      const assignedTime = defaultTimes[index % defaultTimes.length];

      const newVisit = {
        id: "v_bulk_" + Date.now() + "_" + index,
        repId: currentUser.id || "rep1",
        doctorId: targetId,
        doctorName: targetName,
        date: planDate,
        time: assignedTime,
        period: period,
        visitType: "single",
        products: [],
        comment: "",
        status: "pending_approval",
        source: "plan",
        createdAt: new Date().toISOString(),
        entryDate: todayStr,
      };

      demoVisits.unshift(newVisit);
    });

    persistVisits();
    this.closeBulkPlanModal();
    renderVisits(true);
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    showToast(
      lang === "ar"
        ? `تم إرسال ${checkedBoxes.length} زيارة للمراجعة والاعتماد من المدير!`
        : `${checkedBoxes.length} planned visits submitted for manager review and approval!`,
      "success",
    );
  },
};

window.openBulkPlanModal = function () {
  visitsApp.openBulkPlanModal();
};
window.closeBulkPlanModal = function () {
  visitsApp.closeBulkPlanModal();
};
window.renderBulkTargetsList = function () {
  visitsApp.renderBulkTargetsList();
};
window.filterBulkTargetsList = function () {
  visitsApp.filterBulkTargetsList();
};
window.toggleBulkSelectAll = function (isChecked) {
  visitsApp.toggleBulkSelectAll(isChecked);
};
window.updateBulkCounter = function () {
  visitsApp.updateBulkCounter();
};
window.saveBulkPlanVisits = function () {
  visitsApp.saveBulkPlanVisits();
};

function formatVisitDateTime(dateStr, timeStr, lang) {
  const currentLang =
    lang || (window.getCurrentLang && window.getCurrentLang()) || "ar";
  const isAr = currentLang === "ar";
  const arDays = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const enDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let dayName = "";
  let validDate = dateStr || "";

  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const dayIndex = isNaN(d.getDay()) ? 0 : d.getDay();
    dayName = isAr ? arDays[dayIndex] : enDays[dayIndex];
  }

  const safeTime = timeStr || "10:00";

  return {
    dayName: dayName,
    date: validDate,
    time: safeTime,
    displayWithDay: dayName
      ? `${dayName} - ${validDate} (⏰ ${safeTime})`
      : `${validDate} (⏰ ${safeTime})`,
    dayAndTime: dayName ? `${dayName} • ⏰ ${safeTime}` : `⏰ ${safeTime}`,
  };
}

window.formatVisitDateTime = formatVisitDateTime;

function updateVisitModalDayDisplay() {
  const dateInput = document.getElementById("visitDate");
  const displayEl = document.getElementById("visitModalDayName");
  if (!dateInput || !displayEl) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "ar";
  const dt = formatVisitDateTime(dateInput.value, null, lang);
  displayEl.textContent = dt.dayName ? `📅 ${dt.dayName}` : "";
}

window.updateVisitModalDayDisplay = updateVisitModalDayDisplay;

// ============================================================================
// Section 7: Visit Deletion & Role-Based Authorization
// ============================================================================
function isSameDayVisit(v) {
  if (!v) return false;

  const now = new Date();
  const realToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentSysDate =
    typeof todayStr !== "undefined" && todayStr ? todayStr : realToday;

  let visitEntryDate = v.entryDate || "";
  if (!visitEntryDate && v.createdAt) {
    visitEntryDate = v.createdAt.slice(0, 10);
  }
  if (!visitEntryDate) {
    visitEntryDate = v.date || "";
  }

  return visitEntryDate === currentSysDate || visitEntryDate === realToday;
}

window.isSameDayVisit = isSameDayVisit;

function isPlanApproved(v) {
  if (!v) return false;
  if (v.approvedBy || v.approvedAt) return true;
  if (
    (v.source === "plan" || v.source === "planned") &&
    (v.status === "planned" || v.status === "completed")
  ) {
    return true;
  }
  return false;
}

function canDeleteVisit(v) {
  if (!v || !currentUser) return false;

  if (currentUserRole === "admin" || currentUserRole === "hr") return true;

  const targetRepId = v.repId;
  if (!targetRepId) return false;

  if (targetRepId !== currentUser.id) {
    return false;
  }

  if (isPlanApproved(v)) {
    return false;
  }

  return isSameDayVisit(v);
}

window.canDeleteVisit = canDeleteVisit;

function confirmDeleteVisit(visitId) {
  visitsApp.confirmDeleteVisit(visitId);
}

// ============================================================================
// Section 8: Standard Rendering & Single Visit Execution
// ============================================================================
function renderVisits(triggeredByShow = false) {
  renderVisitsTimeline(triggeredByShow);
}

function renderStats() {
  const scoped = getScopedVisits();

  const elTotal = document.getElementById("statTotal");
  const elComp = document.getElementById("statCompleted");
  const elPend = document.getElementById("statPending");

  if (elTotal) elTotal.innerText = scoped.length;
  if (elComp)
    elComp.innerText = scoped.filter((v) => v.status === "completed").length;
  if (elPend)
    elPend.innerText = scoped.filter(
      (v) => v.status === "planned" || v.status === "pending_approval",
    ).length;
}

function renderTodayVisits() {
  const amContainer = document.getElementById("am-visits-container");
  const pmContainer = document.getElementById("pm-visits-container");

  if (!amContainer || !pmContainer) return;
  amContainer.replaceChildren();
  pmContainer.replaceChildren();

  const scoped = getScopedVisits();
  const todayVisits = scoped.filter((v) => v.date === todayStr);

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;
  const esc = window.escapeHtml || ((s) => s || "");

  todayVisits.forEach((v) => {
    const card = document.createElement("div");
    card.className = `visit-card ${v.status}`;

    const statusKey =
      "status" + v.status.charAt(0).toUpperCase() + v.status.slice(1);
    const statusText = trans[statusKey] || v.status;

    const sourceBadge =
      v.source === "actual"
        ? `<span style="background: #fff3cd; color: #664d03; border: 1px solid #ffecb5; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: bold; margin-left: 6px;">${trans.directActual}</span>`
        : `<span style="background: #e7f1ff; color: #0d6efd; border: 1px solid #cfe2ff; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: bold; margin-left: 6px;">${trans.fromPlan}</span>`;

    const currentUser =
      (window.checkAuth && window.checkAuth()) ||
      (window.DEMO_DATA && window.DEMO_DATA.currentUser);
    const userRole = (
      currentUser && currentUser.role ? currentUser.role : ""
    ).toLowerCase();
    const isOwnerRep =
      (userRole === "medical_rep" || userRole === "rep") &&
      currentUser &&
      (currentUser.id === v.repId || currentUser.id === "rep1");

    let actionsHtml = "";
    const actionButtons = [];
    if (v.status === "planned" && isOwnerRep) {
      actionButtons.push(
        `<button class="btn btn-primary btn-sm" onclick="openCompleteModal('${v.id}')">${trans.btnComplete}</button>`,
      );
    }
    if (canDeleteVisit(v)) {
      actionButtons.push(
        `<button class="btn btn-outline-danger btn-sm" onclick="confirmDeleteVisit('${v.id}')" title="${trans.btnDelete}">🗑️ ${trans.btnDelete}</button>`,
      );
    }
    if (actionButtons.length > 0) {
      actionsHtml = `
        <div class="visit-actions" style="margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${actionButtons.join("")}
        </div>
      `;
    }

    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const repUser = allUsers.find((u) => u.id === v.repId);
    const repDisplayName = repUser
      ? `${repUser.name} (${repUser.employeeCode || (repUser.role === "line_manager" ? "LM" : repUser.role === "district_manager" ? "DM" : "Rep")})`
      : v.repId;

    const dt = formatVisitDateTime(v.date, v.time, lang);

    const isPharmacy =
      v.targetType === "pharmacy" ||
      (v.doctorId && v.doctorId.toString().startsWith("pharm"));
    const isHospital =
      (v.period || "").toLowerCase() === "am" ||
      (v.doctorId && v.doctorId.toString().startsWith("h"));
    const targetBadge = isPharmacy
      ? `<span class="badge" style="background: #e8f5e9; color: #1b5e20; font-size: 0.72rem; font-weight: bold; margin-inline-start: 6px;">💊 ${trans.targetPharmacy}</span>`
      : isHospital
        ? `<span class="badge" style="background: #cff4fc; color: #055160; font-size: 0.72rem; font-weight: bold; margin-inline-start: 6px;">🏥 ${trans.targetHospital}</span>`
        : `<span class="badge" style="background: #e7f1ff; color: #0d6efd; font-size: 0.72rem; font-weight: bold; margin-inline-start: 6px;">👨‍⚕️ ${trans.targetDoctor}</span>`;

    card.innerHTML = `
      <div class="visit-info">
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span class="visit-name" style="font-weight: 700; font-size: 1.05rem;">${esc(v.doctorName)}</span>
          ${targetBadge}
        </div>
        <span class="visit-time" style="font-weight: 600; color: var(--gray-700); font-size: 0.85rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
          <span style="color: var(--primary); font-weight: 700;">📅 ${dt.dayName}</span>
          <span>${v.date}</span>
          <span style="background: var(--gray-100); padding: 2px 6px; border-radius: 4px; color: var(--gray-800); font-weight: 700;">⏰ ${dt.time}</span>
          <span style="font-size: 0.72rem; color: var(--gray-500); font-weight: 600;">(${(v.period || "").toUpperCase()})</span>
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; margin: 6px 0; flex-wrap: wrap;">
        <span class="visit-status-badge ${v.status}">${statusText}</span>
        ${sourceBadge}
        ${isManager ? `<span style="font-size: 0.75rem; color: var(--gray-600); font-weight: bold;">(By: ${esc(repDisplayName)})</span>` : ""}
        ${v.visitType === "double" ? `<span style="font-size: 0.75rem; color: var(--purple, #6f42c1); font-weight: 600;">[Double: ${esc(v.doubleWithUserName || "Manager")}]</span>` : ""}
      </div>
      <div class="visit-comment-box" style="display: none; font-size: 0.82rem; color: var(--gray-600); margin-top: 4px;"></div>
      ${actionsHtml}
    `;

    if (v.comment) {
      const commentEl = card.querySelector(".visit-comment-box");
      if (commentEl) {
        commentEl.textContent = "💬 " + v.comment;
        commentEl.style.display = "block";
      }
    }

    if (v.status === "rejected" && v.rejectionReason) {
      const reasonEl = document.createElement("div");
      reasonEl.style.cssText =
        "font-size: 0.82rem; color: var(--danger, #dc3545); margin-top: 4px; font-weight: 600;";
      reasonEl.textContent = "⚠️ " + v.rejectionReason;
      card.appendChild(reasonEl);
    }

    if (v.period === "am" || v.period === "AM") amContainer.appendChild(card);
    else pmContainer.appendChild(card);
  });

  if (amContainer.children.length === 0)
    amContainer.innerHTML = `<p class="text-muted" style="padding: 10px; font-style: italic;">No hospital visits scheduled.</p>`;
  if (pmContainer.children.length === 0)
    pmContainer.innerHTML = `<p class="text-muted" style="padding: 10px; font-style: italic;">No doctor/pharmacy visits scheduled.</p>`;
}

function renderAllVisits() {
  const tbody = document.getElementById("all-visits-tbody");
  if (!tbody) return;
  tbody.replaceChildren();

  const fDate = document.getElementById("filterDate")?.value;
  const fStatus = document.getElementById("filterStatus")?.value;
  const fPeriod = document.getElementById("filterPeriod")?.value;
  const fClass = document.getElementById("filterClass")?.value;

  let filtered = getScopedVisits();

  if (fDate) filtered = filtered.filter((v) => v.date === fDate);
  if (fStatus && fStatus !== "all")
    filtered = filtered.filter((v) => v.status === fStatus);
  if (fPeriod && fPeriod !== "all")
    filtered = filtered.filter(
      (v) => v.period.toLowerCase() === fPeriod.toLowerCase(),
    );
  if (fClass && fClass !== "all") {
    filtered = filtered.filter((v) => {
      const allDocs = getMockDoctors();
      const allHosps = getMockHospitals();
      const doc = allDocs.find(
        (d) => d.name === v.doctorName || d.id === v.doctorId,
      );
      const hosp = allHosps.find(
        (h) => h.name === v.doctorName || h.id === v.doctorId,
      );
      if (fClass === "all_doctors") {
        return !!doc && (doc.class === "A" || doc.class === "B");
      }
      if (fClass === "hospital") {
        return (
          !!hosp ||
          (v.period && v.period.toLowerCase() === "am") ||
          (v.doctorId && v.doctorId.toString().startsWith("h"))
        );
      }
      if (fClass === "pharmacy") {
        return (
          v.targetType === "pharmacy" ||
          (v.doctorId && v.doctorId.toString().startsWith("pharm"))
        );
      }
      return doc && doc.class === fClass;
    });
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;

  filtered.forEach((v) => {
    const tr = document.createElement("tr");

    const statusKey =
      "status" + v.status.charAt(0).toUpperCase() + v.status.slice(1);
    const statusText = trans[statusKey] || v.status;

    const typeKey =
      "type" +
      (v.visitType
        ? v.visitType.charAt(0).toUpperCase() + v.visitType.slice(1)
        : "Single");
    const typeText = trans[typeKey] || v.visitType || "Single";

    const sourceBadge =
      v.source === "actual"
        ? `<span style="background: #fff3cd; color: #664d03; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: bold; border: 1px solid #ffecb5;">${trans.directActual}</span>`
        : `<span style="background: #e7f1ff; color: #0d6efd; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: bold; border: 1px solid #cfe2ff;">${trans.fromPlan}</span>`;

    const currentUser =
      (window.checkAuth && window.checkAuth()) ||
      (window.DEMO_DATA && window.DEMO_DATA.currentUser);
    const userRole = (
      currentUser && currentUser.role ? currentUser.role : ""
    ).toLowerCase();
    const isOwnerRep =
      (userRole === "medical_rep" || userRole === "rep") &&
      currentUser &&
      (currentUser.id === v.repId || currentUser.id === "rep1");

    let actions = "";
    if (v.status === "planned" && isOwnerRep) {
      actions = `<button class="btn btn-primary btn-sm" onclick="openCompleteModal('${v.id}')">${trans.btnComplete}</button>`;
    }

    if (canDeleteVisit(v)) {
      actions += `
        <button class="btn btn-outline-danger btn-sm ms-1" onclick="confirmDeleteVisit('${v.id}')" title="${trans.btnDelete}" style="margin-inline-start: 6px;">
          🗑️ ${trans.btnDelete}
        </button>
      `;
    }

    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const repUser = allUsers.find((u) => u.id === v.repId);
    const repDisplayName = repUser
      ? `${repUser.name} (${repUser.employeeCode || (repUser.role === "line_manager" ? "LM" : repUser.role === "district_manager" ? "DM" : "Rep")})`
      : v.repId;

    const dt = formatVisitDateTime(v.date, v.time, lang);

    const isPharmacy =
      v.targetType === "pharmacy" ||
      (v.doctorId && v.doctorId.toString().startsWith("pharm"));
    const isHospital =
      (v.period || "").toLowerCase() === "am" ||
      (v.doctorId && v.doctorId.toString().startsWith("h"));
    const targetBadge = isPharmacy
      ? `<span class="badge" style="background: #e8f5e9; color: #1b5e20; font-size: 0.72rem; font-weight: bold; margin-inline-start: 6px;">💊 ${trans.targetPharmacy}</span>`
      : isHospital
        ? `<span class="badge" style="background: #cff4fc; color: #055160; font-size: 0.72rem; font-weight: bold; margin-inline-start: 6px;">🏥 ${trans.targetHospital}</span>`
        : `<span class="badge" style="background: #e7f1ff; color: #0d6efd; font-size: 0.72rem; font-weight: bold; margin-inline-start: 6px;">👨‍⚕️ ${trans.targetDoctor}</span>`;

    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
          <strong>${esc(v.doctorName)}</strong>
          ${targetBadge}
        </div>
        ${isManager ? `<small style="color: var(--gray-500); font-weight: bold;">By: ${esc(repDisplayName)}</small>` : ""}
      </td>
      <td>
        <div style="font-weight: 700; color: var(--primary); font-size: 0.85rem;">${dt.dayName}</div>
        <div style="font-weight: 600; color: var(--gray-800); font-size: 0.82rem;">${v.date}</div>
        <div style="color: var(--gray-600); font-weight: 600; font-size: 0.78rem;">⏰ ${dt.time}</div>
      </td>
      <td><span class="period-badge ${v.period}">${(v.period || "").toUpperCase()}</span></td>
      <td>
        ${typeText} ${v.visitType === "double" && v.doubleWithUserName ? `<br><small style="color: var(--purple, #6f42c1);">[${esc(v.doubleWithUserName)}]</small>` : ""}
        <div style="margin-top: 4px;">${sourceBadge}</div>
      </td>
      <td>
        <span class="visit-status-badge ${v.status}">${statusText}</span>
        ${v.status === "rejected" && v.rejectionReason ? `<div style="font-size: 0.75rem; color: var(--danger, #dc3545); margin-top: 4px; font-weight: 600;">⚠️ ${esc(v.rejectionReason)}</div>` : ""}
      </td>
      <td>${v.products && v.products.length ? v.products.join(", ") : "-"}</td>
      <td>${actions || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderVisitsTimeline(triggeredByShow = false) {
  const container = document.getElementById("timelineEventsContainer");
  const summaryBar = document.getElementById("timelineSummaryBar");
  if (!container) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;

  const datePicker = document.getElementById("timelineDatePicker");
  if (datePicker && !datePicker.value) {
    datePicker.value =
      typeof todayStr !== "undefined" && todayStr ? todayStr : "2026-09-02";
  }
  const selectedDate = datePicker ? datePicker.value : "2026-09-02";

  if (!triggeredByShow && !hasLoadedTimelineOnce) {
    if (summaryBar) summaryBar.innerHTML = "";
    container.innerHTML = `
      <div class="timeline-prompt-card">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
        <h4 class="timeline-prompt-title" data-i18n="promptSelectDateAndShow">
          ${trans.promptSelectDateAndShow || 'Select a date and click "Show" to view visits'}
        </h4>
        <p class="timeline-prompt-sub" data-i18n="promptSelectDateSub">
          ${trans.promptSelectDateSub || "Choose your desired date and filters above, then click the Show button to load the daily visits timeline."}
        </p>
        <button type="button" class="btn btn-primary" onclick="renderVisitsTimeline(true)" style="padding: 8px 24px; font-weight: 600; border-radius: 8px;">
          🔍 <span data-i18n="btnShow">${trans.btnShow || "Show"}</span>
        </button>
      </div>
    `;
    return;
  }

  hasLoadedTimelineOnce = true;
  container.replaceChildren();

  const showBtn = document.getElementById("btnShowVisits");
  if (showBtn) {
    showBtn.classList.add("active");
    setTimeout(() => showBtn.classList.remove("active"), 200);
  }

  const selectedRepFilter =
    document.getElementById("filterRep")?.value || "all";
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  const scopedVisits = getScopedVisits().filter((v) => v.date === selectedDate);

  let storedActivities = {};
  try {
    const raw = localStorage.getItem("pharma_activities_data");
    if (raw) storedActivities = JSON.parse(raw);
  } catch (e) {
    console.error("Error parsing pharma_activities_data:", e);
  }

  const dayActivities = storedActivities[selectedDate] || {};
  const activityEvents = [];

  const shouldIncludeActivities =
    !isManager ||
    selectedRepFilter === "all" ||
    selectedRepFilter === "rep1" ||
    selectedRepFilter === currentUser.id;

  if (shouldIncludeActivities) {
    if (dayActivities.AM && dayActivities.AM.type) {
      activityEvents.push({
        doctorName: `${dayActivities.AM.type} (AM Activity)`,
        class: "Activity",
        specialty: dayActivities.AM.notes || "Routine Activity",
        type: "activity",
        date: selectedDate,
        time: "09:00",
        period: "AM",
        repName:
          selectedRepFilter === currentUser.id
            ? currentUser.name
            : "Ahmed Mostafa",
        isActual: true,
        source: "actual",
        status: "completed",
      });
    }

    if (dayActivities.PM && dayActivities.PM.type) {
      activityEvents.push({
        doctorName: `${dayActivities.PM.type} (PM Activity)`,
        class: "Activity",
        specialty: dayActivities.PM.notes || "Routine Activity",
        type: "activity",
        date: selectedDate,
        time: "14:00",
        period: "PM",
        repName:
          selectedRepFilter === currentUser.id
            ? currentUser.name
            : "Ahmed Mostafa",
        isActual: true,
        source: "actual",
        status: "completed",
      });
    }
  }

  const combined = [...scopedVisits, ...activityEvents];
  const totalItems = combined.length;
  const actualCount = combined.filter(
    (v) => v.source === "actual" || v.isActual || v.status === "completed",
  ).length;
  const plannedCount = combined.filter(
    (v) => (v.source === "plan" || v.source === "planned") && !v.isActual,
  ).length;
  const jointCount = combined.filter(
    (v) => v.visitType === "double" || v.doubleWithUserId === currentUser.id,
  ).length;

  if (summaryBar) {
    summaryBar.innerHTML = `
      <div class="timeline-stat-chip">
        <span>${trans.totalEventsToday}</span>
        <strong style="color: var(--primary, #0d6efd); font-size: 1.1rem; margin: 0 6px;">${totalItems}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot actual" style="display:inline-block; vertical-align:middle; width:8px; height:8px; border-radius:50%; background:#f59e0b; margin-inline-end:4px;"></span>
        <span>${trans.actualActivities}</span>
        <strong style="color: #b45309; font-size: 1.1rem; margin: 0 6px;">${actualCount}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot planned" style="display:inline-block; vertical-align:middle; width:8px; height:8px; border-radius:50%; background:#0d6efd; margin-inline-end:4px;"></span>
        <span>${trans.fromPlanStat}</span>
        <strong style="color: #0284c7; font-size: 1.1rem; margin: 0 6px;">${plannedCount}</strong>
      </div>
      ${
        isManager
          ? `
      <div class="timeline-stat-chip">
        <span class="legend-dot joint" style="display:inline-block; vertical-align:middle; width:8px; height:8px; border-radius:50%; background:#6f42c1; margin-inline-end:4px;"></span>
        <span>${trans.jointVisitsCount}</span>
        <strong style="color: #6f42c1; font-size: 1.1rem; margin: 0 6px;">${jointCount}</strong>
      </div>`
          : ""
      }
    `;
  }

  if (combined.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty-card" style="text-align: center; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-sm);">
        <span style="font-size: 2.5rem;">📅</span>
        <h4 class="timeline-target-title" style="margin: 10px 0 4px;">${trans.noTimelineEvents}</h4>
        <p class="timeline-meta-row" style="margin-top: 4px;">${trans.selectAnotherDate}</p>
      </div>
    `;
    return;
  }

  const sortedTimeline = combined.sort((a, b) =>
    (a.time || "00:00").localeCompare(b.time || "00:00"),
  );

  sortedTimeline.forEach((v) => {
    const isActivity = v.type === "activity";
    const isJoint = v.visitType === "double" || !!v.doubleWithUserId;
    const isActual = v.source === "actual" || !!v.isActual;

    let borderClass = "planned-border";
    let dotClass = "planned";
    let badgeClass = "planned";
    let badgeLabel = trans.plannedExecuted;

    if (isActivity) {
      borderClass = "actual-border";
      dotClass = "actual";
      badgeClass = "actual";
      badgeLabel = trans.loggedActivity;
    } else if (isJoint) {
      borderClass = "joint-border";
      dotClass = "joint";
      badgeClass = "joint";
      badgeLabel = trans.jointVisitBadge;
    } else if (isActual) {
      borderClass = "actual-border";
      dotClass = "actual";
      badgeClass = "actual";
      badgeLabel = trans.directActual;
    }

    let icon = "👨‍⚕️";
    if (isActivity) {
      icon = "📝";
    } else if (
      v.targetType === "hospital" ||
      (v.period && v.period.toLowerCase() === "am") ||
      (v.doctorId && v.doctorId.toString().startsWith("h"))
    ) {
      icon = "🏥";
    } else if (
      v.targetType === "pharmacy" ||
      (v.doctorId && v.doctorId.toString().startsWith("pharm"))
    ) {
      icon = "💊";
    }

    const allDocs = getMockDoctors();
    const allHosps = getMockHospitals();
    const doc =
      allDocs.find((d) => d.name === v.doctorName || d.id === v.doctorId) ||
      allHosps.find((h) => h.name === v.doctorName || h.id === v.doctorId);

    const specialtyText =
      v.specialty || (doc ? doc.specialty || doc.address : "General");
    const classText = v.class || (doc ? doc.class : "A");

    const repUser = allUsers.find((u) => u.id === v.repId);
    const repDisplayName =
      v.repName || (repUser ? repUser.name : "Medical Rep");

    const repRoleLabel =
      repUser && repUser.role === "district_manager"
        ? lang === "ar"
          ? "مدير المنطقة"
          : "DM"
        : repUser && repUser.role === "line_manager"
          ? lang === "ar"
            ? "مدير الخط"
            : "LM"
          : lang === "ar"
            ? "المندوب"
            : "Rep";

    let accompanimentNote = "";
    if (isJoint) {
      let partnerName = v.doubleWithUserName;
      if (!partnerName && v.doubleWithUserId) {
        const partnerUser = allUsers.find((u) => u.id === v.doubleWithUserId);
        if (partnerUser) partnerName = partnerUser.name;
      }
      if (!partnerName) {
        partnerName =
          v.repId === currentUser.id ? "Team Rep" : currentUser.name;
      }
      accompanimentNote = ` • <span style="color: var(--purple, #6f42c1); font-weight: 700;">🤝 ${lang === "ar" ? "نزول مشترك مع:" : "Co-visiting with:"} ${esc(partnerName)}</span>`;
    } else if (repUser && repUser.role === "district_manager") {
      accompanimentNote = ` • <span style="color: #b45309; font-weight: 700;">👔 ${trans.supervisoryVisit}</span>`;
    } else if (repUser && repUser.role === "line_manager") {
      accompanimentNote = ` • <span style="color: #b45309; font-weight: 700;">👔 ${lang === "ar" ? "زيارة إشرافية (LM)" : "Supervisory Visit (LM)"}</span>`;
    } else if (v.repId === currentUser.id && isManager) {
      accompanimentNote = ` • <span style="color: #b45309; font-weight: 700;">👔 ${trans.supervisoryVisit}</span>`;
    }

    const card = document.createElement("div");
    card.className = "timeline-event-card";
    card.innerHTML = `
      <div class="timeline-time-col">
        <span>${v.time || "10:00"}</span>
        <span style="font-size: 0.72rem; color: var(--gray-400);">${(v.period || "PM").toUpperCase()}</span>
        <div class="timeline-icon-dot ${dotClass}">
          ${icon}
        </div>
      </div>
      <div class="timeline-content-box ${borderClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <strong class="timeline-target-title">${esc(v.doctorName)}</strong>
          <span class="visit-badge-pill ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="timeline-meta-row">
          <span>🩺 ${esc(specialtyText)}</span> • <span>Class: <strong>${esc(classText)}</strong></span> • <span>${repRoleLabel}: <strong>${esc(repDisplayName)}</strong></span>${accompanimentNote}
        </div>
        ${
          v.products && v.products.length > 0
            ? `<div style="font-size: 0.8rem; color: var(--primary); margin-bottom: 6px;">📦 <strong>${lang === "ar" ? "المنتجات:" : "Products:"}</strong> ${v.products.map((p) => esc(p)).join(", ")}</div>`
            : ""
        }
        ${
          v.comment
            ? `<div class="timeline-comment-text" style="font-size: 0.8rem; margin-bottom: 6px; font-style: italic;">💬 "${esc(v.comment)}"</div>`
            : ""
        }
        <div class="timeline-timestamp-chip">
          ⏰ <strong>${trans.entryTimestamp}</strong> ${v.date} at ${v.time || "10:00"} ${(v.period || "PM").toUpperCase()}
        </div>
        ${
          !isActivity &&
          v.status === "planned" &&
          (!isManager || v.repId === currentUser.id)
            ? `
          <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" style="padding: 5px 16px; font-size: 0.82rem; border-radius: 6px; font-weight: 700;" onclick="openCompleteModal('${v.id}')">
              ✓ ${trans.btnComplete}
            </button>
            ${
              canDeleteVisit(v)
                ? `<button type="button" class="btn-outline-danger" style="padding: 5px 12px; font-size: 0.82rem; border-radius: 6px;" onclick="confirmDeleteVisit('${v.id}')">🗑️ ${trans.btnDelete}</button>`
                : ""
            }
          </div>
        `
            : !isActivity && canDeleteVisit(v)
              ? `
          <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-outline-danger" style="padding: 5px 12px; font-size: 0.82rem; border-radius: 6px;" onclick="confirmDeleteVisit('${v.id}')">🗑️ ${trans.btnDelete}</button>
          </div>
        `
              : ""
        }
      </div>
    `;
    container.appendChild(card);
  });
}

function populateVisitProducts(selectedProducts = []) {
  const container = document.getElementById("visitProducts");
  if (!container) return;

  container.replaceChildren();

  const allLines = window.store && window.store.productLines
    ? window.store.productLines.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

  const currentUser = window.checkAuth ? window.checkAuth() : null;
  const userLineIds = currentUser
    ? (window.store && window.store.users.getById(currentUser.id))?.lineIds || []
    : [];

  const linesToShow = userLineIds.length > 0
    ? allLines.filter((l) => userLineIds.includes(l.id))
    : allLines;

  let productsToShow = [];
  linesToShow.forEach((line) => {
    if (line.products) productsToShow.push(...line.products);
  });

  if (productsToShow.length === 0) {
    container.innerHTML =
      '<span style="font-size: 0.85rem; color: var(--gray-500);">No products available. Add some in the Products page.</span>';
    return;
  }

  productsToShow.forEach((prod) => {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    label.style.cssText =
      "display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 8px;";
    const displayName =
      prod.dosage &&
      !prod.name.toLowerCase().includes(prod.dosage.toLowerCase())
        ? `${prod.name} ${prod.dosage}`
        : prod.name;
    const isChecked =
      Array.isArray(selectedProducts) &&
      (selectedProducts.includes(displayName) ||
        selectedProducts.includes(prod.name));
    label.innerHTML = `<input type="checkbox" value="${displayName}" ${isChecked ? "checked" : ""}> ${displayName}`;
    container.appendChild(label);
  });
}

function populateVisitCompanions(targetId, selectedCompanions = []) {
  const container = document.getElementById("visitManagersGroup");
  if (!container) return;
  container.replaceChildren();

  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const managerRoles = ["district_manager", "line_manager", "business_unit"];
  let managers = [];

  const effectiveId = targetId || currentUser.id || "rep1";
  let chain = [];
  if (typeof window.getManagerChain === "function") {
    chain = window.getManagerChain(effectiveId);
  } else {
    let curr = users.find((u) => u.id === effectiveId);
    while (curr && curr.managerId) {
      curr = users.find((u) => u.id === curr.managerId);
      if (curr) chain.push(curr);
    }
  }

  managers = chain.filter(
    (u) =>
      managerRoles.includes(u.role) &&
      u.status !== "Inactive" &&
      u.id !== effectiveId &&
      u.id !== currentUser.id,
  );

  if (managers.length === 0) {
    container.innerHTML = `<span style="font-size: 0.82rem; color: var(--gray-500); font-style: italic;">No higher manager available for companion selection.</span>`;
    return;
  }

  const roleTags = {
    district_manager: "DM",
    line_manager: "LM",
    business_unit: "BU",
  };

  managers.forEach((m) => {
    const tag = roleTags[m.role] || "Mgr";
    const val = `${m.name} (${tag})`;
    const isChecked =
      Array.isArray(selectedCompanions) &&
      selectedCompanions.some((c) => c.includes(m.name));
    const lbl = document.createElement("label");
    lbl.className = "checkbox-label";
    lbl.style.cssText =
      "display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 8px;";
    lbl.innerHTML = `<input type="checkbox" name="doubleCompanion" value="${val}" ${isChecked ? "checked" : ""}> ${val}`;
    container.appendChild(lbl);
  });
}

function openVisitModal(isActual = false) {
  currentEditVisitId = null;
  populateVisitProducts([]);
  populateVisitCompanions(currentUser.id, []);

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;

  const titleEl = document.getElementById("visitModalTitle");
  if (titleEl) {
    titleEl.innerText = isActual ? trans.logActualVisit : trans.modalAddVisit;
  }

  document.getElementById("visitDate").value = todayStr;

  const now = new Date();
  const timeInput = document.getElementById("visitTime");
  if (timeInput) {
    timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  updateVisitModalDayDisplay();

  document.getElementById("visitComment").value = "";
  document
    .querySelectorAll('#visitProducts input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  const singleRadio = document.querySelector(
    'input[name="visitType"][value="single"]',
  );
  if (singleRadio) singleRadio.checked = true;
  toggleDoubleVisit();

  const radioPharm = document.getElementById("radioPharmacyLabel");
  if (radioPharm) {
    radioPharm.style.display = isActual ? "inline-flex" : "none";
  }

  const pmRadio = document.querySelector(
    'input[name="visitPeriod"][value="pm"]',
  );
  if (pmRadio) pmRadio.checked = true;

  updateTargetOptions();

  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.dataset.source = isActual ? "actual" : "plan";
    modal.classList.add("active");
    modal.style.display = "flex";
  }
}

function updateTargetOptions() {
  const period =
    document.querySelector('input[name="visitPeriod"]:checked')?.value || "pm";
  const targetSelect = document.getElementById("visitTarget");
  const targetLabel = document.getElementById("visitTargetLabel");
  if (!targetSelect) return;
  targetSelect.replaceChildren();

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  let options = [];
  if (period.toLowerCase() === "am") {
    options = getMockHospitals();
    if (targetLabel) targetLabel.textContent = isAr ? "المستشفى" : "Hospital";
  } else if (period.toLowerCase() === "pharmacy") {
    options = getMockPharmacies();
    if (targetLabel) targetLabel.textContent = isAr ? "الصيدلية" : "Pharmacy";
  } else {
    options = getMockDoctors();
    if (targetLabel) targetLabel.textContent = isAr ? "الطبيب" : "Doctor";
  }

  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.id;
    o.textContent = opt.name;
    targetSelect.appendChild(o);
  });
}

function toggleDoubleVisit() {
  const checked = document.querySelector('input[name="visitType"]:checked');
  const doubleSection = document.getElementById("doubleManagerSection");
  if (checked && doubleSection) {
    doubleSection.style.display = checked.value === "double" ? "block" : "none";
  }
}

function openCompleteModal(visitId) {
  currentEditVisitId = visitId;
  const visit = demoVisits.find((v) => v.id === visitId);
  if (!visit) return;
  populateVisitProducts(visit.products || []);
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;
  document.getElementById("visitModalTitle").innerText =
    trans.modalCompleteVisit;

  document.getElementById("visitDate").value = visit.date || todayStr;
  const timeInput = document.getElementById("visitTime");
  if (timeInput) {
    const now = new Date();
    timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  updateVisitModalDayDisplay();

  const periodValue =
    visit.targetType === "pharmacy" ||
    (visit.doctorId && visit.doctorId.startsWith("pharm"))
      ? "pharmacy"
      : (visit.period || "pm").toLowerCase();

  const periodEl = document.querySelector(
    `input[name="visitPeriod"][value="${periodValue}"]`,
  );
  if (periodEl) periodEl.checked = true;
  updateTargetOptions();

  document.getElementById("visitTarget").value = visit.doctorId;

  if (visit.visitType) {
    const typeEl = document.querySelector(
      `input[name="visitType"][value="${visit.visitType}"]`,
    );
    if (typeEl) typeEl.checked = true;
  } else {
    const singleRadio = document.querySelector('input[name="visitType"][value="single"]');
    if (singleRadio) singleRadio.checked = true;
  }
  toggleDoubleVisit();

  const compList = visit.doubleWithUserName
    ? visit.doubleWithUserName.split(", ")
    : [];
  populateVisitCompanions(visit.repId || currentUser.id || "rep1", compList);

  document.getElementById("visitComment").value = visit.comment || "";

  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.dataset.source = "plan";
    modal.classList.add("active");
    modal.style.display = "flex";
  }
}

function closeVisitModal() {
  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function saveVisit() {
  const timeInput = document.getElementById("visitTime");
  const visitTime = timeInput && timeInput.value ? timeInput.value : "11:00";
  const dateInput = document.getElementById("visitDate");
  const visitDate = dateInput && dateInput.value ? dateInput.value : todayStr;
  const modalSource =
    document.getElementById("visitModal").dataset.source || "actual";

  const typeChecked = document.querySelector('input[name="visitType"]:checked');
  const visitType = typeChecked ? typeChecked.value : "single";
  let doubleWithUserName = "";
  let doubleWithUserId = null;

  if (visitType === "double") {
    const companionCbs = Array.from(
      document.querySelectorAll('#visitManagersGroup input[name="doubleCompanion"]:checked'),
    );
    doubleWithUserName = companionCbs.map((cb) => cb.value).join(", ");
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const matchedMgr = allUsers.find((u) =>
      companionCbs.some((cb) => cb.value.includes(u.name)),
    );
    if (matchedMgr) doubleWithUserId = matchedMgr.id;
  }

  const selectedProducts = Array.from(
    document.querySelectorAll(
      '#visitProducts input[type="checkbox"]:checked',
    ),
  ).map((cb) => cb.value);

  if (currentEditVisitId) {
    const visit = demoVisits.find((v) => v.id === currentEditVisitId);
    if (visit) {
      visit.status = "completed";
      visit.date = visitDate;
      visit.time = visitTime;
      visit.entryDate = visitDate;
      visit.comment = document.getElementById("visitComment").value;
      visit.visitType = visitType;
      visit.doubleWithUserName = doubleWithUserName;
      if (doubleWithUserId) {
        visit.doubleWithUserId = doubleWithUserId;
      } else if (visitType === "single") {
        delete visit.doubleWithUserId;
      }
      visit.products = selectedProducts;
    }
  } else {
    const period =
      document.querySelector('input[name="visitPeriod"]:checked')?.value ||
      "pm";
    const targetSelect = document.getElementById("visitTarget");
    const targetId = targetSelect.value;
    const targetName =
      targetSelect.options[targetSelect.selectedIndex]?.text ||
      "Doctor/Hospital/Pharmacy";

    let assignedRepId = currentUser.id;
    const isPharmacy = period.toLowerCase() === "pharmacy";

    const newVisit = {
      id: "v_" + Date.now(),
      repId: assignedRepId,
      doctorId: targetId,
      doctorName: targetName,
      date: visitDate,
      time: visitTime,
      period: isPharmacy ? "pm" : period,
      targetType: isPharmacy
        ? "pharmacy"
        : period.toLowerCase() === "am"
          ? "hospital"
          : "doctor",
      visitType: visitType,
      doubleWithUserName: doubleWithUserName,
      doubleWithUserId: doubleWithUserId || undefined,
      products: selectedProducts,
      comment: document.getElementById("visitComment").value,
      status: "completed",
      source: modalSource,
      createdAt: new Date().toISOString(),
      entryDate: visitDate,
    };
    demoVisits.unshift(newVisit);
  }

  persistVisits();
  closeVisitModal();
  renderVisits(true);

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const successMsg =
    lang === "ar"
      ? "تم تسجيل وحفظ الزيارة بنجاح."
      : "Visit saved successfully.";
  showToast(successMsg, "success");
}

// ============================================================================
// Section 9: Export Visits to CSV/Excel & Print
// ============================================================================
function exportVisitsToCSV() {
  const fDate = document.getElementById("filterDate")?.value;
  const fStatus = document.getElementById("filterStatus")?.value;
  const fPeriod = document.getElementById("filterPeriod")?.value;
  const fClass = document.getElementById("filterClass")?.value;

  let filtered = getScopedVisits();

  if (fDate) filtered = filtered.filter((v) => v.date === fDate);
  if (fStatus && fStatus !== "all")
    filtered = filtered.filter((v) => v.status === fStatus);
  if (fPeriod && fPeriod !== "all")
    filtered = filtered.filter(
      (v) => v.period.toLowerCase() === fPeriod.toLowerCase(),
    );
  if (fClass && fClass !== "all") {
    filtered = filtered.filter((v) => {
      const allDocs = getMockDoctors();
      const allHosps = getMockHospitals();
      const doc = allDocs.find(
        (d) => d.name === v.doctorName || d.id === v.doctorId,
      );
      const hosp = allHosps.find(
        (h) => h.name === v.doctorName || h.id === v.doctorId,
      );
      if (fClass === "all_doctors") {
        return !!doc && (doc.class === "A" || doc.class === "B");
      }
      if (fClass === "hospital") {
        return (
          !!hosp ||
          (v.period && v.period.toLowerCase() === "am") ||
          (v.doctorId && v.doctorId.toString().startsWith("h"))
        );
      }
      if (fClass === "pharmacy") {
        return (
          v.targetType === "pharmacy" ||
          (v.doctorId && v.doctorId.toString().startsWith("pharm"))
        );
      }
      return doc && doc.class === fClass;
    });
  }

  let csv =
    "Target Name,Date,Time,Period,Type,Status,Source,Rep ID,Products,Comment\n";
  filtered.forEach((v) => {
    const prods = (v.products || []).join("; ");
    csv += `"${v.doctorName || ""}","${v.date || ""}","${v.time || ""}","${(v.period || "").toUpperCase()}","${v.visitType || "single"}","${v.status || ""}","${v.source || ""}","${v.repId || ""}","${prods}","${(v.comment || "").replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PharmaCare_Visits_${fDate || "All"}.csv`;
  a.click();
}

function printVisitsReport() {
  window.print();
}

Object.assign(visitsApp, {
  confirmDeleteVisit(visitId) {
    const visit = demoVisits.find((v) => v.id === visitId);
    if (!visit) return;

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

    if (!canDeleteVisit(visit)) {
      return;
    }

    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const repUser = allUsers.find((u) => u.id === visit.repId);
    const repName = repUser
      ? `${repUser.name} (${repUser.role === "line_manager" ? "LM" : repUser.role === "district_manager" ? "DM" : "Rep"})`
      : visit.repId || "";

    const confirmMsg =
      lang === "ar"
        ? `هل أنت متأكد من حذف هذه الزيارة نهائياً من سجلات النظام؟\n\n• الهدف: ${visit.doctorName}\n• مسجلة بواسطة: ${repName}\n• التاريخ: ${visit.date}`
        : `Are you sure you want to permanently delete this visit record?\n\n• Target: ${visit.doctorName}\n• Logged by: ${repName}\n• Date: ${visit.date}`;

    if (!confirm(confirmMsg)) return;

    demoVisits = demoVisits.filter((v) => v.id !== visitId);
    persistVisits();

    try {
      const repDataStr = localStorage.getItem("pharma_reports_data");
      if (repDataStr) {
        const repData = JSON.parse(repDataStr);
        if (Array.isArray(repData.visits)) {
          repData.visits = repData.visits.filter((v) => v.id !== visitId);
          localStorage.setItem("pharma_reports_data", JSON.stringify(repData));
        }
      }
    } catch (e) {
      console.error("Error updating pharma_reports_data on visit deletion:", e);
    }

    renderVisits();
    showToast(
      lang === "ar" ? "تم حذف الزيارة بنجاح." : "Visit deleted successfully.",
      "success",
    );
  },

  openVisitModal,
  closeVisitModal,
  openCompleteModal,
  saveVisit,
  exportVisitsToCSV,
  printVisitsReport,
  renderVisits,
  renderVisitsTimeline,
});

window.visitsApp = visitsApp;

window.confirmDeleteVisit = confirmDeleteVisit;
window.openVisitModal = openVisitModal;
window.closeVisitModal = closeVisitModal;
window.openCompleteModal = openCompleteModal;
window.saveVisit = saveVisit;
window.exportVisitsToCSV = exportVisitsToCSV;
window.printVisitsReport = printVisitsReport;
window.renderVisits = renderVisits;
window.renderVisitsTimeline = renderVisitsTimeline;