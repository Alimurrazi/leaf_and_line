import { describe, expect, it } from "vitest";
import { heroImage } from "@/lib/book-images";
import { validateBooks } from "@/lib/content-validation";
import type { Book } from "@/types/content";

const cover = { url: "/c.webp", width: 1024, height: 1536, alt: "cover" };
const banner = { url: "/b.webp", width: 1536, height: 1024, alt: "banner" };

const book = (overrides: Partial<Book> = {}): Book => ({
  id: "alpha",
  slug: "alpha",
  title: "Alpha",
  synopsis: "",
  genres: [],
  status: "published",
  cover,
  chapters: [
    { id: "c1", slug: "chapter-01", title: "Chapter 1", order: 1, status: "published", pages: [{ id: "p1", order: 1, imageUrl: "/p.webp", width: 3, height: 2 }] },
  ],
  ...overrides,
});

describe("heroImage", () => {
  it("uses the landscape banner when a book has one", () => {
    expect(heroImage(book({ banner }))).toBe(banner);
  });

  it("falls back to the cover when there is no banner", () => {
    expect(heroImage(book())).toBe(cover);
  });
});

describe("banner validation", () => {
  it("rejects a banner without positive integer dimensions", () => {
    expect(validateBooks([book({ banner: { ...banner, height: 0 } })])).toContain(
      'Banner of "alpha" must have positive integer width and height',
    );
  });
});
