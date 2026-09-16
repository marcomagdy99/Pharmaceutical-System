// Dynamic default date helpers for coverage report
function _coverageStart() {
  const n = new Date();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  return `${n.getFullYear()}-${m}-01`;
}
function _coverageEnd() {
  const n = new Date();
  const l = new Date(n.getFullYear(), n.getMonth() + 1, 0);
  const m = String(l.getMonth() + 1).padStart(2, '0');
  const d = String(l.getDate()).padStart(2, '0');
  return `${l.getFullYear()}-${m}-${d}`;
}

/**
 * @file coverage-report.js
 * @description Reports page - "Coverage" tab: doctor/hospital visit
 * frequency vs target, employee summary breakdown table, interactive drill-down,
 * and Excel/CSV export.
 * Depends on shared-report.js (must load after it).
 */

// Active drilldown filter state for Coverage tab
let coverageDrilldownState = {
  type: 'all', // 'all' | 'visited' | 'unvisited' | 'actual'
  repId: null,
  repName: '',
};

// Cached context to allow re-filtering details table without re-querying
let coverageReportContext = null;

window.setCoverageDrilldown = function(type, repId, repName) {
  coverageDrilldownState = {
    type: type || 'all',
    repId: repId || null,
    repName: repName || '',
  };
  renderCoverageReportView();
};

window.resetCoverageDrilldown = function() {
  coverageDrilldownState = {
    type: 'all',
    repId: null,
    repName: '',
  };
  renderCoverageReportView();
};

function getEmployeeTerritory(user, repTargets) {
  if (user && user.territory) return user.territory;
  if (user && user.divisionName) return user.divisionName;
  if (user && user.areaName) return user.areaName;
  if (user && user.area) return user.area;
  const distinctAreas = Array.from(new Set(repTargets.map((d) => d.area).filter(Boolean)));
  if (distinctAreas.length > 0) {
    return distinctAreas.slice(0, 2).join(', ') + (distinctAreas.length > 2 ? ` (+${distinctAreas.length - 2})` : '');
  }
  return '—';
}

