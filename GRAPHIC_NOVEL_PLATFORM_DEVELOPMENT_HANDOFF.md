# Leaf & Line — Approved Design & Local Development Handoff

*Graphic Novel Platform*

**Date:** 24 September 2026 (revised 29 September 2026: name, review findings, prototype deviations)  
**Status:** Visual design and interactive HTML prototype approved; production application not yet implemented.  
**Repository:** `github.com/Alimurrazi/leaf_and_line` (public)  
**Purpose:** Give a local developer a stable reference for building **Leaf & Line**, the reusable multi-book graphic novel platform.

## 1. Decisions locked for the MVP

- **Name:** **Leaf & Line**. It replaces the prototype's placeholder brand "◧ NOVEL PLATFORM". The brand mark/logo is still to be designed; use a plain wordmark until then.
- **Product:** A library of graphic novels, not a *Wakasamaru*-specific website. *Wakasamaru* is the first book; new books must be added through content, not reader-code changes.
- **Approved website aesthetic:** **Modern Editorial with a warm white background**. Do **not** substitute Cinematic Dark or a site-wide dark theme.
- **Typography:** Manrope for headings, Inter for body text. No decorative serif headings.
- **Reader exception:** A dark, distraction-free reading canvas, separate from the light public-site layout.
- **Approved interaction reference:** `graphic-novel-prototype/index.html` in the supplied prototype ZIP. Preserve its overall layouts and behavior when translating it into React/Next.js; fix prototype limitations rather than reproducing them.
- **MVP routes:** `/`, `/library`, `/books/[slug]`, `/read/[bookSlug]/[chapterSlug]?page=1`.
- **MVP scope:** Published-book discovery, details, chapter/page reading, previous/next, keyboard and touch navigation, zoom/pan, fullscreen, responsive layout, and local progress.
- **Zoom is a hard requirement:** pinch-zoom, double-tap zoom and drag-to-pan must work on touch devices. *Wakasamaru*'s captions are about 13–14px tall at 1536px. With the whole page shown, that's about 3.5px on a portrait phone (about 390px wide) and about 7px on a landscape phone, which can't be read without zoom.
- **Fullscreen must degrade gracefully:** iOS Safari on iPhone doesn't support the Fullscreen API for non-video elements. Where it's missing, the fullscreen button switches to an in-page **immersive mode** that hides the site chrome, fills the viewport (`100dvh`) and keeps the reader controls reachable.
- **Not MVP:** Authentication, billing, subscriptions, newsletter backend, publisher dashboard, database, separate .NET API, guided-panel mode, or site-wide dark-mode toggle.

## 2. Design tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAF9F6` | Public-page background |
| `--color-surface` | `#FFFFFF` | Cards, navigation, menus, dialogs |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-muted` | `#626262` | Secondary copy and metadata |
| `--color-border` | `#E7E4DE` | Rules and outlines |
| `--color-accent` | `#B88A43` | **Decorative only**: rules, icons, large display accents. It's 2.95:1 on `--color-bg`, so never use it for text. |
| `--color-accent-text` | `#8A6532` | Eyebrows and small accent text (5.00:1 on `--color-bg`) |
| `--color-accent-hover` | `#926B35` | Link hover (4.56:1) |
| `--color-focus` | `#A16D23` | Focus ring, 3px (4.22:1 on light and 4.18:1 on reader; meets the 3:1 minimum for non-text) |
| `--color-action` | `#242424` | Primary buttons |
| `--color-reader` | `#111318` | Reader shell |
| `--color-reader-stage` | `#1D2026` | Reader page stage |
| `--color-reader-border` | `#34373D` | Reader rules and outlines |
| `--color-reader-text` | `#F5F1E9` | Reader primary text |
| `--color-reader-progress` | `#C6A16A` | Reader progress bar |
| `--content-max` | `1200px` | Centered page container |
| `--radius-control` | `8px` | Buttons and inputs |
| `--radius-card` | `12px` | Cards and panels |

