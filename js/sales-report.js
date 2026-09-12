/**
 * @file sales-report.js
 * @description Reports page - "Sales" tab: monthly sales vs target, the
 * product multi-select filter, the month multi-select filter, Excel
 * upload, and CSV export.
 * Depends on shared-report.js (must load after it).
 *
 * Changes in this revision:
 *  - Added a Month multi-select dropdown (Section 5.5), mirroring the
 *    existing Product multi-select dropdown (Section 5), so a user can
 *    pick several months within the selected Year instead of just one.
 *  - renderSalesReport() and exportSalesReport() now filter by an array
 *    of selected months (selectedMonths / targetPeriods) instead of a
 *    single targetPeriod string.
 *  - Requires the matching markup change in reports.html: the old
 *    <select id="salesMonthSelect"> is replaced with a multi-select
 *    dropdown container (id="monthMultiSelectContainer") built the same
 *    way as the existing #productMultiSelectContainer.
 */

// ============================================================================
// Section 5: Multi-Select Product Dropdown Logic
// ============================================================================
window.toggleProductDropdown = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('prodDropdownMenu');
  if (menu) menu.classList.toggle('show');
};

window.closeProductDropdown = function() {
  const menu = document.getElementById('prodDropdownMenu');
  if (menu) menu.classList.remove('show');
};

window.toggleSelectAllProducts = function(isChecked) {
  document.querySelectorAll('.prod-checkbox').forEach((cb) => {
    cb.checked = isChecked;
  });
  updateProductDropdownLabel();
};

window.onProductCheckboxChange = function() {
  const allCheckboxes = document.querySelectorAll('.prod-checkbox');
  const checkedBoxes = document.querySelectorAll('.prod-checkbox:checked');
  const selectAll = document.getElementById('selectAllProds');
  if (selectAll) {
    selectAll.checked = (allCheckboxes.length > 0 && allCheckboxes.length === checkedBoxes.length);
  }
  updateProductDropdownLabel();
};

function updateProductDropdownLabel() {
  const labelEl = document.getElementById('prodDropdownLabel');
  if (!labelEl) return;
  const lang = getCurrentLang();
  const allBoxes = document.querySelectorAll('.prod-checkbox');
  const checkedBoxes = Array.from(document.querySelectorAll('.prod-checkbox:checked'));
  if (checkedBoxes.length === 0) {
    labelEl.textContent = lang === 'ar' ? 'لم يتم تحديد أدوية' : 'None Selected';
  } else if (checkedBoxes.length === allBoxes.length) {
    labelEl.textContent = lang === 'ar' ? `جميع الأدوية (${allBoxes.length})` : `All Products (${allBoxes.length})`;
  } else if (checkedBoxes.length === 1) {
    labelEl.textContent = checkedBoxes[0].value;
  } else {
    labelEl.textContent = lang === 'ar'
      ? `تم اختيار (${checkedBoxes.length}) أدوية`
      : `${checkedBoxes.length} Products Selected`;
  }
}

function populateProductCheckboxes(lineId = 'all') {
  const checkboxList = document.getElementById('productCheckboxList');
  if (!checkboxList) return;
  const salesData = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
    ? window.DEMO_DATA.sales
    : REPORTS_DATA.sales;
  let availableProducts = [];
  if (!lineId || lineId === 'all') {
    availableProducts = Array.from(new Set(salesData.map((s) => s.product).filter(Boolean)));
    // Imported (distributor-sourced) products have no known lineId yet,
    // so they only surface here in the unfiltered "All Lines" view, not
    // when a specific line is picked below.
    const importedProducts = (window.store && window.store.distributorSales
      ? window.store.distributorSales.getAll()
      : []
    ).map((s) => s.product).filter(Boolean);
    importedProducts.forEach((p) => {
      if (!availableProducts.includes(p)) availableProducts.push(p);
    });
  } else {
    availableProducts = Array.from(
      new Set(salesData.filter((s) => s.lineId === lineId).map((s) => s.product).filter(Boolean))
    );
  }
  checkboxList.replaceChildren();
  const esc = window.escapeHtml || ((s) => s || '');
  availableProducts.forEach((prodName) => {
    const label = document.createElement('label');
    label.className = 'multi-select-item';
    const safeName = esc(prodName);
    label.innerHTML = `
      <input type="checkbox" class="prod-checkbox" value="${safeName}" checked onchange="onProductCheckboxChange()">
      <span>${safeName}</span>
    `;
    checkboxList.appendChild(label);
  });
  const selectAll = document.getElementById('selectAllProds');
  if (selectAll) selectAll.checked = true;
  updateProductDropdownLabel();
}

