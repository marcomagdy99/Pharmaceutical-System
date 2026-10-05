const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const jsDir = path.join(rootDir, "js");

function createMockWindow() {
  const storeData = {};
  const mockStorage = {
    getItem: (k) => storeData[k] !== undefined ? storeData[k] : null,
    setItem: (k, v) => { storeData[k] = String(v); },
    removeItem: (k) => { delete storeData[k]; },
    clear: () => { Object.keys(storeData).forEach(k => delete storeData[k]); }
  };

  const sessionData = {};
  const mockSession = {
    getItem: (k) => sessionData[k] !== undefined ? sessionData[k] : null,
    setItem: (k, v) => { sessionData[k] = String(v); },
    removeItem: (k) => { delete sessionData[k]; },
    clear: () => { Object.keys(sessionData).forEach(k => delete sessionData[k]); }
  };

  const elements = {};
  const eventListeners = {};

  function makeElement(tag, id = "") {
    const el = {
      tagName: tag.toUpperCase(),
      id: id,
      className: "",
      classList: {
        add: (...cls) => { el.className = (el.className + " " + cls.join(" ")).trim(); },
        remove: (...cls) => {
          let parts = el.className.split(/\s+/);
          cls.forEach(c => { parts = parts.filter(p => p !== c); });
          el.className = parts.join(" ");
        },
        contains: (c) => el.className.split(/\s+/).includes(c)
      },
      style: {},
      dataset: {},
      value: "",
      textContent: "",
      innerHTML: "",
      children: [],
      options: [],
      replaceChildren: (...newChildren) => {
        el.children = [...newChildren];
        el.options = el.children.filter(c => c.tagName === "OPTION");
      },
      appendChild: (child) => {
        el.children.push(child);
        if (child.tagName === "OPTION") el.options.push(child);
        if (child.id) elements[child.id] = child;
      },
      removeChild: (child) => {
        el.children = el.children.filter(c => c !== child);
        el.options = el.options.filter(c => c !== child);
      },
      remove: () => {},
      setAttribute: (k, v) => { el[k] = v; },
      getAttribute: (k) => el[k] || null,
      removeAttribute: (k) => { delete el[k]; },
      addEventListener: (evt, fn) => {
        if (!eventListeners[evt]) eventListeners[evt] = [];
        eventListeners[evt].push(fn);
      },
      dispatchEvent: (evt) => {
        (eventListeners[evt.type] || []).forEach(fn => fn(evt));
      },
      querySelector: (sel) => {
        if (sel.startsWith("#")) return elements[sel.slice(1)] || null;
        return null;
      },
      querySelectorAll: (sel) => {
        return [];
      }
    };
    if (id) elements[id] = el;
    return el;
  }

  // Pre-create known elements from visits.html
  const knownIds = [
    'filterRep', 'filterLine', 'visitProducts', 'visitManagersGroup',
    'visitModalTitle', 'btnSaveVisit', 'btnCheckMyGps', 'visitDate',
    'visitTime', 'visitInsertionMetaContainer', 'visitInsertionDateDisplay',
    'visitInsertionTimeDisplay', 'visitComment', 'visitGiveawaySamples',
    'radioPharmacyLabel', 'modalTargetFilterSelect', 'modalTargetFilterLabel',
    'modalTargetFilterContainer', 'visitTarget', 'visitTargetLabel',
    'visitModal', 'visitGpsSection', 'doubleManagerSection', 'visitModalDayName'
  ];
  knownIds.forEach(id => makeElement("div", id));

  // Some specific types
  elements['filterRep'].tagName = "SELECT";
  elements['filterRep'].value = "all";
  elements['filterLine'].tagName = "SELECT";
  elements['filterLine'].value = "line2";
  elements['visitTarget'].tagName = "SELECT";
  elements['modalTargetFilterSelect'].tagName = "SELECT";
  elements['visitDate'].tagName = "INPUT";
  elements['visitTime'].tagName = "INPUT";
  elements['visitComment'].tagName = "TEXTAREA";
  elements['visitGiveawaySamples'].tagName = "INPUT";

  const mockDoc = {
    documentElement: {
      lang: "ar",
      dir: "rtl",
      getAttribute: (a) => a === "data-theme" ? "light" : "ar",
      setAttribute: () => {}
    },
    body: {
      appendChild: (el) => {
        if (el.id) elements[el.id] = el;
      },
      classList: { add: () => {}, remove: () => {} }
    },
    getElementById: (id) => elements[id] || null,
    createElement: (tag) => makeElement(tag),
    querySelector: (sel) => {
      if (sel.startsWith("#")) return elements[sel.slice(1)] || null;
      if (sel.includes('input[name="visitPeriod"][value="pm"]')) {
        return { checked: true, value: "pm" };
      }
      if (sel.includes('input[name="visitPeriod"]:checked')) {
        return { value: "pm" };
      }
      if (sel.includes('input[name="visitType"][value="single"]')) {
        return { checked: true, value: "single" };
      }
      if (sel.includes('input[name="visitType"]:checked')) {
        return { value: "single" };
      }
      return null;
    },
    querySelectorAll: (sel) => {
      return [];
    },
    addEventListener: () => {},
    dispatchEvent: () => {}
  };

  const mockWin = {
    localStorage: mockStorage,
    sessionStorage: mockSession,
    document: mockDoc,
    crypto: require("crypto").webcrypto,
    location: { href: "/visits.html", pathname: "/visits.html", search: "", reload: () => {}, assign: () => {}, replace: () => {} },
    addEventListener: () => {},
    setTimeout: (fn) => setTimeout(fn, 10),
    clearTimeout: () => {},
    elements
  };

  mockWin.window = mockWin;
  return mockWin;
}

