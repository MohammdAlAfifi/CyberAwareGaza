import { randomUUID } from "node:crypto";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { buildRuntimePoolConfig } from "@/src/db/pool-config";
import * as schema from "@/src/db/schema";
import type { SessionActor } from "@/src/auth/sessions";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  db: undefined as unknown as NodePgDatabase<typeof schema>,
}));
vi.mock("@/src/db", () => ({
  get db() {
    return state.db;
  },
}));

import { getAnalyticsDashboard } from "./analytics-service";
import {
  FEEDBACK_COMMENTS_LIMIT,
  getFeedbackAnalytics,
  getFeedbackCount,
} from "./feedback-analytics";

const admin = { kind: "admin", mustChangePassword: false } as SessionActor;

describe.skipIf(!process.env.DIRECT_DATABASE_URL)(
  "isolated admin feedback analytics",
  () => {
    let pool: Pool;
    let client: PoolClient;
    let ordinal = 900000;
    const shadowTables = [
      "accounts",
      "participants",
      "assessment_attempts",
      "consents",
      "assessment_feedback",
    ];

    beforeAll(async () => {
      pool = new Pool({
        ...buildRuntimePoolConfig(
          process.env.DIRECT_DATABASE_URL!,
          process.env.SUPABASE_CA_CERT_PATH,
        ),
        max: 1,
      });
      client = await pool.connect();
      state.db = drizzle({ client, schema });
      // Read the actual configured database before shadowing any tables. No writes.
      await client.query("begin isolation level repeatable read read only");
      try {
        const actual = await client.query(
          "select count(*)::integer total from public.assessment_feedback where consent=true",
        );
        expect(await getFeedbackCount(admin)).toBe(actual.rows[0].total);
      } finally {
        await client.query("rollback");
      }
      // Exercise the complete production query against real stored responses,
      // including its own read-only snapshot, before installing isolated fixtures.
      const actualAnalytics = await getFeedbackAnalytics(admin);
      expect(actualAnalytics.questions).toHaveLength(5);
      for (const question of actualAnalytics.questions) {
        expect(question.validCount).toBe(actualAnalytics.total);
        expect(
          question.distribution.reduce((sum, item) => sum + item.count, 0),
        ).toBe(actualAnalytics.total);
      }
      expect(actualAnalytics.technical.validCount).toBe(actualAnalytics.total);
      for (const table of shadowTables) {
        await client.query(
          `create temporary table ${table} (like public.${table} including all)`,
        );
        const result = await client.query(
          "select to_regclass($1)=to_regclass($2) isolated",
          [table, `pg_temp.${table}`],
        );
        if (!result.rows[0].isolated)
          throw new Error("Temporary database isolation failed");
      }
      await client.query("set default_transaction_read_only=on");
    }, 30_000);

    beforeEach(async () => {
      // Each target is explicitly session-local; persistent writes remain forbidden.
      await client.query(
        "delete from pg_temp.assessment_feedback; delete from pg_temp.consents; delete from pg_temp.assessment_attempts; delete from pg_temp.participants; delete from pg_temp.accounts",
      );
    });
    afterAll(async () => {
      client?.release();
      await pool?.end();
    });

    async function participant(registered = false) {
      const id = randomUUID();
      const number = ++ordinal;
      const accountId = registered ? randomUUID() : null;
      if (accountId)
        await client.query(
          "insert into pg_temp.accounts (id,username,normalized_username,password_hash) values ($1,$2,$2,'test-only')",
          [accountId, `feedback_${number}`],
        );
      await client.query(
        "insert into pg_temp.participants (id,public_code,account_id,type,anonymous_ordinal,source) values ($1,$2,$3,$4,$5,'web')",
        [
          id,
          `CAG-${number}`,
          accountId,
          registered ? "registered" : "anonymous",
          registered ? null : number,
        ],
      );
      return id;
    }

    async function attempt(participantId: string, complete = true) {
      const id = randomUUID();
      await client.query(
        `insert into pg_temp.assessment_attempts
      (id,participant_id,status,source,content_version_id,rubric_version_id,total_score,score_percentage,risk,completed_at)
      values ($1,$2,$3,'web','feedback-test','feedback-test',10,50,'medium',$4)`,
        [
          id,
          participantId,
          complete ? "completed" : "in_progress",
          complete ? new Date() : null,
        ],
      );
      await client.query(
        "insert into pg_temp.consents (participant_id,attempt_id,decision,consent_version,source) values ($1,$2,true,'test','web')",
        [participantId, id],
      );
      return id;
    }

    async function feedback(
      participantId: string,
      ratings: number[],
      technical = false,
      comments: string | null = null,
    ) {
      const attemptId = await attempt(participantId);
      await client.query(
        `insert into pg_temp.assessment_feedback
      (attempt_id,participant_id,navigation_rating,scenario_clarity_rating,interaction_rating,readability_rating,satisfaction_rating,technical_problem,comments,consent,language)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,'en')`,
        [attemptId, participantId, ...ratings, technical, comments],
      );
    }

    it("distinguishes an empty database and zero denominators", async () => {
      const result = await getFeedbackAnalytics(admin);
      expect(await getFeedbackCount(admin)).toBe(0);
      expect(result.total).toBe(0);
      expect(result.responseRate).toBeNull();
      expect(
        result.questions.every(
          (question) => question.validCount === 0 && question.mean === null,
        ),
      ).toBe(true);
      expect(result.technical).toEqual({
        validCount: 0,
        yes: { count: 0, percentage: null },
        no: { count: 0, percentage: null },
      });
      expect(result.comments).toEqual([]);
    });

    it("computes one submission with optional comments absent", async () => {
      await feedback(await participant(), [1, 2, 3, 4, 5]);
      const result = await getFeedbackAnalytics(admin);
      expect(await getFeedbackCount(admin)).toBe(1);
      expect(result.total).toBe(1);
      expect(result.responseRate).toBe(100);
      expect(result.questions.map((question) => question.mean)).toEqual([
        1, 2, 3, 4, 5,
      ]);
      expect(
        result.questions.every((question) => question.validCount === 1),
      ).toBe(true);
      expect(result.technical.no).toEqual({ count: 1, percentage: 100 });
      expect(result.writtenComments).toBe(0);
      expect(result.comments).toEqual([]);
    }, 30_000);

    it("aggregates all registered and anonymous submissions per assessment, excludes skips, and preserves existing dashboard metrics", async () => {
      const registered = await participant(true);
      const anonymous = await participant();
      // Record the assessment-only dashboard before feedback inserts.
      const attemptIds = [];
      for (const owner of [registered, registered, anonymous, anonymous])
        attemptIds.push(await attempt(owner));
      await attempt(anonymous, false);
      const before = await getAnalyticsDashboard(admin, "all");
      const ratings = [
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1],
        [5, 3, 4, 5, 4],
      ];
      for (let index = 0; index < 3; index++)
        await client.query(
          `insert into pg_temp.assessment_feedback
      (attempt_id,participant_id,navigation_rating,scenario_clarity_rating,interaction_rating,readability_rating,satisfaction_rating,technical_problem,comments,consent,language)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10)`,
          [
            attemptIds[index],
            index === 2 ? anonymous : registered,
            ...ratings[index],
            index === 0,
            index === 0
              ? "<script>ملاحظة حقيقية في الاختبار</script>"
              : index === 1
                ? null
                : "  ",
            index === 2 ? "ar" : "en",
          ],
        );
      const result = await getFeedbackAnalytics(admin);
      expect(await getFeedbackCount(admin)).toBe(3);
      expect(result.total).toBe(3);
      expect(result.completedAssessments).toBe(4);
      expect(result.responseRate).toBe(75);
      const expectedCounts = [
        [1, 0, 0, 0, 2],
        [0, 1, 1, 1, 0],
        [0, 0, 2, 1, 0],
        [0, 1, 0, 1, 1],
        [1, 0, 0, 1, 1],
      ];
      for (const [index, question] of result.questions.entries()) {
        expect(question.validCount).toBe(3);
        expect(question.distribution.map((answer) => answer.count)).toEqual(
          expectedCounts[index],
        );
        expect(question.mean).toBeCloseTo(
          ratings.reduce((sum, row) => sum + row[index], 0) / 3,
        );
        for (const answer of question.distribution)
          expect(answer.percentage).toBeCloseTo(
            (expectedCounts[index][answer.rating - 1] / 3) * 100,
          );
      }
      expect(result.technical.validCount).toBe(3);
      expect(result.technical.yes.count).toBe(1);
      expect(result.technical.yes.percentage).toBeCloseTo(100 / 3);
      expect(result.technical.no.count).toBe(2);
      expect(result.technical.no.percentage).toBeCloseTo(200 / 3);
      expect(result.writtenComments).toBe(1);
      expect(result.comments).toHaveLength(1);
      expect(Object.keys(result.comments[0]).sort()).toEqual(
        [
          "id",
          "publicCode",
          "submittedAt",
          "satisfactionRating",
          "technicalProblem",
          "comments",
        ].sort(),
      );
      expect(await getAnalyticsDashboard(admin, "all")).toEqual(before);
    }, 30_000);

    it("bounds written comment rows without truncating the aggregate denominator", async () => {
      const owner = await participant();
      await client.query(
        `insert into pg_temp.assessment_attempts
        (participant_id,status,source,content_version_id,rubric_version_id,total_score,score_percentage,risk,completed_at)
        select $1,'completed','web','feedback-test','feedback-test',10,50,'medium',now() from generate_series(1,$2)`,
        [owner, FEEDBACK_COMMENTS_LIMIT + 1],
      );
      await client.query(
        `insert into pg_temp.consents (participant_id,attempt_id,decision,consent_version,source)
        select participant_id,id,true,'test','web' from pg_temp.assessment_attempts where participant_id=$1`,
        [owner],
      );
      await client.query(
        `insert into pg_temp.assessment_feedback
        (attempt_id,participant_id,navigation_rating,scenario_clarity_rating,interaction_rating,readability_rating,satisfaction_rating,technical_problem,comments,consent,language)
        select id,participant_id,5,5,5,5,5,false,'Isolated comment ' || id,true,'en' from pg_temp.assessment_attempts where participant_id=$1`,
        [owner],
      );
      const result = await getFeedbackAnalytics(admin);
      expect(result.total).toBe(FEEDBACK_COMMENTS_LIMIT + 1);
      expect(
        result.questions.every(
          (question) => question.validCount === FEEDBACK_COMMENTS_LIMIT + 1,
        ),
      ).toBe(true);
      expect(result.comments).toHaveLength(FEEDBACK_COMMENTS_LIMIT);
      expect(result.writtenComments).toBe(FEEDBACK_COMMENTS_LIMIT + 1);
    }, 30_000);
  },
);
