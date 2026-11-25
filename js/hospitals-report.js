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

function sortBilingualHospitals(a, b) {
  if (typeof window !== "undefined" && typeof window.sortBilingualByName === "function") {
    return window.sortBilingualByName(a, b);
  }
  const nameA = (a.name || a.nameAr || "").trim();
  const nameB = (b.name || b.nameAr || "").trim();
  return nameA.localeCompare(nameB, ["en", "ar"], { numeric: true, sensitivity: "base" });
}

function getScopedHospitals(respectActiveFilters = true) {
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

  let hosps = getHospitalsData();

  // Role scoping: Reps get all hospitals assigned to their id OR located in any of their assigned areas
  if (isRep) {
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
        return []; // Fail-closed: PM without assigned lines sees no hospitals
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

    const lmFilter = document.getElementById("hospitalLmSelect");
    const dmFilter = document.getElementById("hospitalDmSelect");
    const repFilter = document.getElementById("hospitalRepSelect");
    const repId = (repFilter && repFilter.value !== "all") ? repFilter.value : ((dmFilter && dmFilter.value !== "all") ? dmFilter.value : ((lmFilter && lmFilter.value !== "all") ? lmFilter.value : "all"));

    if (allowedTeamIds || allowedAreaIds) {
      hosps = hosps.filter((h) => {
        if (repId && repId.startsWith("vacant:")) {
          const vAreaId = repId.split(":")[1];
          // Critical security fix: must verify that the vacant area is within allowedAreaIds for this manager
          if (role === "admin" || role === "hr" || (allowedAreaIds && allowedAreaIds.includes(vAreaId))) {
            if (h.areaId === vAreaId) return true;
          }
        }
        if (h.repId && allowedTeamIds && allowedTeamIds.includes(h.repId)) {
          return true;
        }
        if (role === "admin" || role === "hr") {
          return true;
        }
        if (h.dmId && h.dmId === currentUser.id) {
          return true;
        }
        if (allowedAreaIds) {
          const hospAreaName = (h.area || "").toLowerCase().trim();
          if (h.areaId && allowedAreaIds.includes(h.areaId)) return true;
          if (hospAreaName && allowedAreaNames && allowedAreaNames.includes(hospAreaName)) return true;
        }
        if (role === "product_manager" || role === "pm") {
          const pmLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
          const pmLineIds = pmLines.map((l) => l.id);
          if (h.lineId && pmLineIds.includes(h.lineId)) return true;
          if (Array.isArray(h.lineIds) && h.lineIds.some((lid) => pmLineIds.includes(lid))) return true;
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
          hosps = hosps.filter((h) => (h.repId && lmTeamIds.includes(h.repId)) || (h.areaId && lmAreaIds.includes(h.areaId)));
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
        const a = allAreas.find((x) => (x.name || '').toLowerCase().trim() === aName || (x.nameEn || '').toLowerCase().trim() === aName || (x.nameAr || '').toLowerCase().trim() === aName);
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
    return hosps.slice().sort(sortBilingualHospitals);
  }

  const searchInput = document.getElementById("hospitalSearchInput");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const filteredHosps = hosps.filter((h) => {
    return (
      !query ||
      (h.name && h.name.toLowerCase().includes(query)) ||
      (h.nameAr && h.nameAr.toLowerCase().includes(query)) ||
      (h.address && h.address.toLowerCase().includes(query)) ||
      (h.phone && h.phone.toLowerCase().includes(query))
    );
  });

  return filteredHosps.sort(sortBilingualHospitals);
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

  const currentUser = (typeof checkAuth === 'function' ? checkAuth() : null);
  if (!currentUser) return;
  const normalizedRole = window.normalizeRole ? window.normalizeRole(currentUser.role) : (currentUser.role || '').toLowerCase();
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
          <div class="directory-avatar hospital"><svg class="badge-svg-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M12 6v6"/></svg></div>
          <div class="directory-header-info">
            <h4 class="directory-name">${window.escapeHtml(displayName)}</h4>
            <span class="directory-meta-tag hospital">Hospital / Medical Center</span>
          </div>
          ${lineName ? `<span class="badge bg-secondary ms-auto" style="font-size: 0.72rem;">${window.escapeHtml(lineName)}</span>` : ""}
        </div>
        <div class="directory-card-body">
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            <span class="info-text">${window.escapeHtml(h.address || "No address specified")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg></span>
            <span class="info-text">Area: <strong>${window.escapeHtml(areaName)}</strong></span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
            <span class="info-text">${window.escapeHtml(h.phone || "No phone provided")}</span>
          </div>
          <div class="directory-info-row">
            <span class="info-icon"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <span class="info-text">Rep: <strong>${window.escapeHtml(repName)}</strong></span>
          </div>
        </div>
        ${isAdmin ? `
        <div class="directory-card-footer">
          <button type="button" class="btn btn-sm btn-outline-primary" data-hospital-action="edit" data-hospital-id="${window.escapeHtml(h.id)}">
            <svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Edit
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-hospital-action="delete" data-hospital-id="${window.escapeHtml(h.id)}">
            <svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Delete
          </button>
        </div>
        ` : ''}
      </div>
    `;
    })
    .join("");

  // Delegated events handled globally via document listener below
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

  const existingHosp = id ? ((window.store && window.store.hospitals ? window.store.hospitals.getById(id) : null) || (window.DEMO_DATA?.hospitals?.find((h) => h.id === id))) : null;

  const hospitalObj = {
    ...(existingHosp || {}),
    id: id || (window.genId ? window.genId("hosp_") : "hosp_" + Date.now()),
    name,
    nameAr: (existingHosp && existingHosp.nameAr) || name,
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
      h.id,
      h.name || h.nameAr || "",
      h.address || "",
      h.phone || "",
      rep,
      area,
      h.lineId || ""
    ];
  });

  if (typeof window.downloadExcelOrCsv === "function") {
    window.downloadExcelOrCsv("Hospitals_Directory", "Hospitals", rows, headers);
    return;
  }

  const escapeCsvCell = (val) => {
    let s = String(val == null ? "" : val).trim();
    if (/^[=+\-@\t\r]/.test(s)) {
      s = "'" + s;
    }
    return `"${s.replace(/"/g, '""')}"`;
  };

  const csvRows = rows.map((r) => r.map(escapeCsvCell).join(","));
  const csvHeaders = headers.map(escapeCsvCell).join(",");
  const csvContent = "\uFEFF" + [csvHeaders, ...csvRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const localDateStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || (() => {
    const d = (window.getSystemDate && window.getSystemDate()) || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  link.setAttribute("download", `Hospitals_Directory_${localDateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Secure Event Delegation for hospital directory actions (eliminates inline onclick & prevents XSS)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-hospital-action]");
  if (!btn) return;
  const action = btn.dataset.hospitalAction || btn.getAttribute("data-hospital-action");
  const hospId = btn.dataset.hospitalId || btn.getAttribute("data-hospital-id");
  if (action === "edit" && hospId) {
    if (typeof window.openHospitalModal === "function") {
      window.openHospitalModal(hospId);
    }
  } else if (action === "delete" && hospId) {
    if (typeof window.openDeleteHospitalModal === "function") {
      window.openDeleteHospitalModal(hospId);
    }
  }
});

// Global window bindings
window.getHospitalsData = getHospitalsData;
window.getScopedHospitals = getScopedHospitals;
window.sortBilingualHospitals = sortBilingualHospitals;
window.renderHospitalsReport = renderHospitalsReport;
window.openHospitalModal = openHospitalModal;
window.closeHospitalModal = closeHospitalModal;
window.saveHospital = saveHospital;
window.openDeleteHospitalModal = openDeleteHospitalModal;
window.closeDeleteHospitalModal = closeDeleteHospitalModal;
window.confirmDeleteHospital = confirmDeleteHospital;
window.onHospitalFilterChange = onHospitalFilterChange;
window.exportHospitalsDirectory = exportHospitalsDirectory;
