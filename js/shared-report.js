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
 * Clears a <select> and repopulates it from `items` using textContent
 * (never innerHTML), so option labels can never be interpreted as markup.
 */
function renderSelectOptions(selectEl, items, getValue, getLabel) {
  if (!selectEl) return;
  selectEl.replaceChildren();
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    selectEl.appendChild(opt);
  });
}

/**
 * Same as renderSelectOptions but appends to whatever is already in the
 * <select> (used after a fixed "All ..." option has already been set).
 */
function appendSelectOptions(selectEl, items, getValue, getLabel) {
  if (!selectEl) return;
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    selectEl.appendChild(opt);
  });
}

// ============================================================================
// Section 1: Reports Master Data Store
// (Sales numbers are formatted without currency symbols throughout, by design)
// ============================================================================
const REPORTS_DATA = {
  sales: [],
  visits: [],
  doctors: []
};

// ============================================================================
// Section 1.5: Automatic Data Synchronization with Master Store (DEMO_DATA)
// ============================================================================
function syncReportsData() {
  if (typeof window.DEMO_DATA !== 'undefined' && window.DEMO_DATA) {
    // 1. Sync Doctors & Hospitals
    if (Array.isArray(window.DEMO_DATA.doctors) && window.DEMO_DATA.doctors.length > 0) {
      window.DEMO_DATA.doctors.forEach((doc) => {
        if (!REPORTS_DATA.doctors.some((d) => d.id === doc.id || d.name === doc.name)) {
          REPORTS_DATA.doctors.push({
            id: doc.id,
            name: doc.name,
            class: doc.class || 'B',
            specialty: doc.specialty || 'General Practice',
            area: doc.clinicAddress || 'Nasr City',
            repId: doc.repId || 'rep1',
            targetQuarterly: doc.class === 'A' ? 4 : 3
          });
        }
      });
    }
    if (Array.isArray(window.DEMO_DATA.hospitals) && window.DEMO_DATA.hospitals.length > 0) {
      window.DEMO_DATA.hospitals.forEach((hosp) => {
        if (!REPORTS_DATA.doctors.some((d) => d.id === hosp.id || d.name === hosp.name)) {
          REPORTS_DATA.doctors.push({
            id: hosp.id,
            name: hosp.name,
            class: 'hospital',
            specialty: 'Hospital (AM)',
            area: hosp.address || 'Nasr City',
            repId: hosp.repId || 'rep1',
            targetQuarterly: 6
          });
        }
      });
    }
    // 2. Sync Visits from visits module or store.visits (only completed or actual visits)
    const sourceVisits = (window.store && window.store.visits ? window.store.visits.getAll() : null) ||
                         (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
    if (Array.isArray(sourceVisits) && sourceVisits.length > 0) {
      const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users)) || [];
      const allDoctors = (window.store && window.store.doctors ? window.store.doctors.getAll() : (window.DEMO_DATA && window.DEMO_DATA.doctors)) || [];
      const allHospitals = (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];

      sourceVisits.forEach((v) => {
        const isCompleted = v.status === 'completed' || Boolean(v.isActual) || v.source === 'actual';
        const existingIdx = REPORTS_DATA.visits.findIndex((rv) => rv.id === v.id);
        if (!isCompleted) {
          if (existingIdx >= 0) {
            REPORTS_DATA.visits.splice(existingIdx, 1);
          }
          return;
        }

        const rep = allUsers.find((u) => u.id === v.repId);
        const repName = rep ? rep.name : (v.repName || 'Unknown Rep');
        const doc = allDoctors.find((d) => d.id === v.doctorId) ||
                    allHospitals.find((h) => h.id === v.doctorId);
        const isPharm =
          v.targetType === 'pharmacy' ||
          (v.period && v.period.toLowerCase() === 'pharmacy') ||
          (v.doctorId && String(v.doctorId).startsWith('pharm'));
        const isHosp = !isPharm && (v.period && v.period.toLowerCase() === 'am');
        const mappedVisit = {
          id: v.id,
          doctorId: v.doctorId || (doc ? doc.id : undefined),
          targetName: v.doctorName || (doc ? doc.name : (v.targetName || 'Unknown Target')),
          class: isPharm ? 'Pharmacy' : doc ? doc.class : (isHosp ? 'Hospital' : 'B'),
          specialty: isPharm ? 'Pharmacy' : doc ? doc.specialty : (isHosp ? 'Hospital' : 'General'),
          type: isPharm ? 'pharmacy' : (isHosp ? 'hospital' : 'doctor'),
          targetType: isPharm ? 'pharmacy' : (isHosp ? 'hospital' : 'doctor'),
          date: v.date,
          time: v.time || '10:00',
          insertionDate: v.insertionDate || (v.createdAt ? v.createdAt.slice(0, 10) : v.date),
          insertionTime: v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || '10:00')),
          createdAt: v.createdAt || undefined,
          period: isPharm ? 'PHARM' : (v.period || 'PM').toUpperCase(),
          status: 'completed',
          isActual: v.source === 'actual' || Boolean(v.isActual),
          repId: v.repId || 'rep1',
          repName: repName,
          comment: v.comment || '',
          productIds: v.productIds || [],
          products: v.products || []
        };
        if (existingIdx >= 0) {
          REPORTS_DATA.visits[existingIdx] = mappedVisit;
        } else {
          REPORTS_DATA.visits.push(mappedVisit);
        }
      });
    }

    // Purge any legacy mock visits
    REPORTS_DATA.visits = REPORTS_DATA.visits.filter((rv) => {
      const isMock = rv.id && (rv.id.startsWith('v') || rv.id.startsWith('today_v')) && (rv.targetName === 'Ahmed Mostafa' || rv.repName === 'Ahmed Mostafa' || rv.targetName === 'Sara Abdullah' || rv.targetName === 'Al-Salam Hospital' || rv.targetName === 'Al-Ezaby Pharmacy');
      return !isMock && (rv.status === 'completed' || rv.isActual === true || rv.source === 'actual');
    });

    // 3. Purge any legacy mock distributor sales (ds_s...) if present
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.distributorSales)) {
      const initialCount = window.DEMO_DATA.distributorSales.length;
      window.DEMO_DATA.distributorSales = window.DEMO_DATA.distributorSales.filter((s) => {
        return s && s.id && !s.id.startsWith('ds_s');
      });
      if (window.DEMO_DATA.distributorSales.length !== initialCount) {
        if (typeof window.saveSalesDataToStorage === 'function') {
          window.saveSalesDataToStorage();
        }
      }
    }
    // 4. Purge any legacy mock targets (target_s...) if present
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.targets)) {
      const initialTargetCount = window.DEMO_DATA.targets.length;
      window.DEMO_DATA.targets = window.DEMO_DATA.targets.filter((t) => {
        return t && t.id && !t.id.startsWith('target_s');
      });
      if (window.DEMO_DATA.targets.length !== initialTargetCount) {
        if (typeof window.saveDataToStorage === 'function') {
          window.saveDataToStorage();
        }
      }
    }
  }
}

