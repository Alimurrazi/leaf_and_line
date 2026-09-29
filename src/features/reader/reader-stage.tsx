import Image from "next/image";
import type { ComicPage } from "@/types/content";

export function ReaderStage({ page }: { page: ComicPage }) {
  return (
    <div
      data-testid="reader-stage"
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-reader-border bg-reader-stage"
    >
      <Image
        key={page.id}
        src={page.imageUrl}
        alt={page.alt ?? ""}
        width={page.width}
        height={page.height}
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
