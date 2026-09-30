// Pure readiness checks for the studio. No file access: scan.ts gathers the facts.
import type { Book } from "@/types/content";
import type { Approvals, Check, ChapterScan, ExportedChapter, FolderScan, ImageFile, Stage } from "./types";

const COVER_MIN_WIDTH = 1200;
const COVER_RATIO = { min: 1.3, max: 1.7 }; // height / width, around 2:3 = 1.5

const hasErrors = (checks: Check[]) => checks.some((c) => c.level === "error");

function imageChecks(image: ImageFile | null, scope: "cover" | "banner"): Check[] {
  const id = (s: string) => `${scope}:${s}`;
  if (!image) {
    return scope === "cover"
      ? [{ id: id("missing"), scope, level: "error", title: "cover.png not found", detail: "Add an upright cover (about 2:3, at least 1200px wide)." }]
      : [{ id: id("missing"), scope, level: "info", title: "No banner", detail: "Optional. The home page hero uses the cover instead." }];
  }
  if (!image.readable) return [{ id: id("unreadable"), scope, level: "error", title: `${image.name} can't be read as a PNG` }];

  const checks: Check[] = [];
  const size = `${image.width}×${image.height}`;
  if (scope === "cover") {
    const ratio = image.height / image.width;
    if (ratio < COVER_RATIO.min || ratio > COVER_RATIO.max) {
      checks.push({ id: id("ratio"), scope, level: "warn", title: "Cover is not upright (about 2:3)", detail: `It is ${size}. Library cards crop it to 2:3.` });
    }
    if (image.width < COVER_MIN_WIDTH) {
      checks.push({ id: id("width"), scope, level: "warn", title: `Cover is ${image.width}px wide; 1200px or more is recommended` });
    }
  } else if (image.height > image.width) {
    checks.push({ id: id("ratio"), scope, level: "warn", title: "Banner is portrait", detail: "The home page hero expects a wide image." });
  }
  if (checks.length === 0) checks.push({ id: id("ok"), scope, level: "ok", title: `${scope === "cover" ? "Cover" : "Banner"} ${size}` });
  return checks;
}

function chapterChecks(chapter: ChapterScan): Check[] {
  const scope = chapter.slug;
  const id = (s: string) => `${scope}:${s}`;
  const checks: Check[] = [];
  const { pages } = chapter;
  // Page URLs use the padded name (chapter-01), so the folder must use it too.
  const padded = `chapter-${String(chapter.number).padStart(2, "0")}`;
  if (chapter.slug !== padded) {
    checks.push({ id: id("name"), scope, level: "error", title: `Rename ${chapter.slug}/ to ${padded}/` });
  }

  if (pages.length === 0) {
    checks.push({ id: id("empty"), scope, level: "error", title: "No numbered PNG pages", detail: "Name pages 1.png, 2.png, 3.png …" });
  } else {
    const byNumber = new Map<number, string[]>();
    for (const page of pages) byNumber.set(page.number, [...(byNumber.get(page.number) ?? []), page.name]);
    const max = Math.max(...byNumber.keys());
    let numbered = true;
    for (let n = 1; n <= max; n++) {
      const names = byNumber.get(n);
      if (!names) {
        numbered = false;
        checks.push({ id: id(`gap-${n}`), scope, level: "error", title: `Page ${n} is missing`, detail: "Pages must be numbered 1 to n with no gaps." });
      } else if (names.length > 1) {
        numbered = false;
        checks.push({ id: id(`dup-${n}`), scope, level: "error", title: `Page ${n} appears twice (${names.join(", ")})` });
      }
    }
    if (numbered) checks.push({ id: id("numbered"), scope, level: "ok", title: `${max} pages, numbered 1–${max}` });

    const unreadable = pages.filter((p) => !p.readable);
    for (const page of unreadable) checks.push({ id: id(`unreadable-${page.name}`), scope, level: "error", title: `${page.name} can't be read as a PNG` });

    const sizes = new Set(pages.filter((p) => p.readable).map((p) => `${p.width}×${p.height}`));
    if (sizes.size > 1) {
      checks.push({ id: id("sizes"), scope, level: "warn", title: "Mixed page sizes", detail: `Found ${[...sizes].join(", ")}. Allowed: each page keeps its own size. Check that it's intended.` });
    } else if (sizes.size === 1 && unreadable.length === 0) {
      checks.push({ id: id("sizes"), scope, level: "ok", title: `All pages ${[...sizes][0]}` });
    }
  }
  if (chapter.ignored.length > 0) {
    checks.push({ id: id("ignored"), scope, level: "warn", title: `Ignored files: ${chapter.ignored.join(", ")}` });
  }
  return checks;
}

