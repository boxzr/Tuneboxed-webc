import SongPicker from './SongPicker';
import type { Song } from './musicSearch';
import { SectionLabel } from './ui/primitives';
import { CheckIcon } from './ui/icons';
import type { BattlePlayer } from '../types/battle';

interface Props {
  /** This player's songs, own row first. */
  songs: BattlePlayer[];
  /** How many they may bring. */
  limit: number;
  busy: boolean;
  onAdd: (song: Song) => Promise<void>;
  onRemove: (entryId: string) => void;
}

/**
 * A player's Classic lobby songs.
 *
 * Each song is a row shaped like the search results it came from, so what is
 * locked in reads as the same object that was picked. The picker is remounted
 * after every add: otherwise the old query and its results sat under the list
 * and the same song could be picked a second time.
 */
export default function LobbySongs({ songs, limit, busy, onAdd, onRemove }: Props) {
  const full = songs.length >= limit;

  return (
    <div className="bt-lobby__pick">
      {songs.length > 0 && (
        <div className="bt-mysongs">
          <div className="bt-mysongs__head">
            <span className="bt-locked__icon">
              <CheckIcon size={18} />
            </span>
            <SectionLabel>
              {limit === 1 ? 'Your pick is in' : `Your songs · ${songs.length} of ${limit}`}
            </SectionLabel>
          </div>
          <ul className="bt-mysongs__list">
            {songs.map((s) => (
              <li key={s.id} className="bt-mysongs__row">
                {s.entry_artwork_url ? (
                  <img src={s.entry_artwork_url} alt="" className="bt-mysongs__art" />
                ) : (
                  <div className="bt-mysongs__art bt-mysongs__art--empty" />
                )}
                <span className="bt-mysongs__text">
                  <strong>{s.entry_song_title}</strong>
                  <span>{s.entry_song_artist}</span>
                </span>
                <button
                  type="button"
                  className="bt-mysongs__remove"
                  disabled={busy}
                  onClick={() => onRemove(s.id)}
                >
                  {limit === 1 ? 'Change' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!full && (
        <>
          {songs.length > 0 && (
            <p className="bt-sub bt-sub--center" style={{ margin: '16px 0 8px' }}>
              Add another. Each one gets its own spot in the bracket.
            </p>
          )}
          <SongPicker key={songs.length} disabled={busy} onPick={onAdd} />
        </>
      )}
    </div>
  );
}
