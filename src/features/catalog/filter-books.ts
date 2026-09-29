import type { Book } from "@/types/content";

export const ALL_GENRES = "all";

export function filterBooks(books: Book[], query: string, genre: string): Book[] {
  const needle = query.trim().toLocaleLowerCase();
  return books.filter((book) => {
    if (genre !== ALL_GENRES && !book.genres.includes(genre)) return false;
    if (!needle) return true;
    return [book.title, book.subtitle ?? "", book.synopsis, ...book.genres].some((text) =>
      text.toLocaleLowerCase().includes(needle),
    );
  });
}
