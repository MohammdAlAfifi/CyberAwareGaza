import "server-only";

import { sql } from "drizzle-orm";

import {
  distribution,
  percentage,
  type AnalyticsSource,
} from "@/src/admin/analytics";
import type { AttemptRow } from "@/src/admin/service";
import type { ScenarioKey } from "@/src/assessment/content";
import type { SessionActor } from "@/src/auth/sessions";
import { db } from "@/src/db";

type AdminActor = Extract<SessionActor, { kind: "admin" }>;

function assertAdmin(actor: SessionActor): asserts actor is AdminActor {
  if (actor.kind !== "admin") throw new Error("Administrator access required");
}

function attemptSourceSql(source: AnalyticsSource) {
  return source === "all" ? sql`` : sql`and aa.source = ${source}`;
}

function participantSourceSql(source: AnalyticsSource) {
  return source === "all" ? sql`` : sql`where p.source = ${source}`;
}

function participantNameSql() {
  return sql`case
    when p.type = 'anonymous' then 'Anonymous ' || p.anonymous_ordinal::text
    when p.type = 'imported' then coalesce(nullif(p.source_participant_key, ''), p.public_code)
    else coalesce(nullif(a.display_name, ''), a.username)
  end`;
}

const eligibleSql = sql`
  aa.status = 'completed'
  and exists (
    select 1
      from consents c
     where c.attempt_id = aa.id
       and c.participant_id = aa.participant_id
       and c.source = aa.source
       and c.decision = true
  )
`;

export type AnalyticsVersion = {
  contentVersionId: string;
  contentLabel: string;
  rubricVersionId: string;
  rubricLabel: string;
  count: number;
};

export type AnalyticsDashboard = {
  source: AnalyticsSource;
  participants: {
    total: number;
    registered: number;
    anonymous: number;
    imported: number;
  };
  attempts: {
    eligible: number;
    currentVersion: number;
    excludedByVersion: number;
    averageScore: number | null;
    low: number;
    medium: number;
    high: number;
  };
  riskDistribution: ReturnType<typeof distribution>;
  accountDistribution: ReturnType<typeof distribution>;
  versions: AnalyticsVersion[];
  activeVersion: Omit<AnalyticsVersion, "count"> | null;
  recent: AttemptRow[];
};

async function getActiveVersion() {
  const result = await db.execute<Omit<AnalyticsVersion, "count">>(sql`
    select cv.id as "contentVersionId", cv.label as "contentLabel",
           rv.id as "rubricVersionId", rv.label as "rubricLabel"
      from content_versions cv
      join rubric_versions rv on rv.content_version_id = cv.id
     where cv.is_active = true and rv.is_active = true
     limit 1
  `);
  return result.rows[0] ?? null;
}

