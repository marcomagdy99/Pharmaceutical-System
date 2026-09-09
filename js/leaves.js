/**
 * @file leaves.js
 * @description Leaves Management Module supporting Multi-level Approvals (Rep -> DM -> LM -> HR),
 * Full/Half Day Duration, File Attachments, Dynamic Balance Deduction, and HR Public Holiday declarations.
 */

const esc = window.escapeHtml || ((s) => s || "");

// Master Leave Requests with 3-tier Approval Tracking
let demoLeaves = (window.store && window.store.leaves
  ? window.store.leaves.getAll()
  : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [
  {
    id: "l1",
    userId: "rep1",
    userName: "Ahmed Mostafa",
    userRole: "medical_rep",
    type: "annual",
    dayDuration: "full",
    days: 5,
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    reason: "Family vacation",
    attachmentName: "flight_tickets.pdf",
    status: "approved",
    approvals: {
      dm: {
        status: "approved",
        approverName: "Karim Nasser",
        updatedAt: "2026-07-28 10:30 AM",
      },
      lm: {
        status: "approved",
        approverName: "Hassan Ali",
        updatedAt: "2026-07-28 02:15 PM",
      },
      hr: {
        status: "approved",
        approverName: "Fatma El-Sherif",
        updatedAt: "2026-07-29 09:00 AM",
      },
    },
  },
  {
    id: "l2",
    userId: "rep1",
    userName: "Ahmed Mostafa",
    userRole: "medical_rep",
    type: "sick",
    dayDuration: "full",
    days: 2,
    startDate: "2026-09-10",
    endDate: "2026-09-11",
    reason: "Medical rest",
    attachmentName: "doctor_prescription.pdf",
    status: "pending",
    approvals: {
      dm: {
        status: "approved",
        approverName: "Karim Nasser",
        updatedAt: "2026-09-02 11:30 AM",
      },
      lm: { status: "pending", approverName: null, updatedAt: null },
      hr: { status: "pending", approverName: null, updatedAt: null },
    },
  },
  {
    id: "l3",
    userId: "dm1",
    userName: "Karim Nasser",
    userRole: "district_manager",
    type: "casual",
    dayDuration: "full",
    days: 1,
    startDate: "2026-09-15",
    endDate: "2026-09-15",
    reason: "Urgent family matter",
    attachmentName: null,
    status: "pending",
    approvals: {
      dm: {
        status: "approved",
        approverName: "Karim Nasser",
        updatedAt: "2026-09-03 09:00 AM",
      },
      lm: { status: "pending", approverName: null, updatedAt: null },
      hr: { status: "pending", approverName: null, updatedAt: null },
    },
  },
];

const leaveTranslations = {
  en: {
    pageTitle: "Leaves Management",
    annualLeave: "Annual Leave",
    casualLeave: "Casual Vacation",
    sickLeave: "Sick Leave",
    emergencyLeave: "Emergency Leave",
    compensatoryLeave: "Compensatory Leave",
    funeralLeave: "Funeral Vacation",
    militaryLeave: "Calling for Army",
    unpaidLeave: "Unpaid Leave",
    maternityPaternity: "Maternity/Paternity",
    used: "Used",
    remaining: "Remaining",
    days: "Days",
    submitRequest: "Submit Leave Request",
    leaveType: "Leave Type",
    selectType: "Select Leave Type",
    startDate: "Start Date",
    endDate: "End Date",
    daysCount: "Days Count",
    reason: "Comment",
    leaveComment: "Comment",
    leaveCommentPlaceholder: "Comment...",
    submit: "Submit",
    myHistory: "My Leave History",
    status: "Status",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    managerSection: "Manager Approvals Inbox",
    pendingApprovals: "Pending Approvals Inbox",
    approve: "Approve",
    reject: "Reject",
    noPending: "No pending leave requests.",
    noHistory: "No leave history recorded.",
    hrGovernanceTitle: "🏛️ HR Governance: Leave Balances & Public Holidays",
    employeeBalanceControl: "Employee Leave Balance Allocation",
    employeeBalanceControlSub:
      "Customize annual, casual, and sick days per employee",
    selectEmployee: "Select Employee",
    chooseEmployee: "Choose an employee...",
    annualDaysLabel: "Annual (Days)",
    casualDaysLabel: "Casual (Days)",
    sickDaysLabel: "Sick (Days)",
    saveEmployeeBalance: "Save Employee Balance",
    declarePublicHoliday: "Declare Official Public Holiday",
    declarePublicHolidaySub: "Company-wide calendar, zero balance deduction",
    holidayDateLabel: "Holiday Date",
    holidayTitleLabel: "Holiday Title",
    addHolidayBtn: "Add Official Public Holiday",
    currentHolidays: "Currently Declared Public Holidays:",
    totalDays: "Total",
    holidayDurationLabel: "Holiday Duration",
    fullDay: "Full Day",
    halfDay: "Half Day",
    allEmployeesLeavesTitle: "📋 All Employees Leave Records",
    allEmployeesLeavesSub:
      "Audit and track leave requests across all company staff",
    companyLeaveArchive: "Company Leave Archive",
    filterByEmployee: "Employee",
    allEmployees: "All Employees",
    filterByType: "Leave Type",
    allTypes: "All Types",
    filterByStatus: "Status",
    allStatuses: "All Statuses",
    searchLeavesPlaceholder: "Search by name, role, reason...",
    employee: "Employee",
    leaveDuration: "Leave Duration",
    noMatchingRecords: "No matching leave records found.",
  },
  ar: {
    pageTitle: "إدارة الإجازات",
    annualLeave: "Annual Leave",
    casualLeave: "Casual Vacation",
    sickLeave: "Sick Leave",
    emergencyLeave: "Emergency Leave",
    compensatoryLeave: "Compensatory Leave",
    funeralLeave: "Funeral Vacation",
    militaryLeave: "Calling for Army",
    unpaidLeave: "Unpaid Leave",
    maternityPaternity: "Maternity/Paternity",
    used: "مستخدم",
    remaining: "متبقي",
    days: "أيام",
    submitRequest: "تقديم طلب إجازة",
    leaveType: "نوع الإجازة",
    selectType: "اختر نوع الإجازة",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    daysCount: "عدد الأيام",
    reason: "تعليق",
    leaveComment: "تعليق",
    leaveCommentPlaceholder: "تعليق...",
    submit: "تقديم",
    myHistory: "سجل إجازاتي",
    status: "الحالة",
    pending: "قيد الانتظار",
    approved: "مقبول",
    rejected: "مرفوض",
    managerSection: "صندوق موافقات المدير",
    pendingApprovals: "طلبات قيد الانتظار",
    approve: "قبول",
    reject: "رفض",
    noPending: "لا توجد طلبات قيد الانتظار.",
    noHistory: "لا يوجد سجل إجازات مسجل.",
    hrGovernanceTitle:
      "🏛️ إدارة الموارد البشرية: أرصدة الإجازات والإجازات الرسمية",
    employeeBalanceControl: "تخصيص وضبط أرصدة إجازات الموظفين",
    employeeBalanceControlSub:
      "تحديد عدد أيام الإجازات السنوية والعارضة والمرضية لكل موظف",
    selectEmployee: "اختر الموظف",
    chooseEmployee: "اختر موظفاً...",
    annualDaysLabel: "الاعتيادية (أيام)",
    casualDaysLabel: "العارضة (أيام)",
    sickDaysLabel: "المرضية (أيام)",
    saveEmployeeBalance: "حفظ رصيد الموظف",
    declarePublicHoliday: "تسجيل إجازة رسمية عامة",
    declarePublicHolidaySub: "تظهر في نتيجة الشركة بدون خصم من رصيد الموظف",
    holidayDateLabel: "تاريخ الإجازة",
    holidayTitleLabel: "اسم / مناسبة الإجازة",
    addHolidayBtn: "إضافة إجازة رسمية",
    currentHolidays: "الإجازات الرسمية المسجلة حالياً:",
    totalDays: "الإجمالي",
    holidayDurationLabel: "مدة العطلة الرسمية",
    fullDay: "يوم كامل",
    halfDay: "نصف يوم",
    allEmployeesLeavesTitle: "📋 سجل إجازات جميع الموظفين",
    allEmployeesLeavesSub:
      "تدقيق ومتابعة جميع طلبات الإجازات لفرق العمل بالشركة",
    companyLeaveArchive: "أرشيف إجازات الشركة",
    filterByEmployee: "الموظف",
    allEmployees: "جميع الموظفين",
    filterByType: "نوع الإجازة",
    allTypes: "جميع الأنواع",
    filterByStatus: "الحالة",
    allStatuses: "جميع الحالات",
    searchLeavesPlaceholder: "بحث بالاسم، الدور، أو السبب...",
    employee: "الموظف",
    leaveDuration: "مدة الإجازة",
    noMatchingRecords: "لا توجد سجلات إجازات مطابقة للبحث.",
  },
};

if (window.translations) {
  if (window.translations.en)
    Object.assign(window.translations.en, leaveTranslations.en);
  if (window.translations.ar)
    Object.assign(window.translations.ar, leaveTranslations.ar);
}

let currentUser = (window.checkAuth && window.checkAuth()) || {
  id: "rep1",
  role: "medical_rep",
  name: "Ahmed Mostafa",
};

function initLeaves() {
  if (window.translations) {
    if (window.translations.en)
      Object.assign(window.translations.en, leaveTranslations.en);
    if (window.translations.ar)
      Object.assign(window.translations.ar, leaveTranslations.ar);
  }
  if (window.initPage) {
    window.initPage("leaves");
  }
  if (typeof window.applyTranslations === "function") {
    window.applyTranslations();
  }
  currentUser = (window.checkAuth && window.checkAuth()) || currentUser;
  updateUIForUser();
  setupEventListeners();
  calculateBalances();
  applyTranslations();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLeaves);
} else {
  initLeaves();
}

