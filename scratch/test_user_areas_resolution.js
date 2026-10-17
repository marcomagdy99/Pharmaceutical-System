const fs = require('fs');

global.window = global;
global.document = { addEventListener: () => {}, dispatchEvent: () => {} };
global.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {} };
require('../js/app.js');
require('../js/store.js');

const users = global.DEMO_DATA.users;
const allAreas = global.DEMO_DATA.areas || [];
const allLines = global.DEMO_DATA.productLines || [];

function getUserAssignedAreas(user) {
  if (!user) return [];
  const role = (user.role || "").toUpperCase();

  // 1. Rep
  if (role === "REP" || role === "MEDICAL_REP") {
    return allAreas.filter(a => a.repId === user.id);
  }

  // 2. DM: Reps under DM
  if (role === "DM" || role === "DISTRICT_MANAGER") {
    const repIds = new Set(users.filter(u => u.managerId === user.id).map(u => u.id));
    return allAreas.filter(a => repIds.has(a.repId));
  }

  // 3. LM: DMs under LM, Reps under those DMs
  if (role === "LM" || role === "LINE_MANAGER") {
    const dmIds = new Set(users.filter(u => u.managerId === user.id).map(u => u.id));
    const repIds = new Set(users.filter(u => dmIds.has(u.managerId) || u.managerId === user.id).map(u => u.id));
    return allAreas.filter(a => repIds.has(a.repId));
  }

  // 4. BU: Subordinates or Lines
  if (role === "BU" || role === "BUSINESS_UNIT") {
    const lmIds = new Set(users.filter(u => u.managerId === user.id).map(u => u.id));
    const dmIds = new Set(users.filter(u => lmIds.has(u.managerId) || u.managerId === user.id).map(u => u.id));
    const repIds = new Set(users.filter(u => dmIds.has(u.managerId) || lmIds.has(u.managerId) || u.managerId === user.id).map(u => u.id));
    let areas = allAreas.filter(a => repIds.has(a.repId));
    if (areas.length === 0 && user.lineIds && user.lineIds.length > 0) {
      areas = allAreas.filter(a => user.lineIds.includes(a.lineId));
    }
    return areas;
  }

  // 5. PM: Lines
  if (role === "PM" || role === "PRODUCT_MANAGER") {
    const userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    return allAreas.filter(a => userLineIds.includes(a.lineId));
  }

  return [];
}

users.forEach(u => {
  const areas = getUserAssignedAreas(u);
  if (areas.length > 0) {
    const lineIds = [...new Set(areas.map(a => a.lineId).filter(Boolean))];
    const lines = lineIds.map(lid => (allLines.find(l => l.id === lid) || {}).name || lid);
    console.log(`${u.name} (${u.role}): ${areas.length} areas across ${lines.length} lines [${lines.join(', ')}]`);
  }
});
