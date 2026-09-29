import type { Book, ComicPage } from "@/types/content";

const PAGE_COUNT = 14;
const pad = (n: number) => String(n).padStart(2, "0");

// Authored alt text. Pages without an entry get a generic alt from the repository.
// Add a short scene summary for each page as the editorial review covers it.
const pageAlt: Record<number, string> = {
  1: "18 March 1971, Chittagong Port. The Japanese cargo ship Wakasamaru arrives with rice for Bengali cyclone survivors, but dockworkers on a hartal (general strike) refuse to unload it until Captain Kazuo Ito obtains permission.",
};

const pages: ComicPage[] = Array.from({ length: PAGE_COUNT }, (_, i) => {
  const order = i + 1;
  return {
    id: `wakasamaru-c01-p${pad(order)}`,
    order,
    imageUrl: `/novels/wakasamaru/chapter-01/page-${pad(order)}.webp`,
    width: 1536,
    height: 1024,
    alt: pageAlt[order],
  };
});

export const wakasamaru: Book = {
  id: "wakasamaru",
  slug: "wakasamaru",
  title: "Wakasamaru",
  // Draft copy based on page 1. Replace it with the approved synopsis before launch.
  synopsis:
    "March 1971. The Japanese cargo ship Wakasamaru reaches Chittagong Port carrying about 5,100 tons of rice for Bengali people still recovering from the 1970 cyclone — and finds the port gripped by a general strike.",
  // Temporary cover cut from page 1 by scripts/export-pages.mjs (--cover 1) until dedicated cover art exists.
  cover: {
    url: "/novels/wakasamaru/cover.webp",
    width: 1536,
    height: 1024,
    alt: "The cargo ship Wakasamaru at anchor in Chittagong Port, 1971.",
  },
  genres: ["Historical"],
  status: "published",
  featured: true,
  chapters: [
    {
      id: "wakasamaru-c01",
      slug: "chapter-01",
      title: "Chapter 1",
      order: 1,
      status: "published",
      pages,
    },
  ],
};
