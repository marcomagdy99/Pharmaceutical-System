const fs = require('fs');

const appJs = fs.readFileSync('js/app.js', 'utf8');
const sharedJs = fs.readFileSync('js/shared-report.js', 'utf8');

const usersBlock = appJs.substring(appJs.indexOf('users: ['), appJs.indexOf('specialties: ['));
const areasBlock = appJs.substring(appJs.indexOf('areas: ['), appJs.indexOf('productLines: ['));
const linesBlock = appJs.substring(appJs.indexOf('productLines: ['), appJs.indexOf('distributors: ['));

const allUsers = eval('({' + usersBlock + '})').users;
const allAreas = eval('({' + areasBlock + '})').areas;
const productLines = eval('({' + linesBlock + '})').productLines;

// Mock DOM Select Element
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.options = [];
    this.value = '';
    this.dataset = {};
    this.label = '';
    this.textContent = '';
  }
  appendChild(child) {
    this.children.push(child);
    if (child.tagName === 'OPTION') {
      this.options.push(child);
    } else if (child.tagName === 'OPTGROUP') {
      child.children.forEach(c => {
        if (c.tagName === 'OPTION') this.options.push(c);
      });
    }
  }
  replaceChildren() {
    this.children = [];
    this.options = [];
  }
}

const mockSelect = new MockElement('select');
mockSelect.id = 'pharmSalesRepSelect';

// Mock environment
global.document = {
  getElementById: (id) => {
    if (id === 'pharmSalesRepSelect') return mockSelect;
    return null;
  },
  createElement: (tag) => new MockElement(tag)
};

global.window = {
  store: {
    users: { getAll: () => allUsers },
    areas: { getAll: () => allAreas },
    productLines: { getAll: () => productLines }
  },
  DEMO_DATA: { users: allUsers, areas: allAreas, productLines: productLines },
  normalizeRole: (r) => {
    if (!r) return '';
    const s = String(r).toLowerCase().trim();
    if (s === 'dm' || s === 'district_manager') return 'district_manager';
    if (s === 'lm' || s === 'line_manager') return 'line_manager';
    if (s === 'bu' || s === 'business_unit') return 'business_unit';
    if (s === 'rep' || s === 'medical_rep') return 'medical_rep';
    if (s === 'pm' || s === 'product_manager') return 'product_manager';
    if (s === 'admin') return 'admin';
    if (s === 'hr') return 'hr';
    return s;
  },
  isRepRole: (u) => {
    const r = (u && u.role ? String(u.role).toLowerCase().trim() : '');
    return r === 'medical_rep' || r === 'rep';
  },
  getUserLines: (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'hr') return productLines;
    const assigned = [...(user.lineIds || (user.lineId ? [user.lineId] : []))];
    if (assigned.length === 0 && user.managerId) {
      const mgr = allUsers.find(u => u.id === user.managerId);
      if (mgr) {
        (mgr.lineIds || (mgr.lineId ? [mgr.lineId] : [])).forEach(lid => {
          if (!assigned.includes(lid)) assigned.push(lid);
        });
      }
    }
    return productLines.filter(l => assigned.includes(l.id));
  },
  getScopedTeamForLine: (lineId, user) => {
    let candidateUsers = allUsers;
    let result = candidateUsers;
    if (lineId && lineId !== 'all') {
      result = candidateUsers.filter(u => {
        if (u.id === user.id) return true;
        const uLineIds = window.getUserLines(u.id).map(l => l.id);
        if (uLineIds.includes(lineId)) return true;
        const subs = allUsers.filter(sub => sub.managerId === u.id);
        return subs.some(sub => window.getUserLines(sub.id).map(l => l.id).includes(lineId));
      });
    }
    return result;
  },
  getAreaManagerId: (area, users) => {
    if (area && area.repId) {
      const rep = users.find(u => u.id === area.repId);
      if (rep && rep.managerId) return rep.managerId;
    }
    return null;
  }
};

global.checkAuth = () => allUsers.find(u => u.role === 'admin');

// Extract and eval appendSelectOptions & populateUnifiedReportEmployeeFilters from shared-report.js
function appendSelectOptions(selectEl, items, getValue, getLabel) {
  if (!selectEl) return;
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    selectEl.appendChild(opt);
  });
}
global.appendSelectOptions = appendSelectOptions;
global.getSharedReportUsers = () => allUsers;

// Load populateUnifiedReportEmployeeFilters function from shared-report.js
const populateFnStr = sharedJs.substring(
  sharedJs.indexOf('function populateUnifiedReportEmployeeFilters('),
  sharedJs.indexOf('// Aliases for compatibility')
);

eval(populateFnStr);

// Run for Admin with 'all'
populateUnifiedReportEmployeeFilters(checkAuth(), 'all');

console.log('=== POPULATED FILTER RESULT (Admin, Line=all) ===');
console.log('Total Children in selectEl:', mockSelect.children.length);
mockSelect.children.forEach((child, i) => {
  if (child.tagName === 'OPTION') {
    console.log(`[${i}] OPTION: value="${child.value}", text="${child.textContent}"`);
  } else if (child.tagName === 'OPTGROUP') {
    console.log(`[${i}] OPTGROUP label="${child.label}" (Contains ${child.children.length} options):`);
    child.children.forEach(c => console.log(`      -> value="${c.value}", text="${c.textContent}"`));
  }
});

// Test Line 1
populateUnifiedReportEmployeeFilters(checkAuth(), 'line_1790626000001');
console.log('\n=== POPULATED FILTER RESULT (Admin, Line 1) ===');
mockSelect.children.forEach((child, i) => {
  if (child.tagName === 'OPTION') {
    console.log(`[${i}] OPTION: value="${child.value}", text="${child.textContent}"`);
  } else if (child.tagName === 'OPTGROUP') {
    console.log(`[${i}] OPTGROUP label="${child.label}" (Contains ${child.children.length} options):`);
    child.children.forEach(c => console.log(`      -> value="${c.value}", text="${c.textContent}"`));
  }
});

// Test DM user
const dmUser = allUsers.find(u => u.role === 'district_manager');
populateUnifiedReportEmployeeFilters(dmUser, 'all');
console.log('\n=== POPULATED FILTER RESULT (Logged in as DM: ' + dmUser.name + ') ===');
mockSelect.children.forEach((child, i) => {
  if (child.tagName === 'OPTION') {
    console.log(`[${i}] OPTION: value="${child.value}", text="${child.textContent}"`);
  } else if (child.tagName === 'OPTGROUP') {
    console.log(`[${i}] OPTGROUP label="${child.label}" (Contains ${child.children.length} options):`);
    child.children.forEach(c => console.log(`      -> value="${c.value}", text="${c.textContent}"`));
  }
});
