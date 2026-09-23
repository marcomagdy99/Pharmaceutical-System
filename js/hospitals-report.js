/**
 * @file hospitals-report.js
 * @description Hospitals directory management, filtering, rendering, and CRUD operations within the reports page, with automatic repId and territory binding.
 */

function getHospitalsData() {
  if (window.store && window.store.hospitals) {
    return window.store.hospitals.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
}

function getScopedHospitals(respectActiveFilters = true) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase();
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let hosps = getHospitalsData();

  // Role scoping: Reps get all hospitals assigned to their id OR located in any of their assigned areas
  if (!isMgr) {
    const repAreas = (window.store && window.store.areas) ? window.store.areas.getByRep(currentUser.id) : [];
    const repAreaIds = repAreas.map((a) => a.id);
    const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
    hosps = hosps.filter((h) =>
      h.repId === currentUser.id ||
      (h.areaId && repAreaIds.includes(h.areaId)) ||
      (h.area && repAreaNames.includes(h.area.toLowerCase().trim()))
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
      hosps = hosps.filter((h) => h.repId ? allowedTeamIds.includes(h.repId) : (role === "admin" || role === "hr"));
    }

    const repFilter = document.getElementById("hospitalRepSelect");
    const repId = (repFilter && repFilter.value) ? repFilter.value : "all";
    if (repId !== "all") {
      const isLM = allUsers.some((u) => u.id === repId && (u.role === "line_manager" || u.role === "lm"));
      const isDM = allUsers.some((u) => u.id === repId && (u.role === "district_manager" || u.role === "dm"));
      if (isLM) {
        const dmsUnderLM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
        const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
        hosps = hosps.filter((h) => h.repId && repsUnderLM.includes(h.repId) && (!allowedTeamIds || allowedTeamIds.includes(h.repId)));
      } else if (isDM) {
        const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
        hosps = hosps.filter((h) => h.repId && (repsUnderDM.includes(h.repId) || h.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(h.repId)));
      } else {
        hosps = hosps.filter((h) => h.repId === repId && (!allowedTeamIds || allowedTeamIds.includes(h.repId)));
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    hosps = hosps.filter((h) => {
      if (h.lineId) return h.lineId === selectedLineId;
      if (Array.isArray(h.lineIds) && h.lineIds.length > 0) return h.lineIds.includes(selectedLineId);
      if (!h.repId) return role === 'admin' || role === 'hr';
      const repLines = window.getUserLines ? window.getUserLines(h.repId) : [];
      return repLines.some((l) => l.id === selectedLineId);
    });
  }

  if (!respectActiveFilters) {
    return hosps;
  }

  const searchInput = document.getElementById("hospitalSearchInput");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  return hosps.filter((h) => {
    return (
      !query ||
      (h.name && h.name.toLowerCase().includes(query)) ||
      (h.nameAr && h.nameAr.toLowerCase().includes(query)) ||
      (h.address && h.address.toLowerCase().includes(query)) ||
      (h.phone && h.phone.toLowerCase().includes(query))
    );
  });
}

function renderHospitalsReport() {
  const prompt = document.getElementById("hospitalsPromptContainer");
  const results = document.getElementById("hospitalsResultsContainer");
  if (prompt) prompt.style.display = "none";
  if (results) results.style.display = "block";

  const grid = document.getElementById("hospitalsDirectoryGrid");
  const emptyState = document.getElementById("hospitalsEmptyState");
  const countBadge = document.getElementById("totalHospitalsCountBadge");
  if (countBadge) countBadge.style.display = "inline-flex";
  if (!grid) return;

  const filtered = getScopedHospitals(true);
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? (isAr ? "مستشفى" : "Hospital") : (isAr ? "مستشفيات" : "Hospitals")}`;
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
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines)) || [];

  grid.innerHTML = filtered
    .map((h) => {
      const repObj = allUsers.find((u) => u.id === h.repId);
      const repName = repObj ? repObj.name : (isAr ? "غير مسند" : "Unassigned");
      const areaObj = allAreas.find((a) => a.id === h.areaId);
      const areaName = areaObj ? (areaObj.name || areaObj.id) : (h.area || (isAr ? "عام" : "General"));
      const lineObj = allLines.find((l) => l.id === h.lineId);
      const lineName = lineObj ? (isAr ? (lineObj.nameAr || lineObj.name) : lineObj.name) : "";
      const displayName = isAr ? (h.nameAr || h.name) : (h.name || h.nameAr);

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar hospital">🏥</div>
          <div class="directory-header-info">
            <h4 class="directory-name">${window.escapeHtml(displayName)}</h4>
            <span class="directory-meta-tag hospital">${isAr ? "مستشفى / مركز طبي" : "Hospital / Medical Center"}</span>
          </div>
          ${lineName ? `<span class="badge bg-secondary ms-auto" style="font-size: 0.72rem;">${window.escapeHtml(lineName)}</span>` : ""}
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${window.escapeHtml(h.address || (isAr ? "العنوان غير محدد" : "No address specified"))}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">🏢</span>
            <span class="info-text">${isAr ? "المنطقة:" : "Area:"} <strong>${window.escapeHtml(areaName)}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${window.escapeHtml(h.phone || (isAr ? "لا يوجد هاتف" : "No phone provided"))}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">${isAr ? "المندوب المسؤول:" : "Rep:"} <strong>${window.escapeHtml(repName)}</strong></span>
          </div>
        </div>
        ${isAdmin ? `
        <div class="directory-card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="openHospitalModal('${h.id}')">
            ✏️ ${isAr ? 'تعديل' : 'Edit'}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteHospitalModal('${h.id}')">
            🗑️ ${isAr ? 'حذف' : 'Delete'}
          </button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");
}

function openHospitalModal(hospId = null) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة وتعديل المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can manage hospitals.", "error");
    }
    return;
  }

  const modal = document.getElementById("hospitalModal");
  if (!modal) return;

  const idInput = document.getElementById("hospitalId");
  const nameInput = document.getElementById("hospitalNameInput");
  const nameArInput = document.getElementById("hospitalNameArInput");
  const addressInput = document.getElementById("hospitalAddressInput");
  const phoneInput = document.getElementById("hospitalPhoneInput");
  const areaInput = document.getElementById("hospitalAreaInput");

  const existingHosp = hospId ? (getHospitalsData().find((h) => h.id === hospId) || {}) : {};
  const existingRepId = existingHosp.repId || null;
  const existingAreaId = existingHosp.areaId || null;

  // Populates hospitalModalLmSelect -> hospitalModalDmSelect -> hospitalRepInput -> hospitalAreaInput
  if (typeof populateModalHierarchy === "function") {
    populateModalHierarchy(
      "hospitalModalLmSelect",
      "hospitalModalDmSelect",
      "hospitalRepInput",
      existingRepId || currentUser.id,
      "hospitalAreaInput",
      existingAreaId,
    );
  }

  const modalTitle = document.getElementById("hospitalModalTitle");
  const isAr = (typeof getCurrentLang === "function" && getCurrentLang() === "ar");

  if (hospId) {
    const hosps = getHospitalsData();
    const hosp = hosps.find((h) => h.id === hospId);
    if (hosp) {
      if (idInput) idInput.value = hosp.id;
      if (nameInput) nameInput.value = hosp.name || "";
      if (nameArInput) nameArInput.value = hosp.nameAr || "";
      if (addressInput) addressInput.value = hosp.address || "";
      if (phoneInput) phoneInput.value = hosp.phone || "";
      if (areaInput && hosp.areaId) areaInput.value = hosp.areaId;
    }
    if (modalTitle) modalTitle.textContent = isAr ? "تعديل بيانات المستشفى" : "Edit Hospital";
  } else {
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (nameArInput) nameArInput.value = "";
    if (addressInput) addressInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (modalTitle) modalTitle.textContent = isAr ? "إضافة مستشفى" : "Add Hospital";
  }

  modal.style.display = "flex";
  modal.classList.add("active");
}

