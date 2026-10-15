const fs = require('fs');

const app = fs.readFileSync('js/app.js', 'utf8');
const dataStr = app.substring(app.indexOf('DEFAULT_DEMO_DATA ='), app.indexOf('loadDataFromStorage'));
const jsonStr = dataStr.substring(dataStr.indexOf('{'), dataStr.lastIndexOf('};') + 1);
const data = eval('(' + jsonStr + ')');

console.log('--- Checking relations to rep1 and rep2 in DEFAULT_DEMO_DATA ---');
console.log('Areas assigned to rep1:', (data.areas || []).filter(a => a.repId === 'rep1').map(a => a.name));
console.log('Areas assigned to rep2:', (data.areas || []).filter(a => a.repId === 'rep2').map(a => a.name));
console.log('Doctors assigned to rep1:', (data.doctors || []).filter(d => d.repId === 'rep1').length);
console.log('Doctors assigned to rep2:', (data.doctors || []).filter(d => d.repId === 'rep2').length);
console.log('Visits assigned to rep1:', (data.visits || []).filter(v => v.repId === 'rep1').length);
console.log('Visits assigned to rep2:', (data.visits || []).filter(v => v.repId === 'rep2').length);
console.log('Targets assigned to rep1:', (data.targets || []).filter(t => t.repId === 'rep1').length);
console.log('Targets assigned to rep2:', (data.targets || []).filter(t => t.repId === 'rep2').length);

console.log('\n--- Existing New Reps ---');
const newReps = (data.users || []).filter(u => u.id.startsWith('u'));
newReps.forEach(r => console.log(`${r.id} (${r.employeeCode}) - ${r.name} - Line: ${r.lineId}`));
