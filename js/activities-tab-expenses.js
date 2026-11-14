/**
 * @file activities-tab-expenses.js
 * @description Tab 2: Travel & Field Expenses, Receipt Attachment Compression & Filters
 */

(function (window) {
  "use strict";
  const Core = window.ActivitiesCore;
  if (!Core) return;

  function populateExpenseFilters() {
    Core._state.currentUser = Core.getAuthUser();
    const user = Core._state.currentUser;
    const currentUserId = user ? user.id : "";

    const lineSelect = document.getElementById("expenseFilterLine");
    if (lineSelect && lineSelect.dataset.lastUser !== currentUserId) {
      const assignedLines = Core.getUserAssignedLines(user);
      const userRole = (user?.role || "").toLowerCase();
      const canSeeAll = user && (userRole === Core.ROLES.ADMIN || userRole === Core.ROLES.HR);
      let html = "";
      if (canSeeAll || assignedLines.length > 1) {
        html += `<option value="all">${Core.t("allLines")}</option>`;
      }
      html += assignedLines.map((l) => `<option value="${l.id}">${Core.escapeHTML(l.name)}</option>`).join("");
      lineSelect.innerHTML = html;
      lineSelect.value = canSeeAll || assignedLines.length > 1 ? "all" : (assignedLines[0]?.id || "all");
      lineSelect.dataset.lastUser = currentUserId;
    }

    updateEmployeeFilter();
  }

  function updateEmployeeFilter() {
    const user = Core._state.currentUser;
    const empSelect = document.getElementById("expenseFilterEmployee");
    if (!empSelect) return;
    if (!user) {
      empSelect.style.display = "none";
      return;
    }

    const role = (user.role || "").toLowerCase();
    if (role === Core.ROLES.REP || role === Core.ROLES.REP_ALT) {
      empSelect.style.display = "none";
      return;
    }

    empSelect.style.display = "inline-block";
    const selectedLine = document.getElementById("expenseFilterLine")?.value || "all";
    const subs = Core.getSubordinatesForUser(user, selectedLine);
    const curVal = empSelect.value;

    empSelect.innerHTML = `
      <option value="all">${Core.t("allEmployees")}</option>
      <option value="${Core.escapeHTML(user.id)}">${Core.t("myRequestsOnly")}</option>
      ${subs
        .map(
          (s) =>
            `<option value="${s.id}">${Core.escapeHTML(Core.getUserDisplayName(s.id))} (${Core.escapeHTML(
              Core.getUserRoleLabel(s.role)
            )})</option>`
        )
        .join("")}
    `;

    if (curVal && empSelect.querySelector(`option[value="${curVal}"]`)) {
      empSelect.value = curVal;
    } else {
      empSelect.value = "all";
    }
  }

  function onExpenseLineFilterChange() {
    updateEmployeeFilter();
    filterExpenses();
  }

  function renderExpensesTab() {
    populateExpenseFilters();
    filterExpenses();
  }

  function filterExpenses() {
    Core._state.currentUser = Core.getAuthUser();
    const user = Core._state.currentUser;
    const allExp = Core.StoreAdapter.getExpenses();

    const lineFilter = document.getElementById("expenseFilterLine")?.value || "all";
    const empFilter = document.getElementById("expenseFilterEmployee")?.value || "all";
    const statusFilter = document.getElementById("expenseFilterStatus")?.value || "all";
    const categoryFilter = document.getElementById("expenseFilterCategory")?.value || "all";

    const filtered = allExp.filter((e) => {
      if (!canUserViewExpense(e, user)) return false;
      const matchLine = lineFilter === "all" || e.lineId === lineFilter;
      const matchEmp = empFilter === "all" || e.requesterId === empFilter;
      const matchStatus =
        statusFilter === "all" ||
        e.status === statusFilter ||
        (statusFilter === "pending" && e.status && e.status.startsWith("pending"));
      const matchCat = categoryFilter === "all" || e.category === categoryFilter;
      return matchLine && matchEmp && matchStatus && matchCat;
    });

    renderExpensesMetrics(filtered);
    renderExpensesTable(filtered);
  }

  function canUserViewExpense(exp, user) {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    if (role === Core.ROLES.ADMIN || role === Core.ROLES.HR || role === "admin" || role === "hr") return true;
    if (role === "general_manager" || role === "gm" || role === "finance" || role === "finance_manager" || role === "commercial_director") return true;
    if (exp.requesterId === user.id) return true;
    if (role === Core.ROLES.PM || role === "product_manager" || role === "pm") {
      const userLines = Core.getUserAssignedLines(user).map((l) => l.id);
      return userLines.length === 0 || (exp.lineId && userLines.includes(exp.lineId));
    }
    if (role === Core.ROLES.BU) {
      if (typeof window.canApproveFor === "function" && window.canApproveFor(exp.requesterId)) return true;
      const subordinates = typeof window.getAllSubordinates === "function" ? window.getAllSubordinates(user.id) : [];
      return subordinates.some((s) => s.id === exp.requesterId);
    }
    if (role === Core.ROLES.DM) {
      const requester = Core.getUserById(exp.requesterId);
      return requester && requester.managerId === user.id;
    }
    if (role === Core.ROLES.LM) {
      const requester = Core.getUserById(exp.requesterId);
      if (!requester) return false;
      if (requester.managerId === user.id) return true;
      const directMgr = Core.getUserById(requester.managerId);
      return directMgr && directMgr.managerId === user.id;
    }
    return false;
  }

  function renderExpensesMetrics(allList) {
    const user = Core._state.currentUser;
    const userVisible = allList.filter((e) => canUserViewExpense(e, user));

    let pendingTotal = 0;
    let approvedTotal = 0;
    let disbursedTotal = 0;

    userVisible.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (String(e.status || "").startsWith("pending")) {
        pendingTotal += amt;
      }
      if (e.status === Core.REQUEST_STATUS.APPROVED) approvedTotal += amt;
      if (e.status === Core.REQUEST_STATUS.DISBURSED) disbursedTotal += amt;
    });

    const pEl = document.getElementById("expMetricPending") || document.getElementById("expensesPendingCount");
    const aEl = document.getElementById("expMetricApproved") || document.getElementById("expensesApprovedSum");
    const dEl = document.getElementById("expMetricDisbursed") || document.getElementById("expensesDisbursedSum");

    const curr = Core.t("currency") || "EGP";
    if (pEl) pEl.textContent = `${pendingTotal.toLocaleString("en-US")} ${curr}`;
    if (aEl) aEl.textContent = `${approvedTotal.toLocaleString("en-US")} ${curr}`;
    if (dEl) dEl.textContent = `${disbursedTotal.toLocaleString("en-US")} ${curr}`;
  }

  function renderExpensesTable(list) {
    const tbody = document.getElementById("expensesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!tbody.dataset.zoomBound) {
      tbody.dataset.zoomBound = "true";
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-receipt-zoom");
        if (btn && btn.dataset.receiptUrl) {
          ActivitiesModule.openReceiptPreviewModal(btn.dataset.receiptUrl);
        }
      });
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty-row">${Core.t("noExpensesFound")}</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((exp) => {
        const requesterName = Core.escapeHTML(Core.getUserDisplayName(exp.requesterId));
        const requesterRole = Core.escapeHTML(Core.getUserRoleLabel(exp.requesterRole));
        const actionsHtml = getExpenseActionButtons(exp, Core._state.currentUser);
        const isPdfReceipt = typeof exp.receiptUrl === "string" && (exp.receiptUrl.startsWith("data:application/pdf") || exp.receiptUrl.toLowerCase().includes(".pdf"));
        const safeReceiptUrl = exp.receiptUrl ? Core.escapeHTML(exp.receiptUrl) : "";
        const receiptThumb = exp.receiptUrl
          ? `<button type="button" class="receipt-preview-btn btn-receipt-zoom" data-receipt-url="${safeReceiptUrl}" title="${Core.escapeHTML(Core.t("viewAttachment"))}" aria-label="${Core.escapeHTML(Core.t("viewAttachment") || "View receipt attachment")}">
               ${isPdfReceipt
                 ? `<span class="receipt-pdf-badge" style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; background:#fee2e2; color:#ef4444; border-radius:6px; font-weight:700; font-size:11px;"><svg class="badge-svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</span>`
                 : `<img src="${safeReceiptUrl}" alt="${Core.escapeHTML(Core.t("receiptAttachment") || "Receipt attachment")}" class="receipt-thumbnail" />`}
               <span class="receipt-zoom-badge"><svg class="badge-svg-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
             </button>`
          : `<span class="no-receipt-label">${Core.t("noReceipt")}</span>`;

        return `
          <tr>
            <td class="table-date-cell">${Core.escapeHTML(exp.date || "")}</td>
            <td>
              <div class="user-display-title">${requesterName}</div>
              <small class="badge badge-subtle-role">${requesterRole}</small>
            </td>
            <td>
              <span class="category-name-badge">${Core.escapeHTML(Core.getCategoryLabel(exp.category))}</span>
              ${exp.notes ? `<br><small class="item-notes-text">${Core.escapeHTML(exp.notes)}</small>` : ""}
            </td>
            <td class="table-amount-cell">${Number(exp.amount).toLocaleString("en-US")} ${Core.t("currency") || "EGP"}</td>
            <td>${receiptThumb}</td>
            <td>${renderStatusBadge(exp.status, exp.nextApproverId)}</td>
            <td class="table-actions-cell">${actionsHtml}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderStatusBadge(status, nextApproverId) {
    const s = status || "pending";
    let label = Core.t("statusPending");
    let css = "pending";

    if (s === Core.REQUEST_STATUS.PENDING_DM) {
      const dmName = Core.escapeHTML(Core.getUserDisplayName(nextApproverId));
      label = `${Core.t("waitingDmPrefix")}${dmName}`;
      css = "pending";
    } else if (s === Core.REQUEST_STATUS.PENDING_LM) {
      const lmName = Core.escapeHTML(Core.getUserDisplayName(nextApproverId));
      label = `${Core.t("waitingLmPrefix")}${lmName}`;
      css = "pending";
    } else if (s === Core.REQUEST_STATUS.PENDING_HR) {
      label = Core.t("waitingHr");
      css = "pending";
    } else if (s === Core.REQUEST_STATUS.APPROVED) {
      label = Core.t("approvedLabel");
      css = "approved";
    } else if (s === Core.REQUEST_STATUS.REJECTED) {
      label = Core.t("rejectedLabel");
      css = "rejected";
    } else if (s === Core.REQUEST_STATUS.DISBURSED) {
      label = Core.t("disbursedLabel");
      css = "disbursed";
    }

    return `<span class="status-pill ${css}">${label}</span>`;
  }

  function getExpenseActionButtons(exp, user) {
    if (!user) return "&mdash;";
    const canApprove = Core.isActionAuthorized("approve_expense", exp, user);
    const canReject = Core.isActionAuthorized("reject_expense", exp, user);
    const canDisburse = Core.isActionAuthorized("disburse_expense", exp, user);

    let buttons = "";
    if (canApprove || canReject) {
      if (canApprove) {
        buttons += `
          <button type="button" class="action-btn-success" onclick="ActivitiesModule.openDecisionModal('expense', '${Core.escapeHTML(exp.id)}', 'approve')" title="${Core.escapeHTML(Core.t("btnApprove") || "Approve")}" aria-label="${Core.escapeHTML(Core.t("btnApprove") || "Approve")}">
            <svg class="btn-svg-icon" aria-hidden="true" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        `;
      }
      if (canReject) {
        buttons += `
          <button type="button" class="action-btn-danger" onclick="ActivitiesModule.openDecisionModal('expense', '${Core.escapeHTML(exp.id)}', 'reject')" title="${Core.escapeHTML(Core.t("btnReject") || "Reject")}" aria-label="${Core.escapeHTML(Core.t("btnReject") || "Reject")}">
            <svg class="btn-svg-icon" aria-hidden="true" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        `;
      }
    }
    if (canDisburse) {
      buttons += `
        <button type="button" class="action-btn-disburse" onclick="ActivitiesModule.openDecisionModal('expense', '${Core.escapeHTML(exp.id)}', 'disburse')" title="${Core.escapeHTML(Core.t("btnDisburse") || "Disburse")}" aria-label="${Core.escapeHTML(Core.t("btnDisburse") || "Disburse")}">
          <svg class="btn-svg-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0"/></svg>
        </button>
      `;
    }

    return buttons || "&mdash;";
  }

  function openExpenseModal() {
    Core._state.currentUser = Core.getAuthUser();
    const modal = document.getElementById("expenseModal");
    if (!modal) return;
    document.getElementById("expenseForm")?.reset();
    Core._state.currentReceiptBase64 = null;
    const previewContainer = document.getElementById("receiptPreviewBox");
    if (previewContainer) previewContainer.style.display = "none";

    const dateInp = document.getElementById("expenseDateInput");
    if (dateInp) dateInp.value = Core.formatDate(Core._state.currentDate);

    const userLines = Core.getUserAssignedLines(Core._state.currentUser);
    const lineSelect = document.getElementById("expenseFormLineSelect") || document.getElementById("expenseLineSelect");
    if (lineSelect) {
      lineSelect.innerHTML = userLines.map((l) => `<option value="${Core.escapeHTML(l.id)}">${Core.escapeHTML(l.name)}</option>`).join("");
      if (userLines.length > 0) lineSelect.value = userLines[0].id;
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeExpenseModal() {
    const modal = document.getElementById("expenseModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  function onReceiptFileSelected(eventOrInput) {
    const input = eventOrInput?.target ? eventOrInput.target : eventOrInput;
    const file = input?.files && input.files[0];
    if (!file) return;

    // File size guard (max 800KB to protect localStorage quota from QuotaExceededError)
    const MAX_FILE_SIZE = 800 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      Core.safeShowToast(Core.t("fileTooLarge") || "Receipt file is too large. Maximum size is 800KB.", "warning");
      Core._state.currentReceiptBase64 = null;
      if (input) input.value = "";
      return;
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const allowedExts = /\.(jpg|jpeg|png|webp|pdf)$/i;
    const isMimeValid = allowedMimes.includes(file.type);
    const isExtValid = allowedExts.test(file.name || "");

    // Must satisfy BOTH MIME type and extension check to prevent spoofing
    if (!isMimeValid || !isExtValid) {
      Core.safeShowToast("Unsupported file type. Please upload a valid JPG, PNG, WEBP, or PDF file.", "warning");
      Core._state.currentReceiptBase64 = null;
      if (input) input.value = "";
      return;
    }

    const isPdf = file.type === "application/pdf" || (file.name && file.name.toLowerCase().endsWith(".pdf"));
    const reader = new FileReader();
    reader.onerror = function () {
      Core._state.currentReceiptBase64 = null;
      Core.safeShowToast("Failed to read file.", "warning");
    };

    reader.onload = function (evt) {
      if (isPdf) {
        Core._state.currentReceiptBase64 = evt.target.result;
        const previewContainer = document.getElementById("receiptPreviewBox");
        const previewImg = document.getElementById("receiptPreviewImg");
        if (previewContainer) {
          if (previewImg) {
            previewImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23ef4444' viewBox='0 0 16 16'><path d='M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 1.5l3 3H9.5v-3z'/><text x='3' y='12' fill='white' font-size='3' font-weight='bold'>PDF</text></svg>";
          }
          previewContainer.style.display = "block";
        }
        return;
      }

      const img = new Image();
      img.onerror = function () {
        Core._state.currentReceiptBase64 = null;
        Core.safeShowToast("Failed to load image file.", "warning");
      };

      img.onload = function () {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        Core._state.currentReceiptBase64 = canvas.toDataURL("image/jpeg", 0.6);

        const previewContainer = document.getElementById("receiptPreviewBox");
        const previewImg = document.getElementById("receiptPreviewImg");
        if (previewContainer && previewImg) {
          previewImg.src = Core._state.currentReceiptBase64;
          previewContainer.style.display = "block";
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function openReceiptPreviewModal(url) {
    if (!url || /^\s*javascript:/i.test(String(url))) return;
    const modal = document.getElementById("receiptPreviewModal");
    const img = document.getElementById("receiptModalLargeImg");
    if (!modal) return;

    const isPdf = typeof url === "string" && (url.startsWith("data:application/pdf") || url.toLowerCase().includes(".pdf"));
    let iframe = document.getElementById("receiptModalPdfFrame");

    if (isPdf) {
      if (img) img.style.display = "none";
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "receiptModalPdfFrame";
        iframe.style.width = "100%";
        iframe.style.height = "75vh";
        iframe.style.border = "none";
        iframe.style.borderRadius = "8px";
        if (img && img.parentNode) img.parentNode.appendChild(iframe);
      }
      iframe.src = url;
      iframe.style.display = "block";
    } else {
      if (iframe) iframe.style.display = "none";
      if (img) {
        img.src = url;
        img.style.display = "block";
      }
    }

    modal.style.display = "flex";
    modal.classList.add("active");
  }

  function closeReceiptPreviewModal() {
    const modal = document.getElementById("receiptPreviewModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
    const iframe = document.getElementById("receiptModalPdfFrame");
    if (iframe) iframe.src = "about:blank";
    const img = document.getElementById("receiptModalLargeImg");
    if (img) img.src = "";
  }

  function handleExpenseSubmit(e) {
    e.preventDefault();
    Core._state.currentUser = Core.getAuthUser();
    if (!Core._state.currentUser) {
      Core.safeShowToast(Core.t("sessionExpired") || "Session expired. Please sign in again.", "danger");
      return;
    }

    const submitBtn = document.getElementById("btnSubmitExpense") || e.target?.querySelector("button[type='submit']");
    if (submitBtn) {
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;
    }

    const catSelect = document.getElementById("expenseCategoryInput") || document.getElementById("expenseCategorySelect");
    const amountInp = document.getElementById("expenseAmountInput");
    const dateInp = document.getElementById("expenseDateInput");
    const notesInp = document.getElementById("expenseNotesInput");
    const lineSelect = document.getElementById("expenseFormLineSelect") || document.getElementById("expenseLineSelect");

    const category = catSelect ? catSelect.value : "travel";
    const amount = parseFloat(amountInp?.value || 0);
    const date = dateInp?.value || Core.formatDate(Core._state.currentDate);
    const notes = notesInp ? notesInp.value.trim() : "";

    const ALLOWED_CATEGORIES = ["travel", "fuel_tolls", "hospitality", "hotel"];
    if (!ALLOWED_CATEGORIES.includes(category)) {
      Core.safeShowToast(Core.t("invalidExpenseCategory") || "Please select a valid expense category.", "warning");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 500000) {
      Core.safeShowToast(Core.t("invalidAmount") || "Please enter a valid expense amount between 1 and 500,000 EGP.", "warning");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (notes.length > 1000) {
      Core.safeShowToast(Core.t("notesTooLong") || "Notes cannot exceed 1000 characters.", "warning");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const [ey, em, ed] = (date || "").split("-").map(Number);
    const expDate = new Date(ey, em - 1, ed);
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90, 0, 0, 0, 0);
    const maxFutureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    if (!date || isNaN(expDate.getTime()) || expDate < ninetyDaysAgo || expDate > maxFutureDate) {
      Core.safeShowToast(Core.t("invalidDateRange") || "Expense date must be within the last 90 days and not in the future.", "warning");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    let initialStatus = Core.REQUEST_STATUS.PENDING_DM;
    let nextApprover = null;

    const role = (Core._state.currentUser.role || "").toLowerCase();
    if (role === Core.ROLES.REP || role === Core.ROLES.REP_ALT) {
      initialStatus = Core.REQUEST_STATUS.PENDING_DM;
      nextApprover = Core._state.currentUser.managerId || null;
    } else if (role === Core.ROLES.DM) {
      initialStatus = Core.REQUEST_STATUS.PENDING_LM;
      nextApprover = Core._state.currentUser.managerId || null;
    } else if (role === Core.ROLES.LM) {
      initialStatus = Core.REQUEST_STATUS.PENDING_HR;
      const hr = Core.getHrUser();
      nextApprover = hr ? hr.id : null;
    } else if (role === Core.ROLES.BU) {
      initialStatus = Core.REQUEST_STATUS.PENDING_HR;
      const hr = Core.getHrUser();
      nextApprover = hr ? hr.id : (Core._state.currentUser.managerId || null);
    } else if (role === Core.ROLES.HR) {
      initialStatus = Core.REQUEST_STATUS.PENDING_GM;
      const gm = Core.getGmUser ? Core.getGmUser() : null;
      nextApprover = gm ? gm.id : (Core._state.currentUser.managerId || null);
    } else if (role === Core.ROLES.ADMIN) {
      initialStatus = Core.REQUEST_STATUS.PENDING_GM;
      const gm = Core.getGmUser ? Core.getGmUser() : null;
      nextApprover = gm ? gm.id : (Core._state.currentUser.managerId && Core._state.currentUser.managerId !== Core._state.currentUser.id ? Core._state.currentUser.managerId : null);
    } else {
      // PM, Finance Manager, Commercial Director, etc.
      initialStatus = Core.REQUEST_STATUS.PENDING_HR;
      const hr = Core.getHrUser();
      nextApprover = hr ? hr.id : (Core._state.currentUser.managerId || null);
    }

    if (String(initialStatus || "").startsWith("pending_") && !nextApprover) {
      Core.safeShowToast(Core.t("noApproverConfigured") || "Cannot submit expense claim: No direct manager or HR approver configured for your account. Please contact administrator.", "danger");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const assignedLines = Core.getUserAssignedLines(Core._state.currentUser);
    const assignedLineIds = assignedLines.map((l) => l.id);
    const rawLineId = lineSelect?.value;
    const allLines = Core.getAllProductLines();
    const validLine = allLines.find((l) => l.id === rawLineId);

    let lineId = null;
    if (role === Core.ROLES.ADMIN) {
      lineId = validLine ? validLine.id : (allLines[0] ? allLines[0].id : null);
    } else {
      if (rawLineId && assignedLineIds.includes(rawLineId)) {
        lineId = rawLineId;
      } else if (assignedLines.length > 0) {
        lineId = assignedLines[0].id;
      }
      if (!lineId || !assignedLineIds.includes(lineId)) {
        Core.safeShowToast(Core.t("unauthorizedLineAction") || "You are not authorized for this product line.", "danger");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
    }

    const newExpense = {
      id: "exp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      requesterId: Core._state.currentUser.id,
      requesterRole: Core._state.currentUser.role,
      lineId: lineId,
      category: category,
      amount: amount,
      date: date,
      notes: notes,
      receiptUrl: Core._state.currentReceiptBase64 || null,
      status: initialStatus,
      nextApproverId: nextApprover,
      history: [
        {
          action: "submitted",
          at: new Date().toISOString(),
          by: Core._state.currentUser.id,
          role: Core._state.currentUser.role,
        },
      ],
    };

    try {
      Core.StoreAdapter.saveExpense(newExpense);
    } catch (err) {
      console.error("Failed to save expense:", err);
      Core.safeShowToast("Storage quota exceeded or error saving expense claim. Please reduce receipt file size.", "danger");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (newExpense.nextApproverId) {
      const reqName = Core.getUserDisplayName(Core._state.currentUser.id);
      Core.dispatchWorkflowNotification({
        userId: newExpense.nextApproverId,
        type: "expense_approval",
        title: "Expense Claim Pending Approval",
        message: `${Core.escapeHTML(reqName)} submitted an expense claim of ${amount.toLocaleString("en-US")} ${Core.t("currency") || "EGP"} (${Core.getCategoryLabel(category)}) awaiting your approval.`,
        link: "activities.html",
        icon: "💵",
        badgeClass: "bg-warning",
        actorName: reqName,
        action: "pending_approval",
      });
    }

    closeExpenseModal();
    renderExpensesTab();
    Core.safeShowToast(Core.t("successAction"), "success");
    if (submitBtn) submitBtn.disabled = false;
  }

  window.ActivitiesExpenses = {
    populateExpenseFilters,
    renderExpensesTab,
    filterExpenses,
    onExpenseLineFilterChange,
    renderExpensesMetrics,
    renderExpensesTable,
    openExpenseModal,
    closeExpenseModal,
    onReceiptFileSelected,
    openReceiptPreviewModal,
    closeReceiptPreviewModal,
    handleExpenseSubmit,
    getExpenseActionButtons,
    renderStatusBadge,
    canUserViewExpense,
  };
})(window);