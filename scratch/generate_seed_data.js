// Seed data generator for PharmaCare Medical Directory
const areasConfig = [
  // Line 1
  { areaId: "area1", name: "Mohndseen", lineId: "line1", repId: "rep1" },
  { areaId: "area2", name: "Heliopolis", lineId: "line1", repId: null },
  { areaId: "area_line1_1790674592471", name: "Dokki", lineId: "line1", repId: "rep5" },
  { areaId: "area_line1_1790674637363", name: "Giza", lineId: "line1", repId: "rep2" },
  { areaId: "area_line1_1790674718201", name: "Fisal", lineId: "line1", repId: "rep3" },
  { areaId: "area_line1_1790688137857", name: "Haram", lineId: "line1", repId: "rep5" },
  { areaId: "area_line1_1790688157353", name: "Bolak El Dakror", lineId: "line1", repId: "rep1" },
  { areaId: "area_line1_1790688305597", name: "Shobra", lineId: "line1", repId: "u1790688369929" },

  // Line 2
  { areaId: "area3", name: "Nasr City", lineId: "line2", repId: null },
  { areaId: "area4", name: "Maadi", lineId: "line2", repId: null },
  { areaId: "area_line2_1790674745627", name: "Mohndseen", lineId: "line2", repId: "rep4" },
  { areaId: "area_line2_1790674771516", name: "Dokki", lineId: "line2", repId: null },
  { areaId: "area_line2_1790674781879", name: "Giza", lineId: "line2", repId: "u1790626607816" },
  { areaId: "area_line2_1790688168385", name: "Bolak El Dakror", lineId: "line2", repId: "rep4" },
  { areaId: "area_line2_1790688317554", name: "Shobra", lineId: "line2", repId: "u1790688412219" },

  // Line 3
  { areaId: "area_line_1790626036368_1790687909664", name: "Mohndseen", lineId: "line_1790626036368", repId: "u1790687949946" },
  { areaId: "area_line_1790626036368_1790674874231", name: "Shobra", lineId: "line_1790626036368", repId: "u1790626669586" }
];

const specialties = [
  { id: "spec_internal", name: "Internal Medicine", nameAr: "باطنة" },
  { id: "spec_cardiology", name: "Cardiology", nameAr: "قلب وأوعية" },
  { id: "spec_pediatrics", name: "Pediatrics", nameAr: "أطفال" },
  { id: "spec_neurology", name: "Neurology", nameAr: "مخ وأعصاب" },
  { id: "spec_orthopedics", name: "Orthopedics", nameAr: "عظام" },
  { id: "spec_chest", name: "Chest", nameAr: "صدرية" },
  { id: "spec_ent", name: "ENT", nameAr: "أنف وأذن وحنجرة" },
  { id: "spec_dermatology", name: "Dermatology", nameAr: "جلدية" },
  { id: "spec_gynecology", name: "Gynecology", nameAr: "نساء وتوليد" },
  { id: "spec_urology", name: "Urology", nameAr: "مسالك بولية" }
];

const egyptianDoctorFirstNames = [
  "أحمد", "محمد", "محمود", "كريم", "خالد", "عمرو", "شريف", "ياسر",
  "طارق", "سامح", "هشام", "عصام", "وائل", "إيهاب", "ماجد", "حازم",
  "منى", "سارة", "رشا", "إيمان", "نهى", "ريم", "دينا", "مروة",
  "هبة", "شيرين", "ياسمين", "مي", "أميرة", "رانيا", "نوران", "داليا"
];

const egyptianLastNames = [
  "مصطفى", "حسن", "إبراهيم", "علي", "محمود", "السيد", "عثمان", "فهمي",
  "صلاح", "شحاتة", "خليل", "زكي", "كامل", "توفيق", "بدوي", "يوسف",
  "عبد العزيز", "سلامة", "المهدي", "الصاوي", "منصور", "النجار", "الحداد", "حجازي"
];

const hospitalChains = [
  { name: "Al-Salam International Hospital", nameAr: "مستشفى السلام الدولي" },
  { name: "Cleopatra Hospital", nameAr: "مستشفى كليوباترا" },
  { name: "Dar Al Fouad Hospital", nameAr: "مستشفى دار الفؤاد" },
  { name: "Nasser Institute Hospital", nameAr: "مستشفى معهد ناصر" },
  { name: "Al-Safwa Specialized Hospital", nameAr: "مستشفى الصفوة التخصصي" },
  { name: "Giza International Hospital", nameAr: "مستشفى الجيزة الدولي" },
  { name: "Al-Amal Specialized Clinic", nameAr: "عيادات الأمل التخصصية" },
  { name: "Shobra General Hospital", nameAr: "مستشفى شبرا العام" },
  { name: "Dokki Specialized Hospital", nameAr: "مستشفى الدقي التخصصي" },
  { name: "Al-Nour Medical Center", nameAr: "مركز النور الطبي" },
  { name: "Al-Haram Specialized Hospital", nameAr: "مستشفى الهرم التخصصي" },
  { name: "Al-Marwa Hospital", nameAr: "مستشفى المروة" },
  { name: "Andalusia Medical Hospital", nameAr: "مستشفى أندلسية" },
  { name: "Misr International Hospital", nameAr: "مستشفى مصر الدولي" }
];

