/**
 * @file auth-service.js
 * @description Centralized Authentication, Session Integrity & Tamper-Proof Auth Guard Service
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AuthService = factory();
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ثابت في الكود ومش سر؛ التوقيع مجرد كشف تلاعب عرضي، مش حماية (الإنفاذ الحقيقي لازم server-side)
  const SESSION_SIGNATURE_SALT = "pharma_sec_token_2026_#9xK2@pLm!";

  function getRegisteredUsers() {
    if (typeof DEMO_DATA !== "undefined" && Array.isArray(DEMO_DATA.users) && DEMO_DATA.users.length > 0) {
      return DEMO_DATA.users;
    }
    if (typeof window !== "undefined" && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users) && window.DEMO_DATA.users.length > 0) {
      return window.DEMO_DATA.users;
    }
    if (typeof window !== "undefined" && window.store && window.store.users && typeof window.store.users.getAll === "function") {
      const storeUsers = window.store.users.getAll();
      if (Array.isArray(storeUsers)) return storeUsers;
    }
    return [];
  }

  function isUserInactive(user) {
    if (!user || !user.status) return false;
    const st = String(user.status).trim().toLowerCase();
    return st === "inactive" || st === "suspended" || st === "disabled";
  }

  function getCurrentPageName() {
    if (typeof window === "undefined" || !window.location) return "";
    const rawPath = String(window.location.pathname || "").split("?")[0].split("#")[0];
    return (rawPath.split("/").pop() || "index.html").toLowerCase();
  }

  function validateImpersonationRecord(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.id) return null;
      const registeredUsers = getRegisteredUsers();
      const reg = registeredUsers.find((u) => u && u.id === parsed.id);
      if (!reg) return null;
      if (normalizeRole(reg.role) !== "admin") return null;
      if (isUserInactive(reg)) return null;
      if (parsed.email && reg.email && String(parsed.email).toLowerCase().trim() !== String(reg.email).toLowerCase().trim()) {
        return null;
      }
      if (parsed._sig && parsed._sig !== computeSessionSignature(reg)) {
        return null;
      }
      return reg;
    } catch (e) {
      return null;
    }
  }

  function normalizeRole(role) {
    if (typeof window !== "undefined" && typeof window.normalizeRole === "function" && window.normalizeRole !== normalizeRole) {
      return window.normalizeRole(role);
    }
    if (!role) return "";
    const r = String(role).toLowerCase().trim();
    if (r === "dm" || r === "district_manager" || r === "district manager") return "district_manager";
    if (r === "lm" || r === "line_manager" || r === "line manager") return "line_manager";
    if (r === "bu" || r === "business_unit" || r === "business unit") return "business_unit";
    if (r === "rep" || r === "medical_rep" || r === "medical rep") return "medical_rep";
    if (r === "pm" || r === "product_manager" || r === "product manager") return "product_manager";
    if (r === "admin" || r === "administrator") return "admin";
    if (r === "hr" || r === "human_resources" || r === "human resources") return "hr";
    if (r === "gm" || r === "general_manager" || r === "general manager") return "general_manager";
    return r;
  }

  /**
   * Computes deterministic cryptographic session integrity signature for a user.
   * Binds user ID, employee code, role, and salt.
   * @param {Object} user 
   * @returns {string} Hex signature hash
   */
  function computeSessionSignature(user) {
    if (!user || !user.id) return "";
    const canonical = [
      String(user.id).trim(),
      String(user.employeeCode || user.code || "").trim(),
      String(user.role || "").trim(),
      SESSION_SIGNATURE_SALT
    ].join("::");

    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < canonical.length; i++) {
      const ch = canonical.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  /**
   * Purges invalid or tampered session from storage and redirects to login if in browser.
   * @param {string} reason 
   */
  function purgeTamperedSession(reason) {
    console.warn("[Security Guard] Tampered or invalid session terminated:", reason);
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("pharmaUser");
        sessionStorage.removeItem("impersonating_admin");
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("pharmaUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("impersonating_admin");
      }
    } catch (e) {}
    if (typeof window !== "undefined") {
      window.currentUser = null;
      if (window.location && typeof window.location.replace === "function") {
        const path = getCurrentPageName();
        if (path !== "login.html") {
          window.location.replace("login.html");
        }
      }
    }
  }

  /**
   * Validates active session from sessionStorage or localStorage.
   * Enforces role integrity, authority binding against DEMO_DATA / store.users,
   * and cryptographic session signature verification.
   * @returns {Object|null} Verified user object or null
   */
  function checkAuth() {
    let sessionStr = null;
    let localStr = null;
    try {
      if (typeof sessionStorage !== "undefined") sessionStr = sessionStorage.getItem("pharmaUser");
      if (typeof localStorage !== "undefined") localStr = localStorage.getItem("pharmaUser");
    } catch (e) {}
    const userStr = sessionStr || localStr;
    if (!userStr) return null;

    try {
      const parsed = JSON.parse(userStr);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !parsed.id || !String(parsed.id).trim()) {
        purgeTamperedSession("Missing user ID");
        return null;
      }

      // Authority Binding: Lookup against genuine company database (DEMO_DATA or store.users)
      const registeredUsers = getRegisteredUsers();

      // If user store has not loaded yet, do NOT treat session as verified or elevate privileges
      if (registeredUsers.length === 0) {
        parsed._unverified = true;
        return parsed;
      }

      // Lookup strictly by ID (never id OR email)
      const registered = registeredUsers.find((u) => u && u.id === parsed.id);

      // Strict Anti-Impersonation:
      if (!registered) {
        purgeTamperedSession("Unknown user identity");
        return null;
      }

      // Active account guard: immediately revoke sessions of deactivated/suspended users
      if (isUserInactive(registered)) {
        purgeTamperedSession("Account is inactive or suspended");
        return null;
      }

      // Email/ID consistency guard
      if (parsed.email && registered.email && String(parsed.email).toLowerCase().trim() !== String(registered.email).toLowerCase().trim()) {
        purgeTamperedSession("Email/ID mismatch");
        return null;
      }

      // Role Tamper Guard: Never allow client-side role elevation via localStorage!
      // Always bind role strictly to the authoritative registered role
      if (registered.role && parsed.role !== registered.role) {
        console.warn("[Security Alert] Role escalation detected! Reverting to registered role:", registered.role);
        parsed.role = registered.role;
      }

      // Synchronize authoritative organizational hierarchy, security flags, and profile details from registered user
      if (registered.dept !== undefined) {
        parsed.dept = registered.dept;
      }
      if (registered.email) {
        parsed.email = registered.email;
      }
      if (registered.status !== undefined) {
        parsed.status = registered.status;
      }
      if (registered.mustChangePassword !== undefined) {
        parsed.mustChangePassword = Boolean(registered.mustChangePassword);
      }
      if (registered.managerId !== undefined) {
        parsed.managerId = registered.managerId;
      }
      if (registered.lineId !== undefined) {
        parsed.lineId = registered.lineId;
      }
      if (Array.isArray(registered.lineIds)) {
        parsed.lineIds = registered.lineIds;
      }
      if (Array.isArray(registered.areaIds)) {
        parsed.areaIds = registered.areaIds;
      }
      if (Array.isArray(registered.productIds)) {
        parsed.productIds = registered.productIds;
      }
      if (registered.areaId !== undefined) {
        parsed.areaId = registered.areaId;
      }
      if (registered.employeeCode || registered.code) {
        parsed.employeeCode = registered.employeeCode || registered.code;
      }
      if (registered.name) {
        parsed.name = registered.name;
      }
      if (registered.nameAr !== undefined) {
        parsed.nameAr = registered.nameAr;
      }
      if (registered.hireDate !== undefined) {
        parsed.hireDate = registered.hireDate;
      }
      if (registered.phone !== undefined) {
        parsed.phone = registered.phone;
      }
      if (parsed._unverified) {
        delete parsed._unverified;
      }

      // Client-side Session Signature Check (computed strictly from registered record).
      // NOTE: Client-side signature is NOT a cryptographic security boundary (SESSION_SIGNATURE_SALT
      // is hardcoded in client JS and hash is non-cryptographic); real enforcement must be server-side.
      const expectedSig = computeSessionSignature(registered);
      if (parsed._sig && parsed._sig !== expectedSig) {
        purgeTamperedSession("Cryptographic session signature mismatch");
        return null;
      }
      // Auto-sign legitimate sessions
      parsed._sig = expectedSig;

      // Sync verified session back only when serialized content or role/id keys changed
      const nextSerialized = JSON.stringify(parsed);
      try {
        if (typeof sessionStorage !== "undefined" && nextSerialized !== sessionStr) {
          sessionStorage.setItem("pharmaUser", nextSerialized);
        }
        if (typeof localStorage !== "undefined") {
          if (nextSerialized !== localStr) {
            localStorage.setItem("pharmaUser", nextSerialized);
          }
          if (parsed.role && localStorage.getItem("userRole") !== parsed.role) {
            localStorage.setItem("userRole", parsed.role);
          }
          if (localStorage.getItem("userId") !== parsed.id) {
            localStorage.setItem("userId", parsed.id);
          }
        }
      } catch (e) {}
      return parsed;
    } catch (err) {
      purgeTamperedSession("Corrupted session JSON");
      return null;
    }
  }

  /**
   * Enforces role-based page security (RBAC).
   * @returns {boolean} true if current user is allowed on the current page, false if denied
   */
  function enforcePageRoleSecurity(precheckedUser) {
    if (typeof window === "undefined" || !window.location) return true;
    const user = precheckedUser || checkAuth();
    if (!user) return false;
    const path = getCurrentPageName();
    const role = normalizeRole(user.role);

    const restrictions = {
      "users.html": ["admin", "hr"],
      "distributors.html": ["admin"],
      "areas.html": ["admin", "hr", "business_unit"],
      "products.html": ["admin"],
      "plans-review.html": ["admin", "general_manager", "district_manager", "line_manager", "business_unit"],
      "reports.html": ["admin", "general_manager", "business_unit", "line_manager", "district_manager", "medical_rep", "rep", "product_manager"],
    };

    if (restrictions[path] && (user._unverified === true || !restrictions[path].includes(role))) {
      console.warn(`[RBAC] Access denied: role '${role}' (unverified=${Boolean(user._unverified)}) cannot access '${path}'. Redirecting.`);
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem("pharma_rbac_denied", "true");
      } catch (e) {}
      const targetRedirect = !user._unverified && role === "hr" ? "users.html" : "index.html";
      if (typeof window.location.replace === "function") {
        window.location.replace(targetRedirect);
      }
      return false;
    }
    return true;
  }

  /**
   * Requires authenticated session, redirects to login if missing, and verifies page permissions.
   * @returns {Object|null}
   */
  function requireAuth() {
    const user = checkAuth();
    if (!user) {
      if (typeof window !== "undefined" && window.location && getCurrentPageName() !== "login.html") {
        if (typeof window.location.replace === "function") {
          window.location.replace("login.html");
        }
      }
      return null;
    }
    if (!enforcePageRoleSecurity(user)) {
      return null;
    }
    return user;
  }

  /**
   * Logs out current user and redirects to login page.
   */
  function logout() {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
        sessionStorage.setItem("pharma_logged_out", "true");
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("pharmaUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("impersonating_admin");
      }
    } catch (e) {}
    if (typeof window !== "undefined") {
      window.currentUser = null;
      if (window.location && typeof window.location.replace === "function") {
        window.location.replace("login.html");
      }
    }
  }

  /**
   * Exits impersonation and restores original admin session.
   */
  function exitImpersonation() {
    let impersonatingAdminStr = null;
    try {
      impersonatingAdminStr = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("impersonating_admin")) ||
        (typeof localStorage !== "undefined" && localStorage.getItem("impersonating_admin"));
    } catch (e) {}

    if (!impersonatingAdminStr) {
      if (typeof window !== "undefined" && window.location && typeof window.location.replace === "function") {
        const cur = checkAuth();
        if (!cur) {
          window.location.replace("login.html");
          return;
        }
        const curRole = normalizeRole(cur.role);
        const target = (curRole === "admin" || curRole === "hr") ? "users.html" : "index.html";
        window.location.replace(target);
      }
      return;
    }

    const admin = validateImpersonationRecord(impersonatingAdminStr);
    if (!admin) {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("impersonating_admin");
        if (typeof localStorage !== "undefined") localStorage.removeItem("impersonating_admin");
      } catch (e) {}
      purgeTamperedSession("Invalid impersonation record");
      return;
    }

    const restoredSession = {
      id: admin.id,
      email: admin.email || "",
      name: admin.name || "",
      nameAr: admin.nameAr || "",
      role: admin.role,
      dept: admin.dept || "",
      status: admin.status || "Active",
      mustChangePassword: Boolean(admin.mustChangePassword),
      employeeCode: admin.employeeCode || admin.code || "",
      code: admin.code || admin.employeeCode || "",
      managerId: admin.managerId !== undefined ? admin.managerId : null,
      lineId: admin.lineId !== undefined ? admin.lineId : "",
      lineIds: Array.isArray(admin.lineIds) ? admin.lineIds : [],
      areaId: admin.areaId !== undefined ? admin.areaId : "",
      areaIds: Array.isArray(admin.areaIds) ? admin.areaIds : [],
      hireDate: admin.hireDate || "",
      phone: admin.phone || ""
    };
    restoredSession._sig = computeSessionSignature(admin);

    try {
      const serialized = JSON.stringify(restoredSession);
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("pharmaUser", serialized);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pharmaUser", serialized);
        localStorage.setItem("userRole", admin.role);
        localStorage.setItem("userId", admin.id);
      }
    } catch (e) {}
    if (typeof window !== "undefined") window.currentUser = restoredSession;

    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("impersonating_admin");
      if (typeof localStorage !== "undefined") localStorage.removeItem("impersonating_admin");
    } catch (e) {}

    if (typeof window !== "undefined" && window.location && typeof window.location.replace === "function") {
      window.location.replace("users.html");
    }
  }

  const AuthService = {
    normalizeRole,
    computeSessionSignature,
    purgeTamperedSession,
    checkAuth,
    enforcePageRoleSecurity,
    requireAuth,
    logout,
    exitImpersonation
  };

  // Expose global aliases on window if in browser
  if (typeof window !== "undefined") {
    window.AuthService = AuthService;
    window.computeSessionSignature = computeSessionSignature;
    window.purgeTamperedSession = purgeTamperedSession;
    window.checkAuth = checkAuth;
    window.enforcePageRoleSecurity = enforcePageRoleSecurity;
    window.requireAuth = requireAuth;
    window.logout = logout;
    window.exitImpersonation = exitImpersonation;
  }

  return AuthService;
});
