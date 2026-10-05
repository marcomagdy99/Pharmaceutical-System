const fs = require("fs");
const path = require("path");
const vm = require("vm");

let visitsJs = fs.readFileSync(path.resolve(__dirname, "../js/visits.js"), "utf8");

// Insert a try/catch logging wrapper inside saveVisit around line 3810
visitsJs = visitsJs.replace("const targetRepId = currentEditVisitId", `
  console.log("-> Reached line 3813!");
  try {
    console.log("-> checking checkVisitDateAllowed:", typeof checkVisitDateAllowed);
    const dc = checkVisitDateAllowed(visitDate, currentUser.id, "ar");
    console.log("-> dc result:", dc);
  } catch (err) {
    console.error("-> ERROR IN checkVisitDateAllowed:", err);
  }
  const targetRepId = currentEditVisitId`);

const appJs = fs.readFileSync(path.resolve(__dirname, "../js/app.js"), "utf8");
const storeJs = fs.readFileSync(path.resolve(__dirname, "../js/store.js"), "utf8");

function createMockDom() {
  const elements = {};
  const querySelect = (sel) => {
    if (sel.includes('input[name="visitPeriod"]:checked')) return { value: "pm" };
    if (sel.includes('input[name="visitType"]:checked')) return { value: "single" };
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
        classList: { classes: new Set(), add(c) { this.classes.add(c); }, remove(c) { this.classes.delete(c); }, contains(c) { return this.classes.has(c); } },
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

const mock = createMockDom();
const testUser = { id: "pm2", name: "Fady Adel", role: "product_manager", lineId: "line2" };

const sandbox = {
  window: {},
  document: {
    getElementById: mock.getElemById,
    querySelector: mock.querySelect,
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      value: "",
      textContent: "",
      className: "",
      classList: { add() {}, remove() {} },
      remove() {},
      children: [],
      appendChild(c) { this.children.push(c); },
      setAttribute(k, v) { this[k] = v; }
    }),
    body: { appendChild() {} },
    documentElement: { setAttribute() {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  },
  CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } },
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
  showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
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

sandbox.openVisitModal(true);

const targetSelect = mock.getElemById("visitTarget");
const chosenDoc = targetSelect.options[1];
targetSelect.value = chosenDoc.value;
targetSelect.selectedIndex = 1;
mock.getElemById("visitDate").value = sandbox.todayStr;
mock.getElemById("visitTime").value = "12:30";
mock.getElemById("visitComment").value = "Test comment";

console.log("\n--- Triggering saveVisit() ---");
sandbox.saveVisit();
console.log("--- Finished saveVisit() ---\n");
