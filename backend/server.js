const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const shiftRoutes = require('./routes/shifts');
const locationRoutes = require('./routes/locations');
const swapRequestRoutes = require('./routes/swapRequests');
const timeoffRoutes = require('./routes/timeoff');
const availabilityRoutes = require('./routes/availability');
const payrollRoutes = require('./routes/payroll');
const complianceRoutes = require('./routes/compliance');
const overtimeRoutes = require('./routes/overtime');
const breakRoutes = require('./routes/breaks');
const notificationRoutes = require('./routes/notifications');
const forecastRoutes = require('./routes/forecasts');
const recommendationRoutes = require('./routes/recommendations');
const reportRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const departmentRoutes = require('./routes/departments');
const shiftTemplateRoutes = require('./routes/shiftTemplates');
const timeClockRoutes = require('./routes/timeClock');
const announcementRoutes = require('./routes/announcements');
const auditLogRoutes = require('./routes/auditLog');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/swap-requests', swapRequestRoutes);
app.use('/api/time-off', timeoffRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/shift-templates', shiftTemplateRoutes);
app.use('/api/time-clock', timeClockRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/audit-log', auditLogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
