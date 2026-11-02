import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { expect, test, type Page } from "@playwright/test";

import type { AnalyticsDashboard } from "@/src/admin/analytics-service";
import { getAdminCopy } from "@/src/admin/copy";
import type { FeedbackAnalytics } from "@/src/admin/feedback-analytics";
import { getFeedbackCopy } from "@/src/admin/feedback-copy";
import { feedbackRatingSummary } from "@/src/admin/feedback-statistics";
import { ratingFields } from "@/src/feedback/validation";
import type { Locale } from "@/src/i18n";

// Isolated UI fixtures only. Production aggregates are tested separately against
// PostgreSQL temporary tables; no fake records or sessions enter the live app.
const requireFromDrizzle = createRequire(
  createRequire(`${process.cwd()}/package.json`).resolve("drizzle-kit"),
);
const { build } = requireFromDrizzle("esbuild") as {
  build(
    options: Record<string, unknown>,
  ): Promise<{ outputFiles: { path: string; text: string }[] }>;
};
const dashboard: AnalyticsDashboard = {
  source: "all",
  participants: { total: 11, registered: 4, anonymous: 7, imported: 0 },
  attempts: {
    eligible: 6,
    currentVersion: 6,
    excludedByVersion: 0,
    averageScore: 72.5,
    low: 3,
    medium: 2,
    high: 1,
  },
  riskDistribution: [
    { id: "low", count: 3, percentage: 50 },
    { id: "medium", count: 2, percentage: 33.3 },
    { id: "high", count: 1, percentage: 16.7 },
  ],
  accountDistribution: [
    { id: "registered", count: 4, percentage: 36.4 },
    { id: "anonymous", count: 7, percentage: 63.6 },
  ],
  versions: [],
  activeVersion: null,
  recent: [],
};
const knownRatings = [
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [5, 3, 4, 5, 4],
];
const feedback: FeedbackAnalytics = {
  total: 3,
  completedAssessments: 4,
  responseRate: 75,
  writtenComments: 1,
  questions: ratingFields.map((question, index) =>
    feedbackRatingSummary(
      question,
      knownRatings.map((ratings) => ({
        question,
        rating: ratings[index],
        count: 1,
      })),
    ),
  ),
  technical: {
    validCount: 3,
    yes: { count: 1, percentage: 100 / 3 },
    no: { count: 2, percentage: 200 / 3 },
  },
  comments: [
    {
      id: "isolated-test-comment",
      publicCode: "CAG-900001",
      submittedAt: "2026-11-02T10:00:00Z",
      satisfactionRating: 5,
      technicalProblem: true,
      comments:
        "<script>window.unwantedExecution=true</script>\nملاحظة عربية واختبار لتعليق طويل " +
        "longword".repeat(45),
    },
  ],
};
const empty: FeedbackAnalytics = {
  ...feedback,
  total: 0,
  completedAssessments: 0,
  responseRate: null,
  writtenComments: 0,
  questions: ratingFields.map((question) =>
    feedbackRatingSummary(question, []),
  ),
  technical: {
    validCount: 0,
    yes: { count: 0, percentage: null },
    no: { count: 0, percentage: null },
  },
  comments: [],
};
let javascript = "";
let css = "";

test.beforeAll(async () => {
  const bundle = await build({
    absWorkingDir: process.cwd(),
    stdin: {
      contents: `import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {AdminFeedbackView} from './components/admin-feedback';
      import {AdminDashboardView} from './components/admin-dashboard';
      import {SiteFooter} from './components/site-footer';
      import '@fontsource/inter/latin-400.css'; import '@fontsource/inter/latin-600.css'; import '@fontsource/inter/latin-700.css';
      import '@fontsource/noto-sans-arabic/arabic-400.css'; import '@fontsource/noto-sans-arabic/arabic-600.css'; import '@fontsource/noto-sans-arabic/arabic-700.css';
      const input=window.feedbackFixture;
      const locale=location.pathname.split('/')[1];
      const isDashboard=!location.pathname.endsWith('/feedbacks');
      createRoot(document.getElementById('root')).render(<>{isDashboard?<AdminDashboardView actorName="Isolated test" locale={locale} data={input.dashboard} feedbackCount={input.count}/>:<AdminFeedbackView actorName="Isolated test" locale={locale} data={input.feedback}/>}<SiteFooter locale={locale}/></>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outfile: "admin-feedback.js",
    jsx: "automatic",
    loader: { ".woff2": "dataurl", ".woff": "dataurl" },
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "next-test-adapters",
        setup(builder: {
          onResolve(
            options: { filter: RegExp },
            callback: (args: { path: string }) => {
              path: string;
              namespace: string;
            },
          ): void;
          onLoad(
            options: { filter: RegExp; namespace: string },
            callback: (args: { path: string }) => {
              contents: string;
              loader: string;
              resolveDir: string;
            },
          ): void;
        }) {
          builder.onResolve(
            { filter: /^next\/(link|navigation|image)$/ },
            (args) => ({ path: args.path, namespace: "test" }),
          );
          builder.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
            contents:
              args.path === "next/link"
                ? "export default function Link({children,href,...props}) { return <a href={href} {...props}>{children}</a>; }"
                : args.path === "next/image"
                  ? "export default function Image({priority,...props}) { return <img {...props}/>; }"
                  : "export const usePathname=()=>location.pathname; export const useRouter=()=>({push:(url)=>location.assign(url),replace:(url)=>location.replace(url),refresh:()=>location.reload()});",
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

async function mount(
  page: Page,
  locale: Locale,
  state: "populated" | "empty" | "error" = "populated",
  isDashboard = false,
) {
  await page.route("http://admin-feedback.test/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/admin-feedback.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: javascript,
      });
    if (url.pathname === "/CyberAwareGaza_Logo.jpg")
      return route.fulfill({
        contentType: "image/jpeg",
        body: readFileSync("public/CyberAwareGaza_Logo.jpg"),
      });
    const currentLocale = url.pathname.split("/")[1] === "ar" ? "ar" : "en";
    const fixture = {
      dashboard,
      feedback: state === "error" ? null : state === "empty" ? empty : feedback,
      count: state === "error" ? null : state === "empty" ? 0 : feedback.total,
    };
    await route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="${currentLocale}" dir="${currentLocale === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>window.feedbackFixture=${JSON.stringify(fixture).replaceAll("<", "\\u003c")}</script><script src="/admin-feedback.js"></script></body></html>`,
    });
  });
  await page.goto(
    `http://admin-feedback.test/${locale}/admin${isDashboard ? "" : "/feedbacks"}`,
  );
  await expect(page.locator(".admin-content h1")).toHaveText(
    isDashboard
      ? getAdminCopy(locale).dashboardTitle
      : getFeedbackCopy(locale).title,
  );
  await page.evaluate(() => document.fonts.ready);
}

