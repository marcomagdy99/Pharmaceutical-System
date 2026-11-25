/**
 * @file coverage-report.js
 * @description Reports page - "Coverage" tab: doctor/hospital visit
 * frequency vs target, employee summary breakdown table, interactive drill-down,
 * and Excel/CSV export.
 * Depends on shared-report.js (must load after it).
 */
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

function _covEsc(val) {
  if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
    return window.escapeHtml(val);
  }
  return String(val == null ? '' : val).replace(/[&<>"'`]/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
  }[ch]));
}

function _covCsvCell(val) {
  let s = String(val == null ? '' : val);
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  return '"' + s.replace(/"/g, '""') + '"';
}

function _covNormRole(role) {
  if (typeof window !== 'undefined' && typeof window.normalizeRole === 'function') {
    return window.normalizeRole(role);
  }
  if (!role) return '';
  const r = String(role).toLowerCase().trim();
  if (r === 'dm' || r === 'district_manager' || r === 'district manager') return 'district_manager';
  if (r === 'lm' || r === 'line_manager' || r === 'line manager') return 'line_manager';
  if (r === 'bu' || r === 'business_unit' || r === 'business unit') return 'business_unit';
  if (r === 'rep' || r === 'medical_rep' || r === 'medical rep') return 'medical_rep';
  if (r === 'pm' || r === 'product_manager' || r === 'product manager') return 'product_manager';
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'hr' || r === 'human_resources' || r === 'human resources') return 'hr';
  if (r === 'gm' || r === 'general_manager' || r === 'general manager') return 'general_manager';
  return r;
}

function _covIsRep(user) {
  if (!user) return false;
  if (typeof window !== 'undefined' && typeof window.isRepRole === 'function') {
    return window.isRepRole(user);
  }
  return _covNormRole(user.role) === 'medical_rep';
}

function _covHasFullOrgAccess(role) {
  return role === 'admin' || role === 'hr';
}

function _covGetAuthUser() {
  if (typeof window !== 'undefined' && typeof window.checkAuth === 'function') {
    const u = window.checkAuth();
    if (u && u.id) return u;
  }
  return null;
}

