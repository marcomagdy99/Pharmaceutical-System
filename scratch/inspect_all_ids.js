const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const demoMatch = appContent.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
if (!demoMatch) {
  console.log('Could not find DEFAULT_DEMO_DATA');
  process.exit(1);
}

const demoData = eval('(' + demoMatch[1] + ')');

console.log('=== ID SCHEMES IN DEFAULT_DEMO_DATA ===');
for (const key of Object.keys(demoData)) {
  const val = demoData[key];
  if (Array.isArray(val) && val.length > 0) {
    const sampleIds = val.slice(0, 5).map(item => item && item.id ? item.id : (typeof item === 'object' ? JSON.stringify(item).slice(0, 30) : item));
    console.log(`\nCollection: [${key}] (total: ${val.length})`);
    console.log(`Sample IDs:`, sampleIds);
  } else if (typeof val === 'object' && val !== null) {
    if (val.id) {
      console.log(`\nObject: [${key}] ID: ${val.id}`);
    }
  }
}
