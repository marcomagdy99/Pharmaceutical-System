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

// Patch js/accounts-costing-report.js
patchFile('js/accounts-costing-report.js', [
  {
    desc: 'Remove renderAccountsCostingReport from filter change functions',
    target: `  function onAccountsCostingLineChange() {
    populateCostingRepOptions();
    populateCostingAreaOptions();
    renderAccountsCostingReport();
  }

  function onAccountsCostingDmChange() {
    populateCostingRepOptions();
    populateCostingAreaOptions();
    renderAccountsCostingReport();
  }

  function onAccountsCostingRepChange() {
    populateCostingAreaOptions();
    renderAccountsCostingReport();
  }

  function onAccountsCostingSearchInput(val) {
    CostingState.searchTerm = (val || "").trim().toLowerCase();
    filterAndDisplayCostingRows();
  }`,
    replacement: `  function onAccountsCostingLineChange() {
    populateCostingRepOptions();
    populateCostingAreaOptions();
  }

  function onAccountsCostingDmChange() {
    populateCostingRepOptions();
    populateCostingAreaOptions();
  }

  function onAccountsCostingRepChange() {
    populateCostingAreaOptions();
  }

  function onAccountsCostingSearchInput(val) {
    CostingState.searchTerm = (val || "").trim().toLowerCase();
  }`
  },
  {
    desc: 'Toggle prompt and results container in renderAccountsCostingReport',
    target: `  function renderAccountsCostingReport() {
    const user = getCurrentUser();`,
    replacement: `  function renderAccountsCostingReport() {
    const promptEl = document.getElementById("accountsCostingPromptContainer");
    const resultsEl = document.getElementById("accountsCostingResultsContainer");
    if (promptEl) promptEl.style.display = "none";
    if (resultsEl) resultsEl.style.display = "block";
    const user = getCurrentUser();`
  },
  {
    desc: 'Improve rep and DM filtering on accountRows in accounts-costing',
    target: `    if (repVal && repVal !== "all") {
      accountRows = accountRows.filter((r) =>
        r.repId === repVal ||
        (r.transactions && r.transactions.some((t) => t.repId === repVal))
      );
    }
    if (dmVal && dmVal !== "all" && !scope.isDM && !scope.isRep) {
      const dmSubUsers = allUsers.filter((u) => u.dmId === dmVal || u.managerId === dmVal);
      const dmRepIds = new Set(dmSubUsers.map((u) => u.id));
      accountRows = accountRows.filter((r) =>
        dmRepIds.has(r.repId) ||
        (r.transactions && r.transactions.some((t) => dmRepIds.has(t.repId)))
      );
    }`,
    replacement: `    if (repVal && repVal !== "all") {
      const repUser = allUsers.find((u) => u.id === repVal);
      const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
      const repAreaIds = new Set(allAreas.filter((a) => a.repId === repVal || repUserAreaIds.includes(a.id)).map((a) => a.id));
      accountRows = accountRows.filter((r) =>
        r.repId === repVal ||
        (r.areaId && repAreaIds.has(r.areaId)) ||
        (r.transactions && r.transactions.some((t) => t.repId === repVal || (t.areaId && repAreaIds.has(t.areaId))))
      );
    }
    if (dmVal && dmVal !== "all" && !scope.isDM && !scope.isRep) {
      const dmSubUsers = allUsers.filter((u) => u.dmId === dmVal || u.managerId === dmVal || u.id === dmVal);
      const dmRepIds = new Set(dmSubUsers.map((u) => u.id));
      const dmUser = allUsers.find((u) => u.id === dmVal);
      const dmUserAreaIds = dmUser ? (dmUser.areaIds || (dmUser.areaId ? [dmUser.areaId] : [])) : [];
      const dmAreaIds = new Set(allAreas.filter((a) => (a.repId && dmRepIds.has(a.repId)) || dmUserAreaIds.includes(a.id) || a.dmId === dmVal).map((a) => a.id));
      accountRows = accountRows.filter((r) =>
        dmRepIds.has(r.repId) ||
        (r.areaId && dmAreaIds.has(r.areaId)) ||
        (r.transactions && r.transactions.some((t) => dmRepIds.has(t.repId) || (t.areaId && dmAreaIds.has(t.areaId))))
      );
    }`
  }
]);

// Patch reports.html
patchFile('reports.html', [
  {
    desc: 'Update accounts costing search input in reports.html',
    target: `<input type="text" id="accountsCostingSearchInput" class="form-control" placeholder="Type doctor or clinic name..." oninput="onAccountsCostingSearchInput(this.value)" />`,
    replacement: `<input type="text" id="accountsCostingSearchInput" class="form-control" placeholder="Type doctor or clinic name..." oninput="onAccountsCostingSearchInput(this.value)" onkeyup="if (event.key === 'Enter') renderAccountsCostingReport();" />`
  },
  {
    desc: 'Remove onchange auto-render from costing expenses checkbox',
    target: `<input type="checkbox" id="accountsCostingOnlyWithExpenses" onchange="renderAccountsCostingReport()" />`,
    replacement: `<input type="checkbox" id="accountsCostingOnlyWithExpenses" />`
  },
  {
    desc: 'Add accounts costing prompt placeholder and results container wrap',
    target: `            <!-- Direct Table Container -->
            <div class="table-container" style="margin-top: 16px; overflow-x: auto;">
              <table class="report-table" id="accountsCostingTable">
                <thead id="accountsCostingThead">
                  <!-- Generated dynamically in accounts-costing-report.js -->
                </thead>
                <tbody id="accountsCostingTbody">
                  <!-- Generated dynamically in accounts-costing-report.js -->
                </tbody>
                <tfoot id="accountsCostingTfoot">
                  <!-- Summary totals row generated dynamically in accounts-costing-report.js -->
                </tfoot>
              </table>
            </div>`,
    replacement: `            <!-- Accounts Costing Prompt Placeholder -->
            <div class="report-show-prompt" id="accountsCostingPromptContainer">
              <div class="report-show-prompt-icon">💼</div>
              <h3 class="report-show-prompt-title" data-i18n="promptShowCostingTitle">Click Show to View Accounts Costing Report</h3>
              <p class="report-show-prompt-desc" data-i18n="promptShowCostingDesc">Select date range and employee filters, then click Show to calculate account investments, clinic services, and sponsorship expenses.</p>
              <button type="button" class="btn btn-primary" onclick="renderAccountsCostingReport()">
                <span>🔍</span> <span data-i18n="btnShow">Show Report</span>
              </button>
            </div>

            <!-- Accounts Costing Results Container -->
            <div id="accountsCostingResultsContainer" style="display: none;">
              <div class="table-container" style="margin-top: 16px; overflow-x: auto;">
                <table class="report-table" id="accountsCostingTable">
                  <thead id="accountsCostingThead">
                    <!-- Generated dynamically in accounts-costing-report.js -->
                  </thead>
                  <tbody id="accountsCostingTbody">
                    <!-- Generated dynamically in accounts-costing-report.js -->
                  </tbody>
                  <tfoot id="accountsCostingTfoot">
                    <!-- Summary totals row generated dynamically in accounts-costing-report.js -->
                  </tfoot>
                </table>
              </div>
            </div>`
  }
]);

console.log('ALL PATCHES COMPLETED!');
