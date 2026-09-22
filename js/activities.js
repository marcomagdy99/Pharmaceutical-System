/**
 * @file activities.js
 * @description Unified Field Requests Hub: Daily Activities, Travel Expenses, Services Sponsorships, and Sales Budgets.
 * Adheres strictly to pharma hierarchical workflows, per-line budgeting, and AM/PM hospital vs. doctor rules.
 * Strictly enforces Role Hierarchy Isolation:
 * - Rep: sees ONLY their own requests.
 * - DM: sees their own requests + requests from their supervised reps.
 * - LM: sees their own requests + requests from their supervised DMs and reps in their line.
 * - BU & Admin: see requests across their line/organization.
 * - HR: sees all expense requests for audit, approval, and disbursement.
 */

// ============================================================================
// 1. Comprehensive Bilingual Dictionary
// ============================================================================
const activityTranslations = {
  en: {
    // Page & Navigation
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
    totalAllocatedBudget: "Total Budget",
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
    // Page & Navigation
    activitiesTitle: "ÙØ§Ø±Ù…Ø§ÙƒÙŠØ± - Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©",
    dailyActivities: "Ø§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©",
    tabDailyActivities: "Ø§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©",
    tabExpenses: "Ù†ÙÙ‚Ø§Øª ÙˆÙ…ØµØ§Ø±ÙŠÙ Ø§Ù„Ø¹Ù…Ù„",
    tabServices: "Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø¯ÙƒØ§ØªØ±Ø© ÙˆØ§Ù„Ù…Ø³ØªØ´ÙÙŠØ§Øª",
    tabSalesBudget: "Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª (Budget)",
    today: "Ø§Ù„ÙŠÙˆÙ…",
    amPeriod: "ÙØªØ±Ø© Ø§Ù„ØµØ¨Ø§Ø­",
    pmPeriod: "ÙØªØ±Ø© Ø§Ù„Ù…Ø³Ø§Ø¡",
    logActivity: "ØªØ³Ø¬ÙŠÙ„ Ù†Ø´Ø§Ø·",
    logActivityTitle: "ØªØ³Ø¬ÙŠÙ„ Ù†Ø´Ø§Ø·",
    weeklyOverview: "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© (Ø§Ù„Ø³Ø¨Øª - Ø§Ù„Ø®Ù…ÙŠØ³)",
    period: "Ø§Ù„ÙØªØ±Ø©",
    activityType: "Ù†ÙˆØ¹ Ø§Ù„Ù†Ø´Ø§Ø·",
    selectActivity: "Ø§Ø®ØªØ± Ø§Ù„Ù†Ø´Ø§Ø·...",
    typeVisit: "Ø²ÙŠØ§Ø±Ø©",
    typeOfficeWork: "Ø¹Ù…Ù„ Ù…ÙƒØªØ¨ÙŠ",
    typeTraining: "ØªØ¯Ø±ÙŠØ¨",
    typeMeeting: "Ø§Ø¬ØªÙ…Ø§Ø¹",
    typeConference: "Ù…Ø¤ØªÙ…Ø±",
    notes: "Ù…Ù„Ø§Ø­Ø¸Ø§Øª",
    cancel: "Ø¥Ù„ØºØ§Ø¡",
    save: "Ø­ÙØ¸",
    statusLogged: "ØªÙ… Ø§Ù„ØªØ³Ø¬ÙŠÙ„",
    statusNotLogged: "Ù„Ù… ÙŠØªÙ… Ø§Ù„ØªØ³Ø¬ÙŠÙ„",
    goToVisits: "Ø§Ù„Ø°Ù‡Ø§Ø¨ Ù„ØµÙØ­Ø© Ø§Ù„Ø²ÙŠØ§Ø±Ø§Øª",
    noActivityLogged: "Ù„Ù… ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ù†Ø´Ø§Ø· Ù„Ù‡Ø°Ù‡ Ø§Ù„ÙØªØ±Ø©.",
    sat: "Ø§Ù„Ø³Ø¨Øª",
    sun: "Ø§Ù„Ø£Ø­Ø¯",
    mon: "Ø§Ù„Ø§Ø«Ù†ÙŠÙ†",
    tue: "Ø§Ù„Ø«Ù„Ø§Ø«Ø§Ø¡",
    wed: "Ø§Ù„Ø£Ø±Ø¨Ø¹Ø§Ø¡",
    thu: "Ø§Ù„Ø®Ù…ÙŠØ³",
    fri: "Ø§Ù„Ø¬Ù…Ø¹Ø©",

    // Expenses Tab
    expensesTitle: "Ù†ÙÙ‚Ø§Øª ÙˆÙ…ØµØ§Ø±ÙŠÙ Ø§Ù„Ù…ÙŠØ¯Ø§Ù† ÙˆØ§Ù„Ø³ÙØ±",
    expensesSubtitle: "Ø¥Ø¯Ø§Ø±Ø© Ù…Ø·Ø§Ù„Ø¨Ø§Øª Ø§Ù„Ø³ÙØ±ØŒ Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„Ø§ØªØŒ Ø§Ù„Ø¨Ù†Ø²ÙŠÙ†ØŒ Ø§Ù„ÙƒØ§Ø±ØªØ§ØªØŒ ÙˆØ§Ù„Ø¶ÙŠØ§ÙØ© Ø¨Ø³Ù„Ø³Ù„Ø© Ù…ÙˆØ§ÙÙ‚Ø§Øª Ø¯Ù‚ÙŠÙ‚Ø©.",
    btnNewExpense: "Ù…Ø·Ø§Ù„Ø¨Ø© Ù†ÙÙ‚Ø§Øª Ø¬Ø¯ÙŠØ¯Ø©",
    pendingApproval: "ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø©",
    approvedExpenses: "Ø§Ù„Ù…Ø·Ø§Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©",
    disbursedExpenses: "Ø§Ù„Ù…Ù†ØµØ±Ù / Ø§Ù„Ù…Ø¯ÙÙˆØ¹",
    allStatuses: "ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª",
    filterPending: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    filterApproved: "Ù…Ø¹ØªÙ…Ø¯",
    filterRejected: "Ù…Ø±ÙÙˆØ¶",
    filterDisbursed: "ØªÙ… Ø§Ù„ØµØ±Ù",
    allCategories: "ÙƒÙ„ Ø§Ù„Ø¨Ù†ÙˆØ¯",
    catTravel: "Ø§Ù†ØªÙ‚Ø§Ù„Ø§Øª ÙˆØ³ÙØ±",
    catFuelTolls: "ÙƒØ§Ø±ØªØ§Øª ÙˆØ¨Ù†Ø²ÙŠÙ†",
    catHospitality: "Ø¶ÙŠØ§ÙØ© ÙˆØ§Ø¬ØªÙ…Ø§Ø¹Ø§Øª",
    catHotel: "Ø¥Ù‚Ø§Ù…Ø© ÙÙ†Ø¯Ù‚ÙŠØ©",
    colDate: "Ø§Ù„ØªØ§Ø±ÙŠØ®",
    colEmployee: "Ø§Ù„Ù…ÙˆØ¸Ù",
    colCategory: "Ø¨Ù†Ø¯ Ø§Ù„Ù†ÙÙ‚Ø©",
    colAmount: "Ø§Ù„Ù…Ø¨Ù„Øº",
    colReceipt: "Ø§Ù„ÙØ§ØªÙˆØ±Ø© / Ø§Ù„Ø¥ÙŠØµØ§Ù„",
    colStatus: "Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯",
    colActions: "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª",
    modalNewExpenseTitle: "ØªØ³Ø¬ÙŠÙ„ Ù…Ø·Ø§Ù„Ø¨Ø© Ù†ÙÙ‚Ø§Øª Ù…ÙŠØ¯Ø§Ù†ÙŠØ©",
    receiptHelp: "Ø§Ù„ØªÙ‚Ø· ØµÙˆØ±Ø© ÙˆØ§Ø¶Ø­Ø© Ù„Ù„ÙØ§ØªÙˆØ±Ø© Ø£Ùˆ Ø§Ù„Ø¥ÙŠØµØ§Ù„ Ø£Ùˆ Ø£Ø±ÙÙ‚Ù‡Ø§ Ù…Ù† Ø¬Ù‡Ø§Ø²Ùƒ.",
    btnSubmitClaim: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…Ø·Ø§Ù„Ø¨Ø©",
    noExpensesFound: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø·Ø§Ù„Ø¨Ø§Øª Ù†ÙÙ‚Ø§Øª Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„ÙÙ„ØªØ± Ø§Ù„Ù…Ø­Ø¯Ø¯.",

    // Services Tab
    servicesTitle: "Ø®Ø¯Ù…Ø§Øª ÙˆØ±Ø¹Ø§ÙŠØ§Øª Ø§Ù„Ø£Ø·Ø¨Ø§Ø¡ ÙˆØ§Ù„Ù…Ø³ØªØ´ÙÙŠØ§Øª",
    servicesSubtitle: "ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨Ø§Øª Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ù…Ø¤ØªÙ…Ø±Ø§Øª ÙˆØ§Ù„Ù…Ø­Ø§Ø¶Ø±Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ© ÙˆØ§Ù„Ù…Ø·Ø¨ÙˆØ¹Ø§Øª Ø§Ù„Ø·Ø¨ÙŠØ© Ø¨Ø¯Ø¹Ù… Ù…Ù† Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù„Ø§ÙŠÙ†.",
    btnNewService: "Ø·Ù„Ø¨ Ø®Ø¯Ù…Ø© Ø¬Ø¯ÙŠØ¯",
    allocatedBudgetOverview: "Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„ØªØ±ÙˆÙŠØ¬ÙŠØ© Ø§Ù„Ù…Ø®ØµØµØ©",
    lineFilterLabel: "Ø§Ù„Ù„Ø§ÙŠÙ†:",
    totalAllocatedBudget: "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©",
    approvedSpent: "Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ ÙˆØ§Ù„Ù…Ø³ØªÙ‡Ù„Ùƒ",
    pendingServices: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ø§Ù„Ø·Ù„Ø¨Ø§Øª",
    remainingBudget: "Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ",
    distributeToDmsTitle: "ØªÙˆØ²ÙŠØ¹ Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù„Ø§ÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø´Ø±ÙÙŠÙ† (DMs)",
    distributeToDmsSubtitle: "ØªÙˆØ²ÙŠØ¹ Ø­ØµØµ Ù…Ù† Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù„Ø§ÙŠÙ† Ø§Ù„Ù…Ø³ØªÙ„Ù…Ø© Ù…Ù† Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙˆØ­Ø¯Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø´Ø±ÙÙŠÙ† Ø§Ù„ØªØ§Ø¨Ø¹ÙŠÙ† Ù„Ùƒ.",
    saveAllocations: "Ø­ÙØ¸ Ø§Ù„ØªÙˆØ²ÙŠØ¹",
    colDm: "Ø§Ù„Ù…Ø´Ø±Ù (DM)",
    colCode: "Ø§Ù„ÙƒÙˆØ¯",
    colAllocatedAmount: "Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù…Ø®ØµØµØ© (Ø¬.Ù…)",
    colUtilized: "Ø§Ù„Ù…Ø³ØªÙ‡Ù„Ùƒ",
    allDepts: "ÙƒÙ„ Ø§Ù„Ø£Ù‚Ø³Ø§Ù…",
    deptSales: "Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª (Sales)",
    deptMarketing: "Ø®Ø¯Ù…Ø§Øª Ø§Ù„ØªØ³ÙˆÙŠÙ‚ (Marketing)",
    colLine: "Ø§Ù„Ù„Ø§ÙŠÙ†",
    colDept: "Ø§Ù„Ù‚Ø³Ù…",
    colArea: "Ø§Ù„Ù…Ù†Ø·Ù‚Ø©",
    colShiftTarget: "Ø§Ù„ÙØªØ±Ø© ÙˆØ§Ù„Ø¬Ù‡Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ø¯ÙØ©",
    colService: "Ø§Ø³Ù… / Ù†ÙˆØ¹ Ø§Ù„Ø®Ø¯Ù…Ø©",
    colCost: "Ø§Ù„ØªÙƒÙ„ÙØ© Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠØ©",
    colShift: "Ø§Ù„ÙØªØ±Ø©",
    modalNewServiceTitle: "Ø·Ù„Ø¨ Ø®Ø¯Ù…Ø© / Ø±Ø¹Ø§ÙŠØ© Ø·Ø¨ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©",
    targetHospital: "Ø§Ù„Ù…Ø³ØªØ´ÙÙ‰ / Ø§Ù„Ù…Ø±ÙƒØ² Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù",
    targetDoctor: "Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù",
    serviceTitleLabel: "Ù†ÙˆØ¹ / Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø®Ø¯Ù…Ø©",
    serviceDateLabel: "ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„Ù…ØªÙˆÙ‚Ø¹",
    btnSubmitService: "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø®Ø¯Ù…Ø©",
    noServicesFound: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø®Ø¯Ù…Ø§Øª Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„ÙÙ„ØªØ± Ø§Ù„Ù…Ø­Ø¯Ø¯.",

    // Sales Budget Tab
    buBudgetTitle: "ØªÙˆØ²ÙŠØ¹ Ù…ÙŠØ²Ø§Ù†ÙŠØ§Øª Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª (Sales Budget)",
    buBudgetSubtitle: "ØªØ®ØµÙŠØµ ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ù…ÙŠØ²Ø§Ù†ÙŠØ§Øª Ø§Ù„ØªØ±ÙˆÙŠØ¬ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠ Ù„ÙƒÙ„ Ù„Ø§ÙŠÙ† Ø¹Ù„Ù‰ Ù…Ø¯ÙŠØ±ÙŠ Ø§Ù„Ø®Ø·ÙˆØ· (LMs).",
    selectProductLine: "Ø®Ø· Ø§Ù„Ø¥Ù†ØªØ§Ø¬ (Line):",
    totalLineBudget: "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„Ù„Ø§ÙŠÙ†",
    allocatedToLms: "Ø§Ù„Ù…ÙˆØ²Ø¹ Ø¹Ù„Ù‰ Ù…Ø¯ÙŠØ±ÙŠ Ø§Ù„Ø®Ø·ÙˆØ· (LMs)",
    unallocatedRemaining: "Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ ØºÙŠØ± Ø§Ù„Ù…ÙˆØ²Ø¹",
    colLm: "Ù…Ø¯ÙŠØ± Ø§Ù„Ø®Ø· (LM)",
    colDistributedToDms: "Ø§Ù„Ù…ÙˆØ²Ø¹ Ø¹Ù„Ù‰ Ø§Ù„Ù€ DMs",

    // Hierarchical Status Text
    waitingDmPrefix: "ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø± Ù…ÙˆØ§ÙÙ‚Ø©: ",
    waitingLmPrefix: "ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø± Ù…ÙˆØ§ÙÙ‚Ø©: ",
    waitingHr: "ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø± Ù…ÙˆØ§ÙÙ‚Ø© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© (HR)",
    approvedLabel: "Ù…Ø¹ØªÙ…Ø¯",
    rejectedLabel: "Ù…Ø±ÙÙˆØ¶",
    disbursedLabel: "ØªÙ… Ø§Ù„ØµØ±Ù",
    statusPending: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",

    // Decision Modal
    confirmApprovalTitle: "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø©",
    confirmRejectionTitle: "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø±ÙØ¶",
    confirmDisbursementTitle: "ØªØ£ÙƒÙŠØ¯ ØµØ±Ù Ø§Ù„Ù†ÙÙ‚Ø§Øª",
    confirmApproveMsg: "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ø¨Ù‚ÙŠÙ…Ø© {amount} Ø¬.Ù… Ø§Ù„Ù…Ù‚Ø¯Ù… Ù…Ù† {name}ØŸ",
    confirmRejectMsg: "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø±ÙØ¶ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…Ù‚Ø¯Ù… Ù…Ù† {name}ØŸ",
    confirmDisburseMsg: "ØªØ£ÙƒÙŠØ¯ ØªØ³Ø¬ÙŠÙ„ ØµØ±Ù Ù…Ø¨Ù„Øº {amount} Ø¬.Ù… Ù„Ù„Ù…ÙˆØ¸Ù {name}ØŸ",
    reasonLabel: "Ø§Ù„Ø³Ø¨Ø¨ / Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯:",
    reasonPlaceholder: "Ø£Ø¯Ø®Ù„ Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø£Ùˆ Ø³Ø¨Ø¨ Ø§Ù„Ø±ÙØ¶...",
    btnApprove: "Ù…ÙˆØ§ÙÙ‚Ø© ÙˆØ§Ø¹ØªÙ…Ø§Ø¯",
    btnReject: "Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨",
    btnDisburse: "ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØµØ±Ù",
    rejectionReasonRequired: "ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø³Ø¨Ø¨ Ø§Ù„Ø±ÙØ¶ Ù‚Ø¨Ù„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©.",
    successAction: "ØªÙ… ØªÙ†ÙÙŠØ° Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø¨Ù†Ø¬Ø§Ø­!",
    savedBudgetMessage: "ØªÙ… Ø­ÙØ¸ ÙˆØªØ­Ø¯ÙŠØ« ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­!",
    insufficientBudgetNotice: "ØªÙ†Ø¨ÙŠÙ‡: ØªÙƒÙ„ÙØ© Ø§Ù„Ø·Ù„Ø¨ ØªØªØ¬Ø§ÙˆØ² Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ØªØ§Ø­ Ø­Ø§Ù„ÙŠØ§Ù‹ Ø¨Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©.",
    noReceipt: "Ù„Ø§ ØªÙˆØ¬Ø¯ ÙØ§ØªÙˆØ±Ø© Ù…Ø±ÙÙ‚Ø©"
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

function t(key) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const dict = activityTranslations[lang] || activityTranslations.en;
  return dict[key] !== undefined ? dict[key] : key;
}

// ============================================================================
// 2. Authentication & User Helpers
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
    role: "medical_rep",
    name: "Ahmed Mostafa",
    nameAr: "Ø£Ø­Ù…Ø¯ Ù…ØµØ·ÙÙ‰",
    lineIds: ["line1"],
    areaId: "area1"
  };
}

