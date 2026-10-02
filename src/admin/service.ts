import "server-only";

import { sql, type SQL } from "drizzle-orm";

import { ADMIN_PAGE_SIZE, type AdminListQuery } from "@/src/admin/query";
import type { SessionActor } from "@/src/auth/sessions";
import { db } from "@/src/db";

type AdminActor = Extract<SessionActor, { kind: "admin" }>;

function assertAdmin(actor: SessionActor): asserts actor is AdminActor {
  if (actor.kind !== "admin") throw new Error("Administrator access required");
}

function whereSql(conditions: SQL[]) {
  return conditions.length
    ? sql`where ${sql.join(conditions, sql` and `)}`
    : sql``;
}

function participantNameSql() {
  return sql`case
    when p.type in ('anonymous', 'imported') then 'Anonymous ' || p.anonymous_ordinal::text
    else coalesce(nullif(a.display_name, ''), a.username)
  end`;
}

export type ParticipantRow = {
  id: string;
  publicCode: string;
  type: "registered" | "anonymous" | "imported";
  displayName: string;
  username: string | null;
  createdAt: Date;
  latestScore: number | null;
  latestRisk: "low" | "medium" | "high" | null;
  latestCompletedAt: Date | null;
  hasCompleted: boolean;
  attemptCount: number;
};

export async function listParticipants(
  actor: SessionActor,
  query: AdminListQuery,
) {
  assertAdmin(actor);
  const conditions: SQL[] = [];
  const name = participantNameSql();
  if (query.search) {
    const pattern = `%${query.search}%`;
    conditions.push(
      sql`(${name} ilike ${pattern} or a.username ilike ${pattern} or p.public_code ilike ${pattern})`,
    );
  }
  if (query.type !== "all") conditions.push(sql`p.type = ${query.type}`);
  if (query.source !== "all") conditions.push(sql`p.source = ${query.source}`);
  if (query.risk !== "all") conditions.push(sql`latest.risk = ${query.risk}`);
  if (query.status === "completed") conditions.push(sql`latest.id is not null`);
  if (query.status === "incomplete") conditions.push(sql`latest.id is null`);
  const where = whereSql(conditions);
  const order =
    query.sort === "oldest"
      ? sql`coalesce(latest.completed_at, p.created_at) asc, p.id asc`
      : query.sort === "highest"
        ? sql`latest.total_score desc nulls last, latest.completed_at desc nulls last, p.id asc`
        : query.sort === "lowest"
          ? sql`latest.total_score asc nulls last, latest.completed_at desc nulls last, p.id asc`
          : sql`coalesce(latest.completed_at, p.created_at) desc, p.id asc`;
  const offset = (query.page - 1) * ADMIN_PAGE_SIZE;
  const result = await db.execute<ParticipantRow>(sql`
    select p.id,
           p.public_code as "publicCode",
           p.type,
           ${name} as "displayName",
           a.username,
           p.created_at as "createdAt",
           latest.total_score as "latestScore",
           latest.risk as "latestRisk",
           latest.completed_at as "latestCompletedAt",
           (latest.id is not null) as "hasCompleted",
           (select count(*)::integer from assessment_attempts aa where aa.participant_id = p.id) as "attemptCount"
      from participants p
      left join accounts a on a.id = p.account_id
      left join lateral (
        select aa.id, aa.total_score, aa.risk, aa.completed_at
          from assessment_attempts aa
         where aa.participant_id = p.id and aa.status = 'completed'
         order by aa.completed_at desc, aa.id desc
         limit 1
      ) latest on true
      ${where}
     order by ${order}
     limit ${ADMIN_PAGE_SIZE} offset ${offset}
  `);
  const count = await db.execute<{ total: number }>(sql`
    select count(*)::integer as total
      from participants p
      left join accounts a on a.id = p.account_id
      left join lateral (
        select aa.id, aa.risk
          from assessment_attempts aa
         where aa.participant_id = p.id and aa.status = 'completed'
         order by aa.completed_at desc, aa.id desc
         limit 1
      ) latest on true
      ${where}
  `);
  return { rows: result.rows, total: Number(count.rows[0]?.total ?? 0) };
}

export type AttemptRow = {
  id: string;
  participantId: string;
  publicCode: string;
  participantType: "registered" | "anonymous" | "imported";
  displayName: string;
  source: "web" | "google_form";
  status: "in_progress" | "completed" | "abandoned" | "excluded";
  totalScore: number | null;
  risk: "low" | "medium" | "high" | null;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
  sourceSubmittedAt?: Date | null;
  importBatchId?: string | null;
  sourceRecordNumber?: number | null;
};

