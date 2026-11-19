/**
 * @file app.js
 * @description Core shared logic, synchronous theme execution, authentication, and universal topbar rendering across all pages.
 */

if (typeof window !== "undefined" && typeof window.DEMO_MODE === "undefined") {
  window.DEMO_MODE = Boolean(window.IS_DEMO_MODE);
}

// ============================================================================
// Immediate Synchronous Theme Engine (Eliminates Flash of Light Theme - FOUC)
// ============================================================================
(function () {
  try {
    const savedTheme = localStorage.getItem("pharmaTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
  } catch (err) {}
})();

// ============================================================================
// Section 0: HTML Escaping Utility
// Use this whenever free-text a user typed (announcement body, visit comment,
// leave reason, etc.) is inserted into innerHTML, to prevent stored XSS.
// Safe to call on undefined/null - returns an empty string.
// ============================================================================
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}
window.escapeHtml = escapeHtml;

/**
 * Enterprise XSS Sanitizer (best-effort only): strips executable tags, javascript: urls, and inline event handlers.
 * NOTE: Best-effort only — do NOT use for notification icons or any user-supplied text fields; rely on escapeHtml instead.
 * @param {string} html Raw user input or HTML markup.
 * @returns {string} Clean, safe markup.
 */
function sanitizeHtml(html) {
  if (html === null || html === undefined) return "";
  let clean = String(html);
  // Neutralize script tags and dangerous elements
  clean = clean.replace(/<\s*(script|iframe|object|embed|svg|math|link|style|meta|base)[^>]*>.*?<\s*\/\s*\1\s*>/gis, "");
  clean = clean.replace(/<\s*(script|iframe|object|embed|svg|math|link|style|meta|base)[^>]*\/?>/gis, "");
  // Neutralize all on* event handlers (e.g. onload, onerror, onclick)
  clean = clean.replace(/\son[a-z\-_]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gis, "");
  // Neutralize javascript: and vbscript: URIs
  clean = clean.replace(/(href|src|action|data)\s*=\s*(['"]?)\s*(?:javascript|vbscript|data\s*:[^,]*html):/gis, "$1=$2about:blank#blocked:");
  return clean;
}
window.sanitizeHtml = sanitizeHtml;

function genId(prefix) {
  const rnd = (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function")
    ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  return prefix + rnd;
}
window.genId = genId;

// ============================================================================
// Section 0.4: Dual Anti-Timestamp Tampering Engine (Network Time Protocol)
// Primary: Current Host Origin (window.location.origin HEAD Date header - RFC 7231)
// Monotonic Guard: performance.now() tracks true elapsed time immune to device clock hacks
// ============================================================================
const NetworkTime = {
  offsetMs: 0,
  isSynced: false,
  syncSource: "none",
  basePerf: 0,
  baseServerMs: 0,
  lastSyncTime: 0,
  _syncPromise: null,

  async sync() {
    if (this._syncPromise) return this._syncPromise;
    this._syncPromise = this._doSync().finally(() => {
      this._syncPromise = null;
    });
    return this._syncPromise;
  },

  async _doSync() {
    // Attempt 1: Current Server Origin (HEAD request reads standard RFC 7231 Date header)
    try {
      const origin = (typeof window !== "undefined" && window.location && window.location.origin)
        ? window.location.origin
        : "";
      if (origin && !origin.startsWith("file:")) {
        const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;
        const res = await fetch(`${origin}/?_t=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          signal: controller ? controller.signal : undefined
        });
        if (timeoutId) clearTimeout(timeoutId);
        const dateHeader = res.headers ? res.headers.get("date") : null;
        if (dateHeader) {
          const serverMs = new Date(dateHeader).getTime();
          if (!isNaN(serverMs) && serverMs > 0) {
            this._applySync(serverMs, "origin");
            return true;
          }
        }
      }
    } catch (e) {
      // Origin HEAD failed or offline, fall through to session cache / device clock
    }

    // Attempt 2: Restore cached session sync if available
    // Note: Do NOT restore basePerf across page loads because performance.now() resets to 0 on every navigation.
    try {
      if (typeof sessionStorage !== "undefined") {
        const cachedOffset = sessionStorage.getItem("pharma_net_time_offset");
        if (cachedOffset !== null) {
          const parsedOffset = parseInt(cachedOffset, 10);
          if (!isNaN(parsedOffset)) {
            this.offsetMs = parsedOffset;
            this.basePerf = 0;
            this.baseServerMs = 0;
            this.isSynced = true;
            this.syncSource = "session_cache";
            return true;
          }
        }
      }
    } catch (e) {}

    return false;
  },

  _applySync(serverMs, source) {
    const localMs = Date.now();
    this.offsetMs = serverMs - localMs;
    this.baseServerMs = serverMs;
    this.basePerf = (typeof performance !== "undefined" && typeof performance.now === "function")
      ? performance.now()
      : 0;
    this.isSynced = true;
    this.syncSource = source;
    this.lastSyncTime = localMs;

    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("pharma_net_time_offset", String(this.offsetMs));
        sessionStorage.setItem("pharma_net_time_perf", String(this.basePerf));
        sessionStorage.setItem("pharma_net_time_base", String(this.baseServerMs));
      }
    } catch (e) {}
  },

  now() {
    if (this.isSynced && this.basePerf && typeof performance !== "undefined" && typeof performance.now === "function") {
      const elapsed = performance.now() - this.basePerf;
      return new Date(this.baseServerMs + elapsed);
    }
    if (this.isSynced && this.offsetMs) {
      return new Date(Date.now() + this.offsetMs);
    }
    return new Date();
  },

  checkTampering(maxAllowedDriftMinutes = 5) {
    const verified = this.now();
    const device = new Date();
    const diffMs = device.getTime() - verified.getTime();
    const driftMinutes = Math.round(diffMs / 60000);
    const thresholdMs = maxAllowedDriftMinutes * 60 * 1000;
    const isTampered = Math.abs(diffMs) > thresholdMs;

    return {
      isTampered,
      driftMinutes,
      diffMs,
      isSynced: this.isSynced,
      syncSource: this.syncSource,
      serverTime: verified,
      deviceTime: device
    };
  }
};

window.NetworkTime = NetworkTime;
try {
  if (typeof window !== "undefined" && typeof Object.defineProperty === "function") {
    // Lock down critical methods on NetworkTime
    Object.defineProperty(NetworkTime, "checkTampering", { writable: false, configurable: false });
    Object.defineProperty(NetworkTime, "now", { writable: false, configurable: false });
    Object.defineProperty(NetworkTime, "sync", { writable: false, configurable: false });

    // Lock down window.NetworkTime reference
    Object.defineProperty(window, "NetworkTime", {
      value: NetworkTime,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
} catch (e) {}

// Auto-trigger sync on load and on reconnect
if (typeof window !== "undefined") {
  NetworkTime.sync();
  if (typeof window.addEventListener === "function") {
    window.addEventListener("online", () => NetworkTime.sync());
  }
}

// ============================================================================
// Section 0.5: Unified System Date Synchronizer
// Ensures visits, calendar, activities, and dashboard stay synchronized.
// If DEMO_DATA.systemDate is configured, it takes priority; otherwise uses NetworkTime.
// ============================================================================
function getSystemDate() {
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.systemDate) {
    const d = new Date(window.DEMO_DATA.systemDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof window !== "undefined" && window.NetworkTime && typeof window.NetworkTime.now === "function") {
    return window.NetworkTime.now();
  }
  return new Date();
}

function getSystemTodayStr() {
  const d = getSystemDate();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

window.getSystemDate = getSystemDate;
window.getSystemTodayStr = getSystemTodayStr;

// ============================================================================
// Section 0.6: Bilingual Alphabetical Collation Utility (AR / EN)
// ============================================================================
function sortBilingualByName(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const lang = (typeof window !== "undefined" && window.getCurrentLang && window.getCurrentLang()) || "en";
  const getName = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    if (lang === "ar") {
      return (item.nameAr || item.name || "").trim();
    }
    return (item.name || item.nameAr || "").trim();
  };
  const nameA = getName(a);
  const nameB = getName(b);
  const locales = lang === "ar" ? ["ar", "en"] : ["en", "ar"];
  return nameA.localeCompare(nameB, locales, { numeric: true, sensitivity: "base" });
}
window.sortBilingualByName = sortBilingualByName;
window.sortByName = sortBilingualByName;

// ============================================================================
// Section 1: Default Master Seed Data
// ============================================================================
const DEFAULT_DEMO_DATA = {
  currentUser: {
    id: "u1790626000010",
    email: "admin@pharmacare.com",
    name: "System Admin",
    nameAr: "System Admin",
    role: "admin",
    employeeCode: "ADM-001",
    photoURL: "",
    lang: "en",
    hireDate: "2021-01-01",
    leaveBalance: {
      annual: 21,
      sick: 7,
      emergency: 6,
      unpaid: 0,
      maternity: 90,
    },
  },
  users: [
    {
        "id": "u1790626000001",
        "name": "Marco Magdy",
        "nameAr": "Marco Magdy",
        "role": "medical_rep",
        "employeeCode": "REP-001",
        "managerId": "u1790626000014",
        "areaId": "area_1790626000001",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001"
        ],
        "email": "rep@pharmacare.com",
        "code": "REP-001",
        "phone": "+201001234567",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Mohndseen, Bolak El Dakror",
        "areaIds": [
            "area_1790626000001",
            "area_line1_1790688157353"
        ],
        "hireDate": "2024-01-15",
        "status": "Active",
        "productIds": [],
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000002",
        "name": "Kerolos Boules",
        "nameAr": "Kerolos Boules",
        "role": "medical_rep",
        "employeeCode": "REP-002",
        "managerId": "u1790626000015",
        "areaId": "area_1790626000002",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001"
        ],
        "areaIds": [
            "area_1790626000002",
            "area_line1_1790674637363"
        ],
        "area": "Heliopolis, Giza",
        "hireDate": "2024-02-01",
        "email": "rep2@pharmacare.com",
        "phone": "+201001234568",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "code": "REP-002",
        "productIds": [],
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000003",
        "name": "Mina Mikhael",
        "nameAr": "Mina Mikhael",
        "role": "medical_rep",
        "employeeCode": "REP-003",
        "managerId": "u1790626000015",
        "areaId": "area_line1_1790674718201",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001"
        ],
        "areaIds": [
            "area_line1_1790674718201"
        ],
        "area": "Fisal",
        "hireDate": "2024-03-10",
        "email": "rep3@pharmacare.com",
        "phone": "+201001234569",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "code": "REP-003",
        "productIds": [],
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000004",
        "name": "David Emad",
        "nameAr": "David Emad",
        "role": "medical_rep",
        "employeeCode": "REP-004",
        "managerId": "u1790626000014",
        "areaId": "area_1790626000003",
        "lineId": "line_1790626000002",
        "lineIds": [
            "line_1790626000002"
        ],
        "areaIds": [
            "area_1790626000003",
            "area_line2_1790674745627",
            "area_line2_1790688168385"
        ],
        "area": "Nasr City, Mohndseen, Bolak El Dakror",
        "hireDate": "2024-04-01",
        "email": "rep4@pharmacare.com",
        "phone": "+201001234570",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "code": "REP-004",
        "productIds": [],
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000005",
        "name": "Mohamed Ramadan",
        "nameAr": "Mohamed Ramadan",
        "role": "medical_rep",
        "employeeCode": "REP-005",
        "email": "rep5@pharmacare.com",
        "phone": "+20100999222",
        "managerId": "u1790626000015",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001"
        ],
        "productIds": [],
        "status": "Active",
        "hireDate": "2023-06-01",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "areaIds": [
            "area_line1_1790674592471",
            "area_line1_1790688137857"
        ],
        "area": "Dokki, Haram",
        "areaId": "area_line1_1790674592471",
        "code": "REP-005",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626669586",
        "name": "Mark Michel",
        "email": "rep7@pharmacare.com",
        "code": "REP-007",
        "employeeCode": "REP-007",
        "role": "medical_rep",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "phone": "",
        "hireDate": "2026-09-28",
        "managerId": "u1790626000016",
        "status": "Active",
        "lineIds": [
            "line_1790626000003"
        ],
        "lineId": "line_1790626000003",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Shobra",
        "areaId": "area_line_1790626036368_1790674874231",
        "areaIds": [
            "area_line_1790626036368_1790674874231"
        ],
        "nameAr": "Mark Michel",
        "mustChangePassword": false
    },
    {
        "id": "u1790626607816",
        "name": "Ahmed Harb",
        "email": "rep6@pharmacare.com",
        "code": "REP-006",
        "employeeCode": "REP-006",
        "role": "medical_rep",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "phone": "01202379833",
        "hireDate": "2026-09-28",
        "managerId": "u1790626000015",
        "status": "Active",
        "lineIds": [
            "line_1790626000002"
        ],
        "lineId": "line_1790626000002",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Giza",
        "areaId": "area_line2_1790674781879",
        "areaIds": [
            "area_line2_1790674781879"
        ],
        "nameAr": "Ahmed Harb",
        "mustChangePassword": false
    },
    {
        "id": "u1790687949946",
        "name": "Mina Samir",
        "email": "rep9@pharmacare.com",
        "code": "REP-009",
        "employeeCode": "REP-009",
        "role": "medical_rep",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "phone": "+201001234567",
        "hireDate": "2026-09-29",
        "managerId": "u1790626000016",
        "status": "Active",
        "lineIds": [
            "line_1790626000003"
        ],
        "lineId": "line_1790626000003",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Mohndseen",
        "areaId": "area_line_1790626036368_1790687909664",
        "areaIds": [
            "area_line_1790626036368_1790687909664"
        ],
        "nameAr": "Mina Samir",
        "mustChangePassword": false
    },
    {
        "id": "u1790688369929",
        "name": "Marina Shobra",
        "email": "rep11@pharmacare.com",
        "code": "REP-011",
        "employeeCode": "REP-011",
        "role": "medical_rep",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "phone": "",
        "hireDate": "2026-09-29",
        "managerId": "u1790626000014",
        "status": "Active",
        "lineIds": [
            "line_1790626000001"
        ],
        "lineId": "line_1790626000001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Shobra",
        "areaId": "area_line1_1790688305597",
        "areaIds": [
            "area_line1_1790688305597"
        ],
        "nameAr": "Marina Shobra",
        "mustChangePassword": false
    },
    {
        "id": "u1790688412219",
        "name": "Monica Shobra",
        "email": "rep12@pharmacare.com",
        "code": "REP-012",
        "employeeCode": "REP-012",
        "role": "medical_rep",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "phone": "",
        "hireDate": "2026-09-29",
        "managerId": "u1790626000014",
        "status": "Active",
        "lineIds": [
            "line_1790626000002"
        ],
        "lineId": "line_1790626000002",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Shobra",
        "areaId": "area_line2_1790688317554",
        "areaIds": [
            "area_line2_1790688317554"
        ],
        "nameAr": "Monica Shobra",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000011",
        "name": "George Marzok",
        "nameAr": "George Marzok",
        "role": "business_unit",
        "employeeCode": "BU-001",
        "managerId": "u1790626000010",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-06-01",
        "email": "bu@pharmacare.com",
        "phone": "+20100222333",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001",
            "line_1790626000002",
            "line_1790626000003"
        ],
        "status": "Active",
        "code": "BU-001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000012",
        "name": "John Mahfouz",
        "nameAr": "John Mahfouz",
        "role": "line_manager",
        "employeeCode": "LM-001",
        "managerId": "u1790626000011",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001",
            "line_1790626000002"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2022-01-15",
        "email": "lm@pharmacare.com",
        "phone": "+20100333444",
        "status": "Active",
        "code": "LM-001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000013",
        "name": "Mario Magdy",
        "nameAr": "Mario Magdy",
        "role": "line_manager",
        "employeeCode": "LM-002",
        "managerId": "u1790626000011",
        "lineId": "line_1790626000003",
        "lineIds": [
            "line_1790626000003"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "email": "lm2@pharmacare.com",
        "code": "LM-002",
        "phone": "+20100444555",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "hireDate": "2022-03-01",
        "status": "Active",
        "productIds": [],
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000014",
        "name": "Amir Ayoup",
        "nameAr": "Amir Ayoup",
        "role": "district_manager",
        "employeeCode": "DM-001",
        "managerId": "u1790626000012",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001",
            "line_1790626000002"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2023-01-10",
        "email": "dm@pharmacare.com",
        "phone": "+20100555666",
        "status": "Active",
        "code": "DM-001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000015",
        "name": "Jonathan Erian",
        "nameAr": "Jonathan Erian",
        "role": "district_manager",
        "employeeCode": "DM-002",
        "managerId": "u1790626000012",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001",
            "line_1790626000002"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2023-02-15",
        "email": "dm2@pharmacare.com",
        "phone": "+20100666777",
        "status": "Active",
        "code": "DM-002",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000016",
        "name": "Marian Magdy",
        "nameAr": "Marian Magdy",
        "role": "district_manager",
        "employeeCode": "DM-003",
        "managerId": "u1790626000013",
        "lineId": "line_1790626000003",
        "lineIds": [
            "line_1790626000003"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "email": "dm3@pharmacare.com",
        "code": "DM-003",
        "phone": "+20100777888",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "hireDate": "2023-05-01",
        "status": "Active",
        "productIds": [],
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000018",
        "name": "Mina Kadry",
        "nameAr": "Mina Kadry",
        "role": "product_manager",
        "employeeCode": "PM-001",
        "email": "pm@pharmacare.com",
        "phone": "+20100999111",
        "managerId": "u1790626000011",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001"
        ],
        "productIds": [
            "prod_1790626000001",
            "prod_1790626000002",
            "prod_1790626000003",
            "prod_1790626000004",
            "prod_1790625546491",
            "prod_1790625561525",
            "prod_1790625585077",
            "prod_1790625595399",
            "prod_1790625604666",
            "prod_1790625614666",
            "prod_1790625622736",
            "prod_1790625631058"
        ],
        "status": "Active",
        "hireDate": "2023-01-01",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "areaIds": [],
        "area": null,
        "areaId": null,
        "code": "PM-001",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false
    },
    {
        "id": "u1790626000019",
        "name": "Fady Adel",
        "nameAr": "Fady Adel",
        "email": "pm2@pharmacare.com",
        "code": "PM-002",
        "employeeCode": "PM-002",
        "role": "product_manager",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "phone": "",
        "hireDate": "2026-09-28",
        "managerId": "u1790626000011",
        "status": "Active",
        "lineIds": [
            "line_1790626000002"
        ],
        "lineId": "line_1790626000002",
        "productIds": [
            "prod_1790626000005",
            "prod_1790626000006"
        ],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": null,
        "areaId": null,
        "areaIds": [],
        "mustChangePassword": false
    },
    {
        "id": "u1790626000010",
        "name": "System Admin",
        "nameAr": "System Admin",
        "role": "admin",
        "employeeCode": "ADM-001",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-01-01",
        "email": "admin@pharmacare.com",
        "phone": "+20100111222",
        "status": "Active",
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false,
        "code": "ADM-001",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "managerId": null
    },
    {
        "id": "u1790626000017",
        "name": "Fatma El-Sherif",
        "nameAr": "Fatma El-Sherif",
        "role": "hr",
        "employeeCode": "HR-001",
        "email": "hr@pharmacare.com",
        "managerId": "u1790626000010",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-02-01",
        "phone": "+20100888999",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "sick": 7,
            "emergency": 6,
            "unpaid": 0,
            "maternity": 90
        },
        "passwordHash": "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f",
        "mustChangePassword": false,
        "code": "HR-001"
    }
],
  specialties: [
  {
    "id": "spec_im",
    "code": "IM",
    "name": "IM",
    "description": "Internal Medicine",
    "nameAr": "IM",
    "aliases": [
      "INTERNAL MEDICINE",
      "Internal Medicine",
      "باطنة",
      "باطنة عامة"
    ]
  },
  {
    "id": "spec_card",
    "code": "CARD",
    "name": "CARD",
    "description": "Cardiology",
    "nameAr": "CARD",
    "aliases": [
      "CARD",
      "CARDIO",
      "INTERNAL - Card",
      "Cardiology",
      "قلب",
      "أمراض قلب"
    ]
  },
  {
    "id": "spec_diab",
    "code": "DIAB",
    "name": "DIAB",
    "description": "Diabetes & Endocrinology",
    "nameAr": "DIAB",
    "aliases": [
      "Diabt",
      "IM-Diabet",
      "INTERNAL - DIABT",
      "Diabetes",
      "Endocrinology",
      "سكر",
      "غدد صماء"
    ]
  },
  {
    "id": "spec_git",
    "code": "GIT",
    "name": "GIT",
    "description": "Gastroenterology & Hepatology",
    "nameAr": "GIT",
    "aliases": [
      "Git",
      "INTERNAL - GASTRO",
      "Gastroenterology",
      "جهاز هضمي",
      "كبد"
    ]
  },
  {
    "id": "spec_neph",
    "code": "NEPH",
    "name": "NEPH",
    "description": "Nephrology",
    "nameAr": "NEPH",
    "aliases": [
      "NEPH",
      "NEP",
      "Nephro",
      "INTERNAL - NEPH",
      "Nephrology",
      "كلى",
      "أمراض كلى"
    ]
  },
  {
    "id": "spec_chest",
    "code": "CHEST",
    "name": "CHEST",
    "description": "Pulmonology & Chest",
    "nameAr": "CHEST",
    "aliases": [
      "Chest",
      "CHT",
      "Pulmonology",
      "صدر",
      "جهاز تنفسي"
    ]
  },
  {
    "id": "spec_neuro",
    "code": "NEURO",
    "name": "NEURO",
    "description": "Neurology & Stroke",
    "nameAr": "NEURO",
    "aliases": [
      "Neuro",
      "Cns",
      "Stroke",
      "Neurology",
      "مخ وأعصاب"
    ]
  },
  {
    "id": "spec_orth",
    "code": "ORTH",
    "name": "ORTH",
    "description": "Orthopedics",
    "nameAr": "ORTH",
    "aliases": [
      "ORTH",
      "ortho",
      "Orthopedics",
      "عظام",
      "جراحة عظام"
    ]
  },
  {
    "id": "spec_ped",
    "code": "PED",
    "name": "PED",
    "description": "Pediatrics & Neonatology",
    "nameAr": "PED",
    "aliases": [
      "PEDIATRIC",
      "Pediatric",
      "Pediatrics",
      "أطفال",
      "حديثي الولادة"
    ]
  },
  {
    "id": "spec_gyn",
    "code": "GYN",
    "name": "GYN",
    "description": "Obstetrics & Gynecology (IVF)",
    "nameAr": "GYN",
    "aliases": [
      "Gyna",
      "OB/GYN Doctor",
      "IVF",
      "Gynecology",
      "نساء",
      "توليد"
    ]
  },
  {
    "id": "spec_uro",
    "code": "URO",
    "name": "URO",
    "description": "Urology & Andrology",
    "nameAr": "URO",
    "aliases": [
      "UROLOGY",
      "Urology",
      "Andrology",
      "مسالك",
      "ذكورة"
    ]
  },
  {
    "id": "spec_ent",
    "code": "ENT",
    "name": "ENT",
    "description": "Ear, Nose & Throat",
    "nameAr": "ENT",
    "aliases": [
      "ENT",
      "أنف وأذن",
      "أنف وأذن وحنجرة"
    ]
  },
  {
    "id": "spec_ophth",
    "code": "OPHTH",
    "name": "OPHTH",
    "description": "Ophthalmology",
    "nameAr": "OPHTH",
    "aliases": [
      "Opth",
      "OPTHALMOLOGY",
      "Ophthalmology",
      "عيون",
      "رمد"
    ]
  },
  {
    "id": "spec_derma",
    "code": "DERMA",
    "name": "DERMA",
    "description": "Dermatology",
    "nameAr": "DERMA",
    "aliases": [
      "DERMA",
      "Dermatology",
      "جلدية",
      "تناسلية"
    ]
  },
  {
    "id": "spec_rheum",
    "code": "RHEUM",
    "name": "RHEUM",
    "description": "Rheumatology & Immunology",
    "nameAr": "RHEUM",
    "aliases": [
      "Rheum",
      "Rheumatology",
      "روماتيزم",
      "مناعة"
    ]
  },
  {
    "id": "spec_hem",
    "code": "HEM",
    "name": "HEM",
    "description": "Hematology",
    "nameAr": "HEM",
    "aliases": [
      "Heamtology",
      "HEAMATOLOGY",
      "Hematology",
      "أمراض دم"
    ]
  },
  {
    "id": "spec_onc",
    "code": "ONC",
    "name": "ONC",
    "description": "Oncology",
    "nameAr": "ONC",
    "aliases": [
      "Oncology",
      "ONCOLOGY",
      "أورام"
    ]
  },
  {
    "id": "spec_surg",
    "code": "SURG",
    "name": "SURG",
    "description": "General Surgery",
    "nameAr": "SURG",
    "aliases": [
      "Surgeon",
      "Surgery",
      "General Surgery",
      "جراحة",
      "جراحة عامة"
    ]
  },
  {
    "id": "spec_vas",
    "code": "VAS",
    "name": "VAS",
    "description": "Vascular Surgery",
    "nameAr": "VAS",
    "aliases": [
      "Vascular",
      "Vascular Surgery",
      "أوعية دموية"
    ]
  },
  {
    "id": "spec_pls",
    "code": "PLS",
    "name": "PLS",
    "description": "Plastic Surgery & Burns",
    "nameAr": "PLS",
    "aliases": [
      "Plastic Surgery",
      "Burn unit",
      "تجميل",
      "حروق"
    ]
  },
  {
    "id": "spec_psych",
    "code": "PSYCH",
    "name": "PSYCH",
    "description": "Psychiatry & Mental Health",
    "nameAr": "PSYCH",
    "aliases": [
      "Psych",
      "Psychiatry",
      "نفسية",
      "عصبية"
    ]
  },
  {
    "id": "spec_dent",
    "code": "DENT",
    "name": "DENT",
    "description": "Dentistry",
    "nameAr": "DENT",
    "aliases": [
      "Dent",
      "DENT",
      "Dentistry",
      "أسنان"
    ]
  },
  {
    "id": "spec_gp",
    "code": "GP",
    "name": "GP",
    "description": "General Practice / Family Medicine",
    "nameAr": "GP",
    "aliases": [
      "GPS",
      "Family Physician",
      "GP",
      "ممارس عام",
      "طب أسرة"
    ]
  },
  {
    "id": "spec_icu",
    "code": "ICU",
    "name": "ICU",
    "description": "Critical Care & ICU",
    "nameAr": "ICU",
    "aliases": [
      "ICU",
      "Emergency",
      "طوارئ",
      "عناية مركزة"
    ]
  },
  {
    "id": "spec_nut",
    "code": "NUT",
    "name": "NUT",
    "description": "Clinical Nutrition",
    "nameAr": "NUT",
    "aliases": [
      "NUTRITION",
      "Nutrition",
      "تغذية علاجية"
    ]
  },
  {
    "id": "spec_pt",
    "code": "PT",
    "name": "PT",
    "description": "Physiotherapy & Rehabilitation",
    "nameAr": "PT",
    "aliases": [
      "PHSOTHRAPY",
      "Physiotherapy",
      "علاج طبيعي"
    ]
  },
  {
    "id": "spec_other",
    "code": "OTHER",
    "name": "OTHER",
    "description": "Other Specialty",
    "nameAr": "OTHER",
    "aliases": [
      "Other",
      "أخرى"
    ]
  }
],
  areas: [
      {
          "id": "area_1790626000001",
          "name": "Giza V - Brick 1",
          "code": "GZA-B49",
          "repId": "u1790626000001",
          "lineId": "line_1790626000001",
          "repName": "Marco Magdy",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "20502"
              }
          ],
          "bricks": [
              "[B49] Giza V - Brick 1 (Giza 11)"
          ]
      },
      {
          "id": "area_line1_giza4_brick1",
          "name": "Giza IV - Brick 1",
          "code": "GZA-B48",
          "repId": null,
          "lineId": "line_1790626000001",
          "repName": null,
          "bricks": [
              "[B48] Giza IV - Brick 1 (Giza 10)"
          ]
      },
      {
          "id": "area_1790626000002",
          "name": "Heliopolis I - Brick 1",
          "code": "CAI-B01",
          "repId": "u1790626000002",
          "lineId": "line_1790626000001",
          "repName": null,
          "bricks": [
              "[B01] Heliopolis I - Brick 1 (Heliopolis 1)"
          ]
      },
      {
          "id": "area_1790626000003",
          "name": "Nasr City - Brick 1",
          "code": "CAI-B16",
          "repId": "u1790626000004",
          "lineId": "line_1790626000002",
          "repName": null,
          "bricks": [
              "[B16] Nasr City - Brick 1 (Nasr City 1)"
          ]
      },
      {
          "id": "area_1790626000004",
          "name": "Maadi - Brick 1",
          "code": "CAI-B32",
        "repId": null,
        "lineId": "line_1790626000002",
        "repName": "Ahmed Mostafa",
          "bricks": [
              "[B32] Maadi - Brick 1 (Maadi 1)"
          ]
      },
      {
          "id": "area_line1_1790674592471",
          "name": "Giza II - Brick 1",
          "code": "GZA-B41",
          "repId": "u1790626000005",
          "repName": "Mohamed Ramadan",
          "lineId": "line_1790626000001",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "20303"
              }
          ],
          "bricks": [
              "[B41] Giza II - Brick 1 (Giza 4)"
          ]
      },
      {
          "id": "area_line1_1790674637363",
          "name": "Giza I - Brick 1",
          "code": "GZA-B38",
          "repId": "u1790626000002",
          "repName": "Kerolos Boules",
          "lineId": "line_1790626000001",
          "bricks": [
              "[B38] Giza I - Brick 1 (Giza 1)"
          ]
      },
      {
          "id": "area_line1_1790674718201",
          "name": "Faisal - Brick 1",
          "code": "GZA-B46",
          "repId": "u1790626000003",
          "repName": "Mina Mikhael",
          "lineId": "line_1790626000001",
          "bricks": [
              "[B46] Faisal - Brick 1 (Faisal 1)"
          ]
      },
      {
          "id": "area_line2_1790674745627",
          "name": "Giza V - Brick 1",
          "code": "GZA-B49",
          "repId": "u1790626000004",
          "repName": "David Emad",
          "lineId": "line_1790626000002",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "20502"
              }
          ],
          "bricks": [
              "[B49] Giza V - Brick 1 (Giza 11)"
          ]
      },
      {
          "id": "area_line2_giza4_brick1",
          "name": "Giza IV - Brick 1",
          "code": "GZA-B48",
          "repId": null,
          "lineId": "line_1790626000002",
          "repName": null,
          "bricks": [
              "[B48] Giza IV - Brick 1 (Giza 10)"
          ]
      },
      {
          "id": "area_line2_1790674771516",
          "name": "Giza II - Brick 1",
          "code": "GZA-B41",
          "repId": null,
          "repName": null,
          "lineId": "line_1790626000002",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "20303"
              }
          ],
          "bricks": [
              "[B41] Giza II - Brick 1 (Giza 4)"
          ]
      },
      {
          "id": "area_line2_1790674781879",
          "name": "Giza I - Brick 1",
          "code": "GZA-B38",
          "repId": "u1790626607816",
          "repName": "Ahmed Harb",
          "lineId": "line_1790626000002",
          "bricks": [
              "[B38] Giza I - Brick 1 (Giza 1)"
          ]
      },
      {
          "id": "area_line_1790626036368_1790674874231",
          "name": "Shobra - Brick 1",
          "code": "CAI-B13",
          "repId": "u1790626669586",
          "repName": "Mark Michel",
          "lineId": "line_1790626000003",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "11009"
              },
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "11102"
              }
          ],
          "bricks": [
              "[B13] Shobra - Brick 1 (Shobra 1)"
          ]
      },
      {
          "id": "area_line_1790626036368_1790687909664",
          "name": "Giza V - Brick 1",
          "code": "GZA-B49",
          "repId": "u1790687949946",
          "repName": "Mina Samir",
          "lineId": "line_1790626000003",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "20502"
              }
          ],
          "bricks": [
              "[B49] Giza V - Brick 1 (Giza 11)"
          ]
      },
      {
          "id": "area_line1_1790688137857",
          "name": "Haram - Brick 1",
          "code": "GZA-B43",
          "repId": "u1790626000005",
          "repName": "Mohamed Ramadan",
          "lineId": "line_1790626000001",
          "bricks": [
              "[B43] Haram - Brick 1 (El Haram 1)"
          ]
      },
      {
          "id": "area_line1_1790688157353",
          "name": "Giza V - Brick 2",
          "code": "GZA-B50",
          "repId": "u1790626000001",
          "repName": "Marco Magdy",
          "lineId": "line_1790626000001",
          "bricks": [
              "[B50] Giza V - Brick 2 (Giza 12)"
          ]
      },
      {
          "id": "area_line2_1790688168385",
          "name": "Giza V - Brick 2",
          "code": "GZA-B50",
          "repId": "u1790626000004",
          "repName": "David Emad",
          "lineId": "line_1790626000002",
          "bricks": [
              "[B50] Giza V - Brick 2 (Giza 12)"
          ]
      },
      {
          "id": "area_line1_1790688305597",
          "name": "Shobra - Brick 1",
          "code": "CAI-B13",
          "repId": "u1790688369929",
          "repName": "Marina Shobra",
          "lineId": "line_1790626000001",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "11009"
              },
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "11102"
              }
          ],
          "bricks": [
              "[B13] Shobra - Brick 1 (Shobra 1)"
          ]
      },
      {
          "id": "area_line2_1790688317554",
          "name": "Shobra - Brick 1",
          "code": "CAI-B13",
          "repId": "u1790688412219",
          "repName": "Monica Shobra",
          "lineId": "line_1790626000002",
          "aliases": [
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "11009"
              },
              {
                  "distributorId": "dist_1790626000001",
                  "rawText": "11102"
              }
          ],
          "bricks": [
              "[B13] Shobra - Brick 1 (Shobra 1)"
          ]
      }
  ],
  productLines: [],
  doctors: [],
  hospitals: [],
  pharmacies: [],
  visits: [],
  leaves: [],
  sales: [],
  announcements: [],
  notifications: [],
  distributors: [
    { id: "dist_1790626000001", name: "Ibn Sina Pharma", type: "commercial", columnMap: null },
    { id: "dist_1790626000002", name: "United Company of Pharmacists (UCP)", type: "commercial", columnMap: null },
    { id: "dist_1790626000003", name: "Overseas", type: "commercial", columnMap: null },
  ],
  pharmacyOverrides: [],
  publicHolidays: [{ date: "2026-10-06", title: "Armed Forces Day", titleAr: "Armed Forces Day" }],
};

// ============================================================================
// Section 2: Local Persistence Handling
// ============================================================================
function loadDataFromStorage() {
  try {
    const cached = localStorage.getItem("pharma_master_data");
    if (cached) {
      const data = JSON.parse(cached);
      if (data) {
        if (Array.isArray(data.users)) {
          // Preserve existing Arabic nameAr; only default to English name if missing
          data.users.forEach((u) => {
            if (u && u.name && !u.nameAr) {
              u.nameAr = u.name;
            }
          });
          // Auto-migrate legacy medical rep EMP- codes to REP-
          data.users.forEach((u) => {
            if (u.role === "medical_rep" || u.role === "rep") {
              if (u.employeeCode && u.employeeCode.startsWith("EMP-")) {
                u.employeeCode = u.employeeCode.replace(/^EMP-/, "REP-");
              }
              if (u.code && u.code.startsWith("EMP-")) {
                u.code = u.code.replace(/^EMP-/, "REP-");
              }
            }
          });

          // Strictly deduplicate users by ID and email, keeping the most complete record (with areas/lines)
          data.users.sort((a, b) => {
            const aScore = (a.area ? 2 : 0) + (a.lineId ? 1 : 0);
            const bScore = (b.area ? 2 : 0) + (b.lineId ? 1 : 0);
            return bScore - aScore;
          });

          const uniqueUsers = [];
          const seenIds = new Set();
          const seenEmails = new Set();

          data.users.forEach((u) => {
            if (!u) return;
            if (!u.id || typeof u.id !== "string" || !u.id.trim()) {
              u.id = genId("u");
            }
            const idKey = String(u.id);
            const emailKey = (u.email || "").toLowerCase().trim();

            if (seenIds.has(idKey)) return;
            if (emailKey && seenEmails.has(emailKey)) return;

            seenIds.add(idKey);
            if (emailKey) seenEmails.add(emailKey);
            uniqueUsers.push(u);
          });

          data.users = uniqueUsers;

          if ((typeof window !== "undefined" && window.DEMO_MODE === true) || data.users.length === 0) {
            DEFAULT_DEMO_DATA.users.forEach((u) => {
              const emailKey = (u.email || "").toLowerCase().trim();
              if (!data.users.some((existing) => existing.id === u.id || (emailKey && (existing.email || "").toLowerCase().trim() === emailKey))) {
                data.users.push(u);
              }
            });
          }

          // Self-healing: Repair missing managerId and hierarchy for existing stored users from default seed
          data.users.forEach((u) => {
            const def = DEFAULT_DEMO_DATA.users.find((du) => du.id === u.id || ((u.email || "").toLowerCase() === (du.email || "").toLowerCase()));
            if (def) {
              if (u.managerId === undefined || u.managerId === null) {
                u.managerId = def.managerId !== undefined ? def.managerId : null;
              }
              if (!u.lineId && def.lineId) {
                u.lineId = def.lineId;
              }
              if ((!u.lineIds || !u.lineIds.length) && Array.isArray(def.lineIds)) {
                u.lineIds = def.lineIds;
              }
              if (!u.hireDate && def.hireDate) {
                u.hireDate = def.hireDate;
              }
            } else if (!u.hireDate) {
              u.hireDate = "2024-01-15";
            }
          });
        }
        if (Array.isArray(data.notifications)) {
          data.notifications.forEach((n) => {
            if (n.titleEn) n.title = n.titleEn;
            if (n.messageEn) n.message = n.messageEn;
          });
        }
        if (data.currentUser) {
          const defCurrent = DEFAULT_DEMO_DATA.users.find((du) => du.id === data.currentUser.id || ((data.currentUser.email || "").toLowerCase() === (du.email || "").toLowerCase()));
          if (defCurrent && (data.currentUser.managerId === undefined || data.currentUser.managerId === null)) {
            data.currentUser.managerId = defCurrent.managerId !== undefined ? defCurrent.managerId : null;
          }
          if (!data.currentUser.hireDate) {
            data.currentUser.hireDate = defCurrent?.hireDate || "2024-01-15";
          }
        }
        if (!Array.isArray(data.distributors) || data.distributors.length === 0) {
          data.distributors = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.distributors));
        } else {
          DEFAULT_DEMO_DATA.distributors.forEach((d) => {
            if (!data.distributors.some((existing) => existing.id === d.id)) {
              data.distributors.push(d);
            }
          });
        }
        if (!Array.isArray(data.specialties) || data.specialties.length < DEFAULT_DEMO_DATA.specialties.length || data.specialties.some((s) => s.id === "spec_internal" && s.name === "Internal Medicine")) {
          data.specialties = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.specialties));
        }
        if (Array.isArray(data.doctors)) {
          data.doctors.forEach((d) => {
            if (!d) return;
            if (d.specialty === "Internal Medicine") { d.specialty = "IM"; d.specialtyId = "spec_im"; }
            else if (d.specialty === "Cardiology") { d.specialty = "CARD"; d.specialtyId = "spec_card"; }
            else if (d.specialty === "Orthopedics") { d.specialty = "ORTH"; d.specialtyId = "spec_orth"; }
            else if (d.specialty === "Pediatrics") { d.specialty = "PED"; d.specialtyId = "spec_ped"; }
            else if (d.specialty === "Dermatology") { d.specialty = "DERMA"; d.specialtyId = "spec_derma"; }
            else if (d.specialty === "Ophthalmology") { d.specialty = "OPHTH"; d.specialtyId = "spec_ophth"; }
            else if (d.specialty === "Neurology") { d.specialty = "NEURO"; d.specialtyId = "spec_neuro"; }
            else if (d.specialty === "Urology") { d.specialty = "URO"; d.specialtyId = "spec_uro"; }
            else if (d.specialty === "Gynecology") { d.specialty = "GYN"; d.specialtyId = "spec_gyn"; }
          });
        }
        if (Array.isArray(data.areas)) {
          data.areas.forEach((a) => {
            if (!a.lineId) a.lineId = "";
          });
          DEFAULT_DEMO_DATA.areas.forEach((da) => {
            if (!data.areas.some((existing) => existing.id === da.id)) {
              data.areas.push(da);
            }
          });
        } else {
          data.areas = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.areas));
        }
        if (Array.isArray(data.productLines)) {
          data.productLines.forEach((pl) => {
            if (!pl.callFrequency) {
              pl.callFrequency = { classA: 4, classB: 3, classC: 1 };
            }
            if (Array.isArray(pl.products)) {
              pl.products.forEach((p) => {
                if (p.dosage && p.name && !p.name.toLowerCase().includes(p.dosage.toLowerCase())) {
                  p.name = `${p.name} ${p.dosage}`.trim();
                }
              });
            }
          });
        } else {
          data.productLines = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.productLines));
        }
        // Ensure clean collections and purge all legacy demo data
        const demoUserIds = ["u1790626000001", "u1790626000002", "u1790626000003", "u1790626000004", "u1790626000005", "u1790626000014", "u1790626000015", "u1790626000016", "u1790626000012", "u1790626000013", "u1790626000011", "u1790626000018", "u1790626000019", "u1790626000017"];

        // Purge only ancient legacy single-digit demo mock IDs (e.g. d1, ph1, h1, v1, s1, l1).
        // NEVER purge legitimate system-generated entities (doc_*, pharm_*, hosp_*, visit_*, leave_*, etc.)!
        if (!Array.isArray(data.doctors)) data.doctors = [];
        data.doctors = data.doctors.filter((d) => d && d.id && !/^d\d{1,4}$/.test(d.id));

        if (!Array.isArray(data.pharmacies)) data.pharmacies = [];
        const demoPharmacyIds = ["ph_1790626000001", "ph_1790626000002", "ph_1790626000003", "ph_1790626000004", "ph_1790626000005", "ph_1790626000006", "ph_1790626000007"];
        data.pharmacies = data.pharmacies.filter((p) => p && p.id && !/^ph\d{1,4}$/.test(p.id) && !/^p\d{1,4}$/.test(p.id) && !demoPharmacyIds.includes(p.id));

        if (!Array.isArray(data.hospitals)) data.hospitals = [];
        data.hospitals = data.hospitals.filter((h) => h && h.id && !/^h\d{1,4}$/.test(h.id));

        if (!Array.isArray(data.visits)) data.visits = [];
        data.visits = data.visits.filter((v) => v && v.id && !/^v\d{1,4}$/.test(v.id) && !/^today_v\d+$/.test(v.id));

        if (!Array.isArray(data.sales)) data.sales = [];
        data.sales = data.sales.filter((s) => s && s.id && !/^s\d{1,4}$/.test(s.id) && !/^ds_s\d+$/.test(s.id));

        if (!Array.isArray(data.leaves)) data.leaves = [];
        data.leaves = data.leaves.filter((l) => l && l.id && !/^l\d{1,4}$/.test(l.id));

        if (!Array.isArray(data.quizzes)) data.quizzes = [];
        data.quizzes = data.quizzes.filter((q) => q && q.id && !/^q\d{1,4}$/.test(q.id) && q.id !== "quiz_101" && q.id !== "quiz_102");

        if (!Array.isArray(data.pharmacyOverrides)) data.pharmacyOverrides = [];
        if (!Array.isArray(data.notifications)) data.notifications = [];
        const legacyDemoNotifIds = ["notif_rep_1", "notif_rep_2", "notif_rep_3", "notif_dm_1", "notif_dm_2", "notif_hr_1"];
        data.notifications = data.notifications.filter((n) => n && n.userId && !legacyDemoNotifIds.includes(n.id));

        if (!Array.isArray(data.users)) data.users = [];
        if ((typeof window !== "undefined" && window.DEMO_MODE === true) || data.users.length === 0) {
          DEFAULT_DEMO_DATA.users.forEach((defUser) => {
            const emailKey = (defUser.email || "").toLowerCase().trim();
            if (!data.users.some((u) => u.id === defUser.id || (emailKey && (u.email || "").toLowerCase().trim() === emailKey))) {
              data.users.push(defUser);
            }
          });
        }
        // Auto-migration: If pharma_master_data still contains distributorSales, extract it to pharma_sales_data
        if ("distributorSales" in data) {
          if (Array.isArray(data.distributorSales) && data.distributorSales.length > 0) {
            try {
              if (!localStorage.getItem("pharma_sales_data")) {
                localStorage.setItem("pharma_sales_data", JSON.stringify(data.distributorSales));
              }
            } catch (e) {
              console.error("Error migrating distributorSales to pharma_sales_data:", e);
            }
          }
          delete data.distributorSales;
          try {
            localStorage.setItem("pharma_master_data", JSON.stringify(data));
          } catch (e) {}
        }
      }

      // Load distributorSales from dedicated pharma_sales_data storage
      let salesData = [];
      try {
        const cachedSales = localStorage.getItem("pharma_sales_data");
        if (cachedSales) {
          salesData = JSON.parse(cachedSales);
        }
      } catch (err) {
        console.error("Error loading pharma_sales_data from localStorage:", err);
      }
      if (Array.isArray(salesData)) {
        salesData = salesData.filter((s) => s && s.id && !s.id.startsWith("ds_s"));
      }
      data.distributorSales = Array.isArray(salesData) ? salesData : [];

      if (Array.isArray(data.targets)) {
        data.targets = data.targets.filter((t) => t && t.id && !t.id.startsWith("target_s"));
      }

      // One-time auto-migration for legacy IDs in cached localStorage (bypasses overhead on subsequent page loads)
      const isAlreadyMigrated = typeof localStorage !== "undefined" && localStorage.getItem("pharma_legacy_migrated_v2") === "true";
      if (!isAlreadyMigrated) {
        const legacyIdMap = {
        rep1: "u1790626000001", rep2: "u1790626000002", rep3: "u1790626000003", rep4: "u1790626000004", rep5: "u1790626000005",
        admin1: "u1790626000010", bu1: "u1790626000011", lm1: "u1790626000012", lm2: "u1790626000013",
        dm1: "u1790626000014", dm2: "u1790626000015", dm3: "u1790626000016", hr1: "u1790626000017",
        pm1: "u1790626000018", pm2: "u1790626000019"
      };
      const legacyLineMap = { line1: "", line2: "", line3: "line_1790626000003", line_1790626036368: "" };
      const legacyAreaMap = { area1: "area_1790626000001", area2: "area_1790626000002", area3: "area_1790626000003", area4: "area_1790626000004" };
      const legacyProdMap = {};
      const legacyPharmMap = { p1: "ph_1790626000001", p2: "ph_1790626000002", p3: "ph_1790626000003", p4: "ph_1790626000004", p5: "ph_1790626000005", p6: "ph_1790626000006", p7: "ph_1790626000007" };
      const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
      const legacyAnnMap = { ann1: "ann_1790626000001", ann2: "ann_1790626000002", ann3: "ann_1790626000003", ann4: "ann_1790626000004", ann5: "ann_1790626000005", ann6: "ann_1790626000006", ann7: "ann_1790626000007", ann8: "ann_1790626000008" };
      const legacyNotifMap = { notif_rep_1: "notif_1790626000001", notif_rep_2: "notif_1790626000002", notif_rep_3: "notif_1790626000003", notif_dm_1: "notif_1790626000004", notif_dm_2: "notif_1790626000005", notif_hr_1: "notif_1790626000006" };

      const legacyOldHashes = [
        "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
        "d041f6dd2d671f68144bd4d667f96a6146dbf2ed0f71f19b532ce1e2826f8f92",
        "89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b",
        "d174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869",
        "9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2",
        "ae087349bb953601482c9c52169257c0cb0371cbac3d921b5896a9aba8cc8a43",
        "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "070a3b5e8d4bd5c46acccb91c9c54614c0cd649e78c4c4719e3a64270bae5ddf"
      ];
      if (Array.isArray(data.users)) {
        let legacyHashSkippedCount = 0;
        data.users.forEach((u) => {
          if (legacyIdMap[u.id]) u.id = legacyIdMap[u.id];
          if (u.passwordHash && legacyOldHashes.includes(u.passwordHash)) {
            if (typeof window !== "undefined" && window.DEMO_MODE === true) {
              u.passwordHash = "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f";
              u.mustChangePassword = true;
            } else {
              legacyHashSkippedCount++;
            }
          }
          if (legacyIdMap[u.managerId]) u.managerId = legacyIdMap[u.managerId];
          if (legacyLineMap[u.lineId]) u.lineId = legacyLineMap[u.lineId];
          if (Array.isArray(u.lineIds)) u.lineIds = u.lineIds.map((l) => legacyLineMap[l] || l);
          if (legacyAreaMap[u.areaId]) u.areaId = legacyAreaMap[u.areaId];
          if (Array.isArray(u.areaIds)) u.areaIds = u.areaIds.map((a) => legacyAreaMap[a] || a);
          if (Array.isArray(u.productIds)) u.productIds = u.productIds.map((p) => legacyProdMap[p] || p);
        });
        if (legacyHashSkippedCount > 0) {
          console.warn("[Security] Skipped legacy password hash migration for " + legacyHashSkippedCount + " account(s) (DEMO_MODE is false).");
        }
      }
      if (Array.isArray(data.areas)) {
        data.areas.forEach((a) => {
          if (legacyAreaMap[a.id]) a.id = legacyAreaMap[a.id];
          if (legacyLineMap[a.lineId]) a.lineId = legacyLineMap[a.lineId];
          if (legacyIdMap[a.repId]) a.repId = legacyIdMap[a.repId];
          if (Array.isArray(a.aliases)) {
            a.aliases.forEach((al) => {
              if (legacyDistMap[al.distributorId]) al.distributorId = legacyDistMap[al.distributorId];
            });
          }
        });
      }
      if (Array.isArray(data.productLines)) {
        data.productLines.forEach((l) => {
          if (legacyLineMap[l.id]) l.id = legacyLineMap[l.id];
          if (legacyIdMap[l.lineManagerId]) l.lineManagerId = legacyIdMap[l.lineManagerId];
          if (Array.isArray(l.products)) {
            l.products.forEach((p) => {
              if (legacyProdMap[p.id]) p.id = legacyProdMap[p.id];
              if (p.dosage && p.name && !p.name.toLowerCase().includes(p.dosage.toLowerCase())) {
                p.name = `${p.name} ${p.dosage}`.trim();
              }
              if (Array.isArray(p.aliases)) {
                p.aliases.forEach((al) => {
                  if (legacyDistMap[al.distributorId]) al.distributorId = legacyDistMap[al.distributorId];
                });
              }
            });
          }
        });
      }
      if (Array.isArray(data.pharmacies)) {
        data.pharmacies.forEach((ph) => {
          if (legacyPharmMap[ph.id]) ph.id = legacyPharmMap[ph.id];
          if (legacyAreaMap[ph.areaId]) ph.areaId = legacyAreaMap[ph.areaId];
          if (legacyLineMap[ph.lineId]) ph.lineId = legacyLineMap[ph.lineId];
          if (legacyIdMap[ph.repId]) ph.repId = legacyIdMap[ph.repId];
        });
      }
      if (Array.isArray(data.distributors)) {
        data.distributors.forEach((d) => {
          if (legacyDistMap[d.id]) d.id = legacyDistMap[d.id];
        });
      }
      if (Array.isArray(data.importBatches)) {
        data.importBatches.forEach((b) => {
          if (legacyDistMap[b.distributorId]) b.distributorId = legacyDistMap[b.distributorId];
        });
      }
      if (Array.isArray(data.pharmacyOverrides)) {
        data.pharmacyOverrides.forEach((po) => {
          if (legacyDistMap[po.distributorId]) po.distributorId = legacyDistMap[po.distributorId];
          if (legacyAreaMap[po.areaId]) po.areaId = legacyAreaMap[po.areaId];
          if (legacyPharmMap[po.pharmacyId]) po.pharmacyId = legacyPharmMap[po.pharmacyId];
        });
      }
      if (Array.isArray(data.announcements)) {
        data.announcements.forEach((an) => {
          if (legacyAnnMap[an.id]) an.id = legacyAnnMap[an.id];
        });
      }
      if (Array.isArray(data.notifications)) {
        data.notifications.forEach((n) => {
          if (legacyNotifMap[n.id]) n.id = legacyNotifMap[n.id];
          if (legacyIdMap[n.userId]) n.userId = legacyIdMap[n.userId];
        });
      }
      if (Array.isArray(data.visits)) {
        data.visits.forEach((v) => {
          if (legacyIdMap[v.repId]) v.repId = legacyIdMap[v.repId];
          if (legacyLineMap[v.lineId]) v.lineId = legacyLineMap[v.lineId];
          if (legacyAreaMap[v.areaId]) v.areaId = legacyAreaMap[v.areaId];
        });
      }
      if (Array.isArray(data.targets)) {
        data.targets.forEach((t) => {
          if (legacyIdMap[t.repId]) t.repId = legacyIdMap[t.repId];
          if (legacyProdMap[t.productId]) t.productId = legacyProdMap[t.productId];
          if (legacyAreaMap[t.areaId]) t.areaId = legacyAreaMap[t.areaId];
          if (!t.areaId && t.repId && Array.isArray(data.areas)) {
            const matchedArea = data.areas.find((a) => a.repId === t.repId);
            if (matchedArea) t.areaId = matchedArea.id;
          }
        });
      }
      if (Array.isArray(data.distributorSales)) {
        let salesMigrated = false;
        data.distributorSales.forEach((s) => {
          if (s.distributorId && legacyDistMap[s.distributorId]) {
            s.distributorId = legacyDistMap[s.distributorId];
            salesMigrated = true;
          }
          if (s.productId && legacyProdMap[s.productId]) {
            s.productId = legacyProdMap[s.productId];
            salesMigrated = true;
          }
          if (s.pharmacyId && legacyPharmMap[s.pharmacyId]) {
            s.pharmacyId = legacyPharmMap[s.pharmacyId];
            salesMigrated = true;
          }
          if (s.lineId && legacyLineMap[s.lineId]) {
            s.lineId = legacyLineMap[s.lineId];
            salesMigrated = true;
          }
          if (s.areaId && legacyAreaMap[s.areaId]) {
            s.areaId = legacyAreaMap[s.areaId];
            salesMigrated = true;
          }
          if (s.repId && legacyIdMap[s.repId]) {
            s.repId = legacyIdMap[s.repId];
            salesMigrated = true;
          }
        });
        if (salesMigrated) {
          try {
            localStorage.setItem("pharma_sales_data", JSON.stringify(data.distributorSales));
          } catch (e) {}
        }
      }

      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("pharma_legacy_migrated_v2", "true");
        }
      } catch (e) {}
    }

      return data;
    }
  } catch (err) {
    console.error("Error loading pharma_master_data from localStorage:", err);
  }

  const defaultData = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
  let fallbackSales = [];
  try {
    const cachedSales = localStorage.getItem("pharma_sales_data");
    if (cachedSales) {
      fallbackSales = JSON.parse(cachedSales);
      if (Array.isArray(fallbackSales)) {
        let changed = false;
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        fallbackSales.forEach((s) => {
          if (s && s.distributorId && legacyDistMap[s.distributorId]) {
            s.distributorId = legacyDistMap[s.distributorId];
            changed = true;
          }
        });
        if (changed) {
          try {
            localStorage.setItem("pharma_sales_data", JSON.stringify(fallbackSales));
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
  defaultData.distributorSales = Array.isArray(fallbackSales) ? fallbackSales : [];
  return defaultData;
}

function saveDataToStorage() {
  try {
    if (!window.DEMO_DATA) return;
    // Exclude distributorSales from pharma_master_data to keep it lightweight and under quota
    const { distributorSales, ...cleanMasterData } = window.DEMO_DATA;
    localStorage.setItem("pharma_master_data", JSON.stringify(cleanMasterData));
    if (typeof window.pushLocalToCloud === "function" && !window._suppressCloudPush) {
      window.pushLocalToCloud();
    }
  } catch (err) {
    console.error("Error saving pharma_master_data to localStorage:", err);
  }
}

function saveSalesDataToStorage() {
  try {
    if (!window.DEMO_DATA) return;
    const sales = window.DEMO_DATA.distributorSales || [];
    localStorage.setItem("pharma_sales_data", JSON.stringify(sales));
    if (typeof window.pushSalesToCloud === "function" && !window._suppressCloudPush) {
      window.pushSalesToCloud();
    }
  } catch (err) {
    console.error("Error saving pharma_sales_data to localStorage:", err);
  }
}

const DEMO_DATA = loadDataFromStorage();
window.DEMO_DATA = DEMO_DATA;
window.saveDataToStorage = saveDataToStorage;
window.saveSalesDataToStorage = saveSalesDataToStorage;
window.loadDataFromStorage = loadDataFromStorage;

// Cross-tab synchronization: keep in-memory DEMO_DATA in sync across multiple tabs
window.addEventListener("storage", (e) => {
  if (e.key === "pharma_master_data" && e.newValue) {
    try {
      const fresh = JSON.parse(e.newValue);
      if (window.DEMO_DATA && typeof fresh === "object") {
        Object.assign(window.DEMO_DATA, fresh);
        document.dispatchEvent(new CustomEvent("pharma:storage:synced", { detail: { key: "pharma_master_data" } }));
        if (typeof window.updateWorkflowNotifUI === "function") {
          window.updateWorkflowNotifUI();
        }
      }
    } catch (err) {
      console.warn("[StorageSync] Failed to sync master data across tabs:", err);
    }
  }
  if (e.key === "pharma_sales_data" && e.newValue) {
    try {
      const freshSales = JSON.parse(e.newValue);
      if (window.DEMO_DATA && Array.isArray(freshSales)) {
        window.DEMO_DATA.distributorSales = freshSales;
        document.dispatchEvent(new CustomEvent("pharma:storage:synced", { detail: { key: "pharma_sales_data" } }));
      }
    } catch (err) {
      console.warn("[StorageSync] Failed to sync sales data across tabs:", err);
    }
  }
  if (e.key === "pharma_company_settings" && e.newValue) {
    try {
      const freshCs = JSON.parse(e.newValue);
      if (window.DEMO_DATA) {
        window.DEMO_DATA.companySettings = freshCs;
        document.dispatchEvent(new CustomEvent("pharma:storage:synced", { detail: { key: "pharma_company_settings" } }));
      }
    } catch (err) {}
  }
});

function getDynamicYears() {
  const current = (window.getSystemDate ? window.getSystemDate() : new Date()).getFullYear();
  const years = new Set([2025, 2026, current - 1, current, current + 1]);
  if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.targets)) {
    window.DEMO_DATA.targets.forEach((t) => {
      if (t.month && t.month.length >= 4) {
        const y = parseInt(t.month.slice(0, 4), 10);
        if (!isNaN(y) && y >= 2020 && y <= 2099) years.add(y);
      }
    });
  }
  return Array.from(years).sort((a, b) => a - b).map(String);
}
window.getDynamicYears = getDynamicYears;

function getVisitBacklogLimitDays() {
  const cs = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
  return typeof cs.visitBacklogLimitDays === "number" ? cs.visitBacklogLimitDays : 2;
}
window.getVisitBacklogLimitDays = getVisitBacklogLimitDays;

function getVisitBacklogMinDateStr() {
  const days = getVisitBacklogLimitDays();
  const d = (window.getSystemDate && window.getSystemDate()) || new Date();
  d.setDate(d.getDate() - days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
window.getVisitBacklogMinDateStr = getVisitBacklogMinDateStr;

function getPlannedVisitExpiryDays() {
  const cs = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
  return typeof cs.plannedVisitExpiryDays === "number" ? cs.plannedVisitExpiryDays : 7;
}
window.getPlannedVisitExpiryDays = getPlannedVisitExpiryDays;

// ============================================================================
// Section 3: Recursive Hierarchy & Multi-Line Helpers
// ============================================================================
function getAllSubordinates(managerId, visited = new Set()) {
  const users = (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const manager = users.find((u) => u.id === managerId);
  if (!manager) return [];

  const mgrRole = normalizeRole(manager.role);
  if (mgrRole === "admin" || mgrRole === "general_manager") {
    return users.filter((u) => normalizeRole(u.role) !== "admin");
  }

  visited.add(managerId);
  const direct = users.filter((u) => u.managerId === managerId && !visited.has(u.id));
  let all = [...direct];
  direct.forEach((d) => {
    visited.add(d.id);
    all = all.concat(getAllSubordinates(d.id, visited));
  });
  return all;
}

window.getAllSubordinates = getAllSubordinates;

// ============================================================================
// Central SFE Audit Rules & Visit Validation Checks
// ============================================================================
const MIN_MINUTES_BETWEEN_VISITS = 10;

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  if (/pm/i.test(clean) && hours < 12) hours += 12;
  if (/am/i.test(clean) && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function checkVisitTimeConflict(repId, visitDate, visitTime, currentVisitId = null) {
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};

  if (companySettings && companySettings.enforceVisitTimeConflict === false) {
    return { hasConflict: false };
  }

  const targetMinutes = parseTimeToMinutes(visitTime);
  if (targetMinutes === null) return { hasConflict: false };

  const list = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  for (const v of list) {
    if (v.id === currentVisitId) continue;
    if (v.repId !== repId) continue;
    if (v.date !== visitDate) continue;
    if (v.status === "rejected" || v.status === "missed") continue;

    const existingMinutes = parseTimeToMinutes(v.time);
    if (existingMinutes === null) continue;

    const diff = Math.abs(targetMinutes - existingMinutes);
    if (diff < MIN_MINUTES_BETWEEN_VISITS) {
      return {
        hasConflict: true,
        exactMatch: diff === 0,
        diffMinutes: diff,
        conflictingVisit: v,
        minRequired: MIN_MINUTES_BETWEEN_VISITS,
      };
    }
  }

  return { hasConflict: false };
}

function isDoctorAlreadyVisitedToday(doctorId, visitDate, repId, currentVisitId = null) {
  if (!doctorId || !visitDate) return false;
  const list = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (typeof demoVisits !== "undefined" && Array.isArray(demoVisits))
      ? demoVisits
      : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  return list.some((v) =>
    String(v.id) !== String(currentVisitId) &&
    v.repId === repId &&
    (v.doctorId === doctorId || v.targetId === doctorId) &&
    v.date === visitDate &&
    v.status !== "rejected" &&
    v.status !== "missed"
  );
}

function checkVisitDateAllowed(dateStr, repId, lang) {
  if (!dateStr) return { allowed: true };

  // 1. Official public holidays check
  const holidays = (window.DEMO_DATA && window.DEMO_DATA.publicHolidays)
    ? [...window.DEMO_DATA.publicHolidays]
    : [];
  try {
    const cachedHolidays = localStorage.getItem("pharma_public_holidays");
    if (cachedHolidays) {
      const parsed = JSON.parse(cachedHolidays);
      if (Array.isArray(parsed)) holidays.push(...parsed);
    }
  } catch (e) {}

  const holiday = holidays.find((h) => h.date === dateStr);
  if (holiday) {
    const hTitle = holiday.title || "Public Holiday";
    const msg = `Recording or saving visits on holidays is not permitted: The selected date (${dateStr}) is an official holiday (${hTitle}).`;
    return { allowed: false, reason: "public_holiday", message: msg };
  }

  // 2. Employee leaves check
  const leaves = (window.store && window.store.leaves
    ? window.store.leaves.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

  const matchedLeave = leaves.find((l) => {
    if (l.userId !== repId) return false;
    if (l.status === "rejected") return false;
    const lStart = l.startDate || l.endDate;
    const lEnd = l.endDate || l.startDate;
    if (!lStart || !lEnd) return false;
    return dateStr >= lStart && dateStr <= lEnd;
  });

  if (matchedLeave) {
    const typeNamesEn = {
      annual: "Annual",
      casual: "Casual",
      sick: "Sick",
      unpaid: "Unpaid",
      maternity: "Maternity",
    };
    const statusLabelsEn = {
      approved: "Approved",
      pending: "Pending Approval",
    };

    const lType = typeNamesEn[matchedLeave.type] || matchedLeave.type || "Leave";
    const lStatus = statusLabelsEn[matchedLeave.status] || matchedLeave.status || "Pending";
    const msg = `You have a registered leave (${lStatus}: ${lType}) on this date (${dateStr}). Recording or planning visits during leaves is not permitted.`;

    return { allowed: false, reason: "employee_leave", message: msg };
  }

  return { allowed: true };
}

window.parseTimeToMinutes = parseTimeToMinutes;
window.checkVisitTimeConflict = checkVisitTimeConflict;
window.checkVisitDateAllowed = checkVisitDateAllowed;
window.isDoctorAlreadyVisitedToday = isDoctorAlreadyVisitedToday;
window.MIN_MINUTES_BETWEEN_VISITS = MIN_MINUTES_BETWEEN_VISITS;

function getUserLines(userId) {
  const users = (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const user = users.find((u) => u.id === userId);
  if (!user) return [];

  const assignedLineIds = [...(user.lineIds || (user.lineId ? [user.lineId] : []))];
  lines.forEach((l) => {
    if (l.lineManagerId === userId && !assignedLineIds.includes(l.id)) {
      assignedLineIds.push(l.id);
    }
  });

  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'hr') {
    return lines;
  }

  if (role === 'business_unit') {
    const isLM = (u) => {
      const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase();
      return r === 'line_manager' || r === 'lm';
    };
    const myLMs = users.filter((u) => u.managerId === userId && isLM(u));
    const myLmIds = myLMs.map((u) => u.id);

    lines.forEach((l) => {
      if (myLmIds.includes(l.lineManagerId) && !assignedLineIds.includes(l.id)) {
        assignedLineIds.push(l.id);
      }
    });

    myLMs.forEach((lm) => {
      const lmLines = lm.lineIds || (lm.lineId ? [lm.lineId] : []);
      lmLines.forEach((lId) => {
        if (!assignedLineIds.includes(lId)) {
          assignedLineIds.push(lId);
        }
      });
    });
  }

  if (assignedLineIds.length === 0) {
    const areas = (window.store && window.store.areas ? window.store.areas.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    areas.forEach((a) => {
      const isAssigned = a.repId === userId || (user.areaIds && user.areaIds.includes(a.id));
      if (isAssigned && a.lineId && !assignedLineIds.includes(a.lineId)) {
        assignedLineIds.push(a.lineId);
      }
    });
  }

  if (assignedLineIds.length === 0 && user.managerId) {
    const mgr = users.find((u) => u.id === user.managerId);
    if (mgr) {
      const isRep = window.isRepRole ? window.isRepRole(user) : (role === 'medical_rep' || role === 'rep');
      if (isRep) {
        const primaryLine = mgr.lineId || (mgr.lineIds && mgr.lineIds[0]);
        if (primaryLine && !assignedLineIds.includes(primaryLine)) {
          assignedLineIds.push(primaryLine);
        }
      } else {
        const mgrLines = mgr.lineIds || (mgr.lineId ? [mgr.lineId] : []);
        mgrLines.forEach((lId) => {
          if (!assignedLineIds.includes(lId)) assignedLineIds.push(lId);
        });
      }
    }
  }

  return lines.filter((l) => assignedLineIds.includes(l.id));
}

window.getUserLines = getUserLines;

/**
 * Returns team members belonging to a specific product line within the user's hierarchy.
 * @param {string} lineId - Selected line ID or 'all'
 * @param {Object} user - Authenticated user object
 */
function getScopedTeamForLine(lineIdOrUser, maybeUser) {
  let lineId = lineIdOrUser;
  let user = maybeUser;
  if (lineIdOrUser && typeof lineIdOrUser === 'object' && !maybeUser) {
    user = lineIdOrUser;
    lineId = 'all';
  }
  const users = (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  if (!user) return [];
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || '').toLowerCase();

  let candidateUsers = [];
  if (role === 'medical_rep' || role === 'rep') {
    candidateUsers = [user];
  } else if (role === 'admin' || role === 'hr') {
    candidateUsers = users;
  } else if (role === 'business_unit' || role === 'bu') {
    const subordinates = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    candidateUsers = [user, ...subordinates];
  } else if (role === 'line_manager' || role === 'lm') {
    const subordinates = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    candidateUsers = [user, ...subordinates];
  } else if (role === 'district_manager' || role === 'dm') {
    const myReps = users.filter((u) => u.managerId === user.id);
    candidateUsers = [user, ...myReps];
  } else if (role === 'product_manager' || role === 'pm') {
    const userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    const lineUsers = users.filter((u) => {
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return userLineIds.some((lid) => uLineIds.includes(lid));
    });
    candidateUsers = [user, ...lineUsers];
  } else {
    candidateUsers = [user];
  }

  let result = candidateUsers;
  if (lineId && lineId !== 'all') {
    result = candidateUsers.filter((u) => {
      if (u.id === user.id) return true;
      const isRep = window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep');
      const isDM = (u.role === 'district_manager' || u.role === 'dm');
      const uLineIds = typeof window.getUserLines === 'function'
        ? window.getUserLines(u.id).map((l) => l.id)
        : (u.lineIds || (u.lineId ? [u.lineId] : []));

      if (isRep) {
        return uLineIds.includes(lineId);
      }

      if (isDM) {
        if (uLineIds.includes(lineId)) return true;
        const subs = users.filter((sub) => sub.managerId === u.id);
        return subs.some((sub) => {
          const subLines = typeof window.getUserLines === 'function'
            ? window.getUserLines(sub.id).map((l) => l.id)
            : (sub.lineIds || (sub.lineId ? [sub.lineId] : []));
          return subLines.includes(lineId);
        });
      }

      if (uLineIds.includes(lineId)) return true;

      const subs = users.filter((sub) => sub.managerId === u.id);
      return subs.some((sub) => {
        const subLines = typeof window.getUserLines === 'function'
          ? window.getUserLines(sub.id).map((l) => l.id)
          : (sub.lineIds || (sub.lineId ? [sub.lineId] : []));
        return subLines.includes(lineId);
      });
    });
  }

  result.lms = result.filter((u) => u.role === 'line_manager' || u.role === 'lm');
  result.dms = result.filter((u) => u.role === 'district_manager' || u.role === 'dm');
  result.reps = result.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')));
  return result;
}

window.getScopedTeamForLine = getScopedTeamForLine;

function getManagerChain(userId) {
  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const chain = [];
  const visited = new Set();
  if (userId) visited.add(userId);
  let user = users.find((u) => u.id === userId);

  while (user && user.managerId && !visited.has(user.managerId)) {
    visited.add(user.managerId);
    user = users.find((u) => u.id === user.managerId);
    if (user) chain.push(user);
  }
  return chain;
}

window.getManagerChain = getManagerChain;

function canApproveFor(targetUserId) {
  const currentUser = checkAuth();
  if (!currentUser) return false;
  const role = normalizeRole(currentUser.role);
  if (role === "admin" || role === "general_manager") return true;

  const chain = getManagerChain(targetUserId);
  return chain.some((m) => m.id === currentUser.id);
}

window.canApproveFor = canApproveFor;

function formatVisitDateTime(dateStr, timeStr) {
  const enDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let dayName = "";
  let validDate = dateStr || "";

  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const dayIndex = isNaN(d.getDay()) ? 0 : d.getDay();
    dayName = enDays[dayIndex];
  }

  const safeTime = timeStr || "10:00";

  return {
    dayName: dayName,
    date: validDate,
    time: safeTime,
    displayWithDay: dayName
      ? `${dayName} - ${validDate} (⏰ ${safeTime})`
      : `${validDate} (⏰ ${safeTime})`,
    dayAndTime: dayName ? `${dayName} • ⏰ ${safeTime}` : `⏰ ${safeTime}`,
  };
}

window.formatVisitDateTime = formatVisitDateTime;

function getSpecialtyById(specialtyId) {
  const specs = (window.DEMO_DATA && window.DEMO_DATA.specialties) || [];
  return specs.find((s) => s.id === specialtyId) || null;
}
window.getSpecialtyById = getSpecialtyById;

function getDoctorCallTarget(doc) {
  if (!doc) return 4;
  const docClass = (doc.class || "A").toUpperCase();
  if (docClass === "HOSPITAL" || doc.type === "hospital" || doc.type === "Hospital") {
    return 6;
  }

  const allLines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  let targetFreq = null;

  // 1. Direct lineId on doctor
  let lineId = doc.lineId || (doc.lineIds && doc.lineIds[0]);

  // 2. Line via assigned rep
  if (!lineId && doc.repId) {
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const rep = allUsers.find((u) => u.id === doc.repId);
    if (rep) {
      lineId = (rep.lineIds && rep.lineIds[0]) || rep.lineId;
    }
  }

  // 3. Line via territory/area assignment if rep is not directly set
  if (!lineId && (doc.areaId || doc.area)) {
    const allAreas = (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const area = allAreas.find((a) => a.id === doc.areaId || a.name === doc.area);
    if (area && area.repId) {
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const rep = allUsers.find((u) => u.id === area.repId);
      if (rep) {
        lineId = (rep.lineIds && rep.lineIds[0]) || rep.lineId;
      }
    }
  }

  if (lineId) {
    const line = allLines.find((l) => l.id === lineId);
    if (line && line.callFrequency) {
      if (docClass === "A" && line.callFrequency.classA !== undefined) {
        targetFreq = Number(line.callFrequency.classA);
      } else if (docClass === "B" && line.callFrequency.classB !== undefined) {
        targetFreq = Number(line.callFrequency.classB);
      } else if (docClass === "C" && line.callFrequency.classC !== undefined) {
        targetFreq = Number(line.callFrequency.classC);
      }
    }
  }

  if (targetFreq === null && allLines.length > 0 && allLines[0].callFrequency) {
    const defaultFreq = allLines[0].callFrequency;
    if (docClass === "A" && defaultFreq.classA !== undefined) targetFreq = Number(defaultFreq.classA);
    else if (docClass === "B" && defaultFreq.classB !== undefined) targetFreq = Number(defaultFreq.classB);
    else if (docClass === "C" && defaultFreq.classC !== undefined) targetFreq = Number(defaultFreq.classC);
  }

  if (targetFreq === null) {
    targetFreq = docClass === "A" ? 4 : (docClass === "B" ? 3 : 1);
  }
  return targetFreq;
}
window.getDoctorCallTarget = getDoctorCallTarget;

function isPlannedVisitExpired(dateStr) {
  if (!dateStr) return false;
  const expiryDays = (typeof window.getPlannedVisitExpiryDays === "function")
    ? window.getPlannedVisitExpiryDays()
    : 7;
  const parts = String(dateStr).split("T")[0].split("-");
  const now = (typeof window.getSystemDate === "function" && window.getSystemDate()) || new Date();
  if (parts.length !== 3) {
    const planDate = new Date(dateStr);
    return (now.getTime() - planDate.getTime()) / (1000 * 3600 * 24) > expiryDays;
  }
  const planDateMidnight = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
    0, 0, 0, 0
  );
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, 0, 0, 0
  );
  const diffDays = (todayMidnight.getTime() - planDateMidnight.getTime()) / (1000 * 3600 * 24);
  return diffDays > expiryDays;
}
window.isPlannedVisitExpired = isPlannedVisitExpired;

// ============================================================================
// Section 3.4a: Shared Core Utilities (Single Source of Truth)
// ============================================================================
/**
 * Hashes a plaintext password string using Web Crypto SHA-256 with fallback.
 * @param {string} str - Plaintext password to hash.
 * @returns {Promise<string>} Hexadecimal SHA-256 hash or fallback hash.
 */
function _sha256FallbackHex(input) {
  const utf8 = unescape(encodeURIComponent(String(input)));
  const words = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= utf8.charCodeAt(i) << (24 - (i % 4) * 8);
  }
  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (24 - (bitLen % 32));
  words[(((bitLen + 64) >> 9) << 4) + 15] = bitLen;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Array(64);
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      if (t < 16) {
        W[t] = words[i + t] | 0;
      } else {
        const s0 = rotr(7, W[t - 15]) ^ rotr(18, W[t - 15]) ^ (W[t - 15] >>> 3);
        const s1 = rotr(17, W[t - 2]) ^ rotr(19, W[t - 2]) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
}

async function hashPassword(str) {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {}
  }
  return _sha256FallbackHex(str);
}
window.hashPassword = hashPassword;

/**
 * Dynamically computes employee rollover balance from previous year based on companySettings.
 * @param {string} userId - Employee ID.
 * @param {number} [targetYear] - Target year to compute rollover for.
 * @returns {object} Rollover summary and balances.
 */
function getEmployeeLeaveRollover(userId, targetYear) {
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};

  if (companySettings.allowLeaveRollover === false) {
    return {
      initialCarriedOver: 0,
      consumedFromRollover: 0,
      remainingRollover: 0,
      carriedOver: 0,
      isValid: false,
      isExpired: false,
      expiryDate: null,
      maxCap: 0,
      graceMonths: 0,
      consumedFromNewAnnual: 0,
    };
  }

  const allUsers = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users))
    ? window.DEMO_DATA.users
    : [];
  const userObj = allUsers.find((u) => u.id === userId) || {};
  const userBalance = userObj.leaveBalance || {};
  const annualTotal = userBalance.annual !== undefined ? Number(userBalance.annual) : 21;

  const currentYear = targetYear || (window.getSystemDate ? window.getSystemDate() : new Date()).getFullYear();
  const prevYearStr = String(currentYear - 1);
  const currentYearStr = String(currentYear);
  const todayStr = (typeof window.getSystemTodayStr === "function")
    ? window.getSystemTodayStr()
    : new Date().toISOString().slice(0, 10);

  const allLeaves = (window.store && window.store.leaves
    ? window.store.leaves.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || (typeof demoLeaves !== "undefined" ? demoLeaves : []) || [];

  let prevYearUsed = 0;
  allLeaves.forEach((l) => {
    if (l.userId === userId && l.status === "approved" && l.type === "annual" && l.startDate && l.startDate.startsWith(prevYearStr)) {
      prevYearUsed += (parseFloat(l.days) || 1);
    }
  });

  const leftover = Math.max(0, annualTotal - prevYearUsed);
  const maxCap = companySettings.leaveRolloverMaxDays !== undefined ? Number(companySettings.leaveRolloverMaxDays) : 5;
  const initialCarriedOver = maxCap > 0 ? Math.min(leftover, maxCap) : leftover;

  const graceMonths = Number(companySettings.leaveRolloverGraceMonths) || 3;
  let expiryDate = `${currentYear}-03-31`;
  if (graceMonths === 1) expiryDate = `${currentYear}-01-31`;
  else if (graceMonths === 3) expiryDate = `${currentYear}-03-31`;
  else if (graceMonths === 6) expiryDate = `${currentYear}-06-30`;
  else if (graceMonths === 12) expiryDate = `${currentYear}-12-31`;

  let gracePeriodApprovedTaken = 0;
  let postGraceApprovedTaken = 0;
  allLeaves.forEach((l) => {
    if (l.userId === userId && l.status === "approved" && l.type === "annual" && l.startDate && l.startDate.startsWith(currentYearStr)) {
      const days = parseFloat(l.days) || 1;
      if (l.startDate <= expiryDate) {
        gracePeriodApprovedTaken += days;
      } else {
        postGraceApprovedTaken += days;
      }
    }
  });

  const consumedFromRollover = Math.min(initialCarriedOver, gracePeriodApprovedTaken);
  const remainingRollover = Math.max(0, initialCarriedOver - consumedFromRollover);
  const consumedFromNewAnnual = Math.max(0, gracePeriodApprovedTaken - initialCarriedOver) + postGraceApprovedTaken;

  const isValid = initialCarriedOver > 0 && todayStr <= expiryDate;
  const isExpired = remainingRollover > 0 && todayStr > expiryDate;

  return {
    initialCarriedOver,
    consumedFromRollover,
    remainingRollover,
    carriedOver: remainingRollover,
    isValid,
    isExpired,
    expiryDate,
    maxCap,
    graceMonths,
    consumedFromNewAnnual,
  };
}
window.getEmployeeLeaveRollover = getEmployeeLeaveRollover;

/**
 * Resolves the District Manager ID assigned to an area directly or via its representative.
 * @param {object} area - Area data object.
 * @param {Array} [allUsers] - Array of all users for relationship resolution.
 * @returns {string|null} District Manager user ID or null.
 */
function getAreaManagerId(area, allUsers = []) {
  try {
    if (!area) return null;
    if (area.dmId) return area.dmId;
    if (area.managerId) return area.managerId;

    const userList = (Array.isArray(allUsers) && allUsers.length > 0)
      ? allUsers
      : ((window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    if (area.repId) {
      const rep = userList.find((u) => u.id === area.repId);
      if (rep && rep.managerId) return rep.managerId;
    }

    const areaNameLower = String(area.name || "").toLowerCase().trim();

    const allDocs = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
    const docWithRep = allDocs.find((d) => (d.areaId === area.id || (d.area && String(d.area).toLowerCase().trim() === areaNameLower)) && d.repId);
    if (docWithRep) {
      const docRep = userList.find((u) => u.id === docWithRep.repId);
      if (docRep && docRep.managerId) return docRep.managerId;
    }

    const allSales = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : (window.DEMO_DATA && window.DEMO_DATA.sales) || []);
    const saleWithDm = allSales.find((s) => (s.areaId === area.id || (s.area && String(s.area).toLowerCase().trim() === areaNameLower)) && s.dmId);
    if (saleWithDm) return saleWithDm.dmId;

    if (area.lineId) {
      const dmsInLine = userList.filter((u) =>
        normalizeRole(u.role) === "district_manager" &&
        ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId)
      );
      const lmsInLine = userList.filter((u) =>
        normalizeRole(u.role) === "line_manager" &&
        ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId)
      );
      if (dmsInLine.length === 1 && lmsInLine.length <= 1) {
        return dmsInLine[0].id;
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}
window.getAreaManagerId = getAreaManagerId;
window.__appGetAreaManagerId = getAreaManagerId;

/**
 * Retrieves the DM accompaniment schedule mapping from local cache.
 * @param {string} dmId - District Manager ID.
 * @returns {object} Map of accompaniment schedule entries by date.
 */
function getDmAccompanimentSchedule(dmId) {
  try {
    const raw = localStorage.getItem("pharma_dm_accompaniments");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[dmId]) {
        let changed = false;
        Object.keys(data[dmId]).forEach((dateStr) => {
          if (typeof isPlannedVisitExpired === "function" && isPlannedVisitExpired(dateStr)) {
            delete data[dmId][dateStr];
            changed = true;
          }
        });
        if (changed) {
          try {
            localStorage.setItem("pharma_dm_accompaniments", JSON.stringify(data));
          } catch (err) {}
        }
        return data[dmId];
      }
    }
  } catch (e) {}
  return {};
}
window.getDmAccompanimentSchedule = getDmAccompanimentSchedule;

// ============================================================================
// Section 3.4b: Excel & Sales Parsing Helpers (Single Source of Truth)
// ============================================================================
/**
 * Parses numeric sales value or quantity from Excel/CSV imports:
 * - Eastern Arabic / Indic numerals (e.g. U+0660 to U+0669)
 * - Accounting negative notation in parentheses e.g. (1,500.00) or (250)
 * - Trailing negative signs e.g. 1500-
 * - Standard negative signs e.g. -1500
 * - European decimal notation (1.250,50)
 * - Standard thousand-separator format (1,250.50)
 */
function parseSalesNumber(val) {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "number") return val;
  let s = String(val).trim();
  if (!s) return NaN;

  // Check if negative in accounting formats: (1,500) or 1500- or -1500
  const isAccountingNegative = (s.startsWith("(") && s.endsWith(")")) || s.endsWith("-") || s.startsWith("-");

  // Convert Eastern Arabic-Indic and Persian digits (0-9) to Latin
  s = s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  s = s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());

  // Clean parentheses and leading/trailing minus signs before format detection
  s = s.replace(/[\(\)]/g, "").replace(/^-+|-+$/g, "").trim();

  // European format: dot as thousands separator, comma as decimal (e.g. 1.250,50)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(,\d{1,2})$/.test(s)) {
    // European decimal without thousands dots (e.g. 1250,50)
    s = s.replace(",", ".");
  } else {
    // Standard: remove thousand commas
    s = s.replace(/,/g, "");
  }

  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return NaN;
  const res = isAccountingNegative ? -Math.abs(num) : num;
  return res === 0 ? 0 : res;
}
window.parseSalesNumber = parseSalesNumber;

/**
 * Parses date strictly from Excel/CSV imports, prioritizing DD/MM/YYYY and YYYY-MM-DD
 */
function parseDateStrict(dateRaw) {
  if (!dateRaw && dateRaw !== 0) return null;
  if (dateRaw instanceof Date && !isNaN(dateRaw.getTime())) {
    return dateRaw.toISOString().slice(0, 10);
  }
  if (typeof dateRaw === "number") {
    const d = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
    return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
  }
  const str = String(dateRaw).trim();
  if (!str) return null;

  const isValidCalendarDate = (y, m, d) => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  };

  // Check DD/MM/YYYY or DD-MM-YYYY (with safe swap if US MM/DD/YYYY where second part > 12)
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    let p1 = parseInt(dmy[1], 10);
    let p2 = parseInt(dmy[2], 10);
    const year = parseInt(dmy[3], 10);
    if (p2 > 12 && p1 >= 1 && p1 <= 12) {
      const tmp = p1; p1 = p2; p2 = tmp;
    }
    if (isValidCalendarDate(year, p2, p1)) {
      return `${dmy[3]}-${String(p2).padStart(2, "0")}-${String(p1).padStart(2, "0")}`;
    }
    return null;
  }

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (isValidCalendarDate(year, m, d)) {
      return `${ymd[1]}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return null;
  }

  const d = new Date(str);
  return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}
window.parseDateStrict = parseDateStrict;

// ============================================================================
// Section 3.5: Centralized Role & Permission Engine (Single Source of Truth)
// ============================================================================

/**
 * Standard Role Constants Enum (Immutable).
 * Centralizes all system role identifiers to prevent typos and ensure strict type-safety.
 */
const ROLES = Object.freeze({
  ADMIN: "admin",
  GM: "general_manager",
  BU: "business_unit",
  PM: "product_manager",
  LM: "line_manager",
  DM: "district_manager",
  REP: "medical_rep",
  HR: "hr",

  // Long-form canonical aliases
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

function resolveUserForAuth(user) {
  if (user && user.role) return user;
  if (typeof checkAuth === "function") {
    const auth = checkAuth();
    if (auth && auth.role) return auth;
  }
  return { role: "", id: null };
}

/**
 * Safely extracts and normalizes the role from a user object, string, or active session.
 */
function extractUserRole(userOrRole) {
  if (!userOrRole) return "";
  if (typeof userOrRole === "object") return normalizeRole(userOrRole.role);
  return normalizeRole(userOrRole);
}

function isAdmin(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "admin";
}

function isManagerRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return [
    "admin",
    "general_manager",
    "business_unit",
    "line_manager",
    "district_manager",
    "product_manager",
  ].includes(u);
}

function isRepRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "medical_rep";
}

function isPMRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "product_manager";
}

function isDMRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "district_manager";
}

function isLMRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "line_manager";
}

function isBURole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "business_unit";
}

function isGMRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "general_manager";
}

function isHRRole(user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return u === "hr";
}

function isRoleMatch(userOrRole, targetRole) {
  const u = userOrRole ? extractUserRole(userOrRole) : normalizeRole(resolveUserForAuth()?.role);
  return u === normalizeRole(targetRole);
}

function hasAnyRole(allowedRoles = [], user) {
  const u = user ? extractUserRole(user) : normalizeRole(resolveUserForAuth()?.role);
  return allowedRoles.map(normalizeRole).includes(u);
}

window.ROLES = ROLES;
window.normalizeRole = normalizeRole;
window.extractUserRole = extractUserRole;
window.isAdmin = isAdmin;
window.isManagerRole = isManagerRole;
window.isRepRole = isRepRole;
window.isPMRole = isPMRole;
window.isDMRole = isDMRole;
window.isLMRole = isLMRole;
window.isBURole = isBURole;
window.isGMRole = isGMRole;
window.isHRRole = isHRRole;
window.isRoleMatch = isRoleMatch;
window.hasAnyRole = hasAnyRole;

// ============================================================================
// Section 3.6: Centralized Storage Dictionary & Utilities (Single Source of Truth)
// ============================================================================

/**
 * Standard LocalStorage & SessionStorage Keys Dictionary (Immutable).
 * Centralizes all storage keys across the system to prevent key fragmentation and typos.
 */
const STORAGE_KEYS = Object.freeze({
  // Session & Authentication
  USER: "pharmaUser",
  USER_ID: "userId",
  USER_ROLE: "userRole",
  LOGGED_OUT: "pharma_logged_out",
  IMPERSONATING_ADMIN: "impersonating_admin",

  // Preferences & Appearance
  THEME: "pharmaTheme",
  LANG: "pharmaLang",
  FALLBACK_LANG: "lang",

  // Master & Core Data Stores
  MASTER_DATA: "pharma_master_data",
  SALES_DATA: "pharma_sales_data",
  COMPANY_SETTINGS: "pharma_company_settings",
  SERVICES_DATA: "pharma_services_data",
  EXPENSES_DATA: "pharma_expenses_data",
  SALES_BUDGETS: "pharma_sales_budgets",
  ANNOUNCEMENTS: "pharmaAnnouncements",
  PUBLIC_HOLIDAYS: "pharma_public_holidays",
  DM_ACCOMPANIMENTS: "pharma_dm_accompaniments",
  ACTIVITIES_DATA: "pharma_activities_data",
  REPORTS_DATA: "pharma_reports_data",
  QUIZZES: "pharma_quizzes",
  QUIZ_SCORES: "pharma_quiz_scores",

  // Offline & Synchronization
  OFFLINE_QUEUE: "pharma_offline_queue",
  OFFLINE_SYNC_LOG: "pharma_offline_sync_log",
});

/**
 * Safe Storage Access Utility with built-in JSON parsing, error boundaries, and quota protection.
 */
const StorageUtil = Object.freeze({
  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(key);
      if (val === null || val === undefined) return defaultValue;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    } catch (e) {
      console.warn("StorageUtil.get failed for key:", key, e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      const str = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
      localStorage.setItem(key, str);
      return true;
    } catch (e) {
      console.warn("StorageUtil.set failed for key:", key, e);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn("StorageUtil.remove failed for key:", key, e);
      return false;
    }
  },
});

window.STORAGE_KEYS = STORAGE_KEYS;
window.StorageUtil = StorageUtil;

// ============================================================================
// Section 3.7: Centralized Status Engine & Badge Generators (Single Source of Truth)
// ============================================================================

/**
 * Standard System Status Constants (Immutable).
 * Centralizes workflow, request, and entity lifecycle states.
 */
const STATUS = Object.freeze({
  // Generic & Workflow States
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  PLANNED: "planned",
  DRAFT: "draft",
  DISBURSED: "disbursed",

  // Multi-tier Approvals
  PENDING_DM: "pending_dm",
  PENDING_LM: "pending_lm",
  PENDING_HR: "pending_hr",
  PENDING_BU: "pending_bu",
  PENDING_PM: "pending_pm",
  PENDING_GM: "pending_gm",
  PENDING_SHARED: "pending_shared",

  // Account & Entity Lifecycle
  ACTIVE: "active",
  INACTIVE: "inactive",
});

/**
 * Normalizes any status string into a clean, canonical format.
 */
function normalizeStatus(status) {
  if (!status) return "";
  return String(status).toLowerCase().trim().replace(/[\s-]+/g, "_");
}

/**
 * Retrieves the appropriate CSS class and default text for a given status.
 */
function getStatusBadgeConfig(status) {
  const s = normalizeStatus(status);
  switch (s) {
    case "approved":
      return { css: "bg-success", text: "Approved" };
    case "completed":
      return { css: "bg-success", text: "Completed" };
    case "active":
      return { css: "bg-success", text: "Active" };
    case "disbursed":
      return { css: "bg-success", text: "Disbursed" };
    case "rejected":
      return { css: "bg-danger", text: "Rejected" };
    case "inactive":
      return { css: "bg-danger", text: "Inactive" };
    case "pending":
      return { css: "bg-warning text-dark", text: "Pending" };
    case "pending_dm":
      return { css: "bg-warning text-dark", text: "Pending DM" };
    case "pending_hr":
      return { css: "bg-warning text-dark", text: "Pending HR" };
    case "pending_lm":
      return { css: "bg-info text-dark", text: "Pending LM" };
    case "pending_bu":
      return { css: "bg-primary", text: "Pending BU" };
    case "pending_gm":
      return { css: "bg-dark", text: "Pending GM" };
    case "pending_shared":
      return { css: "bg-warning text-dark", text: "Pending Shared" };
    case "planned":
      return { css: "bg-info text-dark", text: "Planned" };
    case "draft":
      return { css: "bg-secondary", text: "Draft" };
    case "cancelled":
      return { css: "bg-secondary", text: "Cancelled" };
    default:
      return { css: "bg-secondary", text: status || "Unknown" };
  }
}

/**
 * Generates an accessible, theme-consistent Bootstrap status badge HTML element.
 */
function renderStatusBadge(status, customLabel = null) {
  const config = getStatusBadgeConfig(status);
  const label = customLabel || config.text;
  return `<span class="badge ${config.css} status-badge">${escapeHtml(label)}</span>`;
}

function isStatusPending(status) {
  return normalizeStatus(status).startsWith("pending");
}

function isStatusApproved(status) {
  const s = normalizeStatus(status);
  return s === "approved" || s === "completed";
}

function isStatusRejected(status) {
  const s = normalizeStatus(status);
  return s === "rejected" || s === "cancelled";
}

window.STATUS = STATUS;
window.normalizeStatus = normalizeStatus;
window.getStatusBadgeConfig = getStatusBadgeConfig;
window.renderStatusBadge = renderStatusBadge;
window.isStatusPending = isStatusPending;
window.isStatusApproved = isStatusApproved;
window.isStatusRejected = isStatusRejected;

// ============================================================================
// Section 3.8: Centralized Currency, Number & Date Formatters (Single Source of Truth)
// ============================================================================

/**
 * Formats a numeric value into a localized currency string with thousand separators.
 * Safe against null, undefined, and NaN inputs.
 */
function formatCurrency(amount, currency = "EGP", decimals = 2) {
  const n = Number(amount);
  if (isNaN(n) || amount === null || amount === undefined || amount === "") {
    return (0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (currency ? ` ${currency}` : "");
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (currency ? ` ${currency}` : "");
}

/**
 * Fast currency number formatter specifically tailored for EGP financial reporting.
 */
function formatEGP(amount, includeSymbol = false) {
  const n = Number(amount) || 0;
  const str = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return includeSymbol ? `${str} EGP` : str;
}

/**
 * Universal date formatter supporting ISO (YYYY-MM-DD), British (DD/MM/YYYY), short (DD/MM), and human-readable formats.
 * Safe against invalid, null, or undefined dates (returns empty string instead of NaN-NaN-NaN).
 */
function formatDate(dateInput, format = "YYYY-MM-DD") {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  switch (format) {
    case "YYYY-MM-DD":
      return `${y}-${m}-${day}`;
    case "DD/MM/YYYY":
      return `${day}/${m}/${y}`;
    case "DD/MM":
      return `${day}/${m}`;
    case "human":
    case "medium": {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[d.getMonth()]} ${y}`;
    }
    default:
      return `${y}-${m}-${day}`;
  }
}

/**
 * Formats general numeric quantities with localized thousand separators.
 */
function formatNumber(val, decimals = 0) {
  const n = Number(val);
  if (isNaN(n) || val === null || val === undefined) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Safely triggers an immediate file download in the browser from string content or Blob.
 * Handles Blob creation, temporary link lifecycle, and proper memory cleanup via revokeObjectURL.
 */
function downloadBlob(contentOrBlob, filename = "download.txt", mimeType = "text/plain;charset=utf-8;") {
  if (typeof window !== "undefined" && window.ExportService && typeof window.ExportService.downloadBlob === "function") {
    return window.ExportService.downloadBlob(contentOrBlob, filename, mimeType);
  }
  if (contentOrBlob === null || contentOrBlob === undefined) return false;
  if (typeof window === "undefined" || !window.document) return true;
  try {
    const blob = contentOrBlob instanceof Blob ? contentOrBlob : new Blob([contentOrBlob], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (err) {
    console.warn("downloadBlob failed:", err);
    return false;
  }
}

window.formatCurrency = formatCurrency;
window.formatEGP = formatEGP;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.downloadBlob = downloadBlob;

// ============================================================================
// Section 4: Localization Dictionary
// ============================================================================
const translations = {
  en: {
    brandName: "PharmaCare",
    brandSub: "Excellence in Healthcare",
    navMain: "Main Menu",
    navHome: "Home",
    navVisits: "Visits",
    navCalendar: "Calendar",
    navRequests: "Requests",
    navVacations: "Vacations",
    navNotifications: "Notifications",
    navSettings: "Settings",
    navReports: "Reports",
    navDoctors: "Doctors",
    navPharmacies: "Pharmacies",
    navPlan: "My Plan",
    navCoverage: "Coverage",
    navActivities: "Activities",
    navLeaves: "Leaves",
    navSales: "Sales",
    navQuizzes: "Quizzes",
    navProducts: "Products",
    navAreas: "Areas",
    navDistributors: "Distributors",
    navUsers: "Users",
    navProfile: "Profile",
    navHelp: "Help",
    roleAdmin: "System Admin",
    roleBusinessUnit: "BU Head",
    roleLineManager: "Line Manager",
    roleDistrictManager: "District Manager",
    roleMedicalRep: "Medical Representative",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search...",
    filter: "Filter",
    submit: "Submit",
    approve: "Approve",
    reject: "Reject",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    viewAll: "View All",
    loading: "Loading...",
    noData: "No data available",
    welcome: "Welcome",
    logout: "Logout",
    roleHR: "HR Manager",
    navAnnouncements: "Announcements",
    logActualVisit: "Log Actual Visit",
    plannedVisit: "Planned Visit",
    actualVisit: "Actual Visit (Direct)",
    officeWork: "Office Work",
    training: "Training",
    meeting: "Meeting",
    conference: "Conference",
    periodAM: "AM",
    periodPM: "PM",
    periodFullDay: "Full Day",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    btnShow: "Show",
    userCodeLabel: "Code:",
    selectRep: "Viewing Schedule For:",
    browseOrgTree: "Browse Org Hierarchy",
    viewAllTeam: "View All Team",
    selectAllTeam: "Select Entire Team",
    orgTreeTitle: "Select Team Member / Branch",
    orgTreeSubtitle: "Pick any Level (BU, LM, DM, or Rep) or search directly",
    navPlansReview: "Plans Review",
    close: "Close",
    leaveAllocationTitle: "Leave Balance Allocation (Days)",
    leaveAllocationSub: "Set initial annual, casual, and sick days",
    hrGovernanceTitle: "HR Governance: Leave Balances & Public Holidays",
    employeeBalanceControl: "Employee Leave Balance Allocation",
    employeeBalanceControlSub:
      "Customize annual, casual, and sick days per employee",
    selectEmployee: "Select Employee",
    chooseEmployee: "Choose an employee...",
    annualDaysLabel: "Annual (Days)",
    casualDaysLabel: "Casual (Days)",
    sickDaysLabel: "Sick (Days)",
    saveEmployeeBalance: "Save Employee Balance",
    declarePublicHoliday: "Declare Official Public Holiday",
    declarePublicHolidaySub: "Company-wide calendar, zero balance deduction",
    holidayDateLabel: "Holiday Date",
    holidayTitleLabel: "Holiday Title",
    addHolidayBtn: "Add Official Public Holiday",
    currentHolidays: "Currently Declared Public Holidays:",
    totalDays: "Total",
    notifCenterTitle: "Notifications",
    notifMarkAllRead: "Mark all as read",
    notifClearAll: "Clear all",
    notifEmptyTitle: "No notifications",
    notifEmptyDesc: "Workflow approvals, rejections, and directives will appear here live.",
    notifTabAll: "All",
    notifTabUnread: "Unread",
    notifNew: "New",
    notifViewDetails: "View Details",
    teamFilterLabel: "Employee Filter:",
    notifDirectiveLabel: "Directive / Note:",
  }

};

window.translations = translations;
translations.ar = translations.en; // Safe fallback alias to guarantee zero runtime exceptions

function getCurrentLang() {
  return "en";
}
window.getCurrentLang = getCurrentLang;

try {
  localStorage.setItem("pharmaLang", "en");
  localStorage.setItem("lang", "en");
  if (document.documentElement) {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
  }
} catch (e) {}

function applyTranslations(lang) {
  const current = "en";
  const dict = translations[current];
  if (!dict) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });
}

function switchLanguage(lang) {
  try {
    localStorage.setItem("pharmaLang", "en");
    localStorage.setItem("lang", "en");
  } catch (e) {}
  document.documentElement.dir = "ltr";
  document.documentElement.lang = "en";

  applyTranslations("en");
  document.dispatchEvent(
    new CustomEvent("languageChanged", { detail: { lang: "en" } }),
  );

  renderSidebar(window.currentActivePage || resolveActivePage());
  renderTopbar();
}

// ============================================================================
// Section 5: Mobile Sidebar Drawer Controls
// ============================================================================
window.toggleMobileSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  let backdrop = document.getElementById("sidebarBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.className = "sidebar-backdrop";
    backdrop.onclick = window.closeMobileSidebar;
    document.body.appendChild(backdrop);
  }

  sidebar.classList.toggle("open");
  if (sidebar.classList.contains("open")) {
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  } else {
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }
};

window.closeMobileSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
};

// ============================================================================
// Section 6.0: Enterprise SVG Line Icons Registry (Zero Network Dependency)
// ============================================================================
const NAV_ICONS = {
  home: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  visits: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5A7.5 7.5 0 0 0 12 2z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  calendar: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="14" r="0.75" fill="currentColor"/><circle cx="12" cy="14" r="0.75" fill="currentColor"/><circle cx="16" cy="14" r="0.75" fill="currentColor"/></svg>',
  "plans-review": '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>',
  activities: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 15 2 2 4-4"/></svg>',
  areas: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>',
  products: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><circle cx="7" cy="16" r="3"/><circle cx="17" cy="16" r="3"/><circle cx="12" cy="7" r="3"/><line x1="9.6" y1="14.8" x2="14.4" y2="14.8"/><line x1="8.5" y1="13.5" x2="10.8" y2="9.5"/><line x1="15.5" y1="13.5" x2="13.2" y2="9.5"/></svg>',
  users: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  distributors: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><rect x="1" y="3" width="14" height="13" rx="1"/><polygon points="15 8 19 8 22 11 22 16 15 16 15 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg>',
  reports: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
  leaves: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="4" x2="21" y2="22"/></svg>',
  announcements: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/><path d="M8 8V6a2 2 0 0 1 2-2h4"/></svg>',
  quizzes: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  profile: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>',
  doctors: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
  pharmacies: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
  sales: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  plan: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>',
  coverage: '<svg class="nav-svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
};
window.NAV_ICONS = NAV_ICONS;

// Section 6: Unified Declarative Navigation Registry
// ============================================================================
const NAV_CONFIG = [
  // Primary Navigation
  { id: "home", file: "index.html", icon: NAV_ICONS.home, i18n: "navHome", section: "primary" },
  { id: "users", file: "users.html", icon: NAV_ICONS.users, i18n: "navUsers", section: "management", hrPrimary: true, roles: ["admin"] },
  { id: "visits", file: "visits.html", icon: NAV_ICONS.visits, i18n: "navVisits", section: "primary" },
  { id: "calendar", file: "calendar.html", icon: NAV_ICONS.calendar, i18n: "navCalendar", section: "primary" },
  { id: "activities", file: "activities.html", icon: NAV_ICONS.activities, i18n: "navRequests", section: "primary" },
  { id: "leaves", file: "leaves.html", icon: NAV_ICONS.leaves, i18n: "navVacations", section: "primary" },
  { id: "announcements", file: "announcements.html", icon: NAV_ICONS.announcements, i18n: "navNotifications", section: "primary" },
  { id: "reports", file: "reports.html", icon: NAV_ICONS.reports, i18n: "navReports", section: "primary", excludeRoles: ["hr"] },
  { id: "profile", file: "profile.html", icon: NAV_ICONS.profile, i18n: "navSettings", section: "primary" },

  // Management & Operations Navigation
  { id: "plans-review", file: "plans-review.html", icon: NAV_ICONS["plans-review"], i18n: "navPlansReview", section: "management", roles: ["district_manager", "line_manager", "business_unit"] },
  { id: "distributors", file: "distributors.html", icon: NAV_ICONS.distributors, i18n: "navDistributors", section: "management", roles: ["admin"] },
  { id: "areas", file: "areas.html", icon: NAV_ICONS.areas, i18n: "navAreas", section: "management", roles: ["admin", "hr"] },
  { id: "products", file: "products.html", icon: NAV_ICONS.products, i18n: "navProducts", section: "management", roles: ["admin"] },
  { id: "quizzes", file: "quizzes.html", icon: NAV_ICONS.quizzes, i18n: "navQuizzes", section: "management", roles: ["all"], excludeRoles: ["hr"] },
];
window.NAV_CONFIG = NAV_CONFIG;

function resolveActivePage() {
  const path = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
  const found = NAV_CONFIG.find((item) => item.file === path);
  return found ? found.id : "home";
}

// ============================================================================
// Section 7: Navigation Generators (Topbar & Mobile Sidebar)
// ============================================================================
function getIconSymbol(id) {
  if (NAV_ICONS[id]) return NAV_ICONS[id];
  const found = NAV_CONFIG.find((item) => item.id === id);
  if (found && found.icon) return found.icon;
  return NAV_ICONS.home;
}

function getRoleBadge(role, lang = "en") {
  const norm = normalizeRole(role);
  if (translations && translations[lang] && translations[lang][norm]) {
    return translations[lang][norm];
  }
  const roleNames = {
    admin: "Admin",
    business_unit: "BU Head",
    line_manager: "Line Manager",
    district_manager: "District Manager",
    medical_rep: "Medical Rep",
    product_manager: "Product Manager",
    hr: "HR Manager",
    general_manager: "General Manager",
  };
  return roleNames[norm] || roleNames[role] || role;
}

function getNavItemsForRole(role) {
  const norm = normalizeRole(role);
  const primaryNavItems = [];
  const managementNavItems = [];

  NAV_CONFIG.forEach((item) => {
    if (item.excludeRoles && item.excludeRoles.includes(norm)) return;

    if (norm === "hr" && item.hrPrimary) {
      primaryNavItems.push({ id: item.id, i18n: item.i18n, link: item.file });
      return;
    }

    if (item.section === "primary") {
      primaryNavItems.push({ id: item.id, i18n: item.i18n, link: item.file });
    } else if (item.section === "management") {
      const allowed = !item.roles || item.roles.includes("all") || item.roles.includes(norm);
      if (allowed) {
        managementNavItems.push({ id: item.id, i18n: item.i18n, link: item.file });
      }
    }
  });

  return { primaryNavItems, managementNavItems };
}

function getNavPendingCount(itemId, user) {
  if (!user) return 0;
  const role = normalizeRole(user.role);

  if (itemId === "plans-review") {
    if (role !== "district_manager" && role !== "line_manager" && role !== "business_unit" && role !== "admin") return 0;
    const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
    if (role === "admin") {
      return allVisits.filter((v) => v.status === "pending_approval").length;
    }
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    let subRepIds = [];
    if (role === "line_manager" || role === "business_unit") {
      // In plans-review, LM/BU only act as DM (with approval authority) if the rep's DM is vacant/inactive.
      // If all DMs are active, LM/BU has supervisory view only, so show 0 to avoid false pending alerts.
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subReps = subs.filter((s) => normalizeRole(s.role) === "medical_rep");
      const repsWithVacantDm = subReps.filter((rep) => {
        const dmId = rep.dmId || rep.managerId;
        if (!dmId) return true;
        const dm = allUsers.find(
          (u) => u.id === dmId && (normalizeRole(u.role) === "district_manager" || normalizeRole(u.role) === "dm")
        );
        if (!dm) return true;
        const dmStatus = (dm.status || "Active").toLowerCase();
        return dmStatus !== "active";
      });
      subRepIds = repsWithVacantDm.map((s) => s.id);
    } else {
      const subordinateReps = allUsers.filter(
        (u) =>
          normalizeRole(u.role) === "medical_rep" &&
          (u.dmId === user.id || u.districtManagerId === user.id || u.managerId === user.id),
      );
      subRepIds = subordinateReps.map((r) => r.id);
    }
    return allVisits.filter(
      (v) => v.status === "pending_approval" && subRepIds.includes(v.repId),
    ).length;
  }

  if (itemId === "leaves") {
    const allLeaves =
      (window.store && window.store.leaves
        ? window.store.leaves.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

    if (role === "admin" || role === "hr") {
      return allLeaves.filter(
        (l) =>
          l.status === "pending" &&
          l.approvals &&
          l.approvals.lm &&
          l.approvals.lm.status === "approved" &&
          (!l.approvals.hr || l.approvals.hr.status === "pending"),
      ).length;
    }

    if (role === "district_manager") {
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const subReps = allUsers.filter(
        (u) =>
          normalizeRole(u.role) === "medical_rep" &&
          (u.dmId === user.id || u.districtManagerId === user.id || u.managerId === user.id),
      );
      const subRepIds = subReps.map((r) => r.id);
      return allLeaves.filter(
        (l) =>
          l.status === "pending" &&
          subRepIds.includes(l.userId) &&
          (!l.approvals || !l.approvals.dm || l.approvals.dm.status === "pending"),
      ).length;
    }

    if (role === "line_manager") {
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      let subIds = [];
      if (typeof window.getAllSubordinates === "function") {
        subIds = window.getAllSubordinates(user.id).map((u) => u.id);
      } else {
        const myDms = allUsers.filter((u) => u.managerId === user.id).map((d) => d.id);
        const myReps = allUsers.filter((u) => myDms.includes(u.managerId) || u.managerId === user.id).map((r) => r.id);
        subIds = [...new Set([...myDms, ...myReps])];
      }

      return allLeaves.filter(
        (l) =>
          l.status === "pending" &&
          subIds.includes(l.userId) &&
          l.approvals &&
          (!l.approvals.dm || l.approvals.dm.status === "approved") &&
          l.approvals.lm &&
          l.approvals.lm.status === "pending",
      ).length;
    }

    return 0;
  }

  return 0;
}

function renderSidebarNavList(items, resolved, user, lang) {
  return items.map((item) => {
    const activeClass = item.id === resolved ? "active" : "";
    const pendingCount = getNavPendingCount(item.id, user);
    const badgeHtml = pendingCount > 0
      ? `<span class="badge bg-danger rounded-pill nav-pending-badge sidebar-pending-badge ms-auto">${pendingCount}</span>`
      : "";
    const label = (translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id;
    return `
      <li class="nav-item">
        <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link sidebar-nav-link ${activeClass}">
          <span class="sidebar-nav-icon">${getIconSymbol(item.id)}</span>
          <span data-i18n="${item.i18n}">${label}</span>
          ${badgeHtml}
        </a>
      </li>
    `;
  }).join("");
}

function renderSidebar(activePage) {
  const resolved = activePage || resolveActivePage();
  window.currentActivePage = resolved;
  const user = checkAuth();
  if (!user) return;

  const lang = getCurrentLang();
  const { primaryNavItems, managementNavItems } = getNavItemsForRole(user.role);

  const primaryHtml = renderSidebarNavList(primaryNavItems, resolved, user, lang);
  const managementHtml = managementNavItems.length > 0 ? `
    <li class="nav-header" role="presentation">
      <div class="sidebar-section-title sidebar-section-title-mt">
        Management & Data
      </div>
    </li>
    ${renderSidebarNavList(managementNavItems, resolved, user, lang)}
  ` : "";

  const userInitials = (user.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const html = `
    <div class="sidebar-header">
      <div class="sidebar-brand-box">
        <div class="company-logo-badge">P</div>
        <div class="sidebar-brand-titles">
          <h2 class="sidebar-brand-h2">PharmaCare</h2>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="closeMobileSidebar()" aria-label="Close Sidebar">
        &times;
      </button>
    </div>

    <div class="sidebar-user-header-card">
      <div class="sidebar-user-avatar">
        ${window.escapeHtml(userInitials)}
      </div>
      <div class="sidebar-user-details">
        <div class="sidebar-user-name">
          ${window.escapeHtml(lang === "ar" ? user.nameAr || user.name : user.name)}
        </div>
        <div class="sidebar-user-role">
          ${window.escapeHtml(getRoleBadge(user.role, lang))}
        </div>
      </div>
    </div>
    
    <div class="sidebar-nav">
      <ul class="sidebar-nav-list">
        ${primaryHtml}
        ${managementHtml}
      </ul>
    </div>

    <div class="sidebar-footer-text">
      PharmaCare CRM &copy; ${new Date().getFullYear()}
    </div>
  `;

  const sidebarEl = document.getElementById("sidebar");
  if (sidebarEl) sidebarEl.innerHTML = html;
}

function getImpersonationInfo() {
  try {
    const raw = sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin");
    const originalAdmin = validateImpersonationRecord(raw);
    const currentUser = typeof checkAuth === "function" ? checkAuth() : null;
    const isImpersonating = Boolean(originalAdmin && currentUser && currentUser.id && currentUser.id !== originalAdmin.id);
    return {
      isImpersonating: isImpersonating,
      originalAdmin: isImpersonating ? originalAdmin : null
    };
  } catch (e) {
    return { isImpersonating: false, originalAdmin: null };
  }
}
window.getImpersonationInfo = getImpersonationInfo;

function renderTopbar(force = false) {
  const topbarEl = document.getElementById("topbar");
  if (!topbarEl) return;

  let user = checkAuth();
  if (!user) {
    return;
  }
  const lang = getCurrentLang();
  const activePage = window.currentActivePage || resolveActivePage();
  const theme = document.documentElement.getAttribute("data-theme") || "light";

  const { isImpersonating, originalAdmin } = getImpersonationInfo();
  const originalAdminName = originalAdmin ? (lang === "ar" ? (originalAdmin.nameAr || originalAdmin.name) : originalAdmin.name) || "Admin" : "";

  const renderStateKey = `${user.id}_${user.role}_${lang}_${activePage}_${theme}_${isImpersonating ? "imp" : "norm"}`;
  if (!force && topbarEl.dataset.renderedState === renderStateKey && topbarEl.querySelector(".pharma-topbar-top-row")) {
    if (typeof window.updateWorkflowNotifUI === "function") {
      window.updateWorkflowNotifUI();
    }
    return;
  }
  topbarEl.dataset.renderedState = renderStateKey;

  const userName = lang === "ar" ? user.nameAr || user.name : user.name;
  const userCode = user.employeeCode || user.code || "REP-001";
  const roleBadge = getRoleBadge(user.role, lang);
  const codeLabel =
    "Code:";
  const avatarChar = user.name ? user.name.charAt(0) : "U";
  const safeUserName = escapeHtml(userName);
  const safeUserCode = escapeHtml(userCode);
  const safeRoleBadge = escapeHtml(roleBadge);
  const safeAvatarChar = escapeHtml(avatarChar);
  const safeOriginalAdminName = escapeHtml(originalAdminName);

  const { primaryNavItems, managementNavItems } = getNavItemsForRole(user.role);
  const allTopNavItems = primaryNavItems.concat(managementNavItems);

  const unreadNotifCount = (window.store && window.store.notifications)
    ? window.store.notifications.getUnreadCount(user.id)
    : ((window.DEMO_DATA && window.DEMO_DATA.notifications) || []).filter(
        (n) => (n.userId === user.id || n.userId === "all") && !n.read
      ).length;

  const topRow = topbarEl.querySelector(".pharma-topbar-top-row");
  const navStrip = topbarEl.querySelector(".pharma-navbar-strip");

  if (topRow && navStrip) {
    // Incremental impersonation banner update
    let bannerEl = topbarEl.querySelector("#pharmaImpersonationBanner");
    if (isImpersonating) {
      if (!bannerEl) {
        bannerEl = document.createElement("div");
        bannerEl.id = "pharmaImpersonationBanner";
        topbarEl.insertBefore(bannerEl, topbarEl.firstChild);
      }
      bannerEl.className = "pharma-impersonation-top-alert";
      bannerEl.innerHTML = `
        <div class="pharma-impersonation-content">
          <span class="pharma-impersonation-icon"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <span class="pharma-impersonation-text">
            <strong>Impersonation Mode (Log in as):</strong> You are currently viewing as <strong>${safeUserName}</strong> (${safeRoleBadge}) — logged in by Admin <strong>${safeOriginalAdminName}</strong>
          </span>
        </div>
        <button type="button" class="pharma-impersonation-btn" onclick="window.exitImpersonation()">
          <span>↩️</span>
          <span>Exit & Return to Admin</span>
        </button>
      `;
    } else if (bannerEl) {
      bannerEl.remove();
    }

    topbarEl.querySelectorAll(".user-display-name").forEach((el) => {
      if (el.textContent !== userName) el.textContent = userName;
    });
    topbarEl.querySelectorAll(".user-display-code").forEach((el) => {
      const codeHtml = `${codeLabel} <strong>${safeUserCode}</strong>`;
      if (el.innerHTML !== codeHtml) el.innerHTML = codeHtml;
    });
    topbarEl.querySelectorAll(".user-role-tag").forEach((el) => {
      if (el.textContent !== roleBadge) el.textContent = roleBadge;
    });
    topbarEl.querySelectorAll(".user-avatar-mini").forEach((el) => {
      if (el.textContent !== avatarChar) el.textContent = avatarChar;
    });

    const langLabelEl = topbarEl.querySelector("#langLabel");
    if (langLabelEl) {
      const targetLangText = "English";
      if (langLabelEl.textContent !== targetLangText) langLabelEl.textContent = targetLangText;
    }

    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const themeIconEl = topbarEl.querySelector("#themeIcon");
    const themeTextEl = topbarEl.querySelector("#themeText");
    if (themeIconEl) themeIconEl.innerHTML = theme === "dark" ? '<svg class="header-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' : '<svg class="header-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    if (themeTextEl) {
      themeTextEl.textContent = theme === "dark" 
        ? (translations[lang]?.lightMode || "Light") 
        : (translations[lang]?.darkMode || "Dark");
    }

    // Ensure notification bell container exists in incremental update
    if (!topbarEl.querySelector("#pharmaNotifWrapper")) {
      const actionsGroup = topbarEl.querySelector(".pharma-actions-group");
      if (actionsGroup) {
        const notifWrapper = document.createElement("div");
        notifWrapper.className = "pharma-notif-wrapper";
        notifWrapper.id = "pharmaNotifWrapper";
        notifWrapper.innerHTML = `
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>
            <span class="notif-unread-count-badge ${unreadNotifCount > 0 ? '' : 'd-none'}" id="topbarNotifBadge">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" onclick="event.stopPropagation()"></div>
        `;
        actionsGroup.insertBefore(notifWrapper, actionsGroup.firstChild);
      }
    }
    if (typeof window.updateWorkflowNotifUI === "function") {
      window.updateWorkflowNotifUI();
    }

    const currentNavLinks = navStrip.querySelectorAll(".pharma-nav-item");
    const needsFullNavRebuild = currentNavLinks.length !== allTopNavItems.length;

    if (!needsFullNavRebuild) {
      currentNavLinks.forEach((linkEl, idx) => {
        const item = allTopNavItems[idx];
        if (item) {
          const isAct = item.id === activePage;
          if (isAct && !linkEl.classList.contains("active")) linkEl.classList.add("active");
          if (!isAct && linkEl.classList.contains("active")) linkEl.classList.remove("active");
          const textEl = linkEl.querySelector(".nav-item-text");
          if (textEl) {
            const expectedText = translations[lang]?.[item.i18n] || item.id;
            const pCount = getNavPendingCount(item.id, user);
            const badge = pCount > 0 ? ` <span class="badge bg-danger rounded-pill nav-pending-badge topbar-nav-pending-badge ms-1">${pCount}</span>` : "";
            textEl.innerHTML = `${expectedText}${badge}`;
          }
        }
      });
    } else {
      let topNavLinksHtml = "";
      allTopNavItems.forEach((item) => {
        const isAct = item.id === activePage;
        const pCount = getNavPendingCount(item.id, user);
        const badge = pCount > 0 ? ` <span class="badge bg-danger rounded-pill nav-pending-badge topbar-nav-pending-badge ms-1">${pCount}</span>` : "";
        topNavLinksHtml += `
          <a href="${item.link}" class="pharma-nav-item ${isAct ? "active" : ""}">
            <span class="nav-item-icon">${getIconSymbol(item.id)}</span>
            <span class="nav-item-text">${translations[lang]?.[item.i18n] || item.id}${badge}</span>
          </a>
        `;
      });
      navStrip.innerHTML = topNavLinksHtml;
    }
    return;
  }

  let topNavLinksHtml = '<div class="pharma-navbar-strip">';
  allTopNavItems.forEach((item) => {
    const isAct = item.id === activePage;
    topNavLinksHtml += `
      <a href="${item.link}" class="pharma-nav-item ${isAct ? "active" : ""}">
        <span class="nav-item-icon">${getIconSymbol(item.id)}</span>
        <span class="nav-item-text">${translations[lang]?.[item.i18n] || item.id}</span>
      </a>
    `;
  });
  topNavLinksHtml += "</div>";

  const impersonationBannerHtml = isImpersonating ? `
    <div id="pharmaImpersonationBanner" class="pharma-impersonation-top-alert">
      <div class="pharma-impersonation-content">
        <span class="pharma-impersonation-icon"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
        <span class="pharma-impersonation-text">
          <strong>Impersonation Mode (Log in as):</strong> You are currently viewing as <strong>${safeUserName}</strong> (${safeRoleBadge}) — logged in by Admin <strong>${safeOriginalAdminName}</strong>
        </span>
      </div>
      <button type="button" class="pharma-impersonation-btn" onclick="window.exitImpersonation()">
        <span>↩️</span>
        <span>Exit & Return to Admin</span>
      </button>
    </div>
  ` : "";

  let html = `
    ${impersonationBannerHtml}
    <div class="pharma-topbar-top-row">
      <div class="pharma-brand-group">
        <button class="pharma-mobile-btn" onclick="toggleMobileSidebar()" title="Toggle Menu">
          &#9776;
        </button>
        <a href="index.html" class="pharma-brand-link">
          <img src="images/pharma-icon-192.png" alt="PharmaCare Logo" class="pharma-brand-img" width="34" height="34">
          <span class="pharma-brand-title">PharmaCare</span>
        </a>
      </div>

      <div class="pharma-user-status-pill pharma-user-desktop-pill">
        <div class="user-avatar-mini">${safeAvatarChar}</div>
        <div class="user-info-text">
          <span class="user-display-name">${safeUserName}</span>
          <span class="user-display-code">${codeLabel} <strong>${safeUserCode}</strong></span>
        </div>
        <span class="user-role-tag">${safeRoleBadge}</span>
      </div>
      
      <div id="cloudSyncStatus" class="cloud-sync-status-wrap">
        <span class="cloud-sync-live-pill" title="Realtime Cloud Sync Active">
          <span class="cloud-sync-dot">●</span> Cloud Live
        </span>
      </div>

      <div class="pharma-actions-group">
        <!-- Live Workflow Notification Center Bell & Dropdown -->
        <div class="pharma-notif-wrapper" id="pharmaNotifWrapper">
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>
            <span class="notif-unread-count-badge ${unreadNotifCount > 0 ? '' : 'd-none'}" id="topbarNotifBadge">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" onclick="event.stopPropagation()"></div>
        </div>
        
        <button class="pharma-action-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Theme">
          <span id="themeIcon">${document.documentElement.getAttribute("data-theme") === "dark" ? '<svg class="header-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' : '<svg class="header-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'}</span>
          <span id="themeText">${document.documentElement.getAttribute("data-theme") === "dark" ? translations[lang]?.lightMode || "Light" : translations[lang]?.darkMode || "Dark"}</span>
        </button>

        <button class="pharma-action-btn pharma-logout-btn" onclick="logout()" title="${translations[lang]?.logout || "Logout"}">
          <span class="logout-icon">&#10140;</span>
          <span class="logout-text">${translations[lang]?.logout || "Logout"}</span>
        </button>
      </div>
    </div>

    <div class="pharma-user-mobile-row">
      <div class="pharma-user-status-pill">
        <div class="user-avatar-mini">${safeAvatarChar}</div>
        <div class="user-info-text">
          <span class="user-display-name">${safeUserName}</span>
          <span class="user-display-code">${codeLabel} <strong>${safeUserCode}</strong></span>
        </div>
        <span class="user-role-tag">${safeRoleBadge}</span>
      </div>
    </div>

    <div class="pharma-nav-center">
      ${topNavLinksHtml}
    </div>
  `;

  topbarEl.innerHTML = html;
}

// ============================================================================
// Section 8: Theme Management
// ============================================================================
window.updateThemeUI = function (theme) {
  const t =
    theme || document.documentElement.getAttribute("data-theme") || "light";
  const lang = getCurrentLang();
  const isDark = t === "dark";
  const lightText = translations[lang]?.lightMode || "Light";
  const darkText = translations[lang]?.darkMode || "Dark";

  document.querySelectorAll("#themeIcon").forEach((el) => {
    el.innerHTML = isDark ? '<svg class="header-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' : '<svg class="header-svg-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  });
  document.querySelectorAll("#themeText").forEach((el) => {
    el.textContent = isDark ? lightText : darkText;
  });
};

window.toggleTheme = function () {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  // Smooth theme transition class
  document.documentElement.classList.add("theme-transitioning");

  document.documentElement.setAttribute("data-theme", newTheme);
  document.documentElement.setAttribute("data-bs-theme", newTheme);
  if (document.body) document.body.setAttribute("data-theme", newTheme);
  try {
    localStorage.setItem("pharmaTheme", newTheme);
  } catch (e) {}
  window.updateThemeUI(newTheme);
  document.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));

  setTimeout(() => {
    document.documentElement.classList.remove("theme-transitioning");
  }, 260);
};

window.initTheme = function () {
  const savedTheme = localStorage.getItem("pharmaTheme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (document.body) document.body.setAttribute("data-theme", savedTheme);
  window.updateThemeUI(savedTheme);
};

// ============================================================================
// Section 8.5: Live Workflow Notification Center
// ============================================================================
window.formatWorkflowNotifTime = function (isoString, lang) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = Math.max(0, now - d);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return "";
  }
};

window.currentNotifFilter = "all";

const SAFE_NOTIF_LINK = /^[A-Za-z0-9_\-]+\.html(\?[\w=&%.\-]*)?(#[\w\-]*)?$/;
function safeNotifLink(l) {
  return typeof l === "string" && SAFE_NOTIF_LINK.test(l) ? l : "#";
}
window.safeNotifLink = safeNotifLink;

function resolveNotifIcon(item, defaultIconHtml) {
  const raw = item && item.icon;
  if (typeof raw !== "string" || !raw.trim()) return defaultIconHtml;
  if (raw.indexOf("<") !== -1) return defaultIconHtml;
  const trimmed = Array.from(raw.trim()).slice(0, 8).join("");
  return escapeHtml(trimmed);
}

function getSessionUserId() {
  let u = typeof window !== "undefined" && typeof window.checkAuth === "function" ? window.checkAuth() : null;
  if (!u && typeof window !== "undefined" && window.DEMO_MODE === true && window.DEMO_DATA) {
    u = window.DEMO_DATA.currentUser;
  }
  return u && u.id ? u.id : null;
}

window.updateWorkflowNotifUI = function () {
  const userId = getSessionUserId();

  const unread = !userId
    ? 0
    : (window.store && window.store.notifications)
      ? window.store.notifications.getUnreadCount(userId)
      : ((window.DEMO_DATA && window.DEMO_DATA.notifications) || []).filter(
          (n) => (n.userId === userId || n.userId === "all") && !n.read
        ).length;

  document.querySelectorAll("#topbarNotifBadge").forEach((badgeEl) => {
    badgeEl.textContent = unread > 99 ? "99+" : unread;
    badgeEl.style.display = unread > 0 ? "inline-flex" : "none";
  });

  const dropdown = document.getElementById("workflowNotifDropdown");
  if (dropdown && dropdown.style.display === "block") {
    window.renderWorkflowNotifContent(window.currentNotifFilter || "all");
  }
};

window.toggleWorkflowNotifDropdown = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const dropdown = document.getElementById("workflowNotifDropdown");
  if (!dropdown) return;

  const isHidden = dropdown.style.display === "none" || !dropdown.style.display;
  if (isHidden) {
    window.renderWorkflowNotifContent(window.currentNotifFilter || "all");
    dropdown.style.display = "block";
  } else {
    dropdown.style.display = "none";
  }
};

window.renderWorkflowNotifContent = function (filter = "all") {
  window.currentNotifFilter = filter;
  const container = document.getElementById("workflowNotifDropdown");
  if (!container) return;

  if (container.dataset && !container.dataset.notifBound && typeof container.addEventListener === "function") {
    container.dataset.notifBound = "true";
    container.addEventListener("click", function (e) {
      const target = e.target;
      if (!target || typeof target.closest !== "function") return;
      const deleteBtn = target.closest('[data-notif-action="delete"]');
      if (deleteBtn) {
        const itemEl = deleteBtn.closest("[data-notif-id]");
        const id = itemEl && itemEl.dataset ? itemEl.dataset.notifId : null;
        if (id) window.deleteWorkflowNotif(e, id);
        return;
      }
      const openEl = target.closest('[data-notif-action="open"]');
      if (openEl) {
        if (openEl.classList && openEl.classList.contains("notif-btn-open")) {
          e.stopPropagation();
        }
        const itemEl = openEl.closest("[data-notif-id]");
        const id = itemEl && itemEl.dataset ? itemEl.dataset.notifId : null;
        const link = itemEl && itemEl.dataset ? itemEl.dataset.notifLink : "#";
        if (id) window.handleWorkflowNotifClick(id, link);
      }
    });
  }

  const lang = window.getCurrentLang ? window.getCurrentLang() : "en";
  const userId = getSessionUserId();

  const allNotifs = !userId
    ? []
    : (window.store && window.store.notifications)
      ? window.store.notifications.getForUser(userId)
      : ((window.DEMO_DATA && window.DEMO_DATA.notifications) || []).filter(
          (n) => n.userId === userId || n.userId === "all"
        );

  const unreadNotifs = allNotifs.filter((n) => !n.read);
  const unreadCount = unreadNotifs.length;
  const totalCount = allNotifs.length;

  const displayList = filter === "unread" ? unreadNotifs : allNotifs;

  let itemsHtml = "";
  if (displayList.length === 0) {
    itemsHtml = `
      <div class="notif-empty-state">
        <div class="notif-empty-icon"><svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg></div>
        <div class="fw-bold fs-6 mb-1">No notifications</div>
        <div class="text-muted small notif-empty-desc">
          Workflow approvals, rejections, and directives will appear here live.
        </div>
      </div>
    `;
  } else {
    itemsHtml = displayList
      .map((item) => {
        const isUnread = !item.read;
        const title = item.titleEn || item.title || "Notification";
        const msg = item.messageEn || item.message || "";
        const timeStr = window.formatWorkflowNotifTime(item.createdAt, lang);
        const itemType = String(item.type || "");

        let typeIcon = '<svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
        let iconTypeClass = "type-default";

        if (itemType.includes("approval")) {
          iconTypeClass = "type-approval";
          typeIcon = '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><polyline points="20 6 9 17 4 12"/></svg>';
        } else if (
          itemType.includes("rejection") || itemType.includes("reject")
        ) {
          iconTypeClass = "type-rejection";
          typeIcon = '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        } else if (itemType.includes("leave")) {
          iconTypeClass = "type-leave";
          typeIcon = '<svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>';
        } else if (itemType.includes("plan")) {
          iconTypeClass = "type-plan";
          typeIcon = '<svg class="header-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
        }

        // Robust context-aware escaping for all dynamic text
        const _esc = (s) => (window.escapeHtml ? window.escapeHtml(s) : String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"));
        const safeTitle = _esc(title);
        const safeMsg = _esc(msg);
        const noteHtml = item.note
          ? `
          <div class="notif-note-callout">
            <strong>Directive Note:</strong> "${_esc(item.note)}"
          </div>
        `
          : "";
        const safeIcon = resolveNotifIcon(item, typeIcon);
        const safeLink = safeNotifLink(item.link);

        return `
          <div class="notif-item ${isUnread ? "unread" : "read"}" data-notif-id="${_esc(item.id)}" data-notif-link="${_esc(safeLink)}" data-notif-action="open">
            <div class="notif-item-icon ${iconTypeClass}">
              ${safeIcon}
            </div>
            <div class="notif-item-body">
              <div class="notif-item-top">
                <span class="notif-item-title">
                  ${isUnread ? '<span class="notif-unread-dot"></span>' : ""}
                  ${safeTitle}
                </span>
                <span class="notif-item-time">${timeStr}</span>
              </div>
              <div class="notif-item-msg">${safeMsg}</div>
              ${noteHtml}
              <div class="notif-item-actions">
                ${
                  safeLink !== "#"
                    ? `
                  <button type="button" class="notif-btn-open" data-notif-action="open">
                    View ↗
                  </button>
                `
                    : "<span></span>"
                }
                <button type="button" class="notif-btn-delete" title="Delete" data-notif-action="delete">
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  container.innerHTML = `
    <div class="notif-dropdown-header">
      <h5>
        <span><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>
        <span>Notifications</span>
        <span class="badge ${unreadCount > 0 ? "bg-danger" : "bg-secondary"} rounded-pill notif-header-badge">
          ${unreadCount} New
        </span>
      </h5>
      <div class="notif-header-actions">
        ${
          unreadCount > 0
            ? `
          <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 notif-mark-read-btn" onclick="window.markAllWorkflowNotifsRead(event)">
            Mark all read
          </button>
        `
            : ""
        }
      </div>
    </div>

    <div class="notif-filter-tabs">
      <button type="button" class="notif-filter-btn ${filter === "all" ? "active" : ""}" onclick="window.renderWorkflowNotifContent('all')">
        All (${totalCount})
      </button>
      <button type="button" class="notif-filter-btn ${filter === "unread" ? "active" : ""}" onclick="window.renderWorkflowNotifContent('unread')">
        Unread (${unreadCount})
      </button>
    </div>

    <div class="notif-list-container">
      ${itemsHtml}
    </div>

    ${
      totalCount > 0
        ? `
      <div class="notif-dropdown-footer">
        <span class="small text-muted">${totalCount} total</span>
        <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 notif-clear-btn" onclick="window.clearAllWorkflowNotifs(event)">
          Clear all
        </button>
      </div>
    `
        : ""
    }
  `;
};

window.handleWorkflowNotifClick = function (notifId, link) {
  const userId = getSessionUserId();
  if (userId && window.store && window.store.notifications) {
    const canRead = typeof window.store.notifications.getForUser === "function"
      ? window.store.notifications.getForUser(userId).some((n) => n.id === notifId)
      : true;
    if (canRead) {
      window.store.notifications.markAsRead(notifId);
    }
  } else if (userId && window.DEMO_DATA && window.DEMO_DATA.notifications) {
    const n = window.DEMO_DATA.notifications.find(
      (item) => item.id === notifId && (item.userId === userId || item.userId === "all")
    );
    if (n) {
      n.read = true;
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    }
  }
  window.updateWorkflowNotifUI();

  const safe = safeNotifLink(link);
  if (safe !== "#") {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    if (currentPath !== safe) {
      window.location.href = safe;
    } else {
      const dd = document.getElementById("workflowNotifDropdown");
      if (dd) dd.style.display = "none";
    }
  }
};

window.deleteWorkflowNotif = function (event, notifId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const userId = getSessionUserId();
  if (!userId) return;
  const curUser = typeof window.checkAuth === "function" ? window.checkAuth() : null;
  const isAdm = Boolean(curUser && normalizeRole(curUser.role) === "admin");

  if (window.store && window.store.notifications) {
    const target = typeof window.store.notifications.getForUser === "function"
      ? window.store.notifications.getForUser(userId).find((n) => n.id === notifId)
      : null;
    if (target && (target.userId === userId || (isAdm && target.userId === "all"))) {
      window.store.notifications.remove(notifId);
    }
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
      (n) => !(n.id === notifId && (n.userId === userId || (isAdm && n.userId === "all")))
    );
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.markAllWorkflowNotifsRead = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const userId = getSessionUserId();
  if (!userId) return;

  if (window.store && window.store.notifications) {
    window.store.notifications.markAllAsRead(userId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === "all") n.read = true;
    });
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.clearAllWorkflowNotifs = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const userId = getSessionUserId();
  if (!userId) return;
  const curUser = typeof window.checkAuth === "function" ? window.checkAuth() : null;
  const isAdm = Boolean(curUser && normalizeRole(curUser.role) === "admin");

  if (window.store && window.store.notifications) {
    window.store.notifications.clearAll(userId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
      (n) => n.userId !== userId && !(isAdm && n.userId === "all")
    );
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.addWorkflowNotification = function (notif) {
  if (!notif || typeof notif.userId !== "string" || !notif.userId.trim()) {
    console.warn("[Notification] Refused to store notification without a valid non-empty userId.");
    return null;
  }

  const sanitizedIcon = (typeof notif.icon === "string" && notif.icon.indexOf("<") !== -1)
    ? ""
    : (typeof notif.icon === "string" ? notif.icon : "");
  const safeNotif = Object.assign({}, notif, {
    userId: notif.userId.trim(),
    link: safeNotifLink(notif.link),
    icon: sanitizedIcon
  });

  let created = null;
  if (window.store && window.store.notifications) {
    created = window.store.notifications.add(safeNotif);
  } else if (window.DEMO_DATA) {
    if (!window.DEMO_DATA.notifications) window.DEMO_DATA.notifications = [];
    created = {
      id: genId("notif_"),
      createdAt: new Date().toISOString(),
      read: false,
      userId: safeNotif.userId,
      type: safeNotif.type || "system",
      title: safeNotif.title || safeNotif.titleEn || "New Notification",
      message: safeNotif.message || safeNotif.messageEn || "",
      note: safeNotif.note || null,
      link: safeNotif.link,
      icon: safeNotif.icon,
      badgeClass: safeNotif.badgeClass || "bg-primary",
      actorName: safeNotif.actorName || null,
      action: safeNotif.action || null,
    };
    window.DEMO_DATA.notifications.unshift(created);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  if (typeof window.updateWorkflowNotifUI === "function") {
    window.updateWorkflowNotifUI();
  }

  // Live Toast feedback if recipient matches current active user
  const currentUid = getSessionUserId();
  if (currentUid && (safeNotif.userId === currentUid || safeNotif.userId === "all")) {
    const toastMsg = safeNotif.title || safeNotif.titleEn || safeNotif.message || safeNotif.messageEn || "Notification";
    if (typeof window.showToast === "function") {
      window.showToast(toastMsg, "info");
    }
  }

  return created;
};

// Global click outside and ESC listeners for notification dropdown
if (!window._workflowNotifListenersAttached) {
  window._workflowNotifListenersAttached = true;
  document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("workflowNotifDropdown");
    const bellBtn = document.getElementById("notifBellBtn");
    if (dropdown && dropdown.style.display === "block") {
      if (!dropdown.contains(event.target) && (!bellBtn || !bellBtn.contains(event.target))) {
        dropdown.style.display = "none";
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const dropdown = document.getElementById("workflowNotifDropdown");
      if (dropdown && dropdown.style.display === "block") {
        dropdown.style.display = "none";
      }
    }
  });
}

// ============================================================================
// Section 9: Authentication, Session Integrity & Tamper-Proof Auth Guard
// ============================================================================
// ثابت في الكود ومش سر؛ التوقيع مجرد كشف تلاعب عرضي، مش حماية (الإنفاذ الحقيقي لازم server-side)
const SESSION_SIGNATURE_SALT = "pharma_sec_token_2026_#9xK2@pLm!";
const DEFAULT_DEMO_PASSWORD_HASH = "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f";

function getRegisteredUsers() {
  if (typeof DEMO_DATA !== "undefined" && Array.isArray(DEMO_DATA.users) && DEMO_DATA.users.length > 0) {
    return DEMO_DATA.users;
  }
  if (typeof window !== "undefined" && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users) && window.DEMO_DATA.users.length > 0) {
    return window.DEMO_DATA.users;
  }
  if (typeof window !== "undefined" && window.store && window.store.users && typeof window.store.users.getAll === "function") {
    const storeUsers = window.store.users.getAll();
    if (Array.isArray(storeUsers)) return storeUsers;
  }
  return [];
}

function isUserInactive(user) {
  if (!user || !user.status) return false;
  const st = String(user.status).trim().toLowerCase();
  return st === "inactive" || st === "suspended" || st === "disabled";
}

function getCurrentPageName() {
  if (typeof window === "undefined" || !window.location) return "";
  const rawPath = String(window.location.pathname || "").split("?")[0].split("#")[0];
  return (rawPath.split("/").pop() || "index.html").toLowerCase();
}

function validateImpersonationRecord(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    const registeredUsers = getRegisteredUsers();
    const reg = registeredUsers.find((u) => u && u.id === parsed.id);
    if (!reg) return null;
    const regRole = typeof window !== "undefined" && typeof window.normalizeRole === "function"
      ? window.normalizeRole(reg.role)
      : String(reg.role || "").toLowerCase().trim();
    if (regRole !== "admin") return null;
    if (isUserInactive(reg)) return null;
    if (parsed.email && reg.email && String(parsed.email).toLowerCase().trim() !== String(reg.email).toLowerCase().trim()) {
      return null;
    }
    if (parsed._sig && parsed._sig !== computeSessionSignature(reg)) {
      return null;
    }
    return reg;
  } catch (e) {
    return null;
  }
}

/**
 * Computes deterministic cryptographic session integrity signature for a user.
 * Binds user ID, employee code, role, and department with internal salt.
 * @param {Object} user 
 * @returns {string} Hex signature hash
 */
function computeSessionSignature(user) {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.computeSessionSignature === "function") {
    return window.AuthService.computeSessionSignature(user);
  }
  if (!user || !user.id) return "";
  const canonical = [
    String(user.id).trim(),
    String(user.employeeCode || user.code || "").trim(),
    String(user.role || "").trim(),
    SESSION_SIGNATURE_SALT
  ].join("::");

  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < canonical.length; i++) {
    const ch = canonical.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
window.computeSessionSignature = computeSessionSignature;

function purgeTamperedSession(reason) {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.purgeTamperedSession === "function") {
    return window.AuthService.purgeTamperedSession(reason);
  }
  console.warn("[Security Guard] Tampered or invalid session terminated:", reason);
  try {
    sessionStorage.removeItem("pharmaUser");
    sessionStorage.removeItem("impersonating_admin");
    localStorage.removeItem("pharmaUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("impersonating_admin");
  } catch (e) {}
  if (typeof window !== "undefined") {
    window.currentUser = null;
    if (window.location && typeof window.location.replace === "function") {
      if (getCurrentPageName() !== "login.html") {
        window.location.replace("login.html");
      }
    }
  }
}
window.purgeTamperedSession = purgeTamperedSession;

function checkAuth() {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.checkAuth === "function") {
    return window.AuthService.checkAuth();
  }
  const sessionStr = sessionStorage.getItem("pharmaUser");
  const localStr = localStorage.getItem("pharmaUser");
  const userStr = sessionStr || localStr;
  if (!userStr) return null;

  try {
    const parsed = JSON.parse(userStr);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !parsed.id || !String(parsed.id).trim()) {
      purgeTamperedSession("Missing user ID");
      return null;
    }

    // Authority Binding: Lookup against genuine company database (DEMO_DATA or store.users)
    const registeredUsers = getRegisteredUsers();

    // If user store has not loaded yet, do NOT treat session as verified or elevate privileges
    if (registeredUsers.length === 0) {
      parsed._unverified = true;
      return parsed;
    }

    // Lookup strictly by ID (never id OR email)
    const registered = registeredUsers.find((u) => u && u.id === parsed.id);

    // Strict Anti-Impersonation:
    if (!registered) {
      purgeTamperedSession("Unknown user identity");
      return null;
    }

    // Active account guard: immediately revoke sessions of deactivated/suspended users
    if (isUserInactive(registered)) {
      purgeTamperedSession("Account is inactive or suspended");
      return null;
    }

    // Email/ID consistency guard
    if (parsed.email && registered.email && String(parsed.email).toLowerCase().trim() !== String(registered.email).toLowerCase().trim()) {
      purgeTamperedSession("Email/ID mismatch");
      return null;
    }

    // Role Tamper Guard: Never allow client-side role elevation via localStorage!
    // Always bind role strictly to the authoritative registered role
    if (registered.role && parsed.role !== registered.role) {
      console.warn("[Security Alert] Role escalation detected! Reverting to registered role:", registered.role);
      parsed.role = registered.role;
    }

    // Synchronize authoritative organizational hierarchy, security flags, and profile details from registered user
    if (registered.dept !== undefined) {
      parsed.dept = registered.dept;
    }
    if (registered.email) {
      parsed.email = registered.email;
    }
    if (registered.status !== undefined) {
      parsed.status = registered.status;
    }
    if (registered.mustChangePassword !== undefined) {
      parsed.mustChangePassword = Boolean(registered.mustChangePassword);
    }
    if (registered.managerId !== undefined) {
      parsed.managerId = registered.managerId;
    }
    if (registered.lineId !== undefined) {
      parsed.lineId = registered.lineId;
    }
    if (Array.isArray(registered.lineIds)) {
      parsed.lineIds = registered.lineIds;
    }
    if (Array.isArray(registered.areaIds)) {
      parsed.areaIds = registered.areaIds;
    }
    if (Array.isArray(registered.productIds)) {
      parsed.productIds = registered.productIds;
    }
    if (registered.areaId !== undefined) {
      parsed.areaId = registered.areaId;
    }
    if (registered.employeeCode || registered.code) {
      parsed.employeeCode = registered.employeeCode || registered.code;
    }
    if (registered.name) {
      parsed.name = registered.name;
    }
    if (registered.nameAr !== undefined) {
      parsed.nameAr = registered.nameAr;
    }
    if (registered.hireDate !== undefined) {
      parsed.hireDate = registered.hireDate;
    }
    if (registered.phone !== undefined) {
      parsed.phone = registered.phone;
    }
    if (parsed._unverified) {
      delete parsed._unverified;
    }

    // Client-side Session Signature Check (computed strictly from registered record).
    // NOTE: Client-side signature is NOT a cryptographic security boundary (SESSION_SIGNATURE_SALT
    // is hardcoded in client JS and hash is non-cryptographic); real enforcement must be server-side.
    const expectedSig = computeSessionSignature(registered);
    if (parsed._sig && parsed._sig !== expectedSig) {
      purgeTamperedSession("Cryptographic session signature mismatch");
      return null;
    }
    // Auto-sign legitimate sessions
    parsed._sig = expectedSig;

    // Sync verified session back only if serialized content or role/id keys changed
    const nextSerialized = JSON.stringify(parsed);
    if (nextSerialized !== sessionStr) {
      sessionStorage.setItem("pharmaUser", nextSerialized);
    }
    if (nextSerialized !== localStr) {
      localStorage.setItem("pharmaUser", nextSerialized);
    }
    if (parsed.role && localStorage.getItem("userRole") !== parsed.role) {
      localStorage.setItem("userRole", parsed.role);
    }
    if (localStorage.getItem("userId") !== parsed.id) {
      localStorage.setItem("userId", parsed.id);
    }
    return parsed;
  } catch (err) {
    purgeTamperedSession("Corrupted session JSON");
    return null;
  }
}

function enforcePageRoleSecurity(precheckedUser) {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.enforcePageRoleSecurity === "function") {
    return window.AuthService.enforcePageRoleSecurity(precheckedUser);
  }
  const user = precheckedUser || checkAuth();
  if (!user) return false;
  const path = getCurrentPageName();
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();

  const restrictions = {
    "users.html": ["admin", "hr"],
    "distributors.html": ["admin"],
    "areas.html": ["admin", "hr"],
    "products.html": ["admin"],
    "plans-review.html": ["admin", "general_manager", "district_manager", "line_manager", "business_unit"],
    "reports.html": ["admin", "general_manager", "business_unit", "line_manager", "district_manager", "medical_rep", "rep", "product_manager"],
  };

  if (restrictions[path] && (user._unverified === true || !restrictions[path].includes(role))) {
    console.warn(`[RBAC] Access denied: role '${role}' (unverified=${Boolean(user._unverified)}) cannot access '${path}'. Redirecting.`);
    try {
      sessionStorage.setItem("pharma_rbac_denied", "true");
    } catch (e) {}
    const targetRedirect = !user._unverified && role === "hr" ? "users.html" : "index.html";
    if (typeof window !== "undefined" && window.location && typeof window.location.replace === "function") {
      window.location.replace(targetRedirect);
    }
    return false;
  }
  return true;
}
window.enforcePageRoleSecurity = enforcePageRoleSecurity;

