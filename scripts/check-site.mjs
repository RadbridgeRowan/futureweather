#!/usr/bin/env node
// Post-build checks for the FutureWeather site.
// Usage: `npm run build` then `npm run check`. Exits with code 1 if any ERROR is found.
//
// Checks every page in dist/: one non-empty <title> and description (unique across the site,
// description 50-160 characters), a canonical link that matches the page's own URL, exactly one
// <h1> with text, Open Graph + Twitter tags (og:image file must exist), valid JSON-LD (BlogPosting
// must have headline, datePublished, author), and that every internal link/image/#anchor resolves.
// Also checks sitemap.xml, robots.txt and llms.txt, and that the prices in the homepage's
// SoftwareApplication JSON-LD exactly match the prices shown in the #pricing section.
// Blog: fails on unfilled {{PLACEHOLDERS}} or [CHECK: ...] notes anywhere, requires each post
// (/blog/<slug>/) to have BlogPosting JSON-LD, og:type "article" and a matching
// article:published_time, to be listed on /blog/, and refuses an empty blog.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_ORIGIN, urlPathFor } from './site-plugin.js';
import {
  findTags,
  findMeta,
  getMetaContent,
  getTitles,
  getElementsInner,
  textOf,
  decodeEntities,
  getJsonLdBlocks,
  hasNoindex,
  blankComments,
} from './html-utils.js';

const DIST = 'dist';
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// ---------------------------------------------------------------- files in dist
function walk(dir, prefix = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}
const allFiles = new Set(walk(DIST));
const read = (rel) => readFileSync(join(DIST, ...rel.split('/')), 'utf8');
const htmlFiles = [...allFiles].filter((f) => f.endsWith('.html')).sort();

const idCache = new Map();
function idsIn(rel) {
  if (!idCache.has(rel)) {
    const html = read(rel);
    const ids = new Set();
    for (const m of html.matchAll(/\s(?:id|name)\s*=\s*["']([^"']+)["']/g)) ids.add(m[1]);
    idCache.set(rel, ids);
  }
  return idCache.get(rel);
}

