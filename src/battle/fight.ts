/**
 * Turning a vote tally into a prizefight.
 *
 * A bracket matchup used to be two bars filling up, which is honest but reads
 * as a poll. The same numbers drive a fight here: whoever is ahead is landing
 * punches, and the margin is how much health the other song has left.
 *
 * Kept apart from the view because the feel of it is the whole feature. How
 * hard a single vote hits is a design decision, and it is worth being able to
 * state it as a number and test it.
 */

/**
 * Votes needed before the bars mean anything.
 *
 * Damage is scaled by how much of this quorum has turned out, so the first
 * vote in a room still visibly rocks somebody without emptying their bar. A
 * shutout only reads as a knockout once this many people have actually voted,
 * which is what stops 1-0 from ending a fight.
 */
export const KO_QUORUM = 5;

export interface FightScore {
  /** Health remaining, 0 to 100. */
  healthA: number;
  healthB: number;
  /** Null while the fight is level, including before anyone votes. */
  leader: 'a' | 'b' | null;
  /** True when one side has been shut out by a voting room. */
  knockout: boolean;
}

/**
 * How the fight stands.
 *
 * Health comes off the *share* of the vote rather than the raw gap, so a
 * hundred-vote Twitch chat and a four-person living room both produce a fight
 * that swings, instead of the big room flatlining one bar immediately.
 */
export function fightScore(votesA: number, votesB: number): FightScore {
  const a = Math.max(0, votesA);
  const b = Math.max(0, votesB);
  const total = a + b;

  if (total === 0) {
    return { healthA: 100, healthB: 100, leader: null, knockout: false };
  }

  const lead = (a - b) / total;
  const confidence = Math.min(1, total / KO_QUORUM);
  const swing = lead * confidence;

  const healthA = Math.round(100 * (1 - Math.max(0, -swing)));
  const healthB = Math.round(100 * (1 - Math.max(0, swing)));

  return {
    healthA,
    healthB,
    leader: lead > 0 ? 'a' : lead < 0 ? 'b' : null,
    // Only a genuine shutout past quorum empties a bar, so this cannot fire
    // off the back of a single early vote.
    knockout: healthA === 0 || healthB === 0,
  };
}

/** What the announcer calls it. */
export function fightVerdict(score: FightScore): 'Knockout' | 'Wins by decision' {
  return score.knockout ? 'Knockout' : 'Wins by decision';
}
