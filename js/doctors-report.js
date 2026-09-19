/**
 * @file doctors-report.js
 * @description Doctors directory management, filtering, rendering, and CRUD operations within the reports page, with automatic repId binding.
 */

function getDoctorsData() {
  if (window.store && window.store.doctors) {
    return window.store.doctors.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
}

function populateDoctorSpecialtyFilter() {
  const selectEl = document.getElementById("doctorSpecialtyFilter");
  if (!selectEl) return;

  const currentVal = selectEl.value || "all";
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const allSpecs =
    (window.store && window.store.specialties
      ? window.store.specialties.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];

  const allLabel = isAr ? "جميع التخصصات" : "All Specialties";

  let html = `<option value="all" data-i18n="allSpecialties">${allLabel}</option>`;
  allSpecs.forEach((s) => {
    const label = isAr ? (s.nameAr ? `${s.nameAr} (${s.name})` : s.name) : s.name;
    const isSelected = (currentVal === s.name || currentVal === s.id) ? " selected" : "";
    html += `<option value="${window.escapeHtml(s.name)}" data-id="${window.escapeHtml(s.id)}"${isSelected}>${window.escapeHtml(label)}</option>`;
  });

  selectEl.innerHTML = html;
  if (currentVal && currentVal !== "all") {
    selectEl.value = currentVal;
  }
}

function getScopedDoctors(respectActiveFilters = true) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase();
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let docs = getDoctorsData();

  // Role scoping: Reps get all doctors assigned to their id OR located in any of their assigned areas (only if unassigned)
  if (!isMgr) {
    const repAreas = (window.store && window.store.areas) ? window.store.areas.getByRep(currentUser.id) : [];
    const repAreaIds = repAreas.map((a) => a.id);
    const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
    docs = docs.filter((d) =>
      d.repId === currentUser.id ||
      (!d.repId && (
        (d.areaId && repAreaIds.includes(d.areaId)) ||
        (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
      ))
    );
  } else {
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    let allowedTeamIds = null;

    if (role === "district_manager") {
      const teamRepIds = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...teamRepIds];
    } else if (role === "line_manager") {
      const dms = allUsers.filter((u) => u.managerId === currentUser.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
      const dmIds = dms.map((d) => d.id);
      const repIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...dmIds, ...repIds];
    } else if (role === "business_unit") {
      const myLMs = allUsers.filter((u) => u.managerId === currentUser.id);
      const myLmIds = myLMs.map((u) => u.id);
      const myDownstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
      const myDownstreamIds = myDownstream.map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...myLmIds, ...myDownstreamIds];
    }

    if (allowedTeamIds) {
      docs = docs.filter((d) => d.repId ? allowedTeamIds.includes(d.repId) : (role === "admin" || role === "hr"));
    }

    const repFilter = document.getElementById("doctorRepSelect");
    const repId = repFilter ? repFilter.value : "all";
    if (repId !== "all") {
      const isLM = allUsers.some((u) => u.id === repId && (u.role === "line_manager" || u.role === "lm"));
      const isDM = allUsers.some((u) => u.id === repId && (u.role === "district_manager" || u.role === "dm"));
      if (isLM) {
        const dmsUnderLM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
        const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
        docs = docs.filter((d) => d.repId && repsUnderLM.includes(d.repId) && (!allowedTeamIds || allowedTeamIds.includes(d.repId)));
      } else if (isDM) {
        const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
        docs = docs.filter((d) => d.repId && (repsUnderDM.includes(d.repId) || d.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(d.repId)));
      } else {
        docs = docs.filter((d) => d.repId === repId && (!allowedTeamIds || allowedTeamIds.includes(d.repId)));
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    docs = docs.filter((d) => {
      if (d.lineId) return d.lineId === selectedLineId;
      if (Array.isArray(d.lineIds) && d.lineIds.length > 0) return d.lineIds.includes(selectedLineId);
      if (!d.repId) return role === 'admin' || role === 'hr';
      const repLines = window.getUserLines ? window.getUserLines(d.repId) : [];
      return repLines.some((l) => l.id === selectedLineId);
    });
  }

  if (!respectActiveFilters) {
    return docs;
  }

  const searchInput = document.getElementById("doctorSearchInput");
  const specialtyFilter = document.getElementById("doctorSpecialtyFilter");
  const classFilter = document.getElementById("doctorClassFilter");

  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const specialty = specialtyFilter ? specialtyFilter.value : "all";
  const docClass = classFilter ? classFilter.value : "all";

  const allSpecs =
    (window.store && window.store.specialties
      ? window.store.specialties.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];
  const selectedSpecObj = allSpecs.find(
    (s) => s.name === specialty || s.id === specialty,
  );

  return docs.filter((d) => {
    const matchQuery =
      !query ||
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.nameAr && d.nameAr.toLowerCase().includes(query)) ||
      (d.address && d.address.toLowerCase().includes(query)) ||
      (d.clinicAddress && d.clinicAddress.toLowerCase().includes(query)) ||
      (d.phone && d.phone.toLowerCase().includes(query));

    const matchSpecialty =
      specialty === "all" ||
      d.specialty === specialty ||
      d.specialtyId === specialty ||
      (d.specialtyAr && d.specialtyAr === specialty) ||
      (selectedSpecObj &&
        (d.specialtyId === selectedSpecObj.id ||
          (d.specialty &&
            d.specialty.toLowerCase() === selectedSpecObj.name.toLowerCase()) ||
          (selectedSpecObj.nameAr && d.specialty === selectedSpecObj.nameAr) ||
          (selectedSpecObj.nameAr && d.specialtyAr === selectedSpecObj.nameAr)));

    const matchClass = docClass === "all" || d.class === docClass;

    return matchQuery && matchSpecialty && matchClass;
  });
}

