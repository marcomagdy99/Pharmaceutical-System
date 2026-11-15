/**
 * @file areas.js
 * @description Area Management Logic migrated to central store.
 */

let currentView = "table";
let areaModal = null;
let deleteModal = null;
let currentSelectedLineId = null;

const areaTranslations = {
  en: {
    area_management: "Area Management",
    total_areas: "Total Areas",
    assigned_areas: "Assigned Areas",
    unassigned_areas: "Unassigned / Vacant Areas",
    manage_areas: "Manage Area",
    add_area: "Add Area",
    search_areas: "Search by name or code...",
    area_code: "Area Code",
    area_name: "Area Name",
    assigned_rep: "Assigned Rep",
    status: "Status",
    actions: "Actions",
    assigned: "Assigned",
    unassigned: "Vacant (Unassigned)",
    code_hint: "Format hint: CAI-N01. Must be unique.",
    assign_rep: "Assign to Medical Rep",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    confirm_delete: "Confirm Delete",
    delete_area_msg: "Are you sure you want to delete this area?",
    select_line: "Product Line:",
    all_lines: "All Lines",
    assigned_bricks: "IMS Bricks",
    assigned_bricks_label: "IMS Bricks (Territory Coverage)",
    search_bricks: "Search brick name...",
    select_all: "Select All",
    clear: "Clear",
    assigned_bricks_hint: "Select geographical IMS bricks covered by the representative in this area (to automatically map distributor sales invoices and distribute sales).",
    selected_bricks: "bricks selected",
    no_bricks_assigned: "No bricks assigned",
    no_matching_bricks: "No matching bricks found",
    view_area_details: "View Area Details",
    hide_area_details: "Hide Area Details",
  },
};

function getAreasList() {
  const allUsers = (window.store && window.store.users.getAll()) || [];
  let rawAreas;

  // Filter areas by selected product line
  if (currentSelectedLineId && window.store && window.store.areas) {
    rawAreas = window.store.areas.getByLine(currentSelectedLineId);
  } else {
    rawAreas = (window.store && window.store.areas.getAll()) || [];
  }

  return rawAreas.map((a) => {
    let rId = a.repId || null;
    let rName = a.repName || null;
    if (rId) {
      const repUser = allUsers.find((u) => u.id === rId);
      if (!repUser || repUser.status === "Inactive") {
        rId = null;
        rName = null;
      } else if (!rName) {
        rName = repUser.name;
      }
    }
    return {
      id: a.id,
      name: a.name,
      code: a.code || ("AREA-" + String(a.id || "").slice(-4).toUpperCase()),
      repId: rId,
      repName: rName,
      lineId: a.lineId || null,
      bricks: Array.isArray(a.bricks) ? a.bricks : [],
    };
  });
}


/**
 * Resolves territorial scope info (Arabic street names, IMS code & name) for any area.
 * Resolves from area.bricks first, then area.name/area.code, with legacy mapping fallback.
 */
function getAreaScopeInfo(area) {
  if (!area) return [];
  const crmBricks = window.CRM_IMS_MASTER_BRICKS || [];
  const scopes = [];
  const seenKeys = new Set();

  function addBrickScope(b) {
    if (!b) return;
    const key = (b.id || b.crmCode || b.name || "").trim().toLowerCase();
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    scopes.push({
      id: b.id || "",
      crmCode: b.crmCode || b.name || "",
      imsCode: b.imsCode || "",
      imsName: b.imsName || "",
      scopeText: b.scopeText || b.name || "",
      sectorAr: b.sectorAr || ""
    });
  }

  // 1. Check assigned bricks array
  const areaBricks = Array.isArray(area.bricks) ? area.bricks : [];
  if (areaBricks.length > 0) {
    areaBricks.forEach((bn) => {
      const match = (typeof window.findCRMBrick === "function" ? window.findCRMBrick(bn) : null)
        || (typeof window.findMasterBrickByName === "function" ? window.findMasterBrickByName(bn) : null);
      if (match) {
        addBrickScope(match);
      } else {
        const textKey = String(bn).trim();
        if (textKey && !seenKeys.has(textKey.toLowerCase())) {
          seenKeys.add(textKey.toLowerCase());
          scopes.push({
            id: "",
            crmCode: textKey,
            imsCode: "",
            imsName: "",
            scopeText: textKey,
            sectorAr: ""
          });
        }
      }
    });
  }

  // 2. If no scopes from bricks array, check area.name and area.code
  if (scopes.length === 0) {
    const match = (typeof window.findCRMBrick === "function" ? (window.findCRMBrick(area.name) || window.findCRMBrick(area.code)) : null)
      || (typeof window.findMasterBrickByName === "function" ? (window.findMasterBrickByName(area.name) || window.findMasterBrickByName(area.code)) : null);
    if (match) {
      addBrickScope(match);
    }
  }

  // 3. Fallback for legacy demo area names
  if (scopes.length === 0 && area.name) {
    const raw = area.name.trim().toLowerCase();
    const legacyMap = {
      "mohndseen": "B49",
      "mohandessin": "B49",
      "dokki": "B41",
      "giza": "B38",
      "fisal": "B46",
      "faisal": "B46",
      "haram": "B43",
      "bolak el dakror": "B50",
      "shobra": "B19",
      "heliopolis": "B01",
      "nasr city": "B06",
      "maadi": "B13"
    };
    if (legacyMap[raw]) {
      const b = crmBricks.find((cb) => cb.id === legacyMap[raw]);
      if (b) addBrickScope(b);
    }
  }

  return scopes;
}
window.getAreaScopeInfo = getAreaScopeInfo;

/**
 * Toggles the inline collapsible streets drawer under an area name.
 * Default is collapsed (hidden). Clicking reveals Arabic streets and rotates chevron.
 */
function toggleAreaStreetsDrawer(drawerId, btn) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const isHidden = drawer.style.display === "none" || !drawer.style.display;
  if (isHidden) {
    drawer.style.display = "block";
    btn.classList.add("active");
    btn.setAttribute("aria-expanded", "true");
    const label = btn.querySelector(".scope-btn-label");
    if (label) label.textContent = "Hide Area Details";
    const chevron = btn.querySelector(".scope-chevron");
    if (chevron) chevron.style.transform = "rotate(180deg)";
  } else {
    drawer.style.display = "none";
    btn.classList.remove("active");
    btn.setAttribute("aria-expanded", "false");
    const label = btn.querySelector(".scope-btn-label");
    if (label) label.textContent = "View Area Details";
    const chevron = btn.querySelector(".scope-chevron");
    if (chevron) chevron.style.transform = "rotate(0deg)";
  }
}
window.toggleAreaStreetsDrawer = toggleAreaStreetsDrawer;

