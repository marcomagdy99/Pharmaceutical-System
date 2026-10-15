const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const demoMatch = appContent.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
const demoData = eval('(' + demoMatch[1] + ')');

console.log('=== OTHER ENTITIES IN DEFAULT_DEMO_DATA ===');
for (const key of ['doctors', 'hospitals', 'pharmacies', 'areas', 'productLines', 'distributors', 'announcements', 'visits']) {
  const val = demoData[key];
  if (Array.isArray(val)) {
    const ids = val.map(x => x.id);
    console.log(`\n${key} (count: ${val.length}):`, ids.slice(0, 10));
  } else {
    console.log(`\n${key}: not an array or undefined`);
  }
}