function renderDoctorsReport() {
  const prompt = document.getElementById("doctorsPromptContainer");
  const results = document.getElementById("doctorsResultsContainer");
  if (prompt) prompt.style.display = "none";
  if (results) results.style.display = "block";

  const grid = document.getElementById("doctorsDirectoryGrid");
  const emptyState = document.getElementById("doctorsEmptyState");
  const countBadge = document.getElementById("totalDoctorsCountBadge");
  if (countBadge) countBadge.style.display = "inline-flex";
  if (!grid) return;

  const specialtyFilter = document.getElementById("doctorSpecialtyFilter");
  if (specialtyFilter && specialtyFilter.options.length <= 1) {
    populateDoctorSpecialtyFilter();
  }

  const docs = getScopedDoctors(false);
  const filtered = getScopedDoctors(true);

  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? "Doctor" : "Doctors"}`;
  }

  try {
    if (typeof window.renderDoctorClassesChart === "function") {
      const classACount = docs.filter((d) => d.class === "A").length;
      const classBCount = docs.filter((d) => d.class === "B").length;
      const allHospitals = (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
      const repFilter = document.getElementById("doctorRepSelect");
      const repVal = (repFilter && repFilter.value) ? repFilter.value : "all";
      let hospitalsCount = allHospitals.length;
      if (repVal && repVal !== "all") {
        hospitalsCount = allHospitals.filter((h) => !h.repId || h.repId === repVal).length;
      }
      hospitalsCount += docs.filter((d) => d.type === "hospital" || d.class === "hospital").length;
      window.renderDoctorClassesChart("repDoctorClassesChart", classACount, classBCount, hospitalsCount);
    }
  } catch (chartErr) {
    console.warn("Doctor classes chart render warning:", chartErr);
  }

  if (filtered.length === 0) {
    grid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  if (emptyState) emptyState.style.display = "none";

  const currentUser = (typeof checkAuth === 'function' ? checkAuth() : null) || (window.DEMO_DATA && window.DEMO_DATA.currentUser);
  const normalizedRole = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase()) : '';
  const isAdmin = normalizedRole === 'admin';
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
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
            <h4 class="directory-name">${window.escapeHtml(d.name)}</h4>
            <span class="directory-meta-tag specialty">${window.escapeHtml(d.specialty || "General")}</span>
          </div>
          <span class="badge ${isClassA ? "bg-warning text-dark" : "bg-secondary"} ms-auto" style="font-size: 0.72rem;">
            Class ${d.class || "B"}
          </span>
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${window.escapeHtml(d.clinicAddress || d.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${window.escapeHtml(d.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">Rep: <strong>${window.escapeHtml(repName)}</strong></span>
          </div>
        </div>
        ${isAdmin ? `
        <div class="directory-card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="openDoctorModal('${d.id}')">
            ✏️ ${lang === 'ar' ? 'تعديل' : 'Edit'}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteDoctorModal('${d.id}')">
            🗑️ ${lang === 'ar' ? 'حذف' : 'Delete'}
          </button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");
}