function escapeJsString(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ============================================================================
// Section 9: Tab 3 - Coverage & Frequency Report
// ============================================================================
function renderCoverageReport() {
  syncReportsData();

  const startDate = document.getElementById('coverageStartDate')?.value || _coverageStart();
  const endDate = document.getElementById('coverageEndDate')?.value || _coverageEnd();
  const classFilter = document.getElementById('coverageClassFilter')?.value || 'all';
  const repSelect = document.getElementById('coverageRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';
  const lang = getCurrentLang();

  const start = new Date(startDate);
  const end = new Date(endDate);

  const user = checkAuth();
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  const numMonths = Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1
  );

  const allLines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  let lineObj = null;
  if (selectedRep && selectedRep !== 'all') {
    const repUser = allUsers.find((u) => u.id === selectedRep);
    const lId = repUser ? (repUser.lineIds && repUser.lineIds[0]) || repUser.lineId : null;
    lineObj = allLines.find((l) => l.id === lId);
  }
  if (!lineObj && user) {
    const lId = (user.lineIds && user.lineIds[0]) || user.lineId;
    lineObj = allLines.find((l) => l.id === lId);
  }
  if (!lineObj && allLines.length > 0) {
    lineObj = allLines[0];
  }

  const freqA = lineObj && lineObj.callFrequency && lineObj.callFrequency.classA !== undefined ? lineObj.callFrequency.classA : 4;
  const freqB = lineObj && lineObj.callFrequency && lineObj.callFrequency.classB !== undefined ? lineObj.callFrequency.classB : 3;

  const rulesEl = document.getElementById('coverageRulesBox');
  if (rulesEl) {
    const lineTag = lineObj && lineObj.name ? ` (${lineObj.name})` : '';
    if (lang === 'ar') {
      rulesEl.innerHTML = `💡 <strong>قواعد التغطية${lineTag}:</strong> أطباء فئة A = ${freqA} زيارات/ربع سنوي | أطباء فئة B = ${freqB} زيارات/ربع سنوي | مستشفيات = 2 زيارة/شهر`;
    } else {
      rulesEl.innerHTML = `💡 <strong>Coverage Rules${lineTag}:</strong> Class A Doctors = ${freqA} visits/Quarter | Class B Doctors = ${freqB} visits/Quarter | AM Hospitals = 2 visits/Month`;
    }
  }

  // Filter raw doctors list by Doctor Class Filter
  let targetList = (REPORTS_DATA.doctors || []).slice();
  if (classFilter === 'all_doctors') {
    targetList = targetList.filter((d) => d.class === 'A' || d.class === 'B');
  } else if (classFilter === 'A') {
    targetList = targetList.filter((d) => d.class === 'A');
  } else if (classFilter === 'B') {
    targetList = targetList.filter((d) => d.class === 'B');
  } else if (classFilter === 'hospital') {
    targetList = targetList.filter((d) => d.class === 'hospital' || (d.class || '').toLowerCase() === 'hospital');
  }

  // Scope doctors by user role and rep filter
  if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
  } else if (role === 'district_manager') {
    const teamReps = allUsers.filter((u) => u.managerId === user.id);
    const teamRepIds = teamReps.map((u) => u.id);
    const allowedIds = [user.id, ...teamRepIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.includes(d.repId));
    } else {
      targetList = targetList.filter((d) => d.repId === selectedRep);
    }
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);
    const allowedIds = [user.id, ...dmIds, ...repIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.includes(d.repId));
    } else if (selectedRep === 'all_dms') {
      targetList = targetList.filter((d) => dmIds.includes(d.repId));
    } else if (selectedRep === 'all_reps') {
      targetList = targetList.filter((d) => repIds.includes(d.repId));
    } else if (dmIds.includes(selectedRep)) {
      const dmReps = reps.filter((r) => r.managerId === selectedRep).map((r) => r.id);
      targetList = targetList.filter((d) => d.repId === selectedRep || dmReps.includes(d.repId));
    } else if (selectedRep) {
      targetList = targetList.filter((d) => d.repId === selectedRep);
    }
  } else if (role === 'business_unit') {
    const myLMs = allUsers.filter((u) => u.managerId === user.id && (u.role === 'line_manager' || u.role === 'lm'));
    const lmIds = myLMs.map((u) => u.id);
    const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    const myDownstreamIds = myDownstream.map((u) => u.id);
    const allowedTeamIds = [user.id, ...lmIds, ...myDownstreamIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedTeamIds.includes(d.repId));
    } else {
      targetList = targetList.filter((d) => d.repId === selectedRep && allowedTeamIds.includes(d.repId));
    }
  } else if (selectedRep && selectedRep !== 'all') {
    targetList = targetList.filter((d) => d.repId === selectedRep);
  }

  // Pre-calculate visit counts for each target within selected date range
  const visits = REPORTS_DATA.visits || [];
  targetList.forEach((target) => {
    const matchingVisits = visits.filter((v) => {
      const isCompleted = v.status === 'completed' || Boolean(v.isActual) || v.source === 'actual';
      if (!isCompleted) return false;
      const matchesTarget = (v.doctorId && target.id) ? (v.doctorId === target.id) : (v.targetName === target.name);
      if (!matchesTarget) return false;
      const vDate = new Date(v.date);
      return vDate >= start && vDate <= end;
    });

    target._matchingVisits = matchingVisits;
    target._visitsCount = matchingVisits.length;
    target._actualVisitsCount = matchingVisits.filter((v) => Boolean(v.isActual) || v.source === 'actual' || v.status === 'completed').length;
    target._hasDirectActual = matchingVisits.some((v) => Boolean(v.isActual) || v.source === 'actual');

    const quarterlyRate = target.targetQuarterly || ((typeof window.getDoctorCallTarget === 'function')
      ? window.getDoctorCallTarget(target)
      : (target.class === 'A' ? 4 : (target.class === 'B' ? 3 : 6)));
    target._targetFreq = Math.max(1, Math.round((quarterlyRate / 3) * numMonths));
  });

  // Determine scoped reps list for the summary table
  let scopedReps = [];
  if (isRep) {
    scopedReps = [user];
  } else if (selectedRep && selectedRep !== 'all' && selectedRep !== 'all_dms' && selectedRep !== 'all_reps') {
    const singleUser = allUsers.find((u) => u.id === selectedRep) || { id: selectedRep, name: selectedRep };
    scopedReps = [singleUser];
  } else if (role === 'district_manager') {
    const teamReps = allUsers.filter((u) => u.managerId === user.id);
    const selfHasTargets = targetList.some((t) => t.repId === user.id);
    scopedReps = selfHasTargets ? [user, ...teamReps] : teamReps;
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));

    if (selectedRep === 'all_dms') {
      scopedReps = dms;
    } else if (selectedRep === 'all_reps') {
      scopedReps = reps;
    } else if (dmIds.includes(selectedRep)) {
      const dmReps = reps.filter((r) => r.managerId === selectedRep);
      scopedReps = dmReps.length ? dmReps : [allUsers.find((u) => u.id === selectedRep)];
    } else {
      scopedReps = reps.length ? reps : dms;
    }
  } else if (role === 'business_unit') {
    const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    const downstreamReps = myDownstream.filter((u) => window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep'));
    scopedReps = downstreamReps.length ? downstreamReps : myDownstream;
  } else {
    const repIdsInTargets = Array.from(new Set(targetList.map((d) => d.repId).filter(Boolean)));
    scopedReps = allUsers.filter((u) => repIdsInTargets.includes(u.id));
    if (!scopedReps.length) {
      scopedReps = allUsers.filter((u) => window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep'));
    }
  }

  // Fallback if empty
  if (scopedReps.length === 0 && user) {
    scopedReps = [user];
  }

  // Save report context
  coverageReportContext = {
    startDate,
    endDate,
    start,
    end,
    numMonths,
    classFilter,
    selectedRep,
    targetList,
    scopedReps,
    allUsers,
    lang,
  };

  // Reset drilldown on full search
  coverageDrilldownState = {
    type: 'all',
    repId: null,
    repName: '',
  };

  renderCoverageReportView();
}

/**
 * Renders both the summary table and the details table from current context & drilldown state
 */
function renderCoverageReportView() {
  if (!coverageReportContext) return;
  const { startDate, endDate, targetList, scopedReps, lang } = coverageReportContext;

  const summaryTbody = document.getElementById('coverageSummaryTbody');
  const detailsTbody = document.getElementById('coverageReportTbody');
  const drilldownBar = document.getElementById('coverageActiveDrilldownBar');
  const drilldownText = document.getElementById('coverageActiveDrilldownText');

  const isAr = lang === 'ar';
  const headerTerritory = document.getElementById('covColTerritory');
  const headerEmployee = document.getElementById('covColEmployee');
  const headerDoctors = document.getElementById('covColDoctors');
  const headerVisited = document.getElementById('covColVisited');
  const headerUnvisited = document.getElementById('covColUnvisited');
  const headerActual = document.getElementById('covColActual');
  const headerAvgFreq = document.getElementById('covColAvgFreq');
  if (headerTerritory) headerTerritory.textContent = isAr ? 'المنطقة / الإقليم' : 'Territory / Area';
  if (headerEmployee) headerEmployee.textContent = isAr ? 'الموظف' : 'Employee';
  if (headerDoctors) headerDoctors.textContent = isAr ? 'إجمالي الأطباء' : 'Doctors';
  if (headerVisited) headerVisited.textContent = isAr ? 'الأطباء المزارين' : 'Visited Doctors';
  if (headerUnvisited) headerUnvisited.textContent = isAr ? 'الأطباء غير المزارين' : 'Unvisited Doctors';
  if (headerActual) headerActual.textContent = isAr ? 'الزيارات الفعلية' : 'Actual Visits';
  if (headerAvgFreq) headerAvgFreq.textContent = isAr ? 'معدل التردد' : 'Average Frequency';

  if (summaryTbody) summaryTbody.replaceChildren();
  if (detailsTbody) detailsTbody.replaceChildren();

  // 1. Build & render Summary Table rows
  let grandDoctors = 0;
  let grandVisited = 0;
  let grandUnvisited = 0;
  let grandActualVisits = 0;
  const renderedRepRows = [];

  scopedReps.forEach((rep) => {
    let repTargets = targetList.filter((d) => d.repId === rep.id);
    if (scopedReps.length === 1 && repTargets.length === 0 && targetList.length > 0) {
      repTargets = targetList;
    }

    const doctorsCount = repTargets.length;
    const visitedCount = repTargets.filter((t) => t._visitsCount > 0).length;
    const unvisitedCount = doctorsCount - visitedCount;
    const actualVisitsCount = repTargets.reduce((acc, t) => acc + (t._actualVisitsCount || 0), 0);
    const avgFrequency = visitedCount > 0 ? (actualVisitsCount / visitedCount).toFixed(2) : '0.00';
    const territory = getEmployeeTerritory(rep, repTargets);

    grandDoctors += doctorsCount;
    grandVisited += visitedCount;
    grandUnvisited += unvisitedCount;
    grandActualVisits += actualVisitsCount;

    renderedRepRows.push({
      rep,
      territory,
      doctorsCount,
      visitedCount,
      unvisitedCount,
      actualVisitsCount,
      avgFrequency,
      repTargets,
    });
  });

  if (summaryTbody) {
    if (renderedRepRows.length === 0) {
      summaryTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--gray-500); font-style: italic;">
            ${lang === 'ar' ? 'لا توجد بيانات مطابقة للموظفين المحددين في هذه الفترة.' : 'No employee data matching the selected filter.'}
          </td>
        </tr>
      `;
    } else {
      renderedRepRows.forEach((row) => {
        const isCurrentRep = coverageDrilldownState.repId === row.rep.id;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--gray-900);">${window.escapeHtml(row.rep.name || 'Rep')}</td>
          <td style="font-weight: 600; color: var(--gray-700);">${window.escapeHtml(row.territory)}</td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-all ${isCurrentRep && coverageDrilldownState.type === 'all' ? 'active' : ''}"
              onclick="setCoverageDrilldown('all', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="${lang === 'ar' ? 'عرض كل أطباء هذا المندوب' : 'Show all doctors for this rep'}"
            >
              ${row.doctorsCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-visited ${isCurrentRep && coverageDrilldownState.type === 'visited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('visited', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="${lang === 'ar' ? 'عرض الأطباء المزارين فقط' : 'Show visited doctors only'}"
            >
              ${row.visitedCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-unvisited ${isCurrentRep && coverageDrilldownState.type === 'unvisited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('unvisited', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="${lang === 'ar' ? 'عرض الأطباء غير المزارين' : 'Show unvisited doctors only'}"
            >
              ${row.unvisitedCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-actual ${isCurrentRep && coverageDrilldownState.type === 'actual' ? 'active' : ''}"
              onclick="setCoverageDrilldown('actual', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="${lang === 'ar' ? 'عرض أطباء الزيارات الفعلية' : 'Show actual visits doctors'}"
            >
              ${row.actualVisitsCount}
            </button>
          </td>
          <td>
            <span class="coverage-freq-value">${row.avgFrequency}</span>
          </td>
        `;
        summaryTbody.appendChild(tr);
      });

      // Total row if multiple employees
      if (renderedRepRows.length > 1) {
        const grandAvgFreq = grandVisited > 0 ? (grandActualVisits / grandVisited).toFixed(2) : '0.00';
        const isTotalActive = coverageDrilldownState.repId === null;
        const totalTr = document.createElement('tr');
        totalTr.style.fontWeight = '800';
        totalTr.style.background = 'var(--gray-50, #f8f9fa)';
        totalTr.style.borderTop = '2px solid var(--border-color, #e5e7eb)';
        totalTr.innerHTML = `
          <td style="color: var(--primary);">${lang === 'ar' ? 'الإجمالي' : 'TOTAL'}</td>
          <td>${lang === 'ar' ? 'كافة المناطق' : 'All Territories'}</td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-all ${isTotalActive && coverageDrilldownState.type === 'all' ? 'active' : ''}"
              onclick="setCoverageDrilldown('all', null, '${lang === 'ar' ? 'الكل' : 'All'}')"
              title="${lang === 'ar' ? 'عرض كافة الأطباء للجميع' : 'Show all doctors'}"
            >
              ${grandDoctors}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-visited ${isTotalActive && coverageDrilldownState.type === 'visited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('visited', null, '${lang === 'ar' ? 'الكل' : 'All'}')"
              title="${lang === 'ar' ? 'عرض كافة الأطباء المزارين' : 'Show all visited doctors'}"
            >
              ${grandVisited}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-unvisited ${isTotalActive && coverageDrilldownState.type === 'unvisited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('unvisited', null, '${lang === 'ar' ? 'الكل' : 'All'}')"
              title="${lang === 'ar' ? 'عرض كافة الأطباء غير المزارين' : 'Show all unvisited doctors'}"
            >
              ${grandUnvisited}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-actual ${isTotalActive && coverageDrilldownState.type === 'actual' ? 'active' : ''}"
              onclick="setCoverageDrilldown('actual', null, '${lang === 'ar' ? 'الكل' : 'All'}')"
              title="${lang === 'ar' ? 'عرض كافة أطباء الزيارات الفعلية' : 'Show all actual visit doctors'}"
            >
              ${grandActualVisits}
            </button>
          </td>
          <td>
            <span class="coverage-freq-value">${grandAvgFreq}</span>
          </td>
        `;
        summaryTbody.appendChild(totalTr);
      }
    }
  }

  // 2. Manage Drilldown Banner
  const isDrilldownActive = coverageDrilldownState.type !== 'all' || coverageDrilldownState.repId !== null;
  if (drilldownBar) {
    if (isDrilldownActive) {
      drilldownBar.style.display = 'flex';
      let typeLabel = '';
      if (coverageDrilldownState.type === 'visited') {
        typeLabel = lang === 'ar' ? 'الأطباء المزارين فقط' : 'Visited Doctors Only';
      } else if (coverageDrilldownState.type === 'unvisited') {
        typeLabel = lang === 'ar' ? 'الأطباء غير المزارين' : 'Unvisited Doctors Only';
      } else if (coverageDrilldownState.type === 'actual') {
        typeLabel = lang === 'ar' ? 'أطباء الزيارات الفعلية (Actual)' : 'Actual Visits Doctors';
      } else {
        typeLabel = lang === 'ar' ? 'كافة الأطباء' : 'All Doctors';
      }

      const repLabel = coverageDrilldownState.repName ? ` (${coverageDrilldownState.repName})` : '';
      if (drilldownText) {
        drilldownText.textContent = lang === 'ar'
          ? `عرض مخصص: ${typeLabel}${repLabel}`
          : `Filtered View: ${typeLabel}${repLabel}`;
      }
    } else {
      drilldownBar.style.display = 'none';
    }
  }

  // 3. Filter targets for the Details Table based on active drilldown
  let detailsTargets = targetList.slice();

  if (coverageDrilldownState.repId) {
    detailsTargets = detailsTargets.filter((t) => t.repId === coverageDrilldownState.repId);
  }

  if (coverageDrilldownState.type === 'visited') {
    detailsTargets = detailsTargets.filter((t) => t._visitsCount > 0);
  } else if (coverageDrilldownState.type === 'unvisited') {
    detailsTargets = detailsTargets.filter((t) => t._visitsCount === 0);
  } else if (coverageDrilldownState.type === 'actual') {
    const hasAnyExplicitActual = detailsTargets.some((t) => t._hasDirectActual);
    if (hasAnyExplicitActual) {
      detailsTargets = detailsTargets.filter((t) => t._hasDirectActual);
    } else {
      detailsTargets = detailsTargets.filter((t) => t._visitsCount > 0);
    }
  }

  // 4. Render Details Table rows
  if (detailsTbody) {
    if (detailsTargets.length === 0) {
      detailsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
            ${lang === 'ar' ? 'لا توجد أهداف مطابقة لهذا الاختيار المحدد.' : 'No targets match the selected drill-down filter.'}
          </td>
        </tr>
      `;
    } else {
      detailsTargets.forEach((target) => {
        const matchingVisits = target._matchingVisits || [];
        const visitsCount = target._visitsCount || 0;
        const targetFreq = target._targetFreq || 1;

        let timestampsHtml = '';
        if (matchingVisits.length > 0) {
          matchingVisits.forEach((v) => {
            const isAct = Boolean(v.isActual) || v.source === 'actual';
            const cardTypeClass = isAct ? 'actual-type' : 'planned-type';
            const typeLabel = isAct ? (lang === 'ar' ? 'فعلية' : 'Actual') : (lang === 'ar' ? 'خطة' : 'Plan');

            timestampsHtml += `
              <div class="visit-timestamp-card ${cardTypeClass}" title="${isAct ? 'Direct Actual Visit' : 'Planned Visit'}">
                <div class="visit-date-row">
                  <span>${v.date}</span>
                  ${isAct ? `<span style="font-size: 0.7rem; color: #d97706;" title="Actual">★</span>` : ''}
                </div>
                <div class="visit-time-row">
                  <span>⏰ ${v.time || '10:00'}</span>
                  <span style="opacity: 0.7;">• ${typeLabel}</span>
                </div>
              </div>
            `;
          });
        } else {
          timestampsHtml = `<span style="color: var(--gray-400); font-style: italic; font-size: 0.8rem;">${lang === 'ar' ? 'لا توجد زيارات في هذه الفترة' : 'No visits in this period'}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${window.escapeHtml(target.name)}</strong>
          </td>
          <td>
            <span class="badge" style="background: ${target.class === 'A' ? 'var(--primary)' : target.class === 'B' ? 'var(--info)' : '#6f42c1'}; color: white; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">
              ${target.class === 'hospital' || (target.class || '').toLowerCase() === 'hospital' ? 'Hospital' : 'Class ' + target.class}
            </span>
          </td>
          <td>${window.escapeHtml(target.specialty || '')}</td>
          <td style="font-weight: 700; text-align: center;">${targetFreq}</td>
          <td style="font-weight: 800; color: var(--primary); text-align: center;">${visitsCount}</td>
          <td>
            <div style="max-width: 340px; display: flex; flex-wrap: wrap; gap: 6px;">
              ${timestampsHtml}
            </div>
          </td>
        `;
        detailsTbody.appendChild(tr);
      });
    }
  }

  // 5. Update KPI Cards for the overall selected scope
  let totalTargetFreq = 0;
  let totalVisitsExecuted = 0;
  let coveredTargetsCount = 0;

  targetList.forEach((t) => {
    totalTargetFreq += (t._targetFreq || 1);
    totalVisitsExecuted += (t._visitsCount || 0);
    if ((t._visitsCount || 0) > 0) coveredTargetsCount++;
  });

  const overallCoveragePct = totalTargetFreq > 0 ? Math.round((totalVisitsExecuted / totalTargetFreq) * 100) : 0;

  const elOverall = document.getElementById('kpiCoverageOverall');
  const elExecuted = document.getElementById('kpiCoverageExecutedVisits');
  const elTarget = document.getElementById('kpiCoverageTargetVisits');
  const elTargetsCount = document.getElementById('kpiCoverageTargetsCount');
  const elPeriodSubtext = document.getElementById('kpiCoveragePeriodSubtext');
  const elTargetsSubtext = document.getElementById('kpiCoverageTargetsSubtext');

  if (elOverall) elOverall.textContent = `${overallCoveragePct}%`;
  if (elExecuted) elExecuted.textContent = totalVisitsExecuted.toLocaleString();
  if (elTarget) elTarget.textContent = totalTargetFreq.toLocaleString();
  if (elTargetsCount) elTargetsCount.textContent = `${coveredTargetsCount} / ${targetList.length}`;
  if (elPeriodSubtext) elPeriodSubtext.textContent = `${startDate} ~ ${endDate}`;
  if (elTargetsSubtext) elTargetsSubtext.textContent = lang === 'ar' ? 'الأطباء والمستشفيات المزارة' : 'Doctors/Hospitals Visited';

  if (typeof window.renderCoverageGaugeChart === 'function') {
    window.renderCoverageGaugeChart('repCoverageGaugeChart', 'repCoverageGaugeLabel', overallCoveragePct);
  }
}

// ============================================================================
// Section 9.1: Export CSV
// ============================================================================
function exportCoverageReport() {
  syncReportsData();
  const startDate = document.getElementById('coverageStartDate')?.value || _coverageStart();
  const endDate = document.getElementById('coverageEndDate')?.value || _coverageEnd();
  const classFilter = document.getElementById('coverageClassFilter')?.value || 'all';
  const repSelect = document.getElementById('coverageRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';

  const start = new Date(startDate);
  const end = new Date(endDate);

  let targetList = (REPORTS_DATA.doctors || []).slice();
  if (classFilter === 'all_doctors') targetList = targetList.filter((d) => d.class === 'A' || d.class === 'B');
  else if (classFilter === 'A') targetList = targetList.filter((d) => d.class === 'A');
  else if (classFilter === 'B') targetList = targetList.filter((d) => d.class === 'B');
  else if (classFilter === 'hospital') targetList = targetList.filter((d) => d.class === 'hospital' || (d.class || '').toLowerCase() === 'hospital');

  const user = checkAuth();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
  } else if (selectedRep && selectedRep !== 'all') {
    targetList = targetList.filter((d) => d.repId === selectedRep);
  }

  const numMonths = Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1
  );

  let totalTarget = 0;
  let totalExecuted = 0;

  let csv = 'Target Name,Area,Class,Specialty,Target Visits,Actual Visits\n';
  targetList.forEach((target) => {
    const matchingVisits = (REPORTS_DATA.visits || []).filter((v) => {
      const isCompleted = v.status === 'completed' || Boolean(v.isActual) || v.source === 'actual';
      if (!isCompleted) return false;
      const matchesTarget = (v.doctorId && target.id) ? (v.doctorId === target.id) : (v.targetName === target.name);
      if (!matchesTarget) return false;
      const vDate = new Date(v.date);
      return vDate >= start && vDate <= end;
    });
    const visitsCount = matchingVisits.length;
    const quarterlyRate = target.targetQuarterly || ((typeof window.getDoctorCallTarget === 'function')
      ? window.getDoctorCallTarget(target)
      : (target.class === 'A' ? 4 : (target.class === 'B' ? 3 : 6)));
    const targetFreq = Math.max(1, Math.round((quarterlyRate / 3) * numMonths));
    totalTarget += targetFreq;
    totalExecuted += visitsCount;

    csv += `"${target.name}","${target.area || ''}","${target.class}","${target.specialty || ''}",${targetFreq},${visitsCount}\n`;
  });

  const overallCoverage = totalTarget > 0 ? Math.round((totalExecuted / totalTarget) * 100) : 0;
  csv += `\n"Total Period Coverage","${startDate} to ${endDate}","${overallCoverage}%",,${totalTarget},${totalExecuted}\n`;

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaCare_Coverage_${startDate}_to_${endDate}.csv`;
  a.click();
}