/**
 * Gracefully migrates any legacy area names in localStorage/DEMO_DATA to official CRM Brick names.
 */
function migrateLegacyAreaNames() {
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
  let updated = false;

  const legacyToCrmMap = {
    "mohndseen": { name: "Giza V - Brick 1", code: "GZA-B49", brick: "[B49] Giza V - Brick 1 (Giza 11)" },
    "mohandessin": { name: "Giza V - Brick 1", code: "GZA-B49", brick: "[B49] Giza V - Brick 1 (Giza 11)" },
    "dokki": { name: "Giza II - Brick 1", code: "GZA-B41", brick: "[B41] Giza II - Brick 1 (Giza 4)" },
    "giza": { name: "Giza I - Brick 1", code: "GZA-B38", brick: "[B38] Giza I - Brick 1 (Giza 1)" },
    "fisal": { name: "Faisal - Brick 1", code: "GZA-B46", brick: "[B46] Faisal - Brick 1 (Faisal 1)" },
    "faisal": { name: "Faisal - Brick 1", code: "GZA-B46", brick: "[B46] Faisal - Brick 1 (Faisal 1)" },
    "haram": { name: "Haram - Brick 1", code: "GZA-B43", brick: "[B43] Haram - Brick 1 (El Haram 1)" },
    "bolak el dakror": { name: "Giza V - Brick 2", code: "GZA-B50", brick: "[B50] Giza V - Brick 2 (Giza 12)" },
    "shobra": { name: "Shobra - Brick 1", code: "CAI-B13", brick: "[B13] Shobra - Brick 1 (Shobra 1)" },
    "shoubra": { name: "Shobra - Brick 1", code: "CAI-B13", brick: "[B13] Shobra - Brick 1 (Shobra 1)" },
    "shoubra i - brick 1": { name: "Shobra - Brick 1", code: "CAI-B13", brick: "[B13] Shobra - Brick 1 (Shobra 1)" },
    "heliopolis": { name: "Heliopolis I - Brick 1", code: "CAI-B01", brick: "[B01] Heliopolis I - Brick 1 (Heliopolis 1)" },
    "nasr city": { name: "Nasr City - Brick 1", code: "CAI-B16", brick: "[B16] Nasr City - Brick 1 (Nasr City 1)" },
    "nasr city i - brick 1": { name: "Nasr City - Brick 1", code: "CAI-B16", brick: "[B16] Nasr City - Brick 1 (Nasr City 1)" },
    "maadi": { name: "Maadi - Brick 1", code: "CAI-B32", brick: "[B32] Maadi - Brick 1 (Maadi 1)" },
    "maadi i - brick 1": { name: "Maadi - Brick 1", code: "CAI-B32", brick: "[B32] Maadi - Brick 1 (Maadi 1)" }
  };

  allAreas.forEach((area) => {
    if (!area.name) return;
    const key = area.name.trim().toLowerCase();
    const target = legacyToCrmMap[key];
    if (target) {
      area.name = target.name;
      if (!area.code || area.code.startsWith("GIZ-") || area.code.startsWith("CAI-")) {
        area.code = target.code;
      }
      area.bricks = [target.brick];
      updated = true;
    } else {
      // Clean legacy raw subarea strings from area.bricks so only real CRM Bricks remain
      if (Array.isArray(area.bricks)) {
        const cleanBricks = [];
        area.bricks.forEach((bn) => {
          if (typeof bn === "string" && bn.startsWith("[B") && bn.includes("]")) {
            cleanBricks.push(bn);
          } else {
            const m = typeof window.findCRMBrick === "function" ? window.findCRMBrick(bn) : null;
            if (m && m.name) cleanBricks.push(m.name);
          }
        });
        if (cleanBricks.length !== area.bricks.length || cleanBricks.length === 0) {
          if (cleanBricks.length > 0) {
            area.bricks = Array.from(new Set(cleanBricks));
          } else {
            const m = typeof window.findCRMBrick === "function" ? window.findCRMBrick(area.name) : null;
            if (m && m.name) area.bricks = [m.name];
          }
          updated = true;
        }
      }
    }
  });

  // Ensure Giza IV - Brick 1 exists for line 1 if not present
  const line1Id = (window.store && window.store.areas ? window.store.areas._defaultLineId() : "line_1790626000001");
  if (line1Id) {
    const hasGiza4InLine1 = allAreas.some(
      (a) => (a.lineId === line1Id || !a.lineId) && a.name === "Giza IV - Brick 1"
    );
    if (!hasGiza4InLine1) {
      allAreas.push({
        id: "area_" + line1Id + "_giza4_brick1",
        name: "Giza IV - Brick 1",
        code: "GZA-B48",
        repId: null,
        repName: null,
        lineId: line1Id,
        bricks: ["[B48] Giza IV - Brick 1 (Giza 10)"]
      });
      updated = true;
    }
  }

  if (updated && typeof window.saveDataToStorage === "function") {
    window.saveDataToStorage();
  }
}
window.migrateLegacyAreaNames = migrateLegacyAreaNames;


function populateRepDropdown(selectedRepId = "", targetLineId = null) {
  const repSelect = document.getElementById("assignRep");
  if (!repSelect) return;
  const unassignedLabel = "-- Unassigned (Vacant) --";

  // Filter reps by specified or selected line
  const effectiveLineId = targetLineId || currentSelectedLineId;
  let activeReps;
  if (effectiveLineId && window.store && window.store.areas) {
    activeReps = window.store.areas.getRepsByLine(effectiveLineId);
  } else {
    activeReps = (window.store && window.store.users.getReps()) || [];
  }

  const user = (window.checkAuth && window.checkAuth()) || {};
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
  if (role === "business_unit" || role === "bu") {
    const subs = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
    const subIds = new Set(subs.map((s) => s.id));
    activeReps = activeReps.filter((r) => subIds.has(r.id));
  }

  let html = `<option value="">${unassignedLabel}</option>`;
  activeReps.forEach((r) => {
    const rName = r.name || r.nameAr;
    const sel = r.id === selectedRepId ? "selected" : "";
    html += `<option value="${window.escapeHtml(r.id)}" ${sel}>${window.escapeHtml(rName)} (${window.escapeHtml(r.employeeCode || r.code || r.id)})</option>`;
  });
  repSelect.innerHTML = html;
}

