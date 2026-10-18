const fs = require('fs');
const vm = require('vm');

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
};
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      value: 'all',
      options: [],
      children: [],
      disabled: false,
      innerHTML: '',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      dataset: {},
      replaceChildren: function() { this.options = []; this.children = []; },
      appendChild: function(opt) { 
        this.options.push(opt); 
        this.children.push(opt);
        if (opt.children) {
          opt.children.forEach(c => this.options.push(c));
        }
      },
      addEventListener: () => {}
    };
  }
  return elements[id];
}

const window = {
  DEMO_DATA: {},
  store: {},
  location: { search: '', pathname: '/reports.html', href: 'http://localhost/reports.html', replace: () => {} },
  addEventListener: () => {}
};
global.window = window;
global.document = {
  getElementById: getEl,
  querySelectorAll: () => [],
  querySelector: (sel) => null,
  addEventListener: () => {},
  createElement: (tag) => ({ 
    tag, 
    value: '', 
    textContent: '', 
    children: [],
    appendChild: function(c) { 
      this.children.push(c); 
    },
    addEventListener: () => {}
  }),
  readyState: 'loading'
};

vm.runInThisContext(fs.readFileSync('js/app.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/store.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/shared-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/sales-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/achievements-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/timeline-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/coverage-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/doctors-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/hospitals-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/pharmacies-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/missing-days-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/gps-tracing-report.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/accounts-costing-report.js', 'utf8'));

console.log('--- Testing Report Filter Initialization ---');

const usersToTest = [
  { role: 'admin', id: 'u1790626000010', name: 'Admin' },
  { role: 'business_unit', id: 'u1790626000011', name: 'George (BU)' },
  { role: 'line_manager', id: 'u1790626000012', name: 'John (LM)' },
  { role: 'district_manager', id: 'u1790626000014', name: 'Amir (DM)' },
  { role: 'medical_rep', id: 'u1790626000001', name: 'Marco (Rep)' }
];

usersToTest.forEach(testUser => {
  console.log(`\n=== Testing for user: ${testUser.name} (${testUser.role}) ===`);
  window.checkAuth = () => testUser;
  
  // 0. Init all filters
  if (typeof initAllFilters === 'function') {
    initAllFilters(testUser);
  } else {
    populateReportLineFilter(testUser);
  }
  const lineOpts = getEl('reportLineFilter').options.map(o => o.value + ': ' + o.textContent);
  console.log('reportLineFilter options:', lineOpts.length, lineOpts);

  // 2. Employee filters
  populateUnifiedReportEmployeeFilters(testUser, 'all');
  const pharmRepOpts = getEl('pharmSalesRepSelect').options.map(o => o.value + ': ' + o.textContent);
  console.log('pharmSalesRepSelect options:', pharmRepOpts.length);
  
  // 3. Sales Area Filter
  if (typeof window.populatePharmSalesAreas === 'function') {
    window.populatePharmSalesAreas(testUser);
  }
  const pharmAreaOpts = getEl('pharmSalesAreaSelect').options.map(o => o.value + ': ' + o.textContent);
  console.log('pharmSalesAreaSelect options:', pharmAreaOpts.length);

  // 4. Ach Area Filter
  window.populateAchAreas(testUser);
  const achAreaOpts = getEl('achAreaSelect').options.map(o => o.value + ': ' + o.textContent);
  console.log('achAreaSelect options:', achAreaOpts.length);

  // 5. Missing Days filters
  if (typeof window.initMissingDaysTab === 'function') {
    window.initMissingDaysTab();
    const missingLines = getEl('missingLineSelect').options.map(o => o.value);
    const missingDms = getEl('missingDmSelect').options.map(o => o.value);
    const missingReps = getEl('missingRepSelect').options.map(o => o.value);
    console.log(`missingDays: lines=${missingLines.length}, dms=${missingDms.length}, reps=${missingReps.length}`);
  }

  // 6. GPS Tracing filters
  if (typeof window.initGpsTracingTab === 'function') {
    window.initGpsTracingTab();
    const gpsLines = getEl('gpsLineSelect').options.map(o => o.value);
    const gpsDms = getEl('gpsDmSelect').options.map(o => o.value);
    const gpsReps = getEl('gpsRepSelect').options.map(o => o.value);
    console.log(`gpsTracing: lines=${gpsLines.length}, dms=${gpsDms.length}, reps=${gpsReps.length}`);
  }

  // 7. Accounts Costing filters
  if (typeof window.initAccountsCostingTab === 'function') {
    window.initAccountsCostingTab();
    const costingLines = getEl('accountsCostingLineSelect').options.map(o => o.value);
    const costingDms = getEl('accountsCostingDmSelect').options.map(o => o.value);
    const costingReps = getEl('accountsCostingRepSelect').options.map(o => o.value);
    const costingAreas = getEl('accountsCostingAreaSelect').options.map(o => o.value);
    console.log(`accountsCosting: lines=${costingLines.length}, dms=${costingDms.length}, reps=${costingReps.length}, areas=${costingAreas.length}`);
  }
});
