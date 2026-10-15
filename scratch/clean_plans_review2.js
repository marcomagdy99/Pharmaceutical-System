const fs = require('fs');
let c = fs.readFileSync('js/plans-review.js', 'utf8');
c = c.replace(/const msg = lang === "ar"\s*\?\s*"لا توجد زيارات معلقة أو مجدولة للمرافقة في هذا اليوم\."\s*:\s*("No pending or planned visits available for accompaniment on this day\.");/, 'const msg = $1;');
c = c.replace(/const msg = lang === "ar"\s*\?\s*"لا يمكن تعديل زيارة تم إنجازها بالفعل\."\s*:\s*("Cannot modify a visit that has already been completed\.");/, 'const msg = $1;');
fs.writeFileSync('js/plans-review.js', c, 'utf8');
console.log('plans-review remaining ar:', /[\u0600-\u06FF]/.test(fs.readFileSync('js/plans-review.js', 'utf8')));
