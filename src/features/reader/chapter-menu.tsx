import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { ChapterLink } from "@/lib/content-repository";
import { readerHref } from "@/lib/routes";

export function ChapterMenu({
  bookSlug,
  chapters,
  currentSlug,
}: {
  bookSlug: string;
  chapters: ChapterLink[];
  currentSlug: string;
}) {
  return (
    <details className="relative">
      <summary
        className={buttonClasses({
          variant: "readerOutline",
          size: "sm",
          className: "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
        })}
      >
        Chapters
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-56 rounded-card border border-reader-border bg-reader-stage p-2 shadow-lg">
        {chapters.map((chapter) => (
          <li key={chapter.slug}>
            <Link
              href={readerHref(bookSlug, chapter.slug, 1)}
              aria-current={chapter.slug === currentSlug ? "page" : undefined}
              className="block rounded-control px-3 py-2.5 text-sm hover:bg-[#2b2d32] aria-[current=page]:text-reader-progress"
            >
              {chapter.title}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
