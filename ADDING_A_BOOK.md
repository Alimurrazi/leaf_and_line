# Adding a new book

Books are added with the **studio**, a local dashboard that runs only under `npm run dev`. You drop the original artwork into a folder. The studio then checks it, exports the web images, writes the book's content file, and takes you through review, the editorial checklist and publishing. You never type image sizes or edit a registry by hand, and **no reader or UI code changes**.

The studio never commits anything. Publishing means committing the files it lists and deploying.

---

## 1. Make the folder

Create a folder named with the book's **slug** inside `artwork-originals/`:

```
artwork-originals/
  the-lantern-road/          ← the slug: lowercase words joined by hyphens
    cover.png                upright, about 2:3, at least 1200px wide
    banner.png               optional wide image for the home page hero
    chapter-01/              always two digits: chapter-01, not chapter-1
      1.png
      2.png                  pages numbered 1..n, no gaps
      …
    chapter-02/
      …
```

- **The slug becomes the URL** (`/books/the-lantern-road`). Don't change it after publishing, because reading progress is stored per book.
- **Everything in `artwork-originals/` is gitignored** except its README. The repo is public, and the originals stay on your machine.
- **Pages can have any aspect ratio.** Each page keeps its own size.

## 2. Open the studio

```bash
npm run dev
```

Open **http://localhost:3000/studio**. Every book and every folder appears as a card with its stage, a 6-step progress bar, and the one next action. Books that need attention come first. Click a card to open its book page. The left column shows the six steps: ✓ done, ✕ problem, ! warning, and a grey number when a step is locked. Hover a locked step to see what unlocks it.

## 3. The six steps

| Step | What you do | What the studio does |
|---|---|---|
| **1. Details** | Fill in the title, synopsis, genres, series status, credits, content notes and artwork disclosure, then click **Create book**. | Writes `src/content/books/<slug>.json` as a **draft** and adds it to the generated index. Drafts are never public. |
| **2. Artwork check** | Fix whatever it reports, then reload. | Checks on every page load: cover present, upright and big enough; chapter folders numbered 1..n; pages numbered 1..n with no gaps or duplicates; files readable. Mixed page sizes are a warning, not an error. |
| **3. Export** | Click **Export everything** (or one chapter). | Writes WebP (quality 90) to `public/novels/<slug>/`, with the cover scaled to at most 1200px wide. It fills in every page's id, URL, width and height, and keeps existing alt text and chapter titles. If you change an original later, this step shows **Needs re-export**. |
| **4. Review** | Rename the chapter if you like. Click each thumbnail to check the page and write its **alt text** (Previous / Next go through the chapter). Open the chapter in the real reader, tick **"I checked … captions are sharp"**, then **Send to review**. | Sets the book to `review`. It refuses until every chapter's artwork check is ticked. |
| **5. Editorial** | Complete the checklist: artwork disclosure, content notes (or "none needed"), and for **Historical** books a confirmed source register or a source-notes link. | ✕ items block publishing; ! items (such as missing alt text) are recommendations. |
| **6. Publish** | Choose the chapters, optionally make it the **featured** book, and click **Publish**. | Makes exactly the ticked chapters live: unticking a live chapter unpublishes it. Every ticked chapter needs its artwork check from step 4. If you feature this book, the flag moves off the previous one. It then lists the changed files and the `git` commands to put it live. |

Then commit and push/deploy:

```bash
git add src/content/books/ public/novels/the-lantern-road/
git commit -m "content: publish The Lantern Road"
```

Check `git status` first: no PNG files should appear (they can't, unless something is saved outside `artwork-originals/`).

## Adding a chapter later

Add `artwork-originals/<slug>/chapter-02/1.png …`, open the book in the studio, and export. The new chapter starts as a draft. Tick its artwork check in step 4, then publish it from step 6 by ticking it (the studio refuses until it's checked). The previous chapter's "next chapter" link appears automatically.

## Replacing a page

Overwrite the PNG in its chapter folder. The export step shows **Needs re-export: page N changed**. Export again: the file names stay the same, and the page's size and alt text are kept (by page number, so if you insert a page, check the alt text after it). Re-exporting clears that chapter's artwork check, so changed art is checked again before it's published. Studio thumbnails refresh by themselves; the public site may need a hard refresh.

## Unpublishing

In step 6, **Unpublish (back to draft)** hides the whole book from the public site (commit the JSON change to make it stick).

---

## Good to know

- **Where things live:**
  ```
  artwork-originals/<slug>/…                ← originals, never committed
  artwork-originals/<slug>/.studio.json     ← local review ticks (gitignored)
  public/novels/<slug>/cover.webp, banner.webp, chapter-NN/page-NN.webp
  src/content/books/<slug>.json             ← the book (types: src/types/content.ts)
  src/content/books/index.generated.ts      ← generated list of books; don't edit
  ```
- **The studio won't save content that breaks the site.** Every save is validated against the whole catalog: unique slugs and ids, known status values, chapters and pages ordered 1..n, image URLs and positive sizes, http(s) source links, and at most one featured book. An invalid change is refused with the reason. The public build runs the same validation, so a bad hand edit fails loudly instead of hiding a book.
- **You can edit the JSON by hand.** It's plain JSON in the `Book` shape. If you add or remove a JSON file by hand, run `npm run content:index`.
- **The studio is local only.** `npm run dev` listens on localhost only, production builds serve 404 for `/studio`, and its actions refuse to run. To test the site on a phone, use `npm run dev:lan`, but note that this also opens the studio to your network. The studio needs `sharp`, which is a dev dependency.
- **Tests that name the catalog:** `tests/e2e/multi-book.spec.ts` lists the library titles exactly (`["E2E Atlas", "Wakasamaru"]`). Publishing a real book changes that list, so update the test in the same commit.
- **Dev-server caching:** right after publishing, the dev server may 404 on `/books/<new-slug>` once while it refreshes its list of book pages. Reload. Production builds regenerate it.
