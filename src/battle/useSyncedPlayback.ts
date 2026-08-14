import { useEffect, useMemo, useRef, useState } from 'react';
import { serverTime } from './clock';
import type { BattleRound, BattleSubmission } from '../types/battle';

interface Playback {
  /** The submission that should be sounding right now, if any. */
  current: BattleSubmission | null;
  index: number;
  total: number;
  /** How far into the current song we are, in seconds. */
  offset: number;
  finished: boolean;
  /** True when the browser refused to autoplay and needs a tap. */
  blocked: boolean;
  unblock: () => void;
}

/**
 * Plays the round's songs in the server's order, at the server's start time.
 *
 * The room does not broadcast audio. Each client derives its own position
 * from `playback_started_at` and `seconds_per_song`, so a viewer joining
 * thirty seconds late drops straight into the middle of the right song
 * rather than starting the set over.
 */
export function useSyncedPlayback(
  round: BattleRound | null,
  submissions: BattleSubmission[],
  enabled: boolean
): Playback {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tick, setTick] = useState(0);
  const [blocked, setBlocked] = useState(false);

  // Keeps the derived position moving between realtime updates.
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [enabled]);

  const order = useMemo(() => {
    if (!round) return [];
    // Fall back to submission order if the server has not stamped one, so a
    // missing playback_order degrades to "play them all" rather than silence.
    if (round.playback_order?.length) return round.playback_order;
    return submissions.map((s) => s.id);
  }, [round, submissions]);

  const perSong = round?.seconds_per_song ?? 30;
  const startedAt = round?.playback_started_at ? new Date(round.playback_started_at).getTime() : null;

  const elapsed = startedAt !== null ? (serverTime() - startedAt) / 1000 : 0;
  const rawIndex = startedAt !== null ? Math.floor(elapsed / perSong) : -1;
  const finished = rawIndex >= order.length;
  const index = finished ? order.length - 1 : rawIndex;
  const offset = startedAt !== null ? elapsed - index * perSong : 0;

  const current = useMemo(() => {
    if (index < 0 || finished) return null;
    const id = order[index];
    return submissions.find((s) => s.id === id) ?? null;
  }, [index, finished, order, submissions]);

  // Drive the audio element toward wherever the clock says we should be.
  useEffect(() => {
    if (!enabled || !current?.preview_url || finished) {
      audioRef.current?.pause();
      return;
    }

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;
    }

    const src = current.preview_url;
    const needsSwap = audio.src !== src;

    if (needsSwap) {
      audio.src = src;
      audio.currentTime = Math.max(0, offset);
      audio.play().then(
        () => setBlocked(false),
        // Browsers block autoplay until the user has interacted with the
        // page. Surfacing it lets the UI ask for one tap instead of playing
        // nothing and looking broken.
        () => setBlocked(true)
      );
      return;
    }

    // Nudge back into sync if we have drifted more than a second, which
    // happens after a tab is backgrounded.
    if (Math.abs(audio.currentTime - offset) > 1) {
      audio.currentTime = Math.max(0, offset);
    }
    if (audio.paused) {
      audio.play().then(
        () => setBlocked(false),
        () => setBlocked(true)
      );
    }
    // `tick` is what re-runs this; the drift check needs a fresh `offset`.
  }, [enabled, current, offset, finished, tick]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const unblock = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(
      () => setBlocked(false),
      () => setBlocked(true)
    );
  };

  return {
    current,
    index: Math.max(0, index),
    total: order.length,
    offset,
    finished,
    blocked,
    unblock,
  };
}
