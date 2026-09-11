/**
 * @file distributors.js
 * @description Distributor Management Logic, backed by the central store
 * (window.store.distributors -- see store.js). Mirrors areas.js's pattern
 * but Distributors don't get assigned to a rep; this is just the source
 * list that the (future) sales-sheet import mapping will reference by id.
 */

const esc = window.escapeHtml || ((s) => s || "");

let distributorModal = null;
let deleteModal = null;
let mappingModal = null;
let mappingTargetDistId = null;
let mappingDetectedHeaders = [];

const distributorTranslations = {
  en: {
    distributor_management: "Distributor Management",
    total_distributors: "Total Distributors",
    add_distributor: "Add Distributor",
    search_distributors: "Search by name...",
    distributor_name: "Distributor Name",
    actions: "Actions",
    no_distributors_found: "No Distributors Found",
    no_distributors_desc:
      "Add your first distributor to start mapping their sales sheets.",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    confirm_delete: "Confirm Delete",
    delete_distributor_msg:
      "Are you sure you want to delete this distributor?",
    mapping_status: "Sheet Mapping",
    mapped: "Mapped",
    not_configured: "Not Configured",
    configure_mapping: "Configure Sheet Mapping",
    edit_mapping: "Edit Mapping",
    configure: "Configure",
    upload_sample_sheet: "Upload a Sample Sheet",
    upload_sample_sheet_desc:
      "Upload one real sheet from this distributor. We'll only read its column headers -- no sales data is imported at this step.",
    assign_columns: "Assign Each Column",
    assign_columns_desc:
      "For every column detected in the sheet, choose what it represents. Product and Sales Value are required; the rest are optional.",
    detected_column: "Detected Column",
    represents: "Represents",
    upload_different_sheet: "Upload a different sample instead",
    save_mapping: "Save Mapping",
    role_ignore: "-- Ignore this column --",
    role_product: "Product / Medicine Name",
    role_value: "Sales Value (Amount)",
    role_quantity: "Quantity / Units Pulled",
    role_area: "Area / Territory (raw text)",
    role_pharmacy: "Pharmacy / Client Name",
    supply_type: "Supply Type",
    supply_type_hint:
      'Commercial and Tender business from the same wholesaler (e.g. "Ibn Sina" vs "Tender Ibn Sina") are separate distributor entries.',
    type_commercial: "Commercial / Trade",
    type_tender: "Tender / Institutional",
    unmatched_territories: "Unmatched Territories",
    unmatched_territories_desc:
      "Raw territory text from imported sheets that isn't linked to a real Area yet. Link each one once to attribute those sales to the right rep.",
    raw_territory_text: "Raw Text",
    affected_rows: "Rows",
    link_to_area: "Link to Area",
    select_area: "-- Select Area --",
    link: "Link",
    linked_successfully: "Territory linked and matching sales attributed to the rep.",
    select_area_first: "Select an Area first.",
  },
  ar: {
    distributor_management: "إدارة الموزعين",
    total_distributors: "إجمالي الموزعين",
    add_distributor: "إضافة موزّع",
    search_distributors: "البحث بالاسم...",
    distributor_name: "اسم الموزّع",
    actions: "إجراءات",
    no_distributors_found: "لا يوجد موزعين",
    no_distributors_desc: "أضف أول موزّع عندك عشان تبدأ تربط شيتات مبيعاته.",
    cancel: "إلغاء",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    confirm_delete: "تأكيد الحذف",
    delete_distributor_msg: "هل أنت متأكد أنك تريد حذف هذا الموزّع؟",
    mapping_status: "ربط الشيت",
    mapped: "متربط",
    not_configured: "غير مضبوط",
    configure_mapping: "ضبط ربط الشيت",
    edit_mapping: "تعديل الربط",
    configure: "ضبط",
    upload_sample_sheet: "ارفع نموذج شيت",
    upload_sample_sheet_desc:
      "ارفع شيت حقيقي واحد من الموزّع ده. هنقرأ بس أسماء الأعمدة -- مفيش أي بيانات مبيعات هتتسجل في الخطوة دي.",
    assign_columns: "حدد كل عمود",
    assign_columns_desc:
      "لكل عمود ظاهر في الشيت، حدد بيمثل إيه. عمود المنتج والقيمة إلزاميين، الباقي اختياري.",
    detected_column: "العمود المكتشف",
    represents: "بيمثل",
    upload_different_sheet: "ارفع نموذج تاني بدل ده",
    save_mapping: "حفظ الربط",
    role_ignore: "-- تجاهل العمود ده --",
    role_product: "اسم المنتج / الدواء",
    role_value: "قيمة المبيعات",
    role_quantity: "الكمية / عدد الوحدات المسحوبة",
    role_area: "المنطقة / الإقليم (نص خام)",
    role_pharmacy: "اسم الصيدلية / العميل",
    supply_type: "نوع التوريد",
    supply_type_hint:
      'التجاري والمناقصات من نفس الموزّع (زي "ابن سينا" و"Tender ابن سينا") بيتسجلوا كموزّعين منفصلين.',
    type_commercial: "تجاري",
    type_tender: "مناقصات",
    unmatched_territories: "مناطق غير مربوطة",
    unmatched_territories_desc:
      "نص المنطقة الخام من الشيتات المستوردة اللي لسه مش مربوط بمنطقة حقيقية. اربط كل واحدة مرة عشان مبيعاتها تتحسب على المندوب الصح.",
    raw_territory_text: "النص الخام",
    affected_rows: "عدد الصفوف",
    link_to_area: "اربط بمنطقة",
    select_area: "-- اختار المنطقة --",
    link: "اربط",
    linked_successfully: "اتربطت المنطقة وحسبنا المبيعات المطابقة على المندوب.",
    select_area_first: "اختار منطقة الأول.",
  },
};

