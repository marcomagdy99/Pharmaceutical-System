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
    PENDING_BU: "pending_bu",
    PENDING_PM: "pending_pm",
    PENDING_GM: "pending_gm",
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
    GM: "general_manager",
    HR: "hr",
    ADMIN: "admin",
    PM: "product_manager",
  });

  // ============================================================================
  // 2. Comprehensive Bilingual Dictionary
  // ============================================================================
  const activityTranslations = {
    en: {
      "activitiesTitle": "PharmaCare - Field Requests",
      "dailyActivities": "Daily Activities",
      "tabDailyActivities": "Daily Activities",
      "tabExpenses": "Request Expenses",
      "tabServices": "Request Services",
      "tabSalesBudget": "Sales Budget",
      "today": "Today",
      "amPeriod": "AM Period",
      "pmPeriod": "PM Period",
      "logActivity": "Log Activity",
      "logActivityTitle": "Log Activity",
      "weeklyOverview": "Weekly Overview (Sat - Fri)",
      "period": "Period",
      "activityType": "Activity Type",
      "selectActivity": "Select Activity...",
      "typeVisit": "Visit",
      "typeOfficeWork": "Office Work",
      "typeTraining": "Training",
      "typeMeeting": "Meeting",
      "typeConference": "Conference",
      "notes": "Notes",
      "cancel": "Cancel",
      "save": "Save",
      "deleteActivity": "Delete Activity",
      "confirmDeleteActivity": "Are you sure you want to delete this activity?",
      "activityDeleted": "Activity deleted successfully.",
      "selectActivityTypeWarning": "Please select an activity type.",
      "statusLogged": "Logged",
      "statusNotLogged": "Not Logged",
      "goToVisits": "Open Visits Planner",
      "noActivityLogged": "No activity logged for this period.",
      "sat": "Saturday",
      "sun": "Sunday",
      "mon": "Monday",
      "tue": "Tuesday",
      "wed": "Wednesday",
      "thu": "Thursday",
      "fri": "Friday",
      "expensesTitle": "Travel & Field Expenses",
      "expensesSubtitle": "Manage field travel, fuel, tolls, and hospitality claims with hierarchical approval.",
      "btnNewExpense": "New Expense Claim",
      "pendingApproval": "Pending Approvals",
      "approvedExpenses": "Approved Claims",
      "disbursedExpenses": "Disbursed / Paid",
      "allStatuses": "All Statuses",
      "filterPending": "Pending Review",
      "filterApproved": "Approved",
      "filterRejected": "Rejected",
      "filterDisbursed": "Disbursed",
      "allCategories": "All Categories",
      "catTravel": "Travel & Transportation",
      "catFuelTolls": "Fuel & Road Tolls",
      "catHospitality": "Hospitality & Meetings",
      "catHotel": "Hotel Accommodation",
      "colDate": "Date",
      "colEmployee": "Employee",
      "colCategory": "Category",
      "colAmount": "Amount",
      "colReceipt": "Receipt",
      "colStatus": "Status",
      "colActions": "Actions",
      "modalNewExpenseTitle": "Submit Travel & Field Expense",
      "receiptHelp": "Take photo or attach clear invoice image.",
      "btnSubmitClaim": "Submit Claim",
      "noExpensesFound": "No expense claims found matching your filter.",
      "servicesTitle": "Doctor & Hospital Services",
      "servicesSubtitle": "Sponsor medical congresses, clinic awareness materials, and round table discussions.",
      "btnNewService": "New Service Request",
      "unassignedAccount": "Account / Facility",
      "weekendHolidayNotice": "Selected date is a weekend/holiday. Only emergency activities allowed.",
      "weekendPmNotice": "Night activities on weekends require line manager approval.",
      "allocatedBudgetOverview": "Allocated Promo Budget",
      "lineFilterLabel": "Line:",
      "filterEmployee": "Employee:",
      "totalAllocatedBudget": "Total Budget",
      "districtBudget": "District Budget",
      "distributedToDms": "Distributed to DMs",
      "approvedSpent": "Approved & Utilized",
      "pendingServices": "Pending In Requests",
      "remainingBudget": "Remaining Balance",
      "distributeToDmsTitle": "Distribute Line Budget to District Managers (DMs)",
      "distributeToDmsSubtitle": "Allocate portions of your received line budget to each DM under your line.",
      "saveAllocations": "Save Allocations",
      "distributeToRepsTitle": "Distribute District Budget to Medical Reps",
      "distributeToRepsSubtitle": "Allocate portions of your received district budget to each Medical Rep under your district.",
      "saveRepsAllocations": "Save Reps Allocations",
      "colDm": "District Manager (DM)",
      "colRep": "Medical Rep",
      "colCode": "Code",
      "colAllocatedAmount": "Allocated Budget (EGP)",
      "colUtilized": "Utilized",
      "distributedToReps": "Distributed to Reps",
      "myAllocatedBudget": "My Allocated Budget",
      "savedRepBudgetMessage": "Rep allocations saved successfully.",
      "unauthorizedRepBudgetAction": "You are not authorized to edit representative allocations.",
      "allDepts": "All Departments",
      "deptSales": "Sales Services",
      "deptMarketing": "Marketing Services",
      "colLine": "Line",
      "colDept": "Dept",
      "colArea": "Area",
      "colShiftTarget": "Shift & Target",
      "colService": "Service Title",
      "colCost": "Cost",
      "colShift": "Shift Period",
      "modalNewServiceTitle": "New Doctor / Hospital Service Request",
      "targetHospital": "Target Hospital / Center",
      "targetDoctor": "Target Doctor",
      "serviceCategoryLabel": "Service Category",
      "selectCategoryPrompt": "Select Service Category...",
      "serviceTitleLabel": "Event Title / Purpose",
      "serviceDateLabel": "Expected Execution Date",
      "btnSubmitService": "Submit Service Request",
      "noServicesFound": "No service requests found matching your filter.",
      "sharedServiceToggleLabel": "Split Cost across Multiple Lines / Territories",
      "sharedSubtitle": "Distribute cost percentage across participating lines or territories",
      "btnAddSharedLine": "Add Participating Line / Area",
      "sharedPrimaryTitle": "Primary Line (Request Initiator)",
      "sharedParticipatingTitle": "Participating Line",
      "sharedLineLabel": "Product Line",
      "sharedAreaLabel": "Territory / Area",
      "sharedTotalCost": "Total Cost",
      "sharedAllocated": "Allocated",
      "sharedRemaining": "Remaining",
      "sharedSelectLinePrompt": "-- Select Product Line --",
      "sharedSelectAreaPrompt": "-- Select Area / Territory --",
      "sharedAssignedRep": "Assigned Rep",
      "sharedNoRepAssigned": "No Rep Assigned",
      "sharedShare": "Share",
      "sharedValidationComplete": "100% Fully Allocated",
      "sharedValidationIncomplete": "Current Sum {pct}% (Remaining {rem}%)",
      "sharedExceedsNotice": "Total share percentages must equal exactly 100%.",
      "sharedBadge": "Shared Service",
      "partnerBadge": "Partner Share",
      "currency": "EGP",
      "attachmentLabel": "Attachment",
      "viewAttachment": "View Attachment",
      "yourShare": "Your Share",
      "sharedIntraLineBadge": "Intra-Line Share",
      "serviceAttachmentLabel": "Quotation / Invoice Attachment (Optional)",
      "noBudgetAllocated": "Doctor services budget has not been allocated for this product line yet. Please consult your manager.",
      "budgetExceededNotice": "Requested service cost exceeds remaining promotional budget.",
      "buBudgetTitle": "Sales Budget Allocation",
      "buBudgetSubtitle": "Assign and allocate sales promo budgets per product line to Line Managers (LMs).",
      "selectProductLine": "Product Line:",
      "totalLineBudget": "Total Line Budget",
      "allocatedToLms": "Allocated to LMs",
      "unallocatedRemaining": "Remaining Balance",
      "colLm": "Line Manager (LM)",
      "colDistributedToDms": "Distributed to DMs",
      "waitingDmPrefix": "Pending DM: ",
      "waitingLmPrefix": "Pending LM: ",
      "waitingHr": "Waiting for HR",
      "approvedLabel": "Approved",
      "rejectedLabel": "Rejected",
      "disbursedLabel": "Disbursed",
      "statusPending": "Pending",
      "confirmApprovalTitle": "Confirm Approval",
      "confirmRejectionTitle": "Confirm Rejection",
      "confirmDisbursementTitle": "Confirm Disbursement",
      "confirmApproveMsg": "Are you sure you want to approve this request of {amount} EGP submitted by {name}?",
      "confirmRejectMsg": "Are you sure you want to reject this request submitted by {name}?",
      "confirmDisburseMsg": "Confirm disbursement of {amount} EGP to {name}?",
      "reasonLabel": "Reason / Notes:",
      "reasonPlaceholder": "Enter reason or comments...",
      "btnApprove": "Approve",
      "btnReject": "Reject",
      "btnDisburse": "Disburse",
      "rejectionReasonRequired": "Please provide a rejection reason.",
      "successAction": "Operation completed successfully!",
      "savedBudgetMessage": "Budget allocations saved successfully.",
      "insufficientBudgetNotice": "Notice: Requested cost exceeds the current remaining balance.",
      "noReceipt": "No receipt attached",
      "allLines": "All Product Lines",
      "allEmployees": "All Employees",
      "myRequestsOnly": "My Requests Only",
      "dayOff": "Day Off",
      "noPendingSharesForYou": "No pending shares matched your authorization scope.",
      "noNextApproverFound": "Cannot advance request: No manager found for next approval stage. Please contact admin.",
      "unauthorizedExpenseAction": "You are not authorized to perform this action on this expense claim.",
      "unauthorizedServiceAction": "You are not authorized to perform this action on this service request.",
      "statusApproved": "Approved",
      "statusRejected": "Rejected",
      "statusPendingDM": "Pending DM Approval",
      "statusPendingLM": "Pending Line Manager Approval",
      "statusPendingHR": "Pending HR Approval",
      "statusDisbursed": "Disbursed",
      "badgePendingShared": "Pending Shared Approvals",
      "expenseClaims": "Expense Claims",
      "newExpenseBtn": "New Expense Claim",
      "filterStatusAll": "All Statuses",
      "filterLineAll": "All Lines",
      "colId": "ID",
      "colRequester": "Requester",
      "btnViewReceipt": "View Receipt",
      "btnApproveDM": "Approve (DM)",
      "btnApproveLM": "Approve (LM)",
      "btnApproveHR": "Approve (HR)",
      "btnDisburseHR": "Disburse",
      "btnRejectDM": "Reject",
      "newExpenseModalTitle": "Submit Expense Claim",
      "expenseCategoryTravel": "Travel & Transportation",
      "expenseCategoryMeals": "Meals & Subsistence",
      "expenseCategoryHospitality": "Client Hospitality",
      "expenseCategorySupplies": "Office & Field Supplies",
      "expenseCategoryOther": "Other Expenses",
      "amountLabel": "Amount (EGP):",
      "receiptUploadLabel": "Receipt Image / Invoice:",
      "saveExpenseSuccess": "Expense claim submitted successfully!",
      "serviceRequests": "Service Requests & Clinical Events",
      "newServiceBtn": "New Service Request",
      "colServiceTitle": "Service Title",
      "colServiceTarget": "Target (Doctor/Clinic)",
      "colDepartment": "Department",
      "colShares": "Split Details",
      "btnApproveService": "Approve Service",
      "newServiceModalTitle": "Request Doctor Service / Support",
      "serviceTargetDoctor": "Doctor / Healthcare Professional",
      "serviceTargetHospital": "Hospital / Healthcare Account",
      "serviceCategoryEquipment": "Medical Equipment Support",
      "serviceCategorySponsorship": "Scientific Conference Sponsorship",
      "serviceCategoryCME": "Continuing Medical Education (CME)",
      "serviceCategoryWorkshop": "Clinical Workshop",
      "serviceCategoryOther": "Other Practice Support",
      "sharedServiceToggle": "Split cost across multiple product lines (Shared Service)",
      "sharedLinesTitle": "Line Cost Allocations",
      "addLineShareBtn": "+ Add Line Allocation",
      "saveServiceSuccess": "Service request submitted successfully!",
      "salesBudgetTitle": "Promotional & Field Activity Budget",
      "budgetRemaining": "Remaining Balance",
      "budgetTotal": "Total Allocated",
      "budgetSpent": "Spent to Date",
      "budgetUtilization": "Utilization Rate",
      "updateBudgetBtn": "Adjust Line Budget",
      "budgetModalTitle": "Adjust Product Line Budget",
      "totalBudgetLabel": "Total Annual Budget (EGP):",
      "shiftAM": "Morning Shift (AM)",
      "shiftPM": "Evening Shift (PM)",
      "unauthorizedBudgetAction": "You are not authorized to edit business unit budget.",
      "unauthorizedDmBudgetAction": "You are not authorized to edit district manager allocations.",
      "noApproverConfigured": "No direct manager or approver configured for this request.",
      "noLmsForLine": "No Line Managers found for this line.",
      "inspectDms": "Inspect DMs",
      "budgetOverAllocated": "Total allocated exceeds available budget!",
      "dmsUnderLm": "District Managers under",
      "noDmsUnderLm": "No District Managers found under this Line Manager for the selected line.",
      "totalDmAllocation": "Total allocated to DMs",
      "name": "Name",
      "code": "Code",
      "allocation": "Allocation",
      "savedDmBudgetMessage": "District manager allocations saved successfully.",
      "noRepsFound": "No medical reps found assigned under your district for this product line.",
      "unauthorizedAction": "You are not authorized to perform this action.",
      "budgetExceedsDistributed": "Cannot reduce budget below already distributed amount.",
      "fridayHolidayNotice": "Friday is an official company holiday. No field visits can be scheduled.",
      "fileTooLarge": "Receipt file is too large. Maximum size is 800KB.",
      "invalidDate": "Invalid activity date.",
      "invalidExpenseCategory": "Please select a valid expense category.",
      "invalidAmount": "Please enter a valid expense amount between 1 and 500,000 EGP.",
      "invalidDateRange": "Expense date must be within the last 90 days and not in the future.",
      "notesTooLong": "Notes cannot exceed 1000 characters.",
      "invalidNumber": "Please enter valid positive numbers.",
      "receiptAttachment": "Receipt attachment",
      "selectValidLineWarning": "Please select a specific valid product line.",
      "unauthorizedLineAction": "You are not authorized for this product line.",
      "cannotReduceBelowUtilized": "Cannot reduce allocation below already spent/utilized amount.",
      "serviceSubmittedSuccess": "Service request submitted successfully.",
      "serviceDeletedSuccess": "Service request deleted successfully.",
      "invalidServiceCost": "Please enter a valid service cost between 1 and 1,000,000 EGP.",
      "invalidServiceDate": "Service date must be within the last 90 days and not in the distant future.",
      "notesMaxLimit": "Notes cannot exceed 1000 characters.",
      "serviceTitleRequired": "Please enter a valid service title (up to 200 characters).",
      "waitingBuPrefix": "Pending BU: ",
      "waitingPmPrefix": "Pending PM: ",
      "waitingGmPrefix": "Pending GM: ",
      "intraLineSplit": "Intra-Line",
      "multiLineSplit": "Lines Split",
      "confirmDeleteTitle": "Confirm Deletion",
      "btnDelete": "Delete",
      "unknownUser": "Unknown",
      "signInCostingPrompt": "Please sign in with an authorized account to view costing data.",
      "excelExportLoading": "Excel export library is loading. Please try again in a moment.",
      "noDataToExport": "No data to export.",
      "sessionExpired": "Your session has expired. Please sign in again.",
      "unassignedTerritory": "Unassigned Territory",
      "unassigned": "Unassigned"
    }
  };

  // ============================================================================
  // 3. Pure Helpers & Utilities
  // ============================================================================
  function t(key, fallback) {
    const dict = activityTranslations.en;
    const v = dict?.[key];
    return v !== undefined ? v : (fallback !== undefined ? fallback : key);
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    if (typeof window.escapeHtml === "function" && window.escapeHtml !== escapeHTML) return window.escapeHtml(String(str));
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  if (typeof window.escapeHtml !== "function") {
    window.escapeHtml = escapeHTML;
  }

  function safeShowToast(msg, type = "info") {
    if (typeof showToast === "function") {
      showToast(msg, type);
    } else if (typeof window.showToast === "function") {
      window.showToast(msg, type);
    } else {
      console.warn(msg);
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
      default: return escapeHTML(cat || "");
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
      } catch (e) { console.warn("[ActivitiesCore] Storage save warning:", e); }
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
        } catch (e) {
          console.error("[ActivitiesCore] Failed to save deleted activity to storage:", e);
        }
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
      } catch (e) { console.warn("[ActivitiesCore] Storage quota exceeded while saving expenses:", e); }
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
      } catch (e) { console.warn("[ActivitiesCore] Storage quota exceeded while saving expenses:", e); }
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
      if (!srvObj) return null;
      if (window.store && window.store.services) {
        if (srvObj.id && typeof window.store.services.getById === "function" && window.store.services.getById(srvObj.id)) {
          return window.store.services.update(srvObj.id, srvObj);
        }
        return window.store.services.add(srvObj);
      }
      const list = this.getServices();
      const existingIdx = srvObj.id ? list.findIndex((s) => s.id === srvObj.id) : -1;
      if (existingIdx !== -1) {
        list[existingIdx] = Object.assign({}, list[existingIdx], srvObj);
      } else {
        list.unshift(srvObj);
      }
      try {
        localStorage.setItem("pharma_services_data", JSON.stringify(list));
      } catch (e) { console.warn("[ActivitiesCore] Storage quota exceeded while saving services:", e); }
      return srvObj;
    },

    updateService(srvObj) {
      return this.saveService(srvObj);
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
      } catch (e) { console.warn("[ActivitiesCore] Storage quota exceeded while saving services:", e); }
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
        } catch (e) {
          console.warn("[ActivitiesCore] Failed to parse pharma_sales_budgets from localStorage:", e);
        }
      }
      if (!b) {
        b = {};
      }
      return b;
    },

    saveBudgets(budgetsObj) {
      if (window.store && window.store.budgets) {
        return window.store.budgets.saveAll(budgetsObj);
      }
      try {
        localStorage.setItem("pharma_sales_budgets", JSON.stringify(budgetsObj));
      } catch (e) {
        console.error("[ActivitiesCore] Failed to save pharma_sales_budgets to localStorage:", e);
      }
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

  function normalizeRole(role) {
    if (typeof window !== "undefined" && typeof window.normalizeRole === "function") {
      return window.normalizeRole(role);
    }
    if (!role) return "";
    const r = String(role).toLowerCase().trim();
    if (r === "dm" || r === "district_manager" || r === "district manager") return ROLES.DM;
    if (r === "lm" || r === "line_manager" || r === "line manager") return ROLES.LM;
    if (r === "bu" || r === "business_unit" || r === "business unit") return ROLES.BU;
    if (r === "rep" || r === "medical_rep" || r === "medical rep") return ROLES.REP;
    if (r === "pm" || r === "product_manager" || r === "product manager") return ROLES.PM;
    if (r === "admin" || r === "administrator") return ROLES.ADMIN;
    if (r === "hr" || r === "human_resources" || r === "human resources") return ROLES.HR;
    if (r === "gm" || r === "general_manager" || r === "general manager") return "general_manager";
    return r;
  }

  function getNormalizedRole(userOrRole) {
    if (!userOrRole) return "";
    if (typeof userOrRole === "object") return normalizeRole(userOrRole.role);
    return normalizeRole(userOrRole);
  }

  function getAuthUser() {
    let u = null;
    if (typeof window.requireAuth === "function") {
      u = window.requireAuth();
    } else if (typeof window.checkAuth === "function") {
      u = window.checkAuth();
    }
    if (!u) {
      _state.currentUser = null;
      return null;
    }

    // =========================================================================
    // SECURITY INTEGRITY CHECK: Prevent Client-side Role Tampering
    // =========================================================================
    const canonicalUsers = getAllUsers();
    if (canonicalUsers.length === 0) {
      _state.currentUser = null;
      return null;
    }
    if (u && u.id) {
      const canonical = canonicalUsers.find((user) => user.id === u.id);
      if (!canonical) {
        console.warn(`[SECURITY VIOLATION] User ID '${u.id}' not found in canonical store. Rejecting unauthorized access.`);
        _state.currentUser = null;
        return null;
      }

      if (canonical.role !== u.role) {
        console.warn(`[SECURITY VIOLATION] Role tampering detected for user '${u.id}'. Attempted: '${u.role}', Authentic: '${canonical.role}'. Enforcing authoritative role.`);
      }
      const sanitizedUser = {
        ...u,
        ...canonical,
        role: normalizeRole(canonical.role),
        lineIds: canonical.lineIds && canonical.lineIds.length > 0
          ? [...canonical.lineIds]
          : (canonical.lineId ? [canonical.lineId] : []),
        managerId: canonical.managerId || null,
        areaId: canonical.areaId || null,
        areaIds: Array.isArray(canonical.areaIds) ? [...canonical.areaIds] : (canonical.areaId ? [canonical.areaId] : []),
      };
      _state.currentUser = sanitizedUser;
      return sanitizedUser;
    }

    _state.currentUser = null;
    return null;
  }

  function isActionAuthorized(action, resource, user) {
    if (!user) return false;
    const role = getNormalizedRole(user);
    const isAdmin = role === ROLES.ADMIN || role === "admin" || role === "administrator";

    // Prevent self-approval strictly for all users, including Admin
    const resourceOwnerId = resource && (resource.requesterId || resource.repId || resource.userId);
    if (resourceOwnerId && resourceOwnerId === user.id) {
      return false;
    }

    // Enforce strict State Machine status transitions even for Admin
    if (resource) {
      const status = String(resource.status || "").toLowerCase();
      if (action === "approve_expense") {
        if (!status.startsWith("pending")) return false;
      } else if (action === "disburse_expense") {
        if (status !== REQUEST_STATUS.APPROVED && status !== "approved") return false;
      } else if (action === "reject_expense") {
        if (status === REQUEST_STATUS.REJECTED || status === "rejected" || status === REQUEST_STATUS.DISBURSED || status === "disbursed") return false;
      } else if (action === "approve_service") {
        if (!status.startsWith("pending")) return false;
      } else if (action === "reject_service") {
        if (status === REQUEST_STATUS.REJECTED || status === "rejected" || status === "cancelled") return false;
      } else if (action === "approve_location" || action === "reject_location") {
        if (status !== "pending" && !status.startsWith("pending_")) return false;
      }
    }

    if (isAdmin) {
      if (action === "approve_service" || action === "reject_service" ||
          action === "approve_expense" || action === "reject_expense" || action === "disburse_expense" ||
          action === "approve_location" || action === "reject_location" ||
          action === "allocate_bu_budget" || action === "allocate_lm_budget" || action === "allocate_dm_budget" || action === "allocate_rep_budget") {
        return true;
      }
      return false;
    }

    if (action === "approve_service" || action === "reject_service") {
      if (window.WorkflowEngine && typeof window.WorkflowEngine.isServiceAuthorized === "function") {
        return window.WorkflowEngine.isServiceAuthorized(resource, user, action);
      }
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
      if (role === "general_manager" || role === "gm") {
        return false;
      }
      if (role === ROLES.BU) {
        if (typeof window.canApproveFor === "function" && !window.canApproveFor(resource.requesterId)) return false;
        const uLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id).map(l => l.id) : (user.lineIds || (user.lineId ? [user.lineId] : []));
        if (uLines.length === 0) return false;
        if (resource.isShared && Array.isArray(resource.shares)) {
          return resource.shares.some(sh => uLines.includes(sh.lineId) && sh.status === REQUEST_STATUS.PENDING_BU);
        }
        return uLines.includes(resource.lineId) && resource.status === REQUEST_STATUS.PENDING_BU;
      }
      if (role === ROLES.PM) {
        const userLines = user.lineIds || (user.lineId ? [user.lineId] : []);
        if (resource.department === "marketing") {
          if (resource.isShared && Array.isArray(resource.shares)) {
            return resource.shares.some(sh => userLines.includes(sh.lineId) && sh.status === REQUEST_STATUS.PENDING_PM);
          }
          return userLines.includes(resource.lineId) && resource.status === REQUEST_STATUS.PENDING_PM;
        }
      }
      return false;
    }

    if (action === "approve_expense" || action === "reject_expense" || action === "disburse_expense") {
      if (window.WorkflowEngine && typeof window.WorkflowEngine.isExpenseAuthorized === "function") {
        return window.WorkflowEngine.isExpenseAuthorized(resource, user, action);
      }
      if (!resource) return false;
      if (resource.requesterId === user.id) return false;
      if (role === ROLES.REP || role === ROLES.REP_ALT) return false;
      if (role === ROLES.DM) return resource.status === REQUEST_STATUS.PENDING_DM && resource.nextApproverId === user.id;
      if (role === ROLES.LM) return resource.status === REQUEST_STATUS.PENDING_LM && resource.nextApproverId === user.id;
      if (role === ROLES.HR) return resource.status === REQUEST_STATUS.PENDING_HR || (action === "disburse_expense" && resource.status === REQUEST_STATUS.APPROVED);
      if (role === "general_manager" || role === "gm") {
        return false;
      }
      if (role === ROLES.BU) {
        if (typeof window.canApproveFor === "function" && !window.canApproveFor(resource.requesterId)) return false;
        return resource.status && resource.status.startsWith("pending");
      }
      return false;
    }

    if (action === "allocate_bu_budget") {
      return role === ROLES.BU || role === ROLES.ADMIN;
    }

    if (action === "allocate_lm_budget") {
      return role === ROLES.BU || role === ROLES.ADMIN;
    }

    if (action === "allocate_dm_budget") {
      // LM, BU, and ADMIN can allocate budget to DMs. DM and GM cannot allocate to DMs.
      return role === ROLES.LM || role === ROLES.BU || role === ROLES.ADMIN;
    }

    if (action === "allocate_rep_budget") {
      // DM, LM, BU, and ADMIN can allocate budget to Reps. GM has read-only visibility.
      return role === ROLES.DM || role === ROLES.LM || role === ROLES.BU || role === ROLES.ADMIN;
    }

    if (action === "approve_location" || action === "reject_location") {
      if (!resource) return false;
      const status = String(resource.status || "").toLowerCase();
      if (status !== "pending" && !status.startsWith("pending_")) return false;
      if (isAdmin) return true;
      if (role === "general_manager" || role === "gm") return false;
      const targetRepId = resource.repId || resource.userId;
      if (!targetRepId) return false;
      if (typeof window.canApproveFor === "function" && window.canApproveFor(targetRepId)) {
        if (role === ROLES.DM) return resource.status === "pending" || resource.status === "pending_dm";
        if (role === ROLES.LM) return resource.status === "pending" || resource.status === "pending_dm" || resource.status === "pending_lm";
        if (role === ROLES.BU) return true;
      }
      return false;
    }

    // Fail-closed authorization: any unhandled action or role is strictly denied
    return false;
  }

  function getUserDisplayName(id) {
    const user = getUserById(id);
    if (!user) return id || "-";
    return user.name || id;
  }

  function getUserRoleLabel(role) {
    const r = (role || "").toLowerCase().trim();
    switch (r) {
      case ROLES.REP:
      case ROLES.REP_ALT:
      case "rep":
      case "medical_rep":
      case "medical rep":
        return "Medical Rep";
      case ROLES.DM:
      case "dm":
      case "district_manager":
      case "district manager":
        return "District Manager (DM)";
      case ROLES.LM:
      case "lm":
      case "line_manager":
      case "line manager":
        return "Line Manager (LM)";
      case ROLES.BU:
      case "bu":
      case "business_unit":
      case "business unit":
        return "Business Unit Head (BU)";
      case ROLES.HR:
      case "hr":
      case "human_resources":
      case "human resources":
        return "Human Resources (HR)";
      case ROLES.ADMIN:
      case "admin":
      case "administrator":
        return "Administrator";
      case "pm":
      case "product_manager":
      case "product manager":
        return "Product Manager (PM)";
      case "gm":
      case "general_manager":
      case "general manager":
        return "General Manager (GM)";
      case "commercial_director":
      case "commercial director":
        return "Commercial Director";
      case "finance":
      case "finance_manager":
      case "finance manager":
        return "Finance Manager";
      default:
        return role || "Employee";
    }
  }

  function getAllProductLines() {
    const storeLines = window.store && window.store.productLines && typeof window.store.productLines.getAll === "function"
      ? window.store.productLines.getAll()
      : null;
    return storeLines || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
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
    if (!user) return [];
    const role = getNormalizedRole(user);
    if (role === ROLES.ADMIN || role === ROLES.HR || role === "admin" || role === "hr") {
      return allLines;
    }
    if (role === ROLES.BU || role === "business_unit" || role === "bu" || role === ROLES.GM || role === "general_manager" || role === "gm") {
      if (typeof window.getUserLines === "function") {
        return window.getUserLines(user.id);
      }
    }
    const userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    if (userLineIds.length === 0) return [];
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
      (u) => (getNormalizedRole(u) === ROLES.REP || getNormalizedRole(u) === ROLES.REP_ALT) && u.areaId === areaId
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
      const repRole = getNormalizedRole(rep);
      if (repRole === ROLES.DM) {
        dmId = rep.id;
        lmId = rep.managerId || null;
      } else if (repRole === ROLES.LM) {
        dmId = null;
        lmId = rep.id;
      } else {
        const mgr = rep.managerId ? allUsers.find((u) => u.id === rep.managerId) : null;
        const mgrRole = mgr ? getNormalizedRole(mgr) : null;
        if (mgrRole === ROLES.LM) {
          // Rep reports directly to Line Manager (no intermediary DM)
          dmId = null;
          lmId = mgr.id;
        } else {
          dmId = mgr ? mgr.id : (rep.managerId || null);
          lmId = mgr ? mgr.managerId : null;
        }
      }
    }

    // Defensive fallback: only attempt line-level derivation if NEITHER DM nor LM could be determined
    if (!dmId && !lmId) {
      const area = getLiveAreaById(areaId);
      if (area && area.lineId) {
        const dmsInLine = allUsers.filter(u => getNormalizedRole(u) === ROLES.DM && ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId));
        const lmsInLine = allUsers.filter(u => getNormalizedRole(u) === ROLES.LM && ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId));
        if (dmsInLine.length === 1 && lmsInLine.length <= 1) {
          dmId = dmsInLine[0].id;
          lmId = dmsInLine[0].managerId || (lmsInLine[0] ? lmsInLine[0].id : null);
        } else {
          // Multiple DMs or multiple LMs on this line: do not guess arbitrarily!
          dmId = null;
        }
      }
    }

    if (!lmId) {
      const area = getLiveAreaById(areaId);
      if (area && area.lineId) {
        const lmsInLine = allUsers.filter(u => getNormalizedRole(u) === ROLES.LM && ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId));
        if (lmsInLine.length === 1) {
          lmId = lmsInLine[0].id;
        } else {
          // Multiple LMs on this line: do not guess arbitrarily!
          lmId = null;
        }
      }
    }

    return {
      repId: repId || fallbackUserId || null,
      dmId: dmId || null,
      lmId: lmId || null
    };
  }

  function getAreaName(areaId) {
    const area = getLiveAreaById(areaId);
    return area ? area.name : (areaId || "-");
  }

  function getAreasForLine(lineId, user) {
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    let areas = allAreas.filter((a) => !lineId || !a.lineId || a.lineId === lineId);
    if (!user) return [];

    const role = (user.role || "").toLowerCase();
    const isRep = role === ROLES.REP || role === ROLES.REP_ALT || role === "medical_rep" || role === "rep";

    if (isRep) {
      const assignedAreaIdSet = new Set();
      if (user.areaId) assignedAreaIdSet.add(user.areaId);
      if (Array.isArray(user.areaIds)) {
        user.areaIds.forEach((id) => assignedAreaIdSet.add(id));
      }

      // Check active territory history assignments
      if (window.store && window.store.territoryHistory && typeof window.store.territoryHistory.getByUser === "function") {
        const hist = window.store.territoryHistory.getByUser(user.id) || [];
        hist.forEach((h) => {
          if (!h.endDate && h.areaId) {
            assignedAreaIdSet.add(h.areaId);
          }
        });
      }

      const repAreas = areas.filter(
        (a) => a.repId === user.id || assignedAreaIdSet.has(a.id)
      );

      // Deduplicate by ID
      const uniqueMap = new Map();
      repAreas.forEach((a) => {
        if (!uniqueMap.has(a.id)) uniqueMap.set(a.id, a);
      });

      if (uniqueMap.size > 0) {
        return Array.from(uniqueMap.values());
      }

      // Fallback: search allAreas without line constraint
      const fallbackAreas = allAreas.filter(
        (a) => a.repId === user.id || assignedAreaIdSet.has(a.id)
      );
      fallbackAreas.forEach((a) => {
        if (!uniqueMap.has(a.id)) uniqueMap.set(a.id, a);
      });

      // Strict fail-closed: return only assigned areas. If none, return empty array without falling through
      return Array.from(uniqueMap.values());
    }

    const isDM = role === ROLES.DM || role === "district_manager";
    if (isDM) {
      const allUsers = getAllUsers();
      const subUsers = allUsers.filter((u) => u.dmId === user.id || u.managerId === user.id || u.id === user.id);
      const subUserIds = new Set(subUsers.map((u) => u.id));

      const dmAreas = areas.filter(
        (a) => a.dmId === user.id || a.managerId === user.id || subUserIds.has(a.repId)
      );
      if (dmAreas.length > 0) {
        const dmMap = new Map();
        dmAreas.forEach((a) => {
          if (!dmMap.has(a.id)) dmMap.set(a.id, a);
        });
        return Array.from(dmMap.values());
      }
    }

    return areas;
  }

  function getDmsUnderLmForLine(lmId, lineId) {
    const allUsers = getAllUsers();
    return allUsers.filter((u) => {
      if (getNormalizedRole(u) !== ROLES.DM) return false;
      if (u.managerId !== lmId) return false;
      const lines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return lines.includes(lineId);
    });
  }

  function getHrUser() {
    return getAllUsers().find((u) => getNormalizedRole(u) === ROLES.HR) || null;
  }

  function getGmUser() {
    const allUsers = getAllUsers();
    return allUsers.find((u) => {
      const r = getNormalizedRole(u);
      return r === ROLES.GM || (u.role || "").toLowerCase() === "general_manager" || (u.role || "").toLowerCase() === "gm";
    }) || null;
  }

  function getSubordinatesForUser(user, lineId) {
    if (!user) return [];
    const allUsers = getAllUsers();
    const role = getNormalizedRole(user);

    function matchLine(u) {
      if (!lineId || lineId === "all") return true;
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return uLines.includes(lineId);
    }

    if (role === ROLES.ADMIN || role === ROLES.HR) {
      return allUsers.filter(u => u.id !== user.id && matchLine(u));
    }
    if (role === ROLES.BU || role === ROLES.GM) {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      return subs.filter(u => u.id !== user.id && matchLine(u));
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
    getGmUser,
    dispatchWorkflowNotification,
    normalizeRole,
    getNormalizedRole,
  };
})(window);