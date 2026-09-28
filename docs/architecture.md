# Architecture decision record

Status: accepted for source-independent foundation; content/scoring portions remain gated by `docs/source-map.md`.

## Decision

Use Next.js App Router with strict TypeScript on Vercel, Supabase hosted PostgreSQL, Drizzle ORM and SQL migrations, and server-managed opaque sessions. All sensitive database access stays in server-only modules. The browser never receives database credentials, password hashes, session tokens, option weights, or authoritative scoring logic.

Drizzle is selected over Prisma for a small, explicit SQL model and a lightweight serverless runtime. Runtime queries use the Supabase shared transaction pooler with the `node-postgres` driver, a module-scoped pool capped at one connection per warm function instance, TLS required, and no named prepared statements. Migrations and backups use the direct connection (or the documented session-pooler alternative when the runner lacks IPv6). Both URLs must be copied from Supabase; hosts are never guessed.

The initial foundation used Postgres.js. Supabase now documents that its default query pipelining can hang or mismatch results with the shared transaction pooler and that disabling the pipeline breaks transactions. Because assessment completion and imports require transactions, Phase 1 must replace the current Postgres.js runtime adapter with Drizzle's `node-postgres` adapter before any database integration gate can pass. This is a recorded implementation correction, not permission to use a different stack.

## Deployment boundaries

- Public content can be statically cached. Participant, result, and admin data are dynamic and must not be shared-cached.
- Vercel Production and Preview use separate secrets and preferably separate databases. If only one production Supabase project is available, previews receive no production credentials.
- Select the Supabase region first, then choose the closest practical Vercel function region and measure latency from Gaza. Do not hard-code a region before the projects exist.
- Supabase Free projects may pause after low activity. The operational plan is dashboard monitoring plus independent encrypted logical exports—not fabricated traffic. Continuous availability requires a paid plan.
- Research tables are queried server-side. RLS remains enabled/deny-by-default for direct Data API access; any future browser API requires explicit participant/admin policies and tests.

## Identity and sessions

Public registration accepts normalized username, optional display name, and password; it always creates a participant role. Passwords use Argon2id. Admin accounts are provisioned by a private CLI command and cannot be registered publicly.

Login creates a random opaque token; only its SHA-256 hash is stored. Cookies are HttpOnly, Secure in production, SameSite=Lax, path-scoped, and rotated after authentication. Cookie-authenticated mutations enforce same-origin checks and server-side authorization. Anonymous entry creates a separate expiring session and participant record. Logout or explicit session end revokes it. Initial policy: registered sessions expire after 30 days of inactivity; anonymous sessions after 24 hours and are not recoverable. These values are configurable and documented to users.

Database-backed counters allocate `CAG-0001` and `Anonymous 1` transactionally. Public codes are display identifiers, never credentials.

## Routes and component map

| Route                             | Purpose                    | Core components                                                       |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| `/[locale]`                       | Public landing             | Brand header, purpose card, eight-scenario overview, How it works     |
| `/[locale]/start`                 | Three-way entry            | Login/signup/anonymous route cards                                    |
| `/[locale]/login`, `/signup`      | Participant authentication | Accessible credential forms                                           |
| `/[locale]/anonymous`             | Anonymous session entry    | Warning and session limitation                                        |
| `/[locale]/home`                  | Participant home/history   | Warning acknowledgement, attempts list, new assessment                |
| `/[locale]/consent`               | Exact approved consent     | Versioned explicit Yes/No decision                                    |
| `/[locale]/assessment/[scenario]` | One scenario at a time     | Progress, radio-card options, previous/next                           |
| `/[locale]/results/[attemptId]`   | Owned completed result     | Raw score/risk, documented ring, feedback/review                      |
| `/[locale]/admin/login`           | Separate admin entry       | Admin credential form                                                 |
| `/[locale]/admin/*`               | Protected administration   | Sidebar/drawer, dashboard, tables, analytics, import/export, settings |

The current source-independent slice implements the public shell and entry/authentication presentation. Assessment and analytics routes must not expose Stitch placeholder content.

## Data model

