# CyberAwareGaza

Production-oriented foundation for a bilingual cybersecurity awareness and risk-evaluation platform for academic institutions in Gaza.

## Current status

Phase 0 and the source-independent portion of Phases 1-2 are implemented. The public English/Arabic shell, three-way entry presentation, data schema, security configuration, and boundary utilities are present. Assessment content and scoring are intentionally gated because the canonical questionnaire, approved consent version, legacy Python scorer, and historical CSV are not yet in the workspace.

Read `docs/source-map.md` before adding content. Stitch mock statistics, scenario rewrites, and guessed scoring must never become production data.

## Local setup

Requirements: Node.js 24+, pnpm 11+, and a development Supabase PostgreSQL project.

1. Copy `.env.example` to `.env.local` and replace every placeholder.
2. Copy the Supabase **transaction pooler** URL to `DATABASE_URL` and the **direct** connection URL to `DIRECT_DATABASE_URL`.
3. Run `pnpm install`.
4. Run `pnpm db:migrate` after migrations have been reviewed.
5. Run `pnpm dev` and open `http://localhost:3000`.

Do not connect preview deployments to the production database.

## Checks

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Database integration and browser tests will be added when the development database and approved content exist.

## Reference material

Non-public source material lives under `reference/`, not `public/`. Raw identifiable exports must remain outside the repository unless an approved data-handling decision says otherwise.