// ============================================================================
// Section 1.6: Directory Translations (Doctors & Pharmacies)
// ============================================================================
const directoryTranslations = {
  en: {
    tabDoctorsList: 'Doctors List',
    tabHospitalsList: 'Hospitals List',
    tabPharmaciesList: 'Pharmacies List',
    doctorsDirectoryTitle: '👨‍⚕️ Doctors Directory',
    doctorsDirectorySubtitle: 'Master physician registry with contact details, specialty, and assignment.',
    hospitalsDirectoryTitle: '🏥 Hospitals Directory',
    hospitalsDirectorySubtitle: 'Master registry of hospitals, medical centers, contact numbers, and assigned territories.',
    pharmaciesDirectoryTitle: '💊 Pharmacies Directory',
    pharmaciesDirectorySubtitle: 'Directory of authorized partner pharmacies, contact personnel, and assigned territories.',
    searchDoctors: 'Search Doctors:',
    searchDoctorsPlaceholder: 'Search by name, clinic, phone...',
    searchHospitals: 'Search Hospitals:',
    searchHospitalsPlaceholder: 'Search by hospital name, address, phone...',
    specialty: 'Specialty:',
    allSpecialties: 'All Specialties',
    doctorClass: 'Class:',
    allClasses: 'All Classes (A & B)',
    searchPharmacies: 'Search Pharmacies:',
    searchPharmaciesPlaceholder: 'Search by pharmacy name, address, contact...',
    addDoctor: 'Add Doctor',
    editDoctor: 'Edit Doctor',
    addDoctorSubtitle: 'Register a new healthcare professional and assign territory.',
    editDoctorSubtitle: 'Update doctor credentials, specialty, and assignment.',
    deleteDoctor: 'Delete Doctor',
    confirmDeleteDoctor: 'Are you sure you want to delete this doctor? This action cannot be undone.',
    addPharmacy: 'Add Pharmacy',
    editPharmacy: 'Edit Pharmacy',
    addPharmacySubtitle: 'Register an authorized partner pharmacy, contact pharmacist, and assigned representative.',
    editPharmacySubtitle: 'Update pharmacy details, contact person, and assignment.',
    deletePharmacy: 'Delete Pharmacy',
    confirmDeletePharmacy: 'Are you sure you want to delete this pharmacy? This action cannot be undone.',
    addHospital: 'Add Hospital',
    editHospital: 'Edit Hospital',
    addHospitalSubtitle: 'Register a new hospital or medical center and assign territory & representative.',
    editHospitalSubtitle: 'Update hospital credentials, address, and representative assignment.',
    deleteHospital: 'Delete Hospital',
    confirmDeleteHospital: 'Are you sure you want to delete this hospital? This action cannot be undone.',
    noDoctorsFound: 'No Doctors Found',
    noDoctorsDesc: 'Try adjusting search query or filters.',
    noHospitalsFound: 'No Hospitals Found',
    noHospitalsDesc: 'Try adjusting search query or filters.',
    noPharmaciesFound: 'No Pharmacies Found',
    noPharmaciesDesc: 'Try adjusting search query or filters.',
    doctorName: 'Doctor Name',
    hospitalName: 'Hospital Name',
    hospitalNameAr: 'Arabic Hospital Name',
    clinicAddress: 'Clinic Address',
    phone: 'Phone Number',
    assignedRep: 'Assigned Medical Rep',
    pharmacyName: 'Pharmacy Name',
    address: 'Address',
    contactPerson: 'Contact Person / Pharmacist',
    labelLine: 'Line / LM:',
    labelDm: 'District / DM:',
    labelRep: 'Medical Rep:',
    territoryAssignment: 'Territory & Rep Assignment',
    filterLm: 'Line / LM',
    filterDm: 'District / DM',
    allReps: 'All Representatives',
    doctorsCountSuffix: 'Doctors',
    hospitalsCountSuffix: 'Hospitals',
    pharmaciesCountSuffix: 'Pharmacies',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    btnImportDoctors: 'Import Sheet (.csv)',
    btnImportPharmacies: 'Import Sheet (.csv)',
    btnExportDoctors: 'Export Directory',
    btnExportHospitals: 'Export Directory',
    btnExportPharmacies: 'Export Directory',
    btnExportCSV: 'Export CSV',
    importDoctorsTitle: 'Import Doctors from Sheet',
    importDoctorsSubtitle: 'Download our standardized English template, fill physician data, and upload for instant bulk import.',
    importPharmaciesTitle: 'Import Pharmacies from Sheet',
    importPharmaciesSubtitle: 'Download our standardized English template, fill pharmacy data, and upload for instant bulk import.',
    step1DownloadTemplate: 'Step 1: Download Official Template (English Only)',
    step1Desc: 'Use this official pre-formatted CSV template. Mandatory columns: Doctor Name, Specialty, Class, Address.',
    step1PharmDesc: 'Use this official pre-formatted CSV template. Mandatory columns: Pharmacy Name, Address.',
    btnDownloadTemplate: 'Download Template (.csv)',
    step2AssignRep: 'Step 2: Assign Medical Representative',
    step2Desc: 'Assign all imported records to a specific representative, or use the "Rep Code" specified in the sheet.',
    step3UploadFile: 'Step 3: Upload Completed Sheet (.csv)',
    dropZoneText: 'Click to browse or drag & drop CSV file here',
    dropZoneSubtext: 'Supports CSV format (Comma delimited)',
    previewTitle: 'Data Preview & Validation',
    btnConfirmImport: 'Confirm & Import',
    salesTrendTitle: 'Monthly Sales vs Target Trend',
    coverageGaugeTitle: 'Doctor Coverage Speedometer Gauge',
    doctorClassesTitle: 'Doctor Classes & Hospitals Distribution',
    promptShowSalesTitle: 'Click Show to View Sales Report',
    promptShowSalesDesc: 'Select product, month, year, distributor, or line, then click Show to display sales data.',
    promptShowAchTitle: 'Click Show to View Achievements Report',
    promptShowAchDesc: 'Select month and year then click Show to view targets, actuals, and achievement rates.',
    promptShowTimelineTitle: 'Click Show to View Daily Timeline',
    promptShowTimelineDesc: 'Choose employee and date range then click Show to display visits and activities timeline.',
    promptShowCoverageTitle: 'Click Show to View Coverage Report',
    promptShowCoverageDesc: 'Choose employee, date range, and class filter then click Show to calculate coverage and frequency.',
    promptShowDoctorsTitle: 'Click Show to View Doctors Directory',
    promptShowDoctorsDesc: 'Choose employee, specialty, class, or search query then click Show to display doctors.',
    promptShowHospitalsTitle: 'Click Show to View Hospitals Directory',
    promptShowHospitalsDesc: 'Choose employee or search query then click Show to display hospitals.',
    promptShowPharmaciesTitle: 'Click Show to View Pharmacies Directory',
    promptShowPharmaciesDesc: 'Choose employee or search query then click Show to display pharmacies.',
    timelineFrom: 'From:',
    timelineTo: 'To:',
    allTargets: 'All Targets (A, B & Hospitals)',
    allDoctorsClassAB: 'All Doctors (Class A & B)',
    classAOnly: 'Class A Only',
    classBOnly: 'Class B Only',
    hospitalsOnly: 'Hospitals Only',
    colArea: 'Area / Territory',
    allAreas: 'All Areas',
    assignedArea: 'Territory / Area',
    selectArea: '-- Select Territory / Area --'
  },
  ar: {
    tabDoctorsList: 'قائمة الأطباء',
    tabHospitalsList: 'قائمة المستشفيات',
    tabPharmaciesList: 'قائمة الصيدليات',
    doctorsDirectoryTitle: '👨‍⚕️ دليل الأطباء',
    doctorsDirectorySubtitle: 'سجل الأطباء المعتمد مع تفاصيل الاتصال، التخصص، والمنطقة التابعة.',
    hospitalsDirectoryTitle: '🏥 دليل المستشفيات',
    hospitalsDirectorySubtitle: 'سجل المستشفيات والمراكز الطبية المعتمدة مع تفاصيل الاتصال والمندوب والمنطقة التابعة.',
    pharmaciesDirectoryTitle: '💊 دليل الصيدليات',
    pharmaciesDirectorySubtitle: 'سجل الصيدليات الشريكة، بيانات الصيدلي المسؤول، والمنطقة التابعة.',
    searchDoctors: 'بحث الأطباء:',
    searchDoctorsPlaceholder: 'ابحث بالاسم، العيادة، الهاتف...',
    searchHospitals: 'بحث المستشفيات:',
    searchHospitalsPlaceholder: 'ابحث باسم المستشفى، العنوان، الهاتف...',
    specialty: 'التخصص:',
    allSpecialties: 'جميع التخصصات',
    doctorClass: 'الفئة:',
    allClasses: 'جميع الفئات (A و B)',
    searchPharmacies: 'بحث الصيدليات:',
    searchPharmaciesPlaceholder: 'ابحث باسم الصيدلية، العنوان، المسؤول...',
    addDoctor: 'إضافة طبيب',
    editDoctor: 'تعديل بيانات الطبيب',
    addDoctorSubtitle: 'تسجيل طبيب جديد في الدليل وتعيين المندوب والمنطقة التابعة.',
    editDoctorSubtitle: 'تعديل بيانات الطبيب، التخصص، والمنطقة التابعة.',
    deleteDoctor: 'حذف طبيب',
    confirmDeleteDoctor: 'هل أنت متأكد من حذف هذا الطبيب من النظام نهائياً؟',
    addPharmacy: 'إضافة صيدلية',
    editPharmacy: 'تعديل بيانات الصيدلية',
    addPharmacySubtitle: 'تسجيل صيدلية شريكة جديدة وبيانات الصيدلي المسؤول.',
    editPharmacySubtitle: 'تعديل بيانات الصيدلية، الصيدلي المسؤول، والمنطقة التابعة.',
    deletePharmacy: 'حذف صيدلية',
    confirmDeletePharmacy: 'هل أنت متأكد من حذف هذه الصيدلية من النظام نهائياً؟',
    addHospital: 'إضافة مستشفى',
    editHospital: 'تعديل بيانات المستشفى',
    addHospitalSubtitle: 'تسجيل مستشفى أو مركز طبي جديد وتعيين المندوب والمنطقة التابعة.',
    editHospitalSubtitle: 'تعديل بيانات المستشفى، العنوان، والمنطقة التابعة والمندوب.',
    deleteHospital: 'حذف مستشفى',
    confirmDeleteHospital: 'هل أنت متأكد من حذف هذه المستشفى من النظام نهائياً؟',
    noDoctorsFound: 'لا يوجد أطباء مطابقين',
    noDoctorsDesc: 'يرجى تجربة معايير بحث أخرى أو تعديل الفلاتر.',
    noHospitalsFound: 'لا توجد مستشفيات مطابقة',
    noHospitalsDesc: 'يرجى تجربة معايير بحث أخرى أو تعديل الفلاتر.',
    noPharmaciesFound: 'لا توجد صيدليات مطابقة',
    noPharmaciesDesc: 'يرجى تجربة معايير بحث أخرى أو تعديل الفلاتر.',
    doctorName: 'اسم الطبيب',
    hospitalName: 'اسم المستشفى',
    hospitalNameAr: 'اسم المستشفى بالعربي',
    clinicAddress: 'عنوان العيادة',
    phone: 'رقم الهاتف',
    assignedRep: 'المندوب المسؤول',
    pharmacyName: 'اسم الصيدلية',
    address: 'العنوان',
    contactPerson: 'الصيدلي المسؤول / جهة الاتصال',
    labelLine: 'الخط البيعي / LM:',
    labelDm: 'المنطقة / DM:',
    labelRep: 'المندوب الطبي:',
    territoryAssignment: 'المنطقة وتعيين المندوب المسؤول',
    filterLm: 'الخط البيعي / LM',
    filterDm: 'المنطقة / DM',
    allReps: 'جميع المناديب',
    doctorsCountSuffix: 'طبيب',
    hospitalsCountSuffix: 'مستشفى',
    pharmaciesCountSuffix: 'صيدلية',
    btnEdit: 'تعديل',
    btnDelete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    btnImportDoctors: 'استيراد من شيت (.csv)',
    btnImportPharmacies: 'استيراد من شيت (.csv)',
    btnExportDoctors: 'تصدير اللستة (Export)',
    btnExportPharmacies: 'تصدير اللستة (Export)',
    btnExportCSV: 'تصدير CSV',
    importDoctorsTitle: 'استيراد أطباء من شيت إكسيل',
    importDoctorsSubtitle: 'قم بتحميل القالب الرسمي المعتمد باللغة الإنجليزية، املأ البيانات، وارفع الملف للاستيراد الفوري.',
    importPharmaciesTitle: 'استيراد صيدليات من شيت إكسيل',
    importPharmaciesSubtitle: 'قم بتحميل القالب الرسمي المعتمد باللغة الإنجليزية، املأ البيانات، وارفع الملف للاستيراد الفوري.',
    step1DownloadTemplate: 'الخطوة 1: تحميل القالب الرسمي (باللغة الإنجليزية)',
    step1Desc: 'استخدم هذا القالب الرسمي. الحقول الإلزامية: Doctor Name, Specialty, Class, Address.',
    step1PharmDesc: 'استخدم هذا القالب الرسمي. الحقول الإلزامية: Pharmacy Name, Address.',
    btnDownloadTemplate: 'تحميل القالب (.csv)',
    step2AssignRep: 'الخطوة 2: تعيين المندوب المسؤول',
    step2Desc: 'عيّن جميع السجلات المرفوعة لمندوب محدد، أو اتركها لتقرأ من عمود Rep Code في الشيت.',
    step3UploadFile: 'الخطوة 3: رفع ملف الشيت المكتمل (.csv)',
    dropZoneText: 'انقر للاختيار أو اسحب الملف وأفلته هنا',
    dropZoneSubtext: 'يدعم ملفات CSV (مفصولة بفواصل)',
    previewTitle: 'معاينة وفحص صحة البيانات',
    btnConfirmImport: 'تأكيد واستيراد',
    salesTrendTitle: 'منحنى تحقيق المبيعات شهرياً',
    coverageGaugeTitle: 'مؤشر قياس التغطية',
    doctorClassesTitle: 'توزيع فئات الأطباء والمستشفيات',
    promptShowSalesTitle: 'اضغط على زر عرض لإظهار تقرير المبيعات',
    promptShowSalesDesc: 'حدد المنتج والشهر والسنة والموزع أو الخط البيعي ثم اضغط على زر عرض لعرض بيانات المبيعات.',
    promptShowAchTitle: 'اضغط على زر عرض لإظهار تقرير الإنجازات',
    promptShowAchDesc: 'حدد الشهر والسنة ثم اضغط على زر عرض لعرض الأهداف ونسب التحقيق.',
    promptShowTimelineTitle: 'اضغط على زر عرض لإظهار التايم لاين اليومي',
    promptShowTimelineDesc: 'اختر الموظف والفترة الزمنية ثم اضغط على زر عرض لعرض جدول الزيارات والأنشطة.',
    promptShowCoverageTitle: 'اضغط على زر عرض لإظهار تقرير التغطية',
    promptShowCoverageDesc: 'اختر الموظف والفترة وفئة الأطباء ثم اضغط على زر عرض لحساب نسب التغطية والتكرار.',
    promptShowDoctorsTitle: 'اضغط على زر عرض لإظهار دليل الأطباء',
    promptShowDoctorsDesc: 'حدد الموظف أو التخصص أو الفئة أو كلمات البحث ثم اضغط على زر عرض لإظهار الأطباء.',
    promptShowPharmaciesTitle: 'اضغط على زر عرض لإظهار دليل الصيدليات',
    promptShowPharmaciesDesc: 'حدد الموظف أو كلمات البحث ثم اضغط على زر عرض لإظهار الصيدليات.',
    timelineFrom: 'من:',
    timelineTo: 'إلى:',
    allTargets: 'جميع الأهداف (A و B ومستشفيات)',
    allDoctorsClassAB: 'جميع الأطباء (فئة A و B)',
    classAOnly: 'فئة A فقط',
    classBOnly: 'فئة B فقط',
    hospitalsOnly: 'المستشفيات فقط',
    colArea: 'المنطقة البيعية',
    allAreas: 'جميع المناطق',
    assignedArea: 'المنطقة البيعية',
    selectArea: '-- اختر المنطقة البيعية --'
  }
};