function openDoctorModal(docId = null) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة وتعديل الأطباء للأدمن فقط." : "Permission Denied: Only Admin can manage doctors.", "error");
    }
    return;
  }

  const modal = document.getElementById("doctorModal");
  if (!modal) return;

  const idInput = document.getElementById("doctorId");
  const nameInput = document.getElementById("doctorNameInput");
  const specialtyInput = document.getElementById("doctorSpecialtyInput");
  const classInput = document.getElementById("doctorClassInput");
  const addressInput = document.getElementById("doctorAddressInput");
  const phoneInput = document.getElementById("doctorPhoneInput");
  const repInput = document.getElementById("doctorRepInput");

  const existingRepId = docId ? (getDoctorsData().find((d) => d.id === docId) || {}).repId : null;

  // Populates doctorModalLmSelect -> doctorModalDmSelect -> doctorRepInput
  // as a real cascading hierarchy (defined in shared-report.js), instead
  // of a flat list of every rep in the system.
  if (typeof populateModalHierarchy === "function") {
    populateModalHierarchy(
      "doctorModalLmSelect",
      "doctorModalDmSelect",
      "doctorRepInput",
      existingRepId || currentUser.id,
    );
  }

  if (specialtyInput) {
    const specs = (window.store && window.store.specialties ? window.store.specialties.getAll() : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];
    if (specs.length > 0) {
      const isAr = (window.getCurrentLang && window.getCurrentLang() === "ar");
      specialtyInput.innerHTML = specs.map((s) => `<option value="${s.id}">${window.escapeHtml(isAr ? (s.nameAr || s.name) : s.name)}</option>`).join("");
    }
  }

  if (docId) {
    const docs = getDoctorsData();
    const doc = docs.find((d) => d.id === docId);
    if (doc) {
      if (idInput) idInput.value = doc.id;
      if (nameInput) nameInput.value = doc.name || "";
      if (specialtyInput) {
        if (doc.specialtyId) {
          specialtyInput.value = doc.specialtyId;
        } else {
          // Fallback match by name
          const matchOpt = Array.from(specialtyInput.options).find((o) => o.text.toLowerCase() === (doc.specialty || "").toLowerCase() || o.value.toLowerCase() === (doc.specialty || "").toLowerCase());
          if (matchOpt) specialtyInput.value = matchOpt.value;
        }
      }
      if (classInput) classInput.value = doc.class || "A";
      if (addressInput) addressInput.value = doc.clinicAddress || doc.address || "";
      if (phoneInput) phoneInput.value = doc.phone || "";
    }
  } else {
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (addressInput) addressInput.value = "";
    if (phoneInput) phoneInput.value = "";
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
  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: إضافة وتعديل الأطباء للأدمن فقط." : "Permission Denied: Only Admin can add/edit doctors.", "error");
    }
    return;
  }

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
  const selectedSpecVal = specialtyInput ? specialtyInput.value : "spec_internal";
  
  const allSpecs = (window.store && window.store.specialties ? window.store.specialties.getAll() : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];
  const foundSpec = allSpecs.find((s) => s.id === selectedSpecVal || s.name === selectedSpecVal);
  const specialtyId = foundSpec ? foundSpec.id : (selectedSpecVal.startsWith("spec_") ? selectedSpecVal : "spec_other");
  const specialty = foundSpec ? foundSpec.name : (specialtyInput?.options[specialtyInput.selectedIndex]?.text || "Internal Medicine");
  const specialtyAr = foundSpec ? (foundSpec.nameAr || foundSpec.name) : specialty;

  const docClass = classInput ? classInput.value : "A";
  const address = addressInput.value.trim();
  const phone = phoneInput ? phoneInput.value.trim() : "";

  // Automatic repId binding to active user if unselected
  const assignedRepId = (repSelect && repSelect.value) ? repSelect.value : currentUser.id;

  if (!name || !address) {
    if (typeof showToast === "function") showToast("Please fill in required fields.", "warning");
    return;
  }

  const doctorObj = {
    id: id || "doc_" + Date.now(),
    name,
    specialtyId,
    specialty,
    specialtyAr,
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
  if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حفظ الطبيب بنجاح." : "Doctor saved successfully.", "success");
}

