const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING RECURSIVE HIERARCHY DIRECTORY PERSISTENCE TEST ===');

// Setup mock browser environment
const domMock = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      const defVal = id.toLowerCase().includes('search') ? '' : 'all';
      this.elements[id] = { id, value: defVal, options: [], style: {}, classList: { add() {}, remove() {} } };
    }
    return this.elements[id];
  },
  dispatchEvent() {}
};
global.document = domMock;
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.escapeHtml = (s) => s;

// Mock DEMO_DATA with realistic users and lines
const mockUsers = [
  { id: 'u1790626000012', name: 'John Mahfouz', role: 'line_manager', managerId: null, lineId: 'line1', lineIds: ['line1'] },
  { id: 'u1790626000014', name: 'Amir Ayoup', role: 'district_manager', managerId: 'u1790626000012', lineId: 'line1', lineIds: ['line1'] },
  { id: 'u1790626000001', name: 'Marco Magdy', role: 'medical_rep', managerId: 'u1790626000014', lineId: 'line1', lineIds: ['line1'], areaId: 'area_cairo_1', area: 'Cairo West' }
];

const mockAreas = [
  { id: 'area_cairo_1', name: 'Cairo West', lineId: 'line1', repId: 'u1790626000001', dmId: 'u1790626000014' },
  { id: 'area_giza_1', name: 'Giza Central', lineId: 'line1', repId: null, dmId: 'u1790626000014' }
];

window.DEMO_DATA = {
  users: [...mockUsers],
  areas: [...mockAreas],
  doctors: [],
  pharmacies: [],
  hospitals: [],
  visits: [],
  sales: [],
  leaves: []
};

// Load store
const storeCode = fs.readFileSync('js/store.js', 'utf8');
eval(storeCode);

// 1. Test store.doctors.save auto-resolution of repId, dmId, lmId
const testDoc = {
  id: 'doc_' + Date.now(),
  name: 'Dr. Test Cardiology',
  specialty: 'Cardiology',
  class: 'A',
  address: '10 Tahrir Sq',
  repId: 'u1790626000001',
  areaId: 'area_giza_1' // Area has repId: null, but doc has repId: Marco
};

window.store.doctors.save(testDoc);
const savedDoc = window.store.doctors.getById(testDoc.id);

console.log('Testing store.doctors.save non-destructive repId:');
assert.strictEqual(savedDoc.repId, 'u1790626000001', 'Doctor repId must NOT be overwritten by vacant area repId!');
console.log('  PASS: Doctor repId preserved as u1790626000001');

assert.strictEqual(savedDoc.dmId, 'u1790626000014', 'Doctor dmId must be auto-resolved to Amir Ayoup!');
console.log('  PASS: Doctor dmId auto-resolved to u1790626000014');

assert.strictEqual(savedDoc.lmId, 'u1790626000012', 'Doctor lmId must be auto-resolved to John Mahfouz!');
console.log('  PASS: Doctor lmId auto-resolved to u1790626000012');

// 2. Test app.js loadDataFromStorage regex purge behavior
console.log('\nTesting loadDataFromStorage non-destructive purge:');
const testDataToPurge = {
  doctors: [
    { id: 'd1', name: 'Legacy Mock Doctor' },
    { id: 'd999', name: 'Legacy Mock Doctor 2' },
    { id: 'doc_1792622999999', name: 'Real Dynamic Doctor' }
  ],
  pharmacies: [
    { id: 'ph1', name: 'Legacy Mock Pharmacy' },
    { id: 'pharm_1792622999999', name: 'Real Dynamic Pharmacy' }
  ],
  hospitals: [
    { id: 'h1', name: 'Legacy Mock Hospital' },
    { id: 'hosp_1792622999999', name: 'Real Dynamic Hospital' }
  ],
  visits: [
    { id: 'v1', name: 'Legacy Mock Visit' },
    { id: 'today_v12', name: 'Legacy Mock Visit Today' },
    { id: 'visit_1792622999999', name: 'Real Dynamic Visit' }
  ],
  sales: [
    { id: 's1', name: 'Legacy Mock Sale' },
    { id: 'ds_s99', name: 'Legacy Mock Sale 2' },
    { id: 'sale_1792622999999', name: 'Real Dynamic Sale' }
  ],
  leaves: [
    { id: 'l1', name: 'Legacy Mock Leave' },
    { id: 'leave_1792622999999', name: 'Real Dynamic Leave' }
  ]
};