let currentUser = getAuthUser();

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
  if (user.role === "admin" || user.role === "business_unit" || user.role === "hr") {
    return allLines;
  }
  const assigned = user.lineIds || (user.lineId ? [user.lineId] : []);
  if (assigned.length === 0) return allLines;
  const filtered = allLines.filter((l) => assigned.includes(l.id));
  return filtered.length > 0 ? filtered : allLines;
}

function getAllAreas() {
  return (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
}

function getAreasForLine(lineId) {
  const areas = getAllAreas();
  if (!lineId) return areas;
  return areas.filter((a) => a.lineId === lineId || !a.lineId);
}

function getAreaName(areaId) {
  const area = getAllAreas().find((a) => a.id === areaId);
  return area ? `${area.name} (${area.code || area.id})` : (areaId || "-");
}

function getDoctorsForLineAndArea(lineId, areaId) {
  const docs = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
  return docs.filter((d) => {
    if (areaId && d.areaId && d.areaId !== areaId) return false;
    if (lineId) {
      if (Array.isArray(d.lineIds) && d.lineIds.length > 0) {
        if (!d.lineIds.includes(lineId)) return false;
      } else if (d.lineId && d.lineId !== lineId) {
        return false;
      }
    }
    return true;
  });
}

function getHospitalsForLineAndArea(lineId, areaId) {
  const hosp = (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
  return hosp.filter((h) => {
    if (areaId && h.areaId && h.areaId !== areaId) return false;
    if (lineId) {
      if (Array.isArray(h.lineIds) && h.lineIds.length > 0) {
        if (!h.lineIds.includes(lineId)) return false;
      } else if (h.lineId && h.lineId !== lineId) {
        return false;
      }
    }
    return true;
  });
}

function getHrUser() {
  const hr = getAllUsers().find((u) => u.role === "hr");
  return hr || { id: "hr1", name: "HR Department", nameAr: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©" };
}

// ============================================================================
// 2.5 Strict Role Hierarchy Visibility Engine
// ============================================================================
/**
 * Recursively checks whether a user is directly or indirectly subordinate
 * to a manager in the organizational reporting structure.
 */
function isSubordinateOf(subordinateId, managerId) {
  if (!subordinateId || !managerId) return false;
  if (subordinateId === managerId) return false;
  let curr = getUserById(subordinateId);
  let guard = 0;
  while (curr && curr.managerId && guard < 15) {
    guard++;
    if (curr.managerId === managerId) return true;
    curr = getUserById(curr.managerId);
  }
  return false;
}

/**
 * Determines whether a user has permission to see a given request in their view.
 * Rules:
 * - Rep: sees ONLY their own requests.
 * - DM: sees their own requests + requests from their supervised reps.
 * - LM: sees their own requests + requests from their supervised DMs and reps.
 * - BU & Admin: sees all requests across their business unit / company.
 * - HR: sees all expense claims for audit & disbursement, and only own service requests.
 */
function canUserViewRequest(req, user) {
  if (!user || !req) return false;

  // 1. Admin & BU Head see all requests across the organization
  if (user.role === "admin" || user.role === "business_unit") {
    return true;
  }

  // 2. HR sees all expense claims (for audit & payment)
  if (user.role === "hr") {
    if (req.category || req.receiptUrl !== undefined) {
      return true; // Expenses tab
    }
    return req.requesterId === user.id;
  }

  // 3. Any user always sees their own submitted requests
  if (req.requesterId === user.id) {
    return true;
  }

  // 4. Medical Rep: STRICT ISOLATION -> ONLY their own items
  if (user.role === "medical_rep" || user.role === "rep") {
    return false;
  }

  // 5. DM & LM: strictly see requests from their direct and indirect team subordinates
  return isSubordinateOf(req.requesterId, user.id);
}

// ============================================================================
// 3. Tab Navigation & Role View Security
// ============================================================================
let activeTab = "tab-activities";

window.switchRequestsTab = function (tabId) {
  activeTab = tabId;

  document.querySelectorAll(".requests-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.id === getTabBtnId(tabId));
  });

  document.querySelectorAll(".requests-tab-pane").forEach((pane) => {
    pane.classList.remove("active");
  });

  const activePane = document.getElementById(getPaneId(tabId));
  if (activePane) {
    activePane.classList.add("active");
  }

  if (tabId === "tab-activities") {
    updateView();
  } else if (tabId === "tab-expenses") {
    renderExpensesTab();
  } else if (tabId === "tab-services") {
    renderServicesTab();
  } else if (tabId === "tab-budget") {
    renderBudgetTab();
  }

  if (window.applyTranslations) {
    window.applyTranslations();
  }
};

function getTabBtnId(tabId) {
  if (tabId === "tab-activities") return "tabBtnActivities";
  if (tabId === "tab-expenses") return "tabBtnExpenses";
  if (tabId === "tab-services") return "tabBtnServices";
  if (tabId === "tab-budget") return "tabBtnBudget";
  return "tabBtnActivities";
}

function getPaneId(tabId) {
  if (tabId === "tab-activities") return "pane-activities";
  if (tabId === "tab-expenses") return "pane-expenses";
  if (tabId === "tab-services") return "pane-services";
  if (tabId === "tab-budget") return "pane-budget";
  return "pane-activities";
}

function setupRoleTabVisibility() {
  currentUser = getAuthUser();
  const btnActivities = document.getElementById("tabBtnActivities");
  const btnExpenses = document.getElementById("tabBtnExpenses");
  const btnServices = document.getElementById("tabBtnServices");
  const btnBudget = document.getElementById("tabBtnBudget");
  const lmDistSec = document.getElementById("lmDistributionSection");

  if (!btnActivities || !btnExpenses || !btnServices || !btnBudget) return;

  if (currentUser.role === "business_unit" || currentUser.role === "admin") {
    btnBudget.style.display = "inline-flex";
    btnServices.style.display = "none";
    if (activeTab === "tab-services") {
      switchRequestsTab("tab-budget");
    }
  } else {
    btnBudget.style.display = "none";
    btnServices.style.display = "inline-flex";

    if (currentUser.role === "line_manager" && lmDistSec) {
      lmDistSec.style.display = "block";
    } else if (lmDistSec) {
      lmDistSec.style.display = "none";
    }
  }
}

// ============================================================================
// 4. TAB 1: Daily Activities (Original Non-Promotional Logs)
// ============================================================================
function getActivityStorageKey(userId) {
  const uid = userId || currentUser.id || "rep1";
  return `pharma_activities_data_${uid}`;
}

function loadActivities() {
  const uid = currentUser.id || "rep1";
  try {
    const raw = localStorage.getItem(getActivityStorageKey(uid));
    if (raw) return JSON.parse(raw);
    if (uid === "rep1") {
      const legacyRaw = localStorage.getItem("pharma_activities_data");
      if (legacyRaw) return JSON.parse(legacyRaw);
    }
  } catch (e) {}
  return {
    "2026-09-02": {
      AM: { type: "Training", notes: "Product formulation deep dive." },
      PM: { type: "Visit", notes: "Completed clinical visits." },
    },
  };
}

function saveActivities(data) {
  const uid = currentUser.id || "rep1";
  try {
    localStorage.setItem(getActivityStorageKey(uid), JSON.stringify(data));
  } catch (e) {}
}

let demoActivities = loadActivities();
let currentDate = window.getSystemDate ? window.getSystemDate() : new Date();

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

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
      ? '<span style="color: var(--success); font-weight: bold;">âœ“</span>'
      : '<span style="color: var(--danger); font-weight: bold;">âœ•</span>';
    const pmIcon = dayData.PM
      ? '<span style="color: var(--success); font-weight: bold;">âœ“</span>'
      : '<span style="color: var(--danger); font-weight: bold;">âœ•</span>';

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
    if (typeof showToast === "function") showToast("Please select an activity type.", "warning");
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

// ============================================================================
// 5. DATA PERSISTENCE: Sales Budgets Store
// ============================================================================
const BUDGET_STORAGE_KEY = "pharma_sales_budgets";

function loadBudgets() {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    line1: {
      totalBudget: 500000,
      lmAllocations: {
        lm1: 500000,
      },
      dmAllocations: {
        dm1: 250000,
        dm2: 250000,
      },
    },
    line2: {
      totalBudget: 300000,
      lmAllocations: {
        lm2: 300000,
      },
      dmAllocations: {
        dm3: 300000,
      },
    },
  };
}

function saveBudgets(budgets) {
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
  } catch (e) {}
}

