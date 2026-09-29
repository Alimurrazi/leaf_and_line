import { expect, test } from "@playwright/test";

const KEY = "leaf-and-line:progress:v1:wakasamaru";

test("first-time reader sees Start Reading but no Continue", async ({ page }) => {
  await page.goto("/books/wakasamaru");
  await expect(page.getByRole("heading", { level: 1, name: "Wakasamaru" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start reading →" })).toHaveAttribute("href", "/read/wakasamaru/chapter-01?page=1");
  await expect(page.getByRole("link", { name: /^Continue/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Chapters" })).toBeVisible();
  await expect(page.getByText("14 pages").first()).toBeVisible();
});

test("book page shows the upright cover and the tagline", async ({ page }) => {
  await page.goto("/books/wakasamaru");
  await expect(page.getByRole("img", { name: /Wakasamaru cover/ })).toBeVisible();
  await expect(page.getByText("A ship, a port and a time of turmoil")).toBeVisible();
});

test("saved progress shows Continue with the right page", async ({ page }) => {
  await page.goto("/books/wakasamaru");
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ chapterSlug: "chapter-01", page: 8, updatedAt: new Date().toISOString() }));
  }, KEY);
  await page.reload();
  await expect(page.getByRole("link", { name: "Continue · Chapter 1, page 8" })).toHaveAttribute(
    "href",
    "/read/wakasamaru/chapter-01?page=8",
  );
});

test("corrupt saved progress is ignored without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/books/wakasamaru");
  await page.evaluate((key) => localStorage.setItem(key, "{not json"), KEY);
  await page.reload();
  await expect(page.getByRole("link", { name: "Start reading →" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Continue/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("unknown book returns 404", async ({ page }) => {
  const response = await page.goto("/books/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
