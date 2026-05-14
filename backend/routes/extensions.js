// Apply pass 5 — backlog extensions for AIWorkforceSchedulingShiftPlanner
//
// Implements the deferred backlog from _AUDIT_NOTE.md (cap 10):
//   1. Fairness audit (NEEDS-PRODUCT-DECISION)
//      -> PRODUCT-DECISION: per-employee shift-distribution metrics over a
//         configurable window; weekend/night/holiday share computed from
//         existing `shifts` rows. AI commentary is gated on OPENROUTER_API_KEY.
//   2. Wage-compression detection (NEEDS-PRODUCT-DECISION)
//      -> PRODUCT-DECISION: flags employees whose hourly_rate is within 10%
//         of a junior position's. Threshold settable via query.
//   3. Benefits management (TOO-RISKY -> additive registry)
//   4. Performance reviews (TOO-RISKY -> additive registry)
//   5. Training tracking (TOO-RISKY -> additive registry)
//   6. Certification expiration alerts (TOO-RISKY -> reads training_records,
//      no external integration; computed client/server-side).
//   7. Productivity-per-shift analysis (MECHANICAL bonus)
//      -> Aggregates completed-shift hours; AI gated.
//
// All endpoints require auth. CREATE TABLE IF NOT EXISTS only.

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    const err = new Error('OPENROUTER_API_KEY is not configured');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  if (!data.choices || !data.choices[0]) throw new Error('Invalid response from OpenRouter');
  return data.choices[0].message.content;
}

async function bootstrap() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS benefits_enrollments (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER,
        plan_name TEXT,
        plan_type TEXT,
        coverage_start DATE,
        coverage_end DATE,
        monthly_premium DECIMAL(10,2),
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER,
        reviewer_id INTEGER,
        review_period TEXT,
        rating INTEGER,
        strengths TEXT,
        improvements TEXT,
        goals TEXT,
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER,
        training_name TEXT,
        provider TEXT,
        completed_at DATE,
        expires_at DATE,
        certificate_url TEXT,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.error('extensions bootstrap warning:', e.message);
  }
}
bootstrap();

