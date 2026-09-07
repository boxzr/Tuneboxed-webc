/**
 * The numbers a battle runs on.
 *
 * Shared because the room and the board both drive rounds now, and a host
 * clicking from the board should get the same game as one clicking from the
 * room. When these lived in the room page the board could only watch.
 */

/** Seconds on the clock to pick a song. */
export const PICK_SECONDS = 45;

/** How long each song plays for, unless the host has changed it. */
export const CLIP_SECONDS = 15;

/**
 * Everything a pick gives us to play.
 *
 * iTunes hands back a thirty second preview, and that is the whole file: an
 * itunes-assets URL for "Ms. Jackson" measures 30.02 seconds. It is the only
 * source that plays as plain audio in every browser, which is why the room
 * uses it, so thirty seconds is a hard ceiling rather than a guess. Asking
 * for a longer clip than this buys silence, not more song.
 */
export const PREVIEW_SECONDS = 30;

/**
 * Whether the host can move where in the preview a clip starts.
 *
 * The offset has to travel on the round for every listener to seek to the
 * same place, which needs the column and function in the iOS repo's
 * supabase/migrations/add_battle_clip_start.sql. Until that is applied the
 * write is a no-op, and a slider reporting that it skips the first ten
 * seconds while every clip still plays from the top is worse than no slider.
 * Flip this to true once the migration has run.
 */
export const CLIP_START_ENABLED = false;

/**
 * The range a host can drag the clip length across.
 *
 * Streamers running a bracket asked for this. Fifteen seconds is right for a
 * party round where the room wants to move, but a head-to-head where two
 * songs are judged against each other needs longer to sit with them. Only a
 * bracket offers the slider; see useClipSeconds.ts.
 */
export const CLIP_MIN = 10;
export const CLIP_MAX = PREVIEW_SECONDS;
export const CLIP_STEP = 5;

/** Snapped to the slider's own steps, so a stale stored value cannot drift. */
export function clampClipSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return CLIP_SECONDS;
  const snapped = Math.round(seconds / CLIP_STEP) * CLIP_STEP;
  return Math.min(CLIP_MAX, Math.max(CLIP_MIN, snapped));
}

/**
 * How far into the preview the host can start a clip of this length.
 *
 * A clip has to finish inside the preview, so the two settings are coupled:
 * asking for the full thirty seconds pins the start at the beginning, and a
 * shorter clip is what buys room to move it. Dragging the length up
 * therefore has to pull an out-of-range start back down with it.
 */
export function maxClipStart(clipSeconds: number): number {
  const room = PREVIEW_SECONDS - clampClipSeconds(clipSeconds);
  return Math.max(0, Math.floor(room / CLIP_STEP) * CLIP_STEP);
}

/** Snapped to the steps, and never past where this clip length can start. */
export function clampClipStart(startSeconds: number, clipSeconds: number): number {
  if (!Number.isFinite(startSeconds)) return 0;
  const snapped = Math.round(startSeconds / CLIP_STEP) * CLIP_STEP;
  return Math.min(maxClipStart(clipSeconds), Math.max(0, snapped));
}

/** Reads as prose, so copy can say "songs play for a full minute". */
export function clipLabel(seconds: number): string {
  return seconds >= 60 ? 'a full minute' : `${seconds} seconds`;
}

/**
 * Which clip the room should be on, given how long playback has been running.
 *
 * The last index is still returned after the set finishes, so the UI can hold
 * the final song rather than going blank while the host advances.
 */
export function clipIndex(elapsedSeconds: number, total: number, perSong = CLIP_SECONDS): number {
  if (total <= 0) return 0;
  const raw = Math.floor(elapsedSeconds / perSong);
  return raw >= total ? total - 1 : Math.max(0, raw);
}

/** True once every clip has had its full window. */
export function clipsFinished(elapsedSeconds: number, total: number, perSong = CLIP_SECONDS): boolean {
  return total > 0 && elapsedSeconds >= total * perSong;
}

/** A party battle is this many rounds; most crowns wins. */
export const PARTY_ROUNDS = 3;

/** Seconds to vote once the songs have played. */
export const VOTE_SECONDS = 60;