// ============================================================================
// Section 2: Page Lifecycle Initialization
// ============================================================================
function initializeReportsPage() {
  // Merge directory translations
  if (window.translations) {
    window.translations.en = { ...window.translations.en, ...directoryTranslations.en };
    window.translations.ar = { ...window.translations.ar, ...directoryTranslations.ar };
  }
  initPage('reports');
  syncReportsData();
  const user = checkAuth();
  if (user && (user.role === 'hr' || (window.normalizeRole && window.normalizeRole(user.role) === 'hr'))) {
    window.location.replace('users.html');
    return;
  }
  setupRolePermissions(user);
  initAllFilters(user);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const firstOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastOfMonthStr = `${lastOfMonth.getFullYear()}-${pad(lastOfMonth.getMonth() + 1)}-${pad(lastOfMonth.getDate())}`;
  const dateFrom = document.getElementById('timelineDateFrom');
  const dateTo = document.getElementById('timelineDateTo');
  if (dateFrom && !dateFrom.value) dateFrom.value = firstOfMonth;
  if (dateTo && !dateTo.value) dateTo.value = todayStr;
  const startDate = document.getElementById('coverageStartDate');
  const endDate = document.getElementById('coverageEndDate');
  if (startDate && !startDate.value) startDate.value = firstOfMonth;
  if (endDate && !endDate.value) endDate.value = lastOfMonthStr;

  // Prepare filter dropdowns without auto-rendering results
  if (typeof populateAchievementsFilters === 'function') populateAchievementsFilters();

  // Check URL query parameter for active tab
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  if (requestedTab && ['sales', 'achievements', 'timeline', 'coverage', 'doctors', 'hospitals', 'pharmacies'].includes(requestedTab)) {
    switchReportTab(requestedTab);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReportsPage);
} else {
  initializeReportsPage();
}

document.addEventListener('languageChanged', () => {
  const user = checkAuth();
  if (user) {
    setupRolePermissions(user);
    initAllFilters(user);
  }
});

document.addEventListener('click', (e) => {
  const achMonthContainer = document.getElementById('achMonthMultiSelectContainer');
  if (achMonthContainer && !achMonthContainer.contains(e.target) && typeof closeAchMonthDropdown === 'function') {
    closeAchMonthDropdown();
  }
  const pharmSalesMonthContainer = document.getElementById('pharmSalesMonthMultiSelectContainer');
  if (pharmSalesMonthContainer && !pharmSalesMonthContainer.contains(e.target) && typeof closePharmSalesMonthDropdown === 'function') {
    closePharmSalesMonthDropdown();
  }
  const productContainer = document.getElementById('productMultiSelectContainer');
  if (productContainer && !productContainer.contains(e.target) && typeof closeProductDropdown === 'function') {
    closeProductDropdown();
  }
  const monthContainer = document.getElementById('monthMultiSelectContainer');
  if (monthContainer && !monthContainer.contains(e.target) && typeof closeMonthDropdown === 'function') {
    closeMonthDropdown();
  }
});

// ============================================================================
// Section 3: Role Permissions & Mode Indicators
// ============================================================================
function setupRolePermissions(user) {
  const currentUser = user || (typeof checkAuth === 'function' ? checkAuth() : null);
  const normalizedRole = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase()) : '';
  const isAdmin = normalizedRole === 'admin';
  
  if (isAdmin) {
    document.body.classList.add('is-admin');
  } else {
    document.body.classList.remove('is-admin');
  }

  const adminSelectors = [
    '#manageTargetsBtn',
    '#linkUploadDistributorSales',
    '#btnAddDoctor',
    '#btnImportDoctors',
    '#btnAddHospital',
    '#btnImportHospitals',
    '#btnAddPharmacy',
    '#btnImportPharmacies',
    '.admin-only-action'
  ];

  adminSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = isAdmin ? 'inline-flex' : 'none';
    });
  });

  const noticeBadge = document.getElementById('adminBadgeNotice');
  const noticeText = document.getElementById('roleNoticeText');
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';

  if (noticeBadge && noticeText) {
    if (isAdmin) {
      noticeBadge.className = 'admin-notice-pill admin-mode';
      noticeText.textContent = lang === 'ar' 
        ? 'صلاحية الإدارة: متاح إدارة الأهداف والتقارير والأطباء والمستشفيات والصيدليات' 
        : 'Admin Role: Full Targets Management, Doctors, Hospitals & Pharmacies Management';
    } else {
      noticeBadge.className = 'admin-notice-pill';
      noticeText.textContent = lang === 'ar' 
        ? 'عرض فقط: تعديل التارجت والأطباء والمستشفيات والصيدليات مقتصر على الإدارة' 
        : 'View-Only: Targets and Directories managed by Admin';
    }
  }
}

// ============================================================================
// Section 4: Tab Switcher
// ============================================================================
function switchReportTab(tabKey) {
  document.querySelectorAll('.report-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });
  document.querySelectorAll('.report-content-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tabPanel-${tabKey}`);
  });
  setupRolePermissions(typeof checkAuth === 'function' ? checkAuth() : null);
  if (tabKey === 'achievements') {
    if (typeof populateAchFilters === 'function') populateAchFilters();
  }
  if (tabKey === 'doctors') {
    if (typeof populateDoctorSpecialtyFilter === 'function') populateDoctorSpecialtyFilter();
  }
}

// ============================================================================
// Section 6: Cascading Hierarchy Filters Setup
// ============================================================================
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
window.MONTH_NAMES = MONTH_NAMES;
window.MONTH_NAMES_AR = MONTH_NAMES_AR;

function getSharedReportUsers() {
  return (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
}

function initAllFilters(user) {
  populateReportLineFilter(user);
  if (typeof initPharmSalesFilters === 'function') {
    initPharmSalesFilters(user);
  }
  populateUnifiedReportEmployeeFilters(user, window.selectedReportLineId);
  if (typeof populateDoctorSpecialtyFilter === 'function') {
    populateDoctorSpecialtyFilter();
  }
}

function populateReportLineFilter(user) {
  const lineSelect = document.getElementById('reportLineFilter');
  if (!lineSelect) return;

  const currentUser = user || (typeof checkAuth === 'function' ? checkAuth() : null) || { role: 'admin', id: 'admin1' };
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase();
  const isRep = role === 'medical_rep' || role === 'rep';
  const lang = (window.getCurrentLang && window.getCurrentLang()) || 'en';
  const isAr = lang === 'ar';
  const userLines = window.getUserLines ? window.getUserLines(currentUser.id) : [];
  const curVal = lineSelect.value;

  lineSelect.replaceChildren();

  if (isRep) {
    if (userLines.length > 0) {
      userLines.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `📦 ${(isAr && l.nameAr) ? l.nameAr : l.name}`;
        lineSelect.appendChild(opt);
      });
      lineSelect.value = userLines[0].id;
      window.selectedReportLineId = userLines[0].id;
      lineSelect.disabled = true;
    } else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = isAr ? '📦 لا توجد خطوط معينة' : '📦 No Line Assigned';
      lineSelect.appendChild(opt);
      window.selectedReportLineId = '';
      lineSelect.disabled = true;
    }
    return;
  }

  // Managers & Admin
  lineSelect.disabled = false;
  const isFullAdmin = role === 'admin' || role === 'hr';

  if (isFullAdmin || userLines.length > 1) {
    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = isAr ? '🌐 جميع خطوط الإنتاج' : '🌐 All Product Lines';
    lineSelect.appendChild(optAll);
  }

  userLines.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = `📦 ${(isAr && l.nameAr) ? l.nameAr : l.name}`;
    lineSelect.appendChild(opt);
  });

  if (curVal && Array.from(lineSelect.options).some((o) => o.value === curVal)) {
    lineSelect.value = curVal;
  } else {
    lineSelect.value = lineSelect.options[0]?.value || 'all';
  }
  window.selectedReportLineId = lineSelect.value;
}

