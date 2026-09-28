import { describe, expect, it } from "vitest";

import { buildRuntimePoolConfig } from "./pool-config";

describe("buildRuntimePoolConfig", () => {
  it("uses one TLS-protected connection for a hosted database", () => {
    const config = buildRuntimePoolConfig(
      "postgresql://user:password@example.pooler.supabase.com:6543/postgres",
    );

    expect(config.max).toBe(1);
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
    expect(config.application_name).toBe("cyberawaregaza-web");
  });

  it("allows plaintext only for a local development database", () => {
    const config = buildRuntimePoolConfig(
      "postgresql://postgres:postgres@localhost:5432/postgres",
    );

    expect(config.ssl).toBe(false);
  });

  it("rejects non-PostgreSQL URLs", () => {
    expect(() =>
      buildRuntimePoolConfig("https://example.com/database"),
    ).toThrow("DATABASE_URL must use the postgres or postgresql protocol");
  });

  it("rejects connection-string SSL options that could override client verification", () => {
    expect(() =>
      buildRuntimePoolConfig(
        "postgresql://user:password@example.pooler.supabase.com:6543/postgres?sslmode=require",
      ),
    ).toThrow("DATABASE_URL must not contain sslmode");
  });

  it("requires a full readable certificate filename", () => {
    expect(() =>
      buildRuntimePoolConfig(
        "postgresql://user:password@example.pooler.supabase.com:6543/postgres",
        "missing-certificate-directory",
      ),
    ).toThrow(
      "SUPABASE_CA_CERT_PATH must be the full path to a readable certificate file",
    );
  });
});
