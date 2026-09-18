/**
 * @file visits.js
 * @description Visits Management Module supporting Multi-Doctor Bulk Planning, Direct Actual Logging, Co-Visiting (Double Visits), and 7-Day Auto-Expiry.
 */

// ============================================================================
// Section 1: Localization Dictionary
// ============================================================================
const visitTranslations = {
  en: {
    visitsTitle: "Visits",
    addVisit: "Add Visit",
    logActualVisit: "Log Actual Visit",
    planVisit: "Plan Visits (Bulk)",
    statTotal: "Total:",
    statCompleted: "Completed:",
    statPending: "Active Pending:",
    tabToday: "Today's Plan",
    tabAll: "All Visits",
    amHospitals: "Hospitals",
    pmDoctors: "Doctors",
    filterAll: "All Statuses",
    filterPlanned: "Planned",
    filterCompleted: "Completed",
    filterAllPeriod: "All Periods",
    filterAM: "AM",
    filterPM: "PM",
    allReps: "All Team Reps",
    colDocHosp: "Doctor/Hospital",
    colDate: "Date",
    colPeriod: "Period",
    colType: "Type",
    colStatus: "Status",
    colProducts: "Products",
    colActions: "Actions",
    modalAddVisit: "Add New Visit",
    modalCompleteVisit: "Complete Visit",
    modalDate: "Date",
    modalPeriod: "Target Type / Period",
    modalAM: "AM (Hospital)",
    modalPM: "PM (Doctor)",
    modalPharmacy: "💊 Pharmacy",
    filterPharmacies: "Pharmacies",
    targetPharmacy: "Pharmacy",
    targetHospital: "Hospital",
    targetDoctor: "Doctor",
    modalTarget: "Doctor/Hospital/Pharmacy",
    modalFilterDoctor: "Filter Doctor by Team Member",
    modalAccompaniedRep: "Accompanied Rep",
    modalType: "Visit Type",
    modalSingle: "Single",
    modalDouble: "Double",
    modalSelectManager: "Accompanied By",
    modalProducts: "Products Discussed",
    modalGiveawaySamples: "Giveaway Samples",
    modalComment: "Comment",
    modalGpsTitle: "GPS Geofencing Verification",
    gpsBadgePending: "Pending Check",
    gpsBadgeChecking: "Checking GPS... 🛰️",
    gpsBadgeInRange: "✅ In Range",
    gpsBadgeOutOfRange: "⚠️ Out of Range",
    gpsBadgeDenied: "⚠️ GPS Denied",
    gpsInfoDefault: "Verifying your presence within the clinic geofence radius (200m).",
    gpsInfoInRange: "You are verified within the clinic radius (less than 200m).",
    gpsInfoOutOfRange: "You are outside the clinic radius. Visit will be recorded with an audit flag.",
    gpsInfoDenied: "Location permission denied. Visit will be recorded with an audit flag for your manager.",
    btnCheckGps: "📡 Check Location Now",
    btnCancel: "Cancel",
    btnSaveVisit: "Save Visit",
    btnComplete: "Complete Visit",
    btnDelete: "Delete",
    confirmDeleteVisitPrompt:
      "Are you sure you want to permanently delete this visit?",
    visitDeletedSuccess: "Visit deleted successfully.",
    noDeletePermission: "You do not have permission to delete this visit.",
    statusPlanned: "Planned",
    statusPending_approval: "Pending Approval",
    statusCompleted: "Completed",
    statusRejected: "Rejected",
    filterPendingApproval: "Pending Approval",
    typeSingle: "Single",
    typeDouble: "Double",
    directActual: "Direct Actual",
    fromPlan: "From Plan",
    selectAll: "Select All",
    btnExportCSV: "Export CSV",
    btnPrint: "Print",
    filterAllClasses: "All Target Classes",
    teamFilterLabel: "Team Filter:",
    tabDailyTimeline: "Daily Visits Timeline",
    timelineSelectDate: "Select Date:",
    btnShow: "Show",
    plannedExecuted: "Planned & Executed",
    jointVisitBadge: "Joint Visit (Co-Visiting)",
    totalEventsToday: "Total Events Today:",
    actualActivities: "Actual / Activities:",
    fromPlanStat: "From Plan:",
    jointVisitsCount: "Joint Visits:",
    noTimelineEvents: "No visits or activities recorded on this date",
    selectAnotherDate: "Select another date like 2026-09-02 or 2026-09-03",
    entryTimestamp: "Entry Timestamp:",
    loggedActivity: "Logged Activity",
    supervisoryVisit: "DM Single",
    jointVisitWithRep: "Joint Visit (Co-Visiting with Rep)",
    promptSelectDateAndShow: 'Select a date and click "Show" to view visits',
    promptSelectDateSub:
      "Choose your desired date and filters above, then click the Show button to load the daily visits timeline.",
    filterArea: "Area:",
    allAreas: "All Areas",
    filterPeriod: "Period:",
    allPeriods: "All Periods",
    periodAM: "AM (Hospitals)",
    periodPM: "PM (Doctors)",
    periodPharm: "Pharmacy",
    filterStatus: "Status:",
    allStatuses: "All Statuses",
    statusExecuted: "Executed / Actual",
    statusPlannedOnly: "Planned",
  },
  ar: {
    visitsTitle: "الزيارات",
    addVisit: "إضافة زيارة",
    logActualVisit: "إدخال زيارة فعلية",
    planVisit: "تخطيط زيارات (مجمع)",
    statTotal: "الإجمالي:",
    statCompleted: "مكتمل:",
    statPending: "قيد الانتظار النشط:",
    tabToday: "خطة اليوم",
    tabDailyTimeline: "الخط الزمني للزيارات اليومية",
    tabAll: "كل الزيارات",
    amHospitals: "المستشفيات",
    pmDoctors: "الأطباء",
    filterAll: "كل الحالات",
    filterPlanned: "مخطط",
    filterCompleted: "مكتمل",
    filterAllPeriod: "كل الفترات",
    filterAM: "صباحاً",
    filterPM: "مساءً",
    allReps: "كل مناديب الفريق",
    teamFilterLabel: "تصفية الفريق:",
    colDocHosp: "الطبيب/المستشفى/الصيدلية",
    colDate: "التاريخ",
    colPeriod: "الفترة",
    colType: "النوع",
    colStatus: "الحالة",
    colProducts: "المنتجات",
    colActions: "إجراءات",
    modalAddVisit: "إضافة زيارة جديدة",
    modalCompleteVisit: "إكمال الزيارة",
    modalDate: "التاريخ",
    modalPeriod: "نوع الهدف / الفترة",
    modalAM: "صباحاً (مستشفى)",
    modalPM: "مساءً (طبيب)",
    modalPharmacy: "💊 صيدلية",
    filterPharmacies: "الصيدليات",
    targetPharmacy: "صيدلية",
    targetHospital: "مستشفى",
    targetDoctor: "طبيب",
    modalTarget: "الطبيب/المستشفى/الصيدلية",
    modalFilterDoctor: "تصفية الأطباء حسب أعضاء الفريق",
    modalAccompaniedRep: "المندوب المرافق",
    modalType: "نوع الزيارة",
    modalSingle: "فردي",
    modalDouble: "مزدوج",
    modalSelectManager: "مرافق مع",
    modalProducts: "المنتجات التي تمت مناقشتها",
    modalGiveawaySamples: "عينات ومواد دعائية (Giveaway Samples)",
    modalComment: "تعليق",
    modalGpsTitle: "التحقق الجغرافي (GPS Geofencing)",
    gpsBadgePending: "بانتظار الفحص",
    gpsBadgeChecking: "جاري الفحص... 🛰️",
    gpsBadgeInRange: "✅ داخل النطاق",
    gpsBadgeOutOfRange: "⚠️ خارج النطاق",
    gpsBadgeDenied: "⚠️ GPS معطل",
    gpsInfoDefault: "يتم التحقق من تواجدك داخل نطاق العيادة المسموح به (200 متر).",
    gpsInfoInRange: "أنت متواجد داخل نطاق العيادة المعتمد (أقل من 200 متر).",
    gpsInfoOutOfRange: "أنت خارج نطاق العيادة المعتمد. سيتم تسجيل الزيارة مع تنبيه تدقيق للمدير.",
    gpsInfoDenied: "تم تعطيل إذن الموقع أو إيقاف الـ GPS. سيتم تسجيل الزيارة مع وضع علامة تدقيق للإدارة.",
    btnCheckGps: "📡 فحص موقعي الآن",
    btnCancel: "إلغاء",
    btnSaveVisit: "حفظ الزيارة",
    btnComplete: "إكمال الزيارة",
    btnDelete: "حذف",
    confirmDeleteVisitPrompt: "هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟",
    visitDeletedSuccess: "تم حذف الزيارة بنجاح.",
    noDeletePermission: "ليس لديك صلاحية لحذف هذه الزيارة.",
    statusPlanned: "مخطط",
    statusPending_approval: "قيد المراجعة",
    statusCompleted: "مكتمل",
    statusRejected: "مرفوض",
    filterPendingApproval: "قيد المراجعة",
    typeSingle: "فردي",
    typeDouble: "مزدوج",
    directActual: "فعلية مباشرة",
    fromPlan: "من الخطة",
    selectAll: "تحديد الكل",
    btnExportCSV: "تصدير CSV",
    btnPrint: "طباعة",
    filterAllClasses: "كل فئات الأهداف",
    timelineSelectDate: "اختر التاريخ:",
    btnShow: "عرض",
    plannedExecuted: "زيارة من الخطة ومسجلة",
    jointVisitBadge: "زيارة مشتركة (نزول ميداني)",
    totalEventsToday: "إجمالي الأحداث اليوم:",
    actualActivities: "فعلية / أنشطة:",
    fromPlanStat: "من الخطة:",
    jointVisitsCount: "نزول مشترك:",
    noTimelineEvents: "لا توجد زيارات أو أنشطة مسجلة في هذا اليوم",
    selectAnotherDate: "اختر تاريخاً آخر مثل 2026-09-02 أو 2026-09-03",
    entryTimestamp: "توقيت التسجيل:",
    loggedActivity: "نشاط مسجل",
    supervisoryVisit: "DM Single",
    jointVisitWithRep: "زيارة مشتركة (نزول ميداني مع المندوب)",
    promptSelectDateAndShow: "حدد التاريخ واضغط على «عرض» لعرض الزيارات",
    promptSelectDateSub:
      "اختر التاريخ المطلوب وفلتر الفريق أعلاه، ثم اضغط على زر «عرض» لتحميل الخط الزمني لزيارات اليوم.",
    filterArea: "المنطقة:",
    allAreas: "جميع المناطق",
    filterPeriod: "الفترة:",
    allPeriods: "كل الفترات",
    periodAM: "AM (مستشفيات)",
    periodPM: "PM (عيادات أطباء)",
    periodPharm: "💊 صيدليات",
    filterStatus: "الحالة:",
    allStatuses: "كل الحالات",
    statusExecuted: "منفذة / فعلية",
    statusPlannedOnly: "مخططة",
  },
};

if (typeof translations !== "undefined") {
  if (translations.en && visitTranslations.en)
    Object.assign(translations.en, visitTranslations.en);
  if (translations.ar && visitTranslations.ar)
    Object.assign(translations.ar, visitTranslations.ar);
} else {
  window.translations = visitTranslations;
}

// ============================================================================
// Section 2: 7-Day Auto-Expiry Evaluation
// ============================================================================
function isPlannedVisitExpired(dateStr) {
  if (!dateStr) return false;
  const planDate = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - planDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  return diffDays > 7;
}

// ============================================================================
// Section 2B: Field Governance (Duplicate Check, Min PM Visits & GPS Geofencing)
// ============================================================================
function isDoctorAlreadyVisitedToday(doctorId, visitDate, repId, currentVisitId = null) {
  if (!doctorId || !visitDate) return false;
  const list = (window.store && window.store.visits)
    ? window.store.visits.getAll()
    : (typeof demoVisits !== "undefined" && Array.isArray(demoVisits))
      ? demoVisits
      : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  return list.some((v) =>
    String(v.id) !== String(currentVisitId) &&
    v.repId === repId &&
    (v.doctorId === doctorId || v.targetId === doctorId) &&
    v.date === visitDate &&
    v.status !== "rejected" &&
    v.status !== "missed"
  );
}
window.isDoctorAlreadyVisitedToday = isDoctorAlreadyVisitedToday;

// ============================================================================
// Time Conflict Check Configuration (SFE Audit Rule)
// ============================================================================
// MIN_MINUTES_BETWEEN_VISITS: Minimum buffer (in minutes) required between visits
// when Location/GPS validation is enabled (declared in app.js / exposed on window).

/**
 * Converts a time string (e.g. "14:00", "02:30 PM", "9:15") to total minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  if (/pm/i.test(clean) && hours < 12) hours += 12;
  if (/am/i.test(clean) && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Checks if a proposed visit time conflicts with an existing visit for the same rep on the same date.
 * Active ONLY when the company location/GPS validation setting is enabled (requireGpsValidation === true).
 * Enforces a minimum gap of MIN_MINUTES_BETWEEN_VISITS (default 10 minutes).
 */