/**
 * Populates the Product Line selector dropdown from store.productLines.
 * Defaults to the first active line or the current user's lineId.
 */
function populateLineSelector() {
  const select = document.getElementById("lineSelector");
  if (!select) return;
  const user = (window.checkAuth && window.checkAuth()) || {};
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
  let allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

  if (role === "business_unit" || role === "bu") {
    const userLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id) : [];
    const buLineIds = new Set(userLines.map((l) => l.id));
    allLines = allLines.filter((l) => buLineIds.has(l.id));
  }

  let html = "";
  allLines.forEach((line) => {
    if (line.status && line.status !== "Active") return;
    const sel = line.id === currentSelectedLineId ? "selected" : "";
    const label = line.name || line.nameAr;
    html += `<option value="${window.escapeHtml(line.id)}" ${sel}>${window.escapeHtml(label)}</option>`;
  });
  select.innerHTML = html;

  // If no line was pre-selected or previously selected line not in allowed lines, pick the first option
  const optionValues = Array.from(select.options).map((o) => o.value);
  if ((!currentSelectedLineId || !optionValues.includes(currentSelectedLineId)) && select.options.length > 0) {
    currentSelectedLineId = select.options[0].value;
    select.value = currentSelectedLineId;
  }
}

/**
 * Called when the admin changes the Product Line selector.
 * Refreshes the area list, stats, and search filter for the new line.
 */
function onLineChanged() {
  const select = document.getElementById("lineSelector");
  currentSelectedLineId = select ? select.value : null;
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  renderAreas();
  updateStats();
}

document.addEventListener("DOMContentLoaded", () => {
  const user = (window.checkAuth && window.checkAuth()) || {};
  if (
    window.hasAnyRole &&
    !window.hasAnyRole(["admin", "business_unit", "hr"], user)
  ) {
    if (typeof showToast === "function")
      showToast("Access Denied: Admins only.", "error");
    window.location.replace("index.html");
    return;
  }

  if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
    const elArea = document.getElementById("areaModal");
    if (elArea) areaModal = (bootstrap.Modal.getInstance && bootstrap.Modal.getInstance(elArea)) || new bootstrap.Modal(elArea);
    const elDel = document.getElementById("deleteModal");
    if (elDel) deleteModal = (bootstrap.Modal.getInstance && bootstrap.Modal.getInstance(elDel)) || new bootstrap.Modal(elDel);
  }
  if (window.translations) {
    window.translations.en = {
      ...window.translations.en,
      ...areaTranslations.en,
    };
  }

  // Initialize line selector and set default
  const currentUser = (window.DEMO_DATA && window.DEMO_DATA.currentUser) || user;
  if (currentUser.lineId) {
    currentSelectedLineId = currentUser.lineId;
  } else if (currentUser.lineIds && currentUser.lineIds.length > 0) {
    currentSelectedLineId = currentUser.lineIds[0];
  }
  migrateLegacyAreaNames();
  populateLineSelector();

  renderAreas();
  updateStats();

  // Listen to language changes across the app
  document.addEventListener("languageChanged", (e) => {
    const lang = e.detail?.lang || (typeof getCurrentLang === "function" ? getCurrentLang() : "en");
    if (typeof applyTranslations === "function") applyTranslations(lang);
    renderAreas();
    updateStats();
    updateSelectedBricksCount();
  });
});

// ============================================================================
// IMS Bricks Multi-Selector Engine
// ============================================================================
let selectedBrickNames = new Set();
let currentBricksLimit = 200;

const englishToArabicBrickMap = {
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
  damanhour: "دمنهور",
  "kafr el sheikh": "كفر الشيخ",
  menoufia: "منوف",
  shebin: "شبين",
  matrouh: "مطروح",
  arish: "عريش",
  obour: "عبور",
  badr: "بدر",
  shorouk: "شروق",
  katameya: "قطاميه",
  tagamoa: "تجمع",
  rehab: "رحاب",
  madinaty: "مدينتي",
};

function normalizeArabicText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ");
}


let currentBrickSector = "all";

function filterBricksBySector(sector) {
  currentBrickSector = sector || "all";
  const pills = document.querySelectorAll("#brickSectorFilterPills .sector-pill");
  pills.forEach((p) => {
    if (p.dataset.sector === currentBrickSector) {
      p.classList.remove("btn-outline-secondary");
      p.classList.add("btn-primary", "active");
    } else {
      p.classList.remove("btn-primary", "active");
      p.classList.add("btn-outline-secondary");
    }
  });
  const q = document.getElementById("searchBricksInput")?.value || "";
  renderModalBricksList(q);
}
window.filterBricksBySector = filterBricksBySector;

function toggleBrickCard(event, brickName) {
  if (event.target.tagName === "INPUT") return;
  const card = event.currentTarget;
  const cb = card.querySelector('input[type="checkbox"]');
  if (cb) {
    cb.checked = !cb.checked;
    onBrickCheckboxChange(cb);
  }
}
window.toggleBrickCard = toggleBrickCard;
function searchMasterBricks(allMaster, rawQuery, sector) {
  const activeSector = sector || currentBrickSector || "all";
  let list = allMaster;
  if (activeSector && activeSector !== "all") {
    list = list.filter((b) => b.sector === activeSector);
  }
  const nq = normalizeArabicText(rawQuery);
  if (!nq) return list;

  // Check if query matches any English alias
  let alias = null;
  for (const [k, v] of Object.entries(englishToArabicBrickMap)) {
    if (nq.includes(k)) {
      alias = normalizeArabicText(v);
      break;
    }
  }

  return list.filter((b) => {
    const nb = normalizeArabicText(b.name);
    const nCrm = b.crmCode ? normalizeArabicText(b.crmCode) : "";
    const nImsCode = b.imsCode ? normalizeArabicText(b.imsCode) : "";
    const nImsName = b.imsName ? normalizeArabicText(b.imsName) : "";
    const nScope = b.scopeText ? normalizeArabicText(b.scopeText) : "";

    return nb.includes(nq) ||
      (nCrm && nCrm.includes(nq)) ||
      (nImsCode && nImsCode.includes(nq)) ||
      (nImsName && nImsName.includes(nq)) ||
      (nScope && nScope.includes(nq)) ||
      (alias && (nb.includes(alias) || nScope.includes(alias)));
  });
}

