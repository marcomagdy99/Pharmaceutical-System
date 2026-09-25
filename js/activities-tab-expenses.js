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

    const lineSelect = document.getElementById("expenseFilterLine");
    if (lineSelect && lineSelect.dataset.populated !== "true") {
      const assignedLines = Core.getUserAssignedLines(user);
      const canSeeAll = user && (user.role === Core.ROLES.ADMIN || user.role === Core.ROLES.BU || user.role === Core.ROLES.HR);
      let html = "";
      if (canSeeAll || assignedLines.length > 1) {
        html += `<option value="all">${Core.t("allLines")}</option>`;
      }
      html += assignedLines.map((l) => `<option value="${l.id}">${Core.escapeHTML(l.name)}</option>`).join("");
      lineSelect.innerHTML = html;
      lineSelect.value = canSeeAll || assignedLines.length > 1 ? "all" : (assignedLines[0]?.id || "all");
      lineSelect.dataset.populated = "true";
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
      <option value="${user.id}">${Core.t("myRequestsOnly")}</option>
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

    renderExpensesMetrics(allExp);
    renderExpensesTable(filtered);
  }

  function canUserViewExpense(exp, user) {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    if (role === Core.ROLES.ADMIN || role === Core.ROLES.HR || role === Core.ROLES.BU) return true;
    if (exp.requesterId === user.id) return true;
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

    let pendingCount = 0;
    let pendingTotal = 0;
    let approvedTotal = 0;
    let disbursedTotal = 0;

    userVisible.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (e.status && e.status.startsWith("pending")) {
        pendingCount++;
        pendingTotal += amt;
      }
      if (e.status === Core.REQUEST_STATUS.APPROVED) approvedTotal += amt;
      if (e.status === Core.REQUEST_STATUS.DISBURSED) disbursedTotal += amt;
    });

    const pEl = document.getElementById("expMetricPending") || document.getElementById("expensesPendingCount");
    const aEl = document.getElementById("expMetricApproved") || document.getElementById("expensesApprovedSum");
    const dEl = document.getElementById("expMetricDisbursed") || document.getElementById("expensesDisbursedSum");

    if (pEl) pEl.textContent = `${pendingTotal.toLocaleString()} EGP`;
    if (aEl) aEl.textContent = `${approvedTotal.toLocaleString()} EGP`;
    if (dEl) dEl.textContent = `${disbursedTotal.toLocaleString()} EGP`;
  }

  function renderExpensesTable(list) {
    const tbody = document.getElementById("expensesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty-row">${Core.t("noExpensesFound")}</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((exp) => {
        const requesterName = Core.escapeHTML(Core.getUserDisplayName(exp.requesterId));
        const requesterRole = Core.escapeHTML(Core.getUserRoleLabel(exp.requesterRole));
        const actionsHtml = getExpenseActionButtons(exp, Core._state.currentUser);
        const receiptThumb = exp.receiptUrl
          ? `<button type="button" class="receipt-preview-btn" onclick="ActivitiesModule.openReceiptPreviewModal('${exp.receiptUrl}')" title="${Core.t(
              "viewAttachment"
            )}">
               <img src="${exp.receiptUrl}" alt="Receipt" class="receipt-thumbnail" />
               <span class="receipt-zoom-badge">🔍</span>
             </button>`
          : `<span class="no-receipt-label">${Core.t("noReceipt")}</span>`;

        return `
          <tr>
            <td class="table-date-cell">${exp.date}</td>
            <td>
              <div class="user-display-title">${requesterName}</div>
              <small class="badge badge-subtle-role">${requesterRole}</small>
            </td>
            <td>
              <span class="category-name-badge">${Core.getCategoryLabel(exp.category)}</span>
              ${exp.notes ? `<br><small class="item-notes-text">${Core.escapeHTML(exp.notes)}</small>` : ""}
            </td>
            <td class="table-amount-cell">${Number(exp.amount).toLocaleString()} EGP</td>
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
      const dmName = Core.getUserDisplayName(nextApproverId);
      label = `${Core.t("waitingDmPrefix")}${dmName}`;
      css = "pending";
    } else if (s === Core.REQUEST_STATUS.PENDING_LM) {
      const lmName = Core.getUserDisplayName(nextApproverId);
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
    const role = (user.role || "").toLowerCase();
    const status = exp.status;

    let canApproveReject = false;
    let canDisburse = false;

    if (role === Core.ROLES.ADMIN) {
      if (status.startsWith("pending")) canApproveReject = true;
      if (status === Core.REQUEST_STATUS.APPROVED) canDisburse = true;
    } else if (role === Core.ROLES.DM) {
      if (status === Core.REQUEST_STATUS.PENDING_DM && exp.nextApproverId === user.id) {
        canApproveReject = true;
      }
    } else if (role === Core.ROLES.LM) {
      if (status === Core.REQUEST_STATUS.PENDING_LM && exp.nextApproverId === user.id) {
        canApproveReject = true;
      }
    } else if (role === Core.ROLES.HR) {
      if (status === Core.REQUEST_STATUS.PENDING_HR) {
        canApproveReject = true;
      }
      if (status === Core.REQUEST_STATUS.APPROVED) {
        canDisburse = true;
      }
    } else if (role === Core.ROLES.BU) {
      if (status.startsWith("pending")) {
        canApproveReject = true;
      }
    }

    let buttons = "";
    if (canApproveReject) {
      buttons += `
        <button type="button" class="action-btn-success" onclick="ActivitiesModule.openDecisionModal('expense', '${exp.id}', 'approve')" title="Approve">
          ✓
        </button>
        <button type="button" class="action-btn-danger" onclick="ActivitiesModule.openDecisionModal('expense', '${exp.id}', 'reject')" title="Reject">
          ✕
        </button>
      `;
    }
    if (canDisburse) {
      buttons += `
        <button type="button" class="action-btn-disburse" onclick="ActivitiesModule.openDecisionModal('expense', '${exp.id}', 'disburse')" title="Disburse Payment">
          💰
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
      lineSelect.innerHTML = userLines.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
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

    const isPdf = file.type === "application/pdf" || (file.name && file.name.toLowerCase().endsWith(".pdf"));
    const reader = new FileReader();
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
  }

  function handleExpenseSubmit(e) {
    e.preventDefault();
    Core._state.currentUser = Core.getAuthUser();
    const catSelect = document.getElementById("expenseCategoryInput") || document.getElementById("expenseCategorySelect");
    const amountInp = document.getElementById("expenseAmountInput");
    const dateInp = document.getElementById("expenseDateInput");
    const notesInp = document.getElementById("expenseNotesInput");
    const lineSelect = document.getElementById("expenseFormLineSelect") || document.getElementById("expenseLineSelect");

    const category = catSelect ? catSelect.value : "travel";
    const amount = parseFloat(amountInp?.value || 0);
    const date = dateInp?.value || Core.formatDate(Core._state.currentDate);
    const notes = notesInp ? notesInp.value.trim() : "";

    if (!amount || amount <= 0) {
      Core.safeShowToast("Please enter a valid expense amount.", "warning");
      return;
    }

    let initialStatus = Core.REQUEST_STATUS.PENDING_DM;
    let nextApprover = null;

    if (Core._state.currentUser.role === Core.ROLES.REP || Core._state.currentUser.role === Core.ROLES.REP_ALT) {
      initialStatus = Core.REQUEST_STATUS.PENDING_DM;
      nextApprover = Core._state.currentUser.managerId || "dm1";
    } else if (Core._state.currentUser.role === Core.ROLES.DM) {
      initialStatus = Core.REQUEST_STATUS.PENDING_LM;
      nextApprover = Core._state.currentUser.managerId || "lm1";
    } else if (Core._state.currentUser.role === Core.ROLES.LM) {
      initialStatus = Core.REQUEST_STATUS.PENDING_HR;
      const hr = Core.getHrUser();
      nextApprover = hr ? hr.id : "hr1";
    } else {
      initialStatus = Core.REQUEST_STATUS.APPROVED;
      nextApprover = null;
    }

    const assignedLines = Core.getUserAssignedLines(Core._state.currentUser);
    const lineId = lineSelect?.value || (assignedLines.length > 0 ? assignedLines[0].id : "line1");

    const newExpense = {
      id: "exp_" + Date.now(),
      requesterId: Core._state.currentUser.id,
      requesterRole: Core._state.currentUser.role,
      lineId: lineId,
      category: category,
      amount: amount,
      date: date,
      notes: notes,
      receiptUrl: Core._state.currentReceiptBase64 || "images/pharma-icon-192.png",
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

    Core.StoreAdapter.saveExpense(newExpense);

    if (newExpense.nextApproverId) {
      const reqName = Core.getUserDisplayName(Core._state.currentUser.id);
      Core.dispatchWorkflowNotification({
        userId: newExpense.nextApproverId,
        type: "expense_approval",
        title: "طلب مصروفات بانتظار اعتمادك",
        titleEn: "Expense Claim Pending Approval",
        message: `قدم ${reqName} مطالبة مصروفات بقيمة ${amount.toLocaleString()} ج.م (${category}) بانتظار موافقتك.`,
        messageEn: `${reqName} submitted an expense claim of ${amount.toLocaleString()} EGP (${category}) awaiting your approval.`,
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