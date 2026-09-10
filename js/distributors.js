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
    role_area: "Area / Territory (raw text)",
    role_pharmacy: "Pharmacy / Client Name",
    supply_type: "Supply Type",
    supply_type_hint:
      'Commercial and Tender business from the same wholesaler (e.g. "Ibn Sina" vs "Tender Ibn Sina") are separate distributor entries.',
    type_commercial: "Commercial / Trade",
    type_tender: "Tender / Institutional",
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
    role_area: "المنطقة / الإقليم (نص خام)",
    role_pharmacy: "اسم الصيدلية / العميل",
    supply_type: "نوع التوريد",
    supply_type_hint:
      'التجاري والمناقصات من نفس الموزّع (زي "ابن سينا" و"Tender ابن سينا") بيتسجلوا كموزّعين منفصلين.',
    type_commercial: "تجاري",
    type_tender: "مناقصات",
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
