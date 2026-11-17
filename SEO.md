# Search and AI visibility: how this site is set up

This file is for anyone (person or AI assistant) editing the futureweather.co landing site.
It is not published on the site.

## What happens at build time

`npm run build` uses `scripts/site-plugin.js` (wired into `vite.config.js`) to:

1. **Find every page automatically.** Every `index.html` inside a folder (`python/index.html`,
   `blog/my-post/index.html`, ...) and every `.html` file in the repo root is built. You never
   need to add pages to `vite.config.js`. Folders that are never pages: `node_modules`, `dist`,
   `public`, `supporting`, `templates`, `scripts`, `site`, `src`, and any folder starting with
   `.` or `_`.
2. **Add head tags to every page**: the canonical link (`https://futureweather.co/<path>`),
   Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`, ...) and
   `twitter:card`. They are built from the page's own `<title>` and
   `<meta name="description">`, so **don't add these tags by hand**. If a page needs a
   different value (e.g. `og:type` "article" or its own `og:image`), write just that tag in
   the page; the build won't duplicate it.
3. **Write `sitemap.xml`** listing every page, except pages with
   `<meta name="robots" content="noindex">`, plus the ASHRAE PDF. Each entry's `<lastmod>` is
   the date of that file's last git commit.
4. **Write `llms.txt`** from `site/llms.txt`. The `{{BLOG_SECTION}}` line is replaced with the
   list of blog posts.

`public/robots.txt` is copied as is.

## Checking before you deploy

```
npm run build
npm run check
```

`npm run check` (`scripts/check-site.mjs`) prints a summary of every page and fails if:

- a title or description is missing or duplicated, or a description isn't 50-160 characters;
- a canonical link is missing or wrong;
- a page doesn't have exactly one `<h1>` with text;
- Open Graph or Twitter tags are missing, or the og:image file doesn't exist;
- any JSON-LD block doesn't parse;
- any internal link, image or `#anchor` is broken;
- the sitemap, robots.txt or llms.txt is wrong;
- **the prices in the homepage JSON-LD no longer match the #pricing section.**

The GitHub Action runs the same check, and a failing check stops the deploy.

## Common tasks

- **Add a page:** create `my-page/index.html` with a unique `<title>` (about 60 characters
  or fewer), a unique `<meta name="description">` (50-160 characters) and one `<h1>`. Copy
  the header and footer from an existing page. Build and check.
- **Change prices:** update the #pricing section in `index.html` **and** the `offers` in the
  JSON-LD block in the same file's `<head>`.
- **Hide a page from search:** add `<meta name="robots" content="noindex">` to its `<head>`.
  It drops out of the sitemap automatically.
- **Update llms.txt:** edit `site/llms.txt` (only facts that are already on the site).
- **Regenerate the social preview image:** edit `templates/og-image.html` and run the
  command in its header comment.
- **Homepage H1:** the H1 is the small line "Future weather files for building performance
  modeling". The big rotating A/B headline below it is a `<p>` on purpose, so search engines
  always see one stable H1. Keep it that way if the A/B test changes.
