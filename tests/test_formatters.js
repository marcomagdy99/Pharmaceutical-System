const assert = require('assert');

function formatCurrency(amount, currency = "EGP", decimals = 2) {
  const n = Number(amount);
  if (isNaN(n) || amount === null || amount === undefined || amount === "") {
    return (0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (currency ? ` ${currency}` : "");
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (currency ? ` ${currency}` : "");
}

function formatEGP(amount, includeSymbol = false) {
  const n = Number(amount) || 0;
  const str = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return includeSymbol ? `${str} EGP` : str;
}

function formatDate(dateInput, format = "YYYY-MM-DD") {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  switch (format) {
    case "YYYY-MM-DD":
      return `${y}-${m}-${day}`;
    case "DD/MM/YYYY":
      return `${day}/${m}/${y}`;
    case "DD/MM":
      return `${day}/${m}`;
    case "human":
    case "medium": {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[d.getMonth()]} ${y}`;
    }
    default:
      return `${y}-${m}-${day}`;
  }
}

function formatNumber(val, decimals = 0) {
  const n = Number(val);
  if (isNaN(n) || val === null || val === undefined) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Unit Tests
assert.strictEqual(formatCurrency(1250.5), "1,250.50 EGP");
assert.strictEqual(formatCurrency(0), "0.00 EGP");
assert.strictEqual(formatCurrency(null), "0.00 EGP");
assert.strictEqual(formatCurrency(undefined), "0.00 EGP");
assert.strictEqual(formatCurrency("abc"), "0.00 EGP");
assert.strictEqual(formatCurrency("1500", "USD", 0), "1,500 USD");

assert.strictEqual(formatEGP(1250), "1,250");
assert.strictEqual(formatEGP(1250.75, true), "1,250.75 EGP");
assert.strictEqual(formatEGP(null), "0");

assert.strictEqual(formatDate("2026-10-16"), "2026-10-16");
assert.strictEqual(formatDate("2026-10-16T12:00:00Z"), "2026-10-16");
assert.strictEqual(formatDate("2026-10-16", "DD/MM/YYYY"), "16/10/2026");
assert.strictEqual(formatDate("2026-10-16", "DD/MM"), "16/10");
assert.strictEqual(formatDate("2026-10-16", "human"), "16 Oct 2026");
assert.strictEqual(formatDate(null), "");
assert.strictEqual(formatDate("invalid-date"), "");

assert.strictEqual(formatNumber(1000000), "1,000,000");
assert.strictEqual(formatNumber(null), "0");

console.log('ALL FORMATTERS UNIT TESTS PASSED WITH 100% SUCCESS!');
