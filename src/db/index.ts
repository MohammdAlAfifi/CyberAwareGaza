import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/src/lib/env";
import * as schema from "@/src/db/schema";

const globalForDb = globalThis as unknown as { sqlClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.sqlClient ??
  postgres(env.DATABASE_URL, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10
  });

if (process.env.NODE_ENV !== "production") globalForDb.sqlClient = client;

export const db = drizzle(client, { schema });