function setupEventListeners() {
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");

  startInput?.addEventListener("change", calcDays);
  endInput?.addEventListener("change", calcDays);

  document.getElementById("leaveForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const type = document.getElementById("leaveType").value;
    const durationType =
      document.querySelector('input[name="leaveDurationType"]:checked')
        ?.value || "full";
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const reason = document.getElementById("reason").value;

    const attachmentInput = document.getElementById("leaveAttachment");
    const attachmentName =
      attachmentInput && attachmentInput.files[0]
        ? attachmentInput.files[0].name
        : null;

    let calculatedDays = 1;
    if (durationType === "half") {
      calculatedDays = 0.5;
    } else {
      calculatedDays = resolveLeaveDays(startDate, endDate);
    }

    if (calculatedDays === 0) {
      const isAr = (window.getCurrentLang && window.getCurrentLang()) === "ar";
      return showToast(
        isAr
          ? "التواريخ المختارة هي عطلة رسمية عامة بالفعل ولا تتطلب خصم أي أيام إجازة."
          : "The selected dates are already official public holidays and do not require leave deduction.",
        "info",
      );
    }

    const userRole = (currentUser.role || "medical_rep").toLowerCase();
    let initialApprovals = {};

    if (userRole === "medical_rep" || userRole === "rep") {
      initialApprovals = {
        dm: { status: "pending", approverName: null, updatedAt: null },
        lm: { status: "pending", approverName: null, updatedAt: null },
        hr: { status: "pending", approverName: null, updatedAt: null },
      };
    } else if (userRole === "district_manager" || userRole === "dm") {
      initialApprovals = {
        dm: {
          status: "approved",
          approverName: currentUser.name,
          updatedAt: new Date().toLocaleDateString(),
        },
        lm: { status: "pending", approverName: null, updatedAt: null },
        hr: { status: "pending", approverName: null, updatedAt: null },
      };
    } else {
      initialApprovals = {
        hr: { status: "pending", approverName: null, updatedAt: null },
      };
    }

    const newLeave = {
      id: "l_" + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      type,
      dayDuration: durationType,
      days: calculatedDays,
      startDate,
      endDate,
      reason,
      attachmentName,
      status: "pending",
      approvals: initialApprovals,
    };

    demoLeaves.unshift(newLeave);
    if (window.DEMO_DATA) {
      window.DEMO_DATA.leaves = demoLeaves;
      if (window.saveDataToStorage) window.saveDataToStorage();
    }

    showToast(
      "Leave request submitted for multi-level approval successfully!",
      "success",
    );
    e.target.reset();
    document.getElementById("daysCount").value = "1 Day";
    const holidayNotice = document.getElementById("leaveHolidayNotice");
    if (holidayNotice) holidayNotice.style.display = "none";
    renderHistory();
    renderPendingApprovals();
    if (typeof renderHrAllLeaves === "function") renderHrAllLeaves();
  });

  document
    .getElementById("historyFilter")
    ?.addEventListener("change", renderHistory);
}

