import {
  createMaintenancePool,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const pool = createMaintenancePool();
let client;

try {
  const target = await verifyDatabaseConnection(pool, "DIRECT_DATABASE_URL");
  client = await pool.connect();
  await client.query("begin");
  await client.query(
    `insert into counters (key, value)
     values ('participant_public_code', 0), ('anonymous_ordinal', 0)
     on conflict (key) do nothing`,
  );
  await client.query("commit");
  console.log(
    `Seeded foundation counters via ${formatVerifiedTarget(target)}; no scenario, rubric, or research data was inserted.`,
  );
} catch (error) {
  if (client) await client.query("rollback");
  throw error;
} finally {
  client?.release();
  await pool.end();
}
