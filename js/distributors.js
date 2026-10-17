/**
 * @file distributors.js
 * @description Distributor Management Logic, backed by the central store
 * (window.store.distributors -- see store.js). Mirrors areas.js's pattern
 * but Distributors don't get assigned to a rep; this is just the source
 * list that the (future) sales-sheet import mapping will reference by id.
 */

let distributorModal = null;
let deleteModal = null;

// parseSalesNumber and parseDateStrict are provided globally by app.js
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
    delete_distributor_msg: "Are you sure you want to delete this distributor?",
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
    role_pharmacy_code: "Pharmacy / Client Code",
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
    linked_successfully:
      "Territory linked and matching sales attributed to the rep.",
    select_area_first: "Select an Area first.",
    unmatched_products: "Unmatched Products",
    unmatched_products_desc:
      "Raw product text from imported sheets that isn't linked to a real product yet. Link each one once to attribute those sales to the right product Line.",
    raw_product_text: "Raw Text",
    link_to_product: "Link to Product",
    select_product: "-- Select Product --",
    product_linked_successfully:
      "Product linked and matching sales attributed to its Line.",
    select_product_first: "Select a product first.",
    import_history: "Import History",
    import_history_desc:
      "Every sheet uploaded so far. Deleting a batch removes all the sales rows it created -- use this to undo a mistaken upload (wrong distributor, wrong file, etc.).",
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
    upload_sales_desc:
      "Select the distributor, month, and year, then upload the official sales spreadsheet.",
    select_distributor: "-- Select Distributor --",
    label_month: "Month",
    label_year: "Year",
    upload_excel_btn: "Upload Excel Sheet",
    active_aliases_title: "Active Mapped Aliases",
    active_aliases_desc:
      "View and manage territory and product aliases mapped to distributors. Unlink any accidental mapping with one click.",
    tab_mapped_territories: "Territories",
    tab_mapped_products: "Products",
    mapped_to_area: "Mapped Area",
    mapped_to_product: "Mapped Product (Line)",
    unlink: "Unlink",
    no_mapped_territories: "No territory aliases mapped yet.",
    no_mapped_products: "No product aliases mapped yet.",
    edit_alias: "Edit Mapping",
    edit_territory_mapping: "Edit Territory Mapping",
    edit_product_mapping: "Edit Product Mapping",
    currently_mapped_to: "Currently Mapped To",
    select_new_target: "Select New Target",
    alias_updated_successfully:
      "Mapping updated and sales re-attributed successfully.",
    raw_sheet_text: "Raw Sheet Text",
    save_changes: "Save Changes",
    tab_pharmacy_overrides: "Pharmacy Overrides",
    pharmacy_overrides_title: "Pharmacy Territory Overrides",
    pharmacy_overrides_desc:
      "Route specific pharmacies to a custom territory regardless of the raw brick text in distributor sheets.",
    btn_add_pharmacy_override: "Add Pharmacy Override",
    add_pharmacy_override: "Add Pharmacy Territory Override",
    edit_pharmacy_override: "Edit Pharmacy Territory Override",
    target_area: "Target Territory / Area *",
    col_pharmacy_code: "Pharmacy Code",
    col_pharmacy_name: "Pharmacy Name",
    col_rep: "Assigned Rep",
    col_effective_period: "Effective Scope",
    scope_all_history: "All Time (Full)",
    scope_from_month: "From {month} onwards",
    scope_future_only: "Future Imports Only",
    no_pharmacy_overrides: "No pharmacy territory overrides configured yet.",
    save_override: "Save Override",
    confirm_delete_override:
      "Are you sure you want to remove this pharmacy override? Matching sales will revert to standard territory matching.",
    override_saved_success:
      "Pharmacy override saved. {count} sales rows updated.",
    override_deleted_success:
      "Pharmacy override deleted. {count} sales rows reverted.",
  },
};

function getDistributorsList() {
  return (window.store && window.store.distributors.getAll()) || [];
}

function resolveDistributorItem(distId, distList) {
  if (!distId) return null;
  const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
  const targetId = legacyDistMap[distId] || distId;
  const list = distList || getDistributorsList();
  return (
    list.find((d) => d.id === targetId || d.id === distId) ||
    (window.store && window.store.distributors && window.store.distributors.getById
      ? window.store.distributors.getById(distId)
      : null)
  );
}

function getDistributorItemName(distId, distList) {
  const d = resolveDistributorItem(distId, distList);
  return d ? d.name : (distId || "");
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

  try {
    const elDist = document.getElementById("distributorModal");
    if (elDist && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      distributorModal = new bootstrap.Modal(elDist);
    }
    const elDel = document.getElementById("deleteModal");
    if (elDel && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      deleteModal = new bootstrap.Modal(elDel);
    }
    const elMap = document.getElementById("mappingModal");
    if (elMap && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      mappingModal = new bootstrap.Modal(elMap);
    }
  } catch (err) {
    console.warn("Bootstrap modal initialization warning:", err);
  }

  if (window.translations) {
    window.translations.en = {
      ...window.translations.en,
      ...distributorTranslations.en,
    };
  }

  try { renderDistributors(); } catch (e) { console.error("renderDistributors error:", e); }
  try { updateStats(); } catch (e) { console.error("updateStats error:", e); }
  try { renderPendingAreas(); } catch (e) { console.error("renderPendingAreas error:", e); }
  try { renderPendingProducts(); } catch (e) { console.error("renderPendingProducts error:", e); }
  try { renderMappedAliases(); } catch (e) { console.error("renderMappedAliases error:", e); }
  try { renderImportBatches(); } catch (e) { console.error("renderImportBatches error:", e); }
  try { populateUploadControls(); } catch (e) { console.error("populateUploadControls error:", e); }

  const btnDist = document.getElementById("tabBtn-distributors");
  const btnImport = document.getElementById("tabBtn-import");
  if (btnDist) {
    btnDist.addEventListener("click", () => switchDistTab("distributors"));
  }
  if (btnImport) {
    btnImport.addEventListener("click", () => switchDistTab("import"));
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab") === "import" || window.location.hash === "#import") {
    switchDistTab("import");
  }
});

