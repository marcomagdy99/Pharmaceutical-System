const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Testing v306 Enhancements and Bug Fixes ---');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
};

// 1. Load activities-core.js
require('../js/activities-core.js');
const Core = global.ActivitiesCore;
assert(Core, 'ActivitiesCore should be defined');
assert(typeof Core.normalizeRole === 'function', 'Core.normalizeRole should be a function');
assert(typeof Core.getNormalizedRole === 'function', 'Core.getNormalizedRole should be a function');

// Test Role Normalization
assert.strictEqual(Core.normalizeRole('dm'), 'district_manager');
assert.strictEqual(Core.normalizeRole('LM'), 'line_manager');
assert.strictEqual(Core.normalizeRole('bu'), 'business_unit');
assert.strictEqual(Core.normalizeRole('rep'), 'medical_rep');
assert.strictEqual(Core.normalizeRole('pm'), 'product_manager');
assert.strictEqual(Core.normalizeRole('admin'), 'admin');
assert.strictEqual(Core.normalizeRole('gm'), 'general_manager');
assert.strictEqual(Core.getNormalizedRole({ role: 'dm' }), 'district_manager');
assert.strictEqual(Core.getNormalizedRole({ role: 'BU' }), 'business_unit');
console.log('✓ Test 1: Core.normalizeRole & Core.getNormalizedRole pass');

// Test Translation Keys
assert(Core.t('weekendHolidayNotice'), 'weekendHolidayNotice key should be present in en');
assert(Core.t('weekendPmNotice'), 'weekendPmNotice key should be present in en');
console.log('✓ Test 2: Weekend notice translation keys pass');

// 2. Test File Inspection for v306 Requirements
const rootDir = path.join(__dirname, '..');

// Test activities-tab-services.js
const srvContent = fs.readFileSync(path.join(rootDir, 'js/activities-tab-services.js'), 'utf8');
assert(!srvContent.includes('onclick="ActivitiesModule.openDecisionModal(\'service\''), 'Services table should not contain inline onclick decision modals');
assert(srvContent.includes('data-service-action="approve"'), 'Services table should use data-service-action for approve');
assert(srvContent.includes('data-service-action="reject"'), 'Services table should use data-service-action for reject');
assert(srvContent.includes('dateInp.value = Core.formatDate((window.getSystemDate && window.getSystemDate()) || new Date())'), 'openServiceModal should default to real-time date');
console.log('✓ Test 3: activities-tab-services.js event delegation & real-time date pass');

// Test activities-tab-expenses.js
const expContent = fs.readFileSync(path.join(rootDir, 'js/activities-tab-expenses.js'), 'utf8');
assert(!expContent.includes('onclick="ActivitiesModule.openDecisionModal(\'expense\''), 'Expenses table should not contain inline onclick decision modals');
assert(expContent.includes('data-expense-action="approve"'), 'Expenses table should use data-expense-action for approve');
assert(expContent.includes('data-expense-action="reject"'), 'Expenses table should use data-expense-action for reject');
assert(expContent.includes('data-expense-action="disburse"'), 'Expenses table should use data-expense-action for disburse');
assert(expContent.includes('dateInp.value = Core.formatDate((window.getSystemDate && window.getSystemDate()) || new Date())'), 'openExpenseModal should default to real-time date');
console.log('✓ Test 4: activities-tab-expenses.js event delegation & real-time date pass');

// Test activities-tab-budget.js
const bgtContent = fs.readFileSync(path.join(rootDir, 'js/activities-tab-budget.js'), 'utf8');
assert(bgtContent.includes('lmFloor = Math.max(existingDmSum, lmUtilized + lmPending)'), 'saveBuBudgetAllocations should protect pending requests in floor');
assert(bgtContent.includes('repFloor = repUtilized + repPending'), 'saveDmRepAllocations should protect pending requests in floor');
assert(bgtContent.includes('dmFloor = Math.max(existingRepSum, dmUtilized + dmPending)'), 'saveDmAllocations should protect pending requests in floor');
console.log('✓ Test 5: activities-tab-budget.js pending floor protection passes');

// Test activities-tab-daily.js
const dlyContent = fs.readFileSync(path.join(rootDir, 'js/activities-tab-daily.js'), 'utf8');
assert(dlyContent.includes('isSecondaryDay'), 'activities-tab-daily.js should check secondary weekend days');
assert(dlyContent.includes('secMode === "pm_only" && period === Core.PERIODS.PM'), 'activities-tab-daily.js should support PM-only weekend mode');
assert(dlyContent.includes('weekendHolidayNotice'), 'activities-tab-daily.js should warn using weekendHolidayNotice');
console.log('✓ Test 6: activities-tab-daily.js secondary company weekend rules pass');

// Test activities-init.js
const initContent = fs.readFileSync(path.join(rootDir, 'js/activities-init.js'), 'utf8');
assert(initContent.includes('Core.getSubordinatesForUser(currentUser).some(s => s.id === targetRepId)'), 'activities-init.js should scope BU/LM/DM location requests strictly to subordinates/hierarchy');
assert(!initContent.includes('role === "admin" || role === "general_manager" || role === "business_unit") return true;'), 'activities-init.js must not leak cross-BU requests unconditionally');
console.log('✓ Test 7: activities-init.js cross-BU location scoping passes');

console.log('=== All v306 targeted tests PASSED (7/7)! ===');
