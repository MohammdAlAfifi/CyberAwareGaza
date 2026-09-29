import { expect, test } from "@playwright/test";

const viewports = {
  desktop: { width: 1440, height: 1000 },
  phone: { width: 390, height: 844 },
} as const;

const shells = [
  ["landing", ""],
  ["assessment", "/assessment/preview"],
  ["result", "/results/preview"],
  ["admin-login", "/admin/login"],
] as const;

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale} visual shells at ${viewportName} width`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);

      for (const [shellName, route] of shells) {
        await page.goto(`/${locale}${route}`);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );
        await expect(page.locator("main#main")).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);

        await page.screenshot({
          animations: "disabled",
          fullPage: true,
          path: testInfo.outputPath(
            `${locale}-${viewportName}-${shellName}.png`,
          ),
        });
      }
    });
  }
}

test("language switch preserves route and state for the session", async ({
  page,
}) => {
  await page.goto("/en/results/preview?state=error");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();

  await expect(page).toHaveURL(/\/ar\/results\/preview\?state=error$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("cyberaware-locale")),
    )
    .toBe("ar");

  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
});

test("keyboard focus, mobile navigation, and reduced motion are usable", async ({
  page,
}) => {
  await page.setViewportSize(viewports.phone);
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();

  await page.goto("/ar/admin/login");
  await expect(
    page.getByRole("heading", { name: "دخول مسؤول النظام" }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ar/results/preview?state=loading");
  const animationDuration = await page
    .locator(".spinner")
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(animationDuration)).toBeLessThanOrEqual(0.01);
});

test("loading, empty, and error states remain explicitly labelled", async ({
  page,
}) => {
  await page.goto("/en/results/preview?state=loading");
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();

  await page.goto("/en/results/preview");
  await expect(page.getByText("No assessment result yet")).toBeVisible();
  await expect(page.getByLabel("Not calculated")).toContainText("—");

  await page.goto("/en/results/preview?state=error");
  await expect(
    page.getByRole("heading", { name: "Data could not be loaded" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("forms, safety modal, and state controls expose accessible names", async ({
  page,
}) => {
  await page.goto("/en/signup");
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Display name (optional)" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();

  await page.goto("/en/anonymous");
  const trigger = page.getByRole("button", { name: "Preview safety notice" });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Protect your real credentials",
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.goto("/en/results/preview?state=error");
  await expect(page.getByRole("link", { name: "Error" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.setViewportSize(viewports.phone);
  await page.goto("/en/admin/login");
  await expect(
    page.getByRole("heading", { name: "Administrator login" }),
  ).toBeVisible();
});
