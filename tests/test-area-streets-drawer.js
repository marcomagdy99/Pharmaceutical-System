const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('--- Testing Area Streets Drawer & CRM Bricks Integration ---');

const egyptBricksContent = fs.readFileSync('C:/Users/DeLL/OneDrive/Desktop/pharma-rep/Pharmaceutical-System/js/egypt-bricks-data.js', 'utf8');
const areasContent = fs.readFileSync('C:/Users/DeLL/OneDrive/Desktop/pharma-rep/Pharmaceutical-System/js/areas.js', 'utf8');

// Mock browser environment
const domElements = {};

function createMockElement(id, tagName = 'div') {
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    style: { display: 'none' },
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    children: [],
    replaceChildren(...items) { this.children = items; this.innerHTML = ''; },
    appendChild(child) { this.children.push(child); },
    querySelector(selector) {
      if (selector === '.scope-btn-label') return this._labelEl;
      if (selector === '.scope-chevron') return this._chevronEl;
      return null;
    },
    _labelEl: { textContent: 'View Area Details' },
    _chevronEl: { style: {} },
    innerHTML: '',
    value: ''
  };
  domElements[id] = el;
  return el;
}

const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: (id) => domElements[id] || createMockElement(id),
    createElement: (tag) => createMockElement('', tag),
    querySelectorAll: () => [],
    documentElement: { lang: 'en' }
  },
  bootstrap: {
    Modal: class {
      show() {}
      hide() {}
      static getInstance() { return new this(); }
    }
  },
  escapeHtml: (s) => String(s || ''),
  showToast: () => {}
};
sandbox.window = sandbox;
sandbox.window.escapeHtml = sandbox.escapeHtml;

vm.createContext(sandbox);

// 1. Load egypt-bricks-data
vm.runInContext(egyptBricksContent, sandbox);
assert.strictEqual(sandbox.CRM_IMS_MASTER_BRICKS.length, 152, 'Must have 152 CRM bricks');
console.log('✓ 1. egypt-bricks-data loaded with 152 CRM Bricks');

// 2. Load areas.js
vm.runInContext(areasContent, sandbox);
assert.strictEqual(typeof sandbox.getAreaScopeInfo, 'function', 'getAreaScopeInfo must be exported');
assert.strictEqual(typeof sandbox.toggleAreaStreetsDrawer, 'function', 'toggleAreaStreetsDrawer must be exported');
assert.strictEqual(typeof sandbox.migrateLegacyAreaNames, 'function', 'migrateLegacyAreaNames must be exported');
console.log('✓ 2. areas.js loaded and exported required functions');

// 3. Test getAreaScopeInfo for Giza V - Brick 2
const testArea1 = {
  id: 'area_test_1',
  name: 'Giza V - Brick 2',
  code: 'GZA-B50',
  bricks: ['[B50] Giza V - Brick 2 (Giza 12)']
};
const scopes1 = sandbox.getAreaScopeInfo(testArea1);
assert.strictEqual(scopes1.length, 1, 'Should resolve 1 scope');
assert.strictEqual(scopes1[0].crmCode, 'Giza V - Brick 2');
assert.strictEqual(scopes1[0].imsCode, 'B50');
assert.strictEqual(scopes1[0].imsName, 'Giza 12');
assert.ok(scopes1[0].scopeText.includes('بولاق الدكرور'), 'Scope must include بولاق الدكرور');
console.log('✓ 3. getAreaScopeInfo resolves Giza V - Brick 2 with exact Arabic streets');

// 4. Test getAreaScopeInfo for Giza IV - Brick 1
const testArea2 = {
  id: 'area_test_2',
  name: 'Giza IV - Brick 1',
  code: 'GZA-B48',
  bricks: ['[B48] Giza IV - Brick 1 (Giza 10)']
};
const scopes2 = sandbox.getAreaScopeInfo(testArea2);
assert.strictEqual(scopes2.length, 1, 'Should resolve 1 scope');
assert.strictEqual(scopes2[0].crmCode, 'Giza IV - Brick 1');
assert.strictEqual(scopes2[0].imsCode, 'B48');
assert.ok(scopes2[0].scopeText.includes('الزمالك'), 'Scope must include الزمالك');
console.log('✓ 4. getAreaScopeInfo resolves Giza IV - Brick 1 with exact Arabic streets');

// 5. Test toggleAreaStreetsDrawer
const drawerEl = createMockElement('drawer_123');
drawerEl.style.display = 'none';

const btnEl = createMockElement('btn_123');
btnEl.classList.remove('active');
btnEl._labelEl.textContent = 'View Area Details';

// First click: expand drawer
sandbox.toggleAreaStreetsDrawer('drawer_123', btnEl);
assert.strictEqual(drawerEl.style.display, 'block', 'Drawer must be displayed');
assert.ok(btnEl.classList.contains('active'), 'Button must have active class');
assert.strictEqual(btnEl.getAttribute('aria-expanded'), 'true');
assert.strictEqual(btnEl._labelEl.textContent, 'Hide Area Details');
assert.strictEqual(btnEl._chevronEl.style.transform, 'rotate(180deg)');

// Second click: collapse drawer
sandbox.toggleAreaStreetsDrawer('drawer_123', btnEl);
assert.strictEqual(drawerEl.style.display, 'none', 'Drawer must be hidden');
assert.ok(!btnEl.classList.contains('active'), 'Button must not have active class');
assert.strictEqual(btnEl.getAttribute('aria-expanded'), 'false');
assert.strictEqual(btnEl._labelEl.textContent, 'View Area Details');
assert.strictEqual(btnEl._chevronEl.style.transform, 'rotate(0deg)');
console.log('✓ 5. toggleAreaStreetsDrawer smoothly toggles display, label, and chevron rotation');

// 6. Test migrateLegacyAreaNames
sandbox.DEMO_DATA = {
  areas: [
    { id: 'a1', name: 'Bolak El Dakror', code: 'GIZ-N009', bricks: [] },
    { id: 'a2', name: 'Dokki', code: 'GIZ-N002', bricks: [] },
    { id: 'a3', name: 'Mohndseen', code: 'GIZ-N001', bricks: [] }
  ]
};
sandbox.store = {
  areas: {
    getAll: () => sandbox.DEMO_DATA.areas,
    _defaultLineId: () => 'line1'
  }
};
sandbox.migrateLegacyAreaNames();
assert.strictEqual(sandbox.DEMO_DATA.areas[0].name, 'Giza V - Brick 2', 'Bolak El Dakror migrated to Giza V - Brick 2');
assert.strictEqual(sandbox.DEMO_DATA.areas[0].code, 'GZA-B50', 'Code updated to GZA-B50');
assert.strictEqual(sandbox.DEMO_DATA.areas[1].name, 'Giza II - Brick 1', 'Dokki migrated to Giza II - Brick 1');
assert.strictEqual(sandbox.DEMO_DATA.areas[2].name, 'Giza V - Brick 1', 'Mohndseen migrated to Giza V - Brick 1');
console.log('✓ 6. migrateLegacyAreaNames seamlessly migrates legacy area names and adds Giza IV - Brick 1');

console.log('=== ALL AREA STREETS DRAWER TESTS PASSED! ===');
