const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Mock browser environment
const mockStorage = {};
const sandbox = {
  window: {},
  document: {
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {}
  },
  localStorage: {
    getItem: k => (k in mockStorage ? mockStorage[k] : null),
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: k => { delete mockStorage[k]; }
  },
  navigator: {},
  addEventListener: () => {},
  console: console
};
sandbox.window = sandbox;

const code = fs.readFileSync('js/app.js', 'utf8');
vm.createContext(sandbox);

try {
  vm.runInContext(code, sandbox);
  console.log('js/app.js executed cleanly in sandbox!');
} catch (e) {
  console.error('Execution error:', e);
  process.exit(1);
}

const {
  ROLES, normalizeRole, extractUserRole, isAdmin, isManagerRole, isRepRole, isPMRole, isDMRole, isLMRole, isBURole, isGMRole, isHRRole, isRoleMatch, hasAnyRole, getRoleBadge,
  STORAGE_KEYS, StorageUtil,
  STATUS, normalizeStatus, getStatusBadgeConfig, renderStatusBadge, isStatusPending, isStatusApproved, isStatusRejected,
  formatCurrency, formatEGP, formatDate, formatNumber
} = sandbox.window;

// 1. Check ROLES object
assert.strictEqual(ROLES.ADMIN, 'admin');
assert.strictEqual(ROLES.GM, 'general_manager');
assert.strictEqual(ROLES.BU, 'business_unit');
assert.strictEqual(ROLES.PM, 'product_manager');
assert.strictEqual(ROLES.LM, 'line_manager');
assert.strictEqual(ROLES.DM, 'district_manager');
assert.strictEqual(ROLES.REP, 'medical_rep');
assert.strictEqual(ROLES.HR, 'hr');
assert.strictEqual(Object.isFrozen(ROLES), true);

// 2. Test Predicates with strings and objects
assert.strictEqual(isDMRole('dm'), true);
assert.strictEqual(isDMRole('district_manager'), true);
assert.strictEqual(isDMRole({ role: 'dm' }), true);
assert.strictEqual(isDMRole({ role: 'rep' }), false);

assert.strictEqual(isLMRole('lm'), true);
assert.strictEqual(isBURole('bu'), true);
assert.strictEqual(isGMRole('gm'), true);
assert.strictEqual(isHRRole('hr'), true);
assert.strictEqual(isRepRole('rep'), true);
assert.strictEqual(isPMRole('pm'), true);
assert.strictEqual(isAdmin('admin'), true);

assert.strictEqual(isManagerRole('dm'), true);
assert.strictEqual(isManagerRole('rep'), false);

assert.strictEqual(isRoleMatch('dm', ROLES.DM), true);
assert.strictEqual(isRoleMatch('rep', ROLES.REP), true);

// 3. Test getRoleBadge
assert.strictEqual(getRoleBadge('dm'), 'District Manager');
assert.strictEqual(getRoleBadge('rep'), 'Medical Rep');
assert.strictEqual(getRoleBadge('bu'), 'BU Head');
assert.strictEqual(getRoleBadge('lm'), 'Line Manager');
assert.strictEqual(getRoleBadge('gm'), 'General Manager');
assert.strictEqual(getRoleBadge('hr'), 'HR Manager');

// 4. Test STORAGE_KEYS and StorageUtil
assert.strictEqual(STORAGE_KEYS.USER, 'pharmaUser');
assert.strictEqual(STORAGE_KEYS.THEME, 'pharmaTheme');
assert.strictEqual(STORAGE_KEYS.USER_ROLE, 'userRole');
assert.strictEqual(STORAGE_KEYS.USER_ID, 'userId');
assert.strictEqual(Object.isFrozen(STORAGE_KEYS), true);
assert.strictEqual(Object.isFrozen(StorageUtil), true);

assert.strictEqual(StorageUtil.get(STORAGE_KEYS.THEME, 'light'), 'light');
StorageUtil.set(STORAGE_KEYS.THEME, 'dark');
assert.strictEqual(StorageUtil.get(STORAGE_KEYS.THEME), 'dark');

const demoUser = { id: 'u001', name: 'Dr. Test', role: 'admin' };
StorageUtil.set(STORAGE_KEYS.USER, demoUser);
assert.deepEqual(StorageUtil.get(STORAGE_KEYS.USER), demoUser);

StorageUtil.remove(STORAGE_KEYS.USER);
assert.strictEqual(StorageUtil.get(STORAGE_KEYS.USER), null);

// 5. Test STATUS & Status Badges
assert.strictEqual(STATUS.APPROVED, 'approved');
assert.strictEqual(STATUS.PENDING, 'pending');
assert.strictEqual(STATUS.REJECTED, 'rejected');
assert.strictEqual(STATUS.COMPLETED, 'completed');
assert.strictEqual(Object.isFrozen(STATUS), true);

assert.strictEqual(renderStatusBadge(STATUS.APPROVED), '<span class="badge bg-success status-badge">Approved</span>');
assert.strictEqual(renderStatusBadge('Approved'), '<span class="badge bg-success status-badge">Approved</span>');
assert.strictEqual(renderStatusBadge('pending_dm'), '<span class="badge bg-warning text-dark status-badge">Pending DM</span>');
assert.strictEqual(renderStatusBadge('rejected'), '<span class="badge bg-danger status-badge">Rejected</span>');
assert.strictEqual(renderStatusBadge('pending_lm', 'Waiting for Supervisor'), '<span class="badge bg-info text-dark status-badge">Waiting for Supervisor</span>');

assert.strictEqual(isStatusPending('pending_dm'), true);
assert.strictEqual(isStatusPending('Pending BU'), true);
assert.strictEqual(isStatusPending('approved'), false);

assert.strictEqual(isStatusApproved('approved'), true);
assert.strictEqual(isStatusApproved('Completed'), true);
assert.strictEqual(isStatusApproved('pending'), false);

assert.strictEqual(isStatusRejected('rejected'), true);
assert.strictEqual(isStatusRejected('Cancelled'), true);

// 6. Test Formatters (Currency, Number, Date)
assert.strictEqual(formatCurrency(1250.5), "1,250.50 EGP");
assert.strictEqual(formatCurrency(0), "0.00 EGP");
assert.strictEqual(formatCurrency(null), "0.00 EGP");
assert.strictEqual(formatCurrency(undefined), "0.00 EGP");
assert.strictEqual(formatCurrency("invalid"), "0.00 EGP");
assert.strictEqual(formatCurrency(5000, "USD", 0), "5,000 USD");

assert.strictEqual(formatEGP(1250), "1,250");
assert.strictEqual(formatEGP(1250.75, true), "1,250.75 EGP");

assert.strictEqual(formatDate("2026-10-16"), "2026-10-16");
assert.strictEqual(formatDate("2026-10-16", "DD/MM/YYYY"), "16/10/2026");
assert.strictEqual(formatDate("2026-10-16", "DD/MM"), "16/10");
assert.strictEqual(formatDate("2026-10-16", "human"), "16 Oct 2026");
assert.strictEqual(formatDate(null), "");
assert.strictEqual(formatDate("invalid"), "");

assert.strictEqual(formatNumber(1000000), "1,000,000");
assert.strictEqual(formatNumber(null), "0");

console.log('ALL LIVE ROLES, STORAGE, STATUS & FORMATTER CHECKS PASSED WITH 100% SUCCESS!');
