import { hash } from "@node-rs/argon2";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import {
  assessmentScenarios,
  ASSESSMENT_CONTENT_VERSION,
} from "@/src/assessment/content";
import { buildRuntimePoolConfig } from "@/src/db/pool-config";
import { calculateAssessmentScore } from "@/src/scoring/risk";
import { RUBRIC_VERSION } from "@/src/scoring/rubric";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const adminUsername = `phase7_admin_${runId}`;
const participantUsername = `phase7_user_${runId}`;
const excludedUsername = `phase7_excluded_${runId}`;
const adminPassword = "Phase7-admin-password-123!";
const participantPassword = "Phase7-participant-password-123!";
const databaseUrl = process.env.DIRECT_DATABASE_URL;
const configured = Boolean(databaseUrl && process.env.SESSION_SECRET);
const pool = databaseUrl
  ? new Pool(
      buildRuntimePoolConfig(databaseUrl, process.env.SUPABASE_CA_CERT_PATH),
    )
  : null;

const accountIds: string[] = [];
const participantIds: string[] = [];
const attemptIds: string[] = [];
let registeredCode = "";
let importedCode = "";
let webBefore = {
  participants: 0,
  registered: 0,
  anonymous: 0,
  eligible: 0,
  scoreCount: 0,
  scoreSum: 0,
};
let googleBefore = {
  participants: 0,
  registered: 0,
  anonymous: 0,
  eligible: 0,
  scoreCount: 0,
  scoreSum: 0,
};
let webFixtureScores: number[] = [];
let googleFixtureScore = 0;

