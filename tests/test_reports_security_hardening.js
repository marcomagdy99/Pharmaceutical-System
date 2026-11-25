const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function createMockElement(id = '', tag = 'DIV') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    checked: false,
    selected: false,
    style: { display: '' },
    dataset: {},
    options: [],
    children: [],
    _listeners: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        } else if (force) {
          this._set.add(c);
        } else {
          this._set.delete(c);
        }
      },
      contains(c) { return this._set.has(c); }
    },
    replaceChildren() {
      this.children = [];
      this.options = [];
      this.value = '';
    },
    appendChild(child) {
      this.children.push(child);
      if (child && child.tagName === 'OPTION') {
        this.options.push(child);
        if (this.options.length === 1 && !this.value) {
          this.value = child.value;
        }
      } else if (child && child.tagName === 'OPTGROUP' && Array.isArray(child.children)) {
        child.children.forEach((c) => {
          if (c && c.tagName === 'OPTION') {
            this.options.push(c);
            if (this.options.length === 1 && !this.value) {
              this.value = c.value;
            }
          }
        });
      }
      return child;
    },
    addEventListener(evt, fn) {
      if (!this._listeners[evt]) this._listeners[evt] = [];
      this._listeners[evt].push(fn);
    },
    dispatchEvent(evt) {
      const list = this._listeners[evt.type] || [];
      list.forEach((fn) => fn(evt));
    },
    click() {},
    remove() {}
  };
  return el;
}