/** Checks the originals folder: cover, banner, chapter folders and page numbering. */
export function checkArtwork(scan: FolderScan): Check[] {
  const checks = [...imageChecks(scan.cover, "cover"), ...imageChecks(scan.banner, "banner")];
  if (scan.chapters.length === 0) {
    checks.push({ id: "book:no-chapters", scope: "book", level: "error", title: "No chapter folders (chapter-01/, chapter-02/, …)" });
  }
  const numbers = new Set(scan.chapters.map((c) => c.number));
  for (const n of numbers) {
    const folders = scan.chapters.filter((c) => c.number === n).map((c) => `${c.slug}/`);
    if (folders.length > 1) {
      checks.push({ id: `book:chapter-dup-${n}`, scope: "book", level: "error", title: `Chapter ${n} appears twice (${folders.join(", ")})` });
    }
  }
  const maxChapter = Math.max(0, ...numbers);
  for (let n = 1; n <= maxChapter; n++) {
    if (!numbers.has(n)) {
      const slug = `chapter-${String(n).padStart(2, "0")}`;
      checks.push({ id: `book:chapter-gap-${n}`, scope: "book", level: "error", title: `${slug}/ is missing`, detail: "Chapter folders must be numbered 1 to n." });
    }
  }
  if (scan.ignored.length > 0) checks.push({ id: "book:ignored", scope: "book", level: "warn", title: `Ignored files: ${scan.ignored.join(", ")}` });
  for (const chapter of scan.chapters) checks.push(...chapterChecks(chapter));
  return checks;
}

/** Compares originals with the exported WebP pages, one check per chapter. */
export function checkExport(scan: FolderScan, exported: ExportedChapter[]): Check[] {
  return scan.chapters.map((chapter): Check => {
    const base = { id: `export:${chapter.slug}`, scope: chapter.slug };
    const done = exported.find((e) => e.slug === chapter.slug);
    if (!done || done.pages.length === 0) return { ...base, level: "warn", title: "Not exported yet" };
    if (done.pages.length !== chapter.pages.length) {
      return { ...base, level: "warn", title: `Needs re-export: ${chapter.pages.length} originals, ${done.pages.length} exported` };
    }
    const changed = chapter.pages.filter((page) => {
      const webp = done.pages.find((p) => p.order === page.number);
      return !webp || page.mtimeMs > webp.mtimeMs;
    });
    if (changed.length > 0) {
      const list = changed.map((p) => p.number).join(", ");
      return { ...base, level: "warn", title: `Needs re-export: page${changed.length > 1 ? "s" : ""} ${list} changed` };
    }
    return { ...base, level: "ok", title: "Export up to date" };
  });
}

