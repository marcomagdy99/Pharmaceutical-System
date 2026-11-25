/**
 * @file visits-bulk-planner.js
 * @description Bulk Multi-Doctor Planning Engine for Visits page.
 * Provides target list filtering, multi-checkbox selection, quota validation,
 * and bulk planned visit generation.
 */

(function (window) {
  "use strict";

  const ALLOWED_BULK_PLAN_ROLES = new Set([
    "admin",
    "business_unit",
    "line_manager",
    "district_manager",
    "medical_rep",
  ]);

  function _escapeHtml(str) {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(str);
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function _getNowDate() {
    if (typeof window.getSystemDate === "function") {
      const sysD = window.getSystemDate();
      if (sysD instanceof Date && !isNaN(sysD.getTime())) return sysD;
    }
    return new Date();
  }

  function _getTodayStr() {
    if (typeof window.getLocalTodayStr === "function") return window.getLocalTodayStr();
    if (typeof window.getSystemTodayStr === "function") return window.getSystemTodayStr();
    const d = _getNowDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function _getNormRole(user) {
    if (!user || !user.role) return "";
    return window.normalizeRole
      ? window.normalizeRole(user.role)
      : String(user.role).toLowerCase().trim();
  }

  function _canCreateBulkPlans(user) {
    if (!user || !user.id) return false;
    return ALLOWED_BULK_PLAN_ROLES.has(_getNormRole(user));
  }

  function _getManagerLineIds(user) {
    if (!user || !user.id) return new Set();
    const ids = new Set();
    if (typeof window.getUserLines === "function") {
      (window.getUserLines(user.id) || []).forEach((l) => {
        if (l && l.id) ids.add(l.id);
      });
    }
    if (Array.isArray(user.lineIds)) user.lineIds.forEach((lid) => { if (lid) ids.add(lid); });
    if (user.lineId) ids.add(user.lineId);
    return ids;
  }

  function _getScopedBulkTargets(sourceList, currentUser, role, allUsers, allAreas) {
    if (!_canCreateBulkPlans(currentUser)) return [];

    if (role === "admin") {
      return sourceList.slice();
    }

    if (role === "medical_rep") {
      const repAreas = window.store && window.store.areas
        ? window.store.areas.getByRep(currentUser.id)
        : allAreas.filter((a) => a.repId === currentUser.id);
      const repAreaIds = repAreas.map((a) => a.id);
      const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
      return sourceList.filter(
        (d) =>
          d.repId === currentUser.id ||
          (d.areaId && repAreaIds.includes(d.areaId)) ||
          (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
      );
    }

    let allowedUsers = [currentUser.id];
    if (role === "district_manager") {
      const myReps = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
      allowedUsers = [currentUser.id, ...myReps];
    } else if (role === "line_manager") {
      const myDms = allUsers.filter((u) => {
        return u.managerId === currentUser.id && _getNormRole(u) === "district_manager";
      }).map((u) => u.id);
      const directReps = allUsers.filter((u) => u.managerId === currentUser.id && !myDms.includes(u.id)).map((u) => u.id);
      const dmReps = allUsers.filter((u) => myDms.includes(u.managerId)).map((u) => u.id);
      allowedUsers = [currentUser.id, ...myDms, ...directReps, ...dmReps];
    } else if (role === "business_unit") {
      const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
      allowedUsers = [currentUser.id, ...downstream.map((u) => u.id)];
    }

    const allowedUserSet = new Set(allowedUsers);
    const allowedLineSet = _getManagerLineIds(currentUser);
    const allowedAreaSet = new Set(
      allAreas
        .filter((a) => {
          if (a.repId && allowedUserSet.has(a.repId)) return true;
          if (!a.repId && a.lineId && allowedLineSet.has(a.lineId)) return true;
          if (role === "district_manager" && (a.dmId === currentUser.id || a.districtManagerId === currentUser.id)) return true;
          if (role === "business_unit" && a.buId === currentUser.id) return true;
          return false;
        })
        .map((a) => a.id)
    );

    return sourceList.filter((d) => {
      if (d.repId) return allowedUserSet.has(d.repId);
      // Unassigned target: must belong strictly to this manager's area or line
      if (d.areaId && allowedAreaSet.has(d.areaId)) return true;
      if (d.lineId && allowedLineSet.has(d.lineId)) return true;
      if (allowedLineSet.size > 0 && typeof window.doctorMatchesLine === "function") {
        return Array.from(allowedLineSet).some((lid) => window.doctorMatchesLine(d, lid, allAreas));
      }
      return false;
    });
  }

  const VisitsBulkPlanner = {
    openBulkPlanModal() {
      const currentUser = typeof window.checkAuth === "function" ? window.checkAuth() : null;
      if (!_canCreateBulkPlans(currentUser)) {
        if (typeof window.showToast === "function") {
          window.showToast("Unauthorized: You do not have permission to create bulk visit plans.", "error");
        }
        return;
      }

      const modal = document.getElementById("bulkPlanModal");
      if (!modal) return;

      if (typeof window.populateAreaFilters === "function") {
        window.populateAreaFilters();
      }

      const todayStr = _getTodayStr();
      const timelinePicker = document.getElementById("timelineDatePicker");
      const activeTimelineDate =
        timelinePicker && timelinePicker.value && timelinePicker.value >= todayStr
          ? timelinePicker.value
          : todayStr;

      const bulkDateInput = document.getElementById("bulkPlanDate");
      if (bulkDateInput) {
        bulkDateInput.min = todayStr;
        bulkDateInput.value = activeTimelineDate;
        if (!bulkDateInput.dataset.boundChange) {
          bulkDateInput.dataset.boundChange = "true";
          bulkDateInput.addEventListener("change", () => {
            this.renderBulkTargetsList();
          });
        }
      }
      const searchInput = document.getElementById("bulkSearchInput");
      if (searchInput) searchInput.value = "";

      const pmRadio = document.querySelector('input[name="bulkPeriod"][value="pm"]');
      if (pmRadio) pmRadio.checked = true;

      this.renderBulkTargetsList();
      modal.style.display = "flex";
      modal.classList.add("active");
    },

    closeBulkPlanModal() {
      const modal = document.getElementById("bulkPlanModal");
      if (modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
      }
    },

    renderBulkTargetsList() {
      const container = document.getElementById("bulkTargetsContainer");
      if (!container) return;

      if (!container.dataset.changeBound) {
        container.dataset.changeBound = "true";
        container.addEventListener("change", (e) => {
          if (e.target && e.target.classList && e.target.classList.contains("bulk-target-cb")) {
            this.updateBulkCounter();
          }
        });
      }

      const todayStr = _getTodayStr();
      const period = document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";
      const searchTerm = (document.getElementById("bulkSearchInput")?.value || "").toLowerCase().trim();
      const classFilter = document.getElementById("bulkClassFilter")?.value || "all";
      const areaFilter = document.getElementById("bulkAreaFilter")?.value || "all";
      const selectAllCb = document.getElementById("bulkSelectAllToggle");
      if (selectAllCb) selectAllCb.checked = false;

      container.replaceChildren();

      const currentUser = typeof window.checkAuth === "function" ? window.checkAuth() : null;
      if (!_canCreateBulkPlans(currentUser)) {
        container.innerHTML = `<div class="bulk-targets-empty">Access Restricted: Not authorized to plan visits.</div>`;
        this.updateBulkCounter();
        return;
      }

      const role = _getNormRole(currentUser);
      const isHospital = period.toLowerCase() === "am";
      const rawSource = isHospital
        ? (typeof window.getMockHospitals === "function" ? window.getMockHospitals() : [])
        : (typeof window.getMockDoctors === "function" ? window.getMockDoctors() : []);

      const allUsers = (window.store && window.store.users
        ? window.store.users.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
      const allAreas = (window.store && window.store.areas
        ? window.store.areas.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

      let sourceList = _getScopedBulkTargets(rawSource, currentUser, role, allUsers, allAreas);

      const activeLineId = document.getElementById("filterLine")?.value || "all";
      if (activeLineId !== "all" && typeof window.doctorMatchesLine === "function") {
        sourceList = sourceList.filter((d) => window.doctorMatchesLine(d, activeLineId, allAreas));
      }

      const selectedAreaObj = allAreas.find((a) => a.id === areaFilter || a.name === areaFilter);
      const selectedAreaName = selectedAreaObj
        ? selectedAreaObj.name.toLowerCase().trim()
        : areaFilter.toLowerCase().trim();

      const filtered = sourceList.filter((item) => {
        const nameMatch =
          (item.name || "").toLowerCase().includes(searchTerm) ||
          (item.nameAr || "").toLowerCase().includes(searchTerm);
        const specMatch = item.specialty
          ? item.specialty.toLowerCase().includes(searchTerm)
          : false;
        const addrMatch =
          (item.address && item.address.toLowerCase().includes(searchTerm)) ||
          (item.clinicAddress && item.clinicAddress.toLowerCase().includes(searchTerm));
        const classMatch =
          classFilter === "all" || isHospital ? true : item.class === classFilter;

        let areaMatch = true;
        if (areaFilter !== "all") {
          const matchId = item.areaId && item.areaId === areaFilter;
          let matchName = item.area && item.area.toLowerCase().trim() === selectedAreaName;
          if (matchName && selectedAreaObj && selectedAreaObj.lineId && typeof window.doctorMatchesLine === "function") {
            matchName = window.doctorMatchesLine(item, selectedAreaObj.lineId, allAreas);
          }
          areaMatch = matchId || matchName;
        }

        return (nameMatch || specMatch || addrMatch) && classMatch && areaMatch;
      });

      filtered.sort(window.sortBilingualByName || ((a, b) => (a.name || "").localeCompare(b.name || "")));

      if (filtered.length === 0) {
        container.innerHTML = `<div class="bulk-targets-empty">No matching targets found.</div>`;
        this.updateBulkCounter();
        return;
      }

      const planDateInput = document.getElementById("bulkPlanDate");
      const currentPlanDate = (planDateInput && planDateInput.value) || todayStr;
      const targetRepId = currentUser.id;

      filtered.forEach((target) => {
        let targetArea = target.area;
        if (!targetArea && target.areaId) {
          const fa = allAreas.find((a) => a.id === target.areaId);
          if (fa) targetArea = fa.name;
        }
        const areaBadge = targetArea
          ? `<span class="badge bulk-target-area-badge"><svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.85" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${_escapeHtml(targetArea)}</span>`
          : "";

        const isAlready = typeof window.isDoctorAlreadyVisitedToday === "function"
          ? window.isDoctorAlreadyVisitedToday(target.id, currentPlanDate, targetRepId)
          : false;

        const scheduledBadge = isAlready
          ? `<span class="badge bulk-target-already-badge">✓ Already Scheduled</span>`
          : "";

        const safeTargetId = _escapeHtml(target.id);
        const safeTargetName = _escapeHtml(target.name);
        const safeMeta = isHospital ? _escapeHtml(target.address || "Hospital") : `${_escapeHtml(target.specialty || "General")} • Class ${_escapeHtml(target.class || "A")}`;
        const safeClass = _escapeHtml(target.class || "A");

        const itemDiv = document.createElement("label");
        itemDiv.className = `bulk-target-item${isAlready ? " bulk-target-already-scheduled" : ""}`;
        itemDiv.innerHTML = `
          <input type="checkbox" class="bulk-target-cb" value="${safeTargetId}" data-name="${safeTargetName}" ${isAlready ? "disabled" : ""} title="${isAlready ? 'Already scheduled today' : ''}">
          <div class="bulk-target-info">
            <div class="bulk-target-name">${safeTargetName}${areaBadge}${scheduledBadge}</div>
            <div class="bulk-target-meta">
              ${safeMeta}
            </div>
          </div>
          <span class="badge ${isHospital ? "bulk-target-badge-hosp" : "bulk-target-badge-class"}">
            ${isHospital ? "Hospital" : `Class ${safeClass}`}
          </span>
        `;
        container.appendChild(itemDiv);
      });

      this.updateBulkCounter();
    },

    filterBulkTargetsList() {
      this.renderBulkTargetsList();
    },

    toggleBulkSelectAll(isChecked) {
      document.querySelectorAll(".bulk-target-cb:not(:disabled)").forEach((cb) => {
        cb.checked = isChecked;
      });
      this.updateBulkCounter();
    },

    updateBulkCounter() {
      const allCheckboxes = document.querySelectorAll(".bulk-target-cb:not(:disabled)");
      const checkedBoxes = document.querySelectorAll(".bulk-target-cb:checked:not(:disabled)");
      const counterEl = document.getElementById("bulkSelectionCounter");
      const saveBtn = document.getElementById("btnSaveBulkPlan");
      const selectAllCb = document.getElementById("bulkSelectAllToggle");

      const count = checkedBoxes.length;
      if (counterEl) {
        counterEl.textContent = `Selected: ${count} Targets`;
      }
      if (saveBtn) {
        saveBtn.textContent = count > 0 ? `Save ${count} Planned Visits` : "Save Planned Visits";
      }
      if (selectAllCb && allCheckboxes.length > 0) {
        selectAllCb.checked = checkedBoxes.length === allCheckboxes.length;
      }
    },

    saveBulkPlanVisits() {
      const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
      const todayStr = _getTodayStr();
      const saveBtn = document.getElementById("btnSaveBulkPlan");
      const originalBtnText = saveBtn ? saveBtn.textContent : "";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving... ⏳";
      }

      const resetSaveBtn = () => {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = originalBtnText || "Save Planned Visits";
        }
      };

      const currentUser = typeof window.checkAuth === "function" ? window.checkAuth() : null;
      if (!_canCreateBulkPlans(currentUser)) {
        resetSaveBtn();
        if (typeof window.showToast === "function") {
          window.showToast("Unauthorized: You do not have permission to save bulk visit plans.", "error");
        }
        return;
      }

      const checkedBoxes = Array.from(document.querySelectorAll(".bulk-target-cb:checked"));
      if (checkedBoxes.length === 0) {
        resetSaveBtn();
        if (typeof window.showToast === "function") {
          window.showToast("Please select at least one doctor or hospital.", "warning");
        }
        return;
      }

      const planDate = document.getElementById("bulkPlanDate")?.value || todayStr;
      if (planDate < todayStr) {
        resetSaveBtn();
        if (typeof window.showToast === "function") {
          window.showToast("Cannot plan visits in the past. Please select today or a future date.", "warning");
        }
        return;
      }

      const role = _getNormRole(currentUser);
      const targetRepId = currentUser.id;

      if (typeof window.checkVisitDateAllowed === "function") {
        const dateCheck = window.checkVisitDateAllowed(planDate, targetRepId, lang);
        if (!dateCheck.allowed) {
          resetSaveBtn();
          if (typeof window.showToast === "function") {
            window.showToast(dateCheck.message, "warning");
          }
          return;
        }
      }

      const period = document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";
      const isHospital = period.toLowerCase() === "am";
      const allUsers = (window.store && window.store.users
        ? window.store.users.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
      const allAreas = (window.store && window.store.areas
        ? window.store.areas.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
      const allDocs = typeof window.getMockDoctors === "function" ? window.getMockDoctors() : [];
      const allHosps = typeof window.getMockHospitals === "function" ? window.getMockHospitals() : [];
      const rawPool = isHospital ? allHosps : allDocs;
      const authorizedPool = _getScopedBulkTargets(rawPool, currentUser, role, allUsers, allAreas);
      const authorizedTargetIds = new Set(authorizedPool.map((t) => String(t.id)));

      // 1. Duplicate & authorization scope check
      const duplicateTargets = [];
      const validBoxes = [];
      checkedBoxes.forEach((cb) => {
        const targetId = String(cb.value || "");
        if (!authorizedTargetIds.has(targetId)) return;
        const targetName = cb.getAttribute("data-name") || "Doctor";
        if (typeof window.isDoctorAlreadyVisitedToday === "function" && window.isDoctorAlreadyVisitedToday(targetId, planDate, targetRepId)) {
          duplicateTargets.push(targetName);
        } else {
          validBoxes.push(cb);
        }
      });

      if (validBoxes.length === 0) {
        resetSaveBtn();
        if (duplicateTargets.length > 0) {
          const msg = `Selected targets are already scheduled/visited today: (${duplicateTargets.join(", ")}). Duplicate visits on the same day are not permitted.`;
          if (typeof window.showToast === "function") window.showToast(msg, "warning");
        } else if (typeof window.showToast === "function") {
          window.showToast("Unauthorized or invalid targets selected.", "warning");
        }
        return;
      }

      // 2. Minimum PM visits check
      let pmReminder = "";
      if (period.toLowerCase() === "pm" && typeof window.isWorkdayExemptFromMinVisits === "function") {
        const exemption = window.isWorkdayExemptFromMinVisits(planDate, targetRepId);
        if (!exemption.exempt) {
          const companySettings = (window.store && window.store.companySettings)
            ? window.store.companySettings.get()
            : { minPmVisitsPerDay: 4 };
          const minPmRequired = (companySettings && companySettings.minPmVisitsPerDay) || 4;

          const visitsList = (window.store && window.store.visits && typeof window.store.visits.getAll === "function")
            ? window.store.visits.getAll()
            : (window.demoVisits || []);
          const existingPmCount = visitsList.filter(
            (v) =>
              v.repId === targetRepId &&
              v.date === planDate &&
              (v.period || "").toLowerCase() === "pm" &&
              v.targetType !== "pharmacy" &&
              !(v.doctorId && String(v.doctorId).startsWith("pharm")) &&
              v.status !== "rejected"
          ).length;

          const totalPm = existingPmCount + validBoxes.length;
          if (totalPm < minPmRequired) {
            pmReminder = ` (Note: Daily target is ${minPmRequired} PM visits, ${totalPm} planned so far)`;
          }
        }
      }

      const defaultTimes = [
        "09:30", "10:15", "11:00", "11:45",
        "13:00", "13:45", "14:30", "15:15", "16:00", "16:45"
      ];

      const repLines = typeof window.getUserLines === "function" ? window.getUserLines(targetRepId) : [];
      const repFallbackLineId = repLines.length > 0 ? repLines[0].id : undefined;

      if (typeof window.getLiveVisits === "function") {
        window.getLiveVisits();
      }

      const nowStamp = _getNowDate();
      const baseTs = Date.now();
      const insTime = `${String(nowStamp.getHours()).padStart(2, "0")}:${String(nowStamp.getMinutes()).padStart(2, "0")}`;
      const visitsTarget = window.demoVisits || [];
      const useCentralStore = Boolean(window.store && window.store.visits && typeof window.store.visits.add === "function");

      validBoxes.forEach((cb, index) => {
        const targetId = cb.value;
        const targetObj = authorizedPool.find((d) => String(d.id) === String(targetId));
        const targetName = (targetObj && targetObj.name) || cb.getAttribute("data-name") || "Doctor";
        const assignedTime = defaultTimes[index % defaultTimes.length];
        const visitLineId = (targetObj && targetObj.lineId) || repFallbackLineId;

        const planUniqueId = typeof window.genId === "function" ? window.genId("plan_") : `plan_${baseTs}_${index}`;
        const visitUniqueId = typeof window.genId === "function" ? window.genId("v_bulk_") : `v_bulk_${baseTs}_${index}`;
        const newVisit = {
          id: visitUniqueId,
          planId: planUniqueId,
          repId: targetRepId,
          lineId: visitLineId,
          areaId: (targetObj && targetObj.areaId) || undefined,
          targetType: isHospital ? "hospital" : "doctor",
          doctorId: targetId,
          doctorName: targetName,
          date: planDate,
          time: assignedTime,
          period: period,
          visitType: "single",
          products: [],
          comment: "",
          status: role === "admin" ? "planned" : "pending_approval",
          source: "plan",
          createdAt: nowStamp.toISOString(),
          insertionDate: todayStr,
          insertionTime: insTime,
          entryDate: todayStr,
        };

        if (useCentralStore) {
          window.store.visits.add(newVisit);
        } else {
          visitsTarget.unshift(newVisit);
        }
      });

      if (useCentralStore) {
        if (typeof window.getLiveVisits === "function") window.getLiveVisits();
      } else if (typeof window.persistVisits === "function") {
        window.persistVisits();
      }
      resetSaveBtn();
      this.closeBulkPlanModal();

      const datePicker = document.getElementById("timelineDatePicker");
      if (datePicker && planDate) {
        datePicker.value = planDate;
        try {
          sessionStorage.setItem("pharma_timeline_selected_date", planDate);
        } catch (e) {}
      }

      if (typeof window.renderVisits === "function") {
        window.renderVisits(true);
      }

      let successMsg = `✓ Successfully saved ${validBoxes.length} planned visit(s) for manager approval!`;
      if (pmReminder) successMsg += pmReminder;
      if (duplicateTargets.length > 0) successMsg += ` (Skipped duplicate targets: ${duplicateTargets.join(", ")})`;

      if (typeof window.showToast === "function") {
        window.showToast(successMsg, "success");
      }
    }
  };

  // Expose as visitsApp and global functions for backward compatibility
  window.VisitsBulkPlanner = VisitsBulkPlanner;
  window.visitsApp = Object.assign(window.visitsApp || {}, VisitsBulkPlanner);
  window.openBulkPlanModal = VisitsBulkPlanner.openBulkPlanModal.bind(VisitsBulkPlanner);
  window.closeBulkPlanModal = VisitsBulkPlanner.closeBulkPlanModal.bind(VisitsBulkPlanner);
  window.renderBulkTargetsList = VisitsBulkPlanner.renderBulkTargetsList.bind(VisitsBulkPlanner);
  window.filterBulkTargetsList = VisitsBulkPlanner.filterBulkTargetsList.bind(VisitsBulkPlanner);
  window.toggleBulkSelectAll = VisitsBulkPlanner.toggleBulkSelectAll.bind(VisitsBulkPlanner);
  window.updateBulkCounter = VisitsBulkPlanner.updateBulkCounter.bind(VisitsBulkPlanner);
  window.saveBulkPlanVisits = VisitsBulkPlanner.saveBulkPlanVisits.bind(VisitsBulkPlanner);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VisitsBulkPlanner;
  }
})(typeof window !== "undefined" ? window : global);
