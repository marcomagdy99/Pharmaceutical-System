const fs = require('fs');

console.log('=== APPLYING FIX FOR DM SCHEDULE BUTTONS AND DARK MODE TEXT CONTRAST ===');

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
// 1. js/dashboard.js: Move dm-schedule-nav-btn into dm-schedule-header next to title
// ============================================================================
updateFile('js/dashboard.js', (code) => {
  const oldHeader = `      <div class="dashboard-card dm-schedule-card">
        <div class="dm-schedule-header">
          <div>
            <div class="dm-schedule-header-title-wrap">
              <span class="dm-followup-icon">🤝</span>
              <h3 class="card-title dm-followup-title">
                Field Accompaniment Schedule (Co-Visiting)
              </h3>
            </div>
            <div class="dm-schedule-tabs-wrap">
              <button type="button" class="dm-schedule-tab-btn \${activeTab === "all" ? "active" : ""}" onclick="window.switchDmScheduleTab('all')">
                📋 All Scheduled Days (\${scheduledDates.length})
              </button>
              <button type="button" class="dm-schedule-tab-btn \${activeTab === "daily" ? "active" : ""}" onclick="window.switchDmScheduleTab('daily')">
                📅 Daily View
              </button>
            </div>
          </div>

          <div class="dm-schedule-nav-btn">
            <a href="plans-review.html" class="btn btn-sm btn-primary">
              📋 <span>Review Plans & Schedule Accompaniment</span>
            </a>
          </div>
        </div>`;

  const newHeader = `      <div class="dashboard-card dm-schedule-card">
        <div class="dm-schedule-header">
          <div class="dm-schedule-header-title-wrap">
            <span class="dm-followup-icon">🤝</span>
            <h3 class="card-title dm-followup-title">
              Field Accompaniment Schedule (Co-Visiting)
            </h3>
          </div>

          <div class="dm-schedule-nav-btn">
            <a href="plans-review.html" class="btn btn-sm btn-primary">
              📋 <span>Review Plans & Schedule Accompaniment</span>
            </a>
          </div>
        </div>

        <div class="dm-schedule-tabs-wrap">
          <button type="button" class="dm-schedule-tab-btn \${activeTab === "all" ? "active" : ""}" onclick="window.switchDmScheduleTab('all')">
            📋 All Scheduled Days (\${scheduledDates.length})
          </button>
          <button type="button" class="dm-schedule-tab-btn \${activeTab === "daily" ? "active" : ""}" onclick="window.switchDmScheduleTab('daily')">
            📅 Daily View
          </button>
        </div>`;

  if (code.includes(oldHeader)) {
    return code.replace(oldHeader, newHeader);
  }
  console.error('FAIL: oldHeader not found in js/dashboard.js');
  return code;
});

// ============================================================================
// 2. css/style.css: Fix --primary-light in dark mode from #162a4a to #93c5fd
// ============================================================================
updateFile('css/style.css', (css) => {
  const oldPrimaryLight = `  --primary-light: #162a4a;`;
  const newPrimaryLight = `  --primary-light: #93c5fd;
  --primary-surface: #162a4a;`;

  if (css.includes(oldPrimaryLight)) {
    return css.replace(oldPrimaryLight, newPrimaryLight);
  }
  console.error('FAIL: oldPrimaryLight not found in css/style.css');
  return css;
});

