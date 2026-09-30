# Leaf & Line

A library of graphic novels, read one full page at a time. See `CLAUDE.md` and the `GRAPHIC_NOVEL_PLATFORM*.md` docs.

## Develop

Requires Node 22.18 or newer (Node 24 LTS recommended, see `.nvmrc`). The book index generator runs TypeScript directly.

    npm install
    npm run dev          # http://localhost:3000 (localhost only; the studio lives here)
    npm run dev:lan      # same, reachable from your network (phone testing; exposes the studio too)
    npm test             # unit tests (Vitest)
    npm run e2e          # end-to-end tests (Playwright; run `npx playwright install chromium` once).
                         # It runs `next build`, which stops a running `npm run dev`: stop the dev server first.
    npm run lint && npm run typecheck && npm run build

## Add a book

1. Put the original PNGs in `artwork-originals/<book-slug>/`: `cover.png` (upright, about 2:3, 1200px+ wide), an optional `banner.png`, and `chapter-01/1.png, 2.png …`. This folder is gitignored; originals are never committed.
2. Run `npm run dev` and open [localhost:3000/studio](http://localhost:3000/studio). The studio checks the folder, exports WebP, fills in the page sizes, and takes the book through review, the editorial checklist and publish.
3. Commit the files the studio lists (the book's JSON and its WebP files).

The studio only runs under `npm run dev`; production builds serve 404 for it. The full walkthrough is in [ADDING_A_BOOK.md](ADDING_A_BOOK.md).
