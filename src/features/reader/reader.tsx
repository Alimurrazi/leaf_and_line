"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { writeProgress } from "@/features/reading-progress/progress-store";
import type { ChapterLink } from "@/lib/content-repository";
import { bookHref } from "@/lib/routes";
import type { Chapter } from "@/types/content";
import { ChapterMenu } from "./chapter-menu";
import { EndOfChapter } from "./end-of-chapter";
import { parsePageParam } from "./page-param";
import { ReaderStage } from "./reader-stage";
import { useReaderKeyboard } from "./use-reader-keyboard";

export type ReaderProps = {
  book: { slug: string; title: string };
  chapter: Chapter;
  chapters: ChapterLink[];
  next: ChapterLink | null;
};

export function Reader({ book, chapter, chapters, next }: ReaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCount = chapter.pages.length;
  const { page, canonical } = parsePageParam(searchParams.get("page"), pageCount);
  const current = chapter.pages[page - 1];
  const [atEnd, setAtEnd] = useState(false);

  // Correct invalid ?page values without adding a history entry.
  useEffect(() => {
    if (!canonical) router.replace(`${pathname}?page=${page}`, { scroll: false });
  }, [canonical, page, pathname, router]);

  // Save progress only for a page that was actually shown.
  useEffect(() => {
    writeProgress(book.slug, { chapterSlug: chapter.slug, page });
  }, [book.slug, chapter.slug, page]);

  // Preload only the next page, never the whole chapter.
  useEffect(() => {
    const upcoming = chapter.pages[page];
    if (upcoming) new window.Image().src = upcoming.imageUrl;
  }, [chapter.pages, page]);

  const goTo = useCallback(
    (target: number) => {
      setAtEnd(false);
      router.replace(`${pathname}?page=${target}`, { scroll: false });
    },
    [pathname, router],
  );
  const goNext = useCallback(() => {
    if (atEnd) return;
    if (page < pageCount) goTo(page + 1);
    else setAtEnd(true);
  }, [atEnd, goTo, page, pageCount]);
  const goPrevious = useCallback(() => {
    if (atEnd) setAtEnd(false);
    else if (page > 1) goTo(page - 1);
  }, [atEnd, goTo, page]);

  useReaderKeyboard({ onNext: goNext, onPrevious: goPrevious });

  const previousDisabled = page === 1 && !atEnd;

  return (
    <div className="flex h-dvh flex-col bg-reader text-reader-text">
      <div
        role="progressbar"
        aria-label="Chapter progress"
        aria-valuemin={1}
        aria-valuemax={pageCount}
        aria-valuenow={page}
        className="h-[3px] shrink-0 bg-[#35383e]"
      >
        <div className="h-full bg-reader-progress transition-[width] duration-200" style={{ width: `${(page / pageCount) * 100}%` }} />
      </div>

      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-reader-border px-3.5 sm:h-[72px] sm:px-8">
        <Link href={bookHref(book.slug)} aria-label={`Back to ${book.title}`} className={buttonClasses({ variant: "readerOutline", size: "sm" })}>
          ← Back
        </Link>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-[15px] tracking-normal">{book.title}</h1>
          <p className="text-xs text-[#b7b8bd]">
            {chapter.title} · Page {page} of {pageCount}
          </p>
        </div>
        <ChapterMenu bookSlug={book.slug} chapters={chapters} currentSlug={chapter.slug} />
      </header>

      <main id="main" className="relative min-h-0 flex-1 p-2 sm:p-4">
        <ReaderStage page={current} />
        {atEnd && <EndOfChapter bookSlug={book.slug} chapterTitle={chapter.title} next={next} onDismiss={() => setAtEnd(false)} />}
      </main>

      <nav aria-label="Reader controls" className="flex shrink-0 items-center justify-between gap-2 px-2 py-2 sm:px-8 sm:py-3">
        <button type="button" onClick={goPrevious} aria-disabled={previousDisabled} className={buttonClasses({ variant: "reader", size: "sm" })}>
          ← Previous
        </button>
        <span aria-hidden="true" className="text-[13px] text-[#c6c6ca]">
          {page} / {pageCount}
        </span>
        <button type="button" onClick={goNext} aria-disabled={atEnd} className={buttonClasses({ variant: "reader", size: "sm" })}>
          {page === pageCount ? "Finish chapter" : "Next →"}
        </button>
      </nav>

      <p className="sr-only" aria-live="polite">
        {atEnd ? `End of ${chapter.title}` : `Page ${page} of ${pageCount}`}
      </p>
    </div>
  );
}
