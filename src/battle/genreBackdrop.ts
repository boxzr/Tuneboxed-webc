/**
 * A cartoon of the prompt, pulled from image search and used as a full-bleed
 * backdrop. Photographs and generated stock posters are skipped. Nothing
 * found stays white.
 */

const cache = new Map<string, string | null>();

const LEADING =
  /^(feels like|you blast this|in an|in a|at the|at a|with a)\s+/i;

const SKIP =
  /logo|wordmark|photograph|silhouette|studio|\.pdf(\?|$)|\.djvu(\?|$)|rawpixel|productions/i;
const WANT = /cartoon|clipart|comic/i;

export function searchQuery(genre: string): string {
  return genre.replace(LEADING, '').replace(/['’]/g, '').trim();
}

export function isCartoon(source: string, title = ''): boolean {
  if (!source) return false;
  const hay = `${source} ${title}`;
  if (SKIP.test(hay)) return false;
  return WANT.test(hay);
}

function queriesFor(genre: string): string[] {
  const q = searchQuery(genre);
  const extra: string[] = [];
  if (/\brap\b|drake|drill/i.test(q)) extra.push('hip hop');
  return [q, ...extra];
}

type Hit = { source: string; title?: string };

function pick(hits: Hit[]): string | null {
  return hits.find((h) => isCartoon(h.source, h.title))?.source ?? null;
}

async function commonsSearch(query: string): Promise<string | null> {
  for (const kind of ['clipart', 'cartoon']) {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrnamespace', '6');
    url.searchParams.set('gsrsearch', `${query} ${kind}`);
    url.searchParams.set('gsrlimit', '8');
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url');
    url.searchParams.set('iiurlwidth', '1920');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const res = await fetch(url);
    if (!res.ok) continue;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { title?: string; imageinfo?: { url?: string; thumburl?: string }[] }
        >;
      };
    };
    const hits: Hit[] = [];
    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      const source = /\.svg(\?|$)/i.test(info?.url ?? '')
        ? info?.thumburl ?? info?.url
        : info?.thumburl ?? info?.url;
      if (!source) continue;
      hits.push({ source, title: page.title });
    }
    const found = pick(hits);
    if (found) return found;
  }
  return null;
}

async function openverseSearch(query: string): Promise<string | null> {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', `${query} cartoon`);
  url.searchParams.set('page_size', '10');
  url.searchParams.set('mature', 'false');

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: { title?: string; url?: string; thumbnail?: string }[];
  };
  const hits: Hit[] = [];
  for (const row of data.results ?? []) {
    const source = row.url ?? row.thumbnail;
    if (!source) continue;
    hits.push({ source, title: row.title });
  }
  return pick(hits);
}

/** A cartoon for the prompt, or null so the board stays white. */
export async function findGenreImage(genre: string | null | undefined): Promise<string | null> {
  const key = genre?.trim() ?? '';
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  let url: string | null = null;
  try {
    for (const q of queriesFor(key)) {
      url = (await commonsSearch(q)) ?? (await openverseSearch(q));
      if (url) break;
    }
  } catch {
    url = null;
  }
  cache.set(key, url);
  return url;
}
