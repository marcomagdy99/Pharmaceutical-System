const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('[DB] DATABASE_URL is not set. PostgreSQL queries will fail until configured.');
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function query(text, params) {
  return pool.query(text, params);
}

async function writeAuditLog({ actorId, actorEmail, actorRole, action, targetType, targetId, metadata, ipAddress }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actorId || null,
        actorEmail || null,
        actorRole || null,
        action,
        targetType || null,
        targetId || null,
        JSON.stringify(metadata || {}),
        ipAddress || null
      ]
    );
  } catch (err) {
    console.warn('[AuditLog] Failed to record audit entry:', err.message);
  }
}

module.exports = { pool, query, writeAuditLog };
