import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";

import type { PoolConfig } from "pg";

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const CONNECTION_STRING_SSL_OPTIONS = [
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
] as const;

export function buildRuntimePoolConfig(
  connectionString: string,
  caCertificatePath?: string,
): PoolConfig {
  const url = new URL(connectionString);

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(
      "DATABASE_URL must use the postgres or postgresql protocol",
    );
  }

  const conflictingOption = CONNECTION_STRING_SSL_OPTIONS.find((option) =>
    url.searchParams.has(option),
  );
  if (conflictingOption) {
    throw new Error(
      `DATABASE_URL must not contain ${conflictingOption}; TLS verification is configured by the database client`,
    );
  }

  const isLocal = LOCAL_DATABASE_HOSTS.has(url.hostname);
  const ssl = isLocal
    ? false
    : {
        rejectUnauthorized: true,
        ...(caCertificatePath
          ? { ca: readAndValidateCaCertificate(caCertificatePath) }
          : {}),
      };

  return {
    connectionString,
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    application_name: "cyberawaregaza-web",
    ssl,
  };
}

function readAndValidateCaCertificate(path: string): Buffer {
  let certificate: Buffer;
  try {
    certificate = readFileSync(path);
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

  return certificate;
}
