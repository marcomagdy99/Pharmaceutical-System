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
    price: "القيمة",
    pricePlaceholder: "مثال: 40",
    priceHint: "تُحدد تلقائياً كقيمة افتراضية للوحدة عند اختيار هذا المنتج في شاشة إدارة التارجت -- وقابلة للتعديل لكل مندوب كاستثناء.",
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
    unassignedManager: "-- غير محدد (اختياري) --",
    transferProduct: "نقل المنتج إلى خط آخر",
    currentLine: "الخط الحالي",
    destinationLine: "نقل إلى الخط",
    confirmTransfer: "تأكيد النقل",
    selectLinePlaceholder: "-- اختر الخط المراد النقل إليه --",
    transferSuccess: "تم نقل المنتج بنجاح.",
    transferErrorSameLine: "لا يمكن نقل المنتج إلى نفس الخط.",
    callFrequencyTitle: "المستهدف الربع سنوي للزيارات (حسب فئة الطبيب)",
    callFrequencyHint: "تحديد عدد الزيارات الربع سنوية (الكوارتر) الإلزامية لكل طبيب في هذا الخط لحساب نسبة التغطية.",
    visitsUnit: "ز/ك",
    targetFrequencyBadge: "مستهدف الكوارتر",
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
  const optLabel = productTranslations[currentLang]?.unassignedManager || "-- Unassigned (Optional) --";
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
    titleEl.textContent = productTranslations[currentLang].addProductLine;
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
    titleEl.textContent = productTranslations[currentLang].editProductLine;
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
                <div class="table-responsive mt-3">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
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
                                    <td class="fw-medium">${window.escapeHtml(prod.name)}</td>
                                    <td><span class="badge bg-secondary">${window.escapeHtml(prod.dosage)}</span></td>
                                    <td>${window.escapeHtml(prod.form)}</td>
                                    <td>${prod.price !== undefined && prod.price !== null && prod.price !== "" ? Number(prod.price).toLocaleString() : "—"}</td>
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

    const freq = line.callFrequency || { classA: 4, classB: 3, classC: 1 };
    const manager = getLineManager(line);
    const managerDisplayName = manager
      ? (currentLang === "ar" ? (manager.nameAr || manager.name) : manager.name)
      : (line.lineManagerName || (currentLang === "ar" ? "غير محدد" : "Unassigned"));

    const html = `
            <div class="accordion-item border-0 border-bottom">
                <h2 class="accordion-header" id="heading${line.id}">
                    <div class="d-flex w-100 bg-white">
                        <button class="accordion-button ${buttonClass} shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${line.id}" aria-expanded="${isExpanded}" aria-controls="collapse${line.id}">
                            <div class="d-flex justify-content-between align-items-center w-100 me-3 flex-wrap gap-2">
                                <div class="d-flex flex-column align-items-start gap-1">
                                    <div class="d-flex align-items-center flex-wrap gap-2">
                                        <span class="fw-bold fs-5 line-title">${window.escapeHtml(line.name)}</span>
                                        <span class="badge bg-primary rounded-pill">${line.products ? line.products.length : 0} <span data-i18n="products">Products</span></span>
                                    </div>
                                    <span class="badge bg-light text-dark border line-freq-badge" title="Quarterly Target Call Frequency">
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
                    <div class="accordion-body bg-white">
                        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <div>
                                <button class="btn btn-sm btn-outline-secondary me-2" onclick="openEditLine('${line.id}')">
                                    <i class="bi bi-pencil"></i> <span data-i18n="editProductLine">Edit Line</span>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('line', '${line.id}')">
                                    <i class="bi bi-trash"></i> <span data-i18n="deleteLine">Delete Line</span>
                                </button>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="openAddProductModal('${line.id}')">
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
  const name = (document.getElementById("lineName").value || "").trim();
  const managerId = document.getElementById("lineManager").value;
  const isAr = currentLang === "ar";

  const freqA = parseInt(document.getElementById("lineFreqA")?.value, 10) || 4;
  const freqB = parseInt(document.getElementById("lineFreqB")?.value, 10) || 3;
  const freqC = parseInt(document.getElementById("lineFreqC")?.value, 10) || 1;

  if (!name) {
    const msg = isAr ? "يرجى إدخال اسم الخط." : "Please enter Line Name.";
    return typeof showToast === "function" ? showToast(msg, "warning") : alert(msg);
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

  const successMsg = isAr
    ? (id ? "تم تعديل خط الإنتاج بنجاح." : "تمت إضافة خط الإنتاج بنجاح.")
    : (id ? "Product Line updated successfully." : "Product Line added successfully.");
  if (typeof showToast === "function") showToast(successMsg, "success");
}

function openAddProductModal(lineId) {
  const line = window.store.productLines.getById(lineId);
  if (!line) {
    const isAr = currentLang === "ar";
    const msg = isAr ? "تعذر العثور على هذا الخط." : "Target line not found.";
    return typeof showToast === "function" ? showToast(msg, "danger") : alert(msg);
  }

  const form = document.getElementById("productForm");
  if (form) form.reset();

  document.getElementById("targetLineId").value = lineId;
  document.getElementById("productId").value = "";
  document.getElementById("productPrice").value = "";

  const titleEl = document.getElementById("productModalTitle");
  if (titleEl) {
    titleEl.setAttribute("data-i18n", "addProduct");
    titleEl.textContent = productTranslations[currentLang].addProduct;
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

      const titleEl = document.getElementById("productModalTitle");
      if (titleEl) {
        titleEl.setAttribute("data-i18n", "editProduct");
        titleEl.textContent = productTranslations[currentLang].editProduct;
      }

      if (productModal) productModal.show();
    }
  }
}

function saveProduct() {
  const targetLineId = document.getElementById("targetLineId").value;
  const prodId = document.getElementById("productId").value;
  const name = (document.getElementById("productName").value || "").trim();
  const dosage = (document.getElementById("productDosage").value || "").trim();
  const form = document.getElementById("productFormSelect").value;
  const description = (document.getElementById("productDescription").value || "").trim();
  const priceInput = document.getElementById("productPrice").value;
  const price = priceInput === "" ? null : parseFloat(priceInput);
  const isAr = currentLang === "ar";

  if (!targetLineId) {
    const msg = isAr ? "خطأ: لم يتم تحديد الخط المستهدف." : "Error: Target Line not identified.";
    return typeof showToast === "function" ? showToast(msg, "danger") : alert(msg);
  }

  if (!name) {
    const msg = isAr ? "يرجى إدخال اسم الدواء/المنتج." : "Please enter Product Name.";
    return typeof showToast === "function" ? showToast(msg, "warning") : alert(msg);
  }

  if (!dosage) {
    const msg = isAr ? "يرجى إدخال الجرعة (مثل 500mg)." : "Please enter Dosage.";
    return typeof showToast === "function" ? showToast(msg, "warning") : alert(msg);
  }

  const line = window.store.productLines.getById(targetLineId);
  if (!line) {
    const msg = isAr ? "تعذر العثور على هذا الخط." : "Target line not found.";
    return typeof showToast === "function" ? showToast(msg, "danger") : alert(msg);
  }

  if (!Array.isArray(line.products)) line.products = [];

  if (prodId) {
    const prod = line.products.find((p) => p.id === prodId);
    if (prod) {
      prod.name = name;
      prod.dosage = dosage;
      prod.form = form;
      prod.description = description;
      prod.price = price;
    }
  } else {
    line.products.push({
      id: "prod_" + Date.now(),
      name,
      dosage,
      form,
      description,
      price,
    });
  }

  window.store.productLines.save(line);
  if (productModal) productModal.hide();
  renderProductLines(targetLineId);

  const successMsg = isAr
    ? (prodId ? "تم تعديل المنتج بنجاح." : "تمت إضافة المنتج إلى الخط بنجاح.")
    : (prodId ? "Product updated successfully." : "Product added to line successfully.");
  if (typeof showToast === "function") showToast(successMsg, "success");
}

window.openAddLineModal = openAddLineModal;
window.openEditLine = openEditLine;
window.openAddProductModal = openAddProductModal;
window.openEditProduct = openEditProduct;

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
      selectEl.innerHTML += `<option value="${window.escapeHtml(l.id)}">${window.escapeHtml(l.name)} (${l.products ? l.products.length : 0} products)</option>`;
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