export async function getAnalyticsDashboard(
  actor: SessionActor,
  source: AnalyticsSource,
): Promise<AnalyticsDashboard> {
  assertAdmin(actor);
  const activeVersion = await getActiveVersion();
  const sourceAttempts = attemptSourceSql(source);
  const sourceParticipants = participantSourceSql(source);

  const participantResult = await db.execute<{
    total: number;
    registered: number;
    anonymous: number;
    imported: number;
  }>(sql`
    select count(*)::integer as total,
           count(*) filter (where p.type = 'registered')::integer as registered,
           count(*) filter (where p.type = 'anonymous')::integer as anonymous,
           count(*) filter (where p.type = 'imported')::integer as imported
      from participants p
      ${sourceParticipants}
  `);

  const metricsResult = activeVersion
    ? await db.execute<{
        eligible: number;
        currentVersion: number;
        averageScore: number | null;
        low: number;
        medium: number;
        high: number;
      }>(sql`
        select count(*)::integer as eligible,
               count(*) filter (
                 where aa.content_version_id = ${activeVersion.contentVersionId}
                   and aa.rubric_version_id = ${activeVersion.rubricVersionId}
               )::integer as "currentVersion",
               avg(aa.total_score) filter (
                 where aa.content_version_id = ${activeVersion.contentVersionId}
                   and aa.rubric_version_id = ${activeVersion.rubricVersionId}
               )::double precision as "averageScore",
               count(*) filter (
                 where aa.content_version_id = ${activeVersion.contentVersionId}
                   and aa.rubric_version_id = ${activeVersion.rubricVersionId}
                   and aa.risk = 'low'
               )::integer as low,
               count(*) filter (
                 where aa.content_version_id = ${activeVersion.contentVersionId}
                   and aa.rubric_version_id = ${activeVersion.rubricVersionId}
                   and aa.risk = 'medium'
               )::integer as medium,
               count(*) filter (
                 where aa.content_version_id = ${activeVersion.contentVersionId}
                   and aa.rubric_version_id = ${activeVersion.rubricVersionId}
                   and aa.risk = 'high'
               )::integer as high
          from assessment_attempts aa
         where ${eligibleSql}
         ${sourceAttempts}
      `)
    : await db.execute<{
        eligible: number;
        currentVersion: number;
        averageScore: number | null;
        low: number;
        medium: number;
        high: number;
      }>(sql`
        select count(*)::integer as eligible,
               0::integer as "currentVersion",
               null::double precision as "averageScore",
               0::integer as low, 0::integer as medium, 0::integer as high
          from assessment_attempts aa
         where ${eligibleSql}
         ${sourceAttempts}
      `);

  const versionsResult = await db.execute<AnalyticsVersion>(sql`
    select aa.content_version_id as "contentVersionId", cv.label as "contentLabel",
           aa.rubric_version_id as "rubricVersionId", rv.label as "rubricLabel",
           count(*)::integer as count
      from assessment_attempts aa
      join content_versions cv on cv.id = aa.content_version_id
      join rubric_versions rv on rv.id = aa.rubric_version_id
       and rv.content_version_id = aa.content_version_id
     where ${eligibleSql}
     ${sourceAttempts}
     group by aa.content_version_id, cv.label, aa.rubric_version_id, rv.label
     order by count(*) desc, aa.content_version_id, aa.rubric_version_id
  `);

  const recentResult = await db.execute<AttemptRow>(sql`
    select aa.id, aa.participant_id as "participantId", p.public_code as "publicCode",
           p.type as "participantType", ${participantNameSql()} as "displayName",
           aa.source, aa.status, aa.total_score as "totalScore", aa.risk,
           aa.started_at as "startedAt", aa.completed_at as "completedAt",
           aa.updated_at as "updatedAt"
      from assessment_attempts aa
      join participants p on p.id = aa.participant_id
      left join accounts a on a.id = p.account_id
     where ${eligibleSql}
     ${sourceAttempts}
     order by aa.completed_at desc, aa.id desc
     limit 8
  `);

  const participantRow = participantResult.rows[0] ?? {
    total: 0,
    registered: 0,
    anonymous: 0,
    imported: 0,
  };
  const metricRow = metricsResult.rows[0] ?? {
    eligible: 0,
    currentVersion: 0,
    averageScore: null,
    low: 0,
    medium: 0,
    high: 0,
  };
  const participantClassified =
    Number(participantRow.registered) + Number(participantRow.anonymous);
  const currentVersion = Number(metricRow.currentVersion);
  const attempts = {
    eligible: Number(metricRow.eligible),
    currentVersion,
    excludedByVersion: Math.max(0, Number(metricRow.eligible) - currentVersion),
    averageScore:
      metricRow.averageScore === null ? null : Number(metricRow.averageScore),
    low: Number(metricRow.low),
    medium: Number(metricRow.medium),
    high: Number(metricRow.high),
  };

  return {
    source,
    participants: {
      total: Number(participantRow.total),
      registered: Number(participantRow.registered),
      anonymous: Number(participantRow.anonymous),
      imported: Number(participantRow.imported),
    },
    attempts,
    riskDistribution: distribution(
      [
        { id: "low", count: attempts.low },
        { id: "medium", count: attempts.medium },
        { id: "high", count: attempts.high },
      ],
      currentVersion,
    ),
    accountDistribution: distribution(
      [
        { id: "registered", count: Number(participantRow.registered) },
        { id: "anonymous", count: Number(participantRow.anonymous) },
      ],
      participantClassified,
    ),
    versions: versionsResult.rows.map((version) => ({
      ...version,
      count: Number(version.count),
    })),
    activeVersion,
    recent: recentResult.rows,
  };
}

export type ScenarioOptionAnalytics = {
  id: string;
  order: number;
  textEn: string;
  textAr: string;
  contribution: number;
  count: number;
  percentage: number;
};

export type ScenarioAnalytics = {
  key: ScenarioKey;
  order: number;
  questionEn: string;
  questionAr: string;
  eligibleResponses: number;
  options: ScenarioOptionAnalytics[];
};

