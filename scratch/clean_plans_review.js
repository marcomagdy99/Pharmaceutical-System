const fs = require('fs');

let c = fs.readFileSync('js/plans-review.js', 'utf8');

c = c.replace(/\(lang === 'ar' \? 'لا توجد خطط معلقة مطابقة لبحثك' : 'No pending plans match your search'\)/g, "'No pending plans match your search'");
c = c.replace(/\(lang === 'ar' \? 'جرب البحث باسم طبيب أو مندوب آخر أو تعديل الفلاتر\.' : 'Try adjusting your search query, rep, or product line filter\.'\)/g, "'Try adjusting your search query, rep, or product line filter.'");
c = c.replace(/\$\{lang === "ar" \? "زيارات" : "visits"\}/g, 'visits');
c = c.replace(/\(lang === "ar" \? "الفترة" : "Period"\)/g, '"Period"');
c = c.replace(/\(lang === "ar" \? "حالة الاعتماد" : "Status"\)/g, '"Status"');
c = c.replace(/\$\{lang === "ar" \? "صيدلية" : "Pharmacy"\}/g, 'Pharmacy');
c = c.replace(/\$\{lang === "ar" \? "صيدلية" : "PHARM"\}/g, 'PHARM');
c = c.replace(/\$\{lang === "ar" \? "بانتظار اعتماد الـ DM" : "Pending DM Approval"\}/g, 'Pending DM Approval');

c = c.replace(/lang === "ar"\s*\?\s*"لا توجد زيارات معلقة أو مجدولة للمرافقة في هذا اليوم\."\s*:\s*("No pending or scheduled visits available on this day\.")/g, '$1');
c = c.replace(/lang === "ar"\s*\?\s*"لا يمكن تعديل زيارة تم إنجازها بالفعل\."\s*:\s*("Completed visits cannot be modified\.")/g, '$1');

c = c.replace('const docName = doc ? (doc.nameAr || doc.name) : (visit.doctorName || "زيارة طبية");', 'const docName = doc ? doc.name : (visit.doctorName || "Medical Visit");');

c = c.replace('dateTextAr = "الجديدة";', '// dateText removed');
c = c.replace('dateTextAr = `لتاريخ ${sortedDates[0]}`;', '// dateText removed');
c = c.replace('dateTextAr = `للفترة (${sortedDates[0]} إلى ${sortedDates[sortedDates.length - 1]})`;', '// dateText removed');

fs.writeFileSync('js/plans-review.js', c, 'utf8');
console.log('plans-review remaining ar:', /[\u0600-\u06FF]/.test(fs.readFileSync('js/plans-review.js', 'utf8')));
