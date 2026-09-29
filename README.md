# Leaf & Line

A library of graphic novels, read one full page at a time. See `CLAUDE.md` and the `GRAPHIC_NOVEL_PLATFORM*.md` docs.

## Develop

Requires Node 20.9 or newer (Node 24 LTS recommended).

    npm install
    npm run dev          # http://localhost:3000
    npm test             # unit tests (Vitest)
    npm run e2e          # end-to-end tests (Playwright; run `npx playwright install chromium` once)
    npm run lint && npm run typecheck && npm run build

## Add artwork

PNG masters stay outside git (see `.gitignore`). Export them to WebP:

    node scripts/export-pages.mjs <mastersDir> <bookSlug> <chapter-NN> --quality 90 [--cover title.png | --cover 1]

`--cover` takes the book's front-page file (for example `title.png`) or a page number to reuse.

Then add or extend the book in `src/content/books/` and register it in `src/content/books/index.ts`.