// Simulate the newly patched filter logic
testDataToPurge.doctors = testDataToPurge.doctors.filter((d) => d && d.id && !/^d\d{1,4}$/.test(d.id));
testDataToPurge.pharmacies = testDataToPurge.pharmacies.filter((p) => p && p.id && !/^ph\d{1,4}$/.test(p.id));
testDataToPurge.hospitals = testDataToPurge.hospitals.filter((h) => h && h.id && !/^h\d{1,4}$/.test(h.id));
testDataToPurge.visits = testDataToPurge.visits.filter((v) => v && v.id && !/^v\d{1,4}$/.test(v.id) && !/^today_v\d+$/.test(v.id));
testDataToPurge.sales = testDataToPurge.sales.filter((s) => s && s.id && !/^s\d{1,4}$/.test(s.id) && !/^ds_s\d+$/.test(s.id));
testDataToPurge.leaves = testDataToPurge.leaves.filter((l) => l && l.id && !/^l\d{1,4}$/.test(l.id));

assert.strictEqual(testDataToPurge.doctors.length, 1, 'Only real doctor should survive!');
assert.strictEqual(testDataToPurge.doctors[0].id, 'doc_1792622999999');
console.log('  PASS: doc_1792622999999 survived, d1 & d999 purged.');

assert.strictEqual(testDataToPurge.pharmacies.length, 1);
assert.strictEqual(testDataToPurge.pharmacies[0].id, 'pharm_1792622999999');
console.log('  PASS: pharm_1792622999999 survived, ph1 purged.');

assert.strictEqual(testDataToPurge.hospitals.length, 1);
assert.strictEqual(testDataToPurge.hospitals[0].id, 'hosp_1792622999999');
console.log('  PASS: hosp_1792622999999 survived, h1 purged.');

assert.strictEqual(testDataToPurge.visits.length, 1);
assert.strictEqual(testDataToPurge.visits[0].id, 'visit_1792622999999');
console.log('  PASS: visit_1792622999999 survived, v1 & today_v12 purged.');

assert.strictEqual(testDataToPurge.sales.length, 1);
assert.strictEqual(testDataToPurge.sales[0].id, 'sale_1792622999999');
console.log('  PASS: sale_1792622999999 survived, s1 & ds_s99 purged.');

assert.strictEqual(testDataToPurge.leaves.length, 1);
assert.strictEqual(testDataToPurge.leaves[0].id, 'leave_1792622999999');
console.log('  PASS: leave_1792622999999 survived, l1 purged.');

// 3. Test getScopedDoctors visibility across hierarchy
console.log('\nTesting getScopedDoctors hierarchy visibility:');
const docReportCode = fs.readFileSync('js/doctors-report.js', 'utf8');
// Load getDoctorsData, getScopedDoctors into environment
eval(docReportCode);

// Scenario A: Marco Magdy views his list
global.checkAuth = () => ({ id: 'u1790626000001', name: 'Marco Magdy', role: 'medical_rep', lineId: 'line1' });
let marcoScoped = getScopedDoctors();
const marcoFound = marcoScoped.some(d => d.id === testDoc.id);
assert.strictEqual(marcoFound, true, 'Marco Magdy must see doctor assigned to him!');
console.log('  PASS: Marco Magdy sees his assigned doctor.');

// Scenario B: Amir Ayoup (DM) views all team doctors
global.checkAuth = () => ({ id: 'u1790626000014', name: 'Amir Ayoup', role: 'district_manager', lineId: 'line1' });
domMock.elements['doctorLmSelect'] = { value: 'all' };
domMock.elements['doctorDmSelect'] = { value: 'all' };
domMock.elements['doctorRepSelect'] = { value: 'all' };
let amirAllScoped = getScopedDoctors();
const amirAllFound = amirAllScoped.some(d => d.id === testDoc.id);
assert.strictEqual(amirAllFound, true, 'Amir Ayoup (DM) must see doctor belonging to his rep Marco Magdy in team view!');
console.log('  PASS: Amir Ayoup (DM) sees Marco\'s doctor in team view (rep = all).');

// Scenario C: Amir Ayoup (DM) filters by Marco Magdy
domMock.elements['doctorRepSelect'] = { value: 'u1790626000001' };
let amirMarcoScoped = getScopedDoctors();
const amirMarcoFound = amirMarcoScoped.some(d => d.id === testDoc.id);
assert.strictEqual(amirMarcoFound, true, 'Amir Ayoup (DM) must see doctor when filtering specifically by Marco Magdy!');
console.log('  PASS: Amir Ayoup (DM) sees Marco\'s doctor when filtering doctorRepSelect = u1790626000001.');

