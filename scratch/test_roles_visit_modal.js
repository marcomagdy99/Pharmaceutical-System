const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Mock browser environment
const domHtml = fs.readFileSync(path.resolve(__dirname, "../visits.html"), "utf8");

function createMockDom() {
  const elements = {};
  const querySelect = (sel) => {
    if (sel.includes('input[name="visitPeriod"]:checked')) {
      return { value: currentPeriod };
    }
    if (sel.includes('input[name="visitType"]:checked')) {
      return { value: "single" };
    }
    return elements[sel] || null;
  };

  const getElemById = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerText: "",
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        dataset: {},
        options: [],
        children: [],
        replaceChildren(...items) {
          this.children = items;
          this.options = items.map(it => ({ value: it.value, text: it.textContent, selected: !!it.selected }));
        },
        appendChild(child) {
          this.children.push(child);
          this.options.push({ value: child.value, text: child.textContent, selected: !!child.selected });
        },
        setAttribute(k, v) { this[k] = v; },
        removeAttribute(k) { delete this[k]; },
        addEventListener() {},
        querySelector(s) { return null; },
        querySelectorAll(s) { return []; }
      };
    }
    return elements[id];
  };

  return { elements, querySelect, getElemById };
}

let currentPeriod = "pm";

// Run test across roles
async function runTests() {
  const storeJs = fs.readFileSync(path.resolve(__dirname, "../js/store.js"), "utf8");
  const appJs = fs.readFileSync(path.resolve(__dirname, "../js/app.js"), "utf8");
  const visitsJs = fs.readFileSync(path.resolve(__dirname, "../js/visits.js"), "utf8");

  // Load Firestore data to simulate exact live state
  const https = require("https");
  const liveData = await new Promise((resolve) => {
    https.get("https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data", res => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => {
        const payload = JSON.parse(JSON.parse(d).fields.payload.stringValue);
        resolve(payload);
      });
    });
  });

  const rolesToTest = [
    { id: "pm2", name: "Fady Adel", role: "product_manager", lineId: "line2" },
    { id: "pm1", name: "Mina Kadry", role: "product_manager", lineId: "line1" },
    { id: "rep1", name: "Marco Magdy", role: "medical_rep", lineId: "line1" },
    { id: "rep4", name: "David Emad", role: "medical_rep", lineId: "line2" },
    { id: "rep2", name: "Kerolos Boules", role: "medical_rep", lineId: "line1" },
    { id: "dm1", name: "Amir Ayoup", role: "district_manager", lineId: "line1" },
    { id: "dm2", name: "Jonathan Erian", role: "district_manager", lineId: "line1" },
    { id: "lm1", name: "John Mahfouz", role: "line_manager", lineId: "line1" },
    { id: "lm2", name: "Mario Magdy", role: "line_manager", lineId: "line_1790626036368" },
    { id: "admin1", name: "System Admin", role: "admin" }
  ];

  console.log(`\n=== Testing Visit Modal Targets Across Roles ===\n`);

  for (const user of rolesToTest) {
    const mock = createMockDom();

    const sandbox = {
      window: {},
      document: {
        getElementById: mock.getElemById,
        querySelector: mock.querySelect,
        querySelectorAll: (sel) => [],
        createElement: (tag) => {
          return {
            tagName: tag.toUpperCase(),
            value: "",
            textContent: "",
            setAttribute(k, v) { this[k] = v; }
          };
        },
        body: { appendChild() {} },
        documentElement: { setAttribute() {} },
        addEventListener: () => {},
        removeEventListener: () => {}
      },
      localStorage: {
        getItem: (k) => k === 'pharmaUser' ? JSON.stringify(user) : null,
        setItem: () => {}
      },
      sessionStorage: {
        getItem: (k) => k === 'pharmaUser' ? JSON.stringify(user) : null,
        setItem: () => {}
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { href: "https://pharmacare-ab4b6.web.app/visits.html", pathname: "/visits.html", replace: () => {} },
      navigator: { onLine: true },
      console: { log: () => {}, warn: () => {}, error: console.error },
      setTimeout: (fn) => fn(),
      clearTimeout: () => {},
      Date: Date,
      Math: Math,
      String: String,
      Array: Array,
      Object: Object,
      Set: Set,
      RegExp: RegExp
    };

    sandbox.window = sandbox;
    sandbox.currentUser = user;
    sandbox.DEMO_DATA = JSON.parse(JSON.stringify(liveData));

    vm.createContext(sandbox);

    vm.runInContext(appJs, sandbox);
    vm.runInContext(storeJs, sandbox);
    vm.runInContext(visitsJs, sandbox);

    // Test 1: Doctor (period = 'pm')
    currentPeriod = "pm";
    sandbox.updateTargetOptions();
    const docSelect = mock.getElemById("visitTarget");
    const docCount = docSelect.children.filter(c => c.value && c.value !== "").length;

    // Test 2: Hospital (period = 'am')
    currentPeriod = "am";
    sandbox.updateTargetOptions();
    const hospSelect = mock.getElemById("visitTarget");
    const hospCount = hospSelect.children.filter(c => c.value && c.value !== "").length;

    // Test 3: Pharmacy (period = 'pharmacy')
    currentPeriod = "pharmacy";
    sandbox.updateTargetOptions();
    const pharmSelect = mock.getElemById("visitTarget");
    const pharmCount = pharmSelect.children.filter(c => c.value && c.value !== "").length;

    console.log(`Role: [${user.role.padEnd(16)}] | User: ${user.name.padEnd(15)} | Docs: ${String(docCount).padStart(2)} | Hosps: ${String(hospCount).padStart(2)} | Pharms: ${String(pharmCount).padStart(2)}`);

    if (docCount === 0 || hospCount === 0 || pharmCount === 0) {
      console.error(`  -> WARNING: Zero targets found for ${user.name}!`);
    }
  }

  console.log(`\n=== All Role Target Checks Completed ===\n`);
}

runTests().catch(console.error);
