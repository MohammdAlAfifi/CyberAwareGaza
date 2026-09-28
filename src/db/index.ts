import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/src/db/schema";
import { buildRuntimePoolConfig } from "@/src/db/pool-config";
import { env } from "@/src/lib/env";

const globalForDb = globalThis as unknown as { cyberAwareDbPool?: Pool };

const pool =
  globalForDb.cyberAwareDbPool ??
  new Pool(buildRuntimePoolConfig(env.DATABASE_URL, env.SUPABASE_CA_CERT_PATH));

if (process.env.NODE_ENV !== "production") {
  globalForDb.cyberAwareDbPool = pool;
}

export const db = drizzle({ client: pool, schema });
