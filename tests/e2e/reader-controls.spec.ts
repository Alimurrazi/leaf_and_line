import { expect, test } from "@playwright/test";

const READER = "/read/wakasamaru/chapter-01?page=1";

test("zoom buttons change and reset the zoom level", async ({ page, isMobile }) => {
  test.skip(isMobile, "the +/- buttons are hidden on small screens; pinch is used there");
  await page.goto(READER);
  const reset = page.getByRole("button", { name: /Reset zoom/ });
  await expect(reset).toHaveText("100%");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(reset).not.toHaveText("100%");
  await reset.click();
  await expect(reset).toHaveText("100%");
});

test("zoom keeps keyboard focus on the control", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop keyboard check");
  await page.goto(READER);
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  await zoomIn.focus();
  await page.keyboard.press("Enter");
  await expect(zoomIn).toBeFocused();
});

test("fullscreen falls back to immersive mode when the API is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Document.prototype, "fullscreenEnabled", { get: () => false });
  });
  await page.goto(READER);
  await page.getByRole("button", { name: "Fullscreen" }).click();
  const shell = page.locator("[data-immersive='true']");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("button", { name: "Next →" })).toBeVisible();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await page.keyboard.press("Escape");
  await expect(shell).toHaveCount(0);
});
