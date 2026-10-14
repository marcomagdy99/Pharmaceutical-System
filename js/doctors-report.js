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
  
  const allSpecs =
    (window.store && window.store.specialties
      ? window.store.specialties.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];

  const allLabel = "All Specialties";

  let html = `<option value="all" data-i18n="allSpecialties">${allLabel}</option>`;
  allSpecs.forEach((s) => {
    const label = s.name;
    const isSelected = (currentVal === s.name || currentVal === s.id) ? " selected" : "";
    html += `<option value="${window.escapeHtml(s.name)}" data-id="${window.escapeHtml(s.id)}"${isSelected}>${window.escapeHtml(label)}</option>`;
  });

  selectEl.innerHTML = html;
  if (currentVal && currentVal !== "all") {
    selectEl.value = currentVal;
  }
}

function sortBilingualDoctors(a, b) {
  if (typeof window !== "undefined" && typeof window.sortBilingualByName === "function") {
    return window.sortBilingualByName(a, b);
  }
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const nameA = (lang === "ar" ? (a.nameAr || a.name || "") : (a.name || a.nameAr || "")).trim();
  const nameB = (lang === "ar" ? (b.nameAr || b.name || "") : (b.name || b.nameAr || "")).trim();
  const locales = lang === "ar" ? ["ar", "en"] : ["en", "ar"];
  return nameA.localeCompare(nameB, locales, { numeric: true, sensitivity: "base" });
}

