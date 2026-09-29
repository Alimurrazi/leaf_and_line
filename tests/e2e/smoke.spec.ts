import { expect, test } from "@playwright/test";

test("home page responds with the Leaf & Line title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Leaf & Line/);
});
