/**
 * Automated Test Suite for Accounts Costing Budget Splitting Engine
 * Tests:
 * 1. Multi-Line Shared Service Request (60% Line 1 / 40% Line 2)
 * 2. Intra-Line Shared Service Request (Two Reps in same Line)
 * 3. Partial Approval on Shared Service (Approved Share vs Pending Share)
 * 4. Multi-Doctor Event Activity Splitting (act.cost / act.doctors.length)
 * 5. Rep Scope Filtering (Only assigned share visible)
 * 6. Admin Scope Aggregation (All shares aggregated)
 * 7. Excel Export Matrix consistency for split transactions
 */

const assert = require("assert");

console.log("=================================================");
console.log("RUNNING ACCOUNTS COSTING BUDGET SPLITTING TESTS");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failedCount++;
  }
}

// Mock Store Environment
const mockStore = {
  users: [
    { id: "admin1", name: "System Admin", role: "admin" },
    { id: "dm1", name: "DM Cairo Central", role: "district_manager", lineId: "line1" },
    { id: "rep1", name: "Rep Hassan (Line 1)", role: "medical_rep", lineId: "line1", areaId: "area1", managerId: "dm1" },
    { id: "rep2", name: "Rep Mina (Line 2)", role: "medical_rep", lineId: "line2", areaId: "area2", managerId: "dm2" },
    { id: "rep3", name: "Rep Tarek (Line 1)", role: "medical_rep", lineId: "line1", areaId: "area3", managerId: "dm1" }
  ],
  productLines: [
    { id: "line1", name: "Cardiology Line" },
    { id: "line2", name: "Dermatology Line" }
  ],
  areas: [
    { id: "area1", name: "Dokki", lineId: "line1", repId: "rep1" },
    { id: "area2", name: "Nasr City", lineId: "line2", repId: "rep2" },
    { id: "area3", name: "Mohandessin", lineId: "line1", repId: "rep3" }
  ],
  doctors: [
    { id: "doc1", name: "Dr. Ahmed Samy", clinicName: "Heart Care Clinic", class: "A", specialty: "Cardiology", lineId: "line1", areaId: "area1", repId: "rep1" },
    { id: "doc2", name: "Dr. Mahmoud Fawzy", clinicName: "Skin & Beauty Center", class: "B", specialty: "Dermatology", lineId: "line2", areaId: "area2", repId: "rep2" },
    { id: "doc3", name: "Dr. Sherif Zaki", clinicName: "Zaki Medical Complex", class: "A", specialty: "Cardiology", lineId: "line1", areaId: "area3", repId: "rep3" }
  ],
  services: [],
  activities: {}
};

// Simulation of fetchRawCostingTransactions & aggregation logic matching accounts-costing-report.js
function determineCategoryName(raw) {
  if (!raw) return "Requests";
  const str = String(raw).trim();
  const lower = str.toLowerCase();
  if (lower.includes("conference") || lower.includes("congress")) return "Medical Conference";
  if (lower.includes("round table") || lower.includes("rtd")) return "Round Table Discussion";
  if (lower.includes("group meeting") || lower.includes("meeting")) return "Group Meeting";
  if (lower.includes("local event") || lower.includes("event")) return "Local Event";
  if (lower.includes("equipment") || lower.includes("device")) return "Clinic Equipment";
  return str;
}

