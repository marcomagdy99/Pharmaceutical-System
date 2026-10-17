/**
 * @file users.js
 * @description User Management Module refactored to strictly rely on the Central Store.
 * Responsibility for assigning/unassigning areas is now solely delegated to areas.html
 * to fully support multiple areas per representative without data loss.
 */

const userTranslations = {
  en: {
    menu_users: "Users",
    switch_lang: "English",
    logout: "Logout",
    user_management: "User Management",
    total_users_badge: "total users",
    sync_cloud_now: "Sync Cloud",
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
    role_pm: "Product Manager",
    assigned_products: "Managed Products",
    all_line_products: "All Line Products",
    pm_products_hint: "Select which products this PM manages in the assigned line.",
    view_table: "Table",
    view_tree: "Hierarchy",
    col_user: "User",
    col_code: "Code",
    col_role: "Role",
    col_manager: "Manager",
    col_area: "Area(s)",
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
    hire_date: "Hire Date",
    manager: "Assign Manager",
    select_manager: "Select Manager...",
    area: "Assigned Area(s)",
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
    close: "Close",
    leaveAllocationTitle: "Leave Balance Allocation (Days)",
    leaveAllocationSub: "Set initial annual, casual, and sick days",
    annualDaysLabel: "Annual (Days)",
    casualDaysLabel: "Casual (Days)",
    sickDaysLabel: "Sick (Days)",
    login_as: "Log in as (Preview)",
  },
};

