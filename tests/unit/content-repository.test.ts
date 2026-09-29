import { describe, expect, it } from "vitest";
import { allBooks } from "@/content/books";
import { createContentRepository } from "@/lib/content-repository";
import { validateBooks } from "@/lib/content-validation";
import type { Book, Chapter, ComicPage } from "@/types/content";

function makePage(chapterSlug: string, order: number, overrides: Partial<ComicPage> = {}): ComicPage {
  return { id: `${chapterSlug}-p${order}`, order, imageUrl: `/x/${chapterSlug}/${order}.webp`, width: 1536, height: 1024, ...overrides };
}

function makeChapter(slug: string, order: number, overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: `c-${slug}`,
    slug,
    title: `Chapter ${order}`,
    order,
    status: "published",
    pages: [1, 2, 3].map((n) => makePage(slug, n)),
    ...overrides,
  };
}

function makeBook(slug: string, overrides: Partial<Book> = {}): Book {
  return {
    id: slug,
    slug,
    title: slug.toUpperCase(),
    synopsis: `About ${slug}`,
    cover: { url: `/x/${slug}.webp`, width: 1536, height: 1024, alt: `${slug} cover` },
    genres: ["Historical"],
    status: "published",
    chapters: [makeChapter("chapter-01", 1), makeChapter("chapter-02", 2)],
    ...overrides,
  };
}

describe("createContentRepository", () => {
  it("lists only published books", () => {
    const repo = createContentRepository([makeBook("alpha"), makeBook("beta", { status: "draft" }), makeBook("gamma", { status: "review" })]);
    expect(repo.getPublishedBooks().map((b) => b.slug)).toEqual(["alpha"]);
  });

  it("hides unpublished chapters and books left with no chapters", () => {
    const repo = createContentRepository([
      makeBook("alpha", { chapters: [makeChapter("chapter-01", 1), makeChapter("chapter-02", 2, { status: "draft" })] }),
      makeBook("empty", { chapters: [makeChapter("chapter-01", 1, { status: "draft" })] }),
    ]);
    expect(repo.getPublishedBooks().map((b) => b.slug)).toEqual(["alpha"]);
    expect(repo.getBookBySlug("alpha")?.chapters.map((c) => c.slug)).toEqual(["chapter-01"]);
    expect(repo.getChapter("alpha", "chapter-02")).toBeUndefined();
  });

  it("returns undefined for unknown or unpublished books", () => {
    const repo = createContentRepository([makeBook("alpha"), makeBook("beta", { status: "draft" })]);
    expect(repo.getBookBySlug("nope")).toBeUndefined();
    expect(repo.getBookBySlug("beta")).toBeUndefined();
    expect(repo.getChapter("beta", "chapter-01")).toBeUndefined();
  });

  it("links previous and next chapters", () => {
    const repo = createContentRepository([makeBook("alpha")]);
    const first = repo.getChapter("alpha", "chapter-01");
    const second = repo.getChapter("alpha", "chapter-02");
    expect(first?.previous).toBeNull();
    expect(first?.next).toEqual({ slug: "chapter-02", title: "Chapter 2" });
    expect(second?.previous).toEqual({ slug: "chapter-01", title: "Chapter 1" });
    expect(second?.next).toBeNull();
  });

  it("fills missing page alt text and keeps authored alt text", () => {
    const chapter = makeChapter("chapter-01", 1, { pages: [makePage("chapter-01", 1, { alt: "Authored" }), makePage("chapter-01", 2)] });
    const repo = createContentRepository([makeBook("alpha", { title: "Alpha", chapters: [chapter] })]);
    const pages = repo.getChapter("alpha", "chapter-01")!.chapter.pages;
    expect(pages[0].alt).toBe("Authored");
    expect(pages[1].alt).toBe("Alpha, Chapter 1, page 2");
  });

  it("returns unique genres from published books, sorted", () => {
    const repo = createContentRepository([
      makeBook("alpha", { genres: ["Historical", "Drama"] }),
      makeBook("beta", { genres: ["Historical"] }),
      makeBook("gamma", { status: "draft", genres: ["Fantasy"] }),
    ]);
    expect(repo.getGenres()).toEqual(["Drama", "Historical"]);
  });

  it("throws on invalid content", () => {
    expect(() => createContentRepository([makeBook("alpha"), makeBook("alpha")])).toThrow(/Duplicate book slug "alpha"/);
  });

  it("sorts published books by title", () => {
    const repo = createContentRepository([
      makeBook("zeta", { title: "Zeta" }),
      makeBook("alpha", { title: "alpha" }),
      makeBook("mid", { title: "Middle" }),
    ]);
    expect(repo.getPublishedBooks().map((b) => b.title)).toEqual(["alpha", "Middle", "Zeta"]);
  });

  it("features the flagged book, or the first book by title", () => {
    const flagged = createContentRepository([makeBook("alpha", { title: "Alpha" }), makeBook("zeta", { title: "Zeta", featured: true })]);
    expect(flagged.getFeaturedBook()?.slug).toBe("zeta");
    const unflagged = createContentRepository([makeBook("zeta", { title: "Zeta" }), makeBook("alpha", { title: "Alpha" })]);
    expect(unflagged.getFeaturedBook()?.slug).toBe("alpha");
    expect(createContentRepository([]).getFeaturedBook()).toBeUndefined();
  });

  it("ignores a featured flag on a draft book", () => {
    const repo = createContentRepository([makeBook("alpha", { title: "Alpha" }), makeBook("zeta", { status: "draft", featured: true })]);
    expect(repo.getFeaturedBook()?.slug).toBe("alpha");
  });
});

describe("validateBooks", () => {
  it("reports bad slugs, page order gaps and bad dimensions", () => {
    const chapter = makeChapter("Chapter 1", 1, { pages: [makePage("c", 1), makePage("c", 3, { width: 0 })] });
    const errors = validateBooks([makeBook("alpha", { chapters: [chapter] })]);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/invalid slug "Chapter 1"/),
        expect.stringMatching(/Page 2 of "alpha\/Chapter 1" has order 3/),
        expect.stringMatching(/Page 2 of "alpha\/Chapter 1" must have positive integer width and height/),
      ]),
    );
  });

  it("reports chapters out of order and duplicate page ids", () => {
    const a = makeChapter("chapter-01", 2);
    const b = makeChapter("chapter-02", 1, { pages: [makePage("x", 1, { id: "dup" }), makePage("x", 2, { id: "dup" })] });
    const errors = validateBooks([makeBook("alpha", { chapters: [a, b] })]);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Chapter "alpha\/chapter-01" has order 2/),
        expect.stringMatching(/Duplicate page id "dup" in "alpha"/),
      ]),
    );
  });

  it("rejects more than one featured book", () => {
    const errors = validateBooks([makeBook("alpha", { featured: true }), makeBook("beta", { featured: true })]);
    expect(errors).toContain('More than one featured book: "alpha", "beta"');
  });

  it("accepts the real content", () => {
    expect(validateBooks(allBooks)).toEqual([]);
  });
});
