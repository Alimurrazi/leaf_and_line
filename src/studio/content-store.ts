// Reads and writes book JSON in src/content/books/. Every write is validated against the whole catalog first,
// so the studio can never save content that would break the public build.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validateBooks } from "@/lib/content-validation";
import type { Book, Chapter, ComicPage, PublicationStatus } from "@/types/content";
import { writeIndex } from "./content-index";
import { assertSlug, bookDirs, studioPaths } from "./paths";

const pad = (n: number) => String(n).padStart(2, "0");
const PLACEHOLDER_COVER = { width: 1200, height: 1800 };

export function listBookSlugs(root: string): string[] {
  const dir = studioPaths(root).books;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""))
    .sort();
}

export function readBook(root: string, slug: string): Book | undefined {
  const file = bookDirs(root, slug).json;
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Book) : undefined;
}

export const readAllBooks = (root: string): Book[] => listBookSlugs(root).map((slug) => readBook(root, slug)!);

/** Validates the catalog with these books replaced or added, then writes them and the index. */
function writeBooks(root: string, changed: Book[]): void {
  for (const book of changed) {
    assertSlug(book.slug);
    if (book.id !== book.slug) throw new Error(`Book id "${book.id}" must match its slug "${book.slug}"`);
  }
  const slugs = new Set(changed.map((b) => b.slug));
  const catalog = [...readAllBooks(root).filter((b) => !slugs.has(b.slug)), ...changed];
  const errors = validateBooks(catalog);
  if (errors.length > 0) throw new Error(`Invalid content:\n- ${errors.join("\n- ")}`);

  const isNew = changed.some((b) => !existsSync(bookDirs(root, b.slug).json));
  for (const book of changed) writeFileSync(bookDirs(root, book.slug).json, JSON.stringify(book, null, 2) + "\n");
  if (isNew) writeIndex(studioPaths(root).books);
}

export const writeBook = (root: string, book: Book) => writeBooks(root, [book]);

export type BookMetadata = {
  title: string;
  subtitle?: string;
  synopsis: string;
  genres: string[];
  seriesStatus?: Book["seriesStatus"];
  credits?: { role: string; name: string }[];
  contentNotes?: string[];
  artworkDisclosure?: string;
  sourceNotesUrl?: string;
};

export function createBook(root: string, slug: string, meta: BookMetadata): Book {
  assertSlug(slug);
  if (existsSync(bookDirs(root, slug).json)) throw new Error(`Book "${slug}" already exists`);
  const title = meta.title.trim();
  const draft: Book = {
    id: slug,
    slug,
    title,
    synopsis: "",
    // Placeholder until the cover is exported; drafts are never public.
    cover: { url: `/novels/${slug}/cover.webp`, ...PLACEHOLDER_COVER, alt: `${title} cover` },
    genres: [],
    status: "draft",
    chapters: [],
  };
  const book = updateMetadata(draft, meta);
  writeBook(root, book);
  return book;
}

const clean = (value: string | undefined) => value?.trim() || undefined;
const cleanList = (values: string[] | undefined) => (values ?? []).map((v) => v.trim()).filter(Boolean);

export function updateMetadata(book: Book, meta: BookMetadata): Book {
  const title = meta.title.trim();
  const credits = (meta.credits ?? []).map((c) => ({ role: c.role.trim(), name: c.name.trim() })).filter((c) => c.role && c.name);
  const contentNotes = cleanList(meta.contentNotes);
  const next: Book = {
    ...book,
    title,
    subtitle: clean(meta.subtitle),
    synopsis: meta.synopsis.trim(),
    genres: cleanList(meta.genres),
    seriesStatus: meta.seriesStatus || undefined,
    credits: credits.length ? credits : undefined,
    contentNotes: contentNotes.length ? contentNotes : undefined,
    artworkDisclosure: clean(meta.artworkDisclosure),
    sourceNotesUrl: clean(meta.sourceNotesUrl),
  };
  // Keep generated alt text in step with the title; leave authored alt text alone.
  if (book.cover.alt === `${book.title} cover`) next.cover = { ...book.cover, alt: `${title} cover` };
  if (book.banner && book.banner.alt === `${book.title} banner`) next.banner = { ...book.banner, alt: `${title} banner` };
  return JSON.parse(JSON.stringify(next)) as Book; // drops undefined keys
}

