const fs = require('fs');

const filePath = 'js/app.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

// 1. Refactor renderSidebar
const oldSidebarTarget = `  let html = \`
    <div class="sidebar-header" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--gray-100);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="company-logo-badge" style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #0d6efd, #0a58ca); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.1rem;">
          ⚕
        </div>
        <div>
          <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--gray-800); margin: 0; line-height: 1.1;">PharmaCare</h2>
          <span style="font-size: 0.7rem; color: var(--gray-500);">CRM Healthcare</span>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="closeMobileSidebar()" style="background: none; border: none; font-size: 1.6rem; color: var(--gray-500); cursor: pointer; padding: 2px 6px;">
        &times;
      </button>
    </div>
    
    <div class="sidebar-nav">
      <div style="padding: 10px 24px 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-400); font-weight: 700; letter-spacing: 0.5px;">
        Main Menu
      </div>
      <ul style="list-style: none; padding: 0; margin: 0;">
  \`;

  primaryNavItems.forEach((item) => {
    const activeClass = item.id === resolved ? "active" : "";
    const pendingCount = getNavPendingCount(item.id, user);
    const badgeHtml =
      pendingCount > 0
        ? \`<span class="badge bg-danger rounded-pill nav-pending-badge ms-auto" style="font-size: 0.72rem; padding: 2px 7px; box-shadow: 0 2px 4px rgba(220,53,69,0.3); font-weight: 700;">\${pendingCount}</span>\`
        : "";
    html += \`
      <li class="nav-item">
        <a href="\${item.link}" onclick="closeMobileSidebar()" class="nav-link \${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: \${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: \${item.id === resolved ? "600" : "500"}; background: \${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
          <span style="font-size: 1.1rem; width: 22px; text-align: center;">\${getIconSymbol(item.id)}</span>
          <span data-i18n="\${item.i18n}">\${(translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id}</span>
          \${badgeHtml}
        </a>
      </li>
    \`;
  });

  if (managementNavItems.length > 0) {
    html += \`
      <li class="nav-header" role="presentation" style="list-style: none;">
        <div style="padding: 16px 24px 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-400); font-weight: 700; letter-spacing: 0.5px;">
          Management & Data
        </div>
      </li>
    \`;
    managementNavItems.forEach((item) => {
      const activeClass = item.id === resolved ? "active" : "";
      const pendingCount = getNavPendingCount(item.id, user);
      const badgeHtml =
        pendingCount > 0
          ? \`<span class="badge bg-danger rounded-pill nav-pending-badge ms-auto" style="font-size: 0.72rem; padding: 2px 7px; box-shadow: 0 2px 4px rgba(220,53,69,0.3); font-weight: 700;">\${pendingCount}</span>\`
          : "";
      html += \`
        <li class="nav-item">
          <a href="\${item.link}" onclick="closeMobileSidebar()" class="nav-link \${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: \${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: \${item.id === resolved ? "600" : "500"}; background: \${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
            <span style="font-size: 1.1rem; width: 22px; text-align: center;">\${getIconSymbol(item.id)}</span>
            <span data-i18n="\${item.i18n}">\${(translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id}</span>
            \${badgeHtml}
          </a>
        </li>
      \`;
    });
  }

  html += \`</ul></div>
    <div class="sidebar-footer" style="padding: 16px 20px; border-top: 1px solid var(--gray-100); background: var(--gray-50); margin-top: auto;">
      <div class="user-info" style="display: flex; align-items: center; gap: 10px;">
        <div class="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
          \${user.name ? user.name.charAt(0) : "U"}
        </div>
        <div class="details" style="flex: 1; min-width: 0;">
          <div class="name" style="font-weight: 600; font-size: 0.88rem; color: var(--gray-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            \${lang === "ar" ? user.nameAr || user.name : user.name}
          </div>
          <div class="role" style="font-size: 0.75rem; color: var(--gray-500);">
            \${getRoleBadge(user.role, lang)}
          </div>
        </div>
      </div>
    </div>
  \`;`;