function getDistributorsList() {
  return (window.store && window.store.distributors.getAll()) || [];
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

  distributorModal = new bootstrap.Modal(
    document.getElementById("distributorModal"),
  );
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  mappingModal = new bootstrap.Modal(document.getElementById("mappingModal"));

  if (window.translations) {
    window.translations.en = {
      ...window.translations.en,
      ...distributorTranslations.en,
    };
    window.translations.ar = {
      ...window.translations.ar,
      ...distributorTranslations.ar,
    };
  }

  renderDistributors();
  updateStats();
  renderPendingAreas();
});

function renderDistributors(filterText = "") {
  const tableBody = document.getElementById("distributors-table-body");
  const emptyState = document.getElementById("empty-state");
  const tableView = document.getElementById("table-view");
  if (tableBody) tableBody.replaceChildren();

  const currentDistributors = getDistributorsList();
  const filtered = currentDistributors.filter((d) =>
    d.name.toLowerCase().includes(filterText.toLowerCase()),
  );

  const isAr = document.documentElement.dir === "rtl";

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (tableView) tableView.style.display = "none";
  } else {
    if (emptyState) emptyState.style.display = "none";
    if (tableView) tableView.style.display = "block";
  }

  filtered.forEach((dist) => {
    const isTender = dist.type === "tender";
    const typeBadge = isTender
      ? `<span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-pill">${isAr ? distributorTranslations.ar.type_tender : distributorTranslations.en.type_tender}</span>`
      : `<span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill">${isAr ? distributorTranslations.ar.type_commercial : distributorTranslations.en.type_commercial}</span>`;
    const hasMapping = !!(
      dist.columnMap &&
      dist.columnMap.product &&
      dist.columnMap.value
    );
    const mappingBadge = hasMapping
      ? `<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill">${isAr ? distributorTranslations.ar.mapped : distributorTranslations.en.mapped}</span>`
      : `<span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-pill">${isAr ? distributorTranslations.ar.not_configured : distributorTranslations.en.not_configured}</span>`;
    const configureLabel = hasMapping
      ? isAr
        ? distributorTranslations.ar.edit_mapping
        : distributorTranslations.en.edit_mapping
      : isAr
        ? distributorTranslations.ar.configure
        : distributorTranslations.en.configure;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-3 fw-medium">
        <div class="d-flex align-items-center">
          <div class="avatar-circle me-2" style="width: 32px; height: 32px; font-size: 14px;">${esc((dist.name || "D").charAt(0))}</div>
          <span>${esc(dist.name)}</span>
        </div>
      </td>
      <td class="px-4 py-3">${typeBadge}</td>
      <td class="px-4 py-3">
        <div class="d-flex align-items-center gap-2">
          ${mappingBadge}
          <button class="btn btn-sm btn-outline-primary" onclick="openMappingModal('${esc(dist.id)}')">
            <i class="fas fa-table-columns me-1"></i>${esc(configureLabel)}
          </button>
        </div>
      </td>
      <td class="px-4 py-3 text-end area-actions-cell">
        <button class="btn btn-sm btn-light me-1 text-primary" onclick="openEditModal('${esc(dist.id)}')" title="${isAr ? distributorTranslations.ar.edit : distributorTranslations.en.edit}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-light text-danger" onclick="openDeleteModal('${esc(dist.id)}')" title="${isAr ? distributorTranslations.ar.delete : distributorTranslations.en.delete}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  if (typeof applyTranslations === "function") {
    applyTranslations(document.documentElement.lang);
  }
}

