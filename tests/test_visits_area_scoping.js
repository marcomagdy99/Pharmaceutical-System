/**
 * @file test_visits_area_scoping.js
 * Verifies that the Area Filter dropdown on visits.html strictly scopes areas
 * to the manager's hierarchy (DMs only see their team's areas, not areas of other DMs,
 * and vacant areas without explicit DM assignment in multi-DM lines do not leak).
 */

const assert = require("assert");
const fs = require("fs");

console.log("=== RUNNING VISITS AREA SCOPING & HIERARCHY TEST ===");

// 1. Mock browser environment
const domMock = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      const defVal = id.toLowerCase().includes("search") ? "" : "all";
      this.elements[id] = {
        id,
        value: defVal,
        options: [],
        innerHTML: "",
        style: {},
        classList: { add() {}, remove() {} },
        addEventListener() {},
        replaceChildren() {},
      };
    }
    return this.elements[id];
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {},
};

global.document = domMock;
global.window = global;
global.visitsApp = {};
global.window.visitsApp = global.visitsApp;
global.window.location = { href: "visits.html", pathname: "visits.html", replace() {} };
global.window.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.sessionStorage = {
  getItem: (key) => {
    if (key === "pharma_user") return JSON.stringify(global.currentUser);
    return null;
  },
  setItem: () => {},
  removeItem: () => {},
};
global.escapeHtml = (s) => String(s || "");

require("../js/app.js");
require("../js/store.js");

global.checkAuth = () => global.currentUser;

const visitsCode = fs.readFileSync("js/visits.js", "utf8");
eval(visitsCode);

// Setup users & areas in window.DEMO_DATA
const allUsers = window.DEMO_DATA.users;
const amir = allUsers.find((u) => u.name === "Amir Ayoup");
const jonathan = allUsers.find((u) => u.name === "Jonathan Erian");
const marco = allUsers.find((u) => u.name === "Marco Magdy");
const mohamedRamadan = allUsers.find((u) => u.name === "Mohamed Ramadan");

assert.ok(amir, "Amir Ayoup DM must exist");
assert.ok(jonathan, "Jonathan Erian DM must exist");
assert.ok(marco, "Marco Magdy rep must exist");
assert.ok(mohamedRamadan, "Mohamed Ramadan rep must exist");

// Add test areas into store / DEMO_DATA
const testAreas = [
  { id: "area_dokki_vacant", name: "Dokki", lineId: "line_1790626000001", repId: null }, // Vacant in Line 1 (multi-DM line)
  { id: "area_maadi_vacant", name: "Maadi", lineId: "line_1790626000002", repId: null }, // Vacant in Line 2 (multi-DM line)
  { id: "area_mohndseen", name: "Mohndseen", lineId: "line_1790626000001", repId: marco.id },
  { id: "area_nasr", name: "Nasr City", lineId: "line_1790626000001", repId: marco.id },
  { id: "area_amir_vacant", name: "Amir Assigned Vacant", lineId: "line_1790626000001", repId: null, dmId: amir.id },
];
window.DEMO_DATA.areas = testAreas;

// Scenario 1: Amir Ayoup (DM) views All Team in Line
global.currentUser = amir;
global.currentUserRole = "district_manager";
global.isManager = true;
domMock.getElementById("filterRep").value = "all";
domMock.getElementById("filterLine").value = "all";

const amirAreas = window.getAvailableAreas();
const amirAreaNames = amirAreas.map((a) => a.name);
console.log("Amir Ayoup available areas:", amirAreaNames);

assert.ok(amirAreaNames.includes("Mohndseen"), "Amir must see Mohndseen (Marco's area)");
assert.ok(amirAreaNames.includes("Nasr City"), "Amir must see Nasr City (Marco's area)");
assert.ok(amirAreaNames.includes("Amir Assigned Vacant"), "Amir must see vacant area explicitly assigned to him");
assert.ok(!amirAreaNames.includes("Dokki"), "Amir must NOT see Dokki [Vacant] (unassigned vacant area in multi-DM line)!");
assert.ok(!amirAreaNames.includes("Maadi"), "Amir must NOT see Maadi [Vacant] (unassigned vacant area in multi-DM line)!");
console.log(" PASS: Dokki [Vacant] and Maadi [Vacant] are correctly excluded for Amir Ayoup.");

// Scenario 2: Amir filters by Marco Magdy specifically
domMock.getElementById("filterRep").value = marco.id;
const marcoFilteredAreas = window.getAvailableAreas();
const marcoFilteredNames = marcoFilteredAreas.map((a) => a.name);
console.log("Marco filtered areas for Amir:", marcoFilteredNames);

assert.ok(marcoFilteredNames.includes("Mohndseen"), "Must see Mohndseen");
assert.ok(marcoFilteredNames.includes("Nasr City"), "Must see Nasr City");
assert.ok(!marcoFilteredNames.includes("Dokki"), "Must NOT see Dokki");
assert.ok(!marcoFilteredNames.includes("Maadi"), "Must NOT see Maadi");
console.log(" PASS: Specific rep filter accurately scopes to only that rep's areas.");

// Scenario 3: Admin sees all areas
global.currentUser = allUsers.find((u) => u.role === "admin");
global.currentUserRole = "admin";
global.isManager = true;
domMock.getElementById("filterRep").value = "all";

const adminAreas = window.getAvailableAreas();
const adminAreaNames = adminAreas.map((a) => a.name);
console.log("Admin available areas count:", adminAreas.length);
assert.ok(adminAreaNames.includes("Dokki"), "Admin sees Dokki");
assert.ok(adminAreaNames.includes("Maadi"), "Admin sees Maadi");
assert.ok(adminAreaNames.includes("Mohndseen"), "Admin sees Mohndseen");
console.log(" PASS: Admin sees all areas.");

console.log("\n=== ALL VISITS AREA SCOPING TESTS PASSED (100%) ===");
