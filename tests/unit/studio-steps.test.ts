import { describe, expect, it } from "vitest";
import type { BookState } from "@/studio/load";
import { stepsFor } from "@/studio/steps";
import type { Check } from "@/studio/types";
import type { Book } from "@/types/content";

const err = (id: string, title = id): Check => ({ id, scope: "book", level: "error", title });
const warn = (id: string, title = id): Check => ({ id, scope: "book", level: "warn", title });
const ok = (id: string): Check => ({ id, scope: "chapter-01", level: "ok", title: id });

const book = (over: Partial<Book> = {}): Book => ({
  id: "demo", slug: "demo", title: "Demo", synopsis: "x", genres: ["Fantasy"], status: "draft",
  cover: { url: "/c.webp", width: 1, height: 1, alt: "c" },
  chapters: [{ id: "demo-c01", slug: "chapter-01", title: "Chapter 1", order: 1, status: "draft", pages: [{ id: "p", order: 1, imageUrl: "/p.webp", width: 1, height: 1 }] }],
  ...over,
});

function state(over: Partial<BookState> = {}): BookState {
  return {
    slug: "demo", book: book(), hasOriginals: true, exported: [], approvals: {},
    scan: { slug: "demo", exists: true, cover: null, banner: null, chapters: [], ignored: [] },
    checks: { artwork: [], export: [ok("export")], editorial: [] }, counts: { errors: 0, warnings: 0 },
    stage: { step: 4, key: "review", label: "Review", next: "Review pages" },
    ...over,
  };
}

const summary = (s: BookState) => stepsFor(s).map((step) => `${step.n}:${step.state}${step.note ? ` ${step.note}` : ""}`);

describe("stepsFor", () => {
  it("opens only details and artwork for a new folder", () => {
    const steps = stepsFor(state({ book: undefined, checks: { artwork: [err("cover"), err("gap")], export: [], editorial: [] } }));
    expect(steps.map((s) => [s.n, s.state, Boolean(s.href)])).toEqual([
      [1, "todo", true], [2, "error", true], [3, "locked", false], [4, "locked", false], [5, "locked", false], [6, "locked", false],
    ]);
    expect(steps[1].note).toBe("2 problems");
    expect(steps[2].lockedWhy).toBe("Create the book first");
  });

  it("asks for export when chapters are not exported", () => {
    expect(summary(state({ checks: { artwork: [], export: [warn("export", "Not exported yet")], editorial: [] } }))[2]).toBe("3:todo Not exported yet");
  });

  it("shows review, editorial and publish progress for a draft", () => {
    const s = state({ checks: { artwork: [], export: [ok("e")], editorial: [err("d"), warn("alt", "Alt text on 0 of 1 pages")] } });
    expect(summary(s).slice(3)).toEqual(["4:todo Alt text 0/1", "5:error 1 blocking", "6:locked"]);
  });

  it("is done once reviewed and ready to publish", () => {
    const s = state({ book: book({ status: "review" }) });
    expect(summary(s).slice(3)).toEqual(["4:done Alt text 0/1", "5:done", "6:todo Ready"]);
  });

  it("marks a published book done, and treats missing originals as already exported", () => {
    const s = state({ book: book({ status: "published", chapters: [{ ...book().chapters[0], status: "published" }] }), hasOriginals: false, checks: { artwork: [], export: [], editorial: [] } });
    expect(summary(s)).toEqual(["1:done", "2:done No originals here", "3:done Exported", "4:done Alt text 0/1", "5:done", "6:done 1 chapter live"]);
  });
});