// ============================================================================
// Section 5.7: Distributor & Supply Type Filters
// The Supply Type (Commercial/Tender) is NOT a flag stored on each sale
// row -- it's read from the distributor record itself, since Commercial
// and Tender business from the same wholesaler are separate distributor
// entries (e.g. "Ibn Sina" vs "Tender Ibn Sina"), matching the real CRM.
// ============================================================================
function populateDistributorsFilter() {
  const select = document.getElementById('salesDistributorSelect');
  if (!select) return;
  const lang = getCurrentLang();
  const allLabel = lang === 'ar' ? 'جميع الموزعين' : 'All Distributors';
  const currentVal = select.value;
  const distributors = (window.store && window.store.distributors.getAll()) || [];
  select.innerHTML = `<option value="all">${allLabel}</option>`;
  distributors.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
  if (currentVal && distributors.some((d) => d.id === currentVal)) {
    select.value = currentVal;
  }
}

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
    ['2025', '2026', '2027'].forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    });
    yearSelect.dataset.populated = 'true';
  }
}


// (Same interaction pattern as the Product dropdown above. Months are a
// fixed, non-user-supplied list, so building labels via textContent isn't
// a security requirement here, but it's used anyway to stay consistent.)
// ============================================================================
window.toggleMonthDropdown = function(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('monthDropdownMenu');
  if (menu) menu.classList.toggle('show');
};

window.closeMonthDropdown = function() {
  const menu = document.getElementById('monthDropdownMenu');
  if (menu) menu.classList.remove('show');
};

window.toggleSelectAllMonths = function(isChecked) {
  document.querySelectorAll('.month-checkbox').forEach((cb) => {
    cb.checked = isChecked;
  });
  updateMonthDropdownLabel();
};

window.onMonthCheckboxChange = function() {
  const allCheckboxes = document.querySelectorAll('.month-checkbox');
  const checkedBoxes = document.querySelectorAll('.month-checkbox:checked');
  const selectAll = document.getElementById('selectAllMonths');
  if (selectAll) {
    selectAll.checked = (allCheckboxes.length > 0 && allCheckboxes.length === checkedBoxes.length);
  }
  updateMonthDropdownLabel();
};

function updateMonthDropdownLabel() {
  const labelEl = document.getElementById('monthDropdownLabel');
  if (!labelEl) return;
  const lang = getCurrentLang();
  const allBoxes = document.querySelectorAll('.month-checkbox');
  const checkedBoxes = Array.from(document.querySelectorAll('.month-checkbox:checked'));
  if (checkedBoxes.length === 0) {
    labelEl.textContent = lang === 'ar' ? 'لم يتم اختيار شهور' : 'No Months Selected';
  } else if (checkedBoxes.length === allBoxes.length) {
    labelEl.textContent = lang === 'ar' ? 'كل الشهور' : 'All Months';
  } else if (checkedBoxes.length === 1) {
    const idx = parseInt(checkedBoxes[0].value, 10) - 1;
    labelEl.textContent = lang === 'ar' ? MONTH_NAMES_AR[idx] : MONTH_NAMES[idx];
  } else {
    labelEl.textContent = lang === 'ar'
      ? `${checkedBoxes.length} شهور محددة`
      : `${checkedBoxes.length} Months Selected`;
  }
}

/**
 * Populates the month checkbox list (Jan-Dec). By default only the
 * current month is checked, matching the old single-select's default.
 * Pass a specific '01'-'12' string in defaultMonth to preselect a
 * different month instead (e.g. when restoring a saved filter).
 */
