const fs = require('fs');

const files = [
  { name: 'js/users.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/doctors-report.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/pharmacies-report.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/hospitals-report.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/products.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/areas.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/distributors.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/announcements.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/visits.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] },
  { name: 'js/leaves.js', patterns: [/id\s*[:=]\s*[^,\n;]+/g] }
];

for (const f of files) {
  const content = fs.readFileSync(f.name, 'utf8');
  const lines = content.split('\n');
  console.log(`\n=== ${f.name} (New ID generation) ===`);
  lines.forEach((l, i) => {
    if ((l.includes('Date.now()') || l.includes('Date.now().toString') || l.includes('targetId =') || l.includes('generateId')) && (l.includes('id') || l.includes('ID') || l.includes('const') || l.includes('let'))) {
      console.log(`Line ${i+1}: ${l.trim().slice(0, 95)}`);
    }
  });
}
