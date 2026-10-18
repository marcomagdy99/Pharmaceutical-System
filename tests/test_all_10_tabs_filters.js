const fs = require('fs');

console.log('--- START AUDIT OF ALL 10 REPORT TABS ---');

// Check 1: Coverage Report has allAreas defined at top
const covReport = fs.readFileSync('js/coverage-report.js', 'utf8');
const covRenderHasAllAreas = covReport.includes('const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);');
const covExportHasAllAreas = covReport.includes('const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);');
console.log('Coverage report allAreas defined:', covRenderHasAllAreas && covExportHasAllAreas ? 'PASS' : 'FAIL');

// Check 2: Shared report caching and effectiveUser
const sharedReport = fs.readFileSync('js/shared-report.js', 'utf8');
const sharedHasPopulatedKey = sharedReport.includes('selectEl.dataset.populatedKey = lineKey;');
const sharedHasEffectiveUser = sharedReport.includes('const effectiveUser = user ||');
console.log('Shared report caching & effectiveUser:', sharedHasPopulatedKey && sharedHasEffectiveUser ? 'PASS' : 'FAIL');

// Check 3: Sales report auto-refresh removed & territory matching enhanced
const salesReport = fs.readFileSync('js/sales-report.js', 'utf8');
const salesNoAutoRefresh = !salesReport.includes('triggerPharmSalesAutoRefresh');
const salesHasTerritoryMatch = salesReport.includes('targetRepAreaNames.has(r.area.toLowerCase().trim())');
console.log('Sales report no auto-refresh:', salesNoAutoRefresh ? 'PASS' : 'FAIL');
console.log('Sales report territory matching:', salesHasTerritoryMatch ? 'PASS' : 'FAIL');

// Check 4: Achievements report auto-refresh removed & areaNameToIdMap added
const achReport = fs.readFileSync('js/achievements-report.js', 'utf8');
const achNoAutoRefresh = !achReport.includes('triggerAchAutoRefresh');
const achHasAreaNameToIdMap = achReport.includes('areaNameToIdMap.get(s.area.toLowerCase().trim())');
console.log('Achievements report no auto-refresh:', achNoAutoRefresh ? 'PASS' : 'FAIL');
console.log('Achievements report areaNameToIdMap:', achHasAreaNameToIdMap ? 'PASS' : 'FAIL');

// Check 5: Timeline report supports LM & DM teams
const timelineReport = fs.readFileSync('js/timeline-report.js', 'utf8');
const timelineHasLmTeam = timelineReport.includes('lmTeamIds.includes(v.repId)');
const timelineHasDmActs = timelineReport.includes('activityTargetIds = [selectedRep, ...dmReps];');
console.log('Timeline report team hierarchy matching:', timelineHasLmTeam && timelineHasDmActs ? 'PASS' : 'FAIL');

// Check 6: Directories (Doctors, Hospitals, Pharmacies) card display fallback
const docReport = fs.readFileSync('js/doctors-report.js', 'utf8');
const hospReport = fs.readFileSync('js/hospitals-report.js', 'utf8');
const pharmReport = fs.readFileSync('js/pharmacies-report.js', 'utf8');

const docCardPass = docReport.includes('const effectiveRepId = d.repId || (areaObj ? (areaObj.repId || null) : null);');
const hospCardPass = hospReport.includes('const effectiveRepId = h.repId || (areaObj ? (areaObj.repId || null) : null);');
const pharmCardPass = pharmReport.includes('const effectiveRepId = p.repId || (areaObj ? (areaObj.repId || null) : null);');

console.log('Doctors card display fallback:', docCardPass ? 'PASS' : 'FAIL');
console.log('Hospitals card display fallback:', hospCardPass ? 'PASS' : 'FAIL');
console.log('Pharmacies card display fallback:', pharmCardPass ? 'PASS' : 'FAIL');

// Check 7: Missing days no auto-render
const missingReport = fs.readFileSync('js/missing-days-report.js', 'utf8');
const missingNoAutoRender = !missingReport.includes('window.renderMissingDaysReport();\n    }');
console.log('Missing days no auto-render on preset:', missingNoAutoRender ? 'PASS' : 'FAIL');

// Check 8: GPS tracing no auto-render
const gpsReport = fs.readFileSync('js/gps-tracing-report.js', 'utf8');
const gpsNoAutoRender = !gpsReport.includes('window.renderGpsTracingReport();\n    }');
console.log('GPS tracing no auto-render on preset:', gpsNoAutoRender ? 'PASS' : 'FAIL');

// Check 9: Accounts costing no auto-render on init and prompt placeholder
const costingReport = fs.readFileSync('js/accounts-costing-report.js', 'utf8');
const reportsHtml = fs.readFileSync('reports.html', 'utf8');
const costingNoInitRender = !costingReport.includes('renderAccountsCostingReport();\n    CostingState.initialized = true;');
const costingHasPromptContainer = reportsHtml.includes('id="accountsCostingPromptContainer"');
const costingHasResultsContainer = reportsHtml.includes('id="accountsCostingResultsContainer"');
console.log('Accounts costing no auto-render on init:', costingNoInitRender ? 'PASS' : 'FAIL');
console.log('Accounts costing prompt container in HTML:', costingHasPromptContainer ? 'PASS' : 'FAIL');
console.log('Accounts costing results container in HTML:', costingHasResultsContainer ? 'PASS' : 'FAIL');

// Check 10: Targets line filter and table filtering
const targetsLineFilterInHtml = reportsHtml.includes('id="targetLineFilterSelect"');
const renderTargetsTableFilters = salesReport.includes('if (effLineId && effLineId !== \'all\')');
console.log('Targets modal line filter in HTML:', targetsLineFilterInHtml ? 'PASS' : 'FAIL');
console.log('Targets table filtered by line:', renderTargetsTableFilters ? 'PASS' : 'FAIL');

console.log('--- ALL CHECKS EVALUATED ---');