// ============================================================================
// 6. TAB 4: Sales Budget Allocation (BU Head & Admin)
// ============================================================================
function renderBudgetTab() {
  currentUser = getAuthUser();
  const lineSelect = document.getElementById("buBudgetLineSelect");
  const totalBudgetInput = document.getElementById("buTotalBudgetInput");
  const tableBody = document.getElementById("buLmAllocationTableBody");
  if (!lineSelect || !totalBudgetInput || !tableBody) return;

  const lines = getAllProductLines();
  const previousSelected = lineSelect.value;
  lineSelect.innerHTML = lines
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join("");

  if (previousSelected && lines.some((l) => l.id === previousSelected)) {
    lineSelect.value = previousSelected;
  } else if (lines.length > 0) {
    lineSelect.value = lines[0].id;
  }

  const selectedLineId = lineSelect.value;
  const budgets = loadBudgets();
  const lineBudget = budgets[selectedLineId] || {
    totalBudget: 0,
    lmAllocations: {},
    dmAllocations: {},
  };

  totalBudgetInput.value = lineBudget.totalBudget || 0;

  const allUsers = getAllUsers();
  const lms = allUsers.filter(
    (u) =>
      u.role === "line_manager" &&
      (u.lineId === selectedLineId ||
        (Array.isArray(u.lineIds) && u.lineIds.includes(selectedLineId))),
  );

  if (lms.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--gray-500);">No Line Managers found for this line.</td></tr>`;
  } else {
    tableBody.innerHTML = lms
      .map((lm) => {
        const alloc = lineBudget.lmAllocations[lm.id] || 0;
        const dmsUnderLm = allUsers.filter(
          (u) => u.role === "district_manager" && u.managerId === lm.id,
        );
        const dmSum = dmsUnderLm.reduce(
          (sum, dm) => sum + (lineBudget.dmAllocations[dm.id] || 0),
          0,
        );

        return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--gray-800);">${getUserDisplayName(lm.id)}</div>
            <small style="color: var(--gray-500);">${lm.email || ""}</small>
          </td>
          <td><span class="badge" style="background: var(--gray-100); color: var(--gray-700); font-weight: 600;">${lm.employeeCode || lm.id}</span></td>
          <td>
            <input type="number" class="allocation-input bu-lm-input" data-lmid="${lm.id}" value="${alloc}" min="0" step="1000" oninput="calculateBuBudgetSummary()" style="width: 160px; font-weight: 700;">
          </td>
          <td>
            <span style="font-weight: 700; color: var(--primary);">${dmSum.toLocaleString()} EGP</span>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  calculateBuBudgetSummary();
}

window.onBuBudgetLineChange = function () {
  renderBudgetTab();
};

window.calculateBuBudgetSummary = function () {
  const totalInput = document.getElementById("buTotalBudgetInput");
  const metricTotal = document.getElementById("buMetricTotal");
  const metricAllocated = document.getElementById("buMetricAllocated");
  const metricRemaining = document.getElementById("buMetricRemaining");

  const total = Number(totalInput?.value || 0);
  let allocated = 0;

  document.querySelectorAll(".bu-lm-input").forEach((inp) => {
    allocated += Number(inp.value || 0);
  });

  const remaining = total - allocated;

  if (metricTotal) metricTotal.textContent = `${total.toLocaleString()} EGP`;
  if (metricAllocated) metricAllocated.textContent = `${allocated.toLocaleString()} EGP`;
  if (metricRemaining) {
    metricRemaining.textContent = `${remaining.toLocaleString()} EGP`;
    metricRemaining.style.color = remaining < 0 ? "var(--danger)" : "inherit";
  }
};

window.saveBuAllocation = function () {
  const lineSelect = document.getElementById("buBudgetLineSelect");
  const totalInput = document.getElementById("buTotalBudgetInput");
  if (!lineSelect || !totalInput) return;

  const lineId = lineSelect.value;
  const budgets = loadBudgets();
  if (!budgets[lineId]) {
    budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
  }

  budgets[lineId].totalBudget = Number(totalInput.value || 0);
  if (!budgets[lineId].lmAllocations) budgets[lineId].lmAllocations = {};

  document.querySelectorAll(".bu-lm-input").forEach((inp) => {
    const lmId = inp.dataset.lmid;
    if (lmId) {
      budgets[lineId].lmAllocations[lmId] = Number(inp.value || 0);
    }
  });

  saveBudgets(budgets);
  if (typeof showToast === "function") {
    showToast(t("savedBudgetMessage"), "success");
  }
  renderBudgetTab();
};

// ============================================================================
// 7. TAB 2: Request Expenses Engine (Travel, Fuel, Hospitality)
// ============================================================================
const EXPENSES_STORAGE_KEY = "pharma_expenses_data";

function loadExpenses() {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: "exp_101",
      requesterId: "rep1",
      requesterRole: "medical_rep",
      lineId: "line1",
      category: "travel",
      amount: 450,
      date: "2026-09-20",
      notes: "Field visits to Nasr City clinics and specialized centers",
      receiptUrl: "images/pharma-icon-192.png",
      status: "pending_dm",
      nextApproverId: "dm1",
      history: [
        { action: "submitted", at: "2026-09-20T08:30:00.000Z", by: "rep1" },
      ],
    },
    {
      id: "exp_102",
      requesterId: "rep1",
      requesterRole: "medical_rep",
      lineId: "line1",
      category: "fuel_tolls",
      amount: 600,
      date: "2026-09-18",
      notes: "Fuel and highway tolls for outer territory tour",
      receiptUrl: "images/pharma-icon-192.png",
      status: "pending_hr",
      nextApproverId: "hr1",
      history: [
        { action: "submitted", at: "2026-09-18T09:00:00.000Z", by: "rep1" },
        { action: "approved", at: "2026-09-19T10:00:00.000Z", by: "dm1", role: "district_manager", comment: "Verified field route" },
      ],
    },
    {
      id: "exp_103",
      requesterId: "rep2",
      requesterRole: "medical_rep",
      lineId: "line1",
      category: "hospitality",
      amount: 850,
      date: "2026-09-15",
      notes: "Hospitality meeting with cardiology unit heads",
      receiptUrl: "images/pharma-icon-192.png",
      status: "approved",
      nextApproverId: null,
      history: [
        { action: "submitted", at: "2026-09-15T12:00:00.000Z", by: "rep2" },
        { action: "approved", at: "2026-09-16T11:00:00.000Z", by: "dm1", role: "district_manager" },
        { action: "approved", at: "2026-09-17T14:30:00.000Z", by: "hr1", role: "hr", comment: "All invoices verified" },
      ],
    },
    {
      id: "exp_104",
      requesterId: "dm1",
      requesterRole: "district_manager",
      lineId: "line1",
      category: "travel",
      amount: 1200,
      date: "2026-09-19",
      notes: "Double visits and field co-ride supervision with rep team",
      receiptUrl: "images/pharma-icon-192.png",
      status: "pending_lm",
      nextApproverId: "lm1",
      history: [
        { action: "submitted", at: "2026-09-19T15:00:00.000Z", by: "dm1" },
      ],
    },
    {
      id: "exp_105",
      requesterId: "lm1",
      requesterRole: "line_manager",
      lineId: "line1",
      category: "hotel",
      amount: 2800,
      date: "2026-09-17",
      notes: "Regional field audit and management meeting accommodation",
      receiptUrl: "images/pharma-icon-192.png",
      status: "pending_hr",
      nextApproverId: "hr1",
      history: [
        { action: "submitted", at: "2026-09-17T16:00:00.000Z", by: "lm1" },
      ],
    },
  ];
}

