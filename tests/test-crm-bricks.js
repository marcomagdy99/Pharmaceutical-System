const assert = require('assert');
const path = require('path');

console.log('--- Testing CRM & IMS Bricks Hierarchy Suite ---');

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
assert.strictEqual(crmBricks.length, 62, 'Should contain exactly 62 CRM/IMS bricks');

// Verify sector distribution
const cairo = crmBricks.filter(b => b.sector === 'Cairo');
const giza = crmBricks.filter(b => b.sector === 'Giza');
const qalyubia = crmBricks.filter(b => b.sector === 'Qalyubia');
assert.strictEqual(cairo.length, 37, 'Cairo should have 37 bricks (B01-B37)');
assert.strictEqual(giza.length, 19, 'Giza should have 19 bricks (B38-B56)');
assert.strictEqual(qalyubia.length, 6, 'Qalyubia should have 6 bricks (B57-B62)');
console.log('✓ Test 1: 62 CRM/IMS Bricks parsed with exact sector counts');

// Verify scopeText and subAreas on all bricks
crmBricks.forEach(b => {
  assert(b.id, `Brick should have id`);
  assert(b.crmCode, `Brick ${b.id} should have crmCode`);
  assert(b.imsCode, `Brick ${b.id} should have imsCode`);
  assert(b.imsName, `Brick ${b.id} should have imsName`);
  assert(b.scopeText && b.scopeText.length > 0, `Brick ${b.id} should have scopeText`);
  assert(Array.isArray(b.subAreas) && b.subAreas.length > 0, `Brick ${b.id} should have subAreas`);
});
console.log('✓ Test 2: All 62 bricks have complete metadata and actual scopes');

// 2. Test Disambiguation
// A. "المطبعة" (Matbaa) in Haram vs Faisal
const matbaa = crmBricks.filter(b => b.scopeText.includes('المطبعة'));
assert.strictEqual(matbaa.length, 2, 'المطبعة should match both Haram and Faisal');
assert(matbaa.some(b => b.id === 'B43' && b.crmCode.includes('Haram')), 'Should include Haram 1');
assert(matbaa.some(b => b.id === 'B46' && b.crmCode.includes('Faisal')), 'Should include Faisal 1');
console.log('✓ Test 3: Disambiguation for المطبعة (Haram vs Faisal) pass');

// B. "جسر السويس" (Gesr El Suez) across 3 distinct bricks
const gesr = crmBricks.filter(b => b.scopeText.includes('جسر السويس'));
assert.strictEqual(gesr.length, 3, 'جسر السويس should match 3 bricks (start, middle, end)');
assert(gesr.some(b => b.id === 'B01'), 'Should match Heliopolis 1 (بداية)');
assert(gesr.some(b => b.id === 'B06'), 'Should match Ain Shams 1 (المنتصف)');
assert(gesr.some(b => b.id === 'B10'), 'Should match El Salam (نهاية)');
console.log('✓ Test 4: Disambiguation for جسر السويس across 3 bricks pass');

// C. "عزبة النخل" (Ezbet El Nakhl) across Matareya vs Marg
const nakhl = crmBricks.filter(b => b.scopeText.includes('عزبة النخل'));
assert.strictEqual(nakhl.length, 2, 'عزبة النخل should match Matareya and Marg');
assert(nakhl.some(b => b.id === 'B08'), 'Should match B08 El Matareya');
assert(nakhl.some(b => b.id === 'B09'), 'Should match B09 El Marg');
console.log('✓ Test 5: Disambiguation for عزبة النخل (Matareya vs Marg) pass');

// 3. Test getMasterBricks() and findMasterBrickByName()
const allMaster = window.getMasterBricks();
assert(allMaster.length > 1900, 'getMasterBricks should return CRM bricks + remaining master bricks');
assert(allMaster[0].isCrmGroup === true, 'First brick should be CRM grouped');
assert.strictEqual(allMaster[0].id, 'B01', 'First brick should be B01');

const findB43 = window.findMasterBrickByName('B43');
assert(findB43 && findB43.id === 'B43', 'Should find brick by IMS code B43');
const findHaram = window.findMasterBrickByName('Haram - Brick 1');
assert(findHaram && findHaram.id === 'B43', 'Should find brick by CRM code');
console.log('✓ Test 6: getMasterBricks & findMasterBrickByName pass');

// 4. Test Store Hierarchical Matching
// Mock DEMO_DATA for store
window.DEMO_DATA = {
  users: [],
  areas: [
    {
      id: 'area_haram',
      name: 'Haram Territory',
      lineId: 'line1',
      bricks: ['[B43] Haram - Brick 1 (El Haram 1)'],
      repId: 'u_rep_haram'
    },
    {
      id: 'area_faisal',
      name: 'Faisal Territory',
      lineId: 'line1',
      bricks: ['[B46] Faisal - Brick 1 (Faisal 1)'],
      repId: 'u_rep_faisal'
    }
  ],
  doctors: [],
  pharmacies: []
};

require('../js/store.js');
const store = window.store;
assert(store && store.areas, 'store.areas should be defined');

// Test matching by IMS Code
assert.strictEqual(store.areas._brickMatchesText('[B43] Haram - Brick 1 (El Haram 1)', 'B43'), true, 'Should match exact IMS code B43');
assert.strictEqual(store.areas._brickMatchesText('[B43] Haram - Brick 1 (El Haram 1)', 'b43'), true, 'Should match case-insensitive b43');

// Test matching by sub-area street name
assert.strictEqual(store.areas._brickMatchesText('[B43] Haram - Brick 1 (El Haram 1)', 'مدكور'), true, 'Should match subArea مدكور');
assert.strictEqual(store.areas._brickMatchesText('[B43] Haram - Brick 1 (El Haram 1)', 'نصر الدين'), true, 'Should match subArea نصر الدين');

// Test matching by street name for Faisal
assert.strictEqual(store.areas._brickMatchesText('[B46] Faisal - Brick 1 (Faisal 1)', 'العشرين'), true, 'Should match subArea العشرين in Faisal');
assert.strictEqual(store.areas._brickMatchesText('[B46] Faisal - Brick 1 (Faisal 1)', 'كفر طهرمس'), false, 'كفر طهرمس is in Faisal 2 (B47), should not match Faisal 1');

// Test findByBrickName
const foundHaramByStreet = store.areas.findByBrickName('مدكور');
assert(foundHaramByStreet && foundHaramByStreet.id === 'area_haram', 'findByBrickName(مدكور) should resolve to area_haram');

const foundFaisalByCode = store.areas.findByBrickName('B46');
assert(foundFaisalByCode && foundFaisalByCode.id === 'area_faisal', 'findByBrickName(B46) should resolve to area_faisal');

console.log('✓ Test 7: Store hierarchical matching and distributor resolution pass');

console.log('=== All CRM & IMS Bricks Hierarchy Tests PASSED (7/7)! ===');
