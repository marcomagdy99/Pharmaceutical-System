/**
 * @file achievements-report.js
 * @description Reports page - "Achievements" tab: Territory/Rep sales
 * achievement broken down by product (Target vs Actual, in both Units
 * and Value), mirroring the real CRM's "Employees Achievement" report.
 * Depends on shared-report.js and sales-report.js (must load after both --
 * reuses store.targets, store.distributorSales, and sales-report.js's
 * getAllProductsFlat()).
 *
 * Built purely from real data: store.targets (Admin-entered, in Units +
 * Unit Price) and distributorSales rows that have been matched to a rep
 * AND a product (via the Area/Product alias linking in distributors.html).
 * Legacy demo rows (REPORTS_DATA.sales) are intentionally excluded --
 * they carry no productId, so they can't be placed in this breakdown.
 */

const ACH_MONTHS = (typeof window !== 'undefined' && Array.isArray(window.MONTH_NAMES) && window.MONTH_NAMES.length === 12)
  ? window.MONTH_NAMES
  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

window.toggleAchMonthDropdown = function(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  populateAchFilters();
  const menu = document.getElementById('achMonthDropdownMenu');
  if (menu) menu.classList.toggle('show');
};

window.closeAchMonthDropdown = function() {
  const menu = document.getElementById('achMonthDropdownMenu');
  if (menu) menu.classList.remove('show');
};

window.toggleSelectAllAchMonths = function(isChecked) {
  document.querySelectorAll('.ach-month-checkbox').forEach((cb) => {
    cb.checked = isChecked;
  });
  updateAchMonthDropdownLabel();
};

window.onAchMonthCheckboxChange = function() {
  const allCheckboxes = document.querySelectorAll('.ach-month-checkbox');
  const checkedBoxes = document.querySelectorAll('.ach-month-checkbox:checked');
  const selectAll = document.getElementById('achSelectAllMonths');
  if (selectAll) {
    selectAll.checked = (allCheckboxes.length > 0 && allCheckboxes.length === checkedBoxes.length);
  }
  updateAchMonthDropdownLabel();
};

function updateAchMonthDropdownLabel() {
  const labelEl = document.getElementById('achMonthDropdownLabel');
  if (!labelEl) return;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
  const allBoxes = document.querySelectorAll('.ach-month-checkbox');
  const checkedBoxes = Array.from(document.querySelectorAll('.ach-month-checkbox:checked'));

  if (checkedBoxes.length === 0) {
    labelEl.textContent = 'No Months Selected';
  } else if (checkedBoxes.length === allBoxes.length && allBoxes.length > 0) {
    labelEl.textContent = 'All Months';
  } else if (checkedBoxes.length <= 2) {
    const names = checkedBoxes.map((cb) => {
      const idx = parseInt(cb.value, 10) - 1;
      return ACH_MONTHS[idx];
    });
    labelEl.textContent = names.join(', ');
  } else {
    labelEl.textContent = `${checkedBoxes.length} Months Selected`;
  }
}

function getSelectedAchMonths() {
  const checked = document.querySelectorAll('.ach-month-checkbox:checked');
  return Array.from(checked).map((cb) => cb.value);
}

function populateAchFilters() {
  const container = document.getElementById('achMonthCheckboxList');
  const yearSelect = document.getElementById('achYearSelect');
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
  const now = new Date();

  if (container && !container.dataset.populated) {
    container.textContent = '';
    const currentMonthVal = String(now.getMonth() + 1).padStart(2, '0');
    ACH_MONTHS.forEach((m, idx) => {
      const val = String(idx + 1).padStart(2, '0');
      const label = document.createElement('label');
      label.className = 'multi-select-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'ach-month-checkbox';
      cb.value = val;
      if (val === currentMonthVal) cb.checked = true;
      cb.addEventListener('change', window.onAchMonthCheckboxChange);
      const span = document.createElement('span');
      span.textContent = m;
      label.appendChild(cb);
      label.appendChild(span);
      container.appendChild(label);
    });
    container.dataset.populated = 'true';
    updateAchMonthDropdownLabel();
  }

  if (yearSelect && !yearSelect.dataset.populated) {
    if (yearSelect.options.length === 0) {
      const currentYear = String(now.getFullYear());
      const yearsList = typeof window.getDynamicYears === 'function' ? window.getDynamicYears() : ['2025', '2026', '2027'];
      yearsList.forEach((y) => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
      });
    }
    yearSelect.dataset.populated = 'true';
  }

  populateAchAreas();

  const achRepEl = document.getElementById('achRepSelect');
  if (achRepEl && !achRepEl.dataset.achAreaListenerBound) {
    achRepEl.dataset.achAreaListenerBound = 'true';
    achRepEl.addEventListener('change', () => {
      populateAchAreas();
    });
  }
}

