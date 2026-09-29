import { describe, expect, it } from "vitest";
import { resolveContinueTarget } from "@/features/reading-progress/resolve-continue";
import type { Book } from "@/types/content";

const book: Book = {
  id: "b",
  slug: "wakasamaru",
  title: "Wakasamaru",
  synopsis: "",
  genres: [],
  status: "published",
  cover: { url: "/c.webp", width: 2, height: 3, alt: "" },
  chapters: [
    {
      id: "c1",
      slug: "chapter-01",
      title: "Chapter 1",
      order: 1,
      status: "published",
      pages: Array.from({ length: 14 }, (_, i) => ({ id: `p${i + 1}`, order: i + 1, imageUrl: "/p.webp", width: 3, height: 2 })),
    },
  ],
};

const saved = (chapterSlug: string, page: number) => ({ chapterSlug, page, updatedAt: "2026-09-29T10:00:00.000Z" });

describe("resolveContinueTarget", () => {
  it("returns null when there is no saved progress", () => {
    expect(resolveContinueTarget(book, null)).toBeNull();
    expect(resolveContinueTarget(book, undefined)).toBeNull();
  });

  it("links to the saved chapter and page", () => {
    expect(resolveContinueTarget(book, saved("chapter-01", 8))).toEqual({
      chapterSlug: "chapter-01",
      chapterTitle: "Chapter 1",
      page: 8,
      href: "/read/wakasamaru/chapter-01?page=8",
    });
  });

  it("ignores progress for a chapter that no longer exists", () => {
    expect(resolveContinueTarget(book, saved("chapter-09", 3))).toBeNull();
  });

  it("clamps a page past the end of the chapter", () => {
    expect(resolveContinueTarget(book, saved("chapter-01", 40))?.page).toBe(14);
  });
});
