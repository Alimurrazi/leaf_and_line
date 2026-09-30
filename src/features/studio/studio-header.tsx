import Link from "next/link";

export function StudioHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-10">
        <div className="flex items-center gap-3">
          <Link href="/studio" className="font-display text-lg font-extrabold">
            Leaf &amp; Line
          </Link>
          <span className="rounded bg-action px-2 py-1 text-[11px] font-bold tracking-[0.08em] text-white">STUDIO · LOCAL ONLY</span>
        </div>
        <nav aria-label="Studio" className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/studio">Books</Link>
          <Link href="/" className="hidden text-muted hover:text-text sm:inline">
            View site ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
