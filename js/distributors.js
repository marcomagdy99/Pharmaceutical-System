/**
 * @file distributors.js
 * @description Distributor Management Logic, backed by the central store
 * (window.store.distributors -- see store.js). Mirrors areas.js's pattern
 * but Distributors don't get assigned to a rep; this is just the source
 * list that the (future) sales-sheet import mapping will reference by id.
 */

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
    role_date: "Transaction Date (optional)",
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
    unmatched_products: "Unmatched Products",
    unmatched_products_desc:
      "Raw product text from imported sheets that isn't linked to a real product yet. Link each one once to attribute those sales to the right product Line.",
    raw_product_text: "Raw Text",
    link_to_product: "Link to Product",
    select_product: "-- Select Product --",
    product_linked_successfully: "Product linked and matching sales attributed to its Line.",
    select_product_first: "Select a product first.",
    import_history: "Import History",
    import_history_desc: "Every sheet uploaded so far. Deleting a batch removes all the sales rows it created -- use this to undo a mistaken upload (wrong distributor, wrong file, etc.).",
    import_month: "Month",
    import_file: "File",
    import_uploaded_at: "Uploaded",
    no_imports_yet: "No sheets uploaded yet.",
    confirm_delete_batch: "Delete this import? This will permanently remove",
    confirm_delete_batch_suffix: "sales rows. This cannot be undone.",
    batch_deleted: "Import deleted.",
    tab_distributors_mapping: "Distributors & Mapping",
    tab_sales_import: "Upload Sales Sheets",
    upload_sales_title: "Upload Monthly Sales Sheet",
    upload_sales_desc: "Select the distributor, month, and year, then upload the official sales spreadsheet.",
    select_distributor: "-- Select Distributor --",
    label_month: "Month",
    label_year: "Year",
    upload_excel_btn: "Upload Excel Sheet",
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
    role_date: "تاريخ العملية (اختياري)",
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
    unmatched_products: "منتجات غير مربوطة",
    unmatched_products_desc:
      "نص المنتج الخام من الشيتات المستوردة اللي لسه مش مربوط بمنتج حقيقي. اربط كل واحد مرة عشان مبيعاته تتحسب على الـ Line الصح.",
    raw_product_text: "النص الخام",
    link_to_product: "اربط بمنتج",
    select_product: "-- اختار المنتج --",
    product_linked_successfully: "اتربط المنتج وحسبنا المبيعات المطابقة على الـ Line بتاعه.",
    select_product_first: "اختار منتج الأول.",
    import_history: "سجل الاستيراد",
    import_history_desc: "كل شيت اترفع لحد دلوقتي. مسح رفعة بيشيل كل صفوف المبيعات اللي اتسجلت منها -- استخدمها عشان تلغي رفعة غلط (موزّع غلط، ملف غلط...).",
    import_month: "الشهر",
    import_file: "الملف",
    import_uploaded_at: "تاريخ الرفع",
    no_imports_yet: "مفيش شيتات اترفعت لحد دلوقتي.",
    confirm_delete_batch: "تمسح الاستيراد ده؟ هيتشال نهائيًا",
    confirm_delete_batch_suffix: "صف مبيعات. الإجراء ده مايتراجعش.",
    batch_deleted: "اتمسح الاستيراد.",
    tab_distributors_mapping: "الموزعين وضبط القوالب",
    tab_sales_import: "رفع شيتات المبيعات",
    upload_sales_title: "رفع شيت المبيعات الشهري",
    upload_sales_desc: "اختر الموزع والشهر والسنة ثم ارفع شيت المبيعات المعتمد.",
    select_distributor: "-- اختر الموزّع --",
    label_month: "الشهر",
    label_year: "السنة",
    upload_excel_btn: "رفع شيت إكسيل",
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
  renderPendingProducts();
  renderImportBatches();
  populateUploadControls();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab") === "import") {
    switchDistTab("import");
  }
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
          <div class="avatar-circle me-2" style="width: 32px; height: 32px; font-size: 14px;">${window.escapeHtml((dist.name || "D").charAt(0))}</div>
          <span>${window.escapeHtml(dist.name)}</span>
        </div>
      </td>
      <td class="px-4 py-3">${typeBadge}</td>
      <td class="px-4 py-3">
        <div class="d-flex align-items-center gap-2">
          ${mappingBadge}
          <button class="btn btn-sm btn-outline-primary" onclick="openMappingModal('${window.escapeHtml(dist.id)}')">
            <i class="fas fa-table-columns me-1"></i>${window.escapeHtml(configureLabel)}
          </button>
        </div>
      </td>
      <td class="px-4 py-3 text-end area-actions-cell">
        <button class="btn btn-sm btn-light me-1 text-primary" onclick="openEditModal('${window.escapeHtml(dist.id)}')" title="${isAr ? distributorTranslations.ar.edit : distributorTranslations.en.edit}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-light text-danger" onclick="openDeleteModal('${window.escapeHtml(dist.id)}')" title="${isAr ? distributorTranslations.ar.delete : distributorTranslations.en.delete}">
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
  { value: "date", i18nKey: "role_date" },
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
      <td class="px-3 py-2">${window.escapeHtml(dist ? dist.name : entry.distributorId)}</td>
      <td class="px-3 py-2 fw-medium">${window.escapeHtml(entry.areaRaw)}</td>
      <td class="px-3 py-2">${entry.count}</td>
      <td class="px-3 py-2">
        <select class="form-select form-select-sm" id="${rowId}_select">
          <option value="">${window.escapeHtml(t.select_area)}</option>
          ${areas.map((a) => `<option value="${window.escapeHtml(a.id)}">${window.escapeHtml(a.name)}</option>`).join("")}
        </select>
      </td>
      <td class="px-3 py-2">
        <button class="btn btn-sm btn-primary" onclick="linkAreaAlias('${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.areaRaw).replace(/'/g, "&#39;")}', '${rowId}_select')">
          ${window.escapeHtml(t.link)}
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

