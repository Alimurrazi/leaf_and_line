"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { resolveContinueTarget } from "@/features/reading-progress/resolve-continue";
import { useBookProgress } from "@/features/reading-progress/use-book-progress";
import { readerHref } from "@/lib/routes";
import type { Book } from "@/types/content";

export function ReadingActions({ book }: { book: Book }) {
  const progress = useBookProgress(book.slug);
  const target = resolveContinueTarget(book, progress);
  const first = book.chapters[0];

  return (
    <div className="my-[25px] flex flex-wrap gap-3">
      <Link href={readerHref(book.slug, first.slug, 1)} className={buttonClasses()}>
        Start reading →
      </Link>
      {target && (
        <Link href={target.href} className={buttonClasses({ variant: "outline" })}>
          Continue · {target.chapterTitle}, page {target.page}
        </Link>
      )}
    </div>
  );
}