function buildSandbox() {
  const elements = {};
  let currentAuthUser = null;
  let lastCsvText = '';
  let revokedUrls = [];
  let activeTabBtn = null;

  const users = [
    { id: 'admin1', name: 'Admin User', role: 'admin', status: 'Active' },
    { id: 'gm1', name: 'GM User', role: 'general_manager', status: 'Active' },
    { id: 'lm1', name: 'LM One', role: 'line_manager', managerId: 'gm1', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'dm1', name: 'DM One', role: 'district_manager', managerId: 'lm1', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'dm_noline', name: 'DM NoLine', role: 'district_manager', managerId: 'lm1', lineIds: [], status: 'Active' },
    { id: 'pm1', name: 'PM One', role: 'product_manager', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'rep1', name: 'Ali Rep', role: 'medical_rep', managerId: 'dm1', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'rep_direct', name: 'Direct Rep', role: 'medical_rep', managerId: 'lm1', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'rep2', name: 'Line2 Rep', role: 'medical_rep', managerId: 'dm2', lineId: 'l2', lineIds: ['l2'], status: 'Active' },
    { id: 'dm2', name: 'DM Two', role: 'district_manager', managerId: 'lm2', lineId: 'l2', lineIds: ['l2'], status: 'Active' },
    { id: 'lm2', name: 'LM Two', role: 'line_manager', lineId: 'l2', lineIds: ['l2'], status: 'Active' }
  ];

  const productLines = [
    { id: 'l1', name: 'Cardio Line', lineManagerId: 'lm1', products: [{ id: 'p1', name: 'Atorva', dosage: '20mg', price: 50 }] },
    { id: 'l2', name: 'Neuro Line', lineManagerId: 'lm2', products: [{ id: 'p2', name: 'Neurox', dosage: '10mg', price: 80 }] }
  ];

  const areas = [
    { id: 'a1', name: 'Nasr City', lineId: 'l1', repId: 'rep1' },
    { id: 'a2', name: 'Maadi', lineId: 'l2', repId: 'rep2' },
    { id: 'a_vac2', name: 'Giza Vacant', lineId: 'l2', repId: null, dmId: 'dm2' }
  ];

  const targets = [];
  const savedDoctors = [];
  const savedPharmacies = [];
  const hospitalsList = [{ id: 'hosp1', name: 'Cairo Hosp', address: '', repId: 'rep1' }];
  let genIdCounter = 0;
  const distributorSales = [
    { id: 'ds1', distributorId: 'd1', month: '2026-11', productId: 'p1', product: '=CMD|calc!A0', value: 1000, quantity: 20, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'l1', areaId: 'a1' },
    { id: 'ds2', distributorId: 'd1', month: '2026-11', productId: 'p1', product: 'Atorva 20mg', value: 500, quantity: 10, repId: 'rep_direct', lmId: 'lm1', lineId: 'l1', areaId: null },
    { id: 'ds3', distributorId: 'd1', month: '2026-11', productId: 'p2', product: 'Neurox 10mg', value: 2000, quantity: 25, repId: 'rep2', dmId: 'dm2', lmId: 'lm2', lineId: 'l2', areaId: 'a2' }
  ];

  const leaves = [
    { id: 'lv1', userId: 'rep1', startDate: '2026-11-02', endDate: '2026-11-02', status: 'approved', dayDuration: 'half' },
    { id: 'lv2', userId: 'rep1', startDate: '2026-11-03', endDate: '2026-11-03', status: 'approved', type: 'half_day' },
    { id: 'lv3', userId: 'rep1', startDate: '2026-11-04', endDate: '2026-11-04', status: 'approved', days: 0.5 }
  ];

  const visits = [
    { id: 'v1', repId: 'rep1', date: '2026-11-01', status: 'completed', isActual: true },
    { id: 'v2', repId: 'rep1', date: '2026-11-05', status: 'planned' },
    { id: 'v3', repId: 'rep1', date: '2026-11-06', status: 'pending_approval' },
    { id: 'v4', repId: 'other_id', repName: 'Ali Rep', date: '2026-11-07', status: 'completed', isActual: true }
  ];

  const getEl = (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    URLSearchParams,
    Blob: function (parts) { lastCsvText = parts.join(''); this.parts = parts; },
    URL: {
      createObjectURL: () => 'blob:mock-url',
      revokeObjectURL: (u) => { revokedUrls.push(u); }
    },
    FileReader: function () {
      this.readAsText = (file) => {
        if (this.onload) this.onload({ target: { result: file._text } });
      };
    },
    DEMO_DATA: {
      users,
      productLines,
      areas,
      targets,
      distributorSales,
      leaves,
      visits,
      companySettings: { secondaryWeekendDay: 'saturday', secondaryWeekendMode: 'full_day', defaultDailyVisitsTarget: 8 },
      publicHolidays: []
    },
    document: {
      readyState: 'complete',
      body: createMockElement('body', 'BODY'),
      getElementById: getEl,
      createElement: (tag) => createMockElement('', tag),
      querySelector: (sel) => (sel === '.report-tab-btn.active' ? activeTabBtn : null),
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    window: null,
    localStorage: { getItem: () => null, setItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    navigator: { userAgent: 'node' },
    location: { search: '', replace: () => {} },
    checkAuth: () => currentAuthUser,
    initPage: () => {},
    getCurrentLang: () => 'en',
    showToast: () => {},
    escapeHtml: (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    normalizeRole: (r) => {
      const v = String(r || '').toLowerCase().trim();
      if (v === 'gm') return 'general_manager';
      if (v === 'pm') return 'product_manager';
      if (v === 'dm') return 'district_manager';
      if (v === 'lm') return 'line_manager';
      if (v === 'bu') return 'business_unit';
      if (v === 'rep') return 'medical_rep';
      return v;
    },
    isAdmin: (u) => sandbox.normalizeRole(u && u.role) === 'admin',
    isRepRole: (u) => sandbox.normalizeRole(u && u.role) === 'medical_rep',
    isPMRole: (u) => sandbox.normalizeRole(u && u.role) === 'product_manager',
    getUserLines: (uid) => {
      const u = users.find((x) => x.id === uid);
      if (!u) return [];
      const r = sandbox.normalizeRole(u.role);
      if (r === 'admin' || r === 'hr') return productLines;
      const ids = new Set(u.lineIds || (u.lineId ? [u.lineId] : []));
      if (r === 'business_unit' || r === 'general_manager') {
        sandbox.getAllSubordinates(uid).forEach((s) => (s.lineIds || (s.lineId ? [s.lineId] : [])).forEach((lid) => ids.add(lid)));
      }
      return productLines.filter((l) => ids.has(l.id) || l.lineManagerId === uid);
    },
    getAllSubordinates: (mgrId, seen = new Set()) => {
      seen.add(mgrId);
      const direct = users.filter((u) => u.managerId === mgrId && !seen.has(u.id));
      let out = [...direct];
      direct.forEach((d) => { out = out.concat(sandbox.getAllSubordinates(d.id, seen)); });
      return out;
    },
    getAreaManagerId: (a) => a.dmId || null,
    getSystemDate: () => new Date('2026-11-15T10:00:00Z'),
    genId: (prefix) => `${prefix}gen_${++genIdCounter}`,
    store: {
      users: { getAll: () => users },
      productLines: { getAll: () => productLines },
      specialties: { getAll: () => [{ id: 'spec_cardio', name: 'Cardiology', aliases: [] }] },
      doctors: { getAll: () => savedDoctors, save: (d) => savedDoctors.push(d) },
      pharmacies: { getAll: () => savedPharmacies, save: (p) => savedPharmacies.push(p) },
      hospitals: { getAll: () => hospitalsList },
      areas: {
        getAll: () => areas,
        getById: (id) => areas.find((a) => a.id === id) || null,
        getByRep: (rid) => areas.filter((a) => a.repId === rid)
      },
      distributors: { getAll: () => [{ id: 'd1', name: 'Dist 1' }], getById: () => ({ id: 'd1', name: 'Dist 1' }) },
      distributorSales: { getAll: () => distributorSales },
      leaves: { getAll: () => leaves },
      visits: { getAll: () => visits },
      companySettings: { get: () => sandbox.DEMO_DATA.companySettings },
      publicHolidays: { getAll: () => [] },
      targets: {
        getAll: () => targets,
        getById: (id) => targets.find((t) => t.id === id) || null,
        find: (areaId, prodId, month) => targets.find((t) => t.areaId === areaId && t.productId === prodId && t.month === month) || null,
        save: (obj) => {
          const idx = obj.id ? targets.findIndex((t) => t.id === obj.id) : -1;
          const item = { ...obj, id: obj.id || ('t_' + (targets.length + 1)) };
          if (idx >= 0) targets[idx] = item;
          else targets.push(item);
          return item;
        },
        delete: (id) => {
          const idx = targets.findIndex((t) => t.id === id);
          if (idx >= 0) targets.splice(idx, 1);
        }
      }
    }
  };
  sandbox.window = sandbox;

  const ctx = vm.createContext(sandbox);
  ['js/shared-report.js', 'js/sales-report.js', 'js/sops-report.js'].forEach((rel) => {
    const code = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  });

  return {
    ctx,
    elements,
    getEl,
    setUser: (u) => { currentAuthUser = u; },
    setActiveTab: (tab) => { activeTabBtn = { dataset: { tab } }; },
    getLastCsv: () => lastCsvText,
    getRevokedUrls: () => revokedUrls
  };
}

console.log('=== Reports Security & Logic Hardening Tests ===');
const env = buildSandbox();
const { ctx, elements, getEl, setUser, setActiveTab } = env;

// 1. Fail-Closed when unauthenticated (null)
setUser(null);
ctx.populateReportLineFilter(null);
assert.strictEqual(getEl('reportLineFilter').disabled, true, 'Unauthenticated reportLineFilter must be disabled');
assert.strictEqual(ctx.selectedReportLineId, '', 'Unauthenticated selectedReportLineId must be empty');

const unauthScope = ctx.getReportHierarchyFilterScope('sops');
assert.strictEqual(unauthScope.allowedReps.length, 0, 'Unauthenticated scope must return 0 reps (no admin fallback)');
assert.strictEqual(ctx.getFilteredPharmSalesRows().length, 0, 'Unauthenticated sales rows must be empty');
assert.strictEqual(ctx.buildSopsData(2026, ['11']).repRows.length, 0, 'Unauthenticated SOPs build must return 0 rows');

// 2. Non-admin with 0 assigned lines must NOT get allLines (Fail-Closed)
const dmNoLine = ctx.DEMO_DATA.users.find((u) => u.id === 'dm_noline');
setUser(dmNoLine);
ctx.populateReportLineFilter(dmNoLine);
assert.strictEqual(ctx.selectedReportLineId, '', 'User with 0 assigned lines must not get allLines');

// 3. general_manager gets strictly subordinate line & rep access (no cross-team l2/rep2 leak)
const gmUser = ctx.DEMO_DATA.users.find((u) => u.id === 'gm1');
setUser(gmUser);
ctx.populateReportLineFilter(gmUser);
assert(getEl('reportLineFilter').options.some((o) => o.value === 'l1'), 'GM must see subordinate line l1');
assert(!getEl('reportLineFilter').options.some((o) => o.value === 'l2'), 'GM must NOT see unrelated line l2');
const gmScope = ctx.getReportHierarchyFilterScope('sops');
assert(gmScope.allowedReps.some((r) => r.id === 'rep1'), 'GM must see subordinate rep1');
assert(!gmScope.allowedReps.some((r) => r.id === 'rep2'), 'GM must NOT see unrelated rep2');

// 4. product_manager restricted to own line, and sales bypass via selectedLine fails closed
const pmUser = ctx.DEMO_DATA.users.find((u) => u.id === 'pm1');
setUser(pmUser);
ctx.initAllFilters(pmUser);
ctx.selectedReportLineId = 'l2'; // Attempted bypass to Line 2
ctx.updatePharmSalesProductsForLine('l2');
getEl('pharmSalesProductSelect').value = 'all';
getEl('pharmSalesDistributorSelect').value = 'all';
getEl('pharmSalesAreaSelect').value = 'all';
getEl('pharmSalesTypeSelect').value = 'all';
const novCb = { value: '11', checked: true };
const origQsa = ctx.document.querySelectorAll;
ctx.document.querySelectorAll = (sel) => (sel.includes('.pharm-sales-month-checkbox:checked') ? [novCb] : []);
getEl('pharmSalesYearSelect').value = '2026';
assert.strictEqual(ctx.getFilteredPharmSalesRows().length, 0, 'PM on l1 selecting l2 must return 0 rows (no allowedLineIds bypass)');

ctx.selectedReportLineId = 'l1';
ctx.initAllFilters(pmUser);
ctx.updatePharmSalesProductsForLine('l1');
getEl('pharmSalesProductSelect').value = 'all';
getEl('pharmSalesDistributorSelect').value = 'all';
getEl('pharmSalesAreaSelect').value = 'all';
getEl('pharmSalesTypeSelect').value = 'all';
const pmRowsL1 = ctx.getFilteredPharmSalesRows();
assert.strictEqual(pmRowsL1.length, 2, 'PM on l1 sees l1 rows only');
assert(pmRowsL1.every((r) => r.lineId === 'l1'), 'PM sales rows must all belong to l1');

// 5. Unknown role fails closed in both getReportHierarchyFilterScope & getFilteredPharmSalesRows
setUser({ id: 'guest1', role: 'guest_unknown', status: 'Active' });
assert.strictEqual(ctx.getReportHierarchyFilterScope('sops').allowedReps.length, 0, 'Unknown role fails closed in hierarchy scope');
assert.strictEqual(ctx.getFilteredPharmSalesRows().length, 0, 'Unknown role fails closed in sales rows');

// 6. Line Manager sees direct rep (managerId === lm1) AND DM-team rep
const lmUser = ctx.DEMO_DATA.users.find((u) => u.id === 'lm1');
setUser(lmUser);
ctx.selectedReportLineId = 'all';
ctx.initAllFilters(lmUser);
const lmScope = ctx.getReportHierarchyFilterScope('sops');
const lmRepIds = lmScope.allowedReps.map((r) => r.id);
assert(lmRepIds.includes('rep1'), 'LM scope includes rep under DM');
assert(lmRepIds.includes('rep_direct'), 'LM scope includes rep reporting directly to LM');
assert(!lmRepIds.includes('rep2'), 'LM scope excludes rep from another line');

const lmSales = ctx.getFilteredPharmSalesRows();
assert.strictEqual(lmSales.length, 2, 'LM sales includes direct rep ds2 and DM rep ds1');

// 7. refreshActiveReportIfVisible supports sops tab
let sopsRendered = false;
const origRenderSops = ctx.renderSopsReport;
ctx.renderSopsReport = () => { sopsRendered = true; };
setActiveTab('sops');
getEl('sopsResultsContainer').style.display = 'block';
ctx.refreshActiveReportIfVisible();
assert.strictEqual(sopsRendered, true, 'refreshActiveReportIfVisible must re-render sops when active & visible');
ctx.renderSopsReport = origRenderSops;

// 8. Arabic CSV import headers preserved & unmatched rep -> null (not u1790626000001)
setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'admin1'));
getEl('importDoctorsRepSelect').value = '';
ctx.handleDoctorsFileSelected({
  target: {
    files: [{
      name: 'docs.csv',
      _text: 'اسم الطبيب,التخصص,الفئة,العنوان,الهاتف,المندوب\nد. محمد أحمد,Cardiology,A,مدينة نصر,0100000000,UnmatchedCode\n'
    }]
  }
});
const docPreviewHtml = getEl('doctorsPreviewTableBody').innerHTML;
assert(docPreviewHtml.includes('د. محمد أحمد'), 'Arabic CSV headers must parse doctor name');
assert(docPreviewHtml.includes('Unassigned'), 'Unmatched rep should display Unassigned');
assert(!docPreviewHtml.includes('u1790626000001'), 'Must not fall back to u1790626000001');

// 9. SOPs Report: productLines fixed, half-day leaves, executed visits only, no name collision
setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'rep1'));
const sopsData = ctx.buildSopsData(2026, ['11']);
assert.strictEqual(sopsData.repRows.length, 1, 'Rep sees self in SOPs');
const r1 = sopsData.repRows[0];
assert.strictEqual(r1.lineName, 'Cardio Line', 'SOPs must resolve productLines (not store.lines)');
assert.strictEqual(r1.vacations, 1.5, 'SOPs must sum half-day leaves across dayDuration/type/days=0.5 (0.5*3 = 1.5)');
assert.strictEqual(r1.actualVisits, 1, 'SOPs must count only completed/actual visits matching repId (not planned/pending/repName)');

