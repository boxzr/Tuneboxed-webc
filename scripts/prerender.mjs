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
 * description and canonical instead of the home page's.
 *
 * This prerenders metadata, not markup: the body is still the app shell that
 * boots and renders the page. That is enough for indexing, because search
 * engines execute the JavaScript, and it avoids server-rendering React in a
 * plain Node script where `import.meta.env` and the Supabase client would not
 * behave. If crawlers that do not run JavaScript ever matter, the upgrade is a
 * proper SSR build rather than more string replacement here.
 *
 * Run after `vite build`.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://tuneboxed.com';

/**
 * Keep in step with the routes in src/App.tsx and CONTENT_PAGES in
 * src/pages/PageLayout.tsx. A route missing here still works for visitors but
 * silently goes back to returning 404 for crawlers, which is the exact bug
 * this script exists to fix.
 */
const ROUTES = [
  {
    path: '/',
    title: 'TuneBoxed | The Kahoot of song battles',
    description:
      'Host a song battle bracket for your Twitch stream. Viewers join from the browser with a room code, songs play in sync, and chat votes for the winner.',
  },
  {
    path: '/battle',
    title: 'Start a song battle | TuneBoxed',
    description:
      'Create a song battle room or join one with a code. Runs in the browser, no app and no account needed.',
  },
  {
    path: '/rules',
    title: 'Game rules | TuneBoxed',
    description:
      'How a TuneBoxed song battle works: a bracket of up to 16 players, songs played in sync, and Twitch chat voting for the winner.',
  },
  {
    path: '/faq',
    title: 'FAQ | TuneBoxed',
    description:
      'Common questions about running a TuneBoxed song battle: Twitch chat voting, joining from a browser, the OBS overlay, and how long a bracket takes.',
  },
  {
    path: '/streamers',
    title: 'For streamers | TuneBoxed',
    description:
      'Run a song battle on your Twitch or TikTok stream: sign in with Twitch, add the OBS browser source, and let chat vote by typing 1 or 2.',
  },
  {
    path: '/winners',
    title: 'Winners | TuneBoxed',
    description:
      'Songs that won a TuneBoxed bracket. Published by the hosts who ran the battles.',
  },
  {
    path: '/about',
    title: 'About | TuneBoxed',
    description:
      'TuneBoxed is a music game. On the web it is song battles for streamers; on iOS it is a daily music feed where you post the song that fits the genre.',
  },
];

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

async function main() {
  const shell = await readFile(join(DIST, 'index.html'), 'utf8');

  for (const route of ROUTES) {
    const url = route.path === '/' ? `${ORIGIN}/` : `${ORIGIN}${route.path}`;

    let html = shell;
    html = html.replace(
      /<title>[^<]*<\/title>/i,
      `<title>${route.title.replace(/</g, '&lt;')}</title>`
    );
    html = setMeta(html, 'name', 'description', route.description);
    html = setMeta(html, 'property', 'og:title', route.title);
    html = setMeta(html, 'property', 'og:description', route.description);
    html = setMeta(html, 'property', 'og:url', url);
    html = html.replace(
      /(<link rel="canonical" href=")[^"]*(")/i,
      `$1${url}$2`
    );

    if (route.path === '/') {
      await writeFile(join(DIST, 'index.html'), html);
    } else {
      const dir = join(DIST, route.path.slice(1));
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'index.html'), html);
    }
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ROUTES.map((r) => {
      const url = r.path === '/' ? `${ORIGIN}/` : `${ORIGIN}${r.path}`;
      // The home page is the entry point and the only one worth a higher
      // priority; the rest are equal siblings.
      const priority = r.path === '/' ? '1.0' : '0.8';
      return `  <url><loc>${url}</loc><priority>${priority}</priority></url>`;
    }),
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(join(DIST, 'sitemap.xml'), sitemap);

  console.log(`prerendered ${ROUTES.length} routes + sitemap.xml`);
  for (const r of ROUTES) console.log(`  ${r.path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
