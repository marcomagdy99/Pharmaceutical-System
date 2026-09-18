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

const ACH_MONTHS_AR = (typeof window !== 'undefined' && Array.isArray(window.MONTH_NAMES_AR) && window.MONTH_NAMES_AR.length === 12)
  ? window.MONTH_NAMES_AR
  : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

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
    labelEl.textContent = lang === 'ar' ? 'لم يتم اختيار شهور' : 'No Months Selected';
  } else if (checkedBoxes.length === allBoxes.length && allBoxes.length > 0) {
    labelEl.textContent = lang === 'ar' ? 'كل الشهور' : 'All Months';
  } else if (checkedBoxes.length <= 2) {
    const names = checkedBoxes.map((cb) => {
      const idx = parseInt(cb.value, 10) - 1;
      return lang === 'ar' ? ACH_MONTHS_AR[idx] : ACH_MONTHS[idx];
    });
    labelEl.textContent = names.join(lang === 'ar' ? '، ' : ', ');
  } else {
    labelEl.textContent = lang === 'ar'
      ? `${checkedBoxes.length} شهور محددة`
      : `${checkedBoxes.length} Months Selected`;
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
      span.textContent = lang === 'ar' ? ACH_MONTHS_AR[idx] : m;
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
      ['2025', '2026', '2027'].forEach((y) => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
      });
    }
    yearSelect.dataset.populated = 'true';
  }
}

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

  const repSelect = document.getElementById('achRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';

  if (selectedRep && selectedRep !== 'all') {
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

  return allowedRepIds;
}

/**
 * Builds the Rep -> Product breakdown for one month. Every
 * (repId, productId) combination that has EITHER a target OR any matched
 * sales gets a row -- so a rep with a target but zero sales still shows
 * up (0% achievement), and a rep with sales but no target set shows up
 * too (target columns at 0, so achievement is left as "--" rather than
 * a misleading percentage).
 */
function buildAchievementsData(monthKeys, scopeRepIds) {
  const keys = Array.isArray(monthKeys) ? monthKeys : [monthKeys];
  if (!keys.length) return [];

  const targets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
    .filter((t) => keys.includes(t.month) && (!scopeRepIds || scopeRepIds.includes(t.repId)));
  const salesRows = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : [])
    .filter((s) => keys.includes(s.month) && s.repId && s.productId && (!scopeRepIds || scopeRepIds.includes(s.repId)));

  const allProducts = getAllProductsFlat();
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);

  const cellMap = {};
  targets.forEach((t) => {
    const key = t.repId + '||' + t.productId;
    if (!cellMap[key]) cellMap[key] = { repId: t.repId, productId: t.productId, sUnit: 0, sValue: 0, tUnit: 0, tValue: 0 };
    cellMap[key].tUnit += parseFloat(t.targetUnits) || 0;
    cellMap[key].tValue += t.target != null
      ? parseFloat(t.target) || 0
      : (parseFloat(t.targetUnits) || 0) * (parseFloat(t.unitPrice) || 0);
  });
  salesRows.forEach((s) => {
    const key = s.repId + '||' + s.productId;
    if (!cellMap[key]) cellMap[key] = { repId: s.repId, productId: s.productId, sUnit: 0, sValue: 0, tUnit: 0, tValue: 0 };
    cellMap[key].sUnit += parseFloat(s.quantity) || 0;
    cellMap[key].sValue += parseFloat(s.value) || 0;
  });

  const repGroups = {};
  Object.values(cellMap).forEach((cell) => {
    if (!repGroups[cell.repId]) {
      const rep = allUsers.find((u) => u.id === cell.repId);
      repGroups[cell.repId] = {
        repId: cell.repId,
        repName: rep ? rep.name : cell.repId,
        areaName: rep && rep.area ? rep.area : '',
        totalSUnit: 0,
        totalSValue: 0,
        totalTUnit: 0,
        totalTValue: 0,
        products: [],
      };
    }
    const g = repGroups[cell.repId];
    const prod = allProducts.find((p) => p.id === cell.productId);
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

  const groups = Object.values(repGroups);
  groups.forEach((g) => {
    g.totalPct = g.totalTValue > 0 ? (g.totalSValue / g.totalTValue) * 100 : null;
    g.products.sort((a, b) => a.productName.localeCompare(b.productName));
  });
  groups.sort((a, b) => a.repName.localeCompare(b.repName));
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

  const kpiTarget = document.getElementById('kpiAchTotalTarget');
  const kpiActual = document.getElementById('kpiAchTotalActual');
  const kpiPct = document.getElementById('kpiAchOverallPct');
  const kpiReps = document.getElementById('kpiAchRepsCount');

  if (!selectedMonths.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          ${lang === 'ar' ? 'يرجى اختيار شهر واحد على الأقل.' : 'Please select at least one month.'}
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
          ${lang === 'ar' ? 'لا توجد تارجت أو مبيعات مربوطة بمندوب ومنتج للشهور المحددة.' : 'No targets or rep/product-matched sales for selected months.'}
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
      const totalPctLabel = g.totalPct === null ? '—' : g.totalPct.toFixed(1) + '%';
      const totalPctColor = g.totalPct !== null && g.totalPct >= 100 ? 'var(--success)' : 'var(--warning)';

      const totalRow = document.createElement('tr');
      totalRow.className = 'ach-total-row';
      totalRow.style.fontWeight = '800';
      totalRow.innerHTML = `
        <td>
          ${window.escapeHtml(g.repName)}
          ${g.areaName ? `<div style="font-size: 0.75rem; font-weight: 500; color: var(--gray-500);">${window.escapeHtml(g.areaName)}</div>` : ''}
        </td>
        <td>${lang === 'ar' ? 'الإجمالي' : 'TOTAL'}</td>
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

  if (kpiTarget) kpiTarget.textContent = grandTarget.toLocaleString();
  if (kpiActual) kpiActual.textContent = grandActual.toLocaleString();
  if (kpiPct) kpiPct.textContent = grandTarget > 0 ? ((grandActual / grandTarget) * 100).toFixed(1) + '%' : '—';
  if (kpiReps) kpiReps.textContent = groups.length;

  if (typeof window.renderSalesTargetTrendChart === 'function') {
    const isAr = lang === 'ar';
    const chartLabels = selectedMonths.map((mVal) => {
      const idx = parseInt(mVal, 10) - 1;
      return isAr ? ACH_MONTHS_AR[idx] : ACH_MONTHS[idx];
    });

    const chartTargets = selectedMonths.map((mVal) => {
      const mKey = `${year}-${mVal}`;
      const mTargets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
        .filter((t) => t.month === mKey && (!scopeRepIds || scopeRepIds.includes(t.repId)));
      return mTargets.reduce((sum, t) => {
        return sum + (t.target != null ? (parseFloat(t.target) || 0) : ((parseFloat(t.targetUnits) || 0) * (parseFloat(t.unitPrice) || 0)));
      }, 0);
    });

    const chartActuals = selectedMonths.map((mVal) => {
      const mKey = `${year}-${mVal}`;
      const mSales = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : [])
        .filter((s) => s.month === mKey && s.repId && s.productId && (!scopeRepIds || scopeRepIds.includes(s.repId)));
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
      showToast(lang === 'ar' ? 'لا توجد بيانات لتصديرها.' : 'No achievement data to export.', 'warning');
    }
    return;
  }

  const headers = [
    lang === 'ar' ? 'المندوب' : 'Representative',
    lang === 'ar' ? 'المنطقة' : 'Territory',
    lang === 'ar' ? 'المنتج' : 'Product',
    lang === 'ar' ? 'مستهدف الوحدات' : 'Target Units',
    lang === 'ar' ? 'الوحدات المحققة' : 'Actual Units',
    lang === 'ar' ? 'قيمة المستهدف' : 'Target Value (EGP)',
    lang === 'ar' ? 'القيمة المحققة' : 'Actual Value (EGP)',
    lang === 'ar' ? 'نسبة التحقيق' : 'Achievement %',
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
      escapeCsv(lang === 'ar' ? 'الإجمالي' : 'TOTAL'),
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
