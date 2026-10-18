/**
 * Security Hardenings Test Suite
 * Validates:
 * 1. Immutable Monotonic NetworkTime (Anti-Tampering)
 * 2. Enterprise HTML Sanitization (Anti-XSS)
 * 3. Tamper-Proof Auth Guard & Cryptographic Session Signature (Anti-Impersonation)
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log("=== RUNNING SECURITY HARDENINGS TEST SUITE ===");

// Setup sandbox environment
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
    removeItem: k => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  },
  sessionStorage: {
    getItem: k => (k in mockStorage ? mockStorage[k] : null),
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: k => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  },
  performance: {
    now: () => 5000
  },
  addEventListener: () => {},
  console: {
    log: () => {},
    warn: () => {},
    error: () => {}
  }
};
sandbox.window = sandbox;

const appCode = fs.readFileSync('js/app.js', 'utf8');
vm.createContext(sandbox);
vm.runInContext(appCode, sandbox);

// ----------------------------------------------------------------------------
// TEST 1: NetworkTime Immutability & Tamper Resistance
// ----------------------------------------------------------------------------
console.log("Testing Layer 1: NetworkTime Immutability...");
const originalCheck = sandbox.window.NetworkTime.checkTampering;
assert.strictEqual(typeof originalCheck, 'function');

// Attempt 1: In-console overwrite of window.NetworkTime
try {
  sandbox.window.NetworkTime = { isTampered: false };
} catch (e) {}
assert.strictEqual(sandbox.window.NetworkTime.isTampered, undefined, "FAIL: window.NetworkTime was overwritten!");

// Attempt 2: In-console overwrite of checkTampering method
try {
  sandbox.window.NetworkTime.checkTampering = () => ({ isTampered: false });
} catch (e) {}
assert.strictEqual(sandbox.window.NetworkTime.checkTampering, originalCheck, "FAIL: checkTampering method was overwritten!");
console.log(" Layer 1 PASSED: NetworkTime is completely immutable against console tampering.");

// ----------------------------------------------------------------------------
// TEST 2: Anti-XSS Sanitization & Escaping
// ----------------------------------------------------------------------------
console.log("Testing Layer 2: Anti-XSS Sanitization & Escaping...");
const { escapeHtml, sanitizeHtml } = sandbox.window;

// Test escapeHtml escapes critical characters
const malicious1 = '<script>alert("XSS")</script>';
const escaped1 = escapeHtml(malicious1);
assert.strictEqual(escaped1.includes('<script>'), false);
assert.strictEqual(escaped1.includes('&lt;script&gt;'), true);

const maliciousBacktick = 'Hello `evil code`';
const escapedBacktick = escapeHtml(maliciousBacktick);
assert.strictEqual(escapedBacktick.includes('`'), false);
assert.strictEqual(escapedBacktick.includes('&#96;'), true);

// Test sanitizeHtml strips tags and dangerous on* handlers
const dirty = '<img src="valid.jpg" onerror="alert(document.cookie)"><script>steal()</script><a href="javascript:alert(1)">Click</a>';
const clean = sanitizeHtml(dirty);
assert.strictEqual(clean.includes('<script>'), false);
assert.strictEqual(clean.includes('onerror'), false);
assert.strictEqual(clean.includes('javascript:'), false);
assert.strictEqual(clean.includes('about:blank#blocked:'), true);
console.log(" Layer 2 PASSED: Enterprise Sanitizer & EscapeHtml neutralize all XSS vectors.");

// ----------------------------------------------------------------------------
// TEST 3: Tamper-Proof Auth Guard & Session Signatures
// ----------------------------------------------------------------------------
console.log("Testing Layer 3: Tamper-Proof Auth Guard & Session Integrity...");
const { checkAuth, computeSessionSignature } = sandbox.window;

// Subtest 3A: Legitimate user session with valid signature
const realRep = { id: 'u1790626000001', employeeCode: 'REP-001', role: 'medical_rep', name: 'Marco Magdy' };
const validSig = computeSessionSignature(realRep);
sandbox.localStorage.setItem('pharmaUser', JSON.stringify({ ...realRep, _sig: validSig }));

const authenticatedUser = checkAuth();
assert.strictEqual(authenticatedUser.id, 'u1790626000001');
assert.strictEqual(authenticatedUser.role, 'medical_rep');
assert.strictEqual(authenticatedUser._sig, validSig);
console.log(" Subtest 3A PASSED: Legitimate signed user is authenticated correctly.");

// Subtest 3B: Privilege Escalation Attack (Rep tries to set role to admin in localStorage)
sandbox.localStorage.setItem('pharmaUser', JSON.stringify({
  id: 'u1790626000001',
  employeeCode: 'REP-001',
  role: 'admin', // FORGED ELEVATION!
  _sig: validSig
}));

const escalatedUser = checkAuth();
// System MUST revert forged role back to legitimate registered role ('medical_rep')
assert.strictEqual(escalatedUser.role, 'medical_rep', "FAIL: Forged admin role was not revoked!");
console.log(" Subtest 3B PASSED: Privilege escalation attempt blocked and revoked to registered role.");

// Subtest 3C: Impersonation Attack with Unknown ID
sandbox.localStorage.setItem('pharmaUser', JSON.stringify({
  id: 'hacker_super_admin',
  role: 'admin',
  _sig: 'forged_fake_signature'
}));

const hackerUser = checkAuth();
assert.strictEqual(hackerUser, null, "FAIL: Unrecognized user identity was not rejected!");
assert.strictEqual(sandbox.localStorage.getItem('pharmaUser'), null, "FAIL: Forged session storage was not wiped!");
console.log(" Subtest 3C PASSED: Unrecognized user forgery was rejected and wiped.");

console.log("=== ALL 3 SECURITY HARDENING LAYERS FULLY VERIFIED! ===");
