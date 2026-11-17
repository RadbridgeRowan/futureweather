// FutureWeather site plugin for Vite.
//
// What it does at build time (see SEO.md for the how-to):
//   1. Finds every page automatically: each `index.html` in a folder (e.g. python/index.html,
//      blog/my-post/index.html) plus any .html file in the repo root. New pages and blog posts are
//      built without touching vite.config.js.
//   2. Adds the canonical link, Open Graph and Twitter tags to every page's <head>, using the
//      page's own <title> and <meta name="description">. A page can override any of these by
//      writing that tag itself (e.g. og:type "article" on blog posts); existing tags are never
//      duplicated.
//   3. Writes dist/sitemap.xml: every page without <meta name="robots" content="noindex">, plus the
//      files in EXTRA_SITEMAP_FILES. <lastmod> is the date of the source file's last git commit
//      (omitted if git has no date for it, e.g. an uncommitted new page).
//   4. Writes dist/llms.txt from site/llms.txt, replacing the {{BLOG_SECTION}} line with a list of
//      blog posts (or removing it when there is no blog yet).
//   5. Fills the post list on blog/index.html (the <!-- blog:posts --> marker) from each post's
//      <h1>, description and article:published_time, newest first.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  findMeta,
  findTags,
  getMetaContent,
  getTitles,
  getElementsInner,
  textOf,
  hasNoindex,
  decodeEntities,
  stripComments,
} from './html-utils.js';

export const SITE_ORIGIN = 'https://futureweather.co';
export const SITE_NAME = 'FutureWeather';
export const DEFAULT_OG_IMAGE = {
  path: '/assets/images/og/futureweather-og.png',
  width: 1200,
  height: 630,
  alt: 'FutureWeather: future climate EPW, DDY and STAT weather files',
};

// Non-HTML files that should also be listed in the sitemap (paths relative to the repo root).
const EXTRA_SITEMAP_FILES = ['public/assets/documents/ASHRAE TC 4.2_Future Weather_Rowan Schmidt_20260203.pdf'];

// Folders that never contain site pages.
const SKIP_DIRS = new Set(['node_modules', 'dist', 'public', 'supporting', 'templates', 'scripts', 'site', 'src']);

const toPosix = (p) => p.split(sep).join('/');

/** URL path for a page source file given its repo-relative posix path. */
export function urlPathFor(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

/** Every page in the site, sorted with the homepage first. */
export function discoverPages(root) {
  const pages = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) pages.push(entry.name);
  }
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name.startsWith('_') || SKIP_DIRS.has(entry.name)) continue;
      const sub = dir ? `${dir}/${entry.name}` : entry.name;
      if (existsSync(join(root, sub, 'index.html'))) pages.push(`${sub}/index.html`);
      walk(sub);
    }
  };
  walk('');
  return pages
    .map((rel) => ({
      rel,
      file: join(root, ...rel.split('/')),
      urlPath: urlPathFor(rel),
      // Rollup entry name: "main" for the homepage (as before), otherwise the folder path.
      name: rel === 'index.html' ? 'main' : rel.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\//g, '-'),
    }))
    .sort((a, b) => (a.urlPath === '/' ? -1 : b.urlPath === '/' ? 1 : a.urlPath.localeCompare(b.urlPath)));
}

/** ISO date of the last git commit that touched `rel`, or null. */
function gitLastModified(root, rel) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', rel], { cwd: root, encoding: 'utf8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function readPageInfo(page) {
  const html = readFileSync(page.file, 'utf8');
  const title = decodeEntities((getTitles(html)[0] || '').replace(/\s+/g, ' ').trim());
  const description = decodeEntities((getMetaContent(html, 'description') || '').replace(/\s+/g, ' ').trim());
  return {
    ...page,
    title,
    description,
    h1: textOf(getElementsInner(html, 'h1')[0] || ''),
    noindex: hasNoindex(html),
    published: getMetaContent(html, 'article:published_time'),
  };
}

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeHtml = escapeXml;