function populateAchAreas(filterUser) {
  const areaSelect = document.getElementById('achAreaSelect');
  if (!areaSelect) return;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
  const allLabel = 'All Areas';
  const prevVal = areaSelect.value;
  areaSelect.innerHTML = `<option value="all">${allLabel}</option>`;

  const curUser = filterUser || (typeof checkAuth === 'function' ? checkAuth() : null);
  const isRep = window.isRepRole ? window.isRepRole(curUser) : (curUser && (curUser.role === 'medical_rep' || curUser.role === 'rep'));
  const lmSelect = document.getElementById('achLmSelect');
  const dmSelect = document.getElementById('achDmSelect');
  const repSelect = document.getElementById('achRepSelect');
  const selectedRepVal = (repSelect && repSelect.value !== 'all') ? repSelect.value : ((dmSelect && dmSelect.value !== 'all') ? dmSelect.value : ((lmSelect && lmSelect.value !== 'all') ? lmSelect.value : 'all'));
  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  let areasToDisplay = [];

  if (isRep && curUser) {
    areasToDisplay = (window.store && window.store.areas ? window.store.areas.getByRep(curUser.id) : allAreas.filter((a) => a.repId === curUser.id));
  } else if (selectedRepVal && selectedRepVal.startsWith('vacant:')) {
    const vacantAreaId = selectedRepVal.split(':')[1];
    areasToDisplay = allAreas.filter((a) => a.id === vacantAreaId);
  } else if (selectedRepVal && selectedRepVal !== 'all' && selectedRepVal !== 'all_reps' && selectedRepVal !== 'all_dms') {
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const selUser = allUsers.find((u) => u.id === selectedRepVal);
    const isLM = selUser && (selUser.role === 'line_manager' || selUser.role === 'lm');
    const isDM = selUser && (selUser.role === 'district_manager' || selUser.role === 'dm');

    if (isDM) {
      const repsUnderDM = allUsers.filter((u) => u.managerId === selectedRepVal).map((u) => u.id);
      areasToDisplay = allAreas.filter((a) => {
        if (a.repId && repsUnderDM.includes(a.repId)) return true;
        const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(a, allUsers) : null;
        return mgrId === selectedRepVal;
      });
    } else if (isLM) {
      const dms = allUsers.filter((u) => u.managerId === selectedRepVal).map((d) => d.id);
      const lmReps = allUsers.filter((u) => dms.includes(u.managerId)).map((u) => u.id);
      areasToDisplay = allAreas.filter((a) => {
        if (a.repId && lmReps.includes(a.repId)) return true;
        if (selUser.lineId && a.lineId === selUser.lineId) return true;
        if (selUser.lineIds && selUser.lineIds.includes(a.lineId)) return true;
        return false;
      });
    } else {
      areasToDisplay = allAreas.filter((a) => a.repId === selectedRepVal);
    }
    if (areasToDisplay.length === 0) areasToDisplay = allAreas;
  } else {
    if (selectedLineId !== 'all') {
      areasToDisplay = allAreas.filter((a) => a.lineId === selectedLineId);
    } else {
      areasToDisplay = allAreas;
    }
  }

  // Strict line isolation: filter areas by selected line if a line is active
  if (selectedLineId !== 'all') {
    areasToDisplay = areasToDisplay.filter((a) => a.lineId === selectedLineId);
  }

  areaSelect.replaceChildren();
  const defaultOpt = document.createElement('option');
  defaultOpt.value = 'all';
  defaultOpt.textContent = 'All Areas';
  areaSelect.appendChild(defaultOpt);

  areasToDisplay.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.id;
    const isVacant = !a.repId;
    const vacantTag = isVacant ? ' [Vacant]' : '';
    opt.textContent = `${a.name}${a.code ? ' (' + a.code + ')' : ''}${vacantTag}`;
    areaSelect.appendChild(opt);
  });

  if (prevVal && Array.from(areaSelect.options).some((o) => o.value === prevVal)) {
    areaSelect.value = prevVal;
  } else {
    areaSelect.value = 'all';
  }
}

window.populateAchAreas = populateAchAreas;

