const assert = require('assert');

global.window = global;
global.document = {
  addEventListener: () => {},
  dispatchEvent: () => {},
  getElementById: (id) => null
};
global.addEventListener = () => {};

let storedSales = JSON.stringify([
  { id: 'ds_1', distributorId: 'dist1', product: 'Lipitor', pharmacyName: 'Al-Ezaby', value: 1500, quantity: 10, date: '2026-10-01' },
  { id: 'ds_2', distributorId: 'dist_1790626000002', product: 'Plavix', pharmacyName: 'Seif', value: 2000, quantity: 20, date: '2026-10-02' },
  { id: 'ds_3', distributorId: 'dist3', product: 'Concor', pharmacyName: 'Roushdy', value: 800, quantity: 5, date: '2026-10-03' }
]);

global.localStorage = {
  getItem: (k) => {
    if (k === 'pharma_sales_data') return storedSales;
    return null;
  },
  setItem: (k, v) => {
    if (k === 'pharma_sales_data') storedSales = v;
  }
};

require('../js/app.js');
require('../js/store.js');

console.log('Testing store.distributors...');
const dist1 = global.store.distributors.getById('dist1');
assert(dist1, 'dist1 should be found');
assert.strictEqual(dist1.id, 'dist_1790626000001');
assert.strictEqual(dist1.name, 'Ibn Sina Pharma');

const dist2 = global.store.distributors.getById('dist_1790626000002');
assert(dist2, 'dist2 should be found');
assert.strictEqual(dist2.name, 'United Company of Pharmacists (UCP)');

const dist3Name = global.store.distributors.getName('dist3');
assert.strictEqual(dist3Name, 'Overseas');

console.log('Testing store.distributorSales...');
const sales = global.store.distributorSales.getAll();
assert.strictEqual(sales.length, 3);
// Check auto-migration
assert.strictEqual(sales[0].distributorId, 'dist_1790626000001', 'dist1 should be migrated to dist_1790626000001');
assert.strictEqual(sales[2].distributorId, 'dist_1790626000003', 'dist3 should be migrated to dist_1790626000003');

// Check persistence back to localStorage
const savedData = JSON.parse(storedSales);
assert.strictEqual(savedData[0].distributorId, 'dist_1790626000001');
assert.strictEqual(savedData[2].distributorId, 'dist_1790626000003');

// Check getByDistributor with modern and legacy IDs
const dist1Sales = global.store.distributorSales.getByDistributor('dist_1790626000001');
assert.strictEqual(dist1Sales.length, 1);
assert.strictEqual(dist1Sales[0].product, 'Lipitor');

const dist1LegacySales = global.store.distributorSales.getByDistributor('dist1');
assert.strictEqual(dist1LegacySales.length, 1);
assert.strictEqual(dist1LegacySales[0].product, 'Lipitor');

console.log('ALL DISTRIBUTOR RESOLUTION TESTS PASSED!');
