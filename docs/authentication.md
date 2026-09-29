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

There is no public administrator signup. Run this only from a trusted terminal
with the development or production maintenance connection intentionally loaded.
Do not put the password in `.env.local`, shell history, a command argument, or
the repository.

```powershell
$securePassword = Read-Host "New admin password" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $env:ADMIN_USERNAME = "research-admin"
  $env:ADMIN_DISPLAY_NAME = "Research administrator"
  pnpm.cmd run db:provision-admin
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_USERNAME -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_DISPLAY_NAME -ErrorAction SilentlyContinue
}
```

The command verifies the maintenance database connection, creates or rotates an
administrator account, revokes its prior sessions, and writes an audit record.
It refuses to convert an existing participant account into an administrator.
The output never includes the password or password hash.

Administrator login is at `/en/admin/login` or `/ar/admin/login`. Participant
credentials receive the same generic invalid-credentials response there and
cannot cross the server-side role boundary.
