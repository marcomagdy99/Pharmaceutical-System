/**
 * @file leaves.js
 * @description Leaves Management Module supporting Multi-level Approvals (Rep -> DM -> LM -> HR),
 * Full/Half Day Duration, File Attachments, Dynamic Balance Deduction, and HR Public Holiday declarations.
 */

function resolveLeaveUserName(userId, fallback) {
  if (typeof window !== "undefined" && window.store && window.store.users && userId) {
    if (typeof window.store.users.getById === "function") {
      const u = window.store.users.getById(userId);
      if (u && u.name) return u.name;
    } else if (typeof window.store.users.getAll === "function") {
      const u = window.store.users.getAll().find(x => x && x.id === userId);
      if (u && u.name) return u.name;
    }
  }
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.users && userId) {
    const u = window.DEMO_DATA.users.find(x => x && x.id === userId);
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

// Production & Cloud-synced leaves list (no hardcoded mock leave records)
let demoLeaves = (window.store && window.store.leaves
  ? window.store.leaves.getAll()
  : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

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
    hrGovernanceTitle: "HR Governance: Leave Balances & Public Holidays",
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
    allEmployeesLeavesTitle: "All Employees Leave Records",
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
const getSysToday = () => {
  if (window.getSystemTodayStr) return window.getSystemTodayStr();
  const d = (window.getSystemDate && window.getSystemDate()) || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

  // Init leaves view state

  updateUIForUser();
  setupEventListeners();
  calculateBalances();
  if (typeof window.applyTranslations === "function") {
    window.applyTranslations();
  }
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
      } catch (e) {
    console.warn("Failed to set default leave dates:", e);
  }
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

    const sDate = new Date(startDate + "T00:00:00");
    const eDate = new Date(endDate + "T00:00:00");
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return showToast("Invalid date format. Please select valid dates.", "error");
    }

    if (endDate < startDate) {
      return showToast(
        "End date must be on or after start date.",
        "warning",
      );
    }

    const spanCalendarDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (spanCalendarDays > 365) {
      return showToast(
        "A single leave request cannot exceed 365 days. Please break your request into separate periods.",
        "warning",
      );
    }

    // Policy check: Backdated leaves
    const sysNow = (window.getSystemDate && window.getSystemDate()) || new Date();
    const sysTodayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) ||
      `${sysNow.getFullYear()}-${String(sysNow.getMonth() + 1).padStart(2, "0")}-${String(sysNow.getDate()).padStart(2, "0")}`;
    const diffDaysFromToday = Math.round((sDate.getTime() - new Date(sysTodayStr + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));

    const isPrivilegedRole = currentUser.role === "admin" || currentUser.role === "hr";
    if (!isPrivilegedRole && diffDaysFromToday < -7) {
      return showToast(
        "Cannot submit backdated leaves older than 7 days. Please contact HR for retroactive registrations.",
        "warning",
      );
    }
    if (!isPrivilegedRole && type === "annual" && diffDaysFromToday < -2) {
      return showToast(
        "Annual leave requests must be submitted in advance (maximum 2 days retroactive grace period).",
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

      const msg = `You already have a leave request (${oStatus}: ${oType}) from ${oStart} to ${oEnd}. Cannot submit overlapping requests.`;

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

    if (calculatedDays <= 0) {
      return showToast(
        "The selected dates contain no deductible working days (all public holidays or weekly rest days).",
        "info",
      );
    }

    // Labor Law & Pharma Policy Check: Casual Leave cannot exceed 2 consecutive days per request
    if ((type === "casual" || type === "emergency") && calculatedDays > 2) {
      return showToast(
        "Casual leave cannot exceed 2 consecutive days per request. Please submit as Annual Leave for longer periods.",
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

      const rollover = balKey === "annual" ? getEmployeeLeaveRollover(currentUser.id) : { isValid: false, initialCarriedOver: 0, consumedFromNewAnnual: 0 };
      const activeRollover = rollover.isValid ? (rollover.initialCarriedOver || 0) : 0;

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
      const currentYearStr = String(((window.getSystemDate && window.getSystemDate()) || new Date()).getFullYear());

      (demoLeaves || []).forEach((l) => {
        if (l.userId === currentUser.id && l.status !== "rejected") {
          const leaveYear = l.startDate ? String(l.startDate).slice(0, 4) : "";
          if (leaveYear && leaveYear !== currentYearStr) return;
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

      if (balKey === "annual" && !rollover.isValid && rollover.initialCarriedOver > 0) {
        approvedUsed = rollover.consumedFromNewAnnual || 0;
      }

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
        const msg = `Sorry, your remaining balance for ${typeName} (${formatDays(remainingBalance)}) is not enough for (${formatDays(calculatedDays)}).`;
        return showToast(msg, "warning");
      }

      if (calculatedDays > availableBalance) {
        const msg = `Sorry, your available balance for ${typeName} is (${formatDays(availableBalance)}) due to (${formatDays(pendingUsed)}) in pending requests. Cannot request (${formatDays(calculatedDays)}).`;
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

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const directMgr = allUsers.find((u) => u.id === currentUser.managerId);
    const directMgrRole = directMgr ? (window.normalizeRole ? window.normalizeRole(directMgr.role) : (directMgr.role || "").toLowerCase()) : null;
    const repReportsDirectlyToLm = directMgrRole === "line_manager" || directMgrRole === "lm";

    if (userRole === "medical_rep" || userRole === "rep") {
      initialApprovals = {};
      if (requireDm && !repReportsDirectlyToLm) {
        initialApprovals.dm = { status: "pending", approverName: null, updatedAt: null };
      }
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
    } else if (userRole === "hr") {
      // HR cannot self-approve: approval routes to Admin
      initialApprovals = {
        admin: { status: "pending", approverName: null, updatedAt: null },
      };
    } else if (userRole === "business_unit" || userRole === "bu" || userRole === "product_manager" || userRole === "pm") {
      // Senior managers: Admin approves first, then HR records
      initialApprovals = {
        admin: { status: "pending", approverName: null, updatedAt: null },
        hr: { status: "pending", approverName: null, updatedAt: null },
      };
    } else if (userRole === "general_manager" || userRole === "gm") {
      // General Manager leave goes to Admin
      initialApprovals = {
        admin: { status: "pending", approverName: null, updatedAt: null },
      };
    } else if (userRole === "admin") {
      // Admin leave goes to HR
      initialApprovals = {
        hr: { status: "pending", approverName: null, updatedAt: null },
      };
    } else {
      initialApprovals = {
        hr: { status: "pending", approverName: null, updatedAt: null },
      };
    }

    const newLeave = {
      id: (window.genId ? window.genId("l_") : "l_" + Date.now()),
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

    if (window.store && window.store.leaves && typeof window.store.leaves.add === "function") {
      window.store.leaves.add(newLeave);
      demoLeaves = window.store.leaves.getAll();
    } else {
      demoLeaves.unshift(newLeave);
    }
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
    if (!res.isValid) {
      if (daysCount) daysCount.value = res.error || "Invalid Dates";
      if (holidayNotice) holidayNotice.classList.add("d-none");
      return;
    }
    const days = res.totalDays;
    const daysWord = days === 1 ? "Day" : "Days";

    if (daysCount) daysCount.value = `${days} ${daysWord}`;

    if (holidayNotice) {
      const noticeParts = [];
      if (res.excludedFridays > 0) {
        noticeParts.push(
          `<svg class="badge-svg-icon text-primary" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg> ${res.excludedFridays} Friday(s) excluded (statutory paid rest day)`
        );
      }
      if (res.excludedThursdays > 0) {
        const companySettings = (window.store && window.store.companySettings ? window.store.companySettings.get() : {}) || {};
        const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
        const secDayName = secDay === "saturday" ? "Saturday(s)" : (secDay === "thursday" ? "Thursday(s)" : "Weekly rest day(s)");
        noticeParts.push(
          `<svg class="badge-svg-icon text-info" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${res.excludedThursdays} ${secDayName} excluded (company weekly rest day)`
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
          `<svg class="badge-svg-icon text-success" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg> <strong>Official holidays:</strong> ${titles}`
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
  if (!start || !end) {
    return { totalDays: 0, isValid: false, excludedHolidays: [], excludedFridays: 0, excludedThursdays: 0, error: "Missing start or end date" };
  }

  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return { totalDays: 0, isValid: false, excludedHolidays: [], excludedFridays: 0, excludedThursdays: 0, error: "Invalid date format" };
  }

  if (s > e) {
    return { totalDays: 0, isValid: false, excludedHolidays: [], excludedFridays: 0, excludedThursdays: 0, error: "End date must be on or after start date" };
  }

  const spanDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const MAX_LEAVE_SPAN_DAYS = 366;
  if (spanDays > MAX_LEAVE_SPAN_DAYS) {
    return { totalDays: 0, isValid: false, isExceedingMaxSpan: true, excludedHolidays: [], excludedFridays: 0, excludedThursdays: 0, error: "Leave span exceeds 365 days" };
  }

  const startD = s;
  const endD = e;

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
  let loopCount = 0;
  while (cur <= endD && loopCount < MAX_LEAVE_SPAN_DAYS) {
    loopCount++;
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
    isValid: true,
    excludedHolidays,
    excludedFridays,
    excludedThursdays: excludedSecondaryDays,
  };
}

function resolveLeaveDays(start, end) {
  const res = resolveLeaveDaysDetailed(start, end);
  return res.isValid ? res.totalDays : 0;
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
 * Dynamically computes employee rollover balance from previous year based on companySettings.
 * Real-world policy: Leaves taken in the new year consume carried-over balance FIRST before deducting from new year quota.
 */
function getEmployeeLeaveRollover(userId, targetYear) {
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};

  if (companySettings.allowLeaveRollover === false) {
    return {
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

  const allUsers = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users))
    ? window.DEMO_DATA.users
    : [];
  const userObj = allUsers.find((u) => u.id === userId) || {};
  const userBalance = userObj.leaveBalance || {};
  const annualTotal = userBalance.annual !== undefined ? Number(userBalance.annual) : 21;

  const currentYear = targetYear || (window.getSystemDate ? window.getSystemDate() : new Date()).getFullYear();
  const prevYearStr = String(currentYear - 1);
  const currentYearStr = String(currentYear);
  const todayStr = (typeof window.getSystemTodayStr === "function")
    ? window.getSystemTodayStr()
    : new Date().toISOString().slice(0, 10);

  const allLeaves = (window.store && window.store.leaves
    ? (typeof window.store.leaves.getAll === "function" ? window.store.leaves.getAll() : window.store.leaves)
    : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || (typeof demoLeaves !== "undefined" ? demoLeaves : []) || [];

  let prevYearUsed = 0;
  allLeaves.forEach((l) => {
    if (l.userId === userId && l.status === "approved" && l.type === "annual" && l.startDate && l.startDate.startsWith(prevYearStr)) {
      prevYearUsed += (parseFloat(l.days) || 1);
    }
  });

  const leftover = Math.max(0, annualTotal - prevYearUsed);
  const maxCap = companySettings.leaveRolloverMaxDays !== undefined ? Number(companySettings.leaveRolloverMaxDays) : 5;
  const initialCarriedOver = maxCap > 0 ? Math.min(leftover, maxCap) : leftover;

  const graceMonths = Number(companySettings.leaveRolloverGraceMonths) || 3;
  let expiryDate = `${currentYear}-03-31`;
  if (graceMonths === 1) expiryDate = `${currentYear}-01-31`;
  else if (graceMonths === 3) expiryDate = `${currentYear}-03-31`;
  else if (graceMonths === 6) expiryDate = `${currentYear}-06-30`;
  else if (graceMonths === 12) expiryDate = `${currentYear}-12-31`;

  let gracePeriodApprovedTaken = 0;
  let postGraceApprovedTaken = 0;
  allLeaves.forEach((l) => {
    if (l.userId === userId && l.status === "approved" && l.type === "annual" && l.startDate && l.startDate.startsWith(currentYearStr)) {
      const days = parseFloat(l.days) || 1;
      if (l.startDate <= expiryDate) {
        gracePeriodApprovedTaken += days;
      } else {
        postGraceApprovedTaken += days;
      }
    }
  });

  const consumedFromRollover = Math.min(initialCarriedOver, gracePeriodApprovedTaken);
  const remainingRollover = Math.max(0, initialCarriedOver - consumedFromRollover);
  const consumedFromNewAnnual = Math.max(0, gracePeriodApprovedTaken - initialCarriedOver) + postGraceApprovedTaken;

  const isValid = initialCarriedOver > 0 && todayStr <= expiryDate;
  const isExpired = remainingRollover > 0 && todayStr > expiryDate;

  return {
    initialCarriedOver,
    consumedFromRollover,
    remainingRollover,
    carriedOver: remainingRollover,
    isValid,
    isExpired,
    expiryDate,
    maxCap,
    graceMonths,
    consumedFromNewAnnual,
  };
}
window.getEmployeeLeaveRollover = getEmployeeLeaveRollover;

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

  const currentYearStr = String(((window.getSystemDate && window.getSystemDate()) || new Date()).getFullYear());

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
                <i class="fas fa-rotate"></i> Carried Over (Deducted First):
              </span>
              <span class="badge bg-success text-white fw-bold px-2 py-1">${remainingMsgEn}</span>
            </div>
            <div class="text-danger fw-semibold d-flex align-items-center gap-1 rollover-expiry-countdown">
              <i class="fas fa-hourglass-half"></i> Expires on: ${rollover.expiryDate}
            </div>
          </div>
        </div>`;
    } else if (rollover.isExpired) {
      badgeEl.classList.remove("d-none");
      badgeEl.innerHTML = `
        <div class="mt-2 pt-2 border-top rollover-border-expired">
          <div class="p-2 rounded-3 rollover-banner-expired">
            <div class="d-flex justify-content-between align-items-center">
              <span class="rollover-expired-label"><i class="fas fa-clock-rotate-left me-1"></i>Rollover expired (${rollover.remainingRollover}d forfeited)</span>
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

    if (app.gm && app.gm.status) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.gm.status}">
            General Manager: ${(app.gm.status || "").toUpperCase()} ${app.gm.updatedAt ? `(${app.gm.updatedAt})` : ""}
          </span>
        </div>
      `;
    }

    if (app.admin && app.admin.status) {
      stepsHtml += `
        <div>
          <span class="approval-step-tag ${app.admin.status}">
            Admin: ${(app.admin.status || "").toUpperCase()} ${app.admin.updatedAt ? `(${app.admin.updatedAt})` : ""}
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
            ? `<span class="badge bg-primary-subtle text-primary border attachment-badge-tag"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> ${window.escapeHtml(l.attachmentName)}</span>`
            : '<span class="text-muted small">None</span>'
        }
      </td>
      <td>
        <div class="approval-steps-flow">
          ${stepsHtml}
        </div>
      </td>
      <td>
          ${window.renderStatusBadge ? window.renderStatusBadge(l.status) : `<span class="badge status-badge ${l.status === "approved" ? "bg-success" : l.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}">${(l.status || "").toUpperCase()}</span>`}
          ${
            canDelete
              ? `<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 mt-1 leave-delete-btn" data-action="delete-leave" data-leave-id="${window.escapeHtml(l.id)}">
                   <i class="fas fa-trash me-1"></i>Delete
                 </button>`
              : ""
          }
          ${
            l.status === "rejected" && l.rejectionReason
              ? `<div class="mt-1 small text-danger rejection-reason-box" title="${window.escapeHtml(l.rejectionReason)}">
                   <i class="fas fa-comment-dots me-1"></i><strong>Reason:</strong> ${window.escapeHtml(l.rejectionReason)}
                 </div>`
              : ""
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody && !tbody.dataset.deleteBound) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='delete-leave']");
      if (!btn) return;
      const leaveId = btn.getAttribute("data-leave-id");
      if (leaveId && typeof window.deleteMyLeave === "function") {
        window.deleteMyLeave(leaveId);
      }
    });
    tbody.dataset.deleteBound = "true";
  }
}

window.deleteMyLeave = function(leaveId) {
  const todayStr = getSysToday();

  const idx = demoLeaves.findIndex((l) => l.id === leaveId);
  if (idx < 0) return;
  const l = demoLeaves[idx];

  const isOwner = currentUser && l.userId === currentUser.id;
  const isAdmin = currentUser && currentUser.role === "admin";
  if (!isOwner && !isAdmin) {
    showToast("Permission denied: You can only delete your own leave requests.", "error");
    return;
  }

  const isFuture = l.startDate && l.startDate > todayStr;
  const canDelete = l.status === "pending" || (l.status === "approved" && isFuture) || isAdmin;

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
  if (window.DEMO_DATA) {
    window.DEMO_DATA.leaves = demoLeaves;
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  renderHistory();
  calculateBalances();
  if (typeof renderPendingApprovals === "function") renderPendingApprovals();
  if (typeof renderHrAllLeaves === "function") renderHrAllLeaves();

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
    // Strict self-approval prevention: never show own requests in pending approvals
    if (l.userId === currentUser.id) return false;

    const app = l.approvals || {};

    const hrStatus = (app.hr && app.hr.status ? app.hr.status : "").toLowerCase();
    const gmStatus = (app.gm && app.gm.status ? app.gm.status : "").toLowerCase();
    const buStatus = (app.bu && app.bu.status ? app.bu.status : "").toLowerCase();
    const lmStatus = (app.lm && app.lm.status ? app.lm.status : "").toLowerCase();
    const dmStatus = (app.dm && app.dm.status ? app.dm.status : "").toLowerCase();
    const adminStatus = (app.admin && app.admin.status ? app.admin.status : "").toLowerCase();

    const dmDone = !app.dm || app.dm.status === "approved" || app.dm.status === "skipped";
    const lmDone = !app.lm || app.lm.status === "approved" || app.lm.status === "skipped";
    const buDone = !app.bu || app.bu.status === "approved" || app.bu.status === "skipped";
    const gmDone = !app.gm || app.gm.status === "approved" || app.gm.status === "skipped";
    const adminDone = !app.admin || app.admin.status === "approved" || app.admin.status === "skipped";

    // General Manager (GM) is strictly view-only and does not approve leaves
    if (role === "general_manager" || role === "gm") {
      return false;
    }

    // System Administrator review check
    if (role === "admin") {
      if (adminStatus === "pending") return true;
      if (gmStatus === "pending" && dmDone && lmDone && buDone) return true;
      if (hrStatus === "pending" && dmDone && lmDone && buDone && gmDone && adminDone) return true;
      return false;
    }

    // HR organization-wide review check (only when previous managerial steps are complete)
    if (role === "hr") {
      return hrStatus === "pending" && dmDone && lmDone && buDone && gmDone && adminDone;
    }

    // BU Manager approval check (fail-closed)
    if (role === "business_unit" || role === "bu") {
      if (typeof window.canApproveFor !== "function" || !window.canApproveFor(l.userId)) {
        return false;
      }
      return buStatus === "pending" && dmDone && lmDone;
    }

    // Verify applicant is in current manager's hierarchy to prevent unauthorized approvals
    let isSubordinate = false;
    if (typeof window.canApproveFor === "function" && window.canApproveFor(l.userId)) {
      isSubordinate = true;
    } else {
      const allUsers = (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
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
      return lmStatus === "pending" && dmDone;
    }
    return false;
  });

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  const countBadge = document.getElementById("pendingApprovalsBadge");
  if (countBadge) {
    countBadge.textContent = pending.length;
    countBadge.className = pending.length > 0
      ? "badge rounded-pill bg-primary text-white"
      : "badge rounded-pill bg-secondary-subtle text-muted border";
  }

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="no-pending-box py-4 text-center text-muted w-100">
        <svg class="mb-2 opacity-50" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
        </svg>
        <div class="small fw-medium">${leaveTranslations[lang].noPending}</div>
      </div>
    `;
    return;
  }

  pending.forEach((l) => {
    const card = document.createElement("div");
    card.className = "card border-0 pending-approval-card shadow-sm";

    const typeKey = (l.type || "annual") + "Leave";
    const typeLabel = leaveTranslations[lang]?.[typeKey] || (l.type ? l.type.toUpperCase() : "ANNUAL");
    const durationLabel = formatLeaveDurationText(l, lang);
    const roleLabel = formatLeaveUserRole(l.userRole, lang);

    card.innerHTML = `
      <div class="card-body">
        <div class="approval-header-row mb-3">
          <div class="approval-user-info">
            <div class="approval-user-avatar">
              ${window.escapeHtml((getLeaveApplicantName(l) || "U").charAt(0).toUpperCase())}
            </div>
            <div class="approval-user-details">
              <div class="approval-user-name">${window.escapeHtml(getLeaveApplicantName(l))}</div>
              <div class="approval-user-role">${window.escapeHtml(roleLabel)}</div>
            </div>
          </div>
          <div class="approval-badge-wrap">
            <span class="badge approval-type-badge">${window.escapeHtml(typeLabel)}</span>
          </div>
        </div>

        <div class="approval-meta-grid mb-3">
          <div class="approval-meta-item">
            <span class="approval-meta-label">
              <svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Dates</span>
            </span>
            <div class="approval-meta-val">
              ${formatLeaveDateDisplay(l.startDate, l.endDate, lang)}
            </div>
          </div>
          <div class="approval-meta-item">
            <span class="approval-meta-label">
              <svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Duration</span>
            </span>
            <span class="badge duration-badge">${durationLabel}</span>
          </div>
        </div>

        <div class="approval-reason-box mb-3">
          <div class="approval-reason-header">
            <svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Reason</span>
          </div>
          <div class="approval-reason-content leave-reason-text"></div>
        </div>

        ${
          l.attachmentName
            ? `<div class="mb-3">
                 <span class="approval-attachment-pill">
                   <svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                   ${window.escapeHtml(l.attachmentName)}
                 </span>
               </div>`
            : ""
        }

        <div class="approval-actions-row">
          <button type="button" class="btn btn-sm btn-success approval-btn approval-btn-approve" data-action="approve-leave" data-leave-id="${window.escapeHtml(l.id)}">
            <svg class="btn-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Approve</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger approval-btn approval-btn-reject" data-action="reject-leave" data-leave-id="${window.escapeHtml(l.id)}">
            <svg class="btn-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>Reject</span>
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

  if (container && !container.dataset.decisionBound) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const act = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-leave-id");
      if (act === "approve-leave" && id) {
        window.handleDecisionStep(id, "approved");
      } else if (act === "reject-leave" && id) {
        window.openRejectLeaveModal(id);
      }
    });
    container.dataset.decisionBound = "true";
  }
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
        <span><svg class="badge-svg-icon text-success" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg> <strong>${window.escapeHtml(h.date)}</strong>: ${window.escapeHtml(h.title)}</span>
        ${durationBadge}
        <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1 text-decoration-none holiday-remove-btn" data-action="remove-holiday" data-holiday-idx="${idx}" title="Remove Holiday"><svg class="badge-svg-icon text-danger" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </span>
    `;
    })
    .join("");

  if (!container.dataset.removeBound) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='remove-holiday']");
      if (!btn) return;
      const idx = btn.getAttribute("data-holiday-idx");
      if (idx !== null && typeof window.removeDeclaredHoliday === "function") {
        window.removeDeclaredHoliday(parseInt(idx, 10));
      }
    });
    container.dataset.removeBound = "true";
  }
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
      return `<option value="${window.escapeHtml(u.id)}">${window.escapeHtml(displayName)}${window.escapeHtml(roleBadge)}</option>`;
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

      if (app.gm && app.gm.status) {
        stepsHtml += `
          <div>
            <span class="approval-step-tag ${app.gm.status}">
              General Manager: ${(app.gm.status || "").toUpperCase()} ${app.gm.updatedAt ? `(${app.gm.updatedAt})` : ""}
            </span>
          </div>
        `;
      }

      if (app.admin && app.admin.status) {
        stepsHtml += `
          <div>
            <span class="approval-step-tag ${app.admin.status}">
              Admin: ${(app.admin.status || "").toUpperCase()} ${app.admin.updatedAt ? `(${app.admin.updatedAt})` : ""}
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
              ? `<span class="badge bg-primary-subtle text-primary border attachment-badge-tag"><svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> ${window.escapeHtml(l.attachmentName)}</span>`
              : '<span class="text-muted small">None</span>'
          }
        </td>
        <td>
          <div class="approval-steps-flow">
            ${stepsHtml}
          </div>
        </td>
        <td>
          ${window.renderStatusBadge ? window.renderStatusBadge(l.status) : `<span class="badge status-badge ${l.status === "approved" ? "bg-success" : l.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}">${(l.status || "").toUpperCase()}</span>`}
          ${
            l.status === "rejected" && l.rejectionReason
              ? `<div class="mt-1 small text-danger rejection-reason-box" title="${window.escapeHtml(l.rejectionReason)}">
                   <i class="fas fa-comment-dots me-1"></i><strong>Reason:</strong> ${window.escapeHtml(l.rejectionReason)}
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
      const allCurrentLeaves = (window.store && window.store.leaves ? window.store.leaves.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.leaves) || demoLeaves;
      const leave = allCurrentLeaves.find((l) => l.id === leaveId) || demoLeaves.find((l) => l.id === leaveId);
      if (!leave) return;

      if (leave.status === "approved" || leave.status === "rejected") {
        if (typeof showToast === "function") {
          showToast(`This leave request has already been ${leave.status}.`, "info");
        }
        return;
      }

      currentUser = (window.checkAuth && window.checkAuth()) || currentUser;
      const rawRole = (currentUser.role || "medical_rep").toLowerCase();
      const wf = window.WorkflowEngine;
      const isDM = wf ? wf.userMatchesTier(currentUser, "dm") : (rawRole === "district_manager" || rawRole === "dm");
      const isLM = wf ? wf.userMatchesTier(currentUser, "lm") : (rawRole === "line_manager" || rawRole === "lm");
      const isBU = wf ? wf.userMatchesTier(currentUser, "bu") : (rawRole === "business_unit" || rawRole === "bu");
      const isGM = (rawRole === "general_manager" || rawRole === "gm");
      const isHR = wf ? wf.userMatchesTier(currentUser, "hr") : (rawRole === "hr");
      const isAdmin = (wf ? wf.getUserBaseRole(currentUser) : rawRole) === "admin";

      // Strict self-approval prevention: no user may approve their own leave request
      if (leave.userId === currentUser.id) {
        if (typeof showToast === "function") {
          showToast("Self-approval is strictly forbidden. Another authorized approver or HR must process your request.", "error");
        }
        return;
      }

      if (isGM) {
        if (typeof showToast === "function") showToast("Access Denied: General Manager has view-only oversight and cannot approve or reject leaves.", "error");
        return;
      }

      if (!isDM && !isLM && !isBU && !isHR && !isAdmin) {
        if (typeof showToast === "function") showToast("Access Denied: Approvers only.", "error");
        return;
      }

      if (!isHR && !isAdmin) {
        if (typeof window.canApproveFor !== "function" || !window.canApproveFor(leave.userId)) {
          if (typeof showToast === "function") showToast("Access Denied: You can only approve requests within your reporting hierarchy.", "error");
          return;
        }
      }

      const _leavesNow = (window.getSystemDate && window.getSystemDate()) || new Date();
      const _leavesTodayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) ||
        `${_leavesNow.getFullYear()}-${String(_leavesNow.getMonth() + 1).padStart(2, "0")}-${String(_leavesNow.getDate()).padStart(2, "0")}`;
      const timestampStr = `${_leavesTodayStr} ${_leavesNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      // Safe initialization: ensure approvals object exists
      if (!leave.approvals) {
        leave.approvals = {
          hr: { status: "pending", approverName: null, updatedAt: null },
        };
      }

      // Validate sequential approval step dependencies strictly
      const dmDone = !leave.approvals.dm || leave.approvals.dm.status === "approved" || leave.approvals.dm.status === "skipped";
      const lmDone = !leave.approvals.lm || leave.approvals.lm.status === "approved" || leave.approvals.lm.status === "skipped";
      const buDone = !leave.approvals.bu || leave.approvals.bu.status === "approved" || leave.approvals.bu.status === "skipped";
      const gmDone = !leave.approvals.gm || leave.approvals.gm.status === "approved" || leave.approvals.gm.status === "skipped";
      const adminDone = !leave.approvals.admin || leave.approvals.admin.status === "approved" || leave.approvals.admin.status === "skipped";

      if (!isAdmin) {
        const hasPendingStage =
          (isDM && leave.approvals.dm && leave.approvals.dm.status === "pending") ||
          (isLM && leave.approvals.lm && leave.approvals.lm.status === "pending" && dmDone) ||
          (isBU && leave.approvals.bu && leave.approvals.bu.status === "pending" && dmDone && lmDone) ||
          (isHR && leave.approvals.hr && leave.approvals.hr.status === "pending" && dmDone && lmDone && buDone && gmDone && adminDone);
        if (!hasPendingStage) {
          if (typeof showToast === "function") showToast("Action not permitted at the current approval stage.", "warning");
          return;
        }
      } else if (decision === "approved") {
        // Admin approving HR stage must wait for earlier steps unless acting on admin/gm stage
        if (!(leave.approvals.admin && leave.approvals.admin.status === "pending") &&
            !(leave.approvals.gm && leave.approvals.gm.status === "pending") &&
            leave.approvals.hr && leave.approvals.hr.status === "pending") {
          if (!dmDone || !lmDone || !buDone || !gmDone || !adminDone) {
            if (typeof showToast === "function") showToast("Cannot grant final approval: Previous managerial steps are still pending.", "warning");
            return;
          }
        }
      }

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
        if (isBU && leave.approvals.bu) {
          leave.approvals.bu.status = "rejected";
          leave.approvals.bu.approverId = currentUser.id;
          leave.approvals.bu.approverName = currentUser.name;
          leave.approvals.bu.updatedAt = timestampStr;
          leave.approvals.bu.rejectionReason = rejectionReason || null;
        }
        if (isAdmin && leave.approvals.gm) {
          leave.approvals.gm.status = "rejected";
          leave.approvals.gm.approverId = currentUser.id;
          leave.approvals.gm.approverName = currentUser.name;
          leave.approvals.gm.updatedAt = timestampStr;
          leave.approvals.gm.rejectionReason = rejectionReason || null;
        }
        if (isAdmin && leave.approvals.admin) {
          leave.approvals.admin.status = "rejected";
          leave.approvals.admin.approverId = currentUser.id;
          leave.approvals.admin.approverName = currentUser.name;
          leave.approvals.admin.updatedAt = timestampStr;
          leave.approvals.admin.rejectionReason = rejectionReason || null;
        }
        if ((isHR || isAdmin) && leave.approvals.hr) {
          leave.approvals.hr.status = "rejected";
          leave.approvals.hr.approverId = currentUser.id;
          leave.approvals.hr.approverName = currentUser.name;
          leave.approvals.hr.updatedAt = timestampStr;
          leave.approvals.hr.rejectionReason = rejectionReason || null;
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
        if (isDM && leave.approvals.dm && leave.approvals.dm.status === "pending") {
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
        } else if (isLM && leave.approvals.lm && leave.approvals.lm.status === "pending") {
          leave.approvals.lm.status = "approved";
          leave.approvals.lm.approverId = currentUser.id;
          leave.approvals.lm.approverName = currentUser.name;
          leave.approvals.lm.updatedAt = timestampStr;

          const lvsWf = (window.WorkflowEngine && typeof window.WorkflowEngine.getWorkflows === "function")
            ? window.WorkflowEngine.getWorkflows().leaves
            : { requireBu: false };
          const requireBu = lvsWf && !!lvsWf.requireBu;

          if (requireBu && !leave.approvals.bu) {
            leave.approvals.bu = { status: "pending", approverName: null, updatedAt: null };
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
        } else if (isBU && leave.approvals.bu && leave.approvals.bu.status === "pending") {
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
        } else if (isAdmin && leave.approvals.gm && leave.approvals.gm.status === "pending") {
          leave.approvals.gm.status = "approved";
          leave.approvals.gm.approverId = currentUser.id;
          leave.approvals.gm.approverName = currentUser.name;
          leave.approvals.gm.updatedAt = timestampStr;

          if (!leave.approvals.hr) {
            leave.status = "approved";
          }

          if (typeof window.addWorkflowNotification === "function") {
            window.addWorkflowNotification({
              userId: leave.userId,
              type: "leave_approval",
              title: "Leave Approved by Admin",
              message: leave.approvals.hr
                ? `System Administrator (${currentUser.name}) approved your leave request and forwarded to HR.`
                : `System Administrator (${currentUser.name}) granted final approval for your leave request.`,
              link: "leaves.html",
              icon: "🏖️",
              badgeClass: "bg-success",
              actorName: currentUser.name,
              action: "approved",
            });
          }

          const msg = leave.approvals.hr
            ? "Approved by Admin. Forwarded to HR."
            : "Final approval granted by Admin.";
          if (typeof showToast === "function") showToast(msg, "success");
          else if (typeof window.showToast === "function")
            window.showToast(msg, "success");
        } else if (isAdmin && leave.approvals.admin && leave.approvals.admin.status === "pending") {
          leave.approvals.admin.status = "approved";
          leave.approvals.admin.approverId = currentUser.id;
          leave.approvals.admin.approverName = currentUser.name;
          leave.approvals.admin.updatedAt = timestampStr;
          const hrPending = leave.approvals.hr && leave.approvals.hr.status === "pending";
          if (!hrPending) {
            leave.status = "approved";
          }

          if (typeof window.addWorkflowNotification === "function") {
            window.addWorkflowNotification({
              userId: leave.userId,
              type: "leave_approval",
              title: "Leave Approved by Admin",
              message: hrPending
                ? `System Administrator (${currentUser.name}) approved your leave request and forwarded to HR.`
                : `System Administrator (${currentUser.name}) granted final approval for your leave request.`,
              link: "leaves.html",
              icon: "🏖️",
              badgeClass: "bg-success",
              actorName: currentUser.name,
              action: "approved",
            });
          }

          if (typeof showToast === "function") {
            showToast(hrPending ? "Approved by Admin. Forwarded to HR." : "Final approval granted by Admin.", "success");
          }
        } else if ((isHR && leave.approvals.hr && leave.approvals.hr.status === "pending") || (isAdmin && leave.approvals.hr && leave.approvals.hr.status === "pending")) {
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
              message: `HR Department approved your ${leave.type || "leave"} request.`,
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

      if (window.store && window.store.leaves && typeof window.store.leaves.save === "function") {
        window.store.leaves.save(leave);
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
    const isWithinGrace = rollover.isValid;
    const effectiveAnnual = isWithinGrace ? (annualTotal + rollover.initialCarriedOver) : annualTotal;

    const leavesList =
      (window.store && window.store.leaves
        ? window.store.leaves.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || demoLeaves;
    const currentYearStr = String(((window.getSystemDate && window.getSystemDate()) || new Date()).getFullYear());
    let used = { annual: 0, casual: 0, sick: 0 };
    leavesList.forEach((l) => {
      if (l.userId === user.id && l.status === "approved") {
        const leaveYear = l.startDate ? String(l.startDate).slice(0, 4) : "";
        if (leaveYear && leaveYear !== currentYearStr) return;
        const d = parseFloat(l.days) || 1;
        if (l.type === "annual") used.annual += d;
        else if (l.type === "casual" || l.type === "emergency") used.casual += d;
        else if (l.type === "sick") used.sick += d;
      }
    });

    if (!isWithinGrace && rollover.initialCarriedOver > 0) {
      used.annual = rollover.consumedFromNewAnnual;
    }

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
    } catch (err) {
      console.warn("Failed to update active user leaveBalance in sessionStorage:", err);
    }

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

// ============================================================================
// Section: Cloud & Store Sync Reactive Listener
// ============================================================================
function reloadLeavesData() {
  if (window.store && window.store.leaves && typeof window.store.leaves.getAll === "function") {
    demoLeaves = window.store.leaves.getAll();
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.leaves)) {
    demoLeaves = window.DEMO_DATA.leaves;
  }
  try {
    if (typeof calculateBalances === "function") calculateBalances();
    if (typeof renderHistory === "function") renderHistory();
    if (typeof renderPendingApprovals === "function") renderPendingApprovals();
    const role = window.normalizeRole
      ? window.normalizeRole(currentUser.role)
      : (currentUser.role || "medical_rep").toLowerCase();
    if ((role === "hr" || role === "admin") && typeof renderHrAllLeaves === "function") {
      renderHrAllLeaves();
    }
  } catch (err) {
    console.error("Error refreshing leaves on cloud/store sync:", err);
  }
}

document.addEventListener("pharma:storage:synced", reloadLeavesData);
document.addEventListener("pharma:store:changed", reloadLeavesData);
