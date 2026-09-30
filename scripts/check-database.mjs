import { randomUUID } from "node:crypto";

import {
  assertDatabaseTargetsMatch,
  createMaintenancePool,
  createRuntimeCheckPool,
  expectedTables,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const missingVariables = ["DIRECT_DATABASE_URL", "DATABASE_URL"].filter(
  (name) => !process.env[name],
);
if (missingVariables.length > 0) {
  throw new Error(
    `Missing required database variables: ${missingVariables.join(", ")}`,
  );
}

const pool = createMaintenancePool({ max: 4 });
const runtimePool = createRuntimeCheckPool();
const checkCounterKey = `check_${randomUUID().replaceAll("-", "").slice(0, 24)}`;

try {
  assertDatabaseTargetsMatch();
  const maintenanceTarget = await verifyDatabaseConnection(
    pool,
    "DIRECT_DATABASE_URL",
  );
  const runtimeTarget = await verifyDatabaseConnection(
    runtimePool,
    "DATABASE_URL",
  );

  const tableResult = await pool.query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])`,
    [expectedTables],
  );
  const foundTables = new Set(tableResult.rows.map((row) => row.table_name));
  const missingTables = expectedTables.filter(
    (table) => !foundTables.has(table),
  );
  if (missingTables.length > 0) {
    throw new Error(`Missing migrated tables: ${missingTables.join(", ")}`);
  }

  const rlsResult = await pool.query(
    `select c.relname as table_name
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any($1::text[])
        and c.relkind = 'r'
        and not c.relrowsecurity`,
    [expectedTables],
  );
  if (rlsResult.rows.length > 0) {
    throw new Error(
      `RLS is not enabled for: ${rlsResult.rows.map((row) => row.table_name).join(", ")}`,
    );
  }

  const seedResult = await pool.query(
    `select key, value from counters
      where key in ('participant_public_code', 'anonymous_ordinal')`,
  );
  if (seedResult.rows.length !== 2) {
    throw new Error("Foundation counters are missing; run pnpm db:seed");
  }

  const contentResult = await pool.query(
    `select cv.id,
            count(distinct s.key)::integer as scenario_count,
            count(o.id)::integer as option_count
       from content_versions cv
       left join scenarios s on s.content_version_id = cv.id
       left join options o
         on o.content_version_id = s.content_version_id
        and o.scenario_key = s.key
      where cv.id = 'pdf-section-7-v1'
        and cv.is_active = true
      group by cv.id`,
  );
  const content = contentResult.rows[0];
  if (!content || content.scenario_count !== 8 || content.option_count !== 25) {
    throw new Error(
      "Phase 4 content seed must contain 8 scenarios and 25 options",
    );
  }

  const allocations = await Promise.all(
    Array.from({ length: 12 }, async () => {
      const result = await pool.query(
        `insert into counters (key, value)
         values ($1, 1)
         on conflict (key) do update set value = counters.value + 1
         returning value`,
        [checkCounterKey],
      );
      return result.rows[0].value;
    }),
  );
  allocations.sort((left, right) => left - right);
  const expected = Array.from({ length: 12 }, (_, index) => index + 1);
  if (allocations.some((value, index) => value !== expected[index])) {
    throw new Error(
      `Counter concurrency check failed: ${allocations.join(", ")}`,
    );
  }

  console.log(
    `Database check passed via ${formatVerifiedTarget(maintenanceTarget)} and ${formatVerifiedTarget(runtimeTarget)}: ${expectedTables.length} tables, RLS enabled, 8 scenarios/25 options present, foundation seed present, and 12 atomic counter allocations.`,
  );
} finally {
  await pool
    .query("delete from counters where key = $1", [checkCounterKey])
    .catch(() => undefined);
  await pool.end();
  await runtimePool.end();
}
