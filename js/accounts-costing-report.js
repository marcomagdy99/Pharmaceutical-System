/**
 * @file accounts-costing-report.js
 * @description Accounts Costing Report & Investment Ledger Engine
 * Integrates approved doctor services, event activities, and direct clinic support
 * with strict organizational role hierarchy (Rep -> DM -> LM -> Admin),
 * dynamic category columns, cascading filters, and Excel export.
 */

(function (window) {
  "use strict";

  // State container
  const CostingState = {
    initialized: false,
    currentRows: [],
    dynamicCategories: [],
    searchTerm: "",
    selectedDoctorForBreakdown: null,
  };

  if (typeof window.translations !== "undefined" && window.translations.en) {
    window.translations.en.tabAccountsCosting = "Accounts Costing";
  }

  /**
   * Safe helper to retrieve current authenticated user with full profile data
   */
  function getCurrentUser() {
    let authUser = null;
    if (typeof window.checkAuth === "function") {
      authUser = window.checkAuth();
    } else if (window.store && window.store.users && window.store.users.getCurrentUser) {
      authUser = window.store.users.getCurrentUser();
    } else {
      try {
        const raw = sessionStorage.getItem("pharmaUser") || localStorage.getItem("pharmaUser");
        if (raw) authUser = JSON.parse(raw);
      } catch (e) {}
    }

    if (!authUser) {
      const savedId = localStorage.getItem("userId") || "u1790626000001";
      authUser = { id: savedId, role: localStorage.getItem("userRole") || "medical_rep" };
    }

    // Always merge with full database user record to guarantee managerId, areaId, lineId exist
    const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const fullUser = allUsers.find((u) => u.id === authUser.id || (authUser.email && u.email === authUser.email));
    if (fullUser) {
      return { ...fullUser, ...authUser };
    }
    return authUser;
  }

  /**
   * Safe helper to normalize user role
   */
  function getNormalizedRole(user) {
    if (!user) return "medical_rep";
    if (typeof window.normalizeRole === "function") {
      return window.normalizeRole(user.role);
    }
    const r = String(user.role || "").toLowerCase().trim();
    if (r === "dm" || r === "district_manager" || r === "district manager") return "district_manager";
    if (r === "lm" || r === "line_manager" || r === "line manager") return "line_manager";
    if (r === "bu" || r === "business_unit" || r === "business unit") return "business_unit";
    if (r === "rep" || r === "medical_rep" || r === "medical rep") return "medical_rep";
    if (r === "admin" || r === "administrator") return "admin";
    if (r === "hr") return "admin";
    return r;
  }


  /**
   * Formats numbers into localized currency string (EGP)
   */
  function formatEGP(amount) {
    const val = Number(amount) || 0;
    return val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  /**
   * Resolves the strict organizational hierarchy permissions and scope for the logged-in user
   */
  function resolveUserCostingScope(user) {
    const role = getNormalizedRole(user);
    const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const allLines = (window.store && window.store.productLines && window.store.productLines.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const allDoctors = (window.store && window.store.doctors && window.store.doctors.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];

    const isAdmin = role === "admin" || role === "general_manager" || role === "commercial_director";
    const isLM = role === "line_manager" || role === "business_unit";
    const isDM = role === "district_manager";
    const isRep = !isAdmin && !isLM && !isDM; // defaults to rep

    // 1. Admin Scope: Unrestricted
    if (isAdmin) {
      return {
        role,
        isAdmin: true,
        isLM: false,
        isDM: false,
        isRep: false,
        allowedLines: allLines,
        allowedLineIds: new Set(allLines.map((l) => l.id)),
        allowedDMs: allUsers.filter((u) => getNormalizedRole(u) === "district_manager"),
        allowedReps: allUsers.filter((u) => getNormalizedRole(u) === "medical_rep"),
        allowedRepIds: new Set(allUsers.filter((u) => getNormalizedRole(u) === "medical_rep").map((u) => u.id)),
        allowedAreas: allAreas,
        allowedAreaIds: new Set(allAreas.map((a) => a.id)),
        allowedDoctorIds: new Set(allDoctors.map((d) => d.id)),
      };
    }

    // 2. Medical Representative Scope: strictly own lines, areas, and doctors
    if (isRep) {
      // Resolve Rep's assigned line(s)
      const repLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
      let myLines = repLines.length > 0 ? repLines : allLines.filter((l) =>
        l.id === user.lineId || (user.lineIds && user.lineIds.includes(l.id))
      );
      if (user.lineId && !myLines.some((l) => l.id === user.lineId)) {
        const directLine = allLines.find((l) => l.id === user.lineId);
        if (directLine) myLines.unshift(directLine);
      }
      if (myLines.length === 0 && user.lineId) {
        myLines = allLines.filter((l) => l.id === user.lineId);
      }
      if (myLines.length === 0 && allLines.length > 0) {
        myLines = [allLines[0]];
      }
      const myLineIds = new Set(myLines.map((l) => l.id));

      // Resolve Rep's assigned areas
      const repAreaIdSet = new Set(user.areaIds || []);
      if (user.areaId) repAreaIdSet.add(user.areaId);

      let myAreas = allAreas.filter((a) =>
        a.repId === user.id || repAreaIdSet.has(a.id)
      );
      if (user.areaId && !myAreas.some((a) => a.id === user.areaId)) {
        const directArea = allAreas.find((a) => a.id === user.areaId);
        if (directArea) myAreas.unshift(directArea);
      }

      // Check territory history for active assignment
      if (window.store && window.store.territoryHistory && typeof window.store.territoryHistory.getByUser === "function") {
        const hist = window.store.territoryHistory.getByUser(user.id) || [];
        hist.forEach((h) => {
          if (!h.endDate) {
            const matchA = allAreas.find((a) => a.id === h.areaId);
            if (matchA && !myAreas.some((a) => a.id === matchA.id)) {
              myAreas.push(matchA);
            }
          }
        });
      }

      if (myAreas.length === 0 && allAreas.length > 0) {
        // Fallback: match by line
        myAreas = allAreas.filter((a) => myLineIds.has(a.lineId));
      }
      const myAreaIds = new Set(myAreas.map((a) => a.id));

      // Resolve Rep's assigned Doctors
      let myDoctors = allDoctors.filter((d) =>
        d.repId === user.id || myAreaIds.has(d.areaId)
      );
      if (myDoctors.length === 0 && myLineIds.size > 0) {
        myDoctors = allDoctors.filter((d) => myLineIds.has(d.lineId));
      }
      const myDoctorIds = new Set(myDoctors.map((d) => d.id));

      // Resolve Rep's District Manager (DM)
      let myDM = null;
      if (user.managerId) {
        myDM = allUsers.find((u) => u.id === user.managerId);
      }
      if (!myDM && user.dmId) {
        myDM = allUsers.find((u) => u.id === user.dmId);
      }
      if (!myDM) {
        for (const a of myAreas) {
          if (a.dmId) {
            myDM = allUsers.find((u) => u.id === a.dmId);
            if (myDM) break;
          }
          const mgrId = typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(a, allUsers) : null;
          if (mgrId) {
            myDM = allUsers.find((u) => u.id === mgrId);
            if (myDM) break;
          }
        }
      }
      if (!myDM) {
        // Find DM operating in the rep's line
        myDM = allUsers.find((u) =>
          getNormalizedRole(u) === "district_manager" &&
          (u.lineId === user.lineId || (u.lineIds && u.lineIds.includes(user.lineId)))
        );
      }

      return {
        role: "medical_rep",
        isAdmin: false,
        isLM: false,
        isDM: false,
        isRep: true,
        allowedLines: myLines,
        allowedLineIds: myLineIds,
        allowedDMs: myDM ? [myDM] : [],
        allowedReps: [user],
        allowedRepIds: new Set([user.id]),
        allowedAreas: myAreas,
        allowedAreaIds: myAreaIds,
        allowedDoctorIds: myDoctorIds,
      };
    }

    // 3. District Manager Scope: strictly own district reps, areas, and doctors
    if (isDM) {
      const subUsers = typeof window.getAllSubordinates === "function"
        ? window.getAllSubordinates(user.id)
        : allUsers.filter((u) => u.dmId === user.id || u.managerId === user.id);

      const districtReps = subUsers.filter((u) => getNormalizedRole(u) === "medical_rep");
      const districtRepIds = new Set([user.id, ...districtReps.map((r) => r.id)]);

      const districtAreas = allAreas.filter((a) =>
        a.dmId === user.id || a.managerId === user.id || districtRepIds.has(a.repId)
      );
      const districtAreaIds = new Set(districtAreas.map((a) => a.id));

      const dmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
      const districtLineIds = new Set(districtAreas.map((a) => a.lineId).filter(Boolean));
      dmLines.forEach((l) => districtLineIds.add(l.id));
      if (user.lineId) districtLineIds.add(user.lineId);
      if (Array.isArray(user.lineIds)) user.lineIds.forEach((lid) => districtLineIds.add(lid));

      const allowedLines = allLines.filter((l) => districtLineIds.has(l.id));

      const districtDoctors = allDoctors.filter((d) =>
        districtRepIds.has(d.repId) || districtAreaIds.has(d.areaId)
      );
      const districtDoctorIds = new Set(districtDoctors.map((d) => d.id));

      return {
        role,
        isAdmin: false,
        isLM: false,
        isDM: true,
        isRep: false,
        allowedLines: allowedLines.length > 0 ? allowedLines : allLines,
        allowedLineIds: districtLineIds.size > 0 ? districtLineIds : new Set(allLines.map((l) => l.id)),
        allowedDMs: [user],
        allowedReps: districtReps,
        allowedRepIds: districtRepIds,
        allowedAreas: districtAreas,
        allowedAreaIds: districtAreaIds,
        allowedDoctorIds: districtDoctorIds,
      };
    }

    // 4. Line Manager Scope: strictly own lines, subordinate DMs and Reps
    if (isLM) {
      const lmLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
      let myLines = lmLines.length > 0 ? lmLines : allLines.filter((l) =>
        l.lineManagerId === user.id || (user.lineIds && user.lineIds.includes(l.id)) || user.lineId === l.id
      );
      if (myLines.length === 0) myLines = allLines;
      const myLineIds = new Set(myLines.map((l) => l.id));

      const subUsers = typeof window.getAllSubordinates === "function"
        ? window.getAllSubordinates(user.id)
        : allUsers.filter((u) => u.managerId === user.id || (u.lineId && myLineIds.has(u.lineId)));

      const lmDMs = subUsers.filter((u) => getNormalizedRole(u) === "district_manager");
      const lmReps = subUsers.filter((u) => getNormalizedRole(u) === "medical_rep");
      const lmRepIds = new Set(lmReps.map((r) => r.id));

      const lmAreas = allAreas.filter((a) => myLineIds.has(a.lineId) || lmRepIds.has(a.repId));
      const lmAreaIds = new Set(lmAreas.map((a) => a.id));

      const lmDoctors = allDoctors.filter((d) =>
        myLineIds.has(d.lineId) || lmAreaIds.has(d.areaId) || lmRepIds.has(d.repId)
      );
      const lmDoctorIds = new Set(lmDoctors.map((d) => d.id));

      return {
        role,
        isAdmin: false,
        isLM: true,
        isDM: false,
        isRep: false,
        allowedLines: myLines,
        allowedLineIds: myLineIds,
        allowedDMs: lmDMs,
        allowedReps: lmReps,
        allowedRepIds: lmRepIds,
        allowedAreas: lmAreas,
        allowedAreaIds: lmAreaIds,
        allowedDoctorIds: lmDoctorIds,
      };
    }

    return {
      role: "medical_rep",
      isAdmin: false,
      isLM: false,
      isDM: false,
      isRep: true,
      allowedLines: allLines,
      allowedLineIds: new Set(allLines.map((l) => l.id)),
      allowedDMs: [],
      allowedReps: [user],
      allowedRepIds: new Set([user.id]),
      allowedAreas: allAreas.filter((a) => a.repId === user.id),
      allowedAreaIds: new Set(allAreas.filter((a) => a.repId === user.id).map((a) => a.id)),
      allowedDoctorIds: new Set(allDoctors.filter((d) => d.repId === user.id).map((d) => d.id)),
    };
  }

  /**
   * Initialize Accounts Costing Tab
   */
  function initAccountsCostingTab() {
    const currentUser = getCurrentUser();
    populateCostingFilters(currentUser);
    setDefaultCostingDates();
    renderAccountsCostingReport();
    CostingState.initialized = true;
  }

  /**
   * Sets default date range (Current Month)
   */
  function setDefaultCostingDates() {
    const fromInput = document.getElementById("accountsCostingDateFrom");
    const toInput = document.getElementById("accountsCostingDateTo");
    if (!fromInput || !toInput) return;

    if (!fromInput.value || !toInput.value) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      fromInput.value = formatDateForInput(firstDay);
      toInput.value = formatDateForInput(lastDay);
    }
  }

  /**
   * Format Date to YYYY-MM-DD
   */
  function formatDateForInput(date) {
    if (window.formatDate) return window.formatDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Sets Quick Period Presets
   */
  function setAccountsCostingPeriodPreset(presetKey) {
    const fromInput = document.getElementById("accountsCostingDateFrom");
    const toInput = document.getElementById("accountsCostingDateTo");
    if (!fromInput || !toInput) return;

    const now = new Date();
    if (presetKey === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      fromInput.value = formatDateForInput(firstDay);
      toInput.value = formatDateForInput(lastDay);
    } else if (presetKey === "lastMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      fromInput.value = formatDateForInput(firstDay);
      toInput.value = formatDateForInput(lastDay);
    } else if (presetKey === "thisYear") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      fromInput.value = formatDateForInput(firstDay);
      toInput.value = formatDateForInput(lastDay);
    } else if (presetKey === "allTime") {
      fromInput.value = "";
      toInput.value = "";
    }

    renderAccountsCostingReport();
  }

  /**
   * Populates cascading filters strictly respecting the user's role and hierarchy
   */
  function populateCostingFilters(user) {
    const scope = resolveUserCostingScope(user);

    // 1. Line Select
    const lineSelect = document.getElementById("accountsCostingLineSelect");
    if (lineSelect) {
      if (scope.isRep) {
        // Medical rep: strictly show their assigned line(s)
        if (scope.allowedLines.length === 1) {
          lineSelect.innerHTML = `<option value="${scope.allowedLines[0].id}">${window.escapeHtml(scope.allowedLines[0].name)}</option>`;
          lineSelect.value = scope.allowedLines[0].id;
          lineSelect.disabled = true;
        } else {
          lineSelect.innerHTML = scope.allowedLines.map((l) => `<option value="${l.id}">${window.escapeHtml(l.name)}</option>`).join("");
          lineSelect.value = scope.allowedLines[0]?.id || "";
          lineSelect.disabled = false;
        }
      } else {
        // Admin, LM, or DM
        let optionsHtml = `<option value="all">All Lines</option>` +
          scope.allowedLines.map((l) => `<option value="${l.id}">${window.escapeHtml(l.name)}</option>`).join("");
        lineSelect.innerHTML = optionsHtml;

        if (window.selectedReportLineId && window.selectedReportLineId !== "all" && scope.allowedLineIds.has(window.selectedReportLineId)) {
          lineSelect.value = window.selectedReportLineId;
        } else {
          lineSelect.value = "all";
        }
        lineSelect.disabled = false;
      }
    }

    // 2. District / DM Select
    const dmSelect = document.getElementById("accountsCostingDmSelect");
    if (dmSelect) {
      if (scope.isRep) {
        const myDM = scope.allowedDMs[0];
        const dmName = myDM ? (myDM.name || myDM.username) : "Assigned District Manager";
        const dmId = myDM ? myDM.id : "dm";
        dmSelect.innerHTML = `<option value="${dmId}">${window.escapeHtml(dmName)}</option>`;
        dmSelect.value = dmId;
        dmSelect.disabled = true;
      } else if (scope.isDM) {
        dmSelect.innerHTML = `<option value="${user.id}">${window.escapeHtml(user.name || user.username)}</option>`;
        dmSelect.value = user.id;
        dmSelect.disabled = true;
      } else {
        // Admin or LM
        dmSelect.innerHTML = `<option value="all">All Districts / DMs</option>` +
          scope.allowedDMs.map((u) => `<option value="${u.id}">${window.escapeHtml(u.name || u.username)}</option>`).join("");
        dmSelect.disabled = false;
        dmSelect.value = "all";
      }
    }

    // 3. Medical Rep Select
    populateCostingRepOptions();

    // 4. Territory / Area Select
    populateCostingAreaOptions();

    // 5. Specialty Select (Never empty - loaded from master specialties catalog)
    populateCostingSpecialtyOptions();
  }

  /**
   * Populates Rep options based on selected Line & DM within user's allowed scope
   */
  function populateCostingRepOptions() {
    const user = getCurrentUser();
    const scope = resolveUserCostingScope(user);
    const repSelect = document.getElementById("accountsCostingRepSelect");
    if (!repSelect) return;

    if (scope.isRep) {
      repSelect.innerHTML = `<option value="${user.id}">${window.escapeHtml(user.name || user.username)}</option>`;
      repSelect.value = user.id;
      repSelect.disabled = true;
      return;
    }

    let reps = scope.allowedReps;
    const lineVal = document.getElementById("accountsCostingLineSelect")?.value;
    const dmVal = document.getElementById("accountsCostingDmSelect")?.value;

    if (lineVal && lineVal !== "all") {
      reps = reps.filter((r) => !r.lineId || r.lineId === lineVal);
    }
    if (dmVal && dmVal !== "all") {
      reps = reps.filter((r) => r.dmId === dmVal || r.managerId === dmVal);
    }

    const allLabel = scope.isDM ? "All District Reps" : "All Medical Reps";
    repSelect.innerHTML = `<option value="all">${allLabel}</option>` +
      reps.map((r) => `<option value="${r.id}">${window.escapeHtml(r.name || r.username)}</option>`).join("");
    repSelect.disabled = false;
    repSelect.value = "all";
  }

  /**
   * Populates Area options based on selected Line & Rep within user's allowed scope
   */
  function populateCostingAreaOptions() {
    const user = getCurrentUser();
    const scope = resolveUserCostingScope(user);
    const areaSelect = document.getElementById("accountsCostingAreaSelect");
    if (!areaSelect) return;

    if (scope.isRep) {
      // Rep strictly sees only their own areas
      if (scope.allowedAreas.length === 1) {
        areaSelect.innerHTML = `<option value="${scope.allowedAreas[0].id}">${window.escapeHtml(scope.allowedAreas[0].name)}</option>`;
        areaSelect.value = scope.allowedAreas[0].id;
        areaSelect.disabled = true;
      } else if (scope.allowedAreas.length > 1) {
        areaSelect.innerHTML = `<option value="all">All My Areas</option>` +
          scope.allowedAreas.map((a) => `<option value="${a.id}">${window.escapeHtml(a.name)}</option>`).join("");
        areaSelect.value = "all";
        areaSelect.disabled = false;
      } else {
        areaSelect.innerHTML = `<option value="all">Assigned Territory</option>`;
        areaSelect.value = "all";
        areaSelect.disabled = true;
      }
      return;
    }

    // For Managers & Admin
    let areas = scope.allowedAreas;
    const lineVal = document.getElementById("accountsCostingLineSelect")?.value;
    const repVal = document.getElementById("accountsCostingRepSelect")?.value;

    if (lineVal && lineVal !== "all") {
      areas = areas.filter((a) => !a.lineId || a.lineId === lineVal);
    }
    if (repVal && repVal !== "all") {
      areas = areas.filter((a) => a.repId === repVal);
    }

    const allLabel = scope.isDM ? "All District Areas" : "All Territories / Areas";
    areaSelect.innerHTML = `<option value="all">${allLabel}</option>` +
      areas.map((a) => `<option value="${a.id}">${window.escapeHtml(a.name)}</option>`).join("");
    areaSelect.disabled = false;
    areaSelect.value = "all";
  }

  /**
   * Populates Specialty options guaranteed from master specialties catalog
   */
  function populateCostingSpecialtyOptions() {
    const specialtySelect = document.getElementById("accountsCostingSpecialtySelect");
    if (!specialtySelect) return;

    const allSpecs = (window.store && window.store.specialties ? window.store.specialties.getAll() : (window.DEMO_DATA && window.DEMO_DATA.specialties)) || [];
    const allDoctors = (window.store && window.store.doctors && window.store.doctors.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];

    const specSet = new Set();
    allSpecs.forEach((s) => {
      if (s && s.name) specSet.add(s.name);
    });
    allDoctors.forEach((d) => {
      if (d && d.specialty) specSet.add(d.specialty);
    });

    // Fallback baseline specialties if none in storage
    if (specSet.size === 0) {
      ["Internal Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Dermatology", "ENT", "Ophthalmology", "Neurology", "Surgery", "Urology"].forEach((s) => specSet.add(s));
    }

    const sorted = Array.from(specSet).sort();
    specialtySelect.innerHTML = `<option value="all">All Specialties</option>` +
      sorted.map((sp) => `<option value="${window.escapeHtml(sp)}">${window.escapeHtml(sp)}</option>`).join("");
    specialtySelect.value = "all";
  }

  /**
   * Event handlers for cascading filter changes
   */
  function onAccountsCostingLineChange() {
    populateCostingRepOptions();
    populateCostingAreaOptions();
    renderAccountsCostingReport();
  }

  function onAccountsCostingDmChange() {
    populateCostingRepOptions();
    populateCostingAreaOptions();
    renderAccountsCostingReport();
  }

  function onAccountsCostingRepChange() {
    populateCostingAreaOptions();
    renderAccountsCostingReport();
  }

  function onAccountsCostingSearchInput(val) {
    CostingState.searchTerm = (val || "").trim().toLowerCase();
    filterAndDisplayCostingRows();
  }

  function resetAccountsCostingFilters() {
    setDefaultCostingDates();
    const user = getCurrentUser();
    populateCostingFilters(user);

    const searchInp = document.getElementById("accountsCostingSearchInput");
    if (searchInp) searchInp.value = "";
    CostingState.searchTerm = "";

    const classSel = document.getElementById("accountsCostingClassSelect");
    if (classSel) classSel.value = "all";

    const specSel = document.getElementById("accountsCostingSpecialtySelect");
    if (specSel) specSel.value = "all";

    const expCheck = document.getElementById("accountsCostingOnlyWithExpenses");
    if (expCheck) expCheck.checked = false;

    renderAccountsCostingReport();
  }

  /**
   * Collects all approved services and activities data strictly restricted to user's hierarchy scope
   */
  function fetchRawCostingTransactions(scope) {
    const rawServices = (window.store && window.store.services && window.store.services.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.services) || [];

    const transactions = [];

    // Map approved services and unpack shared service allocations
    rawServices.forEach((s) => {
      const isShared = s.isShared === true && Array.isArray(s.shares) && s.shares.length > 0;

      if (isShared) {
        // Iterate through each share allocation
        s.shares.forEach((sh, shIdx) => {
          const shStatus = String(sh.status || s.status || "").toLowerCase();
          const parentStatus = String(s.status || "").toLowerCase();
          const isApproved = shStatus === "approved" || shStatus === "accepted" || (parentStatus === "approved" && shStatus !== "rejected");
          if (!isApproved) return;

          const shareCost = Number(sh.shareAmount !== undefined ? sh.shareAmount : (sh.cost || 0));
          if (shareCost <= 0) return;

          const shareRepId = sh.repId || s.requesterId || null;
          const shareLineId = sh.lineId || s.lineId || null;
          const shareAreaId = sh.areaId || s.areaId || null;

          // Scope check per share
          if (!scope.isAdmin) {
            if (scope.isRep) {
              const isMyRep = shareRepId && scope.allowedRepIds.has(shareRepId);
              const isMyArea = shareAreaId && scope.allowedAreaIds.has(shareAreaId);
              if (!isMyRep && !isMyArea) return;
            } else if (scope.isDM) {
              const isDistrictRep = shareRepId && scope.allowedRepIds.has(shareRepId);
              const isDistrictArea = shareAreaId && scope.allowedAreaIds.has(shareAreaId);
              const isDistrictLine = shareLineId && scope.allowedLineIds.has(shareLineId);
              if (!isDistrictRep && !isDistrictArea && !isDistrictLine) return;
            } else if (scope.isLM) {
              const isLmLine = shareLineId && scope.allowedLineIds.has(shareLineId);
              const isLmRep = shareRepId && scope.allowedRepIds.has(shareRepId);
              if (!isLmLine && !isLmRep) return;
            } else {
              const matchesDoc = s.targetId && scope.allowedDoctorIds.has(s.targetId);
              const matchesRep = shareRepId && scope.allowedRepIds.has(shareRepId);
              const matchesArea = shareAreaId && scope.allowedAreaIds.has(shareAreaId);
              if (!matchesDoc && !matchesRep && !matchesArea) return;
            }
          }

          const categoryName = determineCategoryName(s.category || s.title || s.type || "Other Requests");
          const splitLabel = sh.sharePercent ? ` (Shared: ${sh.sharePercent}%)` : " (Shared)";
          transactions.push({
            id: `${s.id}_sh_${shIdx}`,
            serviceId: s.id,
            source: "service",
            date: s.date || "",
            targetId: s.targetId || null,
            targetName: s.targetName || "",
            targetType: s.targetType || "doctor",
            category: categoryName,
            title: (s.title || s.notes || "Service") + splitLabel,
            cost: shareCost,
            repId: shareRepId,
            lineId: shareLineId,
            areaId: shareAreaId,
            notes: s.notes || "",
            attachmentBase64: s.attachmentBase64 || null,
            status: "approved",
            isShared: true,
            sharePercent: sh.sharePercent,
            shareAmount: shareCost,
          });
        });
        return;
      }

      // Standard non-shared service
      const st = String(s.status || "").toLowerCase();
      if (st !== "approved" && st !== "accepted") return;

      const cost = Number(s.cost || s.amount || 0);
      if (cost <= 0) return;

      // Strict role enforcement
      if (!scope.isAdmin) {
        const matchesDoc = s.targetId && scope.allowedDoctorIds.has(s.targetId);
        const matchesRep = s.requesterId && scope.allowedRepIds.has(s.requesterId);
        const matchesArea = s.areaId && scope.allowedAreaIds.has(s.areaId);
        if (!matchesDoc && !matchesRep && !matchesArea) {
          return;
        }
      }

      const categoryName = determineCategoryName(s.category || s.title || s.type || "Other Requests");
      transactions.push({
        id: s.id,
        serviceId: s.id,
        source: "service",
        date: s.date || "",
        targetId: s.targetId || null,
        targetName: s.targetName || "",
        targetType: s.targetType || "doctor",
        category: categoryName,
        title: s.title || s.notes || "Service",
        cost: cost,
        repId: s.requesterId || s.repId || null,
        lineId: s.lineId || null,
        areaId: s.areaId || null,
        notes: s.notes || "",
        attachmentBase64: s.attachmentBase64 || null,
        status: s.status || "approved",
        isShared: false,
      });
    });

    // Also scan activities for event activities with cost and attended doctors
    if (window.store && window.store.activities && typeof window.store.activities.getAllForUser === "function") {
      const allUsers = (window.store.users && window.store.users.getAll()) || [];
      const relevantUsers = scope.isAdmin ? allUsers : allUsers.filter((u) => scope.allowedRepIds.has(u.id));

      relevantUsers.forEach((u) => {
        const userActivities = window.store.activities.getAllForUser(u.id) || {};
        Object.keys(userActivities).forEach((dateStr) => {
          const dayData = userActivities[dateStr];
          ["am", "pm"].forEach((shift) => {
            const act = dayData[shift];
            if (act && Number(act.cost) > 0 && Array.isArray(act.doctors) && act.doctors.length > 0) {
              const perDoctorCost = Number(act.cost) / act.doctors.length;
              const catName = determineCategoryName(act.activityType || act.type || "Event");
              act.doctors.forEach((docRef) => {
                const docId = typeof docRef === "object" ? docRef.id : docRef;
                const docName = typeof docRef === "object" ? docRef.name : "";

                if (!scope.isAdmin && !scope.allowedDoctorIds.has(docId)) {
                  return;
                }

                transactions.push({
                  id: `act_${u.id}_${dateStr}_${shift}_${docId}`,
                  source: "activity",
                  date: dateStr,
                  targetId: docId,
                  targetName: docName,
                  targetType: "doctor",
                  category: catName,
                  title: act.notes || act.title || catName,
                  cost: perDoctorCost,
                  repId: u.id,
                  lineId: act.lineId || u.lineId || null,
                  areaId: act.areaId || u.areaId || null,
                  notes: act.notes || "",
                  status: "approved",
                });
              });
            }
          });
        });
      });
    }

    return transactions;
  }

  /**
   * Normalizes category names into standardized headers
   */
  function determineCategoryName(raw) {
    if (!raw) return "Other Requests";
    const str = String(raw).trim();
    const lower = str.toLowerCase();

    // Check exact canonical matches first
    if (str === "Medical Conference" || lower.includes("conference") || lower.includes("congress") || lower.includes("symposium")) {
      return "Medical Conference";
    }
    if (str === "Round Table Discussion" || lower.includes("round table") || lower.includes("rtd")) {
      return "Round Table Discussion";
    }
    if (str === "Group Meeting" || lower.includes("group meeting") || lower.includes("meeting")) {
      return "Group Meeting";
    }
    if (str === "Local Event" || lower.includes("local event") || lower.includes("event") || lower.includes("seminar")) {
      return "Local Event";
    }
    if (str === "Clinical Workshop" || lower.includes("training") || lower.includes("workshop")) {
      return "Clinical Workshop";
    }
    if (str === "Clinic Equipment" || lower.includes("equipment") || lower.includes("device") || lower.includes("supplies")) {
      return "Clinic Equipment";
    }
    if (str === "Patient Materials" || lower.includes("flyer") || lower.includes("booklet") || lower.includes("print") || lower.includes("brochure") || lower.includes("patient")) {
      return "Patient Materials";
    }
    if (str === "Audio-visual (AV)" || lower.includes("av") || lower.includes("webinar") || lower.includes("audio-visual")) {
      return "Audio-visual (AV)";
    }
    if (str === "Scientific Subscriptions" || lower.includes("subscription") || lower.includes("journal")) {
      return "Scientific Subscriptions";
    }
    if (str === "Other Requests" || str === "Requests" || lower.includes("request") || lower.includes("other") || lower.includes("sample")) {
      return "Other Requests";
    }

    return str.length > 25 ? str.substring(0, 22) + "..." : str;
  }

  /**
   * Main builder: aggregates transactions per doctor/account and builds the matrix
   */
  function renderAccountsCostingReport() {
    const user = getCurrentUser();
    const scope = resolveUserCostingScope(user);

    const fromVal = document.getElementById("accountsCostingDateFrom")?.value;
    const toVal = document.getElementById("accountsCostingDateTo")?.value;
    const lineVal = document.getElementById("accountsCostingLineSelect")?.value;
    const dmVal = document.getElementById("accountsCostingDmSelect")?.value;
    const repVal = document.getElementById("accountsCostingRepSelect")?.value;
    const areaVal = document.getElementById("accountsCostingAreaSelect")?.value;
    const classVal = document.getElementById("accountsCostingClassSelect")?.value;
    const specVal = document.getElementById("accountsCostingSpecialtySelect")?.value;
    const onlyWithExpenses = document.getElementById("accountsCostingOnlyWithExpenses")?.checked;

    // Get all master doctors & hospitals
    const allDoctors = (window.store && window.store.doctors && window.store.doctors.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
    const allAreas = (window.store && window.store.areas && window.store.areas.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const allLines = (window.store && window.store.productLines && window.store.productLines.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];

    const areaMap = {};
    allAreas.forEach((a) => { areaMap[a.id] = a.name; });

    const lineMap = {};
    allLines.forEach((l) => { lineMap[l.id] = l.name; });

    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u.name || u.username; });

    // Determine DM filtered subordinates if DM filter is applied
    let allowedDmRepIds = null;
    if (dmVal && dmVal !== "all" && !scope.isDM && !scope.isRep) {
      const dmSubUsers = allUsers.filter((u) => u.dmId === dmVal || u.managerId === dmVal || u.id === dmVal);
      allowedDmRepIds = new Set(dmSubUsers.map((u) => u.id));
    }

    // Fetch and filter raw transactions strictly within role scope
    const rawTransactions = fetchRawCostingTransactions(scope);
    const filteredTransactions = rawTransactions.filter((tx) => {
      if (fromVal && tx.date && tx.date < fromVal) return false;
      if (toVal && tx.date && tx.date > toVal) return false;
      if (lineVal && lineVal !== "all" && tx.lineId && tx.lineId !== lineVal) return false;
      if (repVal && repVal !== "all" && tx.repId && tx.repId !== repVal) return false;
      if (allowedDmRepIds && tx.repId && !allowedDmRepIds.has(tx.repId)) return false;
      if (areaVal && areaVal !== "all" && tx.areaId && tx.areaId !== areaVal) return false;
      return true;
    });

    // Filter master doctors strictly by user's role scope first, plus any accounts with approved transactions in scope
    let scopedDoctors = allDoctors;
    if (!scope.isAdmin) {
      const txDocIds = new Set(filteredTransactions.map((tx) => String(tx.targetId)).filter(Boolean));
      scopedDoctors = allDoctors.filter((doc) => scope.allowedDoctorIds.has(doc.id) || txDocIds.has(String(doc.id)));
    }

    // Ensure any active transaction target not yet registered in master doctors is synthesized
    const knownDocIds = new Set(scopedDoctors.map((d) => String(d.id)));
    filteredTransactions.forEach((tx) => {
      const tId = String(tx.targetId || "").trim();
      if (tId && !knownDocIds.has(tId)) {
        knownDocIds.add(tId);
        scopedDoctors.push({
          id: tId,
          name: tx.targetName || `Account #${tId}`,
          clinicName: `Account - ${tx.targetName || tId}`,
          class: "A",
          specialty: "General",
          lineId: tx.lineId || "",
          areaId: tx.areaId || "",
          repId: tx.repId || "",
        });
      }
    });

    // Detect dynamic categories found in transactions
    const detectedCategories = new Set();
    filteredTransactions.forEach((tx) => {
      if (tx.category) detectedCategories.add(tx.category);
    });

    // Ensure standard baseline categories exist matching the Request Services dropdown
    const defaultBaseline = [
      "Medical Conference",
      "Round Table Discussion",
      "Group Meeting",
      "Local Event",
      "Clinical Workshop",
      "Clinic Equipment",
      "Patient Materials",
      "Audio-visual (AV)",
      "Scientific Subscriptions",
      "Other Requests",
    ];

    defaultBaseline.forEach((cat) => detectedCategories.add(cat));
    const dynamicCategoryList = Array.from(detectedCategories);
    CostingState.dynamicCategories = dynamicCategoryList;

    // Group transactions by target (Doctor ID or Name)
    const txByTarget = {};
    filteredTransactions.forEach((tx) => {
      const key = String(tx.targetId || tx.targetName || "unknown").trim();
      if (!txByTarget[key]) txByTarget[key] = [];
      txByTarget[key].push(tx);
    });

    // Build Account Rows from Scoped Doctors
    let accountRows = scopedDoctors.map((doc) => {
      const docAreaName = doc.area || areaMap[doc.areaId] || "Unassigned";
      const docLineName = lineMap[doc.lineId] || "All Lines";
      const docRepName = userMap[doc.repId] || "-";

      const matchedTx = txByTarget[String(doc.id)] || txByTarget[String(doc.name).trim()] || [];

      // Calculate totals per dynamic category
      const categoryTotals = {};
      dynamicCategoryList.forEach((cat) => { categoryTotals[cat] = 0; });

      let grandTotal = 0;
      matchedTx.forEach((tx) => {
        const cat = determineCategoryName(tx.category || tx.title) || "Other Requests";
        if (categoryTotals[cat] === undefined) categoryTotals[cat] = 0;
        categoryTotals[cat] += tx.cost;
        grandTotal += tx.cost;
      });

      return {
        id: doc.id,
        targetType: "doctor",
        doctorName: doc.name || "Doctor",
        clinicName: doc.clinicName || doc.workplace || `Clinic - ${doc.name}`,
        classification: doc.class || doc.classification || "A",
        specialty: doc.specialty || "General",
        areaId: doc.areaId || "",
        areaName: docAreaName,
        lineId: doc.lineId || "",
        lineName: docLineName,
        repId: doc.repId || "",
        repName: docRepName,
        categoryTotals: categoryTotals,
        grandTotal: grandTotal,
        transactions: matchedTx,
      };
    });

    // Apply Filter Bar conditions on accounts
    if (lineVal && lineVal !== "all") {
      accountRows = accountRows.filter((r) =>
        (!r.lineId || r.lineId === lineVal) ||
        (r.transactions && r.transactions.some((t) => t.lineId === lineVal))
      );
    }
    if (areaVal && areaVal !== "all") {
      accountRows = accountRows.filter((r) =>
        r.areaId === areaVal ||
        (r.transactions && r.transactions.some((t) => t.areaId === areaVal))
      );
    }
    if (repVal && repVal !== "all") {
      accountRows = accountRows.filter((r) =>
        r.repId === repVal ||
        (r.transactions && r.transactions.some((t) => t.repId === repVal))
      );
    }
    if (dmVal && dmVal !== "all" && !scope.isDM && !scope.isRep) {
      const dmSubUsers = allUsers.filter((u) => u.dmId === dmVal || u.managerId === dmVal);
      const dmRepIds = new Set(dmSubUsers.map((u) => u.id));
      accountRows = accountRows.filter((r) =>
        dmRepIds.has(r.repId) ||
        (r.transactions && r.transactions.some((t) => dmRepIds.has(t.repId)))
      );
    }
    if (classVal && classVal !== "all") {
      accountRows = accountRows.filter((r) => String(r.classification).toUpperCase() === classVal.toUpperCase());
    }
    if (specVal && specVal !== "all") {
      accountRows = accountRows.filter((r) => r.specialty === specVal);
    }
    if (onlyWithExpenses) {
      accountRows = accountRows.filter((r) => r.grandTotal > 0);
    }

    // Save in state
    CostingState.currentRows = accountRows;

    // Filter by search & render table
    filterAndDisplayCostingRows();
  }

  /**
   * Filters by instant search input and renders <thead>, <tbody>, and <tfoot>
   */
  function filterAndDisplayCostingRows() {
    let rows = CostingState.currentRows;
    const term = CostingState.searchTerm;

    if (term) {
      rows = rows.filter((r) =>
        r.doctorName.toLowerCase().includes(term) ||
        r.clinicName.toLowerCase().includes(term) ||
        r.areaName.toLowerCase().includes(term) ||
        r.specialty.toLowerCase().includes(term)
      );
    }

    renderCostingTableHeader(CostingState.dynamicCategories);
    renderCostingTableBody(rows, CostingState.dynamicCategories);
    renderCostingTableFooter(rows, CostingState.dynamicCategories);
  }

  /**
   * Renders the dynamic <thead>
   */
  function renderCostingTableHeader(categories) {
    const thead = document.getElementById("accountsCostingThead");
    if (!thead) return;

    const dynamicColsHtml = categories
      .map((cat) => `<th class="costing-th-category">${window.escapeHtml(cat)}</th>`)
      .join("");

    thead.innerHTML = `
      <tr>
        <th style="width: 45px; text-align: center;">#</th>
        <th style="min-width: 170px;">Clinics / Account Name</th>
        <th style="min-width: 170px;">Doctor Name</th>
        <th style="width: 70px; text-align: center;">Class</th>
        <th style="min-width: 120px;">Specialty</th>
        <th style="min-width: 120px;">Territory / Area</th>
        ${dynamicColsHtml}
        <th class="costing-th-total">Total (EGP)</th>
        <th style="width: 80px; text-align: center;">Details</th>
      </tr>
    `;
  }

  /**
   * Renders the dynamic <tbody>
   */
  function renderCostingTableBody(rows, categories) {
    const tbody = document.getElementById("accountsCostingTbody");
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      const colSpan = 8 + categories.length;
      tbody.innerHTML = `
        <tr>
          <td colspan="${colSpan}" style="text-align: center; padding: 40px; color: var(--text-muted, #6c757d);">
            <div style="font-size: 2rem; margin-bottom: 8px;">💼</div>
            <div style="font-weight: 600; font-size: 1.05rem;">No Accounts Costing Data Found</div>
            <div style="font-size: 0.85rem; margin-top: 4px;">Try adjusting the date range or filters above.</div>
          </td>
        </tr>
      `;
      return;
    }

    const html = rows.map((row, idx) => {
      const dynamicCells = categories.map((cat) => {
        const val = row.categoryTotals[cat] || 0;
        if (val > 0) {
          return `<td class="costing-cell-amount">${formatEGP(val)}</td>`;
        }
        return `<td class="costing-cell-zero">0</td>`;
      }).join("");

      const classBadge = `<span class="badge" style="background: rgba(148, 163, 184, 0.2); color: inherit; font-weight: 700; padding: 3px 8px; border-radius: 4px;">${window.escapeHtml(row.classification)}</span>`;
      const specBadge = `<span style="color: #10b981; font-weight: 600;">${window.escapeHtml(row.specialty)}</span>`;
      const totalCell = row.grandTotal > 0
        ? `<strong class="costing-cell-total">${formatEGP(row.grandTotal)}</strong>`
        : `<span class="costing-cell-zero">0</span>`;

      return `
        <tr style="transition: background 0.15s ease;">
          <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">${idx + 1}</td>
          <td>
            <div class="costing-clinic-name">${window.escapeHtml(row.clinicName)}</div>
          </td>
          <td>
            <a href="javascript:void(0)" onclick="openAccountsCostingBreakdown('${row.id}')" class="costing-doctor-link" title="View breakdown ledger">
              ${window.escapeHtml(row.doctorName)}
            </a>
          </td>
          <td style="text-align: center;">${classBadge}</td>
          <td>${specBadge}</td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">${window.escapeHtml(row.areaName)}</td>
          ${dynamicCells}
          <td>${totalCell}</td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-sm btn-outline" onclick="openAccountsCostingBreakdown('${row.id}')" style="padding: 3px 8px; font-size: 0.78rem;" title="View Transactions">
              🔍 Details
            </button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.innerHTML = html;
  }

  /**
   * Renders the dynamic <tfoot> summary totals row
   */
  function renderCostingTableFooter(rows, categories) {
    const tfoot = document.getElementById("accountsCostingTfoot");
    if (!tfoot) return;

    if (!rows || rows.length === 0) {
      tfoot.innerHTML = "";
      return;
    }

    // Compute sums per dynamic category
    const categorySums = {};
    categories.forEach((cat) => { categorySums[cat] = 0; });

    let grandOverall = 0;
    rows.forEach((r) => {
      categories.forEach((cat) => {
        categorySums[cat] += (r.categoryTotals[cat] || 0);
      });
      grandOverall += (r.grandTotal || 0);
    });

    const dynamicFooterCells = categories.map((cat) => {
      const sumVal = categorySums[cat];
      return `<th class="costing-tfoot-category">${formatEGP(sumVal)}</th>`;
    }).join("");

    tfoot.innerHTML = `
      <tr class="costing-tfoot-row">
        <th colspan="6" style="text-align: right; font-size: 0.95rem;">
          Total Summary (${rows.length} Accounts):
        </th>
        ${dynamicFooterCells}
        <th class="costing-tfoot-total">
          ${formatEGP(grandOverall)}
        </th>
        <th></th>
      </tr>
    `;
  }

  /**
   * Opens Breakdown Modal for selected doctor
   */
  function openAccountsCostingBreakdown(doctorId) {
    const row = CostingState.currentRows.find((r) => String(r.id) === String(doctorId));
    if (!row) return;

    CostingState.selectedDoctorForBreakdown = row;

    const modal = document.getElementById("accountsCostingBreakdownModal");
    const nameEl = document.getElementById("modalCostingAccountName");
    const subEl = document.getElementById("modalCostingAccountSub");
    const countEl = document.getElementById("modalCostingCountText");
    const totalEl = document.getElementById("modalCostingTotalText");
    const tbody = document.getElementById("modalCostingTbody");

    if (nameEl) nameEl.textContent = row.doctorName;
    if (subEl) subEl.textContent = `${row.clinicName} • Class ${row.classification} • ${row.specialty} • ${row.areaName}`;
    if (countEl) countEl.textContent = `Total Transactions: ${row.transactions.length}`;
    if (totalEl) totalEl.textContent = `Total Invested: ${formatEGP(row.grandTotal)} EGP`;

    if (tbody) {
      if (row.transactions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
              No transactions recorded for this account in the selected period.
            </td>
          </tr>
        `;
      } else {
        const users = (window.store && window.store.users && window.store.users.getAll()) || [];
        const uMap = {};
        users.forEach((u) => { uMap[u.id] = u.name || u.username; });

        tbody.innerHTML = row.transactions.map((tx, idx) => {
          const repName = uMap[tx.repId] || tx.repId || "-";
          return `
            <tr>
              <td style="text-align: center; font-size: 0.8rem; color: var(--text-muted);">${idx + 1}</td>
              <td>${window.escapeHtml(tx.date || "-")}</td>
              <td><span class="badge" style="background: #e7f1ff; color: #0c63e4;">${window.escapeHtml(tx.category)}</span></td>
              <td>
                <div style="font-weight: 600;">${window.escapeHtml(tx.title)}</div>
                ${tx.notes ? `<small class="text-muted">${window.escapeHtml(tx.notes)}</small>` : ""}
              </td>
              <td style="text-align: right; font-weight: 700; color: #004085;">${formatEGP(tx.cost)}</td>
              <td>${window.escapeHtml(repName)}</td>
              <td style="text-align: center;"><span class="badge" style="background: #d4edda; color: #155724;">Approved</span></td>
            </tr>
          `;
        }).join("");
      }
    }

    if (modal) modal.style.display = "flex";
  }

  function closeAccountsCostingBreakdownModal() {
    const modal = document.getElementById("accountsCostingBreakdownModal");
    if (modal) modal.style.display = "none";
  }

  /**
   * Exports full dynamic matrix to Excel (.xlsx) using SheetJS
   */
  function exportAccountsCostingToExcel() {
    if (typeof window.XLSX === "undefined") {
      if (typeof window.showToast === "function") {
        window.showToast("Excel export library is loading. Please try again in a moment.", "warning");
      }
      return;
    }

    const rows = CostingState.currentRows;
    const categories = CostingState.dynamicCategories;

    if (!rows || rows.length === 0) {
      if (typeof window.showToast === "function") {
        window.showToast("No data to export.", "info");
      }
      return;
    }

    // Build headers
    const headers = [
      "#",
      "Clinic / Account Name",
      "Doctor Name",
      "Class",
      "Specialty",
      "Territory / Area",
      ...categories,
      "Total Cost (EGP)",
    ];

    const data = [headers];

    // Data rows
    rows.forEach((r, idx) => {
      const rowArr = [
        idx + 1,
        r.clinicName,
        r.doctorName,
        r.classification,
        r.specialty,
        r.areaName,
      ];
      categories.forEach((cat) => {
        rowArr.push(r.categoryTotals[cat] || 0);
      });
      rowArr.push(r.grandTotal || 0);
      data.push(rowArr);
    });

    // Summary totals row
    const totalsRow = ["TOTAL", "", "", "", "", "Summary"];
    let grandOverall = 0;
    categories.forEach((cat) => {
      let sum = 0;
      rows.forEach((r) => { sum += (r.categoryTotals[cat] || 0); });
      totalsRow.push(sum);
      grandOverall += sum;
    });
    totalsRow.push(grandOverall);
    data.push(totalsRow);

    // Create Sheet and Workbook
    const ws = window.XLSX.utils.aoa_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Accounts_Costing");

    const fromVal = document.getElementById("accountsCostingDateFrom")?.value || "All";
    const toVal = document.getElementById("accountsCostingDateTo")?.value || "All";
    const fileName = `Accounts_Costing_Report_${fromVal}_to_${toVal}.xlsx`;

    window.XLSX.writeFile(wb, fileName);
  }

  // Expose global methods
  window.initAccountsCostingTab = initAccountsCostingTab;
  window.renderAccountsCostingReport = renderAccountsCostingReport;
  window.setAccountsCostingPeriodPreset = setAccountsCostingPeriodPreset;
  window.onAccountsCostingLineChange = onAccountsCostingLineChange;
  window.onAccountsCostingDmChange = onAccountsCostingDmChange;
  window.onAccountsCostingRepChange = onAccountsCostingRepChange;
  window.onAccountsCostingSearchInput = onAccountsCostingSearchInput;
  window.resetAccountsCostingFilters = resetAccountsCostingFilters;
  window.openAccountsCostingBreakdown = openAccountsCostingBreakdown;
  window.closeAccountsCostingBreakdownModal = closeAccountsCostingBreakdownModal;
  window.exportAccountsCostingToExcel = exportAccountsCostingToExcel;
  window.CostingState = CostingState;

})(window);