function updateStats() {
  const total = getDistributorsList().length;
  document.getElementById("total-count-header").textContent = total;
  document.getElementById("stat-total").textContent = total;
}

function filterDistributors() {
  const term = document.getElementById("search-input").value;
  renderDistributors(term);
}

function openAddModal() {
  document.getElementById("distributorForm").reset();
  document.getElementById("distributorId").value = "";
  document.getElementById("distributorType").value = "commercial";
  document.getElementById("distributorModalTitle").textContent =
    document.documentElement.dir === "rtl"
      ? distributorTranslations.ar.add_distributor
      : distributorTranslations.en.add_distributor;
  distributorModal.show();
}

function openEditModal(id) {
  const dist = getDistributorsList().find((d) => d.id === id);
  if (dist) {
    document.getElementById("distributorId").value = dist.id;
    document.getElementById("distributorName").value = dist.name;
    document.getElementById("distributorType").value =
      dist.type === "tender" ? "tender" : "commercial";
    document.getElementById("distributorModalTitle").textContent =
      document.documentElement.dir === "rtl"
        ? distributorTranslations.ar.edit
        : distributorTranslations.en.edit;
    distributorModal.show();
  }
}

function saveDistributor() {
  const id = document.getElementById("distributorId").value;
  const name = document.getElementById("distributorName").value.trim();
  const type = document.getElementById("distributorType").value === "tender"
    ? "tender"
    : "commercial";

  if (!name) {
    if (typeof showToast === "function")
      showToast("Distributor Name is required.", "warning");
    return;
  }

  // New distributors get a stable slug id (e.g. "ibn-sina") so the future
  // per-distributor column-mapping and area-alias records can reference
  // it predictably instead of a plain timestamp.
  const targetId =
    id ||
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now().toString(36);

  if (window.store && window.store.distributors) {
    window.store.distributors.save({ id: targetId, name, type });
  }

  distributorModal.hide();
  renderDistributors();
  updateStats();
  if (typeof showToast === "function")
    showToast("Distributor saved successfully.", "success");
}

function openDeleteModal(id) {
  document.getElementById("deleteDistributorId").value = id;
  deleteModal.show();
}

function confirmDelete() {
  const id = document.getElementById("deleteDistributorId").value;

  if (window.store && window.store.distributors) {
    window.store.distributors.delete(id);
  }

  deleteModal.hide();
  renderDistributors();
  updateStats();
  if (typeof showToast === "function")
    showToast("Distributor deleted successfully.", "info");
}

