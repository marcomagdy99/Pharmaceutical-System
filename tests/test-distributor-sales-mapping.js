const assert = require('assert');
const path = require('path');

console.log('--- Testing Complete Distributor Sales Sheet Mapping Engine ---');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => true
};
global.addEventListener = () => {};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

// 1. Load egypt-bricks-data.js, app.js, store.js
require('../js/egypt-bricks-data.js');

// Setup demo environment simulating real multi-line setup
window.DEMO_DATA = {
  users: [
    { id: 'admin1', name: 'System Admin', role: 'admin' },
    { id: 'lm1', name: 'Line Manager Cairo & Giza', role: 'line_manager', managerId: null },
    { id: 'dm_cairo', name: 'DM Cairo Central', role: 'district_manager', managerId: 'lm1', lineId: 'line1' },
    { id: 'dm_giza', name: 'DM Giza & Haram', role: 'district_manager', managerId: 'lm1', lineId: 'line1' },
    { id: 'dm_derma', name: 'DM Derma Nationwide', role: 'district_manager', managerId: 'lm1', lineId: 'line2' },
    // Medical reps Line 1
    { id: 'rep_giza_line1', name: 'Rep Tarek (Giza Line 1)', role: 'medical_rep', managerId: 'dm_giza', lineId: 'line1' },
    { id: 'rep_shobra_line1', name: 'Rep Marina (Shobra Line 1)', role: 'medical_rep', managerId: 'dm_cairo', lineId: 'line1' },
    // Medical rep Line 2 (Derma) covering both Shobra & Giza
    { id: 'rep_combined_line2', name: 'Rep Hany (Derma Line 2)', role: 'medical_rep', managerId: 'dm_derma', lineId: 'line2' }
  ],
  productLines: [
    {
      id: 'line1',
      name: 'Cardiology Line',
      products: [
        { id: 'prod_cardio_1', name: 'CardioLipid 20mg' },
        { id: 'prod_cardio_2', name: 'CardioPress 5mg' }
      ]
    },
    {
      id: 'line2',
      name: 'Dermatology Line',
      products: [
        { id: 'prod_derma_1', name: 'DermaCure Cream' }
      ]
    }
  ],
  distributors: [
    { id: 'dist_1790626000001', name: 'Ibn Sina Pharma' },
    { id: 'dist_1790626000002', name: 'United Company of Pharmacists (UCP)' },
    { id: 'dist_1790626000003', name: 'Overseas' }
  ],
  areas: [
    {
      id: 'area_l1_giza5_2',
      name: 'Giza V - Brick 2',
      code: 'GZA-B50',
      lineId: 'line1',
      repId: 'rep_giza_line1',
      repName: 'Rep Tarek (Giza Line 1)',
      bricks: ['[B50] Giza V - Brick 2 (Giza 12)'],
      aliases: [
        { distributorId: 'dist_1790626000001', rawText: '20502' },
        { distributorId: 'dist_1790626000002', rawText: 'UCP-GIZA-B50' }
      ]
    },
    {
      id: 'area_l1_shobra1',
      name: 'Shobra - Brick 1',
      code: 'CAI-B13',
      lineId: 'line1',
      repId: 'rep_shobra_line1',
      repName: 'Rep Marina (Shobra Line 1)',
      bricks: ['[B13] Shobra - Brick 1 (Shobra 1)'],
      aliases: [
        { distributorId: 'dist_1790626000001', rawText: '11009' }
      ]
    },
    {
      id: 'area_l2_giza_shobra',
      name: 'Giza & Shobra Combined',
      code: 'DERMA-01',
      lineId: 'line2',
      repId: 'rep_combined_line2',
      repName: 'Rep Hany (Derma Line 2)',
      bricks: [
        '[B50] Giza V - Brick 2 (Giza 12)',
        '[B13] Shobra - Brick 1 (Shobra 1)'
      ],
      aliases: [
        { distributorId: 'dist_1790626000001', rawText: '20502' },
        { distributorId: 'dist_1790626000001', rawText: '11009' }
      ]
    }
  ],
  pharmacyOverrides: [
    {
      id: 'override_ezaby_vip',
      distributorId: 'dist_1790626000001',
      pharmacyCode: 'EZ-999',
      pharmacyName: 'El-Ezaby Roxy VIP',
      areaId: 'area_l1_shobra1',
      lineId: 'line1',
      mode: 'single',
      effectiveScope: 'all_history'
    }
  ],
  distributorSales: []
};

require('../js/store.js');
const store = window.store;

// Test 1: Alias Code Matching (Ibn Sina numeric customer/territory codes e.g. 20502)
console.log('Testing Test 1: Alias code resolution...');
const areaByAlias = store.areas.findByAliasText('dist_1790626000001', '20502');
assert(areaByAlias, '20502 should resolve to an area');
assert.strictEqual(areaByAlias.id, 'area_l1_giza5_2');
console.log('✓ Test 1: Alias code matching passed (20502 -> area_l1_giza5_2)');

