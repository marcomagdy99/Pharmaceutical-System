const fs = require('fs');

const app = fs.readFileSync('js/app.js', 'utf8');
const dataStr = app.substring(app.indexOf('DEFAULT_DEMO_DATA ='), app.indexOf('loadDataFromStorage'));
const jsonStr = dataStr.substring(dataStr.indexOf('{'), dataStr.lastIndexOf('};') + 1);
const data = eval('(' + jsonStr + ')');

console.log('=== All Reps in DEFAULT_DEMO_DATA ===');
const reps = data.users.filter(u => u.role === 'medical_rep' || u.role === 'rep');
reps.forEach(r => {
  console.log(`${r.id} | ${r.employeeCode} | ${r.name} | ${r.email}`);
});

console.log('\nAreas for rep1 old check:');
console.log(data.areas.map(a => `${a.name}: repId=${a.repId}`));
