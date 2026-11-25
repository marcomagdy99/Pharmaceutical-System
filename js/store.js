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

  const LEGACY_DIST_MAP = {
    dist1: "dist_1790626000001",
    dist2: "dist_1790626000002",
    dist3: "dist_1790626000003",
  };

  function normalizeDistId(id) {
    return (id && LEGACY_DIST_MAP[id]) ? LEGACY_DIST_MAP[id] : id;
  }

  let _idSeq = 0;
  function nextStoreId(prefix) {
    if (typeof window.genId === "function") {
      return window.genId(prefix);
    }
    _idSeq = (_idSeq + 1) % 100000;
    return prefix + Date.now() + "_" + _idSeq + "_" + Math.random().toString(36).slice(2, 6);
  }

  function normalizeRoleLocal(role) {
    if (typeof window.normalizeRole === "function") {
      return window.normalizeRole(role);
    }
    const r = String(role || "").toLowerCase().trim();
    if (r === "dm" || r === "district manager") return "district_manager";
    if (r === "lm" || r === "line manager") return "line_manager";
    if (r === "bu" || r === "business unit") return "business_unit";
    if (r === "rep" || r === "medical rep") return "medical_rep";
    if (r === "pm" || r === "product manager") return "product_manager";
    return r;
  }

  function isRepUserLocal(u) {
    if (!u) return false;
    if (typeof window.isRepRole === "function") return window.isRepRole(u);
    return normalizeRoleLocal(u.role) === "medical_rep";
  }

  function resolveRepHierarchyChain(repId, areaObj = null, lineId = null) {
    const users = window.DEMO_DATA.users || [];
    let dmId = null;
    let lmId = null;

    if (repId) {
      const rep = users.find((u) => u.id === repId);
      if (rep && rep.managerId) {
        const directMgr = users.find((u) => u.id === rep.managerId);
        if (directMgr) {
          const mgrRole = normalizeRoleLocal(directMgr.role);
          if (mgrRole === "line_manager") {
            lmId = directMgr.id;
          } else {
            dmId = directMgr.id;
            if (directMgr.managerId) {
              const upperMgr = users.find((u) => u.id === directMgr.managerId);
              if (upperMgr) lmId = upperMgr.id;
            }
          }
        } else {
          dmId = rep.managerId;
        }
      }
    } else if (areaObj) {
      const areaDmId = typeof window.getAreaManagerId === "function"
        ? window.getAreaManagerId(areaObj, users)
        : (areaObj.dmId || areaObj.districtManagerId || null);
      if (areaDmId) {
        dmId = areaDmId;
        const dm = users.find((u) => u.id === areaDmId);
        if (dm && dm.managerId) {
          const upperMgr = users.find((u) => u.id === dm.managerId);
          if (upperMgr && normalizeRoleLocal(upperMgr.role) === "line_manager") {
            lmId = upperMgr.id;
          } else if (dm.managerId) {
            lmId = dm.managerId;
          }
        }
      } else if (areaObj.lmId || areaObj.managerId) {
        const lmCand = users.find((u) => u.id === (areaObj.lmId || areaObj.managerId));
        if (lmCand && normalizeRoleLocal(lmCand.role) === "line_manager") {
          lmId = lmCand.id;
        }
      }
    }

    const effLineId = lineId || (areaObj ? areaObj.lineId : null);
    if (!lmId && effLineId) {
      const lineObj = (window.DEMO_DATA.productLines || []).find((l) => l.id === effLineId);
      if (lineObj && lineObj.lineManagerId) lmId = lineObj.lineManagerId;
    }

    return { dmId, lmId };
  }

  function autoSave(entity, action, payload) {
    if (entity === "distributorSales" || entity === "sales") {
      if (typeof window.saveSalesDataToStorage === "function") {
        window.saveSalesDataToStorage();
      } else if (typeof window.saveDataToStorage === "function") {
        window.saveDataToStorage();
      }
    } else if (entity === "visits") {
      if (typeof window.saveDataToStorage === "function") {
        window.saveDataToStorage();
      }
      if (typeof window.syncVisitToCloud === "function") {
        window.syncVisitToCloud(action, payload);
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
        id: nextStoreId("th_"),
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
          (u) => isRepUserLocal(u) && u.status !== "Inactive",
        );
      },
      save(userObj) {
        if (!window.DEMO_DATA.users) window.DEMO_DATA.users = [];
        if (!userObj.id || typeof userObj.id !== "string" || !userObj.id.trim()) {
          userObj.id = nextStoreId("u_");
        }
        const users = window.DEMO_DATA.users;
        const idx = users.findIndex((u) => u.id === userObj.id);
        let savedUser;
        let shouldSyncAreas = false;
        if (idx >= 0) {
          const prev = users[idx];
          users[idx] = { ...prev, ...userObj };
          savedUser = users[idx];
          shouldSyncAreas =
            prev.status !== savedUser.status ||
            prev.role !== savedUser.role ||
            prev.lineId !== savedUser.lineId ||
            JSON.stringify(prev.lineIds || []) !== JSON.stringify(savedUser.lineIds || []);
        } else {
          users.unshift(userObj);
          savedUser = users[0];
        }
        if (shouldSyncAreas) {
          this.syncAreasFromStore();
        }
        autoSave("users", idx >= 0 ? "update" : "create", savedUser);
        return savedUser;
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
          const isRepRole = isRepUserLocal(rep);
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

        // 3. Keep customer (doctor, pharmacy, hospital) rep, line, and manager chain in sync with their assigned area
        const syncCustomerList = (list) => {
          list.forEach((rec) => {
            if (!rec.areaId && rec.area) {
              const matchArea = areas.find((x) => x.name && x.name.toLowerCase().trim() === rec.area.toLowerCase().trim());
              if (matchArea) rec.areaId = matchArea.id;
            }
            if (!rec.areaId && rec.repId) {
              const repAreas = areas.filter((x) => x.repId === rec.repId);
              if (repAreas.length === 1) rec.areaId = repAreas[0].id;
            }
            if (!rec.areaId) return;
            const a = areas.find((x) => x.id === rec.areaId);
            if (a) {
              if (a.lineId) rec.lineId = a.lineId;
              const nextRepId = a.repId || null;
              if (rec.repId !== nextRepId) {
                rec.repId = nextRepId;
              }
              const { dmId, lmId } = resolveRepHierarchyChain(nextRepId, a, a.lineId || rec.lineId || null);
              rec.dmId = dmId;
              rec.lmId = lmId;
              if (a.name) rec.area = a.name;
            }
          });
        };
        syncCustomerList(doctors);
        syncCustomerList(pharmacies);
        syncCustomerList(hospitals);
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
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        const targetDist = legacyDistMap[distributorId] || distributorId;
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
                (al) => {
                  const alDist = legacyDistMap[al.distributorId] || al.distributorId;
                  return (
                    (alDist === targetDist || al.distributorId === distributorId) &&
                    String(al.rawText).trim().toLowerCase() === normalized
                  );
                },
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
        const targetDist = normalizeDistId(distributorId);
        const targetNameNormalized = String(area.name).trim().toLowerCase();

        const allAreas = window.DEMO_DATA && Array.isArray(window.DEMO_DATA.areas) ? window.DEMO_DATA.areas : [];
        
        // 1. Remove this alias from any area with a different geographic name
        allAreas.forEach((otherArea) => {
          if (String(otherArea.name).trim().toLowerCase() !== targetNameNormalized && Array.isArray(otherArea.aliases)) {
            otherArea.aliases = otherArea.aliases.filter(
              (al) =>
                !((normalizeDistId(al.distributorId) === targetDist || al.distributorId === distributorId) &&
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
                (normalizeDistId(al.distributorId) === targetDist || al.distributorId === distributorId) &&
                String(al.rawText).trim().toLowerCase() === normalized,
            );
            if (!exists) {
              matchingArea.aliases.push({ distributorId: targetDist, rawText: String(rawText).trim() });
            }
          }
        });

        autoSave("areas", "addAlias", { areaId, areaName: area.name, distributorId: targetDist, rawText });
      },
      /**
       * Removes an alias mapping from an area and clears sales row attribution for that raw text across all lines.
       */
      removeAlias(areaId, distributorId, rawText) {
        const area = this.getById(areaId);
        if (!area || !rawText) return false;
        const normalized = String(rawText).trim().toLowerCase();
        const targetDist = normalizeDistId(distributorId);
        const targetNameNormalized = String(area.name).trim().toLowerCase();

        const allAreas = window.DEMO_DATA && Array.isArray(window.DEMO_DATA.areas) ? window.DEMO_DATA.areas : [];
        let anyRemoved = false;

        allAreas.forEach((matchingArea) => {
          if (String(matchingArea.name).trim().toLowerCase() === targetNameNormalized && Array.isArray(matchingArea.aliases)) {
            const initialLen = matchingArea.aliases.length;
            matchingArea.aliases = matchingArea.aliases.filter(
              (al) =>
                !((normalizeDistId(al.distributorId) === targetDist || al.distributorId === distributorId) && String(al.rawText).trim().toLowerCase() === normalized)
            );
            if (matchingArea.aliases.length < initialLen) anyRemoved = true;
          }
        });

        if (anyRemoved) {
          if (store.distributorSales && typeof store.distributorSales.unmatchAliasRows === "function") {
            store.distributorSales.unmatchAliasRows(distributorId, rawText);
          }
          autoSave("areas", "removeAlias", { areaId, areaName: area.name, distributorId: targetDist, rawText });
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
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        const targetDist = legacyDistMap[distributorId] || distributorId;
        const matches = (window.DEMO_DATA.areas || []).filter(
          (a) =>
            Array.isArray(a.aliases) &&
            a.aliases.some(
              (al) => {
                const alDist = legacyDistMap[al.distributorId] || al.distributorId;
                return (
                  (alDist === targetDist || al.distributorId === distributorId) &&
                  String(al.rawText).trim().toLowerCase() === normalized
                );
              },
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

        // CRM / IMS Bricks hierarchy matching
        if (typeof window !== "undefined" && Array.isArray(window.CRM_IMS_MASTER_BRICKS)) {
          const codeMatch = String(brickName).match(/\[(B\d+)\]/i);
          let crmB = null;
          if (codeMatch) {
            const targetCode = codeMatch[1].toUpperCase();
            crmB = window.CRM_IMS_MASTER_BRICKS.find(
              (b) => (b.id && b.id.toUpperCase() === targetCode) || (b.imsCode && b.imsCode.toUpperCase() === targetCode)
            );
          }
          if (!crmB) {
            crmB = window.CRM_IMS_MASTER_BRICKS.find((b) => {
              const bName = norm(b.name);
              const bCrm = norm(b.crmCode);
              const bIms = norm(b.imsCode);
              if (bName === nb || bCrm === nb || bIms === nb) return true;
              if (bIms) {
                const imsRx = new RegExp("(?:^|[^a-z0-9])" + bIms + "(?:[^a-z0-9]|$)", "i");
                if (imsRx.test(brickName)) return true;
              }
              if (bCrm && nb.includes(bCrm)) return true;
              return false;
            });
          }
          if (crmB) {
            const bIms = norm(crmB.imsCode);
            const bCrm = norm(crmB.crmCode);
            const bImsName = norm(crmB.imsName);
            if (bIms === ns || bCrm === ns || bImsName === ns) return true;
            if (ns.length >= 3 && (bIms.includes(ns) || bCrm.includes(ns) || bImsName.includes(ns))) return true;
            if (Array.isArray(crmB.subAreas) && crmB.subAreas.some((sa) => {
              const nsa = norm(sa);
              return nsa === ns || (ns.length >= 3 && nsa.includes(ns)) || (nsa.length >= 3 && ns.includes(nsa));
            })) {
              return true;
            }
            if (crmB.scopeText) {
              const nScope = norm(crmB.scopeText);
              if (ns.length >= 3 && nScope.includes(ns)) return true;
            }
          }
        }

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
        const matches = (window.DEMO_DATA.areas || []).filter((a) => {
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
        if (!matches.length) return null;
        return matches.find((a) => a.repId) || matches[0];
      },
      /**
       * Finds an area by its name or code (with normalization and line scoping).
       */
      findByNameOrCode(nameOrCode, lineId = null) {
        if (!nameOrCode) return null;
        const norm = (s) =>
          String(s || "")
            .trim()
            .toLowerCase()
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/[ًٌٍَُِّْـ]/g, "")
            .replace(/[-\/,]/g, " ")
            .replace(/\s+/g, " ");

        const target = norm(nameOrCode);
        const rawTarget = String(nameOrCode).trim().toUpperCase();
        const defaultLine = this._defaultLineId();

        const matches = (window.DEMO_DATA.areas || []).filter((a) => {
          if (lineId) {
            const areaLine = a.lineId || defaultLine;
            if (areaLine !== lineId) return false;
          }
          if (a.code && a.code.trim().toUpperCase() === rawTarget) return true;
          if (a.name) {
            const na = norm(a.name);
            if (na === target) return true;
            if (target.length >= 4 && (na.includes(target) || target.includes(na))) return true;
          }
          return false;
        });

        if (!matches.length) return null;
        return matches.find((a) => a.repId) || matches[0];
      },
      save(areaObj) {
        if (!window.DEMO_DATA.areas) window.DEMO_DATA.areas = [];
        const areas = window.DEMO_DATA.areas;
        const idx = areas.findIndex((a) => a.id === areaObj.id);

        let oldRepId = null;
        const newRepId = areaObj.repId || null;
        let savedArea;

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
          savedArea = areas[idx];
        } else {
          const newId = areaObj.id || nextStoreId("area_");
          savedArea = { 
            ...areaObj, 
            id: newId,
            lineId: areaObj.lineId || this._defaultLineId(),
            repId: newRepId,
            repName: newRepId ? (areaObj.repName || null) : null
          };
          areas.push(savedArea);
        }

        const currentAreaId = savedArea.id;
        logTerritoryHistoryChange(currentAreaId, oldRepId, newRepId);

        // Reassign all doctors, pharmacies, and hospitals in this area if rep changed
        if (oldRepId !== newRepId) {
          this.reassignAreaCustomers(currentAreaId, newRepId, savedArea.name || null);
          if (store.distributorSales && typeof store.distributorSales.rematchAreaSales === "function") {
            store.distributorSales.rematchAreaSales(currentAreaId, newRepId);
          }
        }

        store.users.syncAreasFromStore();
        autoSave("areas", idx >= 0 ? "update" : "create", savedArea);
        return savedArea;
      },
      reassignAreaCustomers(areaId, newRepId, areaName = null, clearAreaLink = false) {
        if (!areaId) return { updatedDoctors: 0, updatedPharmacies: 0, updatedHospitals: 0 };
        const area = this.getById(areaId);
        const effectiveName = areaName || (area ? area.name : null);
        const nameLower = effectiveName ? effectiveName.toLowerCase().trim() : null;
        const { dmId, lmId } = clearAreaLink
          ? { dmId: null, lmId: null }
          : resolveRepHierarchyChain(newRepId || null, area, area ? area.lineId : null);

        const reassignList = (list) => {
          let count = 0;
          list.forEach((rec) => {
            const matchAreaId = rec.areaId === areaId;
            const matchAreaName =
              nameLower &&
              rec.area &&
              rec.area.toLowerCase().trim() === nameLower &&
              (!rec.areaId || rec.areaId === areaId) &&
              (!area || !area.lineId || !rec.lineId || rec.lineId === area.lineId);

            if (matchAreaId || matchAreaName) {
              if (clearAreaLink) {
                rec.repId = null;
                rec.dmId = null;
                rec.lmId = null;
                rec.areaId = null;
                rec.area = "";
              } else {
                rec.repId = newRepId || null;
                rec.dmId = dmId;
                rec.lmId = lmId;
                rec.areaId = areaId;
                if (effectiveName) rec.area = effectiveName;
              }
              count++;
            }
          });
          return count;
        };

        const updatedDoctors = reassignList((window.DEMO_DATA && window.DEMO_DATA.doctors) || []);
        const updatedPharmacies = reassignList((window.DEMO_DATA && window.DEMO_DATA.pharmacies) || []);
        const updatedHospitals = reassignList((window.DEMO_DATA && window.DEMO_DATA.hospitals) || []);

        autoSave("areas", "reassignAreaCustomers", {
          areaId,
          newRepId,
          clearAreaLink,
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
          this.reassignAreaCustomers(areaId, null, area.name, true);
          if (store.distributorSales && typeof store.distributorSales.rematchAreaSales === "function") {
            store.distributorSales.rematchAreaSales(areaId, null);
          }
        }
        if (Array.isArray(window.DEMO_DATA.bulkWeights)) {
          window.DEMO_DATA.bulkWeights = window.DEMO_DATA.bulkWeights.filter((w) => w.areaId !== areaId);
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
        const raw = window.DEMO_DATA.doctors || [];
        const sorter = window.sortBilingualByName || ((a, b) => {
          const nA = (a.name || a.nameAr || "").trim();
          const nB = (b.name || b.nameAr || "").trim();
          return nA.localeCompare(nB, ["en", "ar"], { numeric: true, sensitivity: "base" });
        });
        return raw.slice().sort(sorter);
      },
      getById(id) {
        return (window.DEMO_DATA.doctors || []).find((d) => d.id === id);
      },
      save(docObj) {
        if (!window.DEMO_DATA.doctors) window.DEMO_DATA.doctors = [];
        let matchedArea = null;
        if (docObj.areaId && store.areas) {
          matchedArea = store.areas.getById(docObj.areaId);
          if (matchedArea) {
            if (!docObj.repId && matchedArea.repId) docObj.repId = matchedArea.repId;
            if (matchedArea.name) docObj.area = matchedArea.name;
            if (matchedArea.lineId && !docObj.lineId) docObj.lineId = matchedArea.lineId;
          }
        }
        if ((docObj.repId || matchedArea) && (!docObj.dmId || !docObj.lmId)) {
          const { dmId, lmId } = resolveRepHierarchyChain(docObj.repId || null, matchedArea, docObj.lineId || null);
          if (!docObj.dmId && dmId) docObj.dmId = dmId;
          if (!docObj.lmId && lmId) docObj.lmId = lmId;
        }
        const docs = window.DEMO_DATA.doctors;
        const idx = docs.findIndex((d) => d.id === docObj.id);
        let savedDoc;
        if (idx >= 0) {
          docs[idx] = { ...docs[idx], ...docObj };
          savedDoc = docs[idx];
        } else {
          savedDoc = docObj.id ? docObj : { ...docObj, id: nextStoreId("doc_") };
          docs.unshift(savedDoc);
        }
        autoSave("doctors", idx >= 0 ? "update" : "create", savedDoc);
        return savedDoc;
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
        const raw = window.DEMO_DATA.pharmacies || [];
        const sorter = window.sortBilingualByName || ((a, b) => {
          const nA = (a.name || a.nameAr || "").trim();
          const nB = (b.name || b.nameAr || "").trim();
          return nA.localeCompare(nB, ["en", "ar"], { numeric: true, sensitivity: "base" });
        });
        return raw.slice().sort(sorter);
      },
      getById(id) {
        return (window.DEMO_DATA.pharmacies || []).find((p) => p.id === id);
      },
      save(pharmObj) {
        if (!window.DEMO_DATA.pharmacies) window.DEMO_DATA.pharmacies = [];
        let matchedArea = null;
        if (pharmObj.areaId && store.areas) {
          matchedArea = store.areas.getById(pharmObj.areaId);
          if (matchedArea) {
            if (!pharmObj.repId && matchedArea.repId) pharmObj.repId = matchedArea.repId;
            if (matchedArea.name) pharmObj.area = matchedArea.name;
            if (matchedArea.lineId && !pharmObj.lineId) pharmObj.lineId = matchedArea.lineId;
          }
        }
        if ((pharmObj.repId || matchedArea) && (!pharmObj.dmId || !pharmObj.lmId)) {
          const { dmId, lmId } = resolveRepHierarchyChain(pharmObj.repId || null, matchedArea, pharmObj.lineId || null);
          if (!pharmObj.dmId && dmId) pharmObj.dmId = dmId;
          if (!pharmObj.lmId && lmId) pharmObj.lmId = lmId;
        }
        const pharms = window.DEMO_DATA.pharmacies;
        const idx = pharms.findIndex((p) => p.id === pharmObj.id);
        let savedPharm;
        if (idx >= 0) {
          pharms[idx] = { ...pharms[idx], ...pharmObj };
          savedPharm = pharms[idx];
        } else {
          savedPharm = pharmObj.id ? pharmObj : { ...pharmObj, id: nextStoreId("pharm_") };
          pharms.unshift(savedPharm);
        }
        autoSave("pharmacies", idx >= 0 ? "update" : "create", savedPharm);
        return savedPharm;
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

        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        const targetDist = legacyDistMap[distributorId] || distributorId;

        return (window.DEMO_DATA.pharmacyOverrides || []).find((o) => {
          const oDist = legacyDistMap[o.distributorId] || o.distributorId;
          if (oDist !== targetDist && o.distributorId !== distributorId) return false;

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

          // "All Bulk" overrides have no area; they are scoped to a product line instead
          if (!o.areaId && o.lineId && lineId && o.lineId !== lineId) return false;

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
      /**
       * Finds the override that applies to a concrete sales row. Same as findMatch,
       * but for "future_only" scope it also compares the row's import timestamp
       * (parsed from its id "dsale_<ts>_") with the override creation time.
       */
      findMatchForRow(row) {
        if (!row) return null;
        const month = row.month || (row.date ? String(row.date).slice(0, 7) : null);
        let lineId = row.lineId || null;
        if (!lineId && row.productId && store.productLines && store.productLines.findProductById) {
          const pm = store.productLines.findProductById(row.productId);
          if (pm && pm.line) lineId = pm.line.id;
        }
        const o = this.findMatch(row.distributorId, row.pharmacyCode, row.pharmacyName, month, lineId);
        if (!o) return null;
        if (o.effectiveScope === "future_only") {
          const m = /^dsale_(\d{10,})_/.exec(String(row.id || ""));
          const ts = m ? Number(m[1]) : NaN;
          const created = Date.parse(o.createdAt || "");
          if (!isNaN(ts) && !isNaN(created) && ts < created) return null;
        }
        return o;
      },
      save(overrideObj) {
        if (!window.DEMO_DATA.pharmacyOverrides) window.DEMO_DATA.pharmacyOverrides = [];
        const list = window.DEMO_DATA.pharmacyOverrides;
        const idx = list.findIndex((o) => o.id === overrideObj.id);
        const item = {
          ...overrideObj,
          id: overrideObj.id || nextStoreId("povr_"),
          updatedAt: new Date().toISOString()
        };
        // Normalize mode-specific fields (missing mode = legacy single-area override)
        item.mode = item.mode === "split" || item.mode === "bulk" ? item.mode : "single";
        if (item.mode === "split") {
          item.splits = (Array.isArray(item.splits) ? item.splits : []).map((sp) => ({
            areaId: sp.areaId,
            percent: Number(sp.percent),
          }));
          item.areaId = item.splits.length ? item.splits[0].areaId : null;
        } else if (item.mode === "bulk") {
          item.areaId = null;
          delete item.splits;
        } else {
          delete item.splits;
        }
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
    // Section: Account Location Requests Module (GPS Pinning & Relocation Workflow)
    // Allows Reps to pin clinic GPS on 1st visit or request relocation update,
    // pending DM / Admin approval.
    // ==========================================
    accountLocationRequests: {
      getAll() {
        if (!window.DEMO_DATA.accountLocationRequests) {
          window.DEMO_DATA.accountLocationRequests = [];
        }
        return window.DEMO_DATA.accountLocationRequests;
      },
      getPending() {
        return this.getAll().filter((r) => r.status && r.status !== "approved" && r.status !== "rejected");
      },
      getById(id) {
        return this.getAll().find((r) => r.id === id);
      },
      submit(req) {
        if (!window.DEMO_DATA.accountLocationRequests) {
          window.DEMO_DATA.accountLocationRequests = [];
        }
        const wf = (store.companySettings && store.companySettings.get().approvalWorkflows && store.companySettings.get().approvalWorkflows.relocation) || {
          enabled: true,
          requireDm: true,
          requireLm: false,
          requireBu: false,
          requireGm: false,
          autoApproveWithinMeters: 50
        };

        let initialStatus = "pending_dm";
        if (!wf.requireDm && wf.requireLm) {
          initialStatus = "pending_lm";
        } else if (!wf.requireDm && !wf.requireLm && wf.requireBu) {
          initialStatus = "pending_bu";
        } else if (!wf.requireDm && !wf.requireLm && !wf.requireBu) {
          initialStatus = "approved";
        }

        if (req.distanceMeters != null && wf.autoApproveWithinMeters > 0 && req.distanceMeters <= wf.autoApproveWithinMeters) {
          initialStatus = "approved";
        }

        const item = {
          id: req.id || nextStoreId("locreq_"),
          targetId: req.targetId,
          targetType: req.targetType || "doctor",
          targetName: req.targetName,
          requestType: req.requestType || "initial_pin",
          newLat: Number(req.newLat),
          newLng: Number(req.newLng),
          oldLat: req.oldLat != null ? Number(req.oldLat) : null,
          oldLng: req.oldLng != null ? Number(req.oldLng) : null,
          distanceMeters: req.distanceMeters != null ? Math.round(Number(req.distanceMeters)) : null,
          reason: req.reason || "",
          newAddress: req.newAddress || "",
          repId: req.repId,
          repName: req.repName,
          status: initialStatus,
          submittedAt: new Date().toISOString(),
          decisionAt: initialStatus === "approved" ? new Date().toISOString() : null,
          decisionBy: initialStatus === "approved" ? "Auto-System" : null,
          decisionComment: initialStatus === "approved" ? "Auto-approved within radius threshold" : "",
          approvalChain: []
        };

        if (initialStatus === "approved") {
          this._applyCoordinates(item);
        }

        window.DEMO_DATA.accountLocationRequests.unshift(item);
        autoSave("accountLocationRequests", "create", item);

        if (typeof window.addWorkflowNotification === "function" && initialStatus !== "approved") {
          const allUsers = (store.users ? store.users.getAll() : (window.DEMO_DATA.users || []));
          const repUser = allUsers.find((u) => u.id === item.repId);
          const fallbackAdmin = allUsers.find((u) => normalizeRoleLocal(u.role) === "admin");
          const recipientId = (repUser && repUser.managerId)
            ? repUser.managerId
            : (fallbackAdmin ? fallbackAdmin.id : null);

          if (recipientId) {
            window.addWorkflowNotification({
              userId: recipientId,
              type: "location_pin_request",
              title: item.requestType === "relocation" ? "Clinic Relocation Request" : "Clinic Location Pin Request",
              message: `Rep ${item.repName} requested GPS pin for ${item.targetName}`,
              link: "activities.html#locations",
              icon: "📍",
              badgeClass: "bg-warning",
              actorName: item.repName,
              action: "submitted"
            });
          }
        }
        return item;
      },
      _applyCoordinates(item) {
        if (item.targetType === "doctor" && store.doctors) {
          const doc = store.doctors.getById(item.targetId);
          if (doc) {
            doc.lat = item.newLat;
            doc.lng = item.newLng;
            if (item.newAddress) {
              doc.address = item.newAddress;
              doc.clinicAddress = item.newAddress;
            }
            store.doctors.save(doc);
          }
        } else if (item.targetType === "hospital" && store.hospitals) {
          const hosp = store.hospitals.getById(item.targetId);
          if (hosp) {
            hosp.lat = item.newLat;
            hosp.lng = item.newLng;
            if (item.newAddress) hosp.address = item.newAddress;
            store.hospitals.save(hosp);
          }
        } else if (item.targetType === "pharmacy" && store.pharmacies) {
          const pharm = store.pharmacies.getById(item.targetId);
          if (pharm) {
            pharm.lat = item.newLat;
            pharm.lng = item.newLng;
            if (item.newAddress) pharm.address = item.newAddress;
            store.pharmacies.save(pharm);
          }
        }

        // Retroactively update past visits matching this approved target
        if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.visits)) {
          const calcDist = (lat1, lon1, lat2, lon2) => {
            if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
            const R = 6371e3;
            const rad = Math.PI / 180;
            const p1 = lat1 * rad;
            const p2 = lat2 * rad;
            const dp = (lat2 - lat1) * rad;
            const dl = (lon2 - lon1) * rad;
            const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
            return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
          };
          const maxDist = (store.companySettings && store.companySettings.get().gpsMaxDistanceMeters) || 200;
          const targetNameNorm = (item.targetName || "").trim().toLowerCase();

          const updatedVisits = [];
          window.DEMO_DATA.visits.forEach((v) => {
            const vDocName = (v.doctorName || "").trim().toLowerCase();
            const isMatch = (item.targetType === "doctor" && (v.doctorId === item.targetId || (targetNameNorm && vDocName === targetNameNorm))) ||
                            (item.targetType === "hospital" && (v.hospitalId === item.targetId || (targetNameNorm && (vDocName === targetNameNorm || (v.hospitalName && v.hospitalName.trim().toLowerCase() === targetNameNorm))))) ||
                            (item.targetType === "pharmacy" && (v.pharmacyId === item.targetId || (targetNameNorm && (vDocName === targetNameNorm || (v.pharmacyName && v.pharmacyName.trim().toLowerCase() === targetNameNorm)))));

            if (isMatch) {
              v.targetLat = item.newLat;
              v.targetLng = item.newLng;
              if (v.deviceLat != null && v.deviceLng != null) {
                const dist = calcDist(v.deviceLat, v.deviceLng, item.newLat, item.newLng);
                v.distanceMeters = dist;
                v.gpsStatus = dist <= maxDist ? "in_range" : "out_of_range";
              }
              updatedVisits.push(v);
              if (typeof window.syncVisitToCloud === "function") {
                window.syncVisitToCloud("update", v);
              }
            }
          });

          if (updatedVisits.length > 0) {
            if (typeof window.saveDataToStorage === "function") {
              window.saveDataToStorage();
            }
            document.dispatchEvent(
              new CustomEvent("pharma:store:changed", {
                detail: { entity: "visits", action: "batchUpdate", payload: updatedVisits },
              }),
            );
          }
        }
      },
      _canDecide(actorUser, item) {
        if (!actorUser || !actorUser.role || !item) return false;
        if (actorUser.id && item.repId && actorUser.id === item.repId) return false;
        if (isRepUserLocal(actorUser)) return false;
        const role = normalizeRoleLocal(actorUser.role);
        return ["admin", "business_unit", "line_manager", "district_manager"].includes(role);
      },
      advanceApproval(id, actorUser, comment = "") {
        const item = this.getById(id);
        if (!item || item.status === "approved" || item.status === "rejected") return null;
        if (!this._canDecide(actorUser, item)) return null;

        if (!item.approvalChain) item.approvalChain = [];
        const role = normalizeRoleLocal(actorUser?.role);
        item.approvalChain.push({
          actorId: actorUser?.id || "unknown",
          actorName: actorUser?.name || "Manager",
          actorRole: role,
          stage: item.status,
          decidedAt: new Date().toISOString(),
          comment: comment || ""
        });

        const wf = (store.companySettings && store.companySettings.get().approvalWorkflows && store.companySettings.get().approvalWorkflows.relocation) || {
          enabled: true,
          requireDm: true,
          requireLm: false,
          requireBu: false,
          requireGm: false
        };

        if (role === "admin") {
          item.status = "approved";
        } else if (item.status === "pending" || item.status === "pending_dm") {
          if (wf.requireLm) {
            item.status = "pending_lm";
          } else if (wf.requireBu) {
            item.status = "pending_bu";
          } else {
            item.status = "approved";
          }
        } else if (item.status === "pending_lm") {
          if (wf.requireBu) {
            item.status = "pending_bu";
          } else {
            item.status = "approved";
          }
        } else {
          item.status = "approved";
        }

        item.decisionAt = new Date().toISOString();
        item.decisionBy = actorUser ? actorUser.name : "Manager";
        item.decisionComment = comment;

        if (item.status === "approved") {
          this._applyCoordinates(item);
          if (typeof window.addWorkflowNotification === "function" && item.repId) {
            window.addWorkflowNotification({
              userId: item.repId,
              type: "location_pin_approval",
              title: "Clinic Location Pin Approved",
              message: `Manager (${actorUser ? actorUser.name : "Manager"}) approved verified GPS location for ${item.targetName}.`,
              link: "visits.html",
              icon: "📍",
              badgeClass: "bg-success",
              actorName: actorUser ? actorUser.name : "Manager",
              action: "approved"
            });
          }
        }

        autoSave("accountLocationRequests", "update", item);
        return item;
      },
      approve(id, actorUser, comment = "") {
        return this.advanceApproval(id, actorUser, comment);
      },
      reject(id, actorUser, comment = "") {
        const item = this.getById(id);
        if (!item || item.status === "approved" || item.status === "rejected") return null;
        if (!this._canDecide(actorUser, item)) return null;
        item.status = "rejected";
        item.decisionAt = new Date().toISOString();
        item.decisionBy = actorUser ? actorUser.name : "Manager";
        item.decisionComment = comment;
        if (typeof window.addWorkflowNotification === "function" && item.repId) {
          window.addWorkflowNotification({
            userId: item.repId,
            type: "location_pin_rejection",
            title: "Clinic Location Pin Rejected",
            message: comment
              ? `Manager (${actorUser ? actorUser.name : "Manager"}) rejected GPS pin for ${item.targetName}: ${comment}`
              : `Manager (${actorUser ? actorUser.name : "Manager"}) rejected GPS pin request for ${item.targetName}.`,
            note: comment || null,
            link: "visits.html",
            icon: "📍",
            badgeClass: "bg-danger",
            actorName: actorUser ? actorUser.name : "Manager",
            action: "rejected"
          });
        }
        autoSave("accountLocationRequests", "update", item);
        return item;
      }
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
        let matchedArea = null;
        if (hospObj.areaId && store.areas) {
          matchedArea = store.areas.getById(hospObj.areaId);
          if (matchedArea) {
            if (!hospObj.repId && matchedArea.repId) hospObj.repId = matchedArea.repId;
            if (matchedArea.name) hospObj.area = matchedArea.name;
            if (matchedArea.lineId && !hospObj.lineId) hospObj.lineId = matchedArea.lineId;
          }
        }
        if ((hospObj.repId || matchedArea) && (!hospObj.dmId || !hospObj.lmId)) {
          const { dmId, lmId } = resolveRepHierarchyChain(hospObj.repId || null, matchedArea, hospObj.lineId || null);
          if (!hospObj.dmId && dmId) hospObj.dmId = dmId;
          if (!hospObj.lmId && lmId) hospObj.lmId = lmId;
        }
        const hosps = window.DEMO_DATA.hospitals;
        const idx = hosps.findIndex((h) => h.id === hospObj.id);
        let savedHosp;
        if (idx >= 0) {
          hosps[idx] = { ...hosps[idx], ...hospObj };
          savedHosp = hosps[idx];
        } else {
          savedHosp = hospObj.id ? hospObj : { ...hospObj, id: nextStoreId("hosp_") };
          hosps.unshift(savedHosp);
        }
        autoSave("hospitals", idx >= 0 ? "update" : "create", savedHosp);
        return savedHosp;
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
        const targetDist = normalizeDistId(distributorId);
        const exists = prod.aliases.some(
          (al) =>
            (normalizeDistId(al.distributorId) === targetDist || al.distributorId === distributorId) &&
            String(al.rawText).trim().toLowerCase() === normalized,
        );
        if (!exists) {
          prod.aliases.push({ distributorId: targetDist, rawText: String(rawText).trim() });
        }
        autoSave("productLines", "addProductAlias", { lineId, productId, distributorId: targetDist, rawText });
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
        const targetDist = normalizeDistId(distributorId);
        const initialLen = prod.aliases.length;
        prod.aliases = prod.aliases.filter(
          (al) =>
            !((normalizeDistId(al.distributorId) === targetDist || al.distributorId === distributorId) && String(al.rawText).trim().toLowerCase() === normalized)
        );
        const removed = prod.aliases.length < initialLen;
        if (removed) {
          if (store.distributorSales && typeof store.distributorSales.unmatchProductAliasRows === "function") {
            store.distributorSales.unmatchProductAliasRows(distributorId, rawText);
          }
          autoSave("productLines", "removeProductAlias", { lineId, productId, distributorId: targetDist, rawText });
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
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        const targetDist = legacyDistMap[distributorId] || distributorId;
        const lines = window.DEMO_DATA.productLines || [];
        for (const line of lines) {
          if (!Array.isArray(line.products)) continue;
          const prod = line.products.find(
            (p) =>
              Array.isArray(p.aliases) &&
              p.aliases.some(
                (al) => {
                  const alDist = legacyDistMap[al.distributorId] || al.distributorId;
                  return (
                    (alDist === targetDist || al.distributorId === distributorId) &&
                    String(al.rawText).trim().toLowerCase() === normalized
                  );
                },
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
        let savedWeight;
        if (idx >= 0) {
          weights[idx] = { ...weights[idx], ...weightObj };
          savedWeight = weights[idx];
        } else {
          savedWeight = weightObj.id ? weightObj : { ...weightObj, id: nextStoreId("bw_") };
          weights.push(savedWeight);
        }
        autoSave("bulkWeights", idx >= 0 ? "update" : "create", savedWeight);
        return savedWeight;
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
              id: nextStoreId("bw_"),
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
      resolve(id) {
        if (!id) return null;
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        const resolvedId = legacyDistMap[id] || id;
        return (
          (window.DEMO_DATA.distributors || []).find(
            (d) => d.id === resolvedId || d.id === id,
          ) || null
        );
      },
      getName(id) {
        if (!id) return "";
        const d = this.resolve(id);
        return d ? d.name : id;
      },
      getById(id) {
        return this.resolve(id);
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
      find(areaOrRepId, productId, month) {
        return this.getAll().find(
          (t) =>
            (t.areaId === areaOrRepId || t.repId === areaOrRepId) &&
            t.productId === productId &&
            t.month === month,
        );
      },
      findByArea(areaId, productId, month) {
        return this.getAll().find(
          (t) => t.areaId === areaId && t.productId === productId && t.month === month,
        );
      },
      getByArea(areaId) {
        return this.getAll().filter((t) => t.areaId === areaId);
      },
      getValue(areaOrRepId, productId, month) {
        const t = this.find(areaOrRepId, productId, month);
        return t ? parseFloat(t.target) || 0 : 0;
      },
      /**
       * Upserts by (areaId, productId, month) -- saving a target for a
       * combination that already has one updates it in place rather than
       * creating a duplicate row. Supports legacy repId resolution.
       */
      save(targetObj) {
        if (!window.DEMO_DATA.targets) window.DEMO_DATA.targets = [];
        const list = window.DEMO_DATA.targets;

        // Auto-resolve repId from area if areaId provided
        if (targetObj.areaId && targetObj.repId === undefined && window.DEMO_DATA.areas) {
          const matchedArea = window.DEMO_DATA.areas.find((a) => a.id === targetObj.areaId);
          if (matchedArea) {
            targetObj.repId = matchedArea.repId || null;
          }
        } else if (targetObj.repId && !targetObj.areaId && window.DEMO_DATA.areas) {
          const matchedArea = window.DEMO_DATA.areas.find((a) => a.repId === targetObj.repId);
          if (matchedArea) {
            targetObj.areaId = matchedArea.id;
          }
        }

        const byIdIdx = targetObj.id ? list.findIndex((t) => t.id === targetObj.id) : -1;
        const compositeMatchIdx = list.findIndex(
          (t) =>
            (targetObj.areaId && t.areaId === targetObj.areaId && t.productId === targetObj.productId && t.month === targetObj.month) ||
            (!targetObj.areaId && t.repId === targetObj.repId && t.productId === targetObj.productId && t.month === targetObj.month),
        );

        let idx = -1;
        if (byIdIdx >= 0) {
          // If editing an existing record into a slot already owned by a different target id, refuse silent corruption
          if (compositeMatchIdx >= 0 && compositeMatchIdx !== byIdIdx) {
            return list[compositeMatchIdx];
          }
          idx = byIdIdx;
        } else {
          idx = compositeMatchIdx;
        }

        let savedTarget;
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...targetObj, id: list[idx].id };
          savedTarget = list[idx];
        } else {
          savedTarget = { ...targetObj, id: targetObj.id || nextStoreId("target_") };
          list.push(savedTarget);
        }
        autoSave("targets", idx >= 0 ? "update" : "create", savedTarget);
        return savedTarget;
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
        let savedBatch;
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...batchObj };
          savedBatch = list[idx];
        } else {
          savedBatch = { ...batchObj, id: batchObj.id || nextStoreId("batch_") };
          list.push(savedBatch);
        }
        autoSave("importBatches", idx >= 0 ? "update" : "create", savedBatch);
        return savedBatch;
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
        const sales = window.DEMO_DATA.distributorSales || [];
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        let hasLegacy = false;
        sales.forEach((s) => {
          if (s && s.distributorId && legacyDistMap[s.distributorId]) {
            s.distributorId = legacyDistMap[s.distributorId];
            hasLegacy = true;
          }
        });
        if (hasLegacy) {
          try {
            localStorage.setItem("pharma_sales_data", JSON.stringify(sales));
          } catch (e) {}
        }
        return sales;
      },
      getByDistributor(distributorId) {
        const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
        const targetId = legacyDistMap[distributorId] || distributorId;
        return this.getAll().filter((s) => {
          const sDistId = legacyDistMap[s.distributorId] || s.distributorId;
          return sDistId === targetId || s.distributorId === distributorId;
        });
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
        // Apply Bulk/Ceiling distribution after matching (saved cleanly via importBatch autoSave below)
        this.applyCutPointAndBulk(false);
        autoSave("distributorSales", "importBatch", { count: rows.length });
      },
      /**
       * Distinct (distributorId, areaRaw) pairs among still-unassigned
       * rows that have no alias yet -- these need an admin to pick the
       * real Area for them once, via areas.addAlias().
       */
      getPendingAreaTexts() {
        const rows = this.getAll().filter((s) => !s.repId && !s.areaId && s.areaRaw);
        const seen = {};
        const pending = [];
        rows.forEach((row) => {
          if (store.areas.findByAliasText(row.distributorId, row.areaRaw)) return;
          if (typeof store.areas.findByBrickName === "function" && store.areas.findByBrickName(row.areaRaw)) return;
          if (typeof store.areas.findByNameOrCode === "function" && store.areas.findByNameOrCode(row.areaRaw)) return;
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
          (s) => s.salesType !== "bulk" && !s.splitParentId && (forceAll || !s.repId || (s.productId && s.lineId && s.areaId)) && (s.areaRaw || s.pharmacyCode || s.pharmacyName)
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

          // 1. High-priority check for pharmacy override (line-aware & future_only timestamp-aware)
          if (store.pharmacyOverrides) {
            const override = typeof store.pharmacyOverrides.findMatchForRow === "function"
              ? store.pharmacyOverrides.findMatchForRow(row)
              : store.pharmacyOverrides.findMatch(
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

          // 2c. Fallback to Area Name or Code matching (line-aware)
          if (!area && row.areaRaw && typeof store.areas.findByNameOrCode === "function") {
            area = store.areas.findByNameOrCode(row.areaRaw, rowLineId);
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
          const chainIds = resolveRepHierarchyChain(area.repId || null, area, row.lineId || area.lineId || null);
          row.dmId = chainIds.dmId;
          row.lmId = chainIds.lmId;
          matchedCount++;
        });
        if (matchedCount) {
          this.applyCutPointAndBulk(false);
          if (shouldAutoSave) {
            autoSave("distributorSales", "applyAreaMatching", { matchedCount });
          }
        }
        return matchedCount;
      },

      /**
       * Retroactively applies a pharmacy territory override to existing sales rows
       * according to the specified effective retroactive scope.
       */
      applyPharmacyOverride(override) {
        if (!override || !override.distributorId) return 0;
        const mode = override.mode || "single";

        let area = null;
        let targetLineId = null;
        if (mode === "bulk") {
          targetLineId = override.lineId || null;
          if (!targetLineId) return 0;
        } else {
          area = store.areas.getById(override.areaId);
          if (!area) return 0;
          targetLineId = area.lineId || null;
        }

        // Derived rows (split children / bulk) are rebuilt from scratch below
        this.removeBulkRows();
        this.removeSplitRows();

        const chainIds = resolveRepHierarchyChain(area ? (area.repId || null) : null, area, targetLineId);
        const dmId = chainIds.dmId;
        const lmId = chainIds.lmId;
        const targetDistId = normalizeDistId(override.distributorId);

        const cleanCode = String(override.pharmacyCode || "").trim().toLowerCase();
        const cleanName = String(override.pharmacyName || "").trim().toLowerCase();

        let updatedCount = 0;
        this.getAll().forEach((row) => {
          if (normalizeDistId(row.distributorId) !== targetDistId) return;

          let matches = false;
          if (cleanCode && row.pharmacyCode) {
            matches = String(row.pharmacyCode).trim().toLowerCase() === cleanCode;
          } else if (cleanName && row.pharmacyName) {
            matches = String(row.pharmacyName).trim().toLowerCase() === cleanName;
          }
          if (!matches) return;

          // Only apply override to rows of the same line (if the override targets a specific line)
          if (targetLineId && row.lineId && row.lineId !== targetLineId) return;

          // Check effective retroactive scope
          const rowMonth = row.month || (row.date ? String(row.date).slice(0, 7) : null);
          if (override.effectiveScope === "future_only") {
            return;
          }
          if (override.effectiveScope === "from_month" && override.effectiveFromMonth) {
            if (rowMonth && rowMonth < override.effectiveFromMonth) return;
          }

          if (mode === "bulk") {
            // Drop the old attribution; standard alias matching re-assigns it below
            row.areaId = null;
            row.repId = null;
            row.dmId = null;
            row.lmId = null;
          } else {
            row.areaId = area.id;
            row.repId = area.repId || null;
            row.dmId = dmId;
            row.lmId = lmId;
          }
          updatedCount++;
        });

        if (mode === "bulk" && updatedCount > 0) {
          this.applyAreaMatching(false, false);
        }

        // Rebuild split children + bulk rows
        this.applyCutPointAndBulk(false);
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
        const revertLineId = overrideArea ? overrideArea.lineId : override.lineId || null;

        // Restore split parents / capped rows and drop derived rows first
        this.removeBulkRows();
        this.removeSplitRows();

        let revertedCount = 0;
        const targetDist = normalizeDistId(override.distributorId);
        this.getAll().forEach((row) => {
          if (normalizeDistId(row.distributorId) !== targetDist && row.distributorId !== override.distributorId) return;

          let matches = false;
          if (cleanCode && row.pharmacyCode) {
            matches = String(row.pharmacyCode).trim().toLowerCase() === cleanCode;
          } else if (cleanName && row.pharmacyName) {
            matches = String(row.pharmacyName).trim().toLowerCase() === cleanName;
          }
          if (!matches) return;

          // Only revert if row belongs to the overridden line
          if (revertLineId && row.lineId && row.lineId !== revertLineId) return;

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
        this.applyAreaMatching(false, false);
        this.applyCutPointAndBulk();
        return revertedCount;
      },
      /**
       * Re-attributes all sales rows assigned to an area when that area's assigned
       * medical representative is changed by Admin.
       */
      rematchAreaSales(areaId, newRepId, effectiveFromMonth = null) {
        if (!areaId) return 0;
        const areaObj = store.areas ? store.areas.getById(areaId) : null;
        const { dmId, lmId } = resolveRepHierarchyChain(newRepId || null, areaObj, areaObj ? areaObj.lineId : null);

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
        const targetDist = normalizeDistId(distributorId);
        let unlinkedCount = 0;
        this.getAll().forEach((row) => {
          if (
            row.salesType !== "bulk" &&
            !row.splitParentId &&
            (normalizeDistId(row.distributorId) === targetDist || row.distributorId === distributorId) &&
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
          this.applyCutPointAndBulk(false);
          autoSave("distributorSales", "unmatchAliasRows", { distributorId: targetDist, rawText, unlinkedCount });
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
        const targetDist = normalizeDistId(distributorId);
        let unlinkedCount = 0;
        this.getAll().forEach((row) => {
          const rawProductText = row.product !== undefined && row.product !== null && row.product !== "" ? row.product : row.productRaw;
          if (
            row.salesType !== "bulk" &&
            !row.splitParentId &&
            (normalizeDistId(row.distributorId) === targetDist || row.distributorId === distributorId) &&
            String(rawProductText || "").trim().toLowerCase() === normalized
          ) {
            row.lineId = null;
            row.productId = null;
            unlinkedCount++;
          }
        });
        if (unlinkedCount) {
          this.applyCutPointAndBulk(false);
          autoSave("distributorSales", "unmatchProductAliasRows", { distributorId: targetDist, rawText, unlinkedCount });
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
        const rows = this.getAll().filter((s) => (!s.productId || !s.lineId) && s.product);
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
        // Restore capped quantities/values, then reset markers on remaining rows
        window.DEMO_DATA.distributorSales.forEach((s) => {
          if ("cappedOrigValue" in s || "cappedOrigQuantity" in s) {
            if ("cappedOrigQuantity" in s) s.quantity = s.cappedOrigQuantity;
            if ("cappedOrigValue" in s) s.value = s.cappedOrigValue;
          } else if (s.cappedQty !== undefined && s.cappedQty !== null) {
            // Legacy rows capped before the original values were stored
            const q = parseFloat(s.quantity);
            if (s.quantity === null || s.quantity === undefined) {
              s.value = parseFloat(s.cappedQty) || 0;
            } else if (q > 0) {
              s.value = Math.round(((parseFloat(s.value) || 0) * parseFloat(s.cappedQty) / q) * 100) / 100;
              s.quantity = s.cappedQty;
            }
          }
          delete s.salesType;
          delete s.bulkWeight;
          delete s.originalSaleId;
          delete s.cappedQty;
          delete s.cappedOrigQuantity;
          delete s.cappedOrigValue;
          delete s.forcedBulk;
          delete s.zeroedByBulk;
        });
        return before - window.DEMO_DATA.distributorSales.length;
      },

      /**
       * Removes rows generated by a "split across areas" override and restores the
       * original quantity/value on the parent rows.
       */
      removeSplitRows() {
        if (!window.DEMO_DATA.distributorSales) return 0;
        const before = window.DEMO_DATA.distributorSales.length;
        window.DEMO_DATA.distributorSales = window.DEMO_DATA.distributorSales.filter(
          (s) => !s.splitParentId,
        );
        window.DEMO_DATA.distributorSales.forEach((s) => {
          if (s.isSplitParent) {
            s.quantity = s.splitOrigQuantity;
            s.value = s.splitOrigValue;
            delete s.isSplitParent;
            delete s.splitOrigQuantity;
            delete s.splitOrigValue;
            delete s.splitPercent;
          }
        });
        return before - window.DEMO_DATA.distributorSales.length;
      },

      /**
       * Applies "split" pharmacy overrides: each matching row keeps its first area's
       * percentage share and one child row is generated per extra area. Totals are
       * preserved exactly (last share takes the rounding remainder).
       * Must run on a clean state (after removeBulkRows + removeSplitRows).
       * Returns the number of child rows created. Does not autosave.
       */
      applyPharmacySplits() {
        if (!store.pharmacyOverrides) return 0;
        const splitOverrides = store.pharmacyOverrides
          .getAll()
          .filter((o) => o.mode === "split" && Array.isArray(o.splits) && o.splits.length >= 2);
        if (!splitOverrides.length) return 0;

        const round2 = (n) => Math.round(n * 100) / 100;
        const chain = (area) => {
          const { dmId, lmId } = resolveRepHierarchyChain(area.repId || null, area, area.lineId || null);
          return {
            areaId: area.id,
            repId: area.repId || null,
            dmId,
            lmId,
          };
        };

        const children = [];
        this.getAll().forEach((row) => {
          if (row.salesType === "bulk" || row.splitParentId || row.isSplitParent) return;
          const o = store.pharmacyOverrides.findMatchForRow(row);
          if (!o || o.mode !== "split" || !Array.isArray(o.splits) || o.splits.length < 2) return;

          const parts = o.splits.map((sp) => ({
            area: store.areas.getById(sp.areaId),
            pct: Number(sp.percent),
          }));
          if (parts.some((p) => !p.area || !(p.pct > 0))) return;
          const total = parts.reduce((a, p) => a + p.pct, 0);
          if (Math.abs(total - 100) > 0.01) return;

          let rowLine = row.lineId || null;
          if (!rowLine && row.productId) {
            const pm = store.productLines.findProductById(row.productId);
            if (pm && pm.line) rowLine = pm.line.id;
          }
          if (parts.some((p) => rowLine && p.area.lineId && p.area.lineId !== rowLine)) return;

          const hasQty = row.quantity !== null && row.quantity !== undefined;
          const origQty = hasQty ? parseFloat(row.quantity) || 0 : null;
          const origVal = parseFloat(row.value) || 0;
          const snapshot = { ...row };

          let usedQty = 0;
          let usedVal = 0;
          const shares = parts.map((p, i) => {
            const last = i === parts.length - 1;
            const q = hasQty ? (last ? round2(origQty - usedQty) : round2((origQty * p.pct) / 100)) : null;
            const v = last ? round2(origVal - usedVal) : round2((origVal * p.pct) / 100);
            if (hasQty) usedQty += q;
            usedVal += v;
            return { q, v };
          });

          // Parent row keeps the first share
          row.isSplitParent = true;
          row.splitOrigQuantity = hasQty ? snapshot.quantity : null;
          row.splitOrigValue = snapshot.value;
          row.splitPercent = parts[0].pct;
          row.quantity = shares[0].q;
          row.value = shares[0].v;
          Object.assign(row, chain(parts[0].area));
          if (!row.lineId && parts[0].area.lineId) row.lineId = parts[0].area.lineId;

          for (let i = 1; i < parts.length; i++) {
            const child = { ...snapshot };
            delete child.isSplitParent;
            delete child.splitOrigQuantity;
            delete child.splitOrigValue;
            child.id = row.id + "__s" + i;
            child.splitParentId = row.id;
            child.splitPercent = parts[i].pct;
            child.quantity = shares[i].q;
            child.value = shares[i].v;
            Object.assign(child, chain(parts[i].area));
            if (!child.lineId && parts[i].area.lineId) child.lineId = parts[i].area.lineId;
            children.push(child);
          }
        });

        if (children.length) {
          if (!window.DEMO_DATA.distributorSales) window.DEMO_DATA.distributorSales = [];
          window.DEMO_DATA.distributorSales.push(...children);
        }
        return children.length;
      },

      /**
       * Core Bulk/Ceiling Engine.
       * Order: remove old bulk rows -> remove old split rows -> apply split overrides -> bulk.
       * For each product:
       *   - Rows of pharmacies flagged "All Bulk" (override mode "bulk") are treated with
       *     cutPoint 0: everything becomes Bulk, spread over bricks by their weights.
       *     (If the product has no brick weights, the rows simply stay Private.)
       *   - Other rows: if cutPoint > 0 and weights exist, the pharmacy-month total above the
       *     cutPoint is capped (Private) and the surplus spread by weight % (Bulk).
       *
       * Generated Bulk rows carry salesType:"bulk", bulkWeight, originalSaleId.
       * Original rows carry salesType:"private".
       */
      applyCutPointAndBulk(shouldAutoSave = true) {
        const emptySummary = { processedProducts: 0, bulkRowsCreated: 0, splitRowsCreated: 0, skippedNoWeights: 0 };
        if (!this.getAll().length) {
          this.lastEngineSummary = emptySummary;
          return { ...emptySummary };
        }

        // 1. Remove previously generated derived rows (restores original values)
        this.removeBulkRows();
        this.removeSplitRows();

        // 2. Apply pharmacy split overrides
        const splitRowsCreated = this.applyPharmacySplits();

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
        let skippedNoWeights = 0;
        let seq = 0;
        const stamp = Date.now();
        const newBulkRows = [];

        const processGroup = (rows, month, productId, pInfo, weights, cutPoint, forced) => {
          if (!rows.length) return;
          const totalQty = rows.reduce((a, r) => a + (parseFloat(r.quantity) || 0), 0);
          const totalValue = rows.reduce((a, r) => a + (parseFloat(r.value) || 0), 0);
          // Skip groups with negative or zero totals (returns/credits)
          if (totalQty <= 0 && totalValue <= 0) {
            rows.forEach((r) => { r.salesType = "private"; });
            return;
          }
          if (forced && !weights.length) {
            skippedNoWeights++;
            rows.forEach((r) => { r.salesType = "private"; });
            return;
          }

          // cutPoint is compared against quantity (units) when available, otherwise value
          const hasQty = rows.some((r) => r.quantity !== null && r.quantity !== undefined);
          const comparisonValue = hasQty ? totalQty : totalValue;
          if (comparisonValue <= 0) {
            rows.forEach((r) => { r.salesType = "private"; });
            return;
          }
          if (!forced && comparisonValue <= cutPoint) {
            rows.forEach((r) => { r.salesType = "private"; });
            return;
          }

          const surplus = forced ? comparisonValue : comparisonValue - cutPoint;
          const surplusRatio = surplus / comparisonValue;

          rows.forEach((r) => {
            r.salesType = "private";
            const rowQty = parseFloat(r.quantity) || 0;
            const rowValue = parseFloat(r.value) || 0;
            // Guard: use already-saved original values if present (prevents double-apply)
            if (!("cappedOrigQuantity" in r)) {
              r.cappedOrigQuantity = r.quantity === undefined ? null : r.quantity;
            }
            if (!("cappedOrigValue" in r)) {
              r.cappedOrigValue = r.value;
            }
            if (hasQty) {
              r.cappedQty = r.quantity;
              r.quantity = Math.round(rowQty * (1 - surplusRatio) * 100) / 100;
              r.value = Math.round(rowValue * (1 - surplusRatio) * 100) / 100;
            } else {
              r.cappedQty = r.value;
              r.value = Math.round(rowValue * (1 - surplusRatio) * 100) / 100;
            }
            if (forced) {
              r.forcedBulk = true;
              r.zeroedByBulk = true;
            }
          });

          // Distribute surplus to each brick by weight %
          weights.forEach((w) => {
            const targetArea = allAreas.find((a) => a.id === w.areaId);
            const shareQty = hasQty ? Math.round(surplus * (w.weight / 100) * 100) / 100 : null;
            const shareValue = hasQty
              ? Math.round(totalValue * surplusRatio * (w.weight / 100) * 100) / 100
              : Math.round(surplus * (w.weight / 100) * 100) / 100;

            if (shareQty !== null && shareQty === 0 && shareValue === 0) return;

            const bulkRow = {
              id: "bulk_" + stamp + "_" + seq++ + "_" + Math.floor(Math.random() * 100000),
              salesType: "bulk",
              bulkWeight: w.weight,
              originalSaleId: rows[0].id,
              batchId: rows[0].batchId,
              distributorId: rows[0].distributorId,
              month: month,
              date: rows[0].date,
              product: pInfo.name,
              productId: productId,
              lineId: pInfo.lineId,
              pharmacyCode: rows[0].pharmacyCode,
              pharmacyName: rows[0].pharmacyName,
              areaRaw: targetArea ? targetArea.name : "",
              areaId: w.areaId,
              repId: targetArea ? targetArea.repId || null : null,
              dmId: null,
              lmId: null,
              quantity: shareQty,
              value: shareValue,
            };
            if (forced) bulkRow.forcedBulk = true;
            newBulkRows.push(bulkRow);
            bulkRowsCreated++;
          });
        };

        // 3. Per product
        Object.entries(productMap).forEach(([productId, pInfo]) => {
          const weights = allWeights.filter((w) => w.productId === productId);
          const prodSales = sales.filter((s) => s.productId === productId);
          if (!prodSales.length) return;

          // Group by (distributor + pharmacy identity + month); split forced-bulk rows apart
          const groups = {};
          prodSales.forEach((s) => {
            const pharmKey =
              (s.distributorId || "") + "||" +
              (s.pharmacyCode || "").trim().toLowerCase() + "||" +
              (s.pharmacyName || "").trim().toLowerCase();
            const groupKey = pharmKey + "||" + (s.month || "");
            if (!groups[groupKey]) groups[groupKey] = { month: s.month, forcedRows: [], normalRows: [] };
            const ov = store.pharmacyOverrides ? store.pharmacyOverrides.findMatchForRow(s) : null;
            if (ov && ov.mode === "bulk") groups[groupKey].forcedRows.push(s);
            else groups[groupKey].normalRows.push(s);
          });

          let touched = false;
          Object.values(groups).forEach((g) => {
            if (g.forcedRows.length) {
              touched = touched || weights.length > 0;
              processGroup(g.forcedRows, g.month, productId, pInfo, weights, 0, true);
            }
            if (g.normalRows.length) {
              if (pInfo.cutPoint > 0 && weights.length) {
                touched = true;
                processGroup(g.normalRows, g.month, productId, pInfo, weights, pInfo.cutPoint, false);
              }
            }
          });
          if (touched) processedProducts++;
        });

        // 4. Mark remaining rows that have no salesType as private
        this.getAll().forEach((s) => {
          if (!s.salesType) s.salesType = "private";
        });

        // 5. Append all generated Bulk rows
        if (newBulkRows.length > 0) {
          if (!window.DEMO_DATA.distributorSales) window.DEMO_DATA.distributorSales = [];
          window.DEMO_DATA.distributorSales.push(...newBulkRows);

          // Resolve DM/LM hierarchy for all bulk rows (including vacant bricks)
          const areaById = new Map(allAreas.map((a) => [a.id, a]));
          newBulkRows.forEach((r) => {
            const areaObj = r.areaId ? (areaById.get(r.areaId) || null) : null;
            const { dmId, lmId } = resolveRepHierarchyChain(r.repId || null, areaObj, r.lineId || null);
            r.dmId = dmId;
            r.lmId = lmId;
          });
        }

        if (shouldAutoSave) {
          autoSave("distributorSales", "applyCutPointAndBulk", {
            processedProducts,
            bulkRowsCreated,
            splitRowsCreated,
          });
        }

        const summary = { processedProducts, bulkRowsCreated, splitRowsCreated, skippedNoWeights };
        this.lastEngineSummary = summary;
        return { ...summary };
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
      save(leaveObj) {
        if (!leaveObj) return null;
        if (!window.DEMO_DATA.leaves) window.DEMO_DATA.leaves = [];
        const leaves = window.DEMO_DATA.leaves;
        const idx = leaveObj.id ? leaves.findIndex((l) => l.id === leaveObj.id) : -1;
        let savedLeave;
        if (idx >= 0) {
          leaves[idx] = { ...leaves[idx], ...leaveObj };
          savedLeave = leaves[idx];
        } else {
          savedLeave = leaveObj.id ? { ...leaveObj } : { ...leaveObj, id: nextStoreId("lv_") };
          leaves.unshift(savedLeave);
        }
        autoSave("leaves", idx >= 0 ? "update" : "create", savedLeave);
        return savedLeave;
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
            defaultDailyVisitsTarget: 8.0,
            minPmVisitsPerDay: 4,
            allowLeaveRollover: true,
            leaveRolloverGraceMonths: 3,
            leaveRolloverMaxDays: 5,
            isThursdayWeekend: false,
            visitBacklogLimitDays: 2,
            plannedVisitExpiryDays: 7,
            approvalWorkflows: {
              commercialServices: {
                requireDm: true,
                requireLm: true,
                requireBu: true,
                requireGm: false,
                buThresholdMode: "all",
                buThresholdAmount: 5000,
                autoSkipSubmitterRole: true,
              },
              marketingServices: {
                requirePm: true,
                requireDm: false,
                requireLm: false,
                requireBu: true,
                buThresholdMode: "all",
                buThresholdAmount: 10000,
                autoSkipSubmitterRole: true,
              },
              expenses: {
                requireDm: true,
                requireLm: true,
                requireHr: true,
                requireDisbursement: true,
                requireBuThreshold: false,
                buThresholdAmount: 10000,
                autoSkipSubmitterRole: true,
              },
              leaves: {
                requireDm: true,
                requireLm: true,
                requireBu: false,
                requireHr: true,
                autoSkipSubmitterRole: true,
              },
              plans: {
                requireDm: true,
                requireLm: false,
                requireBu: false,
              },
              relocation: {
                requireDm: true,
                requireLm: false,
                requireBu: false,
              }
            },
            branding: {
              logoUrl: "images/pharma-icon-192.png",
              taglineEn: "Empowering Medical Representatives",
              taglineAr: "Empowering Medical Representatives",
              descEn: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
              descAr: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
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
          if (!window.DEMO_DATA.companySettings.approvalWorkflows) {
            window.DEMO_DATA.companySettings.approvalWorkflows = {
              commercialServices: {
                requireDm: true,
                requireLm: true,
                requireBu: true,
                requireGm: false,
                buThresholdMode: "all",
                buThresholdAmount: 5000,
                autoSkipSubmitterRole: true,
              },
              marketingServices: {
                requirePm: true,
                requireDm: false,
                requireLm: false,
                requireBu: true,
                buThresholdMode: "all",
                buThresholdAmount: 10000,
                autoSkipSubmitterRole: true,
              },
              expenses: {
                requireDm: true,
                requireLm: true,
                requireHr: true,
                requireDisbursement: true,
                requireBuThreshold: false,
                buThresholdAmount: 10000,
                autoSkipSubmitterRole: true,
              },
              leaves: {
                requireDm: true,
                requireLm: true,
                requireBu: false,
                requireHr: true,
                autoSkipSubmitterRole: true,
              },
              plans: {
                requireDm: true,
                requireLm: false,
                requireBu: false,
              },
              relocation: {
                requireDm: true,
                requireLm: false,
                requireBu: false,
              }
            };
          }
          if (!window.DEMO_DATA.companySettings.branding) {
            window.DEMO_DATA.companySettings.branding = {
              logoUrl: "images/pharma-icon-192.png",
              taglineEn: "Empowering Medical Representatives",
              taglineAr: "Empowering Medical Representatives",
              descEn: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
              descAr: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
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
        if (!userId) return 0;
        return this.getForUser(userId).filter(
          (n) => !n.read && !(Array.isArray(n.readBy) && n.readBy.includes(userId))
        ).length;
      },
      add(notif) {
        if (!window.DEMO_DATA.notifications) window.DEMO_DATA.notifications = [];
        const fullNotif = {
          id: notif.id || nextStoreId("notif_"),
          userId: notif.userId || null,
          type: notif.type || "system",
          title: notif.title || notif.titleEn || "New Notification",
          message: notif.message || notif.messageEn || "",
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
      markAsRead(notifId, userId = null) {
        const notif = (window.DEMO_DATA.notifications || []).find((n) => n.id === notifId);
        if (notif) {
          if (notif.userId === "all") {
            const effUid = userId || (typeof window.checkAuth === "function" ? window.checkAuth()?.id : null);
            if (effUid) {
              if (!Array.isArray(notif.readBy)) notif.readBy = [];
              if (!notif.readBy.includes(effUid)) notif.readBy.push(effUid);
            }
          } else {
            notif.read = true;
          }
          autoSave("notifications", "update", notif);
          if (typeof window.updateWorkflowNotifUI === "function") {
            window.updateWorkflowNotifUI();
          }
        }
        return notif;
      },
      markAllAsRead(userId) {
        if (!userId) return;
        let modified = false;
        (window.DEMO_DATA.notifications || []).forEach((n) => {
          if (n.userId === userId && !n.read) {
            n.read = true;
            modified = true;
          } else if (n.userId === "all") {
            if (!Array.isArray(n.readBy)) n.readBy = [];
            if (!n.readBy.includes(userId)) {
              n.readBy.push(userId);
              modified = true;
            }
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
      clearAll(userId, allowBroadcasts = false) {
        if (!userId || !window.DEMO_DATA.notifications) return;
        const curUser = typeof window.checkAuth === "function" ? window.checkAuth() : null;
        const isAdm = Boolean(allowBroadcasts === true || (curUser && normalizeRoleLocal(curUser.role) === "admin"));
        window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
          (n) => n.userId !== userId && !(isAdm && n.userId === "all")
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
        return userId ? `pharma_activities_data_${userId}` : null;
      },
      getAllForUser(userId) {
        if (!userId) return {};
        if (!window.DEMO_DATA._activitiesByUser) {
          window.DEMO_DATA._activitiesByUser = {};
        }
        if (!window.DEMO_DATA._activitiesByUser[userId]) {
          try {
            const key = this.getStorageKey(userId);
            const raw = key ? localStorage.getItem(key) : null;
            window.DEMO_DATA._activitiesByUser[userId] = raw ? JSON.parse(raw) : {};
          } catch (e) {
            window.DEMO_DATA._activitiesByUser[userId] = {};
          }
        }
        return window.DEMO_DATA._activitiesByUser[userId];
      },
      get(userId, dateStr) {
        if (!userId) return {};
        const userActivities = this.getAllForUser(userId);
        return userActivities[dateStr] || {};
      },
      save(userId, dateStr, period, activityData) {
        if (!userId || !dateStr || !period) return null;
        const userActivities = this.getAllForUser(userId);
        if (!userActivities[dateStr]) {
          userActivities[dateStr] = {};
        }
        userActivities[dateStr][period] = activityData;
        try {
          const key = this.getStorageKey(userId);
          if (key) localStorage.setItem(key, JSON.stringify(userActivities));
        } catch (e) {}
        autoSave("activities", "save", { userId, date: dateStr, period, activityData });
        return userActivities[dateStr][period];
      },
      delete(userId, dateStr, period) {
        if (!userId || !dateStr || !period) return false;
        const userActivities = this.getAllForUser(userId);
        if (userActivities[dateStr] && userActivities[dateStr][period]) {
          delete userActivities[dateStr][period];
          if (Object.keys(userActivities[dateStr]).length === 0) {
            delete userActivities[dateStr];
          }
          try {
            const key = this.getStorageKey(userId);
            if (key) localStorage.setItem(key, JSON.stringify(userActivities));
          } catch (e) {}
          autoSave("activities", "delete", { userId, date: dateStr, period });
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

