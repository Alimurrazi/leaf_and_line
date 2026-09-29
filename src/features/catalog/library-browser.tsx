"use client";

import { useMemo, useState } from "react";
import { plural } from "@/lib/format";
import type { Book } from "@/types/content";
import { BookGrid } from "./book-grid";
import { ALL_GENRES, filterBooks } from "./filter-books";

export function LibraryBrowser({ books, genres }: { books: Book[]; genres: string[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(ALL_GENRES);
  const results = useMemo(() => filterBooks(books, query, genre), [books, query, genre]);

  return (
    <>
      <div className="mb-7 flex flex-col gap-3.5 sm:flex-row sm:items-center">
        <label htmlFor="library-search" className="sr-only">
          Search graphic novels
        </label>
        <input
          id="library-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search graphic novels"
          className="min-h-12 min-w-0 flex-1 rounded-control border border-border bg-surface px-[15px] py-3"
        />
        <label htmlFor="library-genre" className="sr-only">
          Filter by genre
        </label>
        <select
          id="library-genre"
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
          className="min-h-12 rounded-control border border-border bg-surface p-3"
        >
          <option value={ALL_GENRES}>All genres</option>
          {genres.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <p className="sr-only" aria-live="polite">
        {plural(results.length, "book")} found
      </p>
      {results.length > 0 ? (
        <BookGrid books={results} />
      ) : (
        <p className="py-12 text-muted">No published novels match your search.</p>
      )}
    </>
  );
}
