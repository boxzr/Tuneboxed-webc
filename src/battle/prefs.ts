/**
 * Host preferences that live in the browser rather than on the room.
 *
 * Clip length, pick clock, volume: each is only ever read at the moment it
 * is applied, and the ones other clients need to agree on get written onto
 * the round at that point (as `seconds_per_song` or a deadline). Keeping the
 * preference itself local therefore needs no migration and no round trip,
 * and it survives from one room to the next, which is what a streamer who
 * hosts every week actually wants.
 *
 * Every helper here fails quietly. Private browsing and disabled storage
 * both throw on write, and a setting that will not persist is not worth
 * failing a round over.
 */

export function readNumber(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function writeNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // The setting just will not persist.
  }
}

export function readString(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // See writeNumber.
  }
}
