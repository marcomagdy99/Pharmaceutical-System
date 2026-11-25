const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createMockElement(id = '', tag = 'DIV') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerText: '',
    innerHTML: '',
    disabled: false,
    checked: false,
    selected: false,
    required: false,
    placeholder: '',
    style: { display: '' },
    dataset: {},
    options: [],
    children: [],
    selectedIndex: -1,
    _listeners: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, f) { if (f === undefined) { if (this._set.has(c)) this._set.delete(c); else this._set.add(c); } else if (f) this._set.add(c); else this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    replaceChildren(...items) {
      this.children = items;
      this.options = items.filter((i) => i && i.tagName === 'OPTION');
      this.value = this.options[0] ? this.options[0].value : '';
    },
    appendChild(child) {
      this.children.push(child);
      if (child && child.tagName === 'OPTION') {
        this.options.push(child);
        if (this.options.length === 1 && !this.value) this.value = child.value;
      } else if (child && child.tagName === 'OPTGROUP' && Array.isArray(child.children)) {
        child.children.forEach((c) => {
          if (c && c.tagName === 'OPTION') {
            this.options.push(c);
            if (this.options.length === 1 && !this.value) this.value = c.value;
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
      (this._listeners[evt.type] || []).forEach((fn) => fn(evt));
    },
    setAttribute(k, v) { this[k] = v; },
    removeAttribute(k) { delete this[k]; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    click() {},
    reset() {},
    remove() {}
  };
}

function makeStorage(initial = {}) {
  const map = { ...initial };
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null),
    setItem: (k, v) => { map[k] = String(v); },
    removeItem: (k) => { delete map[k]; },
    _raw: map
  };
}

function escHtml(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeRoleFn(r) {
  const s = String(r || '').trim().toLowerCase();
  if (['admin'].includes(s)) return 'admin';
  if (['general_manager', 'gm'].includes(s)) return 'general_manager';
  if (['business_unit', 'bu'].includes(s)) return 'business_unit';
  if (['line_manager', 'lm'].includes(s)) return 'line_manager';
  if (['district_manager', 'dm'].includes(s)) return 'district_manager';
  if (['product_manager', 'pm'].includes(s)) return 'product_manager';
  if (['hr'].includes(s)) return 'hr';
  if (['medical_rep', 'rep'].includes(s)) return 'medical_rep';
  return s;
}

// =========================================================================
// PART 1: timeline-report.js Tests
// =========================================================================
(function testTimelineReport() {
  const code = fs.readFileSync(path.resolve(__dirname, '../js/timeline-report.js'), 'utf8');
  const elements = {};
  const getEl = (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  };

  let activeUser = null;
  const users = [
    { id: 'admin1', name: 'Admin', role: 'admin' },
    { id: 'gm1', name: 'GM', role: 'general_manager' },
    { id: 'pm1', name: 'PM L1', role: 'product_manager', lineIds: ['line1'], lineId: 'line1' },
    { id: 'lm1', name: 'LM L1', role: 'line_manager', lineIds: ['line1'] },
    { id: 'dm1', name: 'DM L1', role: 'district_manager', managerId: 'lm1', lineIds: ['line1'] },
    { id: 'rep_dm', name: 'Rep Under DM', role: 'medical_rep', managerId: 'dm1', lineIds: ['line1'] },
    { id: 'rep_direct_lm', name: 'Rep Direct LM', role: 'medical_rep', managerId: 'lm1', lineIds: ['line1'] },
    { id: 'rep_multi', name: 'Rep Multi', role: 'medical_rep', managerId: 'dm1', lineIds: ['line1', 'line2'] },
    { id: 'rep_l2', name: 'Rep Line 2', role: 'medical_rep', lineIds: ['line2'] },
    { id: 'unknown1', name: 'Mystery', role: 'intern_guest' }
  ];
  const areas = [
    { id: 'vac_l1', name: 'Vacant L1', lineId: 'line1', repId: null, dmId: 'dm1' },
    { id: 'vac_l2', name: 'Vacant L2', lineId: 'line2', repId: null }
  ];
  const visits = [
    { id: 'v1', date: '2026-11-24', status: 'completed', repId: 'rep_dm', lineId: 'line1', targetName: 'Dr. One', source: 'actual' },
    { id: 'v2', date: '2026-11-24', status: 'completed', repId: 'rep_direct_lm', lineId: 'line1', targetName: 'Dr. DirectLM', isActual: true },
    { id: 'v3', date: '2026-11-24', status: 'completed', repId: 'rep_multi', lineId: 'line2', targetName: 'Dr. Line2OnMultiRep', isActual: true },
    { id: 'v4', date: '2026-11-24', status: 'completed', repId: 'rep_l2', lineId: 'line2', targetName: 'Dr. Line2', isActual: true },
    { id: 'v5', date: '2026-11-24', status: 'completed', repId: null, areaId: 'vac_l2', lineId: 'line2', targetName: 'Dr. VacantL2', isActual: true }
  ];
  const activitiesByUser = {
    rep_dm: { '2026-11-24': { AM: { type: 'Meeting', notes: '<img src=x onerror=alert(1)>' } } },
    rep_direct_lm: { '2026-11-24': { AM: { type: 'Training', notes: 'Direct LM act' } } },
    rep_l2: { '2026-11-24': { AM: { type: 'Office', notes: 'Secret L2 act' } } },
    u1790626000001: { '2026-11-24': { AM: { type: 'Legacy', notes: 'Should not load' } } }
  };

  const sandbox = {
    window: {},
    document: { getElementById: getEl, createElement: (t) => createMockElement('', t) },
    localStorage: makeStorage({ pharma_activities_data: JSON.stringify(activitiesByUser.u1790626000001) }),
    checkAuth: () => activeUser,
    requireAuth: () => activeUser,
    getCurrentLang: () => 'en',
    syncReportsData: () => {},
    getSharedReportUsers: () => users,
    REPORTS_DATA: { visits },
    normalizeRole: normalizeRoleFn,
    isRepRole: (u) => normalizeRoleFn(u && u.role) === 'medical_rep',
    isPMRole: (u) => normalizeRoleFn(u && u.role) === 'product_manager',
    escapeHtml: escHtml,
    getUserLines: (uid) => {
      const u = users.find((x) => x.id === uid);
      return ((u && u.lineIds) || []).map((id) => ({ id, name: id }));
    },
    getAreaManagerId: (a) => a.dmId || null,
    getSystemDate: () => new Date('2026-11-24T10:00:00Z'),
    getSystemTodayStr: () => '2026-11-24',
    store: {
      users: { getAll: () => users },
      areas: { getAll: () => areas },
      activities: { getAllForUser: (uid) => activitiesByUser[uid] || {} }
    },
    Date, Math, String, Array, Object, Set
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  getEl('timelineDateFrom').value = '2026-11-24';
  getEl('timelineDateTo').value = '2026-11-24';
  getEl('timelineRepSelect').value = 'all';
  getEl('timelineDmSelect').value = 'all';
  getEl('timelineLmSelect').value = 'all';
  sandbox.selectedReportLineId = 'all';

  // 1. Fail-closed when unauthenticated
  activeUser = null;
  getEl('timelineEventsContainer').children = [];
  sandbox.renderDailyTimeline();
  assert.strictEqual(getEl('timelineEventsContainer').children.length, 0, 'Unauthenticated must render 0 cards');

  // 2. Fail-closed for unknown role
  activeUser = users.find((u) => u.id === 'unknown1');
  sandbox.renderDailyTimeline();
  assert.strictEqual(getEl('timelineEventsContainer').children.length, 0, 'Unknown role must see 0 visits/activities');

  // 3. PM scoped strictly to line1 (must NOT see v3/v4/rep_l2)
  activeUser = users.find((u) => u.id === 'pm1');
  sandbox.renderDailyTimeline();
  const pmHtml = getEl('timelineEventsContainer').children.map((c) => c.innerHTML).join('\n');
  assert.ok(pmHtml.includes('Dr. One'), 'PM sees line1 visit');
  assert.ok(!pmHtml.includes('Dr. Line2'), 'PM must NOT see line2 visit');
  assert.ok(!pmHtml.includes('Secret L2 act'), 'PM must NOT see line2 activity');
  assert.ok(!pmHtml.includes('<img src=x'), 'XSS notes must be escaped');
  assert.ok(!pmHtml.includes('Actual without Plan') || pmHtml.includes('Dr. One'), 'v1 with source:actual treated as actual');

  // 4. LM sees both DM rep AND direct-to-LM rep
  activeUser = users.find((u) => u.id === 'lm1');
  sandbox.renderDailyTimeline();
  const lmHtml = getEl('timelineEventsContainer').children.map((c) => c.innerHTML).join('\n');
  assert.ok(lmHtml.includes('Dr. DirectLM'), 'LM must see direct-to-LM rep visit');
  assert.ok(lmHtml.includes('Direct LM act'), 'LM must see direct-to-LM rep activity');

  // 5. Line filter rejects v3 (rep is multi-line line1+line2, but visit v3 has lineId='line2')
  activeUser = users.find((u) => u.id === 'admin1');
  sandbox.selectedReportLineId = 'line1';
  getEl('timelineRepSelect').value = 'rep_multi';
  sandbox.renderDailyTimeline();
  const l1Html = getEl('timelineEventsContainer').children.map((c) => c.innerHTML).join('\n');
  assert.ok(!l1Html.includes('Dr. Line2OnMultiRep'), 'Line1 filter must NOT leak line2 visit of multi-line rep');
  assert.ok(!l1Html.includes('Secret L2 act'), 'Line1 filter must filter activityTargetIds even when specific rep selected');

  // 6. Rep cannot query vacant:vac_l2
  activeUser = users.find((u) => u.id === 'rep_dm');
  sandbox.selectedReportLineId = 'all';
  getEl('timelineRepSelect').value = 'vacant:vac_l2';
  sandbox.renderDailyTimeline();
  const repVacHtml = getEl('timelineEventsContainer').children.map((c) => c.innerHTML).join('\n');
  assert.ok(!repVacHtml.includes('Dr. VacantL2'), 'Rep must NOT view vacant area timeline');

  console.log('PASS: timeline-report.js hardening');
})();

// =========================================================================
// PART 2: users.js & users.html Tests
// =========================================================================
async function testUsersModule() {
  const html = fs.readFileSync(path.resolve(__dirname, '../users.html'), 'utf8');
  assert.ok(html.includes('value="GM"'), 'users.html must include GM role option');

  const code = fs.readFileSync(path.resolve(__dirname, '../js/users.js'), 'utf8');
  const elements = {};
  const getEl = (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  };

  let authUser = { id: 'hr1', name: 'HR', role: 'hr' };
  let storedUsers = [
    { id: 'adm1', name: 'Sys Admin', email: 'adm@co.com', employeeCode: 'ADM-001', role: 'admin', status: 'Active', passwordHash: 'SECRET_HASH' },
    { id: 'hr1', name: 'HR User', email: 'hr@co.com', employeeCode: 'HR-001', role: 'hr', status: 'Active', passwordHash: 'HR_SECRET' },
    { id: 'gm1', name: 'GM User', email: 'gm@co.com', employeeCode: 'GM-001', role: 'general_manager', status: 'Active' },
    { id: 'rep1', name: '<script>xss</script>', email: '', employeeCode: 'REP-001', role: 'medical_rep', status: 'Active', managerId: 'gm1' }
  ];
  let storedLines = [{ id: 'l1', name: 'Cardio', status: 'Active', products: [] }];
  let storedAreas = [];
  let savedCompanySettings = { isProductionLaunched: true };
  let toasts = [];
  let replacedUrl = null;
  const sess = makeStorage();
  const loc = makeStorage();

  const sandbox = {
    window: {},
    document: {
      getElementById: getEl,
      createElement: (t) => createMockElement('', t),
      querySelectorAll: () => [],
      addEventListener: () => {},
      dispatchEvent: () => {}
    },
    sessionStorage: sess,
    localStorage: loc,
    location: { href: '', replace: (u) => { replacedUrl = u; } },
    CustomEvent: function (t, d) { this.type = t; this.detail = d && d.detail; },
    checkAuth: () => authUser,
    requireAuth: () => authUser,
    hasAnyRole: (roles, u) => u && roles.includes(normalizeRoleFn(u.role)),
    normalizeRole: normalizeRoleFn,
    isAdmin: (u) => normalizeRoleFn(u && u.role) === 'admin',
    isGMRole: (u) => normalizeRoleFn(u && u.role) === 'general_manager',
    isBURole: (u) => normalizeRoleFn(u && u.role) === 'business_unit',
    isLMRole: (u) => normalizeRoleFn(u && u.role) === 'line_manager',
    isDMRole: (u) => normalizeRoleFn(u && u.role) === 'district_manager',
    isRepRole: (u) => normalizeRoleFn(u && u.role) === 'medical_rep',
    escapeHtml: escHtml,
    showToast: (m, t) => toasts.push({ m, t }),
    hashPassword: async (p) => 'HASH_' + p,
    saveDataToStorage: () => {},
    genId: (pfx) => pfx + '_gen_1',
    getSystemDate: () => new Date('2026-11-24T10:00:00Z'),
    getSystemTodayStr: () => '2026-11-24',
    DEMO_MODE: false,
    DEMO_DATA: { users: storedUsers, productLines: storedLines, areas: storedAreas },
    store: {
      companySettings: { get: () => savedCompanySettings },
      users: {
        getAll: () => storedUsers,
        getById: (id) => storedUsers.find((u) => u.id === id) || null,
        save: (u) => {
          const i = storedUsers.findIndex((x) => x.id === u.id);
          if (i >= 0) storedUsers[i] = u; else storedUsers.push(u);
        },
        syncAreasFromStore: () => {}
      },
      productLines: { getAll: () => storedLines, save: (l) => storedLines.push(l) },
      areas: { getAll: () => storedAreas, getByRep: () => [], unassignRep: () => {} }
    },
    Date, Math, String, Array, Object, Set, RegExp, Map
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  const mgmt = sandbox.userMgmt;

  // 1. GM normalization & prefix
  assert.strictEqual(mgmt.normalizeRole('general_manager'), 'GM');
  assert.strictEqual(mgmt.getRoleCodePrefix('GM'), 'GM-');
  assert.strictEqual(mgmt.getRoleBadgeClass('GM'), 'bg-gm');

  // 2. No fake email/phone synthesis in users getter
  const gotRep = mgmt.users.find((u) => u.id === 'rep1');
  assert.strictEqual(gotRep.email, '', 'Must NOT synthesize fake @pharmacare.com email');
  assert.strictEqual(gotRep.phone, '', 'Must NOT synthesize fake phone number');

  // 3. loadDemoData / initLines must NOT seed when DEMO_MODE=false or isProductionLaunched=true
  const beforeLen = storedUsers.length;
  storedUsers.length = 0;
  mgmt.loadDemoData();
  assert.strictEqual(storedUsers.length, 0, 'Must NOT seed demo users in production');
  storedUsers.push(
    { id: 'adm1', name: 'Sys Admin', email: 'adm@co.com', employeeCode: 'ADM-001', role: 'admin', status: 'Active', passwordHash: 'SECRET_HASH' },
    { id: 'hr1', name: 'HR User', email: 'hr@co.com', employeeCode: 'HR-001', role: 'hr', status: 'Active', passwordHash: 'HR_SECRET' },
    { id: 'gm1', name: 'GM User', email: 'gm@co.com', employeeCode: 'GM-001', role: 'general_manager', status: 'Active' },
    { id: 'rep1', name: '<script>xss</script>', email: '', employeeCode: 'REP-001', role: 'medical_rep', status: 'Active', managerId: 'gm1' }
  );

  // 4. HR cannot create Admin or edit Admin or deactivate Admin
  getEl('userId').value = '';
  getEl('uName').value = 'Evil Admin';
  getEl('uEmail').value = 'evil@co.com';
  getEl('uCode').value = 'ADM-999';
  getEl('uRole').value = 'Admin';
  await mgmt.saveUser();
  assert.ok(!storedUsers.some((u) => u.email === 'evil@co.com'), 'HR must NOT be able to create Admin');

  mgmt.selectedUserId = 'adm1';
  mgmt.confirmDeactivate();
  assert.strictEqual(storedUsers.find((u) => u.id === 'adm1').status, 'Active', 'HR must NOT deactivate Admin');

  // 5. syncAuthUser must NOT leak passwordHash into sessionStorage
  mgmt.syncAuthUser(storedUsers.find((u) => u.id === 'hr1'));
  const storedSession = JSON.parse(sess.getItem('pharmaUser'));
  assert.strictEqual(storedSession.passwordHash, undefined, 'passwordHash must NEVER be written to sessionStorage');

  // 6. Spoofed impersonating_admin with non-admin role rejected
  sess.setItem('impersonating_admin', JSON.stringify({ id: 'rep1', role: 'medical_rep' }));
  assert.strictEqual(mgmt._isRealAdmin({ id: 'hr1', role: 'hr' }), false, 'Spoofed non-admin impersonation object must be rejected');
  sess.removeItem('impersonating_admin');

  // 7. No fake promotion recorded when role is unchanged
  authUser = storedUsers.find((u) => u.id === 'adm1');
  getEl('userId').value = 'rep1';
  getEl('uName').value = 'Rep Updated';
  getEl('uEmail').value = 'rep1@co.com';
  getEl('uCode').value = 'REP-001';
  getEl('uRole').value = 'Rep';
  await mgmt.saveUser();
  const updatedRep = storedUsers.find((u) => u.id === 'rep1');
  assert.strictEqual(updatedRep.promotionHistory.length, 0, 'Editing without role change must NOT record fake promotion');

  // 8. Rendered table escapes XSS and has no inline onclick
  storedUsers.find((u) => u.id === 'rep1').name = '<img src=x onerror=alert(1)>';
  mgmt.renderTable();
  const tblHtml = getEl('usersTableBody').innerHTML;
  assert.ok(!tblHtml.includes('<img src=x'), 'Table HTML must escape XSS in user name');
  assert.ok(!tblHtml.includes('onclick='), 'Table actions must not use inline onclick=');

  // 9. Init fails-closed when unauthenticated
  authUser = null;
  replacedUrl = null;
  mgmt.init();
  assert.strictEqual(replacedUrl, 'index.html', 'Unauthenticated init must redirect to index.html');

  console.log('PASS: users.js & users.html hardening');
}

// =========================================================================
// PART 3: visits.js Tests
// =========================================================================
function testVisitsModule() {
  const code = fs.readFileSync(path.resolve(__dirname, '../js/visits.js'), 'utf8');

  function runVisitsCtx(activeAuthUser) {
    const elements = {};
    const getEl = (id) => {
      if (!elements[id]) elements[id] = createMockElement(id);
      return elements[id];
    };

    const users = [
      { id: 'gm1', name: 'GM', role: 'general_manager' },
      { id: 'pm_zero', name: 'PM Zero', role: 'product_manager', lineIds: [] },
      { id: 'pm_l1', name: 'PM L1', role: 'product_manager', lineIds: ['line1'], lineId: 'line1' },
      { id: 'lm1', name: 'LM L1', role: 'line_manager', lineIds: ['line1'] },
      { id: 'dm1', name: 'DM L1', role: 'district_manager', managerId: 'lm1', lineIds: ['line1'] },
      { id: 'rep_dm', name: 'Rep Under DM', role: 'medical_rep', managerId: 'dm1', lineIds: ['line1'] },
      { id: 'rep_direct_lm', name: 'Rep Direct LM', role: 'medical_rep', managerId: 'lm1', lineIds: ['line1'] },
      { id: 'rep_l2', name: 'Rep L2', role: 'medical_rep', lineIds: ['line2'] }
    ];
    const areas = [
      { id: 'a1', name: 'Area L1', lineId: 'line1', repId: 'rep_dm', dmId: 'dm1' },
      { id: 'a_vac_l2', name: 'Vac L2', lineId: 'line2', repId: null }
    ];
    const doctors = [
      { id: 'd1', name: 'Dr L1', areaId: 'a1', repId: 'rep_dm', lineId: 'line1' },
      { id: 'd2', name: 'Dr L2', areaId: 'a_vac_l2', repId: 'rep_l2', lineId: 'line2' }
    ];
    const hospitals = [{ id: 'h2', name: 'Hosp L2', areaId: 'a_vac_l2', repId: 'rep_l2', lineId: 'line2' }];
    const pharmacies = [{ id: 'p2', name: 'Pharm L2', areaId: 'a_vac_l2', repId: 'rep_l2', lineId: 'line2' }];
    const visits = [
      { id: 'v1', date: '2026-11-24', status: 'completed', repId: 'rep_dm', lineId: 'line1', doctorName: '=CMD()', source: 'actual', products: ['ProdA'], comment: '+1+1' },
      { id: 'v2', date: '2026-11-24', status: 'completed', repId: 'rep_direct_lm', lineId: 'line1', doctorName: 'Dr Direct', source: 'actual' },
      { id: 'v3', date: '2026-11-24', status: 'completed', repId: 'rep_l2', lineId: 'line2', areaId: 'a_vac_l2', doctorName: 'Dr L2', source: 'actual' },
      { id: 'v_plan', date: '2026-11-24', status: 'planned', repId: 'rep_l2', lineId: 'line2', doctorId: 'd2', doctorName: 'Dr L2', source: 'plan' }
    ];
    const publicHolidays = [{ date: '2026-01-07', name: 'Holiday 1' }];
    let cloudSyncCalls = [];
    let exportedExcelArgs = null;
    let revokedUrls = [];
    let lastBlobText = '';
    const loc = makeStorage({
      pharma_public_holidays: JSON.stringify([{ date: '2026-04-25', name: 'Holiday 2' }]),
      pharma_dm_accompaniments: JSON.stringify({ dm1: { '2026-11-24': 'rep_other' } })
    });

    const sandbox = {
      window: {},
      document: {
        getElementById: getEl,
        querySelector: (sel) => {
          if (sel === 'input[name="visitPeriod"]:checked') return { value: sandbox._period || 'pm' };
          if (sel === 'input[name="visitType"]:checked') return { value: sandbox._visitType || 'single' };
          return null;
        },
        querySelectorAll: (sel) => {
          if (sel === '#visitManagersGroup input[name="doubleCompanion"]:checked') return sandbox._companionCbs || [];
          return [];
        },
        createElement: (t) => createMockElement('', t),
        addEventListener: () => {},
        dispatchEvent: () => {}
      },
      localStorage: loc,
      sessionStorage: makeStorage(),
      navigator: { onLine: true },
      addEventListener: () => {},
      removeEventListener: () => {},
      Blob: function (parts) { lastBlobText = parts.join(''); },
      URL: { createObjectURL: () => 'blob:mock1', revokeObjectURL: (u) => revokedUrls.push(u) },
      setTimeout: (fn) => fn(),
      confirm: () => false,
      checkAuth: () => activeAuthUser,
      requireAuth: () => activeAuthUser,
      normalizeRole: normalizeRoleFn,
      isManagerRole: (u) => ['admin', 'general_manager', 'business_unit', 'line_manager', 'district_manager', 'product_manager'].includes(normalizeRoleFn(u && u.role)),
      isRepRole: (u) => normalizeRoleFn(u && u.role) === 'medical_rep',
      getUserLines: (uid) => {
        const u = users.find((x) => x.id === uid);
        return ((u && u.lineIds) || []).map((id) => ({ id, name: id }));
      },
      getAllSubordinates: (mgrId, seen = new Set()) => {
        seen.add(mgrId);
        const direct = users.filter((u) => u && u.managerId === mgrId && !seen.has(u.id));
        let all = [...direct];
        direct.forEach((d) => { all = all.concat(sandbox.getAllSubordinates(d.id, seen)); });
        return all;
      },
      getSystemDate: () => new Date('2026-11-24T10:00:00Z'),
      getSystemTodayStr: () => '2026-11-24',
      genId: (p) => p + '_id_1',
      escapeHtml: escHtml,
      showToast: (m, t) => { sandbox._toasts.push({ m, t }); },
      _toasts: [],
      saveDataToStorage: () => {},
      DEMO_DATA: {
        users, areas, doctors, hospitals, pharmacies, visits,
        publicHolidays,
        productLines: [{ id: 'line1', name: 'L1' }, { id: 'line2', name: 'L2' }],
        companySettings: { requireGpsValidation: false, defaultDailyVisitsTarget: 8 }
      },
      store: {
        users: { getAll: () => users },
        areas: { getAll: () => areas, getByRep: (uid) => areas.filter((a) => a.repId === uid) },
        doctors: { getAll: () => doctors },
        hospitals: { getAll: () => hospitals },
        pharmacies: { getAll: () => pharmacies },
        productLines: { getAll: () => [{ id: 'line1', name: 'L1' }, { id: 'line2', name: 'L2' }] },
        companySettings: { get: () => ({ requireGpsValidation: false, defaultDailyVisitsTarget: 8 }) },
        visits: {
          getAll: () => visits,
          getById: (id) => visits.find((v) => v.id === id),
          add: (v) => { visits.unshift(v); cloudSyncCalls.push({ action: 'create', v }); return v; },
          update: (id, u) => { const x = visits.find((v) => v.id === id); Object.assign(x, u); cloudSyncCalls.push({ action: 'update', v: x }); return x; },
          delete: (id) => { cloudSyncCalls.push({ action: 'delete', id }); }
        },
        activities: {
          getAllForUser: (uid) => uid === 'rep_l2' ? { '2026-11-24': { AM: { type: 'Secret', notes: 'L2 Secret Activity' } } } : {}
        }
      },
      Date, Math, String, Array, Object, Set
    };
    sandbox.window = sandbox;
    sandbox._getLastCsv = () => lastBlobText;
    sandbox._getRevokedUrls = () => revokedUrls;
    sandbox._getCloudCalls = () => cloudSyncCalls;
    sandbox._setDownloadExcelOrCsv = (fn) => { sandbox.downloadExcelOrCsv = fn; sandbox.window.downloadExcelOrCsv = fn; };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return { sandbox, getEl, publicHolidays, visits, loc };
  }

  // 1. Holidays array NOT mutated by isWorkdayExemptFromMinVisits
  {
    const { sandbox, publicHolidays } = runVisitsCtx({ id: 'rep_dm', name: 'Rep', role: 'medical_rep' });
    sandbox.isWorkdayExemptFromMinVisits('2026-11-24', 'rep_dm');
    sandbox.isWorkdayExemptFromMinVisits('2026-11-24', 'rep_dm');
    assert.strictEqual(publicHolidays.length, 1, 'DEMO_DATA.publicHolidays must NOT be mutated');
  }

  // 2. Unauthenticated user fail-closed
  {
    const { sandbox } = runVisitsCtx(null);
    assert.strictEqual(sandbox.getScopedVisits().length, 0, 'Unauthenticated getScopedVisits must be []');
    assert.strictEqual(sandbox.canDeleteVisit({ id: 'v1', repId: 'rep_dm', date: '2026-11-24' }), false);
  }

  // 3. LM sees direct-to-LM rep visits AND never sees rep_l2 activities on renderVisitsTimeline
  {
    const { sandbox, getEl } = runVisitsCtx({ id: 'lm1', name: 'LM L1', role: 'line_manager', lineIds: ['line1'] });
    getEl('filterRep').value = 'all';
    getEl('filterLine').value = 'all';
    const scoped = sandbox.getScopedVisits();
    assert.ok(scoped.some((v) => v.id === 'v2'), 'LM must see direct-to-LM rep visit');
    assert.ok(!scoped.some((v) => v.id === 'v3'), 'LM must NOT see line2 visit');

    getEl('timelineDatePicker').value = '2026-11-24';
    sandbox.renderVisitsTimeline(true);
    const tlHtml = getEl('timelineEventsContainer').children.map((c) => c.innerHTML).join('\n');
    assert.ok(!tlHtml.includes('L2 Secret Activity'), 'LM timeline must NOT expose other line activities');
  }

  // 4. PM with 0 matched hospitals/pharmacies/doctors & activeLineId filter bypass fix
  {
    const { sandbox, getEl } = runVisitsCtx({ id: 'pm_l1', name: 'PM L1', role: 'product_manager', lineIds: ['line1'], lineId: 'line1' });
    sandbox._period = 'am'; // hospitals only exist in line2!
    sandbox.updateTargetOptions();
    const hospOpts = getEl('visitTarget').children.filter((c) => c.value);
    assert.strictEqual(hospOpts.length, 0, 'PM must NOT fall open to allHosps when 0 hospitals match line1');

    sandbox._period = 'pharmacy'; // pharmacies only exist in line2!
    sandbox.updateTargetOptions();
    const pharmOpts = getEl('visitTarget').children.filter((c) => c.value);
    assert.strictEqual(pharmOpts.length, 0, 'PM must NOT fall open to allPharms when 0 pharmacies match line1');

    // Line filter strict when 0 match
    const gmRun = runVisitsCtx({ id: 'gm1', name: 'GM', role: 'general_manager' });
    gmRun.getEl('filterLine').value = 'line1';
    gmRun.sandbox._period = 'am';
    gmRun.sandbox.updateTargetOptions();
    assert.strictEqual(gmRun.getEl('visitTarget').children.filter((c) => c.value).length, 0, 'Line filter must NOT bypass when 0 hospitals match line1');
  }

  // 5. saveVisit uses store.visits, checks authorization & accompaniment conflict
  {
    const { sandbox, getEl } = runVisitsCtx({ id: 'rep_dm', name: 'Rep', role: 'medical_rep', lineIds: ['line1'] });
    getEl('visitDate').value = '2026-11-24';
    getEl('visitTime').value = '11:00';
    getEl('visitTarget').replaceChildren(Object.assign(createMockElement('', 'OPTION'), { value: 'd1', textContent: 'Dr L1' }));
    getEl('visitTarget').value = 'd1';
    sandbox._visitType = 'double';
    sandbox._companionCbs = [{ value: 'DM L1', dataset: { userId: 'dm1' } }];
    sandbox.saveVisit();
    assert.strictEqual(sandbox._getCloudCalls().length, 0, 'Must abort double visit when DM already booked with another rep');

    sandbox._visitType = 'single';
    sandbox.saveVisit();
    assert.strictEqual(sandbox._getCloudCalls().length, 1, 'saveVisit must persist through store.visits.add -> syncVisitToCloud');
  }

  // 6. exportVisitsToCSV formula neutralization, revokeObjectURL, and downloadExcelOrCsv delegation
  {
    const { sandbox, getEl } = runVisitsCtx({ id: 'admin1', name: 'Admin', role: 'admin' });
    getEl('timelineDatePicker').value = '';
    getEl('filterRep').value = 'all';
    sandbox.exportVisitsToCSV();
    const csv = sandbox._getLastCsv();
    assert.ok(csv.includes('"\'=CMD()"'), 'Formula injection (=CMD()) must be neutralized in fallback CSV');
    assert.ok(csv.includes('"\'+1+1"'), 'Formula injection (+1+1) must be neutralized in fallback CSV');
    assert.strictEqual(sandbox._getRevokedUrls().length, 1, 'URL.revokeObjectURL must be called');

    let delegated = null;
    sandbox._setDownloadExcelOrCsv((fn, sheet, rows, hdrs) => { delegated = { fn, sheet, rows, hdrs }; });
    sandbox.exportVisitsToCSV();
    assert.ok(delegated && delegated.rows.length > 0, 'Must delegate to window.downloadExcelOrCsv when available');
  }

  console.log('PASS: visits.js hardening');
}

function testGmAcrossActivitiesAndBulkPlanner() {
  const coreJs = fs.readFileSync(path.resolve(__dirname, '../js/activities-core.js'), 'utf8');
  const budgetJs = fs.readFileSync(path.resolve(__dirname, '../js/activities-tab-budget.js'), 'utf8');

  const lines = [{ id: 'line1', name: 'Line 1' }, { id: 'line2', name: 'Line 2' }];
  const users = [
    { id: 'gm1', name: 'GM', role: 'general_manager' },
    { id: 'lm1', name: 'LM1', role: 'line_manager', managerId: 'gm1', lineIds: ['line1'] },
    { id: 'rep1', name: 'Rep1', role: 'medical_rep', managerId: 'lm1', lineIds: ['line1'] },
    { id: 'bu2', name: 'BU2', role: 'business_unit', lineIds: ['line2'] },
    { id: 'rep2', name: 'Rep2', role: 'medical_rep', managerId: 'bu2', lineIds: ['line2'] }
  ];
  const elMap = {};
  const getEl = (id) => {
    if (!elMap[id]) elMap[id] = createMockElement(id);
    return elMap[id];
  };
  const getAllSubordinates = (mgrId, seen = new Set()) => {
    seen.add(mgrId);
    const direct = users.filter((u) => u && u.managerId === mgrId && !seen.has(u.id));
    let out = [...direct];
    direct.forEach((d) => { out = out.concat(getAllSubordinates(d.id, seen)); });
    return out;
  };
  const getUserLines = (uid) => {
    const u = users.find((x) => x.id === uid);
    if (!u) return [];
    const r = normalizeRoleFn(u.role);
    if (r === 'admin' || r === 'hr') return lines;
    const idSet = new Set(u.lineIds || (u.lineId ? [u.lineId] : []));
    if (r === 'business_unit' || r === 'general_manager') {
      getAllSubordinates(uid).forEach((s) => (s.lineIds || []).forEach((lid) => idSet.add(lid)));
    }
    return lines.filter((l) => idSet.has(l.id));
  };
  let savedBudgets = {};
  const sandbox = {
    window: {},
    document: { getElementById: getEl, querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {} },
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    normalizeRole: normalizeRoleFn,
    getAllSubordinates,
    getUserLines,
    checkAuth: () => users[0],
    safeShowToast: () => {},
    showToast: () => {},
    DEMO_DATA: { users, productLines: lines, areas: [], budgets: savedBudgets, services: [] },
    store: {
      users: { getAll: () => users },
      productLines: { getAll: () => lines },
      areas: { getAll: () => [] },
      budgets: { getAll: () => savedBudgets, saveAll: (b) => { savedBudgets = b; }, get: () => savedBudgets, save: (b) => { savedBudgets = b; } },
      services: { getAll: () => [] }
    },
    Date, Math, String, Array, Object, Set
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(coreJs, sandbox);
  vm.runInContext(budgetJs, sandbox);

  const Core = sandbox.ActivitiesCore;
  assert.strictEqual(Core.ROLES.GM, 'general_manager', 'Core.ROLES.GM must exist');
  [
    'allocate_bu_budget', 'allocate_lm_budget', 'allocate_dm_budget', 'allocate_rep_budget',
    'approve_service', 'reject_service', 'approve_expense', 'reject_expense', 'disburse_expense',
    'approve_location', 'reject_location'
  ].forEach((act) => {
    assert.strictEqual(Core.isActionAuthorized(act, { id: 'r1', requesterId: 'rep1', status: 'pending_gm' }, users[0]), false, `GM must NOT be authorized for ${act}`);
  });
  const gmLines = Core.getUserAssignedLines(users[0]);
  assert.strictEqual(gmLines.length, 1, 'GM must only see subordinate product lines in activities');
  assert.strictEqual(gmLines[0].id, 'line1', 'GM must see line1 under lm1 and NOT line2 under bu2');

  getEl('buBudgetLineSelect').value = 'line1';
  getEl('buTotalBudgetInput').value = '50000';
  sandbox.ActivitiesBudget.saveBuBudgetAllocations();
  assert.strictEqual(savedBudgets.line1, undefined, 'GM must NOT be able to save BU line budget');

  // Live VM verification of VisitsBulkPlanner security, scoping, and store.visits persistence
  const bulkJs = fs.readFileSync(path.resolve(__dirname, '../js/visits-bulk-planner.js'), 'utf8');
  assert.ok(!bulkJs.includes('"u1790626000001"'), 'visits-bulk-planner.js must NOT contain hardcoded default user fallback');
  {
    const bulkUsers = [
      { id: 'dm1', name: 'DM1', role: 'district_manager', lineIds: ['line1'] },
      { id: 'rep1', name: 'Rep1', role: 'medical_rep', managerId: 'dm1', lineIds: ['line1'] },
      { id: 'gm1', name: 'GM1', role: 'general_manager' },
      { id: 'rep2', name: 'Rep2', role: 'medical_rep', lineIds: ['line2'] }
    ];
    const bulkAreas = [
      { id: 'a1', name: 'Area 1', lineId: 'line1', repId: 'rep1', dmId: 'dm1' },
      { id: 'a2', name: 'Area 2', lineId: 'line2', repId: 'rep2' }
    ];
    const bulkDoctors = [
      { id: 'doc1', name: 'Dr. One', specialty: 'Cardio', class: 'A', areaId: 'a1', lineId: 'line1', repId: 'rep1' },
      { id: 'doc_unassigned_l2', name: 'Dr. Unassigned L2', specialty: 'Neuro', class: 'A', areaId: 'a2', lineId: 'line2', repId: null }
    ];
    const bulkHospitals = [
      { id: 'hosp1', name: 'Hosp One', address: 'Cairo', areaId: 'a1', lineId: 'line1', repId: 'rep1' }
    ];
    const addedVisits = [];
    let activeBulkUser = null;
    const bulkElMap = {};
    const getBulkEl = (id) => {
      if (!bulkElMap[id]) bulkElMap[id] = createMockElement(id);
      return bulkElMap[id];
    };
    const bulkSandbox = {
      window: {},
      document: {
        getElementById: getBulkEl,
        querySelector: (sel) => {
          if (sel === 'input[name="bulkPeriod"]:checked') return { value: bulkSandbox._period || 'pm' };
          return null;
        },
        querySelectorAll: (sel) => {
          if (sel === '.bulk-target-cb:checked') return bulkSandbox._checked || [];
          return [];
        },
        createElement: (t) => createMockElement('', t),
        addEventListener: () => {}
      },
      localStorage: makeStorage(),
      sessionStorage: makeStorage(),
      normalizeRole: normalizeRoleFn,
      checkAuth: () => activeBulkUser,
      getMockDoctors: () => bulkDoctors,
      getMockHospitals: () => bulkHospitals,
      getUserLines: (uid) => {
        const u = bulkUsers.find((x) => x.id === uid);
        return ((u && u.lineIds) || []).map((lid) => ({ id: lid, name: lid }));
      },
      getAllSubordinates: () => [],
      getSystemDate: () => new Date('2026-11-25T10:00:00Z'),
      getSystemTodayStr: () => '2026-11-25',
      showToast: () => {},
      DEMO_DATA: { users: bulkUsers, areas: bulkAreas, visits: addedVisits },
      store: {
        users: { getAll: () => bulkUsers },
        areas: { getAll: () => bulkAreas, getByRep: (uid) => bulkAreas.filter((a) => a.repId === uid) },
        visits: {
          getAll: () => addedVisits,
          add: (v) => { addedVisits.push(v); return v; }
        }
      },
      Date, Math, String, Array, Object, Set
    };
    bulkSandbox.window = bulkSandbox;
    vm.createContext(bulkSandbox);
    vm.runInContext(bulkJs, bulkSandbox);

    // 1) Unauthenticated attempt must fail-closed with 0 saved visits
    getBulkEl('bulkPlanDate').value = '2026-11-26';
    bulkSandbox._checked = [{ value: 'doc1', getAttribute: () => 'Dr. One' }];
    bulkSandbox.saveBulkPlanVisits();
    assert.strictEqual(addedVisits.length, 0, 'Unauthenticated bulk save must be rejected');

    // 2) GM attempt must be blocked (view-only)
    activeBulkUser = bulkUsers[2];
    bulkSandbox.openBulkPlanModal();
    assert.notStrictEqual(getBulkEl('bulkPlanModal').style.display, 'flex', 'GM must not open bulk planner');
    bulkSandbox.saveBulkPlanVisits();
    assert.strictEqual(addedVisits.length, 0, 'GM must not save bulk plans');

    // 3) DM on line1 must NOT see unassigned doctor from line2
    activeBulkUser = bulkUsers[0];
    bulkSandbox._period = 'pm';
    getBulkEl('filterLine').value = 'all';
    getBulkEl('bulkClassFilter').value = 'all';
    getBulkEl('bulkAreaFilter').value = 'all';
    bulkSandbox.renderBulkTargetsList();
    assert.strictEqual(getBulkEl('bulkTargetsContainer').children.length, 1, 'DM on line1 must NOT see unassigned target on line2');

    // 4) Rep1 tampered checkbox (doc_unassigned_l2) dropped; valid doc1 & hosp1 saved via store.visits.add
    activeBulkUser = bulkUsers[1];
    bulkSandbox._period = 'am';
    bulkSandbox._checked = [
      { value: 'doc_unassigned_l2', getAttribute: () => 'Tampered' },
      { value: 'hosp1', getAttribute: () => 'Hosp One' }
    ];
    bulkSandbox.saveBulkPlanVisits();
    assert.strictEqual(addedVisits.length, 1, 'Only authorized target within rep scope may be saved');
    assert.strictEqual(addedVisits[0].doctorId, 'hosp1');
    assert.strictEqual(addedVisits[0].targetType, 'hospital');
    assert.strictEqual(addedVisits[0].areaId, 'a1');
    assert.strictEqual(addedVisits[0].repId, 'rep1');
    assert.strictEqual(addedVisits[0].status, 'pending_approval');

    // 5) Admin bulk save sets status='planned' (compatible with reschedule.js) and uses genId if present
    let genSeq = 0;
    bulkSandbox.genId = (prefix) => `${prefix}custom_${++genSeq}`;
    activeBulkUser = { id: 'admin1', name: 'Admin', role: 'admin' };
    bulkSandbox._period = 'pm';
    bulkSandbox._checked = [{ value: 'doc1', getAttribute: () => 'Dr. One' }];
    bulkSandbox.saveBulkPlanVisits();
    assert.strictEqual(addedVisits.length, 2);
    assert.strictEqual(addedVisits[1].status, 'planned', 'Admin bulk planned visit must use status="planned", not "approved"');
    assert.ok(addedVisits[1].id.startsWith('v_bulk_custom_'), 'Bulk planner must use window.genId when available');
    assert.ok(!bulkJs.includes('onchange="visitsApp.updateBulkCounter()"'), 'Bulk planner must use event delegation instead of inline onchange');
  }

  // getSubordinatesForUser for GM must strictly exclude sibling BU2 & Rep2
  const gmSubs = Core.getSubordinatesForUser(users[0], 'all');
  assert.strictEqual(gmSubs.length, 2, 'GM must see strictly 2 subordinates under hierarchy');
  assert.ok(gmSubs.some((u) => u.id === 'lm1') && gmSubs.some((u) => u.id === 'rep1'), 'GM sees own subtree');
  assert.ok(!gmSubs.some((u) => u.id === 'bu2') && !gmSubs.some((u) => u.id === 'rep2'), 'GM must NOT see sibling BU/Rep outside tree');

  // WorkflowEngine GM zero-approval checks
  const weJs = fs.readFileSync(path.resolve(__dirname, '../js/workflow-engine.js'), 'utf8');
  const weSandbox = {
    window: {},
    DEMO_DATA: { users, productLines: lines, areas: [], companySettings: {} },
    store: { users: { getAll: () => users }, productLines: { getAll: () => lines }, areas: { getAll: () => [] }, companySettings: { get: () => ({}) } }
  };
  weSandbox.window = weSandbox;
  vm.createContext(weSandbox);
  vm.runInContext(weJs, weSandbox);
  const WE = weSandbox.WorkflowEngine;
  assert.strictEqual(WE.getUserBaseRole({ role: 'gm' }), 'general_manager');
  assert.strictEqual(WE.getUserLevel({ role: 'general_manager' }), 5);
  assert.strictEqual(WE.userMatchesTier({ role: 'general_manager' }, 'gm'), true);
  assert.strictEqual(WE.isServiceAuthorized({ id: 's1', requesterId: 'rep1', status: 'pending_gm' }, users[0]), false, 'GM must NOT be authorized to approve services');
  assert.strictEqual(WE.isExpenseAuthorized({ id: 'e1', requesterId: 'rep1', status: 'pending_gm' }, users[0]), false, 'GM must NOT be authorized to approve expenses');
  assert.strictEqual(WE.isExpenseAuthorized({ id: 'e1', requesterId: 'rep1', status: 'approved' }, users[0], 'disburse_expense'), false, 'Only HR/Admin disburse expenses');

  // app, dashboard, plans-review, reschedule, expenses & services read-only / subtree scoping checks
  const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf8');
  const dashJs = fs.readFileSync(path.resolve(__dirname, '../js/dashboard.js'), 'utf8');
  const plansJs = fs.readFileSync(path.resolve(__dirname, '../js/plans-review.js'), 'utf8');
  const reschedJs = fs.readFileSync(path.resolve(__dirname, '../js/reschedule.js'), 'utf8');
  const expJs = fs.readFileSync(path.resolve(__dirname, '../js/activities-tab-expenses.js'), 'utf8');
  const srvJs = fs.readFileSync(path.resolve(__dirname, '../js/activities-tab-services.js'), 'utf8');

  assert.ok(appJs.includes('roles: ["district_manager", "line_manager", "business_unit", "general_manager"]'), 'app.js NAV_CONFIG plans-review must allow general_manager view');
  assert.ok(dashJs.includes('else if (role === "business_unit" || role === "bu" || role === "general_manager" || role === "gm")'), 'dashboard.js must route GM to tree-scoped oversight dashboard');
  assert.ok(plansJs.includes('if (role === "general_manager" || role === "gm") return false;'), 'plans-review.js must deny GM approval authority');
  assert.ok(reschedJs.includes('if (role === "general_manager" || role === "gm") return false;'), 'reschedule.js must deny GM reschedule of others visits');
  assert.ok(!expJs.includes('userRole === Core.ROLES.GM'), 'activities-tab-expenses.js must NOT give GM global canSeeAll');
  assert.ok(srvJs.includes('role === Core.ROLES.GM') && !srvJs.includes('role === Core.ROLES.ADMIN || role === Core.ROLES.HR || role === Core.ROLES.GM'), 'activities-tab-services.js must scope GM strictly to subordinates');

  // Live VM execution of app.js, plans-review.js & reschedule.js for GM subtree scoping & read-only rules
  const appSandbox = {
    window: {},
    document: {
      documentElement: { setAttribute: () => {} },
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      createElement: () => ({}),
      querySelector: () => null,
      addEventListener: () => {}
    },
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    navigator: {},
    addEventListener: () => {},
    console,
    DEMO_DATA: { users, productLines: lines, areas: [], visits: [{ id: 'v1', repId: 'rep1', status: 'pending_approval' }] },
    store: {
      users: { getAll: () => users },
      productLines: { getAll: () => lines },
      areas: { getAll: () => [] },
      visits: { getAll: () => [{ id: 'v1', repId: 'rep1', status: 'pending_approval' }] }
    }
  };
  appSandbox.window = appSandbox;
  vm.createContext(appSandbox);
  vm.runInContext(appJs, appSandbox);
  const appSubIds = Array.from(appSandbox.window.getAllSubordinates('gm1'), (u) => u.id);
  assert.deepStrictEqual(appSubIds.sort(), ['lm1', 'rep1'], 'app.getAllSubordinates(gm1) must return ONLY subtree users');
  const appGmLines = Array.from(appSandbox.window.getUserLines('gm1'), (l) => l.id);
  assert.deepStrictEqual(appGmLines, ['line1'], 'app.getUserLines(gm1) must return ONLY subordinates line1');
  const appTeamIds = Array.from(appSandbox.window.getScopedTeamForLine('all', users[0]), (u) => u.id);
  assert.ok(!appTeamIds.includes('bu2') && !appTeamIds.includes('rep2'), 'app.getScopedTeamForLine must NOT leak sibling team');
  assert.strictEqual(appSandbox.window.getNavPendingCount('plans-review', users[0]), 0, 'GM must show 0 pending plan approvals badge');

  // plans-review.js VM
  const prSandbox = {
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} },
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    normalizeRole: normalizeRoleFn,
    isRepRole: (u) => normalizeRoleFn(u && u.role) === 'medical_rep',
    getAllSubordinates: appSandbox.window.getAllSubordinates,
    getUserLines: appSandbox.window.getUserLines,
    checkAuth: () => users[0],
    showToast: () => {},
    DEMO_DATA: { users, productLines: lines },
    store: { users: { getAll: () => users }, productLines: { getAll: () => lines } }
  };
  prSandbox.window = prSandbox;
  vm.createContext(prSandbox);
  vm.runInContext(plansJs, prSandbox);
  const scopedReps = Array.from(prSandbox.getScopedSubordinateReps(users[0]), (r) => r.id);
  assert.deepStrictEqual(scopedReps, ['rep1'], 'plans-review must show ONLY subordinate rep1 to GM');
  assert.strictEqual(prSandbox.canUserApproveForRep(users[0], users[2], users), false, 'GM must NOT be able to approve plans for subordinate rep');

  // reschedule.js VM
  const rsSandbox = {
    window: {},
    document: { getElementById: () => null, addEventListener: () => {} },
    localStorage: makeStorage(),
    normalizeRole: normalizeRoleFn,
    getAllSubordinates: appSandbox.window.getAllSubordinates,
    checkAuth: () => users[0],
    DEMO_DATA: { users },
    store: { users: { getAll: () => users } }
  };
  rsSandbox.window = rsSandbox;
  vm.createContext(rsSandbox);
  vm.runInContext(reschedJs, rsSandbox);
  assert.strictEqual(rsSandbox.canManageVisitReschedule(users[0], { repId: 'rep1', status: 'planned' }), false, 'GM must NOT reschedule subordinate rep visit');
  assert.strictEqual(rsSandbox.canManageVisitReschedule(users[0], { repId: 'gm1', status: 'planned' }), false, 'GM is strictly view-only and must NOT reschedule any visit');
  assert.strictEqual(rsSandbox.canManageVisitReschedule(users[2], { repId: 'rep1', status: 'planned' }), true, 'Own visit check remains intact for rep');

  console.log('PASS: GM strict hierarchy scoping & zero-approval view-only oversight across modules');
}

(async function main() {
  await testUsersModule();
  testVisitsModule();
  testGmAcrossActivitiesAndBulkPlanner();
  console.log('\nALL HARDENING TESTS PASSED SUCCESSFULLY!');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