// Test 2: Sub-area / Street name matching through CRM Bricks hierarchy
console.log('Testing Test 2: Street & sub-area matching from CRM Bricks...');
const testStreets = [
  { street: 'بولاق الدكرور', expected: 'area_l1_giza5_2' },
  { street: 'صفط اللبن', expected: 'area_l1_giza5_2' },
  { street: 'المعتمدية', expected: 'area_l1_giza5_2' },
  { street: 'روض الفرج', expected: 'area_l1_shobra1' },
  { street: 'دوران شبرا', expected: 'area_l1_shobra1' },
  { street: 'الترعة البولاقية', expected: 'area_l1_shobra1' }
];
testStreets.forEach(ts => {
  const matched = store.areas.findByBrickName(ts.street);
  assert(matched, `Street "${ts.street}" should resolve to an area`);
  assert.strictEqual(matched.id, ts.expected, `Street "${ts.street}" resolved to ${matched.id}, expected ${ts.expected}`);
});
console.log('✓ Test 2: All 6 real street & sub-area names resolved to correct CRM Brick areas');

// Test 3: IMS Brick Code & Name matching
console.log('Testing Test 3: IMS Brick Code & Name matching...');
const testIms = [
  { text: '[B50]', expected: 'area_l1_giza5_2' },
  { text: 'B50', expected: 'area_l1_giza5_2' },
  { text: 'Giza 12', expected: 'area_l1_giza5_2' },
  { text: '[B13]', expected: 'area_l1_shobra1' },
  { text: 'B13', expected: 'area_l1_shobra1' },
  { text: 'Shobra 1', expected: 'area_l1_shobra1' },
  { text: 'Giza V - Brick 2', expected: 'area_l1_giza5_2' },
  { text: 'Shobra - Brick 1', expected: 'area_l1_shobra1' }
];
testIms.forEach(ti => {
  const matched = store.areas.findByBrickName(ti.text);
  assert(matched, `"${ti.text}" should resolve`);
  assert.strictEqual(matched.id, ti.expected, `"${ti.text}" resolved to ${matched.id}, expected ${ti.expected}`);
});
console.log('✓ Test 3: IMS Brick code, name, and CRM code matching passed');

// Test 4: Area Code & Name direct matching via findByNameOrCode
console.log('Testing Test 4: Area Name and Code fallback matching...');
const areaByCode = store.areas.findByNameOrCode('GZA-B50', 'line1');
assert(areaByCode && areaByCode.id === 'area_l1_giza5_2', 'GZA-B50 should resolve to area_l1_giza5_2');
const areaByName = store.areas.findByNameOrCode('Giza V - Brick 2', 'line1');
assert(areaByName && areaByName.id === 'area_l1_giza5_2', 'Giza V - Brick 2 should resolve to area_l1_giza5_2');
console.log('✓ Test 4: Area code & name matching passed');

// Test 5: End-to-End Invoice Sheet Import & Attribution Simulation
console.log('Testing Test 5: Importing simulated distributor invoice batch...');
const simulatedRows = [
  // Row 1: Ibn Sina row with custom alias code 20502 for Cardio product (Line 1)
  {
    id: 'row_1',
    distributorId: 'dist_1790626000001',
    productId: 'prod_cardio_1',
    product: 'CardioLipid 20mg',
    pharmacyCode: 'PH-101',
    pharmacyName: 'Al-Nour Pharmacy',
    areaRaw: '20502',
    value: 5000,
    quantity: 50,
    month: '2026-10'
  },
  // Row 2: Ibn Sina row with street name 'صفط اللبن' for Cardio product (Line 1)
  {
    id: 'row_2',
    distributorId: 'dist_1790626000001',
    productId: 'prod_cardio_2',
    product: 'CardioPress 5mg',
    pharmacyCode: 'PH-102',
    pharmacyName: 'Al-Salam Pharmacy',
    areaRaw: 'صفط اللبن',
    value: 3000,
    quantity: 30,
    month: '2026-10'
  },
  // Row 3: Derma product (Line 2) in 'صفط اللبن' -> should go to Derma rep!
  {
    id: 'row_3',
    distributorId: 'dist_1790626000001',
    productId: 'prod_derma_1',
    product: 'DermaCure Cream',
    pharmacyCode: 'PH-103',
    pharmacyName: 'Al-Hayah Pharmacy',
    areaRaw: 'صفط اللبن',
    value: 4000,
    quantity: 40,
    month: '2026-10'
  },
  // Row 4: Shobra street 'روض الفرج' for Cardio product (Line 1) -> should go to Shobra Line 1 rep
  {
    id: 'row_4',
    distributorId: 'dist_1790626000001',
    productId: 'prod_cardio_1',
    product: 'CardioLipid 20mg',
    pharmacyCode: 'PH-104',
    pharmacyName: 'El-Mahaba Pharmacy',
    areaRaw: 'روض الفرج',
    value: 2500,
    quantity: 25,
    month: '2026-10'
  },
  // Row 5: VIP Pharmacy with Override (EZ-999) located in Giza raw area but overridden to Shobra
  {
    id: 'row_5',
    distributorId: 'dist_1790626000001',
    productId: 'prod_cardio_1',
    product: 'CardioLipid 20mg',
    pharmacyCode: 'EZ-999',
    pharmacyName: 'El-Ezaby Roxy VIP',
    areaRaw: 'صفط اللبن', // raw text says Giza
    value: 10000,
    quantity: 100,
    month: '2026-10'
  },
  // Row 6: Unmatched raw territory text from Overseas distributor
  {
    id: 'row_6',
    distributorId: 'dist_1790626000003',
    productId: 'prod_cardio_1',
    product: 'CardioLipid 20mg',
    pharmacyCode: 'PH-999',
    pharmacyName: 'New Cairo Pharmacy',
    areaRaw: 'منطقة غير معروفة 88',
    value: 1200,
    quantity: 12,
    month: '2026-10'
  }
];

