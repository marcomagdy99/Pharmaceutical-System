// Removes the EARLIER duplicate translation keys in activities-core.js.
// JS object literals keep the LAST duplicate, so deleting the earlier ones preserves runtime behaviour exactly.
const fs = require('fs');
const p = require('path').resolve(__dirname, '..', 'js', 'activities-core.js');
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
const expect = { 108: /^\s*dayOff:/, 146: /^\s*allEmployees:/, 296: /^\s*dayOff:/, 334: /^\s*allEmployees:/ };
for (const [n, re] of Object.entries(expect)) {
  if (!re.test(lines[n - 1])) { console.error('ABORT: line ' + n + ' is not what was expected: ' + lines[n - 1]); process.exit(1); }
}
const drop = new Set(Object.keys(expect).map(Number));
const out = lines.filter((_, i) => !drop.has(i + 1));
fs.writeFileSync(p, out.join(eol));
console.log('Removed', drop.size, 'earlier duplicate keys.');