function closeHospitalModal() {
  const modal = document.getElementById("hospitalModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

function saveHospital() {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: إضافة وتعديل المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can add/edit hospitals.", "error");
    }
    return;
  }

  const idInput = document.getElementById("hospitalId");
  const nameInput = document.getElementById("hospitalNameInput");
  const nameArInput = document.getElementById("hospitalNameArInput");
  const addressInput = document.getElementById("hospitalAddressInput");
  const phoneInput = document.getElementById("hospitalPhoneInput");
  const repSelect = document.getElementById("hospitalRepInput");
  const areaSelect = document.getElementById("hospitalAreaInput");

  if (!nameInput || !addressInput) return;

  const id = idInput ? idInput.value : "";
  const name = nameInput.value.trim();
  const nameAr = nameArInput ? nameArInput.value.trim() : "";
  const address = addressInput.value.trim();
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const assignedAreaId = areaSelect ? areaSelect.value.trim() : "";

  if (!name || !address) {
    if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "يرجى ملء الحقول الإلزامية." : "Please fill in required fields.", "warning");
    return;
  }

  if (!assignedAreaId) {
    const isAr = (typeof getCurrentLang === "function" && getCurrentLang() === "ar");
    if (typeof showToast === "function") {
      showToast(isAr ? "يرجى اختيار المنطقة التابعة." : "Please select a territory / area.", "warning");
    }
    return;
  }

  // Resolve area details directly from store
  let assignedAreaName = "";
  let assignedLineId = "";
  let areaObj = null;
  if (window.store && window.store.areas) {
    areaObj = window.store.areas.getById(assignedAreaId);
  }
  if (!areaObj && window.DEMO_DATA && window.DEMO_DATA.areas) {
    areaObj = window.DEMO_DATA.areas.find((a) => a.id === assignedAreaId);
  }

  if (areaObj) {
    assignedAreaName = areaObj.name || "";
    assignedLineId = areaObj.lineId || "";
  }

  // Automatic repId binding from modal selection, area's assigned rep, or currentUser
  const assignedRepId = (repSelect && repSelect.value) ? repSelect.value : ((areaObj && areaObj.repId) || currentUser.id);

  if (!assignedLineId && assignedRepId) {
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const rep = allUsers.find((u) => u.id === assignedRepId);
    if (rep) assignedLineId = (rep.lineIds && rep.lineIds[0]) || rep.lineId || "";
  }

  const hospitalObj = {
    id: id || "hosp_" + Date.now(),
    name,
    nameAr: nameAr || name,
    type: "hospital",
    address,
    phone,
    repId: assignedRepId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
  };

  if (window.store && window.store.hospitals) {
    window.store.hospitals.save(hospitalObj);
  } else {
    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    if (!Array.isArray(window.DEMO_DATA.hospitals)) window.DEMO_DATA.hospitals = [];
    const idx = window.DEMO_DATA.hospitals.findIndex((h) => h.id === hospitalObj.id);
    if (idx >= 0) {
      window.DEMO_DATA.hospitals[idx] = { ...window.DEMO_DATA.hospitals[idx], ...hospitalObj };
    } else {
      window.DEMO_DATA.hospitals.unshift(hospitalObj);
    }
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeHospitalModal();
  renderHospitalsReport();
  if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حفظ المستشفى بنجاح." : "Hospital saved successfully.", "success");
}

