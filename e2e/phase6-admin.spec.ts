import { createHmac } from "node:crypto";

import { hash } from "@node-rs/argon2";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { buildRuntimePoolConfig } from "@/src/db/pool-config";
import { classifyRisk } from "@/src/scoring/risk";
import { ASSESSMENT_CONTENT_VERSION } from "@/src/assessment/content";
import { RUBRIC_VERSION } from "@/src/scoring/rubric";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const adminUsername = `phase6_admin_${runId}`;
const participantUsername = `phase6_user_${runId}`;
const rateUsername = `phase6_rate_${runId}`;
const bootstrapPassword = "Bootstrap-admin-123!";
const changedPassword = "Changed-admin-password-456!";
const participantPassword = "Participant-password-123!";
const databaseUrl = process.env.DIRECT_DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const configured = Boolean(databaseUrl && sessionSecret);
const pool = databaseUrl
  ? new Pool(
      buildRuntimePoolConfig(databaseUrl, process.env.SUPABASE_CA_CERT_PATH),
    )
  : null;
const accountIds: string[] = [];
const participantIds: string[] = [];
const attemptIds: string[] = [];
let registeredCode = "";
let anonymousCode = "";
let latestAttemptId = "";
let latestScore = 0;

async function pageOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.body.scrollWidth - window.innerWidth);
}

async function allocate(key: string) {
  const result = await pool!.query(
    `update counters set value = value + 1 where key = $1 returning value`,
    [key],
  );
  return Number(result.rows[0].value);
}

