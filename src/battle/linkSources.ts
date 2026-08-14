import type { Song } from './musicSearch';

/**
 * Pasted SoundCloud and YouTube links.
 *
 * Both are resolved through the providers' oEmbed endpoints, which need no API
 * key, no quota and no paid plan, and which both send permissive CORS headers
 * so this works from a static site. That matters because the alternatives do
 * not: YouTube's Data API allows only 100 searches a day, which a single
 * sixteen player bracket could exhaust, and SoundCloud's API now requires an
 * Artist Pro subscription plus a client secret that cannot live in a browser.
 * Pasting a link buys most of the value with none of that.
 */

export type EmbedSource = 'soundcloud' | 'youtube';

export interface ParsedLink {
  source: EmbedSource;
  /** The canonical page URL, which is what oEmbed accepts. */
  url: string;
}

/** A YouTube id is always eleven characters from this alphabet. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Works out which provider a pasted string belongs to, or null if it is
 * neither. Deliberately strict: a half-typed or unrelated URL should fall
 * through to "that is not a track link" rather than be sent to an oEmbed
 * endpoint that will just fail more slowly.
 */
export function parseLink(input: string): ParsedLink | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    // Accept a bare "soundcloud.com/..." paste, which is what you get from
    // some share sheets and from copying out of a browser's address bar.
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  // ---- YouTube ----
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return YOUTUBE_ID.test(id) ? youtube(id) : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v');
    if (v && YOUTUBE_ID.test(v)) return youtube(v);

    // /shorts/ID, /embed/ID and /live/ID all carry the id in the path.
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return youtube(m[1]);
    return null;
  }

  // ---- SoundCloud ----
  if (host === 'soundcloud.com' || host === 'm.soundcloud.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    // A track is /user/slug. One segment is a profile, and /sets/ is a
    // playlist; neither is a single song, so neither is a valid pick.
    if (parts.length < 2 || parts[1] === 'sets') return null;
    return { source: 'soundcloud', url: `https://soundcloud.com/${parts[0]}/${parts[1]}` };
  }

  // Short links redirect to the real URL, which cannot be followed from the
  // browser without the redirect being CORS-readable. Rejecting them with a
  // clear message beats a confusing failure later.
  if (host === 'on.soundcloud.com' || host === 'soundcloud.app.goo.gl') {
    return null;
  }

  return null;
}

function youtube(id: string): ParsedLink {
  return { source: 'youtube', url: `https://www.youtube.com/watch?v=${id}` };
}

interface OEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

const OEMBED_ENDPOINT: Record<EmbedSource, string> = {
  soundcloud: 'https://soundcloud.com/oembed',
  youtube: 'https://www.youtube.com/oembed',
};

/**
 * Turns a parsed link into a pickable song.
 *
 * Embeds carry no preview URL. They play through the provider's own player
 * rather than as an audio file, so `externalId` holds whatever that player
 * needs: a video id for YouTube, and SoundCloud's resolved track URL.
 */
export async function resolveLink(link: ParsedLink, signal?: AbortSignal): Promise<Song> {
  const endpoint = `${OEMBED_ENDPOINT[link.source]}?format=json&url=${encodeURIComponent(link.url)}`;

  let res: Response;
  try {
    res = await fetch(endpoint, { signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new Error('Could not reach that link. Check your connection and try again.');
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error('That track is private, so the room would not be able to play it.');
  }
  // YouTube answers 400 rather than 404 for an id that does not exist, and both
  // providers use 404 for a deleted track. To someone pasting a link these are
  // the same problem, so they get the same message.
  if (res.status === 400 || res.status === 404) {
    throw new Error('That link does not point at a track that exists.');
  }
  if (!res.ok) {
    throw new Error('That link could not be loaded. Try a different one.');
  }

  const data = (await res.json()) as OEmbed;
  const artist = data.author_name?.trim() || 'Unknown artist';
  const title = cleanTitle(data.title, artist);
  if (!title) throw new Error('That link did not come back with a track name.');

  return {
    title,
    artist,
    artworkUrl: data.thumbnail_url ?? null,
    previewUrl: null,
    externalId: externalIdFor(link, data),
    source: link.source,
  };
}

/**
 * SoundCloud returns the title as "Track by Artist", so the artist ends up
 * printed twice in the UI unless the suffix is trimmed.
 */
function cleanTitle(title: string | undefined, artist: string): string {
  const t = title?.trim();
  if (!t) return '';
  const suffix = ` by ${artist}`;
  return t.toLowerCase().endsWith(suffix.toLowerCase()) ? t.slice(0, -suffix.length).trim() : t;
}

function externalIdFor(link: ParsedLink, data: OEmbed): string {
  if (link.source === 'youtube') {
    return new URL(link.url).searchParams.get('v') ?? '';
  }

  // The widget takes an api.soundcloud.com/tracks/<id> URL, and oEmbed has
  // already done that lookup for us inside the iframe it hands back. Falling
  // back to the permalink keeps this working if the markup ever changes, since
  // the widget accepts that too, just with an extra resolve.
  const match = data.html?.match(/api\.soundcloud\.com%2Ftracks%2F(\d+)/);
  return match ? `https://api.soundcloud.com/tracks/${match[1]}` : link.url;
}