/** Editorial gate (GRAPHIC_NOVEL_PLATFORM.md §6). Errors block publishing; warnings are recommendations. */
export function checkEditorial(book: Book, approvals: Approvals): Check[] {
  const checks: Check[] = [];
  const add = (id: string, level: Check["level"], title: string, detail?: string) => checks.push({ id: `editorial:${id}`, scope: "book", level, title, detail });

  if (!book.title.trim()) add("title", "error", "Title missing");
  if (!book.synopsis.trim()) add("synopsis", "error", "Synopsis missing");
  if (book.genres.length === 0) add("genres", "error", "No genre");
  if (!book.artworkDisclosure?.trim()) {
    add("disclosure", "error", "Artwork disclosure missing", "Say how the art was made, so it can't be mistaken for archival imagery.");
  }
  if (isHistorical(book) && !approvals.sourceRegisterConfirmed && !book.sourceNotesUrl) {
    add("sources", "error", "Source register not confirmed", "Every factual claim on the pages (dates, names, numbers, places) needs a source.");
  }
  if (!book.contentNotes?.length && !approvals.noContentNotes) add("notes", "warn", "Content notes not decided");

  const pages = book.chapters.flatMap((c) => c.pages);
  const withAlt = pages.filter((p) => p.alt?.trim()).length;
  if (pages.length > 0 && withAlt < pages.length) add("alt", "warn", `Alt text on ${withAlt} of ${pages.length} pages`, "Recommended for every page.");
  return checks;
}

/** Why an export ("all" or one chapter slug) can't run yet. Checked before any file is written. */
export function exportProblems(scan: FolderScan, book: Book, target: string): string[] {
  const errors = checkArtwork(scan).filter((c) => c.level === "error");
  if (errors.length) return [`Fix the artwork first: ${errors.map((c) => c.title).join("; ")}`];
  if (target === "all") return [];
  const chapter = scan.chapters.find((c) => c.slug === target);
  if (!chapter) return [`No ${target}/ folder`];
  if (chapter.number > book.chapters.length + 1) return [`Export chapter-${String(chapter.number - 1).padStart(2, "0")} first`];
  return [];
}

export const isHistorical =(book: Book) => book.genres.some((g) => g.trim().toLowerCase() === "historical");

/** Why these chapters can't be published yet; empty when they can. */
export function publishProblems(book: Book, approvals: Approvals, chapterSlugs: string[]): string[] {
  if (book.status === "draft") return ["Send the book to review first (step 4)"];
  const chosen = book.chapters.filter((c) => chapterSlugs.includes(c.slug));
  if (chosen.length === 0) return ["Choose at least one chapter to publish"];
  const problems: string[] = [];
  const unchecked = chosen.filter((c) => !approvals.artworkReviewed?.[c.slug]).map((c) => c.slug);
  if (unchecked.length) problems.push(`Tick "I checked the artwork" for ${unchecked.join(", ")} first (step 4)`);
  const blocking = checkEditorial(book, approvals).filter((c) => c.level === "error");
  if (blocking.length) problems.push(`Fix the blocking editorial items first: ${blocking.map((c) => c.title).join("; ")}`);
  return problems;
}

type StageInput = {
  book: Book | undefined;
  scan: FolderScan | undefined;
  artwork: Check[];
  exported: Check[];
  editorial: Check[];
  approvals: Approvals;
};

/** Where a book is in the six-step pipeline, and the one next action. */
export function stageOf({ book, artwork, exported, editorial }: StageInput): Stage {
  if (!book) return { step: 1, key: "new", label: "New folder", next: "Create book" };
  if (hasErrors(artwork)) return { step: 2, key: "artwork", label: "Artwork check", next: "Fix artwork" };
  const exportPending = exported.some((c) => c.level !== "ok") || book.chapters.length === 0;
  if (book.status === "published") return { step: 6, key: "published", label: "Published", next: hasErrors(editorial) ? "Fix editorial" : "Open" };
  if (exportPending) return { step: 3, key: "export", label: "Export", next: "Export" };
  if (book.status === "draft") return { step: 4, key: "review", label: "Review", next: "Review pages" };
  if (hasErrors(editorial)) return { step: 5, key: "editorial", label: "Editorial", next: "Fix editorial" };
  return { step: 6, key: "ready", label: "Ready to publish", next: "Publish" };
}
