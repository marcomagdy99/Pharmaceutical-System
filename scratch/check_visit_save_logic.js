const fs = require('fs');

const visitsContent = fs.readFileSync('js/visits.js', 'utf8');
const lines = visitsContent.split('\n');

console.log('=== Searching for saveVisit / submit / timestamp in js/visits.js ===');
lines.forEach((l, i) => {
  if (l.includes('saveVisit') || l.includes('submitVisit') || l.includes('Date.now()') || l.includes('new Date()') || l.includes('checkVisitDateAllowed')) {
    if (l.includes('function') || l.includes('const') || l.includes('let') || l.includes('if')) {
      console.log(`Line ${i+1}: ${l.trim().slice(0, 95)}`);
    }
  }
});
