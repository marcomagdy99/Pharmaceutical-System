const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { query, writeAuditLog } = require('../config/db');
const { normalizeRole, sanitizeUser, requireAuth } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email and password are required.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
      [email]
    );
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      await writeAuditLog({
        actorEmail: email,
        action: 'LOGIN_FAILED',
        targetType: 'auth',
        ipAddress: req.ip
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await writeAuditLog({
        actorId: user.id,
        actorEmail: email,
        action: 'LOGIN_FAILED_PASSWORD',
        targetType: 'auth',
        ipAddress: req.ip
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const status = String(user.status || 'Active').toLowerCase();
    if (status === 'inactive' || status === 'suspended' || status === 'disabled') {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact HR or Admin.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server JWT_SECRET not configured.' });
    }

    const canonicalRole = normalizeRole(user.role);
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: canonicalRole },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: canonicalRole,
      action: 'LOGIN_SUCCESS',
      targetType: 'auth',
      ipAddress: req.ip
    });

    const safeUser = sanitizeUser(user);
    safeUser.role = canonicalRole;
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Authentication service error.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.put('/password', requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters and include letters and numbers.'
      });
    }

    const result = await query(
      `SELECT id, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [req.user.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User not found.' });

    const matchesCurrent = await bcrypt.compare(currentPassword, row.password_hash);
    if (!matchesCurrent) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const sameAsOld = await bcrypt.compare(newPassword, row.password_hash);
    if (sameAsOld) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query(
      `UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2`,
      [newHash, req.user.id]
    );

    await writeAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'PASSWORD_CHANGED',
      targetType: 'user',
      targetId: req.user.id,
      ipAddress: req.ip
    });

    return res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[Auth] Password update error:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

router.post('/confirm-reset', async (req, res) => {
  try {
    const rawToken = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!rawToken || newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Valid token and strong password (8+ chars, letters & numbers) are required.' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokRes = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    const tokRow = tokRes.rows[0];
    if (!tokRow) {
      return res.status(400).json({ error: 'Reset token is invalid or expired.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query(`UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2`, [newHash, tokRow.user_id]);
    await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [tokRow.id]);

    await writeAuditLog({
      actorId: tokRow.user_id,
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'user',
      targetId: tokRow.user_id,
      ipAddress: req.ip
    });

    return res.json({ ok: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('[Auth] Confirm reset error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
