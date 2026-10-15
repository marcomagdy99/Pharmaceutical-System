const fs = require('fs');

let content = fs.readFileSync('js/app.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. targetLangText
content = content.replace(
  'const targetLangText = lang === "ar" ? "English" : "عربي";',
  'const targetLangText = "English";'
);

// 2. parsed.nameAr in migration
content = content.replace(
  'parsed.nameAr = "فادي عادل";',
  'parsed.nameAr = "Fady Adel";'
);

// 3. demo specialties
content = content.replace('{ id: "spec_internal", code: "IM", name: "Internal Medicine", nameAr: "باطنة" },', '{ id: "spec_internal", code: "IM", name: "Internal Medicine", nameAr: "Internal Medicine" },');
content = content.replace('{ id: "spec_pediatrics", code: "PED", name: "Pediatrics", nameAr: "أطفال" },', '{ id: "spec_pediatrics", code: "PED", name: "Pediatrics", nameAr: "Pediatrics" },');
content = content.replace('{ id: "spec_cardiology", code: "CARD", name: "Cardiology", nameAr: "قلب وأوعية" },', '{ id: "spec_cardiology", code: "CARD", name: "Cardiology", nameAr: "Cardiology" },');
content = content.replace('{ id: "spec_dermatology", code: "DERM", name: "Dermatology", nameAr: "جلدية" },', '{ id: "spec_dermatology", code: "DERM", name: "Dermatology", nameAr: "Dermatology" },');
content = content.replace('{ id: "spec_ophthalmology", code: "OPHTH", name: "Ophthalmology", nameAr: "عيون" },', '{ id: "spec_ophthalmology", code: "OPHTH", name: "Ophthalmology", nameAr: "Ophthalmology" },');
content = content.replace('{ id: "spec_orthopedics", code: "ORTHO", name: "Orthopedics", nameAr: "عظام" },', '{ id: "spec_orthopedics", code: "ORTHO", name: "Orthopedics", nameAr: "Orthopedics" },');
content = content.replace('{ id: "spec_ent", code: "ENT", name: "ENT", nameAr: "أنف وأذن وحنجرة" },', '{ id: "spec_ent", code: "ENT", name: "ENT", nameAr: "ENT" },');
content = content.replace('{ id: "spec_neurology", code: "NEURO", name: "Neurology", nameAr: "مخ وأعصاب" },', '{ id: "spec_neurology", code: "NEURO", name: "Neurology", nameAr: "Neurology" },');
content = content.replace('{ id: "spec_urology", code: "URO", name: "Urology", nameAr: "مسالك بولية" },', '{ id: "spec_urology", code: "URO", name: "Urology", nameAr: "Urology" },');
content = content.replace('{ id: "spec_gynecology", code: "GYN", name: "Gynecology", nameAr: "نساء وتوليد" },', '{ id: "spec_gynecology", code: "GYN", name: "Gynecology", nameAr: "Gynecology" },');
content = content.replace('{ id: "spec_other", code: "OTHER", name: "Other", nameAr: "أخرى" },', '{ id: "spec_other", code: "OTHER", name: "Other", nameAr: "Other" },');

// 4. demo product lines
content = content.replace('nameAr: "خط الكارديو (Cardio)",', 'nameAr: "Cardio Line",');
content = content.replace('nameAr: "خط النيورو (Neuro)",', 'nameAr: "Neuro Line",');

// 5. demo pharmacies
content = content.replace('"nameAr": "صيدلية العزبي",', '"nameAr": "El-Ezaby Pharmacy",');
content = content.replace('"nameAr": "صيدلية سيف",', '"nameAr": "Seif Pharmacy",');
content = content.replace('"nameAr": "صيدلية رشدي",', '"nameAr": "Roshdy Pharmacy",');
content = content.replace('"nameAr": "صيدلية 19011",', '"nameAr": "19011 Pharmacy",');
content = content.replace('"nameAr": "صيدلية مصر",', '"nameAr": "Misr Pharmacy",');
content = content.replace('"nameAr": "صيدلية الطرشوبي",', '"nameAr": "El-Tarshouby Pharmacy",');
content = content.replace('"nameAr": "صيدلية دوائي",', '"nameAr": "Dawaee Pharmacy",');

// 6. demo announcements
content = content.replace('titleAr: "مواعيد العمل في رمضان",', 'titleAr: "Ramadan Working Hours",');
content = content.replace(
  '"يرجى العلم أن مواعيد العمل خلال شهر رمضان ستكون من 9 صباحاً حتى 3 عصراً بدءاً من الأسبوع القادم."',
  '"Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week."'
);
content = content.replace('titleAr: "الحفل السنوي للشركة",', 'titleAr: "Annual Company Event",');
content = content.replace(
  '"يسعدنا الإعلان عن الحفل السنوي للشركة يوم 15 أكتوبر في فندق فور سيزونز. جميع الموظفين مدعوون!"',
  '"We are excited to announce our annual company event on October 15th at the Four Seasons Hotel. All employees are invited!"'
);
content = content.replace('titleAr: "بوليصة التأمين الصحي الجديدة",', 'titleAr: "New Health Insurance Policy",');
content = content.replace(
  '"تم تفعيل بوليصة تأمين صحي جديدة. يرجى مراجعة المزايا المحدثة في بوابة الموارد البشرية."',
  '"A new health insurance policy has been activated. Please review updated benefits in HR portal."'
);

// 7. holiday
content = content.replace('titleAr: "عيد القوات المسلحة"', 'titleAr: "Armed Forces Day"');

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/app.js', content, 'utf8');

// Check remaining lines
const lines = content.split('\n');
const remaining = [];
lines.forEach((l, i) => {
  if (/[\u0600-\u06FF]/.test(l)) remaining.push({ line: i + 1, text: l.trim() });
});
console.log('app.js remaining Arabic lines:', remaining.length);
remaining.forEach(r => console.log('L' + r.line + ': ' + r.text));