// 10. SOPs render: no duplicate workingDays & no inline onclick
getEl('sopsYearSelect').value = '2026';
ctx.document.querySelectorAll = (sel) => (sel.includes('.sops-month-checkbox:checked') ? [{ value: '11', checked: true }] : []);
ctx.renderSopsReport();
const sopsRows = getEl('sopsReportTableBody').children;
assert.strictEqual(sopsRows.length, 1);
assert(!sopsRows[0].innerHTML.includes(`(${r1.workingDays})`), 'Working days should not print duplicate same value in parens');
assert(!sopsRows[0].innerHTML.includes('onclick='), 'SOPs table must not use inline onclick');
assert(sopsRows[0].innerHTML.includes('data-action="view-sops-visits"'), 'SOPs table uses data-action delegation');

// 11. Targets modal: Admin only, duplicate prevention, cross-line editTarget
setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'bu_not_admin') || { id: 'bu1', role: 'business_unit' });
ctx.openTargetsModal();
assert.strictEqual(getEl('targetsModal').style.display, '', 'Non-admin must be denied openTargetsModal');

setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'admin1'));
ctx.openTargetsModal();
getEl('targetEditId').value = '';
getEl('targetAreaSelect').value = 'a1';
getEl('targetProductSelect').value = 'p1';
getEl('targetMonthSelect').value = '11';
getEl('targetYearSelect').value = '2026';
getEl('targetUnitsInput').value = '100';
getEl('targetUnitPriceInput').value = '50';
getEl('targetComputedValueDisplay').value = '5000';
ctx.saveTarget();
assert.strictEqual(ctx.store.targets.getAll().length, 1, 'First target saved');
// Attempt duplicate add without editId
ctx.saveTarget();
assert.strictEqual(ctx.store.targets.getAll().length, 1, 'Duplicate target for same area+product+month must be rejected');

