import { expect, test } from "@playwright/test";

const READER = "/read/wakasamaru/chapter-01";

test("direct navigation opens the requested page", async ({ page }) => {
  await page.goto(`${READER}?page=7`);
  await expect(page.getByText("Chapter 1 · Page 7 of 14")).toBeVisible();
  await expect(page.getByRole("img", { name: "Wakasamaru, Chapter 1, page 7" })).toBeVisible();
});

test("next and previous buttons update the URL", async ({ page }) => {
  await page.goto(`${READER}?page=1`);
  await expect(page.getByRole("button", { name: "← Previous" })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await page.getByRole("button", { name: "← Previous" }).click();
  await expect(page).toHaveURL(/\?page=1$/);
});

test("arrow keys turn pages", async ({ page }) => {
  await page.goto(`${READER}?page=3`);
  await expect(page.getByText("Page 3 of 14").first()).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\?page=4$/);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\?page=3$/);
});

for (const [raw, expected] of [["abc", "1"], ["0", "1"], ["99", "14"], ["03", "3"]] as const) {
  test(`invalid ?page=${raw} is corrected to ${expected}`, async ({ page }) => {
    await page.goto(`${READER}?page=${raw}`);
    await expect(page).toHaveURL(new RegExp(`\\?page=${expected}$`));
  });
}

test("last page leads to an end-of-chapter state", async ({ page }) => {
  await page.goto(`${READER}?page=14`);
  await page.getByRole("button", { name: "Finish chapter" }).click();
  const end = page.getByRole("region", { name: "End of Chapter 1" });
  await expect(end).toBeVisible();
  await expect(end.getByRole("link", { name: "Back to book" })).toHaveAttribute("href", "/books/wakasamaru");
  await end.getByRole("button", { name: "Reread last page" }).click();
  await expect(end).toHaveCount(0);
});

test("reading saves progress that the book page offers to continue", async ({ page }) => {
  await page.goto(`${READER}?page=5`);
  await expect(page.getByText("Page 5 of 14").first()).toBeVisible();
  await page.goto("/books/wakasamaru");
  await expect(page.getByRole("link", { name: "Continue · Chapter 1, page 5" })).toBeVisible();
});

test("unknown chapter returns 404", async ({ page }) => {
  const response = await page.goto("/read/wakasamaru/chapter-99?page=1");
  expect(response?.status()).toBe(404);
});

test("page fits a short, wide viewport without cropping", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto(`${READER}?page=1`);
  const img = page.getByRole("img", { name: /18 March 1971/ });
  await expect(img).toBeVisible();
  const stage = await page.getByTestId("reader-stage").boundingBox();
  const box = await img.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(stage!.width + 1);
  expect(box!.height).toBeLessThanOrEqual(stage!.height + 1);
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe("contain");
  const scrolls = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
  expect(scrolls).toBe(false);
});

test("chapter menu lists chapters", async ({ page }) => {
  await page.goto(`${READER}?page=2`);
  await page.getByText("Chapters", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Chapter 1" })).toHaveAttribute("aria-current", "page");
});
