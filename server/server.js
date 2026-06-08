/**
 * DZ Infotech Internal CRM — Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./src/config/db'); // Initialize DB connection
const settingsCache = require('./src/helpers/settingsCache');

// ── Route imports ─────────────────────────────────────────────
const authRoutes = require('./src/routes/auth.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const clientsRoutes = require('./src/routes/clients.routes');
const projectsRoutes = require('./src/routes/projects.routes');
const subscriptionsRoutes = require('./src/routes/subscriptions.routes');
const paymentsRoutes = require('./src/routes/payments.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const duesRoutes = require('./src/routes/dues.routes');
const financeRoutes = require('./src/routes/finance.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173'] : '*',
  credentials: true
}));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Mount routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/finance', financeRoutes);

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
async function start() {
  try {
    // Warm the settings cache on boot
    await settingsCache.load();
    console.log('⚙️  Settings cache loaded');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
