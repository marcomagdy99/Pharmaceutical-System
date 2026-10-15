/* --- START DEMO DATA --- */
const demoAnnouncements = [
  {
    id: "ann_1790626000001",
    title: "Ramadan Working Hours",
    titleAr: "Ramadan Working Hours",
    body: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week. Please plan your visits accordingly and coordinate with your district managers for any schedule changes.",
    bodyAr: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week. Please plan your visits accordingly and coordinate with your district managers for any schedule changes.",
    priority: "high",
    target: "all",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-09-01T10:30:00",
    readBy: ["u1790626000001"],
    published: true,
  },
  {
    id: "ann_1790626000002",
    title: "Annual Company Event",
    titleAr: "Annual Company Event",
    body: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel, Cairo. All employees and their families are invited! RSVP by September 30th. Dress code: Business casual.",
    bodyAr: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel, Cairo. All employees and their families are invited! RSVP by September 30th. Dress code: Business casual.",
    priority: "normal",
    target: "all",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-08-28T14:00:00",
    readBy: ["u1790626000001", "u1790626000002", "u1790626000014"],
    published: true,
  },
  {
    id: "ann_1790626000003",
    title: "New Health Insurance Policy",
    titleAr: "New Health Insurance Policy",
    body: "A new health insurance policy has been activated effective September 1st, 2026. Key updates include: expanded coverage for dental care, increased annual limit to 500,000 EGP, and added mental health support. Please review the full details with HR.",
    bodyAr: "A new health insurance policy has been activated effective September 1st, 2026. Key updates include: expanded coverage for dental care, increased annual limit to 500,000 EGP, and added mental health support. Please review the full details with HR.",
    priority: "high",
    target: "all",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-08-25T09:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann_1790626000004",
    title: "Q3 Sales Incentive Program",
    titleAr: "Q3 Sales Incentive Program",
    body: "Top performing medical reps in Q3 will receive bonus incentives. Target: 110% achievement. Rewards include cash bonus and all-expenses-paid trip to Sharm El Sheikh.",
    bodyAr: "Top performing medical reps in Q3 will receive bonus incentives. Target: 110% achievement. Rewards include cash bonus and all-expenses-paid trip to Sharm El Sheikh.",
    priority: "normal",
    target: "rep",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-08-20T11:30:00",
    readBy: ["u1790626000001"],
    published: true,
  },
  {
    id: "ann_1790626000005",
    title: "Quarterly Leadership Alignment Meeting",
    titleAr: "Quarterly Leadership Alignment Meeting",
    body: "All District Managers, Line Managers, and Business Unit Heads are required to attend the quarterly leadership review next Tuesday at 11:00 AM.",
    bodyAr: "All District Managers, Line Managers, and Business Unit Heads are required to attend the quarterly leadership review next Tuesday at 11:00 AM.",
    priority: "high",
    target: "dm_lm_bu",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-09-05T09:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann_1790626000007",
    title: "Territory Quota Planning Session",
    titleAr: "Territory Quota Planning Session",
    body: "Operational quota planning session for Line Managers and Business Unit Heads.",
    bodyAr: "Operational quota planning session for Line Managers and Business Unit Heads.",
    priority: "normal",
    target: "lm_bu",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-09-05T15:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann_1790626000006",
    title: "Annual Strategic Budget Briefing",
    titleAr: "Annual Strategic Budget Briefing",
    body: "Confidential financial framework and annual targets briefing exclusively for Business Unit Heads.",
    bodyAr: "Confidential financial framework and annual targets briefing exclusively for Business Unit Heads.",
    priority: "high",
    target: "bu",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-09-06T12:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann_1790626000008",
    title: "Internal HR & Administration Operations Review",
    titleAr: "Internal HR & Administration Operations Review",
    body: "Confidential internal review on staff contracts, payroll adjustments, and system administrative policies.",
    bodyAr: "Confidential internal review on staff contracts, payroll adjustments, and system administrative policies.",
    priority: "high",
    target: "hr_admin",
    createdBy: "u1790626000017",
    createdByName: "HR Department",
    createdAt: "2026-09-07T14:00:00",
    readBy: [],
    published: true,
  },
];
/* --- END DEMO DATA --- */