window.onReportLineFilterChange = function (selectedLineId) {
  window.selectedReportLineId = selectedLineId;
  const user = typeof checkAuth === 'function' ? checkAuth() : null;
  populateUnifiedReportEmployeeFilters(user, selectedLineId);
  if (typeof window.updatePharmSalesProductsForLine === 'function') {
    window.updatePharmSalesProductsForLine(selectedLineId);
  }

  const activeTabBtn = document.querySelector('.report-tab-btn.active');
  const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'sales';

  if (activeTab === 'sales' && typeof renderSalesReport === 'function') {
    const results = document.getElementById('salesResultsContainer');
    if (results && results.style.display !== 'none') renderSalesReport();
  } else if (activeTab === 'achievements' && typeof renderAchievementsReport === 'function') {
    const results = document.getElementById('achievementsResultsContainer');
    if (results && results.style.display !== 'none') renderAchievementsReport();
  } else if (activeTab === 'timeline' && typeof renderDailyTimeline === 'function') {
    const results = document.getElementById('timelineResultsContainer');
    if (results && results.style.display !== 'none') renderDailyTimeline();
  } else if (activeTab === 'coverage' && typeof renderCoverageReport === 'function') {
    const results = document.getElementById('coverageResultsContainer');
    if (results && results.style.display !== 'none') renderCoverageReport();
  } else if (activeTab === 'doctors' && typeof renderDoctorsReport === 'function') {
    const results = document.getElementById('doctorsResultsContainer');
    if (results && results.style.display !== 'none') renderDoctorsReport();
  } else if (activeTab === 'hospitals' && typeof renderHospitalsReport === 'function') {
    const results = document.getElementById('hospitalsResultsContainer');
    if (results && results.style.display !== 'none') renderHospitalsReport();
  } else if (activeTab === 'pharmacies' && typeof renderPharmaciesReport === 'function') {
    const results = document.getElementById('pharmaciesResultsContainer');
    if (results && results.style.display !== 'none') renderPharmaciesReport();
  }
};

function getAreaManagerId(area, allUsers = []) {
  if (!area) return null;
  if (area.dmId) return area.dmId;
  if (area.managerId) return area.managerId;

  if (area.repId) {
    const rep = allUsers.find((u) => u.id === area.repId);
    if (rep && rep.managerId) return rep.managerId;
  }

  const allDocs = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
  const docWithRep = allDocs.find((d) => (d.areaId === area.id || (d.area && d.area.toLowerCase() === (area.name || '').toLowerCase())) && d.repId);
  if (docWithRep) {
    const docRep = allUsers.find((u) => u.id === docWithRep.repId);
    if (docRep && docRep.managerId) return docRep.managerId;
  }

  const allSales = (window.store && window.store.distributorSales ? window.store.distributorSales.getAll() : (window.DEMO_DATA && window.DEMO_DATA.sales) || []);
  const saleWithDm = allSales.find((s) => (s.areaId === area.id || (s.area && s.area.toLowerCase() === (area.name || '').toLowerCase())) && s.dmId);
  if (saleWithDm) return saleWithDm.dmId;

  if (area.lineId) {
    const dmsInLine = allUsers.filter((u) =>
      (u.role === 'district_manager' || u.role === 'dm') &&
      ((u.lineIds && u.lineIds.includes(area.lineId)) || u.lineId === area.lineId)
    );
    if (dmsInLine.length === 1) {
      return dmsInLine[0].id;
    }
  }

  return null;
}
window.getAreaManagerId = getAreaManagerId;

function populateUnifiedReportEmployeeFilters(user, selectedLineId) {
  const selects = [
    document.getElementById('pharmSalesRepSelect'),
    document.getElementById('achRepSelect'),
    document.getElementById('timelineRepSelect'),
    document.getElementById('coverageRepSelect'),
    document.getElementById('doctorRepSelect'),
    document.getElementById('hospitalRepSelect'),
    document.getElementById('pharmacyRepSelect')
  ].filter(Boolean);

  if (selects.length === 0) return;

  const effectiveLineId = selectedLineId || window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  const lang = getCurrentLang();
  const isAr = lang === 'ar';
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const allUsers = getSharedReportUsers();
  const scopedTeam = window.getScopedTeamForLine
    ? window.getScopedTeamForLine(effectiveLineId, user)
    : allUsers;

  const isRep = role === 'medical_rep' || role === 'rep';
  const isDM = role === 'district_manager' || role === 'dm';

  selects.forEach((selectEl) => {
    const prevVal = selectEl.value;
    selectEl.replaceChildren();

    if (isRep) {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = `${user.name} (${user.employeeCode || 'Rep'})`;
      opt.selected = true;
      selectEl.appendChild(opt);
      selectEl.disabled = true;
      return;
    }

    selectEl.disabled = false;

    // Resolve manager for each vacant area
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    let vacantAreas = allAreas.filter((a) => !a.repId);
    if (effectiveLineId !== 'all') {
      vacantAreas = vacantAreas.filter((a) => a.lineId === effectiveLineId);
    } else if (role !== 'admin' && role !== 'hr') {
      const userLines = window.getUserLines ? window.getUserLines(user?.id) : [];
      const userLineIds = userLines.map((l) => l.id);
      if (userLineIds.length > 0) {
        vacantAreas = vacantAreas.filter((a) => !a.lineId || userLineIds.includes(a.lineId));
      }
    }

    if (isDM) {
      const allLabel = isAr ? 'كل مناديب الخط/الفريق' : 'All Team Reps in Line';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = allLabel;
      selectEl.appendChild(allOpt);

      const reps = scopedTeam.filter((u) => u.id !== user.id && (u.role === 'medical_rep' || u.role === 'rep'));
      appendSelectOptions(selectEl, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || 'Rep'})`);

      // Vacant areas under this DM
      const myVacantAreas = vacantAreas.filter((a) => {
        const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(a, allUsers) : null;
        return mgrId === user.id || (!mgrId && (!a.lineId || (user.lineIds && user.lineIds.includes(a.lineId)) || user.lineId === a.lineId));
      });
      myVacantAreas.forEach((area) => {
        const opt = document.createElement('option');
        opt.value = `vacant:${area.id}`;
        const areaName = isAr && area.nameAr ? area.nameAr : area.name;
        opt.textContent = `📍 [${isAr ? 'شاغرة' : 'Vacant'}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
        selectEl.appendChild(opt);
      });
    } else {
      const allLabel = isAr ? 'جميع الفريق في الخط (الكل)' : 'All Team in Line';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = allLabel;
      selectEl.appendChild(allOpt);

      const dms = scopedTeam.filter((u) => u.id !== user.id && (u.role === 'district_manager' || u.role === 'dm'));
      const reps = scopedTeam.filter((u) => u.id !== user.id && (u.role === 'medical_rep' || u.role === 'rep'));

      if (dms.length > 0) {
        const dmGroup = document.createElement('optgroup');
        dmGroup.label = isAr ? 'مدراء المناطق (District Managers)' : 'District Managers (DMs)';
        appendSelectOptions(dmGroup, dms, (dm) => dm.id, (dm) => `💼 ${dm.name} (${dm.employeeCode || 'DM'})`);
        selectEl.appendChild(dmGroup);

        const assignedVacantIds = new Set();
        dms.forEach((dm) => {
          const dmReps = reps.filter((r) => r.managerId === dm.id);
          const dmVacantAreas = vacantAreas.filter((a) => {
            const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(a, allUsers) : null;
            return mgrId === dm.id;
          });
          dmVacantAreas.forEach((a) => assignedVacantIds.add(a.id));

          if (dmReps.length > 0 || dmVacantAreas.length > 0) {
            const group = document.createElement('optgroup');
            group.label = isAr ? `فريق ${dm.name} (Reps)` : `Team ${dm.name} (Reps)`;
            appendSelectOptions(group, dmReps, (rep) => rep.id, (rep) => `🩺 ${rep.name} (${rep.employeeCode || 'Rep'})`);
            dmVacantAreas.forEach((area) => {
              const opt = document.createElement('option');
              opt.value = `vacant:${area.id}`;
              const areaName = isAr && area.nameAr ? area.nameAr : area.name;
              opt.textContent = `📍 [${isAr ? 'شاغرة' : 'Vacant'}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
              group.appendChild(opt);
            });
            selectEl.appendChild(group);
          }
        });

        const otherReps = reps.filter((r) => !dms.some((dm) => dm.id === r.managerId));
        const unassignedVacant = vacantAreas.filter((a) => !assignedVacantIds.has(a.id));
        if (otherReps.length > 0 || unassignedVacant.length > 0) {
          const group = document.createElement('optgroup');
          group.label = isAr ? 'مناديب ومناطق أخرى' : 'Other Reps & Vacant Areas';
          appendSelectOptions(group, otherReps, (rep) => rep.id, (rep) => `🩺 ${rep.name} (${rep.employeeCode || 'Rep'})`);
          unassignedVacant.forEach((area) => {
            const opt = document.createElement('option');
            opt.value = `vacant:${area.id}`;
            const areaName = isAr && area.nameAr ? area.nameAr : area.name;
            opt.textContent = `📍 [${isAr ? 'شاغرة' : 'Vacant'}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
            group.appendChild(opt);
          });
          selectEl.appendChild(group);
        }
      } else if (reps.length > 0 || vacantAreas.length > 0) {
        const repGroup = document.createElement('optgroup');
        repGroup.label = isAr ? 'المناديب والمناطق (Team)' : 'Team Reps & Areas';
        appendSelectOptions(repGroup, reps, (rep) => rep.id, (rep) => `🩺 ${rep.name} (${rep.employeeCode || 'Rep'})`);
        vacantAreas.forEach((area) => {
          const opt = document.createElement('option');
          opt.value = `vacant:${area.id}`;
          const areaName = isAr && area.nameAr ? area.nameAr : area.name;
          opt.textContent = `📍 [${isAr ? 'شاغرة' : 'Vacant'}] ${areaName}${area.code ? ' (' + area.code + ')' : ''}`;
          repGroup.appendChild(opt);
        });
        selectEl.appendChild(repGroup);
      }
    }

    if (prevVal && Array.from(selectEl.options).some((o) => o.value === prevVal)) {
      selectEl.value = prevVal;
    }
  });

  if (typeof window.populatePharmSalesAreas === 'function') {
    window.populatePharmSalesAreas(user);
  }
  if (typeof window.populateAchAreas === 'function') {
    window.populateAchAreas(user);
  }
}

// Aliases for compatibility
window.populateUnifiedReportEmployeeFilters = populateUnifiedReportEmployeeFilters;
window.populateDirectoryRepFilters = populateUnifiedReportEmployeeFilters;
window.populateTimelineAndCoverageFilters = populateUnifiedReportEmployeeFilters;
window.populateSalesAndAchRepFilters = populateUnifiedReportEmployeeFilters;

function populateLinesFilter(lineSelect, user = null) {
  if (!lineSelect) return;
  const lang = getCurrentLang();
  const allLinesLabel = lang === 'ar' ? 'جميع خطوط الإنتاج (الكل)' : 'All Lines (Select All)';
  lineSelect.innerHTML = `<option value="all">${allLinesLabel}</option>`;
  const allLines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [
    { id: 'line1', name: 'Cardio Line', lineManagerId: 'lm1' }
  ];
  const allUsers = getSharedReportUsers();
  let lines = allLines;
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  if (user && role !== 'admin') {
    const userLines = typeof window.getUserLines === 'function' ? window.getUserLines(user.id) : [];
    if (userLines.length > 0) {
      lines = userLines;
    } else if (role === 'business_unit' || role === 'line_manager' || role === 'district_manager' || role === 'medical_rep' || role === 'rep') {
      lines = [];
    }
  }
  appendSelectOptions(lineSelect, lines, (l) => l.id, (l) => {
    const lm = allUsers.find((u) => u.id === l.lineManagerId);
    return `${l.name} ${lm ? `(${lm.name})` : ''}`;
  });
}

function populateDMsFilter(dmSelect, lmId = null, lineId = null) {
  if (!dmSelect) return;
  const lang = getCurrentLang();
  const allDMsLabel = lang === 'ar' ? 'جميع المناطق ومديريها (الكل)' : 'All Districts & DMs';
  dmSelect.innerHTML = `<option value="all">${allDMsLabel}</option>`;
  const allUsers = getSharedReportUsers();
  const currentUser = checkAuth();
  const role = window.normalizeRole ? window.normalizeRole(currentUser?.role) : (currentUser?.role || '').toLowerCase();

  let dms = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));

  if (role === 'business_unit' && currentUser) {
    const mySubordinates = typeof window.getAllSubordinates === 'function'
      ? window.getAllSubordinates(currentUser.id)
      : [];
    const mySubordinateIds = mySubordinates.map((u) => u.id);
    dms = dms.filter((u) => mySubordinateIds.includes(u.id));
  }

  if (lmId) {
    dms = dms.filter((u) => u.managerId === lmId);
  }
  if (lineId && lineId !== 'all') {
    dms = dms.filter((u) => (u.lineIds && u.lineIds.includes(lineId)) || u.lineId === lineId);
  }
  appendSelectOptions(dmSelect, dms, (d) => d.id, (d) => `${d.name} (${d.employeeCode || d.code || 'DM'})`);
}