// ==========================================
// Section: Unmatched Products
// Same idea as Unmatched Territories, but for raw product text ->
// real product (and therefore its Line).
// ==========================================
function renderPendingProducts() {
  const section = document.getElementById("pendingProductsSection");
  const tbody = document.getElementById("pendingProductsTableBody");
  if (!section || !tbody) return;
  if (!window.store || !window.store.distributorSales || !window.store.productLines) {
    section.style.display = "none";
    return;
  }

  const isAr = document.documentElement.dir === "rtl";
  const t = isAr ? distributorTranslations.ar : distributorTranslations.en;
  const pending = window.store.distributorSales.getPendingProductTexts();

  if (!pending.length) {
    section.style.display = "none";
    tbody.replaceChildren();
    return;
  }
  section.style.display = "block";
  tbody.replaceChildren();

  const distributors = getDistributorsList();
  const lines = window.store.productLines.getAll();

  pending.forEach((entry, idx) => {
    const dist = distributors.find((d) => d.id === entry.distributorId);
    const rowId = `pendingProduct_${idx}`;

    const optionsHtml = lines
      .map((line) => {
        const products = Array.isArray(line.products) ? line.products : [];
        if (!products.length) return "";
        const opts = products
          .map((p) => `<option value="${window.escapeHtml(line.id)}::${window.escapeHtml(p.id)}">${window.escapeHtml(p.name)}${p.dosage ? " " + window.escapeHtml(p.dosage) : ""}</option>`)
          .join("");
        return `<optgroup label="${window.escapeHtml(line.name)}">${opts}</optgroup>`;
      })
      .join("");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2">${window.escapeHtml(dist ? dist.name : entry.distributorId)}</td>
      <td class="px-3 py-2 fw-medium">${window.escapeHtml(entry.productRaw)}</td>
      <td class="px-3 py-2">${entry.count}</td>
      <td class="px-3 py-2">
        <select class="form-select form-select-sm" id="${rowId}_select">
          <option value="">${window.escapeHtml(t.select_product)}</option>
          ${optionsHtml}
        </select>
      </td>
      <td class="px-3 py-2">
        <button class="btn btn-sm btn-primary" onclick="linkProductAlias('${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.productRaw).replace(/'/g, "&#39;")}', '${rowId}_select')">
          ${window.escapeHtml(t.link)}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function linkProductAlias(distributorId, productRaw, selectId) {
  const isAr = document.documentElement.dir === "rtl";
  const t = isAr ? distributorTranslations.ar : distributorTranslations.en;
  const select = document.getElementById(selectId);
  const combined = select ? select.value : "";

  if (!combined) {
    if (typeof showToast === "function") showToast(t.select_product_first, "warning");
    return;
  }
  const [lineId, productId] = combined.split("::");

  if (window.store && window.store.productLines) {
    window.store.productLines.addProductAlias(lineId, productId, distributorId, productRaw);
  }
  if (window.store && window.store.distributorSales) {
    window.store.distributorSales.applyProductMatching();
  }

  renderPendingProducts();
  if (typeof showToast === "function") showToast(t.product_linked_successfully, "success");
}

// ==========================================
// Section: Import History
// Lists every upload batch (store.importBatches) and lets the admin
// delete one entirely -- e.g. to undo a mistaken upload -- removing
// every distributorSales row it created (store.distributorSales.deleteByBatch).
// ==========================================
function renderImportBatches() {
  const tbody = document.getElementById("importBatchesTableBody");
  const emptyMsg = document.getElementById("importBatchesEmptyMsg");
  if (!tbody) return;
  if (!window.store || !window.store.importBatches) return;

  const isAr = document.documentElement.dir === "rtl";
  const batches = window.store.importBatches.getAll()
    .slice()
    .sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
  const distributors = getDistributorsList();

  tbody.replaceChildren();

  if (!batches.length) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  batches.forEach((b) => {
    const dist = distributors.find((d) => d.id === b.distributorId);
    const uploadedLabel = b.uploadedAt
      ? new Date(b.uploadedAt).toLocaleString(isAr ? "ar-EG" : "en-US")
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2">${window.escapeHtml(dist ? dist.name : b.distributorId)}</td>
      <td class="px-3 py-2">${window.escapeHtml(b.month)}</td>
      <td class="px-3 py-2">${b.rowCount || 0}</td>
      <td class="px-3 py-2">${window.escapeHtml(b.fileName || "")}</td>
      <td class="px-3 py-2" style="white-space:nowrap;">${window.escapeHtml(uploadedLabel)}</td>
      <td class="px-3 py-2 text-end">
        <button class="btn btn-sm btn-light text-danger" onclick="deleteImportBatch('${window.escapeHtml(b.id)}')" title="Delete">
          🗑️
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteImportBatch(batchId) {
  const isAr = document.documentElement.dir === "rtl";
  const t = isAr ? distributorTranslations.ar : distributorTranslations.en;
  const batch = window.store && window.store.importBatches
    ? window.store.importBatches.getById(batchId)
    : null;
  const rowCount = batch ? (batch.rowCount || 0) : 0;

  if (!confirm(`${t.confirm_delete_batch} ${rowCount} ${t.confirm_delete_batch_suffix}`)) return;

  if (window.store && window.store.distributorSales) {
    window.store.distributorSales.deleteByBatch(batchId);
  }
  if (window.store && window.store.importBatches) {
    window.store.importBatches.delete(batchId);
  }

  renderImportBatches();
  renderPendingAreas();
  renderPendingProducts();
  if (typeof showToast === "function") showToast(t.batch_deleted, "info");
}

// ==========================================
// Section: Sales Sheet Upload & Tab Switching
// ==========================================

function switchDistTab(tabKey) {
  const btnDist = document.getElementById("tabBtn-distributors");
  const btnImport = document.getElementById("tabBtn-import");
  const panelDist = document.getElementById("panel-distributors");
  const panelImport = document.getElementById("panel-import");

  if (tabKey === "import") {
    if (btnDist) btnDist.classList.remove("active");
    if (btnImport) btnImport.classList.add("active");
    if (panelDist) panelDist.style.display = "none";
    if (panelImport) panelImport.style.display = "block";

    populateUploadControls();
    renderPendingAreas();
    renderPendingProducts();
    renderImportBatches();
  } else {
    if (btnDist) btnDist.classList.add("active");
    if (btnImport) btnImport.classList.remove("active");
    if (panelDist) panelDist.style.display = "block";
    if (panelImport) panelImport.style.display = "none";

    renderDistributors();
    updateStats();
  }
}

function populateUploadControls() {
  const distSelect = document.getElementById("uploadDistributorSelect");
  const monthSelect = document.getElementById("uploadMonthSelect");
  const yearSelect = document.getElementById("uploadYearSelect");
  const isAr = document.documentElement.dir === "rtl";

  if (distSelect) {
    const prevVal = distSelect.value;
    distSelect.innerHTML = `<option value="">${isAr ? "-- اختر الموزّع --" : "-- Select Distributor --"}</option>`;
    const distributors = getDistributorsList();
    distributors.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      const isMapped = d.columnMap && d.columnMap.product && d.columnMap.value;
      const mapLabel = isMapped
        ? (isAr ? " (مربوط)" : " (Mapped)")
        : (isAr ? " (غير مربوط)" : " (Unmapped)");
      opt.textContent = `${d.name}${mapLabel}`;
      distSelect.appendChild(opt);
    });
    if (prevVal) distSelect.value = prevVal;
  }

  if (monthSelect && monthSelect.options.length === 0) {
    const monthNamesEn = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthNamesAr = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    monthNamesEn.forEach((m, idx) => {
      const val = String(idx + 1).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = isAr ? `${val} - ${monthNamesAr[idx]}` : `${val} - ${m}`;
      if (val === currentMonth) opt.selected = true;
      monthSelect.appendChild(opt);
    });
  }

  if (yearSelect && yearSelect.options.length === 0) {
    const currentYear = String(new Date().getFullYear());
    ["2025", "2026", "2027"].forEach((y) => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    });
  }
}

function triggerExcelUpload() {
  const distSelect = document.getElementById("uploadDistributorSelect");
  const distId = distSelect ? distSelect.value : "";
  const isAr = document.documentElement.dir === "rtl";

  if (!distId) {
    if (typeof showToast === "function") {
      showToast(isAr ? "اختر الموزّع الأول." : "Select a distributor first.", "warning");
    }
    return;
  }

  const dist = window.store && window.store.distributors ? window.store.distributors.getById(distId) : null;
  const hasMapping = dist && dist.columnMap && dist.columnMap.product && dist.columnMap.value;
  if (!hasMapping) {
    if (typeof showToast === "function") {
      showToast(
        isAr
          ? "الموزّع ده لسه مفيهوش ربط أعمدة. اضبطه من تبويب قائمة الموزعين الأول."
          : "This distributor's sheet columns aren't mapped yet. Configure it from the Distributors tab first.",
        "error"
      );
    }
    return;
  }

  const fileInput = document.getElementById("salesExcelFileInput");
  if (fileInput) fileInput.click();
}

function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const isAr = document.documentElement.dir === "rtl";

  const distSelect = document.getElementById("uploadDistributorSelect");
  const monthSelect = document.getElementById("uploadMonthSelect");
  const yearSelect = document.getElementById("uploadYearSelect");
  const distId = distSelect ? distSelect.value : "";
  const month = monthSelect ? monthSelect.value : "";
  const year = yearSelect ? yearSelect.value : "";
  const dist = window.store && window.store.distributors ? window.store.distributors.getById(distId) : null;

  if (!dist || !dist.columnMap || !dist.columnMap.product || !dist.columnMap.value || !month || !year) {
    if (typeof showToast === "function") {
      showToast(isAr ? "محتاج تختار الموزّع والشهر والسنة الأول." : "Select a distributor, month, and year first.", "warning");
    }
    e.target.value = "";
    return;
  }

  if (typeof XLSX === "undefined") {
    if (typeof showToast === "function") {
      showToast(isAr ? "مكتبة قراءة الإكسيل غير محملة." : "Excel reader library failed to load.", "error");
    }
    e.target.value = "";
    return;
  }

  const monthKey = `${year}-${month}`;
  const existingBatch = window.store && window.store.importBatches
    ? window.store.importBatches.find(distId, monthKey)
    : null;
  let replacingPreviousBatch = false;

  if (existingBatch) {
    const uploadedDate = existingBatch.uploadedAt ? new Date(existingBatch.uploadedAt).toLocaleString() : "";
    const confirmMsg = isAr
      ? `اتعملت رفعة قبل كده لـ "${dist.name}" لشهر ${monthKey} (${existingBatch.rowCount} صف${uploadedDate ? '، بتاريخ ' + uploadedDate : ''}). لو كملت، الرفعة القديمة هتتمسح ويتحل محلها الملف الجديد بالكامل. عايز تكمل؟`
      : `A sheet was already uploaded for "${dist.name}" / ${monthKey} (${existingBatch.rowCount} rows${uploadedDate ? ', on ' + uploadedDate : ''}). Continuing will replace that previous upload entirely. Continue?`;
    if (!confirm(confirmMsg)) {
      e.target.value = "";
      return;
    }
    replacingPreviousBatch = true;
  }

  if (typeof showToast === "function") {
    showToast(isAr ? `جاري معالجة الشيت: ${file.name}...` : `Processing file: ${file.name}...`, "info");
  }

  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const map = dist.columnMap;
      const batchId = "batch_" + Date.now();
      const imported = [];
      let returnsCount = 0;
      let skippedInvalid = 0;

      rows.forEach((row, idx) => {
        const productRaw = map.product ? row[map.product] : "";
        const valueRaw = map.value ? row[map.value] : "";
        const quantityRaw = map.quantity ? row[map.quantity] : "";
        const dateRaw = map.date ? row[map.date] : "";
        const product = String(productRaw || "").trim();

        const numericValueRaw = parseFloat(String(valueRaw).replace(/[^0-9.-]/g, ""));
        let numericQuantity = map.quantity && quantityRaw !== "" && quantityRaw !== null && quantityRaw !== undefined
          ? parseFloat(String(quantityRaw).replace(/[^0-9.-]/g, ""))
          : null;

        let parsedDate = null;
        if (map.date && dateRaw !== "" && dateRaw !== null && dateRaw !== undefined) {
          if (dateRaw instanceof Date && !isNaN(dateRaw.getTime())) {
            parsedDate = dateRaw.toISOString().slice(0, 10);
          } else if (typeof dateRaw === "number") {
            const d = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
            if (!isNaN(d.getTime())) parsedDate = d.toISOString().slice(0, 10);
          } else {
            const d = new Date(String(dateRaw).trim());
            if (!isNaN(d.getTime())) parsedDate = d.toISOString().slice(0, 10);
          }
        }

        if (!product || isNaN(numericValueRaw)) {
          skippedInvalid++;
          return;
        }

        let numericValue = numericValueRaw;

        // A row is definitely a return/credit note if either the quantity is negative OR the value is negative
        const hasNegativeQuantity = numericQuantity !== null && !isNaN(numericQuantity) && numericQuantity < 0;
        const hasNegativeValue = numericValue < 0;
        const isReturn = hasNegativeQuantity || hasNegativeValue;

        if (isReturn) {
          returnsCount++;

          // Enforce consistent negative signs on both dimensions for correct arithmetic deduction
          numericValue = -Math.abs(numericValue);
          if (numericQuantity !== null && !isNaN(numericQuantity)) {
            numericQuantity = -Math.abs(numericQuantity);
          }
        } else {
          // Ensure standard sales rows do not carry accidental negative artifacts
          numericValue = Math.abs(numericValue);
          if (numericQuantity !== null && !isNaN(numericQuantity)) {
            numericQuantity = Math.abs(numericQuantity);
          }
        }

        imported.push({
          id: `dsale_${Date.now()}_${idx}`,
          batchId,
          distributorId: distId,
          month: monthKey,
          date: parsedDate,
          product,
          value: numericValue,
          quantity: numericQuantity !== null && !isNaN(numericQuantity) ? numericQuantity : null,
          pharmacyName: map.pharmacy ? String(row[map.pharmacy] || "").trim() : "",
          areaRaw: map.area ? String(row[map.area] || "").trim() : "",
          repId: null,
          dmId: null,
          lmId: null,
          lineId: null,
          areaId: null,
        });
      });

      if (replacingPreviousBatch && existingBatch && window.store && window.store.distributorSales) {
        window.store.distributorSales.deleteByBatch(existingBatch.id);
        window.store.importBatches.delete(existingBatch.id);
      }

      if (window.store && window.store.distributorSales) {
        window.store.distributorSales.addBatch(imported);
      }
      if (window.store && window.store.importBatches) {
        window.store.importBatches.save({
          id: batchId,
          distributorId: distId,
          month: monthKey,
          rowCount: imported.length,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        });
      }

      const totalValue = imported.reduce((sum, r) => sum + r.value, 0);
      const panel = document.getElementById("salesImportResultsPanel");
      if (panel) {
        panel.style.display = "block";
        const replacedNote = replacingPreviousBatch
          ? (isAr ? " (استبدلت رفعة سابقة لنفس الشهر/الموزّع)" : " (replaced a previous upload for this month/distributor)")
          : "";
        panel.innerHTML = isAr
          ? `✅ تم تسجيل <strong>${imported.length}</strong> صف من "${dist.name}" لشهر ${monthKey}${replacedNote} (شاملة ${returnsCount} صف مرتجعات بالسالب). صافي القيمة: <strong>${totalValue.toLocaleString()}</strong>. تم تجاهل ${skippedInvalid} صف ببيانات غير مكتملة.<br><span class="fw-bold">ملاحظة:</span> يمكنك ربط المناطق والمنتجات غير المربوطة من الجداول بالأسفل مباشرة.`
          : `✅ Imported <strong>${imported.length}</strong> rows from "${dist.name}" for ${monthKey}${replacedNote} (including ${returnsCount} negative return rows). Net value: <strong>${totalValue.toLocaleString()}</strong>. Skipped ${skippedInvalid} incomplete rows.<br><span class="fw-bold">Note:</span> You can link unmatched areas and products in the sections below.`;
      }

      renderImportBatches();
      renderPendingAreas();
      renderPendingProducts();

      if (typeof showToast === "function") {
        showToast(
          isAr
            ? `تم استيراد ${imported.length} صف بنجاح.`
            : `Successfully imported ${imported.length} rows.`,
          "success"
        );
      }
    } catch (err) {
      console.error("Error parsing distributor sheet:", err);
      if (typeof showToast === "function") {
        showToast(
          isAr
            ? "تعذرت قراءة الملف. تأكد إنه بنفس شكل الشيت اللي اتعمل عليه الربط."
            : "Could not read this file. Make sure it matches the sheet layout the mapping was configured from.",
          "error"
        );
      }
    }
    e.target.value = "";
  };
  reader.readAsArrayBuffer(file);
}

window.switchDistTab = switchDistTab;
window.triggerExcelUpload = triggerExcelUpload;
window.handleExcelUpload = handleExcelUpload;
window.deleteImportBatch = deleteImportBatch;