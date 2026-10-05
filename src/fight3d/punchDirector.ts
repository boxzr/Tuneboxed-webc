/**
 * Votes arrive as running tallies. This turns a delta into a punch the ring
 * can play, and fills a HEAT meter toward a flurry.
 *
 * Kept free of Three.js so the mapping can be tested as numbers.
 */

export const HEAT_MAX = 6;

export type Side = 'a' | 'b';
export type PunchKind = 'jab' | 'cross' | 'hook' | 'body' | 'uppercut' | 'flurry' | 'combo';
export type BoxerPose = 'idle' | PunchKind | 'hurt' | 'down' | 'won' | 'lost' | 'walk' | 'taunt';

export interface DirectorState {
  votesA: number;
  votesB: number;
  heatA: number;
  heatB: number;
  /** Punches thrown per corner, so consecutive votes walk through a combo. */
  comboA?: number;
  comboB?: number;
  /** Votes in a row for one corner with none for the other. Every third one is a combo. */
  streakA?: number;
  streakB?: number;
  /** Raw votes in the current run, before the small-chat boost. */
  runA?: number;
  runB?: number;
  /** Recent vote arrivals as [ms, count], for reading how busy chat is. */
  recent?: [number, number][];
  /** What each vote is worth right now. */
  boost?: number;
}

export interface PunchEvent {
  side: Side;
  kind: PunchKind;
  /** Punches in the string, for a combo. */
  hits?: number;
  /** The chat streak that earned it, in boosted votes. */
  streak?: number;
  /** Actual votes in the run. */
  run?: number;
  /** What each vote was worth. */
  boost?: number;
}

/** How far back we look to size up the chat. */
export const CHAT_WINDOW_MS = 15000;

/**
 * A quiet chat can't out-vote a busy one, so each of its votes hits harder:
 * with a handful of people typing, one vote is a full combo.
 */
export function voteBoost(recentVotes: number): number {
  if (recentVotes <= 5) return 3;
  if (recentVotes <= 12) return 2;
  return 1;
}

/** Streak needed for a combo, and the bigger tiers after it. */
export const COMBO_EVERY = 3;

export function comboTier(streak: number): { hits: number; label: string; heat: number } {
  if (streak >= 9) return { hits: 5, label: 'MEGA COMBO', heat: HEAT_MAX };
  if (streak >= 6) return { hits: 4, label: 'HUGE COMBO', heat: 4 };
  return { hits: 3, label: 'COMBO', heat: 3 };
}

export function emptyDirector(): DirectorState {
  return { votesA: 0, votesB: 0, heatA: 0, heatB: 0, comboA: 0, comboB: 0, streakA: 0, streakB: 0 };
}

/** One vote at a time reads as a boxer working a combination, not one punch on repeat. */
const LIGHT: PunchKind[] = ['jab', 'cross', 'jab', 'hook', 'body', 'cross'];
const MID: PunchKind[] = ['hook', 'cross', 'body', 'uppercut'];
const POWER: PunchKind[] = ['uppercut', 'hook', 'body'];

export function kindForBurst(gained: number, heat: number, combo = 0): PunchKind {
  if (heat >= HEAT_MAX) return 'flurry';
  if (gained >= 10) return 'flurry';
  if (gained >= 4) return POWER[combo % POWER.length];
  if (gained >= 2) return MID[combo % MID.length];
  return LIGHT[combo % LIGHT.length];
}

function heatGain(kind: PunchKind): number {
  if (kind === 'flurry') return 0;
  if (kind === 'uppercut') return 3;
  if (kind === 'hook' || kind === 'body') return 2;
  return 1;
}

/**
 * `now` (ms) turns on the small-chat boost; without it every vote is worth one.
 */