function checkVisitTimeConflict(repId, visitDate, visitTime, currentVisitId = null) {
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

  // Only active when location/GPS validation is enabled by Admin
  if (!companySettings || !companySettings.requireGpsValidation) {
    return { hasConflict: false };
  }

  const targetMinutes = parseTimeToMinutes(visitTime);
  if (targetMinutes === null) return { hasConflict: false };

  const minGapMinutes = window.MIN_MINUTES_BETWEEN_VISITS || 10;
  const list = typeof demoVisits !== "undefined" && Array.isArray(demoVisits)
    ? demoVisits
    : (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  for (const v of list) {
    if (v.id === currentVisitId) continue;
    if (v.repId !== repId) continue;
    if (v.date !== visitDate) continue;
    if (v.status === "rejected" || v.status === "missed") continue;

    const existingMinutes = parseTimeToMinutes(v.time);
    if (existingMinutes === null) continue;

    const diff = Math.abs(targetMinutes - existingMinutes);
    if (diff < minGapMinutes) {
      return {
        hasConflict: true,
        exactMatch: diff === 0,
        diffMinutes: diff,
        conflictingVisit: v,
        minRequired: minGapMinutes,
      };
    }
  }

  return { hasConflict: false };
}
window.checkVisitTimeConflict = checkVisitTimeConflict;

function checkVisitDateAllowed(dateStr, repId, lang) {
  if (!dateStr) return { allowed: true };
  const isAr = lang === "ar";

  // 1. Official public holidays check
  const holidays = (window.DEMO_DATA && window.DEMO_DATA.publicHolidays)
    ? [...window.DEMO_DATA.publicHolidays]
    : [];
  try {
    const cachedHolidays = localStorage.getItem("pharma_public_holidays");
    if (cachedHolidays) {
      const parsed = JSON.parse(cachedHolidays);
      if (Array.isArray(parsed)) holidays.push(...parsed);
    }
  } catch (e) {}

  const holiday = holidays.find((h) => h.date === dateStr);
  if (holiday) {
    const hTitle = holiday.title || (isAr ? "عطلة رسمية عامة" : "Public Holiday");
    const msg = isAr
      ? `⚠️ التاريخ المحدد (${dateStr}) يوافق عطلة رسمية عامة (${hTitle}). لا يُسمح بتسجيل أو تخطيط زيارات في العطلات الرسمية.`
      : `⚠️ The selected date (${dateStr}) is an official public holiday (${hTitle}). Recording or planning visits on public holidays is not permitted.`;
    return { allowed: false, reason: "public_holiday", message: msg };
  }

  // 2. Employee leaves check (both approved and pending, non-rejected)
  const leaves = (window.store && window.store.leaves
    ? window.store.leaves.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

  const matchedLeave = leaves.find((l) => {
    if (l.userId !== repId) return false;
    if (l.status === "rejected") return false;
    const lStart = l.startDate || l.endDate;
    const lEnd = l.endDate || l.startDate;
    if (!lStart || !lEnd) return false;
    return dateStr >= lStart && dateStr <= lEnd;
  });

  if (matchedLeave) {
    const typeNamesAr = {
      annual: "اعتيادية",
      casual: "عارضة",
      sick: "مرضية",
      emergency: "عارضة/طارئة",
      unpaid: "بدون راتب",
    };
    const typeNamesEn = {
      annual: "Annual",
      casual: "Casual",
      sick: "Sick",
      emergency: "Casual",
      unpaid: "Unpaid",
    };
    const statusLabelsAr = {
      approved: "معتمدة",
      pending: "قيد الانتظار",
    };
    const statusLabelsEn = {
      approved: "Approved",
      pending: "Pending Approval",
    };

    const lType = isAr
      ? (typeNamesAr[matchedLeave.type] || matchedLeave.type)
      : (typeNamesEn[matchedLeave.type] || matchedLeave.type);
    const lStatus = isAr
      ? (statusLabelsAr[matchedLeave.status] || matchedLeave.status)
      : (statusLabelsEn[matchedLeave.status] || matchedLeave.status);

    const msg = isAr
      ? `⚠️ لديك طلب إجازة مسجل (${lStatus}: ${lType}) في هذا التاريخ (${dateStr}). لا يُسمح بتسجيل أو تخطيط زيارات أثناء الإجازات.`
      : `⚠️ You have a registered leave (${lStatus}: ${lType}) on this date (${dateStr}). Recording or planning visits during leaves is not permitted.`;

    return { allowed: false, reason: "employee_leave", message: msg };
  }

  return { allowed: true };
}
window.checkVisitDateAllowed = checkVisitDateAllowed;

function isWorkdayExemptFromMinVisits(dateStr, repId) {
  if (!dateStr) return { exempt: false };

  // 1. Weekend check: Thursday (4) and Friday (5)
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 4 || dayOfWeek === 5) {
    return { exempt: true, reason: "weekend" };
  }

  // 2. Official public holidays check
  const holidays = (window.DEMO_DATA && window.DEMO_DATA.publicHolidays) || [];
  try {
    const cachedHolidays = localStorage.getItem("pharma_public_holidays");
    if (cachedHolidays) {
      const parsed = JSON.parse(cachedHolidays);
      if (Array.isArray(parsed)) holidays.push(...parsed);
    }
  } catch (e) {}

  if (holidays.some((h) => h.date === dateStr)) {
    return { exempt: true, reason: "public_holiday" };
  }

  // 3. Employee leave in system (approved or pending, non-rejected)
  const leaves = (window.store && window.store.leaves
    ? window.store.leaves.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

  const matchedLeave = leaves.find((l) =>
    l.userId === repId &&
    l.status !== "rejected" &&
    dateStr >= l.startDate &&
    dateStr <= l.endDate
  );

  if (matchedLeave) {
    return { exempt: true, reason: "employee_leave", leave: matchedLeave };
  }

  return { exempt: false };
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3;
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const deltaPhi = (lat2 - lat1) * rad;
  const deltaLambda = (lon2 - lon1) * rad;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function captureVisitLocation(callback) {
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

  if (!companySettings.requireGpsValidation) {
    return callback({ required: false });
  }

  if (!navigator.geolocation) {
    return callback({
      required: true,
      status: "permission_denied",
      reason: "Geolocation not supported"
    });
  }

  let finished = false;
  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      callback({
        required: true,
        status: "permission_denied",
        reason: "Location timeout"
      });
    }
  }, 4000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback({
        required: true,
        status: "obtained",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
    },
    (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback({
        required: true,
        status: "permission_denied",
        reason: err ? err.message : "Permission denied"
      });
    },
    { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
  );
}

function renderGpsBadge(v, lang) {
  if (!v || !v.gpsStatus) return "";
  if (v.gpsStatus === "permission_denied") {
    const text = lang === "ar" ? "⚠️ تم تعطيل الـ GPS من المندوب" : "⚠️ GPS Disabled by Rep";
    return `<span class="badge" style="background: #fef3c7; color: #92400e; font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; font-weight: 700;">${text}</span>`;
  }
  if (v.gpsStatus === "in_range") {
    const text = lang === "ar" ? "✅ تم التحقق (داخل النطاق)" : "✅ Verified (In Range)";
    return `<span class="badge" style="background: #dcfce7; color: #166534; font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; font-weight: 700;">${text}</span>`;
  }
  if (v.gpsStatus === "out_of_range") {
    const distText = v.distanceMeters ? ` (${v.distanceMeters}m)` : "";
    const text = lang === "ar" ? `⚠️ خارج النطاق${distText}` : `⚠️ Out of Range${distText}`;
    return `<span class="badge" style="background: #fee2e2; color: #991b1b; font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; font-weight: 700;">${text}</span>`;
  }
  return "";
}

let lastCapturedGpsResult = null;

function triggerManualGpsCheck() {
  const badge = document.getElementById("visitGpsBadge");
  const infoText = document.getElementById("visitGpsInfoText");
  const distText = document.getElementById("visitGpsDistanceText");
  const btn = document.getElementById("btnCheckMyGps");
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

  if (!companySettings.requireGpsValidation) {
    const gpsSec = document.getElementById("visitGpsSection");
    if (gpsSec) gpsSec.style.display = "none";
    return;
  }

  if (badge) {
    badge.textContent = isAr ? "جاري الفحص... 🛰️" : "Checking GPS... 🛰️";
    badge.style.background = "#e0f2fe";
    badge.style.color = "#0369a1";
  }
  if (btn) btn.disabled = true;

  captureVisitLocation((loc) => {
    if (btn) btn.disabled = false;
    lastCapturedGpsResult = loc;

    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };
    const maxDist = companySettings.gpsMaxDistanceMeters || 200;

    if (loc.status === "permission_denied") {
      if (badge) {
        badge.textContent = isAr ? "⚠️ GPS معطل" : "⚠️ GPS Denied";
        badge.style.background = "#fef3c7";
        badge.style.color = "#92400e";
      }
      if (infoText) {
        infoText.textContent = isAr
          ? "⚠️ تم تعطيل إذن الموقع أو إيقاف الـ GPS. سيتم تسجيل الزيارة مع وضع علامة تدقيق للإدارة."
          : "⚠️ Location permission denied. Visit will be recorded with an audit flag for your manager.";
      }
      if (distText) distText.textContent = "";
      return;
    }

    if (loc.status === "obtained" && loc.lat != null && loc.lng != null) {
      const targetSelect = document.getElementById("visitTarget");
      const targetId = targetSelect ? targetSelect.value : null;
      const allDocs = getMockDoctors();
      const allHosps = getMockHospitals();
      const targetItem = allDocs.find((d) => d.id === targetId) || allHosps.find((h) => h.id === targetId);

      let distance = 0;
      if (targetItem && targetItem.lat != null && targetItem.lng != null) {
        distance = calculateDistanceMeters(loc.lat, loc.lng, targetItem.lat, targetItem.lng);
      } else {
        distance = 25; // Default within clinic bounds for demo targets
      }

      if (distance <= maxDist) {
        if (badge) {
          badge.textContent = isAr ? "✅ داخل النطاق" : "✅ In Range";
          badge.style.background = "#dcfce7";
          badge.style.color = "#166534";
        }
        if (infoText) {
          infoText.textContent = isAr
            ? `أنت متواجد داخل نطاق العيادة المعتمد (أقل من ${maxDist} متر).`
            : `You are verified within the clinic radius (less than ${maxDist}m).`;
        }
        if (distText) {
          distText.textContent = isAr ? `المسافة الحالية: ${distance} متر` : `Current Distance: ${distance}m`;
          distText.style.color = "#10b981";
        }
      } else {
        if (badge) {
          badge.textContent = isAr ? `⚠️ خارج النطاق (${distance}m)` : `⚠️ Out of Range (${distance}m)`;
          badge.style.background = "#fee2e2";
          badge.style.color = "#991b1b";
        }
        if (infoText) {
          infoText.textContent = isAr
            ? `⚠️ أنت تبعد ${distance} متر عن العيادة (الحد المسموح ${maxDist}م). يمكنك المتابعة وسيتم تنبيه المدير.`
            : `⚠️ You are ${distance}m away from clinic (max allowed ${maxDist}m). Manager will be notified.`;
        }
        if (distText) {
          distText.textContent = isAr ? `المسافة الحالية: ${distance} متر` : `Current Distance: ${distance}m`;
          distText.style.color = "#ef4444";
        }
      }
    }
  });
}

function onVisitTargetChange() {
  const modal = document.getElementById("visitModal");
  if (modal && modal.style.display !== "none") {
    const source = modal.dataset.source || "actual";
    if (source === "actual" || currentEditVisitId) {
      triggerManualGpsCheck();
    }
  }
}

window.triggerManualGpsCheck = triggerManualGpsCheck;
window.onVisitTargetChange = onVisitTargetChange;


function toggleCompanyGpsPolicy() {
  if (currentUserRole !== "admin") return;
  const current = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

  const updatedVal = !current.requireGpsValidation;
  if (window.store && window.store.companySettings) {
    window.store.companySettings.update({ requireGpsValidation: updatedVal });
  }

  updateAdminGpsButton();
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const msg = updatedVal
    ? (lang === "ar" ? "تم تفعيل سياسة التحقق الجغرافي بالـ GPS لجميع المناديب!" : "GPS verification policy enabled for all reps!")
    : (lang === "ar" ? "تم تعطيل سياسة التحقق بالـ GPS للشركة." : "GPS verification policy disabled for the company.");

  if (typeof showToast === "function") showToast(msg, "info");
}
window.toggleCompanyGpsPolicy = toggleCompanyGpsPolicy;

function updateAdminGpsButton() {
  const btn = document.getElementById("adminGpsPolicyBtn");
  const label = document.getElementById("adminGpsPolicyLabel");
  if (!btn || !label) return;

  if (currentUserRole !== "admin") {
    btn.style.display = "none";
    return;
  }

  btn.style.display = "inline-flex";
  const current = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  if (current.requireGpsValidation) {
    label.textContent = lang === "ar" ? "سياسة الـ GPS: مفعلة ✅" : "GPS Policy: Active ✅";
    btn.style.borderColor = "#166534";
    btn.style.color = "#166534";
    btn.style.background = "#dcfce7";
  } else {
    label.textContent = lang === "ar" ? "سياسة الـ GPS: معطلة ⏸️" : "GPS Policy: Paused ⏸️";
    btn.style.borderColor = "#6b7280";
    btn.style.color = "#4b5563";
    btn.style.background = "#f3f4f6";
  }
}

// ============================================================================
// Section 3: Active User Session & Role Scope
// ============================================================================
const currentUser = (window.checkAuth && window.checkAuth()) || {
  id: "rep1",
  role: "medical_rep",
  name: "Ahmed Mostafa",
};

const currentUserRole = window.normalizeRole
  ? window.normalizeRole(currentUser.role)
  : (currentUser.role || "medical_rep").toLowerCase();

const isManager =
  (window.isManagerRole
    ? window.isManagerRole(currentUser)
    : currentUserRole !== "medical_rep") || currentUserRole === "hr";

function getReportingReps() {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  if (currentUserRole === "admin" || currentUserRole === "hr") {
    return allUsers.filter((u) =>
      window.isRepRole
        ? window.isRepRole(u)
        : u.role === "medical_rep" || u.role === "rep",
    );
  }
  if (currentUserRole === "business_unit") {
    const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
    return downstream.filter((u) =>
      window.isRepRole
        ? window.isRepRole(u)
        : u.role === "medical_rep" || u.role === "rep",
    );
  }
  if (currentUserRole === "district_manager") {
    return allUsers.filter((u) => u.managerId === currentUser.id);
  }
  if (currentUserRole === "line_manager") {
    const dms = allUsers
      .filter((u) => u.managerId === currentUser.id)
      .map((d) => d.id);
    return allUsers.filter((u) => dms.includes(u.managerId));
  }
  return allUsers.filter((u) => u.id === currentUser.id);
}

// ============================================================================
// Section 4: Dynamic Master Target Getters
// ============================================================================
function getMockDoctors() {
  return (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
}

function getMockHospitals() {
  return (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
}

function getMockPharmacies() {
  if (
    window.DEMO_DATA &&
    Array.isArray(window.DEMO_DATA.pharmacies) &&
    window.DEMO_DATA.pharmacies.length > 0
  ) {
    return window.DEMO_DATA.pharmacies;
  }
  return [];
}

// ============================================================================
// Section 5: Visits Data State with Local Persistence
// ============================================================================
let demoVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

function persistVisits() {
  if (window.DEMO_DATA) {
    window.DEMO_DATA.visits = demoVisits;
    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
    }
  }
}

let currentEditVisitId = null;
const _padZ = (n) => String(n).padStart(2, "0");
const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || (() => {
  const _nowDate = (window.getSystemDate && window.getSystemDate()) || new Date();
  return `${_nowDate.getFullYear()}-${_padZ(_nowDate.getMonth() + 1)}-${_padZ(_nowDate.getDate())}`;
})();

function getTwoDaysAgoStr() {
  const d = (window.getSystemDate && window.getSystemDate()) || new Date();
  d.setDate(d.getDate() - 2);
  return `${d.getFullYear()}-${_padZ(d.getMonth() + 1)}-${_padZ(d.getDate())}`;
}

let hasLoadedTimelineOnce = false;

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("visitDate");
  if (dateInput) dateInput.value = todayStr;

  const timelineDatePicker = document.getElementById("timelineDatePicker");
  if (timelineDatePicker && !timelineDatePicker.value) {
    timelineDatePicker.value = todayStr;
  }

  timelineDatePicker?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      renderVisitsTimeline(true);
    }
  });

  setupRoleBasedView();
  populateAreaFilters();
  renderVisits(false);
  setupModalTargetFilter();
  updateTargetOptions();
});

function setupRoleBasedView() {
  const filterRep = document.getElementById("filterRep");
  const filterContainer = document.getElementById("managerRepFilterContainer");
  const planVisitBtn = document.getElementById("planVisitBtn");
  const addActualVisitBtn = document.getElementById("addActualVisitBtn");
  const titleSpan = document.getElementById("visitsPageTitle");
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  if (titleSpan) {
    titleSpan.setAttribute("data-i18n", "tabDailyTimeline");
    titleSpan.textContent =
      lang === "ar" ? "الخط الزمني للزيارات اليومية" : "Daily Visits Timeline";
  }

  updateAdminGpsButton();

  if (isManager) {
    if (filterContainer) filterContainer.style.display = "flex";
    if (filterRep) {
      filterRep.style.display = "inline-block";
      populateManagerRepDropdown();
    }
    populateAreaFilters();
    const canLogVisits =
      currentUserRole === "admin" ||
      currentUserRole === "district_manager" ||
      currentUserRole === "line_manager" ||
      currentUserRole === "business_unit";
    if (planVisitBtn) planVisitBtn.style.display = canLogVisits ? "inline-flex" : "none";
    if (addActualVisitBtn) addActualVisitBtn.style.display = canLogVisits ? "inline-flex" : "none";
  } else {
    if (filterContainer) filterContainer.style.display = "none";
    if (filterRep) filterRep.style.display = "none";
    if (planVisitBtn) planVisitBtn.style.display = "inline-flex";
    if (addActualVisitBtn) addActualVisitBtn.style.display = "inline-flex";
  }
}