async function passwordHash(password: string) {
  return hash(password, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
}

async function allocate(key: string) {
  const result = await pool!.query(
    `update counters set value = value + 1 where key = $1 returning value`,
    [key],
  );
  return Number(result.rows[0].value);
}

async function publicCode() {
  return `CAG-${String(await allocate("participant_public_code")).padStart(4, "0")}`;
}

async function snapshot(source: "web" | "google_form") {
  const result = await pool!.query(
    `select
       (select count(*)::integer from participants where source = $1) participants,
       (select count(*)::integer from participants where source = $1 and type = 'registered') registered,
       (select count(*)::integer from participants where source = $1 and type = 'anonymous') anonymous,
       count(*)::integer eligible,
       count(*) filter (where aa.content_version_id = $2 and aa.rubric_version_id = $3)::integer score_count,
       coalesce(sum(aa.total_score) filter (where aa.content_version_id = $2 and aa.rubric_version_id = $3), 0)::integer score_sum
     from assessment_attempts aa
     where aa.source = $1 and aa.status = 'completed'
       and exists (select 1 from consents c where c.attempt_id = aa.id and c.participant_id = aa.participant_id and c.source = aa.source and c.decision = true)`,
    [source, ASSESSMENT_CONTENT_VERSION, RUBRIC_VERSION],
  );
  const row = result.rows[0];
  return {
    participants: Number(row.participants),
    registered: Number(row.registered),
    anonymous: Number(row.anonymous),
    eligible: Number(row.eligible),
    scoreCount: Number(row.score_count),
    scoreSum: Number(row.score_sum),
  };
}

function answersAt(index: number) {
  return assessmentScenarios.map((scenario) => ({
    scenarioKey: scenario.key,
    optionId: scenario.options[Math.min(index, scenario.options.length - 1)].id,
  }));
}

async function insertCompletedAttempt({
  answers,
  consent,
  participantId,
  source,
}: {
  answers: ReturnType<typeof answersAt>;
  consent: boolean;
  participantId: string;
  source: "web" | "google_form";
}) {
  const score = calculateAssessmentScore(answers);
  const attempt = await pool!.query(
    `insert into assessment_attempts
       (participant_id,status,source,source_submission_key,content_version_id,rubric_version_id,total_score,risk,completed_at)
     values ($1,'completed',$2,$3,$4,$5,$6,$7,now()) returning id`,
    [
      participantId,
      source,
      source === "google_form"
        ? `phase7-submission-${runId}-${attemptIds.length}`
        : null,
      ASSESSMENT_CONTENT_VERSION,
      RUBRIC_VERSION,
      score.totalScore,
      score.risk,
    ],
  );
  const attemptId = attempt.rows[0].id as string;
  attemptIds.push(attemptId);
  await pool!.query(
    `insert into consents (participant_id,attempt_id,decision,consent_version,source) values ($1,$2,$3,'phase7-fixture',$4)`,
    [participantId, attemptId, consent, source],
  );
  for (const answer of answers) {
    await pool!.query(
      `insert into responses (attempt_id,content_version_id,scenario_key,selected_option_id,contribution,feedback_key)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        attemptId,
        ASSESSMENT_CONTENT_VERSION,
        answer.scenarioKey,
        answer.optionId,
        score.contributions.get(answer.scenarioKey),
        `${RUBRIC_VERSION}:${answer.scenarioKey}:${answer.optionId}`,
      ],
    );
  }
  return score.totalScore;
}

async function pageOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.body.scrollWidth - window.innerWidth);
}

test.beforeAll(async () => {
  test.skip(!configured, "Database and session configuration are required");
  webBefore = await snapshot("web");
  googleBefore = await snapshot("google_form");

  const admin = await pool!.query(
    `insert into accounts (normalized_username,username,display_name,password_hash,role,must_change_password)
     values ($1,$1,'Phase 7 Admin',$2,'admin',false) returning id`,
    [adminUsername, await passwordHash(adminPassword)],
  );
  accountIds.push(admin.rows[0].id);
  const participantAccount = await pool!.query(
    `insert into accounts (normalized_username,username,password_hash,role) values ($1,$1,$2,'participant') returning id`,
    [participantUsername, await passwordHash(participantPassword)],
  );
  accountIds.push(participantAccount.rows[0].id);
  const excludedAccount = await pool!.query(
    `insert into accounts (normalized_username,username,password_hash,role) values ($1,$1,$2,'participant') returning id`,
    [excludedUsername, await passwordHash(participantPassword)],
  );
  accountIds.push(excludedAccount.rows[0].id);

  registeredCode = await publicCode();
  const registered = await pool!.query(
    `insert into participants (public_code,account_id,type,source) values ($1,$2,'registered','web') returning id`,
    [registeredCode, participantAccount.rows[0].id],
  );
  participantIds.push(registered.rows[0].id);
  const anonymous = await pool!.query(
    `insert into participants (public_code,type,anonymous_ordinal,source) values ($1,'anonymous',$2,'web') returning id`,
    [await publicCode(), await allocate("anonymous_ordinal")],
  );
  participantIds.push(anonymous.rows[0].id);
  const excluded = await pool!.query(
    `insert into participants (public_code,account_id,type,source) values ($1,$2,'registered','web') returning id`,
    [await publicCode(), excludedAccount.rows[0].id],
  );
  participantIds.push(excluded.rows[0].id);
  importedCode = await publicCode();
  const imported = await pool!.query(
    `insert into participants (public_code,type,source,source_participant_key) values ($1,'imported','google_form',$2) returning id`,
    [importedCode, `phase7-imported-${runId}`],
  );
  participantIds.push(imported.rows[0].id);

  webFixtureScores = [
    await insertCompletedAttempt({
      participantId: registered.rows[0].id,
      source: "web",
      consent: true,
      answers: answersAt(0),
    }),
    await insertCompletedAttempt({
      participantId: registered.rows[0].id,
      source: "web",
      consent: true,
      answers: answersAt(1),
    }),
    await insertCompletedAttempt({
      participantId: anonymous.rows[0].id,
      source: "web",
      consent: true,
      answers: answersAt(2),
    }),
  ];
  await insertCompletedAttempt({
    participantId: excluded.rows[0].id,
    source: "web",
    consent: false,
    answers: answersAt(0),
  });
  googleFixtureScore = await insertCompletedAttempt({
    participantId: imported.rows[0].id,
    source: "google_form",
    consent: true,
    answers: answersAt(3),
  });

  const incomplete = await pool!.query(
    `insert into assessment_attempts (participant_id,status,source,content_version_id) values ($1,'in_progress','web',$2) returning id`,
    [anonymous.rows[0].id, ASSESSMENT_CONTENT_VERSION],
  );
  attemptIds.push(incomplete.rows[0].id);
  await pool!.query(
    `insert into consents (participant_id,attempt_id,decision,consent_version,source) values ($1,$2,true,'phase7-fixture','web')`,
    [anonymous.rows[0].id, incomplete.rows[0].id],
  );
});

test.afterAll(async () => {
  if (!pool) return;
  if (attemptIds.length) {
    await pool.query(
      `delete from responses where attempt_id = any($1::uuid[])`,
      [attemptIds],
    );
    await pool.query(
      `delete from assessment_draft_answers where attempt_id = any($1::uuid[])`,
      [attemptIds],
    );
    await pool.query(
      `delete from consents where attempt_id = any($1::uuid[])`,
      [attemptIds],
    );
    await pool.query(
      `delete from assessment_attempts where id = any($1::uuid[])`,
      [attemptIds],
    );
  }
  if (participantIds.length) {
    await pool.query(
      `delete from sessions where participant_id = any($1::uuid[])`,
      [participantIds],
    );
    await pool.query(
      `delete from consents where participant_id = any($1::uuid[])`,
      [participantIds],
    );
    await pool.query(`delete from participants where id = any($1::uuid[])`, [
      participantIds,
    ]);
  }
  if (accountIds.length) {
    await pool.query(
      `delete from sessions where account_id = any($1::uuid[])`,
      [accountIds],
    );
    await pool.query(
      `delete from admin_audit where actor_account_id = any($1::uuid[])`,
      [accountIds],
    );
    await pool.query(`delete from accounts where id = any($1::uuid[])`, [
      accountIds,
    ]);
  }
  await pool.end();
});

test("protects analytics and reports consented source-aware metrics and scenarios", async ({
  browser,
}) => {
  const visitor = await browser.newPage();
  await visitor.goto("/en/admin/scenario-analytics/S4");
  await expect(visitor).toHaveURL(/\/en\/admin\/login$/);
  await visitor.close();

  const participantContext = await browser.newContext();
  const participantPage = await participantContext.newPage();
  await participantPage.goto("/en/login");
  await participantPage.getByLabel("Username").fill(participantUsername);
  await participantPage
    .getByLabel("Password", { exact: true })
    .fill(participantPassword);
  await participantPage
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await participantPage.goto("/en/admin/scenario-analytics");
  await expect(participantPage).toHaveURL(/\/en\/admin\/login$/);
  await participantContext.close();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/en/admin/login");
  await page.getByLabel("Username").fill(adminUsername);
  await page.getByLabel("Password", { exact: true }).fill(adminPassword);
  await page.getByRole("button", { name: "Sign in to administration" }).click();
  await expect(page).toHaveURL(/\/en\/admin$/);

  await page.goto("/en/admin?source=web");
  const metric = (label: string) =>
    page.locator(".metric-card").filter({ hasText: label }).locator("strong");
  await expect(metric("Total participants")).toHaveText(
    String(webBefore.participants + 3),
  );
  await expect(metric("Registered users")).toHaveText(
    String(webBefore.registered + 2),
  );
  await expect(metric("Anonymous participants")).toHaveText(
    String(webBefore.anonymous + 1),
  );
  await expect(metric("Completed assessments")).toHaveText(
    String(webBefore.eligible + 3),
  );
  const expectedAverage =
    (webBefore.scoreSum +
      webFixtureScores.reduce((sum, score) => sum + score, 0)) /
    (webBefore.scoreCount + webFixtureScores.length);
  await expect(metric("Average score")).toHaveText(expectedAverage.toFixed(1));
  await expect(page.getByText(excludedUsername)).toHaveCount(0);
  await expect(
    page.getByText("Active source: Website assessments"),
  ).toBeVisible();

  await page.goto("/en/admin?source=google_form");
  await expect(metric("Total participants")).toHaveText(
    String(googleBefore.participants + 1),
  );
  await expect(metric("Completed assessments")).toHaveText(
    String(googleBefore.eligible + 1),
  );
  const googleAverage =
    (googleBefore.scoreSum + googleFixtureScore) /
    (googleBefore.scoreCount + 1);
  await expect(metric("Average score")).toHaveText(googleAverage.toFixed(1));
  await expect(page.getByText(importedCode)).toBeVisible();
  await expect(page.getByText("Google Form import")).toBeVisible();

  await page.goto("/en/admin/scenario-analytics");
  await expect(page.locator(".scenario-analytics-card")).toHaveCount(8);
  await expect(
    page.locator(".scenario-analytics-card").filter({ hasText: "S4" }),
  ).toContainText("ahmed1234567");
  await page.goto("/en/admin/scenario-analytics/S4");
  const optionRows = page.locator("tbody tr");
  await expect(optionRows).toHaveCount(4);
  await expect(optionRows.nth(0)).toContainText("+10");
  await expect(optionRows.nth(1)).toContainText("+10");
  await expect(optionRows.nth(2)).toContainText("-10");
  await expect(optionRows.nth(3)).toContainText("+2");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ar/admin/scenario-analytics/S4?source=google_form");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", {
      name: "أي من كلمات المرور التالية تعتقد أنها الأقوى لاستخدامها في حساب جامعي؟",
    }),
  ).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/admin/scenario-analytics");
  await expect(
    page.getByRole("button", { name: "فتح تنقل الإدارة" }),
  ).toBeVisible();
  await expect(page.locator(".scenario-analytics-card")).toHaveCount(8);
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await context.close();
});