function renderDistributors(filterText = "") {
  const tableBody = document.getElementById("distributors-table-body");
  const mobileCards = document.getElementById("mobile-cards-view");
  const emptyState = document.getElementById("empty-state");
  const tableView = document.getElementById("table-view");
  if (tableBody) tableBody.replaceChildren();
  if (mobileCards) mobileCards.replaceChildren();

  const currentDistributors = getDistributorsList();
  const filtered = currentDistributors.filter((d) =>
    d.name.toLowerCase().includes(filterText.toLowerCase()),
  );


  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (tableView) tableView.classList.add("dist-hidden");
    if (mobileCards) mobileCards.classList.add("dist-hidden");
  } else {
    if (emptyState) emptyState.style.display = "none";
    if (tableView) tableView.classList.remove("dist-hidden");
    if (mobileCards) mobileCards.classList.remove("dist-hidden");
  }

  filtered.forEach((dist) => {
    const isTender = dist.type === "tender";
    const typeBadge = isTender
      ? `<span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-pill">${distributorTranslations.en.type_tender}</span>`
      : `<span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill">${distributorTranslations.en.type_commercial}</span>`;
    const hasMapping = !!(
      dist.columnMap &&
      dist.columnMap.product &&
      dist.columnMap.value
    );
    const mappingBadge = hasMapping
      ? `<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill">${distributorTranslations.en.mapped}</span>`
      : `<span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-pill">${distributorTranslations.en.not_configured}</span>`;
    const configureLabel = hasMapping ? distributorTranslations.en.edit_mapping : distributorTranslations.en.configure;

    // Desktop table row
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
        <button class="btn btn-sm btn-light me-1 text-primary" onclick="openEditModal('${window.escapeHtml(dist.id)}')" title="${distributorTranslations.en.edit}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-light text-danger" onclick="openDeleteModal('${window.escapeHtml(dist.id)}')" title="${distributorTranslations.en.delete}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    if (tableBody) tableBody.appendChild(tr);

    // Mobile card
    if (mobileCards) {
      const card = document.createElement("div");
      card.className = "dist-mobile-card";
      card.innerHTML = `
        <div class="d-flex align-items-center mb-3">
          <div class="avatar-circle me-3" style="width: 42px; height: 42px; font-size: 18px;">${window.escapeHtml((dist.name || "D").charAt(0))}</div>
          <div class="flex-grow-1 min-width-0">
            <h6 class="mb-1 fw-bold text-truncate">${window.escapeHtml(dist.name)}</h6>
            <div class="d-flex flex-wrap gap-1">${typeBadge} ${mappingBadge}</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="openMappingModal('${window.escapeHtml(dist.id)}')">
            <i class="fas fa-table-columns me-1"></i>${window.escapeHtml(configureLabel)}
          </button>
          <button class="btn btn-sm btn-light rounded-circle dist-mobile-action text-primary" onclick="openEditModal('${window.escapeHtml(dist.id)}')" title="${distributorTranslations.en.edit}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-light rounded-circle dist-mobile-action text-danger" onclick="openDeleteModal('${window.escapeHtml(dist.id)}')" title="${distributorTranslations.en.delete}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      mobileCards.appendChild(card);
    }
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
  const user = (window.checkAuth && window.checkAuth()) || {};
  if (
    window.hasAnyRole &&
    !window.hasAnyRole(["admin", "business_unit", "hr"], user)
  ) {
    if (typeof showToast === "function")
      showToast("Permission Denied.", "error");
    return;
  }
  const id = document.getElementById("distributorId").value;
  const name = document.getElementById("distributorName").value.trim();
  const type =
    document.getElementById("distributorType").value === "tender"
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
  const user = (window.checkAuth && window.checkAuth()) || {};
  if (
    window.hasAnyRole &&
    !window.hasAnyRole(["admin", "business_unit", "hr"], user)
  ) {
    if (typeof showToast === "function")
      showToast("Permission Denied.", "error");
    return;
  }
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
  { value: "pharmacyCode", i18nKey: "role_pharmacy_code" },
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
  const nameEl = document.getElementById("mappingModalDistName");
  if (nameEl && dist) {
    nameEl.textContent = `Distributor: ${dist.name}`;
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
      showToast(
        "Excel reader library failed to load. Check your connection.",
        "error",
      );
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

      // Defensive Header Detection: Find the row with the maximum number of populated cells
      // in the first 15 rows to bypass report title banners and metadata rows (e.g. Ibn Sina/UCP banners).
      let headerRow = [];
      let maxColsCount = 0;
      const inspectLimit = Math.min(15, rows.length);
      for (let i = 0; i < inspectLimit; i++) {
        const row = rows[i];
        if (Array.isArray(row)) {
          const filledCount = row.filter(
            (c) => c !== null && c !== undefined && String(c).trim() !== "",
          ).length;
          if (filledCount > maxColsCount) {
            maxColsCount = filledCount;
            headerRow = row;
          }
        }
      }

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

function guessRoleFromHeader(header, assignedRoles, allHeaders = []) {
  if (!header) return "";
  const h = String(header).trim().toLowerCase();
  const lowerHeaders = allHeaders.map((x) =>
    String(x || "")
      .trim()
      .toLowerCase(),
  );
  const hasValueCol = lowerHeaders.some(
    (x) =>
      x === "value" ||
      x.includes("val") ||
      x.includes("amount") ||
      x.includes("قيمة") ||
      x.includes("مبلغ") ||
      x.includes("صافي"),
  );
  const hasCustomerNameCol = lowerHeaders.some(
    (x) =>
      x.includes("customer name") ||
      x.includes("client name") ||
      x.includes("اسم العميل") ||
      x.includes("اسم الصيدلية"),
  );

  // 1. Pharmacy / Customer Code
  if (!assignedRoles.has("pharmacyCode")) {
    if (
      h.includes("cust_code") ||
      h.includes("client_code") ||
      h.includes("customer_code") ||
      h.includes("pharmacy_code") ||
      h.includes("cust code") ||
      h.includes("client code") ||
      h.includes("customer code") ||
      h.includes("pharmacy code") ||
      h.includes("acc_no") ||
      h.includes("account_no") ||
      h.includes("account code") ||
      h.includes("كود العميل") ||
      h.includes("كود الصيدلية") ||
      h.includes("رقم العميل") ||
      h.includes("رقم الصيدلية") ||
      h.includes("كود الحساب") ||
      ((h === "customer" || h === "client" || h === "cust") &&
        hasCustomerNameCol) ||
      (h.includes("code") && !h.includes("prod") && !h.includes("item")) ||
      (h.includes("كود") && !h.includes("صنف") && !h.includes("منتج"))
    ) {
      return "pharmacyCode";
    }
  }

  // 2. Pharmacy / Customer Name
  if (!assignedRoles.has("pharmacy")) {
    if (
      h.includes("customer name") ||
      h.includes("client name") ||
      h.includes("pharmacy") ||
      h.includes("اسم العميل") ||
      h.includes("اسم الصيدلية") ||
      (!hasCustomerNameCol &&
        (h.includes("customer") ||
          h.includes("client") ||
          h.includes("account") ||
          h.includes("صيدلية") ||
          h.includes("عميل")))
    ) {
      return "pharmacy";
    }
  }

  // 3. Product / Medicine
  if (!assignedRoles.has("product")) {
    if (
      h.includes("product") ||
      h.includes("item name") ||
      h.includes("item") ||
      h.includes("medicine") ||
      h.includes("drug") ||
      h.includes("mat. desc") ||
      h.includes("mat desc") ||
      h.includes("material") ||
      h.includes("صنف") ||
      h.includes("منتج") ||
      h.includes("مستحضر") ||
      h.includes("اسم الصنف") ||
      h.includes("اسم المنتج")
    ) {
      return "product";
    }
  }

  // 4. Quantity / Units (Give priority if 'sales' represents units alongside a 'value' column)
  if (!assignedRoles.has("quantity")) {
    if (
      h.includes("qty") ||
      h.includes("quantity") ||
      h.includes("units") ||
      h.includes("pieces") ||
      h.includes("كمية") ||
      h.includes("عدد") ||
      h.includes("الكمية") ||
      h.includes("الوحدات") ||
      (h.includes("sales") && hasValueCol)
    ) {
      return "quantity";
    }
  }

  // 5. Sales Value
  if (!assignedRoles.has("value")) {
    if (
      h.includes("value") ||
      h.includes("net") ||
      h.includes("val") ||
      h.includes("amount") ||
      h.includes("total") ||
      h.includes("مبيعات") ||
      h.includes("قيمة") ||
      h.includes("صافي") ||
      h.includes("المبلغ") ||
      h.includes("الإجمالي") ||
      h.includes("الاجمالي") ||
      (h.includes("sales") && !hasValueCol)
    ) {
      return "value";
    }
  }

  // 6. Date
  if (!assignedRoles.has("date")) {
    if (
      h.includes("date") ||
      h.includes("تاريخ") ||
      h.includes("التاريخ") ||
      h.includes("day") ||
      h.includes("يوم")
    ) {
      return "date";
    }
  }

  // 7. Area / Territory
  if (!assignedRoles.has("area")) {
    if (
      h.includes("area") ||
      h.includes("territory") ||
      h.includes("brick") ||
      h.includes("region") ||
      h.includes("zone") ||
      h.includes("منطقة") ||
      h.includes("اقليم") ||
      h.includes("إقليم") ||
      h.includes("قطاع") ||
      h.includes("المنطقة")
    ) {
      return "area";
    }
  }

  return "";
}

function buildRolesTable(headers) {
  const tbody = document.getElementById("mappingRolesTableBody");
  if (!tbody) return;
  const t = distributorTranslations.en;
  const dist = getDistributorsList().find((d) => d.id === mappingTargetDistId);
  const existingMap = (dist && dist.columnMap) || {};

  tbody.replaceChildren();

  const assignedRoles = new Set();
  Object.keys(existingMap).forEach((role) => {
    if (headers.includes(existingMap[role])) {
      assignedRoles.add(role);
    }
  });

  headers.forEach((header, idx) => {
    // Pre-select a role if this exact header text was already mapped for
    // this distributor before (e.g. re-configuring after the sheet
    // layout added or removed a column).
    let preselected = "";
    Object.keys(existingMap).forEach((role) => {
      if (existingMap[role] === header) preselected = role;
    });

    if (!preselected) {
      preselected = guessRoleFromHeader(header, assignedRoles, headers);
      if (preselected) {
        assignedRoles.add(preselected);
      }
    }

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
        "Each mapping role can only be assigned to one column.",
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

  const t = distributorTranslations.en;
  const pending = window.store.distributorSales.getPendingAreaTexts();

  if (!pending.length) {
    section.style.display = "none";
    tbody.replaceChildren();
    return;
  }
  section.style.display = "block";
  tbody.replaceChildren();

  const distributors = getDistributorsList();
  const rawAreas = (window.store.areas && window.store.areas.getAll()) || [];

  // Deduplicate areas by geographic name so each territory appears exactly once
  const uniqueAreas = [];
  const seenAreaNames = new Set();
  rawAreas.forEach((a) => {
    const cleanName = String(a.name || "").trim();
    if (cleanName && !seenAreaNames.has(cleanName.toLowerCase())) {
      seenAreaNames.add(cleanName.toLowerCase());
      uniqueAreas.push({ id: a.id, name: cleanName, code: a.code || "" });
    }
  });
  uniqueAreas.sort((a, b) => a.name.localeCompare(b.name));

  const areaOptionsHtml = uniqueAreas
    .map((a) => `<option value="${window.escapeHtml(a.id)}">${window.escapeHtml(a.name)}${a.code ? ` (${window.escapeHtml(a.code)})` : ""}</option>`)
    .join("");

  const mobileContainer = document.getElementById("pendingAreasMobileCards");
  if (mobileContainer) mobileContainer.replaceChildren();

  pending.forEach((entry, idx) => {
    const dist = resolveDistributorItem(entry.distributorId, distributors);
    const rowId = `pendingArea_${idx}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2">${window.escapeHtml(dist ? dist.name : entry.distributorId)}</td>
      <td class="px-3 py-2 fw-medium">${window.escapeHtml(entry.areaRaw)}</td>
      <td class="px-3 py-2">${entry.count}</td>
      <td class="px-3 py-2">
        <select class="form-select form-select-sm" id="${rowId}_select">
          <option value="">${window.escapeHtml(t.select_area)}</option>
          ${areaOptionsHtml}
        </select>
      </td>
      <td class="px-3 py-2">
        <button class="btn btn-sm btn-primary" onclick="linkAreaAlias('${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.areaRaw).replace(/'/g, "&#39;")}', '${rowId}_select')">
          ${window.escapeHtml(t.link)}
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    if (mobileContainer) {
      const card = document.createElement("div");
      card.className = "dist-mobile-card mb-2";
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-secondary-subtle text-secondary border font-monospace"><i class="fas fa-truck me-1"></i>${window.escapeHtml(dist ? dist.name : entry.distributorId)}</span>
          <span class="badge bg-light text-dark border">${entry.count} rows</span>
        </div>
        <div class="fw-bold mb-2 text-primary">
          <i class="fas fa-map-marker-alt me-1 text-danger"></i>${window.escapeHtml(entry.areaRaw)}
        </div>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm flex-grow-1" id="${rowId}_mobile_select">
            <option value="">${window.escapeHtml(t.select_area)}</option>
            ${areaOptionsHtml}
          </select>
          <button class="btn btn-sm btn-primary px-3 text-nowrap" onclick="linkAreaAlias('${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.areaRaw).replace(/'/g, "&#39;")}', '${rowId}_mobile_select')">
            <i class="fas fa-link me-1"></i>${window.escapeHtml(t.link)}
          </button>
        </div>
      `;
      mobileContainer.appendChild(card);
    }
  });
}

function linkAreaAlias(distributorId, areaRaw, selectId) {
  const t = distributorTranslations.en;
  const select = document.getElementById(selectId);
  const areaId = select ? select.value : "";

  if (!areaId) {
    if (typeof showToast === "function")
      showToast(t.select_area_first, "warning");
    return;
  }

  if (window.store && window.store.areas) {
    window.store.areas.addAlias(areaId, distributorId, areaRaw);
  }
  if (window.store && window.store.distributorSales) {
    window.store.distributorSales.applyAreaMatching(true);
  }

  renderPendingAreas();
  renderMappedAliases();
  if (typeof showToast === "function")
    showToast(t.linked_successfully, "success");
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
  if (
    !window.store ||
    !window.store.distributorSales ||
    !window.store.productLines
  ) {
    section.style.display = "none";
    return;
  }

  const t = distributorTranslations.en;
  const pending = window.store.distributorSales.getPendingProductTexts();

  const mobileContainer = document.getElementById("pendingProductsMobileCards");
  if (!pending.length) {
    section.style.display = "none";
    tbody.replaceChildren();
    if (mobileContainer) mobileContainer.replaceChildren();
    return;
  }
  section.style.display = "block";
  tbody.replaceChildren();
  if (mobileContainer) mobileContainer.replaceChildren();

  const distributors = getDistributorsList();
  const lines = window.store.productLines.getAll();

  pending.forEach((entry, idx) => {
    const dist = resolveDistributorItem(entry.distributorId, distributors);
    const rowId = `pendingProduct_${idx}`;

    const optionsHtml = lines
      .map((line) => {
        const products = Array.isArray(line.products) ? line.products : [];
        if (!products.length) return "";
        const opts = products
          .map(
            (p) =>
              `<option value="${window.escapeHtml(line.id)}::${window.escapeHtml(p.id)}">${window.escapeHtml(p.name)}${p.dosage ? " " + window.escapeHtml(p.dosage) : ""}</option>`,
          )
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

    if (mobileContainer) {
      const card = document.createElement("div");
      card.className = "dist-mobile-card mb-2";
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-secondary-subtle text-secondary border font-monospace"><i class="fas fa-truck me-1"></i>${window.escapeHtml(dist ? dist.name : entry.distributorId)}</span>
          <span class="badge bg-light text-dark border">${entry.count} rows</span>
        </div>
        <div class="fw-bold mb-2 text-primary">
          <i class="fas fa-pills me-1 text-warning"></i>${window.escapeHtml(entry.productRaw)}
        </div>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm flex-grow-1" id="${rowId}_mobile_select">
            <option value="">${window.escapeHtml(t.select_product)}</option>
            ${optionsHtml}
          </select>
          <button class="btn btn-sm btn-primary px-3 text-nowrap" onclick="linkProductAlias('${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.productRaw).replace(/'/g, "&#39;")}', '${rowId}_mobile_select')">
            <i class="fas fa-link me-1"></i>${window.escapeHtml(t.link)}
          </button>
        </div>
      `;
      mobileContainer.appendChild(card);
    }
  });
}

