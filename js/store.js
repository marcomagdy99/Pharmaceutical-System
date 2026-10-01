/**
 * @file store.js
 * @description Centralized State Store with automatic persistence, single source of truth,
 * and historical territory tracking (Relational Assignment History Architecture).
 */

(function () {
  if (!window.DEMO_DATA) {
    console.warn(
      "store.js: window.DEMO_DATA not yet loaded, initializing empty container.",
    );
    window.DEMO_DATA = {};
  }

  // Ensure territory history table exists
  if (!Array.isArray(window.DEMO_DATA.territoryHistory)) {
    window.DEMO_DATA.territoryHistory = [];
  }

  function autoSave(entity, action, payload) {
    if (entity === "distributorSales" || entity === "sales") {
      if (typeof window.saveSalesDataToStorage === "function") {
        window.saveSalesDataToStorage();
      } else if (typeof window.saveDataToStorage === "function") {
        window.saveDataToStorage();
      }
    } else {
      if (typeof window.saveDataToStorage === "function") {
        window.saveDataToStorage();
      }
    }
    document.dispatchEvent(
      new CustomEvent("pharma:store:changed", {
        detail: { entity, action, payload },
      }),
    );
  }

  // Helper for Territory Assignment History Logging (Pulpo CRM Architecture)
  function logTerritoryHistoryChange(areaId, oldRepId, newRepId) {
    if (!window.DEMO_DATA.territoryHistory) {
      window.DEMO_DATA.territoryHistory = [];
    }
    const history = window.DEMO_DATA.territoryHistory;
    const now = new Date().toISOString();

    // 1. Close previous active log if assigned to someone else
    if (oldRepId && oldRepId !== newRepId) {
      const activeLog = history.find(
        (h) => h.areaId === areaId && h.repId === oldRepId && !h.endDate
      );
      if (activeLog) {
        activeLog.endDate = now;
      }
    }

    // 2. Open new assignment log if a rep is assigned
    if (newRepId && oldRepId !== newRepId) {
      history.push({
        id: "th_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        areaId: areaId,
        repId: newRepId,
        startDate: now,
        endDate: null
      });
    }

    autoSave("territoryHistory", "change", { areaId, oldRepId, newRepId, timestamp: now });
  }

  const store = {
    // ==========================================
    // Section: Users Module
    // ==========================================
    users: {
      getAll() {
        return window.DEMO_DATA.users || [];
      },
      getById(id) {
        return (window.DEMO_DATA.users || []).find((u) => u.id === id);
      },
      getReps() {
        return (window.DEMO_DATA.users || []).filter(
          (u) =>
            (u.role === "medical_rep" || u.role === "rep") &&
            u.status !== "Inactive",
        );
      },
      save(userObj) {
        if (!window.DEMO_DATA.users) window.DEMO_DATA.users = [];
        const users = window.DEMO_DATA.users;
        const idx = users.findIndex((u) => u.id === userObj.id);
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...userObj };
        } else {
          users.unshift(userObj);
        }
        autoSave("users", idx >= 0 ? "update" : "create", userObj);
        return userObj;
      },
      /**
       * Singular-area setter. Synchronizes both area name and areaId,
       * explicitly setting null if unassigned to prevent data corruption.
       */
      updateArea(userId, areaName, areaId) {
        const u = this.getById(userId);
        if (u) {
          u.area = areaName || null;
          u.areaId = areaId || null;
          autoSave("users", "updateArea", { userId, areaName, areaId });
        }
      },
      /**
       * Returns every Area record currently assigned to this rep.
       */
      getAreas(userId) {
        return (window.DEMO_DATA.areas || []).filter(
          (a) => a.repId === userId,
        );
      },
      /**
       * Recomputes each user's area fields from the Areas list.
       */
      syncAreasFromStore() {
        const areas = window.DEMO_DATA.areas || [];
        const users = window.DEMO_DATA.users || [];
        const doctors = window.DEMO_DATA.doctors || [];
        const pharmacies = window.DEMO_DATA.pharmacies || [];
        const hospitals = window.DEMO_DATA.hospitals || [];

        // 1. Clean up invalid/stale area assignments where rep was transferred or no longer in the area's line
        areas.forEach((a) => {
          if (!a.repId) return;
          const rep = users.find((u) => u.id === a.repId);
          const isRepRole = rep && (rep.role === "medical_rep" || rep.role === "rep" || rep.role === "Rep");
          const repLines = rep ? (rep.lineIds || (rep.lineId ? [rep.lineId] : [])) : [];
          const lineMismatch = a.lineId && repLines.length > 0 && !repLines.includes(a.lineId);

          if (!rep || rep.status === "Inactive" || !isRepRole || lineMismatch) {
            const oldRepId = a.repId;
            a.repId = null;
            a.repName = null;
            if (typeof store.areas.reassignAreaCustomers === "function") {
              store.areas.reassignAreaCustomers(a.id, null, a.name);
            }
            if (store.distributorSales && typeof store.distributorSales.rematchAreaSales === "function") {
              store.distributorSales.rematchAreaSales(a.id, null);
            }
            logTerritoryHistoryChange(a.id, oldRepId, null);
          }
        });

        // 2. Recompute each user's area fields from the verified areas list
        users.forEach((u) => {
          const repAreas = areas.filter((a) => a.repId === u.id);
          u.areaIds = repAreas.map((a) => a.id);
          u.area = repAreas.length
            ? repAreas.map((a) => a.name).join(", ")
            : null;
          u.areaId = repAreas.length ? repAreas[0].id : null;
        });

        // 3. Keep customer (doctor, pharmacy, hospital) rep and line in sync with their assigned area
        doctors.forEach((d) => {
          if (!d.areaId && d.area) {
            const matchArea = areas.find((x) => x.name && x.name.toLowerCase().trim() === d.area.toLowerCase().trim());
            if (matchArea) d.areaId = matchArea.id;
          }
          if (!d.areaId && d.repId) {
            const repAreas = areas.filter((x) => x.repId === d.repId);
            if (repAreas.length === 1) d.areaId = repAreas[0].id;
          }
          if (!d.areaId) return;
          const a = areas.find((x) => x.id === d.areaId);
          if (a) {
            if (a.lineId) d.lineId = a.lineId;
            if (d.repId !== (a.repId || null)) {
              d.repId = a.repId || null;
            }
            if (a.name) d.area = a.name;
          }
        });

        pharmacies.forEach((p) => {
          if (!p.areaId && p.area) {
            const matchArea = areas.find((x) => x.name && x.name.toLowerCase().trim() === p.area.toLowerCase().trim());
            if (matchArea) p.areaId = matchArea.id;
          }
          if (!p.areaId && p.repId) {
            const repAreas = areas.filter((x) => x.repId === p.repId);
            if (repAreas.length === 1) p.areaId = repAreas[0].id;
          }
          if (!p.areaId) return;
          const a = areas.find((x) => x.id === p.areaId);
          if (a) {
            if (a.lineId) p.lineId = a.lineId;
            if (p.repId !== (a.repId || null)) {
              p.repId = a.repId || null;
            }
            if (a.name) p.area = a.name;
          }
        });

        hospitals.forEach((h) => {
          if (!h.areaId && h.area) {
            const matchArea = areas.find((x) => x.name && x.name.toLowerCase().trim() === h.area.toLowerCase().trim());
            if (matchArea) h.areaId = matchArea.id;
          }
          if (!h.areaId && h.repId) {
            const repAreas = areas.filter((x) => x.repId === h.repId);
            if (repAreas.length === 1) h.areaId = repAreas[0].id;
          }
          if (!h.areaId) return;
          const a = areas.find((x) => x.id === h.areaId);
          if (a) {
            if (a.lineId) h.lineId = a.lineId;
            if (h.repId !== (a.repId || null)) {
              h.repId = a.repId || null;
            }
            if (a.name) h.area = a.name;
          }
        });
      },
    },

    // ==========================================
    // Section: Areas Module
    // ==========================================
    areas: {
      getAll() {
        return window.DEMO_DATA.areas || [];
      },
      getById(id) {
        return (window.DEMO_DATA.areas || []).find((a) => a.id === id);
      },
      getNameById(id) {
        const a = this.getById(id);
        return a ? a.name : null;
      },
      getByRep(repId) {
        return (window.DEMO_DATA.areas || []).filter(
          (a) => a.repId === repId,
        );
      },
      /**
       * Returns all areas belonging to a specific product line.
       * Falls back to all areas if lineId is null/undefined (backward compat).
       */
      getByLine(lineId) {
        if (!lineId) return this.getAll();
        return (window.DEMO_DATA.areas || []).filter(
          (a) => a.lineId === lineId || (!a.lineId && lineId === this._defaultLineId()),
        );
      },
      /**
       * Returns active medical reps belonging to a specific product line.
       */
      getRepsByLine(lineId) {
        const allReps = store.users.getReps();
        if (!lineId) return allReps;
        return allReps.filter(
          (r) => r.lineId === lineId || (r.lineIds && r.lineIds.includes(lineId)),
        );
      },
      /**
       * Returns the default (first) line ID for backward compatibility
       * with areas that have no lineId assigned yet.
       */
      _defaultLineId() {
        const lines = (window.DEMO_DATA.productLines || []);
        return lines.length > 0 ? lines[0].id : null;
      },
      /**
       * Finds an area by alias text, optionally scoped to a specific line.
       * If lineId is provided, only returns areas belonging to that line.
       */
      findByAliasTextForLine(distributorId, rawText, lineId) {
        if (!rawText) return null;
        const normalized = String(rawText).trim().toLowerCase();
        const defaultLine = this._defaultLineId();
        return (window.DEMO_DATA.areas || []).find(
          (a) => {
            // Line filter: match if area belongs to the given line
            if (lineId) {
              const areaLine = a.lineId || defaultLine;
              if (areaLine !== lineId) return false;
            }
            return (
              Array.isArray(a.aliases) &&
              a.aliases.some(
                (al) =>
                  al.distributorId === distributorId &&
                  String(al.rawText).trim().toLowerCase() === normalized,
              )
            );
          },
        );
      },
      /**
       * Records that `rawText` from `distributorId`'s sheets refers to
       * this area (e.g. "FAYOUM ETSA" from Ibn Sina -> the "Fayoum" area).
       * Matching is case/whitespace-insensitive but exact otherwise; it
       * does not try to guess partial or fuzzy matches.
       */
      addAlias(areaId, distributorId, rawText) {
        const area = this.getById(areaId);
        if (!area || !rawText) return;
        const normalized = String(rawText).trim().toLowerCase();
        const targetNameNormalized = String(area.name).trim().toLowerCase();

        const allAreas = window.DEMO_DATA && Array.isArray(window.DEMO_DATA.areas) ? window.DEMO_DATA.areas : [];
        
        // 1. Remove this alias from any area with a different geographic name
        allAreas.forEach((otherArea) => {
          if (String(otherArea.name).trim().toLowerCase() !== targetNameNormalized && Array.isArray(otherArea.aliases)) {
            otherArea.aliases = otherArea.aliases.filter(
              (al) =>
                !(al.distributorId === distributorId &&
                  String(al.rawText).trim().toLowerCase() === normalized)
            );
          }
        });

        // 2. Add alias to ALL areas matching this geographic name across all lines
        allAreas.forEach((matchingArea) => {
          if (String(matchingArea.name).trim().toLowerCase() === targetNameNormalized) {
            if (!Array.isArray(matchingArea.aliases)) matchingArea.aliases = [];
            const exists = matchingArea.aliases.some(
              (al) =>
                al.distributorId === distributorId &&
                String(al.rawText).trim().toLowerCase() === normalized,
            );
            if (!exists) {
              matchingArea.aliases.push({ distributorId, rawText: String(rawText).trim() });
            }
          }
        });

        autoSave("areas", "addAlias", { areaId, areaName: area.name, distributorId, rawText });
      },
      /**
       * Removes an alias mapping from an area and clears sales row attribution for that raw text across all lines.
       */
      removeAlias(areaId, distributorId, rawText) {
        const area = this.getById(areaId);
        if (!area || !rawText) return false;
        const normalized = String(rawText).trim().toLowerCase();
        const targetNameNormalized = String(area.name).trim().toLowerCase();

        const allAreas = window.DEMO_DATA && Array.isArray(window.DEMO_DATA.areas) ? window.DEMO_DATA.areas : [];
        let anyRemoved = false;

        allAreas.forEach((matchingArea) => {
          if (String(matchingArea.name).trim().toLowerCase() === targetNameNormalized && Array.isArray(matchingArea.aliases)) {
            const initialLen = matchingArea.aliases.length;
            matchingArea.aliases = matchingArea.aliases.filter(
              (al) =>
                !(al.distributorId === distributorId && String(al.rawText).trim().toLowerCase() === normalized)
            );
            if (matchingArea.aliases.length < initialLen) anyRemoved = true;
          }
        });

        if (anyRemoved) {
          if (store.distributorSales && typeof store.distributorSales.unmatchAliasRows === "function") {
            store.distributorSales.unmatchAliasRows(distributorId, rawText);
          }
          autoSave("areas", "removeAlias", { areaId, areaName: area.name, distributorId, rawText });
        }
        return anyRemoved;
      },
      /**
       * Returns all active mapped area aliases across all areas (deduplicated by geographic area).
       */
      getAllAliases() {
        const result = [];
        const seen = new Set();
        (window.DEMO_DATA.areas || []).forEach((a) => {
          if (Array.isArray(a.aliases)) {
            a.aliases.forEach((al) => {
              const key = `${al.distributorId}||${String(al.rawText).trim().toLowerCase()}||${String(a.name).trim().toLowerCase()}`;
              if (!seen.has(key)) {
                seen.add(key);
                result.push({
                  areaId: a.id,
                  areaName: a.name,
                  areaCode: a.code || "",
                  lineId: a.lineId || null,
                  distributorId: al.distributorId,
                  rawText: al.rawText,
                });
              }
            });
          }
        });
        return result;
      },
      /**
       * Finds the Area (if any) whose alias list has this exact raw text
       * for this distributor.
       */
      findByAliasText(distributorId, rawText) {
        if (!rawText) return null;
        const normalized = String(rawText).trim().toLowerCase();
        const matches = (window.DEMO_DATA.areas || []).filter(
          (a) =>
            Array.isArray(a.aliases) &&
            a.aliases.some(
              (al) =>
                al.distributorId === distributorId &&
                String(al.rawText).trim().toLowerCase() === normalized,
            ),
        );
        if (!matches.length) return null;
        // Prefer an area that has an assigned rep over a vacant one
        return matches.find((a) => a.repId) || matches[0];
      },
      /**
       * Checks whether an assigned IMS brick matches the raw sheet territory text,
       * handling Arabic normalization (hamzas, taa-marbuta, etc.) and English aliases.
       */
      _brickMatchesText(brickName, sheetText) {
        if (!brickName || !sheetText) return false;
        const norm = (s) =>
          String(s || "")
            .trim()
            .toLowerCase()
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/[ًٌٍَُِّْـ]/g, "")
            .replace(/[-\\/,]/g, " ")
            .replace(/\s+/g, " ");

        const nb = norm(brickName);
        const ns = norm(sheetText);
        if (nb === ns) return true;
        if (ns.length >= 3 && nb.includes(ns)) return true;
        if (nb.length >= 3 && ns.includes(nb)) return true;

        const aliases = {
          nasr: "نصر",
          dokki: "دقي",
          maadi: "معادي",
          giza: "جيزه",
          october: "اكتوبر",
          helwan: "حلوان",
          heliopolis: "مصر الجديده",
          alex: "اسكندر",
          alexandria: "اسكندر",
          tanta: "طنطا",
          mansoura: "منصور",
          shubra: "شبرا",
          faisal: "فيصل",
          haram: "هرم",
          zamalek: "زمالك",
          mohandessin: "مهندسين",
          aswan: "اسوان",
          assiut: "اسيوط",
          sohag: "سوهاج",
          qena: "قنا",
          luxor: "اقصر",
          hurghada: "غردقه",
          sharm: "شرم",
          ismailia: "اسماعيلي",
          suez: "سويس",
          "port said": "بورسعيد",
          damietta: "دمياط",
          zagazig: "زقازيق",
          banha: "بنها",
        };

        for (const [enKey, arVal] of Object.entries(aliases)) {
          if (ns.includes(enKey) && nb.includes(norm(arVal))) return true;
        }
        return false;
      },
      /**
       * Finds the Area that has this official IMS brick assigned.
       */
      findByBrickName(brickName) {
        if (!brickName) return null;
        const matches = (window.DEMO_DATA.areas || []).filter(
          (a) =>
            Array.isArray(a.bricks) &&
            a.bricks.some((b) => {
              const bName = typeof b === "string" ? b : (b && b.name ? b.name : "");
              return this._brickMatchesText(bName, brickName);
            })
        );
        if (!matches.length) return null;
        return matches.find((a) => a.repId) || matches[0];
      },
      /**
       * Finds an area by assigned IMS brick name, scoped to a specific product line.
       */
      findByBrickNameForLine(brickName, lineId) {
        if (!brickName) return null;
        const defaultLine = this._defaultLineId();
        return (window.DEMO_DATA.areas || []).find((a) => {
          if (lineId) {
            const areaLine = a.lineId || defaultLine;
            if (areaLine !== lineId) return false;
          }
          return (
            Array.isArray(a.bricks) &&
            a.bricks.some((b) => {
              const bName = typeof b === "string" ? b : (b && b.name ? b.name : "");
              return this._brickMatchesText(bName, brickName);
            })
          );
        });
      },
      save(areaObj) {
        if (!window.DEMO_DATA.areas) window.DEMO_DATA.areas = [];
        const areas = window.DEMO_DATA.areas;
        const idx = areas.findIndex((a) => a.id === areaObj.id);

        let oldRepId = null;
        let newRepId = areaObj.repId || null;

        if (idx >= 0) {
          const areaId = areaObj.id || areas[idx].id;
          oldRepId = areas[idx].repId || null;
          areas[idx] = { 
            ...areas[idx], 
            ...areaObj, 
            id: areaId,
            lineId: areaObj.lineId || areas[idx].lineId || this._defaultLineId(),
            repId: newRepId,
            repName: newRepId ? (areaObj.repName || null) : null
          };
        } else {
          const newId = areaObj.id || "area_" + Date.now();
          areas.push({ 
            ...areaObj, 
            id: newId,
            lineId: areaObj.lineId || this._defaultLineId(),
            repId: newRepId,
            repName: newRepId ? (areaObj.repName || null) : null
          });
        }

        const currentAreaId = areaObj.id || (idx >= 0 ? areas[idx].id : areas[areas.length - 1].id);
        logTerritoryHistoryChange(currentAreaId, oldRepId, newRepId);

        // Reassign all doctors, pharmacies, and hospitals in this area if rep changed
        if (oldRepId !== newRepId) {
          this.reassignAreaCustomers(currentAreaId, newRepId, areaObj.name || (areas[idx] ? areas[idx].name : null));
          if (store.distributorSales && typeof store.distributorSales.rematchAreaSales === "function") {
            store.distributorSales.rematchAreaSales(currentAreaId, newRepId);
          }
        }

        store.users.syncAreasFromStore();
        autoSave("areas", idx >= 0 ? "update" : "create", areaObj);
        return areaObj;
      },
      reassignAreaCustomers(areaId, newRepId, areaName = null) {
        if (!areaId) return { updatedDoctors: 0, updatedPharmacies: 0, updatedHospitals: 0 };
        const area = this.getById(areaId);
        const effectiveName = areaName || (area ? area.name : null);
        const nameLower = effectiveName ? effectiveName.toLowerCase().trim() : null;

        let updatedDoctors = 0;
        let updatedPharmacies = 0;
        let updatedHospitals = 0;

        // 1. Doctors inheritance
        const allDocs = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
        allDocs.forEach((d) => {
          const matchAreaId = d.areaId === areaId;
          const matchAreaName =
            nameLower &&
            d.area &&
            d.area.toLowerCase().trim() === nameLower &&
            (!d.areaId || d.areaId === areaId) &&
            (!area || !area.lineId || !d.lineId || d.lineId === area.lineId);

          if (matchAreaId || matchAreaName) {
            d.repId = newRepId || null;
            d.areaId = areaId;
            if (effectiveName) d.area = effectiveName;
            updatedDoctors++;
          }
        });

        // 2. Pharmacies inheritance
        const allPharms = (window.DEMO_DATA && window.DEMO_DATA.pharmacies) || [];
        allPharms.forEach((p) => {
          const matchAreaId = p.areaId === areaId;
          const matchAreaName =
            nameLower &&
            p.area &&
            p.area.toLowerCase().trim() === nameLower &&
            (!p.areaId || p.areaId === areaId) &&
            (!area || !area.lineId || !p.lineId || p.lineId === area.lineId);

          if (matchAreaId || matchAreaName) {
            p.repId = newRepId || null;
            p.areaId = areaId;
            if (effectiveName) p.area = effectiveName;
            updatedPharmacies++;
          }
        });

        // 3. Hospitals inheritance
        const allHosps = (window.DEMO_DATA && window.DEMO_DATA.hospitals) || [];
        allHosps.forEach((h) => {
          const matchAreaId = h.areaId === areaId;
          const matchAreaName =
            nameLower &&
            h.area &&
            h.area.toLowerCase().trim() === nameLower &&
            (!h.areaId || h.areaId === areaId) &&
            (!area || !area.lineId || !h.lineId || h.lineId === area.lineId);

          if (matchAreaId || matchAreaName) {
            h.repId = newRepId || null;
            h.areaId = areaId;
            if (effectiveName) h.area = effectiveName;
            updatedHospitals++;
          }
        });

        if (typeof window.saveDataToStorage === "function") {
          window.saveDataToStorage();
        }
        autoSave("areas", "reassignAreaCustomers", {
          areaId,
          newRepId,
          areaName: effectiveName,
          updatedDoctors,
          updatedPharmacies,
          updatedHospitals,
        });

        return { updatedDoctors, updatedPharmacies, updatedHospitals };
      },
      unassignRep(areaId) {
        const area = this.getById(areaId);
        if (!area) return;
        const oldRepId = area.repId;
        area.repId = null;
        area.repName = null;

        this.reassignAreaCustomers(areaId, null, area.name);
        if (store.distributorSales && typeof store.distributorSales.rematchAreaSales === "function") {
          store.distributorSales.rematchAreaSales(areaId, null);
        }
        logTerritoryHistoryChange(areaId, oldRepId, null);
        store.users.syncAreasFromStore();
        autoSave("areas", "unassignRep", { areaId });
      },
      delete(areaId) {
        const area = this.getById(areaId);
        if (area && area.repId) {
          logTerritoryHistoryChange(areaId, area.repId, null);
        }
        if (area) {
          this.reassignAreaCustomers(areaId, null, area.name);
          if (store.distributorSales && typeof store.distributorSales.rematchAreaSales === "function") {
            store.distributorSales.rematchAreaSales(areaId, null);
          }
        }
        window.DEMO_DATA.areas = (window.DEMO_DATA.areas || []).filter(
          (a) => a.id !== areaId,
        );
        store.users.syncAreasFromStore();
        autoSave("areas", "delete", { id: areaId });
      },
    },

    // ==========================================
    // Section: Territory History Module (Pulpo Architecture)
    // ==========================================
    territoryHistory: {
      getAll() {
        return window.DEMO_DATA.territoryHistory || [];
      },
      getByUser(userId) {
        return (window.DEMO_DATA.territoryHistory || []).filter((h) => h.repId === userId);
      },
      getByArea(areaId) {
        return (window.DEMO_DATA.territoryHistory || []).filter((h) => h.areaId === areaId);
      },
      getActiveAssignment(areaId) {
        return (window.DEMO_DATA.territoryHistory || []).find((h) => h.areaId === areaId && !h.endDate);
      }
    },

    // ==========================================
    // Section: Visits Module
    // ==========================================
    visits: {
      getAll() {
        return window.DEMO_DATA.visits || [];
      },
      getById(id) {
        return (window.DEMO_DATA.visits || []).find((v) => v.id === id);
      },
      add(visitObj) {
        if (!window.DEMO_DATA.visits) window.DEMO_DATA.visits = [];
        window.DEMO_DATA.visits.unshift(visitObj);
        autoSave("visits", "create", visitObj);
        return visitObj;
      },
      update(visitId, updates) {
        const v = this.getById(visitId);
        if (!v) return null;
        Object.assign(v, updates);
        autoSave("visits", "update", v);
        return v;
      },
      delete(visitId) {
        window.DEMO_DATA.visits = (window.DEMO_DATA.visits || []).filter(
          (v) => v.id !== visitId,
        );
        autoSave("visits", "delete", { id: visitId });
      },
    },

    // ==========================================
    // Section: Doctors Module
    // ==========================================
    doctors: {
      getAll() {
        return window.DEMO_DATA.doctors || [];
      },
      getById(id) {
        return (window.DEMO_DATA.doctors || []).find((d) => d.id === id);
      },
      save(docObj) {
        if (!window.DEMO_DATA.doctors) window.DEMO_DATA.doctors = [];
        if (docObj.areaId && store.areas) {
          const a = store.areas.getById(docObj.areaId);
          if (a) {
            docObj.repId = a.repId || null;
            if (a.name) docObj.area = a.name;
            if (a.lineId) docObj.lineId = a.lineId;
          }
        }
        const docs = window.DEMO_DATA.doctors;
        const idx = docs.findIndex((d) => d.id === docObj.id);
        if (idx >= 0) {
          docs[idx] = { ...docs[idx], ...docObj };
        } else {
          docs.unshift(docObj);
        }
        autoSave("doctors", idx >= 0 ? "update" : "create", docObj);
        return docObj;
      },
      delete(docId) {
        window.DEMO_DATA.doctors = (window.DEMO_DATA.doctors || []).filter(
          (d) => d.id !== docId,
        );
        autoSave("doctors", "delete", { id: docId });
      },
    },

    // ==========================================
    // Section: Pharmacies Module
    // ==========================================
    pharmacies: {
      getAll() {
        return window.DEMO_DATA.pharmacies || [];
      },
      getById(id) {
        return (window.DEMO_DATA.pharmacies || []).find((p) => p.id === id);
      },
      save(pharmObj) {
        if (!window.DEMO_DATA.pharmacies) window.DEMO_DATA.pharmacies = [];
        if (pharmObj.areaId && store.areas) {
          const a = store.areas.getById(pharmObj.areaId);
          if (a) {
            pharmObj.repId = a.repId || null;
            if (a.name) pharmObj.area = a.name;
            if (a.lineId) pharmObj.lineId = a.lineId;
          }
        }
        const pharms = window.DEMO_DATA.pharmacies;
        const idx = pharms.findIndex((p) => p.id === pharmObj.id);
        if (idx >= 0) {
          pharms[idx] = { ...pharms[idx], ...pharmObj };
        } else {
          pharms.unshift(pharmObj);
        }
        autoSave("pharmacies", idx >= 0 ? "update" : "create", pharmObj);
        return pharmObj;
      },
      delete(pharmId) {
        window.DEMO_DATA.pharmacies = (
          window.DEMO_DATA.pharmacies || []
        ).filter((p) => p.id !== pharmId);
        autoSave("pharmacies", "delete", { id: pharmId });
      },
    },

    // ==========================================
    // Section: Pharmacy Territory Overrides Module
    // Allows routing a pharmacy (identified by distributorId and pharmacyCode/pharmacyName)
    // to a custom territory, overriding raw distributor sheet brick text.
    // ==========================================
    pharmacyOverrides: {
      getAll() {
        return window.DEMO_DATA.pharmacyOverrides || [];
      },
      getById(id) {
        return (window.DEMO_DATA.pharmacyOverrides || []).find((o) => o.id === id);
      },
      findMatch(distributorId, pharmacyCode, pharmacyName, month = null, lineId = null) {
        if (!distributorId) return null;
        const cleanCode = String(pharmacyCode || "").trim().toLowerCase();
        const cleanName = String(pharmacyName || "").trim().toLowerCase();
        if (!cleanCode && !cleanName) return null;

        return (window.DEMO_DATA.pharmacyOverrides || []).find((o) => {
          if (o.distributorId !== distributorId) return false;

          let matchesIdentity = false;
          if (cleanCode && o.pharmacyCode) {
            matchesIdentity = String(o.pharmacyCode).trim().toLowerCase() === cleanCode;
          } else if (cleanName && o.pharmacyName) {
            matchesIdentity = String(o.pharmacyName).trim().toLowerCase() === cleanName;
          }
          if (!matchesIdentity) return false;

          // If lineId is specified, ensure this override's target area matches this line
          if (lineId && o.areaId && store.areas) {
            const targetArea = store.areas.getById(o.areaId);
            if (targetArea && targetArea.lineId && targetArea.lineId !== lineId) {
              return false;
            }
          }

          if (!month) return true;
          if (o.effectiveScope === "future_only") {
            if (!o.createdMonth) return false;
            return month >= o.createdMonth;
          }
          if (o.effectiveScope === "from_month" && o.effectiveFromMonth) {
            return month >= o.effectiveFromMonth;
          }
          return true; // all_history
        });
      },
      save(overrideObj) {
        if (!window.DEMO_DATA.pharmacyOverrides) window.DEMO_DATA.pharmacyOverrides = [];
        const list = window.DEMO_DATA.pharmacyOverrides;
        const idx = list.findIndex((o) => o.id === overrideObj.id);
        const item = {
          ...overrideObj,
          id: overrideObj.id || `povr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          updatedAt: new Date().toISOString()
        };
        if (idx >= 0) {
          list[idx] = item;
        } else {
          item.createdAt = item.createdAt || new Date().toISOString();
          list.unshift(item);
        }
        autoSave("pharmacyOverrides", idx >= 0 ? "update" : "create", item);
        return item;
      },
      delete(id) {
        const item = this.getById(id);
        window.DEMO_DATA.pharmacyOverrides = (
          window.DEMO_DATA.pharmacyOverrides || []
        ).filter((o) => o.id !== id);
        autoSave("pharmacyOverrides", "delete", { id });
        return item;
      },
    },

    // ==========================================
    // Section: Hospitals Module
    // ==========================================
    hospitals: {
      getAll() {
        return window.DEMO_DATA.hospitals || [];
      },
      getById(id) {
        return (window.DEMO_DATA.hospitals || []).find((h) => h.id === id);
      },
      save(hospObj) {
        if (!window.DEMO_DATA.hospitals) window.DEMO_DATA.hospitals = [];
        if (hospObj.areaId && store.areas) {
          const a = store.areas.getById(hospObj.areaId);
          if (a) {
            hospObj.repId = a.repId || null;
            if (a.name) hospObj.area = a.name;
            if (a.lineId) hospObj.lineId = a.lineId;
          }
        }
        const hosps = window.DEMO_DATA.hospitals;
        const idx = hosps.findIndex((h) => h.id === hospObj.id);
        if (idx >= 0) {
          hosps[idx] = { ...hosps[idx], ...hospObj };
        } else {
          hosps.unshift(hospObj);
        }
        autoSave("hospitals", idx >= 0 ? "update" : "create", hospObj);
        return hospObj;
      },
      delete(hospId) {
        window.DEMO_DATA.hospitals = (
          window.DEMO_DATA.hospitals || []
        ).filter((h) => h.id !== hospId);
        autoSave("hospitals", "delete", { id: hospId });
      },
    },

    // ==========================================
    // Section: Product Lines Module
    // ==========================================
    productLines: {
      getAll() {
        return window.DEMO_DATA.productLines || [];
      },
      getById(id) {
        return (window.DEMO_DATA.productLines || []).find((l) => l.id === id);
      },
      findProductById(productId) {
        if (!productId) return null;
        const lines = this.getAll();
        for (const line of lines) {
          if (!Array.isArray(line.products)) continue;
          const prod = line.products.find((p) => p.id === productId);
          if (prod) return { line, product: prod };
        }
        return null;
      },
      /**
       * Records that `rawText` from `distributorId`'s sheets refers to
       * this specific product (e.g. "CHOLEROSE PLUS 10/20MG" from Ibn
       * Sina -> a real product in the Cardio line). Matching is
       * case/whitespace-insensitive but exact otherwise.
       */
      addProductAlias(lineId, productId, distributorId, rawText) {
        const line = this.getById(lineId);
        if (!line || !Array.isArray(line.products) || !rawText) return;
        const prod = line.products.find((p) => p.id === productId);
        if (!prod) return;
        if (!Array.isArray(prod.aliases)) prod.aliases = [];
        const normalized = String(rawText).trim().toLowerCase();
        const exists = prod.aliases.some(
          (al) =>
            al.distributorId === distributorId &&
            String(al.rawText).trim().toLowerCase() === normalized,
        );
        if (!exists) {
          prod.aliases.push({ distributorId, rawText: String(rawText).trim() });
        }
        autoSave("productLines", "addProductAlias", { lineId, productId, distributorId, rawText });
      },
      /**
       * Removes a product alias mapping and unassigns sales rows matched with it.
       */
      removeProductAlias(lineId, productId, distributorId, rawText) {
        const line = this.getById(lineId);
        if (!line || !Array.isArray(line.products) || !rawText) return false;
        const prod = line.products.find((p) => p.id === productId);
        if (!prod || !Array.isArray(prod.aliases)) return false;
        const normalized = String(rawText).trim().toLowerCase();
        const initialLen = prod.aliases.length;
        prod.aliases = prod.aliases.filter(
          (al) =>
            !(al.distributorId === distributorId && String(al.rawText).trim().toLowerCase() === normalized)
        );
        const removed = prod.aliases.length < initialLen;
        if (removed) {
          if (store.distributorSales && typeof store.distributorSales.unmatchProductAliasRows === "function") {
            store.distributorSales.unmatchProductAliasRows(distributorId, rawText);
          }
          autoSave("productLines", "removeProductAlias", { lineId, productId, distributorId, rawText });
        }
        return removed;
      },
      /**
       * Returns all active mapped product aliases across all lines.
       */
      getAllProductAliases() {
        const result = [];
        (window.DEMO_DATA.productLines || []).forEach((line) => {
          if (Array.isArray(line.products)) {
            line.products.forEach((prod) => {
              if (Array.isArray(prod.aliases)) {
                prod.aliases.forEach((al) => {
                  result.push({
                    lineId: line.id,
                    lineName: line.name,
                    productId: prod.id,
                    productName: prod.name,
                    distributorId: al.distributorId,
                    rawText: al.rawText,
                  });
                });
              }
            });
          }
        });
        return result;
      },
      /**
       * Finds the { line, product } pair (if any) whose product alias
       * list has this exact raw text for this distributor.
       */
      findProductByAlias(distributorId, rawText) {
        if (!rawText) return null;
        const normalized = String(rawText).trim().toLowerCase();
        const lines = window.DEMO_DATA.productLines || [];
        for (const line of lines) {
          if (!Array.isArray(line.products)) continue;
          const prod = line.products.find(
            (p) =>
              Array.isArray(p.aliases) &&
              p.aliases.some(
                (al) =>
                  al.distributorId === distributorId &&
                  String(al.rawText).trim().toLowerCase() === normalized,
              ),
          );
          if (prod) return { line, product: prod };
        }
        return null;
      },
      save(lineObj) {
        if (!window.DEMO_DATA.productLines) window.DEMO_DATA.productLines = [];
        const lines = window.DEMO_DATA.productLines;
        const idx = lines.findIndex((l) => l.id === lineObj.id);
        if (idx >= 0) {
          lines[idx] = { ...lines[idx], ...lineObj };
        } else {
          lines.push(lineObj);
        }
        autoSave("productLines", idx >= 0 ? "update" : "create", lineObj);
        return lineObj;
      },
      delete(lineId) {
        window.DEMO_DATA.productLines = (
          window.DEMO_DATA.productLines || []
        ).filter((l) => l.id !== lineId);
        autoSave("productLines", "delete", { id: lineId });
      },
    },

    get lines() {
      return this.productLines;
    },

    // ==========================================
    // Section: Bulk Weights Module (Brick Weight % per Product per Area)
    // Stores the weight percentage each brick/area receives from surplus
    // (Ceiling/Bulk) sales. Each record maps a (productId, areaId) pair
    // to a weight %. Used by distributorSales.applyCutPointAndBulk().
    // ==========================================
    bulkWeights: {
      getAll() {
        return window.DEMO_DATA.bulkWeights || [];
      },
      getByProduct(productId) {
        return this.getAll().filter((w) => w.productId === productId);
      },
      getByArea(areaId) {
        return this.getAll().filter((w) => w.areaId === areaId);
      },
      find(productId, areaId) {
        return this.getAll().find(
          (w) => w.productId === productId && w.areaId === areaId,
        );
      },
      save(weightObj) {
        if (!window.DEMO_DATA.bulkWeights) window.DEMO_DATA.bulkWeights = [];
        const weights = window.DEMO_DATA.bulkWeights;
        const idx = weights.findIndex((w) => w.id === weightObj.id);
        if (idx >= 0) {
          weights[idx] = { ...weights[idx], ...weightObj };
        } else {
          if (!weightObj.id) weightObj.id = "bw_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
          weights.push(weightObj);
        }
        autoSave("bulkWeights", idx >= 0 ? "update" : "create", weightObj);
        return weightObj;
      },
      saveAll(productId, entries) {
        // entries = [{ areaId, weight, lineId }]
        if (!window.DEMO_DATA.bulkWeights) window.DEMO_DATA.bulkWeights = [];
        // Remove existing weights for this product
        window.DEMO_DATA.bulkWeights = window.DEMO_DATA.bulkWeights.filter(
          (w) => w.productId !== productId,
        );
        // Add new weights
        entries.forEach((e) => {
          if (e.weight > 0) {
            window.DEMO_DATA.bulkWeights.push({
              id: "bw_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
              productId: productId,
              areaId: e.areaId,
              weight: parseFloat(e.weight) || 0,
              lineId: e.lineId || null,
            });
          }
        });
        autoSave("bulkWeights", "saveAll", { productId, count: entries.length });
      },
      delete(id) {
        if (!window.DEMO_DATA.bulkWeights) return false;
        const before = window.DEMO_DATA.bulkWeights.length;
        window.DEMO_DATA.bulkWeights = window.DEMO_DATA.bulkWeights.filter((w) => w.id !== id);
        const changed = window.DEMO_DATA.bulkWeights.length !== before;
        if (changed) autoSave("bulkWeights", "delete", { id });
        return changed;
      },
    },

    // ==========================================
    // Section: Specialties Module
    // ==========================================
    specialties: {
      getAll() {
        return window.DEMO_DATA.specialties || [];
      },
      getById(id) {
        return (window.DEMO_DATA.specialties || []).find((s) => s.id === id);
      },
      save(specObj) {
        if (!window.DEMO_DATA.specialties) window.DEMO_DATA.specialties = [];
        const specs = window.DEMO_DATA.specialties;
        const idx = specs.findIndex((s) => s.id === specObj.id);
        if (idx >= 0) {
          specs[idx] = { ...specs[idx], ...specObj };
        } else {
          specs.push(specObj);
        }
        autoSave("specialties", idx >= 0 ? "update" : "create", specObj);
        return specObj;
      },
      delete(id) {
        window.DEMO_DATA.specialties = (
          window.DEMO_DATA.specialties || []
        ).filter((s) => s.id !== id);
        autoSave("specialties", "delete", { id });
      },
    },

    getDoctorCallTarget(doc) {
      if (typeof window.getDoctorCallTarget === "function") {
        return window.getDoctorCallTarget(doc);
      }
      return (doc && doc.class === "A") ? 4 : 3;
    },

    // ==========================================
    // Section: Distributors Module
    // (e.g. "Ibn Sina", "Tender Ibn Sina", "Overseas" -- Commercial and
    // Tender channels are separate distributor records, matching how the
    // real CRM lists them, distinguished by the `type` field below.)
    // ==========================================
    distributors: {
      getAll() {
        return window.DEMO_DATA.distributors || [];
      },
      getById(id) {
        return (window.DEMO_DATA.distributors || []).find(
          (d) => d.id === id,
        );
      },
      /**
       * "commercial" or "tender". Defaults to "commercial" for older
       * records saved before this field existed.
       */
      getType(id) {
        const d = this.getById(id);
        return d && d.type === "tender" ? "tender" : "commercial";
      },
      save(distObj) {
        if (!window.DEMO_DATA.distributors) window.DEMO_DATA.distributors = [];
        const dists = window.DEMO_DATA.distributors;
        const idx = dists.findIndex((d) => d.id === distObj.id);
        if (idx >= 0) {
          dists[idx] = { ...dists[idx], ...distObj };
        } else {
          dists.push(distObj);
        }
        autoSave("distributors", idx >= 0 ? "update" : "create", distObj);
        return distObj;
      },
      delete(distId) {
        window.DEMO_DATA.distributors = (
          window.DEMO_DATA.distributors || []
        ).filter((d) => d.id !== distId);
        autoSave("distributors", "delete", { id: distId });
      },
    },

    // ==========================================
    // Section: Targets Module
    // One manually-set target per (repId, productId, month), entered by
    // an Admin against an individual rep. There is no separate target
    // stored for DM/LM/BU -- their "target" for a product/month is just
    // the sum of their team's rep-level targets, which falls out
    // naturally from summing rows in the Sales report once every rep's
    // target is represented there (see sales-report.js's phantom-row
    // logic for targets with no matching sales yet).
    // ==========================================
    targets: {
      getAll() {
        return window.DEMO_DATA.targets || [];
      },
      getById(id) {
        return this.getAll().find((t) => t.id === id);
      },
      find(repId, productId, month) {
        return this.getAll().find(
          (t) => t.repId === repId && t.productId === productId && t.month === month,
        );
      },
      getValue(repId, productId, month) {
        const t = this.find(repId, productId, month);
        return t ? parseFloat(t.target) || 0 : 0;
      },
      /**
       * Upserts by (repId, productId, month) -- saving a target for a
       * combination that already has one updates it in place rather than
       * creating a duplicate row.
       */
      save(targetObj) {
        if (!window.DEMO_DATA.targets) window.DEMO_DATA.targets = [];
        const list = window.DEMO_DATA.targets;
        const idx = list.findIndex(
          (t) =>
            t.id === targetObj.id ||
            (t.repId === targetObj.repId &&
              t.productId === targetObj.productId &&
              t.month === targetObj.month),
        );
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...targetObj, id: list[idx].id };
        } else {
          list.push({ ...targetObj, id: targetObj.id || "target_" + Date.now() });
        }
        autoSave("targets", idx >= 0 ? "update" : "create", targetObj);
        return idx >= 0 ? list[idx] : list[list.length - 1];
      },
      delete(id) {
        window.DEMO_DATA.targets = (window.DEMO_DATA.targets || []).filter((t) => t.id !== id);
        autoSave("targets", "delete", { id });
      },
    },

    // ==========================================
    // Section: Import Batches Module
    // One record per (distributorId, month) upload -- lets the upload
    // flow detect "you already uploaded this distributor's data for this
    // month" and offer to replace it instead of silently double-counting.
    // ==========================================
    importBatches: {
      getAll() {
        return window.DEMO_DATA.importBatches || [];
      },
      getById(id) {
        return this.getAll().find((b) => b.id === id);
      },
      find(distributorId, month, fileName = null) {
        if (fileName) {
          return this.getAll().find(
            (b) => b.distributorId === distributorId && b.month === month && b.fileName === fileName,
          );
        }
        return this.getAll().find(
          (b) => b.distributorId === distributorId && b.month === month,
        );
      },
      save(batchObj) {
        if (!window.DEMO_DATA.importBatches) window.DEMO_DATA.importBatches = [];
        const list = window.DEMO_DATA.importBatches;
        const idx = list.findIndex((b) => b.id === batchObj.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...batchObj };
        } else {
          list.push({ ...batchObj, id: batchObj.id || "batch_" + Date.now() });
        }
        autoSave("importBatches", idx >= 0 ? "update" : "create", batchObj);
        return idx >= 0 ? list[idx] : list[list.length - 1];
      },
      delete(id) {
        window.DEMO_DATA.importBatches = (window.DEMO_DATA.importBatches || []).filter(
          (b) => b.id !== id,
        );
        autoSave("importBatches", "delete", { id });
      },
    },

    // ==========================================
    // Section: Distributor Sales Module (pharmacy-level raw imports)
    // Each row = one pharmacy + one product + one value (+ optional
    // quantity), straight from a distributor's sheet via that
    // distributor's saved columnMap. Returns/credit notes are kept as
    // negative `value` rows (not dropped), so summing a set of rows
    // nets them out automatically. Rows start unassigned (repId/areaId
    // null); applyAreaMatching() below fills those in once an alias
    // exists for their (distributorId, areaRaw) pair via
    // areas.addAlias(). This table is still separate from the rep-based
    // Sales report (REPORTS_DATA.sales / DEMO_DATA.sales) -- matching a
    // row to a rep doesn't yet make it appear there.
    // ==========================================
    distributorSales: {
      getAll() {
        return window.DEMO_DATA.distributorSales || [];
      },
      getByDistributor(distributorId) {
        return this.getAll().filter((s) => s.distributorId === distributorId);
      },
      getUnassigned() {
        return this.getAll().filter((s) => !s.repId);
      },
      /**
       * Removes every row tagged with this batchId -- used when the admin
       * chooses to replace a previous upload for the same
       * distributor+month instead of adding to it.
       */
      deleteByBatch(batchId) {
        const before = this.getAll().length;
        window.DEMO_DATA.distributorSales = this.getAll().filter(
          (s) => s.batchId !== batchId,
        );
        autoSave("distributorSales", "deleteByBatch", { batchId });
        return before - this.getAll().length;
      },
      addBatch(rows) {
        if (!window.DEMO_DATA.distributorSales) window.DEMO_DATA.distributorSales = [];
        window.DEMO_DATA.distributorSales.push(...rows);
        this.applyProductMatching(false);
        this.applyAreaMatching(false, false);
        // Apply Bulk/Ceiling distribution after matching
        this.applyCutPointAndBulk();
        autoSave("distributorSales", "importBatch", { count: rows.length });
      },
      /**
       * Distinct (distributorId, areaRaw) pairs among still-unassigned
       * rows that have no alias yet -- these need an admin to pick the
       * real Area for them once, via areas.addAlias().
       */
      getPendingAreaTexts() {
        const rows = this.getAll().filter((s) => !s.repId && s.areaRaw);
        const seen = {};
        const pending = [];
        rows.forEach((row) => {
          if (store.areas.findByAliasText(row.distributorId, row.areaRaw)) return;
          if (typeof store.areas.findByBrickName === "function" && store.areas.findByBrickName(row.areaRaw)) return;
          const key = row.distributorId + "||" + row.areaRaw.trim().toLowerCase();
          if (seen[key]) {
            seen[key].count++;
            return;
          }
          const entry = { distributorId: row.distributorId, areaRaw: row.areaRaw, count: 1 };
          seen[key] = entry;
          pending.push(entry);
        });
        return pending;
      },
      /**
       * Attributes every still-unassigned row to a rep wherever its
       * (distributorId, areaRaw) now has a matching alias -- filling in
       * areaId, repId, and (via the rep's own manager chain) dmId/lmId.
       *
       * LINE-AWARE & PHARMACY-OVERRIDE MATCHING:
       * 1. High-priority: Checks store.pharmacyOverrides to see if this specific pharmacy
       *    (by code/name) has a custom territory override assigned for this distributor and month.
       * 2. Secondary: If no pharmacy override matched, falls back to raw area text alias matching
       *    (scoped to line if lineId is known).
       */
      applyAreaMatching(forceAll = false, shouldAutoSave = true) {
        const rows = this.getAll().filter(
          (s) => (forceAll || !s.repId || (s.productId && s.lineId && s.areaId)) && (s.areaRaw || s.pharmacyCode || s.pharmacyName)
        );
        let matchedCount = 0;
        rows.forEach((row) => {
          let area = null;
          const rowMonth = row.month || (row.date ? String(row.date).slice(0, 7) : null);

          // Synchronize row.lineId with product if productId is present
          if (row.productId) {
            const pMatch = store.productLines.findProductById(row.productId);
            if (pMatch && pMatch.line) {
              row.lineId = pMatch.line.id;
            }
          }
          const rowLineId = row.lineId || null;

          // 1. High-priority check for pharmacy override (line-aware)
          if (store.pharmacyOverrides) {
            const override = store.pharmacyOverrides.findMatch(
              row.distributorId,
              row.pharmacyCode,
              row.pharmacyName,
              rowMonth,
              rowLineId
            );
            if (override && override.areaId) {
              const candArea = store.areas.getById(override.areaId);
              if (candArea && (!rowLineId || candArea.lineId === rowLineId)) {
                area = candArea;
              }
            }
          }

          // 2. Fallback to raw sheet territory text alias matching (MUST stay within line if known)
          if (!area && row.areaRaw) {
            if (rowLineId) {
              area = store.areas.findByAliasTextForLine(row.distributorId, row.areaRaw, rowLineId);
            } else {
              area = store.areas.findByAliasText(row.distributorId, row.areaRaw);
            }
          }

          // 2b. Fallback to assigned IMS Bricks matching (line-aware)
          if (!area && row.areaRaw && typeof store.areas.findByBrickNameForLine === "function") {
            if (rowLineId) {
              area = store.areas.findByBrickNameForLine(row.areaRaw, rowLineId);
            } else {
              area = store.areas.findByBrickName(row.areaRaw);
            }
          }

          // 3. Fallback: If row already has areaId, verify line match
          if (!area && row.areaId) {
            const candArea = store.areas.getById(row.areaId);
            if (candArea && (!rowLineId || candArea.lineId === rowLineId)) {
              area = candArea;
            }
          }

          if (!area) {
            // Clean up any historical mismatch where row was assigned to an area of a different line
            if (row.areaId && rowLineId) {
              const prevArea = store.areas.getById(row.areaId);
              if (prevArea && prevArea.lineId && prevArea.lineId !== rowLineId) {
                row.areaId = null;
                row.repId = null;
                row.dmId = null;
                row.lmId = null;
              }
            }
            return;
          }

          // Strict line guard: never assign an area from a different line
          if (rowLineId && area.lineId && area.lineId !== rowLineId) {
            return;
          }

          row.areaId = area.id;
          row.repId = area.repId || null;
          if (!row.lineId && area.lineId) {
            row.lineId = area.lineId;
          }
          const rep = area.repId ? store.users.getById(area.repId) : null;
          const dmId = rep ? rep.managerId || null : null;
          row.dmId = dmId;
          const dm = dmId ? store.users.getById(dmId) : null;
          row.lmId = dm ? dm.managerId || null : null;
          matchedCount++;
        });
        if (matchedCount && shouldAutoSave) {
          autoSave("distributorSales", "applyAreaMatching", { matchedCount });
        }
        return matchedCount;
      },

      /**
       * Retroactively applies a pharmacy territory override to existing sales rows
       * according to the specified effective retroactive scope.
       */
      applyPharmacyOverride(override) {
        if (!override || !override.distributorId || !override.areaId) return 0;
        const area = store.areas.getById(override.areaId);
        if (!area) return 0;

        const rep = area.repId ? store.users.getById(area.repId) : null;
        const dmId = rep ? rep.managerId || null : null;
        const dm = dmId ? store.users.getById(dmId) : null;
        const lmId = dm ? dm.managerId || null : null;

        const cleanCode = String(override.pharmacyCode || "").trim().toLowerCase();
        const cleanName = String(override.pharmacyName || "").trim().toLowerCase();

        let updatedCount = 0;
        this.getAll().forEach((row) => {
          if (row.distributorId !== override.distributorId) return;

          let matches = false;
          if (cleanCode && row.pharmacyCode) {
            matches = String(row.pharmacyCode).trim().toLowerCase() === cleanCode;
          } else if (cleanName && row.pharmacyName) {
            matches = String(row.pharmacyName).trim().toLowerCase() === cleanName;
          }
          if (!matches) return;

          // Only apply override to rows of the same line (if area belongs to a specific line)
          if (area.lineId && row.lineId && row.lineId !== area.lineId) return;

          // Check effective retroactive scope
          const rowMonth = row.month || (row.date ? String(row.date).slice(0, 7) : null);
          if (override.effectiveScope === "future_only") {
            return;
          }
          if (override.effectiveScope === "from_month" && override.effectiveFromMonth) {
            if (rowMonth && rowMonth < override.effectiveFromMonth) return;
          }

          row.areaId = area.id;
          row.repId = area.repId || null;
          row.dmId = dmId;
          row.lmId = lmId;
          updatedCount++;
        });

        if (updatedCount > 0) {
          autoSave("distributorSales", "applyPharmacyOverride", {
            overrideId: override.id,
            updatedCount,
          });
        }
        return updatedCount;
      },

      /**
       * Reverts sales rows affected by a deleted pharmacy override back to standard alias matching.
       */
      revertPharmacyOverride(override) {
        if (!override || !override.distributorId) return 0;
        const cleanCode = String(override.pharmacyCode || "").trim().toLowerCase();
        const cleanName = String(override.pharmacyName || "").trim().toLowerCase();
        const overrideArea = override.areaId && store.areas ? store.areas.getById(override.areaId) : null;

        let revertedCount = 0;
        this.getAll().forEach((row) => {
          if (row.distributorId !== override.distributorId) return;

          let matches = false;
          if (cleanCode && row.pharmacyCode) {
            matches = String(row.pharmacyCode).trim().toLowerCase() === cleanCode;
          } else if (cleanName && row.pharmacyName) {
            matches = String(row.pharmacyName).trim().toLowerCase() === cleanName;
          }
          if (!matches) return;

          // Only revert if row belongs to the overridden line
          if (overrideArea && overrideArea.lineId && row.lineId && row.lineId !== overrideArea.lineId) return;

          // Only revert rows that match the scope of this override
          const rowMonth = row.month || (row.date ? String(row.date).slice(0, 7) : null);
          if (override.effectiveScope === "future_only") {
            if (override.createdMonth && rowMonth && rowMonth < override.createdMonth) return;
          } else if (override.effectiveScope === "from_month" && override.effectiveFromMonth) {
            if (rowMonth && rowMonth < override.effectiveFromMonth) return;
          }

          // Only revert if row was assigned to the overridden area
          if (override.areaId && row.areaId !== override.areaId) return;

          row.areaId = null;
          row.repId = null;
          row.dmId = null;
          row.lmId = null;
          revertedCount++;
        });

        // Re-run standard matching on unassigned rows to restore alias mapping
        this.applyAreaMatching(false, true);
        return revertedCount;
      },
      /**
       * Re-attributes all sales rows assigned to an area when that area's assigned
       * medical representative is changed by Admin.
       */
      rematchAreaSales(areaId, newRepId, effectiveFromMonth = null) {
        if (!areaId) return 0;
        const rep = newRepId ? store.users.getById(newRepId) : null;
        const dmId = rep ? rep.managerId || null : null;
        const dm = dmId ? store.users.getById(dmId) : null;
        const lmId = dm ? dm.managerId || null : null;

        const currentMonth = (typeof window.getSystemTodayStr === "function" ? window.getSystemTodayStr() : new Date().toISOString().split("T")[0]).slice(0, 7);
        const cutoffMonth = effectiveFromMonth || currentMonth;

        let updatedCount = 0;
        this.getAll().forEach((row) => {
          if (row.areaId === areaId) {
            const rowMonth = row.month || (row.date ? String(row.date).slice(0, 7) : null);
            if (!effectiveFromMonth || !rowMonth || rowMonth >= effectiveFromMonth) {
              row.repId = newRepId || null;
              row.dmId = dmId;
              row.lmId = lmId;
              updatedCount++;
            }
          }
        });
        if (updatedCount) {
          autoSave("distributorSales", "rematchAreaSales", { areaId, newRepId, updatedCount });
        }
        return updatedCount;
      },
      /**
       * Clears areaId, repId, dmId, lmId on sales rows matched with this distributor
       * and raw territory text when an alias is removed.
       */
      unmatchAliasRows(distributorId, rawText) {
        if (!distributorId || !rawText) return 0;
        const normalized = String(rawText).trim().toLowerCase();
        let unlinkedCount = 0;
        this.getAll().forEach((row) => {
          if (
            row.distributorId === distributorId &&
            String(row.areaRaw || "").trim().toLowerCase() === normalized
          ) {
            row.areaId = null;
            row.repId = null;
            row.dmId = null;
            row.lmId = null;
            unlinkedCount++;
          }
        });
        if (unlinkedCount) {
          autoSave("distributorSales", "unmatchAliasRows", { distributorId, rawText, unlinkedCount });
        }
        return unlinkedCount;
      },
      /**
       * Clears lineId and productId on sales rows matched with this distributor
       * and raw product text when a product alias is removed.
       */
      unmatchProductAliasRows(distributorId, rawText) {
        if (!distributorId || !rawText) return 0;
        const normalized = String(rawText).trim().toLowerCase();
        let unlinkedCount = 0;
        this.getAll().forEach((row) => {
          if (
            row.distributorId === distributorId &&
            String(row.productRaw || "").trim().toLowerCase() === normalized
          ) {
            row.lineId = null;
            row.productId = null;
            unlinkedCount++;
          }
        });
        if (unlinkedCount) {
          autoSave("distributorSales", "unmatchProductAliasRows", { distributorId, rawText, unlinkedCount });
        }
        return unlinkedCount;
      },
      /**
       * Distinct (distributorId, product-raw-text) pairs among rows with
       * no resolved Line yet and no product alias -- these need an admin
       * to pick the real product for them once, via
       * productLines.addProductAlias().
       */
      getPendingProductTexts() {
        const rows = this.getAll().filter((s) => !s.lineId && s.product);
        const seen = {};
        const pending = [];
        rows.forEach((row) => {
          if (store.productLines.findProductByAlias(row.distributorId, row.product)) return;
          const key = row.distributorId + "||" + row.product.trim().toLowerCase();
          if (seen[key]) {
            seen[key].count++;
            return;
          }
          const entry = { distributorId: row.distributorId, productRaw: row.product, count: 1 };
          seen[key] = entry;
          pending.push(entry);
        });
        return pending;
      },
      /**
       * Fills in lineId (and productId) on every row whose raw product
       * text now has a matching alias. Doesn't touch repId/areaId --
       * product matching and area matching are independent and can
       * resolve in either order.
       */
      applyProductMatching(shouldAutoSave = true) {
        const rows = this.getAll().filter((s) => (!s.productId || !s.lineId) && s.product);
        let matchedCount = 0;
        rows.forEach((row) => {
          const match = store.productLines.findProductByAlias(row.distributorId, row.product);
          if (!match) return;
          row.lineId = match.line.id;
          row.productId = match.product.id;

          // If row was previously assigned to an area from a different line, clear it
          if (row.areaId) {
            const assignedArea = store.areas.getById(row.areaId);
            if (assignedArea && assignedArea.lineId && assignedArea.lineId !== match.line.id) {
              row.areaId = null;
              row.repId = null;
              row.dmId = null;
              row.lmId = null;
            }
          }
          matchedCount++;
        });
        if (matchedCount && shouldAutoSave) {
          autoSave("distributorSales", "applyProductMatching", { matchedCount });
        }
        return matchedCount;
      },

      /**
       * Removes all previously generated Bulk rows so they can be
       * recalculated cleanly. Bulk rows are identified by salesType === "bulk".
       */
      removeBulkRows() {
        if (!window.DEMO_DATA.distributorSales) return 0;
        const before = window.DEMO_DATA.distributorSales.length;
        window.DEMO_DATA.distributorSales = window.DEMO_DATA.distributorSales.filter(
          (s) => s.salesType !== "bulk",
        );
        // Reset salesType markers on remaining private rows
        window.DEMO_DATA.distributorSales.forEach((s) => {
          delete s.salesType;
          delete s.bulkWeight;
          delete s.originalSaleId;
          delete s.cappedQty;
        });
        return before - window.DEMO_DATA.distributorSales.length;
      },

      /**
       * Core Bulk/Ceiling Engine.
       * For each product with a cutPoint > 0:
       *   1. Groups sales by (pharmacyCode+pharmacyName, month) to find total.
       *   2. If total > cutPoint: caps at cutPoint (Private), surplus is distributed
       *      to all bricks in the same line by their weight percentage (Bulk).
       *   3. If total <= cutPoint: marks as Private (Normal).
       *
       * Generated Bulk rows carry salesType:"bulk", bulkWeight, originalSaleId.
       * Original rows carry salesType:"private".
       */
      applyCutPointAndBulk() {
        const allSales = this.getAll();
        if (!allSales.length) return { processedProducts: 0, bulkRowsCreated: 0 };

        // 1. Remove any previously generated bulk rows
        this.removeBulkRows();

        const sales = this.getAll(); // re-read after cleanup
        const allLines = store.productLines.getAll();
        const allWeights = store.bulkWeights.getAll();
        const allAreas = store.areas.getAll();

        // Build product map: productId -> { cutPoint, lineId }
        const productMap = {};
        allLines.forEach((line) => {
          if (!Array.isArray(line.products)) return;
          line.products.forEach((prod) => {
            productMap[prod.id] = {
              cutPoint: parseFloat(prod.cutPoint) || 0,
              lineId: line.id,
              name: prod.name,
            };
          });
        });

        let processedProducts = 0;
        let bulkRowsCreated = 0;
        const newBulkRows = [];

        // 2. For each product that has a cutPoint > 0
        Object.entries(productMap).forEach(([productId, pInfo]) => {
          if (pInfo.cutPoint <= 0) return;

          // Get weights for this product
          const weights = allWeights.filter((w) => w.productId === productId);
          if (!weights.length) return; // No weights configured, skip

          processedProducts++;

          // 3. Filter sales rows for this product
          const prodSales = sales.filter((s) => s.productId === productId);
          if (!prodSales.length) return;

          // 4. Group by (pharmacy identity + month) to find total per pharmacy per month
          const pharmacyMonthGroups = {};
          prodSales.forEach((s) => {
            // Build pharmacy key from code+name for reliable identity
            const pharmKey = (s.pharmacyCode || "").trim().toLowerCase() + "||" +
                             (s.pharmacyName || "").trim().toLowerCase();
            const groupKey = pharmKey + "||" + (s.month || "");
            if (!pharmacyMonthGroups[groupKey]) {
              pharmacyMonthGroups[groupKey] = {
                rows: [],
                totalQty: 0,
                totalValue: 0,
                month: s.month,
              };
            }
            const g = pharmacyMonthGroups[groupKey];
            g.rows.push(s);
            g.totalQty += parseFloat(s.quantity) || 0;
            g.totalValue += parseFloat(s.value) || 0;
          });

          // 5. Process each pharmacy-month group
          Object.values(pharmacyMonthGroups).forEach((group) => {
            const { rows, totalQty, totalValue } = group;
            // Skip groups with negative or zero totals (returns/credits)
            if (totalQty <= 0 && totalValue <= 0) {
              rows.forEach((r) => { r.salesType = "private"; });
              return;
            }

            // Determine if the pharmacy exceeded the cutPoint
            // cutPoint is compared against quantity (units) when available, otherwise value
            const hasQty = rows.some((r) => r.quantity !== null && r.quantity !== undefined);
            const comparisonValue = hasQty ? totalQty : totalValue;
            const cutPoint = pInfo.cutPoint;

            if (comparisonValue <= cutPoint) {
              // Within cutPoint — all Private
              rows.forEach((r) => { r.salesType = "private"; });
              return;
            }

            // 6. Exceeds cutPoint — calculate surplus
            const surplus = comparisonValue - cutPoint;
            const surplusRatio = surplus / comparisonValue;

            // Mark original rows as Private with capped quantities
            rows.forEach((r) => {
              r.salesType = "private";
              const rowQty = parseFloat(r.quantity) || 0;
              const rowValue = parseFloat(r.value) || 0;
              if (hasQty) {
                r.cappedQty = r.quantity;
                r.quantity = Math.round((rowQty * (1 - surplusRatio)) * 100) / 100;
                r.value = Math.round((rowValue * (1 - surplusRatio)) * 100) / 100;
              } else {
                r.cappedQty = r.value;
                r.value = Math.round((rowValue * (1 - surplusRatio)) * 100) / 100;
              }
            });

            // 7. Distribute surplus to each brick by weight %
            weights.forEach((w) => {
              const targetArea = allAreas.find((a) => a.id === w.areaId);
              const shareQty = hasQty ? Math.round((surplus * (w.weight / 100)) * 100) / 100 : null;
              const shareValue = hasQty
                ? Math.round(((totalValue * surplusRatio) * (w.weight / 100)) * 100) / 100
                : Math.round((surplus * (w.weight / 100)) * 100) / 100;

              if ((shareQty !== null && shareQty === 0) && shareValue === 0) return;

              newBulkRows.push({
                id: "bulk_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
                salesType: "bulk",
                bulkWeight: w.weight,
                originalSaleId: rows[0].id,
                batchId: rows[0].batchId,
                distributorId: rows[0].distributorId,
                month: group.month,
                date: rows[0].date,
                product: pInfo.name,
                productId: productId,
                lineId: pInfo.lineId,
                pharmacyCode: rows[0].pharmacyCode,
                pharmacyName: rows[0].pharmacyName,
                areaRaw: targetArea ? targetArea.name : "",
                areaId: w.areaId,
                repId: targetArea ? (targetArea.repId || null) : null,
                dmId: null,
                lmId: null,
                quantity: shareQty,
                value: shareValue,
              });
              bulkRowsCreated++;
            });
          });
        });

        // 8. Mark remaining rows that have no salesType as private
        this.getAll().forEach((s) => {
          if (!s.salesType) s.salesType = "private";
        });

        // 9. Append all generated Bulk rows
        if (newBulkRows.length > 0) {
          if (!window.DEMO_DATA.distributorSales) window.DEMO_DATA.distributorSales = [];
          window.DEMO_DATA.distributorSales.push(...newBulkRows);

          // Resolve DM/LM hierarchy for bulk rows
          newBulkRows.forEach((r) => {
            if (r.repId) {
              const rep = store.users.getById(r.repId);
              if (rep) {
                r.dmId = rep.managerId || null;
                if (r.dmId) {
                  const dm = store.users.getById(r.dmId);
                  r.lmId = dm ? (dm.managerId || null) : null;
                }
              }
            }
          });
        }

        autoSave("distributorSales", "applyCutPointAndBulk", {
          processedProducts,
          bulkRowsCreated,
        });

        return { processedProducts, bulkRowsCreated };
      },
    },

    // ==========================================
    // Section: Leaves Module
    // ==========================================
    leaves: {
      getAll() {
        return window.DEMO_DATA.leaves || [];
      },
      getById(id) {
        return (window.DEMO_DATA.leaves || []).find((l) => l.id === id);
      },
      add(leaveObj) {
        if (!window.DEMO_DATA.leaves) window.DEMO_DATA.leaves = [];
        window.DEMO_DATA.leaves.unshift(leaveObj);
        autoSave("leaves", "create", leaveObj);
        return leaveObj;
      },
      update(leaveId, updates) {
        const l = this.getById(leaveId);
        if (!l) return null;
        Object.assign(l, updates);
        autoSave("leaves", "update", l);
        return l;
      },
      delete(id) {
        if (!window.DEMO_DATA.leaves) return false;
        const before = window.DEMO_DATA.leaves.length;
        window.DEMO_DATA.leaves = window.DEMO_DATA.leaves.filter((l) => l.id !== id);
        const changed = window.DEMO_DATA.leaves.length !== before;
        if (changed) autoSave("leaves", "delete", { id });
        return changed;
      },
    },

    // ==========================================
    // Section: Company Settings Module
    // ==========================================
    companySettings: {
      get() {
        if (!window.DEMO_DATA.companySettings) {
          try {
            const cached = localStorage.getItem("pharma_company_settings");
            if (cached) {
              window.DEMO_DATA.companySettings = JSON.parse(cached);
            }
          } catch (e) {}
        }
        if (!window.DEMO_DATA.companySettings) {
          window.DEMO_DATA.companySettings = {
            requireGpsValidation: true,
            gpsMaxDistanceMeters: 200,
            minPmVisitsPerDay: 4,
            allowLeaveRollover: true,
            leaveRolloverGraceMonths: 3,
            leaveRolloverMaxDays: 5,
            isThursdayWeekend: false,
            visitBacklogLimitDays: 2,
            plannedVisitExpiryDays: 7,
            branding: {
              logoUrl: "images/pharma-icon-192.png",
              taglineEn: "Empowering Medical Representatives",
              taglineAr: "نمكّن المناديب الطبيين",
              descEn: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
              descAr: "قم بتبسيط سير عملك وإدارة علاقاتك وتعزيز الأداء مع حل إدارة علاقات العملاء الشامل لدينا.",
              gradient: "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)"
            }
          };
        } else {
          if (window.DEMO_DATA.companySettings.allowLeaveRollover === undefined) {
            window.DEMO_DATA.companySettings.allowLeaveRollover = true;
          }
          if (window.DEMO_DATA.companySettings.leaveRolloverGraceMonths === undefined) {
            window.DEMO_DATA.companySettings.leaveRolloverGraceMonths = 3;
          }
          if (window.DEMO_DATA.companySettings.leaveRolloverMaxDays === undefined) {
            window.DEMO_DATA.companySettings.leaveRolloverMaxDays = 5;
          }
          if (window.DEMO_DATA.companySettings.isThursdayWeekend === undefined) {
            window.DEMO_DATA.companySettings.isThursdayWeekend = false;
          }
          if (window.DEMO_DATA.companySettings.visitBacklogLimitDays === undefined) {
            window.DEMO_DATA.companySettings.visitBacklogLimitDays = 2;
          }
          if (window.DEMO_DATA.companySettings.plannedVisitExpiryDays === undefined) {
            window.DEMO_DATA.companySettings.plannedVisitExpiryDays = 7;
          }
          if (!window.DEMO_DATA.companySettings.branding) {
            window.DEMO_DATA.companySettings.branding = {
              logoUrl: "images/pharma-icon-192.png",
              taglineEn: "Empowering Medical Representatives",
              taglineAr: "نمكّن المناديب الطبيين",
              descEn: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
              descAr: "قم بتبسيط سير عملك وإدارة علاقاتك وتعزيز الأداء مع حل إدارة علاقات العملاء الشامل لدينا.",
              gradient: "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)"
            };
          }
        }
        return window.DEMO_DATA.companySettings;
      },
      update(updates) {
        const current = this.get();
        Object.assign(current, updates);
        try {
          localStorage.setItem(
            "pharma_company_settings",
            JSON.stringify(current),
          );
        } catch (e) {}
        autoSave("companySettings", "update", current);
        return current;
      },
    },

    // ==========================================
    // Section: Workflow Notifications Module
    // ==========================================
    notifications: {
      getAll() {
        return window.DEMO_DATA.notifications || [];
      },
      getForUser(userId) {
        if (!window.DEMO_DATA.notifications) window.DEMO_DATA.notifications = [];
        return window.DEMO_DATA.notifications.filter(
          (n) => n.userId === userId || n.userId === "all"
        );
      },
      getUnreadCount(userId) {
        return this.getForUser(userId).filter((n) => !n.read).length;
      },
      add(notif) {
        if (!window.DEMO_DATA.notifications) window.DEMO_DATA.notifications = [];
        const fullNotif = {
          id: notif.id || ("notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000)),
          userId: notif.userId || "rep1",
          type: notif.type || "system",
          title: notif.title || "إشعار جديد",
          titleEn: notif.titleEn || notif.title || "Notification",
          message: notif.message || "",
          messageEn: notif.messageEn || notif.message || "",
          note: notif.note || null,
          link: notif.link || "#",
          read: false,
          createdAt: notif.createdAt || new Date().toISOString(),
          icon: notif.icon || "🔔",
          badgeClass: notif.badgeClass || "bg-primary",
          actorName: notif.actorName || null,
          action: notif.action || null,
        };
        window.DEMO_DATA.notifications.unshift(fullNotif);
        autoSave("notifications", "create", fullNotif);
        if (typeof window.updateWorkflowNotifUI === "function") {
          window.updateWorkflowNotifUI();
        }
        return fullNotif;
      },
      markAsRead(notifId) {
        const notif = (window.DEMO_DATA.notifications || []).find((n) => n.id === notifId);
        if (notif) {
          notif.read = true;
          autoSave("notifications", "update", notif);
          if (typeof window.updateWorkflowNotifUI === "function") {
            window.updateWorkflowNotifUI();
          }
        }
        return notif;
      },
      markAllAsRead(userId) {
        let modified = false;
        (window.DEMO_DATA.notifications || []).forEach((n) => {
          if ((n.userId === userId || n.userId === "all") && !n.read) {
            n.read = true;
            modified = true;
          }
        });
        if (modified) {
          autoSave("notifications", "markAllRead", { userId });
          if (typeof window.updateWorkflowNotifUI === "function") {
            window.updateWorkflowNotifUI();
          }
        }
      },
      remove(notifId) {
        if (!window.DEMO_DATA.notifications) return false;
        const initialLen = window.DEMO_DATA.notifications.length;
        window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
          (n) => n.id !== notifId
        );
        if (window.DEMO_DATA.notifications.length < initialLen) {
          autoSave("notifications", "delete", { id: notifId });
          if (typeof window.updateWorkflowNotifUI === "function") {
            window.updateWorkflowNotifUI();
          }
          return true;
        }
        return false;
      },
      clearAll(userId) {
        if (!window.DEMO_DATA.notifications) return;
        window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
          (n) => n.userId !== userId && n.userId !== "all"
        );
        autoSave("notifications", "clearAll", { userId });
        if (typeof window.updateWorkflowNotifUI === "function") {
          window.updateWorkflowNotifUI();
        }
      },
    },

    // ==========================================
    // Section: Daily Activities Module
    // ==========================================
    activities: {
      getStorageKey(userId) {
        return `pharma_activities_data_${userId || "rep1"}`;
      },
      getAllForUser(userId) {
        const uid = userId || "rep1";
        if (!window.DEMO_DATA._activitiesByUser) {
          window.DEMO_DATA._activitiesByUser = {};
        }
        if (!window.DEMO_DATA._activitiesByUser[uid]) {
          try {
            const raw = localStorage.getItem(this.getStorageKey(uid));
            window.DEMO_DATA._activitiesByUser[uid] = raw ? JSON.parse(raw) : {};
          } catch (e) {
            window.DEMO_DATA._activitiesByUser[uid] = {};
          }
        }
        return window.DEMO_DATA._activitiesByUser[uid];
      },
      get(userId, dateStr) {
        const userActivities = this.getAllForUser(userId);
        return userActivities[dateStr] || {};
      },
      save(userId, dateStr, period, activityData) {
        const uid = userId || "rep1";
        const userActivities = this.getAllForUser(uid);
        if (!userActivities[dateStr]) {
          userActivities[dateStr] = {};
        }
        userActivities[dateStr][period] = activityData;
        try {
          localStorage.setItem(this.getStorageKey(uid), JSON.stringify(userActivities));
        } catch (e) {}
        autoSave("activities", "save", { userId: uid, date: dateStr, period, activityData });
        return userActivities[dateStr][period];
      },
      delete(userId, dateStr, period) {
        const uid = userId || "rep1";
        const userActivities = this.getAllForUser(uid);
        if (userActivities[dateStr] && userActivities[dateStr][period]) {
          delete userActivities[dateStr][period];
          if (Object.keys(userActivities[dateStr]).length === 0) {
            delete userActivities[dateStr];
          }
          try {
            localStorage.setItem(this.getStorageKey(uid), JSON.stringify(userActivities));
          } catch (e) {}
          autoSave("activities", "delete", { userId: uid, date: dateStr, period });
          return true;
        }
        return false;
      }
    },

    // ==========================================
    // Section: Request Expenses Module
    // ==========================================
    expenses: {
      STORAGE_KEY: "pharma_expenses_data",
      getAll() {
        if (!Array.isArray(window.DEMO_DATA.expenses)) {
          try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            window.DEMO_DATA.expenses = raw ? JSON.parse(raw) : [];
          } catch (e) {
            window.DEMO_DATA.expenses = [];
          }
        }
        return window.DEMO_DATA.expenses;
      },
      getById(id) {
        return this.getAll().find((e) => e.id === id);
      },
      add(expenseObj) {
        const list = this.getAll();
        list.unshift(expenseObj);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        autoSave("expenses", "create", expenseObj);
        return expenseObj;
      },
      update(id, updates) {
        const list = this.getAll();
        const item = list.find((e) => e.id === id);
        if (!item) return null;
        Object.assign(item, updates);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        autoSave("expenses", "update", item);
        return item;
      },
      updateStatus(id, newStatus, approverUser, comment, nextApproverId = null) {
        const item = this.getById(id);
        if (!item) return null;
        item.status = newStatus;
        if (nextApproverId !== undefined) {
          item.nextApproverId = nextApproverId;
        }
        if (!item.history) item.history = [];
        item.history.push({
          action: newStatus,
          at: new Date().toISOString(),
          by: approverUser ? approverUser.id : "system",
          role: approverUser ? approverUser.role : "system",
          comment: comment || "",
          nextApproverId: nextApproverId || null
        });
        const list = this.getAll();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        autoSave("expenses", "statusChange", { id, newStatus, approverUser, comment, nextApproverId });
        return item;
      }
    },

    // ==========================================
    // Section: Request Services Module
    // ==========================================
    services: {
      STORAGE_KEY: "pharma_services_data",
      getAll() {
        if (!Array.isArray(window.DEMO_DATA.services)) {
          try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            window.DEMO_DATA.services = raw ? JSON.parse(raw) : [];
          } catch (e) {
            window.DEMO_DATA.services = [];
          }
        }
        return window.DEMO_DATA.services;
      },
      getById(id) {
        return this.getAll().find((s) => s.id === id);
      },
      add(serviceObj) {
        const list = this.getAll();
        list.unshift(serviceObj);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        autoSave("services", "create", serviceObj);
        return serviceObj;
      },
      update(id, updates) {
        const list = this.getAll();
        const item = list.find((s) => s.id === id);
        if (!item) return null;
        Object.assign(item, updates);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        autoSave("services", "update", item);
        return item;
      },
      updateStatus(id, newStatus, approverUser, comment, nextApproverId) {
        const item = this.getById(id);
        if (!item) return null;
        item.status = newStatus;
        if (nextApproverId !== undefined) {
          item.nextApproverId = nextApproverId;
        }
        if (!item.history) item.history = [];
        item.history.push({
          action: newStatus,
          at: new Date().toISOString(),
          by: approverUser ? approverUser.id : "system",
          role: approverUser ? approverUser.role : "system",
          comment: comment || ""
        });
        const list = this.getAll();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        autoSave("services", "statusChange", { id, newStatus, approverUser, comment });
        return item;
      }
    },

    // ==========================================
    // Section: Sales Promo Budgets Module
    // ==========================================
    budgets: {
      STORAGE_KEY: "pharma_sales_budgets",
      getAll() {
        if (!window.DEMO_DATA.salesBudgets) {
          try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            window.DEMO_DATA.salesBudgets = raw ? JSON.parse(raw) : null;
          } catch (e) {
            window.DEMO_DATA.salesBudgets = null;
          }
        }
        return window.DEMO_DATA.salesBudgets;
      },
      getByLine(lineId) {
        const all = this.getAll();
        return all ? all[lineId] : null;
      },
      saveAll(budgetsObj) {
        window.DEMO_DATA.salesBudgets = budgetsObj;
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(budgetsObj));
        } catch (e) {}
        autoSave("budgets", "saveAll", budgetsObj);
        return budgetsObj;
      },
      saveLineBudget(lineId, lineBudgetObj) {
        const all = this.getAll() || {};
        all[lineId] = lineBudgetObj;
        return this.saveAll(all);
      }
    },
  };

  window.store = store;
  if (store.users && typeof store.users.syncAreasFromStore === "function") {
    store.users.syncAreasFromStore();
  }
})();
