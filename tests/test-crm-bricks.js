const assert = require('assert');
const path = require('path');

console.log('--- Testing Comprehensive Nationwide CRM & IMS Bricks Hierarchy Suite (All 152 Bricks) ---');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => true,
};
global.CustomEvent = function() {};

// 1. Load egypt-bricks-data.js
require('../js/egypt-bricks-data.js');
const crmBricks = window.CRM_IMS_MASTER_BRICKS;
assert(Array.isArray(crmBricks), 'CRM_IMS_MASTER_BRICKS should be an array');
assert.strictEqual(crmBricks.length, 152, 'Should contain exactly 152 CRM/IMS bricks nationwide');

// Verify sector distribution across all 16 regional sectors
const cairo = crmBricks.filter(b => b.sector === 'Cairo');
const giza = crmBricks.filter(b => b.sector === 'Giza');
const qalyubia = crmBricks.filter(b => b.sector === 'Qalyubia');
const alex = crmBricks.filter(b => b.sector === 'Alex');
const beheira = crmBricks.filter(b => b.sector === 'Beheira');
const kafr = crmBricks.filter(b => b.sector === 'KafrElSheikh');
const gharbia = crmBricks.filter(b => b.sector === 'Gharbia');
const menoufia = crmBricks.filter(b => b.sector === 'Menoufia');
const dakahlia = crmBricks.filter(b => b.sector === 'Dakahlia');
const sharkia = crmBricks.filter(b => b.sector === 'Sharkia');
const canal = crmBricks.filter(b => b.sector === 'Canal');
const beniSuef = crmBricks.filter(b => b.sector === 'BeniSuef');
const minya = crmBricks.filter(b => b.sector === 'Minya');
const assiut = crmBricks.filter(b => b.sector === 'Assiut');
const sohag = crmBricks.filter(b => b.sector === 'Sohag');
const upperSouth = crmBricks.filter(b => b.sector === 'UpperSouth');

assert.strictEqual(cairo.length, 37, 'Cairo should have 37 bricks (B01-B37)');
assert.strictEqual(giza.length, 19, 'Giza should have 19 bricks (B38-B56)');
assert.strictEqual(qalyubia.length, 6, 'Qalyubia should have 6 bricks (B57-B62)');
assert.strictEqual(alex.length, 20, 'Alexandria & Matrouh should have 20 bricks (B63-B82)');
assert.strictEqual(beheira.length, 5, 'Beheira should have 5 bricks (B83-B87)');
assert.strictEqual(kafr.length, 4, 'Kafr El Sheikh should have 4 bricks (B88-B91)');
assert.strictEqual(gharbia.length, 7, 'Gharbia should have 7 bricks (B92-B98)');
assert.strictEqual(menoufia.length, 4, 'Menoufia should have 4 bricks (B99-B102)');
assert.strictEqual(dakahlia.length, 9, 'Dakahlia & Damietta should have 9 bricks (B103-B111)');
assert.strictEqual(sharkia.length, 6, 'Sharkia should have 6 bricks (B112-B117)');
assert.strictEqual(canal.length, 7, 'Canal & Sinai should have 7 bricks (B118-B124)');
assert.strictEqual(beniSuef.length, 5, 'Beni Suef & Fayoum should have 5 bricks (B125-B129)');
assert.strictEqual(minya.length, 6, 'Minya should have 6 bricks (B130-B135)');
assert.strictEqual(assiut.length, 5, 'Assiut & New Valley should have 5 bricks (B136-B140)');
assert.strictEqual(sohag.length, 4, 'Sohag should have 4 bricks (B141-B144)');
assert.strictEqual(upperSouth.length, 8, 'Qena, Luxor, Red Sea & Aswan should have 8 bricks (B145-B152)');
console.log('✓ Test 1: All 152 CRM/IMS Bricks parsed with exact sector counts across all 16 sectors');

// Verify contiguous IDs from B01 to B152
for (let i = 1; i <= 152; i++) {
  const expectedId = 'B' + (i < 10 ? '0' + i : i);
  const found = crmBricks.find(b => b.id === expectedId);
  assert(found, `Missing expected brick ID: ${expectedId}`);
}
console.log('✓ Test 2: Contiguous and complete IDs from B01 through B152 verified');

// Verify metadata completeness
crmBricks.forEach(b => {
  assert(b.id, `Brick should have id`);
  assert(b.crmCode, `Brick ${b.id} should have crmCode`);
  assert(b.imsCode, `Brick ${b.id} should have imsCode`);
  assert(b.imsName, `Brick ${b.id} should have imsName`);
  assert(b.scopeText && b.scopeText.length > 0, `Brick ${b.id} should have scopeText`);
  assert(Array.isArray(b.subAreas) && b.subAreas.length > 0, `Brick ${b.id} should have subAreas`);
});
console.log('✓ Test 3: All 152 bricks have complete metadata and actual scopes');

// 2. Disambiguation Tests
// A. "المسلة" (Matareya Cairo B08 vs Fayoum B125)
const mosalla = crmBricks.filter(b => b.scopeText.includes('المسلة'));
assert.strictEqual(mosalla.length, 2, 'المسلة should match both Cairo Matareya and Fayoum City');
assert(mosalla.some(b => b.id === 'B08' && b.sector === 'Cairo'), 'Should include Matareya B08');
assert(mosalla.some(b => b.id === 'B125' && b.sector === 'BeniSuef'), 'Should include Fayoum B125');
console.log('✓ Test 4: Disambiguation for المسلة (Cairo B08 vs Fayoum B125) pass');

