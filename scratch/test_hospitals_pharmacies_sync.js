const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const hospReportContent = fs.readFileSync('js/hospitals-report.js', 'utf8');
const pharmReportContent = fs.readFileSync('js/pharmacies-report.js', 'utf8');
const visitsContent = fs.readFileSync('js/visits.js', 'utf8');

['admin1', 'lm1', 'dm1'].forEach(userId => {
  // Test Hospitals (AM)
  {
    const elements = {
      filterLine: { value: 'line1' },
      filterRep: { value: 'vacant:area1' },
      modalTargetFilterSelect: { value: 'vacant:area1' },
      hospitalRepSelect: { value: 'vacant:area1' },
      reportLineFilter: { value: 'line1' },
      hospitalSearchInput: { value: '' },
      visitTarget: { replaceChildren: () => {}, appendChild: (c) => visitOptions.push(c) },
      visitTargetLabel: { textContent: '' },
      modalTargetFilterContainer: { style: {} }
    };
    let visitOptions = [];

    const sandbox = {
      window: { location: { href: 'http://localhost/visits.html', pathname: '/visits.html', replace: () => {} }, addEventListener: () => {} },
      location: { href: 'http://localhost/visits.html', pathname: '/visits.html', replace: () => {} },
      document: {
        getElementById: (id) => elements[id] || { value: '' },
        createElement: (tag) => ({ value: '', textContent: '', className: '', dataset: {}, style: {} }),
        querySelector: (s) => (s && s.includes('visitPeriod')) ? { value: 'am' } : null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        dispatchEvent: () => {}
      },
      sessionStorage: { getItem: (k) => k === 'pharmaUser' ? JSON.stringify({ id: userId, role: userId === 'admin1' ? 'admin' : (userId === 'lm1' ? 'line_manager' : 'district_manager') }) : null, setItem: () => {} },
      localStorage: { getItem: (k) => k === 'pharmaUser' ? JSON.stringify({ id: userId, role: userId === 'admin1' ? 'admin' : (userId === 'lm1' ? 'line_manager' : 'district_manager') }) : null, setItem: () => {} },
      navigator: { userAgent: '' }
    };
    sandbox.window.location = sandbox.location;
    sandbox.window.window = sandbox.window;
    sandbox.addEventListener = () => {};
    vm.createContext(sandbox);
    vm.runInContext(appContent, sandbox);

    const user = sandbox.window.DEMO_DATA.users.find(u => u.id === userId);
    sandbox.currentUser = user;
    sandbox.currentUserRole = user.role;

    vm.runInContext(hospReportContent, sandbox);
    const repHosps = sandbox.getScopedHospitals(true);

    vm.runInContext(visitsContent, sandbox);
    visitOptions = [];
    sandbox.updateTargetOptions();

    console.log(`=== [Hospitals] Role: ${user.role} (${user.id}) ===`);
    console.log('Report Hosps:', repHosps.length, repHosps.map(h => h.name));
    console.log('Visits Hosps:', visitOptions.length, visitOptions.map(o => o.textContent));
    assert.strictEqual(repHosps.length, visitOptions.length, `Hospital mismatch for role ${user.role}`);
  }

  // Test Pharmacies (Pharmacy)
  {
    const elements = {
      filterLine: { value: 'line1' },
      filterRep: { value: 'vacant:area1' },
      modalTargetFilterSelect: { value: 'vacant:area1' },
      pharmacyRepSelect: { value: 'vacant:area1' },
      reportLineFilter: { value: 'line1' },
      pharmacySearchInput: { value: '' },
      visitTarget: { replaceChildren: () => {}, appendChild: (c) => visitOptions.push(c) },
      visitTargetLabel: { textContent: '' },
      modalTargetFilterContainer: { style: {} }
    };
    let visitOptions = [];

    const sandbox = {
      window: { location: { href: 'http://localhost/visits.html', pathname: '/visits.html', replace: () => {} }, addEventListener: () => {} },
      location: { href: 'http://localhost/visits.html', pathname: '/visits.html', replace: () => {} },
      document: {
        getElementById: (id) => elements[id] || { value: '' },
        createElement: (tag) => ({ value: '', textContent: '', className: '', dataset: {}, style: {} }),
        querySelector: (s) => (s && s.includes('visitPeriod')) ? { value: 'pharmacy' } : null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        dispatchEvent: () => {}
      },
      sessionStorage: { getItem: (k) => k === 'pharmaUser' ? JSON.stringify({ id: userId, role: userId === 'admin1' ? 'admin' : (userId === 'lm1' ? 'line_manager' : 'district_manager') }) : null, setItem: () => {} },
      localStorage: { getItem: (k) => k === 'pharmaUser' ? JSON.stringify({ id: userId, role: userId === 'admin1' ? 'admin' : (userId === 'lm1' ? 'line_manager' : 'district_manager') }) : null, setItem: () => {} },
      navigator: { userAgent: '' }
    };
    sandbox.window.location = sandbox.location;
    sandbox.window.window = sandbox.window;
    sandbox.addEventListener = () => {};
    vm.createContext(sandbox);
    vm.runInContext(appContent, sandbox);

    const user = sandbox.window.DEMO_DATA.users.find(u => u.id === userId);
    sandbox.currentUser = user;
    sandbox.currentUserRole = user.role;

    vm.runInContext(pharmReportContent, sandbox);
    const repPharms = sandbox.getScopedPharmacies(true);

    vm.runInContext(visitsContent, sandbox);
    visitOptions = [];
    sandbox.updateTargetOptions();

    console.log(`=== [Pharmacies] Role: ${user.role} (${user.id}) ===`);
    console.log('Report Pharms:', repPharms.length, repPharms.map(p => p.name));
    console.log('Visits Pharms:', visitOptions.length, visitOptions.map(o => o.textContent));
    assert.strictEqual(repPharms.length, visitOptions.length, `Pharmacy mismatch for role ${user.role}`);
  }
});

console.log('ALL HOSPITALS & PHARMACIES SYNCHRONIZATION TESTS PASSED 100%!');
