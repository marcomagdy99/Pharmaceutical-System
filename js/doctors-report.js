/**
 * @file doctors-report.js
 * @description Doctors directory management, filtering, rendering, and CRUD operations within the reports page, with automatic repId binding.
 */

const esc = window.escapeHtml || ((s) => s || "");

function getDoctorsData() {
  if (window.store && window.store.doctors) {
    return window.store.doctors.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
}

function renderDoctorsReport() {
  const grid = document.getElementById("doctorsDirectoryGrid");
  const emptyState = document.getElementById("doctorsEmptyState");
  const countBadge = document.getElementById("totalDoctorsCountBadge");
  if (!grid) return;

  const searchInput = document.getElementById("doctorSearchInput");
  const specialtyFilter = document.getElementById("doctorSpecialtyFilter");
  const classFilter = document.getElementById("doctorClassFilter");
  const repFilter = document.getElementById("doctorRepSelect");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const specialty = specialtyFilter ? specialtyFilter.value : "all";
  const docClass = classFilter ? classFilter.value : "all";
  const repId = repFilter ? repFilter.value : "all";

  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let docs = getDoctorsData();

  // Role scoping
  if (!isMgr) {
    docs = docs.filter((d) => d.repId === currentUser.id || d.repId === "rep1" || !d.repId);
  } else if (repId !== "all") {
    docs = docs.filter((d) => d.repId === repId);
  }

  // Filters
  const filtered = docs.filter((d) => {
    const matchQuery =
      !query ||
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.address && d.address.toLowerCase().includes(query)) ||
      (d.clinicAddress && d.clinicAddress.toLowerCase().includes(query)) ||
      (d.phone && d.phone.toLowerCase().includes(query));

    const matchSpecialty = specialty === "all" || d.specialty === specialty;
    const matchClass = docClass === "all" || d.class === docClass;

    return matchQuery && matchSpecialty && matchClass;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? "Doctor" : "Doctors"}`;
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
    .map((d) => {
      const repObj = allUsers.find((u) => u.id === d.repId);
      const repName = repObj ? repObj.name : (lang === "ar" ? "غير مسند" : "Unassigned");
      const isClassA = d.class === "A";

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar doctor">🩺</div>
          <div class="directory-header-info">
            <h4 class="directory-name">${esc(d.name)}</h4>
            <span class="directory-meta-tag specialty">${esc(d.specialty || "General")}</span>
          </div>
          <span class="badge ${isClassA ? "bg-warning text-dark" : "bg-secondary"} ms-auto" style="font-size: 0.72rem;">
            Class ${d.class || "B"}
          </span>
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${esc(d.clinicAddress || d.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${esc(d.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">Rep: <strong>${esc(repName)}</strong></span>
          </div>
        </div>
        <div class="directory-card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="openDoctorModal('${d.id}')">
            ✏️ Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteDoctorModal('${d.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

function openDoctorModal(docId = null) {
  const modal = document.getElementById("doctorModal");
  if (!modal) return;

  const idInput = document.getElementById("doctorId");
  const nameInput = document.getElementById("doctorNameInput");
  const specialtyInput = document.getElementById("doctorSpecialtyInput");
  const classInput = document.getElementById("doctorClassInput");
  const addressInput = document.getElementById("doctorAddressInput");
  const phoneInput = document.getElementById("doctorPhoneInput");
  const repInput = document.getElementById("doctorRepInput");

  // Populate Rep select dropdown
  if (repInput) {
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const reps = allUsers.filter((u) => u.role === "medical_rep" || u.role === "rep");
    repInput.innerHTML = reps.map((r) => `<option value="${r.id}">${r.name} (${r.employeeCode || "Rep"})</option>`).join("");
  }

  if (docId) {
    const docs = getDoctorsData();
    const doc = docs.find((d) => d.id === docId);
    if (doc) {
      if (idInput) idInput.value = doc.id;
      if (nameInput) nameInput.value = doc.name || "";
      if (specialtyInput) specialtyInput.value = doc.specialty || "Internal Medicine";
      if (classInput) classInput.value = doc.class || "A";
      if (addressInput) addressInput.value = doc.clinicAddress || doc.address || "";
      if (phoneInput) phoneInput.value = doc.phone || "";
      if (repInput && doc.repId) repInput.value = doc.repId;
    }
  } else {
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (addressInput) addressInput.value = "";
    if (phoneInput) phoneInput.value = "";
    const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
    if (repInput) repInput.value = currentUser.id;
  }

  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeDoctorModal() {
  const modal = document.getElementById("doctorModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

function saveDoctor() {
  const idInput = document.getElementById("doctorId");
  const nameInput = document.getElementById("doctorNameInput");
  const specialtyInput = document.getElementById("doctorSpecialtyInput");
  const classInput = document.getElementById("doctorClassInput");
  const addressInput = document.getElementById("doctorAddressInput");
  const phoneInput = document.getElementById("doctorPhoneInput");
  const repSelect = document.getElementById("doctorRepInput");

  if (!nameInput || !addressInput) return;

  const id = idInput ? idInput.value : "";
  const name = nameInput.value.trim();
  const specialty = specialtyInput ? specialtyInput.value : "Internal Medicine";
  const docClass = classInput ? classInput.value : "A";
  const address = addressInput.value.trim();
  const phone = phoneInput ? phoneInput.value.trim() : "";

  // Automatic repId binding to active user if unselected
  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const assignedRepId = (repSelect && repSelect.value) ? repSelect.value : currentUser.id;

  if (!name || !address) {
    if (typeof showToast === "function") showToast("Please fill in required fields.", "warning");
    return;
  }

  const doctorObj = {
    id: id || "doc_" + Date.now(),
    name,
    specialty,
    class: docClass,
    address,
    clinicAddress: address,
    phone,
    repId: assignedRepId,
    visitsThisQuarter: 0
  };

  if (window.store && window.store.doctors) {
    window.store.doctors.save(doctorObj);
  } else {
    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    if (!Array.isArray(window.DEMO_DATA.doctors)) window.DEMO_DATA.doctors = [];
    const idx = window.DEMO_DATA.doctors.findIndex((d) => d.id === doctorObj.id);
    if (idx >= 0) {
      window.DEMO_DATA.doctors[idx] = { ...window.DEMO_DATA.doctors[idx], ...doctorObj };
    } else {
      window.DEMO_DATA.doctors.unshift(doctorObj);
    }
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeDoctorModal();
  renderDoctorsReport();
  if (typeof showToast === "function") showToast("Doctor saved successfully.", "success");
}

let doctorToDeleteId = null;

function openDeleteDoctorModal(docId) {
  doctorToDeleteId = docId;
  const modal = document.getElementById("deleteDoctorModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

function closeDeleteDoctorModal() {
  doctorToDeleteId = null;
  const modal = document.getElementById("deleteDoctorModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

function confirmDeleteDoctor() {
  if (!doctorToDeleteId) return;

  if (window.store && window.store.doctors) {
    window.store.doctors.delete(doctorToDeleteId);
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.doctors)) {
    window.DEMO_DATA.doctors = window.DEMO_DATA.doctors.filter((d) => d.id !== doctorToDeleteId);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeDeleteDoctorModal();
  renderDoctorsReport();
  if (typeof showToast === "function") showToast("Doctor deleted successfully.", "info");
}

function onDoctorFilterChange() {
  renderDoctorsReport();
}

function onDoctorLmChange() {}
function onDoctorDmChange() {}
function onDoctorModalLmChange() {}
function onDoctorModalDmChange() {}

window.renderDoctorsReport = renderDoctorsReport;
window.openDoctorModal = openDoctorModal;
window.closeDoctorModal = closeDoctorModal;
window.saveDoctor = saveDoctor;
window.openDeleteDoctorModal = openDeleteDoctorModal;
window.closeDeleteDoctorModal = closeDeleteDoctorModal;
window.confirmDeleteDoctor = confirmDeleteDoctor;
window.onDoctorFilterChange = onDoctorFilterChange;