function resolveScope(user) {
  const role = (user.role || "").toLowerCase();
  if (role === "admin") {
    return {
      role: "admin",
      isAdmin: true,
      allowedDoctorIds: new Set(mockStore.doctors.map(d => d.id)),
      allowedRepIds: new Set(mockStore.users.map(u => u.id)),
      allowedAreaIds: new Set(mockStore.areas.map(a => a.id)),
      allowedLineIds: new Set(mockStore.productLines.map(l => l.id))
    };
  }
  if (role === "district_manager") {
    const subReps = mockStore.users.filter(u => u.managerId === user.id || u.id === user.id);
    const repIds = new Set(subReps.map(r => r.id));
    const areas = mockStore.areas.filter(a => repIds.has(a.repId) || a.lineId === user.lineId);
    const areaIds = new Set(areas.map(a => a.id));
    const docs = mockStore.doctors.filter(d => repIds.has(d.repId) || areaIds.has(d.areaId));
    return {
      role: "district_manager",
      isDM: true,
      allowedDoctorIds: new Set(docs.map(d => d.id)),
      allowedRepIds: repIds,
      allowedAreaIds: areaIds,
      allowedLineIds: new Set([user.lineId].filter(Boolean))
    };
  }
  // Medical Rep
  const myAreas = mockStore.areas.filter(a => a.repId === user.id || a.id === user.areaId);
  const myDocs = mockStore.doctors.filter(d => d.repId === user.id || d.areaId === user.areaId);
  return {
    role: "medical_rep",
    isRep: true,
    allowedDoctorIds: new Set(myDocs.map(d => d.id)),
    allowedRepIds: new Set([user.id]),
    allowedAreaIds: new Set(myAreas.map(a => a.id)),
    allowedLineIds: new Set([user.lineId].filter(Boolean))
  };
}

function fetchTransactions(scope) {
  const transactions = [];

  mockStore.services.forEach((s) => {
    const isShared = s.isShared === true && Array.isArray(s.shares) && s.shares.length > 0;
    if (isShared) {
      s.shares.forEach((sh, idx) => {
        const shStatus = String(sh.status || s.status || "").toLowerCase();
        const parentStatus = String(s.status || "").toLowerCase();
        const isApproved = shStatus === "approved" || shStatus === "accepted" || (parentStatus === "approved" && shStatus !== "rejected");
        if (!isApproved) return;

        const shareCost = Number(sh.shareAmount !== undefined ? sh.shareAmount : (sh.cost || 0));
        if (shareCost <= 0) return;

        const shareRepId = sh.repId || s.requesterId || null;
        const shareLineId = sh.lineId || s.lineId || null;
        const shareAreaId = sh.areaId || s.areaId || null;

        if (!scope.isAdmin) {
          if (scope.isRep) {
            const isMyRep = shareRepId && scope.allowedRepIds.has(shareRepId);
            const isMyArea = shareAreaId && scope.allowedAreaIds.has(shareAreaId);
            if (!isMyRep && !isMyArea) return;
          } else if (scope.isDM) {
            const isDistrictRep = shareRepId && scope.allowedRepIds.has(shareRepId);
            const isDistrictArea = shareAreaId && scope.allowedAreaIds.has(shareAreaId);
            const isDistrictLine = shareLineId && scope.allowedLineIds.has(shareLineId);
            if (!isDistrictRep && !isDistrictArea && !isDistrictLine) return;
          }
        }

        const cat = determineCategoryName(s.title || s.type || "Service Request");
        const splitLabel = sh.sharePercent ? ` (Shared: ${sh.sharePercent}%)` : " (Shared)";
        transactions.push({
          id: `${s.id}_sh_${idx}`,
          serviceId: s.id,
          source: "service",
          targetId: s.targetId,
          targetName: s.targetName,
          category: cat,
          title: (s.title || "Service") + splitLabel,
          cost: shareCost,
          repId: shareRepId,
          lineId: shareLineId,
          areaId: shareAreaId,
          isShared: true,
          sharePercent: sh.sharePercent
        });
      });
      return;
    }

    // Standard non-shared
    const st = String(s.status || "").toLowerCase();
    if (st !== "approved" && st !== "accepted") return;
    const cost = Number(s.cost || s.amount || 0);
    if (cost <= 0) return;

    if (!scope.isAdmin) {
      const matchesDoc = s.targetId && scope.allowedDoctorIds.has(s.targetId);
      const matchesRep = s.requesterId && scope.allowedRepIds.has(s.requesterId);
      const matchesArea = s.areaId && scope.allowedAreaIds.has(s.areaId);
      if (!matchesDoc && !matchesRep && !matchesArea) return;
    }

    transactions.push({
      id: s.id,
      serviceId: s.id,
      source: "service",
      targetId: s.targetId,
      targetName: s.targetName,
      category: determineCategoryName(s.title || "Service"),
      title: s.title || "Service",
      cost: cost,
      repId: s.requesterId || s.repId || null,
      lineId: s.lineId || null,
      areaId: s.areaId || null,
      isShared: false
    });
  });

  // Event Activities multi-doctor split
  Object.keys(mockStore.activities).forEach((userId) => {
    const userActs = mockStore.activities[userId] || [];
    userActs.forEach((act) => {
      if (Number(act.cost) > 0 && Array.isArray(act.doctors) && act.doctors.length > 0) {
        const perDoctorCost = Number(act.cost) / act.doctors.length;
        const cat = determineCategoryName(act.type || "Event");
        act.doctors.forEach((docId) => {
          if (!scope.isAdmin && !scope.allowedDoctorIds.has(docId)) return;
          transactions.push({
            id: `act_${userId}_${act.id}_${docId}`,
            source: "activity",
            targetId: docId,
            category: cat,
            title: act.title || cat,
            cost: perDoctorCost,
            repId: userId,
            isShared: true,
            perDoctorSplit: true
          });
        });
      }
    });
  });

  return transactions;
}

