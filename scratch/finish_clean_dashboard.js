const fs = require('fs');

let content = fs.readFileSync('js/dashboard.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. planExpiryNote
content = content.replace(
  `  const planExpiryNote = lang === "ar"
    ? \`تنتهي الصلاحية تلقائياً بعد \${expiryDays} \${expiryDays === 1 ? "يوم" : (expiryDays === 2 ? "يومين" : (expiryDays <= 10 ? "أيام" : "يوماً"))} إذا لم تُنفذ\`
    : \`Auto-expires after \${expiryDays} day\${expiryDays > 1 ? "s" : ""} if not executed\`;`,
  '  const planExpiryNote = `Auto-expires after ${expiryDays} day${expiryDays > 1 ? "s" : ""} if not executed`;'
);

// 2. Reschedule buttons
content = content.replace(
  /<button type="button" class="btn-plan-reschedule" onclick="openRescheduleModal\('([^']+)'\)" title="\${lang === 'ar' \? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">\s*🗓️ \${lang === 'ar' \? 'تأجيل' : 'Reschedule'}\s*<\/button>/g,
  `<button type="button" class="btn-plan-reschedule" onclick="openRescheduleModal('$1')" title="Reschedule or Missed Call">\n                          🗓️ Reschedule\n                        </button>`
);

// 3. targetTypeBadge in L1843-1855
content = content.replace(
  `                            const targetTypeBadge = isPharm
                              ? lang === "ar"
                                ? "صيدلية"
                                : "Pharmacy"
                              : isHospital
                                ? lang === "ar"
                                  ? "مستشفى"
                                  : "Hospital"
                                : lang === "ar"
                                  ? "عيادة طبيب"
                                  : "Clinic Visit";
                            const periodBadge = isPharm
                              ? \`<span class="badge badge-period-pharm">💊 \${lang === "ar" ? "صيدلية" : "PHARM"}</span>\``,
  `                            const targetTypeBadge = isPharm
                              ? "Pharmacy"
                              : isHospital
                                ? "Hospital"
                                : "Clinic Visit";
                            const periodBadge = isPharm
                              ? \`<span class="badge badge-period-pharm">💊 PHARM</span>\``
);

// 4. targetTypeBadge in L2009-2021
content = content.replace(
  `                              const targetTypeBadge = isPharm
                                ? lang === "ar"
                                  ? "صيدلية"
                                  : "Pharmacy"
                                : isHospital
                                  ? lang === "ar"
                                    ? "مستشفى"
                                    : "Hospital"
                                  : lang === "ar"
                                    ? "عيادة طبيب"
                                    : "Clinic Visit";
                              const periodBadge = isPharm
                                ? \`<span class="badge badge-period-pharm">💊 \${lang === "ar" ? "صيدلية" : "PHARM"}</span>\``,
  `                              const targetTypeBadge = isPharm
                                ? "Pharmacy"
                                : isHospital
                                  ? "Hospital"
                                  : "Clinic Visit";
                              const periodBadge = isPharm
                                ? \`<span class="badge badge-period-pharm">💊 PHARM</span>\``
);

// 5. msg in L3583-3589
content = content.replace(
  `    const msg = lang === "ar"
      ? (limitDays === 0
          ? "وفقاً لسياسة الشركة، يجب تسجيل الزيارات الفعلية في نفس اليوم فقط."
          : \`وفقاً لسياسة الشركة، لا يمكن تسجيل زيارة فعلية بعد مرور أكثر من \${limitDays} \${limitDays === 1 ? "يوم" : limitDays === 2 ? "يومين" : "أيام"} على تاريخها.\`)
      : (limitDays === 0
          ? "Company policy requires same-day visit logging only."
          : \`Company policy does not allow logging visits older than \${limitDays} day(s).\`);`,
  `    const msg = limitDays === 0
      ? "Company policy requires same-day visit logging only."
      : \`Company policy does not allow logging visits older than \${limitDays} day(s).\`;`
);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/dashboard.js', content, 'utf8');

const remainingArabic = [];
content.split('\n').forEach((l, idx) => {
  if (/[\u0600-\u06FF]/.test(l)) remainingArabic.push({ line: idx + 1, text: l.trim() });
});

console.log('dashboard.js final cleaned. Remaining Arabic lines:', remainingArabic.length);
remainingArabic.forEach(r => console.log('L' + r.line + ': ' + r.text));
