/* --- START DEMO DATA --- */
const demoAnnouncements = [
  {
    id: "ann1",
    title: "Ramadan Working Hours",
    titleAr: "مواعيد العمل في رمضان",
    body: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week. Please plan your visits accordingly and coordinate with your district managers for any schedule changes.",
    bodyAr:
      "يرجى العلم أن مواعيد العمل خلال شهر رمضان ستكون من 9 صباحاً حتى 3 عصراً بدءاً من الأسبوع القادم. يرجى تنظيم زياراتكم والتنسيق مع مديري المناطق لأي تغييرات في الجدول.",
    priority: "high",
    target: "all",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-09-01T10:30:00",
    readBy: ["rep1"],
    published: true,
  },
  {
    id: "ann2",
    title: "Annual Company Event",
    titleAr: "الحفل السنوي للشركة",
    body: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel, Cairo. All employees and their families are invited! RSVP by September 30th. Dress code: Business casual.",
    bodyAr:
      "يسعدنا الإعلان عن الحفل السنوي للشركة يوم 15 أكتوبر في فندق فور سيزونز القاهرة. جميع الموظفين وعائلاتهم مدعوون! يرجى تأكيد الحضور قبل 30 سبتمبر. اللباس: رسمي عصري.",
    priority: "normal",
    target: "all",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-08-28T14:00:00",
    readBy: ["rep1", "rep2", "dm1"],
    published: true,
  },
  {
    id: "ann3",
    title: "New Health Insurance Policy",
    titleAr: "بوليصة التأمين الصحي الجديدة",
    body: "A new health insurance policy has been activated effective September 1st, 2026. Key updates include: expanded coverage for dental care, increased annual limit to 500,000 EGP, and added mental health support. Please review the full details with HR.",
    bodyAr:
      "تم تفعيل بوليصة تأمين صحي جديدة اعتباراً من 1 سبتمبر 2026. أهم التحديثات: تغطية موسعة لطب الأسنان، زيادة الحد السنوي إلى 500,000 جنيه، وإضافة دعم الصحة النفسية. يرجى مراجعة التفاصيل الكاملة مع الموارد البشرية.",
    priority: "high",
    target: "all",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-08-25T09:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann4",
    title: "Q3 Sales Incentive Program",
    titleAr: "برنامج حوافز المبيعات للربع الثالث",
    body: "Top performing medical reps in Q3 will receive bonus incentives. Target: 110% achievement. Rewards include cash bonus and all-expenses-paid trip to Sharm El Sheikh.",
    bodyAr:
      "سيحصل أفضل المناديب الطبيين في الربع الثالث على حوافز إضافية. الهدف: تحقيق 110%. المكافآت تشمل مكافأة مالية ورحلة مدفوعة بالكامل إلى شرم الشيخ.",
    priority: "normal",
    target: "rep",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-08-20T11:30:00",
    readBy: ["rep1"],
    published: true,
  },
  {
    id: "ann5",
    title: "Quarterly Leadership Alignment Meeting",
    titleAr: "اجتماع المواءمة القيادية ربع السنوي",
    body: "All District Managers, Line Managers, and Business Unit Heads are required to attend the quarterly leadership review next Tuesday at 11:00 AM.",
    bodyAr:
      "يرجى من جميع مديري المناطق ومديري الخطوط ورؤساء القطاعات حضور اجتماع المراجعة القيادية ربع السنوية يوم الثلاثاء القادم الساعة 11:00 صباحاً.",
    priority: "high",
    target: "dm_lm_bu",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-09-05T09:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann7",
    title: "Territory Quota Planning Session",
    titleAr: "جلسة تخطيط الحصص البيعية للمناطق",
    body: "Operational quota planning session for Line Managers and Business Unit Heads.",
    bodyAr:
      "جلسة تخطيط الحصص البيعية التشغيلية المخصصة لمديري الخطوط ورؤساء القطاعات.",
    priority: "normal",
    target: "lm_bu",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-09-05T15:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann6",
    title: "Annual Strategic Budget Briefing",
    titleAr: "إحاطة الموازنة الاستراتيجية السنوية",
    body: "Confidential financial framework and annual targets briefing exclusively for Business Unit Heads.",
    bodyAr:
      "إحاطة الأطر المالية والمستهدفات السنوية السرية المخصصة لرؤساء القطاعات فقط.",
    priority: "high",
    target: "bu",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
    createdAt: "2026-09-06T12:00:00",
    readBy: [],
    published: true,
  },
  {
    id: "ann8",
    title: "Internal HR & Administration Operations Review",
    titleAr: "مراجعة العمليات الداخلية للموارد البشرية والإدارة",
    body: "Confidential internal review on staff contracts, payroll adjustments, and system administrative policies.",
    bodyAr:
      "مراجعة داخلية سرية حول عقود الموظفين وتعديلات مسيرات الرواتب والسياسات الإدارية للنظام.",
    priority: "high",
    target: "hr_admin",
    createdBy: "hr1",
    createdByName: "Fatma El-Sherif",
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
    targetDmLmBu: "District Manager, Line Manager & Business Unit Head",
    targetLmBu: "Line Manager & Business Unit Head",
    targetBu: "Business Unit Head Only",
    targetRep: "Medical Representative Only",
    targetHrAdmin: "Human Resources & Administration Only",
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
  ar: {
    announcements: "الإعلانات",
    newAnnouncement: "إعلان جديد",
    totalAnnouncements: "إجمالي الإعلانات",
    active: "نشط",
    highPriority: "أولوية عالية",
    thisMonth: "هذا الشهر",
    priorityHigh: "عالي",
    priorityNormal: "عادي",
    priorityLow: "منخفض",
    postedBy: "نشر بواسطة",
    readBy: "قرئ بواسطة",
    edit: "تعديل",
    delete: "حذف",
    markAsRead: "تحديد كمقروء",
    new: "جديد",
    readMore: "قراءة المزيد",
    readLess: "قراءة أقل",
    filterAll: "الكل",
    filterHigh: "أولوية عالية",
    filterNormal: "أولوية عادية",
    filterLow: "أولوية منخفضة",
    filterUnread: "غير المقروءة فقط",
    titleEn: "العنوان (إنجليزي)",
    titleAr: "العنوان (عربي)",
    bodyEn: "المحتوى (إنجليزي)",
    bodyAr: "المحتوى (عربي)",
    priority: "الأولوية",
    targetAudience: "الجمهور المستهدف",
    publishNow: "نشر فوراً",
    save: "حفظ",
    cancel: "إلغاء",
    deleteConfirmTitle: "حذف الإعلان",
    deleteConfirmMsg: "هل أنت متأكد من حذف هذا الإعلان؟",
    allDepartments: "جميع الأقسام",
    salesMarketing: "المبيعات والتسويق",
    hrAdmin: "الموارد البشرية والإدارة",
    targetAll: "كل الشركة",
    targetDmLmBu: "مدير المنطقة ومدير الخط ورئيس القطاع",
    targetLmBu: "مدير الخط ورئيس القطاع",
    targetBu: "رئيس القطاع فقط",
    targetRep: "المندوب الطبي فقط",
    targetHrAdmin: "الموارد البشرية والإدارة فقط",
    timeAgo: "منذ {0}",
    justNow: "الآن",
    mins: "دقيقة",
    hours: "ساعة",
    days: "يوم",
    createAnnouncement: "إنشاء إعلان",
    editAnnouncement: "تعديل إعلان",
    noAnnouncements: "لا توجد إعلانات.",
    imageOptional: "صورة الإعلان (اختياري)",
    uploadImage: "رفع صورة",
    removeImage: "إزالة الصورة",
    imageHint: "انقر أو اسحب الصورة هنا (JPG, PNG, WebP)",
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
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load announcements from storage:", e);
  }
  return [...demoAnnouncements];
}

function saveAnnouncementsToStorage() {
  try {
    localStorage.setItem("pharmaAnnouncements", JSON.stringify(announcements));
  } catch (e) {
    console.error("Failed to save announcements to storage:", e);
  }
}
/* --- END STORAGE HELPERS --- */

/* --- START STATE --- */
let announcements = loadAnnouncements();
let currentFilter = "all"; // all, unread, high, normal, low
let currentUserRole = localStorage.getItem("userRole") || "hr"; // fallback to hr for demo
let currentUserId = localStorage.getItem("userId") || "hr1";
let currentUserName = "Fatma El-Sherif";
let expandedCards = new Set();
let editAnnouncementId = null;
let currentAnnouncementImage = null;
/* --- END STATE --- */

/* --- START INITIALIZATION --- */
/**
 * Initializes the Announcements page.
 */
function initAnnouncementsPage() {
  const authUser =
    typeof checkAuth === "function"
      ? checkAuth()
      : window.checkAuth
        ? window.checkAuth()
        : null;
  if (authUser) {
    currentUserRole = authUser.role || currentUserRole;
    currentUserId = authUser.id || currentUserId;
    currentUserName = authUser.name || currentUserName;
  } else {
    currentUserRole = localStorage.getItem("userRole") || "hr";
    currentUserId = localStorage.getItem("userId") || "hr1";
  }

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
  const isHR = currentUserRole === "hr";

  let html = `
        <div class="announcements-header">
            <h1 data-i18n="announcements">Announcements</h1>
            ${isHR ? `<button class="btn btn-primary" onclick="openAnnouncementModal()"><i class="fas fa-plus"></i> <span data-i18n="newAnnouncement">New Announcement</span></button>` : ""}
        </div>
    `;

  if (isHR) {
    html += renderHRStats();
  }

  html += `
        <div class="announcements-controls">
            <select class="filter-select" onchange="setFilter(this.value)">
                <option value="all" data-i18n="filterAll">All</option>
                ${!isHR ? `<option value="unread" data-i18n="filterUnread">Unread Only</option>` : ""}
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
  let modalsHtml = renderLightboxModal();
  if (isHR) {
    modalsHtml += renderModals();
  }

  if (modalContainer) {
    modalContainer.innerHTML = modalsHtml;
  } else {
    content.insertAdjacentHTML("beforeend", modalsHtml);
  }
}

/**
 * Renders HR Statistics cards.
 * @returns {string} HTML string for stats
 */
function renderHRStats() {
  const total = announcements.length;
  const highPriority = announcements.filter(
    (a) => a.priority === "high",
  ).length;

  const now = new Date();
  const thisMonth = announcements.filter((a) => {
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
 * Evaluates whether a given user role is included in the announcement target scope.
 * @param {string} annTarget Target audience identifier
 * @param {string} userRole Current user's role
 * @returns {boolean} True if the user can view the announcement
 */
function isUserInTargetAudience(annTarget, userRole) {
  if (!annTarget || annTarget === "all") return true;

  const r = (userRole || "").toLowerCase();
  const isHR = (r === "hr");
  const isAdmin = (r === "admin");

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
 * Renders the list of announcements.
 * @returns {string} HTML string for announcement list
 */
function renderAnnouncementsList() {
  let filtered = announcements.filter((a) => {
    if (
      currentUserRole !== "hr" &&
      currentUserRole !== "admin" &&
      !isUserInTargetAudience(a.target, currentUserRole)
    ) {
      return false;
    }
    if (currentFilter === "unread") return !a.readBy.includes(currentUserId);
    if (
      currentFilter === "high" ||
      currentFilter === "normal" ||
      currentFilter === "low"
    )
      return a.priority === currentFilter;
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
  const isHR = currentUserRole === "hr";
  const isRead = ann.readBy.includes(currentUserId);
  const isExpanded = expandedCards.has(ann.id);
  const lang = window.i18n ? window.i18n.currentLang : "en";

  const title = escapeHtml(lang === "ar" ? ann.titleAr : ann.title);
  const body = escapeHtml(lang === "ar" ? ann.bodyAr : ann.body);

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

  return `
        <div class="announcement-card ${priorityClass} ${unreadClass}" id="card-${ann.id}">
            <div class="card-header">
                <div class="badges">
                    <span class="badge badge-${ann.priority}">
                        <i class="fas fa-${priorityIcon}"></i> <span data-i18n="priority${ann.priority.charAt(0).toUpperCase() + ann.priority.slice(1)}">${ann.priority}</span>
                    </span>
                    <span class="badge" style="background: rgba(13, 110, 253, 0.1); color: #0d6efd; border: 1px solid rgba(13, 110, 253, 0.25); font-size: 0.75rem; padding: 4px 8px; border-radius: 6px;">
                        <i class="fas fa-bullseye"></i> ${targetLabel}
                    </span>
                    ${!isRead && !isHR ? `<span class="badge badge-new" data-i18n="new">NEW</span>` : ""}
                </div>
                ${
                  isHR
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
                <span><i class="fas fa-user"></i> ${ann.createdByName}</span>
                <span><i class="fas fa-clock"></i> ${timeAgo(ann.createdAt)}</span>
                ${isHR ? `<span title="Read by"><i class="fas fa-eye"></i> ${ann.readBy.length}</span>` : ""}
            </div>
            ${
              ann.image
                ? `
            <div class="announcement-image-box" onclick="openImageLightbox('${ann.id}')" title="Click to view image">
                <img src="${ann.image}" alt="${title}" class="announcement-image" loading="lazy" />
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
        <div class="modal-overlay" id="announcementModal" style="display: none;" onclick="if(event.target === this) closeModal('announcementModal')">
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
                                    <option value="dm_lm_bu" data-i18n="targetDmLmBu">District Manager, Line Manager & Business Unit Head</option>
                                    <option value="lm_bu" data-i18n="targetLmBu">Line Manager & Business Unit Head</option>
                                    <option value="bu" data-i18n="targetBu">Business Unit Head Only</option>
                                    <option value="rep" data-i18n="targetRep">Medical Representative Only</option>
                                    <option value="hr_admin" data-i18n="targetHrAdmin">Human Resources & Administration Only</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label data-i18n="imageOptional">Announcement Image (Optional)</label>
                            <input type="file" id="annImageInput" accept="image/*" style="display: none;" onchange="handleImageSelect(event)">
                            <div class="image-upload-dropzone" id="annImageUploadDropzone" onclick="document.getElementById('annImageInput').click()">
                                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                                <span class="upload-text" data-i18n="uploadImage">Upload Image</span>
                                <span class="upload-hint" data-i18n="imageHint">Click or drag & drop (JPG, PNG, WebP)</span>
                            </div>
                            <div class="image-preview-container" id="annImagePreviewContainer" style="display: none;">
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
        <div class="modal-overlay" id="deleteModal" style="display: none;" onclick="if(event.target === this) closeModal('deleteModal')">
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
        <div class="modal-overlay lightbox-overlay" id="imageLightboxModal" style="display: none;" onclick="if(event.target === this) closeImageLightbox()">
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
  editAnnouncementId = id;
  const modal = document.getElementById("announcementModal");
  const titleEl = document.getElementById("modalTitle");

  if (id) {
    const ann = announcements.find((a) => a.id === id);
    if (ann) {
      document.getElementById("annTitle").value = ann.title;
      document.getElementById("annTitleAr").value = ann.titleAr;
      document.getElementById("annBody").value = ann.body;
      document.getElementById("annBodyAr").value = ann.bodyAr;
      document.getElementById("annPriority").value = ann.priority;
      document.getElementById("annTarget").value = ann.target;
      document.getElementById("annPublish").checked = ann.published;
      currentAnnouncementImage = ann.image || null;
      titleEl.setAttribute("data-i18n", "editAnnouncement");
      if (window.i18n)
        titleEl.textContent =
          announcementTranslations[window.i18n.currentLang].editAnnouncement;
    }
  } else {
    document.getElementById("announcementForm").reset();
    currentAnnouncementImage = null;
    titleEl.setAttribute("data-i18n", "createAnnouncement");
    if (window.i18n)
      titleEl.textContent =
        announcementTranslations[window.i18n.currentLang].createAnnouncement;
  }

  const fileInput = document.getElementById("annImageInput");
  if (fileInput) fileInput.value = "";
  renderImagePreview();
  setupDragAndDrop();

  if (modal) {
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
    const msg = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar')
      ? 'يرجى اختيار ملف صورة صالح.'
      : 'Please select a valid image file.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const rawDataUrl = e.target.result;
    const img = new Image();
    img.onload = function () {
      const maxDim = 1200;
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
      currentAnnouncementImage = canvas.toDataURL("image/jpeg", 0.85);
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
 * @param {string} imgSrc Image source URL / DataURL
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
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

/**
 * Closes image lightbox modal.
 */
function closeImageLightbox() {
  const lightbox = document.getElementById("imageLightboxModal");
  if (lightbox) lightbox.style.display = "none";
  document.body.style.overflow = "";
}

/**
 * Closes a modal.
 * @param {string} modalId ID of the modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "";
}

/**
 * Saves announcement (create or update).
 */
function saveAnnouncement() {
  const title = document.getElementById("annTitle").value;
  const titleAr = document.getElementById("annTitleAr").value;
  const body = document.getElementById("annBody").value;
  const bodyAr = document.getElementById("annBodyAr").value;
  const priority = document.getElementById("annPriority").value;
  const target = document.getElementById("annTarget").value;
  const published = document.getElementById("annPublish").checked;

  if (!title || !titleAr || !body || !bodyAr) {
    const msg = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar')
      ? 'يرجى ملء جميع الحقول المطلوبة.'
      : 'Please fill all required fields.';
    if (typeof showToast === 'function') showToast(msg, 'warning');
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
    return;
  }

  if (editAnnouncementId) {
    const index = announcements.findIndex((a) => a.id === editAnnouncementId);
    if (index > -1) {
      announcements[index] = {
        ...announcements[index],
        title,
        titleAr,
        body,
        bodyAr,
        priority,
        target,
        published,
        image: currentAnnouncementImage,
      };
    }
  } else {
    const newAnn = {
      id: "ann" + Date.now(),
      title,
      titleAr,
      body,
      bodyAr,
      priority,
      target,
      published,
      image: currentAnnouncementImage,
      createdBy: currentUserId,
      createdByName: currentUserName || "Fatma El-Sherif",
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
  editAnnouncementId = id;
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.style.display = "flex";
    modal.scrollTop = 0;
  }
  document.body.style.overflow = "hidden";
}

/**
 * Confirms deletion of announcement.
 */
function confirmDelete() {
  if (editAnnouncementId) {
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