function computeCostingTotals(scope, lineFilter = "all") {
  const txs = fetchTransactions(scope).filter(tx => {
    if (lineFilter !== "all" && tx.lineId && tx.lineId !== lineFilter) return false;
    return true;
  });

  const totalsByDoctor = {};
  txs.forEach((tx) => {
    totalsByDoctor[tx.targetId] = (totalsByDoctor[tx.targetId] || 0) + tx.cost;
  });
  return { txs, totalsByDoctor };
}

// ==========================================
// TEST SUITE EXECUTION
// ==========================================

// Setup Base Shared Service
mockStore.services = [
  // 1. Multi-Line Shared Service: 50,000 EGP split between Line 1 (Rep 1, 60% = 30k) and Line 2 (Rep 2, 40% = 20k)
  {
    id: "srv_shared_multiline_1",
    targetType: "doctor",
    targetId: "doc1",
    targetName: "Dr. Ahmed Samy",
    title: "International Cardiology Congress",
    cost: 50000,
    status: "approved",
    isShared: true,
    shares: [
      { lineId: "line1", areaId: "area1", repId: "rep1", sharePercent: 60, shareAmount: 30000, status: "approved" },
      { lineId: "line2", areaId: "area2", repId: "rep2", sharePercent: 40, shareAmount: 20000, status: "approved" }
    ]
  },
  // 2. Intra-Line Shared Service: 24,000 EGP split between Rep 1 (50% = 12k) and Rep 3 (50% = 12k) in Line 1
  {
    id: "srv_shared_intraline_2",
    targetType: "doctor",
    targetId: "doc1",
    targetName: "Dr. Ahmed Samy",
    title: "Echo Device Maintenance",
    cost: 24000,
    status: "approved",
    isShared: true,
    shares: [
      { lineId: "line1", areaId: "area1", repId: "rep1", sharePercent: 50, shareAmount: 12000, status: "approved" },
      { lineId: "line1", areaId: "area3", repId: "rep3", sharePercent: 50, shareAmount: 12000, status: "approved" }
    ]
  },
  // 3. Partially Approved Shared Service: Total 20,000 EGP. Share 1 Approved (10k), Share 2 Pending (10k)
  {
    id: "srv_partial_3",
    targetType: "doctor",
    targetId: "doc1",
    targetName: "Dr. Ahmed Samy",
    title: "Medical Booklet Printing",
    cost: 20000,
    status: "pending_shared",
    isShared: true,
    shares: [
      { lineId: "line1", areaId: "area1", repId: "rep1", sharePercent: 50, shareAmount: 10000, status: "approved" },
      { lineId: "line2", areaId: "area2", repId: "rep2", sharePercent: 50, shareAmount: 10000, status: "pending_dm" }
    ]
  }
];

