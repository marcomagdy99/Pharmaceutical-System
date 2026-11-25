require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { query } = require('../src/config/db');

const authRoutes = require('../src/routes/auth');
const usersRoutes = require('../src/routes/users');
const visitsRoutes = require('../src/routes/visits');
const uploadsRoutes = require('../src/routes/uploads');
const leavesRoutes = require('../src/routes/leaves');
const expensesRoutes = require('../src/routes/expenses');
const servicesRoutes = require('../src/routes/services');
const reportsRoutes = require('../src/routes/reports');

const app = express();

// Trust Vercel/Reverse-Proxy X-Forwarded-For for accurate rate limiting
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin denied'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const dbRes = await query('SELECT NOW() AS server_time');
    return res.json({
      ok: true,
      service: 'pharmacare-backend',
      serverTime: dbRes.rows[0]?.server_time || new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Database connection check failed.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/reports', reportsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Local development server (when run directly with `node api/index.js`)
if (require.main === module) {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`[PharmaCare Backend] Running on http://localhost:${port}`);
  });
}

module.exports = app;
