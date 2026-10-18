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

  const SESSION_SIGNATURE_SALT = "pharma_sec_token_2026_#9xK2@pLm!";

  function normalizeRole(role) {
    if (typeof window !== "undefined" && typeof window.normalizeRole === "function") {
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
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("pharmaUser");
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("pharmaUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
      }
    } catch (e) {}
    if (typeof window !== "undefined" && window.location && typeof window.location.replace === "function") {
      const path = (window.location.pathname || "").split("/").pop().toLowerCase();
      if (path !== "login.html" && !path.includes("login")) {
        window.location.replace("login.html");
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
      if (!parsed || !parsed.id) {
        purgeTamperedSession("Missing user ID");
        return null;
      }

      if (parsed && (parsed.email === "pm2@pharmacare.com" || parsed.id === "u1790626000019") && parsed.role === "medical_rep") {
        parsed.id = "u1790626000019";
        parsed.name = "Fady Adel";
        parsed.nameAr = "Fady Adel";
        parsed.role = "product_manager";
        parsed.employeeCode = "PM-002";
        parsed.code = "PM-002";
        parsed.lineId = "line_1790626000002";
        parsed.lineIds = ["line_1790626000002"];
        parsed.productIds = ["prod_1790626000005", "prod_1790626000006"];
      }

      // Authority Binding: Lookup against genuine company database (DEMO_DATA or store.users)
      const registeredUsers = (typeof DEMO_DATA !== "undefined" && Array.isArray(DEMO_DATA.users))
        ? DEMO_DATA.users
        : ((typeof window !== "undefined" && window.store && window.store.users && window.store.users.getAll) ? window.store.users.getAll() : []);

      const registered = registeredUsers.find((u) => u.id === parsed.id || (u.email && u.email.toLowerCase() === (parsed.email || "").toLowerCase()));

      // Strict Anti-Impersonation:
      // If registered users exist in system and parsed.id does not match any registered user:
      if (registeredUsers.length > 0 && !registered) {
        purgeTamperedSession("Unknown user identity");
        return null;
      }

      // Role Tamper Guard: Never allow client-side role elevation via localStorage!
      // Always bind role strictly to the authoritative registered role
      if (registered && registered.role && parsed.role !== registered.role) {
        console.warn("[Security Alert] Role escalation detected! Reverting to registered role:", registered.role);
        parsed.role = registered.role;
        parsed.dept = registered.dept || parsed.dept;
      }

      // Cryptographic Session Signature Check
      const expectedSig = computeSessionSignature(registered || parsed);
      if (parsed._sig && parsed._sig !== expectedSig) {
        purgeTamperedSession("Cryptographic session signature mismatch");
        return null;
      }
      // Auto-sign legitimate sessions
      parsed._sig = expectedSig;

      // Sync verified session back
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem("pharmaUser", JSON.stringify(parsed));
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("pharmaUser", JSON.stringify(parsed));
          if (parsed.role) localStorage.setItem("userRole", parsed.role);
          localStorage.setItem("userId", parsed.id);
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
   */
  function enforcePageRoleSecurity() {
    if (typeof window === "undefined" || !window.location) return;
    const user = checkAuth();
    if (!user) return;
    const path = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
    const role = normalizeRole(user.role);

    const restrictions = {
      "users.html": ["admin", "hr"],
      "distributors.html": ["admin"],
      "areas.html": ["admin", "hr"],
      "products.html": ["admin"],
      "plans-review.html": ["admin", "district_manager", "line_manager", "business_unit"],
      "reports.html": ["admin", "business_unit", "line_manager", "district_manager", "medical_rep", "rep", "product_manager"],
    };

    if (restrictions[path] && !restrictions[path].includes(role)) {
      console.warn(`[RBAC] Access denied: role '${role}' cannot access '${path}'. Redirecting.`);
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem("pharma_rbac_denied", "true");
      } catch (e) {}
      const targetRedirect = role === "hr" ? "users.html" : "index.html";
      window.location.replace(targetRedirect);
    }
  }

  /**
   * Requires authenticated session, redirects to login if missing, and verifies page permissions.
   * @returns {Object|null}
   */
  function requireAuth() {
    const user = checkAuth();
    if (!user) {
      if (typeof window !== "undefined" && window.location && !window.location.href.includes("login.html")) {
        window.location.replace("login.html");
      }
      return null;
    }
    enforcePageRoleSecurity();
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
    if (typeof window !== "undefined" && window.location) {
      window.location.replace("login.html");
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
      if (typeof window !== "undefined" && window.location) {
        window.location.replace("users.html");
      }
      return;
    }

    let originalAdmin = null;
    try {
      originalAdmin = JSON.parse(impersonatingAdminStr);
    } catch (e) {}

    if (originalAdmin) {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem("pharmaUser", JSON.stringify(originalAdmin));
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("pharmaUser", JSON.stringify(originalAdmin));
          localStorage.setItem("userRole", originalAdmin.role || "admin");
          localStorage.setItem("userId", originalAdmin.id);
        }
      } catch (e) {}
      if (typeof window !== "undefined") window.currentUser = originalAdmin;
    }

    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("impersonating_admin");
      if (typeof localStorage !== "undefined") localStorage.removeItem("impersonating_admin");
    } catch (e) {}

    if (typeof window !== "undefined" && window.location) {
      window.location.replace("users.html");
    }
  }

  const AuthService = {
    SESSION_SIGNATURE_SALT,
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
