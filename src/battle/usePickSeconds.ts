import { useCallback, useState } from 'react';
import { readNumber, writeNumber } from './prefs';
import { PICK_SECONDS, clampPickSeconds } from './rules';

/**
 * How long the host gives everyone to pick a song, remembered across rooms.
 *
 * Applied when a round opens: the value goes to the server as the pick
 * deadline, so every client reads the same clock off the round itself and
 * only the host's browser needs to know the preference. Zero means no clock,
 * in which case the host starts the songs by hand once everyone is in.
 *
 * Classic rooms ignore this entirely. Their songs are locked in the lobby
 * before anything starts, so there is no pick phase to time.
 */

const KEY = 'tb.pickSeconds.v2';

export interface PickSettings {
  /** Seconds on the pick clock, or zero for no clock. */
  seconds: number;
  setSeconds: (seconds: number) => void;
}

export function usePickSeconds(): PickSettings {
  const [seconds, setStored] = useState(() => clampPickSeconds(readNumber(KEY, PICK_SECONDS)));

  const setSeconds = useCallback((next: number) => {
    const clamped = clampPickSeconds(next);
    setStored(clamped);
    writeNumber(KEY, clamped);
  }, []);

  return { seconds, setSeconds };
}
