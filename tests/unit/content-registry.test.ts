import { afterEach, describe, expect, it, vi } from "vitest";
import { e2eFixtureBooks } from "@/content/books/fixtures/e2e-books";
import { realBooks } from "@/content/books/index.generated";
import { createContentRepository } from "@/lib/content-repository";
import { validateBooks } from "@/lib/content-validation";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const realSlugs = realBooks.map((b) => b.slug);
const wakasamaru = realBooks.find((b) => b.slug === "wakasamaru")!;

describe("book registry", () => {
  it("excludes test fixtures from the real catalog by default", async () => {
    vi.stubEnv("LEAF_E2E_FIXTURES", "");
    vi.resetModules();
    const { allBooks } = await import("@/content/books");
    expect(allBooks.map((b) => b.slug)).toEqual(realSlugs);
    expect(allBooks.some((b) => b.slug.startsWith("e2e-"))).toBe(false);
  });

  it("includes the fixtures when LEAF_E2E_FIXTURES=1", async () => {
    vi.stubEnv("LEAF_E2E_FIXTURES", "1");
    vi.resetModules();
    const { allBooks } = await import("@/content/books");
    expect(allBooks.map((b) => b.slug)).toEqual([...realSlugs, "e2e-atlas", "e2e-draft"]);
  });

  it("fixtures are valid next to the real content", () => {
    expect(validateBooks([...realBooks, ...e2eFixtureBooks])).toEqual([]);
  });

  it("the combined catalog behaves as a multi-book library", () => {
    const repo = createContentRepository([wakasamaru, ...e2eFixtureBooks]);
    expect(repo.getPublishedBooks().map((b) => b.slug)).toEqual(["e2e-atlas", "wakasamaru"]);
    expect(repo.getFeaturedBook()?.slug).toBe("wakasamaru");
    expect(repo.getGenres()).toEqual(["Fantasy", "Historical"]);
    expect(repo.getBookBySlug("e2e-draft")).toBeUndefined();
    expect(repo.getBookBySlug("e2e-atlas")?.chapters.map((c) => c.slug)).toEqual(["chapter-01", "chapter-02"]);
    expect(repo.getChapter("e2e-atlas", "chapter-01")?.next).toEqual({ slug: "chapter-02", title: "Chapter Two" });
    expect(repo.getChapter("e2e-atlas", "chapter-02")?.next).toBeNull();
  });
});
