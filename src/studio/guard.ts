// The studio reads and writes repo files, so it only exists under the local dev server.
// A production build serves 404 for its pages and refuses its actions.

export const studioEnabled = () => process.env.NODE_ENV === "development";

export function assertStudio(): void {
  if (!studioEnabled()) throw new Error("The studio only runs under `npm run dev`.");
}

/** The repo root the studio works in. */
export const studioRoot = () => process.cwd();