function saveExpenses(expenses) {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {}
}

let currentReceiptBase64 = "";

window.handleReceiptFilePreview = function (input) {
  const previewBox = document.getElementById("receiptPreviewBox");
  const previewImg = document.getElementById("receiptPreviewImg");
  if (!input.files || !input.files[0]) {
    currentReceiptBase64 = "";
    if (previewBox) previewBox.style.display = "none";
    return;
  }
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    currentReceiptBase64 = e.target.result;
    if (previewImg) previewImg.src = currentReceiptBase64;
    if (previewBox) previewBox.style.display = "block";
  };
  reader.readAsDataURL(file);
};

window.openExpenseModal = function () {
  currentUser = getAuthUser();
  const modal = document.getElementById("expenseModal");
  if (!modal) return;
  document.getElementById("expenseForm")?.reset();
  const dateInp = document.getElementById("expenseDateInput");
  if (dateInp) dateInp.value = formatDate(new Date());
  currentReceiptBase64 = "";
  const previewBox = document.getElementById("receiptPreviewBox");
  if (previewBox) previewBox.style.display = "none";
  modal.style.display = "flex";
  modal.classList.add("active");
};

window.closeExpenseModal = function () {
  const modal = document.getElementById("expenseModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
};

window.handleExpenseSubmit = function (e) {
  e.preventDefault();
  currentUser = getAuthUser();

  const category = document.getElementById("expenseCategoryInput").value;
  const amount = parseFloat(document.getElementById("expenseAmountInput").value);
  const date = document.getElementById("expenseDateInput").value;
  const notes = document.getElementById("expenseNotesInput").value;

  if (!amount || amount <= 0) {
    if (typeof showToast === "function") showToast("Please enter a valid amount.", "warning");
    return;
  }

  let initialStatus = "pending_dm";
  let nextApprover = null;

  if (currentUser.role === "medical_rep" || currentUser.role === "rep") {
    initialStatus = "pending_dm";
    nextApprover = currentUser.managerId || "dm1";
  } else if (currentUser.role === "district_manager") {
    initialStatus = "pending_lm";
    nextApprover = currentUser.managerId || "lm1";
  } else if (currentUser.role === "line_manager") {
    initialStatus = "pending_hr";
    const hr = getHrUser();
    nextApprover = hr ? hr.id : "hr1";
  } else if (currentUser.role === "hr" || currentUser.role === "business_unit" || currentUser.role === "admin") {
    initialStatus = "approved";
    nextApprover = null;
  }

  const assignedLines = getUserAssignedLines(currentUser);
  const lineId = assignedLines.length > 0 ? assignedLines[0].id : "line1";

  const newExpense = {
    id: "exp_" + Date.now(),
    requesterId: currentUser.id,
    requesterRole: currentUser.role,
    lineId: lineId,
    category: category,
    amount: amount,
    date: date,
    notes: notes,
    receiptUrl: currentReceiptBase64 || "images/pharma-icon-192.png",
    status: initialStatus,
    nextApproverId: nextApprover,
    history: [
      {
        action: "submitted",
        at: new Date().toISOString(),
        by: currentUser.id,
        role: currentUser.role,
      },
    ],
  };

  const expenses = loadExpenses();
  expenses.unshift(newExpense);
  saveExpenses(expenses);

  closeExpenseModal();
  renderExpensesTab();
  if (typeof showToast === "function") {
    showToast(t("successAction"), "success");
  }
};

function getExpenseStatusBadge(exp) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const status = exp.status;

  if (status === "pending_dm") {
    const approverName = getUserDisplayName(exp.nextApproverId || "dm1");
    const label = lang === "ar" ? `${t("waitingDmPrefix")}${approverName} (DM)` : `${t("waitingDmPrefix")}${approverName}`;
    return `<span class="status-pill pending" title="${label}">${label}</span>`;
  }
  if (status === "pending_lm") {
    const approverName = getUserDisplayName(exp.nextApproverId || "lm1");
    const label = lang === "ar" ? `${t("waitingLmPrefix")}${approverName} (LM)` : `${t("waitingLmPrefix")}${approverName}`;
    return `<span class="status-pill pending" title="${label}">${label}</span>`;
  }
  if (status === "pending_hr") {
    const label = t("waitingHr");
    return `<span class="status-pill pending" title="${label}">${label}</span>`;
  }
  if (status === "approved") {
    return `<span class="status-pill approved">${t("approvedLabel")}</span>`;
  }
  if (status === "disbursed") {
    return `<span class="status-pill disbursed">${t("disbursedLabel")}</span>`;
  }
  if (status === "rejected") {
    return `<span class="status-pill rejected">${t("rejectedLabel")}</span>`;
  }
  return `<span class="status-pill pending">${status}</span>`;
}

