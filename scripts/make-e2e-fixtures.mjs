#!/usr/bin/env node
// Generate plain placeholder WebP pages for the test-only fixture catalog.
// Output goes to public/novels/_e2e/, which is gitignored and must never be committed or deployed.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join("public", "novels", "_e2e");
const WIDTH = 1000;
const HEIGHT = 1500;
const books = [
  { slug: "e2e-atlas", chapters: [["chapter-01", 3], ["chapter-02", 2], ["chapter-03", 1]] },
  { slug: "e2e-draft", chapters: [["chapter-01", 1]] },
];

async function solid(file, shade) {
  const background = { r: 40 + shade * 25, g: 70 + shade * 15, b: 90, alpha: 1 };
  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background } }).webp({ quality: 60 }).toFile(file);
}

for (const book of books) {
  const bookDir = path.join(OUT, book.slug);
  await mkdir(bookDir, { recursive: true });
  await solid(path.join(bookDir, "cover.webp"), 0);
  for (const [chapterSlug, pageCount] of book.chapters) {
    const chapterDir = path.join(bookDir, chapterSlug);
    await mkdir(chapterDir, { recursive: true });
    for (let n = 1; n <= pageCount; n++) {
      await solid(path.join(chapterDir, `page-${String(n).padStart(2, "0")}.webp`), n);
    }
  }
}

console.log(`E2E fixture images written to ${OUT}`);
