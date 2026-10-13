const fs = require('fs');
const path = require('path');

const jsDir = './js';
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.includes('min') && !f.includes('chart'));

const nameFields = [
  'approverName',
  'actorName',
  'userName',
  'repName',
  'managerName',
  'lineManagerName',
  'authorName',
  'createdByName'
];

let totalMatches = 0;

files.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((l, idx) => {
    // Exclude users.js or app.js users table where users are actually defined with name: "..."
    if ((file === 'users.js' || file === 'app.js') && l.includes('"name":') && !l.includes('approverName') && !l.includes('actorName') && !l.includes('repName')) {
      return;
    }

    nameFields.forEach(field => {
      const regex = new RegExp(`['"]?${field}['"]?\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
      const m = l.match(regex);
      if (m) {
        // Ignore generic placeholders like "Line Manager", "District Manager", "HR Department", "Unknown", ""
        const val = m[1].trim();
        const generic = ['District Manager', 'Line Manager', 'Business Unit Head', 'HR Department', 'Admin', 'Medical Rep', 'Employee', '', 'System Admin', 'Self', 'Skipped (Workflow Config)'];
        if (!generic.includes(val)) {
          matches.push({ line: idx + 1, field, val, text: l.trim() });
        }
      }
    });
  });

  if (matches.length > 0) {
    console.log(`\n=== ${file} (${matches.length} matches) ===`);
    matches.forEach(m => console.log(`  L${m.line} [${m.field}]: "${m.val}"`));
    totalMatches += matches.length;
  }
});

console.log(`\n========================================`);
console.log(`Total hardcoded name matches: ${totalMatches}`);
console.log(`========================================`);
