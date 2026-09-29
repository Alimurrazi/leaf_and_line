#!/usr/bin/env node
// Export PNG masters to optimized, zero-padded WebP pages for public delivery.
// Usage: node scripts/export-pages.mjs <mastersDir> <bookSlug> <chapterSlug> [--quality 90]
//          [--cover <pageNumber | file.png>] [--banner <pageNumber | file.png>]
// --cover  upright front page for library cards and the book page (e.g. cover.png); scaled down to at most
//          COVER_MAX_WIDTH, never enlarged.
// --banner optional wide image for the home page hero (e.g. title.png); exported at full size.
// Either takes a page number (reuse that page) or a file in <mastersDir>.
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const COVER_MAX_WIDTH = 1200; // 2× the widest cover slot (book page ~360px, cards ~282px)

const [sourceDir, bookSlug, chapterSlug, ...rest] = process.argv.slice(2);
if (!sourceDir || !bookSlug || !chapterSlug) {
  console.error(
    "Usage: node scripts/export-pages.mjs <mastersDir> <bookSlug> <chapterSlug> [--quality 90] [--cover <n|file>] [--banner <n|file>]",
  );
  process.exit(1);
}

const option = (name, fallback) => {
  const index = rest.indexOf(`--${name}`);
  return index >= 0 ? rest[index + 1] : fallback;
};
const quality = Number(option("quality", "90"));
const coverSource = option("cover", null);
const bannerSource = option("banner", null);

const files = (await readdir(sourceDir))
  .map((name) => ({ name, number: Number(/(\d+)\.png$/i.exec(name)?.[1]) }))
  .filter((file) => Number.isInteger(file.number))
  .sort((a, b) => a.number - b.number);

if (files.length === 0) throw new Error(`No numbered PNG files found in ${sourceDir}`);
files.forEach((file, index) => {
  if (file.number !== index + 1) throw new Error(`Expected page ${index + 1} but found ${file.name}`);
});

const bookDir = path.join("public", "novels", bookSlug);
const chapterDir = path.join(bookDir, chapterSlug);
await mkdir(chapterDir, { recursive: true });

const report = [];
for (const file of files) {
  const output = path.join(chapterDir, `page-${String(file.number).padStart(2, "0")}.webp`);
  const info = await sharp(path.join(sourceDir, file.name)).webp({ quality, effort: 6 }).toFile(output);
  report.push({ page: file.number, width: info.width, height: info.height, kb: Math.round(info.size / 1024) });
}

function resolveMaster(source, label) {
  const name = /^\d+$/.test(source) ? files.find((f) => f.number === Number(source))?.name : source;
  const file = name && path.join(sourceDir, name);
  if (!file || !existsSync(file)) throw new Error(`${label} "${source}" not found in ${sourceDir}`);
  return file;
}

async function exportImage(source, label, outputName, maxWidth) {
  const file = resolveMaster(source, label);
  let image = sharp(file);
  if (maxWidth) image = image.resize({ width: maxWidth, withoutEnlargement: true });
  const info = await image.webp({ quality, effort: 6 }).toFile(path.join(bookDir, outputName));
  console.log(`${outputName} from ${path.basename(file)}: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
}

if (coverSource) await exportImage(coverSource, "Cover", "cover.webp", COVER_MAX_WIDTH);
if (bannerSource) await exportImage(bannerSource, "Banner", "banner.webp");

console.table(report);
