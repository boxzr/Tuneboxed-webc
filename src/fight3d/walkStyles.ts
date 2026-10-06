export type WalkStyle = 'swagger' | 'shadowbox' | 'hype' | 'stomp' | 'showboat';

export const WALK_STYLES: WalkStyle[] = ['swagger', 'shadowbox', 'hype', 'stomp', 'showboat'];

/** How the body moves on the ramp. Angles in radians, distances in metres. */
export interface Gait {
  /** Steps per second, times 2π. */
  cadence: number;
  /** Leg swing. */
  stride: number;
  /** Rise on each footfall. */
  bob: number;
  /** Side-to-side roll of the whole body. */
  roll: number;
  /** Shoulder counter-twist against the stride. */
  twist: number;
  /** Forward (+) or back (−) lean of the torso. */
  lean: number;
  /** Extra hop on every step. */
  hop: number;
}

export const GAIT: Record<WalkStyle, Gait> = {
  swagger: { cadence: 4.6, stride: 0.45, bob: 0.05, roll: 0.1, twist: 0.28, lean: -0.08, hop: 0 },
  shadowbox: { cadence: 7.4, stride: 0.38, bob: 0.03, roll: 0.04, twist: 0.12, lean: 0.08, hop: 0 },
  hype: { cadence: 6, stride: 0.5, bob: 0.03, roll: 0.05, twist: 0.14, lean: -0.04, hop: 0.09 },
  stomp: { cadence: 3.6, stride: 0.7, bob: 0.07, roll: 0.12, twist: 0.1, lean: 0.18, hop: 0 },
  showboat: { cadence: 5.4, stride: 0.5, bob: 0.04, roll: 0.14, twist: 0.1, lean: 0, hop: 0 },
};

/** Song progress where each part of the entrance starts. */
export const PLAN = {
  /** Dancing on stage under the titantron until here. */
  stageEnd: 0.2,
  /** Stops halfway down the aisle to dance for the crowd. */
  pauseStart: 0.48,
  pauseEnd: 0.6,
  /** Reaches the apron and dances again until the song ends. */
  arrive: 0.8,
} as const;

export interface WalkBeat {
  /** Dancing in place, or walking. */
  move: 'dance' | 'walk';
  /** Which dance: the signature on stage and at the apron, the encore mid-aisle. */
  dance: 'main' | 'encore';
  /** How far down the aisle, 0 at the stage and 1 at the apron. */
  along: number;
  /** Seconds-free progress through this part, 0..1. */
  part: number;
}

const ease = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

/** Where the fighter is and what they are doing at song progress `p` (0..1). */
export function walkPlan(p: number): WalkBeat {
  const { stageEnd, pauseStart, pauseEnd, arrive } = PLAN;
  if (p < stageEnd) return { move: 'dance', dance: 'main', along: 0, part: p / stageEnd };
  if (p < pauseStart) {
    const part = (p - stageEnd) / (pauseStart - stageEnd);
    return { move: 'walk', dance: 'main', along: ease(part) * 0.5, part };
  }
  if (p < pauseEnd) return { move: 'dance', dance: 'encore', along: 0.5, part: (p - pauseStart) / (pauseEnd - pauseStart) };
  if (p < arrive) {
    const part = (p - pauseEnd) / (arrive - pauseEnd);
    return { move: 'walk', dance: 'main', along: 0.5 + ease(part) * 0.5, part };
  }
  return { move: 'dance', dance: 'main', along: 1, part: Math.min(1, (p - arrive) / (1 - arrive)) };
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * One style per corner for this fight, never the same for both. Seeded so the
 * TV and every phone in the room show the same entrance.
 */
export function pickWalkStyles(seed: string): { a: WalkStyle; b: WalkStyle } {
  const h = hash(seed);
  const n = WALK_STYLES.length;
  const a = h % n;
  const b = (a + 1 + (Math.floor(h / n) % (n - 1))) % n;
  return { a: WALK_STYLES[a], b: WALK_STYLES[b] };
}