// ==========================================
// Section: Column Mapping Modal
// Teaches the system which column in THIS distributor's sheet holds the
// pharmacy name, product, sales value, and (optionally) the raw area
// text -- the pharmacy-level rows this produces are the single source
// of truth that both the Sales report (aggregated) and any future
// Territory/Brick-style achievement view will be computed from.
// ==========================================
const MAPPING_ROLES = [
  { value: "", i18nKey: "role_ignore" },
  { value: "pharmacy", i18nKey: "role_pharmacy" },
  { value: "product", i18nKey: "role_product" },
  { value: "value", i18nKey: "role_value" },
  { value: "quantity", i18nKey: "role_quantity" },
  { value: "area", i18nKey: "role_area" },
];

function openMappingModal(id) {
  mappingTargetDistId = id;
  mappingDetectedHeaders = [];
  const dist = getDistributorsList().find((d) => d.id === id);
  const isAr = document.documentElement.dir === "rtl";
  const nameEl = document.getElementById("mappingModalDistName");
  if (nameEl && dist) {
    nameEl.textContent = isAr ? `الموزّع: ${dist.name}` : `Distributor: ${dist.name}`;
  }
  resetMappingUpload();
  mappingModal.show();
}

function resetMappingUpload() {
  mappingDetectedHeaders = [];
  const fileInput = document.getElementById("mappingFileInput");
  if (fileInput) fileInput.value = "";
  document.getElementById("mappingUploadStep").style.display = "block";
  document.getElementById("mappingRolesStep").style.display = "none";
  document.getElementById("saveMappingBtn").style.display = "none";
}

function handleMappingFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (typeof XLSX === "undefined") {
    if (typeof showToast === "function")
      showToast("Excel reader library failed to load. Check your connection.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
        defval: "",
      });
      const headerRow =
        rows.find((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== "")) || [];
      const headers = headerRow
        .map((h) => String(h).trim())
        .filter((h) => h !== "");
      if (!headers.length) {
        if (typeof showToast === "function")
          showToast("No columns detected in this sheet.", "error");
        return;
      }
      mappingDetectedHeaders = headers;
      buildRolesTable(headers);
      document.getElementById("mappingUploadStep").style.display = "none";
      document.getElementById("mappingRolesStep").style.display = "block";
      document.getElementById("saveMappingBtn").style.display = "inline-block";
    } catch (err) {
      console.error("Error reading sheet headers:", err);
      if (typeof showToast === "function")
        showToast(
          "Couldn't read this file's columns. Make sure it's a valid Excel/CSV file.",
          "error",
        );
    }
  };
  reader.readAsArrayBuffer(file);
}

function buildRolesTable(headers) {
  const tbody = document.getElementById("mappingRolesTableBody");
  if (!tbody) return;
  const isAr = document.documentElement.dir === "rtl";
  const t = isAr ? distributorTranslations.ar : distributorTranslations.en;
  const dist = getDistributorsList().find((d) => d.id === mappingTargetDistId);
  const existingMap = (dist && dist.columnMap) || {};

  tbody.replaceChildren();
  headers.forEach((header, idx) => {
    // Pre-select a role if this exact header text was already mapped for
    // this distributor before (e.g. re-configuring after the sheet
    // layout added or removed a column).
    let preselected = "";
    Object.keys(existingMap).forEach((role) => {
      if (existingMap[role] === header) preselected = role;
    });

    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.className = "fw-medium";
    nameTd.textContent = header;

    const roleTd = document.createElement("td");
    const select = document.createElement("select");
    select.className = "form-select form-select-sm mapping-role-select";
    select.dataset.header = header;
    select.dataset.rowIndex = String(idx);
    MAPPING_ROLES.forEach((role) => {
      const opt = document.createElement("option");
      opt.value = role.value;
      opt.textContent = t[role.i18nKey];
      if (role.value === preselected) opt.selected = true;
      select.appendChild(opt);
    });
    roleTd.appendChild(select);

    tr.appendChild(nameTd);
    tr.appendChild(roleTd);
    tbody.appendChild(tr);
  });
}

