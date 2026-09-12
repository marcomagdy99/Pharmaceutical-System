// Dynamic default date helpers for coverage report
function _coverageStart() {
  const n = new Date(); const m = String(n.getMonth()+1).padStart(2,'0'); return `${n.getFullYear()}-${m}-01`;
}
function _coverageEnd() {
  const n = new Date(); const l = new Date(n.getFullYear(), n.getMonth()+1, 0);
  const m = String(l.getMonth()+1).padStart(2,'0'); const d = String(l.getDate()).padStart(2,'0');
  return `${l.getFullYear()}-${m}-${d}`;
}
/**
 * @file coverage-report.js
 * @description Reports page - "Coverage" tab: doctor/hospital visit
 * frequency vs target, plus its Excel/CSV export.
 * Depends on shared-report.js (must load after it).
 */

// Section 9: Tab 3 - Coverage & Frequency Report
// ============================================================================
function renderCoverageReport() {
  syncReportsData();
  const tbody = document.getElementById('coverageReportTbody');
  if (!tbody) return;
  tbody.replaceChildren();

  const startDate = document.getElementById('coverageStartDate').value || _coverageStart();
  const endDate = document.getElementById('coverageEndDate').value || _coverageEnd();
  const classFilter = document.getElementById('coverageClassFilter').value || 'all';
  const repSelect = document.getElementById('coverageRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';
  const lang = getCurrentLang();

  const start = new Date(startDate);
  const end = new Date(endDate);

  const user = checkAuth();
  const role = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  let targetList = REPORTS_DATA.doctors;
  if (classFilter === 'all_doctors') targetList = targetList.filter((d) => d.class === 'A' || d.class === 'B');
  else if (classFilter === 'A') targetList = targetList.filter((d) => d.class === 'A');
  else if (classFilter === 'B') targetList = targetList.filter((d) => d.class === 'B');
  else if (classFilter === 'hospital') targetList = targetList.filter((d) => d.class === 'hospital');

  if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);

    if (selectedRep === 'all') {
      targetList = targetList.filter((d) => !d.repId || repIds.includes(d.repId) || dmIds.includes(d.repId) || d.repId === user.id);
    } else if (selectedRep === 'all_dms') {
      targetList = targetList.filter((d) => dmIds.includes(d.repId));
    } else if (selectedRep === 'all_reps') {
      targetList = targetList.filter((d) => repIds.includes(d.repId));
    } else if (dmIds.includes(selectedRep)) {
      const dmReps = reps.filter((r) => r.managerId === selectedRep).map((r) => r.id);
      targetList = targetList.filter((d) => d.repId === selectedRep || dmReps.includes(d.repId));
    } else if (selectedRep) {
      targetList = targetList.filter((d) => d.repId === selectedRep);
    }
  } else if (selectedRep && selectedRep !== 'all') {
    targetList = targetList.filter((d) => d.repId === selectedRep);
  }

  let totalTargetFreq = 0;
  let totalVisitsExecuted = 0;
  let coveredTargetsCount = 0;

  targetList.forEach((target) => {
    const matchingVisits = REPORTS_DATA.visits.filter((v) => {
      const matchesTarget = (v.doctorId && target.id) ? (v.doctorId === target.id) : (v.targetName === target.name);
      if (!matchesTarget) return false;
      const vDate = new Date(v.date);
      return vDate >= start && vDate <= end;
    });

    const visitsCount = matchingVisits.length;
    const startMonthIndex = start.getFullYear() * 12 + start.getMonth();
    const endMonthIndex = end.getFullYear() * 12 + end.getMonth();
    const numMonths = Math.max(1, endMonthIndex - startMonthIndex + 1);
    const quarterlyRate = target.targetQuarterly || (target.class === 'A' ? 4 : (target.class === 'B' ? 3 : 6));
    const targetFreq = Math.max(1, Math.round((quarterlyRate / 3) * numMonths));
    
    totalTargetFreq += targetFreq;
    totalVisitsExecuted += visitsCount;
    if (visitsCount > 0) coveredTargetsCount++;

    let timestampsHtml = '';
    if (matchingVisits.length > 0) {
      matchingVisits.forEach((v) => {
        const isAct = Boolean(v.isActual);
        const cardTypeClass = isAct ? 'actual-type' : 'planned-type';
        const typeLabel = isAct ? (lang === 'ar' ? 'فعلية' : 'Actual') : (lang === 'ar' ? 'خطة' : 'Plan');
        
        timestampsHtml += `
          <div class="visit-timestamp-card ${cardTypeClass}" title="${isAct ? 'Direct Actual Visit' : 'Planned Visit'}">
            <div class="visit-date-row">
              <span>${v.date}</span>
              ${isAct ? `<span style="font-size: 0.7rem; color: #d97706;" title="Actual">★</span>` : ''}
            </div>
            <div class="visit-time-row">
              <span>⏰ ${v.time || '10:00'}</span>
              <span style="opacity: 0.7;">• ${typeLabel}</span>
            </div>
          </div>
        `;
      });
    } else {
      timestampsHtml = `<span style="color: var(--gray-400); font-style: italic; font-size: 0.8rem;">${lang === 'ar' ? 'لا توجد زيارات في هذه الفترة' : 'No visits in this period'}</span>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${target.name}</strong>
        <div style="font-size: 0.78rem; color: var(--gray-500);">${target.area}</div>
      </td>
      <td>
        <span class="badge" style="background: ${target.class === 'A' ? 'var(--primary)' : target.class === 'B' ? 'var(--info)' : '#6f42c1'}; color: white; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">
          ${target.class === 'hospital' ? 'Hospital' : 'Class ' + target.class}
        </span>
      </td>
      <td>${target.specialty}</td>
      <td style="font-weight: 700; text-align: center;">${targetFreq}</td>
      <td style="font-weight: 800; color: var(--primary); text-align: center;">${visitsCount}</td>
      <td>
        <div style="max-width: 340px; display: flex; flex-wrap: wrap; gap: 6px;">
          ${timestampsHtml}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Calculate Overall Total Coverage % across the selected period
  const overallCoveragePct = totalTargetFreq > 0 ? Math.round((totalVisitsExecuted / totalTargetFreq) * 100) : 0;

  const elOverall = document.getElementById('kpiCoverageOverall');
  const elExecuted = document.getElementById('kpiCoverageExecutedVisits');
  const elTarget = document.getElementById('kpiCoverageTargetVisits');
  const elTargetsCount = document.getElementById('kpiCoverageTargetsCount');
  const elPeriodSubtext = document.getElementById('kpiCoveragePeriodSubtext');
  const elTargetsSubtext = document.getElementById('kpiCoverageTargetsSubtext');

  if (elOverall) elOverall.textContent = `${overallCoveragePct}%`;
  if (elExecuted) elExecuted.textContent = totalVisitsExecuted.toLocaleString();
  if (elTarget) elTarget.textContent = totalTargetFreq.toLocaleString();
  if (elTargetsCount) elTargetsCount.textContent = `${coveredTargetsCount} / ${targetList.length}`;
  if (elPeriodSubtext) elPeriodSubtext.textContent = `${startDate} ~ ${endDate}`;
  if (elTargetsSubtext) elTargetsSubtext.textContent = lang === 'ar' ? 'الأطباء والمستشفيات المزارة' : 'Doctors/Hospitals Visited';
}

// ============================================================================

function exportCoverageReport() {
  syncReportsData();
  const startDate = document.getElementById('coverageStartDate')?.value || _coverageStart();
  const endDate = document.getElementById('coverageEndDate')?.value || _coverageEnd();
  const classFilter = document.getElementById('coverageClassFilter')?.value || 'all';
  const repSelect = document.getElementById('coverageRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';

  const start = new Date(startDate);
  const end = new Date(endDate);

  let targetList = REPORTS_DATA.doctors;
  if (classFilter === 'all_doctors') targetList = targetList.filter((d) => d.class === 'A' || d.class === 'B');
  else if (classFilter === 'A') targetList = targetList.filter((d) => d.class === 'A');
  else if (classFilter === 'B') targetList = targetList.filter((d) => d.class === 'B');
  else if (classFilter === 'hospital') targetList = targetList.filter((d) => d.class === 'hospital');

  const user = checkAuth();
  const isRep = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  if (isRep) {
    targetList = targetList.filter((d) => d.repId === user.id);
  } else if (selectedRep && selectedRep !== 'all') {
    targetList = targetList.filter((d) => d.repId === selectedRep);
  }

  let totalTarget = 0;
  let totalExecuted = 0;

  let csv = 'Target Name,Area,Class,Specialty,Target Visits,Actual Visits\n';
  targetList.forEach((target) => {
    const matchingVisits = REPORTS_DATA.visits.filter((v) => {
      const matchesTarget = (v.doctorId && target.id) ? (v.doctorId === target.id) : (v.targetName === target.name);
      if (!matchesTarget) return false;
      const vDate = new Date(v.date);
      return vDate >= start && vDate <= end;
    });
    const visitsCount = matchingVisits.length;
    const startMonthIndex = start.getFullYear() * 12 + start.getMonth();
    const endMonthIndex = end.getFullYear() * 12 + end.getMonth();
    const numMonths = Math.max(1, endMonthIndex - startMonthIndex + 1);
    const quarterlyRate = target.targetQuarterly || (target.class === 'A' ? 4 : (target.class === 'B' ? 3 : 6));
    const targetFreq = Math.max(1, Math.round((quarterlyRate / 3) * numMonths));
    totalTarget += targetFreq;
    totalExecuted += visitsCount;

    csv += `"${target.name}","${target.area || ''}","${target.class}","${target.specialty || ''}",${targetFreq},${visitsCount}\n`;
  });

  const overallCoverage = totalTarget > 0 ? Math.round((totalExecuted / totalTarget) * 100) : 0;
  csv += `\n"Total Period Coverage","${startDate} to ${endDate}","${overallCoverage}%",,${totalTarget},${totalExecuted}\n`;

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PharmaCare_Coverage_${startDate}_to_${endDate}.csv`;
  a.click();
}
