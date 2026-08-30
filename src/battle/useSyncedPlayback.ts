import { useEffect, useMemo, useRef, useState } from 'react';
import { serverTime } from './clock';
import { CLIP_SECONDS, clipIndex, clipsFinished } from './rules';
import type { BattleRound, BattleSubmission } from '../types/battle';

interface Playback {
  /** The submission that should be sounding right now, if any. */
  current: BattleSubmission | null;
  index: number;
  total: number;
  /** How far into the current song we are, in seconds. */
  offset: number;
  /**
   * Seconds until the next song takes over, or null once this is the last one.
   * Drives the shared countdown, which is what keeps a room of embedded
   * players changing track together despite their uneven load times.
   */
  secondsUntilNext: number | null;
  /** Clip length the room agreed on, so the UI can draw progress through it. */
  perSong: number;
  finished: boolean;
  /** True when the browser refused to autoplay and needs a tap. */
  blocked: boolean;
  unblock: () => void;
  /** True when the current pick is a music video and needs the screen. */
  needsScreen: boolean;
}

/**
 * Plays the round's songs in the server's order, at the server's start time.
 *
 * The room does not broadcast audio. Each client derives its own position
 * from `playback_started_at` and `seconds_per_song`, so a viewer joining
 * thirty seconds late drops straight into the middle of the right song
 * rather than starting the set over.
 *
 * Music video picks are the same clip with a picture attached, so they run on
 * the same clock through a `<video>` the page hands in. Everything else plays
 * through an audio element the hook owns.
 */
export function useSyncedPlayback(
  round: BattleRound | null,
  submissions: BattleSubmission[],
  enabled: boolean,
  videoEl?: HTMLVideoElement | null
): Playback {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<HTMLMediaElement | null>(null);
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

  const perSong = round?.seconds_per_song ?? CLIP_SECONDS;
  const startedAt = round?.playback_started_at ? new Date(round.playback_started_at).getTime() : null;

  const elapsed = startedAt !== null ? (serverTime() - startedAt) / 1000 : 0;
  const finished = startedAt !== null && clipsFinished(elapsed, order.length, perSong);
  const index = startedAt !== null ? clipIndex(elapsed, order.length, perSong) : -1;
  const offset = startedAt !== null ? elapsed - Math.max(0, index) * perSong : 0;

  const current = useMemo(() => {
    if (index < 0 || finished) return null;
    const id = order[index];
    return submissions.find((s) => s.id === id) ?? null;
  }, [index, finished, order, submissions]);

  const secondsUntilNext =
    startedAt === null || finished || index < 0 || index >= order.length - 1
      ? null
      : Math.max(0, perSong - offset);

  const needsScreen = current?.source === 'itunes-video';

  // Drive the playing element toward wherever the clock says we should be.
  // A submission with no preview URL is an embed, which plays in the provider's
  // own iframe instead; falling through here leaves everything paused.
  useEffect(() => {
    if (!enabled || !current?.preview_url || finished) {
      audioRef.current?.pause();
      videoEl?.pause();
      activeRef.current = null;
      return;
    }

    let media: HTMLMediaElement | null;
    if (needsScreen) {
      audioRef.current?.pause();
      // The page mounts the video only once it knows a video is up, so the
      // first pass through here can land before it exists.
      media = videoEl ?? null;
    } else {
      videoEl?.pause();
      if (!audioRef.current) {
        const audio = new Audio();
        audio.preload = 'auto';
        audioRef.current = audio;
      }
      media = audioRef.current;
    }

    if (!media) return;
    activeRef.current = media;

    const src = current.preview_url;

    if (media.src !== src) {
      media.src = src;
      media.currentTime = Math.max(0, offset);
      media.play().then(
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
    if (Math.abs(media.currentTime - offset) > 1) {
      media.currentTime = Math.max(0, offset);
    }
    if (media.paused) {
      media.play().then(
        () => setBlocked(false),
        () => setBlocked(true)
      );
    }
    // `tick` is what re-runs this; the drift check needs a fresh `offset`.
  }, [enabled, current, offset, finished, tick, needsScreen, videoEl]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const unblock = () => {
    const media = activeRef.current;
    if (!media) return;
    media.play().then(
      () => setBlocked(false),
      () => setBlocked(true)
    );
  };

  return {
    current,
    index: Math.max(0, index),
    total: order.length,
    offset,
    secondsUntilNext,
    perSong,
    finished,
    blocked,
    unblock,
    needsScreen: Boolean(needsScreen),
  };
}
