const fs = require('fs');

const appJs = fs.readFileSync('js/app.js', 'utf8');

// Extract users, areas, productLines from app.js
const usersBlock = appJs.substring(appJs.indexOf('users: ['), appJs.indexOf('specialties: ['));
const areasBlock = appJs.substring(appJs.indexOf('areas: ['), appJs.indexOf('productLines: ['));
const linesBlock = appJs.substring(appJs.indexOf('productLines: ['), appJs.indexOf('distributors: ['));

const users = eval('({' + usersBlock + '})').users;
const areas = eval('({' + areasBlock + '})').areas;
const productLines = eval('({' + linesBlock + '})').productLines;

console.log('Users count:', users.length);
console.log('Areas count:', areas.length);
console.log('ProductLines count:', productLines.length);

// Now simulate getScopedTeamForLine
function normalizeRole(r) { return (r || '').toLowerCase().trim(); }

function getAllSubordinates(userId, allUsers) {
  const direct = allUsers.filter((u) => u.managerId === userId);
  let all = [...direct];
  direct.forEach((d) => {
    all = all.concat(getAllSubordinates(d.id, allUsers));
  });
  return all;
}

function getScopedTeamForLine(lineId, user, allUsers) {
  if (!user) return [];
  const role = normalizeRole(user.role);
  let candidateUsers = [];
  if (role === 'medical_rep' || role === 'rep') {
    candidateUsers = [user];
  } else if (role === 'admin' || role === 'hr') {
    candidateUsers = allUsers;
  } else if (role === 'business_unit' || role === 'bu' || role === 'line_manager' || role === 'lm') {
    const subordinates = getAllSubordinates(user.id, allUsers);
    candidateUsers = [user, ...subordinates];
  } else if (role === 'district_manager' || role === 'dm') {
    const myReps = allUsers.filter((u) => u.managerId === user.id);
    candidateUsers = [user, ...myReps];
  } else {
    candidateUsers = allUsers;
  }

  let result = candidateUsers;
  if (lineId && lineId !== 'all') {
    result = candidateUsers.filter((u) => {
      if (u.id === user.id) return true;
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      if (uLineIds.includes(lineId)) return true;
      const subs = allUsers.filter((sub) => sub.managerId === u.id);
      return subs.some((sub) => {
        const subLines = sub.lineIds || (sub.lineId ? [sub.lineId] : []);
        return subLines.includes(lineId);
      });
    });
  }
  return result;
}

// Test with admin user
const adminUser = users.find(u => u.role === 'admin') || { id: 'admin', role: 'admin' };
console.log('\n--- Testing with Admin, lineId = "all" ---');
const teamAll = getScopedTeamForLine('all', adminUser, users);
console.log('Scoped team count:', teamAll.length);
const dms = teamAll.filter(u => u.role === 'district_manager' || u.role === 'dm');
const reps = teamAll.filter(u => u.role === 'medical_rep' || u.role === 'rep');
console.log('DMs count:', dms.length, dms.map(d => d.name));
console.log('Reps count:', reps.length, reps.map(r => r.name));

console.log('\n--- Testing with Admin, lineId = "line_1790626000001" ---');
const teamL1 = getScopedTeamForLine('line_1790626000001', adminUser, users);
console.log('Scoped team count for line 1:', teamL1.length);
const dmsL1 = teamL1.filter(u => u.role === 'district_manager' || u.role === 'dm');
const repsL1 = teamL1.filter(u => u.role === 'medical_rep' || u.role === 'rep');
console.log('DMs for line 1:', dmsL1.map(d => d.name));
console.log('Reps for line 1:', repsL1.map(r => r.name));
