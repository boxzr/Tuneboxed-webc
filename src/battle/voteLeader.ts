/**
 * Who is winning a two-song vote, if anyone.
 *
 * A unique leader needs a strict majority. Zero votes and a tie both return
 * null, which is the signal for the AI judge to coin-flip rather than
 * inventing a winner from object-key order or "whoever voted first".
 */
export function uniqueLeader(counts: Record<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  let tied = false;

  for (const [id, n] of Object.entries(counts)) {
    if (n > bestCount) {
      best = id;
      bestCount = n;
      tied = false;
    } else if (n === bestCount && n > 0) {
      tied = true;
    }
  }

  if (bestCount === 0 || tied) return null;
  return best;
}
