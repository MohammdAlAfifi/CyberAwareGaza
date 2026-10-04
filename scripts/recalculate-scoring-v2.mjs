import { readFileSync } from "node:fs";

import {
  createMaintenancePool,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const TARGET_RUBRIC = "cyberawaregaza-safe-decisions-v2";
const previousRubric = JSON.parse(
  readFileSync(
    new URL("../src/scoring/rubric-v1.json", import.meta.url),
    "utf8",
  ),
);
const conversion = new Map([
  [-10, 0],
  [-8, 2],
  [2, 4],
  [4, 6],
  [6, 6],
  [8, 8],
  [10, 10],
]);
const ruleByAnswer = new Map(
  previousRubric.entries.map((entry) => [
    `${entry.scenarioKey}:${entry.optionId}`,
    entry.optionId === "S4O2" ? 8 : conversion.get(entry.contribution),
  ]),
);

const apply = process.argv.includes("--apply");
const pool = createMaintenancePool();
let client;

try {
  const target = await verifyDatabaseConnection(pool, "DIRECT_DATABASE_URL");
  client = await pool.connect();
  const percentageColumn = await client.query(
    `select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'assessment_attempts'
        and column_name = 'score_percentage'`,
  );
  const previousPercentage = percentageColumn.rowCount
    ? "aa.score_percentage"
    : "null::numeric";
  const attempts = await client.query(
    `select aa.id, aa.rubric_version_id, aa.total_score, ${previousPercentage} as score_percentage, aa.risk,
            json_agg(json_build_object('scenarioKey', r.scenario_key, 'optionId', r.selected_option_id)
              order by r.scenario_key) as answers
       from assessment_attempts aa
       left join responses r on r.attempt_id = aa.id
      where aa.status = 'completed' and aa.rubric_version_id <> $1
      group by aa.id
      order by aa.id`,
    [TARGET_RUBRIC],
  );

  const supported = [];
  const unsupported = [];
  for (const row of attempts.rows) {
    const answers = row.answers.filter((answer) => answer.scenarioKey !== null);
    const keys = new Set(answers.map((answer) => answer.scenarioKey));
    const mapped = answers.map((answer) => ({
      ...answer,
      contribution: ruleByAnswer.get(
        `${answer.scenarioKey}:${answer.optionId}`,
      ),
    }));
    if (
      answers.length !== 8 ||
      keys.size !== 8 ||
      mapped.some(({ contribution }) => contribution === undefined)
    ) {
      unsupported.push({ id: row.id, responseCount: answers.length });
      continue;
    }
    const totalScore = mapped.reduce(
      (sum, answer) => sum + answer.contribution,
      0,
    );
    const percentage = totalScore * 1.25;
    const risk =
      percentage <= 50 ? "high" : percentage <= 70 ? "medium" : "low";
    supported.push({ row, mapped, totalScore, percentage, risk });
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "preview",
        database: formatVerifiedTarget(target),
        targetRubric: TARGET_RUBRIC,
        candidates: attempts.rowCount,
        supported: supported.length,
        unsupported,
        changes: supported.map(({ row, totalScore, percentage, risk }) => ({
          attemptId: row.id,
          fromRubric: row.rubric_version_id,
          previousTotalScore: row.total_score,
          previousPercentage: row.score_percentage,
          previousRisk: row.risk,
          revisedTotalScore: totalScore,
          revisedPercentage: percentage,
          revisedRisk: risk,
        })),
      },
      null,
      2,
    ),
  );

  if (!apply) process.exitCode = unsupported.length ? 2 : 0;
  else {
    if (unsupported.length) {
      throw new Error(
        "Unsupported completed assessments were found; nothing was updated.",
      );
    }
    await client.query("begin");
    const installed = await client.query(
      `select 1 from rubric_versions where id = $1 and is_active = true and minimum_score = 0 and maximum_score = 80`,
      [TARGET_RUBRIC],
    );
    if (installed.rowCount !== 1)
      throw new Error("The active v2 rubric is not installed.");

    for (const item of supported) {
      await client.query(
        "select id from assessment_attempts where id = $1 for update",
        [item.row.id],
      );
      const inserted = await client.query(
        `insert into scoring_revision_audit
           (attempt_id, from_rubric_version_id, to_rubric_version_id,
            previous_total_score, previous_percentage, previous_risk,
            revised_total_score, revised_percentage, revised_risk)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (attempt_id, to_rubric_version_id) do nothing
         returning id`,
        [
          item.row.id,
          item.row.rubric_version_id,
          TARGET_RUBRIC,
          item.row.total_score,
          item.row.score_percentage,
          item.row.risk,
          item.totalScore,
          item.percentage,
          item.risk,
        ],
      );
      if (inserted.rowCount !== 1) continue;
      for (const answer of item.mapped) {
        await client.query(
          `update responses set contribution = $1, feedback_key = $2
            where attempt_id = $3 and scenario_key = $4 and selected_option_id = $5`,
          [
            answer.contribution,
            `${TARGET_RUBRIC}:${answer.scenarioKey}:${answer.optionId}`,
            item.row.id,
            answer.scenarioKey,
            answer.optionId,
          ],
        );
      }
      await client.query(
        `update assessment_attempts
            set rubric_version_id = $1, total_score = $2, score_percentage = $3,
                risk = $4, updated_at = now()
          where id = $5 and rubric_version_id <> $1`,
        [
          TARGET_RUBRIC,
          item.totalScore,
          item.percentage,
          item.risk,
          item.row.id,
        ],
      );
    }
    await client.query("commit");
    console.log(
      `Updated ${supported.length} supported assessments transactionally.`,
    );
  }
} catch (error) {
  if (apply && client) await client.query("rollback").catch(() => {});
  throw error;
} finally {
  client?.release();
  await pool.end();
}