/** Resolve a URL found on page `fromRel` to a file in dist. */
function resolveTarget(fromRel, rawUrl) {
  let u = decodeEntities(rawUrl.trim());
  if (!u || /^(mailto:|tel:|javascript:|data:|blob:)/i.test(u)) return { kind: 'skip' };
  if (u.includes('\\')) return { kind: 'bad', reason: 'uses backslashes instead of forward slashes' };
  if (u.startsWith('//')) u = 'https:' + u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) {
    const parsed = new URL(u);
    if (parsed.origin !== SITE_ORIGIN) return { kind: 'external' };
  }
  const resolved = new URL(u, SITE_ORIGIN + urlPathFor(fromRel));
  let path;
  try {
    path = decodeURIComponent(resolved.pathname).replace(/^\//, '');
  } catch {
    return { kind: 'bad', reason: 'has invalid URL encoding' };
  }
  const candidates = path === '' || path.endsWith('/') ? [path + 'index.html'] : [path, path + '.html', path + '/index.html'];
  const file = candidates.find((c) => allFiles.has(c)) || null;
  return { kind: 'internal', file, hash: resolved.hash.replace(/^#/, ''), path: '/' + path };
}

function checkUrl(fromRel, url, label) {
  const t = resolveTarget(fromRel, url);
  if (t.kind === 'bad') return err(fromRel, `${label} "${url}" ${t.reason}`);
  if (t.kind !== 'internal') return;
  if (!t.file) return err(fromRel, `${label} "${url}" does not resolve to a file in dist/`);
  if (t.hash && t.file.endsWith('.html')) {
    let id;
    try {
      id = decodeURIComponent(t.hash);
    } catch {
      id = t.hash;
    }
    if (!idsIn(t.file).has(id)) err(fromRel, `${label} "${url}" points to #${id}, which does not exist on ${t.file}`);
  }
}

// ---------------------------------------------------------------- JSON-LD helpers
function collectNodes(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collectNodes(n, out));
  else if (node && typeof node === 'object') {
    if (node['@type']) out.push(node);
    for (const v of Object.values(node)) collectNodes(v, out);
  }
  return out;
}
const typesOf = (node) => [].concat(node['@type'] || []);
const normPrice = (p) => String(p).replace(/,/g, '').replace(/\.0+$/, '');

// ---------------------------------------------------------------- per-page checks
const pages = [];
const SKIP_LINK_RELS = new Set(['canonical', 'preconnect', 'dns-prefetch', 'alternate']);

for (const rel of htmlFiles) {
  const html = read(rel);
  const urlPath = urlPathFor(rel);
  const expectedUrl = SITE_ORIGIN + urlPath;
  const info = { rel, urlPath, noindex: hasNoindex(html), types: [], blogPostings: [] };
  const isPost = /^\/blog\/[^/]+\/$/.test(urlPath);

  // Unfinished drafts (text inside HTML comments is ignored)
  const visible = blankComments(html);
  const placeholders = [...new Set([...visible.matchAll(/\{\{[A-Z0-9_]+\}\}/g)].map((m) => m[0]))];
  if (placeholders.length) err(rel, `unfilled placeholder(s): ${placeholders.join(', ')}`);
  const checks = [...visible.matchAll(/\[CHECK[^\]]*\]/g)].map((m) => m[0]);
  if (checks.length) err(rel, `${checks.length} [CHECK] note(s) still to verify, e.g. ${cut(textOf(checks[0]), 90)}`);

  // Title
  const titles = getTitles(html);
  if (titles.length !== 1) err(rel, `expected 1 <title>, found ${titles.length}`);
  info.title = decodeEntities((titles[0] || '').replace(/\s+/g, ' ').trim());
  if (!info.title) err(rel, 'title is empty');
  else if (info.title.length > 65) warn(rel, `title is ${info.title.length} characters (Google shows about 60)`);

  // Description
  const descs = findMeta(html, 'description');
  if (descs.length !== 1) err(rel, `expected 1 meta description, found ${descs.length}`);
  info.description = decodeEntities((descs[0]?.attrs.content || '').replace(/\s+/g, ' ').trim());
  if (descs.length && (info.description.length < 50 || info.description.length > 160)) {
    err(rel, `description is ${info.description.length} characters (should be 50-160)`);
  }

  // Canonical
  const canon = findTags(html, 'link').filter((t) => (t.attrs.rel || '').toLowerCase() === 'canonical');
  if (canon.length !== 1) err(rel, `expected 1 canonical link, found ${canon.length}`);
  else if (canon[0].attrs.href !== expectedUrl) err(rel, `canonical is "${canon[0].attrs.href}", expected "${expectedUrl}"`);
  info.canonical = canon[0]?.attrs.href || '';

  // H1
  const h1s = getElementsInner(html, 'h1');
  if (h1s.length !== 1) err(rel, `expected exactly 1 <h1>, found ${h1s.length}`);
  info.h1 = textOf(h1s[0] || '');
  if (h1s.length && !info.h1) err(rel, '<h1> has no text');

  // Open Graph / Twitter
  for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name', 'twitter:card']) {
    const n = findMeta(html, key).length;
    if (n !== 1) err(rel, `expected 1 "${key}" meta tag, found ${n}`);
  }
  const ogUrl = getMetaContent(html, 'og:url');
  if (ogUrl && ogUrl !== expectedUrl) err(rel, `og:url is "${ogUrl}", expected "${expectedUrl}"`);
  const ogImage = getMetaContent(html, 'og:image');
  if (ogImage) {
    if (!ogImage.startsWith(SITE_ORIGIN + '/')) err(rel, `og:image must be an absolute ${SITE_ORIGIN} URL, got "${ogImage}"`);
    else checkUrl(rel, ogImage, 'og:image');
  }

  // JSON-LD
  for (const [i, block] of getJsonLdBlocks(html).entries()) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (e) {
      err(rel, `JSON-LD block ${i + 1} does not parse: ${e.message}`);
      continue;
    }
    const nodes = collectNodes(data);
    for (const node of nodes) {
      const types = typesOf(node);
      info.types.push(...types);
      if (types.includes('BlogPosting')) {
        info.blogPostings.push(node);
        for (const f of ['headline', 'datePublished', 'author']) if (!node[f]) err(rel, `BlogPosting is missing "${f}"`);
      }
      if (types.includes('SoftwareApplication') && node.offers && rel === 'index.html') {
        info.offerPrices = [].concat(node.offers).map((o) => normPrice(o.price ?? o.priceSpecification?.price ?? ''));
      }
    }
  }

  // Blog posts
  if (isPost) {
    if (getMetaContent(html, 'og:type') !== 'article') err(rel, 'blog post should set <meta property="og:type" content="article">');
    const published = getMetaContent(html, 'article:published_time') || '';
    if (!/^\d{4}-\d{2}-\d{2}/.test(published) || Number.isNaN(Date.parse(published))) {
      err(rel, `blog post needs article:published_time as YYYY-MM-DD (got "${published}")`);
    }
    if (info.blogPostings.length !== 1) err(rel, `blog post should have 1 BlogPosting in its JSON-LD, found ${info.blogPostings.length}`);
    else if (String(info.blogPostings[0].datePublished).slice(0, 10) !== published.slice(0, 10)) {
      err(rel, `BlogPosting datePublished "${info.blogPostings[0].datePublished}" does not match article:published_time "${published}"`);
    }
    info.isPost = true;
  }

  // Pricing drift (homepage)
  if (rel === 'index.html' && info.offerPrices) {
    const section = (html.match(/<section\b[^>]*id="pricing"[\s\S]*?<\/section>/i) || [''])[0];
    const shown = [...section.matchAll(/<span class="currency">\$<\/span>\s*([\d,]+(?:\.\d+)?)/g)].map((m) => normPrice(m[1]));
    const a = [...info.offerPrices].sort().join(', ');
    const b = [...shown].sort().join(', ');
    if (!section) err(rel, 'JSON-LD has offers but no #pricing section was found');
    else if (a !== b) err(rel, `JSON-LD offer prices [${a}] do not match the #pricing section [${b}]. Update the JSON-LD in index.html.`);
  }

  // Internal links, images, scripts
  for (const t of findTags(html, 'a')) if (t.attrs.href != null) checkUrl(rel, t.attrs.href, '<a href>');
  for (const t of findTags(html, 'link')) {
    const relAttr = (t.attrs.rel || '').toLowerCase();
    if (t.attrs.href && !SKIP_LINK_RELS.has(relAttr)) checkUrl(rel, t.attrs.href, `<link rel="${relAttr}">`);
  }
  for (const tagName of ['img', 'script', 'source', 'video', 'iframe']) {
    for (const t of findTags(html, tagName)) {
      if (t.attrs.src) checkUrl(rel, t.attrs.src, `<${tagName} src>`);
      if (t.attrs.poster) checkUrl(rel, t.attrs.poster, `<${tagName} poster>`);
    }
  }
  for (const t of findTags(html, 'div')) {
    if (!t.attrs['data-slides']) continue;
    try {
      for (const s of JSON.parse(decodeEntities(t.attrs['data-slides']))) if (s.src) checkUrl(rel, s.src, 'data-slides image');
    } catch {
      err(rel, 'data-slides attribute is not valid JSON');
    }
  }

  pages.push(info);
}