let doctorToDeleteId = null;

function openDeleteDoctorModal(docId) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف الأطباء للأدمن فقط." : "Permission Denied: Only Admin can delete doctors.", "error");
    }
    return;
  }

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
  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف الأطباء للأدمن فقط." : "Permission Denied: Only Admin can delete doctors.", "error");
    }
    return;
  }

  if (!doctorToDeleteId) return;

  if (window.store && window.store.doctors) {
    window.store.doctors.delete(doctorToDeleteId);
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.doctors)) {
    window.DEMO_DATA.doctors = window.DEMO_DATA.doctors.filter((d) => d.id !== doctorToDeleteId);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeDeleteDoctorModal();
  renderDoctorsReport();
  if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حذف الطبيب بنجاح." : "Doctor deleted successfully.", "info");
}

function onDoctorFilterChange() {
  const results = document.getElementById("doctorsResultsContainer");
  if (results && results.style.display !== "none") {
    renderDoctorsReport();
  }
}

function onDoctorLmChange() {}
function onDoctorDmChange() {}

function initDoctorsDirectory(user) {
  populateDoctorSpecialtyFilter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    populateDoctorSpecialtyFilter();
  });
} else {
  populateDoctorSpecialtyFilter();
}

function exportDoctorsDirectory() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const docsToExport = getScopedDoctors(true);

  if (!docsToExport || docsToExport.length === 0) {
    const msg = isAr ? "لا توجد بيانات أطباء لتصديرها." : "No doctor records found to export.";
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  const headers = isAr
    ? ["اسم الطبيب", "التخصص", "الفئة", "المنطقة", "عنوان العيادة", "رقم الهاتف", "المندوب المسؤول"]
    : ["Doctor Name", "Specialty", "Class", "Area", "Clinic Address", "Phone", "Representative"];

  const rows = docsToExport.map((d) => {
    const docName = isAr ? (d.nameAr || d.name || "") : (d.name || d.nameAr || "");
    const spec = isAr ? (d.specialtyAr || d.specialty || "") : (d.specialty || d.specialtyAr || "");
    const docClass = d.class || "";

    let areaName = d.area || "";
    if (!areaName && d.areaId) {
      const a = allAreas.find((x) => x.id === d.areaId);
      if (a) areaName = a.name;
    }

    const clinicAddr = d.clinicAddress || d.address || "";
    const phone = d.phone || "";

    let repName = "";
    if (d.repId) {
      const u = allUsers.find((x) => x.id === d.repId);
      if (u) repName = u.name;
    }

    return [docName, spec, docClass, areaName, clinicAddr, phone, repName];
  });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const fileName = isAr ? `دليل_الأطباء_${dateStr}` : `doctors_directory_${dateStr}`;
  const sheetTitle = isAr ? "الأطباء" : "Doctors";

  if (typeof window.downloadExcelOrCsv === "function") {
    window.downloadExcelOrCsv(fileName, sheetTitle, rows, headers);
  } else {
    const escapeCsv = (val) => {
      const s = val === null || val === undefined ? "" : String(val);
      if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const successMsg = isAr ? "تم تصدير الدليل بنجاح (.csv)" : "Directory exported successfully (.csv)";
    if (typeof showToast === "function") showToast(successMsg, "success");
  }
}

window.getScopedDoctors = getScopedDoctors;
window.exportDoctorsDirectory = exportDoctorsDirectory;
window.populateDoctorSpecialtyFilter = populateDoctorSpecialtyFilter;
window.renderDoctorsReport = renderDoctorsReport;
window.initDoctorsDirectory = initDoctorsDirectory;
window.openDoctorModal = openDoctorModal;
window.closeDoctorModal = closeDoctorModal;
window.saveDoctor = saveDoctor;
window.openDeleteDoctorModal = openDeleteDoctorModal;
window.closeDeleteDoctorModal = closeDeleteDoctorModal;
window.confirmDeleteDoctor = confirmDeleteDoctor;
window.onDoctorFilterChange = onDoctorFilterChange;

