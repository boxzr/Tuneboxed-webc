import type { BattleSubmission } from '../types/battle';

export type EmbedSource = 'soundcloud' | 'youtube';

/**
 * Which embedded player a submission needs, or null when it is a plain audio
 * preview. Keyed off `source` rather than the absence of a preview URL, so a
 * pick that simply failed to resolve does not silently mount a player with
 * nothing to play.
 */
export function embedSourceOf(submission: BattleSubmission | null | undefined): EmbedSource | null {
  if (!submission?.external_id) return null;
  if (submission.source === 'soundcloud') return 'soundcloud';
  if (submission.source === 'youtube') return 'youtube';
  return null;
}

/** Where in the full track the host wants this pick to start, in seconds. */
export function embedStart(submission: BattleSubmission | null | undefined): number {
  return Math.max(0, submission?.start_seconds ?? 0);
}

/** 83 → "1:23". */
export function clockLabel(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
