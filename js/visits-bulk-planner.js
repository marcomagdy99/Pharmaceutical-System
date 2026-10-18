/**
 * @file visits-bulk-planner.js
 * @description Bulk Multi-Doctor Planning Engine for Visits page.
 * Provides target list filtering, multi-checkbox selection, quota validation,
 * and bulk planned visit generation.
 */

(function (window) {
  "use strict";

  const VisitsBulkPlanner = {
    openBulkPlanModal() {
      const modal = document.getElementById("bulkPlanModal");
      if (!modal) return;

      if (typeof window.populateAreaFilters === "function") {
        window.populateAreaFilters();
      }

      const todayStr = new Date().toISOString().slice(0, 10);
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

      const todayStr = new Date().toISOString().slice(0, 10);
      const period = document.querySelector('input[name="bulkPeriod"]:checked')?.value || "pm";
      const searchTerm = (document.getElementById("bulkSearchInput")?.value || "").toLowerCase().trim();
      const classFilter = document.getElementById("bulkClassFilter")?.value || "all";
      const areaFilter = document.getElementById("bulkAreaFilter")?.value || "all";
      const selectAllCb = document.getElementById("bulkSelectAllToggle");
      if (selectAllCb) selectAllCb.checked = false;

      container.replaceChildren();
      const isHospital = period.toLowerCase() === "am";
      let sourceList = isHospital
        ? (typeof window.getMockHospitals === "function" ? window.getMockHospitals() : [])
        : (typeof window.getMockDoctors === "function" ? window.getMockDoctors() : []);

      const currentUser = (typeof window.checkAuth === "function" ? window.checkAuth() : null) || {};
      const role = window.normalizeRole
        ? window.normalizeRole(currentUser.role)
        : (currentUser.role || "").toLowerCase();

      const allUsers = (window.store && window.store.users
        ? window.store.users.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
      const allAreas = (window.store && window.store.areas
        ? window.store.areas.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);

      if (role === "medical_rep") {
        const repAreas = window.store && window.store.areas
          ? window.store.areas.getByRep(currentUser.id)
          : [];
        const repAreaIds = repAreas.map((a) => a.id);
        const repAreaNames = repAreas.map((a) => (a.name || "").toLowerCase().trim());
        sourceList = sourceList.filter(
          (d) =>
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
        );
      } else if (role === "district_manager") {
        const myReps = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
        const allowed = [...myReps, currentUser.id];
        sourceList = sourceList.filter((d) => !d.repId || allowed.includes(d.repId));
      } else if (role === "line_manager") {
        const myDms = allUsers.filter((u) => u.managerId === currentUser.id).map((u) => u.id);
        const myReps = allUsers.filter((u) => myDms.includes(u.managerId)).map((u) => u.id);
        const allowed = [currentUser.id, ...myDms, ...myReps];
        sourceList = sourceList.filter((d) => !d.repId || allowed.includes(d.repId));
      } else if (role === "business_unit") {
        const downstream = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(currentUser.id) : [];
        const allowed = [currentUser.id, ...downstream.map((u) => u.id)];
        sourceList = sourceList.filter((d) => !d.repId || allowed.includes(d.repId));
      }

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
      const targetRepId = (currentUser && currentUser.id) || "u1790626000001";

      filtered.forEach((target) => {
        let targetArea = target.area;
        if (!targetArea && target.areaId) {
          const fa = allAreas.find((a) => a.id === target.areaId);
          if (fa) targetArea = fa.name;
        }
        const areaBadge = targetArea
          ? `<span class="badge bulk-target-area-badge">📍 ${window.escapeHtml ? window.escapeHtml(targetArea) : targetArea}</span>`
          : "";

        const isAlready = typeof window.isDoctorAlreadyVisitedToday === "function"
          ? window.isDoctorAlreadyVisitedToday(target.id, currentPlanDate, targetRepId)
          : false;

        const scheduledBadge = isAlready
          ? `<span class="badge bulk-target-already-badge">✓ Already Scheduled</span>`
          : "";

        const itemDiv = document.createElement("label");
        itemDiv.className = `bulk-target-item${isAlready ? " bulk-target-already-scheduled" : ""}`;
        itemDiv.innerHTML = `
          <input type="checkbox" class="bulk-target-cb" value="${target.id}" data-name="${target.name}" ${isAlready ? "disabled" : 'onchange="visitsApp.updateBulkCounter()"'} title="${isAlready ? 'Already scheduled today' : ''}">
          <div class="bulk-target-info">
            <div class="bulk-target-name">${target.name}${areaBadge}${scheduledBadge}</div>
            <div class="bulk-target-meta">
              ${isHospital ? target.address || "Hospital" : `${target.specialty || "General"} • Class ${target.class || "A"}`}
            </div>
          </div>
          <span class="badge ${isHospital ? "bulk-target-badge-hosp" : "bulk-target-badge-class"}">
            ${isHospital ? "Hospital" : `Class ${target.class || "A"}`}
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
      const todayStr = new Date().toISOString().slice(0, 10);
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

      const currentUser = (typeof window.checkAuth === "function" ? window.checkAuth() : null) || {};
      const targetRepId = currentUser.id || "u1790626000001";

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

      // 1. Duplicate check
      const duplicateTargets = [];
      const validBoxes = [];
      checkedBoxes.forEach((cb) => {
        const targetId = cb.value;
        const targetName = cb.getAttribute("data-name") || "Doctor";
        if (typeof window.isDoctorAlreadyVisitedToday === "function" && window.isDoctorAlreadyVisitedToday(targetId, planDate, targetRepId)) {
          duplicateTargets.push(targetName);
        } else {
          validBoxes.push(cb);
        }
      });

      if (duplicateTargets.length > 0 && validBoxes.length === 0) {
        resetSaveBtn();
        const msg = `Selected targets are already scheduled/visited today: (${duplicateTargets.join(", ")}). Duplicate visits on the same day are not permitted.`;
        if (typeof window.showToast === "function") window.showToast(msg, "warning");
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

          const visitsList = window.demoVisits || [];
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

      const allDocs = typeof window.getMockDoctors === "function" ? window.getMockDoctors() : [];
      const allHosps = typeof window.getMockHospitals === "function" ? window.getMockHospitals() : [];
      const repLines = typeof window.getUserLines === "function" ? window.getUserLines(targetRepId) : [];
      const repFallbackLineId = repLines.length > 0 ? repLines[0].id : undefined;

      if (typeof window.getLiveVisits === "function") {
        window.getLiveVisits();
      }

      const visitsTarget = window.demoVisits || [];
      validBoxes.forEach((cb, index) => {
        const targetId = cb.value;
        const targetName = cb.getAttribute("data-name") || "Doctor";
        const assignedTime = defaultTimes[index % defaultTimes.length];

        const targetDoc = allDocs.find((d) => d.id === targetId) || allHosps.find((h) => h.id === targetId);
        const visitLineId = (targetDoc && targetDoc.lineId) || repFallbackLineId;

        const planUniqueId = "plan_" + Date.now() + "_" + index;
        const newVisit = {
          id: "v_bulk_" + Date.now() + "_" + index,
          planId: planUniqueId,
          repId: targetRepId,
          lineId: visitLineId,
          doctorId: targetId,
          doctorName: targetName,
          date: planDate,
          time: assignedTime,
          period: period,
          visitType: "single",
          products: [],
          comment: "",
          status: "pending_approval",
          source: "plan",
          createdAt: new Date().toISOString(),
          insertionDate: todayStr,
          insertionTime: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
          entryDate: todayStr,
        };

        visitsTarget.unshift(newVisit);
      });

      if (typeof window.persistVisits === "function") {
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
  window.visitsApp = VisitsBulkPlanner;
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
