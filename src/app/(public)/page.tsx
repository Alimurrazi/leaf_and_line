import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BookGrid } from "@/features/catalog/book-grid";
import { heroImage } from "@/lib/book-images";
import { getFeaturedBook, getPublishedBooks } from "@/lib/content-repository";
import { plural } from "@/lib/format";
import { bookHref } from "@/lib/routes";

export default function HomePage() {
  const books = getPublishedBooks();
  const featured = getFeaturedBook();

  if (!featured) {
    return (
      <Container className="py-16">
        <h1 className="text-[40px] md:text-[clamp(40px,5vw,70px)]">Stories worth getting lost in.</h1>
        <p className="mt-4 text-muted">No graphic novels are published yet. Check back soon.</p>
      </Container>
    );
  }

  const hero = heroImage(featured);

  return (
    <>
      <Container className="grid items-center gap-6 pb-[42px] pt-8 md:grid-cols-[1fr_1.04fr] md:gap-16 md:pb-[72px] md:pt-[65px]">
        <div>
          <Eyebrow>Featured graphic novel</Eyebrow>
          <h1 className="mb-[22px] mt-4 max-w-[630px] text-[40px] md:text-[clamp(40px,5vw,70px)]">
            Stories worth getting lost in.
          </h1>
          <p className="max-w-[470px] text-[17px] text-muted">
            Explore illustrated worlds, discover new chapters, and pick up exactly where you left off.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={bookHref(featured.slug)} className={buttonClasses()}>
              Discover {featured.title} →
            </Link>
            <Link href="/library" className={buttonClasses({ variant: "outline" })}>
              Browse library
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-muted">{plural(books.length, "novel")} · No account required</p>
        </div>
        <Image
          src={hero.url}
          alt={hero.alt}
          width={hero.width}
          height={hero.height}
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 900px) 50vw, 100vw"
          className="h-auto w-full rounded-[10px]"
        />
      </Container>

      <Container className="pb-12 pt-7 md:pb-[76px] md:pt-[46px]">
        <div className="mb-[25px] flex items-end justify-between gap-[18px]">
          <div>
            <Eyebrow>The collection</Eyebrow>
            <h2 className="mt-2 text-[25px] md:text-[30px]">Explore the library</h2>
          </div>
          <Link href="/library" className="text-sm font-bold hover:text-accent-hover">
            View all →
          </Link>
        </div>
        {/* Up to 8 titles; the library shows the full catalog. */}
        <BookGrid books={books.slice(0, 8)} />
      </Container>
    </>
  );
}
