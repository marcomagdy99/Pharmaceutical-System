/**
 * @file shared-report.js
 * @description Shared data store, translations, page lifecycle, cascading
 * hierarchy filters, modal hierarchy helpers, and generic CSV/Excel utilities
 * used by every tab on the Reports page. MUST load before the other
 * *-report.js files (sales, timeline, coverage, doctors, pharmacies).
 *
 * Changes in this revision:
 *  - Added escapeHtml()/renderSelectOptions()/appendSelectOptions() helpers
 *    and switched every <select> population routine that used raw innerHTML
 *    string concatenation over to safe DOM construction (fixes a stored-XSS
 *    risk: doctor/rep/pharmacy names now flow through .textContent instead
 *    of being interpolated into innerHTML).
 *  - populateLinesFilter / populateDMsFilter / populateRepsFilter now share
 *    the same option-building helper instead of duplicating the loop.
 *  - syncReportsData() no longer hardcodes a rep1/rep2 name fallback; it
 *    falls back to v.repName or a generic "Unknown Rep" label so a third
 *    rep doesn't silently get mislabeled as "Ahmed Mostafa".
 */

// ============================================================================
// Section 0: Shared DOM helpers
// ============================================================================

/**
 * Escapes a value for safe interpolation into innerHTML. Use this any time
 * a string that could originate from user input (imported CSV/Excel rows,
 * form fields, etc.) needs to be placed inside an HTML string rather than
 * set via textContent.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)