function linkProductAlias(distributorId, productRaw, selectId) {
  const t = distributorTranslations.en;
  const select = document.getElementById(selectId);
  const combined = select ? select.value : "";

  if (!combined) {
    if (typeof showToast === "function")
      showToast(t.select_product_first, "warning");
    return;
  }
  const [lineId, productId] = combined.split("::");

  if (window.store && window.store.productLines) {
    window.store.productLines.addProductAlias(
      lineId,
      productId,
      distributorId,
      productRaw,
    );
  }
  if (window.store && window.store.distributorSales) {
    window.store.distributorSales.applyProductMatching();
    window.store.distributorSales.applyAreaMatching();
  }

  renderPendingProducts();
  renderMappedAliases();
  if (typeof showToast === "function")
    showToast(t.product_linked_successfully, "success");
}

// ==========================================
// Section: Active Mapped Aliases (View & Unlink)
// ==========================================
let currentAliasTab = "areas";
let aliasSearchQuery = "";
let aliasSelectedDistributor = "";

function handleAliasSearch(query) {
  aliasSearchQuery = String(query || "").trim().toLowerCase();
  renderMappedAliases();
}
window.handleAliasSearch = handleAliasSearch;

function handleAliasDistFilter(distId) {
  aliasSelectedDistributor = String(distId || "").trim();
  renderMappedAliases();
}
window.handleAliasDistFilter = handleAliasDistFilter;

function switchAliasTab(tabName) {
  currentAliasTab = tabName;
  const tabAreas = document.getElementById("aliasTabAreas");
  const tabProducts = document.getElementById("aliasTabProducts");
  const tabPharmacies = document.getElementById("aliasTabPharmacies");
  const areasContainer = document.getElementById("mappedAreasContainer");
  const productsContainer = document.getElementById("mappedProductsContainer");
  const pharmaciesContainer = document.getElementById("mappedPharmaciesContainer");

  tabAreas?.classList.toggle("active", tabName === "areas");
  tabProducts?.classList.toggle("active", tabName === "products");
  tabPharmacies?.classList.toggle("active", tabName === "pharmacies");

  if (areasContainer)
    areasContainer.style.display = tabName === "areas" ? "block" : "none";
  if (productsContainer)
    productsContainer.style.display = tabName === "products" ? "block" : "none";
  if (pharmaciesContainer)
    pharmaciesContainer.style.display =
      tabName === "pharmacies" ? "block" : "none";

  renderMappedAliases();
}
window.switchAliasTab = switchAliasTab;

