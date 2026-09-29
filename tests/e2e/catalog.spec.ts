import { expect, test } from "@playwright/test";

test("home features the published book and links to it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Stories worth getting lost in." })).toBeVisible();
  await page.getByRole("link", { name: "Discover Wakasamaru →" }).click();
  await expect(page).toHaveURL(/\/books\/wakasamaru$/);
});

test("every genre option comes from the catalog and has at least one book", async ({ page }) => {
  await page.goto("/library");
  const select = page.getByLabel("Filter by genre");
  const values = await select.locator("option").evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
  expect(values[0]).toBe("all");
  expect(values).toContain("Historical");
  expect(values).not.toContain("Science fiction"); // the prototype's placeholder genres are gone
  expect(new Set(values).size).toBe(values.length);
  for (const value of values.slice(1)) {
    await select.selectOption(value);
    await expect(page.getByRole("main").getByRole("heading", { level: 3 }).first()).toBeVisible();
  }
});

test("library search shows an empty state and recovers", async ({ page }) => {
  await page.goto("/library");
  const search = page.getByLabel("Search graphic novels");
  await search.fill("zzz");
  await expect(page.getByText("No published novels match your search.")).toBeVisible();
  await search.fill("waka");
  await expect(page.getByRole("link", { name: /Wakasamaru/ })).toBeVisible();
});

test("library card opens the book page", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("main").getByRole("link", { name: /Wakasamaru/ }).click();
  await expect(page).toHaveURL(/\/books\/wakasamaru$/);
});
