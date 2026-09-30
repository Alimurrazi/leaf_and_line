import { describe, expect, it } from "vitest";
import { checkArtwork, checkEditorial, checkExport, exportProblems, publishProblems, stageOf } from "@/studio/checks";
import type { ExportedChapter, FolderScan, PageFile } from "@/studio/types";
import type { Book, Chapter } from "@/types/content";

const png = (number: number, over: Partial<PageFile> = {}): PageFile => ({
  name: `${number}.png`, number, width: 1536, height: 1024, mtimeMs: 1000, readable: true, ...over,
});

function scan(over: Partial<FolderScan> = {}): FolderScan {
  return {
    slug: "demo",
    exists: true,
    cover: { name: "cover.png", width: 1200, height: 1800, mtimeMs: 1000, readable: true },
    banner: null,
    chapters: [{ slug: "chapter-01", number: 1, pages: [png(1), png(2), png(3)], ignored: [] }],
    ignored: [],
    ...over,
  };
}

function chapter(over: Partial<Chapter> = {}): Chapter {
  return {
    id: "demo-c01", slug: "chapter-01", title: "Chapter 1", order: 1, status: "draft",
    pages: [1, 2, 3].map((order) => ({ id: `demo-c01-p0${order}`, order, imageUrl: `/novels/demo/chapter-01/page-0${order}.webp`, width: 1536, height: 1024 })),
    ...over,
  };
}

function book(over: Partial<Book> = {}): Book {
  return {
    id: "demo", slug: "demo", title: "Demo", synopsis: "A demo.", genres: ["Fantasy"], status: "draft",
    cover: { url: "/novels/demo/cover.webp", width: 1200, height: 1800, alt: "Demo cover" },
    artworkDisclosure: "Illustrated by hand.",
    chapters: [chapter()],
    ...over,
  };
}

const errors = (checks: { level: string; title: string }[]) => checks.filter((c) => c.level === "error").map((c) => c.title);
const warns = (checks: { level: string; title: string }[]) => checks.filter((c) => c.level === "warn").map((c) => c.title);

describe("checkArtwork", () => {
  it("passes a complete folder", () => {
    const checks = checkArtwork(scan());
    expect(errors(checks)).toEqual([]);
    expect(checks.map((c) => c.title)).toContain("3 pages, numbered 1–3");
  });

  it("reports a missing cover", () => {
    expect(errors(checkArtwork(scan({ cover: null })))).toContain("cover.png not found");
  });

  it("warns about a cover that is not upright or too small", () => {
    const wide = checkArtwork(scan({ cover: { name: "cover.png", width: 1536, height: 1024, mtimeMs: 1, readable: true } }));
    expect(warns(wide)).toContain("Cover is not upright (about 2:3)");
    const small = checkArtwork(scan({ cover: { name: "cover.png", width: 800, height: 1200, mtimeMs: 1, readable: true } }));
    expect(warns(small)).toContain("Cover is 800px wide; 1200px or more is recommended");
  });

  it("reports gaps and duplicate page numbers", () => {
    const gap = checkArtwork(scan({ chapters: [{ slug: "chapter-01", number: 1, pages: [png(1), png(3)], ignored: [] }] }));
    expect(errors(gap)).toContain("Page 2 is missing");
    const dup = checkArtwork(scan({ chapters: [{ slug: "chapter-01", number: 1, pages: [png(1), png(1, { name: "01.png" }), png(2)], ignored: [] }] }));
    expect(errors(dup)).toContain("Page 1 appears twice (1.png, 01.png)");
  });

  it("reports unreadable files and empty chapters", () => {
    const bad = checkArtwork(scan({ chapters: [{ slug: "chapter-01", number: 1, pages: [png(1, { readable: false })], ignored: [] }] }));
    expect(errors(bad)).toContain("1.png can't be read as a PNG");
    const empty = checkArtwork(scan({ chapters: [{ slug: "chapter-01", number: 1, pages: [], ignored: [] }] }));
    expect(errors(empty)).toContain("No numbered PNG pages");
  });

  it("warns about mixed page sizes and ignored files, but does not block", () => {
    const checks = checkArtwork(scan({
      chapters: [{ slug: "chapter-01", number: 1, pages: [png(1), png(2, { width: 1024, height: 1536 })], ignored: ["notes.txt"] }],
    }));
    expect(errors(checks)).toEqual([]);
    expect(warns(checks)).toContain("Mixed page sizes");
    expect(warns(checks)).toContain("Ignored files: notes.txt");
  });

  it("requires zero-padded chapter folder names, which the page URLs use", () => {
    const checks = checkArtwork(scan({ chapters: [{ slug: "chapter-1", number: 1, pages: [png(1)], ignored: [] }] }));
    expect(checks).toContainEqual(expect.objectContaining({ scope: "chapter-1", level: "error", title: "Rename chapter-1/ to chapter-01/" }));
  });

  it("reports two folders for the same chapter number", () => {
    const checks = checkArtwork(scan({
      chapters: [
        { slug: "chapter-01", number: 1, pages: [png(1)], ignored: [] },
        { slug: "chapter-1", number: 1, pages: [png(1)], ignored: [] },
      ],
    }));
    expect(errors(checks)).toContain("Chapter 1 appears twice (chapter-01/, chapter-1/)");
  });

  it("requires at least one chapter and chapter folders numbered 1..n", () => {
    expect(errors(checkArtwork(scan({ chapters: [] })))).toContain("No chapter folders (chapter-01/, chapter-02/, …)");
    const gap = checkArtwork(scan({ chapters: [{ slug: "chapter-02", number: 2, pages: [png(1)], ignored: [] }] }));
    expect(errors(gap)).toContain("chapter-01/ is missing");
  });
});

