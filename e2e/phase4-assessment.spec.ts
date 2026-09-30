import { createHmac } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

import { assessmentScenarios } from "@/src/assessment/content";
import { buildRuntimePoolConfig } from "@/src/db/pool-config";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const username = `phase4_${runId}`;
const password = "Phase4-test-123!";
const databaseUrl = process.env.DIRECT_DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const configured = Boolean(databaseUrl && sessionSecret);
const pool = databaseUrl
  ? new Pool(
      buildRuntimePoolConfig(databaseUrl, process.env.SUPABASE_CA_CERT_PATH),
    )
  : null;
const participantCodes = new Set<string>();
let registeredAttemptId = "";

function rateHash(bucket: string, identifier: string) {
  return createHmac("sha256", sessionSecret!)
    .update(`${bucket}:${identifier}`)
    .digest("hex");
}

async function participantCode(page: Page) {
  const token = (await page.context().cookies()).find(
    (cookie) => cookie.name === "cag_session",
  )?.value;
  if (!token || !pool || !sessionSecret) throw new Error("Session unavailable");
  const tokenHash = createHmac("sha256", sessionSecret)
    .update(token)
    .digest("hex");
  const result = await pool.query(
    `select p.public_code
       from sessions s
       join participants p on p.id = s.participant_id
      where s.token_hash = $1`,
    [tokenHash],
  );
  const code = result.rows[0]?.public_code;
  if (!code) throw new Error("Participant code unavailable");
  participantCodes.add(code);
  return code as string;
}

async function clearRateLimits() {
  if (!pool || !sessionSecret) return;
  const hashes = new Set<string>();
  for (const address of ["127.0.0.1", "::1", "::ffff:127.0.0.1", "unknown"]) {
    hashes.add(rateHash("signup", address));
    hashes.add(rateHash("anonymous", address));
    hashes.add(rateHash("loginIp", address));
    hashes.add(rateHash("login", `${address}:${username}`));
  }
  await pool.query(`delete from rate_limits where key_hash = any($1::text[])`, [
    [...hashes],
  ]);
}

test.beforeAll(clearRateLimits);

