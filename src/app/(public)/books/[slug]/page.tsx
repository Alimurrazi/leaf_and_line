import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ChapterList } from "@/features/books/chapter-list";
import { ReadingActions } from "@/features/books/reading-actions";
import { getBookBySlug, getPublishedBooks } from "@/lib/content-repository";
import { plural } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedBooks().map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = getBookBySlug((await params).slug);
  return book ? { title: book.title, description: book.synopsis } : {};
}

const SERIES_LABEL = { ongoing: "Ongoing", complete: "Complete", "one-shot": "One-shot" } as const;

export default async function BookPage({ params }: Props) {
  const book = getBookBySlug((await params).slug);
  if (!book) notFound();

  const pageCount = book.chapters.reduce((total, chapter) => total + chapter.pages.length, 0);
  const hasNotes = Boolean(book.credits?.length || book.artworkDisclosure || book.sourceNotesUrl);

  return (
    <Container>
      <section className="grid gap-[25px] py-8 md:grid-cols-[minmax(220px,360px)_1fr] md:gap-16 md:py-[60px]">
        <Image
          src={book.cover.url}
          alt={book.cover.alt}
          width={book.cover.width}
          height={book.cover.height}
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 900px) 360px, 320px"
          className="h-auto w-full max-w-[320px] rounded-[9px] md:max-w-none"
        />
        <div>
          <Eyebrow>Graphic novel · {book.genres.join(", ")}</Eyebrow>
          <h1 className="my-[15px] text-[40px] md:text-[clamp(40px,5vw,62px)]">{book.title}</h1>
          {book.subtitle && <p className="mb-3 text-lg text-muted">{book.subtitle}</p>}
          {book.seriesStatus && <Badge>{SERIES_LABEL[book.seriesStatus]}</Badge>}
          <p className="my-6 max-w-[660px] text-[#505050]">{book.synopsis}</p>
          <ReadingActions book={book} />
          <p className="text-[13px] text-muted">
            {plural(book.chapters.length, "chapter")} · {plural(pageCount, "page")}
          </p>

          {book.contentNotes?.length ? (
            <aside aria-labelledby="content-notes" className="mt-6 rounded-card border border-border bg-surface p-4">
              <h2 id="content-notes" className="text-base">
                Content notes
              </h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                {book.contentNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </aside>
          ) : null}

          <hr className="my-9 border-border" />
          <h2 className="text-[27px]">Chapters</h2>
          <ChapterList book={book} />

          {hasNotes && (
            <>
              <hr className="my-9 border-border" />
              <h2 className="text-[22px]">Credits &amp; source notes</h2>
              {book.credits?.length ? (
                <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
                  {book.credits.map((credit) => (
                    <Fragment key={`${credit.role}-${credit.name}`}>
                      <dt className="text-muted">{credit.role}</dt>
                      <dd>{credit.name}</dd>
                    </Fragment>
                  ))}
                </dl>
              ) : null}
              {book.artworkDisclosure && <p className="mt-3 text-sm text-muted">{book.artworkDisclosure}</p>}
              {book.sourceNotesUrl && (
                <p className="mt-3 text-sm">
                  <a href={book.sourceNotesUrl} className="font-semibold underline hover:text-accent-hover">
                    Sources and adaptation notes
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </Container>
  );
}
