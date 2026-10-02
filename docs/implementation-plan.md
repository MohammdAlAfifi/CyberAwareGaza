# Implementation plan and gates

## Phase 0 status: complete

- Inventoried every supplied Stitch HTML screen, screenshot, design token file, PDF, and logo; recorded validity, provenance, byte sizes, and SHA-256 hashes.
- Copied the supplied PRD into the non-public reference package and created a machine-readable source manifest.
- Completed the conflict record, canonical source map, screen/route gap map, architecture decision, and current official-provider review.
- Recorded a required Phase 1 driver correction from Postgres.js to `node-postgres` because current Supabase transaction-pooler guidance identifies a query-pipelining risk.
- Applied the Phase 0 gate: scenario, consent, scoring, feedback, and historical-data implementation remains blocked until the missing authoritative sources are supplied and reconciled.

## Completed in the source-independent foundation

- Repository structure for Next.js App Router, TypeScript, Drizzle migrations, environment validation, security headers, localization, and automated unit checks.
- Public bilingual shell and entry/authentication presentation using the supplied logo and approved visual tokens.
- Known risk-boundary implementation and the existing bilingual presentation shell.

## Phase 1 status

Completed source-independent work:

- Verified Node.js 24, pnpm, Next.js App Router, strict TypeScript, ESLint, Prettier, Vitest, Playwright configuration, design tokens, server-only environment validation, and secret-safe examples.
- Completed the relational schema, constraints, indexes, composite content/option references, RLS enablement, and migration generation.
- Replaced Postgres.js with the server-only Drizzle `node-postgres` adapter and a one-connection runtime pool suitable for the Supabase shared transaction pooler.
- Added atomic CAG/anonymous allocation in the participant insert transaction, foundation counter seeding, and a database integration/concurrency check.
- Documented local development, Supabase migrations/seeding, environment separation, and future Vercel variables.

Credential-dependent Phase 1 exit checks passed against the configured development Supabase project on September 29, 2026: three migration ledger entries and all 15 expected tables were verified, the source-independent foundation seed completed, both pooler modes negotiated authorized TLS 1.3 connections to the same project identity, RLS was enabled, and the atomic counter concurrency check passed.

## Phase 2 status: complete

- Converted approved Stitch patterns into reusable logo, header/navigation, panel, button, form field, modal, progress, loading, empty, and error components.
- Added an administration shell with a fixed desktop sidebar and keyboard-operable native-dialog drawer on mobile.
- Added local Inter and Noto Sans Arabic assets, persistent route-preserving language selection, root-locale persistence, correct `lang`/`dir`, RTL control mirroring, mixed-direction filename handling, visible focus, 44px targets, and reduced-motion behavior.
- Added representative landing/entry, disabled question, no-result, and empty-data admin shells without implementing authentication, submissions, scoring, or analytics queries.
- Verified English and Arabic shells at 1440px desktop and 390px phone widths. Sixteen Playwright screenshots showed no horizontal overflow; keyboard focus, drawer operation, route/query-preserving language switching, long Arabic wrapping, loading/empty/error states, and reduced motion passed browser checks.
- The official public logo file remains byte-for-byte identical to the approved source. Five available Stitch PNGs were used for visual comparison; the missing/invalid assessment, result, admin, mobile, and RTL reference screenshots remain a comparison-coverage limitation recorded in `docs/source-map.md`.

## Phase 3 status: complete

- Added participant signup and returning login with normalized unique usernames,
  optional display names, Argon2id password hashes, generic credential errors,
  and public-signup role rejection.
- Added opaque keyed-hash database sessions, fixed registered and anonymous
  expirations, database-clock validation, login rotation, logout revocation,
  secure cookie attributes, and server-only actor resolution.
- Added transactional registered/anonymous participant creation using the Phase
  1 counters, stable `Anonymous X` labels, unique CAG IDs, and no historical
  respondent session path.
- Added a separate admin login and server-side route/API role boundaries. Private
  provisioning reads its password from the invoking shell, refuses participant
  promotion, revokes older sessions, and writes an admin audit record.
- Added exact-origin CSRF checks, strict server validation, participant ownership
  enforcement, and PostgreSQL-backed login/signup/anonymous/admin rate limits
  shared across Vercel instances.
- Applied migration `0003_mushy_spencer_smythe.sql`. Live Supabase checks verified
  four migration ledger entries, 16 RLS-enabled tables, both pooler modes over
  authorized TLS, and atomic counters.
- The live browser security gate passed registered signup/login/logout/token
  rotation, mobile Arabic signup, anonymous creation/logout/forced expiry,
  participant-to-participant and anonymous ownership denial, public role
  injection rejection, participant/admin separation, private admin provisioning,
  and the mobile admin drawer. Temporary test identities were deleted afterward.

