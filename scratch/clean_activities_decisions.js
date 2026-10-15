const fs = require('fs');

let content = fs.readFileSync('js/activities-decisions.js', 'utf8');

content = content.replace(
  'amount += ` (${Core.t("yourShare") || "حصتك"}: ${myPct}% - ${myTotal.toLocaleString()} ${Core.t("currency") || "ج.م"})`;',
  'amount += ` (${Core.t("yourShare") || "Your Share"}: ${myPct}% - ${myTotal.toLocaleString()} ${Core.t("currency") || "EGP"})`;'
);

content = content.replace(
  'titleEl.textContent = Core.t("confirmApprovalTitle") || "تأكيد الاعتماد";',
  'titleEl.textContent = Core.t("confirmApprovalTitle") || "Confirm Approval";'
);

content = content.replace(
  'msgEl.textContent = (Core.t("confirmApproveMsg") || "هل أنت متأكد من اعتماد هذا الطلب بمبلغ {amount} للموظف {name}؟")',
  'msgEl.textContent = (Core.t("confirmApproveMsg") || "Are you sure you want to approve this request for {amount} from {name}?")'
);

content = content.replace(
  'confirmBtn.textContent = Core.t("btnApprove") || "اعتماد";',
  'confirmBtn.textContent = Core.t("btnApprove") || "Approve";'
);

content = content.replace(
  'titleEl.textContent = Core.t("confirmRejectionTitle") || "تأكيد الرفض";',
  'titleEl.textContent = Core.t("confirmRejectionTitle") || "Confirm Rejection";'
);

content = content.replace(
  'msgEl.textContent = (Core.t("confirmRejectMsg") || "هل أنت متأكد من رفض هذا الطلب المقدم من {name}؟")',
  'msgEl.textContent = (Core.t("confirmRejectMsg") || "Are you sure you want to reject this request submitted by {name}?")'
);

content = content.replace(
  'confirmBtn.textContent = Core.t("btnReject") || "رفض";',
  'confirmBtn.textContent = Core.t("btnReject") || "Reject";'
);

content = content.replace(
  'titleEl.textContent = Core.t("confirmDisbursementTitle") || "تأكيد الصرف المالي";',
  'titleEl.textContent = Core.t("confirmDisbursementTitle") || "Confirm Disbursement";'
);

content = content.replace(
  'msgEl.textContent = (Core.t("confirmDisburseMsg") || "هل أنت متأكد من صرف مبلغ {amount} للموظف {name}؟")',
  'msgEl.textContent = (Core.t("confirmDisburseMsg") || "Are you sure you want to disburse {amount} to employee {name}?")'
);

content = content.replace(
  'confirmBtn.textContent = Core.t("btnDisburse") || "صرف مالي";',
  'confirmBtn.textContent = Core.t("btnDisburse") || "Disburse";'
);

content = content.replace(
  'Core.safeShowToast(Core.t("rejectionReasonRequired") || "يرجى كتابة سبب الرفض", "warning");',
  'Core.safeShowToast(Core.t("rejectionReasonRequired") || "Please enter rejection reason.", "warning");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("unauthorizedExpenseAction") || "غير مصرح لك بتنفيذ هذا الإجراء على هذه المطالبة وفقاً للصلاحيات الإدارية.", "warning");',
  'Core.safeShowToast(Core.t("unauthorizedExpenseAction") || "You are not authorized to perform this action on this expense claim.", "warning");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("unauthorizedServiceAction") || "غير مصرح لك بتنفيذ هذا الإجراء على هذا الطلب وفقاً للصلاحيات الإدارية.", "warning");',
  'Core.safeShowToast(Core.t("unauthorizedServiceAction") || "You are not authorized to perform this action on this service request.", "warning");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("successAction") || "تمت العملية بنجاح", "success");',
  'Core.safeShowToast(Core.t("successAction") || "Action completed successfully.", "success");'
);

fs.writeFileSync('js/activities-decisions.js', content, 'utf8');
console.log('activities-decisions.js cleaned. Remaining Arabic:', /[\u0600-\u06FF]/.test(content));
