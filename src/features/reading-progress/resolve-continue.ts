import { readerHref } from "@/lib/routes";
import type { Book } from "@/types/content";
import type { BookProgress } from "./progress-store";

export type ContinueTarget = { chapterSlug: string; chapterTitle: string; page: number; href: string };

export function resolveContinueTarget(book: Book, progress: BookProgress | null | undefined): ContinueTarget | null {
  if (!progress) return null;
  const chapter = book.chapters.find((c) => c.slug === progress.chapterSlug);
  if (!chapter) return null;
  const page = Math.min(Math.max(progress.page, 1), chapter.pages.length);
  return { chapterSlug: chapter.slug, chapterTitle: chapter.title, page, href: readerHref(book.slug, chapter.slug, page) };
}