function getCategoryLabel(catKey) {
  const map = {
    travel: "catTravel",
    fuel_tolls: "catFuelTolls",
    hospitality: "catHospitality",
    hotel: "catHotel",
  };
  return t(map[catKey] || catKey);
}

function renderExpensesTab() {
  currentUser = getAuthUser();
  const filterStatus = document.getElementById("expenseFilterStatus")?.value || "all";
  const filterCategory = document.getElementById("expenseFilterCategory")?.value || "all";
  const tableBody = document.getElementById("expensesTableBody");
  if (!tableBody) return;

  const allExpenses = loadExpenses();

  // 1. Strictly filter by role hierarchy
  const userScopedExpenses = allExpenses.filter((e) => canUserViewRequest(e, currentUser));

  // 2. Calculate summary metrics from user-scoped requests
  let totalPending = 0;
  let totalApproved = 0;
  let totalDisbursed = 0;

  userScopedExpenses.forEach((e) => {
    if (e.status.startsWith("pending_")) totalPending += Number(e.amount || 0);
    if (e.status === "approved") totalApproved += Number(e.amount || 0);
    if (e.status === "disbursed") totalDisbursed += Number(e.amount || 0);
  });

  const mPending = document.getElementById("expMetricPending");
  const mApproved = document.getElementById("expMetricApproved");
  const mDisbursed = document.getElementById("expMetricDisbursed");
  if (mPending) mPending.textContent = `${totalPending.toLocaleString()} EGP`;
  if (mApproved) mApproved.textContent = `${totalApproved.toLocaleString()} EGP`;
  if (mDisbursed) mDisbursed.textContent = `${totalDisbursed.toLocaleString()} EGP`;

  // 3. Status and category dropdown filtering
  const filtered = userScopedExpenses.filter((e) => {
    if (filterStatus !== "all") {
      if (filterStatus === "pending" && !e.status.startsWith("pending_")) return false;
      if (filterStatus !== "pending" && e.status !== filterStatus) return false;
    }
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--gray-500); font-weight:600;">${t("noExpensesFound")}</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((exp) => {
      const requester = getUserById(exp.requesterId);
      const requesterName = getUserDisplayName(exp.requesterId);
      const requesterRole = requester ? requester.role.replace("_", " ").toUpperCase() : "";

      let canApprove = false;
      let canDisburse = false;

      if (currentUser.role === "admin") {
        if (exp.status.startsWith("pending_")) canApprove = true;
        if (exp.status === "approved") canDisburse = true;
      } else if (exp.requesterId !== currentUser.id) {
        if (exp.status === "pending_dm" && currentUser.role === "district_manager" && (exp.nextApproverId === currentUser.id || isSubordinateOf(exp.requesterId, currentUser.id))) {
          canApprove = true;
        } else if (exp.status === "pending_lm" && currentUser.role === "line_manager" && (exp.nextApproverId === currentUser.id || isSubordinateOf(exp.requesterId, currentUser.id))) {
          canApprove = true;
        } else if (exp.status === "pending_hr" && currentUser.role === "hr") {
          canApprove = true;
        }
      }

      if (currentUser.role === "hr" && exp.status === "approved") {
        canDisburse = true;
      }

      let actionsHtml = "";
      if (canApprove) {
        actionsHtml += `
          <button type="button" class="action-btn-circle approve" title="${t("btnApprove")}" onclick="openDecisionModal('expense', '${exp.id}', 'approve')">âœ“</button>
          <button type="button" class="action-btn-circle reject" title="${t("btnReject")}" onclick="openDecisionModal('expense', '${exp.id}', 'reject')">âœ•</button>
        `;
      }
      if (canDisburse) {
        actionsHtml += `
          <button type="button" class="action-btn-circle disburse" title="${t("btnDisburse")}" onclick="openDecisionModal('expense', '${exp.id}', 'disburse')">ðŸ’µ</button>
        `;
      }
      if (!actionsHtml) {
        actionsHtml = `<span style="color:var(--gray-400); font-size:0.85rem;">â€”</span>`;
      }

      const receiptThumb = exp.receiptUrl
        ? `<div class="receipt-cell">
             <button type="button" class="receipt-preview-btn" onclick="openReceiptPreviewModal('${exp.receiptUrl}')" title="${t("colReceipt")}">
               <img src="${exp.receiptUrl}" class="receipt-thumbnail" alt="Receipt">
               <span class="receipt-zoom-badge">ðŸ”</span>
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
          ${exp.notes ? `<br><small style="color:var(--gray-500); font-size:0.78rem;">${exp.notes}</small>` : ""}
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

// ============================================================================
// 8. TAB 3: Request Services Engine (Doctor & Hospital Sponsorships)
// ============================================================================
const SERVICES_STORAGE_KEY = "pharma_services_data";

function loadServices() {
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: "srv_201",
      requesterId: "rep1",
      requesterRole: "medical_rep",
      lineId: "line1",
      department: "sales",
      areaId: "area1",
      shift: "PM",
      targetType: "doctor",
      targetId: "d1",
      targetName: "Dr. Ahmed Mostafa",
      title: "CME Cardiology Round Table Discussion",
      cost: 15000,
      date: "2026-09-28",
      notes: "High potential cardiologist with 150+ monthly script rate",
      status: "pending_dm",
      nextApproverId: "dm1",
      history: [
        { action: "submitted", at: "2026-09-20T10:00:00.000Z", by: "rep1" },
      ],
    },
    {
      id: "srv_202",
      requesterId: "rep1",
      requesterRole: "medical_rep",
      lineId: "line1",
      department: "marketing",
      areaId: "area1",
      shift: "AM",
      targetType: "hospital",
      targetId: "h1",
      targetName: "Al-Salam Hospital",
      title: "Cardiology Patient Awareness Brochures & Standees",
      cost: 8000,
      date: "2026-09-25",
      notes: "Main hospital cardiology outpatient department branding",
      status: "pending_lm",
      nextApproverId: "lm1",
      history: [
        { action: "submitted", at: "2026-09-18T11:00:00.000Z", by: "rep1" },
        { action: "approved", at: "2026-09-19T14:00:00.000Z", by: "dm1", role: "district_manager" },
      ],
    },
    {
      id: "srv_203",
      requesterId: "rep2",
      requesterRole: "medical_rep",
      lineId: "line1",
      department: "sales",
      areaId: "area2",
      shift: "PM",
      targetType: "doctor",
      targetId: "d5",
      targetName: "Dr. Khaled Omar",
      title: "Scientific Congress Attendance Sponsorship",
      cost: 12000,
      date: "2026-09-22",
      notes: "Annual Cardiology Summit speaker sponsorship",
      status: "approved",
      nextApproverId: null,
      history: [
        { action: "submitted", at: "2026-09-12T09:00:00.000Z", by: "rep2" },
        { action: "approved", at: "2026-09-13T10:00:00.000Z", by: "dm1", role: "district_manager" },
        { action: "approved", at: "2026-09-14T11:30:00.000Z", by: "lm1", role: "line_manager" },
      ],
    },
    {
      id: "srv_204",
      requesterId: "dm1",
      requesterRole: "district_manager",
      lineId: "line1",
      department: "sales",
      areaId: "area1",
      shift: "AM",
      targetType: "hospital",
      targetId: "h2",
      targetName: "Nasser Institute",
      title: "Multidisciplinary Clinical Workshop & CME",
      cost: 25000,
      date: "2026-09-29",
      notes: "District-level cardiac surgery & care symposium",
      status: "pending_lm",
      nextApproverId: "lm1",
      history: [
        { action: "submitted", at: "2026-09-19T12:00:00.000Z", by: "dm1" },
      ],
    },
  ];
}

function saveServices(services) {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  } catch (e) {}
}

function getBudgetMetricsForUser(lineId, user) {
  const budgets = loadBudgets();
  const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
  const allServices = loadServices();

  let totalAllocated = 0;
  let relevantServices = [];

  if (user.role === "line_manager") {
    totalAllocated = lineBudget.lmAllocations[user.id] || 0;
    relevantServices = allServices.filter((s) => s.lineId === lineId && canUserViewRequest(s, user));
  } else if (user.role === "district_manager") {
    totalAllocated = lineBudget.dmAllocations[user.id] || 0;
    relevantServices = allServices.filter((s) => s.lineId === lineId && canUserViewRequest(s, user));
  } else if (user.role === "medical_rep" || user.role === "rep") {
    const dmId = user.managerId || "dm1";
    totalAllocated = lineBudget.dmAllocations[dmId] || 0;
    // Rep tracks his own utilization against the team pool
    relevantServices = allServices.filter((s) => s.lineId === lineId && s.requesterId === user.id);
  } else {
    totalAllocated = lineBudget.totalBudget || 0;
    relevantServices = allServices.filter((s) => s.lineId === lineId);
  }

  let approvedSpent = 0;
  let pendingAmount = 0;

  relevantServices.forEach((s) => {
    if (s.status === "approved") {
      approvedSpent += Number(s.cost || 0);
    } else if (s.status.startsWith("pending_")) {
      pendingAmount += Number(s.cost || 0);
    }
  });

  const remaining = totalAllocated - approvedSpent;

  return {
    totalAllocated,
    approvedSpent,
    pendingAmount,
    remaining,
  };
}

function renderServicesTab() {
  currentUser = getAuthUser();
  const lineSelect = document.getElementById("serviceBudgetLineSelect");
  const filterStatus = document.getElementById("serviceFilterStatus")?.value || "all";
  const filterDept = document.getElementById("serviceFilterDept")?.value || "all";
  const tableBody = document.getElementById("servicesTableBody");
  if (!lineSelect || !tableBody) return;

  const userLines = getUserAssignedLines(currentUser);
  const prevLine = lineSelect.value;
  lineSelect.innerHTML = userLines
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join("");

  if (prevLine && userLines.some((l) => l.id === prevLine)) {
    lineSelect.value = prevLine;
  } else if (userLines.length > 0) {
    lineSelect.value = userLines[0].id;
  }

  if (userLines.length === 1) {
    lineSelect.disabled = true;
  } else {
    lineSelect.disabled = false;
  }

  const selectedLineId = lineSelect.value;
  const metrics = getBudgetMetricsForUser(selectedLineId, currentUser);
  const mTotal = document.getElementById("srvMetricTotal");
  const mApproved = document.getElementById("srvMetricApproved");
  const mPending = document.getElementById("srvMetricPending");
  const mRemaining = document.getElementById("srvMetricRemaining");

  if (mTotal) mTotal.textContent = `${metrics.totalAllocated.toLocaleString()} EGP`;
  if (mApproved) mApproved.textContent = `${metrics.approvedSpent.toLocaleString()} EGP`;
  if (mPending) mPending.textContent = `${metrics.pendingAmount.toLocaleString()} EGP`;
  if (mRemaining) {
    mRemaining.textContent = `${metrics.remaining.toLocaleString()} EGP`;
    mRemaining.style.color = metrics.remaining < 0 ? "var(--danger)" : "inherit";
  }

  if (currentUser.role === "line_manager") {
    renderLmBudgetPanel(selectedLineId);
  }

  const allServices = loadServices();
  // 1. Strictly filter by line AND role visibility hierarchy
  const userScopedServices = allServices.filter(
    (s) => s.lineId === selectedLineId && canUserViewRequest(s, currentUser),
  );

  // 2. Filter by status and department dropdowns
  const filtered = userScopedServices.filter((s) => {
    if (filterStatus !== "all") {
      if (filterStatus === "pending" && !s.status.startsWith("pending_")) return false;
      if (filterStatus !== "pending" && s.status !== filterStatus) return false;
    }
    if (filterDept !== "all" && s.department !== filterDept) return false;
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 2rem; color: var(--gray-500); font-weight:600;">${t("noServicesFound")}</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((srv) => {
      const requester = getUserById(srv.requesterId);
      const requesterName = getUserDisplayName(srv.requesterId);
      const requesterRole = requester ? requester.role.replace("_", " ").toUpperCase() : "";

      let canApprove = false;
      if (currentUser.role === "admin") {
        if (srv.status.startsWith("pending_")) canApprove = true;
      } else if (srv.requesterId !== currentUser.id) {
        if (srv.status === "pending_dm" && currentUser.role === "district_manager" && (srv.nextApproverId === currentUser.id || isSubordinateOf(srv.requesterId, currentUser.id))) {
          canApprove = true;
        } else if (srv.status === "pending_lm" && currentUser.role === "line_manager" && (srv.nextApproverId === currentUser.id || isSubordinateOf(srv.requesterId, currentUser.id))) {
          canApprove = true;
        }
      }

      let actionsHtml = "";
      if (canApprove) {
        actionsHtml += `
          <button type="button" class="action-btn-circle approve" title="${t("btnApprove")}" onclick="openDecisionModal('service', '${srv.id}', 'approve')">âœ“</button>
          <button type="button" class="action-btn-circle reject" title="${t("btnReject")}" onclick="openDecisionModal('service', '${srv.id}', 'reject')">âœ•</button>
        `;
      } else {
        actionsHtml = `<span style="color:var(--gray-400); font-size:0.85rem;">â€”</span>`;
      }

      const shiftIcon = srv.shift === "AM" ? "ðŸ¥ AM" : "ðŸ‘¨â€âš•ï¸ PM";
      const deptBadge = srv.department === "sales"
        ? `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">Sales</span>`
        : `<span class="badge" style="background:#fce7f3; color:#be185d; font-weight:700;">Marketing</span>`;

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
          <div style="color:var(--gray-600); font-size:0.82rem;">${srv.targetName || "-"}</div>
        </td>
        <td>
          <strong style="color:var(--gray-900); font-size:0.9rem;">${srv.title}</strong>
          ${srv.notes ? `<br><small style="color:var(--gray-500); font-size:0.78rem;">${srv.notes}</small>` : ""}
        </td>
        <td style="font-weight:800; color:var(--gray-900); white-space:nowrap;">${Number(srv.cost).toLocaleString()} EGP</td>
        <td>${getServiceStatusBadge(srv)}</td>
        <td style="text-align:center;"><div style="display:inline-flex; gap:6px; align-items:center;">${actionsHtml}</div></td>
      </tr>
    `;
    })
    .join("");
}

window.onServiceBudgetLineChange = function () {
  renderServicesTab();
};

function getServiceStatusBadge(srv) {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const status = srv.status;

  if (status === "pending_dm") {
    const approverName = getUserDisplayName(srv.nextApproverId || "dm1");
    const label = lang === "ar" ? `${t("waitingDmPrefix")}${approverName} (DM)` : `${t("waitingDmPrefix")}${approverName}`;
    return `<span class="status-pill pending" title="${label}">${label}</span>`;
  }
  if (status === "pending_lm") {
    const approverName = getUserDisplayName(srv.nextApproverId || "lm1");
    const label = lang === "ar" ? `${t("waitingLmPrefix")}${approverName} (LM)` : `${t("waitingLmPrefix")}${approverName}`;
    return `<span class="status-pill pending" title="${label}">${label}</span>`;
  }
  if (status === "approved") {
    return `<span class="status-pill approved">${t("approvedLabel")}</span>`;
  }
  if (status === "rejected") {
    return `<span class="status-pill rejected">${t("rejectedLabel")}</span>`;
  }
  return `<span class="status-pill pending">${status}</span>`;
}

function renderLmBudgetPanel(lineId) {
  const tableBody = document.getElementById("lmDmAllocationTableBody");
  if (!tableBody) return;

  const budgets = loadBudgets();
  const lineBudget = budgets[lineId] || { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };

  const allUsers = getAllUsers();
  const dms = allUsers.filter(
    (u) =>
      u.role === "district_manager" &&
      u.managerId === currentUser.id &&
      (u.lineId === lineId || (Array.isArray(u.lineIds) && u.lineIds.includes(lineId))),
  );

  const allServices = loadServices();

  if (dms.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.2rem; color:var(--gray-500);">No District Managers assigned under this line.</td></tr>`;
    return;
  }

  tableBody.innerHTML = dms
    .map((dm) => {
      const alloc = lineBudget.dmAllocations[dm.id] || 0;
      const teamReps = allUsers.filter((u) => u.managerId === dm.id).map((u) => u.id);
      teamReps.push(dm.id);

      const utilized = allServices
        .filter((s) => s.lineId === lineId && teamReps.includes(s.requesterId) && s.status === "approved")
        .reduce((sum, s) => sum + Number(s.cost || 0), 0);

      return `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--gray-800);">${getUserDisplayName(dm.id)}</div>
          <small style="color:var(--gray-500);">${dm.email || ""}</small>
        </td>
        <td><span class="badge" style="background:var(--gray-100); color:var(--gray-700); font-weight:600;">${dm.employeeCode || dm.id}</span></td>
        <td>
          <input type="number" class="allocation-input lm-dm-input" data-dmid="${dm.id}" value="${alloc}" min="0" step="1000" style="width:150px; font-weight:700;">
        </td>
        <td><strong style="color:var(--primary);">${utilized.toLocaleString()} EGP</strong></td>
      </tr>
    `;
    })
    .join("");
}

