# Leaf & Line — MVP and Long-Term Implementation Plan

*Graphic Novel Platform*

**Status:** Architecture proposal; implementation not yet started  
**Updated:** 29 September 2026  
**Related documents:** `GRAPHIC_NOVEL_PLATFORM.md` (product and project handover); `GRAPHIC_NOVEL_PLATFORM_DEVELOPMENT_HANDOFF.md` (approved design and dev handoff; **takes precedence** over this document for MVP details)

## 1. Purpose and guiding principle

Build a reusable, content-driven website for a growing library of graphic novels. *Wakasamaru* is the first title, not a hard-coded part of the application. Its initial release consists of 14 page images. Other books may have different page counts, aspect ratios, chapters, genres, and publishing schedules.

**Guiding principle:** Build the simplest functional MVP while defining stable interfaces that allow storage, content management, progress synchronization, and reader modes to evolve independently. The technology choices below are proposals, not installed dependencies or completed work.

---

# Plan A — MVP

## 2. MVP scope

Launch a public website where readers can discover a novel, view its details, read one complete page at a time, navigate chapters, zoom, and resume reading in the same browser. Add new books by adding content definitions and artwork; no publishing dashboard or account is required.

### Reader features

- Home page with featured titles and a library of published books.
- Book detail pages with cover, synopsis, chapter list, credits, and source notes where relevant.
- Reusable full-page reader with previous/next controls, page counter, keyboard navigation, touch navigation, fullscreen, zoom/pan, and chapter navigation.
- Preserve the entire page by default (`object-fit: contain`); never stretch or crop artwork in full-page mode.
- Local reading progress in `localStorage`: one versioned record per book that stores the last chapter and page (see the handoff for the shape). A page URL should be shareable and recoverable.
- Responsive desktop, tablet, and mobile layouts; test caption legibility on actual phones.
- Accessible controls, visible keyboard focus, and descriptive page text or scene summaries where feasible.

### Publisher features

- Add books, chapters, and pages using typed content files and image assets.
- Publish by updating the repository and deploying the application.
- No admin dashboard, database, reader accounts, or separate .NET API at launch.

## 3. MVP technology stack

| Layer | Proposed choice | Why |
|---|---|---|
| Application | Next.js App Router, React, TypeScript | One application for catalog, book pages, and reader |
| Styling | Tailwind CSS; shadcn/ui as needed | Responsive layout and accessible UI primitives |
| Content | Typed TypeScript/JSON files | Simple to edit and validate for an initial small library |
| Artwork delivery | Optimized WebP images in Next.js `public/` | No separate storage service required for the first 14 pages |
| Artwork masters | Original PNG files in a separate private backup | Preserve quality and support later edits or re-exports |
| Reader state | React state | Avoid unnecessary state-management dependencies |
| Reading progress | Browser `localStorage` | No account or database needed |
| Hosting | Vercel (proposed) | Straightforward Next.js deployment |
| Backend | No separate API | The MVP has no independent backend requirement |

Evaluate React Photo View and `react-zoom-pan-pinch` against the actual pages for straightforward zoom/pan (check React 19 compatibility and how each handles swipe-versus-pan). Consider OpenSeadragon only if more advanced zoom or tiled images are necessary. Do not commit to a library before testing. Pinch-zoom and double-tap zoom are **required** for the MVP: *Wakasamaru*'s captions render at about 3.5px on a portrait phone when the whole page is shown. Preload the next page selectively rather than downloading the entire book.

## 4. MVP architecture

```text
Reader browser (desktop / tablet / mobile)
                 |
                 v
         Next.js application
     /          |            \
Catalog      Book detail    Comic reader
     \          |            /
        Content repository
          /           \
Typed book/chapter files   Image URLs in public/

Browser localStorage <--> Reader progress adapter
```

The content repository exposes functions such as `getPublishedBooks()`, `getBookBySlug()`, and `getChapter()`. UI components must not import individual book files directly. The reader consumes generic book/chapter/page data, never title-specific logic.

## 5. Suggested routes

| Route | Purpose |
|---|---|
| `/` | Featured books and catalog highlights |
| `/library` | Browse and search published books |
| `/books/[slug]` | Synopsis, cover, chapters, credits, source notes |
| `/read/[bookSlug]/[chapterSlug]?page=1` | Full-page reader and navigation |

Future `/admin/...` routes are explicitly out of MVP scope.

## 6. Content model and artwork

Core entities are **Book → Chapter → ComicPage → optional Panel**. Book metadata includes slug, title, synopsis, cover, genres, publication status, and optional credits/source notes. Chapters include slug, title, order, and pages. Pages include stable ID, order, image URL, original width and height, and optional panel bounds/reading order. Keep panel coordinates in original-image pixels or explicitly normalized coordinates; do not mix conventions.

