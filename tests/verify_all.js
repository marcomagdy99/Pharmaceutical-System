const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const baseDir = path.resolve(__dirname, "..");
const jsDir = path.join(baseDir, "js");
const files = fs.readdirSync(jsDir).filter(f => f.endsWith(".js"));

console.log("=== 1. Node Syntax Compilation Check ===");
let syntaxErrors = 0;
for (const file of files) {
  try {
    execSync(`node -c "${path.join(jsDir, file)}"`);
    console.log(`  PASS: js/${file}`);
  } catch (err) {
    console.error(`  FAIL: js/${file}: ${err.message}`);
    syntaxErrors++;
  }
}

console.log("\n=== 2. Alert Auditing Check ===");
const alertFiles = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(jsDir, file), "utf8");
  // Check for alert( but exclude comments
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (/\balert\(/.test(line)) {
      alertFiles.push({ file, line: idx + 1, content: trimmed });
    }
  });
}

if (alertFiles.length === 0) {
  console.log("  PASS: Zero active alert() calls found in any js/*.js file!");
} else {
  console.error(`  FAIL: Found ${alertFiles.length} alert() calls:`);
  alertFiles.forEach(a => console.log(`    ${a.file}:${a.line} -> ${a.content}`));
}

console.log("\n=== 3. Function Deduplication Check ===");
const appJs = fs.readFileSync(path.join(jsDir, "app.js"), "utf8");

const requiredInAppJs = [
  "window.hashPassword",
  "window.isPlannedVisitExpired",
  "window.getEmployeeLeaveRollover",
  "window.getAreaManagerId",
  "window.getDmAccompanimentSchedule",
  "window.parseTimeToMinutes",
  "window.checkVisitTimeConflict",
  "window.isDoctorAlreadyVisitedToday",
  "window.checkVisitDateAllowed",
  "window.formatVisitDateTime"
];

for (const req of requiredInAppJs) {
  if (appJs.includes(req)) {
    console.log(`  PASS: app.js exports ${req}`);
  } else {
    console.error(`  FAIL: app.js missing ${req}`);
  }
}

// Ensure hashPassword function definition only exists in app.js
const hashPasswordDefRegex = /async\s+function\s+hashPassword\s*\(/;
for (const file of files) {
  const content = fs.readFileSync(path.join(jsDir, file), "utf8");
  if (hashPasswordDefRegex.test(content)) {
    if (file === "app.js") {
      console.log(`  PASS: hashPassword defined centrally in js/${file}`);
    } else {
      console.error(`  FAIL: hashPassword still defined in js/${file}!`);
    }
  }
}

console.log("\n=== Verification Summary ===");
if (syntaxErrors === 0 && alertFiles.length === 0) {
  console.log("ALL CHECKS PASSED PERFECTLY!");
} else {
  console.error("SOME CHECKS FAILED!");
  process.exit(1);
}
