export type PublicationStatus = "draft" | "review" | "published";

export type Panel = {
  id: string;
  order: number; // reading order within the page
  x: number; // original-image pixels
  y: number;
  width: number;
  height: number;
};

export type ComicPage = {
  id: string;
  order: number; // 1-based, matches ?page
  imageUrl: string;
  width: number;
  height: number;
  alt?: string;
  panels?: Panel[];
};

export type Chapter = {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: PublicationStatus;
  releasedAt?: string;
  pages: ComicPage[];
};

export type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  synopsis: string;
  cover: { url: string; width: number; height: number; alt: string };
  genres: string[];
  status: PublicationStatus;
  seriesStatus?: "ongoing" | "complete" | "one-shot";
  featured?: boolean; // at most one book; the home page hero
  chapters: Chapter[];
  credits?: { role: string; name: string }[];
  contentNotes?: string[];
  artworkDisclosure?: string;
  sourceNotesUrl?: string;
};
