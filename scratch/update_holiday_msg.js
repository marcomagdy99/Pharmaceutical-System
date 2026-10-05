const fs = require("fs");
let content = fs.readFileSync("js/app.js", "utf8");

const target = `  const holiday = holidays.find((h) => h.date === dateStr);
  if (holiday) {
    const hTitle = holiday.title || (isAr ? "عطلة رسمية عامة" : "Public Holiday");
    const msg = isAr
      ? \`⚠️ التاريخ المحدد (\${dateStr}) يوافق عطلة رسمية عامة (\${hTitle}). لا يُسمح بتسجيل أو تخطيط زيارات في العطلات الرسمية.\`
      : \`⚠️ The selected date (\${dateStr}) is an official public holiday (\${hTitle}). Recording or planning visits on public holidays is not permitted.\`;
    return { allowed: false, reason: "public_holiday", message: msg };
  }`;

const replacement = `  const holiday = holidays.find((h) => h.date === dateStr);
  if (holiday) {
    const hTitle = (isAr && holiday.titleAr) ? holiday.titleAr : (holiday.title || (isAr ? "عطلة رسمية" : "Public Holiday"));
    const msg = isAr
      ? \`⚠️ غير مسموح بتسجيل أو حفظ زيارة في يوم إجازة: التاريخ المحدد (\${dateStr}) يوافق عطلة رسمية (\${hTitle}).\`
      : \`⚠️ Recording or saving visits on holidays is not permitted: The selected date (\${dateStr}) is an official holiday (\${hTitle}).\`;
    return { allowed: false, reason: "public_holiday", message: msg };
  }`;

// Normalize line endings for replacement
const normalizedContent = content.replace(/\r\n/g, "\n");
const normalizedTarget = target.replace(/\r\n/g, "\n");
const normalizedReplacement = replacement.replace(/\r\n/g, "\n");

if (!normalizedContent.includes(normalizedTarget)) {
  console.error("Target not found!");
  process.exit(1);
}

const updatedContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
fs.writeFileSync("js/app.js", updatedContent, "utf8");
console.log("Successfully refined holiday message in app.js.");
