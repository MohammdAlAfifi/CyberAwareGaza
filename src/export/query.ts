import "server-only";

import { sql, type SQL } from "drizzle-orm";

import type { SessionActor } from "@/src/auth/sessions";
import { db } from "@/src/db";
import { coerceDatabaseDate } from "@/src/export/database-values";
import type { ExportFilters } from "@/src/export/filters";

type AdminActor = Extract<SessionActor, { kind: "admin" }>;

export type ReportAnswer = {
  scenarioKey: string;
  order: number;
  questionEn: string;
  questionAr: string;
  optionId: string;
  answerEn: string;
  answerAr: string;
  contribution: number;
};

export type ResponseReportRow = {
  participantId: string;
  participantCode: string;
  participantName: string;
  participantType: "registered" | "anonymous" | "imported";
  username: string | null;
  assessmentId: string;
  source: "web" | "google_form";
  sourceRecordNumber: number | null;
  sourceSubmittedAt: Date | null;
  completedAt: Date | null;
  scoringVersion: string;
  rawScore: number;
  risk: "low" | "medium" | "high";
  answers: ReportAnswer[];
};

function assertAdmin(actor: SessionActor): asserts actor is AdminActor {
  if (actor.kind !== "admin") throw new Error("Administrator access required");
}

function attemptConditions(filters: ExportFilters, alias = sql`aa`): SQL[] {
  const conditions: SQL[] = [
    sql`${alias}.status = 'completed'`,
    sql`exists (
      select 1 from consents c
       where c.attempt_id = ${alias}.id
         and c.participant_id = ${alias}.participant_id
         and c.source = ${alias}.source
         and c.decision = true
    )`,
  ];
  if (filters.source !== "all")
    conditions.push(sql`${alias}.source = ${filters.source}`);
  if (filters.risk !== "all")
    conditions.push(sql`${alias}.risk = ${filters.risk}`);
  if (filters.from)
    conditions.push(
      sql`coalesce(${alias}.source_submitted_at, ${alias}.completed_at) >= ${filters.from}`,
    );
  if (filters.to)
    conditions.push(
      sql`coalesce(${alias}.source_submitted_at, ${alias}.completed_at) <= ${filters.to}`,
    );
  return conditions;
}

function where(conditions: SQL[]) {
  return sql`where ${sql.join(conditions, sql` and `)}`;
}

function participantName(locale: "en" | "ar") {
  const anonymous = locale === "ar" ? "مجهول " : "Anonymous ";
  return sql`case
    when p.type in ('anonymous', 'imported') then ${anonymous} || p.anonymous_ordinal::text
    else coalesce(nullif(a.display_name, ''), a.username)
  end`;
}

export async function getResponseReportData(
  actor: SessionActor,
  filters: ExportFilters,
): Promise<ResponseReportRow[]> {
  assertAdmin(actor);
  const conditions = attemptConditions(filters);
  const result = await db.execute<
    Omit<ResponseReportRow, "answers" | "sourceSubmittedAt" | "completedAt"> & {
      sourceSubmittedAt: Date | string | null;
      completedAt: Date | string | null;
      answers: ReportAnswer[];
    }
  >(sql`
    select p.id as "participantId", p.public_code as "participantCode",
           ${participantName(filters.locale)} as "participantName", p.type as "participantType",
           a.username, aa.id as "assessmentId", aa.source,
           aa.source_record_number as "sourceRecordNumber",
           aa.source_submitted_at as "sourceSubmittedAt", aa.completed_at as "completedAt",
           aa.rubric_version_id as "scoringVersion", aa.total_score as "rawScore", aa.risk,
           json_agg(json_build_object(
             'scenarioKey', r.scenario_key, 'order', s.display_order,
             'questionEn', s.question_en, 'questionAr', s.question_ar,
             'optionId', r.selected_option_id, 'answerEn', o.text_en,
             'answerAr', o.text_ar, 'contribution', r.contribution
           ) order by s.display_order) as answers
      from assessment_attempts aa
      join participants p on p.id = aa.participant_id
      left join accounts a on a.id = p.account_id
      join responses r on r.attempt_id = aa.id
      join scenarios s on s.content_version_id = r.content_version_id and s.key = r.scenario_key
      join options o on o.content_version_id = r.content_version_id
       and o.scenario_key = r.scenario_key and o.id = r.selected_option_id
      ${where(conditions)}
     group by p.id, p.public_code, p.type, p.anonymous_ordinal, a.display_name, a.username,
              aa.id, aa.source, aa.source_record_number, aa.source_submitted_at,
              aa.completed_at, aa.rubric_version_id, aa.total_score, aa.risk
    having count(r.scenario_key) = 8
     order by coalesce(aa.source_submitted_at, aa.completed_at) desc nulls last, aa.id
  `);
  return result.rows.map((row) => ({
    ...row,
    rawScore: Number(row.rawScore),
    sourceSubmittedAt: coerceDatabaseDate(row.sourceSubmittedAt),
    completedAt: coerceDatabaseDate(row.completedAt),
    sourceRecordNumber:
      row.sourceRecordNumber === null ? null : Number(row.sourceRecordNumber),
    answers: row.answers.map((answer) => ({
      ...answer,
      order: Number(answer.order),
      contribution: Number(answer.contribution),
    })),
  }));
}

