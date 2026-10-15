const fs = require('fs');

const filePath = 'js/timeline-report.js';
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');

let norm = normalize(content);

// 1. Summary Bar
const t1 = `    summaryBar.innerHTML = \`
      <div class="timeline-stat-chip">
        <span>Period:</span>
        <strong style="color: var(--primary); font-size: 1rem; margin: 0 6px;">\${rangeLabel}</strong>
      </div>
      <div class="timeline-stat-chip">
        <strong class="stat-value" style="color: var(--primary);">\${totalItems}</strong>
        <span class="stat-label">Total Events</span>
      </div>
      <div class="timeline-stat-chip">
        <strong class="stat-value" style="color: #b45309;">\${actualVisitCount}</strong>
        <span class="stat-label">
          <span class="legend-dot actual" style="width:7px; height:7px; margin-inline-end:3px;"></span>
          Actual Visits
        </span>
      </div>
      <div class="timeline-stat-chip">
        <strong class="stat-value" style="color: #0284c7;">\${plannedVisitCount}</strong>
        <span class="stat-label">
          <span class="legend-dot planned" style="width:7px; height:7px; margin-inline-end:3px;"></span>
          From Plan
        </span>
      </div>
      <div class="timeline-stat-chip">
        <strong class="stat-value" style="color: #6b21a8;">\${activityCount}</strong>
        <span class="stat-label">
          <span class="legend-dot activity" style="background:#9333ea; width:7px; height:7px; margin-inline-end:3px;"></span>
          Activities
        </span>
      </div>
    \`;`;

const r1 = `    summaryBar.innerHTML = \`
      <div class="timeline-stat-chip">
        <span>Period:</span>
        <strong class="timeline-period-label">\${rangeLabel}</strong>
      </div>
      <div class="timeline-stat-chip total-events">
        <strong class="stat-value stat-val-primary">\${totalItems}</strong>
        <span class="stat-label">Total Events</span>
      </div>
      <div class="timeline-stat-chip actual-events">
        <strong class="stat-value stat-val-actual">\${actualVisitCount}</strong>
        <span class="stat-label">
          <span class="legend-dot actual legend-dot-mini"></span>
          Actual Visits
        </span>
      </div>
      <div class="timeline-stat-chip planned-events">
        <strong class="stat-value stat-val-planned">\${plannedVisitCount}</strong>
        <span class="stat-label">
          <span class="legend-dot planned legend-dot-mini"></span>
          From Plan
        </span>
      </div>
      <div class="timeline-stat-chip joint-events">
        <strong class="stat-value stat-val-activity">\${activityCount}</strong>
        <span class="stat-label">
          <span class="legend-dot activity legend-dot-mini"></span>
          Activities
        </span>
      </div>
    \`;`;

// 2. Initial Empty Cards
const t2 = `  if (combinedTimeline.length === 0) {
    container.innerHTML = \`
      <div class="timeline-empty-card" style="text-align: center; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color, #dee2e6);">
        <span style="font-size: 2.5rem;">📅</span>
        <h4 style="margin: 10px 0 4px; color: var(--gray-700);">No visits or activities recorded in this period</h4>
        <p style="color: var(--gray-500); font-size: 0.85rem;">Try a different date or date range</p>
      </div>
    \`;
    if (pharmContainer) {
      pharmContainer.innerHTML = \`
        <div class="timeline-empty-card" style="text-align: center; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color, #dee2e6);">
          <span style="font-size: 2.5rem;">💊</span>
          <h4 style="margin: 10px 0 4px; color: var(--gray-700);">No pharmacy visits recorded in this period</h4>
        </div>
      \`;
    }
    return;
  }`;

const r2 = `  if (combinedTimeline.length === 0) {
    container.innerHTML = \`
      <div class="timeline-empty-card">
        <span class="timeline-empty-icon">📅</span>
        <h4 class="timeline-empty-title">No visits or activities recorded in this period</h4>
        <p class="timeline-empty-subtitle">Try a different date or date range</p>
      </div>
    \`;
    if (pharmContainer) {
      pharmContainer.innerHTML = \`
        <div class="timeline-empty-card">
          <span class="timeline-empty-icon">💊</span>
          <h4 class="timeline-empty-title">No pharmacy visits recorded in this period</h4>
        </div>
      \`;
    }
    return;
  }`;

