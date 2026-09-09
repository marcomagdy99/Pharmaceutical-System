/**
 * @file shared-report.js
 * @description Shared data store, translations, page lifecycle, cascading
 * hierarchy filters, modal hierarchy helpers, and generic CSV/Excel utilities
 * used by every tab on the Reports page. MUST load before the other
 * *-report.js files (sales, timeline, coverage, doctors, pharmacies).
 */

// ============================================================================
// Section 1: Reports Master Data Store
// (Sales numbers are formatted without currency symbols throughout, by design)
// ============================================================================
const REPORTS_DATA = {
  sales: [
    // September 2026 (2026-09) - Cardio Line (line1 / lm1) - Cairo District (dm1)
    { id: 's1', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', target: 20000, actual: 22500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's2', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', target: 12000, actual: 13000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's3', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', target: 10000, actual: 9500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's4', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', target: 8000, actual: 7000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },

    { id: 's5', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', target: 18000, actual: 19000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's6', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', target: 12000, actual: 11000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's7', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Omeprazole 20mg', target: 9000, actual: 7500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's8', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Azithromycin 250mg', target: 6000, actual: 3500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },

    // August 2026 (2026-08)
    { id: 's9', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', target: 18000, actual: 21000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's10', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', target: 12000, actual: 14000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's11', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', target: 9000, actual: 8500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's12', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', target: 6000, actual: 6500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },

    { id: 's13', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', target: 17000, actual: 18500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's14', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', target: 11000, actual: 11500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' }
  ],
  visits: [
    { id: 'v1', targetName: 'Ahmed Mostafa', class: 'A', specialty: 'Internal Medicine', type: 'doctor', date: '2026-09-02', time: '11:30', period: 'PM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa' },
    { id: 'v2', targetName: 'Sara Abdullah', class: 'A', specialty: 'Pediatrics', type: 'doctor', date: '2026-09-02', time: '14:15', period: 'PM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa' },
    { id: 'v3', targetName: 'Al-Salam Hospital', class: 'Hospital', specialty: 'General & Surgery', type: 'hospital', date: '2026-09-02', time: '09:45', period: 'AM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa' },
    { id: 'v4', targetName: 'Mohamed Hassan', class: 'B', specialty: 'Dermatology', type: 'doctor', date: '2026-09-02', time: '16:00', period: 'PM', status: 'completed', isActual: true, repId: 'rep1', repName: 'Ahmed Mostafa' },
    { id: 'v5', targetName: 'Youssef Fathy', class: 'B', specialty: 'Orthopedics', type: 'doctor', date: '2026-09-01', time: '14:20', period: 'PM', status: 'completed', isActual: true, repId: 'rep1', repName: 'Ahmed Mostafa' },
    { id: 'v6', targetName: 'Nasser Institute', class: 'Hospital', specialty: 'Oncology & Surgery', type: 'hospital', date: '2026-09-01', time: '10:15', period: 'AM', status: 'completed', isActual: false, repId: 'rep1', repName: 'Ahmed Mostafa' },
    { id: 'v7', targetName: 'Khaled Omar', class: 'A', specialty: 'Cardiology', type: 'doctor', date: '2026-09-02', time: '13:00', period: 'PM', status: 'completed', isActual: false, repId: 'rep2', repName: 'Omar Youssef' }
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

    // 2. Sync Visits from visits module
    if (Array.isArray(window.DEMO_DATA.visits) && window.DEMO_DATA.visits.length > 0) {
      window.DEMO_DATA.visits.forEach((v) => {
        const existingIdx = REPORTS_DATA.visits.findIndex((rv) => rv.id === v.id);
        const rep = (window.DEMO_DATA.users || []).find((u) => u.id === v.repId);
        const repName = rep ? rep.name : (v.repId === 'rep2' ? 'Omar Youssef' : 'Ahmed Mostafa');
        const doc = REPORTS_DATA.doctors.find((d) => d.name === v.doctorName || d.id === v.doctorId);

        const mappedVisit = {
          id: v.id,
          doctorId: v.doctorId || (doc ? doc.id : undefined),
          targetName: v.doctorName || (doc ? doc.name : 'Unknown Target'),
          class: doc ? doc.class : ((v.period && v.period.toLowerCase() === 'am') ? 'Hospital' : 'B'),
          specialty: doc ? doc.specialty : ((v.period && v.period.toLowerCase() === 'am') ? 'Hospital' : 'General'),
          type: (v.period && v.period.toLowerCase() === 'am') ? 'hospital' : 'doctor',
          date: v.date,
          time: v.time || '10:00',
          period: (v.period || 'PM').toUpperCase(),
          status: v.status || 'planned',
          isActual: v.source === 'actual',
          repId: v.repId || 'rep1',
          repName: repName,
          comment: v.comment || '',
          products: v.products || []
        };

        if (existingIdx >= 0) {
          REPORTS_DATA.visits[existingIdx] = mappedVisit;
        } else {
          REPORTS_DATA.visits.push(mappedVisit);
        }
      });
    }
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
    btnConfirmImport: 'Confirm & Import'
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
    btnConfirmImport: 'تأكيد واستيراد'
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
  const dateTo   = document.getElementById('timelineDateTo');
  if (dateFrom) dateFrom.value = todayStr;
  if (dateTo)   dateTo.value   = todayStr;

  const startDate = document.getElementById('coverageStartDate');
  const endDate = document.getElementById('coverageEndDate');
  if (startDate) startDate.value = firstOfMonth;
  if (endDate) endDate.value = lastOfMonthStr;

  renderSalesReport();
  renderDailyTimeline();
  renderCoverageReport();

  // Initialize Doctors and Pharmacies directories
  initDoctorsDirectory(user);
  initPharmaciesDirectory(user);

  // Check URL query parameter for active tab
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  if (requestedTab && ['sales', 'timeline', 'coverage', 'doctors', 'pharmacies'].includes(requestedTab)) {
    switchReportTab(requestedTab);
  }
});

document.addEventListener('click', (e) => {
  const container = document.getElementById('productMultiSelectContainer');
  if (container && !container.contains(e.target)) {
    closeProductDropdown();
  }
});

// ============================================================================
// Section 3: Role Permissions & Mode Indicators
// ============================================================================
function setupRolePermissions(user) {
  const isAdmin = window.isAdmin ? window.isAdmin(user) : ((user && user.role) === 'admin');
  const noticeBadge = document.getElementById('adminBadgeNotice');
  const noticeText = document.getElementById('roleNoticeText');
  const uploadBtn = document.getElementById('uploadSalesBtn');
  const btnAddDoctor = document.getElementById('btnAddDoctor');
  const btnAddPharmacy = document.getElementById('btnAddPharmacy');
  const btnImportDoctors = document.getElementById('btnImportDoctors');
  const btnImportPharmacies = document.getElementById('btnImportPharmacies');
  const lang = getCurrentLang();

  if (isAdmin) {
    if (noticeBadge) noticeBadge.className = 'admin-notice-pill admin-mode';
    if (noticeText) noticeText.textContent = lang === 'ar' ? 'صلاحية الإدارة: متاح رفع شيتات المبيعات وإدارة الأطباء والصيدليات' : 'Admin Role: Full Sales Upload, Doctors & Pharmacies Management';
    if (uploadBtn) uploadBtn.style.display = 'inline-flex';
    if (btnAddDoctor) btnAddDoctor.style.display = 'inline-flex';
    if (btnAddPharmacy) btnAddPharmacy.style.display = 'inline-flex';
    if (btnImportDoctors) btnImportDoctors.style.display = 'inline-flex';
    if (btnImportPharmacies) btnImportPharmacies.style.display = 'inline-flex';
  } else {
    if (noticeBadge) noticeBadge.className = 'admin-notice-pill';
    if (noticeText) noticeText.textContent = lang === 'ar' ? 'عرض فقط: تعديل التارجت والأطباء والصيدليات مقتصر على الإدارة' : 'View-Only: Directories and Sales managed by Admin';
    if (uploadBtn) uploadBtn.style.display = 'none';
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

function initAllFilters(user) {
  const monthSelect = document.getElementById('salesMonthSelect');
  const yearSelect = document.getElementById('salesYearSelect');

  const lineGroup = document.getElementById('salesLineFilterGroup');
  const dmGroup = document.getElementById('salesDmFilterGroup');
  const repGroup = document.getElementById('salesRepFilterGroup');

  const lineSelect = document.getElementById('salesLineSelect');
  const dmSelect = document.getElementById('salesDmSelect');
  const repSelect = document.getElementById('salesRepSelect');

  const lang = getCurrentLang();

  // Populate Month
  if (monthSelect) {
    monthSelect.replaceChildren();
    MONTH_NAMES.forEach((m, idx) => {
      const opt = document.createElement('option');
      const val = String(idx + 1).padStart(2, '0');
      opt.value = val;
      opt.textContent = lang === 'ar' ? MONTH_NAMES_AR[idx] : m;
      if (val === '09') opt.selected = true;
      monthSelect.appendChild(opt);
    });
  }

  // Populate Year
  if (yearSelect) {
    yearSelect.replaceChildren();
    ['2025', '2026', '2027'].forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === '2026') opt.selected = true;
      yearSelect.appendChild(opt);
    });
  }

  populateProductCheckboxes('all');

  const role = window.normalizeRole ? window.normalizeRole(user?.role) : ((user && user.role) || 'medical_rep').toLowerCase();

  const userLines = typeof window.getUserLines === 'function' && user ? window.getUserLines(user.id) : [];
  const hasMultipleLines = userLines.length > 1;

  if (role === 'medical_rep') {
    if (lineGroup) lineGroup.style.display = 'none';
    if (dmGroup) dmGroup.style.display = 'none';
    if (repGroup) repGroup.style.display = 'none';
  } else if (role === 'district_manager') {
    if (lineGroup) lineGroup.style.display = hasMultipleLines ? 'flex' : 'none';
    if (dmGroup) dmGroup.style.display = 'none';
    if (repGroup) repGroup.style.display = 'flex';

    if (hasMultipleLines) {
      populateLinesFilter(lineSelect, user);
    }
    populateRepsFilter(repSelect, user.id, null);
  } else if (role === 'line_manager') {
    if (lineGroup) lineGroup.style.display = hasMultipleLines ? 'flex' : 'none';
    if (dmGroup) dmGroup.style.display = 'flex';
    if (repGroup) repGroup.style.display = 'flex';

    if (hasMultipleLines) {
      populateLinesFilter(lineSelect, user);
    }
    populateDMsFilter(dmSelect, user.id);
    populateRepsFilter(repSelect, null, hasMultipleLines ? 'all' : (user.lineId || 'line1'));
    populateProductCheckboxes(hasMultipleLines ? 'all' : (user.lineId || 'line1'));
  } else if (role === 'business_unit' || role === 'admin') {
    if (lineGroup) lineGroup.style.display = 'flex';
    if (dmGroup) dmGroup.style.display = 'flex';
    if (repGroup) repGroup.style.display = 'flex';

    populateLinesFilter(lineSelect, user);
    populateDMsFilter(dmSelect, null);
    populateRepsFilter(repSelect, null, null);
  }

  populateTimelineAndCoverageFilters(user);
}

