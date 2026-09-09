/**
 * @file areas.js
 * @description Area Management Logic migrated to central store.
 */

const esc = window.escapeHtml || ((s) => s || "");

let currentView = "table";
let areaModal = null;
let deleteModal = null;

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
  },
  ar: {
    area_management: "إدارة المناطق",
    total_areas: "إجمالي المناطق",
    assigned_areas: "مناطق معينة",
    unassigned_areas: "مناطق شاغرة (غير معينة)",
    manage_areas: "إدارة المناطق",
    add_area: "إضافة منطقة",
    search_areas: "البحث بالاسم أو الرمز...",
    area_code: "رمز المنطقة",
    area_name: "اسم المنطقة",
    assigned_rep: "المندوب المعين",
    status: "الحالة",
    actions: "إجراءات",
    assigned: "معين",
    unassigned: "شاغرة (غير معينة)",
    code_hint: "تلميح التنسيق: CAI-N01. يجب أن يكون فريداً.",
    assign_rep: "تعيين لمندوب طبي",
    cancel: "إلغاء",
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    confirm_delete: "تأكيد الحذف",
    delete_area_msg: "هل أنت متأكد أنك تريد حذف هذه المنطقة؟",
  },
};

function getAreasList() {
  const allUsers = (window.store && window.store.users.getAll()) || [];
  const rawAreas = (window.store && window.store.areas.getAll()) || [];

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
    };
  });
}

function populateRepDropdown(selectedRepId = "") {
  const repSelect = document.getElementById("assignRep");
  if (!repSelect) return;
  const isAr = document.documentElement.dir === "rtl";
  const unassignedLabel = isAr
    ? "-- غير معيّنة (شاغرة) --"
    : "-- Unassigned (Vacant) --";
  const activeReps = (window.store && window.store.users.getReps()) || [];

  let html = `<option value="">${unassignedLabel}</option>`;
  activeReps.forEach((r) => {
    const rName = isAr && r.nameAr ? r.nameAr : r.name;
    const sel = r.id === selectedRepId ? "selected" : "";
    html += `<option value="${esc(r.id)}" ${sel}>${esc(rName)} (${esc(r.employeeCode || r.code || r.id)})</option>`;
  });
  repSelect.innerHTML = html;
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
    window.translations.ar = {
      ...window.translations.ar,
      ...areaTranslations.ar,
    };
  }

  renderAreas();
  updateStats();
});

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

  const isAr = document.documentElement.dir === "rtl";
  const assignedText = isAr
    ? areaTranslations.ar.assigned
    : areaTranslations.en.assigned;
  const unassignedText = isAr
    ? areaTranslations.ar.unassigned
    : areaTranslations.en.unassigned;

  filteredAreas.forEach((area) => {
    const isAssigned = area.repId !== null;
    const statusBadge = isAssigned
      ? `<span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-pill">${assignedText}</span>`
      : `<span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-pill">${unassignedText}</span>`;

    const repDisplay = isAssigned
      ? `<div class="d-flex align-items-center">
           <div class="avatar-circle me-2" style="width: 32px; height: 32px; font-size: 14px;">${esc((area.repName || "U").charAt(0))}</div>
           <span>${esc(area.repName)}</span>
         </div>`
      : `<span class="text-muted fst-italic">${unassignedText}</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-3"><span class="area-code-badge">${esc(area.code)}</span></td>
      <td class="px-4 py-3 fw-medium">${esc(area.name)}</td>
      <td class="px-4 py-3">${repDisplay}</td>
      <td class="px-4 py-3">${statusBadge}</td>
      <td class="px-4 py-3 text-end area-actions-cell">
        <button class="btn btn-sm btn-light me-1 text-primary" onclick="openEditModal('${esc(area.id)}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-light text-danger" onclick="openDeleteModal('${esc(area.id)}')" title="Delete">
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
            <span class="area-code-badge fs-6">${esc(area.code)}</span>
            <div class="dropdown">
              <button class="btn btn-sm btn-light border-0" type="button" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                <li><a class="dropdown-item" href="#" onclick="openEditModal('${esc(area.id)}')"><i class="fas fa-edit me-2 text-primary"></i> <span>${isAr ? areaTranslations.ar.edit : areaTranslations.en.edit}</span></a></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="openDeleteModal('${esc(area.id)}')"><i class="fas fa-trash me-2"></i> <span>${isAr ? areaTranslations.ar.delete : areaTranslations.en.delete}</span></a></li>
              </ul>
            </div>
          </div>
          <h5 class="card-title fw-bold mb-3">${esc(area.name)}</h5>
          <div class="mt-auto pt-3 border-top">
            <small class="text-muted d-block mb-1">${isAr ? areaTranslations.ar.assigned_rep : areaTranslations.en.assigned_rep}</small>
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

function openAddModal() {
  document.getElementById("areaForm").reset();
  document.getElementById("areaId").value = "";
  populateRepDropdown("");
  document.getElementById("areaModalTitle").textContent =
    document.documentElement.dir === "rtl"
      ? areaTranslations.ar.add_area
      : areaTranslations.en.add_area;

  // Show the modal
  areaModal.show();
}

function openEditModal(id) {
  const currentAreas = getAreasList();
  const area = currentAreas.find((a) => a.id === id);
  if (area) {
    document.getElementById("areaId").value = area.id;
    document.getElementById("areaName").value = area.name;
    document.getElementById("areaCode").value = area.code;
    populateRepDropdown(area.repId || "");
    document.getElementById("areaModalTitle").textContent =
      document.documentElement.dir === "rtl"
        ? areaTranslations.ar.edit
        : areaTranslations.en.edit;
    areaModal.show();
  }
}

function saveArea() {
  const id = document.getElementById("areaId").value;
  const name = document.getElementById("areaName").value.trim();
  const code = document.getElementById("areaCode").value.trim();
  const repSelect = document.getElementById("assignRep");
  const repId = repSelect.value || null;

  // Fetch rep name directly from store to avoid formatted dropdown text (e.g. "EMP001 - Name")
  let repName = null;
  if (repId && window.store && window.store.users) {
    const rep = window.store.users.getById(repId);
    repName = rep ? rep.name : null;
  }

  if (!name || !code) {
    if (typeof showToast === "function")
      showToast("Area Name and Code are required.", "warning");
    return;
  }

  const currentAreas = getAreasList();
  const targetId = id || "area_" + Date.now();

  if (window.store && window.store.areas) {
    window.store.areas.save({
      id: targetId,
      name,
      code,
      repId,
      repName,
    });
  }

  areaModal.hide();
  renderAreas();
  updateStats();
  if (typeof showToast === "function")
    showToast("Area saved successfully.", "success");
}

function openDeleteModal(id) {
  document.getElementById("deleteAreaId").value = id;
  deleteModal.show();
}

function confirmDelete() {
  const id = document.getElementById("deleteAreaId").value;

  if (window.store && window.store.areas) {
    window.store.areas.delete(id);
  }

  deleteModal.hide();
  renderAreas();
  updateStats();
  if (typeof showToast === "function")
    showToast("Area deleted successfully.", "info");
}