The prototype used `#96703B` for eyebrows. It's 4.26:1, just under AA for 11px text, so it's replaced by `--color-accent-text`.

**Fonts:** Manrope 600–800 for headings, Inter 400–600 for body and controls. Use approximately 16px / 1.6 for body text. **The type sizes follow the approved prototype** (it takes precedence over the earlier reference sizes):

| Style | Desktop | Mobile (≤640px) |
|---|---|---|
| Hero display | `clamp(40px, 5vw, 70px)` | 40px |
| Book title (details) | `clamp(40px, 5vw, 62px)` | 40px |
| Page heading | 46px | 34px |
| Section heading | 30px | 25px |
| Card heading | 17px | 17px |
| Supporting text | 14px | 14px |
| Metadata | 12–13px | 12px | Use a 4px-based spacing scale; gutters 32px desktop, 24px tablet, 16px mobile. Preserve a minimum 44px touch target for important controls. Provide visible focus, hover, pressed, disabled, loading, and error states as applicable. Check contrast rather than assuming muted gold is legible as small text on white.

### Suggested CSS variables

`create-next-app@latest` sets up **Tailwind CSS v4**, which is configured in CSS with no `tailwind.config.*`. Define the tokens in `src/app/globals.css` with `@theme`, so they become both CSS variables and Tailwind utilities (for example `bg-bg` and `text-accent-text`):

```css
@import "tailwindcss";

@theme {
  --color-bg: #faf9f6;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-muted: #626262;
  --color-border: #e7e4de;
  --color-accent: #b88a43;        /* decorative only */
  --color-accent-text: #8a6532;
  --color-accent-hover: #926b35;
  --color-focus: #a16d23;
  --color-action: #242424;
  --color-reader: #111318;
  --color-reader-stage: #1d2026;
  --color-reader-border: #34373d;
  --color-reader-text: #f5f1e9;
  --color-reader-progress: #c6a16a;
  --radius-control: 8px;
  --radius-card: 12px;
}

:root {
  --content-max: 1200px;
}
```

## 3. Approved page behavior

### Homepage `/`

Shared header and footer; featured *published* novel with Start/Discover action; collection section linking to the library. Preserve the approved prototype's clean, spacious editorial hierarchy. Show only actual published titles—do not invent extra books to fill the grid.

### Library `/library`

Responsive book grid, text search, genre filter, book cover/title/metadata, meaningful empty state. Search and filtering should operate on the content repository rather than a hard-coded *Wakasamaru* check. **Genre options come from the published catalog**, so there are no placeholder genres without books. Use real book slugs for links. Header navigation links go to Home and Library only; no book is hard-coded into the nav.

### Book details `/books/[slug]`

Cover, title, synopsis, genre/status, credits, chapter list, source/adaptation notes where relevant, Start Reading and conditional Continue Reading. Continue Reading should reflect saved progress; do not imply a saved page exists for a first-time reader. Handle unknown or unpublished slugs appropriately.

### Reader `/read/[bookSlug]/[chapterSlug]?page=1`

Use the separate dark reader layout with minimal toolbar. Default to **one complete page visible** using the page's own dimensions and `object-fit: contain`; never crop or stretch artwork. The page must fit **both** the width and the height of the available stage. Support previous/next, page counter, keyboard arrows, touch navigation, zoom/pan, fullscreen, chapter navigation, and locally persisted progress. Make the page URL shareable. At chapter boundaries, provide an intentional end-of-chapter/next-chapter state. Avoid swipe-to-turn when the user is panning a zoomed page.

**`?page` rules.** Pages are **1-based**. When `?page` is missing, the reader shows page 1. When it's `0`, negative, past the last page or not a number, the reader clamps it to the nearest valid page and replaces the URL (`router.replace`), without adding a history entry. An unknown or unpublished book or chapter returns `notFound()`.

**Rendering.** Pre-render each published chapter with `generateStaticParams`, and read `?page` on the client (`useSearchParams` inside a `Suspense` boundary). Reading `searchParams` in the Server Component would make every reader request render dynamically.

