const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, writeAuditLog } = require('../config/db');
const { requireAuth, requireRoles, normalizeRole, getSubordinateIds } = require('../middleware/auth');

const router = express.Router();

const SAFE_USER_COLUMNS = `
  id, name, name_ar, email, employee_code, role, title, manager_id,
  line_id, line_ids, area_id, area_ids, product_ids, phone, hire_date,
  daily_target, leave_balance, status, must_change_password, created_at, updated_at
`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'admin' || role === 'hr') {
      const result = await query(`SELECT ${SAFE_USER_COLUMNS} FROM users WHERE deleted_at IS NULL ORDER BY name ASC`);
      return res.json({ data: result.rows });
    }
    if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager' || role === 'district_manager') {
      const subIds = await getSubordinateIds(req.user.id);
      const allowed = [req.user.id, ...subIds];
      const result = await query(
        `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE deleted_at IS NULL AND id = ANY($1::text[]) ORDER BY name ASC`,
        [allowed]
      );
      return res.json({ data: result.rows });
    }
    const selfRes = await query(`SELECT ${SAFE_USER_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`, [req.user.id]);
    return res.json({ data: selfRes.rows });
  } catch (err) {
    console.error('[Users] GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/', requireAuth, requireRoles(['admin', 'hr']), async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const employeeCode = String(req.body?.employeeCode || req.body?.code || '').trim().toUpperCase();
    const role = normalizeRole(req.body?.role || 'medical_rep');
    const password = String(req.body?.password || crypto.randomBytes(12).toString('base64url'));

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }
    if (req.user.role === 'hr' && role === 'admin') {
      return res.status(403).json({ error: 'Only Administrators can create Admin accounts.' });
    }

    const id = req.body?.id || `u_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = await bcrypt.hash(password, 12);

    const inserted = await query(
      `INSERT INTO users (
         id, name, name_ar, email, employee_code, password_hash, role, title,
         manager_id, line_id, line_ids, area_id, area_ids, product_ids,
         phone, hire_date, daily_target, status, must_change_password
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14,
         $15, $16, $17, 'Active', TRUE
       )
       RETURNING ${SAFE_USER_COLUMNS}`,
      [
        id, name, req.body?.nameAr || name, email, employeeCode || null, passwordHash, role, req.body?.title || role,
        req.body?.managerId || null, req.body?.lineId || null, JSON.stringify(req.body?.lineIds || []),
        req.body?.areaId || null, JSON.stringify(req.body?.areaIds || []), JSON.stringify(req.body?.productIds || []),
        req.body?.phone || null, req.body?.hireDate || null, Number(req.body?.dailyTarget || 8)
      ]
    );

    await writeAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: id,
      metadata: { role, email },
      ipAddress: req.ip
    });

    return res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or employee code already exists.' });
    }
    console.error('[Users] POST error:', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.post('/:id/reset-password', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const targetId = req.params.id;
    const uRes = await query(`SELECT id, email, name FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [targetId]);
    const targetUser = uRes.rows[0];
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, created_by, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')`,
      [targetId, tokenHash, req.user.id]
    );
    await query(`UPDATE users SET must_change_password = TRUE, updated_at = NOW() WHERE id = $1`, [targetId]);

    // Optional email delivery via Resend
    let emailDispatched = false;
    if (process.env.RESEND_API_KEY && targetUser.email) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'PharmaCare <noreply@pharmacare.app>',
          to: [targetUser.email],
          subject: 'PharmaCare Password Reset',
          text: `Hello ${targetUser.name},\n\nUse this one-time reset token within 30 minutes to set a new password:\n${rawToken}`
        })
      });
      emailDispatched = r.ok;
    }

    await writeAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'ADMIN_PASSWORD_RESET_ISSUED',
      targetType: 'user',
      targetId: targetId,
      metadata: { emailDispatched },
      ipAddress: req.ip
    });

    return res.json({
      ok: true,
      emailDispatched,
      message: emailDispatched
        ? `Password reset email sent to ${targetUser.email}.`
        : 'One-time reset token generated (configure RESEND_API_KEY for email delivery).'
    });
  } catch (err) {
    console.error('[Users] Reset password error:', err);
    return res.status(500).json({ error: 'Failed to issue password reset.' });
  }
});

module.exports = router;
