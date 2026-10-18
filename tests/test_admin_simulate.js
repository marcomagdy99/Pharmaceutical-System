const fs = require('fs');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Parse users, areas, lines from app.js
const usersBlock = appJs.substring(appJs.indexOf('users: ['), appJs.indexOf('specialties: ['));
const areasBlock = appJs.substring(appJs.indexOf('areas: ['), appJs.indexOf('productLines: ['));
const linesBlock = appJs.substring(appJs.indexOf('productLines: ['), appJs.indexOf('distributors: ['));

const allUsers = eval('({' + usersBlock + '})').users;
const allAreas = eval('({' + areasBlock + '})').areas;
const productLines = eval('({' + linesBlock + '})').productLines;

// Let's inspect getScopedTeamForLine from app.js
const scopedTeamFn = new Function('lineId', 'user', 'users', `
  let candidateUsers = users; // for admin
  let result = candidateUsers;
  if (lineId && lineId !== 'all') {
    result = candidateUsers.filter((u) => {
      if (u.id === user.id) return true;
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      if (uLineIds.includes(lineId)) return true;

      const subs = users.filter((sub) => sub.managerId === u.id);
      return subs.some((sub) => {
        const subLines = sub.lineIds || (sub.lineId ? [sub.lineId] : []);
        return subLines.includes(lineId);
      });
    });
  }
  return result;
`);

const adminUser = allUsers.find(u => u.role === 'admin');

function simulatePopulate(selectedLineId) {
  const scopedTeam = scopedTeamFn(selectedLineId, adminUser, allUsers);
  let vacantAreas = allAreas.filter((a) => !a.repId);
  if (selectedLineId !== 'all') {
    vacantAreas = vacantAreas.filter((a) => a.lineId === selectedLineId);
  }

  const dms = scopedTeam.filter((u) => u.id !== adminUser.id && (u.role === 'district_manager' || u.role === 'dm'));
  const reps = scopedTeam.filter((u) => u.id !== adminUser.id && (u.role === 'medical_rep' || u.role === 'rep'));

  console.log('Selected Line:', selectedLineId);
  console.log('DMs (' + dms.length + '):', dms.map(d => d.name));
  console.log('Reps (' + reps.length + '):', reps.map(r => r.name + ' (mgr: ' + r.managerId + ')'));
  
  // How groups are built:
  console.log('--- Groups built in populateUnifiedReportEmployeeFilters ---');
  if (dms.length > 0) {
    console.log('  OPTGROUP: District Managers (DMs) with ' + dms.length + ' options:');
    dms.forEach(d => console.log('    - ' + d.name));

    dms.forEach(dm => {
      const dmReps = reps.filter(r => r.managerId === dm.id);
      console.log('  OPTGROUP: Team ' + dm.name + ' (Reps) with ' + dmReps.length + ' options:');
      dmReps.forEach(r => console.log('    - ' + r.name));
    });

    const otherReps = reps.filter((r) => !dms.some((dm) => dm.id === r.managerId));
    console.log('  OPTGROUP: Other Reps with ' + otherReps.length + ' options:');
    otherReps.forEach(r => console.log('    - ' + r.name));
  }
}

simulatePopulate('all');
console.log('=============================');
simulatePopulate('line_1790626000001');
console.log('=============================');
simulatePopulate('line_1790626000002');
