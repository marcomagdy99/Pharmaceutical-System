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
    colVisitDay: "Visit Day",
    colVisitTime: "Visit Time",
    colInsertionDate: "Insertion Date",
    colInsertionTime: "Insertion Time",
    modalAddVisit: "Add New Visit",
    modalCompleteVisit: "Complete Visit",
    modalDate: "Visit Day",
    modalVisitDay: "Visit Day",
    modalVisitTime: "Visit Time (HH:MM)",
    modalInsertionDate: "Insertion Date:",
    modalInsertionTime: "Insertion Time:",
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
    colVisitDay: "يوم الزيارة",
    colVisitTime: "وقت الزيارة",
    colInsertionDate: "تاريخ الإدخال",
    colInsertionTime: "وقت الإدخال",
    modalAddVisit: "إضافة زيارة جديدة",
    modalCompleteVisit: "إكمال الزيارة",
    modalDate: "يوم الزيارة",
    modalVisitDay: "يوم الزيارة",
    modalVisitTime: "وقت الزيارة",
    modalInsertionDate: "تاريخ الإدخال:",
    modalInsertionTime: "وقت الإدخال:",
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
// Section 2: Visit Governance & Validation (Single Source of Truth in app.js)
// ============================================================================
var isPlannedVisitExpired = (typeof window !== "undefined" && window.isPlannedVisitExpired) || function (dateStr) {
  return false;
};

var isDoctorAlreadyVisitedToday = (typeof window !== "undefined" && window.isDoctorAlreadyVisitedToday) || function (doctorId, visitDate, repId, currentVisitId = null) {
  return false;
};

var parseTimeToMinutes = (typeof window !== "undefined" && window.parseTimeToMinutes) || function (timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

var checkVisitTimeConflict = (typeof window !== "undefined" && window.checkVisitTimeConflict) || function (repId, visitDate, visitTime, currentVisitId = null) {
  return { hasConflict: false };
};

var checkVisitDateAllowed = (typeof window !== "undefined" && window.checkVisitDateAllowed) || function (dateStr, repId, lang) {
  return { allowed: true };
};

function isWorkdayExemptFromMinVisits(dateStr, repId) {
  if (!dateStr) return { exempt: false };

  // 1. Weekend check: Friday (5) is statutory; Thursday (4) is optional based on company settings
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay();
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
  const isThursdayWeekend = !!companySettings.isThursdayWeekend;

  if (dayOfWeek === 5 || (dayOfWeek === 4 && isThursdayWeekend)) {
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
    return `<span class="badge badge-gps-denied">${text}</span>`;
  }
  if (v.gpsStatus === "in_range") {
    const text = lang === "ar" ? "✅ تم التحقق (داخل النطاق)" : "✅ Verified (In Range)";
    return `<span class="badge badge-gps-in-range">${text}</span>`;
  }
  if (v.gpsStatus === "no_target_coords") {
    const text = lang === "ar" ? "📍 بدون إحداثيات" : "📍 No Target Coords";
    return `<span class="badge" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${text}</span>`;
  }
  if (v.gpsStatus === "out_of_range") {
    const distText = v.distanceMeters ? ` (${v.distanceMeters}m)` : "";
    const text = lang === "ar" ? `⚠️ خارج النطاق${distText}` : `⚠️ Out of Range${distText}`;
    return `<span class="badge badge-gps-out-of-range">${text}</span>`;
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
      let hasTargetCoords = false;
      if (targetItem && targetItem.lat != null && targetItem.lng != null) {
        distance = calculateDistanceMeters(loc.lat, loc.lng, targetItem.lat, targetItem.lng);
        hasTargetCoords = true;
      }

      if (!hasTargetCoords) {
        if (badge) {
          badge.textContent = isAr ? "📍 بدون إحداثيات" : "📍 No Coordinates";
          badge.style.background = "#f1f5f9";
          badge.style.color = "#475569";
        }
        if (infoText) {
          infoText.textContent = isAr
            ? "لم يتم تسجيل إحداثيات جغرافية مسبقة لهذه العيادة أو المستشفى."
            : "No pre-registered coordinates found for this clinic or hospital.";
        }
        if (distText) distText.textContent = "";
        return;
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
const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};

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
  if (currentUserRole === "product_manager") {
    const pmLineId = currentUser?.lineId || (currentUser?.lineIds && currentUser?.lineIds[0]);
    return allUsers.filter((u) => {
      const isRep = window.isRepRole ? window.isRepRole(u) : (u.role === "medical_rep" || u.role === "rep");
      if (!isRep) return false;
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return pmLineId ? uLineIds.includes(pmLineId) : true;
    });
  }
  return allUsers.filter((u) => u.id === currentUser.id);
}

// ============================================================================
// Section 4: Dynamic Master Target Getters
// ============================================================================
function getMockDoctors() {
  if (window.store && window.store.doctors) {
    return window.store.doctors.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
}

function getMockHospitals() {
  if (window.store && window.store.hospitals) {
    return window.store.hospitals.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
}

function getMockPharmacies() {
  if (window.store && window.store.pharmacies) {
    return window.store.pharmacies.getAll();
  }
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

function getLiveVisits() {
  if (window.store && window.store.visits && typeof window.store.visits.getAll === "function") {
    demoVisits = window.store.visits.getAll();
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.visits)) {
    demoVisits = window.DEMO_DATA.visits;
  }
  return demoVisits;
}

function persistVisits() {
  if (window.DEMO_DATA) {
    window.DEMO_DATA.visits = demoVisits;
    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
    }
    if (typeof CustomEvent !== "undefined" && typeof document !== "undefined" && typeof document.dispatchEvent === "function") {
      document.dispatchEvent(
        new CustomEvent("pharma:store:changed", {
          detail: { entity: "visits", action: "update", payload: demoVisits },
        })
      );
    }
  }
}

window.addEventListener("storage", (e) => {
  if (e.key === "pharma_master_data") {
    if (typeof window.loadDataFromStorage === "function") {
      window.loadDataFromStorage();
    }
    getLiveVisits();
    if (typeof renderVisitsTimeline === "function") renderVisitsTimeline(hasLoadedTimelineOnce);
  }
});

document.addEventListener("pharma:store:changed", (e) => {
  if (e.detail && e.detail.entity === "visits") {
    getLiveVisits();
  }
});

let currentEditVisitId = null;
const _padZ = (n) => String(n).padStart(2, "0");
const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || (() => {
  const _nowDate = (window.getSystemDate && window.getSystemDate()) || new Date();
  return `${_nowDate.getFullYear()}-${_padZ(_nowDate.getMonth() + 1)}-${_padZ(_nowDate.getDate())}`;
})();

function getTwoDaysAgoStr() {
  if (typeof window.getVisitBacklogMinDateStr === "function") {
    return window.getVisitBacklogMinDateStr();
  }
  const d = (window.getSystemDate && window.getSystemDate()) || new Date();
  d.setDate(d.getDate() - 2);
  return `${d.getFullYear()}-${_padZ(d.getMonth() + 1)}-${_padZ(d.getDate())}`;
}

const getSysLang = () => (window.getCurrentLang && window.getCurrentLang()) || "en";
const isSysAr = () => getSysLang() === "ar";

let hasLoadedTimelineOnce = false;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramDate = urlParams.get("date");
  let savedTimelineDate = null;
  try {
    savedTimelineDate = sessionStorage.getItem("pharma_timeline_selected_date");
  } catch (e) {}

  const effectiveDate = (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate))
    ? paramDate
    : (savedTimelineDate && /^\d{4}-\d{2}-\d{2}$/.test(savedTimelineDate))
      ? savedTimelineDate
      : todayStr;

  const dateInput = document.getElementById("visitDate");
  if (dateInput) dateInput.value = effectiveDate;

  const timelineDatePicker = document.getElementById("timelineDatePicker");
  if (timelineDatePicker) {
    timelineDatePicker.value = effectiveDate;
    timelineDatePicker.addEventListener("change", (e) => {
      if (e.target.value) {
        try {
          sessionStorage.setItem("pharma_timeline_selected_date", e.target.value);
        } catch (err) {}
      }
      hasLoadedTimelineOnce = false;
      renderVisitsTimeline(false);
    });
    timelineDatePicker.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        renderVisitsTimeline(true);
      }
    });
  }

  // Reactive filters: auto-update timeline when filters change only after initial show
  ["timelineAreaFilter", "timelinePeriodFilter", "timelineStatusFilter"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      if (hasLoadedTimelineOnce) {
        renderVisitsTimeline(true);
      }
    });
  });

  setupRoleBasedView();
  populateAreaFilters();
  renderVisitsTimeline(false);
  setupModalTargetFilter();
  updateTargetOptions();
});

function setupRoleBasedView() {
  updateAdminGpsButton();

  const filterBar = document.getElementById("managerFilterBar");
  const filterLine = document.getElementById("filterLine");
  const lineContainer = document.getElementById("managerLineFilterContainer");
  const filterContainer = document.getElementById("managerRepFilterContainer");
  const filterRep = document.getElementById("filterRep");
  const planVisitBtn = document.getElementById("planVisitBtn");
  const addActualVisitBtn = document.getElementById("addActualVisitBtn");
  const titleSpan = document.getElementById("visitsPageTitle");
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  if (titleSpan) {
    titleSpan.setAttribute("data-i18n", "tabDailyTimeline");
    titleSpan.textContent =
      isAr ? "الخط الزمني للزيارات اليومية" : "Daily Visits Timeline";
  }

  // Always initialize the Line Filter for all authenticated users
  populateVisitsLineFilter();

  if (isManager) {
    if (filterBar) filterBar.style.display = "flex";
    if (lineContainer) lineContainer.style.display = "flex";
    if (filterContainer) filterContainer.style.display = "flex";
    if (filterRep) {
      filterRep.style.display = "inline-block";
      const curLine = filterLine ? filterLine.value : "all";
      populateManagerRepDropdown(curLine);
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
    // Medical Rep view: Line filter is shown as single/fixed, team selector is hidden
    if (filterBar) filterBar.style.display = "flex";
    if (lineContainer) lineContainer.style.display = "flex";
    if (filterContainer) filterContainer.style.display = "none";
    if (filterRep) filterRep.style.display = "none";
    if (planVisitBtn) planVisitBtn.style.display = "inline-flex";
    if (addActualVisitBtn) addActualVisitBtn.style.display = "inline-flex";
    populateAreaFilters();
  }
}

/**
 * Populates the Product Line filter based on the current user's role and assigned lines.
 */
function populateVisitsLineFilter() {
  const filterLine = document.getElementById("filterLine");
  if (!filterLine) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const curVal = filterLine.value;
  const isFullAdmin = currentUserRole === "admin" || currentUserRole === "hr";

  filterLine.replaceChildren();

  if (isFullAdmin) {
    const allLines = window.store && window.store.productLines
      ? window.store.productLines.getAll().filter((l) => (l.status || "Active") === "Active")
      : (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = isAr ? "🌐 جميع خطوط الإنتاج" : "🌐 All Product Lines";
    filterLine.appendChild(optAll);

    allLines.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = `📦 ${(isAr && l.nameAr) ? l.nameAr : l.name}`;
      filterLine.appendChild(opt);
    });
    filterLine.disabled = false;
  } else {
    const userLines = window.getUserLines ? window.getUserLines(currentUser.id) : [];

    if (userLines.length > 1) {
      const optAll = document.createElement("option");
      optAll.value = "all";
      optAll.textContent = isAr ? "🌐 جميع خطوطي" : "🌐 All My Lines";
      filterLine.appendChild(optAll);

      userLines.forEach((l) => {
        const opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = `📦 ${(isAr && l.nameAr) ? l.nameAr : l.name}`;
        filterLine.appendChild(opt);
      });
      filterLine.disabled = false;
    } else if (userLines.length === 1) {
      const l = userLines[0];
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = `📦 ${(isAr && l.nameAr) ? l.nameAr : l.name}`;
      filterLine.appendChild(opt);
      filterLine.value = l.id;
      filterLine.disabled = true;
    } else {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = isAr ? "📦 لا توجد خطوط معينة" : "📦 No Line Assigned";
      filterLine.appendChild(opt);
      filterLine.disabled = true;
    }
  }

  if (curVal && Array.from(filterLine.options).some((o) => o.value === curVal)) {
    filterLine.value = curVal;
  }
}

