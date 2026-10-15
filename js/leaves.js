/**
 * @file leaves.js
 * @description Leaves Management Module supporting Multi-level Approvals (Rep -> DM -> LM -> HR),
 * Full/Half Day Duration, File Attachments, Dynamic Balance Deduction, and HR Public Holiday declarations.
 */

function resolveLeaveUserName(userId, fallback) {
  if (typeof window !== "undefined" && window.store && window.store.users && userId) {
    const u = window.store.users.getById(userId);
    if (u && u.name) return u.name;
  }
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.users && userId) {
    const u = window.DEMO_DATA.users.find(x => x.id === userId);
    if (u && u.name) return u.name;
  }
  return fallback;
}

function getLeaveApplicantName(leave) {
  if (!leave) return "Employee";
  if (leave.userId) {
    const name = resolveLeaveUserName(leave.userId, null);
    if (name) return name;
  }
  return leave.userName || "Employee";
}

// Master Leave Requests with 3-tier Approval Tracking
let demoLeaves = (window.store && window.store.leaves
  ? window.store.leaves.getAll()
  : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [
  {
    id: "l1",
    userId: "u1790626000001",
    userName: resolveLeaveUserName("u1790626000001", "Medical Rep"),
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
        approverId: "u1790626000014",
        approverName: resolveLeaveUserName("u1790626000014", "District Manager"),
        updatedAt: "2026-07-28 10:30 AM",
      },
      lm: {
        status: "approved",
        approverId: "u1790626000012",
        approverName: resolveLeaveUserName("u1790626000012", "Line Manager"),
        updatedAt: "2026-07-28 02:15 PM",
      },
      hr: {
        status: "approved",
        approverId: "u1790626000017",
        approverName: "HR Department",
        updatedAt: "2026-07-29 09:00 AM",
      },
    },
  },
  {
    id: "l2",
    userId: "u1790626000001",
    userName: resolveLeaveUserName("u1790626000001", "Medical Rep"),
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
      dm: { status: "pending", approverName: null, updatedAt: null },
      lm: { status: "pending", approverName: null, updatedAt: null },
      hr: { status: "pending", approverName: null, updatedAt: null },
    },
  },
  {
    id: "l3",
    userId: "u1790626000014",
    userName: resolveLeaveUserName("u1790626000014", "District Manager"),
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
      lm: { status: "pending", approverName: null, updatedAt: null },
      hr: { status: "pending", approverName: null, updatedAt: null },
    },
  },
];

const leaveTranslations = {
  en: {
    pageTitle: "Leaves Management",
    pageSubtitle: "Submit, track multi-level approvals, and manage balances",
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
    pendingApprovals: "Pending Requests Requiring Decision",
    approve: "Approve",
    reject: "Reject",
    modalRejectLeaveTitle: "Reject Leave Request",
    modalRejectLeaveSubtitle: "You can provide an optional rejection reason or guidance for the employee.",
    modalRejectLeaveReasonLabel: "Rejection Reason / Guidance (Optional):",
    btnConfirmRejectLeave: "Confirm Rejection",
    rejectionReasonLabel: "Reason:",
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
};

if (window.translations) {
  if (window.translations.en)
    Object.assign(window.translations.en, leaveTranslations.en);
}

let currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};

const getSysLang = () => (window.getCurrentLang && window.getCurrentLang()) || "en";
const getSysToday = () => (window.getSystemTodayStr && window.getSystemTodayStr()) || (new Date()).toISOString().slice(0, 10);

function formatLeaveDurationText(l, lang) {
  if (l.dayDuration === "half") {
    return "Half Day";
  }
  const count = parseFloat(l.days) || 1;
  return count === 1 ? "1 Day" : `${count} Days`;
}


function formatLeaveDateDisplay(startDate, endDate, lang) {
  if (!startDate) return "";
  if (!endDate || startDate === endDate) {
    return `<div class="leave-date-single">
      <span class="leave-date-value">${startDate}</span>
    </div>`;
  }
  const fromLabel = "From:";
  const toLabel = "To:";
  return `<div class="leave-date-range-block">
    <div class="leave-date-row">
      <span class="leave-date-prefix">${fromLabel}</span>
      <span class="leave-date-value">${startDate}</span>
    </div>
    <div class="leave-date-row">
      <span class="leave-date-prefix">${toLabel}</span>
      <span class="leave-date-value">${endDate}</span>
    </div>
  </div>`;
}

function formatLeaveUserRole(role, lang) {
  const r = (role || "").toLowerCase();
  if (r === "medical_rep" || r === "rep") {
    return "Medical Rep";
  }
  if (r === "district_manager" || r === "dm") {
    return "District Manager";
  }
  if (r === "line_manager" || r === "lm") {
    return "Line Manager";
  }
  if (r === "admin" || r === "hr") {
    return "HR / Admin";
  }
  return role || "Staff";
}

let activeRejectLeaveId = null;

function openRejectLeaveModal(leaveId) {
  activeRejectLeaveId = leaveId;
  const modal = document.getElementById("rejectLeaveModal");
  if (modal) {
    const reasonInput = document.getElementById("rejectLeaveReasonText");
    if (reasonInput) reasonInput.value = "";
    modal.classList.add("active");
  }
}

