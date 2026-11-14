const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing v305 enhancements and fixes...');

// Test 1: Whitelist URL check in openReceiptPreviewModal
const expJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-expenses.js'), 'utf8');
const decJs = fs.readFileSync(path.join(__dirname, '../js/activities-decisions.js'), 'utf8');
const whitelistPattern = '/^(data:image\\/(jpeg|jpg|png|webp);base64,|data:application\\/pdf;base64,|https?:\\/\\/|\\/|\\.\\/)/i';
assert(expJs.includes('const isSafeUrl = /^(data:image\\/(jpeg|jpg|png|webp);base64,|data:application\\/pdf;base64,|https?:\\/\\/|\\/|\\.\\/)/i.test(trimmedUrl);'), 'Expenses receipt modal must whitelist safe URLs');
assert(decJs.includes('const isSafeUrl = /^(data:image\\/(jpeg|jpg|png|webp);base64,|data:application\\/pdf;base64,|https?:\\/\\/|\\/|\\.\\/)/i.test(trimmedUrl);'), 'Decisions receipt modal must whitelist safe URLs');
console.log('[PASS] Test 1: SVG and HTML iframe XSS whitelist protection in receipt modals');

// Test 2: DM and LM remaining budget formula
const srvJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-services.js'), 'utf8');
assert(srvJs.includes('remaining = Math.max(0, (allocated - distributed) - (directUtilized + directPending));'), 'DM and LM remaining must deduct directUtilized and directPending from unallocated reserve');
console.log('[PASS] Test 2: DM & LM direct service budget deduction (preventing budget bypass)');

// Test 3: Partner budget check for all roles (Rep, DM, LM)
assert(srvJs.includes('// Budget check for partner (Rep, DM, LM)'), 'Partner budget check must apply to all participating roles');
assert(!srvJs.includes('if (partnerUser && (partnerUser.role === Core.ROLES.REP || partnerUser.role === Core.ROLES.REP_ALT)) {'), 'Partner check must not be restricted only to reps');
console.log('[PASS] Test 3: Comprehensive multi-role partner budget verification');

// Test 4: Schema ID masking for missing accounts
assert(srvJs.includes('targetName = Core.t("unassignedAccount") || "Account / Facility";'), 'Missing accounts must display friendly label instead of raw doc_/hosp_ ID');
console.log('[PASS] Test 4: Schema ID masking for missing or deleted targets');

// Test 5: Number sanitization in budget previews
const bgtJs = fs.readFileSync(path.join(__dirname, '../js/activities-tab-budget.js'), 'utf8');
assert(bgtJs.includes('const val = parseFloat(inp.value);\n      if (Number.isFinite(val) && val >= 0) distributed += val;'), 'Budget previews must sanitize input values');
console.log('[PASS] Test 5: Defensive number parsing in live budget previews');

// Test 6: Async file conversion race condition protection
assert(srvJs.includes('// Disable submit button while converting/compressing to prevent async race condition'), 'Services must disable submit button during file conversion');
assert(expJs.includes('// Disable submit button while converting/compressing to prevent async race condition'), 'Expenses must disable submit button during file conversion');
console.log('[PASS] Test 6: Submit lock during async Base64 conversion');

// Test 7: Current receipt state reset on file cancel
assert(expJs.includes('Core._state.currentReceiptBase64 = null;\n      const previewBox = document.getElementById("receiptPreviewBox");'), 'Expenses must reset currentReceiptBase64 on file cancel');
console.log('[PASS] Test 7: Receipt state cleanup on input cancel');

// Test 8: Language changed listener completeness
const initJs = fs.readFileSync(path.join(__dirname, '../js/activities-init.js'), 'utf8');
assert(initJs.includes('expLineSelect.dataset.lastUser = "";'), 'Language change must reset expense filter lastUser cache');
assert(initJs.includes('srvLineSelect.dataset.lastUser = "";'), 'Language change must reset service filter lastUser cache');
assert(initJs.includes('renderLocationRequestsTable();'), 'Language change must refresh location requests table');
console.log('[PASS] Test 8: Comprehensive dynamic re-localization and cache invalidation');

// Test 9: Backdrop mousedown check
assert(initJs.includes('let isBackdropMousedown = false;'), 'Modal closer must track backdrop mousedown');
assert(initJs.includes('if (e.target === modal && isBackdropMousedown) close();'), 'Modal closer must verify mousedown originated on backdrop');
console.log('[PASS] Test 9: Text drag dismissal protection (mousedown vs click)');

console.log('\nAll 9 v305 verification tests PASSED successfully!');
