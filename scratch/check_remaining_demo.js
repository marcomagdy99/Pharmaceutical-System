const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const demoMatch = appContent.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
const demoData = eval('(' + demoMatch[1] + ')');

console.log('pharmacyOverrides:', demoData.pharmacyOverrides);
console.log('sales:', demoData.sales);
console.log('leaves:', demoData.leaves);
