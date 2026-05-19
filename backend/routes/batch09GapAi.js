// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-ai endpoints for AIWorkforceSchedulingShiftPlanner.
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

// POST /api/gap-ai-aiworkforceschedulingshiftplanner/ai-burnout-fatigue-risk-modeling
// AI burnout / fatigue risk modeling
router.post('/ai-burnout-fatigue-risk-modeling', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: AI burnout / fatigue risk modeling\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('ai-burnout-fatigue-risk-modeling', req.body, ai);
    res.json({ feature: 'ai-burnout-fatigue-risk-modeling', title: 'AI burnout / fatigue risk modeling', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-ai-aiworkforceschedulingshiftplanner/ai-fairness-auditor-for-schedule-equity
// AI fairness auditor for schedule equity
router.post('/ai-fairness-auditor-for-schedule-equity', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: AI fairness auditor for schedule equity\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('ai-fairness-auditor-for-schedule-equity', req.body, ai);
    res.json({ feature: 'ai-fairness-auditor-for-schedule-equity', title: 'AI fairness auditor for schedule equity', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-ai-aiworkforceschedulingshiftplanner/predictive-turnover-and-retention-modeling
// Predictive turnover and retention modeling
router.post('/predictive-turnover-and-retention-modeling', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Predictive turnover and retention modeling\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('predictive-turnover-and-retention-modeling', req.body, ai);
    res.json({ feature: 'predictive-turnover-and-retention-modeling', title: 'Predictive turnover and retention modeling', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-ai-aiworkforceschedulingshiftplanner/ai-candidate-to-shift-matching-for-gig-workers
// AI candidate-to-shift matching for gig workers
router.post('/ai-candidate-to-shift-matching-for-gig-workers', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: AI candidate-to-shift matching for gig workers\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('ai-candidate-to-shift-matching-for-gig-workers', req.body, ai);
    res.json({ feature: 'ai-candidate-to-shift-matching-for-gig-workers', title: 'AI candidate-to-shift matching for gig workers', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
