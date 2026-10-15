const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const demoMatch = appContent.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
const demoData = eval('(' + demoMatch[1] + ')');

console.log('productLines in DEFAULT_DEMO_DATA:');
console.log(JSON.stringify(demoData.productLines, null, 2));

console.log('\npharmacies in DEFAULT_DEMO_DATA:');
console.log(JSON.stringify(demoData.pharmacies, null, 2));
