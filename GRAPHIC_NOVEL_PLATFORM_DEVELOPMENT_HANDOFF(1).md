# Graphic Novel Platform — Approved Design & Local Development Handoff

**Date:** 24 September 2026  
**Status:** Visual design and interactive HTML prototype approved; production application not yet implemented.  
**Purpose:** Give a local developer a stable reference for building the reusable multi-book graphic novel platform.

## 1. Decisions locked for the MVP

- **Product:** A library of graphic novels, not a *Wakasamaru*-specific website. *Wakasamaru* is the first book; new books must be added through content, not reader-code changes.
- **Approved website aesthetic:** **Modern Editorial with a warm white background**. Do **not** substitute Cinematic Dark or a site-wide dark theme.
- **Typography:** Manrope for headings, Inter for body text. No decorative serif headings.
- **Reader exception:** A dark, distraction-free reading canvas, separate from the light public-site layout.
- **Approved interaction reference:** `graphic-novel-prototype/index.html` in the supplied prototype ZIP. Preserve its overall layouts and behavior when translating it into React/Next.js; fix prototype limitations rather than reproducing them.
- **MVP routes:** `/`, `/library`, `/books/[slug]`, `/read/[bookSlug]/[chapterSlug]?page=1`.
- **MVP scope:** Published-book discovery, details, chapter/page reading, previous/next, keyboard and touch navigation, zoom/pan, fullscreen, responsive layout, and local progress.
- **Not MVP:** Authentication, billing, subscriptions, newsletter backend, publisher dashboard, database, separate .NET API, guided-panel mode, or site-wide dark-mode toggle.

## 2. Design tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAF9F6` | Public-page background |
| `--color-surface` | `#FFFFFF` | Cards, navigation, menus, dialogs |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-muted` | `#626262` | Secondary copy and metadata |
| `--color-border` | `#E7E4DE` | Rules and outlines |
| `--color-accent` | `#B88A43` | Restrained editorial accents |
| `--color-action` | `#242424` | Primary buttons |
| `--color-reader` | `#111318` | Reader shell |
| `--content-max` | `1200px` | Centered page container |
| `--radius-control` | `8px` | Buttons and inputs |
| `--radius-card` | `12px` | Cards and panels |

**Fonts:** Manrope 600–800 for headings, Inter 400–600 for body and controls. Use approximately 16px / 1.6 for body text. Desktop/mobile reference sizes: display 56/36px, page heading 40/30px, section heading 28/24px, card heading 18/17px, supporting text 14px, metadata 12px. Use a 4px-based spacing scale; gutters 32px desktop, 24px tablet, 16px mobile. Preserve a minimum 44px touch target for important controls. Provide visible focus, hover, pressed, disabled, loading, and error states as applicable. Check contrast rather than assuming muted gold is legible as small text on white.

### Suggested CSS variables

```css
:root {
  --color-bg: #faf9f6;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-muted: #626262;
  --color-border: #e7e4de;
  --color-accent: #b88a43;
  --color-action: #242424;
  --color-reader: #111318;
  --content-max: 1200px;
  --radius-control: 8px;
  --radius-card: 12px;
}
```

## 3. Approved page behavior

### Homepage `/`

Shared header and footer; featured *published* novel with Start/Discover action; collection section linking to the library. Preserve the approved prototype's clean, spacious editorial hierarchy. Show only actual published titles—do not invent extra books to fill the grid.

### Library `/library`

Responsive book grid, text search, genre filter, book cover/title/metadata, meaningful empty state. Search and filtering should operate on the content repository rather than a hard-coded *Wakasamaru* check. Use real book slugs for links.

### Book details `/books/[slug]`

Cover, title, synopsis, genre/status, credits, chapter list, source/adaptation notes where relevant, Start Reading and conditional Continue Reading. Continue Reading should reflect saved progress; do not imply a saved page exists for a first-time reader. Handle unknown or unpublished slugs appropriately.