async function passwordHash(password: string) {
  return hash(password, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
}

function rateHash(bucket: string, identifier: string) {
  return createHmac("sha256", sessionSecret!)
    .update(`${bucket}:${identifier}`)
    .digest("hex");
}

test.beforeAll(async () => {
  test.skip(!configured, "Database and session configuration are required");
  const admin = await pool!.query(
    `insert into accounts (normalized_username, username, display_name, password_hash, role, must_change_password) values ($1,$1,'Phase 6 Admin',$2,'admin',true) returning id`,
    [adminUsername, await passwordHash(bootstrapPassword)],
  );
  accountIds.push(admin.rows[0].id);
  const account = await pool!.query(
    `insert into accounts (normalized_username, username, password_hash, role) values ($1,$1,$2,'participant') returning id`,
    [participantUsername, await passwordHash(participantPassword)],
  );
  accountIds.push(account.rows[0].id);
  const registeredOrdinal = await allocate("participant_public_code");
  registeredCode = `CAG-${String(registeredOrdinal).padStart(4, "0")}`;
  const registered = await pool!.query(
    `insert into participants (public_code, account_id, type, source) values ($1,$2,'registered','web') returning id`,
    [registeredCode, account.rows[0].id],
  );
  participantIds.push(registered.rows[0].id);
  const anonymousPublicOrdinal = await allocate("participant_public_code");
  const anonymousOrdinal = await allocate("anonymous_ordinal");
  anonymousCode = `CAG-${String(anonymousPublicOrdinal).padStart(4, "0")}`;
  const anonymous = await pool!.query(
    `insert into participants (public_code, type, anonymous_ordinal, source) values ($1,'anonymous',$2,'web') returning id`,
    [anonymousCode, anonymousOrdinal],
  );
  participantIds.push(anonymous.rows[0].id);
  const rules = await pool!.query(
    `select distinct on (scenario_key) scenario_key, option_id, contribution from rubric_entries where rubric_version_id = $1 order by scenario_key, contribution desc, option_id`,
    [RUBRIC_VERSION],
  );
  latestScore = rules.rows.reduce((sum, row) => sum + row.contribution, 0);
  const older = await pool!.query(
    `insert into assessment_attempts (participant_id,status,source,content_version_id,rubric_version_id,total_score,risk,completed_at,started_at) values ($1,'completed','web',$2,$3,0,'high',now()-interval '2 days',now()-interval '3 days') returning id`,
    [registered.rows[0].id, ASSESSMENT_CONTENT_VERSION, RUBRIC_VERSION],
  );
  attemptIds.push(older.rows[0].id);
  const latest = await pool!.query(
    `insert into assessment_attempts (participant_id,status,source,content_version_id,rubric_version_id,total_score,risk,completed_at) values ($1,'completed','web',$2,$3,$4,$5,now()) returning id`,
    [
      registered.rows[0].id,
      ASSESSMENT_CONTENT_VERSION,
      RUBRIC_VERSION,
      latestScore,
      classifyRisk(latestScore),
    ],
  );
  latestAttemptId = latest.rows[0].id;
  attemptIds.push(latestAttemptId);
  for (const rule of rules.rows)
    await pool!.query(
      `insert into responses (attempt_id,content_version_id,scenario_key,selected_option_id,contribution,feedback_key) values ($1,$2,$3,$4,$5,$6)`,
      [
        latestAttemptId,
        ASSESSMENT_CONTENT_VERSION,
        rule.scenario_key,
        rule.option_id,
        rule.contribution,
        `${RUBRIC_VERSION}:${rule.scenario_key}:${rule.option_id}`,
      ],
    );
  const incomplete = await pool!.query(
    `insert into assessment_attempts (participant_id,status,source,content_version_id) values ($1,'in_progress','web',$2) returning id`,
    [anonymous.rows[0].id, ASSESSMENT_CONTENT_VERSION],
  );
  attemptIds.push(incomplete.rows[0].id);
});

test.afterAll(async () => {
  if (!pool) return;
  if (attemptIds.length > 0) {
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
  if (participantIds.length > 0) {
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
  if (accountIds.length > 0) {
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
  if (accountIds.length > 0) {
    const addresses = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "unknown"];
    const hashes = addresses.flatMap((address) => [
      rateHash("adminLoginIp", address),
      rateHash("loginIp", address),
      rateHash("adminLogin", `${address}:${adminUsername}`),
      rateHash("adminLogin", `${address}:${rateUsername}`),
      rateHash("login", `${address}:${participantUsername}`),
    ]);
    await pool.query(
      `delete from rate_limits where key_hash = any($1::text[])`,
      [hashes],
    );
  }
  await pool.end();
});

test("enforces bootstrap rotation, role boundaries, records, filters, details, and RTL mobile layout", async ({
  browser,
}) => {
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
  await expect(participantPage).toHaveURL(/\/en\/home$/);
  await participantPage.goto(`/en/admin/assessments/${latestAttemptId}`);
  await expect(participantPage).toHaveURL(/\/en\/admin\/login$/);
  await participantContext.close();

  const context = await browser.newContext();
  const page = await context.newPage();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await page.request.post("/api/auth/admin-login", {
      headers: { Origin: "http://localhost:3000" },
      data: {
        locale: "en",
        username: rateUsername,
        password: "Wrong-password-123!",
      },
    });
    expect(response.status()).toBe(attempt < 5 ? 401 : 429);
  }
  await page.goto("/en/admin/login");
  await page.getByLabel("Username").fill(adminUsername);
  await page.getByLabel("Password", { exact: true }).fill(bootstrapPassword);
  await page.getByRole("button", { name: "Sign in to administration" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/settings\?required=1$/);
  await page.goto("/en/admin/participants");
  await expect(page).toHaveURL(/\/en\/admin\/settings\?required=1$/);
  await page.getByLabel("Current password").fill(bootstrapPassword);
  await page.getByLabel("New password", { exact: true }).fill(changedPassword);
  await page.getByLabel("Confirm new password").fill(changedPassword);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(
    page.getByText("Password changed. Your administrator session was rotated."),
  ).toBeVisible();
  await page.goto(`/en/admin/participants?q=${participantUsername}`);
  const row = page.locator("tbody tr").filter({ hasText: participantUsername });
  await expect(row).toContainText(registeredCode);
  await expect(row).toContainText(String(latestScore));
  await page.goto(
    `/en/admin/assessments?q=${participantUsername}&sort=highest`,
  );
  await expect(page.locator("tbody tr").first()).toContainText(
    String(latestScore),
  );
  await page.goto(`/en/admin/participants?q=${anonymousCode}`);
  await expect(page.locator("tbody tr")).toContainText(/Anonymous \d+/);
  await page.goto(`/en/admin/assessments?status=incomplete&type=anonymous`);
  const incompleteRow = page
    .locator("tbody tr")
    .filter({ hasText: anonymousCode });
  await expect(incompleteRow).toContainText(anonymousCode);
  await expect(incompleteRow).toContainText("—");
  await page.goto(`/en/admin/assessments/${latestAttemptId}`);
  await expect(page.locator(".admin-answer-card")).toHaveCount(8);
  await expect(page.getByText("Final raw score").locator("..")).toContainText(
    String(latestScore),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/admin/participants");
  await expect(
    page.getByRole("button", { name: "Open admin navigation" }),
  ).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ar/admin/assessments");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/admin/assessments");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("button", { name: "فتح تنقل الإدارة" }),
  ).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await context.close();
});
