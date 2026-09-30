// The book page's six steps and what each one shows. Pure: it only reads a BookState.
import type { BookState } from "./load";
import type { Check } from "./types";

export type StepState = "done" | "todo" | "error" | "warn" | "locked";
export type Step = { n: number; label: string; state: StepState; note?: string; href?: string; lockedWhy?: string };

const count = (checks: Check[], level: Check["level"]) => checks.filter((c) => c.level === level).length;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function stepsFor(state: BookState): Step[] {
  const { book, checks, hasOriginals, slug } = state;
  const href = (n: number) => `/studio/${slug}?step=${n}`;
  const locked = (n: number, label: string, lockedWhy?: string): Step => ({ n, label, state: "locked", lockedWhy });

  const artworkErrors = count(checks.artwork, "error");
  const details: Step = { n: 1, label: "Details", state: book ? "done" : "todo", note: book ? undefined : "Fill in and save", href: href(1) };
  const artwork: Step = !hasOriginals
    ? { n: 2, label: "Artwork check", state: book ? "done" : "todo", note: book ? "No originals here" : "Add artwork", href: href(2) }
    : artworkErrors
      ? { n: 2, label: "Artwork check", state: "error", note: plural(artworkErrors, "problem"), href: href(2) }
      : { n: 2, label: "Artwork check", state: "done", note: count(checks.artwork, "warn") ? plural(count(checks.artwork, "warn"), "warning") : undefined, href: href(2) };

  if (!book) {
    return [details, artwork, locked(3, "Export", "Create the book first"), locked(4, "Review"), locked(5, "Editorial"), locked(6, "Publish")];
  }

  const pending = checks.export.find((c) => c.level !== "ok");
  const exportStep: Step =
    artworkErrors > 0
      ? locked(3, "Export", "Fix the artwork problems first")
      : !hasOriginals
        ? { n: 3, label: "Export", state: book.chapters.length ? "done" : "todo", note: book.chapters.length ? "Exported" : "Add originals to export", href: href(3) }
        : pending || book.chapters.length === 0
          ? { n: 3, label: "Export", state: "todo", note: pending?.title ?? "Not exported yet", href: href(3) }
          : { n: 3, label: "Export", state: "done", note: "Up to date", href: href(3) };

  const pages = book.chapters.flatMap((c) => c.pages);
  const altNote = `Alt text ${pages.filter((p) => p.alt?.trim()).length}/${pages.length}`;
  const reviewed = book.status !== "draft";
  const review: Step = book.chapters.length
    ? { n: 4, label: "Review", state: reviewed ? "done" : "todo", note: altNote, href: href(4) }
    : locked(4, "Review", "Export a chapter first");

  const blocking = count(checks.editorial, "error");
  const editorial: Step = { n: 5, label: "Editorial", state: blocking ? "error" : "done", note: blocking ? `${blocking} blocking` : undefined, href: href(5) };

  const live = book.chapters.filter((c) => c.status === "published").length;
  const publish: Step =
    book.status === "published"
      ? { n: 6, label: "Publish", state: "done", note: `${plural(live, "chapter")} live`, href: href(6) }
      : book.status === "review" && !blocking
        ? { n: 6, label: "Publish", state: "todo", note: "Ready", href: href(6) }
        : locked(6, "Publish", book.status === "draft" ? "Send the book to review first" : "Fix the blocking editorial items first");

  return [details, artwork, exportStep, review, editorial, publish];
}
