import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { plural } from "@/lib/format";
import { readerHref } from "@/lib/routes";
import type { Book } from "@/types/content";

export function ChapterList({ book }: { book: Book }) {
  return (
    <ol>
      {book.chapters.map((chapter) => {
        const thumb = chapter.pages[0];
        return (
          <li key={chapter.id} className="flex items-center gap-5 border-b border-border py-[18px]">
            <Image
              src={thumb.imageUrl}
              alt=""
              width={thumb.width}
              height={thumb.height}
              sizes="112px"
              className="h-auto w-[85px] min-w-[85px] sm:w-[112px] sm:min-w-[112px]"
            />
            <div>
              <h3 className="mb-[5px] text-[17px]">{chapter.title}</h3>
              <p className="text-[13px] text-muted">{plural(chapter.pages.length, "page")}</p>
            </div>
            <Link
              href={readerHref(book.slug, chapter.slug, 1)}
              aria-label={`Read ${chapter.title}`}
              className={buttonClasses({ variant: "outline", size: "sm", className: "ml-auto" })}
            >
              Read →
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
