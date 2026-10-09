import { expect, test } from "@playwright/test";
import { getDictionary } from "../src/i18n";

const phone = { width: 375, height: 667 };

test("mobile landing menu omits participant access in both locales", async ({
  page,
}) => {
  const en = getDictionary("en");
  const ar = getDictionary("ar");

  await page.setViewportSize(phone);
  await page.goto("/en");
  await page.getByRole("button", { name: en.language }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.locator("summary").click();
  const arabicMenu = page.locator(".mobile-menu-panel");
  await expect(
    arabicMenu.getByRole("link", { name: ar.nav.login, exact: true }),
  ).toHaveAttribute("href", "/ar/start");
  await expect(
    arabicMenu.getByRole("link", {
      name: ar.nav.participantAccess,
      exact: true,
    }),
  ).toHaveCount(0);

  await page.goto("/en");
  await page.locator("summary").click();
  const englishMenu = page.locator(".mobile-menu-panel");
  await expect(
    englishMenu.getByRole("link", { name: en.nav.login, exact: true }),
  ).toHaveAttribute("href", "/en/start");
  await expect(
    englishMenu.getByRole("link", {
      name: en.nav.participantAccess,
      exact: true,
    }),
  ).toHaveCount(0);

  await englishMenu
    .getByRole("link", { name: en.nav.login, exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/start$/);
});

test("anonymous session omits protected assessment content responsively", async ({
  page,
}) => {
  const cases = [
    { locale: "en" as const, viewport: { width: 1280, height: 720 } },
    { locale: "en" as const, viewport: phone },
    { locale: "ar" as const, viewport: { width: 1280, height: 720 } },
    { locale: "ar" as const, viewport: phone },
  ];

  for (const { locale, viewport } of cases) {
    const dictionary = getDictionary(locale);
    await page.setViewportSize(viewport);
    await page.goto(`/${locale}/anonymous`);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "ar" ? "rtl" : "ltr",
    );
    await expect(
      page.getByRole("heading", { name: dictionary.auth.anonTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: dictionary.auth.acknowledge }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: dictionary.gate.title }),
    ).toHaveCount(0);
    await expect(page.locator(".source-gate")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
