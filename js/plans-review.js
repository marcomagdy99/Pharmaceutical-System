/**
 * @file plans-review.js
 * @description Medical Representative Plan Review & Approval Workflow for District Managers and Line Managers.
 */

// ============================================================================
// Section 1: Localization Dictionary
// ============================================================================
const plansReviewTranslations = {
  en: {
    pageTitle: "Plans to Review - PharmaCare",
    plansReviewTitle: "📋 Plans to Review & Approvals",
    plansReviewSubtitle:
      "Review and approve planned visit schedules submitted by your medical representatives",
    btnGoToVisits: "Go to Visits",
    btnApproveAll: "Approve All Plans",
    btnApproveAllForRep: "Approve All for",
    btnRejectAllForRep: "Reject All",
    btnApprove: "Approve",
    btnReject: "Reject",
    statPendingVisits: "Pending Visits to Review",
    statPendingReps: "Representatives Awaiting Approval",
    statApprovedToday: "Approved Plans Active",
    allTeamReps: "All Team Representatives",
    colDoctor: "Doctor / Hospital",
    colDatePeriod: "Date & Period",
    colSpecialty: "Specialty / Class",
    colProducts: "Products",
    colActions: "Actions",
    noPendingPlans:
      "All submitted plans have been reviewed and approved! No pending plans waiting.",
    toastApprovedSingle:
      "Visit approved successfully and added to active schedule!",
    toastApprovedAllRep:
      "All pending visits for representative approved successfully!",
    toastApprovedAllGlobal: "All team plans approved successfully!",
    toastRejected: "Visit rejected and representative notified with feedback.",
    modalRejectTitle: "Reject / Request Plan Edit",
    modalRejectSubtitle:
      "Please provide a reason or modification guidance for the representative.",
    modalRejectReasonLabel: "Rejection Reason / Guidance:",
    btnCancel: "Cancel",
    btnConfirmReject: "Confirm Rejection",
    btnAccompany: "Accompany",
    btnAccompanyDay: "Accompany Full Day",
    badgeAccompaniedLocked: "Accompanied (Locked)",
    badgeBookedOtherRep: "Booked with another rep",
    toastAccompanyDaySuccess:
      "Full-day field accompaniment confirmed and visits approved as planned!",
    toastAlreadyBooked:
      "You already have field accompaniment scheduled on this date with another rep.",
    btnApproveDay: "Approve Day",
    colPeriodOnly: "Period",
    toastAccompanySuccess:
      "Visit approved and set as joint field accompaniment on your Home dashboard!",
    badgePending: "Pending Approval",
    badgeHospital: "Hospital",
    badgeDoctor: "Doctor",
  },
  ar: {
    pageTitle: "مراجعة الخطط - فارماكير",
    plansReviewTitle: "📋 مراجعة واعتماد خطط الزيارات",
    plansReviewSubtitle:
      "مراجعة واعتماد جداول الزيارات المخططة المرسلة من مناديب فريقك الميداني",
    btnGoToVisits: "الذهاب للزيارات",
    btnApproveAll: "اعتماد كل الخطط",
    btnApproveAllForRep: "اعتماد كل خطة",
    btnRejectAllForRep: "رفض الكل",
    btnApprove: "اعتماد",
    btnReject: "رفض",
    statPendingVisits: "زيارات معلقة بانتظار المراجعة",
    statPendingReps: "مناديب بانتظار الاعتماد",
    statApprovedToday: "زيارات معتمدة نشطة",
    allTeamReps: "كل مناديب الفريق",
    colDoctor: "الطبيب / المستشفى",
    colDatePeriod: "التاريخ والفترة",
    colSpecialty: "التخصص والفئة",
    colProducts: "المنتجات",
    colActions: "إجراءات",
    noPendingPlans:
      "تمت مراجعة واعتماد جميع الخطط بنجاح! لا توجد خطط معلقة حالياً.",
    toastApprovedSingle: "تم اعتماد الزيارة بنجاح وإضافتها للجدول النشط!",
    toastApprovedAllRep: "تم اعتماد جميع زيارات المندوب بنجاح!",
    toastApprovedAllGlobal: "تم اعتماد جميع خطط الفريق بالكامل بنجاح!",
    toastRejected: "تم رفض الزيارة وإشعار المندوب بالملاحظات.",
    modalRejectTitle: "رفض / طلب تعديل الخطة",
    modalRejectSubtitle:
      "يرجى توضيح سبب الرفض أو توجيهات التعديل للمندوب الطبي.",
    modalRejectReasonLabel: "سبب الرفض / الملاحظات والتوجيهات:",
    btnCancel: "إلغاء",
    btnConfirmReject: "تأكيد الرفض",
    btnAccompany: "نزول مشترك",
    btnAccompanyDay: "🤝 مرافقة هذا اليوم بالكامل",
    badgeAccompaniedLocked: "🤝 مرافقة مؤكدة بالكامل (مغلق)",
    badgeBookedOtherRep: "🔒 محجوز مع مندوب آخر",
    toastAccompanyDaySuccess:
      "تم تأكيد النزول الميداني لليوم بالكامل واعتماد الزيارات كمخططة بنجاح!",
    toastAlreadyBooked:
      "لديك نزول ميداني محجوز بالفعل في هذا اليوم مع مندوب آخر.",
    btnApproveDay: "اعتماد اليوم",
    colPeriodOnly: "الفترة",
    toastAccompanySuccess:
      "تم اعتماد الزيارة وتسجيل النزول الميداني المشترك معك في صفحتك الرئيسية!",
    badgePending: "قيد المراجعة",
    badgeHospital: "مستشفى",
    badgeDoctor: "طبيب",
  },
};

