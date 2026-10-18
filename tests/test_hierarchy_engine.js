const fs = require('fs');

global.window = global;
global.document = {
  addEventListener: () => {},
  dispatchEvent: () => {},
  getElementById: () => null,
  querySelectorAll: () => []
};
global.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {} };

require('../js/app.js');
require('../js/store.js');

console.log('Testing master data users:');
const users = global.DEMO_DATA.users;
console.log('Total users:', users.length);

const allLines = global.DEMO_DATA.productLines;
console.log('Lines:', allLines.map(l => ({ id: l.id, name: l.name })));

const getUserLines = window.getUserLines;

// Test helper:
function belongsToLine(u, targetLineId) {
  if (!targetLineId || targetLineId === 'all') return true;
  const uLines = getUserLines(u.id).map(l => l.id);
  return uLines.includes(targetLineId);
}

// 1. Check LMs under Line 1 and Line 2
const lms = users.filter(u => ['line_manager', 'lm'].includes(window.normalizeRole(u.role)));
console.log('\nAll LMs:', lms.map(u => ({ id: u.id, name: u.name, lines: getUserLines(u.id).map(l => l.name) })));

const line1Lms = lms.filter(u => belongsToLine(u, 'line_1790626000001'));
console.log('Line 1 LMs:', line1Lms.map(u => u.name));

const line2Lms = lms.filter(u => belongsToLine(u, 'line_1790626000002'));
console.log('Line 2 LMs:', line2Lms.map(u => u.name));

// 2. Check DMs under Line 1 and Line 2
const dms = users.filter(u => ['district_manager', 'dm'].includes(window.normalizeRole(u.role)));
console.log('\nAll DMs:', dms.map(u => ({ id: u.id, name: u.name, mgr: u.managerId, lines: getUserLines(u.id).map(l => l.name) })));

// 3. Multi-line DM Amir Ayoup Reps:
const amir = users.find(u => u.name.includes('Amir'));
console.log('\nAmir Ayoup ID:', amir.id);
const amirReps = users.filter(u => u.managerId === amir.id);
console.log('Amir total reps:', amirReps.map(u => ({ name: u.name, lines: getUserLines(u.id).map(l => l.name) })));

const amirLine1Reps = amirReps.filter(u => belongsToLine(u, 'line_1790626000001'));
console.log('Amir Line 1 Reps:', amirLine1Reps.map(u => u.name));

const amirLine2Reps = amirReps.filter(u => belongsToLine(u, 'line_1790626000002'));
console.log('Amir Line 2 Reps:', amirLine2Reps.map(u => u.name));
