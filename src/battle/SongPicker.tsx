import { useEffect, useRef, useState } from 'react';
import { searchSongs, type Song } from './musicSearch';
import { parseLink, resolveLink } from './linkSources';

interface Props {
  onPick: (song: Song) => Promise<void>;
  disabled?: boolean;
}

type Tab = 'search' | 'link';

export default function SongPicker({ onPick, disabled }: Props) {
  const [tab, setTab] = useState<Tab>('search');
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Pasted link state, kept separate so switching tabs does not lose either.
  const [link, setLink] = useState('');
  const [resolved, setResolved] = useState<Song | null>(null);
  const [resolving, setResolving] = useState(false);

  // One in-flight request at a time, so a fast typist does not race an older
  // response over a newer one.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (tab !== 'search') return;
    const query = term.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);
      setError(null);
      searchSongs(query, controller.signal)
        .then((songs) => setResults(songs))
        .catch((e) => {
          if ((e as Error).name !== 'AbortError') setError((e as Error).message);
        })
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [term, tab]);

  // Resolve a pasted link as soon as it looks like one, so the player sees the
  // track they are about to pick rather than submitting a URL blind.
  useEffect(() => {
    if (tab !== 'link') return;
    setResolved(null);

    const parsed = parseLink(link);
    if (!parsed) {
      // Stay quiet until there is enough typed to be a wrong answer rather
      // than an unfinished one.
      setError(link.trim().length > 12 ? 'That is not a SoundCloud or YouTube track link.' : null);
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setResolving(true);
      setError(null);
      resolveLink(parsed, controller.signal)
        .then(setResolved)
        .catch((e) => {
          if ((e as Error).name !== 'AbortError') setError((e as Error).message);
        })
        .finally(() => setResolving(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [link, tab]);

  const pick = async (song: Song) => {
    setSubmitting(song.externalId);
    setError(null);
    try {
      await onPick(song);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div>
      <div className="battle-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'search'}
          className={`battle-tab ${tab === 'search' ? 'battle-tab--on' : ''}`}
          onClick={() => {
            setTab('search');
            setError(null);
          }}
        >
          Search
        </button>
        <button
          role="tab"
          aria-selected={tab === 'link'}
          className={`battle-tab ${tab === 'link' ? 'battle-tab--on' : ''}`}
          onClick={() => {
            setTab('link');
            setError(null);
          }}
        >
          Paste a link
        </button>
      </div>

      {tab === 'search' ? (
        <>
          <label className="battle-label" htmlFor="song-search">
            Search for a song
          </label>
          <input
            id="song-search"
            className="battle-input"
            value={term}
            disabled={disabled}
            placeholder="Song or artist"
            onChange={(e) => setTerm(e.target.value)}
          />

          {searching && (
            <p className="battle-sub" style={{ margin: '12px 0 0' }}>
              Searching…
            </p>
          )}
        </>
      ) : (
        <>
          <label className="battle-label" htmlFor="song-link">
            SoundCloud or YouTube link
          </label>
          <input
            id="song-link"
            className="battle-input"
            value={link}
            disabled={disabled}
            placeholder="https://soundcloud.com/… or https://youtu.be/…"
            onChange={(e) => setLink(e.target.value)}
          />

          {resolving && (
            <p className="battle-sub" style={{ margin: '12px 0 0' }}>
              Looking up that track…
            </p>
          )}
        </>
      )}

      {error && <div className="battle-error">{error}</div>}

      <ul className="battle-results">
        {(tab === 'search' ? results : resolved ? [resolved] : []).map((song) => (
          <li key={song.externalId}>
            <button
              className="battle-result"
              disabled={disabled || submitting !== null}
              onClick={() => void pick(song)}
            >
              {song.artworkUrl ? (
                <img src={song.artworkUrl} alt="" className="battle-art" />
              ) : (
                <div className="battle-art battle-art--empty" />
              )}
              <span className="battle-result__text">
                <strong>{song.title}</strong>
                <span>{song.artist}</span>
              </span>
              <span className="battle-result__cta">
                {submitting === song.externalId ? '…' : 'Pick'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
