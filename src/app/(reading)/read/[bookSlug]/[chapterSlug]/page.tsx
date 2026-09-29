import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reader } from "@/features/reader/reader";
import { getChapter, getPublishedBooks } from "@/lib/content-repository";

type Props = { params: Promise<{ bookSlug: string; chapterSlug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedBooks().flatMap((book) =>
    book.chapters.map((chapter) => ({ bookSlug: book.slug, chapterSlug: chapter.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookSlug, chapterSlug } = await params;
  const context = getChapter(bookSlug, chapterSlug);
  return context ? { title: `${context.chapter.title} · ${context.book.title}` } : {};
}

export default async function ReadPage({ params }: Props) {
  const { bookSlug, chapterSlug } = await params;
  const context = getChapter(bookSlug, chapterSlug);
  if (!context) notFound();

  return (
    // useSearchParams (?page) is read on the client so the chapter can be pre-rendered statically.
    <Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-[#b7b8bd]">Loading…</div>}>
      <Reader
        book={{ slug: context.book.slug, title: context.book.title }}
        chapter={context.chapter}
        chapters={context.book.chapters.map((c) => ({ slug: c.slug, title: c.title }))}
        next={context.next}
      />
    </Suspense>
  );
}
