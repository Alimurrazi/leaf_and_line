// Read-only git helpers for the publish panel. The studio never commits.
import { execFileSync } from "node:child_process";
import { assertSlug } from "./paths";

/** `git status --porcelain` lines for the content folder and this book's images. */
export function gitStatus(root: string, slug: string): string[] {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "--", "src/content/books", `public/novels/${assertSlug(slug)}`], { cwd: root, encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/** Commands to put the changes live. The message uses the slug, which is always shell-safe. */
export function commitCommands(statusLines: string[], slug: string, status: string): string {
  const files = statusLines.map((line) => line.slice(3));
  if (files.length === 0) return "";
  const verb = status === "published" ? "publish" : "update";
  return `git add ${files.join(" ")}\ngit commit -m "content: ${verb} ${assertSlug(slug)}"`;
}