function renderMappedAliases() {
  const t = distributorTranslations.en;
  const distributors = getDistributorsList();

  // Populate distributor filter dropdown once or keep in sync
  const distFilterSelect = document.getElementById("aliasDistributorFilter");
  if (distFilterSelect && distFilterSelect.options.length <= 1) {
    const currentVal = distFilterSelect.value;
    distFilterSelect.innerHTML = `<option value="">All Distributors</option>` +
      distributors.map(d => `<option value="${window.escapeHtml(d.id)}">${window.escapeHtml(d.name)}</option>`).join("");
    if (currentVal) distFilterSelect.value = currentVal;
  }

  const query = aliasSearchQuery;
  const filterDist = aliasSelectedDistributor;
  const countLabelEl = document.getElementById("aliasFilteredCountText");

  // 1. Render Mapped Areas
  const areasTbody = document.getElementById("mappedAreasTableBody");
  const countAreasEl = document.getElementById("countMappedAreas");
  if (areasTbody && window.store && window.store.areas) {
    const allAreaAliases =
      typeof window.store.areas.getAllAliases === "function"
        ? window.store.areas.getAllAliases()
        : [];
    if (countAreasEl) countAreasEl.textContent = allAreaAliases.length;

    let areaAliases = allAreaAliases;
    if (filterDist) {
      const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
      const targetDist = legacyDistMap[filterDist] || filterDist;
      areaAliases = areaAliases.filter(a => {
        const aDist = legacyDistMap[a.distributorId] || a.distributorId;
        return aDist === targetDist || a.distributorId === filterDist;
      });
    }
    if (query) {
      areaAliases = areaAliases.filter(a => {
        const d = resolveDistributorItem(a.distributorId, distributors);
        const dName = d ? d.name.toLowerCase() : "";
        return (
          dName.includes(query) ||
          String(a.rawText || "").toLowerCase().includes(query) ||
          String(a.areaName || "").toLowerCase().includes(query) ||
          String(a.areaCode || "").toLowerCase().includes(query)
        );
      });
    }

    if (currentAliasTab === "areas" && countLabelEl) {
      countLabelEl.textContent = `Showing ${areaAliases.length} of ${allAreaAliases.length}`;
    }

    const areasMobileContainer = document.getElementById("mappedAreasMobileCards");
    if (areasMobileContainer) areasMobileContainer.replaceChildren();

    if (areaAliases.length === 0) {
      areasTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">${allAreaAliases.length === 0 ? t.no_mapped_territories : "No matching results found."}</td></tr>`;
      if (areasMobileContainer) {
        areasMobileContainer.innerHTML = `<div class="text-center text-muted py-4 small">${allAreaAliases.length === 0 ? t.no_mapped_territories : "No matching results found."}</div>`;
      }
    } else {
      areasTbody.innerHTML = "";
      areaAliases.forEach((entry) => {
        const dist = resolveDistributorItem(entry.distributorId, distributors);
        const distName = dist ? dist.name : entry.distributorId;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-3 py-2 fw-medium">${window.escapeHtml(distName)}</td>
          <td class="px-3 py-2"><span class="badge bg-light text-dark border">${window.escapeHtml(entry.rawText)}</span></td>
          <td class="px-3 py-2 fw-semibold text-primary">
            <i class="fas fa-map-marker-alt me-1 text-danger"></i>${window.escapeHtml(entry.areaName)} ${entry.areaCode ? `(${window.escapeHtml(entry.areaCode)})` : ""}
          </td>
          <td class="px-3 py-2">
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-primary" onclick="openEditAreaAlias('${window.escapeHtml(entry.areaId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.edit}">
                <i class="fas fa-edit me-1"></i>${t.edit}
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="unlinkAreaAlias('${window.escapeHtml(entry.areaId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.unlink}">
                <i class="fas fa-unlink me-1"></i>${t.unlink}
              </button>
            </div>
          </td>
        `;
        areasTbody.appendChild(tr);

        if (areasMobileContainer) {
          const card = document.createElement("div");
          card.className = "dist-mobile-card mb-2";
          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-secondary-subtle text-secondary border font-monospace"><i class="fas fa-truck me-1"></i>${window.escapeHtml(distName)}</span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary py-1 px-3 d-inline-flex align-items-center" onclick="openEditAreaAlias('${window.escapeHtml(entry.areaId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.edit}">
                  <i class="fas fa-edit me-1"></i><span>${t.edit}</span>
                </button>
                <button class="btn btn-sm btn-outline-danger py-1 px-3 d-inline-flex align-items-center" onclick="unlinkAreaAlias('${window.escapeHtml(entry.areaId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.unlink}">
                  <i class="fas fa-unlink me-1"></i><span>${t.unlink}</span>
                </button>
              </div>
            </div>
            <div class="fw-bold mb-1 text-dark">
              <span class="badge bg-light text-dark border font-monospace me-1">${window.escapeHtml(entry.rawText)}</span>
            </div>
            <div class="small fw-semibold text-primary">
              <i class="fas fa-map-marker-alt me-1 text-danger"></i>${window.escapeHtml(entry.areaName)} ${entry.areaCode ? `(${window.escapeHtml(entry.areaCode)})` : ""}
            </div>
          `;
          areasMobileContainer.appendChild(card);
        }
      });
    }
  }

  // 2. Render Mapped Products
  const prodsTbody = document.getElementById("mappedProductsTableBody");
  const countProdsEl = document.getElementById("countMappedProducts");
  if (prodsTbody && window.store && window.store.productLines) {
    const allProdAliases =
      typeof window.store.productLines.getAllProductAliases === "function"
        ? window.store.productLines.getAllProductAliases()
        : [];
    if (countProdsEl) countProdsEl.textContent = allProdAliases.length;

    let prodAliases = allProdAliases;
    if (filterDist) {
      const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
      const targetDist = legacyDistMap[filterDist] || filterDist;
      prodAliases = prodAliases.filter(p => {
        const pDist = legacyDistMap[p.distributorId] || p.distributorId;
        return pDist === targetDist || p.distributorId === filterDist;
      });
    }
    if (query) {
      prodAliases = prodAliases.filter(p => {
        const d = resolveDistributorItem(p.distributorId, distributors);
        const dName = d ? d.name.toLowerCase() : "";
        return (
          dName.includes(query) ||
          String(p.rawText || "").toLowerCase().includes(query) ||
          String(p.productName || "").toLowerCase().includes(query) ||
          String(p.lineName || "").toLowerCase().includes(query)
        );
      });
    }

    if (currentAliasTab === "products" && countLabelEl) {
      countLabelEl.textContent = `Showing ${prodAliases.length} of ${allProdAliases.length}`;
    }

    const prodsMobileContainer = document.getElementById("mappedProductsMobileCards");
    if (prodsMobileContainer) prodsMobileContainer.replaceChildren();

    if (prodAliases.length === 0) {
      prodsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">${allProdAliases.length === 0 ? t.no_mapped_products : "No matching results found."}</td></tr>`;
      if (prodsMobileContainer) {
        prodsMobileContainer.innerHTML = `<div class="text-center text-muted py-4 small">${allProdAliases.length === 0 ? t.no_mapped_products : "No matching results found."}</div>`;
      }
    } else {
      prodsTbody.innerHTML = "";
      prodAliases.forEach((entry) => {
        const dist = resolveDistributorItem(entry.distributorId, distributors);
        const distName = dist ? dist.name : entry.distributorId;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-3 py-2 fw-medium">${window.escapeHtml(distName)}</td>
          <td class="px-3 py-2"><span class="badge bg-light text-dark border">${window.escapeHtml(entry.rawText)}</span></td>
          <td class="px-3 py-2 fw-semibold text-success">
            <i class="fas fa-pills me-1 text-success"></i>${window.escapeHtml(entry.productName)} <small class="text-muted">(${window.escapeHtml(entry.lineName)})</small>
          </td>
          <td class="px-3 py-2">
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-primary" onclick="openEditProductAlias('${window.escapeHtml(entry.lineId)}', '${window.escapeHtml(entry.productId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.edit}">
                <i class="fas fa-edit me-1"></i>${t.edit}
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="unlinkProductAlias('${window.escapeHtml(entry.lineId)}', '${window.escapeHtml(entry.productId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.unlink}">
                <i class="fas fa-unlink me-1"></i>${t.unlink}
              </button>
            </div>
          </td>
        `;
        prodsTbody.appendChild(tr);

        if (prodsMobileContainer) {
          const card = document.createElement("div");
          card.className = "dist-mobile-card mb-2";
          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-secondary-subtle text-secondary border font-monospace"><i class="fas fa-truck me-1"></i>${window.escapeHtml(distName)}</span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary py-1 px-3 d-inline-flex align-items-center" onclick="openEditProductAlias('${window.escapeHtml(entry.lineId)}', '${window.escapeHtml(entry.productId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.edit}">
                  <i class="fas fa-edit me-1"></i><span>${t.edit}</span>
                </button>
                <button class="btn btn-sm btn-outline-danger py-1 px-3 d-inline-flex align-items-center" onclick="unlinkProductAlias('${window.escapeHtml(entry.lineId)}', '${window.escapeHtml(entry.productId)}', '${window.escapeHtml(entry.distributorId)}', '${window.escapeHtml(entry.rawText).replace(/'/g, "\\'")}')" title="${t.unlink}">
                  <i class="fas fa-unlink me-1"></i><span>${t.unlink}</span>
                </button>
              </div>
            </div>
            <div class="fw-bold mb-1">
              <span class="badge bg-light text-dark border font-monospace text-wrap text-start">${window.escapeHtml(entry.rawText)}</span>
            </div>
            <div class="small fw-semibold text-success mt-1">
              <i class="fas fa-pills me-1"></i>${window.escapeHtml(entry.productName)} <small class="text-muted">(${window.escapeHtml(entry.lineName)})</small>
            </div>
          `;
          prodsMobileContainer.appendChild(card);
        }
      });
    }
  }

  // 3. Render Mapped Pharmacy Overrides
  const pharmsTbody = document.getElementById("mappedPharmaciesTableBody");
  const countPharmsEl = document.getElementById("countMappedPharmacies");
  if (pharmsTbody && window.store && window.store.pharmacyOverrides) {
    const allOverrides = window.store.pharmacyOverrides.getAll();
    if (countPharmsEl) countPharmsEl.textContent = allOverrides.length;

    let overrides = allOverrides;
    if (filterDist) {
      const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
      const targetDist = legacyDistMap[filterDist] || filterDist;
      overrides = overrides.filter(o => {
        const oDist = legacyDistMap[o.distributorId] || o.distributorId;
        return oDist === targetDist || o.distributorId === filterDist;
      });
    }
    if (query) {
      overrides = overrides.filter(o => {
        const d = resolveDistributorItem(o.distributorId, distributors);
        const dName = d ? d.name.toLowerCase() : "";
        return (
          dName.includes(query) ||
          String(o.pharmacyCode || "").toLowerCase().includes(query) ||
          String(o.pharmacyName || "").toLowerCase().includes(query)
        );
      });
    }

    if (currentAliasTab === "pharmacies" && countLabelEl) {
      countLabelEl.textContent = `Showing ${overrides.length} of ${allOverrides.length}`;
    }

    const pharmsMobileContainer = document.getElementById("mappedPharmaciesMobileCards");
    if (pharmsMobileContainer) pharmsMobileContainer.replaceChildren();

    if (overrides.length === 0) {
      pharmsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">${allOverrides.length === 0 ? t.no_pharmacy_overrides : "No matching results found."}</td></tr>`;
      if (pharmsMobileContainer) {
        pharmsMobileContainer.innerHTML = `<div class="text-center text-muted py-4 small">${allOverrides.length === 0 ? t.no_pharmacy_overrides : "No matching results found."}</div>`;
      }
    } else {
      pharmsTbody.innerHTML = "";
      const areas = (window.store.areas && window.store.areas.getAll()) || [];
      const users = (window.store.users && window.store.users.getAll()) || [];

      overrides.forEach((entry) => {
        const dist = resolveDistributorItem(entry.distributorId, distributors);
        const distName = dist ? dist.name : entry.distributorId;
        const area = areas.find((a) => a.id === entry.areaId);
        const rep =
          area && area.repId ? users.find((u) => u.id === area.repId) : null;
        const povrTx = getPovrTexts();
        const entryMode = entry.mode || "single";
        let areaCellHtml;
        let repCellHtml;
        if (entryMode === "split" && Array.isArray(entry.splits)) {
          areaCellHtml = entry.splits
            .map((sp) => {
              const a = areas.find((x) => x.id === sp.areaId);
              return `<div><i class="fas fa-map-marker-alt me-1 text-danger"></i>${window.escapeHtml(a ? a.name : sp.areaId)} <span class="badge bg-primary-subtle text-primary border">${window.escapeHtml(String(sp.percent))}%</span></div>`;
            })
            .join("");
          repCellHtml = entry.splits
            .map((sp) => {
              const a = areas.find((x) => x.id === sp.areaId);
              const r = a && a.repId ? users.find((u) => u.id === a.repId) : null;
              return `<div>${window.escapeHtml(r ? r.name : "Unassigned")}</div>`;
            })
            .join("");
        } else if (entryMode === "bulk") {
          const allLines = (window.store.productLines && window.store.productLines.getAll()) || [];
          const bl = allLines.find((l) => l.id === entry.lineId);
          areaCellHtml = `<span class="badge bg-warning-subtle text-dark border"><i class="fas fa-boxes me-1"></i>${window.escapeHtml(povrTx.mode_bulk_badge)}</span>${bl ? ` <small class="text-muted">${window.escapeHtml(bl.name)}</small>` : ""}`;
          repCellHtml = "—";
        } else {
          areaCellHtml = `<i class="fas fa-map-marker-alt me-1 text-danger"></i>${window.escapeHtml(area ? area.name : entry.areaId || "—")}`;
          repCellHtml = window.escapeHtml(rep ? rep.name : "Unassigned");
        }

        let scopeLabel = "";
        let scopeBadgeClass = "bg-primary-subtle text-primary";
        if (entry.effectiveScope === "from_month") {
          scopeLabel = t.scope_from_month.replace(
            "{month}",
            entry.effectiveFromMonth || "—",
          );
          scopeBadgeClass = "bg-warning-subtle text-dark";
        } else if (entry.effectiveScope === "future_only") {
          scopeLabel = t.scope_future_only;
          scopeBadgeClass = "bg-secondary-subtle text-secondary";
        } else {
          scopeLabel = t.scope_all_history;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-3 py-2 fw-medium">${window.escapeHtml(distName)}</td>
          <td class="px-3 py-2"><span class="badge bg-light text-dark border font-monospace">${window.escapeHtml(entry.pharmacyCode || "—")}</span></td>
          <td class="px-3 py-2 fw-semibold">${window.escapeHtml(entry.pharmacyName || "—")}</td>
          <td class="px-3 py-2 text-primary fw-semibold">${areaCellHtml}</td>
          <td class="px-3 py-2">${repCellHtml}</td>
          <td class="px-3 py-2"><span class="badge ${scopeBadgeClass} border">${window.escapeHtml(scopeLabel)}</span></td>
          <td class="px-3 py-2 text-end">
            <div class="d-flex gap-1 justify-content-end">
              <button class="btn btn-sm btn-outline-primary" onclick="openPharmacyOverrideModal('${window.escapeHtml(entry.id)}')" title="${t.edit}">
                <i class="fas fa-edit me-1"></i>${t.edit}
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deletePharmacyOverride('${window.escapeHtml(entry.id)}')" title="${t.delete}">
                <i class="fas fa-trash me-1"></i>${t.delete}
              </button>
            </div>
          </td>
        `;
        pharmsTbody.appendChild(tr);

        if (pharmsMobileContainer) {
          const card = document.createElement("div");
          card.className = "dist-mobile-card mb-2";
          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-secondary-subtle text-secondary border font-monospace"><i class="fas fa-truck me-1"></i>${window.escapeHtml(distName)}</span>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary py-1 px-3 d-inline-flex align-items-center" onclick="openPharmacyOverrideModal('${window.escapeHtml(entry.id)}')" title="${t.edit}">
                  <i class="fas fa-edit me-1"></i><span>${t.edit}</span>
                </button>
                <button class="btn btn-sm btn-outline-danger py-1 px-3 d-inline-flex align-items-center" onclick="deletePharmacyOverride('${window.escapeHtml(entry.id)}')" title="${t.delete}">
                  <i class="fas fa-trash me-1"></i><span>${t.delete}</span>
                </button>
              </div>
            </div>
            <div class="fw-bold mb-1 text-dark d-flex align-items-center gap-1">
              <span class="badge bg-light text-dark border font-monospace">${window.escapeHtml(entry.pharmacyCode || "—")}</span>
              <span>${window.escapeHtml(entry.pharmacyName || "—")}</span>
            </div>
            <div class="small fw-semibold text-primary mt-1">
              ${areaCellHtml}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <span class="text-muted small"><i class="fas fa-user me-1"></i>${repCellHtml}</span>
              <span class="badge ${scopeBadgeClass} border">${window.escapeHtml(scopeLabel)}</span>
            </div>
          `;
          pharmsMobileContainer.appendChild(card);
        }
      });
    }
  }
}
window.renderMappedAliases = renderMappedAliases;