/**
 * Determines the manager ID (typically DM) responsible for an area (delegated to app.js).
 */
function getAreaManagerId(area, allUsers = []) {
  return window.getAreaManagerId ? window.getAreaManagerId(area, allUsers) : null;
}


/**
 * Populates Team Filter (#filterRep) cascading strictly from the selected product line.
 */
function populateManagerRepDropdown(selectedLineId = "all") {
  const filterRep = document.getElementById("filterRep");
  if (!filterRep) return;

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const scopedTeam = window.getScopedTeamForLine
    ? window.getScopedTeamForLine(selectedLineId, currentUser)
    : allUsers;

  filterRep.replaceChildren();

  const isDM = currentUserRole === "district_manager" || currentUserRole === "dm";
  const isAdmin = currentUserRole === "admin" || currentUserRole === "hr";

  // Option: All Team in this line
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = isAr ? "🌐 كل الفريق في هذا الخط" : "🌐 All Team in Line";
  filterRep.appendChild(optAll);

  // Self Option
  if (isManager && !isAdmin) {
    const optSelf = document.createElement("option");
    optSelf.value = currentUser.id;
    optSelf.textContent = isAr
      ? `👔 ${currentUser.name} (زياراتي الشخصية)`
      : `👔 ${currentUser.name} (My Visits)`;
    filterRep.appendChild(optSelf);
  }

  // Vacant Areas for managers and admin
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  let vacantAreas = allAreas.filter((a) => !a.repId);
  if (selectedLineId !== "all") {
    vacantAreas = vacantAreas.filter((a) => a.lineId === selectedLineId);
  } else if (!isAdmin) {
    const mgrLines = window.getUserLines ? window.getUserLines(currentUser.id) : [];
    const mgrLineIds = mgrLines.map((l) => l.id);
    if (mgrLineIds.length > 0) {
      vacantAreas = vacantAreas.filter((a) => !a.lineId || mgrLineIds.includes(a.lineId));
    }
  }

  if (isDM) {
    // DM only supervises Medical Reps and their assigned vacant areas
    const reps = scopedTeam.filter(
      (u) => u.id !== currentUser.id && (u.role === "medical_rep" || u.role === "rep")
    );
    const myVacantAreas = vacantAreas.filter((a) => {
      const mgrId = typeof getAreaManagerId === "function" ? getAreaManagerId(a, allUsers) : null;
      return mgrId === currentUser.id || (!mgrId && (!a.lineId || (currentUser.lineIds && currentUser.lineIds.includes(a.lineId)) || currentUser.lineId === a.lineId));
    });

    if (reps.length > 0 || myVacantAreas.length > 0) {
      const repGroup = document.createElement("optgroup");
      repGroup.label = isAr ? "المناديب والمناطق الشاغرة (Team)" : "Team Reps & Vacant Areas";
      reps.forEach((rep) => {
        const opt = document.createElement("option");
        opt.value = rep.id;
        opt.className = "filter-opt-rep";
        opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || rep.code || "Rep"})`;
        repGroup.appendChild(opt);
      });
      myVacantAreas.forEach((area) => {
        const opt = document.createElement("option");
        opt.value = `vacant:${area.id}`;
        opt.className = "filter-opt-vacant";
        const areaName = isAr && area.nameAr ? area.nameAr : area.name;
        opt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
        repGroup.appendChild(opt);
      });
      filterRep.appendChild(repGroup);
    }
  } else {
    // For LM, BU, Admin: Group DMs first, then Reps and Vacant Areas under each DM
    const dms = scopedTeam.filter(
      (u) => u.id !== currentUser.id && (u.role === "district_manager" || u.role === "dm")
    );
    const reps = scopedTeam.filter(
      (u) => u.id !== currentUser.id && (u.role === "medical_rep" || u.role === "rep")
    );

    if (dms.length > 0) {
      const dmGroup = document.createElement("optgroup");
      dmGroup.label = isAr ? "مدراء المناطق (District Managers)" : "District Managers (DMs)";
      dms.forEach((dm) => {
        const opt = document.createElement("option");
        opt.value = dm.id;
        opt.className = "filter-opt-dm";
        opt.textContent = `💼 ${dm.name} (${dm.employeeCode || "DM"})`;
        dmGroup.appendChild(opt);
      });
      filterRep.appendChild(dmGroup);
    }

    const assignedVacantIds = new Set();

    if (dms.length > 0) {
      dms.forEach((dm) => {
        const dmReps = reps.filter((r) => r.managerId === dm.id);
        const dmVacantAreas = vacantAreas.filter((a) => {
          const mgrId = typeof getAreaManagerId === "function" ? getAreaManagerId(a, allUsers) : null;
          return mgrId === dm.id;
        });
        dmVacantAreas.forEach((a) => assignedVacantIds.add(a.id));

        if (dmReps.length > 0 || dmVacantAreas.length > 0) {
          const group = document.createElement("optgroup");
          group.label = isAr ? `فريق ${dm.name} (Reps)` : `Team ${dm.name} (Reps)`;
          dmReps.forEach((rep) => {
            const opt = document.createElement("option");
            opt.value = rep.id;
            opt.className = "filter-opt-rep";
            opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"})`;
            group.appendChild(opt);
          });
          dmVacantAreas.forEach((area) => {
            const opt = document.createElement("option");
            opt.value = `vacant:${area.id}`;
            opt.className = "filter-opt-vacant";
            const areaName = isAr && area.nameAr ? area.nameAr : area.name;
            opt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
            group.appendChild(opt);
          });
          filterRep.appendChild(group);
        }
      });

      // Reps or vacant areas without matching DM in this line
      const directOrOtherReps = reps.filter((r) => !dms.some((dm) => dm.id === r.managerId));
      const unassignedVacant = vacantAreas.filter((a) => !assignedVacantIds.has(a.id));
      if (directOrOtherReps.length > 0 || unassignedVacant.length > 0) {
        const group = document.createElement("optgroup");
        group.label = isAr ? "مناديب ومناطق أخرى" : "Other Reps & Vacant Areas";
        directOrOtherReps.forEach((rep) => {
          const opt = document.createElement("option");
          opt.value = rep.id;
          opt.className = "filter-opt-rep";
          opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"})`;
          group.appendChild(opt);
        });
        unassignedVacant.forEach((area) => {
          const opt = document.createElement("option");
          opt.value = `vacant:${area.id}`;
          opt.className = "filter-opt-vacant";
          const areaName = isAr && area.nameAr ? area.nameAr : area.name;
          opt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
          group.appendChild(opt);
        });
        filterRep.appendChild(group);
      }
    } else {
      const repGroup = document.createElement("optgroup");
      repGroup.label = isAr ? "المناديب الطبيين والمناطق الشاغرة" : "Medical Representatives & Vacant Areas";
      reps.forEach((rep) => {
        const opt = document.createElement("option");
        opt.value = rep.id;
        opt.className = "filter-opt-rep";
        opt.textContent = `🩺 ${rep.name} (${rep.employeeCode || "Rep"})`;
        repGroup.appendChild(opt);
      });
      vacantAreas.forEach((area) => {
        const opt = document.createElement("option");
        opt.value = `vacant:${area.id}`;
        opt.className = "filter-opt-vacant";
        const areaName = isAr && area.nameAr ? area.nameAr : area.name;
        opt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
        repGroup.appendChild(opt);
      });
      filterRep.appendChild(repGroup);
    }
  }
}

window.onVisitsLineFilterChange = function (selectedLineId) {
  populateManagerRepDropdown(selectedLineId);
  populateAreaFilters();
  if (hasLoadedTimelineOnce && typeof renderVisitsTimeline === "function") {
    renderVisitsTimeline(true);
  }
};

window.onVisitsRepFilterChange = function (selectedRepId) {
  populateAreaFilters();
  if (hasLoadedTimelineOnce && typeof renderVisitsTimeline === "function") {
    renderVisitsTimeline(true);
  }
};