export function tickDirector(
  prev: DirectorState,
  votesA: number,
  votesB: number,
  now?: number
): {
  state: DirectorState;
  event: PunchEvent | null;
} {
  const a = Math.max(0, votesA);
  const b = Math.max(0, votesB);
  const rawA = Math.max(0, a - prev.votesA);
  const rawB = Math.max(0, b - prev.votesB);

  let recent = prev.recent ?? [];
  let boost = 1;
  if (now !== undefined) {
    recent = recent.filter(([at]) => now - at < CHAT_WINDOW_MS);
    if (rawA + rawB > 0) recent = [...recent, [now, rawA + rawB]];
    boost = voteBoost(recent.reduce((n, [, v]) => n + v, 0));
  }
  const gainedA = rawA * boost;
  const gainedB = rawB * boost;

  let heatA = prev.heatA;
  let heatB = prev.heatB;
  let comboA = prev.comboA ?? 0;
  let comboB = prev.comboB ?? 0;
  let streakA = prev.streakA ?? 0;
  let streakB = prev.streakB ?? 0;
  let runA = prev.runA ?? 0;
  let runB = prev.runB ?? 0;
  let event: PunchEvent | null = null;
  const settle = (): DirectorState => ({
    votesA: a,
    votesB: b,
    heatA,
    heatB,
    comboA,
    comboB,
    streakA,
    streakB,
    runA,
    runB,
    recent,
    boost,
  });

  if (gainedA > 0 || gainedB > 0) {
    const side: Side = gainedA >= gainedB ? 'a' : 'b';
    const gained = side === 'a' ? gainedA : gainedB;
    const heat = side === 'a' ? heatA : heatB;
    const before = side === 'a' ? streakA : streakB;
    // Votes landing for the other corner in the same tick break the run.
    const clean = (side === 'a' ? gainedB : gainedA) === 0;
    const streak = clean ? before + gained : gained;
    const raw = side === 'a' ? rawA : rawB;
    const run = clean ? (side === 'a' ? runA : runB) + raw : raw;
    if (side === 'a') {
      streakA = streak;
      streakB = 0;
      runA = run;
      runB = 0;
    } else {
      streakB = streak;
      streakA = 0;
      runB = run;
      runA = 0;
    }
    const earned = Math.floor(streak / COMBO_EVERY) > Math.floor((clean ? before : 0) / COMBO_EVERY);

    if (earned && heat < HEAT_MAX) {
      const tier = comboTier(streak);
      event = { side, kind: 'combo', hits: tier.hits, streak, run, boost };
      if (side === 'a') heatA = Math.min(HEAT_MAX, heatA + tier.heat);
      else heatB = Math.min(HEAT_MAX, heatB + tier.heat);
      return { state: settle(), event };
    }

    const kind = kindForBurst(gained, heat, side === 'a' ? comboA : comboB);
    if (side === 'a') comboA += 1;
    else comboB += 1;

    event = { side, kind, streak, run, boost };

    if (kind === 'flurry') {
      if (side === 'a') heatA = 0;
      else heatB = 0;
    } else if (side === 'a') {
      heatA = Math.min(HEAT_MAX, heatA + heatGain(kind));
    } else {
      heatB = Math.min(HEAT_MAX, heatB + heatGain(kind));
    }
  }

  return { state: settle(), event };
}

export function posesFor(
  event: PunchEvent | null,
  winner: Side | null,
  knockout: boolean
): { a: BoxerPose; b: BoxerPose } {
  if (winner) {
    return {
      a: winner === 'a' ? 'won' : knockout ? 'down' : 'lost',
      b: winner === 'b' ? 'won' : knockout ? 'down' : 'lost',
    };
  }
  if (!event) return { a: 'idle', b: 'idle' };
  return {
    a: event.side === 'a' ? event.kind : 'hurt',
    b: event.side === 'b' ? event.kind : 'hurt',
  };
}

/** Hold through the cartoon beat, not just the contact frame. */
export const PUNCH_HOLD_MS: Record<PunchKind, number> = {
  jab: 560,
  cross: 600,
  hook: 700,
  body: 680,
  combo: 1300,
  uppercut: 760,
  flurry: 1200,
};