// 3. Event Card InnerHTML
const t3 = `    card.innerHTML = \`
      <div class="timeline-time-col">
        <span style="font-size:0.8rem; color:var(--gray-500); font-weight:600; white-space:nowrap;">\${v.date}</span>
        <span class="timeline-period-pill \${periodClass}">\${period}</span>
        <div class="timeline-icon-dot \${dotClass}"></div>
      </div>
      <div class="timeline-content-box \${borderClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <strong class="timeline-target-title" style="font-size: 1.05rem; \${isActivity ? 'color: #6b21a8;' : ''}">\${safeTargetName}</strong>
          <span class="visit-badge-pill \${badgeClass}">\${badgeLabel}</span>
        </div>
        \${isActivity ? \`
          <div style="font-size: 0.88rem; color: var(--gray-700); margin-bottom: 6px; line-height: 1.5;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #6b21a8;">
              Activity Type: <strong>\${safeActivityType}</strong>
            </span>
            \${safeSpecialty ? \`• <span style="color: var(--gray-600);">Notes: <em>"\${safeSpecialty}"</em></span>\` : ''}
            • <span style="font-weight: 500;">Employee: <strong>\${safeRepName}</strong></span>
          </div>
        \` : \`
          <div style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 6px;">
            <span>\${safeSpecialty}</span> • <span>Class: <strong>\${safeClass}</strong></span> • <span>Rep: <strong>\${safeRepName}</strong></span>
          </div>
        \`}
        <div class="timeline-entry-timestamp" style="font-size: 0.78rem; padding: 6px 10px; border-radius: 6px; display: inline-flex; gap: 8px 14px; flex-wrap: wrap; align-items: center;">
          <span><strong>📅 Visit Day:</strong> \${v.date} \${period}</span>
          <span><strong>⏰ Visit Time:</strong> \${v.time || '10:00'}</span>
          <span style="opacity: 0.95; border-inline-start: 1px solid currentColor; padding-inline-start: 10px;">
            <strong>📥 Insertion Date:</strong> \${v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date)}
            • <strong>Time:</strong> \${v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || '10:00'))}
          </span>
        </div>
      </div>
    \`;`;

const r3 = `    card.innerHTML = \`
      <div class="timeline-time-col">
        <span class="timeline-date-label">\${v.date}</span>
        <span class="timeline-period-pill \${periodClass}">\${period}</span>
        <div class="timeline-icon-dot \${dotClass}"></div>
      </div>
      <div class="timeline-content-box \${borderClass}">
        <div class="timeline-card-header">
          <strong class="timeline-target-title \${isActivity ? 'is-activity' : ''}">\${safeTargetName}</strong>
          <span class="visit-badge-pill \${badgeClass}">\${badgeLabel}</span>
        </div>
        \${isActivity ? \`
          <div class="timeline-activity-desc">
            <span class="timeline-activity-type">
              Activity Type: <strong>\${safeActivityType}</strong>
            </span>
            \${safeSpecialty ? \`• <span class="timeline-activity-notes">Notes: <em>"\${safeSpecialty}"</em></span>\` : ''}
            • <span class="timeline-activity-rep">Employee: <strong>\${safeRepName}</strong></span>
          </div>
        \` : \`
          <div class="timeline-visit-details">
            <span>\${safeSpecialty}</span> • <span>Class: <strong>\${safeClass}</strong></span> • <span>Rep: <strong>\${safeRepName}</strong></span>
          </div>
        \`}
        <div class="timeline-entry-timestamp">
          <span><strong>📅 Visit Day:</strong> \${v.date} \${period}</span>
          <span><strong>⏰ Visit Time:</strong> \${v.time || '10:00'}</span>
          <span class="timeline-ts-insertion">
            <strong>📥 Insertion Date:</strong> \${v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date)}
            • <strong>Time:</strong> \${v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || '10:00'))}
          </span>
        </div>
      </div>
    \`;`;

// 4. Medical / Pharmacy empty states
const t4 = `  if (reportMedicalCount === 0) {
    container.innerHTML = \`
      <div class="timeline-empty-card" style="text-align: center; padding: 36px 16px;">
        <span style="font-size: 2.2rem;">🩺</span>
        <h4 style="margin: 8px 0 4px; color: var(--gray-700);">No Doctor or Hospital visits in this period</h4>
      </div>
    \`;
  }
  const pharmBox = document.getElementById('timelineReportPharmacyContainer');
  if (pharmBox && reportPharmacyCount === 0) {
    pharmBox.innerHTML = \`
      <div class="timeline-empty-card" style="text-align: center; padding: 36px 16px;">
        <span style="font-size: 2.2rem;">💊</span>
        <h4 style="margin: 8px 0 4px; color: var(--gray-700);">No Pharmacy visits in this period</h4>
      </div>
    \`;
  }`;

const r4 = `  if (reportMedicalCount === 0) {
    container.innerHTML = \`
      <div class="timeline-empty-card timeline-empty-card-sm">
        <span class="timeline-empty-icon timeline-empty-icon-sm">🩺</span>
        <h4 class="timeline-empty-title">No Doctor or Hospital visits in this period</h4>
      </div>
    \`;
  }
  const pharmBox = document.getElementById('timelineReportPharmacyContainer');
  if (pharmBox && reportPharmacyCount === 0) {
    pharmBox.innerHTML = \`
      <div class="timeline-empty-card timeline-empty-card-sm">
        <span class="timeline-empty-icon timeline-empty-icon-sm">💊</span>
        <h4 class="timeline-empty-title">No Pharmacy visits in this period</h4>
      </div>
    \`;
  }`;

if (!norm.includes(normalize(t1))) {
  console.error('ERROR: Target 1 not found');
  process.exit(1);
}
if (!norm.includes(normalize(t2))) {
  console.error('ERROR: Target 2 not found');
  process.exit(1);
}
if (!norm.includes(normalize(t3))) {
  console.error('ERROR: Target 3 not found');
  process.exit(1);
}
if (!norm.includes(normalize(t4))) {
  console.error('ERROR: Target 4 not found');
  process.exit(1);
}

norm = norm
  .replace(normalize(t1), normalize(r1))
  .replace(normalize(t2), normalize(r2))
  .replace(normalize(t3), normalize(r3))
  .replace(normalize(t4), normalize(r4));

const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('SUCCESS: All timeline report inline styles refactored successfully!');