function requireAuth() {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.requireAuth === "function") {
    return window.AuthService.requireAuth();
  }
  const user = checkAuth();
  if (!user) {
    if (typeof window !== "undefined" && window.location && getCurrentPageName() !== "login.html") {
      if (typeof window.location.replace === "function") {
        window.location.replace("login.html");
      }
    }
    return null;
  }
  if (!enforcePageRoleSecurity(user)) {
    return null;
  }
  return user;
}

window.checkAuth = checkAuth;
window.requireAuth = requireAuth;

// Eager Global Authentication Guard: Runs synchronously when app.js parses
(function enforceGlobalAuthImmediately() {
  if (typeof window === "undefined" || !window.location) return;
  const path = getCurrentPageName();
  if (path !== "login.html") {
    requireAuth();
  }
})();

function logout() {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.logout === "function") {
    return window.AuthService.logout();
  }
  sessionStorage.clear();
  localStorage.removeItem("pharmaUser");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  localStorage.removeItem("impersonating_admin");
  sessionStorage.setItem("pharma_logged_out", "true");
  if (typeof window !== "undefined") window.currentUser = null;
  window.location.replace("login.html");
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const normalizedType = type === "error" ? "danger" : type;
  toast.className = `toast toast-${normalizedType} show`;
  
  const icons = {
    success: "✓ ",
    warning: "",
    danger: "✕ ",
    error: "✕ ",
    info: "ℹ "
  };
  const icon = icons[type] || "";
  toast.textContent = `${icon}${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}
window.showToast = showToast;

function getVisitDisplayProducts(visit) {
  if (!visit) return [];
  if (Array.isArray(visit.productIds) && visit.productIds.length > 0) {
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);
    const productMap = {};
    allLines.forEach((l) => {
      (l.products || []).forEach((p) => {
        const displayName = p.dosage && !p.name.toLowerCase().includes(p.dosage.toLowerCase())
          ? `${p.name} ${p.dosage}`
          : p.name;
        productMap[p.id] = displayName;
      });
    });
    const resolved = visit.productIds.map((id) => productMap[id] || id);
    if (resolved.length > 0) return resolved;
  }
  if (Array.isArray(visit.products) && visit.products.length > 0) {
    return visit.products;
  }
  return [];
}
window.getVisitDisplayProducts = getVisitDisplayProducts;

function initPage(pageName) {
  requireAuth();
  document.documentElement.dir = "ltr";
  document.documentElement.lang = "en";
  try {
    localStorage.setItem("pharmaLang", "en");
    localStorage.setItem("lang", "en");
  } catch (e) {}
  renderSidebar(pageName);
  renderTopbar();
  applyTranslations("en");
}

// ============================================================================
// Section: Asynchronous Excel Import Progress Engine (Anti-Freezing & UI Smoothness)
// ============================================================================
function createExcelProgressModal() {
  let modalEl = document.getElementById("excelImportProgressModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "excelImportProgressModal";
    modalEl.className = "modal-overlay excel-progress-overlay";
    modalEl.innerHTML = `
      <div class="excel-progress-card">
        <div class="excel-progress-icon" id="excelProgressIcon"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <h5 class="excel-progress-title" id="excelProgressTitle">Processing Sales Import</h5>
        <div class="excel-progress-file" id="excelProgressFileName">-</div>
        
        <div class="excel-progress-track">
          <div id="excelProgressBar" class="excel-progress-bar"></div>
        </div>

        <div class="excel-progress-stats">
          <span id="excelProgressPercent">0%</span>
          <span id="excelProgressCount">0 / 0</span>
        </div>

        <div class="excel-progress-status" id="excelProgressStatus">Preparing file...</div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }
  return modalEl;
}