function populateRepsFilter(repSelect, dmId = null, lineId = null) {
  if (!repSelect) return;
  const lang = getCurrentLang();
  const allRepsLabel = lang === 'ar' ? 'جميع المناديب (الكل)' : 'All Representatives';
  repSelect.innerHTML = `<option value="all">${allRepsLabel}</option>`;
  const allUsers = getSharedReportUsers();
  const currentUser = checkAuth();
  const role = window.normalizeRole ? window.normalizeRole(currentUser?.role) : (currentUser?.role || '').toLowerCase();

  let reps = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')));

  if (role === 'business_unit' && currentUser) {
    const mySubordinates = typeof window.getAllSubordinates === 'function'
      ? window.getAllSubordinates(currentUser.id)
      : [];
    const mySubordinateIds = mySubordinates.map((u) => u.id);
    reps = reps.filter((u) => mySubordinateIds.includes(u.id));
  }

  if (dmId && dmId !== 'all') {
    reps = reps.filter((u) => u.managerId === dmId);
  }
  if (lineId && lineId !== 'all') {
    reps = reps.filter((u) => (u.lineIds && u.lineIds.includes(lineId)) || u.lineId === lineId);
  }
  appendSelectOptions(repSelect, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || r.code || 'Rep'})`);
}

window.onSalesLineChange = function() {
  const lineSelect = document.getElementById('salesLineSelect');
  const dmSelect = document.getElementById('salesDmSelect');
  const repSelect = document.getElementById('salesRepSelect');
  const user = checkAuth();
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const selectedLineId = lineSelect ? lineSelect.value : 'all';
  if (role === 'district_manager') {
    populateRepsFilter(repSelect, user.id, selectedLineId);
  } else if (role === 'line_manager') {
    populateDMsFilter(dmSelect, user.id, selectedLineId);
    populateRepsFilter(repSelect, null, selectedLineId);
  } else {
    const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    const lineObj = lines.find((l) => l.id === selectedLineId);
    const lmUserId = lineObj ? lineObj.lineManagerId : null;
    populateDMsFilter(dmSelect, lmUserId, selectedLineId);
    populateRepsFilter(repSelect, null, selectedLineId);
  }
  populateProductCheckboxes(selectedLineId);
};

window.onSalesDmChange = function() {
  const lineSelect = document.getElementById('salesLineSelect');
  const dmSelect = document.getElementById('salesDmSelect');
  const repSelect = document.getElementById('salesRepSelect');
  const selectedLineId = lineSelect ? lineSelect.value : 'all';
  const selectedDmId = dmSelect ? dmSelect.value : 'all';
  populateRepsFilter(repSelect, selectedDmId, selectedLineId);
};

// ============================================================================
function printCurrentReport() {
  window.print();
}

// ============================================================================
// Section 13: Modal Cascading Hierarchy (Line/LM -> District/DM -> Med Rep -> Area)
// ============================================================================
function populateModalHierarchy(lmSelectId, dmSelectId, repSelectId, targetRepId = null, areaSelectId = null, targetAreaId = null) {
  const allUsers = getSharedReportUsers();
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const lmSelect = document.getElementById(lmSelectId);
  if (!lmSelect) return;

  // 1. Populate Line / LM options (safe: textContent, not innerHTML)
  renderSelectOptions(
    lmSelect,
    lines,
    (l) => l.id,
    (l) => {
      const lm = allUsers.find((u) => u.id === l.lineManagerId);
      return `${l.name} (${lm ? lm.name : 'LM'})`;
    }
  );

  // 2. Resolve selected Line / LM and District / DM from targetAreaId or targetRepId
  let selectedLineId = lines[0]?.id || '';
  let selectedDmId = null;

  if (targetAreaId) {
    const area = allAreas.find((a) => a.id === targetAreaId);
    if (area) {
      if (area.lineId) selectedLineId = area.lineId;
      if (!targetRepId && area.repId) targetRepId = area.repId;
    }
  }

  if (targetRepId) {
    const rep = allUsers.find((u) => u.id === targetRepId);
    if (rep && rep.managerId) {
      selectedDmId = rep.managerId;
      const dm = allUsers.find((u) => u.id === selectedDmId);
      if (dm && (dm.lineId || dm.managerId)) {
        const line = lines.find((l) => l.lineManagerId === dm.managerId || l.id === dm.lineId);
        if (line) selectedLineId = line.id;
      }
    }
  }
  lmSelect.value = selectedLineId;
  updateModalDMs(lmSelectId, dmSelectId, repSelectId, selectedDmId, targetRepId, areaSelectId, targetAreaId);
}

function updateModalDMs(lmSelectId, dmSelectId, repSelectId, selectedDmId = null, targetRepId = null, areaSelectId = null, targetAreaId = null) {
  const allUsers = getSharedReportUsers();
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const lmSelect = document.getElementById(lmSelectId);
  const dmSelect = document.getElementById(dmSelectId);
  if (!dmSelect) return;
  const currentLineId = lmSelect ? lmSelect.value : (lines[0]?.id || '');
  const lineObj = lines.find((l) => l.id === currentLineId);
  const lmUserId = lineObj ? lineObj.lineManagerId : currentLineId;

  // Filter DMs under selected LM
  const dms = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')) && (!lmUserId || u.managerId === lmUserId));
  renderSelectOptions(dmSelect, dms, (d) => d.id, (d) => `${d.name} (${d.employeeCode || 'DM'})`);

  let activeDmId = selectedDmId && dms.some((d) => d.id === selectedDmId) ? selectedDmId : (dms[0]?.id || '');
  dmSelect.value = activeDmId;
  updateModalReps(dmSelectId, repSelectId, targetRepId, areaSelectId, targetAreaId, lmSelectId);
}

function updateModalReps(dmSelectId, repSelectId, targetRepId = null, areaSelectId = null, targetAreaId = null, lmSelectId = null) {
  const allUsers = getSharedReportUsers();
  const dmSelect = document.getElementById(dmSelectId);
  const repSelect = document.getElementById(repSelectId);
  if (!repSelect) return;
  const currentDmId = dmSelect ? dmSelect.value : '';

  // Filter Medical Reps under selected DM
  const reps = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')) && (!currentDmId || u.managerId === currentDmId));
  renderSelectOptions(repSelect, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || 'Rep'})`);

  if (targetRepId && reps.some((r) => r.id === targetRepId)) {
    repSelect.value = targetRepId;
  } else if (reps.length > 0) {
    repSelect.value = reps[0].id;
  }

  if (areaSelectId) {
    const effLmId = lmSelectId || dmSelectId.replace('DmSelect', 'LmSelect');
    const lmSelect = document.getElementById(effLmId);
    const currentLineId = lmSelect ? lmSelect.value : null;
    updateModalAreas(repSelectId, areaSelectId, targetAreaId, currentLineId);
  }
}

