import { expect, test } from "@playwright/test";

test("header shows the wordmark and main navigation", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Leaf & Line" })).toBeVisible();
  await expect(page.getByText("NOVEL PLATFORM")).toHaveCount(0);
});

test("desktop navigation links are visible", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Library" })).toBeVisible();
});

test("mobile menu toggles navigation", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Library" })).toBeVisible();
});

test("public pages use the warm white background", async ({ page }) => {
  await page.goto("/");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(250, 249, 246)");
});