export function setCoverImage(book: Book, kind: "cover" | "banner", size: { width: number; height: number }): Book {
  const url = `/novels/${book.slug}/${kind}.webp`;
  const alt = book[kind]?.alt ?? `${book.title} ${kind}`;
  return { ...book, [kind]: { url, ...size, alt } };
}

type PageSize = { order: number; width: number; height: number };

/** Adds or replaces chapter N with freshly exported pages, keeping its title, status and alt text. */
export function mergeExportedChapter(book: Book, number: number, pages: PageSize[]): Book {
  if (number > book.chapters.length + 1) throw new Error(`Export chapter-${pad(number - 1)} first`);
  const slug = `chapter-${pad(number)}`;
  const existing = book.chapters.find((c) => c.order === number);
  const chapterId = `${book.slug}-c${pad(number)}`;
  const nextPages: ComicPage[] = pages.map(({ order, width, height }) => {
    const alt = existing?.pages.find((p) => p.order === order)?.alt;
    return {
      id: `${chapterId}-p${pad(order)}`,
      order,
      imageUrl: `/novels/${book.slug}/${slug}/page-${pad(order)}.webp`,
      width,
      height,
      ...(alt ? { alt } : {}),
    };
  });
  const chapter: Chapter = existing
    ? { ...existing, pages: nextPages }
    : { id: chapterId, slug, title: `Chapter ${number}`, order: number, status: "draft", pages: nextPages };
  const chapters = [...book.chapters.filter((c) => c.order !== number), chapter].sort((a, b) => a.order - b.order);
  return { ...book, chapters };
}

/** Alt text is kept by page number, so a changed page count may leave descriptions on the wrong pages. */
export function altShiftWarning(existing: Chapter | undefined, pages: PageSize[]): string | null {
  if (!existing || existing.pages.length === pages.length || !existing.pages.some((p) => p.alt?.trim())) return null;
  return `${existing.slug} now has ${pages.length} pages instead of ${existing.pages.length}: alt text stays with page numbers, so check it`;
}

export function setPageAlt(book: Book, chapterSlug: string, order: number, alt: string): Book {
  const text = alt.trim();
  return {
    ...book,
    chapters: book.chapters.map((c) =>
      c.slug !== chapterSlug
        ? c
        : {
            ...c,
            pages: c.pages.map((p) => {
              if (p.order !== order) return p;
              const { alt: _old, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
              return text ? { ...rest, alt: text } : rest;
            }),
          },
    ),
  };
}

export function setChapterTitle(book: Book, chapterSlug: string, title: string): Book {
  const text = title.trim();
  if (!text) return book;
  return { ...book, chapters: book.chapters.map((c) => (c.slug === chapterSlug ? { ...c, title: text } : c)) };
}

/**
 * Sets the book's status. Publishing makes exactly the listed chapters live and returns the others to draft;
 * other statuses change only the listed chapters.
 */
export function setPublication(book: Book, status: PublicationStatus, chapterSlugs: string[] = []): Book {
  const listed = new Set(chapterSlugs);
  const chapterStatus = (c: Chapter): PublicationStatus => (listed.has(c.slug) ? status : status === "published" ? "draft" : c.status);
  return { ...book, status, chapters: book.chapters.map((c) => ({ ...c, status: chapterStatus(c) })) };
}

/** Makes this book the featured one and clears the flag everywhere else, in one validated write. */
export function setFeatured(root: string, slug: string, featured = true): void {
  const changed = readAllBooks(root)
    .filter((b) => (b.slug === slug ? Boolean(b.featured) !== featured : featured && b.featured))
    .map((b) => {
      const { featured: _f, ...rest } = b; // eslint-disable-line @typescript-eslint/no-unused-vars
      return b.slug === slug && featured ? { ...rest, featured: true } : rest;
    });
  if (changed.length > 0) writeBooks(root, changed);
}

export const bookJsonRelative = (slug: string) => path.posix.join("src/content/books", `${assertSlug(slug)}.json`);