export async function getScenarioAnalytics(
  actor: SessionActor,
  source: AnalyticsSource,
  scenarioKey?: ScenarioKey,
) {
  assertAdmin(actor);
  const activeVersion = await getActiveVersion();
  const sourceAttempts = attemptSourceSql(source);
  if (!activeVersion) {
    const versionsResult = await db.execute<AnalyticsVersion>(sql`
      select aa.content_version_id as "contentVersionId", cv.label as "contentLabel",
             aa.rubric_version_id as "rubricVersionId", rv.label as "rubricLabel",
             count(*)::integer as count
        from assessment_attempts aa
        join content_versions cv on cv.id = aa.content_version_id
        join rubric_versions rv on rv.id = aa.rubric_version_id
         and rv.content_version_id = aa.content_version_id
       where ${eligibleSql}
       ${sourceAttempts}
       group by aa.content_version_id, cv.label, aa.rubric_version_id, rv.label
       order by count(*) desc, aa.content_version_id, aa.rubric_version_id
    `);
    const versions = versionsResult.rows.map((version) => ({
      ...version,
      count: Number(version.count),
    }));
    return {
      source,
      activeVersion: null,
      eligibleAttempts: 0,
      eligibleAssessments: versions.reduce(
        (sum, version) => sum + version.count,
        0,
      ),
      versions,
      scenarios: [] as ScenarioAnalytics[],
    };
  }
  const scenarioCondition = scenarioKey
    ? sql`and s.key = ${scenarioKey}`
    : sql``;
  const result = await db.execute<{
    scenarioKey: ScenarioKey;
    scenarioOrder: number;
    questionEn: string;
    questionAr: string;
    optionId: string;
    optionOrder: number;
    textEn: string;
    textAr: string;
    contribution: number;
    count: number;
  }>(sql`
    with eligible_attempts as (
      select aa.id
        from assessment_attempts aa
       where ${eligibleSql}
         and aa.content_version_id = ${activeVersion.contentVersionId}
         and aa.rubric_version_id = ${activeVersion.rubricVersionId}
       ${sourceAttempts}
    ), response_counts as (
      select r.scenario_key, r.selected_option_id, count(*)::integer as count
        from responses r
        join eligible_attempts ea on ea.id = r.attempt_id
       where r.content_version_id = ${activeVersion.contentVersionId}
       group by r.scenario_key, r.selected_option_id
    )
    select s.key as "scenarioKey", s.display_order as "scenarioOrder",
           s.question_en as "questionEn", s.question_ar as "questionAr",
           o.id as "optionId", o.display_order as "optionOrder",
           o.text_en as "textEn", o.text_ar as "textAr",
           re.contribution, coalesce(rc.count, 0)::integer as count
      from scenarios s
      join options o on o.content_version_id = s.content_version_id
       and o.scenario_key = s.key
      join rubric_entries re on re.rubric_version_id = ${activeVersion.rubricVersionId}
       and re.content_version_id = s.content_version_id
       and re.scenario_key = s.key and re.option_id = o.id
      left join response_counts rc on rc.scenario_key = s.key
       and rc.selected_option_id = o.id
     where s.content_version_id = ${activeVersion.contentVersionId}
     ${scenarioCondition}
     order by s.display_order, o.display_order
  `);

  const eligibleResult = await db.execute<{ count: number }>(sql`
    select count(*)::integer as count
      from assessment_attempts aa
     where ${eligibleSql}
       and aa.content_version_id = ${activeVersion.contentVersionId}
       and aa.rubric_version_id = ${activeVersion.rubricVersionId}
     ${sourceAttempts}
  `);
  const versionsResult = await db.execute<AnalyticsVersion>(sql`
    select aa.content_version_id as "contentVersionId", cv.label as "contentLabel",
           aa.rubric_version_id as "rubricVersionId", rv.label as "rubricLabel",
           count(*)::integer as count
      from assessment_attempts aa
      join content_versions cv on cv.id = aa.content_version_id
      join rubric_versions rv on rv.id = aa.rubric_version_id
       and rv.content_version_id = aa.content_version_id
     where ${eligibleSql}
     ${sourceAttempts}
     group by aa.content_version_id, cv.label, aa.rubric_version_id, rv.label
     order by count(*) desc, aa.content_version_id, aa.rubric_version_id
  `);

  const grouped = new Map<ScenarioKey, ScenarioAnalytics>();
  for (const row of result.rows) {
    let scenario = grouped.get(row.scenarioKey);
    if (!scenario) {
      scenario = {
        key: row.scenarioKey,
        order: Number(row.scenarioOrder),
        questionEn: row.questionEn,
        questionAr: row.questionAr,
        eligibleResponses: 0,
        options: [],
      };
      grouped.set(row.scenarioKey, scenario);
    }
    scenario.options.push({
      id: row.optionId,
      order: Number(row.optionOrder),
      textEn: row.textEn,
      textAr: row.textAr,
      contribution: Number(row.contribution),
      count: Number(row.count),
      percentage: 0,
    });
  }
  const scenarios = [...grouped.values()];
  for (const scenario of scenarios) {
    scenario.eligibleResponses = scenario.options.reduce(
      (sum, option) => sum + option.count,
      0,
    );
    scenario.options = scenario.options.map((option) => ({
      ...option,
      percentage: percentage(option.count, scenario.eligibleResponses),
    }));
  }

  return {
    source,
    activeVersion,
    eligibleAttempts: Number(eligibleResult.rows[0]?.count ?? 0),
    eligibleAssessments: versionsResult.rows.reduce(
      (sum, version) => sum + Number(version.count),
      0,
    ),
    versions: versionsResult.rows.map((version) => ({
      ...version,
      count: Number(version.count),
    })),
    scenarios,
  };
}
