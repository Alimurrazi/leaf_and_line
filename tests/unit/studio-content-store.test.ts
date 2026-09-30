import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readApprovals, writeApprovals } from "@/studio/approvals";
import {
  altShiftWarning,
  createBook,
  listBookSlugs,
  mergeExportedChapter,
  readBook,
  setCoverImage,
  setPageAlt,
  setPublication,
  setFeatured,
  updateMetadata,
  writeBook,
} from "@/studio/content-store";
import { studioPaths } from "@/studio/paths";
import type { Book } from "@/types/content";

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "studio-store-"));
  mkdirSync(studioPaths(root).books, { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const meta = { title: "The Lantern Road", synopsis: "Two travellers.", genres: ["Fantasy"] };
const sizes = (n: number, width = 1536, height = 1024) => Array.from({ length: n }, (_, i) => ({ order: i + 1, width, height }));

describe("createBook", () => {
  it("writes a valid draft JSON and regenerates the index", () => {
    const book = createBook(root, "the-lantern-road", meta);
    expect(book).toMatchObject({ id: "the-lantern-road", slug: "the-lantern-road", status: "draft", chapters: [], title: "The Lantern Road" });
    expect(book.cover).toMatchObject({ url: "/novels/the-lantern-road/cover.webp", width: 1200, height: 1800 });
    expect(readBook(root, "the-lantern-road")).toEqual(book);
    expect(listBookSlugs(root)).toEqual(["the-lantern-road"]);
    const index = readFileSync(path.join(studioPaths(root).books, "index.generated.ts"), "utf8");
    expect(index).toContain('import book_the_lantern_road from "./the-lantern-road.json";');
  });

  it("refuses an existing book and a bad slug", () => {
    createBook(root, "demo", meta);
    expect(() => createBook(root, "demo", meta)).toThrow(/already exists/);
    expect(() => createBook(root, "../evil", meta)).toThrow(/Invalid slug/);
  });
});

describe("mergeExportedChapter", () => {
  const base = (): Book => ({
    id: "demo", slug: "demo", title: "Demo", synopsis: "x", genres: ["Fantasy"], status: "draft",
    cover: { url: "/novels/demo/cover.webp", width: 1200, height: 1800, alt: "Demo cover" }, chapters: [],
  });

  it("adds a chapter with ids, urls and sizes from the export", () => {
    const book = mergeExportedChapter(base(), 1, sizes(2));
    expect(book.chapters).toEqual([{
      id: "demo-c01", slug: "chapter-01", title: "Chapter 1", order: 1, status: "draft",
      pages: [
        { id: "demo-c01-p01", order: 1, imageUrl: "/novels/demo/chapter-01/page-01.webp", width: 1536, height: 1024 },
        { id: "demo-c01-p02", order: 2, imageUrl: "/novels/demo/chapter-01/page-02.webp", width: 1536, height: 1024 },
      ],
    }]);
  });

  it("keeps title, status and alt text by page order when re-exporting", () => {
    let book = mergeExportedChapter(base(), 1, sizes(2));
    book = setPageAlt(book, "chapter-01", 2, "Page two scene");
    book = { ...book, chapters: [{ ...book.chapters[0], title: "The Gate", status: "published" }] };
    const again = mergeExportedChapter(book, 1, sizes(3, 1024, 1536));
    expect(again.chapters[0]).toMatchObject({ title: "The Gate", status: "published" });
    expect(again.chapters[0].pages.map((p) => [p.order, p.width, p.alt])).toEqual([[1, 1024, undefined], [2, 1024, "Page two scene"], [3, 1024, undefined]]);
  });

  it("refuses a chapter that would leave a gap", () => {
    expect(() => mergeExportedChapter(base(), 2, sizes(1))).toThrow(/Export chapter-01 first/);
  });
});

describe("altShiftWarning", () => {
  const chapterWithAlt = () => setPageAlt(mergeExportedChapter(createBook(root, "demo", meta), 1, sizes(3)), "chapter-01", 2, "Scene two").chapters[0];

  it("warns when the page count changes on a chapter that has alt text", () => {
    expect(altShiftWarning(chapterWithAlt(), sizes(4))).toBe("chapter-01 now has 4 pages instead of 3: alt text stays with page numbers, so check it");
  });

  it("stays quiet for a new chapter, the same page count, or a chapter without alt text", () => {
    expect(altShiftWarning(undefined, sizes(4))).toBeNull();
    expect(altShiftWarning(chapterWithAlt(), sizes(3))).toBeNull();
    expect(altShiftWarning(mergeExportedChapter(createBook(root, "plain", meta), 1, sizes(3)).chapters[0], sizes(5))).toBeNull();
  });
});

describe("book edits", () => {
  it("updates metadata, trimming text and dropping empty optional fields", () => {
    const book = createBook(root, "demo", meta);
    const next = updateMetadata(book, {
      title: "  Demo  ", subtitle: "", synopsis: "New.", genres: ["Fantasy", " Adventure ", ""], seriesStatus: "complete",
      credits: [{ role: "Art", name: "A. Artist" }, { role: "", name: "" }], contentNotes: ["Violence", " "], artworkDisclosure: "Hand drawn.", sourceNotesUrl: "",
    });
    expect(next).toMatchObject({ title: "Demo", synopsis: "New.", genres: ["Fantasy", "Adventure"], seriesStatus: "complete", credits: [{ role: "Art", name: "A. Artist" }], contentNotes: ["Violence"], artworkDisclosure: "Hand drawn." });
    expect(next).not.toHaveProperty("subtitle");
    expect(next).not.toHaveProperty("sourceNotesUrl");
    expect(next.cover.alt).toBe("Demo cover");
  });

  it("sets cover size from the export", () => {
    const book = setCoverImage(createBook(root, "demo", meta), "cover", { width: 1200, height: 1700 });
    expect(book.cover).toMatchObject({ width: 1200, height: 1700 });
    expect(setCoverImage(book, "banner", { width: 1536, height: 1024 }).banner).toEqual({ url: "/novels/demo/banner.webp", width: 1536, height: 1024, alt: "The Lantern Road banner" });
  });

  it("publishes chosen chapters with the book, and sends a book back to draft", () => {
    let book = mergeExportedChapter(createBook(root, "demo", meta), 1, sizes(1));
    book = mergeExportedChapter(book, 2, sizes(1));
    const published = setPublication(book, "published", ["chapter-01"]);
    expect([published.status, ...published.chapters.map((c) => c.status)]).toEqual(["published", "published", "draft"]);
    expect(setPublication(published, "review").status).toBe("review");
  });

  it("unpublishes chapters that are not ticked when publishing", () => {
    let book = mergeExportedChapter(createBook(root, "demo", meta), 1, sizes(1));
    book = setPublication(mergeExportedChapter(book, 2, sizes(1)), "published", ["chapter-01", "chapter-02"]);
    const narrowed = setPublication(book, "published", ["chapter-01"]);
    expect(narrowed.chapters.map((c) => c.status)).toEqual(["published", "draft"]);
  });
});

describe("writeBook", () => {
  it("refuses content that would break the site build", () => {
    const book = createBook(root, "demo", meta);
    expect(() => writeBook(root, { ...book, cover: { ...book.cover, width: 0 } })).toThrow(/Invalid content/);
  });

  it("moves the featured flag so only one book is featured", () => {
    createBook(root, "alpha", meta);
    createBook(root, "beta", meta);
    setFeatured(root, "alpha");
    setFeatured(root, "beta");
    expect(readBook(root, "alpha")?.featured).toBeUndefined();
    expect(readBook(root, "beta")?.featured).toBe(true);
  });
});

describe("approvals", () => {
  it("round-trips local workflow state and merges patches", () => {
    expect(readApprovals(root, "demo")).toEqual({});
    writeApprovals(root, "demo", { sourceRegisterConfirmed: true });
    writeApprovals(root, "demo", { artworkReviewed: { "chapter-01": true } });
    expect(readApprovals(root, "demo")).toEqual({ sourceRegisterConfirmed: true, artworkReviewed: { "chapter-01": true } });
    expect(existsSync(path.join(studioPaths(root).originals, "demo", ".studio.json"))).toBe(true);
  });
});
