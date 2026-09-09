const doctorTranslations = {
    en: {
        doctorsTitle: "Doctors",
        addDoctor: "Add Doctor",
        searchDoctors: "Search by name...",
        allSpecialties: "All Specialties",
        specInternal: "Internal Medicine",
        specPediatrics: "Pediatrics",
        specCardiology: "Cardiology",
        specDermatology: "Dermatology",
        specOphthalmology: "Ophthalmology",
        specENT: "ENT",
        specOrthopedics: "Orthopedics",
        specNeurology: "Neurology",
        specUrology: "Urology",
        specGynecology: "Gynecology",
        specOther: "Other",
        allClasses: "All",
        allTypes: "All",
        typeDoctor: "Doctor",
        typeHospital: "Hospital",
        colName: "Name ⇅",
        colSpecialty: "Specialty ⇅",
        colClass: "Class",
        colType: "Type",
        colAddress: "Address",
        colPhone: "Phone",
        colCoverage: "Coverage",
        colActions: "Actions",
        noDoctors: "No doctors found",
        noDoctorsDesc: "Get started by adding your first doctor or hospital.",
        edit: "Edit",
        delete: "Delete",
        docName: "Name *",
        docType: "Type *",
        docSpecialty: "Specialty *",
        selectSpecialty: "Select Specialty...",
        docClass: "Class *",
        docAddress: "Address",
        docPhone: "Phone",
        docArea: "Area (Auto-filled)",
        cancel: "Cancel",
        save: "Save",
        deleteConfirmTitle: "Delete Doctor",
        deleteConfirmText: "Are you sure you want to delete {name}?"
    },
    ar: {
        doctorsTitle: "الأطباء",
        addDoctor: "إضافة طبيب",
        searchDoctors: "ابحث بالاسم...",
        allSpecialties: "جميع التخصصات",
        specInternal: "باطنة",
        specPediatrics: "أطفال",
        specCardiology: "قلب",
        specDermatology: "جلدية",
        specOphthalmology: "عيون",
        specENT: "أنف وأذن وحنجرة",
        specOrthopedics: "عظام",
        specNeurology: "مخ وأعصاب",
        specUrology: "مسالك بولية",
        specGynecology: "نساء وتوليد",
        specOther: "أخرى",
        allClasses: "الكل",
        allTypes: "الكل",
        typeDoctor: "طبيب",
        typeHospital: "مستشفى",
        colName: "الاسم ⇅",
        colSpecialty: "التخصص ⇅",
        colClass: "الفئة",
        colType: "النوع",
        colAddress: "العنوان",
        colPhone: "الهاتف",
        colCoverage: "التغطية",
        colActions: "إجراءات",
        noDoctors: "لم يتم العثور على أطباء",
        noDoctorsDesc: "ابدأ بإضافة أول طبيب أو مستشفى.",
        edit: "تعديل",
        delete: "حذف",
        docName: "الاسم *",
        docType: "النوع *",
        docSpecialty: "التخصص *",
        selectSpecialty: "اختر التخصص...",
        docClass: "الفئة *",
        docAddress: "العنوان",
        docPhone: "الهاتف",
        docArea: "المنطقة (تلقائي)",
        cancel: "إلغاء",
        save: "حفظ",
        deleteConfirmTitle: "حذف الطبيب",
        deleteConfirmText: "هل أنت متأكد أنك تريد حذف {name}؟"
    }
};

// Merge with existing translations in app.js
if (window.translations) {
    window.translations.en = { ...window.translations.en, ...doctorTranslations.en };
    window.translations.ar = { ...window.translations.ar, ...doctorTranslations.ar };
} else {
    window.translations = doctorTranslations;
}

// Retrieve master doctors array from DEMO_DATA (Single Source of Truth)
function getDoctorsData() {
    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    if (!Array.isArray(window.DEMO_DATA.doctors)) {
        window.DEMO_DATA.doctors = [
            { id: 'd1', name: 'Ahmed Samir', specialty: 'Cardiology', class: 'A', area: 'North District', visitsThisQuarter: 3, type: 'Doctor', address: '123 Main St, Clinic 4', phone: '01012345678' },
            { id: 'd2', name: 'Sarah Hassan', specialty: 'Pediatrics', class: 'B', area: 'South District', visitsThisQuarter: 1, type: 'Doctor', address: '45 South St', phone: '01112345678' },
            { id: 'h1', name: 'Al-Safa Hospital', specialty: 'General', class: 'A', area: 'East District', visitsThisQuarter: 4, type: 'Hospital', address: 'Hospital Road', phone: '01212345678' },
            { id: 'd3', name: 'Mahmoud Ali', specialty: 'Internal Medicine', class: 'B', area: 'West District', visitsThisQuarter: 2, type: 'Doctor', address: '78 West St', phone: '01512345678' },
            { id: 'd4', name: 'Noha Youssef', specialty: 'Dermatology', class: 'A', area: 'North District', visitsThisQuarter: 1, type: 'Doctor', address: '12 North St', phone: '01087654321' }
        ];
    }
    return window.DEMO_DATA.doctors;
}

