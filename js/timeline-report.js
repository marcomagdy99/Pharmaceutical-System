/**
 * @file timeline-report.js
 * @description Reports page - "Daily Timeline" tab: visits & logged
 * activities for a rep on a given date range (From - To).
 * Depends on shared-report.js (must load after it).
 */

// Section 8: Tab 2 - Daily Visits & Logged Activities Timeline
// ============================================================================
function renderDailyTimeline() {
  const prompt = document.getElementById('timelinePromptContainer');
  const results = document.getElementById('timelineResultsContainer');
  if (prompt) prompt.style.display = 'none';
  if (results) results.style.display = 'block';

  syncReportsData();

  const _now = new Date();
  const _pad = (n) => String(n).padStart(2, '0');
  const _todayStr = `${_now.getFullYear()}-${_pad(_now.getMonth()+1)}-${_pad(_now.getDate())}`;

  const fromInput = document.getElementById('timelineDateFrom');
  const toInput   = document.getElementById('timelineDateTo');
  const fromDate  = (fromInput && fromInput.value) ? fromInput.value : _todayStr;
  const toDate    = (toInput   && toInput.value)   ? toInput.value   : _todayStr;

  const repSelect  = document.getElementById('timelineRepSelect');
  const selectedRep = repSelect ? repSelect.value : 'all';

  const container  = document.getElementById('timelineEventsContainer');
  const summaryBar = document.getElementById('timelineSummaryBar');
  const lang = getCurrentLang();

  if (!container) return;
  container.replaceChildren();

  const user    = checkAuth();
  const role    = window.normalizeRole ? window.normalizeRole(user?.role) : (user?.role || '').toLowerCase();
  const isRep   = window.isRepRole ? window.isRepRole(user) : (user && (user.role === 'medical_rep' || user.role === 'rep'));
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));

  // Determine allowed team IDs based on role
  let allowedTeamIds = [];
  if (isRep) {
    allowedTeamIds = [user.id];
  } else if (role === 'district_manager') {
    const teamReps = allUsers.filter((u) => u.managerId === user.id);
    allowedTeamIds = [user.id, ...teamReps.map((r) => r.id)];
  } else if (role === 'line_manager') {
    const dms = allUsers.filter((u) => u.managerId === user.id && (window.normalizeRole ? window.normalizeRole(u.role) === 'district_manager' : (u.role === 'district_manager' || u.role === 'dm')));
    const dmIds = dms.map((d) => d.id);
    const reps = allUsers.filter((u) => dmIds.includes(u.managerId));
    allowedTeamIds = [user.id, ...dmIds, ...reps.map((r) => r.id)];
  } else if (role === 'business_unit') {
    const myLMs = allUsers.filter((u) => u.managerId === user.id && (u.role === 'line_manager' || u.role === 'lm'));
    const lmIds = myLMs.map((u) => u.id);
    const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    allowedTeamIds = [user.id, ...lmIds, ...myDownstream.map((u) => u.id)];
  } else {
    allowedTeamIds = allUsers.map((u) => u.id);
  }

  // Filter visits within the date range (only completed or actual visits)
  let visitsInRange = REPORTS_DATA.visits.filter((v) => (v.status === 'completed' || v.isActual === true || v.source === 'actual') && v.date >= fromDate && v.date <= toDate);

  if (isRep) {
    visitsInRange = visitsInRange.filter((v) => v.repId === user.id);
  } else if (selectedRep === 'all') {
    visitsInRange = visitsInRange.filter((v) => allowedTeamIds.includes(v.repId) || allowedTeamIds.includes(v.doubleWithUserId));
  } else if (selectedRep) {
    const selectedUserObj = allUsers.find((u) => u.id === selectedRep);
    const isDM = selectedUserObj && (selectedUserObj.role === 'district_manager' || selectedUserObj.role === 'dm');
    if (isDM) {
      const dmReps = allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id);
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep || (v.repId && dmReps.includes(v.repId)));
    } else {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep);
    }
  }

  // Load stored activities across the range for all relevant users
  let activityTargetIds = [];
  if (isRep) {
    activityTargetIds = [user.id];
  } else if (selectedRep && selectedRep !== 'all') {
    activityTargetIds = [selectedRep];
  } else {
    activityTargetIds = allowedTeamIds.length > 0 ? allowedTeamIds : allUsers.map((u) => u.id);
  }

  const activityEvents = [];
  activityTargetIds.forEach((targetId) => {
    let repStoredActivities = {};
    try {
      const userKey = `pharma_activities_data_${targetId}`;
      let raw = localStorage.getItem(userKey);
      if (!raw && targetId === 'rep1') {
        raw = localStorage.getItem('pharma_activities_data');
      }
      if (raw) repStoredActivities = JSON.parse(raw);
    } catch (e) {}

    const targetRepObj = allUsers.find((u) => u.id === targetId) || { id: targetId, name: targetId };

    Object.keys(repStoredActivities).forEach((dateKey) => {
      if (dateKey < fromDate || dateKey > toDate) return;
      const dayActs = repStoredActivities[dateKey] || {};
      ['AM', 'PM'].forEach((period) => {
        const act = dayActs[period];
        if (act && act.type) {
          const actTypeTrans = (window.translations && window.translations[lang] && window.translations[lang][`type${act.type}`]) || act.type;
          activityEvents.push({
            id: `act_${targetId}_${dateKey}_${period}`,
            targetName: `${actTypeTrans} (${period} Activity)`,
            activityType: actTypeTrans,
            class: 'Activity',
            specialty: act.notes || (lang === 'ar' ? 'نشاط يومي مسجل' : 'Logged Daily Activity'),
            type: 'activity',
            date: dateKey,
            time: period === 'AM' ? '09:00' : '14:00',
            period: period,
            repId: targetId,
            repName: targetRepObj.name || targetId,
            isActual: true,
            source: 'activity',
            status: 'completed',
          });
        }
      });
    });
  });

  const combinedTimeline = [...visitsInRange, ...activityEvents];
  const totalItems       = combinedTimeline.length;
  const activityCount    = combinedTimeline.filter((v) => v.type === 'activity').length;
  const actualVisitCount = combinedTimeline.filter((v) => v.type !== 'activity' && (v.source === 'actual' || v.isActual)).length;
  const plannedVisitCount= combinedTimeline.filter((v) => v.type !== 'activity' && !v.isActual && v.source !== 'actual').length;

  const dateBadge = document.getElementById('timelineDateBadge');
  if (dateBadge) {
    dateBadge.textContent = fromDate === toDate ? (fromDate === _todayStr ? (lang === 'ar' ? 'اليوم' : 'Today') : fromDate) : `${fromDate} → ${toDate}`;
  }

  if (summaryBar) {
    const rangeLabel = fromDate === toDate ? fromDate : `${fromDate} → ${toDate}`;
    summaryBar.innerHTML = `
      <div class="timeline-stat-chip">
        <span>${lang === 'ar' ? 'الفترة:' : 'Period:'}</span>
        <strong style="color: var(--primary); font-size: 1rem; margin: 0 6px;">${rangeLabel}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span>${lang === 'ar' ? 'إجمالي الأحداث:' : 'Total Events:'}</span>
        <strong style="color: var(--primary); font-size: 1.1rem; margin: 0 6px;">${totalItems}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot actual" style="display:inline-block; vertical-align:middle;"></span>
        <span>${lang === 'ar' ? 'زيارات فعلية:' : 'Actual Visits:'}</span>
        <strong style="color: #b45309; font-size: 1.1rem; margin: 0 6px;">${actualVisitCount}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot planned" style="display:inline-block; vertical-align:middle;"></span>
        <span>${lang === 'ar' ? 'من الخطة:' : 'From Plan:'}</span>
        <strong style="color: #0284c7; font-size: 1.1rem; margin: 0 6px;">${plannedVisitCount}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot activity" style="background:#9333ea; display:inline-block; vertical-align:middle;"></span>
        <span>${lang === 'ar' ? 'أنشطة مسجلة:' : 'Logged Activities:'}</span>
        <strong style="color: #6b21a8; font-size: 1.1rem; margin: 0 6px;">${activityCount}</strong>
      </div>
    `;
  }

  if (combinedTimeline.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty-card" style="text-align: center; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color, #dee2e6);">
        <span style="font-size: 2.5rem;">📅</span>
        <h4 style="margin: 10px 0 4px; color: var(--gray-700);">${lang === 'ar' ? 'لا توجد زيارات أو أنشطة مسجلة في هذه الفترة' : 'No visits or activities recorded in this period'}</h4>
        <p style="color: var(--gray-500); font-size: 0.85rem;">${lang === 'ar' ? 'جرّب تاريخاً أو فترة زمنية مختلفة' : 'Try a different date or date range'}</p>
      </div>
    `;
    return;
  }

  // Sort by date ascending (earliest day first), then AM before PM
  const sortedTimeline = combinedTimeline.sort((a, b) => {
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;
    const periodA = (a.period || 'PM').toUpperCase() === 'AM' ? 0 : 1;
    const periodB = (b.period || 'PM').toUpperCase() === 'AM' ? 0 : 1;
    return periodA - periodB;
  });

  sortedTimeline.forEach((v) => {
    const isActivity = v.type === 'activity';
    const isActual   = !!v.isActual;
    const borderClass = isActivity ? 'activity-border' : (isActual ? 'actual-border' : 'planned-border');
    const dotClass    = isActivity ? 'activity' : (isActual ? 'actual' : 'planned');
    const isPharm     = v.targetType === 'pharmacy' || (v.period || '').toLowerCase() === 'pharmacy' || (v.doctorId && String(v.doctorId).startsWith('pharm'));
    const period      = isPharm ? (lang === 'ar' ? 'صيدلية' : 'PHARM') : (v.period || 'PM').toUpperCase();
    const periodClass = isPharm ? 'pharm' : period.toLowerCase();

    let badgeLabel = '';
    let badgeClass = 'planned';
    if (isActivity) {
      badgeClass = 'activity';
      badgeLabel = lang === 'ar' ? 'نشاط رسمي مسجل (Logged Activity)' : 'Logged Activity';
    } else if (isActual) {
      badgeClass = 'actual';
      badgeLabel = lang === 'ar' ? 'زيارة فعلية مباشرة (Actual Visit)' : 'Direct Actual Visit';
    } else {
      badgeClass = 'planned';
      badgeLabel = lang === 'ar' ? 'زيارة من الخطة (Planned Visit)' : 'Planned & Executed';
    }

    const card = document.createElement('div');
    card.className = 'timeline-event-card';
    card.innerHTML = `
      <div class="timeline-time-col">
        <span style="font-size:0.8rem; color:var(--gray-500); font-weight:600; white-space:nowrap;">${v.date}</span>
        <span class="timeline-period-pill ${periodClass}">${period}</span>
        <div class="timeline-icon-dot ${dotClass}"></div>
      </div>
      <div class="timeline-content-box ${borderClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <strong class="timeline-target-title" style="font-size: 1.05rem; ${isActivity ? 'color: #6b21a8;' : ''}">${v.targetName}</strong>
          <span class="visit-badge-pill ${badgeClass}">${badgeLabel}</span>
        </div>
        ${isActivity ? `
          <div style="font-size: 0.88rem; color: var(--gray-700); margin-bottom: 6px; line-height: 1.5;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #6b21a8;">
              ${lang === 'ar' ? 'نوع النشاط:' : 'Activity Type:'} <strong>${v.activityType || v.targetName}</strong>
            </span>
            ${v.specialty ? `• <span style="color: var(--gray-600);">${lang === 'ar' ? 'ملاحظات:' : 'Notes:'} <em>"${v.specialty}"</em></span>` : ''}
            • <span style="font-weight: 500;">${lang === 'ar' ? 'الموظف:' : 'Employee:'} <strong>${v.repName}</strong></span>
          </div>
        ` : `
          <div style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 6px;">
            <span>${v.specialty || ''}</span> • <span>Class: <strong>${v.class || 'A'}</strong></span> • <span>Rep: <strong>${v.repName}</strong></span>
          </div>
        `}
        <div class="timeline-entry-timestamp" style="font-size: 0.78rem; padding: 6px 10px; border-radius: 6px; display: inline-block;">
          <strong>${lang === 'ar' ? 'توقيت التسجيل:' : 'Entry Timestamp:'}</strong> ${v.date} at ${v.time || '10:00'} ${period}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================================
