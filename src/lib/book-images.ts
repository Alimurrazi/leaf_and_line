import type { Book, BookImage } from "@/types/content";

/** The wide image for the home page hero: the book's banner, or its cover when it has none. */
export function heroImage(book: Book): BookImage {
  return book.banner ?? book.cover;
}
