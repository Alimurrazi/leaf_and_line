import path from "node:path";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isSlug = (value: string) => SLUG.test(value);

/** Throws unless value is a plain slug, so it can never point outside its folder. */
export function assertSlug(value: string): string {
  if (!isSlug(value)) throw new Error(`Invalid slug "${value}"`);
  return value;
}

/** Every folder the studio reads or writes, relative to the repo root. */
export function studioPaths(root: string) {
  return {
    originals: path.join(root, "artwork-originals"),
    publicNovels: path.join(root, "public", "novels"),
    books: path.join(root, "src", "content", "books"),
  };
}

export const bookDirs = (root: string, slug: string) => {
  assertSlug(slug);
  const { originals, publicNovels, books } = studioPaths(root);
  return {
    originals: path.join(originals, slug),
    public: path.join(publicNovels, slug),
    json: path.join(books, `${slug}.json`),
    approvals: path.join(originals, slug, ".studio.json"),
  };
};
