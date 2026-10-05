const fs = require("fs");
const path = require("path");

const appJsPath = path.resolve(__dirname, "../js/app.js");
let content = fs.readFileSync(appJsPath, "utf8");

const originalPharmacies = [
  {
    id: "p1",
    name: "Al-Ezaby Pharmacy",
    nameAr: "صيدلية العزبي",
    address: "15 Abbas Al-Akkad, Nasr City",
    phone: "01001112233",
    contactPerson: "Mohamed Ibrahim",
    areaId: "area1",
    repId: "rep1",
    lineId: "line1",
    area: "Mohndseen"
  },
  {
    id: "p2",
    name: "Seif Pharmacy",
    nameAr: "صيدلية سيف",
    address: "28 Mostafa El-Nahas, Nasr City",
    phone: "01009998877",
    contactPerson: "Youssef Ahmed",
    areaId: "area1",
    repId: "rep1",
    lineId: "line1",
    area: "Mohndseen"
  },
  {
    id: "p3",
    name: "Roshdy Pharmacy",
    nameAr: "صيدلية رشدي",
    address: "5 Tayaran St, Nasr City",
    phone: "01155566677",
    contactPerson: "Ramy Adel",
    areaId: "area1",
    repId: "rep1",
    lineId: "line1",
    area: "Mohndseen"
  },
  {
    id: "p4",
    name: "19011 Pharmacy",
    nameAr: "صيدلية 19011",
    address: "42 Makram Ebeid, Nasr City",
    phone: "01234567890",
    contactPerson: "Sara Maher",
    areaId: "area1",
    repId: "rep1",
    lineId: "line1",
    area: "Mohndseen"
  },
  {
    id: "p5",
    name: "Misr Pharmacy",
    nameAr: "صيدلية مصر",
    address: "18 Al-Ahram St, Heliopolis",
    phone: "01099887766",
    contactPerson: "Hazem Tarek",
    areaId: "area2",
    repId: null,
    lineId: "line1",
    area: "Heliopolis"
  },
  {
    id: "p6",
    name: "El-Tarshouby Pharmacy",
    nameAr: "صيدلية الطرشوبي",
    address: "10 Abbas Al-Akkad, Nasr City",
    phone: "01223344556",
    contactPerson: "Mina Magdy",
    areaId: "area1",
    repId: "rep1",
    lineId: "line1",
    area: "Mohndseen"
  },
  {
    id: "p7",
    name: "Dawaee Pharmacy",
    nameAr: "صيدلية دوائي",
    address: "25 Beirut St, Heliopolis",
    phone: "01122334455",
    contactPerson: "Hoda Sameh",
    areaId: "area2",
    repId: null,
    lineId: "line1",
    area: "Heliopolis"
  }
];

const pharmaciesJson = JSON.stringify(originalPharmacies, null, 2);

// Replace from "doctors: [" up to "visits: [],"
const regex = /doctors:\s*\[[\s\S]*?visits:\s*\[\],/;

const replacement = `doctors: [],
  hospitals: [],
  pharmacies: ${pharmaciesJson},
  visits: [],`;

if (!regex.test(content)) {
  console.error("Could not find regex match in app.js!");
  process.exit(1);
}

content = content.replace(regex, replacement);

// Restore holiday
content = content.replace(/publicHolidays:\s*\[[\s\S]*?\]/, `publicHolidays: [{ date: "2026-10-06", title: "Armed Forces Day", titleAr: "عيد القوات المسلحة" }]`);

fs.writeFileSync(appJsPath, content, "utf8");
console.log("Successfully reverted app.js DEFAULT_DEMO_DATA to doctors: [], hospitals: [], pharmacies: original 7, and holiday: 2026-10-06.");
