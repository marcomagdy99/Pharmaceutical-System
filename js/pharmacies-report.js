/**
 * @file pharmacies-report.js
 * @description Pharmacies directory management, filtering, rendering, and CRUD operations within the reports page, with automatic repId binding.
 */

const escPharm = window.escapeHtml || ((s) => s || "");

function getPharmaciesData() {
  if (window.store && window.store.pharmacies) {
    return window.store.pharmacies.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.pharmacies) || [];
}

function renderPharmaciesReport() {
  const grid = document.getElementById("pharmaciesDirectoryGrid");
  const emptyState = document.getElementById("pharmaciesEmptyState");
  const countBadge = document.getElementById("totalPharmaciesCountBadge");
  if (!grid) return;

  const searchInput = document.getElementById("pharmacySearchInput");
  const repFilter = document.getElementById("pharmacyRepSelect");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const repId = repFilter ? repFilter.value : "all";

  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let pharms = getPharmaciesData();

  // Role scoping
  if (!isMgr) {
    pharms = pharms.filter((p) => p.repId === currentUser.id || p.repId === "rep1" || !p.repId);
  } else if (repId !== "all") {
    pharms = pharms.filter((p) => p.repId === repId);
  }

  // Search filter
  const filtered = pharms.filter((p) => {
    return (
      !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.address && p.address.toLowerCase().includes(query)) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query))
    );
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? "Pharmacy" : "Pharmacies"}`;
  }

  if (filtered.length === 0) {
    grid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  if (emptyState) emptyState.style.display = "none";

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  grid.innerHTML = filtered
    .map((p) => {
      const repObj = allUsers.find((u) => u.id === p.repId);
      const repName = repObj ? repObj.name : (lang === "ar" ? "غير مسند" : "Unassigned");

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar pharmacy">💊</div>
          <div class="directory-header-info">
            <h4 class="directory-name">${escPharm(p.name)}</h4>
            <span class="directory-meta-tag pharmacy">Partner Pharmacy</span>
          </div>
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${escPharm(p.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👨‍🔬</span>
            <span class="info-text">Contact: <strong>${escPharm(p.contactPerson || "N/A")}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${escPharm(p.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">Rep: <strong>${escPharm(repName)}</strong></span>
          </div>
        </div>
        <div class="directory-card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="openPharmacyModal('${p.id}')">
            ✏️ Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeletePharmacyModal('${p.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

function openPharmacyModal(pharmId = null) {
  const modal = document.getElementById("pharmacyModal");
  if (!modal) return;

  const idInput = document.getElementById("pharmacyId");
  const nameInput = document.getElementById("pharmacyNameInput");
  const addressInput = document.getElementById("pharmacyAddressInput");
  const contactInput = document.getElementById("pharmacyContactInput");
  const phoneInput = document.getElementById("pharmacyPhoneInput");
  const repInput = document.getElementById("pharmacyRepInput");

  // Populate Rep select dropdown
  if (repInput) {
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const reps = allUsers.filter((u) => u.role === "medical_rep" || u.role === "rep");
    repInput.innerHTML = reps.map((r) => `<option value="${r.id}">${r.name} (${r.employeeCode || "Rep"})</option>`).join("");
  }

  if (pharmId) {
    const pharms = getPharmaciesData();
    const pharm = pharms.find((p) => p.id === pharmId);
    if (pharm) {
      if (idInput) idInput.value = pharm.id;
      if (nameInput) nameInput.value = pharm.name || "";
      if (addressInput) addressInput.value = pharm.address || "";
      if (contactInput) contactInput.value = pharm.contactPerson || "";
      if (phoneInput) phoneInput.value = pharm.phone || "";
      if (repInput && pharm.repId) repInput.value = pharm.repId;
    }
  } else {
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (addressInput) addressInput.value = "";
    if (contactInput) contactInput.value = "";
    if (phoneInput) phoneInput.value = "";
    const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
    if (repInput) repInput.value = currentUser.id;
  }

  modal.style.display = "flex";
  modal.classList.add("active");
}

function closePharmacyModal() {
  const modal = document.getElementById("pharmacyModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

function savePharmacy() {
  const idInput = document.getElementById("pharmacyId");
  const nameInput = document.getElementById("pharmacyNameInput");
  const addressInput = document.getElementById("pharmacyAddressInput");
  const contactInput = document.getElementById("pharmacyContactInput");
  const phoneInput = document.getElementById("pharmacyPhoneInput");
  const repSelect = document.getElementById("pharmacyRepInput");

  if (!nameInput || !addressInput) return;

  const id = idInput ? idInput.value : "";
  const name = nameInput.value.trim();
  const address = addressInput.value.trim();
  const contactPerson = contactInput ? contactInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";

  // Automatic repId binding to active user if unselected
  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const assignedRepId = (repSelect && repSelect.value) ? repSelect.value : currentUser.id;

  if (!name || !address) {
    if (typeof showToast === "function") showToast("Please fill in required fields.", "warning");
    return;
  }

  const pharmacyObj = {
    id: id || "pharm_" + Date.now(),
    name,
    address,
    contactPerson,
    phone,
    repId: assignedRepId
  };

  if (window.store && window.store.pharmacies) {
    window.store.pharmacies.save(pharmacyObj);
  } else {
    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    if (!Array.isArray(window.DEMO_DATA.pharmacies)) window.DEMO_DATA.pharmacies = [];
    const idx = window.DEMO_DATA.pharmacies.findIndex((p) => p.id === pharmacyObj.id);
    if (idx >= 0) {
      window.DEMO_DATA.pharmacies[idx] = { ...window.DEMO_DATA.pharmacies[idx], ...pharmacyObj };
    } else {
      window.DEMO_DATA.pharmacies.unshift(pharmacyObj);
    }
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closePharmacyModal();
  renderPharmaciesReport();
  if (typeof showToast === "function") showToast("Pharmacy saved successfully.", "success");
}

let pharmacyToDeleteId = null;

function openDeletePharmacyModal(pharmId) {
  pharmacyToDeleteId = pharmId;
  const modal = document.getElementById("deletePharmacyModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

function closeDeletePharmacyModal() {
  pharmacyToDeleteId = null;
  const modal = document.getElementById("deletePharmacyModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

function confirmDeletePharmacy() {
  if (!pharmacyToDeleteId) return;

  if (window.store && window.store.pharmacies) {
    window.store.pharmacies.delete(pharmacyToDeleteId);
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.pharmacies)) {
    window.DEMO_DATA.pharmacies = window.DEMO_DATA.pharmacies.filter((p) => p.id !== pharmacyToDeleteId);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeDeletePharmacyModal();
  renderPharmaciesReport();
  if (typeof showToast === "function") showToast("Pharmacy deleted successfully.", "info");
}

function onPharmacyFilterChange() {
  renderPharmaciesReport();
}

function onPharmacyLmChange() {}
function onPharmacyDmChange() {}
function onPharmacyModalLmChange() {}
function onPharmacyModalDmChange() {}

window.renderPharmaciesReport = renderPharmaciesReport;
window.openPharmacyModal = openPharmacyModal;
window.closePharmacyModal = closePharmacyModal;
window.savePharmacy = savePharmacy;
window.openDeletePharmacyModal = openDeletePharmacyModal;
window.closeDeletePharmacyModal = closeDeletePharmacyModal;
window.confirmDeletePharmacy = confirmDeletePharmacy;
window.onPharmacyFilterChange = onPharmacyFilterChange;