**Progress.** Save progress only when a reader actually views a page, not when a component renders. Store one versioned record per book:

```ts
// localStorage key: `leaf-and-line:progress:v1:${bookSlug}`
type BookProgress = {
  chapterSlug: string; // last chapter read, used by Continue Reading
  page: number;        // 1-based
  updatedAt: string;   // ISO timestamp
};
```

Continue Reading appears only when a record exists, and it links to that chapter and page. The adapter must tolerate unavailable or corrupt storage.

**Accessibility.** Render each page as an `<img>` with `alt` from the page metadata. Announce page changes through an `aria-live="polite"` region. Give the progress bar `role="progressbar"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. Zooming and turning pages must not move keyboard focus.

**Layout.** Use `dvh` units, not `vh`, for the reader height. Keep the controls compact enough that a landscape phone still gives most of its height to the page.

*Wakasamaru*'s initial artwork is **14 pages at 1536 × 1024 (3:2 landscape)**, in **one chapter** (`chapter-01`). The "To be continued…" on page 1 is part of the artwork, not a chapter break. Other books may have different dimensions, chapter counts and reading needs. Test actual caption legibility on phones.

## 4. Production implementation recommendation

| Layer | MVP choice | Notes |
|---|---|---|
| Application | Next.js App Router + React + TypeScript | Real routes and reusable components |
| Styling | Tailwind CSS + CSS custom properties | shadcn/ui only where useful |
| Content | Typed TypeScript/JSON files | Hide behind a repository interface |
| Artwork | Optimized WebP in `public/novels/` | Retain original PNG masters privately |
| Progress | `localStorage` through an adapter | One versioned record per book (see §3); guard client-only access |
| Reader state | React state/hooks | Add a state library only if complexity warrants it |
| Zoom | Evaluate with real artwork | Candidates: `react-zoom-pan-pinch` and React Photo View (check React 19 support and swipe-versus-pan handling). OpenSeadragon only if advanced zoom or tiling is needed. Must support pinch, double-tap and pan. |
| Tests | Vitest + Playwright | Vitest for the content repository, `?page` clamping and the progress adapter; Playwright for reader flows, keyboard, touch emulation and responsive checks |
| Lint | ESLint CLI | Recent Next.js versions deprecate `next lint`; use an `eslint .` script |
| Hosting | Vercel proposed | Provider not finally committed |

The approved HTML prototype is **not** the production codebase: it uses hash routing, hard-coded sample book data, CSS-generated sample artwork, and direct DOM updates. Rebuild it as accessible React components and Next.js routes rather than copying its routing and state architecture.

### Proposed structure

```text
leaf_and_line/
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
│   └── lib/
│       └── content-repository.ts
├── tests/                      # Vitest unit tests + Playwright e2e
├── scripts/export-pages.*      # PNG master → WebP export (see below)
└── ...
```

The design tokens live in `src/app/globals.css` under `@theme` (Tailwind v4), so there's no separate `tokens.css`.

**Artwork export.** The originals are named `page_1.png … page_14.png`. They aren't zero-padded and use an underscore. A small script (for example using `sharp`) converts them to `public/novels/<book>/chapter-NN/page-NN.webp` with zero-padded names, and records each page's width and height for the content file. Before approving a quality setting, compare caption sharpness at 100% and 200% zoom against the PNG.

**Repository contract:** expose functions such as `getPublishedBooks()`, `getBookBySlug(slug)`, and `getChapter(bookSlug, chapterSlug)`. UI components must not import a specific book file directly. Keep progress storage separate from page rendering so it can later move to an account-backed service.

### Content model

```ts
type PublicationStatus = 'draft' | 'review' | 'published';

type Panel = {
  id: string;
  order: number; // reading order within the page
  x: number;
  y: number;
  width: number;
  height: number;
};

