const fs = require('fs');
const vm = require('vm');

const domElements = {};
function getEl(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      value: 'all',
      innerHTML: '',
      style: { display: 'none' },
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      options: [],
      children: [],
      dataset: {},
      appendChild(c) { this.options.push(c); this.children.push(c); },
      replaceChildren() { this.options = []; this.children = []; },
      addEventListener() {}
    };
  }
  return domElements[id];
}

const mockDocument = {
  documentElement: { dir: 'ltr' },
  body: { classList: { add: () => {}, remove: () => {} } },
  getElementById: getEl,
  querySelectorAll: (sel) => {
    if (sel === '.report-tab-btn') {
      return [{ dataset: { tab: 'sales' }, classList: { toggle: () => {}, contains: () => true } }];
    }
    if (sel === '.report-content-panel') {
      return [{ id: 'tabPanel-sales', classList: { toggle: () => {}, contains: () => true } }];
    }
    return [];
  },
  querySelector: (sel) => {
    if (sel === '.report-tab-btn.active') {
      return { dataset: { tab: 'sales' } };
    }
    return null;
  },
  createElement: (t) => ({ tagName: t, value: '', textContent: '', style: {}, appendChild: () => {}, addEventListener: () => {} }),
  addEventListener: () => {}
};

const storeData = {};
const mockLocalStorage = {
  getItem: (k) => storeData[k] || null,
  setItem: (k, v) => { storeData[k] = String(v); },
  removeItem: (k) => { delete storeData[k]; }
};

const sandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  Intl,
  Date,
  URLSearchParams,
  URL
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.window.location = { href: 'http://localhost/reports.html', search: '', pathname: '/reports.html', replace: () => {} };
sandbox.location = sandbox.window.location;
sandbox.global = sandbox;

['js/app.js', 'js/store.js', 'js/shared-report.js', 'js/sales-report.js'].forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInNewContext(code, sandbox);
});

let renderCalled = false;
sandbox.window.renderSalesReport = function() {
  renderCalled = true;
};

console.log('--- Test 1: Results container hidden (User hasn\'t clicked Show yet) ---');
sandbox.document.getElementById('salesResultsContainer').style.display = 'none';
renderCalled = false;
sandbox.window.onReportLineFilterChange('line_1790626000001');
console.log('Render called when hidden?', renderCalled, '(Expected: false)');

console.log('--- Test 2: Results container visible (User clicked Show previously) ---');
sandbox.document.getElementById('salesResultsContainer').style.display = 'block';
renderCalled = false;
sandbox.window.onReportLineFilterChange('line_1790626000001');
console.log('Render called when visible?', renderCalled, '(Expected: true)');
console.log('Selected line ID:', sandbox.window.selectedReportLineId);