## Phase 4 status: complete

- Transcribed and versioned the exact eight English/Arabic scenarios and answer
  options from rendered PDF Section 7 pages, with stable S1-S8 and option IDs.
- Implemented explicit versioned consent from PDF Section 6.3, instructions,
  one-scenario navigation, bilingual route-preserving progress, and persisted
  draft answers for registered and anonymous authorized sessions.
- Added idempotent attempt creation, one active web attempt per participant,
  ownership-checked draft writes, exact-eight submission validation, and a
  locked server transaction that calls the single scoring service.
- Connected participant dashboard status and attempt counts to the persisted
  assessment journey.
- Final completion remains deliberately unavailable until an approved active
  legacy rubric supplies all per-option contributions and score bounds. All
  eight draft answers remain saved; no score, risk, or fabricated result is
  produced while that source is missing.

## Phase 5 status: complete

- Installed the approved versioned scoring rubric while preserving all eight
  bilingual scenarios and the revised S4 multiple-choice mapping.
- Persisted each response contribution as the scoring trace, the final raw
  cumulative score, risk level, completion time, and participant result review.

## Phase 6 status: implemented, pending operator migration/browser review

- Added a responsive bilingual administration shell with live Dashboard,
  Participants, Assessments, Settings, and read-only import-audit views.
- Added server-backed bounded participant and attempt search, filters, sorting,
  pagination, details, identity fallbacks, attempt histories, source labels, and
  stored Phase 5 response traces. A participant's summary score/risk is defined
  by the completed attempt with the latest `completed_at` timestamp.
- Phase 6 intentionally left Scenario Analytics and CSV Import / Export
  unavailable for their later phases; no placeholder metrics or active transfer
  controls were introduced.
- Added interactive private `admin` provisioning and forced password rotation
  for every temporary CLI bootstrap credential.

## Phase 7 status: implemented, pending operator review

- Replaced the admin dashboard placeholders with database-aggregated participant
  totals, consent-eligible assessment metrics, flat accessible donuts, and a
  bounded recent-assessments table.
- Added one overview card and a detailed bilingual view for each of the eight
  approved scenarios. Distributions use stable scenario/option IDs and persisted
  response traces; displayed deltas come from the active versioned rubric.
- Added shared Website, imported Google Form, and Combined source scopes.
  Assessment analytics include only completed attempts with an affirmative
  attempt-linked consent. Participant totals count unique source-associated
  participants; repeat eligible attempts remain separate assessment records.
- Score, risk, and response analytics use only the active compatible
  content/rubric pair. Other eligible version pairs are identified and excluded
  from those calculations rather than silently combined.
- Added English/Arabic, desktop/mobile, role-boundary, provenance, repeated
  attempt, consent exclusion, empty-percentage, and S4 mapping verification.
  CSV import/export was deferred to Phase 8.

## Phase 8 status: implemented, pending migration and operator review

- Added server-validated historical Google Form CSV upload, column mapping,
  row-level preview, explicit invalid-row exclusion, fingerprint-bound
  confirmation, minimal diagnostics, and real import history.
- Added transactional imported-anonymous participant allocation, consent-only
  persistence, source/batch/record provenance, shared Phase 5 scoring, file and
  source-response duplicate safeguards, and concurrency locking.
- Added full-dataset Participants, Assessments, Risk Distribution, and Scenario
  Analytics CSV exports plus professionally formatted participant-response
  Excel and PDF reports with English/Arabic presentation.
- The real historical CSV was not available in the workspace, so no research
  records were inserted. Final 93/91/2 preview and 91/91/728 confirmation remain
  an administrator verification step after migration.

## Blocked source-dependent work

- Implement option validation, contributions, feedback, score range, normalization, and Python parity fixtures.
- Import and verify the historical CSV (including 93/91/2) after the operator
  supplies it and confirms the validated preview.

## Next execution order

1. Add missing inputs under `reference/research/`, `reference/legacy/`, `reference/stitch/`, and `reference/` and update the source map.
2. Reconcile and approve one canonical content/rubric version.
3. Re-run the verified migration/check workflow before future schema releases and seed only approved reference content.
4. Supply and reconcile the legacy scoring source, activate its versioned
   rubric, and complete the existing Phase 4 secure submission transaction.
5. Add CSV import/export and its audit workflow, then complete the remaining
   performance/security verification.
6. Configure isolated Vercel/Supabase environments, preview smoke test, backup/restore drill, then production release with user authorization.

No thesis chapter is modified in this repository.
