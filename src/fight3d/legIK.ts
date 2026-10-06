/**
 * Two-bone leg solve, as plain numbers so it can be tested without a renderer.
 *
 * The rig nests hip (splay about z, then swing about x), knee (bend about x)
 * and ankle. Give it the hip and where the ankle should be, in the hip's
 * parent space, and it returns the three angles, knee always bending forward.
 */

/** Hip to knee, and knee to ankle, in rig units. */
export const THIGH = 0.17;
export const SHIN = 0.16;

export interface LegAngles {
  /** Outward lean of the whole leg, radians about z. */
  splay: number;
  /** Hip swing about x; negative brings the knee forward. */
  pitch: number;
  /** Knee bend about x; positive folds the shin back. */
  knee: number;
  /** False when the ankle was out of reach and the leg is straight toward it. */
  reached: boolean;
}

export function solveLeg(
  hip: readonly [number, number, number],
  ankle: readonly [number, number, number],
  out: LegAngles = { splay: 0, pitch: 0, knee: 0, reached: true }
): LegAngles {
  const vx = ankle[0] - hip[0];
  const vy = ankle[1] - hip[1];
  const vz = ankle[2] - hip[2];
  // Splay first, so the rest of the solve happens in the leg's own plane.
  out.splay = Math.atan2(vx, -vy);
  const down = Math.hypot(vx, vy);
  const full = THIGH + SHIN;
  const raw = Math.hypot(down, vz);
  const len = Math.min(Math.max(raw, Math.abs(THIGH - SHIN) + 0.02), full - 1e-4);
  out.reached = raw <= full;
  const toward = Math.atan2(vz, down);
  const atHip = Math.acos(clamp((THIGH * THIGH + len * len - SHIN * SHIN) / (2 * THIGH * len)));
  const atKnee = Math.acos(clamp((THIGH * THIGH + SHIN * SHIN - len * len) / (2 * THIGH * SHIN)));
  out.pitch = -(toward + atHip);
  out.knee = Math.PI - atKnee;
  return out;
}

const clamp = (c: number) => Math.min(1, Math.max(-1, c));

/** Where the ankle ends up for given angles: the forward solve, for tests and checks. */
export function ankleOf(
  hip: readonly [number, number, number],
  a: Pick<LegAngles, 'splay' | 'pitch' | 'knee'>
): [number, number, number] {
  // In the splayed plane: down is -y', forward is z. Pitch rotates about x.
  const kneeD = THIGH * Math.cos(a.pitch);
  const kneeF = -THIGH * Math.sin(a.pitch);
  const shinAng = a.pitch + a.knee;
  const ankleD = kneeD + SHIN * Math.cos(shinAng);
  const ankleF = kneeF - SHIN * Math.sin(shinAng);
  return [hip[0] + ankleD * Math.sin(a.splay), hip[1] - ankleD * Math.cos(a.splay), hip[2] + ankleF];
}
