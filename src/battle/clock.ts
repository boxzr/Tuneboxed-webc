import { serverNow } from '../lib/battleClient';

// Every countdown and playback position is measured against the database
// clock rather than the device's, because a phone or laptop with a wrong
// clock would otherwise land on the wrong song mid-battle.
let offsetMs = 0;
let synced = false;

export async function syncClock(): Promise<void> {
  const sentAt = Date.now();
  try {
    const iso = await serverNow();
    const rtt = Date.now() - sentAt;
    // Assume the request and response legs are roughly symmetric and credit
    // half the round trip to the reading.
    offsetMs = new Date(iso).getTime() + rtt / 2 - Date.now();
    synced = true;
  } catch {
    // An unsynced clock is still usable; it just falls back to local time.
    offsetMs = 0;
  }
}

export const isSynced = () => synced;

/** Current server time in milliseconds. */
export const serverTime = () => Date.now() + offsetMs;

/** Seconds left until an ISO deadline, floored at zero. */
export function secondsUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - serverTime()) / 1000));
}
