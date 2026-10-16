/**
 * @file gps-tracing-report.js
 * @description GPS Route & Employee Tracing Report Module.
 * Mirrors PulpoPharma's employee GPS tracking and daily itinerary route.
 * Strictly scoped by role hierarchy and visible only when requireGpsValidation is enabled.
 */

(function () {
  "use strict";

  // ============================================================================
  // Translations for GPS Tracing Module
  // ============================================================================
  const gpsTranslations = {
    en: {
      tabGpsTracing: "GPS Route & Employee Tracing",
      gpsTracingTitle: "🛰️ GPS Route & Employee Tracing",
      gpsTracingSubtitle: "Chronological daily field visit path, device geofence coordinates, location accuracy, and transit itinerary.",
      labelGpsDate: "Visit Date:",
      labelGpsShift: "Shift / Period:",
      shiftAll: "All Shifts (AM & PM)",
      shiftAM: "AM (Hospitals & Morning)",
      shiftPM: "PM (Doctors & Evening)",
      labelGpsStatusFilter: "GPS Verification:",
      allGpsStatuses: "All Verification Statuses",
      gpsStatusVerified: "✅ In Geofence (< Max Radius)",
      gpsStatusOutRange: "⚠️ Out of Geofence (> Max Radius)",
      gpsStatusNoTarget: "📍 No Target Coords",
      gpsStatusDenied: "🚫 GPS Disabled / Denied",
      btnOpenFullRouteMap: "🗺️ Open Daily Route in Google Maps",
      btnShowGpsReport: "Show Tracing",
      promptGpsTitle: "Click Show to View GPS Route & Tracing",
      promptGpsDesc: "Select date, representative, and shift filter to inspect chronological GPS field trajectory and geofence audit.",
      kpiGpsTotalVisits: "Total Route Visits",
      kpiGpsVerified: "Geofence Verified",
      kpiGpsOutRange: "Out of Bounds",
      kpiGpsDisabled: "GPS Disabled / Denied",
      colGpsOrder: "#",
      colGpsTime: "Visit Time",
      colGpsTarget: "Account / Doctor",
      colGpsTargetType: "Target Type",
      colGpsArea: "Territory / Area",
      colGpsRepCoords: "Device Captured GPS",
      colGpsTargetCoords: "Account Baseline GPS",
      colGpsDistance: "Geofence Deviation",
      colGpsStatus: "Audit Status",
      colGpsAction: "Map View",
      viewOnMapBtn: "View on Map",
      openFullRouteWarning: "No valid GPS coordinates captured for this itinerary to build a map route.",
      noGpsEventsFound: "No visits recorded for the selected employee, date, and shift.",
      noGpsEventsDesc: "Try choosing another date or select another team member.",
      noTargetCoordsText: "No registered coords",
      deviceCapturedText: "Captured",
      deviationExact: "Inside Clinic",
      badgeVerified: "Verified",
      badgeOutOfRange: "Out of Range",
      badgeNoCoords: "No Target Coords",
      badgeDenied: "Disabled by Rep",
      gpsTrackingPeriodPill: "🛰️ Daily Field Route & Geofencing Audit"
    }
  };

  // Merge translations
  if (window.translations && window.translations.en) {
    Object.assign(window.translations.en, gpsTranslations.en);
  }

  // ============================================================================
  // GPS Tracing Tab Visibility & Governance Controller
  // ============================================================================
  window.checkGpsTracingVisibility = function () {
    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};

    const isGpsEnforced = Boolean(
      companySettings.enforceGpsVerification ||
      companySettings.requireGpsValidation
    );

    const tabBtn = document.getElementById("tabBtn-gps-tracing");
    const tabPanel = document.getElementById("tabPanel-gps-tracing");

    if (tabBtn) {
      tabBtn.style.display = isGpsEnforced ? "inline-flex" : "none";
    }

    // If disabled and currently active, switch back to sales tab
    if (!isGpsEnforced && tabPanel && tabPanel.classList.contains("active")) {
      if (typeof window.switchReportTab === "function") {
        window.switchReportTab("sales");
      }
    }

    return isGpsEnforced;
  };

  // ============================================================================
  // Preset Buttons Helper
  // ============================================================================
  window.setGpsDatePreset = function (preset) {
    const dateInput = document.getElementById("gpsTracingDate");
    if (!dateInput) return;
    const now = (window.getSystemDate && window.getSystemDate()) || new Date();

    if (preset === "today") {
      dateInput.value = formatDateForInput(now);
    } else if (preset === "yesterday") {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateInput.value = formatDateForInput(y);
    }

    const resultsContainer = document.getElementById("gpsTracingResultsContainer");
    if (resultsContainer && resultsContainer.style.display !== "none") {
      window.renderGpsTracingReport();
    }
  };

  function formatDateForInput(d) {
    if (window.formatDate) return window.formatDate(d);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ============================================================================
  // Hierarchy Dropdowns for GPS Tracing
  // ============================================================================
  window.initGpsTracingTab = function () {
    if (!window.checkGpsTracingVisibility()) return;

    const dateInput = document.getElementById("gpsTracingDate");
    if (dateInput && !dateInput.value) {
      const now = (window.getSystemDate && window.getSystemDate()) || new Date();
      dateInput.value = formatDateForInput(now);
    }

    window.populateGpsTracingFilters();
  };

  window.populateGpsTracingFilters = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isDM = role === "district_manager" || role === "dm";
    const isLM = role === "line_manager" || role === "lm";
    const isBU = role === "business_unit" || role === "bu";
    const lang = "en";

    const lineSelect = document.getElementById("gpsLineSelect");
    const dmSelect = document.getElementById("gpsDmSelect");
    const repSelect = document.getElementById("gpsRepSelect");

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);

    // 1. Line Filter
    if (lineSelect) {
      lineSelect.replaceChildren();
      const userLines = window.getUserLines ? window.getUserLines(user.id) : [];

      if (isRep) {
        if (userLines.length > 0) {
          const opt = document.createElement("option");
          opt.value = userLines[0].id;
          opt.textContent = `📦 ${userLines[0].name || userLines[0].nameAr}`;
          lineSelect.appendChild(opt);
          lineSelect.value = userLines[0].id;
        } else {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "No Line Assigned";
          lineSelect.appendChild(opt);
        }
        lineSelect.disabled = true;
      } else if (isDM || isLM || isBU) {
        if (userLines.length > 1) {
          const optAll = document.createElement("option");
          optAll.value = "all";
          optAll.textContent = "🌐 All My Lines";
          lineSelect.appendChild(optAll);
        }
        userLines.forEach((l) => {
          const opt = document.createElement("option");
          opt.value = l.id;
          opt.textContent = `📦 ${l.name || l.nameAr}`;
          lineSelect.appendChild(opt);
        });
        lineSelect.disabled = userLines.length <= 1;
        lineSelect.value = userLines[0]?.id || "all";
      } else {
        // Admin / BU / HR
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "🌐 All Product Lines";
        lineSelect.appendChild(optAll);

        allLines.forEach((l) => {
          const opt = document.createElement("option");
          opt.value = l.id;
          opt.textContent = `📦 ${l.name || l.nameAr}`;
          lineSelect.appendChild(opt);
        });
        lineSelect.disabled = false;
        lineSelect.value = "all";
      }
    }

    // Populate Cascading DMs & Reps
    window.onGpsLineChange();
  };

  window.onGpsLineChange = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const isDM = role === "district_manager" || role === "dm";
    const lang = "en";

    const lineSelect = document.getElementById("gpsLineSelect");
    const dmSelect = document.getElementById("gpsDmSelect");
    const selectedLineId = lineSelect ? lineSelect.value : "all";

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    if (dmSelect) {
      dmSelect.replaceChildren();

      if (isRep) {
        const myDm = allUsers.find((u) => u.id === user.managerId);
        const opt = document.createElement("option");
        opt.value = myDm ? myDm.id : "";
        opt.textContent = myDm ? `💼 ${myDm.name}` : "District Manager";
        dmSelect.appendChild(opt);
        dmSelect.disabled = true;
      } else if (isDM) {
        const opt = document.createElement("option");
        opt.value = user.id;
        opt.textContent = `💼 ${user.name} (My Team)`;
        dmSelect.appendChild(opt);
        dmSelect.disabled = true;
      } else {
        // Line Manager / Admin / BU
        let eligibleDMs = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
          return r === "district_manager" || r === "dm";
        });

        if (role === "line_manager" || role === "lm") {
          eligibleDMs = eligibleDMs.filter((dm) => dm.managerId === user.id);
        } else if (role === "business_unit" || role === "bu") {
          const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
          const subIds = new Set(subs.map((s) => s.id));
          eligibleDMs = eligibleDMs.filter((dm) => subIds.has(dm.id));
        }

        if (selectedLineId !== "all") {
          eligibleDMs = eligibleDMs.filter((dm) => {
            const lines = window.getUserLines ? window.getUserLines(dm.id) : [];
            return lines.some((l) => l.id === selectedLineId);
          });
        }

        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "All District Managers";
        dmSelect.appendChild(optAll);

        eligibleDMs.forEach((dm) => {
          const opt = document.createElement("option");
          opt.value = dm.id;
          opt.textContent = `💼 ${dm.name} (${dm.employeeCode || "DM"})`;
          dmSelect.appendChild(opt);
        });
        dmSelect.disabled = false;
        dmSelect.value = "all";
      }
    }

    window.onGpsDmChange();
  };

  window.onGpsDmChange = function () {
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";
    const lang = "en";

    const lineSelect = document.getElementById("gpsLineSelect");
    const dmSelect = document.getElementById("gpsDmSelect");
    const repSelect = document.getElementById("gpsRepSelect");

    const selectedLineId = lineSelect ? lineSelect.value : "all";
    const selectedDmId = dmSelect ? dmSelect.value : "all";

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    if (repSelect) {
      repSelect.replaceChildren();

      if (isRep) {
        const opt = document.createElement("option");
        opt.value = user.id;
        opt.textContent = `🩺 ${user.name} (${user.employeeCode || "Rep"})`;
        repSelect.appendChild(opt);
        repSelect.disabled = true;
      } else {
        let eligibleReps = allUsers.filter((u) => {
          const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || "").toLowerCase();
          return r === "medical_rep" || r === "rep";
        });

        if (role === "district_manager" || role === "dm") {
          eligibleReps = eligibleReps.filter((r) => r.managerId === user.id);
        } else if (role === "line_manager" || role === "lm") {
          const myDMs = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
          eligibleReps = eligibleReps.filter((r) => myDMs.includes(r.managerId));
        } else if (role === "business_unit" || role === "bu") {
          const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
          const subIds = new Set(subs.map((s) => s.id));
          eligibleReps = eligibleReps.filter((r) => subIds.has(r.id));
        }

        if (selectedDmId !== "all") {
          eligibleReps = eligibleReps.filter((r) => r.managerId === selectedDmId);
        }

        if (selectedLineId !== "all") {
          eligibleReps = eligibleReps.filter((r) => {
            const lines = window.getUserLines ? window.getUserLines(r.id) : [];
            return lines.some((l) => l.id === selectedLineId);
          });
        }

        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.textContent = "All Reps In Scope";
        repSelect.appendChild(optAll);

        eligibleReps.forEach((r) => {
          const opt = document.createElement("option");
          opt.value = r.id;
          opt.textContent = `🩺 ${r.name} (${r.employeeCode || "Rep"})`;
          repSelect.appendChild(opt);
        });
        repSelect.disabled = false;
        repSelect.value = eligibleReps.length > 0 ? eligibleReps[0].id : "all";
      }
    }

    if (typeof window.onGpsFilterChange === "function") {
      window.onGpsFilterChange();
    }
  };

  window.onGpsFilterChange = function () {
    const resultsContainer = document.getElementById("gpsTracingResultsContainer");
    if (resultsContainer && resultsContainer.style.display !== "none" && typeof window.renderGpsTracingReport === "function") {
      window.renderGpsTracingReport();
    }
  };

  // Keep reference of current filtered rows for full route mapping
  let currentFilteredGpsVisits = [];

  // ============================================================================
  // Core Calculation & Render Engine
  // ============================================================================
  window.renderGpsTracingReport = function () {
    const promptContainer = document.getElementById("gpsTracingPromptContainer");
    const resultsContainer = document.getElementById("gpsTracingResultsContainer");
    const tbody = document.getElementById("gpsTracingReportTbody");

    if (promptContainer) promptContainer.style.display = "none";
    if (resultsContainer) resultsContainer.style.display = "block";
    if (tbody) tbody.replaceChildren();

    if (typeof window.syncReportsData === "function") {
      window.syncReportsData();
    }

    const lang = "en";
    const user = (typeof checkAuth === "function" ? checkAuth() : null) || { role: "admin", id: "u1790626000010" };
    const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
    const isRep = role === "medical_rep" || role === "rep";

    const dateInput = document.getElementById("gpsTracingDate");
    const shiftSelect = document.getElementById("gpsShiftSelect");
    const gpsStatusSelect = document.getElementById("gpsStatusFilterSelect");
    const lineSelect = document.getElementById("gpsLineSelect");
    const dmSelect = document.getElementById("gpsDmSelect");
    const repSelect = document.getElementById("gpsRepSelect");

    const targetDate = dateInput ? dateInput.value : "";
    const selectedShift = shiftSelect ? shiftSelect.value : "all";
    const selectedGpsFilter = gpsStatusSelect ? gpsStatusSelect.value : "all";
    const selectedLine = lineSelect ? lineSelect.value : "all";
    const selectedDm = dmSelect ? dmSelect.value : "all";
    const selectedRep = repSelect ? repSelect.value : (isRep ? user.id : "all");

    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
    const allDoctors = (window.store && window.store.doctors ? window.store.doctors.getAll() : (window.DEMO_DATA && window.DEMO_DATA.doctors) || []);
    const allHospitals = (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
    const allPharmacies = (window.store && window.store.pharmacies ? window.store.pharmacies.getAll() : (window.DEMO_DATA && window.DEMO_DATA.pharmacies) || []);

    const companySettings = (window.store && window.store.companySettings)
      ? window.store.companySettings.get()
      : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };
    const maxRadius = companySettings.gpsMaxDistanceMeters || 200;

    // Retrieve all completed or actual visits for target date (excluding pharmacies: pharmacies have NO GPS requirement)
    const allVisits = (window.store && window.store.visits ? window.store.visits.getAll() : (window.DEMO_DATA && window.DEMO_DATA.visits) || []);
    
    let visits = allVisits.filter((v) => {
      const isCompleted = v.status === "completed" || Boolean(v.isActual) || v.source === "actual";
      if (!isCompleted) return false;
      // Pharmacies are strictly excluded from GPS tracing & audits
      if (v.targetType === "pharmacy" || v.period === "pharmacy" || (v.doctorId && String(v.doctorId).startsWith("pharm"))) {
        return false;
      }
      return v.date === targetDate;
    });

    // 1. Filter by Role & Hierarchy
    if (isRep) {
      visits = visits.filter((v) => v.repId === user.id);
    } else if (selectedRep !== "all") {
      visits = visits.filter((v) => v.repId === selectedRep);
    } else if (role !== "admin" && role !== "hr") {
      const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      const subIds = new Set([user.id, ...subs.map((s) => s.id)]);
      visits = visits.filter((v) => subIds.has(v.repId));
    }

    if (selectedDm !== "all" && selectedRep === "all") {
      const dmSubs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(selectedDm) : [];
      const dmRepIds = new Set([
        selectedDm,
        ...dmSubs.map((s) => s.id),
        ...allUsers.filter((u) => u.managerId === selectedDm).map((u) => u.id)
      ]);
      visits = visits.filter((v) => dmRepIds.has(v.repId));
    }

    if (selectedLine !== "all") {
      visits = visits.filter((v) => {
        if (v.lineId) return v.lineId === selectedLine;
        const repLines = window.getUserLines ? window.getUserLines(v.repId) : [];
        return repLines.some((l) => l.id === selectedLine);
      });
    }
    // 2. Filter by Shift (AM / PM)
    if (selectedShift === "am") {
      visits = visits.filter((v) => {
        const p = (v.period || "").toLowerCase();
        return p === "am" || v.targetType === "hospital";
      });
    } else if (selectedShift === "pm") {
      visits = visits.filter((v) => {
        const p = (v.period || "").toLowerCase();
        return p === "pm" || (!p && v.targetType !== "hospital");
      });
    }

    // Enrich each visit with account coordinates and geofence distance if not stored
    visits.forEach((v) => {
      // Find matching target account
      const doc = allDoctors.find((d) => d.id === v.doctorId || d.name === v.doctorName);
      const hosp = allHospitals.find((h) => h.id === v.doctorId || h.name === v.doctorName);
      const pharm = allPharmacies.find((p) => p.id === v.doctorId || p.name === v.doctorName);
      const targetObj = doc || hosp || pharm;

      if (v.targetLat == null && targetObj && targetObj.lat != null) {
        v.targetLat = targetObj.lat;
        v.targetLng = targetObj.lng;
      }

      // If device coordinates exist but distance was not stored, calculate it
      if (v.distanceMeters == null && v.deviceLat != null && v.targetLat != null) {
        if (typeof window.calculateDistanceMeters === "function") {
          v.distanceMeters = window.calculateDistanceMeters(v.deviceLat, v.deviceLng, v.targetLat, v.targetLng);
        }
      }

      // Determine GPS Status if missing
      if (!v.gpsStatus) {
        if (v.deviceLat == null) {
          v.gpsStatus = "no_coords";
        } else if (v.targetLat == null) {
          v.gpsStatus = "no_target_coords";
        } else if (v.distanceMeters != null) {
          v.gpsStatus = v.distanceMeters <= maxRadius ? "in_range" : "out_of_range";
        } else {
          v.gpsStatus = "in_range";
        }
      }
    });

    // 3. Filter by GPS Status if specified
    if (selectedGpsFilter === "verified") {
      visits = visits.filter((v) => v.gpsStatus === "in_range");
    } else if (selectedGpsFilter === "out_of_range") {
      visits = visits.filter((v) => v.gpsStatus === "out_of_range");
    } else if (selectedGpsFilter === "no_target_coords") {
      visits = visits.filter((v) => v.gpsStatus === "no_target_coords");
    } else if (selectedGpsFilter === "permission_denied") {
      visits = visits.filter((v) => v.gpsStatus === "permission_denied");
    }

    // Sort Chronologically by Visit Time (Ascending) to build daily route
    visits.sort((a, b) => {
      const timeA = a.time || a.insertionTime || "00:00";
      const timeB = b.time || b.insertionTime || "00:00";
      return timeA.localeCompare(timeB);
    });

    currentFilteredGpsVisits = visits;

    // Update KPI Cards
    const totalCount = visits.length;
    const verifiedCount = visits.filter((v) => v.gpsStatus === "in_range").length;
    const outRangeCount = visits.filter((v) => v.gpsStatus === "out_of_range").length;
    const deniedCount = visits.filter((v) => v.gpsStatus === "permission_denied").length;

    const kpiTotalEl = document.getElementById("kpiGpsTotalVisits");
    const kpiVerifiedEl = document.getElementById("kpiGpsVerified");
    const kpiOutRangeEl = document.getElementById("kpiGpsOutRange");
    const kpiDeniedEl = document.getElementById("kpiGpsDisabled");

    if (kpiTotalEl) kpiTotalEl.textContent = totalCount;
    if (kpiVerifiedEl) kpiVerifiedEl.textContent = verifiedCount;
    if (kpiOutRangeEl) kpiOutRangeEl.textContent = outRangeCount;
    if (kpiDeniedEl) kpiDeniedEl.textContent = deniedCount;

    // Render Table Rows
    if (!tbody) return;

    if (visits.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 48px 16px; color: var(--gray-500);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">🛰️</div>
            <div style="font-weight: 700; font-size: 1.05rem; color: var(--gray-700);">
              ${gpsTranslations.en.noGpsEventsFound}
            </div>
            <div style="font-size: 0.85rem; margin-top: 4px;">
              ${gpsTranslations.en.noGpsEventsDesc}
            </div>
          </td>
        </tr>
      `;
      return;
    }

    visits.forEach((v, idx) => {
      const rep = allUsers.find((u) => u.id === v.repId);
      const repName = rep ? rep.name : (v.repName || "Medical Rep");

      const timeStr = v.time || v.insertionTime || "--:--";
      const targetName = v.doctorName || v.targetName || "Target Account";
      const targetType = v.targetType || (v.period === "am" ? "Hospital" : "Doctor");
      const area = v.area || (rep ? rep.area : "Territory");

      // Coordinates strings
      let repCoordsStr = "";
      if (v.deviceLat != null && v.deviceLng != null) {
        repCoordsStr = `<code class="gps-coord-code" title="${v.deviceLat}, ${v.deviceLng}">📍 ${Number(v.deviceLat).toFixed(4)}, ${Number(v.deviceLng).toFixed(4)}</code>`;
      } else if (v.gpsStatus === "permission_denied") {
        repCoordsStr = `<span class="badge badge-gps-denied">GPS Denied</span>`;
      } else {
        repCoordsStr = `<span class="text-muted small">--</span>`;
      }

      let targetCoordsStr = "";
      if (v.targetLat != null && v.targetLng != null) {
        targetCoordsStr = `<code class="gps-coord-code" title="${v.targetLat}, ${v.targetLng}">🏢 ${Number(v.targetLat).toFixed(4)}, ${Number(v.targetLng).toFixed(4)}</code>`;
      } else {
        targetCoordsStr = `<span class="text-muted small">Not set</span>`;
      }

      // Deviation & Status Badge
      let deviationStr = "--";
      let statusBadgeHtml = "";

      if (v.gpsStatus === "permission_denied") {
        statusBadgeHtml = `<span class="badge badge-gps-denied">🚫 GPS Disabled</span>`;
      } else if (v.gpsStatus === "no_target_coords") {
        statusBadgeHtml = `<span class="badge badge-gps-no-coords">📍 No Baseline</span>`;
      } else if (v.gpsStatus === "in_range") {
        const dist = v.distanceMeters != null ? Math.round(v.distanceMeters) : 0;
        deviationStr = `<span class="text-success fw-bold">${dist} m</span>`;
        statusBadgeHtml = `<span class="badge badge-gps-in-range">✅ Verified (<200m)</span>`;
      } else if (v.gpsStatus === "out_of_range") {
        const dist = v.distanceMeters != null ? Math.round(v.distanceMeters) : 0;
        deviationStr = `<span class="text-danger fw-bold">${dist} m</span>`;
        statusBadgeHtml = `<span class="badge badge-gps-out-of-range">⚠️ Out of Bounds</span>`;
      } else {
        statusBadgeHtml = `<span class="badge badge-secondary">--</span>`;
      }

      // Action link: single visit map direction
      let actionBtnHtml = "";
      if (v.deviceLat != null && v.deviceLng != null) {
        let singleMapUrl = "";
        if (v.targetLat != null && v.targetLng != null) {
          singleMapUrl = `https://www.google.com/maps/dir/?api=1&origin=${v.targetLat},${v.targetLng}&destination=${v.deviceLat},${v.deviceLng}`;
        } else {
          singleMapUrl = `https://www.google.com/maps/search/?api=1&query=${v.deviceLat},${v.deviceLng}`;
        }
        actionBtnHtml = `
          <a href="${singleMapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline gps-action-map-btn" title="View visit coordinates on Google Maps">
            🗺️ Map
          </a>
        `;
      } else if (v.targetLat != null && v.targetLng != null) {
        const singleMapUrl = `https://www.google.com/maps/search/?api=1&query=${v.targetLat},${v.targetLng}`;
        actionBtnHtml = `
          <a href="${singleMapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline gps-action-map-btn" title="View Target on Google Maps">
            🏢 Clinic
          </a>
        `;
      } else {
        actionBtnHtml = `<span class="text-muted small">--</span>`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align: center; font-weight: 700; color: var(--gray-600);">${idx + 1}</td>
        <td style="font-weight: 600; font-family: monospace;">⏰ ${timeStr}</td>
        <td>
          <div style="font-weight: 700; color: var(--gray-900);">${targetName}</div>
          <div class="text-muted small">👤 ${repName}</div>
        </td>
        <td style="text-align: center;"><span class="badge badge-soft-primary">${targetType}</span></td>
        <td>${area}</td>
        <td style="text-align: center;">${repCoordsStr}</td>
        <td style="text-align: center;">${targetCoordsStr}</td>
        <td style="text-align: center;">${deviationStr}</td>
        <td style="text-align: center;">${statusBadgeHtml}</td>
        <td style="text-align: center;">${actionBtnHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  // ============================================================================
  // Open Full Daily Route in Google Maps (Interactive Multi-Stop Itinerary)
  // ============================================================================
  window.openFullDailyGpsRouteMap = function () {
    const lang = "en";

    if (!currentFilteredGpsVisits || currentFilteredGpsVisits.length === 0) {
      if (typeof showToast === "function") {
        showToast(gpsTranslations.en.openFullRouteWarning, "warning");
      }
      return;
    }

    // Extract valid coordinate waypoints in chronological order
    const validWaypoints = [];
    currentFilteredGpsVisits.forEach((v) => {
      const lat = v.deviceLat != null ? v.deviceLat : v.targetLat;
      const lng = v.deviceLng != null ? v.deviceLng : v.targetLng;
      if (lat != null && lng != null) {
        validWaypoints.push(`${lat},${lng}`);
      }
    });

    if (validWaypoints.length === 0) {
      const warnMsg = gpsTranslations.en.openFullRouteWarning;
      if (typeof showToast === "function") {
        showToast(warnMsg, "warning");
      }
      return;
    }

    // If only 1 point, open search map
    if (validWaypoints.length === 1) {
      const singleUrl = `https://www.google.com/maps/search/?api=1&query=${validWaypoints[0]}`;
      window.open(singleUrl, "_blank");
      return;
    }

    // Multi-stop directions
    const origin = validWaypoints[0];
    const destination = validWaypoints[validWaypoints.length - 1];
    let routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;

    if (validWaypoints.length > 2) {
      const stops = validWaypoints.slice(1, validWaypoints.length - 1);
      // Google Maps supports up to 9 waypoints in the dir URL
      const cappedStops = stops.slice(0, 9);
      routeUrl += `&waypoints=${encodeURIComponent(cappedStops.join("|"))}`;
    }

    window.open(routeUrl, "_blank");
  };

  // Export CSV
  window.exportGpsTracingReport = function () {
    if (!currentFilteredGpsVisits || currentFilteredGpsVisits.length === 0) return;
    const lang = "en";
    const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    const headers = [
      "#", "Time", "Medical Rep", "Account Name", "Target Type", "Territory",
      "Rep Lat", "Rep Lng", "Target Lat", "Target Lng", "Deviation (Meters)", "GPS Status"
    ];

    const rows = currentFilteredGpsVisits.map((v, i) => {
      const rep = allUsers.find((u) => u.id === v.repId);
      return [
        i + 1,
        v.time || v.insertionTime || "",
        rep ? rep.name : (v.repName || ""),
        v.doctorName || v.targetName || "",
        v.targetType || v.period || "",
        v.area || "",
        v.deviceLat || "",
        v.deviceLng || "",
        v.targetLat || "",
        v.targetLng || "",
        v.distanceMeters != null ? Math.round(v.distanceMeters) : "",
        v.gpsStatus || ""
      ];
    });

    if (typeof window.downloadExcelOrCsv === "function") {
      window.downloadExcelOrCsv("GPS_Employee_Tracing_Report", "GPS_Tracing", rows, headers);
    }
  };

  // Hook into initial page ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.checkGpsTracingVisibility();
    });
  } else {
    window.checkGpsTracingVisibility();
  }

})();