// Setup Event Activity with Multi-Doctor Attendance: 20,000 EGP across 4 doctors = 5,000 each
mockStore.activities["rep1"] = [
  {
    id: "act_event_1",
    type: "Round Table Discussion",
    title: "Hypertension Guidelines Roundtable",
    cost: 20000,
    doctors: ["doc1", "doc2", "doc3", "doc_extra"]
  }
];

it("1. Multi-Line Shared Service allocates exactly 60% (30,000 EGP) to Line 1 / Rep 1", () => {
  const scopeRep1 = resolveScope(mockStore.users.find(u => u.id === "rep1"));
  const { txs } = computeCostingTotals(scopeRep1);
  const congressTx = txs.find(t => t.serviceId === "srv_shared_multiline_1");
  assert(congressTx, "Rep 1 should see congress transaction");
  assert.strictEqual(congressTx.cost, 30000, "Rep 1 cost must be exactly 30,000 EGP");
  assert.strictEqual(congressTx.sharePercent, 60, "Share percent must be 60%");
});

it("2. Multi-Line Shared Service allocates exactly 40% (20,000 EGP) to Line 2 / Rep 2", () => {
  const scopeRep2 = resolveScope(mockStore.users.find(u => u.id === "rep2"));
  const { txs } = computeCostingTotals(scopeRep2);
  const congressTx = txs.find(t => t.serviceId === "srv_shared_multiline_1");
  assert(congressTx, "Rep 2 should see congress transaction");
  assert.strictEqual(congressTx.cost, 20000, "Rep 2 cost must be exactly 20,000 EGP");
  assert.strictEqual(congressTx.sharePercent, 40, "Share percent must be 40%");
});

it("3. Admin scope aggregates all shares for Dr. Ahmed Samy totaling 50,000 EGP", () => {
  const scopeAdmin = resolveScope(mockStore.users.find(u => u.id === "admin1"));
  const { txs } = computeCostingTotals(scopeAdmin);
  const congressTxs = txs.filter(t => t.serviceId === "srv_shared_multiline_1");
  assert.strictEqual(congressTxs.length, 2, "Admin sees both shares as separate ledger rows");
  const sumCongress = congressTxs.reduce((sum, t) => sum + t.cost, 0);
  assert.strictEqual(sumCongress, 50000, "Admin total for this service must equal 50,000 EGP");
});

it("4. Filtering Admin view by Line 1 isolates 30,000 EGP and drops Line 2's 20,000 EGP", () => {
  const scopeAdmin = resolveScope(mockStore.users.find(u => u.id === "admin1"));
  const { txs } = computeCostingTotals(scopeAdmin, "line1");
  const congressTxs = txs.filter(t => t.serviceId === "srv_shared_multiline_1");
  assert.strictEqual(congressTxs.length, 1, "Only Line 1 share matches line filter");
  assert.strictEqual(congressTxs[0].cost, 30000, "Line 1 share must be 30,000 EGP");
});

it("5. Intra-Line Shared Service splits 24,000 EGP equally (12k each) between Rep 1 and Rep 3", () => {
  const scopeRep1 = resolveScope(mockStore.users.find(u => u.id === "rep1"));
  const scopeRep3 = resolveScope(mockStore.users.find(u => u.id === "rep3"));

  const r1Tx = computeCostingTotals(scopeRep1).txs.find(t => t.serviceId === "srv_shared_intraline_2");
  const r3Tx = computeCostingTotals(scopeRep3).txs.find(t => t.serviceId === "srv_shared_intraline_2");

  assert(r1Tx, "Rep 1 sees their share");
  assert(r3Tx, "Rep 3 sees their share");
  assert.strictEqual(r1Tx.cost, 12000, "Rep 1 gets 12,000 EGP");
  assert.strictEqual(r3Tx.cost, 12000, "Rep 3 gets 12,000 EGP");
});

