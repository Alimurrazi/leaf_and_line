import { describe, expect, it } from "vitest";
import { commitCommands } from "@/studio/git";

describe("commitCommands", () => {
  it("adds the changed paths and names the commit by slug, never by the free-text title", () => {
    const lines = [" M src/content/books/demo.json", "?? public/novels/demo/"];
    expect(commitCommands(lines, "demo", "published")).toBe(
      'git add src/content/books/demo.json public/novels/demo/\ngit commit -m "content: publish demo"',
    );
    expect(commitCommands(lines, "demo", "draft")).toContain('git commit -m "content: update demo"');
  });

  it("returns nothing when there is nothing to commit", () => {
    expect(commitCommands([], "demo", "published")).toBe("");
  });
});
