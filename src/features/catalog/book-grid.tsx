import type { Book } from "@/types/content";
import { BookCard } from "./book-card";

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <ul className="grid grid-cols-2 gap-[18px] sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
