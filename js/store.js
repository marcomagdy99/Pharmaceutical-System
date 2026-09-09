/**
 * @file store.js
 * @description Centralized State Store with automatic persistence and zero-break compatibility.
 * Wraps window.DEMO_DATA to guarantee a Single Source of Truth and eliminate manual save calls.
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
      updateArea(userId, areaName, areaId) {
        const u = this.getById(userId);
        if (u) {
          u.area = areaName || null;
          u.areaId = areaId || null;
          autoSave("users", "updateArea", { userId, areaName, areaId });
        }
      },
      clearAreaFromAllExcept(areaId, areaName, keepUserId = null) {
        const users = window.DEMO_DATA.users || [];
        users.forEach((u) => {
          if (
            (u.areaId === areaId || u.area === areaName) &&
            u.id !== keepUserId
          ) {
            u.area = null;
            u.areaId = null;
          }
        });
        autoSave("users", "clearArea", { areaId, areaName, keepUserId });
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
      save(areaObj) {
        if (!window.DEMO_DATA.areas) window.DEMO_DATA.areas = [];
        const areas = window.DEMO_DATA.areas;
        const idx = areas.findIndex((a) => a.id === areaObj.id);

        if (idx >= 0) {
          const oldArea = areas[idx];
          const oldName = oldArea.name;
          const oldRepId = oldArea.repId;
          const areaId = areaObj.id || oldArea.id;

          if (oldRepId && oldRepId !== areaObj.repId) {
            store.users.updateArea(oldRepId, null, null);
          }

          if (areaObj.repId) {
            areas.forEach((a) => {
              if (a.id !== areaId && a.repId === areaObj.repId) {
                a.repId = null;
                a.repName = null;
              }
            });
          }

          if (oldName && oldName !== areaObj.name) {
            store.users.clearAreaFromAllExcept(areaId, oldName, areaObj.repId);
          }
          store.users.clearAreaFromAllExcept(
            areaId,
            areaObj.name,
            areaObj.repId,
          );

          areas[idx] = { ...oldArea, ...areaObj, id: areaId };

          if (areaObj.repId) {
            store.users.updateArea(areaObj.repId, areaObj.name, areaId);
          }
        } else {
          const newId = areaObj.id || "area_" + Date.now();
          const newArea = { ...areaObj, id: newId };
          areas.push(newArea);

          if (newArea.repId) {
            areas.forEach((a) => {
              if (a.id !== newId && a.repId === newArea.repId) {
                a.repId = null;
                a.repName = null;
              }
            });

            store.users.clearAreaFromAllExcept(
              newId,
              newArea.name,
              newArea.repId,
            );
            store.users.updateArea(newArea.repId, newArea.name, newId);
          }
        }
        autoSave("areas", idx >= 0 ? "update" : "create", areaObj);
        return areaObj;
      },
      delete(areaId) {
        const area = this.getById(areaId);
        if (!area) return;

        const users = window.DEMO_DATA.users || [];
        users.forEach((u) => {
          if (u.area === area.name || u.areaId === area.id) {
            u.area = null;
            u.areaId = null;
          }
        });

        window.DEMO_DATA.areas = (window.DEMO_DATA.areas || []).filter(
          (a) => a.id !== areaId,
        );
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