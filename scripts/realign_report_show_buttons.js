const fs = require('fs');

console.log('=== REALIGNING SHOW BUTTONS ACROSS REPORT TABS ===');

function updateFile(filePath, mutator) {
  const content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  const norm = content.replace(/\r\n/g, '\n');
  const updatedNorm = mutator(norm);
  if (updatedNorm === norm) {
    console.warn(`WARN: No change made to ${filePath}`);
    return false;
  }
  const finalContent = isCrlf ? updatedNorm.replace(/\n/g, '\r\n') : updatedNorm;
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log(`SUCCESS: Updated ${filePath}`);
  return true;
}

// ============================================================================
// 1. reports.html
// ============================================================================
updateFile('reports.html', (html) => {
  let res = html;

  // 1A. Tab 5: Doctors List - Move col-class after col-rep so grid (4 cols) becomes:
  // Row 1: LM (1), DM (2), Rep (3), Class (4)
  // Row 2: Search (cols 1 & 2), Specialty (col 3), Show Button (col 4)
  const oldDocFilters = `                <div class="sales-filter-field col-rep" id="doctorRepFilterContainer">
                  <label for="doctorRepSelect" data-i18n="filterRep">Medical Rep:</label>
                  <select id="doctorRepSelect" class="form-control">
                    <option value="all">All Medical Reps in Line</option>
                  </select>
                </div>
                <!-- Search -->
                <div class="sales-filter-field col-search">
                  <label data-i18n="searchDoctors">Search:</label>
                  <input type="text" id="doctorSearchInput" class="form-control" data-i18n-placeholder="searchDoctorsPlaceholder" placeholder="Search by name, clinic, phone..." />
                </div>
                <!-- Specialty Filter -->
                <div class="sales-filter-field col-specialty">
                  <label data-i18n="specialty">Specialty:</label>
                  <select id="doctorSpecialtyFilter" class="form-control"
                  >
                    <option value="all" data-i18n="allSpecialties">
                      All Specialties
                    </option>
                  </select>
                </div>
                <!-- Class Filter -->
                <div class="sales-filter-field col-class">
                  <label data-i18n="doctorClass">Class:</label>
                  <select id="doctorClassFilter" class="form-control"
                  >
                    <option value="all" data-i18n="allClasses">
                      All Classes (A &amp; B)
                    </option>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                  </select>
                </div>`;

  const newDocFilters = `                <div class="sales-filter-field col-rep" id="doctorRepFilterContainer">
                  <label for="doctorRepSelect" data-i18n="filterRep">Medical Rep:</label>
                  <select id="doctorRepSelect" class="form-control">
                    <option value="all">All Medical Reps in Line</option>
                  </select>
                </div>
                <!-- Class Filter -->
                <div class="sales-filter-field col-class">
                  <label data-i18n="doctorClass">Class:</label>
                  <select id="doctorClassFilter" class="form-control"
                  >
                    <option value="all" data-i18n="allClasses">
                      All Classes (A &amp; B)
                    </option>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                  </select>
                </div>
                <!-- Search -->
                <div class="sales-filter-field col-search">
                  <label data-i18n="searchDoctors">Search:</label>
                  <input type="text" id="doctorSearchInput" class="form-control" data-i18n-placeholder="searchDoctorsPlaceholder" placeholder="Search by name, clinic, phone..." />
                </div>
                <!-- Specialty Filter -->
                <div class="sales-filter-field col-specialty">
                  <label data-i18n="specialty">Specialty:</label>
                  <select id="doctorSpecialtyFilter" class="form-control"
                  >
                    <option value="all" data-i18n="allSpecialties">
                      All Specialties
                    </option>
                  </select>
                </div>`;

  if (res.includes(oldDocFilters)) {
    res = res.replace(oldDocFilters, newDocFilters);
    console.log('  Patched Tab 5: Doctors List filter order in reports.html');
  } else {
    console.error('  FAIL: oldDocFilters not found in reports.html');
  }

  // 1B. Tab 8: Missing Days - Reorder hierarchy first, then dates, then Show button
  // Row 1: LM (1), DM (2), Rep (3)
  // Row 2: From Date (1), To Date (2), Show Button (3)
  const oldMissingFilters = `                <!-- Date From -->
                <div class="sales-filter-field col-month">
                  <label for="missingDateFrom" data-i18n="labelDateFrom">From Date:</label>
                  <input type="date" id="missingDateFrom" class="form-control" />
                </div>
                <!-- Date To -->
                <div class="sales-filter-field col-month">
                  <label for="missingDateTo" data-i18n="labelDateTo">To Date:</label>
                  <input type="date" id="missingDateTo" class="form-control" />
                </div>
                <!-- Line Filter (Hidden to prevent duplicate UI conflict with global #reportLineFilter) -->
                <div class="sales-filter-field col-product" style="display: none;">
                  <label for="missingLineSelect" data-i18n="lineFilterLabel">Product Line:</label>
                  <select id="missingLineSelect" class="form-control" onchange="onMissingDaysLineChange()"></select>
                </div>
                <!-- Hierarchy Filter: LM -> DM -> Rep -->
                <div class="sales-filter-field col-lm" id="missingLmFilterContainer">
                  <label for="missingLmSelect" data-i18n="filterLm">Line Manager (LM):</label>
                  <select id="missingLmSelect" class="form-control" onchange="onReportLmChange('missing-days')">
                    <option value="all">All Line Managers</option>
                  </select>
                </div>
                <div class="sales-filter-field col-dm" id="missingDmFilterContainer">
                  <label for="missingDmSelect" data-i18n="filterDm">District / DM:</label>
                  <select id="missingDmSelect" class="form-control" onchange="onReportDmChange('missing-days')"></select>
                </div>
                <div class="sales-filter-field col-rep" id="missingRepFilterContainer">
                  <label for="missingRepSelect" data-i18n="filterRep">Medical Rep:</label>
                  <select id="missingRepSelect" class="form-control"></select>
                </div>
                <!-- Show Button -->
                <div class="sales-filter-field col-btn">
                  <button type="button" class="btn btn-primary" onclick="renderMissingDaysReport()">
                    <span>🔍</span> <span data-i18n="btnShow">Show</span>
                  </button>
                </div>`;

  const newMissingFilters = `                <!-- Line Filter (Hidden to prevent duplicate UI conflict with global #reportLineFilter) -->
                <div class="sales-filter-field col-product" style="display: none;">
                  <label for="missingLineSelect" data-i18n="lineFilterLabel">Product Line:</label>
                  <select id="missingLineSelect" class="form-control" onchange="onMissingDaysLineChange()"></select>
                </div>
                <!-- Hierarchy Filter: LM -> DM -> Rep -->
                <div class="sales-filter-field col-lm" id="missingLmFilterContainer">
                  <label for="missingLmSelect" data-i18n="filterLm">Line Manager (LM):</label>
                  <select id="missingLmSelect" class="form-control" onchange="onReportLmChange('missing-days')">
                    <option value="all">All Line Managers</option>
                  </select>
                </div>
                <div class="sales-filter-field col-dm" id="missingDmFilterContainer">
                  <label for="missingDmSelect" data-i18n="filterDm">District / DM:</label>
                  <select id="missingDmSelect" class="form-control" onchange="onReportDmChange('missing-days')"></select>
                </div>
                <div class="sales-filter-field col-rep" id="missingRepFilterContainer">
                  <label for="missingRepSelect" data-i18n="filterRep">Medical Rep:</label>
                  <select id="missingRepSelect" class="form-control"></select>
                </div>
                <!-- Date From -->
                <div class="sales-filter-field col-month">
                  <label for="missingDateFrom" data-i18n="labelDateFrom">From Date:</label>
                  <input type="date" id="missingDateFrom" class="form-control" />
                </div>
                <!-- Date To -->
                <div class="sales-filter-field col-month">
                  <label for="missingDateTo" data-i18n="labelDateTo">To Date:</label>
                  <input type="date" id="missingDateTo" class="form-control" />
                </div>
                <!-- Show Button -->
                <div class="sales-filter-field col-btn">
                  <button type="button" class="btn btn-primary" onclick="renderMissingDaysReport()">
                    <span>🔍</span> <span data-i18n="btnShow">Show</span>
                  </button>
                </div>`;

  if (res.includes(oldMissingFilters)) {
    res = res.replace(oldMissingFilters, newMissingFilters);
    console.log('  Patched Tab 8: Missing Days filter order in reports.html');
  } else {
    console.error('  FAIL: oldMissingFilters not found in reports.html');
  }

  // 1C. Tab 4: Coverage - Move col-class after col-rep
  // Row 1: LM (1), DM (2), Rep (3), Class (4)
  // Row 2: From Date (1), To Date (2), Show + Export CSV (cols 3 & 4)
  const oldCovFilters = `                <div class="sales-filter-field col-rep" id="coverageRepFilterContainer">
                  <label for="coverageRepSelect" data-i18n="filterRep">Medical Rep:</label>
                  <select id="coverageRepSelect" class="form-control">
                    <option value="all">All Medical Reps in Line</option>
                  </select>
                </div>
                <div class="sales-filter-field col-date">
                  <label data-i18n="timelineFrom">From:</label>
                  <input type="date" id="coverageStartDate" class="form-control" />
                </div>
                <div class="sales-filter-field col-date">
                  <label data-i18n="timelineTo">To:</label>
                  <input type="date" id="coverageEndDate" class="form-control" />
                </div>
                <div class="sales-filter-field col-class">
                  <label data-i18n="doctorClass">Class:</label>
                  <select id="coverageClassFilter" class="form-control"
                  >
                    <option value="all" data-i18n="allTargets">All Targets (A, B & Hospitals)</option>
                    <option value="all_doctors" data-i18n="allDoctorsClassAB">
                      All Doctors (Class A & B)
                    </option>
                    <option value="A" data-i18n="classAOnly">Class A Only</option>
                    <option value="B" data-i18n="classBOnly">Class B Only</option>
                    <option value="hospital" data-i18n="hospitalsOnly">
                      Hospitals Only
                    </option>
                  </select>
                </div>`;

  const newCovFilters = `                <div class="sales-filter-field col-rep" id="coverageRepFilterContainer">
                  <label for="coverageRepSelect" data-i18n="filterRep">Medical Rep:</label>
                  <select id="coverageRepSelect" class="form-control">
                    <option value="all">All Medical Reps in Line</option>
                  </select>
                </div>
                <div class="sales-filter-field col-class">
                  <label data-i18n="doctorClass">Class:</label>
                  <select id="coverageClassFilter" class="form-control"
                  >
                    <option value="all" data-i18n="allTargets">All Targets (A, B & Hospitals)</option>
                    <option value="all_doctors" data-i18n="allDoctorsClassAB">
                      All Doctors (Class A & B)
                    </option>
                    <option value="A" data-i18n="classAOnly">Class A Only</option>
                    <option value="B" data-i18n="classBOnly">Class B Only</option>
                    <option value="hospital" data-i18n="hospitalsOnly">
                      Hospitals Only
                    </option>
                  </select>
                </div>
                <div class="sales-filter-field col-date">
                  <label data-i18n="timelineFrom">From:</label>
                  <input type="date" id="coverageStartDate" class="form-control" />
                </div>
                <div class="sales-filter-field col-date">
                  <label data-i18n="timelineTo">To:</label>
                  <input type="date" id="coverageEndDate" class="form-control" />
                </div>`;

  if (res.includes(oldCovFilters)) {
    res = res.replace(oldCovFilters, newCovFilters);
    console.log('  Patched Tab 4: Coverage filter order in reports.html');
  } else {
    console.error('  FAIL: oldCovFilters not found in reports.html');
  }

  return res;
});

