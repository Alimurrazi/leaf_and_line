// Reads artwork-originals/<slug>/ and public/novels/<slug>/ into plain data for checks.ts.
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { bookDirs, isSlug, studioPaths } from "./paths";
import type { ChapterScan, ExportedChapter, FolderScan, ImageFile, PageFile } from "./types";

// Without this, sharp keeps originals open on Windows, so they can't be replaced while the dev server runs.
sharp.cache(false);

const CHAPTER_DIR = /^chapter-(\d+)$/;
const PAGE_PNG = /^(\d+)\.png$/i;
const PAGE_WEBP = /^page-(\d+)\.webp$/;
const HIDDEN = (name: string) => name.startsWith(".");

export function listOriginalFolders(root: string): string[] {
  const { originals } = studioPaths(root);
  if (!existsSync(originals)) return [];
  return readdirSync(originals, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isSlug(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function readImage(file: string): Promise<ImageFile> {
  const name = path.basename(file);
  const { mtimeMs } = statSync(file);
  try {
    const { width, height, format } = await sharp(file).metadata();
    if (format !== "png" || !width || !height) throw new Error("not a png");
    return { name, width, height, mtimeMs, readable: true };
  } catch {
    return { name, width: 0, height: 0, mtimeMs, readable: false };
  }
}

async function scanChapter(dir: string, slug: string, number: number): Promise<ChapterScan> {
  const pages: PageFile[] = [];
  const ignored: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (HIDDEN(name)) continue;
    const match = PAGE_PNG.exec(name);
    if (!match || !statSync(path.join(dir, name)).isFile()) {
      ignored.push(name);
      continue;
    }
    pages.push({ ...(await readImage(path.join(dir, name))), number: Number(match[1]) });
  }
  pages.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
  return { slug, number, pages, ignored };
}

export async function scanFolder(root: string, slug: string): Promise<FolderScan> {
  const dir = bookDirs(root, slug).originals;
  const empty: FolderScan = { slug, exists: false, cover: null, banner: null, chapters: [], ignored: [] };
  if (!existsSync(dir)) return empty;

  const scan: FolderScan = { ...empty, exists: true };
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (HIDDEN(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const chapter = CHAPTER_DIR.exec(entry.name);
    if (entry.isDirectory() && chapter) scan.chapters.push(await scanChapter(full, entry.name, Number(chapter[1])));
    else if (entry.isFile() && entry.name.toLowerCase() === "cover.png") scan.cover = await readImage(full);
    else if (entry.isFile() && entry.name.toLowerCase() === "banner.png") scan.banner = await readImage(full);
    else scan.ignored.push(entry.isDirectory() ? `${entry.name}/` : entry.name);
  }
  scan.chapters.sort((a, b) => a.number - b.number);
  // A folder holding only hidden files (such as .studio.json) has no originals.
  const nothingVisible = !scan.cover && !scan.banner && scan.chapters.length === 0 && scan.ignored.length === 0;
  return nothingVisible ? { ...scan, exists: false } : scan;
}

export function scanExported(root: string, slug: string): ExportedChapter[] {
  const dir = bookDirs(root, slug).public;
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && CHAPTER_DIR.test(entry.name))
    .map((entry) => {
      const chapterDir = path.join(dir, entry.name);
      const pages = readdirSync(chapterDir)
        .map((name) => ({ name, match: PAGE_WEBP.exec(name) }))
        .filter((file) => file.match)
        .map((file) => ({ order: Number(file.match![1]), mtimeMs: statSync(path.join(chapterDir, file.name)).mtimeMs }))
        .sort((a, b) => a.order - b.order);
      return { slug: entry.name, pages };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
