const fs = require('fs');

const arItems = JSON.parse(fs.readFileSync('scratch/all_dashboard_ar.json', 'utf8'));

const lines = arItems.map((item, idx) => `[${idx+1}] L${item.lineNum}: ${item.text.trim()}`);
fs.writeFileSync('scratch/all_items_utf8.txt', lines.join('\n'), 'utf8');
console.log('Saved', lines.length, 'lines in UTF-8');
