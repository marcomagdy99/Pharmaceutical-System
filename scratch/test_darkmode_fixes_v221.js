const fs = require('fs');
const path = require('path');

console.log("Verifying areas.css dark mode rules...");
const areasCss = fs.readFileSync(path.join(__dirname, '../css/areas.css'), 'utf8');

if (!areasCss.includes('[data-theme="dark"] .area-code-badge') || !areasCss.includes('#58a6ff !important')) {
  throw new Error("FAIL: .area-code-badge dark mode rule missing or incorrect!");
}

if (!areasCss.includes('[data-theme="dark"] .avatar-circle') || !areasCss.includes('#f8fafc !important')) {
  throw new Error("FAIL: .avatar-circle dark mode rule missing or incorrect!");
}
console.log("areas.css OK.");

console.log("Verifying announcements.css dark mode rules...");
const annCss = fs.readFileSync(path.join(__dirname, '../css/announcements.css'), 'utf8');

if (!annCss.includes('[data-theme="dark"] .stat-value') || !annCss.includes('#58a6ff !important')) {
  throw new Error("FAIL: .stat-value dark mode rule missing or incorrect in announcements.css!");
}

if (!annCss.includes('[data-theme="dark"] .btn-text') || !annCss.includes('#58a6ff !important')) {
  throw new Error("FAIL: .btn-text dark mode rule missing or incorrect in announcements.css!");
}
console.log("announcements.css OK.");

console.log("ALL DARK MODE TESTS PASSED FOR V221!");
