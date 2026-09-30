import { createHmac } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

import { buildRuntimePoolConfig } from "@/src/db/pool-config";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const participantA = `phase3_a_${runId}`;
const participantB = `phase3_b_${runId}`;
const passwordA = "Abcd123!";
const passwordB = "Efgh456!";
const adminUsername = process.env.PHASE3_ADMIN_USERNAME;
const adminPassword = process.env.PHASE3_ADMIN_PASSWORD;
const databaseUrl = process.env.DIRECT_DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const participantChecksConfigured = Boolean(databaseUrl && sessionSecret);
const adminCheckConfigured = Boolean(
  participantChecksConfigured && adminUsername && adminPassword,
);

const pool = databaseUrl
  ? new Pool(
      buildRuntimePoolConfig(databaseUrl, process.env.SUPABASE_CA_CERT_PATH),
    )
  : null;
const createdCodes = new Set<string>();
const createdAttemptIds = new Set<string>();
const testContentVersion = `phase3-content-${runId}`;
const testRubricVersion = `phase3-rubric-${runId}`;

function rateHash(bucket: string, identifier: string) {
  return createHmac("sha256", sessionSecret!)
    .update(`${bucket}:${identifier}`)
    .digest("hex");
}

async function clearTestRateLimits() {
  if (!pool || !sessionSecret) return;
  const addresses = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "unknown"];
  const hashes = new Set<string>();
  for (const address of addresses) {
    hashes.add(rateHash("signup", address));
    hashes.add(rateHash("anonymous", address));
    hashes.add(rateHash("loginIp", address));
    hashes.add(rateHash("adminLoginIp", address));
    for (const username of [participantA, participantB, `missing_${runId}`]) {
      hashes.add(rateHash("login", `${address}:${username}`));
    }
    hashes.add(rateHash("adminLogin", `${address}:rate_admin_${runId}`));
    if (adminUsername) {
      hashes.add(rateHash("adminLogin", `${address}:${adminUsername}`));
    }
  }
  await pool.query(`delete from rate_limits where key_hash = any($1::text[])`, [
    [...hashes],
  ]);
}

async function participantCode(page: Page) {
  if (!pool || !sessionSecret) throw new Error("Session lookup is unavailable");
  const token = (await page.context().cookies()).find(
    (cookie) => cookie.name === "cag_session",
  )?.value;
  if (!token) throw new Error("Participant session cookie was not set");
  const tokenHash = createHmac("sha256", sessionSecret)
    .update(token)
    .digest("hex");
  const result = await pool.query(
    `select participants.public_code
       from sessions
       join participants on participants.id = sessions.participant_id
      where sessions.token_hash = $1`,
    [tokenHash],
  );
  const code = result.rows[0]?.public_code;
  if (!code) throw new Error("Participant code was not resolved");
  createdCodes.add(code);
  return code;
}

function summaryValue(page: Page, label: string) {
  return page
    .locator(".identity-list > div")
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator("dd");
}

async function createInProgressAttempt(publicCode: string) {
  const result = await pool!.query(
    `insert into assessment_attempts (participant_id, status, source)
     select id, 'in_progress', 'web'
       from participants
      where public_code = $1
     returning id`,
    [publicCode],
  );
  const attemptId = result.rows[0]?.id;
  if (!attemptId) throw new Error("Test attempt was not created");
  createdAttemptIds.add(attemptId);
  return attemptId as string;
}

async function completeAttempt(attemptId: string) {
  await pool!.query(
    `update assessment_attempts
        set status = 'completed',
            content_version_id = $2,
            rubric_version_id = $3,
            total_score = 25,
            risk = 'low',
            completed_at = now(),
            updated_at = now()
      where id = $1`,
    [attemptId, testContentVersion, testRubricVersion],
  );
}

async function signUp(
  page: Page,
  locale: "en" | "ar",
  username: string,
  password: string,
) {
  await page.goto(`/${locale}/signup`);
  await page
    .getByLabel(locale === "ar" ? "اسم المستخدم" : "Username")
    .fill(username);
  await page
    .getByLabel(
      locale === "ar" ? "الاسم الظاهر (اختياري)" : "Display name (optional)",
    )
    .fill(`Display ${username}`);
  await page
    .getByLabel(locale === "ar" ? "كلمة المرور" : "Password", {
      exact: true,
    })
    .fill(password);
  await page
    .getByLabel(locale === "ar" ? "تأكيد كلمة المرور" : "Confirm password")
    .fill(password);
  const signupResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/signup"),
  );
  await page
    .getByRole("button", {
      name: locale === "ar" ? "إنشاء الحساب" : "Create account",
    })
    .click();
  const response = await signupResponse;
  expect(response.ok(), await response.text()).toBe(true);
  await expect(page).toHaveURL(new RegExp(`/${locale}/home$`));
  return participantCode(page);
}

