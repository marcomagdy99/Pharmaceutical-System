/**
 * @file products.js
 * @description Product Lines & Products directory management (CRUD + transfer between lines) using Central Store.
 */

// Initialize default lines if empty via Store
function initProductLinesData() {
  if (!window.store || !window.store.productLines) return;
  
  const lines = window.store.productLines.getAll();
  
  if (lines.length === 0) {
    window.store.productLines.save({
      id: "line1",
      name: "Cardio Line",
      nameAr: "خط الكارديو (Cardio)",
      lineManagerId: "lm1",
      lineManagerName: (window.store && window.store.users && window.store.users.getById("lm1") ? window.store.users.getById("lm1").name : "Line Manager"),
      products: [
        { id: "prod_1_1_" + Date.now(), name: "Amoxicillin 500mg", dosage: "500mg", form: "Tablet", description: "Broad-spectrum antibiotic" },
        { id: "prod_1_2_" + Date.now(), name: "Vitamin D Drops 1000IU", dosage: "1000IU", form: "Drops", description: "Vitamin D supplement" }
      ]
    });
    window.store.productLines.save({
      id: "line2",
      name: "Neuro Line",
      nameAr: "خط النيورو (Neuro)",
      lineManagerId: "lm2",
      lineManagerName: (window.store && window.store.users && window.store.users.getById("lm2") ? window.store.users.getById("lm2").name : "Line Manager"),
      products: [
        { id: "prod_2_1_" + Date.now(), name: "Pregabalin 75mg", dosage: "75mg", form: "Capsule", description: "Neuropathic pain" }
      ]
    });
  } else {
    lines.forEach(line => {
      let updated = false;
      if (!line.nameAr) {
        if (line.id === "line1") { line.nameAr = "خط الكارديو (Cardio)"; updated = true; }
        else if (line.id === "line2") { line.nameAr = "خط النيورو (Neuro)"; updated = true; }
      }
      if (!line.lineManagerId) {
        if (line.id === "line1") { line.lineManagerId = "lm1"; updated = true; }
        else if (line.id === "line2") { line.lineManagerId = "lm2"; updated = true; }
        else {
          const mgr = getLineManager(line);
          if (mgr) { line.lineManagerId = mgr.id; updated = true; }
        }
      }
      const mgr = getLineManager(line);
      if (mgr && line.lineManagerName !== mgr.name) {
        line.lineManagerName = mgr.name;
        updated = true;
      }
      if (Array.isArray(line.products)) {
        line.products.forEach((p, pIdx) => {
          if (!p.id) {
            p.id = `prod_${line.id}_${pIdx}_${Date.now()}`;
            updated = true;
          }
        });
      }
      if (updated) window.store.productLines.save(line);
    });
  }
}

function getActiveLineManagers() {
  if (window.store && window.store.users) {
    return window.store.users.getAll().filter(
      (u) => (u.role === "line_manager" || u.role === "LM") && u.status !== "Inactive"
    );
  }
  return [];
}

function getLineManager(line) {
  if (!line) return null;
  const allUsers = (window.store && window.store.users)
    ? window.store.users.getAll()
    : ((window.DEMO_DATA && window.DEMO_DATA.users) || []);

  if (line.lineManagerId) {
    const found = allUsers.find(
      (u) => u.id === line.lineManagerId && (u.role === "line_manager" || u.role === "LM")
    );
    if (found) return found;
  }

  const foundReverse = allUsers.find(
    (u) =>
      (u.role === "line_manager" || u.role === "LM") &&
      (u.lineId === line.id || (Array.isArray(u.lineIds) && u.lineIds.includes(line.id)))
  );
  if (foundReverse) return foundReverse;

  if (line.lineManagerId) {
    return allUsers.find((u) => u.id === line.lineManagerId) || null;
  }

  return null;
}

const productTranslations = {
  en: {
    productLinesTitle: "Product Lines - PharmaCare",
    productLinesHeader: "Product Lines",
    addProductLine: "Add Product Line",
    editProductLine: "Edit Line",
    deleteLine: "Delete Line",
    lineName: "Line Name",
    assignManager: "Assign Line Manager",
    manager: "Manager",
    products: "Products",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete",
    productName: "Product Name",
    dosage: "Dosage",
    form: "Form",
    price: "Value",
    pricePlaceholder: "e.g., 40",
    priceHint: "Used to auto-fill Unit Value when this product is picked in Manage Targets -- still editable per rep there as an exception.",
    description: "Description",
    actions: "Actions",
    tablet: "Tablet",
    capsule: "Capsule",
    drops: "Drops",
    syrup: "Syrup",
    injection: "Injection",
    cream: "Cream",
    other: "Other",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Confirm Delete",
    deleteConfirmMessage: "Are you sure you want to delete this item? This action cannot be undone.",
    lineNamePlaceholder: "Enter line name",
    productNamePlaceholder: "Enter product name",
    dosagePlaceholder: "e.g., 500mg",
    descriptionPlaceholder: "Enter product description",
    logout: "Logout",
    selectManager: "Select a manager",
    unassignedManager: "-- Unassigned (Optional) --",
    transferProduct: "Transfer Product",
    currentLine: "Current Line",
    destinationLine: "Transfer To Line",
    confirmTransfer: "Transfer",
    selectLinePlaceholder: "-- Select Destination Line --",
    transferSuccess: "Product transferred successfully.",
    transferErrorSameLine: "Cannot transfer product to the same line.",
    callFrequencyTitle: "Quarterly Target Visits (Per Doctor Class)",
    callFrequencyHint: "Configures quarterly target visits per doctor in this sales line for coverage compliance.",
    visitsUnit: "v/q",
    targetFrequencyBadge: "Quarterly Targets",
    cycleCampaignFocusTitle: "Cycle Campaign Focus",
    cycleCampaignFocusBtn: "Campaign Focus",
    focusActiveLabel: "Enable Campaign Focus for this Line",
    focusTargetProduct: "Priority Target Product (Optional)",
    focusTargetProductHint: "Choose a specific product as this cycle's hero product or leave general for the entire line.",
    focusMessageLabel: "Key Campaign Message / Strategic Direction",
    focusMessageHint: "This message will appear as an optional strategic reminder on the dashboard for your sales team.",
    focusGeneralProduct: "-- General / All Line Products --",
    cutPointLabel: "⚡ Monthly Cut Point (Ceiling)",
    cutPointPlaceholder: "e.g., 200",
    cutPointHint: "Maximum allowed pharmacy pull per month. Surplus above this is distributed as Bulk to all bricks by weight. Set 0 or leave empty to disable.",
    brickWeightsBtn: "Brick Weights",
    brickWeightsTitle: "Brick Weights",
    bwAreaName: "Area / Brick",
    bwAreaCode: "Code",
    bwRep: "Representative",
    bwWeight: "Weight (%)",
    bwTotal: "📊 Total",
    brickWeightsSaved: "Brick weights saved successfully.",
    brickWeightsRecalc: "Bulk distribution recalculated.",
  }
};

