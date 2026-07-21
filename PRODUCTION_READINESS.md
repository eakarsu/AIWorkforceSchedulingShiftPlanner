# Production readiness

The governed API at `/api/governance` is the supported workforce scheduling and shift planning path. It records tenant/worker-scoped consent, HRIS/LMS/ATS/calendar evidence, constraints, demand assessment, bias and accessibility evaluation, feedback, manager approval, appeal/correction, outcomes, deletion, and immutable connector history. It never publishes shifts or changes employment status.

## Deployment sequence

1. Review and back up the database, then apply `backend/migrations/001_governed_workforce_schedule.sql` separately using a least-privilege migration identity.
2. Copy `.env.example` to `.env`, replace every placeholder, and configure a unique 32-plus-character JWT secret and explicit CORS allowlist.
3. Install locked dependencies explicitly. `start.sh` only supervises the already-installed backend and frontend.
4. Provision tenant memberships and deploy separately reviewed connector workers. Workers exchange opaque references, versions, digests, and receipts; raw secrets and sensitive content do not enter workflow payloads.
5. Exercise retry, dead-letter, reconciliation, retention/deletion, audit export, backup, restore, and incident-response procedures before production.

Production rejects wildcard CORS, weak secrets, provider/demo flags, generated routes, and startup schema mutation. The additive migration never drops or truncates tables. The legacy SQL seed requires explicit `-v allow_demo_seed=1` against an isolated non-production database. Startup never applies schema or seed SQL.

## Required external validation

Validate HRIS, LMS, ATS, calendar, content, payroll, time-clock, and communication contracts; representative-cohort bias and accessibility thresholds; labor-rule and collective-agreement constraints; synchronization/deletion propagation; appeals; latency; and realized coverage/overtime outcomes. No employment or schedule publication decision was executed.
