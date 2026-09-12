/**
 * @file timeline-report.js
 * @description Reports page - "Daily Timeline" tab: visits & logged
 * activities for a rep on a given date range (From - To).
 * Depends on shared-report.js (must load after it).
 */

// Section 8: Tab 2 - Daily Visits & Logged Activities Timeline
// ============================================================================
function renderDailyTimeline() {
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
  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  // Filter visits within the date range
  let visitsInRange = REPORTS_DATA.visits.filter((v) => v.date >= fromDate && v.date <= toDate);

  if (isRep) {
    visitsInRange = visitsInRange.filter((v) => v.repId === user.id);
  } else if (role === 'line_manager') {
    const dms    = allUsers.filter((u) => u.managerId === user.id && u.role === 'district_manager');
    const dmIds  = dms.map((d) => d.id);
    const reps   = allUsers.filter((u) => dmIds.includes(u.managerId));
    const repIds = reps.map((r) => r.id);

    if (selectedRep === 'all') {
      visitsInRange = visitsInRange.filter((v) => dmIds.includes(v.repId) || repIds.includes(v.repId) || v.repId === user.id || dmIds.includes(v.doubleWithUserId) || v.doubleWithUserId === user.id);
    } else if (selectedRep === 'all_dms') {
      visitsInRange = visitsInRange.filter((v) => dmIds.includes(v.repId) || dmIds.includes(v.doubleWithUserId));
    } else if (selectedRep === 'all_reps') {
      visitsInRange = visitsInRange.filter((v) => repIds.includes(v.repId));
    } else if (dmIds.includes(selectedRep)) {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep);
    } else if (selectedRep) {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep);
    }
  } else if (selectedRep && selectedRep !== 'all') {
    if (selectedRep === user.id || selectedRep === 'dm1') {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep);
    } else {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep);
    }
  }

  // Load stored activities across the range
  let storedActivities = {};
  try {
    const raw = localStorage.getItem('pharma_activities_data');
    if (raw) storedActivities = JSON.parse(raw);
  } catch (e) {}

  const activityEvents = [];
  const showOwnActivities = isRep || selectedRep === user.id;
  if (showOwnActivities) {
    Object.keys(storedActivities).forEach((dateKey) => {
      if (dateKey < fromDate || dateKey > toDate) return;
      const dayActivities = storedActivities[dateKey] || {};
      if (dayActivities.AM && dayActivities.AM.type) {
        activityEvents.push({ targetName: `${dayActivities.AM.type} (AM Activity)`, class: 'Activity', specialty: dayActivities.AM.notes || 'Routine Activity', type: 'activity', date: dateKey, time: '09:00', period: 'AM', repName: user.name, isActual: true });
      }
      if (dayActivities.PM && dayActivities.PM.type) {
        activityEvents.push({ targetName: `${dayActivities.PM.type} (PM Activity)`, class: 'Activity', specialty: dayActivities.PM.notes || 'Routine Activity', type: 'activity', date: dateKey, time: '14:00', period: 'PM', repName: user.name, isActual: true });
      }
    });
  }

  const combinedTimeline = [...visitsInRange, ...activityEvents];
  const totalItems   = combinedTimeline.length;
  const actualCount  = combinedTimeline.filter((v) => v.isActual).length;
  const plannedCount = combinedTimeline.filter((v) => !v.isActual).length;

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
        <span>${lang === 'ar' ? 'فعلية / أنشطة:' : 'Actual / Activities:'}</span>
        <strong style="color: #b45309; font-size: 1.1rem; margin: 0 6px;">${actualCount}</strong>
      </div>
      <div class="timeline-stat-chip">
        <span class="legend-dot planned" style="display:inline-block; vertical-align:middle;"></span>
        <span>${lang === 'ar' ? 'من الخطة:' : 'From Plan:'}</span>
        <strong style="color: #0284c7; font-size: 1.1rem; margin: 0 6px;">${plannedCount}</strong>
      </div>
    `;
  }

  if (combinedTimeline.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm);">
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
    const borderClass = isActual ? 'actual-border' : 'planned-border';
    const dotClass    = isActual ? 'actual' : 'planned';
    const badgeClass  = isActual ? 'actual' : 'planned';
    const period      = (v.period || 'PM').toUpperCase();

    let badgeLabel = '';
    if (isActivity) {
      badgeLabel = lang === 'ar' ? 'نشاط مسجل (Logged Activity)' : 'Logged Activity';
    } else if (isActual) {
      badgeLabel = lang === 'ar' ? 'زيارة فعلية مباشرة (Actual Visit)' : 'Direct Actual Visit';
    } else {
      badgeLabel = lang === 'ar' ? 'زيارة من الخطة (Planned Visit)' : 'Planned & Executed';
    }

    // Colored AM/PM pill replaces the old time display
    const periodPillStyle = period === 'AM'
      ? 'background:#d1fae5; color:#065f46;'
      : 'background:#dbeafe; color:#1e40af;';

    const card = document.createElement('div');
    card.className = 'timeline-event-card';
    card.innerHTML = `
      <div class="timeline-time-col">
        <span style="font-size:0.8rem; color:var(--gray-500); font-weight:600; white-space:nowrap;">${v.date}</span>
        <span style="display:inline-block; padding:3px 10px; border-radius:20px; font-size:0.78rem; font-weight:700; ${periodPillStyle}">${period}</span>
        <div class="timeline-icon-dot ${dotClass}" style="font-size:1.1rem; display:flex; align-items:center; justify-content:center;">
          ${isActivity ? '📝' : (v.type === 'hospital' ? '🏥' : '👨‍⚕️')}
        </div>
      </div>
      <div class="timeline-content-box ${borderClass}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <strong style="font-size: 1.05rem; color: var(--gray-800);">${v.targetName}</strong>
          <span class="visit-badge-pill ${badgeClass}">${badgeLabel}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 6px;">
          <span>🩺 ${v.specialty}</span> • <span>Class: <strong>${v.class}</strong></span> • <span>Rep: ${v.repName}</span>
        </div>
        <div style="font-size: 0.78rem; color: var(--gray-500); background: var(--gray-50); padding: 6px 10px; border-radius: 6px; display: inline-block;">
          ⏰ <strong>${lang === 'ar' ? 'توقيت التسجيل:' : 'Entry Timestamp:'}</strong> ${v.date} at ${v.time || '10:00'} ${period}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================================
