/**
 * @file sales-report.js
 * @description Reports page - "Pharmacies Sales" tab: raw, per-pharmacy
 * detail straight from imported distributor sheets (store.distributorSales),
 * filterable by Product/Month/Year/Distributor/Date range/Line (Line is
 * locked to the viewer's own line(s) for Rep/DM/LM, open for BU/Admin/HR).
 * Also owns the Excel upload flow and the Manage Targets modal used by
 * the Achievements tab (achievements-report.js), which aggregates this
 * same distributorSales data on top -- this file is not itself an
 * aggregated view anymore.
 * Depends on shared-report.js (must load after it).
 */

// parseSalesNumber and parseDateStrict are provided globally by app.js


/**
 * Fills the upload bar's Distributor/Month/Year selects. Distributors
 * without a saved column mapping are still listed (so the admin can see
 * they exist) but flagged, since handleExcelUpload() will refuse to
 * proceed with them and point back to distributors.html instead of
 * silently hiding them and leaving the admin wondering where they went.
 */
function populateUploadControls() {
  const distSelect = document.getElementById('uploadDistributorSelect');
  const monthSelect = document.getElementById('uploadMonthSelect');
  const yearSelect = document.getElementById('uploadYearSelect');
  const lang = getCurrentLang();

  if (distSelect) {
    const currentVal = distSelect.value;
    const distributors = (window.store && window.store.distributors.getAll()) || [];
    const placeholder = lang === 'ar' ? '-- اختار الموزّع --' : '-- Select Distributor --';
    distSelect.innerHTML = `<option value="">${placeholder}</option>`;
    distributors.forEach((d) => {
      const hasMapping = !!(d.columnMap && d.columnMap.product && d.columnMap.value);
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = hasMapping
        ? d.name
        : `${d.name} ${lang === 'ar' ? '(غير مضبوط)' : '(not configured)'}`;
      distSelect.appendChild(opt);
    });
    if (currentVal && distributors.some((d) => d.id === currentVal)) {
      distSelect.value = currentVal;
    }
  }

  if (monthSelect && !monthSelect.dataset.populated) {
    const now = new Date();
    MONTH_NAMES.forEach((m, idx) => {
      const val = String(idx + 1).padStart(2, '0');
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = lang === 'ar' ? MONTH_NAMES_AR[idx] : m;
      if (idx === now.getMonth()) opt.selected = true;
      monthSelect.appendChild(opt);
    });
    monthSelect.dataset.populated = 'true';
  }

  if (yearSelect && !yearSelect.dataset.populated) {
    const currentYear = String(new Date().getFullYear());
    const yearsList = typeof window.getDynamicYears === 'function' ? window.getDynamicYears() : ['2025', '2026', '2027'];
    yearsList.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    });
    yearSelect.dataset.populated = 'true';
  }
}

/**
 * Returns the list of Line ids this user is restricted to (Rep/DM/LM --
 * a DM or LM covering more than one line gets all of them), or null for
 * an unrestricted role (BU/Admin/HR), meaning "every line".
 */
function getPharmSalesAllowedLineIds(user) {
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isOpenRole = role === 'admin' || role === 'hr';
  if (isOpenRole) return null;
  const userLines = typeof window.getUserLines === 'function' && user ? window.getUserLines(user.id) : [];
  return userLines.map((l) => l.id);
}

window.togglePharmSalesMonthDropdown = function(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const menu = document.getElementById('pharmSalesMonthDropdownMenu');
  if (menu) menu.classList.toggle('show');
};

window.closePharmSalesMonthDropdown = function() {
  const menu = document.getElementById('pharmSalesMonthDropdownMenu');
  if (menu) menu.classList.remove('show');
};

window.toggleSelectAllPharmSalesMonths = function(isChecked) {
  document.querySelectorAll('.pharm-sales-month-checkbox').forEach((cb) => {
    cb.checked = isChecked;
  });
  updatePharmSalesMonthDropdownLabel();
};

window.onPharmSalesMonthCheckboxChange = function() {
  const allCheckboxes = document.querySelectorAll('.pharm-sales-month-checkbox');
  const checkedBoxes = document.querySelectorAll('.pharm-sales-month-checkbox:checked');
  const selectAll = document.getElementById('pharmSalesSelectAllMonths');
  if (selectAll) {
    selectAll.checked = (allCheckboxes.length > 0 && allCheckboxes.length === checkedBoxes.length);
  }
  updatePharmSalesMonthDropdownLabel();
};

function updatePharmSalesMonthDropdownLabel() {
  const labelEl = document.getElementById('pharmSalesMonthDropdownLabel');
  if (!labelEl) return;
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
  const allBoxes = document.querySelectorAll('.pharm-sales-month-checkbox');
  const checkedBoxes = Array.from(document.querySelectorAll('.pharm-sales-month-checkbox:checked'));

  if (checkedBoxes.length === 0) {
    labelEl.textContent = lang === 'ar' ? 'لم يتم اختيار شهور' : 'No Months Selected';
  } else if (checkedBoxes.length === allBoxes.length && allBoxes.length > 0) {
    labelEl.textContent = lang === 'ar' ? 'كل الشهور' : 'All Months';
  } else if (checkedBoxes.length <= 2) {
    const names = checkedBoxes.map((cb) => {
      const idx = parseInt(cb.value, 10) - 1;
      return lang === 'ar' ? MONTH_NAMES_AR[idx] : MONTH_NAMES[idx];
    });
    labelEl.textContent = names.join(lang === 'ar' ? '، ' : ', ');
  } else {
    labelEl.textContent = lang === 'ar'
      ? `${checkedBoxes.length} شهور محددة`
      : `${checkedBoxes.length} Months Selected`;
  }
}

function getSelectedPharmSalesMonths() {
  const checked = document.querySelectorAll('.pharm-sales-month-checkbox:checked');
  return Array.from(checked).map((cb) => cb.value);
}

/**
 * Populates the Pharmacies Sales tab's filters: Product, Month (Multi-select), Year,
 * Distributor, and the role-scoped Line select (locked to the viewer's
 * own line(s) for Rep/DM/LM, fully open for BU/Admin/HR).
 */
