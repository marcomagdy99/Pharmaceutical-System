const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createMockDom() {
  const elements = {};
  const querySelect = (sel) => {
    if (sel.includes('input[name="visitPeriod"]:checked')) return { value: currentPeriod };
    if (sel.includes('input[name="visitType"]:checked')) return { value: "single" };
    return elements[sel] || null;
  };

  elements["toastContainer"] = {
    id: "toastContainer",
    appendChild: () => {},
    children: []
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

async function runTest() {
  const storeJs = fs.readFileSync(path.resolve(__dirname, "../js/store.js"), "utf8");
  const appJs = fs.readFileSync(path.resolve(__dirname, "../js/app.js"), "utf8");
  const visitsJs = fs.readFileSync(path.resolve(__dirname, "../js/visits.js"), "utf8");

  const mock = createMockDom();
  const testUser = { id: "pm2", name: "Fady Adel", role: "product_manager", lineId: "line2" };

  const sandbox = {
    window: {},
    document: {
      getElementById: mock.getElemById,
      querySelector: mock.querySelect,
      querySelectorAll: (sel) => [],
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          value: "",
          textContent: "",
          className: "",
          classList: { add() {}, remove() {} },
          remove() {},
          children: [],
          appendChild(c) { this.children.push(c); },
          setAttribute(k, v) { this[k] = v; }
        };
        return el;
      },
      body: { appendChild() {} },
      documentElement: { setAttribute() {} },
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    localStorage: {
      _data: { pharmaUser: JSON.stringify(testUser) },
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = v; }
    },
    sessionStorage: {
      _data: { pharmaUser: JSON.stringify(testUser) },
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = v; }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: "https://pharmacare-ab4b6.web.app/visits.html", pathname: "/visits.html", replace: () => {} },
    showToast: (msg, type) => {
      console.log(`[Toast ${type}]: ${msg}`);
    },
    navigator: { onLine: true },
    console: console,
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
  sandbox.currentUser = testUser;

  vm.createContext(sandbox);

  vm.runInContext(appJs, sandbox);
  vm.runInContext(storeJs, sandbox);
  vm.runInContext(visitsJs, sandbox);

  console.log("Testing openVisitModal(true) for PM Fady Adel...");
  sandbox.openVisitModal(true);

  const modal = mock.getElemById("visitModal");
  console.log("Modal active class:", modal.classList.contains("active"));
  console.log("Modal display style:", modal.style.display);

  const targetSelect = mock.getElemById("visitTarget");
  console.log("Target options count:", targetSelect.options.length);
  if (targetSelect.options.length > 0) {
    console.log("First 3 target options:", targetSelect.options.slice(0, 3));
  }

  // Simulate picking a doctor and saving on today's date
  const chosenDoc = targetSelect.options[1]; // Pick first real doctor
  targetSelect.value = chosenDoc.value;
  targetSelect.selectedIndex = 1;
  mock.getElemById("visitDate").value = sandbox.todayStr;
  mock.getElemById("visitTime").value = "12:30";
  mock.getElemById("visitComment").value = "Test visit logged by PM";

  console.log(`\nSaving visit for target: ${chosenDoc.text} (ID: ${chosenDoc.value})...`);
  try {
    sandbox.saveVisit();
  } catch (e) {
    console.error("saveVisit exception:", e);
  }

  const savedVisits = sandbox.getLiveVisits();
  console.log("Total visits in state now:", savedVisits.length);
  const latestVisit = savedVisits[0];
  console.log("Latest visit details:", {
    id: latestVisit.id,
    repId: latestVisit.repId,
    lineId: latestVisit.lineId,
    doctorName: latestVisit.doctorName,
    date: latestVisit.date,
    time: latestVisit.time,
    status: latestVisit.status,
    source: latestVisit.source
  });

  if (latestVisit.doctorName === chosenDoc.text) {
    console.log("\n>>> SUCCESS: Visit logged and saved cleanly! <<<\n");
  } else {
    throw new Error("Visit doctorName does not match chosen option!");
  }
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
