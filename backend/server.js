const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { validateRuntime } = require('./governance/runtime');
validateRuntime();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const auth = require('./middleware/auth');
const { createProviderGate } = require('./governance/providerGate');
const pool = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const port = Number(process.env.BACKEND_PORT || 4000);
const origins = String(process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map((value) => value.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin(origin, callback) {
  if (!origin || origins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS.'));
}, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AIWorkforceSchedulingShiftPlanner', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governance', require('./governance/router'));

app.use('/api', auth);
const protectedRoutes = [
  ['/api/employees','./routes/employees'],['/api/shifts','./routes/shifts'],
  ['/api/locations','./routes/locations'],['/api/swap-requests','./routes/swapRequests'],
  ['/api/time-off','./routes/timeoff'],['/api/availability','./routes/availability'],
  ['/api/payroll','./routes/payroll'],['/api/compliance','./routes/compliance'],
  ['/api/overtime','./routes/overtime'],['/api/breaks','./routes/breaks'],
  ['/api/notifications','./routes/notifications'],['/api/departments','./routes/departments'],
  ['/api/shift-templates','./routes/shiftTemplates'],['/api/time-clock','./routes/timeClock'],
  ['/api/announcements','./routes/announcements'],['/api/audit-log','./routes/auditLog'],
  ['/api/reports','./routes/reports']
];
for (const [mount, modulePath] of protectedRoutes) app.use(mount, require(modulePath));

const providerGate = createProviderGate(['/api/ai','/api/forecasts','/api/recommendations','/api/extensions','/api/custom','/api/gap']);
app.use(providerGate);
if (process.env.ENABLE_LEGACY_PROVIDER_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  app.use('/api/ai', require('./routes/ai'));
  app.use('/api/forecasts', require('./routes/forecasts'));
  app.use('/api/recommendations', require('./routes/recommendations'));
  app.use('/api/extensions', require('./routes/extensions'));
  app.use('/api/custom', require('./routes/customFeatures'));
  app.use('/api/gap-ai-aiworkforceschedulingshiftplanner', require('./routes/batch09GapAi'));
  app.use('/api/gap-nonai-aiworkforceschedulingshiftplanner', require('./routes/batch09GapNonai'));
}

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' }));

async function ensureConfiguredUser() {
  const email = process.env.ADMIN_EMAIL || process.env.DEMO_EMAIL;
  const password = process.env.ADMIN_PASSWORD || process.env.DEMO_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 12) throw new Error('Explicit administrator email and password of at least 12 characters are required');
  const hash = await bcrypt.hash(password, 10);
  await pool.query(`INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,'admin') ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role=EXCLUDED.role`, [email, hash, 'Runtime Administrator']);
}

async function start() {
  await ensureConfiguredUser();
  return app.listen(port, () => console.log(`Workforce Scheduling API listening on ${port}`));
}
if (require.main === module) start().catch((error) => { console.error('Startup failed:', error.message); process.exitCode = 1; });
module.exports = { app, start };
