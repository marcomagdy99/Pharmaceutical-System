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

function sortBilingualPharmacies(a, b) {
  if (typeof window !== "undefined" && typeof window.sortBilingualByName === "function") {
    return window.sortBilingualByName(a, b);
  }
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const nameA = (lang === "ar" ? (a.nameAr || a.name || "") : (a.name || a.nameAr || "")).trim();
  const nameB = (lang === "ar" ? (b.nameAr || b.name || "") : (b.name || b.nameAr || "")).trim();
  const locales = lang === "ar" ? ["ar", "en"] : ["en", "ar"];
  return nameA.localeCompare(nameB, locales, { numeric: true, sensitivity: "base" });
}

function getScopedPharmacies(respectActiveFilters = true) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase();
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let pharms = getPharmaciesData();

  // Role scoping: Reps get all pharmacies assigned to their id OR located in any of their assigned areas
  if (!isMgr) {
    const repAreas = (window.store && window.store.areas) ? window.store.areas.getByRep(currentUser.id) : [];
    const repAreaIds = repAreas.map((a) => a.id);
    const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
    pharms = pharms.filter((p) =>
      (p.areaId && repAreaIds.includes(p.areaId)) ||
      (!p.areaId && p.area && repAreaNames.includes(p.area.toLowerCase().trim())) ||
      (!p.areaId && p.repId === currentUser.id)
    );
  } else {
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    let allowedTeamIds = null;
    let allowedAreaIds = null;
    let allowedAreaNames = null;

    if (role === "district_manager") {
      const teamRepIds = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...teamRepIds];

      const myVacantAreas = allAreas.filter((a) => {
        if (a.repId) return false;
        const mgrId = typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(a, allUsers) : null;
        return mgrId === currentUser.id || (!mgrId && (!a.lineId || (currentUser.lineIds && currentUser.lineIds.includes(a.lineId)) || currentUser.lineId === a.lineId));
      });

      const dmAreas = allAreas.filter((a) =>
        (a.repId && teamRepIds.includes(a.repId)) ||
        a.dmId === currentUser.id ||
        a.districtManagerId === currentUser.id ||
        (currentUser.areaIds && currentUser.areaIds.includes(a.id)) ||
        (currentUser.areaId && currentUser.areaId === a.id) ||
        myVacantAreas.some((va) => va.id === a.id)
      );
      allowedAreaIds = dmAreas.map((a) => a.id);
      allowedAreaNames = dmAreas.map((a) => (a.name || "").toLowerCase().trim()).filter(Boolean);
    } else if (role === "line_manager") {
      const dms = allUsers.filter((u) => u.managerId === currentUser.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
      const dmIds = dms.map((d) => d.id);
      const repIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...dmIds, ...repIds];

      const myLineIds = currentUser.lineIds || (currentUser.lineId ? [currentUser.lineId] : []);
      const lmAreas = allAreas.filter((a) =>
        (a.repId && (repIds.includes(a.repId) || dmIds.includes(a.repId))) ||
        (a.lineId && myLineIds.includes(a.lineId))
      );
      allowedAreaIds = lmAreas.map((a) => a.id);
      allowedAreaNames = lmAreas.map((a) => (a.name || "").toLowerCase().trim()).filter(Boolean);
    } else if (role === "business_unit") {
      const myLMs = allUsers.filter((u) => u.managerId === currentUser.id);
      const myLmIds = myLMs.map((u) => u.id);
      const myDownstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
      const myDownstreamIds = myDownstream.map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...myLmIds, ...myDownstreamIds];
      const buLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id).map(l => l.id) : [];
      const buAreas = allAreas.filter((a) => (a.lineId && buLines.includes(a.lineId)) || (a.repId && allowedTeamIds.includes(a.repId)));
      allowedAreaIds = buAreas.map((a) => a.id);
      allowedAreaNames = buAreas.map((a) => (a.name || "").toLowerCase().trim()).filter(Boolean);
    }

    const repFilter = document.getElementById("pharmacyRepSelect");
    const repId = (repFilter && repFilter.value) ? repFilter.value : "all";

    if (allowedTeamIds) {
      pharms = pharms.filter((p) => {
        if (repId && repId.startsWith("vacant:")) {
          const vAreaId = repId.split(":")[1];
          if (p.areaId === vAreaId) return true;
        }
        if (p.repId) {
          return allowedTeamIds.includes(p.repId);
        }
        if (role === "admin" || role === "hr") {
          return true;
        }
        if (p.dmId && p.dmId === currentUser.id) {
          return true;
        }
        if (allowedAreaIds) {
          const pharmAreaName = (p.area || "").toLowerCase().trim();
          return (p.areaId && allowedAreaIds.includes(p.areaId)) || (pharmAreaName && allowedAreaNames.includes(pharmAreaName));
        }
        return false;
      });
    }

    if (repId !== "all") {
      if (repId.startsWith("vacant:")) {
        const vacantAreaId = repId.split(":")[1];
        const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
        const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
        pharms = pharms.filter((p) => {
          if (p.areaId) return p.areaId === vacantAreaId;
          if (areaNameLower && p.area && p.area.toLowerCase().trim() === areaNameLower) {
            if (vacantArea && vacantArea.lineId && p.lineId) return p.lineId === vacantArea.lineId;
            return true;
          }
          return false;
        });
      } else {
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
          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          pharms = pharms.filter((p) =>
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (!p.areaId && p.area && repAreaNames.includes(p.area.toLowerCase().trim())) ||
            (!p.areaId && p.repId === repId)
          );
        }
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    pharms = pharms.filter((p) => {
      if (p.areaId) {
        const a = allAreas.find((x) => x.id === p.areaId);
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (p.lineId) return p.lineId === selectedLineId;
      if (Array.isArray(p.lineIds) && p.lineIds.length > 0) return p.lineIds.includes(selectedLineId);
      if (p.repId) {
        const repLines = window.getUserLines ? window.getUserLines(p.repId) : [];
        if (repLines.some((l) => l.id === selectedLineId)) return true;
      }
      return !p.repId && (role === 'admin' || role === 'hr');
    });
  }

  if (!respectActiveFilters) {
    return pharms.slice().sort(sortBilingualPharmacies);
  }

  const searchInput = document.getElementById("pharmacySearchInput");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const filteredPharms = pharms.filter((p) => {
    return (
      !query ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(query)) ||
      (p.address && p.address.toLowerCase().includes(query)) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query))
    );
  });

  return filteredPharms.sort(sortBilingualPharmacies);
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

  const currentUser = (typeof checkAuth === 'function' ? checkAuth() : null) || (window.DEMO_DATA && window.DEMO_DATA.currentUser);
  const normalizedRole = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase()) : '';
  const isAdmin = normalizedRole === 'admin';
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines)) || [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  grid.innerHTML = filtered
    .map((p) => {
      const areaObj = allAreas.find((a) => a.id === p.areaId);
      const areaName = areaObj ? (areaObj.name || areaObj.id) : (p.area || (lang === "ar" ? "عام" : "General"));
      const lineObj = allLines.find((l) => l.id === (areaObj?.lineId || p.lineId));
      const lineName = lineObj ? (lang === "ar" && lineObj.nameAr ? lineObj.nameAr : lineObj.name) : "";
      const effectiveRepId = areaObj ? (areaObj.repId || null) : (p.repId || null);
      const repObj = effectiveRepId ? allUsers.find((u) => u.id === effectiveRepId) : null;
      const repName = repObj ? repObj.name : (lang === "ar" ? "غير مسند" : "Unassigned");

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar pharmacy">💊</div>
          <div class="directory-header-info">
            <h4 class="directory-name">${window.escapeHtml((lang === "ar" && p.nameAr) ? p.nameAr : (p.name || p.nameAr || ""))}</h4>
            <span class="directory-meta-tag pharmacy">Partner Pharmacy</span>
          </div>
          ${lineName ? `<span class="badge bg-secondary ms-auto" style="font-size: 0.68rem;">${window.escapeHtml(lineName)}</span>` : ""}
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${window.escapeHtml(p.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">🏢</span>
            <span class="info-text">${lang === 'ar' ? 'المنطقة:' : 'Area:'} <strong>${window.escapeHtml(areaName)}</strong></span>
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
            <span class="info-text">${lang === 'ar' ? 'المندوب المسؤول:' : 'Rep:'} <strong>${window.escapeHtml(repName)}</strong></span>
          </div>
        </div>
        ${isAdmin ? `
        <div class="directory-card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="openPharmacyModal('${p.id}')">
            ✏️ ${lang === 'ar' ? 'تعديل' : 'Edit'}
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeletePharmacyModal('${p.id}')">
            🗑️ ${lang === 'ar' ? 'حذف' : 'Delete'}
          </button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");
}

function openPharmacyModal(pharmId = null) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: إدارة وتعديل الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can manage pharmacies.", "error");
    }
    return;
  }

  const modal = document.getElementById("pharmacyModal");
  if (!modal) return;

  const idInput = document.getElementById("pharmacyId");
  const nameInput = document.getElementById("pharmacyNameInput");
  const addressInput = document.getElementById("pharmacyAddressInput");
  const contactInput = document.getElementById("pharmacyContactInput");
  const phoneInput = document.getElementById("pharmacyPhoneInput");
  const areaInput = document.getElementById("pharmacyAreaInput");

  const existingPharm = pharmId ? (getPharmaciesData().find((p) => p.id === pharmId) || {}) : {};
  const existingRepId = existingPharm.repId || null;
  const existingAreaId = existingPharm.areaId || null;

  // Populates pharmacyModalLmSelect -> pharmacyModalDmSelect -> pharmacyRepInput -> pharmacyAreaInput
  // as a real cascading hierarchy (defined in shared-report.js)
  if (typeof populateModalHierarchy === "function") {
    populateModalHierarchy(
      "pharmacyModalLmSelect",
      "pharmacyModalDmSelect",
      "pharmacyRepInput",
      existingRepId || currentUser.id,
      "pharmacyAreaInput",
      existingAreaId,
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
      if (areaInput && pharm.areaId) areaInput.value = pharm.areaId;
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: إضافة وتعديل الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can add/edit pharmacies.", "error");
    }
    return;
  }

  const idInput = document.getElementById("pharmacyId");
  const nameInput = document.getElementById("pharmacyNameInput");
  const addressInput = document.getElementById("pharmacyAddressInput");
  const contactInput = document.getElementById("pharmacyContactInput");
  const phoneInput = document.getElementById("pharmacyPhoneInput");
  const areaSelect = document.getElementById("pharmacyAreaInput");

  if (!nameInput || !addressInput) return;

  const id = idInput ? idInput.value : "";
  const name = nameInput.value.trim();
  const address = addressInput.value.trim();
  const contactPerson = contactInput ? contactInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const assignedAreaId = areaSelect ? areaSelect.value.trim() : "";

  if (!name || !address) {
    if (typeof showToast === "function") showToast("Please fill in required fields.", "warning");
    return;
  }

  if (!assignedAreaId) {
        if (typeof showToast === "function") {
      showToast("Please select a territory / area.", "warning");
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

  // Pharmacy strictly belongs to Area; representative is whoever is assigned to that Area
  const assignedRepId = areaObj ? (areaObj.repId || null) : null;

  const pharmacyObj = {
    id: id || "pharm_" + Date.now(),
    name,
    address,
    contactPerson,
    phone,
    repId: assignedRepId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
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
  if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حفظ الصيدلية بنجاح." : "Pharmacy saved successfully.", "success");
}

let pharmacyToDeleteId = null;

function openDeletePharmacyModal(pharmId) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can delete pharmacies.", "error");
    }
    return;
  }

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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(getCurrentLang() === "ar" ? "غير مصرح: حذف الصيدليات للأدمن فقط." : "Permission Denied: Only Admin can delete pharmacies.", "error");
    }
    return;
  }

  if (!pharmacyToDeleteId) return;

  if (window.store && window.store.pharmacies) {
    window.store.pharmacies.delete(pharmacyToDeleteId);
  } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.pharmacies)) {
    window.DEMO_DATA.pharmacies = window.DEMO_DATA.pharmacies.filter((p) => p.id !== pharmacyToDeleteId);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  closeDeletePharmacyModal();
  renderPharmaciesReport();
  if (typeof showToast === "function") showToast(getCurrentLang() === "ar" ? "تم حذف الصيدلية بنجاح." : "Pharmacy deleted successfully.", "info");
}

function onPharmacyFilterChange() {
  // Only render on Show button click
}

function onPharmacyLmChange() {}
function onPharmacyDmChange() {}

function initPharmaciesDirectory(user) {
  // Directories only render when user clicks Show
}

function exportPharmaciesDirectory() {
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  
  const pharmsToExport = getScopedPharmacies(true);

  if (!pharmsToExport || pharmsToExport.length === 0) {
    const msg = "No pharmacy records found to export.";
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  const headers = [
      "Pharmacy Name",
      "Territory / Area",
      "Product Line",
      "Assigned Rep",
      "Phone",
      "Address",
      "Target Visits/Mo",
      "Status",
    ];

  const rows = pharmsToExport.map((p) => {
    const pharmName = p.name || p.nameAr || "";

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
  const fileName = `pharmacies_directory_${dateStr}`;
  const sheetTitle = "Pharmacies";

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
    const successMsg = "Directory exported successfully (.csv)";
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

