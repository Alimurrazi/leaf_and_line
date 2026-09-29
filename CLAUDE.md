# Leaf & Line

A reusable, content-driven website for a growing library of graphic novels. *Wakasamaru* (one chapter, 14 pages at 1536×1024) is the first title, **not** a hard-coded part of the app. Status: docs and design approved; the Next.js MVP isn't built yet.

## Read first
- `GRAPHIC_NOVEL_PLATFORM_DEVELOPMENT_HANDOFF.md` — **authoritative for the MVP**: design tokens, page behavior, content model, prototype deviations, acceptance checklist.
- `GRAPHIC_NOVEL_PLATFORM_IMPLEMENTATION_PLAN.md` — MVP architecture and the long-term migration path.
- `GRAPHIC_NOVEL_PLATFORM.md` — product vision, editorial policy and open decisions.
- `graphic-novel-prototype.zip` → `index.html` — the approved visual and interaction reference. Match its look; don't copy its architecture (hash routing, `innerHTML` rendering).

When the docs conflict, the handoff wins. When a decision changes, update the docs in the same change.

## Architectural rules
1. No book-specific logic in the reader or UI. Everything comes from book/chapter/page data.
2. UI reads content only through `src/lib/content-repository.ts` (`getPublishedBooks`, `getBookBySlug`, `getChapter`). Never import a book file directly.
3. Pages carry their URL plus width and height. Never assume one aspect ratio or image host.
4. Rendering and progress storage stay separate. Progress goes through an adapter (versioned `localStorage` key per book).
5. Default view: the whole page is visible (contain), never cropped or stretched. Zoom (pinch, double-tap, pan) is required.
6. Don't add accounts, payments, a newsletter, a database or a separate API in the MVP, and don't show fake UI for them.

## Artwork and editorial
- Original PNG masters are **never committed**. This repo is public, and the masters folder is gitignored. Only optimized WebP files go in `public/novels/<book>/chapter-NN/page-NN.webp`.
- Historical books need a source register. AI or illustrated artwork must not be presented as archival imagery.

## Stack (planned)
Next.js App Router + TypeScript, Tailwind v4 (tokens in `globals.css` under `@theme`), Vitest + Playwright, ESLint CLI. Hosting is proposed as Vercel but not committed.

## Workflow
- Implementation plans go in `docs/superpowers/plans/YYYY-MM-DD-<name>.md`, and design specs in `docs/superpowers/specs/`. `docs/` is gitignored, so these stay local and are never pushed.
- Don't commit or push without being asked. The repo is public.

## Next.js version notes
@AGENTS.md
