/**
 * The numbers a battle runs on.
 *
 * Shared because the room and the board both drive rounds now, and a host
 * clicking from the board should get the same game as one clicking from the
 * room. When these lived in the room page the board could only watch.
 */

/** Seconds on the clock to pick a song. */
export const PICK_SECONDS = 45;

/** How long each song plays for. */
export const CLIP_SECONDS = 15;

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
