const assert = require('assert');

global.window = global;
global.localStorage = {
  getItem: (k) => {
    if (k === 'pharmaUser') return JSON.stringify({ id: 'u1790626000010', role: 'admin' });
    return null;
  },
  setItem: () => {}
};
global.sessionStorage = { getItem: () => null, setItem: () => {} };
global.addEventListener = () => {};
global.window.addEventListener = () => {};
global.MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const elements = {};
function createMockEl(id) {
  return {
    id,
    value: '',
    textContent: '',
    style: { display: 'none' },
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    dataset: {},
    options: [],
    children: [],
    replaceChildren() {
      this.children = [];
      this.options = [];
    },
    appendChild(child) {
      this.children.push(child);
      if (child.tagName === 'OPTION') {
        this.options.push(child);
      }
    },
    addEventListener() {}
  };
}

global.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockEl(id);
    }
    return elements[id];
  },
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    selected: false,
    dataset: {},
    style: {},
    classList: {
      add() {},
      remove() {}
    },
    remove() {},
    children: [],
    appendChild(c) { this.children.push(c); },
    addEventListener() {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};

global.checkAuth = () => ({ role: 'admin' });
global.isAdmin = () => true;
global.showToast = (msg, type) => console.log(`[TOAST ${type}]: ${msg}`);

require('../js/app.js');
require('../js/store.js');
require('../js/sales-report.js');

console.log('Testing openTargetsModal()...');
assert(typeof window.openTargetsModal === 'function', 'openTargetsModal should be defined on window');

// Call openTargetsModal
window.openTargetsModal();

const modalEl = elements['targetsModal'];
assert.strictEqual(modalEl.style.display, 'flex', 'Modal should be displayed as flex');
assert(modalEl.classList.contains('active'), 'Modal should have active class');

// Check that month and year selects were populated
const monthSelect = elements['targetMonthSelect'];
const yearSelect = elements['targetYearSelect'];
assert(monthSelect.children.length >= 12, 'Month select should have 12 months');
assert(yearSelect.children.length >= 3, 'Year select should have years');

console.log('Testing saveTarget()...');
// Set form values
elements['targetAreaSelect'].value = global.DEMO_DATA.areas[0].id;
elements['targetProductSelect'].value = global.DEMO_DATA.productLines[0].products[0].id;
elements['targetMonthSelect'].value = '10';
elements['targetYearSelect'].value = '2026';
elements['targetUnitsInput'].value = '500';
elements['targetUnitPriceInput'].value = '40';
elements['targetComputedValueDisplay'].value = '20000';

window.saveTarget();

const savedTarget = global.store.targets.find(
  elements['targetAreaSelect'].value,
  elements['targetProductSelect'].value,
  '2026-10'
);
assert(savedTarget, 'Target should be saved in store.targets');
assert.strictEqual(savedTarget.targetUnits, 500);
assert.strictEqual(savedTarget.target, 20000);

console.log('Testing closeTargetsModal()...');
window.closeTargetsModal();
assert.strictEqual(modalEl.style.display, 'none', 'Modal should be hidden on close');
assert(!modalEl.classList.contains('active'), 'Modal should not have active class after close');

console.log('ALL TARGETS MODAL TESTS PASSED!');
process.exit(0);
