// Verified dead-code removal. Every edit is validated against the exact expected text; any mismatch aborts that file untouched.
const fs = require('fs');
const path = require('path');
const jsDir = path.resolve(__dirname, '..', 'js');

// { file, lines: [[lineNumber, regexItMustMatch], ...] }  -- single-line deletions (applied bottom-up)
const lineDeletes = [
  ['achievements-report.js', [[306, /^\s*const allProducts = getAllProductsFlat\(\);\s*$/]]],
  ['activities-tab-expenses.js', [[131, /^\s*let pendingCount = 0;\s*$/], [139, /^\s*pendingCount\+\+;\s*$/]]],
  ['areas.js', [[753, /^\s*const currentAreas = getAreasList\(\);\s*$/]]],
  ['coverage-report.js', [[703, /^\s*const numMonths = Math\.max\(1, Math\.round\(diffDays \/ 30\)\);\s*$/]]],
  ['doctors-report.js', [[473, /^\s*const repSelect = document\.getElementById\("doctorRepInput"\);\s*$/], [390, /^\s*const repInput = document\.getElementById\("doctorRepInput"\);\s*$/]]],
  ['hospitals-report.js', [[358, /^\s*const repSelect = document\.getElementById\("hospitalRepInput"\);\s*$/]]],
  ['pharmacies-report.js', [[358, /^\s*const repSelect = document\.getElementById\("pharmacyRepInput"\);\s*$/], [292, /^\s*const repInput = document\.getElementById\("pharmacyRepInput"\);\s*$/]]],
  ['leaves.js', [
    [1728, /^\s*const dateRangeStr = formatLeaveDateRange\(l\.startDate, l\.endDate, lang\);\s*$/],
    [1418, /^\s*if \(typeof updateNavPendingBadges === "function"\) updateNavPendingBadges\(\);\s*$/],
    [1378, /^\s*const lang = getSysLang\(\);\s*$/],
    [1285, /^\s*const dateRangeStr = formatLeaveDateRange\(l\.startDate, l\.endDate, lang\);\s*$/],
    [1056, /^\s*const todayStr = getSysToday\(\);\s*$/]]],
  ['login.js', [[108, /^const errorMessage = document\.getElementById\('errorMessage'\);\s*$/]]],
  ['plans-review.js', [
    [440, /^\s*const isSupervisorOnly = /], [439, /^\s*const isAdmin = role === "admin";\s*$/], [438, /^\s*const isDM = role === "district_manager" \|\| role === "dm";\s*$/]]],
  ['products.js', [[1176, /^\s*const isAr = currentLang === "ar";\s*$/]]],
  ['sales-report.js', [[155, /^\s*const productSelect = document\.getElementById\('pharmSalesProductSelect'\);\s*$/]]],
  ['visits.js', [
    [2859, /^\s*const buLineIds = /],
    [2044, /^\s*const needed = minPmRequired - totalPm;\s*$/],
    [1170, /^\s*const isBU = currentUserRole === "business_unit" \|\| currentUserRole === "bu";\s*$/],
    [1168, /^\s*const isLM = currentUserRole === "line_manager" \|\| currentUserRole === "lm";\s*$/]]],
];

// Multi-line range deletions: [file, startLine, endLine, startRe, endRe]
const rangeDeletes = [
  ['visits.js', 2566, 2581, /^\s*let icon = /, /^\s*$/], // unused icon computation + trailing blank line
  ['reschedule.js', 485, 487, /^\s*if \(typeof renderStats === "function"\) \{\s*$/, /^\s*\}\s*$/],
  ['shared-report.js', 511, 518, /^\s*const productContainer = /, /^\s*\}\s*$/],
];

// Exact multi-line text replacements: [file, from, to]
const replaces = [
  ['visits.js',
    'if (typeof renderCurrentView === "function") {\n      renderCurrentView();\n    } else {\n      if (typeof renderVisitsList === "function") renderVisitsList();\n      if (typeof renderStats === "function") renderStats();\n      if (typeof renderVisitsTimeline === "function") renderVisitsTimeline(hasLoadedTimelineOnce);\n    }',
    'if (typeof renderVisitsTimeline === "function") renderVisitsTimeline(hasLoadedTimelineOnce);'],
  ['visits.js',
    'targetActUserIds = (typeof reportingReps !== "undefined" && reportingReps.length > 0)\n        ? reportingReps.map((r) => r.id)\n        : allUsers.map((u) => u.id);',
    'targetActUserIds = allUsers.map((u) => u.id);'],
];

const byFile = {};
const touch = (f) => (byFile[f] = byFile[f] || { lines: [], ranges: [], reps: [] });
lineDeletes.forEach(([f, ls]) => ls.forEach((x) => touch(f).lines.push(x)));
rangeDeletes.forEach(([f, a, b, sre, ere]) => touch(f).ranges.push([a, b, sre, ere]));
replaces.forEach(([f, from, to]) => touch(f).reps.push([from, to]));

let ok = 0, failed = 0;
for (const [f, job] of Object.entries(byFile)) {
  const p = path.join(jsDir, f);
  const raw = fs.readFileSync(p, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let text = raw;
  let abort = null;

  // 1) text replacements first (position independent)
  for (const [from, to] of job.reps) {
    const F = from.replace(/\n/g, eol), T = to.replace(/\n/g, eol);
    const count = text.split(F).length - 1;
    if (count !== 1) { abort = `replace target found ${count}x (expected 1): ${from.slice(0, 50)}...`; break; }
    text = text.replace(F, () => T);
  }
  if (abort) { console.error('SKIP', f, '->', abort); failed++; continue; }

  // line numbers refer to the ORIGINAL file; if replacements shifted lines, bail out safely
  if (job.reps.length && (job.lines.length || job.ranges.length)) {
    // replaced regions in visits.js are located after the deletions below only if they are later in file; recompute by content instead
  }
  let lines = text.split(eol);
  // Because replacements may shift later line numbers, apply deletions on the ORIGINAL numbering by working on original lines.
  const origLines = raw.split(eol);
  const toDelete = new Set();
  for (const [n, re] of job.lines) {
    if (!re.test(origLines[n - 1] || '')) { abort = `line ${n} mismatch: ${(origLines[n - 1] || '').trim().slice(0, 80)}`; break; }
    toDelete.add(n);
  }
  if (!abort) for (const [a, b, sre, ere] of job.ranges) {
    if (!sre.test(origLines[a - 1] || '') || !ere.test(origLines[b - 1] || '')) { abort = `range ${a}-${b} mismatch`; break; }
    for (let i = a; i <= b; i++) toDelete.add(i);
  }
  if (abort) { console.error('SKIP', f, '->', abort); failed++; continue; }

  // Apply: rebuild from the original lines with deletions, then run the text replacements on the result.
  let rebuilt = origLines.filter((_, i) => !toDelete.has(i + 1)).join(eol);
  for (const [from, to] of job.reps) {
    const F = from.replace(/\n/g, eol), T = to.replace(/\n/g, eol);
    if (rebuilt.split(F).length - 1 !== 1) { abort = 'replace target disappeared after deletions'; break; }
    rebuilt = rebuilt.replace(F, () => T);
  }
  if (abort) { console.error('SKIP', f, '->', abort); failed++; continue; }
  fs.writeFileSync(p, rebuilt);
  console.log('OK  ', f.padEnd(28), `deleted ${toDelete.size} line(s), ${job.reps.length} replacement(s)`);
  ok++;
}
console.log(`\nDone: ${ok} file(s) updated, ${failed} skipped.`);
