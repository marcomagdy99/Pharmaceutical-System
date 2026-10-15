const d = {};
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
        if (!userObj.id || typeof userObj.id !== "string" || !userObj.id.trim()) {
          userObj.id = "u" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        }
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
        };; console.log(Object.keys(d)); for (let k of Object.keys(d)) { if (Array.isArray(d[k])) console.log(k, d[k].slice(0,3).map(x=>x.id)); }