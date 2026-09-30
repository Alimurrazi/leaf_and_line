# artwork-originals

Original, full-quality artwork (PNG) for each book. **Nothing in this folder is committed except this README.** The repo is public, and the originals stay private.

The website never serves these files. The studio (`npm run dev` → `/studio`) checks them and exports optimized WebP copies to `public/novels/<slug>/`.

## Layout

```
artwork-originals/
  <book-slug>/            lowercase-with-hyphens, becomes the URL (/books/<book-slug>)
    cover.png             upright, about 2:3, at least 1200px wide
    banner.png            optional wide image for the home page hero
    chapter-01/
      1.png
      2.png               pages numbered 1..n, no gaps
      ...
    chapter-02/
      ...
```
