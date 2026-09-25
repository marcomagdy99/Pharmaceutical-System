/**
 * @file activities-core.js
 * @description Core State, Constants, Bilingual Dictionary, Store Integration & Security Guard
 */

(function (window) {
  "use strict";

  // ============================================================================
  // 1. Semantic Enums & Constants
  // ============================================================================
  const DAYS_OF_WEEK = Object.freeze({
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  });

  const WEEK_DAY_KEYS = Object.freeze(["sat", "sun", "mon", "tue", "wed", "thu", "fri"]);

  const REQUEST_STATUS = Object.freeze({
    PENDING_DM: "pending_dm",
    PENDING_LM: "pending_lm",
    PENDING_HR: "pending_hr",
    PENDING_SHARED: "pending_shared",
    APPROVED: "approved",
    REJECTED: "rejected",
    DISBURSED: "disbursed",
  });

  const ACTIVITY_TYPES = Object.freeze({
    VISIT: "Visit",
    OFFICE_WORK: "Office Work",
    TRAINING: "Training",
    MEETING: "Meeting",
    CONFERENCE: "Conference",
  });

  const PERIODS = Object.freeze({
    AM: "AM",
    PM: "PM",
  });

  const TABS = Object.freeze({
    ACTIVITIES: "tab-activities",
    EXPENSES: "tab-expenses",
    SERVICES: "tab-services",
    BUDGET: "tab-budget",
  });

  const ROLES = Object.freeze({
    REP: "medical_rep",
    REP_ALT: "rep",
    DM: "district_manager",
    LM: "line_manager",
    BU: "business_unit",
    HR: "hr",
    ADMIN: "admin",
  });

  // ============================================================================
  // 2. Comprehensive Bilingual Dictionary
  // ============================================================================
  const activityTranslations = {
    en: {
      activitiesTitle: "PharmaCare - Field Requests",
      dailyActivities: "Daily Activities",
      tabDailyActivities: "Daily Activities",
      tabExpenses: "Request Expenses",
      tabServices: "Request Services",
      tabSalesBudget: "Sales Budget",
      today: "Today",
      amPeriod: "AM Period",
      pmPeriod: "PM Period",
      logActivity: "Log Activity",
      logActivityTitle: "Log Activity",
      weeklyOverview: "Weekly Overview (Sat - Fri)",
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
      deleteActivity: "Delete Activity",
      confirmDeleteActivity: "Are you sure you want to delete this activity?",
      activityDeleted: "Activity cleared successfully.",
      selectActivityTypeWarning: "Please select an activity type.",
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
      dayOff: "Day Off",

      // Expenses Tab
      expensesTitle: "Travel & Field Expenses",
      expensesSubtitle: "Manage field travel, fuel, tolls, and hospitality claims with hierarchical approval.",
      btnNewExpense: "New Expense Claim",
      pendingApproval: "Pending Approvals",
      approvedExpenses: "Approved Claims",
      disbursedExpenses: "Disbursed / Paid",
      allStatuses: "All Statuses",
      filterPending: "Pending Review",
      filterApproved: "Approved",
      filterRejected: "Rejected",
      filterDisbursed: "Disbursed",
      allCategories: "All Categories",
      catTravel: "Travel & Transportation",
      catFuelTolls: "Fuel & Road Tolls",
      catHospitality: "Hospitality & Meetings",
      catHotel: "Hotel Accommodation",
      colDate: "Date",
      colEmployee: "Employee",
      colCategory: "Category",
      colAmount: "Amount",
      colReceipt: "Receipt",
      colStatus: "Approval Status",
      colActions: "Actions",
      modalNewExpenseTitle: "Submit Travel & Field Expense",
      receiptHelp: "Take photo or attach clear invoice image.",
      btnSubmitClaim: "Submit Claim",
      noExpensesFound: "No expense claims found matching your filter.",

      // Services Tab
      servicesTitle: "Doctor & Hospital Services",
      servicesSubtitle: "Sponsor medical congresses, clinic awareness materials, and round table discussions.",
      btnNewService: "New Service Request",
      allocatedBudgetOverview: "Allocated Promo Budget",
      lineFilterLabel: "Line:",
      filterEmployee: "Employee:",
      allEmployees: "All Employees",
      totalAllocatedBudget: "Total Budget",
      districtBudget: "District Budget",
      distributedToDms: "Distributed to DMs",
      approvedSpent: "Approved & Utilized",
      pendingServices: "Pending In Requests",
      remainingBudget: "Remaining Balance",
      distributeToDmsTitle: "Distribute Line Budget to District Managers (DMs)",
      distributeToDmsSubtitle: "Allocate portions of your received line budget to each DM under your line.",
      saveAllocations: "Save Allocations",
      distributeToRepsTitle: "Distribute District Budget to Medical Reps",
      distributeToRepsSubtitle: "Allocate portions of your received district budget to each Medical Rep under your district.",
      saveRepsAllocations: "Save Reps Allocations",
      colDm: "District Manager (DM)",
      colRep: "Medical Rep",
      colCode: "Code",
      colAllocatedAmount: "Allocated Budget (EGP)",
      colUtilized: "Utilized",
      distributedToReps: "Distributed to Reps",
      myAllocatedBudget: "My Allocated Budget",
      savedRepBudgetMessage: "Medical Reps budget allocations updated successfully!",
      unauthorizedRepBudgetAction: "You are not authorized to modify Medical Rep budget allocations.",
      allDepts: "All Departments",
      deptSales: "Sales Services",
      deptMarketing: "Marketing Services",
      colLine: "Line",
      colDept: "Dept",
      colArea: "Area",
      colShiftTarget: "Shift & Target",
      colService: "Service Title",
      colCost: "Estimated Cost",
      colShift: "Shift Period",
      modalNewServiceTitle: "New Doctor / Hospital Service Request",
      targetHospital: "Target Hospital / Center",
      targetDoctor: "Target Doctor",
      serviceTitleLabel: "Service Type / Title",
      serviceDateLabel: "Expected Execution Date",
      btnSubmitService: "Submit Service Request",
      noServicesFound: "No service requests found matching your filter.",

      // Shared Services
      sharedServiceToggleLabel: "Split Cost across Multiple Lines / Territories",
      sharedSubtitle: "Distribute cost percentage across participating lines or territories",
      btnAddSharedLine: "Add Participating Line / Area",
      sharedPrimaryTitle: "Primary Line (Request Initiator)",
      sharedParticipatingTitle: "Participating Line",
      sharedLineLabel: "Product Line",
      sharedAreaLabel: "Territory / Area",
      sharedTotalCost: "Total Cost",
      sharedAllocated: "Allocated",
      sharedRemaining: "Remaining",
      sharedSelectLinePrompt: "-- Select Product Line --",
      sharedSelectAreaPrompt: "-- Select Area / Territory --",
      sharedAssignedRep: "Assigned Rep",
      sharedNoRepAssigned: "No Rep Assigned",
      sharedShare: "Share",
      sharedValidationComplete: "100% Fully Allocated",
      sharedValidationIncomplete: "Current Sum {pct}% (Remaining {rem}%)",
      sharedExceedsNotice: "Total share percentages cannot exceed 100%.",
      sharedBadge: "Shared Service",
      partnerBadge: "Partner Share",
      currency: "EGP",
      attachmentLabel: "Attachment",
      viewAttachment: "View Attachment",
      yourShare: "Your Share",
      sharedIntraLineBadge: "Intra-Line Share",
      serviceAttachmentLabel: "Quotation / Invoice Attachment (Optional)",
      noBudgetAllocated: "No promotional budget allocated for this product line. Please consult your manager.",
      budgetExceededNotice: "Requested service cost exceeds remaining promotional budget.",

      // Sales Budget Tab
      buBudgetTitle: "Sales Budget Allocation",
      buBudgetSubtitle: "Assign and allocate sales promo budgets per product line to Line Managers (LMs).",
      selectProductLine: "Product Line:",
      totalLineBudget: "Total Line Budget",
      allocatedToLms: "Allocated to LMs",
      unallocatedRemaining: "Unallocated Remaining",
      colLm: "Line Manager (LM)",
      colDistributedToDms: "Distributed to DMs",

      // Hierarchical Status Text
      waitingDmPrefix: "Waiting for DM: ",
      waitingLmPrefix: "Waiting for LM: ",
      waitingHr: "Waiting for HR",
      approvedLabel: "Approved",
      rejectedLabel: "Rejected",
      disbursedLabel: "Disbursed",
      statusPending: "Pending",

      // Decision Modal
      confirmApprovalTitle: "Confirm Approval",
      confirmRejectionTitle: "Confirm Rejection",
      confirmDisbursementTitle: "Confirm Disbursement",
      confirmApproveMsg: "Are you sure you want to approve this request of {amount} EGP submitted by {name}?",
      confirmRejectMsg: "Are you sure you want to reject this request submitted by {name}?",
      confirmDisburseMsg: "Confirm disbursement of {amount} EGP to {name}?",
      reasonLabel: "Reason / Notes:",
      reasonPlaceholder: "Enter reason or comments...",
      btnApprove: "Approve",
      btnReject: "Reject",
      btnDisburse: "Disburse Payment",
      rejectionReasonRequired: "Please provide a rejection reason.",
      successAction: "Operation completed successfully!",
      savedBudgetMessage: "Budget allocations updated successfully!",
      insufficientBudgetNotice: "Notice: Requested cost exceeds the current remaining balance.",
      noReceipt: "No receipt attached",
      allLines: "All Product Lines",
      allEmployees: "All Employees",
      myRequestsOnly: "My Requests Only",
      dayOff: "Day Off"
    },
    ar: {
      activitiesTitle: "فارماكير - الطلبات الميدانية",
      dailyActivities: "الأنشطة اليومية",
      tabDailyActivities: "الأنشطة اليومية",
      tabExpenses: "نفقات ومصاريف العمل",
      tabServices: "خدمات الدكاترة والمستشفيات",
      tabSalesBudget: "ميزانية المبيعات (Budget)",
      today: "اليوم",
      amPeriod: "فترة الصباح",
      pmPeriod: "فترة المساء",
      logActivity: "تسجيل نشاط",
      logActivityTitle: "تسجيل نشاط",
      weeklyOverview: "نظرة عامة أسبوعية (السبت - الجمعة)",
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
      deleteActivity: "حذف النشاط",
      confirmDeleteActivity: "هل أنت متأكد من حذف هذا النشاط؟",
      activityDeleted: "تم حذف النشاط بنجاح.",
      selectActivityTypeWarning: "يرجى اختيار نوع النشاط أولاً.",
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
      dayOff: "إجازة أسبوعية",

      // Expenses Tab
      expensesTitle: "نفقات ومصاريف الميدان والسفر",
      expensesSubtitle: "إدارة مطالبات السفر، الانتقالات، البنزين، الكارتات، والضيافة بسلسلة موافقات دقيقة.",
      btnNewExpense: "مطالبة نفقات جديدة",
      pendingApproval: "في انتظار الموافقة",
      approvedExpenses: "المطالبات المعتمدة",
      disbursedExpenses: "المنصرف / المدفوع",
      allStatuses: "كل الحالات",
      filterPending: "قيد المراجعة",
      filterApproved: "معتمد",
      filterRejected: "مرفوض",
      filterDisbursed: "تم الصرف",
      allCategories: "كل البنود",
      catTravel: "انتقالات وسفر",
      catFuelTolls: "كارتات وبنزين",
      catHospitality: "ضيافة واجتماعات",
      catHotel: "إقامة فندقية",
      colDate: "التاريخ",
      colEmployee: "الموظف",
      colCategory: "بند النفقة",
      colAmount: "المبلغ",
      colReceipt: "الفاتورة / الإيصال",
      colStatus: "حالة الاعتماد",
      colActions: "إجراءات",
      modalNewExpenseTitle: "تسجيل مطالبة نفقات ميدانية",
      receiptHelp: "التقط صورة واضحة للفاتورة أو الإيصال أو أرفقها من جهازك.",
      btnSubmitClaim: "إرسال المطالبة",
      noExpensesFound: "لا توجد مطالبات نفقات مطابقة للفلتر المحدد.",

      // Services Tab
      servicesTitle: "خدمات ورعاية الدكاترة والمستشفيات",
      servicesSubtitle: "تمويل المؤتمرات الطبية، بروشورات التوعية للعيادات، والموائد المستديرة مع الأطباء.",
      btnNewService: "طلب خدمة / رعاية جديدة",
      allocatedBudgetOverview: "الميزانية المخصصة للترويج",
      lineFilterLabel: "اللاين:",
      filterEmployee: "الموظف:",
      allEmployees: "كل الموظفين",
      totalAllocatedBudget: "إجمالي الميزانية",
      districtBudget: "ميزانية المنطقة",
      distributedToDms: "الموزع على الـ DMs",
      approvedSpent: "المعتمد والمستهلك",
      pendingServices: "معلق في الطلبات",
      remainingBudget: "الرصيد المتبقي",
      distributeToDmsTitle: "توزيع ميزانية اللاين على مديري المناطق (DMs)",
      distributeToDmsSubtitle: "توزيع مخصصات من ميزانيتك المعتمدة على الـ DMs التابعين للاين.",
      saveAllocations: "حفظ المخصصات",
      distributeToRepsTitle: "توزيع ميزانية المنطقة على المندوبين (Medical Reps)",
      distributeToRepsSubtitle: "تحديد ميزانية لكل مندوب طبي تابع لمنطقتك وخط الإنتاج.",
      saveRepsAllocations: "حفظ مخصصات المندوبين",
      colDm: "مدير المنطقة (DM)",
      colRep: "المندوب الطبي (Medical Rep)",
      colCode: "الكود",
      colAllocatedAmount: "الميزانية المخصصة (ج.م)",
      colUtilized: "المستهلك",
      distributedToReps: "الموزع على المندوبين",
      myAllocatedBudget: "ميزانيتي المعتمدة",
      savedRepBudgetMessage: "تم حفظ مخصصات المندوبين بنجاح.",
      unauthorizedRepBudgetAction: "غير مصرح لك بتعديل مخصصات المندوبين.",
      allDepts: "كل الأقسام",
      deptSales: "خدمات المبيعات (Sales)",
      deptMarketing: "خدمات التسويق (Marketing)",
      colLine: "اللاين",
      colDept: "القسم",
      colArea: "المنطقة",
      colShiftTarget: "الفترة والجهة",
      colService: "اسم الخدمة",
      colCost: "التكلفة التقديرية",
      colShift: "الفترة",
      modalNewServiceTitle: "طلب رعاية / خدمة جديدة لطبيب أو مستشفى",
      targetHospital: "المستشفى / المركز المستهدف",
      targetDoctor: "الطبيب المستهدف",
      serviceTitleLabel: "نوع / اسم الخدمة",
      serviceDateLabel: "تاريخ التنفيذ المتوقع",
      btnSubmitService: "إرسال طلب الخدمة",
      noServicesFound: "لا توجد طلبات خدمات مطابقة للفلتر المحدد.",

      // Shared Services
      sharedServiceToggleLabel: "تقاسم التكلفة بين أكثر من خط / منطقة (Shared Multi-Line)",
      sharedSubtitle: "توزيع نسبة التكلفة والميزانية على أكثر من خط أو منطقة",
      btnAddSharedLine: "إضافة خط / منطقة مشاركة",
      sharedPrimaryTitle: "الخط الأساسي (المُنشئ للطلب)",
      sharedParticipatingTitle: "خط مشارك",
      sharedLineLabel: "خط الإنتاج",
      sharedAreaLabel: "المنطقة / الإقليم",
      sharedTotalCost: "إجمالي التكلفة",
      sharedAllocated: "الموزع",
      sharedRemaining: "المتبقي",
      sharedSelectLinePrompt: "-- اختر خط الإنتاج --",
      sharedSelectAreaPrompt: "-- اختر المنطقة التابعة --",
      sharedAssignedRep: "المندوب المسؤول",
      sharedNoRepAssigned: "لم يتم تعيين مندوب",
      sharedShare: "الحصة",
      sharedValidationComplete: "التوزيع مكتمل بنسبة 100%",
      sharedValidationIncomplete: "مجموع الحصص الحالي {pct}% (متبقي {rem}%)",
      sharedExceedsNotice: "مجموع الحصص لا يمكن أن يتجاوز 100%.",
      sharedBadge: "خدمة مشتركة",
      partnerBadge: "حصة شريكة",
      currency: "ج.م",
      attachmentLabel: "المرفق",
      viewAttachment: "عرض المرفق",
      yourShare: "حصتك",
      sharedIntraLineBadge: "مشاركة داخل اللاين",
      serviceAttachmentLabel: "مرفق عرض السعر / الفاتورة (اختياري)",
      noBudgetAllocated: "عفواً، لم يتم تخصيص ميزانية لخدمات الأطباء لهذا الخط بعد. يرجى مراجعة مدير المنطقة.",
      budgetExceededNotice: "عفواً، التكلفة المطلوبة تتجاوز الرصيد المتبقي من ميزانيتك المتاحة.",

      // Sales Budget Tab
      buBudgetTitle: "توزيع ميزانيات المبيعات (Sales Promo Budget)",
      buBudgetSubtitle: "تحديد وتوزيع ميزانيات الدعاية والخدمات لكل لاين على مديري الخطوط (LMs).",
      selectProductLine: "لاين المنتجات:",
      totalLineBudget: "إجمالي ميزانية اللاين",
      allocatedToLms: "الموزع على الـ LMs",
      unallocatedRemaining: "المتبقي غير الموزع",
      colLm: "مدير الخط (LM)",
      colDistributedToDms: "الموزع للـ DMs",

      // Hierarchical Status Text
      waitingDmPrefix: "في انتظار الـ DM: ",
      waitingLmPrefix: "في انتظار الـ LM: ",
      waitingHr: "في انتظار مراجعة وصرف الـ HR",
      approvedLabel: "معتمد",
      rejectedLabel: "مرفوض",
      disbursedLabel: "تم الصرف",
      statusPending: "قيد المراجعة",

      // Decision Modal
      confirmApprovalTitle: "تأكيد الموافقة والاعتماد",
      confirmRejectionTitle: "تأكيد رفض الطلب",
      confirmDisbursementTitle: "تأكيد الصرف المالي الفعلي",
      confirmApproveMsg: "هل أنت متأكد من اعتماد وموافقة هذا الطلب بقيمة {amount} ج.م والمقدم من {name}؟",
      confirmRejectMsg: "هل أنت متأكد من رفض هذا الطلب المقدم من {name}؟ يرجى كتابة سبب الرفض.",
      confirmDisburseMsg: "تأكيد الصرف المالي الفعلي لمبلغ {amount} ج.م للموظف {name}؟",
      reasonLabel: "السبب / ملاحظات:",
      reasonPlaceholder: "اكتب ملاحظاتك أو سبب الرفض...",
      btnApprove: "موافقة واعتماد",
      btnReject: "رفض الطلب",
      btnDisburse: "صرف المبلغ",
      rejectionReasonRequired: "يرجى كتابة سبب الرفض أولاً قبل المتابعة.",
      successAction: "تم تنفيذ الإجراء بنجاح!",
      savedBudgetMessage: "تم حفظ وتحديث توزيع الميزانيات بنجاح!",
      insufficientBudgetNotice: "تنبيه: تكلفة الطلب تتجاوز الرصيد المتاح حالياً بالميزانية.",
      noReceipt: "لا توجد فاتورة مرفقة",
      allLines: "جميع خطوط الإنتاج",
      allEmployees: "جميع الموظفين",
      myRequestsOnly: "طلباتي فقط",
      dayOff: "إجازة أسبوعية"
    }
  };

  // ============================================================================
  // 3. Pure Helpers & Utilities
  // ============================================================================
  function t(key) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const dict = activityTranslations[lang] || activityTranslations.en;
    return dict[key] !== undefined ? dict[key] : key;
  }

  function escapeHTML(str) {
    if (str == null) return "";
    return String(str).replace(/[&<>'"]/g, 
      (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function safeShowToast(msg, type = "info") {
    if (typeof showToast === "function") {
      showToast(msg, type);
    } else if (typeof window.showToast === "function") {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 1) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDate(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDateShort(date) {
    const d = new Date(date);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${m}`;
  }

  function getCategoryLabel(cat) {
    switch (cat) {
      case "travel": return t("catTravel");
      case "fuel_tolls": return t("catFuelTolls");
      case "hospitality": return t("catHospitality");
      case "hotel": return t("catHotel");
      default: return cat;
    }
  }

  // ============================================================================
  // 4. In-Memory Reactive Application State
  // ============================================================================
  const _state = {
    currentUser: null,
    currentDate: (window.getSystemDate && window.getSystemDate()) || new Date(),
    activeTab: TABS.ACTIVITIES,
    modalState: {
      isOpen: false,
      period: PERIODS.AM,
      date: null,
      type: "",
      notes: "",
      isEdit: false,
    },
    expenseFilter: {
      status: "all",
      category: "all",
    },
    serviceFilter: {
      dept: "all",
      status: "all",
      lineId: "all",
    },
    currentReceiptBase64: null,
    currentServiceFileBase64: null,
    pendingDecision: null,
    sharedLines: [],
  };

  // ============================================================================
  // 5. Store Integration Layer
  // ============================================================================
  const StoreAdapter = {
    getActivities(userId, dateStr) {
      if (window.store && window.store.activities) {
        return window.store.activities.get(userId, dateStr);
      }
      try {
        const raw = localStorage.getItem(`pharma_activities_data_${userId}`);
        const data = raw ? JSON.parse(raw) : {};
        return data[dateStr] || {};
      } catch (e) {
        return {};
      }
    },

    getAllActivitiesForUser(userId) {
      if (window.store && window.store.activities) {
        return window.store.activities.getAllForUser(userId);
      }
      try {
        const raw = localStorage.getItem(`pharma_activities_data_${userId}`);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },

    saveActivity(userId, dateStr, period, activityData) {
      if (window.store && window.store.activities) {
        return window.store.activities.save(userId, dateStr, period, activityData);
      }
      const all = this.getAllActivitiesForUser(userId);
      if (!all[dateStr]) all[dateStr] = {};
      all[dateStr][period] = activityData;
      try {
        localStorage.setItem(`pharma_activities_data_${userId}`, JSON.stringify(all));
      } catch (e) {}
      return activityData;
    },

    deleteActivity(userId, dateStr, period) {
      if (window.store && window.store.activities) {
        return window.store.activities.delete(userId, dateStr, period);
      }
      const all = this.getAllActivitiesForUser(userId);
      if (all[dateStr] && all[dateStr][period]) {
        delete all[dateStr][period];
        if (Object.keys(all[dateStr]).length === 0) delete all[dateStr];
        try {
          localStorage.setItem(`pharma_activities_data_${userId}`, JSON.stringify(all));
        } catch (e) {}
        return true;
      }
      return false;
    },

    getExpenses() {
      if (window.store && window.store.expenses) {
        return window.store.expenses.getAll();
      }
      try {
        const raw = localStorage.getItem("pharma_expenses_data");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    saveExpense(expObj) {
      if (window.store && window.store.expenses) {
        return window.store.expenses.add(expObj);
      }
      const list = this.getExpenses();
      list.unshift(expObj);
      try {
        localStorage.setItem("pharma_expenses_data", JSON.stringify(list));
      } catch (e) {}
      return expObj;
    },

    updateExpenseStatus(id, newStatus, user, comment, nextApproverId = null) {
      if (window.store && window.store.expenses) {
        return window.store.expenses.updateStatus(id, newStatus, user, comment, nextApproverId);
      }
      const list = this.getExpenses();
      const exp = list.find((e) => e.id === id);
      if (!exp) return null;
      exp.status = newStatus;
      if (nextApproverId !== undefined) {
        exp.nextApproverId = nextApproverId;
      }
      if (!exp.history) exp.history = [];
      exp.history.push({
        action: newStatus,
        at: new Date().toISOString(),
        by: user.id,
        role: user.role,
        comment: comment || "",
        nextApproverId: nextApproverId || null,
      });
      try {
        localStorage.setItem("pharma_expenses_data", JSON.stringify(list));
      } catch (e) {}
      return exp;
    },

    getServices() {
      if (window.store && window.store.services) {
        return window.store.services.getAll();
      }
      try {
        const raw = localStorage.getItem("pharma_services_data");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    saveService(srvObj) {
      if (window.store && window.store.services) {
        return window.store.services.add(srvObj);
      }
      const list = this.getServices();
      list.unshift(srvObj);
      try {
        localStorage.setItem("pharma_services_data", JSON.stringify(list));
      } catch (e) {}
      return srvObj;
    },

    updateServiceStatus(id, newStatus, user, comment, nextApproverId) {
      if (window.store && window.store.services) {
        return window.store.services.updateStatus(id, newStatus, user, comment, nextApproverId);
      }
      const list = this.getServices();
      const srv = list.find((s) => s.id === id);
      if (!srv) return null;
      srv.status = newStatus;
      if (nextApproverId !== undefined) srv.nextApproverId = nextApproverId;
      if (!srv.history) srv.history = [];
      srv.history.push({
        action: newStatus,
        at: new Date().toISOString(),
        by: user.id,
        role: user.role,
        comment: comment || "",
      });
      try {
        localStorage.setItem("pharma_services_data", JSON.stringify(list));
      } catch (e) {}
      return srv;
    },

    getBudgets() {
      let b = null;
      if (window.store && window.store.budgets) {
        b = window.store.budgets.getAll();
      }
      if (!b) {
        try {
          const raw = localStorage.getItem("pharma_sales_budgets");
          if (raw) b = JSON.parse(raw);
        } catch (e) {}
      }
      if (!b) {
        b = {
          line1: {
            totalBudget: 150000,
            lmAllocations: { lm1: 90000, lm2: 40000 },
            dmAllocations: { dm1: 50000, dm2: 30000 },
            repAllocations: { rep1: 25000, rep2: 20000 }
          },
          line2: {
            totalBudget: 100000,
            lmAllocations: { lm1: 60000, lm2: 40000 },
            dmAllocations: { dm3: 40000 },
            repAllocations: { rep4: 30000 }
          }
        };
      }

      let changed = false;
      const allUsers = getAllUsers();
      Object.keys(b).forEach((lId) => {
        if (!b[lId].repAllocations) b[lId].repAllocations = {};
        if (b[lId].dmAllocations) {
          Object.keys(b[lId].dmAllocations).forEach((dmId) => {
            const dmUser = allUsers.find((u) => u.id === dmId);
            if (dmUser) {
              const inLine = dmUser.lineIds && Array.isArray(dmUser.lineIds)
                ? dmUser.lineIds.includes(lId)
                : dmUser.lineId === lId;
              if (!inLine) {
                delete b[lId].dmAllocations[dmId];
                changed = true;
              }
            }
          });
        }
        if (b[lId].repAllocations) {
          Object.keys(b[lId].repAllocations).forEach((repId) => {
            const repUser = allUsers.find((u) => u.id === repId);
            if (repUser) {
              const inLine = repUser.lineIds && Array.isArray(repUser.lineIds)
                ? repUser.lineIds.includes(lId)
                : repUser.lineId === lId;
              if (!inLine) {
                delete b[lId].repAllocations[repId];
                changed = true;
              }
            }
          });
        }
      });
      if (changed) {
        try {
          localStorage.setItem("pharma_sales_budgets", JSON.stringify(b));
        } catch (e) {}
      }

      return b;
    },

    saveBudgets(budgetsObj) {
      if (window.store && window.store.budgets) {
        return window.store.budgets.saveAll(budgetsObj);
      }
      try {
        localStorage.setItem("pharma_sales_budgets", JSON.stringify(budgetsObj));
      } catch (e) {}
      return budgetsObj;
    }
  };

  // ============================================================================
  // 6. User, Line & Hierarchy Helpers with Role Tampering Protection
  // ============================================================================
  function getAllUsers() {
    return (window.store && window.store.users && window.store.users.getAll()) ||
           (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  }

  function getUserById(id) {
    return getAllUsers().find((u) => u.id === id);
  }

  function getAuthUser() {
    let u = null;
    if (typeof window.requireAuth === "function") {
      u = window.requireAuth();
    } else if (typeof window.checkAuth === "function") {
      u = window.checkAuth();
    }
    if (!u) {
      u = (window.DEMO_DATA && window.DEMO_DATA.currentUser) || {
        id: "rep1",
        role: ROLES.REP,
        name: "Ahmed Mostafa",
        nameAr: "أحمد مصطفى",
        lineIds: ["line1"],
        areaId: "area1",
      };
    }

    // =========================================================================
    // SECURITY INTEGRITY CHECK: Prevent Client-side Role Tampering
    // =========================================================================
    const canonicalUsers = getAllUsers();
    if (u && u.id && canonicalUsers.length > 0) {
      const canonical = canonicalUsers.find((user) => user.id === u.id);
      if (canonical) {
        if (canonical.role !== u.role) {
          console.warn(`[SECURITY VIOLATION] Role tampering detected for user '${u.id}'. Attempted: '${u.role}', Authentic: '${canonical.role}'. Enforcing authoritative role.`);
          u.role = canonical.role;
        }
        if (canonical.lineIds && (!u.lineIds || JSON.stringify(u.lineIds) !== JSON.stringify(canonical.lineIds))) {
          u.lineIds = [...canonical.lineIds];
        }
        if (canonical.managerId !== u.managerId) {
          u.managerId = canonical.managerId;
        }
        if (canonical.areaId !== u.areaId) {
          u.areaId = canonical.areaId;
        }
      }
    }

    return u;
  }

  function isActionAuthorized(action, resource, user) {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    if (role === ROLES.ADMIN) return true;

    if (action === "approve_service" || action === "reject_service") {
      if (!resource) return false;
      if (resource.requesterId === user.id) return false;
      if (role === ROLES.REP || role === ROLES.REP_ALT) return false;
      if (role === ROLES.DM) {
        if (resource.isShared && Array.isArray(resource.shares)) {
          return resource.shares.some(sh => sh.dmId === user.id && sh.status === REQUEST_STATUS.PENDING_DM);
        }
        return resource.status === REQUEST_STATUS.PENDING_DM && resource.nextApproverId === user.id;
      }
      if (role === ROLES.LM) {
        if (resource.isShared && Array.isArray(resource.shares)) {
          return resource.shares.some(sh => sh.lmId === user.id && sh.status === REQUEST_STATUS.PENDING_LM);
        }
        return resource.status === REQUEST_STATUS.PENDING_LM && resource.nextApproverId === user.id;
      }
      if (role === ROLES.BU) {
        if (resource.isShared && Array.isArray(resource.shares)) {
          return resource.shares.some(sh => sh.status && sh.status.startsWith("pending"));
        }
        return resource.status && resource.status.startsWith("pending");
      }
      return false;
    }

    if (action === "approve_expense" || action === "reject_expense") {
      if (!resource) return false;
      if (resource.requesterId === user.id) return false;
      if (role === ROLES.REP || role === ROLES.REP_ALT) return false;
      if (role === ROLES.DM) return resource.status === REQUEST_STATUS.PENDING_DM && resource.nextApproverId === user.id;
      if (role === ROLES.LM) return resource.status === REQUEST_STATUS.PENDING_LM && resource.nextApproverId === user.id;
      if (role === ROLES.HR) return resource.status === REQUEST_STATUS.PENDING_HR;
      if (role === ROLES.BU) return resource.status && resource.status.startsWith("pending");
      return false;
    }

    if (action === "disburse_expense") {
      if (!resource) return false;
      if (role !== ROLES.HR && role !== ROLES.ADMIN) return false;
      return resource.status === REQUEST_STATUS.APPROVED;
    }

    if (action === "allocate_bu_budget") {
      return role === ROLES.BU || role === ROLES.ADMIN;
    }

    if (action === "allocate_lm_budget") {
      return role === ROLES.LM || role === ROLES.BU || role === ROLES.ADMIN;
    }

    if (action === "allocate_dm_budget") {
      return role === ROLES.DM || role === ROLES.LM || role === ROLES.BU || role === ROLES.ADMIN;
    }

    return true;
  }

  function getUserDisplayName(id) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const user = getUserById(id);
    if (!user) return id || "-";
    return (lang === "ar" && user.nameAr) ? user.nameAr : user.name;
  }

  function getUserRoleLabel(role) {
    const r = (role || "").toLowerCase();
    switch (r) {
      case ROLES.REP:
      case ROLES.REP_ALT:
        return "Medical Rep";
      case ROLES.DM:
        return "District Manager (DM)";
      case ROLES.LM:
        return "Line Manager (LM)";
      case ROLES.BU:
        return "Business Unit Head (BU)";
      case ROLES.HR:
        return "Human Resources (HR)";
      case ROLES.ADMIN:
        return "Administrator";
      default:
        return role || "Employee";
    }
  }

  function getAllProductLines() {
    const storeLines = window.store && window.store.productLines && typeof window.store.productLines.getAll === "function"
      ? window.store.productLines.getAll()
      : null;
    return storeLines || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [
      { id: "line1", name: "Cardio Line" },
      { id: "line2", name: "Neuro Line" }
    ];
  }

  function getProductLineById(lineId) {
    return getAllProductLines().find((l) => l.id === lineId);
  }

  function getLineName(lineId) {
    const line = getProductLineById(lineId);
    return line ? line.name : (lineId || "-");
  }

  function getUserAssignedLines(user) {
    const allLines = getAllProductLines();
    if (!user) return allLines;
    if (user.role === ROLES.ADMIN || user.role === ROLES.BU || user.role === ROLES.HR) {
      return allLines;
    }
    const userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    if (userLineIds.length === 0) return allLines;
    return allLines.filter((l) => userLineIds.includes(l.id));
  }

  function getLiveAreaById(areaId) {
    if (!areaId) return null;
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) ||
                     (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    return allAreas.find((a) => a.id === areaId) || null;
  }

  function getLiveRepForArea(areaId) {
    if (!areaId) return null;
    const area = getLiveAreaById(areaId);
    const allUsers = getAllUsers();
    if (area && area.repId) {
      const rep = allUsers.find((u) => u.id === area.repId);
      if (rep) return rep;
    }
    const repByArea = allUsers.find(
      (u) => (u.role === ROLES.REP || u.role === ROLES.REP_ALT) && u.areaId === areaId
    );
    if (repByArea) return repByArea;
    return null;
  }

  function getLiveHierarchyForArea(areaId, fallbackUserId) {
    const allUsers = getAllUsers();
    const liveRep = getLiveRepForArea(areaId);
    const creatorUser = fallbackUserId ? allUsers.find(u => u.id === fallbackUserId) : null;
    const rep = liveRep || creatorUser;

    let repId = rep ? rep.id : null;
    let dmId = null;
    let lmId = null;

    if (rep) {
      if (rep.role === ROLES.DM) {
        dmId = rep.id;
        lmId = rep.managerId || "lm1";
      } else if (rep.role === ROLES.LM) {
        dmId = null;
        lmId = rep.id;
      } else {
        dmId = rep.managerId || null;
        if (dmId) {
          const dm = allUsers.find((u) => u.id === dmId);
          lmId = dm ? dm.managerId : null;
        }
      }
    }

    if (!dmId) {
      const area = getLiveAreaById(areaId);
      if (area && area.lineId) {
        const dmsInLine = allUsers.filter(u => u.role === ROLES.DM && ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId));
        if (dmsInLine.length > 0) {
          dmId = dmsInLine[0].id;
          lmId = dmsInLine[0].managerId || "lm1";
        }
      }
    }

    if (!lmId) {
      const area = getLiveAreaById(areaId);
      if (area && area.lineId) {
        const lmsInLine = allUsers.filter(u => u.role === ROLES.LM && ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId));
        if (lmsInLine.length > 0) lmId = lmsInLine[0].id;
      }
    }

    return {
      repId: repId || (fallbackUserId || "rep1"),
      dmId: dmId || "dm1",
      lmId: lmId || "lm1"
    };
  }

  function getAreaName(areaId) {
    const area = getLiveAreaById(areaId);
    return area ? area.name : (areaId || "-");
  }

  function getAreasForLine(lineId, user) {
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    let areas = allAreas.filter((a) => !lineId || a.lineId === lineId);
    if (!user) return areas;
    if (user.role === ROLES.REP || user.role === ROLES.REP_ALT) {
      if (user.areaId) {
        const userAreas = areas.filter((a) => a.id === user.areaId);
        if (userAreas.length > 0) return userAreas;
      }
    }
    return areas;
  }

  function getDmsUnderLmForLine(lmId, lineId) {
    const allUsers = getAllUsers();
    return allUsers.filter((u) => {
      if (u.role !== ROLES.DM) return false;
      if (u.managerId !== lmId) return false;
      const lines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return lines.includes(lineId);
    });
  }

  function getHrUser() {
    return getAllUsers().find((u) => u.role === ROLES.HR) || null;
  }

  function getSubordinatesForUser(user, lineId) {
    if (!user) return [];
    const allUsers = getAllUsers();
    const role = (user.role || "").toLowerCase();

    function matchLine(u) {
      if (!lineId || lineId === "all") return true;
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return uLines.includes(lineId);
    }

    if (role === ROLES.ADMIN || role === ROLES.BU || role === ROLES.HR) {
      return allUsers.filter(u => u.id !== user.id && matchLine(u));
    }
    if (role === ROLES.LM) {
      const myDms = allUsers.filter(u => u.role === ROLES.DM && u.managerId === user.id);
      const dmIds = myDms.map(d => d.id);
      const myReps = allUsers.filter(u => (u.role === ROLES.REP || u.role === ROLES.REP_ALT) && (u.managerId === user.id || dmIds.includes(u.managerId)));
      return [...myDms, ...myReps].filter(matchLine);
    }
    if (role === ROLES.DM) {
      return allUsers.filter(u => (u.role === ROLES.REP || u.role === ROLES.REP_ALT) && u.managerId === user.id && matchLine(u));
    }
    return [];
  }

  function dispatchWorkflowNotification(notif) {
    if (!notif || !notif.userId) return;
    try {
      if (typeof window.addWorkflowNotification === "function") {
        window.addWorkflowNotification(notif);
      } else if (window.store && window.store.notifications && typeof window.store.notifications.add === "function") {
        window.store.notifications.add(notif);
      }
    } catch (e) {
      console.warn("Could not dispatch notification:", e);
    }
  }

  // Export Core namespace
  window.ActivitiesCore = {
    DAYS_OF_WEEK,
    WEEK_DAY_KEYS,
    REQUEST_STATUS,
    ACTIVITY_TYPES,
    PERIODS,
    TABS,
    ROLES,
    activityTranslations,
    t,
    escapeHTML,
    safeShowToast,
    addDays,
    getWeekStart,
    formatDate,
    formatDateShort,
    getCategoryLabel,
    _state,
    StoreAdapter,
    getAllUsers,
    getUserById,
    getAuthUser,
    isActionAuthorized,
    getUserDisplayName,
    getUserRoleLabel,
    getAllProductLines,
    getProductLineById,
    getLineName,
    getUserAssignedLines,
    getLiveAreaById,
    getLiveRepForArea,
    getLiveHierarchyForArea,
    getAreaName,
    getAreasForLine,
    getDmsUnderLmForLine,
    getSubordinatesForUser,
    getHrUser,
    dispatchWorkflowNotification,
  };
})(window);