const assert = require('assert');

const STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  PLANNED: "planned",
  DRAFT: "draft",
  DISBURSED: "disbursed",

  PENDING_DM: "pending_dm",
  PENDING_LM: "pending_lm",
  PENDING_HR: "pending_hr",
  PENDING_BU: "pending_bu",
  PENDING_PM: "pending_pm",
  PENDING_GM: "pending_gm",
  PENDING_SHARED: "pending_shared",

  ACTIVE: "active",
  INACTIVE: "inactive",
});

function normalizeStatus(status) {
  if (!status) return "";
  return String(status).toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function getStatusBadgeConfig(status) {
  const s = normalizeStatus(status);
  switch (s) {
    case "approved":
      return { css: "bg-success", text: "Approved" };
    case "completed":
      return { css: "bg-success", text: "Completed" };
    case "active":
      return { css: "bg-success", text: "Active" };
    case "disbursed":
      return { css: "bg-success", text: "Disbursed" };
    case "rejected":
      return { css: "bg-danger", text: "Rejected" };
    case "inactive":
      return { css: "bg-danger", text: "Inactive" };
    case "pending":
      return { css: "bg-warning text-dark", text: "Pending" };
    case "pending_dm":
      return { css: "bg-warning text-dark", text: "Pending DM" };
    case "pending_hr":
      return { css: "bg-warning text-dark", text: "Pending HR" };
    case "pending_lm":
      return { css: "bg-info text-dark", text: "Pending LM" };
    case "pending_bu":
      return { css: "bg-primary", text: "Pending BU" };
    case "pending_gm":
      return { css: "bg-dark", text: "Pending GM" };
    case "pending_shared":
      return { css: "bg-warning text-dark", text: "Pending Shared" };
    case "planned":
      return { css: "bg-info text-dark", text: "Planned" };
    case "draft":
      return { css: "bg-secondary", text: "Draft" };
    case "cancelled":
      return { css: "bg-secondary", text: "Cancelled" };
    default:
      return { css: "bg-secondary", text: status || "Unknown" };
  }
}

function renderStatusBadge(status, customLabel = null) {
  const config = getStatusBadgeConfig(status);
  const label = customLabel || config.text;
  return `<span class="badge ${config.css} status-badge">${label}</span>`;
}

// Unit Tests
assert.strictEqual(Object.isFrozen(STATUS), true);

assert.strictEqual(
  renderStatusBadge(STATUS.APPROVED),
  '<span class="badge bg-success status-badge">Approved</span>'
);

assert.strictEqual(
  renderStatusBadge('Approved'),
  '<span class="badge bg-success status-badge">Approved</span>'
);

assert.strictEqual(
  renderStatusBadge('pending_dm'),
  '<span class="badge bg-warning text-dark status-badge">Pending DM</span>'
);

assert.strictEqual(
  renderStatusBadge('Pending LM'),
  '<span class="badge bg-info text-dark status-badge">Pending LM</span>'
);

assert.strictEqual(
  renderStatusBadge('rejected'),
  '<span class="badge bg-danger status-badge">Rejected</span>'
);

assert.strictEqual(
  renderStatusBadge('active'),
  '<span class="badge bg-success status-badge">Active</span>'
);

assert.strictEqual(
  renderStatusBadge('pending_dm', 'Waiting for John'),
  '<span class="badge bg-warning text-dark status-badge">Waiting for John</span>'
);

console.log('ALL STATUS ENGINE UNIT TESTS PASSED WITH 100% SUCCESS!');