function populateMonthCheckboxes(defaultMonth = null) {
  const checkboxList = document.getElementById('monthCheckboxList');
  if (!checkboxList) return;
  const lang = getCurrentLang();
  const now = new Date();
  const defaultMonthVal = defaultMonth || String(now.getMonth() + 1).padStart(2, '0');
  checkboxList.replaceChildren();
  MONTH_NAMES.forEach((m, idx) => {
    const val = String(idx + 1).padStart(2, '0');
    const label = document.createElement('label');
    label.className = 'multi-select-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'month-checkbox';
    checkbox.value = val;
    checkbox.checked = (val === defaultMonthVal);
    checkbox.addEventListener('change', onMonthCheckboxChange);
    const span = document.createElement('span');
    span.textContent = lang === 'ar' ? MONTH_NAMES_AR[idx] : m;
    label.appendChild(checkbox);
    label.appendChild(span);
    checkboxList.appendChild(label);
  });
  const selectAll = document.getElementById('selectAllMonths');
  if (selectAll) selectAll.checked = false;
  updateMonthDropdownLabel();
}

/**
 * Builds a human-readable label for a set of selected months, e.g.
 * "September" (one), "All Months" (all), or "September, October" (some).
 */
function buildMonthsLabel(selectedMonths, allMonthsCount, lang) {
  if (selectedMonths.length === allMonthsCount) {
    return lang === 'ar' ? 'كل الشهور' : 'All Months';
  }
  if (selectedMonths.length === 1) {
    const idx = parseInt(selectedMonths[0], 10) - 1;
    return lang === 'ar' ? MONTH_NAMES_AR[idx] : MONTH_NAMES[idx];
  }
  return selectedMonths
    .map((m) => {
      const idx = parseInt(m, 10) - 1;
      return lang === 'ar' ? MONTH_NAMES_AR[idx] : MONTH_NAMES[idx];
    })
    .join(', ');
}

/**
 * Groups every rep-attributed distributorSales row (see distributors.html's
 * Unmatched Territories linking) by (repId, product, month), summing their
 * (already-signed, returns-netted) value. Each group becomes one
 * report-shaped row so it can merge into the same table as
 * REPORTS_DATA.sales -- with target left at 0 since distributor sheets
 * carry no target figure, and lineId left null since sheets only give a
 * product name, not which product Line it belongs to.
 */
function buildDistributorAggregatedSales() {
  const rows = (window.store && window.store.distributorSales
    ? window.store.distributorSales.getAll()
    : []
  ).filter((r) => r.repId);
  const groups = {};
  rows.forEach((r) => {
    const key = `${r.repId}||${r.product}||${r.month}`;
    if (!groups[key]) {
      groups[key] = {
        repId: r.repId,
        dmId: r.dmId,
        lmId: r.lmId,
        lineId: r.lineId || null,
        product: r.product,
        month: r.month,
        actual: 0,
        distributorIds: [],
      };
    }
    if (!groups[key].lineId && r.lineId) groups[key].lineId = r.lineId;
    groups[key].actual += r.value;
    if (!groups[key].distributorIds.includes(r.distributorId)) {
      groups[key].distributorIds.push(r.distributorId);
    }
  });
  return Object.values(groups);
}