const leavesApp = {
  onDurationTypeChange() {
    const durationType =
      document.querySelector('input[name="leaveDurationType"]:checked')
        ?.value || "full";
    const daysCountInput = document.getElementById("daysCount");
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const isAr = lang === "ar";
    if (durationType === "half") {
      daysCountInput.value = isAr ? "نصف يوم" : "Half Day";
    } else {
      calcDays();
    }
  },
};

window.onDurationTypeChange = function () {
  leavesApp.onDurationTypeChange();
};

function calcDays() {
  const durationType =
    document.querySelector('input[name="leaveDurationType"]:checked')?.value ||
    "full";
  const daysCount = document.getElementById("daysCount");
  const holidayNotice = document.getElementById("leaveHolidayNotice");
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  if (durationType === "half") {
    if (daysCount) daysCount.value = isAr ? "نصف يوم" : "Half Day";
    if (holidayNotice) holidayNotice.style.display = "none";
    return;
  }

  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (start && end) {
    const res = resolveLeaveDaysDetailed(start, end);
    const days = res.totalDays;
    const daysWord = isAr
      ? days === 1
        ? "يوم"
        : days === 2
          ? "يومان"
          : days >= 3 && days <= 10
            ? "أيام"
            : "يوم"
      : days === 1
        ? "Day"
        : "Days";

    if (daysCount) daysCount.value = `${days} ${daysWord}`;

    if (holidayNotice) {
      if (res.excludedHolidays.length > 0) {
        holidayNotice.style.display = "block";
        const titles = res.excludedHolidays
          .map((h) => {
            const durLabel =
              h.duration === "half"
                ? isAr
                  ? "نصف يوم"
                  : "Half Day"
                : isAr
                  ? "يوم كامل"
                  : "Full Day";
            return `<strong>${esc(h.title)}</strong> (${esc(h.date)} - ${durLabel})`;
          })
          .join("، ");
        holidayNotice.innerHTML = isAr
          ? `🌴 <strong>تمت مراعاة ${res.excludedHolidays.length} عطلة رسمية بدون خصم كامل من رصيدك:</strong> ${titles}`
          : `🌴 <strong>${res.excludedHolidays.length} Public Holiday(s) accounted for:</strong> ${titles}`;
      } else {
        holidayNotice.style.display = "none";
      }
    }
  } else {
    if (holidayNotice) holidayNotice.style.display = "none";
  }
}

/**
 * Resolves leave days and detects any overlapping official public holidays.
 * Excludes official public holidays from deductible leave days.
 * If a public holiday is half day, 0.5 is deducted instead of 1.0.
 */
function resolveLeaveDaysDetailed(start, end) {
  if (!start || !end) return { totalDays: 1, excludedHolidays: [] };

  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()))
    return { totalDays: 1, excludedHolidays: [] };

  const startD = s <= e ? s : e;
  const endD = s <= e ? e : s;

  const publicHolidays =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.publicHolidays)
      ? window.DEMO_DATA.publicHolidays
      : [];

  let count = 0;
  const excludedHolidays = [];

  const cur = new Date(startD);
  while (cur <= endD) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const holidayMatch = publicHolidays.find((h) => h.date === dateStr);
    if (holidayMatch) {
      excludedHolidays.push(holidayMatch);
      if (holidayMatch.duration === "half") {
        count += 0.5;
      }
    } else {
      count += 1;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return {
    totalDays: count,
    excludedHolidays,
  };
}

function resolveLeaveDays(start, end) {
  const res = resolveLeaveDaysDetailed(start, end);
  return res.totalDays;
}

function updateUIForUser() {
  const roleDisplay = document.getElementById("currentUserRoleBadge");
  const nameDisplay = document.getElementById("currentUserNameDisplay");
  if (roleDisplay) roleDisplay.textContent = currentUser.role || "Medical Rep";
  if (nameDisplay) nameDisplay.textContent = currentUser.name;

  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "medical_rep").toLowerCase();
  const isManager = window.isManagerRole
    ? window.isManagerRole(currentUser) ||
      window.hasAnyRole(["hr", "admin"], currentUser)
    : role !== "medical_rep";

  const managerSection = document.getElementById("managerSection");
  if (managerSection) {
    managerSection.style.display = isManager ? "flex" : "none";
  }

  const hrHolidaySection = document.getElementById("hrHolidaySection");
  if (hrHolidaySection) {
    hrHolidaySection.style.display =
      role === "hr" || role === "admin" ? "flex" : "none";
    if (role === "hr" || role === "admin") {
      renderDeclaredHolidaysList();
      initHrBalanceControl();
    }
  }

  const hrAllLeavesSection = document.getElementById("hrAllLeavesSection");
  if (hrAllLeavesSection) {
    hrAllLeavesSection.style.display =
      role === "hr" || role === "admin" ? "flex" : "none";
    if (role === "hr" || role === "admin") {
      initHrAllLeavesControl();
      renderHrAllLeaves();
    }
  }

  renderHistory();
  if (isManager) renderPendingApprovals();
}

/**
 * Dynamically computes and updates leave balances based on approved leaves.
 */
function calculateBalances() {
  const allUsers =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
      ? window.DEMO_DATA.users
      : [];
  const userObj = allUsers.find((u) => u.id === currentUser.id) || currentUser;
  const userBalance = userObj.leaveBalance || currentUser.leaveBalance || {};
  const totals = {
    annual: userBalance.annual !== undefined ? Number(userBalance.annual) : 21,
    sick: userBalance.sick !== undefined ? Number(userBalance.sick) : 7,
    emergency:
      userBalance.emergency !== undefined
        ? Number(userBalance.emergency)
        : userBalance.casual !== undefined
          ? Number(userBalance.casual)
          : 6,
  };
  let used = { annual: 0, sick: 0, emergency: 0 };

  demoLeaves.forEach((l) => {
    if (l.userId === currentUser.id && l.status === "approved") {
      const d = parseFloat(l.days) || 1;
      if (l.type === "annual") {
        used.annual += d;
      } else if (l.type === "casual" || l.type === "emergency") {
        used.emergency += d;
      } else if (l.type === "sick") {
        used.sick += d;
      }
    }
  });

  ["annual", "sick", "emergency"].forEach((type) => {
    const rem = Math.max(0, totals[type] - used[type]);
    const elRem = document.getElementById(`${type}Remaining`);
    const elUsed = document.getElementById(`${type}Used`);
    const elTotal = document.getElementById(`${type}Total`);
    const elProg = document.getElementById(`${type}Progress`);

    if (elRem) elRem.textContent = rem;
    if (elUsed) elUsed.textContent = used[type];
    if (elTotal) elTotal.textContent = totals[type];
    if (elProg)
      elProg.style.width = `${Math.min(100, (used[type] / totals[type]) * 100)}%`;
  });
}

