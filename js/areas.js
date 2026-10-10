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
      code: a.code || "CAI-000",
      repId: rId,
      repName: rName,
      lineId: a.lineId || null,
      bricks: Array.isArray(a.bricks) ? a.bricks : [],
    };
  });
}

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
  const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];

  let html = "";
  allLines.forEach((line) => {
    if (line.status && line.status !== "Active") return;
    const sel = line.id === currentSelectedLineId ? "selected" : "";
    const label = line.name || line.nameAr;
    html += `<option value="${window.escapeHtml(line.id)}" ${sel}>${window.escapeHtml(label)}</option>`;
  });
  select.innerHTML = html;

  // If no line was pre-selected, pick the first option
  if (!currentSelectedLineId && select.options.length > 0) {
    currentSelectedLineId = select.options[0].value;
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

  areaModal = new bootstrap.Modal(document.getElementById("areaModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
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

function searchMasterBricks(allMaster, rawQuery) {
  const nq = normalizeArabicText(rawQuery);
  if (!nq) return allMaster;

  // Check if query matches any English alias
  let alias = null;
  for (const [k, v] of Object.entries(englishToArabicBrickMap)) {
    if (nq.includes(k)) {
      alias = normalizeArabicText(v);
      break;
    }
  }

  return allMaster.filter((b) => {
    const nb = normalizeArabicText(b.name);
    return nb.includes(nq) || (alias && nb.includes(alias));
  });
}

function populateBricksSelector(existingBricks = []) {
  selectedBrickNames = new Set(
    (Array.isArray(existingBricks) ? existingBricks : [])
      .map((b) => (typeof b === "string" ? b.trim() : (b && b.name ? b.name.trim() : "")))
      .filter(Boolean)
  );

  currentBricksLimit = 200;
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

  let displayBricks = [];
  if (!isFiltered) {
    // Show all currently selected bricks first (always visible at top), plus unselected bricks up to currentBricksLimit
    const selectedList = [];
    const unselectedList = [];
    allMaster.forEach((b) => {
      if (selectedBrickNames.has(b.name)) {
        selectedList.push(b);
      } else if (unselectedList.length < currentBricksLimit) {
        unselectedList.push(b);
      }
    });
    displayBricks = [...selectedList, ...unselectedList];
  } else {
    // Search with Arabic normalization and English aliases (up to 300 results)
    displayBricks = searchMasterBricks(allMaster, rawQ).slice(0, 300);
  }

  const totalMasterCount = allMaster.length;
  let headerHtml = `
    <div class="d-flex justify-content-between align-items-center mb-2 px-1 text-muted small border-bottom pb-1">
      <span><i class="fas fa-database text-primary me-1"></i> Total in Database: <strong>${totalMasterCount.toLocaleString()}</strong></span>
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
    const isChecked = selectedBrickNames.has(b.name);
    const escapedName = window.escapeHtml(b.name);
    const inputId = `brick_chk_${idx}`;
    html += `
      <div class="col-12 col-sm-6">
        <div class="p-2 border rounded-2 brick-checkbox-card ${isChecked ? 'selected' : 'bg-white'} d-flex align-items-center gap-2">
          <input class="form-check-input ms-0 me-2" type="checkbox" id="${inputId}" value="${escapedName}" ${isChecked ? 'checked' : ''} onchange="onBrickCheckboxChange(this)">
          <label class="form-check-label text-truncate mb-0 flex-grow-1 cursor-pointer small fw-semibold" for="${inputId}" title="${escapedName}">
            ${escapedName}
          </label>
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

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-3"><span class="area-code-badge">${window.escapeHtml(area.code)}</span></td>
      <td class="px-4 py-3 fw-medium">${window.escapeHtml(area.name)}</td>
      <td class="px-4 py-3">${bricksBadge}</td>
      <td class="px-4 py-3">${repDisplay}</td>
      <td class="px-4 py-3">${statusBadge}</td>
      <td class="px-4 py-3 text-end area-actions-cell">
        <button class="btn btn-sm btn-light me-1 text-primary" onclick="openEditModal('${window.escapeHtml(area.id)}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-light text-danger" onclick="openDeleteModal('${window.escapeHtml(area.id)}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);

    const cardClass = isAssigned ? "assigned" : "unassigned";
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";
    card.innerHTML = `
      <div class="card border-0 shadow-sm area-card h-100 ${cardClass}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
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
          <h5 class="card-title fw-bold mb-2">${window.escapeHtml(area.name)}</h5>
          <div class="mb-3 d-flex align-items-center justify-content-between">
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

  const uniqueNames = new Map();
  allAreas.forEach((a) => {
    if (a.name) {
      const key = a.name.trim().toLowerCase();
      if (!uniqueNames.has(key)) {
        uniqueNames.set(key, { name: a.name.trim(), code: a.code || "" });
      }
    }
  });

  let html = "";
  uniqueNames.forEach(({ name, code }) => {
    html += `<option value="${window.escapeHtml(name)}">${code ? `(${window.escapeHtml(code)})` : ""}</option>`;
  });
  datalist.innerHTML = html;
}

/**
 * Triggered when the user enters or selects an area name in the modal.
 * Automatically looks up if this area name exists in any other line,
 * and if so, auto-fills the Area Code with the same standard code!
 */
function onAreaNameInput() {
  const nameInput = document.getElementById("areaName");
  const codeInput = document.getElementById("areaCode");
  if (!nameInput || !codeInput) return;

  const entered = nameInput.value.trim().toLowerCase();
  if (!entered) return;

  const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : null)
    || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];

  const matched = allAreas.find(
    (a) => a.name && a.name.trim().toLowerCase() === entered && a.code
  );

  if (matched && matched.code) {
    // Automatically fill with the same code across all lines!
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
  const effectiveLineId = (existingArea && existingArea.lineId) || currentSelectedLineId || (window.store && window.store.areas ? window.store.areas._defaultLineId() : "line1");
  const targetId = id || `area_${effectiveLineId}_${Date.now()}`;

  // Validate unique Area Code within the same product line (case-insensitive)
  // Allows the same area code (e.g. CAI-N01 for Nasr City) across different lines,
  // but prevents duplicate codes within the same line.
  const allAreasGlobal = (window.store && window.store.areas) ? window.store.areas.getAll() : [];
  const isDuplicateCode = allAreasGlobal.some((a) => {
    if (a.id === targetId) return false;
    const aLine = a.lineId || (window.store && window.store.areas ? window.store.areas._defaultLineId() : "line1");
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
        ${hasRep ? `<li>Assigned rep: <strong>${area.repName || area.repId}</strong>.</li>` : ""}
      </ul>
    `;
    confirmBtn.textContent = "Transfer & Delete";

    let optHtml = "";
    otherAreas.forEach((oa) => {
      optHtml += `<option value="${oa.id}">${oa.name} (${oa.code})</option>`;
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
