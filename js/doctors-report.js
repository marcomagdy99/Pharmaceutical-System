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
  const nameA = (a.name || a.nameAr || "").trim();
  const nameB = (b.name || b.nameAr || "").trim();
  return nameA.localeCompare(nameB, ["en", "ar"], { numeric: true, sensitivity: "base" });
}

function getScopedDoctors(respectActiveFilters = true) {
  const currentUser = (typeof window.checkAuth === "function") ? window.checkAuth() : null;
  if (!currentUser || !currentUser.id) {
    return [];
  }
  const role = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || "").toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(currentUser) : (role === "rep" || role === "medical_rep");
  const isMgr = window.isManagerRole ? window.isManagerRole(currentUser) : ["admin", "hr", "general_manager", "gm", "district_manager", "dm", "line_manager", "lm", "business_unit", "bu", "product_manager", "pm"].includes(role);

  if (!isRep && !isMgr) {
    return []; // Fail-closed: unknown or unauthorized role
  }

  let docs = getDoctorsData();

  // Role scoping: Reps get all doctors assigned to their id OR located in any of their assigned areas
  if (isRep) {
    const repAreas = (window.store && window.store.areas) ? window.store.areas.getByRep(currentUser.id) : [];
    const repAreaIds = repAreas.map((a) => a.id);
    const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
    docs = docs.filter((d) =>
      d.repId === currentUser.id ||
      (d.areaId && repAreaIds.includes(d.areaId)) ||
      (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
    );
  } else {
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    let allowedTeamIds = null;
    let allowedAreaIds = null;
    let allowedAreaNames = null;

    if (role === "admin" || role === "hr") {
      allowedTeamIds = null;
      allowedAreaIds = null;
      allowedAreaNames = null;
    } else if (role === "district_manager") {
      const teamRepIds = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...teamRepIds];

      const myVacantAreas = allAreas.filter((a) => {
        if (a.repId) return false;
        if (typeof window.isAreaManagedByDm === "function") {
          return window.isAreaManagedByDm(a, currentUser.id, allUsers);
        }
        if (a.dmId === currentUser.id || a.districtManagerId === currentUser.id) return true;
        if (currentUser.areaIds && currentUser.areaIds.includes(a.id)) return true;
        if (currentUser.areaId && currentUser.areaId === a.id) return true;
        const mgrId = typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(a, allUsers) : null;
        return mgrId === currentUser.id;
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
      const repIds = allUsers.filter((u) => dmIds.includes(u.managerId) || u.managerId === currentUser.id).map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...dmIds, ...repIds];

      const lmUserLineIds = currentUser.lineIds || (currentUser.lineId ? [currentUser.lineId] : []);
      const lineLmsCount = (lineId) => allUsers.filter((u) => {
        const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase();
        return (r === 'line_manager' || r === 'lm') && ((u.lineIds && u.lineIds.includes(lineId)) || u.lineId === lineId);
      }).length;

      const isAreaOwnedByDm = (area, dmId) => {
        if (typeof window.isAreaManagedByDm === "function") return window.isAreaManagedByDm(area, dmId, allUsers);
        if (area.dmId === dmId || area.districtManagerId === dmId) return true;
        const dm = allUsers.find((u) => u.id === dmId);
        if (dm) {
          if (dm.areaIds && dm.areaIds.includes(area.id)) return true;
          if (dm.areaId && dm.areaId === area.id) return true;
        }
        const mgrId = typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(area, allUsers) : null;
        return mgrId === dmId;
      };

      const lmVacantAreas = allAreas.filter((a) => {
        if (a.repId) return false;
        if (a.managerId === currentUser.id || a.lmId === currentUser.id) return true;
        if (dmIds.some((dmId) => isAreaOwnedByDm(a, dmId))) return true;
        if (a.lineId && lmUserLineIds.includes(a.lineId) && lineLmsCount(a.lineId) <= 1) return true;
        return false;
      });

      const lmAreas = allAreas.filter((a) =>
        (a.repId && (repIds.includes(a.repId) || dmIds.includes(a.repId))) ||
        a.managerId === currentUser.id ||
        a.lmId === currentUser.id ||
        lmVacantAreas.some((va) => va.id === a.id)
      );
      allowedAreaIds = lmAreas.map((a) => a.id);
      allowedAreaNames = lmAreas.map((a) => (a.name || "").toLowerCase().trim()).filter(Boolean);
    } else if (role === "business_unit" || role === "general_manager") {
      const myDownstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
      const myDownstreamIds = myDownstream.map((u) => u.id);
      allowedTeamIds = [currentUser.id, ...myDownstreamIds];

      const buDmIds = myDownstream.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm'))).map((u) => u.id);

      const isAreaOwnedByDm = (area, dmId) => {
        if (typeof window.isAreaManagedByDm === "function") return window.isAreaManagedByDm(area, dmId, allUsers);
        if (area.dmId === dmId || area.districtManagerId === dmId) return true;
        const dm = allUsers.find((u) => u.id === dmId);
        if (dm) {
          if (dm.areaIds && dm.areaIds.includes(area.id)) return true;
          if (dm.areaId && dm.areaId === area.id) return true;
        }
        const mgrId = typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(area, allUsers) : null;
        return mgrId === dmId;
      };

      const buVacantAreas = allAreas.filter((a) => {
        if (a.repId) return false;
        if (a.buId === currentUser.id) return true;
        return buDmIds.some((dmId) => isAreaOwnedByDm(a, dmId));
      });

      const buAreas = allAreas.filter((a) =>
        (a.repId && allowedTeamIds.includes(a.repId)) ||
        a.buId === currentUser.id ||
        buVacantAreas.some((va) => va.id === a.id)
      );
      allowedAreaIds = buAreas.map((a) => a.id);
      allowedAreaNames = buAreas.map((a) => (a.name || "").toLowerCase().trim()).filter(Boolean);
    } else if (role === "product_manager" || role === "pm") {
      const pmLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
      const pmLineIds = pmLines.map((l) => l.id);
      if (pmLineIds.length === 0) {
        return []; // Fail-closed: PM without assigned lines sees no doctors
      }
      const pmAreas = allAreas.filter((a) => a.lineId && pmLineIds.includes(a.lineId));
      allowedAreaIds = pmAreas.map((a) => a.id);
      allowedAreaNames = pmAreas.map((a) => (a.name || "").toLowerCase().trim()).filter(Boolean);
      const pmReps = allUsers.filter((u) => {
        const uLines = typeof window.getUserLines === "function" ? window.getUserLines(u.id) : [];
        return uLines.some((l) => pmLineIds.includes(l.id)) || (u.lineId && pmLineIds.includes(u.lineId)) || (u.lineIds && u.lineIds.some(lid => pmLineIds.includes(lid)));
      });
      allowedTeamIds = [currentUser.id, ...pmReps.map((u) => u.id)];
    } else {
      // Unknown or unauthenticated role: fail closed
      return [];
    }

    const lmFilter = document.getElementById("doctorLmSelect");
    const dmFilter = document.getElementById("doctorDmSelect");
    const repFilter = document.getElementById("doctorRepSelect");
    const repId = (repFilter && repFilter.value !== "all") ? repFilter.value : ((dmFilter && dmFilter.value !== "all") ? dmFilter.value : ((lmFilter && lmFilter.value !== "all") ? lmFilter.value : "all"));

    if (allowedTeamIds || allowedAreaIds) {
      docs = docs.filter((d) => {
        if (repId && repId.startsWith("vacant:")) {
          const vAreaId = repId.split(":")[1];
          // Critical security fix: must verify that the vacant area is within allowedAreaIds for this manager
          if (role === "admin" || role === "hr" || (allowedAreaIds && allowedAreaIds.includes(vAreaId))) {
            if (d.areaId === vAreaId) return true;
          }
        }
        if (d.repId && allowedTeamIds && allowedTeamIds.includes(d.repId)) {
          return true;
        }
        if (role === "admin" || role === "hr") {
          return true;
        }
        if (d.dmId && d.dmId === currentUser.id) {
          return true;
        }
        if (allowedAreaIds) {
          const docAreaName = (d.area || "").toLowerCase().trim();
          if (d.areaId && allowedAreaIds.includes(d.areaId)) return true;
          if (docAreaName && allowedAreaNames && allowedAreaNames.includes(docAreaName)) return true;
        }
        if (role === "product_manager" || role === "pm") {
          const pmLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
          const pmLineIds = pmLines.map((l) => l.id);
          if (d.lineId && pmLineIds.includes(d.lineId)) return true;
          if (Array.isArray(d.lineIds) && d.lineIds.some((lid) => pmLineIds.includes(lid))) return true;
        }
        return false;
      });
    }

    if (repId !== "all") {
      if (repId.startsWith("vacant:")) {
        const vacantAreaId = repId.split(":")[1];
        // Critical: Non-admin users cannot access vacant areas outside their allowed scope
        if (role !== "admin" && role !== "hr" && allowedAreaIds && !allowedAreaIds.includes(vacantAreaId)) {
          return [];
        }
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
      } else if (repId === "all_reps") {
        const repIds = allUsers.filter((u) => (window.isRepRole ? window.isRepRole(u) : (u.role === "medical_rep" || u.role === "rep"))).map((u) => u.id);
        docs = docs.filter((d) => d.repId && repIds.includes(d.repId));
      } else if (repId === "all_dms") {
        const dmIds = allUsers.filter((u) => (window.normalizeRole ? window.normalizeRole(u.role) === "district_manager" : (u.role === "district_manager" || u.role === "dm"))).map((u) => u.id);
        const dmTeamRepIds = allUsers.filter((u) => dmIds.includes(u.managerId)).map((u) => u.id);
        docs = docs.filter((d) => (d.repId && (dmIds.includes(d.repId) || dmTeamRepIds.includes(d.repId))) || (d.dmId && dmIds.includes(d.dmId)));
      } else {
        const isLM = allUsers.some((u) => u.id === repId && (u.role === "line_manager" || u.role === "lm"));
        const isDM = allUsers.some((u) => u.id === repId && (u.role === "district_manager" || u.role === "dm"));
        if (isLM) {
          const selLmUser = allUsers.find((u) => u.id === repId);
          const dmsUnderLM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const repsUnderLM = allUsers.filter((u) => dmsUnderLM.includes(u.managerId) || u.managerId === repId).map((u) => u.id);
          const lmTeamIds = [repId, ...dmsUnderLM, ...repsUnderLM];
          const lmUserLineIds = selLmUser ? (selLmUser.lineIds || (selLmUser.lineId ? [selLmUser.lineId] : [])) : [];
          const lineLmsCount = (lineId) => allUsers.filter((u) => {
            const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase();
            return (r === 'line_manager' || r === 'lm') && ((u.lineIds && u.lineIds.includes(lineId)) || u.lineId === lineId);
          }).length;
          const lmAreaIds = allAreas.filter((a) => {
            if (a.repId && lmTeamIds.includes(a.repId)) return true;
            if (a.managerId === repId || a.lmId === repId) return true;
            if (!a.repId && dmsUnderLM.some((dmId) => typeof window.isAreaManagedByDm === "function" ? window.isAreaManagedByDm(a, dmId, allUsers) : a.dmId === dmId)) return true;
            if (!a.repId && a.lineId && lmUserLineIds.includes(a.lineId) && lineLmsCount(a.lineId) <= 1) return true;
            return false;
          }).map((a) => a.id);
          docs = docs.filter((d) => (d.repId && lmTeamIds.includes(d.repId)) || (d.areaId && lmAreaIds.includes(d.areaId)));
        } else if (isDM) {
          const repsUnderDM = allUsers.filter((u) => u.managerId === repId).map((u) => u.id);
          const dmTeamIds = [repId, ...repsUnderDM];
          const dmUser = allUsers.find((u) => u.id === repId);
          const dmUserAreaIds = dmUser ? (dmUser.areaIds || (dmUser.areaId ? [dmUser.areaId] : [])) : [];
          const dmAreaIds = allAreas.filter((a) =>
            (a.repId && dmTeamIds.includes(a.repId)) ||
            dmUserAreaIds.includes(a.id) ||
            a.dmId === repId ||
            (!a.repId && (typeof window.isAreaManagedByDm === "function" ? window.isAreaManagedByDm(a, repId, allUsers) : a.dmId === repId))
          ).map((a) => a.id);
          docs = docs.filter((d) => (d.repId && dmTeamIds.includes(d.repId)) || (d.areaId && dmAreaIds.includes(d.areaId)));
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
          docs = docs.filter((d) =>
            d.repId === repId ||
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
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
      if (d.area) {
        const aName = (d.area || '').toLowerCase().trim();
        const a = allAreas.find((x) =>
          (x.name || '').toLowerCase().trim() === aName ||
          (x.nameEn || '').toLowerCase().trim() === aName ||
          (x.nameAr || '').toLowerCase().trim() === aName
        );
        if (a && a.lineId) return a.lineId === selectedLineId;
      }
      if (d.lineId) return d.lineId === selectedLineId;
      if (Array.isArray(d.lineIds) && d.lineIds.length > 0) return d.lineIds.includes(selectedLineId);
      if (d.repId) {
        const repLines = window.getUserLines ? window.getUserLines(d.repId) : [];
        if (repLines.some((l) => l.id === selectedLineId)) return true;
      }
      return false;
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
          (selectedSpecObj.nameAr && d.specialtyAr === selectedSpecObj.nameAr) || (Array.isArray(selectedSpecObj.aliases) && selectedSpecObj.aliases.some((a) => a.toLowerCase() === (d.specialty || "").toLowerCase()))));

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
      let scopedHospitals = [];
      if (typeof window.getScopedHospitals === "function") {
        scopedHospitals = window.getScopedHospitals(false) || [];
      } else {
        const rawHospitals = (window.store && window.store.hospitals ? window.store.hospitals.getAll() : (window.DEMO_DATA && window.DEMO_DATA.hospitals)) || [];
        scopedHospitals = rawHospitals;
      }

      const currentSelectedLine = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
      if (currentSelectedLine !== 'all') {
        const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
        scopedHospitals = scopedHospitals.filter((h) => {
          if (h.lineId) return h.lineId === currentSelectedLine;
          if (h.areaId) {
            const a = allAreas.find((x) => x.id === h.areaId);
            if (a && a.lineId) return a.lineId === currentSelectedLine;
          }
          return false;
        });
      }

      const repFilter = document.getElementById("doctorRepSelect");
      const repVal = (repFilter && repFilter.value) ? repFilter.value : "all";
      let hospitalsCount = scopedHospitals.length;
      if (repVal && repVal !== "all") {
        if (repVal.startsWith("vacant:")) {
          const vacantAreaId = repVal.split(":")[1];
          const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
          const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
          const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
          hospitalsCount = scopedHospitals.filter((h) => {
            if (h.areaId) return h.areaId === vacantAreaId;
            if (areaNameLower && h.area && h.area.toLowerCase().trim() === areaNameLower) {
              if (vacantArea && vacantArea.lineId && h.lineId) return h.lineId === vacantArea.lineId;
              return true;
            }
            return false;
          }).length;
        } else {
          hospitalsCount = scopedHospitals.filter((h) => h.repId === repVal).length;
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

  const currentUser = typeof window.checkAuth === 'function' ? window.checkAuth() : null;
  const normalizedRole = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase()) : '';
  const isAdmin = currentUser && (typeof window.isAdmin === 'function' ? window.isAdmin(currentUser) : normalizedRole === 'admin');
  const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines)) || [];
  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";

  grid.innerHTML = filtered
    .map((d) => {
      const areaObj = allAreas.find((a) => a.id === d.areaId);
      const areaName = areaObj ? (areaObj.name || areaObj.id) : (d.area || "General");
      const lineObj = allLines.find((l) => l.id === (areaObj?.lineId || d.lineId));
      const lineName = lineObj ? (lineObj.name || lineObj.nameAr || "") : "";
      const effectiveRepId = d.repId || (areaObj ? (areaObj.repId || null) : null);
      const repObj = effectiveRepId ? allUsers.find((u) => u.id === effectiveRepId) : null;
      const repName = repObj ? repObj.name : "Unassigned";
      const isClassA = d.class === "A";

      return `
      <div class="directory-card card">
        <div class="directory-card-header">
          <div class="directory-avatar doctor"><svg class="badge-svg-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg></div>
          <div class="directory-header-info">
            <h4 class="directory-name">${window.escapeHtml(d.name || d.nameAr || "")}</h4>
            <span class="directory-meta-tag specialty">${window.escapeHtml(d.specialty || d.specialtyAr || "General")}</span>
          </div>
          <div class="d-flex flex-column align-items-end gap-1 ms-auto">
            <span class="badge ${isClassA ? "bg-warning text-dark" : "bg-secondary"}" style="font-size: 0.72rem;">
              Class ${window.escapeHtml(d.class || "B")}
            </span>
            ${lineName ? `<span class="badge bg-secondary" style="font-size: 0.68rem;">${window.escapeHtml(lineName)}</span>` : ""}
          </div>
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            <span class="info-text">${window.escapeHtml(d.clinicAddress || d.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg></span>
            <span class="info-text">Area: <strong>${window.escapeHtml(areaName)}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
            <span class="info-text">${window.escapeHtml(d.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <span class="info-text">Rep: <strong>${window.escapeHtml(repName)}</strong></span>
          </div>
        </div>
        ${isAdmin ? `
        <div class="directory-card-footer">
          <button type="button" class="btn btn-sm btn-outline-primary" data-doctor-action="edit" data-doctor-id="${window.escapeHtml(d.id)}">
            <svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Edit
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-doctor-action="delete" data-doctor-id="${window.escapeHtml(d.id)}">
            <svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Delete
          </button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");
}

function openDoctorModal(docId = null) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || null;
  const isAdmin = currentUser && (window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin'));
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast("Permission Denied: Only Admin can manage doctors.", "error");
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
      specialtyInput.innerHTML = specs.map((s) => `<option value="${window.escapeHtml(s.id)}">${window.escapeHtml(s.name)}</option>`).join("");
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || null;
  const isAdmin = currentUser && (window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin'));
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast("Permission Denied: Only Admin can add/edit doctors.", "error");
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

  // Read explicitly assigned rep from modal hierarchy, fallback to area rep
  const repSelectEl = document.getElementById("doctorRepInput");
  const modalRepId = (repSelectEl && repSelectEl.value && repSelectEl.value !== "all") ? repSelectEl.value : null;
  const assignedRepId = modalRepId || (areaObj ? (areaObj.repId || null) : null);

  const allUsersList = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  let assignedDmId = null;
  let assignedLmId = null;
  if (assignedRepId) {
    const repUserObj = allUsersList.find(u => u.id === assignedRepId);
    if (repUserObj && repUserObj.managerId) {
      const directMgr = allUsersList.find(u => u.id === repUserObj.managerId);
      if (directMgr) {
        const mgrRole = window.normalizeRole ? window.normalizeRole(directMgr.role) : (directMgr.role || '').toLowerCase();
        if (mgrRole === 'district_manager' || mgrRole === 'dm') {
          assignedDmId = directMgr.id;
          if (directMgr.managerId) {
            const higherMgr = allUsersList.find(u => u.id === directMgr.managerId);
            if (higherMgr) {
              const higherRole = window.normalizeRole ? window.normalizeRole(higherMgr.role) : (higherMgr.role || '').toLowerCase();
              if (higherRole === 'line_manager' || higherRole === 'lm') {
                assignedLmId = higherMgr.id;
              }
            }
          }
        } else if (mgrRole === 'line_manager' || mgrRole === 'lm') {
          assignedDmId = null; // Direct report to LM without DM
          assignedLmId = directMgr.id;
        }
      }
    }
  } else if (areaObj) {
    // Vacant territory: deduce DM and LM from area manager bindings
    const dmId = typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(areaObj, allUsersList) : (areaObj.dmId || areaObj.districtManagerId || null);
    if (dmId) {
      assignedDmId = dmId;
      const dmUserObj = allUsersList.find(u => u.id === dmId);
      if (dmUserObj && dmUserObj.managerId) {
        const lmUserObj = allUsersList.find(u => u.id === dmUserObj.managerId);
        if (lmUserObj) assignedLmId = lmUserObj.id;
      }
    } else if (areaObj.lmId || areaObj.managerId) {
      const lmCandidateId = areaObj.lmId || areaObj.managerId;
      const lmUser = allUsersList.find(u => u.id === lmCandidateId);
      if (lmUser) {
        const r = window.normalizeRole ? window.normalizeRole(lmUser.role) : (lmUser.role || '').toLowerCase();
        if (r === 'line_manager' || r === 'lm') assignedLmId = lmUser.id;
      }
    }
    if (!assignedLmId && assignedLineId) {
      const lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines)) || [];
      const lineObj = lines.find(l => l.id === assignedLineId);
      if (lineObj && lineObj.lineManagerId) assignedLmId = lineObj.lineManagerId;
    }
  }

  const existingDocRecord = id ? (getDoctorsData().find((d) => d.id === id) || {}) : {};

  const doctorObj = {
    ...(existingDocRecord || {}),
    id: id || (typeof window.genId === "function" ? window.genId("doc_") : "doc_" + Date.now()),
    name,
    specialtyId,
    specialty,
    specialtyAr,
    class: docClass,
    address,
    clinicAddress: address,
    phone,
    repId: assignedRepId,
    dmId: assignedDmId,
    lmId: assignedLmId,
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
  if (typeof showToast === "function") showToast("Doctor saved successfully.", "success");
}

let doctorToDeleteId = null;

function openDeleteDoctorModal(docId) {
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || null;
  const isAdmin = currentUser && (window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin'));
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast("Permission Denied: Only Admin can delete doctors.", "error");
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
  const currentUser = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || null;
  const isAdmin = currentUser && (window.isAdmin ? window.isAdmin(currentUser) : ((currentUser && currentUser.role) === 'admin'));
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast("Permission Denied: Only Admin can delete doctors.", "error");
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
  if (typeof showToast === "function") showToast("Doctor deleted successfully.", "info");
}

function onDoctorFilterChange() {
  const results = document.getElementById("doctorsResultsContainer");
  if (results && results.style.display !== "none" && typeof renderDoctorsReport === "function") {
    renderDoctorsReport();
  }
}

function onDoctorLmChange() {
  if (typeof window.onReportLmChange === "function") window.onReportLmChange("doctors");
}
function onDoctorDmChange() {
  if (typeof window.onReportDmChange === "function") window.onReportDmChange("doctors");
}

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

// Enter key support for doctor search
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target && e.target.id === "doctorSearchInput") {
    if (typeof renderDoctorsReport === "function") {
      renderDoctorsReport();
    }
  }
});

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
      "Clinic Address",
      "Phone",
      "Assigned Rep",
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

  const localDateStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || (() => {
    const d = (window.getSystemDate && window.getSystemDate()) || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const fileName = `doctors_directory_${localDateStr}`;
  const sheetTitle = "Doctors";

  if (typeof window.downloadExcelOrCsv === "function") {
    window.downloadExcelOrCsv(fileName, sheetTitle, rows, headers);
  } else {
    const escapeCsv = (val) => {
      let s = val === null || val === undefined ? "" : String(val);
      // Neutralize CSV formula injection (=, +, -, @, \t, \r)
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
      }
      if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r") || s.startsWith("'")) {
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

// Secure Event Delegation for doctor directory actions (eliminates inline onclick & prevents XSS)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-doctor-action]");
  if (!btn) return;
  const action = btn.dataset.doctorAction;
  const docId = btn.dataset.doctorId;
  if (action === "edit" && docId) {
    if (typeof window.openDoctorModal === "function") {
      window.openDoctorModal(docId);
    }
  } else if (action === "delete" && docId) {
    if (typeof window.openDeleteDoctorModal === "function") {
      window.openDeleteDoctorModal(docId);
    }
  }
});

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

