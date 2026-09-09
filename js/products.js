/**
 * @file products.js
 * @description Product Lines & Products directory management (CRUD + transfer between lines) using Central Store.
 */

const esc = window.escapeHtml || ((s) => s || "");

// Initialize default lines if empty via Store
function initProductLinesData() {
  if (!window.store || !window.store.productLines) return;
  
  const lines = window.store.productLines.getAll();
  
  if (lines.length === 0) {
    window.store.productLines.save({
      id: "line1",
      name: "Cardio Line",
      lineManagerId: "lm1",
      lineManagerName: "Hassan Ali",
      products: [
        { id: "prod_1_1_" + Date.now(), name: "Amoxicillin 500mg", dosage: "500mg", form: "Tablet", description: "Broad-spectrum antibiotic" },
        { id: "prod_1_2_" + Date.now(), name: "Vitamin D Drops 1000IU", dosage: "1000IU", form: "Drops", description: "Vitamin D supplement" }
      ]
    });
    window.store.productLines.save({
      id: "line2",
      name: "Neuro Line",
      lineManagerId: "lm2",
      lineManagerName: "Sayed Ibrahim",
      products: [
        { id: "prod_2_1_" + Date.now(), name: "Pregabalin 75mg", dosage: "75mg", form: "Capsule", description: "Neuropathic pain" }
      ]
    });
  } else {
    lines.forEach(line => {
      let updated = false;
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
    transferProduct: "Transfer Product",
    currentLine: "Current Line",
    destinationLine: "Transfer To Line",
    confirmTransfer: "Transfer",
    selectLinePlaceholder: "-- Select Destination Line --",
    transferSuccess: "Product transferred successfully.",
    transferErrorSameLine: "Cannot transfer product to the same line.",
  },
  ar: {
    productLinesTitle: "خطوط الإنتاج - فارماكير",
    productLinesHeader: "خطوط الإنتاج",
    addProductLine: "إضافة خط إنتاج",
    editProductLine: "تعديل الخط",
    deleteLine: "حذف الخط",
    lineName: "اسم الخط",
    assignManager: "تعيين مدير الخط",
    manager: "المدير",
    products: "المنتجات",
    addProduct: "إضافة منتج",
    editProduct: "تعديل المنتج",
    deleteProduct: "حذف",
    productName: "اسم المنتج",
    dosage: "الجرعة",
    form: "الشكل الدوائي",
    description: "الوصف",
    actions: "إجراءات",
    tablet: "أقراص",
    capsule: "كبسولات",
    drops: "نقط",
    syrup: "شراب",
    injection: "حقن",
    cream: "كريم",
    other: "أخرى",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    confirmDelete: "تأكيد الحذف",
    deleteConfirmMessage: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.",
    lineNamePlaceholder: "أدخل اسم الخط",
    productNamePlaceholder: "أدخل اسم المنتج",
    dosagePlaceholder: "مثال: 500 ملغ",
    descriptionPlaceholder: "أدخل وصف المنتج",
    logout: "تسجيل الخروج",
    selectManager: "اختر مديرًا",
    transferProduct: "نقل المنتج إلى خط آخر",
    currentLine: "الخط الحالي",
    destinationLine: "نقل إلى الخط",
    confirmTransfer: "تأكيد النقل",
    selectLinePlaceholder: "-- اختر الخط المراد النقل إليه --",
    transferSuccess: "تم نقل المنتج بنجاح.",
    transferErrorSameLine: "لا يمكن نقل المنتج إلى نفس الخط.",
  },
};

let currentLang = localStorage.getItem("pharmaLang") || "en";
let lineModal, productModal, deleteModal, transferProductModal;

document.addEventListener("DOMContentLoaded", () => {
  lineModal = new bootstrap.Modal(document.getElementById("lineModal"));
  productModal = new bootstrap.Modal(document.getElementById("productModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  const transferEl = document.getElementById("transferProductModal");
  if (transferEl) {
    transferProductModal = new bootstrap.Modal(transferEl);
  }

  initProductLinesData();

  const managerSelect = document.getElementById("lineManager");
  managerSelect.innerHTML = `<option value="" disabled selected data-i18n="selectManager">${productTranslations[currentLang].selectManager}</option>`;
  getActiveLineManagers().forEach((m) => {
    managerSelect.innerHTML += `<option value="${esc(m.id)}">${esc(m.name)}</option>`;
  });

  renderProductLines();
  applyProductTranslations(currentLang);

  const lt = document.getElementById("langToggle");
  if (lt) lt.addEventListener("click", toggleLanguage);
  document.getElementById("saveLineBtn").addEventListener("click", saveLine);
  document.getElementById("saveProductBtn").addEventListener("click", saveProduct);
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);

  document.getElementById("lineModal").addEventListener("show.bs.modal", function (event) {
    if (!event.relatedTarget || !event.relatedTarget.hasAttribute("data-edit-id")) {
      document.getElementById("lineForm").reset();
      document.getElementById("lineId").value = "";
      document.getElementById("lineModalTitle").setAttribute("data-i18n", "addProductLine");
      document.getElementById("lineModalTitle").textContent = productTranslations[currentLang].addProductLine;
    }
  });

  document.getElementById("productModal").addEventListener("show.bs.modal", function (event) {
    if (event.relatedTarget && event.relatedTarget.hasAttribute("data-add-to-line")) {
      document.getElementById("productForm").reset();
      document.getElementById("productId").value = "";
      document.getElementById("targetLineId").value = event.relatedTarget.getAttribute("data-add-to-line");
      document.getElementById("productModalTitle").setAttribute("data-i18n", "addProduct");
      document.getElementById("productModalTitle").textContent = productTranslations[currentLang].addProduct;
    }
  });
});

function renderProductLines() {
  const container = document.getElementById("productLinesAccordion");
  if (!container) return;
  container.replaceChildren();

  const productLines = window.store.productLines.getAll();

  if (productLines.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">No product lines found.</div>`;
    return;
  }

  productLines.forEach((line, index) => {
    const isExpanded = index === 0 ? "true" : "false";
    const collapseClass = index === 0 ? "show" : "";
    const buttonClass = index === 0 ? "" : "collapsed";

    let productsHtml = "";
    if (line.products && line.products.length > 0) {
      productsHtml = `
                <div class="table-responsive mt-3">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th data-i18n="productName">Product Name</th>
                                <th data-i18n="dosage">Dosage</th>
                                <th data-i18n="form">Form</th>
                                <th class="text-end" data-i18n="actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${line.products.map((prod) => `
                                <tr>
                                    <td class="fw-medium">${esc(prod.name)}</td>
                                    <td><span class="badge bg-secondary">${esc(prod.dosage)}</span></td>
                                    <td>${esc(prod.form)}</td>
                                    <td class="text-end product-actions-cell">
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
            `;
    } else {
      productsHtml = `<div class="text-center text-muted py-3">No products in this line yet.</div>`;
    }

    const html = `
            <div class="accordion-item border-0 border-bottom">
                <h2 class="accordion-header" id="heading${line.id}">
                    <div class="d-flex w-100 bg-white">
                        <button class="accordion-button ${buttonClass} shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${line.id}" aria-expanded="${isExpanded}" aria-controls="collapse${line.id}">
                            <div class="d-flex justify-content-between align-items-center w-100 me-3">
                                <div>
                                    <span class="fw-bold fs-5">${esc(line.name)}</span>
                                    <span class="badge bg-primary rounded-pill ms-2">${line.products ? line.products.length : 0} <span data-i18n="products">Products</span></span>
                                </div>
                                <div class="text-muted small d-none d-sm-block">
                                    <i class="bi bi-person-badge"></i> <span data-i18n="manager">Manager</span>: ${esc(line.lineManagerName || "Unassigned")}
                                </div>
                            </div>
                        </button>
                    </div>
                </h2>
                <div id="collapse${line.id}" class="accordion-collapse collapse ${collapseClass}" aria-labelledby="heading${line.id}" data-bs-parent="#productLinesAccordion">
                    <div class="accordion-body bg-white">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <button class="btn btn-sm btn-outline-secondary me-2" onclick="openEditLine('${line.id}')">
                                    <i class="bi bi-pencil"></i> <span data-i18n="editProductLine">Edit Line</span>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('line', '${line.id}')">
                                    <i class="bi bi-trash"></i> <span data-i18n="deleteLine">Delete Line</span>
                                </button>
                            </div>
                            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#productModal" data-add-to-line="${line.id}">
                                <i class="bi bi-plus-circle"></i> <span data-i18n="addProduct">Add Product</span>
                            </button>
                        </div>
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
  const id = document.getElementById("lineId").value;
  const name = document.getElementById("lineName").value;
  const managerId = document.getElementById("lineManager").value;

  if (!name || !managerId) {
    return typeof showToast === "function" ? showToast("Please enter Line Name and Manager.", "warning") : alert("Please enter Line Name and Manager.");
  }

  const managers = getActiveLineManagers();
  const manager = managers.find((m) => m.id === managerId);

  const lineObj = {
    id: id || "line_" + Date.now(),
    name,
    lineManagerId: managerId,
    lineManagerName: manager ? manager.name : "Unknown",
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
  lineModal.hide();
  renderProductLines();
}

function openEditLine(id) {
  const line = window.store.productLines.getById(id);
  if (line) {
    document.getElementById("lineId").value = line.id;
    document.getElementById("lineName").value = line.name;
    document.getElementById("lineManager").value = line.lineManagerId;

    document.getElementById("lineModalTitle").setAttribute("data-i18n", "editProductLine");
    document.getElementById("lineModalTitle").textContent = productTranslations[currentLang].editProductLine;

    document.getElementById("lineModal").setAttribute("data-edit-id", id);
    lineModal.show();
  }
}

function saveProduct() {
  const targetLineId = document.getElementById("targetLineId").value;
  const prodId = document.getElementById("productId").value;
  const name = document.getElementById("productName").value;
  const dosage = document.getElementById("productDosage").value;
  const form = document.getElementById("productFormSelect").value;
  const description = document.getElementById("productDescription").value;

  if (!name || !dosage || !form) {
    return typeof showToast === "function" ? showToast("Please fill Product Name, Dosage, and Form.", "warning") : alert("Missing details.");
  }

  const line = window.store.productLines.getById(targetLineId);
  if (!line) return;

  if (!Array.isArray(line.products)) line.products = [];

  if (prodId) {
    const prod = line.products.find((p) => p.id === prodId);
    if (prod) {
      prod.name = name;
      prod.dosage = dosage;
      prod.form = form;
      prod.description = description;
    }
  } else {
    line.products.push({ id: "prod_" + Date.now(), name, dosage, form, description });
  }

  window.store.productLines.save(line);
  productModal.hide();
  renderProductLines();
}

function openEditProduct(lineId, prodId) {
  const line = window.store.productLines.getById(lineId);
  if (line && line.products) {
    const prod = line.products.find((p) => p.id === prodId);
    if (prod) {
      document.getElementById("targetLineId").value = lineId;
      document.getElementById("productId").value = prod.id;
      document.getElementById("productName").value = prod.name;
      document.getElementById("productDosage").value = prod.dosage;
      document.getElementById("productFormSelect").value = prod.form;
      document.getElementById("productDescription").value = prod.description;

      document.getElementById("productModalTitle").setAttribute("data-i18n", "editProduct");
      document.getElementById("productModalTitle").textContent = productTranslations[currentLang].editProduct;

      productModal.show();
    }
  }
}

function openDeleteModal(type, targetId, lineId = null) {
  document.getElementById("deleteTargetType").value = type;
  document.getElementById("deleteTargetId").value = targetId;
  document.getElementById("deleteTargetLineId").value = lineId || "";
  deleteModal.show();
}

function confirmDelete() {
  const type = document.getElementById("deleteTargetType").value;
  const targetId = document.getElementById("deleteTargetId").value;
  const lineId = document.getElementById("deleteTargetLineId").value;

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

  const isAr = document.documentElement.dir === "rtl";
  const placeholder = isAr ? productTranslations.ar.selectLinePlaceholder : productTranslations.en.selectLinePlaceholder;
  selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;

  window.store.productLines.getAll().forEach((l) => {
    if (l.id !== lineId) {
      selectEl.innerHTML += `<option value="${esc(l.id)}">${esc(l.name)} (${l.products ? l.products.length : 0} products)</option>`;
    }
  });

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
  const isAr = document.documentElement.dir === "rtl";

  if (!targetLineId) {
    const msg = isAr ? "يرجى اختيار الخط الجديد." : "Please select a destination line.";
    return typeof showToast === "function" ? showToast(msg, "warning") : alert(msg);
  }

  if (sourceLineId === targetLineId) {
    const errMsg = isAr ? productTranslations.ar.transferErrorSameLine : productTranslations.en.transferErrorSameLine;
    return typeof showToast === "function" ? showToast(errMsg, "warning") : alert(errMsg);
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

  if (transferProductModal) transferProductModal.hide();
  renderProductLines();

  const successMsg = isAr ? productTranslations.ar.transferSuccess : productTranslations.en.transferSuccess;
  if (typeof showToast === "function") showToast(successMsg, "success");
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "ar" : "en";
  localStorage.setItem("pharmaLang", currentLang);
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  applyProductTranslations(currentLang);

  const managerSelect = document.getElementById("lineManager");
  if (managerSelect && managerSelect.options.length > 0 && managerSelect.options[0].value === "") {
    managerSelect.options[0].text = productTranslations[currentLang].selectManager;
  }
}

if (typeof window.translations !== "undefined") {
  if (window.translations.en && productTranslations.en) Object.assign(window.translations.en, productTranslations.en);
  if (window.translations.ar && productTranslations.ar) Object.assign(window.translations.ar, productTranslations.ar);
}

function applyProductTranslations(lang) {
  const selectedLang = lang || (typeof getCurrentLang === "function" ? getCurrentLang() : "en");
  if (typeof window.applyTranslations === "function") window.applyTranslations(selectedLang);
  
  const t = productTranslations[selectedLang];
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