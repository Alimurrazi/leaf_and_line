import { existsSync, statSync } from "node:fs";
import path from "node:path";

const isExternal = (url: string) => /^https?:\/\//i.test(url);

/** The file behind a public URL, or null when it is missing or would point outside public/. */
function publicFile(root: string, publicUrl: string): string | null {
  const publicDir = path.join(root, "public");
  const file = path.join(publicDir, publicUrl);
  return file.startsWith(publicDir + path.sep) && existsSync(file) ? file : null;
}

/** A public image URL with ?v=<mtime>, so the studio shows a re-export without a hard refresh. Null if missing. */
export function versionedUrl(root: string, publicUrl: string): string | null {
  if (isExternal(publicUrl)) return publicUrl; // hosted elsewhere (CLAUDE.md rule 3)
  const file = publicFile(root, publicUrl);
  return file ? `${publicUrl}?v=${Math.round(statSync(file).mtimeMs)}` : null;
}

/** Size of a public file in KB (rounded), or null when it is missing or hosted elsewhere. */
export function fileSizeKb(root: string, publicUrl: string): number | null {
  const file = isExternal(publicUrl) ? null : publicFile(root, publicUrl);
  return file ? Math.round(statSync(file).size / 1024) : null;
}