// Verify targets table uses delegated data-action instead of inline onclick
const tRowHtml = getEl('targetsTableBody').children[0].innerHTML;
assert(!tRowHtml.includes('onclick='), 'Targets table must not use inline onclick');
assert(tRowHtml.includes('data-action="edit-target"'), 'Targets table uses data-action="edit-target"');

// Cross-line editTarget resets line filter to 'all' so targetProductSelect receives value
getEl('targetLineFilterSelect').value = 'l2';
ctx.editTarget(ctx.store.targets.getAll()[0].id);
assert.strictEqual(getEl('targetLineFilterSelect').value, 'all', 'editTarget must reset mismatched line filter');
assert.strictEqual(getEl('targetProductSelect').value, 'p1', 'editTarget must preserve target productId');

// Verify SOPs drill-down calls renderDailyTimeline
let dailyTimelineCalled = false;
ctx.renderDailyTimeline = () => { dailyTimelineCalled = true; };
ctx.viewSopsRepVisits('rep1');
assert.strictEqual(dailyTimelineCalled, true, 'viewSopsRepVisits must call renderDailyTimeline');

// 13. Non-admin handleExcelUpload blocked + clears file input
setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'rep1'));
const fakeEvent = { target: { files: [{ name: 'evil.xlsx' }], value: 'C:\\evil.xlsx' } };
ctx.handleExcelUpload(fakeEvent);
assert.strictEqual(fakeEvent.target.value, '', 'Unauthorized handleExcelUpload must clear input and abort');

