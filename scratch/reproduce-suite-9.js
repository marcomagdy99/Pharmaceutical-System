// Mock browser environment
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
global.window.addEventListener = () => {};
global.document = {
  getElementById: (id) => elements[id] || null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};

// Load app.js first, as in browser
require("../js/app.js");
require("../js/store.js");
require("../js/accounts-costing-report.js");

console.log("rep2 in DEMO_DATA before setup:", window.DEMO_DATA.users.find(u => u.id === 'rep2'));

// Now run setupTestFixtures as written currently in costing-test-suite.html
const todayStr = new Date().toISOString().split('T')[0];

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

console.log("rep2 after setup:", window.DEMO_DATA.users.find(u => u.id === 'rep2'));
console.log("getUserLines('rep2'):", window.getUserLines('rep2'));

// Now run Suite 9
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

// Rep 1
window.checkAuth = () => ({ id: 'rep1', role: 'medical_rep', lineId: 'line1', lineIds: ['line1'], areaId: 'area1', areaIds: ['area1'], managerId: 'dm1' });
window.initAccountsCostingTab();
document.getElementById('accountsCostingDateFrom').value = '';
document.getElementById('accountsCostingDateTo').value = '';
window.renderAccountsCostingReport();
const rowR1 = (window.CostingState && window.CostingState.currentRows.find(r => r.id === 'doc_test_1'));
const txR1 = rowR1 && rowR1.transactions.find(t => t.serviceId === 'test_srv_multi_split_1');
const passR1 = Boolean(txR1 && txR1.cost === 30000);

// Rep 2
window.checkAuth = () => ({ id: 'rep2', role: 'medical_rep', lineId: 'line2', lineIds: ['line2'], areaId: 'area2', areaIds: ['area2'], managerId: 'dm2' });
window.initAccountsCostingTab();
console.log("Rep 2 line select value:", document.getElementById('accountsCostingLineSelect').value);
console.log("Rep 2 area select value:", document.getElementById('accountsCostingAreaSelect').value);
document.getElementById('accountsCostingDateFrom').value = '';
document.getElementById('accountsCostingDateTo').value = '';
window.renderAccountsCostingReport();
const rowR2 = (window.CostingState && window.CostingState.currentRows.find(r => r.id === 'doc_test_1'));
const txR2 = rowR2 && rowR2.transactions.find(t => t.serviceId === 'test_srv_multi_split_1');
const passR2 = Boolean(txR2 && txR2.cost === 20000);

console.log("Suite 9 result:", { passR1, passR2, txR1: txR1?.cost, txR2: txR2?.cost, rowR2: !!rowR2 });
