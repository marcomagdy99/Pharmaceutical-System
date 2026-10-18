/**
 * Simulation of browser DOM environment to test the exact 12 suites in costing-test-suite.html
 */

// Mock window and document
const elements = {};
function createMockEl(id, tagName = "div") {
  return {
    id,
    tagName: tagName.toUpperCase(),
    value: "",
    disabled: false,
    innerHTML: "",
    textContent: "",
    style: {},
    children: [],
    appendChild(c) { this.children.push(c); },
    classList: { add() {}, remove() {}, contains: () => false }
  };
}

[
  "accountsCostingDateFrom",
  "accountsCostingDateTo",
  "accountsCostingLineSelect",
  "accountsCostingDmSelect",
  "accountsCostingRepSelect",
  "accountsCostingAreaSelect",
  "accountsCostingClassSelect",
  "accountsCostingSpecialtySelect",
  "accountsCostingSearchInput",
  "accountsCostingOnlyWithExpenses",
  "accountsCostingThead",
  "accountsCostingTbody",
  "accountsCostingTfoot",
  "modalCostingAccountName",
  "modalCostingAccountSub",
  "modalCostingCountText",
  "modalCostingTotalText",
  "modalCostingTbody",
  "accountsCostingBreakdownModal"
].forEach(id => {
  elements[id] = createMockEl(id);
});

global.window = global;
global.document = {
  getElementById: (id) => elements[id] || null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; }
};
global.alert = (msg) => console.log("ALERT:", msg);
global.XLSX = {
  utils: { aoa_to_sheet: () => ({}), book_new: () => ({}), book_append_sheet: () => {} },
  writeFile: () => {}
};

// Load app.js, store.js and accounts-costing-report.js
global.window.addEventListener = () => {};
require("../js/app.js");
require("../js/store.js");
require("../js/accounts-costing-report.js");

console.log("Loaded modules. Initializing test fixtures...");

// Setup Fixtures matching costing-test-suite.html
window.DEMO_DATA = window.DEMO_DATA || {};
const lines = [
  { id: 'line1', name: 'Cardiology Line' },
  { id: 'line2', name: 'Dermatology Line' }
];
lines.forEach(l => {
  const existing = window.DEMO_DATA.productLines.find(x => x.id === l.id);
  if (existing) Object.assign(existing, l);
  else window.DEMO_DATA.productLines.push(l);
});

const users = [
  { id: 'admin1', name: 'System Admin', role: 'admin' },
  { id: 'dm1', name: 'DM Cairo Central', role: 'district_manager', lineId: 'line1', lineIds: ['line1'] },
  { id: 'rep1', name: 'Rep Hassan', role: 'medical_rep', lineId: 'line1', lineIds: ['line1'], areaId: 'area1', areaIds: ['area1'], managerId: 'dm1' },
  { id: 'rep2', name: 'Rep Mina', role: 'medical_rep', lineId: 'line2', lineIds: ['line2'], areaId: 'area2', areaIds: ['area2'], managerId: 'dm2' },
  { id: 'rep3', name: 'Rep Tarek', role: 'medical_rep', lineId: 'line1', lineIds: ['line1'], areaId: 'area3', areaIds: ['area3'], managerId: 'dm1' }
];
users.forEach(u => {
  const existing = window.DEMO_DATA.users.find(x => x.id === u.id);
  if (existing) {
    Object.assign(existing, u);
  } else {
    window.DEMO_DATA.users.push(u);
  }
});

const areas = [
  { id: 'area1', name: 'Dokki', lineId: 'line1', repId: 'rep1' },
  { id: 'area2', name: 'Nasr City', lineId: 'line2', repId: 'rep2' },
  { id: 'area3', name: 'Mohandessin', lineId: 'line1', repId: 'rep3' }
];
areas.forEach(a => {
  const existing = window.DEMO_DATA.areas.find(x => x.id === a.id);
  if (existing) {
    Object.assign(existing, a);
  } else {
    window.DEMO_DATA.areas.push(a);
  }
});