function populateTimelineAndCoverageFilters(user) {
  const timelineRepSelect = document.getElementById('timelineRepSelect');
  const coverageRepSelect = document.getElementById('coverageRepSelect');
  if (!timelineRepSelect && !coverageRepSelect) return;

  const lang = getCurrentLang();
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

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
      optAllDMs.textContent = lang === 'ar' ? 'جميع مديري المناطق (DMs فقط)' : 'All District Managers (DMs Only)';
      selectEl.appendChild(optAllDMs);

      const optAllReps = document.createElement('option');
      optAllReps.value = 'all_reps';
      optAllReps.textContent = lang === 'ar' ? 'جميع المناديب (Reps فقط)' : 'All Medical Reps (Reps Only)';
      selectEl.appendChild(optAllReps);

      if (dms.length > 0) {
        const dmGroup = document.createElement('optgroup');
        dmGroup.label = lang === 'ar' ? 'مديرو المناطق (DMs)' : 'District Managers (DMs)';
        dms.forEach((dm) => {
          const opt = document.createElement('option');
          opt.value = dm.id;
          opt.textContent = `${dm.name} (${dm.employeeCode || 'DM'})`;
          dmGroup.appendChild(opt);
        });
        selectEl.appendChild(dmGroup);
      }

      if (reps.length > 0) {
        const repGroup = document.createElement('optgroup');
        repGroup.label = lang === 'ar' ? 'المناديب الطبيين (Reps)' : 'Medical Representatives (Reps)';
        reps.forEach((rep) => {
          const dm = dms.find((d) => d.id === rep.managerId);
          const opt = document.createElement('option');
          opt.value = rep.id;
          opt.textContent = `${rep.name} (${rep.employeeCode || 'Rep'}${dm ? ` - DM: ${dm.name}` : ''})`;
          repGroup.appendChild(opt);
        });
        selectEl.appendChild(repGroup);
      }
    } else if (role === 'district_manager') {
      const allLabel = lang === 'ar' ? 'كل مناديب الفريق' : 'All Team Reps';
      selectEl.innerHTML = `<option value="all">${allLabel}</option>`;

      const selfOpt = document.createElement('option');
      selfOpt.value = user.id;
      selfOpt.textContent = lang === 'ar' ? `${user.name} (DM - زياراتي)` : `${user.name} (DM - My Visits)`;
      selectEl.appendChild(selfOpt);

      const reps = allUsers.filter((u) => u.managerId === user.id);
      reps.forEach((r) => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (${r.employeeCode || 'Rep'})`;
        selectEl.appendChild(opt);
      });
    } else if (role === 'medical_rep' || role === 'rep') {
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = `${user.name} (${user.employeeCode || 'Rep'})`;
      selectEl.appendChild(opt);
    } else {
      // Admin / BU: show all visit-making roles (Reps, DMs, LMs, BUs)
      const lang2 = getCurrentLang();
      const allLabel = lang2 === 'ar' ? 'جميع الفريق' : 'All Team';
      selectEl.innerHTML = `<option value="all">${allLabel}</option>`;

      const visitRoles = [
        { key: 'business_unit', label: 'Business Unit (BU)' },
        { key: 'line_manager',  label: 'Line Managers (LM)' },
        { key: 'district_manager', label: 'District Managers (DM)' },
        { key: 'medical_rep',  label: 'Medical Reps' },
      ];

      visitRoles.forEach(({ key, label }) => {
        const members = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : u.role;
          return r === key || u.role === key || (key === 'medical_rep' && u.role === 'rep');
        });
        if (!members.length) return;
        const group = document.createElement('optgroup');
        group.label = label;
        members.forEach((u) => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = `${u.name} (${u.employeeCode || key})`;
          group.appendChild(opt);
        });
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
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  let lines = allLines;
  if (user && user.role !== 'admin' && user.role !== 'business_unit') {
    const userLines = typeof window.getUserLines === 'function' ? window.getUserLines(user.id) : [];
    if (userLines.length > 0) lines = userLines;
  }

  lines.forEach((l) => {
    const lm = allUsers.find((u) => u.id === l.lineManagerId);
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = `${l.name} ${lm ? `(${lm.name})` : ''}`;
    lineSelect.appendChild(opt);
  });
}

function populateDMsFilter(dmSelect, lmId = null, lineId = null) {
  if (!dmSelect) return;
  const lang = getCurrentLang();
  const allDMsLabel = lang === 'ar' ? 'جميع المناطق ومديريها (الكل)' : 'All Districts & DMs';
  dmSelect.innerHTML = `<option value="all">${allDMsLabel}</option>`;

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  let dms = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));

  if (lmId) {
    dms = dms.filter((u) => u.managerId === lmId);
  }
  if (lineId && lineId !== 'all') {
    dms = dms.filter((u) => (u.lineIds && u.lineIds.includes(lineId)) || u.lineId === lineId);
  }

  dms.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name} (${d.employeeCode || d.code || 'DM'})`;
    dmSelect.appendChild(opt);
  });
}

