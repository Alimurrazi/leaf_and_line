#!/usr/bin/env node
// Export PNG masters to optimized, zero-padded WebP pages for public delivery.
// Usage: node scripts/export-pages.mjs <mastersDir> <bookSlug> <chapterSlug> [--quality 90] [--cover <pageNumber>]
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [sourceDir, bookSlug, chapterSlug, ...rest] = process.argv.slice(2);
if (!sourceDir || !bookSlug || !chapterSlug) {
  console.error("Usage: node scripts/export-pages.mjs <mastersDir> <bookSlug> <chapterSlug> [--quality 90] [--cover <n>]");
  process.exit(1);
}

const option = (name, fallback) => {
  const index = rest.indexOf(`--${name}`);
  return index >= 0 ? rest[index + 1] : fallback;
};
const quality = Number(option("quality", "90"));
const coverPage = option("cover", null);

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

if (coverPage) {
  const file = files.find((f) => f.number === Number(coverPage));
  if (!file) throw new Error(`Cover page ${coverPage} not found`);
  await sharp(path.join(sourceDir, file.name)).webp({ quality, effort: 6 }).toFile(path.join(bookDir, "cover.webp"));
}

console.table(report);