let currentLang = "en";
let lineModal, productModal, deleteModal, transferProductModal, campaignFocusModal;

document.addEventListener("DOMContentLoaded", () => {
  const user = (window.checkAuth && window.checkAuth()) || {};
  const isAdmin = window.hasAnyRole ? window.hasAnyRole(["admin"], user) : (user.role === "admin");
  if (!isAdmin) {
    if (typeof showToast === "function") {
      showToast(
        (window.getCurrentLang && window.getCurrentLang() === "ar")
          ? "غير مصرح: إدارة المنتجات وخطوط الإنتاج مخصصة لمسؤول النظام (الأدمن) فقط."
          : "Access Denied: Product Lines & Products management is for Admins only.",
        "error"
      );
    }
    window.location.replace("index.html");
    return;
  }

  lineModal = new bootstrap.Modal(document.getElementById("lineModal"));
  productModal = new bootstrap.Modal(document.getElementById("productModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  const transferEl = document.getElementById("transferProductModal");
  if (transferEl) {
    transferProductModal = new bootstrap.Modal(transferEl);
  }
  const focusEl = document.getElementById("campaignFocusModal");
  if (focusEl) {
    campaignFocusModal = new bootstrap.Modal(focusEl);
  }

  initProductLinesData();

  populateLineManagersDropdown();
  renderProductLines();
  applyProductTranslations(currentLang);

  const lt = document.getElementById("langToggle");
  if (lt) lt.addEventListener("click", toggleLanguage);
  document.getElementById("saveLineBtn").addEventListener("click", saveLine);
  document.getElementById("saveProductBtn").addEventListener("click", saveProduct);
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
});

function populateLineManagersDropdown() {
  const managerSelect = document.getElementById("lineManager");
  if (!managerSelect) return;
  const currentVal = managerSelect.value;
  const optLabel = productTranslations.en?.unassignedManager || "-- Unassigned (Optional) --";
  managerSelect.innerHTML = `<option value="">${optLabel}</option>`;
  getActiveLineManagers().forEach((m) => {
    managerSelect.innerHTML += `<option value="${window.escapeHtml(m.id)}">${window.escapeHtml(m.name)}</option>`;
  });
  if (currentVal) managerSelect.value = currentVal;
}

function openAddLineModal() {
  const form = document.getElementById("lineForm");
  if (form) form.reset();
  document.getElementById("lineId").value = "";
  populateLineManagersDropdown();
  document.getElementById("lineManager").value = "";

  if (document.getElementById("lineFreqA")) document.getElementById("lineFreqA").value = 4;
  if (document.getElementById("lineFreqB")) document.getElementById("lineFreqB").value = 3;
  if (document.getElementById("lineFreqC")) document.getElementById("lineFreqC").value = 1;

  const titleEl = document.getElementById("lineModalTitle");
  if (titleEl) {
    titleEl.setAttribute("data-i18n", "addProductLine");
    titleEl.textContent = productTranslations.en.addProductLine;
  }

  if (lineModal) lineModal.show();
}

function openEditLine(id) {
  const line = window.store.productLines.getById(id);
  if (!line) return;

  populateLineManagersDropdown();

  const manager = getLineManager(line);
  const resolvedManagerId = (manager ? manager.id : line.lineManagerId) || "";

  document.getElementById("lineId").value = line.id;
  document.getElementById("lineName").value = line.name || "";
  document.getElementById("lineManager").value = resolvedManagerId;

  const freq = line.callFrequency || { classA: 4, classB: 3, classC: 1 };
  if (document.getElementById("lineFreqA")) document.getElementById("lineFreqA").value = freq.classA ?? 4;
  if (document.getElementById("lineFreqB")) document.getElementById("lineFreqB").value = freq.classB ?? 3;
  if (document.getElementById("lineFreqC")) document.getElementById("lineFreqC").value = freq.classC ?? 1;

  const titleEl = document.getElementById("lineModalTitle");
  if (titleEl) {
    titleEl.setAttribute("data-i18n", "editProductLine");
    titleEl.textContent = productTranslations.en.editProductLine;
  }

  if (lineModal) lineModal.show();
}

function renderProductLines(activeLineId) {
  const container = document.getElementById("productLinesAccordion");
  if (!container) return;
  container.replaceChildren();

  const allLines = window.store.productLines.getAll();
  const currentUser = window.checkAuth ? window.checkAuth() : null;
  const role = window.normalizeRole
    ? window.normalizeRole(currentUser?.role)
    : (currentUser?.role || "").toLowerCase();

  let productLines = allLines;
  if (currentUser && role !== "admin") {
    const userLines = typeof window.getUserLines === "function" ? window.getUserLines(currentUser.id) : [];
    if (userLines.length > 0) {
      const allowedIds = userLines.map((l) => l.id);
      productLines = allLines.filter((l) => allowedIds.includes(l.id));
    } else if (["business_unit", "line_manager", "district_manager", "medical_rep", "rep"].includes(role)) {
      productLines = [];
    }
  }

  if (productLines.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">No product lines found.</div>`;
    return;
  }

  productLines.forEach((line, index) => {
    const isExpanded = (activeLineId && line.id === activeLineId) ? "true" : "false";
    const collapseClass = isExpanded === "true" ? "show" : "";
    const buttonClass = isExpanded === "true" ? "" : "collapsed";

    let productsHtml = "";
    if (line.products && line.products.length > 0) {
      productsHtml = `
        <!-- Desktop Table View (>= 768px) -->
        <div class="d-none d-md-block table-responsive mt-2">
            <table class="table table-hover align-middle mb-0">
                <thead class="product-table-head">
                    <tr>
                        <th data-i18n="productName">Product Name</th>
                        <th data-i18n="dosage">Dosage</th>
                        <th data-i18n="form">Form</th>
                        <th data-i18n="price">Value</th>
                        <th class="text-end" data-i18n="actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${line.products.map((prod) => `
                        <tr>
                            <td class="fw-bold text-primary-emphasis">${window.escapeHtml(prod.name)}</td>
                            <td><span class="badge product-dosage-badge">${window.escapeHtml(prod.dosage)}</span></td>
                            <td><span class="badge product-form-badge">${window.escapeHtml(prod.form)}</span></td>
                            <td>${prod.price !== undefined && prod.price !== null && prod.price !== "" ? `<span class="fw-semibold text-success">${Number(prod.price).toLocaleString()} EGP</span>` : '<span class="text-muted">—</span>'}${prod.cutPoint ? ` <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style="font-size:0.7em;">⚡CP: ${prod.cutPoint}</span>` : ""}</td>
                            <td class="text-end product-actions-cell">
                                <button class="btn btn-sm btn-outline-warning me-1" onclick="openBrickWeightsModal('${line.id}', '${prod.id}')" title="Brick Weights">
                                    ⚖️
                                </button>
                                <button class="btn btn-sm btn-outline-info me-1" onclick="openTransferModal('${line.id}', '${prod.id}')" title="Transfer Product">
                                    <i class="bi bi-arrow-left-right"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditProduct('${line.id}', '${prod.id}')" title="Edit Product">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('product', '${prod.id}', '${line.id}')" title="Delete Product">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>

        <!-- Mobile Card List View (< 768px) -->
        <div class="d-md-none product-mobile-cards d-flex flex-column gap-2 mt-2">
            ${line.products.map((prod) => `
                <div class="product-mobile-card p-3 rounded-3 border d-flex justify-content-between align-items-center">
                    <div class="d-flex flex-column gap-1 pe-2" style="min-width: 0;">
                        <span class="fw-bold fs-6 text-truncate product-mobile-name">${window.escapeHtml(prod.name)}</span>
                        <div class="d-flex align-items-center gap-1 flex-wrap">
                            <span class="badge product-dosage-badge">${window.escapeHtml(prod.dosage)}</span>
                            <span class="badge product-form-badge">${window.escapeHtml(prod.form)}</span>
                            ${prod.price !== undefined && prod.price !== null && prod.price !== "" ? `<span class="badge bg-success-subtle text-success border border-success-subtle fw-semibold">${Number(prod.price).toLocaleString()} EGP</span>` : ""}
                            ${prod.cutPoint ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">⚡CP: ${prod.cutPoint}</span>` : ""}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-1 flex-shrink-0">
                        <button class="btn btn-sm btn-outline-warning rounded-circle" onclick="openBrickWeightsModal('${line.id}', '${prod.id}')" title="Brick Weights" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                            ⚖️
                        </button>
                        <button class="btn btn-sm btn-outline-info rounded-circle" onclick="openTransferModal('${line.id}', '${prod.id}')" title="Transfer Product" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                            <i class="bi bi-arrow-left-right" style="font-size: 0.82rem;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary rounded-circle" onclick="openEditProduct('${line.id}', '${prod.id}')" title="Edit Product" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                            <i class="bi bi-pencil" style="font-size: 0.82rem;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="openDeleteModal('product', '${prod.id}', '${line.id}')" title="Delete Product" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0;">
                            <i class="bi bi-trash" style="font-size: 0.82rem;"></i>
                        </button>
                    </div>
                </div>
            `).join("")}
        </div>
      `;
    } else {
      productsHtml = `<div class="text-center text-muted py-4"><i class="bi bi-box-seam fs-3 d-block mb-1 opacity-50"></i>No products in this line yet.</div>`;
    }

    const freq = line.callFrequency || { classA: 4, classB: 3, classC: 1 };
    const manager = getLineManager(line);
    const managerDisplayName = manager
      ? (currentLang === "ar" ? (manager.nameAr || manager.name) : manager.name)
      : (line.lineManagerName || (currentLang === "ar" ? "غير محدد" : "Unassigned"));

    const canManageLine = role === "admin";
    let focusBannerHtml = "";
    if (line.cycleCampaignFocus && line.cycleCampaignFocus.active && line.cycleCampaignFocus.focusMessage) {
      let targetProdName = "";
      if (line.cycleCampaignFocus.targetProductId && Array.isArray(line.products)) {
        const tp = line.products.find(p => p.id === line.cycleCampaignFocus.targetProductId);
        if (tp) targetProdName = tp.name;
      }
      focusBannerHtml = `
        <div class="alert alert-info py-2 px-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style="border-radius: 10px; border-inline-start: 4px solid #2563eb; background: rgba(37, 99, 235, 0.08);">
          <div>
            <strong style="color: #1d4ed8;">🎯 ${currentLang === "ar" ? "تركيز الحملة البيعية الحالية:" : "Current Cycle Campaign Focus:"}</strong>
            ${targetProdName ? `<span class="badge bg-primary ms-1">📦 ${window.escapeHtml(targetProdName)}</span>` : ""}
            <span class="ms-2" style="font-weight: 500;">${window.escapeHtml(line.cycleCampaignFocus.focusMessage)}</span>
          </div>
          <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="openCampaignFocusModal('${line.id}')">
            <i class="bi bi-pencil"></i> ${currentLang === "ar" ? "تعديل التركيز" : "Edit Focus"}
          </button>
        </div>
      `;
    }

    const html = `
            <div class="accordion-item border-0 border-bottom">
                <h2 class="accordion-header" id="heading${line.id}">
                    <div class="d-flex w-100">
                        <button class="accordion-button ${buttonClass} shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${line.id}" aria-expanded="${isExpanded}" aria-controls="collapse${line.id}">
                            <div class="d-flex justify-content-between align-items-center w-100 me-3 flex-wrap gap-2">
                                <div class="d-flex flex-column align-items-start gap-1">
                                    <div class="d-flex align-items-center flex-wrap gap-2">
                                        <span class="fw-bold fs-5 line-title">${window.escapeHtml(line.name)}</span>
                                        <span class="badge bg-primary rounded-pill">${line.products ? line.products.length : 0} <span data-i18n="products">Products</span></span>
                                    </div>
                                    <span class="badge line-freq-badge" title="Quarterly Target Call Frequency">
                                        🎯 A: <strong>${freq.classA ?? 4}</strong> | B: <strong>${freq.classB ?? 3}</strong> | C: <strong>${freq.classC ?? 1}</strong>
                                    </span>
                                </div>
                                <div class="line-manager-info small d-none d-sm-block">
                                    <i class="bi bi-person-badge"></i> <span data-i18n="manager">Manager</span>: <span class="line-manager-name">${window.escapeHtml(managerDisplayName)}</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </h2>
                <div id="collapse${line.id}" class="accordion-collapse collapse ${collapseClass}" aria-labelledby="heading${line.id}" data-bs-parent="#productLinesAccordion">
                    <div class="accordion-body">
                        <!-- Modern Streamlined Toolbar -->
                        <div class="line-actions-toolbar d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 p-2 rounded-3">
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                                <button class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 rounded-pill px-3 shadow-sm fw-semibold" onclick="openAddProductModal('${line.id}')">
                                    <i class="bi bi-plus-circle-fill"></i> <span data-i18n="addProduct">${productTranslations.en.addProduct || "Add Product"}</span>
                                </button>
                                <button class="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1 rounded-pill px-3" onclick="openCampaignFocusModal('${line.id}')" title="Configure Cycle Campaign Focus">
                                    <i class="bi bi-bullseye"></i> <span data-i18n="cycleCampaignFocusBtn">${productTranslations.en.cycleCampaignFocusBtn}</span>
                                </button>
                            </div>
                            ${canManageLine ? `
                            <div class="d-flex align-items-center gap-2 ms-auto">
                                <button class="btn btn-sm btn-outline-secondary rounded-pill px-2 d-inline-flex align-items-center gap-1" onclick="openEditLine('${line.id}')" title="Edit Line">
                                    <i class="bi bi-pencil"></i> <span class="d-none d-sm-inline" data-i18n="editProductLine">${productTranslations.en.editProductLine || "Edit"}</span>
                                </button>
                                <button class="btn btn-sm btn-outline-danger rounded-pill px-2 d-inline-flex align-items-center gap-1" onclick="openDeleteModal('line', '${line.id}')" title="Delete Line">
                                    <i class="bi bi-trash"></i> <span class="d-none d-sm-inline" data-i18n="deleteLine">${productTranslations.en.deleteLine || "Delete"}</span>
                                </button>
                            </div>
                            ` : ""}
                        </div>
                        ${focusBannerHtml}
                        ${productsHtml}
                    </div>
                </div>
            </div>
        `;
    container.innerHTML += html;
  });

  applyProductTranslations(currentLang);
}

function saveLine() {
  const user = (window.checkAuth && window.checkAuth()) || {};
  if (window.hasAnyRole && !window.hasAnyRole(["admin"], user)) {
    if (typeof showToast === "function") showToast("Permission Denied: Admin only.", "error");
    return;
  }
  const id = document.getElementById("lineId").value;
  const name = (document.getElementById("lineName").value || "").trim();
  const managerId = document.getElementById("lineManager").value;

  const rawFreqA = parseInt(document.getElementById("lineFreqA")?.value, 10);
  const rawFreqB = parseInt(document.getElementById("lineFreqB")?.value, 10);
  const rawFreqC = parseInt(document.getElementById("lineFreqC")?.value, 10);
  const freqA = isNaN(rawFreqA) ? 4 : Math.max(0, rawFreqA);
  const freqB = isNaN(rawFreqB) ? 3 : Math.max(0, rawFreqB);
  const freqC = isNaN(rawFreqC) ? 1 : Math.max(0, rawFreqC);

  if (!name) {
    const msg = "Please enter Line Name.";
    showToast(msg, "warning");
    return;
  }

  const manager = managerId ? getActiveLineManagers().find((m) => m.id === managerId) : null;
  const managerName = manager ? manager.name : (managerId ? "Unknown" : "Unassigned");

  const lineIdToUse = id || ("line_" + Date.now());
  const lineObj = {
    id: lineIdToUse,
    name,
    lineManagerId: managerId || null,
    lineManagerName: managerName,
    callFrequency: {
      classA: freqA,
      classB: freqB,
      classC: freqC,
    },
    status: "Active"
  };

  if (id) {
    const existing = window.store.productLines.getById(id);
    if (existing) {
      lineObj.products = existing.products || [];
      lineObj.status = existing.status || "Active";
    }
  } else {
    lineObj.products = [];
  }

  window.store.productLines.save(lineObj);

  if (window.store && window.store.users) {
    const allUsers = window.store.users.getAll();
    allUsers.forEach((u) => {
      if (u.role === "line_manager" || u.role === "LM") {
        let userChanged = false;
        if (managerId && u.id === managerId) {
          if (!Array.isArray(u.lineIds)) u.lineIds = u.lineId ? [u.lineId] : [];
          if (!u.lineIds.includes(lineIdToUse)) {
            u.lineIds.push(lineIdToUse);
            userChanged = true;
          }
          if (u.lineId !== lineIdToUse) {
            u.lineId = lineIdToUse;
            userChanged = true;
          }
        } else {
          if (Array.isArray(u.lineIds) && u.lineIds.includes(lineIdToUse)) {
            u.lineIds = u.lineIds.filter((lid) => lid !== lineIdToUse);
            if (u.lineId === lineIdToUse) u.lineId = u.lineIds[0] || null;
            userChanged = true;
          } else if (u.lineId === lineIdToUse) {
            u.lineId = null;
            userChanged = true;
          }
        }
        if (userChanged) window.store.users.save(u);
      }
    });
  }

  if (lineModal) lineModal.hide();
  renderProductLines(lineIdToUse);

  const successMsg = id ? "Product Line updated successfully." : "Product Line added successfully.";
  if (typeof showToast === "function") showToast(successMsg, "success");
}

function openAddProductModal(lineId) {
  const line = window.store.productLines.getById(lineId);
  if (!line) {
    const msg = "Target line not found.";
    showToast(msg, "error");
    return;
  }

  const form = document.getElementById("productForm");
  if (form) form.reset();

  document.getElementById("targetLineId").value = lineId;
  document.getElementById("productId").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productCutPoint").value = "";

  const titleEl = document.getElementById("productModalTitle");
  if (titleEl) {
    titleEl.setAttribute("data-i18n", "addProduct");
    titleEl.textContent = productTranslations.en.addProduct;
  }

  if (productModal) productModal.show();
}

function openEditProduct(lineId, prodId) {
  const line = window.store.productLines.getById(lineId);
  if (line && Array.isArray(line.products)) {
    const prod = line.products.find((p) => p.id === prodId);
    if (prod) {
      document.getElementById("targetLineId").value = lineId;
      document.getElementById("productId").value = prod.id;
      document.getElementById("productName").value = prod.name || "";
      document.getElementById("productDosage").value = prod.dosage || "";
      document.getElementById("productFormSelect").value = prod.form || "Tablet";
      document.getElementById("productDescription").value = prod.description || "";
      document.getElementById("productPrice").value = prod.price !== undefined && prod.price !== null ? prod.price : "";
      document.getElementById("productCutPoint").value = prod.cutPoint ? prod.cutPoint : "";

      const titleEl = document.getElementById("productModalTitle");
      if (titleEl) {
        titleEl.setAttribute("data-i18n", "editProduct");
        titleEl.textContent = productTranslations.en.editProduct;
      }

      if (productModal) productModal.show();
    }
  }
}

function saveProduct() {
  const user = (window.checkAuth && window.checkAuth()) || {};
  const isPM = window.isPMRole ? window.isPMRole(user) : (user.role === "product_manager" || user.role === "pm");
  const isAdmin = window.hasAnyRole ? window.hasAnyRole(["admin"], user) : user.role === "admin";
  if (!isAdmin && !isPM) {
    if (typeof showToast === "function") showToast("Permission Denied: Admin or Product Manager only.", "error");
    return;
  }
  const targetLineId = document.getElementById("targetLineId").value;
  if (isPM && !isAdmin) {
    const userLines = user.lineIds || (user.lineId ? [user.lineId] : []);
    if (!userLines.includes(targetLineId)) {
      if (typeof showToast === "function") showToast("Permission Denied: You can only manage your line.", "error");
      return;
    }
  }
  const prodId = document.getElementById("productId").value;
  const name = (document.getElementById("productName").value || "").trim();
  const dosage = (document.getElementById("productDosage").value || "").trim();
  const form = document.getElementById("productFormSelect").value;
  const description = (document.getElementById("productDescription").value || "").trim();
  const priceInput = document.getElementById("productPrice").value;
  const price = priceInput === "" ? null : parseFloat(priceInput);
  const cutPointInput = document.getElementById("productCutPoint").value;
  const cutPoint = cutPointInput === "" ? 0 : parseInt(cutPointInput, 10) || 0;

  if (!targetLineId) {
    const msg = "Error: Target Line not identified.";
    showToast(msg, "error");
    return;
  }

  if (!name) {
    const msg = "Please enter Product Name.";
    showToast(msg, "warning");
    return;
  }

  if (!dosage) {
    const msg = "Please enter Dosage.";
    showToast(msg, "warning");
    return;
  }

  const line = window.store.productLines.getById(targetLineId);
  if (!line) {
    const msg = "Target line not found.";
    showToast(msg, "error");
    return;
  }

  if (!Array.isArray(line.products)) line.products = [];

  const isDuplicate = line.products.some(
    (p) => p.id !== prodId &&
           p.name.trim().toLowerCase() === name.toLowerCase() &&
           p.dosage.trim().toLowerCase() === dosage.toLowerCase()
  );
  if (isDuplicate) {
    const msg = "This product with the same dosage already exists in this line.";
    showToast(msg, "warning");
    return;
  }

  if (prodId) {
    const prod = line.products.find((p) => p.id === prodId);
    if (prod) {
      prod.name = name;
      prod.dosage = dosage;
      prod.form = form;
      prod.description = description;
      prod.price = price;
      prod.cutPoint = cutPoint;
    }
  } else {
    line.products.push({
      id: "prod_" + Date.now(),
      name,
      dosage,
      form,
      description,
      price,
      cutPoint,
    });
  }

  window.store.productLines.save(line);
  if (productModal) productModal.hide();
  renderProductLines(targetLineId);

  const successMsg = prodId ? "Product updated successfully." : "Product added to line successfully.";
  if (typeof showToast === "function") showToast(successMsg, "success");
}

function openCampaignFocusModal(lineId) {
  const line = window.store.productLines.getById(lineId);
  if (!line) return;

  const user = (window.checkAuth && window.checkAuth()) || {};
  const isPM = window.isPMRole ? window.isPMRole(user) : (user.role === "product_manager" || user.role === "pm");
  const isAdmin = window.hasAnyRole ? window.hasAnyRole(["admin"], user) : user.role === "admin";
  if (!isAdmin && !isPM) {
    if (typeof showToast === "function") showToast("Permission Denied.", "error");
    return;
  }
  if (isPM && !isAdmin) {
    const userLines = user.lineIds || (user.lineId ? [user.lineId] : []);
    if (!userLines.includes(lineId)) {
      if (typeof showToast === "function") showToast("Permission Denied: You can only configure your assigned line.", "error");
      return;
    }
  }

  document.getElementById("focusLineId").value = lineId;
  const prodSelect = document.getElementById("focusTargetProductSelect");
  const genOpt = productTranslations.en?.focusGeneralProduct || "-- General / All Line Products --";

  prodSelect.innerHTML = `<option value="">${genOpt}</option>`;
  if (Array.isArray(line.products)) {
    line.products.forEach((p) => {
      prodSelect.innerHTML += `<option value="${window.escapeHtml(p.id)}">${window.escapeHtml(p.name)} (${window.escapeHtml(p.dosage || "")})</option>`;
    });
  }

  const focus = line.cycleCampaignFocus || {};
  document.getElementById("focusActiveToggle").checked = !!focus.active;
  prodSelect.value = focus.targetProductId || "";
  document.getElementById("focusMessageInput").value = focus.focusMessage || "";

  if (campaignFocusModal) campaignFocusModal.show();
}

function saveCampaignFocus() {
  const lineId = document.getElementById("focusLineId").value;
  const line = window.store.productLines.getById(lineId);
  if (!line) return;

  const user = (window.checkAuth && window.checkAuth()) || {};
  const isPM = window.isPMRole ? window.isPMRole(user) : (user.role === "product_manager" || user.role === "pm");
  const isAdmin = window.hasAnyRole ? window.hasAnyRole(["admin"], user) : user.role === "admin";
  if (!isAdmin && !isPM) return;

  const active = document.getElementById("focusActiveToggle").checked;
  const targetProductId = document.getElementById("focusTargetProductSelect").value;
  const focusMessage = (document.getElementById("focusMessageInput").value || "").trim();

  line.cycleCampaignFocus = {
    active,
    targetProductId,
    focusMessage,
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || user.username || "Manager"
  };

  window.store.productLines.save(line);

  if (campaignFocusModal) campaignFocusModal.hide();
  renderProductLines(lineId);

  const msg = "Cycle Campaign Focus saved successfully.";
  if (typeof showToast === "function") showToast(msg, "success");
}

window.openAddLineModal = openAddLineModal;
window.openEditLine = openEditLine;
window.openAddProductModal = openAddProductModal;
window.openEditProduct = openEditProduct;
window.openCampaignFocusModal = openCampaignFocusModal;
window.saveCampaignFocus = saveCampaignFocus;

function openDeleteModal(type, targetId, lineId = null) {
  document.getElementById("deleteTargetType").value = type;
  document.getElementById("deleteTargetId").value = targetId;
  document.getElementById("deleteTargetLineId").value = lineId || "";
  deleteModal.show();
}

function confirmDelete() {
  const user = (window.checkAuth && window.checkAuth()) || {};
  const isPM = window.isPMRole ? window.isPMRole(user) : (user.role === "product_manager" || user.role === "pm");
  const type = document.getElementById("deleteTargetType").value;
  const targetId = document.getElementById("deleteTargetId").value;
  const lineId = document.getElementById("deleteTargetLineId").value;

  if (!isAdmin && !(isPM && type === "product")) {
    if (typeof showToast === "function") showToast("Permission Denied: Admin only.", "error");
    return;
  }
  if (isPM && !isAdmin && type === "product") {
    const userLines = user.lineIds || (user.lineId ? [user.lineId] : []);
    if (lineId && !userLines.includes(lineId)) {
      if (typeof showToast === "function") showToast("Permission Denied: You can only delete products in your line.", "error");
      return;
    }
  }

  if (type === "line") {
    if (window.store && window.store.productLines) {
      window.store.productLines.delete(targetId);
    } else if (window.DEMO_DATA && window.DEMO_DATA.productLines) {
      window.DEMO_DATA.productLines = window.DEMO_DATA.productLines.filter(l => l.id !== targetId);
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
      document.dispatchEvent(new CustomEvent("pharma:store:changed", { detail: { entity: "productLines", action: "delete", payload: { id: targetId } } }));
    }

    // Clean up deleted line assignment from users
    if (window.store && window.store.users) {
      const allUsers = window.store.users.getAll();
      allUsers.forEach((u) => {
        let changed = false;
        if (u.lineId === targetId) {
          u.lineId = null;
          changed = true;
        }
        if (Array.isArray(u.lineIds) && u.lineIds.includes(targetId)) {
          u.lineIds = u.lineIds.filter((id) => id !== targetId);
          changed = true;
        }
        if (changed) {
          window.store.users.save(u);
        }
      });
    }

    // Clean up deleted line assignment from areas to prevent orphaned areas
    if (window.store && window.store.areas) {
      const defaultLineId = (typeof window.store.areas._defaultLineId === "function" && window.store.areas._defaultLineId()) || null;
      const allAreas = window.store.areas.getAll();
      allAreas.forEach((a) => {
        if (a.lineId === targetId) {
          a.lineId = defaultLineId;
          window.store.areas.save(a);
        }
      });
    }
  } else if (type === "product") {
    const line = window.store.productLines.getById(lineId);
    if (line && line.products) {
      line.products = line.products.filter((p) => p.id !== targetId);
      window.store.productLines.save(line);
    }
  }

  deleteModal.hide();
  renderProductLines();
}

function openTransferModal(lineId, productId) {
  const sourceLine = window.store.productLines.getById(lineId);
  if (!sourceLine || !sourceLine.products) return;

  const prod = sourceLine.products.find((p) => p.id === productId);
  if (!prod) return;

  document.getElementById("transferSourceLineId").value = lineId;
  document.getElementById("transferProductId").value = productId;
  document.getElementById("transferProductName").value = `${prod.name} (${prod.dosage} - ${prod.form})`;
  document.getElementById("transferCurrentLineName").value = sourceLine.name;

  const selectEl = document.getElementById("transferTargetLineSelect");
  if (!selectEl) return;

  const placeholder = "-- Select Target Line --";
  let optionsHtml = `<option value="" disabled selected>${placeholder}</option>`;
  window.store.productLines.getAll().forEach((l) => {
    if (l.id !== lineId) {
      optionsHtml += `<option value="${window.escapeHtml(l.id)}">${window.escapeHtml(l.name)} (${l.products ? l.products.length : 0} products)</option>`;
    }
  });
  selectEl.innerHTML = optionsHtml;

  const modalEl = document.getElementById("transferProductModal");
  if (modalEl) {
    if (!transferProductModal) {
      transferProductModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    }
    transferProductModal.show();
  }
}

function confirmTransferProduct() {
  const sourceLineId = document.getElementById("transferSourceLineId").value;
  const productId = document.getElementById("transferProductId").value;
  const targetLineId = document.getElementById("transferTargetLineSelect").value;

  if (!targetLineId) {
    showToast("Please select a destination line.", "warning");
    return;
  }

  if (sourceLineId === targetLineId) {
    showToast(productTranslations.en.transferErrorSameLine, "warning");
    return;
  }

  const sourceLine = window.store.productLines.getById(sourceLineId);
  const targetLine = window.store.productLines.getById(targetLineId);

  if (!sourceLine || !targetLine || !sourceLine.products) return;

  const prodIndex = sourceLine.products.findIndex((p) => p.id === productId);
  if (prodIndex === -1) return;

  const [productToMove] = sourceLine.products.splice(prodIndex, 1);
  if (!Array.isArray(targetLine.products)) targetLine.products = [];
  targetLine.products.push(productToMove);

  window.store.productLines.save(sourceLine);
  window.store.productLines.save(targetLine);

  // Update product line in distributor sales records
  if (window.store && window.store.distributorSales) {
    let salesUpdated = false;
    window.store.distributorSales.getAll().forEach((row) => {
      if (row.productId === productId) {
        row.lineId = targetLineId;
        salesUpdated = true;
      }
    });
    if (salesUpdated && typeof window.saveSalesDataToStorage === "function") {
      window.saveSalesDataToStorage();
    }
  }

  // Update or clean up target quotas for transferred product
  if (window.store && window.store.targets) {
    const currentMonth = (typeof window.getSystemTodayStr === "function" ? window.getSystemTodayStr() : new Date().toISOString().split("T")[0]).slice(0, 7);
    const allTargets = window.store.targets.getAll();
    const activeTargetsForOldReps = allTargets.filter((t) => t.productId === productId && (!t.month || t.month >= currentMonth));
    if (activeTargetsForOldReps.length > 0) {
      activeTargetsForOldReps.forEach((t) => window.store.targets.delete(t.id));
      if (typeof window.saveDataToStorage === "function") {
        window.saveDataToStorage();
      }
    }
  }

  if (transferProductModal) transferProductModal.hide();
  renderProductLines();

  const successMsg = "Product transferred successfully. Quotas removed from old line reps; please set new targets for the new line reps in Reports.";
  if (typeof showToast === "function") showToast(successMsg, "info");
}

function toggleLanguage() {
  currentLang = "en";
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  applyProductTranslations("en");
}

if (typeof window.translations !== "undefined") {
  if (window.translations.en && productTranslations.en) Object.assign(window.translations.en, productTranslations.en);
}

function applyProductTranslations(lang) {
  if (typeof window.applyTranslations === "function") window.applyTranslations("en");
  
  const t = productTranslations.en;
  if (!t) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });
}

// ============================================================================
// Brick Weights Modal Controller
// ============================================================================

let brickWeightsModal = null;

function openBrickWeightsModal(lineId, prodId) {
  const line = window.store.productLines.getById(lineId);
  if (!line || !Array.isArray(line.products)) return;
  const prod = line.products.find((p) => p.id === prodId);
  if (!prod) return;

  document.getElementById("brickWeightsProductId").value = prodId;
  document.getElementById("brickWeightsLineId").value = lineId;
  document.getElementById("brickWeightsProdName").textContent = prod.name + " " + (prod.dosage || "");

  populateBrickWeightsTable(lineId, prodId);

  if (!brickWeightsModal) {
    const el = document.getElementById("brickWeightsModal");
    if (el) brickWeightsModal = new bootstrap.Modal(el);
  }
  if (brickWeightsModal) brickWeightsModal.show();
}

function populateBrickWeightsTable(lineId, productId) {
  const tbody = document.getElementById("brickWeightsTbody");
  if (!tbody) return;
  tbody.replaceChildren();

  // Get all areas for this line
  const areas = window.store && window.store.areas ? window.store.areas.getByLine(lineId) : [];
  // Get existing weights for this product
  const existingWeights = window.store && window.store.bulkWeights
    ? window.store.bulkWeights.getByProduct(productId)
    : [];

  areas.forEach((area) => {
    const existing = existingWeights.find((w) => w.areaId === area.id);
    const weight = existing ? existing.weight : 0;
    const rep = area.repId ? (window.store.users.getById(area.repId)) : null;
    const repName = rep ? rep.name : (currentLang === "ar" ? "شاغر" : "Vacant");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${window.escapeHtml ? window.escapeHtml(area.name) : area.name}</td>
      <td><code>${window.escapeHtml ? window.escapeHtml(area.code || "—") : (area.code || "—")}</code></td>
      <td>${window.escapeHtml ? window.escapeHtml(repName) : repName}</td>
      <td>
        <input type="number" class="form-control form-control-sm bw-weight-input"
               data-area-id="${area.id}" data-line-id="${area.lineId || lineId}"
               value="${weight}" min="0" max="100" step="0.01"
               oninput="updateBrickWeightsTotal()">
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateBrickWeightsTotal();
}

function updateBrickWeightsTotal() {
  const inputs = document.querySelectorAll(".bw-weight-input");
  let total = 0;
  inputs.forEach((inp) => { total += parseFloat(inp.value) || 0; });
  const el = document.getElementById("brickWeightsTotalPct");
  if (el) el.textContent = total.toFixed(2) + "%";
}

function saveBrickWeights() {
  const productId = document.getElementById("brickWeightsProductId").value;
  if (!productId) return;

  const inputs = document.querySelectorAll(".bw-weight-input");
  const entries = [];
  inputs.forEach((inp) => {
    const areaId = inp.getAttribute("data-area-id");
    const lineId = inp.getAttribute("data-line-id");
    const weight = parseFloat(inp.value) || 0;
    entries.push({ areaId, weight, lineId });
  });

  if (window.store && window.store.bulkWeights) {
    window.store.bulkWeights.saveAll(productId, entries);
  }

  // Recalculate Bulk distribution
  if (window.store && window.store.distributorSales &&
      typeof window.store.distributorSales.applyCutPointAndBulk === "function") {
    window.store.distributorSales.applyCutPointAndBulk();
  }

  if (brickWeightsModal) brickWeightsModal.hide();

  if (typeof showToast === "function") {
    showToast(productTranslations.en.brickWeightsSaved || "Saved.", "success");
  }
}

// Attach saveBrickWeights to button
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBrickWeightsBtn");
  if (saveBtn) saveBtn.addEventListener("click", saveBrickWeights);
});

// Make openBrickWeightsModal globally accessible
window.openBrickWeightsModal = openBrickWeightsModal;