function populateRepsFilter(repSelect, dmId = null, lineId = null) {
  if (!repSelect) return;
  const lang = getCurrentLang();
  const allRepsLabel = lang === 'ar' ? 'جميع المناديب (الكل)' : 'All Representatives';
  repSelect.innerHTML = `<option value="all">${allRepsLabel}</option>`;

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  let reps = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')));

  if (dmId && dmId !== 'all') {
    reps = reps.filter((u) => u.managerId === dmId);
  }
  if (lineId && lineId !== 'all') {
    reps = reps.filter((u) => (u.lineIds && u.lineIds.includes(lineId)) || u.lineId === lineId);
  }

  reps.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.name} (${r.employeeCode || r.code || 'Rep'})`;
    repSelect.appendChild(opt);
  });
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
    const selectedLine = lines.find((l) => l.id === selectedLineId);
    const lmId = selectedLine ? selectedLine.lineManagerId : null;

    populateDMsFilter(dmSelect, lmId, selectedLineId);
    populateRepsFilter(repSelect, null, selectedLineId);
  }

  populateProductCheckboxes(selectedLineId);
};

window.onSalesDmChange = function() {
  const dmSelect = document.getElementById('salesDmSelect');
  const repSelect = document.getElementById('salesRepSelect');
  const selectedDmId = dmSelect ? dmSelect.value : 'all';

  populateRepsFilter(repSelect, selectedDmId, null);
};

// ============================================================================

function printCurrentReport() {
  window.print();
}

// ============================================================================

// Section 13: Modal Cascading Hierarchy (Line/LM -> District/DM -> Med Rep)
// ============================================================================
function populateModalHierarchy(lmSelectId, dmSelectId, repSelectId, targetRepId = null) {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const lmSelect = document.getElementById(lmSelectId);
  if (!lmSelect) return;

  // 1. Populate Line / LM options
  lmSelect.innerHTML = lines.map((l) => {
    const lm = allUsers.find((u) => u.id === l.lineManagerId);
    return `<option value="${l.id}">${l.name} (${lm ? lm.name : 'LM'})</option>`;
  }).join('');

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
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const lmSelect = document.getElementById(lmSelectId);
  const dmSelect = document.getElementById(dmSelectId);
  if (!dmSelect) return;

  const currentLineId = lmSelect ? lmSelect.value : 'line1';
  const lineObj = lines.find((l) => l.id === currentLineId);
  const lmUserId = lineObj ? lineObj.lineManagerId : currentLineId;

  // Filter DMs under selected LM
  const dms = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')) && (!lmUserId || u.managerId === lmUserId));

  dmSelect.innerHTML = dms.map((d) => `
    <option value="${d.id}">${d.name} (${d.employeeCode || 'DM'})</option>
  `).join('');

  let activeDmId = selectedDmId && dms.some((d) => d.id === selectedDmId) ? selectedDmId : (dms[0]?.id || '');
  dmSelect.value = activeDmId;

  updateModalReps(dmSelectId, repSelectId, targetRepId);
}

function updateModalReps(dmSelectId, repSelectId, targetRepId = null) {
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const dmSelect = document.getElementById(dmSelectId);
  const repSelect = document.getElementById(repSelectId);
  if (!repSelect) return;

  const currentDmId = dmSelect ? dmSelect.value : '';

  // Filter Medical Reps under selected DM
  const reps = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')) && (!currentDmId || u.managerId === currentDmId));

  repSelect.innerHTML = reps.map((r) => `
    <option value="${r.id}">${r.name} (${r.employeeCode || 'Rep'})</option>
  `).join('');

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

  selectElement.innerHTML = reps.map((r) => `
    <option value="${r.id}">${r.name} (${r.employeeCode || r.code || 'Rep'})</option>
  `).join('');
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

