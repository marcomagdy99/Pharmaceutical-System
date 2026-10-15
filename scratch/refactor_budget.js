const fs = require('fs');

const filePath = 'js/activities-tab-budget.js';
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');

let norm = normalize(content);

// 1. Target 1: renderBuLmAllocations
const t1 = `      if (lmsForLine.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted, var(--gray-500));">\${Core.t("noLmsForLine") || "No Line Managers found for this line."}</td></tr>\`;
      } else {
        tbody.innerHTML = lmsForLine
          .map((lm) => {
            const alloc = (lineBudget.lmAllocations && lineBudget.lmAllocations[lm.id]) || 0;
            const dmsUnderLm = Core.getDmsUnderLmForLine(lm.id, lineId);
            const dmSum = dmsUnderLm.reduce(
              (sum, dm) => sum + ((lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0),
              0
            );

            return \`
              <tr>
                <td>
                  <div style="font-weight:700; color:var(--text-color, var(--gray-800));">\${Core.escapeHTML(Core.getUserDisplayName(lm.id))}</div>
                  <small style="color:var(--text-muted, var(--gray-500));">\${Core.escapeHTML(lm.email || "")}</small>
                </td>
                <td><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">\${Core.escapeHTML(lm.employeeCode || lm.id)}</span></td>
                <td>
                  <input type="number" class="form-control bu-lm-input" data-lmid="\${lm.id}" value="\${alloc}" min="0" step="1000" oninput="ActivitiesModule.calculateBuBudgetSummary()" style="width:160px; font-weight:700;" />
                </td>
                <td style="font-weight:700; color:var(--text-color, var(--gray-700));">\${dmSum.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
                <td>
                  <button type="button" class="btn btn-outline" style="font-size:0.8rem; padding:4px 10px;" onclick="ActivitiesModule.openLmDetailModal('\${lm.id}', '\${lineId}')">
                    \${Core.t("inspectDms") || "Inspect DMs"}
                  </button>
                </td>
              </tr>
            \`;
          })
          .join("");
      }`;

const r1 = `      if (lmsForLine.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="5" class="budget-empty-cell">\${Core.t("noLmsForLine") || "No Line Managers found for this line."}</td></tr>\`;
      } else {
        tbody.innerHTML = lmsForLine
          .map((lm) => {
            const alloc = (lineBudget.lmAllocations && lineBudget.lmAllocations[lm.id]) || 0;
            const dmsUnderLm = Core.getDmsUnderLmForLine(lm.id, lineId);
            const dmSum = dmsUnderLm.reduce(
              (sum, dm) => sum + ((lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0),
              0
            );

            return \`
              <tr>
                <td>
                  <div class="budget-user-name">\${Core.escapeHTML(Core.getUserDisplayName(lm.id))}</div>
                  <small class="budget-user-email">\${Core.escapeHTML(lm.email || "")}</small>
                </td>
                <td><span class="badge budget-code-badge">\${Core.escapeHTML(lm.employeeCode || lm.id)}</span></td>
                <td>
                  <input type="number" class="form-control bu-lm-input budget-alloc-input-bu" data-lmid="\${lm.id}" value="\${alloc}" min="0" step="1000" oninput="ActivitiesModule.calculateBuBudgetSummary()" />
                </td>
                <td class="budget-sum-cell">\${dmSum.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
                <td>
                  <button type="button" class="btn btn-outline budget-inspect-btn" onclick="ActivitiesModule.openLmDetailModal('\${lm.id}', '\${lineId}')">
                    \${Core.t("inspectDms") || "Inspect DMs"}
                  </button>
                </td>
              </tr>
            \`;
          })
          .join("");
      }`;

// 2. Target 2: openLmDetailModal
const t2 = `    if (dms.length === 0) {
      if (bodyEl) {
        bodyEl.innerHTML = \`<div style="text-align:center; padding:24px; color:var(--text-muted, var(--gray-500)); font-size:14px;">
          \${Core.t("noDmsUnderLm") || "No District Managers found under this Line Manager for the selected line."}
        </div>\`;
      }
    } else {
      let rows = "";
      let totalAlloc = 0;
      dms.forEach((dm) => {
        const alloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        totalAlloc += alloc;
        rows += \`
          <tr style="border-bottom:1px solid var(--border-color, #e2e8f0);">
            <td style="padding:10px 12px; font-weight:600; color:var(--text-color, var(--gray-800));">\${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</td>
            <td style="padding:10px 12px;"><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">\${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td style="padding:10px 12px; text-align:end; font-weight:700; color:var(--primary);">\${alloc.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
          </tr>
        \`;
      });

      if (bodyEl) {
        bodyEl.innerHTML = \`
          <div style="margin-bottom:14px; font-size:13px; color:var(--text-muted, var(--gray-600));">
            \${Core.t("totalDmAllocation") || "Total allocated to DMs"}: <strong style="color:var(--text-color, var(--gray-900));">\${totalAlloc.toLocaleString()} \${Core.t("currency") || "EGP"}</strong>
          </div>
          <div class="table-responsive">
            <table class="table" style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid var(--border-color, #cbd5e1); text-align:start;">
                  <th style="padding:8px 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">\${Core.t("name") || "District Manager"}</th>
                  <th style="padding:8px 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted);">\${Core.t("code") || "Code"}</th>
                  <th style="padding:8px 12px; font-size:12px; text-transform:uppercase; color:var(--text-muted); text-align:end;">\${Core.t("allocation") || "Allocated"}</th>
                </tr>
              </thead>
              <tbody>
                \${rows}
              </tbody>
            </table>
          </div>
        \`;
      }
    }`;

