/**
 * @file workflow-engine.js
 * @description Centralized Enterprise Approval Workflow & Authorization Engine for PharmaCare
 */

(function (window) {
  "use strict";

  const DEFAULT_WORKFLOWS = Object.freeze({
    commercialServices: {
      requireDm: true,
      requireLm: true,
      requireBu: true,
      requireGm: false,
      buThresholdMode: "all",
      buThresholdAmount: 5000,
      autoSkipSubmitterRole: true,
    },
    marketingServices: {
      requirePm: true,
      requireDm: false,
      requireLm: false,
      requireBu: true,
      buThresholdMode: "all",
      buThresholdAmount: 10000,
      autoSkipSubmitterRole: true,
    },
    expenses: {
      requireDm: true,
      requireLm: true,
      requireBu: false,
      requireHr: true,
      requireDisbursement: true,
      requireBuThreshold: false,
      buThresholdAmount: 10000,
      autoSkipSubmitterRole: true,
    },
    leaves: {
      requireDm: true,
      requireLm: true,
      requireBu: false,
      requireHr: true,
      autoSkipSubmitterRole: true,
    },
    plans: {
      requireDm: true,
      requireLm: false,
      requireBu: false,
    },
    relocation: {
      requireDm: true,
      requireLm: false,
      requireBu: false,
    },
  });

  function _getUserLineIds(user) {
    if (!user) return [];
    if (typeof window.getUserLines === "function" && user.id) {
      const derived = window.getUserLines(user.id);
      if (Array.isArray(derived) && derived.length > 0) {
        return derived.map((l) => l && l.id).filter(Boolean);
      }
    }
    if (Array.isArray(user.lineIds) && user.lineIds.length > 0) return user.lineIds.filter(Boolean);
    return user.lineId ? [user.lineId] : [];
  }

  function _isUserActive(user) {
    if (!user) return false;
    return String(user.status || "Active").trim().toLowerCase() === "active";
  }

  const WorkflowEngine = {
    /**
     * Resolves the canonical base role for a user (accounting for custom titles & role codes).
     */
    getUserBaseRole(user) {
      if (!user) return "";
      const rawRole = (user.role || "").toLowerCase();
      if (window.normalizeRole) return window.normalizeRole(rawRole);

      const map = {
        admin: "admin",
        gm: "general_manager",
        general_manager: "general_manager",
        bu: "business_unit",
        business_unit: "business_unit",
        pm: "product_manager",
        product_manager: "product_manager",
        lm: "line_manager",
        line_manager: "line_manager",
        dm: "district_manager",
        district_manager: "district_manager",
        hr: "hr",
        rep: "medical_rep",
        medical_rep: "medical_rep",
      };
      return map[rawRole] || rawRole;
    },

    /**
     * Resolves hierarchy rank level (1 to 5) for any user.
     */
    getUserLevel(user) {
      if (!user) return 1;
      const base = this.getUserBaseRole(user);
      const levelMap = {
        admin: 5,
        general_manager: 5,
        business_unit: 4,
        hr: 4,
        line_manager: 3,
        product_manager: 3,
        district_manager: 2,
        medical_rep: 1,
      };
      return levelMap[base] || 1;
    },

    /**
     * Checks if a user fulfills a specific tier (e.g. "dm", "lm", "bu", "pm", "hr").
     */
    userMatchesTier(user, tier) {
      if (!user) return false;
      const base = this.getUserBaseRole(user);
      switch (tier) {
        case "dm":
          return base === "district_manager";
        case "lm":
          return base === "line_manager";
        case "bu":
          return base === "business_unit";
        case "pm":
          return base === "product_manager";
        case "hr":
          return base === "hr";
        case "gm":
          return base === "general_manager";
        default:
          return base === tier;
      }
    },

    /**
     * Retrieves the active company approval workflows configuration with fallback defaults.
     */
    getWorkflows() {
      try {
        if (window.store && window.store.companySettings) {
          const settings = window.store.companySettings.get();
          if (settings && settings.approvalWorkflows) {
            const raw = settings.approvalWorkflows;
            return {
              commercialServices: { ...DEFAULT_WORKFLOWS.commercialServices, ...(raw.commercialServices || {}) },
              marketingServices: { ...DEFAULT_WORKFLOWS.marketingServices, ...(raw.marketingServices || {}) },
              expenses: { ...DEFAULT_WORKFLOWS.expenses, ...(raw.expenses || {}) },
              leaves: { ...DEFAULT_WORKFLOWS.leaves, ...(raw.leaves || {}) },
              plans: { ...DEFAULT_WORKFLOWS.plans, ...(raw.plans || {}) },
              relocation: { ...DEFAULT_WORKFLOWS.relocation, ...(raw.relocation || {}) },
            };
          }
        }
      } catch (e) {}
      return DEFAULT_WORKFLOWS;
    },

    _isInHierarchyChain(approverUser, targetUserId) {
      if (!approverUser || !approverUser.id || !targetUserId) return false;
      const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const visited = new Set();
      let curr = allUsers.find((u) => u && u.id === targetUserId);
      while (curr && curr.managerId && !visited.has(curr.managerId)) {
        visited.add(curr.managerId);
        if (curr.managerId === approverUser.id) return true;
        curr = allUsers.find((u) => u && u.id === curr.managerId);
      }
      return false;
    },

    /**
     * Resolves hierarchy users (rep, dm, lm, bu, pm) for a specific line, area, and rep.
     */
    resolveHierarchy(lineId, areaId, repId) {
      const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const allAreas = (window.store && window.store.areas && typeof window.store.areas.getAll === "function" ? window.store.areas.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
      const rep = repId ? allUsers.find((u) => u.id === repId) : null;

      let dmUser = null;
      let lmUser = null;
      let buUser = null;
      let pmUser = null;

      // 1. Resolve DM (direct manager, vacant area manager, or district tier on line)
      if (rep) {
        if (this.userMatchesTier(rep, "dm")) {
          dmUser = rep;
        } else if (rep.managerId) {
          dmUser = allUsers.find((u) => u.id === rep.managerId && this.userMatchesTier(u, "dm") && _isUserActive(u));
        }
      }
      if (!dmUser && areaId) {
        const areaObj = allAreas.find((a) => a && a.id === areaId);
        if (areaObj) {
          const areaMgrId = (typeof window.getAreaManagerId === "function" ? window.getAreaManagerId(areaObj, allUsers) : null) || areaObj.dmId || areaObj.districtManagerId || areaObj.managerId;
          if (areaMgrId) {
            dmUser = allUsers.find((u) => u.id === areaMgrId && this.userMatchesTier(u, "dm") && _isUserActive(u)) || null;
          }
        }
      }
      if (!dmUser && lineId) {
        dmUser = allUsers.find((u) => this.userMatchesTier(u, "dm") && _isUserActive(u) && (u.lineId === lineId || (Array.isArray(u.lineIds) && u.lineIds.includes(lineId))));
      }

      // 2. Resolve LM (next managerial escalation)
      if (dmUser && dmUser.managerId) {
        lmUser = allUsers.find((u) => u.id === dmUser.managerId && this.userMatchesTier(u, "lm") && _isUserActive(u));
      }
      if (!lmUser && rep && rep.managerId) {
        lmUser = allUsers.find((u) => u.id === rep.managerId && this.userMatchesTier(u, "lm") && _isUserActive(u));
      }
      if (!lmUser && rep && this.userMatchesTier(rep, "lm")) {
        lmUser = rep;
      }
      if (!lmUser && lineId) {
        lmUser = allUsers.find((u) => this.userMatchesTier(u, "lm") && _isUserActive(u) && (u.lineId === lineId || (Array.isArray(u.lineIds) && u.lineIds.includes(lineId))));
      }

      // 3. Resolve BU
      if (lmUser && lmUser.managerId) {
        buUser = allUsers.find((u) => u.id === lmUser.managerId && this.userMatchesTier(u, "bu") && _isUserActive(u));
      }
      if (!buUser && lineId) {
        buUser = allUsers.find((u) => this.userMatchesTier(u, "bu") && _isUserActive(u) && (u.lineId === lineId || (Array.isArray(u.lineIds) && u.lineIds.includes(lineId))));
      }
      if (!buUser) {
        buUser = allUsers.find((u) => this.userMatchesTier(u, "bu") && _isUserActive(u)) || null;
      }

      // 4. Resolve PM (Product Manager for marketing)
      if (lineId) {
        pmUser = allUsers.find((u) => this.userMatchesTier(u, "pm") && _isUserActive(u) && (u.lineId === lineId || (Array.isArray(u.lineIds) && u.lineIds.includes(lineId))));
      }
      if (!pmUser) {
        pmUser = allUsers.find((u) => this.userMatchesTier(u, "pm") && _isUserActive(u)) || null;
      }

      return {
        repId: rep ? rep.id : repId || null,
        dmId: dmUser ? dmUser.id : null,
        lmId: lmUser ? lmUser.id : null,
        buId: buUser ? buUser.id : null,
        pmId: pmUser ? pmUser.id : null,
        dmUser,
        lmUser,
        buUser,
        pmUser,
      };
    },

    /**
     * Builds the ordered sequence of steps for a service request based on its department and cost.
     * Returns array of step objects: [{ role: 'pm', status: 'pending_pm' }, ...]
     */
    getServiceSteps(service) {
      const workflows = this.getWorkflows();
      const isMarketing = service && (service.department === "marketing");
      const cfg = isMarketing ? (workflows.marketingServices || DEFAULT_WORKFLOWS.marketingServices) : (workflows.commercialServices || DEFAULT_WORKFLOWS.commercialServices);
      const cost = Number(service.cost || service.amount || 0);

      const steps = [];

      if (isMarketing) {
        if (cfg.requirePm !== false) steps.push({ role: "pm", status: "pending_pm" });
        if (cfg.requireDm) steps.push({ role: "dm", status: "pending_dm" });
        if (cfg.requireLm) steps.push({ role: "lm", status: "pending_lm" });
        const needsBu = cfg.requireBu !== false && (cfg.buThresholdMode !== "threshold" || cost >= Number(cfg.buThresholdAmount || 10000));
        if (needsBu) steps.push({ role: "bu", status: "pending_bu" });
      } else {
        if (cfg.requireDm !== false) steps.push({ role: "dm", status: "pending_dm" });
        if (cfg.requireLm !== false) steps.push({ role: "lm", status: "pending_lm" });
        const needsBu = cfg.requireBu !== false && (cfg.buThresholdMode !== "threshold" || cost >= Number(cfg.buThresholdAmount || 5000));
        if (needsBu) steps.push({ role: "bu", status: "pending_bu" });
      }

      return steps;
    },

    /**
     * Determines initial status and next approver when a service request is newly submitted.
     */
    resolveInitialServiceStatus(service, submitterUser) {
      const steps = this.getServiceSteps(service);
      const isMarketing = service && (service.department === "marketing");
      const workflows = this.getWorkflows();
      const cfg = isMarketing ? (workflows.marketingServices || DEFAULT_WORKFLOWS.marketingServices) : (workflows.commercialServices || DEFAULT_WORKFLOWS.commercialServices);
      const hierarchy = this.resolveHierarchy(service.lineId, service.areaId, submitterUser ? submitterUser.id : null);

      if (steps.length === 0) {
        return { status: "approved", nextApproverId: null, isFinal: true };
      }

      const submitterBase = this.getUserBaseRole(submitterUser);
      if (submitterBase === "admin") {
        return { status: "approved", nextApproverId: null, isFinal: true };
      }

      if (submitterBase === "hr" || submitterBase === "general_manager") {
        const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
        const adminUser = allUsers.find((u) => this.getUserBaseRole(u) === "admin" && _isUserActive(u)) || null;
        return {
          status: "pending_admin",
          nextApproverId: adminUser ? adminUser.id : null,
          isFinal: false,
        };
      }

      // Check auto-skip if enabled based on role
      let startIndex = 0;
      if (cfg.autoSkipSubmitterRole !== false) {
        if (submitterBase === "business_unit") {
          return { status: "approved", nextApproverId: null, isFinal: true };
        }
        if (submitterBase === "line_manager") {
          // Skip dm and lm steps; preserve pm if this is a marketing request
          const nextIndex = steps.findIndex((s) => s.role !== "dm" && s.role !== "lm");
          startIndex = nextIndex >= 0 ? nextIndex : steps.length;
        } else if (submitterBase === "district_manager") {
          // Skip dm step, proceed to LM (or PM/BU)
          const lmIndex = steps.findIndex((s) => s.role !== "dm");
          startIndex = lmIndex >= 0 ? lmIndex : steps.length;
        } else if (submitterBase === "product_manager") {
          // Skip pm step
          const nextIndex = steps.findIndex((s) => s.role !== "pm");
          startIndex = nextIndex >= 0 ? nextIndex : steps.length;
        }
      }

      if (startIndex >= steps.length) {
        return { status: "approved", nextApproverId: null, isFinal: true };
      }

      const targetStep = steps[startIndex];
      let approverId = null;
      if (targetStep.role === "dm") approverId = hierarchy.dmId;
      else if (targetStep.role === "lm") approverId = hierarchy.lmId;
      else if (targetStep.role === "bu") approverId = hierarchy.buId;
      else if (targetStep.role === "pm") approverId = hierarchy.pmId;

      return {
        status: targetStep.status,
        nextApproverId: approverId,
        isFinal: false,
      };
    },

    /**
     * Advances a service request to its next sequential status after approval.
     */
    advanceServiceApproval(service, currentActor) {
      const steps = this.getServiceSteps(service);
      const hierarchy = this.resolveHierarchy(service.lineId, service.areaId, service.requesterId);
      const currentStatus = service.status;

      // Find current step index in the configured sequence
      const currentIndex = steps.findIndex((s) => s.status === currentStatus);
      const nextIndex = currentIndex >= 0 ? currentIndex + 1 : steps.length;

      if (nextIndex >= steps.length) {
        return {
          nextStatus: "approved",
          nextApproverId: null,
          isFinal: true,
        };
      }

      const nextStep = steps[nextIndex];
      let approverId = null;
      if (nextStep.role === "dm") approverId = hierarchy.dmId;
      else if (nextStep.role === "lm") approverId = hierarchy.lmId;
      else if (nextStep.role === "bu") approverId = hierarchy.buId;
      else if (nextStep.role === "pm") approverId = hierarchy.pmId;

      return {
        nextStatus: nextStep.status,
        nextApproverId: approverId,
        isFinal: false,
      };
    },

    /**
     * Checks if a user is authorized to approve/reject a service request.
     */
    isServiceAuthorized(service, user, action) {
      if (!user || !service) return false;
      const baseRole = this.getUserBaseRole(user);
      const status = String(service.status || "").toLowerCase();
      const isReject = action === "reject_service";

      if (service.requesterId === user.id) return false;
      if (status === "rejected" || status === "cancelled") return false;
      if (status === "approved" && (!isReject || baseRole !== "admin")) return false;
      if (baseRole === "admin") return true;
      if (baseRole === "general_manager") return false;

      // If shared service, check per-share permissions
      if (service.isShared && Array.isArray(service.shares)) {
        if (this.userMatchesTier(user, "dm")) {
          return service.shares.some((sh) => sh.dmId === user.id && sh.status === "pending_dm");
        }
        if (this.userMatchesTier(user, "lm")) {
          return service.shares.some((sh) => sh.lmId === user.id && sh.status === "pending_lm");
        }
        if (this.userMatchesTier(user, "bu")) {
          const uLines = _getUserLineIds(user);
          const canApprove = this._isInHierarchyChain(user, service.requesterId);
          return canApprove && service.shares.some((sh) => {
            const matchesLine = uLines.length > 0 && uLines.includes(sh.lineId);
            return matchesLine && sh.status === "pending_bu";
          });
        }
        if (this.userMatchesTier(user, "pm")) {
          const pmLines = _getUserLineIds(user);
          return service.department === "marketing" && service.shares.some((sh) => {
            const matchesLine = pmLines.length > 0 && pmLines.includes(sh.lineId);
            return matchesLine && sh.status === "pending_pm";
          });
        }
      }

      // Single service direct checks
      if (status === "pending_dm" && this.userMatchesTier(user, "dm")) {
        return service.nextApproverId === user.id || (!service.nextApproverId && this._isInHierarchyChain(user, service.requesterId));
      }
      if (status === "pending_lm" && this.userMatchesTier(user, "lm")) {
        return service.nextApproverId === user.id || (!service.nextApproverId && this._isInHierarchyChain(user, service.requesterId));
      }
      if (status === "pending_bu" && this.userMatchesTier(user, "bu")) {
        const uLines = _getUserLineIds(user);
        const canApprove = this._isInHierarchyChain(user, service.requesterId);
        const matchesLine = uLines.length > 0 && uLines.includes(service.lineId);
        return canApprove && (matchesLine || service.nextApproverId === user.id);
      }
      if (status === "pending_pm" && this.userMatchesTier(user, "pm")) {
        const pmLines = _getUserLineIds(user);
        const matchesLine = pmLines.length > 0 && pmLines.includes(service.lineId);
        return matchesLine || (service.nextApproverId === user.id && (!service.lineId || pmLines.length === 0));
      }
      if (status === "pending_gm") {
        return false;
      }

      return false;
    },

    /**
     * Resolves the next status for an Expense Claim based on company settings and BU threshold.
     */
    advanceExpenseApproval(expense, currentActor) {
      const workflows = this.getWorkflows();
      const cfg = workflows.expenses || DEFAULT_WORKFLOWS.expenses;
      const amount = Number(expense.amount || 0);
      const currentStatus = expense.status;

      const allUsers = (window.store && window.store.users && window.store.users.getAll()) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const requester = allUsers.find((u) => u.id === expense.requesterId);
      const reqLineId = expense.lineId || (requester ? (requester.lineId || (Array.isArray(requester.lineIds) ? requester.lineIds[0] : null)) : null);
      const hierarchy = this.resolveHierarchy(reqLineId, expense.areaId, expense.requesterId);
      const lmId = hierarchy.lmId;
      const buId = hierarchy.buId;
      const hr = allUsers.find((u) => this.userMatchesTier(u, "hr") && _isUserActive(u)) || null;

      const needsBu = (cfg.requireBu === true) || (cfg.requireBuThreshold && amount >= Number(cfg.buThresholdAmount || 10000));
      const nextAfterBu = cfg.requireHr !== false
        ? { nextStatus: "pending_hr", nextApproverId: hr ? hr.id : null, isFinal: false }
        : { nextStatus: "approved", nextApproverId: null, isFinal: true };

      if (currentStatus === "pending_dm") {
        if (cfg.requireLm !== false) {
          return { nextStatus: "pending_lm", nextApproverId: lmId, isFinal: false };
        }
        if (needsBu) {
          return { nextStatus: "pending_bu", nextApproverId: buId, isFinal: false };
        }
        return nextAfterBu;
      }

      if (currentStatus === "pending_lm") {
        if (needsBu) {
          return { nextStatus: "pending_bu", nextApproverId: buId, isFinal: false };
        }
        return nextAfterBu;
      }

      if (currentStatus === "pending_bu") {
        return nextAfterBu;
      }

      if (currentStatus === "pending_hr") {
        return { nextStatus: "approved", nextApproverId: null, isFinal: true };
      }

      return { nextStatus: "approved", nextApproverId: null, isFinal: true };
    },

    /**
     * Checks if a user is authorized to approve/reject an expense claim.
     */
    isExpenseAuthorized(expense, user, action) {
      if (!user || !expense) return false;
      const baseRole = this.getUserBaseRole(user);
      const status = String(expense.status || "").toLowerCase();

      if (expense.requesterId === user.id) return false;

      if (action === "disburse_expense") {
        return (this.userMatchesTier(user, "hr") || baseRole === "admin") && status === "approved";
      }

      const isReject = action === "reject_expense";
      if (status === "rejected" || status === "disbursed" || status === "cancelled") return false;
      if (status === "approved" && (!isReject || baseRole !== "admin")) return false;
      if (baseRole === "admin") return true;
      if (baseRole === "medical_rep" && this.getUserLevel(user) <= 1) return false;
      if (baseRole === "general_manager") return false;

      if (status === "pending_dm") {
        if (!this.userMatchesTier(user, "dm")) return false;
        return this._isInHierarchyChain(user, expense.requesterId);
      }
      if (status === "pending_lm") {
        if (!this.userMatchesTier(user, "lm")) return false;
        return this._isInHierarchyChain(user, expense.requesterId);
      }
      if (status === "pending_bu") {
        if (!this.userMatchesTier(user, "bu")) return false;
        return this._isInHierarchyChain(user, expense.requesterId);
      }
      if (status === "pending_hr") {
        return this.userMatchesTier(user, "hr");
      }
      if (status === "pending_gm") {
        return baseRole === "admin";
      }

      return false;
    },
  };

  window.WorkflowEngine = WorkflowEngine;
})(window);
