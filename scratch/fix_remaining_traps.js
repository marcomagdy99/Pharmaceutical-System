const fs = require("fs");
const path = require("path");

const norm = (s) => s.replace(/\r\n/g, "\n");

// 1. Fix plans-review.js
const plansPath = path.resolve(__dirname, "../js/plans-review.js");
let plansContent = norm(fs.readFileSync(plansPath, "utf8"));
const targetPlans = `function getDmAccompanimentSchedule(dmId) {
  return window.getDmAccompanimentSchedule ? window.getDmAccompanimentSchedule(dmId) : {};
}`;
const replacePlans = `var getDmAccompanimentSchedule = (typeof window !== "undefined" && window.getDmAccompanimentSchedule) || function (dmId) {
  try {
    const raw = localStorage.getItem("pharma_dm_accompaniments");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[dmId]) return data[dmId];
    }
  } catch (e) {}
  return {};
};`;

if (!plansContent.includes(targetPlans)) {
  console.error("targetPlans not found!");
  process.exit(1);
}
plansContent = plansContent.replace(targetPlans, replacePlans);
fs.writeFileSync(plansPath, plansContent, "utf8");
console.log("Fixed plans-review.js");

// 2. Fix profile.js
const profilePath = path.resolve(__dirname, "../js/profile.js");
let profileContent = norm(fs.readFileSync(profilePath, "utf8"));
const targetProfile = `function getEmployeeLeaveRollover(userId, targetYear) {
  return window.getEmployeeLeaveRollover ? window.getEmployeeLeaveRollover(userId, targetYear) : {`;
const replaceProfile = `var getEmployeeLeaveRollover = (typeof window !== "undefined" && window.getEmployeeLeaveRollover) || function (userId, targetYear) {
  return {`;

if (!profileContent.includes(targetProfile)) {
  console.error("targetProfile not found!");
  process.exit(1);
}
profileContent = profileContent.replace(targetProfile, replaceProfile);
fs.writeFileSync(profilePath, profileContent, "utf8");
console.log("Fixed profile.js");