// ==========================================
// Section: Pharmacy Territory Overrides Controller
// ==========================================
let pharmacyOverrideModalInstance = null;
function getPharmacyOverrideModal() {
  if (!pharmacyOverrideModalInstance) {
    const el = document.getElementById("pharmacyOverrideModal");
    if (el) pharmacyOverrideModalInstance = new bootstrap.Modal(el);
  }
  return pharmacyOverrideModalInstance;
}

function getPovrTexts() {
  return {
    mode_label: "Distribution Mode",
    mode_single: "Single area",
    mode_split: "Split by %",
    mode_bulk: "All as Bulk",
    mode_bulk_badge: "All Bulk (by brick weights)",
    split_label: "Split this pharmacy's sales across areas (total must be 100%)",
    split_add: "Add area",
    split_area: "Select area",
    split_remove: "Remove",
    split_total: "Total",
    bulk_line: "Product Line *",
    bulk_select_line: "Select line",
    bulk_hint: "All sales of this pharmacy are treated as Bulk and spread across bricks by each product's Brick Weights (Products page). Products without weights stay Private.",
    err_split_min: "Select at least two areas.",
    err_split_area: "Select an area in every row.",
    err_split_dup: "The same area cannot be used twice.",
    err_split_pct: "Every percentage must be greater than 0.",
    err_split_sum: "Percentages must add up to 100%.",
    err_split_line: "All areas must belong to the same line.",
    err_bulk_line: "Please select a line.",
    warn_no_weights: "Note: {n} product group(s) have no brick weights and stayed Private. Set weights in the Products page.",
  };
}

let povrAreaOptionsHtml = "";

function applyPovrLabels() {
  const tx = getPovrTexts();
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("povrModeLabel", tx.mode_label);
  set("povrModeSingleLbl", tx.mode_single);
  set("povrModeSplitLbl", tx.mode_split);
  set("povrModeBulkLbl", tx.mode_bulk);
  set("povrSplitLabel", tx.split_label);
  set("povrSplitAddTxt", tx.split_add);
  set("povrBulkLineLabel", tx.bulk_line);
  set("povrBulkHint", tx.bulk_hint);
}

function getPovrMode() {
  const r = document.querySelector('input[name="povrModeRadio"]:checked');
  return r ? r.value : "single";
}

function togglePovrMode() {
  const mode = getPovrMode();
  const show = (id, on) => {
    const el = document.getElementById(id);
    if (el) el.style.display = on ? "" : "none";
  };
  show("povrSingleGroup", mode === "single");
  show("povrSplitGroup", mode === "split");
  show("povrBulkGroup", mode === "bulk");
  if (mode === "split") {
    const rows = document.querySelectorAll("#povrSplitRows .povr-split-row");
    if (rows.length === 0) {
      addPovrSplitRow("", "");
      addPovrSplitRow("", "");
    }
    updatePovrSplitTotal();
  }
}
window.togglePovrMode = togglePovrMode;

function addPovrSplitRow(areaId = "", percent = "") {
  const tx = getPovrTexts();
  const wrap = document.getElementById("povrSplitRows");
  if (!wrap) return;
  const row = document.createElement("div");
  row.className = "povr-split-row row g-2 align-items-center mb-2";
  row.innerHTML = `
    <div class="col-12 col-sm-7">
      <select class="form-select form-select-sm povr-split-area">
        <option value="">${window.escapeHtml(tx.split_area)}</option>${povrAreaOptionsHtml}
      </select>
    </div>
    <div class="col-8 col-sm-3">
      <div class="input-group input-group-sm">
        <input type="number" class="form-control povr-split-pct" min="0" max="100" step="0.01" inputmode="decimal" />
        <span class="input-group-text">%</span>
      </div>
    </div>
    <div class="col-4 col-sm-2 text-end">
      <button type="button" class="btn btn-sm btn-outline-danger povr-split-remove" title="${window.escapeHtml(tx.split_remove)}"><i class="fas fa-trash"></i></button>
    </div>`;
  wrap.appendChild(row);
  const sel = row.querySelector(".povr-split-area");
  const inp = row.querySelector(".povr-split-pct");
  if (areaId) sel.value = areaId;
  if (percent !== "" && percent !== null && percent !== undefined) inp.value = percent;
  inp.addEventListener("input", updatePovrSplitTotal);
  row.querySelector(".povr-split-remove").addEventListener("click", () => {
    row.remove();
    updatePovrSplitTotal();
  });
  updatePovrSplitTotal();
}
window.addPovrSplitRow = addPovrSplitRow;

function readPovrSplitRows() {
  return Array.from(document.querySelectorAll("#povrSplitRows .povr-split-row")).map((row) => ({
    areaId: row.querySelector(".povr-split-area").value,
    percent: parseFloat(row.querySelector(".povr-split-pct").value),
  }));
}

function updatePovrSplitTotal() {
  const tx = getPovrTexts();
  const total = readPovrSplitRows().reduce((a, r) => a + (isNaN(r.percent) ? 0 : r.percent), 0);
  const rounded = Math.round(total * 100) / 100;
  const el = document.getElementById("povrSplitTotal");
  if (!el) return;
  el.textContent = `${tx.split_total}: ${rounded}%`;
  el.className = "badge fs-6 " + (Math.abs(rounded - 100) < 0.01 ? "bg-success" : "bg-danger");
}

function togglePovrMonthPicker() {
  const fromMonthRadio = document.getElementById("povrScopeFromMonth");
  const container = document.getElementById("povrMonthPickerContainer");
  if (container) {
    container.style.display =
      fromMonthRadio && fromMonthRadio.checked ? "block" : "none";
  }
}
window.togglePovrMonthPicker = togglePovrMonthPicker;

function openPharmacyOverrideModal(editId = null) {
  const t = distributorTranslations.en;
  const modal = getPharmacyOverrideModal();
  if (!modal) return;

  const headingEl = document.getElementById("pharmacyOverrideModalHeading");
  const editIdInput = document.getElementById("povrEditId");
  const distSelect = document.getElementById("povrDistributorSelect");
  const codeInput = document.getElementById("povrPharmacyCodeInput");
  const nameInput = document.getElementById("povrPharmacyNameInput");
  const areaSelect = document.getElementById("povrTargetAreaSelect");
  const radioAll = document.getElementById("povrScopeAll");
  const radioFromMonth = document.getElementById("povrScopeFromMonth");
  const radioFuture = document.getElementById("povrScopeFutureOnly");
  const fromMonthInput = document.getElementById("povrFromMonthInput");

  // Populate distributors
  const distributors = getDistributorsList();
  distSelect.innerHTML =
    `<option value="">${t.select_distributor}</option>` +
    distributors
      .map(
        (d) =>
          `<option value="${window.escapeHtml(d.id)}">${window.escapeHtml(d.name)}</option>`,
      )
      .join("");

  // Populate target areas
  const areas =
    window.store && window.store.areas ? window.store.areas.getAll() : [];
  const lines =
    window.store && window.store.productLines
      ? window.store.productLines.getAll()
      : [];
  const users =
    window.store && window.store.users ? window.store.users.getAll() : [];

  areaSelect.innerHTML =
    `<option value="">${t.select_area}</option>` +
    areas
      .map((a) => {
        const line = lines.find((l) => l.id === a.lineId);
        const rep = a.repId ? users.find((u) => u.id === a.repId) : null;
        const meta = [line ? line.name : null, rep ? rep.name : null]
          .filter(Boolean)
          .join(" • ");
        return `<option value="${window.escapeHtml(a.id)}">${window.escapeHtml(a.name)}${meta ? ` (${window.escapeHtml(meta)})` : ""}</option>`;
      })
      .join("");

  // Split rows share the same area options; bulk mode needs a line selector
  povrAreaOptionsHtml = areaSelect.innerHTML.replace(/^<option value="">[^<]*<\/option>/, "");
  const bulkLineSelect = document.getElementById("povrBulkLineSelect");
  const povrTx = getPovrTexts();
  if (bulkLineSelect) {
    bulkLineSelect.innerHTML =
      `<option value="">${window.escapeHtml(povrTx.bulk_select_line)}</option>` +
      lines
        .map((l) => `<option value="${window.escapeHtml(l.id)}">${window.escapeHtml(l.name)}</option>`)
        .join("");
  }
  applyPovrLabels();
  const splitWrap = document.getElementById("povrSplitRows");
  if (splitWrap) splitWrap.innerHTML = "";
  const modeRadioSingle = document.getElementById("povrModeSingle");
  const modeRadioSplit = document.getElementById("povrModeSplit");
  const modeRadioBulk = document.getElementById("povrModeBulk");

  const currentMonth = (
    typeof window.getSystemTodayStr === "function"
      ? window.getSystemTodayStr()
      : new Date().toISOString().split("T")[0]
  ).slice(0, 7);
  if (fromMonthInput) fromMonthInput.value = currentMonth;

  if (editId) {
    const existing = window.store.pharmacyOverrides.getById(editId);
    if (!existing) return;
    if (headingEl) headingEl.textContent = t.edit_pharmacy_override;
    if (editIdInput) editIdInput.value = existing.id;
    if (distSelect) distSelect.value = existing.distributorId;
    if (codeInput) codeInput.value = existing.pharmacyCode || "";
    if (nameInput) nameInput.value = existing.pharmacyName || "";
    const existingMode = existing.mode || "single";
    if (existingMode === "split" && Array.isArray(existing.splits)) {
      if (modeRadioSplit) modeRadioSplit.checked = true;
      if (areaSelect) areaSelect.value = "";
      existing.splits.forEach((sp) => addPovrSplitRow(sp.areaId, sp.percent));
    } else if (existingMode === "bulk") {
      if (modeRadioBulk) modeRadioBulk.checked = true;
      if (areaSelect) areaSelect.value = "";
      if (bulkLineSelect) bulkLineSelect.value = existing.lineId || "";
    } else {
      if (modeRadioSingle) modeRadioSingle.checked = true;
      if (areaSelect) areaSelect.value = existing.areaId || "";
    }

    if (existing.effectiveScope === "from_month") {
      if (radioFromMonth) radioFromMonth.checked = true;
      if (fromMonthInput && existing.effectiveFromMonth)
        fromMonthInput.value = existing.effectiveFromMonth;
    } else if (existing.effectiveScope === "future_only") {
      if (radioFuture) radioFuture.checked = true;
    } else {
      if (radioAll) radioAll.checked = true;
    }
  } else {
    if (headingEl) headingEl.textContent = t.add_pharmacy_override;
    if (editIdInput) editIdInput.value = "";
    if (distSelect) distSelect.value = "";
    if (codeInput) codeInput.value = "";
    if (nameInput) nameInput.value = "";
    if (areaSelect) areaSelect.value = "";
    if (modeRadioSingle) modeRadioSingle.checked = true;
    if (bulkLineSelect) bulkLineSelect.value = "";
    if (radioAll) radioAll.checked = true;
  }

  togglePovrMode();
  togglePovrMonthPicker();
  modal.show();
}
window.openPharmacyOverrideModal = openPharmacyOverrideModal;

