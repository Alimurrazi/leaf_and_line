// Assembles everything the studio pages show about a book: its JSON, its originals, the checks and its stage.
import type { Book } from "@/types/content";
import { readApprovals } from "./approvals";
import { checkArtwork, checkEditorial, checkExport, stageOf } from "./checks";
import { listBookSlugs, readBook } from "./content-store";
import { listOriginalFolders, scanExported, scanFolder } from "./scan";
import type { Approvals, Check, ExportedChapter, FolderScan, Stage } from "./types";

export type BookState = {
  slug: string;
  book: Book | undefined;
  scan: FolderScan;
  hasOriginals: boolean;
  exported: ExportedChapter[];
  approvals: Approvals;
  checks: { artwork: Check[]; export: Check[]; editorial: Check[] };
  counts: { errors: number; warnings: number };
  stage: Stage;
};

export async function loadBookState(root: string, slug: string): Promise<BookState> {
  const book = readBook(root, slug);
  const scan = await scanFolder(root, slug);
  const exported = scanExported(root, slug);
  const approvals = readApprovals(root, slug);
  const artwork = scan.exists ? checkArtwork(scan) : [];
  const exportChecks = scan.exists ? checkExport(scan, exported) : [];
  const editorial = book ? checkEditorial(book, approvals) : [];
  const all = [...artwork, ...exportChecks, ...editorial];
  return {
    slug,
    book,
    scan,
    hasOriginals: scan.exists,
    exported,
    approvals,
    checks: { artwork, export: exportChecks, editorial },
    counts: {
      errors: all.filter((c) => c.level === "error").length,
      warnings: [...artwork, ...editorial].filter((c) => c.level === "warn").length,
    },
    stage: stageOf({ book, scan: scan.exists ? scan : undefined, artwork, exported: exportChecks, editorial, approvals }),
  };
}

const needsAttention = (s: BookState) => s.counts.errors > 0 || !["published", "ready"].includes(s.stage.key);

/** Every book JSON and every originals folder, the ones needing attention first. */
export async function loadStudio(root: string): Promise<BookState[]> {
  const slugs = [...new Set([...listBookSlugs(root), ...listOriginalFolders(root)])];
  const states = await Promise.all(slugs.map((slug) => loadBookState(root, slug)));
  return states.sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)) || a.slug.localeCompare(b.slug));
}