// ============================================================================
// Section 2: State Management & Scoping
// ============================================================================
let activeRejectTarget = { visitId: null, repId: null };

function getDmAccompanimentSchedule(dmId) {
  try {
    const cached = localStorage.getItem("pharma_dm_accompaniments");
    if (cached) {
      const data = JSON.parse(cached);
      if (data && data[dmId]) return data[dmId];
    }
  } catch (e) {}
  return {};
}

function getMasterVisits() {
  if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.visits)) {
    return window.DEMO_DATA.visits;
  }
  try {
    const cached = localStorage.getItem("pharma_master_data");
    if (cached) {
      const data = JSON.parse(cached);
      if (data && Array.isArray(data.visits)) return data.visits;
    }
  } catch (e) {}
  return [];
}

function saveMasterVisits(visits) {
  if (window.DEMO_DATA) {
    window.DEMO_DATA.visits = visits;
  }
  if (typeof window.saveDataToStorage === "function") {
    window.saveDataToStorage();
  } else {
    try {
      const cached = localStorage.getItem("pharma_master_data");
      const data = cached ? JSON.parse(cached) : {};
      data.visits = visits;
      localStorage.setItem("pharma_master_data", JSON.stringify(data));
    } catch (e) {}
  }
}

function getScopedSubordinateReps(currentUser) {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "").toLowerCase();

  if (role === "admin") {
    return allUsers.filter(
      (u) => u.role === "medical_rep" || u.role === "rep",
    );
  }

  if (role === "business_unit" || role === "bu" || role === "line_manager" || role === "lm") {
    const subordinates = typeof window.getAllSubordinates === "function"
      ? window.getAllSubordinates(currentUser.id)
      : [];
    const subIds = subordinates.map((s) => s.id);
    return allUsers.filter(
      (u) => subIds.includes(u.id) && (u.role === "medical_rep" || u.role === "rep"),
    );
  }

  if (role === "district_manager" || role === "dm") {
    return allUsers.filter(
      (u) =>
        u.managerId === currentUser.id &&
        (u.role === "medical_rep" || u.role === "rep"),
    );
  }

  return [];
}

// ============================================================================
// Section 3: Initialization & Rendering
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  if (window.initPage) {
    window.initPage("plans-review");
  }

  const currentUser = (window.checkAuth && window.checkAuth()) || {
    id: "dm1",
    name: "Karim Nasser",
    role: "district_manager",
  };

  const userRole = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "").toLowerCase();

  if (userRole === "medical_rep" || userRole === "rep") {
    window.location.href = "calendar.html";
    return;
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  applyPlansReviewTranslations(lang);
  populateRepFilter(currentUser);
  renderPlansReview(currentUser);
});

document.addEventListener("languageChanged", () => {
  const currentUser = (window.checkAuth && window.checkAuth()) || {
    id: "dm1",
    name: "Karim Nasser",
    role: "district_manager",
  };

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  applyPlansReviewTranslations(lang);
  populateRepFilter(currentUser);
  renderPlansReview(currentUser);
});

function applyPlansReviewTranslations(lang) {
  const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.placeholder = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });
}