function initPharmSalesFilters(user) {
  const monthContainer = document.getElementById('pharmSalesMonthCheckboxList');
  const yearSelect = document.getElementById('pharmSalesYearSelect');
  const distSelect = document.getElementById('pharmSalesDistributorSelect');
  const lang = getCurrentLang();
  const now = new Date();

  if (monthContainer && !monthContainer.dataset.populated) {
    monthContainer.textContent = '';
    const currentMonthVal = String(now.getMonth() + 1).padStart(2, '0');
    MONTH_NAMES.forEach((m, idx) => {
      const val = String(idx + 1).padStart(2, '0');
      const label = document.createElement('label');
      label.className = 'multi-select-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'pharm-sales-month-checkbox';
      cb.value = val;
      if (val === currentMonthVal) cb.checked = true;
      cb.addEventListener('change', window.onPharmSalesMonthCheckboxChange);
      const span = document.createElement('span');
      span.textContent = lang === 'ar' ? MONTH_NAMES_AR[idx] : m;
      label.appendChild(cb);
      label.appendChild(span);
      monthContainer.appendChild(label);
    });
    monthContainer.dataset.populated = 'true';
    updatePharmSalesMonthDropdownLabel();
  }

  if (yearSelect && !yearSelect.dataset.populated) {
    const currentYear = String(now.getFullYear());
    const yearsList = typeof window.getDynamicYears === 'function' ? window.getDynamicYears() : ['2025', '2026', '2027'];
    yearsList.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    });
    yearSelect.dataset.populated = 'true';
  }

  if (distSelect) {
    const distributors = (window.store && window.store.distributors ? window.store.distributors.getAll() : []);
    const allLabel = lang === 'ar' ? 'جميع الموزعين' : 'All Distributors';
    distSelect.innerHTML = `<option value="all">${allLabel}</option>`;
    distributors.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      distSelect.appendChild(opt);
    });
  }

  window.populatePharmSalesAreas = function (filterUser) {
    const areaSelect = document.getElementById('pharmSalesAreaSelect');
    if (!areaSelect) return;
    const curLang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    const allLabel = curLang === 'ar' ? 'جميع المناطق' : 'All Areas';
    const prevVal = areaSelect.value;
    areaSelect.innerHTML = `<option value="all">${allLabel}</option>`;

    const curUser = filterUser || (typeof checkAuth === 'function' ? checkAuth() : null);
    const isRep = window.isRepRole ? window.isRepRole(curUser) : (curUser && (curUser.role === 'medical_rep' || curUser.role === 'rep'));
    const repSelect = document.getElementById('pharmSalesRepSelect');
    const selectedRepVal = repSelect ? repSelect.value : 'all';

    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    let areasToDisplay = [];

    if (isRep) {
      areasToDisplay = (window.store && window.store.areas ? window.store.areas.getByRep(curUser.id) : allAreas.filter((a) => a.repId === curUser.id));
    } else if (selectedRepVal && selectedRepVal.startsWith('vacant:')) {
      const vacantAreaId = selectedRepVal.split(':')[1];
      areasToDisplay = allAreas.filter((a) => a.id === vacantAreaId);
    } else if (selectedRepVal && selectedRepVal !== 'all' && selectedRepVal !== 'all_reps' && selectedRepVal !== 'all_dms') {
      areasToDisplay = allAreas.filter((a) => a.repId === selectedRepVal);
      if (areasToDisplay.length === 0) areasToDisplay = allAreas;
    } else {
      const allowedLineIds = getPharmSalesAllowedLineIds(curUser);
      const effLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
      if (effLineId !== 'all' && effLineId !== 'none') {
        areasToDisplay = allAreas.filter((a) => a.lineId === effLineId);
      } else if (allowedLineIds !== null) {
        areasToDisplay = allAreas.filter((a) => allowedLineIds.includes(a.lineId));
      } else {
        areasToDisplay = allAreas;
      }
    }

    areasToDisplay.forEach((a) => {
      const opt = document.createElement('option');
      opt.value = a.id;
      const isVacant = !a.repId;
      const vacantTag = isVacant ? ` [${curLang === 'ar' ? 'شاغرة' : 'Vacant'}]` : '';
      opt.textContent = `${a.name}${a.code ? ' (' + a.code + ')' : ''}${vacantTag}`;
      areaSelect.appendChild(opt);
    });

    if (prevVal && Array.from(areaSelect.options).some((o) => o.value === prevVal)) {
      areaSelect.value = prevVal;
    } else {
      areaSelect.value = 'all';
    }
  };

  window.populatePharmSalesAreas(user);

  const pharmRepSelectEl = document.getElementById('pharmSalesRepSelect');
  if (pharmRepSelectEl && !pharmRepSelectEl.dataset.areaListenerBound) {
    pharmRepSelectEl.dataset.areaListenerBound = 'true';
    pharmRepSelectEl.addEventListener('change', () => {
      window.populatePharmSalesAreas(user);
    });
  }

  window.updatePharmSalesProductsForLine = function (selectedLineId) {
    const pSelect = document.getElementById('pharmSalesProductSelect');
    if (!pSelect) return;
    const curUser = typeof checkAuth === 'function' ? checkAuth() : null;
    const curLang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
    const curAllowedLineIds = getPharmSalesAllowedLineIds(curUser);
    const effLineId = selectedLineId || window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';

    const prevVal = pSelect.value;
    const allLabel = curLang === 'ar' ? 'جميع الأدوية' : 'All Products';
    pSelect.innerHTML = `<option value="all">${allLabel}</option>`;

    let products = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
    if (effLineId !== 'all') {
      products = products.filter((p) => p.lineId === effLineId);
    } else if (curAllowedLineIds !== null) {
      products = products.filter((p) => curAllowedLineIds.includes(p.lineId));
    }
    const isPM = window.isPMRole ? window.isPMRole(curUser) : (curUser?.role === 'product_manager' || curUser?.role === 'pm');
    if (isPM && Array.isArray(curUser.productIds) && curUser.productIds.length > 0) {
      products = products.filter((p) => curUser.productIds.includes(p.id));
    }

    products.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.lineName})`;
      pSelect.appendChild(opt);
    });

    if (prevVal && Array.from(pSelect.options).some((o) => o.value === prevVal)) {
      pSelect.value = prevVal;
    } else {
      pSelect.value = 'all';
    }
  };

  window.updatePharmSalesProductsForLine(window.selectedReportLineId || 'all');
}

// ============================================================================
// Section 7: Pharmacies Sales tab -- raw, per-pharmacy detail straight from
// imported distributor sheets (store.distributorSales). This is NOT an
// aggregation; the Achievements tab (achievements-report.js) builds the
// aggregated rep/product view on top of this same underlying data.
// ============================================================================
/**
 * Applies the Pharmacies Sales tab's filters (Product, Months/Year,
 * Distributor, role-scoped Line, and the Rep-only self
 * restriction) to store.distributorSales and returns the matching rows.
 * Shared by renderSalesReport() and exportSalesReport() so they can never
 * drift out of sync with each other.
 */
function getLmScopedAreaIds(lmUser, allUsers, allAreas) {
  if (!lmUser) return new Set();
  const lmId = lmUser.id;
  const dms = allUsers.filter((u) => u.managerId === lmId && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
  const dmIds = dms.map((d) => d.id);
  const teamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);

  const userLineIds = (lmUser.lineIds && lmUser.lineIds.length > 0) ? lmUser.lineIds : (lmUser.lineId ? [lmUser.lineId] : []);
  const lmsInLine = allUsers.filter((u) =>
    (window.normalizeRole ? window.normalizeRole(u.role) === 'line_manager' : (u.role === 'line_manager' || u.role === 'lm')) &&
    userLineIds.some((lid) => (u.lineIds && u.lineIds.includes(lid)) || u.lineId === lid)
  );
  const isSingleLMForLine = lmsInLine.length <= 1;

  const scopedAreaIds = new Set();
  allAreas.forEach((a) => {
    const areaMatchesLine = !a.lineId || userLineIds.length === 0 || userLineIds.includes(a.lineId);
    if (!areaMatchesLine) return;

    if (a.lmId === lmId || a.lineManagerId === lmId || (Array.isArray(lmUser.assignedAreas) && lmUser.assignedAreas.includes(a.id))) {
      scopedAreaIds.add(a.id);
      return;
    }
    if (a.repId && teamRepIds.includes(a.repId)) {
      scopedAreaIds.add(a.id);
      return;
    }
    if (a.dmId && dmIds.includes(a.dmId)) {
      scopedAreaIds.add(a.id);
      return;
    }
    const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(a, allUsers) : null;
    if (mgrId && (mgrId === lmId || dmIds.includes(mgrId))) {
      scopedAreaIds.add(a.id);
      return;
    }
    if (!a.repId && isSingleLMForLine) {
      scopedAreaIds.add(a.id);
    }
  });
  return scopedAreaIds;
}

function getFilteredPharmSalesRows() {
  const productSelect = document.getElementById('pharmSalesProductSelect');
  const yearSelect = document.getElementById('pharmSalesYearSelect');
  const distSelect = document.getElementById('pharmSalesDistributorSelect');
  const lineSelect = document.getElementById('reportLineFilter');
  const user = checkAuth();

  const selectedProduct = productSelect ? productSelect.value : 'all';
  const selectedYear = yearSelect ? yearSelect.value : '';
  const selectedDistributor = distSelect ? distSelect.value : 'all';
  const selectedLine = window.selectedReportLineId || (lineSelect ? lineSelect.value : 'all');
  const selectedMonths = typeof getSelectedPharmSalesMonths === 'function' ? getSelectedPharmSalesMonths() : [];
  const monthKeys = selectedYear ? selectedMonths.map((m) => `${selectedYear}-${m}`) : [];
  const allowedLineIds = getPharmSalesAllowedLineIds(user);

  let rows = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : []).slice();

  // 🔹 Strict Product Mapping Check: Unmapped products from distributor sheets are excluded from sales reports
  rows = rows.filter((r) => Boolean(r.productId));

  if (selectedMonths.length === 0) {
    return [];
  }

  if (monthKeys.length > 0) {
    rows = rows.filter((r) => {
      const mKey = r.month || (r.date ? r.date.slice(0, 7) : null);
      return mKey && monthKeys.includes(mKey);
    });
  }
  if (selectedProduct !== 'all') {
    const allProds = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
    const matchedProd = allProds.find((p) => p.id === selectedProduct);
    const prodName = matchedProd ? matchedProd.name.trim().toLowerCase() : null;
    rows = rows.filter((r) => {
      if (r.productId) return r.productId === selectedProduct;
      if (prodName && r.product) return r.product.trim().toLowerCase() === prodName;
      return false;
    });
  } else {
    const isPM = window.isPMRole ? window.isPMRole(user) : (user?.role === 'product_manager' || user?.role === 'pm');
    if (isPM && Array.isArray(user.productIds) && user.productIds.length > 0) {
      const allProds = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
      const allowedNames = allProds
        .filter((p) => user.productIds.includes(p.id))
        .map((p) => p.name.trim().toLowerCase());
      rows = rows.filter((r) => {
        if (r.productId) return user.productIds.includes(r.productId);
        if (r.product) return allowedNames.includes(r.product.trim().toLowerCase());
        return false;
      });
    }
  }
  if (selectedDistributor !== 'all') rows = rows.filter((r) => r.distributorId === selectedDistributor);
  const allProdsList = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
  const prodLineIdMap = new Map(allProdsList.map((p) => [p.id, p.lineId]));
  const prodNameLineIdMap = new Map(allProdsList.map((p) => [p.name.trim().toLowerCase(), p.lineId]));

  const getEffectiveRowLineId = (r) => {
    if (r.productId && prodLineIdMap.has(r.productId)) {
      return prodLineIdMap.get(r.productId);
    }
    if (r.product) {
      const pName = r.product.trim().toLowerCase();
      if (prodNameLineIdMap.has(pName)) return prodNameLineIdMap.get(pName);
    }
    if (r.lineId) return r.lineId;
    return null;
  };

  // 🔹 Strict Product-Line Filter: If a specific line is selected, ONLY medicines belonging to this line are allowed
  if (selectedLine !== 'all' && selectedLine !== 'none') {
    rows = rows.filter((r) => {
      const rLine = getEffectiveRowLineId(r);
      return rLine === selectedLine;
    });
  } else if (allowedLineIds !== null) {
    // 🔹 Strict Allowed-Lines Filter: Employees with restricted lines can ONLY see medicines in their assigned lines
    rows = rows.filter((r) => {
      const rLine = getEffectiveRowLineId(r);
      return rLine && allowedLineIds.includes(rLine);
    });
  }

  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  if (isRep) {
    const repAreas = (window.store && window.store.areas ? window.store.areas.getByRep(user.id) : []);
    const repAreaIds = new Set(repAreas.map((a) => a.id));
    rows = rows.filter((r) =>
      r.repId === user.id ||
      (r.areaId && repAreaIds.has(r.areaId))
    );
  } else if (role === 'district_manager') {
    const teamRepIds = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
    const myAreas = (window.store && window.store.areas ? window.store.areas.getAll() : []).filter(
      (a) => (a.repId && teamRepIds.includes(a.repId)) || a.dmId === user.id || a.districtManagerId === user.id
    );
    const myAreaIds = myAreas.map((a) => a.id);
    rows = rows.filter((r) =>
      r.dmId === user.id ||
      (r.repId && teamRepIds.includes(r.repId)) ||
      (r.areaId && myAreaIds.includes(r.areaId))
    );
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
    const dmIds = dms.map((d) => d.id);
    const teamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
    const lmAreaIds = getLmScopedAreaIds(user, allUsers, allAreas);
    rows = rows.filter((r) =>
      r.lmId === user.id ||
      (r.dmId && dmIds.includes(r.dmId)) ||
      (r.repId && teamRepIds.includes(r.repId)) ||
      (r.areaId && lmAreaIds.has(r.areaId))
    );
  } else if (role === 'business_unit') {
    const subs = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    const subIds = subs.map((s) => s.id);
    const directLMs = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
    const allowedBuUserIds = [user.id, ...directLMs, ...subIds];
    const buLines = typeof window.getUserLines === 'function' ? window.getUserLines(user.id).map(l => l.id) : [];
    const buAreaIds = new Set(allAreas.filter(a => (a.lineId && buLines.includes(a.lineId)) || (a.repId && allowedBuUserIds.includes(a.repId))).map(a => a.id));
    rows = rows.filter((r) =>
      (r.repId && allowedBuUserIds.includes(r.repId)) ||
      (r.dmId && allowedBuUserIds.includes(r.dmId)) ||
      (r.lmId && allowedBuUserIds.includes(r.lmId)) ||
      (r.areaId && buAreaIds.has(r.areaId))
    );
  }

  const repSelect = document.getElementById('pharmSalesRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';

  if (selectedRep && selectedRep !== 'all') {
    if (selectedRep.startsWith('vacant:')) {
      const vacantAreaId = selectedRep.split(':')[1];
      const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
      const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
      rows = rows.filter((r) => r.areaId === vacantAreaId || (areaNameLower && r.area && r.area.toLowerCase().trim() === areaNameLower));
    } else if (selectedRep === 'all_dms') {
      const dms = allUsers.filter((u) => u.role === 'district_manager' || u.role === 'dm').map((u) => u.id);
      rows = rows.filter((r) => (r.dmId && dms.includes(r.dmId)) || (r.repId && dms.some((dId) => allUsers.some((u) => u.id === r.repId && u.managerId === dId))));
    } else if (selectedRep === 'all_reps') {
      const reps = allUsers.filter((u) => u.role === 'medical_rep' || u.role === 'rep').map((u) => u.id);
      rows = rows.filter((r) => r.repId && reps.includes(r.repId));
    } else {
      const isLM = allUsers.some((u) => u.id === selectedRep && (u.role === 'line_manager' || u.role === 'lm'));
      const isDM = allUsers.some((u) => u.id === selectedRep && (u.role === 'district_manager' || u.role === 'dm'));
      if (isLM) {
        const targetLmUser = allUsers.find((u) => u.id === selectedRep);
        const dmsUnderLM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
        const lmAreaIds = getLmScopedAreaIds(targetLmUser, allUsers, allAreas);
        rows = rows.filter((r) =>
          r.lmId === selectedRep ||
          (r.dmId && dmsUnderLM.includes(r.dmId)) ||
          (r.repId && repsUnderLM.includes(r.repId)) ||
          (r.areaId && lmAreaIds.has(r.areaId))
        );
      } else if (isDM) {
        const repsUnderDM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
        rows = rows.filter((r) => r.dmId === selectedRep || (r.repId && repsUnderDM.includes(r.repId)));
      } else {
        const targetRepAreas = (window.store && window.store.areas ? window.store.areas.getByRep(selectedRep) : []);
        const targetRepAreaIds = new Set(targetRepAreas.map((a) => a.id));
        rows = rows.filter((r) =>
          r.repId === selectedRep ||
          (r.areaId && targetRepAreaIds.has(r.areaId)) ||
          r.dmId === selectedRep
        );
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    rows = rows.filter((r) => {
      if (r.lineId) return r.lineId === selectedLineId;
      if (r.areaId) {
        const a = (window.store && window.store.areas) ? window.store.areas.getById(r.areaId) : null;
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (r.repId) {
        const u = (window.store && window.store.users) ? window.store.users.getById(r.repId) : null;
        if (u) {
          const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
          if (uLines.includes(selectedLineId)) return true;
        }
      }
      return false;
    });
  }

  const areaSelect = document.getElementById('pharmSalesAreaSelect');
  const selectedArea = areaSelect ? areaSelect.value : 'all';
  if (selectedArea && selectedArea !== 'all') {
    const chosenArea = (window.store && window.store.areas) ? window.store.areas.getById(selectedArea) : null;
    const chosenName = chosenArea && chosenArea.name ? chosenArea.name.trim().toLowerCase() : null;
    rows = rows.filter((r) => {
      if (r.areaId === selectedArea) return true;
      if (chosenName) {
        if (r.areaId && window.store && window.store.areas) {
          const a = window.store.areas.getById(r.areaId);
          if (a && a.name && a.name.trim().toLowerCase() === chosenName) return true;
        }
        if (r.area && r.area.trim().toLowerCase() === chosenName) return true;
        if (r.areaRaw && r.areaRaw.trim().toLowerCase() === chosenName) return true;
      }
      return false;
    });
  }

  // 🔹 Sales Type filter (All / Private / Bulk)
  const salesTypeSelect = document.getElementById('pharmSalesTypeSelect');
  const activeSalesType = salesTypeSelect ? salesTypeSelect.value : 'all';
  if (activeSalesType === "private") {
    rows = rows.filter((r) => r.salesType !== "bulk");
  } else if (activeSalesType === "bulk") {
    rows = rows.filter((r) => r.salesType === "bulk");
  }

  // Rows of "All Bulk" pharmacies are zeroed in place (their sales live in the bulk rows) - hide them
  rows = rows.filter((r) => !r.zeroedByBulk);

  return rows;
}

function renderSalesReport() {
  if (window.store && window.store.distributorSales && typeof window.store.distributorSales.applyAreaMatching === "function") {
    try { window.store.distributorSales.applyAreaMatching(true, false); } catch (e) {}
  }
  const prompt = document.getElementById('salesPromptContainer');
  const results = document.getElementById('salesResultsContainer');
  if (prompt) prompt.style.display = 'none';
  if (results) results.style.display = 'block';

  const tbody = document.getElementById('salesReportTbody');
  if (!tbody) return;
  tbody.replaceChildren();

  const periodLabel = document.getElementById('salesFilterPeriodLabel');
  const lang = getCurrentLang();
  const yearSelect = document.getElementById('pharmSalesYearSelect');
  const yearVal = yearSelect ? yearSelect.value : '';
  const labelEl = document.getElementById('pharmSalesMonthDropdownLabel');
  const monthText = labelEl ? labelEl.textContent.trim() : '';

  if (periodLabel) {
    const periodText = monthText ? `${monthText} ${yearVal}`.trim() : (lang === 'ar' ? 'كل الفترات' : 'All periods');
    periodLabel.textContent = `${lang === 'ar' ? 'الفترة:' : 'Period:'} ${periodText}`;
  }

  const selectedMonths = typeof getSelectedPharmSalesMonths === 'function' ? getSelectedPharmSalesMonths() : [];
  if (selectedMonths.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          ${lang === 'ar' ? 'يرجى اختيار شهر واحد على الأقل.' : 'Please select at least one month.'}
        </td>
      </tr>
    `;
    const kpiRowsEl = document.getElementById('kpiTotalActual');
    const kpiQtyEl = document.getElementById('kpiTotalTarget');
    const kpiValueEl = document.getElementById('kpiAchievement');
    const kpiPharmEl = document.getElementById('kpiActiveReps');
    if (kpiRowsEl) kpiRowsEl.textContent = '0';
    if (kpiQtyEl) kpiQtyEl.textContent = '0';
    if (kpiValueEl) kpiValueEl.textContent = '0';
    if (kpiPharmEl) kpiPharmEl.textContent = '0';
    return;
  }

  const rows = getFilteredPharmSalesRows();

  let totalValue = 0;
  let totalQuantity = 0;
  const pharmacySet = new Set();

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          ${lang === 'ar' ? 'لا توجد بيانات مبيعات صيدليات لهذا الاختيار.' : 'No pharmacy sales found for this selection.'}
        </td>
      </tr>
    `;
  } else {
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
    const areas = (window.store && window.store.areas ? window.store.areas.getAll() : []);
    const distributors = (window.store && window.store.distributors ? window.store.distributors.getAll() : []);

    rows.sort((a, b) => (b.date || b.month || '').localeCompare(a.date || a.month || ''));

    rows.forEach((row) => {
      const value = parseFloat(row.value) || 0;
      const qty = parseFloat(row.quantity) || 0;
      totalValue += value;
      totalQuantity += qty;
      if (row.pharmacyName) pharmacySet.add(row.pharmacyName.trim().toLowerCase());

      const rep = row.repId ? allUsers.find((u) => u.id === row.repId) : null;
      const area = row.areaId ? areas.find((a) => a.id === row.areaId) : null;
      const dist = row.distributorId ? distributors.find((d) => d.id === row.distributorId) : null;
      const areaLabel = area ? area.name : (row.areaRaw || (lang === 'ar' ? 'غير مربوط' : 'Unmatched'));
      const repLabel = rep ? rep.name : (lang === 'ar' ? 'غير مربوط' : 'Unassigned');

      const pharmacyDisplay = row.pharmacyName
        ? (row.pharmacyCode
            ? `<div>${window.escapeHtml(row.pharmacyName)} <small class="text-muted" style="font-size:0.8em; font-family:monospace;">(#${window.escapeHtml(row.pharmacyCode)})</small></div>`
            : window.escapeHtml(row.pharmacyName))
        : (row.pharmacyCode ? `<small class="text-muted" style="font-family:monospace;">#${window.escapeHtml(row.pharmacyCode)}</small>` : '—');

      // Build Type badge
      let typeBadge = '';
      if (row.salesType === "bulk") {
        typeBadge = `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Bulk (${row.bulkWeight || 0}%)</span>`;
      } else {
        typeBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle">Private</span>`;
      }
      if (row.splitPercent) {
        typeBadge += ` <span class="badge bg-info-subtle text-info-emphasis border border-info-subtle">Split ${window.escapeHtml(String(row.splitPercent))}%</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space: nowrap;">${window.escapeHtml(row.date || row.month)}</td>
        <td>${pharmacyDisplay}</td>
        <td><span class="sales-product-badge">💊 ${window.escapeHtml(row.product || 'General Product')}</span></td>
        <td style="white-space: nowrap;">${window.escapeHtml(dist ? dist.name : (row.distributorId || '—'))}</td>
        <td style="white-space: nowrap;">${window.escapeHtml(areaLabel)}</td>
        <td style="white-space: nowrap;">${window.escapeHtml(repLabel)}</td>
        <td style="font-weight: 600;">${qty.toLocaleString()}</td>
        <td style="font-weight: 700; color: var(--primary);">${value.toLocaleString()}</td>
        <td>${typeBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const kpiRowsEl = document.getElementById('kpiTotalActual');
  const kpiQtyEl = document.getElementById('kpiTotalTarget');
  const kpiValueEl = document.getElementById('kpiAchievement');
  const kpiPharmEl = document.getElementById('kpiActiveReps');
  if (kpiRowsEl) kpiRowsEl.textContent = rows.length.toLocaleString();
  if (kpiQtyEl) kpiQtyEl.textContent = totalQuantity.toLocaleString();
  if (kpiValueEl) kpiValueEl.textContent = totalValue.toLocaleString();
  if (kpiPharmEl) kpiPharmEl.textContent = pharmacySet.size.toLocaleString();
}

function triggerExcelUpload() {
  const user = checkAuth();
  const lang = getCurrentLang();
  if (window.isAdmin && !window.isAdmin(user)) {
    showToast(lang === 'ar' ? 'عفواً، الأدمن فقط هو المصرح له برفع شيت المبيعات' : 'Permission Denied: Admin only.', 'error');
    return;
  }

  const distSelect = document.getElementById('uploadDistributorSelect');
  const distId = distSelect ? distSelect.value : '';
  if (!distId) {
    showToast(lang === 'ar' ? 'اختار الموزّع الأول.' : 'Select a distributor first.', 'warning');
    return;
  }

  const dist = window.store && window.store.distributors ? window.store.distributors.getById(distId) : null;
  const hasMapping = !!(dist && dist.columnMap && dist.columnMap.product && dist.columnMap.value);
  if (!hasMapping) {
    showToast(
      lang === 'ar'
        ? 'الموزّع ده لسه مفيهوش ربط أعمدة. اضبطه من صفحة الموزعين الأول.'
        : "This distributor's sheet columns aren't mapped yet. Configure it from the Distributors page first.",
      'error',
    );
    return;
  }

  const fileInput = document.getElementById('salesExcelFileInput');
  if (fileInput) fileInput.click();
}

function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const lang = getCurrentLang();

  const distSelect = document.getElementById('uploadDistributorSelect');
  const monthSelect = document.getElementById('uploadMonthSelect');
  const yearSelect = document.getElementById('uploadYearSelect');
  const distId = distSelect ? distSelect.value : '';
  const month = monthSelect ? monthSelect.value : '';
  const year = yearSelect ? yearSelect.value : '';
  const dist = window.store && window.store.distributors ? window.store.distributors.getById(distId) : null;

  if (!dist || !dist.columnMap || !dist.columnMap.product || !dist.columnMap.value || !month || !year) {
    showToast(lang === 'ar' ? 'محتاج تختار الموزّع والشهر والسنة الأول.' : 'Select a distributor, month, and year first.', 'warning');
    e.target.value = '';
    return;
  }

  if (typeof XLSX === 'undefined') {
    showToast(lang === 'ar' ? 'مكتبة قراءة الإكسيل غير محملة.' : 'Excel reader library failed to load.', 'error');
    e.target.value = '';
    return;
  }

  const monthKey = `${year}-${month}`;
  const existingBatch = window.store && window.store.importBatches
    ? window.store.importBatches.find(distId, monthKey, file.name)
    : null;
  let replacingPreviousBatch = false;

  if (existingBatch) {
    const uploadedDate = existingBatch.uploadedAt ? new Date(existingBatch.uploadedAt).toLocaleString() : '';
    const confirmMsg = lang === 'ar'
      ? `اتعملت رفعة قبل كده لـ "${dist.name}" لشهر ${monthKey} (${existingBatch.rowCount} صف${uploadedDate ? '، بتاريخ ' + uploadedDate : ''}). لو كملت، الرفعة القديمة هتتمسح ويتحل محلها الملف الجديد بالكامل (مش هتتضاف فوق بعض). عايز تكمل؟`
      : `A sheet was already uploaded for "${dist.name}" / ${monthKey} (${existingBatch.rowCount} rows${uploadedDate ? ', on ' + uploadedDate : ''}). Continuing will replace that previous upload entirely with this new file (not add on top of it). Continue?`;
    if (!confirm(confirmMsg)) {
      e.target.value = '';
      return;
    }
    replacingPreviousBatch = true;
  }

  showToast(lang === 'ar' ? `جاري معالجة الشيت: ${file.name}...` : `Processing file: ${file.name}...`, 'info');

  const reader = new FileReader();
  reader.onload = async function (ev) {
    let progress = null;
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
      const worksheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;
      if (!worksheet) {
        throw new Error("No readable worksheet found in the uploaded workbook.");
      }
      // Detect header row index to skip top banners and align object keys with mapped column names
      const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: "" });
      let headerRowIndex = 0;
      let maxColsCount = 0;
      const inspectLimit = Math.min(15, rawMatrix.length);
      for (let i = 0; i < inspectLimit; i++) {
        const row = rawMatrix[i];
        if (Array.isArray(row)) {
          const filledCount = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "").length;
          if (filledCount > maxColsCount) {
            maxColsCount = filledCount;
            headerRowIndex = i;
          }
        }
      }

      const rows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '', cellDates: true });

      const totalRows = rows.length;
      if (typeof window.openExcelImportProgress === 'function') {
        progress = window.openExcelImportProgress({
          title: lang === 'ar' ? `جاري استيراد مبيعات: ${dist.name}` : `Importing Sales: ${dist.name}`,
          fileName: file.name,
          totalRows: totalRows,
        });
      }

      const map = dist.columnMap;
      const batchId = 'batch_' + Date.now();
      const imported = [];
      let returnsCount = 0;
      let skippedInvalid = 0;

      // Non-blocking asynchronous chunking (1,000 rows per chunk)
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
        const chunkEnd = Math.min(i + CHUNK_SIZE, totalRows);
        for (let idx = i; idx < chunkEnd; idx++) {
          const row = rows[idx];
          const productRaw = map.product ? row[map.product] : '';
          const valueRaw = map.value ? row[map.value] : '';
          const quantityRaw = map.quantity ? row[map.quantity] : '';
          const dateRaw = map.date ? row[map.date] : '';
          const product = String(productRaw || '').trim();

          const numericValueRaw = parseSalesNumber(valueRaw);
          let numericQuantity = map.quantity && quantityRaw !== '' && quantityRaw !== null && quantityRaw !== undefined
            ? parseSalesNumber(quantityRaw)
            : null;

          let parsedDate = null;
          if (map.date && dateRaw !== '' && dateRaw !== null && dateRaw !== undefined) {
            parsedDate = parseDateStrict(dateRaw);
          }

          if (!product || isNaN(numericValueRaw)) {
            skippedInvalid++;
            continue;
          }

          let numericValue = numericValueRaw;

          // A row is definitely a return/credit note if either the quantity is negative OR the value is negative
          const hasNegativeQuantity = numericQuantity !== null && !isNaN(numericQuantity) && numericQuantity < 0;
          const hasNegativeValue = numericValue < 0;
          const isReturn = hasNegativeQuantity || hasNegativeValue;

          if (isReturn) {
            returnsCount++;

            // Enforce consistent negative signs on both dimensions for correct arithmetic deduction
            numericValue = -Math.abs(numericValue);
            if (numericQuantity !== null && !isNaN(numericQuantity)) {
              numericQuantity = -Math.abs(numericQuantity);
            }
          } else {
            // Ensure standard sales rows do not carry accidental negative artifacts
            numericValue = Math.abs(numericValue);
            if (numericQuantity !== null && !isNaN(numericQuantity)) {
              numericQuantity = Math.abs(numericQuantity);
            }
          }

          imported.push({
            id: `dsale_${Date.now()}_${idx}`,
            batchId,
            distributorId: distId,
            month: monthKey,
            date: parsedDate,
            product,
            value: numericValue,
            quantity: numericQuantity !== null && !isNaN(numericQuantity) ? numericQuantity : null,
            pharmacyCode: map.pharmacyCode ? String(row[map.pharmacyCode] || '').trim() : '',
            pharmacyName: map.pharmacy ? String(row[map.pharmacy] || '').trim() : '',
            areaRaw: map.area ? String(row[map.area] || '').trim() : '',
            repId: null,
            dmId: null,
            lmId: null,
            lineId: null,
            areaId: null,
          });
        }

        if (progress) {
          progress.update(chunkEnd, totalRows);
        }
        // Yield to browser event loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (progress) {
        progress.update(totalRows, totalRows, lang === 'ar' ? 'جاري حفظ وتخزين البيانات...' : 'Saving imported records...');
      }

      if (replacingPreviousBatch && existingBatch && window.store && window.store.distributorSales) {
        window.store.distributorSales.deleteByBatch(existingBatch.id);
        window.store.importBatches.delete(existingBatch.id);
      }

      if (window.store && window.store.distributorSales) {
        window.store.distributorSales.addBatch(imported);
      }
      if (window.store && window.store.importBatches) {
        window.store.importBatches.save({
          id: batchId,
          distributorId: distId,
          month: monthKey,
          rowCount: imported.length,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        });
      }

      const totalValue = imported.reduce((sum, r) => sum + r.value, 0);
      const panel = document.getElementById('salesImportResultsPanel');
      if (panel) {
        panel.style.display = 'block';
        const replacedNote = replacingPreviousBatch
          ? (lang === 'ar' ? ' (استبدلت رفعة سابقة لنفس الشهر/الموزّع)' : ' (replaced a previous upload for this month/distributor)')
          : '';
        panel.innerHTML = lang === 'ar'
          ? `✅ اتسجل <strong>${imported.length.toLocaleString()}</strong> صف من "${dist.name}" لشهر ${monthKey}${replacedNote} (شاملة ${returnsCount} صف مرتجعات بالسالب اتخصمت تلقائي). صافي القيمة: ${totalValue.toLocaleString()}. اتجاهل ${skippedInvalid} صف بيانات ناقصة (منتج أو قيمة مش واضحة).<br><span style="font-weight:600;">هام:</span> هتظهر الصفوف دي في جدول Pharmacies Sales فورًا، لكن لو فيها مناطق أو منتجات مش مربوطة لسه، مش هتتحسب في تبويب Achievements ولا في فلتر الـ Line لحد ما تربطها من صفحة الموزعين.`
          : `✅ Imported <strong>${imported.length.toLocaleString()}</strong> rows from "${dist.name}" for ${monthKey}${replacedNote} (including ${returnsCount} negative return rows, netted automatically). Net value: ${totalValue.toLocaleString()}. Skipped ${skippedInvalid} rows with unclear product/value.<br><span style="font-weight:600;">Note:</span> these rows show up in the Pharmacies Sales table right away, but any with an unmatched area or product won't count toward the Achievements tab or the Line filter until you link them on the Distributors page.`;
      }

      if (progress) {
        progress.finish(lang === 'ar' ? `تم استيراد ${imported.length.toLocaleString()} سجل بنجاح!` : `Successfully imported ${imported.length.toLocaleString()} rows!`);
      }

      showToast(
        lang === 'ar'
          ? `تم استيراد ${imported.length.toLocaleString()} صف بنجاح.`
          : `Successfully imported ${imported.length.toLocaleString()} rows.`,
        'success',
      );
    } catch (err) {
      if (progress) progress.close();
      console.error('Error parsing distributor sheet:', err);
      showToast(
        lang === 'ar'
          ? 'تعذرت قراءة الملف. تأكد إنه بنفس شكل الشيت اللي اتعمل عليه الربط.'
          : "Couldn't read this file. Make sure it matches the sheet layout the mapping was configured from.",
        'error',
      );
    }
    e.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

