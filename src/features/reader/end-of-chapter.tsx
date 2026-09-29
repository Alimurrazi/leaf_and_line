import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { ChapterLink } from "@/lib/content-repository";
import { bookHref, readerHref } from "@/lib/routes";

export function EndOfChapter({
  bookSlug,
  chapterTitle,
  next,
  onDismiss,
}: {
  bookSlug: string;
  chapterTitle: string;
  next: ChapterLink | null;
  onDismiss: () => void;
}) {
  return (
    <section
      aria-label={`End of ${chapterTitle}`}
      className="absolute inset-0 z-10 grid place-items-center bg-reader/90 p-6 text-center"
    >
      <div className="max-w-sm">
        <h2 className="text-2xl">End of {chapterTitle}</h2>
        <p className="mt-2 text-sm text-[#b7b8bd]">
          {next ? `Up next: ${next.title}` : "You’ve reached the latest chapter."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {next && (
            <Link href={readerHref(bookSlug, next.slug, 1)} className={buttonClasses({ variant: "reader" })}>
              Read {next.title} →
            </Link>
          )}
          <Link href={bookHref(bookSlug)} className={buttonClasses({ variant: "reader" })}>
            Back to book
          </Link>
          <button type="button" onClick={onDismiss} className={buttonClasses({ variant: "readerOutline" })}>
            Reread last page
          </button>
        </div>
      </div>
    </section>
  );
}
