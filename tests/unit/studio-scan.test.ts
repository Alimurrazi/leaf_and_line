import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertSlug, studioPaths } from "@/studio/paths";
import { listOriginalFolders, scanExported, scanFolder } from "@/studio/scan";

let root: string;

const makePng = (file: string, width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#b88a43" } }).png().toFile(file);

beforeAll(async () => {
  root = mkdtempSync(path.join(os.tmpdir(), "studio-scan-"));
  const { originals, publicNovels } = studioPaths(root);
  const book = path.join(originals, "demo");
  mkdirSync(path.join(book, "chapter-01"), { recursive: true });
  mkdirSync(path.join(book, "chapter-02"), { recursive: true });
  mkdirSync(path.join(book, "sketches"), { recursive: true });
  await makePng(path.join(book, "cover.png"), 60, 90);
  await makePng(path.join(book, "chapter-01", "2.png"), 30, 20);
  await makePng(path.join(book, "chapter-01", "1.png"), 30, 20);
  writeFileSync(path.join(book, "chapter-01", "3.png"), "not a png");
  writeFileSync(path.join(book, "chapter-01", "notes.txt"), "x");
  mkdirSync(path.join(originals, "Bad Name"), { recursive: true });
  writeFileSync(path.join(originals, "README.md"), "readme");

  const exported = path.join(publicNovels, "demo", "chapter-01");
  mkdirSync(exported, { recursive: true });
  await sharp({ create: { width: 30, height: 20, channels: 3, background: "#000" } }).webp().toFile(path.join(exported, "page-01.webp"));
  writeFileSync(path.join(exported, "page-02.webp"), "x");
  writeFileSync(path.join(exported, "cover.webp"), "x");
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("assertSlug", () => {
  it("accepts slugs and rejects anything that could leave the folder", () => {
    expect(() => assertSlug("the-lantern-road")).not.toThrow();
    for (const bad of ["../etc", "a/b", "A", "", "a..b", "-a"]) expect(() => assertSlug(bad)).toThrow(/Invalid slug/);
  });
});

describe("listOriginalFolders", () => {
  it("lists book folders with valid slugs, skipping files and bad names", () => {
    expect(listOriginalFolders(root)).toEqual(["demo"]);
  });

  it("returns nothing when the originals folder does not exist", () => {
    expect(listOriginalFolders(path.join(root, "nowhere"))).toEqual([]);
  });
});

describe("scanFolder", () => {
  it("reads the cover, chapters and numbered pages with their sizes", async () => {
    const scan = await scanFolder(root, "demo");
    expect(scan.exists).toBe(true);
    expect(scan.cover).toMatchObject({ name: "cover.png", width: 60, height: 90, readable: true });
    expect(scan.banner).toBeNull();
    expect(scan.chapters.map((c) => [c.slug, c.number])).toEqual([["chapter-01", 1], ["chapter-02", 2]]);
    const [first] = scan.chapters;
    expect(first.pages.map((p) => [p.name, p.number, p.width, p.height, p.readable])).toEqual([
      ["1.png", 1, 30, 20, true],
      ["2.png", 2, 30, 20, true],
      ["3.png", 3, 0, 0, false],
    ]);
    expect(first.ignored).toEqual(["notes.txt"]);
    expect(scan.ignored).toEqual(["sketches/"]);
  });

  it("reports a missing folder", async () => {
    expect(await scanFolder(root, "ghost")).toMatchObject({ exists: false, cover: null, chapters: [] });
  });

  it("treats a folder holding only studio state as having no originals", async () => {
    const dir = path.join(studioPaths(root).originals, "state-only");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, ".studio.json"), "{}");
    expect(await scanFolder(root, "state-only")).toMatchObject({ exists: false, chapters: [] });
  });
});

describe("scanExported", () => {
  it("lists exported pages per chapter with their modification times", () => {
    const exported = scanExported(root, "demo");
    expect(exported.map((c) => [c.slug, c.pages.map((p) => p.order)])).toEqual([["chapter-01", [1, 2]]]);
    expect(exported[0].pages[0].mtimeMs).toBeGreaterThan(0);
  });
});
