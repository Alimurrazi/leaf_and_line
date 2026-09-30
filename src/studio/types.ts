// Shared types for the local studio (never used by the public site).

export type ImageFile = { name: string; width: number; height: number; mtimeMs: number; readable: boolean };
export type PageFile = ImageFile & { number: number };

export type ChapterScan = {
  slug: string; // folder name, e.g. "chapter-01"
  number: number;
  pages: PageFile[]; // sorted by number
  ignored: string[]; // files that are not numbered PNGs
};

/** What is inside artwork-originals/<slug>/. */
export type FolderScan = {
  slug: string;
  exists: boolean;
  cover: ImageFile | null;
  banner: ImageFile | null;
  chapters: ChapterScan[]; // sorted by number
  ignored: string[];
};

/** Exported WebP pages found in public/novels/<slug>/<chapter>/. */
export type ExportedChapter = { slug: string; pages: { order: number; mtimeMs: number }[] };

export type CheckLevel = "error" | "warn" | "ok" | "info";
export type Check = {
  id: string;
  scope: string; // "book", "cover", "banner" or a chapter slug
  level: CheckLevel;
  title: string;
  detail?: string;
};

/** Local workflow state kept in artwork-originals/<slug>/.studio.json (gitignored). */
export type Approvals = {
  artworkReviewed?: Record<string, boolean>; // by chapter slug
  sourceRegisterConfirmed?: boolean;
  noContentNotes?: boolean;
};

export type StageKey = "new" | "artwork" | "export" | "review" | "editorial" | "ready" | "published";
export type Stage = { step: 1 | 2 | 3 | 4 | 5 | 6; key: StageKey; label: string; next: string };