const pharmacyChains = [
  "Al-Ezaby Pharmacy",
  "Seif Pharmacy",
  "Roshdy Pharmacy",
  "19011 Pharmacy",
  "Misr Pharmacy",
  "El-Tarshouby Pharmacy",
  "Dawaee Pharmacy",
  "Care Pharmacy",
  "Al-Aghezy Pharmacy",
  "Fouad Pharmacy",
  "Al-Shams Pharmacy",
  "Dr. Tamer Pharmacy"
];

function generateDirectory() {
  const doctors = [];
  const hospitals = [];
  const pharmacies = [];

  let docCounter = 1;
  let hospCounter = 1;
  let pharmCounter = 1;

  areasConfig.forEach((area, aIdx) => {
    // Generate 3 doctors per area
    for (let i = 0; i < 3; i++) {
      const fn = egyptianDoctorFirstNames[(aIdx * 3 + i) % egyptianDoctorFirstNames.length];
      const ln = egyptianLastNames[(aIdx * 5 + i * 2) % egyptianLastNames.length];
      const spec = specialties[(aIdx * 2 + i) % specialties.length];
      const docClass = (i === 0) ? "A+" : (i === 1) ? "A" : "B";
      const id = `doc_${1000 + docCounter}`;
      docCounter++;

      doctors.push({
        id,
        name: `د. ${fn} ${ln}`,
        specialtyId: spec.id,
        specialty: spec.name,
        specialtyAr: spec.nameAr,
        class: docClass,
        address: `شارع ${ln}، ${area.name}`,
        clinicAddress: `شارع ${ln}، ${area.name}`,
        phone: `01${(i % 3 === 0 ? "0" : i % 3 === 1 ? "1" : "2")}${Math.floor(10000000 + Math.random() * 89999999)}`,
        repId: area.repId,
        areaId: area.areaId,
        area: area.name,
        lineId: area.lineId,
        visitsThisQuarter: 0
      });
    }

    // Generate 1-2 hospitals per area
    const hospTemplate = hospitalChains[aIdx % hospitalChains.length];
    const hospId = `hosp_${2000 + hospCounter}`;
    hospCounter++;
    hospitals.push({
      id: hospId,
      name: `${hospTemplate.name} - ${area.name}`,
      nameAr: `${hospTemplate.nameAr} - ${area.name}`,
      type: "hospital",
      address: `شارع الرئيسي، ${area.name}`,
      phone: `02${Math.floor(20000000 + Math.random() * 79999999)}`,
      repId: area.repId,
      areaId: area.areaId,
      area: area.name,
      lineId: area.lineId
    });

    // Generate 2 pharmacies per area
    for (let p = 0; p < 2; p++) {
      const pharmBrand = pharmacyChains[(aIdx * 2 + p) % pharmacyChains.length];
      const pharmId = `pharm_${3000 + pharmCounter}`;
      pharmCounter++;
      pharmacies.push({
        id: pharmId,
        name: `${pharmBrand} - ${area.name} ${p + 1}`,
        address: `ميدان المحطة، ${area.name}`,
        contactPerson: `د. ${egyptianDoctorFirstNames[(aIdx + p) % egyptianDoctorFirstNames.length]}`,
        phone: `01${(p === 0 ? "0" : "1")}${Math.floor(10000000 + Math.random() * 89999999)}`,
        repId: area.repId,
        areaId: area.areaId,
        area: area.name,
        lineId: area.lineId
      });
    }
  });

  return { doctors, hospitals, pharmacies };
}

module.exports = { generateDirectory };

if (require.main === module) {
  const data = generateDirectory();
  console.log(`Generated: ${data.doctors.length} doctors, ${data.hospitals.length} hospitals, ${data.pharmacies.length} pharmacies.`);
  console.log("Sample Doctor:", JSON.stringify(data.doctors[0], null, 2));
  console.log("Sample Hospital:", JSON.stringify(data.hospitals[0], null, 2));
  console.log("Sample Pharmacy:", JSON.stringify(data.pharmacies[0], null, 2));
}