function populateBricksSelector(existingBricks = []) {
  selectedBrickNames = new Set(
    (Array.isArray(existingBricks) ? existingBricks : [])
      .map((b) => (typeof b === "string" ? b.trim() : (b && b.name ? b.name.trim() : "")))
      .filter(Boolean)
  );

  currentBricksLimit = 200;
  currentBrickSector = "all";
  const pills = document.querySelectorAll("#brickSectorFilterPills .sector-pill");
  pills.forEach((p) => {
    if (p.dataset.sector === "all") {
      p.classList.remove("btn-outline-secondary");
      p.classList.add("btn-primary", "active");
    } else {
      p.classList.remove("btn-primary", "active");
      p.classList.add("btn-outline-secondary");
    }
  });

  const searchInput = document.getElementById("searchBricksInput");
  if (searchInput) {
    searchInput.value = "";
    searchInput.placeholder = areaTranslations.en.search_bricks;
  }

  renderModalBricksList("");
  updateSelectedBricksCount();
}

function renderModalBricksList(filterQuery = "") {
  const container = document.getElementById("modalBricksContainer");
  if (!container) return;

  const allMaster = (window.getMasterBricks && window.getMasterBricks()) || (window.EGYPT_MASTER_BRICKS || []);
  const rawQ = (filterQuery || "").trim();
  const isFiltered = Boolean(rawQ);

  let scopedMaster = allMaster;
  if (currentBrickSector && currentBrickSector !== "all") {
    scopedMaster = allMaster.filter((b) => b.sector === currentBrickSector);
  }

  let displayBricks = [];
  if (!isFiltered) {
    // Show all currently selected bricks first (always visible at top), plus unselected bricks up to currentBricksLimit
    const selectedList = [];
    const unselectedList = [];
    scopedMaster.forEach((b) => {
      const isSel = selectedBrickNames.has(b.name) ||
                    (b.crmCode && selectedBrickNames.has(b.crmCode)) ||
                    (b.imsCode && selectedBrickNames.has(b.imsCode));
      if (isSel) {
        selectedList.push(b);
      } else if (unselectedList.length < currentBricksLimit) {
        unselectedList.push(b);
      }
    });
    displayBricks = [...selectedList, ...unselectedList];
  } else {
    // Search with Arabic normalization, CRM/IMS codes, and English aliases (up to 300 results)
    displayBricks = searchMasterBricks(allMaster, rawQ, currentBrickSector).slice(0, 300);
  }

  const totalMasterCount = scopedMaster.length;
  let headerHtml = `
    <div class="d-flex justify-content-between align-items-center mb-2 px-1 text-muted small border-bottom pb-1">
      <span><i class="fas fa-database text-primary me-1"></i> Total in Sector: <strong>${totalMasterCount.toLocaleString()}</strong></span>
      <span>${isFiltered ? `Matches: ${displayBricks.length}` : `Showing: ${displayBricks.length}`}</span>
    </div>
  `;

  if (displayBricks.length === 0) {
    const noMatchText = areaTranslations.en.no_matching_bricks;
    container.innerHTML = headerHtml + `
      <div class="text-center text-muted py-3">
        <i class="fas fa-search me-1"></i> ${window.escapeHtml(noMatchText)}
      </div>
    `;
    return;
  }

  let html = headerHtml + `<div class="row g-2">`;
  displayBricks.forEach((b, idx) => {
    const isChecked = selectedBrickNames.has(b.name) ||
                      (b.crmCode && selectedBrickNames.has(b.crmCode)) ||
                      (b.imsCode && selectedBrickNames.has(b.imsCode));
    const escapedValue = window.escapeHtml(b.name);
    const inputId = `brick_chk_${idx}`;
    html += `
      <div class="col-12">
        <div class="p-2 px-3 border rounded-3 brick-checkbox-card ${isChecked ? 'selected' : ''}" onclick="toggleBrickCard(event, '${escapedValue}')">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-1">
            <div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
              <input class="form-check-input ms-0 me-1" type="checkbox" id="${inputId}" value="${escapedValue}" ${isChecked ? 'checked' : ''} onchange="onBrickCheckboxChange(this)" onclick="event.stopPropagation()">
              <label class="form-check-label mb-0 cursor-pointer fw-bold text-truncate" for="${inputId}">
                ${b.imsCode ? `<span class="badge bg-primary text-white me-1 font-monospace">${window.escapeHtml(b.imsCode)}</span>` : ''}
                <span class="brick-crm-code">${window.escapeHtml(b.crmCode || b.name)}</span>
                ${b.imsName && b.imsName !== b.crmCode ? `<span class="text-muted fw-normal ms-1 small">(${window.escapeHtml(b.imsName)})</span>` : ''}
              </label>
            </div>
            ${b.sectorAr ? `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle small">${window.escapeHtml(b.sectorAr)}</span>` : ''}
          </div>
          ${b.scopeText && b.scopeText !== b.name ? `
            <div class="mt-1 ps-4 small brick-scope-description d-flex align-items-start gap-1">
              <i class="fas fa-map-marker-alt text-danger mt-1 flex-shrink-0" style="font-size: 0.75rem;"></i>
              <span class="flex-grow-1 text-wrap" style="line-height: 1.35;">${window.escapeHtml(b.scopeText)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  html += `</div>`;

  if (!isFiltered && displayBricks.length < totalMasterCount) {
    html += `
      <div class="text-center pt-3 pb-1">
        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="loadMoreModalBricks()">
          <i class="fas fa-chevron-down me-1"></i> Load More Bricks (+200)
        </button>
      </div>
    `;
  }

  container.innerHTML = html;
}

function loadMoreModalBricks() {
  currentBricksLimit += 300;
  const q = document.getElementById("searchBricksInput")?.value || "";
  renderModalBricksList(q);
}

function onBrickCheckboxChange(el) {
  const brickName = el.value;
  const parentCard = el.closest(".brick-checkbox-card");
  if (el.checked) {
    selectedBrickNames.add(brickName);
    if (parentCard) {
      parentCard.classList.add("selected");
      parentCard.classList.remove("bg-white");
    }

    // Auto-fill Area Name and Code if adding a new area and fields are empty
    const areaIdInput = document.getElementById("areaId");
    const isAddingNew = !areaIdInput || !areaIdInput.value;
    const nameInput = document.getElementById("areaName");
    const codeInput = document.getElementById("areaCode");
    if (isAddingNew && nameInput && !nameInput.value.trim()) {
      const match = (typeof window.findCRMBrick === "function" ? window.findCRMBrick(brickName) : null)
        || (typeof window.findMasterBrickByName === "function" ? window.findMasterBrickByName(brickName) : null);
      if (match) {
        if (match.crmCode) nameInput.value = match.crmCode;
        if (codeInput && !codeInput.value.trim()) {
          const prefix = match.sector === "Cairo" ? "CAI" : (match.sector === "Alex" ? "ALX" : "GZA");
          codeInput.value = match.imsCode ? `${prefix}-${match.imsCode}` : match.id;
        }
      }
    }
  } else {
    selectedBrickNames.delete(brickName);
    if (parentCard) {
      parentCard.classList.remove("selected");
      parentCard.classList.add("bg-white");
    }
  }
  updateSelectedBricksCount();
}

function filterModalBricks() {
  const q = document.getElementById("searchBricksInput")?.value || "";
  renderModalBricksList(q);
}

function selectAllFilteredBricks(selectState) {
  const rawQ = (document.getElementById("searchBricksInput")?.value || "").trim();
  const allMaster = (window.getMasterBricks && window.getMasterBricks()) || (window.EGYPT_MASTER_BRICKS || []);

  if (selectState) {
    if (rawQ) {
      const targets = searchMasterBricks(allMaster, rawQ);
      targets.forEach((b) => selectedBrickNames.add(b.name));
    } else {
      const container = document.getElementById("modalBricksContainer");
      if (container) {
        const checkboxes = container.querySelectorAll("input[type='checkbox']");
        checkboxes.forEach((cb) => selectedBrickNames.add(cb.value));
      }
    }
  } else {
    if (rawQ) {
      const targets = searchMasterBricks(allMaster, rawQ);
      targets.forEach((b) => selectedBrickNames.delete(b.name));
    } else {
      selectedBrickNames.clear();
    }
  }
  renderModalBricksList(rawQ);
  updateSelectedBricksCount();
}

function updateSelectedBricksCount() {
  const badge = document.getElementById("selectedBricksCountBadge");
  if (!badge) return;
  const count = selectedBrickNames.size;
  const word = areaTranslations.en.selected_bricks;
  badge.textContent = `${count} ${word}`;
}

window.populateBricksSelector = populateBricksSelector;
window.renderModalBricksList = renderModalBricksList;
window.loadMoreModalBricks = loadMoreModalBricks;
window.onBrickCheckboxChange = onBrickCheckboxChange;
window.filterModalBricks = filterModalBricks;
window.selectAllFilteredBricks = selectAllFilteredBricks;
window.updateSelectedBricksCount = updateSelectedBricksCount;

function renderAreas(filterText = "") {
  const tableBody = document.getElementById("areas-table-body");
  const cardsView = document.getElementById("cards-view");

  if (tableBody) tableBody.replaceChildren();
  if (cardsView) cardsView.replaceChildren();

  const currentAreas = getAreasList();
  const filteredAreas = currentAreas.filter(
    (a) =>
      a.name.toLowerCase().includes(filterText.toLowerCase()) ||
      a.code.toLowerCase().includes(filterText.toLowerCase()),
  );

  const assignedText = areaTranslations.en.assigned;
  const unassignedText = areaTranslations.en.unassigned;

  filteredAreas.forEach((area) => {
    const isAssigned = area.repId !== null;
    const statusBadge = isAssigned
      ? `<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill">${assignedText}</span>`
      : `<span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-pill">${unassignedText}</span>`;

    const repDisplay = isAssigned
      ? `<div class="d-flex align-items-center">
           <div class="avatar-circle me-2" style="width: 32px; height: 32px; font-size: 14px;">${window.escapeHtml((area.repName || "U").charAt(0))}</div>
           <span>${window.escapeHtml(area.repName)}</span>
         </div>`
      : `<span class="text-muted fst-italic">${unassignedText}</span>`;

    const bricksList = Array.isArray(area.bricks) ? area.bricks : [];
    const bricksCount = bricksList.length;
    const separator = ", ";
    const bricksTooltip = bricksCount > 0
      ? (bricksCount > 15 ? bricksList.slice(0, 15).join(separator) + ` ... (+${bricksCount - 15})` : bricksList.join(separator))
      : areaTranslations.en.no_bricks_assigned;

    const bricksBadge = bricksCount > 0
      ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill" title="${window.escapeHtml(bricksTooltip)}" style="cursor:help;">
           <i class="fas fa-cubes me-1"></i>${bricksCount} bricks
         </span>`
      : `<span class="badge bg-light text-muted border px-2 py-1 rounded-pill" title="${window.escapeHtml(bricksTooltip)}">0</span>`;

    const scopes = getAreaScopeInfo(area);
    const hasScopes = scopes && scopes.length > 0;
    const safeId = String(area.id || Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g, "_");
    const drawerId = `area_streets_${safeId}`;

    // Optional IMS Name subtitle if distinct from area.name
    let imsSubtitle = "";
    if (scopes.length === 1 && scopes[0].imsName && scopes[0].imsName !== area.name && scopes[0].imsName !== scopes[0].crmCode) {
      imsSubtitle = `<span class="text-muted small fw-normal">(${window.escapeHtml(scopes[0].imsName)})</span>`;
    }

    const toggleBtnHtml = hasScopes ? `
      <button type="button" class="btn btn-xs area-scope-toggle-btn mt-1 d-inline-flex align-items-center gap-1" onclick="toggleAreaStreetsDrawer('${drawerId}', this)" aria-expanded="false" title="View Area Details">
        <svg class="scope-pin-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span class="scope-btn-label">View Area Details</span>
        <svg class="scope-chevron" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease;">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    ` : "";

    const drawerHtml = hasScopes ? `
      <div id="${drawerId}" class="area-scope-drawer mt-2 p-2 rounded-3 text-start" style="display: none;">
        ${scopes.map(s => `
          <div class="area-scope-item d-flex align-items-start gap-2 py-1">
            ${s.imsCode ? `<span class="badge bg-primary text-white font-monospace px-1.5 py-0.5 small flex-shrink-0">${window.escapeHtml(s.imsCode)}${s.imsName && s.imsName !== s.imsCode ? ` (${window.escapeHtml(s.imsName)})` : ""}</span>` : ""}
            <span class="small area-scope-streets text-wrap flex-grow-1" style="line-height: 1.45; direction: rtl; text-align: right;">${window.escapeHtml(s.scopeText)}</span>
          </div>
        `).join("")}
      </div>
    ` : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-3"><span class="area-code-badge">${window.escapeHtml(area.code)}</span></td>
      <td class="px-4 py-3 fw-medium">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="area-title-text fw-bold">${window.escapeHtml(area.name)}</span>
          ${imsSubtitle}
        </div>
        ${toggleBtnHtml}
        ${drawerHtml}
      </td>
      <td class="px-4 py-3">${bricksBadge}</td>
      <td class="px-4 py-3">${repDisplay}</td>
      <td class="px-4 py-3">${statusBadge}</td>
      <td class="px-4 py-3 text-end area-actions-cell">
        <button class="btn btn-sm btn-action-edit me-1 text-primary" onclick="openEditModal('${window.escapeHtml(area.id)}')" title="Edit" aria-label="Edit Area">
          <svg class="action-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>
        <button class="btn btn-sm btn-action-delete text-danger" onclick="openDeleteModal('${window.escapeHtml(area.id)}')" title="Delete" aria-label="Delete Area">
          <svg class="action-svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);

    // Cards view
    const cardClass = isAssigned ? "assigned" : "unassigned";
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";
    card.innerHTML = `
      <div class="card border-0 shadow-sm area-card h-100 ${cardClass}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="area-code-badge fs-6">${window.escapeHtml(area.code)}</span>
            <div class="dropdown">
              <button class="btn btn-sm btn-light border-0" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                <li><a class="dropdown-item" href="#" onclick="openEditModal('${window.escapeHtml(area.id)}')"><i class="fas fa-edit me-2 text-primary"></i> <span>${areaTranslations.en.edit}</span></a></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="openDeleteModal('${window.escapeHtml(area.id)}')"><i class="fas fa-trash me-2"></i> <span>${areaTranslations.en.delete}</span></a></li>
              </ul>
            </div>
          </div>
          <div class="mb-2">
            <h5 class="card-title fw-bold mb-0">${window.escapeHtml(area.name)} ${imsSubtitle}</h5>
            ${toggleBtnHtml ? toggleBtnHtml.replace(drawerId, `${drawerId}_card`) : ""}
            ${drawerHtml ? drawerHtml.replace(`id="${drawerId}"`, `id="${drawerId}_card"`) : ""}
          </div>
          <div class="mb-3 d-flex align-items-center justify-content-between mt-1">
            <small class="text-muted"><i class="fas fa-cubes me-1"></i>${areaTranslations.en.assigned_bricks}:</small>
            ${bricksBadge}
          </div>
          <div class="mt-auto pt-3 border-top">
            <small class="text-muted d-block mb-1">${areaTranslations.en.assigned_rep}</small>
            ${repDisplay}
          </div>
        </div>
      </div>
    `;
    cardsView.appendChild(card);
  });

  if (typeof applyTranslations === "function") {
    applyTranslations(document.documentElement.lang);
  }
}

function updateStats() {
  const currentAreas = getAreasList();
  const total = currentAreas.length;
  const assigned = currentAreas.filter((a) => a.repId !== null).length;
  const unassigned = total - assigned;

  document.getElementById("total-count-header").textContent = total;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-assigned").textContent = assigned;
  document.getElementById("stat-unassigned").textContent = unassigned;
}

function filterAreas() {
  const term = document.getElementById("search-input").value;
  renderAreas(term);
}

function toggleView(view) {
  currentView = view;
  document.getElementById("table-view").style.display =
    view === "table" ? "block" : "none";
  document.getElementById("cards-view").style.display =
    view === "cards" ? "flex" : "none";
}

/**
 * Populates the datalist for the area name input with all unique area names
 * currently registered in any product line, along with their assigned code.
 */
function populateAreaNamesDatalist() {
  const datalist = document.getElementById("existingAreaNamesList");
  if (!datalist) return;
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
  const crmBricks = window.CRM_IMS_MASTER_BRICKS || [];

  const uniqueOptions = new Map();
  // 1. First add all official CRM Bricks
  crmBricks.forEach((b) => {
    if (b.crmCode) {
      const key = b.crmCode.toLowerCase();
      if (!uniqueOptions.has(key)) {
        uniqueOptions.set(key, {
          name: b.crmCode,
          code: b.imsCode ? `GZA-${b.imsCode}` : b.id,
          sub: b.imsName || ""
        });
      }
    }
  });

  // 2. Add existing custom area names
  allAreas.forEach((a) => {
    if (a.name) {
      const key = a.name.trim().toLowerCase();
      if (!uniqueOptions.has(key)) {
        uniqueOptions.set(key, { name: a.name.trim(), code: a.code || "", sub: "" });
      }
    }
  });

  let html = "";
  uniqueOptions.forEach(({ name, code, sub }) => {
    html += `<option value="${window.escapeHtml(name)}">${code ? `[${window.escapeHtml(code)}] ` : ""}${sub ? `(${window.escapeHtml(sub)})` : ""}</option>`;
  });
  datalist.innerHTML = html;
}

function onAreaNameInput() {
  const nameInput = document.getElementById("areaName");
  const codeInput = document.getElementById("areaCode");
  if (!nameInput) return;

  const entered = nameInput.value.trim().toLowerCase();
  if (!entered) return;

  // 1. Check if matches any CRM brick
  const crmMatch = (typeof window.findCRMBrick === "function" ? window.findCRMBrick(entered) : null)
    || (typeof window.findMasterBrickByName === "function" ? window.findMasterBrickByName(entered) : null);

  if (crmMatch) {
    if (codeInput && !codeInput.value.trim()) {
      const prefix = crmMatch.sector === "Cairo" ? "CAI" : (crmMatch.sector === "Alex" ? "ALX" : "GZA");
      codeInput.value = crmMatch.imsCode ? `${prefix}-${crmMatch.imsCode}` : crmMatch.id;
    }
    // Pre-check this brick in selected bricks
    if (crmMatch.name && !selectedBrickNames.has(crmMatch.name)) {
      selectedBrickNames.add(crmMatch.name);
      renderModalBricksList(document.getElementById("searchBricksInput")?.value || "");
      updateSelectedBricksCount();
    }
    return;
  }

  // 2. Also check if this area name exists in another line to unify code
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];

  const matched = allAreas.find(
    (a) => a.name && a.name.trim().toLowerCase() === entered && a.code
  );

  if (matched && matched.code && codeInput) {
    codeInput.value = matched.code.toUpperCase();
  }
}
window.onAreaNameInput = onAreaNameInput;