export async function listAssessments(
  actor: SessionActor,
  query: AdminListQuery,
) {
  assertAdmin(actor);
  const conditions: SQL[] = [];
  const name = participantNameSql();
  if (query.search) {
    const pattern = `%${query.search}%`;
    conditions.push(
      sql`(${name} ilike ${pattern} or a.username ilike ${pattern} or p.public_code ilike ${pattern} or aa.id::text ilike ${pattern})`,
    );
  }
  if (query.type !== "all") conditions.push(sql`p.type = ${query.type}`);
  if (query.risk !== "all") conditions.push(sql`aa.risk = ${query.risk}`);
  if (query.source !== "all") conditions.push(sql`aa.source = ${query.source}`);
  if (query.status === "completed")
    conditions.push(sql`aa.status = 'completed'`);
  if (query.status === "incomplete")
    conditions.push(sql`aa.status <> 'completed'`);
  const where = whereSql(conditions);
  const order =
    query.sort === "oldest"
      ? sql`coalesce(aa.completed_at, aa.started_at) asc, aa.id asc`
      : query.sort === "highest"
        ? sql`aa.total_score desc nulls last, aa.completed_at desc nulls last, aa.id asc`
        : query.sort === "lowest"
          ? sql`aa.total_score asc nulls last, aa.completed_at desc nulls last, aa.id asc`
          : sql`coalesce(aa.completed_at, aa.started_at) desc, aa.id asc`;
  const offset = (query.page - 1) * ADMIN_PAGE_SIZE;
  const rows = await db.execute<AttemptRow>(sql`
    select aa.id,
           aa.participant_id as "participantId",
           p.public_code as "publicCode",
           p.type as "participantType",
           ${name} as "displayName",
           aa.source,
           aa.status,
           aa.total_score as "totalScore",
           aa.risk,
           aa.started_at as "startedAt",
           aa.completed_at as "completedAt",
           aa.updated_at as "updatedAt",
           aa.source_submitted_at as "sourceSubmittedAt",
           aa.import_batch_id as "importBatchId",
           aa.source_record_number as "sourceRecordNumber"
      from assessment_attempts aa
      join participants p on p.id = aa.participant_id
      left join accounts a on a.id = p.account_id
      ${where}
     order by ${order}
     limit ${ADMIN_PAGE_SIZE} offset ${offset}
  `);
  const count = await db.execute<{ total: number }>(sql`
    select count(*)::integer as total
      from assessment_attempts aa
      join participants p on p.id = aa.participant_id
      left join accounts a on a.id = p.account_id
      ${where}
  `);
  return { rows: rows.rows, total: Number(count.rows[0]?.total ?? 0) };
}

