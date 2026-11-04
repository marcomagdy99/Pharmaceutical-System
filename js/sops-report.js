/**
 * @file sops-report.js
 * @description Monthly Record Analysis (SOPs & Field Productivity Report)
 * Calculates rep field productivity according to pharma sales management standards:
 * - Official statutory working days in month (dynamically factoring company weekend policy: Fri-only, Fri-Sat, or Thu-Fri)
 * - Approved leaves / vacations (excluding statutory rest days)
 * - Approved activities / conferences / medical symposiums attended
 * - Approved office work days
 * - Net Working Days = Working Days - (Vacations + Office Work + Activities)
 * - Monthly Visits Target = Net Working Days * Daily Target
 * - Actual Completed Visits & Distinct Field Reporting Days
 * - SOPs Compliance % & True Field Daily Velocity (Avg Visits / Day)
 *
 * Strict Privacy & Hierarchy Controls:
 * - Medical Rep: strictly sees only their own individual record, no dropdown for peers.
 * - Line Manager / District Manager: strictly sees only their direct subordinate reps.
 * - BU Manager / Admin / HR: organization-wide / division view.
 */

(function () {
  'use strict';

  // Available months configuration
  const MONTHS_LIST = [
    { value: 1, nameEn: 'January', nameAr: 'يناير' },
    { value: 2, nameEn: 'February', nameAr: 'فبراير' },
    { value: 3, nameEn: 'March', nameAr: 'مارس' },
    { value: 4, nameEn: 'April', nameAr: 'أبريل' },
    { value: 5, nameEn: 'May', nameAr: 'مايو' },
    { value: 6, nameEn: 'June', nameAr: 'يونيو' },
    { value: 7, nameEn: 'July', nameAr: 'يوليو' },
    { value: 8, nameEn: 'August', nameAr: 'أغسطس' },
    { value: 9, nameEn: 'September', nameAr: 'سبتمبر' },
    { value: 10, nameEn: 'October', nameAr: 'أكتوبر' },
    { value: 11, nameEn: 'November', nameAr: 'نوفمبر' },
    { value: 12, nameEn: 'December', nameAr: 'ديسمبر' }
  ];

  let currentSopsData = [];
  let currentMonthSummary = null;

  /**
   * Initialize SOPs Report Tab filters and lifecycle
   */
  function initSopsReport(user) {
    const effectiveUser = user || (typeof checkAuth === 'function' ? checkAuth() : null);
    populateSopsDateFilters();
    populateSopsHierarchyFilters(effectiveUser);
    renderSopsReport();
  }

  /**
   * Populate Year and Month dropdowns
   */
  function populateSopsDateFilters() {
    const monthSelect = document.getElementById('sopsMonthSelect');
    const yearSelect = document.getElementById('sopsYearSelect');
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    if (monthSelect && monthSelect.options.length === 0) {
      const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
      MONTHS_LIST.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = lang === 'ar' ? `${m.value} - ${m.nameAr}` : `${m.value} - ${m.nameEn}`;
        if (m.value === curMonth) opt.selected = true;
        monthSelect.appendChild(opt);
      });
    }

    if (yearSelect && yearSelect.options.length === 0) {
      const startY = curYear - 2;
      const endY = curYear + 1;
      for (let y = startY; y <= endY; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === curYear) opt.selected = true;
        yearSelect.appendChild(opt);
      }
    }
  }

  /**
   * Populate and enforce strict hierarchy filters for SOPs report
   */
  function populateSopsHierarchyFilters(user) {
    const currentUser = user || (typeof checkAuth === 'function' ? checkAuth() : null);
    if (!currentUser) return;

    const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase();
    const isRep = window.isRepRole ? window.isRepRole(currentUser) : (role === 'medical_rep' || role === 'rep');
    const isDM = role === 'district_manager' || role === 'dm';
    const isLM = role === 'line_manager' || role === 'lm';

    const lmContainer = document.getElementById('sopsLmFilterContainer');
    const dmContainer = document.getElementById('sopsDmFilterContainer');
    const repContainer = document.getElementById('sopsRepFilterContainer');
    const repNotice = document.getElementById('sopsRepPersonalNotice');

    // Strict Rule: Medical Rep only sees their own individual performance
    if (isRep) {
      if (lmContainer) lmContainer.style.display = 'none';
      if (dmContainer) dmContainer.style.display = 'none';
      if (repContainer) repContainer.style.display = 'none';
      if (repNotice) {
        repNotice.style.display = 'flex';
        const nameEl = document.getElementById('sopsPersonalRepName');
        if (nameEl) nameEl.textContent = currentUser.name;
      }
      return;
    }

    if (repNotice) repNotice.style.display = 'none';
    if (lmContainer) lmContainer.style.display = isLM ? 'none' : 'block';
    if (dmContainer) dmContainer.style.display = isDM ? 'none' : 'block';
    if (repContainer) repContainer.style.display = 'block';

    if (typeof window.populateTabHierarchyFilters === 'function') {
      window.populateTabHierarchyFilters('sops', currentUser, window.selectedReportLineId || 'all');
    }
  }

  /**
   * Compute official statutory working days in the month respecting company policy
   */
  function computeMonthWorkingDays(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};

    const secDay = companySettings.secondaryWeekendDay || (companySettings.isThursdayWeekend ? 'thursday' : 'saturday');
    const secMode = companySettings.secondaryWeekendMode || 'full_day';

    const publicHolidays = (window.store && window.store.publicHolidays)
      ? window.store.publicHolidays.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.publicHolidays) || [];

    let statutoryWorkingDays = 0;
    let weekendDaysCount = 0;
    let officialHolidaysCount = 0;
    const workingDateStrings = new Set();

    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(year, month - 1, d);
      const dayOfWeek = cur.getDay(); // 0: Sun, 1: Mon, ..., 4: Thu, 5: Fri, 6: Sat
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dayStr = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;

      const isFriday = (dayOfWeek === 5);
      const isSecondary = (secDay === 'saturday' && dayOfWeek === 6) || (secDay === 'thursday' && dayOfWeek === 4);
      const holidayMatch = publicHolidays.find((h) => h.date === dateStr);

      if (holidayMatch) {
        officialHolidaysCount++;
        if (holidayMatch.duration === 'half') {
          statutoryWorkingDays += 0.5;
          workingDateStrings.add(dateStr);
        }
      } else if (isFriday) {
        weekendDaysCount++;
      } else if (isSecondary) {
        if (secMode === 'full_day') {
          weekendDaysCount++;
        } else {
          // Half day off
          weekendDaysCount += 0.5;
          statutoryWorkingDays += 0.5;
          workingDateStrings.add(dateStr);
        }
      } else {
        statutoryWorkingDays += 1;
        workingDateStrings.add(dateStr);
      }
    }

    return {
      daysInMonth,
      statutoryWorkingDays,
      weekendDaysCount,
      officialHolidaysCount,
      workingDateStrings,
      secDay,
      secMode
    };
  }

  /**
   * Build SOPs dataset for all authorized reps in scope
   */
  function buildSopsData(year, month) {
    const calendarInfo = computeMonthWorkingDays(year, month);
    const currentUser = (typeof checkAuth === 'function' ? checkAuth() : null) || { role: 'admin', id: 'u1790626000010' };
    const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase();
    const isRep = window.isRepRole ? window.isRepRole(currentUser) : (role === 'medical_rep' || role === 'rep');

    const allUsers = typeof getSharedReportUsers === 'function'
      ? getSharedReportUsers()
      : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));

    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const allLines = (window.store && window.store.lines ? window.store.lines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.lines) || []);

    // Filter Reps based on Role & Hierarchy Scope
    let targetReps = [];

    if (isRep) {
      targetReps = [currentUser];
    } else {
      const scope = typeof window.getReportHierarchyFilterScope === 'function'
        ? window.getReportHierarchyFilterScope('sops')
        : null;

      if (scope && Array.isArray(scope.allowedReps)) {
        targetReps = scope.allowedReps;
      } else {
        targetReps = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')));
      }

      // Check rep selector filter if manager selected a specific rep
      const repSelect = document.getElementById('sopsRepSelect');
      if (repSelect && repSelect.value && repSelect.value !== 'all') {
        const specificId = repSelect.value;
        targetReps = targetReps.filter((r) => r.id === specificId);
      }
    }

    // Load leaves, activities, and visits stores
    const allLeaves = (window.store && window.store.leaves ? window.store.leaves.getAll() : (window.DEMO_DATA && window.DEMO_DATA.leaves) || []);
    const allVisits = (window.store && window.store.visits ? window.store.visits.getAll() : (window.DEMO_DATA && window.DEMO_DATA.visits) || (window.visitsData || []));

    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthStartStr = `${monthPrefix}-01`;
    const monthEndStr = `${monthPrefix}-${String(calendarInfo.daysInMonth).padStart(2, '0')}`;

    const repRows = targetReps.map((rep) => {
      // Find Rep Area & Line
      const repArea = allAreas.find((a) => a.repId === rep.id || (rep.areaIds && rep.areaIds.includes(a.id)) || a.id === rep.areaId);
      const territoryName = repArea ? (repArea.name + (repArea.code ? ` - ${repArea.code}` : '')) : (rep.area || rep.territory || 'Unassigned Brick');
      const repLine = allLines.find((l) => l.id === rep.lineId || (rep.lineIds && rep.lineIds.includes(l.id)));
      const lineName = repLine ? repLine.name : (rep.division || 'Clinics & Poly Clinics');

      // 1. Daily Visits Target (Defaults to 8.0 or rep individual override)
      const dailyTarget = parseFloat(rep.dailyTarget || rep.targetPerDay || 8.0);

      // 2. Approved Vacations in Month (Only count working days, exclude statutory rest days)
      let approvedVacationDays = 0;
      const repLeaves = allLeaves.filter((l) => {
        if (!l || (l.userId !== rep.id && l.repId !== rep.id)) return false;
        const status = (l.status || '').toLowerCase();
        if (status !== 'approved') return false;
        return (l.startDate <= monthEndStr && l.endDate >= monthStartStr);
      });

      repLeaves.forEach((leave) => {
        const lStart = new Date(Math.max(new Date(leave.startDate + 'T00:00:00').getTime(), new Date(monthStartStr + 'T00:00:00').getTime()));
        const lEnd = new Date(Math.min(new Date(leave.endDate + 'T00:00:00').getTime(), new Date(monthEndStr + 'T00:00:00').getTime()));
        const curL = new Date(lStart);
        while (curL <= lEnd) {
          const dayStr = `${curL.getFullYear()}-${String(curL.getMonth() + 1).padStart(2, '0')}-${String(curL.getDate()).padStart(2, '0')}`;
          if (calendarInfo.workingDateStrings.has(dayStr)) {
            approvedVacationDays += (leave.durationType === 'half' ? 0.5 : 1);
          }
          curL.setDate(curL.getDate() + 1);
        }
      });

      // 3. Approved Activities / Conferences in Month
      let approvedActivityDays = 0;
      let approvedOfficeWorkDays = 0;
      try {
        const userActivities = (window.store && window.store.activities && typeof window.store.activities.getAllForUser === 'function')
          ? window.store.activities.getAllForUser(rep.id)
          : ((window.DEMO_DATA && window.DEMO_DATA.activities && window.DEMO_DATA.activities[rep.id]) || []);

        if (Array.isArray(userActivities)) {
          const monthActivities = userActivities.filter((act) => {
            const actDate = act.date || act.activityDate || '';
            const status = (act.status || 'approved').toLowerCase();
            return actDate.startsWith(monthPrefix) && status === 'approved';
          });

          // Distinct days of conferences/activities
          const distinctActDates = new Set();
          const distinctOfficeDates = new Set();
          monthActivities.forEach((act) => {
            const date = act.date || act.activityDate;
            const type = (act.type || act.activityType || '').toLowerCase();
            if (type.includes('office') || type.includes('training') || type.includes('meeting')) {
              distinctOfficeDates.add(date);
            } else {
              distinctActDates.add(date);
            }
          });
          approvedActivityDays = distinctActDates.size;
          approvedOfficeWorkDays = distinctOfficeDates.size;
        }
      } catch (actErr) {
        console.warn('[SOPs Activities Warning]:', actErr);
      }

      // 4. Net Working Days Formula
      // Net Working Days = Working Days - (Vacations + Office Work + Activities)
      const totalDeductions = approvedVacationDays + approvedOfficeWorkDays + approvedActivityDays;
      const netWorkingDays = Math.max(0, calendarInfo.statutoryWorkingDays - totalDeductions);

      // 5. Monthly Visits Target = Net Working Days * Daily Target
      const monthlyVisitsTarget = Math.round(netWorkingDays * dailyTarget * 10) / 10;

      // 6. Actual Executed Visits & Distinct Reporting Days
      const repVisits = allVisits.filter((v) => {
        if (!v) return false;
        const matchesRep = (v.repId === rep.id || v.userId === rep.id || v.repName === rep.name);
        if (!matchesRep) return false;
        const vDate = v.date || v.visitDate || '';
        const vStatus = (v.status || '').toLowerCase();
        return vDate.startsWith(monthPrefix) && vStatus !== 'cancelled';
      });

      const actualVisits = repVisits.length;
      const distinctReportDays = new Set(repVisits.map((v) => v.date || v.visitDate)).size;

      // 7. SOPs Compliance %
      const sopsPercentage = monthlyVisitsTarget > 0
        ? Math.round((actualVisits / monthlyVisitsTarget) * 10000) / 100
        : 0;

      // 8. Daily Productivity (Avg. Visits / Day)
      const avgVisitsPerDay = distinctReportDays > 0
        ? Math.round((actualVisits / distinctReportDays) * 100) / 100
        : 0;

      return {
        repId: rep.id,
        repName: rep.name,
        repCode: rep.employeeCode || rep.code || 'REP-' + rep.id.slice(-4),
        territoryName,
        lineName,
        workingDays: calendarInfo.statutoryWorkingDays,
        daysInMonth: calendarInfo.daysInMonth,
        dailyVisitsTarget: dailyTarget,
        vacations: approvedVacationDays,
        officeWork: approvedOfficeWorkDays,
        activities: approvedActivityDays,
        netWorkingDays,
        monthlyVisitsTarget,
        actualVisits,
        sopsPercentage,
        dailyReportDays: distinctReportDays,
        avgVisitsPerDay
      };
    });

    return {
      calendarInfo,
      repRows
    };
  }

  /**
   * Render the SOPs Report into DOM
   */
  function renderSopsReport() {
    const monthSelect = document.getElementById('sopsMonthSelect');
    const yearSelect = document.getElementById('sopsYearSelect');
    const now = new Date();
    const year = parseInt(yearSelect?.value || now.getFullYear(), 10);
    const month = parseInt(monthSelect?.value || (now.getMonth() + 1), 10);

    const { calendarInfo, repRows } = buildSopsData(year, month);
    currentSopsData = repRows;
    currentMonthSummary = calendarInfo;

    const tbody = document.getElementById('sopsReportTableBody');
    if (!tbody) return;
    tbody.replaceChildren();

    // Render KPI Summary Cards
    renderSopsKpis(repRows, calendarInfo);

    // Render Subtitle / Month Indicator
    const monthObj = MONTHS_LIST.find((m) => m.value === month);
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    const monthTitle = lang === 'ar' ? (monthObj?.nameAr || month) : (monthObj?.nameEn || month);

    const headerBadge = document.getElementById('sopsHeaderMonthBadge');
    if (headerBadge) {
      headerBadge.textContent = `${year}-${String(month).padStart(2, '0')} SOPs & Coverage (${monthTitle} ${year})`;
    }

    const weekendBadge = document.getElementById('sopsWeekendPolicyBadge');
    if (weekendBadge) {
      const restDayName = calendarInfo.secDay === 'none'
        ? 'Friday Only'
        : (calendarInfo.secDay === 'thursday' ? 'Thursday & Friday' : 'Friday & Saturday');
      weekendBadge.textContent = `${calendarInfo.statutoryWorkingDays} Working Days (${restDayName})`;
    }

    if (repRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="13" class="text-center py-5 text-muted">
            <svg class="mb-2 opacity-50" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div class="fw-semibold">No performance records found for selected criteria.</div>
          </td>
        </tr>
      `;
      return;
    }

    repRows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'sops-data-row';

      // SOPs % badge styling: >=90% Success, 75-89% Warning, <75% Danger
      let sopsBadgeClass = 'sops-pct-danger';
      if (r.sopsPercentage >= 90) sopsBadgeClass = 'sops-pct-success';
      else if (r.sopsPercentage >= 75) sopsBadgeClass = 'sops-pct-warning';

      tr.innerHTML = `
        <td class="text-start">
          <div class="fw-bold text-success">${window.escapeHtml(r.territoryName)}</div>
          <small class="text-muted">${window.escapeHtml(r.lineName)}</small>
        </td>
        <td class="text-start">
          <div class="fw-bold text-primary">${window.escapeHtml(r.repName)}</div>
          <small class="text-muted">${window.escapeHtml(r.repCode)}</small>
        </td>
        <td class="text-center fw-semibold">${r.workingDays} <small class="text-muted">(${r.workingDays})</small></td>
        <td class="text-center fw-semibold text-secondary">${r.dailyVisitsTarget.toFixed(1)}</td>
        <td class="text-center ${r.vacations > 0 ? 'fw-bold text-danger' : 'text-muted'}">${r.vacations > 0 ? r.vacations : '—'}</td>
        <td class="text-center ${r.officeWork > 0 ? 'fw-bold text-info' : 'text-muted'}">${r.officeWork > 0 ? r.officeWork : '0'}</td>
        <td class="text-center ${r.activities > 0 ? 'fw-bold text-primary' : 'text-muted'}">${r.activities > 0 ? r.activities : '0'}</td>
        <td class="text-center fw-bold text-dark fs-6">${r.netWorkingDays}</td>
        <td class="text-center fw-bold text-dark fs-6">${r.monthlyVisitsTarget.toFixed(1)}</td>
        <td class="text-center">
          <span class="badge sops-actual-badge" onclick="window.viewSopsRepVisits('${r.repId}')" title="View actual visits details">
            ${r.actualVisits}
          </span>
        </td>
        <td class="text-center">
          <span class="badge sops-pct-badge ${sopsBadgeClass}">
            ${r.sopsPercentage.toFixed(2)}%
          </span>
        </td>
        <td class="text-center fw-semibold text-dark">${r.dailyReportDays}</td>
        <td class="text-center fw-bold text-primary">${r.avgVisitsPerDay.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

    // If Manager / Multiple Reps, render Team Summary Totals row
    if (repRows.length > 1) {
      const sumTarget = repRows.reduce((acc, cur) => acc + cur.monthlyVisitsTarget, 0);
      const sumActual = repRows.reduce((acc, cur) => acc + cur.actualVisits, 0);
      const avgSop = sumTarget > 0 ? Math.round((sumActual / sumTarget) * 10000) / 100 : 0;
      const sumReportDays = repRows.reduce((acc, cur) => acc + cur.dailyReportDays, 0);
      const avgVelocity = sumReportDays > 0 ? Math.round((sumActual / sumReportDays) * 100) / 100 : 0;

      const totalTr = document.createElement('tr');
      totalTr.className = 'sops-total-row';
      totalTr.innerHTML = `
        <td colspan="2" class="fw-bold text-start ps-3">Team Summary / Grand Total</td>
        <td class="text-center fw-bold">—</td>
        <td class="text-center fw-bold">—</td>
        <td class="text-center fw-bold text-danger">${repRows.reduce((a, b) => a + b.vacations, 0) || '—'}</td>
        <td class="text-center fw-bold">${repRows.reduce((a, b) => a + b.officeWork, 0)}</td>
        <td class="text-center fw-bold text-primary">${repRows.reduce((a, b) => a + b.activities, 0)}</td>
        <td class="text-center fw-bold">—</td>
        <td class="text-center fw-bold">${sumTarget.toFixed(1)}</td>
        <td class="text-center fw-bold text-success fs-6">${sumActual}</td>
        <td class="text-center fw-bold"><span class="badge sops-pct-badge ${avgSop >= 90 ? 'sops-pct-success' : (avgSop >= 75 ? 'sops-pct-warning' : 'sops-pct-danger')}">${avgSop.toFixed(2)}%</span></td>
        <td class="text-center fw-bold">${sumReportDays}</td>
        <td class="text-center fw-bold text-primary fs-6">${avgVelocity.toFixed(2)}</td>
      `;
      tbody.appendChild(totalTr);
    }
  }

  /**
   * Render KPI summary blocks above the table
   */
  function renderSopsKpis(repRows, calendarInfo) {
    const kpiWorkingDays = document.getElementById('kpiSopsWorkingDays');
    const kpiNetDays = document.getElementById('kpiSopsNetDays');
    const kpiTarget = document.getElementById('kpiSopsTotalTarget');
    const kpiActual = document.getElementById('kpiSopsTotalActual');
    const kpiSopsPct = document.getElementById('kpiSopsOverallPct');
    const kpiVelocity = document.getElementById('kpiSopsAvgVelocity');

    if (!repRows.length) {
      if (kpiWorkingDays) kpiWorkingDays.textContent = calendarInfo.statutoryWorkingDays;
      if (kpiNetDays) kpiNetDays.textContent = '0';
      if (kpiTarget) kpiTarget.textContent = '0';
      if (kpiActual) kpiActual.textContent = '0';
      if (kpiSopsPct) kpiSopsPct.textContent = '0%';
      if (kpiVelocity) kpiVelocity.textContent = '0.0';
      return;
    }

    const totalTarget = repRows.reduce((acc, cur) => acc + cur.monthlyVisitsTarget, 0);
    const totalActual = repRows.reduce((acc, cur) => acc + cur.actualVisits, 0);
    const totalReportDays = repRows.reduce((acc, cur) => acc + cur.dailyReportDays, 0);
    const avgNetDays = Math.round((repRows.reduce((acc, cur) => acc + cur.netWorkingDays, 0) / repRows.length) * 10) / 10;
    const overallPct = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) + '%' : '0%';
    const overallVelocity = totalReportDays > 0 ? (totalActual / totalReportDays).toFixed(2) : '0.0';

    if (kpiWorkingDays) kpiWorkingDays.textContent = calendarInfo.statutoryWorkingDays;
    if (kpiNetDays) kpiNetDays.textContent = repRows.length === 1 ? repRows[0].netWorkingDays : avgNetDays;
    if (kpiTarget) kpiTarget.textContent = Math.round(totalTarget);
    if (kpiActual) kpiActual.textContent = totalActual;
    if (kpiSopsPct) kpiSopsPct.textContent = overallPct;
    if (kpiVelocity) kpiVelocity.textContent = overallVelocity;
  }

  /**
   * Drill-down: View visits list for clicked rep
   */
  window.viewSopsRepVisits = function (repId) {
    if (typeof window.switchReportTab === 'function') {
      window.switchReportTab('timeline');
      const timelineRepSelect = document.getElementById('timelineRepSelect');
      if (timelineRepSelect) {
        timelineRepSelect.value = repId;
        if (typeof window.renderTimelineReport === 'function') {
          window.renderTimelineReport();
        }
      }
    }
  };

  /**
   * Export SOPs Report to standard CSV / Excel format
   */
  function exportSopsReport() {
    if (!currentSopsData || !currentSopsData.length) {
      if (typeof showToast === 'function') showToast('No data to export', 'warning');
      return;
    }

    const monthSelect = document.getElementById('sopsMonthSelect');
    const yearSelect = document.getElementById('sopsYearSelect');
    const now = new Date();
    const year = yearSelect?.value || now.getFullYear();
    const month = String(monthSelect?.value || (now.getMonth() + 1)).padStart(2, '0');

    let csv = '';
    csv += 'PharmaCare - Monthly Record Analysis (SOPs & Field Productivity)\n';
    csv += `Period: ${year}-${month} | Statutory Working Days: ${currentMonthSummary?.statutoryWorkingDays || 21}\n\n`;

    const headers = [
      'Territory Name',
      'Division / Line',
      'Employee Name',
      'Employee Code',
      'Working Days',
      'Daily Target',
      'Vacations',
      'Office Work',
      'Activities',
      'Net Working Days',
      'Monthly Visits Target',
      'Actual Executed Visits',
      'SOPs Compliance %',
      'Daily Report Days',
      'Avg. Visits / Day'
    ];

    csv += headers.map((h) => `"${h}"`).join(',') + '\n';

    currentSopsData.forEach((r) => {
      const row = [
        `"${r.territoryName}"`,
        `"${r.lineName}"`,
        `"${r.repName}"`,
        `"${r.repCode}"`,
        r.workingDays,
        r.dailyVisitsTarget.toFixed(1),
        r.vacations,
        r.officeWork,
        r.activities,
        r.netWorkingDays,
        r.monthlyVisitsTarget.toFixed(1),
        r.actualVisits,
        `"${r.sopsPercentage.toFixed(2)}%"`,
        r.dailyReportDays,
        r.avgVisitsPerDay.toFixed(2)
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PharmaCare_SOPs_Report_${year}_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Global exposure
  window.initSopsReport = initSopsReport;
  window.buildSopsData = buildSopsData;
  window.computeMonthWorkingDays = computeMonthWorkingDays;
  window.renderSopsReport = renderSopsReport;
  window.exportSopsReport = exportSopsReport;

})();
