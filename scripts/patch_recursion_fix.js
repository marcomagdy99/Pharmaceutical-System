const fs = require('fs');

// 1. Patch js/app.js
let app = fs.readFileSync('js/app.js', 'utf8');
const isAppCrlf = app.includes('\r\n');
const appTarget = 'window.getAreaManagerId = getAreaManagerId;';
const appReplacement = 'window.getAreaManagerId = getAreaManagerId;\nwindow.__appGetAreaManagerId = getAreaManagerId;';
if (app.includes(appTarget)) {
  const rep = isAppCrlf ? appReplacement.replace(/\n/g, '\r\n') : appReplacement;
  app = app.replace(appTarget, rep);
  fs.writeFileSync('js/app.js', app, 'utf8');
  console.log('PASS: js/app.js patched with window.__appGetAreaManagerId');
} else {
  console.error('FAIL: appTarget not found in js/app.js');
}

// 2. Patch js/visits.js
let visits = fs.readFileSync('js/visits.js', 'utf8');
const isVisitsCrlf = visits.includes('\r\n');
const normVisits = visits.replace(/\r\n/g, '\n');
const visitsTarget = 'function getAreaManagerId(area, allUsers = []) {\n  return window.getAreaManagerId ? window.getAreaManagerId(area, allUsers) : null;\n}';
const visitsReplacement = 'function getAreaManagerId(area, allUsers = []) {\n  const fn = (typeof window !== "undefined" && window.__appGetAreaManagerId);\n  return (typeof fn === "function") ? fn(area, allUsers) : null;\n}';

if (normVisits.includes(visitsTarget)) {
  const target = isVisitsCrlf ? visitsTarget.replace(/\n/g, '\r\n') : visitsTarget;
  const rep = isVisitsCrlf ? visitsReplacement.replace(/\n/g, '\r\n') : visitsReplacement;
  visits = visits.replace(target, rep);
  fs.writeFileSync('js/visits.js', visits, 'utf8');
  console.log('PASS: js/visits.js patched to call window.__appGetAreaManagerId safely');
} else {
  console.error('FAIL: visitsTarget not found in js/visits.js');
}
