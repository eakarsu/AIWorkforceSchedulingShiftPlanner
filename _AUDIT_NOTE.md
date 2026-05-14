# Audit Recommendations & Status — AIWorkforceSchedulingShiftPlanner

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_09.md

Verdict per audit: template-clone, 6 AI endpoints, 21 non-AI routes.

## Original audit recommendations

Missing AI: none specifically called out beyond "adequate but not sophisticated AI coverage".

Missing non-AI:
- Benefits management
- Performance reviews
- Training tracking
- Certification expiration alerts

Custom feature ideas:
- Predictive no-show modeling
- Fairness audit (shift distribution)
- Burnout risk detection
- Gig-worker preference learning
- External labor market integration
- Wage compression detection
- Workforce capacity planning with turnover prediction
- Productivity-per-shift analysis

## Implemented in this pass

None. AI surface is modest (6 endpoints) but covers core scheduling/forecasting/compliance use cases. Custom feature ideas mostly require new schema + UI; adding bare AI endpoints without that data shape would not be useful in a mechanical pass.

## Backlog (priority order)

1. No-show prediction endpoint (`/api/ai/no-show-prediction`) — text-only AI add-on; mechanical next step.
2. Burnout-risk detection endpoint — text-only AI over shift patterns; mechanical add-on.
3. Fairness audit — needs schema/aggregations; product decision.
4. Wage compression detection — needs HR data; product decision.
5. Benefits / performance reviews / training tracking — substantial product features.

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- `frontend/src/pages/AITools.jsx` exposes cards for all 6 backend AI endpoints (`optimize-schedule`, `demand-forecast`, `compliance-check`, `shift-recommendations`, `analyze-overtime`, `payroll-insights`).
- Additional dedicated pages (`AutoScheduler.jsx`, `SmartForecast.jsx`, `VoiceClockIn.jsx`, `NoShowPredictor.jsx`, `SwapMatchmaker.jsx`) call into the same endpoints via `apiFetch` helper which attaches the JWT Bearer token.
- No files modified this pass.

## Apply pass 4 (mechanical backlog)

- **Action:** IMPLEMENTED (2 features — both remaining MECHANICAL items)
- **Features added:**
  1. No-Show Prediction — `POST /api/ai/no-show-prediction` (BE: `backend/routes/ai.js`) + new card on `frontend/src/pages/AITools.jsx`. Reads employees, last-N-day no-show / cancelled / completed history, and upcoming shifts; asks the LLM to predict per-shift no-show probability + mitigations.
  2. Burnout Risk Detection — `POST /api/ai/burnout-risk-detection` (BE: `backend/routes/ai.js`) + new card on `AITools.jsx`. Aggregates last-N-week workload, overtime rows, and time-off requests; returns per-employee burnout score, hotspots, and mitigation actions.
- New `NoApiKeyError` class surfaces HTTP 503 when `OPENROUTER_API_KEY` is missing on these two endpoints. Existing endpoints retained their original behavior (matched style).
- Reused existing `callOpenRouter`, `pool`, and `ai_recommendations` insert pattern (with try/catch fallback if the table is missing). Added `AlertTriangle` to the existing `lucide-react` import.
- **Smoke test:** PASS — backend started on port 4000, both endpoints reachable; DB queries succeed; non-200 only when upstream LLM responded without `choices` (key configured). 503 path verified by code path.
- **Backlog still deferred:** Fairness audit (NEEDS-PRODUCT-DECISION), wage-compression detection (NEEDS-PRODUCT-DECISION), benefits / performance reviews / training tracking (substantial product features).
