import { useCallback, useEffect, useState } from 'react';
import { loudnessGain } from './loudness';
import { readNumber, readString, writeNumber, writeString } from './prefs';
import type { BattleSubmission } from '../types/battle';

/**
 * Everything about how the songs come out of this browser.
 *
 * None of it touches the room. Volume, levelling and the output device are
 * about one person's speakers, and a streamer's speakers are also their
 * stream, which is why they asked for all of it: a room that plays every song
 * at whatever level it was mastered at, out of whatever device the browser
 * picked, with no fader anywhere, is a room they cannot put on air.
 */

const VOLUME_KEY = 'tb.volume';
const LEVEL_KEY = 'tb.autoLevel';
const SINK_KEY = 'tb.sinkId';
const WHERE_KEY = 'tb.audioWhere';

/**
 * Which of the host's tabs plays the songs.
 *
 * A streamer captures the board at /tv, and the board never sounded: the
 * songs came out of the room tab, which is not the one going to the stream.
 * That was the "stream can't hear the songs" report. The host now chooses,
 * and the choice is shared through localStorage so the tab that is not
 * chosen goes quiet rather than the two playing half a second apart.
 */
export type AudioWhere = 'room' | 'board';

export interface AudioSettings {
  /** Master level, 0 to 1. */
  volume: number;
  setVolume: (v: number) => void;
  /** Bring every song to the same loudness. See loudness.ts. */
  autoLevel: boolean;
  setAutoLevel: (on: boolean) => void;
  /** Output device id for setSinkId, or '' for the browser default. */
  sinkId: string;
  setSinkId: (id: string) => void;
  where: AudioWhere;
  setWhere: (where: AudioWhere) => void;
  /** Host's manual nudge for one song, 0 to 2, on top of the auto level. */
  trimOf: (submissionId: string) => number;
  setTrim: (submissionId: string, trim: number) => void;
  /**
   * What to multiply the master volume by for this song: its measured
   * loudness correction, if on and known, times any manual trim.
   */
  gainFor: (submission: BattleSubmission | null) => number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function useAudioSettings(submissions: readonly BattleSubmission[]): AudioSettings {
  const [volume, setStoredVolume] = useState(() => clamp(readNumber(VOLUME_KEY, 0.8), 0, 1));
  const [autoLevel, setStoredLevel] = useState(() => readString(LEVEL_KEY, '1') !== '0');
  const [sinkId, setStoredSink] = useState(() => readString(SINK_KEY, ''));
  const [where, setStoredWhere] = useState<AudioWhere>(() =>
    readString(WHERE_KEY, 'room') === 'board' ? 'board' : 'room'
  );
  const [trims, setTrims] = useState<Record<string, number>>({});
  const [gains, setGains] = useState<Record<string, number>>({});

  const setVolume = useCallback((v: number) => {
    const next = clamp(v, 0, 1);
    setStoredVolume(next);
    writeNumber(VOLUME_KEY, next);
  }, []);

  const setAutoLevel = useCallback((on: boolean) => {
    setStoredLevel(on);
    writeString(LEVEL_KEY, on ? '1' : '0');
  }, []);

  const setSinkId = useCallback((id: string) => {
    setStoredSink(id);
    writeString(SINK_KEY, id);
  }, []);

  const setWhere = useCallback((next: AudioWhere) => {
    setStoredWhere(next);
    writeString(WHERE_KEY, next);
  }, []);

  // The other tab changed its mind about who plays. `storage` fires in every
  // tab but the one that wrote, which is exactly the set that needs to know.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WHERE_KEY) setStoredWhere(e.newValue === 'board' ? 'board' : 'room');
      if (e.key === VOLUME_KEY && e.newValue !== null) {
        setStoredVolume(clamp(Number(e.newValue) || 0, 0, 1));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Measure every preview as soon as the songs are known, which is during the
  // pick phase for most of them, so the gain is ready before the first note
  // rather than arriving a second into the song and stepping the volume.
  useEffect(() => {
    if (!autoLevel) return;
    let live = true;
    for (const s of submissions) {
      const url = s.preview_url;
      if (!url || gains[url] !== undefined) continue;
      void loudnessGain(url).then((g) => {
        if (live) setGains((prev) => (prev[url] === undefined ? { ...prev, [url]: g } : prev));
      });
    }
    return () => {
      live = false;
    };
    // `gains` is read but deliberately not a dependency: it changes as each
    // measurement lands, and re-running then would only find nothing to do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, autoLevel]);

  const trimOf = useCallback((id: string) => trims[id] ?? 1, [trims]);
  const setTrim = useCallback((id: string, trim: number) => {
    setTrims((prev) => ({ ...prev, [id]: clamp(trim, 0, 2) }));
  }, []);

  const gainFor = useCallback(
    (submission: BattleSubmission | null) => {
      if (!submission) return 1;
      const level = autoLevel && submission.preview_url ? gains[submission.preview_url] ?? 1 : 1;
      return level * (trims[submission.id] ?? 1);
    },
    [autoLevel, gains, trims]
  );

  return {
    volume,
    setVolume,
    autoLevel,
    setAutoLevel,
    sinkId,
    setSinkId,
    where,
    setWhere,
    trimOf,
    setTrim,
    gainFor,
  };
}