window.saveLmAllocation = function () {
  const lineSelect = document.getElementById("serviceBudgetLineSelect");
  if (!lineSelect) return;
  const lineId = lineSelect.value;
  const budgets = loadBudgets();
  if (!budgets[lineId]) budgets[lineId] = { totalBudget: 0, lmAllocations: {}, dmAllocations: {} };
  if (!budgets[lineId].dmAllocations) budgets[lineId].dmAllocations = {};

  document.querySelectorAll(".lm-dm-input").forEach((inp) => {
    const dmId = inp.dataset.dmid;
    if (dmId) {
      budgets[lineId].dmAllocations[dmId] = Number(inp.value || 0);
    }
  });

  saveBudgets(budgets);
  if (typeof showToast === "function") {
    showToast(t("savedBudgetMessage"), "success");
  }
  renderServicesTab();
};

// ============================================================================
// 9. SERVICE MODAL & DYNAMIC FORM WIREUPS
// ============================================================================
window.openServiceModal = function () {
  currentUser = getAuthUser();
  const modal = document.getElementById("serviceModal");
  if (!modal) return;
  document.getElementById("serviceForm")?.reset();

  const userLines = getUserAssignedLines(currentUser);
  const lineSelect = document.getElementById("serviceFormLineSelect");
  if (lineSelect) {
    lineSelect.innerHTML = userLines
      .map((l) => `<option value="${l.id}">${l.name}</option>`)
      .join("");
    if (userLines.length === 1) {
      lineSelect.disabled = true;
      lineSelect.value = userLines[0].id;
    } else {
      lineSelect.disabled = false;
      if (userLines.length > 0) lineSelect.value = userLines[0].id;
    }
  }

  const dateInp = document.getElementById("serviceFormDateInput");
  if (dateInp) dateInp.value = formatDate(new Date());

  onServiceFormLineChange();
  onServiceFormShiftChange();

  modal.style.display = "flex";
  modal.classList.add("active");
};

