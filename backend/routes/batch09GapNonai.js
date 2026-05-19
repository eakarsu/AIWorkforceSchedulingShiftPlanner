// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-nonai endpoints for AIWorkforceSchedulingShiftPlanner.
// Calls OpenRouter via native fetch (no SDK); lazily creates gap_features table.
const express = require('express');
const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runAI(system, user) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY missing'); e.statusCode = 503; throw e;
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }
    ], max_tokens: 1500, temperature: 0.4 })
  });
  if (!r.ok) { const e = new Error(`AI ${r.status}`); e.statusCode = 502; throw e; }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '';
  let parsed = null;
  try { const m = content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
  return { raw: content, parsed, model: data?.model };
}

let _persistInit = false;
async function persist(feature, input, output) {
  // Lazy gap_features table — best-effort, swallow errors so AI still works.
  try {
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    if (!_persistInit) {
      await p.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS gap_features (id SERIAL PRIMARY KEY, feature TEXT, input JSONB, output JSONB, created_at TIMESTAMPTZ DEFAULT NOW())');
      _persistInit = true;
    }
    await p.$executeRawUnsafe('INSERT INTO gap_features(feature, input, output) VALUES ($1, $2::jsonb, $3::jsonb)', feature, JSON.stringify(input || {}), JSON.stringify(output || {}));
  } catch { /* swallow */ }
}

// POST /api/gap-nonai-aiworkforceschedulingshiftplanner/benefits-management
// Benefits management
router.post('/benefits-management', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Benefits management\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('benefits-management', req.body, ai);
    res.json({ feature: 'benefits-management', title: 'Benefits management', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiworkforceschedulingshiftplanner/performance-review-module
// Performance review module
router.post('/performance-review-module', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Performance review module\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('performance-review-module', req.body, ai);
    res.json({ feature: 'performance-review-module', title: 'Performance review module', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiworkforceschedulingshiftplanner/training-and-lms-integration
// Training and LMS integration
router.post('/training-and-lms-integration', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Training and LMS integration\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('training-and-lms-integration', req.body, ai);
    res.json({ feature: 'training-and-lms-integration', title: 'Training and LMS integration', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiworkforceschedulingshiftplanner/certification-expiration-alerts
// Certification expiration alerts
router.post('/certification-expiration-alerts', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Certification expiration alerts\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('certification-expiration-alerts', req.body, ai);
    res.json({ feature: 'certification-expiration-alerts', title: 'Certification expiration alerts', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiworkforceschedulingshiftplanner/geofenced-clock-in-mobile-attendance
// Geofenced clock-in / mobile attendance
router.post('/geofenced-clock-in-mobile-attendance', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Geofenced clock-in / mobile attendance\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('geofenced-clock-in-mobile-attendance', req.body, ai);
    res.json({ feature: 'geofenced-clock-in-mobile-attendance', title: 'Geofenced clock-in / mobile attendance', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiworkforceschedulingshiftplanner/tip-pool-and-tip-out-calculations
// Tip pool and tip-out calculations
router.post('/tip-pool-and-tip-out-calculations', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Tip pool and tip-out calculations\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('tip-pool-and-tip-out-calculations', req.body, ai);
    res.json({ feature: 'tip-pool-and-tip-out-calculations', title: 'Tip pool and tip-out calculations', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
