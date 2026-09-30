// Exports originals to optimized WebP for public delivery.
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { checkArtwork } from "./checks";
import { bookDirs } from "./paths";
import { scanFolder } from "./scan";

// Without this, sharp keeps originals open on Windows, so they can't be replaced while the dev server runs.
sharp.cache(false);

const QUALITY = 90;
const COVER_MAX_WIDTH = 1200; // 2× the widest cover slot (book page ~360px, cards ~282px)
const pad = (n: number) => String(n).padStart(2, "0");

export type ExportedPage = { order: number; width: number; height: number; kb: number };

/** Exports one chapter. Refuses if the chapter's artwork checks have errors. */
export async function exportChapter(root: string, slug: string, chapterSlug: string): Promise<ExportedPage[]> {
  const scan = await scanFolder(root, slug);
  const chapter = scan.chapters.find((c) => c.slug === chapterSlug);
  if (!chapter) throw new Error(`${chapterSlug}/ not found in artwork-originals/${slug}/`);
  const problems = checkArtwork({ ...scan, chapters: [chapter] }).filter((c) => c.scope === chapterSlug && c.level === "error");
  if (problems.length > 0) throw new Error(`Fix ${chapterSlug} first: ${problems.map((p) => p.title).join("; ")}`);

  const source = path.join(bookDirs(root, slug).originals, chapterSlug);
  const target = path.join(bookDirs(root, slug).public, chapterSlug);
  mkdirSync(target, { recursive: true });

  const pages: ExportedPage[] = [];
  for (const page of chapter.pages) {
    const info = await sharp(path.join(source, page.name))
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(path.join(target, `page-${pad(page.number)}.webp`));
    pages.push({ order: page.number, width: info.width, height: info.height, kb: Math.round(info.size / 1024) });
  }
  // Remove pages left over from an earlier export with more pages.
  for (const name of readdirSync(target)) {
    const match = /^page-(\d+)\.webp$/.exec(name);
    if (match && Number(match[1]) > chapter.pages.length) rmSync(path.join(target, name));
  }
  return pages;
}

/** Exports cover.png (scaled down to 1200px wide, never enlarged) or banner.png (full size). */
export async function exportImage(root: string, slug: string, kind: "cover" | "banner") {
  const scan = await scanFolder(root, slug);
  const image = scan[kind];
  if (!image?.readable) throw new Error(`${kind}.png not found or unreadable in artwork-originals/${slug}/`);
  let pipeline = sharp(path.join(bookDirs(root, slug).originals, image.name));
  if (kind === "cover") pipeline = pipeline.resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true });
  mkdirSync(bookDirs(root, slug).public, { recursive: true });
  const info = await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(path.join(bookDirs(root, slug).public, `${kind}.webp`));
  return { width: info.width, height: info.height };
}