window.closeServiceModal = function () {
  const modal = document.getElementById("serviceModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
};

window.onServiceFormLineChange = function () {
  const lineSelect = document.getElementById("serviceFormLineSelect");
  const areaSelect = document.getElementById("serviceFormAreaSelect");
  if (!lineSelect || !areaSelect) return;

  const lineId = lineSelect.value;
  const areas = getAreasForLine(lineId);

  areaSelect.innerHTML = areas
    .map((a) => `<option value="${a.id}">${a.name} (${a.code || a.id})</option>`)
    .join("");

  if (currentUser.areaId && areas.some((a) => a.id === currentUser.areaId)) {
    areaSelect.value = currentUser.areaId;
  } else if (areas.length > 0) {
    areaSelect.value = areas[0].id;
  }

  onServiceFormAreaChange();
};

window.onServiceFormAreaChange = function () {
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
      docSelect.innerHTML = docs
        .map((d) => `<option value="${d.id}">${d.nameAr || d.name} - ${d.specialty || ""} (Class ${d.class || "A"})</option>`)
        .join("");
    }
  }

  if (hospSelect) {
    const hosps = getHospitalsForLineAndArea(lineId, areaId);
    if (hosps.length === 0) {
      hospSelect.innerHTML = `<option value="" disabled selected>No hospitals found in this area</option>`;
    } else {
      hospSelect.innerHTML = hosps
        .map((h) => `<option value="${h.id}">${h.nameAr || h.name} - ${h.address || ""}</option>`)
        .join("");
    }
  }
};

