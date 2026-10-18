/**
 * @file test_user_territories_modal.js
 * Unit test for Dynamic User Territories Modal, Line Filtering, and Badge Rendering
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== Starting User Territories Modal & Line Filter Test ===\n');

// 1. Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => {
    return {
      textContent: '',
      innerHTML: '',
      value: '',
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      addEventListener: () => {}
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {} };

require('../js/app.js');
require('../js/store.js');

// 2. Load users.js functions
const usersCode = fs.readFileSync('js/users.js', 'utf8');

// Compile userMgmt
eval(usersCode);

assert(window.userMgmt, 'userMgmt must be defined');
console.log('✓ userMgmt loaded successfully');

// Initialize userMgmt data
window.userMgmt.users = window.DEMO_DATA.users;
window.userMgmt.lines = window.DEMO_DATA.productLines;

// 3. Test getUserAssignedAreas for DM with multi-line coverage
const amirDM = window.userMgmt.users.find(u => u.name === 'Amir Ayoup');
assert(amirDM, 'Amir Ayoup DM must exist');
const amirAreas = window.userMgmt.getUserAssignedAreas(amirDM);
console.log(`✓ Amir Ayoup (DM) assigned areas: ${amirAreas.length}`);
assert(amirAreas.length >= 2, 'Amir should have multiple areas across his team');

// 4. Test formatAreasBadges output
const badgeHtml = window.userMgmt.formatAreasBadges(amirAreas, 'badge-primary', amirDM);
assert(badgeHtml.includes('openUserTerritoriesModal'), 'Must include openUserTerritoriesModal click event');
console.log('✓ formatAreasBadges correctly links to modal: ' + badgeHtml.replace(/<[^>]+>/g, ' ').trim());

// 5. Test Multi-Line User (John Mahfouz - LM)
const johnLM = window.userMgmt.users.find(u => u.name === 'John Mahfouz');
assert(johnLM, 'John Mahfouz LM must exist');
const johnAreas = window.userMgmt.getUserAssignedAreas(johnLM);
console.log(`✓ John Mahfouz (LM) assigned areas: ${johnAreas.length}`);

// Test modal data initialization
window.userMgmt.openUserTerritoriesModal(johnLM.id);
const modalData = window.userMgmt.currentTerritoriesModalData;
assert(modalData, 'Modal data must be populated');
assert.strictEqual(modalData.user.id, johnLM.id, 'User ID in modal must match');
console.log(`✓ Modal data initialized with ${modalData.areas.length} enriched areas`);

// Check if multiple lines detected
const uniqueLines = new Set(modalData.areas.map(a => a.lineId).filter(Boolean));
console.log(`✓ John Mahfouz manages territories across ${uniqueLines.size} product lines`);
assert(uniqueLines.size >= 2, 'Should detect multiple lines for line filtering');

// 6. Test Line Filter Switching
window.userMgmt.setTerritoriesLineFilter('line_1790626000001');
assert.strictEqual(window.userMgmt.activeTerritoriesLineFilter, 'line_1790626000001', 'Line filter must be updated');
console.log('✓ Line filter set to Cardio Line');

window.userMgmt.setTerritoriesLineFilter('all');
assert.strictEqual(window.userMgmt.activeTerritoriesLineFilter, 'all', 'Line filter reset to all');
console.log('✓ Line filter reset to all');

console.log('\n=== ALL TESTS PASSED (100%) ===');
