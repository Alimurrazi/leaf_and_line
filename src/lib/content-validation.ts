import type { Book, PublicationStatus } from "@/types/content";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES: PublicationStatus[] = ["draft", "review", "published"];
const SERIES: NonNullable<Book["seriesStatus"]>[] = ["ongoing", "complete", "one-shot"];
const isText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

function checkDimensions(item: { width: number; height: number }, label: string, errors: string[]) {
  const ok = Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0;
  if (!ok) errors.push(`${label} must have positive integer width and height`);
}

export function validateBooks(books: Book[]): string[] {
  const errors: string[] = [];
  const bookIds = new Set<string>();
  const bookSlugs = new Set<string>();

  for (const book of books) {
    if (bookIds.has(book.id)) errors.push(`Duplicate book id "${book.id}"`);
    bookIds.add(book.id);
    if (!SLUG.test(book.slug)) errors.push(`Book "${book.id}" has invalid slug "${book.slug}"`);
    if (bookSlugs.has(book.slug)) errors.push(`Duplicate book slug "${book.slug}"`);
    bookSlugs.add(book.slug);
    // Book content is JSON, so check what the type system can't.
    if (!STATUSES.includes(book.status)) errors.push(`Book "${book.id}" has unknown status "${book.status}"`);
    if (!isText(book.title)) errors.push(`Book "${book.id}" has no title`);
    if (book.seriesStatus !== undefined && !SERIES.includes(book.seriesStatus)) {
      errors.push(`Book "${book.id}" has unknown series status "${book.seriesStatus}"`);
    }
    if (book.sourceNotesUrl !== undefined && !/^https?:\/\//i.test(book.sourceNotesUrl)) {
      errors.push(`Book "${book.id}" source notes link must start with http:// or https://`);
    }
    if (!isText(book.cover?.url)) errors.push(`Cover of "${book.slug}" has no image URL`);
    checkDimensions(book.cover, `Cover of "${book.slug}"`, errors);
    if (book.banner) checkDimensions(book.banner, `Banner of "${book.slug}"`, errors);

    const chapterIds = new Set<string>();
    const chapterSlugs = new Set<string>();
    const pageIds = new Set<string>();

    book.chapters.forEach((chapter, chapterIndex) => {
      const where = `${book.slug}/${chapter.slug}`;
      if (!SLUG.test(chapter.slug)) errors.push(`Chapter in "${book.slug}" has invalid slug "${chapter.slug}"`);
      if (chapterSlugs.has(chapter.slug)) errors.push(`Duplicate chapter slug "${where}"`);
      chapterSlugs.add(chapter.slug);
      if (chapterIds.has(chapter.id)) errors.push(`Duplicate chapter id "${chapter.id}" in "${book.slug}"`);
      chapterIds.add(chapter.id);
      if (!STATUSES.includes(chapter.status)) errors.push(`Chapter "${where}" has unknown status "${chapter.status}"`);
      if (chapter.order !== chapterIndex + 1) {
        errors.push(`Chapter "${where}" has order ${chapter.order}; chapters must be ordered 1..n`);
      }
      if (chapter.pages.length === 0) errors.push(`Chapter "${where}" has no pages`);

      chapter.pages.forEach((page, pageIndex) => {
        const label = `Page ${pageIndex + 1} of "${where}"`;
        if (page.order !== pageIndex + 1) errors.push(`${label} has order ${page.order}; pages must be ordered 1..n`);
        if (pageIds.has(page.id)) errors.push(`Duplicate page id "${page.id}" in "${book.slug}"`);
        pageIds.add(page.id);
        if (!isText(page.imageUrl)) errors.push(`${label} has no image URL`);
        checkDimensions(page, label, errors);
      });
    });
  }

  const featured = books.filter((book) => book.featured).map((book) => `"${book.slug}"`);
  if (featured.length > 1) errors.push(`More than one featured book: ${featured.join(", ")}`);

  return errors;
}
