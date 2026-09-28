# Implementation plan and gates

## Completed in the source-independent foundation

- Phase 0 inventory, conflict record, screen/route map, architecture decision, and current provider review.
- Repository structure for Next.js App Router, TypeScript, Drizzle migrations, environment validation, security headers, localization, and automated unit checks.
- Public bilingual shell and entry/authentication presentation using the supplied logo and approved visual tokens.
- Versioned relational schema, transaction-safe counters, session model, import/audit model, and known risk-boundary implementation.

## Blocked source-dependent work

- Freeze/seed eight bilingual scenarios and consent wording.
- Implement option validation, contributions, feedback, score range, normalization, and Python parity fixtures.
- Import and verify the historical CSV (including 93/91/2).
- Produce content-complete result review and scenario analytics.

## Next execution order

1. Add missing inputs under `reference/research/`, `reference/legacy/`, `reference/stitch/`, and `reference/` and update the source map.
2. Reconcile and approve one canonical content/rubric version.
3. Run migrations against a development Supabase project and seed only approved reference content.
4. Finish authentication/session services, consent, assessment transaction, scoring parity, result/history, and authorization integration tests.
5. Add admin reporting, analytics, import/export, accessibility/browser checks, and performance/security verification.
6. Configure isolated Vercel/Supabase environments, preview smoke test, backup/restore drill, then production release with user authorization.

No thesis chapter is modified in this repository.