/**
 * Which rep ids this viewer is allowed to see. Returns null for
 * Admin/Business Unit (no restriction -- everyone), or an array of rep
 * ids for a Rep (just themselves), District Manager (their direct
 * reports), or Line Manager (every rep under their DMs).
 */
function getAchievementsScopeRepIds(user) {
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));

  let allowedRepIds = null;
  if (isRep) {
    allowedRepIds = [user.id];
  } else if (role === 'district_manager') {
    allowedRepIds = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
    const dmIds = dms.map((d) => d.id);
    allowedRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
  } else if (role === 'business_unit') {
    const mySubordinates = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    allowedRepIds = mySubordinates
      .filter((u) => window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep'))
      .map((u) => u.id);
  }

  const lmSelect = document.getElementById('achLmSelect');
  const dmSelect = document.getElementById('achDmSelect');
  const repSelect = document.getElementById('achRepSelect');
  const selectedRep = (repSelect && repSelect.value !== 'all') ? repSelect.value : ((dmSelect && dmSelect.value !== 'all') ? dmSelect.value : ((lmSelect && lmSelect.value !== 'all') ? lmSelect.value : 'all'));

  if (selectedRep && selectedRep !== 'all') {
    if (selectedRep.startsWith('vacant:')) {
      return null;
    }
    if (selectedRep === 'all_reps' || selectedRep === 'all_dms') {
      return allowedRepIds;
    }
    const isLM = allUsers.some((u) => u.id === selectedRep && (u.role === 'line_manager' || u.role === 'lm'));
    if (isLM) {
      const dmsUnderLM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
      return allowedRepIds ? repsUnderLM.filter((id) => allowedRepIds.includes(id)) : repsUnderLM;
    }
    const isDM = allUsers.some((u) => u.id === selectedRep && (u.role === 'district_manager' || u.role === 'dm'));
    if (isDM) {
      const repsUnderDM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      return allowedRepIds ? repsUnderDM.filter((id) => allowedRepIds.includes(id)) : repsUnderDM;
    }
    if (allowedRepIds && !allowedRepIds.includes(selectedRep) && role !== 'admin') {
      return [];
    }
    return [selectedRep];
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    const repsForLine = allUsers
      .filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')))
      .filter((u) => {
        const repLines = window.getUserLines ? window.getUserLines(u.id) : [];
        return repLines.some((l) => l.id === selectedLineId);
      })
      .map((u) => u.id);
    allowedRepIds = allowedRepIds ? allowedRepIds.filter((id) => repsForLine.includes(id)) : repsForLine;
  }

  return allowedRepIds;
}

/**
 * Builds the Territory/Area -> Product breakdown for achievements.
 * Territory-centric calculation supporting both assigned reps and vacant territories.
 * Ensures vacant territories with sales or targets are fully tracked and roll up to DMs/LMs.
 */
