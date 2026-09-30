import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { DetailsForm } from "@/features/studio/details-form";
import { ArtworkPanel, EditorialPanel, ExportPanel, PublishPanel, ReviewPanel } from "@/features/studio/panels";
import { Chip, Code } from "@/features/studio/status";
import { Stepper } from "@/features/studio/stepper";
import { StudioHeader } from "@/features/studio/studio-header";
import { readAllBooks } from "@/studio/content-store";
import { gitStatus } from "@/studio/git";
import { studioEnabled, studioRoot } from "@/studio/guard";
import type { BookState } from "@/studio/load";
import { isSlug } from "@/studio/paths";
import { stepsFor } from "@/studio/steps";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ step?: string; chapter?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slug} · Studio` };
}

export default async function StudioBookPage({ params, searchParams }: Props) {
  if (!studioEnabled()) notFound();
  const { slug } = await params;
  const { step, chapter } = await searchParams;
  if (!isSlug(slug)) notFound();

  const { loadBookState } = await import("@/studio/load"); // loads sharp; never in production
  const state = await loadBookState(studioRoot(), slug);
  if (!state.book && !state.scan.exists) notFound();

  const steps = stepsFor(state);
  const requested = Number(step);
  const fallback = state.book ? state.stage.step : 1;
  const active = steps.find((s) => s.n === requested && s.href) ? requested : steps.find((s) => s.n === fallback && s.href) ? fallback : 1;
  const allBooks = readAllBooks(studioRoot());
  const { book } = state;

  return (
    <>
      <StudioHeader />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-5 md:px-10">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/studio" className="font-semibold text-muted">
            ← Books
          </Link>
          <span aria-hidden="true" className="text-border">/</span>
          <h1 className="font-display text-[26px] font-extrabold">{book?.title || slug}</h1>
          <Chip tone={book?.status === "published" ? "ok" : "neutral"}>{book ? book.status : "New folder"}</Chip>
        </div>
        {book && book.chapters.length > 0 && (
          <Link href={`/studio/preview/${slug}/${book.chapters[0].slug}?page=1`} target="_blank" className={buttonClasses({ variant: "outline" })}>
            Preview ↗
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-8 px-4 py-8 md:flex-row md:px-10">
        <aside className="flex shrink-0 flex-col gap-7 md:w-[280px]">
          <Stepper steps={steps} active={active} />
          <Sidebar state={state} />
        </aside>
        <main id="main" className="flex min-w-0 flex-1 flex-col gap-6">
          {book?.status === "published" && state.checks.editorial.some((c) => c.level === "error") && active !== 5 && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-warn-tint px-[18px] py-3.5 text-warn">
              <span className="font-semibold">! This book is live, but editorial items are still open.</span>
              <Link href={`/studio/${slug}?step=5`} className="font-bold text-warn underline">
                Go to Editorial →
              </Link>
            </div>
          )}
          {active === 1 && <DetailsForm slug={slug} book={book} knownGenres={[...new Set(allBooks.flatMap((b) => b.genres))].sort()} />}
          {active === 2 && <ArtworkPanel state={state} />}
          {active === 3 && <ExportPanel state={state} />}
          {active === 4 && <ReviewPanel state={state} chapterSlug={chapter} />}
          {active === 5 && <EditorialPanel state={state} />}
          {active === 6 && <PublishPanel state={state} allBooks={allBooks} gitStatus={gitStatus(studioRoot(), slug)} />}
        </main>
      </div>
    </>
  );
}

function Sidebar({ state }: { state: BookState }) {
  const { book, scan, slug } = state;
  return (
    <>
      {book && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-bold tracking-[0.08em] text-accent-text">CHAPTERS</p>
          {book.chapters.map((c) => (
            <Link key={c.slug} href={`/studio/${slug}?step=4&chapter=${c.slug}`} className="flex items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-2.5 font-semibold">
              {c.title} <Chip tone={c.status === "published" ? "ok" : "neutral"}>{c.status === "published" ? "Live" : c.status}</Chip>
            </Link>
          ))}
          <p className="rounded-control border-[1.5px] border-dashed border-[#cbc7c0] px-3 py-2.5 text-[13px] text-muted">
            New chapter: add <Code>chapter-{String(book.chapters.length + 1).padStart(2, "0")}/</Code> to <Code>artwork-originals/{slug}/</Code>
          </p>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <p className="text-[11px] font-bold tracking-[0.08em] text-accent-text">FOLDER</p>
        <div className="rounded-[10px] border border-border bg-surface p-3.5 font-mono text-[12.5px] leading-7">
          <div className="font-bold">artwork-originals/{slug}/</div>
          {!scan.exists ? (
            <div className="pl-3.5 font-sans text-muted">No originals</div>
          ) : (
            <>
              <div className={`pl-3.5 ${scan.cover?.readable ? "text-ok" : "text-error"}`}>{scan.cover?.readable ? "✓" : "✕"} cover.png</div>
              <div className={`pl-3.5 ${scan.banner ? "text-ok" : "text-muted"}`}>{scan.banner ? "✓" : "–"} banner.png</div>
              {scan.chapters.map((c) => (
                <div key={c.slug} className="pl-3.5">
                  {c.slug}/ <span className="font-sans text-muted">{c.pages.length} PNG</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