function _covNormalizeDateStr(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function _covDiffDays(startStr, endStr) {
  const sp = String(startStr || '').split('-').map(Number);
  const ep = String(endStr || '').split('-').map(Number);
  if (sp.length !== 3 || ep.length !== 3) return 1;
  const startUtc = Date.UTC(sp[0], sp[1] - 1, sp[2]);
  const endUtc = Date.UTC(ep[0], ep[1] - 1, ep[2]);
  if (isNaN(startUtc) || isNaN(endUtc)) return 1;
  return Math.max(1, Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1);
}

function _covGetUserLineIds(userId) {
  if (!userId || typeof window === 'undefined' || typeof window.getUserLines !== 'function') return [];
  return (window.getUserLines(userId) || []).filter(Boolean).map((l) => l.id);
}

function _covGetLmSubordinates(lmId, allUsers) {
  const dms = allUsers.filter((u) => u && u.managerId === lmId && _covNormRole(u.role) === 'district_manager');
  const dmIds = dms.map((d) => d.id);
  const directReps = allUsers.filter((u) => u && u.managerId === lmId && _covIsRep(u));
  const dmReps = allUsers.filter((u) => u && dmIds.includes(u.managerId));
  const repMap = new Map();
  [...directReps, ...dmReps].forEach((r) => {
    if (r && r.id) repMap.set(r.id, r);
  });
  const reps = Array.from(repMap.values());
  return { dms, dmIds, reps, repIds: reps.map((r) => r.id) };
}

function _covGetBuSubordinates(buId, allUsers) {
  const myLMs = allUsers.filter((u) => u && u.managerId === buId && _covNormRole(u.role) === 'line_manager');
  const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(buId) : [];
  const combinedMap = new Map();
  [...myLMs, ...myDownstream].forEach((u) => {
    if (u && u.id) combinedMap.set(u.id, u);
  });
  return Array.from(combinedMap.values());
}

function _covMatchesRepTarget(doc, repId, allUsers, allAreas) {
  if (!doc || !repId) return false;
  if (doc.repId) return doc.repId === repId;
  // Unassigned doctor fallback: only match strictly via areaId or same-line area name
  const repUser = allUsers.find((u) => u && u.id === repId);
  const repUserAreaIds = repUser ? (Array.isArray(repUser.areaIds) && repUser.areaIds.length ? repUser.areaIds : (repUser.areaId ? [repUser.areaId] : [])) : [];
  const repAreas = allAreas.filter((a) => a && (a.repId === repId || repUserAreaIds.includes(a.id)));
  const repAreaIds = repAreas.map((a) => a.id);
  if (doc.areaId) {
    return repAreaIds.includes(doc.areaId);
  }
  if (!doc.area) return false;
  const docAreaLower = String(doc.area).toLowerCase().trim();
  const repLineIds = _covGetUserLineIds(repId);
  if (doc.lineId && repLineIds.length > 0 && !repLineIds.includes(doc.lineId)) {
    return false;
  }
  const repAreaNames = repAreas.map((a) => String(a.name || '').toLowerCase().trim()).filter(Boolean);
  if (repUser && repUser.area) {
    String(repUser.area).split(',').forEach((s) => {
      const t = s.trim().toLowerCase();
      if (t) repAreaNames.push(t);
    });
  }
  return repAreaNames.includes(docAreaLower);
}

function _covDocMatchesLine(doc, lineId, allAreas, fullOrgAccess) {
  if (!doc) return false;
  if (doc.areaId) {
    const a = allAreas.find((x) => x && x.id === doc.areaId);
    if (a && a.lineId) return a.lineId === lineId;
  }
  if (doc.lineId) return doc.lineId === lineId;
  if (Array.isArray(doc.lineIds) && doc.lineIds.length > 0) return doc.lineIds.includes(lineId);
  if (doc.repId) {
    const repLines = _covGetUserLineIds(doc.repId);
    if (repLines.includes(lineId)) return true;
  }
  return !doc.repId && fullOrgAccess;
}

// Active drilldown filter state for Coverage tab
var svgCalendar = (typeof window !== 'undefined' && window.svgCalendar) || '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-inline-end:3px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>';
var svgClock = (typeof window !== 'undefined' && window.svgClock) || '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-inline-end:3px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

let coverageDrilldownState = {
  type: 'all', // 'all' | 'visited' | 'unvisited' | 'actual'
  repId: null,
  repName: '',
};

// Cached context to allow re-filtering details table without re-querying
let coverageReportContext = null;

window.setCoverageDrilldown = function (type, repId, repName) {
  coverageDrilldownState = {
    type: type || 'all',
    repId: repId || null,
    repName: repName || '',
  };
  renderCoverageReportView();
};

window.resetCoverageDrilldown = function () {
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
  const distinctAreas = Array.from(new Set((repTargets || []).map((d) => d && d.area).filter(Boolean)));
  if (distinctAreas.length > 0) {
    return distinctAreas.slice(0, 2).join(', ') + (distinctAreas.length > 2 ? ` (+${distinctAreas.length - 2})` : '');
  }
  return '—';
}

function bindCoverageSummaryDelegation(summaryTbody) {
  if (!summaryTbody || !summaryTbody.dataset || summaryTbody.dataset.coverageBound === '1') return;
  summaryTbody.dataset.coverageBound = '1';
  summaryTbody.addEventListener('click', (e) => {
    const btn = e.target && typeof e.target.closest === 'function'
      ? e.target.closest('button[data-drilldown-type]')
      : null;
    if (!btn) return;
    e.preventDefault();
    const type = btn.dataset.drilldownType || 'all';
    const repId = btn.dataset.repId || null;
    const repName = btn.dataset.repName || '';
    window.setCoverageDrilldown(type, repId, repName);
  });
}

/**
 * Shared computation engine used by both renderCoverageReport() and exportCoverageReport()
 * so on-screen KPIs/tables and exported CSV are always 100% consistent.
 */
function buildCoverageDataset() {
  if (typeof syncReportsData === 'function') {
    syncReportsData();
  }

  const user = _covGetAuthUser();
  if (!user) return null;

  const rawStartDate = document.getElementById('coverageStartDate')?.value || _coverageStart();
  const rawEndDate = document.getElementById('coverageEndDate')?.value || _coverageEnd();
  const startDate = _covNormalizeDateStr(rawStartDate) || _coverageStart();
  const endDate = _covNormalizeDateStr(rawEndDate) || _coverageEnd();

  if (endDate < startDate) {
    if (typeof window.showToast === 'function') {
      window.showToast('End date cannot be earlier than start date.', 'warning');
    }
    return null;
  }

  const classFilter = document.getElementById('coverageClassFilter')?.value || 'all';
  const lmSelect = document.getElementById('coverageLmSelect');
  const dmSelect = document.getElementById('coverageDmSelect');
  const repSelect = document.getElementById('coverageRepSelect');
  const selectedRep = (repSelect && repSelect.value !== 'all')
    ? repSelect.value
    : ((dmSelect && dmSelect.value !== 'all')
      ? dmSelect.value
      : ((lmSelect && lmSelect.value !== 'all') ? lmSelect.value : 'all'));
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';

  const role = _covNormRole(user.role);
  const isRep = _covIsRep(user);
  const fullOrgAccess = _covHasFullOrgAccess(role);
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users && typeof window.store.users.getAll === 'function'
      ? window.store.users.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.users)) || []);
  const allAreas = (window.store && window.store.areas && typeof window.store.areas.getAll === 'function'
    ? window.store.areas.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.areas)) || [];
  const allLines = (window.store && window.store.productLines && typeof window.store.productLines.getAll === 'function'
    ? window.store.productLines.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.productLines)) || [];

  const diffDays = _covDiffDays(startDate, endDate);
  const numMonths = Math.max(1, Math.round((diffDays / 30.4375) * 10) / 10);
  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';

  let lineObj = null;
  if (selectedLineId && selectedLineId !== 'all') {
    lineObj = allLines.find((l) => l && l.id === selectedLineId) || null;
  }
  if (!lineObj && selectedRep && selectedRep !== 'all' && !selectedRep.startsWith('vacant:')) {
    const repUser = allUsers.find((u) => u && u.id === selectedRep);
    const lId = repUser ? ((repUser.lineIds && repUser.lineIds[0]) || repUser.lineId) : null;
    lineObj = allLines.find((l) => l && l.id === lId) || null;
  }
  if (!lineObj && user) {
    const lId = (user.lineIds && user.lineIds[0]) || user.lineId;
    lineObj = allLines.find((l) => l && l.id === lId) || null;
  }
  if (!lineObj && allLines.length > 0) {
    lineObj = allLines[0];
  }

  const freqA = lineObj && lineObj.callFrequency && lineObj.callFrequency.classA !== undefined ? Number(lineObj.callFrequency.classA) : 4;
  const freqB = lineObj && lineObj.callFrequency && lineObj.callFrequency.classB !== undefined ? Number(lineObj.callFrequency.classB) : 3;

  const reportsData = (typeof REPORTS_DATA !== 'undefined' && REPORTS_DATA) ? REPORTS_DATA : (window.DEMO_DATA || {});

  // 1. Filter raw doctors list by Doctor Class Filter
  let targetList = (Array.isArray(reportsData.doctors) ? reportsData.doctors : []).filter(Boolean).slice();
  if (classFilter === 'all_doctors') {
    targetList = targetList.filter((d) => {
      const c = String(d.class || '').toUpperCase();
      return c === 'A' || c === 'B';
    });
  } else if (classFilter === 'A') {
    targetList = targetList.filter((d) => String(d.class || '').toUpperCase() === 'A');
  } else if (classFilter === 'B') {
    targetList = targetList.filter((d) => String(d.class || '').toUpperCase() === 'B');
  } else if (classFilter === 'hospital') {
    targetList = targetList.filter((d) => String(d.class || '').toLowerCase() === 'hospital');
  }

  // 2. Helper for vacant area filtering WITH strict line/role/hierarchy authorization check
  const userLineIds = _covGetUserLineIds(user.id);
  const _covSubIds = (isBU || isGM || isLM || isDM) && typeof window.getAllSubordinates === 'function'
    ? new Set([user.id, ...window.getAllSubordinates(user.id).map((u) => u.id)])
    : new Set([user.id]);
  const canAccessVacantArea = (vacantArea) => {
    if (!vacantArea) return false;
    if (fullOrgAccess) return true;
    if (isRep) return false;
    if (userLineIds.length === 0) return false;
    const areaLine = vacantArea.lineId || null;
    if (areaLine && !userLineIds.includes(areaLine)) return false;
    if (isPM) return Boolean(areaLine && userLineIds.includes(areaLine));
    const mgrId = typeof window.getAreaManagerId === 'function'
      ? window.getAreaManagerId(vacantArea, allUsers)
      : (vacantArea.dmId || vacantArea.managerId || null);
    if (isDM) return mgrId === user.id || vacantArea.dmId === user.id || vacantArea.managerId === user.id;
    if (isLM || isBU || isGM) {
      if (mgrId && _covSubIds.has(mgrId)) return true;
      if (vacantArea.dmId && _covSubIds.has(vacantArea.dmId)) return true;
      if (vacantArea.buId && _covSubIds.has(vacantArea.buId)) return true;
      return false;
    }
    return false;
  };
  let authorizedVacantArea = null;
  const filterVacantAreaTargets = (vacantSelection, list) => {
    const vacantAreaId = String(vacantSelection || '').slice('vacant:'.length);
    const vacantArea = allAreas.find((a) => a && a.id === vacantAreaId);
    if (!canAccessVacantArea(vacantArea)) return [];
    authorizedVacantArea = vacantArea;
    const areaNameLower = vacantArea.name ? String(vacantArea.name).toLowerCase().trim() : null;
    return list.filter((d) => {
      if (d.areaId) return d.areaId === vacantAreaId;
      if (areaNameLower && d.area && String(d.area).toLowerCase().trim() === areaNameLower) {
        if (vacantArea.lineId && d.lineId) return d.lineId === vacantArea.lineId;
        return !d.lineId || !vacantArea.lineId;
      }
      return false;
    });
  };

  // 3. Scope doctors strictly by authenticated role FIRST (never let `vacant:` bypass RBAC!)
  const isVacantFilter = Boolean(selectedRep && selectedRep.startsWith('vacant:'));
  let scopedReps = [];

  if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
    scopedReps = [user];
  } else if (role === 'product_manager') {
    // PM is strictly scoped to their assigned product lines (fail-closed if none)
    if (userLineIds.length === 0) {
      targetList = [];
      scopedReps = [];
    } else {
      targetList = targetList.filter((d) => userLineIds.some((lid) => _covDocMatchesLine(d, lid, allAreas, false)));
      if (isVacantFilter) {
        targetList = filterVacantAreaTargets(selectedRep, targetList);
      } else if (selectedRep && selectedRep !== 'all') {
        if (selectedRep === 'all_reps') {
          const repIds = allUsers.filter((u) => _covIsRep(u)).map((u) => u.id);
          targetList = targetList.filter((d) => d.repId && repIds.includes(d.repId));
        } else if (selectedRep === 'all_dms') {
          const dmIds = allUsers.filter((u) => _covNormRole(u.role) === 'district_manager').map((u) => u.id);
          const dmTeamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
          targetList = targetList.filter((d) => d.repId && (dmIds.includes(d.repId) || dmTeamRepIds.includes(d.repId)));
        } else {
          const selRole = _covNormRole((allUsers.find((u) => u && u.id === selectedRep) || {}).role);
          if (selRole === 'line_manager') {
            const lmSub = _covGetLmSubordinates(selectedRep, allUsers);
            const lmTeamIds = [selectedRep, ...lmSub.dmIds, ...lmSub.repIds];
            targetList = targetList.filter((d) => d.repId && lmTeamIds.includes(d.repId));
            scopedReps = lmSub.reps.length ? lmSub.reps : lmSub.dms;
          } else if (selRole === 'district_manager') {
            const dmReps = allUsers.filter((u) => u && u.managerId === selectedRep);
            const dmTeamIds = [selectedRep, ...dmReps.map((r) => r.id)];
            targetList = targetList.filter((d) => d.repId && dmTeamIds.includes(d.repId));
            scopedReps = dmReps.length ? dmReps : [allUsers.find((u) => u && u.id === selectedRep)].filter(Boolean);
          } else {
            const selLines = _covGetUserLineIds(selectedRep);
            const inPmScope = selLines.some((lid) => userLineIds.includes(lid));
            if (inPmScope) {
              targetList = targetList.filter((d) => _covMatchesRepTarget(d, selectedRep, allUsers, allAreas));
              const singleUser = allUsers.find((u) => u && u.id === selectedRep);
              if (singleUser) scopedReps = [singleUser];
            } else {
              targetList = [];
              scopedReps = [];
            }
          }
        }
      }
    }
  } else if (role === 'district_manager') {
    const teamReps = allUsers.filter((u) => u && u.managerId === user.id);
    const teamRepIds = teamReps.map((u) => u.id);
    const allowedIds = new Set([user.id, ...teamRepIds]);

    if (isVacantFilter) {
      targetList = filterVacantAreaTargets(selectedRep, targetList);
    } else if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.has(d.repId));
      const selfHasTargets = targetList.some((t) => t.repId === user.id);
      scopedReps = selfHasTargets ? [user, ...teamReps] : teamReps;
    } else if (allowedIds.has(selectedRep)) {
      targetList = targetList.filter((d) => _covMatchesRepTarget(d, selectedRep, allUsers, allAreas) && (!d.repId || allowedIds.has(d.repId)));
      const singleUser = allUsers.find((u) => u && u.id === selectedRep) || (selectedRep === user.id ? user : null);
      scopedReps = singleUser ? [singleUser] : [];
    } else {
      // Out-of-scope target requested by DM: fail-closed
      targetList = [];
      scopedReps = [];
    }
  } else if (role === 'line_manager') {
    const { dms, dmIds, reps, repIds } = _covGetLmSubordinates(user.id, allUsers);
    const allowedIds = new Set([user.id, ...dmIds, ...repIds]);

    if (isVacantFilter) {
      targetList = filterVacantAreaTargets(selectedRep, targetList);
    } else if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedIds.has(d.repId));
      scopedReps = reps.length ? reps : dms;
    } else if (selectedRep === 'all_dms') {
      targetList = targetList.filter((d) => d.repId && allowedIds.has(d.repId));
      scopedReps = dms;
    } else if (selectedRep === 'all_reps') {
      targetList = targetList.filter((d) => d.repId && repIds.includes(d.repId));
      scopedReps = reps;
    } else if (dmIds.includes(selectedRep)) {
      const dmReps = reps.filter((r) => r.managerId === selectedRep);
      const dmTeamIds = new Set([selectedRep, ...dmReps.map((r) => r.id)]);
      targetList = targetList.filter((d) => d.repId && dmTeamIds.has(d.repId) && allowedIds.has(d.repId));
      scopedReps = dmReps.length ? dmReps : [allUsers.find((u) => u && u.id === selectedRep)].filter(Boolean);
    } else if (allowedIds.has(selectedRep)) {
      targetList = targetList.filter((d) => _covMatchesRepTarget(d, selectedRep, allUsers, allAreas) && (!d.repId || allowedIds.has(d.repId)));
      const singleUser = allUsers.find((u) => u && u.id === selectedRep) || (selectedRep === user.id ? user : null);
      scopedReps = singleUser ? [singleUser] : [];
    } else {
      // Out-of-scope target requested by LM: fail-closed
      targetList = [];
      scopedReps = [];
    }
  } else if (role === 'business_unit' || role === 'general_manager') {
    const buSubordinates = _covGetBuSubordinates(user.id, allUsers);
    const allowedTeamIds = new Set([user.id, ...buSubordinates.map((u) => u.id)]);

    if (isVacantFilter) {
      targetList = filterVacantAreaTargets(selectedRep, targetList);
    } else if (selectedRep === 'all') {
      targetList = targetList.filter((d) => d.repId && allowedTeamIds.has(d.repId));
      const downstreamReps = buSubordinates.filter((u) => _covIsRep(u));
      scopedReps = downstreamReps.length ? downstreamReps : buSubordinates;
    } else if (selectedRep === 'all_reps') {
      const downstreamReps = buSubordinates.filter((u) => _covIsRep(u));
      const repIds = new Set(downstreamReps.map((u) => u.id));
      targetList = targetList.filter((d) => d.repId && repIds.has(d.repId));
      scopedReps = downstreamReps;
    } else if (selectedRep === 'all_dms') {
      const downstreamDms = buSubordinates.filter((u) => _covNormRole(u.role) === 'district_manager');
      const dmIds = downstreamDms.map((d) => d.id);
      const dmTeamRepIds = buSubordinates.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
      const dmScopeIds = new Set([...dmIds, ...dmTeamRepIds]);
      targetList = targetList.filter((d) => d.repId && dmScopeIds.has(d.repId));
      scopedReps = downstreamDms;
    } else if (allowedTeamIds.has(selectedRep)) {
      const selUser = allUsers.find((u) => u && u.id === selectedRep);
      const selRole = _covNormRole(selUser && selUser.role);
      if (selRole === 'line_manager') {
        const lmSub = _covGetLmSubordinates(selectedRep, allUsers);
        const lmTeamIds = new Set([selectedRep, ...lmSub.dmIds, ...lmSub.repIds]);
        targetList = targetList.filter((d) => d.repId && lmTeamIds.has(d.repId) && allowedTeamIds.has(d.repId));
        scopedReps = lmSub.reps.length ? lmSub.reps : (lmSub.dms.length ? lmSub.dms : [selUser]);
      } else if (selRole === 'district_manager') {
        const dmReps = allUsers.filter((u) => u && u.managerId === selectedRep && allowedTeamIds.has(u.id));
        const dmTeamIds = new Set([selectedRep, ...dmReps.map((r) => r.id)]);
        targetList = targetList.filter((d) => d.repId && dmTeamIds.has(d.repId) && allowedTeamIds.has(d.repId));
        scopedReps = dmReps.length ? dmReps : [selUser];
      } else {
        targetList = targetList.filter((d) => _covMatchesRepTarget(d, selectedRep, allUsers, allAreas) && (!d.repId || allowedTeamIds.has(d.repId)));
        scopedReps = selUser ? [selUser] : [];
      }
    } else {
      // Out-of-scope target requested by BU: fail-closed
      targetList = [];
      scopedReps = [];
    }
  } else if (fullOrgAccess) {
    if (isVacantFilter) {
      targetList = filterVacantAreaTargets(selectedRep, targetList);
    } else if (selectedRep && selectedRep !== 'all') {
      if (selectedRep === 'all_reps') {
        const repsOnly = allUsers.filter((u) => _covIsRep(u));
        const repIds = repsOnly.map((u) => u.id);
        targetList = targetList.filter((d) => d.repId && repIds.includes(d.repId));
        scopedReps = repsOnly;
      } else if (selectedRep === 'all_dms') {
        const dmsOnly = allUsers.filter((u) => _covNormRole(u.role) === 'district_manager');
        const dmIds = dmsOnly.map((u) => u.id);
        const dmTeamRepIds = allUsers.filter((u) => u && dmIds.includes(u.managerId)).map((u) => u.id);
        targetList = targetList.filter((d) => d.repId && (dmIds.includes(d.repId) || dmTeamRepIds.includes(d.repId)));
        scopedReps = dmsOnly;
      } else {
        const selUser = allUsers.find((u) => u && u.id === selectedRep);
        const selRole = _covNormRole(selUser && selUser.role);
        if (selRole === 'line_manager') {
          const lmSub = _covGetLmSubordinates(selectedRep, allUsers);
          const lmTeamIds = new Set([selectedRep, ...lmSub.dmIds, ...lmSub.repIds]);
          targetList = targetList.filter((d) => d.repId && lmTeamIds.has(d.repId));
          scopedReps = lmSub.reps.length ? lmSub.reps : (lmSub.dms.length ? lmSub.dms : [selUser].filter(Boolean));
        } else if (selRole === 'district_manager') {
          const dmReps = allUsers.filter((u) => u && u.managerId === selectedRep);
          const dmTeamIds = new Set([selectedRep, ...dmReps.map((r) => r.id)]);
          targetList = targetList.filter((d) => d.repId && dmTeamIds.has(d.repId));
          scopedReps = dmReps.length ? dmReps : [selUser].filter(Boolean);
        } else {
          targetList = targetList.filter((d) => _covMatchesRepTarget(d, selectedRep, allUsers, allAreas));
          scopedReps = selUser ? [selUser] : [{ id: selectedRep, name: selectedRep }];
        }
      }
    }
  } else {
    // Unknown role: fail-closed
    targetList = [];
    scopedReps = [];
  }

  // 4. Apply selected Product Line filter identically for both screen & export
  if (selectedLineId !== 'all') {
    targetList = targetList.filter((d) => _covDocMatchesLine(d, selectedLineId, allAreas, fullOrgAccess));
  }

  // 5. Compute visits and target frequencies on shallow copies (never mutate store doctor records!)
  const visits = Array.isArray(reportsData.visits) ? reportsData.visits : [];
  const enrichedTargets = targetList.map((rawTarget) => {
    const matchingVisits = visits.filter((v) => {
      if (!v) return false;
      const vStatus = String(v.status || '').toLowerCase();
      const vSource = String(v.source || '').toLowerCase();
      const isCompleted = vStatus === 'completed' || Boolean(v.isActual) || vSource === 'actual';
      if (!isCompleted) return false;
      const matchesTarget = (v.doctorId && rawTarget.id)
        ? (v.doctorId === rawTarget.id)
        : (v.targetName && rawTarget.name && v.targetName === rawTarget.name);
      if (!matchesTarget) return false;
      // Isolate to the representative assigned to this target
      if (rawTarget.repId && v.repId && v.repId !== rawTarget.repId) return false;
      const vDateStr = _covNormalizeDateStr(v.date);
      return Boolean(vDateStr && vDateStr >= startDate && vDateStr <= endDate);
    });

    const clsUpper = String(rawTarget.class || '').toUpperCase();
    const defaultQuarterlyRate = clsUpper === 'A'
      ? freqA
      : (clsUpper === 'B' ? freqB : (clsUpper === 'C' ? 1 : 6));
    const quarterlyRate = rawTarget.targetQuarterly || ((typeof window.getDoctorCallTarget === 'function')
      ? window.getDoctorCallTarget(rawTarget)
      : defaultQuarterlyRate);

    return {
      ...rawTarget,
      _matchingVisits: matchingVisits,
      _visitsCount: matchingVisits.length,
      _actualVisitsCount: matchingVisits.length,
      _hasDirectActual: matchingVisits.some((v) => Boolean(v.isActual) || String(v.source || '').toLowerCase() === 'actual'),
      _targetFreq: Math.max(1, Math.round((quarterlyRate / 90) * diffDays)),
    };
  });

  // 6. Finalize scopedReps for summary table
  if (isVacantFilter) {
    if (isRep) {
      scopedReps = [user];
    } else {
      scopedReps = authorizedVacantArea
        ? [{
          id: selectedRep,
          name: `Vacant (${authorizedVacantArea.name})`,
          territory: authorizedVacantArea.name || '—',
          _isVacantGroup: true,
        }]
        : [];
    }
  } else if (scopedReps.length === 0 && (fullOrgAccess || role === 'product_manager')) {
    const repIdsInTargets = Array.from(new Set(enrichedTargets.map((d) => d.repId).filter(Boolean)));
    scopedReps = allUsers.filter((u) => u && repIdsInTargets.includes(u.id));
    if (!scopedReps.length && fullOrgAccess && selectedRep === 'all') {
      scopedReps = allUsers.filter((u) => _covIsRep(u));
    }
  }

  if (selectedLineId !== 'all' && !isVacantFilter && (!selectedRep || selectedRep === 'all' || selectedRep === 'all_reps' || selectedRep === 'all_dms')) {
    scopedReps = scopedReps.filter((r) => _covGetUserLineIds(r && r.id).includes(selectedLineId));
  }

  return {
    startDate,
    endDate,
    diffDays,
    numMonths,
    classFilter,
    selectedRep,
    selectedLineId,
    lineObj,
    freqA,
    freqB,
    targetList: enrichedTargets,
    scopedReps,
    allUsers,
    lang,
  };
}

