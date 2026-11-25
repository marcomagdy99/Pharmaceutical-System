const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || '';

function normalizeRole(role) {
  const r = String(role || '').toLowerCase().trim();
  if (r === 'dm' || r === 'district manager') return 'district_manager';
  if (r === 'lm' || r === 'line manager') return 'line_manager';
  if (r === 'bu' || r === 'business unit') return 'business_unit';
  if (r === 'gm' || r === 'general manager') return 'general_manager';
  if (r === 'pm' || r === 'product manager') return 'product_manager';
  if (r === 'rep' || r === 'medical rep') return 'medical_rep';
  if (r === 'administrator') return 'admin';
  return r;
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

async function requireAuth(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server JWT_SECRET is not configured.' });
  }
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      `SELECT id, name, name_ar, email, employee_code, role, title, manager_id,
              line_id, line_ids, area_id, area_ids, product_ids, phone, hire_date,
              daily_target, leave_balance, status, must_change_password
       FROM users
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [decoded.sub]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    const status = String(user.status || 'Active').toLowerCase();
    if (status === 'inactive' || status === 'suspended' || status === 'disabled') {
      return res.status(403).json({ error: 'Account is deactivated. Please contact HR or Admin.' });
    }
    user.role = normalizeRole(user.role);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

/**
 * Fail-Closed Role Guard.
 * Explicitly blocks general_manager from any write/approval action unless explicitly allowed.
 */
function requireRoles(allowedRoles = [], options = { blockGmWrites: true }) {
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const role = normalizeRole(req.user.role);
    if (options.blockGmWrites && role === 'general_manager' && req.method !== 'GET') {
      return res.status(403).json({
        error: 'Access Denied: General Manager has view-only oversight and cannot perform write or approval actions.'
      });
    }
    if (!normalizedAllowed.includes(role)) {
      return res.status(403).json({ error: 'Access Denied: Insufficient role permissions.' });
    }
    next();
  };
}

/**
 * Recursive PostgreSQL CTE to return all subordinate user IDs under a manager.
 */
async function getSubordinateIds(managerId) {
  const res = await query(
    `WITH RECURSIVE tree AS (
       SELECT id FROM users WHERE manager_id = $1 AND deleted_at IS NULL
       UNION ALL
       SELECT u.id FROM users u
       INNER JOIN tree t ON u.manager_id = t.id
       WHERE u.deleted_at IS NULL
     )
     SELECT id FROM tree`,
    [managerId]
  );
  return res.rows.map((r) => r.id);
}

module.exports = {
  normalizeRole,
  sanitizeUser,
  requireAuth,
  requireRoles,
  getSubordinateIds
};