let currentView = 'grid'; // 'grid' or 'table'
let doctorToDelete = null;
let sortBy = 'name';
let sortDesc = false;

// DOM Elements
const doctorsGrid = document.getElementById('doctorsGrid');
const doctorsTableContainer = document.getElementById('doctorsTableContainer');
const doctorsTableBody = document.getElementById('doctorsTableBody');
const emptyState = document.getElementById('emptyState');
const totalCountBadge = document.getElementById('totalDoctorsCount');

const searchInput = document.getElementById('searchInput');
const specialtyFilter = document.getElementById('specialtyFilter');
const classFilterBtns = document.querySelectorAll('#classFilter .toggle-btn');
const typeFilterBtns = document.querySelectorAll('#typeFilter .toggle-btn');

const gridViewBtn = document.getElementById('gridViewBtn');
const tableViewBtn = document.getElementById('tableViewBtn');

const doctorModal = document.getElementById('doctorModalOverlay');
const doctorForm = document.getElementById('doctorForm');
const modalTitle = document.getElementById('modalTitle');
const deleteModal = document.getElementById('deleteModalOverlay');
const deleteConfirmText = document.getElementById('deleteConfirmText');

// Filters state
let filters = {
    search: '',
    specialty: 'all',
    class: 'all',
    type: 'all'
};

function init() {
    setupEventListeners();
    renderDoctors();
    
    // Trigger i18n update
    if (window.updateI18n) {
        window.updateI18n();
    }
}

function setupEventListeners() {
    // View toggles
    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        gridViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        renderDoctors();
    });

    tableViewBtn.addEventListener('click', () => {
        currentView = 'table';
        tableViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderDoctors();
    });

    // Filters
    searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.toLowerCase();
        renderDoctors();
    });

    specialtyFilter.addEventListener('change', (e) => {
        filters.specialty = e.target.value;
        renderDoctors();
    });

    classFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            classFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.class = btn.dataset.value;
            renderDoctors();
        });
    });

    typeFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.type = btn.dataset.value;
            renderDoctors();
        });
    });

    // Table sorting
    document.querySelectorAll('.doctors-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            if (sortBy === sortKey) {
                sortDesc = !sortDesc;
            } else {
                sortBy = sortKey;
                sortDesc = false;
            }
            renderDoctors();
        });
    });

    // Modals
    document.getElementById('addDoctorBtn').addEventListener('click', openAddModal);
    document.getElementById('emptyAddDoctorBtn').addEventListener('click', openAddModal);
    document.getElementById('closeDoctorModal').addEventListener('click', closeModals);
    document.getElementById('cancelDoctorBtn').addEventListener('click', closeModals);
    
    doctorForm.addEventListener('submit', handleSaveDoctor);
    
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeModals);
    document.getElementById('confirmDeleteBtn').addEventListener('click', handleDeleteDoctor);
}

function getFilteredAndSortedDoctors() {
    let result = getDoctorsData().filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(filters.search) || 
                              (doc.address && doc.address.toLowerCase().includes(filters.search));
        const matchesSpec = filters.specialty === 'all' || doc.specialty === filters.specialty || (filters.specialty==='Other' && !isStandardSpecialty(doc.specialty));
        const matchesClass = filters.class === 'all' || doc.class === filters.class;
        const matchesType = filters.type === 'all' || doc.type === filters.type;
        return matchesSearch && matchesSpec && matchesClass && matchesType;
    });

    result.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortDesc ? 1 : -1;
        if (valA > valB) return sortDesc ? -1 : 1;
        return 0;
    });

    return result;
}

function isStandardSpecialty(spec) {
    const standards = ['Internal Medicine', 'Pediatrics', 'Cardiology', 'Dermatology', 'Ophthalmology', 'ENT', 'Orthopedics', 'Neurology', 'Urology', 'Gynecology'];
    return standards.includes(spec) || spec === 'General';
}

