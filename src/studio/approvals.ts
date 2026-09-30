// Local workflow state (for example "artwork reviewed") in artwork-originals/<slug>/.studio.json.
// It is gitignored with the originals and never becomes public content.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { bookDirs } from "./paths";
import type { Approvals } from "./types";

export function readApprovals(root: string, slug: string): Approvals {
  const file = bookDirs(root, slug).approvals;
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Approvals;
  } catch {
    return {};
  }
}

export function writeApprovals(root: string, slug: string, patch: Approvals): Approvals {
  const current = readApprovals(root, slug);
  const next: Approvals = {
    ...current,
    ...patch,
    ...(patch.artworkReviewed ? { artworkReviewed: { ...current.artworkReviewed, ...patch.artworkReviewed } } : {}),
  };
  const file = bookDirs(root, slug).approvals;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
  return next;
}