function openAddModal() {
  document.getElementById("areaForm").reset();
  document.getElementById("areaId").value = "";
  populateRepDropdown("", currentSelectedLineId);
  populateAreaNamesDatalist();
  populateBricksSelector([]);

  document.getElementById("areaModalTitle").textContent = areaTranslations.en.add_area;
  if (typeof applyTranslations === "function") {
    applyTranslations("en");
  }

  // Update line label in modal
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const lineObj = allLines.find((l) => l.id === currentSelectedLineId);
  const lineLabel = lineObj ? (lineObj.name || lineObj.nameAr) : (currentSelectedLineId || "");
  const modalLineEl = document.getElementById("modalLineName");
  if (modalLineEl) modalLineEl.textContent = lineLabel;

  // Show the modal
  areaModal.show();
}

function openEditModal(id) {
  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
  const area = allAreas.find((a) => a.id === id);
  if (area) {
    document.getElementById("areaId").value = area.id;
    document.getElementById("areaName").value = area.name;
    document.getElementById("areaCode").value = area.code;

    const areaLineId = area.lineId || currentSelectedLineId;
    populateRepDropdown(area.repId || "", areaLineId);
    populateAreaNamesDatalist();
    populateBricksSelector(area.bricks || []);

    document.getElementById("areaModalTitle").textContent = areaTranslations.en.edit;
  if (typeof applyTranslations === "function") {
    applyTranslations("en");
  }

    // Update line label in modal
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null)
      || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    const lineObj = allLines.find((l) => l.id === areaLineId);
    const lineLabel = lineObj ? (lineObj.name || lineObj.nameAr) : (areaLineId || "");
    const modalLineEl = document.getElementById("modalLineName");
    if (modalLineEl) modalLineEl.textContent = lineLabel;

    areaModal.show();
  }
}

