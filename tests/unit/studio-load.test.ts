import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBook, mergeExportedChapter, readBook, setPublication, writeBook } from "@/studio/content-store";
import { loadBookState, loadStudio } from "@/studio/load";
import { studioPaths } from "@/studio/paths";

let root: string;
const meta = { title: "Book", synopsis: "About.", genres: ["Fantasy"], artworkDisclosure: "Hand drawn." };

beforeAll(async () => {
  root = mkdtempSync(path.join(os.tmpdir(), "studio-load-"));
  mkdirSync(studioPaths(root).books, { recursive: true });
  // A published book with no originals on disk (like Wakasamaru today)
  const live = createBook(root, "live", { ...meta, title: "Live" });
  writeBook(root, setPublication(mergeExportedChapter(live, 1, [{ order: 1, width: 10, height: 10 }]), "published", ["chapter-01"]));
  // A new folder with a gap in its pages
  const folder = path.join(studioPaths(root).originals, "fresh", "chapter-01");
  mkdirSync(folder, { recursive: true });
  await sharp({ create: { width: 30, height: 20, channels: 3, background: "#000" } }).png().toFile(path.join(folder, "1.png"));
  await sharp({ create: { width: 30, height: 20, channels: 3, background: "#000" } }).png().toFile(path.join(folder, "3.png"));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("loadBookState", () => {
  it("combines the book, its folder and the checks into a stage", async () => {
    const fresh = await loadBookState(root, "fresh");
    expect(fresh.book).toBeUndefined();
    expect(fresh.stage.key).toBe("new");
    expect(fresh.checks.artwork.map((c) => c.title)).toContain("Page 2 is missing");
    expect(fresh.counts).toEqual({ errors: 2, warnings: 0 }); // missing cover + page 2

    const live = await loadBookState(root, "live");
    expect(live.book?.title).toBe("Live");
    expect(live.hasOriginals).toBe(false);
    expect(live.stage.key).toBe("published");
    expect(live.checks.editorial.map((c) => c.title)).toEqual(["Content notes not decided", "Alt text on 0 of 1 pages"]);
  });
});

describe("loadStudio", () => {
  it("lists books and folders, the ones needing attention first", async () => {
    const all = await loadStudio(root);
    expect(all.map((s) => s.slug)).toEqual(["fresh", "live"]);
  });

  it("picks up a book as soon as its JSON exists", async () => {
    createBook(root, "another", meta);
    expect(readBook(root, "another")).toBeDefined();
    expect((await loadStudio(root)).map((s) => s.slug)).toContain("another");
  });
});
