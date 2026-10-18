const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appJs = fs.readFileSync(path.resolve(__dirname, "../js/app.js"), "utf8");
const storeJs = fs.readFileSync(path.resolve(__dirname, "../js/store.js"), "utf8");
const dashboardJs = fs.readFileSync(path.resolve(__dirname, "../js/dashboard.js"), "utf8");

// Load live Firestore data
const https = require("https");
https.get("https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data", (res) => {
  let d = "";
  res.on("data", c => d += c);
  res.on("end", () => {
    const payload = JSON.parse(JSON.parse(d).fields.payload.stringValue);

    const testUser = payload.users.find(u => u.id === "dm1") || {
      id: "dm1",
      name: "Amir Ayoup",
      role: "district_manager",
      employeeCode: "DM-001",
      lineId: "line1"
    };

    console.log("Testing dashboard rendering for:", testUser);

    const sandbox = {
      window: {},
      document: {
        getElementById: (id) => ({
          id,
          replaceChildren: () => {},
          innerHTML: "",
          appendChild: () => {},
          addEventListener: () => {}
        }),
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }),
        body: { appendChild: () => {} },
        documentElement: { setAttribute: () => {} },
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
      location: { href: "https://pharmacare-ab4b6.web.app/index.html", pathname: "/index.html" },
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
    sandbox.DEMO_DATA = JSON.parse(JSON.stringify(payload));

    vm.createContext(sandbox);

    try {
      vm.runInContext(appJs, sandbox);
      vm.runInContext(storeJs, sandbox);
      vm.runInContext(dashboardJs, sandbox);
    } catch (e) {
      console.error("Init script error:", e);
      return;
    }

    try {
      console.log("Calling renderDMDashboard...");
      const html = sandbox.renderDMDashboard(testUser.name, testUser);
      console.log("renderDMDashboard SUCCESS! Length of rendered HTML:", html.length);
    } catch (e) {
      console.error(">>> ERROR in renderDMDashboard:", e);
    }

    try {
      console.log("\nCalling renderDashboard()...");
      sandbox.renderDashboard();
      console.log("renderDashboard completed!");
    } catch (e) {
      console.error(">>> ERROR in renderDashboard():", e);
    }
  });
});
