import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { exportChapter, exportImage } from "@/studio/export";
import { studioPaths } from "@/studio/paths";

let root: string;
let originals: string;
let out: string;
const makePng = (file: string, width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#b88a43" } }).png().toFile(file);

beforeAll(async () => {
  root = mkdtempSync(path.join(os.tmpdir(), "studio-export-"));
  originals = path.join(studioPaths(root).originals, "demo");
  out = path.join(studioPaths(root).publicNovels, "demo");
  mkdirSync(path.join(originals, "chapter-01"), { recursive: true });
  await makePng(path.join(originals, "chapter-01", "1.png"), 300, 200);
  await makePng(path.join(originals, "chapter-01", "2.png"), 200, 300);
  await makePng(path.join(originals, "cover.png"), 1500, 2250);
  await makePng(path.join(originals, "banner.png"), 600, 400);
  // A stale page from an earlier export with more pages
  mkdirSync(path.join(out, "chapter-01"), { recursive: true });
  writeFileSync(path.join(out, "chapter-01", "page-03.webp"), "old");
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("exportChapter", () => {
  it("writes zero-padded WebP pages, returns their sizes and removes stale pages", async () => {
    const pages = await exportChapter(root, "demo", "chapter-01");
    expect(pages.map((p) => [p.order, p.width, p.height])).toEqual([[1, 300, 200], [2, 200, 300]]);
    expect((await sharp(path.join(out, "chapter-01", "page-01.webp")).metadata()).format).toBe("webp");
    expect(existsSync(path.join(out, "chapter-01", "page-02.webp"))).toBe(true);
    expect(existsSync(path.join(out, "chapter-01", "page-03.webp"))).toBe(false);
  });

  it("refuses a chapter that fails the artwork checks", async () => {
    writeFileSync(path.join(originals, "chapter-01", "4.png"), "x");
    await expect(exportChapter(root, "demo", "chapter-01")).rejects.toThrow(/Page 3 is missing/);
  });
});

describe("exportImage", () => {
  it("scales the cover down to 1200px wide and keeps the banner full size", async () => {
    expect(await exportImage(root, "demo", "cover")).toEqual({ width: 1200, height: 1800 });
    expect(await exportImage(root, "demo", "banner")).toEqual({ width: 600, height: 400 });
    expect(existsSync(path.join(out, "cover.webp"))).toBe(true);
  });
});
