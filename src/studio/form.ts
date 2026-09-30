// Parses studio form posts. Server actions are untrusted entry points, so everything is checked here.
import type { Book } from "@/types/content";
import type { BookMetadata } from "./content-store";

const SERIES: NonNullable<Book["seriesStatus"]>[] = ["ongoing", "complete", "one-shot"];

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const list = (value: string) => value.split(/[,\n]/).map((v) => v.trim()).filter(Boolean);

function sourceLink(data: FormData): string {
  const url = text(data, "sourceNotesUrl");
  // Rendered as a link on the public book page: only allow web links.
  if (url && !/^https?:\/\//i.test(url)) throw new Error("Source notes link must start with http:// or https://");
  return url;
}

export function parseMetadata(data: FormData): BookMetadata {
  const title = text(data, "title");
  if (!title) throw new Error("Title is required");

  const sourceNotesUrl = sourceLink(data);

  const series = text(data, "seriesStatus") as NonNullable<Book["seriesStatus"]>;
  const roles = data.getAll("creditRole").map(String);
  const names = data.getAll("creditName").map(String);

  return {
    title,
    subtitle: text(data, "subtitle"),
    synopsis: text(data, "synopsis"),
    genres: list(text(data, "genres")),
    seriesStatus: SERIES.includes(series) ? series : undefined,
    credits: roles.map((role, i) => ({ role: role.trim(), name: (names[i] ?? "").trim() })),
    contentNotes: list(text(data, "contentNotes")),
    artworkDisclosure: text(data, "artworkDisclosure"),
    sourceNotesUrl,
  };
}

/** The metadata a book already has, so a partial form can change only some fields. */
export const metadataOf = (book: Book): BookMetadata => ({
  title: book.title,
  subtitle: book.subtitle,
  synopsis: book.synopsis,
  genres: book.genres,
  seriesStatus: book.seriesStatus,
  credits: book.credits,
  contentNotes: book.contentNotes,
  artworkDisclosure: book.artworkDisclosure,
  sourceNotesUrl: book.sourceNotesUrl,
});

/** The editorial panel's form: disclosure, content notes and source link; everything else stays. */
export const parseEditorial = (data: FormData, book: Book): BookMetadata => ({
  ...metadataOf(book),
  artworkDisclosure: text(data, "artworkDisclosure"),
  contentNotes: list(text(data, "contentNotes")),
  sourceNotesUrl: sourceLink(data),
});
