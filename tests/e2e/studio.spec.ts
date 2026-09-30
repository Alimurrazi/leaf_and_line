import { expect, test } from "@playwright/test";

// The studio reads and writes repo files, so a production build must never serve it.
test("the studio is not served by a production build", async ({ page }) => {
  for (const path of ["/studio", "/studio/wakasamaru", "/studio/wakasamaru?step=6", "/studio/preview/wakasamaru/chapter-01"]) {
    expect((await page.goto(path))?.status(), path).toBe(404);
  }
});