function openExcelImportProgress(options = {}) {
  const modalEl = createExcelProgressModal();
  modalEl.style.display = "flex";

  const titleEl = document.getElementById("excelProgressTitle");
  const fileEl = document.getElementById("excelProgressFileName");
  const barEl = document.getElementById("excelProgressBar");
  const percentEl = document.getElementById("excelProgressPercent");
  const countEl = document.getElementById("excelProgressCount");
  const statusEl = document.getElementById("excelProgressStatus");
  const iconEl = document.getElementById("excelProgressIcon");

  titleEl.textContent = options.title || "Processing Sales Import";
  fileEl.textContent = options.fileName || "";
  barEl.style.width = "0%";
  barEl.style.background = "linear-gradient(90deg, #3b82f6, #10b981)";
  percentEl.textContent = "0%";
  countEl.textContent = "0 / " + (options.totalRows ? options.totalRows.toLocaleString() : "0");
  statusEl.textContent = options.status || "Parsing sheet data...";
  iconEl.innerHTML = '<svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';

  return {
    update(current, total, customStatus) {
      const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      barEl.style.width = pct + "%";
      percentEl.textContent = pct + "%";
      countEl.textContent = `${current.toLocaleString()} / ${total.toLocaleString()}`;
      if (customStatus) {
        statusEl.textContent = customStatus;
      } else {
        statusEl.textContent = `Processed ${current.toLocaleString()} of ${total.toLocaleString()} records...`;
      }
    },
    finish(successMsg) {
      barEl.style.width = "100%";
      percentEl.textContent = "100%";
      statusEl.textContent = successMsg || "Import completed successfully!";
      iconEl.innerHTML = '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.85" fill="none"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        modalEl.style.display = "none";
      }, 700);
    },
    close() {
      modalEl.style.display = "none";
    }
  };
}
window.openExcelImportProgress = openExcelImportProgress;

