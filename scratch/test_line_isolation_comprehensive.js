const fs = require('fs');

const elements = {};
function createElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    options: [],
    children: [],
    dataset: {},
    value: '',
    disabled: false,
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return createElement('div'); },
    querySelectorAll() { return []; },
    appendChild(child) {
      this.children.push(child);
      if (child.tagName === 'OPTION') this.options.push(child);
      if (child.tagName === 'OPTGROUP') {
        child.children.forEach(c => { if (c.tagName === 'OPTION') this.options.push(c); });
      }
    },
    replaceChildren(...newChildren) {
      this.children = [...newChildren];
      this.options = [];
      newChildren.forEach(c => {
        if (c.tagName === 'OPTION') this.options.push(c);
        if (c.tagName === 'OPTGROUP') {
          c.children.forEach(gc => { if (gc.tagName === 'OPTION') this.options.push(gc); });
        }
      });
      this.value = '';
    }
  };
}

global.document = {
  documentElement: { dir: 'ltr', lang: 'en', setAttribute() {}, getAttribute() { return null; } },
  body: createElement('body'),
  getElementById(id) {
    if (!elements[id]) elements[id] = createElement('div');
    return elements[id];
  },
  createElement(tag) {
    return createElement(tag);
  },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {},
  removeEventListener() {}
};

global.window = global;
global.window.location = { href: 'http://localhost/reports.html', pathname: '/reports.html' };
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
const mockUser = { id: 'u1790626000010', name: 'Dr. Tarek Admin', role: 'admin' };
global.localStorage = {
  getItem: (k) => k === 'pharmaUser' ? JSON.stringify(mockUser) : null,
  setItem: () => null,
  removeItem: () => null
};
global.sessionStorage = global.localStorage;

// First load app.js, then store.js, shared-report.js, sales-report.js
eval(fs.readFileSync('js/app.js', 'utf8'));
if (fs.existsSync('js/egypt-bricks-data.js')) eval(fs.readFileSync('js/egypt-bricks-data.js', 'utf8'));
eval(fs.readFileSync('js/store.js', 'utf8'));
eval(fs.readFileSync('js/shared-report.js', 'utf8'));
eval(fs.readFileSync('js/sales-report.js', 'utf8'));
eval(fs.readFileSync('js/achievements-report.js', 'utf8'));
eval(fs.readFileSync('js/doctors-report.js', 'utf8'));
eval(fs.readFileSync('js/hospitals-report.js', 'utf8'));
eval(fs.readFileSync('js/pharmacies-report.js', 'utf8'));

console.log('=== PRODUCT LINES IN DEMO DATA ===');
const lines = DEMO_DATA.productLines || [];
lines.forEach(l => console.log(`- ${l.name} (${l.id})`));

const cardioLine = lines.find(l => (l.name || '').toLowerCase().includes('cardio') || l.id === 'line_1790626000001');
const neuroLine = lines.find(l => (l.name || '').toLowerCase().includes('neuro') || l.id === 'line_1790626000002');

console.log('\nCardio Line:', cardioLine ? `${cardioLine.name} (${cardioLine.id})` : 'None');
console.log('Neuro Line:', neuroLine ? `${neuroLine.name} (${neuroLine.id})` : 'None');

const adminUser = DEMO_DATA.users.find(u => u.role === 'admin') || { role: 'admin', id: 'u1790626000010' };

// 1. Check getUserLines and getScopedTeamForLine
console.log('\n=== TESTING USER LINES & SCOPED TEAMS ===');
if (cardioLine) {
  const cardioTeam = getScopedTeamForLine(cardioLine.id, adminUser);
  const cardioReps = cardioTeam.filter(u => u.role === 'medical_rep' || u.role === 'rep');
  console.log(`Cardio Reps (${cardioReps.length}):`, cardioReps.map(r => r.name).join(', '));
}
if (neuroLine) {
  const neuroTeam = getScopedTeamForLine(neuroLine.id, adminUser);
  const neuroReps = neuroTeam.filter(u => u.role === 'medical_rep' || u.role === 'rep');
  console.log(`Neuro Reps (${neuroReps.length}):`, neuroReps.map(r => r.name).join(', '));
}

// 2. Test unified employee dropdown population for Cardio Line
console.log('\n=== TESTING UNIFIED EMPLOYEE DROPDOWN (Cardio Line) ===');
if (cardioLine) {
  onReportLineFilterChange(cardioLine.id);
  const pharmRepSelect = document.getElementById('pharmSalesRepSelect');
  console.log('Pharm Sales Rep Select Options count:', pharmRepSelect.options.length);
  const repOpts = pharmRepSelect.options.map(o => `${o.value}: ${o.textContent}`);
  console.log('Sample options:', repOpts.slice(0, 10));
}