### Reader `/read/[bookSlug]/[chapterSlug]?page=1`

Use the separate dark reader layout with minimal toolbar. Default to **one complete page visible** using the page's own dimensions and `object-fit: contain`; never crop or stretch artwork. Support previous/next, page counter, keyboard arrows, touch navigation, zoom/pan, fullscreen, chapter navigation, and locally persisted progress. Make the page URL shareable. At chapter boundaries, provide an intentional end-of-chapter/next-chapter state. Avoid swipe-to-turn when the user is panning a zoomed page.

*Wakasamaru*'s initial artwork is **14 pages at 1536 × 1024 (3:2 landscape)**. Other books may have different dimensions, chapter counts and reading needs. Test actual caption legibility on phones.

## 4. Production implementation recommendation

| Layer | MVP choice | Notes |
|---|---|---|
| Application | Next.js App Router + React + TypeScript | Real routes and reusable components |
| Styling | Tailwind CSS + CSS custom properties | shadcn/ui only where useful |
| Content | Typed TypeScript/JSON files | Hide behind a repository interface |
| Artwork | Optimized WebP in `public/novels/` | Retain original PNG masters privately |
| Progress | `localStorage` through an adapter | Key by book and chapter; guard client-only access |
| Reader state | React state/hooks | Add a state library only if complexity warrants it |
| Zoom | Evaluate with real artwork | React Photo View is a candidate; OpenSeadragon only if advanced zoom/tiling is needed |
| Hosting | Vercel proposed | Provider not finally committed |

The approved HTML prototype is **not** the production codebase: it uses hash routing, hard-coded sample book data, CSS-generated sample artwork, and direct DOM updates. Rebuild it as accessible React components and Next.js routes rather than copying its routing and state architecture.

### Proposed structure

```text
graphic-novel-platform/
├── public/novels/wakasamaru/
│   ├── cover.webp
│   └── chapter-01/page-01.webp ... page-14.webp
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── library/page.tsx
│   │   │   └── books/[slug]/page.tsx
│   │   └── (reading)/
│   │       └── read/[bookSlug]/[chapterSlug]/page.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── features/
│   │   ├── catalog/
│   │   ├── books/
│   │   ├── reader/
│   │   └── reading-progress/
│   ├── content/
│   │   └── books/
│   ├── lib/
│   │   └── content-repository.ts
│   └── styles/tokens.css
└── ...
```

**Repository contract:** expose functions such as `getPublishedBooks()`, `getBookBySlug(slug)`, and `getChapter(bookSlug, chapterSlug)`. UI components must not import a specific book file directly. Keep progress storage separate from page rendering so it can later move to an account-backed service.

### Content model

```ts
type ComicPage = {
  id: string;
  order: number;
  imageUrl: string;
  width: number;
  height: number;
  alt?: string;
  panels?: { id: string; x: number; y: number; width: number; height: number }[];
};

type Chapter = {
  id: string;
  slug: string;
  title: string;
  order: number;
  pages: ComicPage[];
};

type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  synopsis: string;
  coverUrl: string;
  genres: string[];
  status: 'draft' | 'published';
  chapters: Chapter[];
  credits?: { role: string; name: string }[];
  sourceNotesUrl?: string;
};
```

If panel coordinates are introduced later, store them consistently in original-image pixels or explicitly normalized coordinates; do not mix systems. Use validated unique IDs and stable slugs.

## 5. Future-ready UI, without future feature implementation

- **Membership:** Existing card/button/badge/form primitives should support future plan cards, membership badges, locked-content prompts, checkout and billing states. **Pricing, benefits, payment provider and paid-access policy remain undecided.**
- **Newsletter:** Reserve an optional homepage/footer section that reuses standard inputs, buttons and feedback states. Implement consent, validation and unsubscribe only when the feature is launched; do not display a nonfunctional signup form in the MVP.
- **Accounts:** Header layout should accommodate a future account menu; forms and dialogs should support login, registration, settings and cross-device progress later. Do not show fake login or account controls now.
- **Publishing:** A private dashboard and cloud storage/CDN may be introduced later without changing the reader's book/chapter/page contract.