function populateManagerRepDropdown() {
  const filterRep = document.getElementById("filterRep");
  if (!filterRep) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  filterRep.replaceChildren();

  if (currentUserRole === "line_manager") {
    const dms = allUsers.filter(
      (u) => u.managerId === currentUser.id && u.role === "district_manager",
    );
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent =
      lang === "ar"
        ? "🌐 كل الفريق (المديرين والمناديب)"
        : "🌐 All Team (DMs & Med Reps)";
    filterRep.appendChild(optAll);

    const optSelf = document.createElement("option");
    optSelf.value = currentUser.id;
    optSelf.className = "filter-opt-lm";
    optSelf.textContent =
      lang === "ar"
        ? `👔 ${currentUser.name} (LM - زياراتي)`
        : `👔 ${currentUser.name} (LM - My Visits)`;
    filterRep.appendChild(optSelf);

    const optAllDMs = document.createElement("option");
    optAllDMs.value = "all_dms";
    optAllDMs.className = "filter-opt-dm";
    optAllDMs.textContent =
      lang === "ar"
        ? "👥 جميع مديري المناطق (DMs فقط)"
        : "👥 All District Managers (DMs Only)";
    filterRep.appendChild(optAllDMs);

    const optAllReps = document.createElement("option");
    optAllReps.value = "all_reps";
    optAllReps.className = "filter-opt-rep";
    optAllReps.textContent =
      lang === "ar"
        ? "💼 جميع المناديب (Reps فقط)"
        : "💼 All Medical Reps (Reps Only)";
    filterRep.appendChild(optAllReps);

    if (dms.length > 0) {
      const dmGroup = document.createElement("optgroup");
      dmGroup.label =
        lang === "ar"
          ? "مدراء المناطق (DMs)"
          : "District Managers (DMs)";
      dms.forEach((dm) => {
        const opt = document.createElement("option");
        opt.value = dm.id;
        opt.className = "filter-opt-dm";
        opt.textContent = `💼 ${dm.name} (${dm.employeeCode || "DM"})`;
        dmGroup.appendChild(opt);
      });
      filterRep.appendChild(dmGroup);
    }

    if (reps.length > 0) {
      const repGroup = document.createElement("optgroup");
      repGroup.label =
        lang === "ar"
          ? "المناديب الطبيين (Reps)"
          : "Medical Reps (Reps)";
      reps.forEach((rep) => {
        const opt = document.createElement("option");
        opt.value = rep.id;
        opt.className = "filter-opt-rep";
        opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"})`;
        repGroup.appendChild(opt);
      });
      filterRep.appendChild(repGroup);
    }
    return;
  }

  if (currentUserRole === "district_manager") {
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent =
      lang === "ar" ? "🌐 كل مناديب الفريق" : "🌐 All Team Reps";
    filterRep.appendChild(optAll);

    const selfOpt = document.createElement("option");
    selfOpt.value = currentUser.id;
    selfOpt.className = "filter-opt-dm";
    selfOpt.textContent =
      lang === "ar"
        ? `👔 ${currentUser.name} (DM - زياراتي)`
        : `👔 ${currentUser.name} (DM - My Visits)`;
    filterRep.appendChild(selfOpt);

    const myReps = getReportingReps();
    if (myReps.length > 0) {
      const repGroup = document.createElement("optgroup");
      repGroup.label =
        lang === "ar"
          ? "المناديب الطبيين (Reps)"
          : "Medical Reps (Reps)";
      myReps.forEach((rep) => {
        const opt = document.createElement("option");
        opt.value = rep.id;
        opt.className = "filter-opt-rep";
        opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || rep.code || "Rep"})`;
        repGroup.appendChild(opt);
      });
      filterRep.appendChild(repGroup);
    }
    return;
  }

  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent =
    lang === "ar"
      ? "🌐 كل الفريق (الكل بالكامل)"
      : "🌐 All Team (Entire Organization)";
  filterRep.appendChild(optAll);

  if (currentUserRole === "business_unit") {
    const optSelf = document.createElement("option");
    optSelf.value = currentUser.id;
    optSelf.className = "filter-opt-bu";
    optSelf.textContent =
      lang === "ar"
        ? `👔 ${currentUser.name} (BU - زياراتي)`
        : `👔 ${currentUser.name} (BU - My Visits)`;
    filterRep.appendChild(optSelf);
  }

  const optAllLMs = document.createElement("option");
  optAllLMs.value = "all_lms";
  optAllLMs.className = "filter-opt-lm";
  optAllLMs.textContent =
    lang === "ar"
      ? "👔 جميع مديري الخطوط (LMs)"
      : "👔 All Line Managers (LMs)";
  filterRep.appendChild(optAllLMs);

  const optAllDMs = document.createElement("option");
  optAllDMs.value = "all_dms";
  optAllDMs.className = "filter-opt-dm";
  optAllDMs.textContent =
    lang === "ar"
      ? "👥 جميع مديري المناطق (DMs)"
      : "👥 All District Managers (DMs)";
  filterRep.appendChild(optAllDMs);

  const optAllReps = document.createElement("option");
  optAllReps.value = "all_reps";
  optAllReps.className = "filter-opt-rep";
  optAllReps.textContent =
    lang === "ar"
      ? "💼 جميع المناديب (Reps)"
      : "💼 All Medical Reps (Reps)";
  filterRep.appendChild(optAllReps);

  const isBU = currentUserRole === "business_unit";
  const myDownstream = isBU && window.getAllSubordinates ? window.getAllSubordinates(currentUser.id) : [];
  const myDownstreamIds = myDownstream.map((u) => u.id);

  const lms = isBU
    ? allUsers.filter((u) => u.managerId === currentUser.id && (u.role === "line_manager" || u.role === "lm"))
    : allUsers.filter((u) => u.role === "line_manager" || u.role === "lm");

  if (lms.length > 0) {
    const lmGroup = document.createElement("optgroup");
    lmGroup.label =
      lang === "ar"
        ? "مدراء الخطوط (Line Managers)"
        : "Line Managers (LMs)";
    lms.forEach((lm) => {
      const opt = document.createElement("option");
      opt.value = lm.id;
      opt.className = "filter-opt-lm";
      opt.textContent = `👔 ${lm.name} (${lm.employeeCode || "LM"})`;
      lmGroup.appendChild(opt);
    });
    filterRep.appendChild(lmGroup);
  }

  const dms = isBU
    ? allUsers.filter((u) => myDownstreamIds.includes(u.id) && (u.role === "district_manager" || u.role === "dm"))
    : allUsers.filter((u) => u.role === "district_manager" || u.role === "dm");

  if (dms.length > 0) {
    const dmGroup = document.createElement("optgroup");
    dmGroup.label =
      lang === "ar"
        ? "مدراء المناطق (District Managers)"
        : "District Managers (DMs)";
    dms.forEach((dm) => {
      const opt = document.createElement("option");
      opt.value = dm.id;
      opt.className = "filter-opt-dm";
      opt.textContent = `💼 ${dm.name} (${dm.employeeCode || "DM"})`;
      dmGroup.appendChild(opt);
    });
    filterRep.appendChild(dmGroup);
  }

  const reps = isBU
    ? allUsers.filter((u) => myDownstreamIds.includes(u.id) && (u.role === "medical_rep" || u.role === "rep"))
    : allUsers.filter((u) => u.role === "medical_rep" || u.role === "rep");

  if (reps.length > 0) {
    const repGroup = document.createElement("optgroup");
    repGroup.label =
      lang === "ar"
        ? "المناديب الطبيين (Medical Reps)"
        : "Medical Representatives (Reps)";
    reps.forEach((rep) => {
      const opt = document.createElement("option");
      opt.value = rep.id;
      opt.className = "filter-opt-rep";
      opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"})`;
      repGroup.appendChild(opt);
    });
    filterRep.appendChild(repGroup);
  }
}

function getAvailableAreas() {
  const allAreas =
    (window.store && window.store.areas
      ? window.store.areas.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.areas)) || [];

  if (!isManager) {
    const repAreas =
      window.store && window.store.areas
        ? window.store.areas.getByRep(currentUser.id)
        : [];
    if (repAreas.length > 0) return repAreas;

    if (
      currentUser.areaIds &&
      Array.isArray(currentUser.areaIds) &&
      currentUser.areaIds.length > 0
    ) {
      return allAreas.filter((a) => currentUser.areaIds.includes(a.id));
    }
    if (currentUser.areaId) {
      return allAreas.filter((a) => a.id === currentUser.areaId);
    }
    if (currentUser.area) {
      const names = currentUser.area.split(",").map((s) => s.trim().toLowerCase());
      return allAreas.filter((a) => names.includes(a.name.toLowerCase()));
    }

    const myDocs = getMockDoctors().filter((d) => d.repId === currentUser.id);
    const docAreaNames = [...new Set(myDocs.map((d) => d.area).filter(Boolean))];
    const docAreaIds = [...new Set(myDocs.map((d) => d.areaId).filter(Boolean))];
    const foundAreas = allAreas.filter(
      (a) => docAreaIds.includes(a.id) || docAreaNames.includes(a.name),
    );
    return foundAreas.length > 0 ? foundAreas : allAreas;
  }

  const filterRepVal = document.getElementById("filterRep")?.value || "all";
  if (filterRepVal !== "all" && !filterRepVal.startsWith("all_")) {
    const repAreas =
      window.store && window.store.areas
        ? window.store.areas.getByRep(filterRepVal)
        : [];
    if (repAreas.length > 0) return repAreas;
    return allAreas.filter((a) => a.repId === filterRepVal);
  }

  return allAreas;
}

function populateAreaFilters() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const areas = getAvailableAreas();

  const timelineFilter = document.getElementById("timelineAreaFilter");
  if (timelineFilter) {
    const curVal = timelineFilter.value || "all";
    const allLabel = isAr ? "جميع المناطق" : "All Areas";
    let html = `<option value="all">${allLabel}</option>`;
    areas.forEach((a) => {
      const isSelected = (curVal === a.id || curVal === a.name) ? " selected" : "";
      html += `<option value="${window.escapeHtml(a.id)}" data-name="${window.escapeHtml(a.name)}"${isSelected}>📍 ${window.escapeHtml(a.name)}</option>`;
    });
    timelineFilter.innerHTML = html;
  }

  const bulkFilter = document.getElementById("bulkAreaFilter");
  if (bulkFilter) {
    const curVal = bulkFilter.value || "all";
    const allLabel = isAr ? "جميع المناطق" : "All Areas";
    let html = `<option value="all">${allLabel}</option>`;
    areas.forEach((a) => {
      const isSelected = (curVal === a.id || curVal === a.name) ? " selected" : "";
      html += `<option value="${window.escapeHtml(a.id)}" data-name="${window.escapeHtml(a.name)}"${isSelected}>📍 ${window.escapeHtml(a.name)}</option>`;
    });
    bulkFilter.innerHTML = html;
  }
}
window.populateAreaFilters = populateAreaFilters;
window.getAvailableAreas = getAvailableAreas;

