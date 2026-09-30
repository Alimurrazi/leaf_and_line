import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reader } from "@/features/reader/reader";
import { createContentRepository } from "@/lib/content-repository";
import { readAllBooks } from "@/studio/content-store";
import { studioEnabled, studioRoot } from "@/studio/guard";

type Props = { params: Promise<{ bookSlug: string; chapterSlug: string }> };

// The real reader over the JSON on disk, drafts included, so edits show up at once.
export default async function StudioPreviewPage({ params }: Props) {
  if (!studioEnabled()) notFound();
  const { bookSlug, chapterSlug } = await params;
  const repository = createContentRepository(readAllBooks(studioRoot()), { includeUnpublished: true });
  const context = repository.getChapter(bookSlug, chapterSlug);
  if (!context) notFound();

  return (
    <div className="bg-reader text-reader-text">
      <Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-[#b7b8bd]">Loading…</div>}>
        <Reader
          book={{ slug: context.book.slug, title: context.book.title }}
          chapter={context.chapter}
          chapters={context.book.chapters.map((c) => ({ slug: c.slug, title: c.title }))}
          next={context.next}
        />
      </Suspense>
      <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-reader-border bg-[#2b2d32] px-4 py-2 text-xs text-reader-text shadow-lg">
        <span className="font-bold tracking-[0.08em]">PREVIEW · {context.book.status.toUpperCase()}</span>
        <span className="hidden text-[#b7b8bd] sm:inline">Links inside the reader open the public site</span>
        <Link href={`/studio/${context.book.slug}?step=4&chapter=${context.chapter.slug}`} className="font-semibold underline">
          ← Back to studio
        </Link>
      </div>
    </div>
  );
}