## 6. Local development start

Use a supported Node.js LTS release and your preferred package manager. From the directory where you want the project, initialize a new Next.js App Router TypeScript application with Tailwind CSS and a `src/` directory. For example:

```bash
npx create-next-app@latest graphic-novel-platform --typescript --tailwind --eslint --app --src-dir
cd graphic-novel-platform
npm run dev
```

Open the local URL printed by Next.js. Copy the **design and behavior** from the approved HTML prototype into React components; do not replace the generated Next.js application with `index.html`. Set up Manrope and Inter using `next/font/google` or an equivalent local font-loading approach, and define the design tokens before implementing pages.

### Recommended implementation sequence

1. **Foundation:** Next.js project, fonts, tokens, page container, buttons, inputs, header/footer and public/reader layouts.
2. **Content:** Types, validated sample *Wakasamaru* metadata and repository interface; publication filtering.
3. **Catalog:** Homepage, library search/filter, responsive book cards and empty states.
4. **Details:** Dynamic book page, chapter list, Start/Continue behavior and unknown-book handling.
5. **Reader:** Dynamic chapter/page routing, image fit, controls, keyboard/swipe, zoom/pan, fullscreen and chapter boundaries.
6. **Progress:** Local adapter, page URL synchronization, Continue Reading and safe behavior when storage is unavailable.
7. **Artwork:** Replace sample artwork with the **approved** optimized cover/pages; retain PNG masters outside public delivery assets.
8. **Quality:** Mobile caption checks, keyboard/focus tests, image-loading tests, reduced-motion behavior, accessibility, build/lint and responsive regression against the approved prototype.

### Acceptance checklist

- [ ] Public pages match the approved Modern Editorial **light** prototype; reader remains dark.
- [ ] Manrope headings and Inter body are applied consistently.
- [ ] Four real Next.js routes work, including direct navigation and refresh.
- [ ] Only published books appear in public discovery; adding another book requires no reader-code edits.
- [ ] Book and chapter slugs, invalid page numbers, missing content and empty search results are handled.
- [ ] Full-page artwork is not cropped or distorted at default zoom.
- [ ] Reader works with landscape and other page aspect ratios.
- [ ] Previous/next, keyboard, touch, zoom/pan, fullscreen and chapter boundaries work.
- [ ] Progress persists across reloads and Continue Reading uses the correct book/chapter/page.
- [ ] Mobile captions remain legible with zoom; controls have usable touch targets.
- [ ] Focus states, contrast, labels and reduced-motion preferences are checked against WCAG 2.2 AA targets.
- [ ] No placeholder artwork is misrepresented as approved final art.
- [ ] No unfinished account, payment or newsletter UI is exposed as functional.
- [ ] `npm run lint` (if configured) and `npm run build` pass.

## 7. Editorial and artwork safeguards

For historical/nonfiction works, maintain a source register and distinguish documented facts/quotes from paraphrase, reconstructed dialogue and artistic choices. AI-generated illustrations must not be presented as archival images. Include appropriate content notes for graphic depictions. Review optimized artwork for caption clarity before publishing.

## 8. Files to keep with the local project

- `GRAPHIC_NOVEL_PLATFORM.md` — product vision and original project handover.
- `GRAPHIC_NOVEL_PLATFORM_IMPLEMENTATION_PLAN.md` — MVP architecture and long-term migration proposal.
- `GRAPHIC_NOVEL_PLATFORM_DEVELOPMENT_HANDOFF.md` — **this approved-design and local-development handoff**; it supersedes earlier contradictory dark/light aesthetic discussion.
- `graphic-novel-prototype/index.html` — approved **visual/interaction reference**, not production architecture.

**Change control:** Preserve the approved visual direction and prototype behavior unless a new design change is explicitly approved. Track deviations and technical improvements separately so the reference remains stable.
