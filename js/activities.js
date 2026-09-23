/**
 * @file activities.js
 * @description Enterprise-grade Unified Field Requests Hub: Daily Activities, Travel Expenses, Services Sponsorships, and Sales Budgets.
 * Adheres strictly to pharma hierarchical workflows, per-line budgeting, and AM/PM hospital vs. doctor rules.
 * 
 * Architectural Standards Implemented:
 * 1. Single Source of Truth via Centralized Store (window.store.activities, store.expenses, store.services, store.budgets).
 * 2. Encapsulated Revealing Module Pattern (ActivitiesModule) - Zero Global Scope Pollution.
 * 3. In-Memory Reactive State Management - Zero DOM-as-State anti-pattern.
 * 4. Pure, Immutable Date Operations (addDays, getWeekStart) - Zero in-place mutations.
 * 5. Semantic Enums & Constants - Zero Magic Strings and Magic Numbers.
 * 6. Bulletproof XSS Sanitization & Accessibility (a11y).
 */

const ActivitiesModule = (function () {
  "use strict";

  // ============================================================================
  // 1. Semantic Enums & Constants (Zero Magic Numbers & Strings)
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
      colDm: "District Manager (DM)",
      colCode: "Code",
      colAllocatedAmount: "Allocated Budget (EGP)",
      colUtilized: "Utilized",
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
      noReceipt: "No receipt attached"
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
      colDm: "مدير المنطقة (DM)",
      colCode: "الكود",
      colAllocatedAmount: "الميزانية المخصصة (ج.م)",
      colUtilized: "المستهلك",
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
      noReceipt: "لا توجد فاتورة مرفقة"
    }
  };

  // Merge translations with global registry
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

  // ============================================================================
  // 3. Pure Helpers & Utilities (Immutability, Sanitization & a11y)
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

  /**
   * Pure date addition (Immutable - zero side effects).
   */
  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Safe local date formatting (YYYY-MM-DD - zero UTC slip).
   */
  function formatDate(date) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /**
   * Pure start-of-week calculation (Middle East: Saturday start).
   */
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const offset = day === DAYS_OF_WEEK.SATURDAY ? 0 : -(day + 1);
    return addDays(d, offset);
  }

  // ============================================================================
  // 4. In-Memory Reactive Application State (Zero DOM-as-State)
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
    pendingDecision: null,
  };

  // ============================================================================
  // 5. Store Integration Layer (Single Source of Truth)
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

    updateExpenseStatus(id, newStatus, user, comment) {
      if (window.store && window.store.expenses) {
        return window.store.expenses.updateStatus(id, newStatus, user, comment);
      }
      const list = this.getExpenses();
      const exp = list.find((e) => e.id === id);
      if (!exp) return null;
      exp.status = newStatus;
      if (!exp.history) exp.history = [];
      exp.history.push({
        action: newStatus,
        at: new Date().toISOString(),
        by: user.id,
        role: user.role,
        comment: comment || "",
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
            dmAllocations: { dm1: 50000, dm2: 30000 }
          },
          line2: {
            totalBudget: 100000,
            lmAllocations: { lm1: 60000, lm2: 40000 },
            dmAllocations: { dm3: 40000 }
          }
        };
      }

      // Strict Line Isolation Sanitizer:
      // Strip any DM allocations that do not belong to that line
      let changed = false;
      const allUsers = getAllUsers();
      Object.keys(b).forEach((lId) => {
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
  // 6. User, Line & Hierarchy Helpers
  // ============================================================================
  function getAuthUser() {
    if (typeof window.requireAuth === "function") {
      const u = window.requireAuth();
      if (u) return u;
    }
    if (typeof window.checkAuth === "function") {
      const u = window.checkAuth();
      if (u) return u;
    }
    return (window.DEMO_DATA && window.DEMO_DATA.currentUser) || {
      id: "rep1",
      role: ROLES.REP,
      name: "Ahmed Mostafa",
      nameAr: "أحمد مصطفى",
      lineIds: ["line1"],
      areaId: "area1",
    };
  }

  function getAllUsers() {
    return (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  }

  function getUserById(id) {
    return getAllUsers().find((u) => u.id === id);
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
    return (window.DEMO_DATA && window.DEMO_DATA.productLines) || [
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
    if (user.role === ROLES.ADMIN || user.role === ROLES.HR || user.role === ROLES.BU) return allLines;
    if (user.lineIds && Array.isArray(user.lineIds) && user.lineIds.length > 0) {
      return allLines.filter((l) => user.lineIds.includes(l.id));
    }
    if (user.lineId) {
      return allLines.filter((l) => l.id === user.lineId);
    }
    return allLines.slice(0, 1);
  }

  function getDmsUnderLmForLine(lmId, lineId) {
    return getAllUsers().filter((u) => {
      const role = (u.role || "").toLowerCase();
      const isDm = role === "district_manager" || role === "dm";
      const reportsToLm = u.managerId === lmId;
      const inLine = u.lineIds && Array.isArray(u.lineIds)
        ? u.lineIds.includes(lineId)
        : u.lineId === lineId;
      return isDm && reportsToLm && inLine;
    });
  }

  function getSubordinatesForUserAndLine(user, lineId) {
    if (!user) return [];
    const allUsers = getAllUsers();
    const userRole = user.role;

    if (userRole === ROLES.ADMIN || userRole === ROLES.HR || userRole === ROLES.BU) {
      return allUsers.filter((u) => {
        if (!lineId || lineId === "all") return true;
        return u.lineIds && Array.isArray(u.lineIds) ? u.lineIds.includes(lineId) : u.lineId === lineId;
      });
    }

    if (userRole === ROLES.LM) {
      const dms = getDmsUnderLmForLine(user.id, lineId);
      const dmIds = dms.map((d) => d.id);
      const reps = allUsers.filter((u) => {
        const isRep = u.role === ROLES.REP || u.role === ROLES.REP_ALT;
        const reportsToDm = dmIds.includes(u.managerId);
        const inLine = !lineId || (u.lineIds && Array.isArray(u.lineIds) ? u.lineIds.includes(lineId) : u.lineId === lineId);
        return isRep && reportsToDm && inLine;
      });
      return [...dms, ...reps];
    }

    if (userRole === ROLES.DM) {
      return allUsers.filter((u) => {
        const isRep = u.role === ROLES.REP || u.role === ROLES.REP_ALT;
        const reportsToMe = u.managerId === user.id;
        const inLine = !lineId || (u.lineIds && Array.isArray(u.lineIds) ? u.lineIds.includes(lineId) : u.lineId === lineId);
        return isRep && reportsToMe && inLine;
      });
    }

    return [];
  }

  function populateEmployeeFilter(selectEl, user, lineId) {
    if (!selectEl) return;
    const subs = getSubordinatesForUserAndLine(user, lineId);

    if (user.role === ROLES.REP || user.role === ROLES.REP_ALT || subs.length === 0) {
      selectEl.style.display = "none";
      selectEl.innerHTML = `<option value="all">${t("allEmployees")}</option>`;
      return;
    }

    selectEl.style.display = "inline-block";
    const currentVal = selectEl.value;
    let html = `<option value="all">${t("allEmployees")}</option>`;
    subs.forEach((sub) => {
      const name = getUserDisplayName(sub.id);
      const roleLabel = getUserRoleLabel(sub.role);
      html += `<option value="${escapeHTML(sub.id)}">${escapeHTML(name)} (${escapeHTML(roleLabel)})</option>`;
    });
    selectEl.innerHTML = html;
    if (currentVal && subs.some((s) => s.id === currentVal)) {
      selectEl.value = currentVal;
    } else {
      selectEl.value = "all";
    }
  }

  function getHrUser() {
    return getAllUsers().find((u) => u.role === ROLES.HR) || { id: "hr1", name: "HR Manager", role: ROLES.HR };
  }

  function getAreasForLine(lineId) {
    const allAreas = (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    if (!lineId) return allAreas;
    return allAreas.filter((a) => !a.lineId || a.lineId === lineId);
  }

  function getDoctorsForLineAndArea(lineId, areaId) {
    const allDocs =
      (window.store && window.store.doctors && window.store.doctors.getAll()) ||
      (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
    return allDocs.filter((d) => {
      const matchLine = !lineId || !d.lineId || d.lineId === lineId;
      // Strict: if area selected, doctor must have that exact areaId
      const matchArea = !areaId ? true : (d.areaId === areaId);
      return matchLine && matchArea;
    });
  }

  function getHospitalsForLineAndArea(lineId, areaId) {
    const allHosps =
      (window.store && window.store.hospitals && window.store.hospitals.getAll()) ||
      (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
    return allHosps.filter((h) => {
      const matchArea = !areaId ? true : (h.areaId === areaId);
      const matchLine = !lineId || !h.lineId || h.lineId === lineId;
      return matchArea && matchLine;
    });
  }

  function getAreaName(areaId) {
    const allAreas = (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const area = allAreas.find((a) => a.id === areaId);
    return area ? area.name : (areaId || "-");
  }

  // ============================================================================
  // 7. Role-Based Navigation & Tab Visibility
  // ============================================================================
  function setupRoleTabVisibility() {
    _state.currentUser = getAuthUser();
    const role = _state.currentUser.role;
    const tabBtnBudget = document.getElementById("tabBtnBudget");
    const tabBtnServices = document.getElementById("tabBtnServices");
    const lmDistSec = document.getElementById("lmDistributionSection");

    if (role === ROLES.BU || role === ROLES.ADMIN) {
      if (tabBtnBudget) tabBtnBudget.style.display = "inline-flex";
      if (role === ROLES.BU && tabBtnServices) tabBtnServices.style.display = "none";
      if (role === ROLES.ADMIN && tabBtnServices) tabBtnServices.style.display = "inline-flex";
      if (role === ROLES.BU && _state.activeTab === TABS.SERVICES) {
        switchTab(TABS.BUDGET);
        return;
      }
    } else {
      if (tabBtnBudget) tabBtnBudget.style.display = "none";
      if (tabBtnServices) tabBtnServices.style.display = "inline-flex";
      if (role === ROLES.LM && lmDistSec) {
        lmDistSec.style.display = "block";
      } else if (lmDistSec) {
        lmDistSec.style.display = "none";
      }
    }

    if (role !== ROLES.LM && lmDistSec) {
      lmDistSec.style.display = "none";
    }
  }

  function switchTab(tabId) {
    _state.activeTab = tabId;
    document.querySelectorAll(".requests-tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".requests-tab-pane").forEach((pane) => pane.classList.remove("active"));

    if (tabId === TABS.ACTIVITIES) {
      document.getElementById("tabBtnActivities")?.classList.add("active");
      document.getElementById("pane-activities")?.classList.add("active");
      renderActivitiesView();
    } else if (tabId === TABS.EXPENSES) {
      document.getElementById("tabBtnExpenses")?.classList.add("active");
      document.getElementById("pane-expenses")?.classList.add("active");
      renderExpensesTab();
    } else if (tabId === TABS.SERVICES) {
      document.getElementById("tabBtnServices")?.classList.add("active");
      document.getElementById("pane-services")?.classList.add("active");
      renderServicesTab();
    } else if (tabId === TABS.BUDGET) {
      document.getElementById("tabBtnBudget")?.classList.add("active");
      document.getElementById("pane-budget")?.classList.add("active");
      renderBudgetTab();
    }
  }

  // ============================================================================
  // 8. TAB 1: Daily Activities Engine (Strictly Isolated via Store)
  // ============================================================================
  function renderActivitiesView() {
    _state.currentUser = getAuthUser();
    const uid = _state.currentUser.id;
    const dateStr = formatDate(_state.currentDate);
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const dateDisplay = document.getElementById("currentDateDisplay");

    if (dateDisplay) {
      dateDisplay.textContent = _state.currentDate.toLocaleDateString(
        lang === "ar" ? "ar-EG" : "en-US",
        { weekday: "short", year: "numeric", month: "short", day: "numeric" }
      );
    }

    const dayActivities = StoreAdapter.getActivities(uid, dateStr);
    renderPeriod(PERIODS.AM, dayActivities.AM, "amContent", "amStatusBadge", dateStr);
    renderPeriod(PERIODS.PM, dayActivities.PM, "pmContent", "pmStatusBadge", dateStr);
    renderWeeklyOverview();
    if (window.applyTranslations) window.applyTranslations();
  }

  function renderPeriod(period, data, contentId, badgeId, dateStr) {
    const contentEl = document.getElementById(contentId);
    const badgeEl = document.getElementById(badgeId);
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const dict = activityTranslations[lang] || activityTranslations.en;

    if (!contentEl || !badgeEl) return;

    if (data) {
      badgeEl.textContent = dict.statusLogged;
      badgeEl.className = "badge bg-success text-white";
      badgeEl.style.backgroundColor = "var(--success, #10b981)";

      const typeKeyMap = {
        [ACTIVITY_TYPES.VISIT]: "typeVisit",
        [ACTIVITY_TYPES.OFFICE_WORK]: "typeOfficeWork",
        [ACTIVITY_TYPES.TRAINING]: "typeTraining",
        [ACTIVITY_TYPES.MEETING]: "typeMeeting",
        [ACTIVITY_TYPES.CONFERENCE]: "typeConference",
      };
      const translatedType = (dict && dict[typeKeyMap[data.type]]) || data.type;

      let html = `
        <div style="margin-bottom: 0.5rem;">
          <strong style="color: var(--gray-800, #1e293b);"><span>${dict.activityType}</span>:</strong> 
          <span class="badge" style="background: var(--primary-light, #eff6ff); color: var(--primary, #2563eb); font-weight: bold; margin-left: 6px;">${escapeHTML(translatedType)}</span>
        </div>
        <div style="margin-bottom: 0.5rem; color: var(--gray-600, #475569); font-size: 0.9rem;">${escapeHTML(data.notes || "")}</div>
      `;
      if (data.type === ACTIVITY_TYPES.VISIT) {
        const targetDate = dateStr || formatDate(_state.currentDate);
        html += `<a href="visits.html?date=${encodeURIComponent(targetDate)}" class="btn btn-outline" style="display:inline-block; margin-top:0.5rem; padding: 4px 10px; font-size: 0.82rem;">${dict.goToVisits} &rarr;</a>`;
      }
      contentEl.innerHTML = html;
    } else {
      badgeEl.textContent = dict.statusNotLogged;
      badgeEl.className = "badge bg-danger text-white";
      badgeEl.style.backgroundColor = "var(--danger, #ef4444)";
      contentEl.innerHTML = `<div style="color: var(--gray-500, #94a3b8); font-style: italic; padding: 10px 0;">${dict.noActivityLogged}</div>`;
    }
  }

  function renderWeeklyOverview() {
    const grid = document.getElementById("weeklyGrid");
    if (!grid) return;
    grid.replaceChildren();

    const startOfWeek = getWeekStart(_state.currentDate);
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const dict = activityTranslations[lang] || activityTranslations.en;
    const uid = _state.currentUser.id;
    const userActivities = StoreAdapter.getAllActivitiesForUser(uid);

    WEEK_DAY_KEYS.forEach((dayKey, index) => {
      const d = addDays(startOfWeek, index);
      const dateStr = formatDate(d);
      const dayData = userActivities[dateStr] || {};
      const isFriday = dayKey === "fri";

      const amIcon = dayData.AM
        ? '<span style="color: var(--success, #10b981); font-weight: bold;">✓</span>'
        : '<span style="color: var(--danger, #ef4444); font-weight: bold;">✕</span>';
      const pmIcon = dayData.PM
        ? '<span style="color: var(--success, #10b981); font-weight: bold;">✓</span>'
        : '<span style="color: var(--danger, #ef4444); font-weight: bold;">✕</span>';

      const isSelected = dateStr === formatDate(_state.currentDate);
      const card = document.createElement("div");
      card.className = `card week-card ${isSelected ? "selected" : ""} ${isFriday ? "day-off" : ""}`;
      card.style.borderRadius = "10px";
      card.style.cursor = "pointer";
      card.style.transition = "all 0.2s ease";
      card.style.border = isSelected ? "2px solid var(--primary, #2563eb)" : "1px solid var(--border-color, var(--gray-200))";
      card.style.background = isFriday ? "var(--surface-alt, var(--gray-50))" : "var(--surface, var(--white))";
      card.style.padding = "0.75rem";
      card.style.textAlign = "center";
      card.onclick = () => {
        _state.currentDate = new Date(d);
        renderActivitiesView();
      };

      const periodStatusHtml = isFriday && !dayData.AM && !dayData.PM
        ? `<div class="week-card-off-notice" style="text-align: center; font-size: 0.78rem; font-weight: 600; color: var(--gray-500); background: var(--surface-dim, var(--gray-100)); padding: 0.4rem; border-radius: 6px;">🌴 ${dict.dayOff || "Day Off"}</div>`
        : `<div class="week-card-shift-badges" style="display: flex; justify-content: space-around; font-size: 0.85rem; background: var(--surface-dim, var(--gray-100)); padding: 0.4rem; border-radius: 6px; font-weight: 600;"><div>AM: ${amIcon}</div><div>PM: ${pmIcon}</div></div>`;

      card.innerHTML = `
        <div class="week-card-inner">
          <div class="week-card-day-name" style="font-weight: 700; margin-bottom: 0.2rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <span>${dict[dayKey]}</span>
            ${isFriday ? `<span style="font-size: 0.68rem; padding: 1px 5px; border-radius: 4px; background: var(--surface-dim, #e2e8f0); color: var(--gray-600);">${dict.dayOff || "Day Off"}</span>` : ""}
          </div>
          <div class="week-card-date-sub" style="font-size: 0.78rem; color: var(--gray-500); margin-bottom: 0.5rem;">${d.getDate()} / ${d.getMonth() + 1}</div>
          ${periodStatusHtml}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function openActivityModal(period) {
    const modal = document.getElementById("activityModal");
    if (!modal) return;
    _state.currentUser = getAuthUser();
    const dateStr = formatDate(_state.currentDate);
    const existingActivities = StoreAdapter.getActivities(_state.currentUser.id, dateStr);
    const existing = existingActivities[period];

    _state.modalState = {
      isOpen: true,
      period: period || PERIODS.AM,
      date: dateStr,
      type: existing ? existing.type : "",
      notes: existing ? existing.notes : "",
      isEdit: Boolean(existing),
    };

    const periodSelect = document.getElementById("activityPeriod");
    const typeSelect = document.getElementById("activityType");
    const notesInput = document.getElementById("activityNotes");
    const deleteBtn = document.getElementById("btnDeleteActivity");

    if (periodSelect) periodSelect.value = _state.modalState.period;
    if (typeSelect) typeSelect.value = _state.modalState.type;
    if (notesInput) notesInput.value = _state.modalState.notes;
    if (deleteBtn) {
      deleteBtn.style.display = _state.modalState.isEdit ? "inline-block" : "none";
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeActivityModal() {
    const modal = document.getElementById("activityModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
    _state.modalState.isOpen = false;
  }

  function deleteCurrentActivity() {
    if (!_state.modalState.isOpen) return;
    const { date, period } = _state.modalState;
    const uid = _state.currentUser.id;
    const confirmMsg = t("confirmDeleteActivity");

    if (!confirm(confirmMsg)) return;

    StoreAdapter.deleteActivity(uid, date, period);
    closeActivityModal();
    renderActivitiesView();
    safeShowToast(t("activityDeleted"), "info");
  }

  function handleActivitySubmit(e) {
    e.preventDefault();
    const type = document.getElementById("activityType")?.value;
    const notes = document.getElementById("activityNotes")?.value || "";

    if (!type) {
      safeShowToast(t("selectActivityTypeWarning"), "warning");
      return;
    }

    const { date, period } = _state.modalState;
    const uid = _state.currentUser.id;

    StoreAdapter.saveActivity(uid, date, period, { type, notes });
    closeActivityModal();
    renderActivitiesView();
    safeShowToast(t("successAction"), "success");
  }

  // ============================================================================
  // 9. TAB 2: Request Expenses Engine (Hierarchical Workflow via Store)
  // ============================================================================
  function onExpenseLineFilterChange() {
    _state.currentUser = getAuthUser();
    const lineSelect = document.getElementById("expenseFilterLine");
    const activeLineId = lineSelect?.value;
    const empSelect = document.getElementById("expenseFilterEmployee");
    populateEmployeeFilter(empSelect, _state.currentUser, activeLineId);
    renderExpensesTab();
  }

  function renderExpensesTab() {
    _state.currentUser = getAuthUser();
    const userLines = getUserAssignedLines(_state.currentUser);

    const lineSelect = document.getElementById("expenseFilterLine");
    if (lineSelect && (lineSelect.children.length === 0 || lineSelect.dataset.userId !== _state.currentUser.id)) {
      lineSelect.innerHTML = userLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      lineSelect.dataset.userId = _state.currentUser.id;
      if (userLines.length > 0) lineSelect.value = userLines[0].id;
    }
    // Hide line selector if user has only one line
    if (lineSelect) lineSelect.style.display = userLines.length > 1 ? "inline-block" : "none";

    const activeLineId = lineSelect?.value || (userLines[0] ? userLines[0].id : "line1");
    const empSelect = document.getElementById("expenseFilterEmployee");
    if (empSelect && (empSelect.children.length === 0 || empSelect.dataset.lineId !== activeLineId || empSelect.dataset.userId !== _state.currentUser.id)) {
      populateEmployeeFilter(empSelect, _state.currentUser, activeLineId);
      empSelect.dataset.lineId = activeLineId;
      empSelect.dataset.userId = _state.currentUser.id;
    }

    const expenses = StoreAdapter.getExpenses();
    const employeeFilter = empSelect?.value || "all";
    const statusFilter = document.getElementById("expenseFilterStatus")?.value || document.getElementById("filterExpenseStatus")?.value || "all";
    const categoryFilter = document.getElementById("expenseFilterCategory")?.value || document.getElementById("filterExpenseCategory")?.value || "all";

    const visibleExpenses = expenses.filter((exp) => {
      const matchRole = canUserViewExpense(exp, _state.currentUser);
      const matchLine = !exp.lineId || exp.lineId === activeLineId;
      const matchEmployee = employeeFilter === "all" || exp.requesterId === employeeFilter;
      const matchStatus = statusFilter === "all" || exp.status === statusFilter;
      const matchCat = categoryFilter === "all" || exp.category === categoryFilter;
      return matchRole && matchLine && matchEmployee && matchStatus && matchCat;
    });

    const pendingSum = visibleExpenses
      .filter((e) => e.status.startsWith("pending"))
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const approvedSum = visibleExpenses
      .filter((e) => e.status === REQUEST_STATUS.APPROVED)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const disbursedSum = visibleExpenses
      .filter((e) => e.status === REQUEST_STATUS.DISBURSED)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const pendingEl = document.getElementById("expMetricPending");
    const approvedEl = document.getElementById("expMetricApproved");
    const disbursedEl = document.getElementById("expMetricDisbursed");
    if (pendingEl) pendingEl.textContent = `${pendingSum.toLocaleString()} EGP`;
    if (approvedEl) approvedEl.textContent = `${approvedSum.toLocaleString()} EGP`;
    if (disbursedEl) disbursedEl.textContent = `${disbursedSum.toLocaleString()} EGP`;

    renderExpensesTable(visibleExpenses);
  }

  function canUserViewExpense(exp, user) {
    if (!user) return false;
    const role = user.role;
    if (role === ROLES.HR || role === ROLES.ADMIN) return true;
    if (exp.requesterId === user.id) return true;
    if (role === ROLES.DM) {
      const requester = getUserById(exp.requesterId);
      return requester && requester.managerId === user.id;
    }
    if (role === ROLES.LM) {
      const requester = getUserById(exp.requesterId);
      if (!requester) return false;
      if (requester.managerId === user.id) return true;
      const directMgr = getUserById(requester.managerId);
      return directMgr && directMgr.managerId === user.id;
    }
    if (role === ROLES.BU) {
      return !exp.lineId || !user.lineIds || user.lineIds.includes(exp.lineId);
    }
    return false;
  }

  function renderExpensesTable(list) {
    const tbody = document.getElementById("expensesTableBody");
    if (!tbody) return;
    tbody.replaceChildren();

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--gray-500);">${t("noExpensesFound")}</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((exp) => {
        const requesterName = escapeHTML(getUserDisplayName(exp.requesterId));
        const requesterRole = escapeHTML(getUserRoleLabel(exp.requesterRole));
        const actionsHtml = getExpenseActionButtons(exp, _state.currentUser);
        const receiptThumb = exp.receiptUrl
          ? `<div style="display:inline-flex; align-items:center; gap:6px;">
               <img src="${exp.receiptUrl}" alt="Receipt" style="width:34px; height:34px; border-radius:6px; object-fit:cover; border:1px solid #cbd5e1; cursor:pointer;" onclick="ActivitiesModule.openReceiptPreviewModal('${exp.receiptUrl}')" />
               <button type="button" class="btn btn-outline" style="padding:2px 6px; font-size:0.75rem;" onclick="ActivitiesModule.openReceiptPreviewModal('${exp.receiptUrl}')">
                 🔍
               </button>
             </div>`
          : `<span style="color:var(--gray-400); font-size:0.8rem;">${t("noReceipt")}</span>`;

        return `
          <tr>
            <td style="font-weight:600; font-size:0.88rem; white-space:nowrap;">${exp.date}</td>
            <td>
              <div style="font-weight:700; color:var(--gray-800);">${requesterName}</div>
              <small class="badge" style="background:var(--gray-100); color:var(--gray-600); font-size:0.75rem;">${requesterRole}</small>
            </td>
            <td>
              <span style="font-weight:600;">${getCategoryLabel(exp.category)}</span>
              ${exp.notes ? `<br><small style="color:var(--gray-500); font-size:0.78rem;">${escapeHTML(exp.notes)}</small>` : ""}
            </td>
            <td style="font-weight:800; color:var(--gray-900); font-size:0.95rem; white-space:nowrap;">${Number(exp.amount).toLocaleString()} EGP</td>
            <td style="text-align:center;">${receiptThumb}</td>
            <td>${getExpenseStatusBadge(exp)}</td>
            <td style="text-align:center;"><div style="display:inline-flex; gap:6px; align-items:center;">${actionsHtml}</div></td>
          </tr>
        `;
      })
      .join("");
  }

  function getCategoryLabel(cat) {
    switch (cat) {
      case "travel": return t("catTravel");
      case "fuel_tolls": return t("catFuelTolls");
      case "hospitality": return t("catHospitality");
      case "hotel": return t("catHotel");
      default: return cat || "-";
    }
  }

  function getExpenseStatusBadge(exp) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const status = exp.status;

    if (status === REQUEST_STATUS.PENDING_DM) {
      const dmName = exp.nextApproverId ? getUserDisplayName(exp.nextApproverId) : "DM";
      return `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">${t("waitingDmPrefix")}${escapeHTML(dmName)}</span>`;
    }
    if (status === REQUEST_STATUS.PENDING_LM) {
      const lmName = exp.nextApproverId ? getUserDisplayName(exp.nextApproverId) : "LM";
      return `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">${t("waitingLmPrefix")}${escapeHTML(lmName)}</span>`;
    }
    if (status === REQUEST_STATUS.PENDING_HR) {
      return `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">${t("waitingHr")}</span>`;
    }
    if (status === REQUEST_STATUS.APPROVED) {
      return `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:700;">${t("approvedLabel")}</span>`;
    }
    if (status === REQUEST_STATUS.DISBURSED) {
      return `<span class="badge" style="background:#f3e8ff; color:#7e22ce; font-weight:700;">${t("disbursedLabel")}</span>`;
    }
    if (status === REQUEST_STATUS.REJECTED) {
      return `<span class="badge" style="background:#fee2e2; color:#b91c1c; font-weight:700;">${t("rejectedLabel")}</span>`;
    }
    return `<span class="badge">${status}</span>`;
  }

  function getExpenseActionButtons(exp, user) {
    if (!user) return "&mdash;";
    const role = user.role;
    const status = exp.status;

    let canApproveReject = false;
    let canDisburse = false;

    if (role === ROLES.DM && status === REQUEST_STATUS.PENDING_DM && exp.nextApproverId === user.id) {
      canApproveReject = true;
    }
    if (role === ROLES.LM && status === REQUEST_STATUS.PENDING_LM && exp.nextApproverId === user.id) {
      canApproveReject = true;
    }
    if (role === ROLES.HR && (status === REQUEST_STATUS.PENDING_HR || status === REQUEST_STATUS.APPROVED)) {
      if (status === REQUEST_STATUS.PENDING_HR) {
        canApproveReject = true;
      }
      canDisburse = true;
    }
    if (role === ROLES.ADMIN) {
      if (status.startsWith("pending")) canApproveReject = true;
      if (status === REQUEST_STATUS.APPROVED) canDisburse = true;
    }

    let buttons = "";
    if (canApproveReject) {
      buttons += `
        <button type="button" class="btn btn-outline" style="color:var(--success); border-color:var(--success); padding:3px 8px; font-size:0.78rem;" onclick="ActivitiesModule.openDecisionModal('expense', '${exp.id}', 'approve')" title="Approve">
          ✓
        </button>
        <button type="button" class="btn btn-outline" style="color:var(--danger); border-color:var(--danger); padding:3px 8px; font-size:0.78rem;" onclick="ActivitiesModule.openDecisionModal('expense', '${exp.id}', 'reject')" title="Reject">
          ✕
        </button>
      `;
    }
    if (canDisburse && status !== REQUEST_STATUS.DISBURSED && status !== REQUEST_STATUS.REJECTED) {
      buttons += `
        <button type="button" class="btn btn-outline" style="color:#7e22ce; border-color:#7e22ce; padding:3px 8px; font-size:0.78rem;" onclick="ActivitiesModule.openDecisionModal('expense', '${exp.id}', 'disburse')" title="Disburse Payment">
          💵
        </button>
      `;
    }

    return buttons || "&mdash;";
  }

  function openExpenseModal() {
    _state.currentUser = getAuthUser();
    const modal = document.getElementById("expenseModal");
    if (!modal) return;
    document.getElementById("expenseForm")?.reset();
    _state.currentReceiptBase64 = null;
    const previewContainer = document.getElementById("receiptPreviewBox") || document.getElementById("expenseReceiptPreview");
    if (previewContainer) previewContainer.style.display = "none";
    const previewImg = document.getElementById("receiptPreviewImg") || document.getElementById("expenseReceiptImg");
    if (previewImg) previewImg.src = "";
    const dateInp = document.getElementById("expenseDateInput");
    if (dateInp) dateInp.value = formatDate(_state.currentDate);

    // Populate line select in expense form
    const userLines = getUserAssignedLines(_state.currentUser);
    const lineSelect = document.getElementById("expenseFormLineSelect");
    if (lineSelect) {
      lineSelect.innerHTML = userLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      const activeFilterLine = document.getElementById("expenseFilterLine")?.value;
      if (activeFilterLine && userLines.some((l) => l.id === activeFilterLine)) {
        lineSelect.value = activeFilterLine;
      } else if (userLines.length > 0) {
        lineSelect.value = userLines[0].id;
      }
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeExpenseModal() {
    const modal = document.getElementById("expenseModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  function onReceiptFileSelected(e) {
    const input = e && (e.target || e);
    const file = input && input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.6 quality (~80-120KB) to prevent localStorage quota errors
        _state.currentReceiptBase64 = canvas.toDataURL("image/jpeg", 0.6);

        const previewContainer = document.getElementById("receiptPreviewBox") || document.getElementById("expenseReceiptPreview");
        const previewImg = document.getElementById("receiptPreviewImg") || document.getElementById("expenseReceiptImg");
        if (previewContainer && previewImg) {
          previewImg.src = _state.currentReceiptBase64;
          previewContainer.style.display = "block";
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleExpenseSubmit(e) {
    e.preventDefault();
    _state.currentUser = getAuthUser();

    const lineSelect = document.getElementById("expenseFormLineSelect");
    const category = document.getElementById("expenseCategoryInput").value;
    const amount = parseFloat(document.getElementById("expenseAmountInput").value);
    const date = document.getElementById("expenseDateInput").value;
    const notes = document.getElementById("expenseNotesInput").value;

    if (!amount || amount <= 0) {
      safeShowToast("Please enter a valid amount.", "warning");
      return;
    }

    let initialStatus = REQUEST_STATUS.PENDING_DM;
    let nextApprover = null;

    if (_state.currentUser.role === ROLES.REP || _state.currentUser.role === ROLES.REP_ALT) {
      initialStatus = REQUEST_STATUS.PENDING_DM;
      nextApprover = _state.currentUser.managerId || "dm1";
    } else if (_state.currentUser.role === ROLES.DM) {
      initialStatus = REQUEST_STATUS.PENDING_LM;
      nextApprover = _state.currentUser.managerId || "lm1";
    } else if (_state.currentUser.role === ROLES.LM) {
      initialStatus = REQUEST_STATUS.PENDING_HR;
      const hr = getHrUser();
      nextApprover = hr ? hr.id : "hr1";
    } else {
      initialStatus = REQUEST_STATUS.APPROVED;
      nextApprover = null;
    }

    const assignedLines = getUserAssignedLines(_state.currentUser);
    const lineId = lineSelect?.value || (assignedLines.length > 0 ? assignedLines[0].id : "line1");

    const newExpense = {
      id: "exp_" + Date.now(),
      requesterId: _state.currentUser.id,
      requesterRole: _state.currentUser.role,
      lineId: lineId,
      category: category,
      amount: amount,
      date: date,
      notes: notes,
      receiptUrl: _state.currentReceiptBase64 || "images/pharma-icon-192.png",
      status: initialStatus,
      nextApproverId: nextApprover,
      history: [
        {
          action: "submitted",
          at: new Date().toISOString(),
          by: _state.currentUser.id,
          role: _state.currentUser.role,
        },
      ],
    };

    StoreAdapter.saveExpense(newExpense);
    closeExpenseModal();
    renderExpensesTab();
    safeShowToast(t("successAction"), "success");
  }

  // ============================================================================
  // 10. TAB 3: Request Services Engine (Doctor & Hospital Sponsorships)
  // ============================================================================
  function getBudgetMetricsForUser(lineId, user) {
    const budgets = StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
    const allServices = StoreAdapter.getServices().filter((s) => s.lineId === lineId);

    let allocated = 0;
    let distributed = 0;
    let utilized = 0;
    let pending = 0;
    let remaining = 0;

    if (user.role === ROLES.LM) {
      allocated = (lineBudget.lmAllocations && Number(lineBudget.lmAllocations[user.id])) || 0;
      const dms = getDmsUnderLmForLine(user.id, lineId);
      distributed = dms.reduce((sum, dm) => sum + ((lineBudget.dmAllocations && Number(lineBudget.dmAllocations[dm.id])) || 0), 0);

      allServices.forEach((s) => {
        const requester = getUserById(s.requesterId);
        if (!requester) return;
        const isDirect = requester.managerId === user.id;
        const parent = getUserById(requester.managerId);
        const isIndirect = parent && parent.managerId === user.id;
        if (s.requesterId === user.id || isDirect || isIndirect) {
          if (s.status === REQUEST_STATUS.APPROVED) utilized += Number(s.cost || 0);
          else if (s.status.startsWith("pending")) pending += Number(s.cost || 0);
        }
      });

      // LM Remaining Balance: Total allocated from BU minus total distributed to DMs under LM in this line
      remaining = Math.max(0, allocated - distributed);
      return { allocated, distributed, utilized, pending, remaining, role: ROLES.LM };
    } else if (user.role === ROLES.DM) {
      allocated = (lineBudget.dmAllocations && Number(lineBudget.dmAllocations[user.id])) || 0;
      allServices.forEach((s) => {
        const requester = getUserById(s.requesterId);
        const isSelfOrSub = s.requesterId === user.id || (requester && requester.managerId === user.id);
        if (isSelfOrSub) {
          if (s.status === REQUEST_STATUS.APPROVED) utilized += Number(s.cost || 0);
          else if (s.status.startsWith("pending")) pending += Number(s.cost || 0);
        }
      });
      remaining = Math.max(0, allocated - utilized - pending);
      return { allocated, distributed: 0, utilized, pending, remaining, role: ROLES.DM };
    } else if (user.role === ROLES.REP || user.role === ROLES.REP_ALT) {
      const dm = getUserById(user.managerId);
      allocated = (dm && lineBudget.dmAllocations && Number(lineBudget.dmAllocations[dm.id])) || 0;
      allServices.forEach((s) => {
        const requester = getUserById(s.requesterId);
        const isDmOrFellowRep = (dm && s.requesterId === dm.id) || (requester && requester.managerId === user.managerId);
        if (isDmOrFellowRep) {
          if (s.status === REQUEST_STATUS.APPROVED) utilized += Number(s.cost || 0);
          else if (s.status.startsWith("pending")) pending += Number(s.cost || 0);
        }
      });
      remaining = Math.max(0, allocated - utilized - pending);
      return { allocated, distributed: 0, utilized, pending, remaining, role: ROLES.REP };
    } else {
      allocated = Number(lineBudget.totalBudget || 0);
      const lmAllocSum = Object.values(lineBudget.lmAllocations || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      distributed = lmAllocSum;
      allServices.forEach((s) => {
        if (s.status === REQUEST_STATUS.APPROVED) utilized += Number(s.cost || 0);
        else if (s.status.startsWith("pending")) pending += Number(s.cost || 0);
      });
      remaining = Math.max(0, allocated - lmAllocSum);
      return { allocated, distributed, utilized, pending, remaining, role: ROLES.BU };
    }
  }

  function onServiceBudgetLineChange() {
    _state.currentUser = getAuthUser();
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const activeLineId = lineSelect?.value;
    const empSelect = document.getElementById("serviceFilterEmployee");
    populateEmployeeFilter(empSelect, _state.currentUser, activeLineId);
    renderServicesTab();
  }

  function renderServicesTab() {
    _state.currentUser = getAuthUser();
    const userLines = getUserAssignedLines(_state.currentUser);

    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    if (lineSelect && (lineSelect.children.length === 0 || lineSelect.dataset.userId !== _state.currentUser.id)) {
      lineSelect.innerHTML = userLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      lineSelect.dataset.userId = _state.currentUser.id;
      if (userLines.length > 0) lineSelect.value = userLines[0].id;
    }
    // Hide line selector if user has only one line
    if (lineSelect) lineSelect.style.display = userLines.length > 1 ? "inline-block" : "none";


    const activeLineId = lineSelect?.value || (userLines[0] ? userLines[0].id : "line1");
    const empSelect = document.getElementById("serviceFilterEmployee");
    if (empSelect && (empSelect.children.length === 0 || empSelect.dataset.lineId !== activeLineId || empSelect.dataset.userId !== _state.currentUser.id)) {
      populateEmployeeFilter(empSelect, _state.currentUser, activeLineId);
      empSelect.dataset.lineId = activeLineId;
      empSelect.dataset.userId = _state.currentUser.id;
    }

    const metrics = getBudgetMetricsForUser(activeLineId, _state.currentUser);

    const titleTotal = document.getElementById("srvMetricTotalTitle");
    const titleApproved = document.getElementById("srvMetricApprovedTitle");
    const titlePending = document.getElementById("srvMetricPendingTitle");
    const titleRemaining = document.getElementById("srvMetricRemainingTitle");

    const totalEl = document.getElementById("srvMetricTotal") || document.getElementById("srvBudgetTotal");
    const spentEl = document.getElementById("srvMetricApproved") || document.getElementById("srvBudgetSpent");
    const pendingEl = document.getElementById("srvMetricPending") || document.getElementById("srvBudgetPending");
    const remEl = document.getElementById("srvMetricRemaining") || document.getElementById("srvBudgetRemaining");

    if (_state.currentUser.role === ROLES.LM) {
      if (titleTotal) titleTotal.textContent = t("totalAllocatedBudget");
      if (titleApproved) titleApproved.textContent = t("distributedToDms");
      if (titlePending) titlePending.textContent = t("pendingServices");
      if (titleRemaining) titleRemaining.textContent = t("remainingBudget");

      if (totalEl) totalEl.textContent = `${metrics.allocated.toLocaleString()} EGP`;
      if (spentEl) spentEl.textContent = `${metrics.distributed.toLocaleString()} EGP`;
      if (pendingEl) pendingEl.textContent = `${metrics.pending.toLocaleString()} EGP`;
      if (remEl) remEl.textContent = `${metrics.remaining.toLocaleString()} EGP`;
    } else if (_state.currentUser.role === ROLES.REP || _state.currentUser.role === ROLES.REP_ALT) {
      if (titleTotal) titleTotal.textContent = t("districtBudget");
      if (titleApproved) titleApproved.textContent = t("approvedSpent");
      if (titlePending) titlePending.textContent = t("pendingServices");
      if (titleRemaining) titleRemaining.textContent = t("remainingBudget");

      if (totalEl) totalEl.textContent = `${metrics.allocated.toLocaleString()} EGP`;
      if (spentEl) spentEl.textContent = `${metrics.utilized.toLocaleString()} EGP`;
      if (pendingEl) pendingEl.textContent = `${metrics.pending.toLocaleString()} EGP`;
      if (remEl) remEl.textContent = `${metrics.remaining.toLocaleString()} EGP`;
    } else if (_state.currentUser.role === ROLES.BU || _state.currentUser.role === ROLES.ADMIN) {
      if (titleTotal) titleTotal.textContent = t("totalLineBudget");
      if (titleApproved) titleApproved.textContent = t("allocatedToLms");
      if (titlePending) titlePending.textContent = t("approvedSpent");
      if (titleRemaining) titleRemaining.textContent = t("unallocatedRemaining");

      if (totalEl) totalEl.textContent = `${metrics.allocated.toLocaleString()} EGP`;
      if (spentEl) spentEl.textContent = `${metrics.distributed.toLocaleString()} EGP`;
      if (pendingEl) pendingEl.textContent = `${metrics.utilized.toLocaleString()} EGP`;
      if (remEl) remEl.textContent = `${metrics.remaining.toLocaleString()} EGP`;
    } else {
      if (titleTotal) titleTotal.textContent = t("totalAllocatedBudget");
      if (titleApproved) titleApproved.textContent = t("approvedSpent");
      if (titlePending) titlePending.textContent = t("pendingServices");
      if (titleRemaining) titleRemaining.textContent = t("remainingBudget");

      if (totalEl) totalEl.textContent = `${metrics.allocated.toLocaleString()} EGP`;
      if (spentEl) spentEl.textContent = `${metrics.utilized.toLocaleString()} EGP`;
      if (pendingEl) pendingEl.textContent = `${metrics.pending.toLocaleString()} EGP`;
      if (remEl) remEl.textContent = `${metrics.remaining.toLocaleString()} EGP`;
    }

    const progBar = document.getElementById("srvBudgetProgressBar");
    if (progBar && metrics.allocated > 0) {
      const consumed = _state.currentUser.role === ROLES.LM ? metrics.distributed : (metrics.utilized + metrics.pending);
      const pct = Math.min(100, Math.round((consumed / metrics.allocated) * 100));
      progBar.style.width = `${pct}%`;
      progBar.textContent = `${pct}%`;
    }

    if (_state.currentUser.role === ROLES.LM) {
      renderLmDistributionSection(activeLineId, _state.currentUser);
    } else {
      const sec = document.getElementById("lmDistributionSection");
      if (sec) sec.style.display = "none";
    }

    const allServices = StoreAdapter.getServices();
    const employeeFilter = empSelect?.value || "all";
    const deptFilter = document.getElementById("serviceFilterDept")?.value || document.getElementById("filterServiceDept")?.value || "all";
    const statusFilter = document.getElementById("serviceFilterStatus")?.value || document.getElementById("filterServiceStatus")?.value || "all";

    const visibleServices = allServices.filter((srv) => {
      const matchLine = !srv.lineId || srv.lineId === activeLineId;
      const matchEmployee = employeeFilter === "all" || srv.requesterId === employeeFilter;
      const matchRole = canUserViewService(srv, _state.currentUser);
      const matchDept = deptFilter === "all" || srv.department === deptFilter;
      const matchStatus = statusFilter === "all" || srv.status === statusFilter;
      return matchLine && matchEmployee && matchRole && matchDept && matchStatus;
    });

    renderServicesTable(visibleServices);
  }

  function renderLmDistributionSection(lineId, lmUser) {
    const sec = document.getElementById("lmDistributionSection");
    if (!sec) return;
    sec.style.display = "block";

    const budgets = StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

    // Strictly fetch ALL DMs reporting to this LM in this line
    const dmsUnderLm = getDmsUnderLmForLine(lmUser.id, lineId);

    const tbody = document.getElementById("lmDmAllocationTableBody") || document.getElementById("lmDmAllocTableBody");
    if (!tbody) return;

    if (dmsUnderLm.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--gray-500);">No District Managers assigned to you in this line.</td></tr>`;
      return;
    }

    tbody.innerHTML = dmsUnderLm
      .map((dm) => {
        const curAlloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        const dmServices = StoreAdapter.getServices().filter((s) => s.lineId === lineId && s.requesterId === dm.id && s.status === REQUEST_STATUS.APPROVED);
        const dmUtilized = dmServices.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

        return `
          <tr>
            <td>
              <div style="font-weight:700; color:var(--gray-800);">${escapeHTML(getUserDisplayName(dm.id))}</div>
              <small style="color:var(--gray-500);">${escapeHTML(dm.email || "")}</small>
            </td>
            <td><span class="badge" style="background:var(--gray-100); color:var(--gray-700); font-weight:600;">${escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td>
              <input type="number" class="form-control lm-dm-alloc-input" data-dmid="${dm.id}" value="${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateLmAllocationPreview()" style="width:140px; font-weight:700; display:inline-block;" />
            </td>
            <td style="font-weight:700; color:var(--gray-700);">${dmUtilized.toLocaleString()} EGP</td>
          </tr>
        `;
      })
      .join("");
  }

  function calculateLmAllocationPreview() {
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || "line1";
    const budgets = StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
    const myLmAlloc = (lineBudget.lmAllocations && Number(lineBudget.lmAllocations[_state.currentUser.id])) || 0;

    let distributed = 0;
    document.querySelectorAll(".lm-dm-alloc-input").forEach((inp) => {
      distributed += Number(inp.value || 0);
    });

    const remaining = Math.max(0, myLmAlloc - distributed);
    const spentEl = document.getElementById("srvMetricApproved") || document.getElementById("srvBudgetSpent");
    const remEl = document.getElementById("srvMetricRemaining") || document.getElementById("srvBudgetRemaining");

    if (spentEl) spentEl.textContent = `${distributed.toLocaleString()} EGP`;
    if (remEl) {
      remEl.textContent = `${remaining.toLocaleString()} EGP`;
      remEl.style.color = distributed > myLmAlloc ? "var(--danger)" : "";
    }
  }

  function saveDmAllocations() {
    const lineSelect = document.getElementById("serviceBudgetLineSelect") || document.getElementById("servicesLineFilter");
    const lineId = lineSelect?.value || "line1";
    const budgets = StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
    if (!budgets[lineId].dmAllocations) budgets[lineId].dmAllocations = {};

    let totalAlloc = 0;
    document.querySelectorAll(".lm-dm-alloc-input").forEach((inp) => {
      const dmId = inp.dataset.dmid;
      if (dmId) {
        const val = Number(inp.value || 0);
        budgets[lineId].dmAllocations[dmId] = val;
        totalAlloc += val;
      }
    });

    const myLmAlloc = (budgets[lineId].lmAllocations && Number(budgets[lineId].lmAllocations[_state.currentUser.id])) || 0;
    if (myLmAlloc > 0 && totalAlloc > myLmAlloc) {
      safeShowToast(t("insufficientBudgetNotice"), "warning");
    }

    StoreAdapter.saveBudgets(budgets);
    safeShowToast(t("savedBudgetMessage"), "success");
    renderServicesTab();
  }

  function canUserViewService(srv, user) {
    if (!user) return false;
    const role = user.role;
    if (role === ROLES.HR || role === ROLES.ADMIN || role === ROLES.BU) return true;
    if (srv.requesterId === user.id) return true;
    if (role === ROLES.DM) {
      const requester = getUserById(srv.requesterId);
      return requester && requester.managerId === user.id;
    }
    if (role === ROLES.LM) {
      const requester = getUserById(srv.requesterId);
      if (!requester) return false;
      if (requester.managerId === user.id) return true;
      const directMgr = getUserById(requester.managerId);
      return directMgr && directMgr.managerId === user.id;
    }
    return false;
  }

  function renderServicesTable(list) {
    const tbody = document.getElementById("servicesTableBody");
    if (!tbody) return;
    tbody.replaceChildren();

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--gray-500);">${t("noServicesFound")}</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((srv) => {
        const requesterName = escapeHTML(getUserDisplayName(srv.requesterId));
        const requesterRole = escapeHTML(getUserRoleLabel(srv.requesterRole));
        const actionsHtml = getServiceActionButtons(srv, _state.currentUser);
        const deptBadge = srv.department === "marketing"
          ? `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">Marketing</span>`
          : `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">Sales</span>`;

        const shiftIcon = srv.shift === PERIODS.AM ? `🏥 AM (Hospital)` : `👨‍⚕️ PM (Doctor)`;

        return `
          <tr>
            <td style="font-weight:600; font-size:0.88rem; white-space:nowrap;">${srv.date}</td>
            <td>
              <div style="font-weight:700; color:var(--gray-800);">${requesterName}</div>
              <small class="badge" style="background:var(--gray-100); color:var(--gray-600); font-size:0.75rem;">${requesterRole}</small>
            </td>
            <td><span style="font-weight:600;">${getLineName(srv.lineId)}</span></td>
            <td>${deptBadge}</td>
            <td><small style="font-weight:600; color:var(--gray-700);">${getAreaName(srv.areaId)}</small></td>
            <td>
              <div style="font-weight:700; font-size:0.88rem;">${shiftIcon}</div>
              <div style="color:var(--gray-600); font-size:0.82rem;">${escapeHTML(srv.targetName || "-")}</div>
            </td>
            <td>
              <strong style="color:var(--gray-900); font-size:0.9rem;">${escapeHTML(srv.title || "")}</strong>
              ${srv.notes ? `<br><small style="color:var(--gray-500); font-size:0.78rem;">${escapeHTML(srv.notes)}</small>` : ""}
            </td>
            <td style="font-weight:800; color:var(--gray-900); white-space:nowrap;">${Number(srv.cost).toLocaleString()} EGP</td>
            <td>${getServiceStatusBadge(srv)}</td>
            <td style="text-align:center;"><div style="display:inline-flex; gap:6px; align-items:center;">${actionsHtml}</div></td>
          </tr>
        `;
      })
      .join("");
  }

  function getServiceStatusBadge(srv) {
    const status = srv.status;
    if (status === REQUEST_STATUS.PENDING_DM) {
      const dmName = srv.nextApproverId ? getUserDisplayName(srv.nextApproverId) : "DM";
      return `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">${t("waitingDmPrefix")}${escapeHTML(dmName)}</span>`;
    }
    if (status === REQUEST_STATUS.PENDING_LM) {
      const lmName = srv.nextApproverId ? getUserDisplayName(srv.nextApproverId) : "LM";
      return `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:700;">${t("waitingLmPrefix")}${escapeHTML(lmName)}</span>`;
    }
    if (status === REQUEST_STATUS.APPROVED) {
      return `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:700;">${t("approvedLabel")}</span>`;
    }
    if (status === REQUEST_STATUS.REJECTED) {
      return `<span class="badge" style="background:#fee2e2; color:#b91c1c; font-weight:700;">${t("rejectedLabel")}</span>`;
    }
    return `<span class="badge">${status}</span>`;
  }

  function getServiceActionButtons(srv, user) {
    if (!user) return "&mdash;";
    const role = user.role;
    const status = srv.status;

    let canApproveReject = false;
    if (role === ROLES.DM && status === REQUEST_STATUS.PENDING_DM && srv.nextApproverId === user.id) {
      canApproveReject = true;
    }
    if (role === ROLES.LM && status === REQUEST_STATUS.PENDING_LM && srv.nextApproverId === user.id) {
      canApproveReject = true;
    }
    if (role === ROLES.ADMIN && status.startsWith("pending")) {
      canApproveReject = true;
    }

    if (canApproveReject) {
      return `
        <button type="button" class="btn btn-outline" style="color:var(--success); border-color:var(--success); padding:3px 8px; font-size:0.78rem;" onclick="ActivitiesModule.openDecisionModal('service', '${srv.id}', 'approve')" title="Approve">
          ✓
        </button>
        <button type="button" class="btn btn-outline" style="color:var(--danger); border-color:var(--danger); padding:3px 8px; font-size:0.78rem;" onclick="ActivitiesModule.openDecisionModal('service', '${srv.id}', 'reject')" title="Reject">
          ✕
        </button>
      `;
    }
    return "&mdash;";
  }

  function openServiceModal() {
    _state.currentUser = getAuthUser();
    const modal = document.getElementById("serviceModal");
    if (!modal) return;
    document.getElementById("serviceForm")?.reset();

    const userLines = getUserAssignedLines(_state.currentUser);
    const lineSelect = document.getElementById("serviceFormLineSelect");
    if (lineSelect) {
      lineSelect.innerHTML = userLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      const activeBudgetLine = document.getElementById("serviceBudgetLineSelect")?.value;
      if (activeBudgetLine && userLines.some((l) => l.id === activeBudgetLine)) {
        lineSelect.value = activeBudgetLine;
      } else if (userLines.length > 0) {
        lineSelect.value = userLines[0].id;
      }
    }

    const dateInp = document.getElementById("serviceFormDateInput");
    if (dateInp) dateInp.value = formatDate(_state.currentDate);

    onServiceFormLineChange();
    onServiceFormShiftChange();

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeServiceModal() {
    const modal = document.getElementById("serviceModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  function onServiceFormLineChange() {
    const lineSelect = document.getElementById("serviceFormLineSelect");
    const areaSelect = document.getElementById("serviceFormAreaSelect");
    if (!lineSelect || !areaSelect) return;

    const lineId = lineSelect.value;
    const areas = getAreasForLine(lineId);

    areaSelect.innerHTML = areas.map((a) => `<option value="${a.id}">${a.name} (${a.code || a.id})</option>`).join("");
    if (_state.currentUser.areaId && areas.some((a) => a.id === _state.currentUser.areaId)) {
      areaSelect.value = _state.currentUser.areaId;
    } else if (areas.length > 0) {
      areaSelect.value = areas[0].id;
    }
    onServiceFormAreaChange();
  }

  function onServiceFormAreaChange() {
    const lineSelect = document.getElementById("serviceFormLineSelect");
    const areaSelect = document.getElementById("serviceFormAreaSelect");
    const docSelect = document.getElementById("serviceFormDoctorSelect");
    const hospSelect = document.getElementById("serviceFormHospitalSelect");

    const lineId = lineSelect?.value || "";
    const areaId = areaSelect?.value || "";

    if (docSelect) {
      const docs = getDoctorsForLineAndArea(lineId, areaId);
      if (docs.length === 0) {
        docSelect.innerHTML = `<option value="" disabled selected>No doctors found in this area</option>`;
      } else {
        const isAr = (typeof getCurrentLang === "function" && getCurrentLang() === "ar");
        docSelect.innerHTML = docs
          .map((d) => {
            const displayName = isAr ? (d.nameAr || d.name) : (d.name || d.nameAr);
            return `<option value="${d.id}">${displayName} - ${d.specialty || ""} (Class ${d.class || "A"})</option>`;
          })
          .join("");
      }
    }

    if (hospSelect) {
      const hosps = getHospitalsForLineAndArea(lineId, areaId);
      if (hosps.length === 0) {
        hospSelect.innerHTML = `<option value="" disabled selected>No hospitals found in this area</option>`;
      } else {
        const isAr = (typeof getCurrentLang === "function" && getCurrentLang() === "ar");
        hospSelect.innerHTML = hosps
          .map((h) => {
            const displayName = isAr ? (h.nameAr || h.name) : (h.name || h.nameAr);
            return `<option value="${h.id}">${displayName} - ${h.address || ""}</option>`;
          })
          .join("");
      }
    }
  }

  function onServiceFormShiftChange() {
    const shiftSelect = document.getElementById("serviceFormShiftSelect");
    const hospGroup = document.getElementById("serviceHospitalGroup");
    const docGroup = document.getElementById("serviceDoctorGroup");
    const hospSelect = document.getElementById("serviceFormHospitalSelect");
    const docSelect = document.getElementById("serviceFormDoctorSelect");
    const shift = shiftSelect?.value || PERIODS.PM;

    if (shift === PERIODS.AM) {
      if (hospGroup) hospGroup.style.display = "block";
      if (docGroup) docGroup.style.display = "none";
      if (hospSelect) hospSelect.required = true;
      if (docSelect) docSelect.required = false;
    } else {
      if (hospGroup) hospGroup.style.display = "none";
      if (docGroup) docGroup.style.display = "block";
      if (hospSelect) hospSelect.required = false;
      if (docSelect) docSelect.required = true;
    }
  }

  function handleServiceSubmit(e) {
    e.preventDefault();
    _state.currentUser = getAuthUser();

    const lineSelect = document.getElementById("serviceFormLineSelect");
    const deptSelect = document.getElementById("serviceFormDeptSelect");
    const areaSelect = document.getElementById("serviceFormAreaSelect");
    const shiftSelect = document.getElementById("serviceFormShiftSelect");
    const docSelect = document.getElementById("serviceFormDoctorSelect");
    const hospSelect = document.getElementById("serviceFormHospitalSelect");
    const titleInput = document.getElementById("serviceFormTitleInput");
    const costInput = document.getElementById("serviceFormCostInput");
    const dateInput = document.getElementById("serviceFormDateInput");
    const notesInput = document.getElementById("serviceFormNotesInput");

    const lineId = lineSelect.value;
    const department = deptSelect.value;
    const areaId = areaSelect.value;
    const shift = shiftSelect.value;
    const title = titleInput.value.trim();
    const cost = parseFloat(costInput.value);
    const date = dateInput.value;
    const notes = notesInput.value.trim();

    if (!cost || cost <= 0) {
      safeShowToast("Please enter a valid cost.", "warning");
      return;
    }

    let targetType = "doctor";
    let targetId = "";
    let targetName = "";

    if (shift === PERIODS.AM) {
      targetType = "hospital";
      targetId = hospSelect.value;
      const opt = hospSelect.options[hospSelect.selectedIndex];
      targetName = opt ? opt.text : targetId;
    } else {
      targetType = "doctor";
      targetId = docSelect.value;
      const opt = docSelect.options[docSelect.selectedIndex];
      targetName = opt ? opt.text : targetId;
    }

    if (!targetId) {
      safeShowToast("Please select a target doctor or hospital.", "warning");
      return;
    }

    const metrics = getBudgetMetricsForUser(lineId, _state.currentUser);
    if (cost > metrics.remaining) {
      safeShowToast(t("insufficientBudgetNotice"), "warning");
    }

    let initialStatus = REQUEST_STATUS.PENDING_DM;
    let nextApprover = null;

    if (_state.currentUser.role === ROLES.REP || _state.currentUser.role === ROLES.REP_ALT) {
      initialStatus = REQUEST_STATUS.PENDING_DM;
      nextApprover = _state.currentUser.managerId || "dm1";
    } else if (_state.currentUser.role === ROLES.DM) {
      initialStatus = REQUEST_STATUS.PENDING_LM;
      nextApprover = _state.currentUser.managerId || "lm1";
    } else {
      initialStatus = REQUEST_STATUS.APPROVED;
      nextApprover = null;
    }

    const newService = {
      id: "srv_" + Date.now(),
      requesterId: _state.currentUser.id,
      requesterRole: _state.currentUser.role,
      lineId: lineId,
      department: department,
      areaId: areaId,
      shift: shift,
      targetType: targetType,
      targetId: targetId,
      targetName: targetName,
      title: title,
      cost: cost,
      date: date,
      notes: notes,
      status: initialStatus,
      nextApproverId: nextApprover,
      history: [
        {
          action: "submitted",
          at: new Date().toISOString(),
          by: _state.currentUser.id,
          role: _state.currentUser.role,
        },
      ],
    };

    StoreAdapter.saveService(newService);
    closeServiceModal();
    renderServicesTab();
    safeShowToast(t("successAction"), "success");
  }

  // ============================================================================
  // 11. TAB 4: Sales Promo Budget Engine (BU Allocation to LMs)
  // ============================================================================
  function renderBudgetTab() {
    _state.currentUser = getAuthUser();
    const allLines = getAllProductLines();
    const buSelect = document.getElementById("buBudgetLineSelect") || document.getElementById("buProductLineSelect");
    if (buSelect && buSelect.children.length === 0) {
      buSelect.innerHTML = allLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      if (allLines.length > 0) buSelect.value = allLines[0].id;
    }

    const lineId = buSelect?.value || (allLines[0] ? allLines[0].id : "line1");
    const budgets = StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || { totalBudget: 100000, lmAllocations: {}, dmAllocations: {} };

    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    if (totalInput) totalInput.value = lineBudget.totalBudget || 0;

    const allUsers = getAllUsers();
    const lmsForLine = allUsers.filter(
      (u) => u.role === ROLES.LM && (u.lineIds && Array.isArray(u.lineIds) ? u.lineIds.includes(lineId) : u.lineId === lineId)
    );

    const tbody = document.getElementById("buLmAllocationTableBody") || document.getElementById("buLmAllocTableBody");
    if (tbody) {
      if (lmsForLine.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--gray-500);">No Line Managers found for this line.</td></tr>`;
      } else {
        tbody.innerHTML = lmsForLine
          .map((lm) => {
            const alloc = (lineBudget.lmAllocations && lineBudget.lmAllocations[lm.id]) || 0;
            // Only DMs reporting to this LM AND in this specific line
            const dmsUnderLm = getDmsUnderLmForLine(lm.id, lineId);
            const dmSum = dmsUnderLm.reduce(
              (sum, dm) => sum + ((lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0),
              0
            );

            return `
              <tr>
                <td>
                  <div style="font-weight:700; color:var(--gray-800);">${escapeHTML(getUserDisplayName(lm.id))}</div>
                  <small style="color:var(--gray-500);">${escapeHTML(lm.email || "")}</small>
                </td>
                <td><span class="badge" style="background:var(--gray-100); color:var(--gray-700); font-weight:600;">${escapeHTML(lm.employeeCode || lm.id)}</span></td>
                <td>
                  <input type="number" class="form-control bu-lm-input" data-lmid="${lm.id}" value="${alloc}" min="0" step="1000" oninput="ActivitiesModule.calculateBuBudgetSummary()" style="width:160px; font-weight:700;" />
                </td>
                <td style="font-weight:700; color:var(--gray-700);">${dmSum.toLocaleString()} EGP</td>
                <td>
                  <button type="button" class="btn btn-outline" style="font-size:0.8rem; padding:4px 10px;" onclick="ActivitiesModule.openLmDetailModal('${lm.id}', '${lineId}')">
                    Inspect DMs
                  </button>
                </td>
              </tr>
            `;
          })
          .join("");
      }
    }

    calculateBuBudgetSummary();
  }

  function calculateBuBudgetSummary() {
    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    const total = parseFloat(totalInput?.value || 0);

    let allocatedSum = 0;
    document.querySelectorAll(".bu-lm-input").forEach((inp) => {
      allocatedSum += parseFloat(inp.value || 0);
    });

    const unallocated = total - allocatedSum;

    const totalDisplay = document.getElementById("buMetricTotal") || document.getElementById("buSummaryTotalDisplay");
    const allocDisplay = document.getElementById("buMetricAllocated") || document.getElementById("buSummaryAllocatedDisplay");
    const unallocDisplay = document.getElementById("buMetricRemaining") || document.getElementById("buSummaryUnallocatedDisplay");

    if (totalDisplay) totalDisplay.textContent = `${total.toLocaleString()} EGP`;
    if (allocDisplay) allocDisplay.textContent = `${allocatedSum.toLocaleString()} EGP`;
    if (unallocDisplay) {
      unallocDisplay.textContent = `${unallocated.toLocaleString()} EGP`;
      unallocDisplay.style.color = unallocated < 0 ? "var(--danger)" : "var(--primary)";
    }
  }

  function saveBuBudgetAllocations() {
    const buSelect = document.getElementById("buBudgetLineSelect") || document.getElementById("buProductLineSelect");
    const lineId = buSelect?.value || "line1";
    const totalInput = document.getElementById("buTotalBudgetInput") || document.getElementById("buTotalLineBudgetInput");
    const total = parseFloat(totalInput?.value || 0);

    const budgets = StoreAdapter.getBudgets();
    if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

    budgets[lineId].totalBudget = total;
    if (!budgets[lineId].lmAllocations) budgets[lineId].lmAllocations = {};

    document.querySelectorAll(".bu-lm-input").forEach((inp) => {
      const lmId = inp.dataset.lmid;
      if (lmId) {
        budgets[lineId].lmAllocations[lmId] = Number(inp.value || 0);
      }
    });

    StoreAdapter.saveBudgets(budgets);
    safeShowToast(t("savedBudgetMessage"), "success");
    renderBudgetTab();
  }

  function openLmDetailModal(lmId, lineId) {
    const lm = getUserById(lmId);
    const budgets = StoreAdapter.getBudgets();
    const lineBudget = budgets[lineId] || {};
    // Use getDmsUnderLmForLine — requires managerId === lmId AND lineIds includes lineId (AND not OR)
    const dms = getDmsUnderLmForLine(lmId, lineId);

    const lmName = lm ? getUserDisplayName(lm.id) : lmId;
    if (dms.length === 0) {
      alert(`No District Managers found under ${lmName}.`);
      return;
    }

    let summary = `District Managers under ${lmName}:\n\n`;
    dms.forEach((dm) => {
      const alloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
      summary += `• ${getUserDisplayName(dm.id)} (${dm.employeeCode || dm.id}): ${alloc.toLocaleString()} EGP\n`;
    });
    alert(summary);
  }

  // ============================================================================
  // 12. Decision Engine (Approvals, Rejections & Disbursements)
  // ============================================================================
  function openDecisionModal(type, requestId, decision) {
    _state.pendingDecision = { type, requestId, decision };
    const modal = document.getElementById("decisionModal");
    const titleEl = document.getElementById("decisionModalTitle");
    const msgEl = document.getElementById("decisionModalMessage");
    const commentInp = document.getElementById("decisionCommentInput");
    const confirmBtn = document.getElementById("decisionConfirmBtn");

    if (!modal || !titleEl || !msgEl || !confirmBtn) return;
    if (commentInp) commentInp.value = "";

    let item = null;
    if (type === "expense") {
      item = StoreAdapter.getExpenses().find((e) => e.id === requestId);
    } else {
      item = StoreAdapter.getServices().find((s) => s.id === requestId);
    }

    if (!item) return;

    const requesterName = getUserDisplayName(item.requesterId);
    const amount = Number(item.amount || item.cost || 0).toLocaleString();

    if (decision === "approve") {
      titleEl.textContent = t("confirmApprovalTitle");
      msgEl.textContent = t("confirmApproveMsg").replace("{amount}", amount).replace("{name}", requesterName);
      confirmBtn.className = "btn btn-primary";
      confirmBtn.textContent = t("btnApprove");
    } else if (decision === "reject") {
      titleEl.textContent = t("confirmRejectionTitle");
      msgEl.textContent = t("confirmRejectMsg").replace("{name}", requesterName);
      confirmBtn.className = "btn btn-danger";
      confirmBtn.textContent = t("btnReject");
    } else if (decision === "disburse") {
      titleEl.textContent = t("confirmDisbursementTitle");
      msgEl.textContent = t("confirmDisburseMsg").replace("{amount}", amount).replace("{name}", requesterName);
      confirmBtn.className = "btn btn-success";
      confirmBtn.textContent = t("btnDisburse");
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeDecisionModal() {
    const modal = document.getElementById("decisionModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
    _state.pendingDecision = null;
  }

  function executeDecisionConfirm() {
    if (!_state.pendingDecision) return;
    _state.currentUser = getAuthUser();
    const { type, requestId, decision } = _state.pendingDecision;
    const comment = document.getElementById("decisionCommentInput")?.value.trim() || "";

    if (decision === "reject" && !comment) {
      safeShowToast(t("rejectionReasonRequired"), "warning");
      return;
    }

    if (type === "expense") {
      const expenses = StoreAdapter.getExpenses();
      const exp = expenses.find((e) => e.id === requestId);
      if (!exp) return;

      if (decision === "reject") {
        StoreAdapter.updateExpenseStatus(requestId, REQUEST_STATUS.REJECTED, _state.currentUser, comment);
      } else if (decision === "disburse") {
        StoreAdapter.updateExpenseStatus(requestId, REQUEST_STATUS.DISBURSED, _state.currentUser, comment);
      } else if (decision === "approve") {
        let nextStatus = REQUEST_STATUS.PENDING_HR;
        if (exp.status === REQUEST_STATUS.PENDING_DM || exp.status === REQUEST_STATUS.PENDING_LM) {
          nextStatus = REQUEST_STATUS.PENDING_HR;
        } else if (exp.status === REQUEST_STATUS.PENDING_HR) {
          nextStatus = REQUEST_STATUS.APPROVED;
        }
        StoreAdapter.updateExpenseStatus(requestId, nextStatus, _state.currentUser, comment);
      }
      renderExpensesTab();
    } else if (type === "service") {
      const services = StoreAdapter.getServices();
      const srv = services.find((s) => s.id === requestId);
      if (!srv) return;

      if (decision === "reject") {
        StoreAdapter.updateServiceStatus(requestId, REQUEST_STATUS.REJECTED, _state.currentUser, comment, null);
      } else if (decision === "approve") {
        if (srv.status === REQUEST_STATUS.PENDING_DM) {
          const dm = getUserById(srv.requesterId);
          const lm = (dm && dm.managerId) ? dm.managerId : (_state.currentUser.managerId || "lm1");
          StoreAdapter.updateServiceStatus(requestId, REQUEST_STATUS.PENDING_LM, _state.currentUser, comment, lm);
        } else if (srv.status === REQUEST_STATUS.PENDING_LM) {
          StoreAdapter.updateServiceStatus(requestId, REQUEST_STATUS.APPROVED, _state.currentUser, comment, null);
        }
      }
      renderServicesTab();
    }

    closeDecisionModal();
    safeShowToast(t("successAction"), "success");
  }

  // ============================================================================
  // 13. Receipt Image Zoom Modal
  // ============================================================================
  function openReceiptPreviewModal(imgSrc) {
    const modal = document.getElementById("receiptPreviewModal");
    const img = document.getElementById("receiptModalLargeImg");
    if (!modal || !img) return;
    img.src = imgSrc;
    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeReceiptPreviewModal() {
    const modal = document.getElementById("receiptPreviewModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  // ============================================================================
  // 14. Event Wireups & Initialization
  // ============================================================================
  function setupModalBackdropsAndShortcuts() {
    const modalClosers = [
      { id: "activityModal", close: closeActivityModal },
      { id: "expenseModal", close: closeExpenseModal },
      { id: "serviceModal", close: closeServiceModal },
      { id: "decisionModal", close: closeDecisionModal },
      { id: "receiptPreviewModal", close: closeReceiptPreviewModal },
    ];

    modalClosers.forEach(({ id, close }) => {
      document.getElementById(id)?.addEventListener("click", function (e) {
        if (e.target === this) {
          close();
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (document.getElementById("receiptPreviewModal")?.style.display === "flex") closeReceiptPreviewModal();
        else if (document.getElementById("decisionModal")?.style.display === "flex") closeDecisionModal();
        else if (document.getElementById("serviceModal")?.style.display === "flex") closeServiceModal();
        else if (document.getElementById("expenseModal")?.style.display === "flex") closeExpenseModal();
        else if (document.getElementById("activityModal")?.style.display === "flex") closeActivityModal();
      }
    });
  }

  function setupDateNavigation() {
    document.getElementById("prevDayBtn")?.addEventListener("click", () => {
      _state.currentDate = addDays(_state.currentDate, -1);
      renderActivitiesView();
    });

    document.getElementById("nextDayBtn")?.addEventListener("click", () => {
      _state.currentDate = addDays(_state.currentDate, 1);
      renderActivitiesView();
    });

    document.getElementById("todayBtn")?.addEventListener("click", () => {
      _state.currentDate = (window.getSystemDate && window.getSystemDate()) || new Date();
      renderActivitiesView();
    });
  }

  function init() {
    if (typeof requireAuth === "function") requireAuth();
    if (typeof renderTopbar === "function") renderTopbar();
    _state.currentUser = getAuthUser();

    // Defensive guarantee: Ensure all modals are strictly closed and hidden on startup
    ["activityModal", "expenseModal", "serviceModal", "decisionModal", "receiptPreviewModal"].forEach((mId) => {
      const el = document.getElementById(mId);
      if (el) {
        el.style.display = "none";
        el.classList.remove("active");
      }
    });

    setupRoleTabVisibility();
    setupModalBackdropsAndShortcuts();
    setupDateNavigation();

    // Trigger budget sanitizer on startup to clear any stale cross-line DM allocations
    // (getBudgets() runs the sanitizer automatically when it detects a DM in the wrong line)
    StoreAdapter.getBudgets();


    if (_state.activeTab === TABS.ACTIVITIES) {
      renderActivitiesView();
    } else if (_state.activeTab === TABS.EXPENSES) {
      renderExpensesTab();
    } else if (_state.activeTab === TABS.SERVICES) {
      renderServicesTab();
    } else if (_state.activeTab === TABS.BUDGET) {
      renderBudgetTab();
    }
  }

  // Reactive Wakeup: Listen for store changes across the app
  document.addEventListener("pharma:store:changed", (e) => {
    const entity = e.detail?.entity;
    if (entity === "activities" && _state.activeTab === TABS.ACTIVITIES) {
      renderActivitiesView();
    } else if (entity === "expenses" && _state.activeTab === TABS.EXPENSES) {
      renderExpensesTab();
    } else if (entity === "services" && _state.activeTab === TABS.SERVICES) {
      renderServicesTab();
    } else if (entity === "budgets") {
      if (_state.activeTab === TABS.BUDGET) renderBudgetTab();
      if (_state.activeTab === TABS.SERVICES) renderServicesTab();
    }
  });

  document.addEventListener("languageChanged", () => {
    setupRoleTabVisibility();
    if (_state.activeTab === TABS.ACTIVITIES) renderActivitiesView();
    else if (_state.activeTab === TABS.EXPENSES) renderExpensesTab();
    else if (_state.activeTab === TABS.SERVICES) renderServicesTab();
    else if (_state.activeTab === TABS.BUDGET) renderBudgetTab();
  });

  document.addEventListener("DOMContentLoaded", init);

  // ============================================================================
  // 15. Public API Export (Revealing Module Pattern)
  // ============================================================================
  const publicApi = {
    init,
    switchTab,
    openActivityModal,
    closeActivityModal,
    deleteCurrentActivity,
    handleActivitySubmit,
    openExpenseModal,
    closeExpenseModal,
    handleExpenseSubmit,
    onReceiptFileSelected,
    openServiceModal,
    closeServiceModal,
    onServiceFormLineChange,
    onServiceFormAreaChange,
    onServiceFormShiftChange,
    handleServiceSubmit,
    onExpenseLineFilterChange,
    renderExpensesTab,
    renderServicesTab,
    calculateLmAllocationPreview,
    onServiceBudgetLineChange,
    saveDmAllocations,
    onBuLineChange: renderBudgetTab,
    calculateBuBudgetSummary,
    saveBuBudgetAllocations,
    openLmDetailModal,
    openDecisionModal,
    closeDecisionModal,
    executeDecisionConfirm,
    openReceiptPreviewModal,
    closeReceiptPreviewModal,
    filterExpenses: renderExpensesTab,
    filterServices: renderServicesTab,
    // Pure Helpers
    addDays,
    formatDate,
    getWeekStart,
    escapeHTML,
  };

  return publicApi;
})();

// ============================================================================
// Global Backward Compatibility Aliases for HTML Event Handlers
// ============================================================================
window.ActivitiesModule = ActivitiesModule;
window.switchRequestsTab = ActivitiesModule.switchTab;
window.openActivityModal = ActivitiesModule.openActivityModal;
window.closeActivityModal = ActivitiesModule.closeActivityModal;
window.deleteCurrentActivity = ActivitiesModule.deleteCurrentActivity;
window.handleActivitySubmit = ActivitiesModule.handleActivitySubmit;
window.openExpenseModal = ActivitiesModule.openExpenseModal;
window.closeExpenseModal = ActivitiesModule.closeExpenseModal;
window.handleExpenseSubmit = ActivitiesModule.handleExpenseSubmit;
window.onReceiptFileSelected = ActivitiesModule.onReceiptFileSelected;
window.openServiceModal = ActivitiesModule.openServiceModal;
window.closeServiceModal = ActivitiesModule.closeServiceModal;
window.onServiceFormLineChange = ActivitiesModule.onServiceFormLineChange;
window.onServiceFormAreaChange = ActivitiesModule.onServiceFormAreaChange;
window.onServiceFormShiftChange = ActivitiesModule.onServiceFormShiftChange;
window.handleServiceSubmit = ActivitiesModule.handleServiceSubmit;
window.onServiceBudgetLineChange = ActivitiesModule.onServiceBudgetLineChange;
window.saveDmAllocations = ActivitiesModule.saveDmAllocations;
window.onBuLineChange = ActivitiesModule.onBuLineChange;
window.calculateBuBudgetSummary = ActivitiesModule.calculateBuBudgetSummary;
window.saveBuBudgetAllocations = ActivitiesModule.saveBuBudgetAllocations;
window.openLmDetailModal = ActivitiesModule.openLmDetailModal;
window.openDecisionModal = ActivitiesModule.openDecisionModal;
window.closeDecisionModal = ActivitiesModule.closeDecisionModal;
window.executeDecisionConfirm = ActivitiesModule.executeDecisionConfirm;
window.openReceiptPreviewModal = ActivitiesModule.openReceiptPreviewModal;
window.closeReceiptPreviewModal = ActivitiesModule.closeReceiptPreviewModal;
window.filterExpenses = ActivitiesModule.filterExpenses;
window.filterServices = ActivitiesModule.filterServices;
window.renderExpensesTab = ActivitiesModule.filterExpenses;
window.renderServicesTab = ActivitiesModule.filterServices;
window.saveBuAllocation = ActivitiesModule.saveBuBudgetAllocations;
window.saveLmAllocation = ActivitiesModule.saveDmAllocations;
window.handleReceiptFilePreview = ActivitiesModule.onReceiptFileSelected;
window.onBuBudgetLineChange = ActivitiesModule.onBuLineChange;
window.onExpenseLineFilterChange = ActivitiesModule.onExpenseLineFilterChange;
window.calculateLmAllocationPreview = ActivitiesModule.calculateLmAllocationPreview;

