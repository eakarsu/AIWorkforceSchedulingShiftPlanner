# Completeness Review: AIWorkforceSchedulingShiftPlanner

- **Review date:** 2026-07-20
- **Assessment basis:** Source/configuration inspection plus isolated PostgreSQL bootstrap, startup, login, persisted-session, authenticated-API verification, governance tests, and a production frontend build.

## Classification

**Functional but incomplete**

## Verdict

This is a substantive but unfinished education/workforce application: 83 project-owned source files and 2 manifest(s) expose a coherent surface, but the source does not demonstrate a production-complete AIWorkforce Scheduling Shift Planner workflow.

## Why it is not complete

- 5 project-owned files contain direct provider/chat-completion markers; generic model calls are not a substitute for typed domain tools, grounded evidence, deterministic rules, or evaluations.
- 27 files contain mock, sample, placeholder, simulated, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- No recognizable project-owned automated tests were found for the primary workflow.
- No checked-in CI workflow was found to continuously verify builds, tests, migrations, and security checks.
- No environment example/template was found, leaving required configuration and secret boundaries undocumented.

## Needed features

1. Implement the Workforce Scheduling Shift Planner journey with role-specific goals, assessments or work items, progress state, feedback, approvals, and measurable outcomes.
2. Connect authoritative LMS/HRIS/ATS/calendar/content and communication systems with consent, synchronization, and deletion propagation.
3. Evaluate recommendations and scoring for validity, bias, accessibility, progression, edge cases, and outcome improvement on representative cohorts.
4. Add role-scoped access, learner/candidate consent, explainable decisions, appeal/correction paths, retention limits, and human oversight.
5. Add contract, integration, authorization, migration, failure-path, and end-to-end tests in CI, plus a documented nondestructive deployment/run path.

## Risks or launch blockers

- Automated scoring or recommendations can create unfair educational or employment outcomes.
- Personal records require explicit consent, correction, export, deletion, and access controls.
- A weak JWT/session-secret fallback can make authentication forgeable when configuration is absent.
- The root launcher can terminate unrelated processes occupying configured ports.
- The root launcher seeds, creates, migrates, or otherwise mutates database state during startup.
- The root launcher installs dependencies at run time, reducing reproducibility and expanding supply-chain risk.

## Evidence inspected

- `backend/package.json` — inspected project-owned structure or implementation evidence.
- `backend/db/index.js` — inspected project-owned structure or implementation evidence.
- `start.sh` — inspected project-owned structure or implementation evidence.
- `backend/db/schema.sql` — inspected project-owned structure or implementation evidence.
- `backend/db/seed.sql` — inspected project-owned structure or implementation evidence.
- `backend/middleware/auth.js` — inspected project-owned structure or implementation evidence.

## Recommended next action

Choose one production education/workforce journey, connect its authoritative systems, define measurable acceptance tests, and close its data, permission, failure, and operational gaps before adding screens.

## Implementation progress (2026-07-18)

1. Added the tenant/worker-scoped `approved_workforce_schedule` state machine for consent, constraints, demand assessment, schedule proposal, fairness/accessibility review, employee feedback, manager approval, synchronization, appeal/correction, measurable outcomes, and closure.
2. Added typed HRIS, LMS, ATS, calendar, content, communication, payroll, and time-clock directives through a payload-bound idempotent outbox with immutable attempts, bounded retries, dead-letter state, case-scoped failures, receipts, and deletion status; external synchronization workers remain separately validated.
3. Added deterministic cohort fixtures and tests for conflicts, coverage, fairness deviation, accessibility, overtime violations, latency, consent, appeals, idempotency, retry/dead-letter behavior, and null publication/employment commands; representative-cohort and real outcome evaluation remain external.
4. Added exact tenant/subject scope, role-based scheduling/review/privacy access, dual control, opaque evidence, explainable metric output, employee feedback, appeal/correction state, retention/deletion evidence, append-only audit, least-privilege legacy protection, and strong runtime configuration.
5. Added an additive migration, contract/authorization/failure tests, CI, sanitized configuration, guarded destructive demo SQL, a nondestructive launcher, and a deployment runbook; no HRIS/LMS/ATS/calendar sync, schedule publication, employment decision, migration execution, or labor/legal validation was performed.

## Runtime verification (2026-07-20)

- Isolated startup honored PostgreSQL/API/UI ports `55600/6014/6015`; API-only test startup passed with an explicit disposable database-backed administrator. Login, persisted `/api/auth/me`, and an authenticated API request passed.
- Governance tests passed (17/17), and the production frontend build completed successfully.