// ============================================================================
// 3. css/dashboard.css:
//    - Add desktop .dm-schedule-header flex layout with title on left, button on right
//    - Ensure .dm-schedule-tabs-wrap has proper spacing
//    - Add crisp, high-contrast dark mode styles for .stat-card, .stat-label, and .stat-card-link-text
// ============================================================================
updateFile('css/dashboard.css', (css) => {
  let res = css;

  // 3A. Update DM Accompaniment Schedule Header & Card
  const oldScheduleCardCss = `/* DM Accompaniment Schedule Header & Card */
.dm-schedule-card {
  margin-bottom: 20px;
  border-inline-start: 4px solid var(--primary);
}
.dm-schedule-header-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dm-schedule-tabs-wrap {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
  flex-wrap: wrap;
}`;

  const newScheduleCardCss = `/* DM Accompaniment Schedule Header & Card */
.dm-schedule-card {
  margin-bottom: 20px;
  border-inline-start: 4px solid var(--primary);
}
.dm-schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.dm-schedule-header-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dm-schedule-nav-btn {
  display: inline-flex;
  align-items: center;
}
.dm-schedule-tabs-wrap {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}`;

  if (res.includes(oldScheduleCardCss)) {
    res = res.replace(oldScheduleCardCss, newScheduleCardCss);
    console.log('  Patched .dm-schedule-header and tabs in css/dashboard.css');
  } else {
    console.error('FAIL: oldScheduleCardCss not found in css/dashboard.css');
  }

  // 3B. High-contrast dark mode styles for stat cards
  const oldDarkStatCard = `[data-theme="dark"] .stat-card,
[data-theme="dark"] .dashboard-card {
    background-color: var(--surface-card);
    color: var(--text-primary);
    border: 1px solid #2d3340;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

[data-theme="dark"] .card-title {
    color: var(--text-primary);
}

[data-theme="dark"] .stat-label {
    color: var(--text-muted);
}

[data-theme="dark"] .stat-card-link {
    color: var(--text-muted);
}
[data-theme="dark"] .stat-card:hover .stat-card-link {
    color: var(--primary-light);
}

[data-theme="dark"] .stat-card .stat-value.primary { color: var(--primary-light); }
[data-theme="dark"] .stat-card .stat-value.success { color: var(--success); }
[data-theme="dark"] .stat-card .stat-value.warning { color: var(--warning); }
[data-theme="dark"] .stat-card .stat-value.danger  { color: var(--danger); }
[data-theme="dark"] .stat-card .stat-value.purple  { color: var(--purple-text); }`;

  const newDarkStatCard = `[data-theme="dark"] .stat-card,
[data-theme="dark"] .dashboard-card {
    background-color: var(--surface-card, #1e2229) !important;
    color: #f8fafc !important;
    border: 1px solid #2d3340 !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

[data-theme="dark"] .card-title {
    color: var(--text-primary);
}

[data-theme="dark"] .stat-label,
[data-theme="dark"] .stat-label-flex,
[data-theme="dark"] .stat-label-flex span {
    color: #cbd5e1 !important;
    font-weight: 600 !important;
}

[data-theme="dark"] .stat-card-link,
[data-theme="dark"] .stat-card-link-text {
    color: #60a5fa !important;
    font-weight: 700 !important;
}
[data-theme="dark"] .stat-card-link-card:hover .stat-card-link-text,
[data-theme="dark"] .stat-card:hover .stat-card-link {
    color: #93c5fd !important;
    text-decoration: underline !important;
}

[data-theme="dark"] .stat-card .stat-value.primary { color: #60a5fa !important; }
[data-theme="dark"] .stat-card .stat-value.success { color: #4ade80 !important; }
[data-theme="dark"] .stat-card .stat-value.warning { color: #fbbf24 !important; }
[data-theme="dark"] .stat-card .stat-value.danger  { color: #f87171 !important; }
[data-theme="dark"] .stat-card .stat-value.purple  { color: #c084fc !important; }`;

  if (res.includes(oldDarkStatCard)) {
    res = res.replace(oldDarkStatCard, newDarkStatCard);
    console.log('  Patched dark mode stat cards in css/dashboard.css');
  } else {
    console.error('FAIL: oldDarkStatCard not found in css/dashboard.css');
  }

  // 3C. Update lines 2614-2616 for [data-theme="dark"] .stat-card-link-text
  const oldStatCardLinkText = `[data-theme="dark"] .stat-card-link-text {
  color: var(--primary-light);
}`;
  const newStatCardLinkText = `[data-theme="dark"] .stat-card-link-text {
  color: #60a5fa !important;
}`;

  if (res.includes(oldStatCardLinkText)) {
    res = res.replace(oldStatCardLinkText, newStatCardLinkText);
    console.log('  Patched .stat-card-link-text in css/dashboard.css');
  }

  return res;
});

console.log('=== SCRIPT EXECUTION COMPLETED ===');
