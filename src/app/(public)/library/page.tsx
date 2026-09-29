import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LibraryBrowser } from "@/features/catalog/library-browser";
import { getGenres, getPublishedBooks } from "@/lib/content-repository";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <Container>
      <div className="pb-[25px] pt-9 md:pb-8 md:pt-[58px]">
        <Eyebrow>The collection</Eyebrow>
        <h1 className="my-2.5 text-[34px] md:text-[46px]">Explore the library</h1>
        <p className="text-muted">Find your next illustrated story.</p>
      </div>
      <LibraryBrowser books={getPublishedBooks()} genres={getGenres()} />
    </Container>
  );
}
