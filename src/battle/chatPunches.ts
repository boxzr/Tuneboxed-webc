/** Fastest one login can throw punches. Stops a scripted flood locking the ring. */
export const PUNCH_CAP = 8;
export const PUNCH_WINDOW_MS = 1000;

export function addPunch(counts: Record<string, number>, submissionId: string): Record<string, number> {
  return { ...counts, [submissionId]: (counts[submissionId] ?? 0) + 1 };
}

export function mergePunches(
  local: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const next = { ...local };
  for (const [id, n] of Object.entries(incoming)) {
    const v = Number(n) || 0;
    if (v > (next[id] ?? 0)) next[id] = v;
  }
  return next;
}

export function punchesAllowed(
  recent: number[],
  now: number,
  cap = PUNCH_CAP,
  windowMs = PUNCH_WINDOW_MS
): { ok: boolean; recent: number[] } {
  const kept = recent.filter((t) => now - t < windowMs);
  if (kept.length >= cap) return { ok: false, recent: kept };
  return { ok: true, recent: [...kept, now] };
}