// B. "فيصل" (Faisal Giza B46-B48 vs Faisal Suez B124)
const faisal = crmBricks.filter(b => b.scopeText.includes('فيصل') || b.crmCode.includes('Faisal'));
assert(faisal.some(b => b.sector === 'Giza'), 'Should match Giza Faisal');
assert(faisal.some(b => b.id === 'B124' && b.sector === 'Canal'), 'Should match Suez Faisal B124');
console.log('✓ Test 5: Disambiguation for فيصل (Giza vs Suez) pass');

// C. "الأربعين" (Suez B123 vs Assiut B137)
const arbaeen = crmBricks.filter(b => b.scopeText.includes('الأربعين'));
assert(arbaeen.some(b => b.id === 'B123' && b.sector === 'Canal'), 'Should match Suez B123');
assert(arbaeen.some(b => b.id === 'B137' && b.sector === 'Assiut'), 'Should match Assiut B137');
console.log('✓ Test 6: Disambiguation for الأربعين (Suez vs Assiut) pass');

// D. "المطرية" (Cairo B08 vs Dakahlia B109)
const matareya = crmBricks.filter(b => b.scopeText.includes('المطرية') || b.imsName.includes('Matareya'));
assert(matareya.some(b => b.id === 'B08' && b.sector === 'Cairo'), 'Should include Cairo Matareya (B08)');
assert(matareya.some(b => b.id === 'B109' && b.sector === 'Dakahlia'), 'Should include Dakahlia Matareya (B109)');
console.log('✓ Test 7: Disambiguation for المطرية (Cairo B08 vs Dakahlia B109) pass');

// 3. Test getMasterBricks() and findMasterBrickByName()
const allMaster = window.getMasterBricks();
assert(allMaster.length > 1900, 'getMasterBricks should return CRM bricks + remaining master bricks');
assert.strictEqual(allMaster[0].id, 'B01', 'First brick should be B01');

const findB148 = window.findMasterBrickByName('B148');
assert(findB148 && findB148.imsName === 'Red Sea', 'Should find Red Sea by B148');
const findAswan = window.findMasterBrickByName('B151');
assert(findAswan && findAswan.imsName.includes('Aswan'), 'Should find Aswan City by B151');
console.log('✓ Test 8: getMasterBricks & findMasterBrickByName pass across all 152 bricks');

// 4. Test Store Hierarchical Matching across Canal & Upper Egypt
window.DEMO_DATA = {
  users: [],
  areas: [
    {
      id: 'area_fayoum',
      name: 'Fayoum City Territory',
      lineId: 'line1',
      bricks: ['[B125] Fayoum - Brick 1 (Fayoum City)'],
      repId: 'u_rep_fayoum'
    },
    {
      id: 'area_suez',
      name: 'Suez 1 Territory',
      lineId: 'line1',
      bricks: ['[B123] Suez / S. Sinai - Brick 1 (Suez 1)'],
      repId: 'u_rep_suez'
    },
    {
      id: 'area_redsea',
      name: 'Red Sea Coastal',
      lineId: 'line1',
      bricks: ['[B148] Quena I / Red Sea - Brick 4 (Red Sea)'],
      repId: 'u_rep_redsea'
    },
    {
      id: 'area_aswan',
      name: 'Aswan Central',
      lineId: 'line1',
      bricks: ['[B151] Aswan - Brick 1 (Aswan City)'],
      repId: 'u_rep_aswan'
    }
  ],
  doctors: [],
  pharmacies: []
};

require('../js/store.js');
const store = window.store;
assert(store && store.areas, 'store.areas should be defined');

// Test matching Fayoum by sub-area street name
assert.strictEqual(store.areas._brickMatchesText('[B125] Fayoum - Brick 1 (Fayoum City)', 'المسلة'), true, 'Should match subArea المسلة in Fayoum 1');
assert.strictEqual(store.areas._brickMatchesText('[B125] Fayoum - Brick 1 (Fayoum City)', 'سنورس'), false, 'سنورس is in Fayoum 2 (B126), should not match Fayoum 1');

// Test matching Suez by sub-area street name
assert.strictEqual(store.areas._brickMatchesText('[B123] Suez / S. Sinai - Brick 1 (Suez 1)', 'الأربعين'), true, 'Should match subArea الأربعين in Suez 1');

// Test matching Red Sea by city name
assert.strictEqual(store.areas._brickMatchesText('[B148] Quena I / Red Sea - Brick 4 (Red Sea)', 'الغردقة'), true, 'Should match الغردقة in Red Sea');
assert.strictEqual(store.areas._brickMatchesText('[B148] Quena I / Red Sea - Brick 4 (Red Sea)', 'سفاجا'), true, 'Should match سفاجا in Red Sea');

// Test matching Aswan by street name
assert.strictEqual(store.areas._brickMatchesText('[B151] Aswan - Brick 1 (Aswan City)', 'السوق السياحي'), true, 'Should match السوق السياحي in Aswan');

// Test findByBrickName for Canal & Upper Egypt
const foundFayoumByStreet = store.areas.findByBrickName('المسلة');
assert(foundFayoumByStreet && foundFayoumByStreet.id === 'area_fayoum', 'findByBrickName(المسلة) should resolve to area_fayoum');

const foundRedSeaByCity = store.areas.findByBrickName('الغردقة');
assert(foundRedSeaByCity && foundRedSeaByCity.id === 'area_redsea', 'findByBrickName(الغردقة) should resolve to area_redsea');

const foundAswanByStreet = store.areas.findByBrickName('السوق السياحي');
assert(foundAswanByStreet && foundAswanByStreet.id === 'area_aswan', 'findByBrickName(السوق السياحي) should resolve to area_aswan');

console.log('✓ Test 9: Store hierarchical matching and distributor resolution pass across all provinces nationwide');

console.log('=== All 152 CRM & IMS Bricks Hierarchy Tests PASSED (9/9)! ===');