// ============================================================================
// Section: User Impersonation Engine ("Log in as")
// ============================================================================
function checkAndRenderImpersonationBanner() {
  const { isImpersonating, originalAdmin } = getImpersonationInfo();
  if (!isImpersonating || !originalAdmin) {
    const existing = document.getElementById("pharmaImpersonationBanner");
    if (existing) existing.remove();
    return;
  }

  const topbar = document.getElementById("topbar");
  if (topbar) {
    if (!document.getElementById("pharmaImpersonationBanner")) {
      renderTopbar(true);
    }
    return;
  }

  if (document.getElementById("pharmaImpersonationBanner")) return;

  const currentUser = (typeof checkAuth === "function" ? checkAuth() : null) || {};
  const roleLabel = (currentUser.role || "").toUpperCase();
  const userName = currentUser.name || currentUser.nameAr || currentUser.email || "";
  const adminName = originalAdmin.name || "Admin";

  const banner = document.createElement("div");
  banner.id = "pharmaImpersonationBanner";
  banner.className = "pharma-impersonation-top-alert pharma-impersonation-standalone";

  banner.innerHTML = `
    <div class="pharma-impersonation-content">
      <span class="pharma-impersonation-icon"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
      <span class="pharma-impersonation-text">
        <strong>Impersonation Mode (Log in as):</strong> You are currently viewing as <strong>${escapeHtml(userName)}</strong> (${escapeHtml(roleLabel)}) — logged in by Admin <strong>${escapeHtml(adminName)}</strong>
      </span>
    </div>
    <button type="button" class="pharma-impersonation-btn" onclick="window.exitImpersonation()">
      <span>↩️</span>
      <span>Exit & Return to Admin</span>
    </button>
  `;

  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.prepend(banner);
  } else {
    document.body.prepend(banner);
  }
}

