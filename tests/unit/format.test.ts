import { describe, expect, it } from "vitest";
import { plural } from "@/lib/format";
import { bookHref, readerHref } from "@/lib/routes";

describe("plural", () => {
  it("uses the singular for one and the plural otherwise", () => {
    expect(plural(1, "chapter")).toBe("1 chapter");
    expect(plural(14, "page")).toBe("14 pages");
    expect(plural(0, "novel")).toBe("0 novels");
    expect(plural(2, "story", "stories")).toBe("2 stories");
  });
});

describe("routes", () => {
  it("builds book and reader URLs", () => {
    expect(bookHref("wakasamaru")).toBe("/books/wakasamaru");
    expect(readerHref("wakasamaru", "chapter-01")).toBe("/read/wakasamaru/chapter-01?page=1");
    expect(readerHref("wakasamaru", "chapter-01", 7)).toBe("/read/wakasamaru/chapter-01?page=7");
  });
});