// ============================================================================
// 2. css/reports.css
// ============================================================================
updateFile('css/reports.css', (css) => {
  let res = css;

  // Replace desktop grid setup in @media (min-width: 1100px)
  const oldDesktopGrid = `/* Unified Symmetrical Grid Templates per Tab */
@media (min-width: 1100px) {
    #tabPanel-sales .sales-filter-form-grid,
    #tabPanel-accounts-costing .sales-filter-form-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    #tabPanel-achievements .achievements-filter-group {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px 14px;
        align-items: flex-end;
        width: 100%;
    }

    #tabPanel-timeline .sales-filter-form-grid,
    #tabPanel-coverage .sales-filter-form-grid,
    #tabPanel-gps-tracing .sales-filter-form-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    #tabPanel-doctors .sales-filter-form-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    #tabPanel-doctors .sales-filter-field.col-search {
        grid-column: span 2;
    }

    #tabPanel-hospitals .sales-filter-form-grid,
    #tabPanel-pharmacies .sales-filter-form-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    #tabPanel-missing-days .sales-filter-form-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    #tabPanel-missing-days .sales-filter-field.col-btn {
        grid-column: span 2;
    }
}`;

  const newDesktopGrid = `/* Unified Symmetrical Grid Templates per Tab */
@media (min-width: 1100px) {
    #tabPanel-sales .sales-filter-form-grid,
    #tabPanel-accounts-costing .sales-filter-form-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    #tabPanel-achievements .achievements-filter-group {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px 14px;
        align-items: flex-end;
        width: 100%;
    }

    /* Tab 3: Timeline - 3 columns (LM, DM, Rep / From, To, Show+Today) */
    #tabPanel-timeline .sales-filter-form-grid,
    #tabPanel-gps-tracing .sales-filter-form-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    #tabPanel-timeline .sales-filter-field.col-btn {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 8px;
        width: 100%;
    }
    #tabPanel-timeline #btnShowTimelineReport {
        flex: 1 1 auto;
        max-width: 160px;
    }
    #tabPanel-timeline #timelineDateBadge {
        flex: 0 0 auto;
        height: 40px;
        padding: 0 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    /* Tab 4: Coverage - 4 columns (LM, DM, Rep, Class / From, To, Show+Export) */
    #tabPanel-coverage .sales-filter-form-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    #tabPanel-coverage .sales-filter-field.col-btn {
        grid-column: span 2;
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 10px;
    }
    #tabPanel-coverage #btnShowCoverageReport,
    #tabPanel-coverage #btnExportCoverageReport {
        flex: 1;
        max-width: 180px;
    }

    /* Tab 5: Doctors - 4 columns (LM, DM, Rep, Class / Search span 2, Specialty, Show) */
    #tabPanel-doctors .sales-filter-form-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    #tabPanel-doctors .sales-filter-field.col-search {
        grid-column: span 2;
    }
    #tabPanel-doctors .sales-filter-field.col-btn button {
        width: 100%;
        max-width: 180px;
    }

    /* Tab 6 & 7: Hospitals and Pharmacies - 5 columns */
    #tabPanel-hospitals .sales-filter-form-grid,
    #tabPanel-pharmacies .sales-filter-form-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    #tabPanel-hospitals .sales-filter-field.col-btn button,
    #tabPanel-pharmacies .sales-filter-field.col-btn button {
        width: 100%;
        max-width: 180px;
    }

    /* Tab 8: Missing Days - 3 columns (LM, DM, Rep / From, To, Show) */
    #tabPanel-missing-days .sales-filter-form-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    #tabPanel-missing-days .sales-filter-field.col-btn {
        grid-column: auto;
    }
    #tabPanel-missing-days .sales-filter-field.col-btn button {
        width: 100%;
        max-width: 180px;
    }

    /* Tab 9: Accounts Costing - 5 columns with inline action buttons */
    #tabPanel-accounts-costing .costing-filter-actions {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-end !important;
        gap: 6px !important;
        width: 100% !important;
    }
    #tabPanel-accounts-costing .costing-btn-show {
        flex: 2 1 0 !important;
        width: auto !important;
        max-width: none !important;
        height: 40px !important;
        padding: 0 8px !important;
        font-size: 0.82rem !important;
        white-space: nowrap !important;
    }
    #tabPanel-accounts-costing .costing-btn-reset {
        flex: 0 0 38px !important;
        width: 38px !important;
        min-width: 38px !important;
        max-width: 38px !important;
        height: 40px !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 1.1rem !important;
    }
    #tabPanel-accounts-costing .costing-btn-excel {
        flex: 2 1 0 !important;
        width: auto !important;
        max-width: none !important;
        height: 40px !important;
        padding: 0 8px !important;
        font-size: 0.82rem !important;
        white-space: nowrap !important;
    }
}`;

  if (res.includes(oldDesktopGrid)) {
    res = res.replace(oldDesktopGrid, newDesktopGrid);
    console.log('  Patched desktop grid rules in css/reports.css');
  } else {
    console.error('  FAIL: oldDesktopGrid not found in css/reports.css');
  }

  // Cap general max-width for show buttons
  const oldBtnRule = `.sales-filter-field.col-btn button:not(.costing-btn-reset) {
    width: 100%;
}`;

  const newBtnRule = `.sales-filter-field.col-btn button:not(.costing-btn-reset) {
    width: 100%;
    max-width: 220px;
}`;

  if (res.includes(oldBtnRule)) {
    res = res.replace(oldBtnRule, newBtnRule);
    console.log('  Patched max-width on col-btn button in css/reports.css');
  }

  return res;
});

console.log('=== REALIGNMENT FINISHED ===');
