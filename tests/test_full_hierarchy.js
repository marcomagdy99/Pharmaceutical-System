const fs = require('fs');

global.window = global;
global.document = {
  addEventListener: () => {},
  dispatchEvent: () => {},
  getElementById: (id) => {
    if (!mockDOM[id]) {
      mockDOM[id] = {
        id,
        value: 'all',
        options: [],
        disabled: false,
        dataset: {},
        replaceChildren: function() { this.options = []; },
        appendChild: function(child) {
          if (child.tagName === 'OPTGROUP') {
            (child.options || []).forEach(o => this.options.push(o));
          } else {
            this.options.push(child);
          }
        }
      };
    }
    return mockDOM[id];
  },
  createElement: (tag) => {
    return {
      tagName: tag.toUpperCase(),
      value: '',
      textContent: '',
      selected: false,
      options: [],
      appendChild: function(c) { this.options.push(c); }
    };
  },
  querySelectorAll: () => []
};

const mockDOM = {};

global.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {} };

require('../js/app.js');
require('../js/store.js');

const users = global.DEMO_DATA.users;
const allLines = global.DEMO_DATA.productLines;
const allAreas = global.DEMO_DATA.areas;

const REPORT_TAB_CONFIGS = {
  sales: { lmId: 'pharmSalesLmSelect', dmId: 'pharmSalesDmSelect', repId: 'pharmSalesRepSelect', hasArea: true, areaId: 'pharmSalesAreaSelect' },
  achievements: { lmId: 'achLmSelect', dmId: 'achDmSelect', repId: 'achRepSelect', hasArea: true, areaId: 'achAreaSelect' },
  timeline: { lmId: 'timelineLmSelect', dmId: 'timelineDmSelect', repId: 'timelineRepSelect' },
  coverage: { lmId: 'coverageLmSelect', dmId: 'coverageDmSelect', repId: 'coverageRepSelect' },
  doctors: { lmId: 'doctorLmSelect', dmId: 'doctorDmSelect', repId: 'doctorRepSelect' },
  hospitals: { lmId: 'hospitalLmSelect', dmId: 'hospitalDmSelect', repId: 'hospitalRepSelect' },
  pharmacies: { lmId: 'pharmacyLmSelect', dmId: 'pharmacyDmSelect', repId: 'pharmacyRepSelect' },
  'missing-days': { lmId: 'missingLmSelect', dmId: 'missingDmSelect', repId: 'missingRepSelect' },
  'gps-tracing': { lmId: 'gpsLmSelect', dmId: 'gpsDmSelect', repId: 'gpsRepSelect' },
  'accounts-costing': { lmId: 'accountsCostingLmSelect', dmId: 'accountsCostingDmSelect', repId: 'accountsCostingRepSelect', hasArea: true, areaId: 'accountsCostingAreaSelect' }
};

function belongsToLine(u, targetLineId) {
  if (!targetLineId || targetLineId === 'all') return true;
  const uLines = window.getUserLines ? window.getUserLines(u.id).map(l => l.id) : (u.lineIds || (u.lineId ? [u.lineId] : []));
  return uLines.includes(targetLineId);
}