let hospitalToDeleteId = null;

function openDeleteHospitalModal(hospId) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can delete hospitals.", "error");
    }
    return;
  }

  hospitalToDeleteId = hospId;
  const modal = document.getElementById("deleteHospitalModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("active");
  }
}

function closeDeleteHospitalModal() {
  hospitalToDeleteId = null;
  const modal = document.getElementById("deleteHospitalModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("active");
  }
}

function confirmDeleteHospital() {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف المستشفيات للأدمن فقط." : "Permission Denied: Only Admin can delete hospitals.", "error");
    }
    return;
  }

  if (!hospitalToDeleteId) return;

  if (window.store && window.store.hospitals) {
    window.store.hospitals.delete(hospitalToDeleteId);
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.hospitals)) {
    window.DEMO_DATA.hospitals = window.DEMO_DATA.hospitals.filter((h) => h.id !== hospitalToDeleteId);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeDeleteHospitalModal();
  renderHospitalsReport();
  if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حذف المستشفى بنجاح." : "Hospital deleted successfully.", "success");
}

function onHospitalFilterChange() {
  renderHospitalsReport();
}

function exportHospitalsDirectory() {
  const hosps = getScopedHospitals(true);
  if (!hosps || hosps.length === 0) {
    if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "لا توجد مستشفيات للتصدير." : "No hospitals to export.", "info");
    return;
  }

  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  const headers = ["ID", "Name (EN)", "Name (AR)", "Address", "Phone", "Rep", "Area", "Line"];
  const rows = hosps.map((h) => {
    const rep = allUsers.find((u) => u.id === h.repId)?.name || "Unassigned";
    const area = allAreas.find((a) => a.id === h.areaId)?.name || h.area || "";
    return [
      `"${h.id}"`,
      `"${(h.name || '').replace(/"/g, '""')}"`,
      `"${(h.nameAr || '').replace(/"/g, '""')}"`,
      `"${(h.address || '').replace(/"/g, '""')}"`,
      `"${(h.phone || '').replace(/"/g, '""')}"`,
      `"${rep.replace(/"/g, '""')}"`,
      `"${area.replace(/"/g, '""')}"`,
      `"${h.lineId || ''}"`
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Hospitals_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Global window bindings
window.getHospitalsData = getHospitalsData;
window.getScopedHospitals = getScopedHospitals;
window.renderHospitalsReport = renderHospitalsReport;
window.openHospitalModal = openHospitalModal;
window.closeHospitalModal = closeHospitalModal;
window.saveHospital = saveHospital;
window.openDeleteHospitalModal = openDeleteHospitalModal;
window.closeDeleteHospitalModal = closeDeleteHospitalModal;
window.confirmDeleteHospital = confirmDeleteHospital;
window.onHospitalFilterChange = onHospitalFilterChange;
window.exportHospitalsDirectory = exportHospitalsDirectory;