// 14. saveTarget duplicate check also blocks edits colliding with another existing target
setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'admin1'));
getEl('targetEditId').value = '';
getEl('targetAreaSelect').value = 'a1';
getEl('targetProductSelect').value = 'p1';
getEl('targetMonthSelect').value = '12';
getEl('targetYearSelect').value = '2026';
getEl('targetUnitsInput').value = '200';
getEl('targetUnitPriceInput').value = '50';
getEl('targetComputedValueDisplay').value = '10000';
ctx.saveTarget();
assert.strictEqual(ctx.store.targets.getAll().length, 2, 'Second target (month 12) saved');
const secondTargetId = ctx.store.targets.getAll()[1].id;
getEl('targetEditId').value = secondTargetId;
getEl('targetMonthSelect').value = '11'; // tries to collide with t_1
ctx.saveTarget();
assert.strictEqual(ctx.store.targets.getById(secondTargetId).month, '2026-12', 'Editing target into duplicate slot must be rejected');

// 15. confirmImportDoctors / confirmImportPharmacies derive dmId, lmId & use window.genId
getEl('importDoctorsRepSelect').value = '';
ctx.handleDoctorsFileSelected({
  target: {
    files: [{
      name: 'docs_hierarchy.csv',
      _text: 'اسم الطبيب,التخصص,الفئة,العنوان,الهاتف,المندوب\nد. سارة,Cardiology,A,مدينة نصر,0100000001,rep1\n'
    }]
  }
});
ctx.confirmImportDoctors();
const importedDoc = ctx.store.doctors.getAll()[0];
assert(importedDoc.id.startsWith('doc_gen_'), 'confirmImportDoctors must use window.genId');
assert.strictEqual(importedDoc.dmId, 'dm1', 'confirmImportDoctors must resolve dmId');
assert.strictEqual(importedDoc.lmId, 'lm1', 'confirmImportDoctors must resolve lmId');