function savePharmacyOverride() {
  const t = distributorTranslations.en;

  const editId = document.getElementById("povrEditId")?.value;
  const distributorId = document.getElementById("povrDistributorSelect")?.value;
  const pharmacyCode = document
    .getElementById("povrPharmacyCodeInput")
    ?.value?.trim();
  const pharmacyName = document
    .getElementById("povrPharmacyNameInput")
    ?.value?.trim();
  const areaId = document.getElementById("povrTargetAreaSelect")?.value;
  const scopeRadio = document.querySelector(
    'input[name="povrScopeRadio"]:checked',
  );
  const effectiveScope = scopeRadio ? scopeRadio.value : "all_history";
  const fromMonth = document.getElementById("povrFromMonthInput")?.value;

  if (!distributorId) {
    if (typeof showToast === "function")
      showToast(
        "Please select a distributor.",
        "warning",
      );
    return;
  }
  if (!pharmacyCode && !pharmacyName) {
    if (typeof showToast === "function")
      showToast(
        "Please enter pharmacy code or name.",
        "warning",
      );
    return;
  }
  const povrTx = getPovrTexts();
  const mode = getPovrMode();
  const warn = (m) => {
    if (typeof showToast === "function") showToast(m, "warning");
  };
  let splits = [];
  let bulkLineId = "";
  if (mode === "single") {
    if (!areaId) {
      warn("Please select target area.");
      return;
    }
  } else if (mode === "split") {
    splits = readPovrSplitRows();
    if (splits.length < 2) return warn(povrTx.err_split_min);
    if (splits.some((s) => !s.areaId)) return warn(povrTx.err_split_area);
    if (new Set(splits.map((s) => s.areaId)).size !== splits.length) return warn(povrTx.err_split_dup);
    if (splits.some((s) => isNaN(s.percent) || s.percent <= 0)) return warn(povrTx.err_split_pct);
    const sum = splits.reduce((a, s) => a + s.percent, 0);
    if (Math.abs(sum - 100) > 0.01) return warn(povrTx.err_split_sum);
    const allAreasList = (window.store.areas && window.store.areas.getAll()) || [];
    const lineIds = new Set(
      splits.map((s) => {
        const a = allAreasList.find((x) => x.id === s.areaId);
        return a ? a.lineId || "" : "";
      }),
    );
    if (lineIds.size > 1) return warn(povrTx.err_split_line);
  } else {
    bulkLineId = document.getElementById("povrBulkLineSelect")?.value || "";
    if (!bulkLineId) return warn(povrTx.err_bulk_line);
  }
  if (effectiveScope === "from_month" && !fromMonth) {
    if (typeof showToast === "function")
      showToast(
        "Please specify the starting month.",
        "warning",
      );
    return;
  }

  const currentMonth = (
    typeof window.getSystemTodayStr === "function"
      ? window.getSystemTodayStr()
      : new Date().toISOString().split("T")[0]
  ).slice(0, 7);

  const overrideObj = {
    id: editId || undefined,
    distributorId,
    pharmacyCode: pharmacyCode || "",
    pharmacyName: pharmacyName || "",
    mode,
    areaId: mode === "single" ? areaId : mode === "split" ? splits[0].areaId : null,
    splits: mode === "split" ? splits : undefined,
    lineId: mode === "bulk" ? bulkLineId : undefined,
    effectiveScope,
    effectiveFromMonth: effectiveScope === "from_month" ? fromMonth : null,
    createdMonth: currentMonth,
  };
  if (editId) {
    const prev = window.store.pharmacyOverrides.getById(editId);
    if (prev && prev.createdAt) overrideObj.createdAt = prev.createdAt;
  }

  if (!window.store || !window.store.pharmacyOverrides) return;

  const saved = window.store.pharmacyOverrides.save(overrideObj);
  let updatedCount = 0;
  if (
    window.store.distributorSales &&
    typeof window.store.distributorSales.applyPharmacyOverride === "function"
  ) {
    updatedCount = window.store.distributorSales.applyPharmacyOverride(saved);
  }

  const modal = getPharmacyOverrideModal();
  if (modal) modal.hide();

  renderMappedAliases();

  const msg = t.override_saved_success.replace("{count}", String(updatedCount));
  if (typeof showToast === "function") showToast(msg, "success");
  const engineSummary = window.store.distributorSales && window.store.distributorSales.lastEngineSummary;
  if (mode === "bulk" && engineSummary && engineSummary.skippedNoWeights > 0 && typeof showToast === "function") {
    showToast(povrTx.warn_no_weights.replace("{n}", String(engineSummary.skippedNoWeights)), "warning");
  }
}
window.savePharmacyOverride = savePharmacyOverride;

function deletePharmacyOverride(id) {
  const t = distributorTranslations.en;
  if (!confirm(t.confirm_delete_override)) return;

  if (!window.store || !window.store.pharmacyOverrides) return;
  const deleted = window.store.pharmacyOverrides.delete(id);

  let revertedCount = 0;
  if (
    deleted &&
    window.store.distributorSales &&
    typeof window.store.distributorSales.revertPharmacyOverride === "function"
  ) {
    revertedCount =
      window.store.distributorSales.revertPharmacyOverride(deleted);
  }

  renderMappedAliases();

  const msg = t.override_deleted_success.replace(
    "{count}",
    String(revertedCount),
  );
  if (typeof showToast === "function") showToast(msg, "info");
}
window.deletePharmacyOverride = deletePharmacyOverride;

function unlinkAreaAlias(areaId, distributorId, rawText) {
  const confirmMsg = `Are you sure you want to unlink "${rawText}"? It will return to pending and its sales rows will be unlinked until re-mapped.`;
  if (!confirm(confirmMsg)) return;

  if (window.store && window.store.areas) {
    window.store.areas.removeAlias(areaId, distributorId, rawText);
  }
  renderPendingAreas();
  renderMappedAliases();
  const successMsg = `Alias "${rawText}" unlinked successfully.`;
  if (typeof showToast === "function") showToast(successMsg, "success");
}
window.unlinkAreaAlias = unlinkAreaAlias;

function unlinkProductAlias(lineId, productId, distributorId, rawText) {
  const confirmMsg = `Are you sure you want to unlink product "${rawText}"? It will return to pending and sales rows will be unlinked.`;
  if (!confirm(confirmMsg)) return;

  if (window.store && window.store.productLines) {
    window.store.productLines.removeProductAlias(
      lineId,
      productId,
      distributorId,
      rawText,
    );
  }
  renderPendingProducts();
  renderMappedAliases();
  const successMsg = `Product alias "${rawText}" unlinked successfully.`;
  if (typeof showToast === "function") showToast(successMsg, "success");
}
window.unlinkProductAlias = unlinkProductAlias;

// ==========================================
// Section: Edit Mapped Aliases Modal Handlers
// ==========================================
let editAliasModalInstance = null;

function getEditAliasModal() {
  if (!editAliasModalInstance) {
    const el = document.getElementById("editAliasModal");
    if (el && typeof bootstrap !== "undefined") {
      editAliasModalInstance = new bootstrap.Modal(el);
    }
  }
  return editAliasModalInstance;
}

