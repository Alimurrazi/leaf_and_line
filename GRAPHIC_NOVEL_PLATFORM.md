# Graphic Novel Platform — Project Handover

**Status:** Planning / architecture handover  
**Purpose:** Build a reusable website for a growing collection of graphic novels. *Wakasamaru* is the first title, **not** the platform's hard-coded subject.  
**Last updated:** 24 September 2026

## 1. Product vision

A reader visits a digital library, discovers a graphic novel, opens its detail page, chooses Start Reading or Continue Reading, and reads chapters/pages in a responsive comic reader. The publisher can add further books without changing reader code. The platform should accommodate historical nonfiction and other genres.

### Reader experience
- Browse/search a catalog with cover, synopsis, genre/tags, publication status, and chapters.
- Book details: cover, description, chapter list, credits and, when relevant, historical sources and adaptation notes.
- Reader: one full page at a time by default; previous/next buttons, keyboard navigation, touch/swipe, fullscreen, zoom/pan, page counter and chapter navigation.
- Preserve original artwork: fit the **entire page** within the viewport (`object-fit: contain`), never crop the default full-page view or stretch the image.
- Later: guided panel-by-panel reading (especially mobile), optional continuous scroll, bookmarks and account-based progress.
- Save progress locally for anonymous readers initially; optional sync across devices after accounts are introduced.

### Publisher experience
- Initial release may use structured content files and image assets; no admin dashboard required at launch.
- Future private dashboard: create/edit book, upload cover, create/reorder chapters, upload/reorder pages, enter panel boundaries, preview and publish/unpublish.
- Publishing workflow should distinguish draft, review and published versions and retain source/master artwork.

## 2. Recommended implementation (proposal, not completed work)

- **Frontend:** Next.js + React + TypeScript; Tailwind CSS and optionally shadcn/ui.
- **Content:** book/chapter/page metadata in typed JSON or a headless CMS. Introduce a database when accounts, an editor or multi-user publishing require it.
- **Images:** original PNG masters retained privately; optimized WebP/AVIF delivery via an image CDN/object storage. Preload next page thoughtfully; avoid downloading a whole book upfront.
- **Zoom:** evaluate React Photo View for a straightforward viewer versus OpenSeadragon for detailed zoom/pan and future tiled images. Choose one for the initial implementation; test with actual pages.
- **Animation:** Motion only where it helps page transitions; respect reduced-motion preferences.
- **State:** lightweight React state initially; Zustand only if shared reader state becomes complex.
- **Deployment:** Next.js-compatible host such as Vercel. A .NET API is optional later, not required for the initial catalog and reader.

These are design decisions under discussion, **not installed dependencies or a working application**.

## 3. Suggested content model

```ts
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
type Chapter = {
  id: string;
  slug: string;
  title: string;
  order: number;
  pages: ComicPage[];
};
type ComicPage = {
  id: string;
  order: number;
  imageUrl: string;
  width: number;
  height: number;
  panels?: { id: string; x: number; y: number; width: number; height: number }[];
};
```

Store panel coordinates in original-image pixels (or explicitly normalized coordinates); include caption boxes inside the panel bounds. The reader must not contain book-specific branching.

## 4. Suggested routes

- `/` — featured book and catalog sections.
- `/library` — searchable/filterable books.
- `/books/[slug]` — cover, synopsis, chapter list, credits and source notes.
- `/read/[bookSlug]/[chapterSlug]?page=...` — reader.
- `/admin/...` — **future**, authenticated publisher dashboard.

## 5. Image handling and responsive behavior

*Wakasamaru*'s currently agreed final format is **1536 × 1024, landscape (3:2)**. Other books may have different aspect ratios; page metadata must carry dimensions and the reader must adapt. On phones, show the whole page with zoom or guided panels rather than making small captions unreadable. Test portrait/landscape rotation, pinch zoom, scroll locking, touch targets and keyboard focus. Provide meaningful alt text or accessible scene summaries where feasible; don't rely on images alone for essential navigation.

## 6. Historical/nonfiction publishing policy

Keep a source register for each historical book. Distinguish documented events and quotations from paraphrases, inferred motives, reconstructed dialogue and artistic visual choices. Do not treat AI-generated depictions as archival photographs. Include content notes where appropriate, especially for depictions of violence and deceased people. This is an editorial requirement, not a claim that all historical details have already been verified.

## 7. Proposed delivery phases

1. **MVP:** book catalog, book detail, chapter/page schema, responsive full-page reader, previous/next, keyboard navigation, zoom, fullscreen and local progress.
2. **Mobile reading:** guided panels using manually reviewed coordinates, swipe, page thumbnails and better preloading.
3. **Publishing:** private dashboard, asset uploads, ordering, drafts, previews and publication controls.
4. **Accounts/community (optional):** cross-device progress, bookmarks and other features only if there is demand.

## 8. Decisions and open questions

**Decided:** multi-book platform; *Wakasamaru* is first title; reusable reader; full-page mode first; preserve artwork's aspect ratio; guided panels are a desirable later feature.  
**Not decided:** website name/brand, hosting and storage provider, CMS versus files, user accounts, whether books are free or paid, chapter release model, admin authentication, and whether to add a .NET API. Do not assume these choices have been made.

## 9. ChatGPT project workflow

Keep this document in a **Graphic Novel Platform** project, along with code/design files. Keep each book's visual bible and approved artwork in its own production project. For new work, start by reading this document and the relevant book's handover. When implementation changes a decision, update this file. Never assume a previous generated mockup is a functioning website.
