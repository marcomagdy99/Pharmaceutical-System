const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const demoMatch = appContent.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
const demoData = eval('(' + demoMatch[1] + ')');

console.log('=== USERS SUMMARY IN DEFAULT_DEMO_DATA ===');
demoData.users.forEach((u, i) => {
  console.log(`${i+1}. [${u.id}] ${u.name} (${u.role}) -> line: ${u.lineId}, lines: ${JSON.stringify(u.lineIds)}, area: ${u.areaId}`);
});
