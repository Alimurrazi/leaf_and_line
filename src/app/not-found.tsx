import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function NotFound() {
  return (
    <main id="main" className="flex-1">
      <Container className="py-24">
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-3 text-[34px] md:text-[46px]">Page not found</h1>
        <p className="mt-3 text-muted">This book, chapter or page isn’t available.</p>
        <Link href="/library" className={buttonClasses({ className: "mt-8" })}>
          Browse the library
        </Link>
      </Container>
    </main>
  );
}