window.onServiceFormShiftChange = function () {
  const shiftSelect = document.getElementById("serviceFormShiftSelect");
  const hospGroup = document.getElementById("serviceHospitalGroup");
  const docGroup = document.getElementById("serviceDoctorGroup");
  const hospSelect = document.getElementById("serviceFormHospitalSelect");
  const docSelect = document.getElementById("serviceFormDoctorSelect");

  const shift = shiftSelect?.value || "PM";

  if (shift === "AM") {
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
};

window.handleServiceSubmit = function (e) {
  e.preventDefault();
  currentUser = getAuthUser();

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
    if (typeof showToast === "function") showToast("Please enter a valid cost.", "warning");
    return;
  }

  let targetType = "doctor";
  let targetId = "";
  let targetName = "";

  if (shift === "AM") {
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
    if (typeof showToast === "function") showToast("Please select a target doctor or hospital.", "warning");
    return;
  }

  const metrics = getBudgetMetricsForUser(lineId, currentUser);
  if (cost > metrics.remaining) {
    if (typeof showToast === "function") {
      showToast(t("insufficientBudgetNotice"), "warning");
    }
  }

  let initialStatus = "pending_dm";
  let nextApprover = null;

  if (currentUser.role === "medical_rep" || currentUser.role === "rep") {
    initialStatus = "pending_dm";
    nextApprover = currentUser.managerId || "dm1";
  } else if (currentUser.role === "district_manager") {
    initialStatus = "pending_lm";
    nextApprover = currentUser.managerId || "lm1";
  } else {
    initialStatus = "approved";
    nextApprover = null;
  }

  const newService = {
    id: "srv_" + Date.now(),
    requesterId: currentUser.id,
    requesterRole: currentUser.role,
    lineId,
    department,
    areaId,
    shift,
    targetType,
    targetId,
    targetName,
    title,
    cost,
    date,
    notes,
    status: initialStatus,
    nextApproverId: nextApprover,
    history: [
      {
        action: "submitted",
        at: new Date().toISOString(),
        by: currentUser.id,
        role: currentUser.role,
      },
    ],
  };

  const services = loadServices();
  services.unshift(newService);
  saveServices(services);

  closeServiceModal();
  renderServicesTab();
  if (typeof showToast === "function") {
    showToast(t("successAction"), "success");
  }
};

// ============================================================================
// 10. DECISION / APPROVAL MODAL ENGINE
// ============================================================================
let pendingDecision = null;

window.openDecisionModal = function (type, requestId, decision) {
  pendingDecision = { type, requestId, decision };
  const modal = document.getElementById("decisionModal");
  const titleEl = document.getElementById("decisionModalTitle");
  const msgEl = document.getElementById("decisionModalMessage");
  const commentInp = document.getElementById("decisionCommentInput");
  const confirmBtn = document.getElementById("decisionConfirmBtn");

  if (!modal || !titleEl || !msgEl || !confirmBtn) return;
  if (commentInp) commentInp.value = "";

  let item = null;
  if (type === "expense") {
    item = loadExpenses().find((e) => e.id === requestId);
  } else {
    item = loadServices().find((s) => s.id === requestId);
  }

  if (!item) return;

  const requesterName = getUserDisplayName(item.requesterId);
  const amount = Number(item.amount || item.cost || 0).toLocaleString();

  if (decision === "approve") {
    titleEl.textContent = t("confirmApprovalTitle");
    msgEl.textContent = t("confirmApproveMsg")
      .replace("{amount}", amount)
      .replace("{name}", requesterName);
    confirmBtn.className = "btn btn-primary";
    confirmBtn.textContent = t("btnApprove");
  } else if (decision === "reject") {
    titleEl.textContent = t("confirmRejectionTitle");
    msgEl.textContent = t("confirmRejectMsg").replace("{name}", requesterName);
    confirmBtn.className = "btn btn-danger";
    confirmBtn.textContent = t("btnReject");
  } else if (decision === "disburse") {
    titleEl.textContent = t("confirmDisbursementTitle");
    msgEl.textContent = t("confirmDisburseMsg")
      .replace("{amount}", amount)
      .replace("{name}", requesterName);
    confirmBtn.className = "btn btn-success";
    confirmBtn.textContent = t("btnDisburse");
  }

  modal.style.display = "flex";
  modal.classList.add("active");
};

window.closeDecisionModal = function () {
  const modal = document.getElementById("decisionModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
  pendingDecision = null;
};

window.executeDecisionConfirm = function () {
  if (!pendingDecision) return;
  currentUser = getAuthUser();
  const { type, requestId, decision } = pendingDecision;
  const comment = document.getElementById("decisionCommentInput")?.value.trim() || "";

  if (decision === "reject" && !comment) {
    if (typeof showToast === "function") showToast(t("rejectionReasonRequired"), "warning");
    return;
  }

  const nowIso = new Date().toISOString();

  if (type === "expense") {
    const expenses = loadExpenses();
    const exp = expenses.find((e) => e.id === requestId);
    if (!exp) return;

    if (!exp.history) exp.history = [];

    if (decision === "reject") {
      exp.status = "rejected";
      exp.nextApproverId = null;
      exp.history.push({
        action: "rejected",
        at: nowIso,
        by: currentUser.id,
        role: currentUser.role,
        comment,
      });
    } else if (decision === "disburse") {
      exp.status = "disbursed";
      exp.history.push({
        action: "disbursed",
        at: nowIso,
        by: currentUser.id,
        role: currentUser.role,
        comment,
      });
    } else if (decision === "approve") {
      if (exp.status === "pending_dm") {
        exp.status = "pending_hr";
        const hr = getHrUser();
        exp.nextApproverId = hr ? hr.id : "hr1";
      } else if (exp.status === "pending_lm") {
        exp.status = "pending_hr";
        const hr = getHrUser();
        exp.nextApproverId = hr ? hr.id : "hr1";
      } else if (exp.status === "pending_hr") {
        exp.status = "approved";
        exp.nextApproverId = null;
      }
      exp.history.push({
        action: "approved",
        at: nowIso,
        by: currentUser.id,
        role: currentUser.role,
        comment,
      });
    }

    saveExpenses(expenses);
    renderExpensesTab();
  } else if (type === "service") {
    const services = loadServices();
    const srv = services.find((s) => s.id === requestId);
    if (!srv) return;

    if (!srv.history) srv.history = [];

    if (decision === "reject") {
      srv.status = "rejected";
      srv.nextApproverId = null;
      srv.history.push({
        action: "rejected",
        at: nowIso,
        by: currentUser.id,
        role: currentUser.role,
        comment,
      });
    } else if (decision === "approve") {
      if (srv.status === "pending_dm") {
        srv.status = "pending_lm";
        srv.nextApproverId = currentUser.managerId || "lm1";
      } else if (srv.status === "pending_lm") {
        srv.status = "approved";
        srv.nextApproverId = null;
      }
      srv.history.push({
        action: "approved",
        at: nowIso,
        by: currentUser.id,
        role: currentUser.role,
        comment,
      });
    }

    saveServices(services);
    renderServicesTab();
  }

  closeDecisionModal();
  if (typeof showToast === "function") {
    showToast(t("successAction"), "success");
  }
};

// ============================================================================
// 11. RECEIPT ZOOM PREVIEW MODAL
// ============================================================================
window.openReceiptPreviewModal = function (imgSrc) {
  const modal = document.getElementById("receiptPreviewModal");
  const img = document.getElementById("receiptModalLargeImg");
  if (!modal || !img) return;
  img.src = imgSrc;
  modal.style.display = "flex";
  modal.classList.add("active");
};

window.closeReceiptPreviewModal = function () {
  const modal = document.getElementById("receiptPreviewModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
};

// ============================================================================
// 12. INITIALIZATION
// ============================================================================
function initRequestsHub() {
  currentUser = getAuthUser();
  setupRoleTabVisibility();

  document.getElementById("prevDayBtn")?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateView();
  });

  document.getElementById("nextDayBtn")?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateView();
  });

  document.getElementById("todayBtn")?.addEventListener("click", () => {
    currentDate = window.getSystemDate ? window.getSystemDate() : new Date();
    updateView();
  });

  if (activeTab === "tab-activities") {
    updateView();
  } else if (activeTab === "tab-expenses") {
    renderExpensesTab();
  } else if (activeTab === "tab-services") {
    renderServicesTab();
  } else if (activeTab === "tab-budget") {
    renderBudgetTab();
  }
}

document.addEventListener("DOMContentLoaded", initRequestsHub);

document.addEventListener("languageChanged", () => {
  setupRoleTabVisibility();
  if (activeTab === "tab-activities") updateView();
  else if (activeTab === "tab-expenses") renderExpensesTab();
  else if (activeTab === "tab-services") renderServicesTab();
  else if (activeTab === "tab-budget") renderBudgetTab();
});