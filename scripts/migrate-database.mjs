import { readFileSync } from "node:fs";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import {
  createMaintenancePool,
  expectedTables,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const pool = createMaintenancePool();

try {
  const target = await verifyDatabaseConnection(pool, "DIRECT_DATABASE_URL");

  // PostgreSQL requires newly added enum values to be committed before a
  // later statement can use them in a constraint. Drizzle runs each migration
  // inside one transaction, so additive enum changes that are referenced by
  // the same migration must be committed first. These statements are safe to
  // repeat and remain backwards-compatible if the subsequent migration fails.
  await pool.query(
    `alter type "public"."import_row_state" add value if not exists 'invalid' before 'duplicate'`,
  );
  await pool.query(
    `alter type "public"."import_state" add value if not exists 'duplicate' before 'failed'`,
  );

  const db = drizzle({ client: pool });
  await migrate(db, { migrationsFolder: "./drizzle" });

  const journal = JSON.parse(
    readFileSync("./drizzle/meta/_journal.json", "utf8"),
  );
  const migrationResult = await pool.query(
    `select count(*)::integer as count
       from drizzle.__drizzle_migrations`,
  );
  const appliedMigrationCount = migrationResult.rows[0].count;
  if (appliedMigrationCount < journal.entries.length) {
    throw new Error(
      `Migration ledger has ${appliedMigrationCount} entries; expected at least ${journal.entries.length}`,
    );
  }

  const tableResult = await pool.query(
    `select count(*)::integer as count
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])`,
    [expectedTables],
  );
  const migratedTableCount = tableResult.rows[0].count;
  if (migratedTableCount !== expectedTables.length) {
    throw new Error(
      `Migration verification found ${migratedTableCount} of ${expectedTables.length} expected tables`,
    );
  }

  console.log(
    `Migration verified via ${formatVerifiedTarget(target)}: ${appliedMigrationCount} migration ledger entries and ${migratedTableCount} expected tables.`,
  );
} finally {
  await pool.end();
}