const win = createMockWindow();
global.window = win;
global.document = win.document;
global.localStorage = win.localStorage;
global.sessionStorage = win.sessionStorage;
global.crypto = win.crypto;

// Set user as PM Fady Adel
const pmUser = {
  id: 'pm2',
  role: 'product_manager',
  name: 'Fady Adel',
  employeeCode: 'PM-002',
  lineId: 'line2',
  lineIds: ['line2'],
  productIds: ['prod5', 'prod6']
};
win.localStorage.setItem("pharma_user", JSON.stringify(pmUser));
win.sessionStorage.setItem("impersonating_admin", JSON.stringify({
  id: 'admin1',
  role: 'admin',
  name: 'Admin'
}));

// Load store, app, visits
const storeCode = fs.readFileSync(path.join(jsDir, "store.js"), "utf8");
eval(storeCode);

const appCode = fs.readFileSync(path.join(jsDir, "app.js"), "utf8");
eval(appCode);

win.checkAuth = () => pmUser;
win.requireAuth = () => pmUser;
global.checkAuth = () => pmUser;
global.requireAuth = () => pmUser;
win.currentUser = pmUser;
global.currentUser = pmUser;

// Add mock doctors, hospitals, pharmacies, areas, and users to DEMO_DATA
win.DEMO_DATA = {
  users: [
    pmUser,
    { id: 'lm1', role: 'line_manager', name: 'Tarek LM', lineId: 'line2', lineIds: ['line2'] },
    { id: 'dm1', role: 'district_manager', name: 'Sameh DM', managerId: 'lm1', lineId: 'line2', lineIds: ['line2'] },
    { id: 'rep1', role: 'medical_rep', name: 'Ahmed Rep', managerId: 'dm1', lineId: 'line2', lineIds: ['line2'] }
  ],
  areas: [
    { id: 'area1', name: 'Nasr City', lineId: 'line2', repId: 'rep1' },
    { id: 'area2', name: 'Heliopolis', lineId: 'line2', repId: null }
  ],
  productLines: [
    { id: 'line2', name: 'Challengers Line', products: [{ id: 'prod5', name: 'Product 5' }, { id: 'prod6', name: 'Product 6' }] }
  ],
  doctors: [
    { id: 'doc1', name: 'Dr. Magdy Yacoub', areaId: 'area1', repId: 'rep1', lineId: 'line2' },
    { id: 'doc2', name: 'Dr. Sherif Zaki', areaId: 'area2', repId: null, lineId: 'line2' }
  ],
  hospitals: [
    { id: 'hosp1', name: 'Cleopatra Hospital', areaId: 'area1', repId: 'rep1', lineId: 'line2' }
  ],
  pharmacies: [
    { id: 'pharm1', name: 'El Ezaby Pharmacy', areaId: 'area1', repId: 'rep1', lineId: 'line2' }
  ]
};

const visitsCode = fs.readFileSync(path.join(jsDir, "visits.js"), "utf8");
eval(visitsCode);

console.log("Current user:", win.currentUser);
console.log("Current role:", win.currentUserRole);

console.log("\nAttempting to call openVisitModal(true)...");
try {
  win.openVisitModal(true);
  console.log("openVisitModal(true) SUCCESS!");
  const modal = win.document.getElementById("visitModal");
  console.log("Modal display:", modal.style.display);
  console.log("Modal active:", modal.classList.contains("active"));
  
  const targetSelect = win.document.getElementById("visitTarget");
  console.log("Visit target options count:", targetSelect.options.length);
  targetSelect.options.forEach((opt, idx) => {
    console.log(`  Option [${idx}]: val="${opt.value}", text="${opt.textContent}"`);
  });

  const filterContainer = win.document.getElementById("modalTargetFilterContainer");
  console.log("Filter container display:", filterContainer.style.display);

  const filterSelect = win.document.getElementById("modalTargetFilterSelect");
  console.log("Filter select options count:", filterSelect.options.length);
  filterSelect.options.forEach((opt, idx) => {
    console.log(`  Filter Option [${idx}]: val="${opt.value}", text="${opt.textContent}"`);
  });

  // Test Period AM (Hospital)
  win.document.querySelector = (sel) => {
    if (sel.includes('input[name="visitPeriod"]:checked')) return { value: "am" };
    return null;
  };
  win.updateTargetOptions();
  console.log("\nTesting AM (Hospital) target options count:", targetSelect.options.length);
  targetSelect.options.forEach((opt, idx) => {
    console.log(`  AM Option [${idx}]: val="${opt.value}", text="${opt.textContent}"`);
  });

  // Test saveVisit
  console.log("\nTesting saveVisit() for Product Manager...");
  win.document.querySelector = (sel) => {
    if (sel.includes('input[name="visitPeriod"]:checked')) return { value: "pm" };
    if (sel.includes('input[name="visitType"]:checked')) return { value: "single" };
    if (sel.includes('#visitModal button')) return win.document.getElementById("btnSaveVisit");
    return null;
  };
  targetSelect.value = "doc1";
  targetSelect.selectedIndex = 0;
  
  win.saveVisit();
  console.log("saveVisit executed!");
  console.log("DEMO_DATA.visits count:", win.DEMO_DATA.visits ? win.DEMO_DATA.visits.length : 0);
  if (win.DEMO_DATA.visits && win.DEMO_DATA.visits.length > 0) {
    const lastVisit = win.DEMO_DATA.visits[win.DEMO_DATA.visits.length - 1];
    console.log("Last created visit:", {
      id: lastVisit.id,
      repId: lastVisit.repId,
      doctorId: lastVisit.doctorId,
      doctorName: lastVisit.doctorName,
      lineId: lastVisit.lineId,
      status: lastVisit.status
    });
  }

} catch (e) {
  console.error("FAIL:", e);
}
