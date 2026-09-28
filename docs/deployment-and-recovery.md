# Deployment and recovery guide

## Environments

Use distinct Vercel Production and Preview variables. Prefer separate Supabase projects for development and production. If plan limits prevent that, keep production credentials entirely out of Preview and use local development for database-backed preview work.

Required runtime values are documented in `.env.example`. `DATABASE_URL` is the copied Supabase shared transaction-pooler URL. Drizzle uses `node-postgres` with a module-scoped pool limited to one connection per warm function instance and trusted TLS for hosted databases. `DIRECT_DATABASE_URL` is used only for controlled migrations, seed/check commands, and logical backups.

The running Vercel app needs `DATABASE_URL`, `SESSION_SECRET`, `APP_ORIGINS`, `APP_TIMEZONE`, `ANONYMOUS_SESSION_HOURS`, and `REGISTERED_SESSION_DAYS`. None are public variables. Keep `DIRECT_DATABASE_URL` out of the runtime environment unless a separate controlled deployment job explicitly needs it.

## Region selection

Choose the Supabase project region first. Set the Vercel function region near that database, then measure real response times from intended users in Gaza. Record the selected region and measurements; do not infer a pooler hostname from the region.

## Controlled release

1. Export and encrypt a current logical backup.
2. Review generated SQL and apply migrations once as a deployment step, never at request startup.
3. Configure secrets separately in Vercel Preview and Production.
4. Build and deploy a Preview.
5. Smoke-test English/Arabic landing and RTL, registration/login/logout, anonymous expiry, consent gate, eight-answer idempotency, result ownership, admin denial/allow rules, analytics denominators, import idempotency, and CSV export escaping.
6. Remove or isolate all test accounts/data before validating real analytics.
7. Promote to Production only after user authorization and repeat the smoke test over HTTPS.

## Admin provisioning

The final provisioning command must create an Argon2id password hash and an `admin` account inside a transaction, reject an existing normalized username, and write an audit event. It must read the password interactively or from a one-time secret input, never from a committed argument or default. Public registration must always force role `participant`.

This command is not enabled until database-backed authentication is completed and tested.

## Backup and restore

- On Supabase Free, schedule independent encrypted logical exports using the direct connection; do not assume managed daily backup access.
- Store backups outside the application repository with access limited to authorized research administrators.
- Quarterly and before material migrations, restore the latest backup into an isolated project and run consistency checks for participant/attempt/response counts and version references.
- Document retention/deletion approval before importing historical data.

## Rollback

Application rollback uses Vercel's previously verified deployment. Database changes require forward-compatible migrations during rollout. For a destructive or incompatible migration, create and test an explicit restore/forward-fix procedure before production application. Never rely on application rollback alone to reverse migrated data.

## Supabase Free operations

Free projects may pause after insufficient activity. Monitor provider warning emails and use the dashboard to resume. Artificial participant traffic is prohibited. If continuous public availability is required, use a paid plan. Re-check plan, capacity, backup, function payload, and duration limits at release time.