function getStatusBadge(status) {
  const mapping = {
    pending: { color: "bg-warning text-dark", icon: "bi-hourglass-split" },
    approved: { color: "bg-success", icon: "bi-check-circle" },
    rejected: { color: "bg-danger", icon: "bi-x-circle" },
  };
  const m = mapping[status] || mapping.pending;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const label = leaveTranslations[lang]?.[status] || status;
  return `<span class="badge ${m.color} status-badge"><i class="bi ${m.icon} me-1"></i>${label}</span>`;
}

/**
 * Resolves the actual manager/approver display name for a specific approval tier.
 */
function resolveApproverDisplayName(leave, level, lang) {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const app = (leave && leave.approvals && leave.approvals[level]) || {};
  const isAr = lang === "ar";

  if (app.approverName) {
    let clean = app.approverName
      .replace(/\s*\((?:DM|LM|HR|Self)\)/gi, "")
      .trim();
    if (
      clean &&
      clean.toLowerCase() !== "self" &&
      clean.toLowerCase() !== "dm" &&
      clean.toLowerCase() !== "lm" &&
      clean.toLowerCase() !== "hr"
    ) {
      const foundUser = allUsers.find(
        (u) =>
          u.name.toLowerCase() === clean.toLowerCase() ||
          (u.nameAr && u.nameAr === clean),
      );
      if (foundUser) {
        return isAr && foundUser.nameAr ? foundUser.nameAr : foundUser.name;
      }
      return clean;
    }
  }

  const applicantUser = allUsers.find((u) => u.id === leave.userId) || {};

  if (level === "dm") {
    if (
      applicantUser.role === "district_manager" ||
      applicantUser.role === "dm"
    ) {
      return isAr && applicantUser.nameAr
        ? applicantUser.nameAr
        : applicantUser.name || "Karim Nasser";
    }
    const dmUser = allUsers.find((u) => u.id === applicantUser.managerId);
    if (dmUser) {
      return isAr && dmUser.nameAr ? dmUser.nameAr : dmUser.name;
    }
    return isAr ? "كريم ناصر" : "Karim Nasser";
  }

  if (level === "lm") {
    let lmUser = null;
    if (
      applicantUser.role === "district_manager" ||
      applicantUser.role === "dm"
    ) {
      lmUser = allUsers.find((u) => u.id === applicantUser.managerId);
    } else {
      const dmUser = allUsers.find((u) => u.id === applicantUser.managerId);
      if (dmUser && dmUser.managerId) {
        lmUser = allUsers.find((u) => u.id === dmUser.managerId);
      }
    }
    if (lmUser) {
      return isAr && lmUser.nameAr ? lmUser.nameAr : lmUser.name;
    }
    return isAr ? "حسن علي" : "Hassan Ali";
  }

  if (level === "hr") {
    const hrUser = allUsers.find((u) => u.role === "hr");
    if (hrUser) {
      return isAr && hrUser.nameAr ? hrUser.nameAr : hrUser.name;
    }
    return isAr ? "فاطمة الشريف" : "Fatma El-Sherif";
  }

  return level.toUpperCase();
}

function getApproverDisplayName(leave, level, lang) {
  return resolveApproverDisplayName(leave, level, lang);
}

window.getApproverDisplayName = resolveApproverDisplayName;

