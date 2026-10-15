const fs = require('fs');

console.log('=== Checking Data Isolation / Segregation Across Modules ===');

// 1. visits.js
const visitsCode = fs.readFileSync('js/visits.js', 'utf8');
const vLines = visitsCode.split('\n');
vLines.forEach((l, i) => {
  if (l.includes('filter(') && (l.includes('repId') || l.includes('userId') || l.includes('role'))) {
    console.log(`visits.js L${i+1}: ${l.trim().substring(0, 100)}`);
  }
});

// 2. sales-report.js
const salesCode = fs.readFileSync('js/sales-report.js', 'utf8');
const sLines = salesCode.split('\n');
sLines.forEach((l, i) => {
  if (l.includes('currentUser.role') || l.includes('isRep') || (l.includes('repId') && l.includes('==='))) {
    console.log(`sales-report.js L${i+1}: ${l.trim().substring(0, 100)}`);
  }
});

// 3. achievements-report.js
const achCode = fs.readFileSync('js/achievements-report.js', 'utf8');
const aLines = achCode.split('\n');
aLines.forEach((l, i) => {
  if (l.includes('currentUser.role') || l.includes('isRep') || (l.includes('repId') && l.includes('==='))) {
    console.log(`achievements-report.js L${i+1}: ${l.trim().substring(0, 100)}`);
  }
});

// 4. dashboard.js
const dashCode = fs.readFileSync('js/dashboard.js', 'utf8');
const dLines = dashCode.split('\n');
dLines.forEach((l, i) => {
  if (l.includes('user.role') && (l.includes('rep') || l.includes('medical_rep'))) {
    console.log(`dashboard.js L${i+1}: ${l.trim().substring(0, 100)}`);
  }
});
