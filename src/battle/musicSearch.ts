/** Where a pick came from, and so which player can sound it. */
export type SongSource = 'itunes' | 'itunes-video' | 'soundcloud' | 'youtube' | 'deezer';

/** What the search tab is looking for. */
export type SearchKind = 'song' | 'video';

export interface Song {
  title: string;
  artist: string;
  artworkUrl: string | null;
  /** A plain media URL. Null for embeds, which play in a provider iframe. */
  previewUrl: string | null;
  /** Track id for iTunes, video id for YouTube, track URL for SoundCloud. */
  externalId: string;
  source: SongSource;
}

interface ITunesTrack {
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackId?: number;
}

interface DeezerTrack {
  id?: number;
  title?: string;
  preview?: string;
  artist?: { name?: string };
  album?: { cover_medium?: string; cover_big?: string };
}

/**
 * Searches for a playable clip.
 *
 * iTunes is the first look: no key, CORS is open, and the 30-second preview
 * lasts, which is what a battle needs. Its search index is also thin. A lot
 * of songs that are on Apple Music never come back from `itunes.apple.com/
 * search` — Dee Mula's "Freestyle 8" is one, filed under "Deemula" and
 * invisible to every query we tried. Deezer's search finds those, so songs
 * go through both and the lists are merged. Deezer's preview link dies in
 * minutes, so a Deezer pick is stored as a track id and refreshed at play
 * time rather than as a URL that will 403 by the time the round starts.
 */
export async function searchSongs(
  term: string,
  kind: SearchKind = 'song',
  signal?: AbortSignal
): Promise<Song[]> {
  const query = tidy(term);
  if (!query) return [];

  if (kind === 'video') return searchITunes(query, 'video', signal);

  const [apple, deezer] = await Promise.all([
    searchITunes(query, 'song', signal).catch(() => [] as Song[]),
    searchDeezer(query, signal).catch(() => [] as Song[]),
  ]);

  if (!apple.length && !deezer.length) {
    throw new Error('Song search is unavailable right now.');
  }

  return mergeSongs(query, apple, deezer).slice(0, 16);
}

/**
 * A Deezer preview URL is signed and dies in about fifteen minutes. Call this
 * when a Deezer pick is about to play so the room hears a live link rather
 * than the one that was stored at pick time.
 */
export async function freshPreviewUrl(song: {
  source: string | null;
  external_id?: string | null;
  externalId?: string | null;
  preview_url?: string | null;
  previewUrl?: string | null;
}): Promise<string | null> {
  const stored = song.previewUrl ?? song.preview_url ?? null;
  const id = song.externalId ?? song.external_id ?? null;
  if (song.source !== 'deezer' || !id) return stored;

  try {
    const track = await readJson<DeezerTrack>(`https://api.deezer.com/track/${id}`);
    return track.preview || stored;
  } catch {
    return stored;
  }
}

/** Drop the filler people type into a search box. */
export function tidy(term: string): string {
  return term
    .replace(/\bby\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Letters and digits only, so "Dee Mula" and "Deemula" compare as the same. */
export function fold(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * How well a result matches what was typed. Whole-query hits rank above
 * token hits so "Freestyle 8 Dee Mula" beats a Dee Mula song that only
 * shares the artist.
 */
export function relevance(query: string, title: string, artist: string): number {
  const q = fold(query);
  const t = fold(title);
  const a = fold(artist);
  const hay = `${t}${a}`;
  if (!q) return 0;

  let score = 0;
  if (hay.includes(q) || q.includes(hay)) score += 10;
  if (t && (q.includes(t) || t.includes(q))) score += 6;

  for (const token of query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && w !== 'by' && w !== 'the')) {
    const f = fold(token);
    if (!f) continue;
    if (t.includes(f)) score += 3;
    else if (a.includes(f)) score += 2;
  }
  return score;
}

/** iTunes first at the same score, then drop a Deezer row that is the same song. */
export function mergeSongs(query: string, apple: Song[], deezer: Song[]): Song[] {
  const ranked = [...apple, ...deezer].sort((x, y) => {
    const diff = relevance(query, y.title, y.artist) - relevance(query, x.title, x.artist);
    if (diff) return diff;
    return Number(x.source !== 'itunes') - Number(y.source !== 'itunes');
  });

  const seen = new Set<string>();
  const out: Song[] = [];
  for (const song of ranked) {
    const key = `${fold(song.title)}|${fold(song.artist)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(song);
  }
  return out;
}

async function searchITunes(query: string, kind: SearchKind, signal?: AbortSignal): Promise<Song[]> {
  const entity = kind === 'video' ? 'musicVideo' : 'song';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query
  )}&entity=${entity}&limit=25`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Song search is unavailable right now.');

  const body = (await res.json()) as { results?: ITunesTrack[] };

  return (body.results ?? [])
    .filter((t) => t.previewUrl && t.trackName && t.artistName)
    .map((t) => ({
      title: t.trackName!,
      artist: t.artistName!,
      artworkUrl: t.artworkUrl100?.replace('100x100bb', '300x300bb') ?? null,
      previewUrl: t.previewUrl!,
      externalId: String(t.trackId ?? ''),
      source: (kind === 'video' ? 'itunes-video' : 'itunes') as SongSource,
    }));
}

async function searchDeezer(query: string, signal?: AbortSignal): Promise<Song[]> {
  const body = await readJson<{ data?: DeezerTrack[] }>(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=20`,
    signal
  );

  return (body.data ?? [])
    .filter((t) => t.preview && t.title && t.artist?.name && t.id)
    .map((t) => ({
      title: t.title!,
      artist: t.artist!.name!,
      artworkUrl: t.album?.cover_big ?? t.album?.cover_medium ?? null,
      previewUrl: t.preview!,
      externalId: String(t.id),
      source: 'deezer' as const,
    }));
}

/**
 * Deezer answers the browser through JSONP: their CORS headers never name
 * an origin, so `fetch` from tuneboxed.com is refused. Node (and tests)
 * can use fetch the usual way.
 */
function readJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  if (typeof document === 'undefined') {
    return fetch(url, { signal }).then((res) => {
      if (!res.ok) throw new Error('Song search is unavailable right now.');
      return res.json() as Promise<T>;
    });
  }
  return jsonp<T>(url, signal);
}

function jsonp<T>(url: string, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `__tbDz_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const join = url.includes('?') ? '&' : '?';
    let settled = false;

    const finish = (err?: Error, data?: T) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.remove();
      delete (window as unknown as Record<string, unknown>)[name];
      if (err) reject(err);
      else resolve(data as T);
    };

    const timer = window.setTimeout(() => finish(new Error('Song search is unavailable right now.')), 8000);
    (window as unknown as Record<string, (data: T) => void>)[name] = (data) => finish(undefined, data);
    script.onerror = () => finish(new Error('Song search is unavailable right now.'));
    script.src = `${url}${join}output=jsonp&callback=${name}`;
    document.head.appendChild(script);

    signal?.addEventListener('abort', () => finish(new DOMException('Aborted', 'AbortError')));
  });
}
