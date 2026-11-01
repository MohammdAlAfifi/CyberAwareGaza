import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { getDictionary, type Locale } from "@/src/i18n";
import { ratingFields } from "@/src/feedback/validation";

// Mount the production components without sessions or a database. The Next Link
// adapter preserves normal href navigation; only network storage is simulated.
// esbuild is already installed with drizzle-kit; no dependency changes are needed.
const requireFromDrizzle = createRequire(
  createRequire(`${process.cwd()}/package.json`).resolve("drizzle-kit"),
);
const { build } = requireFromDrizzle("esbuild") as {
  build(
    options: Record<string, unknown>,
  ): Promise<{ outputFiles: { path: string; text: string }[] }>;
};
const attemptId = "4b50db4d-e7a2-44b6-9b30-7d75e5032a18";
let javascript = "";
let css = "";

test.beforeAll(async () => {
  const bundle = await build({
    absWorkingDir: process.cwd(),
    stdin: {
      contents: `import React from 'react';
        import {createRoot} from 'react-dom/client';
        import {AssessmentCompletion} from './components/assessment-completion';
        import {AssessmentFeedback} from './components/assessment-feedback';
        const locale = location.pathname.split('/')[1];
        createRoot(document.getElementById('root')).render(<main id="main" className="flow-page assessment-page"><div className="flow-width"><AssessmentCompletion locale={locale}/><AssessmentFeedback locale={locale} attemptId="${attemptId}" submitted={location.search.includes('submitted=1')}/></div></main>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outfile: "feedback.js",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "next-link-test-adapter",
        setup(builder: {
          onResolve(
            options: { filter: RegExp },
            callback: () => { path: string; namespace: string },
          ): void;
          onLoad(
            options: { filter: RegExp; namespace: string },
            callback: () => {
              contents: string;
              loader: string;
              resolveDir: string;
            },
          ): void;
        }) {
          builder.onResolve({ filter: /^next\/link$/ }, () => ({
            path: "link",
            namespace: "test",
          }));
          builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
            contents:
              "export default function Link({children,href,...props}) { return <a href={href} {...props}>{children}</a>; }",
            loader: "tsx",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  javascript = bundle.outputFiles.find((file) =>
    file.path.endsWith(".js"),
  )!.text;
  css =
    readFileSync("app/globals.css", "utf8") +
    bundle.outputFiles.find((file) => file.path.endsWith(".css"))!.text;
});

async function mount(page: Page, locale: Locale, submitted = false) {
  await page.route("http://feedback.test/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/home"))
      return route.fulfill({
        contentType: "text/html",
        body: "<h1>Dashboard</h1>",
      });
    if (url.pathname === "/feedback.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: javascript,
      });
    await route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/feedback.js"></script></body></html>`,
    });
  });
  await page.goto(
    `http://feedback.test/${locale}/assessment/completed/${attemptId}${submitted ? "?submitted=1" : ""}`,
  );
  await expect(
    page.getByRole("heading", { name: getDictionary(locale).feedback.title }),
  ).toBeVisible();
}

async function fill(page: Page, locale: Locale) {
  for (const [index, field] of ratingFields.entries()) {
    await page.locator(`label[for="feedback-${field}-${index + 1}"]`).click();
  }
  await page.locator('label[for="feedback-tech-yes"]').click();
  await page
    .locator('textarea[name="comments"]')
    .fill("Useful feedback / ملاحظات مفيدة");
  await page
    .getByRole("checkbox", { name: getDictionary(locale).feedback.consent })
    .check();
}

