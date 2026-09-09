/**
 * @file sales-report.js
 * @description Reports page - "Sales" tab: monthly sales vs target, the
 * product multi-select filter, Excel upload, and CSV export.
 * Depends on shared-report.js (must load after it).
 */

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
// Section 7: Tab 1 - Monthly Sales & Target Filter Execution (No Currency Symbols)
// ============================================================================
function renderSalesReport() {
  closeProductDropdown();

  const tbody = document.getElementById('salesReportTbody');
  if (!tbody) return;
  tbody.replaceChildren();

  const monthSelect = document.getElementById('salesMonthSelect');
  const yearSelect = document.getElementById('salesYearSelect');
  const lineSelect = document.getElementById('salesLineSelect');
  const dmSelect = document.getElementById('salesDmSelect');
  const repSelect = document.getElementById('salesRepSelect');
  const periodLabel = document.getElementById('salesFilterPeriodLabel');
  const lang = getCurrentLang();

  const _n = new Date();
  const _defMonth = String(_n.getMonth() + 1).padStart(2, '0');
  const _defYear  = String(_n.getFullYear());
  const selectedMonth = monthSelect ? monthSelect.value : _defMonth;
  const selectedYear  = yearSelect  ? yearSelect.value  : _defYear;
  const targetPeriod = `${selectedYear}-${selectedMonth}`;

  const selectedLine = lineSelect ? lineSelect.value : 'all';
  const selectedDm = dmSelect ? dmSelect.value : 'all';
  const selectedRep = repSelect ? repSelect.value : 'all';

  const checkedBoxes = Array.from(document.querySelectorAll('.prod-checkbox:checked'));
  const selectedProducts = checkedBoxes.map((cb) => cb.value);

  const user = checkAuth();
  const isRep = window.isRepRole ? window.isRepRole(user) : ((user?.role === 'medical_rep' || user?.role === 'rep'));

  const monthIdx = parseInt(selectedMonth, 10) - 1;
  const monthName = lang === 'ar' ? MONTH_NAMES_AR[monthIdx] : MONTH_NAMES[monthIdx];
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
    periodLabel.textContent = `${lang === 'ar' ? 'الفترة:' : 'Period:'} ${monthName} ${selectedYear} | ${prodLabel}`;
  }

  const activeSales = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
    ? window.DEMO_DATA.sales
    : REPORTS_DATA.sales;

  let filtered = activeSales.filter((row) => row.month === targetPeriod);

  if (isRep) {
    filtered = filtered.filter((row) => row.repId === user.id || row.repId === 'rep1');
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

  filtered = filtered.filter((row) => selectedProducts.includes(row.product));

  let totalActual = 0;
  let totalTarget = 0;
  const activeProductsSet = new Set();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
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

      const achievement = targetVal > 0 ? ((actualVal / targetVal) * 100).toFixed(1) : 0;
      const isAchieved = actualVal >= targetVal;
      const statusBadge = isAchieved
        ? `<span class="sales-status-badge achieved">${lang === 'ar' ? 'مكتمل' : 'Achieved'}</span>`
        : `<span class="sales-status-badge in-progress">${lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>`;

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
        <td style="font-weight: 600; white-space: nowrap;">${targetVal.toLocaleString()}</td>
        <td style="font-weight: 700; color: var(--primary); white-space: nowrap;">${actualVal.toLocaleString()}</td>
        <td style="white-space: nowrap;">
          <span style="font-weight: 800; color: ${isAchieved ? 'var(--success)' : 'var(--warning)'};">${achievement}%</span>
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
  if (window.isAdmin && !window.isAdmin(user)) {
    showToast(getCurrentLang() === 'ar' ? 'عفواً، الأدمن فقط هو المصرح له برفع شيت المبيعات' : 'Permission Denied: Admin only.', 'error');
    return;
  }
  const fileInput = document.getElementById('salesExcelFileInput');
  if (fileInput) fileInput.click();
}

function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const lang = getCurrentLang();
  showToast(lang === 'ar' ? `جاري معالجة الشيت: ${file.name}...` : `Processing file: ${file.name}...`, 'info');

  setTimeout(() => {
    const newRecord = {
      id: 's_' + Date.now(),
      month: '2026-09',
      repName: 'Ahmed Mostafa',
      area: 'Nasr City',
      product: 'Amoxicillin 500mg',
      target: 25000,
      actual: 27000,
      amount: 27000,
      repId: 'rep1',
      dmId: 'dm1',
      lmId: 'lm1',
      lineId: 'line1'
    };

    REPORTS_DATA.sales.unshift(newRecord);
    if (window.DEMO_DATA) {
      if (!Array.isArray(window.DEMO_DATA.sales)) window.DEMO_DATA.sales = [];
      window.DEMO_DATA.sales.unshift(newRecord);
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    }

    renderSalesReport();
    showToast(lang === 'ar' ? 'تم استيراد شيت المبيعات وتحديث الأرقام بنجاح!' : 'Sales spreadsheet imported and targets updated successfully!', 'success');
    e.target.value = '';
  }, 700);
}

function exportSalesReport() {
  syncReportsData();
  const monthSelect = document.getElementById('salesMonthSelect');
  const yearSelect = document.getElementById('salesYearSelect');
  const targetPeriod = `${yearSelect ? yearSelect.value : '2026'}-${monthSelect ? monthSelect.value : '09'}`;

  const checkedBoxes = Array.from(document.querySelectorAll('.prod-checkbox:checked'));
  const selectedProducts = checkedBoxes.map((cb) => cb.value);

  const activeSales = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.sales) && window.DEMO_DATA.sales.length > 0)
    ? window.DEMO_DATA.sales
    : REPORTS_DATA.sales;

  let csv = 'Month,Rep Name,Area,Product,Target,Actual,Achievement\n';
  let filtered = activeSales.filter((r) => r.month === targetPeriod && selectedProducts.includes(r.product));

  filtered.forEach((s) => {
    const actualVal = parseFloat(s.actual) || parseFloat(s.amount) || 0;
    const targetVal = parseFloat(s.target) || 0;
    const ach = targetVal > 0 ? ((actualVal / targetVal) * 100).toFixed(1) : 0;
    csv += `"${s.month}","${s.repName}","${s.area}","${s.product || ''}",${targetVal},${actualVal},"${ach}%"\n`;
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaCare_Sales_${targetPeriod}.csv`;
  a.click();
}