function buildAchievementsData(monthKeys, scopeRepIds) {
  const keys = Array.isArray(monthKeys) ? monthKeys : [monthKeys];
  if (!keys.length) return [];

  const curUser = (typeof checkAuth === 'function' ? checkAuth() : null) || {};
  const isRep = window.isRepRole ? window.isRepRole(curUser) : (curUser && (curUser.role === 'medical_rep' || curUser.role === 'rep'));
  const userRole = window.normalizeRole ? window.normalizeRole(curUser.role) : (curUser.role || '').toLowerCase();

  const keysSet = new Set(keys);
  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
  const allProducts = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
  const productsMap = new Map(allProducts.map((p) => [p.id, p]));
  const usersMap = new Map(allUsers.map((u) => [u.id, u]));
  const areasMap = new Map(allAreas.map((a) => [a.id, a]));

  const repToAreaMap = new Map();
  allAreas.forEach((a) => {
    if (a.repId) repToAreaMap.set(a.repId, a.id);
  });

  // 1. Determine allowed areas based on viewer's role
  let allowedAreaIds = null;
  if (isRep) {
    const repAreas = allAreas.filter((a) => a.repId === curUser.id || (curUser.areaIds && curUser.areaIds.includes(a.id)));
    allowedAreaIds = new Set(repAreas.map((a) => a.id));
  } else if (userRole === 'district_manager' || userRole === 'dm') {
    const dmReps = allUsers.filter((u) => u.managerId === curUser.id).map((u) => u.id);
    const dmAreas = allAreas.filter((a) => {
      if (a.repId && dmReps.includes(a.repId)) return true;
      const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(a, allUsers) : null;
      if (mgrId === curUser.id) return true;
      if (!mgrId && (!a.lineId || (curUser.lineIds && curUser.lineIds.includes(a.lineId)) || curUser.lineId === a.lineId)) return true;
      return false;
    });
    allowedAreaIds = new Set(dmAreas.map((a) => a.id));
  } else if (userRole === 'line_manager' || userRole === 'lm') {
    const dms = allUsers.filter((u) => u.managerId === curUser.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
    const dmIds = dms.map((d) => d.id);
    const lmReps = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
    const lmAreas = allAreas.filter((a) => {
      if (a.repId && lmReps.includes(a.repId)) return true;
      if (curUser.lineId && a.lineId === curUser.lineId) return true;
      if (curUser.lineIds && curUser.lineIds.includes(a.lineId)) return true;
      return false;
    });
    allowedAreaIds = new Set(lmAreas.map((a) => a.id));
  }

  // 2. Apply UI filters (rep filter / vacant filter & area filter)
  const achLmSelect = document.getElementById('achLmSelect');
  const achDmSelect = document.getElementById('achDmSelect');
  const achRepSelect = document.getElementById('achRepSelect');
  const selectedRepVal = (achRepSelect && achRepSelect.value !== 'all') ? achRepSelect.value : ((achDmSelect && achDmSelect.value !== 'all') ? achDmSelect.value : ((achLmSelect && achLmSelect.value !== 'all') ? achLmSelect.value : 'all'));
  const achAreaSelect = document.getElementById('achAreaSelect');
  const selectedArea = achAreaSelect ? achAreaSelect.value : 'all';

  let filteredAreaIds = allowedAreaIds ? new Set(allowedAreaIds) : new Set(allAreas.map((a) => a.id));

  if (selectedRepVal && selectedRepVal !== 'all') {
    if (selectedRepVal.startsWith('vacant:')) {
      const vAreaId = selectedRepVal.split(':')[1];
      filteredAreaIds = new Set([vAreaId]);
    } else if (selectedRepVal === 'all_reps') {
      filteredAreaIds = new Set(Array.from(filteredAreaIds).filter((id) => {
        const a = areasMap.get(id);
        return a && a.repId;
      }));
    } else if (selectedRepVal === 'all_dms') {
      // Keep all
    } else {
      const selUser = usersMap.get(selectedRepVal);
      const selRole = selUser ? (window.normalizeRole ? window.normalizeRole(selUser.role) : (selUser.role || '').toLowerCase()) : '';
      if (selRole === 'district_manager' || selRole === 'dm') {
        const dmReps = allUsers.filter((u) => u.managerId === selectedRepVal).map((u) => u.id);
        const dmUserAreaIds = selUser ? (selUser.areaIds || (selUser.areaId ? [selUser.areaId] : [])) : [];
        filteredAreaIds = new Set(Array.from(filteredAreaIds).filter((id) => {
          const a = areasMap.get(id);
          if (!a) return false;
          if (a.repId && dmReps.includes(a.repId)) return true;
          if (dmUserAreaIds.includes(a.id)) return true;
          const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(a, allUsers) : null;
          return mgrId === selectedRepVal;
        }));
      } else if (selRole === 'line_manager' || selRole === 'lm') {
        const dms = allUsers.filter((u) => u.managerId === selectedRepVal).map((d) => d.id);
        const lmReps = allUsers.filter((u) => dms.includes(u.managerId)).map((u) => u.id);
        const lmUserLineIds = selUser ? (selUser.lineIds || (selUser.lineId ? [selUser.lineId] : [])) : [];
        filteredAreaIds = new Set(Array.from(filteredAreaIds).filter((id) => {
          const a = areasMap.get(id);
          return a && ((a.repId && (lmReps.includes(a.repId) || dms.includes(a.repId))) || (a.lineId && lmUserLineIds.includes(a.lineId)));
        }));
      } else {
        const repUserAreaIds = selUser ? (selUser.areaIds || (selUser.areaId ? [selUser.areaId] : [])) : [];
        filteredAreaIds = new Set(Array.from(filteredAreaIds).filter((id) => {
          const a = areasMap.get(id);
          return a && (a.repId === selectedRepVal || repUserAreaIds.includes(a.id));
        }));
      }
    }
  }

  if (selectedArea && selectedArea !== 'all') {
    filteredAreaIds = new Set([selectedArea]);
  }

  if (selectedLineId && selectedLineId !== 'all') {
    filteredAreaIds = new Set(Array.from(filteredAreaIds).filter((id) => {
      const a = areasMap.get(id);
      if (!a) return false;
      if (a.lineId) return a.lineId === selectedLineId;
      if (a.repId) {
        const rep = usersMap.get(a.repId);
        const repLines = rep ? (window.getUserLines ? window.getUserLines(rep.id).map((l) => l.id) : (rep.lineIds || (rep.lineId ? [rep.lineId] : []))) : [];
        if (repLines.includes(selectedLineId)) return true;
      }
      return false;
    }));
  }

  // 3. Load Targets and Distributor Sales
  let targets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
    .filter((t) => keysSet.has(t.month));

  let salesRows = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : [])
    .filter((s) => keysSet.has(s.month) && s.productId);

  // Sales type filter (Total / Private / Bulk)
  const achSalesTypeSelect = document.getElementById('achSalesTypeSelect');
  const activeAchType = achSalesTypeSelect ? achSalesTypeSelect.value : 'all';
  if (activeAchType === "private") {
    salesRows = salesRows.filter((s) => s.salesType !== "bulk");
  } else if (activeAchType === "bulk") {
    salesRows = salesRows.filter((s) => s.salesType === "bulk");
  }

  const curAllowedLineIds = (typeof getPharmSalesAllowedLineIds === 'function')
    ? getPharmSalesAllowedLineIds(curUser)
    : null;

  if (selectedLineId !== 'all') {
    targets = targets.filter((t) => {
      const prod = productsMap.get(t.productId);
      return prod && prod.lineId === selectedLineId;
    });
    salesRows = salesRows.filter((s) => {
      const prod = productsMap.get(s.productId);
      return prod && prod.lineId === selectedLineId;
    });
  } else if (curAllowedLineIds !== null) {
    targets = targets.filter((t) => {
      const prod = productsMap.get(t.productId);
      return prod && curAllowedLineIds.includes(prod.lineId);
    });
    salesRows = salesRows.filter((s) => {
      const prod = productsMap.get(s.productId);
      return prod && curAllowedLineIds.includes(prod.lineId);
    });
  }

  // 4. Map Targets & Sales into cellMap keyed by (areaId + '||' + productId)
  const areaNameToIdMap = new Map();
  allAreas.forEach((a) => {
    if (a.name) areaNameToIdMap.set(a.name.toLowerCase().trim(), a.id);
  });

  const cellMap = {};

  targets.forEach((t) => {
    let tAreaId = t.areaId;
    if (!tAreaId && t.repId) {
      tAreaId = repToAreaMap.get(t.repId);
    }
    if (!tAreaId && t.area) {
      tAreaId = areaNameToIdMap.get(t.area.toLowerCase().trim());
    }
    if (!tAreaId || !filteredAreaIds.has(tAreaId)) return;

    const area = areasMap.get(tAreaId);
    if (area && area.lineId) {
      const prod = productsMap.get(t.productId);
      if (prod && prod.lineId && prod.lineId !== area.lineId) return;
    }

    const key = tAreaId + '||' + t.productId;
    if (!cellMap[key]) {
      cellMap[key] = { areaId: tAreaId, productId: t.productId, sUnit: 0, sValue: 0, tUnit: 0, tValue: 0 };
    }
    cellMap[key].tUnit += parseFloat(t.targetUnits) || 0;
    cellMap[key].tValue += t.target != null
      ? parseFloat(t.target) || 0
      : (parseFloat(t.targetUnits) || 0) * (parseFloat(t.unitPrice) || 0);
  });

  salesRows.forEach((s) => {
    let sAreaId = s.areaId;
    if (!sAreaId && s.repId) {
      sAreaId = repToAreaMap.get(s.repId);
    }
    if (!sAreaId && s.area) {
      sAreaId = areaNameToIdMap.get(s.area.toLowerCase().trim());
    }
    if (!sAreaId && s.areaRaw) {
      sAreaId = areaNameToIdMap.get(s.areaRaw.toLowerCase().trim());
    }
    if (!sAreaId || !filteredAreaIds.has(sAreaId)) return;

    const area = areasMap.get(sAreaId);
    if (area && area.lineId) {
      const prod = productsMap.get(s.productId);
      if (prod && prod.lineId && prod.lineId !== area.lineId) return;
    }

    const key = sAreaId + '||' + s.productId;
    if (!cellMap[key]) {
      cellMap[key] = { areaId: sAreaId, productId: s.productId, sUnit: 0, sValue: 0, tUnit: 0, tValue: 0 };
    }
    cellMap[key].sUnit += parseFloat(s.quantity) || 0;
    cellMap[key].sValue += parseFloat(s.value) || 0;
  });

  // 5. Build Territory/Area Groups
  const areaGroups = {};
  Object.values(cellMap).forEach((cell) => {
    if (!areaGroups[cell.areaId]) {
      const area = areasMap.get(cell.areaId);
      const rep = area && area.repId ? usersMap.get(area.repId) : null;
      areaGroups[cell.areaId] = {
        areaId: cell.areaId,
        areaName: area ? area.name : cell.areaId,
        areaCode: area ? area.code : '',
        repId: area ? area.repId : null,
        repName: rep ? rep.name : 'Vacant',
        isVacant: !rep,
        totalSUnit: 0,
        totalSValue: 0,
        totalTUnit: 0,
        totalTValue: 0,
        products: [],
      };
    }
    const g = areaGroups[cell.areaId];
    const prod = productsMap.get(cell.productId);
    g.products.push({
      productId: cell.productId,
      productName: prod ? prod.name : cell.productId,
      sUnit: cell.sUnit,
      sValue: cell.sValue,
      tUnit: cell.tUnit,
      tValue: cell.tValue,
      pct: cell.tValue > 0 ? (cell.sValue / cell.tValue) * 100 : null,
    });
    g.totalSUnit += cell.sUnit;
    g.totalSValue += cell.sValue;
    g.totalTUnit += cell.tUnit;
    g.totalTValue += cell.tValue;
  });

  const groups = Object.values(areaGroups);
  groups.forEach((g) => {
    g.totalPct = g.totalTValue > 0 ? (g.totalSValue / g.totalTValue) * 100 : null;
    g.products.sort((a, b) => a.productName.localeCompare(b.productName));
  });

  // Sort: assigned reps first, then vacant areas
  groups.sort((a, b) => {
    if (a.isVacant !== b.isVacant) return a.isVacant ? 1 : -1;
    return (a.isVacant ? a.areaName : a.repName).localeCompare(b.isVacant ? b.areaName : b.repName);
  });
  return groups;
}

