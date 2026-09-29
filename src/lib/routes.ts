export function bookHref(bookSlug: string): string {
  return `/books/${bookSlug}`;
}

export function readerHref(bookSlug: string, chapterSlug: string, page = 1): string {
  return `/read/${bookSlug}/${chapterSlug}?page=${page}`;
}