window.exitImpersonation = function () {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.exitImpersonation === "function") {
    return window.AuthService.exitImpersonation();
  }
  const impersonatingAdminStr = sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin");
  if (!impersonatingAdminStr) {
    const cur = checkAuth();
    if (!cur) {
      window.location.replace("login.html");
      return;
    }
    const curRole = window.normalizeRole ? window.normalizeRole(cur.role) : String(cur.role || "").toLowerCase();
    window.location.replace(curRole === "admin" || curRole === "hr" ? "users.html" : "index.html");
    return;
  }

  const admin = validateImpersonationRecord(impersonatingAdminStr);
  if (!admin) {
    try {
      sessionStorage.removeItem("impersonating_admin");
      localStorage.removeItem("impersonating_admin");
    } catch (e) {}
    purgeTamperedSession("Invalid impersonation record");
    return;
  }

  const restoredSession = {
    id: admin.id,
    email: admin.email || "",
    name: admin.name || "",
    nameAr: admin.nameAr || "",
    role: admin.role,
    dept: admin.dept || "",
    status: admin.status || "Active",
    mustChangePassword: Boolean(admin.mustChangePassword),
    employeeCode: admin.employeeCode || admin.code || "",
    code: admin.code || admin.employeeCode || "",
    managerId: admin.managerId !== undefined ? admin.managerId : null,
    lineId: admin.lineId !== undefined ? admin.lineId : "",
    lineIds: Array.isArray(admin.lineIds) ? admin.lineIds : [],
    areaId: admin.areaId !== undefined ? admin.areaId : "",
    areaIds: Array.isArray(admin.areaIds) ? admin.areaIds : [],
    hireDate: admin.hireDate || "",
    phone: admin.phone || ""
  };
  restoredSession._sig = computeSessionSignature(admin);

  const serialized = JSON.stringify(restoredSession);
  sessionStorage.setItem("pharmaUser", serialized);
  localStorage.setItem("pharmaUser", serialized);
  localStorage.setItem("userRole", admin.role);
  localStorage.setItem("userId", admin.id);
  window.currentUser = restoredSession;

  sessionStorage.removeItem("impersonating_admin");
  localStorage.removeItem("impersonating_admin");
  window.location.replace("users.html");
};

