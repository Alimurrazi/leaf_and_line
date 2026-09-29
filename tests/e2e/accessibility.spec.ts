import { expect, test } from "@playwright/test";

test("reader exposes progress and announces the page", async ({ page }) => {
  await page.goto("/read/wakasamaru/chapter-01?page=4");
  const bar = page.getByRole("progressbar", { name: "Chapter progress" });
  await expect(bar).toHaveAttribute("aria-valuenow", "4");
  await expect(bar).toHaveAttribute("aria-valuemax", "14");
  await expect(page.locator("[aria-live='polite']")).toHaveText("Page 4 of 14");
});

test("skip link moves to main content", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard check");
  await page.goto("/library");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("reduced motion disables transitions", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const duration = await page
    .getByRole("link", { name: /Discover Wakasamaru/ })
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration.split(",").every((d) => parseFloat(d) === 0)).toBe(true);
  await context.close();
});

test("important controls are at least 44px tall", async ({ page }) => {
  await page.goto("/read/wakasamaru/chapter-01?page=1");
  for (const name of ["← Previous", "Next →", "Fullscreen"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
