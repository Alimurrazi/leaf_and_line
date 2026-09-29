import Image from "next/image";
import Link from "next/link";
import { plural } from "@/lib/format";
import { bookHref } from "@/lib/routes";
import type { Book } from "@/types/content";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={bookHref(book.slug)} className="group block">
      <div
        className="relative overflow-hidden rounded-[7px] bg-border transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_#1a1a1a19]"
        style={{ aspectRatio: `${book.cover.width} / ${book.cover.height}` }}
      >
        {/* The front page is shown whole at its own shape, so title text is never cropped. */}
        <Image src={book.cover.url} alt="" fill sizes="(min-width: 900px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-contain" />
      </div>
      <h3 className="mb-1 mt-[13px] text-[17px]">{book.title}</h3>
      <p className="text-xs text-muted">
        {book.genres.join(", ")} · {plural(book.chapters.length, "chapter")}
      </p>
    </Link>
  );
}