function updateModalAreas(repSelectId, areaSelectId, targetAreaId = null, currentLineId = null) {
  const areaSelect = document.getElementById(areaSelectId);
  if (!areaSelect) return;
  const repSelect = document.getElementById(repSelectId);
  const repId = repSelect ? repSelect.value : null;

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  let matchingAreas = [];
  if (repId) {
    matchingAreas = allAreas.filter((a) => a.repId === repId);
  }
  if (matchingAreas.length === 0 && currentLineId) {
    matchingAreas = allAreas.filter((a) => a.lineId === currentLineId);
  }
  if (matchingAreas.length === 0) {
    matchingAreas = allAreas;
  }

  const isAr = (window.getCurrentLang && window.getCurrentLang() === 'ar');
  const defaultLabel = isAr ? '-- اختر المنطقة البيعية --' : '-- Select Territory / Area --';
  areaSelect.innerHTML = `<option value="">${defaultLabel}</option>`;

  matchingAreas.forEach((a) => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.name}${a.code ? ' (' + a.code + ')' : ''}`;
    areaSelect.appendChild(opt);
  });

  if (targetAreaId && matchingAreas.some((a) => a.id === targetAreaId)) {
    areaSelect.value = targetAreaId;
  } else if (targetAreaId && allAreas.some((a) => a.id === targetAreaId)) {
    const extArea = allAreas.find((a) => a.id === targetAreaId);
    const opt = document.createElement('option');
    opt.value = extArea.id;
    opt.textContent = `${extArea.name}${extArea.code ? ' (' + extArea.code + ')' : ''}`;
    areaSelect.appendChild(opt);
    areaSelect.value = targetAreaId;
  } else if (matchingAreas.length === 1) {
    areaSelect.value = matchingAreas[0].id;
  }
}

function onDoctorModalLmChange() {
  updateModalDMs('doctorModalLmSelect', 'doctorModalDmSelect', 'doctorRepInput', null, null, 'doctorAreaInput');
}

function onDoctorModalDmChange() {
  updateModalReps('doctorModalDmSelect', 'doctorRepInput', null, 'doctorAreaInput', null, 'doctorModalLmSelect');
}

function onDoctorModalRepChange() {
  updateModalAreas('doctorRepInput', 'doctorAreaInput', null, document.getElementById('doctorModalLmSelect')?.value);
}

function onDoctorModalAreaChange() {
  const areaSelect = document.getElementById('doctorAreaInput');
  const repSelect = document.getElementById('doctorRepInput');
  if (areaSelect && repSelect && areaSelect.value) {
    const area = window.store && window.store.areas ? window.store.areas.getById(areaSelect.value) : null;
    if (area && area.repId) {
      if (repSelect.value !== area.repId && Array.from(repSelect.options).some((o) => o.value === area.repId)) {
        repSelect.value = area.repId;
      }
    }
  }
}

function onPharmacyModalLmChange() {
  updateModalDMs('pharmacyModalLmSelect', 'pharmacyModalDmSelect', 'pharmacyRepInput', null, null, 'pharmacyAreaInput');
}

function onPharmacyModalDmChange() {
  updateModalReps('pharmacyModalDmSelect', 'pharmacyRepInput', null, 'pharmacyAreaInput', null, 'pharmacyModalLmSelect');
}

function onPharmacyModalRepChange() {
  updateModalAreas('pharmacyRepInput', 'pharmacyAreaInput', null, document.getElementById('pharmacyModalLmSelect')?.value);
}

function onPharmacyModalAreaChange() {
  const areaSelect = document.getElementById('pharmacyAreaInput');
  const repSelect = document.getElementById('pharmacyRepInput');
  if (areaSelect && repSelect && areaSelect.value) {
    const area = window.store && window.store.areas ? window.store.areas.getById(areaSelect.value) : null;
    if (area && area.repId) {
      if (repSelect.value !== area.repId && Array.from(repSelect.options).some((o) => o.value === area.repId)) {
        repSelect.value = area.repId;
      }
    }
  }
}

function onHospitalModalLmChange() {
  updateModalDMs('hospitalModalLmSelect', 'hospitalModalDmSelect', 'hospitalRepInput', null, null, 'hospitalAreaInput');
}

function onHospitalModalDmChange() {
  updateModalReps('hospitalModalDmSelect', 'hospitalRepInput', null, 'hospitalAreaInput', null, 'hospitalModalLmSelect');
}

function onHospitalModalRepChange() {
  updateModalAreas('hospitalRepInput', 'hospitalAreaInput', null, document.getElementById('hospitalModalLmSelect')?.value);
}

function onHospitalModalAreaChange() {
  const areaSelect = document.getElementById('hospitalAreaInput');
  const repSelect = document.getElementById('hospitalRepInput');
  if (areaSelect && repSelect && areaSelect.value) {
    const area = window.store && window.store.areas ? window.store.areas.getById(areaSelect.value) : null;
    if (area && area.repId) {
      if (repSelect.value !== area.repId && Array.from(repSelect.options).some((o) => o.value === area.repId)) {
        repSelect.value = area.repId;
      }
    }
  }
}

window.populateModalHierarchy = populateModalHierarchy;
window.updateModalDMs = updateModalDMs;
window.updateModalReps = updateModalReps;
window.updateModalAreas = updateModalAreas;
window.onDoctorModalLmChange = onDoctorModalLmChange;
window.onDoctorModalDmChange = onDoctorModalDmChange;
window.onDoctorModalRepChange = onDoctorModalRepChange;
window.onDoctorModalAreaChange = onDoctorModalAreaChange;
window.onPharmacyModalLmChange = onPharmacyModalLmChange;
window.onPharmacyModalDmChange = onPharmacyModalDmChange;
window.onPharmacyModalRepChange = onPharmacyModalRepChange;
window.onPharmacyModalAreaChange = onPharmacyModalAreaChange;
window.onHospitalModalLmChange = onHospitalModalLmChange;
window.onHospitalModalDmChange = onHospitalModalDmChange;
window.onHospitalModalRepChange = onHospitalModalRepChange;
window.onHospitalModalAreaChange = onHospitalModalAreaChange;


// ============================================================================
// Section 14: Excel / CSV Bulk Import Engine (Admin Only)
// ============================================================================
// Global cache for parsed records awaiting import
let pendingDoctorsImport = [];
let pendingPharmaciesImport = [];

/**
 * Universal CSV Parser handling escaped commas and quotes
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r\n|\n|\r/);
  if (!lines.length) return [];
  const parseRow = (line) => {
    const row = [];
    let inQuotes = false;
    let currentCell = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    return row;
  };
  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    data.push(obj);
  }
  return data;
}

/**
 * Helper to download binary Base64 files as authentic XLSX
 */
function downloadBase64Excel(base64Data, filename) {
  try {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download base64 failed, falling back to direct link:', err);
    const link = document.createElement('a');
    link.href = `templates/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Official Template Download Handlers
 */
function downloadDoctorsTemplate() {
  if (window.EXCEL_TEMPLATES && window.EXCEL_TEMPLATES.doctors) {
    downloadBase64Excel(window.EXCEL_TEMPLATES.doctors, 'PharmaCare_Doctors_Template.xlsx');
  } else {
    const link = document.createElement('a');
    link.href = 'templates/PharmaCare_Doctors_Template.xlsx';
    link.download = 'PharmaCare_Doctors_Template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
window.downloadDoctorsTemplate = downloadDoctorsTemplate;

function downloadPharmaciesTemplate() {
  if (window.EXCEL_TEMPLATES && window.EXCEL_TEMPLATES.pharmacies) {
    downloadBase64Excel(window.EXCEL_TEMPLATES.pharmacies, 'PharmaCare_Pharmacies_Template.xlsx');
  } else {
    const link = document.createElement('a');
    link.href = 'templates/PharmaCare_Pharmacies_Template.xlsx';
    link.download = 'PharmaCare_Pharmacies_Template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
window.downloadPharmaciesTemplate = downloadPharmaciesTemplate;

/**
 * Import Modal Controls & Handlers
 */
function openImportDoctorsModal() {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') {
      showToast(getCurrentLang() === 'ar' ? 'غير مصرح: استيراد بيانات الأطباء للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    }
    return;
  }
  const modal = document.getElementById('importDoctorsModal');
  if (modal) modal.style.display = 'flex';

  pendingDoctorsImport = [];
  const fileInput = document.getElementById('doctorsFileInput');
  if (fileInput) fileInput.value = '';
  const fileNameDisplay = document.getElementById('doctorsSelectedFileName');
  if (fileNameDisplay) {
    fileNameDisplay.style.display = 'none';
    fileNameDisplay.textContent = '';
  }
  const previewContainer = document.getElementById('doctorsPreviewContainer');
  if (previewContainer) previewContainer.style.display = 'none';
  const tableBody = document.getElementById('doctorsPreviewTableBody');
  if (tableBody) tableBody.innerHTML = '';
  const badges = document.getElementById('doctorsValidationBadges');
  if (badges) badges.innerHTML = '';
  const confirmBtn = document.getElementById('btnConfirmImportDoctors');
  if (confirmBtn) confirmBtn.disabled = true;

  populateModalHierarchy('importDoctorsLmSelect', 'importDoctorsDmSelect', 'importDoctorsRepSelect');
}
window.openImportDoctorsModal = openImportDoctorsModal;

function closeImportDoctorsModal() {
  const modal = document.getElementById('importDoctorsModal');
  if (modal) modal.style.display = 'none';
  pendingDoctorsImport = [];
}
window.closeImportDoctorsModal = closeImportDoctorsModal;

function onDoctorsImportLmChange() {
  updateModalDMs('importDoctorsLmSelect', 'importDoctorsDmSelect', 'importDoctorsRepSelect');
}
window.onDoctorsImportLmChange = onDoctorsImportLmChange;

function onDoctorsImportDmChange() {
  updateModalReps('importDoctorsDmSelect', 'importDoctorsRepSelect');
}
window.onDoctorsImportDmChange = onDoctorsImportDmChange;

function onDoctorsImportRepChange() {}
window.onDoctorsImportRepChange = onDoctorsImportRepChange;

function handleDoctorsFileSelected(event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) return;

  const fileNameDisplay = document.getElementById('doctorsSelectedFileName');
  if (fileNameDisplay) {
    fileNameDisplay.style.display = 'block';
    fileNameDisplay.textContent = file.name;
  }

  const isAr = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar');

  const processRows = (rows) => {
    if (!rows || !rows.length) {
      if (typeof showToast === 'function') {
        showToast(isAr ? 'الملف المحدد فارغ أو غير متوافق.' : 'Selected file is empty or incompatible.', 'warning');
      }
      return;
    }

    const allUsers = getSharedReportUsers();
    const defaultRepSelect = document.getElementById('importDoctorsRepSelect');
    const defaultRepId = defaultRepSelect ? defaultRepSelect.value : '';

    pendingDoctorsImport = [];
    let validCount = 0;
    let invalidCount = 0;
    const tableRowsHtml = [];

    rows.forEach((r, idx) => {
      const name = String(r.doctorname || r.name || r.doctor || r['اسمالطبيب'] || r['الطبيب'] || '').trim();
      const specialty = String(r.specialty || r.speciality || r.spec || r['التخصص'] || 'Internal Medicine').trim();
      let docClass = String(r.class || r.classification || r['الفئة'] || 'A').trim().toUpperCase();
      if (!['A', 'B', 'C'].includes(docClass)) docClass = 'A';
      const address = String(r.address || r.clinicaddress || r['العنوان'] || '').trim();
      const phone = String(r.phone || r.mobile || r.telephone || r['الهاتف'] || '').trim();

      const repKey = String(r.repcode || r.repid || r.rep || r.assignedrep || r['المندوب'] || '').trim();
      let matchedRep = null;
      if (repKey) {
        matchedRep = allUsers.find((u) => 
          String(u.id).toLowerCase() === repKey.toLowerCase() ||
          String(u.employeeCode || '').toLowerCase() === repKey.toLowerCase() ||
          String(u.code || '').toLowerCase() === repKey.toLowerCase() ||
          String(u.name || '').toLowerCase() === repKey.toLowerCase()
        );
      }
      if (!matchedRep && defaultRepId) {
        matchedRep = allUsers.find((u) => u.id === defaultRepId);
      }

      const isValid = Boolean(name && address);
      if (isValid) {
        validCount++;
        pendingDoctorsImport.push({
          name,
          specialty,
          class: docClass,
          address,
          phone,
          repId: matchedRep ? matchedRep.id : (defaultRepId || 'rep1')
        });
      } else {
        invalidCount++;
      }

      const statusBadge = isValid
        ? `<span class="badge" style="background:#e8f5e9;color:#2e7d32;font-size:0.75rem;padding:2px 8px;border-radius:10px;">${isAr ? 'صالح' : 'Valid'}</span>`
        : `<span class="badge" style="background:#ffebee;color:#c62828;font-size:0.75rem;padding:2px 8px;border-radius:10px;">${isAr ? 'بيانات ناقصة' : 'Missing Data'}</span>`;

      const repName = matchedRep ? matchedRep.name : (isAr ? 'تلقائي' : 'Auto');

      tableRowsHtml.push(`
        <tr>
          <td>${idx + 1}</td>
          <td>${statusBadge}</td>
          <td><strong>${window.escapeHtml(name || '-')}</strong></td>
          <td>${window.escapeHtml(specialty || '-')}</td>
          <td>${window.escapeHtml(docClass)}</td>
          <td>${window.escapeHtml(address || '-')}</td>
          <td>${window.escapeHtml(phone || '-')}</td>
          <td>${window.escapeHtml(repName)}</td>
        </tr>
      `);
    });

    const tableBody = document.getElementById('doctorsPreviewTableBody');
    if (tableBody) tableBody.innerHTML = tableRowsHtml.join('');

    const badgesContainer = document.getElementById('doctorsValidationBadges');
    if (badgesContainer) {
      badgesContainer.innerHTML = `
        <span class="badge" style="background:#e3f2fd;color:#1565c0;margin-right:6px;padding:4px 8px;border-radius:6px;">${isAr ? 'الإجمالي' : 'Total'}: ${rows.length}</span>
        <span class="badge" style="background:#e8f5e9;color:#2e7d32;margin-right:6px;padding:4px 8px;border-radius:6px;">${isAr ? 'صالح' : 'Valid'}: ${validCount}</span>
        ${invalidCount > 0 ? `<span class="badge" style="background:#ffebee;color:#c62828;padding:4px 8px;border-radius:6px;">${isAr ? 'غير مكتمل' : 'Invalid'}: ${invalidCount}</span>` : ''}
      `;
    }

    const previewContainer = document.getElementById('doctorsPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'block';

    const confirmBtn = document.getElementById('btnConfirmImportDoctors');
    if (confirmBtn) confirmBtn.disabled = (validCount === 0);
  };

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const rows = parseCSV(text);
        processRows(rows);
      } catch (err) {
        console.error('CSV parse error:', err);
        if (typeof showToast === 'function') showToast(isAr ? 'خطأ في معالجة ملف CSV' : 'Error parsing CSV file', 'error');
      }
    };
    reader.readAsText(file);
  } else {
    parseExcelFile(file, processRows);
  }
}
window.handleDoctorsFileSelected = handleDoctorsFileSelected;

function confirmImportDoctors() {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  const isAr = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast(isAr ? 'غير مصرح: استيراد بيانات الأطباء للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    return;
  }

  if (!pendingDoctorsImport || !pendingDoctorsImport.length) {
    if (typeof showToast === 'function') showToast(isAr ? 'لا توجد بيانات صالحة للاستيراد.' : 'No valid records to import.', 'warning');
    return;
  }

  const allSpecs = (window.store && window.store.specialties ? window.store.specialties.getAll() : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];

  pendingDoctorsImport.forEach((item, index) => {
    const foundSpec = allSpecs.find((s) => s.name === item.specialty || s.id === item.specialty);
    const specialtyId = foundSpec ? foundSpec.id : 'spec_internal';
    const specialty = foundSpec ? foundSpec.name : item.specialty;
    const specialtyAr = foundSpec ? (foundSpec.nameAr || foundSpec.name) : specialty;

    const doctorObj = {
      id: 'doc_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 4),
      name: item.name,
      specialtyId,
      specialty,
      specialtyAr,
      class: item.class || 'A',
      address: item.address,
      clinicAddress: item.address,
      phone: item.phone || '',
      repId: item.repId,
      visitsThisQuarter: 0
    };

    if (window.store && window.store.doctors) {
      window.store.doctors.save(doctorObj);
    } else {
      if (!window.DEMO_DATA) window.DEMO_DATA = {};
      if (!Array.isArray(window.DEMO_DATA.doctors)) window.DEMO_DATA.doctors = [];
      window.DEMO_DATA.doctors.unshift(doctorObj);
    }
  });

  if (typeof window.saveDataToStorage === 'function') window.saveDataToStorage();

  const importedCount = pendingDoctorsImport.length;
  closeImportDoctorsModal();

  if (typeof showToast === 'function') {
    showToast(isAr ? `تم استيراد ${importedCount} طبيب بنجاح!` : `Successfully imported ${importedCount} doctors!`, 'success');
  }

  if (typeof renderDoctorsReport === 'function') {
    renderDoctorsReport();
  }
}
window.confirmImportDoctors = confirmImportDoctors;

function openImportPharmaciesModal() {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === 'function') {
      showToast(getCurrentLang() === 'ar' ? 'غير مصرح: استيراد بيانات الصيدليات للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    }
    return;
  }
  const modal = document.getElementById('importPharmaciesModal');
  if (modal) modal.style.display = 'flex';

  pendingPharmaciesImport = [];
  const fileInput = document.getElementById('pharmaciesFileInput');
  if (fileInput) fileInput.value = '';
  const fileNameDisplay = document.getElementById('pharmaciesSelectedFileName');
  if (fileNameDisplay) {
    fileNameDisplay.style.display = 'none';
    fileNameDisplay.textContent = '';
  }
  const previewContainer = document.getElementById('pharmaciesPreviewContainer');
  if (previewContainer) previewContainer.style.display = 'none';
  const tableBody = document.getElementById('pharmaciesPreviewTableBody');
  if (tableBody) tableBody.innerHTML = '';
  const badges = document.getElementById('pharmaciesValidationBadges');
  if (badges) badges.innerHTML = '';
  const confirmBtn = document.getElementById('btnConfirmImportPharmacies');
  if (confirmBtn) confirmBtn.disabled = true;

  populateModalHierarchy('importPharmaciesLmSelect', 'importPharmaciesDmSelect', 'importPharmaciesRepSelect');
}
window.openImportPharmaciesModal = openImportPharmaciesModal;

function closeImportPharmaciesModal() {
  const modal = document.getElementById('importPharmaciesModal');
  if (modal) modal.style.display = 'none';
  pendingPharmaciesImport = [];
}
window.closeImportPharmaciesModal = closeImportPharmaciesModal;

function onPharmaciesImportLmChange() {
  updateModalDMs('importPharmaciesLmSelect', 'importPharmaciesDmSelect', 'importPharmaciesRepSelect');
}
window.onPharmaciesImportLmChange = onPharmaciesImportLmChange;

function onPharmaciesImportDmChange() {
  updateModalReps('importPharmaciesDmSelect', 'importPharmaciesRepSelect');
}
window.onPharmaciesImportDmChange = onPharmaciesImportDmChange;

function onPharmaciesImportRepChange() {}
window.onPharmaciesImportRepChange = onPharmaciesImportRepChange;

function handlePharmaciesFileSelected(event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) return;

  const fileNameDisplay = document.getElementById('pharmaciesSelectedFileName');
  if (fileNameDisplay) {
    fileNameDisplay.style.display = 'block';
    fileNameDisplay.textContent = file.name;
  }

  const isAr = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar');

  const processRows = (rows) => {
    if (!rows || !rows.length) {
      if (typeof showToast === 'function') {
        showToast(isAr ? 'الملف المحدد فارغ أو غير متوافق.' : 'Selected file is empty or incompatible.', 'warning');
      }
      return;
    }

    const allUsers = getSharedReportUsers();
    const defaultRepSelect = document.getElementById('importPharmaciesRepSelect');
    const defaultRepId = defaultRepSelect ? defaultRepSelect.value : '';

    pendingPharmaciesImport = [];
    let validCount = 0;
    let invalidCount = 0;
    const tableRowsHtml = [];

    rows.forEach((r, idx) => {
      const name = String(r.pharmacyname || r.name || r.pharmacy || r['اسمالصيدلية'] || r['الصيدلية'] || '').trim();
      const address = String(r.address || r['العنوان'] || '').trim();
      const contactPerson = String(r.contactperson || r.contact || r['المسؤول'] || '').trim();
      const phone = String(r.phone || r.mobile || r.telephone || r['الهاتف'] || '').trim();

      const repKey = String(r.repcode || r.repid || r.rep || r.assignedrep || r['المندوب'] || '').trim();
      let matchedRep = null;
      if (repKey) {
        matchedRep = allUsers.find((u) => 
          String(u.id).toLowerCase() === repKey.toLowerCase() ||
          String(u.employeeCode || '').toLowerCase() === repKey.toLowerCase() ||
          String(u.code || '').toLowerCase() === repKey.toLowerCase() ||
          String(u.name || '').toLowerCase() === repKey.toLowerCase()
        );
      }
      if (!matchedRep && defaultRepId) {
        matchedRep = allUsers.find((u) => u.id === defaultRepId);
      }

      const isValid = Boolean(name && address);
      if (isValid) {
        validCount++;
        pendingPharmaciesImport.push({
          name,
          address,
          contactPerson,
          phone,
          repId: matchedRep ? matchedRep.id : (defaultRepId || 'rep1')
        });
      } else {
        invalidCount++;
      }

      const statusBadge = isValid
        ? `<span class="badge" style="background:#e8f5e9;color:#2e7d32;font-size:0.75rem;padding:2px 8px;border-radius:10px;">${isAr ? 'صالح' : 'Valid'}</span>`
        : `<span class="badge" style="background:#ffebee;color:#c62828;font-size:0.75rem;padding:2px 8px;border-radius:10px;">${isAr ? 'بيانات ناقصة' : 'Missing Data'}</span>`;

      const repName = matchedRep ? matchedRep.name : (isAr ? 'تلقائي' : 'Auto');

      tableRowsHtml.push(`
        <tr>
          <td>${idx + 1}</td>
          <td>${statusBadge}</td>
          <td><strong>${window.escapeHtml(name || '-')}</strong></td>
          <td>${window.escapeHtml(address || '-')}</td>
          <td>${window.escapeHtml(contactPerson || '-')}</td>
          <td>${window.escapeHtml(phone || '-')}</td>
          <td>${window.escapeHtml(repName)}</td>
        </tr>
      `);
    });

    const tableBody = document.getElementById('pharmaciesPreviewTableBody');
    if (tableBody) tableBody.innerHTML = tableRowsHtml.join('');

    const badgesContainer = document.getElementById('pharmaciesValidationBadges');
    if (badgesContainer) {
      badgesContainer.innerHTML = `
        <span class="badge" style="background:#e3f2fd;color:#1565c0;margin-right:6px;padding:4px 8px;border-radius:6px;">${isAr ? 'الإجمالي' : 'Total'}: ${rows.length}</span>
        <span class="badge" style="background:#e8f5e9;color:#2e7d32;margin-right:6px;padding:4px 8px;border-radius:6px;">${isAr ? 'صالح' : 'Valid'}: ${validCount}</span>
        ${invalidCount > 0 ? `<span class="badge" style="background:#ffebee;color:#c62828;padding:4px 8px;border-radius:6px;">${isAr ? 'غير مكتمل' : 'Invalid'}: ${invalidCount}</span>` : ''}
      `;
    }

    const previewContainer = document.getElementById('pharmaciesPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'block';

    const confirmBtn = document.getElementById('btnConfirmImportPharmacies');
    if (confirmBtn) confirmBtn.disabled = (validCount === 0);
  };

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const rows = parseCSV(text);
        processRows(rows);
      } catch (err) {
        console.error('CSV parse error:', err);
        if (typeof showToast === 'function') showToast(isAr ? 'خطأ في معالجة ملف CSV' : 'Error parsing CSV file', 'error');
      }
    };
    reader.readAsText(file);
  } else {
    parseExcelFile(file, processRows);
  }
}
window.handlePharmaciesFileSelected = handlePharmaciesFileSelected;

