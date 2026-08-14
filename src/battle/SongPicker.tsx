import { useEffect, useRef, useState } from 'react';
import { searchSongs, type Song } from './musicSearch';

interface Props {
  onPick: (song: Song) => Promise<void>;
  disabled?: boolean;
}

export default function SongPicker({ onPick, disabled }: Props) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // One in-flight search at a time, so a fast typist does not race an older
  // response over a newer one.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
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
  }, [term]);

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

      {error && <div className="battle-error">{error}</div>}

      <ul className="battle-results">
        {results.map((song) => (
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