For *Wakasamaru*, the agreed artwork format is **1536 × 1024, landscape (3:2)**. Other novels can use different dimensions; the reader must use each page's metadata rather than assume one aspect ratio.

Example structure:

```text
leaf_and_line/
├── public/
│   └── novels/
│       └── wakasamaru/
│           ├── cover.webp
│           └── chapter-01/
│               ├── page-01.webp
│               ├── page-02.webp
│               └── ... page-14.webp
├── src/
│   ├── app/
│   │   ├── (public)/            # light editorial layout
│   │   │   ├── page.tsx
│   │   │   ├── library/page.tsx
│   │   │   └── books/[slug]/page.tsx
│   │   └── (reading)/           # dark reader layout
│   │       └── read/[bookSlug]/[chapterSlug]/page.tsx
│   ├── features/
│   │   ├── catalog/
│   │   ├── books/
│   │   ├── reader/{components,hooks,renderers,utils}/
│   │   └── reading-progress/
│   ├── content/books/
│   ├── components/ui/
│   ├── lib/content-repository.ts
│   └── types/
└── tests/
```

The route groups and repository path follow the development handoff, which is authoritative for the MVP layout.

Store original PNG masters separately; serve carefully optimized WebP copies, verifying that captions and fine details remain readable. Store URLs in page metadata so image hosting can change later without rewriting the reader.

## 7. MVP implementation milestones

1. **Foundation:** Initialize Next.js, TypeScript, styling, types, content repository, and *Wakasamaru* sample content.
2. **Discovery:** Implement home, library, and book detail pages driven by published content.
3. **Reader:** Implement full-page rendering, navigation, chapter transitions, keyboard/touch controls, zoom, and fullscreen.
4. **Progress and quality:** Add local progress, page URLs, responsive behavior, selective preloading, accessibility, and testing with actual artwork.
5. **Release:** Optimize the 14 images, verify mobile caption readability, deploy, and test the full reading journey.

**MVP acceptance criteria:** A reader can find *Wakasamaru*, open chapter one, read all 14 pages without cropped artwork, navigate by supported controls, leave, and resume in the same browser. A second book can be added using only new metadata and assets, without changing reader logic.

---

# Plan B — Long-Term Platform

## 8. Long-term goal

Support a larger catalog, easier publishing, optional cross-device progress, and mobile-friendly guided reading. Adopt infrastructure in response to concrete needs, not simply because the platform grows.

### Target architecture (conditional components)

```text
Readers and publishers
        |
        v
Next.js public site + reader + private dashboard
        |
        v
Application/server API (Next.js server; optional ASP.NET Core later)
        |
        +---- PostgreSQL or managed content store
        |       Books, chapters, publication state, users, progress
        |
        +---- Object storage
                Original/optimized artwork and covers
                       |
                       v
                 Image CDN ---> Reader browser
```

Artwork should normally be delivered directly through a CDN URL rather than proxied through the application API. A database stores metadata and asset references, not the comic image binaries.

## 9. Upgrades: reason, trigger, and what stays stable

### 9.1 Local images → Object storage + CDN

**MVP:** Images are committed to `public/` and deployed with the application.

**Why change:** At, for example, 50 novels × 100 pages, there are 5,000 page images before covers and thumbnails. Keeping every asset in the application repository makes releases and asset management cumbersome; replacing a page requires a code deployment. Object storage (e.g., Cloudflare R2 or Amazon S3) supports independent uploads, while a CDN can cache images near readers and reduce repeated origin requests. A CDN does not automatically guarantee lower cost or better performance; choose a provider based on actual traffic, image sizes, and pricing.

**Trigger:** Asset volume, frequent chapter releases, publishing-dashboard uploads, or measured delivery needs make repository-based assets inconvenient. No fixed image-count threshold is required.

**What stays stable:** The reader consumes page image URLs and dimensions. Only the asset URL and upload workflow change. Keep original PNG masters backed up separately from optimized delivery versions.

### 9.2 Typed content files → Database or headless CMS

**MVP:** Book, chapter, and page metadata live in typed files.

**Why change:** Editing synopsis text, reordering pages, scheduling releases, managing draft/review/published states, and allowing multiple editors are awkward through source-code changes. A database such as PostgreSQL, or a suitable headless CMS, can support these workflows.

**Trigger:** Dashboard-based editing, multiple publishers, scheduled releases, or complex editorial workflows.

**What stays stable:** The public UI continues to use the content repository interface; its implementation changes from file reads to database/CMS queries. Preserve stable book, chapter, and page IDs.

### 9.3 Manual publishing → Private dashboard

**MVP:** The publisher adds assets and content files, then deploys.

**Why change:** Uploading images, creating chapters, reordering pages, previewing books, and publishing should eventually be possible without editing code. The dashboard should enforce authorization and distinguish draft, review, and published content. Preserve source/master artwork and a revision history where practical.

