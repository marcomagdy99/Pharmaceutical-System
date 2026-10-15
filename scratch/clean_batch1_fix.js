const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';

function patchFile(file, fn) {
  const full = path.join(root, file);
  const oldC = fs.readFileSync(full, 'utf8');
  const newC = fn(oldC);
  fs.writeFileSync(full, newC, 'utf8');
}

// 1. interactive-charts.js
patchFile('js/interactive-charts.js', c => {
  return c.replace(/labels:\s*currentLang === 'ar'\s*\?\s*\['[^']*', '[^']*', '[^']*'\]\s*:\s*(\['Class A', 'Class B', 'Hospitals'\])/, 'labels: $1')
          .replace(/labels:\s*currentLang === 'ar'\s*\?\s*\['[^']*', '[^']*'\]\s*:\s*(\['Covered', 'Remaining'\])/, 'labels: $1');
});

// 2. products.js
patchFile('js/products.js', c => {
  return c.replace('if (line.id === "line_1790626000001" || line.id === "line1") { line.nameAr = "خط الكارديو (Cardio)"; updated = true; }', '')
          .replace('else if (line.id === "line_1790626000002" || line.id === "line2") { line.nameAr = "خط النيورو (Neuro)"; updated = true; }', '')
          .replace('getCurrentLang() === "ar"\n          ? "غير مصرح: إدارة المنتجات وخطوط الإنتاج مخصصة لمسؤول النظام (الأدمن) فقط."\n          : "Permission Denied: Product & Line management is restricted to Admin only."', '"Permission Denied: Product & Line management is restricted to Admin only."')
          .replace(': (line.lineManagerName || (currentLang === "ar" ? "غير محدد" : "Unassigned"));', ': (line.lineManagerName || "Unassigned");')
          .replace('<strong style="color: #1d4ed8;">🎯 ${currentLang === "ar" ? "تركيز الحملة البيعية الحالية:" : "Current Cycle Campaign Focus:"}</strong>', '<strong style="color: #1d4ed8;">🎯 Current Cycle Campaign Focus:</strong>')
          .replace('<i class="bi bi-pencil"></i> ${currentLang === "ar" ? "تعديل التركيز" : "Edit Focus"}', '<i class="bi bi-pencil"></i> Edit Focus')
          .replace('const repName = rep ? rep.name : (currentLang === "ar" ? "شاغر" : "Vacant");', 'const repName = rep ? rep.name : "Vacant";');
});

// 3. hospitals-report.js
patchFile('js/hospitals-report.js', c => {
  return c.replace('getCurrentLang() === "ar" ? "يرجى ملء الحقول الإلزامية." : "Please fill in required fields."', '"Please fill in required fields."')
          .replace('getCurrentLang() === "ar" ? "لا توجد مستشفيات للتصدير." : "No hospitals to export."', '"No hospitals to export."');
});

// 4. pharmacies-report.js
patchFile('js/pharmacies-report.js', c => {
  return c.replace("🗑️ ${lang === 'ar' ? 'حذف' : 'Delete'}", "🗑️ Delete");
});

// 5. doctors-report.js
patchFile('js/doctors-report.js', c => {
  return c.replace("🗑️ ${lang === 'ar' ? 'حذف' : 'Delete'}", "🗑️ Delete");
});
