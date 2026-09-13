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

function populateAchFilters() {
  const monthSelect = document.getElementById('achMonthSelect');
  const yearSelect = document.getElementById('achYearSelect');

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

/**
 * Which rep ids this viewer is allowed to see. Returns null for
 * Admin/Business Unit (no restriction -- everyone), or an array of rep
 * ids for a Rep (just themselves), District Manager (their direct
 * reports), or Line Manager (every rep under their DMs).
 */
function getAchievementsScopeRepIds(user) {
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));

  if (isRep) return [user.id];
  if (role === 'district_manager') {
    return allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
  }
  if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
    const dmIds = dms.map((d) => d.id);
    return allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
  }
  return null;
}

/**
 * Builds the Rep -> Product breakdown for one month. Every
 * (repId, productId) combination that has EITHER a target OR any matched
 * sales gets a row -- so a rep with a target but zero sales still shows
 * up (0% achievement), and a rep with sales but no target set shows up
 * too (target columns at 0, so achievement is left as "--" rather than
 * a misleading percentage).
 */
function buildAchievementsData(monthKey, scopeRepIds) {
  const targets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
    .filter((t) => t.month === monthKey && (!scopeRepIds || scopeRepIds.includes(t.repId)));
  const salesRows = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : [])
    .filter((s) => s.month === monthKey && s.repId && s.productId && (!scopeRepIds || scopeRepIds.includes(s.repId)));

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
  populateAchFilters();
  const monthSelect = document.getElementById('achMonthSelect');
  const yearSelect = document.getElementById('achYearSelect');
  const tbody = document.getElementById('achievementsReportTbody');
  if (!tbody) return;

  const now = new Date();
  const month = monthSelect ? monthSelect.value : String(now.getMonth() + 1).padStart(2, '0');
  const year = yearSelect ? yearSelect.value : String(now.getFullYear());
  const monthKey = `${year}-${month}`;

  const user = checkAuth();
  const scopeRepIds = getAchievementsScopeRepIds(user);
  const groups = buildAchievementsData(monthKey, scopeRepIds);
  const esc = window.escapeHtml || ((s) => s || '');
  const lang = getCurrentLang();

  tbody.replaceChildren();
  let grandTarget = 0;
  let grandActual = 0;

  if (!groups.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--gray-500); font-style: italic;">
          ${lang === 'ar' ? 'لا توجد تارجت أو مبيعات مربوطة بمندوب ومنتج لهذا الشهر.' : 'No targets or rep/product-matched sales for this month.'}
        </td>
      </tr>
    `;
  } else {
    groups.forEach((g) => {
      grandTarget += g.totalTValue;
      grandActual += g.totalSValue;
      const totalPctLabel = g.totalPct === null ? '—' : g.totalPct.toFixed(1) + '%';
      const totalPctColor = g.totalPct !== null && g.totalPct >= 100 ? 'var(--success)' : 'var(--warning)';

      const totalRow = document.createElement('tr');
      totalRow.style.fontWeight = '800';
      totalRow.style.background = 'var(--gray-50, #f8f9fa)';
      totalRow.innerHTML = `
        <td>
          ${esc(g.repName)}
          ${g.areaName ? `<div style="font-size: 0.75rem; font-weight: 500; color: var(--gray-500);">${esc(g.areaName)}</div>` : ''}
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
          <td style="padding-inline-start: 24px; color: var(--gray-600);">${esc(p.productName)}</td>
          <td>${p.tUnit.toLocaleString()}</td>
          <td>${p.sUnit.toLocaleString()}</td>
          <td>${p.tValue.toLocaleString()}</td>
          <td>${p.sValue.toLocaleString()}</td>
          <td style="color: ${pctColor};">${pctLabel}</td>
        `;
        tbody.appendChild(row);
      });
    });
  }

  const kpiTarget = document.getElementById('kpiAchTotalTarget');
  const kpiActual = document.getElementById('kpiAchTotalActual');
  const kpiPct = document.getElementById('kpiAchOverallPct');
  const kpiReps = document.getElementById('kpiAchRepsCount');
  if (kpiTarget) kpiTarget.textContent = grandTarget.toLocaleString();
  if (kpiActual) kpiActual.textContent = grandActual.toLocaleString();
  if (kpiPct) kpiPct.textContent = grandTarget > 0 ? ((grandActual / grandTarget) * 100).toFixed(1) + '%' : '—';
  if (kpiReps) kpiReps.textContent = groups.length;
}