function closeRejectLeaveModal() {
  activeRejectLeaveId = null;
  const modal = document.getElementById("rejectLeaveModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function confirmRejectLeave() {
  if (!activeRejectLeaveId) return;
  const reasonInput = document.getElementById("rejectLeaveReasonText");
  const rejectionReason = reasonInput ? reasonInput.value.trim() : "";
  const leaveIdToReject = activeRejectLeaveId;
  closeRejectLeaveModal();
  handleDecisionStep(leaveIdToReject, "rejected", rejectionReason);
}

window.openRejectLeaveModal = openRejectLeaveModal;
window.closeRejectLeaveModal = closeRejectLeaveModal;
window.confirmRejectLeave = confirmRejectLeave;

function initLeaves() {
  if (window.translations) {
    if (window.translations.en)
      Object.assign(window.translations.en, leaveTranslations.en);
    
  }
  if (window.initPage) {
    window.initPage("leaves");
  }
  if (typeof window.applyTranslations === "function") {
    window.applyTranslations();
  }
  currentUser = (window.checkAuth && window.checkAuth()) || currentUser;

  // Sanitize stored leaves: District Managers cannot self-approve their own leave requests
  if (Array.isArray(demoLeaves)) {
    let changed = false;
    demoLeaves.forEach((lv) => {
      const isDM = lv.userRole === "district_manager" || lv.userRole === "dm" || lv.userId === "u1790626000014";
      if (isDM && lv.approvals && lv.approvals.dm) {
        delete lv.approvals.dm;
        changed = true;
      }
    });
    if (changed) {
      if (window.DEMO_DATA) window.DEMO_DATA.leaves = demoLeaves;
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    }
  }

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

  const todayStr = getSysToday();
  if (startInput && !startInput.value) {
    startInput.value = todayStr;
  }
  if (endInput && !endInput.value) {
    endInput.value = todayStr;
    endInput.min = startInput ? startInput.value : todayStr;
  }

  [startInput, endInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("click", () => {
      try {
        if (typeof input.showPicker === "function") {
          input.showPicker();
        }
      } catch (e) {}
    });
  });

  startInput?.addEventListener("change", () => {
    if (endInput) {
      endInput.min = startInput.value;
      if (endInput.value && endInput.value < startInput.value) {
        endInput.value = startInput.value;
      }
    }
    calcDays();
  });
  endInput?.addEventListener("change", calcDays);

  calcDays();

  document.getElementById("leaveForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const type = document.getElementById("leaveType").value;
    const durationType =
      document.querySelector('input[name="leaveDurationType"]:checked')
        ?.value || "full";
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const reason = document.getElementById("reason").value;

    if (!startDate || !endDate) {
      return showToast(
        "Please specify both start and end dates for the leave.",
        "warning",
      );
    }

    if (endDate < startDate) {
      return showToast(
        "End date must be on or after start date.",
        "warning",
      );
    }

    // Overlap Check: Prevent submitting overlapping leaves (approved or pending)
    const effectiveReqStart = startDate;
    const effectiveReqEnd = durationType === "half" ? startDate : endDate;

    const overlappingLeave = (demoLeaves || []).find((l) => {
      if (l.userId !== currentUser.id) return false;
      if (l.status === "rejected") return false;
      const lStart = l.startDate || l.endDate;
      const lEnd = l.endDate || l.startDate;
      if (!lStart || !lEnd) return false;
      return effectiveReqStart <= lEnd && effectiveReqEnd >= lStart;
    });

    if (overlappingLeave) {
      const typeNamesEn = {
        annual: "Annual",
        casual: "Casual",
        sick: "Sick",
        emergency: "Casual",
        unpaid: "Unpaid",
      };
      const statusLabelsEn = {
        approved: "Approved",
        pending: "Pending Approval",
      };

      const oType = typeNamesEn[overlappingLeave.type] || overlappingLeave.type;
      const oStatus = statusLabelsEn[overlappingLeave.status] || overlappingLeave.status;

      const oStart = overlappingLeave.startDate || overlappingLeave.endDate;
      const oEnd = overlappingLeave.endDate || overlappingLeave.startDate;

      const msg = `⚠️ You already have a leave request (${oStatus}: ${oType}) from ${oStart} to ${oEnd}. Cannot submit overlapping requests.`;

      return showToast(msg, "warning");
    }

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
      return showToast(
        "The selected dates are already official public holidays and do not require leave deduction.",
        "info",
      );
    }

    // Labor Law & Pharma Policy Check: Casual Leave cannot exceed 2 consecutive days per request
    if ((type === "casual" || type === "emergency") && calculatedDays > 2) {
      return showToast(
        "⚠️ Casual leave cannot exceed 2 consecutive days per request. Please submit as Annual Leave for longer periods.",
        "warning",
      );
    }

    // Balance Check: Verify that requested days do not exceed remaining leave balance for (Annual / Sick / Casual)
    const trackedBalanceTypes = ["annual", "casual", "sick", "emergency"];
    if (trackedBalanceTypes.includes(type)) {
      const allUsers =
        window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
          ? window.DEMO_DATA.users
          : [];
      const userObj = allUsers.find((u) => u.id === currentUser.id) || currentUser;
      const userBalance = userObj.leaveBalance || currentUser.leaveBalance || {};

      let balKey = type;
      if (type === "casual" || type === "emergency") {
        balKey = "emergency";
      }

      const rollover = balKey === "annual" ? getEmployeeLeaveRollover(currentUser.id) : { isValid: false, carriedOver: 0 };
      const activeRollover = rollover.isValid ? rollover.carriedOver : 0;

      const total =
        balKey === "annual"
          ? ((userBalance.annual !== undefined ? Number(userBalance.annual) : 21) + activeRollover)
          : balKey === "sick"
            ? (userBalance.sick !== undefined ? Number(userBalance.sick) : 7)
            : userBalance.emergency !== undefined
              ? Number(userBalance.emergency)
              : userBalance.casual !== undefined
                ? Number(userBalance.casual)
                : 6;

      let approvedUsed = 0;
      let pendingUsed = 0;

      (demoLeaves || []).forEach((l) => {
        if (l.userId === currentUser.id && l.status !== "rejected") {
          const d = parseFloat(l.days) || 1;
          const isMatch =
            (balKey === "annual" && l.type === "annual") ||
            (balKey === "sick" && l.type === "sick") ||
            (balKey === "emergency" && (l.type === "casual" || l.type === "emergency"));

          if (isMatch) {
            if (l.status === "approved") {
              approvedUsed += d;
            } else if (l.status === "pending") {
              pendingUsed += d;
            }
          }
        }
      });

      const remainingBalance = Math.max(0, total - approvedUsed);
      const availableBalance = Math.max(0, remainingBalance - pendingUsed);

      const typeDisplayNamesEn = {
        annual: "Annual Leave",
        casual: "Casual Vacation",
        emergency: "Casual Vacation",
        sick: "Sick Leave",
      };

      const typeName = typeDisplayNamesEn[type] || type;
      const formatDays = (num) => (num === 1 ? "1 day" : `${num} days`);

      if (calculatedDays > remainingBalance) {
        const msg = `⚠️ Sorry, your remaining balance for ${typeName} (${formatDays(remainingBalance)}) is not enough for (${formatDays(calculatedDays)}).`;
        return showToast(msg, "warning");
      }

      if (calculatedDays > availableBalance) {
        const msg = `⚠️ Sorry, your available balance for ${typeName} is (${formatDays(availableBalance)}) due to (${formatDays(pendingUsed)}) in pending requests. Cannot request (${formatDays(calculatedDays)}).`;
        return showToast(msg, "warning");
      }
    }

    const userRole = (currentUser.role || "medical_rep").toLowerCase();
    let initialApprovals = {};

    const lvsWf = (window.WorkflowEngine && typeof window.WorkflowEngine.getWorkflows === "function")
      ? window.WorkflowEngine.getWorkflows().leaves
      : { requireDm: true, requireLm: true, requireBu: false, requireHr: true };

    const requireDm = lvsWf.requireDm !== false;
    const requireLm = lvsWf.requireLm !== false;
    const requireBu = !!lvsWf.requireBu;

    if (userRole === "medical_rep" || userRole === "rep") {
      initialApprovals = {};
      if (requireDm) initialApprovals.dm = { status: "pending", approverName: null, updatedAt: null };
      if (requireLm) initialApprovals.lm = { status: "pending", approverName: null, updatedAt: null };
      if (requireBu) initialApprovals.bu = { status: "pending", approverName: null, updatedAt: null };
      initialApprovals.hr = { status: "pending", approverName: null, updatedAt: null };
    } else if (userRole === "district_manager" || userRole === "dm") {
      initialApprovals = {};
      if (requireLm) initialApprovals.lm = { status: "pending", approverName: null, updatedAt: null };
      if (requireBu) initialApprovals.bu = { status: "pending", approverName: null, updatedAt: null };
      initialApprovals.hr = { status: "pending", approverName: null, updatedAt: null };
    } else if (userRole === "line_manager" || userRole === "lm") {
      initialApprovals = {};
      if (requireBu) initialApprovals.bu = { status: "pending", approverName: null, updatedAt: null };
      initialApprovals.hr = { status: "pending", approverName: null, updatedAt: null };
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

    if (typeof window.addWorkflowNotification === "function" && currentUser.managerId) {
      window.addWorkflowNotification({
        userId: currentUser.managerId,
        type: "leave_submission",
        title: "New Leave Request for Review",
        message: `${currentUser.name} submitted a leave request (${type}) for ${calculatedDays} days.`,
        link: "leaves.html",
        icon: "🏖️",
        badgeClass: "bg-warning",
        actorName: currentUser.name,
        action: "submitted",
      });
    }

    showToast(
      "Leave request submitted for multi-level approval successfully!",
      "success",
    );
    e.target.reset();
    document.getElementById("daysCount").value = "1 Day";
    const holidayNotice = document.getElementById("leaveHolidayNotice");
    if (holidayNotice) holidayNotice.classList.add("d-none");
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
    if (durationType === "half") {
      daysCountInput.value = "Half Day";
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

  if (durationType === "half") {
    if (daysCount) daysCount.value = "Half Day";
    if (holidayNotice) holidayNotice.classList.add("d-none");
    return;
  }

  const start = document.getElementById("startDate")?.value || "";
  const end = document.getElementById("endDate")?.value || "";

  if (start && end) {
    const res = resolveLeaveDaysDetailed(start, end);
    const days = res.totalDays;
    const daysWord = days === 1 ? "Day" : "Days";

    if (daysCount) daysCount.value = `${days} ${daysWord}`;

    if (holidayNotice) {
      const noticeParts = [];
      if (res.excludedFridays > 0) {
        noticeParts.push(
          `🕌 ${res.excludedFridays} Friday(s) excluded (statutory paid rest day)`
        );
      }
      if (res.excludedThursdays > 0) {
        const companySettings = (window.store && window.store.companySettings ? window.store.companySettings.get() : {}) || {};
        const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
        const secDayName = secDay === "saturday" ? "Saturday(s)" : (secDay === "thursday" ? "Thursday(s)" : "Weekly rest day(s)");
        noticeParts.push(
          `📅 ${res.excludedThursdays} ${secDayName} excluded (company weekly rest day)`
        );
      }
      if (res.excludedHolidays.length > 0) {
        const titles = res.excludedHolidays
          .map((h) => {
            const durLabel = h.duration === "half" ? "Half Day" : "Full Day";
            return `<strong>${window.escapeHtml(h.title)}</strong> (${window.escapeHtml(h.date)} - ${durLabel})`;
          })
          .join(", ");
        noticeParts.push(
          `🌴 <strong>Official holidays:</strong> ${titles}`
        );
      }

      if (noticeParts.length > 0) {
        holidayNotice.classList.remove("d-none");
        holidayNotice.innerHTML = noticeParts.join("<br>");
      } else {
        holidayNotice.classList.add("d-none");
      }
    }
  } else {
    if (holidayNotice) holidayNotice.classList.add("d-none");
  }
}

/**
 * Resolves leave days and detects any overlapping official public holidays and weekly rest days.
 * Excludes official public holidays and Fridays (statutory paid weekly rest) from deductible leave days.
 * If a public holiday is half day, 0.5 is deducted instead of 1.0.
 */
function resolveLeaveDaysDetailed(start, end) {
  if (!start || !end) return { totalDays: 1, excludedHolidays: [], excludedFridays: 0, excludedThursdays: 0 };

  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()))
    return { totalDays: 1, excludedHolidays: [], excludedFridays: 0, excludedThursdays: 0 };

  const startD = s <= e ? s : e;
  const endD = s <= e ? e : s;

  const publicHolidays =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.publicHolidays)
      ? window.DEMO_DATA.publicHolidays
      : [];

  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
  const secDay = companySettings.secondaryWeekendDay || (companySettings.isThursdayWeekend ? "thursday" : "none");
  const secMode = companySettings.secondaryWeekendMode || "full_day";

  let count = 0;
  const excludedHolidays = [];
  let excludedFridays = 0;
  let excludedSecondaryDays = 0;

  const cur = new Date(startD);
  while (cur <= endD) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = cur.getDay(); // 0: Sun, 1: Mon, ..., 4: Thu, 5: Fri, 6: Sat
    const isFriday = dayOfWeek === 5;
    const isSecondary = (secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4);

    const holidayMatch = publicHolidays.find((h) => h.date === dateStr);
    if (holidayMatch) {
      excludedHolidays.push(holidayMatch);
      if (holidayMatch.duration === "half") {
        count += 0.5;
      }
    } else if (isFriday) {
      excludedFridays++;
    } else if (isSecondary) {
      if (secMode === "full_day") {
        excludedSecondaryDays++;
      } else {
        // PM Only weekend: morning is a working day, so deducting 0.5 day
        count += 0.5;
        excludedSecondaryDays += 0.5;
      }
    } else {
      count += 1;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return {
    totalDays: count,
    excludedHolidays,
    excludedFridays,
    excludedThursdays: excludedSecondaryDays,
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
    managerSection.classList.toggle("d-none", !isManager);
  }

  const hrHolidaySection = document.getElementById("hrHolidaySection");
  if (hrHolidaySection) {
    const isHrOrAdmin = role === "hr" || role === "admin";
    hrHolidaySection.classList.toggle("d-none", !isHrOrAdmin);
    if (isHrOrAdmin) {
      try {
        renderDeclaredHolidaysList();
        initHrBalanceControl();
      } catch (err) {
        console.error("Error in HR holiday/balance control:", err);
      }
    }
  }

  const hrAllLeavesSection = document.getElementById("hrAllLeavesSection");
  if (hrAllLeavesSection) {
    const isHrOrAdmin = role === "hr" || role === "admin";
    hrAllLeavesSection.classList.toggle("d-none", !isHrOrAdmin);
    if (isHrOrAdmin) {
      try {
        initHrAllLeavesControl();
        renderHrAllLeaves();
      } catch (err) {
        console.error("Error in HR all leaves section:", err);
      }
    }
  }

  try {
    renderHistory();
  } catch (err) {
    console.error("Error in renderHistory:", err);
  }

  if (isManager) {
    try {
      renderPendingApprovals();
    } catch (err) {
      console.error("Error in renderPendingApprovals:", err);
    }
  }
}

