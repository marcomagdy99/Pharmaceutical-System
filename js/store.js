/**
 * @file store.js
 * @description Centralized State Store with automatic persistence and zero-break compatibility.
 * Wraps window.DEMO_DATA to guarantee a Single Source of Truth and eliminate manual save calls.
 *
 * Change in this revision:
 *  - areas.save() no longer auto-unassigns a rep from every OTHER area
 *    when assigning them to a new one. A rep can now legitimately cover
 *    several areas at once. An area itself is still one-rep-at-a-time:
 *    assigning a rep to THIS area still displaces whoever held THIS
 *    specific area before. To remove a rep from one area without
 *    touching their other areas, use areas.unassignRep(areaId) or save
 *    the area again with an empty repId (the existing areas.html modal's
 *    "-- Unassigned --" option already does this).
 *  - A user's areas are now derived from the areas list itself
 *    (store.users.syncAreasFromStore()), which is the single source of
 *    truth, instead of being written independently on the user record
 *    and risking drift. user.areaIds (array) is the new field to read;
 *    user.area / user.areaId are kept in sync too (area = comma-joined
 *    names, areaId = first assigned area's id) purely so any older code
 *    that still reads those singular fields keeps working.
 */

(function () {
  if (!window.DEMO_DATA) {
    console.warn(
      "store.js: window.DEMO_DATA not yet loaded, initializing empty container.",
    );
    window.DEMO_DATA = {};
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
       * Legacy singular-area setter. Kept only for backward compatibility
       * with any older call sites; new code should assign a rep on the
       * Area record via store.areas.save() instead, which now supports a
       * rep holding several areas and is the single source of truth.
       */
      updateArea(userId, areaName, areaId) {
        const u = this.getById(userId);
        if (u) {
          u.area = areaName || null;
          u.areaId = areaId || null;
        }
      },
      /**
       * Returns every Area record currently assigned to this rep
       * (a rep may now hold zero, one, or several areas).
       */
      getAreas(userId) {
        return (window.DEMO_DATA.areas || []).filter(
          (a) => a.repId === userId,
        );
      },
      /**
       * Recomputes each user's area fields from the Areas list (the
       * single source of truth for who covers what). Called automatically
       * whenever an area is saved, unassigned, or deleted.
       *   - user.areaIds: array of every assigned area's id (new field)
       *   - user.area: comma-joined area names (kept for older UI/display
       *     code that expects one string)
       *   - user.areaId: first assigned area's id (kept for older code
       *     that expects a single id; prefer areaIds for new code)
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
      /**
       * Every area currently assigned to the given rep. A rep can hold
       * more than one.
       */
      getByRep(repId) {
        return (window.DEMO_DATA.areas || []).filter(
          (a) => a.repId === repId,
        );
      },
      save(areaObj) {
        if (!window.DEMO_DATA.areas) window.DEMO_DATA.areas = [];
        const areas = window.DEMO_DATA.areas;
        const idx = areas.findIndex((a) => a.id === areaObj.id);

        if (idx >= 0) {
          const areaId = areaObj.id || areas[idx].id;
          // An area still belongs to at most one rep at a time: if THIS
          // area is being (re)assigned to a rep, that rep displaces
          // whoever held THIS area before. It no longer touches any of
          // that rep's OTHER area assignments -- a rep can cover several
          // areas simultaneously.
          areas[idx] = { ...areas[idx], ...areaObj, id: areaId };
        } else {
          const newId = areaObj.id || "area_" + Date.now();
          areas.push({ ...areaObj, id: newId });
        }

        store.users.syncAreasFromStore();
        autoSave("areas", idx >= 0 ? "update" : "create", areaObj);
        return areaObj;
      },
      /**
       * Explicitly clears the rep from one area, leaving that rep's other
       * area assignments untouched. This is what the areas.html modal's
       * "-- Unassigned --" option now maps to (saving with an empty
       * repId has the same effect).
       */
      unassignRep(areaId) {
        const area = this.getById(areaId);
        if (!area) return;
        area.repId = null;
        area.repName = null;
        store.users.syncAreasFromStore();
        autoSave("areas", "unassignRep", { areaId });
      },
      delete(areaId) {
        window.DEMO_DATA.areas = (window.DEMO_DATA.areas || []).filter(
          (a) => a.id !== areaId,
        );
        store.users.syncAreasFromStore();
        autoSave("areas", "delete", { id: areaId });
      },
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

    // Safety alias ensuring backwards compatibility with any legacy calls
    get lines() {
      return this.productLines;
    },

    // ==========================================
    // Section: Distributors Module
    // (e.g. "Ibn Sina", "Overseas" -- the wholesalers whose raw sales
    // sheets get imported. Column-mapping per distributor and the
    // area-alias matching come later; this module is just the list.)
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