const userMgmt = {
  get users() {
    if (!window.store || !window.store.users) return [];
    return window.store.users.getAll().map((u) => {
      const code = u.employeeCode || u.code || u.id;
      const email = u.email || (u.id ? `${u.id.toLowerCase()}@pharmacare.com` : "");
      const phone = u.phone || "+201001234567";
      const status = u.status || "Active";
      return {
        ...u,
        code,
        employeeCode: code,
        email,
        phone,
        status,
        role: this.normalizeRole(u.role),
      };
    });
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

  init() {
    const user = (window.checkAuth && window.checkAuth()) || {};
    if (
      window.hasAnyRole &&
      !window.hasAnyRole(["admin", "hr"], user)
    ) {
      if (typeof showToast === "function") {
        showToast(
          "Access Denied: Admins & HR only.",
          "error"
        );
      }
      window.location.replace("index.html");
      return;
    }
    if (window.translations) {
      window.translations.en = {
        ...(window.translations.en || {}),
        ...userTranslations.en,
      };
    } else {
      window.translations = userTranslations;
    }
if (typeof renderSidebar === "function") {
      renderSidebar("users");
    }

    this.loadDemoData();
    this.initLines();
    this.populateDropdowns();
    try { localStorage.removeItem("pharma_custom_titles"); localStorage.removeItem("pharma_hierarchy_levels"); } catch (e) {}

    const searchInput = document.getElementById("searchUser");
    if (searchInput) searchInput.addEventListener("input", () => this.render());

    const filterRole = document.getElementById("filterRole");
    if (filterRole) filterRole.addEventListener("change", () => this.render());

    document.addEventListener("languageChanged", (e) => {
      const lang = e.detail?.lang || e.detail;
      const lbl = document.getElementById("langLabel");
      if (lbl) lbl.textContent = "English";
      this.render();
    });

    document.addEventListener("pharma:storage:synced", () => {
      this.render();
    });

    this.render();
  },

  _modalInstances: {},
  _getModalInstance(id) {
    if (this._modalInstances[id]) return this._modalInstances[id];
    const el = document.getElementById(id);
    if (!el) return null;

    let instance = null;
    if (window.bootstrap && window.bootstrap.Modal) {
      instance = typeof bootstrap.Modal.getOrCreateInstance === "function"
        ? bootstrap.Modal.getOrCreateInstance(el)
        : (bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el));
    }
    if (instance) this._modalInstances[id] = instance;

    if (id === "linesModal") {
      el.addEventListener("hidden.bs.modal", () => {
        if (this.returnToUserModal || this.returnToUserModalFromSub) {
          this.returnToUserModal = false;
          this.returnToUserModalFromSub = false;
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
      userTerritories: "userTerritoriesModal",
    };
    const id = idMap[type];
    if (!id) return;
    if (type === "lines") {
      const userModalEl = document.getElementById("userModal");
      if (userModalEl && userModalEl.classList.contains("show")) {
        this.returnToUserModal = true;
        this.returnToUserModalFromSub = true;
        this._getModalInstance("userModal")?.hide();
      }
    }
    const instance = this._getModalInstance(id);
    if (instance) instance.show();
  },

  closeModal(type) {
    if (type === "user" && this.pendingUnassignedAreaIds) {
      this.pendingUnassignedAreaIds.clear();
    }
    const idMap = {
      user: "userModal",
      resetPwd: "resetPwdModal",
      deactivate: "deactivateModal",
      lines: "linesModal",
      userTerritories: "userTerritoriesModal",
    };
    const id = idMap[type];
    if (!id) return;
    const el = document.getElementById(id);
    const instance = this._getModalInstance(id);
    if (instance) {
      instance.hide();
    } else if (el && window.bootstrap && window.bootstrap.Modal) {
      const bsInst = typeof bootstrap.Modal.getInstance === "function" ? bootstrap.Modal.getInstance(el) : null;
      if (bsInst) bsInst.hide();
    }
  },

  initLines() {
    if (!window.store) return;
    if (this.lines.length === 0) {
      window.store.productLines.save({
        id: "line_1790626000001",
        name: "Cardio Line",
        desc: "Cardiology & Hypertension",
        status: "Active",
      });
      window.store.productLines.save({
        id: "line_1790626000002",
        name: "Neuro Line",
        desc: "Neurology & CNS",
        status: "Active",
      });
      window.store.productLines.save({
        id: "line_1790626000003",
        name: "Derma Line",
        desc: "Dermatology & Skin Care",
        status: "Active",
      });
    }
    this.populateDropdowns();
  },

  loadDemoData() {
    if (!window.store) return;
    if (this.users.length === 0) {
      const defaultUsers = [
        {
          id: "u1790626000010",
          name: "System Admin",
          email: "admin@pharmacare.com",
          code: "ADM-001",
          employeeCode: "ADM-001",
          role: "admin",
          status: "Active",
          managerId: null,
        },
        {
          id: "u1790626000011",
          name: "George Marzok",
          email: "bu@pharmacare.com",
          code: "BU-001",
          employeeCode: "BU-001",
          role: "business_unit",
          status: "Active",
          managerId: "u1790626000010",
          lineId: "line_1790626000001",
          lineIds: ["line_1790626000001", "line_1790626000002"],
        },
        {
          id: "u1790626000012",
          name: "John Mahfouz",
          email: "lm@pharmacare.com",
          code: "LM-001",
          employeeCode: "LM-001",
          role: "line_manager",
          status: "Active",
          managerId: "u1790626000011",
          lineIds: ["line_1790626000001", "line_1790626000002"],
        },
        {
          id: "u1790626000014",
          name: "Amir Ayoup",
          email: "dm@pharmacare.com",
          code: "DM-001",
          employeeCode: "DM-001",
          role: "district_manager",
          status: "Active",
          managerId: "u1790626000012",
          lineIds: ["line_1790626000001"],
        },
        {
          id: "u1790626000001",
          name: "Marco Magdy",
          email: "rep1@pharmacare.com",
          code: "REP-001",
          employeeCode: "REP-001",
          role: "medical_rep",
          status: "Active",
          managerId: "u1790626000014",
          lineIds: ["line_1790626000001"],
        },
        {
          id: "u1790626000002",
          name: "Kerolos Boules",
          email: "rep2@pharmacare.com",
          code: "REP-002",
          employeeCode: "REP-002",
          role: "medical_rep",
          status: "Active",
          managerId: "u1790626000014",
          lineIds: ["line_1790626000001"],
        },
        {
          id: "u1790626000017",
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
    this.populateRoleDropdowns();
    const linesContainer = document.getElementById("uProductLinesContainer");
    if (linesContainer) {
      linesContainer.replaceChildren();
      const activeLines = this.lines.filter((l) => (l.status || "Active") === "Active");
      if (activeLines.length === 0) {
        linesContainer.innerHTML = `<span class="text-muted small">No active sales lines</span>`;
      } else {
        activeLines.forEach((l) => {
          const lbl = document.createElement("label");
          lbl.className = "d-flex align-items-center gap-2 mb-1 cursor-pointer";
          lbl.innerHTML = `<input type="checkbox" class="user-line-cb form-check-input" value="${window.escapeHtml(l.id)}">
                         <span class="small fw-semibold user-line-label">${window.escapeHtml(l.name)}</span>`;
          linesContainer.appendChild(lbl);
        });
      }

      document.querySelectorAll(".user-line-cb").forEach((cb) => {
        cb.addEventListener("change", () => {
          this.updateManagerDropdown();
          this.updateAreaDropdown();
          if (document.getElementById("uRole")?.value === "PM") {
            this.renderPmProducts();
          }
        });
      });
    }

    this.updateAreaDropdown();
  },


  populateRoleDropdowns() {},

  updateAreaDropdown(preselectedAreaId) {
    const areaSelect = document.getElementById("uArea");
    if (!areaSelect) return;
    const curVal = preselectedAreaId !== undefined ? preselectedAreaId : areaSelect.value;

    const selectedLineIds = Array.from(
      document.querySelectorAll(".user-line-cb:checked"),
    ).map((cb) => cb.value);

    if (selectedLineIds.length === 0) {
      areaSelect.innerHTML = `<option value="">Select sales line(s) first...</option>`;
      areaSelect.value = "";
      return;
    }

    const allAreas = this.areas || [];
    const filteredAreas = allAreas.filter(
      (a) => !a.lineId || selectedLineIds.includes(a.lineId),
    );

    if (filteredAreas.length === 0) {
      areaSelect.innerHTML = `<option value="">No areas found for selected line(s)</option>`;
      areaSelect.value = "";
      return;
    }

    let html = `<option value="" data-i18n="select_area">Select Area...</option>`;

    selectedLineIds.forEach((lineId) => {
      const lineObj = (this.lines || []).find((l) => l.id === lineId);
      const lineName = lineObj
        ? (lineObj.name || lineObj.nameAr)
        : lineId;
      const areasInLine = filteredAreas.filter((a) => a.lineId === lineId);

      if (areasInLine.length > 0) {
        html += `<optgroup label="📦 ${window.escapeHtml(lineName)}">`;
        areasInLine.forEach((a) => {
          const rep = a.repId ? (this.users || []).find((u) => u.id === a.repId) : null;
          const repNote = rep
            ? ` (Assigned: ${window.escapeHtml(rep.name)})` : ` (Unassigned)`;
          const areaDisplayName = a.name || a.nameAr;
          html += `<option value="${window.escapeHtml(a.id)}">${window.escapeHtml(areaDisplayName)} (${window.escapeHtml(a.code || "")}) - [${window.escapeHtml(lineName)}]${repNote}</option>`;
        });
        html += `</optgroup>`;
      }
    });

    const orphanAreas = filteredAreas.filter((a) => !a.lineId);
    if (orphanAreas.length > 0) {
      html += `<optgroup label="📦 Other Areas">`;
      orphanAreas.forEach((a) => {
        const rep = a.repId ? (this.users || []).find((u) => u.id === a.repId) : null;
        const repNote = rep
          ? ` (Assigned: ${window.escapeHtml(rep.name)})` : ` (Unassigned)`;
        const areaDisplayName = a.name || a.nameAr;
        html += `<option value="${window.escapeHtml(a.id)}">${window.escapeHtml(areaDisplayName)} (${window.escapeHtml(a.code || "")})${repNote}</option>`;
      });
      html += `</optgroup>`;
    }

    areaSelect.innerHTML = html;

    if (curVal && filteredAreas.some((a) => a.id === curVal)) {
      areaSelect.value = curVal;
    } else {
      areaSelect.value = "";
    }
  },

  renderAssignedAreasDisplay(userId) {
    const areaDisplayEl = document.getElementById("uAssignedAreasDisplay");
    if (!areaDisplayEl) return;

    if (!userId) {
      areaDisplayEl.innerHTML = `<span class="text-muted small">Select area above or assign via Areas page</span>`;
      return;
    }

    let repAreas = window.store && window.store.areas ? window.store.areas.getByRep(userId) : [];
    if (this.pendingUnassignedAreaIds && this.pendingUnassignedAreaIds.size > 0) {
      repAreas = repAreas.filter((a) => !this.pendingUnassignedAreaIds.has(a.id));
    }

    if (repAreas.length > 0) {
      areaDisplayEl.innerHTML = repAreas
        .map((a) => {
          const areaName = a.name || a.nameAr;
          const lineObj = (this.lines || []).find((l) => l.id === a.lineId);
          const lineBadge = lineObj ? ` [${window.escapeHtml(lineObj.name || lineObj.nameAr)}]` : "";
          return `<span class="badge bg-primary text-white me-1 mb-1 p-2 d-inline-flex align-items-center gap-1 shadow-sm" style="font-size: 0.82rem;">
            <span>${window.escapeHtml(areaName)} (${window.escapeHtml(a.code || "")})${lineBadge}</span>
            <button type="button" class="btn-close btn-close-white" style="font-size: 0.6rem; padding: 2px; margin-inline-start: 4px; opacity: 0.85;" onclick="userMgmt.unassignArea('${window.escapeHtml(a.id)}', '${window.escapeHtml(userId)}')" title="Unassign this area" aria-label="Remove"></button>
          </span>`;
        })
        .join("") +
        `<div class="mt-2"><a href="areas.html" class="btn btn-sm btn-outline-primary py-0" style="font-size:0.75rem;">Manage in Areas Page →</a></div>`;
    } else {
      areaDisplayEl.innerHTML = `<span class="badge bg-secondary-subtle text-secondary me-2">No areas assigned</span><a href="areas.html" class="btn btn-sm btn-outline-primary py-0" style="font-size:0.75rem;">Assign Areas →</a>`;
    }
  },

  unassignArea(areaId, userId) {
    if (!areaId) return;
    if (!this.pendingUnassignedAreaIds) {
      this.pendingUnassignedAreaIds = new Set();
    }
    this.pendingUnassignedAreaIds.add(areaId);

    this.renderAssignedAreasDisplay(userId);

    const selectEl = document.getElementById("uArea");
    const curVal = selectEl ? selectEl.value : "";
    this.updateAreaDropdown(curVal === areaId ? "" : curVal);
  },

  // Section: Lines Modal Operations
  // ==========================================
  openLinesModal() {
    window.location.href = "products.html";
  },

  openAreasModal() {
    window.location.href = "areas.html";
  },

  normalizeRole(role) {
    if (!role) return "Rep";
    const r = role.toLowerCase();
    if (r === "admin") return "Admin";
    if (r === "business_unit" || r === "bu") return "BU";
    if (r === "line_manager" || r === "lm") return "LM";
    if (r === "district_manager" || r === "dm") return "DM";
    if (r === "medical_rep" || r === "rep") return "Rep";
    if (r === "product_manager" || r === "pm") return "PM";
    if (r === "hr") return "HR";
    return role;
  },

  getRoleCodePrefix(role) {
    const norm = this.normalizeRole(role);
    const prefixes = {
      Rep: "REP-",
      DM: "DM-",
      LM: "LM-",
      PM: "PM-",
      BU: "BU-",
      HR: "HR-",
      Admin: "ADM-",
    };
    return prefixes[norm] || "EMP-";
  },

  getNextEmployeeCode(role) {
    const norm = this.normalizeRole(role);
    const prefix = this.getRoleCodePrefix(role);
    const allUsers =
      this.users ||
      (window.store && window.store.users
        ? window.store.users.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.users) || []);

    let maxNum = 0;
    // For rep, match both REP- and legacy EMP- numbers so sequences don't collide
    const regex =
      norm === "Rep"
        ? /^(?:REP|EMP)-(\d+)/i
        : new RegExp(`^${prefix}(\\d+)`, "i");

    allUsers.forEach((u) => {
      const c = String(u.employeeCode || u.code || "").trim();
      const match = c.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
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
      PM: "bg-pm",
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
    let userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    if ((!userLineIds || userLineIds.length === 0) && typeof window.getUserLines === "function") {
      const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
      if (role !== "admin" && role !== "hr") {
        const derived = window.getUserLines(user.id);
        if (derived && derived.length > 0) {
          userLineIds = derived.map((l) => l.id);
        }
      }
    }
    const matched = this.lines.filter((l) => userLineIds.includes(l.id));
    if (matched.length === 0) return `<span class="text-muted">-</span>`;
    if (matched.length === 1)
      return `<span class="badge bg-primary-subtle text-primary">${matched[0].name}</span>`;
    return `<span class="badge bg-purple-subtle text-purple fw-bold badge-multi-line">${matched.length} Lines (${matched.map((m) => m.name).join(", ")})</span>`;
  },
  currentTerritoriesModalData: null,
  activeTerritoriesLineFilter: "all",

  getUserAssignedAreas(user) {
    if (!user) return [];
    const norm = (this.normalizeRole ? this.normalizeRole(user.role) : (user.role || "")).toUpperCase();
    const allUsers = this.users || (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];

    // 1. Rep: Direct assigned areas
    if (norm === "REP") {
      return allAreas.filter((a) => a.repId === user.id);
    }

    // 2. DM: Reps under DM
    if (norm === "DM") {
      const repIds = new Set(allUsers.filter((u) => u.managerId === user.id).map((u) => u.id));
      const res = [];
      const seenAreaIds = new Set();
      allAreas.forEach((a) => {
        if ((repIds.has(a.repId) || a.repId === user.id) && !seenAreaIds.has(a.id)) {
          seenAreaIds.add(a.id);
          res.push(a);
        }
      });
      return res;
    }

    // 3. LM: DMs under LM, Reps under those DMs or directly under LM
    if (norm === "LM") {
      const dmIds = new Set(allUsers.filter((u) => u.managerId === user.id).map((u) => u.id));
      const repIds = new Set(allUsers.filter((u) => dmIds.has(u.managerId) || u.managerId === user.id).map((u) => u.id));
      const res = [];
      const seenAreaIds = new Set();
      allAreas.forEach((a) => {
        if ((repIds.has(a.repId) || dmIds.has(a.repId) || a.repId === user.id) && !seenAreaIds.has(a.id)) {
          seenAreaIds.add(a.id);
          res.push(a);
        }
      });
      return res;
    }

    // 4. BU: All hierarchy under BU, or product lines
    if (norm === "BU") {
      const lmIds = new Set(allUsers.filter((u) => u.managerId === user.id).map((u) => u.id));
      const dmIds = new Set(allUsers.filter((u) => lmIds.has(u.managerId) || u.managerId === user.id).map((u) => u.id));
      const repIds = new Set(allUsers.filter((u) => dmIds.has(u.managerId) || lmIds.has(u.managerId) || u.managerId === user.id).map((u) => u.id));
      const res = [];
      const seenAreaIds = new Set();
      allAreas.forEach((a) => {
        if ((repIds.has(a.repId) || dmIds.has(a.repId) || lmIds.has(a.repId) || a.repId === user.id) && !seenAreaIds.has(a.id)) {
          seenAreaIds.add(a.id);
          res.push(a);
        }
      });
      if (res.length === 0) {
        let userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
        if (userLineIds.length > 0) {
          allAreas.forEach((a) => {
            if (userLineIds.includes(a.lineId) && !seenAreaIds.has(a.id)) {
              seenAreaIds.add(a.id);
              res.push(a);
            }
          });
        }
      }
      return res;
    }

    // 5. PM: Areas belonging to assigned lines
    if (norm === "PM") {
      let userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
      if (userLineIds.length > 0) {
        return allAreas.filter((a) => userLineIds.includes(a.lineId));
      }
    }

    return [];
  },

  formatAreasBadges(areas, badgeClass = "badge-neutral border", user = null) {
    if (!areas || areas.length === 0) return `<span class="text-muted">-</span>`;

    const userId = user ? user.id : "";
    const openModalAttr = userId
      ? `onclick="event.stopPropagation(); userMgmt.openUserTerritoriesModal('${userId}');"`
      : "";

    if (areas.length <= 2) {
      return areas
        .map(
          (a) =>
            `<span class="badge ${badgeClass} me-1" style="cursor: pointer;" title="Click to view all assigned territories" ${openModalAttr}>${window.escapeHtml(a.name)}</span>`,
        )
        .join("");
    }

    const firstOne = areas[0];
    const remainingCount = areas.length - 1;
    const moreText = `+${remainingCount} more`;

    return `
      <span class="badge ${badgeClass} me-1" style="cursor: pointer;" title="Click to view all assigned territories" ${openModalAttr}>${window.escapeHtml(firstOne.name)}</span>
      <button type="button" class="badge badge-more-areas" title="Click to view and filter all ${areas.length} assigned territories" ${openModalAttr}>📍 ${moreText}</button>
    `;
  },

  renderAreasSummary(user) {
    const norm = (this.normalizeRole ? this.normalizeRole(user.role) : (user.role || "")).toUpperCase();
    if (norm === "ADMIN" || norm === "HR") {
      return `<span class="badge bg-secondary-subtle text-secondary border">Global Access</span>`;
    }

    const assignedAreas = this.getUserAssignedAreas(user);
    let badgeClass = "badge-neutral border";
    if (norm === "DM") badgeClass = "bg-primary-subtle text-primary border";
    else if (norm === "LM") badgeClass = "bg-info-subtle text-info-emphasis border";
    else if (norm === "BU") badgeClass = "bg-warning-subtle text-warning-emphasis border";
    else if (norm === "PM") badgeClass = "bg-purple-subtle text-purple border";

    return this.formatAreasBadges(assignedAreas, badgeClass, user);
  },

  openUserTerritoriesModal(userId) {
    const user = (this.users || []).find((u) => u.id === userId) || (window.store && window.store.users ? window.store.users.getById(userId) : null);
    if (!user) return;

    const allLines = this.lines || (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    const allUsers = this.users || (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];

    // Get all assigned areas dynamically
    const areas = this.getUserAssignedAreas(user);

    // Map each area to enrich with lineName and repName
    const enrichedAreas = areas.map((a) => {
      const lineObj = allLines.find((l) => l.id === a.lineId);
      const repObj = allUsers.find((u) => u.id === a.repId);
      return {
        id: a.id,
        name: a.name || a.nameAr || "Unnamed Area",
        code: a.code || "-",
        lineId: a.lineId || null,
        lineName: lineObj ? (lineObj.name || lineObj.nameAr) : "General Line",
        repId: a.repId || null,
        repName: repObj ? repObj.name : "Unassigned",
      };
    });

    this.currentTerritoriesModalData = {
      user: user,
      areas: enrichedAreas,
    };
    this.activeTerritoriesLineFilter = "all";

    // Set Header
    const nameEl = document.getElementById("territoriesModalUserName");
    const roleEl = document.getElementById("territoriesModalUserRole");
    const countEl = document.getElementById("territoriesModalCountBadge");
    const searchInput = document.getElementById("territoriesModalSearch");

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) {
      const roleStr = user.role || "User";
      roleEl.innerHTML = `<span class="badge rounded-pill ${this.getRoleBadgeClass(roleStr)} me-1">${roleStr}</span> • Code: <strong>${user.employeeCode || user.code || "-"}</strong>`;
    }
    if (countEl) countEl.textContent = `${enrichedAreas.length} Areas`;
    if (searchInput) searchInput.value = "";

    // Render Line Filters
    this.renderTerritoriesLineFilters();

    // Render Territories Grid
    this.filterTerritoriesModal();

    // Show Modal
    this.showModal("userTerritories");
  },

  renderTerritoriesLineFilters() {
    const container = document.getElementById("territoriesModalLineFilters");
    if (!container) return;

    const data = this.currentTerritoriesModalData;
    if (!data || !data.areas || data.areas.length === 0) {
      container.innerHTML = "";
      return;
    }

    // Extract unique lines present in this user's areas
    const lineMap = new Map();
    data.areas.forEach((a) => {
      const key = a.lineId || "unassigned_line";
      if (!lineMap.has(key)) {
        lineMap.set(key, { lineId: a.lineId, lineName: a.lineName, count: 0 });
      }
      lineMap.get(key).count++;
    });

    // If only 1 line or 0 lines, show subtle indicator without filter tabs
    if (lineMap.size <= 1) {
      const singleLineName = data.areas[0] ? data.areas[0].lineName : "General";
      container.innerHTML = `<span class="badge bg-secondary-subtle text-secondary border px-2 py-1"><i class="fas fa-layer-group me-1"></i> Line: <strong>${window.escapeHtml(singleLineName)}</strong></span>`;
      return;
    }

    // Multiple lines: Render Filter Pills!
    let pillsHtml = `
      <button type="button" class="line-filter-pill ${this.activeTerritoriesLineFilter === "all" ? "active" : ""}" onclick="userMgmt.setTerritoriesLineFilter('all')">
        All Lines (${data.areas.length})
      </button>
    `;

    lineMap.forEach((info) => {
      const key = info.lineId || "unassigned_line";
      const isActive = this.activeTerritoriesLineFilter === key;
      pillsHtml += `
        <button type="button" class="line-filter-pill ${isActive ? "active" : ""}" onclick="userMgmt.setTerritoriesLineFilter('${key}')">
          💊 ${window.escapeHtml(info.lineName)} (${info.count})
        </button>
      `;
    });

    container.innerHTML = pillsHtml;
  },

  setTerritoriesLineFilter(lineKey) {
    this.activeTerritoriesLineFilter = lineKey;
    this.renderTerritoriesLineFilters();
    this.filterTerritoriesModal();
  },

  filterTerritoriesModal() {
    const gridEl = document.getElementById("territoriesModalGrid");
    const countEl = document.getElementById("territoriesModalCountBadge");
    if (!gridEl) return;

    const data = this.currentTerritoriesModalData;
    if (!data || !data.areas || data.areas.length === 0) {
      gridEl.innerHTML = `<div class="text-center py-4 text-muted fst-italic">No territories assigned to this user.</div>`;
      if (countEl) countEl.textContent = "0 Areas";
      return;
    }

    const searchInput = document.getElementById("territoriesModalSearch");
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const activeLine = this.activeTerritoriesLineFilter;

    // Filter by Line
    let filtered = data.areas.filter((a) => {
      if (activeLine === "all") return true;
      const key = a.lineId || "unassigned_line";
      return key === activeLine;
    });

    // Filter by Search Query
    if (query) {
      filtered = filtered.filter((a) => {
        return (
          a.name.toLowerCase().includes(query) ||
          a.code.toLowerCase().includes(query) ||
          a.lineName.toLowerCase().includes(query) ||
          a.repName.toLowerCase().includes(query)
        );
      });
    }

    if (countEl) {
      countEl.textContent = `${filtered.length} of ${data.areas.length} Areas`;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-search-location fa-2x mb-2 text-secondary"></i>
          <div>No matching areas found for your search.</div>
        </div>
      `;
      return;
    }

    // Render territory cards
    gridEl.innerHTML = filtered
      .map((a) => {
        const isAssigned = a.repName !== "Unassigned";
        const repBadge = isAssigned
          ? `<span class="badge bg-light text-dark border"><i class="fas fa-user-tie text-primary me-1"></i>${window.escapeHtml(a.repName)}</span>`
          : `<span class="badge bg-warning-subtle text-warning border"><i class="fas fa-exclamation-triangle me-1"></i>Unassigned</span>`;

        return `
          <div class="territory-item-card">
            <div class="territory-item-name">
              <span>${window.escapeHtml(a.name)}</span>
              <span class="territory-item-code">${window.escapeHtml(a.code)}</span>
            </div>
            <div class="territory-item-line">
              <span class="badge bg-primary-subtle text-primary border-0">
                <i class="fas fa-pills me-1"></i>${window.escapeHtml(a.lineName)}
              </span>
            </div>
            <div class="territory-item-rep mt-1">
              ${repBadge}
            </div>
          </div>
        `;
      })
      .join("");
  },

  copyTerritoriesList() {
    const data = this.currentTerritoriesModalData;
    if (!data || !data.areas || data.areas.length === 0) return;

    const searchInput = document.getElementById("territoriesModalSearch");
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const activeLine = this.activeTerritoriesLineFilter;

    let targetAreas = data.areas.filter((a) => {
      if (activeLine === "all") return true;
      const key = a.lineId || "unassigned_line";
      return key === activeLine;
    });

    if (query) {
      targetAreas = targetAreas.filter((a) => {
        return (
          a.name.toLowerCase().includes(query) ||
          a.code.toLowerCase().includes(query) ||
          a.lineName.toLowerCase().includes(query) ||
          a.repName.toLowerCase().includes(query)
        );
      });
    }

    const lines = targetAreas.map((a) => `${a.name} (${a.code}) - ${a.lineName} [${a.repName}]`);
    const textToCopy = lines.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (typeof showToast === "function") {
          showToast(`Copied ${targetAreas.length} territories to clipboard!`, "success");
        }
      }).catch(() => {
        if (typeof showToast === "function") {
          showToast(`Areas list: ${targetAreas.map((a) => a.name).join(", ")}`, "info");
        }
      });
    } else {
      if (typeof showToast === "function") {
        showToast(`Areas: ${targetAreas.map((a) => a.name).join(", ")}`, "info");
      }
    }
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
      (u) => window.isAdmin ? window.isAdmin(u) : u.role === "Admin",
    ).length;
    document.getElementById("stat-managers").textContent = this.users.filter(
      (u) => window.isBURole && window.isLMRole && window.isDMRole
        ? (window.isBURole(u) || window.isLMRole(u) || window.isDMRole(u))
        : ["BU", "LM", "DM"].includes(u.role),
    ).length;
    document.getElementById("stat-reps").textContent = this.users.filter(
      (u) => window.isRepRole ? window.isRepRole(u) : u.role === "Rep",
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
        const matchRole = role === "All" || u.role === role || u.titleId === role || u.titleCode === role || u.title === role;
        return matchQuery && matchRole;
      })
      .sort((a, b) => {
        const levelA = a.level != null ? a.level : (ROLE_ORDER[a.role] ? (6 - ROLE_ORDER[a.role]) : 1);
        const levelB = b.level != null ? b.level : (ROLE_ORDER[b.role] ? (6 - ROLE_ORDER[b.role]) : 1);
        if (levelA !== levelB) return levelB - levelA;
        return (a.name || "").localeCompare(b.name || "");
      });
  },

  renderTable() {
    const tbody = document.getElementById("usersTableBody");
    const filtered = this.getFilteredUsers();
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const normRole = (window.normalizeRole ? window.normalizeRole(authUser.role) : (authUser.role || "")).toLowerCase();
    const isRealAdmin = normRole === "admin" || (authUser.role || "").toLowerCase() === "admin" || Boolean(sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin"));

    tbody.innerHTML = filtered
      .map((u) => {
        const dispCode = u.employeeCode || u.code || "-";
        const dispEmail = u.email || "-";
        const dispStatus = u.status || "Active";
        const canImpersonate = isRealAdmin && String(u.id) !== String(authUser.id) && dispStatus === "Active";
        const loginAsTooltip = `Log in as ${u.name}`;

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
          <td><span class="badge badge-neutral border">${dispCode}</span></td>
          <td>
            <span class="badge rounded-pill role-badge ${this.getRoleBadgeClass(u.role)}">${window.escapeHtml(u.role)}</span>
          </td>
          <td>${this.getManagerNameWithVacant(u.managerId)}</td>
          <td>${this.renderLinesSummary(u)}</td>
          <td>${this.renderAreasSummary(u)}</td>
          <td><span class="text-muted small text-nowrap">📅 ${u.hireDate || "-"}</span></td>
          <td><span class="badge bg-${dispStatus === "Active" ? "success" : "danger"}-subtle text-${dispStatus === "Active" ? "success" : "danger"} rounded-pill">${dispStatus}</span></td>
          <td class="text-end pe-4 user-actions-cell">
            ${canImpersonate ? `<button class="btn btn-sm btn-user-impersonate me-1" title="${loginAsTooltip}" onclick="userMgmt.impersonateUser('${u.id}')"><i class="fas fa-sign-in-alt"></i></button>` : ""}
            <button class="btn btn-sm btn-light text-primary me-1" onclick="userMgmt.openEditModal('${u.id}')"><i class="fas fa-edit"></i></button>
            ${isRealAdmin ? `<button class="btn btn-sm btn-light text-warning me-1" title="Reset Password" onclick="userMgmt.openResetPwdModal('${u.id}')"><i class="fas fa-key"></i></button>` : ""}
            <button class="btn btn-sm btn-light text-${dispStatus === "Active" ? "danger" : "success"}" onclick="userMgmt.openDeactivateModal('${u.id}')"><i class="fas fa-${dispStatus === "Active" ? "ban" : "check"}"></i></button>
          </td>
        </tr>`;
      })
      .join("");
  },

  buildTree(parentId = null, visited = new Set()) {
    if (!parentId || visited.has(parentId)) return "";
    const nextVisited = new Set(visited);
    nextVisited.add(parentId);

    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const isRealAdmin = (window.isAdmin ? window.isAdmin(authUser) : authUser.role === "admin") || Boolean(sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin"));

    const children = this.users.filter((u) => u.managerId === parentId && !nextVisited.has(u.id));
    if (children.length === 0) return "";
    return `<div class="tree-children">
      ${children
        .map((u) => {
          const isInactive = u.status === "Inactive";
          const roleBadge = `<span class="badge ${this.getRoleBadgeClass(u.role)} ms-1 tree-role-badge">${u.role}</span>`;
          const canImpersonate = isRealAdmin && u.id !== authUser.id && !isInactive;
          const loginAsTooltip = `Log in as ${u.name}`;
          const treeImpersonateBtn = canImpersonate
            ? `<button class="btn btn-sm btn-light text-info py-0 px-2 ms-2" title="${loginAsTooltip}" onclick="event.stopPropagation(); userMgmt.impersonateUser('${u.id}')"><i class="fas fa-sign-in-alt"></i></button>`
            : "";

          if (isInactive) {
            const areaName = u.vacantArea || u.area;
            const repAreaTag = areaName ? ` • Area: ${areaName}` : "";
            return `
            <div class="tree-node">
              <div class="node-content shadow-sm tree-node-vacant">
                <div class="bg-warning-subtle text-warning rounded-circle d-flex justify-content-center align-items-center fw-bold tree-avatar-circle">⚠️</div>
                <div class="flex-grow-1">
                  <div class="fw-bold small mb-0 tree-node-vacant-title"><span class="badge bg-warning text-dark me-1">[Vacant]</span>${u.role === "Rep" ? `Territory${repAreaTag}` : `${u.role} Branch`} ${roleBadge}</div>
                  <small class="text-muted tree-text-muted-xs">(Position Open • Former: ${u.name})</small>
                </div>
              </div>
              ${this.buildTree(u.id, nextVisited)}
            </div>`;
          }
          return `
          <div class="tree-node">
            <div class="node-content shadow-sm">
              <div class="bg-primary-light text-primary rounded-circle d-flex justify-content-center align-items-center fw-bold tree-avatar-circle">${u.name.charAt(0)}</div>
              <div class="flex-grow-1">
                <div class="fw-bold small mb-0 user-name-text">${u.name} ${roleBadge} ${treeImpersonateBtn}</div>
                <small class="text-muted tree-text-muted-xs">${u.code} ${u.area ? `• Area: ${u.area}` : ""}</small>
              </div>
            </div>
            ${this.buildTree(u.id, nextVisited)}
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
      const roleBadge = `<span class="badge ${this.getRoleBadgeClass(u.role)} ms-1 tree-role-badge">${u.role}</span>`;
      if (isInactive) {
        html += `
          <div class="tree-node ms-0 ps-0 border-0">
            <div class="node-content shadow-sm tree-node-vacant">
              <div class="bg-warning-subtle text-warning rounded-circle d-flex justify-content-center align-items-center fw-bold tree-avatar-circle">⚠️</div>
              <div class="flex-grow-1">
                <div class="fw-bold small mb-0 tree-node-vacant-title"><span class="badge bg-warning text-dark me-1">[Vacant]</span>${u.role} Position ${roleBadge}</div>
                <small class="text-muted tree-text-muted-xs">(Position Open • Former: ${u.name})</small>
              </div>
            </div>
            ${this.buildTree(u.id)}
          </div>`;
      } else {
        html += `
          <div class="tree-node ms-0 ps-0 border-0">
            <div class="node-content shadow-sm">
              <div class="bg-primary-light text-primary rounded-circle d-flex justify-content-center align-items-center fw-bold tree-avatar-circle">${u.name.charAt(0)}</div>
              <div class="flex-grow-1">
                <div class="fw-bold small mb-0 user-name-text">${u.name} ${roleBadge}</div>
                <small class="text-muted tree-text-muted-xs">${u.code}</small>
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

  wouldCreateCycle(userId, newManagerId) {
    if (!userId || !newManagerId) return false;
    if (userId === newManagerId) return true;
    const visited = new Set([userId]);
    let cur = newManagerId;
    while (cur) {
      if (visited.has(cur)) return true;
      visited.add(cur);
      const parent = this.users.find((u) => u.id === cur);
      cur = parent ? parent.managerId : null;
    }
    return false;
  },

  updateManagerDropdown() {
    const roleVal = document.getElementById("uRole")?.value || "";
    const managerSelect = document.getElementById("uManager");
    if (!managerSelect) return;

    const normRole = this.normalizeRole(roleVal);
    const levelMap = { Admin: 5, BU: 4, HR: 4, LM: 3, PM: 3, DM: 2, Rep: 1 };
    const userLevel = levelMap[normRole] || 1;

    if (normRole === "Admin" || userLevel >= 5) {
      document.getElementById("managerGroup").style.display = "none";
      return;
    }
    document.getElementById("managerGroup").style.display = "block";

    const currentUserId = document.getElementById("userId")?.value;

    let possibleManagers = this.users.filter((u) => {
      if (u.id === currentUserId) return false;
      if ((u.status || "Active") !== "Active") return false;
      if (this.wouldCreateCycle(currentUserId, u.id)) return false;

      const mgrLevel = levelMap[this.normalizeRole(u.role)] || 1;
      return mgrLevel > userLevel;
    });

    const selectedLineIds = Array.from(
      document.querySelectorAll(".user-line-cb:checked"),
    ).map((cb) => cb.value);

    if (userLevel <= 2 && selectedLineIds.length > 0) {
      const lineMatched = possibleManagers.filter((m) => {
        const mgrLines = m.lineIds || (m.lineId ? [m.lineId] : []);
        return mgrLines.some((id) => selectedLineIds.includes(id));
      });
      if (lineMatched.length > 0) {
        possibleManagers = lineMatched;
      }
    }

    if (possibleManagers.length === 0) {
      possibleManagers = this.users.filter(
        (u) =>
          ["Admin", "BU", "LM", "DM"].includes(u.role) &&
          (u.status || "Active") === "Active" &&
          u.id !== currentUserId &&
          !this.wouldCreateCycle(currentUserId, u.id),
      );
    }

    const currentSelection = managerSelect.value;

    managerSelect.innerHTML = `<option value="" data-i18n="select_manager">Select Manager...</option>
      ${possibleManagers
        .map((m) => {
          const tName = m.role || "Manager";
          return `<option value="${m.id}">${m.name} (${m.employeeCode || m.code || m.id}) - ${tName}</option>`;
        })
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
    const roleVal = document.getElementById("uRole")?.value || "";
    const normRole = this.normalizeRole(roleVal);

    // Auto-suggest employee code with role prefix for new users
    const isNewUser = !document.getElementById("userId")?.value;
    const codeInput = document.getElementById("uCode");
    if (isNewUser && codeInput && normRole) {
      const currentCode = codeInput.value.trim().toUpperCase();
      const isAutoPattern =
        !currentCode ||
        /^(REP|DM|LM|PM|BU|HR|ADM|EMP)-\d*$/i.test(currentCode);
      if (isAutoPattern) {
        codeInput.value = this.getNextEmployeeCode(normRole);
      }
    }

    const areaGroup = document.getElementById("areaGroup");
    if (areaGroup) {
      areaGroup.style.display = (normRole === "Rep") ? "block" : "none";
    }
    const productLineGroup = document.getElementById("productLineGroup");
    if (productLineGroup) {
      productLineGroup.style.display = ["BU", "LM", "DM", "Rep", "PM"].includes(normRole)
        ? "block"
        : "none";
    }
    const pmProductsGroup = document.getElementById("pmProductsGroup");
    if (pmProductsGroup) {
      const isPm = normRole === "PM";
      pmProductsGroup.style.display = isPm ? "block" : "none";
      if (isPm) {
        this.renderPmProducts();
      }
    }

    this.updateManagerDropdown();
  },

  renderPmProducts(selectedProductIds = null) {
    const container = document.getElementById("uPmProductsContainer");
    const allCb = document.getElementById("uPmAllProducts");
    if (!container) return;

    const checkedLineCbs = Array.from(document.querySelectorAll(".user-line-cb:checked"));
    const selectedLineIds = checkedLineCbs.map((cb) => cb.value);

    const allLines = window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
    const relevantLines = allLines.filter((l) => selectedLineIds.includes(l.id));

    let availableProducts = [];
    relevantLines.forEach((l) => {
      if (Array.isArray(l.products)) {
        l.products.forEach((p) => {
          if (!availableProducts.some((ap) => ap.id === p.id)) {
            availableProducts.push({ ...p, lineName: l.name });
          }
        });
      }
    });

    if (availableProducts.length === 0) {
      container.innerHTML = `<span class="text-muted" style="font-size:0.8rem;">Please select a sales line first to view products</span>`;
      return;
    }

    const isAll = selectedProductIds === null || selectedProductIds === undefined || (Array.isArray(selectedProductIds) && selectedProductIds.length === 0);
    if (allCb) allCb.checked = isAll;

    container.innerHTML = availableProducts.map((p) => {
      const checked = isAll || (Array.isArray(selectedProductIds) && selectedProductIds.includes(p.id));
      return `
        <div class="form-check form-check-sm mb-1">
          <input class="form-check-input pm-product-cb" type="checkbox" value="${p.id}" id="pm_prod_${p.id}" ${checked ? 'checked' : ''}>
          <label class="form-check-label" for="pm_prod_${p.id}" style="font-size: 0.8rem;">
            ${p.name} ${p.form ? `<span class="text-muted">(${p.form})</span>` : ''}
          </label>
        </div>
      `;
    }).join("");

    if (allCb) {
      allCb.onchange = () => {
        const cbs = container.querySelectorAll(".pm-product-cb");
        cbs.forEach((cb) => (cb.checked = allCb.checked));
      };
    }

    container.querySelectorAll(".pm-product-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        const cbs = Array.from(container.querySelectorAll(".pm-product-cb"));
        if (allCb) allCb.checked = cbs.length > 0 && cbs.every((c) => c.checked);
      });
    });
  },

  openAddModal() {
    this.pendingUnassignedAreaIds = new Set();
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    if (document.getElementById("userForm"))
      document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    const titleEl = document.getElementById("userModalTitle");
    if (titleEl) titleEl.setAttribute("data-i18n", "add_user");

    this.populateDropdowns();

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
    const hireDateInput = document.getElementById("uHireDate");
    if (hireDateInput) {
      hireDateInput.value = new Date().toISOString().slice(0, 10);
    }

    this.renderAssignedAreasDisplay(null);
    const promoContainer = document.getElementById("uPromotionHistoryContainer");
    if (promoContainer) promoContainer.style.display = "none";

    this.onRoleChange();
    this.updateAreaDropdown();
    this.showModal("user");
  },

  openEditModal(id) {
    this.pendingUnassignedAreaIds = new Set();
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    const user = this.users.find((u) => u.id === id);
    if (!user) return;

    this.populateDropdowns();

    document.getElementById("userId").value = user.id;
    document.getElementById("uName").value = user.name || "";
    document.getElementById("uEmail").value = user.email || "";
    document.getElementById("uCode").value = user.employeeCode || user.code || "";
    const hireDateInput = document.getElementById("uHireDate");
    if (hireDateInput) {
      hireDateInput.value = user.hireDate || "";
    }
    if (document.getElementById("uPhone"))
      document.getElementById("uPhone").value = user.phone || "";

    const uRoleSelect = document.getElementById("uRole");
    if (uRoleSelect) {
      uRoleSelect.value = this.normalizeRole(user.role);
    }

    // Render Career Ladder & Promotion History
    const promoContainer = document.getElementById("uPromotionHistoryContainer");
    const promoList = document.getElementById("uPromotionHistoryList");
    if (promoContainer && promoList) {
      if (Array.isArray(user.promotionHistory) && user.promotionHistory.length > 0) {
        promoContainer.style.display = "block";
        promoList.innerHTML = user.promotionHistory.map((p) => {
          const dateStr = p.promotedAt ? p.promotedAt.slice(0, 10) : "";
          return `<div class="d-flex align-items-center justify-content-between py-1 border-bottom border-light">
            <div>
              <span class="text-muted fw-semibold">${window.escapeHtml(p.fromTitle || "Previous")}</span>
              <i class="fas fa-arrow-right mx-1 text-primary small"></i>
              <span class="fw-bold text-dark">${window.escapeHtml(p.toTitle || "Promoted")}</span>
            </div>
            <div class="text-muted" style="font-size:0.75rem;">
              <span>${dateStr}</span>
              ${p.promotedBy ? `<span class="ms-1 text-secondary">by ${window.escapeHtml(p.promotedBy)}</span>` : ""}
            </div>
          </div>`;
        }).join("");
      } else {
        promoContainer.style.display = "none";
        promoList.innerHTML = "";
      }
    }

    let userLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
    if ((!userLineIds || userLineIds.length === 0) && typeof window.getUserLines === "function") {
      const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();
      if (role !== "admin" && role !== "hr") {
        const derived = window.getUserLines(user.id);
        if (derived && derived.length > 0) {
          userLineIds = derived.map((l) => l.id);
        }
      }
    }
    document.querySelectorAll(".user-line-cb").forEach((cb) => {
      cb.checked = userLineIds.includes(cb.value);
    });

    this.onRoleChange();
    if (document.getElementById("uRole").value === "PM") {
      this.renderPmProducts(user.productIds);
    }

    if (user.managerId && document.getElementById("uManager"))
      document.getElementById("uManager").value = user.managerId;

    const repAreas = window.store.areas ? window.store.areas.getByRep(user.id) : [];
    const currentAreaId = repAreas.length > 0 ? repAreas[0].id : "";
    this.updateAreaDropdown(currentAreaId);
    this.renderAssignedAreasDisplay(user.id);

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
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    if (window.hasAnyRole && !window.hasAnyRole(["admin", "hr"], authUser)) {
      if (typeof showToast === "function") showToast("Permission Denied: Admins & HR only.", "error");
      return;
    }
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

    if (id && managerId && this.wouldCreateCycle(id, managerId)) {
      return showToast("⚠️ Cannot save: selecting this manager creates a circular management loop.", "warning");
    }

    const selectedLineIds = Array.from(
      document.querySelectorAll(".user-line-cb:checked"),
    ).map((cb) => cb.value);

    const rawExistingUser = id ? window.store.users.getById(id) : null;
    const enteredPwd = document.getElementById("uPassword")
      ? document.getElementById("uPassword").value
      : "";

    let passwordHash = rawExistingUser ? rawExistingUser.passwordHash : null;
    if (enteredPwd) passwordHash = await window.hashPassword(enteredPwd);
    else if (!rawExistingUser) passwordHash = await window.hashPassword("Pharma@2026");

    const storeRoleMap = {
      Admin: "admin",
      BU: "business_unit",
      LM: "line_manager",
      DM: "district_manager",
      Rep: "medical_rep",
      PM: "product_manager",
      HR: "hr",
    };
    const effectiveBaseRole = storeRoleMap[role] || (window.normalizeRole ? window.normalizeRole(role) : role.toLowerCase());

    let selectedProductIds = [];
    if (role === "PM") {
      const allChecked = document.getElementById("uPmAllProducts")?.checked;
      if (allChecked) {
        const allLines = window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
        const relevantLines = allLines.filter((l) => selectedLineIds.includes(l.id));
        relevantLines.forEach((l) => {
          if (Array.isArray(l.products)) {
            l.products.forEach((p) => {
              if (!selectedProductIds.includes(p.id)) selectedProductIds.push(p.id);
            });
          }
        });
      } else {
        selectedProductIds = Array.from(document.querySelectorAll(".pm-product-cb:checked")).map((cb) => cb.value);
      }
    }

    const userData = {
      id: id || "u" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name,
      email,
      code: code,
      employeeCode: code,
      role: effectiveBaseRole,
      title: role,
      titleCode: role,
      level: ({"admin": 5, "business_unit": 4, "hr": 4, "line_manager": 3, "product_manager": 3, "district_manager": 2, "medical_rep": 1}[effectiveBaseRole] || 1),
      passwordHash,
      mustChangePassword: id ? (rawExistingUser ? Boolean(rawExistingUser.mustChangePassword) : false) : true,
      phone: document.getElementById("uPhone")
        ? document.getElementById("uPhone").value.trim()
        : "",
      hireDate: (() => {
        const hInput = document.getElementById("uHireDate");
        if (hInput && hInput.value) return hInput.value;
        return rawExistingUser?.hireDate || new Date().toISOString().slice(0, 10);
      })(),
      managerId: managerId || null,
      status: rawExistingUser ? rawExistingUser.status : "Active",
      promotionHistory: (() => {
        if (rawExistingUser) {
          const oldT = rawExistingUser.role;
          const newT = role;
          const hist = Array.isArray(rawExistingUser.promotionHistory) ? [...rawExistingUser.promotionHistory] : [];
          if (oldT && oldT !== newT) {
            hist.unshift({
              fromTitle: oldT,
              toTitle: newT,
              promotedAt: new Date().toISOString(),
              promotedBy: authUser.name || "Admin"
            });
          }
          return hist;
        }
        return [];
      })(),
      lineIds: selectedLineIds,
      lineId: selectedLineIds[0] || null,
      productIds: selectedProductIds,
      leaveBalance: {
        annual: (() => {
          const val = parseInt(document.getElementById("uAnnualLeave")?.value, 10);
          return isNaN(val) ? 21 : Math.max(0, val);
        })(),
        casual: (() => {
          const val = parseInt(document.getElementById("uCasualLeave")?.value, 10);
          return isNaN(val) ? 6 : Math.max(0, val);
        })(),
        emergency: (() => {
          const el = document.getElementById("uEmergencyLeave") || document.getElementById("uCasualLeave");
          const val = parseInt(el?.value, 10);
          return isNaN(val) ? 6 : Math.max(0, val);
        })(),
        sick: (() => {
          const val = parseInt(document.getElementById("uSickLeave")?.value, 10);
          return isNaN(val) ? 7 : Math.max(0, val);
        })(),
        unpaid: rawExistingUser?.leaveBalance?.unpaid != null ? rawExistingUser.leaveBalance.unpaid : 0,
        maternity: rawExistingUser?.leaveBalance?.maternity != null ? rawExistingUser.leaveBalance.maternity : 90,
      },
      // Territory information is managed through areas.html and synchronized via store.users.syncAreasFromStore()
      area: rawExistingUser ? rawExistingUser.area : null,
      areaId: rawExistingUser ? rawExistingUser.areaId : null,
      areaIds: rawExistingUser ? (rawExistingUser.areaIds || []) : [],
    };

    window.store.users.save(userData);

    const selectedAreaId = document.getElementById("uArea")
      ? document.getElementById("uArea").value
      : null;

    const previousRepAreas = (id && window.store && window.store.areas)
      ? window.store.areas.getByRep(id)
      : [];

    if (this.pendingUnassignedAreaIds && this.pendingUnassignedAreaIds.size > 0) {
      this.pendingUnassignedAreaIds.forEach((areaId) => {
        window.store.areas.unassignRep(areaId);
      });
      this.pendingUnassignedAreaIds.clear();
    }

    if (role !== "Rep") {
      previousRepAreas.forEach((a) => {
        window.store.areas.unassignRep(a.id);
      });
    } else if (window.store && window.store.areas) {
      previousRepAreas.forEach((a) => {
        if (a.lineId && !selectedLineIds.includes(a.lineId)) {
          window.store.areas.unassignRep(a.id);
        }
      });

      if (selectedAreaId && previousRepAreas.length === 1 && previousRepAreas[0].id !== selectedAreaId) {
        window.store.areas.unassignRep(previousRepAreas[0].id);
      }

      if (selectedAreaId) {
        const areaObj = window.store.areas.getById(selectedAreaId);
        if (areaObj && areaObj.repId !== userData.id) {
          areaObj.repId = userData.id;
          areaObj.repName = userData.name;
          window.store.areas.save(areaObj);
        }
      }
    }

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
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const normRole = (window.normalizeRole ? window.normalizeRole(authUser.role) : (authUser.role || "")).toLowerCase();
    const isRealAdmin = normRole === "admin" || (authUser.role || "").toLowerCase() === "admin" || Boolean(sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin"));
    if (!isRealAdmin) {
      if (typeof showToast === "function") showToast("Permission Denied: Only Administrator can reset passwords.", "error");
      return;
    }
    this.selectedUserId = id;
    const user = this.users.find((u) => u.id === id) || (window.store && window.store.users && window.store.users.getById(id));
    const nameEl = document.getElementById("resetPwdUserName");
    if (nameEl) nameEl.textContent = user ? user.name : "this user";
    this.showModal("resetPwd");
  },
  async confirmResetPassword() {
    if (!this.selectedUserId) return;
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const normRole = (window.normalizeRole ? window.normalizeRole(authUser.role) : (authUser.role || "")).toLowerCase();
    const isRealAdmin = normRole === "admin" || (authUser.role || "").toLowerCase() === "admin" || Boolean(sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin"));
    if (!isRealAdmin) {
      this.closeModal("resetPwd");
      if (typeof showToast === "function") showToast("Permission Denied: Only Administrator can reset passwords.", "error");
      return;
    }

    const user = this.users.find((u) => u.id === this.selectedUserId) || (window.store && window.store.users && window.store.users.getById(this.selectedUserId));
    if (!user) {
      this.closeModal("resetPwd");
      return;
    }

    const defaultPwd = "Pharma@2026";
    const newHash = await window.hashPassword(defaultPwd);
    user.passwordHash = newHash;
    user.mustChangePassword = true;

    if (window.store && window.store.users && typeof window.store.users.save === "function") {
      window.store.users.save(user);
    } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) {
      const idx = window.DEMO_DATA.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) window.DEMO_DATA.users[idx] = { ...window.DEMO_DATA.users[idx], ...user };
    }

    this.closeModal("resetPwd");
    showToast(`Password for ${user.name} reset to ${defaultPwd} successfully. User must set a new password on next login.`, "success");
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
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    if (window.hasAnyRole && !window.hasAnyRole(["admin", "hr"], authUser)) {
      if (typeof showToast === "function") showToast("Permission Denied: Admins & HR only.", "error");
      return;
    }
    if (!this.selectedUserId) return;
    const rawUser = window.store.users.getById(this.selectedUserId);
    if (rawUser) {
      const willBeInactive = rawUser.status === "Active";
      rawUser.status = willBeInactive ? "Inactive" : "Active";

      const allSystemUsers = window.DEMO_DATA.users || [];
      let hasSubordinateUpdates = false;

      if (willBeInactive) {
        const assignedAreas = window.store.areas ? window.store.areas.getByRep(rawUser.id) : [];
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

        allSystemUsers.forEach((u) => {
          if (u.managerId === rawUser.id) {
            u.previousManagerId = rawUser.id;
            u.managerId = rawUser.managerId || null;
            hasSubordinateUpdates = true;
          }
        });
      } else {
        allSystemUsers.forEach((u) => {
          if (u.previousManagerId === rawUser.id) {
            u.managerId = rawUser.id;
            delete u.previousManagerId;
            hasSubordinateUpdates = true;
          }
        });
      }

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

      window.store.users.save(rawUser);

      this.render();
      const msg = willBeInactive
        ? "User deactivated. Territory preserved as Vacant and subordinates successfully transferred to upper manager."
        : "User is now Active. Former subordinates successfully restored to their team.";
      showToast(msg, "info");
    }
    this.closeModal("deactivate");
  },

  impersonateUser(targetUserId) {
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const normRole = (window.normalizeRole ? window.normalizeRole(authUser.role) : (authUser.role || "")).toLowerCase();
    const originalAdmin = sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin");
    const isRealAdmin = normRole === "admin" || (authUser.role || "").toLowerCase() === "admin" || Boolean(originalAdmin);

    if (!isRealAdmin) {
      if (typeof showToast === "function") {
        showToast("Permission Denied: Only Admins can log in as other users.", "error");
      }
      return;
    }

    if (authUser.id === targetUserId) {
      if (typeof showToast === "function") {
        showToast("You are already viewing this account.", "info");
      }
      return;
    }

    const targetUser = window.store && window.store.users ? window.store.users.getById(targetUserId) : null;
    if (!targetUser) {
      if (typeof showToast === "function") {
        showToast("Target user not found.", "error");
      }
      return;
    }

    // Save the original admin session if not already in impersonation mode
    if (!originalAdmin) {
      sessionStorage.setItem("impersonating_admin", JSON.stringify(authUser));
      localStorage.setItem("impersonating_admin", JSON.stringify(authUser));
    }

    const targetSession = {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      name: targetUser.name,
      nameAr: targetUser.nameAr,
      employeeCode: targetUser.employeeCode || targetUser.code,
      lineId: targetUser.lineId || null,
      lineIds: targetUser.lineIds || [],
      productIds: targetUser.productIds || [],
      token: "impersonated_" + Date.now()
    };

    sessionStorage.removeItem("pharma_logged_out");
    sessionStorage.setItem("pharmaUser", JSON.stringify(targetSession));
    localStorage.setItem("pharmaUser", JSON.stringify(targetSession));
    localStorage.setItem("userRole", targetUser.role);
    localStorage.setItem("userId", targetUser.id);
    window.currentUser = targetSession;

    window.location.href = "index.html";
  },
};

window.userMgmt = userMgmt;

document.addEventListener("DOMContentLoaded", () => {
  userMgmt.init();
});