function populateTabLmOptions(tabKey, user, lineId) {
  const cfg = REPORT_TAB_CONFIGS[tabKey];
  if (!cfg) return;
  const lmSelect = document.getElementById(cfg.lmId);
  if (!lmSelect) return;

  const prevVal = lmSelect.value;
  lmSelect.replaceChildren();

  const effectiveUser = user || { role: 'admin', id: 'u1790626000010' };
  const role = window.normalizeRole ? window.normalizeRole(effectiveUser.role) : (effectiveUser.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(effectiveUser) : (role === 'medical_rep' || role === 'rep');
  const isDM = role === 'district_manager' || role === 'dm';
  const isLM = role === 'line_manager' || role === 'lm';
  const isBU = role === 'business_unit' || role === 'bu';

  const allUsers = users;
  const allLms = allUsers.filter(u => {
    const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase();
    return r === 'line_manager' || r === 'lm';
  });

  if (isRep) {
    const myDm = allUsers.find(u => u.id === effectiveUser.managerId);
    const myLm = myDm ? allUsers.find(u => u.id === myDm.managerId) : null;
    const opt = document.createElement('option');
    opt.value = myLm ? myLm.id : (myDm ? myDm.id : effectiveUser.id);
    opt.textContent = myLm ? myLm.name : 'Line Manager';
    opt.selected = true;
    lmSelect.appendChild(opt);
    lmSelect.value = opt.value;
    lmSelect.disabled = true;
    return;
  }

  if (isDM) {
    const myLm = allUsers.find(u => u.id === effectiveUser.managerId);
    const opt = document.createElement('option');
    opt.value = myLm ? myLm.id : '';
    opt.textContent = myLm ? myLm.name : 'Line Manager';
    opt.selected = true;
    lmSelect.appendChild(opt);
    lmSelect.value = opt.value;
    lmSelect.disabled = true;
    return;
  }

  if (isLM) {
    const opt = document.createElement('option');
    opt.value = effectiveUser.id;
    opt.textContent = effectiveUser.name;
    opt.selected = true;
    lmSelect.appendChild(opt);
    lmSelect.value = opt.value;
    lmSelect.disabled = true;
    return;
  }

  // Admin / HR / BU:
  lmSelect.disabled = false;
  let availableLms = allLms.filter(lm => belongsToLine(lm, lineId));

  if (isBU) {
    const subs = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(effectiveUser.id) : [];
    const subIds = new Set(subs.map(s => s.id));
    availableLms = availableLms.filter(lm => subIds.has(lm.id) || lm.managerId === effectiveUser.id);
  }

  // If a specific line has only 1 LM: lock/select that LM
  if (lineId !== 'all' && availableLms.length === 1) {
    const opt = document.createElement('option');
    opt.value = availableLms[0].id;
    opt.textContent = availableLms[0].name;
    opt.selected = true;
    lmSelect.appendChild(opt);
    lmSelect.value = availableLms[0].id;
    lmSelect.disabled = true;
    return;
  }

  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All Line Managers';
  lmSelect.appendChild(optAll);

  availableLms.forEach(lm => {
    const opt = document.createElement('option');
    opt.value = lm.id;
    opt.textContent = lm.name;
    lmSelect.appendChild(opt);
  });

  if (prevVal && lmSelect.options.some(o => o.value === prevVal)) {
    lmSelect.value = prevVal;
  } else {
    lmSelect.value = 'all';
  }
}

function populateTabDmOptions(tabKey, user, lineId) {
  const cfg = REPORT_TAB_CONFIGS[tabKey];
  if (!cfg) return;
  const dmSelect = document.getElementById(cfg.dmId);
  const lmSelect = document.getElementById(cfg.lmId);
  const selectedLmId = lmSelect ? lmSelect.value : 'all';

  const prevVal = dmSelect.value;
  dmSelect.replaceChildren();

  const effectiveUser = user || { role: 'admin', id: 'u1790626000010' };
  const role = window.normalizeRole ? window.normalizeRole(effectiveUser.role) : (effectiveUser.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(effectiveUser) : (role === 'medical_rep' || role === 'rep');
  const isDM = role === 'district_manager' || role === 'dm';
  const isLM = role === 'line_manager' || role === 'lm';
  const isBU = role === 'business_unit' || role === 'bu';

  const allUsers = users;
  const allDms = allUsers.filter(u => {
    const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase();
    return r === 'district_manager' || r === 'dm';
  });

  if (isRep) {
    const myDm = allUsers.find(u => u.id === effectiveUser.managerId);
    const opt = document.createElement('option');
    opt.value = myDm ? myDm.id : (effectiveUser.managerId || '');
    opt.textContent = myDm ? myDm.name : 'District Manager';
    opt.selected = true;
    dmSelect.appendChild(opt);
    dmSelect.value = opt.value;
    dmSelect.disabled = true;
    return;
  }

  if (isDM) {
    const opt = document.createElement('option');
    opt.value = effectiveUser.id;
    opt.textContent = effectiveUser.name;
    opt.selected = true;
    dmSelect.appendChild(opt);
    dmSelect.value = opt.value;
    dmSelect.disabled = true;
    return;
  }

  dmSelect.disabled = false;
  let availableDms = allDms.filter(dm => belongsToLine(dm, lineId));

  if (isLM) {
    availableDms = availableDms.filter(dm => dm.managerId === effectiveUser.id);
  } else if (selectedLmId && selectedLmId !== 'all') {
    availableDms = availableDms.filter(dm => dm.managerId === selectedLmId);
  } else if (isBU) {
    const subs = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(effectiveUser.id) : [];
    const subIds = new Set(subs.map(s => s.id));
    availableDms = availableDms.filter(dm => subIds.has(dm.id));
  }

  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All District Managers';
  dmSelect.appendChild(optAll);

  availableDms.forEach(dm => {
    const opt = document.createElement('option');
    opt.value = dm.id;
    opt.textContent = dm.name;
    dmSelect.appendChild(opt);
  });

  if (prevVal && dmSelect.options.some(o => o.value === prevVal)) {
    dmSelect.value = prevVal;
  } else {
    dmSelect.value = 'all';
  }
}

function populateTabRepOptions(tabKey, user, lineId) {
  const cfg = REPORT_TAB_CONFIGS[tabKey];
  if (!cfg) return;
  const repSelect = document.getElementById(cfg.repId);
  const lmSelect = document.getElementById(cfg.lmId);
  const dmSelect = document.getElementById(cfg.dmId);
  const selectedLmId = lmSelect ? lmSelect.value : 'all';
  const selectedDmId = dmSelect ? dmSelect.value : 'all';

  const prevVal = repSelect.value;
  repSelect.replaceChildren();

  const effectiveUser = user || { role: 'admin', id: 'u1790626000010' };
  const role = window.normalizeRole ? window.normalizeRole(effectiveUser.role) : (effectiveUser.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(effectiveUser) : (role === 'medical_rep' || role === 'rep');
  const isDM = role === 'district_manager' || role === 'dm';
  const isLM = role === 'line_manager' || role === 'lm';
  const isBU = role === 'business_unit' || role === 'bu';

  const allUsers = users;
  const allReps = allUsers.filter(u => {
    if (u.status === 'Inactive') return false;
    return window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep');
  });

  if (isRep) {
    const opt = document.createElement('option');
    opt.value = effectiveUser.id;
    opt.textContent = effectiveUser.name;
    opt.selected = true;
    repSelect.appendChild(opt);
    repSelect.value = opt.value;
    repSelect.disabled = true;
    return;
  }

  repSelect.disabled = false;
  let availableReps = allReps.filter(rep => belongsToLine(rep, lineId));

  if (isDM) {
    availableReps = availableReps.filter(rep => rep.managerId === effectiveUser.id);
  } else if (selectedDmId && selectedDmId !== 'all') {
    availableReps = availableReps.filter(rep => rep.managerId === selectedDmId);
  } else if (isLM) {
    const myDmIds = allUsers.filter(u => u.managerId === effectiveUser.id).map(u => u.id);
    availableReps = availableReps.filter(rep => myDmIds.includes(rep.managerId));
  } else if (selectedLmId && selectedLmId !== 'all') {
    const lmDmIds = allUsers.filter(u => u.managerId === selectedLmId).map(u => u.id);
    availableReps = availableReps.filter(rep => lmDmIds.includes(rep.managerId));
  } else if (isBU) {
    const subs = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(effectiveUser.id) : [];
    const subIds = new Set(subs.map(s => s.id));
    availableReps = availableReps.filter(rep => subIds.has(rep.id));
  }

  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All Medical Reps in Line';
  repSelect.appendChild(optAll);

  availableReps.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  availableReps.forEach(rep => {
    const opt = document.createElement('option');
    opt.value = rep.id;
    opt.textContent = rep.name;
    repSelect.appendChild(opt);
  });

  if (prevVal && repSelect.options.some(o => o.value === prevVal)) {
    repSelect.value = prevVal;
  } else {
    repSelect.value = 'all';
  }
}

function populateTabHierarchyFilters(tabKey, user, lineId) {
  populateTabLmOptions(tabKey, user, lineId);
  populateTabDmOptions(tabKey, user, lineId);
  populateTabRepOptions(tabKey, user, lineId);
}

// ==========================================
// TEST SCENARIOS
// ==========================================

console.log('\n--- SCENARIO 1: Admin on Line 1 (Cardio) ---');
populateTabHierarchyFilters('sales', { role: 'admin', id: 'u1790626000010' }, 'line_1790626000001');
console.log('LM Select (Line 1):', mockDOM['pharmSalesLmSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesLmSelect'].disabled);
console.log('DM Select (Line 1):', mockDOM['pharmSalesDmSelect'].options.map(o => o.textContent));
console.log('Rep Select (Line 1):', mockDOM['pharmSalesRepSelect'].options.map(o => o.textContent));

console.log('\n--- SCENARIO 2: Admin selects DM Amir Ayoup in Line 1 ---');
mockDOM['pharmSalesDmSelect'].value = 'u1790626000014'; // Amir Ayoup
populateTabRepOptions('sales', { role: 'admin', id: 'u1790626000010' }, 'line_1790626000001');
console.log('Amir Reps in Line 1:', mockDOM['pharmSalesRepSelect'].options.map(o => o.textContent));

console.log('\n--- SCENARIO 3: Admin on Line 2 (Neuro) ---');
mockDOM['pharmSalesLmSelect'].value = 'all';
mockDOM['pharmSalesDmSelect'].value = 'all';
mockDOM['pharmSalesRepSelect'].value = 'all';
populateTabHierarchyFilters('sales', { role: 'admin', id: 'u1790626000010' }, 'line_1790626000002');
console.log('LM Select (Line 2):', mockDOM['pharmSalesLmSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesLmSelect'].disabled);
console.log('DM Select (Line 2):', mockDOM['pharmSalesDmSelect'].options.map(o => o.textContent));

console.log('\n--- SCENARIO 4: Admin selects DM Amir Ayoup in Line 2 ---');
mockDOM['pharmSalesDmSelect'].value = 'u1790626000014'; // Amir Ayoup
populateTabRepOptions('sales', { role: 'admin', id: 'u1790626000010' }, 'line_1790626000002');
console.log('Amir Reps in Line 2:', mockDOM['pharmSalesRepSelect'].options.map(o => o.textContent));

console.log('\n--- SCENARIO 5: Amir Ayoup (DM) logged in on Line 1 ---');
const amirUser = users.find(u => u.name.includes('Amir'));
populateTabHierarchyFilters('sales', amirUser, 'line_1790626000001');
console.log('Amir LM:', mockDOM['pharmSalesLmSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesLmSelect'].disabled);
console.log('Amir DM:', mockDOM['pharmSalesDmSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesDmSelect'].disabled);
console.log('Amir Reps Line 1:', mockDOM['pharmSalesRepSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesRepSelect'].disabled);

console.log('\n--- SCENARIO 6: Rep Marco Magdy logged in ---');
const marcoUser = users.find(u => u.name.includes('Marco'));
populateTabHierarchyFilters('sales', marcoUser, 'line_1790626000001');
console.log('Marco LM:', mockDOM['pharmSalesLmSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesLmSelect'].disabled);
console.log('Marco DM:', mockDOM['pharmSalesDmSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesDmSelect'].disabled);
console.log('Marco Rep:', mockDOM['pharmSalesRepSelect'].options.map(o => o.textContent), 'disabled:', mockDOM['pharmSalesRepSelect'].disabled);

console.log('\n--- SCENARIO 7: Admin selects LM Mario Magdy in Line 2 ---');
mockDOM['pharmSalesLmSelect'].value = 'u1790626000013'; // Mario Magdy
mockDOM['pharmSalesDmSelect'].value = 'all';
mockDOM['pharmSalesRepSelect'].value = 'all';
populateTabDmOptions('sales', { role: 'admin', id: 'u1790626000010' }, 'line_1790626000002');
console.log('DMs under Mario Magdy:', mockDOM['pharmSalesDmSelect'].options.map(o => o.textContent));
populateTabRepOptions('sales', { role: 'admin', id: 'u1790626000010' }, 'line_1790626000002');
console.log('Reps under Mario Magdy:', mockDOM['pharmSalesRepSelect'].options.map(o => o.textContent));