for (const locale of ["en", "ar"] as const) {
  const t = getFeedbackCopy(locale);
  test(`${locale}: rating distributions, real shared shell, mobile and desktop`, async ({
    page,
  }) => {
    await mount(page, locale);
    await expect(
      page.locator('article[aria-labelledby^="feedback-question-"]'),
    ).toHaveCount(5);
    const first = page.locator(
      'article[aria-labelledby="feedback-question-0"]',
    );
    await expect(first).toContainText("3.7 / 5");
    await expect(first).toContainText("[1] 33.3% (1)");
    await expect(first).toContainText("[5] 66.7% (2)");
    await expect(page.getByRole("table")).toContainText(
      feedback.comments[0].comments,
    );
    expect(await page.evaluate(() => "unwantedExecution" in window)).toBe(
      false,
    );
    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
      expect(
        await first.evaluate((element) => getComputedStyle(element).direction),
      ).toBe(locale === "ar" ? "rtl" : "ltr");
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(
      page.locator('.admin-sidebar a[aria-current="page"]'),
    ).toHaveText(t.nav);
    await page.screenshot({
      path: `test-results/admin-feedback-${locale}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `test-results/admin-feedback-${locale}-mobile.png`,
      fullPage: true,
    });
  });

  test(`${locale}: empty and database-error states remain distinct`, async ({
    page,
  }) => {
    await mount(page, locale, "empty");
    await expect(
      page.getByRole("heading", { name: t.emptyTitle }),
    ).toBeVisible();
    await expect(page.locator("#feedback-ratings-title")).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator(".admin-content")).not.toContainText("0.0%");
    await mount(page, locale, "error");
    await expect(page.getByRole("alert")).toContainText(t.errorTitle);
    await expect(page.getByRole("heading", { name: t.emptyTitle })).toHaveCount(
      0,
    );
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test(`${locale}: dashboard card, existing metric values, and navigation`, async ({
    page,
  }) => {
    await mount(page, locale, "populated", true);
    const cards = page.locator(".analytics-metric-grid > article");
    await expect(cards).toHaveCount(9);
    expect(await cards.locator(":scope > strong").allTextContents()).toEqual([
      "11",
      "4",
      "7",
      "6",
      "3",
      "72.5%",
      "50.0%",
      "33.3%",
      "16.7%",
    ]);
    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: `test-results/admin-feedback-count-${locale}-desktop.png`,
      fullPage: true,
    });
    await page
      .locator("[data-feedback-count]")
      .getByRole("link", { name: t.view })
      .click();
    await expect(page).toHaveURL(
      `http://admin-feedback.test/${locale}/admin/feedbacks`,
    );
    await expect(
      page.getByRole("heading", { name: t.title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: locale === "en" ? "العربية" : "English",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(
      `http://admin-feedback.test/${locale === "en" ? "ar" : "en"}/admin/feedbacks`,
    );
    await mount(page, locale, "error", true);
    await expect(page.locator("[data-feedback-count]")).toContainText(
      t.countError,
    );
    await expect(cards.nth(0).locator("strong")).toHaveText("11");
  });
}

test("the real feedback route redirects a sessionless request to login", async ({
  page,
}) => {
  await page.goto("/en/admin/feedbacks");
  await expect(page).toHaveURL(/\/en\/login$/);
});