/* --- START TRANSLATIONS --- */
const announcementTranslations = {
  en: {
    announcements: "Announcements",
    newAnnouncement: "New Announcement",
    totalAnnouncements: "Total Announcements",
    active: "Active",
    highPriority: "High Priority",
    thisMonth: "This Month",
    priorityHigh: "High",
    priorityNormal: "Normal",
    priorityLow: "Low",
    postedBy: "Posted by",
    readBy: "Read by",
    edit: "Edit",
    delete: "Delete",
    markAsRead: "Mark as Read",
    new: "NEW",
    readMore: "Read More",
    readLess: "Read Less",
    filterAll: "All",
    filterHigh: "High Priority",
    filterNormal: "Normal Priority",
    filterLow: "Low Priority",
    filterUnread: "Unread Only",
    titleEn: "Title (English)",
    titleAr: "Title (Arabic)",
    bodyEn: "Body (English)",
    bodyAr: "Body (Arabic)",
    priority: "Priority",
    targetAudience: "Target Audience",
    publishNow: "Publish Immediately",
    save: "Save",
    cancel: "Cancel",
    deleteConfirmTitle: "Delete Announcement",
    deleteConfirmMsg: "Are you sure you want to delete this announcement?",
    allDepartments: "All Departments",
    salesMarketing: "Sales & Marketing",
    hrAdmin: "HR & Admin",
    targetAll: "All Company",
    targetLineTeam: "All Line Team (Reps, DMs, LMs, BU, PM)",
    targetDmLmBu: "District Manager, Line Manager & Business Unit Head",
    targetLmBu: "Line Manager & Business Unit Head",
    targetBu: "Business Unit Head Only",
    targetRep: "Medical Representative Only",
    targetHrAdmin: "Human Resources & Administration Only",
    targetLine: "Product Line Scope",
    allLines: "All Lines (Company-wide)",
    lineScopeBadge: "Line: {0}",
    pmLineNotice: "This announcement will only be visible to team members within your product line ({0}).",
    timeAgo: "{0} ago",
    justNow: "Just now",
    mins: "mins",
    hours: "hours",
    days: "days",
    createAnnouncement: "Create Announcement",
    editAnnouncement: "Edit Announcement",
    noAnnouncements: "No announcements found.",
    imageOptional: "Announcement Image (Optional)",
    uploadImage: "Upload Image",
    removeImage: "Remove Image",
    imageHint: "Click or drag & drop (JPG, PNG, WebP)",
  },
};
/* --- END TRANSLATIONS --- */

/* --- START STORAGE HELPERS --- */
function loadAnnouncements() {
  try {
    const saved = localStorage.getItem("pharmaAnnouncements");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (window.DEMO_DATA) window.DEMO_DATA.announcements = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load announcements from storage:", e);
  }
  const fallback = [...demoAnnouncements];
  if (window.DEMO_DATA && (!window.DEMO_DATA.announcements || !window.DEMO_DATA.announcements.length)) {
    window.DEMO_DATA.announcements = fallback;
  }
  return fallback;
}

function saveAnnouncementsToStorage() {
  try {
    localStorage.setItem("pharmaAnnouncements", JSON.stringify(announcements));
    if (window.DEMO_DATA) {
      window.DEMO_DATA.announcements = announcements;
    }
    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
    }
  } catch (e) {
    console.error("Failed to save announcements to storage:", e);
  }
}
/* --- END STORAGE HELPERS --- */

/* --- START STATE --- */
let announcements = loadAnnouncements();
let currentFilter = "all"; // all, unread, high, normal, low
let currentAuthUser = null;
let currentUserRole = "medical_rep";
let currentUserId = "";
let currentUserName = "";
let currentUserLineIds = [];
let expandedCards = new Set();
let editAnnouncementId = null;
let currentAnnouncementImage = null;
/* --- END STATE --- */

/* --- START LINE & ROLE HELPERS --- */
function isPMUser(user) {
  if (!user) return false;
  const r = (user.role || "").toLowerCase();
  return r === "product_manager" || r === "pm";
}

function isAdminOrHrUser(user) {
  if (!user) return false;
  const r = (user.role || "").toLowerCase();
  return r === "admin" || r === "hr";
}

function canUserCreateAnnouncements(user) {
  return isAdminOrHrUser(user) || isPMUser(user);
}

function getAllProductLines() {
  if (window.store && window.store.productLines && typeof window.store.productLines.getAll === "function") {
    return window.store.productLines.getAll();
  }
  if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.lines)) {
    return window.DEMO_DATA.lines;
  }
  return [];
}

function getProductLineName(lineId) {
  if (!lineId) return "";
  const lines = getAllProductLines();
  const found = lines.find((l) => l.id === lineId);
  if (!found) return lineId;
  const lang = window.i18n ? window.i18n.currentLang : "en";
  if (lang === "ar" && found.nameAr) return found.nameAr;
  return found.name || lineId;
}