test.beforeAll(async () => {
  await clearTestRateLimits();
  if (!pool) return;
  await pool.query(
    `insert into content_versions (id, label)
     values ($1, 'Phase 3 dashboard test content')`,
    [testContentVersion],
  );
  await pool.query(
    `insert into rubric_versions (id, content_version_id, label)
     values ($1, $2, 'Phase 3 dashboard test rubric')`,
    [testRubricVersion, testContentVersion],
  );
});

test.afterAll(async () => {
  if (!pool) return;
  await clearTestRateLimits();
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (createdAttemptIds.size > 0) {
      await client.query(
        `delete from assessment_attempts where id = any($1::uuid[])`,
        [[...createdAttemptIds]],
      );
    }
    const usernames = [participantA, participantB, adminUsername].filter(
      Boolean,
    );
    const accountResult = await client.query(
      `select id from accounts where normalized_username = any($1::text[])`,
      [usernames],
    );
    const accountIds = accountResult.rows.map((row) => row.id);
    if (accountIds.length > 0) {
      await client.query(
        `delete from sessions where account_id = any($1::uuid[])`,
        [accountIds],
      );
      await client.query(
        `delete from participants where account_id = any($1::uuid[])`,
        [accountIds],
      );
      await client.query(
        `delete from admin_audit where actor_account_id = any($1::uuid[])`,
        [accountIds],
      );
      await client.query(`delete from accounts where id = any($1::uuid[])`, [
        accountIds,
      ]);
    }
    if (createdCodes.size > 0) {
      await client.query(
        `delete from participants where public_code = any($1::text[])`,
        [[...createdCodes]],
      );
    }
    await client.query(`delete from rubric_versions where id = $1`, [
      testRubricVersion,
    ]);
    await client.query(`delete from content_versions where id = $1`, [
      testContentVersion,
    ]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
});

test("registered signup, rotation, returning login, ownership, and role isolation", async ({
  browser,
}, testInfo) => {
  test.skip(
    !participantChecksConfigured,
    "Database and session configuration are required",
  );
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const codeA = await signUp(pageA, "en", participantA, passwordA);
  await expect(summaryValue(pageA, "Assessment Status")).toHaveText(
    "Not Started",
  );
  await expect(summaryValue(pageA, "Attempts")).toHaveText("0");
  await expect(summaryValue(pageA, "Security rate")).toHaveText(
    "Not rated yet",
  );
  await expect(summaryValue(pageA, "Security rate")).toHaveCSS(
    "color",
    "rgb(142, 153, 161)",
  );
  await pageA.goto("/en/start");
  await expect(pageA).toHaveURL(/\/en\/home$/);
  await pageA.goto("/en");
  await expect(
    pageA.locator("main").getByRole("link", {
      name: "Start assessment",
      exact: true,
    }),
  ).toHaveAttribute("href", "/en/home");
  await expect(pageA.locator(".participant-button")).toHaveAttribute(
    "aria-label",
    "Participant dashboard",
  );
  await expect(pageA.locator(".participant-button")).toHaveAttribute(
    "href",
    "/en/home",
  );
  await pageA.goto("/en/home");
  await expect(
    pageA.getByRole("link", { name: "Start assessment", exact: true }),
  ).toHaveAttribute("href", "/en/assessment");
  await expect(pageA.getByRole("link", { name: "Log in" })).toHaveCount(0);
  await expect(pageA.getByRole("button", { name: "Sign out" })).toHaveCount(1);
  const firstCookie = (await contextA.cookies()).find(
    (cookie) => cookie.name === "cag_session",
  );
  const firstToken = firstCookie?.value;
  expect(firstCookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(firstCookie!.expires).toBeGreaterThan(0);

  await pageA.getByRole("button", { name: "Sign out" }).click();
  await expect(pageA).toHaveURL(/\/en$/);
  await pageA.goto("/en/login");
  await pageA.getByLabel("Username").fill(participantA);
  await pageA.getByLabel("Password", { exact: true }).fill(passwordA);
  const loginResponse = pageA.waitForResponse((response) =>
    response.url().endsWith("/api/auth/login"),
  );
  await pageA.getByRole("button", { name: "Sign in" }).click();
  const returnedLogin = await loginResponse;
  expect(returnedLogin.ok(), await returnedLogin.text()).toBe(true);
  await expect(pageA).toHaveURL(/\/en\/home$/);
  expect(await participantCode(pageA)).toBe(codeA);
  await expect(summaryValue(pageA, "Security rate")).toHaveText(
    "Not rated yet",
  );
  expect(
    await pageA.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await pageA.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("registered-en-desktop.png"),
  });
  const rotatedToken = (await contextA.cookies()).find(
    (cookie) => cookie.name === "cag_session",
  )?.value;
  expect(rotatedToken).toBeTruthy();
  expect(rotatedToken).not.toBe(firstToken);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.setViewportSize({ width: 390, height: 844 });
  const codeB = await signUp(pageB, "ar", participantB, passwordB);
  await expect(summaryValue(pageB, "حالة التقييم")).toHaveText("لم يبدأ");
  await expect(summaryValue(pageB, "المحاولات")).toHaveText(/[٠0]/);
  await expect(summaryValue(pageB, "معدل الأمان")).toHaveText("لم يُقيَّم بعد");
  const attemptB = await createInProgressAttempt(codeB);
  await pageB.reload();
  await expect(summaryValue(pageB, "حالة التقييم")).toHaveText("قيد التقدم");
  await expect(summaryValue(pageB, "المحاولات")).toHaveText(/[١1]/);
  await pageA.reload();
  await expect(summaryValue(pageA, "Assessment Status")).toHaveText(
    "Not Started",
  );
  await expect(summaryValue(pageA, "Attempts")).toHaveText("0");
  await completeAttempt(attemptB);
  await pageB.reload();
  await expect(summaryValue(pageB, "حالة التقييم")).toHaveText("مكتمل");
  await expect(summaryValue(pageB, "معدل الأمان")).toHaveText("مخاطر منخفضة");
  await expect(summaryValue(pageB, "معدل الأمان")).toHaveClass(/--low/);
  await expect(summaryValue(pageB, "معدل الأمان")).toHaveCSS(
    "color",
    "rgb(21, 128, 61)",
  );
  expect(
    await pageB.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await pageB.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("registered-ar-phone.png"),
  });
  await pageB
    .getByRole("group", { name: "اختر لغة الواجهة" })
    .getByRole("button", { name: "English" })
    .click();
  await expect(pageB).toHaveURL(/\/en\/home$/);
  expect(await participantCode(pageB)).toBe(codeB);
  const forbidden = await pageA.request.get(`/api/participants/${codeB}`);
  expect(forbidden.status()).toBe(403);
  const own = await pageA.request.get(`/api/participants/${codeA}`);
  expect(own.status()).toBe(200);

  const crossOrigin = await pageA.request.post("/api/auth/logout", {
    headers: { Origin: "https://attacker.invalid" },
  });
  expect(crossOrigin.status()).toBe(403);
  await pageA.goto("/en/home");
  await expect(pageA).toHaveURL(/\/en\/home$/);

  const wrongExisting = await pageA.request.post("/api/auth/login", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { locale: "en", username: participantA, password: `${passwordA}x` },
  });
  const missingAccount = await pageA.request.post("/api/auth/login", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {
      locale: "en",
      username: `missing_${runId}`,
      password: `${passwordA}x`,
    },
  });
  expect((await wrongExisting.json()).code).toBe("invalid_credentials");
  expect((await missingAccount.json()).code).toBe("invalid_credentials");

  await pageA.goto("/en/admin");
  await expect(pageA).toHaveURL(/\/en\/admin\/login$/);

  const injected = await pageA.request.post("/api/auth/signup", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {
      locale: "en",
      username: `phase3_role_${runId}`,
      displayName: "Role injection",
      password: passwordA,
      confirmPassword: passwordA,
      role: "admin",
    },
  });
  expect(injected.status()).toBe(400);

  await contextB.close();
  await contextA.close();
});