**Trigger:** Publishing becomes repetitive or multiple people need to manage books.

**What stays stable:** Book and chapter contracts, reader URLs, and rendering behavior.

### 9.4 Browser-only progress → Accounts and synchronization

**MVP:** `localStorage` saves progress on the same browser/device.

**Why change:** Local progress cannot reliably follow a reader between phone and laptop or survive every browser-data reset. Authenticated accounts and server-side progress enable cross-device resume, bookmarks, and personal libraries.

**Trigger:** Actual demand for cross-device reading or account-based features. Define privacy, retention, and deletion behavior before collecting user data.

**What stays stable:** The reader calls a progress adapter; the adapter can use local storage, server storage, or both. Define conflict handling for offline reading and multiple devices.

### 9.5 Full-page reading → Optional guided-panel reading

**MVP:** Show the entire page with zoom/pan.

**Why change:** Landscape artwork and small captions may be difficult to read on narrow phones. Guided-panel mode can focus on panels in the intended order while retaining full-page mode.

**Trigger:** Testing on real phones shows that zooming the full page is insufficient or inconvenient.

**What stays stable:** The reader controller, book/chapter navigation, page URLs, and progress. Add a guided-panel renderer that uses reviewed panel coordinates and reading order. Include captions inside relevant bounds and provide a way to return to the complete page.

### 9.6 Next.js server → Separate ASP.NET Core API (optional)

**MVP:** No separate API or database.

**Why change:** A dedicated backend may be useful if publishing and account operations become substantial, multiple clients need a shared API, or independent scaling/deployment is valuable. Introducing a database alone does **not** require a .NET service; Next.js server-side functionality may remain sufficient.

**Trigger:** Concrete backend complexity, multiple consuming applications, operational boundaries, or independent deployment needs.

**What stays stable:** Public content contracts and reader behavior. Keep API boundaries explicit if the service is introduced.

## 10. Proposed long-term stack

| Layer | Candidate |
|---|---|
| Public website and reader | Existing Next.js + TypeScript application |
| Publishing UI | Authenticated dashboard, potentially within Next.js |
| Metadata | PostgreSQL or headless CMS, selected based on editorial needs |
| Artwork | Cloudflare R2 or Amazon S3; CDN for delivery |
| Authentication | Managed provider or application-managed accounts, evaluated when needed |
| Backend | Next.js server initially; optional ASP.NET Core Web API |
| Reading modes | Full-page and optional guided-panel renderers |

These are candidate technologies, not commitments to operate all of them.

## 11. Migration order

1. **Launch the MVP** with *Wakasamaru*, typed content files, public artwork, and a reusable reader.
2. **Measure and improve reading** on mobile; add guided panels or image optimizations if testing justifies them.
3. **Improve publishing** when necessary; move artwork to object storage independently of moving metadata to a database/CMS.
4. **Add a dashboard** when editing and uploading through code becomes burdensome.
5. **Add accounts** when cross-device progress, bookmarks, or personal libraries are needed.
6. **Introduce a separate API only if justified** by backend complexity or multiple clients.

These changes are not a rigid dependency chain: guided panels need no database; CDN storage needs no accounts; a database does not require a .NET API.

## 12. Architectural rules from day one

1. **No book-specific reader logic.** The reader accepts generic book, chapter, page, and optional panel data.
2. **Use a content repository interface.** Avoid direct book-file imports throughout the UI.
3. **Store asset references as URLs with dimensions.** Do not assume a single image host or page aspect ratio.
4. **Keep rendering and progress separate.** Progress storage can later change without rewriting the viewer.
5. **Keep original artwork safe.** Preserve private PNG masters and publish optimized copies; verify captions after compression.
6. **Preserve editorial provenance.** Historical nonfiction should distinguish sourced events and quotations from paraphrase, reconstruction, and artistic choices; AI-generated images are not archival photographs.
7. **Keep future features optional.** Do not introduce databases, paid access, accounts, or separate services without a demonstrated need.

## 13. Decisions still open

- ~~Platform name and visual brand.~~ **Decided:** the name is **Leaf & Line**, and the visual direction is Modern Editorial (see the handoff). The brand mark/logo and domain are still open.
- Final hosting provider and image-storage provider.
- Whether the catalog will remain entirely free or eventually include paid books.
- Whether a CMS or custom database/dashboard best fits the eventual publishing workflow.
- Whether user accounts and a separate .NET API will ever be necessary.
- ~~Which zoom library works best with real comic pages.~~ **Decided:** react-zoom-pan-pinch.

**Current working default:** Leaf & Line on Next.js + TypeScript, typed content files, 14 optimized images in `public/` (PNG masters kept out of the repository), local reading progress, Vercel as a proposed host, and no separate backend for MVP. Revisit decisions when requirements change; update this document alongside the project handover.
