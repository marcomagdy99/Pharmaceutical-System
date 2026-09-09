/* =========================================================================
   1. Data & State Initialization
   ========================================================================= */

const pharmacyTranslations = {
    en: {
        pharmaciesTitle: "Pharmacies",
        addPharmacy: "Add Pharmacy",
        editPharmacy: "Edit Pharmacy",
        searchPharmacies: "Search by name or address...",
        pharmacyName: "Pharmacy Name",
        enterPharmacyName: "Enter pharmacy name",
        address: "Address",
        enterAddress: "Enter address",
        phone: "Phone",
        enterPhone: "Enter phone number",
        contactPerson: "Contact Person",
        enterContactPerson: "Enter contact person's name",
        area: "Area",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        deletePharmacy: "Delete Pharmacy",
        confirmDeletePharmacy: "Are you sure you want to delete this pharmacy?",
        noPharmaciesFound: "No Pharmacies Found",
        noPharmaciesDesc: "Try adjusting your search or add a new pharmacy.",
        nasrCityArea: "Nasr City - CAI-N01"
    },
    ar: {
        pharmaciesTitle: "الصيدليات",
        addPharmacy: "إضافة صيدلية",
        editPharmacy: "تعديل صيدلية",
        searchPharmacies: "البحث بالاسم أو العنوان...",
        pharmacyName: "اسم الصيدلية",
        enterPharmacyName: "أدخل اسم الصيدلية",
        address: "العنوان",
        enterAddress: "أدخل العنوان",
        phone: "رقم الهاتف",
        enterPhone: "أدخل رقم الهاتف",
        contactPerson: "الشخص المسؤول",
        enterContactPerson: "أدخل اسم الشخص المسؤول",
        area: "المنطقة",
        cancel: "إلغاء",
        save: "حفظ",
        delete: "حذف",
        deletePharmacy: "حذف صيدلية",
        confirmDeletePharmacy: "هل أنت متأكد من رغبتك في حذف هذه الصيدلية؟",
        noPharmaciesFound: "لم يتم العثور على صيدليات",
        noPharmaciesDesc: "حاول تعديل بحثك أو أضف صيدلية جديدة.",
        nasrCityArea: "مدينة نصر - CAI-N01"
    }
};

// Retrieve master pharmacies array from DEMO_DATA (Single Source of Truth)
function getPharmaciesData() {
    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    if (!Array.isArray(window.DEMO_DATA.pharmacies)) {
        window.DEMO_DATA.pharmacies = [
            { id: 'p1', name: 'Al-Ezaby Pharmacy', nameAr: 'صيدلية العزبي', address: '15 Abbas Al-Akkad, Nasr City', phone: '01001112233', contactPerson: 'Mohamed Ibrahim', areaId: 'area1', repId: 'rep1' },
            { id: 'p2', name: 'Seif Pharmacy', nameAr: 'صيدلية سيف', address: '28 Mostafa El-Nahas, Nasr City', phone: '01009998877', contactPerson: 'Youssef Ahmed', areaId: 'area1', repId: 'rep1' },
            { id: 'p3', name: 'Roshdy Pharmacy', nameAr: 'صيدلية رشدي', address: '5 Tayaran St, Nasr City', phone: '01155566677', contactPerson: 'Ramy Adel', areaId: 'area1', repId: 'rep1' },
            { id: 'p4', name: '19011 Pharmacy', nameAr: 'صيدلية 19011', address: '42 Makram Ebeid, Nasr City', phone: '01234567890', contactPerson: 'Sara Maher', areaId: 'area1', repId: 'rep1' },
        ];
    }
    return window.DEMO_DATA.pharmacies;
}

let pharmacyToDelete = null;
let currentLanguage = (typeof getCurrentLang === 'function') ? getCurrentLang() : (localStorage.getItem('pharmaLang') || localStorage.getItem('lang') || 'en');

/* =========================================================================
   2. Core Initialization
   ========================================================================= */

/**
 * Initializes the pharmacies page by setting up translations, resolving the current language, and rendering the initial list of pharmacies.
 */
function initPharmacies() {
    if (window.translations) {
        window.translations = { ...window.translations, ...pharmacyTranslations };
    } else {
        window.translations = pharmacyTranslations;
    }
    
    // Initial check for language
    currentLanguage = (typeof getCurrentLang === 'function') ? getCurrentLang() : (localStorage.getItem('pharmaLang') || localStorage.getItem('lang') || 'en');

    if (window.i18n) {
        window.i18n.updatePageText();
    }

    renderPharmacies();
}