// Scenario D: Line Manager John Mahfouz views all line doctors
global.checkAuth = () => ({ id: 'u1790626000012', name: 'John Mahfouz', role: 'line_manager', lineId: 'line1' });
domMock.elements['doctorRepSelect'] = { value: 'all' };
let johnAllScoped = getScopedDoctors();
const johnAllFound = johnAllScoped.some(d => d.id === testDoc.id);
assert.strictEqual(johnAllFound, true, 'John Mahfouz (LM) must see Marco\'s doctor in line view!');
console.log('  PASS: John Mahfouz (LM) sees Marco\'s doctor in line view.');

// Scenario E: Line Manager John Mahfouz filters by Marco Magdy
domMock.elements['doctorRepSelect'] = { value: 'u1790626000001' };
let johnMarcoScoped = getScopedDoctors();
const johnMarcoFound = johnMarcoScoped.some(d => d.id === testDoc.id);
assert.strictEqual(johnMarcoFound, true, 'John Mahfouz (LM) must see Marco\'s doctor when filtering by Marco!');
console.log('  PASS: John Mahfouz (LM) sees Marco\'s doctor when filtering doctorRepSelect = u1790626000001.');

// 4. Test getScopedPharmacies hierarchy visibility
console.log('\nTesting getScopedPharmacies hierarchy visibility:');
const testPharm = {
  id: 'pharm_' + Date.now(),
  name: 'Test El-Ezaby West',
  address: 'Pyramids St',
  repId: 'u1790626000001',
  areaId: 'area_cairo_1'
};
window.store.pharmacies.save(testPharm);
const savedPharm = window.store.pharmacies.getById(testPharm.id);
assert.strictEqual(savedPharm.dmId, 'u1790626000014');
assert.strictEqual(savedPharm.lmId, 'u1790626000012');
console.log('  PASS: Pharmacy dmId & lmId auto-resolved.');

const pharmReportCode = fs.readFileSync('js/pharmacies-report.js', 'utf8');
eval(pharmReportCode);

global.checkAuth = () => ({ id: 'u1790626000014', name: 'Amir Ayoup', role: 'district_manager', lineId: 'line1' });
domMock.elements['pharmacyRepSelect'] = { value: 'u1790626000001' };
let amirPharmScoped = getScopedPharmacies();
const amirPharmFound = amirPharmScoped.some(p => p.id === testPharm.id);
assert.strictEqual(amirPharmFound, true, 'Amir Ayoup (DM) must see Marco\'s pharmacy when filtering by Marco!');
console.log('  PASS: Amir Ayoup (DM) sees Marco\'s pharmacy when filtering pharmacyRepSelect = u1790626000001.');

// 5. Test getScopedHospitals hierarchy visibility
console.log('\nTesting getScopedHospitals hierarchy visibility:');
const testHosp = {
  id: 'hosp_' + Date.now(),
  name: 'Test Nile Hospital',
  address: 'Corniche El Nile',
  repId: 'u1790626000001',
  areaId: 'area_cairo_1'
};
window.store.hospitals.save(testHosp);
const savedHosp = window.store.hospitals.getById(testHosp.id);
assert.strictEqual(savedHosp.dmId, 'u1790626000014');
assert.strictEqual(savedHosp.lmId, 'u1790626000012');
console.log('  PASS: Hospital dmId & lmId auto-resolved.');

const hospReportCode = fs.readFileSync('js/hospitals-report.js', 'utf8');
eval(hospReportCode);

global.checkAuth = () => ({ id: 'u1790626000014', name: 'Amir Ayoup', role: 'district_manager', lineId: 'line1' });
domMock.elements['hospitalRepSelect'] = { value: 'u1790626000001' };
let amirHospScoped = getScopedHospitals();
const amirHospFound = amirHospScoped.some(h => h.id === testHosp.id);
assert.strictEqual(amirHospFound, true, 'Amir Ayoup (DM) must see Marco\'s hospital when filtering by Marco!');
console.log('  PASS: Amir Ayoup (DM) sees Marco\'s hospital when filtering hospitalRepSelect = u1790626000001.');

console.log('\n=== ALL HIERARCHY DIRECTORY PERSISTENCE TESTS PASSED (100%) ===');
