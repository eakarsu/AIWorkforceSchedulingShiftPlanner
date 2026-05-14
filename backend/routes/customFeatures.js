// Custom feature endpoints (batch_09 audit suggestions)
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const pool = require('../db');

const URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function callLLM(system, user, { maxTokens = 1800, temperature = 0.4 } = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY not configured'); e.statusCode = 503; throw e;
  }
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: maxTokens, temperature,
    }),
  });
  const data = await r.json();
  if (!data.choices?.[0]) throw new Error('Bad AI response');
  return { content: data.choices[0].message.content || '', model: data.model };
}

function parseJSON(t) {
  if (!t) return null;
  const c = String(t).replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const m = c.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function err(res, e, label) {
  if (e.statusCode === 503) return res.status(503).json({ error: e.message });
  console.error(`${label} error:`, e.message);
  res.status(500).json({ error: e.message });
}

// 1. Predictive no-show modeling with AI-driven reminder timing
router.post('/no-show-prediction', auth, async (req, res) => {
  try {
    const { employee_id, upcoming_shift, history } = req.body || {};
    if (!employee_id) return res.status(400).json({ error: 'employee_id required' });
    const ai = await callLLM(
      'You predict shift no-show risk and recommend reminder timing/channel. JSON only.',
      `EMPLOYEE: ${employee_id}\nSHIFT: ${JSON.stringify(upcoming_shift || {})}\nHISTORY: ${JSON.stringify(history || []).slice(0,2000)}\nReturn JSON {"no_show_probability":0,"recommended_reminder":{"channel":"sms|email|push","hours_before":0,"message":""},"backup_strategy":""}`
    );
    res.json({ type: 'no-show-prediction', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'no-show-prediction'); }
});

// 2. Fairness audit by demographic
router.post('/fairness-audit', auth, async (req, res) => {
  try {
    const { schedule_snapshot, demographics } = req.body || {};
    if (!schedule_snapshot) return res.status(400).json({ error: 'schedule_snapshot required' });
    const ai = await callLLM(
      'You audit scheduling fairness across demographics. JSON only.',
      `SCHEDULE: ${JSON.stringify(schedule_snapshot).slice(0,4000)}\nDEMOGRAPHICS: ${JSON.stringify(demographics || {})}\nReturn JSON {"disparities":[{"group":"","metric":"weekend_share|night_share|overtime_share","gap_pct":0}],"overall_fairness_score":0,"recommendations":[""]}`
    );
    res.json({ type: 'fairness-audit', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'fairness-audit'); }
});

// 3. Burnout risk detection from shift patterns + survey
router.post('/burnout-risk', auth, async (req, res) => {
  try {
    const { employee_id, last_30d_shifts, survey_responses } = req.body || {};
    if (!employee_id) return res.status(400).json({ error: 'employee_id required' });
    const ai = await callLLM(
      'You score burnout risk from shift patterns + self-report and recommend interventions. JSON only.',
      `EMP: ${employee_id}\nSHIFTS: ${JSON.stringify(last_30d_shifts || []).slice(0,3000)}\nSURVEY: ${JSON.stringify(survey_responses || {})}\nReturn JSON {"burnout_score":0,"contributing_factors":[""],"interventions":[{"action":"","owner":"manager|hr|self"}],"check_in_in_days":7}`
    );
    res.json({ type: 'burnout-risk', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'burnout-risk'); }
});

// 4. Gig-worker preference learning
router.post('/gig-preferences', auth, async (req, res) => {
  try {
    const { gig_worker_id, accepted_shifts, declined_shifts } = req.body || {};
    if (!gig_worker_id) return res.status(400).json({ error: 'gig_worker_id required' });
    const ai = await callLLM(
      'You learn a gig-worker preference profile from accept/decline patterns. JSON only.',
      `WORKER: ${gig_worker_id}\nACCEPTED: ${JSON.stringify(accepted_shifts || []).slice(0,2000)}\nDECLINED: ${JSON.stringify(declined_shifts || []).slice(0,2000)}\nReturn JSON {"preferred_days":[""],"preferred_times":[""],"min_acceptable_rate_usd":0,"avoid_locations":[""],"confidence":0}`
    );
    res.json({ type: 'gig-preferences', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'gig-preferences'); }
});

// 5. External labor market integration for fill-ins
// TODO: configure credentials for LABOR_MARKETPLACE_API_KEY (Wonolo/Instawork).
router.post('/external-fill-in', auth, async (req, res) => {
  try {
    const { open_shift, urgency } = req.body || {};
    if (!open_shift) return res.status(400).json({ error: 'open_shift required' });
    const ai = await callLLM(
      `You post to external labor marketplaces to fill a shift. API: ${Boolean(process.env.LABOR_MARKETPLACE_API_KEY)}. JSON only.`,
      `SHIFT: ${JSON.stringify(open_shift)}\nURGENCY: ${urgency || 'medium'}\nReturn JSON {"marketplaces":[{"name":"","posting_title":"","posting_body":"","expected_response_minutes":0}],"recommended_pay_premium_pct":0}`
    );
    res.json({ type: 'external-fill-in', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'external-fill-in'); }
});

// 6. Wage compression detection (internal equity alerts)
router.post('/wage-compression', auth, async (req, res) => {
  try {
    const { department, salary_snapshot } = req.body || {};
    if (!salary_snapshot) return res.status(400).json({ error: 'salary_snapshot required' });
    const ai = await callLLM(
      'You detect wage compression and internal pay inequity. JSON only.',
      `DEPT: ${department || 'all'}\nSALARIES: ${JSON.stringify(salary_snapshot).slice(0,3500)}\nReturn JSON {"compression_score":0,"inversions":[{"junior":"","senior":"","gap_usd":0}],"recommended_adjustments":[""],"budget_impact_usd":0}`
    );
    res.json({ type: 'wage-compression', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'wage-compression'); }
});

// 7. Workforce capacity planning with turnover prediction
router.post('/capacity-plan', auth, async (req, res) => {
  try {
    const { quarter, demand_forecast, current_headcount, turnover_history } = req.body || {};
    const ai = await callLLM(
      'You plan workforce capacity factoring turnover. JSON only.',
      `QUARTER: ${quarter || 'next'}\nDEMAND: ${JSON.stringify(demand_forecast || {})}\nHEADCOUNT: ${current_headcount || 0}\nTURNOVER: ${JSON.stringify(turnover_history || {})}\nReturn JSON {"hire_plan":[{"role":"","count":0,"start":""}],"contractor_supplements":0,"projected_attrition":0,"risks":[""]}`
    );
    res.json({ type: 'capacity-plan', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'capacity-plan'); }
});

// 8. Productivity-per-shift analysis with anomaly flags
router.post('/productivity-anomaly', auth, async (req, res) => {
  try {
    const { shifts, kpi } = req.body || {};
    if (!Array.isArray(shifts)) return res.status(400).json({ error: 'shifts array required' });
    const ai = await callLLM(
      'You spot productivity anomalies in shift-level KPI data. JSON only.',
      `KPI: ${kpi || 'tickets_closed'}\nSHIFTS: ${JSON.stringify(shifts.slice(0,80))}\nReturn JSON {"baseline":0,"anomalies":[{"shift_id":"","deviation":0,"likely_cause":""}],"trend":"up|flat|down","recommendations":[""]}`
    );
    res.json({ type: 'productivity-anomaly', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'productivity-anomaly'); }
});

module.exports = router;