function saveArea() {
  const user = (window.checkAuth && window.checkAuth()) || {};
  if (window.hasAnyRole && !window.hasAnyRole(["admin", "business_unit", "hr"], user)) {
    if (typeof showToast === "function") showToast("Permission Denied.", "error");
    return;
  }
  const id = document.getElementById("areaId").value;
  const name = document.getElementById("areaName").value.trim();
  const code = document.getElementById("areaCode").value.trim();
  const repSelect = document.getElementById("assignRep");
  const repId = repSelect.value || null;

  // Fetch rep name directly from store to avoid formatted dropdown text
  let repName = null;
  if (repId && window.store && window.store.users) {
    const rep = window.store.users.getById(repId);
    repName = rep ? rep.name : null;
  }

  if (!name || !code) {
    const msg = "Area Name and Code are required.";
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const existingArea = id ? (window.store && window.store.areas ? window.store.areas.getById(id) : null) : null;
  const effectiveLineId = (existingArea && existingArea.lineId) || currentSelectedLineId || (window.store && window.store.areas ? window.store.areas._defaultLineId() : "line_1790626000001");
  const targetId = id || `area_${effectiveLineId}_${Date.now()}`;

  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
  if (role === "business_unit" || role === "bu") {
    const userLines = typeof window.getUserLines === "function" ? window.getUserLines(user.id).map((l) => l.id) : [];
    if (!userLines.includes(effectiveLineId)) {
      if (typeof showToast === "function") showToast("Permission Denied: Line outside your BU scope.", "error");
      return;
    }
    if (repId && typeof window.canApproveFor === "function" && !window.canApproveFor(repId)) {
      if (typeof showToast === "function") showToast("Permission Denied: Rep outside your BU scope.", "error");
      return;
    }
  }

  // Validate unique Area Code within the same product line (case-insensitive)
  // Allows the same area code (e.g. CAI-N01 for Nasr City) across different lines,
  // but prevents duplicate codes within the same line.
  const allAreasGlobal = (window.store && window.store.areas) ? window.store.areas.getAll() : [];
  const isDuplicateCode = allAreasGlobal.some((a) => {
    if (a.id === targetId) return false;
    const aLine = a.lineId || (window.store && window.store.areas ? window.store.areas._defaultLineId() : "line_1790626000001");
    if (aLine !== effectiveLineId) return false;
    return a.code && a.code.trim().toUpperCase() === code.toUpperCase();
  });
  if (isDuplicateCode) {
    const msg = `Area code "${code.toUpperCase()}" is already in use by another area in this product line.`;
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const bricks = Array.from(selectedBrickNames);

  let reassignResult = null;
  if (window.store && window.store.areas) {
    window.store.areas.save({
      id: targetId,
      name,
      code: code.toUpperCase(),
      repId,
      repName,
      lineId: effectiveLineId,
      bricks,
    });
    if (typeof window.store.areas.reassignAreaCustomers === "function") {
      reassignResult = window.store.areas.reassignAreaCustomers(targetId, repId, name);
    }
  }

  // Automatically rematch distributor sales rows to the newly assigned representative
  if (window.store && window.store.distributorSales && typeof window.store.distributorSales.rematchAreaSales === "function") {
    window.store.distributorSales.rematchAreaSales(targetId, repId);
  }
  if (window.store && window.store.distributorSales && typeof window.store.distributorSales.applyAreaMatching === "function") {
    window.store.distributorSales.applyAreaMatching(false, false);
  }

  areaModal.hide();
  renderAreas();
  updateStats();

  let successMsg = "Area saved successfully.";
  if (reassignResult && (reassignResult.updatedDoctors > 0 || reassignResult.updatedPharmacies > 0 || reassignResult.updatedHospitals > 0)) {
    const totalCustomers = reassignResult.updatedDoctors + reassignResult.updatedPharmacies + reassignResult.updatedHospitals;
    if (repId) {
      successMsg = `Area saved and ${totalCustomers} customer(s) reassigned to the new representative successfully.`;
    }
  }
  if (typeof showToast === "function") showToast(successMsg, "success");
}

function openDeleteModal(id) {
  const currentAreas = getAreasList();
  const area = currentAreas.find((a) => a.id === id);
  if (!area) return;

  document.getElementById("deleteAreaId").value = id;

  const allDoctors = (window.DEMO_DATA && window.DEMO_DATA.doctors) || [];
  const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];

  const linkedDoctors = allDoctors.filter(
    (d) => d.areaId === id || (d.area && d.area.toLowerCase() === area.name.toLowerCase())
  );
  const linkedVisits = allVisits.filter(
    (v) => v.areaId === id || (v.area && v.area.toLowerCase() === area.name.toLowerCase())
  );
  const hasRep = Boolean(area.repId);

  const warningContainer = document.getElementById("deleteWarningContainer");
  const warningDetails = document.getElementById("deleteWarningDetails");
  const transferSelect = document.getElementById("transferAreaSelect");
  const deleteMsg = document.getElementById("deleteAreaMsg");
  const confirmBtn = document.getElementById("confirmDeleteBtn");

  const otherAreas = currentAreas.filter((a) => a.id !== id);

  if (linkedDoctors.length > 0 || linkedVisits.length > 0 || hasRep) {
    warningContainer.style.display = "block";
    deleteMsg.textContent = `Warning: "${area.name}" contains active records and cannot be deleted directly:`;
    warningDetails.innerHTML = `
      <ul class="mb-1 ps-3">
        <li><strong>${linkedDoctors.length}</strong> registered doctor(s).</li>
        <li><strong>${linkedVisits.length}</strong> logged visit(s).</li>
        ${hasRep ? `<li>Assigned rep: <strong>${window.escapeHtml(area.repName || area.repId)}</strong>.</li>` : ""}
      </ul>
    `;
    confirmBtn.textContent = "Transfer & Delete";

    let optHtml = "";
    otherAreas.forEach((oa) => {
      optHtml += `<option value="${window.escapeHtml(oa.id)}">${window.escapeHtml(oa.name)} (${window.escapeHtml(oa.code)})</option>`;
    });

    if (otherAreas.length === 0) {
      optHtml = `<option value="">No other areas available for transfer!</option>`;
      confirmBtn.disabled = true;
    } else {
      confirmBtn.disabled = false;
    }
    transferSelect.innerHTML = optHtml;
  } else {
    warningContainer.style.display = "none";
    deleteMsg.textContent = `Are you sure you want to delete "${area.name}"? (Area is empty with no doctors or visits)`;
    confirmBtn.textContent = "Delete";
    confirmBtn.disabled = false;
  }

  deleteModal.show();
}

function confirmDelete() {
  const user = (window.checkAuth && window.checkAuth()) || {};
  if (window.hasAnyRole && !window.hasAnyRole(["admin", "business_unit", "hr"], user)) {
    if (typeof showToast === "function") showToast("Permission Denied.", "error");
    return;
  }
  const id = document.getElementById("deleteAreaId").value;
  const currentAreas = getAreasList();
  const area = currentAreas.find((a) => a.id === id);
  if (!area) return;

  const warningContainer = document.getElementById("deleteWarningContainer");
  const isTransferRequired = warningContainer && warningContainer.style.display !== "none";

  let destinationArea = null;

  if (isTransferRequired) {
    const transferSelect = document.getElementById("transferAreaSelect");
    const targetAreaId = transferSelect ? transferSelect.value : "";
    destinationArea = currentAreas.find((a) => a.id === targetAreaId);

    if (!destinationArea) {
      const msg = "Please select a valid destination area for transfer.";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }
    // Reassign doctors to the destination area
    const targetRepId = destinationArea.repId || null;
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const targetRep = targetRepId ? allUsers.find((u) => u.id === targetRepId) : null;
    const targetRepName = targetRep ? targetRep.name : (destinationArea.repName || "");

    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.doctors)) {
      window.DEMO_DATA.doctors.forEach((d) => {
        if (d.areaId === id || (d.area && d.area.toLowerCase() === area.name.toLowerCase())) {
          d.areaId = destinationArea.id;
          d.area = destinationArea.name;
          d.repId = targetRepId;
          if (targetRepName) d.repName = targetRepName;
        }
      });
    }

    // Reassign visits to the destination area
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.visits)) {
      window.DEMO_DATA.visits.forEach((v) => {
        if (v.areaId === id || (v.area && v.area.toLowerCase() === area.name.toLowerCase())) {
          v.areaId = destinationArea.id;
          v.area = destinationArea.name;
        }
      });
    }

    // Reassign pharmacies to the destination area
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.pharmacies)) {
      window.DEMO_DATA.pharmacies.forEach((p) => {
        if (p.areaId === id || (p.area && p.area.toLowerCase() === area.name.toLowerCase())) {
          p.areaId = destinationArea.id;
          p.area = destinationArea.name;
          p.repId = targetRepId;
          if (targetRepName) p.repName = targetRepName;
        }
      });
    }

    // Reassign hospitals to the destination area
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.hospitals)) {
      window.DEMO_DATA.hospitals.forEach((h) => {
        if (h.areaId === id || (h.area && h.area.toLowerCase() === area.name.toLowerCase())) {
          h.areaId = destinationArea.id;
          h.area = destinationArea.name;
          h.repId = targetRepId;
          if (targetRepName) h.repName = targetRepName;
        }
      });
    }

    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
    }
  }

  if (window.store && window.store.areas) {
    window.store.areas.delete(id);
  }

  deleteModal.hide();
  renderAreas();
  updateStats();

  const successMsg = isTransferRequired ? `All records safely transferred to ${destinationArea ? destinationArea.name : ""} and area deleted.` : "Area deleted successfully.";
  if (typeof showToast === "function") showToast(successMsg, "info");
}