function renderDoctors() {
    const docs = getFilteredAndSortedDoctors();
    totalCountBadge.textContent = docs.length;

    if (docs.length === 0) {
        doctorsGrid.style.display = 'none';
        doctorsTableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    if (currentView === 'grid') {
        doctorsTableContainer.style.display = 'none';
        doctorsGrid.style.display = 'grid';
        renderGrid(docs);
    } else {
        doctorsGrid.style.display = 'none';
        doctorsTableContainer.style.display = 'block';
        renderTable(docs);
    }

    if (window.updateI18n) window.updateI18n();
}

function getAvatarColor(name) {
    const colors = ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#198754', '#20c997', '#0dcaf0'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getCoverageHTML(doc) {
    const target = doc.class === 'A' ? 4 : 2;
    const current = doc.visitsThisQuarter || 0;
    const percentage = Math.min(100, (current / target) * 100);
    
    return `
        <div class="coverage-progress">
            <div class="coverage-progress-label">
                <span data-i18n="colCoverage">Coverage Q1</span>
                <span>${current} / ${target}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percentage}%; background-color: ${percentage >= 100 ? 'var(--success)' : (percentage > 0 ? 'var(--warning)' : 'var(--danger)')}"></div>
            </div>
        </div>
    `;
}

function getBadgesHTML(doc) {
    let html = '';
    html += `<span class="badge badge-class-${doc.class.toLowerCase()}">Class ${doc.class}</span>`;
    if (doc.type === 'Hospital') {
        html += `<span class="badge badge-type-hospital" data-i18n="typeHospital">Hospital</span>`;
    } else {
        html += `<span class="badge badge-type-doctor" data-i18n="typeDoctor">Doctor</span>`;
    }
    return html;
}

function getSpecialtyI18nKey(spec) {
    const map = {
        'Internal Medicine': 'specInternal',
        'Pediatrics': 'specPediatrics',
        'Cardiology': 'specCardiology',
        'Dermatology': 'specDermatology',
        'Ophthalmology': 'specOphthalmology',
        'ENT': 'specENT',
        'Orthopedics': 'specOrthopedics',
        'Neurology': 'specNeurology',
        'Urology': 'specUrology',
        'Gynecology': 'specGynecology'
    };
    return map[spec] || '';
}

function renderGrid(docs) {
    doctorsGrid.innerHTML = docs.map(doc => {
        const specKey = getSpecialtyI18nKey(doc.specialty);
        const specAttr = specKey ? `data-i18n="${specKey}"` : '';
        const specText = specKey ? '' : doc.specialty;

        return `
            <div class="doctor-card">
                <div class="doctor-card-header">
                    <div class="doctor-avatar" style="background-color: ${getAvatarColor(doc.name)}">
                        ${getInitials(doc.name)}
                    </div>
                    <div class="doctor-info">
                        <h4 class="doctor-name" title="${doc.name}">${doc.name}</h4>
                        <p class="doctor-specialty" ${specAttr}>${specText}</p>
                    </div>
                </div>
                <div class="doctor-badges">
                    ${getBadgesHTML(doc)}
                </div>
                <div class="doctor-details">
                    <div class="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>${doc.address || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <span>${doc.phone || '-'}</span>
                    </div>
                </div>
                ${getCoverageHTML(doc)}
                <div class="doctor-card-footer">
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('${doc.id}')" data-i18n="edit">Edit</button>
                    <button class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: #f8d7da;" onclick="confirmDelete('${doc.id}')" data-i18n="delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderTable(docs) {
    doctorsTableBody.innerHTML = docs.map(doc => {
        const specKey = getSpecialtyI18nKey(doc.specialty);
        const specAttr = specKey ? `data-i18n="${specKey}"` : '';
        const specText = specKey ? '' : doc.specialty;

        return `
            <tr>
                <td style="font-weight:500;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="doctor-avatar" style="width:32px; height:32px; font-size:0.8rem; background-color: ${getAvatarColor(doc.name)}">
                            ${getInitials(doc.name)}
                        </div>
                        ${doc.name}
                    </div>
                </td>
                <td ${specAttr}>${specText}</td>
                <td><span class="badge badge-class-${doc.class.toLowerCase()}">${doc.class}</span></td>
                <td>${doc.type === 'Hospital' ? '<span data-i18n="typeHospital">Hospital</span>' : '<span data-i18n="typeDoctor">Doctor</span>'}</td>
                <td>${doc.address || '-'}</td>
                <td>${doc.phone || '-'}</td>
                <td style="min-width:120px;">${getCoverageHTML(doc)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('${doc.id}')" data-i18n="edit">Edit</button>
                    <button class="btn btn-secondary btn-sm" style="color: var(--danger)" onclick="confirmDelete('${doc.id}')" data-i18n="delete">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openAddModal() {
    doctorForm.reset();
    document.getElementById('doctorId').value = '';
    modalTitle.setAttribute('data-i18n', 'addDoctor');
    modalTitle.textContent = window.translations[window.currentLang || 'en'].addDoctor || 'Add Doctor';
    doctorModal.style.display = 'flex';
}

window.openEditModal = function(id) {
    const doc = getDoctorsData().find(d => d.id === id);
    if (!doc) return;

    document.getElementById('doctorId').value = doc.id;
    document.getElementById('docName').value = doc.name;
    document.getElementById('docAddress').value = doc.address || '';
    document.getElementById('docPhone').value = doc.phone || '';
    
    // Select type
    const typeRadios = document.getElementsByName('docType');
    for (let r of typeRadios) {
        r.checked = (r.value === doc.type);
    }

    // Select class
    const classRadios = document.getElementsByName('docClass');
    for (let r of classRadios) {
        r.checked = (r.value === doc.class);
    }

    // Select specialty
    const specSelect = document.getElementById('docSpecialty');
    let found = false;
    for (let i=0; i<specSelect.options.length; i++) {
        if (specSelect.options[i].value === doc.specialty) {
            specSelect.selectedIndex = i;
            found = true; break;
        }
    }
    if (!found) {
        specSelect.value = 'Other';
    }

    modalTitle.setAttribute('data-i18n', 'edit'); // could be editDoctor but we have 'edit'
    modalTitle.textContent = window.translations[window.currentLang || 'en'].edit || 'Edit';
    doctorModal.style.display = 'flex';
};

window.confirmDelete = function(id) {
    const doc = getDoctorsData().find(d => d.id === id);
    if (!doc) return;
    
    doctorToDelete = id;
    const textTemplate = window.translations[window.currentLang || 'en'].deleteConfirmText;
    deleteConfirmText.textContent = textTemplate.replace('{name}', doc.name);
    deleteModal.style.display = 'flex';
};

function handleDeleteDoctor() {
    if (doctorToDelete) {
        const docs = getDoctorsData().filter(d => d.id !== doctorToDelete);
        if (window.DEMO_DATA) {
            window.DEMO_DATA.doctors = docs;
        }
        if (typeof window.saveDataToStorage === 'function') {
            window.saveDataToStorage();
        }
        doctorToDelete = null;
        closeModals();
        renderDoctors();
    }
}

function handleSaveDoctor(e) {
    e.preventDefault();
    
    const id = document.getElementById('doctorId').value;
    const name = document.getElementById('docName').value.trim();
    const type = document.querySelector('input[name="docType"]:checked').value;
    const specialty = document.getElementById('docSpecialty').value;
    const docClass = document.querySelector('input[name="docClass"]:checked').value;
    const address = document.getElementById('docAddress').value.trim();
    const phone = document.getElementById('docPhone').value.trim();
    if (!name || !specialty) {
        return; // native validation should handle this, but just in case
    }

    const isAr = (window.currentLang === 'ar' || document.documentElement.lang === 'ar');
    const docs = getDoctorsData();

    // Duplicate phone validation
    if (phone) {
        const dupPhone = docs.find(d => d.id !== id && d.phone && d.phone.trim() === phone);
        if (dupPhone) {
            const msg = isAr
                ? `رقم الهاتف "${phone}" مسجل مسبقاً للطبيب (${dupPhone.name}).`
                : `Phone number "${phone}" is already registered for Dr. ${dupPhone.name}.`;
            if (typeof showToast === 'function') showToast(msg, 'warning');
            else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
            return;
        }
    }

    // Duplicate doctor in same specialty validation
    const dupDoctor = docs.find(d => d.id !== id && d.name.toLowerCase() === name.toLowerCase() && d.specialty === specialty);
    if (dupDoctor) {
        const msg = isAr
            ? `يوجد طبيب مسجل بنفس الاسم (${name}) في تخصص (${specialty}) مسبقاً.`
            : `A doctor named "${name}" in "${specialty}" already exists.`;
        if (typeof showToast === 'function') showToast(msg, 'warning');
        else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
        return;
    }

    if (id) {
        // Edit
        const docIndex = docs.findIndex(d => d.id === id);
        if (docIndex > -1) {
            docs[docIndex] = {
                ...docs[docIndex],
                name, type, specialty, class: docClass, address, phone
            };
        }
    } else {
        // Add
        const newDoc = {
            id: 'doc_' + Date.now(),
            name, type, specialty, class: docClass, address, phone,
            area: 'North District', // default for demo
            visitsThisQuarter: 0
        };
        docs.unshift(newDoc);
    }

    if (window.DEMO_DATA) {
        window.DEMO_DATA.doctors = docs;
    }

    if (typeof window.saveDataToStorage === 'function') {
        window.saveDataToStorage();
    }

    closeModals();
    renderDoctors();
}

function closeModals() {
    doctorModal.style.display = 'none';
    deleteModal.style.display = 'none';
    doctorToDelete = null;
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
