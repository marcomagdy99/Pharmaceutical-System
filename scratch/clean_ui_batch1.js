const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';

function cleanFile(relPath, transforms) {
  const fullPath = path.join(root, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let count = 0;
  for (const [target, replacement] of transforms) {
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      count++;
    } else {
      console.warn(`[WARN] Not found in ${relPath}: ${target.slice(0, 50)}...`);
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`[CLEANED] ${relPath}: applied ${count}/${transforms.length} changes`);
}

// 1. js/users.js
cleanFile('js/users.js', [
  ['switch_lang: "عربي",', 'switch_lang: "English",'],
  [
    `          (window.getCurrentLang && window.getCurrentLang() === "ar")\n            ? "غير مصرح: صفحة المستخدمين مخصصة للإدارة والموارد البشرية فقط."\n            : "Access Denied: Admins & HR only.",`,
    `          "Access Denied: Admins & HR only.",`
  ]
]);

// 2. js/missing-days-report.js
cleanFile('js/missing-days-report.js', [
  ['name: "CIRA Line", nameAr: "خط السيرة"', 'name: "CIRA Line"']
]);

// 3. js/timeline-report.js
cleanFile('js/timeline-report.js', [
  [
    "specialty: act.notes || (lang === 'ar' ? 'نشاط يومي مسجل' : 'Logged Daily Activity'),",
    "specialty: act.notes || 'Logged Daily Activity',"
  ],
  [
    "dateBadge.textContent = fromDate === toDate ? (fromDate === _todayStr ? (lang === 'ar' ? 'اليوم' : 'Today') : fromDate) : `${fromDate} ➔ ${toDate}`;",
    "dateBadge.textContent = fromDate === toDate ? (fromDate === _todayStr ? 'Today' : fromDate) : `${fromDate} ➔ ${toDate}`;"
  ]
]);

// 4. js/interactive-charts.js
cleanFile('js/interactive-charts.js', [
  [
    "currentLang === 'ar' ? ['فئة A', 'فئة B', 'مستشفيات'] : ['Class A', 'Class B', 'Hospitals']",
    "['Class A', 'Class B', 'Hospitals']"
  ],
  [
    "currentLang === 'ar' ? ['مغطى', 'متبقي'] : ['Covered', 'Remaining']",
    "['Covered', 'Remaining']"
  ]
]);

// 5. js/products.js
cleanFile('js/products.js', [
  ['nameAr: "خط الكارديو (Cardio)",', ''],
  ['nameAr: "خط النيورو (Neuro)",', ''],
  ['if (line.id === "line_1790626000001" || line.id === "line1") { line.nameAr = "خط الكارديو (Cardio)"; }', ''],
  ['else if (line.id === "line_1790626000002" || line.id === "line2") { line.nameAr = "خط النيورو (Neuro)"; }', ''],
  [
    `showToast(
        getCurrentLang() === "ar"
          ? "غير مصرح: إدارة المنتجات وخطوط الإنتاج مخصصة لمسؤول النظام (الأدمن) فقط."
          : "Permission Denied: Product & Line management is restricted to Admin only.",
        "error"
      );`,
    `showToast("Permission Denied: Product & Line management is restricted to Admin only.", "error");`
  ],
  [
    `showToast(
      getCurrentLang() === "ar"
        ? "غير مصرح: إضافة أو تعديل المنتجات مقتصر على الأدمن فقط."
        : "Permission Denied: Adding or editing products is restricted to Admin only.",
      "error"
    );`,
    `showToast("Permission Denied: Adding or editing products is restricted to Admin only.", "error");`
  ],
  [
    `showToast(
      getCurrentLang() === "ar"
        ? "غير مصرح: حذف المنتجات مقتصر على الأدمن فقط."
        : "Permission Denied: Deleting products is restricted to Admin only.",
      "error"
    );`,
    `showToast("Permission Denied: Deleting products is restricted to Admin only.", "error");`
  ],
  [
    `showToast(
      getCurrentLang() === "ar"
        ? "غير مصرح: إضافة أو تعديل خطوط الإنتاج مقتصر على الأدمن فقط."
        : "Permission Denied: Adding or editing lines is restricted to Admin only.",
      "error"
    );`,
    `showToast("Permission Denied: Adding or editing lines is restricted to Admin only.", "error");`
  ],
  [
    `showToast(
      getCurrentLang() === "ar"
        ? "غير مصرح: حذف خطوط الإنتاج مقتصر على الأدمن فقط."
        : "Permission Denied: Deleting lines is restricted to Admin only.",
      "error"
    );`,
    `showToast("Permission Denied: Deleting lines is restricted to Admin only.", "error");`
  ]
]);

// 6. js/hospitals-report.js
cleanFile('js/hospitals-report.js', [
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة وتعديل المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can modify hospital data.", "error");`,
    `showToast("Permission Denied: Only Admin can modify hospital data.", "error");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إضافة وتعديل المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can add or edit hospitals.", "error");`,
    `showToast("Permission Denied: Only Admin can add or edit hospitals.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "يرجى ملء الحقول الإلزامية للمستشفى." : "Please fill in all required hospital fields.", "warning");`,
    `if (typeof showToast === "function") showToast("Please fill in all required hospital fields.", "warning");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حفظ المستشفى بنجاح." : "Hospital saved successfully.", "success");`,
    `if (typeof showToast === "function") showToast("Hospital saved successfully.", "success");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can delete hospitals.", "error");`,
    `showToast("Permission Denied: Only Admin can delete hospitals.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حذف المستشفى بنجاح." : "Hospital deleted successfully.", "success");`,
    `if (typeof showToast === "function") showToast("Hospital deleted successfully.", "success");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can import hospitals.", "error");`,
    `showToast("Permission Denied: Only Admin can import hospitals.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "حدث خطأ أثناء قراءة ملف الإكسيل." : "Error reading Excel file.", "error");`,
    `if (typeof showToast === "function") showToast("Error reading Excel file.", "error");`
  ]
]);