function saveMapping() {
  const selects = document.querySelectorAll(".mapping-role-select");
  const columnMap = {};
  const usedRoles = {};
  let duplicateRole = null;

  selects.forEach((sel) => {
    const role = sel.value;
    if (!role) return;
    if (usedRoles[role]) {
      duplicateRole = role;
    }
    usedRoles[role] = true;
    columnMap[role] = sel.dataset.header;
  });

  if (duplicateRole) {
    if (typeof showToast === "function")
      showToast(
        "Each role (Product, Value, Area, Pharmacy) can only be assigned to one column.",
        "warning",
      );
    return;
  }

  if (!columnMap.product || !columnMap.value) {
    if (typeof showToast === "function")
      showToast("Product and Sales Value columns are required.", "warning");
    return;
  }

  if (window.store && window.store.distributors && mappingTargetDistId) {
    window.store.distributors.save({
      id: mappingTargetDistId,
      columnMap,
      mappingSampleHeaders: mappingDetectedHeaders,
    });
  }

  mappingModal.hide();
  renderDistributors();
  updateStats();
  if (typeof showToast === "function")
    showToast("Mapping saved successfully.", "success");
}

// ==========================================
// Section: Unmatched Territories
// Shows raw (distributorId, areaRaw) pairs from imported
// distributorSales rows that have no Area alias yet, and lets the admin
// link each one to a real Area -- which retroactively attributes every
// already-imported row with that text to that Area's rep.
// ==========================================
function renderPendingAreas() {
  const section = document.getElementById("pendingAreasSection");
  const tbody = document.getElementById("pendingAreasTableBody");
  if (!section || !tbody) return;
  if (!window.store || !window.store.distributorSales) {
    section.style.display = "none";
    return;
  }

  const isAr = document.documentElement.dir === "rtl";
  const t = isAr ? distributorTranslations.ar : distributorTranslations.en;
  const pending = window.store.distributorSales.getPendingAreaTexts();

  if (!pending.length) {
    section.style.display = "none";
    tbody.replaceChildren();
    return;
  }
  section.style.display = "block";
  tbody.replaceChildren();

  const distributors = getDistributorsList();
  const areas = (window.store.areas && window.store.areas.getAll()) || [];

  pending.forEach((entry, idx) => {
    const dist = distributors.find((d) => d.id === entry.distributorId);
    const rowId = `pendingArea_${idx}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2">${esc(dist ? dist.name : entry.distributorId)}</td>
      <td class="px-3 py-2 fw-medium">${esc(entry.areaRaw)}</td>
      <td class="px-3 py-2">${entry.count}</td>
      <td class="px-3 py-2">
        <select class="form-select form-select-sm" id="${rowId}_select">
          <option value="">${esc(t.select_area)}</option>
          ${areas.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("")}
        </select>
      </td>
      <td class="px-3 py-2">
        <button class="btn btn-sm btn-primary" onclick="linkAreaAlias('${esc(entry.distributorId)}', '${esc(entry.areaRaw).replace(/'/g, "&#39;")}', '${rowId}_select')">
          ${esc(t.link)}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function linkAreaAlias(distributorId, areaRaw, selectId) {
  const isAr = document.documentElement.dir === "rtl";
  const t = isAr ? distributorTranslations.ar : distributorTranslations.en;
  const select = document.getElementById(selectId);
  const areaId = select ? select.value : "";

  if (!areaId) {
    if (typeof showToast === "function") showToast(t.select_area_first, "warning");
    return;
  }

  if (window.store && window.store.areas) {
    window.store.areas.addAlias(areaId, distributorId, areaRaw);
  }
  if (window.store && window.store.distributorSales) {
    window.store.distributorSales.applyAreaMatching();
  }

  renderPendingAreas();
  if (typeof showToast === "function") showToast(t.linked_successfully, "success");
}