export async function getParticipantExportRows(
  actor: SessionActor,
  filters: ExportFilters,
) {
  assertAdmin(actor);
  const participantConditions: SQL[] = [];
  if (filters.source !== "all")
    participantConditions.push(sql`p.source = ${filters.source}`);
  const attempts = attemptConditions(filters, sql`candidate`);
  if (filters.risk !== "all" || filters.from || filters.to) {
    participantConditions.push(sql`exists (
      select 1 from assessment_attempts candidate
      ${where(attempts)} and candidate.participant_id = p.id
    )`);
  }
  const result = await db.execute<{
    participantId: string;
    participantCode: string;
    displayLabel: string;
    accountType: string;
    username: string | null;
    assessmentCount: number;
    latestAssessmentId: string | null;
    latestScore: number | null;
    latestRisk: string | null;
    latestCompletedAt: Date | null;
  }>(sql`
    select p.id as "participantId", p.public_code as "participantCode",
           ${participantName(filters.locale)} as "displayLabel", p.type as "accountType", a.username,
           (select count(*)::integer from assessment_attempts candidate
             ${where([...attempts, sql`candidate.participant_id = p.id`])}) as "assessmentCount",
           latest.id as "latestAssessmentId", latest.total_score as "latestScore",
           latest.risk as "latestRisk",
           coalesce(latest.source_submitted_at, latest.completed_at) as "latestCompletedAt"
      from participants p
      left join accounts a on a.id = p.account_id
      left join lateral (
        select candidate.* from assessment_attempts candidate
         ${where([...attempts, sql`candidate.participant_id = p.id`])}
         order by coalesce(candidate.source_submitted_at, candidate.completed_at) desc nulls last, candidate.id desc
         limit 1
      ) latest on true
      ${participantConditions.length ? where(participantConditions) : sql``}
     order by p.created_at, p.id
  `);
  return result.rows.map((row) => ({
    ...row,
    assessmentCount: Number(row.assessmentCount),
    latestScore: row.latestScore === null ? null : Number(row.latestScore),
    latestCompletedAt: coerceDatabaseDate(row.latestCompletedAt),
  }));
}

export async function getActiveAnalyticsExport(
  actor: SessionActor,
  filters: ExportFilters,
) {
  assertAdmin(actor);
  const [active] = (
    await db.execute<{ contentVersionId: string; rubricVersionId: string }>(sql`
      select cv.id as "contentVersionId", rv.id as "rubricVersionId"
        from content_versions cv join rubric_versions rv on rv.content_version_id = cv.id
       where cv.is_active = true and rv.is_active = true limit 1
    `)
  ).rows;
  if (!active) return { active: null, attempts: 0, risks: [], scenarios: [] };
  const conditions = [
    ...attemptConditions(filters),
    sql`aa.content_version_id = ${active.contentVersionId}`,
    sql`aa.rubric_version_id = ${active.rubricVersionId}`,
  ];
  const risks = await db.execute<{ risk: string; count: number }>(sql`
    select aa.risk, count(*)::integer as count from assessment_attempts aa
      ${where(conditions)} group by aa.risk order by aa.risk
  `);
  const scenarios = await db.execute<{
    scenarioKey: string;
    scenarioNumber: number;
    optionId: string;
    optionTextEn: string;
    optionTextAr: string;
    count: number;
  }>(sql`
    with eligible as (select aa.id from assessment_attempts aa ${where(conditions)})
    select s.key as "scenarioKey", s.display_order as "scenarioNumber",
           o.id as "optionId", o.text_en as "optionTextEn", o.text_ar as "optionTextAr",
           count(r.attempt_id)::integer as count
      from scenarios s join options o on o.content_version_id = s.content_version_id and o.scenario_key = s.key
      left join responses r on r.content_version_id = o.content_version_id
       and r.scenario_key = o.scenario_key and r.selected_option_id = o.id
       and exists (select 1 from eligible e where e.id = r.attempt_id)
     where s.content_version_id = ${active.contentVersionId}
     group by s.key, s.display_order, o.id, o.display_order, o.text_en, o.text_ar
     order by s.display_order, o.display_order
  `);
  const attempts = risks.rows.reduce((sum, row) => sum + Number(row.count), 0);
  return { active, attempts, risks: risks.rows, scenarios: scenarios.rows };
}
