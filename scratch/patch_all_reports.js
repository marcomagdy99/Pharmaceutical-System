const fs = require('fs');

console.log('Starting patch for all report scripts...');

// ============================================================================
// 1. js/shared-report.js
// ============================================================================
{
  const filePath = 'js/shared-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace auto-rendering on line filter change with no-op
  const targetBlock = `  const activeBtn = document.querySelector('.report-tab-btn.active');
  const activeTab = activeBtn ? activeBtn.dataset.tab : 'sales';

  if (activeTab === 'sales') {
    const salesRes = document.getElementById('salesResultsContainer');
    if (salesRes && salesRes.style.display !== 'none' && typeof window.renderSalesReport === 'function') {
      window.renderSalesReport();
    }
  } else if (activeTab === 'achievements') {
    const achRes = document.getElementById('achResultsContainer');
    if (achRes && achRes.style.display !== 'none' && typeof window.renderAchievementsReport === 'function') {
      window.renderAchievementsReport();
    }
  } else if (activeTab === 'timeline') {
    if (typeof window.renderTimelineReport === 'function') {
      window.renderTimelineReport();
    }
  } else if (activeTab === 'coverage') {
    if (typeof window.renderCoverageReport === 'function') {
      window.renderCoverageReport();
    }
  } else if (activeTab === 'doctors') {
    if (typeof window.renderDoctorsReport === 'function') {
      window.renderDoctorsReport();
    }
  } else if (activeTab === 'hospitals') {
    if (typeof window.renderHospitalsReport === 'function') {
      window.renderHospitalsReport();
    }
  } else if (activeTab === 'pharmacies') {
    if (typeof window.renderPharmaciesReport === 'function') {
      window.renderPharmaciesReport();
    }
  } else if (activeTab === 'missing-days') {
    if (typeof window.renderMissingDaysReport === 'function') {
      window.renderMissingDaysReport();
    }
  } else if (activeTab === 'gps-tracing') {
    if (typeof window.renderGpsTracingReport === 'function') {
      window.renderGpsTracingReport();
    }
  }
};`;

  const replacementBlock = `  // Line filter cascades dependent selects (reps, areas, products).
  // Report data is rendered strictly when the user clicks the Show button.
};`;

  if (content.includes(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('js/shared-report.js patched successfully.');
  } else {
    console.warn('Could not find exact block in js/shared-report.js');
  }
}

// ============================================================================
// 2. js/sales-report.js
// ============================================================================
{
  const filePath = 'js/sales-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove renderSalesReport calls from month checkboxes
  content = content.replace(
    /updatePharmSalesMonthDropdownLabel\(\);\s+const salesRes = document\.getElementById\('salesResultsContainer'\);\s+if \(salesRes && salesRes\.style\.display !== 'none' && typeof renderSalesReport === 'function'\) \{\s+renderSalesReport\(\);\s+\}/g,
    'updatePharmSalesMonthDropdownLabel();'
  );

  // Remove triggerPharmSalesAutoRefresh
  const oldAutoRefresh = `  function triggerPharmSalesAutoRefresh() {
    const salesRes = document.getElementById('salesResultsContainer');
    if (salesRes && salesRes.style.display !== 'none' && typeof renderSalesReport === 'function') {
      renderSalesReport();
    }
  }

  const pharmRepSelectEl = document.getElementById('pharmSalesRepSelect');
  if (pharmRepSelectEl && !pharmRepSelectEl.dataset.areaListenerBound) {
    pharmRepSelectEl.dataset.areaListenerBound = 'true';
    pharmRepSelectEl.addEventListener('change', () => {
      window.populatePharmSalesAreas(user);
      triggerPharmSalesAutoRefresh();
    });
  }

  ['pharmSalesAreaSelect', 'pharmSalesProductSelect', 'pharmSalesDistributorSelect', 'pharmSalesYearSelect', 'pharmSalesTypeSelect'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.autoRefreshBound) {
      el.dataset.autoRefreshBound = 'true';
      el.addEventListener('change', triggerPharmSalesAutoRefresh);
    }
  });`;

  const newAutoRefresh = `  const pharmRepSelectEl = document.getElementById('pharmSalesRepSelect');
  if (pharmRepSelectEl && !pharmRepSelectEl.dataset.areaListenerBound) {
    pharmRepSelectEl.dataset.areaListenerBound = 'true';
    pharmRepSelectEl.addEventListener('change', () => {
      window.populatePharmSalesAreas(user);
    });
  }`;

  if (content.includes(oldAutoRefresh)) {
    content = content.replace(oldAutoRefresh, newAutoRefresh);
  }

  // Ensure fallback in getAllProductsFlat
  content = content.replace(
    /const lines = \(window\.store && window\.store\.productLines \? window\.store\.productLines\.getAll\(\) : \[\]\);/g,
    'const lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);'
  );

  // Fix rep filtering in getFilteredPharmSalesRows
  const oldRepFilter = `      } else {
        const targetRepAreas = (window.store && window.store.areas ? window.store.areas.getByRep(selectedRep) : []);
        const targetRepAreaIds = new Set(targetRepAreas.map((a) => a.id));
        rows = rows.filter((r) =>
          r.repId === selectedRep ||
          (r.areaId && targetRepAreaIds.has(r.areaId)) ||
          r.dmId === selectedRep
        );
      }`;

  const newRepFilter = `      } else {
        const targetRepAreas = allAreas.filter((a) => a.repId === selectedRep);
        const targetRepAreaIds = new Set(targetRepAreas.map((a) => a.id));
        const targetAreaNames = targetRepAreas.map((a) => (a.name || '').trim().toLowerCase()).filter(Boolean);
        rows = rows.filter((r) =>
          r.repId === selectedRep ||
          (r.areaId && targetRepAreaIds.has(r.areaId)) ||
          (r.area && targetAreaNames.includes(r.area.trim().toLowerCase())) ||
          (r.areaRaw && targetAreaNames.includes(r.areaRaw.trim().toLowerCase())) ||
          r.dmId === selectedRep
        );
      }`;

  if (content.includes(oldRepFilter)) {
    content = content.replace(oldRepFilter, newRepFilter);
  }

  // Overhaul Targets Modal Functions in sales-report.js
  const targetModalSection = `function updateTargetProductSelectForArea(selectedAreaId) {
  const productSelect = document.getElementById('targetProductSelect');
  if (!productSelect) return;
  const prevVal = productSelect.value;
  productSelect.replaceChildren();

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const area = allAreas.find((a) => a.id === selectedAreaId);

  let lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : []);
  if (area && area.lineId) {
    lines = lines.filter((l) => l.id === area.lineId);
  } else if (area && area.repId) {
    const repLines = typeof window.getUserLines === 'function' ? window.getUserLines(area.repId) : [];
    const repLineIds = repLines.map((l) => l.id);
    if (repLineIds.length > 0) {
      lines = lines.filter((l) => repLineIds.includes(l.id));
    }
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

function updateTargetProductSelectForRep(selectedRepId) {
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const area = allAreas.find((a) => a.repId === selectedRepId);
  updateTargetProductSelectForArea(area ? area.id : null);
}

function populateTargetFormSelects() {
  const areaSelect = document.getElementById('targetAreaSelect') || document.getElementById('targetRepSelect');
  const monthSelect = document.getElementById('targetMonthSelect');
  const yearSelect = document.getElementById('targetYearSelect');

  if (areaSelect) {
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : []);

    const prevAreaVal = areaSelect.value;
    areaSelect.replaceChildren();

    allAreas.forEach((a) => {
      const rep = allUsers.find((u) => u.id === a.repId);
      const line = allLines.find((l) => l.id === a.lineId);
      const repLabel = rep ? \`Rep: \${rep.name}\` : \`[Vacant]\`;
      const lineLabel = line ? \` — \${line.name}\` : '';
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = \`\${a.name}\${a.code ? ' (' + a.code + ')' : ''}\${lineLabel} (\${repLabel})\`;
      areaSelect.appendChild(opt);
    });

    if (prevAreaVal && Array.from(areaSelect.options).some((o) => o.value === prevAreaVal)) {
      areaSelect.value = prevAreaVal;
    }

    if (!areaSelect.dataset.targetAreaBound) {
      areaSelect.dataset.targetAreaBound = 'true';
      areaSelect.addEventListener('change', () => {
        updateTargetProductSelectForArea(areaSelect.value);
      });
    }
  }

  updateTargetProductSelectForArea(areaSelect ? areaSelect.value : null);`;

  const newTargetModalSection = `window.populateTargetLineFilter = function () {
  const lineSelect = document.getElementById('targetLineFilterSelect');
  if (!lineSelect) return;
  const prev = lineSelect.value;
  lineSelect.replaceChildren();

  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All Product Lines';
  lineSelect.appendChild(optAll);

  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);
  allLines.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = l.name;
    lineSelect.appendChild(opt);
  });

  if (prev && Array.from(lineSelect.options).some((o) => o.value === prev)) {
    lineSelect.value = prev;
  } else {
    lineSelect.value = 'all';
  }
};

window.onTargetLineFilterChange = function () {
  const lineSelect = document.getElementById('targetLineFilterSelect');
  const lineId = lineSelect ? lineSelect.value : 'all';
  updateTargetProductSelect(lineId);
  populateTargetAreaSelect(lineId);
  renderTargetsTable(lineId);
};

function updateTargetProductSelect(filterLineId = 'all') {
  const productSelect = document.getElementById('targetProductSelect');
  if (!productSelect) return;
  const prevVal = productSelect.value;
  productSelect.replaceChildren();

  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);
  let lines = allLines;
  if (filterLineId && filterLineId !== 'all') {
    lines = allLines.filter((l) => l.id === filterLineId);
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

function updateTargetProductSelectForArea(selectedAreaId) {
  const lineSelect = document.getElementById('targetLineFilterSelect');
  const filterLineId = lineSelect ? lineSelect.value : 'all';
  updateTargetProductSelect(filterLineId);
}

function updateTargetProductSelectForRep(selectedRepId) {
  const lineSelect = document.getElementById('targetLineFilterSelect');
  const filterLineId = lineSelect ? lineSelect.value : 'all';
  updateTargetProductSelect(filterLineId);
}

function populateTargetAreaSelect(filterLineId = 'all') {
  const areaSelect = document.getElementById('targetAreaSelect') || document.getElementById('targetRepSelect');
  if (!areaSelect) return;
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : []);
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);

  let areasToDisplay = allAreas;
  if (filterLineId && filterLineId !== 'all') {
    areasToDisplay = allAreas.filter((a) => !a.lineId || a.lineId === filterLineId);
    if (areasToDisplay.length === 0) areasToDisplay = allAreas;
  }

  const prevAreaVal = areaSelect.value;
  areaSelect.replaceChildren();

  areasToDisplay.forEach((a) => {
    const rep = allUsers.find((u) => u.id === a.repId);
    const line = allLines.find((l) => l.id === a.lineId);
    const repLabel = rep ? \`Rep: \${rep.name}\` : \`[Vacant]\`;
    const lineLabel = line ? \` — \${line.name}\` : '';
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = \`\${a.name}\${a.code ? ' (' + a.code + ')' : ''}\${lineLabel} (\${repLabel})\`;
    areaSelect.appendChild(opt);
  });

  if (prevAreaVal && Array.from(areaSelect.options).some((o) => o.value === prevAreaVal)) {
    areaSelect.value = prevAreaVal;
  }

  if (!areaSelect.dataset.targetAreaBound) {
    areaSelect.dataset.targetAreaBound = 'true';
    areaSelect.addEventListener('change', () => {
      updateTargetProductSelectForArea(areaSelect.value);
    });
  }
}

function populateTargetFormSelects() {
  populateTargetLineFilter();
  const lineSelect = document.getElementById('targetLineFilterSelect');
  const filterLineId = lineSelect ? lineSelect.value : 'all';
  populateTargetAreaSelect(filterLineId);
  updateTargetProductSelect(filterLineId);`;

  if (content.includes(targetModalSection)) {
    content = content.replace(targetModalSection, newTargetModalSection);
  }

  // Update renderTargetsTable to support filterLineId
  const oldRenderTargets = `function renderTargetsTable() {
  const tbody = document.getElementById('targetsTableBody');
  if (!tbody) return;
  const targets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
    .slice()
    .sort((a, b) => (b.month || '').localeCompare(a.month || ''));
  const allProducts = getAllProductsFlat();`;

  const newRenderTargets = `function renderTargetsTable(filterLineId = 'all') {
  const tbody = document.getElementById('targetsTableBody');
  if (!tbody) return;
  let targets = (window.store && window.store.targets ? window.store.targets.getAll() : [])
    .slice()
    .sort((a, b) => (b.month || '').localeCompare(a.month || ''));
  const allProducts = getAllProductsFlat();
  const lineSelect = document.getElementById('targetLineFilterSelect');
  const effLineId = filterLineId !== 'all' ? filterLineId : (lineSelect ? lineSelect.value : 'all');
  if (effLineId && effLineId !== 'all') {
    const lineProductIds = new Set(allProducts.filter((p) => p.lineId === effLineId).map((p) => p.id));
    targets = targets.filter((t) => lineProductIds.has(t.productId));
  }`;

  if (content.includes(oldRenderTargets)) {
    content = content.replace(oldRenderTargets, newRenderTargets);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/sales-report.js patched successfully.');
}

// ============================================================================
// 3. js/achievements-report.js
// ============================================================================
{
  const filePath = 'js/achievements-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove renderAchievementsReport from month selections
  content = content.replace(
    /updateAchMonthDropdownLabel\(\);\s+const achRes = document\.getElementById\('achResultsContainer'\);\s+if \(achRes && achRes\.style\.display !== 'none' && typeof renderAchievementsReport === 'function'\) \{\s+renderAchievementsReport\(\);\s+\}/g,
    'updateAchMonthDropdownLabel();'
  );

  // Remove triggerAchAutoRefresh
  const oldAchAuto = `  function triggerAchAutoRefresh() {
    const achRes = document.getElementById('achResultsContainer');
    if (achRes && achRes.style.display !== 'none' && typeof renderAchievementsReport === 'function') {
      renderAchievementsReport();
    }
  }

  const achRepEl = document.getElementById('achRepSelect');
  if (achRepEl && !achRepEl.dataset.achAreaListenerBound) {
    achRepEl.dataset.achAreaListenerBound = 'true';
    achRepEl.addEventListener('change', () => {
      populateAchAreas();
      triggerAchAutoRefresh();
    });
  }

  ['achAreaSelect', 'achSalesTypeSelect', 'achYearSelect'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.autoRefreshBound) {
      el.dataset.autoRefreshBound = 'true';
      el.addEventListener('change', triggerAchAutoRefresh);
    }
  });`;

  const newAchAuto = `  const achRepEl = document.getElementById('achRepSelect');
  if (achRepEl && !achRepEl.dataset.achAreaListenerBound) {
    achRepEl.dataset.achAreaListenerBound = 'true';
    achRepEl.addEventListener('change', () => {
      populateAchAreas();
    });
  }`;

  if (content.includes(oldAchAuto)) {
    content = content.replace(oldAchAuto, newAchAuto);
  }

  // Ensure vacant does not return ['vacant'] in getAchievementsScopeRepIds
  content = content.replace(
    /if \(selectedRep\.startsWith\('vacant:'\)\) \{\s+return \['vacant'\];\s+\}/g,
    `if (selectedRep.startsWith('vacant:')) {
      return null;
    }`
  );

  // In renderAchievementsReport: do not drop vacant sales rows with s.repId &&
  content = content.replace(
    /\.filter\(\(s\) => s\.month === mKey && s\.repId && s\.productId && \(!scopeRepIds \|\| scopeRepIds\.includes\(s\.repId\)\)\);/g,
    '.filter((s) => s.month === mKey && s.productId && (!scopeRepIds || (s.repId && scopeRepIds.includes(s.repId))));'
  );

  // Enhance buildAchievementsData target & sales matching
  const oldTargetMatch = `    let tAreaId = t.areaId;
    if (!tAreaId && t.repId) {
      tAreaId = repToAreaMap.get(t.repId);
    }
    if (!tAreaId || !filteredAreaIds.has(tAreaId)) return;`;

  const newTargetMatch = `    let tAreaId = t.areaId;
    if (!tAreaId && t.repId) {
      tAreaId = repToAreaMap.get(t.repId);
    }
    const matchesTargetArea = Boolean(tAreaId && filteredAreaIds.has(tAreaId));
    const matchesTargetRep = Boolean(selectedRepVal && selectedRepVal !== 'all' && t.repId === selectedRepVal);
    if (!matchesTargetArea && !matchesTargetRep) return;
    if (!tAreaId) tAreaId = Array.from(filteredAreaIds)[0] || 'unknown';`;

  if (content.includes(oldTargetMatch)) {
    content = content.replace(oldTargetMatch, newTargetMatch);
  }

  const oldSalesMatch = `    let sAreaId = s.areaId;
    if (!sAreaId && s.repId) {
      sAreaId = repToAreaMap.get(s.repId);
    }
    if (!sAreaId || !filteredAreaIds.has(sAreaId)) return;`;

  const newSalesMatch = `    let sAreaId = s.areaId;
    if (!sAreaId && s.repId) {
      sAreaId = repToAreaMap.get(s.repId);
    }
    const matchesSalesArea = Boolean(sAreaId && filteredAreaIds.has(sAreaId));
    const matchesSalesRep = Boolean(selectedRepVal && selectedRepVal !== 'all' && s.repId === selectedRepVal);
    if (!matchesSalesArea && !matchesSalesRep) return;
    if (!sAreaId) sAreaId = Array.from(filteredAreaIds)[0] || 'unknown';`;

  if (content.includes(oldSalesMatch)) {
    content = content.replace(oldSalesMatch, newSalesMatch);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/achievements-report.js patched successfully.');
}

// ============================================================================
// 4. js/timeline-report.js
// ============================================================================
{
  const filePath = 'js/timeline-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onTimelineFilterChange
  content = content.replace(
    /window\.onTimelineFilterChange = function \(\) \{\s+renderTimelineReport\(\);\s+\};/g,
    'window.onTimelineFilterChange = function () {};'
  );

  // Enhance employee filtering in renderDailyTimeline
  const oldTimelineRepMatch = `  } else if (selectedRep) {
    const selectedUserObj = allUsers.find((u) => u.id === selectedRep);
    const isDM = selectedUserObj && (selectedUserObj.role === 'district_manager' || selectedUserObj.role === 'dm');
    if (isDM) {
      const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep || (v.repId && dmReps.includes(v.repId)));
    } else {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep);
    }
  }`;

  const newTimelineRepMatch = `  } else if (selectedRep) {
    const selectedUserObj = allUsers.find((u) => u.id === selectedRep);
    const isLM = selectedUserObj && (selectedUserObj.role === 'line_manager' || selectedUserObj.role === 'lm');
    const isDM = selectedUserObj && (selectedUserObj.role === 'district_manager' || selectedUserObj.role === 'dm');
    if (isLM) {
      const dmsUnderLM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
      const lmTeam = new Set([selectedRep, ...dmsUnderLM, ...repsUnderLM]);
      visitsInRange = visitsInRange.filter((v) => lmTeam.has(v.repId) || lmTeam.has(v.userId) || lmTeam.has(v.doubleWithUserId));
    } else if (isDM) {
      const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      const dmTeam = new Set([selectedRep, ...dmReps]);
      visitsInRange = visitsInRange.filter((v) => dmTeam.has(v.repId) || dmTeam.has(v.userId) || dmTeam.has(v.doubleWithUserId));
    } else {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.userId === selectedRep || v.doubleWithUserId === selectedRep);
    }
  }`;

  if (content.includes(oldTimelineRepMatch)) {
    content = content.replace(oldTimelineRepMatch, newTimelineRepMatch);
  }

  // Update activityTargetIds for DM/LM
  const oldActivityTargets = `  } else if (selectedRep && selectedRep !== 'all') {
    activityTargetIds = [selectedRep];
  }`;

  const newActivityTargets = `  } else if (selectedRep && selectedRep !== 'all') {
    const selectedUserObj = allUsers.find((u) => u.id === selectedRep);
    const isLM = selectedUserObj && (selectedUserObj.role === 'line_manager' || selectedUserObj.role === 'lm');
    const isDM = selectedUserObj && (selectedUserObj.role === 'district_manager' || selectedUserObj.role === 'dm');
    if (isLM) {
      const dmsUnderLM = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
      activityTargetIds = [selectedRep, ...dmsUnderLM, ...repsUnderLM];
    } else if (isDM) {
      const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      activityTargetIds = [selectedRep, ...dmReps];
    } else {
      activityTargetIds = [selectedRep];
    }
  }`;

  if (content.includes(oldActivityTargets)) {
    content = content.replace(oldActivityTargets, newActivityTargets);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/timeline-report.js patched successfully.');
}

// ============================================================================
// 5. js/coverage-report.js
// ============================================================================
{
  const filePath = 'js/coverage-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onCoverageFilterChange
  content = content.replace(
    /window\.onCoverageFilterChange = function \(\) \{\s+renderCoverageReport\(\);\s+\};/g,
    'window.onCoverageFilterChange = function () {};'
  );

  // Enhance rep matching in renderCoverageReport
  content = content.replace(
    /targetList = targetList\.filter\(\(d\) => d\.repId === selectedRep && allowedIds\.includes\(d\.repId\)\);/g,
    `{
        const repAreaIds = allAreas.filter((a) => a.repId === selectedRep).map((a) => a.id);
        targetList = targetList.filter((d) => (d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId))) && (!d.repId || allowedIds.includes(d.repId)));
      }`
  );

  content = content.replace(
    /targetList = targetList\.filter\(\(d\) => d\.repId === selectedRep\);/g,
    `{
      const repAreaIds = allAreas.filter((a) => a.repId === selectedRep).map((a) => a.id);
      targetList = targetList.filter((d) => d.repId === selectedRep || (d.areaId && repAreaIds.includes(d.areaId)));
    }`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/coverage-report.js patched successfully.');
}

// ============================================================================
// 6. js/doctors-report.js
// ============================================================================
{
  const filePath = 'js/doctors-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onDoctorFilterChange
  content = content.replace(
    /function onDoctorFilterChange\(\) \{\s+renderDoctorsReport\(\);\s+\}/g,
    'function onDoctorFilterChange() {}'
  );

  // Fix bug: (!d.areaId && d.repId === repId)
  const oldDocRepBlock = `          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          docs = docs.filter((d) =>
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim())) ||
            (!d.areaId && d.repId === repId)
          );`;

  const newDocRepBlock = `          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          docs = docs.filter((d) =>
            d.repId === repId ||
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
          );`;

  if (content.includes(oldDocRepBlock)) {
    content = content.replace(oldDocRepBlock, newDocRepBlock);
  }

  // Also improve DM and LM area coverage for doctors
  const oldDmBlock = `        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          docs = docs.filter((d) => d.repId && (repsUnderDM.includes(d.repId) || d.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(d.repId)));
        }`;

  const newDmBlock = `        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const dmTeamIds = [repId, ...repsUnderDM];
          const dmAreaIds = allAreas.filter((a) => (a.repId && dmTeamIds.includes(a.repId)) || a.dmId === repId).map((a) => a.id);
          docs = docs.filter((d) =>
            (d.repId && dmTeamIds.includes(d.repId)) ||
            (d.areaId && dmAreaIds.includes(d.areaId))
          );
        }`;

  if (content.includes(oldDmBlock)) {
    content = content.replace(oldDmBlock, newDmBlock);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/doctors-report.js patched successfully.');
}

// ============================================================================
// 7. js/hospitals-report.js
// ============================================================================
{
  const filePath = 'js/hospitals-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onHospitalFilterChange
  content = content.replace(
    /function onHospitalFilterChange\(\) \{\s+renderHospitalsReport\(\);\s+\}/g,
    'function onHospitalFilterChange() {}'
  );

  // Fix bug: (!h.areaId && h.repId === repId)
  const oldHospRepBlock = `          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          hosps = hosps.filter((h) =>
            (h.areaId && repAreaIds.includes(h.areaId)) ||
            (!h.areaId && h.area && repAreaNames.includes(h.area.toLowerCase().trim())) ||
            (!h.areaId && h.repId === repId)
          );`;

  const newHospRepBlock = `          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          hosps = hosps.filter((h) =>
            h.repId === repId ||
            (h.areaId && repAreaIds.includes(h.areaId)) ||
            (h.area && repAreaNames.includes(h.area.toLowerCase().trim()))
          );`;

  if (content.includes(oldHospRepBlock)) {
    content = content.replace(oldHospRepBlock, newHospRepBlock);
  }

  // Improve DM resolution
  const oldHospDmBlock = `        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          hosps = hosps.filter((h) => h.repId && (repsUnderDM.includes(h.repId) || h.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(h.repId)));
        }`;

  const newHospDmBlock = `        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const dmTeamIds = [repId, ...repsUnderDM];
          const dmAreaIds = allAreas.filter((a) => (a.repId && dmTeamIds.includes(a.repId)) || a.dmId === repId).map((a) => a.id);
          hosps = hosps.filter((h) =>
            (h.repId && dmTeamIds.includes(h.repId)) ||
            (h.areaId && dmAreaIds.includes(h.areaId))
          );
        }`;

  if (content.includes(oldHospDmBlock)) {
    content = content.replace(oldHospDmBlock, newHospDmBlock);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/hospitals-report.js patched successfully.');
}

// ============================================================================
// 8. js/pharmacies-report.js
// ============================================================================
{
  const filePath = 'js/pharmacies-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onPharmacyFilterChange
  content = content.replace(
    /function onPharmacyFilterChange\(\) \{\s+renderPharmaciesReport\(\);\s+\}/g,
    'function onPharmacyFilterChange() {}'
  );

  // Fix bug: (!p.areaId && p.repId === repId)
  const oldPharmRepBlock = `          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          pharms = pharms.filter((p) =>
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (!p.areaId && p.area && repAreaNames.includes(p.area.toLowerCase().trim())) ||
            (!p.areaId && p.repId === repId)
          );`;

  const newPharmRepBlock = `          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          pharms = pharms.filter((p) =>
            p.repId === repId ||
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (p.area && repAreaNames.includes(p.area.toLowerCase().trim()))
          );`;

  if (content.includes(oldPharmRepBlock)) {
    content = content.replace(oldPharmRepBlock, newPharmRepBlock);
  }

  // Improve DM resolution
  const oldPharmDmBlock = `        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          pharms = pharms.filter((p) => p.repId && (repsUnderDM.includes(p.repId) || p.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(p.repId)));
        }`;

  const newPharmDmBlock = `        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const dmTeamIds = [repId, ...repsUnderDM];
          const dmAreaIds = allAreas.filter((a) => (a.repId && dmTeamIds.includes(a.repId)) || a.dmId === repId).map((a) => a.id);
          pharms = pharms.filter((p) =>
            (p.repId && dmTeamIds.includes(p.repId)) ||
            (p.areaId && dmAreaIds.includes(p.areaId))
          );
        }`;

  if (content.includes(oldPharmDmBlock)) {
    content = content.replace(oldPharmDmBlock, newPharmDmBlock);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/pharmacies-report.js patched successfully.');
}

// ============================================================================
// 9. js/missing-days-report.js
// ============================================================================
{
  const filePath = 'js/missing-days-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onMissingDaysFilterChange
  content = content.replace(
    /window\.onMissingDaysFilterChange = function \(\) \{\s+renderMissingDaysReport\(\);\s+\};/g,
    'window.onMissingDaysFilterChange = function () {};'
  );

  // Remove auto calling in line/dm change
  content = content.replace(
    /if \(typeof window\.onMissingDaysFilterChange === "function"\) \{\s+window\.onMissingDaysFilterChange\(\);\s+\}/g,
    '// cascading filter updated'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/missing-days-report.js patched successfully.');
}

// ============================================================================
// 10. js/gps-tracing-report.js
// ============================================================================
{
  const filePath = 'js/gps-tracing-report.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Neutralize onGpsFilterChange
  content = content.replace(
    /window\.onGpsFilterChange = function \(\) \{\s+renderGpsTracingReport\(\);\s+\};/g,
    'window.onGpsFilterChange = function () {};'
  );

  // Remove auto calling in line/dm change
  content = content.replace(
    /if \(typeof window\.onGpsFilterChange === "function"\) \{\s+window\.onGpsFilterChange\(\);\s+\}/g,
    '// cascading filter updated'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('js/gps-tracing-report.js patched successfully.');
}

console.log('All patches executed successfully.');
