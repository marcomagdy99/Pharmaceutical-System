const fs = require('fs');

global.window = global;
global.document = { addEventListener: () => {}, dispatchEvent: () => {} };
global.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {} };
require('../js/app.js');
require('../js/store.js');

const users = global.DEMO_DATA.users;
console.log('Total users:', users.length);
users.forEach(u => {
  if (['BU', 'LM', 'DM'].includes(u.role)) {
    console.log(`${u.id} - ${u.name} (${u.role}) - managerId: ${u.managerId} - lineId: ${u.lineId} - lineIds: ${JSON.stringify(u.lineIds)}`);
  }
});

console.log('\n--- Product Lines ---');
console.log(global.DEMO_DATA.productLines.map(l => ({ id: l.id, name: l.name })));

console.log('\n--- Areas ---');
console.log(global.DEMO_DATA.areas.slice(0, 5));
