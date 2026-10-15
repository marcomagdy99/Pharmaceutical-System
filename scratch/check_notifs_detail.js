const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const demoMatch = appContent.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
const demoData = eval('(' + demoMatch[1] + ')');

console.log('notifications:', JSON.stringify(demoData.notifications, null, 2));
console.log('specialties:', JSON.stringify(demoData.specialties, null, 2));
