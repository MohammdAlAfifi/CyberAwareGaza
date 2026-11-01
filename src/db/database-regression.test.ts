import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  assessmentScenarios,
  ASSESSMENT_CONTENT_VERSION,
} from "@/src/assessment/content";
import { buildRuntimePoolConfig } from "@/src/db/pool-config";
import * as schema from "@/src/db/schema";
import { HISTORICAL_CONSENT_ACCEPTED } from "@/src/import/historical-csv";
import { calculateAssessmentScore } from "@/src/scoring/risk";
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
vi.mock("@/src/lib/env", () => ({
  env: {
    SESSION_SECRET: "isolated-database-regression-secret",
    REGISTERED_SESSION_DAYS: 30,
  },
}));

import { createAccountSession, getSessionByToken } from "@/src/auth/sessions";
import { createParticipantRecord } from "@/src/db/participant-identities";
import {
  confirmHistoricalImport,
  previewHistoricalImport,
} from "@/src/import/service";
import { getParticipantResult } from "@/src/results/service";

// Opt in with the existing env-file runner. Every mutable table is session-local;
// read-only mode prevents production code from writing any persistent table.
describe.skipIf(!process.env.DIRECT_DATABASE_URL)(
  "isolated database regressions",
  () => {
    let pool: Pool | undefined;
    let client: PoolClient | undefined;
    let accountNumber = 0;

    beforeAll(async () => {
      pool = new Pool({
        ...buildRuntimePoolConfig(
          process.env.DIRECT_DATABASE_URL!,
          process.env.SUPABASE_CA_CERT_PATH,
        ),
        application_name: "cyberawaregaza-isolated-regression",
      });
      client = await pool.connect();
      for (const table of [
        "accounts",
        "participants",
        "sessions",
        "counters",
        "assessment_attempts",
        "consents",
        "responses",
        "import_batches",
        "import_rows",
        "admin_audit",
      ]) {
        await client.query(
          `create temporary table ${table} (like public.${table} including all)`,
        );
        const shadowed = await client.query(
          "select to_regclass($1) = to_regclass($2) as isolated",
          [table, `pg_temp.${table}`],
        );
        if (!shadowed.rows[0].isolated)
          throw new Error("Temporary database isolation failed");
      }
      await client.query("set default_transaction_read_only = on");
      state.db = drizzle({ client, schema });
    }, 30_000);

    afterAll(async () => {
      client?.release();
      await pool?.end(); // Closing the session drops all temporary tables and rows.
    });

    async function account(role: "participant" | "admin" = "participant") {
      const username = `isolated_${++accountNumber}`;
      const [created] = await state.db
        .insert(schema.accounts)
        .values({
          username,
          normalizedUsername: username,
          passwordHash: "test-only",
          role,
        })
        .returning({ id: schema.accounts.id });
      return created;
    }

    it("creates valid registered, anonymous, and imported identities and rejects invalid shapes", async () => {
      const owner = await account();
      const registered = await createParticipantRecord({
        type: "registered",
        accountId: owner.id,
      });
      const anonymous = await createParticipantRecord({ type: "anonymous" });
      const importedInput = {
        type: "imported" as const,
        sourceParticipantKey: "isolated-import",
        importBatchId: randomUUID(),
        sourceRecordNumber: 2,
      };
      const imported = await createParticipantRecord(importedInput);
      expect(registered.anonymousOrdinal).toBeNull();
      expect(registered.accountId === owner.id).toBe(true);
      expect(anonymous.anonymousOrdinal).toBeGreaterThan(0);
      expect(imported.anonymousOrdinal).toBeGreaterThan(
        anonymous.anonymousOrdinal!,
      );
      expect(imported.accountId).toBeNull();
      expect(imported.source).toBe("google_form");
      const fixture = await client!.query(
        "insert into pg_temp.participants (public_code,type,source,source_participant_key,anonymous_ordinal) values ($1,'imported','google_form',$2,$3) returning anonymous_ordinal",
        ["CAG-900003", "phase7-imported-isolated", 900003],
      );
      expect(fixture.rows[0].anonymous_ordinal).toBeGreaterThan(0);
      // This is the exact missing field in the old positive analytics fixture.
      await expect(
        client!.query(
          "insert into pg_temp.participants (public_code,type,source,source_participant_key) values ('CAG-900001','imported','google_form','isolated-invalid-import')",
        ),
      ).rejects.toMatchObject({
        code: "23514",
        constraint: "participants_shape_check",
      });
      for (const type of ["registered", "anonymous"]) {
        await expect(
          client!.query(
            "insert into pg_temp.participants (public_code,type,source) values ('CAG-900002',$1,'web')",
            [type],
          ),
        ).rejects.toMatchObject({
          code: "23514",
          constraint: "participants_shape_check",
        });
      }
      await expect(
        createParticipantRecord(importedInput),
      ).rejects.toMatchObject({ cause: { code: "23505" } });
      const count = await client!.query(
        "select count(*)::int count from pg_temp.participants",
      );
      expect(count.rows[0].count).toBe(4);
    });

    it("imports valid responses and preserves duplicate-file protection", async () => {
      const admin = await account("admin");
      const actor = {
        kind: "admin" as const,
        accountId: admin.id,
        sessionId: randomUUID(),
        username: "isolated_admin",
        displayName: "Isolated Admin",
        locale: "en" as const,
        expiresAt: new Date(Date.now() + 60_000),
        mustChangePassword: false,
      };
      const records = [
        [
          "Timestamp",
          "Do you voluntarily agree to participate in this research questionnaire?",
          ...assessmentScenarios.map((s) => s.question.en),
        ],
        [
          "2026-09-20T10:15:00+03:00",
          HISTORICAL_CONSENT_ACCEPTED,
          ...assessmentScenarios.map((s) => s.options[0].en),
        ],
      ];
      const bytes = new TextEncoder().encode(
        records
          .map((row) =>
            row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
          )
          .join("\r\n"),
      );
      const preview = await previewHistoricalImport({
        actor,
        filename: "isolated.csv",
        bytes,
      });
      const report = await confirmHistoricalImport({
        actor,
        batchId: preview.batchId,
        bytes,
        excludedInvalidRecords: [],
      });
      expect(report.state).toBe("committed");
      expect(report.participantsCreated).toBe(1);
      expect(report.responsesCreated).toBe(8);
      const repeated = await previewHistoricalImport({
        actor,
        filename: "isolated.csv",
        bytes,
      });
      expect(repeated.counts.duplicate).toBe(1);
      expect(repeated.canConfirm).toBe(false);
      await expect(
        confirmHistoricalImport({
          actor,
          batchId: repeated.batchId,
          bytes,
          excludedInvalidRecords: [],
        }),
      ).rejects.toMatchObject({ code: "preview_not_confirmable" });
      const counts = await client!.query(
        "select (select count(*)::int from pg_temp.assessment_attempts) attempts, (select count(*)::int from pg_temp.responses) responses",
      );
      expect(counts.rows[0].attempts).toBe(1);
      expect(counts.rows[0].responses).toBe(8);
    }, 30_000);

    it("resolves a real session and restricts completed results to the owning participant", async () => {
      const owner = await account();
      const participant = await createParticipantRecord({
        type: "registered",
        accountId: owner.id,
      });
      const session = await createAccountSession({
        accountId: owner.id,
        participantId: participant.id,
      });
      const actor = await getSessionByToken(session.token);
      expect(actor?.kind).toBe("registered");
      expect(
        actor?.kind === "registered" && actor.participantId === participant.id,
      ).toBe(true);
      const answers = assessmentScenarios.map((s) => ({
        scenarioKey: s.key,
        optionId: s.options[0].id,
      }));
      const score = calculateAssessmentScore(answers);
      const [attempt] = await state.db
        .insert(schema.assessmentAttempts)
        .values({
          participantId: participant.id,
          status: "completed",
          source: "web",
          contentVersionId: ASSESSMENT_CONTENT_VERSION,
          rubricVersionId: RUBRIC_VERSION,
          totalScore: score.totalScore,
          scorePercentage: score.percentage,
          risk: score.risk,
          completedAt: new Date(),
        })
        .returning({ id: schema.assessmentAttempts.id });
      await state.db.insert(schema.responses).values(
        answers.map((answer) => ({
          attemptId: attempt.id,
          contentVersionId: ASSESSMENT_CONTENT_VERSION,
          scenarioKey: answer.scenarioKey,
          selectedOptionId: answer.optionId,
          contribution: score.contributions.get(answer.scenarioKey)!,
          feedbackKey: "isolated-regression",
        })),
      );
      const result = await getParticipantResult(participant.id, attempt.id);
      expect(result?.responses.length).toBe(8);
      expect(result?.percentage).toBe(score.percentage);
      expect(await getParticipantResult(randomUUID(), attempt.id)).toBeNull();
      await state.db
        .update(schema.sessions)
        .set({ revokedAt: sql`now()` })
        .where(eq(schema.sessions.id, actor!.sessionId));
      expect(await getSessionByToken(session.token)).toBeNull();
      expect(
        (await client!.query("show default_transaction_read_only")).rows[0]
          .default_transaction_read_only,
      ).toBe("on");
    }, 30_000);
  },
);
