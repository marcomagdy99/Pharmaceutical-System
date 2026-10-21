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
  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "u1790626000001" };
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

    const lmFilter = document.getElementById("hospitalLmSelect");
    const dmFilter = document.getElementById("hospitalDmSelect");
    const repFilter = document.getElementById("hospitalRepSelect");
    const repId = (repFilter && repFilter.value !== "all") ? repFilter.value : ((dmFilter && dmFilter.value !== "all") ? dmFilter.value : ((lmFilter && lmFilter.value !== "all") ? lmFilter.value : "all"));

    if (allowedTeamIds) {
      hosps = hosps.filter((h) => {
        if (repId && repId.startsWith("vacant:")) {
          const vAreaId = repId.split(":")[1];
          if (h.areaId === vAreaId) return true;
        }
        if (h.repId) {
          return allowedTeamIds.includes(h.repId);
        }
        if (role === "admin" || role === "hr") {
          return true;
        }
        if (h.dmId && h.dmId === currentUser.id) {
          return true;
        }
        if (allowedAreaIds) {
          const hospAreaName = (h.area || "").toLowerCase().trim();
          return (h.areaId && allowedAreaIds.includes(h.areaId)) || (hospAreaName && allowedAreaNames.includes(hospAreaName));
        }
        return false;
      });
    }

    if (repId !== "all") {
      if (repId.startsWith("vacant:")) {
        const vacantAreaId = repId.split(":")[1];
        const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
        const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
        hosps = hosps.filter((h) => {
          if (h.areaId) return h.areaId === vacantAreaId;
          if (areaNameLower && h.area && h.area.toLowerCase().trim() === areaNameLower) {
            if (vacantArea && vacantArea.lineId && h.lineId) return h.lineId === vacantArea.lineId;
            return true;
          }
          return false;
        });
      } else if (repId === "all_reps") {
        const repIds = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === "medical_rep" || u.role === "rep"))).map((u) => u.id);
        hosps = hosps.filter((h) => h.repId && repIds.includes(h.repId));
      } else if (repId === "all_dms") {
        const dmIds = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === "district_manager" : (u.role === "district_manager" || u.role === "dm"))).map((u) => u.id);
        const dmTeamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
        hosps = hosps.filter((h) => (h.repId && (dmIds.includes(h.repId) || dmTeamRepIds.includes(h.repId))) || (h.dmId && dmIds.includes(h.dmId)));
      } else {
        const isLM = allUsers.some((u) => u.id === repId && (u.role === "line_manager" || u.role === "lm"));
        const isDM = allUsers.some((u) => u.id === repId && (u.role === "district_manager" || u.role === "dm"));
        if (isLM) {
          const dmsUnderLM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId)).map((u) => u.id);
          const lmTeamIds = [repId, ...dmsUnderLM, ...repsUnderLM];
          const lmUser = allUsers.find((u) => u.id === repId);
          const lmUserLineIds = lmUser ? (lmUser.lineIds || (lmUser.lineId ? [lmUser.lineId] : [])) : [];
          const lmAreaIds = allAreas.filter((a) => (a.repId && lmTeamIds.includes(a.repId)) || (a.lineId && lmUserLineIds.includes(a.lineId))).map((a) => a.id);
          hosps = hosps.filter((h) => (h.repId && lmTeamIds.includes(h.repId)) || (h.areaId && lmAreaIds.includes(h.areaId)));
        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const dmTeamIds = [repId, ...repsUnderDM];
          const dmUser = allUsers.find((u) => u.id === repId);
          const dmUserAreaIds = dmUser ? (dmUser.areaIds || (dmUser.areaId ? [dmUser.areaId] : [])) : [];
          const dmAreaIds = allAreas.filter((a) => (a.repId && dmTeamIds.includes(a.repId)) || dmUserAreaIds.includes(a.id) || a.dmId === repId).map((a) => a.id);
          hosps = hosps.filter((h) =>
            (h.repId && dmTeamIds.includes(h.repId)) ||
            (h.areaId && dmAreaIds.includes(h.areaId))
          );
        } else {
          const repUser = allUsers.find((u) => u.id === repId);
          const repUserAreaIds = repUser ? (repUser.areaIds || (repUser.areaId ? [repUser.areaId] : [])) : [];
          const repAreaIds = allAreas.filter((a) => a.repId === repId || repUserAreaIds.includes(a.id)).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId || repUserAreaIds.includes(a.id)).map((a) => (a.name || "").toLowerCase().trim());
          if (repUser && repUser.area) {
            repUser.area.split(',').forEach((s) => {
              const t = s.trim().toLowerCase();
              if (t) repAreaNames.push(t);
            });
          }
          hosps = hosps.filter((h) =>
            h.repId === repId ||
            (h.areaId && repAreaIds.includes(h.areaId)) ||
            (h.area && repAreaNames.includes(h.area.toLowerCase().trim()))
          );
        }
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    hosps = hosps.filter((h) => {
      if (h.areaId) {
        const a = allAreas.find((x) => x.id === h.areaId);
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (h.area) {
        const aName = (h.area || '').toLowerCase().trim();
        const a = allAreas.find((x) => (x.nameEn || '').toLowerCase().trim() === aName || (x.nameAr || '').toLowerCase().trim() === aName);
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (h.lineId) return h.lineId === selectedLineId;
      if (Array.isArray(h.lineIds) && h.lineIds.length > 0) return h.lineIds.includes(selectedLineId);
      if (h.repId) {
        const repLines = window.getUserLines ? window.getUserLines(h.repId) : [];
        if (repLines.some((l) => l.id === selectedLineId)) return true;
      }
      return false;
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
  
  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? "Hospital" : "Hospitals"}`;
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
      const areaObj = allAreas.find((a) => a.id === h.areaId);
      const areaName = areaObj ? (areaObj.name || areaObj.id) : (h.area || "General");
      const effectiveRepId = h.repId || (areaObj ? (areaObj.repId || null) : null);
      const repObj = effectiveRepId ? allUsers.find((u) => u.id === effectiveRepId) : null;
      const repName = repObj ? repObj.name : "Unassigned";
      const lineObj = allLines.find((l) => l.id === h.lineId);
      const lineName = lineObj ? lineObj.name : "";
      const displayName = h.name || h.nameAr;

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar hospital">🏥</div>
          <div class="directory-header-info">
            <h4 class="directory-name">${window.escapeHtml(displayName)}</h4>
            <span class="directory-meta-tag hospital">Hospital / Medical Center</span>
          </div>
          ${lineName ? `<span class="badge bg-secondary ms-auto" style="font-size: 0.72rem;">${window.escapeHtml(lineName)}</span>` : ""}
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${window.escapeHtml(h.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">🏢</span>
            <span class="info-text">Area: <strong>${window.escapeHtml(areaName)}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${window.escapeHtml(h.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">Rep: <strong>${window.escapeHtml(repName)}</strong></span>
          </div>
        </div>
        ${isAdmin ? `
        <div class="directory-card-footer">
          <button class="btn btn-sm btn-outline-primary" onclick="openHospitalModal('${h.id}')">
            ✏️ Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteHospitalModal('${h.id}')">
            🗑️ Delete
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
      showToast("Permission Denied: Only Admin can manage hospitals.", "error");
    }
    return;
  }

  const modal = document.getElementById("hospitalModal");
  if (!modal) return;

  const idInput = document.getElementById("hospitalId");
  const nameInput = document.getElementById("hospitalNameInput");
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
  
  if (hospId) {
    const hosps = getHospitalsData();
    const hosp = hosps.find((h) => h.id === hospId);
    if (hosp) {
      if (idInput) idInput.value = hosp.id;
      if (nameInput) nameInput.value = hosp.name || hosp.nameAr || "";
      if (addressInput) addressInput.value = hosp.address || "";
      if (phoneInput) phoneInput.value = hosp.phone || "";
      if (areaInput && hosp.areaId) areaInput.value = hosp.areaId;
    }
    if (modalTitle) modalTitle.textContent = "Edit Hospital";
  } else {
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (addressInput) addressInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (modalTitle) modalTitle.textContent = "Add Hospital";
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
      showToast("Permission Denied: Only Admin can add/edit hospitals.", "error");
    }
    return;
  }

  const idInput = document.getElementById("hospitalId");
  const nameInput = document.getElementById("hospitalNameInput");
  const addressInput = document.getElementById("hospitalAddressInput");
  const phoneInput = document.getElementById("hospitalPhoneInput");
  const areaSelect = document.getElementById("hospitalAreaInput");

  if (!nameInput || !addressInput) return;

  const id = idInput ? idInput.value : "";
  const name = nameInput.value.trim();
  const address = addressInput.value.trim();
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

  const repSelectEl = document.getElementById("hospitalRepInput");
  const modalRepId = (repSelectEl && repSelectEl.value && repSelectEl.value !== "all") ? repSelectEl.value : null;
  const assignedRepId = modalRepId || (areaObj ? (areaObj.repId || null) : null);

  const allUsersList = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  let assignedDmId = null;
  let assignedLmId = null;
  if (assignedRepId) {
    const repUserObj = allUsersList.find(u => u.id === assignedRepId);
    if (repUserObj && repUserObj.managerId) {
      assignedDmId = repUserObj.managerId;
      const dmUserObj = allUsersList.find(u => u.id === repUserObj.managerId);
      if (dmUserObj && dmUserObj.managerId) assignedLmId = dmUserObj.managerId;
    }
  }

  const existingHosp = id ? ((window.store && window.store.hospitals ? window.store.hospitals.getById(id) : null) || (window.DEMO_DATA?.hospitals?.find((h) => h.id === id))) : null;

  const hospitalObj = {
    ...(existingHosp || {}),
    id: id || "hosp_" + Date.now(),
    name,
    nameAr: nameAr || name,
    type: "hospital",
    address,
    phone,
    repId: assignedRepId,
    dmId: assignedDmId,
    lmId: assignedLmId,
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
  if (typeof showToast === "function") showToast("Hospital saved successfully.", "success");
}

