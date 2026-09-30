"use server";

// Studio actions. Each is an untrusted POST: it checks the dev-only guard, validates its inputs
// and re-reads the book from disk instead of trusting anything but ids from the client.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/studio/action-result";
import { readApprovals, writeApprovals } from "@/studio/approvals";
import { exportProblems, publishProblems } from "@/studio/checks";
import {
  altShiftWarning,
  createBook,
  mergeExportedChapter,
  readBook,
  setChapterTitle,
  setCoverImage,
  setFeatured,
  setPageAlt,
  setPublication,
  updateMetadata,
  writeBook,
} from "@/studio/content-store";
import { parseEditorial, parseMetadata } from "@/studio/form";
import { assertStudio, studioRoot } from "@/studio/guard";
import { assertSlug } from "@/studio/paths";
import type { Book, PublicationStatus } from "@/types/content";

const field = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

async function run(data: FormData, work: (slug: string) => Promise<string> | string): Promise<ActionResult> {
  try {
    assertStudio();
    const slug = assertSlug(field(data, "slug"));
    const message = await work(slug);
    revalidatePath("/studio", "layout");
    return { ok: true, message };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function bookOrThrow(slug: string): Book {
  const book = readBook(studioRoot(), slug);
  if (!book) throw new Error(`No book "${slug}". Create it from its folder first.`);
  return book;
}

function chapterOf(book: Book, data: FormData) {
  const slug = field(data, "chapter");
  const chapter = book.chapters.find((c) => c.slug === slug);
  if (!chapter) throw new Error(`No chapter "${slug}"`);
  return chapter;
}

export async function createBookAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  const result = await run(data, (slug) => {
    createBook(studioRoot(), slug, parseMetadata(data));
    return "Book created";
  });
  if (result?.ok) redirect(`/studio/${field(data, "slug")}?step=2`);
  return result;
}

export async function saveDetailsAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, (slug) => {
    writeBook(studioRoot(), updateMetadata(bookOrThrow(slug), parseMetadata(data)));
    return "Details saved";
  });
}

export async function exportAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, async (slug) => {
    const root = studioRoot();
    const target = field(data, "target"); // "all" or a chapter slug
    const { scanFolder } = await import("@/studio/scan");
    const { exportChapter, exportImage } = await import("@/studio/export");
    const scan = await scanFolder(root, slug);
    if (!scan.exists) throw new Error(`Nothing to export: artwork-originals/${slug}/ has no originals`);

    let book = bookOrThrow(slug);
    // Checked on the server too, before any file is written.
    const problems = exportProblems(scan, book, target);
    if (problems.length) throw new Error(problems.join(". "));

    const done: string[] = [];
    if (target === "all") {
      for (const kind of ["cover", "banner"] as const) {
        if (!scan[kind]?.readable) continue;
        book = setCoverImage(book, kind, await exportImage(root, slug, kind));
        done.push(kind);
      }
      writeBook(root, book);
    }
    const chapters = target === "all" ? scan.chapters : scan.chapters.filter((c) => c.slug === target);
    const warnings: string[] = [];
    let pageCount = 0;
    for (const chapter of chapters) {
      const pages = await exportChapter(root, slug, chapter.slug);
      const warning = altShiftWarning(book.chapters.find((c) => c.order === chapter.number), pages);
      if (warning) warnings.push(warning);
      book = mergeExportedChapter(book, chapter.number, pages);
      writeBook(root, book); // saved per chapter, so an earlier chapter is never lost
      // Changed art must be checked again before it can be published.
      writeApprovals(root, slug, { artworkReviewed: { [chapter.slug]: false } });
      pageCount += pages.length;
    }
    if (pageCount) done.unshift(`${pageCount} page${pageCount === 1 ? "" : "s"}`);
    const summary = done.length ? `Exported ${done.join(", ")}` : "Nothing to export";
    return [summary, ...warnings].join(". ");
  });
}

export async function saveAltAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, (slug) => {
    const book = bookOrThrow(slug);
    const chapter = chapterOf(book, data);
    const order = Number(field(data, "order"));
    if (!chapter.pages.some((p) => p.order === order)) throw new Error(`No page ${order}`);
    writeBook(studioRoot(), setPageAlt(book, chapter.slug, order, String(data.get("alt") ?? "")));
    return `Saved alt text for page ${order}`;
  });
}

export async function saveChapterTitleAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, (slug) => {
    const book = bookOrThrow(slug);
    const title = field(data, "title");
    if (!title) throw new Error("Chapter title is required");
    writeBook(studioRoot(), setChapterTitle(book, chapterOf(book, data).slug, title));
    return "Chapter title saved";
  });
}

export async function reviewArtworkAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, (slug) => {
    const chapter = chapterOf(bookOrThrow(slug), data);
    const reviewed = data.get("reviewed") === "on";
    writeApprovals(studioRoot(), slug, { artworkReviewed: { [chapter.slug]: reviewed } });
    return reviewed ? "Marked as checked" : "Check cleared";
  });
}

export async function saveEditorialAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, (slug) => {
    const root = studioRoot();
    const book = bookOrThrow(slug);
    writeBook(root, updateMetadata(book, parseEditorial(data, book)));
    writeApprovals(root, slug, {
      sourceRegisterConfirmed: data.get("sourceRegisterConfirmed") === "on",
      noContentNotes: data.get("noContentNotes") === "on",
    });
    return "Editorial saved";
  });
}

const STATUSES: PublicationStatus[] = ["draft", "review", "published"];

export async function setStatusAction(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  return run(data, (slug) => {
    const root = studioRoot();
    const book = bookOrThrow(slug);
    const status = field(data, "status") as PublicationStatus;
    if (!STATUSES.includes(status)) throw new Error(`Unknown status "${status}"`);
    const approvals = readApprovals(root, slug);

    if (status === "review") {
      if (book.chapters.length === 0) throw new Error("Export at least one chapter first");
      const unchecked = book.chapters.filter((c) => !approvals.artworkReviewed?.[c.slug]).map((c) => c.slug);
      if (unchecked.length) throw new Error(`Tick "I checked the artwork" for ${unchecked.join(", ")} first`);
      writeBook(root, setPublication(book, "review"));
      return "Sent to review";
    }

    if (status === "published") {
      const chapters = data.getAll("chapter").map(String).filter((s) => book.chapters.some((c) => c.slug === s));
      const problems = publishProblems(book, approvals, chapters);
      if (problems.length) throw new Error(problems.join(". "));
      writeBook(root, setPublication(book, "published", chapters)); // unticked chapters go back to draft
      if (data.get("featured") === "on" || book.featured) setFeatured(root, slug, data.get("featured") === "on");
      return `Published ${chapters.length} chapter${chapters.length === 1 ? "" : "s"}. Commit the files below to put it live.`;
    }

    writeBook(root, setPublication(book, "draft"));
    if (book.featured) setFeatured(root, slug, false);
    return "Back to draft. The book is hidden from the public site.";
  });
}
