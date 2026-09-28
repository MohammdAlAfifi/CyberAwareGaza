import { createHash, X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";

import { Pool } from "pg";

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const CONNECTION_STRING_SSL_OPTIONS = [
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
];

export const expectedTables = [
  "accounts",
  "admin_audit",
  "assessment_attempts",
  "consents",
  "content_versions",
  "counters",
  "import_batches",
  "import_rows",
  "options",
  "participants",
  "responses",
  "rubric_entries",
  "rubric_versions",
  "scenarios",
  "sessions",
];

export function createMaintenancePool({ max = 1 } = {}) {
  return createPoolFromEnvironment(
    "DIRECT_DATABASE_URL",
    "cyberawaregaza-maintenance",
    max,
  );
}

export function createRuntimeCheckPool() {
  return createPoolFromEnvironment(
    "DATABASE_URL",
    "cyberawaregaza-runtime-check",
    1,
  );
}

export function assertDatabaseTargetsMatch() {
  const maintenance = readDatabaseUrl("DIRECT_DATABASE_URL");
  const runtime = readDatabaseUrl("DATABASE_URL");
  if (
    projectIdentity(maintenance) !== projectIdentity(runtime) ||
    decodeURIComponent(maintenance.pathname) !==
      decodeURIComponent(runtime.pathname)
  ) {
    throw new Error(
      "DATABASE_URL and DIRECT_DATABASE_URL must target the same database project",
    );
  }
}

export async function verifyDatabaseConnection(pool, variableName) {
  const url = readDatabaseUrl(variableName);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `select current_database() as database_name,
              current_setting('server_version') as server_version`,
    );
    const connection = result.rows[0];
    const expectedDatabase = decodeURIComponent(
      url.pathname.replace(/^\//, ""),
    );

    if (connection.database_name !== expectedDatabase) {
      throw new Error(`${variableName} connected to an unexpected database`);
    }

    const isLocal = LOCAL_DATABASE_HOSTS.has(url.hostname);
    const stream = client.connection?.stream;
    if (!isLocal && (!stream?.encrypted || !stream.authorized)) {
      throw new Error(
        `${variableName} did not establish an authorized TLS connection`,
      );
    }

    return {
      variableName,
      host: url.hostname,
      port: url.port || "5432",
      database: connection.database_name,
      projectFingerprint: createHash("sha256")
        .update(projectIdentity(url))
        .digest("hex")
        .slice(0, 12),
      tls: isLocal ? "local plaintext" : (stream.getProtocol?.() ?? "verified"),
      postgres: connection.server_version,
    };
  } finally {
    client.release();
  }
}

export function formatVerifiedTarget(target) {
  return `${target.variableName} ${target.host}:${target.port}/${target.database} (project ${target.projectFingerprint}, TLS ${target.tls}, PostgreSQL ${target.postgres})`;
}

function createPoolFromEnvironment(variableName, applicationName, max) {
  const url = readDatabaseUrl(variableName);
  const connectionString = url.toString();
  const isLocal = LOCAL_DATABASE_HOSTS.has(url.hostname);

  return new Pool({
    connectionString,
    max,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    application_name: applicationName,
    ssl: isLocal ? false : buildVerifiedSslConfig(),
  });
}

function readDatabaseUrl(variableName) {
  const connectionString = process.env[variableName];
  if (!connectionString) {
    throw new Error(`${variableName} is required in .env.local`);
  }

  const url = new URL(connectionString);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(
      `${variableName} must use the postgres or postgresql protocol`,
    );
  }

  const conflictingOption = CONNECTION_STRING_SSL_OPTIONS.find((option) =>
    url.searchParams.has(option),
  );
  if (conflictingOption) {
    throw new Error(
      `${variableName} must not contain ${conflictingOption}; TLS verification is configured by the database client`,
    );
  }

  return url;
}

function projectIdentity(url) {
  const username = decodeURIComponent(url.username);
  if (username.startsWith("postgres.")) {
    return username.slice("postgres.".length);
  }
  if (url.hostname.startsWith("db.") && url.hostname.endsWith(".supabase.co")) {
    return url.hostname.slice(3, -".supabase.co".length);
  }
  return `${username}@${url.hostname}`;
}

function buildVerifiedSslConfig() {
  const certificatePath = process.env.SUPABASE_CA_CERT_PATH?.trim();
  if (!certificatePath) {
    return { rejectUnauthorized: true };
  }

  let certificate;
  try {
    certificate = readFileSync(certificatePath);
  } catch (error) {
    throw new Error(
      "SUPABASE_CA_CERT_PATH must be the full path to a readable certificate file",
      { cause: error },
    );
  }

  try {
    const parsed = new X509Certificate(certificate);
    if (!parsed.ca) {
      throw new Error("Certificate is not marked as a CA");
    }
  } catch (error) {
    throw new Error(
      "SUPABASE_CA_CERT_PATH must point to a valid X.509 CA certificate",
      { cause: error },
    );
  }

  return { rejectUnauthorized: true, ca: certificate };
}