// Uniqueness
for (const field of ['title', 'description']) {
  const seen = new Map();
  for (const p of pages) {
    const key = (p[field] || '').toLowerCase();
    if (!key) continue;
    if (seen.has(key)) err(p.rel, `${field} duplicates ${seen.get(key)}`);
    else seen.set(key, p.rel);
  }
}

// Blog index lists every post, and is never published empty
const blogIndex = pages.find((p) => p.urlPath === '/blog/');
const posts = pages.filter((p) => p.isPost && !p.noindex);
if (blogIndex) {
  const indexHtml = read(blogIndex.rel);
  if (!posts.length) err(blogIndex.rel, 'the blog has no posts yet. Add the first post before deploying /blog/.');
  for (const p of posts) if (!indexHtml.includes(`href="${p.urlPath}"`)) err(blogIndex.rel, `does not link to post ${p.urlPath}`);
} else if (posts.length) {
  err('blog/index.html', 'blog posts exist but there is no /blog/ index page');
}

// ---------------------------------------------------------------- sitemap.xml
if (!allFiles.has('sitemap.xml')) err('sitemap.xml', 'missing');
else {
  const xml = read('sitemap.xml');
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const listed = new Set();
  for (const b of blocks) {
    const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lastmod = (b.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (!loc) {
      err('sitemap.xml', 'a <url> entry has no <loc>');
      continue;
    }
    if (!loc.startsWith(SITE_ORIGIN + '/')) err('sitemap.xml', `"${loc}" is not on ${SITE_ORIGIN}`);
    const t = resolveTarget('index.html', loc);
    if (t.kind !== 'internal' || !t.file) err('sitemap.xml', `"${loc}" does not resolve to a file in dist/`);
    else {
      listed.add(t.file);
      const page = pages.find((p) => p.rel === t.file);
      if (page?.noindex) err('sitemap.xml', `"${loc}" is noindex and should not be in the sitemap`);
    }
    if (lastmod && Number.isNaN(Date.parse(lastmod))) err('sitemap.xml', `"${loc}" has an invalid lastmod "${lastmod}"`);
  }
  for (const p of pages) if (!p.noindex && !listed.has(p.rel)) err('sitemap.xml', `indexable page ${p.urlPath} is missing`);
}

// ---------------------------------------------------------------- robots.txt
if (!allFiles.has('robots.txt')) err('robots.txt', 'missing');
else {
  const robots = read('robots.txt');
  if (!new RegExp(`^Sitemap:\\s*${SITE_ORIGIN.replace(/\./g, '\\.')}/sitemap\\.xml\\s*$`, 'mi').test(robots)) {
    err('robots.txt', `no "Sitemap: ${SITE_ORIGIN}/sitemap.xml" line`);
  }
  if (/^Disallow:\s*\/\s*$/mi.test(robots)) err('robots.txt', 'contains "Disallow: /", which blocks the whole site');
}

// ---------------------------------------------------------------- llms.txt
if (!allFiles.has('llms.txt')) err('llms.txt', 'missing');
else {
  const llms = read('llms.txt');
  if (!/^# \S/.test(llms)) err('llms.txt', 'should start with a "# Title" line');
  if (/\{\{[A-Z_]+\}\}/.test(llms)) err('llms.txt', 'contains an unreplaced {{PLACEHOLDER}}');
  for (const m of llms.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
    const t = resolveTarget('index.html', m[1]);
    if (t.kind === 'internal' && !t.file) err('llms.txt', `link "${m[1]}" does not resolve to a file in dist/`);
  }
}

// ---------------------------------------------------------------- report
console.log('\nPages in dist/\n');
for (const p of pages) {
  console.log(`${p.urlPath}${p.noindex ? '  [noindex]' : ''}`);
  console.log(`  title (${p.title.length}): ${p.title}`);
  console.log(`  description (${p.description.length}): ${cut(p.description, 110)}`);
  console.log(`  h1: ${cut(p.h1 || '(none)', 90)}`);
  console.log(`  canonical: ${p.canonical || '(none)'}`);
  console.log(`  JSON-LD: ${[...new Set(p.types)].join(', ') || '(none)'}`);
}
console.log('');
for (const w of warnings) console.log(`WARNING  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);
console.log(`\n${pages.length} pages checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
