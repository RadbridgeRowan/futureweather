// Small, dependency-free HTML helpers shared by the build plugin (site-plugin.js)
// and the post-build checker (check-site.mjs). They are written for this site's
// hand-authored HTML, not as a general-purpose parser.

const ATTR_RE = /([^\s=\/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;

/** Parse the attributes of a single opening tag string, e.g. `<meta name="x" content="y">`. */
export function parseAttrs(tag) {
  const attrs = {};
  const inner = tag.replace(/^<\s*[a-zA-Z0-9-]+/, '').replace(/\/?>$/, '');
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(inner))) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    if (!(name in attrs)) attrs[name] = value;
  }
  return attrs;
}

/** Find every opening tag with the given name. Returns [{ tag, attrs, index, end }]. */
export function findTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    out.push({ tag: m[0], attrs: parseAttrs(m[0]), index: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** All <meta> tags whose name= or property= equals `key` (case-insensitive). */
export function findMeta(html, key) {
  const k = key.toLowerCase();
  return findTags(html, 'meta').filter(
    (t) => (t.attrs.name || '').toLowerCase() === k || (t.attrs.property || '').toLowerCase() === k
  );
}

export function getMetaContent(html, key) {
  const tags = findMeta(html, key);
  return tags.length ? tags[0].attrs.content ?? '' : null;
}

/** Raw inner HTML of every <title> element. */
export function getTitles(html) {
  return [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1]);
}

/** Inner HTML of every element with the given tag name (non-nested elements only). */
export function getElementsInner(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  return [...html.matchAll(re)].map((m) => m[1]);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', deg: '°', times: '×', plusmn: '±', copy: '©', hellip: '…' };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : all;
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}

/** Visible-ish text of an HTML fragment: tags removed, entities decoded, whitespace collapsed. */
export function textOf(fragment) {
  return decodeEntities(
    fragment
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

/** Bodies of every <script type="application/ld+json"> block. */
export function getJsonLdBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1]
  );
}

export function hasNoindex(html) {
  return findMeta(html, 'robots').some((t) => /noindex/i.test(t.attrs.content || ''));
}