// 7. js/pharmacies-report.js
cleanFile('js/pharmacies-report.js', [
  [
    `const areaName = areaObj ? (areaObj.name || areaObj.id) : (p.area || (lang === "ar" ? "عام" : "General"));`,
    `const areaName = areaObj ? (areaObj.name || areaObj.id) : (p.area || "General");`
  ],
  [
    `const repName = repObj ? repObj.name : (lang === "ar" ? "غير مسند" : "Unassigned");`,
    `const repName = repObj ? repObj.name : "Unassigned";`
  ],
  [
    `<span class="info-text">\${lang === 'ar' ? 'المنطقة:' : 'Area:'} <strong>\${window.escapeHtml(areaName)}</strong></span>`,
    `<span class="info-text">Area: <strong>\${window.escapeHtml(areaName)}</strong></span>`
  ],
  [
    `<span class="info-text">\${lang === 'ar' ? 'المندوب المسؤول:' : 'Rep:'} <strong>\${window.escapeHtml(repName)}</strong></span>`,
    `<span class="info-text">Rep: <strong>\${window.escapeHtml(repName)}</strong></span>`
  ],
  [
    `✏️ \${lang === 'ar' ? 'تعديل' : 'Edit'}`,
    `✏️ Edit`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة وتعديل الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can modify pharmacy data.", "error");`,
    `showToast("Permission Denied: Only Admin can modify pharmacy data.", "error");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إضافة وتعديل الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can add or edit pharmacies.", "error");`,
    `showToast("Permission Denied: Only Admin can add or edit pharmacies.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "يرجى ملء الحقول الإلزامية للصيدلية." : "Please fill in all required pharmacy fields.", "warning");`,
    `if (typeof showToast === "function") showToast("Please fill in all required pharmacy fields.", "warning");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حفظ الصيدلية بنجاح." : "Pharmacy saved successfully.", "success");`,
    `if (typeof showToast === "function") showToast("Pharmacy saved successfully.", "success");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can delete pharmacies.", "error");`,
    `showToast("Permission Denied: Only Admin can delete pharmacies.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حذف الصيدلية بنجاح." : "Pharmacy deleted successfully.", "success");`,
    `if (typeof showToast === "function") showToast("Pharmacy deleted successfully.", "success");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can import pharmacies.", "error");`,
    `showToast("Permission Denied: Only Admin can import pharmacies.", "error");`
  ]
]);

// 8. js/doctors-report.js
cleanFile('js/doctors-report.js', [
  [
    `const areaName = areaObj ? (areaObj.name || areaObj.id) : (d.area || (lang === "ar" ? "عام" : "General"));`,
    `const areaName = areaObj ? (areaObj.name || areaObj.id) : (d.area || "General");`
  ],
  [
    `const repName = repObj ? repObj.name : (lang === "ar" ? "غير مسند" : "Unassigned");`,
    `const repName = repObj ? repObj.name : "Unassigned";`
  ],
  [
    `<span class="info-text">\${lang === 'ar' ? 'المنطقة:' : 'Area:'} <strong>\${window.escapeHtml(areaName)}</strong></span>`,
    `<span class="info-text">Area: <strong>\${window.escapeHtml(areaName)}</strong></span>`
  ],
  [
    `<span class="info-text">\${lang === 'ar' ? 'المندوب المسؤول:' : 'Rep:'} <strong>\${window.escapeHtml(repName)}</strong></span>`,
    `<span class="info-text">Rep: <strong>\${window.escapeHtml(repName)}</strong></span>`
  ],
  [
    `✏️ \${lang === 'ar' ? 'تعديل' : 'Edit'}`,
    `✏️ Edit`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة وتعديل الأطباء للأدمن فقط." : "Permission Denied: Only Admin can modify doctor data.", "error");`,
    `showToast("Permission Denied: Only Admin can modify doctor data.", "error");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إضافة وتعديل الأطباء للأدمن فقط." : "Permission Denied: Only Admin can add or edit doctors.", "error");`,
    `showToast("Permission Denied: Only Admin can add or edit doctors.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "يرجى ملء الحقول الإلزامية للطبيب." : "Please fill in all required doctor fields.", "warning");`,
    `if (typeof showToast === "function") showToast("Please fill in all required doctor fields.", "warning");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حفظ الطبيب بنجاح." : "Doctor saved successfully.", "success");`,
    `if (typeof showToast === "function") showToast("Doctor saved successfully.", "success");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف الأطباء للأدمن فقط." : "Permission Denied: Only Admin can delete doctors.", "error");`,
    `showToast("Permission Denied: Only Admin can delete doctors.", "error");`
  ],
  [
    `if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حذف الطبيب بنجاح." : "Doctor deleted successfully.", "success");`,
    `if (typeof showToast === "function") showToast("Doctor deleted successfully.", "success");`
  ],
  [
    `showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة الأطباء للأدمن فقط." : "Permission Denied: Only Admin can import doctors.", "error");`,
    `showToast("Permission Denied: Only Admin can import doctors.", "error");`
  ]
]);