getEl('importPharmaciesRepSelect').value = '';
ctx.handlePharmaciesFileSelected({
  target: {
    files: [{
      name: 'pharms_hierarchy.csv',
      _text: 'اسم الصيدلية,العنوان,المسؤول,الهاتف,المندوب\nصيدلية الشفاء,مدينة نصر,أحمد,0100000002,rep1\n'
    }]
  }
});
ctx.confirmImportPharmacies();
const importedPharm = ctx.store.pharmacies.getAll()[0];
assert(importedPharm.id.startsWith('pharm_gen_'), 'confirmImportPharmacies must use window.genId');
assert.strictEqual(importedPharm.dmId, 'dm1', 'confirmImportPharmacies must resolve dmId');
assert.strictEqual(importedPharm.lmId, 'lm1', 'confirmImportPharmacies must resolve lmId');

// 16. syncReportsData uses store.hospitals and no 'Nasr City' fallback
ctx.syncReportsData();
const reportsDataObj = vm.runInContext('REPORTS_DATA', ctx);
const syncedHosp = reportsDataObj.doctors.find((d) => d.id === 'hosp1');
assert(syncedHosp, 'syncReportsData must read from store.hospitals');
assert.strictEqual(syncedHosp.area, '', 'syncReportsData must not hardcode Nasr City fallback');

