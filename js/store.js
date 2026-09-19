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
        (window.DEMO_DATA.users || []).forEach((u) => {
          const repAreas = areas.filter((a) => a.repId === u.id);
          u.areaIds = repAreas.map((a) => a.id);
          u.area = repAreas.length
            ? repAreas.map((a) => a.name).join(", ")
            : null;
          u.areaId = repAreas.length ? repAreas[0].id : null;
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
        if (!Array.isArray(area.aliases)) area.aliases = [];
        const normalized = String(rawText).trim().toLowerCase();
        const exists = area.aliases.some(
          (al) =>
            al.distributorId === distributorId &&
            String(al.rawText).trim().toLowerCase() === normalized,
        );
        if (!exists) {
          area.aliases.push({ distributorId, rawText: String(rawText).trim() });
        }
        autoSave("areas", "addAlias", { areaId, distributorId, rawText });
      },
      /**
       * Removes an alias mapping from an area and clears sales row attribution for that raw text.
       */
      removeAlias(areaId, distributorId, rawText) {
        const area = this.getById(areaId);
        if (!area || !rawText || !Array.isArray(area.aliases)) return false;
        const normalized = String(rawText).trim().toLowerCase();
        const initialLen = area.aliases.length;
        area.aliases = area.aliases.filter(
          (al) =>
            !(al.distributorId === distributorId && String(al.rawText).trim().toLowerCase() === normalized)
        );
        const removed = area.aliases.length < initialLen;
        if (removed) {
          if (store.distributorSales && typeof store.distributorSales.unmatchAliasRows === "function") {
            store.distributorSales.unmatchAliasRows(distributorId, rawText);
          }
          autoSave("areas", "removeAlias", { areaId, distributorId, rawText });
        }
        return removed;
      },
      /**
       * Returns all active mapped area aliases across all areas.
       */
      getAllAliases() {
        const result = [];
        (window.DEMO_DATA.areas || []).forEach((a) => {
          if (Array.isArray(a.aliases)) {
            a.aliases.forEach((al) => {
              result.push({
                areaId: a.id,
                areaName: a.name,
                areaCode: a.code || "",
                lineId: a.lineId || null,
                distributorId: al.distributorId,
                rawText: al.rawText,
              });
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
        return (window.DEMO_DATA.areas || []).find(
          (a) =>
            Array.isArray(a.aliases) &&
            a.aliases.some(
              (al) =>
                al.distributorId === distributorId &&
                String(al.rawText).trim().toLowerCase() === normalized,
            ),
        );
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
          const matchAreaName = nameLower && d.area && d.area.toLowerCase().trim() === nameLower;

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
          const matchAreaName = nameLower && p.area && p.area.toLowerCase().trim() === nameLower;

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
          const matchAreaName = nameLower && h.area && h.area.toLowerCase().trim() === nameLower;

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
      find(distributorId, month) {
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
        autoSave("distributorSales", "importBatch", { count: rows.length });
        // Auto-resolve any rows whose raw area text already has a saved
        // alias from a previous import, so re-uploading a distributor
        // you've already configured doesn't require re-resolving the
        // same territories every time.
        this.applyAreaMatching();
        this.applyProductMatching();
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
       * LINE-AWARE MATCHING (Multi-Line Territory):
       * If the row already has a lineId (from product matching), we find
       * the area alias scoped to that line's areas using findByAliasTextForLine().
       * This ensures that a Cardio drug sold in "Nasr City" is attributed to
       * the Cardio line's rep for Nasr City, not the Neuro line's rep.
       * If no lineId is set yet, falls back to global alias matching.
       */
      applyAreaMatching(forceAll = false) {
        const rows = this.getAll().filter((s) => (forceAll || !s.repId) && s.areaRaw);
        let matchedCount = 0;
        rows.forEach((row) => {
          // Line-aware: if the row's product was already matched to a line,
          // only look at areas belonging to that same line
          let area = null;
          if (row.lineId) {
            area = store.areas.findByAliasTextForLine(row.distributorId, row.areaRaw, row.lineId);
          }
          // Fallback: global alias match (backward compat)
          if (!area) {
            area = store.areas.findByAliasText(row.distributorId, row.areaRaw);
          }
          if (!area) return;
          row.areaId = area.id;
          row.repId = area.repId || null;
          const rep = area.repId ? store.users.getById(area.repId) : null;
          const dmId = rep ? rep.managerId || null : null;
          row.dmId = dmId;
          const dm = dmId ? store.users.getById(dmId) : null;
          row.lmId = dm ? dm.managerId || null : null;
          matchedCount++;
        });
        if (matchedCount) {
          autoSave("distributorSales", "applyAreaMatching", { matchedCount });
        }
        return matchedCount;
      },
      /**
       * Re-attributes all sales rows assigned to an area when that area's assigned
       * medical representative is changed by Admin.
       */
      rematchAreaSales(areaId, newRepId) {
        if (!areaId) return 0;
        const rep = newRepId ? store.users.getById(newRepId) : null;
        const dmId = rep ? rep.managerId || null : null;
        const dm = dmId ? store.users.getById(dmId) : null;
        const lmId = dm ? dm.managerId || null : null;

        let updatedCount = 0;
        this.getAll().forEach((row) => {
          if (row.areaId === areaId) {
            row.repId = newRepId || null;
            row.dmId = dmId;
            row.lmId = lmId;
            updatedCount++;
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
      applyProductMatching() {
        const rows = this.getAll().filter((s) => !s.lineId && s.product);
        let matchedCount = 0;
        rows.forEach((row) => {
          const match = store.productLines.findProductByAlias(row.distributorId, row.product);
          if (!match) return;
          row.lineId = match.line.id;
          row.productId = match.product.id;
          matchedCount++;
        });
        if (matchedCount) {
          autoSave("distributorSales", "applyProductMatching", { matchedCount });
        }
        return matchedCount;
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
          };
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
  };

  window.store = store;
})();