function getScopedVisits() {
  let list = demoVisits;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  if (!isManager) {
    list = list.filter(
      (v) =>
        v.repId === currentUser.id ||
        v.doubleWithUserId === currentUser.id ||
        (v.doubleWithUserName && v.doubleWithUserName.includes(currentUser.name)),
    );
  } else if (currentUserRole === "admin" || currentUserRole === "hr") {
    const selectedRepFilter =
      document.getElementById("filterRep")?.value || "all";
    if (selectedRepFilter === "all") {
      // Keep all
    } else if (selectedRepFilter === "all_lms") {
      const lmIds = allUsers
        .filter((u) => u.role === "line_manager")
        .map((u) => u.id);
      list = list.filter(
        (v) => lmIds.includes(v.repId) || lmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_dms") {
      const dmIds = allUsers
        .filter((u) => u.role === "district_manager")
        .map((u) => u.id);
      list = list.filter(
        (v) => dmIds.includes(v.repId) || dmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_reps") {
      const repIds = allUsers
        .filter((u) => u.role === "medical_rep" || u.role === "rep")
        .map((u) => u.id);
      list = list.filter((v) => repIds.includes(v.repId));
    } else {
      list = list.filter(
        (v) =>
          v.repId === selectedRepFilter ||
          v.doubleWithUserId === selectedRepFilter,
      );
    }
  } else if (currentUserRole === "business_unit") {
    const myLMs = allUsers.filter(
      (u) => u.managerId === currentUser.id && (u.role === "line_manager" || u.role === "lm"),
    );
    const lmIds = myLMs.map((u) => u.id);
    const myDownstream = window.getAllSubordinates
      ? window.getAllSubordinates(currentUser.id)
      : [];
    const dmIds = myDownstream
      .filter((u) => u.role === "district_manager" || u.role === "dm")
      .map((u) => u.id);
    const repIds = myDownstream
      .filter((u) => u.role === "medical_rep" || u.role === "rep")
      .map((u) => u.id);
    const allAllowedSubordinateIds = [currentUser.id, ...lmIds, ...dmIds, ...repIds];

    const selectedRepFilter =
      document.getElementById("filterRep")?.value || "all";

    if (selectedRepFilter === "all") {
      list = list.filter(
        (v) =>
          allAllowedSubordinateIds.includes(v.repId) ||
          allAllowedSubordinateIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_lms") {
      list = list.filter(
        (v) => lmIds.includes(v.repId) || lmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_dms") {
      list = list.filter(
        (v) => dmIds.includes(v.repId) || dmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedRepFilter === "all_reps") {
      list = list.filter((v) => repIds.includes(v.repId));
    } else {
      list = list.filter(
        (v) =>
          (v.repId === selectedRepFilter || v.doubleWithUserId === selectedRepFilter) &&
          (allAllowedSubordinateIds.includes(v.repId) || allAllowedSubordinateIds.includes(v.doubleWithUserId)),
      );
    }
  } else if (currentUserRole === "line_manager") {
    const dms = allUsers.filter(
      (u) => u.managerId === currentUser.id && u.role === "district_manager",
    );
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);

    const selectedFilter = document.getElementById("filterRep")?.value || "all";

    if (selectedFilter === "all") {
      list = list.filter(
        (v) =>
          dmIds.includes(v.repId) ||
          repIds.includes(v.repId) ||
          v.repId === currentUser.id ||
          dmIds.includes(v.doubleWithUserId) ||
          v.doubleWithUserId === currentUser.id,
      );
    } else if (selectedFilter === "all_dms") {
      list = list.filter(
        (v) => dmIds.includes(v.repId) || dmIds.includes(v.doubleWithUserId),
      );
    } else if (selectedFilter === "all_reps") {
      list = list.filter((v) => repIds.includes(v.repId));
    } else {
      const allowedLmFilter = [...dmIds, ...repIds, currentUser.id];
      list = list.filter(
        (v) =>
          (v.repId === selectedFilter || v.doubleWithUserId === selectedFilter) &&
          allowedLmFilter.includes(selectedFilter),
      );
    }
  } else {
    const myRepsIds = getReportingReps().map((r) => r.id);
    const selectedRepFilter =
      document.getElementById("filterRep")?.value || "all";

    if (selectedRepFilter === "all") {
      list = list.filter(
        (v) =>
          myRepsIds.includes(v.repId) ||
          v.repId === currentUser.id ||
          v.doubleWithUserId === currentUser.id,
      );
    } else if (selectedRepFilter === currentUser.id) {
      list = list.filter(
        (v) =>
          v.repId === currentUser.id || v.doubleWithUserId === currentUser.id,
      );
    } else {
      const allowedDmFilter = [...myRepsIds, currentUser.id];
      list = list.filter(
        (v) =>
          (v.repId === selectedRepFilter ||
          v.doubleWithUserId === selectedRepFilter) &&
          allowedDmFilter.includes(selectedRepFilter),
      );
    }
  }

  return list.filter(
    (v) => v.status === "completed" || !isPlannedVisitExpired(v.date),
  );
}

// ============================================================================
// Section 6: Bulk Multi-Doctor Planning Engine
// ============================================================================
const visitsApp = {
  openBulkPlanModal() {
    const modal = document.getElementById("bulkPlanModal");
    if (!modal) return;

    if (typeof populateAreaFilters === "function") {
      populateAreaFilters();
    }

    const bulkDateInput = document.getElementById("bulkPlanDate");
    if (bulkDateInput) {
      bulkDateInput.min = todayStr;
      bulkDateInput.value = todayStr;
    }
    document.getElementById("bulkSearchInput").value = "";
    const pmRadio = document.querySelector(
      'input[name="bulkPeriod"][value="pm"]',
    );
    if (pmRadio) pmRadio.checked = true;

    this.renderBulkTargetsList();
    modal.style.display = "flex";
    modal.classList.add("active");
  },

  closeBulkPlanModal() {
    const modal = document.getElementById("bulkPlanModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  },

  renderBulkTargetsList() {
    const container = document.getElementById("bulkTargetsContainer");
    if (!container) return;

    const period =
      document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";
    const searchTerm = (document.getElementById("bulkSearchInput")?.value || "")
      .toLowerCase()
      .trim();
    const classFilter =
      document.getElementById("bulkClassFilter")?.value || "all";
    const areaFilter =
      document.getElementById("bulkAreaFilter")?.value || "all";
    const selectAllCb = document.getElementById("bulkSelectAllToggle");
    if (selectAllCb) selectAllCb.checked = false;

    container.replaceChildren();
    const isHospital = period.toLowerCase() === "am";
    let sourceList = isHospital ? getMockHospitals() : getMockDoctors();

    const role = window.normalizeRole
      ? window.normalizeRole(currentUser.role)
      : (currentUser.role || "").toLowerCase();
    const allUsers =
      (window.store && window.store.users
        ? window.store.users.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allAreas =
      (window.store && window.store.areas
        ? window.store.areas.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.areas)) || [];

    if (role === "medical_rep") {
      const repAreas =
        window.store && window.store.areas
          ? window.store.areas.getByRep(currentUser.id)
          : [];
      const repAreaIds = repAreas.map((a) => a.id);
      const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
      sourceList = sourceList.filter(
        (d) =>
          d.repId === currentUser.id ||
          (d.areaId && repAreaIds.includes(d.areaId)) ||
          (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
      );
    } else if (role === "district_manager") {
      const myReps = allUsers
        .filter((u) => u.managerId === currentUser.id)
        .map((u) => u.id);
      const allowed = [...myReps, currentUser.id];
      sourceList = sourceList.filter(
        (d) => !d.repId || allowed.includes(d.repId),
      );
    } else if (role === "line_manager") {
      const myDms = allUsers
        .filter((u) => u.managerId === currentUser.id)
        .map((u) => u.id);
      const myReps = allUsers
        .filter((u) => myDms.includes(u.managerId))
        .map((u) => u.id);
      const allowed = [currentUser.id, ...myDms, ...myReps];
      sourceList = sourceList.filter(
        (d) => !d.repId || allowed.includes(d.repId),
      );
    } else if (role === "business_unit") {
      const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
      const allowed = [currentUser.id, ...downstream.map((u) => u.id)];
      sourceList = sourceList.filter(
        (d) => !d.repId || allowed.includes(d.repId),
      );
    }

    const selectedAreaObj = allAreas.find(
      (a) => a.id === areaFilter || a.name === areaFilter,
    );
    const selectedAreaName = selectedAreaObj
      ? selectedAreaObj.name.toLowerCase().trim()
      : areaFilter.toLowerCase().trim();

    const filtered = sourceList.filter((item) => {
      const nameMatch =
        (item.name || "").toLowerCase().includes(searchTerm) ||
        (item.nameAr || "").toLowerCase().includes(searchTerm);
      const specMatch = item.specialty
        ? item.specialty.toLowerCase().includes(searchTerm)
        : false;
      const addrMatch =
        (item.address && item.address.toLowerCase().includes(searchTerm)) ||
        (item.clinicAddress && item.clinicAddress.toLowerCase().includes(searchTerm));
      const classMatch =
        classFilter === "all" || isHospital ? true : item.class === classFilter;

      let areaMatch = true;
      if (areaFilter !== "all") {
        const matchId = item.areaId && item.areaId === areaFilter;
        const matchName = item.area && item.area.toLowerCase().trim() === selectedAreaName;
        const matchAddr =
          selectedAreaName &&
          ((item.clinicAddress && item.clinicAddress.toLowerCase().includes(selectedAreaName)) ||
            (item.address && item.address.toLowerCase().includes(selectedAreaName)));
        areaMatch = matchId || matchName || matchAddr;
      }

      return (nameMatch || specMatch || addrMatch) && classMatch && areaMatch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--gray-500); font-style: italic;">No matching targets found.</div>`;
      this.updateBulkCounter();
      return;
    }

    filtered.forEach((target) => {
      let targetArea = target.area;
      if (!targetArea && target.areaId) {
        const fa = allAreas.find((a) => a.id === target.areaId);
        if (fa) targetArea = fa.name;
      }
      const areaBadge = targetArea
        ? `<span class="badge" style="background: var(--gray-100, #f3f4f6); color: var(--gray-700, #374151); font-size: 0.72rem; margin-inline-start: 6px;">📍 ${window.escapeHtml(targetArea)}</span>`
        : "";

      const itemDiv = document.createElement("label");
      itemDiv.className = "bulk-target-item";
      itemDiv.innerHTML = `
        <input type="checkbox" class="bulk-target-cb" value="${target.id}" data-name="${target.name}" onchange="visitsApp.updateBulkCounter()">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: var(--gray-800); font-size: 0.9rem;">${target.name}${areaBadge}</div>
          <div style="font-size: 0.75rem; color: var(--gray-500);">
            ${isHospital ? target.address || "Hospital" : `${target.specialty || "General"} • Class ${target.class || "A"}`}
          </div>
        </div>
        <span class="badge" style="background: ${isHospital ? "#fff3cd" : "#e7f1ff"}; color: ${isHospital ? "#664d03" : "#0d6efd"}; font-size: 0.72rem; font-weight: bold;">
          ${isHospital ? "Hospital" : `Class ${target.class || "A"}`}
        </span>
      `;
      container.appendChild(itemDiv);
    });

    this.updateBulkCounter();
  },

  filterBulkTargetsList() {
    this.renderBulkTargetsList();
  },

  toggleBulkSelectAll(isChecked) {
    document.querySelectorAll(".bulk-target-cb").forEach((cb) => {
      cb.checked = isChecked;
    });
    this.updateBulkCounter();
  },

  updateBulkCounter() {
    const allCheckboxes = document.querySelectorAll(".bulk-target-cb");
    const checkedBoxes = document.querySelectorAll(".bulk-target-cb:checked");
    const counterEl = document.getElementById("bulkSelectionCounter");
    const saveBtn = document.getElementById("btnSaveBulkPlan");
    const selectAllCb = document.getElementById("bulkSelectAllToggle");

    const count = checkedBoxes.length;
    if (counterEl) {
      counterEl.textContent = `Selected: ${count} Targets`;
    }
    if (saveBtn) {
      saveBtn.textContent =
        count > 0 ? `Save ${count} Planned Visits` : "Save Planned Visits";
    }
    if (selectAllCb && allCheckboxes.length > 0) {
      selectAllCb.checked = checkedBoxes.length === allCheckboxes.length;
    }
  },

  saveBulkPlanVisits() {
    const checkedBoxes = Array.from(
      document.querySelectorAll(".bulk-target-cb:checked"),
    );
    if (checkedBoxes.length === 0) {
      return showToast(
        "Please select at least one doctor or hospital.",
        "warning",
      );
    }

    const planDate = document.getElementById("bulkPlanDate").value || todayStr;
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    if (planDate < todayStr) {
      const msg = lang === "ar"
        ? "لا يمكن جدولة خطة في تاريخ سابق. يرجى اختيار تاريخ اليوم أو تاريخ مستقبلي."
        : "Cannot plan visits in the past. Please select today or a future date.";
      if (typeof showToast === "function") showToast(msg, "warning");
      else alert(msg);
      return;
    }

    const targetRepId = currentUser.id || "rep1";
    const dateCheck = checkVisitDateAllowed(planDate, targetRepId, lang);
    if (!dateCheck.allowed) {
      if (typeof showToast === "function") showToast(dateCheck.message, "warning");
      else alert(dateCheck.message);
      return;
    }

    const period =
      document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";

    // 1. Duplicate check: filter out targets already visited or scheduled today for this rep (excluding rejected)
    const duplicateTargets = [];
    const validBoxes = [];
    checkedBoxes.forEach((cb) => {
      const targetId = cb.value;
      const targetName = cb.getAttribute("data-name") || "Doctor";
      if (isDoctorAlreadyVisitedToday(targetId, planDate, currentUser.id || "rep1")) {
        duplicateTargets.push(targetName);
      } else {
        validBoxes.push(cb);
      }
    });

    if (duplicateTargets.length > 0 && validBoxes.length === 0) {
      const msg = lang === "ar"
        ? `الأهداف المحددة مسجلة بالفعل في هذا اليوم: (${duplicateTargets.join("، ")}). لا يمكن تكرار الزيارة لنفس الطبيب مرتين في نفس اليوم.`
        : `Selected targets are already scheduled/visited today: (${duplicateTargets.join(", ")}). Duplicate visits on the same day are not permitted.`;
      if (typeof showToast === "function") showToast(msg, "warning");
      else alert(msg);
      return;
    }

    // 2. Minimum PM visits check: dynamically read from company settings (default 4, unless exempt)
    if (period.toLowerCase() === "pm") {
      const exemption = isWorkdayExemptFromMinVisits(planDate, currentUser.id || "rep1");
      if (!exemption.exempt) {
        const companySettings = (window.store && window.store.companySettings)
          ? window.store.companySettings.get()
          : { minPmVisitsPerDay: 4 };
        const minPmRequired = (companySettings && companySettings.minPmVisitsPerDay) || 4;

        const existingPmCount = demoVisits.filter(
          (v) =>
            v.repId === (currentUser.id || "rep1") &&
            v.date === planDate &&
            (v.period || "").toLowerCase() === "pm" &&
            v.targetType !== "pharmacy" &&
            !(v.doctorId && String(v.doctorId).startsWith("pharm")) &&
            v.status !== "rejected",
        ).length;
        const totalPm = existingPmCount + validBoxes.length;
        if (totalPm < minPmRequired) {
          const needed = minPmRequired - totalPm;
          const msg = lang === "ar"
            ? `الحد الأدنى لزيارات الفترة المسائية (PM) هو ${minPmRequired} زيارات يومياً. إجمالي زيارات هذا اليوم (${totalPm}) فقط. يرجى اختيار ${needed} أطباء إضافيين لاستكمال خطة اليوم.`
            : `Minimum PM visits requirement is ${minPmRequired} visits per day. Total for this day is (${totalPm}). Please select ${needed} more target(s) to complete today's plan.`;
          if (typeof showToast === "function") showToast(msg, "warning");
          else alert(msg);
          return;
        }
      }
    }

    const defaultTimes = [
      "09:30",
      "10:15",
      "11:00",
      "11:45",
      "13:00",
      "13:45",
      "14:30",
      "15:15",
      "16:00",
      "16:45",
    ];

    validBoxes.forEach((cb, index) => {
      const targetId = cb.value;
      const targetName = cb.getAttribute("data-name") || "Doctor";
      const assignedTime = defaultTimes[index % defaultTimes.length];

      const planUniqueId = "plan_" + Date.now() + "_" + index;
      const newVisit = {
        id: "v_bulk_" + Date.now() + "_" + index,
        planId: planUniqueId,
        repId: currentUser.id || "rep1",
        doctorId: targetId,
        doctorName: targetName,
        date: planDate,
        time: assignedTime,
        period: period,
        visitType: "single",
        products: [],
        comment: "",
        status: "pending_approval",
        source: "plan",
        createdAt: new Date().toISOString(),
        entryDate: todayStr,
      };

      demoVisits.unshift(newVisit);
    });

    persistVisits();
    this.closeBulkPlanModal();
    renderVisits(true);

    let successMsg =
      lang === "ar"
        ? `تم إرسال ${validBoxes.length} زيارة للمراجعة والاعتماد من المدير!`
        : `${validBoxes.length} planned visits submitted for manager review and approval!`;

    if (duplicateTargets.length > 0) {
      successMsg += lang === "ar"
        ? ` (تم تخطي الأطباء المكررين اليوم: ${duplicateTargets.join("، ")})`
        : ` (Skipped duplicate targets: ${duplicateTargets.join(", ")})`;
    }

    showToast(successMsg, "success");
  },
};

window.openBulkPlanModal = function () {
  visitsApp.openBulkPlanModal();
};
window.closeBulkPlanModal = function () {
  visitsApp.closeBulkPlanModal();
};
window.renderBulkTargetsList = function () {
  visitsApp.renderBulkTargetsList();
};
window.filterBulkTargetsList = function () {
  visitsApp.filterBulkTargetsList();
};
window.toggleBulkSelectAll = function (isChecked) {
  visitsApp.toggleBulkSelectAll(isChecked);
};
window.updateBulkCounter = function () {
  visitsApp.updateBulkCounter();
};
window.saveBulkPlanVisits = function () {
  visitsApp.saveBulkPlanVisits();
};

function formatVisitDateTime(dateStr, timeStr, lang) {
  const currentLang =
    lang || (window.getCurrentLang && window.getCurrentLang()) || "ar";
  const isAr = currentLang === "ar";
  const arDays = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const enDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let dayName = "";
  let validDate = dateStr || "";

  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const dayIndex = isNaN(d.getDay()) ? 0 : d.getDay();
    dayName = isAr ? arDays[dayIndex] : enDays[dayIndex];
  }

  const safeTime = timeStr || "10:00";

  return {
    dayName: dayName,
    date: validDate,
    time: safeTime,
    displayWithDay: dayName
      ? `${dayName} - ${validDate} (⏰ ${safeTime})`
      : `${validDate} (⏰ ${safeTime})`,
    dayAndTime: dayName ? `${dayName} • ⏰ ${safeTime}` : `⏰ ${safeTime}`,
  };
}

window.formatVisitDateTime = formatVisitDateTime;

function updateVisitModalDayDisplay() {
  const dateInput = document.getElementById("visitDate");
  const displayEl = document.getElementById("visitModalDayName");
  if (!dateInput || !displayEl) return;
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "ar";
  const dt = formatVisitDateTime(dateInput.value, null, lang);
  displayEl.textContent = dt.dayName ? `📅 ${dt.dayName}` : "";
}

window.updateVisitModalDayDisplay = updateVisitModalDayDisplay;

// ============================================================================
// Section 7: Visit Deletion & Role-Based Authorization
// ============================================================================
function isSameDayVisit(v) {
  if (!v) return false;

  const now = new Date();
  const realToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentSysDate =
    typeof todayStr !== "undefined" && todayStr ? todayStr : realToday;

  let visitEntryDate = v.entryDate || "";
  if (!visitEntryDate && v.createdAt) {
    visitEntryDate = v.createdAt.slice(0, 10);
  }
  if (!visitEntryDate) {
    visitEntryDate = v.date || "";
  }

  return visitEntryDate === currentSysDate || visitEntryDate === realToday;
}

window.isSameDayVisit = isSameDayVisit;

function isPlanApproved(v) {
  if (!v) return false;
  if (v.approvedBy || v.approvedAt) return true;
  if (
    (v.source === "plan" || v.source === "planned") &&
    (v.status === "planned" || v.status === "completed")
  ) {
    return true;
  }
  return false;
}

function canDeleteVisit(v) {
  if (!v || !currentUser) return false;

  if (currentUserRole === "admin" || currentUserRole === "hr") return true;

  const targetRepId = v.repId;
  if (!targetRepId) return false;

  if (targetRepId !== currentUser.id) {
    return false;
  }

  if (isPlanApproved(v)) {
    return false;
  }

  return isSameDayVisit(v);
}

window.canDeleteVisit = canDeleteVisit;

function confirmDeleteVisit(visitId) {
  visitsApp.confirmDeleteVisit(visitId);
}

// ============================================================================
// Section 8: Standard Rendering & Single Visit Execution
// ============================================================================
function renderVisits(triggeredByShow = false) {
  renderVisitsTimeline(triggeredByShow);
}

function renderVisitsTimeline(triggeredByShow = false) {
  const container = document.getElementById("timelineEventsContainer");
  const summaryBar = document.getElementById("timelineSummaryBar");
  if (!container) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;

  const datePicker = document.getElementById("timelineDatePicker");
  if (datePicker && !datePicker.value) {
    datePicker.value =
      typeof todayStr !== "undefined" && todayStr ? todayStr : "2026-09-02";
  }
  const selectedDate = datePicker ? datePicker.value : "2026-09-02";

  if (!triggeredByShow && !hasLoadedTimelineOnce) {
    if (summaryBar) summaryBar.innerHTML = "";
    container.innerHTML = `
      <div class="timeline-prompt-card">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
        <h4 class="timeline-prompt-title" data-i18n="promptSelectDateAndShow">
          ${trans.promptSelectDateAndShow || 'Select a date and click "Show" to view visits'}
        </h4>
        <p class="timeline-prompt-sub" data-i18n="promptSelectDateSub">
          ${trans.promptSelectDateSub || "Choose your desired date and filters above, then click the Show button to load the daily visits timeline."}
        </p>
        <button type="button" class="btn btn-primary" onclick="renderVisitsTimeline(true)" style="padding: 8px 24px; font-weight: 600; border-radius: 8px;">
          🔍 <span data-i18n="btnShow">${trans.btnShow || "Show"}</span>
        </button>
      </div>
    `;
    return;
  }

  hasLoadedTimelineOnce = true;
  container.replaceChildren();

  const showBtn = document.getElementById("btnShowVisits");
  if (showBtn) {
    showBtn.classList.add("active");
    setTimeout(() => showBtn.classList.remove("active"), 200);
  }

  const selectedRepFilter =
    document.getElementById("filterRep")?.value || "all";
  const selectedAreaFilter =
    document.getElementById("timelineAreaFilter")?.value || "all";
  const selectedPeriodFilter =
    document.getElementById("timelinePeriodFilter")?.value || "all";
  const selectedStatusFilter =
    document.getElementById("timelineStatusFilter")?.value || "all";

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const allDocs = getMockDoctors();
  const allHosps = getMockHospitals();
  const allPharms = getMockPharmacies();
  const allAreas =
    (window.store && window.store.areas
      ? window.store.areas.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.areas)) || [];

  const selectedAreaObj = allAreas.find(
    (a) => a.id === selectedAreaFilter || a.name === selectedAreaFilter,
  );
  const selectedAreaName = selectedAreaObj
    ? selectedAreaObj.name.toLowerCase().trim()
    : selectedAreaFilter.toLowerCase().trim();

  function visitMatchesArea(v) {
    if (selectedAreaFilter === "all") return true;
    if (v.areaId && v.areaId === selectedAreaFilter) return true;
    if (v.area && v.area.toLowerCase().trim() === selectedAreaName) return true;

    const target =
      allDocs.find((d) => d.id === v.doctorId || d.name === v.doctorName) ||
      allHosps.find((h) => h.id === v.doctorId || h.name === v.doctorName) ||
      allPharms.find((p) => p.id === v.doctorId || p.name === v.doctorName);

    if (target) {
      if (target.areaId && target.areaId === selectedAreaFilter) return true;
      if (target.area && target.area.toLowerCase().trim() === selectedAreaName) return true;
      if (selectedAreaName) {
        const addr = (target.clinicAddress || target.address || "").toLowerCase();
        if (addr.includes(selectedAreaName)) return true;
      }
    }
    return false;
  }

  function visitMatchesPeriod(v) {
    if (selectedPeriodFilter === "all") return true;
    const isPharm =
      v.targetType === "pharmacy" ||
      (v.period || "").toLowerCase() === "pharmacy" ||
      (v.doctorId && String(v.doctorId).startsWith("pharm"));
    if (selectedPeriodFilter === "pharmacy") return isPharm;
    if (isPharm) return false;
    const p = (v.period || "pm").toLowerCase();
    return p === selectedPeriodFilter.toLowerCase();
  }

  function visitMatchesStatus(v) {
    if (selectedStatusFilter === "all") return true;
    const isAct =
      v.source === "actual" || v.isActual || v.status === "completed";
    if (selectedStatusFilter === "actual") return isAct;
    if (selectedStatusFilter === "plan") return !isAct && v.status !== "completed";
    return true;
  }

  let scopedVisits = getScopedVisits().filter((v) => v.date === selectedDate);
  scopedVisits = scopedVisits.filter(
    (v) => visitMatchesArea(v) && visitMatchesPeriod(v) && visitMatchesStatus(v),
  );

  const activityEvents = [];
  const shouldIncludeActivities =
    selectedAreaFilter === "all" &&
    selectedStatusFilter !== "plan" &&
    selectedPeriodFilter !== "pharmacy";

  if (shouldIncludeActivities) {
    let targetActUserIds = [];
    if (!isManager) {
      targetActUserIds = [currentUser.id];
    } else if (selectedRepFilter && selectedRepFilter !== "all") {
      targetActUserIds = [selectedRepFilter];
    } else {
      targetActUserIds = (typeof reportingReps !== "undefined" && reportingReps.length > 0)
        ? reportingReps.map((r) => r.id)
        : allUsers.map((u) => u.id);
      if (!targetActUserIds.includes(currentUser.id)) targetActUserIds.push(currentUser.id);
    }

    targetActUserIds.forEach((uId) => {
      let userActs = {};
      try {
        const raw = localStorage.getItem(`pharma_activities_data_${uId}`) ||
          (uId === "rep1" ? localStorage.getItem("pharma_activities_data") : null);
        if (raw) userActs = JSON.parse(raw);
      } catch (e) {}

      const dayActs = userActs[selectedDate] || {};
      const uObj = allUsers.find((u) => u.id === uId) || { id: uId, name: uId };

      if ((selectedPeriodFilter === "all" || selectedPeriodFilter === "am") && dayActs.AM && dayActs.AM.type) {
        activityEvents.push({
          id: `act_${uId}_${selectedDate}_am`,
          doctorName: `${dayActs.AM.type} (AM Activity)`,
          activityType: dayActs.AM.type,
          class: "Activity",
          specialty: dayActs.AM.notes || "Routine Activity",
          type: "activity",
          date: selectedDate,
          time: "09:00",
          period: "AM",
          repId: uId,
          repName: uObj.name || uId,
          isActual: true,
          source: "actual",
          status: "completed",
        });
      }

      if ((selectedPeriodFilter === "all" || selectedPeriodFilter === "pm") && dayActs.PM && dayActs.PM.type) {
        activityEvents.push({
          id: `act_${uId}_${selectedDate}_pm`,
          doctorName: `${dayActs.PM.type} (PM Activity)`,
          activityType: dayActs.PM.type,
          class: "Activity",
          specialty: dayActs.PM.notes || "Routine Activity",
          type: "activity",
          date: selectedDate,
          time: "14:00",
          period: "PM",
          repId: uId,
          repName: uObj.name || uId,
          isActual: true,
          source: "actual",
          status: "completed",
        });
      }
    });
  }

  const combined = [...scopedVisits, ...activityEvents];
  const totalItems = combined.length;
  const actualCount = combined.filter(
    (v) => v.source === "actual" || v.isActual || v.status === "completed",
  ).length;
  const plannedCount = combined.filter(
    (v) => (v.source === "plan" || v.source === "planned") && !v.isActual,
  ).length;
  const jointCount = combined.filter(
    (v) => v.visitType === "double" || v.doubleWithUserId === currentUser.id,
  ).length;

  if (summaryBar) {
    summaryBar.innerHTML = `
      <div class="timeline-stat-chip">
        <span>${trans.totalEventsToday}</span>
        <strong style="color: var(--primary, #0d6efd); font-size: 1.1rem; margin: 0 6px;">${totalItems}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot actual" style="display:inline-block; vertical-align:middle; width:8px; height:8px; border-radius:50%; background:#f59e0b; margin-inline-end:4px;"></span>
        <span>${trans.actualActivities}</span>
        <strong style="color: #b45309; font-size: 1.1rem; margin: 0 6px;">${actualCount}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot planned" style="display:inline-block; vertical-align:middle; width:8px; height:8px; border-radius:50%; background:#0d6efd; margin-inline-end:4px;"></span>
        <span>${trans.fromPlanStat}</span>
        <strong style="color: #0284c7; font-size: 1.1rem; margin: 0 6px;">${plannedCount}</strong>
      </div>
      ${
        isManager
          ? `
      <div class="timeline-stat-chip">
        <span class="legend-dot joint" style="display:inline-block; vertical-align:middle; width:8px; height:8px; border-radius:50%; background:#6f42c1; margin-inline-end:4px;"></span>
        <span>${trans.jointVisitsCount}</span>
        <strong style="color: #6f42c1; font-size: 1.1rem; margin: 0 6px;">${jointCount}</strong>
      </div>`
          : ""
      }
    `;
  }

  if (combined.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty-card" style="text-align: center; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-sm);">
        <span style="font-size: 2.5rem;">📅</span>
        <h4 class="timeline-target-title" style="margin: 10px 0 4px;">${trans.noTimelineEvents}</h4>
        <p class="timeline-meta-row" style="margin-top: 4px;">${trans.selectAnotherDate}</p>
      </div>
    `;
    return;
  }

  const sortedTimeline = combined.sort((a, b) =>
    (a.time || "00:00").localeCompare(b.time || "00:00"),
  );

  sortedTimeline.forEach((v) => {
    const isActivity = v.type === "activity";
    const isJoint = v.visitType === "double" || !!v.doubleWithUserId;
    const isActual = v.source === "actual" || !!v.isActual;

    let borderClass = "planned-border";
    let dotClass = "planned";
    let badgeClass = "planned";
    let badgeLabel = trans.plannedExecuted;

    if (v.status === "missed") {
      borderClass = "missed-border";
      dotClass = "missed";
      badgeClass = "missed";
      badgeLabel = lang === "ar" ? "تعذر المقابلة" : "Missed Call";
    } else if (isActivity) {
      borderClass = "actual-border";
      dotClass = "actual";
      badgeClass = "actual";
      badgeLabel = trans.loggedActivity;
    } else if (isJoint) {
      borderClass = "joint-border";
      dotClass = "joint";
      badgeClass = "joint";
      badgeLabel = trans.jointVisitBadge;
    } else if (isActual) {
      borderClass = "actual-border";
      dotClass = "actual";
      badgeClass = "actual";
      badgeLabel = trans.directActual;
    }

    let icon = "👨‍⚕️";
    if (isActivity) {
      icon = "📝";
    } else if (
      v.targetType === "hospital" ||
      (v.period && v.period.toLowerCase() === "am") ||
      (v.doctorId && v.doctorId.toString().startsWith("h"))
    ) {
      icon = "🏥";
    } else if (
      v.targetType === "pharmacy" ||
      (v.doctorId && v.doctorId.toString().startsWith("pharm"))
    ) {
      icon = "💊";
    }

    const allDocs = getMockDoctors();
    const allHosps = getMockHospitals();
    const doc =
      allDocs.find((d) => d.name === v.doctorName || d.id === v.doctorId) ||
      allHosps.find((h) => h.name === v.doctorName || h.id === v.doctorId);

    const specialtyText =
      v.specialty || (doc ? doc.specialty || doc.address : "General");
    const classText = v.class || (doc ? doc.class : "A");

    const repUser = allUsers.find((u) => u.id === v.repId);
    const repDisplayName =
      v.repName || (repUser ? repUser.name : "Medical Rep");

    const repRoleLabel =
      repUser && repUser.role === "district_manager"
        ? lang === "ar"
          ? "مدير المنطقة"
          : "DM"
        : repUser && repUser.role === "line_manager"
          ? lang === "ar"
            ? "مدير الخط"
            : "LM"
          : lang === "ar"
            ? "المندوب"
            : "Rep";

    let accompanimentNote = "";
    if (isJoint) {
      let partnerName = v.doubleWithUserName;
      if (!partnerName && v.doubleWithUserId) {
        const partnerUser = allUsers.find((u) => u.id === v.doubleWithUserId);
        if (partnerUser) partnerName = partnerUser.name;
      }
      if (!partnerName) {
        partnerName =
          v.repId === currentUser.id ? "Team Rep" : currentUser.name;
      }
      accompanimentNote = ` • <span style="color: var(--purple, #6f42c1); font-weight: 700;">🤝 ${lang === "ar" ? "نزول مشترك مع:" : "Co-visiting with:"} ${window.escapeHtml(partnerName)}</span>`;
    } else if (repUser && repUser.role === "district_manager") {
      accompanimentNote = ` • <span style="color: #b45309; font-weight: 700;">👔 ${trans.supervisoryVisit}</span>`;
    } else if (repUser && repUser.role === "line_manager") {
      accompanimentNote = ` • <span style="color: #b45309; font-weight: 700;">👔 ${lang === "ar" ? "زيارة إشرافية (LM)" : "Supervisory Visit (LM)"}</span>`;
    } else if (v.repId === currentUser.id && isManager) {
      accompanimentNote = ` • <span style="color: #b45309; font-weight: 700;">👔 ${trans.supervisoryVisit}</span>`;
    }

    const isPharmVisit =
      v.targetType === "pharmacy" ||
      (v.period || "").toLowerCase() === "pharmacy" ||
      (v.doctorId && String(v.doctorId).startsWith("pharm"));
    const periodDisplay = isPharmVisit
      ? lang === "ar"
        ? "صيدلية"
        : "PHARM"
      : (v.period || "PM").toUpperCase();

    let targetArea = v.area;
    if (!targetArea) {
      const foundTarget =
        allDocs.find((d) => d.name === v.doctorName || d.id === v.doctorId) ||
        allHosps.find((h) => h.name === v.doctorName || h.id === v.doctorId) ||
        allPharms.find((p) => p.name === v.doctorName || p.id === v.doctorId);
      if (foundTarget) {
        targetArea = foundTarget.area;
        if (!targetArea && foundTarget.areaId) {
          const fa = allAreas.find((a) => a.id === foundTarget.areaId);
          if (fa) targetArea = fa.name;
        }
      }
    }

    const card = document.createElement("div");
    card.className = "timeline-event-card";
    card.innerHTML = `
      <div class="timeline-time-col">
        <span>${v.time || "10:00"}</span>
        <span style="font-size: 0.72rem; color: var(--gray-400);">${periodDisplay}</span>
        <div class="timeline-icon-dot ${dotClass}"></div>
      </div>
      <div class="timeline-content-box ${borderClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <strong class="timeline-target-title">${window.escapeHtml(v.doctorName)}</strong>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            ${renderGpsBadge(v, lang)}
            <span class="visit-badge-pill ${badgeClass}">${badgeLabel}</span>
          </div>
        </div>
        <div class="timeline-meta-row">
          <span>${window.escapeHtml(specialtyText)}</span> • <span>Class: <strong>${window.escapeHtml(classText)}</strong></span>${targetArea ? ` • <span class="badge bg-secondary bg-opacity-10 text-secondary" style="font-weight: 600; padding: 2px 8px; border-radius: 6px;">${window.escapeHtml(targetArea)}</span>` : ""} • <span>${repRoleLabel}: <strong>${window.escapeHtml(repDisplayName)}</strong></span>${accompanimentNote}
        </div>
        ${
          (() => {
            const cardProds = window.getVisitDisplayProducts ? window.getVisitDisplayProducts(v) : (v.products || []);
            return cardProds.length > 0
              ? `<div style="font-size: 0.8rem; color: var(--primary); margin-bottom: 6px;"><strong>${lang === "ar" ? "المنتجات:" : "Products:"}</strong> ${cardProds.map((p) => window.escapeHtml(p)).join(", ")}</div>`
              : "";
          })()
        }
        ${
          v.giveawaySamples
            ? `<div style="font-size: 0.8rem; color: #d97706; margin-bottom: 6px;"><strong>${lang === "ar" ? "عينات ومواد دعائية:" : "Giveaway Samples:"}</strong> ${window.escapeHtml(v.giveawaySamples)}</div>`
            : ""
        }
        ${
          v.comment
            ? `<div class="timeline-comment-text" style="font-size: 0.8rem; margin-bottom: 6px; font-style: italic;">"${window.escapeHtml(v.comment)}"</div>`
            : ""
        }
        ${
          v.status === "missed" && v.missedReason
            ? `<div style="font-size: 0.82rem; color: #dc3545; margin-bottom: 6px; font-weight: 600;"><strong>${lang === "ar" ? "سبب تعذر المقابلة:" : "Missed Reason:"}</strong> "${window.escapeHtml(v.missedReason)}"</div>`
            : ""
        }
        ${
          v.lastRescheduleReason
            ? `<div style="font-size: 0.8rem; color: #b45309; margin-bottom: 6px;"><strong>${lang === "ar" ? "مؤجلة سابقاً بسبب:" : "Rescheduled Reason:"}</strong> "${window.escapeHtml(v.lastRescheduleReason)}"</div>`
            : ""
        }
        <div class="timeline-timestamp-chip">
          <strong>${trans.entryTimestamp}</strong> ${v.date} at ${v.time || "10:00"} ${periodDisplay}
        </div>
        ${
          !isActivity &&
          v.status === "planned" &&
          (!isManager || v.repId === currentUser.id)
            ? `
          <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" style="padding: 5px 16px; font-size: 0.82rem; border-radius: 6px; font-weight: 700;" onclick="openCompleteModal('${v.id}')">
              ✓ ${trans.btnComplete}
            </button>
            <button type="button" class="btn" style="padding: 5px 12px; font-size: 0.82rem; border-radius: 6px; font-weight: 700; background: rgba(245, 158, 11, 0.12); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.4); cursor: pointer;" onclick="openRescheduleModal('${v.id}')">
              🗓️ ${lang === "ar" ? "تأجيل الزيارة" : "Reschedule"}
            </button>
            ${
              canDeleteVisit(v)
                ? `<button type="button" class="btn-outline-danger" style="padding: 5px 12px; font-size: 0.82rem; border-radius: 6px;" onclick="confirmDeleteVisit('${v.id}')">🗑️ ${trans.btnDelete}</button>`
                : ""
            }
          </div>
        `
            : !isActivity && canDeleteVisit(v)
              ? `
          <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-outline-danger" style="padding: 5px 12px; font-size: 0.82rem; border-radius: 6px;" onclick="confirmDeleteVisit('${v.id}')">🗑️ ${trans.btnDelete}</button>
          </div>
        `
              : ""
        }
      </div>
    `;
    container.appendChild(card);
  });
  updateAdminGpsButton();
}

function populateVisitProducts(selectedProducts = []) {
  const container = document.getElementById("visitProducts");
  if (!container) return;

  container.replaceChildren();

  const allLines = window.store && window.store.productLines
    ? window.store.productLines.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

  const currentUser = window.checkAuth ? window.checkAuth() : null;
  const role = window.normalizeRole
    ? window.normalizeRole(currentUser?.role)
    : (currentUser?.role || "").toLowerCase();

  let linesToShow = allLines;
  if (currentUser && role !== "admin") {
    const userLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
    if (userLines.length > 0) {
      linesToShow = userLines;
    } else if (["business_unit", "line_manager", "district_manager", "medical_rep", "rep"].includes(role)) {
      linesToShow = [];
    }
  }

  let productsToShow = [];
  linesToShow.forEach((line) => {
    if (line.products) productsToShow.push(...line.products);
  });

  if (productsToShow.length === 0) {
    container.innerHTML =
      '<span style="font-size: 0.85rem; color: var(--gray-500);">No products available. Add some in the Products page.</span>';
    return;
  }

  const selectedList = Array.isArray(selectedProducts) ? selectedProducts : [];

  productsToShow.forEach((prod) => {
    const label = document.createElement("label");
    label.className = "checkbox-label product-chip";
    const displayName =
      prod.dosage &&
      !prod.name.toLowerCase().includes(prod.dosage.toLowerCase())
        ? `${prod.name} ${prod.dosage}`
        : prod.name;
    const isChecked =
      selectedList.includes(prod.id) ||
      selectedList.includes(displayName) ||
      selectedList.includes(prod.name);
    label.innerHTML = `<input type="checkbox" value="${prod.id}" data-name="${displayName}" ${isChecked ? "checked" : ""}> ${displayName}`;
    container.appendChild(label);
  });
}

function populateVisitCompanions(targetId, selectedCompanions = []) {
  const container = document.getElementById("visitManagersGroup");
  if (!container) return;
  container.replaceChildren();

  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const effectiveId = targetId || currentUser.id || "rep1";
  let candidates = [];

  const currentUserObj = users.find((u) => u.id === currentUser.id);
  const role = currentUserRole;

  if (role === "business_unit") {
    candidates = users.filter(
      (u) =>
        u.id !== currentUser.id &&
        u.id !== effectiveId &&
        u.status !== "Inactive" &&
        (u.role === "line_manager" || u.role === "district_manager"),
    );
  } else if (role === "admin" || role === "hr") {
    candidates = users.filter(
      (u) =>
        u.id !== currentUser.id &&
        u.id !== effectiveId &&
        u.status !== "Inactive" &&
        u.role !== "admin" &&
        u.role !== "hr",
    );
  } else if (role === "line_manager") {
    const dms = users.filter(
      (u) => u.managerId === currentUser.id && u.role === "district_manager",
    );
    let chain = [];
    if (typeof window.getManagerChain === "function") {
      chain = window.getManagerChain(currentUser.id);
    }
    const higherManagers = chain.filter(
      (u) => u.role === "business_unit",
    );
    candidates = [...dms, ...higherManagers].filter(
      (u, idx, arr) =>
        u.id !== currentUser.id &&
        u.status !== "Inactive" &&
        u.role !== "admin" &&
        arr.findIndex((x) => x.id === u.id) === idx,
    );
  } else if (role === "district_manager") {
    const myReps = getReportingReps();
    let chain = [];
    if (typeof window.getManagerChain === "function") {
      chain = window.getManagerChain(currentUser.id);
    }
    candidates = [...myReps, ...chain].filter(
      (u, idx, arr) =>
        u.id !== currentUser.id &&
        u.status !== "Inactive" &&
        u.role !== "admin" &&
        u.role !== "hr" &&
        arr.findIndex((x) => x.id === u.id) === idx,
    );
  } else {
    let chain = [];
    if (typeof window.getManagerChain === "function") {
      chain = window.getManagerChain(effectiveId);
    } else {
      let curr = users.find((u) => u.id === effectiveId);
      while (curr && curr.managerId) {
        curr = users.find((u) => u.id === curr.managerId);
        if (curr) chain.push(curr);
      }
    }
    candidates = chain.filter(
      (u) =>
        u.status !== "Inactive" &&
        u.id !== effectiveId &&
        u.id !== currentUser.id &&
        u.role !== "admin" &&
        u.role !== "hr",
    );
  }

  if (candidates.length === 0) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    container.innerHTML = `<span style="font-size: 0.82rem; color: var(--gray-500); font-style: italic;">${lang === "ar" ? "لا يوجد زملاء أو مدراء متاحين للاختيار" : "No colleagues or managers available for companion selection."}</span>`;
    return;
  }

  const roleTags = {
    district_manager: "DM",
    line_manager: "LM",
    business_unit: "BU",
    medical_rep: "Rep",
    rep: "Rep",
    admin: "Admin",
  };

  candidates.forEach((m) => {
    const tag = roleTags[m.role] || "User";
    const val = `${m.name} (${tag})`;
    const isChecked =
      Array.isArray(selectedCompanions) &&
      selectedCompanions.some((c) => c.includes(m.name) || c.includes(m.id));
    const lbl = document.createElement("label");
    lbl.className = "checkbox-label companion-chip";
    lbl.innerHTML = `<input type="checkbox" name="doubleCompanion" value="${val}" data-user-id="${m.id}" ${isChecked ? "checked" : ""}> ${val}`;
    container.appendChild(lbl);
  });
}

function openVisitModal(isActual = false) {
  currentEditVisitId = null;
  populateVisitProducts([]);
  populateVisitCompanions(currentUser.id, []);

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;

  const titleEl = document.getElementById("visitModalTitle");
  if (titleEl) {
    titleEl.innerText = isActual ? trans.logActualVisit : trans.modalAddVisit;
  }

  const saveBtn = document.getElementById("btnSaveVisit") || document.querySelector("#visitModal button[onclick*='saveVisit']");
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerText = isActual
      ? (lang === "ar" ? "تسجيل وحفظ الزيارة" : "Log & Save Visit")
      : (lang === "ar" ? "حفظ الزيارة" : "Save Visit");
  }
  const checkGpsBtn = document.getElementById("btnCheckMyGps");
  if (checkGpsBtn) checkGpsBtn.disabled = false;

  const dateInput = document.getElementById("visitDate");
  const twoDaysAgoStr = getTwoDaysAgoStr();
  if (dateInput) {
    if (isActual) {
      dateInput.max = todayStr;
      dateInput.min = twoDaysAgoStr;
      dateInput.value = todayStr;
    } else {
      dateInput.removeAttribute("max");
      dateInput.min = todayStr;
      dateInput.value = todayStr;
    }
  }

  const now = new Date();
  const timeInput = document.getElementById("visitTime");
  if (timeInput) {
    timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  updateVisitModalDayDisplay();

  document.getElementById("visitComment").value = "";
  const samplesInput = document.getElementById("visitGiveawaySamples");
  if (samplesInput) samplesInput.value = "";
  document
    .querySelectorAll('#visitProducts input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  const singleRadio = document.querySelector(
    'input[name="visitType"][value="single"]',
  );
  if (singleRadio) singleRadio.checked = true;
  toggleDoubleVisit();

  const radioPharm = document.getElementById("radioPharmacyLabel");
  if (radioPharm) {
    radioPharm.style.display = "inline-flex";
  }

  const pmRadio = document.querySelector(
    'input[name="visitPeriod"][value="pm"]',
  );
  if (pmRadio) pmRadio.checked = true;

  setupModalTargetFilter();
  updateTargetOptions();

  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.dataset.source = isActual ? "actual" : "plan";
    modal.classList.add("active");
    modal.style.display = "flex";
  }

  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };
  const isGpsActive = !!companySettings.requireGpsValidation;

  const gpsSec = document.getElementById("visitGpsSection");
  if (gpsSec) {
    gpsSec.style.display = (isActual && isGpsActive) ? "block" : "none";
    if (isActual && isGpsActive) triggerManualGpsCheck();
  }
}

function setupModalTargetFilter() {
  const filterSelect = document.getElementById("modalTargetFilterSelect");
  const filterLabel = document.getElementById("modalTargetFilterLabel");
  const filterContainer = document.getElementById("modalTargetFilterContainer");
  if (!filterSelect || !filterContainer) return;

  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "").toLowerCase();
  const isManager = [
    "district_manager",
    "line_manager",
    "business_unit",
    "admin",
  ].includes(role);

  if (!isManager) {
    filterContainer.style.display = "none";
    return;
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const allUsers =
    (window.store && window.store.users
      ? window.store.users.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  filterSelect.replaceChildren();

  const allOpt = document.createElement("option");
  allOpt.value = "all";

  if (role === "district_manager") {
    if (filterLabel) {
      filterLabel.textContent = isAr
        ? "تصفية الأطباء حسب المندوب:"
        : "Filter Doctors by Medical Rep:";
    }
    allOpt.textContent = isAr ? "👥 جميع أطباء فريقي" : "👥 All My Team Doctors";
    filterSelect.appendChild(allOpt);

    const vacantOpt = document.createElement("option");
    vacantOpt.value = "vacant";
    vacantOpt.textContent = isAr
      ? "📍 أطباء المناطق الشاغرة (بدون مندوب)"
      : "📍 Vacant / Unassigned Doctors";
    filterSelect.appendChild(vacantOpt);

    const myReps = allUsers.filter(
      (u) =>
        u.managerId === currentUser.id &&
        u.role === "medical_rep" &&
        u.status !== "Inactive",
    );
    myReps.forEach((rep) => {
      const opt = document.createElement("option");
      opt.value = rep.id;
      const repName = isAr && rep.nameAr ? rep.nameAr : rep.name;
      opt.textContent = `👤 ${repName}`;
      filterSelect.appendChild(opt);
    });
  } else if (role === "line_manager") {
    if (filterLabel) {
      filterLabel.textContent = isAr
        ? "تصفية الأطباء حسب مدير المنطقة (DM):"
        : "Filter Doctors by District Manager (DM):";
    }
    allOpt.textContent = isAr ? "👥 جميع أطباء الخط" : "👥 All Line Doctors";
    filterSelect.appendChild(allOpt);

    const vacantOpt = document.createElement("option");
    vacantOpt.value = "vacant";
    vacantOpt.textContent = isAr
      ? "📍 أطباء المناطق الشاغرة بالخط"
      : "📍 Vacant / Unassigned Line Doctors";
    filterSelect.appendChild(vacantOpt);

    const myDms = allUsers.filter(
      (u) =>
        u.managerId === currentUser.id &&
        u.role === "district_manager" &&
        u.status !== "Inactive",
    );
    myDms.forEach((dm) => {
      const dmName = isAr && dm.nameAr ? dm.nameAr : dm.name;
      const opt = document.createElement("option");
      opt.value = `dm:${dm.id}`;
      opt.textContent = `👔 ${dmName} (DM)`;
      filterSelect.appendChild(opt);

      const dmReps = allUsers.filter(
        (u) =>
          u.managerId === dm.id &&
          u.role === "medical_rep" &&
          u.status !== "Inactive",
      );
      dmReps.forEach((rep) => {
        const repName = isAr && rep.nameAr ? rep.nameAr : rep.name;
        const repOpt = document.createElement("option");
        repOpt.value = `rep:${rep.id}`;
        repOpt.textContent = `　↳ 👤 ${repName}`;
        filterSelect.appendChild(repOpt);
      });
    });
  } else if (role === "business_unit" || role === "admin") {
    if (filterLabel) {
      filterLabel.textContent = isAr
        ? "تصفية الأطباء بالمدير (LM / DM):"
        : "Filter Doctors by Manager (LM / DM):";
    }
    allOpt.textContent = isAr ? "👥 جميع الأطباء" : "👥 All Doctors";
    filterSelect.appendChild(allOpt);

    const vacantOpt = document.createElement("option");
    vacantOpt.value = "vacant";
    vacantOpt.textContent = isAr
      ? "📍 أطباء المناطق الشاغرة بالشركة"
      : "📍 Vacant / Unassigned Organization Doctors";
    filterSelect.appendChild(vacantOpt);

    const lms =
      role === "business_unit"
        ? allUsers.filter(
            (u) =>
              u.managerId === currentUser.id &&
              u.role === "line_manager" &&
              u.status !== "Inactive",
          )
        : allUsers.filter(
            (u) => u.role === "line_manager" && u.status !== "Inactive",
          );

    if (lms.length > 0) {
      const lmGrp = document.createElement("optgroup");
      lmGrp.label = isAr ? "مديرو الخطوط (Line Managers)" : "Line Managers (LMs)";
      lms.forEach((lm) => {
        const lmName = isAr && lm.nameAr ? lm.nameAr : lm.name;
        const opt = document.createElement("option");
        opt.value = `lm:${lm.id}`;
        opt.textContent = `👔 ${lmName} (LM)`;
        lmGrp.appendChild(opt);
      });
      filterSelect.appendChild(lmGrp);
    }

    const lmIds = lms.map((l) => l.id);
    const dms =
      role === "business_unit"
        ? allUsers.filter(
            (u) =>
              lmIds.includes(u.managerId) &&
              u.role === "district_manager" &&
              u.status !== "Inactive",
          )
        : allUsers.filter(
            (u) => u.role === "district_manager" && u.status !== "Inactive",
          );

    if (dms.length > 0) {
      const dmGrp = document.createElement("optgroup");
      dmGrp.label = isAr
        ? "مديرو المناطق (District Managers)"
        : "District Managers (DMs)";
      dms.forEach((dm) => {
        const dmName = isAr && dm.nameAr ? dm.nameAr : dm.name;
        const parentLm = allUsers.find((u) => u.id === dm.managerId);
        const parentName = parentLm
          ? isAr && parentLm.nameAr
            ? parentLm.nameAr
            : parentLm.name
          : "";
        const opt = document.createElement("option");
        opt.value = `dm:${dm.id}`;
        opt.textContent = `👔 ${dmName} (DM${parentName ? " - " + parentName : ""})`;
        dmGrp.appendChild(opt);
      });
      filterSelect.appendChild(dmGrp);
    }
  }
}

function updateTargetOptions() {
  const period =
    document.querySelector('input[name="visitPeriod"]:checked')?.value || "pm";
  const targetSelect = document.getElementById("visitTarget");
  const targetLabel = document.getElementById("visitTargetLabel");
  const filterContainer = document.getElementById("modalTargetFilterContainer");
  const filterSelect = document.getElementById("modalTargetFilterSelect");
  if (!targetSelect) return;
  targetSelect.replaceChildren();

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const role = window.normalizeRole
    ? window.normalizeRole(currentUser.role)
    : (currentUser.role || "").toLowerCase();
  const isManager = [
    "district_manager",
    "line_manager",
    "business_unit",
    "admin",
  ].includes(role);

  if (filterContainer) {
    filterContainer.style.display =
      period.toLowerCase() === "pm" && isManager ? "block" : "none";
  }

  const allUsers =
    (window.store && window.store.users
      ? window.store.users.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  let allowedRepIds = [currentUser.id];
  if (role === "admin" || role === "hr") {
    allowedRepIds = null;
  } else if (role === "district_manager") {
    const myRepIds = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
    allowedRepIds = [currentUser.id, ...myRepIds];
  } else if (role === "line_manager") {
    const myDms = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
    const myReps = allUsers.filter((u) => myDms.includes(u.managerId)).map((u) => u.id);
    allowedRepIds = [currentUser.id, ...myDms, ...myReps];
  } else if (role === "business_unit") {
    const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
    allowedRepIds = [currentUser.id, ...downstream.map((u) => u.id)];
  }

  let options = [];
  if (period.toLowerCase() === "am") {
    const allHosps = getMockHospitals();
    if (targetLabel) targetLabel.textContent = isAr ? "المستشفى" : "Hospital";
    if (!isManager) {
      options = allHosps.filter((h) => !h.repId || h.repId === currentUser.id);
    } else if (allowedRepIds) {
      options = allHosps.filter((h) => !h.repId || allowedRepIds.includes(h.repId));
    } else {
      options = allHosps;
    }
  } else if (period.toLowerCase() === "pharmacy") {
    const allPharms = getMockPharmacies();
    if (targetLabel) targetLabel.textContent = isAr ? "الصيدلية" : "Pharmacy";
    if (!isManager) {
      options = allPharms.filter((p) => !p.repId || p.repId === currentUser.id);
    } else if (allowedRepIds) {
      options = allPharms.filter((p) => !p.repId || allowedRepIds.includes(p.repId));
    } else {
      options = allPharms;
    }
  } else {
    if (targetLabel) targetLabel.textContent = isAr ? "الطبيب" : "Doctor";
    const allDocs = getMockDoctors();
    const selectedFilter = filterSelect ? filterSelect.value : "all";

    const inactiveUserIds = allUsers
      .filter((u) => u.status === "Inactive")
      .map((u) => u.id);

    if (!isManager) {
      options = allDocs.filter((d) => d.repId === currentUser.id);
    } else if (selectedFilter === "vacant") {
      if (role === "district_manager") {
        const myRepIds = allUsers
          .filter((u) => u.managerId === currentUser.id)
          .map((u) => u.id);
        const myInactiveRepIds = myRepIds.filter((id) =>
          inactiveUserIds.includes(id),
        );
        options = allDocs.filter(
          (d) => !d.repId || myInactiveRepIds.includes(d.repId),
        );
      } else if (role === "line_manager") {
        const myDms = allUsers
          .filter((u) => u.managerId === currentUser.id)
          .map((u) => u.id);
        const myReps = allUsers
          .filter((u) => myDms.includes(u.managerId))
          .map((u) => u.id);
        const myTeamRepIds = [...myDms, ...myReps];
        const myInactiveRepIds = myTeamRepIds.filter((id) =>
          inactiveUserIds.includes(id),
        );
        options = allDocs.filter(
          (d) => !d.repId || myInactiveRepIds.includes(d.repId),
        );
      } else {
        options = allDocs.filter(
          (d) => !d.repId || inactiveUserIds.includes(d.repId),
        );
      }
    } else if (role === "district_manager") {
      const myRepIds = allUsers
        .filter((u) => u.managerId === currentUser.id)
        .map((u) => u.id);
      const allowedRepIds = [...myRepIds, currentUser.id];
      if (!selectedFilter || selectedFilter === "all") {
        options = allDocs.filter(
          (d) => !d.repId || allowedRepIds.includes(d.repId),
        );
      } else {
        options = allDocs.filter((d) => d.repId === selectedFilter);
      }
    } else if (role === "line_manager") {
      const myDms = allUsers.filter(
        (u) => u.managerId === currentUser.id && u.role === "district_manager",
      );
      const myDmIds = myDms.map((u) => u.id);
      const myReps = allUsers.filter((u) => myDmIds.includes(u.managerId));
      const myRepIds = myReps.map((u) => u.id);
      const allowedTeamIds = [currentUser.id, ...myDmIds, ...myRepIds];

      if (!selectedFilter || selectedFilter === "all") {
        options = allDocs.filter(
          (d) => !d.repId || allowedTeamIds.includes(d.repId),
        );
      } else if (selectedFilter.startsWith("dm:")) {
        const dmId = selectedFilter.split(":")[1];
        const dmRepIds = allUsers
          .filter((u) => u.managerId === dmId)
          .map((u) => u.id);
        const allowed = [dmId, ...dmRepIds];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else if (selectedFilter.startsWith("rep:")) {
        const repId = selectedFilter.split(":")[1];
        options = allDocs.filter((d) => d.repId === repId);
      } else {
        options = allDocs.filter((d) => d.repId === selectedFilter);
      }
    } else if (role === "business_unit") {
      const myLMs = allUsers.filter(
        (u) => u.managerId === currentUser.id && (u.role === "line_manager" || u.role === "lm"),
      );
      const myLmIds = myLMs.map((u) => u.id);
      const myDownstream = window.getAllSubordinates
        ? window.getAllSubordinates(currentUser.id)
        : [];
      const myDmIds = myDownstream
        .filter((u) => u.role === "district_manager" || u.role === "dm")
        .map((u) => u.id);
      const myRepIds = myDownstream
        .filter((u) => u.role === "medical_rep" || u.role === "rep")
        .map((u) => u.id);
      const allowedTeamIds = [currentUser.id, ...myLmIds, ...myDmIds, ...myRepIds];

      if (!selectedFilter || selectedFilter === "all") {
        options = allDocs.filter((d) => !d.repId || allowedTeamIds.includes(d.repId));
      } else if (selectedFilter === "vacant") {
        options = allDocs.filter((d) => !d.repId);
      } else if (selectedFilter.startsWith("lm:")) {
        const lmId = selectedFilter.split(":")[1];
        const lmDmIds = allUsers
          .filter((u) => u.managerId === lmId)
          .map((u) => u.id);
        const lmRepIds = allUsers
          .filter((u) => lmDmIds.includes(u.managerId))
          .map((u) => u.id);
        const allowed = [lmId, ...lmDmIds, ...lmRepIds];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else if (selectedFilter.startsWith("dm:")) {
        const dmId = selectedFilter.split(":")[1];
        const dmRepIds = allUsers
          .filter((u) => u.managerId === dmId)
          .map((u) => u.id);
        const allowed = [dmId, ...dmRepIds];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else {
        options = allDocs.filter((d) => allowedTeamIds.includes(d.repId));
      }
    } else if (role === "admin") {
      if (!selectedFilter || selectedFilter === "all") {
        options = allDocs;
      } else if (selectedFilter === "vacant") {
        options = allDocs.filter((d) => !d.repId);
      } else if (selectedFilter.startsWith("lm:")) {
        const lmId = selectedFilter.split(":")[1];
        const lmDmIds = allUsers
          .filter((u) => u.managerId === lmId)
          .map((u) => u.id);
        const lmRepIds = allUsers
          .filter((u) => lmDmIds.includes(u.managerId))
          .map((u) => u.id);
        const allowed = [lmId, ...lmDmIds, ...lmRepIds];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else if (selectedFilter.startsWith("dm:")) {
        const dmId = selectedFilter.split(":")[1];
        const dmRepIds = allUsers
          .filter((u) => u.managerId === dmId)
          .map((u) => u.id);
        const allowed = [dmId, ...dmRepIds];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else {
        options = allDocs;
      }
    } else {
      options = allDocs;
    }
  }

  if (options.length === 0) {
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = isAr
      ? "-- لا توجد أهداف مطابقة --"
      : "-- No targets found --";
    emptyOpt.disabled = true;
    emptyOpt.selected = true;
    targetSelect.appendChild(emptyOpt);
    return;
  }

  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.id;
    o.textContent = opt.name;
    targetSelect.appendChild(o);
  });
}

function toggleDoubleVisit() {
  const checked = document.querySelector('input[name="visitType"]:checked');
  const doubleSection = document.getElementById("doubleManagerSection");
  if (checked && doubleSection) {
    doubleSection.style.display = checked.value === "double" ? "block" : "none";
  }
}

function openCompleteModal(visitId) {
  currentEditVisitId = visitId;
  const visit = demoVisits.find((v) => v.id === visitId);
  if (!visit) return;
  const editSelectedProds = (visit.productIds && visit.productIds.length > 0) ? visit.productIds : (visit.products || []);
  populateVisitProducts(editSelectedProds);
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const trans = visitTranslations[lang] || visitTranslations.en;
  document.getElementById("visitModalTitle").innerText =
    trans.modalCompleteVisit;

  const saveBtn = document.getElementById("btnSaveVisit") || document.querySelector("#visitModal button[onclick*='saveVisit']");
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerText = lang === "ar" ? "اعتماد وإتمام الزيارة" : "Complete Visit";
  }
  const checkGpsBtn = document.getElementById("btnCheckMyGps");
  if (checkGpsBtn) checkGpsBtn.disabled = false;

  const dateInput = document.getElementById("visitDate");
  const twoDaysAgoStr = getTwoDaysAgoStr();
  if (dateInput) {
    dateInput.max = todayStr;
    dateInput.min = twoDaysAgoStr;
    if (visit.date && visit.date >= twoDaysAgoStr && visit.date <= todayStr) {
      dateInput.value = visit.date;
    } else {
      dateInput.value = todayStr;
    }
  }
  const timeInput = document.getElementById("visitTime");
  if (timeInput) {
    const now = new Date();
    timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  updateVisitModalDayDisplay();

  const periodValue =
    visit.targetType === "pharmacy" ||
    (visit.doctorId && visit.doctorId.startsWith("pharm"))
      ? "pharmacy"
      : (visit.period || "pm").toLowerCase();

  const periodEl = document.querySelector(
    `input[name="visitPeriod"][value="${periodValue}"]`,
  );
  if (periodEl) periodEl.checked = true;
  setupModalTargetFilter();
  updateTargetOptions();

  document.getElementById("visitTarget").value = visit.doctorId;

  if (visit.visitType) {
    const typeEl = document.querySelector(
      `input[name="visitType"][value="${visit.visitType}"]`,
    );
    if (typeEl) typeEl.checked = true;
  } else {
    const singleRadio = document.querySelector('input[name="visitType"][value="single"]');
    if (singleRadio) singleRadio.checked = true;
  }
  toggleDoubleVisit();

  const compList = visit.doubleWithUserName
    ? visit.doubleWithUserName.split(", ")
    : [];
  populateVisitCompanions(visit.repId || currentUser.id || "rep1", compList);

  document.getElementById("visitComment").value = visit.comment || "";
  const samplesInput = document.getElementById("visitGiveawaySamples");
  if (samplesInput) samplesInput.value = visit.giveawaySamples || "";

  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.dataset.source = "plan";
    modal.classList.add("active");
    modal.style.display = "flex";
  }

  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };
  const isGpsActive = !!companySettings.requireGpsValidation;

  const gpsSec = document.getElementById("visitGpsSection");
  if (gpsSec) {
    gpsSec.style.display = isGpsActive ? "block" : "none";
    if (isGpsActive) triggerManualGpsCheck();
  }
}

function closeVisitModal() {
  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
  const saveBtn = document.getElementById("btnSaveVisit") || document.querySelector("#visitModal button[onclick*='saveVisit']");
  if (saveBtn) {
    saveBtn.disabled = false;
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    saveBtn.innerText = lang === "ar" ? "حفظ الزيارة" : "Save Visit";
  }
}

function saveVisit() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const saveBtn = document.getElementById("btnSaveVisit") || document.querySelector("#visitModal button[onclick*='saveVisit']");
  if (saveBtn) {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.innerText = lang === "ar" ? "جاري التحقق والحفظ... ⏳" : "Saving... ⏳";
  }

  const resetSaveBtn = () => {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = lang === "ar" ? "حفظ الزيارة" : "Save Visit";
    }
  };

  const timeInput = document.getElementById("visitTime");
  const visitTime = timeInput && timeInput.value ? timeInput.value : "11:00";
  const dateInput = document.getElementById("visitDate");
  const visitDate = dateInput && dateInput.value ? dateInput.value : todayStr;
  const modalSource =
    document.getElementById("visitModal").dataset.source || "actual";

  if (modalSource === "plan" && !currentEditVisitId) {
    if (visitDate < todayStr) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "لا يمكن جدولة خطة في تاريخ سابق. يرجى اختيار تاريخ اليوم أو تاريخ مستقبلي."
        : "Cannot plan visits in the past. Please select today or a future date.";
      if (typeof showToast === "function") showToast(msg, "warning");
      else alert(msg);
      return;
    }
  } else {
    const twoDaysAgoStr = getTwoDaysAgoStr();
    if (visitDate > todayStr) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "لا يمكن تسجيل زيارة فعلية في تاريخ مستقبلي."
        : "Cannot log an actual visit in a future date.";
      if (typeof showToast === "function") showToast(msg, "warning");
      else alert(msg);
      return;
    }
    if (visitDate < twoDaysAgoStr) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "لا يمكن تسجيل زيارة فعلية بعد مرور أكثر من يومين على تاريخها."
        : "Cannot log an actual visit older than 2 days.";
      if (typeof showToast === "function") showToast(msg, "warning");
      else alert(msg);
      return;
    }
  }

  const targetRepId = currentEditVisitId
    ? (demoVisits.find((v) => v.id === currentEditVisitId)?.repId || currentUser.id)
    : currentUser.id;

  const dateCheck = checkVisitDateAllowed(visitDate, targetRepId, lang);
  if (!dateCheck.allowed) {
    resetSaveBtn();
    if (typeof showToast === "function") showToast(dateCheck.message, "warning");
    else alert(dateCheck.message);
    return;
  }

  // SFE Audit Check: Prevent time conflicts / enforce minimum buffer between visits when GPS is active
  const timeConflict = checkVisitTimeConflict(targetRepId, visitDate, visitTime, currentEditVisitId);
  if (timeConflict.hasConflict) {
    resetSaveBtn();
    const conflictingTarget = timeConflict.conflictingVisit.doctorName || timeConflict.conflictingVisit.doctorId || "";
    const conflictingTime = timeConflict.conflictingVisit.time || visitTime;
    let conflictMsg;
    if (timeConflict.exactMatch) {
      conflictMsg = lang === "ar"
        ? `⚠️ يوجد زيارة مسجلة بالفعل في نفس التوقيت (${visitTime}) لدكتور/هدف آخر (${conflictingTarget}). يرجى ضبط توقيت الزيارة.`
        : `⚠️ A visit is already recorded at the exact same time (${visitTime}) for another target (${conflictingTarget}). Please adjust visit time.`;
    } else {
      conflictMsg = lang === "ar"
        ? `⚠️ الفارق الزمني بين الزيارات يجب ألا يقل عن ${timeConflict.minRequired} دقائق عند تفعيل تسجيل الزيارات بالموقع (GPS). توجد زيارة أخرى في (${conflictingTime}) لـ (${conflictingTarget}).`
        : `⚠️ Minimum time between visits must be at least ${timeConflict.minRequired} minutes when location tracking is active. Another visit exists at (${conflictingTime}) for (${conflictingTarget}).`;
    }
    if (typeof showToast === "function") showToast(conflictMsg, "warning");
    else alert(conflictMsg);
    return;
  }

  const typeChecked = document.querySelector('input[name="visitType"]:checked');
  const visitType = typeChecked ? typeChecked.value : "single";
  let doubleWithUserName = "";
  let doubleWithUserId = null;

  if (visitType === "double") {
    const companionCbs = Array.from(
      document.querySelectorAll('#visitManagersGroup input[name="doubleCompanion"]:checked'),
    );
    doubleWithUserName = companionCbs.map((cb) => cb.value).join(", ");
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const firstCb = companionCbs[0];
    if (firstCb && firstCb.dataset.userId) {
      doubleWithUserId = firstCb.dataset.userId;
    } else {
      const matchedUser = allUsers.find((u) =>
        companionCbs.some((cb) => cb.value.includes(u.name) || (cb.dataset && cb.dataset.userId === u.id)),
      );
      if (matchedUser) doubleWithUserId = matchedUser.id;
    }

    if (doubleWithUserId) {
      const compCheck = checkVisitDateAllowed(visitDate, doubleWithUserId, lang);
      if (!compCheck.allowed) {
        resetSaveBtn();
        const cMsg = lang === "ar"
          ? `⚠️ المرافق المحدد في الزيارة المشتركة لديه إجازة مسجلة أو عطلة في هذا التاريخ (${visitDate}).`
          : `⚠️ The companion selected for this double visit has a registered leave or holiday on this date (${visitDate}).`;
        if (typeof showToast === "function") showToast(cMsg, "warning");
        else alert(cMsg);
        return;
      }
    }
  }

  const checkedBoxes = Array.from(
    document.querySelectorAll('#visitProducts input[type="checkbox"]:checked'),
  );
  const selectedProductIds = checkedBoxes.map((cb) => cb.value);
  const selectedProductNames = checkedBoxes.map((cb) => cb.dataset.name || cb.value);

  const giveawaySamples = document.getElementById("visitGiveawaySamples")?.value.trim() || "";

  if (currentEditVisitId) {
    const visit = demoVisits.find((v) => v.id === currentEditVisitId);
    if (visit) {
      if (!visit.planId && visit.source === "plan") {
        visit.planId = "plan_" + (visit.id || Date.now());
      }
      visit.status = "completed";
      visit.date = visitDate;
      visit.time = visitTime;
      visit.entryDate = visitDate;
      visit.comment = document.getElementById("visitComment").value;
      visit.giveawaySamples = giveawaySamples;
      visit.visitType = visitType;
      visit.doubleWithUserName = doubleWithUserName;
      if (doubleWithUserId) {
        visit.doubleWithUserId = doubleWithUserId;
      } else if (visitType === "single") {
        delete visit.doubleWithUserId;
      }
      visit.productIds = selectedProductIds;
      visit.products = selectedProductNames;

      if (
        visit.targetType === "pharmacy" ||
        (visit.period || "").toLowerCase() === "pharmacy" ||
        (visit.doctorId && String(visit.doctorId).startsWith("pharm"))
      ) {
        visit.targetType = "pharmacy";
        visit.period = "pharmacy";
      }

      const companySettings = (window.store && window.store.companySettings)
        ? window.store.companySettings.get()
        : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

      const finalizeEdit = (gpsPayload) => {
        resetSaveBtn();
        if (gpsPayload) {
          visit.gpsStatus = gpsPayload.status;
          if (gpsPayload.distanceMeters != null) visit.distanceMeters = gpsPayload.distanceMeters;
        }
        persistVisits();
        closeVisitModal();
        renderVisits(true);
        const successMsg = lang === "ar"
          ? "تم تسجيل وحفظ الزيارة بنجاح."
          : "Visit saved successfully.";
        showToast(successMsg, "success");
      };

      if (companySettings.requireGpsValidation) {
        captureVisitLocation((loc) => {
          let gpsPayload = { status: "permission_denied" };
          if (loc.status === "obtained" && loc.lat != null && loc.lng != null) {
            const allDocs = getMockDoctors();
            const allHosps = getMockHospitals();
            const targetItem = allDocs.find((d) => d.id === visit.doctorId) || allHosps.find((h) => h.id === visit.doctorId);
            if (targetItem && targetItem.lat != null && targetItem.lng != null) {
              const dist = calculateDistanceMeters(loc.lat, loc.lng, targetItem.lat, targetItem.lng);
              const maxDist = companySettings.gpsMaxDistanceMeters || 200;
              gpsPayload = dist <= maxDist
                ? { status: "in_range", distanceMeters: dist }
                : { status: "out_of_range", distanceMeters: dist };
            } else {
              gpsPayload = { status: "in_range", distanceMeters: 0 };
              if (targetItem) { targetItem.lat = loc.lat; targetItem.lng = loc.lng; }
            }
          }
          finalizeEdit(gpsPayload);
        });
      } else {
        finalizeEdit(null);
      }
      return;
    }
  } else {
    const period =
      document.querySelector('input[name="visitPeriod"]:checked')?.value ||
      "pm";
    const targetSelect = document.getElementById("visitTarget");
    const targetId = targetSelect ? targetSelect.value : "";
    if (!targetId) {
      resetSaveBtn();
      const isAr = (window.getCurrentLang && window.getCurrentLang()) === "ar";
      alert(isAr ? "يرجى اختيار الهدف أولاً" : "Please select a target first");
      return;
    }

    // Duplicate check on same date for same rep (excluding rejected visits)
    if (isDoctorAlreadyVisitedToday(targetId, visitDate, currentUser.id, currentEditVisitId)) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "تم تسجيل أو جدولة زيارة لهذا الطبيب بالفعل في هذا اليوم. لا يمكن تكرار زيارة نفس الطبيب مرتين في نفس اليوم."
        : "A visit for this target is already logged or scheduled today. Duplicate visits to the same target on the same day are not allowed.";
      return showToast(msg, "warning");
    }

    let targetName =
      targetSelect.options[targetSelect.selectedIndex]?.text ||
      "Doctor/Hospital/Pharmacy";
    if (period.toLowerCase() === "pm") {
      const doc = getMockDoctors().find((d) => d.id === targetId);
      if (doc) targetName = doc.name;
    } else if (period.toLowerCase() === "am") {
      const hosp = getMockHospitals().find((h) => h.id === targetId);
      if (hosp) targetName = hosp.name;
    } else if (period.toLowerCase() === "pharmacy") {
      const pharm = getMockPharmacies().find((p) => p.id === targetId);
      if (pharm) targetName = pharm.name;
    }

    let assignedRepId = currentUser.id;
    const isPharmacy = period.toLowerCase() === "pharmacy";

    const newVisit = {
      id: "v_" + Date.now(),
      repId: assignedRepId,
      doctorId: targetId,
      doctorName: targetName,
      date: visitDate,
      time: visitTime,
      period: isPharmacy ? "pharmacy" : period,
      targetType: isPharmacy
        ? "pharmacy"
        : period.toLowerCase() === "am"
          ? "hospital"
          : "doctor",
      visitType: visitType,
      doubleWithUserName: doubleWithUserName,
      doubleWithUserId: doubleWithUserId || undefined,
      productIds: selectedProductIds,
      products: selectedProductNames,
      comment: document.getElementById("visitComment").value,
      giveawaySamples: giveawaySamples,
      status: "completed",
      source: modalSource,
      createdAt: new Date().toISOString(),
      entryDate: visitDate,
    };

    const finalizeNewSave = (gpsPayload) => {
      resetSaveBtn();
      if (gpsPayload) {
        newVisit.gpsStatus = gpsPayload.status;
        if (gpsPayload.distanceMeters != null) newVisit.distanceMeters = gpsPayload.distanceMeters;
      }
      demoVisits.unshift(newVisit);
      persistVisits();
      closeVisitModal();
      renderVisits(true);

      const successMsg =
        lang === "ar"
          ? "تم تسجيل وحفظ الزيارة بنجاح."
          : "Visit saved successfully.";
      showToast(successMsg, "success");
    };

    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

    if (modalSource === "actual" && companySettings.requireGpsValidation) {
      captureVisitLocation((loc) => {
        let gpsPayload = { status: "permission_denied" };
        if (loc.status === "obtained" && loc.lat != null && loc.lng != null) {
          const allDocs = getMockDoctors();
          const allHosps = getMockHospitals();
          const targetItem = allDocs.find((d) => d.id === targetId) || allHosps.find((h) => h.id === targetId);
          if (targetItem && targetItem.lat != null && targetItem.lng != null) {
            const dist = calculateDistanceMeters(loc.lat, loc.lng, targetItem.lat, targetItem.lng);
            const maxDist = companySettings.gpsMaxDistanceMeters || 200;
            gpsPayload = dist <= maxDist
              ? { status: "in_range", distanceMeters: dist }
              : { status: "out_of_range", distanceMeters: dist };
          } else {
            gpsPayload = { status: "in_range", distanceMeters: 0 };
            if (targetItem) { targetItem.lat = loc.lat; targetItem.lng = loc.lng; }
          }
        }
        finalizeNewSave(gpsPayload);
      });
    } else {
      finalizeNewSave(null);
    }
  }
}

// ============================================================================
// Section 9: Export Visits to CSV/Excel & Print
// ============================================================================
function exportVisitsToCSV() {
  const dateInput =
    document.getElementById("timelineDatePicker") ||
    document.getElementById("filterDate");
  const fDate = dateInput ? dateInput.value : null;
  const repSelect = document.getElementById("filterRep");
  const fRep = repSelect ? repSelect.value : "all";

  const fStatus = document.getElementById("filterStatus")?.value;
  const fPeriod = document.getElementById("filterPeriod")?.value;
  const fClass = document.getElementById("filterClass")?.value;
  const fArea = document.getElementById("timelineAreaFilter")?.value || "all";
  const fTimelinePeriod = document.getElementById("timelinePeriodFilter")?.value;
  const fTimelineStatus = document.getElementById("timelineStatusFilter")?.value;

  const allDocs = getMockDoctors();
  const allHosps = getMockHospitals();
  const allPharms = getMockPharmacies();
  const allAreas =
    (window.store && window.store.areas
      ? window.store.areas.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.areas)) || [];

  let filtered = getScopedVisits();

  if (fRep && fRep !== "all") {
    filtered = filtered.filter((v) => v.repId === fRep);
  }
  if (fDate) filtered = filtered.filter((v) => v.date === fDate);

  // Status Filter (table or timeline filter)
  const activeStatus = (fStatus && fStatus !== "all") ? fStatus : (fTimelineStatus && fTimelineStatus !== "all" ? fTimelineStatus : null);
  if (activeStatus) {
    if (activeStatus === "completed" || activeStatus === "executed") {
      filtered = filtered.filter((v) => v.source === "actual" || v.isActual || v.status === "completed");
    } else if (activeStatus === "planned") {
      filtered = filtered.filter((v) => (v.source === "plan" || v.source === "planned") && !v.isActual && v.status !== "completed");
    } else {
      filtered = filtered.filter((v) => v.status === activeStatus);
    }
  }

  // Period Filter (table or timeline filter)
  const activePeriod = (fPeriod && fPeriod !== "all") ? fPeriod : (fTimelinePeriod && fTimelinePeriod !== "all" ? fTimelinePeriod : null);
  if (activePeriod) {
    if (activePeriod.toLowerCase() === "pharmacy") {
      filtered = filtered.filter(
        (v) =>
          v.targetType === "pharmacy" ||
          (v.period || "").toLowerCase() === "pharmacy" ||
          (v.doctorId && String(v.doctorId).startsWith("pharm")),
      );
    } else {
      filtered = filtered.filter((v) => {
        const isPharm =
          v.targetType === "pharmacy" ||
          (v.period || "").toLowerCase() === "pharmacy" ||
          (v.doctorId && String(v.doctorId).startsWith("pharm"));
        if (isPharm) return false;
        return (v.period || "pm").toLowerCase() === activePeriod.toLowerCase();
      });
    }
  }

  // Area Filter
  if (fArea && fArea !== "all") {
    const selAreaObj = allAreas.find((a) => a.id === fArea || a.name === fArea);
    const selAreaName = selAreaObj
      ? selAreaObj.name.toLowerCase().trim()
      : fArea.toLowerCase().trim();

    filtered = filtered.filter((v) => {
      if (v.areaId && v.areaId === fArea) return true;
      if (v.area && v.area.toLowerCase().trim() === selAreaName) return true;
      const target =
        allDocs.find((d) => d.id === v.doctorId || d.name === v.doctorName) ||
        allHosps.find((h) => h.id === v.doctorId || h.name === v.doctorName) ||
        allPharms.find((p) => p.id === v.doctorId || p.name === v.doctorName);
      if (target) {
        if (target.areaId && target.areaId === fArea) return true;
        if (target.area && target.area.toLowerCase().trim() === selAreaName) return true;
        if (selAreaName) {
          const addr = (target.clinicAddress || target.address || "").toLowerCase();
          if (addr.includes(selAreaName)) return true;
        }
      }
      return false;
    });
  }

  if (fClass && fClass !== "all") {
    filtered = filtered.filter((v) => {
      const doc = allDocs.find(
        (d) => d.name === v.doctorName || d.id === v.doctorId,
      );
      const hosp = allHosps.find(
        (h) => h.name === v.doctorName || h.id === v.doctorId,
      );
      if (fClass === "all_doctors") {
        return !!doc && (doc.class === "A" || doc.class === "B");
      }
      if (fClass === "hospital") {
        return (
          v.targetType !== "pharmacy" &&
          (v.period || "").toLowerCase() !== "pharmacy" &&
          (!!hosp ||
            (v.period && v.period.toLowerCase() === "am") ||
            (v.doctorId && v.doctorId.toString().startsWith("h")))
        );
      }
      if (fClass === "pharmacy") {
        return (
          v.targetType === "pharmacy" ||
          (v.period && v.period.toLowerCase() === "pharmacy") ||
          (v.doctorId && v.doctorId.toString().startsWith("pharm"))
        );
      }
      return doc && doc.class === fClass;
    });
  }

  let csv =
    "Target Name,Area,Date,Time,Period,Type,Status,Source,Rep ID,Products,Comment\n";
  filtered.forEach((v) => {
    let areaName = v.area || "";
    if (!areaName) {
      const foundTarget =
        allDocs.find((d) => d.name === v.doctorName || d.id === v.doctorId) ||
        allHosps.find((h) => h.name === v.doctorName || h.id === v.doctorId) ||
        allPharms.find((p) => p.name === v.doctorName || p.id === v.doctorId);
      if (foundTarget) {
        areaName = foundTarget.area || "";
        if (!areaName && foundTarget.areaId) {
          const fa = allAreas.find((a) => a.id === foundTarget.areaId);
          if (fa) areaName = fa.name;
        }
      }
    }
    const prods = (window.getVisitDisplayProducts ? window.getVisitDisplayProducts(v) : (v.products || [])).join("; ");
    csv += `"${(v.doctorName || "").replace(/"/g, '""')}","${(areaName || "").replace(/"/g, '""')}","${v.date || ""}","${v.time || ""}","${(v.period || "").toUpperCase()}","${v.visitType || "single"}","${v.status || ""}","${v.source || ""}","${v.repId || ""}","${prods}","${(v.comment || "").replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PharmaCare_Visits_${fDate || "All"}.csv`;
  a.click();
}


function printVisitsReport() {
  window.print();
}

Object.assign(visitsApp, {
  confirmDeleteVisit(visitId) {
    const visit = demoVisits.find((v) => v.id === visitId);
    if (!visit) return;

    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

    if (!canDeleteVisit(visit)) {
      return;
    }

    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const repUser = allUsers.find((u) => u.id === visit.repId);
    const repName = repUser
      ? `${repUser.name} (${repUser.role === "line_manager" ? "LM" : repUser.role === "district_manager" ? "DM" : "Rep"})`
      : visit.repId || "";

    const confirmMsg =
      lang === "ar"
        ? `هل أنت متأكد من حذف هذه الزيارة نهائياً من سجلات النظام؟\n\n• الهدف: ${visit.doctorName}\n• مسجلة بواسطة: ${repName}\n• التاريخ: ${visit.date}`
        : `Are you sure you want to permanently delete this visit record?\n\n• Target: ${visit.doctorName}\n• Logged by: ${repName}\n• Date: ${visit.date}`;

    if (!confirm(confirmMsg)) return;

    demoVisits = demoVisits.filter((v) => v.id !== visitId);
    persistVisits();

    try {
      const repDataStr = localStorage.getItem("pharma_reports_data");
      if (repDataStr) {
        const repData = JSON.parse(repDataStr);
        if (Array.isArray(repData.visits)) {
          repData.visits = repData.visits.filter((v) => v.id !== visitId);
          localStorage.setItem("pharma_reports_data", JSON.stringify(repData));
        }
      }
    } catch (e) {
      console.error("Error updating pharma_reports_data on visit deletion:", e);
    }

    renderVisits();
    showToast(
      lang === "ar" ? "تم حذف الزيارة بنجاح." : "Visit deleted successfully.",
      "success",
    );
  },

  openVisitModal,
  closeVisitModal,
  openCompleteModal,
  saveVisit,
  exportVisitsToCSV,
  printVisitsReport,
  renderVisits,
  renderVisitsTimeline,
});

window.visitsApp = visitsApp;

window.confirmDeleteVisit = confirmDeleteVisit;
window.openVisitModal = openVisitModal;
window.closeVisitModal = closeVisitModal;
window.openCompleteModal = openCompleteModal;
window.saveVisit = saveVisit;
window.exportVisitsToCSV = exportVisitsToCSV;
window.printVisitsReport = printVisitsReport;
window.renderVisits = renderVisits;
window.renderVisitsTimeline = renderVisitsTimeline;
