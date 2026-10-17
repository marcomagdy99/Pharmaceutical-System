const fs = require('fs');

const appJs = fs.readFileSync('js/app.js', 'utf8');
const usersBlock = appJs.substring(appJs.indexOf('users: ['), appJs.indexOf('specialties: ['));
const areasBlock = appJs.substring(appJs.indexOf('areas: ['), appJs.indexOf('productLines: ['));
const linesBlock = appJs.substring(appJs.indexOf('productLines: ['), appJs.indexOf('distributors: ['));

const allUsers = eval('({' + usersBlock + '})').users;
const allAreas = eval('({' + areasBlock + '})').areas;
const productLines = eval('({' + linesBlock + '})').productLines;

console.log('--- TEST DATA LOADED ---');
console.log('Users:', allUsers.length, 'Areas:', allAreas.length, 'Lines:', productLines.length);

const repUser = allUsers.find(u => u.role === 'medical_rep');
const dmUser = allUsers.find(u => u.role === 'district_manager');

console.log('Sample Rep:', repUser.id, repUser.name);
console.log('Sample DM:', dmUser.id, dmUser.name);
