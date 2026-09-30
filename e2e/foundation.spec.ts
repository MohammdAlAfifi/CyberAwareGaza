import { expect, test } from "@playwright/test";

test("English landing route exposes the product shell", async ({ page }) => {
  await page.goto("/en");

  await expect(page).toHaveTitle("Cybersecurity awareness assessment");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  const startLink = page
    .getByRole("link", { name: "Start assessment", exact: true })
    .first();
  await expect(startLink).toBeVisible();
  await expect(startLink).toHaveAttribute("href", "/en/start");
  await expect(page.getByRole("link", { name: "Log in" })).toHaveAttribute(
    "href",
    "/en/start",
  );
  await expect(page.locator(".participant-button")).toHaveAttribute(
    "aria-label",
    "Participant access",
  );
  await expect(page.locator(".participant-button")).toHaveAttribute(
    "href",
    "/en/start",
  );
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);

  await page.goto("/en/start");
  await expect(
    page.getByRole("heading", { name: "How would you like to continue?" }),
  ).toBeVisible();
});

test("Arabic landing route sets the RTL document boundary", async ({
  page,
}) => {
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("link", { name: "ابدأ التقييم", exact: true }).first(),
  ).toHaveAttribute("href", "/ar/start");
  await expect(
    page.getByRole("link", { name: "تسجيل الدخول" }),
  ).toHaveAttribute("href", "/ar/start");

  await page.goto("/ar/start");
  await expect(
    page.getByRole("heading", { name: "كيف ترغب في المتابعة؟" }),
  ).toBeVisible();
});
