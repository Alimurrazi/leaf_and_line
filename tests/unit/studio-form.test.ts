import { describe, expect, it } from "vitest";
import { parseEditorial, parseMetadata } from "@/studio/form";

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("parseMetadata", () => {
  it("reads the details form into book metadata", () => {
    const meta = parseMetadata(form([
      ["title", "The Lantern Road"], ["subtitle", ""], ["synopsis", "Two travellers."],
      ["genres", "Fantasy, Adventure,"], ["seriesStatus", "ongoing"],
      ["creditRole", "Story"], ["creditName", "A. Writer"], ["creditRole", ""], ["creditName", ""],
      ["contentNotes", "Violence\nPeril, Loss"], ["artworkDisclosure", "Hand drawn."], ["sourceNotesUrl", "https://example.org/notes"],
    ]));
    expect(meta).toEqual({
      title: "The Lantern Road", subtitle: "", synopsis: "Two travellers.", genres: ["Fantasy", "Adventure"], seriesStatus: "ongoing",
      credits: [{ role: "Story", name: "A. Writer" }, { role: "", name: "" }], contentNotes: ["Violence", "Peril", "Loss"],
      artworkDisclosure: "Hand drawn.", sourceNotesUrl: "https://example.org/notes",
    });
  });

  it("requires a title", () => {
    expect(() => parseMetadata(form([["title", "  "]]))).toThrow("Title is required");
  });

  it("rejects an unknown series status and a non-http source link", () => {
    expect(parseMetadata(form([["title", "T"], ["seriesStatus", "weekly"]])).seriesStatus).toBeUndefined();
    expect(() => parseMetadata(form([["title", "T"], ["sourceNotesUrl", "javascript:alert(1)"]]))).toThrow("Source notes link must start with http:// or https://");
  });
});

describe("parseEditorial", () => {
  const book = {
    id: "b", slug: "b", title: "Book", synopsis: "About.", genres: ["Historical"], status: "review" as const,
    cover: { url: "/c.webp", width: 1, height: 1, alt: "c" }, chapters: [], credits: [{ role: "Art", name: "A" }],
  };

  it("changes only the editorial fields and keeps the rest", () => {
    const meta = parseEditorial(form([["artworkDisclosure", "AI-assisted."], ["contentNotes", "Violence"], ["sourceNotesUrl", ""]]), book);
    expect(meta).toMatchObject({ title: "Book", synopsis: "About.", credits: [{ role: "Art", name: "A" }], artworkDisclosure: "AI-assisted.", contentNotes: ["Violence"], sourceNotesUrl: "" });
  });

  it("applies the same link check", () => {
    expect(() => parseEditorial(form([["sourceNotesUrl", "data:text/html,x"]]), book)).toThrow(/http/);
  });
});
