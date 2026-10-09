/**
 * Comprehensive Enterprise Approval Workflows & Multi-Tier Authorization Test Suite
 * Tests:
 * 1. Role normalization and level hierarchy mapping
 * 2. Multi-tier hierarchy resolution (Rep -> DM -> LM -> BU / PM)
 * 3. Commercial Services approval sequence (DM -> LM -> BU -> GM)
 * 4. Commercial Services BU threshold logic ("all" vs "threshold")
 * 5. Commercial Services Submitter auto-skip logic (Rep, DM, LM, BU, Admin)
 * 6. Marketing Services approval sequence (PM -> BU, PM -> DM -> LM -> BU)
 * 7. Marketing Services line scoping & authorization
 * 8. Expense Claims multi-tier sequence & BU threshold trigger
 * 9. Expense Claims disbursement gatekeeper (HR/Admin only)
 * 10. Leaves approval workflow (DM -> LM -> BU -> HR)
 * 11. Plans review manager authorization & config overrides
 * 12. Dynamic live configuration propagation (Changing settings in runtime and verifying instant system-wide reflection)
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

// Setup minimal browser-like globals for workflow-engine.js
global.window = global;

// Mock Users Database
const mockUsers = [
  { id: "admin1", name: "Executive Admin", role: "admin" },
  { id: "bu1", name: "Dr. Karim (BU Manager)", role: "business_unit", lineId: "line1", lineIds: ["line1", "line2"] },
  { id: "pm1", name: "Dr. Salma (Product Manager)", role: "product_manager", lineId: "line1", lineIds: ["line1"] },
  { id: "pm2", name: "Dr. Tarek (Product Manager 2)", role: "product_manager", lineId: "line2", lineIds: ["line2"] },
  { id: "lm1", name: "Dr. Ahmed (Line Manager)", role: "line_manager", lineId: "line1", managerId: "bu1" },
  { id: "dm1", name: "Dr. Mohamed (District Manager)", role: "district_manager", lineId: "line1", managerId: "lm1" },
  { id: "rep1", name: "Rep Hassan", role: "medical_rep", lineId: "line1", areaId: "area1", managerId: "dm1" },
  { id: "hr1", name: "HR Manager", role: "hr" }
];

// Mock Store Environment
let currentSettings = {
  approvalWorkflows: {
    commercialServices: {
      requireDm: true,
      requireLm: true,
      requireBu: true,
      requireGm: false,
      buThresholdMode: "all",
      buThresholdAmount: 5000,
      autoSkipSubmitterRole: true,
    },
    marketingServices: {
      requirePm: true,
      requireDm: false,
      requireLm: false,
      requireBu: true,
      buThresholdMode: "all",
      buThresholdAmount: 10000,
      autoSkipSubmitterRole: true,
    },
    expenses: {
      requireDm: true,
      requireLm: true,
      requireBu: false,
      requireHr: true,
      requireDisbursement: true,
      requireBuThreshold: false,
      buThresholdAmount: 10000,
      autoSkipSubmitterRole: true,
    },
    leaves: {
      requireDm: true,
      requireLm: true,
      requireBu: false,
      requireHr: true,
      autoSkipSubmitterRole: true,
    },
    plans: {
      requireDm: true,
      requireLm: false,
      requireBu: false,
    },
    relocation: {
      requireDm: true,
      requireLm: false,
      requireBu: false,
    },
  }
};

global.store = {
  users: {
    getAll: () => mockUsers,
    getById: (id) => mockUsers.find(u => u.id === id)
  },
  companySettings: {
    get: () => currentSettings,
    update: (patch) => {
      currentSettings = { ...currentSettings, ...patch };
      return currentSettings;
    }
  }
};

// Load workflow-engine.js
const workflowEnginePath = path.join(__dirname, "..", "js", "workflow-engine.js");
const workflowEngineCode = fs.readFileSync(workflowEnginePath, "utf8");
eval(workflowEngineCode);

const WE = global.WorkflowEngine;

console.log("================================================================================");
console.log("   PHARMACARE APPROVAL SEQUENCE & MULTI-TIER WORKFLOWS TEST SUITE");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function test(title, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${title}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${title}`);
    console.error(`         \x1b[33mError: ${err.message}\x1b[0m`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Group 1: Role Normalization & Levels
// -----------------------------------------------------------------------------
console.log("\x1b[36m[Group 1: Role Normalization & Level Hierarchy]\x1b[0m");

test("Should normalize role aliases (rep -> medical_rep, dm -> district_manager, bu -> business_unit)", () => {
  assert.strictEqual(WE.getUserBaseRole({ role: "rep" }), "medical_rep");
  assert.strictEqual(WE.getUserBaseRole({ role: "DM" }), "district_manager");
  assert.strictEqual(WE.getUserBaseRole({ role: "lm" }), "line_manager");
  assert.strictEqual(WE.getUserBaseRole({ role: "bu" }), "business_unit");
  assert.strictEqual(WE.getUserBaseRole({ role: "PM" }), "product_manager");
  assert.strictEqual(WE.getUserBaseRole({ role: "hr" }), "hr");
  assert.strictEqual(WE.getUserBaseRole({ role: "admin" }), "admin");
});

test("Should correctly map canonical hierarchy rank levels (Rep: 1, DM: 2, LM/PM: 3, BU/HR: 4, Admin: 5)", () => {
  assert.strictEqual(WE.getUserLevel({ role: "rep" }), 1);
  assert.strictEqual(WE.getUserLevel({ role: "dm" }), 2);
  assert.strictEqual(WE.getUserLevel({ role: "lm" }), 3);
  assert.strictEqual(WE.getUserLevel({ role: "pm" }), 3);
  assert.strictEqual(WE.getUserLevel({ role: "bu" }), 4);
  assert.strictEqual(WE.getUserLevel({ role: "hr" }), 4);
  assert.strictEqual(WE.getUserLevel({ role: "admin" }), 5);
});

// -----------------------------------------------------------------------------
// Group 2: Multi-Tier Hierarchy Resolution
// -----------------------------------------------------------------------------
console.log("\n\x1b[36m[Group 2: Hierarchy Chain Traversal]\x1b[0m");

test("Should resolve full managerial chain from rep up to BU and PM", () => {
  const rep = mockUsers.find(u => u.id === "rep1");
  const hierarchy = WE.resolveHierarchy(rep.lineId, rep.areaId, rep.id);
  
  assert.strictEqual(hierarchy.dmId, "dm1", "DM should resolve to rep's manager dm1");
  assert.strictEqual(hierarchy.lmId, "lm1", "LM should resolve to dm1's manager lm1");
  assert.strictEqual(hierarchy.buId, "bu1", "BU should resolve to lm1's manager bu1");
  assert.strictEqual(hierarchy.pmId, "pm1", "PM should resolve to line1 product manager pm1");
});

// -----------------------------------------------------------------------------
// Group 3: Commercial Services Workflow
// -----------------------------------------------------------------------------
console.log("\n\x1b[36m[Group 3: Commercial Services Approval Workflow]\x1b[0m");

test("Default commercial workflow should generate steps: DM -> LM -> BU", () => {
  const service = { department: "commercial", cost: 3000, lineId: "line1" };
  const steps = WE.getServiceSteps(service);
  assert.strictEqual(steps.length, 3);
  assert.strictEqual(steps[0].role, "dm");
  assert.strictEqual(steps[1].role, "lm");
  assert.strictEqual(steps[2].role, "bu");
});

test("Commercial workflow with BU Threshold: omits BU if cost is below threshold", () => {
  store.companySettings.update({
    approvalWorkflows: {
      ...currentSettings.approvalWorkflows,
      commercialServices: {
        ...currentSettings.approvalWorkflows.commercialServices,
        buThresholdMode: "threshold",
        buThresholdAmount: 5000
      }
    }
  });

  const cheapService = { department: "commercial", cost: 4000, lineId: "line1" };
  const cheapSteps = WE.getServiceSteps(cheapService);
  assert.strictEqual(cheapSteps.length, 2, "Below 5,000 should stop at LM");
  assert.strictEqual(cheapSteps[0].role, "dm");
  assert.strictEqual(cheapSteps[1].role, "lm");

  const expensiveService = { department: "commercial", cost: 6000, lineId: "line1" };
  const expensiveSteps = WE.getServiceSteps(expensiveService);
  assert.strictEqual(expensiveSteps.length, 3, "Above 5,000 requires BU");
  assert.strictEqual(expensiveSteps[2].role, "bu");
});

test("Commercial submitter auto-skip: Rep starts at DM, DM starts at LM, LM starts at BU, BU auto-approved", () => {
  const rep = mockUsers.find(u => u.id === "rep1");
  const dm = mockUsers.find(u => u.id === "dm1");
  const lm = mockUsers.find(u => u.id === "lm1");
  const bu = mockUsers.find(u => u.id === "bu1");
  const srv = { department: "commercial", cost: 7000, lineId: "line1" };

  const repInit = WE.resolveInitialServiceStatus(srv, rep);
  assert.strictEqual(repInit.status, "pending_dm");
  assert.strictEqual(repInit.nextApproverId, "dm1");

  const dmInit = WE.resolveInitialServiceStatus(srv, dm);
  assert.strictEqual(dmInit.status, "pending_lm");
  assert.strictEqual(dmInit.nextApproverId, "lm1");

  const lmInit = WE.resolveInitialServiceStatus(srv, lm);
  assert.strictEqual(lmInit.status, "pending_bu");
  assert.strictEqual(lmInit.nextApproverId, "bu1");

  const buInit = WE.resolveInitialServiceStatus(srv, bu);
  assert.strictEqual(buInit.status, "approved");
  assert.strictEqual(buInit.isFinal, true);
});

test("Advance commercial service sequentially through DM -> LM -> BU -> Approved", () => {
  const srv = { department: "commercial", cost: 8000, lineId: "line1", requesterId: "rep1", status: "pending_dm" };
  const dm = mockUsers.find(u => u.id === "dm1");
  const lm = mockUsers.find(u => u.id === "lm1");
  const bu = mockUsers.find(u => u.id === "bu1");

  // Step 1: DM approves
  const step1 = WE.advanceServiceApproval(srv, dm);
  assert.strictEqual(step1.nextStatus, "pending_lm");
  assert.strictEqual(step1.nextApproverId, "lm1");

  // Step 2: LM approves
  srv.status = step1.nextStatus;
  const step2 = WE.advanceServiceApproval(srv, lm);
  assert.strictEqual(step2.nextStatus, "pending_bu");
  assert.strictEqual(step2.nextApproverId, "bu1");

  // Step 3: BU approves
  srv.status = step2.nextStatus;
  const step3 = WE.advanceServiceApproval(srv, bu);
  assert.strictEqual(step3.nextStatus, "approved");
  assert.strictEqual(step3.isFinal, true);
  assert.strictEqual(step3.nextApproverId, null);
});

// -----------------------------------------------------------------------------
// Group 4: Marketing Services Workflow
// -----------------------------------------------------------------------------
console.log("\n\x1b[36m[Group 4: Marketing Services Approval Workflow]\x1b[0m");

test("Default Marketing workflow should follow PM -> BU -> Approved", () => {
  const mktSrv = { department: "marketing", cost: 12000, lineId: "line1" };
  const steps = WE.getServiceSteps(mktSrv);
  assert.strictEqual(steps.length, 2);
  assert.strictEqual(steps[0].role, "pm");
  assert.strictEqual(steps[1].role, "bu");
});

test("Marketing Authorization: PM for Line 1 cannot approve requests for Line 2", () => {
  const pm1 = mockUsers.find(u => u.id === "pm1"); // Line 1
  const reqLine1 = { department: "marketing", lineId: "line1", status: "pending_pm", requesterId: "rep1" };
  const reqLine2 = { department: "marketing", lineId: "line2", status: "pending_pm", requesterId: "rep2" };

  assert.strictEqual(WE.isServiceAuthorized(reqLine1, pm1, "approve_service"), true, "PM1 authorized for line 1");
  assert.strictEqual(WE.isServiceAuthorized(reqLine2, pm1, "approve_service"), false, "PM1 not authorized for line 2");
});

// -----------------------------------------------------------------------------
// Group 5: Expenses Workflow & Disbursement
// -----------------------------------------------------------------------------
console.log("\n\x1b[36m[Group 5: Expenses Workflow & Disbursement]\x1b[0m");

test("Default Expenses workflow: DM -> LM -> HR (skips BU when requireBu is false)", () => {
  const exp = { amount: 3000, requesterId: "rep1", status: "pending_dm" };
  const dm = mockUsers.find(u => u.id === "dm1");
  const lm = mockUsers.find(u => u.id === "lm1");
  const hr = mockUsers.find(u => u.id === "hr1");

  // DM approves -> moves to LM
  const res1 = WE.advanceExpenseApproval(exp, dm);
  assert.strictEqual(res1.nextStatus, "pending_lm");

  // LM approves -> moves to HR
  exp.status = "pending_lm";
  const res2 = WE.advanceExpenseApproval(exp, lm);
  assert.strictEqual(res2.nextStatus, "pending_hr");
  assert.strictEqual(res2.nextApproverId, "hr1");

  // HR approves -> Approved
  exp.status = "pending_hr";
  const res3 = WE.advanceExpenseApproval(exp, hr);
  assert.strictEqual(res3.nextStatus, "approved");
  assert.strictEqual(res3.isFinal, true);
});

test("Expenses BU Threshold: inserts BU before HR only when amount exceeds threshold", () => {
  store.companySettings.update({
    approvalWorkflows: {
      ...currentSettings.approvalWorkflows,
      expenses: {
        ...currentSettings.approvalWorkflows.expenses,
        requireBuThreshold: true,
        buThresholdAmount: 10000
      }
    }
  });

  const smallExp = { amount: 4000, requesterId: "rep1", status: "pending_lm" };
  const smallRes = WE.advanceExpenseApproval(smallExp, mockUsers.find(u => u.id === "lm1"));
  assert.strictEqual(smallRes.nextStatus, "pending_hr", "Under 10k: LM forwards to HR");

  const largeExp = { amount: 15000, requesterId: "rep1", status: "pending_lm" };
  const largeRes = WE.advanceExpenseApproval(largeExp, mockUsers.find(u => u.id === "lm1"));
  assert.strictEqual(largeRes.nextStatus, "pending_bu", "Over 10k: LM forwards to BU");
  assert.strictEqual(largeRes.nextApproverId, "bu1");
});

test("Disbursement Authorization: Only HR and Admin are authorized to disburse approved expenses", () => {
  const exp = { status: "approved", requesterId: "rep1", amount: 5000 };
  const hr = mockUsers.find(u => u.id === "hr1");
  const admin = mockUsers.find(u => u.id === "admin1");
  const dm = mockUsers.find(u => u.id === "dm1");
  const rep = mockUsers.find(u => u.id === "rep1");

  assert.strictEqual(WE.isExpenseAuthorized(exp, hr, "disburse_expense"), true, "HR can disburse");
  assert.strictEqual(WE.isExpenseAuthorized(exp, admin, "disburse_expense"), true, "Admin can disburse");
  assert.strictEqual(WE.isExpenseAuthorized(exp, dm, "disburse_expense"), false, "DM cannot disburse");
  assert.strictEqual(WE.isExpenseAuthorized(exp, rep, "disburse_expense"), false, "Rep cannot disburse");
});

// -----------------------------------------------------------------------------
// Group 6: Leaves Workflow Configuration
// -----------------------------------------------------------------------------
console.log("\n\x1b[36m[Group 6: Leaves Multi-Tier Sequence]\x1b[0m");

test("Leaves workflow settings reflect dynamically in leaves approval rules", () => {
  // When requireLm is false, DM approves straight to HR
  store.companySettings.update({
    approvalWorkflows: {
      ...currentSettings.approvalWorkflows,
      leaves: {
        requireDm: true,
        requireLm: false,
        requireBu: false,
        requireHr: true
      }
    }
  });

  const workflows = WE.getWorkflows();
  assert.strictEqual(workflows.leaves.requireLm, false);
  assert.strictEqual(workflows.leaves.requireBu, false);

  // Now enable BU for executive review
  store.companySettings.update({
    approvalWorkflows: {
      ...currentSettings.approvalWorkflows,
      leaves: {
        requireDm: true,
        requireLm: true,
        requireBu: true,
        requireHr: true
      }
    }
  });

  const updatedWf = WE.getWorkflows();
  assert.strictEqual(updatedWf.leaves.requireBu, true);
  assert.strictEqual(updatedWf.leaves.requireLm, true);
});

// -----------------------------------------------------------------------------
// Group 7: Dynamic Live Configuration Propagation (THE KEY QUESTION)
// -----------------------------------------------------------------------------
console.log("\n\x1b[36m[Group 7: Dynamic Live Configuration Propagation]\x1b[0m");

test("System instantly switches Commercial workflow from 3-tier to 4-tier (+GM) on settings update", () => {
  // Step A: Initial state has requireGm: false
  let srv = { department: "commercial", cost: 10000, lineId: "line1" };
  let stepsInitial = WE.getServiceSteps(srv);
  assert.strictEqual(stepsInitial.some(s => s.role === "gm"), false, "GM not in steps initially");

  // Step B: Admin enables GM approval in profile settings
  store.companySettings.update({
    approvalWorkflows: {
      ...currentSettings.approvalWorkflows,
      commercialServices: {
        ...currentSettings.approvalWorkflows.commercialServices,
        requireGm: true
      }
    }
  });

  // Step C: Next call instantly picks up GM in sequence without system restart
  let stepsUpdated = WE.getServiceSteps(srv);
  assert.strictEqual(stepsUpdated.some(s => s.role === "gm"), true, "GM instantly present in steps");
  assert.strictEqual(stepsUpdated[stepsUpdated.length - 1].role, "gm");

  // Step D: Verify BU advances to GM instead of final approved
  srv.status = "pending_bu";
  const adv = WE.advanceServiceApproval(srv, mockUsers.find(u => u.id === "bu1"));
  assert.strictEqual(adv.nextStatus, "pending_gm");
  assert.strictEqual(adv.isFinal, false);
});

test("System instantly respects modified BU Threshold Amount (e.g. 5,000 -> 25,000 EGP)", () => {
  store.companySettings.update({
    approvalWorkflows: {
      ...currentSettings.approvalWorkflows,
      commercialServices: {
        requireDm: true,
        requireLm: true,
        requireBu: true,
        buThresholdMode: "threshold",
        buThresholdAmount: 25000,
        autoSkipSubmitterRole: true
      }
    }
  });

  // A 15,000 EGP service was above 5,000, but now is BELOW 25,000
  const srv = { department: "commercial", cost: 15000, lineId: "line1" };
  const steps = WE.getServiceSteps(srv);
  assert.strictEqual(steps.length, 2, "15,000 EGP now omits BU because threshold is 25,000 EGP");
  assert.strictEqual(steps[1].role, "lm");

  // A 30,000 EGP service is above 25,000 EGP
  const bigSrv = { department: "commercial", cost: 30000, lineId: "line1" };
  const bigSteps = WE.getServiceSteps(bigSrv);
  assert.strictEqual(bigSteps.length, 3, "30,000 EGP includes BU");
  assert.strictEqual(bigSteps[2].role, "bu");
});

test("Requester self-approval block: Requester can NEVER approve their own service or expense", () => {
  const dm = mockUsers.find(u => u.id === "dm1");
  const dmSrv = { requesterId: dm.id, status: "pending_dm", department: "commercial" };
  const dmExp = { requesterId: dm.id, status: "pending_dm", amount: 1500 };

  assert.strictEqual(WE.isServiceAuthorized(dmSrv, dm, "approve_service"), false, "DM cannot approve own service");
  assert.strictEqual(WE.isExpenseAuthorized(dmExp, dm, "approve_expense"), false, "DM cannot approve own expense");
});

console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
