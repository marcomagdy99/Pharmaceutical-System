/**
 * @file users.js
 * @description User Management Module refactored to strictly rely on the Central Store.
 */

const userTranslations = {
  en: {
    menu_users: "Users",
    switch_lang: "عربي",
    logout: "Logout",
    user_management: "User Management",
    total_users_badge: "total users",
    add_user: "Add User",
    edit_user: "Edit User",
    total_users: "Total Users",
    stat_admins: "Admins",
    stat_managers: "Managers",
    stat_reps: "Medical Reps",
    search_user_ph: "Search by name, email, or code...",
    role_all: "All Roles",
    role_admin: "Admin",
    role_bu: "Business Unit",
    role_lm: "Line Manager",
    role_dm: "District Manager",
    role_rep: "Medical Rep",
    view_table: "Table",
    view_tree: "Hierarchy",
    col_user: "User",
    col_code: "Code",
    col_role: "Role",
    col_manager: "Manager",
    col_area: "Area",
    col_status: "Status",
    col_actions: "Actions",
    status_active: "Active",
    status_inactive: "Inactive",
    full_name: "Full Name",
    email: "Email",
    emp_code: "Employee Code",
    password: "Password",
    password_ph: "Leave blank to keep current",
    role: "Role",
    select_role: "Select Role...",
    phone: "Phone",
    manager: "Assign Manager",
    select_manager: "Select Manager...",
    area: "Assign Area",
    select_area: "Select Area...",
    product_line: "Assign Product Line",
    cancel: "Cancel",
    save: "Save",
    reset_password_title: "Reset Password",
    reset_password_confirm:
      "Are you sure you want to reset the password for this user? A default password will be emailed to them.",
    confirm_reset: "Reset",
    deactivate_title: "Deactivate User",
    deactivate_confirm:
      "Are you sure you want to deactivate this user? They will no longer be able to log in.",
    confirm_deactivate: "Deactivate",
    activate: "Activate",
    deactivate: "Deactivate",
    none: "None",
    manage_lines: "Manage Sales Lines",
    manage_areas: "Manage Areas",
    add_new_line: "Add New Sales Line",
    save_line: "Save Line",
    line_name: "Line Name",
    active_managers: "Assigned LM",
    add_new_area: "Add / Assign Area",
    save_area: "Save Area",
    area_name: "Area Name",
    area_code: "Code",
    assigned_rep: "Assigned Rep",
    select_rep: "Assign Rep...",
    close: "Close",
    leaveAllocationTitle: "Leave Balance Allocation (Days)",
    leaveAllocationSub: "Set initial annual, casual, and sick days",
    annualDaysLabel: "Annual (Days)",
    casualDaysLabel: "Casual (Days)",
    sickDaysLabel: "Sick (Days)",
  },
  ar: {
    menu_users: "المستخدمين",
    switch_lang: "English",
    logout: "تسجيل الخروج",
    user_management: "إدارة المستخدمين",
    total_users_badge: "إجمالي المستخدمين",
    add_user: "إضافة مستخدم",
    edit_user: "تعديل مستخدم",
    total_users: "إجمالي المستخدمين",
    stat_admins: "المديرين",
    stat_managers: "المدراء",
    stat_reps: "المندوبين الطبيين",
    search_user_ph: "البحث بالاسم، البريد أو الكود...",
    role_all: "كل الأدوار",
    role_admin: "مدير نظام",
    role_bu: "وحدة الأعمال",
    role_lm: "مدير خط",
    role_dm: "مدير منطقة",
    role_rep: "مندوب طبي",
    view_table: "جدول",
    view_tree: "هيكلية",
    col_user: "المستخدم",
    col_code: "الكود",
    col_role: "الدور",
    col_manager: "المدير المباشر",
    col_area: "المنطقة",
    col_status: "الحالة",
    col_actions: "إجراءات",
    status_active: "نشط",
    status_inactive: "غير نشط",
    full_name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    emp_code: "كود الموظف",
    password: "كلمة المرور",
    password_ph: "اتركه فارغاً للاحتفاظ بالحالي",
    role: "الدور",
    select_role: "اختر الدور...",
    phone: "رقم الهاتف",
    manager: "تعيين مدير",
    select_manager: "اختر المدير...",
    area: "تعيين منطقة",
    select_area: "اختر المنطقة...",
    product_line: "تعيين خط منتجات",
    cancel: "إلغاء",
    save: "حفظ",
    reset_password_title: "إعادة تعيين كلمة المرور",
    reset_password_confirm:
      "هل أنت متأكد من إعادة تعيين كلمة المرور لهذا المستخدم؟ سيتم إرسال كلمة مرور افتراضية.",
    confirm_reset: "إعادة تعيين",
    deactivate_title: "إلغاء تنشيط المستخدم",
    deactivate_confirm:
      "هل أنت متأكد من إلغاء تنشيط هذا المستخدم؟ لن يتمكن من تسجيل الدخول.",
    confirm_deactivate: "إلغاء تنشيط",
    activate: "تنشيط",
    deactivate: "إلغاء تنشيط",
    none: "لا يوجد",
    manage_lines: "إدارة خطوط المبيعات (Sales Lines)",
    manage_areas: "إدارة وتوزيع المناطق",
    add_new_line: "إضافة خط مبيعات جديد",
    save_line: "حفظ الخط",
    line_name: "اسم الخط",
    active_managers: "مدير الخط (LM)",
    add_new_area: "إضافة / تخصيص منطقة",
    save_area: "حفظ المنطقة",
    area_name: "اسم المنطقة",
    area_code: "كود المنطقة",
    assigned_rep: "المندوب المعين",
    select_rep: "تعيين مندوب...",
    close: "إغلاق",
    leaveAllocationTitle: "تخصيص أرصدة الإجازات السنوية (بالأيام)",
    leaveAllocationSub: "تحديد رصيد الإجازة الاعتيادية والعارضة والمرضية",
    annualDaysLabel: "الاعتيادية (أيام)",
    casualDaysLabel: "العارضة (أيام)",
    sickDaysLabel: "المرضية (أيام)",
  },
};

