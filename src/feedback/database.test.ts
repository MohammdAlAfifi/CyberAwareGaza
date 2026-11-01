import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  assessmentScenarios,
  ASSESSMENT_CONTENT_VERSION,
} from "@/src/assessment/content";
import { buildRuntimePoolConfig } from "@/src/db/pool-config";
import * as schema from "@/src/db/schema";
import { RUBRIC_VERSION } from "@/src/scoring/rubric";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  db: undefined as unknown as NodePgDatabase<typeof schema>,
}));
vi.mock("@/src/db", () => ({
  get db() {
    return state.db;
  },
}));

import { hasAssessmentFeedback, submitAssessmentFeedback } from "./service";
import {
  finalizeAssessment,
  ownsCompletedAssessment,
} from "@/src/assessment/service";
import { getParticipantResult } from "@/src/results/service";

// All writes target verified session-local tables. Read-only transactions protect
// the configured database even if a query accidentally stops using a shadow table.
describe.skipIf(!process.env.DIRECT_DATABASE_URL)(
  "isolated feedback persistence",
  () => {
    let pool: Pool;
    let client: PoolClient;
    const participantId = randomUUID();
    const input = (attemptId: string) => ({
      attemptId,
      navigationRating: 1,
      scenarioClarityRating: 2,
      interactionRating: 3,
      readabilityRating: 4,
      satisfactionRating: 5,
      technicalProblem: true,
      comments: "  ملاحظات مفيدة  ",
      consent: true,
      language: "ar",
    });

    beforeAll(async () => {
      pool = new Pool({
        ...buildRuntimePoolConfig(
          process.env.DIRECT_DATABASE_URL!,
          process.env.SUPABASE_CA_CERT_PATH,
        ),
        max: 1,
      });
      client = await pool.connect();
      const shadowTables = [
        "accounts",
        "participants",
        "assessment_attempts",
        "consents",
        "assessment_draft_answers",
        "responses",
      ];
      for (const table of shadowTables) {
        await client.query(
          `create temporary table ${table} (like public.${table} including all)`,
        );
      }
      const migration = readFileSync(
        "drizzle/0008_assessment_feedback.sql",
        "utf8",
      ).replace(
        'CREATE TABLE "assessment_feedback"',
        'CREATE TEMPORARY TABLE "assessment_feedback"',
      );
      await client.query(migration);
      for (const table of [...shadowTables, "assessment_feedback"]) {
        const result = await client.query(
          "select to_regclass($1) = to_regclass($2) isolated",
          [table, `pg_temp.${table}`],
        );
        if (!result.rows[0].isolated)
          throw new Error("Temporary database isolation failed");
      }
      await client.query(`create function pg_temp.reject_test_feedback() returns trigger language plpgsql as $$
        begin
          if new.comments = 'simulate database failure' then raise exception 'simulated storage failure'; end if;
          return new;
        end $$;
        create trigger reject_test_feedback before insert on pg_temp.assessment_feedback
        for each row execute function pg_temp.reject_test_feedback()`);
      await client.query("set default_transaction_read_only = on");
      state.db = drizzle({ client, schema });
    }, 30_000);

    afterAll(async () => {
      client?.release();
      await pool?.end();
    });

    async function attempt(
      completed = true,
      consent = true,
      ownerId = participantId,
    ) {
      const id = randomUUID();
      await client.query(
        `insert into pg_temp.assessment_attempts
      (id, participant_id, status, source, content_version_id, rubric_version_id, total_score, score_percentage, risk, completed_at)
      values ($1,$2,$3,'web','feedback-test','feedback-test',10,50,'medium',$4)`,
        [
          id,
          ownerId,
          completed ? "completed" : "in_progress",
          completed ? new Date() : null,
        ],
      );
      if (consent)
        await client.query(
          `insert into pg_temp.consents (participant_id,attempt_id,decision,consent_version,source) values ($1,$2,true,'feedback-test','web')`,
          [ownerId, id],
        );
      return id;
    }

    it("stores every answer, consent timestamps and language without changing assessment results", async () => {
      const id = await attempt();
      const before = await client.query(
        "select * from pg_temp.assessment_attempts where id=$1",
        [id],
      );
      expect(await hasAssessmentFeedback(participantId, id)).toBe(false);
      await submitAssessmentFeedback(participantId, input(id));
      const result = await client.query(
        "select * from pg_temp.assessment_feedback where attempt_id=$1",
        [id],
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        participant_id: participantId,
        navigation_rating: 1,
        scenario_clarity_rating: 2,
        interaction_rating: 3,
        readability_rating: 4,
        satisfaction_rating: 5,
        technical_problem: true,
        comments: "ملاحظات مفيدة",
        consent: true,
        language: "ar",
      });
      expect(result.rows[0].id).toBeTruthy();
      expect(result.rows[0].consented_at).toBeInstanceOf(Date);
      expect(result.rows[0].submitted_at).toBeInstanceOf(Date);
      expect(await hasAssessmentFeedback(participantId, id)).toBe(true);
      expect(await hasAssessmentFeedback(randomUUID(), id)).toBe(false);
      expect(
        (
          await client.query(
            "select * from pg_temp.assessment_attempts where id=$1",
            [id],
          )
        ).rows,
      ).toEqual(before.rows);
    });

    it("handles repeated calls and enforces uniqueness without replacing the first submission", async () => {
      const id = await attempt();
      await submitAssessmentFeedback(participantId, input(id));
      const before = await client.query(
        "select * from pg_temp.assessment_feedback where attempt_id=$1",
        [id],
      );
      for (let retry = 0; retry < 3; retry++)
        await submitAssessmentFeedback(participantId, {
          ...input(id),
          navigationRating: 5,
          comments: "replacement",
          language: "en",
        });
      expect(
        (
          await client.query(
            "select * from pg_temp.assessment_feedback where attempt_id=$1",
            [id],
          )
        ).rows,
      ).toEqual(before.rows);
      // PostgreSQL's unique constraint is the final guard even outside the service.
      await expect(
        client.query(
          `insert into pg_temp.assessment_feedback select * from pg_temp.assessment_feedback where attempt_id=$1`,
          [id],
        ),
      ).rejects.toMatchObject({ code: "23505" });
    });

    it("rejects non-owners, incomplete, missing, and non-consenting attempts", async () => {
      const id = await attempt();
      await expect(
        submitAssessmentFeedback(randomUUID(), input(id)),
      ).rejects.toMatchObject({ code: "attempt_not_found" });
      for (const invalidId of [
        await attempt(false),
        await attempt(true, false),
        randomUUID(),
      ]) {
        await expect(
          submitAssessmentFeedback(participantId, input(invalidId)),
        ).rejects.toMatchObject({ code: "attempt_not_found" });
      }
      for (const change of [
        { consent: false },
        { navigationRating: 6 },
        { comments: "x".repeat(2001) },
      ]) {
        await expect(
          submitAssessmentFeedback(participantId, { ...input(id), ...change }),
        ).rejects.toMatchObject({ code: "invalid_input" });
      }
      expect(await hasAssessmentFeedback(participantId, id)).toBe(false);
    });

    it("enforces actual migration foreign keys, integer ranges, consent and language", async () => {
      const id = await attempt();
      const insert = (
        participant: string,
        rating: number,
        consent: boolean,
        language: string,
        comments: string | null = null,
      ) =>
        client.query(
          `insert into pg_temp.assessment_feedback
      (attempt_id,participant_id,navigation_rating,scenario_clarity_rating,interaction_rating,readability_rating,satisfaction_rating,technical_problem,consent,language,comments)
      values ($1,$2,$3,2,3,4,5,false,$4,$5,$6)`,
          [id, participant, rating, consent, language, comments],
        );
      await expect(insert(randomUUID(), 1, true, "en")).rejects.toMatchObject({
        code: "23503",
      });
      await expect(insert(participantId, 0, true, "en")).rejects.toMatchObject({
        code: "23514",
      });
      await expect(insert(participantId, 6, true, "en")).rejects.toMatchObject({
        code: "23514",
      });
      await expect(insert(participantId, 1, false, "en")).rejects.toMatchObject(
        { code: "23514" },
      );
      await expect(insert(participantId, 1, true, "fr")).rejects.toMatchObject({
        code: "23514",
      });
      await expect(
        insert(participantId, 1, true, "en", "x".repeat(2001)),
      ).rejects.toMatchObject({ code: "22001" });
      await submitAssessmentFeedback(participantId, {
        ...input(id),
        technicalProblem: false,
        comments: "",
        language: "en",
      });
      const result = await client.query(
        "select technical_problem,comments,language from pg_temp.assessment_feedback where attempt_id=$1",
        [id],
      );
      expect(result.rows[0]).toEqual({
        technical_problem: false,
        comments: null,
        language: "en",
      });
    });

    it("keeps existing completion and detailed results intact through a failed save and retry", async () => {
      const flowParticipantId = randomUUID();
      await client.query(
        `insert into pg_temp.participants (id,public_code,type,anonymous_ordinal,source)
        values ($1,'CAG-99999999','anonymous',99999999,'web')`,
        [flowParticipantId],
      );
      const id = await attempt(false, true, flowParticipantId);
      await client.query(
        `update pg_temp.assessment_attempts set content_version_id=$2, rubric_version_id=$3 where id=$1`,
        [id, ASSESSMENT_CONTENT_VERSION, RUBRIC_VERSION],
      );
      for (const scenario of assessmentScenarios) {
        await client.query(
          `insert into pg_temp.assessment_draft_answers (attempt_id,content_version_id,scenario_key,selected_option_id)
          values ($1,$2,$3,$4)`,
          [
            id,
            ASSESSMENT_CONTENT_VERSION,
            scenario.key,
            scenario.options[0].id,
          ],
        );
      }
      expect(await ownsCompletedAssessment(flowParticipantId, id)).toBe(false);
      const completion = await finalizeAssessment({
        participantId: flowParticipantId,
        attemptId: id,
      });
      expect(completion.completed).toBe(true);
      expect(await ownsCompletedAssessment(flowParticipantId, id)).toBe(true);
      const result = await getParticipantResult(flowParticipantId, id);
      expect(result?.responses).toHaveLength(8);
      expect(result?.percentage).toBe(completion.percentage);
      const attemptBefore = await client.query(
        "select * from pg_temp.assessment_attempts where id=$1",
        [id],
      );
      await expect(
        submitAssessmentFeedback(flowParticipantId, {
          ...input(id),
          comments: "simulate database failure",
        }),
      ).rejects.toThrow();
      expect(await hasAssessmentFeedback(flowParticipantId, id)).toBe(false);
      expect(await getParticipantResult(flowParticipantId, id)).toEqual(result);
      expect(
        (
          await client.query(
            "select * from pg_temp.assessment_attempts where id=$1",
            [id],
          )
        ).rows,
      ).toEqual(attemptBefore.rows);
      await submitAssessmentFeedback(flowParticipantId, input(id));
      expect(await getParticipantResult(flowParticipantId, id)).toEqual(result);
      expect(
        await finalizeAssessment({
          participantId: flowParticipantId,
          attemptId: id,
        }),
      ).toEqual(completion);
      expect(await getParticipantResult(randomUUID(), id)).toBeNull();
    }, 30_000);
  },
);