type ComicPage = {
  id: string;
  order: number; // 1-based, matches ?page
  imageUrl: string;
  width: number;
  height: number;
  alt?: string;
  panels?: Panel[];
};

type Chapter = {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: PublicationStatus; // lets a single chapter stay unreleased
  releasedAt?: string;       // ISO date, when released
  pages: ComicPage[];
};

type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  synopsis: string;
  cover: { url: string; width: number; height: number; alt: string };
  genres: string[];
  status: PublicationStatus;                       // editorial/publication state
  seriesStatus?: 'ongoing' | 'complete' | 'one-shot'; // story state, shown to readers
  chapters: Chapter[];
  credits?: { role: string; name: string }[];
  contentNotes?: string[];                        // e.g. "Depictions of war violence"
  artworkDisclosure?: string;                     // how the art was made; not archival
  sourceNotesUrl?: string;
};
```

Public discovery shows only books **and** chapters whose `status` is `'published'`. `review` is reserved for the future dashboard; with content files it behaves like `draft`.

If panel coordinates are introduced later, store them consistently in original-image pixels or explicitly normalized coordinates; do not mix systems. Use validated unique IDs and stable slugs.

## 5. Future-ready UI, without future feature implementation

- **Membership:** Existing card/button/badge/form primitives should support future plan cards, membership badges, locked-content prompts, checkout and billing states. **Pricing, benefits, payment provider and paid-access policy remain undecided.**
- **Newsletter:** Reserve an optional homepage/footer section that reuses standard inputs, buttons and feedback states. Implement consent, validation and unsubscribe only when the feature is launched; do not display a nonfunctional signup form in the MVP.
- **Accounts:** Header layout should accommodate a future account menu; forms and dialogs should support login, registration, settings and cross-device progress later. Do not show fake login or account controls now.
- **Publishing:** A private dashboard and cloud storage/CDN may be introduced later without changing the reader's book/chapter/page contract.

## 6. Local development start

Use a supported Node.js LTS release and your preferred package manager. The `leaf_and_line` repository already exists and contains these documents, so `create-next-app` won't scaffold directly into it: it refuses a folder with conflicting files. Scaffold into a temporary sibling folder, then move the generated files into the repository root, merging the generated `.gitignore` into the existing one. For example:

```bash
# from the parent folder of leaf_and_line
npx create-next-app@latest leaf-and-line-scaffold --typescript --tailwind --eslint --app --src-dir
# move the scaffold's contents (including dotfiles) into leaf_and_line/, then:
cd leaf_and_line
npm run dev
```

Set `"name": "leaf-and-line"` in `package.json`, since npm package names can't contain `&`.

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
- [ ] Pinch-zoom, double-tap zoom and drag-to-pan work on a real phone, and panning a zoomed page never turns the page.
- [ ] On iPhone, where the Fullscreen API isn't available, the immersive-mode fallback works and the controls stay reachable.
- [ ] `?page` values that are missing, `0`, out of range or not a number are clamped, and the URL is corrected.
- [ ] A first-time reader sees no Continue Reading button.
- [ ] Progress persists across reloads and Continue Reading uses the correct book/chapter/page.
- [ ] Mobile captions remain legible with zoom; controls have usable touch targets.
- [ ] Focus states, contrast, labels and reduced-motion preferences are checked against WCAG 2.2 AA targets.
- [ ] No placeholder artwork is misrepresented as approved final art.
- [ ] No unfinished account, payment or newsletter UI is exposed as functional.
- [ ] *Wakasamaru*'s source register is complete, and its artwork disclosure and content notes are shown (launch gate; see `GRAPHIC_NOVEL_PLATFORM.md` §6).
- [ ] No PNG masters are committed; only optimized WebP files are in `public/novels/`.
- [ ] `npm run lint`, `npm test` and `npm run build` pass; the Playwright reader suite passes.

## 7. Editorial and artwork safeguards

For historical/nonfiction works, maintain a source register and distinguish documented facts/quotes from paraphrase, reconstructed dialogue and artistic choices. AI-generated illustrations must not be presented as archival images. Include appropriate content notes for graphic depictions. Review optimized artwork for caption clarity before publishing.

## 8. Prototype deviations (tracked changes from the approved reference)

The approved prototype's layout and visual direction stand. These are prototype limitations to **fix, not reproduce**, recorded here as the change-control section (§9) requires:

| # | Prototype behavior | Production behavior |
|---|---|---|
| P1 | "Continue · Page N" always shows, because progress defaults to page 1 and is saved on every render | Show Continue only when saved progress exists; save only when a page is actually viewed (§3) |
| P2 | Reader page fixed at `aspect-ratio: 3/2` and sized by width only, so it can overflow a short stage | Fit both width and height using each page's own dimensions |
| P3 | `touch-action: pan-x pan-y` blocks pinch-zoom | Pinch-zoom, double-tap zoom and pan through the chosen zoom library |
| P4 | Zoom is a CSS `scale()` inside `overflow: auto`, so the left and top edges can't be reached, and there's no drag-to-pan | The zoom library handles bounds and panning |
| P5 | The last page shows a disabled "End of chapter" button | An end-of-chapter state with a next-chapter link, or back to the book when it's the last chapter |
| P6 | Only the stage goes fullscreen, so the controls are hidden; iOS fails silently; the label never changes | The whole reader goes fullscreen with its controls; immersive fallback on iOS; the button toggles to "Exit fullscreen" |
| P7 | Placeholder genres (Fantasy, Sci-fi) and a hard-coded "Wakasamaru" nav link | Genres come from the catalog; the nav has Home and Library only |
| P8 | Every zoom click re-renders the whole reader, losing focus; no live region; no progressbar role; `aria-label` on a plain `div` | Stable components, `aria-live` page announcements, `role="progressbar"`, real `<img alt>` |
| P9 | Eyebrow `#96703B` (4.26:1) | `--color-accent-text` `#8A6532` (5.00:1) |
| P10 | Colors used but not recorded as tokens | Added to §2 |
| P11 | Heading sizes larger than the earlier handoff reference | The prototype's sizes are adopted (§2) |
| P12 | HTML caption overlays, the "↗" glyph on an internal link, unknown routes sent to the homepage, "Chapters" linking to the book page | Captions stay in the artwork; no external-link glyph on internal links; a real 404; a chapter menu in the reader |
| P13 | `min-height: 100vh`, and three rows of controls under the stage | `dvh` units, and a compact control bar that leaves most of the height for the page on landscape phones |
| — | "◧ NOVEL PLATFORM" placeholder brand | The **Leaf & Line** wordmark |

