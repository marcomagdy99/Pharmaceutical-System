const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing v304 enhancements and fixes...');

// Test 1: BU access in activities-init.js
const initJs = fs.readFileSync(path.join(__dirname, '../js/activities-init.js'), 'utf8');
assert(!initJs.includes('if (tabId === Core.TABS.SERVICES && role === Core.ROLES.BU)'), 'BU must not be blocked from switching to services tab');
assert(!initJs.includes('if (role === Core.ROLES.BU && tabBtnServices) tabBtnServices.style.display = "none"'), 'BU must not have services tab button hidden');
console.log('[PASS] Test 1: BU services tab authorization');

// Test 2: PM line isolation in activities-tab-services.js
const srvJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-services.js'), 'utf8');
assert(!srvJs.includes('if (srv.department === "marketing") return true;'), 'PM must not leak marketing services across lines');
console.log('[PASS] Test 2: PM cross-line marketing leak removed');

// Test 3: XSS escaping in activities-tab-expenses.js
const expJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-expenses.js'), 'utf8');
assert(expJs.includes('const dmName = Core.escapeHTML(Core.getUserDisplayName(nextApproverId));'), 'dmName must be escaped in expense badge');
assert(expJs.includes('const lmName = Core.escapeHTML(Core.getUserDisplayName(nextApproverId));'), 'lmName must be escaped in expense badge');
assert(expJs.includes('${Core.escapeHTML(reqName)} submitted an expense claim'), 'reqName must be escaped in expense notification');
console.log('[PASS] Test 3: XSS sanitization in expenses status badge and notifications');

// Test 4: Notification escaping in activities-tab-services.js
assert(srvJs.includes('Core.escapeHTML(newService.title)'), 'Service title must be escaped in notifications');
assert(srvJs.includes('Core.escapeHTML(creatorName)'), 'Creator name must be escaped in notifications');
console.log('[PASS] Test 4: Notification string sanitization in services');

// Test 5: Double submit protection in handleServiceSubmit
assert(srvJs.includes('const submitBtn = document.getElementById("btnSubmitService")'), 'Submit button must be captured in handleServiceSubmit');
assert(srvJs.includes('submitBtn.disabled = true;'), 'Submit button must be disabled upon submit');
console.log('[PASS] Test 5: Double submit protection in services form');

// Test 6: Shared balance cent absorption in recalculateSharedBalances
assert(srvJs.includes('Math.abs(totalAllocatedPercent - 100) < 0.01 && Core._state.sharedLines.length > 0'), 'recalculateSharedBalances must absorb rounding discrepancy');
console.log('[PASS] Test 6: Live shared balance cent discrepancy absorption');

// Test 7: DM rep utilization in activities-tab-budget.js
const bgtJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-budget.js'), 'utf8');
assert(bgtJs.includes('repsUnderDmIds.has(s.requesterId)'), 'dmUtilized must count services from reps under the DM');
assert(bgtJs.includes('repsUnderDmIds.has(sh.repId)'), 'dmUtilized must count shared services from reps under the DM');
console.log('[PASS] Test 7: DM rep utilization tracking in budget distribution');

// Test 8: Friday check in daily
const dlyJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-daily.js'), 'utf8');
assert(dlyJs.includes('const [y, m, d] = curDateStr.split("-").map(Number);'), 'Friday check must use local date parsing');
console.log('[PASS] Test 8: Local date parsing for Friday weekend check');

// Test 9: Redundant keydown listener removed from decisions
const decJs = fs.readFileSync(path.join(__dirname, '../js/activities-decisions.js'), 'utf8');
assert(!decJs.includes('// Keyboard Accessibility: Close active modal on Escape key press'), 'Redundant Escape listener must be removed from decisions');
console.log('[PASS] Test 9: Single source of truth for Escape key handler');

// Test 10: Session cache check in populateServiceFilters
assert(srvJs.includes('lineSelect.dataset.lastUser !== currentUserId'), 'populateServiceFilters must check lastUser cache');
console.log('[PASS] Test 10: Service budget line select user cache synchronization');

console.log('\nAll 10 v304 tests PASSED successfully!');
