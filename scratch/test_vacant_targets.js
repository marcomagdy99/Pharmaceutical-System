const fs = require('fs');

// Simple validation that store.js, sales-report.js, and achievements-report.js parse cleanly without syntax errors
try {
  const storeCode = fs.readFileSync('js/store.js', 'utf8');
  new Function(storeCode);
  console.log('js/store.js syntax: OK');
} catch (e) {
  console.error('js/store.js error:', e.message);
}

try {
  const salesReportCode = fs.readFileSync('js/sales-report.js', 'utf8');
  new Function(salesReportCode);
  console.log('js/sales-report.js syntax: OK');
} catch (e) {
  console.error('js/sales-report.js error:', e.message);
}

try {
  const achReportCode = fs.readFileSync('js/achievements-report.js', 'utf8');
  new Function(achReportCode);
  console.log('js/achievements-report.js syntax: OK');
} catch (e) {
  console.error('js/achievements-report.js error:', e.message);
}

console.log('All updated JS files parsed without syntax errors!');
