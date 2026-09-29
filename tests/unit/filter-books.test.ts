import { describe, expect, it } from "vitest";
import { ALL_GENRES, filterBooks } from "@/features/catalog/filter-books";
import type { Book } from "@/types/content";

const book = (slug: string, title: string, genres: string[], synopsis = ""): Book => ({
  id: slug,
  slug,
  title,
  synopsis,
  genres,
  status: "published",
  cover: { url: "/c.webp", width: 2, height: 3, alt: "" },
  chapters: [],
});

const books = [
  book("wakasamaru", "Wakasamaru", ["Historical"], "A cargo ship arrives at Chittagong."),
  book("sky", "Sky Garden", ["Fantasy"], "Floating islands."),
];

describe("filterBooks", () => {
  it("returns everything for an empty query and all genres", () => {
    expect(filterBooks(books, "", ALL_GENRES)).toHaveLength(2);
  });

  it("matches title, synopsis and genre text, case-insensitively and ignoring outer spaces", () => {
    expect(filterBooks(books, "  WAKA ", ALL_GENRES).map((b) => b.slug)).toEqual(["wakasamaru"]);
    expect(filterBooks(books, "chittagong", ALL_GENRES).map((b) => b.slug)).toEqual(["wakasamaru"]);
    expect(filterBooks(books, "fantasy", ALL_GENRES).map((b) => b.slug)).toEqual(["sky"]);
  });

  it("filters by exact genre and combines with the query", () => {
    expect(filterBooks(books, "", "Fantasy").map((b) => b.slug)).toEqual(["sky"]);
    expect(filterBooks(books, "waka", "Fantasy")).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterBooks(books, "zzz", ALL_GENRES)).toEqual([]);
  });
});