function getUserLineIds(user) {
  if (!user) return [];
  const lines = new Set();
  if (Array.isArray(user.lineIds)) {
    user.lineIds.forEach((l) => { if (l) lines.add(l); });
  }
  if (user.lineId) lines.add(user.lineId);
  if (user.assignedLineId) lines.add(user.assignedLineId);

  // If rep or manager with assigned areas, check the lines linked to those areas
  const allAreas = (window.store && window.store.areas && typeof window.store.areas.getAll === "function")
    ? window.store.areas.getAll()
    : ((window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  const areaIds = Array.isArray(user.areaIds) ? user.areaIds : (user.areaId ? [user.areaId] : []);
  areaIds.forEach((aId) => {
    const areaObj = allAreas.find((a) => a.id === aId);
    if (areaObj && areaObj.lineId) {
      lines.add(areaObj.lineId);
    }
  });

  return Array.from(lines);
}
/* --- END LINE & ROLE HELPERS --- */

/* --- START INITIALIZATION --- */
/**
 * Initializes the Announcements page.
 */
function initAnnouncementsPage() {
  const authUser =
    typeof requireAuth === "function"
      ? requireAuth()
      : (window.requireAuth
        ? window.requireAuth()
        : (typeof checkAuth === "function" ? checkAuth() : (window.checkAuth ? window.checkAuth() : null)));
  if (!authUser) return;

  currentAuthUser = authUser;
  currentUserRole = authUser.role || "medical_rep";
  currentUserId = authUser.id || "";
  currentUserName = authUser.name || "";
  currentUserLineIds = getUserLineIds(authUser);

  if (window.i18n) {
    window.i18n.translations = {
      ...window.i18n.translations,
      ...announcementTranslations,
    };
  }
  renderPage();
  if (window.i18n) window.i18n.updatePage();
}

/**
 * Calculates time ago string.
 * @param {string} dateString ISO date string
 * @returns {string} Time ago representation
 */
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const lang = window.i18n ? window.i18n.currentLang : "en";
  const t = announcementTranslations[lang];

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return t.timeAgo.replace("{0}", diffMins + " " + t.mins);
  if (diffHours < 24)
    return t.timeAgo.replace("{0}", diffHours + " " + t.hours);
  return t.timeAgo.replace("{0}", diffDays + " " + t.days);
}
/* --- END INITIALIZATION --- */

/* --- START RENDER FUNCTIONS --- */
/**
 * Renders the entire page content based on user role.
 */
function renderPage() {
  const content = document.getElementById("pageContent");
  const isHR = isAdminOrHrUser(currentAuthUser || { role: currentUserRole });
  const isPM = isPMUser(currentAuthUser || { role: currentUserRole });
  const canCreate = canUserCreateAnnouncements(currentAuthUser || { role: currentUserRole });

  let html = `
        <div class="announcements-header">
            <h1 data-i18n="announcements">Announcements</h1>
            ${canCreate ? `<button class="btn btn-primary btn-new-announcement" onclick="openAnnouncementModal()"><i class="fas fa-plus"></i> <span data-i18n="newAnnouncement">New Announcement</span></button>` : ""}
        </div>
    `;

  if (isHR || isPM) {
    html += renderUserStats(isPM);
  }

  html += `
        <div class="announcements-controls">
            <select class="filter-select" onchange="setFilter(this.value)">
                <option value="all" data-i18n="filterAll">All</option>
                ${!canCreate ? `<option value="unread" data-i18n="filterUnread">Unread Only</option>` : ""}
                <option value="high" data-i18n="filterHigh">High Priority</option>
                <option value="normal" data-i18n="filterNormal">Normal Priority</option>
                <option value="low" data-i18n="filterLow">Low Priority</option>
            </select>
        </div>
        <div class="announcements-list">
            ${renderAnnouncementsList()}
        </div>
    `;

  content.innerHTML = html;

  const modalContainer = document.getElementById("modalContainer");
  if (!document.getElementById("announcementModal")) {
    let modalsHtml = renderLightboxModal();
    if (canCreate) {
      modalsHtml += renderModals();
    }

    if (modalContainer) {
      modalContainer.innerHTML = modalsHtml;
    } else {
      content.insertAdjacentHTML("beforeend", modalsHtml);
    }
  }
}

/**
 * Renders Statistics cards for HR or PM.
 * @param {boolean} isPM
 * @returns {string} HTML string for stats
 */
function renderUserStats(isPM = false) {
  const visible = getVisibleAnnouncements();
  const total = visible.length;
  const highPriority = visible.filter((a) => a.priority === "high").length;

  const now = new Date();
  const thisMonth = visible.filter((a) => {
    const d = new Date(a.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${total}</div>
                <div class="stat-label" data-i18n="totalAnnouncements">Total Announcements</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${highPriority}</div>
                <div class="stat-label" data-i18n="highPriority">High Priority</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${thisMonth}</div>
                <div class="stat-label" data-i18n="thisMonth">This Month</div>
            </div>
        </div>
    `;
}

/**
 * Backwards compatibility for renderHRStats
 */
function renderHRStats() {
  return renderUserStats(false);
}

/**
 * Evaluates whether a given user role is included in the announcement target scope.
 * @param {string} annTarget Target audience identifier
 * @param {string} userRole Current user's role
 * @returns {boolean} True if the user can view the announcement based on role
 */
function isUserInTargetAudience(annTarget, userRole) {
  if (!annTarget || annTarget === "all" || annTarget === "line_team") return true;

  const r = (userRole || "").toLowerCase();
  const isHR = (r === "hr");
  const isAdmin = (r === "admin");
  const isPM = (r === "product_manager" || r === "pm");

  if (annTarget === "hr_admin" || annTarget === "hr") {
    return isHR || isAdmin;
  }

  if (r === "hr" || r === "admin") return true;

  const isRep = (r === "medical_rep" || r === "rep");
  const isDM = (r === "district_manager" || r === "dm");
  const isLM = (r === "line_manager" || r === "lm");
  const isBU = (r === "business_unit" || r === "bu");

  if (annTarget === "dm_lm_bu") {
    return isDM || isLM || isBU;
  }
  if (annTarget === "lm_bu") {
    return isLM || isBU;
  }
  if (annTarget === "bu") {
    return isBU;
  }
  if (annTarget === "rep" || annTarget === "sales") {
    return isRep;
  }

  return annTarget === r;
}

/**
 * Checks whether an announcement is visible to the given user,
 * taking into account publication status, line scoping, and role target.
 * @param {Object} ann Announcement object
 * @param {Object} user User object
 * @returns {boolean}
 */
function isAnnouncementVisibleToUser(ann, user) {
  if (!ann || !user) return false;

  const role = (user.role || "").toLowerCase();
  const isAdmin = (role === "admin");
  const isHR = (role === "hr");
  const isAuthor = (ann.createdBy && ann.createdBy === user.id);

  // Draft check: only author or Admin/HR can see unpublished announcements
  if (!ann.published && !isAuthor && !isAdmin && !isHR) {
    return false;
  }

  // 1. Line Scoping Check:
  // If announcement is scoped to a specific product line (targetLineId):
  if (ann.targetLineId) {
    // Admin and HR always have global oversight
    if (!isAdmin && !isHR) {
      const uLines = getUserLineIds(user);
      // Strictly hidden if the user does NOT belong to this product line
      if (!uLines.includes(ann.targetLineId)) {
        return false;
      }
    }
  }

  // 2. Target Audience Check (Reps, DMs, LMs, BU, HR, etc.)
  if (!isAdmin && !isHR && !isAuthor) {
    if (!isUserInTargetAudience(ann.target, role)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns all announcements visible to currentAuthUser.
 * @returns {Array}
 */
function getVisibleAnnouncements() {
  const user = currentAuthUser || { id: currentUserId, role: currentUserRole, name: currentUserName };
  return announcements.filter((a) => isAnnouncementVisibleToUser(a, user));
}

/**
 * Renders the list of announcements.
 * @returns {string} HTML string for announcement list
 */
function renderAnnouncementsList() {
  const visible = getVisibleAnnouncements();

  let filtered = visible.filter((a) => {
    if (currentFilter === "unread") return !a.readBy.includes(currentUserId);
    if (
      currentFilter === "high" ||
      currentFilter === "normal" ||
      currentFilter === "low"
    ) {
      return a.priority === currentFilter;
    }
    return true;
  });

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (filtered.length === 0) {
    return `<div class="empty-state" data-i18n="noAnnouncements">No announcements found.</div>`;
  }

  return filtered.map((ann) => renderAnnouncementCard(ann)).join("");
}

/**
 * Renders a single announcement card.
 * @param {Object} ann Announcement object
 * @returns {string} HTML string for the card
 */
function renderAnnouncementCard(ann) {
  const isHR = isAdminOrHrUser(currentAuthUser || { role: currentUserRole });
  const isAuthor = (ann.createdBy && ann.createdBy === currentUserId);
  const canManageCard = isHR || isAuthor;
  const isRead = ann.readBy.includes(currentUserId);
  const isExpanded = expandedCards.has(ann.id);
  const lang = window.i18n ? window.i18n.currentLang : "en";

  const title = escapeHtml(lang === "ar" ? ann.titleAr : ann.title);
  const body = escapeHtml(lang === "ar" ? ann.bodyAr : ann.body);
  const authorName = escapeHtml((ann.createdBy && window.store && window.store.users && window.store.users.getById(ann.createdBy) ? window.store.users.getById(ann.createdBy).name : "") || ann.createdByName || "HR Department");
  const safeImage = ann.image ? escapeHtml(ann.image) : "";

  const priorityClass = `priority-${ann.priority}`;
  const unreadClass = !isRead && !isHR ? "unread" : "";

  const priorityIcon =
    ann.priority === "high"
      ? "exclamation-circle"
      : ann.priority === "normal"
        ? "info-circle"
        : "circle";

  const targetKeyMap = {
    all: "targetAll",
    line_team: "targetLineTeam",
    dm_lm_bu: "targetDmLmBu",
    lm_bu: "targetLmBu",
    bu: "targetBu",
    rep: "targetRep",
    sales: "targetRep",
    hr_admin: "targetHrAdmin",
    hr: "targetHrAdmin"
  };
  const targetKey = targetKeyMap[ann.target] || "targetAll";
  const targetLabel = (announcementTranslations[lang] && announcementTranslations[lang][targetKey]) || (announcementTranslations.en && announcementTranslations.en[targetKey]) || "All Company";

  let lineBadgeHtml = "";
  if (ann.targetLineId) {
    const lineName = getProductLineName(ann.targetLineId);
    const scopeTpl = (announcementTranslations[lang] && announcementTranslations[lang].lineScopeBadge) || "Line: {0}";
    lineBadgeHtml = `<span class="badge badge-line"><i class="fas fa-layer-group"></i> ${scopeTpl.replace("{0}", escapeHtml(lineName))}</span>`;
  }

  return `
        <div class="announcement-card ${priorityClass} ${unreadClass}" id="card-${ann.id}">
            <div class="card-header">
                <div class="badges">
                    <span class="badge badge-${ann.priority}">
                        <i class="fas fa-${priorityIcon}"></i> <span data-i18n="priority${ann.priority.charAt(0).toUpperCase() + ann.priority.slice(1)}">${ann.priority}</span>
                    </span>
                    ${lineBadgeHtml}
                    <span class="badge badge-target">
                        <i class="fas fa-bullseye"></i> ${targetLabel}
                    </span>
                    ${!ann.published ? `<span class="badge bg-warning text-dark border border-warning-subtle"><i class="fas fa-file-alt"></i> Draft</span>` : ""}
                    ${!isRead && !isHR ? `<span class="badge badge-new" data-i18n="new">NEW</span>` : ""}
                </div>
                ${
                  canManageCard
                    ? `
                <div class="actions">
                    <button class="btn-icon" onclick="openAnnouncementModal('${ann.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon text-danger" onclick="openDeleteModal('${ann.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
                `
                    : ""
                }
            </div>
            <h3 class="card-title">${title}</h3>
            <div class="card-meta">
                <span><i class="fas fa-user"></i> ${authorName}</span>
                <span><i class="fas fa-clock"></i> ${timeAgo(ann.createdAt)}</span>
                ${canManageCard ? `<span title="Read by"><i class="fas fa-eye"></i> ${ann.readBy.length}</span>` : ""}
            </div>
            ${
              safeImage
                ? `
            <div class="announcement-image-box" onclick="openImageLightbox('${ann.id}')" title="Click to view image">
                <img src="${safeImage}" alt="${title}" class="announcement-image" loading="lazy" />
            </div>
            `
                : ""
            }
            <div class="card-body ${isExpanded ? "expanded" : "collapsed"}">
                ${body}
            </div>
            <div class="card-footer">
                <button class="btn btn-text" onclick="toggleExpand('${ann.id}')">
                    <span data-i18n="${isExpanded ? "readLess" : "readMore"}">${isExpanded ? "Read Less" : "Read More"}</span>
                    <i class="fas fa-chevron-${isExpanded ? "up" : "down"}"></i>
                </button>
                ${!isRead && !isHR ? `<button class="btn btn-outline-primary btn-sm" onclick="markAsRead('${ann.id}')" data-i18n="markAsRead">Mark as Read</button>` : ""}
            </div>
        </div>
    `;
}

/**
 * Renders modals (Create/Edit and Delete).
 * @returns {string} HTML string for modals
 */
function renderModals() {
  return `
        <!-- Create/Edit Modal -->
        <div class="modal-overlay" id="announcementModal" onclick="if(event.target === this) closeModal('announcementModal')">
            <div class="modal-content large">
                <div class="modal-header">
                    <h2 id="modalTitle" data-i18n="createAnnouncement">Create Announcement</h2>
                    <button class="btn-close" onclick="closeModal('announcementModal')" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <form id="announcementForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label data-i18n="titleEn">Title (English)</label>
                                <input type="text" id="annTitle" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label data-i18n="titleAr">Title (Arabic)</label>
                                <input type="text" id="annTitleAr" class="form-control" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label data-i18n="bodyEn">Body (English)</label>
                            <textarea id="annBody" class="form-control" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label data-i18n="bodyAr">Body (Arabic)</label>
                            <textarea id="annBodyAr" class="form-control" rows="4" required></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label data-i18n="priority">Priority</label>
                                <select id="annPriority" class="form-control">
                                    <option value="high" data-i18n="priorityHigh">High</option>
                                    <option value="normal" data-i18n="priorityNormal" selected>Normal</option>
                                    <option value="low" data-i18n="priorityLow">Low</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label data-i18n="targetAudience">Target Audience</label>
                                <select id="annTarget" class="form-control">
                                    <option value="all" data-i18n="targetAll">All Company</option>
                                    <option value="line_team" data-i18n="targetLineTeam">All Line Team (Reps, DMs, LMs, BU, PM)</option>
                                    <option value="dm_lm_bu" data-i18n="targetDmLmBu">District Manager, Line Manager & Business Unit Head</option>
                                    <option value="lm_bu" data-i18n="targetLmBu">Line Manager & Business Unit Head</option>
                                    <option value="bu" data-i18n="targetBu">Business Unit Head Only</option>
                                    <option value="rep" data-i18n="targetRep">Medical Representative Only</option>
                                    <option value="hr_admin" data-i18n="targetHrAdmin">Human Resources & Administration Only</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group" id="annLineGroup">
                            <label data-i18n="targetLine">Product Line Scope</label>
                            <select id="annTargetLine" class="form-control">
                                <option value="" data-i18n="allLines">All Lines (Company-wide)</option>
                            </select>
                            <small class="form-text text-muted" id="annLineHint" style="display:block; margin-top:4px; font-size:0.8rem;"></small>
                        </div>
                        <div class="form-group">
                            <label data-i18n="imageOptional">Announcement Image (Optional)</label>
                            <input type="file" id="annImageInput" accept="image/*" class="hidden-file-input" onchange="handleImageSelect(event)">
                            <div class="image-upload-dropzone" id="annImageUploadDropzone" onclick="document.getElementById('annImageInput').click()">
                                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                                <span class="upload-text" data-i18n="uploadImage">Upload Image</span>
                                <span class="upload-hint" data-i18n="imageHint">Click or drag & drop (JPG, PNG, WebP)</span>
                            </div>
                            <div class="image-preview-container d-none" id="annImagePreviewContainer">
                                <img id="annImagePreview" src="" alt="Preview" class="image-preview-img">
                                <div class="preview-actions">
                                    <button type="button" class="btn-change-image" onclick="document.getElementById('annImageInput').click()" data-i18n="uploadImage">Change</button>
                                    <button type="button" class="btn-remove-image" onclick="removeAnnouncementImage()" data-i18n="removeImage">Remove</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="annPublish" checked>
                            <label for="annPublish" data-i18n="publishNow">Publish Immediately</label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('announcementModal')" data-i18n="cancel">Cancel</button>
                    <button class="btn btn-primary" onclick="saveAnnouncement()" data-i18n="save">Save</button>
                </div>
            </div>
        </div>

        <!-- Delete Modal -->
        <div class="modal-overlay" id="deleteModal" onclick="if(event.target === this) closeModal('deleteModal')">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 data-i18n="deleteConfirmTitle">Delete Announcement</h2>
                    <button class="btn-close" onclick="closeModal('deleteModal')" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p data-i18n="deleteConfirmMsg">Are you sure you want to delete this announcement?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('deleteModal')" data-i18n="cancel">Cancel</button>
                    <button class="btn btn-danger" onclick="confirmDelete()" data-i18n="delete">Delete</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the lightbox modal for full-size image viewing.
 * @returns {string} HTML string for lightbox modal
 */
function renderLightboxModal() {
  return `
        <!-- Image Lightbox Modal -->
        <div class="modal-overlay lightbox-overlay" id="imageLightboxModal" onclick="if(event.target === this) closeImageLightbox()">
            <div class="lightbox-content">
                <button class="btn-close lightbox-close" onclick="closeImageLightbox()" aria-label="Close"><i class="fas fa-times"></i></button>
                <img id="lightboxImage" src="" alt="Announcement Image" class="lightbox-img" />
            </div>
        </div>
    `;
}
/* --- END RENDER FUNCTIONS --- */

/* --- START ACTION FUNCTIONS --- */
/**
 * Sets the current filter and re-renders.
 * @param {string} val Filter value
 */
function setFilter(val) {
  currentFilter = val;
  renderPage();
  if (window.i18n) window.i18n.updatePage();
}

/**
 * Toggles expanded state of a card.
 * @param {string} id Announcement ID
 */
function toggleExpand(id) {
  if (expandedCards.has(id)) {
    expandedCards.delete(id);
  } else {
    expandedCards.add(id);
  }
  renderPage();
  if (window.i18n) window.i18n.updatePage();
}

/**
 * Marks an announcement as read.
 * @param {string} id Announcement ID
 */
function markAsRead(id) {
  const ann = announcements.find((a) => a.id === id);
  if (ann && !ann.readBy.includes(currentUserId)) {
    ann.readBy.push(currentUserId);
    saveAnnouncementsToStorage();
    renderPage();
    if (window.i18n) window.i18n.updatePage();
  }
}

/**
 * Opens Create/Edit modal.
 * @param {string|null} id Announcement ID to edit, or null for new
 */
function openAnnouncementModal(id = null) {
  const isHR = isAdminOrHrUser(currentAuthUser || { role: currentUserRole });
  const isPM = isPMUser(currentAuthUser || { role: currentUserRole });

  if (!isHR && !isPM) {
    if (typeof showToast === "function") showToast("Permission Denied: HR/Admin or Product Manager only.", "error");
    return;
  }

  // If editing, check if user is allowed to edit this announcement
  let existingAnn = null;
  if (id) {
    existingAnn = announcements.find((a) => a.id === id);
    if (!existingAnn) return;
    const isAuthor = (existingAnn.createdBy && existingAnn.createdBy === currentUserId);
    if (!isHR && !isAuthor) {
      if (typeof showToast === "function") showToast("Permission Denied: You can only edit your own announcements.", "error");
      return;
    }
  }

  editAnnouncementId = id;
  const modal = document.getElementById("announcementModal");
  const titleEl = document.getElementById("modalTitle");

  // Populate line selection dropdown
  const lineSelect = document.getElementById("annTargetLine");
  const lineHint = document.getElementById("annLineHint");
  const allLines = getAllProductLines();
  const lang = window.i18n ? window.i18n.currentLang : "en";

  if (lineSelect) {
    const allLinesLabel = (announcementTranslations[lang] && announcementTranslations[lang].allLines) || "All Lines (Company-wide)";
    lineSelect.innerHTML = `<option value="">${allLinesLabel}</option>` +
      allLines.map((l) => `<option value="${l.id}">${escapeHtml((lang === "ar" && l.nameAr) ? l.nameAr : l.name)}</option>`).join("");
  }

  // Enforce PM line scoping rules:
  if (isPM && !isHR) {
    // PM can only publish to their line
    const pmLineId = currentUserLineIds[0] || (currentAuthUser && currentAuthUser.lineId) || "";
    const pmLineName = getProductLineName(pmLineId);

    if (lineSelect) {
      lineSelect.value = pmLineId;
      lineSelect.disabled = true; // Locked to PM line
    }
    if (lineHint) {
      const pmNotice = (announcementTranslations[lang] && announcementTranslations[lang].pmLineNotice) || "This announcement will only be visible to team members within your product line ({0}).";
      lineHint.textContent = pmNotice.replace("{0}", pmLineName || pmLineId);
      lineHint.style.color = "var(--primary, #0d6efd)";
    }
  } else {
    // HR / Admin can choose any line or company-wide
    if (lineSelect) {
      lineSelect.disabled = false;
    }
    if (lineHint) {
      lineHint.textContent = "";
    }
  }

  if (existingAnn) {
    document.getElementById("annTitle").value = existingAnn.title || "";
    document.getElementById("annTitleAr").value = existingAnn.titleAr || "";
    document.getElementById("annBody").value = existingAnn.body || "";
    document.getElementById("annBodyAr").value = existingAnn.bodyAr || "";
    document.getElementById("annPriority").value = existingAnn.priority || "normal";
    document.getElementById("annTarget").value = existingAnn.target || "all";
    if (lineSelect && !isPM) {
      lineSelect.value = existingAnn.targetLineId || "";
    }
    document.getElementById("annPublish").checked = existingAnn.published !== false;
    currentAnnouncementImage = existingAnn.image || null;
    titleEl.setAttribute("data-i18n", "editAnnouncement");
    if (window.i18n) {
      titleEl.textContent = announcementTranslations[window.i18n.currentLang].editAnnouncement;
    }
  } else {
    document.getElementById("announcementForm").reset();
    currentAnnouncementImage = null;
    if (isPM && lineSelect) {
      const pmLineId = currentUserLineIds[0] || (currentAuthUser && currentAuthUser.lineId) || "";
      lineSelect.value = pmLineId;
    }
    titleEl.setAttribute("data-i18n", "createAnnouncement");
    if (window.i18n) {
      titleEl.textContent = announcementTranslations[window.i18n.currentLang].createAnnouncement;
    }
  }

  const fileInput = document.getElementById("annImageInput");
  if (fileInput) fileInput.value = "";
  renderImagePreview();
  setupDragAndDrop();

  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
    modal.scrollTop = 0;
    const modalBody = modal.querySelector(".modal-body");
    if (modalBody) modalBody.scrollTop = 0;
  }
  document.body.style.overflow = "hidden";
}

/**
 * Handles image selection from file input.
 * @param {Event} event File input change event
 */
function handleImageSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    const msg = 'Please select a valid image file.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const rawDataUrl = e.target.result;
    const img = new Image();
    img.onload = function () {
      const maxDim = 700;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      currentAnnouncementImage = canvas.toDataURL("image/jpeg", 0.70);
      renderImagePreview();
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

/**
 * Removes the selected image from the announcement form.
 */
function removeAnnouncementImage() {
  currentAnnouncementImage = null;
  const input = document.getElementById("annImageInput");
  if (input) input.value = "";
  renderImagePreview();
}

/**
 * Updates the image preview UI in the form modal.
 */
function renderImagePreview() {
  const previewContainer = document.getElementById("annImagePreviewContainer");
  const dropzone = document.getElementById("annImageUploadDropzone");
  const previewImg = document.getElementById("annImagePreview");

  if (currentAnnouncementImage) {
    if (previewImg) previewImg.src = currentAnnouncementImage;
    if (previewContainer) previewContainer.style.display = "block";
    if (dropzone) dropzone.style.display = "none";
  } else {
    if (previewImg) previewImg.src = "";
    if (previewContainer) previewContainer.style.display = "none";
    if (dropzone) dropzone.style.display = "flex";
  }
}

/**
 * Sets up drag-and-drop support for the image upload area.
 */
function setupDragAndDrop() {
  const dropzone = document.getElementById("annImageUploadDropzone");
  if (!dropzone) return;

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect({ target: { files: e.dataTransfer.files } });
    }
  });
}

/**
 * Opens image lightbox for viewing full-size announcement image.
 * @param {string} idOrSrc Image source URL / DataURL or Announcement ID
 */
function openImageLightbox(idOrSrc) {
  const lightbox = document.getElementById("imageLightboxModal");
  const lightboxImg = document.getElementById("lightboxImage");
  if (lightbox && lightboxImg) {
    let resolvedSrc = idOrSrc;
    if (typeof idOrSrc === "string" && !idOrSrc.startsWith("data:") && !idOrSrc.startsWith("http") && !idOrSrc.includes("/")) {
      const ann = announcements.find((a) => a.id === idOrSrc);
      if (ann && ann.image) resolvedSrc = ann.image;
    }
    lightboxImg.src = resolvedSrc;
    lightbox.classList.add("active");
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

/**
 * Closes image lightbox modal.
 */
function closeImageLightbox() {
  const lightbox = document.getElementById("imageLightboxModal");
  if (lightbox) {
    lightbox.classList.remove("active");
    lightbox.classList.remove("show");
    lightbox.style.display = "none";
  }
  document.body.style.overflow = "";
}

/**
 * Closes a modal.
 * @param {string} modalId ID of the modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    modal.classList.remove("show");
    modal.style.display = "none";
  }
  document.body.style.overflow = "";
}

/**
 * Saves announcement (create or update).
 */
function saveAnnouncement() {
  const isHR = isAdminOrHrUser(currentAuthUser || { role: currentUserRole });
  const isPM = isPMUser(currentAuthUser || { role: currentUserRole });

  if (!isHR && !isPM) {
    if (typeof showToast === "function") showToast("Permission Denied: HR/Admin or Product Manager only.", "error");
    return;
  }

  const title = (document.getElementById("annTitle").value || "").trim();
  const titleAr = (document.getElementById("annTitleAr").value || "").trim();
  const body = (document.getElementById("annBody").value || "").trim();
  const bodyAr = (document.getElementById("annBodyAr").value || "").trim();
  const priority = document.getElementById("annPriority").value;
  const target = document.getElementById("annTarget").value;
  const published = document.getElementById("annPublish").checked;

  let targetLineId = null;
  if (isPM && !isHR) {
    // PM announcements are STRICTLY scoped to their product line
    targetLineId = currentUserLineIds[0] || (currentAuthUser && currentAuthUser.lineId) || null;
  } else {
    // HR / Admin can target a specific line or leave null for all lines
    const lineVal = document.getElementById("annTargetLine") ? document.getElementById("annTargetLine").value : "";
    targetLineId = lineVal || null;
  }

  const finalTitleAr = titleAr || title;
  const finalBodyAr = bodyAr || body;
  if (!title || !body) {
    const msg = 'Please fill all required fields.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }

  if (editAnnouncementId) {
    const index = announcements.findIndex((a) => a.id === editAnnouncementId);
    if (index > -1) {
      const existing = announcements[index];
      const isAuthor = (existing.createdBy && existing.createdBy === currentUserId);
      if (!isHR && !isAuthor) {
        if (typeof showToast === "function") showToast("Permission Denied: You cannot modify this announcement.", "error");
        return;
      }
      announcements[index] = {
        ...existing,
        title,
        titleAr: finalTitleAr,
        body,
        bodyAr: finalBodyAr,
        priority,
        target,
        targetLineId: isPM ? targetLineId : (targetLineId || null),
        published,
        image: currentAnnouncementImage,
      };
    }
  } else {
    const newAnn = {
      id: "ann" + Date.now(),
      title,
      titleAr: finalTitleAr,
      body,
      bodyAr: finalBodyAr,
      priority,
      target,
      targetLineId: targetLineId,
      published,
      image: currentAnnouncementImage,
      createdBy: currentUserId,
      createdByName: currentUserName || "HR Department",
      createdByRole: currentUserRole,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    announcements.unshift(newAnn);
  }

  saveAnnouncementsToStorage();
  closeModal("announcementModal");
  renderPage();
  if (window.i18n) window.i18n.updatePage();
}

/**
 * Opens delete confirmation modal.
 * @param {string} id Announcement ID
 */
function openDeleteModal(id) {
  const isHR = isAdminOrHrUser(currentAuthUser || { role: currentUserRole });
  const isPM = isPMUser(currentAuthUser || { role: currentUserRole });

  if (!isHR && !isPM) {
    if (typeof showToast === "function") showToast("Permission Denied: HR/Admin or Product Manager only.", "error");
    return;
  }

  const ann = announcements.find((a) => a.id === id);
  if (!ann) return;
  const isAuthor = (ann.createdBy && ann.createdBy === currentUserId);
  if (!isHR && !isAuthor) {
    if (typeof showToast === "function") showToast("Permission Denied: You can only delete your own announcements.", "error");
    return;
  }

  editAnnouncementId = id;
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
    modal.scrollTop = 0;
  }
  document.body.style.overflow = "hidden";
}

/**
 * Confirms deletion of announcement.
 */
function confirmDelete() {
  const isHR = isAdminOrHrUser(currentAuthUser || { role: currentUserRole });
  const isPM = isPMUser(currentAuthUser || { role: currentUserRole });
  if (!isHR && !isPM) return;

  if (editAnnouncementId) {
    const ann = announcements.find((a) => a.id === editAnnouncementId);
    const isAuthor = ann && (ann.createdBy === currentUserId);
    if (!isHR && !isAuthor) return;

    announcements = announcements.filter((a) => a.id !== editAnnouncementId);
    saveAnnouncementsToStorage();
    closeModal("deleteModal");
    renderPage();
    if (window.i18n) window.i18n.updatePage();
  }
}
/* --- END ACTION FUNCTIONS --- */

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal("announcementModal");
    closeModal("deleteModal");
    closeImageLightbox();
  }
});

document.addEventListener("DOMContentLoaded", initAnnouncementsPage);