function exportSalesReport() {
  const rows = getFilteredPharmSalesRows();
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
  const areas = (window.store && window.store.areas ? window.store.areas.getAll() : []);
  const distributors = (window.store && window.store.distributors ? window.store.distributors.getAll() : []);

  const safeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
  let csv = 'Date,Pharmacy,Pharmacy Code,Product,Distributor,Area,Rep,Quantity,Value\n';
  rows.forEach((r) => {
    const rep = r.repId ? allUsers.find((u) => u.id === r.repId) : null;
    const area = r.areaId ? areas.find((a) => a.id === r.areaId) : null;
    const dist = r.distributorId ? distributors.find((d) => d.id === r.distributorId) : null;
    const areaLabel = area ? area.name : (r.areaRaw || '');
    const repLabel = rep ? rep.name : '';
    const qty = parseFloat(r.quantity) || 0;
    const value = parseFloat(r.value) || 0;
    csv += `${safeCsv(r.date || r.month)},${safeCsv(r.pharmacyName)},${safeCsv(r.pharmacyCode || '')},${safeCsv(r.product)},${safeCsv(dist ? dist.name : (r.distributorId || ''))},${safeCsv(areaLabel)},${safeCsv(repLabel)},${qty},${value}\n`;
  });

  const yearSelect = document.getElementById('pharmSalesYearSelect');
  const selectedMonths = typeof getSelectedPharmSalesMonths === 'function' ? getSelectedPharmSalesMonths() : [];
  const yearVal = yearSelect ? yearSelect.value : '';
  let periodSuffix = 'all_periods';
  if (selectedMonths.length > 0 && yearVal) {
    periodSuffix = `${yearVal}_${selectedMonths.join('_')}`;
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaCare_PharmaciesSales_${periodSuffix}.csv`;
  a.click();
}

// ============================================================================
// Section: Manage Targets (Admin Only)
// One manually-set target per rep + product + month. DM/LM/BU targets are
// never entered directly -- the Achievements tab (achievements-report.js)
// sums each team's rep-level targets to get theirs, defaulting to 0 for
// any rep+product+month with no target set.
// ============================================================================
let targetsModalEl = null;

function getAllProductsFlat() {
  const lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : []);
  const out = [];
  lines.forEach((line) => {
    (line.products || []).forEach((p) => {
      const displayName = p.dosage && !p.name.toLowerCase().includes(p.dosage.toLowerCase())
        ? `${p.name} ${p.dosage}`
        : p.name;
      out.push({ id: p.id, name: displayName, lineId: line.id, lineName: line.name, price: p.price !== undefined && p.price !== null && p.price !== '' ? parseFloat(p.price) : null });
    });
  });
  return out;
}

function updateTargetProductSelectForRep(selectedRepId) {
  const productSelect = document.getElementById('targetProductSelect');
  if (!productSelect) return;
  const prevVal = productSelect.value;
  productSelect.replaceChildren();

  const repLines = (selectedRepId && typeof window.getUserLines === 'function')
    ? window.getUserLines(selectedRepId)
    : [];
  const repLineIds = repLines.map((l) => l.id);

  let lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : []);
  if (repLineIds.length > 0) {
    lines = lines.filter((l) => repLineIds.includes(l.id));
  }

  lines.forEach((line) => {
    const products = line.products || [];
    if (!products.length) return;
    const group = document.createElement('optgroup');
    group.label = line.name;
    products.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.dosage ? ' ' + p.dosage : '');
      group.appendChild(opt);
    });
    productSelect.appendChild(group);
  });

  if (prevVal && Array.from(productSelect.options).some((o) => o.value === prevVal)) {
    productSelect.value = prevVal;
  }
  onTargetProductSelectChange();
}

function populateTargetFormSelects() {
  const repSelect = document.getElementById('targetRepSelect');
  const monthSelect = document.getElementById('targetMonthSelect');
  const yearSelect = document.getElementById('targetYearSelect');

  if (repSelect) {
    const reps = (window.store && window.store.users ? window.store.users.getReps() : []);
    renderSelectOptions(repSelect, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || 'Rep'})`);
    if (!repSelect.dataset.targetRepBound) {
      repSelect.dataset.targetRepBound = 'true';
      repSelect.addEventListener('change', () => {
        updateTargetProductSelectForRep(repSelect.value);
      });
    }
  }

  updateTargetProductSelectForRep(repSelect ? repSelect.value : null);

  if (monthSelect && !monthSelect.dataset.populated) {
    const now = new Date();
    MONTH_NAMES.forEach((m, idx) => {
      const val = String(idx + 1).padStart(2, '0');
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = m;
      if (idx === now.getMonth()) opt.selected = true;
      monthSelect.appendChild(opt);
    });
    monthSelect.dataset.populated = 'true';
  }

  if (yearSelect && !yearSelect.dataset.populated) {
    const currentYear = String(new Date().getFullYear());
    const yearsList = typeof window.getDynamicYears === 'function' ? window.getDynamicYears() : ['2025', '2026', '2027'];
    yearsList.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    });
    yearSelect.dataset.populated = 'true';
  }
}