for (const locale of ["en", "ar"] as const) {
  const t = getDictionary(locale).feedback;
  test(`${locale}: desktop and mobile layout, scale, and RTL`, async ({
    page,
  }) => {
    await mount(page, locale);
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    await expect(page.getByRole("group")).toHaveCount(6);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole("heading", { name: t.title })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
      const group = page.getByRole("group").first();
      expect(
        await group.evaluate((element) => getComputedStyle(element).direction),
      ).toBe(locale === "ar" ? "rtl" : "ltr");
      const first = await group.locator("label").first().boundingBox();
      const last = await group.locator("label").last().boundingBox();
      expect(locale === "ar" ? first!.x > last!.x : first!.x < last!.x).toBe(
        true,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: `test-results/feedback-${locale}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `test-results/feedback-${locale}-mobile.png`,
      fullPage: true,
    });
  });

  test(`${locale}: Skip and existing Return work with a completely empty survey`, async ({
    page,
  }) => {
    let submissions = 0;
    await mount(page, locale);
    await page.route("**/api/assessment/feedback", async (route) => {
      submissions++;
      await route.abort();
    });
    await page.getByRole("link", { name: t.skip }).click();
    await expect(page).toHaveURL(`http://feedback.test/${locale}/home`);
    await mount(page, locale);
    await page
      .locator(".thank-you-card")
      .getByRole("link", { name: t.dashboard })
      .click();
    await expect(page).toHaveURL(`http://feedback.test/${locale}/home`);
    expect(submissions).toBe(0);
  });

  test(`${locale}: validation, save failure, retained answers, retry, and refresh success`, async ({
    page,
  }) => {
    await mount(page, locale);
    let submissions = 0;
    await page.route("**/api/assessment/feedback", async (route) => {
      submissions++;
      expect(route.request().postDataJSON()).toEqual({
        attemptId,
        navigationRating: 1,
        scenarioClarityRating: 2,
        interactionRating: 3,
        readabilityRating: 4,
        satisfactionRating: 5,
        technicalProblem: true,
        comments: "Useful feedback / ملاحظات مفيدة",
        consent: true,
        language: locale,
      });
      if (submissions === 2) return route.abort("timedout");
      await route.fulfill({
        status: submissions === 1 ? 500 : 200,
        json: { ok: submissions !== 1 },
      });
    });
    await page.getByRole("button", { name: t.submit, exact: true }).click();
    expect(submissions).toBe(0);
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await fill(page, locale);
    await page.getByRole("checkbox").uncheck();
    await page.getByRole("button", { name: t.submit, exact: true }).click();
    expect(submissions).toBe(0);
    await expect(page.getByRole("alert")).toHaveText(t.invalid);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: t.submit, exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(t.saveError);
    await expect(
      page.getByRole("heading", { name: t.successTitle }),
    ).toHaveCount(0);
    await expect(page.locator('textarea[name="comments"]')).toHaveValue(
      "Useful feedback / ملاحظات مفيدة",
    );
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(6);
    await expect(page.getByRole("link", { name: t.skip })).toBeVisible();
    await expect(
      page.locator(".thank-you-card").getByRole("link"),
    ).toBeVisible();
    await page.getByRole("button", { name: t.submit, exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(t.saveError);
    await expect(page.locator('textarea[name="comments"]')).toHaveValue(
      "Useful feedback / ملاحظات مفيدة",
    );
    await page.getByRole("button", { name: t.submit, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: t.successTitle }),
    ).toBeVisible();
    expect(submissions).toBe(3);
    await page
      .getByRole("status")
      .getByRole("link", { name: t.dashboard })
      .click();
    await expect(page).toHaveURL(`http://feedback.test/${locale}/home`);
    await mount(page, locale, true);
    await expect(
      page.getByRole("heading", { name: t.successTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.submit, exact: true }),
    ).toHaveCount(0);
  });

  test(`${locale}: in-flight clicks cannot create duplicate requests and Skip stays usable`, async ({
    page,
  }) => {
    await mount(page, locale);
    let submissions = 0;
    let finishSave = () => {};
    const saving = new Promise<void>((resolve) => {
      finishSave = resolve;
    });
    await page.route("**/api/assessment/feedback", async (route) => {
      submissions++;
      await saving;
      await route.fulfill({ json: { ok: true } });
    });
    await fill(page, locale);
    await page
      .getByRole("button", { name: t.submit, exact: true })
      .evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
    await expect(
      page.getByRole("button", { name: t.submitting, exact: true }),
    ).toBeDisabled();
    await expect.poll(() => submissions).toBe(1);
    expect(submissions).toBe(1);
    try {
      await page.getByRole("link", { name: t.skip }).click();
      await expect(page).toHaveURL(`http://feedback.test/${locale}/home`);
    } finally {
      finishSave();
    }
  });
}
