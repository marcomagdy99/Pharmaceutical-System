const fs = require('fs');

let content = fs.readFileSync('js/announcements.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// Replace Arabic in demoAnnouncements
content = content.replace('titleAr: "مواعيد العمل في رمضان",', 'titleAr: "Ramadan Working Hours",');
content = content.replace(
  'bodyAr:\n      "يرجى العلم أن مواعيد العمل خلال شهر رمضان ستكون من 9 صباحاً حتى 3 عصراً بدءاً من الأسبوع القادم. يرجى تنظيم زياراتكم والتنسيق مع مديري المناطق لأي تغييرات في الجدول.",',
  'bodyAr: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week. Please plan your visits accordingly and coordinate with your district managers for any schedule changes.",'
);

content = content.replace('titleAr: "الحفل السنوي للشركة",', 'titleAr: "Annual Company Event",');
content = content.replace(
  'bodyAr:\n      "يسعدنا الإعلان عن الحفل السنوي للشركة يوم 15 أكتوبر في فندق فور سيزونز القاهرة. جميع الموظفين وعائلاتهم مدعوون! يرجى تأكيد الحضور قبل 30 سبتمبر. اللباس: رسمي عصري.",',
  'bodyAr: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel, Cairo. All employees and their families are invited! RSVP by September 30th. Dress code: Business casual.",'
);

content = content.replace('titleAr: "بوليصة التأمين الصحي الجديدة",', 'titleAr: "New Health Insurance Policy",');
content = content.replace(
  'bodyAr:\n      "تم تفعيل بوليصة تأمين صحي جديدة اعتباراً من 1 سبتمبر 2026. أهم التحديثات: تغطية موسعة لطب الأسنان، زيادة الحد السنوي إلى 500,000 جنيه، وإضافة دعم الصحة النفسية. يرجى مراجعة التفاصيل الكاملة مع الموارد البشرية.",',
  'bodyAr: "A new health insurance policy has been activated effective September 1st, 2026. Key updates include: expanded coverage for dental care, increased annual limit to 500,000 EGP, and added mental health support. Please review the full details with HR.",'
);

content = content.replace('titleAr: "برنامج حوافز المبيعات للربع الثالث",', 'titleAr: "Q3 Sales Incentive Program",');
content = content.replace(
  'bodyAr:\n      "سيحصل أفضل المناديب الطبيين في الربع الثالث على حوافز إضافية. الهدف: تحقيق 110%. المكافآت تشمل مكافأة مالية ورحلة مدفوعة بالكامل إلى شرم الشيخ.",',
  'bodyAr: "Top performing medical reps in Q3 will receive bonus incentives. Target: 110% achievement. Rewards include cash bonus and all-expenses-paid trip to Sharm El Sheikh.",'
);

content = content.replace('titleAr: "اجتماع المواءمة القيادية ربع السنوي",', 'titleAr: "Quarterly Leadership Alignment Meeting",');
content = content.replace(
  'bodyAr:\n      "يرجى من جميع مديري المناطق ومديري الخطوط ورؤساء القطاعات حضور اجتماع المراجعة القيادية ربع السنوية يوم الثلاثاء القادم الساعة 11:00 صباحاً.",',
  'bodyAr: "All District Managers, Line Managers, and Business Unit Heads are required to attend the quarterly leadership review next Tuesday at 11:00 AM.",'
);

content = content.replace('titleAr: "جلسة تخطيط الحصص البيعية للمناطق",', 'titleAr: "Territory Quota Planning Session",');
content = content.replace(
  'bodyAr:\n      "جلسة تخطيط الحصص البيعية التشغيلية المخصصة لمديري الخطوط ورؤساء القطاعات.",',
  'bodyAr: "Operational quota planning session for Line Managers and Business Unit Heads.",'
);

content = content.replace('titleAr: "إحاطة الموازنة الاستراتيجية السنوية",', 'titleAr: "Annual Strategic Budget Briefing",');
content = content.replace(
  'bodyAr:\n      "إحاطة الأطر المالية والمستهدفات السنوية السرية المخصصة لرؤساء القطاعات فقط.",',
  'bodyAr: "Confidential financial framework and annual targets briefing exclusively for Business Unit Heads.",'
);

content = content.replace('titleAr: "مراجعة العمليات الداخلية للموارد البشرية والإدارة",', 'titleAr: "Internal HR & Administration Operations Review",');
content = content.replace(
  'bodyAr:\n      "مراجعة داخلية سرية حول عقود الموظفين وتعديلات مسيرات الرواتب والسياسات الإدارية للنظام.",',
  'bodyAr: "Confidential internal review on staff contracts, payroll adjustments, and system administrative policies.",'
);

// Replace UI strings
content = content.replace(
  '${!ann.published ? `<span class="badge bg-warning text-dark border border-warning-subtle"><i class="fas fa-file-alt"></i> ${lang === "ar" ? "مسودة" : "Draft"}</span>` : ""}',
  '${!ann.published ? `<span class="badge bg-warning text-dark border border-warning-subtle"><i class="fas fa-file-alt"></i> Draft</span>` : ""}'
);

content = content.replace(
  `  if (!file.type.startsWith("image/")) {
    const msg = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar')
      ? 'يرجى اختيار ملف صورة صالح.'
      : 'Please select a valid image file.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }`,
  `  if (!file.type.startsWith("image/")) {
    const msg = 'Please select a valid image file.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }`
);

content = content.replace(
  `  if (!title || !titleAr || !body || !bodyAr) {
    const msg = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar')
      ? 'يرجى ملء جميع الحقول المطلوبة.'
      : 'Please fill all required fields.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }`,
  `  const finalTitleAr = titleAr || title;
  const finalBodyAr = bodyAr || body;
  if (!title || !body) {
    const msg = 'Please fill all required fields.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }`
);

// In saveAnnouncement, make sure finalTitleAr and finalBodyAr are used
content = content.replace(
  '        titleAr,\n        body,\n        bodyAr,',
  '        titleAr: finalTitleAr,\n        body,\n        bodyAr: finalBodyAr,'
);
content = content.replace(
  '      titleAr,\n      body,\n      bodyAr,',
  '      titleAr: finalTitleAr,\n      body,\n      bodyAr: finalBodyAr,'
);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/announcements.js', content, 'utf8');
console.log('announcements.js cleaned. Remaining Arabic:', /[\u0600-\u06FF]/.test(content));