function renderTargetsTable() {
  const tbody = document.getElementById('targetsTableBody');
  if (!tbody) return;
  const targets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
    .slice()
    .sort((a, b) => (b.month || '').localeCompare(a.month || ''));
  const allProducts = getAllProductsFlat();
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);

  tbody.replaceChildren();
  if (!targets.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 16px; color: var(--gray-500); font-style: italic;">No targets set yet.</td></tr>`;
    return;
  }

  targets.forEach((t) => {
    const rep = allUsers.find((u) => u.id === t.repId);
    const prod = allProducts.find((p) => p.id === t.productId);
    const units = parseFloat(t.targetUnits) || 0;
    const unitPrice = parseFloat(t.unitPrice) || 0;
    const storedValue = t.target != null ? parseFloat(t.target) || 0 : units * unitPrice;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${window.escapeHtml(rep ? rep.name : t.repId)}</td>
      <td>${window.escapeHtml(prod ? prod.name : t.productId)}</td>
      <td>${window.escapeHtml(t.month)}</td>
      <td>${units.toLocaleString()}</td>
      <td>${unitPrice.toLocaleString()}</td>
      <td style="font-weight:700;">${storedValue.toLocaleString()}</td>
      <td style="text-align:end; white-space:nowrap;">
        <button class="btn btn-sm btn-light text-primary" onclick="editTarget('${window.escapeHtml(t.id)}')" title="Edit">✏️</button>
        <button class="btn btn-sm btn-light text-danger" onclick="deleteTarget('${window.escapeHtml(t.id)}')" title="Delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openTargetsModal() {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast(getCurrentLang() === 'ar' ? 'غير مصرح: إدارة الأهداف للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    return;
  }
  targetsModalEl = document.getElementById('targetsModal');
  if (!targetsModalEl) return;
  populateTargetFormSelects();
  resetTargetForm();
  onTargetProductSelectChange();
  renderTargetsTable();
  targetsModalEl.style.display = 'flex';
  targetsModalEl.classList.add('active');
}

