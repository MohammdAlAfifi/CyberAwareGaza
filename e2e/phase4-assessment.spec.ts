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
  await participantCode(page);

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
  await page.getByRole("radio", { name: firstOption }).check();
  await expect(page.getByText("Answer saved")).toBeVisible();
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
  await page
    .getByRole("group", { name: "اختر لغة الواجهة" })
    .getByRole("button", { name: "English" })
    .click();

  for (let index = 1; index < assessmentScenarios.length; index += 1) {
    await page.getByRole("button", { name: "Next scenario" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/en/assessment\\?scenario=${index + 1}$`),
    );
    await page
      .getByRole("radio", { name: assessmentScenarios[index].options[0].en })
      .check();
    await expect(page.getByText("Answer saved")).toBeVisible();
  }

  await page.getByRole("button", { name: "Submit Assessment" }).click();
  await expect(page.getByText(/final scoring is unavailable/)).toBeVisible();
  await page.goto("http://localhost:3000/en/home");
  await expect(page.locator(".identity-list dd").nth(0)).toHaveText(
    "In Progress",
  );
  await expect(page.locator(".identity-list dd").nth(1)).toHaveText("1");
});

test("anonymous participant who declines cannot start an attempt", async ({
  page,
}) => {
  test.skip(!configured, "Database and session configuration are required");
  await page.goto("http://localhost:3000/en/anonymous");
  await page.getByRole("button", { name: "I understand — continue" }).click();
  await expect(page).toHaveURL(/\/en\/home$/);
  const code = await participantCode(page);
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
