const fs = require('fs');

let app = fs.readFileSync('js/app.js', 'utf8');

const targetStr = `// ============================================================================
// Section 0.5: Unified System Date Synchronizer
// Ensures visits, calendar, activities, and dashboard stay synchronized.
// If DEMO_DATA.systemDate is configured, it takes priority; otherwise uses live Date.
// ============================================================================
function getSystemDate() {
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.systemDate) {
    const d = new Date(window.DEMO_DATA.systemDate);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function getSystemTodayStr() {
  const d = getSystemDate();
  const pad = (n) => String(n).padStart(2, "0");
  return \`\${d.getFullYear()}-\${pad(d.getMonth() + 1)}-\${pad(d.getDate())}\`;
}

window.getSystemDate = getSystemDate;
window.getSystemTodayStr = getSystemTodayStr;`;

const newCode = `// ============================================================================
// Section 0.4: Dual Anti-Timestamp Tampering Engine (Network Time Protocol)
// Primary: Current Host Origin (window.location.origin HEAD Date header - RFC 7231)
// Fallback: Cloudflare Edge Trace (https://cloudflare.com/cdn-cgi/trace)
// Monotonic Guard: performance.now() tracks true elapsed time immune to device clock hacks
// ============================================================================
const NetworkTime = {
  offsetMs: 0,
  isSynced: false,
  syncSource: "none",
  basePerf: 0,
  baseServerMs: 0,
  lastSyncTime: 0,
  _syncPromise: null,

  async sync() {
    if (this._syncPromise) return this._syncPromise;
    this._syncPromise = this._doSync().finally(() => {
      this._syncPromise = null;
    });
    return this._syncPromise;
  },

  async _doSync() {
    // Attempt 1: Current Server Origin (HEAD request reads standard RFC 7231 Date header)
    try {
      const origin = (typeof window !== "undefined" && window.location && window.location.origin)
        ? window.location.origin
        : "";
      if (origin && !origin.startsWith("file:")) {
        const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;
        const res = await fetch(origin, {
          method: "HEAD",
          cache: "no-store",
          signal: controller ? controller.signal : undefined
        });
        if (timeoutId) clearTimeout(timeoutId);
        const dateHeader = res.headers ? res.headers.get("date") : null;
        if (dateHeader) {
          const serverMs = new Date(dateHeader).getTime();
          if (!isNaN(serverMs) && serverMs > 0) {
            this._applySync(serverMs, "origin");
            return true;
          }
        }
      }
    } catch (e) {
      // Origin HEAD failed or offline, fall through to Cloudflare
    }

    // Attempt 2: Cloudflare Edge Trace Fallback
    try {
      const controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const res = await fetch("https://cloudflare.com/cdn-cgi/trace", {
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);
      const text = await res.text();
      const match = text.match(/ts=([0-9.]+)/);
      if (match) {
        const serverMs = Math.floor(parseFloat(match[1]) * 1000);
        if (!isNaN(serverMs) && serverMs > 0) {
          this._applySync(serverMs, "cloudflare");
          return true;
        }
      }
    } catch (e) {
      // Cloudflare fallback failed or offline
    }

    // Attempt 3: Restore cached session sync if available
    try {
      if (typeof sessionStorage !== "undefined") {
        const cachedOffset = sessionStorage.getItem("pharma_net_time_offset");
        const cachedPerf = sessionStorage.getItem("pharma_net_time_perf");
        const cachedBase = sessionStorage.getItem("pharma_net_time_base");
        if (cachedOffset !== null && cachedPerf !== null && cachedBase !== null) {
          this.offsetMs = parseInt(cachedOffset, 10) || 0;
          this.basePerf = parseFloat(cachedPerf) || 0;
          this.baseServerMs = parseInt(cachedBase, 10) || 0;
          this.isSynced = true;
          this.syncSource = "session_cache";
          return true;
        }
      }
    } catch (e) {}

    return false;
  },

  _applySync(serverMs, source) {
    const localMs = Date.now();
    this.offsetMs = serverMs - localMs;
    this.baseServerMs = serverMs;
    this.basePerf = (typeof performance !== "undefined" && typeof performance.now === "function")
      ? performance.now()
      : 0;
    this.isSynced = true;
    this.syncSource = source;
    this.lastSyncTime = localMs;

    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("pharma_net_time_offset", String(this.offsetMs));
        sessionStorage.setItem("pharma_net_time_perf", String(this.basePerf));
        sessionStorage.setItem("pharma_net_time_base", String(this.baseServerMs));
      }
    } catch (e) {}
  },

  now() {
    if (this.isSynced && this.basePerf && typeof performance !== "undefined" && typeof performance.now === "function") {
      const elapsed = performance.now() - this.basePerf;
      return new Date(this.baseServerMs + elapsed);
    }
    if (this.isSynced && this.offsetMs) {
      return new Date(Date.now() + this.offsetMs);
    }
    return new Date();
  },

  checkTampering(maxAllowedDriftMinutes = 5) {
    const verified = this.now();
    const device = new Date();
    const diffMs = device.getTime() - verified.getTime();
    const driftMinutes = Math.round(diffMs / 60000);
    const thresholdMs = maxAllowedDriftMinutes * 60 * 1000;
    const isTampered = Math.abs(diffMs) > thresholdMs;

    return {
      isTampered,
      driftMinutes,
      diffMs,
      isSynced: this.isSynced,
      syncSource: this.syncSource,
      serverTime: verified,
      deviceTime: device
    };
  }
};

window.NetworkTime = NetworkTime;

// Auto-trigger sync on load and on reconnect
if (typeof window !== "undefined") {
  NetworkTime.sync();
  if (typeof window.addEventListener === "function") {
    window.addEventListener("online", () => NetworkTime.sync());
  }
}

// ============================================================================
// Section 0.5: Unified System Date Synchronizer
// Ensures visits, calendar, activities, and dashboard stay synchronized.
// If DEMO_DATA.systemDate is configured, it takes priority; otherwise uses NetworkTime.
// ============================================================================
function getSystemDate() {
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.systemDate) {
    const d = new Date(window.DEMO_DATA.systemDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof window !== "undefined" && window.NetworkTime && typeof window.NetworkTime.now === "function") {
    return window.NetworkTime.now();
  }
  return new Date();
}

function getSystemTodayStr() {
  const d = getSystemDate();
  const pad = (n) => String(n).padStart(2, "0");
  return \`\${d.getFullYear()}-\${pad(d.getMonth() + 1)}-\${pad(d.getDate())}\`;
}

window.getSystemDate = getSystemDate;
window.getSystemTodayStr = getSystemTodayStr;`;

// Normalize \r\n to \n for matching
const normalizedApp = app.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');

if (normalizedApp.includes(normalizedTarget)) {
  const replaced = normalizedApp.replace(normalizedTarget, newCode);
  fs.writeFileSync('js/app.js', replaced, 'utf8');
  console.log('✅ Successfully integrated NetworkTime into js/app.js');
} else {
  console.error('❌ Could not find normalizedTarget in app.js');
}