Drizzle schema and SQL migrations define accounts, participants, consents, assessment attempts, responses, content/rubric versions, scenarios/options, sessions, counters, import batches/rows, and admin audit. Important constraints include normalized-username uniqueness, one account per registered participant, one response per attempt/scenario, immutable completed attempt fields at the service layer, unique source submission keys, and server-assigned roles.

Timestamps are stored in UTC. UI/export presentation uses an explicit timezone, defaulting to `Asia/Hebron`. Declined consent is retained only as minimized audit evidence and is excluded from scoring and research aggregates.

## Assessment and scoring boundary

Submission accepts exactly eight `(scenarioKey, optionId)` pairs plus an idempotency key. In one transaction the server verifies affirmative consent, active content/rubric versions, exact allowed options, ownership, and non-completion; computes contributions using a server-only versioned rubric; inserts responses; and finalizes once.

Only risk classification is currently implementable: Low `>=25`, Medium `10-24`, High `<10`. Option mappings, score range, special rules, feedback, normalization, and ring semantics remain blocked pending the legacy source. The same scoring service will be called by web submissions and accepted CSV imports.

## CSV workflow

Admin upload validates filename/content, UTF-8/BOM, configured byte/row limits, and required headers before parsing. Preview maps source columns and option strings without writes. Commit is idempotent using batch checksum plus source row key, stores row-level rejection reasons, and avoids durable raw-upload storage. Declined or invalid rows are excluded. Formula-leading export cells are escaped. Larger-than-function-limit files move to private object storage/background processing only after a documented need.

## Security and accessibility

Every data service authorizes actor, role, and object ownership. Rate limits are database-backed for registration/login/admin/upload. Mutations validate with Zod, reject cross-origin requests, and log limited audit metadata. Content Security Policy, security headers, redacted errors, and secret scanning are release gates.

The UI uses semantic landmarks, native controls, visible focus, 44px targets, live error/status regions, text alternatives for charts, reduced motion, and mirrored RTL layout. IDs, usernames, dates, and filenames use isolated LTR spans inside Arabic pages.

## Current provider checks (2026-09-28)

- [Next.js App Router](https://nextjs.org/docs/app) remains the supported file-system router and supports Server Components and Server Functions.
- [Vercel environments](https://vercel.com/docs/deployments/environments) remain separated into Local/Development, Preview, and Production, with environment-scoped variables. Preview must not inherit production database credentials.
- [Vercel Functions default to `iad1`](https://vercel.com/docs/functions/configuring-functions/region) for new projects. The project must instead choose a function region near the selected Supabase database after measuring target-user latency; Phase 0 deliberately does not guess a region.
- [Vercel Functions currently impose a 4.5 MB request/response payload limit](https://vercel.com/docs/functions/limitations). The CSV import workflow must enforce a smaller explicit upload limit or move larger files to private object storage.
- [Supabase recommends the shared transaction pooler for serverless functions](https://supabase.com/docs/guides/database/connecting-to-postgres), with one application connection, TLS, and no prepared statements. Direct connections are preferred for migrations and backups, while the session pooler is the IPv4 alternative.
- [Supabase warns against Postgres.js pipelining with the transaction pooler](https://supabase.com/docs/guides/database/postgres-js). The selected runtime adapter is therefore `node-postgres`, which Drizzle supports directly.
- [Supabase Free projects can pause after low activity](https://supabase.com/docs/guides/platform/free-project-pausing); paid projects do not. A paused project can currently be restored for up to one year, but this must be rechecked at deployment.
- [Free-tier projects should maintain independent logical exports](https://supabase.com/docs/guides/platform/backups); managed daily backup access is described for paid plans.
- [Supabase currently grants two Free projects per account](https://supabase.com/docs/guides/platform/billing-on-supabase), allowing development/production separation when the user's account has capacity. Provider limits remain deployment-time checks, not permanent assumptions.

Re-check these items in the provider dashboards immediately before deployment.

## Open decisions

1. Exact canonical questionnaire, consent, rubric, feedback, and version identifiers.
2. Supabase project region and matching Vercel function region after latency measurement.
3. Whether separate development and production Supabase projects fit the account plan.
4. Retention/deletion policy and the institution responsible for research governance.
5. Final upload byte/row limits after inspecting the historical CSV and current Vercel limits.
6. Whether the supplied JPG is the final production logo or whether transparent/symbol originals exist.