// T9: Warn once on load if non-DEMO_MODE accounts still use the default demo password hash
(function warnDefaultDemoPasswordsOnLoad() {
  if (typeof window !== "undefined" && window.DEMO_MODE !== true) {
    try {
      const users = getRegisteredUsers();
      const count = users.filter((u) => u && u.passwordHash === DEFAULT_DEMO_PASSWORD_HASH).length;
      if (count > 0) {
        console.warn("[Security] " + count + " registered account(s) still use the default demo password hash while DEMO_MODE is disabled.");
      }
    } catch (e) {}
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const currentPath = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
  if (currentPath !== "login.html") {
    if (typeof requireAuth === "function") {
      const authUser = requireAuth();
      if (!authUser) return;
    }
  }

  window.initTheme();
  checkAndRenderImpersonationBanner();

  const topbar = document.getElementById("topbar");
  if (topbar) {
    renderTopbar();
  }

  if (sessionStorage.getItem("pharma_rbac_denied") === "true") {
    sessionStorage.removeItem("pharma_rbac_denied");
    setTimeout(() => {
      if (typeof showToast === "function") {
        showToast("Access Denied: You do not have permission to view this page.", "error");
      }
    }, 200);
  }

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    renderSidebar(window.currentActivePage || resolveActivePage());
  }

  if (
    "serviceWorker" in navigator &&
    window.location.protocol.startsWith("http")
  ) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((reg) => {
          if (reg) {
            reg.update().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn("SW registration skipped:", err);
        });
    });
  }
});
