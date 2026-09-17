/**
 * @file pharmacies-report.js
 * @description Pharmacies directory management, filtering, rendering, and CRUD operations within the reports page, with automatic repId binding.
 */

function getPharmaciesData() {
  if (window.store && window.store.pharmacies) {
    return window.store.pharmacies.getAll();
  }
  return (window.DEMO_DATA && window.DEMO_DATA.pharmacies) || [];
}

function getScopedPharmacies(respectActiveFilters = true) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase();
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let pharms = getPharmaciesData();

  // Role scoping: Reps get all pharmacies assigned to their id OR located in any of their assigned areas (only if unassigned)
  if (!isMgr) {
    const repAreas = (window.store && window.store.areas) ? window.store.areas.getByRep(currentUser.id) : [];
    const repAreaIds = repAreas.map((a) => a.id);
    const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
    pharms = pharms.filter((p) =>
      p.repId === currentUser.id ||
      (!p.repId && (
        (p.areaId && repAreaIds.includes(p.areaId)) ||
        (p.area && repAreaNames.includes(p.area.toLowerCase().trim()))
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
      pharms = pharms.filter((p) => p.repId ? allowedTeamIds.includes(p.repId) : (role === "admin" || role === "hr"));
    }

    const repFilter = document.getElementById("pharmacyRepSelect");
    const repId = repFilter ? repFilter.value : "all";
    if (repId !== "all") {
      const isLM = allUsers.some((u) => u.id === repId && (u.role === "line_manager" || u.role === "lm"));
      const isDM = allUsers.some((u) => u.id === repId && (u.role === "district_manager" || u.role === "dm"));
      if (isLM) {
        const dmsUnderLM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
        const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
        pharms = pharms.filter((p) => p.repId && repsUnderLM.includes(p.repId) && (!allowedTeamIds || allowedTeamIds.includes(p.repId)));
      } else if (isDM) {
        const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
        pharms = pharms.filter((p) => p.repId && (repsUnderDM.includes(p.repId) || p.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(p.repId)));
      } else {
        pharms = pharms.filter((p) => p.repId === repId && (!allowedTeamIds || allowedTeamIds.includes(p.repId)));
      }
    }
  }

  if (!respectActiveFilters) {
    return pharms;
  }

  const searchInput = document.getElementById("pharmacySearchInput");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  return pharms.filter((p) => {
    return (
      !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(query)) ||
      (p.address && p.address.toLowerCase().includes(query)) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query))
    );
  });
}

function renderPharmaciesReport() {
  const prompt = document.getElementById("pharmaciesPromptContainer");
  const results = document.getElementById("pharmaciesResultsContainer");
  if (prompt) prompt.style.display = "none";
  if (results) results.style.display = "block";

  const grid = document.getElementById("pharmaciesDirectoryGrid");
  const emptyState = document.getElementById("pharmaciesEmptyState");
  const countBadge = document.getElementById("totalPharmaciesCountBadge");
  if (countBadge) countBadge.style.display = "inline-flex";
  if (!grid) return;

  const filtered = getScopedPharmacies(true);

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

  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
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
            <h4 class="directory-name">${window.escapeHtml(p.name)}</h4>
            <span class="directory-meta-tag pharmacy">Partner Pharmacy</span>
          </div>
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${window.escapeHtml(p.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👨‍🔬</span>
            <span class="info-text">Contact: <strong>${window.escapeHtml(p.contactPerson || "N/A")}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${window.escapeHtml(p.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">Rep: <strong>${window.escapeHtml(repName)}</strong></span>
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

  const currentUser = (window.checkAuth && window.checkAuth()) || { id: "rep1" };
  const existingRepId = pharmId ? (getPharmaciesData().find((p) => p.id === pharmId) || {}).repId : null;

  // Populates pharmacyModalLmSelect -> pharmacyModalDmSelect -> pharmacyRepInput
  // as a real cascading hierarchy (defined in shared-report.js), instead
  // of a flat list of every rep in the system.
  if (typeof populateModalHierarchy === "function") {
    populateModalHierarchy(
      "pharmacyModalLmSelect",
      "pharmacyModalDmSelect",
      "pharmacyRepInput",
      existingRepId || currentUser.id,
    );
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
    }
  } else {
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (addressInput) addressInput.value = "";
    if (contactInput) contactInput.value = "";
    if (phoneInput) phoneInput.value = "";
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

function initPharmaciesDirectory(user) {
  // Directories only render when user clicks Show
}

function exportPharmaciesDirectory() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const isAr = lang === "ar";

  const pharmsToExport = getScopedPharmacies(true);

  if (!pharmsToExport || pharmsToExport.length === 0) {
    const msg = isAr ? "لا توجد بيانات صيدليات لتصديرها." : "No pharmacy records found to export.";
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  const headers = isAr
    ? ["اسم الصيدلية", "المنطقة", "العنوان", "مسؤول التواصل / الصيدلي", "رقم الهاتف", "المندوب المسؤول"]
    : ["Pharmacy Name", "Area", "Address", "Contact Person", "Phone", "Representative"];

  const rows = pharmsToExport.map((p) => {
    const pharmName = isAr ? (p.nameAr || p.name || "") : (p.name || p.nameAr || "");

    let areaName = p.area || "";
    if (!areaName && p.areaId) {
      const a = allAreas.find((x) => x.id === p.areaId);
      if (a) areaName = a.name;
    }

    const addr = p.address || "";
    const contact = p.contactPerson || "";
    const phone = p.phone || "";

    let repName = "";
    if (p.repId) {
      const u = allUsers.find((x) => x.id === p.repId);
      if (u) repName = u.name;
    }

    return [pharmName, areaName, addr, contact, phone, repName];
  });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const fileName = isAr ? `دليل_الصيدليات_${dateStr}` : `pharmacies_directory_${dateStr}`;
  const sheetTitle = isAr ? "الصيدليات" : "Pharmacies";

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

window.getScopedPharmacies = getScopedPharmacies;
window.exportPharmaciesDirectory = exportPharmaciesDirectory;
window.renderPharmaciesReport = renderPharmaciesReport;
window.initPharmaciesDirectory = initPharmaciesDirectory;
window.openPharmacyModal = openPharmacyModal;
window.closePharmacyModal = closePharmacyModal;
window.savePharmacy = savePharmacy;
window.openDeletePharmacyModal = openDeletePharmacyModal;
window.closeDeletePharmacyModal = closeDeletePharmacyModal;
window.confirmDeletePharmacy = confirmDeletePharmacy;
window.onPharmacyFilterChange = onPharmacyFilterChange;

