import Link from "next/link";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="mt-11 border-t border-border pb-[42px] pt-8">
      <Container className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <Link href="/" className="font-display text-[19px] font-extrabold tracking-[-0.055em]">
            Leaf &amp; Line
          </Link>
          <p className="text-xs text-muted">Illustrated stories, one page at a time.</p>
        </div>
        <nav aria-label="Footer" className="flex gap-5 text-[13px]">
          <Link href="/">Home</Link>
          <Link href="/library">Library</Link>
        </nav>
      </Container>
    </footer>
  );
}