function getAvailableAreas() {
  const allAreas =
    (window.store && window.store.areas
      ? window.store.areas.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.areas)) || [];

  if (!isManager) {
    // 1. Identify product lines assigned to this medical rep
    const repLineIds = currentUser.lineIds || (currentUser.lineId ? [currentUser.lineId] : []);

    // 2. Fetch areas specifically assigned to this rep from the store
    let repAreas =
      window.store && window.store.areas
        ? window.store.areas.getByRep(currentUser.id)
        : [];

    // 3. Fallback to user object's area attributes if store has no explicit area assignments
    if (!repAreas || repAreas.length === 0) {
      if (
        currentUser.areaIds &&
        Array.isArray(currentUser.areaIds) &&
        currentUser.areaIds.length > 0
      ) {
        repAreas = allAreas.filter((a) => currentUser.areaIds.includes(a.id));
      } else if (currentUser.areaId) {
        repAreas = allAreas.filter((a) => a.id === currentUser.areaId);
      } else if (currentUser.area) {
        const names = currentUser.area.split(",").map((s) => s.trim().toLowerCase());
        repAreas = allAreas.filter((a) => names.includes((a.name || "").toLowerCase().trim()));
      }
    }

    // 4. Fallback to areas of doctors assigned to this rep
    if (!repAreas || repAreas.length === 0) {
      const myDocs = getMockDoctors().filter((d) => d.repId === currentUser.id);
      const docAreaNames = [...new Set(myDocs.map((d) => d.area).filter(Boolean))];
      const docAreaIds = [...new Set(myDocs.map((d) => d.areaId).filter(Boolean))];
      repAreas = allAreas.filter(
        (a) => docAreaIds.includes(a.id) || docAreaNames.includes(a.name),
      );
    }

    // STRICT ISOLATION: If the rep has NO assigned area or doctors, return empty array!
    // Never leak other reps' areas or whole company areas to an unassigned rep.
    if (!repAreas || repAreas.length === 0) {
      return [];
    }

    // STRICT LINE ISOLATION: Scope strictly to the rep's assigned product line(s)
    if (repLineIds.length > 0) {
      repAreas = repAreas.filter((a) => !a.lineId || repLineIds.includes(a.lineId));
    }

    const filterLineVal = document.getElementById("filterLine")?.value || "all";
    if (filterLineVal !== "all") {
      repAreas = repAreas.filter((a) => !a.lineId || a.lineId === filterLineVal);
    }

    return repAreas;
  }

  let finalAreas = allAreas;
  const filterRepVal = document.getElementById("filterRep")?.value || "all";
  if (filterRepVal.startsWith("vacant:")) {
    const vAreaId = filterRepVal.split(":")[1];
    finalAreas = allAreas.filter((a) => a.id === vAreaId);
  } else if (filterRepVal !== "all" && !filterRepVal.startsWith("all_")) {
    const repAreas =
      window.store && window.store.areas
        ? window.store.areas.getByRep(filterRepVal)
        : [];
    if (repAreas.length > 0) {
      finalAreas = repAreas;
    } else {
      finalAreas = allAreas.filter((a) => a.repId === filterRepVal);
    }
  } else {
    // If a Line Manager or District Manager views all, scope strictly to their assigned product lines
    const mgrLineIds = currentUser.lineIds || (currentUser.lineId ? [currentUser.lineId] : []);
    if (mgrLineIds.length > 0 && currentUserRole !== "admin" && currentUserRole !== "hr") {
      finalAreas = allAreas.filter((a) => !a.lineId || mgrLineIds.includes(a.lineId));
    }
  }

  // Filter by selected Line in the Line Filter dropdown
  const filterLineVal = document.getElementById("filterLine")?.value || "all";
  if (filterLineVal !== "all") {
    finalAreas = finalAreas.filter((a) => !a.lineId || a.lineId === filterLineVal);
  }

  return finalAreas;
}