/**
/**
 * Dynamically computes employee rollover balance from previous year based on companySettings.
 * (Delegated to centralized utility in app.js)
 */
function getEmployeeLeaveRollover(userId, targetYear) {
  return window.getEmployeeLeaveRollover
    ? window.getEmployeeLeaveRollover(userId, targetYear)
    : {
      initialCarriedOver: 0,
      consumedFromRollover: 0,
      remainingRollover: 0,
      carriedOver: 0,
      isValid: false,
      isExpired: false,
      expiryDate: null,
      maxCap: 0,
      graceMonths: 0,
      consumedFromNewAnnual: 0,
    };
}

/**
 * Dynamically computes and updates leave balances based on approved leaves.
 * Real-world policy: Approved leaves are only deducted from 'Used' once their start date has actually arrived.
 * FIFO Rule: Leaves taken in the new year consume carried-over balance FIRST before deducting from new year quota.
 */
function calculateBalances() {
  const allUsers =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
      ? window.DEMO_DATA.users
      : [];
  const userObj = allUsers.find((u) => u.id === currentUser.id) || currentUser;
  const userBalance = userObj.leaveBalance || currentUser.leaveBalance || {};
  const rollover = getEmployeeLeaveRollover(currentUser.id);
  const baseAnnual = userBalance.annual !== undefined ? Number(userBalance.annual) : 21;

  const isWithinGrace = rollover.isValid;
  const activeAnnualTotal = isWithinGrace ? (baseAnnual + rollover.initialCarriedOver) : baseAnnual;

  const totals = {
    annual: activeAnnualTotal,
    sick: userBalance.sick !== undefined ? Number(userBalance.sick) : 7,
    emergency:
      userBalance.emergency !== undefined
        ? Number(userBalance.emergency)
        : userBalance.casual !== undefined
          ? Number(userBalance.casual)
          : 6,
  };
  let used = { annual: 0, sick: 0, emergency: 0 };
  let pendingCounts = { annual: 0, sick: 0, emergency: 0 };

  const allLeaves =
    (window.store && window.store.leaves
      ? window.store.leaves.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || demoLeaves;

  const currentYearStr = String(new Date().getFullYear());

  allLeaves.forEach((l) => {
    if (l.userId === currentUser.id) {
      const leaveYear = l.startDate ? String(l.startDate).slice(0, 4) : "";
      if (leaveYear && leaveYear !== currentYearStr) return;
      const d = parseFloat(l.days) || 1;
      if (l.status === "approved") {
        if (l.type === "annual") {
          used.annual += d;
        } else if (l.type === "casual" || l.type === "emergency") {
          used.emergency += d;
        } else if (l.type === "sick") {
          used.sick += d;
        }
      } else if (l.status === "pending") {
        if (l.type === "annual") {
          pendingCounts.annual += d;
        } else if (l.type === "casual" || l.type === "emergency") {
          pendingCounts.emergency += d;
        } else if (l.type === "sick") {
          pendingCounts.sick += d;
        }
      }
    }
  });

  // After grace period ends, any days paid from rollover are NOT charged against the new annual quota
  if (!isWithinGrace && rollover.initialCarriedOver > 0) {
    used.annual = rollover.consumedFromNewAnnual;
  }

  const badgeEl = document.getElementById("annualRolloverBadge");
  if (badgeEl) {
    if (rollover.isValid && rollover.initialCarriedOver > 0) {
      badgeEl.classList.remove("d-none");
      const remainingMsgEn = rollover.consumedFromRollover > 0
        ? `${rollover.remainingRollover} left of ${rollover.initialCarriedOver} (${rollover.consumedFromRollover} consumed first)`
        : `+${rollover.initialCarriedOver} days`;

      badgeEl.innerHTML = `
        <div class="mt-2 pt-2 border-top rollover-border-active">
          <div class="p-2 rounded-3 rollover-banner-active">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold text-success-emphasis d-flex align-items-center gap-1">
                <i class="bi bi-arrow-repeat"></i> Carried Over (Deducted First):
              </span>
              <span class="badge bg-success text-white fw-bold px-2 py-1">${remainingMsgEn}</span>
            </div>
            <div class="text-danger fw-semibold d-flex align-items-center gap-1 rollover-expiry-countdown">
              <i class="bi bi-hourglass-split"></i> Expires on: ${rollover.expiryDate}
            </div>
          </div>
        </div>`;
    } else if (rollover.isExpired) {
      badgeEl.classList.remove("d-none");
      badgeEl.innerHTML = `
        <div class="mt-2 pt-2 border-top rollover-border-expired">
          <div class="p-2 rounded-3 rollover-banner-expired">
            <div class="d-flex justify-content-between align-items-center">
              <span class="rollover-expired-label"><i class="bi bi-clock-history me-1"></i>Rollover expired (${rollover.remainingRollover}d forfeited)</span>
              <span class="fw-semibold rollover-expiry-date">${rollover.expiryDate}</span>
            </div>
          </div>
        </div>`;
    } else {
      badgeEl.classList.add("d-none");
    }
  }

  ["annual", "sick", "emergency"].forEach((type) => {
    const rem = Math.max(0, totals[type] - used[type]);
    const elRem = document.getElementById(`${type}Remaining`);
    const elUsed = document.getElementById(`${type}Used`);
    const elTotal = document.getElementById(`${type}Total`);
    const elProg = document.getElementById(`${type}Progress`);
    const elPending = document.getElementById(`${type}PendingNote`);

    if (elRem) elRem.textContent = rem;
    if (elUsed) elUsed.textContent = used[type];
    if (elTotal) elTotal.textContent = totals[type];
    if (elProg)
      elProg.style.width = `${Math.min(100, (used[type] / totals[type]) * 100)}%`;

    if (elPending) {
      if (pendingCounts[type] > 0) {
        elPending.textContent = `(${pendingCounts[type]} pending)`;
        elPending.className = "ms-1 badge bg-warning-subtle text-warning border leave-pending-chip";
      } else {
        elPending.textContent = "";
        elPending.className = "";
      }
    }
  });
}


/**
 * Resolves the actual manager/approver display name for a specific approval tier.
 */
function resolveApproverDisplayName(leave, level, lang) {
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const app = (leave && leave.approvals && leave.approvals[level]) || {};

  if (app.approverId) {
    const foundById = allUsers.find((u) => u && u.id === app.approverId);
    if (foundById && foundById.name) {
      return foundById.name;
    }
  }

  if (app.approverName && typeof app.approverName === "string") {
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
          (u && u.name && u.name.toLowerCase() === clean.toLowerCase()) ||
          (u && u.nameAr && u.nameAr === clean),
      );
      if (foundUser) {
        return foundUser.name;
      }
      return clean;
    }
  }

  const applicantUser = allUsers.find((u) => u && u.id === leave.userId) || {};

  if (level === "dm") {
    const dmUser = allUsers.find((u) => u && u.id === applicantUser.managerId);
    if (dmUser) {
      return dmUser.name;
    }
    return "District Manager";
  }

  if (level === "lm") {
    let lmUser = null;
    if (
      applicantUser.role === "district_manager" ||
      applicantUser.role === "dm"
    ) {
      lmUser = allUsers.find((u) => u && u.id === applicantUser.managerId);
    } else {
      const dmUser = allUsers.find((u) => u && u.id === applicantUser.managerId);
      if (dmUser && dmUser.managerId) {
        lmUser = allUsers.find((u) => u && u.id === dmUser.managerId);
      }
    }
    if (lmUser) {
      return lmUser.name;
    }
    return "Line Manager";
  }

  if (level === "bu") {
    let buUser = allUsers.find((u) => u && (u.role === "business_unit" || u.role === "bu"));
    if (buUser) {
      return buUser.name;
    }
    return "Business Unit Head";
  }

  if (level === "hr") {
    const hrUser = allUsers.find((u) => u && (u.role === "hr" || u.role === "HR"));
    if (hrUser) {
      return hrUser.name;
    }
    return "HR Department";
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
    const durationLabel = formatLeaveDurationText(l, lang);

    const app = l.approvals || {};
    let stepsHtml = "";

    const dmName = getApproverDisplayName(l, "dm", lang);
    const lmName = getApproverDisplayName(l, "lm", lang);
    const buName = getApproverDisplayName(l, "bu", lang);
    const hrName = getApproverDisplayName(l, "hr", lang);

    if (app.dm && app.dm.status) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.dm.status}">
            ${window.escapeHtml(dmName)}: ${(app.dm.status || "").toUpperCase()} ${app.dm.updatedAt ? `(${app.dm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.lm && app.lm.status) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.lm.status}">
            ${window.escapeHtml(lmName)}: ${(app.lm.status || "").toUpperCase()} ${app.lm.updatedAt ? `(${app.lm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.bu && app.bu.status) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.bu.status}">
            ${window.escapeHtml(buName)}: ${(app.bu.status || "").toUpperCase()} ${app.bu.updatedAt ? `(${app.bu.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.hr && app.hr.status) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.hr.status}">
            ${window.escapeHtml(hrName)}: ${(app.hr.status || "").toUpperCase()} ${app.hr.updatedAt ? `(${app.hr.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    const todayStr = getSysToday();
    const isFuture = l.startDate && l.startDate > todayStr;
    const canDelete = (l.status === "pending" || (l.status === "approved" && isFuture)) && (l.userId === currentUser.id || currentUser.role === "admin");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong class="leave-item-title">${typeLabel}</strong>
      </td>
      <td>
        <div class="d-flex flex-column align-items-start gap-1">
          ${formatLeaveDateDisplay(l.startDate, l.endDate, lang)}
          <span class="badge duration-badge mt-1">${durationLabel}</span>
        </div>
      </td>
      <td>
        ${
          l.attachmentName
            ? `<span class="badge bg-primary-subtle text-primary border attachment-badge-tag">📎 ${window.escapeHtml(l.attachmentName)}</span>`
            : '<span class="text-muted small">None</span>'
        }
      </td>
      <td>
        <div class="approval-steps-flow">
          ${stepsHtml}
        </div>
      </td>
      <td>
        <div class="d-flex flex-column align-items-start gap-1">
          <span class="badge status-badge ${l.status === "approved" ? "bg-success" : l.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}">
            ${(l.status || "").toUpperCase()}
          </span>
          ${
            canDelete
              ? `<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 mt-1 leave-delete-btn" onclick="deleteMyLeave('${l.id}')">
                   <i class="bi bi-trash3 me-1"></i>Delete
                 </button>`
              : ""
          }
          ${
            l.status === "rejected" && l.rejectionReason
              ? `<div class="mt-1 small text-danger rejection-reason-box" title="${window.escapeHtml(l.rejectionReason)}">
                   <i class="bi bi-chat-left-text me-1"></i><strong>Reason:</strong> ${window.escapeHtml(l.rejectionReason)}
                 </div>`
              : ""
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteMyLeave = function(leaveId) {
  const todayStr = getSysToday();

  const idx = demoLeaves.findIndex((l) => l.id === leaveId);
  if (idx < 0) return;
  const l = demoLeaves[idx];

  const isFuture = l.startDate && l.startDate > todayStr;
  const canDelete = l.status === "pending" || (l.status === "approved" && isFuture) || currentUser.role === "admin";

  if (!canDelete) {
    showToast(
      "Cannot delete an approved leave that has already started or passed.",
      "warning"
    );
    return;
  }

  const confirmMsg = l.status === "approved"
    ? "Are you sure you want to cancel and delete this approved leave? The days will remain in your balance."
    : "Are you sure you want to delete this leave request?";

  if (!confirm(confirmMsg)) return;

  demoLeaves.splice(idx, 1);
  if (window.store && window.store.leaves && typeof window.store.leaves.delete === "function") {
    window.store.leaves.delete(leaveId);
  }
  window.DEMO_DATA.leaves = demoLeaves;
  if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();

  renderHistory();
  calculateBalances();

  showToast(
    "Leave deleted successfully and balance updated.",
    "success"
  );
};

function renderPendingApprovals() {
  const container = document.getElementById("pendingApprovalsContainer");
  if (!container) return;
  container.replaceChildren();

  currentUser = (window.checkAuth && window.checkAuth()) || currentUser;
  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "medical_rep").toLowerCase().replace(/\s+/g, "_");

  const allLeaves =
    (window.store && window.store.leaves
      ? window.store.leaves.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || demoLeaves;

  const pending = allLeaves.filter((l) => {
    if (!l || l.status === "rejected" || l.status === "approved") return false;
    const app = l.approvals || {};

    const hrStatus = (app.hr && app.hr.status ? app.hr.status : "").toLowerCase();
    const lmStatus = (app.lm && app.lm.status ? app.lm.status : "").toLowerCase();
    const dmStatus = (app.dm && app.dm.status ? app.dm.status : "").toLowerCase();

    const buStatus = (app.bu && app.bu.status ? app.bu.status : "").toLowerCase();
    const lvsWf = (window.WorkflowEngine && typeof window.WorkflowEngine.getWorkflows === "function")
      ? window.WorkflowEngine.getWorkflows().leaves
      : { requireLm: true, requireBu: false };
    const requireBu = !!(lvsWf && lvsWf.requireBu);
    const requireLm = lvsWf && lvsWf.requireLm !== false;

    // HR and Admin have organization-wide authority to review pending approvals
    if (role === "hr" || role === "admin") {
      let upperApproved = true;
      if (requireBu && app.bu) {
        upperApproved = (app.bu.status === "approved" || app.bu.status === "skipped");
      } else if (requireLm && app.lm) {
        upperApproved = (app.lm.status === "approved" || app.lm.status === "skipped");
      } else if (app.dm) {
        upperApproved = (app.dm.status === "approved");
      }

      return hrStatus === "pending" && upperApproved;
    }

    // BU Manager approval check
    if (role === "business_unit" || role === "bu") {
      if (!requireBu) return false;
      if (typeof window.canApproveFor === "function" && !window.canApproveFor(l.userId)) {
        return false;
      }
      const prevApproved = requireLm && app.lm ? (lmStatus === "approved" || lmStatus === "skipped") : (app.dm ? dmStatus === "approved" : true);
      return buStatus === "pending" && prevApproved;
    }

    // Verify applicant is in current manager's hierarchy to prevent unauthorized approvals
    let isSubordinate = false;
    if (typeof window.canApproveFor === "function" && window.canApproveFor(l.userId)) {
      isSubordinate = true;
    } else {
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const applicant = allUsers.find((u) => u && u.id === l.userId);
      if (applicant && (applicant.managerId === currentUser.id || applicant.dmId === currentUser.id || applicant.districtManagerId === currentUser.id)) {
        isSubordinate = true;
      }
    }

    if (!isSubordinate) return false;

    if (role === "district_manager" || role === "dm") {
      return dmStatus === "pending";
    }
    if (role === "line_manager" || role === "lm") {
      return (
        lmStatus === "pending" &&
        (app.dm ? dmStatus === "approved" : true)
      );
    }
    return false;
  });

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  if (pending.length === 0) {
    container.innerHTML = `<p class="text-muted">${leaveTranslations[lang].noPending}</p>`;
    return;
  }

  pending.forEach((l) => {
    const card = document.createElement("div");
    card.className = "card border-0 mb-3 pending-approval-card shadow-sm";

    const typeKey = (l.type || "annual") + "Leave";
    const typeLabel = leaveTranslations[lang]?.[typeKey] || (l.type ? l.type.toUpperCase() : "ANNUAL");
    const durationLabel = formatLeaveDurationText(l, lang);
    const roleLabel = formatLeaveUserRole(l.userRole, lang);

    card.innerHTML = `
      <div class="card-body p-3">
        <div class="approval-header-row mb-3">
          <div class="approval-user-info">
            <div class="approval-user-avatar">
              ${(getLeaveApplicantName(l) || "U").charAt(0).toUpperCase()}
            </div>
            <div class="approval-user-details">
              <div class="approval-user-name">${window.escapeHtml(getLeaveApplicantName(l))}</div>
              <div class="approval-user-role">${window.escapeHtml(roleLabel)}</div>
            </div>
          </div>
          <div class="approval-badge-wrap">
            <span class="badge approval-type-badge">${typeLabel}</span>
          </div>
        </div>

        <div class="approval-meta-grid mb-3">
          <div class="approval-meta-item">
            <span class="approval-meta-label"><i class="bi bi-calendar-event me-1"></i>Dates</span>
            <div class="approval-meta-val">
              ${formatLeaveDateDisplay(l.startDate, l.endDate, lang)}
            </div>
          </div>
          <div class="approval-meta-item">
            <span class="approval-meta-label"><i class="bi bi-clock me-1"></i>Duration</span>
            <span class="badge duration-badge">${durationLabel}</span>
          </div>
        </div>

        <div class="approval-reason-box mb-3">
          <div class="approval-reason-header">
            <i class="bi bi-chat-left-quote me-1"></i>
            <span>Reason</span>
          </div>
          <div class="approval-reason-content leave-reason-text"></div>
        </div>

        ${
          l.attachmentName
            ? `<div class="mb-3">
                 <span class="approval-attachment-pill">
                   <i class="bi bi-paperclip me-1"></i>${window.escapeHtml(l.attachmentName)}
                 </span>
               </div>`
            : ""
        }

        <div class="approval-actions-row">
          <button type="button" class="btn btn-sm btn-success approval-btn" onclick="window.handleDecisionStep('${l.id}', 'approved')">
            <i class="bi bi-check-circle me-1"></i>Approve
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger approval-btn" onclick="window.openRejectLeaveModal('${l.id}')">
            <i class="bi bi-x-circle me-1"></i>Reject
          </button>
        </div>
      </div>
    `;

    const reasonEl = card.querySelector(".leave-reason-text");
    if (reasonEl) {
      reasonEl.textContent = l.reason || "No reason provided";
    }

    container.appendChild(card);
  });
}

function handleDecisionStep(leaveId, decision, rejectionReason = "") {
  leavesApp.handleDecisionStep(leaveId, decision, rejectionReason);
}

function renderDeclaredHolidaysList() {
  const container = document.getElementById("declaredHolidaysBadges");
  if (!container) return;
  const holidays = (window.DEMO_DATA && window.DEMO_DATA.publicHolidays) || [];

  if (holidays.length === 0) {
    container.innerHTML = `<span class="text-muted small">No official public holidays declared yet.</span>`;
    return;
  }

  container.innerHTML = holidays
    .map((h, idx) => {
      const isHalf = h.duration === "half";
      const durationBadge = isHalf
        ? `<span class="badge bg-warning text-dark border border-warning duration-chip-badge">Half Day</span>`
        : `<span class="badge bg-success-subtle text-success border border-success duration-chip-badge">Full Day</span>`;

      return `
      <span class="badge bg-light text-dark border p-2 d-inline-flex align-items-center gap-2 holiday-chip-badge">
        <span>🌴 <strong>${h.date}</strong>: ${window.escapeHtml(h.title)}</span>
        ${durationBadge}
        <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1 text-decoration-none holiday-remove-btn" onclick="removeDeclaredHoliday(${idx})" title="Remove Holiday">✕</button>
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

  const defaultOpt = `<option value="all">All Employees</option>`;
  const userOpts = allUsers
    .map((u) => {
      const displayName = u.name || u.id;
      const roleBadge = u.role ? ` (${u.role})` : "";
      return `<option value="${u.id}">${window.escapeHtml(displayName)}${roleBadge}</option>`;
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
  const lang = getSysLang();
  const role = (currentUser && currentUser.role ? currentUser.role : "").toLowerCase();
  if (role !== "hr" && role !== "admin") return;

  const tbody = document.getElementById("hrAllLeavesTableBody");
  if (!tbody) return;
  tbody.replaceChildren();

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
    statTotal.textContent = `Total: ${totalCount}`;
  if (statApproved)
    statApproved.textContent = `Approved: ${approvedCount}`;
  if (statPending)
    statPending.textContent = `Pending: ${pendingCount}`;

  const filtered = leavesList.filter((l) => {
    if (empVal !== "all" && l.userId !== empVal) return false;
    if (typeVal !== "all" && l.type !== typeVal) return false;
    if (statusVal !== "all" && l.status !== statusVal) return false;

    if (searchVal) {
      const uName = getLeaveApplicantName(l).toLowerCase();
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
    try {
      const typeKey = (l.type || "annual") + "Leave";
      const typeLabel = leaveTranslations[lang]?.[typeKey] || (l.type ? l.type.toUpperCase() : "ANNUAL");
      const durationLabel = formatLeaveDurationText(l, lang);
      const roleLabel = formatLeaveUserRole(l.userRole, lang);

      const app = l.approvals || {};
      let stepsHtml = "";

      const dmName = getApproverDisplayName(l, "dm", lang);
      const lmName = getApproverDisplayName(l, "lm", lang);
      const buName = getApproverDisplayName(l, "bu", lang);
      const hrName = getApproverDisplayName(l, "hr", lang);

      if (app.dm && app.dm.status) {
        stepsHtml += `
          <div>
            <span class="approval-step-tag ${app.dm.status}">
              ${window.escapeHtml(dmName)}: ${(app.dm.status || "").toUpperCase()} ${app.dm.updatedAt ? `(${app.dm.updatedAt})` : ""}
            </span>
          </div>
        `;
      }

      if (app.lm && app.lm.status) {
        stepsHtml += `
          <div>
            <span class="approval-step-tag ${app.lm.status}">
              ${window.escapeHtml(lmName)}: ${(app.lm.status || "").toUpperCase()} ${app.lm.updatedAt ? `(${app.lm.updatedAt})` : ""}
            </span>
          </div>
        `;
      }

      if (app.bu && app.bu.status) {
        stepsHtml += `
          <div>
            <span class="approval-step-tag ${app.bu.status}">
              ${window.escapeHtml(buName)}: ${(app.bu.status || "").toUpperCase()} ${app.bu.updatedAt ? `(${app.bu.updatedAt})` : ""}
            </span>
          </div>
        `;
      }

      if (app.hr && app.hr.status) {
        stepsHtml += `
          <div>
            <span class="approval-step-tag ${app.hr.status}">
              ${window.escapeHtml(hrName)}: ${(app.hr.status || "").toUpperCase()} ${app.hr.updatedAt ? `(${app.hr.updatedAt})` : ""}
            </span>
          </div>
        `;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 rep-avatar-sm">
              ${(getLeaveApplicantName(l) || "U").charAt(0)}
            </div>
            <div>
              <div class="fw-bold leave-item-title">${window.escapeHtml(getLeaveApplicantName(l))}</div>
              <small class="text-muted">${window.escapeHtml(roleLabel)}</small>
            </div>
          </div>
        </td>
        <td>
          <strong class="leave-item-title">${typeLabel}</strong>
        </td>
        <td>
          <div class="d-flex flex-column align-items-start gap-1">
            ${formatLeaveDateDisplay(l.startDate, l.endDate, lang)}
            <span class="badge duration-badge mt-1">${durationLabel}</span>
          </div>
        </td>
        <td>
          ${
            l.attachmentName
              ? `<span class="badge bg-primary-subtle text-primary border attachment-badge-tag">📎 ${window.escapeHtml(l.attachmentName)}</span>`
              : '<span class="text-muted small">None</span>'
          }
        </td>
        <td>
          <div class="approval-steps-flow">
            ${stepsHtml}
          </div>
        </td>
        <td>
          <span class="badge status-badge ${l.status === "approved" ? "bg-success" : l.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}">
            ${(l.status || "").toUpperCase()}
          </span>
          ${
            l.status === "rejected" && l.rejectionReason
              ? `<div class="mt-1 small text-danger rejection-reason-box" title="${window.escapeHtml(l.rejectionReason)}">
                   <i class="bi bi-chat-left-text me-1"></i><strong>Reason:</strong> ${window.escapeHtml(l.rejectionReason)}
                 </div>`
              : ""
          }
        </td>
      `;
      tbody.appendChild(tr);
    } catch (rowErr) {
      console.error("Error rendering leave row in HR archive:", rowErr, l);
    }
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

  const prevVal = select.value;

  const users =
    window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)
      ? window.DEMO_DATA.users
      : [];

  select.innerHTML = `<option value="">Choose an employee...</option>`;

  const roleNameMap = {
    medical_rep: "Medical Rep",
    rep: "Medical Rep",
    district_manager: "District Manager (DM)",
    dm: "District Manager (DM)",
    line_manager: "Line Manager (LM)",
    lm: "Line Manager (LM)",
    business_unit: "Business Unit Head (BU)",
    bu: "Business Unit Head (BU)",
    hr: "HR",
    admin: "Admin",
  };

  users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    const name = u.name;
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
    if (summaryEl) summaryEl.classList.add("d-none");
  }
}

function initHrBalanceControl() {
  populateHrEmployeeSelect();
}

Object.assign(leavesApp, {
  getApproverDisplayName(leave, level, lang) {
    return resolveApproverDisplayName(leave, level, lang);
  },

  handleDecisionStep(leaveId, decision, rejectionReason = "") {
    try {
      const leave = demoLeaves.find((l) => l.id === leaveId);
      if (!leave) return;

      currentUser = (window.checkAuth && window.checkAuth()) || currentUser;
      const rawRole = (currentUser.role || "medical_rep").toLowerCase();
      const wf = window.WorkflowEngine;
      const isDM = wf ? wf.userMatchesTier(currentUser, "dm") : (rawRole === "district_manager" || rawRole === "dm");
      const isLM = wf ? wf.userMatchesTier(currentUser, "lm") : (rawRole === "line_manager" || rawRole === "lm");
      const isBU = wf ? wf.userMatchesTier(currentUser, "bu") : (rawRole === "business_unit" || rawRole === "bu");
      const isHR = wf ? wf.userMatchesTier(currentUser, "hr") : (rawRole === "hr");
      const isAdmin = (wf ? wf.getUserBaseRole(currentUser) : rawRole) === "admin";

      if (!isDM && !isLM && !isBU && !isHR && !isAdmin) {
        if (typeof showToast === "function") showToast("Access Denied: Approvers only.", "error");
        return;
      }

      if (!isHR && !isAdmin) {
        if (typeof window.canApproveFor === "function" && !window.canApproveFor(leave.userId)) {
          if (typeof showToast === "function") showToast("Access Denied: You can only approve requests within your reporting hierarchy.", "error");
          return;
        }
      }

      const _leavesNow = new Date();
      const _leavesTodayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) ||
        `${_leavesNow.getFullYear()}-${String(_leavesNow.getMonth() + 1).padStart(2, "0")}-${String(_leavesNow.getDate()).padStart(2, "0")}`;
      const timestampStr = `${_leavesTodayStr} ${_leavesNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

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
      const applicantIsDM = leave.userRole === "district_manager" || leave.userRole === "dm" || leave.userId === "u1790626000014";
      const applicantIsLM = leave.userRole === "line_manager" || leave.userRole === "lm" || leave.userId === "u1790626000012";
      const applicantIsBU = leave.userRole === "business_unit" || leave.userRole === "bu";

      if (!applicantIsDM && !applicantIsLM && !applicantIsBU && !leave.approvals.dm) {
        leave.approvals.dm = { status: "pending", approverName: null, updatedAt: null };
      }
      if (!applicantIsLM && !applicantIsBU && !leave.approvals.lm) {
        leave.approvals.lm = { status: "pending", approverName: null, updatedAt: null };
      }
      if (!leave.approvals.hr) leave.approvals.hr = { status: "pending", approverName: null, updatedAt: null };

      const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

      if (decision === "rejected") {
        leave.status = "rejected";
        leave.rejectionReason = rejectionReason || null;
        leave.rejectedBy = currentUser.name;
        leave.rejectedById = currentUser.id;
        leave.rejectedAt = timestampStr;

        if (isDM && leave.approvals.dm) {
          leave.approvals.dm.status = "rejected";
          leave.approvals.dm.approverId = currentUser.id;
          leave.approvals.dm.approverName = currentUser.name;
          leave.approvals.dm.updatedAt = timestampStr;
          leave.approvals.dm.rejectionReason = rejectionReason || null;
        }
        if (isLM && leave.approvals.lm) {
          leave.approvals.lm.status = "rejected";
          leave.approvals.lm.approverId = currentUser.id;
          leave.approvals.lm.approverName = currentUser.name;
          leave.approvals.lm.updatedAt = timestampStr;
          leave.approvals.lm.rejectionReason = rejectionReason || null;
        }
        if (isBU) {
          if (!leave.approvals.bu) leave.approvals.bu = {};
          leave.approvals.bu.status = "rejected";
          leave.approvals.bu.approverId = currentUser.id;
          leave.approvals.bu.approverName = currentUser.name;
          leave.approvals.bu.updatedAt = timestampStr;
          leave.approvals.bu.rejectionReason = rejectionReason || null;
        }
        if (isHR || isAdmin) {
          if (leave.approvals.hr) {
            leave.approvals.hr.status = "rejected";
            leave.approvals.hr.approverId = currentUser.id;
            leave.approvals.hr.approverName = currentUser.name;
            leave.approvals.hr.updatedAt = timestampStr;
            leave.approvals.hr.rejectionReason = rejectionReason || null;
          }
        }

        if (typeof window.addWorkflowNotification === "function") {
          window.addWorkflowNotification({
            userId: leave.userId,
            type: "leave_rejection",
            title: "Leave Request Rejected",
            message: rejectionReason
              ? `Your leave request (${leave.type}) was rejected by (${currentUser.name}) with note: ${rejectionReason}`
              : `Your leave request (${leave.type}) was rejected by (${currentUser.name}).`,
            note: rejectionReason || null,
            link: "leaves.html",
            icon: "🏖️",
            badgeClass: "bg-danger",
            actorName: currentUser.name,
            action: "rejected",
          });
        }

        const rejMsg = rejectionReason
          ? `Leave request rejected with note: "${rejectionReason}"`
          : "Leave request rejected.";
        if (typeof showToast === "function") showToast(rejMsg, "warning");
        else if (typeof window.showToast === "function")
          window.showToast(rejMsg, "warning");
      } else {
        if (isDM) {
          leave.approvals.dm.status = "approved";
          leave.approvals.dm.approverId = currentUser.id;
          leave.approvals.dm.approverName = currentUser.name;
          leave.approvals.dm.updatedAt = timestampStr;

          const lvsWf = (window.WorkflowEngine && typeof window.WorkflowEngine.getWorkflows === "function")
            ? window.WorkflowEngine.getWorkflows().leaves
            : { requireLm: true };
          const requireLm = lvsWf && lvsWf.requireLm !== false;

          if (!requireLm && leave.approvals.lm) {
            leave.approvals.lm.status = "skipped";
            leave.approvals.lm.approverName = "Skipped (Workflow Config)";
            leave.approvals.lm.updatedAt = timestampStr;
          }

          if (typeof window.addWorkflowNotification === "function") {
            window.addWorkflowNotification({
              userId: leave.userId,
              type: "leave_approval",
              title: "Leave Approved by DM",
              message: requireLm
                ? `District Manager (${currentUser.name}) approved your leave request and forwarded to LM.`
                : `District Manager (${currentUser.name}) approved your leave request and forwarded directly to HR.`,
              link: "leaves.html",
              icon: "🏖️",
              badgeClass: "bg-info",
              actorName: currentUser.name,
              action: "approved",
            });
          }

          const msg = requireLm
            ? "Approved by District Manager. Forwarded to Line Manager."
            : "Approved by District Manager. Forwarded directly to HR.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        } else if (isLM) {
          leave.approvals.lm.status = "approved";
          leave.approvals.lm.approverId = currentUser.id;
          leave.approvals.lm.approverName = currentUser.name;
          leave.approvals.lm.updatedAt = timestampStr;

          const lvsWf = (window.WorkflowEngine && typeof window.WorkflowEngine.getWorkflows === "function")
            ? window.WorkflowEngine.getWorkflows().leaves
            : { requireBu: false };
          const requireBu = lvsWf && !!lvsWf.requireBu;

          if (requireBu) {
            if (!leave.approvals.bu) {
              leave.approvals.bu = { status: "pending", approverName: null, updatedAt: null };
            }
          }

          if (typeof window.addWorkflowNotification === "function") {
            window.addWorkflowNotification({
              userId: leave.userId,
              type: "leave_approval",
              title: "Leave Approved by LM",
              message: requireBu
                ? `Line Manager (${currentUser.name}) approved your leave request and forwarded to BU.`
                : `Line Manager (${currentUser.name}) approved your leave request and forwarded to HR.`,
              link: "leaves.html",
              icon: "🏖️",
              badgeClass: "bg-info",
              actorName: currentUser.name,
              action: "approved",
            });
          }

          const msg = requireBu
            ? "Approved by Line Manager. Forwarded to Business Unit Head."
            : "Approved by Line Manager. Forwarded to HR.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        } else if (isBU) {
          if (!leave.approvals.bu) leave.approvals.bu = {};
          leave.approvals.bu.status = "approved";
          leave.approvals.bu.approverId = currentUser.id;
          leave.approvals.bu.approverName = currentUser.name;
          leave.approvals.bu.updatedAt = timestampStr;

          if (typeof window.addWorkflowNotification === "function") {
            window.addWorkflowNotification({
              userId: leave.userId,
              type: "leave_approval",
              title: "Leave Approved by BU",
              message: `Business Unit Head (${currentUser.name}) approved your leave request and forwarded to HR.`,
              link: "leaves.html",
              icon: "🏖️",
              badgeClass: "bg-info",
              actorName: currentUser.name,
              action: "approved",
            });
          }

          const msg = "Approved by Business Unit Head. Forwarded to HR.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        } else if (isHR || isAdmin) {
          if (leave.approvals.hr) {
            leave.approvals.hr.status = "approved";
            leave.approvals.hr.approverId = currentUser.id;
            leave.approvals.hr.approverName = currentUser.name;
            leave.approvals.hr.updatedAt = timestampStr;
          }
          leave.status = "approved";

          if (typeof window.addWorkflowNotification === "function") {
            window.addWorkflowNotification({
              userId: leave.userId,
              type: "leave_approval",
              title: "Leave Request Approved",
              message: "HR Department approved your annual leave request.",
              link: "leaves.html",
              icon: "🏖️",
              badgeClass: "bg-success",
              actorName: "HR",
              action: "approved",
            });
          }

          const msg = "Final approval granted by HR. Deducted from leave balance.";
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
      if (typeof window.renderTopbar === "function") window.renderTopbar();
    } catch (err) {
      console.error("Error in handleDecisionStep:", err);
    }
  },

  removeDeclaredHoliday(idx) {
    const user = (window.checkAuth && window.checkAuth()) || currentUser;
    const role = (user.role || "").toLowerCase();
    if (role !== "hr" && role !== "admin") {
      if (typeof showToast === "function") showToast("Access Denied: HR and Admin only.", "error");
      return;
    }
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
    if (e) e.preventDefault();
    const user = (window.checkAuth && window.checkAuth()) || currentUser;
    const role = (user.role || "").toLowerCase();
    if (role !== "hr" && role !== "admin") {
      if (typeof showToast === "function") showToast("Access Denied: HR and Admin only.", "error");
      return;
    }
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
    const durationLabel = durationVal === "half" ? "Half Day" : "Full Day";
    showToast(
      `Official Public Holiday "${nameVal}" (${durationLabel}) declared! Visible in company calendar.`,
      "success",
    );
    if (e && e.target && typeof e.target.reset === "function") e.target.reset();
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
      if (summaryEl) summaryEl.classList.add("d-none");
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

    const todayStr = getSysToday();
    const rollover = getEmployeeLeaveRollover(user.id);
    const effectiveAnnual = annualTotal + (rollover.isValid ? rollover.carriedOver : 0);

    const leavesList =
      window.DEMO_DATA && Array.isArray(window.DEMO_DATA.leaves)
        ? window.DEMO_DATA.leaves
        : demoLeaves;
    const currentYearStr = String(new Date().getFullYear());
    let used = { annual: 0, casual: 0, sick: 0 };
    leavesList.forEach((l) => {
      // Only deduct approved leaves whose start date has arrived or passed in current year
      if (l.userId === user.id && l.status === "approved" && l.startDate && l.startDate <= todayStr && l.startDate.startsWith(currentYearStr)) {
        const d = parseFloat(l.days) || 1;
        if (l.type === "annual") used.annual += d;
        else if (l.type === "casual" || l.type === "emergency")
          used.casual += d;
        else if (l.type === "sick") used.sick += d;
      }
    });

    if (summaryEl) {
      const remAnnual = Math.max(0, effectiveAnnual - used.annual);
      const remCasual = Math.max(0, casualTotal - used.casual);
      const remSick = Math.max(0, sickTotal - used.sick);
      const safeUserName = window.escapeHtml(user.name);

      const rolloverBadge = rollover.isValid
        ? `<span class="badge bg-success-subtle text-success border">+${rollover.carriedOver} Rollover</span>`
        : "";

      summaryEl.classList.remove("d-none");
      summaryEl.innerHTML = `
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="fw-bold text-dark">Leave Usage Snapshot for (${safeUserName}):</span>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            <span class="badge bg-primary-subtle text-primary border">Annual: ${used.annual} Used / ${remAnnual} Left of ${effectiveAnnual} ${rolloverBadge}</span>
            <span class="badge bg-warning-subtle text-warning-emphasis border">Casual: ${used.casual} Used / ${remCasual} Left of ${casualTotal}</span>
            <span class="badge bg-info-subtle text-info-emphasis border">Sick: ${used.sick} Used / ${remSick} Left of ${sickTotal}</span>
          </div>
        </div>`;
    }
  },

  handleSaveEmployeeBalance(e) {
    if (e) e.preventDefault();
    const user = (window.checkAuth && window.checkAuth()) || currentUser;
    const role = (user.role || "").toLowerCase();
    if (role !== "hr" && role !== "admin") {
      if (typeof showToast === "function") showToast("Access Denied: HR and Admin only.", "error");
      return;
    }
    const select = document.getElementById("hrEmployeeSelect");
    if (!select || !select.value) {
      return showToast(
        "Please select an employee first.",
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
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    targetUser.leaveBalance = {
      annual,
      casual,
      emergency: casual,
      sick,
      unpaid: (targetUser.leaveBalance && targetUser.leaveBalance.unpaid) || 0,
      maternity: (targetUser.leaveBalance && targetUser.leaveBalance.maternity) || 90,
    };

    if (currentUser && currentUser.id === userId) {
      currentUser.leaveBalance = { ...targetUser.leaveBalance };
      calculateBalances();
    }

    try {
      const activeUserStr = sessionStorage.getItem("pharmaUser");
      if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        if (activeUser && activeUser.id === userId) {
          activeUser.leaveBalance = { ...targetUser.leaveBalance };
          sessionStorage.setItem("pharmaUser", JSON.stringify(activeUser));
        }
      }
    } catch (err) {}

    if (window.saveDataToStorage) window.saveDataToStorage();

    showToast(
      `Leave balance updated for ${targetUser.name} successfully.`,
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
window.handleDecisionStep = handleDecisionStep;
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
    try {
      renderDeclaredHolidaysList();
      initHrBalanceControl();
      initHrAllLeavesControl();
      renderHrAllLeaves();
    } catch (err) {
      console.error("Error updating HR sections on languageChanged:", err);
    }
  }
  try {
    calculateBalances();
    renderHistory();
    renderPendingApprovals();
  } catch (err) {
    console.error("Error refreshing leaves on languageChanged:", err);
  }
});