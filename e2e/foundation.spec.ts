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
});

test("Arabic landing route sets the RTL document boundary", async ({
  page,
}) => {
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
