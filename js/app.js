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
  const EXPECTED_SW = "v145";
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
    .replace(/'/g, "&#39;");
}
window.escapeHtml = escapeHtml;

// ============================================================================
// Section 0.5: Unified System Date Synchronizer
// Ensures visits, calendar, activities, and dashboard stay synchronized.
// If DEMO_DATA.systemDate is configured, it takes priority; otherwise uses live Date.
// ============================================================================
function getSystemDate() {
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.systemDate) {
    const d = new Date(window.DEMO_DATA.systemDate);
    if (!isNaN(d.getTime())) return d;
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

// ============================================================================
// Section 1: Default Master Seed Data
// ============================================================================
const DEFAULT_DEMO_DATA = {
  currentUser: {
    id: "admin1",
    email: "admin@pharmacare.com",
    name: "System Admin",
    nameAr: "مدير النظام",
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
        "id": "admin1",
        "name": "System Admin",
        "nameAr": "مدير النظام",
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
        "id": "bu1",
        "name": "George Marzok",
        "nameAr": "طارق سعد",
        "role": "business_unit",
        "employeeCode": "BU-001",
        "managerId": "admin1",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-06-01",
        "email": "bu@pharmacare.com",
        "phone": "+20100222333",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
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
        "id": "lm1",
        "name": "John Mahfouz",
        "nameAr": "حسن علي",
        "role": "line_manager",
        "employeeCode": "LM-001",
        "managerId": "bu1",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
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
        "id": "lm2",
        "name": "Mario Magdy",
        "nameAr": "سيد إبراهيم",
        "role": "line_manager",
        "employeeCode": "LM-002",
        "managerId": "bu1",
        "lineId": "line_1790626036368",
        "lineIds": [
            "line_1790626036368"
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
        "id": "dm1",
        "name": "Amir Ayoup",
        "nameAr": "كريم ناصر",
        "role": "district_manager",
        "employeeCode": "DM-001",
        "managerId": "lm1",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
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
        "id": "dm2",
        "name": "Jonathan Erian",
        "nameAr": "منى عادل",
        "role": "district_manager",
        "employeeCode": "DM-002",
        "managerId": "lm1",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
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
        "id": "dm3",
        "name": "Marian Magdy",
        "nameAr": "رامي سمير",
        "role": "district_manager",
        "employeeCode": "DM-003",
        "managerId": "lm2",
        "lineId": "line_1790626036368",
        "lineIds": [
            "line_1790626036368"
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
        "id": "rep1",
        "name": "Marco Magdy",
        "nameAr": "أحمد مصطفى",
        "role": "medical_rep",
        "employeeCode": "EMP-001",
        "managerId": "dm1",
        "areaId": "area1",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "email": "rep@pharmacare.com",
        "code": "EMP-001",
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
            "area1",
            "area_line1_1790688157353"
        ],
        "hireDate": "2024-01-15",
        "status": "Active",
        "productIds": []
    },
    {
        "id": "rep2",
        "name": "Kerolos Boules",
        "nameAr": "عمر يوسف",
        "role": "medical_rep",
        "employeeCode": "EMP-002",
        "managerId": "dm2",
        "areaId": "area_line1_1790674637363",
        "lineId": "line1",
        "lineIds": [
            "line1"
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
        "code": "EMP-002",
        "productIds": []
    },
    {
        "id": "rep3",
        "name": "Mina Mikhael",
        "nameAr": "علي محمود",
        "role": "medical_rep",
        "employeeCode": "EMP-003",
        "managerId": "dm2",
        "areaId": "area_line1_1790674718201",
        "lineId": "line1",
        "lineIds": [
            "line1"
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
        "code": "EMP-003",
        "productIds": []
    },
    {
        "id": "rep4",
        "name": "David Emad",
        "nameAr": "نورهان عز",
        "role": "medical_rep",
        "employeeCode": "EMP-004",
        "managerId": "dm1",
        "areaId": "area_line2_1790674745627",
        "lineId": "line2",
        "lineIds": [
            "line2"
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
        "code": "EMP-004",
        "productIds": []
    },
    {
        "id": "hr1",
        "name": "Fatma El-Sherif",
        "nameAr": "فاطمة الشريف",
        "role": "hr",
        "employeeCode": "HR-001",
        "email": "hr@pharmacare.com",
        "managerId": "admin1",
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
        "id": "pm1",
        "name": "Mina Kadry",
        "nameAr": "نادر خالد",
        "role": "product_manager",
        "employeeCode": "PM-001",
        "email": "pm@pharmacare.com",
        "phone": "+20100999111",
        "managerId": "bu1",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "productIds": [
            "prod1",
            "prod2",
            "prod3",
            "prod4",
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
        "id": "rep5",
        "name": "Mohamed Ramadan",
        "nameAr": "محمد رمضان",
        "role": "medical_rep",
        "employeeCode": "EMP-005",
        "email": "rep5@pharmacare.com",
        "phone": "+20100999222",
        "managerId": "dm2",
        "lineId": "line1",
        "lineIds": [
            "line1"
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
        "code": "EMP-005"
    },
    {
        "id": "pm2",
        "name": "Fady Adel",
        "nameAr": "فادي عادل",
        "email": "pm2@pharmacare.com",
        "code": "PM-002",
        "employeeCode": "PM-002",
        "role": "product_manager",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-28",
        "managerId": "bu1",
        "status": "Active",
        "lineIds": [
            "line2"
        ],
        "lineId": "line2",
        "productIds": [
            "prod5",
            "prod6"
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
        "code": "EMP-007",
        "employeeCode": "EMP-007",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-28",
        "managerId": "dm3",
        "status": "Active",
        "lineIds": [
            "line_1790626036368"
        ],
        "lineId": "line_1790626036368",
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
        "code": "EMP-006",
        "employeeCode": "EMP-006",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "01202379833",
        "hireDate": "2026-09-28",
        "managerId": "dm2",
        "status": "Active",
        "lineIds": [
            "line2"
        ],
        "lineId": "line2",
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
        "code": "EMP-009",
        "employeeCode": "EMP-009",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "+201001234567",
        "hireDate": "2026-09-29",
        "managerId": "dm3",
        "status": "Active",
        "lineIds": [
            "line_1790626036368"
        ],
        "lineId": "line_1790626036368",
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
        "code": "EMP-011",
        "employeeCode": "EMP-011",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-29",
        "managerId": "dm1",
        "status": "Active",
        "lineIds": [
            "line1"
        ],
        "lineId": "line1",
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
        "code": "EMP-012",
        "employeeCode": "EMP-012",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-29",
        "managerId": "dm1",
        "status": "Active",
        "lineIds": [
            "line2"
        ],
        "lineId": "line2",
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
    { id: "spec_internal", code: "IM", name: "Internal Medicine", nameAr: "باطنة" },
    { id: "spec_pediatrics", code: "PED", name: "Pediatrics", nameAr: "أطفال" },
    { id: "spec_cardiology", code: "CARD", name: "Cardiology", nameAr: "قلب وأوعية" },
    { id: "spec_dermatology", code: "DERM", name: "Dermatology", nameAr: "جلدية" },
    { id: "spec_ophthalmology", code: "OPHTH", name: "Ophthalmology", nameAr: "عيون" },
    { id: "spec_orthopedics", code: "ORTHO", name: "Orthopedics", nameAr: "عظام" },
    { id: "spec_ent", code: "ENT", name: "ENT", nameAr: "أنف وأذن وحنجرة" },
    { id: "spec_neurology", code: "NEURO", name: "Neurology", nameAr: "مخ وأعصاب" },
    { id: "spec_urology", code: "URO", name: "Urology", nameAr: "مسالك بولية" },
    { id: "spec_gynecology", code: "GYN", name: "Gynecology", nameAr: "نساء وتوليد" },
    { id: "spec_other", code: "OTHER", name: "Other", nameAr: "أخرى" },
  ],
  areas: [
    { id: "area1", name: "Nasr City", code: "CAI-N01", repId: "rep1", lineId: "line1" },
    { id: "area2", name: "Heliopolis", code: "CAI-H01", repId: "rep2", lineId: "line1" },
    { id: "area3", name: "Nasr City", code: "CAI-N01", repId: "rep4", lineId: "line2" },
    { id: "area4", name: "Maadi", code: "CAI-M01", repId: null, lineId: "line2" },
  ],
  productLines: [
    {
      id: "line1",
      name: "Cardio Line",
      nameAr: "خط الكارديو (Cardio)",
      status: "Active",
      lineManagerId: "lm1",
      lineManagerName: "Hassan Ali",
      callFrequency: { classA: 4, classB: 3, classC: 1 },
      products: [
        { id: "prod1", name: "Amoxicillin 500mg", dosage: "500mg", form: "Tablet" },
        { id: "prod2", name: "Vitamin D Drops 1000IU", dosage: "1000IU", form: "Drops" },
        { id: "prod3", name: "Omeprazole 20mg", dosage: "20mg", form: "Capsule" },
        { id: "prod4", name: "Azithromycin 250mg", dosage: "250mg", form: "Tablet" },
      ],
    },
    {
      id: "line2",
      name: "Neuro Line",
      nameAr: "خط النيورو (Neuro)",
      status: "Active",
      lineManagerId: "lm2",
      lineManagerName: "Sayed Ibrahim",
      callFrequency: { classA: 4, classB: 2, classC: 1 },
      products: [
        { id: "prod5", name: "Pregabalin 75mg", dosage: "75mg", form: "Capsule" },
        { id: "prod6", name: "Carbamazepine 200mg", dosage: "200mg", form: "Tablet" },
      ],
    },
  ],
  doctors: [],
  hospitals: [],
  pharmacies: [
  {
    "id": "p1",
    "name": "Al-Ezaby Pharmacy",
    "nameAr": "صيدلية العزبي",
    "address": "15 Abbas Al-Akkad, Nasr City",
    "phone": "01001112233",
    "contactPerson": "Mohamed Ibrahim",
    "areaId": "area1",
    "repId": "rep1",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p2",
    "name": "Seif Pharmacy",
    "nameAr": "صيدلية سيف",
    "address": "28 Mostafa El-Nahas, Nasr City",
    "phone": "01009998877",
    "contactPerson": "Youssef Ahmed",
    "areaId": "area1",
    "repId": "rep1",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p3",
    "name": "Roshdy Pharmacy",
    "nameAr": "صيدلية رشدي",
    "address": "5 Tayaran St, Nasr City",
    "phone": "01155566677",
    "contactPerson": "Ramy Adel",
    "areaId": "area1",
    "repId": "rep1",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p4",
    "name": "19011 Pharmacy",
    "nameAr": "صيدلية 19011",
    "address": "42 Makram Ebeid, Nasr City",
    "phone": "01234567890",
    "contactPerson": "Sara Maher",
    "areaId": "area1",
    "repId": "rep1",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p5",
    "name": "Misr Pharmacy",
    "nameAr": "صيدلية مصر",
    "address": "18 Al-Ahram St, Heliopolis",
    "phone": "01099887766",
    "contactPerson": "Hazem Tarek",
    "areaId": "area2",
    "repId": null,
    "lineId": "line1",
    "area": "Heliopolis"
  },
  {
    "id": "p6",
    "name": "El-Tarshouby Pharmacy",
    "nameAr": "صيدلية الطرشوبي",
    "address": "10 Abbas Al-Akkad, Nasr City",
    "phone": "01223344556",
    "contactPerson": "Mina Magdy",
    "areaId": "area1",
    "repId": "rep1",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p7",
    "name": "Dawaee Pharmacy",
    "nameAr": "صيدلية دوائي",
    "address": "25 Beirut St, Heliopolis",
    "phone": "01122334455",
    "contactPerson": "Hoda Sameh",
    "areaId": "area2",
    "repId": null,
    "lineId": "line1",
    "area": "Heliopolis"
  }
],
  visits: [],
  leaves: [],
  sales: [],
  announcements: [
    {
      id: "ann1",
      title: "Ramadan Working Hours",
      titleAr: "مواعيد العمل في رمضان",
      body: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week.",
      bodyAr:
        "يرجى العلم أن مواعيد العمل خلال شهر رمضان ستكون من 9 صباحاً حتى 3 عصراً بدءاً من الأسبوع القادم.",
      priority: "high",
      createdBy: "hr1",
      createdAt: "2026-09-01",
      read: false,
    },
    {
      id: "ann2",
      title: "Annual Company Event",
      titleAr: "الحفل السنوي للشركة",
      body: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel. All employees are invited!",
      bodyAr:
        "يسعدنا الإعلان عن الحفل السنوي للشركة يوم 15 أكتوبر في فندق فور سيزونز. جميع الموظفين مدعوون!",
      priority: "normal",
      createdBy: "hr1",
      createdAt: "2026-08-28",
      read: true,
    },
    {
      id: "ann3",
      title: "New Health Insurance Policy",
      titleAr: "بوليصة التأمين الصحي الجديدة",
      body: "A new health insurance policy has been activated. Please review the updated benefits in your HR portal.",
      bodyAr:
        "تم تفعيل بوليصة تأمين صحي جديدة. يرجى مراجعة المزايا المحدثة في بوابة الموارد البشرية.",
      priority: "high",
      createdBy: "hr1",
      createdAt: "2026-08-25",
      read: false,
    },
  ],
  notifications: [
    {
      id: "notif_rep_1",
      userId: "rep1",
      type: "plan_approval",
      title: "Field Plan Approved",
      message: "District Manager (Karim Nasser) approved your field plan for 2026-09-20.",
      link: "calendar.html",
      read: false,
      createdAt: "2026-09-17T15:30:00Z",
      icon: "🗓️",
      badgeClass: "bg-success",
      actorName: "Karim Nasser",
      action: "approved",
    },
    {
      id: "notif_rep_2",
      userId: "rep1",
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
      id: "notif_rep_3",
      userId: "rep1",
      type: "visit_rejection",
      title: "Visit Directive / Rejection",
      message: "Visit for Dr. Ahmed Mostafa rejected with note: Please reschedule to morning period.",
      note: "Please reschedule to morning period",
      link: "visits.html",
      read: false,
      createdAt: "2026-09-17T11:00:00Z",
      icon: "❌",
      badgeClass: "bg-danger",
      actorName: "Karim Nasser",
      action: "rejected",
    },
    {
      id: "notif_dm_1",
      userId: "dm1",
      type: "plan_submission",
      title: "Field Plan for Review",
      message: "Medical Rep Ahmed Mostafa submitted a new field plan for your review.",
      link: "plans-review.html",
      read: false,
      createdAt: "2026-09-17T13:00:00Z",
      icon: "📋",
      badgeClass: "bg-primary",
      actorName: "Ahmed Mostafa",
      action: "submitted",
    },
    {
      id: "notif_dm_2",
      userId: "dm1",
      type: "leave_submission",
      title: "New Leave Request",
      message: "Annual leave request submitted by Ahmed Mostafa (2 days) awaiting your approval.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T10:00:00Z",
      icon: "🏖️",
      badgeClass: "bg-warning",
      actorName: "Ahmed Mostafa",
      action: "submitted",
    },
    {
      id: "notif_hr_1",
      userId: "hr1",
      type: "leave_submission",
      title: "Leave Request Final Approval",
      message: "Line Manager approved leave for Ahmed Mostafa, awaiting HR final confirmation.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T12:30:00Z",
      icon: "🏖️",
      badgeClass: "bg-info",
      actorName: "Hassan Ali",
      action: "endorsed",
    },
  ],
  distributors: [
    { id: "dist1", name: "Ibn Sina Pharma", type: "commercial", columnMap: null },
    { id: "dist2", name: "United Company of Pharmacists (UCP)", type: "commercial", columnMap: null },
    { id: "dist3", name: "Overseas", type: "commercial", columnMap: null },
  ],
  pharmacyOverrides: [],
  publicHolidays: [{ date: "2026-10-06", title: "Armed Forces Day", titleAr: "عيد القوات المسلحة" }],
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
          // Normalize Mohamed Ramadan and Fady Adel IDs
          data.users.forEach((u) => {
            if (u.email === "rep5@pharmacare.com" || u.code === "EMP-005" || u.employeeCode === "EMP-005") {
              u.id = "rep5";
              u.email = "rep5@pharmacare.com";
              u.employeeCode = "EMP-005";
              u.code = "EMP-005";
              u.name = "Mohamed Ramadan";
              u.role = "medical_rep";
            }
            if (u.email === "pm2@pharmacare.com" || u.code === "PM-002" || u.employeeCode === "PM-002") {
              u.id = "pm2";
              u.role = "product_manager";
              u.email = "pm2@pharmacare.com";
              u.code = "PM-002";
              u.employeeCode = "PM-002";
              u.name = "Fady Adel";
              u.lineId = "line2";
              u.lineIds = ["line2"];
              if (!Array.isArray(u.productIds) || u.productIds.length === 0) {
                u.productIds = ["prod5", "prod6"];
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
            if (!u || !u.id) return;
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

          data.users.forEach((u) => {
            if (!u.hireDate) {
              const def = DEFAULT_DEMO_DATA.users.find((du) => du.id === u.id);
              u.hireDate = def?.hireDate || "2024-01-15";
            }
          });
        }
        if (Array.isArray(data.notifications)) {
          data.notifications.forEach((n) => {
            if (n.titleEn) n.title = n.titleEn;
            if (n.messageEn) n.message = n.messageEn;
          });
        }
        if (data.currentUser && !data.currentUser.hireDate) {
          const defCurrent = DEFAULT_DEMO_DATA.users.find((du) => du.id === data.currentUser.id);
          data.currentUser.hireDate = defCurrent?.hireDate || "2024-01-15";
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
          });
        } else {
          data.productLines = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.productLines));
        }
        // Ensure clean collections and purge all legacy demo data
        const demoUserIds = ["rep1", "rep2", "rep3", "rep4", "rep5", "dm1", "dm2", "dm3", "lm1", "lm2", "bu1", "pm1", "pm2", "hr1"];

        if (!Array.isArray(data.doctors)) data.doctors = [];
        data.doctors = data.doctors.filter((d) => d && d.id && !d.id.startsWith("d"));

        if (!Array.isArray(data.pharmacies)) data.pharmacies = [];
        data.pharmacies = data.pharmacies.filter((p) => p && p.id && !p.id.startsWith("ph"));

        if (!Array.isArray(data.hospitals)) data.hospitals = [];
        data.hospitals = data.hospitals.filter((h) => h && h.id && !h.id.startsWith("h"));

        if (!Array.isArray(data.visits)) data.visits = [];
        data.visits = data.visits.filter((v) => v && v.id && !v.id.startsWith("v") && !v.id.startsWith("today_v"));

        if (!Array.isArray(data.sales)) data.sales = [];
        data.sales = data.sales.filter((s) => s && s.id && !s.id.startsWith("s") && !s.id.startsWith("ds_s"));

        if (!Array.isArray(data.leaves)) data.leaves = [];
        data.leaves = data.leaves.filter((l) => l && l.id && !l.id.startsWith("l"));

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

  if (assignedLineIds.length === 0 && user.managerId) {
    const mgr = users.find((u) => u.id === user.managerId);
    if (mgr) {
      const mgrLines = mgr.lineIds || (mgr.lineId ? [mgr.lineId] : []);
      mgrLines.forEach((lId) => {
        if (!assignedLineIds.includes(lId)) assignedLineIds.push(lId);
      });
    }
  }

  if (assignedLineIds.length === 0) {
    const areas = (window.store && window.store.areas ? window.store.areas.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    areas.forEach((a) => {
      if (a.repId === userId && a.lineId && !assignedLineIds.includes(a.lineId)) {
        assignedLineIds.push(a.lineId);
      }
    });
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
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      if (uLineIds.includes(lineId)) return true;

      const subs = users.filter((sub) => sub.managerId === u.id);
      return subs.some((sub) => {
        const subLines = sub.lineIds || (sub.lineId ? [sub.lineId] : []);
        return subLines.includes(lineId);
      });
    });
  }

  result.lms = result.filter((u) => u.role === 'line_manager' || u.role === 'lm');
  result.dms = result.filter((u) => u.role === 'district_manager' || u.role === 'dm');
  result.reps = result.filter((u) => u.role === 'medical_rep' || u.role === 'rep');
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

  const allDocs = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
  const docWithRep = allDocs.find((d) => (d.areaId === area.id || (d.area && d.area.toLowerCase() === (area.name || "").toLowerCase())) && d.repId);
  if (docWithRep) {
    const docRep = userList.find((u) => u.id === docWithRep.repId);
    if (docRep && docRep.managerId) return docRep.managerId;
  }

  const allSales = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : (window.DEMO_DATA && window.DEMO_DATA.sales) || []);
  const saleWithDm = allSales.find((s) => (s.areaId === area.id || (s.area && s.area.toLowerCase() === (area.name || "").toLowerCase())) && s.dmId);
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
}
window.getAreaManagerId = getAreaManagerId;

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
    return { role: rawRole, id: localStorage.getItem("userId") || "rep1" };
  return { role: "medical_rep", id: "rep1" };
}

function isAdmin(user) {
  const u = resolveUserForAuth(user);
  return normalizeRole(u?.role) === "admin";
}

function isManagerRole(user) {
  const u = resolveUserForAuth(user);
  const r = normalizeRole(u?.role);
  return [
    "admin",
    "general_manager",
    "business_unit",
    "line_manager",
    "district_manager",
    "product_manager",
  ].includes(r);
}

function isRepRole(user) {
  const u = resolveUserForAuth(user);
  return normalizeRole(u?.role) === "medical_rep";
}

function isPMRole(user) {
  const u = resolveUserForAuth(user);
  return normalizeRole(u?.role) === "product_manager";
}

function hasAnyRole(allowedRoles = [], user) {
  const u = resolveUserForAuth(user);
  const current = normalizeRole(u?.role);
  return allowedRoles.map(normalizeRole).includes(current);
}

window.normalizeRole = normalizeRole;
window.isAdmin = isAdmin;
window.isManagerRole = isManagerRole;
window.isRepRole = isRepRole;
window.isPMRole = isPMRole;
window.hasAnyRole = hasAnyRole;

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
// Section 6: Active Route Auto-Detector
// ============================================================================
function resolveActivePage() {
  const path =
    window.location.pathname.split("/").pop().split("?")[0] || "index.html";
  const pageMap = {
    "index.html": "home",
    "": "home",
    "visits.html": "visits",
    "calendar.html": "calendar",
    "activities.html": "activities",
    "leaves.html": "leaves",
    "announcements.html": "announcements",
    "reports.html": "reports",
    "profile.html": "profile",
    "users.html": "users",
    "products.html": "products",
    "quizzes.html": "quizzes",
    "areas.html": "areas",
    "distributors.html": "distributors",
    "plans-review.html": "plans-review",
  };
  return pageMap[path] || "home";
}

// ============================================================================
// Section 7: Navigation Generators (Topbar & Mobile Sidebar)
// ============================================================================
function getIconSymbol(id) {
  const map = {
    home: "🏠",
    visits: "📍",
    calendar: "📅",
    activities: "🔄",
    leaves: "🏖️",
    announcements: "🔔",
    profile: "⚙️",
    reports: "📊",
    users: "👥",
    doctors: "👨‍⚕️",
    pharmacies: "💊",
    areas: "🗺️",
    distributors: "🚚",
    products: "📦",
    sales: "📈",
    plan: "🗓️",
    coverage: "🎯",
    quizzes: "📋",
    "plans-review": "📋",
  };
  return map[id] || "📌";
}

function getRoleBadge(role) {
  const roleNames = {
    admin: "Admin",
    business_unit: "BU Head",
    line_manager: "Line Manager",
    district_manager: "District Manager",
    medical_rep: "Medical Rep",
    product_manager: "Product Manager",
    hr: "HR Manager",
  };
  return roleNames[role] || role;
}

function getNavItemsForRole(role) {
  let primaryNavItems = [
    { id: "home", i18n: "navHome", link: "index.html" },
    { id: "visits", i18n: "navVisits", link: "visits.html" },
    { id: "calendar", i18n: "navCalendar", link: "calendar.html" },
    { id: "activities", i18n: "navRequests", link: "activities.html" },
    { id: "leaves", i18n: "navVacations", link: "leaves.html" },
    {
      id: "announcements",
      i18n: "navNotifications",
      link: "announcements.html",
    },
    { id: "reports", i18n: "navReports", link: "reports.html" },
    { id: "profile", i18n: "navSettings", link: "profile.html" },
  ];

  const managementNavItems = [];

  if (role === "hr") {
    primaryNavItems = primaryNavItems.filter((item) => item.id !== "reports");
    primaryNavItems.splice(1, 0, {
      id: "users",
      i18n: "navUsers",
      link: "users.html",
    });
    managementNavItems.push({
      id: "areas",
      i18n: "navAreas",
      link: "areas.html",
    });
  } else if (role === "admin") {
    managementNavItems.push(
      { id: "users", i18n: "navUsers", link: "users.html" },
      {
        id: "distributors",
        i18n: "navDistributors",
        link: "distributors.html",
      },
      { id: "areas", i18n: "navAreas", link: "areas.html" },
      { id: "products", i18n: "navProducts", link: "products.html" },
      { id: "quizzes", i18n: "navQuizzes", link: "quizzes.html" },
    );
  } else if (role === "product_manager") {
    managementNavItems.push(
      { id: "quizzes", i18n: "navQuizzes", link: "quizzes.html" },
    );
  } else {
    if (role === "district_manager" || role === "line_manager" || role === "business_unit") {
      managementNavItems.push({
        id: "plans-review",
        i18n: "navPlansReview",
        link: "plans-review.html",
      });
    }
    managementNavItems.push({
      id: "quizzes",
      i18n: "navQuizzes",
      link: "quizzes.html",
    });
  }

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

function renderSidebar(activePage) {
  const resolved = activePage || resolveActivePage();
  window.currentActivePage = resolved;
  const user = checkAuth();
  if (!user) return;

  const lang = getCurrentLang();
  const { primaryNavItems, managementNavItems } = getNavItemsForRole(user.role);

  let html = `
    <div class="sidebar-header" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--gray-100);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="company-logo-badge" style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #0d6efd, #0a58ca); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.1rem;">
          ⚕
        </div>
        <div>
          <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--gray-800); margin: 0; line-height: 1.1;">PharmaCare</h2>
          <span style="font-size: 0.7rem; color: var(--gray-500);">CRM Healthcare</span>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="closeMobileSidebar()" style="background: none; border: none; font-size: 1.6rem; color: var(--gray-500); cursor: pointer; padding: 2px 6px;">
        &times;
      </button>
    </div>
    
    <div class="sidebar-nav">
      <div style="padding: 10px 24px 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-400); font-weight: 700; letter-spacing: 0.5px;">
        Main Menu
      </div>
      <ul style="list-style: none; padding: 0; margin: 0;">
  `;

  primaryNavItems.forEach((item) => {
    const activeClass = item.id === resolved ? "active" : "";
    const pendingCount = getNavPendingCount(item.id, user);
    const badgeHtml =
      pendingCount > 0
        ? `<span class="badge bg-danger rounded-pill nav-pending-badge ms-auto" style="font-size: 0.72rem; padding: 2px 7px; box-shadow: 0 2px 4px rgba(220,53,69,0.3); font-weight: 700;">${pendingCount}</span>`
        : "";
    html += `
      <li class="nav-item">
        <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link ${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: ${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: ${item.id === resolved ? "600" : "500"}; background: ${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
          <span style="font-size: 1.1rem; width: 22px; text-align: center;">${getIconSymbol(item.id)}</span>
          <span data-i18n="${item.i18n}">${(translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id}</span>
          ${badgeHtml}
        </a>
      </li>
    `;
  });

  if (managementNavItems.length > 0) {
    html += `
      <li class="nav-header" role="presentation" style="list-style: none;">
        <div style="padding: 16px 24px 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-400); font-weight: 700; letter-spacing: 0.5px;">
          Management & Data
        </div>
      </li>
    `;
    managementNavItems.forEach((item) => {
      const activeClass = item.id === resolved ? "active" : "";
      const pendingCount = getNavPendingCount(item.id, user);
      const badgeHtml =
        pendingCount > 0
          ? `<span class="badge bg-danger rounded-pill nav-pending-badge ms-auto" style="font-size: 0.72rem; padding: 2px 7px; box-shadow: 0 2px 4px rgba(220,53,69,0.3); font-weight: 700;">${pendingCount}</span>`
          : "";
      html += `
        <li class="nav-item">
          <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link ${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: ${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: ${item.id === resolved ? "600" : "500"}; background: ${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
            <span style="font-size: 1.1rem; width: 22px; text-align: center;">${getIconSymbol(item.id)}</span>
            <span data-i18n="${item.i18n}">${(translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id}</span>
            ${badgeHtml}
          </a>
        </li>
      `;
    });
  }

  html += `</ul></div>
    <div class="sidebar-footer" style="padding: 16px 20px; border-top: 1px solid var(--gray-100); background: var(--gray-50); margin-top: auto;">
      <div class="user-info" style="display: flex; align-items: center; gap: 10px;">
        <div class="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
          ${user.name ? user.name.charAt(0) : "U"}
        </div>
        <div class="details" style="flex: 1; min-width: 0;">
          <div class="name" style="font-weight: 600; font-size: 0.88rem; color: var(--gray-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${lang === "ar" ? user.nameAr || user.name : user.name}
          </div>
          <div class="role" style="font-size: 0.75rem; color: var(--gray-500);">
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
  const userCode = user.employeeCode || user.code || "EMP-001";
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
      bannerEl.style.cssText = "";
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
      const targetLangText = lang === "ar" ? "English" : "عربي";
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
            <span class="notif-unread-count-badge" id="topbarNotifBadge" style="${unreadNotifCount > 0 ? '' : 'display: none;'}">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" style="display: none;" onclick="event.stopPropagation()"></div>
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
            const badge = pCount > 0 ? ` <span class="badge bg-danger rounded-pill nav-pending-badge ms-1" style="font-size: 0.65rem; padding: 1px 5px;">${pCount}</span>` : "";
            textEl.innerHTML = `${expectedText}${badge}`;
          }
        }
      });
    } else {
      let topNavLinksHtml = "";
      allTopNavItems.forEach((item) => {
        const isAct = item.id === activePage;
        const pCount = getNavPendingCount(item.id, user);
        const badge = pCount > 0 ? ` <span class="badge bg-danger rounded-pill nav-pending-badge ms-1" style="font-size: 0.65rem; padding: 1px 5px;">${pCount}</span>` : "";
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
          <img src="images/pharma-icon-192.png" alt="PharmaCare Logo" class="pharma-brand-img" width="34" height="34" style="border-radius:8px;object-fit:cover;flex-shrink:0;box-shadow:0 2px 6px rgba(13,110,253,0.35);">
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
      
      <div id="cloudSyncStatus" style="display: inline-flex; align-items: center; margin-inline: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-size: 0.75rem; font-weight: 600;" title="Realtime Cloud Sync Active">
          <span style="font-size: 0.7rem;">●</span> Cloud Live
        </span>
      </div>

      <div class="pharma-actions-group">
        <!-- Live Workflow Notification Center Bell & Dropdown -->
        <div class="pharma-notif-wrapper" id="pharmaNotifWrapper">
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="notif-unread-count-badge" id="topbarNotifBadge" style="${unreadNotifCount > 0 ? '' : 'display: none;'}">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" style="display: none;" onclick="event.stopPropagation()"></div>
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
  document.documentElement.setAttribute("data-theme", newTheme);
  if (document.body) document.body.setAttribute("data-theme", newTheme);
  try {
    localStorage.setItem("pharmaTheme", newTheme);
  } catch (e) {}
  window.updateThemeUI(newTheme);
  document.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
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
  const userId = user ? user.id : "rep1";

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
  const userId = user ? user.id : "rep1";

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
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔕</div>
        <div class="fw-bold fs-6 mb-1">No notifications</div>
        <div class="text-muted small" style="max-width: 260px; margin: 0 auto; line-height: 1.45;">
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
        let iconBg = "rgba(13, 110, 253, 0.12)";
        let iconColor = "#0d6efd";

        if (item.type && item.type.includes("approval")) {
          iconBg = "rgba(25, 135, 84, 0.14)";
          iconColor = "#198754";
          if (!item.icon) icon = "✅";
        } else if (
          item.type &&
          (item.type.includes("rejection") || item.type.includes("reject"))
        ) {
          iconBg = "rgba(220, 53, 69, 0.14)";
          iconColor = "#dc3545";
          if (!item.icon) icon = "❌";
        } else if (item.type && item.type.includes("leave")) {
          iconBg = "rgba(13, 202, 240, 0.14)";
          iconColor = "#0891b2";
          if (!item.icon) icon = "🏖️";
        } else if (item.type && item.type.includes("plan")) {
          iconBg = "rgba(111, 66, 193, 0.14)";
          iconColor = "#6f42c1";
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
            <div class="notif-item-icon" style="background: ${iconBg}; color: ${iconColor};">
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
        <span class="badge ${unreadCount > 0 ? "bg-danger" : "bg-secondary"} rounded-pill" style="font-size: 0.72rem; padding: 2px 7px;">
          ${unreadCount} New
        </span>
      </h5>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${
          unreadCount > 0
            ? `
          <button type="button" class="btn btn-sm btn-link text-decoration-none p-0" style="font-size: 0.78rem; font-weight: 600; color: #2563eb;" onclick="window.markAllWorkflowNotifsRead(event)">
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
        <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 small" style="font-size: 0.75rem;" onclick="window.clearAllWorkflowNotifs(event)">
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
  const userId = user ? user.id : "rep1";

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
  const userId = user ? user.id : "rep1";

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
      userId: notif.userId || "rep1",
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
// Section 9: Authentication & Session
// ============================================================================
function checkAuth() {
  const sessionStr = sessionStorage.getItem("pharmaUser");
  const localStr = localStorage.getItem("pharmaUser");
  const userStr = sessionStr || localStr;
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed && (parsed.email === "pm2@pharmacare.com" || parsed.id === "pm2") && parsed.role === "medical_rep") {
        parsed.id = "pm2";
        parsed.name = "Fady Adel";
        parsed.nameAr = "فادي عادل";
        parsed.role = "product_manager";
        parsed.employeeCode = "PM-002";
        parsed.code = "PM-002";
        parsed.lineId = "line2";
        parsed.lineIds = ["line2"];
        parsed.productIds = ["prod5", "prod6"];
        sessionStorage.setItem("pharmaUser", JSON.stringify(parsed));
        localStorage.setItem("pharmaUser", JSON.stringify(parsed));
        localStorage.setItem("userRole", "product_manager");
        localStorage.setItem("userId", "pm2");
      }
      if (
        parsed &&
        parsed.id &&
        typeof DEMO_DATA !== "undefined" &&
        Array.isArray(DEMO_DATA.users)
      ) {
        const freshUser = DEMO_DATA.users.find((u) => u.id === parsed.id);
        if (freshUser) {
          const merged = { ...parsed, ...freshUser };
          sessionStorage.setItem("pharmaUser", JSON.stringify(merged));
          localStorage.setItem("pharmaUser", JSON.stringify(merged));
          localStorage.setItem("userRole", merged.role);
          localStorage.setItem("userId", merged.id);
          return merged;
        }
      }
      if (parsed && parsed.id) {
        sessionStorage.setItem("pharmaUser", JSON.stringify(parsed));
        localStorage.setItem("pharmaUser", JSON.stringify(parsed));
        if (parsed.role) localStorage.setItem("userRole", parsed.role);
        localStorage.setItem("userId", parsed.id);
        return parsed;
      }
    } catch (e) {}
  }
  const savedUserId = localStorage.getItem("userId");
  if (savedUserId && typeof DEMO_DATA !== "undefined" && Array.isArray(DEMO_DATA.users)) {
    const user = DEMO_DATA.users.find((u) => u.id === savedUserId);
    if (user) {
      sessionStorage.setItem("pharmaUser", JSON.stringify(user));
      localStorage.setItem("pharmaUser", JSON.stringify(user));
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userId", user.id);
      return user;
    }
  }
  return null;
}

function enforcePageRoleSecurity() {
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
    modalEl.className = "modal-overlay";
    modalEl.style.cssText = "display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);";
    modalEl.innerHTML = `
      <div style="background: var(--card-bg, #ffffff); color: var(--text-color, #1e293b); border-radius: 14px; padding: 24px; width: 90%; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid var(--border-color, #e2e8f0); text-align: center;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;" id="excelProgressIcon">📊</div>
        <h5 style="margin: 0 0 6px 0; font-weight: 700; color: var(--text-color, #1e293b);" id="excelProgressTitle">Processing Sales Import</h5>
        <div style="font-size: 0.85rem; color: var(--gray-500, #64748b); margin-bottom: 16px; word-break: break-all;" id="excelProgressFileName">-</div>
        
        <div style="background: rgba(0,0,0,0.08); border-radius: 8px; height: 14px; overflow: hidden; margin-bottom: 12px; position: relative;">
          <div id="excelProgressBar" style="background: linear-gradient(90deg, #3b82f6, #10b981); height: 100%; width: 0%; transition: width 0.15s ease; border-radius: 8px;"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; color: var(--gray-600, #475569); margin-bottom: 8px;">
          <span id="excelProgressPercent">0%</span>
          <span id="excelProgressCount">0 / 0</span>
        </div>

        <div style="font-size: 0.82rem; color: var(--gray-500, #64748b); min-height: 20px;" id="excelProgressStatus">Preparing file...</div>
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
  banner.className = "pharma-impersonation-top-alert";
  banner.style.cssText = "position: sticky; top: 0; left: 0; right: 0; z-index: 999999;";

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