// 17. SOPs weekend default aligns to 'none' (Friday only) & fallback lineName is 'Unassigned'
ctx.DEMO_DATA.companySettings = { defaultDailyVisitsTarget: 8 };
const calDefault = ctx.computeMonthWorkingDays(2026, 11);
assert.strictEqual(calDefault.secDay, 'none', 'computeMonthWorkingDays must default secondaryWeekendDay to none');
assert.strictEqual(calDefault.statutoryWorkingDays, 26, 'Nov 2026 Friday-only has 26 statutory working days');

setUser({ id: 'rep_noline', name: 'NoLine Rep', role: 'medical_rep', status: 'Active' });
const noLineSops = ctx.buildSopsData(2026, ['11']);
assert.strictEqual(noLineSops.repRows[0].lineName, 'Unassigned', 'SOPs missing line fallback must be Unassigned');

// 18. Export CSV formula injection neutralization (Sales + SOPs fallback)
setUser(ctx.DEMO_DATA.users.find((u) => u.id === 'admin1'));
ctx.selectedReportLineId = 'all';
getEl('pharmSalesProductSelect').value = 'all';
getEl('pharmSalesDistributorSelect').value = 'all';
getEl('pharmSalesAreaSelect').value = 'all';
getEl('pharmSalesTypeSelect').value = 'all';
getEl('pharmSalesYearSelect').value = '2026';
ctx.document.querySelectorAll = (sel) => (sel.includes('.pharm-sales-month-checkbox:checked') ? [{ value: '11', checked: true }] : []);
ctx.exportSalesReport();
assert(env.getLastCsv().includes(`"'=CMD|calc!A0"`), 'exportSalesReport CSV fallback must neutralize formula trigger =');

setUser({ id: 'rep_formula', name: '=HYPERLINK("http://evil","x")', role: 'medical_rep', status: 'Active' });
ctx.document.querySelectorAll = (sel) => (sel.includes('.sops-month-checkbox:checked') ? [{ value: '11', checked: true }] : []);
ctx.renderSopsReport();
ctx.exportSopsReport();
assert(env.getLastCsv().includes(`"'=HYPERLINK`), 'exportSopsReport CSV fallback must neutralize formula trigger =');

// Verify exports & cleanup
ctx.document.querySelectorAll = origQsa;
console.log('ALL 18 REPORT HARDENING ASSERTIONS PASSED!');
