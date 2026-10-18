const fs = require('fs');
const vm = require('vm');

// Mock localStorage and window
const storeData = {};
const mockLocalStorage = {
  getItem: (k) => storeData[k] || null,
  setItem: (k, v) => { storeData[k] = String(v); },
  removeItem: (k) => { delete storeData[k]; }
};

const domElements = {};
function getOrCreateEl(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      value: 'all',
      innerHTML: '',
      style: { display: 'block' },
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      options: [],
      children: [],
      dataset: {},
      appendChild(c) { this.options.push(c); this.children.push(c); },
      replaceChildren() { this.options = []; this.children = []; },
      addEventListener() {}
    };
  }
  return domElements[id];
}

const mockDocument = {
  documentElement: { dir: 'ltr' },
  body: { classList: { add: () => {}, remove: () => {} } },
  getElementById: getOrCreateEl,
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (t) => ({ tagName: t, value: '', textContent: '', style: {}, appendChild: () => {}, addEventListener: () => {} }),
  addEventListener: () => {}
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  Intl,
  Date,
  URLSearchParams,
  URL
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.window.location = { href: 'http://localhost/reports.html', search: '', pathname: '/reports.html', replace: () => {} };
sandbox.location = sandbox.window.location;
sandbox.global = sandbox;

// Load app.js
const appCode = fs.readFileSync('js/app.js', 'utf8');
vm.runInNewContext(appCode, sandbox);

// Load store.js
const storeCode = fs.readFileSync('js/store.js', 'utf8');
vm.runInNewContext(storeCode, sandbox);

// Initialize DEMO_DATA in store
if (sandbox.window.DEMO_DATA) {
  console.log('DEMO_DATA loaded successfully');
  console.log('Lines:', sandbox.window.DEMO_DATA.productLines.map(l => ({ id: l.id, name: l.name })));
}

// Load shared-report.js
const sharedReportCode = fs.readFileSync('js/shared-report.js', 'utf8');
vm.runInNewContext(sharedReportCode, sandbox);

// Load sales-report.js
const salesReportCode = fs.readFileSync('js/sales-report.js', 'utf8');
vm.runInNewContext(salesReportCode, sandbox);

// Load achievements-report.js
const achReportCode = fs.readFileSync('js/achievements-report.js', 'utf8');
vm.runInNewContext(achReportCode, sandbox);

// Check sales rows under all lines vs line 1 vs line 2
const line1 = sandbox.window.DEMO_DATA.productLines[0].id;
const line2 = sandbox.window.DEMO_DATA.productLines[1].id;

// Populate sample sales and targets
sandbox.window.DEMO_DATA.distributorSales = [
  { id: 's1', productId: 'prod_1790626000001', month: '2026-03', units: 100, totalValue: 5000, pharmacyName: 'Al-Ezaby', areaId: 'area_1790626000001' },
  { id: 's2', productId: 'prod_1790626000005', month: '2026-03', units: 50, totalValue: 4000, pharmacyName: 'Seif', areaId: 'area_1790626000002' }
];
sandbox.window.DEMO_DATA.targets = [
  { id: 't1', productId: 'prod_1790626000001', month: '2026-03', targetUnits: 120, targetValue: 6000, areaId: 'area_1790626000001' },
  { id: 't2', productId: 'prod_1790626000005', month: '2026-03', targetUnits: 60, targetValue: 4800, areaId: 'area_1790626000002' }
];

console.log('Testing Sales Report filtering:');
sandbox.window.checkAuth = () => ({ id: 'u1790626000010', role: 'admin' });

// Set default month/year
sandbox.document.getElementById('pharmSalesYearSelect').value = '2026';
sandbox.window.getSelectedPharmSalesMonths = () => ['03'];

// Filter = all
sandbox.window.selectedReportLineId = 'all';
sandbox.document.getElementById('reportLineFilter').value = 'all';
const rowsAll = sandbox.getFilteredPharmSalesRows();
console.log('Sales rows (All Lines):', rowsAll.length);

// Filter = Line 1
sandbox.window.selectedReportLineId = line1;
sandbox.document.getElementById('reportLineFilter').value = line1;
const rowsLine1 = sandbox.getFilteredPharmSalesRows();
console.log('Sales rows (Line 1:', line1, '):', rowsLine1.length);

// Filter = Line 2
sandbox.window.selectedReportLineId = line2;
sandbox.document.getElementById('reportLineFilter').value = line2;
const rowsLine2 = sandbox.getFilteredPharmSalesRows();
console.log('Sales rows (Line 2:', line2, '):', rowsLine2.length);

console.log('\nTesting Achievements Report:');
sandbox.window.selectedReportLineId = 'all';
sandbox.document.getElementById('reportLineFilter').value = 'all';
const achAll = sandbox.buildAchievementsData(['2026-03'], null);
console.log('Achievements rows (All Lines):', achAll.length);

sandbox.window.selectedReportLineId = line1;
sandbox.document.getElementById('reportLineFilter').value = line1;
const achLine1 = sandbox.buildAchievementsData(['2026-03'], null);
console.log('Achievements rows (Line 1):', achLine1.length);

sandbox.window.selectedReportLineId = line2;
sandbox.document.getElementById('reportLineFilter').value = line2;
const achLine2 = sandbox.buildAchievementsData(['2026-03'], null);
console.log('Achievements rows (Line 2):', achLine2.length);