function getScopedDoctors(respectActiveFilters = true) {
  const currentUser = (window.checkAuth && window.checkAuth()) || { role: "rep", id: "rep1" };
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase();
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : currentUser.role !== "medical_rep";

  let docs = getDoctorsData();

  // Role scoping: Reps get all doctors assigned to their id OR located in any of their assigned areas
  if (!isMgr) {
    const repAreas = (window.store && window.store.areas) ? window.store.areas.getByRep(currentUser.id) : [];
    const repAreaIds = repAreas.map((a) => a.id);
    const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
    docs = docs.filter((d) =>
      (d.areaId && repAreaIds.includes(d.areaId)) ||
      (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim())) ||
      (!d.areaId && d.repId === currentUser.id)
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

    const repFilter = document.getElementById("doctorRepSelect");
    const repId = repFilter ? repFilter.value : "all";

    if (allowedTeamIds) {
      docs = docs.filter((d) => {
        if (repId && repId.startsWith("vacant:")) {
          const vAreaId = repId.split(":")[1];
          if (d.areaId === vAreaId) return true;
        }
        if (d.repId) {
          return allowedTeamIds.includes(d.repId);
        }
        if (role === "admin" || role === "hr") {
          return true;
        }
        if (d.dmId && d.dmId === currentUser.id) {
          return true;
        }
        if (allowedAreaIds) {
          const docAreaName = (d.area || "").toLowerCase().trim();
          return (d.areaId && allowedAreaIds.includes(d.areaId)) || (docAreaName && allowedAreaNames.includes(docAreaName));
        }
        return false;
      });
    }

    if (repId !== "all") {
      if (repId.startsWith("vacant:")) {
        const vacantAreaId = repId.split(":")[1];
        const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
        const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
        docs = docs.filter((d) => {
          if (d.areaId) return d.areaId === vacantAreaId;
          if (areaNameLower && d.area && d.area.toLowerCase().trim() === areaNameLower) {
            if (vacantArea && vacantArea.lineId && d.lineId) return d.lineId === vacantArea.lineId;
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
          docs = docs.filter((d) => d.repId && repsUnderLM.includes(d.repId) && (!allowedTeamIds || allowedTeamIds.includes(d.repId)));
        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          docs = docs.filter((d) => d.repId && (repsUnderDM.includes(d.repId) || d.repId === repId) && (!allowedTeamIds || allowedTeamIds.includes(d.repId)));
        } else {
          const repAreaIds = allAreas.filter((a) => a.repId === repId).map((a) => a.id);
          const repAreaNames = allAreas.filter((a) => a.repId === repId).map((a) => (a.name || "").toLowerCase().trim());
          docs = docs.filter((d) =>
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim())) ||
            (!d.areaId && d.repId === repId)
          );
        }
      }
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (selectedLineId !== 'all') {
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    docs = docs.filter((d) => {
      if (d.areaId) {
        const a = allAreas.find((x) => x.id === d.areaId);
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (d.lineId) return d.lineId === selectedLineId;
      if (Array.isArray(d.lineIds) && d.lineIds.length > 0) return d.lineIds.includes(selectedLineId);
      if (d.areaId) {
        const a = allAreas.find((x) => x.id === d.areaId);
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (d.repId) {
        const repLines = window.getUserLines ? window.getUserLines(d.repId) : [];
        if (repLines.some((l) => l.id === selectedLineId)) return true;
      }
      return !d.repId && (role === 'admin' || role === 'hr');
    });
  }

  if (!respectActiveFilters) {
    return docs.slice().sort(sortBilingualDoctors);
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

  const filteredDocs = docs.filter((d) => {
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

  return filteredDocs.sort(sortBilingualDoctors);
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
        if (repVal.startsWith("vacant:")) {
          const vacantAreaId = repVal.split(":")[1];
          const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
          const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
          const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
          hospitalsCount = allHospitals.filter((h) => {
            if (h.areaId) return h.areaId === vacantAreaId;
            if (areaNameLower && h.area && h.area.toLowerCase().trim() === areaNameLower) {
              if (vacantArea && vacantArea.lineId && h.lineId) return h.lineId === vacantArea.lineId;
              return true;
            }
            return false;
          }).length;
        } else {
          hospitalsCount = allHospitals.filter((h) => !h.repId || h.repId === repVal).length;
        }
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
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines)) || [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  grid.innerHTML = filtered
    .map((d) => {
      const areaObj = allAreas.find((a) => a.id === d.areaId);
      const areaName = areaObj ? (areaObj.name || areaObj.id) : (d.area || (lang === "ar" ? "عام" : "General"));
      const lineObj = allLines.find((l) => l.id === (areaObj?.lineId || d.lineId));
      const lineName = lineObj ? (lang === "ar" && lineObj.nameAr ? lineObj.nameAr : lineObj.name) : "";
      const effectiveRepId = areaObj ? (areaObj.repId || null) : (d.repId || null);
      const repObj = effectiveRepId ? allUsers.find((u) => u.id === effectiveRepId) : null;
      const repName = repObj ? repObj.name : (lang === "ar" ? "غير مسند" : "Unassigned");
      const isClassA = d.class === "A";

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar doctor">🩺</div>
          <div class="directory-header-info">
            <h4 class="directory-name">${window.escapeHtml((lang === "ar" && d.nameAr) ? d.nameAr : (d.name || d.nameAr || ""))}</h4>
            <span class="directory-meta-tag specialty">${window.escapeHtml((lang === "ar" && d.specialtyAr) ? d.specialtyAr : (d.specialty || "General"))}</span>
          </div>
          <div class="d-flex flex-column align-items-end gap-1 ms-auto">
            <span class="badge ${isClassA ? "bg-warning text-dark" : "bg-secondary"}" style="font-size: 0.72rem;">
              Class ${d.class || "B"}
            </span>
            ${lineName ? `<span class="badge bg-secondary" style="font-size: 0.68rem;">${window.escapeHtml(lineName)}</span>` : ""}
          </div>
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">${window.escapeHtml(d.clinicAddress || d.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">🏢</span>
            <span class="info-text">${lang === 'ar' ? 'المنطقة:' : 'Area:'} <strong>${window.escapeHtml(areaName)}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">📞</span>
            <span class="info-text">${window.escapeHtml(d.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">${lang === 'ar' ? 'المندوب المسؤول:' : 'Rep:'} <strong>${window.escapeHtml(repName)}</strong></span>
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
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
  const areaInput = document.getElementById("doctorAreaInput");

  const existingDoc = docId ? (getDoctorsData().find((d) => d.id === docId) || {}) : {};
  const existingRepId = existingDoc.repId || null;
  const existingAreaId = existingDoc.areaId || null;

  // Populates doctorModalLmSelect -> doctorModalDmSelect -> doctorRepInput -> doctorAreaInput
  // as a real cascading hierarchy (defined in shared-report.js)
  if (typeof populateModalHierarchy === "function") {
    populateModalHierarchy(
      "doctorModalLmSelect",
      "doctorModalDmSelect",
      "doctorRepInput",
      existingRepId || currentUser.id,
      "doctorAreaInput",
      existingAreaId,
    );
  }

  if (specialtyInput) {
    const specs = (window.store && window.store.specialties ? window.store.specialties.getAll() : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];
    if (specs.length > 0) {
            specialtyInput.innerHTML = specs.map((s) => `<option value="${s.id}">${window.escapeHtml(s.name)}</option>`).join("");
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
      if (areaInput && doc.areaId) areaInput.value = doc.areaId;
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
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
  const areaSelect = document.getElementById("doctorAreaInput");

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

  // Doctor strictly belongs to Area; representative is whoever is assigned to that Area
  const assignedRepId = areaObj ? (areaObj.repId || null) : null;

  const existingDocRecord = id ? (getDoctorsData().find((d) => d.id === id) || {}) : {};

  const doctorObj = {
    ...(existingDocRecord || {}),
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
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
    visitsThisQuarter: existingDocRecord.visitsThisQuarter || 0
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
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
  // Only render on Show button click
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
  
  const docsToExport = getScopedDoctors(true);

  if (!docsToExport || docsToExport.length === 0) {
    const msg = "No doctor records found to export.";
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

  const headers = [
      "Doctor Name",
      "Specialty",
      "Class",
      "Territory / Area",
      "Product Line",
      "Assigned Rep",
      "Workplace",
      "Phone",
      "Address",
      "Target Visits/Mo",
      "Status",
    ];

  const rows = docsToExport.map((d) => {
    const docName = d.name || d.nameAr || "";
    const spec = d.specialty || d.specialtyAr || "";
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
  const fileName = `doctors_directory_${dateStr}`;
  const sheetTitle = "Doctors";

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

