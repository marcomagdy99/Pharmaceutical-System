const fs = require('fs');

let content = fs.readFileSync('js/achievements-report.js', 'utf8');

// Normalize line endings to \n temporarily
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. ACH_MONTHS_AR
content = content.replace(
  /const ACH_MONTHS_AR = [^;]+;/s,
  'const ACH_MONTHS_AR = ACH_MONTHS;'
);

// 2. checkedBoxes label
content = content.replace(
  /\? `\$\{checkedBoxes\.length\} شهور محددة`\s*: `\$\{checkedBoxes\.length\} Months Selected`;/g,
  ': `${checkedBoxes.length} Months Selected`;'
);
content = content.replace(
  /labelEl\.textContent = lang === 'ar'\s*\n\s*\? `\$\{checkedBoxes\.length\} شهور محددة`\s*\n\s*: `\$\{checkedBoxes\.length\} Months Selected`;/g,
  'labelEl.textContent = `${checkedBoxes.length} Months Selected`;'
);

// 3. headers
content = content.replace(
  /const headers = \[\s*lang === 'ar' \? 'المندوب' : 'Representative'[\s\S]*?lang === 'ar' \? 'نسبة التحقيق' : 'Achievement %',\s*\];/s,
  `const headers = [
    'Representative',
    'Territory',
    'Product',
    'Target Units',
    'Actual Units',
    'Target Value (EGP)',
    'Actual Value (EGP)',
    'Achievement %',
  ];`
);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/achievements-report.js', content, 'utf8');
console.log('achievements-report.js cleaned. Remaining Arabic:', /[\u0600-\u06FF]/.test(content));
