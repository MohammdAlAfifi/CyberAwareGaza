# Authentication and session operations

CyberAwareGaza uses application-managed username/password accounts. Supabase is
the PostgreSQL provider; Supabase Auth is not used because participants must not
provide an email address or phone number.

## Security model

- Passwords are hashed with Argon2id. Plaintext passwords are never stored or
  logged.
- The browser receives a random opaque `cag_session` cookie. Only a keyed
  SHA-256 hash is stored in PostgreSQL.
- The cookie is `HttpOnly`, `SameSite=Lax`, scoped to `/`, and `Secure` in
  production. Registered sessions use the fixed lifetime configured by
  `REGISTERED_SESSION_DAYS`; signing in again rotates the token and starts a new
  lifetime.
- Anonymous cookies are browser-session cookies without a durable recovery
  token. The database applies the fixed `ANONYMOUS_SESSION_HOURS` maximum and
  logout revokes the row. Closing a tab is not a reliable logout: browsers may
  restore session cookies after a restart, but they cannot bypass the server
  expiry or revocation.
- Login rotates away from any session token presented by the browser. Password
  changes and private admin reprovisioning invalidate older account sessions.
- Every cookie-authenticated mutation requires an exact origin listed in
  `APP_ORIGINS`. Authentication attempts use PostgreSQL-backed rate limits so
  enforcement is shared across Vercel instances.
- Direct Supabase Data API access remains deny-by-default through RLS. Server
  services enforce actor role and participant ownership.

## Private administrator provisioning

There is no public administrator signup. Run this only from a trusted,
interactive terminal with the intended maintenance connection loaded:

```text
pnpm run db:provision-admin
```

On Windows, where pnpm is unavailable, use `npm run db:provision-admin`.
The command securely prompts for `New password for admin` and then asks for the
same password again. Type the password at each prompt and press Enter. Input is
not echoed and is never placed in a command argument, environment variable,
source file, migration, seed, or committed environment file. The administrator
username is always `admin`.

Every password entered through this provisioning command is treated as a
temporary bootstrap credential. That session can reach only Settings;
every other administration route redirects there until a new 12–128 character
password is set after confirming the current password. The known bootstrap
password cannot be selected as the replacement. Password changes revoke older
sessions, rotate the current browser session, and write an audit record.

The command verifies the maintenance database connection, creates or rotates the
`admin` account, revokes its prior sessions, and writes an audit record.
It refuses to convert an existing participant account into an administrator.
The output never includes the password or password hash.

Administrator login is at `/en/admin/login` or `/ar/admin/login`. Participant
credentials receive the same generic invalid-credentials response there and
cannot cross the server-side role boundary.