export async function getParticipantDetails(
  actor: SessionActor,
  participantId: string,
) {
  assertAdmin(actor);
  const result = await db.execute<{
    id: string;
    publicCode: string;
    type: "registered" | "anonymous" | "imported";
    source: "web" | "google_form";
    displayName: string;
    username: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>(sql`
    select p.id, p.public_code as "publicCode", p.type, p.source,
           ${participantNameSql()} as "displayName", a.username,
           p.created_at as "createdAt", p.updated_at as "updatedAt"
      from participants p
      left join accounts a on a.id = p.account_id
     where p.id = ${participantId}
     limit 1
  `);
  const participant = result.rows[0];
  if (!participant) return null;
  const attempts = await db.execute<AttemptRow>(sql`
    select aa.id, aa.participant_id as "participantId", p.public_code as "publicCode",
           p.type as "participantType", ${participantNameSql()} as "displayName",
           aa.source, aa.status, aa.total_score as "totalScore", aa.risk,
           aa.started_at as "startedAt", aa.completed_at as "completedAt", aa.updated_at as "updatedAt",
           aa.source_submitted_at as "sourceSubmittedAt", aa.import_batch_id as "importBatchId",
           aa.source_record_number as "sourceRecordNumber"
      from assessment_attempts aa
      join participants p on p.id = aa.participant_id
      left join accounts a on a.id = p.account_id
     where aa.participant_id = ${participantId}
     order by aa.started_at desc, aa.id desc
  `);
  return { participant, attempts: attempts.rows };
}

export async function getAssessmentDetails(
  actor: SessionActor,
  attemptId: string,
) {
  assertAdmin(actor);
  const result = await db.execute<AttemptRow>(sql`
    select aa.id, aa.participant_id as "participantId", p.public_code as "publicCode",
           p.type as "participantType", ${participantNameSql()} as "displayName",
           aa.source, aa.status, aa.total_score as "totalScore", aa.risk,
           aa.started_at as "startedAt", aa.completed_at as "completedAt", aa.updated_at as "updatedAt",
           aa.source_submitted_at as "sourceSubmittedAt", aa.import_batch_id as "importBatchId",
           aa.source_record_number as "sourceRecordNumber"
      from assessment_attempts aa
      join participants p on p.id = aa.participant_id
      left join accounts a on a.id = p.account_id
     where aa.id = ${attemptId}
     limit 1
  `);
  const attempt = result.rows[0];
  if (!attempt) return null;
  const answers = await db.execute<{
    scenarioKey: string;
    order: number;
    questionEn: string;
    questionAr: string;
    optionId: string;
    answerEn: string;
    answerAr: string;
    contribution: number | null;
  }>(
    attempt.status === "completed"
      ? sql`
    select r.scenario_key as "scenarioKey", s.display_order as "order",
           s.question_en as "questionEn", s.question_ar as "questionAr",
           r.selected_option_id as "optionId", o.text_en as "answerEn", o.text_ar as "answerAr",
           r.contribution
      from responses r
      join scenarios s on s.content_version_id = r.content_version_id and s.key = r.scenario_key
      join options o on o.content_version_id = r.content_version_id and o.scenario_key = r.scenario_key and o.id = r.selected_option_id
     where r.attempt_id = ${attemptId}
     order by s.display_order
  `
      : sql`
    select d.scenario_key as "scenarioKey", s.display_order as "order",
           s.question_en as "questionEn", s.question_ar as "questionAr",
           d.selected_option_id as "optionId", o.text_en as "answerEn", o.text_ar as "answerAr",
           null::integer as contribution
      from assessment_draft_answers d
      join scenarios s on s.content_version_id = d.content_version_id and s.key = d.scenario_key
      join options o on o.content_version_id = d.content_version_id and o.scenario_key = d.scenario_key and o.id = d.selected_option_id
     where d.attempt_id = ${attemptId}
     order by s.display_order
  `,
  );
  return { attempt, answers: answers.rows };
}

export async function getDashboardData(actor: SessionActor) {
  assertAdmin(actor);
  const metrics = await db.execute<{
    participants: number;
    completed: number;
    incomplete: number;
  }>(sql`
    select (select count(*)::integer from participants) as participants,
           (select count(*)::integer from assessment_attempts where status = 'completed') as completed,
           (select count(*)::integer from assessment_attempts where status <> 'completed') as incomplete
  `);
  const recent = await listAssessments(actor, {
    search: "",
    type: "all",
    risk: "all",
    status: "all",
    source: "all",
    sort: "newest",
    page: 1,
  });
  return {
    metrics: metrics.rows[0] ?? {
      participants: 0,
      completed: 0,
      incomplete: 0,
    },
    recent: recent.rows.slice(0, 5),
  };
}

export async function listImportAudits(actor: SessionActor) {
  assertAdmin(actor);
  const result = await db.execute<{
    id: string;
    filename: string;
    fingerprint: string;
    state: "previewed" | "committed" | "failed";
    totalRows: number;
    acceptedRows: number;
    excludedRows: number;
    duplicateRows: number;
    invalidRows: number;
    importedAssessments: number;
    source: "web" | "google_form";
    createdBy: string;
    createdAt: Date;
    committedAt: Date | null;
  }>(sql`
    select ib.id, ib.original_filename as filename, ib.checksum as fingerprint, ib.state, ib.source,
           coalesce(nullif(a.display_name, ''), a.username) as "createdBy",
           ib.total_rows as "totalRows",
           accepted_rows as "acceptedRows", excluded_rows as "excludedRows",
           duplicate_rows as "duplicateRows", invalid_rows as "invalidRows",
           imported_assessments as "importedAssessments",
           ib.created_at as "createdAt", ib.committed_at as "committedAt"
      from import_batches ib
      join accounts a on a.id = ib.created_by_account_id
     order by ib.created_at desc limit 100
  `);
  return result.rows;
}
