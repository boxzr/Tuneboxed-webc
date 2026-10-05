import type { BodyType } from './loadout';

export type MotionPunch = 'jab' | 'cross' | 'hook' | 'body' | 'uppercut' | 'flurry';
export type PunchPhaseName = 'wind' | 'snap' | 'hold' | 'rec' | 'done';

export interface PunchPhase {
  wind: number;
  snap: number;
  hold: number;
  rec: number;
}

/**
 * 3D boxing beat, in the Ready 2 Rumble PlayStation sense: a readable
 * wind-up, an extension that stays on the chin, then a step back to guard.
 * Not a 2D snap-arcade cycle.
 */
export function punchPhases(kind: MotionPunch): PunchPhase {
  if (kind === 'jab') return { wind: 0.1, snap: 0.12, hold: 0.1, rec: 0.22 };
  if (kind === 'cross') return { wind: 0.12, snap: 0.12, hold: 0.1, rec: 0.24 };
  if (kind === 'hook') return { wind: 0.14, snap: 0.14, hold: 0.12, rec: 0.28 };
  if (kind === 'body') return { wind: 0.13, snap: 0.13, hold: 0.12, rec: 0.26 };
  if (kind === 'uppercut') return { wind: 0.16, snap: 0.14, hold: 0.14, rec: 0.28 };
  return { wind: 0.08, snap: 0.08, hold: 0.85, rec: 0.18 };
}

/** Seconds into a punch when the glove meets the other boxer. */
export function contactAt(kind: MotionPunch): number {
  const p = punchPhases(kind);
  return p.wind + p.snap;
}

/** Hands alternate, so a combo reads as a combination rather than one arm pumping. */
export const COMBO_SEQ: MotionPunch[] = ['jab', 'cross', 'uppercut', 'hook', 'body'];
/** Seconds each punch of a combo gets. */
export const COMBO_SEG = 0.3;
/** Each punch in a combo plays its normal clip this much faster. */
const COMBO_RATE = 1.8;

/** Which punch of an `hits`-long combo is playing, and how far into its own clip. */
export function comboMove(age: number, hits: number): { kind: MotionPunch; age: number; index: number } | null {
  const index = Math.floor(age / COMBO_SEG);
  if (index >= hits) return null;
  const kind = COMBO_SEQ[index % COMBO_SEQ.length];
  return { kind, age: (age - index * COMBO_SEG) * COMBO_RATE, index };
}

/** Seconds after the combo starts when each glove lands. */
export function comboContacts(hits: number): { at: number; kind: MotionPunch }[] {
  return Array.from({ length: hits }, (_, i) => {
    const kind = COMBO_SEQ[i % COMBO_SEQ.length];
    return { at: i * COMBO_SEG + contactAt(kind) / COMBO_RATE, kind };
  });
}

export function comboDuration(hits: number): number {
  return hits * COMBO_SEG + 0.25;
}

export function punchDuration(kind: MotionPunch): number {
  const p = punchPhases(kind);
  return p.wind + p.snap + p.hold + p.rec;
}

function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export function punchPhaseAt(age: number, kind: MotionPunch): PunchPhaseName {
  const p = punchPhases(kind);
  if (age < p.wind) return 'wind';
  if (kind === 'flurry') {
    if (age < p.wind + p.snap + p.hold) return 'hold';
    if (age < punchDuration(kind)) return 'rec';
    return 'done';
  }
  if (age < p.wind + p.snap) return 'snap';
  if (age < p.wind + p.snap + p.hold) return 'hold';
  if (age < punchDuration(kind)) return 'rec';
  return 'done';
}

/**
 * Signed extension of a punch.
 *
 * Negative is the load-up (fist pulled back). 1 is glove on the other
 * boxer's chin. 0 is back in the peek-a-boo.
 */
export function punchOut(age: number, kind: MotionPunch): number {
  const p = punchPhases(kind);
  if (kind === 'flurry') {
    return 0.72 + Math.sin(age * 26) * 0.34;
  }
  if (age < p.wind) return -0.38 * (age / p.wind);
  const after = age - p.wind;
  if (after < p.snap) return -0.38 + 1.38 * easeOutCubic(after / p.snap);
  const afterHold = after - p.snap;
  if (afterHold < p.hold) return 1;
  const rec = (afterHold - p.hold) / p.rec;
  if (rec >= 1) return 0;
  return 1 - rec * rec;
}

/**
 * Close the gap on the punch, then ease back to range.
 * Distance is tuned so a fully extended glove meets the other chin.
 */
export function stepIn(age: number, kind: MotionPunch): number {
  const p = punchPhases(kind);
  if (kind === 'flurry') return 0.3 + Math.sin(age * 14) * 0.04;
  if (age < p.wind) return -0.08 * (age / p.wind);
  const after = age - p.wind;
  if (after < p.snap) return -0.08 + 0.4 * easeOutCubic(after / p.snap);
  const afterHold = after - p.snap;
  if (afterHold < p.hold) return 0.32;
  const rec = (afterHold - p.hold) / p.rec;
  if (rec >= 1) return 0;
  return 0.32 * (1 - rec * rec);
}

/**
 * What the other corner does when that punch lands.
 *
 * Jabs snap the head. Hooks twist the body. Uppercuts lift.
 * A flurry makes them cover up and eat it.
 */
export function hitReaction(kind: MotionPunch): {
  knock: number;
  lift: number;
  twist: number;
  cover: number;
  head: number;
} {
  if (kind === 'jab') return { knock: 0.48, lift: 0.06, twist: 0.14, cover: 0, head: 0.62 };
  if (kind === 'cross') return { knock: 0.66, lift: 0.08, twist: 0.28, cover: 0, head: 0.75 };
  if (kind === 'hook') return { knock: 0.78, lift: 0.12, twist: 0.7, cover: 0, head: 0.45 };
  if (kind === 'body') return { knock: 0.42, lift: 0, twist: 0.32, cover: 0.4, head: 0.1 };
  if (kind === 'uppercut') return { knock: 0.32, lift: 1.05, twist: 0.1, cover: 0, head: 0.85 };
  return { knock: 0.62, lift: 0.18, twist: 0.22, cover: 1, head: 0.35 };
}

export function weightOf(body: BodyType): {
  speed: number;
  bounce: number;
  knock: number;
  lunge: number;
} {
  if (body === 'heavy') return { speed: 0.86, bounce: 0.78, knock: 0.72, lunge: 1.12 };
  if (body === 'light') return { speed: 1.16, bounce: 1.18, knock: 1.22, lunge: 0.9 };
  return { speed: 1, bounce: 1, knock: 1, lunge: 1 };
}

function bounceOut(t: number): number {
  let x = Math.min(1, Math.max(0, t));
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) {
    x -= 1.5 / d1;
    return n1 * x * x + 0.75;
  }
  if (x < 2.5 / d1) {
    x -= 2.25 / d1;
    return n1 * x * x + 0.9375;
  }
  x -= 2.625 / d1;
  return n1 * x * x + 0.984375;
}

/** Canvas bounce after a knockdown — they hit, pop, settle. */
export function knockdownY(age: number): number {
  const fall = Math.min(1, age / 0.62);
  return 0.7 * (1 - bounceOut(fall));
}

export function idleMotion(t: number, bounce: number): { y: number; x: number; weave: number } {
  return {
    y: Math.sin(t * 6.1) * 0.042 * bounce,
    x: Math.sin(t * 2.05) * 0.04,
    weave: Math.sin(t * 2.05) * 0.12 + Math.sin(t * 4.1) * 0.04,
  };
}
