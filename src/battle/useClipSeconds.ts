import { useCallback, useState } from 'react';
import { CLIP_SECONDS, CLIP_START_ENABLED, clampClipSeconds, clampClipStart } from './rules';

/**
 * The host's chosen clip length, remembered across rooms.
 *
 * Deliberately not a column on the room. The value is only ever read at the
 * moment a round starts playing, and it is written onto the round itself as
 * `seconds_per_song` at that point, which is what every other client already
 * reads to stay in sync. Keeping the host's preference in their own browser
 * therefore needs no migration and no extra round trip, and a viewer still
 * gets the length off the round like they always did.
 *
 * Returns the fixed clip when `enabled` is false, which is every format
 * except a bracket. The setter stays safe to call in that case; it just
 * stores a preference nothing is reading yet.
 */

const LENGTH_KEY = 'tb.clipSeconds';
const START_KEY = 'tb.clipStart';

function read(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : Number(raw);
  } catch {
    // Private browsing, or storage disabled. The default still plays.
    return fallback;
  }
}

function write(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Not worth failing a round over; the setting just will not persist.
  }
}

export interface ClipSettings {
  /** Seconds each song plays for. */
  seconds: number;
  /** Seconds into the preview that each clip begins. */
  start: number;
  setSeconds: (seconds: number) => void;
  setStart: (startSeconds: number) => void;
}

export function useClipSeconds(enabled: boolean): ClipSettings {
  const [seconds, setStoredSeconds] = useState(() =>
    clampClipSeconds(read(LENGTH_KEY, CLIP_SECONDS))
  );
  const [start, setStoredStart] = useState(() =>
    clampClipStart(read(START_KEY, 0), clampClipSeconds(read(LENGTH_KEY, CLIP_SECONDS)))
  );

  const setSeconds = useCallback((next: number) => {
    const length = clampClipSeconds(next);
    setStoredSeconds(length);
    write(LENGTH_KEY, length);
    // A longer clip has less room to start late, so dragging the length up
    // has to pull an out-of-range start down with it rather than leaving a
    // pair that would run off the end of the preview.
    setStoredStart((prev) => {
      const pulled = clampClipStart(prev, length);
      write(START_KEY, pulled);
      return pulled;
    });
  }, []);

  const setStart = useCallback(
    (next: number) => {
      const pulled = clampClipStart(next, seconds);
      setStoredStart(pulled);
      write(START_KEY, pulled);
    },
    [seconds]
  );

  return {
    seconds: enabled ? seconds : CLIP_SECONDS,
    // Held at zero until the migration is applied, so the host actions never
    // make a call that cannot land. See CLIP_START_ENABLED.
    start: enabled && CLIP_START_ENABLED ? start : 0,
    setSeconds,
    setStart,
  };
}