store.distributorSales.addBatch(simulatedRows);

const sales = store.distributorSales.getAll();
assert.strictEqual(sales.length, 6, 'Should have 6 imported sales rows');

// Check Row 1 (Ibn Sina code 20502)
const r1 = sales.find(s => s.id === 'row_1');
assert.strictEqual(r1.areaId, 'area_l1_giza5_2');
assert.strictEqual(r1.repId, 'rep_giza_line1');
assert.strictEqual(r1.dmId, 'dm_giza');
assert.strictEqual(r1.lmId, 'lm1');
console.log('✓ Row 1 correctly mapped via alias 20502 -> rep_giza_line1 (DM: dm_giza, LM: lm1)');

// Check Row 2 (Street 'صفط اللبن' in Line 1)
const r2 = sales.find(s => s.id === 'row_2');
assert.strictEqual(r2.areaId, 'area_l1_giza5_2');
assert.strictEqual(r2.repId, 'rep_giza_line1');
console.log('✓ Row 2 correctly mapped via CRM Brick sub-area "صفط اللبن" -> rep_giza_line1');

// Check Row 3 (Street 'صفط اللبن' in Line 2 - Multi-line isolation!)
const r3 = sales.find(s => s.id === 'row_3');
assert.strictEqual(r3.areaId, 'area_l2_giza_shobra');
assert.strictEqual(r3.repId, 'rep_combined_line2');
assert.strictEqual(r3.dmId, 'dm_derma');
console.log('✓ Row 3 correctly isolated to Line 2 Derma rep (rep_combined_line2) despite same street name!');

// Check Row 4 (Shobra street 'روض الفرج' in Line 1)
const r4 = sales.find(s => s.id === 'row_4');
assert.strictEqual(r4.areaId, 'area_l1_shobra1');
assert.strictEqual(r4.repId, 'rep_shobra_line1');
assert.strictEqual(r4.dmId, 'dm_cairo');
console.log('✓ Row 4 correctly mapped via CRM Brick sub-area "روض الفرج" -> rep_shobra_line1');

// Check Row 5 (Pharmacy Territory Override EZ-999)
const r5 = sales.find(s => s.id === 'row_5');
assert.strictEqual(r5.areaId, 'area_l1_shobra1', 'Override should route to Shobra area despite Giza raw text');
assert.strictEqual(r5.repId, 'rep_shobra_line1');
console.log('✓ Row 5 correctly overridden to Shobra rep despite having Giza street in raw sheet!');

// Check Row 6 (Unmatched pending row)
const r6 = sales.find(s => s.id === 'row_6');
assert(!r6.repId, 'Unmatched territory should have no rep assigned yet');
const pending = store.distributorSales.getPendingAreaTexts();
assert(pending.some(p => p.areaRaw === 'منطقة غير معروفة 88'), 'Should appear in pending areas');
console.log('✓ Row 6 correctly flagged as Pending / Unmatched Territory');

// Test 6: Linking Pending Territory
console.log('Testing Test 6: Linking pending territory to an area...');
store.areas.addAlias('area_l1_giza5_2', 'dist_1790626000003', 'منطقة غير معروفة 88');
store.distributorSales.applyAreaMatching(true);

const r6After = store.distributorSales.getAll().find(s => s.id === 'row_6');
assert.strictEqual(r6After.areaId, 'area_l1_giza5_2');
assert.strictEqual(r6After.repId, 'rep_giza_line1');
const pendingAfter = store.distributorSales.getPendingAreaTexts();
assert(!pendingAfter.some(p => p.areaRaw === 'منطقة غير معروفة 88'), 'Should no longer be pending');
console.log('✓ Test 6: Linking territory dynamically resolved and attributed pending row to rep!');

// Test 7: Reassigning Rep in Area rematches existing distributor sales
console.log('Testing Test 7: Representative change auto-rematching...');
store.distributorSales.rematchAreaSales('area_l1_giza5_2', 'rep_shobra_line1');
const r1AfterReassign = store.distributorSales.getAll().find(s => s.id === 'row_1');
assert.strictEqual(r1AfterReassign.repId, 'rep_shobra_line1');
console.log('✓ Test 7: Representative change successfully rematched sales attribution!');

console.log('\n======================================================');
console.log('ALL 7 DISTRIBUTOR SALES MAPPING TEST SUITES PASSED! 100%');
console.log('======================================================\n');
