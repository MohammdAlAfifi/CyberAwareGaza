# CyberAwareGaza

Production-oriented foundation for a bilingual cybersecurity awareness and risk-evaluation platform for academic institutions in Gaza.

## Current status

Phases 0 and 1 are complete, including the live Supabase migration/seed/integration exit check. Phase 2 now provides the reusable English/Arabic visual system, responsive participant shells, source-safe assessment/result previews, and an empty-data admin dashboard with desktop sidebar and mobile drawer. Authentication and all data-changing behavior remain intentionally deferred to later phases.

Section 7, “Exact Assessment Content,” of the supplied design specification is authoritative for the exact bilingual S1-S8 question and option wording. Assessment content belongs to Phase 4 and is not seeded by the Phase 1 foundation. Scoring weights remain blocked on the legacy Python source.

Read `docs/source-map.md` before adding research content. Stitch mock statistics, scenario rewrites, guessed scoring, and real respondent data must never become production fixtures.

## Requirements

- Node.js 24 or later
- pnpm 11, as pinned by `packageManager` in `package.json`
- A disposable development Supabase PostgreSQL project for database-backed checks

On Windows, use `npm.cmd` or `pnpm.cmd` if PowerShell blocks a `.ps1` shim.

## Install and verify

```text
pnpm install
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Copy `.env.example` to `.env.local` only when database-backed runtime work begins. Do not commit `.env.local`.

## Database workflow

```text
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:check
```

- `db:generate` is offline and does not require credentials.
- `db:migrate`, `db:seed`, and `db:check` load `.env.local` and require `DIRECT_DATABASE_URL`.
- Local machines that do not trust the Supabase certificate chain can set `SUPABASE_CA_CERT_PATH` to the full downloaded certificate filename; all database commands and the server runtime use it with certificate verification enabled.
- The seed inserts only the two allocation counters; it never inserts questionnaire, rubric, or respondent data.
- Runtime server queries use `DATABASE_URL`. Browser code never receives either database URL.

See `docs/supabase-setup.md` for the full local/Supabase workflow and `docs/deployment-and-recovery.md` for deployment separation and recovery planning.

## Reference material

Non-public source material lives under `reference/`, not `public/`. Raw identifiable exports must remain outside the repository unless an approved data-handling decision says otherwise.