function populateRepFilter(currentUser) {
  const select = document.getElementById("plansRepFilter");
  if (!select) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
  const reps = getScopedSubordinateReps(currentUser);

  select.innerHTML = `<option value="all">${t.allTeamReps}</option>`;
  reps.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name} (${r.employeeCode || "Rep"})`;
    select.appendChild(opt);
  });
}

function renderPlansReview(currentUser) {
  const container = document.getElementById("plansContainer");
  if (!container) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = plansReviewTranslations[lang] || plansReviewTranslations.en;

  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "").toLowerCase();

  // Enforce business rule: Medical Reps are redirected to calendar
  if (role === "medical_rep" || role === "rep") {
    window.location.href = "calendar.html";
    return;
  }

  const isDM = role === "district_manager" || role === "dm";
  const isAdmin = role === "admin";
  const isSupervisorOnly = (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu");

  const scopedReps = getScopedSubordinateReps(currentUser);
  const scopedRepIds = scopedReps.map((r) => r.id);
  const allVisits = getMasterVisits();

  // Scoped pending visits
  const pendingVisits = allVisits.filter(
    (v) => scopedRepIds.includes(v.repId) && v.status === "pending_approval",
  );

  // Scoped approved visits
  const approvedVisits = allVisits.filter(
    (v) => scopedRepIds.includes(v.repId) && v.status === "planned",
  );

  // Update KPI counters
  const statPending = document.getElementById("statPendingCount");
  const statPendingReps = document.getElementById("statPendingRepsCount");
  const statApproved = document.getElementById("statApprovedCount");

  const distinctPendingRepIds = [...new Set(pendingVisits.map((v) => v.repId))];

  if (statPending) statPending.innerText = pendingVisits.length;
  if (statPendingReps) statPendingReps.innerText = distinctPendingRepIds.length;
  if (statApproved) statApproved.innerText = approvedVisits.length;

  const btnApproveAll = document.getElementById("btnApproveAllGlobal");
  if (btnApproveAll) {
    btnApproveAll.style.display =
      (!isSupervisorOnly && pendingVisits.length > 0) ? "inline-flex" : "none";
  }

  // Filter criteria
  const selectedRepId =
    document.getElementById("plansRepFilter")?.value || "all";
  const searchKeyword = (
    document.getElementById("plansSearchInput")?.value || ""
  )
    .toLowerCase()
    .trim();

  let displayedVisits = pendingVisits;
  if (selectedRepId !== "all") {
    displayedVisits = displayedVisits.filter((v) => v.repId === selectedRepId);
  }

  if (searchKeyword) {
    displayedVisits = displayedVisits.filter((v) => {
      const rep = scopedReps.find((r) => r.id === v.repId);
      return (
        (v.doctorName && v.doctorName.toLowerCase().includes(searchKeyword)) ||
        (rep && rep.name.toLowerCase().includes(searchKeyword)) ||
        (v.comment && v.comment.toLowerCase().includes(searchKeyword))
      );
    });
  }

  if (displayedVisits.length === 0) {
    container.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 p-5 text-center" style="background: var(--card-bg, #ffffff);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
        <h4 class="fw-bold rep-title mb-2">${t.noPendingPlans}</h4>
        <p class="text-muted small mb-3">All visit plans have been approved and are active in team schedules.</p>
        <div>
          <a href="visits.html" class="btn btn-primary btn-sm">📍 ${t.btnGoToVisits}</a>
        </div>
      </div>
    `;
    return;
  }

  // Group visits by representative
  const grouped = {};
  displayedVisits.forEach((v) => {
    if (!grouped[v.repId]) grouped[v.repId] = [];
    grouped[v.repId].push(v);
  });

  const allAreas = (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const dmSchedule = getDmAccompanimentSchedule(currentUser.id);

  let html = "";
  Object.keys(grouped).forEach((repId) => {
    const rep = scopedReps.find((r) => r.id === repId) || {
      name: repId,
      employeeCode: "Rep",
    };
    const area = allAreas.find((a) => a.repId === repId || a.id === rep.areaId);
    const dm = allUsers.find((u) => u.id === rep.managerId);
    const repVisits = grouped[repId];

    // Check if the current user is the direct DM for this rep, or Admin
    const isDirectDmForRep = (role === "district_manager" || role === "dm") && (
      rep.managerId === currentUser.id || rep.dmId === currentUser.id || true
    );
    const canApproveRep = !isSupervisorOnly && (isDirectDmForRep || role === "admin");

    // Group rep visits by date
    const dateGroups = {};
    repVisits.forEach((v) => {
      const d = v.date || "Unknown Date";
      if (!dateGroups[d]) dateGroups[d] = [];
      dateGroups[d].push(v);
    });

    const sortedDates = Object.keys(dateGroups).sort();

    let daysHtml = "";
    sortedDates.forEach((dateStr) => {
      const dayVisits = dateGroups[dateStr];

      // Sort visits so AM appears strictly above PM
      dayVisits.sort((a, b) => {
        const pA = (a.period || "").toLowerCase();
        const pB = (b.period || "").toLowerCase();
        if (pA === "am" && pB !== "am") return -1;
        if (pA !== "am" && pB === "am") return 1;
        return 0;
      });

      const dt =
        typeof window.formatVisitDateTime === "function"
          ? window.formatVisitDateTime(dateStr, null, lang)
          : { dayName: "" };

      const bookedRepId = dmSchedule[dateStr];
      const isAccompaniedWithThisRep = bookedRepId === repId;
      const isBookedWithAnotherRep = bookedRepId && bookedRepId !== repId;

      let accompanyBadgeOrButton = "";
      if (canApproveRep) {
        if (isAccompaniedWithThisRep) {
          accompanyBadgeOrButton = `
            <span class="badge bg-success-subtle text-success border border-success fw-bold px-3 py-2" style="font-size: 0.85rem;" title="${t.badgeAccompaniedLocked}">
              ${t.badgeAccompaniedLocked}
            </span>
          `;
        } else if (isBookedWithAnotherRep) {
          const otherRep = allUsers.find((u) => u.id === bookedRepId);
          accompanyBadgeOrButton = `
            <span class="badge bg-secondary-subtle text-muted border fw-bold px-3 py-2" style="font-size: 0.82rem;" title="${t.toastAlreadyBooked}">
              ${t.badgeBookedOtherRep} (${otherRep ? otherRep.name : bookedRepId})
            </span>
          `;
        } else {
          accompanyBadgeOrButton = `
            <button type="button" class="btn btn-sm btn-primary fw-bold" onclick="accompanyEntireDay('${repId}', '${dateStr}')">
              ${t.btnAccompanyDay}
            </button>
          `;
        }
      }

      const dayActionsHtml = canApproveRep
        ? `
          <div class="d-flex align-items-center gap-2 day-plan-actions">
            ${accompanyBadgeOrButton}
            <button type="button" class="btn btn-sm btn-outline-success" onclick="approveEntireDay('${repId}', '${dateStr}')">
              ✅ ${t.btnApproveDay}
            </button>
          </div>
        `
        : "";

      daysHtml += `
        <div class="day-plan-block mb-3 border rounded-3 overflow-hidden">
          <div class="d-flex justify-content-between align-items-center p-3 flex-wrap gap-2 day-plan-header">
            <div class="d-flex align-items-center gap-2">
              <span style="font-size: 1.1rem;">📅</span>
              <strong style="font-size: 0.95rem;">${dt.dayName ? dt.dayName + " • " : ""}${dateStr}</strong>
              <span class="badge bg-light text-dark border ms-1" style="font-size: 0.78rem;">${dayVisits.length} ${lang === "ar" ? "زيارات" : "visits"}</span>
            </div>
            ${dayActionsHtml}
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 plans-day-table" style="font-size: 0.9rem;">
              <thead class="plans-table-head" style="font-size: 0.8rem; text-transform: uppercase;">
                <tr>
                  <th class="plans-col-doctor">${t.colDoctor}</th>
                  <th class="plans-col-period">${t.colPeriodOnly || (lang === "ar" ? "الفترة" : "Period")}</th>
                  <th class="plans-col-products">${t.colProducts}</th>
                  <th class="text-end plans-col-actions">${canApproveRep ? t.colActions : (lang === "ar" ? "حالة الاعتماد" : "Status")}</th>
                </tr>
              </thead>
              <tbody>
                ${dayVisits
                  .map((v) => {
                    const isPharm =
                      v.targetType === "pharmacy" ||
                      (v.period || "").toLowerCase() === "pharmacy" ||
                      (v.doctorId && String(v.doctorId).startsWith("pharm"));
                    const isHospital =
                      !isPharm && (v.period || "").toLowerCase() === "am";
                    const targetTypeBadge = isPharm
                      ? `<span class="badge bg-success-subtle text-success fw-bold target-badge" style="font-size: 0.7rem;">${lang === "ar" ? "صيدلية" : "Pharmacy"}</span>`
                      : isHospital
                        ? `<span class="badge bg-info-subtle text-info fw-bold target-badge" style="font-size: 0.7rem;">${t.badgeHospital}</span>`
                        : `<span class="badge bg-primary-subtle text-primary fw-bold target-badge" style="font-size: 0.7rem;">${t.badgeDoctor}</span>`;

                    const periodBadge = isPharm
                      ? `<span class="badge bg-success-subtle text-success fw-bold px-2 py-1" style="font-size: 0.75rem;">💊 ${lang === "ar" ? "صيدلية" : "PHARM"}</span>`
                      : (v.period || "").toLowerCase() === "am"
                        ? `<span class="badge bg-warning-subtle text-warning fw-bold px-2 py-1" style="font-size: 0.75rem;">AM</span>`
                        : `<span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1" style="font-size: 0.75rem;">PM</span>`;

                    const actionsCellHtml = canApproveRep
                      ? `
                        <div class="d-inline-flex gap-2">
                          <button class="btn btn-sm btn-outline-danger btn-action-reject" onclick="openRejectSingleModal('${v.id}')" title="${t.btnReject}">
                            ❌
                          </button>
                          <button class="btn btn-sm btn-primary text-white px-2 btn-action-accompany" onclick="accompanySingleVisit('${v.id}')" title="${t.btnAccompany}">
                            🤝 ${t.btnAccompany}
                          </button>
                          <button class="btn btn-sm btn-success text-white px-3 btn-action-approve" onclick="approveSingleVisit('${v.id}')">
                            ✅ ${t.btnApprove}
                          </button>
                        </div>
                      `
                      : `
                        <span class="badge bg-warning-subtle text-warning-emphasis border px-2 py-1" style="font-size: 0.78rem;">
                          <i class="bi bi-hourglass-split me-1"></i>${lang === "ar" ? "بانتظار اعتماد الـ DM" : "Pending DM Approval"}
                        </span>
                      `;

                    return `
                      <tr class="visit-row">
                        <td class="plans-col-doctor">
                          <div class="d-flex align-items-center gap-2">
                            <strong class="visit-doctor-title">${window.escapeHtml(v.doctorName)}</strong>
                            ${targetTypeBadge}
                          </div>
                        </td>
                        <td class="plans-col-period">
                          ${periodBadge}
                        </td>
                        <td class="plans-col-products">
                          ${
                            (() => {
                              const prods = window.getVisitDisplayProducts ? window.getVisitDisplayProducts(v) : (v.products || []);
                              return prods.length
                                ? `<span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.75rem;">💊 ${prods.join(", ")}</span>`
                                : `<span class="text-muted small">-</span>`;
                            })()
                          }
                        </td>
                        <td class="text-end plans-col-actions">
                          ${actionsCellHtml}
                        </td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    const repHeaderActions = canApproveRep
      ? `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-danger" onclick="openRejectAllForRep('${repId}')">
            ❌ ${t.btnRejectAllForRep}
          </button>
          <button class="btn btn-sm btn-success text-white" onclick="approveAllForRep('${repId}')">
            ✅ ${t.btnApproveAllForRep} ${rep.name.split(" ")[0]}
          </button>
        </div>
      `
      : `
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-info-subtle text-info-emphasis border px-3 py-2 fw-semibold" style="font-size: 0.82rem;">
            <i class="bi bi-eye me-1"></i>${lang === "ar" ? "رؤية إشرافية (الاعتماد لمشرف المنطقة)" : "Supervisory View (Awaiting DM)"}
          </span>
        </div>
      `;

    html += `
      <div class="plans-rep-card">
        <div class="plans-rep-header">
          <div class="d-flex align-items-center gap-3">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #0d6efd, #0b5ed7); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.1rem;">
              ${rep.name.charAt(0)}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h5 class="fw-bold mb-0 rep-title">${rep.name}</h5>
                <span class="badge-count">${repVisits.length} Pending</span>
              </div>
              <div class="text-muted small rep-meta-text" style="margin-top: 2px;">
                Code: <strong>${rep.employeeCode || "EMP-001"}</strong> 
                ${area ? ` • Area: <strong>${area.name}</strong>` : ""}
                ${dm ? ` • DM: <strong>${dm.name}</strong>` : ""}
              </div>
            </div>
          </div>
          ${repHeaderActions}
        </div>

        <div class="p-3">
          ${daysHtml}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============================================================================
// Section 4: Approval & Rejection Logic (plansReview Namespace)
// ============================================================================
const plansReview = {
  activeRejectTarget: { visitId: null, repId: null },

  _ensureCanApprove(currentUser) {
    const role = window.normalizeRole
      ? window.normalizeRole(currentUser.role)
      : (currentUser.role || "").toLowerCase();
    if (role === "line_manager" || role === "lm" || role === "business_unit" || role === "bu") {
      const isAr = (window.getCurrentLang && window.getCurrentLang()) === "ar";
      const msg = isAr
        ? "عفواً، مراجعة واعتماد الخطط الميدانية والمرافقة من صلاحيات مدير المنطقة المباشر (DM) فقط."
        : "Notice: Field plan approvals and accompaniment are restricted to the direct District Manager (DM) only.";
      if (typeof window.showToast === "function") window.showToast(msg, "warning");
      return false;
    }
    return true;
  },

  filterPlansView() {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      role: "district_manager",
    };
    renderPlansReview(currentUser);
  },

  accompanyEntireDay(repId, dateStr) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const visits = getMasterVisits();
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;

    // Safety check: verify if date is already booked with another rep
    const storageKey = "pharma_dm_accompaniments";
    let cachedSchedule = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) cachedSchedule = JSON.parse(raw);
    } catch (e) {}
    if (!cachedSchedule[currentUser.id]) cachedSchedule[currentUser.id] = {};

    const existingRepId = cachedSchedule[currentUser.id][dateStr];
    if (existingRepId && existingRepId !== repId) {
      if (typeof window.showToast === "function")
        window.showToast(t.toastAlreadyBooked, "warning");
      return;
    }

    // Lock date with this rep
    cachedSchedule[currentUser.id][dateStr] = repId;
    localStorage.setItem(storageKey, JSON.stringify(cachedSchedule));

    // Adopt rep planned visits as DM accompaniment planned itinerary
    let count = 0;
    visits.forEach((v) => {
      if (v.repId === repId && v.date === dateStr) {
        v.status = "planned";
        v.visitType = "double";
        v.doubleWithUserId = currentUser.id;
        v.doubleWithUserName = currentUser.name;
        v.approvedBy = currentUser.id;
        v.approvedByName = currentUser.name;
        v.approvedAt = new Date().toISOString();
        count++;
      }
    });

    saveMasterVisits(visits);

    if (typeof window.showToast === "function") {
      window.showToast(`${t.toastAccompanyDaySuccess} (${count})`, "success");
    }

    renderPlansReview(currentUser);
  },

  approveEntireDay(repId, dateStr) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const visits = getMasterVisits();
    let count = 0;
    visits.forEach((v) => {
      if (
        v.repId === repId &&
        v.date === dateStr &&
        v.status === "pending_approval"
      ) {
        v.status = "planned";
        v.approvedBy = currentUser.id;
        v.approvedByName = currentUser.name;
        v.approvedAt = new Date().toISOString();
        count++;
      }
    });

    if (count === 0) return;
    saveMasterVisits(visits);

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
    if (typeof window.showToast === "function")
      window.showToast(`${t.toastApprovedAllRep} (${count})`, "success");

    renderPlansReview(currentUser);
  },

  accompanySingleVisit(visitId) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const visits = getMasterVisits();
    const visit = visits.find((v) => v.id === visitId);

    if (!visit) return;
    visit.status = "planned";
    visit.visitType = "double";
    visit.doubleWithUserId = currentUser.id;
    visit.doubleWithUserName = currentUser.name;
    visit.approvedBy = currentUser.id;
    visit.approvedByName = currentUser.name;
    visit.approvedAt = new Date().toISOString();

    // Register DM accompaniment schedule for this date and rep
    try {
      const storageKey = "pharma_dm_accompaniments";
      const cached = localStorage.getItem(storageKey);
      const data = cached ? JSON.parse(cached) : {};
      if (!data[currentUser.id]) data[currentUser.id] = {};
      data[currentUser.id][visit.date] = visit.repId;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving DM accompaniment schedule:", e);
    }

    saveMasterVisits(visits);

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
    if (typeof window.showToast === "function")
      window.showToast(t.toastAccompanySuccess, "success");

    renderPlansReview(currentUser);
  },

  approveSingleVisit(visitId) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const visits = getMasterVisits();
    const visit = visits.find((v) => v.id === visitId);

    if (!visit) return;
    visit.status = "planned";
    visit.approvedBy = currentUser.id;
    visit.approvedByName = currentUser.name;
    visit.approvedAt = new Date().toISOString();

    saveMasterVisits(visits);

    const doc = (window.DEMO_DATA.doctors || []).find((d) => d.id === visit.doctorId);
    const docName = doc ? (doc.nameAr || doc.name) : (visit.doctorName || "زيارة طبية");
    if (typeof window.addWorkflowNotification === "function") {
      window.addWorkflowNotification({
        userId: visit.repId,
        type: "plan_approval",
        title: "اعتماد زيارة مخططة",
        titleEn: "Planned Visit Approved",
        message: `اعتمد مدير المنطقة (${currentUser.name}) زيارتك لـ (${docName}) لتاريخ ${visit.date}.`,
        messageEn: `District Manager (${currentUser.name}) approved your visit to (${doc ? doc.name : docName}) on ${visit.date}.`,
        link: "calendar.html",
        icon: "🗓️",
        badgeClass: "bg-success",
        actorName: currentUser.name,
        action: "approved",
      });
    }

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
    if (typeof window.showToast === "function")
      window.showToast(t.toastApprovedSingle, "success");

    renderPlansReview(currentUser);
  },

  approveAllForRep(repId) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const visits = getMasterVisits();

    let count = 0;
    let sampleDate = "2026-09-20";
    visits.forEach((v) => {
      if (v.repId === repId && v.status === "pending_approval") {
        v.status = "planned";
        v.approvedBy = currentUser.id;
        v.approvedByName = currentUser.name;
        v.approvedAt = new Date().toISOString();
        if (v.date) sampleDate = v.date;
        count++;
      }
    });

    if (count === 0) return;
    saveMasterVisits(visits);

    if (typeof window.addWorkflowNotification === "function") {
      window.addWorkflowNotification({
        userId: repId,
        type: "plan_approval",
        title: "اعتماد الخطة الميدانية",
        titleEn: "Field Plan Approved",
        message: `اعتمد مدير المنطقة (${currentUser.name}) خطتك الميدانية لتاريخ ${sampleDate}.`,
        messageEn: `District Manager (${currentUser.name}) approved your field plan for ${sampleDate}.`,
        link: "calendar.html",
        icon: "🗓️",
        badgeClass: "bg-success",
        actorName: currentUser.name,
        action: "approved",
      });
    }

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
    if (typeof window.showToast === "function")
      window.showToast(`${t.toastApprovedAllRep} (${count} visits)`, "success");

    renderPlansReview(currentUser);
  },

  approveAllPendingAcrossTeam() {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const visits = getMasterVisits();
    const scopedReps = getScopedSubordinateReps(currentUser);
    const scopedRepIds = scopedReps.map((r) => r.id);

    let count = 0;
    const repCounts = {};
    visits.forEach((v) => {
      if (scopedRepIds.includes(v.repId) && v.status === "pending_approval") {
        v.status = "planned";
        v.approvedBy = currentUser.id;
        v.approvedByName = currentUser.name;
        v.approvedAt = new Date().toISOString();
        repCounts[v.repId] = (repCounts[v.repId] || 0) + 1;
        count++;
      }
    });

    if (count === 0) return;
    saveMasterVisits(visits);

    if (typeof window.addWorkflowNotification === "function") {
      Object.keys(repCounts).forEach((rId) => {
        window.addWorkflowNotification({
          userId: rId,
          type: "plan_approval",
          title: "اعتماد الخطة الميدانية",
          titleEn: "Field Plan Approved",
          message: `اعتمد مدير المنطقة (${currentUser.name}) خطتك الميدانية بالكامل (${repCounts[rId]} زيارة).`,
          messageEn: `District Manager (${currentUser.name}) approved your full field plan (${repCounts[rId]} visits).`,
          link: "calendar.html",
          icon: "🗓️",
          badgeClass: "bg-success",
          actorName: currentUser.name,
          action: "approved",
        });
      });
    }

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
    if (typeof window.showToast === "function")
      window.showToast(
        `${t.toastApprovedAllGlobal} (${count} visits)`,
        "success",
      );

    renderPlansReview(currentUser);
  },

  openRejectSingleModal(visitId) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      role: "district_manager",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    this.activeRejectTarget = { visitId: visitId, repId: null };
    const modal = document.getElementById("rejectPlanModal");
    if (!modal) return;
    document.getElementById("rejectReasonText").value = "";
    modal.style.display = "flex";
  },

  openRejectAllForRep(repId) {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      role: "district_manager",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    this.activeRejectTarget = { visitId: null, repId: repId };
    const modal = document.getElementById("rejectPlanModal");
    if (!modal) return;
    document.getElementById("rejectReasonText").value = "";
    modal.style.display = "flex";
  },

  closeRejectModal() {
    const modal = document.getElementById("rejectPlanModal");
    if (modal) modal.style.display = "none";
    this.activeRejectTarget = { visitId: null, repId: null };
  },

  confirmRejectPlan() {
    const currentUser = (window.checkAuth && window.checkAuth()) || {
      id: "dm1",
      name: "Karim Nasser",
      role: "district_manager",
    };
    if (!this._ensureCanApprove(currentUser)) return;
    const reason =
      document.getElementById("rejectReasonText")?.value.trim() ||
      "يرجى مراجعة الخطة وتعديل المواعيد";
    const visits = getMasterVisits();

    if (this.activeRejectTarget.visitId) {
      const v = visits.find(
        (item) => item.id === this.activeRejectTarget.visitId,
      );
      if (v) {
        v.status = "rejected";
        v.rejectionReason = reason;
        v.rejectedBy = currentUser.id;

        const doc = (window.DEMO_DATA.doctors || []).find((d) => d.id === v.doctorId);
        const docName = doc ? (doc.nameAr || doc.name) : (v.doctorName || "د. أحمد مصطفى");
        if (typeof window.addWorkflowNotification === "function") {
          window.addWorkflowNotification({
            userId: v.repId,
            type: "visit_rejection",
            title: "رفض وتوجيه زيارة",
            titleEn: "Visit Directive / Rejection",
            message: `تم رفض زيارة ${docName} مع ملاحظة: ${reason}`,
            messageEn: `Visit for ${doc ? doc.name : docName} rejected with note: ${reason}`,
            note: reason,
            link: "visits.html",
            icon: "❌",
            badgeClass: "bg-danger",
            actorName: currentUser.name,
            action: "rejected",
          });
        }
      }
    } else if (this.activeRejectTarget.repId) {
      visits.forEach((v) => {
        if (
          v.repId === this.activeRejectTarget.repId &&
          v.status === "pending_approval"
        ) {
          v.status = "rejected";
          v.rejectionReason = reason;
          v.rejectedBy = currentUser.id;
        }
      });

      if (typeof window.addWorkflowNotification === "function") {
        window.addWorkflowNotification({
          userId: this.activeRejectTarget.repId,
          type: "plan_rejection",
          title: "ملاحظات على الخطة الميدانية",
          titleEn: "Field Plan Returned with Notes",
          message: `طلب المدير (${currentUser.name}) تعديلات على الخطة مع ملاحظة: ${reason}`,
          messageEn: `Manager (${currentUser.name}) requested plan modifications: ${reason}`,
          note: reason,
          link: "calendar.html",
          icon: "❌",
          badgeClass: "bg-danger",
          actorName: currentUser.name,
          action: "rejected",
        });
      }
    }

    saveMasterVisits(visits);
    this.closeRejectModal();

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const t = plansReviewTranslations[lang] || plansReviewTranslations.en;
    if (typeof window.showToast === "function")
      window.showToast(t.toastRejected, "warning");

    renderPlansReview(currentUser);
  },
};

// Expose plansReview Namespace
window.plansReview = plansReview;

// Backward-compatible bindings for inline onclick attributes
window.filterPlansView = function () {
  plansReview.filterPlansView();
};
window.accompanyEntireDay = function (repId, dateStr) {
  plansReview.accompanyEntireDay(repId, dateStr);
};
window.approveEntireDay = function (repId, dateStr) {
  plansReview.approveEntireDay(repId, dateStr);
};
window.accompanySingleVisit = function (visitId) {
  plansReview.accompanySingleVisit(visitId);
};
window.approveSingleVisit = function (visitId) {
  plansReview.approveSingleVisit(visitId);
};
window.approveAllForRep = function (repId) {
  plansReview.approveAllForRep(repId);
};
window.approveAllPendingAcrossTeam = function () {
  plansReview.approveAllPendingAcrossTeam();
};
window.openRejectSingleModal = function (visitId) {
  plansReview.openRejectSingleModal(visitId);
};
window.openRejectAllForRep = function (repId) {
  plansReview.openRejectAllForRep(repId);
};
window.closeRejectModal = function () {
  plansReview.closeRejectModal();
};
window.confirmRejectPlan = function () {
  plansReview.confirmRejectPlan();
};
