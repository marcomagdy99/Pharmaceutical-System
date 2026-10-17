const fs = require('fs');
const vm = require('vm');

const domElements = {};
function getEl(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      value: 'all',
      innerHTML: '',
      style: { display: 'none' },
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
  getElementById: getEl,
  querySelectorAll: (sel) => {
    if (sel === '.report-tab-btn') {
      return [{ dataset: { tab: 'sales' }, classList: { toggle: () => {}, contains: () => true } }];
    }
    if (sel === '.report-content-panel') {
      return [{ id: 'tabPanel-sales', classList: { toggle: () => {}, contains: () => true } }];
    }
    return [];
  },
  querySelector: () => null,
  createElement: (t) => ({ tagName: t, value: '', textContent: '', style: {}, appendChild: () => {}, addEventListener: () => {} }),
  addEventListener: () => {}
};

const storeData = {};
const mockLocalStorage = {
  getItem: (k) => storeData[k] || null,
  setItem: (k, v) => { storeData[k] = String(v); },
  removeItem: (k) => { delete storeData[k]; }
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

// Load app.js, store.js, shared-report.js
['js/app.js', 'js/store.js', 'js/shared-report.js', 'js/sales-report.js', 'js/achievements-report.js', 'js/timeline-report.js', 'js/coverage-report.js', 'js/doctors-report.js', 'js/hospitals-report.js', 'js/pharmacies-report.js', 'js/missing-days-report.js', 'js/gps-tracing-report.js', 'js/accounts-costing-report.js'].forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInNewContext(code, sandbox);
});

console.log('All 10 report scripts loaded.');

// Setup sample data across tabs
const line1 = 'line_1790626000001';
const line2 = 'line_1790626000002';

// 1. Doctors
sandbox.window.DEMO_DATA.doctors = [
  { id: 'doc1', name: 'Dr. Cardio Only', lineId: line1, repId: 'u1790626000001', areaId: 'area_1790626000001' },
  { id: 'doc2', name: 'Dr. Neuro Only', lineId: line2, repId: 'u1790626000004', areaId: 'area_1790626000003' }
];

// 2. Hospitals
sandbox.window.DEMO_DATA.hospitals = [
  { id: 'hosp1', name: 'Cardio Hospital', lineId: line1, repId: 'u1790626000001', areaId: 'area_1790626000001' },
  { id: 'hosp2', name: 'Neuro Hospital', lineId: line2, repId: 'u1790626000004', areaId: 'area_1790626000003' }
];

// 3. Pharmacies
sandbox.window.DEMO_DATA.pharmacies = [
  { id: 'ph1', name: 'Cardio Pharmacy', lineId: line1, repId: 'u1790626000001', areaId: 'area_1790626000001' },
  { id: 'ph2', name: 'Neuro Pharmacy', lineId: line2, repId: 'u1790626000004', areaId: 'area_1790626000003' }
];

// 4. Visits
sandbox.window.DEMO_DATA.visits = [
  { id: 'v1', date: '2026-03-10', repId: 'u1790626000001', lineId: line1, doctorId: 'doc1', targetName: 'Dr. Cardio Only', status: 'completed' },
  { id: 'v2', date: '2026-03-11', repId: 'u1790626000004', lineId: line2, doctorId: 'doc2', targetName: 'Dr. Neuro Only', status: 'completed' }
];

// 5. Sales & Targets
sandbox.window.DEMO_DATA.distributorSales = [
  { id: 's1', productId: 'prod_1790626000001', month: '2026-03', units: 100, totalValue: 5000, pharmacyName: 'Ph 1', areaId: 'area_1790626000001', lineId: line1 },
  { id: 's2', productId: 'prod_1790626000005', month: '2026-03', units: 50, totalValue: 4000, pharmacyName: 'Ph 2', areaId: 'area_1790626000003', lineId: line2 }
];
sandbox.window.DEMO_DATA.targets = [
  { id: 't1', productId: 'prod_1790626000001', month: '2026-03', targetUnits: 120, targetValue: 6000, areaId: 'area_1790626000001' },
  { id: 't2', productId: 'prod_1790626000005', month: '2026-03', targetUnits: 60, targetValue: 4800, areaId: 'area_1790626000003' }
];

sandbox.syncReportsData();
sandbox.window.checkAuth = () => ({ id: 'u1790626000010', role: 'admin' });

// 6. Missing Days
// 7. Accounts Costing
sandbox.window.DEMO_DATA.services = [
  { id: 'srv1', doctorId: 'doc1', requesterId: 'u1790626000001', lineId: line1, status: 'approved', totalCost: 1000, category: 'Conference' },
  { id: 'srv2', doctorId: 'doc2', requesterId: 'u1790626000004', lineId: line2, status: 'approved', totalCost: 2000, category: 'Conference' }
];

function testTab(tabName, line) {
  sandbox.window.selectedReportLineId = line;
  sandbox.document.getElementById('reportLineFilter').value = line;

  if (tabName === 'doctors') {
    return sandbox.getScopedDoctors(false).length;
  }
  if (tabName === 'hospitals') {
    return sandbox.getScopedHospitals(false).length;
  }
  if (tabName === 'pharmacies') {
    return sandbox.getScopedPharmacies(false).length;
  }
  if (tabName === 'sales') {
    sandbox.document.getElementById('pharmSalesYearSelect').value = '2026';
    sandbox.window.getSelectedPharmSalesMonths = () => ['03'];
    return sandbox.getFilteredPharmSalesRows().length;
  }
  if (tabName === 'achievements') {
    return sandbox.buildAchievementsData(['2026-03'], null).length;
  }
  if (tabName === 'timeline') {
    sandbox.document.getElementById('timelineDateFrom').value = '2026-03-01';
    sandbox.document.getElementById('timelineDateTo').value = '2026-03-31';
    sandbox.document.getElementById('timelineRepSelect').value = 'all';
    // Let's inspect timeline visits
    const visits = (sandbox.window.DEMO_DATA.visits || []).filter(v => {
      if (line === 'all') return true;
      if (v.lineId === line) return true;
      const rLines = sandbox.window.getUserLines(v.repId) || [];
      return rLines.some(l => l.id === line);
    });
    return visits.length;
  }
  if (tabName === 'coverage') {
    sandbox.document.getElementById('coverageStartDate').value = '2026-03-01';
    sandbox.document.getElementById('coverageEndDate').value = '2026-03-31';
    sandbox.document.getElementById('coverageRepSelect').value = 'all';
    let targetList = (sandbox.window.DEMO_DATA.doctors || []).slice();
    if (line !== 'all') {
      targetList = targetList.filter(d => {
        if (d.lineId) return d.lineId === line;
        const rLines = sandbox.window.getUserLines(d.repId) || [];
        return rLines.some(l => l.id === line);
      });
    }
    return targetList.length;
  }
  if (tabName === 'accounts-costing') {
    const rawServices = (sandbox.window.DEMO_DATA.services || []).filter(s => {
      if (line === 'all') return true;
      return s.lineId === line;
    });
    return rawServices.length;
  }
  return 'N/A';
}

['doctors', 'hospitals', 'pharmacies', 'sales', 'achievements', 'timeline', 'coverage', 'accounts-costing'].forEach(tab => {
  const allCount = testTab(tab, 'all');
  const l1Count = testTab(tab, line1);
  const l2Count = testTab(tab, line2);
  console.log(`Tab: ${tab.padEnd(16)} | All: ${allCount} | Line 1: ${l1Count} | Line 2: ${l2Count}`);
});
