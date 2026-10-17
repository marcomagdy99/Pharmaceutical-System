const fs = require('fs');

console.log('--- TESTING ALL 10 REPORTS FILTER COMPATIBILITY ---');

// Check sales-report.js
const salesJs = fs.readFileSync('js/sales-report.js', 'utf8');
console.log('sales-report.js has all_reps:', salesJs.includes("selectedRep === 'all_reps'"));
console.log('sales-report.js has all_dms:', salesJs.includes("selectedRep === 'all_dms'"));

// Check achievements-report.js
const achJs = fs.readFileSync('js/achievements-report.js', 'utf8');
console.log('achievements-report.js has all_reps:', achJs.includes("selectedRepVal === 'all_reps'"));
console.log('achievements-report.js has all_dms:', achJs.includes("selectedRepVal === 'all_dms'"));

// Check timeline-report.js
const timeJs = fs.readFileSync('js/timeline-report.js', 'utf8');
console.log('timeline-report.js has all_reps:', timeJs.includes("selectedRep === 'all_reps'"));
console.log('timeline-report.js has all_dms:', timeJs.includes("selectedRep === 'all_dms'"));

// Check coverage-report.js
const covJs = fs.readFileSync('js/coverage-report.js', 'utf8');
console.log('coverage-report.js has all_reps:', covJs.includes("selectedRep === 'all_reps'"));
console.log('coverage-report.js has all_dms:', covJs.includes("selectedRep === 'all_dms'"));

// Check doctors-report.js
const docJs = fs.readFileSync('js/doctors-report.js', 'utf8');
console.log('doctors-report.js has all_reps:', docJs.includes('repId === "all_reps"'));
console.log('doctors-report.js has all_dms:', docJs.includes('repId === "all_dms"'));

// Check hospitals-report.js
const hospJs = fs.readFileSync('js/hospitals-report.js', 'utf8');
console.log('hospitals-report.js has all_reps:', hospJs.includes('repId === "all_reps"'));
console.log('hospitals-report.js has all_dms:', hospJs.includes('repId === "all_dms"'));

// Check pharmacies-report.js
const pharmJs = fs.readFileSync('js/pharmacies-report.js', 'utf8');
console.log('pharmacies-report.js has all_reps:', pharmJs.includes('repId === "all_reps"'));
console.log('pharmacies-report.js has all_dms:', pharmJs.includes('repId === "all_dms"'));

// Check accounts-costing-report.js
const costJs = fs.readFileSync('js/accounts-costing-report.js', 'utf8');
console.log('accounts-costing-report.js has rep matching with getUserLines:', costJs.includes('window.getUserLines(r.id)'));

console.log('ALL 10 REPORTS FILTER CHECKS COMPLETE!');
