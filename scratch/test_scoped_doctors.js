const fs = require('fs');
const vm = require('vm');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const docReportContent = fs.readFileSync('js/doctors-report.js', 'utf8');

const elements = {
  doctorRepSelect: { value: 'vacant:area1' },
  reportLineFilter: { value: 'all' },
  doctorSearchInput: { value: '' },
  doctorSpecialtyFilter: { value: 'all' },
  doctorClassFilter: { value: 'all' }
};

const ctx = {
  window: { addEventListener: () => {} },
  document: {
    addEventListener: () => {},
    getElementById: (id) => elements[id] || null
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  console
};

vm.createContext(ctx);
vm.runInContext(appContent, ctx);
vm.runInContext(docReportContent, ctx);

ctx.currentUser = ctx.window.DEMO_DATA.users[0]; // Admin
ctx.window.checkAuth = () => ctx.currentUser;

console.log('Testing getScopedDoctors with vacant:area1:');
const docsArea1 = ctx.getScopedDoctors(true);
console.log('Results count for vacant:area1:', docsArea1.length);
docsArea1.forEach(d => console.log(' - ', d.id, d.name, d.areaId, d.repId));

elements.doctorRepSelect.value = 'vacant:area3';
console.log('\nTesting getScopedDoctors with vacant:area3:');
const docsArea3 = ctx.getScopedDoctors(true);
console.log('Results count for vacant:area3:', docsArea3.length);
docsArea3.forEach(d => console.log(' - ', d.id, d.name, d.areaId, d.repId));
