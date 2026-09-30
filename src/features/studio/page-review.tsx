"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import type { ActionResult } from "@/studio/action-result";
import { wrapFocus } from "@/studio/focus";

export type ReviewPage = { order: number; src: string; width: number; height: number; alt: string; kb: number | null };

type Props = {
  slug: string;
  chapter: string;
  bookTitle: string;
  chapterTitle: string;
  pages: ReviewPage[];
  saveAlt: (prev: ActionResult, data: FormData) => Promise<ActionResult>;
};

const label = (order: number) => String(order).padStart(2, "0");

/** Page thumbnails; clicking one opens a drawer to check the page and write its alt text. */
export function PageReview({ slug, chapter, bookTitle, chapterTitle, pages, saveAlt }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const withAlt = pages.filter((p) => p.alt.trim()).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <p className="text-muted">Click a page to check it at full size and write its alt text.</p>
        <span className="whitespace-nowrap font-semibold">
          Alt text {withAlt}/{pages.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {pages.map((page, index) => (
          <li key={page.order}>
            <button
              ref={(el) => {
                thumbs.current[index] = el;
              }}
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`Page ${label(page.order)}${page.alt.trim() ? ", has alt text" : ", no alt text"}`}
              className="flex w-full flex-col gap-1.5 text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local studio thumbnails */}
              <img src={page.src} alt="" className="aspect-[3/2] w-full rounded-md border border-border bg-[#e9e5dd] object-contain" />
              <span className="flex justify-between text-xs">
                <span className="font-bold">{label(page.order)}</span>
                <span className={page.alt.trim() ? "font-bold text-ok" : "text-muted"}>{page.alt.trim() ? "✓ alt" : "– no alt"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <PageDrawer
          key={pages[open].order}
          page={pages[open]}
          fallbackAlt={`${bookTitle}, ${chapterTitle}, page ${pages[open].order}`}
          slug={slug}
          chapter={chapter}
          saveAlt={saveAlt}
          onClose={() => {
            // Return focus to the page's thumbnail, where the reader left off.
            const index = open;
            setOpen(null);
            setTimeout(() => thumbs.current[index]?.focus(), 0);
          }}
          onPrev={open > 0 ? () => setOpen(open - 1) : undefined}
          onNext={open < pages.length - 1 ? () => setOpen(open + 1) : undefined}
        />
      )}
    </div>
  );
}

type DrawerProps = {
  page: ReviewPage;
  fallbackAlt: string;
  slug: string;
  chapter: string;
  saveAlt: Props["saveAlt"];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

function PageDrawer({ page, fallbackAlt, slug, chapter, saveAlt, onClose, onPrev, onNext }: DrawerProps) {
  const [state, formAction, pending] = useActionState(saveAlt, null);
  const [text, setText] = useState(page.alt);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaving, startLeaving] = useTransition();
  const textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => textRef.current?.focus(), []);
  const dirty = text.trim() !== page.alt.trim();

  // Moving to another page or closing saves changed alt text first, so nothing typed is lost.
  function leave(go?: () => void) {
    if (!go || leaving) return;
    if (!dirty) return go();
    startLeaving(async () => {
      const data = new FormData();
      data.set("slug", slug);
      data.set("chapter", chapter);
      data.set("order", String(page.order));
      data.set("alt", text);
      const result = await saveAlt(null, data);
      if (result?.ok) go();
      else setLeaveError(result?.message ?? "Couldn't save the alt text");
    });
  }

  // Keys are handled on the document so they work wherever focus is (even after clicking the image).
  const dialogRef = useRef<HTMLDivElement>(null);
  const onKey = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onKey.current = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        leave(onClose);
        return;
      }
      if (event.key === "Tab") {
        const focusables = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), textarea, [href]") ?? [])];
        const target = wrapFocus(focusables, document.activeElement as HTMLElement | null, event.shiftKey);
        if (target) {
          event.preventDefault();
          target.focus();
        }
        return;
      }
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") leave(onPrev);
      if (event.key === "ArrowRight") leave(onNext);
    };
  });
  useEffect(() => {
    const handle = (event: KeyboardEvent) => onKey.current(event);
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(26,26,26,0.45)]" onClick={() => leave(onClose)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Page ${label(page.order)}`}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-[620px] flex-col bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold">Page {label(page.order)}</span>
            <span className="text-xs text-muted">
              {page.width}×{page.height}
              {page.kb !== null && ` · ${page.kb} KB`} · page-{label(page.order)}.webp
            </span>
          </div>
          <button type="button" onClick={() => leave(onClose)} aria-label="Close" className={buttonClasses({ variant: "outline", size: "sm" })}>
            ×
          </button>
        </div>
        <form action={formAction} className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="chapter" value={chapter} />
          <input type="hidden" name="order" value={page.order} />
          <div className="rounded-md bg-reader p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local studio preview */}
            <img src={page.src} alt={`Page ${page.order}`} className="block h-auto w-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="alt" className="text-[13px] font-semibold">
              Alt text / scene summary
            </label>
            <textarea
              ref={textRef}
              id="alt"
              name="alt"
              rows={6}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Where and when, who is there and what happens. One or two sentences."
              className="min-h-11 w-full rounded-control border border-[#cbc7c0] bg-surface px-3 py-2.5"
            />
            <span className="text-xs text-muted">Without alt text, readers hear “{fallbackAlt}”.</span>
          </div>
          <p role="status" aria-live="polite" className={`text-sm font-semibold ${!leaveError && (leaving || state?.ok) ? "text-ok" : "text-error"}`}>
            {leaveError ?? (leaving ? "Saving…" : state?.message)}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => leave(onPrev)} disabled={!onPrev || leaving} className={buttonClasses({ variant: "outline" })}>
              ‹ Previous
            </button>
            <button type="submit" disabled={pending} className={buttonClasses()}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => leave(onNext)} disabled={!onNext || leaving} className={buttonClasses({ variant: "outline" })}>
              Next ›
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