function populateAreaFilters() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  const areas = getAvailableAreas();

  // Deduplicate by normalized area name to prevent duplicate labels (e.g. across lines)
  const seenNames = new Set();
  const uniqueAreas = [];
  areas.forEach((a) => {
    const key = (a.name || "").trim().toLowerCase();
    if (key && !seenNames.has(key)) {
      seenNames.add(key);
      uniqueAreas.push(a);
    }
  });

  const timelineFilter = document.getElementById("timelineAreaFilter");
  if (timelineFilter) {
    const curVal = timelineFilter.value || "all";
    let html = "";
    if (uniqueAreas.length === 0) {
      const noAreasLabel = isAr ? "لا توجد مناطق معينة" : "No Assigned Areas";
      html = `<option value="" disabled selected>${noAreasLabel}</option>`;
    } else {
      const allLabel = isAr ? "جميع المناطق" : "All Areas";
      html = `<option value="all">${allLabel}</option>`;
      uniqueAreas.forEach((a) => {
        const isSelected = (curVal === a.id || curVal === a.name) ? " selected" : "";
        const isVacant = !a.repId;
        const vacantTag = isVacant ? ` [${isAr ? "شاغرة" : "Vacant"}]` : "";
        html += `<option value="${window.escapeHtml(a.id)}" data-name="${window.escapeHtml(a.name)}"${isSelected}>📍 ${window.escapeHtml(a.name)}${vacantTag}</option>`;
      });
    }
    timelineFilter.innerHTML = html;
  }

  const bulkFilter = document.getElementById("bulkAreaFilter");
  if (bulkFilter) {
    const curVal = bulkFilter.value || "all";
    let html = "";
    if (uniqueAreas.length === 0) {
      const noAreasLabel = isAr ? "لا توجد مناطق معينة" : "No Assigned Areas";
      html = `<option value="" disabled selected>${noAreasLabel}</option>`;
    } else {
      const allLabel = isAr ? "جميع المناطق" : "All Areas";
      html = `<option value="all">${allLabel}</option>`;
      uniqueAreas.forEach((a) => {
        const isSelected = (curVal === a.id || curVal === a.name) ? " selected" : "";
        const isVacant = !a.repId;
        const vacantTag = isVacant ? ` [${isAr ? "شاغرة" : "Vacant"}]` : "";
        html += `<option value="${window.escapeHtml(a.id)}" data-name="${window.escapeHtml(a.name)}"${isSelected}>📍 ${window.escapeHtml(a.name)}${vacantTag}</option>`;
      });
    }
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
  } else if (document.getElementById("filterRep")?.value?.startsWith("vacant:")) {
    const vAreaId = document.getElementById("filterRep").value.split(":")[1];
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const vArea = allAreas.find((a) => a.id === vAreaId);
    const vNameLower = vArea && vArea.name ? vArea.name.toLowerCase().trim() : null;
    list = list.filter((v) => {
      if (v.areaId) return v.areaId === vAreaId;
      if (vNameLower && v.area && v.area.toLowerCase().trim() === vNameLower) {
        if (vArea && vArea.lineId && v.lineId) return v.lineId === vArea.lineId;
        return true;
      }
      return false;
    });
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
  } else if (currentUserRole === "product_manager") {
    const pmLineId = currentUser?.lineId || (currentUser?.lineIds && currentUser?.lineIds[0]);
    const lineUsers = allUsers.filter((u) => {
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return pmLineId ? uLineIds.includes(pmLineId) : false;
    });
    const lineUserIds = lineUsers.map((u) => u.id);
    lineUserIds.push(currentUser.id);

    const selectedRepFilter = document.getElementById("filterRep")?.value || "all";
    if (selectedRepFilter === "all") {
      list = list.filter(
        (v) => lineUserIds.includes(v.repId) || lineUserIds.includes(v.doubleWithUserId),
      );
    } else {
      list = list.filter(
        (v) =>
          (v.repId === selectedRepFilter || v.doubleWithUserId === selectedRepFilter) &&
          lineUserIds.includes(selectedRepFilter),
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

  // Filter visits strictly by the selected Product Line if specific line is selected
  const filterLineVal = document.getElementById("filterLine")?.value || "all";
  if (filterLineVal !== "all") {
    const scopedUserIds = window.getScopedTeamForLine
      ? window.getScopedTeamForLine(filterLineVal, currentUser).map((u) => u.id)
      : [];
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const allDocs = getMockDoctors();
    const allHosps = getMockHospitals();
    const allPharms = getMockPharmacies();

    list = list.filter((v) => {
      if (v.lineId) {
        return v.lineId === filterLineVal;
      }
      const target = allDocs.find((d) => d.id === v.doctorId) || allHosps.find((h) => h.id === v.doctorId) || allPharms.find((p) => p.id === v.doctorId);
      if (target && typeof doctorMatchesLine === "function") {
        return doctorMatchesLine(target, filterLineVal, allAreas);
      }
      if (v.areaId) {
        const a = allAreas.find((x) => x.id === v.areaId);
        if (a && a.lineId) return a.lineId === filterLineVal;
      }
      return !!(v.repId && scopedUserIds.includes(v.repId));
    });
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

    const timelinePicker = document.getElementById("timelineDatePicker");
    const activeTimelineDate =
      timelinePicker && timelinePicker.value && timelinePicker.value >= todayStr
        ? timelinePicker.value
        : todayStr;

    const bulkDateInput = document.getElementById("bulkPlanDate");
    if (bulkDateInput) {
      bulkDateInput.min = todayStr;
      bulkDateInput.value = activeTimelineDate;
      if (!bulkDateInput.dataset.boundChange) {
        bulkDateInput.dataset.boundChange = "true";
        bulkDateInput.addEventListener("change", () => {
          visitsApp.renderBulkTargetsList();
        });
      }
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
          (d.areaId && repAreaIds.includes(d.areaId)) ||
          (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
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

    const activeLineId = document.getElementById("filterLine")?.value || "all";
    if (activeLineId !== "all") {
      sourceList = sourceList.filter((d) => doctorMatchesLine(d, activeLineId, allAreas));
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
        let matchName = item.area && item.area.toLowerCase().trim() === selectedAreaName;
        if (matchName && selectedAreaObj && selectedAreaObj.lineId) {
          matchName = doctorMatchesLine(item, selectedAreaObj.lineId, allAreas);
        }
        areaMatch = matchId || matchName;
      }

      return (nameMatch || specMatch || addrMatch) && classMatch && areaMatch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="bulk-targets-empty">No matching targets found.</div>`;
      this.updateBulkCounter();
      return;
    }

    const planDateInput = document.getElementById("bulkPlanDate");
    const currentPlanDate = (planDateInput && planDateInput.value) || todayStr;
    const targetRepId = (currentUser && currentUser.id) || "rep1";
    const isAr = isSysAr();

    filtered.forEach((target) => {
      let targetArea = target.area;
      if (!targetArea && target.areaId) {
        const fa = allAreas.find((a) => a.id === target.areaId);
        if (fa) targetArea = fa.name;
      }
      const areaBadge = targetArea
        ? `<span class="badge bulk-target-area-badge">📍 ${window.escapeHtml(targetArea)}</span>`
        : "";

      const isAlready = isDoctorAlreadyVisitedToday(target.id, currentPlanDate, targetRepId);
      const scheduledBadge = isAlready
        ? `<span class="badge bulk-target-already-badge">✓ ${isAr ? "مجدول بالفعل" : "Already Scheduled"}</span>`
        : "";

      const itemDiv = document.createElement("label");
      itemDiv.className = `bulk-target-item${isAlready ? " bulk-target-already-scheduled" : ""}`;
      itemDiv.innerHTML = `
        <input type="checkbox" class="bulk-target-cb" value="${target.id}" data-name="${target.name}" ${isAlready ? "disabled" : 'onchange="visitsApp.updateBulkCounter()"'} title="${isAlready ? (isAr ? 'مجدول بالفعل في هذا اليوم' : 'Already scheduled today') : ''}">
        <div class="bulk-target-info">
          <div class="bulk-target-name">${target.name}${areaBadge}${scheduledBadge}</div>
          <div class="bulk-target-meta">
            ${isHospital ? target.address || "Hospital" : `${target.specialty || "General"} • Class ${target.class || "A"}`}
          </div>
        </div>
        <span class="badge ${isHospital ? "bulk-target-badge-hosp" : "bulk-target-badge-class"}">
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
    document.querySelectorAll(".bulk-target-cb:not(:disabled)").forEach((cb) => {
      cb.checked = isChecked;
    });
    this.updateBulkCounter();
  },

  updateBulkCounter() {
    const allCheckboxes = document.querySelectorAll(".bulk-target-cb:not(:disabled)");
    const checkedBoxes = document.querySelectorAll(".bulk-target-cb:checked:not(:disabled)");
    const counterEl = document.getElementById("bulkSelectionCounter");
    const saveBtn = document.getElementById("btnSaveBulkPlan");
    const selectAllCb = document.getElementById("bulkSelectAllToggle");
    const isAr = isSysAr();

    const count = checkedBoxes.length;
    if (counterEl) {
      counterEl.textContent = isAr ? `المحدد: ${count} أهداف` : `Selected: ${count} Targets`;
    }
    if (saveBtn) {
      saveBtn.textContent =
        count > 0
          ? (isAr ? `حفظ ${count} زيارة مخططة` : `Save ${count} Planned Visits`)
          : (isAr ? "حفظ الزيارات المخططة" : "Save Planned Visits");
    }
    if (selectAllCb && allCheckboxes.length > 0) {
      selectAllCb.checked = checkedBoxes.length === allCheckboxes.length;
    }
  },

  saveBulkPlanVisits() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const saveBtn = document.getElementById("btnSaveBulkPlan");
    const originalBtnText = saveBtn ? saveBtn.textContent : "";
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = lang === "ar" ? "جاري الحفظ... ⏳" : "Saving... ⏳";
    }

    const resetSaveBtn = () => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText || (lang === "ar" ? "حفظ الزيارات المخططة" : "Save Planned Visits");
      }
    };

    const checkedBoxes = Array.from(
      document.querySelectorAll(".bulk-target-cb:checked"),
    );
    if (checkedBoxes.length === 0) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "يرجى اختيار طبيب أو مستشفى واحد على الأقل."
        : "Please select at least one doctor or hospital.";
      showToast(msg, "warning");
      return;
    }

    const planDate = document.getElementById("bulkPlanDate").value || todayStr;
    if (planDate < todayStr) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "لا يمكن جدولة خطة في تاريخ سابق. يرجى اختيار تاريخ اليوم أو تاريخ مستقبلي."
        : "Cannot plan visits in the past. Please select today or a future date.";
      showToast(msg, "warning");
      return;
    }

    const targetRepId = currentUser.id || "rep1";
    const dateCheck = checkVisitDateAllowed(planDate, targetRepId, lang);
    if (!dateCheck.allowed) {
      resetSaveBtn();
      showToast(dateCheck.message, "warning");
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
      if (isDoctorAlreadyVisitedToday(targetId, planDate, targetRepId)) {
        duplicateTargets.push(targetName);
      } else {
        validBoxes.push(cb);
      }
    });

    if (duplicateTargets.length > 0 && validBoxes.length === 0) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? `الأهداف المحددة مسجلة بالفعل في هذا اليوم: (${duplicateTargets.join("، ")}). لا يمكن تكرار الزيارة لنفس الطبيب مرتين في نفس اليوم.`
        : `Selected targets are already scheduled/visited today: (${duplicateTargets.join(", ")}). Duplicate visits on the same day are not permitted.`;
      showToast(msg, "warning");
      return;
    }

    // 2. Minimum PM visits check: provide a helpful reminder without blocking planning
    let pmReminder = "";
    if (period.toLowerCase() === "pm") {
      const exemption = isWorkdayExemptFromMinVisits(planDate, targetRepId);
      if (!exemption.exempt) {
        const companySettings = (window.store && window.store.companySettings)
          ? window.store.companySettings.get()
          : { minPmVisitsPerDay: 4 };
        const minPmRequired = (companySettings && companySettings.minPmVisitsPerDay) || 4;

        const existingPmCount = demoVisits.filter(
          (v) =>
            v.repId === targetRepId &&
            v.date === planDate &&
            (v.period || "").toLowerCase() === "pm" &&
            v.targetType !== "pharmacy" &&
            !(v.doctorId && String(v.doctorId).startsWith("pharm")) &&
            v.status !== "rejected",
        ).length;
        const totalPm = existingPmCount + validBoxes.length;
        if (totalPm < minPmRequired) {
          pmReminder = lang === "ar"
            ? ` (تذكير: مستهدف اليوم ${minPmRequired} زيارات مسائية، تم تخطيط ${totalPm} حتى الآن)`
            : ` (Note: Daily target is ${minPmRequired} PM visits, ${totalPm} planned so far)`;
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

    const allDocs = getMockDoctors();
    const allHosps = getMockHospitals();
    const repLines = typeof window.getUserLines === "function" ? window.getUserLines(targetRepId) : [];
    const repFallbackLineId = repLines.length > 0 ? repLines[0].id : undefined;

    getLiveVisits();
    validBoxes.forEach((cb, index) => {
      const targetId = cb.value;
      const targetName = cb.getAttribute("data-name") || "Doctor";
      const assignedTime = defaultTimes[index % defaultTimes.length];

      const targetDoc = allDocs.find((d) => d.id === targetId) || allHosps.find((h) => h.id === targetId);
      const visitLineId = (targetDoc && targetDoc.lineId) || repFallbackLineId;

      const planUniqueId = "plan_" + Date.now() + "_" + index;
      const newVisit = {
        id: "v_bulk_" + Date.now() + "_" + index,
        planId: planUniqueId,
        repId: targetRepId,
        lineId: visitLineId,
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
        insertionDate: todayStr,
        insertionTime: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
        entryDate: todayStr,
      };

      demoVisits.unshift(newVisit);
    });

    persistVisits();
    resetSaveBtn();
    this.closeBulkPlanModal();

    // Switch the timeline date to the planned date so user immediately sees their newly scheduled visits
    const datePicker = document.getElementById("timelineDatePicker");
    if (datePicker && planDate) {
      datePicker.value = planDate;
      try {
        sessionStorage.setItem("pharma_timeline_selected_date", planDate);
      } catch (e) {}
    }
    renderVisits(true);

    let successMsg =
      lang === "ar"
        ? `✓ تم حفظ ${validBoxes.length} زيارة مخطط لها بنجاح وإرسالها للاعتماد!`
        : `✓ Successfully saved ${validBoxes.length} planned visit(s) for manager approval!`;

    if (pmReminder) {
      successMsg += pmReminder;
    }

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
  return window.formatVisitDateTime
    ? window.formatVisitDateTime(dateStr, timeStr, lang)
    : { dayName: "", date: dateStr || "", time: timeStr || "10:00", displayWithDay: dateStr || "", dayAndTime: timeStr || "" };
}

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
    datePicker.value = typeof todayStr !== "undefined" && todayStr ? todayStr : "";
  }
  const selectedDate = (datePicker && datePicker.value) ? datePicker.value : (typeof todayStr !== "undefined" ? todayStr : "");

  if (!triggeredByShow && !hasLoadedTimelineOnce) {
    if (summaryBar) summaryBar.innerHTML = "";
    container.innerHTML = `
      <div class="timeline-prompt-card">
        <div class="timeline-prompt-card-icon">🔍</div>
        <h4 class="timeline-prompt-title" data-i18n="promptSelectDateAndShow">
          ${trans.promptSelectDateAndShow || 'Select a date and click "Show" to view visits'}
        </h4>
        <p class="timeline-prompt-sub" data-i18n="promptSelectDateSub">
          ${trans.promptSelectDateSub || "Choose your desired date and filters above, then click the Show button to load the daily visits timeline."}
        </p>
        <button type="button" class="btn btn-primary timeline-show-btn" onclick="renderVisitsTimeline(true)">
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
      targetActUserIds = allUsers.map((u) => u.id);
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
    const isMgr = Boolean(isManager);
    summaryBar.className = `timeline-summary-bar ${isMgr ? "is-manager" : "is-rep"}`;
    const cleanLabel = (s) => (s ? String(s).replace(/:$/, "").trim() : "");
    summaryBar.innerHTML = `
      <div class="timeline-stat-chip">
        <strong class="stat-value stat-value-primary">${totalItems}</strong>
        <span class="stat-label">${cleanLabel(trans.totalEventsToday)}</span>
      </div>
      <div class="timeline-stat-chip">
        <strong class="stat-value stat-value-actual">${actualCount}</strong>
        <span class="stat-label">
          <span class="legend-dot actual legend-dot-sm"></span>
          ${cleanLabel(trans.actualActivities)}
        </span>
      </div>
      <div class="timeline-stat-chip">
        <strong class="stat-value stat-value-planned">${plannedCount}</strong>
        <span class="stat-label">
          <span class="legend-dot planned legend-dot-sm"></span>
          ${cleanLabel(trans.fromPlanStat)}
        </span>
      </div>
      ${
        isMgr
          ? `
      <div class="timeline-stat-chip">
        <strong class="stat-value stat-value-joint">${jointCount}</strong>
        <span class="stat-label">
          <span class="legend-dot joint legend-dot-sm"></span>
          ${cleanLabel(trans.jointVisitsCount)}
        </span>
      </div>`
          : ""
      }
    `;
  }

  if (combined.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty-card timeline-empty-card-wrapper">
        <span class="timeline-empty-icon">📅</span>
        <h4 class="timeline-target-title timeline-empty-title">${trans.noTimelineEvents}</h4>
        <p class="timeline-meta-row timeline-empty-sub">${trans.selectAnotherDate}</p>
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
      accompanimentNote = ` • <span class="accompaniment-note-joint">🤝 ${lang === "ar" ? "نزول مشترك مع:" : "Co-visiting with:"} ${window.escapeHtml(partnerName)}</span>`;
    } else if (repUser && repUser.role === "district_manager") {
      accompanimentNote = ` • <span class="accompaniment-note-mgr">👔 ${trans.supervisoryVisit}</span>`;
    } else if (repUser && repUser.role === "line_manager") {
      accompanimentNote = ` • <span class="accompaniment-note-mgr">👔 ${lang === "ar" ? "زيارة إشرافية (LM)" : "Supervisory Visit (LM)"}</span>`;
    } else if (v.repId === currentUser.id && isManager) {
      accompanimentNote = ` • <span class="accompaniment-note-mgr">👔 ${trans.supervisoryVisit}</span>`;
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
        <span class="timeline-period-label">${periodDisplay}</span>
        <div class="timeline-icon-dot ${dotClass}"></div>
      </div>
      <div class="timeline-content-box ${borderClass}">
        <div class="timeline-card-header">
          <strong class="timeline-target-title">${window.escapeHtml(v.doctorName)}</strong>
          <div class="timeline-card-badges">
            ${renderGpsBadge(v, lang)}
            <span class="visit-badge-pill ${badgeClass}">${badgeLabel}</span>
          </div>
        </div>
        <div class="timeline-meta-row">
          <span>${window.escapeHtml(specialtyText)}</span> • <span>Class: <strong>${window.escapeHtml(classText)}</strong></span>${targetArea ? ` • <span class="badge bg-secondary bg-opacity-10 text-secondary timeline-target-area-badge">${window.escapeHtml(targetArea)}</span>` : ""} • <span>${repRoleLabel}: <strong>${window.escapeHtml(repDisplayName)}</strong></span>${accompanimentNote}
        </div>
        ${
          (() => {
            const cardProds = window.getVisitDisplayProducts ? window.getVisitDisplayProducts(v) : (v.products || []);
            return cardProds.length > 0
              ? `<div class="timeline-products-row"><strong>${lang === "ar" ? "المنتجات:" : "Products:"}</strong> ${cardProds.map((p) => window.escapeHtml(p)).join(", ")}</div>`
              : "";
          })()
        }
        ${
          v.giveawaySamples
            ? `<div class="timeline-samples-row"><strong>${lang === "ar" ? "عينات ومواد دعائية:" : "Giveaway Samples:"}</strong> ${window.escapeHtml(v.giveawaySamples)}</div>`
            : ""
        }
        ${
          v.comment
            ? `<div class="timeline-comment-text">"${window.escapeHtml(v.comment)}"</div>`
            : ""
        }
        ${
          v.status === "missed" && v.missedReason
            ? `<div class="timeline-missed-reason"><strong>${lang === "ar" ? "سبب تعذر المقابلة:" : "Missed Reason:"}</strong> "${window.escapeHtml(v.missedReason)}"</div>`
            : ""
        }
        ${
          v.lastRescheduleReason
            ? `<div class="timeline-rescheduled-reason"><strong>${lang === "ar" ? "مؤجلة سابقاً بسبب:" : "Rescheduled Reason:"}</strong> "${window.escapeHtml(v.lastRescheduleReason)}"</div>`
            : ""
        }
        ${(() => {
          const insDate = v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date);
          const insTime = v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || "10:00"));
          return `
            <div class="timeline-timestamp-chip" style="display: flex; gap: 8px 14px; flex-wrap: wrap; align-items: center;">
              <span><strong>📅 ${lang === "ar" ? "يوم الزيارة:" : "Visit Day:"}</strong> ${v.date} ${periodDisplay}</span>
              <span><strong>⏰ ${lang === "ar" ? "وقت الزيارة:" : "Visit Time:"}</strong> ${v.time || "10:00"}</span>
              <span style="opacity: 0.95; border-inline-start: 1px solid currentColor; padding-inline-start: 10px;">
                <strong>📥 ${lang === "ar" ? "تاريخ الإدخال:" : "Insertion Date:"}</strong> ${insDate}
                • <strong>${lang === "ar" ? "الوقت:" : "Time:"}</strong> ${insTime}
              </span>
            </div>
          `;
        })()}
        ${
          !isActivity &&
          v.status === "planned" &&
          (!isManager || v.repId === currentUser.id)
            ? `
          <div class="timeline-card-actions">
            <button type="button" class="btn btn-primary btn-timeline-complete" onclick="openCompleteModal('${v.id}')">
              ✓ ${trans.btnComplete}
            </button>
            <button type="button" class="btn btn-timeline-reschedule" onclick="openRescheduleModal('${v.id}')">
              🗓️ ${lang === "ar" ? "تأجيل الزيارة" : "Reschedule"}
            </button>
            ${
              canDeleteVisit(v)
                ? `<button type="button" class="btn-outline-danger btn-timeline-danger" onclick="confirmDeleteVisit('${v.id}')">🗑️ ${trans.btnDelete}</button>`
                : ""
            }
          </div>
        `
            : !isActivity && canDeleteVisit(v)
              ? `
          <div class="timeline-card-actions">
            <button type="button" class="btn-outline-danger btn-timeline-danger" onclick="confirmDeleteVisit('${v.id}')">🗑️ ${trans.btnDelete}</button>
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

function populateVisitProducts(selectedProducts = [], targetRepId = null) {
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

  const filterRep = document.getElementById("filterRep");
  const effectiveRepId = targetRepId ||
    (currentEditVisitId && window.store && window.store.visits ? window.store.visits.getById(currentEditVisitId)?.repId : null) ||
    (filterRep && filterRep.value && filterRep.value !== "all" && !filterRep.value.startsWith("vacant:") ? filterRep.value : null) ||
    currentUser?.id;

  let linesToShow = allLines;
  const repLines = (effectiveRepId && typeof window.getUserLines === "function")
    ? window.getUserLines(effectiveRepId)
    : [];

  if (repLines.length > 0) {
    const allowedLineIds = repLines.map((l) => l.id);
    linesToShow = allLines.filter((l) => allowedLineIds.includes(l.id));
  } else if (currentUser && role !== "admin") {
    const userLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
    if (userLines.length > 0) {
      linesToShow = userLines;
    } else if (["business_unit", "line_manager", "district_manager", "medical_rep", "rep"].includes(role)) {
      linesToShow = [];
    }
  }

  const activeLineId = document.getElementById("filterLine")?.value || "all";
  if (activeLineId !== "all") {
    linesToShow = linesToShow.filter((l) => l.id === activeLineId);
  }

  let productsToShow = [];
  linesToShow.forEach((line) => {
    if (line.products) productsToShow.push(...line.products);
  });

  if (productsToShow.length === 0) {
    container.innerHTML =
      '<span class="products-empty-msg">No products available. Add some in the Products page.</span>';
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

  if (role === "product_manager") {
    // Product Manager double visits: LMs, DMs, and BU of the PM's line
    const pmLineId = currentUserObj?.lineId || (currentUserObj?.lineIds && currentUserObj?.lineIds[0]);
    const lmsInLine = users.filter((u) => {
      if (u.role !== "line_manager") return false;
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return pmLineId ? uLineIds.includes(pmLineId) : true;
    });
    const buManagerIds = lmsInLine.map((lm) => lm.managerId).filter(Boolean);

    candidates = users.filter((u) => {
      if (u.id === currentUser.id || u.status === "Inactive") return false;
      const uRole = u.role;
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      const matchesLine = pmLineId ? uLineIds.includes(pmLineId) : true;

      if (uRole === "line_manager" || uRole === "district_manager" || uRole === "medical_rep" || uRole === "rep") {
        return matchesLine;
      }
      if (uRole === "business_unit") {
        return matchesLine || buManagerIds.includes(u.id);
      }
      return false;
    });
  } else if (role === "business_unit") {
    candidates = users.filter(
      (u) =>
        u.id !== currentUser.id &&
        u.id !== effectiveId &&
        u.status !== "Inactive" &&
        (u.role === "line_manager" || u.role === "district_manager" || u.role === "product_manager"),
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
    const lmLineId = currentUserObj?.lineId || (currentUserObj?.lineIds && currentUserObj?.lineIds[0]);
    const linePMs = users.filter((u) => {
      if (u.status === "Inactive" || u.role !== "product_manager" || u.id === currentUser.id) return false;
      const pmLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return lmLineId && pmLineIds.length > 0 ? pmLineIds.includes(lmLineId) : true;
    });
    candidates = [...dms, ...higherManagers, ...linePMs].filter(
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
    const dmLineId = currentUserObj?.lineId || (currentUserObj?.lineIds && currentUserObj?.lineIds[0]);
    const linePMs = users.filter((u) => {
      if (u.status === "Inactive" || u.role !== "product_manager" || u.id === currentUser.id) return false;
      const pmLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return dmLineId && pmLineIds.length > 0 ? pmLineIds.includes(dmLineId) : true;
    });
    candidates = [...myReps, ...chain, ...linePMs].filter(
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
    const repLineId = currentUserObj?.lineId || (currentUserObj?.lineIds && currentUserObj?.lineIds[0]);
    const linePMs = users.filter((u) => {
      if (u.status === "Inactive" || u.role !== "product_manager" || u.id === currentUser.id || u.id === effectiveId) return false;
      const pmLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return repLineId && pmLineIds.length > 0 ? pmLineIds.includes(repLineId) : true;
    });
    candidates = [...chain, ...linePMs].filter(
      (u, idx, arr) =>
        u.status !== "Inactive" &&
        u.id !== effectiveId &&
        u.id !== currentUser.id &&
        u.role !== "admin" &&
        u.role !== "hr" &&
        arr.findIndex((x) => x.id === u.id) === idx,
    );
  }

  if (candidates.length === 0) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    container.innerHTML = `<span class="candidates-empty-msg">${lang === "ar" ? "لا يوجد زملاء أو مدراء متاحين للاختيار" : "No colleagues or managers available for companion selection."}</span>`;
    return;
  }

  const roleTags = {
    district_manager: "DM",
    line_manager: "LM",
    business_unit: "BU",
    medical_rep: "Rep",
    rep: "Rep",
    product_manager: "PM",
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

  // 1. Immediately open modal so user gets instant visual response
  const modal = document.getElementById("visitModal");
  if (modal) {
    modal.dataset.source = isActual ? "actual" : "plan";
    modal.classList.add("active");
    modal.style.display = "flex";
  }

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
  try {
    updateVisitModalDayDisplay();
  } catch (e) {}

  const insertionMeta = document.getElementById("visitInsertionMetaContainer");
  const insDateEl = document.getElementById("visitInsertionDateDisplay");
  const insTimeEl = document.getElementById("visitInsertionTimeDisplay");
  if (insertionMeta) {
    insertionMeta.style.display = "block";
    const curDate = now.toISOString().slice(0, 10);
    const curTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (insDateEl) insDateEl.innerText = `${curDate} (${lang === "ar" ? "تلقائي عند الحفظ" : "Auto on Save"})`;
    if (insTimeEl) insTimeEl.innerText = `${curTime} (${lang === "ar" ? "تلقائي عند الحفظ" : "Auto on Save"})`;
  }

  const commentEl = document.getElementById("visitComment");
  if (commentEl) commentEl.value = "";
  const samplesInput = document.getElementById("visitGiveawaySamples");
  if (samplesInput) samplesInput.value = "";
  document
    .querySelectorAll('#visitProducts input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  const singleRadio = document.querySelector(
    'input[name="visitType"][value="single"]',
  );
  if (singleRadio) singleRadio.checked = true;
  try {
    toggleDoubleVisit();
  } catch (e) {}

  const radioPharm = document.getElementById("radioPharmacyLabel");
  if (radioPharm) {
    radioPharm.style.display = "inline-flex";
  }

  const pmRadio = document.querySelector(
    'input[name="visitPeriod"][value="pm"]',
  );
  if (pmRadio) pmRadio.checked = true;

  const filterRep = document.getElementById("filterRep");
  const repScope = (filterRep && filterRep.value && filterRep.value !== "all" && !filterRep.value.startsWith("vacant:")) ? filterRep.value : currentUser.id;

  try {
    populateVisitProducts([], repScope);
  } catch (e) {
    console.error("Error populating visit products:", e);
  }
  try {
    populateVisitCompanions(repScope, []);
  } catch (e) {
    console.error("Error populating visit companions:", e);
  }

  try {
    setupModalTargetFilter();
  } catch (e) {
    console.error("Error in setupModalTargetFilter:", e);
  }
  try {
    updateTargetOptions();
  } catch (e) {
    console.error("Error in updateTargetOptions:", e);
  }

  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };
  const isGpsActive = !!companySettings.requireGpsValidation;

  const gpsSec = document.getElementById("visitGpsSection");
  if (gpsSec) {
    gpsSec.style.display = (isActual && isGpsActive) ? "block" : "none";
    if (isActual && isGpsActive) {
      try {
        triggerManualGpsCheck();
      } catch (e) {}
    }
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
    "product_manager",
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

  const activeLineId = document.getElementById("filterLine")?.value || "all";

  if (role === "district_manager") {
    if (filterLabel) {
      filterLabel.textContent = isAr
        ? "تصفية الأطباء حسب المندوب:"
        : "Filter Doctors by Medical Rep:";
    }
    allOpt.textContent = isAr ? "👥 جميع أطباء فريقي" : "👥 All My Team Doctors";
    filterSelect.appendChild(allOpt);

    let myReps = allUsers.filter(
      (u) =>
        u.managerId === currentUser.id &&
        u.role === "medical_rep" &&
        u.status !== "Inactive",
    );
    if (activeLineId !== "all") {
      myReps = myReps.filter((r) => {
        const rLines = window.getUserLines ? window.getUserLines(r.id) : [];
        return rLines.some((l) => l.id === activeLineId);
      });
    }
    myReps.forEach((rep) => {
      const opt = document.createElement("option");
      opt.value = rep.id;
      const repName = isAr && rep.nameAr ? rep.nameAr : rep.name;
      opt.textContent = `👤 ${repName}`;
      filterSelect.appendChild(opt);
    });

    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const mgrLines = window.getUserLines ? window.getUserLines(currentUser.id) : [];
    const mgrLineIds = mgrLines.map((l) => l.id);
    let dmVacant = allAreas.filter((a) => !a.repId);
    if (activeLineId !== "all") {
      dmVacant = dmVacant.filter((a) => a.lineId === activeLineId);
    } else if (mgrLineIds.length > 0) {
      dmVacant = dmVacant.filter((a) => !a.lineId || mgrLineIds.includes(a.lineId));
    }
    const myVacantAreas = dmVacant.filter((a) => {
      const mgrId = typeof getAreaManagerId === "function" ? getAreaManagerId(a, allUsers) : null;
      return mgrId === currentUser.id || (!mgrId && (!a.lineId || mgrLineIds.includes(a.lineId)));
    });
    myVacantAreas.forEach((va) => {
      const opt = document.createElement("option");
      opt.value = `vacant:${va.id}`;
      const vaName = isAr && va.nameAr ? va.nameAr : va.name;
      opt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${vaName}${va.code ? ' (' + va.code + ')' : ''}`;
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

    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const mgrLines = window.getUserLines ? window.getUserLines(currentUser.id) : [];
    const mgrLineIds = mgrLines.map((l) => l.id);
    let lmVacant = allAreas.filter((a) => !a.repId);
    if (activeLineId !== "all") {
      lmVacant = lmVacant.filter((a) => a.lineId === activeLineId);
    } else if (mgrLineIds.length > 0) {
      lmVacant = lmVacant.filter((a) => !a.lineId || mgrLineIds.includes(a.lineId));
    }

    let myDms = allUsers.filter(
      (u) =>
        u.managerId === currentUser.id &&
        u.role === "district_manager" &&
        u.status !== "Inactive",
    );
    if (activeLineId !== "all") {
      myDms = myDms.filter((dm) => {
        const dmLines = window.getUserLines ? window.getUserLines(dm.id) : [];
        if (dmLines.some((l) => l.id === activeLineId)) return true;
        const dmReps = allUsers.filter((u) => u.managerId === dm.id);
        return dmReps.some((r) => {
          const rLines = window.getUserLines ? window.getUserLines(r.id) : [];
          return rLines.some((l) => l.id === activeLineId);
        });
      });
    }
    const assignedVacant = new Set();
    myDms.forEach((dm) => {
      const dmName = isAr && dm.nameAr ? dm.nameAr : dm.name;
      const opt = document.createElement("option");
      opt.value = `dm:${dm.id}`;
      opt.textContent = `👔 ${dmName} (DM)`;
      filterSelect.appendChild(opt);

      let dmReps = allUsers.filter(
        (u) =>
          u.managerId === dm.id &&
          u.role === "medical_rep" &&
          u.status !== "Inactive",
      );
      if (activeLineId !== "all") {
        dmReps = dmReps.filter((r) => {
          const rLines = window.getUserLines ? window.getUserLines(r.id) : [];
          return rLines.some((l) => l.id === activeLineId);
        });
      }
      dmReps.forEach((rep) => {
        const repName = isAr && rep.nameAr ? rep.nameAr : rep.name;
        const repOpt = document.createElement("option");
        repOpt.value = `rep:${rep.id}`;
        repOpt.textContent = `　↳ 👤 ${repName}`;
        filterSelect.appendChild(repOpt);
      });

      const dmVacant = lmVacant.filter((a) => {
        const mgrId = typeof getAreaManagerId === "function" ? getAreaManagerId(a, allUsers) : null;
        return mgrId === dm.id;
      });
      dmVacant.forEach((va) => {
        assignedVacant.add(va.id);
        const vaName = isAr && va.nameAr ? va.nameAr : va.name;
        const vaOpt = document.createElement("option");
        vaOpt.value = `vacant:${va.id}`;
        vaOpt.textContent = `　↳ 📍 [${isAr ? "شاغرة" : "Vacant"}] ${vaName}${va.code ? ' (' + va.code + ')' : ''}`;
        filterSelect.appendChild(vaOpt);
      });
    });

    const unassignedVacant = lmVacant.filter((a) => !assignedVacant.has(a.id));
    unassignedVacant.forEach((va) => {
      const opt = document.createElement("option");
      opt.value = `vacant:${va.id}`;
      const vaName = isAr && va.nameAr ? va.nameAr : va.name;
      opt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${vaName}${va.code ? ' (' + va.code + ')' : ''}`;
      filterSelect.appendChild(opt);
    });
  } else if (role === "business_unit" || role === "admin") {
    if (filterLabel) {
      filterLabel.textContent = isAr
        ? "تصفية الأطباء بالمدير (LM / DM):"
        : "Filter Doctors by Manager (LM / DM):";
    }
    allOpt.textContent = isAr ? "👥 جميع الأطباء" : "👥 All Doctors";
    filterSelect.appendChild(allOpt);

    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    let buVacant = allAreas.filter((a) => !a.repId);
    if (activeLineId !== "all") {
      buVacant = buVacant.filter((a) => a.lineId === activeLineId);
    } else if (role !== "admin") {
      const mgrLines = window.getUserLines ? window.getUserLines(currentUser.id) : [];
      const mgrLineIds = mgrLines.map((l) => l.id);
      if (mgrLineIds.length > 0) {
        buVacant = buVacant.filter((a) => !a.lineId || mgrLineIds.includes(a.lineId));
      }
    }

    let lms =
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
    if (activeLineId !== "all") {
      lms = lms.filter((lm) => {
        const lmLines = window.getUserLines ? window.getUserLines(lm.id) : [];
        if (lmLines.some((l) => l.id === activeLineId)) return true;
        const downstream = window.getAllSubordinates ? window.getAllSubordinates(lm.id) : [];
        return downstream.some((sub) => {
          const sLines = window.getUserLines ? window.getUserLines(sub.id) : [];
          return sLines.some((l) => l.id === activeLineId);
        });
      });
    }

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
    let dms =
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
    if (activeLineId !== "all") {
      dms = dms.filter((dm) => {
        const dmLines = window.getUserLines ? window.getUserLines(dm.id) : [];
        if (dmLines.some((l) => l.id === activeLineId)) return true;
        const dmReps = allUsers.filter((u) => u.managerId === dm.id);
        return dmReps.some((r) => {
          const rLines = window.getUserLines ? window.getUserLines(r.id) : [];
          return rLines.some((l) => l.id === activeLineId);
        });
      });
    }

    const assignedVacant = new Set();
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

        const dmVacant = buVacant.filter((a) => {
          const mgrId = typeof getAreaManagerId === "function" ? getAreaManagerId(a, allUsers) : null;
          return mgrId === dm.id;
        });
        dmVacant.forEach((va) => {
          assignedVacant.add(va.id);
          const vaName = isAr && va.nameAr ? va.nameAr : va.name;
          const vaOpt = document.createElement("option");
          vaOpt.value = `vacant:${va.id}`;
          vaOpt.textContent = `　↳ 📍 [${isAr ? "شاغرة" : "Vacant"}] ${vaName}${va.code ? ' (' + va.code + ')' : ''}`;
          dmGrp.appendChild(vaOpt);
        });
      });
      filterSelect.appendChild(dmGrp);
    }

    const unassignedVacant = buVacant.filter((a) => !assignedVacant.has(a.id));
    if (unassignedVacant.length > 0) {
      const vaGrp = document.createElement("optgroup");
      vaGrp.label = isAr ? "مناطق شاغرة أخرى" : "Other Vacant Areas";
      unassignedVacant.forEach((va) => {
        const vaName = isAr && va.nameAr ? va.nameAr : va.name;
        const vaOpt = document.createElement("option");
        vaOpt.value = `vacant:${va.id}`;
        vaOpt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${vaName}${va.code ? ' (' + va.code + ')' : ''}`;
        vaGrp.appendChild(vaOpt);
      });
      filterSelect.appendChild(vaGrp);
    }
  } else if (role === "product_manager") {
    if (filterLabel) {
      filterLabel.textContent = isAr
        ? "تصفية الأهداف حسب عضو الفريق في الخط:"
        : "Filter Targets by Line Team Member:";
    }
    allOpt.textContent = isAr ? "👥 جميع أهداف الخط" : "👥 All Line Targets";
    filterSelect.appendChild(allOpt);

    const currentUserObj = allUsers.find((u) => u.id === currentUser.id);
    const pmLineIds = currentUserObj?.lineIds || (currentUserObj?.lineId ? [currentUserObj.lineId] : []);
    const effectiveLines = (activeLineId !== "all") ? [activeLineId] : pmLineIds;

    // 1. Line Managers in PM's line
    const lineLMs = allUsers.filter((u) => {
      if (u.status === "Inactive" || (u.role !== "line_manager" && u.role !== "lm")) return false;
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return effectiveLines.length > 0 ? uLines.some((l) => effectiveLines.includes(l)) : true;
    });
    if (lineLMs.length > 0) {
      const lmGrp = document.createElement("optgroup");
      lmGrp.label = isAr ? "مديرو الخطوط (Line Managers)" : "Line Managers (LMs)";
      lineLMs.forEach((lm) => {
        const lmName = isAr && lm.nameAr ? lm.nameAr : lm.name;
        const opt = document.createElement("option");
        opt.value = `lm:${lm.id}`;
        opt.textContent = `👔 ${lmName} (LM)`;
        lmGrp.appendChild(opt);
      });
      filterSelect.appendChild(lmGrp);
    }

    // 2. District Managers in PM's line
    const lineDMs = allUsers.filter((u) => {
      if (u.status === "Inactive" || (u.role !== "district_manager" && u.role !== "dm")) return false;
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return effectiveLines.length > 0 ? uLines.some((l) => effectiveLines.includes(l)) : true;
    });
    if (lineDMs.length > 0) {
      const dmGrp = document.createElement("optgroup");
      dmGrp.label = isAr ? "مديرو المناطق (District Managers)" : "District Managers (DMs)";
      lineDMs.forEach((dm) => {
        const dmName = isAr && dm.nameAr ? dm.nameAr : dm.name;
        const opt = document.createElement("option");
        opt.value = `dm:${dm.id}`;
        opt.textContent = `👔 ${dmName} (DM)`;
        dmGrp.appendChild(opt);
      });
      filterSelect.appendChild(dmGrp);
    }

    // 3. Medical Reps in PM's line
    const lineReps = allUsers.filter((u) => {
      if (u.status === "Inactive" || (u.role !== "medical_rep" && u.role !== "rep")) return false;
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return effectiveLines.length > 0 ? uLines.some((l) => effectiveLines.includes(l)) : true;
    });
    if (lineReps.length > 0) {
      const repGrp = document.createElement("optgroup");
      repGrp.label = isAr ? "المندوبون (Medical Reps)" : "Medical Reps";
      lineReps.forEach((rep) => {
        const repName = isAr && rep.nameAr ? rep.nameAr : rep.name;
        const opt = document.createElement("option");
        opt.value = `rep:${rep.id}`;
        opt.textContent = `👤 ${repName}`;
        repGrp.appendChild(opt);
      });
      filterSelect.appendChild(repGrp);
    }

    // 4. Vacant areas in PM's line
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    let pmVacant = allAreas.filter((a) => !a.repId);
    if (effectiveLines.length > 0) {
      pmVacant = pmVacant.filter((a) => !a.lineId || effectiveLines.includes(a.lineId));
    }
    if (pmVacant.length > 0) {
      const vaGrp = document.createElement("optgroup");
      vaGrp.label = isAr ? "مناطق شاغرة (Vacant Areas)" : "Vacant Areas";
      pmVacant.forEach((va) => {
        const vaName = isAr && va.nameAr ? va.nameAr : va.name;
        const vaOpt = document.createElement("option");
        vaOpt.value = `vacant:${va.id}`;
        vaOpt.textContent = `📍 [${isAr ? "شاغرة" : "Vacant"}] ${vaName}${va.code ? ' (' + va.code + ')' : ''}`;
        vaGrp.appendChild(vaOpt);
      });
      filterSelect.appendChild(vaGrp);
    }
  }
}

function doctorMatchesLine(d, lineId, allAreas) {
  if (!lineId || lineId === "all") return true;
  if (d.lineId) return d.lineId === lineId;
  if (Array.isArray(d.lineIds) && d.lineIds.length > 0) return d.lineIds.includes(lineId);
  if (d.areaId && allAreas) {
    const a = allAreas.find((x) => x.id === d.areaId);
    if (a && a.lineId) return a.lineId === lineId;
  }
  if (d.repId) {
    const repLines = window.getUserLines ? window.getUserLines(d.repId) : [];
    if (repLines.some((l) => l.id === lineId)) return true;
  }
  return false;
}
window.doctorMatchesLine = doctorMatchesLine;

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
    "product_manager",
    "admin",
  ].includes(role);

  if (filterContainer) {
    filterContainer.style.display = isManager ? "block" : "none";
  }

  const allUsers =
    (window.store && window.store.users
      ? window.store.users.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  let allowedRepIds = [currentUser.id];
  if (role === "admin" || role === "hr") {
    allowedRepIds = null;
  } else if (role === "product_manager") {
    const currentUserObj = allUsers.find((u) => u.id === currentUser.id);
    const pmLineIds = currentUserObj?.lineIds || (currentUserObj?.lineId ? [currentUserObj.lineId] : []);
    const lineUsers = allUsers.filter((u) => {
      const uLines = u.lineIds || (u.lineId ? [u.lineId] : []);
      return pmLineIds.length > 0 ? uLines.some((l) => pmLineIds.includes(l)) : true;
    });
    allowedRepIds = [currentUser.id, ...lineUsers.map((u) => u.id)];
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
  const selectedFilter = filterSelect ? filterSelect.value : "all";
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  if (period.toLowerCase() === "am") {
    const allHosps = getMockHospitals();
    if (targetLabel) targetLabel.textContent = isAr ? "المستشفى" : "Hospital";
    if (selectedFilter && selectedFilter.startsWith("vacant:")) {
      const vAreaId = selectedFilter.split(":")[1];
      const vArea = allAreas.find((a) => a.id === vAreaId);
      const vNameLower = vArea && vArea.name ? vArea.name.toLowerCase().trim() : null;
      options = allHosps.filter((h) => {
        let matchesArea = false;
        if (h.areaId) {
          matchesArea = h.areaId === vAreaId;
        } else if (vNameLower && h.area && h.area.toLowerCase().trim() === vNameLower) {
          matchesArea = true;
        }
        if (!matchesArea) return false;
        if (vArea && vArea.lineId) {
          return doctorMatchesLine(h, vArea.lineId, allAreas);
        }
        return true;
      });
    } else if (role === "product_manager") {
      const currentUserObj = allUsers.find((u) => u.id === currentUser.id);
      const pmLineIds = currentUserObj?.lineIds || (currentUserObj?.lineId ? [currentUserObj.lineId] : []);
      if (selectedFilter && selectedFilter.startsWith("rep:")) {
        const repId = selectedFilter.split(":")[1];
        options = allHosps.filter((h) => h.repId === repId);
      } else if (selectedFilter && selectedFilter.startsWith("dm:")) {
        const dmId = selectedFilter.split(":")[1];
        const dmReps = allUsers.filter((u) => u.managerId === dmId).map((u) => u.id);
        const allowed = [dmId, ...dmReps];
        options = allHosps.filter((h) => allowed.includes(h.repId));
      } else if (selectedFilter && selectedFilter.startsWith("lm:")) {
        const lmId = selectedFilter.split(":")[1];
        const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(lmId) : [];
        const allowed = [lmId, ...downstream.map((u) => u.id)];
        options = allHosps.filter((h) => allowed.includes(h.repId));
      } else {
        options = allHosps.filter((h) => pmLineIds.length === 0 || pmLineIds.some((lId) => doctorMatchesLine(h, lId, allAreas)));
        if (options.length === 0 && allHosps.length > 0) options = allHosps;
      }
    } else if (!isManager) {
      const repAreas =
        window.store && window.store.areas
          ? window.store.areas.getByRep(currentUser.id)
          : [];
      const repAreaIds = repAreas.map((a) => a.id);
      options = allHosps.filter(
        (h) => (h.areaId && repAreaIds.includes(h.areaId))
      );
    } else if (allowedRepIds) {
      options = allHosps.filter((h) => allowedRepIds.includes(h.repId));
    } else {
      options = allHosps;
    }
  } else if (period.toLowerCase() === "pharmacy") {
    const allPharms = getMockPharmacies();
    if (targetLabel) targetLabel.textContent = isAr ? "الصيدلية" : "Pharmacy";
    if (selectedFilter && selectedFilter.startsWith("vacant:")) {
      const vAreaId = selectedFilter.split(":")[1];
      const vArea = allAreas.find((a) => a.id === vAreaId);
      const vNameLower = vArea && vArea.name ? vArea.name.toLowerCase().trim() : null;
      options = allPharms.filter((p) => {
        let matchesArea = false;
        if (p.areaId) {
          matchesArea = p.areaId === vAreaId;
        } else if (vNameLower && p.area && p.area.toLowerCase().trim() === vNameLower) {
          matchesArea = true;
        }
        if (!matchesArea) return false;
        if (vArea && vArea.lineId) {
          return doctorMatchesLine(p, vArea.lineId, allAreas);
        }
        return true;
      });
    } else if (role === "product_manager") {
      const currentUserObj = allUsers.find((u) => u.id === currentUser.id);
      const pmLineIds = currentUserObj?.lineIds || (currentUserObj?.lineId ? [currentUserObj.lineId] : []);
      if (selectedFilter && selectedFilter.startsWith("rep:")) {
        const repId = selectedFilter.split(":")[1];
        options = allPharms.filter((p) => p.repId === repId);
      } else if (selectedFilter && selectedFilter.startsWith("dm:")) {
        const dmId = selectedFilter.split(":")[1];
        const dmReps = allUsers.filter((u) => u.managerId === dmId).map((u) => u.id);
        const allowed = [dmId, ...dmReps];
        options = allPharms.filter((p) => allowed.includes(p.repId));
      } else if (selectedFilter && selectedFilter.startsWith("lm:")) {
        const lmId = selectedFilter.split(":")[1];
        const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(lmId) : [];
        const allowed = [lmId, ...downstream.map((u) => u.id)];
        options = allPharms.filter((p) => allowed.includes(p.repId));
      } else {
        options = allPharms.filter((p) => pmLineIds.length === 0 || pmLineIds.some((lId) => doctorMatchesLine(p, lId, allAreas)));
        if (options.length === 0 && allPharms.length > 0) options = allPharms;
      }
    } else if (!isManager) {
      const repAreas =
        window.store && window.store.areas
          ? window.store.areas.getByRep(currentUser.id)
          : [];
      const repAreaIds = repAreas.map((a) => a.id);
      options = allPharms.filter(
        (p) => (p.areaId && repAreaIds.includes(p.areaId))
      );
    } else if (allowedRepIds) {
      options = allPharms.filter((p) => allowedRepIds.includes(p.repId));
    } else {
      options = allPharms;
    }
  } else {
    if (targetLabel) targetLabel.textContent = isAr ? "الطبيب" : "Doctor";
    const allDocs = getMockDoctors();

    const inactiveUserIds = allUsers
      .filter((u) => u.status === "Inactive")
      .map((u) => u.id);

    if (!isManager) {
      const repAreas =
        window.store && window.store.areas
          ? window.store.areas.getByRep(currentUser.id)
          : [];
      const repAreaIds = repAreas.map((a) => a.id);
      options = allDocs.filter(
        (d) => (d.areaId && repAreaIds.includes(d.areaId))
      );
    } else if (selectedFilter && selectedFilter.startsWith("vacant:")) {
      const vAreaId = selectedFilter.split(":")[1];
      const vArea = allAreas.find((a) => a.id === vAreaId);
      const vNameLower = vArea && vArea.name ? vArea.name.toLowerCase().trim() : null;
      options = allDocs.filter((d) => {
        let matchesArea = false;
        if (d.areaId) {
          matchesArea = d.areaId === vAreaId;
        } else if (vNameLower && d.area && d.area.toLowerCase().trim() === vNameLower) {
          matchesArea = true;
        }
        if (!matchesArea) return false;
        if (vArea && vArea.lineId) {
          return doctorMatchesLine(d, vArea.lineId, allAreas);
        }
        return true;
      });
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
    } else if (role === "product_manager") {
      const currentUserObj = allUsers.find((u) => u.id === currentUser.id);
      const pmLineIds = currentUserObj?.lineIds || (currentUserObj?.lineId ? [currentUserObj.lineId] : []);
      if (!selectedFilter || selectedFilter === "all") {
        options = allDocs.filter((d) => pmLineIds.length === 0 || pmLineIds.some((lId) => doctorMatchesLine(d, lId, allAreas)));
        if (options.length === 0 && allDocs.length > 0) options = allDocs;
      } else if (selectedFilter === "vacant") {
        options = allDocs.filter((d) => !d.repId);
      } else if (selectedFilter.startsWith("vacant:")) {
        const vAreaId = selectedFilter.split(":")[1];
        options = allDocs.filter((d) => d.areaId === vAreaId);
      } else if (selectedFilter.startsWith("rep:")) {
        const repId = selectedFilter.split(":")[1];
        options = allDocs.filter((d) => d.repId === repId);
      } else if (selectedFilter.startsWith("dm:")) {
        const dmId = selectedFilter.split(":")[1];
        const dmReps = allUsers.filter((u) => u.managerId === dmId).map((u) => u.id);
        const allowed = [dmId, ...dmReps];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else if (selectedFilter.startsWith("lm:")) {
        const lmId = selectedFilter.split(":")[1];
        const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(lmId) : [];
        const allowed = [lmId, ...downstream.map((u) => u.id)];
        options = allDocs.filter((d) => allowed.includes(d.repId));
      } else {
        options = allDocs.filter((d) => d.repId === selectedFilter);
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

  const activeLineId = document.getElementById("filterLine")?.value || "all";
  if (activeLineId !== "all") {
    const lineFiltered = options.filter((target) => doctorMatchesLine(target, activeLineId, allAreas));
    if (lineFiltered.length > 0 || options.length === 0) {
      options = lineFiltered;
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
    const displayName = isAr ? (opt.nameAr || opt.name) : (opt.name || opt.nameAr);
    o.textContent = displayName;
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
  populateVisitProducts(editSelectedProds, visit.repId);
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

  const insertionMeta = document.getElementById("visitInsertionMetaContainer");
  const insDateEl = document.getElementById("visitInsertionDateDisplay");
  const insTimeEl = document.getElementById("visitInsertionTimeDisplay");
  if (insertionMeta) {
    insertionMeta.style.display = "block";
    const now = new Date();
    const curDate = now.toISOString().slice(0, 10);
    const curTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (insDateEl) insDateEl.innerText = `${curDate} (${lang === "ar" ? "تلقائي الآن" : "Auto on Complete"})`;
    if (insTimeEl) insTimeEl.innerText = `${curTime} (${lang === "ar" ? "تلقائي الآن" : "Auto on Complete"})`;
  }

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
  const insertionMeta = document.getElementById("visitInsertionMetaContainer");
  if (insertionMeta) insertionMeta.style.display = "none";
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
      showToast(msg, "warning");
      return;
    }
  } else {
    const twoDaysAgoStr = getTwoDaysAgoStr();
    if (visitDate > todayStr) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "لا يمكن تسجيل زيارة فعلية في تاريخ مستقبلي."
        : "Cannot log an actual visit in a future date.";
      showToast(msg, "warning");
      return;
    }
    const minBacklogDate = (typeof window.getVisitBacklogMinDateStr === "function")
      ? window.getVisitBacklogMinDateStr()
      : twoDaysAgoStr;
    const limitDays = (typeof window.getVisitBacklogLimitDays === "function")
      ? window.getVisitBacklogLimitDays()
      : 2;

    if (visitDate < minBacklogDate) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? (limitDays === 0
            ? "وفقاً لسياسة الشركة، يجب تسجيل الزيارات الفعلية في نفس اليوم فقط."
            : `وفقاً لسياسة الشركة، لا يمكن تسجيل زيارة فعلية بعد مرور أكثر من ${limitDays} ${limitDays === 1 ? "يوم" : limitDays === 2 ? "يومين" : "أيام"} على تاريخها.`)
        : (limitDays === 0
            ? "Company policy requires same-day visit logging only."
            : `Company policy does not allow logging visits older than ${limitDays} day(s).`);
      showToast(msg, "warning");
      return;
    }
  }

  const targetRepId = currentEditVisitId
    ? (demoVisits.find((v) => v.id === currentEditVisitId)?.repId || currentUser.id)
    : currentUser.id;

  const dateCheck = checkVisitDateAllowed(visitDate, targetRepId, lang);
  if (!dateCheck.allowed) {
    resetSaveBtn();
    showToast(dateCheck.message, "warning");
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
    showToast(conflictMsg, "warning");
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
    if (companionCbs.length === 0) {
      resetSaveBtn();
      const msg = lang === "ar"
        ? "يرجى تحديد المرافق في الزيارة المزدوجة."
        : "Please select at least one companion for the double visit.";
      showToast(msg, "warning");
      return;
    }
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
        showToast(cMsg, "warning");
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
      const nowStamp = new Date();
      visit.insertionDate = nowStamp.toISOString().slice(0, 10);
      visit.insertionTime = `${String(nowStamp.getHours()).padStart(2, "0")}:${String(nowStamp.getMinutes()).padStart(2, "0")}`;
      visit.completedAt = nowStamp.toISOString();
      if (!visit.createdAt) visit.createdAt = nowStamp.toISOString();
      visit.entryDate = visit.insertionDate;
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
              gpsPayload = { status: "no_target_coords", distanceMeters: null };
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
      showToast(isAr ? "يرجى اختيار الهدف أولاً" : "Please select a target first", "warning");
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

    const allDocs = getMockDoctors();
    const allHosps = getMockHospitals();
    const allPharms = getMockPharmacies();
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const targetDoc = allDocs.find((d) => d.id === targetId) || allHosps.find((h) => h.id === targetId) || allPharms.find((p) => p.id === targetId);

    const activeFilterLine = document.getElementById("filterLine")?.value;
    let resolvedLineId = targetDoc ? targetDoc.lineId : undefined;
    if (!resolvedLineId && targetDoc && targetDoc.areaId) {
      const a = allAreas.find((x) => x.id === targetDoc.areaId);
      if (a && a.lineId) resolvedLineId = a.lineId;
    }
    if (!resolvedLineId && activeFilterLine && activeFilterLine !== "all") {
      resolvedLineId = activeFilterLine;
    }
    if (!resolvedLineId && typeof window.getUserLines === "function") {
      const repLines = window.getUserLines(assignedRepId);
      if (repLines.length > 0) resolvedLineId = repLines[0].id;
    }

    const nowStamp = new Date();
    const insDate = nowStamp.toISOString().slice(0, 10);
    const insTime = `${String(nowStamp.getHours()).padStart(2, "0")}:${String(nowStamp.getMinutes()).padStart(2, "0")}`;

    const newVisit = {
      id: "v_" + Date.now(),
      repId: assignedRepId,
      lineId: resolvedLineId,
      areaId: targetDoc ? targetDoc.areaId : undefined,
      area: targetDoc ? (targetDoc.area || targetDoc.clinicAddress || targetDoc.address) : undefined,
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
      status: modalSource === "plan" ? "pending_approval" : "completed",
      source: modalSource,
      createdAt: nowStamp.toISOString(),
      insertionDate: insDate,
      insertionTime: insTime,
      entryDate: insDate,
    };

    const finalizeNewSave = (gpsPayload) => {
      resetSaveBtn();
      if (gpsPayload) {
        newVisit.gpsStatus = gpsPayload.status;
        if (gpsPayload.distanceMeters != null) newVisit.distanceMeters = gpsPayload.distanceMeters;
      }
      getLiveVisits();
      demoVisits.unshift(newVisit);
      persistVisits();
      closeVisitModal();
      renderVisits(true);

      const successMsg =
        lang === "ar"
          ? (modalSource === "plan" ? "تم حفظ الزيارة المخططة وإرسالها للاعتماد بنجاح." : "تم تسجيل وحفظ الزيارة بنجاح.")
          : (modalSource === "plan" ? "Visit planned and submitted for approval successfully." : "Visit saved successfully.");
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
            gpsPayload = { status: "no_target_coords", distanceMeters: null };
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

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";
  let exportDate = null;

  if (fDate) {
    const exportDayOnly = confirm(
      isAr
        ? `هل تريد تصدير زيارات تاريخ اليوم المختار (${fDate}) فقط؟\n\n• اضغط (موافق / OK) لتصدير زيارات هذا اليوم فقط.\n• اضغط (إلغاء / Cancel) لتصدير كامل سجل الزيارات لجميع التواريخ.`
        : `Do you want to export visits for the selected date (${fDate}) only?\n\n• Click (OK) to export visits for this date only.\n• Click (Cancel) to export all historical visits across all dates.`
    );
    if (exportDayOnly) {
      exportDate = fDate;
      filtered = filtered.filter((v) => v.date === fDate);
    }
  }

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
    "Target Name,Area,Visit Day,Visit Time,Insertion Date,Insertion Time,Period,Type,Status,Source,Rep ID,Products,Comment\n";
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
    const insDate = v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date) || "";
    const insTime = v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || "10:00")) || "";
    const prods = (window.getVisitDisplayProducts ? window.getVisitDisplayProducts(v) : (v.products || [])).join("; ");
    csv += `"${(v.doctorName || "").replace(/"/g, '""')}","${(areaName || "").replace(/"/g, '""')}","${v.date || ""}","${v.time || ""}","${insDate}","${insTime}","${(v.period || "").toUpperCase()}","${v.visitType || "single"}","${v.status || ""}","${v.source || ""}","${v.repId || ""}","${prods}","${(v.comment || "").replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PharmaCare_Visits_${exportDate || "All_Dates"}.csv`;
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

    // Synchronize DM accompaniment calendar: if deleted visit was double accompaniment,
    // verify if any remaining double visits exist for that DM and rep on that date.
    // If none remain, release the DM's booked schedule date.
    try {
      const dmId = visit.doubleWithUserId;
      const visitDate = visit.date;
      const repId = visit.repId;
      if (dmId && visitDate) {
        const remainingDouble = demoVisits.filter(
          (v) => v.date === visitDate && v.repId === repId && (v.doubleWithUserId === dmId || v.visitType === "double")
        );
        if (remainingDouble.length === 0) {
          const storageKey = "pharma_dm_accompaniments";
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const cached = JSON.parse(raw);
            if (cached[dmId] && cached[dmId][visitDate] === repId) {
              delete cached[dmId][visitDate];
              if (Object.keys(cached[dmId]).length === 0) {
                delete cached[dmId];
              }
              localStorage.setItem(storageKey, JSON.stringify(cached));
            }
          }
        }
      }
    } catch (e) {
      console.error("Error updating pharma_dm_accompaniments on visit deletion:", e);
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
window.updateTargetOptions = updateTargetOptions;
window.setupModalTargetFilter = setupModalTargetFilter;
window.toggleDoubleVisit = toggleDoubleVisit;
window.updateVisitModalDayDisplay = updateVisitModalDayDisplay;