function confirmImportPharmacies() {
  const user = checkAuth();
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  const isAr = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar');
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast(isAr ? 'غير مصرح: استيراد بيانات الصيدليات للأدمن فقط.' : 'Permission Denied: Admin only.', 'error');
    return;
  }

  if (!pendingPharmaciesImport || !pendingPharmaciesImport.length) {
    if (typeof showToast === 'function') showToast(isAr ? 'لا توجد بيانات صالحة للاستيراد.' : 'No valid records to import.', 'warning');
    return;
  }

  pendingPharmaciesImport.forEach((item, index) => {
    const pharmacyObj = {
      id: 'pharm_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 4),
      name: item.name,
      address: item.address,
      contactPerson: item.contactPerson || '',
      phone: item.phone || '',
      repId: item.repId
    };

    if (window.store && window.store.pharmacies) {
      window.store.pharmacies.save(pharmacyObj);
    } else {
      if (!window.DEMO_DATA) window.DEMO_DATA = {};
      if (!Array.isArray(window.DEMO_DATA.pharmacies)) window.DEMO_DATA.pharmacies = [];
      window.DEMO_DATA.pharmacies.unshift(pharmacyObj);
    }
  });

  if (typeof window.saveDataToStorage === 'function') window.saveDataToStorage();

  const importedCount = pendingPharmaciesImport.length;
  closeImportPharmaciesModal();

  if (typeof showToast === 'function') {
    showToast(isAr ? `تم استيراد ${importedCount} صيدلية بنجاح!` : `Successfully imported ${importedCount} pharmacies!`, 'success');
  }

  if (typeof renderPharmaciesReport === 'function') {
    renderPharmaciesReport();
  }
}
window.confirmImportPharmacies = confirmImportPharmacies;

