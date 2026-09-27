const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Minimal DOM Mock
class ElementMock {
  constructor(tagName) {
    this.tagName = tagName ? tagName.toUpperCase() : 'DIV';
    this.children = [];
    this.options = [];
    this.value = '';
    this.textContent = '';
    this.label = '';
    this.className = '';
    this.style = {};
  }
  appendChild(child) {
    this.children.push(child);
    if (child.tagName === 'OPTION') {
      this.options.push(child);
    }
  }
  replaceChildren(...newChildren) {
    this.children = [];
    this.options = [];
    newChildren.forEach((c) => this.appendChild(c));
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

const documentMock = {
  body: {
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    removeChild: () => {}
  },
  createElement: (tag) => new ElementMock(tag),
  getElementById: (id) => elements[id] || (elements[id] = new ElementMock('div')),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

let elements = {};

const DEMO_DATA = {
  users: [
    { id: 'admin1', name: 'System Admin', role: 'admin', lineIds: ['line1', 'line2'] },
    { id: 'lm1', name: 'Dr. Khaled Abdel-Rahman', role: 'line_manager', lineId: 'line1', lineIds: ['line1'] },
    { id: 'dm1', name: 'Karim Nasser', role: 'district_manager', managerId: 'lm1', lineId: 'line1', lineIds: ['line1'] },
    { id: 'rep1', name: 'Ahmed Mostafa', role: 'medical_rep', managerId: 'dm1', lineId: 'line1', lineIds: ['line1'] },
    { id: 'rep2', name: 'Omar Youssef', role: 'medical_rep', managerId: 'dm1', lineId: 'line1', lineIds: ['line1'] },
    { id: 'lm2', name: 'Mona El-Shazly', role: 'line_manager', lineId: 'line2', lineIds: ['line2'] },
    { id: 'dm3', name: 'Rami Samir', role: 'district_manager', managerId: 'lm2', lineId: 'line2', lineIds: ['line2'] },
    { id: 'rep4', name: 'Nourhan Ezz', role: 'medical_rep', managerId: 'dm3', lineId: 'line2', lineIds: ['line2'] }
  ],
  areas: [
    { id: 'area1', name: 'Nasr City', code: 'NC01', lineId: 'line1', repId: 'rep1' },
    { id: 'area2', name: 'Heliopolis', code: 'HEL01', lineId: 'line1', repId: 'rep2' },
    { id: 'area3', name: 'Nasr City - Neuro', code: 'NC02', lineId: 'line2', repId: 'rep4' },
    { id: 'area4', name: 'Maadi', code: 'MD01', lineId: 'line2', repId: null } // Vacant area under line2 (dm3)
  ],
  lines: [
    { id: 'line1', name: 'Cardio Line' },
    { id: 'line2', name: 'Neuro Line' }
  ],
  doctors: [
    { id: 'doc1', name: 'Dr. A', areaId: 'area1', repId: 'rep1' },
    { id: 'doc4', name: 'Dr. D', areaId: 'area4', repId: null }
  ],
  sales: [
    { id: 'sale1', areaId: 'area1', dmId: 'dm1' }
  ]
};

console.log('--- Testing shared-report.js ---');
{
  elements = {};
  const selectIds = [
    'pharmSalesRepSelect', 'achRepSelect', 'timelineRepSelect',
    'coverageRepSelect', 'doctorRepSelect', 'hospitalRepSelect'
  ];
  selectIds.forEach(id => { elements[id] = new ElementMock('select'); });

  const context = {
    window: {
      DEMO_DATA,
      store: {
        areas: { getAll: () => DEMO_DATA.areas },
        users: { getAll: () => DEMO_DATA.users },
        distributorSales: { getAll: () => DEMO_DATA.sales }
      },
      getCurrentLang: () => 'ar',
      escapeHtml: (s) => s,
      getUserLines: (uid) => DEMO_DATA.lines,
      normalizeRole: (r) => r,
      location: { search: '' }
    },
    document: documentMock,
    console: console,
    currentUser: DEMO_DATA.users[0], // admin
    currentUserRole: 'admin',
    isManager: true,
    initPage: () => {},
    checkAuth: () => DEMO_DATA.users[0],
    getCurrentLang: () => 'ar',
    translations: { ar: {}, en: {} },
    URLSearchParams: URLSearchParams
  };
  context.window.currentUser = context.currentUser;
  context.window.currentUserRole = context.currentUserRole;

  const code = fs.readFileSync('js/shared-report.js', 'utf8');
  vm.createContext(context);
  vm.runInContext(code, context);

  // Test getAreaManagerId
  const mgrArea4 = context.window.getAreaManagerId(DEMO_DATA.areas[3], DEMO_DATA.users);
  assert.strictEqual(mgrArea4, 'dm3', 'area4 (Maadi) should map to dm3');
  console.log('PASS: getAreaManagerId correctly identified manager dm3 for area4');

  // Test admin population
  context.populateUnifiedReportEmployeeFilters(context.currentUser, 'all');
  const sel = elements['pharmSalesRepSelect'];
  
  // Find group for Rami Samir (dm3)
  const dm3Group = sel.children.find(c => c.tagName === 'OPTGROUP' && c.label.includes('Rami Samir'));
  assert(dm3Group, 'Should have an optgroup for Team Rami Samir');
  
  const vacantInDm3Group = dm3Group.children.find(c => c.value === 'vacant:area4');
  assert(vacantInDm3Group, 'Vacant area4 (Maadi) must be inside Team Rami Samir optgroup');
  console.log('PASS: shared-report.js placed vacant area under its respective DM optgroup for Admin');

  // Test DM1 population (Karim Nasser - line1)
  const dm1User = DEMO_DATA.users[2];
  context.currentUser = dm1User;
  context.currentUserRole = 'district_manager';
  context.populateUnifiedReportEmployeeFilters(dm1User, 'line1');
  const selDm1 = elements['pharmSalesRepSelect'];
  const hasArea4InDm1 = selDm1.children.some(c => c.value === 'vacant:area4');
  assert(!hasArea4InDm1, 'DM1 should NOT see area4 (belongs to line2/dm3)');
  console.log('PASS: shared-report.js scoped vacant areas away from unrelated DM');

  // Test DM3 population (Rami Samir - line2)
  const dm3User = DEMO_DATA.users[6];
  context.currentUser = dm3User;
  context.currentUserRole = 'district_manager';
  context.populateUnifiedReportEmployeeFilters(dm3User, 'line2');
  const selDm3 = elements['pharmSalesRepSelect'];
  const hasArea4InDm3 = selDm3.children.some(c => c.value === 'vacant:area4');
  assert(hasArea4InDm3, 'DM3 MUST see vacant area4');
  console.log('PASS: shared-report.js showed vacant area4 directly to DM3');
}

console.log('--- Testing visits.js ---');
{
  elements = {};
  elements['filterRep'] = new ElementMock('select');
  elements['filterLine'] = new ElementMock('select');
  elements['modalTargetFilterSelect'] = new ElementMock('select');
  elements['modalTargetFilterLabel'] = new ElementMock('label');
  elements['modalTargetFilterContainer'] = new ElementMock('div');

  let currentActiveUser = DEMO_DATA.users[0];

  const context = {
    window: {
      DEMO_DATA,
      store: {
        areas: { getAll: () => DEMO_DATA.areas, getByRep: () => [] },
        users: { getAll: () => DEMO_DATA.users },
        distributorSales: { getAll: () => DEMO_DATA.sales }
      },
      getCurrentLang: () => 'ar',
      escapeHtml: (s) => s,
      getUserLines: (uid) => DEMO_DATA.lines,
      normalizeRole: (r) => r,
      addEventListener: () => {},
      checkAuth: () => currentActiveUser,
      requireAuth: () => currentActiveUser
    },
    document: documentMock,
    console: console,
    currentUser: DEMO_DATA.users[0], // admin
    currentUserRole: 'admin',
    isManager: true,
    translations: {},
    demoVisits: []
  };
  context.window.currentUser = context.currentUser;
  context.window.currentUserRole = context.currentUserRole;

  const code = fs.readFileSync('js/visits.js', 'utf8');
  vm.createContext(context);
  vm.runInContext(code, context);

  // Test populateManagerRepDropdown for Admin
  context.populateManagerRepDropdown('all');
  const filterRep = elements['filterRep'];
  const dm3Group = filterRep.children.find(c => c.tagName === 'OPTGROUP' && c.label.includes('Rami Samir'));
  assert(dm3Group, 'visits.js filterRep should have an optgroup for Team Rami Samir');
  const vacantInDm3Group = dm3Group.children.find(c => c.value === 'vacant:area4');
  assert(vacantInDm3Group, 'visits.js filterRep must have vacant:area4 under Team Rami Samir');
  console.log('PASS: visits.js populateManagerRepDropdown placed vacant area under DM3 optgroup for Admin');

  // Test setupModalTargetFilter for Admin
  context.setupModalTargetFilter();
  const modalTarget = elements['modalTargetFilterSelect'];
  const dmGrp = modalTarget.children.find(c => c.tagName === 'OPTGROUP' && c.label.includes('District Managers'));
  assert(dmGrp, 'Admin modalTargetFilterSelect should have District Managers optgroup');
  const optDm3Vacant = dmGrp.children.find(c => c.value === 'vacant:area4');
  assert(optDm3Vacant, 'Modal target filter for Admin must include vacant area4 under DM group');
  assert(optDm3Vacant.textContent.includes('↳'), 'Vacant area under DM in modal target filter must be indented with ↳');
  console.log('PASS: visits.js setupModalTargetFilter nested vacant area under DM for Admin');

  // Test setupModalTargetFilter for Line Manager (lm2) in a fresh context
  {
    elements['modalTargetFilterSelect'] = new ElementMock('select');
    const lm2User = DEMO_DATA.users[5];
    const lmContext = {
      window: {
        DEMO_DATA,
        store: {
          areas: { getAll: () => DEMO_DATA.areas, getByRep: () => [] },
          users: { getAll: () => DEMO_DATA.users },
          distributorSales: { getAll: () => DEMO_DATA.sales }
        },
        getCurrentLang: () => 'ar',
        escapeHtml: (s) => s,
        getUserLines: (uid) => [{ id: 'line2', name: 'Neuro Line' }],
        normalizeRole: (r) => r,
        addEventListener: () => {},
        checkAuth: () => lm2User,
        requireAuth: () => lm2User
      },
      document: documentMock,
      console: console,
      translations: {},
      demoVisits: []
    };
    vm.createContext(lmContext);
    vm.runInContext(code, lmContext);
    lmContext.setupModalTargetFilter();
    const lmModalTarget = elements['modalTargetFilterSelect'];
    const optLmDm3Vacant = lmModalTarget.children.find(c => c.value === 'vacant:area4');
    assert(optLmDm3Vacant, 'Modal target filter for LM2 must include vacant area4');
    assert(optLmDm3Vacant.textContent.includes('↳'), 'Vacant area under DM in modal target filter must be indented with ↳');
    console.log('PASS: visits.js setupModalTargetFilter nested vacant area under DM for Line Manager');
  }
}

console.log('ALL VACANT AREAS STRUCTURAL TESTS PASSED!');