// ============================================================================
// Section 9: Tab 3 - Coverage & Frequency Report
// ============================================================================
function renderCoverageReport() {
  const prompt = document.getElementById('coveragePromptContainer');
  const results = document.getElementById('coverageResultsContainer');
  if (prompt) prompt.style.display = 'none';
  if (results) results.style.display = 'block';

  const dataset = buildCoverageDataset();
  if (!dataset) {
    coverageReportContext = null;
    return;
  }

  const rulesEl = document.getElementById('coverageRulesBox');
  if (rulesEl) {
    const lineTag = dataset.lineObj && dataset.lineObj.name ? ` (${_covEsc(dataset.lineObj.name)})` : '';
    rulesEl.innerHTML = `<svg class="badge-svg-icon text-warning" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/><line x1="10" y1="21" x2="14" y2="21"/></svg> <strong>Coverage Rules${lineTag}:</strong> Class A Doctors = ${dataset.freqA} visits/Quarter | Class B Doctors = ${dataset.freqB} visits/Quarter | AM Hospitals = 2 visits/Month`;
  }

  coverageReportContext = dataset;

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
  const { startDate, endDate, targetList, scopedReps, allUsers, selectedRep } = coverageReportContext;

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

  if (summaryTbody) {
    summaryTbody.replaceChildren();
    bindCoverageSummaryDelegation(summaryTbody);
  }
  if (detailsTbody) detailsTbody.replaceChildren();

  // 1. Build & render Summary Table rows
  let grandDoctors = 0;
  let grandVisited = 0;
  let grandUnvisited = 0;
  let grandActualVisits = 0;
  const renderedRepRows = [];

  const scopedRepIdsSet = new Set(scopedReps.filter(Boolean).map((r) => r.id));

  scopedReps.forEach((rep) => {
    if (!rep) return;
    let repTargets;
    if (rep._isVacantGroup) {
      repTargets = targetList;
    } else if (_covNormRole(rep.role) === 'district_manager' && selectedRep === 'all_dms') {
      const dmTeamIds = new Set([
        rep.id,
        ...(allUsers || []).filter((u) => u && u.managerId === rep.id && !scopedRepIdsSet.has(u.id)).map((u) => u.id),
      ]);
      repTargets = targetList.filter((d) => d.repId && dmTeamIds.has(d.repId));
    } else {
      repTargets = targetList.filter((d) => d.repId === rep.id);
    }
    if (!rep._isVacantGroup && scopedReps.length === 1 && repTargets.length === 0 && targetList.length > 0) {
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
        const safeRepId = _covEsc(row.rep.id || '');
        const safeRepName = _covEsc(row.rep.name || 'Rep');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--gray-900);">${safeRepName}</td>
          <td style="font-weight: 600; color: var(--gray-700);">${_covEsc(row.territory)}</td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-all ${isCurrentRep && coverageDrilldownState.type === 'all' ? 'active' : ''}"
              data-drilldown-type="all"
              data-rep-id="${safeRepId}"
              data-rep-name="${safeRepName}"
              title="Show all doctors for this rep"
            >
              ${row.doctorsCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-visited ${isCurrentRep && coverageDrilldownState.type === 'visited' ? 'active' : ''}"
              data-drilldown-type="visited"
              data-rep-id="${safeRepId}"
              data-rep-name="${safeRepName}"
              title="Show visited doctors only"
            >
              ${row.visitedCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-unvisited ${isCurrentRep && coverageDrilldownState.type === 'unvisited' ? 'active' : ''}"
              data-drilldown-type="unvisited"
              data-rep-id="${safeRepId}"
              data-rep-name="${safeRepName}"
              title="Show unvisited doctors only"
            >
              ${row.unvisitedCount}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-actual ${isCurrentRep && coverageDrilldownState.type === 'actual' ? 'active' : ''}"
              data-drilldown-type="actual"
              data-rep-id="${safeRepId}"
              data-rep-name="${safeRepName}"
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
              data-drilldown-type="all"
              data-rep-id=""
              data-rep-name="All"
              title="Show all doctors"
            >
              ${grandDoctors}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-visited ${isTotalActive && coverageDrilldownState.type === 'visited' ? 'active' : ''}"
              data-drilldown-type="visited"
              data-rep-id=""
              data-rep-name="All"
              title="Show all visited doctors"
            >
              ${grandVisited}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-unvisited ${isTotalActive && coverageDrilldownState.type === 'unvisited' ? 'active' : ''}"
              data-drilldown-type="unvisited"
              data-rep-id=""
              data-rep-name="All"
              title="Show all unvisited doctors"
            >
              ${grandUnvisited}
            </button>
          </td>
          <td>
            <button
              type="button"
              class="drilldown-btn btn-actual ${isTotalActive && coverageDrilldownState.type === 'actual' ? 'active' : ''}"
              data-drilldown-type="actual"
              data-rep-id=""
              data-rep-name="All"
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

  if (coverageDrilldownState.repId && !String(coverageDrilldownState.repId).startsWith('vacant:')) {
    const matchedRow = renderedRepRows.find((r) => r.rep && r.rep.id === coverageDrilldownState.repId);
    detailsTargets = matchedRow ? matchedRow.repTargets.slice() : detailsTargets.filter((t) => t.repId === coverageDrilldownState.repId);
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
            const isAct = Boolean(v.isActual) || String(v.source || '').toLowerCase() === 'actual';
            const cardTypeClass = isAct ? 'actual-type' : 'planned-type';
            const typeLabel = isAct ? 'Actual' : 'Plan';

            const insD = v.insertionDate || (v.createdAt ? String(v.createdAt).slice(0, 10) : v.date) || '';
            let insT = v.insertionTime || '';
            if (!insT && v.createdAt) {
              const parsedCreated = new Date(v.createdAt);
              if (!isNaN(parsedCreated.getTime())) {
                insT = parsedCreated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              }
            }
            if (!insT) insT = v.time || '10:00';

            timestampsHtml += `
              <div class="visit-timestamp-card ${cardTypeClass}" title="${isAct ? 'Direct Actual Visit' : 'Planned Visit'}">
                <div class="visit-date-row">
                  <span>${svgCalendar} ${_covEsc(v.date || '')}</span>
                  ${isAct ? `<span style="font-size: 0.7rem; color: #d97706;" title="Actual">★</span>` : ''}
                </div>
                <div class="visit-time-row">
                  <span>${svgClock} ${_covEsc(v.time || '10:00')}</span>
                  <span style="opacity: 0.7;">• ${typeLabel}</span>
                </div>
                <div style="font-size: 0.68rem; color: #0d6efd; font-weight: 600; margin-top: 2px;"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Ins: ${_covEsc(insD)} ${_covEsc(insT)}</div>
              </div>
            `;
          });
        } else {
          timestampsHtml = `<span style="color: var(--gray-400); font-style: italic; font-size: 0.8rem;">No visits in this period</span>`;
        }

        const clsRaw = target.class != null ? String(target.class).trim() : '';
        const clsUpper = clsRaw.toUpperCase();
        const isHosp = clsRaw.toLowerCase() === 'hospital';
        const classLabel = isHosp ? 'Hospital' : (clsRaw ? 'Class ' + clsRaw : 'Unclassified');
        const badgeBg = clsUpper === 'A' ? 'var(--primary)' : (clsUpper === 'B' ? 'var(--info)' : '#6f42c1');

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${_covEsc(target.name || '')}</strong>
          </td>
          <td>
            <span class="badge" style="background: ${badgeBg}; color: white; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">
              ${_covEsc(classLabel)}
            </span>
          </td>
          <td>${_covEsc(target.specialty || '')}</td>
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
  const dataset = buildCoverageDataset();
  if (!dataset) return;

  const { startDate, endDate, targetList } = dataset;

  let totalTarget = 0;
  let totalExecuted = 0;

  let csv = 'Target Name,Area,Class,Specialty,Target Visits,Actual Visits\n';
  targetList.forEach((target) => {
    const visitsCount = target._visitsCount || 0;
    const targetFreq = target._targetFreq || 1;
    totalTarget += targetFreq;
    totalExecuted += visitsCount;

    csv += [
      _covCsvCell(target.name || ''),
      _covCsvCell(target.area || ''),
      _covCsvCell(target.class || ''),
      _covCsvCell(target.specialty || ''),
      targetFreq,
      visitsCount,
    ].join(',') + '\n';
  });

  const overallCoverage = totalTarget > 0 ? Math.round((totalExecuted / totalTarget) * 100) : 0;
  csv += '\n' + [
    _covCsvCell('Total Period Coverage'),
    _covCsvCell(`${startDate} to ${endDate}`),
    _covCsvCell(`${overallCoverage}%`),
    '',
    totalTarget,
    totalExecuted,
  ].join(',') + '\n';

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaCare_Coverage_${startDate}_to_${endDate}.csv`;
  a.click();
  setTimeout(() => {
    try { URL.revokeObjectURL(url); } catch (e) {}
  }, 1000);
}

window.onCoverageFilterChange = function () {
  const results = document.getElementById('coverageResultsContainer');
  if (results && results.style.display !== 'none' && typeof renderCoverageReport === 'function') {
    renderCoverageReport();
  }
};
