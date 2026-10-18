// Mock window and document
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

require("../js/app.js");
require("../js/store.js");
require("../js/activities-core.js");

const allAreas = [
  { id: 'area_1', name: 'Dokki', lineId: 'line1', repId: 'rep1' },
  { id: 'area_2', name: 'Mohandessin', lineId: 'line1', repId: 'rep1' },
  { id: 'area_3', name: 'Nasr City', lineId: 'line2', repId: 'rep1' },
  { id: 'area_4', name: 'Maadi', lineId: 'line1', repId: 'rep99' }
];
window.DEMO_DATA.areas = allAreas;

const repUser = {
  id: 'rep1',
  role: 'medical_rep',
  lineId: 'line1',
  areaId: 'area_1',
  areaIds: ['area_1', 'area_2', 'area_3']
};

const areasLine1 = window.ActivitiesCore.getAreasForLine('line1', repUser);
console.log("Areas returned for rep1 in line1:", areasLine1.map(a => a.id));

const pass1 = areasLine1.length === 2 && areasLine1.some(a => a.id === 'area_1') && areasLine1.some(a => a.id === 'area_2');
console.log("Multi-area test pass:", pass1);

const areasLine2 = window.ActivitiesCore.getAreasForLine('line2', repUser);
console.log("Areas returned for rep1 in line2:", areasLine2.map(a => a.id));
const pass2 = areasLine2.length === 1 && areasLine2[0].id === 'area_3';
console.log("Line2 area test pass:", pass2);

if (pass1 && pass2) {
  console.log("ALL AREA POPULATION TESTS PASSED!");
} else {
  console.error("TEST FAILED!");
  process.exit(1);
}