window.DEMO_DATA.doctors = [
  {
    id: 'doc_test_1',
    name: 'Dr. Test Medical VIP',
    clinicName: 'Elite Medical VIP Clinic',
    class: 'A',
    specialty: 'Cardiology',
    lineId: 'line1',
    areaId: 'area1',
    repId: 'rep1'
  }
];

window.DEMO_DATA.services = [];

const todayStr = new Date().toISOString().split('T')[0];

function runSuite(num, name, fn) {
  try {
    const res = fn();
    if (res === false) {
      console.error(`[FAIL] Suite ${num}: ${name} returned FALSE`);
      return false;
    }
    console.log(`[PASS] Suite ${num}: ${name}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] Suite ${num}: ${name} threw error:`, err.message);
    return false;
  }
}

// 1. Suite 1
runSuite(1, "Role Hierarchy Scoping", () => {
  const u = { id: 'rep1', role: 'medical_rep', lineId: 'line1', areaId: 'area1', managerId: 'dm1' };
  window.checkAuth = () => u;
  window.initAccountsCostingTab();

  const lEl = document.getElementById('accountsCostingLineSelect');
  const dEl = document.getElementById('accountsCostingDmSelect');
  const rEl = document.getElementById('accountsCostingRepSelect');

  return lEl.disabled === true && dEl.disabled === true && rEl.disabled === true;
});

// Switch to Admin
window.checkAuth = () => ({ id: 'admin1', role: 'admin', name: 'Admin' });
window.initAccountsCostingTab();
document.getElementById('accountsCostingDateFrom').value = '';
document.getElementById('accountsCostingDateTo').value = '';

// 2. Suite 2
runSuite(2, "Approved Service Reflection", () => {
  const testSrv = {
    id: 'test_srv_app_1',
    targetType: 'doctor',
    targetId: 'doc_test_1',
    targetName: 'Dr. Test Medical VIP',
    title: 'Clinic Equipment Supplies',
    cost: 14000,
    date: todayStr,
    status: 'approved',
    requesterId: 'rep1',
    lineId: 'line1',
    areaId: 'area1'
  };
  window.store.services.add(testSrv);
  window.renderAccountsCostingReport();

  const thead = document.getElementById('accountsCostingThead').innerHTML;
  const tbody = document.getElementById('accountsCostingTbody').innerHTML;
  return thead.includes('Clinic Equipment') && tbody.includes('14,000');
});

// 3. Suite 3
runSuite(3, "Pending & Rejected Exclusion", () => {
  const srvPending = { id: 'test_p_1', targetType: 'doctor', targetId: 'doc_test_1', title: 'Pending Service', cost: 77777, status: 'pending_dm', requesterId: 'rep1', date: todayStr };
  const srvRejected = { id: 'test_r_1', targetType: 'doctor', targetId: 'doc_test_1', title: 'Rejected Service', cost: 88888, status: 'rejected', requesterId: 'rep1', date: todayStr };
  window.store.services.add(srvPending);
  window.store.services.add(srvRejected);
  window.renderAccountsCostingReport();

  const tbody = document.getElementById('accountsCostingTbody').innerHTML;
  return !tbody.includes('77,777') && !tbody.includes('88,888');
});

// 4. Suite 4
runSuite(4, "Dynamic Category Generation", () => {
  const srvConf = { id: 'test_c_1', targetType: 'doctor', targetId: 'doc_test_1', title: 'World Medical Conference', cost: 20000, status: 'approved', requesterId: 'rep1', lineId: 'line1', areaId: 'area1', date: todayStr };
  window.store.services.add(srvConf);
  window.renderAccountsCostingReport();

  const thead = document.getElementById('accountsCostingThead').innerHTML;
  return thead.includes('Medical Conference');
});

// 5. Suite 5
runSuite(5, "Event Activity Attendees Split", () => {
  window.store.activities.save('rep1', todayStr, 'am', {
    activityType: 'Round Table Discussion',
    title: 'Hypertension Guidelines RTD',
    cost: 20000,
    doctors: ['doc_test_1', 'doc2', 'doc3', 'doc4']
  });
  window.renderAccountsCostingReport();

  const tbody = document.getElementById('accountsCostingTbody').innerHTML;
  return tbody.includes('5,000');
});

