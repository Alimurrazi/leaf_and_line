import { allBooks } from "@/content/books";
import type { Book, Chapter } from "@/types/content";
import { validateBooks } from "./content-validation";

export type ChapterLink = { slug: string; title: string };
export type ChapterContext = {
  book: Book;
  chapter: Chapter;
  previous: ChapterLink | null;
  next: ChapterLink | null;
};

export type RepositoryOptions = {
  /** Keep draft and review books and chapters. Only for the local studio preview, never the public site. */
  includeUnpublished?: boolean;
};

function toReaderView(book: Book, includeUnpublished: boolean): Book {
  const chapters = book.chapters
    .filter((chapter) => includeUnpublished || chapter.status === "published")
    .map((chapter) => ({
      ...chapter,
      pages: chapter.pages.map((page) => ({
        ...page,
        alt: page.alt ?? `${book.title}, ${chapter.title}, page ${page.order}`,
      })),
    }));
  return { ...book, chapters };
}

function toLink(chapter: Chapter | undefined): ChapterLink | null {
  return chapter ? { slug: chapter.slug, title: chapter.title } : null;
}

export function createContentRepository(source: Book[], { includeUnpublished = false }: RepositoryOptions = {}) {
  const errors = validateBooks(source);
  if (errors.length > 0) throw new Error(`Invalid content:\n- ${errors.join("\n- ")}`);

  const published = source
    .filter((book) => includeUnpublished || book.status === "published")
    .map((book) => toReaderView(book, includeUnpublished))
    .filter((book) => book.chapters.length > 0)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  const getBookBySlug = (slug: string) => published.find((book) => book.slug === slug);

  return {
    getPublishedBooks: (): Book[] => published,
    getFeaturedBook: (): Book | undefined => published.find((book) => book.featured) ?? published[0],
    getBookBySlug,
    getChapter(bookSlug: string, chapterSlug: string): ChapterContext | undefined {
      const book = getBookBySlug(bookSlug);
      if (!book) return undefined;
      const index = book.chapters.findIndex((chapter) => chapter.slug === chapterSlug);
      if (index < 0) return undefined;
      return {
        book,
        chapter: book.chapters[index],
        previous: toLink(book.chapters[index - 1]),
        next: toLink(book.chapters[index + 1]),
      };
    },
    getGenres: (): string[] => [...new Set(published.flatMap((book) => book.genres))].sort((a, b) => a.localeCompare(b)),
  };
}

export type ContentRepository = ReturnType<typeof createContentRepository>;

const repository = createContentRepository(allBooks);

export const { getPublishedBooks, getFeaturedBook, getBookBySlug, getChapter, getGenres } = repository;