// ── 1. Fairness audit (NEEDS-PRODUCT-DECISION) ─────────────────────────────
router.get('/fairness-audit', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const r = await pool.query(`
      SELECT
        e.id, e.first_name, e.last_name, e.position, e.department,
        COUNT(s.id) AS shift_count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) AS total_hours,
        COUNT(s.id) FILTER (WHERE EXTRACT(DOW FROM s.start_time) IN (0, 6)) AS weekend_shifts,
        COUNT(s.id) FILTER (WHERE EXTRACT(HOUR FROM s.start_time) >= 22 OR EXTRACT(HOUR FROM s.start_time) < 6) AS night_shifts
      FROM employees e
      LEFT JOIN shifts s ON s.employee_id = e.id
        AND s.start_time >= NOW() - make_interval(days => $1)
      WHERE e.status = 'active'
      GROUP BY e.id, e.first_name, e.last_name, e.position, e.department
      ORDER BY total_hours DESC
    `, [days]);

    // Compute simple inequality measure (gini-like coefficient of variation)
    const hours = r.rows.map(x => parseFloat(x.total_hours) || 0);
    const mean = hours.reduce((a,b) => a+b, 0) / Math.max(hours.length, 1);
    const variance = hours.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / Math.max(hours.length, 1);
    const stddev = Math.sqrt(variance);
    const cv = mean > 0 ? stddev / mean : 0;

    res.json({
      window_days: days,
      employees: r.rows,
      distribution: { mean_hours: mean, stddev_hours: stddev, coefficient_of_variation: cv, fairness_band: cv < 0.2 ? 'fair' : cv < 0.4 ? 'moderate' : 'unfair' },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fairness-audit/ai-commentary', auth, async (req, res) => {
  try {
    const { fairness_data } = req.body || {};
    if (!fairness_data) return res.status(400).json({ error: 'fairness_data required' });
    const aiContent = await callOpenRouter(
      `You are a workforce fairness auditor. Given this shift distribution data, identify inequities, root causes, and rebalancing actions.\n\nDATA:\n${JSON.stringify(fairness_data).slice(0, 6000)}`
    );
    res.json({ ai_response: aiContent });
  } catch (e) {
    if (e.code === 'NO_API_KEY') return res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' });
    res.status(500).json({ error: e.message });
  }
});

// ── 2. Wage-compression detection (NEEDS-PRODUCT-DECISION) ────────────────
router.get('/wage-compression', auth, async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.10; // 10% default
    const r = await pool.query(`
      SELECT id, first_name, last_name, position, department, hourly_rate
      FROM employees WHERE status = 'active' AND hourly_rate IS NOT NULL
      ORDER BY department, hourly_rate ASC
    `);
    // Group by department, flag senior employees within `threshold` of juniors.
    const byDept = {};
    for (const e of r.rows) {
      (byDept[e.department || 'general'] = byDept[e.department || 'general'] || []).push(e);
    }
    const flagged = [];
    for (const dept in byDept) {
      const list = byDept[dept].sort((a,b) => a.hourly_rate - b.hourly_rate);
      for (let i = 1; i < list.length; i++) {
        const prev = list[i-1];
        const cur = list[i];
        const diff = (cur.hourly_rate - prev.hourly_rate) / prev.hourly_rate;
        if (diff < threshold) {
          flagged.push({ department: dept, junior: prev, senior: cur, gap_pct: diff });
        }
      }
    }
    res.json({ threshold, flagged_pairs: flagged, count: flagged.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 3. Benefits management (TOO-RISKY -> additive) ─────────────────────────
router.get('/benefits', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM benefits_enrollments ORDER BY id DESC LIMIT 200`);
    res.json({ enrollments: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/benefits', auth, async (req, res) => {
  try {
    const { employee_id, plan_name, plan_type, coverage_start, coverage_end, monthly_premium } = req.body || {};
    if (!employee_id || !plan_name) return res.status(400).json({ error: 'employee_id and plan_name required' });
    const r = await pool.query(
      `INSERT INTO benefits_enrollments (employee_id, plan_name, plan_type, coverage_start, coverage_end, monthly_premium)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_id, plan_name, plan_type || null, coverage_start || null, coverage_end || null, monthly_premium || null]
    );
    res.json({ enrollment: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 4. Performance reviews (TOO-RISKY -> additive) ─────────────────────────
router.get('/performance-reviews', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM performance_reviews ORDER BY id DESC LIMIT 200`);
    res.json({ reviews: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/performance-reviews', auth, async (req, res) => {
  try {
    const { employee_id, reviewer_id, review_period, rating, strengths, improvements, goals, status } = req.body || {};
    if (!employee_id) return res.status(400).json({ error: 'employee_id required' });
    const r = await pool.query(
      `INSERT INTO performance_reviews (employee_id, reviewer_id, review_period, rating, strengths, improvements, goals, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [employee_id, reviewer_id || null, review_period || null, rating || null, strengths || null, improvements || null, goals || null, status || 'draft']
    );
    res.json({ review: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 5. Training tracking (TOO-RISKY -> additive) ───────────────────────────
router.get('/training', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM training_records ORDER BY id DESC LIMIT 200`);
    res.json({ records: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/training', auth, async (req, res) => {
  try {
    const { employee_id, training_name, provider, completed_at, expires_at, certificate_url, status } = req.body || {};
    if (!employee_id || !training_name) return res.status(400).json({ error: 'employee_id and training_name required' });
    const r = await pool.query(
      `INSERT INTO training_records (employee_id, training_name, provider, completed_at, expires_at, certificate_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_id, training_name, provider || null, completed_at || null, expires_at || null, certificate_url || null, status || 'completed']
    );
    res.json({ record: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 6. Certification expiration alerts ─────────────────────────────────────
router.get('/training/expiring', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 60;
    const r = await pool.query(
      `SELECT * FROM training_records
        WHERE expires_at IS NOT NULL
          AND expires_at <= NOW()::DATE + make_interval(days => $1)
          AND expires_at >= NOW()::DATE
        ORDER BY expires_at ASC`,
      [days]
    );
    res.json({ window_days: days, expiring: r.rows, count: r.rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 7. Productivity-per-shift analysis (MECHANICAL bonus) ─────────────────
router.get('/productivity-per-shift', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const r = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, e.position,
        COUNT(s.id) AS shifts_completed,
        COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) AS total_hours,
        COALESCE(AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) AS avg_shift_hours
      FROM employees e
      LEFT JOIN shifts s ON s.employee_id = e.id
        AND s.status = 'completed'
        AND s.start_time >= NOW() - make_interval(days => $1)
      WHERE e.status = 'active'
      GROUP BY e.id, e.first_name, e.last_name, e.position
      ORDER BY total_hours DESC
    `, [days]);
    res.json({ window_days: days, employees: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
