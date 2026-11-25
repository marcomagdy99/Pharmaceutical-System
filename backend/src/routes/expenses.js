const express = require('express');
const crypto = require('crypto');
const { query, writeAuditLog } = require('../config/db');
const { requireAuth, requireRoles, getSubordinateIds } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXPENSE_TRANSITIONS = {
  pending_dm: ['pending_lm', 'pending_bu', 'pending_hr', 'approved', 'rejected'],
  pending_lm: ['pending_bu', 'pending_hr', 'approved', 'rejected'],
  pending_bu: ['pending_hr', 'approved', 'rejected'],
  pending_hr: ['approved', 'rejected'],
  approved: ['disbursed', 'rejected'],
  disbursed: [],
  rejected: [],
  cancelled: []
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'admin' || role === 'hr') {
      const r = await query(`SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC LIMIT 500`);
      return res.json({ data: r.rows });
    }
    if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager' || role === 'district_manager') {
      const subIds = await getSubordinateIds(req.user.id);
      const allowed = [req.user.id, ...subIds];
      const r = await query(
        `SELECT * FROM expenses WHERE requester_id = ANY($1::text[]) ORDER BY expense_date DESC, created_at DESC LIMIT 500`,
        [allowed]
      );
      return res.json({ data: r.rows });
    }
    if (role === 'product_manager') {
      const pmLines = Array.isArray(req.user.line_ids) ? req.user.line_ids : (req.user.line_id ? [req.user.line_id] : []);
      if (pmLines.length === 0) return res.json({ data: [] });
      const r = await query(
        `SELECT * FROM expenses WHERE requester_id = $1 OR line_id = ANY($2::text[]) ORDER BY expense_date DESC LIMIT 500`,
        [req.user.id, pmLines]
      );
      return res.json({ data: r.rows });
    }
    const r = await query(`SELECT * FROM expenses WHERE requester_id = $1 ORDER BY expense_date DESC LIMIT 200`, [req.user.id]);
    return res.json({ data: r.rows });
  } catch (err) {
    console.error('[Expenses] GET error:', err);
    return res.status(500).json({ error: 'Failed to load expenses.' });
  }
});

