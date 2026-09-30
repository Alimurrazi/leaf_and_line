import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { realBooks } from "@/content/books/index.generated";
import { renderIndex } from "@/studio/content-index";

const BOOKS_DIR = path.join(process.cwd(), "src", "content", "books");

describe("renderIndex", () => {
  it("imports every book JSON in slug order and exports them as realBooks", () => {
    const source = renderIndex(["the-lantern-road", "wakasamaru"]);
    expect(source).toContain('import book_the_lantern_road from "./the-lantern-road.json";');
    expect(source).toContain('import book_wakasamaru from "./wakasamaru.json";');
    expect(source).toContain("export const realBooks: Book[] = [book_the_lantern_road as Book, book_wakasamaru as Book];");
    expect(source.indexOf("book_the_lantern_road from")).toBeLessThan(source.indexOf("book_wakasamaru from"));
  });

  it("sorts slugs so the output is stable", () => {
    expect(renderIndex(["b-book", "a-book"])).toBe(renderIndex(["a-book", "b-book"]));
  });

  it("makes valid identifiers for slugs that start with a digit or are reserved words", () => {
    const source = renderIndex(["1971-ship", "new", "class"]);
    expect(source).toContain('import book_1971_ship from "./1971-ship.json";');
    expect(source).toContain('import book_new from "./new.json";');
    for (const [, name] of source.matchAll(/^import (\S+) from/gm)) {
      if (name !== "type") expect(name).toMatch(/^book_[a-z0-9_]+$/);
    }
  });

  it("writes an empty catalog when there are no books", () => {
    expect(renderIndex([])).toContain("export const realBooks: Book[] = [];");
  });
});

describe("generated index", () => {
  it("is in sync with the book JSON files on disk", () => {
    const slugs = readdirSync(BOOKS_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""));
    // Line endings may be CRLF after a Windows checkout (core.autocrlf); compare the content only.
    const onDisk = readFileSync(path.join(BOOKS_DIR, "index.generated.ts"), "utf8").replace(/\r\n/g, "\n");
    expect(onDisk).toBe(renderIndex(slugs));
  });
});

describe("wakasamaru.json", () => {
  const book = realBooks.find((b) => b.slug === "wakasamaru");

  it("keeps the published 14-page chapter at 1536×1024", () => {
    expect(book?.status).toBe("published");
    expect(book?.featured).toBe(true);
    const chapter = book?.chapters[0];
    expect(chapter?.slug).toBe("chapter-01");
    expect(chapter?.pages).toHaveLength(14);
    expect(chapter?.pages[0]).toMatchObject({
      id: "wakasamaru-c01-p01",
      order: 1,
      imageUrl: "/novels/wakasamaru/chapter-01/page-01.webp",
      width: 1536,
      height: 1024,
    });
    expect(chapter?.pages[13].imageUrl).toBe("/novels/wakasamaru/chapter-01/page-14.webp");
  });

  it("keeps the authored alt text, cover and banner", () => {
    const pages = book?.chapters[0].pages ?? [];
    expect(pages[0].alt).toMatch(/^18 March 1971, Chittagong Port/);
    expect(pages[2].alt).toMatch(/^25 March 1971/);
    expect(pages[1].alt).toBeUndefined();
    expect(book?.cover).toMatchObject({ url: "/novels/wakasamaru/cover.webp", width: 1024, height: 1536 });
    expect(book?.banner).toMatchObject({ url: "/novels/wakasamaru/banner.webp", width: 1536, height: 1024 });
  });
});