/**
 * Parse an Excel file (.xlsx, .xls) using SheetJS into normalized objects
 */
function parseExcelFile(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      if (typeof XLSX === 'undefined') {
        const msg = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar')
          ? 'مكتبة قراءة الإكسيل غير محملة. يرجى التأكد من الاتصال بالإنترنت.'
          : 'SheetJS library not loaded. Please ensure you are connected to the internet.';
        if (typeof showToast === 'function') showToast(msg, 'error');
        else if (typeof window.showToast === 'function') window.showToast(msg, 'error');
        return;
      }
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      // Normalize object keys to lowercase alphanumeric (same as parseCSV)
      const normalizedRows = rawJson.map((row) => {
        const cleanObj = {};
        Object.keys(row).forEach((k) => {
          const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          cleanObj[cleanKey] = String(row[k] || '').trim();
        });
        return cleanObj;
      });
      callback(normalizedRows);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      const errMsg = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar')
        ? 'خطأ في معالجة ملف الإكسيل. يرجى التأكد من صحة الملف وصيغته.'
        : 'Error parsing Excel file. Please make sure the file is a valid spreadsheet.';
      if (typeof showToast === 'function') showToast(errMsg, 'error');
      else if (typeof window.showToast === 'function') window.showToast(errMsg, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Generic Excel (.xlsx) or UTF-8 CSV exporter with BOM
 */
function downloadExcelOrCsv(filename, sheetName, dataRows, headers) {
  const isAr = (typeof getCurrentLang === 'function' && getCurrentLang() === 'ar');
  if (typeof XLSX !== 'undefined') {
    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-fit column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = (h ? h.toString().length : 10);
      dataRows.forEach((row) => {
        const cell = row[i];
        if (cell !== null && cell !== undefined) {
          const len = cell.toString().length;
          if (len > maxLen) maxLen = Math.min(len, 50);
        }
      });
      return { wch: Math.max(maxLen + 4, 14) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    const successMsg = isAr ? 'تم تصدير ملف الإكسيل بنجاح (.xlsx)' : 'Excel file exported successfully (.xlsx)';
    if (typeof showToast === 'function') showToast(successMsg, 'success');
  } else {
    // Fallback to UTF-8 CSV with BOM
    const escapeCsv = (val) => {
      const s = val === null || val === undefined ? '' : String(val);
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const csvContent = [headers.map(escapeCsv).join(','), ...dataRows.map((r) => r.map(escapeCsv).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const successMsg = isAr ? 'تم تصدير الملف بنجاح (.csv)' : 'Directory exported successfully (.csv)';
    if (typeof showToast === 'function') showToast(successMsg, 'success');
  }
}
window.downloadExcelOrCsv = downloadExcelOrCsv;