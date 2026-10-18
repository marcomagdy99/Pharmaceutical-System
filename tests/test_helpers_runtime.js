const assert = require("assert");

// Mock browser window environment
global.window = global;
global.document = {
  documentElement: { getAttribute: () => "en", setAttribute: () => {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.window.addEventListener = () => {};
global.crypto = require("crypto").webcrypto;

// Load app.js
require("../js/app.js");

async function runTests() {
  console.log("=== Testing Centralized Utilities ===");

  // 1. Test hashPassword
  assert.strictEqual(typeof window.hashPassword, "function", "window.hashPassword should be a function");
  const hash1 = await window.hashPassword("admin123");
  const hash2 = await window.hashPassword("admin123");
  const hashDiff = await window.hashPassword("password123");
  assert.strictEqual(hash1, hash2, "hashPassword must be deterministic");
  assert.notStrictEqual(hash1, hashDiff, "Different passwords must yield different hashes");
  assert.strictEqual(hash1, "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", "admin123 SHA-256 hash match");
  console.log("  PASS: hashPassword test passed (admin123 hash confirmed)");

  // 2. Test isPlannedVisitExpired
  assert.strictEqual(typeof window.isPlannedVisitExpired, "function", "window.isPlannedVisitExpired should be a function");
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  assert.strictEqual(window.isPlannedVisitExpired(todayStr), false, "Today should not be expired");

  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  assert.strictEqual(window.isPlannedVisitExpired(tenDaysAgo), true, "10 days ago should be expired (> 7 days)");

  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  assert.strictEqual(window.isPlannedVisitExpired(threeDaysAgo), false, "3 days ago should not be expired (< 7 days)");
  console.log("  PASS: isPlannedVisitExpired test passed");

  // 3. Test parseTimeToMinutes
  assert.strictEqual(window.parseTimeToMinutes("10:30"), 630, "10:30 is 630 minutes");
  assert.strictEqual(window.parseTimeToMinutes("02:15 PM"), 855, "02:15 PM is 855 minutes");
  assert.strictEqual(window.parseTimeToMinutes("12:00 AM"), 0, "12:00 AM is 0 minutes");
  console.log("  PASS: parseTimeToMinutes test passed");

  // 4. Test formatVisitDateTime
  const dt = window.formatVisitDateTime("2026-10-04", "14:30", "en");
  assert.strictEqual(dt.date, "2026-10-04");
  assert.strictEqual(dt.time, "14:30");
  assert.strictEqual(dt.dayName, "Sunday");
  console.log("  PASS: formatVisitDateTime test passed");

  // 5. Test getEmployeeLeaveRollover
  window.DEMO_DATA = {
    companySettings: { allowLeaveRollover: true, leaveRolloverMaxDays: 5, leaveRolloverGraceMonths: 3 },
    users: [{ id: "rep1", leaveBalance: { annual: 21 } }],
    leaves: []
  };
  const rollover = window.getEmployeeLeaveRollover("rep1", 2026);
  assert.strictEqual(rollover.maxCap, 5, "Max cap should be 5");
  assert.strictEqual(rollover.initialCarriedOver, 5, "Initial carried over should be 5 (21 unused)");
  console.log("  PASS: getEmployeeLeaveRollover test passed");

  console.log("\nALL RUNTIME TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch(err => {
  console.error("Runtime test failed:", err);
  process.exit(1);
});