describe("checkExport", () => {
  const exported = (over: Partial<ExportedChapter> = {}): ExportedChapter => ({ slug: "chapter-01", pages: [1, 2, 3].map((order) => ({ order, mtimeMs: 2000 })), ...over });

  it("flags chapters that were never exported", () => {
    expect(checkExport(scan(), [])).toEqual([expect.objectContaining({ id: "export:chapter-01", level: "warn", title: "Not exported yet" })]);
  });

  it("is up to date when every WebP is newer than its original", () => {
    expect(checkExport(scan(), [exported()])).toEqual([expect.objectContaining({ level: "ok", title: "Export up to date" })]);
  });

  it("flags originals newer than their WebP and changed page counts", () => {
    const newer = scan({ chapters: [{ slug: "chapter-01", number: 1, pages: [png(1), png(2, { mtimeMs: 3000 }), png(3)], ignored: [] }] });
    expect(checkExport(newer, [exported()])[0]).toMatchObject({ level: "warn", title: "Needs re-export: page 2 changed" });
    expect(checkExport(scan(), [exported({ pages: [{ order: 1, mtimeMs: 2000 }] })])[0]).toMatchObject({ level: "warn", title: "Needs re-export: 3 originals, 1 exported" });
  });
});

describe("checkEditorial", () => {
  it("blocks on a missing disclosure", () => {
    expect(errors(checkEditorial(book({ artworkDisclosure: undefined }), {}))).toContain("Artwork disclosure missing");
  });

  it("requires a source register for historical books", () => {
    const historical = book({ genres: ["Historical"] });
    expect(errors(checkEditorial(historical, {}))).toContain("Source register not confirmed");
    expect(errors(checkEditorial(historical, { sourceRegisterConfirmed: true }))).toEqual([]);
    expect(errors(checkEditorial({ ...historical, sourceNotesUrl: "https://example.org/sources" }, {}))).toEqual([]);
  });

  it("recommends content notes and alt text without blocking", () => {
    const checks = checkEditorial(book(), {});
    expect(errors(checks)).toEqual([]);
    expect(warns(checks)).toEqual(["Content notes not decided", "Alt text on 0 of 3 pages"]);
    expect(warns(checkEditorial(book({ contentNotes: ["Violence"] }), {}))).not.toContain("Content notes not decided");
    expect(warns(checkEditorial(book(), { noContentNotes: true }))).not.toContain("Content notes not decided");
  });
});

