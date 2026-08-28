#!/usr/bin/env node
/**
 * Emit a real HTML file for every content route, plus a sitemap.
 *
 * Why this exists: the site is a single page app on GitHub Pages, which has no
 * server-side routing. Any path other than `/` misses a file, so GitHub serves
 * public/404.html — with an HTTP 404 status — and a script there rewrites the
 * URL so the app can boot. The page works for a human, but a crawler sees 404
 * and will not index the URL. Search result sitelinks need indexed pages, so
 * no amount of meta tags or structured data can produce them while every path
 * returns 404.
 *
 * Writing dist/<route>/index.html means GitHub has a real file to serve at
 * that path, so it answers 200, and each copy carries its own title,
 * description, canonical and JSON-LD instead of the home page's.
 *
 * This prerenders metadata, not markup: the body is still the app shell that
 * boots and renders the page. That is enough for indexing, because search
 * engines execute the JavaScript. Titles, descriptions and sitelink labels
 * come from scripts/seo.mjs so they cannot drift from the sitemap.
 *
 * Run after `vite build`.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, jsonLdFor, sitemapXml, absoluteUrl } from './seo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** Replace the content of a meta tag, matched on its name or property. */
function setMeta(html, attr, value, content) {
  const pattern = new RegExp(
    `(<meta\\s+${attr}="${value}"\\s+content=")[^"]*(")`,
    'i'
  );
  if (pattern.test(html)) return html.replace(pattern, `$1${escapeAttr(content)}$2`);

  // The multi-line form the description uses in index.html.
  const multiline = new RegExp(
    `(<meta\\s*\\n\\s*${attr}="${value}"\\s*\\n\\s*content=")[^"]*(")`,
    'i'
  );
  return html.replace(multiline, `$1${escapeAttr(content)}$2`);
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function setJsonLd(html, data) {
  return html.replace(
    /(<script type="application\/ld\+json"[^>]*>)[\s\S]*?(<\/script>)/i,
    `$1\n${JSON.stringify(data, null, 2)}\n    $2`
  );
}

async function main() {
  const shell = await readFile(join(DIST, 'index.html'), 'utf8');
  const lastmod = new Date().toISOString().slice(0, 10);

  for (const route of ROUTES) {
    const url = absoluteUrl(route.path);

    let html = shell;
    html = html.replace(
      /<title>[^<]*<\/title>/i,
      `<title>${route.title.replace(/</g, '&lt;')}</title>`
    );
    html = setMeta(html, 'name', 'description', route.description);
    html = setMeta(html, 'property', 'og:title', route.title);
    html = setMeta(html, 'property', 'og:description', route.description);
    html = setMeta(html, 'property', 'og:url', url);
    html = setMeta(html, 'name', 'twitter:title', route.title);
    html = setMeta(html, 'name', 'twitter:description', route.description);
    html = html.replace(
      /(<link rel="canonical" href=")[^"]*(")/i,
      `$1${url}$2`
    );
    html = setJsonLd(html, jsonLdFor(route));

    if (route.path === '/') {
      await writeFile(join(DIST, 'index.html'), html);
    } else {
      const dir = join(DIST, route.path.slice(1));
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'index.html'), html);
    }
  }

  await writeFile(join(DIST, 'sitemap.xml'), sitemapXml(lastmod));

  console.log(`prerendered ${ROUTES.length} routes + sitemap.xml`);
  for (const r of ROUTES) console.log(`  ${r.path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
