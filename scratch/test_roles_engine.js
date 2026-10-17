const assert = require('assert');

// Simulate the proposed ROLES engine
const ROLES = Object.freeze({
  ADMIN: "admin",
  GM: "general_manager",
  BU: "business_unit",
  PM: "product_manager",
  LM: "line_manager",
  DM: "district_manager",
  REP: "medical_rep",
  HR: "hr",

  // Long-form aliases
  GENERAL_MANAGER: "general_manager",
  BUSINESS_UNIT: "business_unit",
  PRODUCT_MANAGER: "product_manager",
  LINE_MANAGER: "line_manager",
  DISTRICT_MANAGER: "district_manager",
  MEDICAL_REP: "medical_rep",
});

function normalizeRole(role) {
  if (!role) return "";
  const r = String(role).toLowerCase().trim();
  if (r === "dm" || r === "district_manager" || r === "district manager") return "district_manager";
  if (r === "lm" || r === "line_manager" || r === "line manager") return "line_manager";
  if (r === "bu" || r === "business_unit" || r === "business unit") return "business_unit";
  if (r === "rep" || r === "medical_rep" || r === "medical rep") return "medical_rep";
  if (r === "pm" || r === "product_manager" || r === "product manager") return "product_manager";
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "hr" || r === "human_resources" || r === "human resources") return "hr";
  if (r === "gm" || r === "general_manager" || r === "general manager") return "general_manager";
  return r;
}

function extractRole(userOrRole) {
  if (!userOrRole) return "";
  if (typeof userOrRole === 'object') return normalizeRole(userOrRole.role);
  return normalizeRole(userOrRole);
}

const isDMRole = u => extractRole(u) === "district_manager";
const isLMRole = u => extractRole(u) === "line_manager";
const isBURole = u => extractRole(u) === "business_unit";
const isGMRole = u => extractRole(u) === "general_manager";
const isHRRole = u => extractRole(u) === "hr";
const isAdminRole = u => extractRole(u) === "admin";
const isRepRole = u => extractRole(u) === "medical_rep";
const isPMRole = u => extractRole(u) === "product_manager";
const isRoleMatch = (u, target) => extractRole(u) === normalizeRole(target);

// Tests
assert.strictEqual(isDMRole('dm'), true);
assert.strictEqual(isDMRole('DM'), true);
assert.strictEqual(isDMRole('district_manager'), true);
assert.strictEqual(isDMRole('District Manager'), true);
assert.strictEqual(isDMRole({ role: 'dm' }), true);
assert.strictEqual(isDMRole({ role: 'district_manager' }), true);
assert.strictEqual(isDMRole('lm'), false);

assert.strictEqual(isRoleMatch('dm', ROLES.DM), true);
assert.strictEqual(isRoleMatch('district_manager', ROLES.DISTRICT_MANAGER), true);
assert.strictEqual(isRoleMatch({ role: 'medical_rep' }, ROLES.REP), true);
assert.strictEqual(isRoleMatch({ role: 'rep' }, ROLES.MEDICAL_REP), true);

console.log('ALL TESTS PASSED WITH 100% ACCURACY!');