// ============================================================================
// Section 7: Tab 1 - Monthly Sales & Target Filter Execution (No Currency Symbols)
// ============================================================================
function renderSalesReport() {
  closeProductDropdown();
  closeMonthDropdown();
  const tbody = document.getElementById('salesReportTbody');
  if (!tbody) return;
  tbody.replaceChildren();
  const yearSelect = document.getElementById('salesYearSelect');
  const lineSelect = document.getElementById('salesLineSelect');
  const dmSelect = document.getElementById('salesDmSelect');
  const repSelect = document.getElementById('salesRepSelect');
  const distributorSelect = document.getElementById('salesDistributorSelect');
  const tenderSelect = document.getElementById('salesTenderSelect');
  const periodLabel = document.getElementById('salesFilterPeriodLabel');
  const lang = getCurrentLang();
  const _n = new Date();
  const _defMonth = String(_n.getMonth() + 1).padStart(2, '0');
  const _defYear = String(_n.getFullYear());

  const checkedMonthBoxes = Array.from(document.querySelectorAll('.month-checkbox:checked'));
  const allMonthsCount = document.querySelectorAll('.month-checkbox').length;
  // If nothing is checked (edge case, e.g. user unchecked everything),
  // fall back to the current month instead of matching zero rows silently.
  const selectedMonths = checkedMonthBoxes.length > 0 ? checkedMonthBoxes.map((cb) => cb.value) : [_defMonth];
  const selectedYear = yearSelect ? yearSelect.value : _defYear;
  const targetPeriods = selectedMonths.map((m) => `${selectedYear}-${m}`);

  const selectedLine = lineSelect ? lineSelect.value : 'all';
  const selectedDm = dmSelect ? dmSelect.value : 'all';
  const selectedRep = repSelect ? repSelect.value : 'all';
  const checkedBoxes = Array.from(document.querySelectorAll('.prod-checkbox:checked'));
  const selectedProducts = checkedBoxes.map((cb) => cb.value);
  const user = checkAuth();
  const isRep = window.isRepRole ? window.isRepRole(user) : ((user?.role === 'medical_rep' || user?.role === 'rep'));

  const monthsLabel = buildMonthsLabel(selectedMonths, allMonthsCount, lang);

  const allProdsCount = document.querySelectorAll('.prod-checkbox').length;
  let prodLabel = '';
  if (selectedProducts.length === allProdsCount) {
    prodLabel = lang === 'ar' ? 'جميع الأدوية' : 'All Products';
  } else if (selectedProducts.length === 1) {
    prodLabel = selectedProducts[0];
  } else {
    prodLabel = lang === 'ar' ? `${selectedProducts.length} أدوية محددة` : `${selectedProducts.length} Products Selected`;
  }

  if (periodLabel) {
    periodLabel.textContent = `${lang === 'ar' ? 'الفترة:' : 'Period:'} ${monthsLabel} ${selectedYear} | ${prodLabel}`;
  }

  const baseSales = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
    ? window.DEMO_DATA.sales
    : REPORTS_DATA.sales;

  // Merge in imported (distributor-sourced) sales that have been matched
  // to a rep via an Area alias (see distributors.html's Unmatched
  // Territories). If a legacy row already exists for the same
  // rep+product+month, its actual is replaced with the real imported net
  // value (keeping that row's existing target/lineId/area); otherwise a
  // new row is appended with target 0, since distributor sheets carry no
  // target figure.
  const activeSales = baseSales.map((r) => ({ ...r }));
  buildDistributorAggregatedSales().forEach((g) => {
    const existingIdx = activeSales.findIndex(
      (r) => r.repId === g.repId && r.product === g.product && r.month === g.month,
    );
    if (existingIdx >= 0) {
      activeSales[existingIdx].actual = g.actual;
      activeSales[existingIdx].amount = g.actual;
      activeSales[existingIdx].distributorId = g.distributorIds[0];
      activeSales[existingIdx].isImported = true;
    } else {
      const rep = window.store && window.store.users ? window.store.users.getById(g.repId) : null;
      activeSales.push({
        id: `dagg_${g.repId}_${g.product}_${g.month}`,
        month: g.month,
        repName: rep ? rep.name : (lang === 'ar' ? 'مندوب غير معروف' : 'Unknown Rep'),
        area: rep && rep.area ? rep.area : '',
        product: g.product,
        target: 0,
        actual: g.actual,
        amount: g.actual,
        repId: g.repId,
        dmId: g.dmId,
        lmId: g.lmId,
        lineId: g.lineId || null,
        distributorId: g.distributorIds[0],
        isImported: true,
      });
    }
  });

  let filtered = activeSales.filter((row) => targetPeriods.includes(row.month));

  if (isRep) {
    filtered = filtered.filter((row) => row.repId === user.id);
  } else if (user && (user.role === 'district_manager' || user.role === 'dm')) {
    filtered = filtered.filter((row) => row.dmId === user.id);
    if (selectedLine && selectedLine !== 'all') {
      filtered = filtered.filter((row) => row.lineId === selectedLine);
    }
    if (selectedRep && selectedRep !== 'all') {
      filtered = filtered.filter((row) => row.repId === selectedRep);
    }
  } else if (user && (user.role === 'line_manager' || user.role === 'lm')) {
    const userLines = typeof window.getUserLines === 'function' ? window.getUserLines(user.id) : [];
    const myLineIds = userLines.map((l) => l.id);
    if (myLineIds.length > 0) {
      filtered = filtered.filter((row) => myLineIds.includes(row.lineId) || row.lmId === user.id);
    }
    if (selectedLine && selectedLine !== 'all') {
      filtered = filtered.filter((row) => row.lineId === selectedLine);
    }
    if (selectedDm && selectedDm !== 'all') {
      filtered = filtered.filter((row) => row.dmId === selectedDm);
    }
    if (selectedRep && selectedRep !== 'all') {
      filtered = filtered.filter((row) => row.repId === selectedRep);
    }
  } else {
    if (selectedLine && selectedLine !== 'all') {
      filtered = filtered.filter((row) => row.lineId === selectedLine);
    }
    if (selectedDm && selectedDm !== 'all') {
      filtered = filtered.filter((row) => row.dmId === selectedDm);
    }
    if (selectedRep && selectedRep !== 'all') {
      filtered = filtered.filter((row) => row.repId === selectedRep);
    }
  }

  const selectedDistributor = distributorSelect ? distributorSelect.value : 'all';
  const selectedSupplyType = tenderSelect ? tenderSelect.value : 'all';

  if (selectedDistributor && selectedDistributor !== 'all') {
    filtered = filtered.filter((row) => row.distributorId === selectedDistributor);
  }
  if (selectedSupplyType && selectedSupplyType !== 'all') {
    filtered = filtered.filter((row) => {
      // Rows with no distributorId at all (legacy/manually-entered sales
      // that predate this feature) have no determinable supply type, so
      // they're excluded from a Commercial-only or Tenders-only view
      // rather than being guessed into either bucket.
      if (!row.distributorId) return false;
      const type = window.store && window.store.distributors
        ? window.store.distributors.getType(row.distributorId)
        : 'commercial';
      return type === selectedSupplyType;
    });
  }

  filtered = filtered.filter((row) => selectedProducts.includes(row.product));

  let totalActual = 0;
  let totalTarget = 0;
  const activeProductsSet = new Set();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          ${lang === 'ar' ? 'لا توجد بيانات مبيعات مسجلة لهذا الاختيار.' : 'No sales records found for this selection.'}
        </td>
      </tr>
    `;
  } else {
    filtered.forEach((row) => {
      const actualVal = parseFloat(row.actual) || parseFloat(row.amount) || 0;
      const targetVal = parseFloat(row.target) || 0;
      totalActual += actualVal;
      totalTarget += targetVal;
      if (row.product) activeProductsSet.add(row.product);
      const hasTarget = targetVal > 0;
      const achievement = hasTarget ? ((actualVal / targetVal) * 100).toFixed(1) : null;
      const isAchieved = hasTarget && actualVal >= targetVal;
      const statusBadge = !hasTarget
        ? `<span class="sales-status-badge" style="background: var(--gray-100, #f1f1f1); color: var(--gray-500);">${lang === 'ar' ? 'بدون تارجت' : 'No Target'}</span>`
        : isAchieved
          ? `<span class="sales-status-badge achieved">${lang === 'ar' ? 'مكتمل' : 'Achieved'}</span>`
          : `<span class="sales-status-badge in-progress">${lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>`;
      const dist = row.distributorId && window.store && window.store.distributors
        ? window.store.distributors.getById(row.distributorId)
        : null;
      const distName = dist ? dist.name : (row.distributorName || (lang === 'ar' ? 'غير محدد' : 'Unspecified'));
      const distIsTender = dist ? window.store.distributors.getType(dist.id) === 'tender' : false;
      const distBadge = row.distributorId
        ? (distIsTender
            ? `<span class="sales-status-badge" style="background: var(--danger-light, #fde8e8); color: var(--danger, #c0392b);">${lang === 'ar' ? 'مناقصات' : 'Tender'}</span>`
            : `<span class="sales-status-badge" style="background: var(--primary-light); color: var(--primary);">${lang === 'ar' ? 'تجاري' : 'Commercial'}</span>`)
        : `<span class="sales-status-badge" style="background: var(--gray-100, #f1f1f1); color: var(--gray-500);">—</span>`;
      const esc = window.escapeHtml || ((s) => s || '');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space: nowrap;"><strong>${row.month}</strong></td>
        <td>
          <strong style="white-space: nowrap;">${row.repName}</strong>
          <div style="font-size: 0.78rem; color: var(--gray-500); white-space: nowrap;">${row.area}</div>
        </td>
        <td>
          <span class="sales-product-badge">
            💊 ${row.product || 'General Product'}
          </span>
        </td>
        <td style="white-space: nowrap;">${esc(distName)}</td>
        <td style="white-space: nowrap;">${distBadge}</td>
        <td style="font-weight: 600; white-space: nowrap;">${targetVal.toLocaleString()}</td>
        <td style="font-weight: 700; color: var(--primary); white-space: nowrap;">${actualVal.toLocaleString()}</td>
        <td style="white-space: nowrap;">
          <span style="font-weight: 800; color: ${hasTarget ? (isAchieved ? 'var(--success)' : 'var(--warning)') : 'var(--gray-500)'};">${hasTarget ? achievement + '%' : '—'}</span>
        </td>
        <td style="white-space: nowrap;">${statusBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const kpiActualEl = document.getElementById('kpiTotalActual');
  const kpiTargetEl = document.getElementById('kpiTotalTarget');
  const kpiAchEl = document.getElementById('kpiAchievement');
  const kpiRepsEl = document.getElementById('kpiActiveReps');
  if (kpiActualEl) kpiActualEl.textContent = `${totalActual.toLocaleString()}`;
  if (kpiTargetEl) kpiTargetEl.textContent = `${totalTarget.toLocaleString()}`;
  if (kpiRepsEl) {
    kpiRepsEl.textContent = selectedProducts.length === allProdsCount
      ? `${activeProductsSet.size} ${lang === 'ar' ? 'أدوية' : 'Products'}`
      : `${selectedProducts.length} ${lang === 'ar' ? 'أدوية' : 'Products'}`;
  }
  if (kpiAchEl) {
    const overallAch = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 0;
    kpiAchEl.textContent = `${overallAch}%`;
    kpiAchEl.style.color = overallAch >= 100 ? 'var(--success)' : 'var(--warning)';
  }
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

  showToast(lang === 'ar' ? `جاري معالجة الشيت: ${file.name}...` : `Processing file: ${file.name}...`, 'info');

  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Keyed by the sheet's own header text, which is exactly what
      // dist.columnMap's values point to -- no positional guessing.
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const map = dist.columnMap;
      const monthKey = `${year}-${month}`;
      const imported = [];
      let returnsCount = 0;
      let skippedInvalid = 0;

      rows.forEach((row, idx) => {
        const productRaw = map.product ? row[map.product] : '';
        const valueRaw = map.value ? row[map.value] : '';
        const quantityRaw = map.quantity ? row[map.quantity] : '';
        const product = String(productRaw || '').trim();
        // Sheets from these distributors use plain numbers or numbers
        // with thousands separators; strip anything that isn't a digit,
        // minus sign, or decimal point before parsing.
        const numericValue = parseFloat(String(valueRaw).replace(/[^0-9.-]/g, ''));
        const numericQuantity = map.quantity
          ? parseFloat(String(quantityRaw).replace(/[^0-9.-]/g, ''))
          : null;

        if (!product || isNaN(numericValue)) {
          skippedInvalid++;
          return;
        }
        // Negative values are returns/credit notes (both the Ibn Sina and
        // Overseas sample sheets mix these into the same 'value' column).
        // They're kept, not dropped, so they net out of the totals when
        // summed -- and they stay visibly negative rather than being
        // flipped to a positive "return amount".
        if (numericValue < 0) {
          returnsCount++;
        }

        imported.push({
          id: `dsale_${Date.now()}_${idx}`,
          distributorId: distId,
          month: monthKey,
          product,
          value: numericValue,
          quantity: numericQuantity !== null && !isNaN(numericQuantity) ? numericQuantity : null,
          pharmacyName: map.pharmacy ? String(row[map.pharmacy] || '').trim() : '',
          areaRaw: map.area ? String(row[map.area] || '').trim() : '',
          // Deliberately unassigned: no raw-area-text -> Area/rep alias
          // matching exists yet, so these don't get attributed to a rep,
          // DM, LM, or line automatically.
          repId: null,
          dmId: null,
          lmId: null,
          lineId: null,
          areaId: null,
        });
      });

      if (window.store && window.store.distributorSales) {
        window.store.distributorSales.addBatch(imported);
      }

      const totalValue = imported.reduce((sum, r) => sum + r.value, 0);
      const panel = document.getElementById('salesImportResultsPanel');
      if (panel) {
        panel.style.display = 'block';
        panel.innerHTML = lang === 'ar'
          ? `✅ اتسجل <strong>${imported.length}</strong> صف من "${dist.name}" لشهر ${monthKey} (شاملة ${returnsCount} صف مرتجعات بالسالب اتخصمت تلقائي). صافي القيمة: ${totalValue.toLocaleString()}. اتجاهل ${skippedInvalid} صف بيانات ناقصة (منتج أو قيمة مش واضحة).<br><span style="font-weight:600;">هام:</span> البيانات دي متسجلة على مستوى الصيدلية وغير مربوطة بمندوب لسه، فمش هتظهر في الجدول تحت لحد ما نبني خطوة ربط المنطقة بالمندوب.`
          : `✅ Imported <strong>${imported.length}</strong> rows from "${dist.name}" for ${monthKey} (including ${returnsCount} negative return rows, netted automatically). Net value: ${totalValue.toLocaleString()}. Skipped ${skippedInvalid} rows with unclear product/value.<br><span style="font-weight:600;">Note:</span> this data is pharmacy-level and not yet attributed to a rep, so it won't appear in the table below until the area-to-rep matching step is built.`;
      }

      showToast(
        lang === 'ar'
          ? `تم استيراد ${imported.length} صف بنجاح.`
          : `Successfully imported ${imported.length} rows.`,
        'success',
      );
    } catch (err) {
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
  syncReportsData();
  const yearSelect = document.getElementById('salesYearSelect');
  const selectedYear = yearSelect ? yearSelect.value : '2026';
  const checkedMonthBoxes = Array.from(document.querySelectorAll('.month-checkbox:checked'));
  const selectedMonths = checkedMonthBoxes.length > 0 ? checkedMonthBoxes.map((cb) => cb.value) : ['09'];
  const targetPeriods = selectedMonths.map((m) => `${selectedYear}-${m}`);
  const checkedBoxes = Array.from(document.querySelectorAll('.prod-checkbox:checked'));
  const selectedProducts = checkedBoxes.map((cb) => cb.value);
  const distributorSelect = document.getElementById('salesDistributorSelect');
  const tenderSelect = document.getElementById('salesTenderSelect');
  const selectedDistributor = distributorSelect ? distributorSelect.value : 'all';
  const selectedSupplyType = tenderSelect ? tenderSelect.value : 'all';
  const activeSales = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
    ? window.DEMO_DATA.sales
    : REPORTS_DATA.sales;
  let csv = 'Month,Rep Name,Area,Product,Distributor,Type,Target,Actual,Achievement\n';
  let filtered = activeSales.filter((r) => targetPeriods.includes(r.month) && selectedProducts.includes(r.product));
  if (selectedDistributor !== 'all') {
    filtered = filtered.filter((r) => r.distributorId === selectedDistributor);
  }
  if (selectedSupplyType !== 'all') {
    filtered = filtered.filter((r) => {
      if (!r.distributorId) return false;
      const type = window.store && window.store.distributors
        ? window.store.distributors.getType(r.distributorId)
        : 'commercial';
      return type === selectedSupplyType;
    });
  }
  filtered.forEach((s) => {
    const actualVal = parseFloat(s.actual) || parseFloat(s.amount) || 0;
    const targetVal = parseFloat(s.target) || 0;
    const ach = targetVal > 0 ? ((actualVal / targetVal) * 100).toFixed(1) : 0;
    const dist = s.distributorId && window.store && window.store.distributors
      ? window.store.distributors.getById(s.distributorId)
      : null;
    const distName = dist ? dist.name : (s.distributorName || '');
    const distType = s.distributorId
      ? (window.store && window.store.distributors ? window.store.distributors.getType(s.distributorId) : 'commercial')
      : '';
    csv += `"${s.month}","${s.repName}","${s.area}","${s.product || ''}","${distName}","${distType}",${targetVal},${actualVal},"${ach}%"\n`;
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaCare_Sales_${selectedYear}_${selectedMonths.join('-')}.csv`;
  a.click();
}