function closeTargetsModal() {
  if (targetsModalEl) {
    targetsModalEl.style.display = 'none';
    targetsModalEl.classList.remove('active');
  }
  const achResults = document.getElementById('achievementsResultsContainer');
  if (achResults && achResults.style.display !== 'none' && typeof renderAchievementsReport === 'function') {
    renderAchievementsReport();
  }
}

function resetTargetForm() {
  document.getElementById('targetEditId').value = '';
  document.getElementById('targetUnitsInput').value = '';
  document.getElementById('targetUnitPriceInput').value = '';
  document.getElementById('targetComputedValueDisplay').value = '0';
  const label = document.getElementById('saveTargetBtnLabel');
  if (label) label.textContent = 'Add Target';
  const cancelBtn = document.getElementById('cancelTargetEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const repSelect = document.getElementById('targetRepSelect');
  updateTargetProductSelectForRep(repSelect ? repSelect.value : null);
}

function onTargetProductSelectChange() {
  const productId = document.getElementById('targetProductSelect').value;
  const prod = getAllProductsFlat().find((p) => p.id === productId);
  const priceInput = document.getElementById('targetUnitPriceInput');
  // Auto-fills from the product's catalog price (set in Products page) as
  // a starting point -- this is a convenience default, not a lock: the
  // admin can still type a different price here for this specific
  // rep/month as an exception, same as before.
  if (prod && prod.price !== null && priceInput) {
    priceInput.value = prod.price;
  }
  updateComputedTargetValue();
}

function updateComputedTargetValue() {
  const units = parseFloat(document.getElementById('targetUnitsInput').value) || 0;
  const price = parseFloat(document.getElementById('targetUnitPriceInput').value) || 0;
  document.getElementById('targetComputedValueDisplay').value = units * price;
}

function editTarget(id) {
  const t = window.store && window.store.targets ? window.store.targets.getById(id) : null;
  if (!t) return;
  document.getElementById('targetEditId').value = t.id;
  document.getElementById('targetRepSelect').value = t.repId;
  updateTargetProductSelectForRep(t.repId);
  document.getElementById('targetProductSelect').value = t.productId;
  document.getElementById('targetMonthSelect').value = t.month.split('-')[1];
  document.getElementById('targetYearSelect').value = t.month.split('-')[0];
  document.getElementById('targetUnitsInput').value = t.targetUnits;
  document.getElementById('targetUnitPriceInput').value = t.unitPrice;
  document.getElementById('targetComputedValueDisplay').value = t.target != null ? t.target : (parseFloat(t.targetUnits) || 0) * (parseFloat(t.unitPrice) || 0);
  const label = document.getElementById('saveTargetBtnLabel');
  if (label) label.textContent = 'Update Target';
  const cancelBtn = document.getElementById('cancelTargetEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';
}

function saveTarget() {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast(getCurrentLang() === 'ar' ? 'غير مصرح: إدارة الأهداف للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    return;
  }
  const editId = document.getElementById('targetEditId').value;
  const repId = document.getElementById('targetRepSelect').value;
  const productId = document.getElementById('targetProductSelect').value;
  const month = document.getElementById('targetMonthSelect').value;
  const year = document.getElementById('targetYearSelect').value;
  const units = parseFloat(document.getElementById('targetUnitsInput').value);
  const unitPrice = parseFloat(document.getElementById('targetUnitPriceInput').value);
  // Normally units * unitPrice, but the admin can type directly into this
  // field to override the computed figure -- whatever it holds at save
  // time is what gets stored as the actual target value.
  const targetValue = parseFloat(document.getElementById('targetComputedValueDisplay').value);

  if (!repId || !productId || !month || !year || isNaN(units) || units < 0 || isNaN(unitPrice) || unitPrice < 0 || isNaN(targetValue) || targetValue < 0) {
    if (typeof showToast === 'function') showToast('Fill in Rep, Product, Month, Year, Target Units, Unit Price, and a valid Target Value (all non-negative).', 'warning');
    return;
  }

  const repLines = typeof window.getUserLines === 'function' ? window.getUserLines(repId) : [];
  if (repLines.length > 0) {
    const repLineIds = repLines.map((l) => l.id);
    const prod = getAllProductsFlat().find((p) => p.id === productId);
    if (prod && prod.lineId && !repLineIds.includes(prod.lineId)) {
      if (typeof showToast === 'function') {
        showToast(getCurrentLang() === 'ar' ? 'خطأ: الصنف المختار لا ينتمي لخط الإنتاج المخصص لهذا المندوب.' : 'Error: Selected product does not belong to this rep\'s assigned line.', 'error');
      }
      return;
    }
  }

  if (window.store && window.store.targets) {
    window.store.targets.save({
      id: editId || undefined,
      repId,
      productId,
      month: `${year}-${month}`,
      targetUnits: units,
      unitPrice: unitPrice,
      target: targetValue,
    });
  }

  resetTargetForm();
  renderTargetsTable();
  const achResults = document.getElementById('achievementsResultsContainer');
  if (achResults && achResults.style.display !== 'none' && typeof renderAchievementsReport === 'function') {
    renderAchievementsReport();
  }
  if (typeof showToast === 'function') showToast('Target saved.', 'success');
}

function deleteTarget(id) {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast(getCurrentLang() === 'ar' ? 'غير مصرح: إدارة الأهداف للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    return;
  }
  if (!confirm('Delete this target?')) return;
  if (window.store && window.store.targets) {
    window.store.targets.delete(id);
  }
  renderTargetsTable();
  const achResults = document.getElementById('achievementsResultsContainer');
  if (achResults && achResults.style.display !== 'none' && typeof renderAchievementsReport === 'function') {
    renderAchievementsReport();
  }
  if (typeof showToast === 'function') showToast('Target deleted.', 'info');
}