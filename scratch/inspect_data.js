const fs = require('fs');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const vm = require('vm');
const ctx = {
  window: { addEventListener: () => {} },
  document: { addEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} },
  console
};
vm.createContext(ctx);
vm.runInContext(appContent, ctx);

const DEMO_DATA = ctx.window.DEMO_DATA;
console.log('DEMO_DATA areas:');
DEMO_DATA.areas.forEach(a => console.log(a.id, a.name, a.code, 'line:', a.lineId, 'rep:', a.repId));

console.log('\nDEMO_DATA doctors:');
DEMO_DATA.doctors.forEach(d => console.log(d.id, d.name, 'areaId:', d.areaId, 'area:', d.area, 'repId:', d.repId));