// 6. Suite 6
runSuite(6, "Cross-Rep Isolation", () => {
  const secretDoc = { id: 'doc_secret_999', name: 'Dr. Secret Unassigned', lineId: 'line2', areaId: 'area2', repId: 'rep2' };
  window.DEMO_DATA.doctors.push(secretDoc);

  window.checkAuth = () => ({ id: 'rep1', role: 'medical_rep', lineId: 'line1', areaId: 'area1', managerId: 'dm1' });
  window.initAccountsCostingTab();
  document.getElementById('accountsCostingDateFrom').value = '';
  document.getElementById('accountsCostingDateTo').value = '';
  window.renderAccountsCostingReport();

  const tbody = document.getElementById('accountsCostingTbody').innerHTML;
  return !tbody.includes('Dr. Secret Unassigned');
});

// Switch back to Admin
window.checkAuth = () => ({ id: 'admin1', role: 'admin', name: 'Admin' });
window.initAccountsCostingTab();
document.getElementById('accountsCostingDateFrom').value = '';
document.getElementById('accountsCostingDateTo').value = '';

// 7. Suite 7
runSuite(7, "Drill-Down Modal", () => {
  window.renderAccountsCostingReport();
  window.openAccountsCostingBreakdown('doc_test_1');
  const titleEl = document.getElementById('modalCostingAccountName');
  return titleEl !== null && titleEl.textContent.includes('Dr. Test Medical VIP');
});

// 8. Suite 8
runSuite(8, "Excel Export", () => {
  return typeof window.exportAccountsCostingToExcel === 'function';
});

// 9. Suite 9
runSuite(9, "Multi-Line Shared Split", () => {
  const srvSharedMulti = {
    id: 'test_srv_multi_split_1',
    targetType: 'doctor',
    targetId: 'doc_test_1',
    targetName: 'Dr. Test Medical VIP',
    title: 'Joint Cardiovascular Symposium',
    cost: 50000,
    date: todayStr,
    status: 'approved',
    isShared: true,
    shares: [
      { lineId: 'line1', areaId: 'area1', repId: 'rep1', sharePercent: 60, shareAmount: 30000, status: 'approved' },
      { lineId: 'line2', areaId: 'area2', repId: 'rep2', sharePercent: 40, shareAmount: 20000, status: 'approved' }
    ]
  };
  window.store.services.add(srvSharedMulti);

  // Rep 1 view
  window.checkAuth = () => ({ id: 'rep1', role: 'medical_rep', lineId: 'line1', lineIds: ['line1'], areaId: 'area1', areaIds: ['area1'], managerId: 'dm1' });
  window.initAccountsCostingTab();
  document.getElementById('accountsCostingDateFrom').value = '';
  document.getElementById('accountsCostingDateTo').value = '';
  window.renderAccountsCostingReport();
  const rowR1 = window.CostingState.currentRows.find(r => r.id === 'doc_test_1');
  const txR1 = rowR1 && rowR1.transactions.find(t => t.serviceId === 'test_srv_multi_split_1');
  const passR1 = Boolean(txR1 && txR1.cost === 30000);

  window.checkAuth = () => ({ id: 'rep2', role: 'medical_rep', lineId: 'line2', lineIds: ['line2'], areaId: 'area2', areaIds: ['area2'], managerId: 'dm2' });
  window.initAccountsCostingTab();
  console.log("Filters after init for rep2:", {
    line: document.getElementById('accountsCostingLineSelect').value,
    rep: document.getElementById('accountsCostingRepSelect').value,
    area: document.getElementById('accountsCostingAreaSelect').value,
    dm: document.getElementById('accountsCostingDmSelect').value
  });
  document.getElementById('accountsCostingDateFrom').value = '';
  document.getElementById('accountsCostingDateTo').value = '';
  window.renderAccountsCostingReport();
  const rowR2 = window.CostingState.currentRows.find(r => r.id === 'doc_test_1');
  const txR2 = rowR2 && rowR2.transactions.find(t => t.serviceId === 'test_srv_multi_split_1');
  const passR2 = Boolean(txR2 && txR2.cost === 20000);

  console.log("Suite 9 debug:", { passR1, passR2, hasRowR1: !!rowR1, hasRowR2: !!rowR2, txR1: txR1 && txR1.cost, txR2: txR2 && txR2.cost, totalRowsR2: window.CostingState.currentRows.length, r2Rows: window.CostingState.currentRows.map(r=>({id:r.id, name:r.doctorName, txCount:r.transactions.length})) });
  return passR1 && passR2;
});

