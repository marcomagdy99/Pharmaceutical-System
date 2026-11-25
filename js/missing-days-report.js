function getSafeSystemDate() {
  return (typeof window !== "undefined" && window.getSystemDate && window.getSystemDate()) || new Date();
}

/**
 * @file missing-days-report.js
 * @description Missing Days Report Module (KPIs & Field Discipline Audit).
 * Calculates Working Days (W.D), Field Days (Actual F.D), Non-Field Work (Non F.D / Office / Meetings),
 * Vacations, and Missing Days according to companySettings and User Hierarchy.
 *
 * Scoping rules:
 * - Rep: sees only their own missing days (rep & line locked).
 * - DM: sees reps reporting to them in their line.
 * - LM: sees DMs and reps in their line.
 * - Admin / BU / HR: sees all lines, DMs, and reps.
 */

(function () {
  "use strict";

  // State object for Missing Days Report
  window.missingDaysState = {
    dateFrom: "",
    dateTo: "",
    selectedLineId: "all",
    selectedDmId: "all",
    selectedRepId: "all",
    rows: [],
    detailsModalData: null
  };

  /**
   * Initializes Missing Days filter controls and default date range (Current Month).
   */
  window.initMissingDaysTab = function () {
    const fromInput = document.getElementById("missingDateFrom");
    const toInput = document.getElementById("missingDateTo");

    if (!fromInput || !toInput) return;

    if (!fromInput.value || !toInput.value) {
      const now = getSafeSystemDate();
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstDay = new Date(y, m, 1);
      const today = now;

      fromInput.value = formatDateForInput(firstDay);
      toInput.value = formatDateForInput(today);
    }

    window.populateMissingDaysFilters();
  };

  /**
   * Sets quick date preset (this_month, last_month, last_30_days).
   */
  window.setMissingDaysPreset = function (preset) {
    const fromInput = document.getElementById("missingDateFrom");
    const toInput = document.getElementById("missingDateTo");
    if (!fromInput || !toInput) return;

    const now = getSafeSystemDate();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === "this_month") {
      fromInput.value = formatDateForInput(new Date(y, m, 1));
      toInput.value = formatDateForInput(now);
    } else if (preset === "last_month") {
      fromInput.value = formatDateForInput(new Date(y, m - 1, 1));
      toInput.value = formatDateForInput(new Date(y, m, 0));
    } else if (preset === "last_30_days") {
      const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      fromInput.value = formatDateForInput(past);
      toInput.value = formatDateForInput(now);
    }

    window.missingDaysState.dateFrom = fromInput.value;
    window.missingDaysState.dateTo = toInput.value;
  };

  function formatDateForInput(d) {
    if (window.formatDate) return window.formatDate(d);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Populates Line, DM, and Rep dropdowns according to logged-in user permissions.
   */
  window.populateMissingDaysFilters = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null);
    if (!user || !user.id) return;
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isDM = role === "district_manager" || role === "dm";
    const isLM = role === "line_manager" || role === "lm";
    const isBU = role === "business_unit" || role === "bu" || role === "general_manager" || role === "gm";
    const isPM = role === "product_manager" || role === "pm";
    const isAdminOrHR = role === "admin" || role === "hr";

    const lineSelect = document.getElementById("missingLineSelect");
    const lmSelect = document.getElementById("missingLmSelect");
    const dmSelect = document.getElementById("missingDmSelect");
    const repSelect = document.getElementById("missingRepSelect");

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);

    // 1. Line Filter Population
    if (lineSelect) {
      lineSelect.replaceChildren();
      const userLines = (isPM || isDM || isLM || isBU || isRep) && window.getUserLines ? window.getUserLines(user.id) : [];

      if (isRep) {
        if (userLines.length > 0) {
          const opt = document.createElement("option");
          opt.value = userLines[0].id;
          opt.textContent = userLines[0].name || userLines[0].nameAr;
          lineSelect.appendChild(opt);
          lineSelect.value = userLines[0].id;
        } else {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "No Line Assigned";
          lineSelect.appendChild(opt);
        }
        lineSelect.disabled = true;
      } else if (isDM || isLM || isBU || isPM) {
        if (userLines.length === 0) {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "No Line Assigned";
          lineSelect.appendChild(opt);
          lineSelect.disabled = true;
        } else {
          if (userLines.length > 1) {
            const optAll = document.createElement("option");
            optAll.value = "all";
            optAll.textContent = "All My Lines";
            lineSelect.appendChild(optAll);
          }
          userLines.forEach((l) => {
            const opt = document.createElement("option");
            opt.value = l.id;
            opt.textContent = l.name || l.nameAr;
            lineSelect.appendChild(opt);
          });
          lineSelect.disabled = userLines.length <= 1;
          lineSelect.value = userLines[0]?.id || "all";
        }
      } else if (isAdminOrHR) {
        // Admin / HR / GM: Full Company Access
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "All Product Lines";
        lineSelect.appendChild(optAll);

        allLines.forEach((l) => {
          const opt = document.createElement("option");
          opt.value = l.id;
          opt.textContent = l.name || l.nameAr;
          lineSelect.appendChild(opt);
        });
        lineSelect.disabled = false;
        if (window.selectedReportLineId && window.selectedReportLineId !== "all" && Array.from(lineSelect.options).some((o) => o.value === window.selectedReportLineId)) {
          lineSelect.value = window.selectedReportLineId;
        } else {
          lineSelect.value = "all";
        }
      } else {
        // Unknown role: fail closed
        lineSelect.replaceChildren();
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Access Restricted";
        lineSelect.appendChild(opt);
        lineSelect.disabled = true;
      }
    }

    // 2. LM Filter Population if present
    if (lmSelect) {
      lmSelect.replaceChildren();
      if (isRep || isDM) {
        const myMgr = allUsers.find((u) => u.id === user.managerId);
        const myLm = myMgr && (myMgr.role === "line_manager" || myMgr.role === "lm") ? myMgr : (myMgr && allUsers.find((u) => u.id === myMgr.managerId));
        const opt = document.createElement("option");
        opt.value = myLm ? myLm.id : "";
        opt.textContent = myLm ? myLm.name : "Line Manager";
        lmSelect.appendChild(opt);
        lmSelect.disabled = true;
      } else if (isLM) {
        const opt = document.createElement("option");
        opt.value = user.id;
        opt.textContent = `${user.name} (LM)`;
        lmSelect.appendChild(opt);
        lmSelect.disabled = true;
      } else if (isAdminOrHR || isBU || isPM) {
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "All Line Managers";
        lmSelect.appendChild(optAll);

        let lms = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
          return r === "line_manager" || r === "lm";
        });
        if (isBU) {
          const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
          const subIds = new Set(subs.map((s) => s.id));
          lms = lms.filter((lm) => subIds.has(lm.id));
        } else if (isPM) {
          const pmLineIds = window.getUserLines ? window.getUserLines(user.id).map((l) => l.id) : (user.lineIds || (user.lineId ? [user.lineId] : []));
          lms = pmLineIds.length === 0
            ? []
            : lms.filter((lm) => {
                const lmLines = window.getUserLines ? window.getUserLines(lm.id).map((l) => l.id) : (lm.lineIds || (lm.lineId ? [lm.lineId] : []));
                return lmLines.some((lid) => pmLineIds.includes(lid));
              });
        }
        lms.forEach((lm) => {
          const opt = document.createElement("option");
          opt.value = lm.id;
          opt.textContent = lm.name;
          lmSelect.appendChild(opt);
        });
        lmSelect.disabled = false;
      } else {
        // Unknown role: fail closed
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Access Restricted";
        lmSelect.appendChild(opt);
        lmSelect.disabled = true;
      }
    }

    // Trigger hierarchy cascading
    if (typeof window.onMissingDaysLineChange === "function") {
      window.onMissingDaysLineChange();
    }
  };

  /**
   * Cascading handler when line is changed.
   */
  window.onMissingDaysLineChange = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null);
    if (!user || !user.id) return;
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isDM = role === "district_manager" || role === "dm";
    const isLM = role === "line_manager" || role === "lm";
    const isBU = role === "business_unit" || role === "bu" || role === "general_manager" || role === "gm";
    const isPM = role === "product_manager" || role === "pm";
    const isAdminOrHR = role === "admin" || role === "hr";
    
    const lineSelect = document.getElementById("missingLineSelect");
    const dmSelect = document.getElementById("missingDmSelect");

    const selectedLine = window.selectedReportLineId || (lineSelect && lineSelect.value ? lineSelect.value : "all");
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    // DM Filter
    if (dmSelect) {
      dmSelect.replaceChildren();
      if (isRep) {
        // Rep's manager
        const myMgr = allUsers.find((u) => u.id === user.managerId);
        const opt = document.createElement("option");
        opt.value = myMgr ? myMgr.id : "";
        opt.textContent = myMgr ? myMgr.name : "Direct Manager";
        dmSelect.appendChild(opt);
        dmSelect.disabled = true;
      } else if (isDM) {
        const opt = document.createElement("option");
        opt.value = user.id;
        opt.textContent = `${user.name} (DM)`;
        dmSelect.appendChild(opt);
        dmSelect.disabled = true;
      } else if (isAdminOrHR || isLM || isBU || isPM) {
        // Admin or LM or BU or PM
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "All District Managers";
        dmSelect.appendChild(optAll);

        let dms = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
          return r === "district_manager" || r === "dm";
        });

        if (isLM || isBU) {
          const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
          const subIds = new Set(subs.map((s) => s.id));
          dms = dms.filter((dm) => subIds.has(dm.id));
        }

        if (isPM) {
          const pmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
          const pmLineIds = pmLines.map((l) => l.id);
          dms = dms.filter((dm) => {
            const uLines = typeof window.getUserLines === "function" ? window.getUserLines(dm.id).map((l) => l.id) : [];
            const dmLines = uLines.length > 0 ? uLines : (dm.lineIds || (dm.lineId ? [dm.lineId] : []));
            return dmLines.some((id) => pmLineIds.includes(id));
          });
        }

        if (selectedLine && selectedLine !== "all") {
          dms = dms.filter((dm) => {
            const uLines = typeof window.getUserLines === "function" ? window.getUserLines(dm.id).map((l) => l.id) : [];
            const lines = uLines.length > 0 ? uLines : (dm.lineIds || (dm.lineId ? [dm.lineId] : []));
            return lines.includes(selectedLine);
          });
        }

        dms.forEach((dm) => {
          const opt = document.createElement("option");
          opt.value = dm.id;
          opt.textContent = dm.name;
          dmSelect.appendChild(opt);
        });
        dmSelect.disabled = false;
      } else {
        // Unknown role: fail closed
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Access Restricted";
        dmSelect.appendChild(opt);
        dmSelect.disabled = true;
      }
    }

    if (typeof window.onMissingDaysDmChange === "function") {
      window.onMissingDaysDmChange();
    }
  };

  /**
   * Cascading handler when DM is changed.
   */
  window.onMissingDaysDmChange = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null);
    if (!user || !user.id) return;
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isPM = role === "product_manager" || role === "pm";
    const isAdminOrHR = role === "admin" || role === "hr";

    const lineSelect = document.getElementById("missingLineSelect");
    const dmSelect = document.getElementById("missingDmSelect");
    const repSelect = document.getElementById("missingRepSelect");

    if (!repSelect) return;
    repSelect.replaceChildren();

    if (isRep) {
      const opt = document.createElement("option");
      opt.value = user.id;
      opt.textContent = `${user.name} (${user.employeeCode || "Rep"})`;
      repSelect.appendChild(opt);
      repSelect.disabled = true;
      return;
    }

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "All Medical Reps";
    repSelect.appendChild(optAll);

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const selectedLine = window.selectedReportLineId || (lineSelect && lineSelect.value ? lineSelect.value : "all");
    const selectedDm = (dmSelect && dmSelect.value) ? dmSelect.value : "all";

    let reps = allUsers.filter((u) => {
      const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
      return (r === "medical_rep" || r === "rep") && u.status !== "Inactive";
    });

    if (role === "district_manager" || role === "dm") {
      reps = reps.filter((r) => r.managerId === user.id);
    } else if (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu" || role === "general_manager" || role === "gm") {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subIds = new Set(subs.map((s) => s.id));
      reps = reps.filter((r) => subIds.has(r.id));
      if (selectedDm !== "all") {
        reps = reps.filter((r) => r.managerId === selectedDm);
      }
    } else if (isPM) {
      const pmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
      const pmLineIds = pmLines.map(l => l.id);
      reps = reps.filter((r) => {
        const userLines = typeof window.getUserLines === "function" ? window.getUserLines(r.id).map(l => l.id) : [];
        const rLines = userLines.length > 0 ? userLines : (r.lineIds || (r.lineId ? [r.lineId] : []));
        return rLines.some(id => pmLineIds.includes(id));
      });
      if (selectedDm !== "all") {
        reps = reps.filter((r) => r.managerId === selectedDm);
      }
    } else if (isAdminOrHR) {
      if (selectedDm !== "all") {
        reps = reps.filter((r) => r.managerId === selectedDm);
      }
    } else {
      // Unknown role: fail closed
      reps = [];
    }

    if (selectedLine !== "all") {
      reps = reps.filter((r) => {
        const userLines = typeof window.getUserLines === "function" ? window.getUserLines(r.id).map((l) => l.id) : [];
        const lines = userLines.length > 0 ? userLines : (r.lineIds || (r.lineId ? [r.lineId] : []));
        return lines.includes(selectedLine);
      });
    }

    reps.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `${r.name} (${r.employeeCode || "Rep"})`;
      repSelect.appendChild(opt);
    });
    repSelect.disabled = false;
  };

  window.onMissingDaysFilterChange = function () {
    // Filter updated; render strictly on Show button click
  };

  /**
   * Helper to parse date string YYYY-MM-DD into local Date
   */
  function parseLocalDate(str) {
    if (!str) return null;
    const parts = str.split("-");
    if (parts.length < 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  /**
   * Helper to retrieve list of company public holiday date strings (YYYY-MM-DD)
   */
  function getPublicHolidaysList(companySettings) {
    let list = [];
    if (typeof window !== "undefined" && window.store && window.store.publicHolidays && typeof window.store.publicHolidays.getAll === "function") {
      list = window.store.publicHolidays.getAll() || [];
    } else if (typeof window !== "undefined" && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.publicHolidays)) {
      list = window.DEMO_DATA.publicHolidays;
    } else if (companySettings && Array.isArray(companySettings.publicHolidays)) {
      list = companySettings.publicHolidays;
    }
    return list.map((h) => (typeof h === "string" ? h : h?.date)).filter(Boolean);
  }

  /**
   * Calculates Working Days (W.D) in date range excluding company-defined weekends and public holidays.
   * If secondary weekend is pm_only (half-day off), each such day contributes 0.5 to working days.
   */
  function calculateWorkingDays(startDate, endDate, companySettings) {
    if (!startDate || !endDate || startDate > endDate) return 0;
    const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
    const secMode = companySettings?.secondaryWeekendMode || "full_day";
    const holidays = getPublicHolidaysList(companySettings);

    let workingDays = 0;
    const cur = new Date(startDate.getTime());
    let safetyCounter = 0;
    const maxDays = 366;

    while (cur <= endDate && safetyCounter < maxDays) {
      safetyCounter++;
      const dStr = formatDateForInput(cur);
      const dayOfWeek = cur.getDay(); // 0: Sun, 1: Mon, ..., 4: Thu, 5: Fri, 6: Sat

      if (dayOfWeek === 5) {
        // Friday is statutory full weekend
      } else if ((secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4)) {
        if (secMode === "pm_only" && !holidays.includes(dStr)) {
          workingDays += 0.5; // AM work, PM off
        }
        // if full_day -> 0
      } else if (holidays.includes(dStr)) {
        // Statutory public holiday: 0 working days
      } else {
        workingDays += 1;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return workingDays;
  }

  /**
   * Main calculation and rendering function for Missing Days Report.
   */
  window.renderMissingDaysReport = function () {
    const fromInput = document.getElementById("missingDateFrom");
    const toInput = document.getElementById("missingDateTo");
    const lineSelect = document.getElementById("missingLineSelect");
    const dmSelect = document.getElementById("missingDmSelect");
    const repSelect = document.getElementById("missingRepSelect");

    if (!fromInput || !toInput) return;

    const fromDateStr = fromInput.value;
    const toDateStr = toInput.value;

    if (!fromDateStr || !toDateStr) {
      if (typeof window.showToast === "function") {
        window.showToast("Please select both From and To dates.", "warning");
      }
      return;
    }

    const startDate = parseLocalDate(fromDateStr);
    const endDate = parseLocalDate(toDateStr);

    if (!startDate || !endDate || startDate > endDate) {
      if (typeof window.showToast === "function" && startDate && endDate && startDate > endDate) {
        window.showToast("From Date cannot be later than To Date.", "warning");
      }
      return;
    }

    // Toggle Prompt & Results Container
    const promptEl = document.getElementById("missingDaysPromptContainer");
    const resultsEl = document.getElementById("missingDaysResultsContainer");
    if (promptEl) promptEl.style.display = "none";
    if (resultsEl) resultsEl.style.display = "block";

    // Period Pill Label
    const periodPill = document.getElementById("missingDaysPeriodPill");
    if (periodPill) {
      periodPill.textContent = `Period: ${fromDateStr} to ${toDateStr}`;
    }

    const user = (typeof checkAuth === "function" ? checkAuth() : null);
    if (!user || !user.id) return;
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    
    const lmSelect = document.getElementById("missingLmSelect");
    const selectedLm = (lmSelect && lmSelect.value) ? lmSelect.value : "all";
    const selectedLine = window.selectedReportLineId || (lineSelect && lineSelect.value ? lineSelect.value : "all");
    const selectedDm = (dmSelect && dmSelect.value) ? dmSelect.value : "all";
    const selectedRep = (repSelect && repSelect.value) ? repSelect.value : "all";

    window.missingDaysState.dateFrom = fromDateStr;
    window.missingDaysState.dateTo = toDateStr;
    window.missingDaysState.selectedLineId = selectedLine;
    window.missingDaysState.selectedDmId = selectedDm;
    window.missingDaysState.selectedRepId = selectedRep;

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);
    const companySettings = (window.store && window.store.companySettings ? window.store.companySettings.get() : {}) || {};
    const minVisitsForFieldDay = Math.max(1, parseInt(companySettings.minPmVisitsPerDay || 4, 10));

    // Cap working days and expected field days calculation to today if the selected period extends into the future
    const today = (typeof window.getSystemDate === "function" ? window.getSystemDate() : new Date());
    const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || formatDateForInput(today);
    const todayDate = parseLocalDate(todayStr) || today;
    todayDate.setHours(23, 59, 59, 999);

    let effectiveEndDate = endDate;
    let totalWorkingDays = 0;

    if (startDate > todayDate) {
      // Period is entirely in the future: working days and target are 0
      effectiveEndDate = null;
      totalWorkingDays = 0;
    } else {
      effectiveEndDate = endDate > todayDate ? todayDate : endDate;
      totalWorkingDays = calculateWorkingDays(startDate, effectiveEndDate, companySettings);
    }

    // Target Field Days (standard is working days minus 1 buffer day for monthly meeting/admin, or min 1)
    const defaultTargetFd = totalWorkingDays > 0 ? Math.max(1, totalWorkingDays > 20 ? totalWorkingDays - 1 : totalWorkingDays) : 0;

    // Filter Reps in scope
    let targetReps = allUsers.filter((u) => {
      const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
      return (r === "medical_rep" || r === "rep") && u.status !== "Inactive";
    });

    const isPM = role === "product_manager" || role === "pm";
    const isAdminOrHR = role === "admin" || role === "hr";

    if (isRep) {
      targetReps = targetReps.filter((r) => r.id === user.id);
    } else if (role === "district_manager" || role === "dm") {
      targetReps = targetReps.filter((r) => r.managerId === user.id);
    } else if (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu" || role === "general_manager" || role === "gm") {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subIds = new Set(subs.map((s) => s.id));
      targetReps = targetReps.filter((r) => subIds.has(r.id));
    } else if (isPM) {
      const pmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
      const pmLineIds = pmLines.map(l => l.id);
      if (pmLineIds.length === 0) {
        targetReps = [];
      } else {
        targetReps = targetReps.filter((r) => {
          const uLines = typeof window.getUserLines === "function" ? window.getUserLines(r.id).map(l => l.id) : [];
          const rLines = uLines.length > 0 ? uLines : (r.lineIds || (r.lineId ? [r.lineId] : []));
          return rLines.some(id => pmLineIds.includes(id));
        });
      }
    } else if (isAdminOrHR) {
      // Allowed all company reps
    } else {
      // Unknown or unauthorized role: fail closed!
      targetReps = [];
    }

    if (selectedLm && selectedLm !== "all") {
      const lmDmIds = allUsers.filter((u) => u.managerId === selectedLm).map((u) => u.id);
      targetReps = targetReps.filter((r) => r.managerId === selectedLm || lmDmIds.includes(r.managerId));
    }

    if (selectedDm && selectedDm !== "all") {
      targetReps = targetReps.filter((r) => r.managerId === selectedDm);
    }

    if (selectedLine && selectedLine !== "all") {
      targetReps = targetReps.filter((r) => {
        const uLines = typeof window.getUserLines === "function" ? window.getUserLines(r.id).map((l) => l.id) : [];
        const lines = uLines.length > 0 ? uLines : (r.lineIds || (r.lineId ? [r.lineId] : []));
        return lines.includes(selectedLine);
      });
    }

    if (selectedRep && selectedRep !== "all") {
      targetReps = targetReps.filter((r) => r.id === selectedRep);
    }

    // Pull visits, leaves, activities
    const allVisits = (window.store && window.store.visits ? window.store.visits.getAll() : (window.DEMO_DATA && window.DEMO_DATA.visits) || []);
    const allLeaves = (window.store && window.store.leaves ? window.store.leaves.getAll() : (window.DEMO_DATA && window.DEMO_DATA.leaves) || []);

    const rows = [];
    let sumTotalMissing = 0;
    let sumActualFd = 0;

    targetReps.forEach((rep) => {
      // 1. Line info
      const repLines = rep.lineIds || (rep.lineId ? [rep.lineId] : []);
      const matchedLine = allLines.find((l) => repLines.includes(l.id)) || { name: "Unassigned" };
      const lineName = matchedLine.name || matchedLine.nameAr || "Unassigned";

      // 2. DM & AM info (support direct reporting to LM)
      const mgr = allUsers.find((u) => u.id === rep.managerId);
      const mgrRole = mgr ? (window.normalizeRole ? window.normalizeRole(mgr.role) : (mgr.role || "").toLowerCase()) : "";
      let dmName = "—";
      let amName = "—";

      if (mgrRole === "line_manager" || mgrRole === "lm") {
        dmName = "—";
        amName = mgr.name;
      } else if (mgrRole === "district_manager" || mgrRole === "dm") {
        dmName = mgr.name;
        const lm = allUsers.find((u) => u.id === mgr.managerId);
        amName = lm ? lm.name : "—";
      } else {
        dmName = mgr ? mgr.name : (rep.managerName || "—");
        amName = "—";
      }

      // 3. Hiring date adjustment (if hired after startDate)
      let repWorkingDays = totalWorkingDays;
      let repEffectiveStart = startDate;

      if (!effectiveEndDate) {
        repWorkingDays = 0;
      } else if (rep.hireDate) {
        const hireDate = parseLocalDate(rep.hireDate);
        if (hireDate && hireDate > startDate && hireDate <= effectiveEndDate) {
          repEffectiveStart = hireDate;
          repWorkingDays = calculateWorkingDays(hireDate, effectiveEndDate, companySettings);
        } else if (hireDate && hireDate > effectiveEndDate) {
          // Not hired yet in this period
          repWorkingDays = 0;
        }
      }

      const repTargetFd = repWorkingDays > 0 ? Math.max(1, repWorkingDays > 20 ? repWorkingDays - 1 : repWorkingDays) : 0;

      // 4. Calculate Actual Field Days (Completed visits count per day in range)
      const repVisits = (!effectiveEndDate) ? [] : allVisits.filter((v) => {
        if (!v || v.repId !== rep.id) return false;
        const vDate = parseLocalDate(v.date || v.visitDate);
        if (!vDate) return false;
        if (vDate < repEffectiveStart || vDate > effectiveEndDate) return false;
        const vStat = (v.status || "").toLowerCase();
        return vStat === "completed" || vStat === "executed" || !v.status;
      });

      // Map visits by date
      const visitsByDate = {};
      repVisits.forEach((v) => {
        const dStr = v.date || v.visitDate;
        visitsByDate[dStr] = (visitsByDate[dStr] || 0) + 1;
      });

      // Days where rep achieved field visit activity (1 or more visits)
      const fieldDates = Object.keys(visitsByDate).filter((d) => visitsByDate[d] >= 1);
      const actualFd = fieldDates.length;

      // 5. Calculate Non-Field Days (Office / Meetings / Activities)
      let nonFd = 0;
      const nonFdDates = [];
      if (effectiveEndDate) {
        const userActivitiesObj = (window.store && window.store.activities && typeof window.store.activities.getAllForUser === "function" ? window.store.activities.getAllForUser(rep.id) : {}) || {};
        Object.keys(userActivitiesObj).forEach((actDateStr) => {
          const dayActs = userActivitiesObj[actDateStr];
          if (!dayActs || (!dayActs.AM && !dayActs.PM)) return;
          const actDate = parseLocalDate(actDateStr);
          if (!actDate) return;
          if (actDate >= repEffectiveStart && actDate <= effectiveEndDate) {
            if (!visitsByDate[actDateStr]) {
              nonFdDates.push(actDateStr);
            }
          }
        });
      }
      nonFd = nonFdDates.length;

      // 6. Calculate Vacations in range (deduplicated, approved only, excluding field and office days)
      let vacationDays = 0;
      const vacationDates = [];
      const holidaysList = getPublicHolidaysList(companySettings);

      if (effectiveEndDate) {
        const repLeaves = allLeaves.filter((l) => (l.userId === rep.id || l.repId === rep.id) && (l.status || "").toLowerCase() === "approved");
        repLeaves.forEach((leave) => {
          const lStart = parseLocalDate(leave.startDate);
          const lEnd = parseLocalDate(leave.endDate || leave.startDate);
          if (!lStart || !lEnd) return;

          let curL = new Date(Math.max(lStart.getTime(), repEffectiveStart.getTime()));
          const limitL = new Date(Math.min(lEnd.getTime(), effectiveEndDate.getTime()));
          const isHalfDay = leave.type === "half_day" || leave.dayDuration === "half" || leave.duration === 0.5 || Number(leave.days) === 0.5;
          let safetyL = 0;

          while (curL <= limitL && safetyL < 366) {
            safetyL++;
            const dStr = formatDateForInput(curL);
            const dayOfWeek = curL.getDay();
            const isFriday = dayOfWeek === 5;
            const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
            const secMode = companySettings?.secondaryWeekendMode || "full_day";
            const isSecondaryFullOff = ((secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4)) && secMode === "full_day";
            const isHoliday = holidaysList.includes(dStr);

            if (!isFriday && !isSecondaryFullOff && !isHoliday && !fieldDates.includes(dStr) && !nonFdDates.includes(dStr) && !vacationDates.includes(dStr)) {
              vacationDays += (isHalfDay ? 0.5 : 1);
              vacationDates.push(dStr);
            }
            curL.setDate(curL.getDate() + 1);
          }
        });
      }

      // 7. Missing Days Equation: Target F.D - (Actual F.D + Non F.D + Vacation)
      const missing = repTargetFd > 0 ? (repTargetFd - (actualFd + nonFd + vacationDays)) : 0;

      sumTotalMissing += Math.max(0, missing);
      sumActualFd += actualFd;

      rows.push({
        repId: rep.id,
        repName: rep.name,
        employeeCode: rep.employeeCode || "—",
        lineName,
        amName,
        dmName,
        hireDate: rep.hireDate || "—",
        monthLabel: startDate.toLocaleString("en", { month: "short" }),
        quarter: Math.floor(startDate.getMonth() / 3) + 1,
        wd: repWorkingDays,
        targetFd: repTargetFd,
        actualFd,
        nonFd,
        vacationDays,
        missing,
        fieldDates,
        nonFdDates,
        vacationDates,
        effectiveStartDate: repEffectiveStart,
        endDate
      });
    });

    window.missingDaysState.rows = rows;

    // Render KPI Cards
    renderMissingDaysKpis(rows.length, totalWorkingDays, sumActualFd, sumTotalMissing);

    // Render Table
    renderMissingDaysTable(rows);
  };

  /**
   * Renders the top KPI cards row.
   */
  function renderMissingDaysKpis(repCount, wd, totalActualFd, totalMissing) {
    const kpiReps = document.getElementById("kpiMissingTotalReps");
    const kpiWd = document.getElementById("kpiMissingWorkingDays");
    const kpiActualFd = document.getElementById("kpiMissingActualFd");
    const kpiMissing = document.getElementById("kpiMissingTotalCount");

    if (kpiReps) kpiReps.textContent = repCount;
    if (kpiWd) kpiWd.textContent = wd;
    if (kpiActualFd) kpiActualFd.textContent = totalActualFd;
    if (kpiMissing) {
      kpiMissing.textContent = totalMissing;
      kpiMissing.style.color = totalMissing > 0 ? "var(--danger, #dc3545)" : "var(--success, #198754)";
    }
  }

  /**
   * Renders the Missing Days Table with PharmaCare design system.
   */
  function renderMissingDaysTable(rows) {
    const tbody = document.getElementById("missingDaysReportTbody");
    if (!tbody) return;

    tbody.replaceChildren();

    if (rows.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="13" class="text-center py-4 text-muted">No medical reps found for the selected scope.</td>`;
      tbody.appendChild(tr);
      return;
    }

    const escape = (s) => (typeof window.escapeHtml === "function" ? window.escapeHtml(s) : String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));

    rows.forEach((r) => {
      const tr = document.createElement("tr");

      // Badge styling for Missing Days
      let missingBadge = "";
      if (r.missing > 0) {
        missingBadge = `<span class="badge badge-missing-alert"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> +${r.missing} Day${r.missing > 1 ? 's' : ''}</span>`;
      } else if (r.missing === 0) {
        missingBadge = `<span class="badge badge-missing-full"><svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><polyline points="20 6 9 17 4 12"/></svg> 0 (Full)</span>`;
      } else {
        missingBadge = `<span class="badge badge-missing-over"><svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><polyline points="20 6 9 17 4 12"/></svg> ${r.missing} (Over)</span>`;
      }

      tr.innerHTML = `
        <td style="font-weight:600;"><span class="badge badge-missing-line">${escape(r.lineName)}</span></td>
        <td class="text-muted">${escape(r.amName)}</td>
        <td style="font-weight:600; color:var(--gray-800);">${escape(r.dmName)}</td>
        <td style="font-weight:700; color:var(--primary); cursor:pointer;" class="btn-missing-details" data-rep-id="${r.repId}" title="Click to view full days breakdown">
          <svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${escape(r.repName)}
        </td>
        <td style="font-size:0.82rem; color:var(--gray-500);">${escape(r.hireDate)}</td>
        <td style="text-align:center; font-weight:600;">${r.monthLabel}</td>
        <td style="text-align:center;">Q${r.quarter}</td>
        <td style="text-align:center; font-weight:700;">${r.wd}</td>
        <td style="text-align:center; font-weight:700; color:var(--primary);">${r.targetFd}</td>
        <td style="text-align:center; font-weight:700; color:var(--success); background:rgba(25,135,84,0.04);">${r.actualFd}</td>
        <td style="text-align:center; font-weight:600; color:var(--info);">${r.nonFd}</td>
        <td style="text-align:center; font-weight:600; color:var(--warning);">${r.vacationDays}</td>
        <td style="text-align:center; cursor:pointer;" class="btn-missing-details" data-rep-id="${r.repId}" title="View breakdown">
          ${missingBadge}
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (!tbody.dataset) tbody.dataset = {};
    if (!tbody.dataset.eventsBound) {
      tbody.dataset.eventsBound = "true";
      tbody.addEventListener("click", (e) => {
        const item = e.target.closest(".btn-missing-details");
        if (item && item.dataset.repId) {
          openMissingDaysDetailsModal(item.dataset.repId);
        }
      });
    }
  }

  /**
   * Opens Drilldown Modal showing the full calendar breakdown for the selected rep.
   */
  window.openMissingDaysDetailsModal = function (repId) {
    const repData = window.missingDaysState.rows.find((r) => r.repId === repId);
    if (!repData) return;

    const modal = document.getElementById("missingDaysDetailsModal");
    const repNameEl = document.getElementById("modalMissingRepName");
    const summaryEl = document.getElementById("modalMissingSummaryText");
    const listEl = document.getElementById("modalMissingDaysList");

    if (!modal) return;

    if (repNameEl) repNameEl.textContent = `${repData.repName} (${repData.lineName})`;
    if (summaryEl) {
      summaryEl.innerHTML = `
        <strong>Working Days:</strong> ${repData.wd} | 
        <strong>Field Days:</strong> <span style="color:var(--success)">${repData.actualFd}</span> | 
        <strong>Office/Meetings:</strong> <span style="color:var(--info)">${repData.nonFd}</span> | 
        <strong>Vacations:</strong> <span style="color:var(--warning)">${repData.vacationDays}</span> | 
        <strong>Missing:</strong> <span style="color:${repData.missing > 0 ? 'red' : 'green'}; font-weight:bold;">${repData.missing}</span>
      `;
    }

    if (listEl) {
      listEl.replaceChildren();

      const companySettings = (window.store && window.store.companySettings ? window.store.companySettings.get() : {}) || {};
      const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
      const secMode = companySettings?.secondaryWeekendMode || "full_day";
      const holidaysList = getPublicHolidaysList(companySettings);

      const today = (typeof window.getSystemDate === "function" ? window.getSystemDate() : new Date());
      const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || formatDateForInput(today);
      const todayDate = parseLocalDate(todayStr) || today;
      todayDate.setHours(23, 59, 59, 999);

      const cur = new Date(repData.effectiveStartDate.getTime());
      let safetyModal = 0;
      const maxModalDays = 366;

      while (cur <= repData.endDate && safetyModal < maxModalDays) {
        safetyModal++;
        const dStr = formatDateForInput(cur);
        const dayOfWeek = cur.getDay();
        const isFriday = dayOfWeek === 5;
        const isSecondaryDay = (secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4);
        const isHoliday = holidaysList.includes(dStr);

        const item = document.createElement("div");
        const dayName = cur.toLocaleDateString("en", { weekday: "short" });

        if (isHoliday) {
          item.className = "missing-day-item missing-day-weekend";
          item.innerHTML = `<span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge bg-secondary">Public Holiday</span>`;
        } else if (isFriday || (isSecondaryDay && secMode === "full_day")) {
          item.className = "missing-day-item missing-day-weekend";
          item.innerHTML = `<span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge bg-secondary">Weekend</span>`;
        } else if (isSecondaryDay && secMode === "pm_only" && !repData.fieldDates.includes(dStr) && !repData.nonFdDates.includes(dStr) && !repData.vacationDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-pm-weekend";
          item.innerHTML = `<span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge badge-pm-weekend">PM Weekend (AM Work Available)</span>`;
        } else if (repData.fieldDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-field";
          item.innerHTML = `<span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge bg-success">Field Day (Visits Logged)</span>`;
        } else if (repData.nonFdDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-office";
          item.innerHTML = `<span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge bg-info text-dark">Office / Activity</span>`;
        } else if (repData.vacationDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-vacation";
          item.innerHTML = `<span><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge bg-warning text-dark">Vacation</span>`;
        } else if (cur > todayDate) {
          item.className = "missing-day-item missing-day-upcoming";
          item.innerHTML = `<span class="text-muted"><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge badge-upcoming">Upcoming</span>`;
        } else {
          // Missing Day!
          item.className = "missing-day-item missing-day-missing";
          item.innerHTML = `<span class="missing-day-missing-text"><svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dStr} (${dayName})</span> <span class="badge bg-danger">Missing / No Log</span>`;
        }

        listEl.appendChild(item);
        cur.setDate(cur.getDate() + 1);
      }
    }

    modal.style.display = "flex";
  };

  window.closeMissingDaysDetailsModal = function () {
    const modal = document.getElementById("missingDaysDetailsModal");
    if (modal) modal.style.display = "none";
  };

  /**
   * Exports Missing Days table to CSV / Excel.
   */
  window.exportMissingDaysReport = function () {
    const rows = window.missingDaysState.rows;
    if (!rows || rows.length === 0) {
      if (typeof window.showToast === "function") {
        window.showToast("No data available to export.", "info");
      }
      return;
    }

    const headers = [
      "Line", "AM", "DM", "Medical Rep", "Hiring Date",
      "Month", "Quarter", "Working Days (W.D)", "Target F.D",
      "Actual F.D", "Non F.D", "Vacation", "Missing Days"
    ];

    const dataRows = rows.map((r) => [
      r.lineName,
      r.amName,
      r.dmName,
      r.repName,
      r.hireDate,
      r.monthLabel,
      `Q${r.quarter}`,
      r.wd,
      r.targetFd,
      r.actualFd,
      r.nonFd,
      r.vacationDays,
      r.missing
    ]);

    const fromDate = window.missingDaysState.dateFrom || document.getElementById("missingDateFrom")?.value || "start";
    const toDate = window.missingDaysState.dateTo || document.getElementById("missingDateTo")?.value || "end";
    const fileName = `Missing_Days_Report_${fromDate}_to_${toDate}`;
    const sheetTitle = "Missing Days";

    if (typeof window.downloadExcelOrCsv === "function") {
      window.downloadExcelOrCsv(fileName, sheetTitle, dataRows, headers);
    } else {
      const escapeCsv = (val) => {
        let s = val === null || val === undefined ? "" : String(val);
        if (/^[=@\t\r]|(^[+-](?![\d\s().-]+$))/.test(s)) {
          s = "'" + s;
        }
        if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      const csvContent = [headers.map(escapeCsv).join(","), ...dataRows.map((r) => r.map(escapeCsv).join(","))].join("\r\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };


})();
