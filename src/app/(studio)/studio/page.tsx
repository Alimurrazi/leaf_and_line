import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buttonClasses } from "@/components/ui/button";
import { Chip, Code, PipelineBar } from "@/features/studio/status";
import { StudioHeader } from "@/features/studio/studio-header";
import { versionedUrl } from "@/studio/assets";
import { studioEnabled, studioRoot } from "@/studio/guard";
import type { BookState } from "@/studio/load";

const STAGES = [
  ["New folder", "Drop PNGs into artwork-originals/"],
  ["Artwork check", "Numbering, sizes, cover"],
  ["Export", "WebP and page sizes, automatic"],
  ["Review", "Real reader, alt text"],
  ["Editorial", "Disclosure, sources, notes"],
  ["Publish", "Status set; you commit"],
];

export default async function StudioDashboard() {
  if (!studioEnabled()) notFound();
  const { loadStudio } = await import("@/studio/load"); // loads sharp; never in production
  const books = await loadStudio(studioRoot());
  const attention = books.filter((b) => b.counts.errors > 0).length;

  return (
    <>
      <StudioHeader />
      <main id="main" className="flex flex-col gap-8 px-4 py-10 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Studio</Eyebrow>
            <h1 className="font-display text-[40px] font-extrabold leading-tight">Books</h1>
            <p className="text-muted">
              {books.length} book{books.length === 1 ? "" : "s"}
              {attention > 0 && ` · ${attention} need${attention === 1 ? "s" : ""} attention`} · scanned <Code>artwork-originals/</Code> just now
            </p>
          </div>
          <Link href="/studio" className={buttonClasses({ variant: "outline" })}>
            Rescan folders
          </Link>
        </div>

        <ol aria-label="How a book moves through the studio" className="grid grid-cols-2 gap-2 md:grid-cols-6">
          {STAGES.map(([title, detail], i) => (
            <li key={title} className="flex flex-col gap-0.5 rounded-[10px] border border-border bg-surface px-3.5 py-3">
              <span className="text-xs font-bold text-accent-text">STEP {i + 1}</span>
              <span className="font-bold">{title}</span>
              <span className="text-xs text-muted">{detail}</span>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((state) => (
            <BookCard key={state.slug} state={state} />
          ))}
          <AddBookCard />
        </div>
      </main>
    </>
  );
}

function BookCard({ state }: { state: BookState }) {
  const { book, stage, counts, slug, scan } = state;
  const cover = book ? versionedUrl(studioRoot(), book.cover.url) : null;
  const pages = book ? book.chapters.reduce((n, c) => n + c.pages.length, 0) : scan.chapters.reduce((n, c) => n + c.pages.length, 0);
  const chapters = book ? book.chapters.length : scan.chapters.length;
  const tone = stage.key === "published" ? "ok" : stage.key === "ready" ? "ok" : "neutral";

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- local studio thumbnail
        <img src={cover} alt={book?.cover.alt ?? ""} className="h-[300px] w-full border-b border-border object-cover object-top" />
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 border-b border-dashed border-[#cbc7c0] bg-bg p-4 text-center text-muted">
          <span className="font-semibold">No cover yet</span>
          <span className="text-xs">{scan.cover ? "Export to create cover.webp" : <><Code>cover.png</Code> not found</>}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-[18px]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">{book?.title || slug}</h2>
          <Chip tone={tone}>{stage.label}</Chip>
        </div>
        <span className="text-[13px] text-muted">
          {chapters} chapter{chapters === 1 ? "" : "s"} · {pages} {book ? "pages" : "PNG files"}
          {book?.featured ? " · featured" : ""}
        </span>
        <PipelineBar step={stage.step} />
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          {counts.errors > 0 ? (
            <Chip tone="error">{counts.errors} problem{counts.errors === 1 ? "" : "s"}</Chip>
          ) : counts.warnings > 0 ? (
            <Chip tone="warn">{counts.warnings} warning{counts.warnings === 1 ? "" : "s"}</Chip>
          ) : (
            <Chip tone="ok">All clear</Chip>
          )}
          <Link href={`/studio/${slug}`} className="font-bold">
            {stage.next} →
          </Link>
        </div>
      </div>
    </article>
  );
}

function AddBookCard() {
  return (
    <article className="flex flex-col justify-center gap-3.5 rounded-card border-[1.5px] border-dashed border-[#cbc7c0] p-7 sm:col-span-2">
      <h2 className="font-display text-lg font-bold">Add a book</h2>
      <p className="text-muted">
        Make a folder named with the book&apos;s slug. It appears here on the next scan. The files stay on your machine and are never committed.
      </p>
      <pre className="overflow-x-auto rounded-control border border-border bg-surface p-4 font-mono text-[13px] leading-relaxed">
        {`artwork-originals/
  your-book-slug/
    cover.png        upright, about 2:3, 1200px+ wide
    banner.png       optional, for the home page
    chapter-01/
      1.png  2.png  3.png …`}
      </pre>
    </article>
  );
}