test("anonymous access is isolated, revocable, and expires server-side", async ({
  browser,
}, testInfo) => {
  test.skip(
    !participantChecksConfigured,
    "Database and session configuration are required",
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/anonymous");
  const anonymousResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/anonymous"),
  );
  await page.getByRole("button", { name: "فهمت — متابعة" }).click();
  expect((await anonymousResponse).ok()).toBe(true);
  await expect(page).toHaveURL(/\/ar\/home$/, { timeout: 15_000 });
  await participantCode(page);
  await expect(summaryValue(page, "حالة التقييم")).toHaveText("لم يبدأ");
  await expect(summaryValue(page, "المحاولات")).toHaveText(/[٠0]/);
  await expect(summaryValue(page, "معدل الأمان")).toHaveText("لم يُقيَّم بعد");
  await page.goto("/ar/start");
  await expect(page).toHaveURL(/\/ar\/home$/);
  await page.goto("/ar");
  await expect(
    page.locator("main").getByRole("link", {
      name: "ابدأ التقييم",
      exact: true,
    }),
  ).toHaveAttribute("href", "/ar/home");
  await expect(page.locator(".participant-button")).toHaveAttribute(
    "aria-label",
    "لوحة المشارك",
  );
  await page.goto("/ar/home");
  await page.locator("summary[aria-label='القائمة']").click();
  await expect(
    page
      .locator(".mobile-menu-panel")
      .getByRole("link", { name: "لوحة المشارك", exact: true }),
  ).toHaveAttribute("href", "/ar/home");
  await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "تسجيل الخروج" }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("anonymous-ar-phone.png"),
  });
  const anonymousCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "cag_session",
  );
  expect(anonymousCookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(anonymousCookie!.expires).toBe(-1);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.goto("/ar/admin");
  await expect(page).toHaveURL(/\/ar\/admin\/login$/);
  const other = await page.request.get("/api/participants/CAG-999999999");
  expect(other.status()).toBe(403);
  await page.goto("/ar/home");
  await page.locator("summary[aria-label='القائمة']").click();
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await page.goto("/ar/home");
  await expect(page).toHaveURL(/\/ar\/login$/);
  await context.close();

  const expiryContext = await browser.newContext();
  const expiryPage = await expiryContext.newPage();
  await expiryPage.goto("/en/anonymous");
  await expiryPage
    .getByRole("button", { name: "I understand — continue" })
    .click();
  await expect(expiryPage).toHaveURL(/\/en\/home$/);
  await participantCode(expiryPage);
  await expiryPage.setViewportSize({ width: 1440, height: 1000 });
  await expiryPage.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("anonymous-en-desktop.png"),
  });
  const token = (await expiryContext.cookies()).find(
    (cookie) => cookie.name === "cag_session",
  )?.value;
  expect(token).toBeTruthy();
  const tokenHash = createHmac("sha256", sessionSecret!)
    .update(token!)
    .digest("hex");
  const expired = await pool!.query(
    `update sessions set expires_at = now() - interval '1 second' where token_hash = $1`,
    [tokenHash],
  );
  expect(expired.rowCount).toBe(1);
  await expiryPage.goto("/en/home");
  await expect(expiryPage).toHaveURL(/\/en\/login$/);
  await expiryContext.close();
});

test("private admin credentials cross only the admin boundary", async ({
  browser,
}) => {
  test.skip(
    !adminCheckConfigured,
    "Private admin test credentials are required",
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await page.request.post("/api/auth/admin-login", {
      headers: { Origin: "http://127.0.0.1:3000" },
      data: {
        locale: "en",
        username: `rate_admin_${runId}`,
        password: "Wrong-admin-password-123!",
      },
    });
    expect(response.status()).toBe(attempt < 5 ? 401 : 429);
  }
  await page.goto("/en/admin/login");
  await page.getByLabel("Username").fill(adminUsername!);
  await page.getByLabel("Password", { exact: true }).fill(adminPassword!);
  await page.getByRole("button", { name: "Sign in to administration" }).click();
  await expect(page).toHaveURL(/\/en\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Administration dashboard" }),
  ).toBeVisible();
  const participantData = await page.request.get(
    `/api/participants/${[...createdCodes][0]}`,
  );
  expect(participantData.status()).toBe(403);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open admin navigation" }).click();
  await expect(
    page.getByRole("dialog", { name: "Research administration" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await context.close();
});