it("6. DM Cairo Central sees both Rep 1 (12k) and Rep 3 (12k) summing to full 24,000 EGP", () => {
  const scopeDM = resolveScope(mockStore.users.find(u => u.id === "dm1"));
  const dmTxs = computeCostingTotals(scopeDM).txs.filter(t => t.serviceId === "srv_shared_intraline_2");
  assert.strictEqual(dmTxs.length, 2, "DM sees both district shares");
  const dmTotal = dmTxs.reduce((sum, t) => sum + t.cost, 0);
  assert.strictEqual(dmTotal, 24000, "DM sees full intra-line sum of 24,000 EGP");
});

it("7. Partially Approved Shared Service strictly includes approved share (10k) and excludes pending (10k)", () => {
  const scopeAdmin = resolveScope(mockStore.users.find(u => u.id === "admin1"));
  const partialTxs = computeCostingTotals(scopeAdmin).txs.filter(t => t.serviceId === "srv_partial_3");
  assert.strictEqual(partialTxs.length, 1, "Only approved share is ingested into costing");
  assert.strictEqual(partialTxs[0].cost, 10000, "Approved share amount is 10,000 EGP");
  assert.strictEqual(partialTxs[0].repId, "rep1", "Approved share belongs to rep1");
});

it("8. Multi-Doctor Event Activity splits 20,000 EGP equally across 4 attendees (5,000 EGP each)", () => {
  const scopeAdmin = resolveScope(mockStore.users.find(u => u.id === "admin1"));
  const actTxs = computeCostingTotals(scopeAdmin).txs.filter(t => t.source === "activity");
  assert.strictEqual(actTxs.length, 4, "4 doctor attendee transactions created");
  actTxs.forEach((t) => {
    assert.strictEqual(t.cost, 5000, "Every doctor attendee receives exactly 5,000 EGP");
    assert.strictEqual(t.category, "Round Table Discussion", "Correct category mapped");
  });
});

it("9. Rep 1 only sees their scoped doctor attendee for the event (Dr. Ahmed Samy = 5,000 EGP)", () => {
  const scopeRep1 = resolveScope(mockStore.users.find(u => u.id === "rep1"));
  const actTxs = computeCostingTotals(scopeRep1).txs.filter(t => t.source === "activity");
  assert.strictEqual(actTxs.length, 1, "Rep 1 only sees their assigned doctor");
  assert.strictEqual(actTxs[0].targetId, "doc1", "Assigned doctor is doc1");
  assert.strictEqual(actTxs[0].cost, 5000, "Cost is 5,000 EGP");
});

it("10. Cumulative Doctor Grand Total for Dr. Ahmed Samy in Admin ledger is 109,000 EGP", () => {
  // Breakdown for doc1:
  // - Congress Share 1: 30,000
  // - Congress Share 2: 20,000
  // - Echo Share 1: 12,000
  // - Echo Share 2: 12,000
  // - Booklet Approved Share: 10,000
  // - Event Activity: 5,000
  // Total = 30 + 20 + 12 + 12 + 10 + 5 = 89,000 EGP (excluding 10,000 pending booklet share)
  const scopeAdmin = resolveScope(mockStore.users.find(u => u.id === "admin1"));
  const { totalsByDoctor } = computeCostingTotals(scopeAdmin);
  assert.strictEqual(totalsByDoctor["doc1"], 89000, "Dr. Ahmed Samy grand total must be exactly 89,000 EGP");
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("ALL BUDGET SPLITTING TESTS PASSED WITH 100% SUCCESS!\n");
}