function openEditAreaAlias(areaId, distributorId, rawText) {
  const t = distributorTranslations.en;
  const dist =
    (window.store && window.store.distributors
      ? window.store.distributors.getById(distributorId)
      : null) || {};
  const currentArea =
    (window.store && window.store.areas
      ? window.store.areas.getById(areaId)
      : null) || {};

  document.getElementById("editAliasType").value = "area";
  document.getElementById("editAliasDistId").value = distributorId;
  document.getElementById("editAliasRawText").value = rawText;
  document.getElementById("editAliasCurrentTargetId").value = areaId;
  document.getElementById("editAliasCurrentLineId").value =
    currentArea.lineId || "";

  document.getElementById("editAliasModalHeading").textContent =
    t.edit_territory_mapping;
  document.getElementById("editAliasDistName").textContent =
    dist.name || distributorId;
  document.getElementById("editAliasRawBadge").textContent = rawText;
  document.getElementById("editAliasCurrentName").textContent =
    `${currentArea.name || areaId} ${currentArea.code ? "(" + currentArea.code + ")" : ""}`;
  document.getElementById("editAliasTargetLabel").textContent =
    t.select_new_target;

  const select = document.getElementById("editAliasTargetSelect");
  select.innerHTML = `<option value="">${t.select_area}</option>`;

  const rawAreas =
    window.store && window.store.areas ? window.store.areas.getAll() : [];
  const uniqueAreas = [];
  const seenAreaNames = new Set();
  rawAreas.forEach((a) => {
    const cleanName = String(a.name || "").trim();
    if (cleanName && !seenAreaNames.has(cleanName.toLowerCase())) {
      seenAreaNames.add(cleanName.toLowerCase());
      uniqueAreas.push({ id: a.id, name: cleanName, code: a.code || "" });
    }
  });
  uniqueAreas.sort((a, b) => a.name.localeCompare(b.name));

  uniqueAreas.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.name}${a.code ? " (" + a.code + ")" : ""}`;
    if (String(a.name).trim().toLowerCase() === String(currentArea.name).trim().toLowerCase()) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  const modal = getEditAliasModal();
  if (modal) modal.show();
}

function openEditProductAlias(lineId, productId, distributorId, rawText) {
  const t = distributorTranslations.en;
  const dist =
    (window.store && window.store.distributors
      ? window.store.distributors.getById(distributorId)
      : null) || {};
  const currentLine =
    (window.store && window.store.productLines
      ? window.store.productLines.getById(lineId)
      : null) || {};
  const currentProd = Array.isArray(currentLine.products)
    ? currentLine.products.find((p) => p.id === productId)
    : null;

  document.getElementById("editAliasType").value = "product";
  document.getElementById("editAliasDistId").value = distributorId;
  document.getElementById("editAliasRawText").value = rawText;
  document.getElementById("editAliasCurrentTargetId").value = productId;
  document.getElementById("editAliasCurrentLineId").value = lineId;

  document.getElementById("editAliasModalHeading").textContent =
    t.edit_product_mapping;
  document.getElementById("editAliasDistName").textContent =
    dist.name || distributorId;
  document.getElementById("editAliasRawBadge").textContent = rawText;
  document.getElementById("editAliasCurrentName").textContent =
    `${currentProd ? currentProd.name : productId} (${currentLine.name || lineId})`;
  document.getElementById("editAliasTargetLabel").textContent =
    t.select_new_target;

  const select = document.getElementById("editAliasTargetSelect");
  select.innerHTML = `<option value="">${t.select_product}</option>`;

  const lines =
    window.store && window.store.productLines
      ? window.store.productLines.getAll()
      : [];
  lines.forEach((line) => {
    const products = Array.isArray(line.products) ? line.products : [];
    if (products.length > 0) {
      const group = document.createElement("optgroup");
      group.label = line.name;
      products.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = `${line.id}::${p.id}`;
        opt.textContent = `${p.name}${p.dosage ? " " + p.dosage : ""}`;
        if (line.id === lineId && p.id === productId) opt.selected = true;
        group.appendChild(opt);
      });
      select.appendChild(group);
    }
  });

  const modal = getEditAliasModal();
  if (modal) modal.show();
}

function saveEditedAlias() {
  const t = distributorTranslations.en;
  const type = document.getElementById("editAliasType").value;
  const distId = document.getElementById("editAliasDistId").value;
  const rawText = document.getElementById("editAliasRawText").value;
  const oldTargetId = document.getElementById("editAliasCurrentTargetId").value;
  const oldLineId = document.getElementById("editAliasCurrentLineId").value;
  const select = document.getElementById("editAliasTargetSelect");
  const selectedVal = select ? select.value : "";

  if (!selectedVal) {
    if (typeof showToast === "function") {
      showToast(
        type === "area" ? t.select_area_first : t.select_product_first,
        "warning",
      );
    }
    return;
  }

  if (type === "area") {
    const newAreaId = selectedVal;
    if (newAreaId === oldTargetId) {
      const modal = getEditAliasModal();
      if (modal) modal.hide();
      return;
    }
    if (window.store && window.store.areas) {
      window.store.areas.removeAlias(oldTargetId, distId, rawText);
      window.store.areas.addAlias(newAreaId, distId, rawText);
    }
    if (window.store && window.store.distributorSales) {
      window.store.distributorSales.applyAreaMatching(true);
    }
    renderPendingAreas();
    renderMappedAliases();
  } else if (type === "product") {
    const [newLineId, newProductId] = selectedVal.split("::");
    if (newLineId === oldLineId && newProductId === oldTargetId) {
      const modal = getEditAliasModal();
      if (modal) modal.hide();
      return;
    }
    if (window.store && window.store.productLines) {
      window.store.productLines.removeProductAlias(
        oldLineId,
        oldTargetId,
        distId,
        rawText,
      );
      window.store.productLines.addProductAlias(
        newLineId,
        newProductId,
        distId,
        rawText,
      );
    }
    if (window.store && window.store.distributorSales) {
      window.store.distributorSales.applyProductMatching();
      window.store.distributorSales.applyAreaMatching(true);
    }
    renderPendingProducts();
    renderMappedAliases();
  }

  const modal = getEditAliasModal();
  if (modal) modal.hide();

  if (typeof showToast === "function") {
    showToast(t.alias_updated_successfully, "success");
  }
}
window.openEditAreaAlias = openEditAreaAlias;
window.openEditProductAlias = openEditProductAlias;
window.saveEditedAlias = saveEditedAlias;

// ==========================================
// Section: Import History
// Lists every upload batch (store.importBatches) and lets the admin
// delete one entirely -- e.g. to undo a mistaken upload -- removing
// every distributorSales row it created (store.distributorSales.deleteByBatch).
// ==========================================
let historySearchQuery = "";
let historySelectedDistributor = "";

function handleHistorySearch(query) {
  historySearchQuery = String(query || "").trim().toLowerCase();
  renderImportBatches();
}
window.handleHistorySearch = handleHistorySearch;

function handleHistoryDistFilter(distId) {
  historySelectedDistributor = String(distId || "").trim();
  renderImportBatches();
}
window.handleHistoryDistFilter = handleHistoryDistFilter;

function renderImportBatches() {
  const tbody = document.getElementById("importBatchesTableBody");
  const emptyMsg = document.getElementById("importBatchesEmptyMsg");
  if (!tbody) return;
  if (!window.store || !window.store.importBatches) return;

  const batches = window.store.importBatches
    .getAll()
    .slice()
    .sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
  const distributors = getDistributorsList();

  // Populate distributor filter dropdown once or keep in sync
  const distFilterSelect = document.getElementById("historyDistributorFilter");
  if (distFilterSelect && distFilterSelect.options.length <= 1) {
    const currentVal = distFilterSelect.value;
    distFilterSelect.innerHTML = `<option value="">All Distributors</option>` +
      distributors.map(d => `<option value="${window.escapeHtml(d.id)}">${window.escapeHtml(d.name)}</option>`).join("");
    if (currentVal) distFilterSelect.value = currentVal;
  }

  const query = historySearchQuery;
  const filterDist = historySelectedDistributor;
  const countLabelEl = document.getElementById("historyFilteredCountText");

  let filteredBatches = batches;
  if (filterDist) {
    const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
    const targetDist = legacyDistMap[filterDist] || filterDist;
    filteredBatches = filteredBatches.filter(b => {
      const bDist = legacyDistMap[b.distributorId] || b.distributorId;
      return bDist === targetDist || b.distributorId === filterDist;
    });
  }
  if (query) {
    filteredBatches = filteredBatches.filter(b => {
      const dist = resolveDistributorItem(b.distributorId, distributors);
      const distName = dist ? dist.name.toLowerCase() : "";
      return (
        distName.includes(query) ||
        String(b.fileName || "").toLowerCase().includes(query) ||
        String(b.month || "").toLowerCase().includes(query)
      );
    });
  }

  if (countLabelEl) {
    countLabelEl.textContent = `Showing ${filteredBatches.length} of ${batches.length}`;
  }

  tbody.replaceChildren();

  if (!filteredBatches.length) {
    if (emptyMsg) {
      emptyMsg.style.display = "block";
      emptyMsg.textContent = batches.length === 0 ? "No sheets uploaded yet." : "No matching import sheets found.";
    }
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  filteredBatches.forEach((b) => {
    const dist = resolveDistributorItem(b.distributorId, distributors);
    const uploadedLabel = b.uploadedAt
      ? new Date(b.uploadedAt).toLocaleString("en-US")
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
  const t = distributorTranslations.en;
  const batch =
    window.store && window.store.importBatches
      ? window.store.importBatches.getById(batchId)
      : null;
  const rowCount = batch ? batch.rowCount || 0 : 0;

  if (
    !confirm(
      `${t.confirm_delete_batch} ${rowCount} ${t.confirm_delete_batch_suffix}`,
    )
  )
    return;

  if (window.store && window.store.distributorSales) {
    window.store.distributorSales.deleteByBatch(batchId);
  }
  if (window.store && window.store.importBatches) {
    window.store.importBatches.delete(batchId);
  }

  renderImportBatches();
  renderPendingAreas();
  renderPendingProducts();
  renderMappedAliases();
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

    try { populateUploadControls(); } catch (e) { console.error("populateUploadControls error:", e); }
    try { renderPendingAreas(); } catch (e) { console.error("renderPendingAreas error:", e); }
    try { renderPendingProducts(); } catch (e) { console.error("renderPendingProducts error:", e); }
    try { renderMappedAliases(); } catch (e) { console.error("renderMappedAliases error:", e); }
    try { renderImportBatches(); } catch (e) { console.error("renderImportBatches error:", e); }
  } else {
    if (btnDist) btnDist.classList.add("active");
    if (btnImport) btnImport.classList.remove("active");
    if (panelDist) panelDist.style.display = "block";
    if (panelImport) panelImport.style.display = "none";

    try { renderDistributors(); } catch (e) { console.error("renderDistributors error:", e); }
    try { updateStats(); } catch (e) { console.error("updateStats error:", e); }
  }
}

function populateUploadControls() {
  const distSelect = document.getElementById("uploadDistributorSelect");
  const monthSelect = document.getElementById("uploadMonthSelect");
  const yearSelect = document.getElementById("uploadYearSelect");

  if (distSelect) {
    const prevVal = distSelect.value;
    distSelect.innerHTML = `<option value="">-- Select Distributor --</option>`;
    const distributors = getDistributorsList();
    distributors.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      const isMapped = d.columnMap && d.columnMap.product && d.columnMap.value;
      const mapLabel = isMapped ? " (Mapped)" : " (Unmapped)";
      opt.textContent = `${d.name}${mapLabel}`;
      distSelect.appendChild(opt);
    });
    if (prevVal) distSelect.value = prevVal;
  }

  if (monthSelect && monthSelect.options.length === 0) {
    const monthNamesEn = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthNamesAr = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    monthNamesEn.forEach((m, idx) => {
      const val = String(idx + 1).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = `${val} - ${m}`;
      if (val === currentMonth) opt.selected = true;
      monthSelect.appendChild(opt);
    });
  }

  if (yearSelect && yearSelect.options.length === 0) {
    const currentYear = String(new Date().getFullYear());
    const yearsList =
      typeof window.getDynamicYears === "function"
        ? window.getDynamicYears()
        : ["2025", "2026", "2027"];
    yearsList.forEach((y) => {
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

  if (!distId) {
    if (typeof showToast === "function") {
      showToast(
        "Select a distributor first.",
        "warning",
      );
    }
    return;
  }

  const dist =
    window.store && window.store.distributors
      ? window.store.distributors.getById(distId)
      : null;
  const hasMapping =
    dist && dist.columnMap && dist.columnMap.product && dist.columnMap.value;
  if (!hasMapping) {
    if (typeof showToast === "function") {
      showToast(
        "This distributor's sheet columns aren't mapped yet. Configure it from the Distributors tab first.",
        "error",
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

  const distSelect = document.getElementById("uploadDistributorSelect");
  const monthSelect = document.getElementById("uploadMonthSelect");
  const yearSelect = document.getElementById("uploadYearSelect");
  const distId = distSelect ? distSelect.value : "";
  const month = monthSelect ? monthSelect.value : "";
  const year = yearSelect ? yearSelect.value : "";
  const dist =
    window.store && window.store.distributors
      ? window.store.distributors.getById(distId)
      : null;

  if (
    !dist ||
    !dist.columnMap ||
    !dist.columnMap.product ||
    !dist.columnMap.value ||
    !month ||
    !year
  ) {
    if (typeof showToast === "function") {
      showToast(
        "Select a distributor, month, and year first.",
        "warning",
      );
    }
    e.target.value = "";
    return;
  }

  if (typeof XLSX === "undefined") {
    if (typeof showToast === "function") {
      showToast(
        "Excel reader library failed to load.",
        "error",
      );
    }
    e.target.value = "";
    return;
  }

  const monthKey = `${year}-${month}`;
  const existingBatch =
    window.store && window.store.importBatches
      ? window.store.importBatches.find(distId, monthKey, file.name)
      : null;
  let replacingPreviousBatch = false;

  if (existingBatch) {
    const uploadedDate = existingBatch.uploadedAt
      ? new Date(existingBatch.uploadedAt).toLocaleString()
      : "";
    const confirmMsg = `A sheet was already uploaded for "${dist.name}" / ${monthKey} (${existingBatch.rowCount} rows${uploadedDate ? ", on " + uploadedDate : ""}). Continuing will replace that previous upload entirely. Continue?`;
    if (!confirm(confirmMsg)) {
      e.target.value = "";
      return;
    }
    replacingPreviousBatch = true;
  }

  if (typeof showToast === "function") {
    showToast(
      `Processing file: ${file.name}...`,
      "info",
    );
  }

  const reader = new FileReader();
  reader.onload = async function (ev) {
    let progress = null;
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Detect header row index to skip top banners and align object keys with mapped column names
      const rawMatrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
        defval: "",
      });
      let headerRowIndex = 0;
      let maxColsCount = 0;
      const inspectLimit = Math.min(15, rawMatrix.length);
      for (let i = 0; i < inspectLimit; i++) {
        const row = rawMatrix[i];
        if (Array.isArray(row)) {
          const filledCount = row.filter(
            (c) => c !== null && c !== undefined && String(c).trim() !== "",
          ).length;
          if (filledCount > maxColsCount) {
            maxColsCount = filledCount;
            headerRowIndex = i;
          }
        }
      }

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        range: headerRowIndex,
        defval: "",
        cellDates: true,
      });

      const totalRows = rows.length;
      if (typeof window.openExcelImportProgress === "function") {
        progress = window.openExcelImportProgress({
          title: `Importing Sales: ${dist.name}`,
          fileName: file.name,
          totalRows: totalRows,
        });
      }

      const map = dist.columnMap;
      const batchId = "batch_" + Date.now();
      const imported = [];
      let returnsCount = 0;
      let skippedInvalid = 0;

      // Non-blocking asynchronous chunking (1,000 rows per chunk)
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
        const chunkEnd = Math.min(i + CHUNK_SIZE, totalRows);
        for (let idx = i; idx < chunkEnd; idx++) {
          const row = rows[idx];
          const productRaw = map.product ? row[map.product] : "";
          const valueRaw = map.value ? row[map.value] : "";
          const quantityRaw = map.quantity ? row[map.quantity] : "";
          const dateRaw = map.date ? row[map.date] : "";
          const product = String(productRaw || "").trim();

          const numericValueRaw = parseSalesNumber(valueRaw);
          let numericQuantity =
            map.quantity &&
            quantityRaw !== "" &&
            quantityRaw !== null &&
            quantityRaw !== undefined
              ? parseSalesNumber(quantityRaw)
              : null;

          let parsedDate = null;
          if (
            map.date &&
            dateRaw !== "" &&
            dateRaw !== null &&
            dateRaw !== undefined
          ) {
            parsedDate = parseDateStrict(dateRaw);
          }

          if (!product || isNaN(numericValueRaw)) {
            skippedInvalid++;
            continue;
          }

          let numericValue = numericValueRaw;

          // A row is definitely a return/credit note if either the quantity is negative OR the value is negative
          const hasNegativeQuantity =
            numericQuantity !== null &&
            !isNaN(numericQuantity) &&
            numericQuantity < 0;
          const hasNegativeValue = numericValue < 0;
          const isReturn = hasNegativeQuantity || hasNegativeValue;

          if (isReturn) {
            returnsCount++;
            numericValue = -Math.abs(numericValue);
            if (numericQuantity !== null && !isNaN(numericQuantity)) {
              numericQuantity = -Math.abs(numericQuantity);
            }
          } else {
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
            quantity:
              numericQuantity !== null && !isNaN(numericQuantity)
                ? numericQuantity
                : null,
            pharmacyCode: map.pharmacyCode
              ? String(row[map.pharmacyCode] || "").trim()
              : "",
            pharmacyName: map.pharmacy
              ? String(row[map.pharmacy] || "").trim()
              : "",
            areaRaw: map.area ? String(row[map.area] || "").trim() : "",
            repId: null,
            dmId: null,
            lmId: null,
            lineId: null,
            areaId: null,
          });
        }

        if (progress) {
          progress.update(chunkEnd, totalRows);
        }
        // Yield to the browser's UI thread
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (progress) {
        progress.update(
          totalRows,
          totalRows,
          "Saving imported records...",
        );
      }

      if (
        replacingPreviousBatch &&
        existingBatch &&
        window.store &&
        window.store.distributorSales
      ) {
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
        const replacedNote = replacingPreviousBatch ? " (replaced a previous upload for this month/distributor)" : "";
        panel.innerHTML = `✅ Imported <strong>${imported.length.toLocaleString()}</strong> rows from "${dist.name}" for ${monthKey}${replacedNote} (including ${returnsCount} negative return rows). Net value: <strong>${totalValue.toLocaleString()}</strong>. Skipped ${skippedInvalid} incomplete rows.<br><span class="fw-bold">Note:</span> You can link unmatched areas and products in the sections below.`;
      }

      renderImportBatches();
      renderPendingAreas();
      renderPendingProducts();
      renderMappedAliases();

      if (progress) {
        progress.finish(`Successfully imported ${imported.length.toLocaleString()} rows!`);
      }

      if (typeof showToast === "function") {
        showToast(`Successfully imported ${imported.length} rows.`, "success");
      }
    } catch (err) {
      if (progress) progress.close();
      console.error("Error parsing distributor sheet:", err);
      if (typeof showToast === "function") {
        showToast(
          "Could not read this file. Make sure it matches the sheet layout the mapping was configured from.",
          "error",
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
window.switchAliasTab = switchAliasTab;
window.renderMappedAliases = renderMappedAliases;
window.unlinkAreaAlias = unlinkAreaAlias;
window.unlinkProductAlias = unlinkProductAlias;
window.openPharmacyOverrideModal = openPharmacyOverrideModal;
window.savePharmacyOverride = savePharmacyOverride;
window.deletePharmacyOverride = deletePharmacyOverride;
window.togglePovrMonthPicker = togglePovrMonthPicker;
window.populateUploadControls = populateUploadControls;
if (typeof updatePovrRepDisplay === "function") {
  window.updatePovrRepDisplay = updatePovrRepDisplay;
}

// Auto-refresh distributor views when new data syncs from Cloud Firestore
document.addEventListener("pharma:storage:synced", (e) => {
  if (e.detail && (e.detail.key === "pharma_sales_data" || e.detail.key === "pharma_master_data")) {
    try { if (typeof renderImportBatches === "function") renderImportBatches(); } catch (e) {}
    try { if (typeof renderPendingAreas === "function") renderPendingAreas(); } catch (e) {}
    try { if (typeof renderPendingProducts === "function") renderPendingProducts(); } catch (e) {}
    try { if (typeof renderMappedAliases === "function") renderMappedAliases(); } catch (e) {}
    try { if (typeof renderDistributors === "function") renderDistributors(); } catch (e) {}
    try { if (typeof updateStats === "function") updateStats(); } catch (e) {}
  }
});
