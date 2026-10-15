/**
 * @file activities-decisions.js
 * @description Hierarchical Workflow Decision Engine: Approvals, Rejections, Disbursements & Live Notifications
 */

(function (window) {
  "use strict";

  const Core = window.ActivitiesCore;
  if (!Core) return;

  function openDecisionModal(type, requestId, decision) {
    Core._state.pendingDecision = { type, requestId, decision };
    const modal = document.getElementById("decisionModal");
    const titleEl = document.getElementById("decisionModalTitle");
    const msgEl = document.getElementById("decisionModalMessage");
    const commentInp = document.getElementById("decisionCommentInput");
    const confirmBtn = document.getElementById("decisionConfirmBtn");

    if (!modal || !titleEl || !msgEl || !confirmBtn) return;
    if (commentInp) commentInp.value = "";

    let item = null;
    if (type === "expense") {
      item = Core.StoreAdapter.getExpenses().find((e) => e.id === requestId);
    } else {
      item = Core.StoreAdapter.getServices().find((s) => s.id === requestId);
    }

    if (!item) return;

    const requesterName = Core.getUserDisplayName(item.requesterId);
    let amount = Number(item.amount || item.cost || 0).toLocaleString();

    // If shared service, clarify the manager's line share if applicable
    if (type === "service" && item.isShared && Array.isArray(item.shares)) {
      const user = Core._state.currentUser || Core.getAuthUser();
      const myShares = item.shares.filter(
        (sh) => (user.role === Core.ROLES.DM && sh.dmId === user.id) || (user.role === Core.ROLES.LM && sh.lmId === user.id)
      );
      if (myShares.length > 0) {
        const myTotal = myShares.reduce((sum, sh) => sum + (sh.shareAmount || 0), 0);
        const myPct = myShares.reduce((sum, sh) => sum + (sh.sharePercent || 0), 0);
        if (myTotal < (item.cost || 0)) {
          amount += ` (${Core.t("yourShare") || "Your Share"}: ${myPct}% - ${myTotal.toLocaleString()} ${Core.t("currency") || "EGP"})`;
        }
      }
    }

    if (decision === "approve") {
      titleEl.textContent = Core.t("confirmApprovalTitle") || "Confirm Approval";
      msgEl.textContent = (Core.t("confirmApproveMsg") || "Are you sure you want to approve this request for {amount} from {name}?")
        .replace("{amount}", amount)
        .replace("{name}", requesterName);
      confirmBtn.className = "btn btn-primary";
      confirmBtn.textContent = Core.t("btnApprove") || "Approve";
    } else if (decision === "reject") {
      titleEl.textContent = Core.t("confirmRejectionTitle") || "Confirm Rejection";
      msgEl.textContent = (Core.t("confirmRejectMsg") || "Are you sure you want to reject this request submitted by {name}?")
        .replace("{name}", requesterName);
      confirmBtn.className = "btn btn-danger";
      confirmBtn.textContent = Core.t("btnReject") || "Reject";
    } else if (decision === "disburse") {
      titleEl.textContent = Core.t("confirmDisbursementTitle") || "Confirm Disbursement";
      msgEl.textContent = (Core.t("confirmDisburseMsg") || "Are you sure you want to disburse {amount} to employee {name}?")
        .replace("{amount}", amount)
        .replace("{name}", requesterName);
      confirmBtn.className = "btn btn-success";
      confirmBtn.textContent = Core.t("btnDisburse") || "Disburse";
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeDecisionModal() {
    const modal = document.getElementById("decisionModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
    Core._state.pendingDecision = null;
  }

  function executeDecisionConfirm() {
    if (!Core._state.pendingDecision) return;
    Core._state.currentUser = Core.getAuthUser();
    const { type, requestId, decision } = Core._state.pendingDecision;
    const comment = document.getElementById("decisionCommentInput")?.value.trim() || "";

    if (decision === "reject" && !comment) {
      Core.safeShowToast(Core.t("rejectionReasonRequired") || "Please enter rejection reason.", "warning");
      return;
    }

    if (type === "expense") {
      const expenses = Core.StoreAdapter.getExpenses();
      const exp = expenses.find((e) => e.id === requestId);
      if (!exp) return;

      const actionKey = `${decision}_expense`;
      if (!Core.isActionAuthorized(actionKey, exp, Core._state.currentUser)) {
        Core.safeShowToast(Core.t("unauthorizedExpenseAction") || "You are not authorized to perform this action on this expense claim.", "warning");
        closeDecisionModal();
        return;
      }

      const actorName = Core.getUserDisplayName(Core._state.currentUser.id);

      if (decision === "reject") {
        Core.StoreAdapter.updateExpenseStatus(requestId, Core.REQUEST_STATUS.REJECTED, Core._state.currentUser, comment);
        if (exp.requesterId && exp.requesterId !== Core._state.currentUser.id) {
          Core.dispatchWorkflowNotification({
            userId: exp.requesterId,
            type: "expense_rejected",
            title: "Expense Claim Rejected",
            message: `Expense claim of ${(exp.amount || 0).toLocaleString()} EGP was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
            link: "activities.html",
            icon: "❌",
            badgeClass: "bg-danger",
            actorName: actorName,
            action: "rejected",
          });
        }
      } else if (decision === "disburse") {
        Core.StoreAdapter.updateExpenseStatus(requestId, Core.REQUEST_STATUS.DISBURSED, Core._state.currentUser, comment);
        if (exp.requesterId && exp.requesterId !== Core._state.currentUser.id) {
          Core.dispatchWorkflowNotification({
            userId: exp.requesterId,
            type: "expense_disbursed",
            title: "Expense Claim Disbursed 💰",
            message: `Expense claim of ${(exp.amount || 0).toLocaleString()} EGP has been disbursed to you.`,
            link: "activities.html",
            icon: "💰",
            badgeClass: "bg-success",
            actorName: actorName,
            action: "disbursed",
          });
        }
      } else if (decision === "approve") {
        let nextStatus = Core.REQUEST_STATUS.APPROVED;
        let nextApproverId = null;

        if (window.WorkflowEngine && typeof window.WorkflowEngine.advanceExpenseApproval === "function") {
          const adv = window.WorkflowEngine.advanceExpenseApproval(exp, Core._state.currentUser);
          nextStatus = adv.nextStatus;
          nextApproverId = adv.nextApproverId;
        } else {
          if (exp.status === Core.REQUEST_STATUS.PENDING_DM) {
            nextStatus = Core.REQUEST_STATUS.PENDING_LM;
            const allUsers = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users)) || [];
            const requester = allUsers.find((u) => u.id === exp.requesterId);
            const dm = requester && requester.managerId ? allUsers.find((u) => u.id === requester.managerId) : Core._state.currentUser;
            nextApproverId = (dm && dm.managerId) || (requester && requester.managerId) || "u1790626000012";
          } else if (exp.status === Core.REQUEST_STATUS.PENDING_LM) {
            nextStatus = Core.REQUEST_STATUS.PENDING_HR;
            const hr = Core.getHrUser();
            nextApproverId = hr ? hr.id : "u1790626000017";
          } else if (exp.status === Core.REQUEST_STATUS.PENDING_HR) {
            nextStatus = Core.REQUEST_STATUS.APPROVED;
            nextApproverId = null;
          }
        }

        Core.StoreAdapter.updateExpenseStatus(requestId, nextStatus, Core._state.currentUser, comment, nextApproverId);

        if (nextStatus === Core.REQUEST_STATUS.APPROVED) {
          if (exp.requesterId && exp.requesterId !== Core._state.currentUser.id) {
            Core.dispatchWorkflowNotification({
              userId: exp.requesterId,
              type: "expense_approved",
              title: "Expense Claim Approved ✅",
              message: `${actorName} approved your expense claim of ${(exp.amount || 0).toLocaleString()} EGP.`,
              link: "activities.html",
              icon: "✅",
              badgeClass: "bg-success",
              actorName: actorName,
              action: "approved",
            });
          }
        } else if (nextApproverId) {
          let stepTitle = "Expense Claim Pending Review";
          if (nextStatus === Core.REQUEST_STATUS.PENDING_LM) stepTitle = "Expense Claim Pending Line Manager Approval";
          else if (nextStatus === Core.REQUEST_STATUS.PENDING_BU || nextStatus === "pending_bu") stepTitle = "Expense Claim Pending BU Manager Approval";
          else if (nextStatus === Core.REQUEST_STATUS.PENDING_HR) stepTitle = "Expense Claim Pending HR Approval";

          Core.dispatchWorkflowNotification({
            userId: nextApproverId,
            type: "expense_approval",
            title: stepTitle,
            message: `${actorName} approved expense claim of ${(exp.amount || 0).toLocaleString()} EGP submitted by ${Core.getUserDisplayName(exp.requesterId)}, awaiting your approval.`,
            link: "activities.html",
            icon: "⏳",
            badgeClass: "bg-warning",
            actorName: actorName,
            action: "pending_approval",
          });
        }
      }

      if (window.ActivitiesExpenses && window.ActivitiesExpenses.renderExpensesTab) {
        window.ActivitiesExpenses.renderExpensesTab();
      }
    } else if (type === "service") {
      const services = Core.StoreAdapter.getServices();
      const srv = services.find((s) => s.id === requestId);
      if (!srv) return;

      const actionKey = `${decision}_service`;
      if (!Core.isActionAuthorized(actionKey, srv, Core._state.currentUser)) {
        Core.safeShowToast(Core.t("unauthorizedServiceAction") || "You are not authorized to perform this action on this service request.", "warning");
        closeDecisionModal();
        return;
      }

      const actorName = Core.getUserDisplayName(Core._state.currentUser.id);

      if (srv.isShared && Array.isArray(srv.shares) && srv.shares.length > 0) {
        if (decision === "reject") {
          srv.status = Core.REQUEST_STATUS.REJECTED;
          srv.shares.forEach((sh) => {
            if (sh.status !== Core.REQUEST_STATUS.APPROVED) sh.status = Core.REQUEST_STATUS.REJECTED;
          });
          if (!srv.history) srv.history = [];
          srv.history.push({
            action: Core.REQUEST_STATUS.REJECTED,
            at: new Date().toISOString(),
            by: Core._state.currentUser.id,
            role: Core._state.currentUser.role,
            comment: comment || "",
          });
          Core.StoreAdapter.saveService(srv);

          const notifiedRejectUsers = new Set();
          if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
            notifiedRejectUsers.add(srv.requesterId);
            Core.dispatchWorkflowNotification({
              userId: srv.requesterId,
              type: "service_rejected",
              title: "Shared Service Request Rejected",
              message: `Shared service request (${srv.title}) was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
              link: "activities.html",
              icon: "❌",
              badgeClass: "bg-danger",
              actorName: actorName,
              action: "rejected",
            });
          }
          if (srv.shares) {
            srv.shares.forEach((sh) => {
              if (sh.repId && sh.repId !== Core._state.currentUser.id && !notifiedRejectUsers.has(sh.repId)) {
                notifiedRejectUsers.add(sh.repId);
                Core.dispatchWorkflowNotification({
                  userId: sh.repId,
                  type: "service_rejected",
                  title: "Shared Service Request Rejected",
                  message: `Shared service request (${srv.title}) was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
                  link: "activities.html",
                  icon: "❌",
                  badgeClass: "bg-danger",
                  actorName: actorName,
                  action: "rejected",
                });
              }
            });
          }
        } else if (decision === "approve") {
          const userRole = Core._state.currentUser.role;
          const userId = Core._state.currentUser.id;

          if (userRole === Core.ROLES.ADMIN || userRole === Core.ROLES.BU) {
            srv.shares.forEach((sh) => {
              sh.status = Core.REQUEST_STATUS.APPROVED;
              sh.nextApproverId = null;
            });
            srv.status = Core.REQUEST_STATUS.APPROVED;
          } else if (userRole === Core.ROLES.DM) {
            srv.shares.forEach((sh) => {
              if (sh.dmId === userId && sh.status === Core.REQUEST_STATUS.PENDING_DM) {
                if (window.WorkflowEngine && typeof window.WorkflowEngine.advanceServiceApproval === "function") {
                  const adv = window.WorkflowEngine.advanceServiceApproval({
                    department: srv.department,
                    cost: sh.shareAmount,
                    lineId: sh.lineId,
                    status: sh.status
                  }, Core._state.currentUser);
                  sh.status = adv.nextStatus;
                  sh.nextApproverId = adv.nextApproverId;
                } else {
                  sh.status = Core.REQUEST_STATUS.PENDING_LM;
                  sh.nextApproverId = sh.lmId;
                }
                if (!sh.approvedBy) sh.approvedBy = [];
                sh.approvedBy.push(userId);
              }
            });
          } else if (userRole === Core.ROLES.LM) {
            srv.shares.forEach((sh) => {
              if (sh.lmId === userId && sh.status === Core.REQUEST_STATUS.PENDING_LM) {
                if (window.WorkflowEngine && typeof window.WorkflowEngine.advanceServiceApproval === "function") {
                  const adv = window.WorkflowEngine.advanceServiceApproval({
                    department: srv.department,
                    cost: sh.shareAmount,
                    lineId: sh.lineId,
                    status: sh.status
                  }, Core._state.currentUser);
                  sh.status = adv.nextStatus;
                  sh.nextApproverId = adv.nextApproverId;
                } else {
                  sh.status = Core.REQUEST_STATUS.APPROVED;
                  sh.nextApproverId = null;
                }
                if (!sh.approvedBy) sh.approvedBy = [];
                sh.approvedBy.push(userId);
              }
            });
          } else if (userRole === Core.ROLES.PM) {
            const userLines = Core._state.currentUser.lineIds || (Core._state.currentUser.lineId ? [Core._state.currentUser.lineId] : []);
            srv.shares.forEach((sh) => {
              if (userLines.includes(sh.lineId) && sh.status && sh.status.startsWith("pending")) {
                if (window.WorkflowEngine && typeof window.WorkflowEngine.advanceServiceApproval === "function") {
                  const adv = window.WorkflowEngine.advanceServiceApproval({
                    department: srv.department,
                    cost: sh.shareAmount,
                    lineId: sh.lineId,
                    status: sh.status
                  }, Core._state.currentUser);
                  sh.status = adv.nextStatus;
                  sh.nextApproverId = adv.nextApproverId;
                } else {
                  sh.status = Core.REQUEST_STATUS.APPROVED;
                  sh.nextApproverId = null;
                }
                if (!sh.approvedBy) sh.approvedBy = [];
                sh.approvedBy.push(userId);
              }
            });
          }

          const allApproved = srv.shares.every((sh) => sh.status === Core.REQUEST_STATUS.APPROVED);
          if (allApproved) {
            srv.status = Core.REQUEST_STATUS.APPROVED;
            srv.nextApproverId = null;
          } else {
            srv.status = Core.REQUEST_STATUS.PENDING_SHARED;
          }

          if (!srv.history) srv.history = [];
          srv.history.push({
            action: allApproved ? "fully_approved" : "partially_approved",
            at: new Date().toISOString(),
            by: Core._state.currentUser.id,
            role: Core._state.currentUser.role,
            comment: comment || "",
          });
          Core.StoreAdapter.saveService(srv);

          if (allApproved) {
            const notifiedApproveUsers = new Set();
            if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
              notifiedApproveUsers.add(srv.requesterId);
              Core.dispatchWorkflowNotification({
                userId: srv.requesterId,
                type: "service_fully_approved",
                title: "Shared Service Request Fully Approved! 🎉",
                message: `Shared service request (${srv.title}) has been fully approved by all managers for ${srv.cost.toLocaleString()} EGP.`,
                link: "activities.html",
                icon: "✅",
                badgeClass: "bg-success",
                actorName: actorName,
                action: "approved",
              });
            }
            if (srv.shares) {
              srv.shares.forEach((sh) => {
                if (sh.repId && sh.repId !== Core._state.currentUser.id && !notifiedApproveUsers.has(sh.repId)) {
                  notifiedApproveUsers.add(sh.repId);
                  Core.dispatchWorkflowNotification({
                    userId: sh.repId,
                    type: "service_fully_approved",
                    title: "Shared Service Request Approved 🎉",
                    message: `Shared service request (${srv.title}) was approved with your share (${sh.sharePercent}% - ${sh.shareAmount.toLocaleString()} EGP).`,
                    link: "activities.html",
                    icon: "✅",
                    badgeClass: "bg-success",
                    actorName: actorName,
                    action: "approved",
                  });
                }
              });
            }
          } else {
            const notifiedNextLms = new Set();
            srv.shares.forEach((sh) => {
              if (
                sh.status === Core.REQUEST_STATUS.PENDING_LM &&
                sh.nextApproverId &&
                sh.nextApproverId !== Core._state.currentUser.id &&
                !notifiedNextLms.has(sh.nextApproverId)
              ) {
                notifiedNextLms.add(sh.nextApproverId);
                Core.dispatchWorkflowNotification({
                  userId: sh.nextApproverId,
                  type: "shared_service_approval",
                  title: "Shared Service Request Pending Approval",
                  message: `Shared service request (${srv.title}) approved by DM is now awaiting your final approval.`,
                  link: "activities.html",
                  icon: "⏳",
                  badgeClass: "bg-warning",
                  actorName: actorName,
                  action: "pending_approval",
                });
              }
            });

            if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
              Core.dispatchWorkflowNotification({
                userId: srv.requesterId,
                type: "service_share_approved",
                title: "Shared Service Share Approved",
                message: `${actorName} approved a share in service request (${srv.title}), moving it to next stage.`,
                link: "activities.html",
                icon: "⏳",
                badgeClass: "bg-info",
                actorName: actorName,
                action: "share_approved",
              });
            }
          }
        }
      } else {
        if (decision === "reject") {
          Core.StoreAdapter.updateServiceStatus(requestId, Core.REQUEST_STATUS.REJECTED, Core._state.currentUser, comment, null);
          if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
            Core.dispatchWorkflowNotification({
              userId: srv.requesterId,
              type: "service_rejected",
              title: "Service Request Rejected",
              message: `Service request (${srv.title}) was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
              link: "activities.html",
              icon: "❌",
              badgeClass: "bg-danger",
              actorName: actorName,
              action: "rejected",
            });
          }
        } else if (decision === "approve") {
          let nextStatus = Core.REQUEST_STATUS.APPROVED;
          let nextApproverId = null;

          if (window.WorkflowEngine && typeof window.WorkflowEngine.advanceServiceApproval === "function") {
            const adv = window.WorkflowEngine.advanceServiceApproval(srv, Core._state.currentUser);
            nextStatus = adv.nextStatus;
            nextApproverId = adv.nextApproverId;
          } else {
            if (srv.status === Core.REQUEST_STATUS.PENDING_DM) {
              const dm = Core.getUserById(srv.requesterId);
              const lm = dm && dm.managerId ? dm.managerId : Core._state.currentUser.managerId || "u1790626000012";
              nextStatus = Core.REQUEST_STATUS.PENDING_LM;
              nextApproverId = lm;
            } else {
              nextStatus = Core.REQUEST_STATUS.APPROVED;
              nextApproverId = null;
            }
          }

          Core.StoreAdapter.updateServiceStatus(requestId, nextStatus, Core._state.currentUser, comment, nextApproverId);

          if (nextStatus === Core.REQUEST_STATUS.APPROVED) {
            if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
              Core.dispatchWorkflowNotification({
                userId: srv.requesterId,
                type: "service_approved",
                title: "Service Request Approved! 🎉",
                message: `Service request (${srv.title}) was approved for ${srv.cost.toLocaleString()} EGP.`,
                link: "activities.html",
                icon: "✅",
                badgeClass: "bg-success",
                actorName: actorName,
                action: "approved",
              });
            }
          } else if (nextApproverId) {
            let stepTitle = "Service Request Pending Approval";
            if (nextStatus === Core.REQUEST_STATUS.PENDING_LM) stepTitle = "Service Request Pending Line Manager Approval";
            else if (nextStatus === Core.REQUEST_STATUS.PENDING_BU || nextStatus === "pending_bu") stepTitle = "Service Request Pending BU Manager Approval";
            else if (nextStatus === Core.REQUEST_STATUS.PENDING_PM || nextStatus === "pending_pm") stepTitle = "Marketing Service Request Pending PM Review";
            else if (nextStatus === Core.REQUEST_STATUS.PENDING_GM || nextStatus === "pending_gm") stepTitle = "Service Request Pending General Manager Approval";

            Core.dispatchWorkflowNotification({
              userId: nextApproverId,
              type: "service_approval",
              title: stepTitle,
              message: `${actorName} approved service request (${srv.title}), awaiting your review.`,
              link: "activities.html",
              icon: "⏳",
              badgeClass: "bg-warning",
              actorName: actorName,
              action: "pending_approval",
            });

            if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
              Core.dispatchWorkflowNotification({
                userId: srv.requesterId,
                type: "service_forwarded",
                title: "Service Request Forwarded",
                message: `${actorName} approved service request (${srv.title}) and forwarded to next stage.`,
                link: "activities.html",
                icon: "⏳",
                badgeClass: "bg-info",
                actorName: actorName,
                action: "forwarded",
              });
            }
          }
        }
      }

      if (window.ActivitiesServices && window.ActivitiesServices.renderServicesTab) {
        window.ActivitiesServices.renderServicesTab();
      }
    }

    closeDecisionModal();
    Core.safeShowToast(Core.t("successAction") || "Action completed successfully.", "success");
  }

  function openReceiptPreviewModal(url) {
    if (window.ActivitiesExpenses && typeof window.ActivitiesExpenses.openReceiptPreviewModal === "function") {
      return window.ActivitiesExpenses.openReceiptPreviewModal(url);
    }
    const modal = document.getElementById("receiptPreviewModal");
    const img = document.getElementById("receiptModalLargeImg");
    if (!modal || !img) return;
    img.src = url;
    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeReceiptPreviewModal() {
    if (window.ActivitiesExpenses && typeof window.ActivitiesExpenses.closeReceiptPreviewModal === "function") {
      return window.ActivitiesExpenses.closeReceiptPreviewModal();
    }
    const modal = document.getElementById("receiptPreviewModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  window.ActivitiesDecisions = {
    openDecisionModal,
    closeDecisionModal,
    executeDecisionConfirm,
    openReceiptPreviewModal,
    closeReceiptPreviewModal,
  };
})(window);