import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { fileSizeKb, versionedUrl } from "@/studio/assets";

const root = mkdtempSync(path.join(os.tmpdir(), "studio-assets-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("versionedUrl", () => {
  it("adds the file's modification time so a re-export shows up without a hard refresh", () => {
    mkdirSync(path.join(root, "public", "novels", "demo"), { recursive: true });
    writeFileSync(path.join(root, "public", "novels", "demo", "cover.webp"), "x");
    expect(versionedUrl(root, "/novels/demo/cover.webp")).toMatch(/^\/novels\/demo\/cover\.webp\?v=\d+$/);
  });

  it("returns null for a file that is not there, and refuses paths outside public/", () => {
    expect(versionedUrl(root, "/novels/demo/banner.webp")).toBeNull();
    expect(versionedUrl(root, "/../package.json")).toBeNull();
  });
});

describe("versionedUrl with external images", () => {
  it("returns an external http(s) URL unchanged instead of treating it as missing", () => {
    expect(versionedUrl(root, "https://cdn.example.org/novels/demo/cover.webp")).toBe("https://cdn.example.org/novels/demo/cover.webp");
  });
});

describe("fileSizeKb", () => {
  it("reports a public file's size in KB, or null when it is missing or external", () => {
    mkdirSync(path.join(root, "public", "novels", "sized"), { recursive: true });
    writeFileSync(path.join(root, "public", "novels", "sized", "page-01.webp"), Buffer.alloc(3 * 1024));
    expect(fileSizeKb(root, "/novels/sized/page-01.webp")).toBe(3);
    expect(fileSizeKb(root, "/novels/sized/page-02.webp")).toBeNull();
    expect(fileSizeKb(root, "https://cdn.example.org/x.webp")).toBeNull();
  });
});
