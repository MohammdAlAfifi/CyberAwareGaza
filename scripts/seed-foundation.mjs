import { readFileSync } from "node:fs";

import {
  createMaintenancePool,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const rubric = JSON.parse(
  readFileSync(
    new URL("../src/scoring/rubric-v1.json", import.meta.url),
    "utf8",
  ),
);

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
  const content = await client.query(
    `select id from content_versions where id = $1 and is_active = true`,
    [rubric.contentVersionId],
  );
  if (content.rowCount !== 1) {
    throw new Error(
      `Active content version ${rubric.contentVersionId} must be installed before the Phase 5 rubric can be seeded.`,
    );
  }
  await client.query(
    `update rubric_versions set is_active = false where is_active = true and id <> $1`,
    [rubric.id],
  );
  await client.query(
    `insert into rubric_versions
       (id, content_version_id, label, is_active, minimum_score, maximum_score, approved_at)
     values ($1, $2, $3, true, $4, $5, now())
     on conflict (id) do update set
       label = excluded.label,
       is_active = true,
       minimum_score = excluded.minimum_score,
       maximum_score = excluded.maximum_score,
       approved_at = coalesce(rubric_versions.approved_at, excluded.approved_at)`,
    [
      rubric.id,
      rubric.contentVersionId,
      rubric.label,
      rubric.minimumScore,
      rubric.maximumScore,
    ],
  );
  for (const entry of rubric.entries) {
    await client.query(
      `insert into rubric_entries
         (rubric_version_id, content_version_id, scenario_key, option_id, contribution, feedback_en, feedback_ar)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (rubric_version_id, scenario_key, option_id) do update set
         contribution = excluded.contribution,
         feedback_en = excluded.feedback_en,
         feedback_ar = excluded.feedback_ar`,
      [
        rubric.id,
        rubric.contentVersionId,
        entry.scenarioKey,
        entry.optionId,
        entry.contribution,
        `${entry.explanation.en}\n\n${entry.guidance.en}`,
        `${entry.explanation.ar}\n\n${entry.guidance.ar}`,
      ],
    );
  }
  await client.query("commit");
  console.log(
    `Seeded foundation counters and rubric ${rubric.id} (${rubric.entries.length} rules) via ${formatVerifiedTarget(target)}; no research response data was inserted.`,
  );
} catch (error) {
  if (client) await client.query("rollback");
  throw error;
} finally {
  client?.release();
  await pool.end();
}
