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
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
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
});