/* =========================================================================
   3. Rendering & Filtering
   ========================================================================= */

/**
 * Renders the pharmacies grid based on the provided filtered data or the full list.
 * Updates the empty state visibility accordingly.
 * @param {Array|null} filteredData - Optional array of pharmacy objects to render.
 */
function renderPharmacies(filteredData = null) {
    const grid = document.getElementById('pharmaciesGrid');
    const emptyState = document.getElementById('emptyState');
    
    const dataToRender = filteredData || getPharmaciesData();
    
    if (dataToRender.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = dataToRender.map(pharmacy => {
        const displayName = currentLanguage === 'ar' && pharmacy.nameAr ? pharmacy.nameAr : pharmacy.name;
        
        return `
            <div class="card pharmacy-card h-100 d-flex flex-column">
                <div class="card-body flex-grow-1 p-3">
                    <div class="d-flex align-items-start mb-3">
                        <div class="icon-circle bg-success-light text-success me-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:48px; height:48px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.1 2.1 0 0 0 0 2.97l.46.46a2.1 2.1 0 0 0 2.97 0l2.97-2.97a2.1 2.1 0 0 0 0-2.97l-.46-.46a2.1 2.1 0 0 0-2.97 0Z"/></svg>
                        </div>
                        <div>
                            <h3 class="m-0 fs-5 fw-bold">${displayName}</h3>
                            <span class="badge badge-light-gray mt-2 d-inline-block" data-i18n="nasrCityArea">Nasr City - CAI-N01</span>
                        </div>
                    </div>
                    
                    <div class="info-list mt-3">
                        <div class="info-item mb-2 d-flex align-items-start text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted me-2 mt-1 flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span class="text-gray-700">${pharmacy.address}</span>
                        </div>
                        <div class="info-item mb-2 d-flex align-items-center text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted me-2 flex-shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            <span class="text-gray-700">${pharmacy.phone || '-'}</span>
                        </div>
                        <div class="info-item d-flex align-items-center text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted me-2 flex-shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span class="text-gray-700">${pharmacy.contactPerson || '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-gray-50 d-flex justify-content-end p-3 border-top mt-auto gap-2">
                    <button class="btn btn-sm btn-outline" onclick="editPharmacy('${pharmacy.id}')" data-i18n="editPharmacy">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${pharmacy.id}')" data-i18n="delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    if (window.i18n) {
        window.i18n.updatePageText();
    }
}

/**
 * Filters the list of pharmacies based on the search input's value, matching against name and address, then re-renders the list.
 */
function filterPharmacies() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    if (!query) {
        renderPharmacies();
        return;
    }
    
    const filtered = getPharmaciesData().filter(p => {
        const nameMatch = p.name.toLowerCase().includes(query) || (p.nameAr && p.nameAr.toLowerCase().includes(query));
        const addressMatch = p.address && p.address.toLowerCase().includes(query);
        return nameMatch || addressMatch;
    });
    
    renderPharmacies(filtered);
}

/* =========================================================================
   4. Modal Management
   ========================================================================= */

/**
 * Opens the pharmacy modal for adding a new pharmacy or editing an existing one if an ID is provided.
 * @param {string|null} id - Optional pharmacy ID to edit.
 */
function openPharmacyModal(id = null) {
    const modal = document.getElementById('pharmacyModal');
    const title = document.getElementById('modalTitle');
    const areaInput = document.getElementById('pharmacyArea');
    
    document.getElementById('pharmacyForm').reset();
    
    // Set Area to representative's area (demo)
    const areaTranslation = pharmacyTranslations[currentLanguage]?.nasrCityArea || "Nasr City - CAI-N01";
    areaInput.value = areaTranslation;
    
    if (id) {
        const p = getPharmaciesData().find(p => p.id === id);
        if (p) {
            title.setAttribute('data-i18n', 'editPharmacy');
            document.getElementById('pharmacyId').value = p.id;
            document.getElementById('pharmacyName').value = currentLanguage === 'ar' && p.nameAr ? p.nameAr : p.name;
            document.getElementById('pharmacyAddress').value = p.address;
            document.getElementById('pharmacyPhone').value = p.phone || '';
            document.getElementById('pharmacyContact').value = p.contactPerson || '';
        }
    } else {
        title.setAttribute('data-i18n', 'addPharmacy');
        document.getElementById('pharmacyId').value = '';
    }
    
    if (window.i18n) {
        window.i18n.updatePageText();
    }
    
    modal.style.display = 'flex';
}

/**
 * Closes the pharmacy modal and hides it from view.
 */
function closePharmacyModal() {
    document.getElementById('pharmacyModal').style.display = 'none';
}

/**
 * Handles saving of a pharmacy from the modal form. It validates the form, updates an existing pharmacy or creates a new one, then closes the modal and re-renders the list.
 */
function savePharmacy() {
    const form = document.getElementById('pharmacyForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const id = document.getElementById('pharmacyId').value;
    const name = document.getElementById('pharmacyName').value;
    const address = document.getElementById('pharmacyAddress').value;
    const phone = document.getElementById('pharmacyPhone').value;
    const contact = document.getElementById('pharmacyContact').value;
    
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const isAr = (currentLanguage === 'ar');

    const pharms = getPharmaciesData();

    // Duplicate phone validation
    if (trimmedPhone) {
        const dupPhone = pharms.find(p => p.id !== id && p.phone && p.phone.trim() === trimmedPhone);
        if (dupPhone) {
            const msg = isAr
                ? `رقم الهاتف "${trimmedPhone}" مسجل مسبقاً لصيدلية (${dupPhone.name || dupPhone.nameAr}).`
                : `Phone number "${trimmedPhone}" is already registered for "${dupPhone.name}".`;
            if (typeof showToast === 'function') showToast(msg, 'warning');
            else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
            return;
        }
    }

    // Duplicate pharmacy name validation
    const dupName = pharms.find(p => p.id !== id && (
        (p.name && p.name.trim().toLowerCase() === trimmedName.toLowerCase()) ||
        (p.nameAr && p.nameAr.trim().toLowerCase() === trimmedName.toLowerCase())
    ));
    if (dupName) {
        const msg = isAr
            ? `توجد صيدلية مسجلة بنفس الاسم (${trimmedName}) مسبقاً.`
            : `A pharmacy with name "${trimmedName}" already exists.`;
        if (typeof showToast === 'function') showToast(msg, 'warning');
        else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
        return;
    }
    
    if (id) {
        const p = pharms.find(p => p.id === id);
        if (p) {
            if(currentLanguage === 'ar') p.nameAr = name;
            else p.name = name;
            
            p.address = address;
            p.phone = phone;
            p.contactPerson = contact;
        }
    } else {
        const newId = 'pharm_' + Date.now();
        const newP = {
            id: newId,
            name: currentLanguage === 'ar' ? name : name, // For demo, we just assign to both if AR
            nameAr: currentLanguage === 'ar' ? name : name,
            address: address,
            phone: phone,
            contactPerson: contact,
            areaId: 'area1',
            repId: 'rep1'
        };
        pharms.unshift(newP);
    }

    if (window.DEMO_DATA) {
        window.DEMO_DATA.pharmacies = pharms;
    }

    if (typeof window.saveDataToStorage === 'function') {
        window.saveDataToStorage();
    }
    
    closePharmacyModal();
    renderPharmacies();
    
    // Clear search if any
    document.getElementById('searchInput').value = '';
}

/**
 * Opens the delete confirmation modal and stores the ID of the pharmacy to be deleted.
 * @param {string} id - The ID of the pharmacy to delete.
 */
function openDeleteModal(id) {
    pharmacyToDelete = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

/**
 * Closes the delete confirmation modal and clears the targeted pharmacy ID.
 */
function closeDeleteModal() {
    pharmacyToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

/**
 * Confirms the deletion of a pharmacy, removes it from the data array, closes the modal, and re-renders the list.
 */
function confirmDeletePharmacy() {
    if (pharmacyToDelete) {
        const updated = getPharmaciesData().filter(p => p.id !== pharmacyToDelete);
        if (window.DEMO_DATA) {
            window.DEMO_DATA.pharmacies = updated;
        }
        if (typeof window.saveDataToStorage === 'function') {
            window.saveDataToStorage();
        }
        pharmacyToDelete = null;
        closeDeleteModal();
        
        // Re-apply filter if needed
        filterPharmacies();
    }
}

/* =========================================================================
   5. Event Listeners
   ========================================================================= */

// Listen for language changes to re-render
window.addEventListener('languageChanged', (e) => {
    currentLanguage = e.detail.lang;
    
    // Update area input if modal is open
    const modal = document.getElementById('pharmacyModal');
    if (modal.style.display === 'flex') {
        const areaInput = document.getElementById('pharmacyArea');
        areaInput.value = pharmacyTranslations[currentLanguage]?.nasrCityArea || "Nasr City - CAI-N01";
    }
    
    renderPharmacies();
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPharmacies);