const r2 = `    if (dms.length === 0) {
      if (bodyEl) {
        bodyEl.innerHTML = \`<div class="budget-modal-empty">
          \${Core.t("noDmsUnderLm") || "No District Managers found under this Line Manager for the selected line."}
        </div>\`;
      }
    } else {
      let rows = "";
      let totalAlloc = 0;
      dms.forEach((dm) => {
        const alloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        totalAlloc += alloc;
        rows += \`
          <tr class="budget-detail-tr">
            <td class="budget-detail-td-name">\${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</td>
            <td class="budget-detail-td-code"><span class="badge budget-code-badge">\${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td class="budget-detail-td-val">\${alloc.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
          </tr>
        \`;
      });

      if (bodyEl) {
        bodyEl.innerHTML = \`
          <div class="budget-modal-summary">
            \${Core.t("totalDmAllocation") || "Total allocated to DMs"}: <strong class="budget-modal-total">\${totalAlloc.toLocaleString()} \${Core.t("currency") || "EGP"}</strong>
          </div>
          <div class="table-responsive">
            <table class="table budget-detail-table">
              <thead>
                <tr class="budget-detail-tr-head">
                  <th class="budget-detail-th">\${Core.t("name") || "District Manager"}</th>
                  <th class="budget-detail-th">\${Core.t("code") || "Code"}</th>
                  <th class="budget-detail-th text-end">\${Core.t("allocation") || "Allocated"}</th>
                </tr>
              </thead>
              <tbody>
                \${rows}
              </tbody>
            </table>
          </div>
        \`;
      }
    }`;

// 3. Target 3: renderLmDmAllocations
const t3 = `    if (dmsUnderLm.length === 0) {
      tbody.innerHTML = \`<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted, var(--gray-500));">No District Managers assigned to you in this line.</td></tr>\`;
      return;
    }

    tbody.innerHTML = dmsUnderLm
      .map((dm) => {
        const curAlloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        const dmServices = Core.StoreAdapter.getServices().filter((s) => s.lineId === lineId && s.requesterId === dm.id && s.status === Core.REQUEST_STATUS.APPROVED);
        const dmUtilized = dmServices.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

        return \`
          <tr>
            <td>
              <div style="font-weight:700; color:var(--text-color, var(--gray-800));">\${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</div>
              <small style="color:var(--text-muted, var(--gray-500));">\${Core.escapeHTML(dm.email || "")}</small>
            </td>
            <td><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">\${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td>
              <input type="number" class="form-control lm-dm-alloc-input" data-dmid="\${dm.id}" value="\${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateLmAllocationPreview()" style="width:140px; font-weight:700; display:inline-block;" />
            </td>
            <td style="font-weight:700; color:var(--text-color, var(--gray-700));">\${dmUtilized.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
          </tr>
        \`;
      })
      .join("");`;

const r3 = `    if (dmsUnderLm.length === 0) {
      tbody.innerHTML = \`<tr><td colspan="4" class="budget-empty-cell">No District Managers assigned to you in this line.</td></tr>\`;
      return;
    }

    tbody.innerHTML = dmsUnderLm
      .map((dm) => {
        const curAlloc = (lineBudget.dmAllocations && lineBudget.dmAllocations[dm.id]) || 0;
        const dmServices = Core.StoreAdapter.getServices().filter((s) => s.lineId === lineId && s.requesterId === dm.id && s.status === Core.REQUEST_STATUS.APPROVED);
        const dmUtilized = dmServices.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

        return \`
          <tr>
            <td>
              <div class="budget-user-name">\${Core.escapeHTML(Core.getUserDisplayName(dm.id))}</div>
              <small class="budget-user-email">\${Core.escapeHTML(dm.email || "")}</small>
            </td>
            <td><span class="badge budget-code-badge">\${Core.escapeHTML(dm.employeeCode || dm.id)}</span></td>
            <td>
              <input type="number" class="form-control lm-dm-alloc-input budget-alloc-input" data-dmid="\${dm.id}" value="\${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateLmAllocationPreview()" />
            </td>
            <td class="budget-sum-cell">\${dmUtilized.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
          </tr>
        \`;
      })
      .join("");`;

