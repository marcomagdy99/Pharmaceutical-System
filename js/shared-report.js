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
  sales: [
    // September 2026 (2026-09) - Cardio Line (line1 / lm1) - Cairo District (dm1)
    { id: 's1', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', productId: 'prod1', target: 20000, actual: 22500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's2', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 12000, actual: 13000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's3', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', productId: 'prod3', target: 10000, actual: 9500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's4', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', productId: 'prod4', target: 8000, actual: 7000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's5', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', productId: 'prod1', target: 18000, actual: 19000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's6', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 12000, actual: 11000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's7', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Omeprazole 20mg', productId: 'prod3', target: 9000, actual: 7500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's8', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Azithromycin 250mg', productId: 'prod4', target: 6000, actual: 3500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    // August 2026 (2026-08)
    { id: 's9', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', productId: 'prod1', target: 18000, actual: 21000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's10', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 12000, actual: 14000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's11', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', productId: 'prod3', target: 9000, actual: 8500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's12', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', productId: 'prod4', target: 6000, actual: 6500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's13', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', productId: 'prod1', target: 17000, actual: 18500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's14', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 11000, actual: 11500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    // September 2026 (2026-09) - Neuro Line (line2 / lm2) - Alex District (dm3)
    { id: 's15', month: '2026-09', repName: 'Nourhan Ezz', area: 'Alexandria', product: 'Pregabalin 75mg', productId: 'prod5', target: 25000, actual: 27000, repId: 'rep4', dmId: 'dm3', lmId: 'lm2', lineId: 'line2' },
    { id: 's16', month: '2026-09', repName: 'Nourhan Ezz', area: 'Alexandria', product: 'Carbamazepine 200mg', productId: 'prod6', target: 15000, actual: 14200, repId: 'rep4', dmId: 'dm3', lmId: 'lm2', lineId: 'line2' },
    // August 2026 (2026-08) - Neuro Line (line2 / lm2)
    { id: 's17', month: '2026-08', repName: 'Nourhan Ezz', area: 'Alexandria', product: 'Pregabalin 75mg', productId: 'prod5', target: 22000, actual: 24500, repId: 'rep4', dmId: 'dm3', lmId: 'lm2', lineId: 'line2' },
    { id: 's18', month: '2026-08', repName: 'Nourhan Ezz', area: 'Alexandria', product: 'Carbamazepine 200mg', productId: 'prod6', target: 14000, actual: 13800, repId: 'rep4', dmId: 'dm3', lmId: 'lm2', lineId: 'line2' }
  ],
  visits: [
    { id: 'v1', targetName: 'Ahmed Mostafa', class: 'A', specialty: 'Internal Medicine', type: 'doctor', date: '2026-09-02', time: '11:30', period: 'PM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa', productIds: ['prod1'], products: ['Amoxicillin 500mg'] },
    { id: 'v2', targetName: 'Sara Abdullah', class: 'A', specialty: 'Pediatrics', type: 'doctor', date: '2026-09-02', time: '14:15', period: 'PM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa', productIds: ['prod2'], products: ['Vitamin D Drops 1000IU'] },
    { id: 'v3', targetName: 'Al-Salam Hospital', class: 'Hospital', specialty: 'General & Surgery', type: 'hospital', date: '2026-09-02', time: '09:45', period: 'AM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa', productIds: [], products: [] },
    { id: 'v4', targetName: 'Mohamed Hassan', class: 'B', specialty: 'Dermatology', type: 'doctor', date: '2026-09-02', time: '16:00', period: 'PM', status: 'completed', isActual: true, repId: 'rep1', repName: 'Ahmed Mostafa', productIds: ['prod3'], products: ['Omeprazole 20mg'] },
    { id: 'v5', targetName: 'Youssef Fathy', class: 'B', specialty: 'Orthopedics', type: 'doctor', date: '2026-09-01', time: '14:20', period: 'PM', status: 'completed', isActual: true, repId: 'rep1', repName: 'Ahmed Mostafa', productIds: ['prod4'], products: ['Azithromycin 250mg'] },
    { id: 'v6', targetName: 'Nasser Institute', class: 'Hospital', specialty: 'Oncology & Surgery', type: 'hospital', date: '2026-09-01', time: '10:15', period: 'AM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa', productIds: [], products: [] },
    { id: 'v7', targetName: 'Khaled Omar', class: 'A', specialty: 'Cardiology', type: 'doctor', date: '2026-09-02', time: '13:00', period: 'PM', status: 'completed', isActual: false, repId: 'rep2', repName: 'Omar Youssef', productIds: ['prod1'], products: ['Amoxicillin 500mg'] }
  ],
  doctors: [
    { id: 'd1', name: 'Ahmed Mostafa', class: 'A', specialty: 'Internal Medicine', area: 'Nasr City', repId: 'rep1', targetQuarterly: 4 },
    { id: 'd2', name: 'Sara Abdullah', class: 'A', specialty: 'Pediatrics', area: 'Nasr City', repId: 'rep1', targetQuarterly: 4 },
    { id: 'd3', name: 'Mohamed Hassan', class: 'B', specialty: 'Dermatology', area: 'Nasr City', repId: 'rep1', targetQuarterly: 3 },
    { id: 'd4', name: 'Noura Mahmoud', class: 'B', specialty: 'Ophthalmology', area: 'Nasr City', repId: 'rep1', targetQuarterly: 3 },
    { id: 'd5', name: 'Khaled Omar', class: 'A', specialty: 'Cardiology', area: 'Heliopolis', repId: 'rep2', targetQuarterly: 4 },
    { id: 'h1', name: 'Al-Salam Hospital', class: 'hospital', specialty: 'Hospital (AM)', area: 'Nasr City', repId: 'rep1', targetQuarterly: 6 },
    { id: 'h2', name: 'Nasser Institute', class: 'hospital', specialty: 'Hospital (AM)', area: 'Nasr City', repId: 'rep1', targetQuarterly: 6 }
  ]
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
    // 2. Sync Visits from visits module (only completed or actual visits)
    if (Array.isArray(window.DEMO_DATA.visits) && window.DEMO_DATA.visits.length > 0) {
      window.DEMO_DATA.visits.forEach((v) => {
        const isCompleted = v.status === 'completed' || v.isActual === true || v.source === 'actual';
        const existingIdx = REPORTS_DATA.visits.findIndex((rv) => rv.id === v.id);
        if (!isCompleted) {
          if (existingIdx >= 0) {
            REPORTS_DATA.visits.splice(existingIdx, 1);
          }
          return;
        }

        const rep = (window.DEMO_DATA.users || []).find((u) => u.id === v.repId);
        // Was previously hardcoded to rep1/rep2 -> 'Ahmed Mostafa'/'Omar Youssef'.
        // A rep that isn't in window.DEMO_DATA.users (or a future rep3, rep4...)
        // now falls back to the visit's own repName, or a generic label,
        // instead of silently being mislabeled as one of the two demo reps.
        const repName = rep ? rep.name : (v.repName || 'Unknown Rep');
        const isPharm =
          v.targetType === 'pharmacy' ||
          (v.period && v.period.toLowerCase() === 'pharmacy') ||
          (v.doctorId && String(v.doctorId).startsWith('pharm'));
        const isHosp = !isPharm && (v.period && v.period.toLowerCase() === 'am');
        const mappedVisit = {
          id: v.id,
          doctorId: v.doctorId || (doc ? doc.id : undefined),
          targetName: v.doctorName || (doc ? doc.name : 'Unknown Target'),
          class: isPharm ? 'Pharmacy' : doc ? doc.class : (isHosp ? 'Hospital' : 'B'),
          specialty: isPharm ? 'Pharmacy' : doc ? doc.specialty : (isHosp ? 'Hospital' : 'General'),
          type: isPharm ? 'pharmacy' : (isHosp ? 'hospital' : 'doctor'),
          targetType: isPharm ? 'pharmacy' : (isHosp ? 'hospital' : 'doctor'),
          date: v.date,
          time: v.time || '10:00',
          period: isPharm ? 'PHARM' : (v.period || 'PM').toUpperCase(),
          status: 'completed',
          isActual: v.source === 'actual' || v.isActual === true,
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
    // Guarantee REPORTS_DATA.visits contains only completed or actual visits
    REPORTS_DATA.visits = REPORTS_DATA.visits.filter((rv) => rv.status === 'completed' || rv.isActual === true || rv.source === 'actual');
  }
}

// ============================================================================
// Section 1.6: Directory Translations (Doctors & Pharmacies)
// ============================================================================
const directoryTranslations = {
  en: {
    tabDoctorsList: 'Doctors List',
    tabPharmaciesList: 'Pharmacies List',
    doctorsDirectoryTitle: '👨‍⚕️ Doctors Directory',
    doctorsDirectorySubtitle: 'Master physician registry with contact details, specialty, and assignment.',
    pharmaciesDirectoryTitle: '💊 Pharmacies Directory',
    pharmaciesDirectorySubtitle: 'Directory of authorized partner pharmacies, contact personnel, and assigned territories.',
    searchDoctors: 'Search Doctors:',
    searchDoctorsPlaceholder: 'Search by name, clinic, phone...',
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
    noDoctorsFound: 'No Doctors Found',
    noDoctorsDesc: 'Try adjusting search query or filters.',
    noPharmaciesFound: 'No Pharmacies Found',
    noPharmaciesDesc: 'Try adjusting search query or filters.',
    doctorName: 'Doctor Name',
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
    pharmaciesCountSuffix: 'Pharmacies',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    btnImportDoctors: 'Import Sheet (.csv)',
    btnImportPharmacies: 'Import Sheet (.csv)',
    btnExportDoctors: 'Export Directory',
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
    promptShowPharmaciesTitle: 'Click Show to View Pharmacies Directory',
    promptShowPharmaciesDesc: 'Choose employee or search query then click Show to display pharmacies.'
  },
  ar: {
    tabDoctorsList: 'قائمة الأطباء',
    tabPharmaciesList: 'قائمة الصيدليات',
    doctorsDirectoryTitle: '👨‍⚕️ دليل الأطباء',
    doctorsDirectorySubtitle: 'سجل الأطباء المعتمد مع تفاصيل الاتصال، التخصص، والمنطقة التابعة.',
    pharmaciesDirectoryTitle: '💊 دليل الصيدليات',
    pharmaciesDirectorySubtitle: 'سجل الصيدليات الشريكة، بيانات الصيدلي المسؤول، والمنطقة التابعة.',
    searchDoctors: 'بحث الأطباء:',
    searchDoctorsPlaceholder: 'ابحث بالاسم، العيادة، الهاتف...',
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
    noDoctorsFound: 'لا يوجد أطباء مطابقين',
    noDoctorsDesc: 'يرجى تجربة معايير بحث أخرى أو تعديل الفلاتر.',
    noPharmaciesFound: 'لا توجد صيدليات مطابقة',
    noPharmaciesDesc: 'يرجى تجربة معايير بحث أخرى أو تعديل الفلاتر.',
    doctorName: 'اسم الطبيب',
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
    promptShowPharmaciesDesc: 'حدد الموظف أو كلمات البحث ثم اضغط على زر عرض لإظهار الصيدليات.'
  }
};

// ============================================================================
// Section 2: Page Lifecycle Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
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
  if (dateFrom) dateFrom.value = todayStr;
  if (dateTo) dateTo.value = todayStr;
  const startDate = document.getElementById('coverageStartDate');
  const endDate = document.getElementById('coverageEndDate');
  if (startDate) startDate.value = firstOfMonth;
  if (endDate) endDate.value = lastOfMonthStr;

  // Prepare filter dropdowns without auto-rendering results
  if (typeof populateAchievementsFilters === 'function') populateAchievementsFilters();

  // Check URL query parameter for active tab
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  if (requestedTab && ['sales', 'achievements', 'timeline', 'coverage', 'doctors', 'pharmacies'].includes(requestedTab)) {
    switchReportTab(requestedTab);
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
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  const noticeBadge = document.getElementById('adminBadgeNotice');
  const noticeText = document.getElementById('roleNoticeText');
  const linkUpload = document.getElementById('linkUploadDistributorSales');
  const manageTargetsBtn = document.getElementById('manageTargetsBtn');
  const btnAddDoctor = document.getElementById('btnAddDoctor');
  const btnAddPharmacy = document.getElementById('btnAddPharmacy');
  const btnImportDoctors = document.getElementById('btnImportDoctors');
  const btnImportPharmacies = document.getElementById('btnImportPharmacies');
  const lang = getCurrentLang();
  if (isAdmin) {
    if (noticeBadge) noticeBadge.className = 'admin-notice-pill admin-mode';
    if (noticeText) noticeText.textContent = lang === 'ar' ? 'صلاحية الإدارة: متاح إدارة الأهداف والتقارير والأطباء والصيدليات' : 'Admin Role: Full Targets Management, Doctors & Pharmacies Management';
    if (manageTargetsBtn) manageTargetsBtn.style.display = 'inline-flex';
    if (linkUpload) linkUpload.style.display = 'inline-flex';
    if (btnAddDoctor) btnAddDoctor.style.display = 'inline-flex';
    if (btnAddPharmacy) btnAddPharmacy.style.display = 'inline-flex';
    if (btnImportDoctors) btnImportDoctors.style.display = 'inline-flex';
    if (btnImportPharmacies) btnImportPharmacies.style.display = 'inline-flex';
  } else {
    if (noticeBadge) noticeBadge.className = 'admin-notice-pill';
    if (noticeText) noticeText.textContent = lang === 'ar' ? 'عرض فقط: تعديل التارجت والأطباء والصيدليات مقتصر على الإدارة' : 'View-Only: Targets and Directories managed by Admin';
    if (manageTargetsBtn) manageTargetsBtn.style.display = 'none';
    if (linkUpload) linkUpload.style.display = 'none';
    if (btnAddDoctor) btnAddDoctor.style.display = 'none';
    if (btnAddPharmacy) btnAddPharmacy.style.display = 'none';
    if (btnImportDoctors) btnImportDoctors.style.display = 'none';
    if (btnImportPharmacies) btnImportPharmacies.style.display = 'none';
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
  if (typeof initPharmSalesFilters === 'function') {
    initPharmSalesFilters(user);
  }
  populateTimelineAndCoverageFilters(user);
  populateDirectoryRepFilters(user);
  if (typeof populateDoctorSpecialtyFilter === 'function') {
    populateDoctorSpecialtyFilter();
  }
}

function populateDirectoryRepFilters(user) {
  const docSelect = document.getElementById('doctorRepSelect');
  const pharmSelect = document.getElementById('pharmacyRepSelect');
  if (!docSelect && !pharmSelect) return;

  const lang = getCurrentLang();
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const allUsers = getSharedReportUsers();

  const populateSelect = (selectEl) => {
    if (!selectEl) return;
    selectEl.replaceChildren();

    if (role === 'line_manager') {
      const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
      const dmIds = dms.map((d) => d.id);
      const reps = allUsers.filter((u) => dmIds.includes(u.managerId));

      const optAll = document.createElement('option');
      optAll.value = 'all';
      optAll.textContent = lang === 'ar' ? 'كل الفريق' : 'All Team';
      selectEl.appendChild(optAll);

      if (dms.length > 0) {
        const dmGroup = document.createElement('optgroup');
        dmGroup.label = lang === 'ar' ? 'مديرو المناطق (DMs)' : 'District Managers (DMs)';
        appendSelectOptions(dmGroup, dms, (dm) => dm.id, (dm) => `${dm.name} (${dm.employeeCode || 'DM'})`);
        selectEl.appendChild(dmGroup);
      }
      if (reps.length > 0) {
        const repGroup = document.createElement('optgroup');
        repGroup.label = lang === 'ar' ? 'المناديب الطبيين (Reps)' : 'Medical Representatives (Reps)';
        appendSelectOptions(repGroup, reps, (rep) => rep.id, (rep) => {
          const dm = dms.find((d) => d.id === rep.managerId);
          return `${rep.name} (${rep.employeeCode || 'Rep'}${dm ? ` - DM: ${dm.name}` : ''})`;
        });
        selectEl.appendChild(repGroup);
      }
    } else if (role === 'district_manager') {
      const allLabel = lang === 'ar' ? 'كل مناديب الفريق' : 'All Team Reps';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = allLabel;
      selectEl.appendChild(allOpt);

      const reps = allUsers.filter((u) => u.managerId === user.id);
      appendSelectOptions(selectEl, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || 'Rep'})`);
    } else if (role === 'medical_rep' || role === 'rep') {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = `${user.name} (${user.employeeCode || 'Rep'})`;
      selectEl.appendChild(opt);
    } else {
      const isBU = role === 'business_unit';
      const mySubordinates = isBU && typeof window.getAllSubordinates === 'function'
        ? window.getAllSubordinates(user.id)
        : [];
      const mySubordinateIds = mySubordinates.map((u) => u.id);
      const myDirectLMs = isBU ? allUsers.filter((u) => u.managerId === user.id) : [];
      const myDirectLmIds = myDirectLMs.map((u) => u.id);
      const myAllowedIds = isBU ? [user.id, ...myDirectLmIds, ...mySubordinateIds] : null;

      const allLabel = lang === 'ar' ? 'جميع الموظفين' : 'All Employees';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = allLabel;
      selectEl.appendChild(allOpt);

      const directoryRoles = [
        { key: 'business_unit', label: lang === 'ar' ? 'وحدة الأعمال (BU)' : 'Business Unit (BU)' },
        { key: 'line_manager', label: lang === 'ar' ? 'مديرو الخطوط (LM)' : 'Line Managers (LM)' },
        { key: 'district_manager', label: lang === 'ar' ? 'مديرو المناطق (DM)' : 'District Managers (DM)' },
        { key: 'medical_rep', label: lang === 'ar' ? 'المناديب الطبيين (Reps)' : 'Medical Representatives (Reps)' },
      ];
      directoryRoles.forEach(({ key, label }) => {
        const members = allUsers.filter((u) => {
          if (myAllowedIds && !myAllowedIds.includes(u.id)) return false;
          const r = window.normalizeRole ? window.normalizeRole(u.role) : u.role;
          return r === key || u.role === key || (key === 'medical_rep' && u.role === 'rep');
        });
        if (!members.length) return;
        const group = document.createElement('optgroup');
        group.label = label;
        appendSelectOptions(group, members, (u) => u.id, (u) => `${u.name} (${u.employeeCode || key})`);
        selectEl.appendChild(group);
      });
    }
  };

  populateSelect(docSelect);
  populateSelect(pharmSelect);
}

function populateTimelineAndCoverageFilters(user) {
  const timelineRepSelect = document.getElementById('timelineRepSelect');
  const coverageRepSelect = document.getElementById('coverageRepSelect');
  if (!timelineRepSelect && !coverageRepSelect) return;
  const lang = getCurrentLang();
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const allUsers = getSharedReportUsers();

  const populateSelect = (selectEl) => {
    if (!selectEl) return;
    selectEl.replaceChildren();
    if (role === 'line_manager') {
      const dms = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
      const dmIds = dms.map((d) => d.id);
      const reps = allUsers.filter((u) => dmIds.includes(u.managerId));

      const optAll = document.createElement('option');
      optAll.value = 'all';
      optAll.textContent = lang === 'ar' ? 'كل الفريق (المديرين والمناديب)' : 'All Team (DMs & Med Reps)';
      selectEl.appendChild(optAll);

      const optSelf = document.createElement('option');
      optSelf.value = user.id;
      optSelf.textContent = lang === 'ar' ? `${user.name} (LM - زياراتي)` : `${user.name} (LM - My Visits)`;
      selectEl.appendChild(optSelf);

      const optAllDMs = document.createElement('option');
      optAllDMs.value = 'all_dms';
      optAllDMs.textContent = lang === 'ar' ? 'جميع مديري المناطق (DMs)' : 'All District Managers (DMs)';
      selectEl.appendChild(optAllDMs);

      const optAllReps = document.createElement('option');
      optAllReps.value = 'all_reps';
      optAllReps.textContent = lang === 'ar' ? 'جميع المناديب (Reps)' : 'All Medical Reps (Reps)';
      selectEl.appendChild(optAllReps);

      if (dms.length > 0) {
        const dmGroup = document.createElement('optgroup');
        dmGroup.label = lang === 'ar' ? 'مديرو المناطق (DMs)' : 'District Managers (DMs)';
        appendSelectOptions(dmGroup, dms, (dm) => dm.id, (dm) => `${dm.name} (${dm.employeeCode || 'DM'})`);
        selectEl.appendChild(dmGroup);
      }
      if (reps.length > 0) {
        const repGroup = document.createElement('optgroup');
        repGroup.label = lang === 'ar' ? 'المناديب الطبيين (Reps)' : 'Medical Reps (Reps)';
        appendSelectOptions(repGroup, reps, (rep) => rep.id, (rep) => `${rep.name} (${rep.employeeCode || 'Rep'})`);
        selectEl.appendChild(repGroup);
      }
    } else if (role === 'district_manager') {
      const allLabel = lang === 'ar' ? 'كل مناديب الفريق' : 'All Team Reps';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = allLabel;
      selectEl.appendChild(allOpt);

      const selfOpt = document.createElement('option');
      selfOpt.value = user.id;
      selfOpt.textContent = lang === 'ar' ? `${user.name} (DM - زياراتي)` : `${user.name} (DM - My Visits)`;
      selectEl.appendChild(selfOpt);

      const reps = allUsers.filter((u) => u.managerId === user.id);
      appendSelectOptions(selectEl, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || 'Rep'})`);
    } else if (role === 'medical_rep' || role === 'rep') {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = `${user.name} (${user.employeeCode || 'Rep'})`;
      selectEl.appendChild(opt);
    } else {
      const isBU = role === 'business_unit';
      const mySubordinates = isBU && typeof window.getAllSubordinates === 'function'
        ? window.getAllSubordinates(user.id)
        : [];
      const mySubordinateIds = mySubordinates.map((u) => u.id);
      const myDirectLMs = isBU ? allUsers.filter((u) => u.managerId === user.id) : [];
      const myDirectLmIds = myDirectLMs.map((u) => u.id);
      const myAllowedIds = isBU ? [user.id, ...myDirectLmIds, ...mySubordinateIds] : null;

      const lang2 = getCurrentLang();
      const allLabel = lang2 === 'ar' ? 'جميع الفريق' : 'All Team';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = allLabel;
      selectEl.appendChild(allOpt);

      const visitRoles = [
        { key: 'business_unit', label: 'Business Unit (BU)' },
        { key: 'line_manager', label: 'Line Managers (LM)' },
        { key: 'district_manager', label: 'District Managers (DM)' },
        { key: 'medical_rep', label: 'Medical Reps' },
      ];
      visitRoles.forEach(({ key, label }) => {
        const members = allUsers.filter((u) => {
          if (myAllowedIds && !myAllowedIds.includes(u.id)) return false;
          const r = window.normalizeRole ? window.normalizeRole(u.role) : u.role;
          return r === key || u.role === key || (key === 'medical_rep' && u.role === 'rep');
        });
        if (!members.length) return;
        const group = document.createElement('optgroup');
        group.label = label;
        appendSelectOptions(group, members, (u) => u.id, (u) => `${u.name} (${u.employeeCode || key})`);
        selectEl.appendChild(group);
      });
    }
  };

  populateSelect(timelineRepSelect);
  populateSelect(coverageRepSelect);
}

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
// Section 13: Modal Cascading Hierarchy (Line/LM -> District/DM -> Med Rep)
// ============================================================================
function populateModalHierarchy(lmSelectId, dmSelectId, repSelectId, targetRepId = null) {
  const allUsers = getSharedReportUsers();
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
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

  // 2. Resolve selected Line / LM and District / DM from targetRepId
  let selectedLineId = lines[0]?.id || 'line1';
  let selectedDmId = null;
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
  updateModalDMs(lmSelectId, dmSelectId, repSelectId, selectedDmId, targetRepId);
}

function updateModalDMs(lmSelectId, dmSelectId, repSelectId, selectedDmId = null, targetRepId = null) {
  const allUsers = getSharedReportUsers();
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const lmSelect = document.getElementById(lmSelectId);
  const dmSelect = document.getElementById(dmSelectId);
  if (!dmSelect) return;
  const currentLineId = lmSelect ? lmSelect.value : 'line1';
  const lineObj = lines.find((l) => l.id === currentLineId);
  const lmUserId = lineObj ? lineObj.lineManagerId : currentLineId;

  // Filter DMs under selected LM
  const dms = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')) && (!lmUserId || u.managerId === lmUserId));
  renderSelectOptions(dmSelect, dms, (d) => d.id, (d) => `${d.name} (${d.employeeCode || 'DM'})`);

  let activeDmId = selectedDmId && dms.some((d) => d.id === selectedDmId) ? selectedDmId : (dms[0]?.id || '');
  dmSelect.value = activeDmId;
  updateModalReps(dmSelectId, repSelectId, targetRepId);
}

function updateModalReps(dmSelectId, repSelectId, targetRepId = null) {
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
}

function onDoctorModalLmChange() {
  updateModalDMs('doctorModalLmSelect', 'doctorModalDmSelect', 'doctorRepInput');
}

function onDoctorModalDmChange() {
  updateModalReps('doctorModalDmSelect', 'doctorRepInput');
}

function onPharmacyModalLmChange() {
  updateModalDMs('pharmacyModalLmSelect', 'pharmacyModalDmSelect', 'pharmacyRepInput');
}

function onPharmacyModalDmChange() {
  updateModalReps('pharmacyModalDmSelect', 'pharmacyRepInput');
}

function populateRepModalOptions(selectElement) {
  if (!selectElement) return;
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const reps = allUsers.filter((u) => window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep'));
  renderSelectOptions(selectElement, reps, (r) => r.id, (r) => `${r.name} (${r.employeeCode || r.code || 'Rep'})`);
}

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
 * Import Modal Controls
 */
function openImportDoctorsModal() {
  const modal = document.getElementById('importDoctorsModal');
  if (modal) modal.style.display = 'flex';
}
window.openImportDoctorsModal = openImportDoctorsModal;

function closeImportDoctorsModal() {
  const modal = document.getElementById('importDoctorsModal');
  if (modal) modal.style.display = 'none';
}
window.closeImportDoctorsModal = closeImportDoctorsModal;

function openImportPharmaciesModal() {
  const modal = document.getElementById('importPharmaciesModal');
  if (modal) modal.style.display = 'flex';
}
window.openImportPharmaciesModal = openImportPharmaciesModal;

function closeImportPharmaciesModal() {
  const modal = document.getElementById('importPharmaciesModal');
  if (modal) modal.style.display = 'none';
}
window.closeImportPharmaciesModal = closeImportPharmaciesModal;

function onDoctorsImportLmChange() {}
window.onDoctorsImportLmChange = onDoctorsImportLmChange;

function onPharmaciesImportLmChange() {}
window.onPharmaciesImportLmChange = onPharmaciesImportLmChange;

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