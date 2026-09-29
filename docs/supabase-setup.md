# Supabase and local database setup

## Boundaries

CyberAwareGaza uses Supabase as hosted PostgreSQL. It does not expose Supabase credentials or research tables to browser code. Drizzle and `node-postgres` run only in server modules. RLS is enabled with no browser policies on every application table, so direct Data API access is deny-by-default.

Use a disposable development project for migration and integration checks. Never test migrations against the production research database first.

## Connection values

Create `.env.local` from `.env.example` and copy connection strings from the Supabase **Connect** panel; do not construct a pooler hostname.

| Variable                | Purpose                                        | Supabase connection mode                                                        |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Next.js server runtime only                    | Shared pooler, transaction mode, port 6543                                      |
| `DIRECT_DATABASE_URL`   | Controlled migration, seed, checks, and backup | Direct connection, port 5432; use session pooler when local IPv6 is unavailable |
| `SUPABASE_CA_CERT_PATH` | Optional local CA file for verified TLS        | Full filename and path of the downloaded Supabase CA certificate                |

Hosted connections require trusted TLS. Localhost PostgreSQL is the only configuration where the repository disables TLS. These variables are server-only and must not use the `NEXT_PUBLIC_` prefix.

The database client owns SSL configuration. Do not add `sslmode`, `sslcert`, `sslkey`, or `sslrootcert` query parameters to either URL because those parameters can replace the client TLS object in `node-postgres`. The repository rejects them rather than silently weakening or conflicting with verification.

### Supabase CA certificate on Windows

If Node.js reports `SELF_SIGNED_CERT_IN_CHAIN`, open the Supabase dashboard for the development project, go to **Project Settings > Database > SSL Configuration**, and select **Download Certificate**. Keep the certificate outside the repository. `SUPABASE_CA_CERT_PATH` must name the actual `.crt`/`.cer` file, not the folder containing it.

Verify and use a downloaded certificate in Windows PowerShell:

```powershell
$supabaseCa = (Resolve-Path 'C:\full\path\to\prod-ca-2021.crt').Path
[System.Security.Cryptography.X509Certificates.X509Certificate2]::new($supabaseCa) | Select-Object Subject, Issuer, NotAfter
$env:SUPABASE_CA_CERT_PATH = $supabaseCa
```

Alternatively, add the full filename to the ignored `.env.local` file:

```dotenv
SUPABASE_CA_CERT_PATH=C:\full\path\to\prod-ca-2021.crt
```

The app and every database command read that same setting, parse it as an X.509 CA certificate, and pass it to `node-postgres` with `rejectUnauthorized: true`. A directory, unreadable file, non-certificate, or end-entity certificate is rejected. `NODE_EXTRA_CA_CERTS` is not required for this project-specific configuration; if it is used for other Node tools, it likewise must contain the full certificate filename before Node starts.

`SESSION_SECRET` must be an independently generated secret with at least 32 random bytes. Use different values for development, Preview, and Production. `APP_ORIGINS` is a comma-separated allowlist of exact origins, such as `http://localhost:3000`; do not include paths or trailing slashes.

## Migration workflow

1. Review `src/db/schema.ts` and every new file under `drizzle/`.
2. Generate a migration without connecting to a database:

   ```text
   pnpm db:generate
   ```

3. Set `DIRECT_DATABASE_URL` in `.env.local` for the disposable development project.
4. Apply reviewed migrations:

   ```text
   pnpm db:migrate
   ```

   The command connects through `DIRECT_DATABASE_URL`, applies the migration journal transactionally, then queries the migration ledger and all expected tables. Its success line includes only a sanitized host, database name, project fingerprint, negotiated TLS version, and PostgreSQL version; it never prints credentials.

   Migration `0002` deliberately stops with a clear error if the pre-Phase-4 `responses` or `rubric_versions` tables contain rows. Those tables should be empty at this stage; unexpected rows require an explicit content-version backfill rather than an unsafe automatic guess.

5. Seed only source-independent foundation counters:

   ```text
   pnpm db:seed
   ```

6. Run the integration check:

   ```text
   pnpm db:check
   ```

The check requires both database URLs and verifies that they identify the same Supabase project. It verifies TLS on both live connections, a runtime transaction-pooler query, all 16 application tables through the migration connection, RLS enablement, both seed counters, and 12 concurrent atomic allocations using an isolated temporary counter key that is deleted afterward.

Migration `0003` adds the PostgreSQL-backed authentication rate-limit table.
It is shared by all Vercel instances and contains only keyed hashes of limiter
identifiers, never plaintext usernames, IP addresses, or passwords.

## Fresh-environment exit check

For the Phase 1 gate, use an empty disposable database and run `db:migrate`, `db:seed`, then `db:check` in that order. Save the command results with the project QA notes. Do not insert scenario content, rubric weights, accounts, sample assessments, or historical respondents for this check.

The allocation service uses `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` inside the participant creation transaction. A failed participant insert rolls back its counter increments. Sequence gaps may still occur after a successfully committed participant is later deleted; public codes are identifiers, not row counts.

## Vercel variables for a later phase

Configure these as server-side Vercel variables, separated by environment:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_ORIGINS`
- `APP_TIMEZONE`
- `ANONYMOUS_SESSION_HOURS`
- `REGISTERED_SESSION_DAYS`

Do not give Preview deployments the production database URL. `DIRECT_DATABASE_URL` is not needed by the running web app and should be available only to the controlled migration/backup workflow. Environment changes apply only to new deployments.

`APP_ORIGINS` must list every exact origin that is allowed to submit
cookie-authenticated mutations. Configure the production domain and each
authorized preview domain explicitly; do not use wildcards. Local browser tests
using `http://127.0.0.1:3000` require that exact origin for the test process even
when normal development uses `http://localhost:3000`.

`SUPABASE_CA_CERT_PATH` is intended for a local filesystem certificate. Do not copy a Windows path into Vercel. Leave it unset when the deployment platform already trusts the Supabase CA; if a future hosting environment needs a custom CA, provision the certificate as a secure deployment file and set an environment-specific path.

## Troubleshooting

- If a Windows PowerShell execution policy blocks `pnpm.ps1`, run `pnpm.cmd`.
- If the direct Supabase hostname cannot be reached over IPv6, copy the session-pooler migration URL from the dashboard instead of guessing a host.
- If Node.js reports `SELF_SIGNED_CERT_IN_CHAIN`, download the project CA as described above and set `SUPABASE_CA_CERT_PATH` to its full filename. Do not disable certificate verification.
- If Node.js says it is ignoring extra certificates with `Input/output error`, confirm that the supplied path resolves to a file rather than a directory.
- If migration checks report missing counters, run `pnpm db:seed`.
- If `db:check` reports a table without RLS, stop before deployment and review the generated migration.
