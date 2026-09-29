import { expect, test } from "@playwright/test";

const cardTitles = (page: import("@playwright/test").Page) => page.getByRole("main").getByRole("heading", { level: 3 });

test("library lists every published book by title and hides drafts", async ({ page }) => {
  await page.goto("/library");
  await expect(cardTitles(page)).toHaveText(["E2E Atlas", "Wakasamaru"]);
  await expect(page.getByText("E2E Draft")).toHaveCount(0);
});

test("genre filter narrows the catalog per book", async ({ page }) => {
  await page.goto("/library");
  const select = page.getByLabel("Filter by genre");
  await expect(select.locator("option")).toHaveText(["All genres", "Fantasy", "Historical"]);
  await select.selectOption("Fantasy");
  await expect(cardTitles(page)).toHaveText(["E2E Atlas"]);
  await select.selectOption("Historical");
  await expect(cardTitles(page)).toHaveText(["Wakasamaru"]);
});

test("home features the flagged book, not the first by title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Discover Wakasamaru →" })).toBeVisible();
  await expect(cardTitles(page)).toHaveText(["E2E Atlas", "Wakasamaru"]);
});

test("draft books and draft chapters return 404", async ({ page }) => {
  expect((await page.goto("/books/e2e-draft"))?.status()).toBe(404);
  expect((await page.goto("/read/e2e-draft/chapter-01?page=1"))?.status()).toBe(404);
  expect((await page.goto("/read/e2e-atlas/chapter-03?page=1"))?.status()).toBe(404);
});

test("book page lists only released chapters", async ({ page }) => {
  await page.goto("/books/e2e-atlas");
  const chapters = page.getByRole("listitem").getByRole("heading", { level: 3 });
  await expect(chapters).toHaveText(["Chapter One", "Chapter Two"]);
  await expect(page.getByText("Ongoing")).toBeVisible();
  await expect(page.getByText("2 chapters · 5 pages")).toBeVisible();
});

for (const viewport of [
  { width: 1280, height: 500 },
  { width: 390, height: 844 },
]) {
  test(`portrait page fits ${viewport.width}×${viewport.height} without cropping`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/read/e2e-atlas/chapter-01?page=2");
    const img = page.getByRole("img", { name: "E2E Atlas, Chapter One, page 2" });
    await expect(img).toBeVisible();
    const stage = await page.getByTestId("reader-stage").boundingBox();
    const box = await img.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(stage!.width + 1);
    expect(box!.height).toBeLessThanOrEqual(stage!.height + 1);
    expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe("contain");
  });
}

test("page clamping uses each chapter's own page count", async ({ page }) => {
  await page.goto("/read/e2e-atlas/chapter-02?page=9");
  await expect(page).toHaveURL(/\/read\/e2e-atlas\/chapter-02\?page=2$/);
  await expect(page.getByText("Chapter Two · Page 2 of 2")).toBeVisible();
});

test("finishing a chapter leads to the next chapter", async ({ page }) => {
  await page.goto("/read/e2e-atlas/chapter-01?page=3");
  await page.getByRole("button", { name: "Finish chapter" }).click();
  const end = page.getByRole("region", { name: "End of Chapter One" });
  await expect(end.getByRole("link", { name: "Read Chapter Two →" })).toHaveAttribute("href", "/read/e2e-atlas/chapter-02?page=1");
  await end.getByRole("link", { name: "Read Chapter Two →" }).click();
  await expect(page.getByText("Chapter Two · Page 1 of 2")).toBeVisible();
});

test("the last released chapter ends without a next-chapter link", async ({ page }) => {
  await page.goto("/read/e2e-atlas/chapter-02?page=2");
  await page.getByRole("button", { name: "Finish chapter" }).click();
  const end = page.getByRole("region", { name: "End of Chapter Two" });
  await expect(end.getByText("You’ve reached the latest chapter.")).toBeVisible();
  await expect(end.getByRole("link", { name: /^Read / })).toHaveCount(0);
});

test("chapter menu switches chapters within a book", async ({ page }) => {
  await page.goto("/read/e2e-atlas/chapter-01?page=1");
  await page.getByText("Chapters", { exact: true }).click();
  await page.getByRole("link", { name: "Chapter Two" }).click();
  await expect(page).toHaveURL(/\/read\/e2e-atlas\/chapter-02\?page=1$/);
});

test("progress is saved separately for each book", async ({ page }) => {
  await page.goto("/read/e2e-atlas/chapter-02?page=2");
  await expect(page.getByText("Chapter Two · Page 2 of 2")).toBeVisible();
  await page.goto("/read/wakasamaru/chapter-01?page=5");
  await expect(page.getByText("Chapter 1 · Page 5 of 14")).toBeVisible();

  await page.goto("/books/e2e-atlas");
  await expect(page.getByRole("link", { name: "Continue · Chapter Two, page 2" })).toBeVisible();
  await page.goto("/books/wakasamaru");
  await expect(page.getByRole("link", { name: "Continue · Chapter 1, page 5" })).toBeVisible();
});