router.post(
  '/',
  requireAuth,
  requireRoles(['admin', 'business_unit', 'line_manager', 'district_manager', 'medical_rep', 'product_manager', 'hr']),
  async (req, res) => {
    try {
      const body = req.body || {};
      const category = String(body.category || '').trim();
      const amount = Number(body.amount || 0);
      const expenseDate = String(body.date || '').trim();
      const receiptUrl = body.receiptUrl ? String(body.receiptUrl).trim() : null;
      const notes = String(body.notes || '').trim().slice(0, 1000);

      if (!category || !Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
        return res.status(400).json({ error: 'Valid category and amount (1..1,000,000) are required.' });
      }
      if (receiptUrl && !/^https?:\/\//i.test(receiptUrl)) {
        return res.status(400).json({ error: 'receiptUrl must be a valid HTTP/HTTPS storage URL.' });
      }

      const role = req.user.role;
      let initialStatus = 'pending_dm';
      if (role === 'district_manager') initialStatus = 'pending_lm';
      else if (role === 'line_manager') initialStatus = 'pending_bu';
      else if (role === 'business_unit' || role === 'product_manager') initialStatus = 'pending_hr';
      else if (role === 'hr') initialStatus = 'pending_bu';
      else if (role === 'admin') initialStatus = 'pending_hr';

      const id = `exp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const inserted = await query(
        `INSERT INTO expenses (id, requester_id, line_id, area_id, category, amount, expense_date, status, receipt_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE), $8, $9, $10)
         RETURNING *`,
        [id, req.user.id, body.lineId || req.user.line_id || null, body.areaId || req.user.area_id || null, category, amount, expenseDate || null, initialStatus, receiptUrl, notes]
      );

      return res.status(201).json({ data: inserted.rows[0] });
    } catch (err) {
      console.error('[Expenses] POST error:', err);
      return res.status(500).json({ error: 'Failed to submit expense claim.' });
    }
  }
);

router.put('/:id/decision', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'general_manager') {
      return res.status(403).json({ error: 'Access Denied: General Manager is view-only and cannot act on expenses.' });
    }

    const action = String(req.body?.action || '').toLowerCase();
    const rejectionReason = String(req.body?.rejectionReason || '').trim().slice(0, 500);
    if (!['approve', 'reject', 'disburse'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve", "reject", or "disburse".' });
    }

    const eRes = await query(`SELECT * FROM expenses WHERE id = $1 LIMIT 1`, [req.params.id]);
    const exp = eRes.rows[0];
    if (!exp) return res.status(404).json({ error: 'Expense claim not found.' });

    // Strict Zero Self-Approval & Self-Disbursement even for Admin/HR
    if (exp.requester_id === req.user.id) {
      return res.status(403).json({ error: 'Self-approval or self-disbursement is strictly forbidden.' });
    }

    if (action === 'disburse') {
      if (role !== 'hr' && role !== 'admin') {
        return res.status(403).json({ error: 'Only HR or Admin can disburse approved expenses.' });
      }
      if (exp.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid state transition: only approved expenses can be disbursed.' });
      }
      const upd = await query(`UPDATE expenses SET status = 'disbursed', updated_at = NOW() WHERE id = $1 RETURNING *`, [exp.id]);
      await writeAuditLog({
        actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
        action: 'EXPENSE_DISBURSED', targetType: 'expense', targetId: exp.id, ipAddress: req.ip
      });
      return res.json({ data: upd.rows[0] });
    }

    if (action === 'reject') {
      if (['disbursed', 'rejected', 'cancelled'].includes(exp.status)) {
        return res.status(400).json({ error: `Invalid state transition: cannot reject ${exp.status} expense.` });
      }
      if (role !== 'admin' && role !== 'hr') {
        const subIds = await getSubordinateIds(req.user.id);
        if (!subIds.includes(exp.requester_id)) {
          return res.status(403).json({ error: 'Access Denied: Expense requester is outside your hierarchy.' });
        }
      }
      const upd = await query(
        `UPDATE expenses SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [rejectionReason || null, exp.id]
      );
      await writeAuditLog({
        actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
        action: 'EXPENSE_REJECTED', targetType: 'expense', targetId: exp.id, ipAddress: req.ip
      });
      return res.json({ data: upd.rows[0] });
    }

    // Approve action
    if (!String(exp.status).startsWith('pending_')) {
      return res.status(400).json({ error: `Invalid state transition: cannot approve expense in status ${exp.status}.` });
    }

    if (role !== 'admin' && role !== 'hr') {
      const subIds = await getSubordinateIds(req.user.id);
      if (!subIds.includes(exp.requester_id)) {
        return res.status(403).json({ error: 'Access Denied: Expense requester is outside your hierarchy.' });
      }
    }

    let nextStatus = null;
    if (role === 'district_manager' && exp.status === 'pending_dm') nextStatus = 'pending_lm';
    else if (role === 'line_manager' && exp.status === 'pending_lm') nextStatus = Number(exp.amount) >= 10000 ? 'pending_bu' : 'pending_hr';
    else if (role === 'business_unit' && exp.status === 'pending_bu') nextStatus = 'pending_hr';
    else if ((role === 'hr' && exp.status === 'pending_hr') || role === 'admin') nextStatus = 'approved';

    if (!nextStatus || !(ALLOWED_EXPENSE_TRANSITIONS[exp.status] || []).includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid state transition or insufficient tier for current status.' });
    }

    const upd = await query(`UPDATE expenses SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [nextStatus, exp.id]);
    await writeAuditLog({
      actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
      action: 'EXPENSE_APPROVED', targetType: 'expense', targetId: exp.id,
      metadata: { from: exp.status, to: nextStatus }, ipAddress: req.ip
    });
    return res.json({ data: upd.rows[0] });
  } catch (err) {
    console.error('[Expenses] Decision error:', err);
    return res.status(500).json({ error: 'Failed to process expense decision.' });
  }
});

module.exports = router;