describe("stageOf", () => {
  const ok = { artwork: [], exported: [], editorial: [] };

  it("is 'new' for a folder without a book", () => {
    expect(stageOf({ book: undefined, scan: scan(), ...ok, approvals: {} })).toMatchObject({ step: 1, key: "new" });
  });

  it("stops at the artwork step while there are artwork errors", () => {
    const artwork = checkArtwork(scan({ cover: null }));
    expect(stageOf({ book: book(), scan: scan(), artwork, exported: [], editorial: [], approvals: {} })).toMatchObject({ step: 2, key: "artwork" });
  });

  it("asks for export when a chapter is not exported or stale", () => {
    const exported = checkExport(scan(), []);
    expect(stageOf({ book: book({ chapters: [] }), scan: scan(), artwork: [], exported, editorial: [], approvals: {} })).toMatchObject({ step: 3, key: "export" });
  });

  it("is in review while draft, then editorial, then ready, then published", () => {
    const base = { scan: scan(), artwork: [], exported: [], approvals: {} };
    expect(stageOf({ ...base, book: book(), editorial: [] })).toMatchObject({ step: 4, key: "review" });
    const blocking = [{ id: "e", scope: "book", level: "error" as const, title: "x" }];
    expect(stageOf({ ...base, book: book({ status: "review" }), editorial: blocking })).toMatchObject({ step: 5, key: "editorial" });
    expect(stageOf({ ...base, book: book({ status: "review" }), editorial: [] })).toMatchObject({ step: 6, key: "ready" });
    expect(stageOf({ ...base, book: book({ status: "published" }), editorial: blocking })).toMatchObject({ step: 6, key: "published" });
  });

  it("treats an exported book without originals as past the artwork and export steps", () => {
    expect(stageOf({ book: book(), scan: undefined, artwork: [], exported: [], editorial: [], approvals: {} })).toMatchObject({ key: "review" });
  });
});

describe("checkEditorial genre matching", () => {
  it("applies the historical gate whatever the genre's case", () => {
    expect(errors(checkEditorial(book({ genres: ["historical"] }), {}))).toContain("Source register not confirmed");
  });
});

describe("publishProblems", () => {
  const two = () => book({ status: "review", chapters: [chapter(), chapter({ id: "demo-c02", slug: "chapter-02", order: 2 })] });
  const reviewed = { artworkReviewed: { "chapter-01": true, "chapter-02": true } };

  it("needs the book in review, at least one chapter, and no blocking editorial items", () => {
    expect(publishProblems(book(), reviewed, ["chapter-01"])).toEqual(["Send the book to review first (step 4)"]);
    expect(publishProblems(two(), reviewed, [])).toEqual(["Choose at least one chapter to publish"]);
    expect(publishProblems(two(), reviewed, ["chapter-01"])).toEqual([]);
    expect(publishProblems({ ...two(), artworkDisclosure: undefined }, reviewed, ["chapter-01"])).toEqual(["Fix the blocking editorial items first: Artwork disclosure missing"]);
  });

  it("requires the artwork check for every chapter being published, including ones added later", () => {
    expect(publishProblems(two(), { artworkReviewed: { "chapter-01": true } }, ["chapter-01", "chapter-02"]))
      .toEqual(['Tick "I checked the artwork" for chapter-02 first (step 4)']);
    expect(publishProblems({ ...two(), status: "published" }, { artworkReviewed: { "chapter-01": true } }, ["chapter-01"])).toEqual([]);
  });

  it("ignores chapter slugs the book does not have", () => {
    expect(publishProblems(two(), reviewed, ["chapter-09"])).toEqual(["Choose at least one chapter to publish"]);
  });
});

describe("exportProblems", () => {
  const twoChapters = () => scan({ chapters: [
    { slug: "chapter-01", number: 1, pages: [png(1)], ignored: [] },
    { slug: "chapter-02", number: 2, pages: [png(1)], ignored: [] },
  ] });

  it("blocks any export while the folder has artwork errors, even in another chapter", () => {
    const broken = scan({ cover: null, chapters: [{ slug: "chapter-01", number: 1, pages: [png(1)], ignored: [] }] });
    expect(exportProblems(broken, book(), "chapter-01")).toEqual(["Fix the artwork first: cover.png not found"]);
  });

  it("refuses a chapter whose earlier chapter isn't exported yet, before any file is written", () => {
    expect(exportProblems(twoChapters(), book({ chapters: [] }), "chapter-02")).toEqual(["Export chapter-01 first"]);
    expect(exportProblems(twoChapters(), book({ chapters: [] }), "all")).toEqual([]);
    expect(exportProblems(twoChapters(), book(), "chapter-02")).toEqual([]);
  });

  it("reports an unknown chapter", () => {
    expect(exportProblems(twoChapters(), book(), "chapter-07")).toEqual(["No chapter-07/ folder"]);
  });
});
