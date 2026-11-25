const express = require('express');
const crypto = require('crypto');
const { query, writeAuditLog } = require('../config/db');
const { requireAuth, getSubordinateIds } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'admin' || role === 'hr') {
      const r = await query(`SELECT * FROM leaves ORDER BY start_date DESC, created_at DESC LIMIT 500`);
      return res.json({ data: r.rows });
    }
    if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager' || role === 'district_manager') {
      const subIds = await getSubordinateIds(req.user.id);
      const allowed = [req.user.id, ...subIds];
      const r = await query(
        `SELECT * FROM leaves WHERE user_id = ANY($1::text[]) ORDER BY start_date DESC, created_at DESC LIMIT 500`,
        [allowed]
      );
      return res.json({ data: r.rows });
    }
    const r = await query(
      `SELECT * FROM leaves WHERE user_id = $1 ORDER BY start_date DESC, created_at DESC LIMIT 200`,
      [req.user.id]
    );
    return res.json({ data: r.rows });
  } catch (err) {
    console.error('[Leaves] GET error:', err);
    return res.status(500).json({ error: 'Failed to load leaves.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const type = String(body.type || '').trim().toLowerCase();
    const startDate = String(body.startDate || '').trim();
    const endDate = String(body.endDate || '').trim();
    const days = Number(body.days || 0);
    const dayDuration = body.dayDuration === 'half' ? 'half' : 'full';
    const reason = String(body.reason || '').trim().slice(0, 1000);
    const attachmentUrl = body.attachmentUrl ? String(body.attachmentUrl).trim() : null;

    if (!type || !startDate || !endDate || !Number.isFinite(days) || days <= 0) {
      return res.status(400).json({ error: 'Valid leave type, dates, and days (> 0) are required.' });
    }
    if (attachmentUrl && !/^https?:\/\//i.test(attachmentUrl)) {
      return res.status(400).json({ error: 'Attachment must be a valid HTTP/HTTPS storage URL.' });
    }

    const role = req.user.role;
    let approvals = {};
    if (role === 'medical_rep') {
      approvals = { dm: { status: 'pending' }, lm: { status: 'pending' }, hr: { status: 'pending' } };
    } else if (role === 'district_manager') {
      approvals = { lm: { status: 'pending' }, hr: { status: 'pending' } };
    } else if (role === 'line_manager') {
      approvals = { hr: { status: 'pending' } };
    } else if (role === 'business_unit' || role === 'product_manager') {
      approvals = { admin: { status: 'pending' }, hr: { status: 'pending' } };
    } else if (role === 'hr' || role === 'general_manager') {
      approvals = { admin: { status: 'pending' } };
    } else if (role === 'admin') {
      approvals = { hr: { status: 'pending' } };
    } else {
      approvals = { hr: { status: 'pending' } };
    }

    const id = `l_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const inserted = await query(
      `INSERT INTO leaves (id, user_id, type, day_duration, days, start_date, end_date, reason, attachment_url, status, approvals)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, 'pending', $10)
       RETURNING *`,
      [id, req.user.id, type, dayDuration, days, startDate, endDate, reason, attachmentUrl, JSON.stringify(approvals)]
    );

    return res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    console.error('[Leaves] POST error:', err);
    return res.status(500).json({ error: 'Failed to submit leave request.' });
  }
});

router.put('/:id/decision', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'general_manager') {
      return res.status(403).json({ error: 'Access Denied: General Manager is view-only and cannot approve or reject leaves.' });
    }
    if (!['admin', 'hr', 'business_unit', 'line_manager', 'district_manager'].includes(role)) {
      return res.status(403).json({ error: 'Access Denied: Approvers only.' });
    }

    const decision = String(req.body?.decision || '').toLowerCase();
    const rejectionReason = String(req.body?.rejectionReason || '').trim().slice(0, 500);
    if (decision !== 'approved' && decision !== 'rejected') {
      return res.status(400).json({ error: 'Decision must be "approved" or "rejected".' });
    }

    const lRes = await query(`SELECT * FROM leaves WHERE id = $1 LIMIT 1`, [req.params.id]);
    const leave = lRes.rows[0];
    if (!leave) return res.status(404).json({ error: 'Leave request not found.' });

    if (leave.user_id === req.user.id) {
      return res.status(403).json({ error: 'Self-approval is strictly forbidden.' });
    }
    if (leave.status === 'approved' || leave.status === 'rejected') {
      return res.status(400).json({ error: `Leave request is already ${leave.status}.` });
    }

    if (role !== 'admin' && role !== 'hr') {
      const subIds = await getSubordinateIds(req.user.id);
      if (!subIds.includes(leave.user_id)) {
        return res.status(403).json({ error: 'Access Denied: Applicant is outside your reporting hierarchy.' });
      }
    }

    const app = { ...(leave.approvals || {}) };
    const isDone = (k) => !app[k] || app[k].status === 'approved' || app[k].status === 'skipped';
    const nowIso = new Date().toISOString();

    if (decision === 'rejected') {
      const stageKey = role === 'district_manager' ? 'dm' : role === 'line_manager' ? 'lm' : role === 'business_unit' ? 'bu' : role;
      if (app[stageKey]) {
        app[stageKey] = { ...app[stageKey], status: 'rejected', approverId: req.user.id, updatedAt: nowIso };
      }
      const upd = await query(
        `UPDATE leaves SET status = 'rejected', approvals = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [JSON.stringify(app), rejectionReason || null, leave.id]
      );
      await writeAuditLog({
        actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
        action: 'LEAVE_REJECTED', targetType: 'leave', targetId: leave.id, ipAddress: req.ip
      });
      return res.json({ data: upd.rows[0] });
    }

    // Sequential approval checks
    let stageToApprove = null;
    if (role === 'district_manager' && app.dm?.status === 'pending') stageToApprove = 'dm';
    else if (role === 'line_manager' && app.lm?.status === 'pending' && isDone('dm')) stageToApprove = 'lm';
    else if (role === 'business_unit' && app.bu?.status === 'pending' && isDone('dm') && isDone('lm')) stageToApprove = 'bu';
    else if (role === 'hr' && app.hr?.status === 'pending' && isDone('dm') && isDone('lm') && isDone('bu') && isDone('admin')) stageToApprove = 'hr';
    else if (role === 'admin') {
      if (app.admin?.status === 'pending') stageToApprove = 'admin';
      else if (app.hr?.status === 'pending' && isDone('dm') && isDone('lm') && isDone('bu') && isDone('admin')) stageToApprove = 'hr';
    }

    if (!stageToApprove) {
      return res.status(400).json({ error: 'Invalid state transition: previous approval step pending or stage not applicable.' });
    }

    app[stageToApprove] = { ...app[stageToApprove], status: 'approved', approverId: req.user.id, approverName: req.user.name, updatedAt: nowIso };
    const allDone = ['dm', 'lm', 'bu', 'admin', 'hr'].every((k) => isDone(k));
    const nextStatus = allDone ? 'approved' : 'pending';

    const upd = await query(
      `UPDATE leaves SET status = $1, approvals = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [nextStatus, JSON.stringify(app), leave.id]
    );
    await writeAuditLog({
      actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
      action: 'LEAVE_APPROVED', targetType: 'leave', targetId: leave.id,
      metadata: { stage: stageToApprove, nextStatus }, ipAddress: req.ip
    });

    return res.json({ data: upd.rows[0] });
  } catch (err) {
    console.error('[Leaves] Decision error:', err);
    return res.status(500).json({ error: 'Failed to process leave decision.' });
  }
});

module.exports = router;
