const fs = require('fs');

let content = fs.readFileSync('js/dashboard.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Line 1025: lineNames
content = content.replace(
  'const lineNames = userLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");',
  'const lineNames = userLines.map((l) => l.name).join(", ");'
);

// 2. Lines 1029-1037: tab titles
content = content.replace(
  '? (lang === "ar" ? "الزيارات المستحقة السابقة" : "Overdue Visits")',
  '? "Overdue Visits"'
);
content = content.replace(
  '? (lang === "ar" ? "خطة زيارات الغد" : "Tomorrow\'s Plan")',
  '? "Tomorrow\'s Plan"'
);
content = content.replace(
  '? (lang === "ar" ? "الزيارات القادمة المخططة" : "Upcoming Visits")',
  '? "Upcoming Visits"'
);
content = content.replace(
  '? (lang === "ar" ? "كل الزيارات المخططة النشطة" : "All Active Planned Visits")',
  '? "All Active Planned Visits"'
);
content = content.replace(
  '? (lang === "ar" ? `خطة يوم: ${window.currentRepPlanDate}` : `Plan for: ${window.currentRepPlanDate}`)',
  '? `Plan for: ${window.currentRepPlanDate}`'
);

// 3. Lines 1042-1045: autoExpireHint
content = content.replace(
  `  const autoExpireHint = expiryDays > 0
    ? (lang === "ar"
        ? \`تنتهي الصلاحية تلقائياً بعد \${expiryDays} \${expiryDays === 1 ? "يوم" : (expiryDays === 2 ? "يومين" : (expiryDays <= 10 ? "أيام" : "يوماً"))} إذا لم تُنفذ\`
        : \`Auto-expires after \${expiryDays} day\${expiryDays > 1 ? "s" : ""} if not executed\`)
    : "";`,
  `  const autoExpireHint = expiryDays > 0
    ? \`Auto-expires after \${expiryDays} day\${expiryDays > 1 ? "s" : ""} if not executed\`
    : "";`
);

// 4. Lines 1050-1051: Welcome banner
content = content.replace(
  '<h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "المندوب الطبي" : "Medical Representative"} ${userName}!</h2>',
  '<h2 class="welcome-title">${t.welcome_back}, Medical Representative ${userName}!</h2>'
);
content = content.replace(
  '<div class="welcome-subtitle">${lineNames || (lang === "ar" ? "المندوب الطبي" : "Medical Representative")}</div>',
  '<div class="welcome-subtitle">${lineNames || "Medical Representative"}</div>'
);

// 5. Lines 1061-1091: stats labels
content = content.replace(
  '${lang === "ar" ? "أطباء اللستة المسندين" : "Assigned Doctor List"}',
  'Assigned Doctor List'
);
content = content.replace(
  '<div class="stat-label">${lang === "ar" ? `زيارات العيادات (PM - ${quarterLabel})` : `Clinics (PM - ${quarterLabel})`}</div>',
  '<div class="stat-label">Clinics (PM - ${quarterLabel})</div>'
);
content = content.replace(
  '${lang === "ar" ? `مستهدف الزيارات / الربع (${totalDoctorsCount} أطباء)` : `Target Visits / Quarter (${totalDoctorsCount} Doctors)`}',
  'Target Visits / Quarter (${totalDoctorsCount} Doctors)'
);
content = content.replace(
  '<div class="stat-label">${lang === "ar" ? `زيارات المستشفيات (AM - ${quarterLabel})` : `Hospitals (AM - ${quarterLabel})`}</div>',
  '<div class="stat-label">Hospitals (AM - ${quarterLabel})</div>'
);
content = content.replace(
  '${lang === "ar" ? `مستهدف الزيارات / الربع (${totalHospitalsCount} مستشفيات)` : `Target Visits / Quarter (${totalHospitalsCount} Hospitals)`}',
  'Target Visits / Quarter (${totalHospitalsCount} Hospitals)'
);
content = content.replace(
  '<div class="stat-label">${lang === "ar" ? "الأطباء الذين تم زيارتهم (هذا الشهر)" : "Doctors Visited (This Month)"}</div>',
  '<div class="stat-label">Doctors Visited (This Month)</div>'
);
content = content.replace(
  '${lang === "ar" ? `نسبة الوصول: ${overallCoveragePct}%` : `Reach: ${overallCoveragePct}%`} • ${lang === "ar" ? `${Math.max(0, totalDoctorsCount - coveredDoctorsCount)} متبقي` : `${Math.max(0, totalDoctorsCount - coveredDoctorsCount)} Left`}',
  'Reach: ${overallCoveragePct}% • ${Math.max(0, totalDoctorsCount - coveredDoctorsCount)} Left'
);

// 6. Line 1105, 1128:
content = content.replace(
  '${todayPlanned.length} ${lang === "ar" ? "اليوم" : "Today"}${overduePlanned.length > 0 ? ` • ${overduePlanned.length} ${lang === "ar" ? "مستحقة سابقة" : "Overdue"}` : ""} • ${upcomingPlanned.length} ${lang === "ar" ? "قادمة" : "Upcoming"}',
  '${todayPlanned.length} Today${overduePlanned.length > 0 ? ` • ${overduePlanned.length} Overdue` : ""} • ${upcomingPlanned.length} Upcoming'
);
content = content.replace(
  "⚠️ ${lang === 'ar' ? 'مستحقة سابقة' : 'Overdue'} <span class=\"badge badge-overdue\">${overduePlanned.length}</span>",
  '⚠️ Overdue <span class="badge badge-overdue">${overduePlanned.length}</span>'
);

// 7. Lines 1163-1245: Cards rendering (h, d, p)
const planBadgeOldH = '${h.date === todayStr ? `<span class="badge badge-plan-today">${lang === "ar" ? "اليوم" : "Today"}</span>` : (h.date === tomorrowStr ? `<span class="badge badge-plan-tomorrow">${lang === "ar" ? "غداً" : "Tomorrow"}</span>` : (h.date > todayStr ? `<span class="badge badge-plan-upcoming">${lang === "ar" ? "قادمة" : "Upcoming"}</span>` : `<span class="badge badge-plan-overdue">${lang === "ar" ? "مستحقة سابقة" : "Overdue"}</span>`))}';
const planBadgeNewH = '${h.date === todayStr ? `<span class="badge badge-plan-today">Today</span>` : (h.date === tomorrowStr ? `<span class="badge badge-plan-tomorrow">Tomorrow</span>` : (h.date > todayStr ? `<span class="badge badge-plan-upcoming">Upcoming</span>` : `<span class="badge badge-plan-overdue">Overdue</span>`))}';
content = content.replace(planBadgeOldH, planBadgeNewH);
content = content.replace(
  '${h.visitType === "double" ? `<span class="badge badge-plan-double">🤝 ${lang === "ar" ? "مرافقة" : "Double"}</span>` : ""}',
  '${h.visitType === "double" ? `<span class="badge badge-plan-double">🤝 Double</span>` : ""}'
);
content = content.replace(
  `onclick="openRescheduleModal('\${h.id}')" title="\${lang === 'ar' ? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">\n                  🗓️ \${lang === 'ar' ? 'تأجيل' : 'Reschedule'}`,
  `onclick="openRescheduleModal('\${h.id}')" title="Reschedule or Missed Call">\n                  🗓️ Reschedule`
);

const planBadgeOldD = '${d.date === todayStr ? `<span class="badge badge-plan-today">${lang === "ar" ? "اليوم" : "Today"}</span>` : (d.date === tomorrowStr ? `<span class="badge badge-plan-tomorrow">${lang === "ar" ? "غداً" : "Tomorrow"}</span>` : (d.date > todayStr ? `<span class="badge badge-plan-upcoming">${lang === "ar" ? "قادمة" : "Upcoming"}</span>` : `<span class="badge badge-plan-overdue">${lang === "ar" ? "مستحقة سابقة" : "Overdue"}</span>`))}';
const planBadgeNewD = '${d.date === todayStr ? `<span class="badge badge-plan-today">Today</span>` : (d.date === tomorrowStr ? `<span class="badge badge-plan-tomorrow">Tomorrow</span>` : (d.date > todayStr ? `<span class="badge badge-plan-upcoming">Upcoming</span>` : `<span class="badge badge-plan-overdue">Overdue</span>`))}';
content = content.replace(planBadgeOldD, planBadgeNewD);
content = content.replace(
  '${d.visitType === "double" ? `<span class="badge badge-plan-double">🤝 ${lang === "ar" ? "مرافقة" : "Double"}</span>` : ""}',
  '${d.visitType === "double" ? `<span class="badge badge-plan-double">🤝 Double</span>` : ""}'
);
content = content.replace(
  `onclick="openRescheduleModal('\${d.id}')" title="\${lang === 'ar' ? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">\n                  🗓️ \${lang === 'ar' ? 'تأجيل' : 'Reschedule'}`,
  `onclick="openRescheduleModal('\${d.id}')" title="Reschedule or Missed Call">\n                  🗓️ Reschedule`
);

const planBadgeOldP = '${p.date === todayStr ? `<span class="badge badge-plan-today">${lang === "ar" ? "اليوم" : "Today"}</span>` : (p.date === tomorrowStr ? `<span class="badge badge-plan-tomorrow">${lang === "ar" ? "غداً" : "Tomorrow"}</span>` : (p.date > todayStr ? `<span class="badge badge-plan-upcoming">${lang === "ar" ? "قادمة" : "Upcoming"}</span>` : `<span class="badge badge-plan-overdue">${lang === "ar" ? "مستحقة سابقة" : "Overdue"}</span>`))}';
const planBadgeNewP = '${p.date === todayStr ? `<span class="badge badge-plan-today">Today</span>` : (p.date === tomorrowStr ? `<span class="badge badge-plan-tomorrow">Tomorrow</span>` : (p.date > todayStr ? `<span class="badge badge-plan-upcoming">Upcoming</span>` : `<span class="badge badge-plan-overdue">Overdue</span>`))}';
content = content.replace(planBadgeOldP, planBadgeNewP);
content = content.replace(
  '${p.visitType === "double" ? `<span class="badge badge-plan-double">🤝 ${lang === "ar" ? "مرافقة" : "Double"}</span>` : ""}',
  '${p.visitType === "double" ? `<span class="badge badge-plan-double">🤝 Double</span>` : ""}'
);
content = content.replace(
  `onclick="openRescheduleModal('\${p.id}')" title="\${lang === 'ar' ? 'تأجيل الزيارة أو تعذر المقابلة' : 'Reschedule or Missed Call'}">\n                  🗓️ \${lang === 'ar' ? 'تأجيل' : 'Reschedule'}`,
  `onclick="openRescheduleModal('\${p.id}')" title="Reschedule or Missed Call">\n                  🗓️ Reschedule`
);

// 8. Line 1291: Ins line
content = content.replace(
  "return `<div class=\"dt-ins-line\" title=\"Insertion Date & Time\">📥 ${lang === 'ar' ? 'إدخال:' : 'Ins:'} ${insD} ${insT}</div>`;",
  'return `<div class="dt-ins-line" title="Insertion Date & Time">📥 Ins: ${insD} ${insT}</div>`;'
);

// 9. Lines 1358-1392: Team live follow up feed
content = content.replace(
  '${lang === "ar" ? "المتابعة الحية لزيارات الفريق (Live Follow-up Feed)" : "Team Live Follow-up Feed"}',
  'Team Live Follow-up Feed'
);
content = content.replace(
  '${displayVisits.length} ${lang === "ar" ? "زيارة معروضة" : "visits shown"}',
  '${displayVisits.length} visits shown'
);
content = content.replace(
  `            \${lang === "ar"
              ? "متابعة فورية لحظة بلحظة للزيارات المنفذة بواسطة مناديب منطقتك وملاحظاتهم الميدانية على الدكاترة والصيدليات."
              : "Real-time feed of completed visits and field notes logged by your medical reps across territories."}`,
  '            Real-time feed of completed visits and field notes logged by your medical reps across territories.'
);

content = content.replace(
  '⏱️ ${lang === "ar" ? `آخر 15 زيارة (${teamCompleted.length})` : `Latest 15 Visits (${teamCompleted.length})`}',
  '⏱️ Latest 15 Visits (${teamCompleted.length})'
);
content = content.replace(
  '📅 ${lang === "ar" ? `زيارات اليوم (${todayCount})` : `Today\'s Visits (${todayCount})`}',
  '📅 Today\'s Visits (${todayCount})'
);
content = content.replace(
  '🔍 ${lang === "ar" ? "سجل الزيارات الكامل" : "All Visits"}',
  '🔍 All Visits'
);

content = content.replace('<th class="feed-th-cell">${lang === "ar" ? "الوقت والتاريخ" : "Time & Date"}</th>', '<th class="feed-th-cell">Time & Date</th>');
content = content.replace('<th class="feed-th-cell">${lang === "ar" ? "المندوب والمنطقة" : "Rep & Territory"}</th>', '<th class="feed-th-cell">Rep & Territory</th>');
content = content.replace('<th class="feed-th-cell">${lang === "ar" ? "العميل المستهدف" : "Target Account"}</th>', '<th class="feed-th-cell">Target Account</th>');
content = content.replace('<th class="feed-th-cell">${lang === "ar" ? "المنتجات المشروحة" : "Promoted Products"}</th>', '<th class="feed-th-cell">Promoted Products</th>');
content = content.replace('<th class="feed-th-cell feed-th-notes">${lang === "ar" ? "ملاحظات وتغذية راجعة (Feedback / Notes)" : "Rep Feedback / Notes"}</th>', '<th class="feed-th-cell feed-th-notes">Rep Feedback / Notes</th>');

// 10. Lines 1401-1459: Feed row rendering
content = content.replace('const repName = rep ? rep.name : (v.repName || (lang === "ar" ? "مندوب" : "Rep"));', 'const repName = rep ? rep.name : (v.repName || "Rep");');
content = content.replace('(v.doctorName || "").toLowerCase().includes("مستشفى")', '(v.doctorName || "").toLowerCase().includes("hospital")');
content = content.replace('? `<span class="badge badge-target-pharmacy">💊 ${lang === "ar" ? "صيدلية" : "Pharmacy"}</span>`', '? `<span class="badge badge-target-pharmacy">💊 Pharmacy</span>`');
content = content.replace('? `<span class="badge badge-target-hospital">🏥 ${lang === "ar" ? "مستشفى" : "Hospital"}</span>`', '? `<span class="badge badge-target-hospital">🏥 Hospital</span>`');
content = content.replace(': `<span class="badge badge-target-doctor">🩺 ${lang === "ar" ? "طبيب" : "Doctor"}</span>`;', ': `<span class="badge badge-target-doctor">🩺 Doctor</span>`;');
content = content.replace(': `<span class="feed-no-notes">${lang === "ar" ? "لا توجد ملاحظات مسجلة" : "No notes recorded"}</span>`;', ': `<span class="feed-no-notes">No notes recorded</span>`;');
content = content.replace(
  '? `<div class="feed-samples-box">🎁 <strong>${lang === "ar" ? "عينات:" : "Samples:"}</strong> ${window.escapeHtml(rawSamples.map((s) => typeof s === "string" ? s : `${s.name || s.productName || "Sample"} (${s.quantity || s.qty || 1})`).join(", "))}</div>`',
  '? `<div class="feed-samples-box">🎁 <strong>Samples:</strong> ${window.escapeHtml(rawSamples.map((s) => typeof s === "string" ? s : `${s.name || s.productName || "Sample"} (${s.quantity || s.qty || 1})`).join(", "))}</div>`'
);
content = content.replace('? `<span class="badge badge-feed-double">🤝 ${lang === "ar" ? "مزدوجة" : "Double"}</span>`', '? `<span class="badge badge-feed-double">🤝 Double</span>`');
content = content.replace('${isToday ? `<span class="feed-today-text">🟢 ${lang === "ar" ? "اليوم" : "Today"}</span>` : (v.date || "-")}', '${isToday ? `<span class="feed-today-text">🟢 Today</span>` : (v.date || "-")}');

// 11. Lines 1496-1504: empty cell
content = content.replace(
  `                      \${
                        filterMode === "today"
                          ? (lang === "ar"
                              ? "لا توجد زيارات منفذة بواسطة فريقك اليوم حتى الآن ⏳"
                              : "No visits logged by your team today yet ⏳")
                          : (lang === "ar"
                              ? "لا توجد زيارات منفذة مسجلة لفريقك بعد."
                              : "No completed visits recorded for your team yet.")
                      }`,
  `                      \${
                        filterMode === "today"
                          ? "No visits logged by your team today yet ⏳"
                          : "No completed visits recorded for your team yet."
                      }`
);

// 12. Lines 1526, 1683-1743: DM dashboard
content = content.replace(
  'const lineNames = dmLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");',
  'const lineNames = dmLines.map((l) => l.name).join(", ");'
);
content = content.replace(
  '<h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مدير المنطقة" : "District Manager"} ${userName}!</h2>',
  '<h2 class="welcome-title">${t.welcome_back}, District Manager ${userName}!</h2>'
);
content = content.replace(
  '<div class="welcome-subtitle">${lineNames || (lang === "ar" ? "إدارة المناطق" : "District Management")}</div>',
  '<div class="welcome-subtitle">${lineNames || "District Management"}</div>'
);
content = content.replace(
  '<span class="line-filter-label">🏷️ ${lang === "ar" ? "تصفية بالخط:" : "Filter by Line:"}</span>',
  '<span class="line-filter-label">🏷️ Filter by Line:</span>'
);
content = content.replace(
  '${lang === "ar" ? `جميع الخطوط (${dmLines.length})` : `All Lines (${dmLines.length})`}',
  'All Lines (${dmLines.length})'
);
content = content.replace(
  '<span>${lang === "ar" ? "زيارات الفريق (هذا الشهر)" : "Team Visits (This Month)"}</span>',
  '<span>Team Visits (This Month)</span>'
);
content = content.replace(
  '${lang === "ar" ? "عرض زيارات الشهر ←" : "View Team Visits →"}',
  'View Team Visits →'
);
content = content.replace(
  '<span>${t.plans_review || (lang === "ar" ? "خطط للمراجعة" : "Plans to Review")}</span>',
  '<span>${t.plans_review || "Plans to Review"}</span>'
);
content = content.replace(
  '${lang === "ar" ? "مراجعة واعتماد الخطط ←" : "Review & Approve Plans →"}',
  'Review & Approve Plans →'
);
content = content.replace(
  '<span>${t.leave_requests || (lang === "ar" ? "طلبات إجازة للموافقة" : "Leave Requests to Approve")}</span>',
  '<span>${t.leave_requests || "Leave Requests to Approve"}</span>'
);
content = content.replace(
  '${lang === "ar" ? "مراجعة واعتماد الإجازات ←" : "Review & Approve Leaves →"}',
  'Review & Approve Leaves →'
);

// 13. Lines 1754-1901: Field accompaniment schedule
content = content.replace(
  '${lang === "ar" ? "جدول النزول الميداني والمرافقة (Co-Visiting)" : "Field Accompaniment Schedule (Co-Visiting)"}',
  'Field Accompaniment Schedule (Co-Visiting)'
);
content = content.replace(
  '📋 ${lang === "ar" ? `كل الأيام المحددة (${scheduledDates.length})` : `All Scheduled Days (${scheduledDates.length})`}',
  '📋 All Scheduled Days (${scheduledDates.length})'
);
content = content.replace(
  '📅 ${lang === "ar" ? "عرض يوم محدد" : "Daily View"}',
  '📅 Daily View'
);
content = content.replace(
  '📋 <span>${lang === "ar" ? "مراجعة الخطط وجدولة النزول الميداني" : "Review Plans & Schedule Accompaniment"}</span>',
  '📋 <span>Review Plans & Schedule Accompaniment</span>'
);
content = content.replace(
  '${lang === "ar" ? "لم يتم جدولة أيام نزول ميداني مشتركة بعد" : "No field accompaniment days scheduled yet"}',
  'No field accompaniment days scheduled yet'
);
content = content.replace(
  '${lang === "ar" ? "انتقل إلى «مراجعة واعتماد الخطط» لمراجعة خطط مناديب فريقك واختيار الأيام التي ترغب بمرافقتهم فيها بالكامل." : \'Go to "Plans to Review" to review your team\\\'s planned schedules and choose full days to accompany them.\'}',
  'Go to "Plans to Review" to review your team\'s planned schedules and choose full days to accompany them.'
);
content = content.replace(
  '📋 ${lang === "ar" ? "الذهاب لمراجعة الخطط وحجز الأيام" : "Go to Plans to Review"}',
  '📋 Go to Plans to Review'
);
content = content.replace(
  '? `<span class="pill-office">🏢 ${lang === "ar" ? "مكتبي" : "Office"}</span>`',
  '? `<span class="pill-office">🏢 Office</span>`'
);

content = content.replace('<th class="dm-covisit-sticky-col">${lang === "ar" ? "التاريخ واليوم" : "Date & Day"}</th>', '<th class="dm-covisit-sticky-col">Date & Day</th>');
content = content.replace('<th>${lang === "ar" ? "المندوب المرافق" : "Accompanied Rep"}</th>', '<th>Accompanied Rep</th>');
content = content.replace('<th>${lang === "ar" ? "الهدف المخطط" : "Planned Target"}</th>', '<th>Planned Target</th>');
content = content.replace('<th class="dm-covisit-products-col">${lang === "ar" ? "المنتجات" : "Products"}</th>', '<th class="dm-covisit-products-col">Products</th>');
content = content.replace('<th class="text-end covisit-action-cell">${lang === "ar" ? "إجراء المرافقة" : "Co-Visit Action"}</th>', '<th class="text-end covisit-action-cell">Co-Visit Action</th>');

// Lines 1849-1861:
const oldTargetL1850 = `                            const targetLabel = isPharm
                              ? lang === "ar"
                                ? "صيدلية"
                                : "Pharmacy"
                              : isHospital
                                ? lang === "ar"
                                  ? "مستشفى"
                                  : "Hospital"
                                : lang === "ar"
                                  ? "عيادة طبيب"
                                  : "Clinic Visit";
                            const periodBadge = isPharm
                              ? \`<span class="badge badge-period-pharm">💊 \${lang === "ar" ? "صيدلية" : "PHARM"}</span>\``;

const newTargetL1850 = `                            const targetLabel = isPharm
                              ? "Pharmacy"
                              : isHospital
                                ? "Hospital"
                                : "Clinic Visit";
                            const periodBadge = isPharm
                              ? \`<span class="badge badge-period-pharm">💊 PHARM</span>\``;

content = content.replace(oldTargetL1850, newTargetL1850);

content = content.replace('🤝 ${lang === "ar" ? "تسجيل الزيارة المزدوجة" : "Log Double Visit"}', '🤝 Log Double Visit');
content = content.replace(
  '${lang === "ar" ? "لا توجد زيارات مخططة للمناديب في الأيام المحددة أعلاه، أو أن الأيام المحددة إدارية/مكتبية." : "No planned visits scheduled by reps on the confirmed dates, or the days are set as office days."}',
  'No planned visits scheduled by reps on the confirmed dates, or the days are set as office days.'
);

// Lines 1919-1989:
content = content.replace(
  '${lang === "ar" ? "لم يتم جدولة أيام نزول ميداني مشتركة بعد" : "No field accompaniment days scheduled yet"}',
  'No field accompaniment days scheduled yet'
);
content = content.replace(
  '${lang === "ar" ? "انتقل إلى «مراجعة واعتماد الخطط» لمراجعة خطط مناديب فريقك واختيار الأيام التي ترغب بمرافقتهم فيها بالكامل." : \'Go to "Plans to Review" to review your team\\\'s planned schedules and choose full days to accompany them.\'}',
  'Go to "Plans to Review" to review your team\'s planned schedules and choose full days to accompany them.'
);
content = content.replace(
  '📋 ${lang === "ar" ? "الذهاب لمراجعة الخطط وحجز الأيام" : "Go to Plans to Review"}',
  '📋 Go to Plans to Review'
);
content = content.replace(
  '<span class="dm-schedule-pills-label">📅 ${lang === "ar" ? "الأيام المجدولة:" : "Scheduled Days:"}</span>',
  '<span class="dm-schedule-pills-label">📅 Scheduled Days:</span>'
);
content = content.replace(
  '${lang === "ar" ? `تاريخ ${selectedDate}: لا يوجد نزول ميداني مجدول لهذا اليوم` : `Date ${selectedDate}: No field accompaniment scheduled for this day`}',
  'Date ${selectedDate}: No field accompaniment scheduled for this day'
);
content = content.replace(
  '${lang === "ar" ? "اختر يوماً من الأيام المجدولة أعلاه أو انتقل إلى صفحة مراجعة الخطط لجدولة أيام جديدة." : "Select a date from the scheduled days above or go to Plans to Review to schedule new days."}',
  'Select a date from the scheduled days above or go to Plans to Review to schedule new days.'
);
content = content.replace(
  '<strong class="dm-office-title">${lang === "ar" ? `تاريخ ${selectedDate}: يوم مكتبي / عمل إداري ومتابعة` : `Date ${selectedDate}: Office Work / Administrative Day`}</strong>',
  '<strong class="dm-office-title">Date ${selectedDate}: Office Work / Administrative Day</strong>'
);
content = content.replace(
  '<span>${lang === "ar" ? `نزول ميداني مشترك برفقة: ${accompaniedRep.name}` : `Joint Field Accompaniment with: ${accompaniedRep.name}`}</span>',
  '<span>Joint Field Accompaniment with: ${accompaniedRep.name}</span>'
);
content = content.replace(
  '📅 ${dtSelected.dayName} ${selectedDate} ${selectedDate === todayStr ? (lang === "ar" ? "• (اليوم)" : "• (Today)") : ""} • ${pendingAccompaniedVisits.length} ${lang === "ar" ? "زيارة مخططة للنزول المشترك" : "planned joint visits"}',
  '📅 ${dtSelected.dayName} ${selectedDate} ${selectedDate === todayStr ? "• (Today)" : ""} • ${pendingAccompaniedVisits.length} planned joint visits'
);
content = content.replace(
  '📍 ${lang === "ar" ? "فتح في الزيارات الميدانية" : "Open in Visits Page"}',
  '📍 Open in Visits Page'
);

// Lines 1998-2060:
content = content.replace('<th>${lang === "ar" ? "الهدف المخطط" : "Planned Target"}</th>', '<th>Planned Target</th>');
content = content.replace('<th>${lang === "ar" ? "الفترة" : "Period"}</th>', '<th>Period</th>');
content = content.replace('<th class="dm-covisit-products-col">${lang === "ar" ? "المنتجات" : "Products"}</th>', '<th class="dm-covisit-products-col">Products</th>');
content = content.replace('<th class="text-end covisit-action-cell">${lang === "ar" ? "إجراء المرافقة" : "Co-Visit Action"}</th>', '<th class="text-end covisit-action-cell">Co-Visit Action</th>');

const oldTargetL2016 = `                              const targetLabel = isPharm
                                ? lang === "ar"
                                  ? "صيدلية"
                                  : "Pharmacy"
                                : isHospital
                                  ? lang === "ar"
                                    ? "مستشفى"
                                    : "Hospital"
                                  : lang === "ar"
                                    ? "عيادة طبيب"
                                    : "Clinic Visit";
                              const periodBadge = isPharm
                                ? \`<span class="badge badge-period-pharm">💊 \${lang === "ar" ? "صيدلية" : "PHARM"}</span>\``;

const newTargetL2016 = `                              const targetLabel = isPharm
                                ? "Pharmacy"
                                : isHospital
                                  ? "Hospital"
                                  : "Clinic Visit";
                              const periodBadge = isPharm
                                ? \`<span class="badge badge-period-pharm">💊 PHARM</span>\``;

content = content.replace(oldTargetL2016, newTargetL2016);
content = content.replace('🤝 ${lang === "ar" ? "تسجيل الزيارة المزدوجة" : "Log Double Visit"}', '🤝 Log Double Visit');
content = content.replace(
  '${lang === "ar" ? `لا توجد زيارات مخططة للمندوب ${accompaniedRep ? accompaniedRep.name : ""} في تاريخ ${selectedDate}.` : `No planned visits scheduled by ${accompaniedRep ? accompaniedRep.name : "Rep"} on ${selectedDate}.`}',
  'No planned visits scheduled by ${accompaniedRep ? accompaniedRep.name : "Rep"} on ${selectedDate}.'
);

// Lines 2155-2169: vacant area
content = content.replace(
  '${area.name} <span class="badge badge-vacant">${lang === "ar" ? "شاغرة" : "Vacant Area"}</span>',
  '${area.name} <span class="badge badge-vacant">Vacant Area</span>'
);
content = content.replace(
  '${lang === "ar" ? "شاغر (Vacant)" : "Vacant"}',
  'Vacant'
);
content = content.replace(
  '<td class="dm-vacant-row">${lang === "ar" ? "المنطقة" : "District Territory"}</td>',
  '<td class="dm-vacant-row">District Territory</td>'
);
content = content.replace(
  '<td class="dm-vacant-text text-end">${lang === "ar" ? "شاغر (Vacant)" : "Vacant"}</td>',
  '<td class="dm-vacant-text text-end">Vacant</td>'
);

// Lines 2198-2367: LM dashboard
content = content.replace(
  'const lineNames = lmLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");',
  'const lineNames = lmLines.map((l) => l.name).join(", ");'
);
content = content.replace(
  '<h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مدير الخط" : "Line Manager"} ${userName}!</h2>',
  '<h2 class="welcome-title">${t.welcome_back}, Line Manager ${userName}!</h2>'
);
content = content.replace(
  '<div class="welcome-subtitle">${lineNames || (lang === "ar" ? "إدارة خط الإنتاج" : "Product Line Management")}</div>',
  '<div class="welcome-subtitle">${lineNames || "Product Line Management"}</div>'
);
content = content.replace(
  '<span class="line-filter-label">🏷️ ${lang === "ar" ? "تصفية بالخط:" : "Filter by Line:"}</span>',
  '<span class="line-filter-label">🏷️ Filter by Line:</span>'
);
content = content.replace(
  '${lang === "ar" ? `جميع الخطوط (${lmLines.length})` : `All Lines (${lmLines.length})`}',
  'All Lines (${lmLines.length})'
);
content = content.replace(
  '<span>${t.line_visits || (lang === "ar" ? "زيارات الخط (هذا الشهر)" : "Line Visits (This Month)")}</span>',
  '<span>${t.line_visits || "Line Visits (This Month)"}</span>'
);
content = content.replace(
  '${lang === "ar" ? "عرض سجل الزيارات ←" : "View Completed Visits →"}',
  'View Completed Visits →'
);
content = content.replace(
  '<span>${t.leave_requests || (lang === "ar" ? "طلبات إجازة للموافقة" : "Leave Requests to Approve")}</span>',
  '<span>${t.leave_requests || "Leave Requests to Approve"}</span>'
);
content = content.replace(
  '${lang === "ar" ? "مراجعة واعتماد الإجازات ←" : "Review & Approve Leaves →"}',
  'Review & Approve Leaves →'
);
content = content.replace(
  '👥 ${repsForThisDM.length} ${repsForThisDM.length === 1 ? (lang === "ar" ? "مندوب" : "Rep") : (lang === "ar" ? "مناديب" : "Reps")}',
  '👥 ${repsForThisDM.length} ${repsForThisDM.length === 1 ? "Rep" : "Reps"}'
);
content = content.replace(
  '<button type="button" class="btn-view-team" onclick="window.openDmTeamModal(\'${dm.id}\')" title="${lang === "ar" ? "عرض أعضاء الفريق" : "View Team Members"}">',
  '<button type="button" class="btn-view-team" onclick="window.openDmTeamModal(\'${dm.id}\')" title="View Team Members">'
);
content = content.replace(
  '<span>${lang === "ar" ? "عرض الفريق" : "View Team"}</span>',
  '<span>View Team</span>'
);
content = content.replace(
  ': `<span class="feed-no-notes">${lang === "ar" ? "لا يوجد مناديب مسندين" : "No reps assigned"}</span>`',
  ': `<span class="feed-no-notes">No reps assigned</span>`'
);
content = content.replace(
  '<span class="badge bg-success-subtle text-success">${lang === "ar" ? "نشط" : "Active"}</span>',
  '<span class="badge bg-success-subtle text-success">Active</span>'
);

// Lines 2698-2880: BU dashboard
content = content.replace(
  'const lineNames = buLines.map((l) => (lang === "ar" ? (l.nameAr || l.name) : l.name)).join(lang === "ar" ? "، " : ", ");',
  'const lineNames = buLines.map((l) => l.name).join(", ");'
);
content = content.replace(
  '<h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "رئيس وحدة الأعمال" : "Business Unit Head"} ${userName}!</h2>',
  '<h2 class="welcome-title">${t.welcome_back}, Business Unit Head ${userName}!</h2>'
);
content = content.replace(
  '<div class="welcome-subtitle">${lineNames || (lang === "ar" ? "إدارة وحدة الأعمال" : "Business Unit Management")}</div>',
  '<div class="welcome-subtitle">${lineNames || "Business Unit Management"}</div>'
);
content = content.replace(
  '<span class="line-filter-label">🏷️ ${lang === "ar" ? "تصفية بالخط:" : "Filter by Line:"}</span>',
  '<span class="line-filter-label">🏷️ Filter by Line:</span>'
);
content = content.replace(
  '${lang === "ar" ? `جميع الخطوط (${lines.length})` : `All Lines (${lines.length})`}',
  'All Lines (${lines.length})'
);
content = content.replace(
  '<div class="bu-line-subtext">${(line.products || []).length} ${lang === "ar" ? "منتجات نشطة" : "Products Active"}</div>',
  '<div class="bu-line-subtext">${(line.products || []).length} Products Active</div>'
);
content = content.replace(
  ': `<em class="text-muted">${lang === "ar" ? "غير معين" : "Unassigned"}</em>`',
  ': `<em class="text-muted">Unassigned</em>`'
);
content = content.replace(
  '<span class="badge bg-primary-subtle text-primary badge-dm-count">${dmsCount} ${dmsCount === 1 ? (lang === "ar" ? "مدير منطقة" : "DM") : (lang === "ar" ? "مديري مناطق" : "DMs")}</span>',
  '<span class="badge bg-primary-subtle text-primary badge-dm-count">${dmsCount} ${dmsCount === 1 ? "DM" : "DMs"}</span>'
);
content = content.replace(
  '<span class="badge bg-success-subtle text-success badge-rep-count">${repsCount} ${repsCount === 1 ? (lang === "ar" ? "مندوب" : "Rep") : (lang === "ar" ? "مناديب" : "Reps")}</span>',
  '<span class="badge bg-success-subtle text-success badge-rep-count">${repsCount} ${repsCount === 1 ? "Rep" : "Reps"}</span>'
);
content = content.replace(
  '<em class="text-muted">${lang === "ar" ? "خط غير محدد" : "Unassigned Line"}</em>',
  '<em class="text-muted">Unassigned Line</em>'
);

// Lines 3105-3184: Admin & HR dashboard
content = content.replace(
  '<h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مسؤول النظام" : "System Administrator"} ${userName}!</h2>',
  '<h2 class="welcome-title">${t.welcome_back}, System Administrator ${userName}!</h2>'
);
content = content.replace(
  '<div class="welcome-subtitle">${lang === "ar" ? "جميع خطوط الإنتاج والعمليات" : "All Product Lines & Operations"}</div>',
  '<div class="welcome-subtitle">All Product Lines & Operations</div>'
);
content = content.replace(
  '<h2 class="welcome-title">${t.welcome_back}, ${lang === "ar" ? "مدير الموارد البشرية" : "HR Manager"} ${userName}!</h2>',
  '<h2 class="welcome-title">${t.welcome_back}, HR Manager ${userName}!</h2>'
);
content = content.replace(
  '<div class="welcome-subtitle">${lang === "ar" ? "الموارد البشرية وشؤون الموظفين" : "Human Resources & People Operations"}</div>',
  '<div class="welcome-subtitle">Human Resources & People Operations</div>'
);

// Lines 3215-3230: Visit form labels
content = content.replace(
  '<label class="form-label fw-bold small" id="lblDashDate">${lang === "ar" ? "يوم الزيارة" : "Visit Day"}</label>',
  '<label class="form-label fw-bold small" id="lblDashDate">Visit Day</label>'
);
content = content.replace(
  '<label class="form-label fw-bold small" id="lblDashTime">${lang === "ar" ? "وقت الزيارة" : "Visit Time (HH:MM)"}</label>',
  '<label class="form-label fw-bold small" id="lblDashTime">Visit Time (HH:MM)</label>'
);
content = content.replace(
  '<strong>${lang === "ar" ? "تاريخ الإدخال:" : "Insertion Date:"}</strong>',
  '<strong>Insertion Date:</strong>'
);
content = content.replace(
  '<strong>${lang === "ar" ? "وقت الإدخال:" : "Insertion Time:"}</strong>',
  '<strong>Insertion Time:</strong>'
);

// Lines 3375-3378: lockedText
content = content.replace(
  `      lockedText.innerText =
        lang === "ar"
          ? \`نزول مرافق (Double Visit) مع المندوب: \${repName}\`
          : \`Double Visit with Rep: \${repName}\`;`,
  '      lockedText.innerText = `Double Visit with Rep: ${repName}`;'
);

// Lines 3459-3463: Auto on Complete & lblDate
content = content.replace(
  'if (dashInsDateEl) dashInsDateEl.innerText = `${todayISO} (${lang === "ar" ? "تلقائي الآن" : "Auto on Complete"})`;',
  'if (dashInsDateEl) dashInsDateEl.innerText = `${todayISO} (Auto on Complete)`;'
);
content = content.replace(
  'if (dashInsTimeEl) dashInsTimeEl.innerText = `${timeStr} (${lang === "ar" ? "تلقائي الآن" : "Auto on Complete"})`;',
  'if (dashInsTimeEl) dashInsTimeEl.innerText = `${timeStr} (Auto on Complete)`;'
);
content = content.replace(
  'if (lblDate) lblDate.innerText = t.visit_day || (lang === "ar" ? "يوم الزيارة" : "Visit Day");',
  'if (lblDate) lblDate.innerText = t.visit_day || "Visit Day";'
);

// Line 3559: submitBtn
content = content.replace(
  'submitBtn.innerText = lang === "ar" ? "جاري الحفظ... ⏳" : "Saving... ⏳";',
  'submitBtn.innerText = "Saving... ⏳";'
);

// Lines 3586-3601: future date & backlog toasts
content = content.replace(
  `    const msg = lang === "ar"
      ? "لا يمكن تسجيل زيارة فعلية في تاريخ مستقبلي."
      : "Cannot log an actual visit in a future date.";`,
  '    const msg = "Cannot log an actual visit in a future date.";'
);

content = content.replace(
  `    const msg = lang === "ar"
      ? (limitDays === 0
          ? "وفقاً لسياسة الشركة، يجب تسجيل الزيارات الفعلية في نفس اليوم فقط."
          : \`وفقاً لسياسة الشركة، لا يمكن تسجيل زيارة فعلية بعد مرور أكثر من \${limitDays} \${limitDays === 1 ? "يوم" : limitDays === 2 ? "يومين" : "أيام"} على تاريخها.\`)
      : (limitDays === 0
          ? "According to company policy, actual visits must be logged on the same day only."
          : \`According to company policy, an actual visit cannot be logged more than \${limitDays} day\${limitDays > 1 ? "s" : ""} after its date.\`);`,
  `    const msg = limitDays === 0
      ? "According to company policy, actual visits must be logged on the same day only."
      : \`According to company policy, an actual visit cannot be logged more than \${limitDays} day\${limitDays > 1 ? "s" : ""} after its date.\`;`
);

// Lines 3639-3642: double visit companion toast
content = content.replace(
  `        const msg = lang === "ar"
          ? "يرجى تحديد المرافق في الزيارة المزدوجة."
          : "Please select at least one companion for the double visit.";`,
  '        const msg = "Please select at least one companion for the double visit.";'
);

// Lines 3685-3691: timeConflict toast
content = content.replace(
  `      const msg = timeConflict.exactMatch
        ? (lang === "ar"
            ? \`⚠️ توجد زيارة مسجلة بالفعل في نفس هذا التوقيت تماماً (\${conflictingTime}) لـ (\${conflictingTarget}).\`
            : \`⚠️ Another visit is already recorded at the exact same time (\${conflictingTime}) for (\${conflictingTarget}).\`)
        : (lang === "ar"
            ? \`⚠️ الفارق الزمني بين الزيارات يجب ألا يقل عن \${timeConflict.minRequired} دقائق عند تفعيل تسجيل الزيارات بالموقع (GPS). توجد زيارة أخرى في (\${conflictingTime}) لـ (\${conflictingTarget}).\`
            : \`⚠️ Minimum time between visits must be at least \${timeConflict.minRequired} minutes when location tracking is active. Another visit exists at (\${conflictingTime}) for (\${conflictingTarget}).\`);`,
  `      const msg = timeConflict.exactMatch
        ? \`⚠️ Another visit is already recorded at the exact same time (\${conflictingTime}) for (\${conflictingTarget}).\`
        : \`⚠️ Minimum time between visits must be at least \${timeConflict.minRequired} minutes when location tracking is active. Another visit exists at (\${conflictingTime}) for (\${conflictingTarget}).\`;`
);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/dashboard.js', content, 'utf8');

const remainingArabic = [];
content.split('\n').forEach((l, idx) => {
  if (/[\u0600-\u06FF]/.test(l)) remainingArabic.push({ line: idx + 1, text: l.trim() });
});

console.log('dashboard.js cleaned. Remaining Arabic lines:', remainingArabic.length);
remainingArabic.forEach(r => console.log('L' + r.line + ': ' + r.text));