// 3. Test Product filtering for Cardio Line vs Neuro Line
console.log('\n=== TESTING PRODUCT FILTERING BY LINE ===');
if (cardioLine) {
  updatePharmSalesProductsForLine(cardioLine.id);
  const prodSelect = document.getElementById('pharmSalesProductSelect');
  console.log(`Cardio Products (${prodSelect.options.length}):`, prodSelect.options.map(o => o.textContent).join(', '));
  // Verify that all products (except All) belong to cardioLine
  const allProds = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
  const invalidCardio = prodSelect.options.filter(o => {
    if (o.value === 'all') return false;
    const p = allProds.find(x => x.id === o.value);
    return !p || p.lineId !== cardioLine.id;
  });
  console.log('Invalid Cardio products in select (should be 0):', invalidCardio.length);
}

if (neuroLine) {
  updatePharmSalesProductsForLine(neuroLine.id);
  const prodSelect = document.getElementById('pharmSalesProductSelect');
  console.log(`Neuro Products (${prodSelect.options.length}):`, prodSelect.options.map(o => o.textContent).join(', '));
  const allProds = typeof getAllProductsFlat === 'function' ? getAllProductsFlat() : [];
  const invalidNeuro = prodSelect.options.filter(o => {
    if (o.value === 'all') return false;
    const p = allProds.find(x => x.id === o.value);
    return !p || p.lineId !== neuroLine.id;
  });
  console.log('Invalid Neuro products in select (should be 0):', invalidNeuro.length);
}

// 4. Test Area filtering for Cardio Line vs Neuro Line
console.log('\n=== TESTING AREA FILTERING BY LINE ===');
if (cardioLine) {
  window.selectedReportLineId = cardioLine.id;
  populatePharmSalesAreas(adminUser);
  const areaSelect = document.getElementById('pharmSalesAreaSelect');
  console.log(`Cardio Sales Areas (${areaSelect.options.length}):`, areaSelect.options.map(o => o.textContent).join(', '));
}

// 5. Test Sales Data Filtering by Line
console.log('\n=== TESTING SALES DATA FILTERING BY LINE ===');
if (cardioLine) {
  window.selectedReportLineId = cardioLine.id;
  const filteredSales = getFilteredPharmSalesRows(false);
  console.log(`Cardio Sales Rows count: ${filteredSales.length}`);
  const allProds = (store.products ? store.products.getAll() : DEMO_DATA.products) || [];
  const allAreas = (store.areas ? store.areas.getAll() : DEMO_DATA.areas) || [];
  let leakedRows = 0;
  filteredSales.forEach(row => {
    const p = allProds.find(x => x.id === row.productId);
    const a = allAreas.find(x => x.id === row.areaId);
    const prodMatch = p && p.lineId === cardioLine.id;
    const areaMatch = a && a.lineId === cardioLine.id;
    if (!prodMatch && !areaMatch) {
      leakedRows++;
      console.log('Leaked row:', row.productName, row.areaName);
    }
  });
  console.log('Leaked rows count (should be 0):', leakedRows);
}

// 6. Test Doctors, Hospitals, and Pharmacies Data Filtering by Line
console.log('\n=== TESTING DIRECTORIES FILTERING BY LINE ===');
if (cardioLine) {
  window.selectedReportLineId = cardioLine.id;
  const filteredDocs = getScopedDoctors(false);
  const filteredHosps = getScopedHospitals(false);
  const filteredPharms = getScopedPharmacies(false);
  console.log(`Cardio Doctors count: ${filteredDocs.length}`);
  console.log(`Cardio Hospitals count: ${filteredHosps.length}`);
  console.log(`Cardio Pharmacies count: ${filteredPharms.length}`);
}

if (neuroLine) {
  window.selectedReportLineId = neuroLine.id;
  const filteredDocs = getScopedDoctors(false);
  const filteredHosps = getScopedHospitals(false);
  const filteredPharms = getScopedPharmacies(false);
  console.log(`Neuro Doctors count: ${filteredDocs.length}`);
  console.log(`Neuro Hospitals count: ${filteredHosps.length}`);
  console.log(`Neuro Pharmacies count: ${filteredPharms.length}`);
}

console.log('\nALL VERIFICATIONS COMPLETE!');
