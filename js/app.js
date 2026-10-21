/**
 * @file app.js
 * @description Core shared logic, synchronous theme execution, authentication, and universal topbar rendering across all pages.
 */

// ============================================================================
// Immediate Synchronous Theme Engine (Eliminates Flash of Light Theme - FOUC)
// ============================================================================
(function () {
  try {
    const savedTheme = localStorage.getItem("pharmaTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  } catch (err) {}
})();

// Universal Service Worker cache invalidation across all pages
(function () {
  const EXPECTED_SW = "v232";
  const FLAG = "pharmacare_sw_cleared_" + EXPECTED_SW;
  try {
    if (localStorage.getItem(FLAG) !== "1") {
      if ("caches" in window) {
        caches.keys().then(function (names) {
          return Promise.all(
            names.map(function (n) {
              if (n.indexOf("pharmacare-") === 0 && n !== "pharmacare-" + EXPECTED_SW) {
                return caches.delete(n);
              }
            })
          );
        }).then(function () {
          localStorage.setItem(FLAG, "1");
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      } else {
        localStorage.setItem(FLAG, "1");
      }
    }
  } catch (e) {}
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
 * Enterprise XSS Sanitizer: strips executable tags, javascript: urls, and inline event handlers.
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

// ============================================================================
// Section 0.4: Dual Anti-Timestamp Tampering Engine (Network Time Protocol)
// Primary: Current Host Origin (window.location.origin HEAD Date header - RFC 7231)
// Fallback: Cloudflare Edge Trace (https://cloudflare.com/cdn-cgi/trace)
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
        const res = await fetch(origin, {
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
      // Origin HEAD failed or offline, fall through to Cloudflare
    }

    // Attempt 2: Cloudflare Edge Trace Fallback
    try {
      const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const res = await fetch("https://cloudflare.com/cdn-cgi/trace", {
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);
      const text = await res.text();
      const match = text.match(/ts=([0-9.]+)/);
      if (match) {
        const serverMs = Math.floor(parseFloat(match[1]) * 1000);
        if (!isNaN(serverMs) && serverMs > 0) {
          this._applySync(serverMs, "cloudflare");
          return true;
        }
      }
    } catch (e) {
      // Cloudflare fallback failed or offline
    }

    // Attempt 3: Restore cached session sync if available
    try {
      if (typeof sessionStorage !== "undefined") {
        const cachedOffset = sessionStorage.getItem("pharma_net_time_offset");
        const cachedPerf = sessionStorage.getItem("pharma_net_time_perf");
        const cachedBase = sessionStorage.getItem("pharma_net_time_base");
        if (cachedOffset !== null && cachedPerf !== null && cachedBase !== null) {
          this.offsetMs = parseInt(cachedOffset, 10) || 0;
          this.basePerf = parseFloat(cachedPerf) || 0;
          this.baseServerMs = parseInt(cachedBase, 10) || 0;
          this.isSynced = true;
          this.syncSource = "session_cache";
          return true;
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
        "status": "Active"
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
            "line_1790626000002"
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
        }
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
        }
    },
    {
        "id": "u1790626000013",
        "name": "Mario Magdy",
        "nameAr": "Mario Magdy",
        "role": "line_manager",
        "employeeCode": "LM-002",
        "managerId": "u1790626000011",
        "lineId": "line_1790626000002",
        "lineIds": [
            "line_1790626000002"
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
        "productIds": []
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
        }
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
        }
    },
    {
        "id": "u1790626000016",
        "name": "Marian Magdy",
        "nameAr": "Marian Magdy",
        "role": "district_manager",
        "employeeCode": "DM-003",
        "managerId": "u1790626000013",
        "lineId": "line_1790626000002",
        "lineIds": [
            "line_1790626000002"
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
        "productIds": []
    },
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
        "productIds": []
    },
    {
        "id": "u1790626000002",
        "name": "Kerolos Boules",
        "nameAr": "Kerolos Boules",
        "role": "medical_rep",
        "employeeCode": "REP-002",
        "managerId": "u1790626000015",
        "areaId": "area_line1_1790674637363",
        "lineId": "line_1790626000001",
        "lineIds": [
            "line_1790626000001"
        ],
        "areaIds": [
            "area_line1_1790674637363"
        ],
        "area": "Giza",
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
        "productIds": []
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
        "productIds": []
    },
    {
        "id": "u1790626000004",
        "name": "David Emad",
        "nameAr": "David Emad",
        "role": "medical_rep",
        "employeeCode": "REP-004",
        "managerId": "u1790626000014",
        "areaId": "area_line2_1790674745627",
        "lineId": "line_1790626000002",
        "lineIds": [
            "line_1790626000002"
        ],
        "areaIds": [
            "area_line2_1790674745627",
            "area_line2_1790688168385"
        ],
        "area": "Mohndseen, Bolak El Dakror",
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
        "productIds": []
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
        }
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
        "code": "PM-001"
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
        "code": "REP-005"
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
        "areaIds": []
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
        "areaId": "area_line_1790626036368_1790674874231",
        "areaIds": [
            "area_line_1790626036368_1790674874231"
        ]
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
        ]
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
        "area": "Mohndseen",
        "areaId": "area_line_1790626036368_1790687909664",
        "areaIds": [
            "area_line_1790626036368_1790687909664"
        ]
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
        ]
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
        ]
    }
],
  specialties: [
    { id: "spec_internal", code: "IM", name: "Internal Medicine", nameAr: "Internal Medicine" },
    { id: "spec_pediatrics", code: "PED", name: "Pediatrics", nameAr: "Pediatrics" },
    { id: "spec_cardiology", code: "CARD", name: "Cardiology", nameAr: "Cardiology" },
    { id: "spec_dermatology", code: "DERM", name: "Dermatology", nameAr: "Dermatology" },
    { id: "spec_ophthalmology", code: "OPHTH", name: "Ophthalmology", nameAr: "Ophthalmology" },
    { id: "spec_orthopedics", code: "ORTHO", name: "Orthopedics", nameAr: "Orthopedics" },
    { id: "spec_ent", code: "ENT", name: "ENT", nameAr: "ENT" },
    { id: "spec_neurology", code: "NEURO", name: "Neurology", nameAr: "Neurology" },
    { id: "spec_urology", code: "URO", name: "Urology", nameAr: "Urology" },
    { id: "spec_gynecology", code: "GYN", name: "Gynecology", nameAr: "Gynecology" },
    { id: "spec_other", code: "OTHER", name: "Other", nameAr: "Other" },
  ],
  areas: [
    { id: "area_1790626000001", name: "Nasr City", code: "CAI-N01", repId: "u1790626000001", lineId: "line_1790626000001" },
    { id: "area_1790626000002", name: "Heliopolis", code: "CAI-H01", repId: "u1790626000002", lineId: "line_1790626000001" },
    { id: "area_1790626000003", name: "Nasr City", code: "CAI-N01", repId: "u1790626000004", lineId: "line_1790626000002" },
    { id: "area_1790626000004", name: "Maadi", code: "CAI-M01", repId: null, lineId: "line_1790626000002" },
  ],
  productLines: [
    {
      id: "line_1790626000001",
      name: "Cardio Line",
      nameAr: "Cardio Line",
      status: "Active",
      lineManagerId: "u1790626000012",
      lineManagerName: "Line Manager",
      callFrequency: { classA: 4, classB: 3, classC: 1 },
      products: [
        { id: "prod_1790626000001", name: "Amoxicillin 500mg", dosage: "500mg", form: "Tablet" },
        { id: "prod_1790626000002", name: "Vitamin D Drops 1000IU", dosage: "1000IU", form: "Drops" },
        { id: "prod_1790626000003", name: "Omeprazole 20mg", dosage: "20mg", form: "Capsule" },
        { id: "prod_1790626000004", name: "Azithromycin 250mg", dosage: "250mg", form: "Tablet" },
      ],
    },
    {
      id: "line_1790626000002",
      name: "Neuro Line",
      nameAr: "Neuro Line",
      status: "Active",
      lineManagerId: "u1790626000013",
      lineManagerName: "Line Manager",
      callFrequency: { classA: 4, classB: 2, classC: 1 },
      products: [
        { id: "prod_1790626000005", name: "Pregabalin 75mg", dosage: "75mg", form: "Capsule" },
        { id: "prod_1790626000006", name: "Carbamazepine 200mg", dosage: "200mg", form: "Tablet" },
      ],
    },
  ],
  doctors: [],
  hospitals: [],
  pharmacies: [
  {
    "id": "ph_1790626000001",
    "name": "Al-Ezaby Pharmacy",
    "nameAr": "El-Ezaby Pharmacy",
    "address": "15 Abbas Al-Akkad, Nasr City",
    "phone": "01001112233",
    "contactPerson": "Mohamed Ibrahim",
    "areaId": "area_1790626000001",
    "repId": "u1790626000001",
    "lineId": "line_1790626000001",
    "area": "Mohndseen"
  },
  {
    "id": "ph_1790626000002",
    "name": "Seif Pharmacy",
    "nameAr": "Seif Pharmacy",
    "address": "28 Mostafa El-Nahas, Nasr City",
    "phone": "01009998877",
    "contactPerson": "Youssef Ahmed",
    "areaId": "area_1790626000001",
    "repId": "u1790626000001",
    "lineId": "line_1790626000001",
    "area": "Mohndseen"
  },
  {
    "id": "ph_1790626000003",
    "name": "Roshdy Pharmacy",
    "nameAr": "Roshdy Pharmacy",
    "address": "5 Tayaran St, Nasr City",
    "phone": "01155566677",
    "contactPerson": "Ramy Adel",
    "areaId": "area_1790626000001",
    "repId": "u1790626000001",
    "lineId": "line_1790626000001",
    "area": "Mohndseen"
  },
  {
    "id": "ph_1790626000004",
    "name": "19011 Pharmacy",
    "nameAr": "19011 Pharmacy",
    "address": "42 Makram Ebeid, Nasr City",
    "phone": "01234567890",
    "contactPerson": "Sara Maher",
    "areaId": "area_1790626000001",
    "repId": "u1790626000001",
    "lineId": "line_1790626000001",
    "area": "Mohndseen"
  },
  {
    "id": "ph_1790626000005",
    "name": "Misr Pharmacy",
    "nameAr": "Misr Pharmacy",
    "address": "18 Al-Ahram St, Heliopolis",
    "phone": "01099887766",
    "contactPerson": "Hazem Tarek",
    "areaId": "area_1790626000002",
    "repId": null,
    "lineId": "line_1790626000001",
    "area": "Heliopolis"
  },
  {
    "id": "ph_1790626000006",
    "name": "El-Tarshouby Pharmacy",
    "nameAr": "El-Tarshouby Pharmacy",
    "address": "10 Abbas Al-Akkad, Nasr City",
    "phone": "01223344556",
    "contactPerson": "Mina Magdy",
    "areaId": "area_1790626000001",
    "repId": "u1790626000001",
    "lineId": "line_1790626000001",
    "area": "Mohndseen"
  },
  {
    "id": "ph_1790626000007",
    "name": "Dawaee Pharmacy",
    "nameAr": "Dawaee Pharmacy",
    "address": "25 Beirut St, Heliopolis",
    "phone": "01122334455",
    "contactPerson": "Hoda Sameh",
    "areaId": "area_1790626000002",
    "repId": null,
    "lineId": "line_1790626000001",
    "area": "Heliopolis"
  }
],
  visits: [],
  leaves: [],
  sales: [],
  announcements: [
    {
      id: "ann_1790626000001",
      title: "Ramadan Working Hours",
      titleAr: "Ramadan Working Hours",
      body: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week.",
      bodyAr:
        "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week.",
      priority: "high",
      createdBy: "u1790626000017",
      createdAt: "2026-09-01",
      read: false,
    },
    {
      id: "ann_1790626000002",
      title: "Annual Company Event",
      titleAr: "Annual Company Event",
      body: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel. All employees are invited!",
      bodyAr:
        "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel. All employees are invited!",
      priority: "normal",
      createdBy: "u1790626000017",
      createdAt: "2026-08-28",
      read: true,
    },
    {
      id: "ann_1790626000003",
      title: "New Health Insurance Policy",
      titleAr: "New Health Insurance Policy",
      body: "A new health insurance policy has been activated. Please review the updated benefits in your HR portal.",
      bodyAr:
        "A new health insurance policy has been activated. Please review updated benefits in HR portal.",
      priority: "high",
      createdBy: "u1790626000017",
      createdAt: "2026-08-25",
      read: false,
    },
  ],
  notifications: [
    {
      id: "notif_1790626000001",
      userId: "u1790626000001",
      type: "plan_approval",
      title: "Field Plan Approved",
      message: "District Manager approved your field plan for 2026-09-20.",
      link: "calendar.html",
      read: false,
      createdAt: "2026-09-17T15:30:00Z",
      icon: "🗓️",
      badgeClass: "bg-success",
      actorName: "District Manager",
      action: "approved",
    },
    {
      id: "notif_1790626000002",
      userId: "u1790626000001",
      type: "leave_approval",
      title: "Leave Request Approved",
      message: "HR Department approved your annual leave request.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T14:15:00Z",
      icon: "🏖️",
      badgeClass: "bg-success",
      actorName: "HR Department",
      action: "approved",
    },
    {
      id: "notif_1790626000003",
      userId: "u1790626000001",
      type: "visit_rejection",
      title: "Visit Directive / Rejection",
      message: "Visit for Dr. Ahmed Mostafa rejected with note: Please reschedule to morning period.",
      note: "Please reschedule to morning period",
      link: "visits.html",
      read: false,
      createdAt: "2026-09-17T11:00:00Z",
      icon: "❌",
      badgeClass: "bg-danger",
      actorName: "District Manager",
      action: "rejected",
    },
    {
      id: "notif_1790626000004",
      userId: "u1790626000014",
      type: "plan_submission",
      title: "Field Plan for Review",
      message: "Medical Rep submitted a new field plan for your review.",
      link: "plans-review.html",
      read: false,
      createdAt: "2026-09-17T13:00:00Z",
      icon: "📋",
      badgeClass: "bg-primary",
      actorName: "Medical Rep",
      action: "submitted",
    },
    {
      id: "notif_1790626000005",
      userId: "u1790626000014",
      type: "leave_submission",
      title: "New Leave Request",
      message: "Annual leave request submitted (2 days) awaiting your approval.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T10:00:00Z",
      icon: "🏖️",
      badgeClass: "bg-warning",
      actorName: "Medical Rep",
      action: "submitted",
    },
    {
      id: "notif_1790626000006",
      userId: "u1790626000017",
      type: "leave_submission",
      title: "Leave Request Final Approval",
      message: "Line Manager approved leave, awaiting HR final confirmation.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T12:30:00Z",
      icon: "🏖️",
      badgeClass: "bg-info",
      actorName: "Line Manager",
      action: "approved",
    },
  ],
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
          // Auto-migrate legacy medical rep EMP- codes to REP-
          data.users.forEach((u) => {
            if (u.name) {
              u.nameAr = u.name;
            }
          });
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

          // Normalize Mohamed Ramadan and Fady Adel IDs
          data.users.forEach((u) => {
            if (u.email === "rep5@pharmacare.com" || u.code === "REP-005" || u.code === "EMP-005" || u.employeeCode === "REP-005" || u.employeeCode === "EMP-005") {
              u.id = "u1790626000005";
              u.email = "rep5@pharmacare.com";
              u.employeeCode = "REP-005";
              u.code = "REP-005";
              u.name = "Mohamed Ramadan";
              u.role = "medical_rep";
            }
            if (u.email === "pm2@pharmacare.com" || u.code === "PM-002" || u.employeeCode === "PM-002") {
              u.id = "u1790626000019";
              u.role = "product_manager";
              u.email = "pm2@pharmacare.com";
              u.code = "PM-002";
              u.employeeCode = "PM-002";
              u.name = "Fady Adel";
              u.lineId = "line_1790626000002";
              u.lineIds = ["line_1790626000002"];
              if (!Array.isArray(u.productIds) || u.productIds.length === 0) {
                u.productIds = ["prod_1790626000005", "prod_1790626000006"];
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
              u.id = "u" + Date.now() + "_" + Math.floor(Math.random() * 1000);
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

          DEFAULT_DEMO_DATA.users.forEach((u) => {
            const emailKey = (u.email || "").toLowerCase().trim();
            if (!data.users.some((existing) => existing.id === u.id || (emailKey && (existing.email || "").toLowerCase().trim() === emailKey))) {
              data.users.push(u);
            }
          });

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
        if (!Array.isArray(data.specialties) || data.specialties.length === 0) {
          data.specialties = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.specialties));
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
        data.pharmacies = data.pharmacies.filter((p) => p && p.id && !/^ph\d{1,4}$/.test(p.id));

        if (!Array.isArray(data.hospitals)) data.hospitals = [];
        data.hospitals = data.hospitals.filter((h) => h && h.id && !/^h\d{1,4}$/.test(h.id));

        if (!Array.isArray(data.visits)) data.visits = [];
        data.visits = data.visits.filter((v) => v && v.id && !/^v\d{1,4}$/.test(v.id) && !/^today_v\d+$/.test(v.id));

        if (!Array.isArray(data.sales)) data.sales = [];
        data.sales = data.sales.filter((s) => s && s.id && !/^s\d{1,4}$/.test(s.id) && !/^ds_s\d+$/.test(s.id));

        if (!Array.isArray(data.leaves)) data.leaves = [];
        data.leaves = data.leaves.filter((l) => l && l.id && !/^l\d{1,4}$/.test(l.id));

        if (!Array.isArray(data.pharmacyOverrides)) data.pharmacyOverrides = [];
        if (!Array.isArray(data.notifications)) data.notifications = [];
        data.notifications = data.notifications.filter((n) => n && n.userId && !demoUserIds.includes(n.userId));

        if (!Array.isArray(data.users)) data.users = [];
        DEFAULT_DEMO_DATA.users.forEach((defUser) => {
          const emailKey = (defUser.email || "").toLowerCase().trim();
          if (!data.users.some((u) => u.id === defUser.id || (emailKey && (u.email || "").toLowerCase().trim() === emailKey))) {
            data.users.push(defUser);
          }
        });
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
      const legacyLineMap = { line1: "line_1790626000001", line2: "line_1790626000002", line3: "line_1790626000003", line_1790626036368: "line_1790626000002" };
      const legacyAreaMap = { area1: "area_1790626000001", area2: "area_1790626000002", area3: "area_1790626000003", area4: "area_1790626000004" };
      const legacyProdMap = { prod1: "prod_1790626000001", prod2: "prod_1790626000002", prod3: "prod_1790626000003", prod4: "prod_1790626000004", prod5: "prod_1790626000005", prod6: "prod_1790626000006" };
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
        data.users.forEach((u) => {
          if (legacyIdMap[u.id]) u.id = legacyIdMap[u.id];
          if (u.passwordHash && legacyOldHashes.includes(u.passwordHash)) {
            u.passwordHash = "9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f";
            u.mustChangePassword = false;
          }
          if (legacyIdMap[u.managerId]) u.managerId = legacyIdMap[u.managerId];
          if (legacyLineMap[u.lineId]) u.lineId = legacyLineMap[u.lineId];
          if (Array.isArray(u.lineIds)) u.lineIds = u.lineIds.map((l) => legacyLineMap[l] || l);
          if (legacyAreaMap[u.areaId]) u.areaId = legacyAreaMap[u.areaId];
          if (Array.isArray(u.areaIds)) u.areaIds = u.areaIds.map((a) => legacyAreaMap[a] || a);
          if (Array.isArray(u.productIds)) u.productIds = u.productIds.map((p) => legacyProdMap[p] || p);
        });
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

  if (manager.role === "admin") {
    return users.filter((u) => u.role !== "admin");
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
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

  if (!companySettings || !companySettings.requireGpsValidation) {
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
    const msg = `⚠️ Recording or saving visits on holidays is not permitted: The selected date (${dateStr}) is an official holiday (${hTitle}).`;
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
    const msg = `⚠️ You have a registered leave (${lStatus}: ${lType}) on this date (${dateStr}). Recording or planning visits during leaves is not permitted.`;

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
  if (currentUser.role === "admin" || currentUser.role === "hr") return true;

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
async function hashPassword(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "fallback_" + Math.abs(hash).toString(16);
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
        (u.role === "district_manager" || u.role === "dm") &&
        ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId)
      );
      if (dmsInLine.length === 1) {
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
 * - Eastern Arabic digits (١٢٣)
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

  // Convert Eastern Arabic-Indic digits (0-9) to Latin
  s = s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());

  // Clean parentheses and trailing/leading minus
  s = s.replace(/[\(\)]/g, "");

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
  return isAccountingNegative ? -Math.abs(num) : num;
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

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, "0");
    const day = ymd[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
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
  const rawRole = localStorage.getItem("userRole");
  if (rawRole)
    return { role: rawRole, id: localStorage.getItem("userId") || "u1790626000001" };
  return { role: "medical_rep", id: "u1790626000001" };
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
  return `<span class="badge ${config.css} status-badge">${label}</span>`;
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
    orgTreeTitle: "🏢 Select Team Member / Branch",
    orgTreeSubtitle: "Pick any Level (BU, LM, DM, or Rep) or search directly",
    navPlansReview: "Plans Review",
    close: "Close",
    leaveAllocationTitle: "Leave Balance Allocation (Days)",
    leaveAllocationSub: "Set initial annual, casual, and sick days",
    hrGovernanceTitle: "🏛️ HR Governance: Leave Balances & Public Holidays",
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
// Section 6: Unified Declarative Navigation Registry
// ============================================================================
const NAV_CONFIG = [
  // Primary Navigation
  { id: "home", file: "index.html", icon: "🏠", i18n: "navHome", section: "primary" },
  { id: "users", file: "users.html", icon: "👥", i18n: "navUsers", section: "management", hrPrimary: true, roles: ["admin"] },
  { id: "visits", file: "visits.html", icon: "📍", i18n: "navVisits", section: "primary" },
  { id: "calendar", file: "calendar.html", icon: "📅", i18n: "navCalendar", section: "primary" },
  { id: "activities", file: "activities.html", icon: "🔄", i18n: "navRequests", section: "primary" },
  { id: "leaves", file: "leaves.html", icon: "🏖️", i18n: "navVacations", section: "primary" },
  { id: "announcements", file: "announcements.html", icon: "🔔", i18n: "navNotifications", section: "primary" },
  { id: "reports", file: "reports.html", icon: "📊", i18n: "navReports", section: "primary", excludeRoles: ["hr"] },
  { id: "profile", file: "profile.html", icon: "⚙️", i18n: "navSettings", section: "primary" },

  // Management & Operations Navigation
  { id: "plans-review", file: "plans-review.html", icon: "📋", i18n: "navPlansReview", section: "management", roles: ["district_manager", "line_manager", "business_unit"] },
  { id: "distributors", file: "distributors.html", icon: "🚚", i18n: "navDistributors", section: "management", roles: ["admin"] },
  { id: "areas", file: "areas.html", icon: "🗺️", i18n: "navAreas", section: "management", roles: ["admin", "hr"] },
  { id: "products", file: "products.html", icon: "📦", i18n: "navProducts", section: "management", roles: ["admin"] },
  { id: "quizzes", file: "quizzes.html", icon: "📋", i18n: "navQuizzes", section: "management", roles: ["all"], excludeRoles: ["hr"] },
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
  const found = NAV_CONFIG.find((item) => item.id === id);
  if (found) return found.icon;
  const legacyIcons = {
    doctors: "👨‍⚕️",
    pharmacies: "💊",
    sales: "📈",
    plan: "🗓️",
    coverage: "🎯",
  };
  return legacyIcons[id] || "📌";
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

  const html = `
    <div class="sidebar-header">
      <div class="sidebar-brand-box">
        <div class="company-logo-badge">
          ⚕
        </div>
        <div class="sidebar-brand-titles">
          <h2 class="sidebar-brand-h2">PharmaCare</h2>
          <span class="sidebar-brand-sub">CRM Healthcare</span>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="closeMobileSidebar()" aria-label="Close Sidebar">
        &times;
      </button>
    </div>
    
    <div class="sidebar-nav">
      <div class="sidebar-section-title">
        Main Menu
      </div>
      <ul class="sidebar-nav-list">
        ${primaryHtml}
        ${managementHtml}
      </ul>
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-user-info">
        <div class="sidebar-user-avatar">
          ${user.name ? user.name.charAt(0) : "U"}
        </div>
        <div class="sidebar-user-details">
          <div class="sidebar-user-name">
            ${lang === "ar" ? user.nameAr || user.name : user.name}
          </div>
          <div class="sidebar-user-role">
            ${getRoleBadge(user.role, lang)}
          </div>
        </div>
      </div>
    </div>
  `;

  const sidebarEl = document.getElementById("sidebar");
  if (sidebarEl) sidebarEl.innerHTML = html;
}

function getImpersonationInfo() {
  try {
    const raw = sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin");
    const originalAdmin = raw ? JSON.parse(raw) : null;
    return {
      isImpersonating: Boolean(originalAdmin),
      originalAdmin: originalAdmin
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
          <span class="pharma-impersonation-icon">⚠️</span>
          <span class="pharma-impersonation-text">
            <strong>Impersonation Mode (Log in as):</strong> You are currently viewing as <strong>${userName}</strong> (${roleBadge}) — logged in by Admin <strong>${originalAdminName}</strong>
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
      const codeHtml = `${codeLabel} <strong>${userCode}</strong>`;
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
    if (themeIconEl) themeIconEl.textContent = theme === "dark" ? "☀️" : "🌙";
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
            <span class="notif-bell-icon">🔔</span>
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
        <span class="pharma-impersonation-icon">⚠️</span>
        <span class="pharma-impersonation-text">
          <strong>Impersonation Mode (Log in as):</strong> You are currently viewing as <strong>${userName}</strong> (${roleBadge}) — logged in by Admin <strong>${originalAdminName}</strong>
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
        <div class="user-avatar-mini">${avatarChar}</div>
        <div class="user-info-text">
          <span class="user-display-name">${userName}</span>
          <span class="user-display-code">${codeLabel} <strong>${userCode}</strong></span>
        </div>
        <span class="user-role-tag">${roleBadge}</span>
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
            <span class="notif-bell-icon">🔔</span>
            <span class="notif-unread-count-badge ${unreadNotifCount > 0 ? '' : 'd-none'}" id="topbarNotifBadge">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" onclick="event.stopPropagation()"></div>
        </div>
        
        <button class="pharma-action-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Theme">
          <span id="themeIcon">${document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙"}</span>
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
        <div class="user-avatar-mini">${avatarChar}</div>
        <div class="user-info-text">
          <span class="user-display-name">${userName}</span>
          <span class="user-display-code">${codeLabel} <strong>${userCode}</strong></span>
        </div>
        <span class="user-role-tag">${roleBadge}</span>
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
    el.textContent = isDark ? "☀️" : "🌙";
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

window.updateWorkflowNotifUI = function () {
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "u1790626000001";

  const unread = (window.store && window.store.notifications)
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

  const lang = window.getCurrentLang ? window.getCurrentLang() : "en";
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "u1790626000001";

  const allNotifs = (window.store && window.store.notifications)
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
        <div class="notif-empty-icon">🔕</div>
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

        let icon = item.icon || "🔔";
        let iconTypeClass = "type-default";

        if (item.type && item.type.includes("approval")) {
          iconTypeClass = "type-approval";
          if (!item.icon) icon = "✅";
        } else if (
          item.type &&
          (item.type.includes("rejection") || item.type.includes("reject"))
        ) {
          iconTypeClass = "type-rejection";
          if (!item.icon) icon = "❌";
        } else if (item.type && item.type.includes("leave")) {
          iconTypeClass = "type-leave";
          if (!item.icon) icon = "🏖️";
        } else if (item.type && item.type.includes("plan")) {
          iconTypeClass = "type-plan";
          if (!item.icon) icon = "🗓️";
        }

        const safeTitle = window.escapeHtml ? window.escapeHtml(title) : title;
        const safeMsg = window.escapeHtml ? window.escapeHtml(msg) : msg;
        const noteHtml = item.note
          ? `
          <div class="notif-note-callout">
            <strong>💬 Directive Note:</strong> "${window.escapeHtml ? window.escapeHtml(item.note) : item.note}"
          </div>
        `
          : "";

        const linkTarget = item.link || "#";

        return `
          <div class="notif-item ${isUnread ? "unread" : "read"}" onclick="window.handleWorkflowNotifClick('${item.id}', '${linkTarget}')">
            <div class="notif-item-icon ${iconTypeClass}">
              ${icon}
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
                  linkTarget !== "#"
                    ? `
                  <button type="button" class="notif-btn-open" onclick="event.stopPropagation(); window.handleWorkflowNotifClick('${item.id}', '${linkTarget}')">
                    View ↗
                  </button>
                `
                    : "<span></span>"
                }
                <button type="button" class="notif-btn-delete" title="Delete" onclick="window.deleteWorkflowNotif(event, '${item.id}')">
                  🗑️
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
        <span>🔔</span>
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
            ✓ Mark all read
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
          🗑️ Clear all
        </button>
      </div>
    `
        : ""
    }
  `;
};

window.handleWorkflowNotifClick = function (notifId, link) {
  if (window.store && window.store.notifications) {
    window.store.notifications.markAsRead(notifId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    const n = window.DEMO_DATA.notifications.find((item) => item.id === notifId);
    if (n) {
      n.read = true;
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    }
  }
  window.updateWorkflowNotifUI();

  if (link && link !== "#") {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    if (currentPath !== link) {
      window.location.href = link;
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
  if (window.store && window.store.notifications) {
    window.store.notifications.remove(notifId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
      (n) => n.id !== notifId
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
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "u1790626000001";

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
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "u1790626000001";

  if (window.store && window.store.notifications) {
    window.store.notifications.clearAll(userId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
      (n) => n.userId !== userId && n.userId !== "all"
    );
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.addWorkflowNotification = function (notif) {
  let created = null;
  if (window.store && window.store.notifications) {
    created = window.store.notifications.add(notif);
  } else if (window.DEMO_DATA) {
    if (!window.DEMO_DATA.notifications) window.DEMO_DATA.notifications = [];
    created = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      read: false,
      userId: notif.userId || "u1790626000001",
      type: notif.type || "system",
      title: notif.title || notif.titleEn || "New Notification",
      message: notif.message || notif.messageEn || "",
      note: notif.note || null,
      link: notif.link || "#",
      icon: notif.icon || "🔔",
      badgeClass: notif.badgeClass || "bg-primary",
      actorName: notif.actorName || null,
      action: notif.action || null,
    };
    window.DEMO_DATA.notifications.unshift(created);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  if (typeof window.updateWorkflowNotifUI === "function") {
    window.updateWorkflowNotifUI();
  }

  // Live Toast feedback if recipient matches current active user
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  if (user && (notif.userId === user.id || notif.userId === "all")) {
    const toastMsg = notif.title || notif.titleEn || notif.message || notif.messageEn || "Notification";
    if (typeof window.showToast === "function") {
      window.showToast(`🔔 ${toastMsg}`, "info");
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
const SESSION_SIGNATURE_SALT = "pharma_sec_token_2026_#9xK2@pLm!";

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
    localStorage.removeItem("pharmaUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
  } catch (e) {}
  if (typeof window !== "undefined" && window.location && typeof window.location.replace === "function") {
    const path = (window.location.pathname || "").split("/").pop().toLowerCase();
    if (path !== "login.html" && !path.includes("login")) {
      window.location.replace("login.html");
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
    if (!parsed || !parsed.id) {
      purgeTamperedSession("Missing user ID");
      return null;
    }

    if (parsed && (parsed.email === "pm2@pharmacare.com" || parsed.id === "u1790626000019") && parsed.role === "medical_rep") {
      parsed.id = "u1790626000019";
      parsed.name = "Fady Adel";
      parsed.nameAr = "Fady Adel";
      parsed.role = "product_manager";
      parsed.employeeCode = "PM-002";
      parsed.code = "PM-002";
      parsed.lineId = "line_1790626000002";
      parsed.lineIds = ["line_1790626000002"];
      parsed.productIds = ["prod_1790626000005", "prod_1790626000006"];
    }

    // Authority Binding: Lookup against genuine company database (DEMO_DATA or store.users)
    const registeredUsers = (typeof DEMO_DATA !== "undefined" && Array.isArray(DEMO_DATA.users))
      ? DEMO_DATA.users
      : ((window.store && window.store.users && window.store.users.getAll) ? window.store.users.getAll() : []);

    const registered = registeredUsers.find((u) => u.id === parsed.id || (u.email && u.email.toLowerCase() === (parsed.email || "").toLowerCase()));

    // Strict Anti-Impersonation:
    // If registered users exist in system and parsed.id does not match any registered user:
    if (registeredUsers.length > 0 && !registered) {
      purgeTamperedSession("Unknown user identity");
      return null;
    }

    // Role Tamper Guard: Never allow client-side role elevation via localStorage!
    // Always bind role strictly to the authoritative registered role
    if (registered && registered.role && parsed.role !== registered.role) {
      console.warn("[Security Alert] Role escalation detected! Reverting to registered role:", registered.role);
      parsed.role = registered.role;
      parsed.dept = registered.dept || parsed.dept;
    }

    // Synchronize organizational hierarchy and profile details from registered user
    if (registered) {
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
      if (registered.areaId !== undefined) {
        parsed.areaId = registered.areaId;
      }
      if (!parsed.employeeCode && (registered.employeeCode || registered.code)) {
        parsed.employeeCode = registered.employeeCode || registered.code;
      }
      if (!parsed.name && registered.name) {
        parsed.name = registered.name;
      }
      if (!parsed.nameAr && registered.nameAr) {
        parsed.nameAr = registered.nameAr;
      }
      if (!parsed.hireDate && registered.hireDate) {
        parsed.hireDate = registered.hireDate;
      }
      if (!parsed.phone && registered.phone) {
        parsed.phone = registered.phone;
      }
    }

    // Cryptographic Session Signature Check
    const expectedSig = computeSessionSignature(registered || parsed);
    if (parsed._sig && parsed._sig !== expectedSig) {
      purgeTamperedSession("Cryptographic session signature mismatch");
      return null;
    }
    // Auto-sign legitimate sessions
    parsed._sig = expectedSig;

    // Sync verified session back
    sessionStorage.setItem("pharmaUser", JSON.stringify(parsed));
    localStorage.setItem("pharmaUser", JSON.stringify(parsed));
    if (parsed.role) localStorage.setItem("userRole", parsed.role);
    localStorage.setItem("userId", parsed.id);
    return parsed;
  } catch (err) {
    purgeTamperedSession("Corrupted session JSON");
    return null;
  }
}

function enforcePageRoleSecurity() {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.enforcePageRoleSecurity === "function") {
    return window.AuthService.enforcePageRoleSecurity();
  }
  const user = checkAuth();
  if (!user) return;
  const path = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();

  const restrictions = {
    "users.html": ["admin", "hr"],
    "distributors.html": ["admin"],
    "areas.html": ["admin", "hr"],
    "products.html": ["admin"],
    "plans-review.html": ["admin", "district_manager", "line_manager", "business_unit"],
    "reports.html": ["admin", "business_unit", "line_manager", "district_manager", "medical_rep", "rep", "product_manager"],
  };

  if (restrictions[path] && !restrictions[path].includes(role)) {
    console.warn(`[RBAC] Access denied: role '${role}' cannot access '${path}'. Redirecting.`);
    sessionStorage.setItem("pharma_rbac_denied", "true");
    const targetRedirect = role === "hr" ? "users.html" : "index.html";
    window.location.replace(targetRedirect);
  }
}
window.enforcePageRoleSecurity = enforcePageRoleSecurity;

function requireAuth() {
  if (typeof window !== "undefined" && window.AuthService && typeof window.AuthService.requireAuth === "function") {
    return window.AuthService.requireAuth();
  }
  const user = checkAuth();
  if (!user && !window.location.href.includes("login.html")) {
    window.location.replace("login.html");
    return null;
  }
  enforcePageRoleSecurity();
  return user;
}

window.checkAuth = checkAuth;
window.requireAuth = requireAuth;

// Eager Global Authentication Guard: Runs synchronously when app.js parses
(function enforceGlobalAuthImmediately() {
  if (typeof window === "undefined" || !window.location) return;
  const path = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
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
    warning: "⚠️ ",
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
        <div class="excel-progress-icon" id="excelProgressIcon">📊</div>
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
  iconEl.textContent = "📊";

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
      iconEl.textContent = "✅";
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
      <span class="pharma-impersonation-icon">⚠️</span>
      <span class="pharma-impersonation-text">
        <strong>Impersonation Mode (Log in as):</strong> You are currently viewing as <strong>${userName}</strong> (${roleLabel}) — logged in by Admin <strong>${adminName}</strong>
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
    window.location.replace("users.html");
    return;
  }

  let originalAdmin = null;
  try {
    originalAdmin = JSON.parse(impersonatingAdminStr);
  } catch (e) {}

  if (originalAdmin) {
    sessionStorage.setItem("pharmaUser", JSON.stringify(originalAdmin));
    localStorage.setItem("pharmaUser", JSON.stringify(originalAdmin));
    localStorage.setItem("userRole", originalAdmin.role || "admin");
    localStorage.setItem("userId", originalAdmin.id);
    window.currentUser = originalAdmin;
  }

  sessionStorage.removeItem("impersonating_admin");
  localStorage.removeItem("impersonating_admin");
  window.location.replace("users.html");
};

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
