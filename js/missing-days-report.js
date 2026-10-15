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
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstDay = new Date(y, m, 1);
      const today = now;

      fromInput.value = formatDateForInput(firstDay);
      toInput.value = formatDateForInput(today);
    }

    populateMissingDaysFilters();
  };

  /**
   * Sets quick date preset (this_month, last_month, last_30_days).
   */
  window.setMissingDaysPreset = function (preset) {
    const fromInput = document.getElementById("missingDateFrom");
    const toInput = document.getElementById("missingDateTo");
    if (!fromInput || !toInput) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === "this_month") {
      fromInput.value = formatDateForInput(new Date(y, m, 1));
      toInput.value = formatDateForInput(now);
    } else if (preset === "last_month") {
      fromInput.value = formatDateForInput(new Date(y, m - 1, 1));
      toInput.value = formatDateForInput(new Date(y, m, 0));
    } else if (preset === "last_30_days") {
      const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      fromInput.value = formatDateForInput(past);
      toInput.value = formatDateForInput(now);
    }

    renderMissingDaysReport();
  };

  function formatDateForInput(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Populates Line, DM, and Rep dropdowns according to logged-in user permissions.
   */
  window.populateMissingDaysFilters = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isDM = role === "district_manager" || role === "dm";
    const isLM = role === "line_manager" || role === "lm";
    const isBU = role === "business_unit" || role === "bu";
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    
    const lineSelect = document.getElementById("missingLineSelect");
    const dmSelect = document.getElementById("missingDmSelect");
    const repSelect = document.getElementById("missingRepSelect");

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);

    // 1. Line Filter Population
    if (lineSelect) {
      lineSelect.replaceChildren();
      const userLines = window.getUserLines ? window.getUserLines(user.id) : [];

      if (isRep) {
        if (userLines.length > 0) {
          const opt = document.createElement("option");
          opt.value = userLines[0].id;
          opt.textContent = `📦 ${userLines[0].name || userLines[0].nameAr}`;
          lineSelect.appendChild(opt);
          lineSelect.value = userLines[0].id;
        } else {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "No Line Assigned";
          lineSelect.appendChild(opt);
        }
        lineSelect.disabled = true;
      } else if (isDM || isLM || isBU) {
        if (userLines.length > 1) {
          const optAll = document.createElement("option");
          optAll.value = "all";
          optAll.textContent = "🌐 All My Lines";
          lineSelect.appendChild(optAll);
        }
        userLines.forEach((l) => {
          const opt = document.createElement("option");
          opt.value = l.id;
          opt.textContent = `📦 ${l.name || l.nameAr}`;
          lineSelect.appendChild(opt);
        });
        lineSelect.disabled = userLines.length <= 1;
        lineSelect.value = userLines[0]?.id || "all";
      } else {
        // Admin / BU
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "🌐 All Product Lines";
        lineSelect.appendChild(optAll);

        allLines.forEach((l) => {
          const opt = document.createElement("option");
          opt.value = l.id;
          opt.textContent = `📦 ${l.name || l.nameAr}`;
          lineSelect.appendChild(opt);
        });
        lineSelect.disabled = false;
        lineSelect.value = "all";
      }
    }

    // Trigger hierarchy cascading
    onMissingDaysLineChange();
  };

  /**
   * Cascading handler when line is changed.
   */
  window.onMissingDaysLineChange = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isDM = role === "district_manager" || role === "dm";
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    
    const lineSelect = document.getElementById("missingLineSelect");
    const dmSelect = document.getElementById("missingDmSelect");
    const repSelect = document.getElementById("missingRepSelect");

    const selectedLine = lineSelect ? lineSelect.value : "all";
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
      } else {
        // Admin or LM
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "👥 All District Managers";
        dmSelect.appendChild(optAll);

        let dms = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
          return r === "district_manager" || r === "dm";
        });

        if (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu") {
          const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
          const subIds = new Set(subs.map((s) => s.id));
          dms = dms.filter((dm) => subIds.has(dm.id));
        }

        if (selectedLine !== "all") {
          dms = dms.filter((dm) => {
            const lines = dm.lineIds || (dm.lineId ? [dm.lineId] : []);
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
      }
    }

    onMissingDaysDmChange();
  };

  /**
   * Cascading handler when DM is changed.
   */
  window.onMissingDaysDmChange = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    
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
    optAll.textContent = "👤 All Medical Reps";
    repSelect.appendChild(optAll);

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const selectedLine = lineSelect ? lineSelect.value : "all";
    const selectedDm = dmSelect ? dmSelect.value : "all";

    let reps = allUsers.filter((u) => {
      const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
      return (r === "medical_rep" || r === "rep") && u.status !== "Inactive";
    });

    if (role === "district_manager" || role === "dm") {
      reps = reps.filter((r) => r.managerId === user.id);
    } else if (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu") {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subIds = new Set(subs.map((s) => s.id));
      reps = reps.filter((r) => subIds.has(r.id));
      if (selectedDm !== "all") {
        reps = reps.filter((r) => r.managerId === selectedDm);
      }
    } else if (selectedDm !== "all") {
      reps = reps.filter((r) => r.managerId === selectedDm);
    }

    if (selectedLine !== "all") {
      reps = reps.filter((r) => {
        const lines = r.lineIds || (r.lineId ? [r.lineId] : []);
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
   * Calculates Working Days (W.D) in date range excluding company-defined weekends.
   * If secondary weekend is pm_only (half-day off), each such day contributes 0.5 to working days.
   */
  function calculateWorkingDays(startDate, endDate, companySettings) {
    const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
    const secMode = companySettings?.secondaryWeekendMode || "full_day";

    let workingDays = 0;
    const cur = new Date(startDate.getTime());

    while (cur <= endDate) {
      const dayOfWeek = cur.getDay(); // 0: Sun, 1: Mon, ..., 4: Thu, 5: Fri, 6: Sat

      if (dayOfWeek === 5) {
        // Friday is statutory full weekend
      } else if ((secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4)) {
        if (secMode === "pm_only") {
          workingDays += 0.5; // AM work, PM off
        }
        // if full_day -> 0
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

    if (startDate > endDate) {
      if (typeof window.showToast === "function") {
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
      periodPill.textContent = `📅 Period: ${fromDateStr} to ${toDateStr}`;
    }

    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    
    const selectedLine = lineSelect ? lineSelect.value : "all";
    const selectedDm = dmSelect ? dmSelect.value : "all";
    const selectedRep = repSelect ? repSelect.value : "all";

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);
    const companySettings = (window.store && window.store.companySettings ? window.store.companySettings.get() : {}) || {};
    const minVisitsForFieldDay = Math.max(1, parseInt(companySettings.minPmVisitsPerDay || 4, 10));

    // Cap working days and expected field days calculation to today if the selected period extends into the future
    const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || formatDateForInput(new Date());
    const todayDate = parseLocalDate(todayStr) || new Date();
    todayDate.setHours(23, 59, 59, 999);
    const effectiveEndDate = endDate > todayDate ? (todayDate >= startDate ? todayDate : startDate) : endDate;

    // Working days in period (capped to today for in-progress periods)
    const totalWorkingDays = calculateWorkingDays(startDate, effectiveEndDate, companySettings);

    // Target Field Days (standard is working days minus 1 buffer day for monthly meeting/admin, or min 1)
    const defaultTargetFd = Math.max(1, totalWorkingDays > 20 ? totalWorkingDays - 1 : totalWorkingDays);

    // Filter Reps in scope
    let targetReps = allUsers.filter((u) => {
      const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
      return (r === "medical_rep" || r === "rep") && u.status !== "Inactive";
    });

    if (isRep) {
      targetReps = targetReps.filter((r) => r.id === user.id);
    } else if (role === "district_manager" || role === "dm") {
      targetReps = targetReps.filter((r) => r.managerId === user.id);
    } else if (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu") {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subIds = new Set(subs.map((s) => s.id));
      targetReps = targetReps.filter((r) => subIds.has(r.id));
      if (selectedDm !== "all") {
        targetReps = targetReps.filter((r) => r.managerId === selectedDm);
      }
    } else if (selectedDm !== "all") {
      targetReps = targetReps.filter((r) => r.managerId === selectedDm);
    }

    if (selectedLine !== "all") {
      targetReps = targetReps.filter((r) => {
        const lines = r.lineIds || (r.lineId ? [r.lineId] : []);
        return lines.includes(selectedLine);
      });
    }

    if (selectedRep !== "all") {
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
      const matchedLine = allLines.find((l) => repLines.includes(l.id)) || { name: "CIRA Line" };
      const lineName = matchedLine.name || matchedLine.nameAr;

      // 2. DM & AM info
      const dm = allUsers.find((u) => u.id === rep.managerId);
      const dmName = dm ? dm.name : (rep.managerName || "—");
      const lm = dm ? allUsers.find((u) => u.id === dm.managerId) : null;
      const amName = lm ? lm.name : "—";

      // 3. Hiring date adjustment (if hired after startDate)
      let repWorkingDays = totalWorkingDays;
      let effectiveStartDate = startDate;
      if (rep.hireDate) {
        const hireDate = parseLocalDate(rep.hireDate);
        if (hireDate && hireDate > startDate && hireDate <= effectiveEndDate) {
          effectiveStartDate = hireDate;
          repWorkingDays = calculateWorkingDays(hireDate, effectiveEndDate, companySettings);
        } else if (hireDate && hireDate > effectiveEndDate) {
          // Not hired yet in this period
          repWorkingDays = 0;
        }
      }

      const repTargetFd = repWorkingDays > 0 ? Math.max(1, repWorkingDays > 20 ? repWorkingDays - 1 : repWorkingDays) : 0;

      // 4. Calculate Actual Field Days (Completed visits count per day in range)
      const repVisits = allVisits.filter((v) => {
        if (!v || v.repId !== rep.id) return false;
        const vDate = parseLocalDate(v.date || v.visitDate);
        if (!vDate) return false;
        if (vDate < effectiveStartDate || vDate > effectiveEndDate) return false;
        // Completed or executed
        return v.status === "completed" || v.status === "executed" || !v.status;
      });

      // Map visits by date
      const visitsByDate = {};
      repVisits.forEach((v) => {
        const dStr = v.date || v.visitDate;
        visitsByDate[dStr] = (visitsByDate[dStr] || 0) + 1;
      });

      // Days where rep achieved minimum visit criteria
      const fieldDates = Object.keys(visitsByDate).filter((d) => visitsByDate[d] >= 1); // 1 or more counts as field activity
      const actualFd = fieldDates.length;

      // 5. Calculate Non-Field Days (Office / Meetings / Activities)
      let nonFd = 0;
      const nonFdDates = [];
      const userActivitiesObj = (window.store && window.store.activities ? window.store.activities.getAllForUser(rep.id) : {}) || {};
      Object.keys(userActivitiesObj).forEach((actDateStr) => {
        const dayActs = userActivitiesObj[actDateStr];
        if (!dayActs || (!dayActs.AM && !dayActs.PM)) return;
        const actDate = parseLocalDate(actDateStr);
        if (!actDate) return;
        if (actDate >= effectiveStartDate && actDate <= effectiveEndDate) {
          if (!visitsByDate[actDateStr]) {
            nonFdDates.push(actDateStr);
          }
        }
      });
      nonFd = nonFdDates.length;

      // 6. Calculate Vacations in range
      let vacationDays = 0;
      const vacationDates = [];
      const repLeaves = allLeaves.filter((l) => (l.userId === rep.id || l.repId === rep.id) && (l.status === "approved" || !l.status));
      repLeaves.forEach((leave) => {
        const lStart = parseLocalDate(leave.startDate);
        const lEnd = parseLocalDate(leave.endDate || leave.startDate);
        if (!lStart || !lEnd) return;

        let curL = new Date(Math.max(lStart.getTime(), effectiveStartDate.getTime()));
        const limitL = new Date(Math.min(lEnd.getTime(), effectiveEndDate.getTime()));

        while (curL <= limitL) {
          const dayOfWeek = curL.getDay();
          const isFriday = dayOfWeek === 5;
          const secDay = companySettings?.secondaryWeekendDay || (companySettings?.isThursdayWeekend ? "thursday" : "none");
          const secMode = companySettings?.secondaryWeekendMode || "full_day";
          const isSecondaryFullOff = ((secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4)) && secMode === "full_day";
          if (!isFriday && !isSecondaryFullOff) {
            vacationDays++;
            vacationDates.push(formatDateForInput(curL));
          }
          curL.setDate(curL.getDate() + 1);
        }
      });

      // 7. Missing Days Equation: Target F.D - (Actual F.D + Non F.D + Vacation)
      const missing = repTargetFd - (actualFd + nonFd + vacationDays);

      sumTotalMissing += missing;
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
        effectiveStartDate,
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

    rows.forEach((r) => {
      const tr = document.createElement("tr");

      // Badge styling for Missing Days
      let missingBadge = "";
      if (r.missing > 0) {
        missingBadge = `<span class="badge badge-missing-alert">⚠️ +${r.missing} Day${r.missing > 1 ? 's' : ''}</span>`;
      } else if (r.missing === 0) {
        missingBadge = `<span class="badge badge-missing-full">✅ 0 (Full)</span>`;
      } else {
        missingBadge = `<span class="badge badge-missing-over">🌟 ${r.missing} (Over)</span>`;
      }

      tr.innerHTML = `
        <td style="font-weight:600;"><span class="badge badge-missing-line">${window.escapeHtml(r.lineName)}</span></td>
        <td class="text-muted">${window.escapeHtml(r.amName)}</td>
        <td style="font-weight:600; color:var(--gray-800);">${window.escapeHtml(r.dmName)}</td>
        <td style="font-weight:700; color:var(--primary); cursor:pointer;" onclick="openMissingDaysDetailsModal('${r.repId}')" title="Click to view full days breakdown">
          👤 ${window.escapeHtml(r.repName)}
        </td>
        <td style="font-size:0.82rem; color:var(--gray-500);">${window.escapeHtml(r.hireDate)}</td>
        <td style="text-align:center; font-weight:600;">${r.monthLabel}</td>
        <td style="text-align:center;">Q${r.quarter}</td>
        <td style="text-align:center; font-weight:700;">${r.wd}</td>
        <td style="text-align:center; font-weight:700; color:var(--primary);">${r.targetFd}</td>
        <td style="text-align:center; font-weight:700; color:var(--success); background:rgba(25,135,84,0.04);">${r.actualFd}</td>
        <td style="text-align:center; font-weight:600; color:var(--info);">${r.nonFd}</td>
        <td style="text-align:center; font-weight:600; color:var(--warning);">${r.vacationDays}</td>
        <td style="text-align:center; cursor:pointer;" onclick="openMissingDaysDetailsModal('${r.repId}')" title="View breakdown">
          ${missingBadge}
        </td>
      `;
      tbody.appendChild(tr);
    });
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

      const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || formatDateForInput(new Date());
      const todayDate = parseLocalDate(todayStr) || new Date();
      todayDate.setHours(23, 59, 59, 999);

      const cur = new Date(repData.effectiveStartDate.getTime());
      while (cur <= repData.endDate) {
        const dStr = formatDateForInput(cur);
        const dayOfWeek = cur.getDay();
        const isFriday = dayOfWeek === 5;
        const isSecondaryDay = (secDay === "saturday" && dayOfWeek === 6) || (secDay === "thursday" && dayOfWeek === 4);

        const item = document.createElement("div");
        const dayName = cur.toLocaleDateString("en", { weekday: "short" });

        if (isFriday || (isSecondaryDay && secMode === "full_day")) {
          item.className = "missing-day-item missing-day-weekend";
          item.innerHTML = `<span>📅 ${dStr} (${dayName})</span> <span class="badge bg-secondary">Weekend</span>`;
        } else if (isSecondaryDay && secMode === "pm_only" && !repData.fieldDates.includes(dStr) && !repData.nonFdDates.includes(dStr) && !repData.vacationDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-pm-weekend";
          item.innerHTML = `<span>📅 ${dStr} (${dayName})</span> <span class="badge badge-pm-weekend">🌙 PM Weekend (AM Work Available)</span>`;
        } else if (repData.fieldDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-field";
          item.innerHTML = `<span>📅 ${dStr} (${dayName})</span> <span class="badge bg-success">🚶‍♂️ Field Day (Visits Logged)</span>`;
        } else if (repData.nonFdDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-office";
          item.innerHTML = `<span>📅 ${dStr} (${dayName})</span> <span class="badge bg-info text-dark">🏢 Office / Activity</span>`;
        } else if (repData.vacationDates.includes(dStr)) {
          item.className = "missing-day-item missing-day-vacation";
          item.innerHTML = `<span>📅 ${dStr} (${dayName})</span> <span class="badge bg-warning text-dark">🏖️ Vacation</span>`;
        } else if (cur > todayDate) {
          item.className = "missing-day-item missing-day-upcoming";
          item.innerHTML = `<span class="text-muted">📅 ${dStr} (${dayName})</span> <span class="badge badge-upcoming">⏳ Upcoming</span>`;
        } else {
          // Missing Day!
          item.className = "missing-day-item missing-day-missing";
          item.innerHTML = `<span class="missing-day-missing-text">📅 ${dStr} (${dayName})</span> <span class="badge bg-danger">⚠️ Missing / No Log</span>`;
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
   * Exports Missing Days table to CSV.
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

    const csvData = [headers.join(",")];

    rows.forEach((r) => {
      const row = [
        `"${r.lineName}"`,
        `"${r.amName}"`,
        `"${r.dmName}"`,
        `"${r.repName}"`,
        `"${r.hireDate}"`,
        `"${r.monthLabel}"`,
        `"Q${r.quarter}"`,
        r.wd,
        r.targetFd,
        r.actualFd,
        r.nonFd,
        r.vacationDays,
        r.missing
      ];
      csvData.push(row.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvData.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Missing_Days_Report_${window.missingDaysState.dateFrom}_to_${window.missingDaysState.dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


})();
