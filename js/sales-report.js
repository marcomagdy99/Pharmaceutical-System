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
  const productSelect = document.getElementById('pharmSalesProductSelect');
  const monthContainer = document.getElementById('pharmSalesMonthCheckboxList');
  const yearSelect = document.getElementById('pharmSalesYearSelect');
  const distSelect = document.getElementById('pharmSalesDistributorSelect');
  const lineSelect = document.getElementById('pharmSalesLineSelect');
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
    ['2025', '2026', '2027'].forEach((y) => {
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

  const allowedLineIds = getPharmSalesAllowedLineIds(user);
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : []);
  const scopedLines = allowedLineIds === null ? allLines : allLines.filter((l) => allowedLineIds.includes(l.id));

  if (lineSelect) {
    if (allowedLineIds === null) {
      const allLabel = lang === 'ar' ? 'كل الخطوط' : 'All Lines';
      lineSelect.innerHTML = `<option value="all">${allLabel}</option>`;
      appendSelectOptions(lineSelect, allLines, (l) => l.id, (l) => l.name);
      lineSelect.disabled = false;
    } else if (scopedLines.length <= 1) {
      lineSelect.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = scopedLines[0] ? scopedLines[0].id : 'none';
      opt.textContent = scopedLines[0] ? scopedLines[0].name : (lang === 'ar' ? 'مفيش خط متعين' : 'No line assigned');
      lineSelect.appendChild(opt);
      lineSelect.disabled = true;
    } else {
      lineSelect.innerHTML = '';
      renderSelectOptions(lineSelect, scopedLines, (l) => l.id, (l) => l.name);
      lineSelect.disabled = false;
    }
  }

  if (productSelect) {
    const allLabel = lang === 'ar' ? 'جميع الأدوية' : 'All Products';
    productSelect.innerHTML = `<option value="all">${allLabel}</option>`;
    const scopedLineIds = scopedLines.map((l) => l.id);
    const products = getAllProductsFlat().filter((p) => allowedLineIds === null || scopedLineIds.includes(p.lineId));
    products.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.lineName})`;
      productSelect.appendChild(opt);
    });
  }
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
function getFilteredPharmSalesRows() {
  const productSelect = document.getElementById('pharmSalesProductSelect');
  const yearSelect = document.getElementById('pharmSalesYearSelect');
  const distSelect = document.getElementById('pharmSalesDistributorSelect');
  const lineSelect = document.getElementById('pharmSalesLineSelect');
  const user = checkAuth();

  const selectedProduct = productSelect ? productSelect.value : 'all';
  const selectedYear = yearSelect ? yearSelect.value : '';
  const selectedDistributor = distSelect ? distSelect.value : 'all';
  const selectedLine = lineSelect ? lineSelect.value : 'all';
  const selectedMonths = typeof getSelectedPharmSalesMonths === 'function' ? getSelectedPharmSalesMonths() : [];
  const monthKeys = selectedYear ? selectedMonths.map((m) => `${selectedYear}-${m}`) : [];
  const allowedLineIds = getPharmSalesAllowedLineIds(user);

  let rows = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : []).slice();

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
  }
  if (selectedDistributor !== 'all') rows = rows.filter((r) => r.distributorId === selectedDistributor);
  if (selectedLine !== 'all' && selectedLine !== 'none') {
    rows = rows.filter((r) => r.lineId === selectedLine);
  } else if (allowedLineIds !== null) {
    rows = rows.filter((r) => r.lineId && allowedLineIds.includes(r.lineId));
  }

  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);

  if (isRep) {
    rows = rows.filter((r) => r.repId === user.id);
  } else if (role === 'district_manager') {
    const teamRepIds = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
    rows = rows.filter((r) => r.dmId === user.id || (r.repId && teamRepIds.includes(r.repId)));
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
    const dmIds = dms.map((d) => d.id);
    const teamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
    rows = rows.filter((r) => r.lmId === user.id || (r.dmId && dmIds.includes(r.dmId)) || (r.repId && teamRepIds.includes(r.repId)));
  }

  return rows;
}

function renderSalesReport() {
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
        <td colspan="8" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
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
        <td colspan="8" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
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

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space: nowrap;">${window.escapeHtml(row.date || row.month)}</td>
        <td>${window.escapeHtml(row.pharmacyName || '—')}</td>
        <td><span class="sales-product-badge">💊 ${window.escapeHtml(row.product || 'General Product')}</span></td>
        <td style="white-space: nowrap;">${window.escapeHtml(dist ? dist.name : (row.distributorId || '—'))}</td>
        <td style="white-space: nowrap;">${window.escapeHtml(areaLabel)}</td>
        <td style="white-space: nowrap;">${window.escapeHtml(repLabel)}</td>
        <td style="font-weight: 600;">${qty.toLocaleString()}</td>
        <td style="font-weight: 700; color: var(--primary);">${value.toLocaleString()}</td>
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
    ? window.store.importBatches.find(distId, monthKey)
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
  reader.onload = function (ev) {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Keyed by the sheet's own header text, which is exactly what
      // dist.columnMap's values point to -- no positional guessing.
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const map = dist.columnMap;
      const batchId = 'batch_' + Date.now();
      const imported = [];
      let returnsCount = 0;
      let skippedInvalid = 0;

      rows.forEach((row, idx) => {
        const productRaw = map.product ? row[map.product] : '';
        const valueRaw = map.value ? row[map.value] : '';
        const quantityRaw = map.quantity ? row[map.quantity] : '';
        const dateRaw = map.date ? row[map.date] : '';
        const product = String(productRaw || '').trim();
        // Sheets from these distributors use plain numbers or numbers
        // with thousands separators; strip anything that isn't a digit,
        // minus sign, or decimal point before parsing.
        const numericValueRaw = parseFloat(String(valueRaw).replace(/[^0-9.-]/g, ''));
        let numericQuantity = map.quantity && quantityRaw !== '' && quantityRaw !== null && quantityRaw !== undefined
          ? parseFloat(String(quantityRaw).replace(/[^0-9.-]/g, ''))
          : null;
        // Best-effort date parsing: SheetJS may hand back a JS Date object
        // (for real Excel date cells), an Excel serial number, or plain
        // text (for CSV). Unparseable values are left null rather than
        // guessed -- the row still gets the required Month/Year picked at
        // upload time, it just won't be narrowable by exact date.
        let parsedDate = null;
        if (map.date && dateRaw !== '' && dateRaw !== null && dateRaw !== undefined) {
          if (dateRaw instanceof Date && !isNaN(dateRaw.getTime())) {
            parsedDate = dateRaw.toISOString().slice(0, 10);
          } else if (typeof dateRaw === 'number') {
            // Excel serial date (days since 1899-12-30)
            const d = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
            if (!isNaN(d.getTime())) parsedDate = d.toISOString().slice(0, 10);
          } else {
            const d = new Date(String(dateRaw).trim());
            if (!isNaN(d.getTime())) parsedDate = d.toISOString().slice(0, 10);
          }
        }

        if (!product || isNaN(numericValueRaw)) {
          skippedInvalid++;
          return;
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
          ? `✅ اتسجل <strong>${imported.length}</strong> صف من "${dist.name}" لشهر ${monthKey}${replacedNote} (شاملة ${returnsCount} صف مرتجعات بالسالب اتخصمت تلقائي). صافي القيمة: ${totalValue.toLocaleString()}. اتجاهل ${skippedInvalid} صف بيانات ناقصة (منتج أو قيمة مش واضحة).<br><span style="font-weight:600;">هام:</span> هتظهر الصفوف دي في جدول Pharmacies Sales فورًا، لكن لو فيها مناطق أو منتجات مش مربوطة لسه، مش هتتحسب في تبويب Achievements ولا في فلتر الـ Line لحد ما تربطها من صفحة الموزعين.`
          : `✅ Imported <strong>${imported.length}</strong> rows from "${dist.name}" for ${monthKey}${replacedNote} (including ${returnsCount} negative return rows, netted automatically). Net value: ${totalValue.toLocaleString()}. Skipped ${skippedInvalid} rows with unclear product/value.<br><span style="font-weight:600;">Note:</span> these rows show up in the Pharmacies Sales table right away, but any with an unmatched area or product won't count toward the Achievements tab or the Line filter until you link them on the Distributors page.`;
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
  const rows = getFilteredPharmSalesRows();
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
  const areas = (window.store && window.store.areas ? window.store.areas.getAll() : []);
  const distributors = (window.store && window.store.distributors ? window.store.distributors.getAll() : []);

  let csv = 'Date,Pharmacy,Product,Distributor,Area,Rep,Quantity,Value\n';
  rows.forEach((r) => {
    const rep = r.repId ? allUsers.find((u) => u.id === r.repId) : null;
    const area = r.areaId ? areas.find((a) => a.id === r.areaId) : null;
    const dist = r.distributorId ? distributors.find((d) => d.id === r.distributorId) : null;
    const areaLabel = area ? area.name : (r.areaRaw || '');
    const repLabel = rep ? rep.name : '';
    const qty = parseFloat(r.quantity) || 0;
    const value = parseFloat(r.value) || 0;
    csv += `"${r.date || r.month}","${r.pharmacyName || ''}","${r.product || ''}","${dist ? dist.name : (r.distributorId || '')}","${areaLabel}","${repLabel}",${qty},${value}\n`;
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

function populateTargetFormSelects() {
  const repSelect = document.getElementById('targetRepSelect');
  const productSelect = document.getElementById('targetProductSelect');
  const monthSelect = document.getElementById('targetMonthSelect');
  const yearSelect = document.getElementById('targetYearSelect');

  if (repSelect) {
    const reps = (window.store && window.store.users ? window.store.users.getReps() : []);
    renderSelectOptions(repSelect, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || 'Rep'})`);
  }

  if (productSelect) {
    productSelect.replaceChildren();
    const lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : []);
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
  }

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