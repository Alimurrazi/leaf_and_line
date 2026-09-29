import type { Book, ComicPage } from "@/types/content";

const PAGE_COUNT = 14;
const pad = (n: number) => String(n).padStart(2, "0");

// Authored alt text. Pages without an entry get a generic alt from the repository.
// Add a short scene summary for each page as the editorial review covers it.
const pageAlt: Record<number, string> = {
  1: "18 March 1971, Chittagong Port. The Japanese cargo ship Wakasamaru arrives with rice for Bengali cyclone survivors, but dockworkers on a hartal (general strike) refuse to unload it until Captain Kazuo Ito obtains permission.",
  3: "25 March 1971, Chittagong Port. Pakistani troops move weapons and supplies through the port while Captain Ito watches from the bridge; that night Operation Searchlight begins in Dhaka and fighting breaks out in Chittagong.",
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
  // Tagline and synopsis are taken from the title page artwork (title.png).
  subtitle: "A ship, a port and a time of turmoil",
  synopsis:
    "A Japanese cargo ship carrying rice for cyclone relief arrived in Chittagong in March 1971. What followed would turn a mission of relief into a witness to a much larger tragedy.",
  // Front page exported from the title page master: scripts/export-pages.mjs ... --cover title.png
  cover: {
    url: "/novels/wakasamaru/cover.webp",
    width: 1536,
    height: 1024,
    alt: "Wakasamaru title page: a ship captain on the quay watches the cargo ship Wakasamaru at sunset in Chittagong Port, with scenes dated 18, 24, 25 and 26 March 1971.",
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
