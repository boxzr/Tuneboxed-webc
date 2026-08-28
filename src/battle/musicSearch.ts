/** Where a pick came from, and so which player can sound it. */
export type SongSource = 'itunes' | 'itunes-video' | 'soundcloud' | 'youtube';

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

/**
 * Searches the iTunes catalogue, which is what BattlePreviewResolver already
 * uses on iOS. It needs no key, sends `access-control-allow-origin: *`, and
 * returns a 30 second preview that plays in any browser. That last part is
 * what makes a room with mixed Spotify and Apple Music listeners work:
 * everyone plays the same neutral preview rather than a provider stream only
 * some of them can reach.
 *
 * Music videos come from the same endpoint under a different entity, and
 * their previews are 30 second MP4s. They are marked with their own source so
 * the room knows to give them a screen rather than only a speaker.
 */
export async function searchSongs(
  term: string,
  kind: SearchKind = 'song',
  signal?: AbortSignal
): Promise<Song[]> {
  const query = term.trim();
  if (!query) return [];

  const entity = kind === 'video' ? 'musicVideo' : 'song';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query
  )}&entity=${entity}&limit=12`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Song search is unavailable right now.');

  const body = (await res.json()) as { results?: ITunesTrack[] };

  return (body.results ?? [])
    // A track with no preview cannot be played in the room, so it is not a
    // valid pick however good the song is.
    .filter((t) => t.previewUrl && t.trackName && t.artistName)
    .map((t) => ({
      title: t.trackName!,
      artist: t.artistName!,
      // The API returns a 100px thumbnail; the same path serves larger art.
      artworkUrl: t.artworkUrl100?.replace('100x100bb', '300x300bb') ?? null,
      previewUrl: t.previewUrl!,
      externalId: String(t.trackId ?? ''),
      source: (kind === 'video' ? 'itunes-video' : 'itunes') as SongSource,
    }));
}