// 4. Target 4: renderDmRepAllocations
const t4 = `    if (myReps.length === 0) {
      tbody.innerHTML = \`
        <tr>
          <td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted, var(--gray-500));">
            \${Core.t("noServicesFound") || "No medical reps found assigned under your district for this product line."}
          </td>
        </tr>
      \`;
      return;
    }

    const allServices = Core.StoreAdapter.getServices();
    tbody.innerHTML = myReps
      .map((rep) => {
        const curAlloc = (lineBudget.repAllocations && lineBudget.repAllocations[rep.id]) || 0;
        let repUtilized = 0;
        allServices.forEach((s) => {
          if (s.isShared && Array.isArray(s.shares)) {
            s.shares.forEach((sh) => {
              if (sh.lineId === lineId && sh.repId === rep.id && (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)) {
                repUtilized += Number(sh.shareAmount || 0);
              }
            });
          } else if (s.lineId === lineId && s.requesterId === rep.id && s.status === Core.REQUEST_STATUS.APPROVED) {
            repUtilized += Number(s.cost || 0);
          }
        });

        return \`
          <tr>
            <td>
              <div style="font-weight:700; color:var(--text-color, var(--gray-800));">\${Core.escapeHTML(Core.getUserDisplayName(rep.id))}</div>
              <small style="color:var(--text-muted, var(--gray-500));">\${Core.escapeHTML(rep.email || "")}</small>
            </td>
            <td><span class="badge" style="background:var(--surface-dim, var(--gray-100)); color:var(--text-color, var(--gray-700)); font-weight:600;">\${Core.escapeHTML(rep.employeeCode || rep.id)}</span></td>
            <td>
              <input type="number" class="form-control dm-rep-alloc-input" data-repid="\${rep.id}" value="\${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateDmAllocationPreview()" style="width:140px; font-weight:700; display:inline-block;" />
            </td>
            <td style="font-weight:700; color:var(--text-color, var(--gray-700));">\${repUtilized.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
          </tr>
        \`;
      })
      .join("");`;

const r4 = `    if (myReps.length === 0) {
      tbody.innerHTML = \`
        <tr>
          <td colspan="4" class="budget-empty-cell">
            \${Core.t("noServicesFound") || "No medical reps found assigned under your district for this product line."}
          </td>
        </tr>
      \`;
      return;
    }

    const allServices = Core.StoreAdapter.getServices();
    tbody.innerHTML = myReps
      .map((rep) => {
        const curAlloc = (lineBudget.repAllocations && lineBudget.repAllocations[rep.id]) || 0;
        let repUtilized = 0;
        allServices.forEach((s) => {
          if (s.isShared && Array.isArray(s.shares)) {
            s.shares.forEach((sh) => {
              if (sh.lineId === lineId && sh.repId === rep.id && (sh.status === Core.REQUEST_STATUS.APPROVED || s.status === Core.REQUEST_STATUS.APPROVED)) {
                repUtilized += Number(sh.shareAmount || 0);
              }
            });
          } else if (s.lineId === lineId && s.requesterId === rep.id && s.status === Core.REQUEST_STATUS.APPROVED) {
            repUtilized += Number(s.cost || 0);
          }
        });

        return \`
          <tr>
            <td>
              <div class="budget-user-name">\${Core.escapeHTML(Core.getUserDisplayName(rep.id))}</div>
              <small class="budget-user-email">\${Core.escapeHTML(rep.email || "")}</small>
            </td>
            <td><span class="badge budget-code-badge">\${Core.escapeHTML(rep.employeeCode || rep.id)}</span></td>
            <td>
              <input type="number" class="form-control dm-rep-alloc-input budget-alloc-input" data-repid="\${rep.id}" value="\${curAlloc}" min="0" step="500" oninput="ActivitiesModule.calculateDmAllocationPreview()" />
            </td>
            <td class="budget-sum-cell">\${repUtilized.toLocaleString()} \${Core.t("currency") || "EGP"}</td>
          </tr>
        \`;
      })
      .join("");`;

if (!norm.includes(normalize(t1))) {
  console.error('ERROR: Target 1 not found');
  process.exit(1);
}
if (!norm.includes(normalize(t2))) {
  console.error('ERROR: Target 2 not found');
  process.exit(1);
}
if (!norm.includes(normalize(t3))) {
  console.error('ERROR: Target 3 not found');
  process.exit(1);
}
if (!norm.includes(normalize(t4))) {
  console.error('ERROR: Target 4 not found');
  process.exit(1);
}

norm = norm
  .replace(normalize(t1), normalize(r1))
  .replace(normalize(t2), normalize(r2))
  .replace(normalize(t3), normalize(r3))
  .replace(normalize(t4), normalize(r4));

const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('SUCCESS: All 4 budget allocation sections cleanly refactored!');
