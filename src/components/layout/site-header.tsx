"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "./container";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface">
      <Container className="flex h-16 items-center gap-2.5 sm:h-[76px] sm:gap-[34px]">
        <Link href="/" className="font-display text-[15px] font-extrabold tracking-[-0.055em] sm:text-[19px]">
          Leaf &amp; Line
        </Link>
        <nav
          id="site-nav"
          aria-label="Main"
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-16 flex-col gap-4 border-b border-border bg-surface p-5 text-sm font-semibold sm:static sm:ml-auto sm:flex sm:flex-row sm:gap-[30px] sm:border-0 sm:bg-transparent sm:p-0`}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className="hover:text-accent-hover"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/library" className={buttonClasses({ variant: "outline", className: "hidden sm:inline-flex" })}>
          Explore library
        </Link>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-controls="site-nav"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={buttonClasses({ variant: "ghost", className: "ml-auto sm:hidden" })}
        >
          <span aria-hidden="true">☰</span>
        </button>
      </Container>
    </header>
  );
}