## 9. Files to keep with the local project

- `GRAPHIC_NOVEL_PLATFORM.md` — product vision and original project handover.
- `GRAPHIC_NOVEL_PLATFORM_IMPLEMENTATION_PLAN.md` — MVP architecture and long-term migration proposal.
- `GRAPHIC_NOVEL_PLATFORM_DEVELOPMENT_HANDOFF.md` — **this approved-design and local-development handoff**; it supersedes earlier contradictory dark/light aesthetic discussion.
- `graphic-novel-prototype/index.html` — approved **visual/interaction reference**, not production architecture. It's supplied as `graphic-novel-prototype.zip`; extract it at the repository root so this path resolves.
- `CLAUDE.md` — working rules for Claude Code sessions in this repository.
- `docs/superpowers/plans/` and `docs/superpowers/specs/` — implementation plans and design specs (local only; `docs/` is gitignored).

**Artwork masters:** original PNGs are **not** kept in this public repository; they're ignored through `.gitignore`. Store them in private storage. Note: the first commit (`11e9e65`) still contains `Wakasamaru_ship_1971/page_1…14.png`, so those files remain visible in the repository history. The history hasn't been rewritten.

**Change control:** Preserve the approved visual direction and prototype behavior unless a new design change is explicitly approved. Track deviations and technical improvements separately so the reference remains stable.