let hospitalToDeleteId = null;

function openDeleteHospitalModal(hospId) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  const isAdmin = window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin');
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast("Permission Denied: Only Admin can delete hospitals.", "error");
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
      showToast("Permission Denied: Only Admin can delete hospitals.", "error");
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
  if (typeof showToast === "function") showToast("Hospital deleted successfully.", "success");
}

function onHospitalFilterChange() {
  const results = document.getElementById("hospitalsResultsContainer");
  if (results && results.style.display !== "none" && typeof renderHospitalsReport === "function") {
    renderHospitalsReport();
  }
}

function exportHospitalsDirectory() {
  const hosps = getScopedHospitals(true);
  if (!hosps || hosps.length === 0) {
    if (typeof showToast === "function") showToast("No hospitals to export.", "info");
    return;
  }

  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

  const headers = ["ID", "Hospital Name", "Address", "Phone", "Rep", "Area", "Line"];
  const rows = hosps.map((h) => {
    const rep = allUsers.find((u) => u.id === h.repId)?.name || "Unassigned";
    const area = allAreas.find((a) => a.id === h.areaId)?.name || h.area || "";
    return [
      `"${h.id}"`,
      `"${(h.name || h.nameAr || '').replace(/"/g, '""')}"`,
      `"${(h.address || '').replace(/"/g, '""')}"`,
      `"${(h.phone || '').replace(/"/g, '""')}"`,
      `"${rep.replace(/"/g, '""')}"`,
      `"${area.replace(/"/g, '""')}"`,
      `"${h.lineId || ''}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Hospitals_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
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