/** "2026-11-20" -> "November 20, 2026" (empty string if not a valid date). */
function humanDate(iso) {
  const d = new Date(`${(iso || '').slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** HTML for the post list on blog/index.html (replaces the <!-- blog:posts --> marker). */
function renderBlogList(posts) {
  if (!posts.length) return '<p class="text-gray-600">New guides are on the way.</p>';
  return posts
    .map((p) => {
      const date = p.published ? p.published.slice(0, 10) : '';
      return [
        '<article>',
        `  <a href="${p.urlPath}" class="blog-card">`,
        date ? `    <div class="text-sm text-gray-500 mb-2"><time datetime="${date}">${humanDate(date)}</time></div>` : '',
        `    <h2 class="text-xl font-semibold text-gray-900 mb-2">${escapeHtml(p.h1 || p.title)}</h2>`,
        `    <p class="text-gray-600 leading-relaxed">${escapeHtml(p.description)}</p>`,
        '    <span class="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-btn-primary-bg">Read the guide <i class="fas fa-arrow-right"></i></span>',
        '  </a>',
        '</article>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}
const escapeAttr = (s) => s.replace(/"/g, '&quot;');

/** Head tags to add to one page (only the ones it doesn't already have). */
function headTagsFor(html, urlPath) {
  const url = SITE_ORIGIN + urlPath;
  const rawTitle = (getTitles(html)[0] || '').replace(/\s+/g, ' ').trim();
  const description = (getMetaContent(html, 'description') || '').replace(/\s+/g, ' ').trim();
  const has = (key) => findMeta(html, key).length > 0;
  const tags = [];
  if (!findTags(html, 'link').some((t) => (t.attrs.rel || '').toLowerCase() === 'canonical')) {
    tags.push(`<link rel="canonical" href="${url}">`);
  }
  const meta = (key, value, attr = 'property') => {
    if (value != null && value !== '' && !has(key)) tags.push(`<meta ${attr}="${key}" content="${escapeAttr(value)}">`);
  };
  meta('og:type', 'website');
  meta('og:site_name', SITE_NAME);
  meta('og:title', rawTitle);
  meta('og:description', description);
  meta('og:url', url);
  if (!has('og:image')) {
    meta('og:image', SITE_ORIGIN + DEFAULT_OG_IMAGE.path);
    meta('og:image:width', String(DEFAULT_OG_IMAGE.width));
    meta('og:image:height', String(DEFAULT_OG_IMAGE.height));
    meta('og:image:alt', DEFAULT_OG_IMAGE.alt);
  }
  meta('twitter:card', 'summary_large_image', 'name');
  return tags;
}

function injectHeadTags(html, urlPath) {
  const tags = headTagsFor(html, urlPath);
  if (!tags.length) return html;
  const block = tags.map((t) => `  ${t}\n`).join('');
  // Insert right after the description meta tag so the head stays readable; else before </head>.
  const desc = findMeta(html, 'description')[0];
  if (desc) {
    const lineEnd = html.indexOf('\n', desc.end);
    const at = lineEnd === -1 ? desc.end : lineEnd + 1;
    return html.slice(0, at) + block + html.slice(at);
  }
  return html.replace(/<\/head>/i, `${block}</head>`);
}

function buildSitemap(root, pages) {
  const entries = pages
    .filter((p) => !p.noindex)
    .map((p) => ({ loc: SITE_ORIGIN + p.urlPath, lastmod: gitLastModified(root, p.rel) }));
  for (const rel of EXTRA_SITEMAP_FILES) {
    if (!existsSync(join(root, ...rel.split('/')))) continue;
    entries.push({ loc: SITE_ORIGIN + encodeURI('/' + rel.replace(/^public\//, '')), lastmod: gitLastModified(root, rel) });
  }
  const urls = entries
    .map((e) => `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n${e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : ''}  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Blog posts (pages under /blog/<slug>/), newest first. */
export function blogPosts(pages) {
  return pages
    .filter((p) => p.urlPath.startsWith('/blog/') && p.urlPath !== '/blog/' && !p.noindex)
    .sort((a, b) => (b.published || '').localeCompare(a.published || '') || a.urlPath.localeCompare(b.urlPath));
}

function buildLlmsTxt(root, pages) {
  const src = join(root, 'site', 'llms.txt');
  if (!existsSync(src)) return null;
  let text = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
  const blogIndex = pages.find((p) => p.urlPath === '/blog/');
  let section = '';
  if (blogIndex) {
    const lines = [`## Blog`, '', `- [FutureWeather blog](${SITE_ORIGIN}/blog/): ${blogIndex.description}`];
    for (const post of blogPosts(pages)) lines.push(`- [${post.h1 || post.title}](${SITE_ORIGIN}${post.urlPath}): ${post.description}`);
    section = lines.join('\n') + '\n';
  }
  text = text.replace(/^\{\{BLOG_SECTION\}\}\n?/m, section);
  return text.replace(/\n{3,}/g, '\n\n');
}

export default function sitePlugin() {
  let root = process.cwd();
  let pageByFile = new Map();

  return {
    name: 'futureweather-site',

    config(userConfig) {
      root = userConfig.root || process.cwd();
      const pages = discoverPages(root);
      pageByFile = new Map(pages.map((p) => [toPosix(p.file).toLowerCase(), p]));
      return { build: { rollupOptions: { input: Object.fromEntries(pages.map((p) => [p.name, p.file])) } } };
    },

    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const key = ctx.filename ? toPosix(ctx.filename).toLowerCase() : null;
        let page = key && pageByFile.get(key);
        if (!page && ctx.path) {
          const rel = ctx.path.replace(/^\//, '');
          page = { urlPath: urlPathFor(rel.endsWith('/') ? rel + 'index.html' : rel) };
        }
        if (!page) return html;
        if (page.urlPath === '/blog/' && html.includes('<!-- blog:posts -->')) {
          const posts = blogPosts(discoverPages(root).map(readPageInfo));
          html = html.replace('<!-- blog:posts -->', renderBlogList(posts));
        }
        // Blog pages carry writing-guidance comments from the template; never publish them.
        if (page.urlPath.startsWith('/blog/')) html = stripComments(html);
        return injectHeadTags(html, page.urlPath);
      },
    },

    generateBundle() {
      const pages = discoverPages(root).map(readPageInfo);
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(root, pages) });
      const llms = buildLlmsTxt(root, pages);
      if (llms) this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llms });
    },
  };
}
