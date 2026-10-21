/**
 * Test Suite: Manager ID, Hierarchy Synchronization, and Direct Reports
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log("=== RUNNING HIERARCHY & MANAGER ID TEST SUITE ===");

// 1. Setup Sandbox
const mockLocalStorage = {};
const mockSessionStorage = {};
const elements = {};

function createMockEl(id, tagName = "div") {
  return {
    id,
    tagName: tagName.toUpperCase(),
    value: "",
    disabled: false,
    innerHTML: "",
    textContent: "",
    style: {},
    children: [],
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    addEventListener: () => {}
  };
}

[
  "profileNameDisplay", "fullName", "email", "phone", "empCodeInput",
  "hireDateInput", "productLineInput", "managerInput", "profileInitials",
  "profileRoleBadge", "profileEmpBadge", "profileAreaBadge",
  "directReportsCard", "directReportsContainer", "directReportsCountBadge",
  "adminSystemManagementCard", "adminCompanySettingsCard", "adminApprovalSequenceCard",
  "adminManageUsersShortcut", "annualLeaveText", "annualLeaveProgress",
  "sickLeaveText", "sickLeaveProgress", "emergencyLeaveText", "emergencyLeaveProgress",
  "unpaidLeaveText", "unpaidLeaveProgress"
].forEach(id => {
  elements[id] = createMockEl(id);
});

const sandbox = {
  window: {},
  document: {
    documentElement: { setAttribute: () => {} },
    getElementById: (id) => elements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  localStorage: {
    getItem: (k) => (k in mockLocalStorage ? mockLocalStorage[k] : null),
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
  },
  sessionStorage: {
    getItem: (k) => (k in mockSessionStorage ? mockSessionStorage[k] : null),
    setItem: (k, v) => { mockSessionStorage[k] = String(v); },
    removeItem: (k) => { delete mockSessionStorage[k]; },
    clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); }
  },
  performance: { now: () => 5000 },
  addEventListener: () => {},
  console: console
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// Run auth-service.js
const authServiceCode = fs.readFileSync('js/auth-service.js', 'utf8');
vm.runInContext(authServiceCode, sandbox);

// Run app.js
const appCode = fs.readFileSync('js/app.js', 'utf8');
vm.runInContext(appCode, sandbox);

// TEST 1: checkAuth() hydrates managerId from registered user database
console.log("Test 1: checkAuth() hydrates managerId when missing from session...");
const repWithoutManager = {
  id: "u1790626000001", // Marco Magdy
  name: "Marco Magdy",
  role: "medical_rep",
  employeeCode: "REP-001"
  // managerId is intentionally omitted
};
const sig = sandbox.window.computeSessionSignature(repWithoutManager);
repWithoutManager._sig = sig;
sandbox.sessionStorage.setItem("pharmaUser", JSON.stringify(repWithoutManager));

const verifiedUser = sandbox.window.checkAuth();
assert.ok(verifiedUser, "User should be verified");
assert.strictEqual(verifiedUser.managerId, "u1790626000014", "managerId must be hydrated from registered DEMO_DATA to Amir Ayoup (u1790626000014)");
console.log(" PASS: checkAuth() correctly hydrated managerId:", verifiedUser.managerId);

// TEST 2: Self-healing in loadDataFromStorage()
console.log("Test 2: loadDataFromStorage() repairs users missing managerId...");
const damagedMasterData = {
  users: [
    { id: "u1790626000014", name: "Amir Ayoup", role: "district_manager" }, // managerId missing
    { id: "u1790626000012", name: "John Mahfouz", role: "line_manager" }   // managerId missing
  ]
};
sandbox.localStorage.setItem("pharma_master_data", JSON.stringify(damagedMasterData));
const loaded = sandbox.window.loadDataFromStorage();
const repairedAmir = loaded.users.find(u => u.id === "u1790626000014");
const repairedJohn = loaded.users.find(u => u.id === "u1790626000012");
assert.strictEqual(repairedAmir.managerId, "u1790626000012", "Amir Ayoup managerId should be healed to John Mahfouz");
assert.strictEqual(repairedJohn.managerId, "u1790626000011", "John Mahfouz managerId should be healed to George Marzok");
console.log(" PASS: loadDataFromStorage() healed damaged users with correct managerIds.");

// TEST 3: Profile display for Rep (Manager Name + Role + Line)
console.log("Test 3: Profile displays manager name with role and product line for Rep...");
const profileCode = fs.readFileSync('js/profile.js', 'utf8');
vm.runInContext(profileCode, sandbox);

// Log in as Marco Magdy
sandbox.sessionStorage.setItem("pharmaUser", JSON.stringify({
  id: "u1790626000001",
  role: "medical_rep",
  name: "Marco Magdy",
  employeeCode: "REP-001"
}));
sandbox.window.loadUserProfile();

const managerValRep = elements.managerInput.value;
console.log(" Manager display for Rep Marco Magdy:", managerValRep);
assert.ok(managerValRep.includes("Amir Ayoup"), "Manager must be Amir Ayoup");
assert.ok(managerValRep.includes("District Manager"), "Must include District Manager role");
assert.ok(managerValRep.includes("Cardio Line") || managerValRep.includes("Line"), "Must include product line name");
assert.strictEqual(elements.directReportsCard.style.display, "none", "Direct reports card should be hidden for Rep");
console.log(" PASS: Rep profile shows manager with role/line and hides direct reports card.");

// TEST 4: Profile display for District Manager (Amir Ayoup) with Direct Reports
console.log("Test 4: Profile displays manager and Direct Reports for District Manager...");
sandbox.sessionStorage.setItem("pharmaUser", JSON.stringify({
  id: "u1790626000014",
  role: "district_manager",
  name: "Amir Ayoup",
  employeeCode: "DM-001"
}));
sandbox.window.loadUserProfile();

const managerValDm = elements.managerInput.value;
console.log(" Manager display for DM Amir Ayoup:", managerValDm);
assert.ok(managerValDm.includes("John Mahfouz"), "Manager must be John Mahfouz");
assert.ok(managerValDm.includes("Line Manager"), "Must include Line Manager role");
assert.strictEqual(elements.directReportsCard.style.display, "block", "Direct reports card must be visible for DM");
assert.ok(elements.directReportsCountBadge.textContent.includes("4 Members"), "DM Amir Ayoup must have 4 direct reports");
assert.ok(elements.directReportsContainer.innerHTML.includes("Marco Magdy"), "Must list Marco Magdy");
assert.ok(elements.directReportsContainer.innerHTML.includes("David Emad"), "Must list David Emad");
assert.ok(elements.directReportsContainer.innerHTML.includes("Marina Shobra"), "Must list Marina Shobra");
assert.ok(elements.directReportsContainer.innerHTML.includes("Monica Shobra"), "Must list Monica Shobra");
console.log(" PASS: DM profile shows John Mahfouz as manager and correctly renders all 4 direct reports!");

// TEST 5: Profile display for Line Manager (John Mahfouz)
console.log("Test 5: Profile displays manager and Direct Reports for Line Manager...");
sandbox.sessionStorage.setItem("pharmaUser", JSON.stringify({
  id: "u1790626000012",
  role: "line_manager",
  name: "John Mahfouz",
  employeeCode: "LM-001"
}));
sandbox.window.loadUserProfile();

const managerValLm = elements.managerInput.value;
console.log(" Manager display for LM John Mahfouz:", managerValLm);
assert.ok(managerValLm.includes("George Marzok"), "Manager must be George Marzok");
assert.ok(managerValLm.includes("Business Unit"), "Must include Business Unit role");
assert.strictEqual(elements.directReportsCard.style.display, "block", "Direct reports card must be visible for LM");
assert.ok(elements.directReportsContainer.innerHTML.includes("Amir Ayoup"), "Must list Amir Ayoup as direct report");
assert.ok(elements.directReportsContainer.innerHTML.includes("Jonathan Erian"), "Must list Jonathan Erian as direct report");
console.log(" PASS: LM profile shows George Marzok as manager and renders District Managers as direct reports!");

// TEST 6: Profile display for Admin
console.log("Test 6: Profile displays Executive Management for Admin...");
sandbox.sessionStorage.setItem("pharmaUser", JSON.stringify({
  id: "u1790626000010",
  role: "admin",
  name: "System Admin",
  employeeCode: "ADM-001"
}));
sandbox.window.loadUserProfile();

const managerValAdmin = elements.managerInput.value;
console.log(" Manager display for Admin:", managerValAdmin);
assert.strictEqual(managerValAdmin, "Executive Management", "Admin must display Executive Management");
console.log(" PASS: Admin profile displays Executive Management.");

console.log("\n=== ALL HIERARCHY, MANAGER ID & DIRECT REPORTS TESTS PASSED PERFECTLY! ===");
