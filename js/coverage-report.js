// Dynamic default date helpers for coverage report
function _coverageStart() {
  const n = (window.getSystemDate && window.getSystemDate()) || new Date();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  return `${n.getFullYear()}-${m}-01`;
}
function _coverageEnd() {
  const n = (window.getSystemDate && window.getSystemDate()) || new Date();
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
  const prompt = document.getElementById('coveragePromptContainer');
  const results = document.getElementById('coverageResultsContainer');
  if (prompt) prompt.style.display = 'none';
  if (results) results.style.display = 'block';

  syncReportsData();

  const startDate = document.getElementById('coverageStartDate')?.value || _coverageStart();
  const endDate = document.getElementById('coverageEndDate')?.value || _coverageEnd();
  const classFilter = document.getElementById('coverageClassFilter')?.value || 'all';
  const repSelect = document.getElementById('coverageRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';
  const lang = getCurrentLang();

  const start = new Date(startDate);
  const end = new Date(endDate);

  const user = checkAuth() || (window.DEMO_DATA && window.DEMO_DATA.currentUser) || { id: 'u1790626000010', role: 'admin' };
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const numMonths = Math.max(1, Math.round(diffDays / 30));

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
    rulesEl.innerHTML = `💡 <strong>Coverage Rules${lineTag}:</strong> Class A Doctors = ${freqA} visits/Quarter | Class B Doctors = ${freqB} visits/Quarter | AM Hospitals = 2 visits/Month`;
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
  if (selectedRep && selectedRep.startsWith('vacant:')) {
    const vacantAreaId = selectedRep.split(':')[1];
    const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
    const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
    targetList = targetList.filter((d) => {
      if (d.areaId) return d.areaId === vacantAreaId;
      if (areaNameLower && d.area && d.area.toLowerCase().trim() === areaNameLower) {
        if (vacantArea && vacantArea.lineId && d.lineId) return d.lineId === vacantArea.lineId;
        return true;
      }
      return false;
    });
  } else if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
  } else if (role === 'district_manager' || role === 'dm') {
    const teamReps = allUsers.filter((u) => u.managerId === user.id);
    const teamRepIds = teamReps.map((u) => u.id);
    const allowedIds = [user.id, ...teamRepIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.includes(d.repId));
    } else {
      const repUser = allUsers.find((u) => u.id === selectedRep);
      const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
      const repAreaIds = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => a.id);
      const repAreaNames = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => (a.name || '').toLowerCase().trim());
      if (repUser && repUser.area) {
        repUser.area.split(',').forEach((s) => {
          const t = s.trim().toLowerCase();
          if (t) repAreaNames.push(t);
        });
      }
      targetList = targetList.filter((d) => (d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)) || (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))) && (!d.repId || allowedIds.includes(d.repId)));
    }
  } else if (role === 'line_manager' || role === 'lm') {
    const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);
    const allowedIds = [user.id, ...dmIds, ...repIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.includes(d.repId));
    } else if (dmIds.includes(selectedRep)) {
      const dmReps = reps.filter((r) => r.managerId === selectedRep).map((r) => r.id);
      targetList = targetList.filter((d) => (d.repId === selectedRep || dmReps.includes(d.repId)) && allowedIds.includes(d.repId));
    } else if (selectedRep) {
      const repUser = allUsers.find((u) => u.id === selectedRep);
      const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
      const repAreaIds = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => a.id);
      const repAreaNames = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => (a.name || '').toLowerCase().trim());
      if (repUser && repUser.area) {
        repUser.area.split(',').forEach((s) => {
          const t = s.trim().toLowerCase();
          if (t) repAreaNames.push(t);
        });
      }
      targetList = targetList.filter((d) => (d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)) || (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))) && (!d.repId || allowedIds.includes(d.repId)));
    }
  } else if (role === 'business_unit' || role === 'bu') {
    const myLMs = allUsers.filter((u) => u.managerId === user.id && (u.role === 'line_manager' || u.role === 'lm'));
    const lmIds = myLMs.map((u) => u.id);
    const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    const myDownstreamIds = myDownstream.map((u) => u.id);
    const allowedTeamIds = [user.id, ...lmIds, ...myDownstreamIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedTeamIds.includes(d.repId));
    } else {
      const isSelectedLM = allUsers.some((u) => u.id === selectedRep && (u.role === 'line_manager' || u.role === 'lm'));
      const isSelectedDM = allUsers.some((u) => u.id === selectedRep && (u.role === 'district_manager' || u.role === 'dm'));
      if (isSelectedLM) {
        const dmsUnderLM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
        const lmTeamIds = [selectedRep, ...dmsUnderLM, ...repsUnderLM];
        targetList = targetList.filter((d) => (lmTeamIds.includes(d.repId)) && allowedTeamIds.includes(d.repId));
      } else if (isSelectedDM) {
        const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        targetList = targetList.filter((d) => (d.repId === selectedRep || dmReps.includes(d.repId)) && allowedTeamIds.includes(d.repId));
      } else {
        targetList = targetList.filter((d) => d.repId === selectedRep && allowedTeamIds.includes(d.repId));
      }
    }
  } else if (selectedRep && selectedRep !== 'all') {
    if (selectedRep === 'all_reps') {
      const repIds = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep'))).map((u) => u.id);
      targetList = targetList.filter((d) => d.repId && repIds.includes(d.repId));
    } else if (selectedRep === 'all_dms') {
      const dmIds = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm'))).map((u) => u.id);
      const dmTeamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
      targetList = targetList.filter((d) => d.repId && (dmIds.includes(d.repId) || dmTeamRepIds.includes(d.repId)));
    } else {
      const isDM = allUsers.some((u) => u.id === selectedRep && (u.role === 'district_manager' || u.role === 'dm'));
      if (isDM) {
        const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        targetList = targetList.filter((d) => d.repId === selectedRep || dmReps.includes(d.repId));
      } else {
        const repUser = allUsers.find((u) => u.id === selectedRep);
        const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
        const repAreaIds = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => a.id);
        const repAreaNames = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => (a.name || '').toLowerCase().trim());
        if (repUser && repUser.area) {
          repUser.area.split(',').forEach((s) => {
            const t = s.trim().toLowerCase();
            if (t) repAreaNames.push(t);
          });
        }
        targetList = targetList.filter((d) => d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)) || (d.area && repAreaNames.includes(d.area.toLowerCase().trim())));
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    targetList = targetList.filter((d) => {
      if (d.lineId) return d.lineId === selectedLineId;
      if (Array.isArray(d.lineIds) && d.lineIds.length > 0) return d.lineIds.includes(selectedLineId);
      if (!d.repId) return role === 'admin' || role === 'hr';
      const repLines = window.getUserLines ? window.getUserLines(d.repId) : [];
      return repLines.some((l) => l.id === selectedLineId);
    });
  }

  // Pre-calculate visit counts for each target within selected date range
  const visits = REPORTS_DATA.visits || [];
  targetList.forEach((target) => {
    const matchingVisits = visits.filter((v) => {
      const isCompleted = v.status === 'completed' || Boolean(v.isActual) || v.source === 'actual';
      if (!isCompleted) return false;
      const matchesTarget = (v.doctorId && target.id) ? (v.doctorId === target.id) : (v.targetName === target.name);
      if (!matchesTarget) return false;
      // Isolate to the representative assigned to this target
      if (target.repId && v.repId && v.repId !== target.repId) return false;
      const vDate = new Date(v.date);
      return vDate >= start && vDate <= end;
    });

    target._matchingVisits = matchingVisits;
    target._visitsCount = matchingVisits.length;
    target._actualVisitsCount = matchingVisits.filter((v) => Boolean(v.isActual) || v.source === 'actual' || v.status === 'completed').length;
    target._hasDirectActual = matchingVisits.some((v) => Boolean(v.isActual) || v.source === 'actual');

    const quarterlyRate = target.targetQuarterly || ((typeof window.getDoctorCallTarget === 'function')
      ? window.getDoctorCallTarget(target)
      : (target.class === 'A' ? 4 : (target.class === 'B' ? 3 : (target.class === 'C' ? 1 : 6))));
    target._targetFreq = Math.max(1, Math.round((quarterlyRate / 90) * diffDays));
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
    const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
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

  if (selectedLineId !== 'all' && (!selectedRep || selectedRep === 'all' || selectedRep === 'all_reps' || selectedRep === 'all_dms')) {
    scopedReps = scopedReps.filter((r) => {
      const rLines = window.getUserLines ? window.getUserLines(r.id) : [];
      return rLines.some((l) => l.id === selectedLineId);
    });
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

    const headerTerritory = document.getElementById('covColTerritory');
  const headerEmployee = document.getElementById('covColEmployee');
  const headerDoctors = document.getElementById('covColDoctors');
  const headerVisited = document.getElementById('covColVisited');
  const headerUnvisited = document.getElementById('covColUnvisited');
  const headerActual = document.getElementById('covColActual');
  const headerAvgFreq = document.getElementById('covColAvgFreq');
  if (headerTerritory) headerTerritory.textContent = 'Territory / Area';
  if (headerEmployee) headerEmployee.textContent = 'Employee';
  if (headerDoctors) headerDoctors.textContent = 'Doctors';
  if (headerVisited) headerVisited.textContent = 'Visited Doctors';
  if (headerUnvisited) headerUnvisited.textContent = 'Unvisited Doctors';
  if (headerActual) headerActual.textContent = 'Actual Visits';
  if (headerAvgFreq) headerAvgFreq.textContent = 'Average Frequency';

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
            No employee data matching the selected filter.
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
              title="Show all doctors for this rep"
            >
              ${row.doctorsCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-visited ${isCurrentRep && coverageDrilldownState.type === 'visited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('visited', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="Show visited doctors only"
            >
              ${row.visitedCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-unvisited ${isCurrentRep && coverageDrilldownState.type === 'unvisited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('unvisited', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="Show unvisited doctors only"
            >
              ${row.unvisitedCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-actual ${isCurrentRep && coverageDrilldownState.type === 'actual' ? 'active' : ''}"
              onclick="setCoverageDrilldown('actual', '${row.rep.id}', '${escapeJsString(row.rep.name)}')"
              title="Show actual visits doctors"
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
          <td style="color: var(--primary);">TOTAL</td>
          <td>All Territories</td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-all ${isTotalActive && coverageDrilldownState.type === 'all' ? 'active' : ''}"
              onclick="setCoverageDrilldown('all', null, 'All')"
              title="Show all doctors"
            >
              ${grandDoctors}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-visited ${isTotalActive && coverageDrilldownState.type === 'visited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('visited', null, 'All')"
              title="Show all visited doctors"
            >
              ${grandVisited}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-unvisited ${isTotalActive && coverageDrilldownState.type === 'unvisited' ? 'active' : ''}"
              onclick="setCoverageDrilldown('unvisited', null, 'All')"
              title="Show all unvisited doctors"
            >
              ${grandUnvisited}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-actual ${isTotalActive && coverageDrilldownState.type === 'actual' ? 'active' : ''}"
              onclick="setCoverageDrilldown('actual', null, 'All')"
              title="Show all actual visit doctors"
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
        typeLabel = 'Visited Doctors Only';
      } else if (coverageDrilldownState.type === 'unvisited') {
        typeLabel = 'Unvisited Doctors Only';
      } else if (coverageDrilldownState.type === 'actual') {
        typeLabel = 'Actual Visits Doctors';
      } else {
        typeLabel = 'All Doctors';
      }

      const repLabel = coverageDrilldownState.repName ? ` (${coverageDrilldownState.repName})` : '';
      if (drilldownText) {
        drilldownText.textContent = `Filtered View: ${typeLabel}${repLabel}`;
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
            No targets match the selected drill-down filter.
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
            const typeLabel = isAct ? 'Actual' : 'Plan';

            timestampsHtml += `
              <div class="visit-timestamp-card ${cardTypeClass}" title="${isAct ? 'Direct Actual Visit' : 'Planned Visit'}">
                <div class="visit-date-row">
                  <span>📅 ${v.date}</span>
                  ${isAct ? `<span style="font-size: 0.7rem; color: #d97706;" title="Actual">★</span>` : ''}
                </div>
                <div class="visit-time-row">
                  <span>⏰ ${v.time || '10:00'}</span>
                  <span style="opacity: 0.7;">• ${typeLabel}</span>
                </div>
                ${(() => {
                  const insD = v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date);
                  const insT = v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || '10:00'));
                  return `<div style="font-size: 0.68rem; color: #0d6efd; font-weight: 600; margin-top: 2px;">📥 Ins: ${insD} ${insT}</div>`;
                })()}
              </div>
            `;
          });
        } else {
          timestampsHtml = `<span style="color: var(--gray-400); font-style: italic; font-size: 0.8rem;">No visits in this period</span>`;
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
  if (elTargetsSubtext) elTargetsSubtext.textContent = 'Doctors/Hospitals Visited';

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
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (role === 'medical_rep' || role === 'rep');

  // Scope doctors by user role and rep filter (aligned with renderCoverageReport)
  if (selectedRep && selectedRep.startsWith('vacant:')) {
    const vacantAreaId = selectedRep.split(':')[1];
    const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
    const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
    targetList = targetList.filter((d) => {
      if (d.areaId) return d.areaId === vacantAreaId;
      if (areaNameLower && d.area && d.area.toLowerCase().trim() === areaNameLower) {
        if (vacantArea && vacantArea.lineId && d.lineId) return d.lineId === vacantArea.lineId;
        return true;
      }
      return false;
    });
  } else if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
  } else if (role === 'district_manager' || role === 'dm') {
    const teamReps = allUsers.filter((u) => u.managerId === user.id);
    const teamRepIds = teamReps.map((u) => u.id);
    const allowedIds = [user.id, ...teamRepIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.includes(d.repId));
    } else {
      const repUser = allUsers.find((u) => u.id === selectedRep);
      const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
      const repAreaIds = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => a.id);
      const repAreaNames = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => (a.name || '').toLowerCase().trim());
      if (repUser && repUser.area) {
        repUser.area.split(',').forEach((s) => {
          const t = s.trim().toLowerCase();
          if (t) repAreaNames.push(t);
        });
      }
      targetList = targetList.filter((d) => (d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)) || (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))) && (!d.repId || allowedIds.includes(d.repId)));
    }
  } else if (role === 'line_manager' || role === 'lm') {
    const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);
    const allowedIds = [user.id, ...dmIds, ...repIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.includes(d.repId));
    } else if (dmIds.includes(selectedRep)) {
      const dmReps = reps.filter((r) => r.managerId === selectedRep).map((r) => r.id);
      targetList = targetList.filter((d) => (d.repId === selectedRep || dmReps.includes(d.repId)) && allowedIds.includes(d.repId));
    } else if (selectedRep) {
      const repUser = allUsers.find((u) => u.id === selectedRep);
      const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
      const repAreaIds = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => a.id);
      const repAreaNames = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => (a.name || '').toLowerCase().trim());
      if (repUser && repUser.area) {
        repUser.area.split(',').forEach((s) => {
          const t = s.trim().toLowerCase();
          if (t) repAreaNames.push(t);
        });
      }
      targetList = targetList.filter((d) => (d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)) || (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))) && (!d.repId || allowedIds.includes(d.repId)));
    }
  } else if (role === 'business_unit' || role === 'bu') {
    const myLMs = allUsers.filter((u) => u.managerId === user.id && (u.role === 'line_manager' || u.role === 'lm'));
    const lmIds = myLMs.map((u) => u.id);
    const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    const myDownstreamIds = myDownstream.map((u) => u.id);
    const allowedTeamIds = [user.id, ...lmIds, ...myDownstreamIds];

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedTeamIds.includes(d.repId));
    } else {
      const isSelectedLM = allUsers.some((u) => u.id === selectedRep && (u.role === 'line_manager' || u.role === 'lm'));
      const isSelectedDM = allUsers.some((u) => u.id === selectedRep && (u.role === 'district_manager' || u.role === 'dm'));
      if (isSelectedLM) {
        const dmsUnderLM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
        const lmTeamIds = [selectedRep, ...dmsUnderLM, ...repsUnderLM];
        targetList = targetList.filter((d) => (lmTeamIds.includes(d.repId)) && allowedTeamIds.includes(d.repId));
      } else if (isSelectedDM) {
        const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        targetList = targetList.filter((d) => (d.repId === selectedRep || dmReps.includes(d.repId)) && allowedTeamIds.includes(d.repId));
      } else {
        targetList = targetList.filter((d) => d.repId === selectedRep && allowedTeamIds.includes(d.repId));
      }
    }
  } else if (selectedRep && selectedRep !== 'all') {
    if (selectedRep === 'all_reps') {
      const repIds = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep'))).map((u) => u.id);
      targetList = targetList.filter((d) => d.repId && repIds.includes(d.repId));
    } else if (selectedRep === 'all_dms') {
      const dmIds = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm'))).map((u) => u.id);
      const dmTeamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
      targetList = targetList.filter((d) => d.repId && (dmIds.includes(d.repId) || dmTeamRepIds.includes(d.repId)));
    } else {
      const isDM = allUsers.some((u) => u.id === selectedRep && (u.role === 'district_manager' || u.role === 'dm'));
      if (isDM) {
        const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        targetList = targetList.filter((d) => d.repId === selectedRep || dmReps.includes(d.repId));
      } else {
        const repUser = allUsers.find((u) => u.id === selectedRep);
        const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
        const repAreaIds = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => a.id);
        const repAreaNames = allAreas.filter((a) => a.repId === selectedRep || repUserAreaIds.includes(a.id)).map((a) => (a.name || '').toLowerCase().trim());
        if (repUser && repUser.area) {
          repUser.area.split(',').forEach((s) => {
            const t = s.trim().toLowerCase();
            if (t) repAreaNames.push(t);
          });
        }
        targetList = targetList.filter((d) => d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)) || (d.area && repAreaNames.includes(d.area.toLowerCase().trim())));
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    targetList = targetList.filter((d) => {
      if (d.lineId) return d.lineId === selectedLineId;
      if (!d.repId) return true;
      const repLines = window.getUserLines ? window.getUserLines(d.repId) : [];
      return repLines.some((l) => l.id === selectedLineId);
    });
  }

  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

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
      : (target.class === 'A' ? 4 : (target.class === 'B' ? 3 : (target.class === 'C' ? 1 : 6))));
    const targetFreq = Math.max(1, Math.round((quarterlyRate / 90) * diffDays));
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

window.onCoverageFilterChange = function () {
  const results = document.getElementById('coverageResultsContainer');
  if (results && results.style.display !== 'none' && typeof renderCoverageReport === 'function') {
    renderCoverageReport();
  }
};

