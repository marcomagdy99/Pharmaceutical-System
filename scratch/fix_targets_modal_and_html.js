const fs = require('fs');

// 1. Fix reports.html search input oninput triggers
let html = fs.readFileSync('reports.html', 'utf8');
html = html.replace(
  /<input\s+type="text"\s+id="doctorSearchInput"\s+class="form-control"\s+data-i18n-placeholder="searchDoctorsPlaceholder"\s+placeholder="Search by name, clinic, phone\.\.\."\s+oninput="if \(typeof onDoctorFilterChange === 'function'\) onDoctorFilterChange\(\);"\s*\/>/g,
  '<input type="text" id="doctorSearchInput" class="form-control" data-i18n-placeholder="searchDoctorsPlaceholder" placeholder="Search by name, clinic, phone..." />'
);

html = html.replace(
  /<input\s+type="text"\s+id="hospitalSearchInput"\s+class="form-control"\s+data-i18n-placeholder="searchHospitalsPlaceholder"\s+placeholder="Search by hospital name or code\.\.\."\s+oninput="if \(typeof onHospitalFilterChange === 'function'\) onHospitalFilterChange\(\);"\s*\/>/g,
  '<input type="text" id="hospitalSearchInput" class="form-control" data-i18n-placeholder="searchHospitalsPlaceholder" placeholder="Search by hospital name or code..." />'
);

html = html.replace(
  /<input\s+type="text"\s+id="pharmacySearchInput"\s+class="form-control"\s+data-i18n-placeholder="searchPharmaciesPlaceholder"\s+placeholder="Search by pharmacy name or code\.\.\."\s+oninput="if \(typeof onPharmacyFilterChange === 'function'\) onPharmacyFilterChange\(\);"\s*\/>/g,
  '<input type="text" id="pharmacySearchInput" class="form-control" data-i18n-placeholder="searchPharmaciesPlaceholder" placeholder="Search by pharmacy name or code..." />'
);

fs.writeFileSync('reports.html', html, 'utf8');
console.log('reports.html search triggers cleaned.');

// 2. Fix js/sales-report.js targets modal
let salesJs = fs.readFileSync('js/sales-report.js', 'utf8');

const targetOldChunk = salesJs.substring(
  salesJs.indexOf('function updateTargetProductSelectForArea(selectedAreaId) {'),
  salesJs.indexOf('updateTargetProductSelectForArea(areaSelect ? areaSelect.value : null);') + 'updateTargetProductSelectForArea(areaSelect ? areaSelect.value : null);'.length
);

const targetNewChunk = `window.populateTargetLineFilter = function () {
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

if (targetOldChunk) {
  salesJs = salesJs.replace(targetOldChunk, targetNewChunk);
}

// Also update renderTargetsTable
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

if (salesJs.includes(oldRenderTargets)) {
  salesJs = salesJs.replace(oldRenderTargets, newRenderTargets);
}

fs.writeFileSync('js/sales-report.js', salesJs, 'utf8');
console.log('js/sales-report.js targets modal functions successfully installed.');