test.afterAll(async () => {
  if (!pool) return;
  await clearRateLimits();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const participantResult = await client.query(
      `select id, account_id
         from participants
        where public_code = any($1::text[])`,
      [[...participantCodes]],
    );
    const participantIds = participantResult.rows.map((row) => row.id);
    const accountIds = participantResult.rows
      .map((row) => row.account_id)
      .filter(Boolean);
    if (participantIds.length > 0) {
      const attempts = await client.query(
        `select id from assessment_attempts where participant_id = any($1::uuid[])`,
        [participantIds],
      );
      const attemptIds = attempts.rows.map((row) => row.id);
      if (attemptIds.length > 0) {
        await client.query(
          `delete from assessment_draft_answers where attempt_id = any($1::uuid[])`,
          [attemptIds],
        );
        await client.query(
          `delete from responses where attempt_id = any($1::uuid[])`,
          [attemptIds],
        );
      }
      await client.query(
        `delete from consents where participant_id = any($1::uuid[])`,
        [participantIds],
      );
      await client.query(
        `delete from assessment_attempts where participant_id = any($1::uuid[])`,
        [participantIds],
      );
      await client.query(
        `delete from sessions where participant_id = any($1::uuid[])`,
        [participantIds],
      );
      await client.query(
        `delete from participants where id = any($1::uuid[])`,
        [participantIds],
      );
    }
    if (accountIds.length > 0) {
      await client.query(
        `delete from sessions where account_id = any($1::uuid[])`,
        [accountIds],
      );
      await client.query(`delete from accounts where id = any($1::uuid[])`, [
        accountIds,
      ]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
});

test("registered participant resumes answers and keeps scenario through language changes", async ({
  page,
}) => {
  test.skip(!configured, "Database and session configuration are required");
  await page.goto("http://localhost:3000/en/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  const signupResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/signup"),
  );
  await page.getByRole("button", { name: "Create account" }).click();
  const signup = await signupResponse;
  expect(signup.ok(), await signup.text()).toBe(true);
  await expect(page).toHaveURL(/\/en\/home$/, { timeout: 15_000 });
  const registeredCode = await participantCode(page);

  await page.goto("http://localhost:3000/en/start");
  await expect(page).toHaveURL(/\/en\/home$/);
  await page.goto("http://localhost:3000/ar/start");
  await expect(page).toHaveURL(/\/ar\/home$/);
  await page.goto("http://localhost:3000/en");
  await expect(
    page.locator("main").getByRole("link", {
      name: "Start assessment",
      exact: true,
    }),
  ).toHaveAttribute("href", "/en/home");
  await expect(page.locator(".participant-button")).toHaveAttribute(
    "href",
    "/en/home",
  );
  await page.goto("http://localhost:3000/en/home");

  await page
    .locator("main")
    .getByRole("link", { name: "Start assessment" })
    .click();
  await page.getByRole("radio", { name: "Yes, I agree." }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Cybersecurity Awareness Assessment" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Begin Scenario 1" }).click();

  const firstOption = assessmentScenarios[0].options[0].en;
  const firstSaveResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/assessment/progress"),
  );
  await page.getByRole("radio", { name: firstOption }).check();
  expect((await firstSaveResponse).ok()).toBe(true);
  await expect(page.getByText("Answer saved", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("link", { name: "CyberAwareGaza home" }).click();
  const leaveDialogElement = page.locator(".leave-assessment-dialog");
  const leaveDialog = page.getByRole("dialog", {
    name: "Your assessment is still in progress",
  });
  await expect(leaveDialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Stay on assessment" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(leaveDialog).toBeHidden();
  await expect(page.getByRole("radio", { name: firstOption })).toBeChecked();

  await page.getByRole("link", { name: "CyberAwareGaza home" }).click();
  await page.getByRole("button", { name: "Stay on assessment" }).click();
  await expect(leaveDialog).toBeHidden();
  await expect(page).toHaveURL(/\/en\/assessment\?scenario=1$/);
  await expect(page.getByRole("radio", { name: firstOption })).toBeChecked();

  await page.getByRole("link", { name: "CyberAwareGaza home" }).click();
  await page.getByRole("link", { name: "Leave assessment" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(leaveDialogElement).toBeHidden();
  await expect(leaveDialogElement).not.toHaveAttribute("open", "");
  await expect(
    page.locator("main").getByRole("link", {
      name: "Start assessment",
      exact: true,
    }),
  ).toHaveAttribute("href", "/en/home");
  await page.reload();
  await expect(page).toHaveURL(/\/en$/);
  await expect(leaveDialogElement).toBeHidden();
  await expect(leaveDialogElement).not.toHaveAttribute("open", "");
  await page.goto("http://localhost:3000/en/assessment?scenario=1");
  await page.reload();
  await expect(page).toHaveURL(/\/en\/assessment\?scenario=1$/);
  await expect(page.getByRole("radio", { name: firstOption })).toBeChecked();

  await page
    .getByRole("group", { name: "Choose interface language" })
    .getByRole("button", { name: "العربية" })
    .click();
  await expect(page).toHaveURL(/\/ar\/assessment\?scenario=1$/);
  await expect(
    page.getByRole("radio", { name: assessmentScenarios[0].options[0].ar }),
  ).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  const arabicQuestion = page.locator(".scenario-question");
  const arabicQuestionStyle = await arabicQuestion.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
  expect(arabicQuestionStyle.fontSize).toBeLessThanOrEqual(27);
  expect(arabicQuestionStyle.lineHeight).toBeGreaterThan(
    arabicQuestionStyle.fontSize,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page
    .getByRole("link", { name: "الصفحة الرئيسية لمنصة CyberAwareGaza" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "لا يزال تقييمك قيد التقدم" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "البقاء في التقييم" }).click();
  await expect(leaveDialogElement).toBeHidden();
  await expect(page).toHaveURL(/\/ar\/assessment\?scenario=1$/);
  await expect(
    page.getByRole("radio", { name: assessmentScenarios[0].options[0].ar }),
  ).toBeChecked();
  await page
    .getByRole("link", { name: "الصفحة الرئيسية لمنصة CyberAwareGaza" })
    .click();
  await page.getByRole("link", { name: "مغادرة التقييم" }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(leaveDialogElement).toBeHidden();
  await expect(leaveDialogElement).not.toHaveAttribute("open", "");
  await page.reload();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(leaveDialogElement).toBeHidden();
  await expect(leaveDialogElement).not.toHaveAttribute("open", "");
  await page.goto("http://localhost:3000/ar/assessment?scenario=1");
  await expect(
    page.getByRole("radio", { name: assessmentScenarios[0].options[0].ar }),
  ).toBeChecked();
  await page
    .getByRole("group", { name: "اختر لغة الواجهة" })
    .getByRole("button", { name: "English" })
    .click();

  for (let index = 1; index < assessmentScenarios.length; index += 1) {
    await page.getByRole("button", { name: "Next scenario" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/en/assessment\\?scenario=${index + 1}$`),
    );
    const saveResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/assessment/progress"),
    );
    await page
      .getByRole("radio", { name: assessmentScenarios[index].options[0].en })
      .check();
    expect((await saveResponse).ok()).toBe(true);
    await expect(page.getByText("Answer saved", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  }

  const submitResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/assessment/submit"),
  );
  await page.getByRole("button", { name: "Submit Assessment" }).click();
  const submitted = await submitResponse;
  const submission = (await submitted.json()) as {
    attemptId: string;
    totalScore: number;
    risk: string;
  };
  expect(submitted.ok(), JSON.stringify(submission)).toBe(true);
  registeredAttemptId = submission.attemptId;
  expect(submission).toMatchObject({ totalScore: 2, risk: "high" });
  await expect(
    page.getByRole("heading", { name: "Assessment submitted" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/en\/home$/, { timeout: 15_000 });
  await expect(page.locator(".identity-list dd").nth(0)).toHaveText(
    "Completed",
  );
  await expect(page.locator(".identity-list dd").nth(1)).toHaveText("1");
  await expect(page.locator(".identity-list dd").nth(2)).toHaveText(
    "High Risk",
  );
  await expect(
    page.getByRole("link", { name: "View your result" }),
  ).toHaveAttribute("href", `/en/results/${registeredAttemptId}`);

  await page.getByRole("link", { name: "View your result" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/en/results/${registeredAttemptId}$`),
  );
  await expect(
    page.getByRole("heading", { name: "Your assessment result" }),
  ).toBeVisible();
  await expect(page.locator(".score-ring-copy strong")).toHaveText("+2");
  await expect(page.locator(".risk-text--high")).toHaveText("High Risk");
  await expect(page.locator(".answer-review-card")).toHaveCount(8);
  await expect(
    page.locator(".answer-review-card").first().getByText(firstOption),
  ).toBeVisible();
  await page.screenshot({
    path: "tmp/phase5-result-en.png",
    fullPage: true,
  });

  const englishRingX = await page
    .locator(".result-score-block")
    .evaluate((element) => element.getBoundingClientRect().x);
  await page
    .getByRole("group", { name: "Choose interface language" })
    .getByRole("button", { name: "العربية" })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/ar/results/${registeredAttemptId}$`),
  );
  await expect(
    page.getByText("Resilience Score", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".answer-review-card")
      .first()
      .getByText(assessmentScenarios[0].options[0].ar),
  ).toBeVisible();
  await page.screenshot({
    path: "tmp/phase5-result-ar.png",
    fullPage: true,
  });
  const arabicRingX = await page
    .locator(".result-score-block")
    .evaluate((element) => element.getBoundingClientRect().x);
  expect(Math.abs(englishRingX - arabicRingX)).toBeLessThanOrEqual(2);

  const retries = await page.evaluate(async (attemptId) => {
    const submitAgain = async () => {
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      return { status: response.status, body: await response.json() };
    };
    return Promise.all([submitAgain(), submitAgain()]);
  }, registeredAttemptId);
  expect(retries).toHaveLength(2);
  for (const retry of retries) {
    expect(retry).toMatchObject({
      status: 200,
      body: { ok: true, completed: true, totalScore: 2, risk: "high" },
    });
  }

  const persisted = await pool!.query(
    `select
       count(distinct a.id)::integer as attempts,
       count(r.scenario_key)::integer as responses
     from assessment_attempts a
     join participants p on p.id = a.participant_id
     left join responses r on r.attempt_id = a.id
     where p.public_code = $1 and a.status = 'completed'`,
    [registeredCode],
  );
  expect(persisted.rows[0]).toMatchObject({ attempts: 1, responses: 8 });
});

test("anonymous participant who declines cannot start an attempt", async ({
  page,
}) => {
  test.skip(!configured, "Database and session configuration are required");
  await page.goto("http://localhost:3000/en/anonymous");
  const anonymousResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/anonymous"),
  );
  await page.getByRole("button", { name: "I understand — continue" }).click();
  expect((await anonymousResponse).ok()).toBe(true);
  await expect(page).toHaveURL(/\/en\/home$/, { timeout: 15_000 });
  const code = await participantCode(page);
  await page.goto("http://localhost:3000/en/start");
  await expect(page).toHaveURL(/\/en\/home$/);
  await page.goto("http://localhost:3000/ar/start");
  await expect(page).toHaveURL(/\/ar\/home$/);
  await page.goto("http://localhost:3000/en/home");
  await page
    .locator("main")
    .getByRole("link", { name: "Start assessment" })
    .click();
  await page.getByRole("radio", { name: "No, I do not agree." }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Your choice has been respected" }),
  ).toBeVisible();

  const attempts = await pool!.query(
    `select count(*)::integer as count
       from assessment_attempts a
       join participants p on p.id = a.participant_id
      where p.public_code = $1`,
    [code],
  );
  expect(attempts.rows[0].count).toBe(0);
});

test("anonymous results require the owning active anonymous session", async ({
  page,
}) => {
  test.skip(!configured, "Database and session configuration are required");
  test.skip(!registeredAttemptId, "Registered result fixture is required");

  await page.goto("http://localhost:3000/en/anonymous");
  const anonymousResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/anonymous"),
  );
  await page.getByRole("button", { name: "I understand — continue" }).click();
  expect((await anonymousResponse).ok()).toBe(true);
  await expect(page).toHaveURL(/\/en\/home$/, { timeout: 15_000 });
  await participantCode(page);

  const denied = await page.goto(
    `http://localhost:3000/en/results/${registeredAttemptId}`,
  );
  expect(denied?.status()).toBe(404);

  await page.goto("http://localhost:3000/en/home");
  await page.getByRole("link", { name: "Start assessment" }).click();
  await page.getByRole("radio", { name: "Yes, I agree." }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Begin Scenario 1" }).click();

  for (let index = 0; index < assessmentScenarios.length; index += 1) {
    const scenario = assessmentScenarios[index];
    const selected = scenario.options[scenario.options.length - 1].en;
    const savedResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/assessment/progress"),
    );
    await page.getByRole("radio", { name: selected }).check();
    expect((await savedResponse).ok()).toBe(true);
    if (index < assessmentScenarios.length - 1) {
      await page.getByRole("button", { name: "Next scenario" }).click();
    }
  }

  const submitResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/assessment/submit"),
  );
  await page.getByRole("button", { name: "Submit Assessment" }).click();
  const submitted = await submitResponse;
  const submission = (await submitted.json()) as { attemptId: string };
  expect(submitted.ok(), JSON.stringify(submission)).toBe(true);
  await expect(page).toHaveURL(/\/en\/home$/, { timeout: 15_000 });
  await page.getByRole("link", { name: "View your result" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/en/results/${submission.attemptId}$`),
  );
  await expect(page.locator(".answer-review-card")).toHaveCount(8);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto(`http://localhost:3000/en/results/${submission.attemptId}`);
  await expect(page).toHaveURL(/\/en\/login$/);
});
