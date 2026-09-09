import { useCallback, useState } from 'react';
import { readNumber, writeNumber } from './prefs';
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
 * This used to apply to brackets only, with every other format pinned to a
 * fixed fifteen seconds. Streamers running party rooms asked for the same
 * control, and there was never a reason to withhold it: the round carries
 * the length either way.
 */

const LENGTH_KEY = 'tb.clipSeconds.v2';
const START_KEY = 'tb.clipStart';

export interface ClipSettings {
  /** Seconds each song plays for. */
  seconds: number;
  /** Seconds into the preview that each clip begins. */
  start: number;
  setSeconds: (seconds: number) => void;
  setStart: (startSeconds: number) => void;
}

export function useClipSeconds(): ClipSettings {
  const [seconds, setStoredSeconds] = useState(() =>
    clampClipSeconds(readNumber(LENGTH_KEY, CLIP_SECONDS))
  );
  const [start, setStoredStart] = useState(() =>
    clampClipStart(readNumber(START_KEY, 0), clampClipSeconds(readNumber(LENGTH_KEY, CLIP_SECONDS)))
  );

  const setSeconds = useCallback((next: number) => {
    const length = clampClipSeconds(next);
    setStoredSeconds(length);
    writeNumber(LENGTH_KEY, length);
    // A longer clip has less room to start late, so dragging the length up
    // has to pull an out-of-range start down with it rather than leaving a
    // pair that would run off the end of the preview.
    setStoredStart((prev) => {
      const pulled = clampClipStart(prev, length);
      writeNumber(START_KEY, pulled);
      return pulled;
    });
  }, []);

  const setStart = useCallback(
    (next: number) => {
      const pulled = clampClipStart(next, seconds);
      setStoredStart(pulled);
      writeNumber(START_KEY, pulled);
    },
    [seconds]
  );

  return {
    seconds,
    // Held at zero until the migration is applied, so the host actions never
    // make a call that cannot land. See CLIP_START_ENABLED.
    start: CLIP_START_ENABLED ? start : 0,
    setSeconds,
    setStart,
  };
}
