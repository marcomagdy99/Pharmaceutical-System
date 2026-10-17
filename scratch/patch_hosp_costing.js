const fs = require('fs');

function patchFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalEnding = content.includes('\r\n') ? '\r\n' : '\n';
  let normalized = content.replace(/\r\n/g, '\n');

  for (const { target, replacement, desc } of replacements) {
    const normTarget = target.replace(/\r\n/g, '\n');
    const normReplacement = replacement.replace(/\r\n/g, '\n');
    if (!normalized.includes(normTarget)) {
      console.error(`FAILED to find target for: ${desc} in ${filePath}`);
      process.exit(1);
    }
    normalized = normalized.replace(normTarget, normReplacement);
    console.log(`OK: ${desc} in ${filePath}`);
  }

  if (originalEnding === '\r\n') {
    normalized = normalized.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, normalized, 'utf8');
  console.log(`Saved: ${filePath}`);
}

// 1. Hospital report fallback
patchFile('js/hospitals-report.js', [
  {
    desc: 'Fix hospital card rep display fallback',
    target: `const effectiveRepId = areaObj ? (areaObj.repId || null) : (h.repId || null);`,
    replacement: `const effectiveRepId = h.repId || (areaObj ? (areaObj.repId || null) : null);`
  }
]);

// 2. Accounts costing init and preset auto-render removal
patchFile('js/accounts-costing-report.js', [
  {
    desc: 'Remove renderAccountsCostingReport on init',
    target: `  function initAccountsCostingTab() {
    const currentUser = getCurrentUser();
    populateCostingFilters(currentUser);
    setDefaultCostingDates();
    renderAccountsCostingReport();
    CostingState.initialized = true;
  }`,
    replacement: `  function initAccountsCostingTab() {
    const currentUser = getCurrentUser();
    populateCostingFilters(currentUser);
    setDefaultCostingDates();
    CostingState.initialized = true;
  }`
  },
  {
    desc: 'Remove renderAccountsCostingReport in setAccountsCostingPeriodPreset',
    target: `    } else if (presetKey === "allTime") {
      fromInput.value = "";
      toInput.value = "";
    }

    renderAccountsCostingReport();
  }`,
    replacement: `    } else if (presetKey === "allTime") {
      fromInput.value = "";
      toInput.value = "";
    }
    // Preset updated; rendered strictly on Show button click
  }`
  }
]);

console.log('HOSPITALS AND COSTING FIXED!');
