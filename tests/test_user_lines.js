const fs = require('fs');

const appJs = fs.readFileSync('js/app.js', 'utf8');
const usersBlock = appJs.substring(appJs.indexOf('users: ['), appJs.indexOf('specialties: ['));
const areasBlock = appJs.substring(appJs.indexOf('areas: ['), appJs.indexOf('productLines: ['));
const linesBlock = appJs.substring(appJs.indexOf('productLines: ['), appJs.indexOf('distributors: ['));

const allUsers = eval('({' + usersBlock + '})').users;
const allAreas = eval('({' + areasBlock + '})').areas;
const productLines = eval('({' + linesBlock + '})').productLines;

function getUserLines(userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (!user) return [];
  const assignedLineIds = [...(user.lineIds || (user.lineId ? [user.lineId] : []))];
  productLines.forEach((l) => {
    if (l.lineManagerId === userId && !assignedLineIds.includes(l.id)) {
      assignedLineIds.push(l.id);
    }
  });
  if (user.role === 'admin' || user.role === 'hr') return productLines;
  if (assignedLineIds.length === 0 && user.managerId) {
    const mgr = allUsers.find((u) => u.id === user.managerId);
    if (mgr) {
      const mgrLines = mgr.lineIds || (mgr.lineId ? [mgr.lineId] : []);
      mgrLines.forEach((lId) => {
        if (!assignedLineIds.includes(lId)) assignedLineIds.push(lId);
      });
    }
  }
  if (assignedLineIds.length === 0) {
    allAreas.forEach((a) => {
      if (a.repId === userId && a.lineId && !assignedLineIds.includes(a.lineId)) {
        assignedLineIds.push(a.lineId);
      }
    });
  }
  return productLines.filter((l) => assignedLineIds.includes(l.id));
}

function getScopedTeam(lineId, user) {
  let candidateUsers = allUsers; // for admin
  let result = candidateUsers;
  if (lineId && lineId !== 'all') {
    result = candidateUsers.filter((u) => {
      if (u.id === user.id) return true;
      const uLineIds = getUserLines(u.id).map(l => l.id);
      if (uLineIds.includes(lineId)) return true;
      const subs = allUsers.filter((sub) => sub.managerId === u.id);
      return subs.some((sub) => {
        const subLines = getUserLines(sub.id).map(l => l.id);
        return subLines.includes(lineId);
      });
    });
  }
  return result;
}

const adminUser = allUsers.find(u => u.role === 'admin');

['all', 'line_1790626000001', 'line_1790626000002'].forEach(lid => {
  const team = getScopedTeam(lid, adminUser);
  const reps = team.filter(u => u.role === 'medical_rep');
  const dms = team.filter(u => u.role === 'district_manager');
  console.log(`\n=== Line: ${lid} ===`);
  console.log(`Reps (${reps.length}):`, reps.map(r => r.name));
  console.log(`DMs (${dms.length}):`, dms.map(d => d.name));
});
