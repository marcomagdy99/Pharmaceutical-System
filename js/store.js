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
    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
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
            repId: newRepId,
            repName: newRepId ? (areaObj.repName || null) : null
          };
        } else {
          const newId = areaObj.id || "area_" + Date.now();
          areas.push({ 
            ...areaObj, 
            id: newId,
            repId: newRepId,
            repName: newRepId ? (areaObj.repName || null) : null
          });
        }

        const currentAreaId = areaObj.id || (idx >= 0 ? areas[idx].id : areas[areas.length - 1].id);
        logTerritoryHistoryChange(currentAreaId, oldRepId, newRepId);

        store.users.syncAreasFromStore();
        autoSave("areas", idx >= 0 ? "update" : "create", areaObj);
        return areaObj;
      },
      unassignRep(areaId) {
        const area = this.getById(areaId);
        if (!area) return;
        const oldRepId = area.repId;
        area.repId = null;
        area.repName = null;

        logTerritoryHistoryChange(areaId, oldRepId, null);
        store.users.syncAreasFromStore();
        autoSave("areas", "unassignRep", { areaId });
      },
      delete(areaId) {
        const area = this.getById(areaId);
        if (area && area.repId) {
          logTerritoryHistoryChange(areaId, area.repId, null);
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
       * lineId is intentionally left null: distributor sheets only give
       * a product name, and matching that to a product Line is a
       * separate, not-yet-built step. Returns how many rows it resolved.
       */
      applyAreaMatching() {
        const rows = this.getAll().filter((s) => !s.repId && s.areaRaw);
        let matchedCount = 0;
        rows.forEach((row) => {
          const area = store.areas.findByAliasText(row.distributorId, row.areaRaw);
          if (!area || !area.repId) return;
          row.areaId = area.id;
          row.repId = area.repId;
          const rep = store.users.getById(area.repId);
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
  };

  window.store = store;
})();