function renderAchievementsReport() {
  const prompt = document.getElementById('achievementsPromptContainer');
  const results = document.getElementById('achievementsResultsContainer');
  if (prompt) prompt.style.display = 'none';
  if (results) results.style.display = 'block';

  populateAchFilters();
  const yearSelect = document.getElementById('achYearSelect');
  const tbody = document.getElementById('achievementsReportTbody');
  if (!tbody) return;

  const now = new Date();
  const year = yearSelect ? yearSelect.value : String(now.getFullYear());
  const selectedMonths = getSelectedAchMonths();
  const monthKeys = selectedMonths.map((m) => `${year}-${m}`);

  const user = checkAuth();
  const scopeRepIds = getAchievementsScopeRepIds(user);
  const groups = buildAchievementsData(monthKeys, scopeRepIds);
  const lang = getCurrentLang();

  tbody.replaceChildren();
  let grandTarget = 0;
  let grandActual = 0;
  let grandTUnit = 0;
  let grandSUnit = 0;

  const kpiTarget = document.getElementById('kpiAchTotalTarget');
  const kpiActual = document.getElementById('kpiAchTotalActual');
  const kpiPct = document.getElementById('kpiAchOverallPct');
  const kpiReps = document.getElementById('kpiAchRepsCount');

  if (!selectedMonths.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          Please select at least one month.
        </td>
      </tr>
    `;
    if (kpiTarget) kpiTarget.textContent = '0';
    if (kpiActual) kpiActual.textContent = '0';
    if (kpiPct) kpiPct.textContent = '0%';
    if (kpiReps) kpiReps.textContent = '0';
    return;
  }

  if (!groups.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          No targets or rep/product-matched sales for selected months.
        </td>
      </tr>
    `;
    if (kpiTarget) kpiTarget.textContent = '0';
    if (kpiActual) kpiActual.textContent = '0';
    if (kpiPct) kpiPct.textContent = '0%';
    if (kpiReps) kpiReps.textContent = '0';
    return;
  }
    groups.forEach((g) => {
      grandTarget += g.totalTValue;
      grandActual += g.totalSValue;
      grandTUnit += g.totalTUnit;
      grandSUnit += g.totalSUnit;
      const totalPctLabel = g.totalPct === null ? '—' : g.totalPct.toFixed(1) + '%';
      const totalPctColor = g.totalPct !== null && g.totalPct >= 100 ? 'var(--success)' : 'var(--warning)';

      const totalRow = document.createElement('tr');
      totalRow.className = 'ach-total-row';
      totalRow.style.fontWeight = '800';

      const titleCellHtml = g.isVacant
        ? `<div><strong>${window.escapeHtml(g.areaName)}</strong> <span class="badge bg-warning text-dark ms-1" style="font-size: 0.72rem; padding: 2px 6px;">Vacant</span></div>
           <div style="font-size: 0.75rem; font-weight: 500; color: var(--gray-500);">${g.areaCode ? window.escapeHtml(g.areaCode) + ' • ' : ''}Unassigned Territory</div>`
        : `<div><strong>${window.escapeHtml(g.repName)}</strong></div>
           <div style="font-size: 0.75rem; font-weight: 500; color: var(--gray-500);">${window.escapeHtml(g.areaName)}${g.areaCode ? ' (' + window.escapeHtml(g.areaCode) + ')' : ''}</div>`;

      totalRow.innerHTML = `
        <td>${titleCellHtml}</td>
        <td>TOTAL</td>
        <td>${g.totalTUnit.toLocaleString()}</td>
        <td>${g.totalSUnit.toLocaleString()}</td>
        <td>${g.totalTValue.toLocaleString()}</td>
        <td style="color: var(--primary);">${g.totalSValue.toLocaleString()}</td>
        <td style="color: ${totalPctColor};">${totalPctLabel}</td>
      `;
      tbody.appendChild(totalRow);

      g.products.forEach((p) => {
        const pctLabel = p.pct === null ? '—' : p.pct.toFixed(1) + '%';
        const pctColor = p.pct !== null && p.pct >= 100 ? 'var(--success)' : 'var(--gray-500)';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td></td>
          <td style="padding-inline-start: 24px; color: var(--gray-600);">${window.escapeHtml(p.productName)}</td>
          <td>${p.tUnit.toLocaleString()}</td>
          <td>${p.sUnit.toLocaleString()}</td>
          <td>${p.tValue.toLocaleString()}</td>
          <td>${p.sValue.toLocaleString()}</td>
          <td style="color: ${pctColor};">${pctLabel}</td>
        `;
        tbody.appendChild(row);
      });
    });

    if (groups.length > 1) {
      const overallPct = grandTarget > 0 ? (grandActual / grandTarget) * 100 : null;
      const overallPctLabel = overallPct !== null ? overallPct.toFixed(1) + '%' : '—';
      const overallPctColor = overallPct !== null && overallPct >= 100 ? 'var(--success)' : 'var(--warning)';

      const grandRow = document.createElement('tr');
      grandRow.className = 'ach-grand-total-row';
      grandRow.style.cssText = "font-weight: 900; background: var(--gray-100, #f1f5f9); border-top: 3px double var(--gray-400);";
      grandRow.innerHTML = `
        <td style="color: var(--primary); font-size: 0.95rem;">OVERALL GRAND TOTAL</td>
        <td style="color: var(--gray-600);">ALL PRODUCTS</td>
        <td>${grandTUnit.toLocaleString()}</td>
        <td>${grandSUnit.toLocaleString()}</td>
        <td>${grandTarget.toLocaleString()}</td>
        <td style="color: var(--primary);">${grandActual.toLocaleString()}</td>
        <td style="color: ${overallPctColor}; font-size: 1.05rem;">${overallPctLabel}</td>
      `;
      tbody.appendChild(grandRow);
    }

  if (kpiTarget) kpiTarget.textContent = grandTarget.toLocaleString();
  if (kpiActual) kpiActual.textContent = grandActual.toLocaleString();
  if (kpiPct) kpiPct.textContent = grandTarget > 0 ? ((grandActual / grandTarget) * 100).toFixed(1) + '%' : '—';
  if (kpiReps) {
    const activeCount = groups.filter((g) => !g.isVacant).length;
    const vacantCount = groups.filter((g) => g.isVacant).length;
    kpiReps.innerHTML = vacantCount > 0
      ? `${activeCount} <small style="font-size: 0.72rem; color: var(--gray-500);">(+${vacantCount} Vacant)</small>`
      : `${activeCount}`;
  }

  if (typeof window.renderSalesTargetTrendChart === 'function') {
        const chartLabels = selectedMonths.map((mVal) => {
      const idx = parseInt(mVal, 10) - 1;
      return ACH_MONTHS[idx];
    });

    const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
    const achAreaSelect = document.getElementById('achAreaSelect');
    const selectedArea = achAreaSelect ? achAreaSelect.value : 'all';
    const selectedAreaObj = (selectedArea !== 'all' && window.store && window.store.areas)
      ? window.store.areas.getById(selectedArea)
      : null;
    const selectedAreaRepId = selectedAreaObj ? selectedAreaObj.repId : null;

    const allProducts = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
    const productsMap = new Map(allProducts.map((p) => [p.id, p]));

    const chartTargets = selectedMonths.map((mVal) => {
      const mKey = `${year}-${mVal}`;
      let mTargets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
        .filter((t) => t.month === mKey);
      if (selectedArea !== 'all') {
        mTargets = mTargets.filter((t) => t.areaId === selectedArea || (selectedAreaRepId && t.repId === selectedAreaRepId));
      }
      if (selectedLineId !== 'all') {
        mTargets = mTargets.filter((t) => {
          const p = productsMap.get(t.productId);
          return p && p.lineId === selectedLineId;
        });
      } else if (curAllowedLineIds !== null) {
        mTargets = mTargets.filter((t) => {
          const p = productsMap.get(t.productId);
          return p && curAllowedLineIds.includes(p.lineId);
        });
      }
      return mTargets.reduce((sum, t) => {
        return sum + (t.target != null ? (parseFloat(t.target) || 0) : ((parseFloat(t.targetUnits) || 0) * (parseFloat(t.unitPrice) || 0)));
      }, 0);
    });

    const chartActuals = selectedMonths.map((mVal) => {
      const mKey = `${year}-${mVal}`;
      let mSales = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : [])
        .filter((s) => s.month === mKey && s.productId && (!scopeRepIds || (s.repId && scopeRepIds.includes(s.repId))));
      if (selectedArea !== 'all') {
        mSales = mSales.filter((s) => s.areaId === selectedArea);
      }
      if (selectedLineId !== 'all') {
        mSales = mSales.filter((s) => {
          const p = productsMap.get(s.productId);
          return p && p.lineId === selectedLineId;
        });
      } else if (curAllowedLineIds !== null) {
        mSales = mSales.filter((s) => {
          const p = productsMap.get(s.productId);
          return p && curAllowedLineIds.includes(p.lineId);
        });
      }
      return mSales.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
    });

    window.renderSalesTargetTrendChart('achSalesTrendChart', {
      labels: chartLabels.length ? chartLabels : undefined,
      targets: chartTargets,
      actuals: chartActuals
    });
  }
}

function exportAchievementsReport() {
  const yearSelect = document.getElementById('achYearSelect');
  const now = new Date();
  const year = yearSelect ? yearSelect.value : String(now.getFullYear());
  const selectedMonths = getSelectedAchMonths();
  const monthKeys = selectedMonths.map((m) => `${year}-${m}`);

  const user = checkAuth();
  const scopeRepIds = getAchievementsScopeRepIds(user);
  const groups = buildAchievementsData(monthKeys, scopeRepIds);
  const lang = getCurrentLang();

  if (!groups.length) {
    if (typeof showToast === 'function') {
      showToast('No achievement data to export.', 'warning');
    }
    return;
  }

  const headers = [
    'Representative',
    'Territory',
    'Product',
    'Target Units',
    'Actual Units',
    'Target Value (EGP)',
    'Actual Value (EGP)',
    'Achievement %',
  ];

  const escapeCsv = (val) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = [];
  groups.forEach((g) => {
    // Rep Total Row
    rows.push([
      escapeCsv(g.repName),
      escapeCsv(g.areaName || ''),
      escapeCsv('TOTAL'),
      g.totalTUnit,
      g.totalSUnit,
      g.totalTValue,
      g.totalSValue,
      escapeCsv(g.totalPct !== null ? g.totalPct.toFixed(1) + '%' : '—'),
    ].join(','));

    // Products
    g.products.forEach((p) => {
      rows.push([
        escapeCsv(''),
        escapeCsv(''),
        escapeCsv(p.productName),
        p.tUnit,
        p.sUnit,
        p.tValue,
        p.sValue,
        escapeCsv(p.pct !== null ? p.pct.toFixed(1) + '%' : '—'),
      ].join(','));
    });
  });

  const csv = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `achievements_report_${year}_${selectedMonths.join('-') || 'all'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.populateAchFilters = populateAchFilters;
window.populateAchievementsFilters = populateAchFilters;
window.renderAchievementsReport = renderAchievementsReport;
window.exportAchievementsReport = exportAchievementsReport;

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      populateAchFilters();
    });
  } else {
    populateAchFilters();
  }
}