const newSidebarReplacement = `  let html = \`
    <div class="sidebar-header">
      <div class="sidebar-brand-box">
        <div class="company-logo-badge">
          ⚕
        </div>
        <div class="sidebar-brand-titles">
          <h2 class="sidebar-brand-h2">PharmaCare</h2>
          <span class="sidebar-brand-sub">CRM Healthcare</span>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="closeMobileSidebar()" aria-label="Close Sidebar">
        &times;
      </button>
    </div>
    
    <div class="sidebar-nav">
      <div class="sidebar-section-title">
        Main Menu
      </div>
      <ul class="sidebar-nav-list">
  \`;

  primaryNavItems.forEach((item) => {
    const activeClass = item.id === resolved ? "active" : "";
    const pendingCount = getNavPendingCount(item.id, user);
    const badgeHtml =
      pendingCount > 0
        ? \`<span class="badge bg-danger rounded-pill nav-pending-badge sidebar-pending-badge ms-auto">\${pendingCount}</span>\`
        : "";
    html += \`
      <li class="nav-item">
        <a href="\${item.link}" onclick="closeMobileSidebar()" class="nav-link sidebar-nav-link \${activeClass}">
          <span class="sidebar-nav-icon">\${getIconSymbol(item.id)}</span>
          <span data-i18n="\${item.i18n}">\${(translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id}</span>
          \${badgeHtml}
        </a>
      </li>
    \`;
  });

  if (managementNavItems.length > 0) {
    html += \`
      <li class="nav-header" role="presentation">
        <div class="sidebar-section-title sidebar-section-title-mt">
          Management & Data
        </div>
      </li>
    \`;
    managementNavItems.forEach((item) => {
      const activeClass = item.id === resolved ? "active" : "";
      const pendingCount = getNavPendingCount(item.id, user);
      const badgeHtml =
        pendingCount > 0
          ? \`<span class="badge bg-danger rounded-pill nav-pending-badge sidebar-pending-badge ms-auto">\${pendingCount}</span>\`
          : "";
      html += \`
        <li class="nav-item">
          <a href="\${item.link}" onclick="closeMobileSidebar()" class="nav-link sidebar-nav-link \${activeClass}">
            <span class="sidebar-nav-icon">\${getIconSymbol(item.id)}</span>
            <span data-i18n="\${item.i18n}">\${(translations[lang] && translations[lang][item.i18n]) || (translations.en && translations.en[item.i18n]) || item.id}</span>
            \${badgeHtml}
          </a>
        </li>
      \`;
    });
  }

  html += \`</ul></div>
    <div class="sidebar-footer">
      <div class="sidebar-user-info">
        <div class="sidebar-user-avatar">
          \${user.name ? user.name.charAt(0) : "U"}
        </div>
        <div class="sidebar-user-details">
          <div class="sidebar-user-name">
            \${lang === "ar" ? user.nameAr || user.name : user.name}
          </div>
          <div class="sidebar-user-role">
            \${getRoleBadge(user.role, lang)}
          </div>
        </div>
      </div>
    </div>
  \`;`;

// Normalize line endings for replacement
const normalize = s => s.replace(/\r\n/g, '\n');
const isCrlf = content.includes('\r\n');

let normalizedContent = normalize(content);
const normalizedOldSidebar = normalize(oldSidebarTarget);
const normalizedNewSidebar = normalize(newSidebarReplacement);

