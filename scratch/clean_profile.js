const fs = require('fs');

let c = fs.readFileSync('js/profile.js', 'utf8');

// 1. Remove ar: { ... } dictionary
c = c.replace(/,\s*ar:\s*\{[\s\S]*?\n\s*\},/g, ',');

// 2. Remove role translations
c = c.replace(/medical_rep:\s*lang === "ar" \? "مندوب طبي" : "Medical Rep"/g, 'medical_rep: "Medical Rep"');
c = c.replace(/district_manager:\s*lang === "ar" \? "مدير منطقة" : "District Manager"/g, 'district_manager: "District Manager"');
c = c.replace(/line_manager:\s*lang === "ar" \? "مدير خط" : "Line Manager"/g, 'line_manager: "Line Manager"');
c = c.replace(/business_unit:\s*lang === "ar" \? "رئيس وحدة الأعمال" : "Business Unit Head"/g, 'business_unit: "Business Unit Head"');
c = c.replace(/admin:\s*lang === "ar" \? "مدير النظام" : "System Admin"/g, 'admin: "System Admin"');
c = c.replace(/hr:\s*lang === "ar" \? "مسؤول موارد بشرية" : "HR Manager"/g, 'hr: "HR Manager"');

// 3. Clean other ternaries
c = c.replace(/\(currentLang === "ar" \? "تم تحديث الصورة الشخصية بنجاح!" : "Profile photo updated successfully!"\)/g, '"Profile photo updated successfully!"');
c = c.replace(/lang === "ar" \? "الإدارة العامة" : "HQ \/ General"/g, '"HQ / General"');
c = c.replace(/lang === "ar" \? "كافة الخطوط" : "All Product Lines"/g, '"All Product Lines"');
c = c.replace(/\(lang === "ar" && manager\?\.nameAr\) \? manager\.nameAr : \(manager \? manager\.name : \(lang === "ar" \? "لا يوجد" : "None"\)\)/g, '(manager ? manager.name : "None")');
c = c.replace(/lang === "ar" \? "أيام" : "Days"/g, '"Days"');
c = c.replace(/taglineAr:\s*"[^"]*",?/g, '');
c = c.replace(/descAr:\s*"[^"]*",?/g, '');

// 4. Backlog labels
c = c.replace(/const backlogLabelsAr = \{[\s\S]*?\};/g, 'const backlogLabelsAr = {};');
c = c.replace(/const bAr = backlogLabelsAr\[visitBacklogLimitDays\] \|\| `\$\{visitBacklogLimitDays\} يوم`;/g, '');

// 5. Toasts
c = c.replace(/const msg = lang === "ar" \? "يرجى اختيار ملف صورة صالح \(PNG, JPG, SVG\)\." : "Please select a valid image file \(PNG, JPG, SVG\)\.";/g, 'const msg = "Please select a valid image file (PNG, JPG, SVG).";');
c = c.replace(/const msg = lang === "ar" \? "تم ضبط وتصغير الشعار تلقائياً بنجاح!" : "Logo auto-scaled and optimized successfully!";/g, 'const msg = "Logo auto-scaled and optimized successfully!";');
c = c.replace(/showToast\(\(isAr \? "فشل حفظ إعدادات الشركة: " : "Failed to save company settings: "\) \+ \(err\.message \|\| err\)\);/g, 'showToast("Failed to save company settings: " + (err.message || err));');
c = c.replace(/showToast\(isAr \? "تمت استعادة قاعدة البيانات بنجاح! جاري التحديث\.\.\." : "Database restored successfully! Refreshing\.\.\."\);/g, 'showToast("Database restored successfully! Refreshing...");');
c = c.replace(/showToast\(\(isAr \? "فشل استعادة النسخة الاحتياطية: " : "Failed to restore backup: "\) \+ \(err\.message \|\| err\)\);/g, 'showToast("Failed to restore backup: " + (err.message || err));');
c = c.replace(/nameAr:\s*"[^"]*",?/g, '');
c = c.replace(/showToast\(isAr \? "تهانينا! تم إطلاق النظام في بيئة الإنتاج بنجاح!" : "Congratulations! Production launched successfully!"\);/g, 'showToast("Congratulations! Production launched successfully!");');

fs.writeFileSync('js/profile.js', c, 'utf8');
console.log('profile.js remaining ar lines:');
fs.readFileSync('js/profile.js', 'utf8').split(/\r?\n/).forEach((l, idx) => {
  if (/[\u0600-\u06FF]/.test(l)) console.log(`  L${idx+1}: ${l.trim()}`);
});