async function hashPassword(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "fallback_" + Math.abs(hash).toString(16);
}

const userMgmt = {
  get users() {
    if (!window.store || !window.store.users) return [];
    return window.store.users.getAll().map((u) => ({
      ...u,
      role: this.normalizeRole(u.role),
    }));
  },
  get lines() {
    return window.store && window.store.productLines
      ? window.store.productLines.getAll()
      : [];
  },
  get areas() {
    return window.store && window.store.areas
      ? window.store.areas.getAll()
      : [];
  },

  selectedUserId: null,
  editingLineId: null,
  editingAreaId: null,

  init() {
    if (window.translations) {
      window.translations.en = {
        ...(window.translations.en || {}),
        ...userTranslations.en,
      };
      window.translations.ar = {
        ...(window.translations.ar || {}),
        ...userTranslations.ar,
      };
    } else {
      window.translations = userTranslations;
    }

    if (typeof renderSidebar === "function") {
      renderSidebar("users");
    }

    this.loadDemoData();
    this.initLinesAndAreas();

    const searchInput = document.getElementById("searchUser");
    if (searchInput) searchInput.addEventListener("input", () => this.render());

    const filterRole = document.getElementById("filterRole");
    if (filterRole) filterRole.addEventListener("change", () => this.render());

    document.addEventListener("languageChanged", (e) => {
      const lang = e.detail?.lang || e.detail;
      const lbl = document.getElementById("langLabel");
      if (lbl) lbl.textContent = lang === "ar" ? "English" : "عربي";
      this.render();
    });

    this.render();
  },

  _modalInstances: {},
  _getModalInstance(id) {
    if (this._modalInstances[id]) return this._modalInstances[id];
    const el = document.getElementById(id);
    if (!el) return null;

    const instance = new bootstrap.Modal(el);
    this._modalInstances[id] = instance;

    if (id === "linesModal" || id === "areasModal") {
      el.addEventListener("hidden.bs.modal", () => {
        if (this.returnToUserModal) {
          this.returnToUserModal = false;
          this.populateDropdowns();
          const userModalInstance = this._getModalInstance("userModal");
          if (userModalInstance) userModalInstance.show();
        }
      });
    }
    return instance;
  },

  showModal(type) {
    const idMap = {
      user: "userModal",
      resetPwd: "resetPwdModal",
      deactivate: "deactivateModal",
      lines: "linesModal",
      areas: "areasModal",
    };
    const id = idMap[type];
    if (!id) return;
    if (type === "lines" || type === "areas") {
      const userModalEl = document.getElementById("userModal");
      if (userModalEl && userModalEl.classList.contains("show")) {
        this.returnToUserModal = true;
        this._getModalInstance("userModal").hide();
      }
    }
    const instance = this._getModalInstance(id);
    if (instance) instance.show();
  },

  closeModal(type) {
    const idMap = {
      user: "userModal",
      resetPwd: "resetPwdModal",
      deactivate: "deactivateModal",
      lines: "linesModal",
      areas: "areasModal",
    };
    const id = idMap[type];
    if (!id) return;
    const instance = this._getModalInstance(id);
    if (instance) instance.hide();
  },

  initLinesAndAreas() {
    if (!window.store) return;
    if (this.lines.length === 0) {
      window.store.productLines.save({
        id: "line1",
        name: "Cardio Line",
        desc: "Cardiology & Hypertension",
        status: "Active",
      });
      window.store.productLines.save({
        id: "line2",
        name: "Neuro Line",
        desc: "Neurology & CNS",
        status: "Active",
      });
      window.store.productLines.save({
        id: "line3",
        name: "Derma Line",
        desc: "Dermatology & Skin Care",
        status: "Active",
      });
    }
    if (this.areas.length === 0) {
      window.store.areas.save({
        id: "area1",
        name: "Nasr City",
        code: "CAI-N01",
        repId: "rep1",
      });
      window.store.areas.save({
        id: "area2",
        name: "Heliopolis",
        code: "CAI-H01",
        repId: "rep2",
      });
      window.store.areas.save({
        id: "area3",
        name: "Maadi",
        code: "CAI-M01",
        repId: null,
      });
      window.store.areas.save({
        id: "area4",
        name: "Dokki",
        code: "GZA-D01",
        repId: null,
      });
    }
    this.populateDropdowns();
  },

  loadDemoData() {
    if (!window.store) return;
    if (this.users.length === 0) {
      const defaultUsers = [
        {
          id: "admin1",
          name: "System Admin",
          email: "admin@pharmacare.com",
          code: "ADM-001",
          employeeCode: "ADM-001",
          role: "admin",
          status: "Active",
          managerId: null,
        },
        {
          id: "bu1",
          name: "Tarek Saad",
          email: "bu@pharmacare.com",
          code: "BU-001",
          employeeCode: "BU-001",
          role: "business_unit",
          status: "Active",
          managerId: "admin1",
        },
        {
          id: "lm1",
          name: "Hassan Ali",
          email: "lm@pharmacare.com",
          code: "LM-001",
          employeeCode: "LM-001",
          role: "line_manager",
          status: "Active",
          managerId: "bu1",
          lineIds: ["line1", "line2"],
        },
        {
          id: "dm1",
          name: "Karim Nasser",
          email: "dm@pharmacare.com",
          code: "DM-001",
          employeeCode: "DM-001",
          role: "district_manager",
          status: "Active",
          managerId: "lm1",
          lineIds: ["line1"],
        },
        {
          id: "rep1",
          name: "Ahmed Mostafa",
          email: "rep1@pharmacare.com",
          code: "EMP-001",
          employeeCode: "EMP-001",
          role: "medical_rep",
          status: "Active",
          managerId: "dm1",
          area: "Nasr City",
          areaId: "area1",
          lineIds: ["line1"],
        },
        {
          id: "rep2",
          name: "Omar Youssef",
          email: "rep2@pharmacare.com",
          code: "EMP-002",
          employeeCode: "EMP-002",
          role: "medical_rep",
          status: "Active",
          managerId: "dm1",
          area: "Heliopolis",
          areaId: "area2",
          lineIds: ["line1"],
        },
        {
          id: "hr1",
          name: "Fatma El-Sherif",
          email: "hr@pharmacare.com",
          code: "HR-001",
          employeeCode: "HR-001",
          role: "hr",
          status: "Active",
          managerId: null,
        },
      ];
      defaultUsers.forEach((u) => window.store.users.save(u));
    }
  },

  populateDropdowns() {
    const areaSelect = document.getElementById("uArea");
    if (areaSelect) {
      const currentVal = areaSelect.value;
      let areaOpts = `<option value="" data-i18n="select_area">Select Area...</option>`;
      this.areas.forEach((a) => {
        areaOpts += `<option value="${a.name}">${a.name} (${a.code})</option>`;
      });
      areaSelect.innerHTML = areaOpts;
      if (currentVal) areaSelect.value = currentVal;
    }
    const linesContainer = document.getElementById("uProductLinesContainer");
    if (linesContainer) {
      linesContainer.replaceChildren();
      const esc = window.escapeHtml || ((s) => s || "");
      this.lines
        .filter((l) => l.status === "Active")
        .forEach((l) => {
          const lbl = document.createElement("label");
          lbl.className = "d-flex align-items-center gap-2 mb-1 cursor-pointer";
          lbl.innerHTML = `<input type="checkbox" class="user-line-cb form-check-input" value="${esc(l.id)}">
                         <span class="small fw-semibold text-dark">${esc(l.name)}</span>`;
          linesContainer.appendChild(lbl);
        });

      document.querySelectorAll(".user-line-cb").forEach((cb) => {
        cb.addEventListener("change", () => this.updateManagerDropdown());
      });
    }
  },

  // ==========================================
  // Section: Lines Modal Operations
  // ==========================================
  openLinesModal() {
    this.editingLineId = null;
    if (document.getElementById("lineNameInput"))
      document.getElementById("lineNameInput").value = "";
    if (document.getElementById("lineDescInput"))
      document.getElementById("lineDescInput").value = "";
    if (document.getElementById("cancelLineBtn"))
      document.getElementById("cancelLineBtn").style.display = "none";
    this.renderLinesTable();
    this.showModal("lines");
  },
  renderLinesTable() {
    const tbody = document.getElementById("linesTableBody");
    if (!tbody) return;
    tbody.innerHTML = this.lines
      .map((line) => {
        const assignedLM = this.users.find(
          (u) =>
            u.role === "LM" &&
            (u.lineIds?.includes(line.id) || u.lineId === line.id),
        );
        return `
        <tr>
          <td class="ps-3 fw-bold text-dark">${line.name} <small class="text-muted d-block">${line.desc || ""}</small></td>
          <td>${assignedLM ? `<span class="badge bg-primary-subtle text-primary">${assignedLM.name}</span>` : '<span class="text-muted">Unassigned</span>'}</td>
          <td><span class="badge bg-${line.status === "Active" ? "success" : "secondary"}-subtle text-${line.status === "Active" ? "success" : "secondary"} rounded-pill">${line.status}</span></td>
          <td class="text-end pe-3">
            <button class="btn btn-sm btn-light text-primary me-1" onclick="userMgmt.editLine('${line.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-light text-${line.status === "Active" ? "warning" : "success"} me-1" onclick="userMgmt.toggleLineStatus('${line.id}')"><i class="fas fa-${line.status === "Active" ? "ban" : "check"}"></i></button>
            <button class="btn btn-sm btn-light text-danger" onclick="userMgmt.deleteLine('${line.id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
      })
      .join("");
  },
  saveLine() {
    const nameInput = document.getElementById("lineNameInput");
    const descInput = document.getElementById("lineDescInput");
    const name = nameInput ? nameInput.value.trim() : "";
    const desc = descInput ? descInput.value.trim() : "";
    if (!name) return showToast("Please enter a Product Line Name.", "warning");

    const lineObj = {
      id: this.editingLineId || "line_" + Date.now(),
      name,
      desc,
      status: "Active",
    };
    if (this.editingLineId) {
      const existing = this.lines.find((l) => l.id === this.editingLineId);
      if (existing) lineObj.status = existing.status;
    }
    window.store.productLines.save(lineObj);

    this.cancelEditLine();
    this.renderLinesTable();
    this.populateDropdowns();
    this.render();
    showToast("Product Line saved successfully.", "success");
  },
  editLine(id) {
    const line = this.lines.find((l) => l.id === id);
    if (!line) return;
    this.editingLineId = id;
    document.getElementById("lineNameInput").value = line.name;
    document.getElementById("lineDescInput").value = line.desc || "";
    document.getElementById("saveLineBtn").textContent = "Update Line";
    document.getElementById("cancelLineBtn").style.display = "inline-block";
  },
  cancelEditLine() {
    this.editingLineId = null;
    document.getElementById("lineNameInput").value = "";
    document.getElementById("lineDescInput").value = "";
    document.getElementById("saveLineBtn").textContent = "Save Line";
    document.getElementById("cancelLineBtn").style.display = "none";
  },
  toggleLineStatus(id) {
    const line = this.lines.find((l) => l.id === id);
    if (line) {
      line.status = line.status === "Active" ? "Closed" : "Active";
      window.store.productLines.save(line);
      this.renderLinesTable();
      this.populateDropdowns();
      showToast(`Line status changed to ${line.status}.`, "info");
    }
  },
  deleteLine(id) {
    if (!confirm("Are you sure you want to delete this product line?")) return;
    if (window.store && window.store.productLines) {
      window.store.productLines.delete(id);
    }
    this.renderLinesTable();
    this.populateDropdowns();
    this.render();
    showToast("Product Line deleted.", "info");
  },

  // ==========================================
  // Section: Areas Operations
  // ==========================================
  openAreasModal() {
    window.location.href = "areas.html";
  },
  populateAreaRepSelect() {
    const repSelect = document.getElementById("areaRepSelect");
    if (!repSelect) return;
    const reps = this.users.filter(
      (u) => u.role === "Rep" && u.status === "Active",
    );
    repSelect.innerHTML = `<option value="">Assign Rep...</option>
      ${reps.map((r) => `<option value="${r.id}">${r.name} (${r.code})</option>`).join("")}`;
  },
  renderAreasTable() {
    const tbody = document.getElementById("areasTableBody");
    if (!tbody) return;
    tbody.innerHTML = this.areas
      .map((area) => {
        const assignedRep = this.users.find(
          (u) => u.id === area.repId || u.area === area.name,
        );
        return `
        <tr>
          <td class="ps-3 fw-bold text-dark">${area.name}</td>
          <td><span class="badge bg-light text-dark border">${area.code}</span></td>
          <td>
            ${
              assignedRep
                ? `<span class="badge bg-success-subtle text-success me-2">${assignedRep.name}</span>
                   <button class="btn btn-sm btn-link text-danger p-0" onclick="userMgmt.unassignArea('${area.id}')"><i class="fas fa-times-circle"></i> Remove</button>`
                : `<span class="text-muted">Unassigned</span>`
            }
          </td>
          <td class="text-end pe-3">
            <button class="btn btn-sm btn-light text-primary me-1" onclick="userMgmt.editArea('${area.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-light text-danger" onclick="userMgmt.deleteArea('${area.id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
      })
      .join("");
  },
  saveArea() {
    const nameInput = document.getElementById("areaNameInput");
    const codeInput = document.getElementById("areaCodeInput");
    const repSelect = document.getElementById("areaRepSelect");
    const name = nameInput ? nameInput.value.trim() : "";
    const code = codeInput ? codeInput.value.trim() : "";
    const repId = repSelect ? repSelect.value : null;

    if (!name) return showToast("Please enter an Area Name.", "warning");

    let areaObj = {
      id: this.editingAreaId || "area_" + Date.now(),
      name,
      code: code || "CAI-" + Math.floor(100 + Math.random() * 900),
      repId,
    };

    if (repId) {
      const rep = this.users.find((u) => u.id === repId);
      if (rep) areaObj.repName = rep.name;
    } else {
      areaObj.repName = null;
    }

    window.store.areas.save(areaObj);

    this.cancelEditArea();
    this.renderAreasTable();
    this.populateDropdowns();
    this.render();
    showToast("Area configuration updated successfully.", "success");
  },
  editArea(id) {
    const area = this.areas.find((a) => a.id === id);
    if (!area) return;
    this.editingAreaId = id;
    document.getElementById("areaNameInput").value = area.name;
    document.getElementById("areaCodeInput").value = area.code;
    const rep = this.users.find(
      (u) => u.id === area.repId || u.area === area.name,
    );
    if (rep) document.getElementById("areaRepSelect").value = rep.id;
    document.getElementById("saveAreaBtn").textContent = "Update";
    document.getElementById("cancelAreaBtn").style.display = "inline-block";
  },
  cancelEditArea() {
    this.editingAreaId = null;
    document.getElementById("areaNameInput").value = "";
    document.getElementById("areaCodeInput").value = "";
    document.getElementById("areaRepSelect").value = "";
    document.getElementById("saveAreaBtn").textContent = "Save";
    document.getElementById("cancelAreaBtn").style.display = "none";
  },
  unassignArea(areaId) {
    window.store.areas.unassignRep(areaId);
    this.renderAreasTable();
    this.render();
    showToast("Area unassigned.", "info");
  },
  deleteArea(id) {
    if (!confirm("Are you sure you want to delete this area?")) return;
    window.store.areas.delete(id);
    this.renderAreasTable();
    this.populateDropdowns();
    this.render();
    showToast("Area deleted.", "info");
  },

  normalizeRole(role) {
    if (!role) return "Rep";
    const r = role.toLowerCase();
    if (r === "admin") return "Admin";
    if (r === "business_unit" || r === "bu") return "BU";
    if (r === "line_manager" || r === "lm") return "LM";
    if (r === "district_manager" || r === "dm") return "DM";
    if (r === "medical_rep" || r === "rep") return "Rep";
    if (r === "hr") return "HR";
    return role;
  },

  syncAuthUser(updatedUser) {
    if (typeof window.saveDataToStorage === "function") {
      window.saveDataToStorage();
    }
    const activeAuth = window.checkAuth ? window.checkAuth() : null;
    if (activeAuth && updatedUser && updatedUser.id === activeAuth.id) {
      sessionStorage.setItem("pharmaUser", JSON.stringify(updatedUser));
      localStorage.setItem("userRole", updatedUser.role);
    }
  },

  getRoleBadgeClass(role) {
    const map = {
      Admin: "bg-admin",
      BU: "bg-bu",
      LM: "bg-lm",
      DM: "bg-dm",
      Rep: "bg-rep",
      HR: "bg-hr",
    };
    return map[role] || "bg-secondary";
  },
  getManagerName(managerId) {
    if (!managerId)
      return `<span class="text-muted" data-i18n="none">None</span>`;
    const mgr = this.users.find((u) => u.id === managerId);
    return mgr
      ? mgr.name
      : `<span class="text-muted" data-i18n="none">None</span>`;
  },
  getManagerNameWithVacant(managerId) {
    if (!managerId) return `<span class="text-muted">None</span>`;
    const mgrRaw = window.store.users.getById(managerId);
    if (!mgrRaw) return `<span class="text-muted">None</span>`;
    if ((mgrRaw.status || "Active") === "Inactive") {
      return `<span class="badge bg-warning text-dark me-1">Vacant</span>
              <small class="text-muted">(Former: ${mgrRaw.name})</small>`;
    }
    return mgrRaw.name;
  },
  renderLinesSummary(user) {
    const userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    const matched = this.lines.filter((l) => userLineIds.includes(l.id));
    if (matched.length === 0) return `<span class="text-muted">-</span>`;
    if (matched.length === 1)
      return `<span class="badge bg-primary-subtle text-primary">${matched[0].name}</span>`;
    return `<span class="badge bg-purple-subtle text-purple fw-bold badge-multi-line">${matched.length} Lines (${matched.map((m) => m.name).join(", ")})</span>`;
  },

  render() {
    this.updateStats();
    this.renderTable();
    this.renderTree();
    if (window.applyTranslations) window.applyTranslations();
  },
  updateStats() {
    document.getElementById("totalCountBadge").textContent = this.users.length;
    document.getElementById("stat-total").textContent = this.users.length;
    document.getElementById("stat-admins").textContent = this.users.filter(
      (u) => u.role === "Admin",
    ).length;
    document.getElementById("stat-managers").textContent = this.users.filter(
      (u) => ["BU", "LM", "DM"].includes(u.role),
    ).length;
    document.getElementById("stat-reps").textContent = this.users.filter(
      (u) => u.role === "Rep",
    ).length;
  },
  getFilteredUsers() {
    const ROLE_ORDER = { Admin: 1, HR: 2, BU: 3, LM: 4, DM: 5, Rep: 6 };
    const query = document.getElementById("searchUser").value.toLowerCase();
    const role = document.getElementById("filterRole").value;
    return this.users
      .filter((u) => {
        const matchQuery =
          (u.name || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.employeeCode || u.code || "").toLowerCase().includes(query);
        const matchRole = role === "All" || u.role === role;
        return matchQuery && matchRole;
      })
      .sort((a, b) => {
        const orderA = ROLE_ORDER[a.role] ?? 99;
        const orderB = ROLE_ORDER[b.role] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
  },

  renderTable() {
    const tbody = document.getElementById("usersTableBody");
    const filtered = this.getFilteredUsers();
    tbody.innerHTML = filtered
      .map((u) => {
        const dispCode = u.employeeCode || u.code || "-";
        const dispEmail = u.email || "-";
        const dispStatus = u.status || "Active";
        return `
        <tr>
          <td class="ps-4">
            <div class="d-flex align-items-center">
              <div class="bg-primary-light text-primary rounded-circle d-flex justify-content-center align-items-center me-3 fw-bold user-avatar-circle" style="width:40px; height:40px;">
                ${u.name.charAt(0)}
              </div>
              <div>
                <div class="fw-bold user-name-text">${u.name}</div>
                <div class="text-muted small">${dispEmail}</div>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-dark border">${dispCode}</span></td>
          <td><span class="badge rounded-pill role-badge ${this.getRoleBadgeClass(u.role)}" data-i18n="role_${u.role.toLowerCase()}">${u.role}</span></td>
          <td>${this.getManagerNameWithVacant(u.managerId)}</td>
          <td>${this.renderLinesSummary(u)}</td>
          <td>${u.area || "-"}</td>
          <td><span class="badge bg-${dispStatus === "Active" ? "success" : "danger"}-subtle text-${dispStatus === "Active" ? "success" : "danger"} rounded-pill">${dispStatus}</span></td>
          <td class="text-end pe-4 user-actions-cell">
            <button class="btn btn-sm btn-light text-primary me-1" onclick="userMgmt.openEditModal('${u.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-light text-warning me-1" onclick="userMgmt.openResetPwdModal('${u.id}')"><i class="fas fa-key"></i></button>
            <button class="btn btn-sm btn-light text-${dispStatus === "Active" ? "danger" : "success"}" onclick="userMgmt.openDeactivateModal('${u.id}')"><i class="fas fa-${dispStatus === "Active" ? "ban" : "check"}"></i></button>
          </td>
        </tr>`;
      })
      .join("");
  },

  buildTree(parentId = null) {
    const children = this.users.filter((u) => u.managerId === parentId);
    if (children.length === 0) return "";
    return `<div class="tree-children">
      ${children
        .map((u) => {
          const isInactive = u.status === "Inactive";
          const roleBadge = `<span class="badge ${this.getRoleBadgeClass(u.role)} ms-1" style="font-size:0.65em">${u.role}</span>`;
          if (isInactive) {
            const areaName = u.vacantArea || u.area;
            const repAreaTag = areaName ? ` • Area: ${areaName}` : "";
            return `
            <div class="tree-node">
              <div class="node-content shadow-sm border border-dashed border-warning-subtle" style="background:#fffbeb; opacity:0.9;">
                <div class="bg-warning-subtle text-warning rounded-circle d-flex justify-content-center align-items-center fw-bold" style="width:30px; height:30px; font-size:12px;">⚠️</div>
                <div class="flex-grow-1">
                  <div class="fw-bold small mb-0 text-dark"><span class="badge bg-warning text-dark me-1">[Vacant / شاغر]</span>${u.role === "Rep" ? `Territory${repAreaTag}` : `${u.role} Branch`} ${roleBadge}</div>
                  <small class="text-muted" style="font-size:0.75rem;">(Position Open • Former: ${u.name})</small>
                </div>
              </div>
              ${this.buildTree(u.id)}
            </div>`;
          }
          return `
          <div class="tree-node">
            <div class="node-content shadow-sm">
              <div class="bg-primary-light text-primary rounded-circle d-flex justify-content-center align-items-center fw-bold" style="width:30px; height:30px; font-size:12px;">${u.name.charAt(0)}</div>
              <div class="flex-grow-1">
                <div class="fw-bold small mb-0 user-name-text">${u.name} ${roleBadge}</div>
                <small class="text-muted" style="font-size:0.75rem;">${u.code} ${u.area ? `• Area: ${u.area}` : ""}</small>
              </div>
            </div>
            ${this.buildTree(u.id)}
          </div>`;
        })
        .join("")}
    </div>`;
  },
  renderTree() {
    const container = document.getElementById("treeView");
    const managerIds = new Set(this.users.map((u) => u.id));
    const topLevelUsers = this.users.filter(
      (u) => !u.managerId || !managerIds.has(u.managerId),
    );
    let html = "";
    topLevelUsers.forEach((u) => {
      const isInactive = u.status === "Inactive";
      const roleBadge = `<span class="badge ${this.getRoleBadgeClass(u.role)} ms-1" style="font-size:0.65em">${u.role}</span>`;
      if (isInactive) {
        html += `
          <div class="tree-node ms-0 ps-0 border-0">
            <div class="node-content shadow-sm border border-dashed border-warning-subtle" style="background:#fffbeb; opacity:0.9;">
              <div class="bg-warning-subtle text-warning rounded-circle d-flex justify-content-center align-items-center fw-bold" style="width:30px; height:30px; font-size:12px;">⚠️</div>
              <div class="flex-grow-1">
                <div class="fw-bold small mb-0 user-name-text"><span class="badge bg-warning text-dark me-1">[Vacant / شاغر]</span>${u.role} Position ${roleBadge}</div>
                <small class="text-muted" style="font-size:0.75rem;">(Position Open • Former: ${u.name})</small>
              </div>
            </div>
            ${this.buildTree(u.id)}
          </div>`;
      } else {
        html += `
          <div class="tree-node ms-0 ps-0 border-0">
            <div class="node-content shadow-sm">
              <div class="bg-primary-light text-primary rounded-circle d-flex justify-content-center align-items-center fw-bold" style="width:30px; height:30px; font-size:12px;">${u.name.charAt(0)}</div>
              <div class="flex-grow-1">
                <div class="fw-bold small mb-0 user-name-text">${u.name} ${roleBadge}</div>
                <small class="text-muted" style="font-size:0.75rem;">${u.code}</small>
              </div>
            </div>
            ${this.buildTree(u.id)}
          </div>`;
      }
    });
    container.innerHTML = html;
  },

  toggleView(view) {
    document.getElementById("tableView").style.display =
      view === "table" ? "block" : "none";
    document.getElementById("treeView").style.display =
      view === "tree" ? "block" : "none";
  },

  updateManagerDropdown() {
    const role = document.getElementById("uRole").value;
    const managerSelect = document.getElementById("uManager");
    if (!managerSelect) return;

    if (role === "Admin") {
      document.getElementById("managerGroup").style.display = "none";
      return;
    }
    document.getElementById("managerGroup").style.display = "block";

    let targetManagerRole = "";
    if (role === "BU") targetManagerRole = "Admin";
    else if (role === "LM") targetManagerRole = "BU";
    else if (role === "DM") targetManagerRole = "LM";
    else if (role === "Rep") targetManagerRole = "DM";

    let possibleManagers = this.users.filter(
      (u) => u.role === targetManagerRole && u.status === "Active",
    );

    const selectedLineIds = Array.from(
      document.querySelectorAll(".user-line-cb:checked"),
    ).map((cb) => cb.value);

    if ((role === "DM" || role === "Rep") && selectedLineIds.length > 0) {
      possibleManagers = possibleManagers.filter((m) => {
        const mgrLines = m.lineIds || (m.lineId ? [m.lineId] : []);
        return mgrLines.some((id) => selectedLineIds.includes(id));
      });
    }

    const currentSelection = managerSelect.value;

    managerSelect.innerHTML = `<option value="" data-i18n="select_manager">Select Manager...</option>
      ${possibleManagers
        .map((m) => `<option value="${m.id}">${m.name} (${m.code})</option>`)
        .join("")}`;

    if (
      currentSelection &&
      possibleManagers.find((m) => m.id === currentSelection)
    ) {
      managerSelect.value = currentSelection;
    }

    if (window.applyTranslations) window.applyTranslations();
  },

  onRoleChange() {
    const role = document.getElementById("uRole").value;
    document.getElementById("areaGroup").style.display =
      role === "Rep" ? "block" : "none";
    document.getElementById("productLineGroup").style.display = [
      "LM",
      "DM",
      "Rep",
    ].includes(role)
      ? "block"
      : "none";

    this.updateManagerDropdown();
  },

  openAddModal() {
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    if (document.getElementById("userForm"))
      document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    const titleEl = document.getElementById("userModalTitle");
    if (titleEl) titleEl.setAttribute("data-i18n", "add_user");

    const pwdInput = document.getElementById("uPassword");
    if (pwdInput) {
      pwdInput.placeholder = "Required for new user";
      pwdInput.required = true;
    }
    if (document.getElementById("uAnnualLeave"))
      document.getElementById("uAnnualLeave").value = 21;
    if (document.getElementById("uCasualLeave"))
      document.getElementById("uCasualLeave").value = 6;
    if (document.getElementById("uSickLeave"))
      document.getElementById("uSickLeave").value = 7;

    this.onRoleChange();
    this.showModal("user");
  },

  openEditModal(id) {
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    const user = this.users.find((u) => u.id === id);
    if (!user) return;

    document.getElementById("userId").value = user.id;
    document.getElementById("uName").value = user.name || "";
    document.getElementById("uEmail").value = user.email || "";
    document.getElementById("uCode").value = user.code || "";
    if (document.getElementById("uPhone"))
      document.getElementById("uPhone").value = user.phone || "";

    document.getElementById("uRole").value = user.role || "Rep";

    const userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    document.querySelectorAll(".user-line-cb").forEach((cb) => {
      cb.checked = userLineIds.includes(cb.value);
    });

    this.onRoleChange();

    if (user.managerId && document.getElementById("uManager"))
      document.getElementById("uManager").value = user.managerId;
    if (user.area && document.getElementById("uArea"))
      document.getElementById("uArea").value = user.area;

    const lb = user.leaveBalance || { annual: 21, emergency: 6, sick: 7 };
    if (document.getElementById("uAnnualLeave"))
      document.getElementById("uAnnualLeave").value = lb.annual ?? 21;
    if (document.getElementById("uCasualLeave"))
      document.getElementById("uCasualLeave").value = lb.emergency ?? 6;
    if (document.getElementById("uSickLeave"))
      document.getElementById("uSickLeave").value = lb.sick ?? 7;

    const titleEl = document.getElementById("userModalTitle");
    if (titleEl) titleEl.setAttribute("data-i18n", "edit_user");
    const pwdInput = document.getElementById("uPassword");
    if (pwdInput) {
      pwdInput.placeholder = "Leave blank to keep current";
      pwdInput.required = false;
    }
    this.showModal("user");
  },

  async saveUser() {
    const id = document.getElementById("userId").value;
    const name = document.getElementById("uName").value.trim();
    const email = document.getElementById("uEmail").value.trim().toLowerCase();
    const code = document.getElementById("uCode").value.trim().toUpperCase();
    const role = document.getElementById("uRole").value;
    const managerId = document.getElementById("uManager")
      ? document.getElementById("uManager").value
      : null;

    if (!name || !email || !code || !role) {
      return showToast("Please fill in all required fields.", "warning");
    }

    const duplicateEmail = this.users.find(
      (u) => u.id !== id && u.email?.toLowerCase() === email,
    );
    if (duplicateEmail)
      return showToast(
        `Email already registered for ${duplicateEmail.name}.`,
        "warning",
      );
    const duplicateCode = this.users.find(
      (u) => u.id !== id && (u.code === code || u.employeeCode === code),
    );
    if (duplicateCode)
      return showToast(
        `Employee code already in use by ${duplicateCode.name}.`,
        "warning",
      );

    const selectedLineIds = Array.from(
      document.querySelectorAll(".user-line-cb:checked"),
    ).map((cb) => cb.value);

    const rawExistingUser = id ? window.store.users.getById(id) : null;
    const enteredPwd = document.getElementById("uPassword")
      ? document.getElementById("uPassword").value.trim()
      : "";

    let passwordHash = rawExistingUser ? rawExistingUser.passwordHash : null;
    if (enteredPwd) passwordHash = await hashPassword(enteredPwd);
    else if (!rawExistingUser) passwordHash = await hashPassword("123456");

    const storeRoleMap = {
      Admin: "admin",
      BU: "business_unit",
      LM: "line_manager",
      DM: "district_manager",
      Rep: "medical_rep",
      HR: "hr",
    };

    const selectedAreaName = document.getElementById("uArea")
      ? document.getElementById("uArea").value
      : null;
    const targetAreaObj = selectedAreaName
      ? this.areas.find((a) => a.name === selectedAreaName)
      : null;

    const userData = {
      id: id || "u" + Date.now(),
      name,
      email,
      code: code,
      employeeCode: code,
      role: storeRoleMap[role] || "medical_rep",
      passwordHash,
      phone: document.getElementById("uPhone")
        ? document.getElementById("uPhone").value.trim()
        : "",
      managerId: managerId || null,
      status: rawExistingUser ? rawExistingUser.status : "Active",
      lineIds: selectedLineIds,
      lineId: selectedLineIds[0] || null,
      leaveBalance: {
        annual:
          parseInt(document.getElementById("uAnnualLeave")?.value, 10) || 21,
        casual:
          parseInt(document.getElementById("uCasualLeave")?.value, 10) || 6,
        emergency:
          parseInt(document.getElementById("uCasualLeave")?.value, 10) || 6,
        sick: parseInt(document.getElementById("uSickLeave")?.value, 10) || 7,
        unpaid: rawExistingUser?.leaveBalance?.unpaid || 0,
        maternity: rawExistingUser?.leaveBalance?.maternity || 90,
      },
      area: role === "Rep" && targetAreaObj ? targetAreaObj.name : null,
      areaId: role === "Rep" && targetAreaObj ? targetAreaObj.id : null,
    };

    window.store.users.save(userData);

    // تحديث وتعيين المناطق بدقة (فك القديم وربط الجديد)
    if (role === "Rep") {
      // 1. فك المندوب من أي مناطق قديمة مسجل عليها
      const currentAssignedAreas = window.store.areas
        .getAll()
        .filter((a) => a.repId === userData.id);
      currentAssignedAreas.forEach((a) => {
        if (!targetAreaObj || a.id !== targetAreaObj.id) {
          window.store.areas.unassignRep(a.id);
        }
      });

      // 2. ربطه بالمنطقة الجديدة وتحديث الـ repId فيها
      if (targetAreaObj) {
        targetAreaObj.repId = userData.id;
        targetAreaObj.repName = userData.name;
        window.store.areas.save(targetAreaObj);
      }
    } else {
      // إذا لم يكن مندوباً، فك أي مناطق قديمة مرتبطة به
      const oldAreas = window.store.areas
        .getAll()
        .filter((a) => a.repId === userData.id);
      oldAreas.forEach((a) => {
        window.store.areas.unassignRep(a.id);
      });
    }

    // إعادة مزامنة حقول المستخدم بعد تحديث المناطق لضمان تطابق الـ areaId
    window.store.users.syncAreasFromStore();

    this.syncAuthUser(window.store.users.getById(userData.id));
    this.closeModal("user");
    this.render();
    showToast(
      id ? "User updated successfully" : "User added successfully",
      "success",
    );
  },

  openResetPwdModal(id) {
    this.selectedUserId = id;
    this.showModal("resetPwd");
  },
  confirmResetPassword() {
    if (!this.selectedUserId) return;
    this.closeModal("resetPwd");
    showToast("Password reset link has been sent to user email.", "info");
  },

  openDeactivateModal(id) {
    this.selectedUserId = id;
    const user = this.users.find((u) => u.id === id);
    if (!user) return;
    const isActivating = user.status !== "Active";

    if (document.getElementById("deactivateModalTitle")) {
      document.getElementById("deactivateModalTitle").textContent = isActivating
        ? "Activate User"
        : "Deactivate User";
      document.getElementById("deactivateModalTitle").className = isActivating
        ? "modal-title fw-bold text-success"
        : "modal-title fw-bold text-danger";
    }
    if (document.getElementById("deactivateModalBody")) {
      document.getElementById("deactivateModalBody").textContent = isActivating
        ? "Are you sure you want to reactivate this user account?"
        : "Are you sure you want to deactivate this user? They will no longer be able to log in.";
    }
    if (document.getElementById("deactivateConfirmBtn")) {
      document.getElementById("deactivateConfirmBtn").textContent = isActivating
        ? "Activate"
        : "Deactivate";
      document.getElementById("deactivateConfirmBtn").className = isActivating
        ? "btn btn-success px-4"
        : "btn btn-danger px-4";
    }
    this.showModal("deactivate");
  },

  confirmDeactivate() {
    if (!this.selectedUserId) return;
    const rawUser = window.store.users.getById(this.selectedUserId);
    if (rawUser) {
      const willBeInactive = rawUser.status === "Active";
      rawUser.status = willBeInactive ? "Inactive" : "Active";

      if (willBeInactive) {
        const assignedAreas = this.areas.filter(
          (a) => a.repId === rawUser.id || a.name === rawUser.area,
        );
        assignedAreas.forEach((assignedArea) => {
          rawUser.vacantArea = assignedArea.name;
          window.store.areas.unassignRep(assignedArea.id);
        });
        rawUser.area = null;
        rawUser.areaId = null;
        rawUser.areaIds = [];

        this.lines.forEach((l) => {
          if (l.lineManagerId === rawUser.id) {
            l.lineManagerId = null;
            window.store.productLines.save(l);
          }
        });

        const allSystemUsers = window.DEMO_DATA.users || [];
        let hasSubordinateUpdates = false;

        allSystemUsers.forEach((u) => {
          if (u.managerId === rawUser.id) {
            u.managerId = rawUser.managerId || null;
            hasSubordinateUpdates = true;
          }
        });

        if (
          hasSubordinateUpdates &&
          typeof window.saveDataToStorage === "function"
        ) {
          window.saveDataToStorage();
          document.dispatchEvent(
            new CustomEvent("pharma:store:changed", {
              detail: { entity: "users", action: "bulkUpdate", payload: null },
            }),
          );
        }
      }

      window.store.users.save(rawUser);

      this.render();
      const msg = willBeInactive
        ? "User deactivated. Territory preserved as Vacant and subordinates successfully transferred to upper manager."
        : `User is now Active.`;
      showToast(msg, "info");
    }
    this.closeModal("deactivate");
  },
};

window.userMgmt = userMgmt;

document.addEventListener("DOMContentLoaded", () => {
  userMgmt.init();
});
