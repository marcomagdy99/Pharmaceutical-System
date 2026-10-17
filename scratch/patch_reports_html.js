const fs = require('fs');

const filePath = 'reports.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Remove auto-refresh from Timeline
html = html.replace(
  /<select\s+id="timelineRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onTimelineFilterChange === 'function'\)\s*onTimelineFilterChange\(\);"/g,
  '<select id="timelineRepSelect" class="form-control"'
);
html = html.replace(
  /<input\s+type="date"\s+id="timelineDateFrom"\s+class="form-control"\s+onchange="if\s*\(typeof onTimelineFilterChange === 'function'\)\s*onTimelineFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="timelineDateFrom" class="form-control" />'
);
html = html.replace(
  /<input\s+type="date"\s+id="timelineDateTo"\s+class="form-control"\s+onchange="if\s*\(typeof onTimelineFilterChange === 'function'\)\s*onTimelineFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="timelineDateTo" class="form-control" />'
);

// 2. Remove auto-refresh from Coverage
html = html.replace(
  /<select\s+id="coverageRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onCoverageFilterChange === 'function'\)\s*onCoverageFilterChange\(\);"/g,
  '<select id="coverageRepSelect" class="form-control"'
);
html = html.replace(
  /<input\s+type="date"\s+id="coverageStartDate"\s+class="form-control"\s+onchange="if\s*\(typeof onCoverageFilterChange === 'function'\)\s*onCoverageFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="coverageStartDate" class="form-control" />'
);
html = html.replace(
  /<input\s+type="date"\s+id="coverageEndDate"\s+class="form-control"\s+onchange="if\s*\(typeof onCoverageFilterChange === 'function'\)\s*onCoverageFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="coverageEndDate" class="form-control" />'
);
html = html.replace(
  /<select\s+id="coverageClassFilter"\s+class="form-control"\s+onchange="if\s*\(typeof onCoverageFilterChange === 'function'\)\s*onCoverageFilterChange\(\);"/g,
  '<select id="coverageClassFilter" class="form-control"'
);

// 3. Remove auto-refresh from Doctors
html = html.replace(
  /<select\s+id="doctorRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onDoctorFilterChange === 'function'\)\s*onDoctorFilterChange\(\);"/g,
  '<select id="doctorRepSelect" class="form-control"'
);
html = html.replace(
  /<input\s+type="text"\s+id="doctorSearchInput"\s+class="form-control"\s+placeholder="Search by doctor name or code\.\.\."\s+oninput="if\s*\(typeof onDoctorFilterChange === 'function'\)\s*onDoctorFilterChange\(\);"\s*\/>/g,
  '<input type="text" id="doctorSearchInput" class="form-control" placeholder="Search by doctor name or code..." />'
);
html = html.replace(
  /<select\s+id="doctorSpecialtyFilter"\s+class="form-control"\s+onchange="if\s*\(typeof onDoctorFilterChange === 'function'\)\s*onDoctorFilterChange\(\);"/g,
  '<select id="doctorSpecialtyFilter" class="form-control"'
);
html = html.replace(
  /<select\s+id="doctorClassFilter"\s+class="form-control"\s+onchange="if\s*\(typeof onDoctorFilterChange === 'function'\)\s*onDoctorFilterChange\(\);"/g,
  '<select id="doctorClassFilter" class="form-control"'
);

// 4. Remove auto-refresh from Hospitals
html = html.replace(
  /<select\s+id="hospitalRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onHospitalFilterChange === 'function'\)\s*onHospitalFilterChange\(\);"/g,
  '<select id="hospitalRepSelect" class="form-control"'
);
html = html.replace(
  /<input\s+type="text"\s+id="hospitalSearchInput"\s+class="form-control"\s+placeholder="Search by hospital name or code\.\.\."\s+oninput="if\s*\(typeof onHospitalFilterChange === 'function'\)\s*onHospitalFilterChange\(\);"\s*\/>/g,
  '<input type="text" id="hospitalSearchInput" class="form-control" placeholder="Search by hospital name or code..." />'
);

// 5. Remove auto-refresh from Pharmacies
html = html.replace(
  /<select\s+id="pharmacyRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onPharmacyFilterChange === 'function'\)\s*onPharmacyFilterChange\(\);"/g,
  '<select id="pharmacyRepSelect" class="form-control"'
);
html = html.replace(
  /<input\s+type="text"\s+id="pharmacySearchInput"\s+class="form-control"\s+placeholder="Search by pharmacy name or code\.\.\."\s+oninput="if\s*\(typeof onPharmacyFilterChange === 'function'\)\s*onPharmacyFilterChange\(\);"\s*\/>/g,
  '<input type="text" id="pharmacySearchInput" class="form-control" placeholder="Search by pharmacy name or code..." />'
);

// 6. Remove auto-refresh from Missing Days
html = html.replace(
  /<input\s+type="date"\s+id="missingDateFrom"\s+class="form-control"\s+onchange="if\s*\(typeof onMissingDaysFilterChange === 'function'\)\s*onMissingDaysFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="missingDateFrom" class="form-control" />'
);
html = html.replace(
  /<input\s+type="date"\s+id="missingDateTo"\s+class="form-control"\s+onchange="if\s*\(typeof onMissingDaysFilterChange === 'function'\)\s*onMissingDaysFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="missingDateTo" class="form-control" />'
);
html = html.replace(
  /<select\s+id="missingRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onMissingDaysFilterChange === 'function'\)\s*onMissingDaysFilterChange\(\);"><\/select>/g,
  '<select id="missingRepSelect" class="form-control"></select>'
);

// 7. Remove auto-refresh from GPS Tracing
html = html.replace(
  /<input\s+type="date"\s+id="gpsTracingDate"\s+class="form-control"\s+onchange="if\s*\(typeof onGpsFilterChange === 'function'\)\s*onGpsFilterChange\(\);"\s*\/>/g,
  '<input type="date" id="gpsTracingDate" class="form-control" />'
);
html = html.replace(
  /<select\s+id="gpsShiftSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onGpsFilterChange === 'function'\)\s*onGpsFilterChange\(\);"/g,
  '<select id="gpsShiftSelect" class="form-control"'
);
html = html.replace(
  /<select\s+id="gpsStatusFilterSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onGpsFilterChange === 'function'\)\s*onGpsFilterChange\(\);"/g,
  '<select id="gpsStatusFilterSelect" class="form-control"'
);
html = html.replace(
  /<select\s+id="gpsRepSelect"\s+class="form-control"\s+onchange="if\s*\(typeof onGpsFilterChange === 'function'\)\s*onGpsFilterChange\(\);"><\/select>/g,
  '<select id="gpsRepSelect" class="form-control"></select>'
);

// 8. Add Product Line Filter at the top of targetsModal
if (!html.includes('id="targetLineFilterSelect"')) {
  const targetFormGridTarget = '<div class="modal-form-grid">\n              <input type="hidden" id="targetEditId" />';
  const targetLineFilterHtml = `<div class="modal-form-grid">
              <input type="hidden" id="targetEditId" />
              <div class="form-group col-span-2">
                <label class="form-label" data-i18n="lineFilterLabel">Product Line Filter</label>
                <select
                  id="targetLineFilterSelect"
                  class="form-control modern-select"
                  onchange="onTargetLineFilterChange()"
                >
                  <option value="all">All Product Lines</option>
                </select>
              </div>`;
  html = html.replace(targetFormGridTarget, targetLineFilterHtml);
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('reports.html successfully patched.');
