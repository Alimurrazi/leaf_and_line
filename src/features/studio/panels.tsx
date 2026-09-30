import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import {
  exportAction,
  reviewArtworkAction,
  saveAltAction,
  saveChapterTitleAction,
  saveEditorialAction,
  setStatusAction,
} from "@/app/(studio)/studio/actions";
import { fileSizeKb, versionedUrl } from "@/studio/assets";
import { isHistorical } from "@/studio/checks";
import { commitCommands } from "@/studio/git";
import { studioRoot } from "@/studio/guard";
import type { BookState } from "@/studio/load";
import type { Book } from "@/types/content";
import { ActionForm } from "./action-form";
import { CopyButton } from "./copy-button";
import { fieldClass } from "./details-form";
import { PageReview } from "./page-review";
import { Card, CheckList, Chip, Code } from "./status";

const hasErrors = (checks: { level: string }[]) => checks.some((c) => c.level === "error");

/** Step 2: what is in the originals folder and what needs fixing. */
export function ArtworkPanel({ state }: { state: BookState }) {
  const { scan, checks, slug } = state;
  if (!state.hasOriginals) {
    return (
      <Card title="Artwork check">
        <p className="text-muted">
          No originals in <Code>artwork-originals/{slug}/</Code>.{" "}
          {state.book?.chapters.length ? "The book was exported before, so nothing is needed here. " : ""}
          Add <Code>cover.png</Code> and <Code>chapter-01/1.png</Code>, <Code>2.png</Code> … to check and export artwork.
        </p>
      </Card>
    );
  }
  const errorCount = checks.artwork.filter((c) => c.level === "error").length;
  return (
    <>
      <div role="status" className={`rounded-[10px] px-[18px] py-3.5 font-semibold ${errorCount ? "bg-error-tint text-error" : "bg-ok-tint text-ok"}`}>
        {errorCount
          ? `✕ ${errorCount} problem${errorCount === 1 ? "" : "s"} to fix before export. Checks run again every time you open this page.`
          : "✓ Artwork is ready to export."}
      </div>
      <Card title="Cover, banner and folder">
        <CheckList checks={checks.artwork.filter((c) => c.scope === "cover" || c.scope === "banner" || c.scope === "book")} />
      </Card>
      {scan.chapters.map((chapter) => (
        <Card key={chapter.slug} title={chapter.slug} aside={<span className="text-[13px] text-muted">{chapter.pages.length} files</span>}>
          <CheckList checks={checks.artwork.filter((c) => c.scope === chapter.slug)} />
          {chapter.pages.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold">Files</summary>
              <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[12.5px] sm:grid-cols-4">
                {chapter.pages.map((p) => (
                  <li key={p.name} className={p.readable ? "" : "text-error"}>
                    {p.name} {p.readable ? `${p.width}×${p.height}` : "unreadable"}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      ))}
      {state.book && (
        <Link href={`/studio/${slug}?step=3`} className={`self-start ${buttonClasses({ variant: errorCount ? "outline" : "primary" })}`}>
          Go to export →
        </Link>
      )}
    </>
  );
}

/** Step 3: export originals to WebP and fill in the page list. */
export function ExportPanel({ state }: { state: BookState }) {
  const { slug, checks, scan } = state;
  if (!state.hasOriginals) {
    return (
      <Card title="Export">
        <p className="text-muted">
          Nothing to export: <Code>artwork-originals/{slug}/</Code> has no originals. Existing WebP files in <Code>public/novels/{slug}/</Code> stay as they are.
        </p>
      </Card>
    );
  }
  const blocked = hasErrors(checks.artwork);
  return (
    <Card title="Export">
      <p className="mb-4 text-sm text-muted">
        Writes WebP (quality 90) to <Code>public/novels/{slug}/</Code> and fills in each chapter&apos;s pages and sizes. Alt text and chapter titles are kept.
      </p>
      <CheckList checks={checks.export} empty="No chapter folders yet." />
      <div className="mt-5 flex flex-wrap items-start gap-6 border-t border-border pt-5">
        <ActionForm action={exportAction} submit="Export everything" disabled={blocked} disabledHint="Fix the artwork problems first.">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="target" value="all" />
        </ActionForm>
        {scan.chapters.length > 1 &&
          scan.chapters.map((chapter) => (
            <ActionForm key={chapter.slug} action={exportAction} submit={`Export ${chapter.slug} only`} variant="outline" disabled={blocked}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="target" value={chapter.slug} />
            </ActionForm>
          ))}
      </div>
    </Card>
  );
}

/** Step 4: check pages in the reader, write alt text, then send the book to review. */
export function ReviewPanel({ state, chapterSlug }: { state: BookState; chapterSlug?: string }) {
  const book = state.book!;
  const chapter = book.chapters.find((c) => c.slug === chapterSlug) ?? book.chapters[0];
  const root = studioRoot();
  const reviewed = Boolean(state.approvals.artworkReviewed?.[chapter.slug]);
  const pages = chapter.pages.map((p) => ({ order: p.order, width: p.width, height: p.height, alt: p.alt ?? "", src: versionedUrl(root, p.imageUrl) ?? p.imageUrl, kb: fileSizeKb(root, p.imageUrl) }));

  return (
    <>
      {book.chapters.length > 1 && (
        <nav aria-label="Chapters" className="flex flex-wrap gap-2">
          {book.chapters.map((c) => (
            <Link key={c.slug} href={`/studio/${book.slug}?step=4&chapter=${c.slug}`} aria-current={c.slug === chapter.slug ? "page" : undefined}
              className={buttonClasses({ variant: c.slug === chapter.slug ? "primary" : "outline", size: "sm" })}>
              {c.title}
            </Link>
          ))}
        </nav>
      )}
      <Card title={`${chapter.title} · ${chapter.pages.length} pages`} aside={<Chip tone={chapter.status === "published" ? "ok" : "neutral"}>{chapter.status}</Chip>}>
        <ActionForm action={saveChapterTitleAction} submit="Save title" variant="outline" className="mb-6 flex flex-wrap items-end gap-3">
          <input type="hidden" name="slug" value={book.slug} />
          <input type="hidden" name="chapter" value={chapter.slug} />
          <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
            <label htmlFor="chapter-title" className="text-[13px] font-semibold">Chapter title</label>
            <input id="chapter-title" name="title" defaultValue={chapter.title} className={fieldClass} />
          </div>
        </ActionForm>
        <PageReview slug={book.slug} chapter={chapter.slug} bookTitle={book.title} chapterTitle={chapter.title} pages={pages} saveAlt={saveAltAction} />
      </Card>
      <Card title="Check and send to review">
        <div className="flex flex-col gap-5">
          <Link href={`/studio/preview/${book.slug}/${chapter.slug}?page=1`} target="_blank" className={`self-start ${buttonClasses({ variant: "outline" })}`}>
            Open {chapter.title} in the reader ↗
          </Link>
          <ActionForm action={reviewArtworkAction} submit="Save check" variant="outline" className="flex flex-col gap-3">
            <input type="hidden" name="slug" value={book.slug} />
            <input type="hidden" name="chapter" value={chapter.slug} />
            <label className="flex items-center gap-2.5 font-semibold">
              <input type="checkbox" name="reviewed" defaultChecked={reviewed} className="size-[18px]" />I checked {chapter.title} at 100%: captions are sharp
            </label>
          </ActionForm>
          {book.status === "draft" && (
            <ActionForm action={setStatusAction} submit="Send to review" className="border-t border-border pt-5">
              <input type="hidden" name="slug" value={book.slug} />
              <input type="hidden" name="status" value="review" />
            </ActionForm>
          )}
        </div>
      </Card>
    </>
  );
}

/** Step 5: the editorial gate from GRAPHIC_NOVEL_PLATFORM.md §6. */
export function EditorialPanel({ state }: { state: BookState }) {
  const book = state.book!;
  const blocking = state.checks.editorial.filter((c) => c.level === "error").length;
  const historical = isHistorical(book);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card title="Editorial checklist" aside={blocking ? <Chip tone="error">{blocking} blocking</Chip> : <Chip tone="ok">Nothing blocking</Chip>}>
        <p className="mb-2 text-[13px] text-muted">
          {historical ? "Historical book: the source register and disclosure are required. " : ""}✕ blocks publishing, ! is a recommendation.
        </p>
        <CheckList checks={state.checks.editorial} empty="All editorial items are done." />
        {state.checks.editorial.some((c) => c.id === "editorial:alt") && (
          <Link href={`/studio/${book.slug}?step=4`} className="mt-3 inline-block text-sm font-bold">Write alt text →</Link>
        )}
      </Card>
      <Card title="Fix here">
        <ActionForm action={saveEditorialAction} submit="Save editorial" className="flex flex-col gap-4">
          <input type="hidden" name="slug" value={book.slug} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ed-disclosure" className="text-[13px] font-semibold">Artwork disclosure</label>
            <textarea id="ed-disclosure" name="artworkDisclosure" rows={3} defaultValue={book.artworkDisclosure}
              placeholder="e.g. Illustrated with the help of AI image tools and edited by the author. These are artistic depictions, not archival images." className={fieldClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ed-notes" className="text-[13px] font-semibold">Content notes</label>
            <input id="ed-notes" name="contentNotes" defaultValue={book.contentNotes?.join(", ")} placeholder="Separate with commas" className={fieldClass} />
          </div>
          <label className="flex items-center gap-2.5 text-sm font-semibold">
            <input type="checkbox" name="noContentNotes" defaultChecked={state.approvals.noContentNotes} className="size-[18px]" />No content notes needed
          </label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ed-sources" className="text-[13px] font-semibold">Source notes link <span className="font-normal text-muted">(optional)</span></label>
            <input id="ed-sources" name="sourceNotesUrl" type="url" defaultValue={book.sourceNotesUrl} placeholder="https://" className={fieldClass} />
          </div>
          {historical && (
            <label className="flex items-center gap-2.5 text-sm font-semibold">
              <input type="checkbox" name="sourceRegisterConfirmed" defaultChecked={state.approvals.sourceRegisterConfirmed} className="size-[18px]" />
              I confirm the source register is complete
            </label>
          )}
        </ActionForm>
      </Card>
    </div>
  );
}

/** Step 6: publish chosen chapters, move the featured flag, and list what to commit. */
export function PublishPanel({ state, allBooks, gitStatus }: { state: BookState; allBooks: Book[]; gitStatus: string[] }) {
  const book = state.book!;
  const blocking = state.checks.editorial.filter((c) => c.level === "error");
  const otherFeatured = allBooks.find((b) => b.featured && b.slug !== book.slug);
  const canPublish = book.status !== "draft" && blocking.length === 0;
  const files = gitStatus.map((line) => line.slice(3));
  const commands = commitCommands(gitStatus, book.slug, book.status);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card title="Publish" aside={<Chip tone={book.status === "published" ? "ok" : "neutral"}>{book.status}</Chip>}>
        <ActionForm action={setStatusAction} submit={book.status === "published" ? "Publish changes" : "Publish"} disabled={!canPublish}
          disabledHint={book.status === "draft" ? "Send the book to review first." : `Fix first: ${blocking.map((c) => c.title).join("; ")}`}
          className="flex flex-col gap-4">
          <input type="hidden" name="slug" value={book.slug} />
          <input type="hidden" name="status" value="published" />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold">Chapters</legend>
            {book.chapters.map((c) => (
              <label key={c.slug} className="flex min-h-11 items-center justify-between gap-2.5 rounded-control border border-border px-3">
                <span className="flex items-center gap-2.5 font-semibold">
                  <input type="checkbox" name="chapter" value={c.slug} defaultChecked={c.status !== "draft" || book.chapters.length === 1} className="size-[18px]" />
                  {c.title}
                </span>
                <Chip tone={c.status === "published" ? "ok" : "neutral"}>{c.status === "published" ? "Live" : c.status}</Chip>
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2.5 font-semibold">
            <input type="checkbox" name="featured" defaultChecked={book.featured} className="size-[18px]" />
            Featured book on the home page {otherFeatured && <span className="font-normal text-muted">(replaces {otherFeatured.title})</span>}
          </label>
        </ActionForm>
        {book.status !== "draft" && (
          <ActionForm action={setStatusAction} submit={book.status === "published" ? "Unpublish (back to draft)" : "Back to draft"} variant="outline" className="mt-5 border-t border-border pt-5">
            <input type="hidden" name="slug" value={book.slug} />
            <input type="hidden" name="status" value="draft" />
          </ActionForm>
        )}
      </Card>
      <Card title="Changes to commit" aside={<Chip tone="neutral">{files.length} file{files.length === 1 ? "" : "s"}</Chip>}>
        <p className="mb-3 text-[13px] text-muted">The studio never commits. Put changes live with git:</p>
        {files.length ? (
          <>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-control border border-border bg-bg p-3.5 font-mono text-[12.5px] leading-relaxed">
              {gitStatus.join("\n")}
              {"\n\n"}
              {commands}
            </pre>
            <div className="mt-3">
              <CopyButton text={commands} />
            </div>
          </>
        ) : (
          <p className="text-sm">Nothing to commit for this book.</p>
        )}
      </Card>
    </div>
  );
}