if (!normalizedContent.includes(normalizedOldSidebar)) {
    console.error('ERROR: Could not find oldSidebarTarget in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(normalizedOldSidebar, normalizedNewSidebar);
console.log('PASS: Sidebar successfully replaced');

// 2. Refactor Topbar
// Replace notification wrapper inside incremental update
const oldTopIncNotif = normalize(`        notifWrapper.innerHTML = \`
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="notif-unread-count-badge" id="topbarNotifBadge" style="\${unreadNotifCount > 0 ? '' : 'display: none;'}">\${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" style="display: none;" onclick="event.stopPropagation()"></div>
        \`;`);

const newTopIncNotif = normalize(`        notifWrapper.innerHTML = \`
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="notif-unread-count-badge \${unreadNotifCount > 0 ? '' : 'd-none'}" id="topbarNotifBadge">\${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" onclick="event.stopPropagation()"></div>
        \`;`);

if (!normalizedContent.includes(oldTopIncNotif)) {
    console.error('ERROR: Could not find oldTopIncNotif in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldTopIncNotif, newTopIncNotif);
console.log('PASS: Topbar incremental notification wrapper replaced');

// Replace topbar pending badges (2 occurrences)
const oldTopbarBadge = normalize(`const badge = pCount > 0 ? \` <span class="badge bg-danger rounded-pill nav-pending-badge ms-1" style="font-size: 0.65rem; padding: 1px 5px;">\${pCount}</span>\` : "";`);
const newTopbarBadge = normalize(`const badge = pCount > 0 ? \` <span class="badge bg-danger rounded-pill nav-pending-badge topbar-nav-pending-badge ms-1">\${pCount}</span>\` : "";`);

if (!normalizedContent.includes(oldTopbarBadge)) {
    console.error('ERROR: Could not find oldTopbarBadge in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replaceAll(oldTopbarBadge, newTopbarBadge);
console.log('PASS: Topbar pending badges replaced');

// Replace topbar full template brand image, cloudSyncStatus, notifBell
const oldBrandImg = normalize(`<img src="images/pharma-icon-192.png" alt="PharmaCare Logo" class="pharma-brand-img" width="34" height="34" style="border-radius:8px;object-fit:cover;flex-shrink:0;box-shadow:0 2px 6px rgba(13,110,253,0.35);">`);
const newBrandImg = normalize(`<img src="images/pharma-icon-192.png" alt="PharmaCare Logo" class="pharma-brand-img" width="34" height="34">`);

if (!normalizedContent.includes(oldBrandImg)) {
    console.error('ERROR: Could not find oldBrandImg in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldBrandImg, newBrandImg);
console.log('PASS: Brand image replaced');

const oldCloudSync = normalize(`      <div id="cloudSyncStatus" style="display: inline-flex; align-items: center; margin-inline: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-size: 0.75rem; font-weight: 600;" title="Realtime Cloud Sync Active">
          <span style="font-size: 0.7rem;">●</span> Cloud Live
        </span>
      </div>`);

const newCloudSync = normalize(`      <div id="cloudSyncStatus" class="cloud-sync-status-wrap">
        <span class="cloud-sync-live-pill" title="Realtime Cloud Sync Active">
          <span class="cloud-sync-dot">●</span> Cloud Live
        </span>
      </div>`);

if (!normalizedContent.includes(oldCloudSync)) {
    console.error('ERROR: Could not find oldCloudSync in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldCloudSync, newCloudSync);
console.log('PASS: Cloud sync status pill replaced');

const oldTopbarFullNotif = normalize(`        <!-- Live Workflow Notification Center Bell & Dropdown -->
        <div class="pharma-notif-wrapper" id="pharmaNotifWrapper">
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="notif-unread-count-badge" id="topbarNotifBadge" style="\${unreadNotifCount > 0 ? '' : 'display: none;'}">\${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" style="display: none;" onclick="event.stopPropagation()"></div>
        </div>`);

const newTopbarFullNotif = normalize(`        <!-- Live Workflow Notification Center Bell & Dropdown -->
        <div class="pharma-notif-wrapper" id="pharmaNotifWrapper">
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="Notifications" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="notif-unread-count-badge \${unreadNotifCount > 0 ? '' : 'd-none'}" id="topbarNotifBadge">\${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" onclick="event.stopPropagation()"></div>
        </div>`);

if (!normalizedContent.includes(oldTopbarFullNotif)) {
    console.error('ERROR: Could not find oldTopbarFullNotif in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldTopbarFullNotif, newTopbarFullNotif);
console.log('PASS: Full topbar notif bell replaced');

// 3. Refactor renderWorkflowNotifContent
const oldNotifEmpty = normalize(`      <div class="notif-empty-state">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔕</div>
        <div class="fw-bold fs-6 mb-1">No notifications</div>
        <div class="text-muted small" style="max-width: 260px; margin: 0 auto; line-height: 1.45;">
          Workflow approvals, rejections, and directives will appear here live.
        </div>
      </div>`);

const newNotifEmpty = normalize(`      <div class="notif-empty-state">
        <div class="notif-empty-icon">🔕</div>
        <div class="fw-bold fs-6 mb-1">No notifications</div>
        <div class="text-muted small notif-empty-desc">
          Workflow approvals, rejections, and directives will appear here live.
        </div>
      </div>`);

if (!normalizedContent.includes(oldNotifEmpty)) {
    console.error('ERROR: Could not find oldNotifEmpty in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldNotifEmpty, newNotifEmpty);
console.log('PASS: Workflow empty state replaced');

const oldNotifIconsBlock = normalize(`        let icon = item.icon || "🔔";
        let iconBg = "rgba(13, 110, 253, 0.12)";
        let iconColor = "#0d6efd";

        if (item.type && item.type.includes("approval")) {
          iconBg = "rgba(25, 135, 84, 0.14)";
          iconColor = "#198754";
          if (!item.icon) icon = "✅";
        } else if (
          item.type &&
          (item.type.includes("rejection") || item.type.includes("reject"))
        ) {
          iconBg = "rgba(220, 53, 69, 0.14)";
          iconColor = "#dc3545";
          if (!item.icon) icon = "❌";
        } else if (item.type && item.type.includes("leave")) {
          iconBg = "rgba(13, 202, 240, 0.14)";
          iconColor = "#0891b2";
          if (!item.icon) icon = "🏖️";
        } else if (item.type && item.type.includes("plan")) {
          iconBg = "rgba(111, 66, 193, 0.14)";
          iconColor = "#6f42c1";
          if (!item.icon) icon = "🗓️";
        }`);

const newNotifIconsBlock = normalize(`        let icon = item.icon || "🔔";
        let iconTypeClass = "type-default";

        if (item.type && item.type.includes("approval")) {
          iconTypeClass = "type-approval";
          if (!item.icon) icon = "✅";
        } else if (
          item.type &&
          (item.type.includes("rejection") || item.type.includes("reject"))
        ) {
          iconTypeClass = "type-rejection";
          if (!item.icon) icon = "❌";
        } else if (item.type && item.type.includes("leave")) {
          iconTypeClass = "type-leave";
          if (!item.icon) icon = "🏖️";
        } else if (item.type && item.type.includes("plan")) {
          iconTypeClass = "type-plan";
          if (!item.icon) icon = "🗓️";
        }`);

if (!normalizedContent.includes(oldNotifIconsBlock)) {
    console.error('ERROR: Could not find oldNotifIconsBlock in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldNotifIconsBlock, newNotifIconsBlock);
console.log('PASS: Notification icon types block replaced');

const oldNotifItemIcon = normalize(`<div class="notif-item-icon" style="background: \${iconBg}; color: \${iconColor};">`);
const newNotifItemIcon = normalize(`<div class="notif-item-icon \${iconTypeClass}">`);

if (!normalizedContent.includes(oldNotifItemIcon)) {
    console.error('ERROR: Could not find oldNotifItemIcon in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldNotifItemIcon, newNotifItemIcon);
console.log('PASS: Notif item icon element replaced');

const oldNotifHeaderActions = normalize(`        <span class="badge \${unreadCount > 0 ? "bg-danger" : "bg-secondary"} rounded-pill" style="font-size: 0.72rem; padding: 2px 7px;">
          \${unreadCount} New
        </span>
      </h5>
      <div style="display: flex; gap: 8px; align-items: center;">
        \${
          unreadCount > 0
            ? \`
          <button type="button" class="btn btn-sm btn-link text-decoration-none p-0" style="font-size: 0.78rem; font-weight: 600; color: #2563eb;" onclick="window.markAllWorkflowNotifsRead(event)">
            ✓ Mark all read
          </button>
        \`
            : ""
        }
      </div>`);

const newNotifHeaderActions = normalize(`        <span class="badge \${unreadCount > 0 ? "bg-danger" : "bg-secondary"} rounded-pill notif-header-badge">
          \${unreadCount} New
        </span>
      </h5>
      <div class="notif-header-actions">
        \${
          unreadCount > 0
            ? \`
          <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 notif-mark-read-btn" onclick="window.markAllWorkflowNotifsRead(event)">
            ✓ Mark all read
          </button>
        \`
            : ""
        }
      </div>`);

if (!normalizedContent.includes(oldNotifHeaderActions)) {
    console.error('ERROR: Could not find oldNotifHeaderActions in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldNotifHeaderActions, newNotifHeaderActions);
console.log('PASS: Notif header actions replaced');

const oldNotifFooterBtn = normalize(`<button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 small" style="font-size: 0.75rem;" onclick="window.clearAllWorkflowNotifs(event)">`);
const newNotifFooterBtn = normalize(`<button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 notif-clear-btn" onclick="window.clearAllWorkflowNotifs(event)">`);

if (!normalizedContent.includes(oldNotifFooterBtn)) {
    console.error('ERROR: Could not find oldNotifFooterBtn in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldNotifFooterBtn, newNotifFooterBtn);
console.log('PASS: Notif footer clear button replaced');

// 4. Refactor createExcelProgressModal
const oldExcelModal = normalize(`function createExcelProgressModal() {
  let modalEl = document.getElementById("excelImportProgressModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "excelImportProgressModal";
    modalEl.className = "modal-overlay";
    modalEl.style.cssText = "display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);";
    modalEl.innerHTML = \`
      <div style="background: var(--card-bg, #ffffff); color: var(--text-color, #1e293b); border-radius: 14px; padding: 24px; width: 90%; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid var(--border-color, #e2e8f0); text-align: center;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;" id="excelProgressIcon">📊</div>
        <h5 style="margin: 0 0 6px 0; font-weight: 700; color: var(--text-color, #1e293b);" id="excelProgressTitle">Processing Sales Import</h5>
        <div style="font-size: 0.85rem; color: var(--gray-500, #64748b); margin-bottom: 16px; word-break: break-all;" id="excelProgressFileName">-</div>
        
        <div style="background: rgba(0,0,0,0.08); border-radius: 8px; height: 14px; overflow: hidden; margin-bottom: 12px; position: relative;">
          <div id="excelProgressBar" style="background: linear-gradient(90deg, #3b82f6, #10b981); height: 100%; width: 0%; transition: width 0.15s ease; border-radius: 8px;"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; color: var(--gray-600, #475569); margin-bottom: 8px;">
          <span id="excelProgressPercent">0%</span>
          <span id="excelProgressCount">0 / 0</span>
        </div>

        <div style="font-size: 0.82rem; color: var(--gray-500, #64748b); min-height: 20px;" id="excelProgressStatus">Preparing file...</div>
      </div>
    \`;
    document.body.appendChild(modalEl);
  }
  return modalEl;
}`);

const newExcelModal = normalize(`function createExcelProgressModal() {
  let modalEl = document.getElementById("excelImportProgressModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "excelImportProgressModal";
    modalEl.className = "modal-overlay excel-progress-overlay";
    modalEl.innerHTML = \`
      <div class="excel-progress-card">
        <div class="excel-progress-icon" id="excelProgressIcon">📊</div>
        <h5 class="excel-progress-title" id="excelProgressTitle">Processing Sales Import</h5>
        <div class="excel-progress-file" id="excelProgressFileName">-</div>
        
        <div class="excel-progress-track">
          <div id="excelProgressBar" class="excel-progress-bar"></div>
        </div>

        <div class="excel-progress-stats">
          <span id="excelProgressPercent">0%</span>
          <span id="excelProgressCount">0 / 0</span>
        </div>

        <div class="excel-progress-status" id="excelProgressStatus">Preparing file...</div>
      </div>
    \`;
    document.body.appendChild(modalEl);
  }
  return modalEl;
}`);

if (!normalizedContent.includes(oldExcelModal)) {
    console.error('ERROR: Could not find oldExcelModal in js/app.js');
    process.exit(1);
}
normalizedContent = normalizedContent.replace(oldExcelModal, newExcelModal);
console.log('PASS: Excel progress modal replaced');

// Preserve original line endings
const finalContent = isCrlf ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('SUCCESS: js/app.js written successfully! New length:', finalContent.length);