function renderHistory() {
  const filter = document.getElementById("historyFilter")?.value || "all";
  const tbody = document.getElementById("historyTableBody");
  if (!tbody) return;
  tbody.replaceChildren();

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const myLeaves = demoLeaves.filter(
    (l) =>
      (l.userId === currentUser.id || currentUser.role === "admin") &&
      (filter === "all" || l.status === filter),
  );

  if (myLeaves.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${leaveTranslations[lang].noHistory}</td></tr>`;
    return;
  }

  myLeaves.forEach((l) => {
    const typeKey = l.type + "Leave";
    const typeLabel = leaveTranslations[lang]?.[typeKey] || l.type;
    const durationLabel =
      l.dayDuration === "half"
        ? lang === "ar"
          ? "نصف يوم"
          : "Half Day"
        : `${l.days} ${lang === "ar" ? "أيام" : "Days"}`;

    const app = l.approvals || {};
    let stepsHtml = "";

    const dmName = getApproverDisplayName(l, "dm", lang);
    const lmName = getApproverDisplayName(l, "lm", lang);
    const hrName = getApproverDisplayName(l, "hr", lang);

    if (app.dm) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.dm.status}">
            ${esc(dmName)}: ${app.dm.status.toUpperCase()} ${app.dm.updatedAt ? `(${app.dm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.lm) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.lm.status}">
            ${esc(lmName)}: ${app.lm.status.toUpperCase()} ${app.lm.updatedAt ? `(${app.lm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.hr) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.hr.status}">
            ${esc(hrName)}: ${app.hr.status.toUpperCase()} ${app.hr.updatedAt ? `(${app.hr.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong class="leave-item-title">${typeLabel}</strong>
      </td>
      <td>
        <div>${l.startDate} to ${l.endDate}</div>
        <small class="badge bg-light text-dark border">${durationLabel}</small>
      </td>
      <td>
        ${
          l.attachmentName
            ? `<span class="badge bg-primary-subtle text-primary border" style="font-size: 0.72rem;">📎 ${esc(l.attachmentName)}</span>`
            : '<span class="text-muted" style="font-size:0.75rem;">None</span>'
        }
      </td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          ${stepsHtml}
        </div>
      </td>
      <td>
        <span class="badge status-badge ${l.status === "approved" ? "bg-success" : l.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}">
          ${l.status.toUpperCase()}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPendingApprovals() {
  const container = document.getElementById("pendingApprovalsContainer");
  if (!container) return;
  container.replaceChildren();

  const role = (currentUser.role || "medical_rep").toLowerCase();

  const pending = demoLeaves.filter((l) => {
    if (l.status === "rejected" || l.status === "approved") return false;
    const app = l.approvals || {};

    // HR and Admin have organization-wide authority to review pending approvals
    if (role === "hr" || role === "admin") {
      return (
        app.hr &&
        app.hr.status === "pending" &&
        (app.lm ? app.lm.status === "approved" : true)
      );
    }

    // Verify applicant is in current manager's hierarchy to prevent unauthorized approvals
    const isSubordinate =
      typeof window.canApproveFor === "function"
        ? window.canApproveFor(l.userId)
        : true;

    if (!isSubordinate) return false;

    if (role === "district_manager" || role === "dm") {
      return app.dm && app.dm.status === "pending";
    }
    if (role === "line_manager" || role === "lm") {
      return (
        app.lm &&
        app.lm.status === "pending" &&
        (app.dm ? app.dm.status === "approved" : true)
      );
    }
    return false;
  });

  if (pending.length === 0) {
    container.innerHTML = `<p class="text-muted mb-0">No leave requests currently pending your approval level.</p>`;
    return;
  }

  pending.forEach((l) => {
    const typeKey = l.type + "Leave";
    const typeLabel = leaveTranslations["en"]?.[typeKey] || l.type;

    const card = document.createElement("div");
    card.className = "card mb-3 border";
    card.style.backgroundColor = "#232731";
    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div class="d-flex align-items-center">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width:40px;height:40px; font-weight:bold;">
              ${(l.userName || "U").charAt(0)}
            </div>
            <div>
              <h6 class="m-0 fw-bold" style="color:#ffffff;">${esc(l.userName)} (${esc(l.userRole || "Rep")})</h6>
              <small style="color:#cbd5e1;">${typeLabel} • ${l.days} Day(s) (${l.dayDuration || "full"})</small>
            </div>
          </div>
          <span style="color:#9da5b1;" class="small">${l.startDate} to ${l.endDate}</span>
        </div>
        <p class="mb-2 small" style="color:#dee2e6;"><strong>Reason:</strong> <span class="leave-reason-text"></span></p>
        ${
          l.attachmentName
            ? `<div class="mb-3"><span class="badge bg-primary-subtle text-primary border">📎 Attached: ${esc(l.attachmentName)}</span></div>`
            : ""
        }
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-success px-3 fw-bold" onclick="window.handleDecisionStep('${l.id}', 'approved')">
            <i class="bi bi-check-lg me-1"></i>Approve Request
          </button>
          <button class="btn btn-sm btn-danger px-3 fw-bold" onclick="window.handleDecisionStep('${l.id}', 'rejected')">
            <i class="bi bi-x-lg me-1"></i>Reject Request
          </button>
        </div>
      </div>
    `;

    const reasonEl = card.querySelector(".leave-reason-text");
    if (reasonEl) {
      reasonEl.textContent = l.reason || "";
    }

    container.appendChild(card);
  });
}

function handleDecisionStep(leaveId, decision) {
  leavesApp.handleDecisionStep(leaveId, decision);
}

function renderDeclaredHolidaysList() {
  const container = document.getElementById("declaredHolidaysBadges");
  if (!container) return;
  const holidays = (window.DEMO_DATA && window.DEMO_DATA.publicHolidays) || [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  if (holidays.length === 0) {
    container.innerHTML = `<span class="text-muted small">${isAr ? "لا توجد إجازات رسمية مسجلة حتى الآن." : "No official public holidays declared yet."}</span>`;
    return;
  }

  container.innerHTML = holidays
    .map((h, idx) => {
      const isHalf = h.duration === "half";
      const durationBadge = isHalf
        ? `<span class="badge bg-warning text-dark border border-warning" style="font-size: 11px;">${isAr ? "نصف يوم" : "Half Day"}</span>`
        : `<span class="badge bg-success-subtle text-success border border-success" style="font-size: 11px;">${isAr ? "يوم كامل" : "Full Day"}</span>`;

      return `
      <span class="badge bg-light text-dark border p-2 d-inline-flex align-items-center gap-2" style="font-size: 13px;">
        <span>🌴 <strong>${h.date}</strong>: ${esc(h.title)}</span>
        ${durationBadge}
        <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1 text-decoration-none" onclick="removeDeclaredHoliday(${idx})" title="Remove Holiday" style="font-size: 14px; line-height: 1;">✕</button>
      </span>
    `;
    })
    .join("");
}

function populateHrAllLeavesFilter() {
  const select = document.getElementById("hrAllLeavesEmployeeFilter");
  if (!select) return;
  const currentVal = select.value || "all";
  const allUsers =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
      ? window.DEMO_DATA.users
      : [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const defaultOpt = `<option value="all">${leaveTranslations[lang]?.allEmployees || "All Employees"}</option>`;
  const userOpts = allUsers
    .map((u) => {
      const displayName = isAr && u.nameAr ? u.nameAr : u.name || u.id;
      const roleBadge = u.role ? ` (${u.role})` : "";
      return `<option value="${u.id}">${esc(displayName)}${roleBadge}</option>`;
    })
    .join("");

  select.innerHTML = defaultOpt + userOpts;
  select.value = currentVal;
}

function initHrAllLeavesControl() {
  populateHrAllLeavesFilter();
  const empFilter = document.getElementById("hrAllLeavesEmployeeFilter");
  const typeFilter = document.getElementById("hrAllLeavesTypeFilter");
  const statusFilter = document.getElementById("hrAllLeavesStatusFilter");
  const searchInput = document.getElementById("hrAllLeavesSearchInput");

  if (empFilter && !empFilter.dataset.bound) {
    empFilter.addEventListener("change", renderHrAllLeaves);
    empFilter.dataset.bound = "true";
  }

  if (typeFilter && !typeFilter.dataset.bound) {
    typeFilter.addEventListener("change", renderHrAllLeaves);
    typeFilter.dataset.bound = "true";
  }

  if (statusFilter && !statusFilter.dataset.bound) {
    statusFilter.addEventListener("change", renderHrAllLeaves);
    statusFilter.dataset.bound = "true";
  }

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.addEventListener("input", renderHrAllLeaves);
    searchInput.dataset.bound = "true";
  }
}

function renderHrAllLeaves() {
  const tbody = document.getElementById("hrAllLeavesTableBody");
  if (!tbody) return;
  tbody.replaceChildren();

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const empVal =
    document.getElementById("hrAllLeavesEmployeeFilter")?.value || "all";
  const typeVal =
    document.getElementById("hrAllLeavesTypeFilter")?.value || "all";
  const statusVal =
    document.getElementById("hrAllLeavesStatusFilter")?.value || "all";
  const searchVal = (
    document.getElementById("hrAllLeavesSearchInput")?.value || ""
  )
    .trim()
    .toLowerCase();

  const leavesList =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.leaves)
      ? window.DEMO_DATA.leaves
      : demoLeaves;

  const totalCount = leavesList.length;
  const approvedCount = leavesList.filter(
    (l) => l.status === "approved",
  ).length;
  const pendingCount = leavesList.filter((l) => l.status === "pending").length;

  const statTotal = document.getElementById("hrStatTotalRequests");
  const statApproved = document.getElementById("hrStatApprovedRequests");
  const statPending = document.getElementById("hrStatPendingRequests");

  if (statTotal)
    statTotal.textContent = `${isAr ? "الإجمالي" : "Total"}: ${totalCount}`;
  if (statApproved)
    statApproved.textContent = `${isAr ? "مقبول" : "Approved"}: ${approvedCount}`;
  if (statPending)
    statPending.textContent = `${isAr ? "معلق" : "Pending"}: ${pendingCount}`;

  const filtered = leavesList.filter((l) => {
    if (empVal !== "all" && l.userId !== empVal) return false;
    if (typeVal !== "all" && l.type !== typeVal) return false;
    if (statusVal !== "all" && l.status !== statusVal) return false;

    if (searchVal) {
      const uName = (l.userName || "").toLowerCase();
      const uRole = (l.userRole || "").toLowerCase();
      const reason = (l.reason || "").toLowerCase();
      if (
        !uName.includes(searchVal) &&
        !uRole.includes(searchVal) &&
        !reason.includes(searchVal)
      ) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">${leaveTranslations[lang]?.noMatchingRecords || "No matching leave records found."}</td></tr>`;
    return;
  }

  filtered.forEach((l) => {
    const typeKey = l.type + "Leave";
    const typeLabel = leaveTranslations[lang]?.[typeKey] || l.type;
    const durationLabel =
      l.dayDuration === "half"
        ? isAr
          ? "نصف يوم"
          : "Half Day"
        : `${l.days} ${isAr ? "أيام" : "Days"}`;

    const app = l.approvals || {};
    let stepsHtml = "";

    const dmName = getApproverDisplayName(l, "dm", lang);
    const lmName = getApproverDisplayName(l, "lm", lang);
    const hrName = getApproverDisplayName(l, "hr", lang);

    if (app.dm) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.dm.status}">
            ${esc(dmName)}: ${app.dm.status.toUpperCase()} ${app.dm.updatedAt ? `(${app.dm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.lm) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.lm.status}">
            ${esc(lmName)}: ${app.lm.status.toUpperCase()} ${app.lm.updatedAt ? `(${app.lm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.hr) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.hr.status}">
            ${esc(hrName)}: ${app.hr.status.toUpperCase()} ${app.hr.updatedAt ? `(${app.hr.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 34px; height: 34px; font-weight: bold; font-size: 13px;">
            ${(l.userName || "U").charAt(0)}
          </div>
          <div>
            <div class="fw-bold leave-item-title">${esc(l.userName || "Employee")}</div>
            <small class="text-muted">${esc(l.userRole || "Staff")}</small>
          </div>
        </div>
      </td>
      <td>
        <strong class="leave-item-title">${typeLabel}</strong>
      </td>
      <td>
        <div>${l.startDate} to ${l.endDate}</div>
        <small class="badge bg-light text-dark border">${durationLabel}</small>
      </td>
      <td>
        ${
          l.attachmentName
            ? `<span class="badge bg-primary-subtle text-primary border" style="font-size: 0.72rem;">📎 ${esc(l.attachmentName)}</span>`
            : '<span class="text-muted" style="font-size:0.75rem;">None</span>'
        }
      </td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          ${stepsHtml}
        </div>
      </td>
      <td>
        <span class="badge status-badge ${l.status === "approved" ? "bg-success" : l.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}">
          ${l.status.toUpperCase()}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function removeDeclaredHoliday(idx) {
  leavesApp.removeDeclaredHoliday(idx);
}

function handleDeclareHoliday(e) {
  leavesApp.handleDeclareHoliday(e);
}

function onHrEmployeeSelected() {
  leavesApp.onHrEmployeeSelected();
}

function handleSaveEmployeeBalance(e) {
  leavesApp.handleSaveEmployeeBalance(e);
}

function populateHrEmployeeSelect() {
  const select = document.getElementById("hrEmployeeSelect");
  if (!select) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const t = leaveTranslations[lang] || leaveTranslations.en;

  const users =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
      ? window.DEMO_DATA.users
      : [];
  const prevVal = select.value;

  select.innerHTML = `<option value="">${t.chooseEmployee || (isAr ? "اختر موظفاً..." : "Choose an employee...")}</option>`;

  const roleNameMap = {
    medical_rep: isAr ? "مندوب طبي (Rep)" : "Medical Rep",
    rep: isAr ? "مندوب طبي (Rep)" : "Medical Rep",
    district_manager: isAr ? "مدير منطقة (DM)" : "District Manager (DM)",
    dm: isAr ? "مدير منطقة (DM)" : "District Manager (DM)",
    line_manager: isAr ? "مدير خط (LM)" : "Line Manager (LM)",
    lm: isAr ? "مدير خط (LM)" : "Line Manager (LM)",
    business_unit: isAr ? "رئيس قطاع (BU)" : "Business Unit Head (BU)",
    bu: isAr ? "رئيس قطاع (BU)" : "Business Unit Head (BU)",
    hr: isAr ? "موارد بشرية (HR)" : "HR",
    admin: isAr ? "مسؤول النظام (Admin)" : "Admin",
  };

  users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    const name = isAr && u.nameAr ? u.nameAr : u.name;
    const code = u.employeeCode || u.code || u.id;
    const roleTitle = roleNameMap[u.role] || u.role;
    opt.textContent = `${name} (${code}) - ${roleTitle}`;
    select.appendChild(opt);
  });

  if (prevVal && users.some((u) => u.id === prevVal)) {
    select.value = prevVal;
    if (typeof leavesApp.onHrEmployeeSelected === "function") {
      leavesApp.onHrEmployeeSelected();
    }
  } else {
    const annualInput = document.getElementById("hrAnnualDays");
    const casualInput = document.getElementById("hrCasualDays");
    const sickInput = document.getElementById("hrSickDays");
    const summaryEl = document.getElementById("hrEmployeeUsageSummary");
    if (annualInput) annualInput.value = 21;
    if (casualInput) casualInput.value = 6;
    if (sickInput) sickInput.value = 7;
    if (summaryEl) summaryEl.style.display = "none";
  }
}

function initHrBalanceControl() {
  populateHrEmployeeSelect();
}

Object.assign(leavesApp, {
  getApproverDisplayName(leave, level, lang) {
    return resolveApproverDisplayName(leave, level, lang);
  },

  handleDecisionStep(leaveId, decision) {
    try {
      const leave = demoLeaves.find((l) => l.id === leaveId);
      if (!leave) return;

      currentUser = (window.checkAuth && window.checkAuth()) || currentUser;
      const rawRole = (currentUser.role || "medical_rep").toLowerCase();
      const isDM = rawRole === "district_manager" || rawRole === "dm";
      const isLM = rawRole === "line_manager" || rawRole === "lm";
      const isHR = rawRole === "hr";
      const isAdmin = rawRole === "admin";

      const timestampStr = `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      if (!leave.approvals) {
        leave.approvals = {
          dm: {
            status: "approved",
            approverName: currentUser.name,
            updatedAt: timestampStr,
          },
          lm: { status: "pending", approverName: null, updatedAt: null },
          hr: { status: "pending", approverName: null, updatedAt: null },
        };
      }
      if (!leave.approvals.dm) leave.approvals.dm = { status: "approved" };
      if (!leave.approvals.lm) leave.approvals.lm = { status: "pending" };
      if (!leave.approvals.hr) leave.approvals.hr = { status: "pending" };

      const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

      if (decision === "rejected") {
        leave.status = "rejected";
        if (isDM) {
          leave.approvals.dm.status = "rejected";
          leave.approvals.dm.approverName = currentUser.name;
          leave.approvals.dm.updatedAt = timestampStr;
        }
        if (isLM) {
          leave.approvals.lm.status = "rejected";
          leave.approvals.lm.approverName = currentUser.name;
          leave.approvals.lm.updatedAt = timestampStr;
        }
        if (isHR || isAdmin) {
          if (leave.approvals.hr) {
            leave.approvals.hr.status = "rejected";
            leave.approvals.hr.approverName = currentUser.name;
            leave.approvals.hr.updatedAt = timestampStr;
          }
        }
        const rejMsg =
          lang === "ar" ? "تم رفض طلب الإجازة." : "Leave request rejected.";
        if (typeof showToast === "function") showToast(rejMsg, "warning");
        else if (typeof window.showToast === "function")
          window.showToast(rejMsg, "warning");
      } else {
        if (isDM) {
          leave.approvals.dm.status = "approved";
          leave.approvals.dm.approverName = currentUser.name;
          leave.approvals.dm.updatedAt = timestampStr;
          const msg =
            lang === "ar"
              ? "تم اعتماد الإجازة من مدير المنطقة وتحويلها لمدير الخط."
              : "Approved by District Manager. Forwarded to Line Manager.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        } else if (isLM) {
          leave.approvals.lm.status = "approved";
          leave.approvals.lm.approverName = currentUser.name;
          leave.approvals.lm.updatedAt = timestampStr;
          const msg =
            lang === "ar"
              ? "تم اعتماد الإجازة من مدير الخط وتحويلها لقسم الموارد البشرية."
              : "Approved by Line Manager. Forwarded to HR.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        } else if (isHR || isAdmin) {
          if (leave.approvals.hr) {
            leave.approvals.hr.status = "approved";
            leave.approvals.hr.approverName = currentUser.name;
            leave.approvals.hr.updatedAt = timestampStr;
          }
          leave.status = "approved";
          const msg =
            lang === "ar"
              ? "تم الاعتماد النهائي للإجازة وخصمها من الرصيد."
              : "Final approval granted by HR. Deducted from leave balance.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        }
      }

      if (window.DEMO_DATA) {
        window.DEMO_DATA.leaves = demoLeaves;
        if (typeof window.saveDataToStorage === "function")
          window.saveDataToStorage();
      }

      if (typeof calculateBalances === "function") calculateBalances();
      if (typeof renderPendingApprovals === "function")
        renderPendingApprovals();
      if (typeof renderHistory === "function") renderHistory();
      if (typeof renderHrAllLeaves === "function") renderHrAllLeaves();
    } catch (err) {
      console.error("Error in handleDecisionStep:", err);
    }
  },

  removeDeclaredHoliday(idx) {
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.publicHolidays)) {
      const removed = window.DEMO_DATA.publicHolidays.splice(idx, 1);
      if (window.saveDataToStorage) window.saveDataToStorage();
      if (typeof showToast === "function") {
        showToast(`Holiday "${removed[0]?.title || ""}" removed.`, "info");
      }
      renderDeclaredHolidaysList();
    }
  },

  handleDeclareHoliday(e) {
    e.preventDefault();
    const dateVal = document.getElementById("holidayDate").value;
    const nameVal = document.getElementById("holidayName").value.trim();
    const durationVal =
      document.querySelector('input[name="hrHolidayDuration"]:checked')
        ?.value || "full";

    if (!dateVal || !nameVal) {
      return showToast("Please enter both holiday date and title.", "warning");
    }

    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    if (!window.DEMO_DATA.publicHolidays) window.DEMO_DATA.publicHolidays = [];

    const existing = window.DEMO_DATA.publicHolidays.find(
      (h) => h.date === dateVal,
    );
    if (existing) {
      existing.title = nameVal;
      existing.duration = durationVal;
    } else {
      window.DEMO_DATA.publicHolidays.push({
        date: dateVal,
        title: nameVal,
        duration: durationVal,
      });
    }

    if (window.saveDataToStorage) window.saveDataToStorage();
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const isAr = lang === "ar";
    const durationLabel =
      durationVal === "half"
        ? isAr
          ? "نصف يوم"
          : "Half Day"
        : isAr
          ? "يوم كامل"
          : "Full Day";
    showToast(
      `Official Public Holiday "${nameVal}" (${durationLabel}) declared! Visible in company calendar.`,
      "success",
    );
    e.target.reset();
    const fullRadio = document.querySelector(
      'input[name="hrHolidayDuration"][value="full"]',
    );
    if (fullRadio) fullRadio.checked = true;
    renderDeclaredHolidaysList();
  },

  onHrEmployeeSelected() {
    const select = document.getElementById("hrEmployeeSelect");
    if (!select) return;
    const userId = select.value;
    const users =
      window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
        ? window.DEMO_DATA.users
        : [];
    const user = users.find((u) => u.id === userId);

    const annualInput = document.getElementById("hrAnnualDays");
    const casualInput = document.getElementById("hrCasualDays");
    const sickInput = document.getElementById("hrSickDays");
    const summaryEl = document.getElementById("hrEmployeeUsageSummary");

    if (!user) {
      if (summaryEl) summaryEl.style.display = "none";
      return;
    }

    const bal = user.leaveBalance || {
      annual: 21,
      casual: 6,
      emergency: 6,
      sick: 7,
    };
    const annualTotal = bal.annual !== undefined ? Number(bal.annual) : 21;
    const casualTotal =
      bal.emergency !== undefined
        ? Number(bal.emergency)
        : bal.casual !== undefined
          ? Number(bal.casual)
          : 6;
    const sickTotal = bal.sick !== undefined ? Number(bal.sick) : 7;

    if (annualInput) annualInput.value = annualTotal;
    if (casualInput) casualInput.value = casualTotal;
    if (sickInput) sickInput.value = sickTotal;

    const leavesList =
      window.DEMO_DATA && Array.isArray(window.DEMO_DATA.leaves)
        ? window.DEMO_DATA.leaves
        : demoLeaves;
    let used = { annual: 0, casual: 0, sick: 0 };
    leavesList.forEach((l) => {
      if (l.userId === user.id && l.status === "approved") {
        const d = parseFloat(l.days) || 1;
        if (l.type === "annual") used.annual += d;
        else if (l.type === "casual" || l.type === "emergency")
          used.casual += d;
        else if (l.type === "sick") used.sick += d;
      }
    });

    if (summaryEl) {
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
      const isAr = lang === "ar";
      const remAnnual = Math.max(0, annualTotal - used.annual);
      const remCasual = Math.max(0, casualTotal - used.casual);
      const remSick = Math.max(0, sickTotal - used.sick);
      const rawDisplayName = isAr && user.nameAr ? user.nameAr : user.name;
      const displayName = esc(rawDisplayName);
      const safeUserName = esc(user.name);

      summaryEl.style.display = "block";
      summaryEl.innerHTML = isAr
        ? `
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="fw-bold text-dark">ملخص استهلاك الإجازات لـ (${displayName}):</span>
          <div class="d-flex gap-2 flex-wrap">
            <span class="badge bg-primary-subtle text-primary border">اعتيادي: مستخدم ${used.annual} / متبقي ${remAnnual} من ${annualTotal}</span>
            <span class="badge bg-warning-subtle text-warning-emphasis border">عارضة: مستخدم ${used.casual} / متبقي ${remCasual} من ${casualTotal}</span>
            <span class="badge bg-info-subtle text-info-emphasis border">مرضي: مستخدم ${used.sick} / متبقي ${remSick} من ${sickTotal}</span>
          </div>
        </div>`
        : `
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="fw-bold text-dark">Leave Usage Snapshot for (${safeUserName}):</span>
          <div class="d-flex gap-2 flex-wrap">
            <span class="badge bg-primary-subtle text-primary border">Annual: ${used.annual} Used / ${remAnnual} Left of ${annualTotal}</span>
            <span class="badge bg-warning-subtle text-warning-emphasis border">Casual: ${used.casual} Used / ${remCasual} Left of ${casualTotal}</span>
            <span class="badge bg-info-subtle text-info-emphasis border">Sick: ${used.sick} Used / ${remSick} Left of ${sickTotal}</span>
          </div>
        </div>`;
    }
  },

  handleSaveEmployeeBalance(e) {
    e.preventDefault();
    const select = document.getElementById("hrEmployeeSelect");
    if (!select || !select.value) {
      const isAr = (window.getCurrentLang && window.getCurrentLang()) === "ar";
      return showToast(
        isAr
          ? "برجاء اختيار الموظف أولاً."
          : "Please select an employee first.",
        "warning",
      );
    }

    const userId = select.value;
    const annual = Math.max(
      0,
      parseInt(document.getElementById("hrAnnualDays").value, 10) || 0,
    );
    const casual = Math.max(
      0,
      parseInt(document.getElementById("hrCasualDays").value, 10) || 0,
    );
    const sick = Math.max(
      0,
      parseInt(document.getElementById("hrSickDays").value, 10) || 0,
    );

    const users =
      window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
        ? window.DEMO_DATA.users
        : [];
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    user.leaveBalance = {
      annual,
      casual,
      emergency: casual,
      sick,
      unpaid: (user.leaveBalance && user.leaveBalance.unpaid) || 0,
      maternity: (user.leaveBalance && user.leaveBalance.maternity) || 90,
    };

    if (currentUser && currentUser.id === userId) {
      currentUser.leaveBalance = { ...user.leaveBalance };
      calculateBalances();
    }

    try {
      const activeUserStr = sessionStorage.getItem("pharmaUser");
      if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        if (activeUser && activeUser.id === userId) {
          activeUser.leaveBalance = { ...user.leaveBalance };
          sessionStorage.setItem("pharmaUser", JSON.stringify(activeUser));
        }
      }
    } catch (err) {}

    if (window.saveDataToStorage) window.saveDataToStorage();

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const isAr = lang === "ar";
    const displayName = isAr && user.nameAr ? user.nameAr : user.name;
    showToast(
      isAr
        ? `تم حفظ وتحديث رصيد إجازات الموظف (${displayName}) بنجاح.`
        : `Leave balance updated for ${displayName} successfully.`,
      "success",
    );

    this.onHrEmployeeSelected();
  },

  renderHistory() {
    renderHistory();
  },

  renderPendingApprovals() {
    renderPendingApprovals();
  },

  calculateBalances() {
    calculateBalances();
  },

  initHrBalanceControl() {
    populateHrEmployeeSelect();
  },
});

window.leavesApp = leavesApp;

// Backward-compatible bindings for inline HTML event handlers & legacy callers
window.getApproverDisplayName = resolveApproverDisplayName;
window.handleDecisionStep = function (leaveId, decision) {
  leavesApp.handleDecisionStep(leaveId, decision);
};
window.removeDeclaredHoliday = function (idx) {
  leavesApp.removeDeclaredHoliday(idx);
};
window.handleDeclareHoliday = function (e) {
  leavesApp.handleDeclareHoliday(e);
};
window.onHrEmployeeSelected = function () {
  leavesApp.onHrEmployeeSelected();
};
window.handleSaveEmployeeBalance = function (e) {
  leavesApp.handleSaveEmployeeBalance(e);
};
window.initHrBalanceControl = function () {
  leavesApp.initHrBalanceControl();
};
window.initHrAllLeavesControl = initHrAllLeavesControl;
window.populateHrAllLeavesFilter = populateHrAllLeavesFilter;
window.renderHrAllLeaves = renderHrAllLeaves;

document.addEventListener("languageChanged", () => {
  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "medical_rep").toLowerCase();
  if (role === "hr" || role === "admin") {
    renderDeclaredHolidaysList();
    initHrBalanceControl();
    initHrAllLeavesControl();
    renderHrAllLeaves();
  }
  calculateBalances();
  renderHistory();
  renderPendingApprovals();
});