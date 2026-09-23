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
          amount += ` (${Core.t("yourShare") || "حصتك"}: ${myPct}% - ${myTotal.toLocaleString()} ${Core.t("currency") || "ج.م"})`;
        }
      }
    }

    if (decision === "approve") {
      titleEl.textContent = Core.t("confirmApprovalTitle") || "تأكيد الاعتماد";
      msgEl.textContent = (Core.t("confirmApproveMsg") || "هل أنت متأكد من اعتماد هذا الطلب بمبلغ {amount} للموظف {name}؟")
        .replace("{amount}", amount)
        .replace("{name}", requesterName);
      confirmBtn.className = "btn btn-primary";
      confirmBtn.textContent = Core.t("btnApprove") || "اعتماد";
    } else if (decision === "reject") {
      titleEl.textContent = Core.t("confirmRejectionTitle") || "تأكيد الرفض";
      msgEl.textContent = (Core.t("confirmRejectMsg") || "هل أنت متأكد من رفض هذا الطلب المقدم من {name}؟")
        .replace("{name}", requesterName);
      confirmBtn.className = "btn btn-danger";
      confirmBtn.textContent = Core.t("btnReject") || "رفض";
    } else if (decision === "disburse") {
      titleEl.textContent = Core.t("confirmDisbursementTitle") || "تأكيد الصرف المالي";
      msgEl.textContent = (Core.t("confirmDisburseMsg") || "هل أنت متأكد من صرف مبلغ {amount} للموظف {name}؟")
        .replace("{amount}", amount)
        .replace("{name}", requesterName);
      confirmBtn.className = "btn btn-success";
      confirmBtn.textContent = Core.t("btnDisburse") || "صرف مالي";
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
      Core.safeShowToast(Core.t("rejectionReasonRequired") || "يرجى كتابة سبب الرفض", "warning");
      return;
    }

    if (type === "expense") {
      const expenses = Core.StoreAdapter.getExpenses();
      const exp = expenses.find((e) => e.id === requestId);
      if (!exp) return;
      const actorName = Core.getUserDisplayName(Core._state.currentUser.id);

      if (decision === "reject") {
        Core.StoreAdapter.updateExpenseStatus(requestId, Core.REQUEST_STATUS.REJECTED, Core._state.currentUser, comment);
        if (exp.requesterId && exp.requesterId !== Core._state.currentUser.id) {
          Core.dispatchWorkflowNotification({
            userId: exp.requesterId,
            type: "expense_rejected",
            title: "تم رفض مطالبة المصروفات",
            titleEn: "Expense Claim Rejected",
            message: `تم رفض مطالبة المصروفات بقيمة ${(exp.amount || 0).toLocaleString()} ج.م بواسطة ${actorName}.${comment ? " السبب: " + comment : ""}`,
            messageEn: `Expense claim of ${(exp.amount || 0).toLocaleString()} EGP was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
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
            title: "تم صرف المصروفات 💰",
            titleEn: "Expense Claim Disbursed 💰",
            message: `تم صرف مبلغ المصروفات بقيمة ${(exp.amount || 0).toLocaleString()} ج.م في حسابك.`,
            messageEn: `Expense claim of ${(exp.amount || 0).toLocaleString()} EGP has been disbursed to you.`,
            link: "activities.html",
            icon: "💰",
            badgeClass: "bg-success",
            actorName: actorName,
            action: "disbursed",
          });
        }
      } else if (decision === "approve") {
        if (!Core.isActionAuthorized("approve_expense", exp, Core._state.currentUser)) {
          Core.safeShowToast(Core.t("unauthorizedExpenseApproval") || "غير مصرح لك باعتماد هذه المطالبة وفقاً للصلاحيات الإدارية.", "warning");
          closeDecisionModal();
          return;
        }
        let nextStatus = Core.REQUEST_STATUS.PENDING_HR;
        let nextApproverId = null;
        if (exp.status === Core.REQUEST_STATUS.PENDING_DM || exp.status === Core.REQUEST_STATUS.PENDING_LM) {
          nextStatus = Core.REQUEST_STATUS.PENDING_HR;
          const hr = Core.getHrUser();
          nextApproverId = hr ? hr.id : "hr1";
        } else if (exp.status === Core.REQUEST_STATUS.PENDING_HR) {
          nextStatus = Core.REQUEST_STATUS.APPROVED;
        }
        Core.StoreAdapter.updateExpenseStatus(requestId, nextStatus, Core._state.currentUser, comment);

        if (nextStatus === Core.REQUEST_STATUS.APPROVED) {
          if (exp.requesterId && exp.requesterId !== Core._state.currentUser.id) {
            Core.dispatchWorkflowNotification({
              userId: exp.requesterId,
              type: "expense_approved",
              title: "تم اعتماد طلب المصروفات ✅",
              titleEn: "Expense Claim Approved ✅",
              message: `اعتمد ${actorName} مطالبة المصروفات بقيمة ${(exp.amount || 0).toLocaleString()} ج.م.`,
              messageEn: `${actorName} approved your expense claim of ${(exp.amount || 0).toLocaleString()} EGP.`,
              link: "activities.html",
              icon: "✅",
              badgeClass: "bg-success",
              actorName: actorName,
              action: "approved",
            });
          }
        } else if (nextApproverId) {
          Core.dispatchWorkflowNotification({
            userId: nextApproverId,
            type: "expense_approval",
            title: "طلب مصروفات بانتظار اعتماد الموارد البشرية (HR)",
            titleEn: "Expense Claim Pending HR Approval",
            message: `اعتمد المدير مطالبة المصروفات بقيمة ${(exp.amount || 0).toLocaleString()} ج.م والمقدمة من ${Core.getUserDisplayName(exp.requesterId)}، وبانتظار اعتمادك.`,
            messageEn: `Manager approved expense claim of ${(exp.amount || 0).toLocaleString()} EGP submitted by ${Core.getUserDisplayName(exp.requesterId)}, awaiting your approval.`,
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

      if (decision === "approve") {
        if (!Core.isActionAuthorized("approve_service", srv, Core._state.currentUser)) {
          Core.safeShowToast(Core.t("unauthorizedServiceApproval") || "غير مصرح لك باعتماد هذا الطلب وفقاً للصلاحيات الإدارية.", "warning");
          closeDecisionModal();
          return;
        }
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
              title: "تم رفض طلب الخدمة المشتركة",
              titleEn: "Shared Service Request Rejected",
              message: `تم رفض طلب الخدمة المشتركة (${srv.title}) بواسطة ${actorName}.${comment ? " السبب: " + comment : ""}`,
              messageEn: `Shared service request (${srv.title}) was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
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
                  title: "تم رفض طلب الخدمة المشتركة",
                  titleEn: "Shared Service Request Rejected",
                  message: `تم رفض طلب الخدمة المشتركة (${srv.title}) بواسطة ${actorName}.${comment ? " السبب: " + comment : ""}`,
                  messageEn: `Shared service request (${srv.title}) was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
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
                sh.status = Core.REQUEST_STATUS.PENDING_LM;
                sh.nextApproverId = sh.lmId;
                if (!sh.approvedBy) sh.approvedBy = [];
                sh.approvedBy.push(userId);
              }
            });
          } else if (userRole === Core.ROLES.LM) {
            srv.shares.forEach((sh) => {
              if (sh.lmId === userId && sh.status === Core.REQUEST_STATUS.PENDING_LM) {
                sh.status = Core.REQUEST_STATUS.APPROVED;
                sh.nextApproverId = null;
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
                title: "تم اعتماد طلب الخدمة المشتركة بالكامل! 🎉",
                titleEn: "Shared Service Request Fully Approved! 🎉",
                message: `تم اعتماد طلب الخدمة المشتركة (${srv.title}) بالكامل من كافة المديرين بتكلفة ${srv.cost.toLocaleString()} ج.م.`,
                messageEn: `Shared service request (${srv.title}) has been fully approved by all managers for ${srv.cost.toLocaleString()} EGP.`,
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
                    title: "تم اعتماد طلب الخدمة المشتركة 🎉",
                    titleEn: "Shared Service Request Approved 🎉",
                    message: `تم اعتماد طلب الخدمة المشتركة (${srv.title}) بنجاح بحصة منطقتك (${sh.sharePercent}% - ${sh.shareAmount.toLocaleString()} ج.م).`,
                    messageEn: `Shared service request (${srv.title}) was approved with your share (${sh.sharePercent}% - ${sh.shareAmount.toLocaleString()} EGP).`,
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
                  title: "طلب خدمة مشتركة بانتظار اعتمادك",
                  titleEn: "Shared Service Request Pending Approval",
                  message: `طلب الخدمة المشتركة (${srv.title}) تم اعتماده من المشرف (DM) وبانتظار اعتمادك النهائي.`,
                  messageEn: `Shared service request (${srv.title}) approved by DM is now awaiting your final approval.`,
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
                title: "تم اعتماد حصة في طلب الخدمة المشتركة",
                titleEn: "Shared Service Share Approved",
                message: `اعتمد ${actorName} حصة في طلب الخدمة (${srv.title}) وانتقلت للمرحلة التالية.`,
                messageEn: `${actorName} approved a share in service request (${srv.title}), moving it to next stage.`,
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
              title: "تم رفض طلب الخدمة",
              titleEn: "Service Request Rejected",
              message: `تم رفض طلب الخدمة (${srv.title}) بواسطة ${actorName}.${comment ? " السبب: " + comment : ""}`,
              messageEn: `Service request (${srv.title}) was rejected by ${actorName}.${comment ? " Reason: " + comment : ""}`,
              link: "activities.html",
              icon: "❌",
              badgeClass: "bg-danger",
              actorName: actorName,
              action: "rejected",
            });
          }
        } else if (decision === "approve") {
          if (srv.status === Core.REQUEST_STATUS.PENDING_DM) {
            const dm = Core.getUserById(srv.requesterId);
            const lm = dm && dm.managerId ? dm.managerId : Core._state.currentUser.managerId || "lm1";
            Core.StoreAdapter.updateServiceStatus(requestId, Core.REQUEST_STATUS.PENDING_LM, Core._state.currentUser, comment, lm);

            Core.dispatchWorkflowNotification({
              userId: lm,
              type: "service_approval",
              title: "طلب خدمة بانتظار اعتمادك",
              titleEn: "Service Request Pending Approval",
              message: `اعتمد المشرف (DM) طلب الخدمة (${srv.title}) وبانتظار اعتمادك.`,
              messageEn: `DM approved service request (${srv.title}) and is pending your approval.`,
              link: "activities.html",
              icon: "⏳",
              badgeClass: "bg-warning",
              actorName: actorName,
              action: "pending_approval",
            });

            if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
              Core.dispatchWorkflowNotification({
                userId: srv.requesterId,
                type: "service_approved_by_dm",
                title: "اعتمد الـ DM طلب الخدمة",
                titleEn: "DM Approved Service Request",
                message: `اعتمد المشرف طلب الخدمة (${srv.title}) وانتقل لمدير الخط.`,
                messageEn: `Your DM approved service request (${srv.title}) and forwarded to LM.`,
                link: "activities.html",
                icon: "⏳",
                badgeClass: "bg-info",
                actorName: actorName,
                action: "forwarded",
              });
            }
          } else if (
            srv.status === Core.REQUEST_STATUS.PENDING_LM ||
            Core._state.currentUser.role === Core.ROLES.ADMIN ||
            Core._state.currentUser.role === Core.ROLES.BU
          ) {
            Core.StoreAdapter.updateServiceStatus(requestId, Core.REQUEST_STATUS.APPROVED, Core._state.currentUser, comment, null);
            if (srv.requesterId && srv.requesterId !== Core._state.currentUser.id) {
              Core.dispatchWorkflowNotification({
                userId: srv.requesterId,
                type: "service_approved",
                title: "تم اعتماد طلب الخدمة بنجاح! 🎉",
                titleEn: "Service Request Approved! 🎉",
                message: `تم اعتماد طلب الخدمة (${srv.title}) بتكلفة ${srv.cost.toLocaleString()} ج.م.`,
                messageEn: `Service request (${srv.title}) was approved for ${srv.cost.toLocaleString()} EGP.`,
                link: "activities.html",
                icon: "✅",
                badgeClass: "bg-success",
                actorName: actorName,
                action: "approved",
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
    Core.safeShowToast(Core.t("successAction") || "تمت العملية بنجاح", "success");
  }

  function openReceiptPreviewModal(imgSrc) {
    const modal = document.getElementById("receiptPreviewModal");
    const img = document.getElementById("receiptModalLargeImg");
    if (!modal || !img) return;
    img.src = imgSrc;
    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeReceiptPreviewModal() {
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