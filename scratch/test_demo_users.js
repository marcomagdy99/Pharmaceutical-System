const fs = require('fs');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Find users array in DEFAULT_DEMO_DATA
const usersMatch = appJs.match(/users:\s*\[([\s\S]*?)\n\s*\],\s*\n\s*productLines:/);
if (usersMatch) {
  const users = eval('[' + usersMatch[1] + ']');
  console.log('Total users:', users.length);
  users.forEach((u) => {
    console.log(`id: ${u.id}, name: ${u.name}, role: ${u.role}, mgr: ${u.managerId}, line: ${u.lineId}, lines: ${JSON.stringify(u.lineIds)}`);
  });
} else {
  console.log('Could not match users array');
}
