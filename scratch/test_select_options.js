const fs = require('fs');

const appJs = fs.readFileSync('js/app.js', 'utf8');

const usersBlock = appJs.substring(appJs.indexOf('users: ['), appJs.indexOf('specialties: ['));
const areasBlock = appJs.substring(appJs.indexOf('areas: ['), appJs.indexOf('productLines: ['));
const linesBlock = appJs.substring(appJs.indexOf('productLines: ['), appJs.indexOf('distributors: ['));

const users = eval('({' + usersBlock + '})').users;
const areas = eval('({' + areasBlock + '})').areas;
const productLines = eval('({' + linesBlock + '})').productLines;

// Mock DOM Select
class MockOption {
  constructor(val, text) {
    this.value = val;
    this.textContent = text;
  }
}
class MockOptGroup {
  constructor(label) {
    this.label = label;
    this.children = [];
  }
  appendChild(child) {
    this.children.push(child);
  }
}
class MockSelect {
  constructor(id) {
    this.id = id;
    this.children = [];
    this.value = 'all';
  }
  replaceChildren() {
    this.children = [];
  }
  appendChild(child) {
    this.children.push(child);
  }
  get options() {
    const list = [];
    this.children.forEach(c => {
      if (c instanceof MockOptGroup) {
        list.push(...c.children);
      } else {
        list.push(c);
      }
    });
    return list;
  }
}

// Run populateUnifiedReportEmployeeFilters simulation
const selectEl = new MockSelect('pharmSalesRepSelect');

// With admin user, line = 'all'
const adminUser = users.find(u => u.role === 'admin');

function appendSelectOptions(selectEl, items, getValue, getLabel) {
  items.forEach((item) => {
    selectEl.appendChild(new MockOption(getValue(item), getLabel(item)));
  });
}

const scopedTeam = users;
const dms = scopedTeam.filter((u) => u.id !== adminUser.id && (u.role === 'district_manager' || u.role === 'dm'));
const reps = scopedTeam.filter((u) => u.id !== adminUser.id && (u.role === 'medical_rep' || u.role === 'rep'));

selectEl.appendChild(new MockOption('all', 'All Team in Line'));

if (dms.length > 0) {
  const dmGroup = new MockOptGroup('District Managers (DMs)');
  appendSelectOptions(dmGroup, dms, (dm) => dm.id, (dm) => `💼 ${dm.name} (${dm.employeeCode || 'DM'})`);
  selectEl.appendChild(dmGroup);

  dms.forEach((dm) => {
    const dmReps = reps.filter((r) => r.managerId === dm.id);
    const group = new MockOptGroup(`Team ${dm.name} (Reps)`);
    appendSelectOptions(group, dmReps, (rep) => rep.id, (rep) => `🩺 ${rep.name} (${rep.employeeCode || 'Rep'})`);
    selectEl.appendChild(group);
  });
}

console.log('Total options in select:', selectEl.options.length);
selectEl.options.forEach(opt => console.log('  value:', opt.value, '| text:', opt.textContent));