// 10. Suite 10
runSuite(10, "Intra-Line Shared Split", () => {
  const srvIntra = {
    id: 'test_srv_intra_split_1',
    targetType: 'doctor',
    targetId: 'doc_test_1',
    targetName: 'Dr. Test Medical VIP',
    title: 'District Echo Training Workshop',
    cost: 24000,
    date: todayStr,
    status: 'approved',
    isShared: true,
    shares: [
      { lineId: 'line1', areaId: 'area1', repId: 'rep1', sharePercent: 50, shareAmount: 12000, status: 'approved' },
      { lineId: 'line1', areaId: 'area3', repId: 'rep3', sharePercent: 50, shareAmount: 12000, status: 'approved' }
    ]
  };
  window.store.services.add(srvIntra);

  window.checkAuth = () => ({ id: 'rep1', role: 'medical_rep', lineId: 'line1', areaId: 'area1', managerId: 'dm1' });
  window.initAccountsCostingTab();
  document.getElementById('accountsCostingDateFrom').value = '';
  document.getElementById('accountsCostingDateTo').value = '';
  window.renderAccountsCostingReport();

  const row10 = window.CostingState.currentRows.find(r => r.id === 'doc_test_1');
  const tx10 = row10 && row10.transactions.find(t => t.serviceId === 'test_srv_intra_split_1');
  return Boolean(tx10 && tx10.cost === 12000);
});

// 11. Suite 11
runSuite(11, "Partial Share Approval Governance", () => {
  const srvPartial = {
    id: 'test_srv_partial_share_1',
    targetType: 'doctor',
    targetId: 'doc_test_1',
    targetName: 'Dr. Test Medical VIP',
    title: 'Specialized Sample Kits',
    cost: 20000,
    date: todayStr,
    status: 'pending_shared',
    isShared: true,
    shares: [
      { lineId: 'line1', areaId: 'area1', repId: 'rep1', sharePercent: 50, shareAmount: 10000, status: 'approved' },
      { lineId: 'line2', areaId: 'area2', repId: 'rep2', sharePercent: 50, shareAmount: 10000, status: 'pending_dm' }
    ]
  };
  window.store.services.add(srvPartial);

  window.checkAuth = () => ({ id: 'admin1', role: 'admin', name: 'Admin' });
  window.initAccountsCostingTab();
  document.getElementById('accountsCostingDateFrom').value = '';
  document.getElementById('accountsCostingDateTo').value = '';
  window.renderAccountsCostingReport();

  const row11 = window.CostingState.currentRows.find(r => r.id === 'doc_test_1');
  const txs = row11 ? row11.transactions.filter(t => t.serviceId === 'test_srv_partial_share_1') : [];
  return txs.length === 1 && txs[0].cost === 10000;
});

// 12. Suite 12
runSuite(12, "Cumulative Ledger Grand Total Accuracy", () => {
  window.checkAuth = () => ({ id: 'admin1', role: 'admin', name: 'Admin' });
  window.initAccountsCostingTab();
  document.getElementById('accountsCostingDateFrom').value = '';
  document.getElementById('accountsCostingDateTo').value = '';
  window.renderAccountsCostingReport();

  const row12 = window.CostingState.currentRows.find(r => r.id === 'doc_test_1');
  return Boolean(row12 && row12.grandTotal > 0 && row12.transactions.length >= 4);
});
