/**
 * Walkout dances, choreographed as plain numbers so they can be tested
 * without a renderer.
 *
 * Each one follows the counts the dance is actually taught on: the steps,
 * the arm shapes and where the weight goes. Every move is keyed to one tempo,
 * so two dancers in the same arena hit on the same beat.
 *
 * Hands are glove targets in torso space (x out to the side, y up, z toward
 * the camera), with the shoulders at (±0.19, 0.13, 0). The arm solver clamps
 * anything past full reach, and keeps gloves out of the head.
 *
 * Feet are offsets from standing square, per foot: out to that foot's side,
 * up off the floor, and forward. The rig plants them and bends the knees to
 * suit, so a crouch is just a negative `y`.
 */

import { SHIN, THIGH } from './legIK.ts';

export type Dance =
  | 'folks'
  | 'whip'
  | 'shoot'
  | 'dougie'
  | 'stanky'
  | 'sprinkler'
  | 'shmoney'
  | 'dab'
  | 'milly'
  | 'naenae'
  | 'griddy';

/** Saved looks store an index into this list, so new dances only go on the end. */
export const DANCES: Dance[] = [
  'folks',
  'shmoney',
  'dab',
  'milly',
  'naenae',
  'griddy',
  'whip',
  'shoot',
  'dougie',
  'stanky',
  'sprinkler',
];

export const DANCE_NAMES: Record<Dance, string> = {
  folks: 'Hit Dem Folks',
  whip: 'The Whip',
  shoot: 'The Shoot',
  dougie: 'The Dougie',
  stanky: 'Stanky Leg',
  sprinkler: 'Sprinkler',
  shmoney: 'Shmoney',
  dab: 'Dab',
  milly: 'Milly Rock',
  naenae: 'Nae Nae',
  griddy: 'Griddy',
};

/** Seconds per beat: 100 BPM, the pocket most walkout songs sit in. */
export const BEAT = 0.6;

/** Hip joints and the standing ankle, in the rig's root space. */
export const HIP = { x: 0.12, y: 0.4, z: 0.05 };
export const ANKLE = { x: 0.15, y: HIP.y - THIGH - SHIN };

export type Vec3 = [number, number, number];

export interface DanceFrame {
  /** Left (−x) and right (+x) glove targets, torso space. */
  l: Vec3;
  r: Vec3;
  /** Each foot: out to its own side, up off the floor, forward. */
  footL: Vec3;
  footR: Vec3;
  /** How far each knee turns in toward the other leg, radians. Negative turns it out. */
  kneeL: number;
  kneeR: number;
  /** Toes lifted off the floor, heel down, radians. */
  toeL: number;
  toeR: number;
  /** Root height: negative is a crouch, positive leaves the floor. */
  y: number;
  /** Root sway side to side. */
  x: number;
  /** Whole-body roll and turn. */
  roll: number;
  turn: number;
  /** Torso lean forward (+) and twist (+ turns the chest toward the right hand). */
  pitch: number;
  yaw: number;
  /** Torso tilt to the side. */
  tilt: number;
  /** Head nod (+ down), turn and tilt. */
  nod: number;
  look: number;
  cock: number;
  /** Mouth open, 1 is resting. */
  mouth: number;
}

export function blankFrame(): DanceFrame {
  return {
    l: [-0.13, 0.3, 0.38],
    r: [0.13, 0.3, 0.38],
    footL: [0, 0, 0],
    footR: [0, 0, 0],
    kneeL: 0,
    kneeR: 0,
    toeL: 0,
    toeR: 0,
    y: 0,
    x: 0,
    roll: 0,
    turn: 0,
    pitch: 0,
    yaw: 0,
    tilt: 0,
    nod: 0,
    look: 0,
    cock: 0,
    mouth: 1,
  };
}

const frac = (x: number) => x - Math.floor(x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
/** Gets to the pose in the first part of the count and holds it, so moves read as hits. */
const snap = (u: number, attack = 0.32) => smooth(u / attack);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mixV = (a: Vec3, b: Vec3, k: number, out: Vec3): Vec3 => {
  out[0] = mix(a[0], b[0], k);
  out[1] = mix(a[1], b[1], k);
  out[2] = mix(a[2], b[2], k);
  return out;
};
const set = (out: Vec3, x: number, y: number, z: number): Vec3 => {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
};
/** Quadratic curve through `c`, for arm swipes that arc instead of cutting straight. */
const arc = (a: Vec3, c: Vec3, b: Vec3, k: number, out: Vec3): Vec3 => {
  const u = 1 - k;
  for (let i = 0; i < 3; i++) out[i] = u * u * a[i] + 2 * u * k * c[i] + k * k * b[i];
  return out;
};
/** 1 on the beat, 0 on the "and": the hip-hop bounce, down on the count. */
const bob = (b: number) => 0.5 + 0.5 * Math.cos(Math.PI * 2 * b);
/** A foot stepping from one spot to another with a little lift in the middle. */
const step = (from: Vec3, to: Vec3, k: number, lift: number, out: Vec3): Vec3 => {
  mixV(from, to, k, out);
  out[1] += Math.sin(Math.PI * clamp01(k)) * lift;
  return out;
};
const side = (b: number, every: number) => (Math.floor(b / every) % 2 === 0 ? 1 : -1);
const hand = (f: DanceFrame, s: number) => (s > 0 ? f.r : f.l);
const foot = (f: DanceFrame, s: number) => (s > 0 ? f.footR : f.footL);

/**
 * Hit Dem Folks, on an eight: right arm crosses the chest as the left foot
 * steps (1-2), then the left arm and right foot (3-4), one quick cross each
 * side (5, 6), arms roll in front (7), and the hit (8): arms flexed up in a
 * U, chest crunched forward, one knee pulled up. The knee swaps each eight.
 */
function folks(b: number, f: DanceFrame) {
  const c = b % 8;
  const knee = side(b, 8);
  const groove = bob(b * 2);
  const open = (s: number): Vec3 => [s * 0.3, 0.02 + groove * 0.03, 0.16];
  const across = (s: number): Vec3 => [-s * 0.12, 0.14, 0.34];
  // Which arm is crossed on this count, and which foot is out.
  const crossing = c < 2 ? 1 : c < 4 ? -1 : c < 5 ? 1 : c < 6 ? -1 : 0;
  if (c < 6) {
    const k = c < 4 ? snap(frac(c / 2), 0.2) : snap(frac(c), 0.3);
    for (const s of [-1, 1]) mixV(open(s), crossing === s ? across(s) : open(s), k, hand(f, s));
    const out = foot(f, -crossing);
    step([0, 0, 0], [0.07, 0, 0.03], k, 0.04, out);
    f.yaw = -crossing * 0.3 * k;
    f.look = -crossing * 0.2 * k;
    f.y = -0.03 - groove * 0.03;
    f.pitch = 0.06;
    f.mouth = 1.2;
  } else if (c < 7) {
    // Forearms rolling over each other in front of the chest.
    const a = Math.PI * 2 * frac(c) * 2;
    set(f.l, -0.06 + Math.cos(a) * 0.08, 0.14 + Math.sin(a) * 0.08, 0.34);
    set(f.r, 0.06 - Math.cos(a) * 0.08, 0.14 - Math.sin(a) * 0.08, 0.34);
    f.y = -0.04 - groove * 0.03;
    f.pitch = 0.08;
    f.mouth = 1.3;
  } else {
    const k = snap(frac(c), 0.18);
    set(f.l, mix(-0.12, -0.42, k), mix(0.14, 0.42, k), mix(0.34, 0.06, k));
    set(f.r, mix(0.12, 0.42, k), mix(0.14, 0.42, k), mix(0.34, 0.06, k));
    set(foot(f, knee), 0, 0.17 * k, 0.11 * k);
    f.y = -0.05 * k;
    f.pitch = 0.34 * k;
    f.nod = 0.18 * k;
    f.tilt = knee * 0.06 * k;
    f.mouth = 1 + k * 0.9;
  }
}

/**
 * The Whip: deep wide squat, toes and knees turned out, a slight forward
 * lean. One arm whips across from the side to a fist in front of the chin on
 * the count, then steers there like a wheel while the hips bounce twice a beat.
 */
function whip(b: number, f: DanceFrame) {
  const s = side(b, 8);
  const u = b % 4;
  const k = u < 1 ? snap(u, 0.35) : 1;
  const wind: Vec3 = [s * 0.4, 0.22, 0.1];
  const fist: Vec3 = [-s * 0.02, 0.2, 0.4];
  const w = hand(f, s);
  if (u < 1) arc(wind, [s * 0.2, 0.3, 0.42], fist, k, w);
  else set(w, fist[0] + Math.sin(Math.PI * (u - 1)) * 0.08 * s, fist[1] + bob(u * 2) * 0.02, fist[2]);
  set(hand(f, -s), -s * 0.25, -0.02 + bob(b * 2) * 0.03, 0.18);
  const bounce = bob(b * 2);
  set(f.footL, 0.1, 0, 0.02);
  set(f.footR, 0.1, 0, 0.02);
  f.kneeL = f.kneeR = -0.3;
  f.y = -0.1 - bounce * 0.03;
  f.pitch = 0.16;
  f.yaw = -s * 0.25 * k;
  f.look = -s * 0.12;
  f.nod = 0.05 + bounce * 0.05;
  f.mouth = 1.35;
}

/**
 * The Shoot: body turned 45°, weight on the back leg. The front knee comes
 * up to 90° with that fist cocked by the shoulder, a little hop off the
 * standing foot, then the leg kicks straight out as the fist pumps forward.
 * Once a beat; the kicking leg swaps every eight.
 */
function shoot(b: number, f: DanceFrame) {
  const s = side(b, 8);
  const u = frac(b);
  const kick = foot(f, s);
  const fist = hand(f, s);
  const knee: Vec3 = [0, 0.2, 0.1];
  const out: Vec3 = [0.01, 0.17, 0.26];
  const cocked: Vec3 = [s * 0.24, 0.3, 0.18];
  const pump: Vec3 = [s * 0.16, 0.12, 0.42];
  if (u < 0.35) {
    const k = smooth(u / 0.35);
    step([0, 0, 0.04], knee, k, 0, kick);
    mixV(pump, cocked, k, fist);
    f.y = -0.06;
    f.pitch = mix(0.05, -0.16, k);
  } else if (u < 0.5) {
    const k = (u - 0.35) / 0.15;
    set(kick, knee[0], knee[1], knee[2]);
    set(fist, cocked[0], cocked[1], cocked[2]);
    f.y = -0.06 + Math.sin(Math.PI * k) * 0.1;
    f.pitch = -0.16;
  } else if (u < 0.72) {
    const k = snap((u - 0.5) / 0.22, 0.5);
    mixV(knee, out, k, kick);
    mixV(cocked, pump, k, fist);
    f.y = -0.06;
    f.pitch = mix(-0.16, 0.08, k);
  } else {
    const k = smooth((u - 0.72) / 0.28);
    mixV(out, [0, 0, 0.04], k, kick);
    set(fist, pump[0], pump[1], pump[2]);
    f.y = -0.06;
    f.pitch = 0.08 - k * 0.03;
  }
  f.toeL = f.toeR = 0;
  if (s > 0) f.toeR = kick[2] > 0.15 ? -0.3 : 0;
  else f.toeL = kick[2] > 0.15 ? -0.3 : 0;
  set(hand(f, -s), -s * 0.3, 0.02, 0.06);
  set(foot(f, -s), 0.02, 0, -0.04);
  f.turn = -s * 0.7;
  f.look = s * 0.35;
  f.nod = -0.08;
  f.mouth = 1.3;
}

/**
 * The Dougie: knees bent with a bounce, stepping out and tapping back in on
 * a single, single, double (right, left, right-right), then mirrored. The
 * hips sway to the stepping foot, shoulders leading, and that hand brushes
 * up past the ear and slicks the hair back.
 */
function dougie(b: number, f: DanceFrame) {
  const phrase = side(b, 4);
  const c = b % 4;
  // Counts 1, 2, 3, "and": which foot steps, and how long the step lasts.
  const lead = c < 1 ? phrase : c < 2 ? -phrase : phrase;
  const u = c < 2 ? frac(c) : c < 2.5 ? (c - 2) * 2 : c < 3 ? (c - 2.5) * 2 : 1;
  const tap = Math.sin(Math.PI * clamp01(u / 0.8));
  set(foot(f, lead), 0.09 * tap, 0.03 * Math.sin(Math.PI * clamp01(u / 0.4)), 0.02 * tap);
  const sway = c < 3 ? lead * snap(u, 0.4) : phrase * (1 - smooth(c - 3));
  f.x = sway * 0.045;
  f.roll = -sway * 0.06;
  f.tilt = sway * 0.12;
  f.yaw = -sway * 0.2;
  f.look = -sway * 0.15;
  const brushing = c < 3 ? lead : phrase;
  const k = c < 2 ? frac(c) : c < 3 ? (c - 2) : 1;
  const brush = hand(f, brushing);
  if (c < 3) {
    const low: Vec3 = [brushing * 0.3, 0.12, 0.24];
    const ear: Vec3 = [brushing * 0.34, 0.5, 0.14];
    const back: Vec3 = [brushing * 0.26, 0.56, -0.12];
    if (k < 0.55) mixV(low, ear, smooth(k / 0.55), brush);
    else mixV(ear, back, smooth((k - 0.55) / 0.45), brush);
  } else {
    set(brush, brushing * 0.3, 0.12, 0.24);
  }
  set(hand(f, -brushing), -brushing * 0.26, 0.02 + bob(b) * 0.04, 0.2);
  f.y = -0.04 - bob(b * 2) * 0.03;
  f.pitch = 0.06;
  f.nod = 0.05 + bob(b * 2) * 0.05;
  f.mouth = 1.25;
}

/**
 * Stanky Leg: knees bent, one leg planted. The other goes out to the side,
 * knee bent, and circles in toward the planted leg and back out, the foot
 * pivoting with it. Arms loose out at the sides. Switches legs every four.
 */
function stanky(b: number, f: DanceFrame) {
  const s = side(b, 4);
  const a = Math.PI * 2 * b;
  const circle = 0.5 + 0.5 * Math.sin(a);
  set(foot(f, s), 0.13, 0, 0.04 + Math.cos(a) * 0.03);
  if (s > 0) f.kneeR = 0.05 + circle * 0.75;
  else f.kneeL = 0.05 + circle * 0.75;
  set(foot(f, -s), 0.02, 0, 0);
  const lean = s * (0.4 + circle * 0.6);
  set(f.l, -0.32, 0.08 + Math.sin(a + 1) * 0.05, 0.2);
  set(f.r, 0.32, 0.08 + Math.sin(a + 1) * 0.05, 0.2);
  f.y = -0.08 - circle * 0.03;
  f.x = -s * 0.03;
  f.tilt = -lean * 0.08;
  f.yaw = s * 0.15 * circle;
  f.pitch = 0.12;
  f.nod = 0.14;
  f.look = s * 0.25;
  f.mouth = 1.4;
}

/**
 * Sprinkler: knees bent, one hand behind the head with the elbow up, the
 * other arm straight out at shoulder height. The body turns across in three
 * jerky pulls, then sweeps back in one go. Swaps arms every eight.
 */
function sprinkler(b: number, f: DanceFrame) {
  const s = side(b, 8);
  const c = b % 4;
  const span = 0.75;
  const turnAt = c < 3 ? s * span * (1 - (2 * (Math.floor(c) + snap(frac(c), 0.18))) / 3) : -s * span + s * 2 * span * smooth(c - 3);
  f.turn = turnAt;
  set(hand(f, s), s * 0.2, 0.44, -0.28);
  set(hand(f, -s), -s * 0.62, 0.16, 0.18);
  const pull = c < 3 ? 1 - snap(frac(c), 0.18) : 0;
  f.y = -0.06 - pull * 0.03;
  set(f.footL, 0.05, 0, 0);
  set(f.footR, 0.05, 0, 0);
  f.pitch = -0.04;
  f.yaw = -s * 0.15;
  f.tilt = s * 0.06;
  f.look = -s * 0.45;
  f.nod = 0.04;
  f.mouth = 1.3;
}

/**
 * Shmoney: a b-boy stance, knees bent, one hip pushed out. On each count
 * the hip flips to the other side as both arms open wide like a hug, then
 * close back in front as the dancer leans into the bent leg.
 */
function shmoney(b: number, f: DanceFrame) {
  const h = side(b, 1);
  const u = frac(b);
  const flip = snap(u, 0.35);
  const hip = mix(-h, h, flip);
  const open = Math.sin(Math.PI * clamp01(u / 0.7));
  for (const s of [-1, 1]) mixV([s * 0.12, 0.06, 0.32], [s * 0.42, 0.22, 0.12], open, hand(f, s));
  set(f.footL, 0.07, 0, 0);
  set(f.footR, 0.07, 0, 0);
  f.x = hip * 0.06;
  f.roll = -hip * 0.07;
  f.tilt = hip * 0.1;
  f.y = -0.06 - (1 - open) * 0.03;
  f.pitch = 0.04 + (1 - open) * 0.12;
  f.yaw = hip * 0.18;
  f.look = -hip * 0.15;
  f.nod = (1 - open) * 0.1;
  f.mouth = 1.2 + open * 0.4;
}

/** Two beats of bounce, then the face drops into one elbow while the other arm shoots out. */
function dab(b: number, f: DanceFrame) {
  const s = side(b, 4);
  const inBar = b % 4;
  const k = inBar < 2 ? 0 : inBar < 3.6 ? snap(inBar - 2, 0.15) : 1 - smooth((inBar - 3.6) / 0.4);
  const groove = bob(b) * (1 - k);
  const rest = (x: number): Vec3 => [x * 0.24, 0.06 + groove * 0.06, 0.24];
  mixV(rest(s), [-s * 0.05, 0.42, 0.36], k, hand(f, s));
  mixV(rest(-s), [-s * 0.62, 0.48, 0.1], k, hand(f, -s));
  set(f.footL, 0.07, 0, 0);
  set(f.footR, 0.07, 0, 0);
  f.y = -0.04 - groove * 0.04 - k * 0.03;
  f.pitch = 0.06 + k * 0.2;
  f.yaw = s * k * 0.15;
  f.tilt = -s * k * 0.12;
  f.nod = k * 0.5;
  f.look = s * k * 0.4;
  f.cock = s * k * 0.15;
  f.mouth = 1.15 - k * 0.15;
}

/**
 * Milly Rock: a side two-step, out then together, travelling right and then
 * back left. Forearms roll over each other on the step; as the feet meet, that
 * side's arm swipes a big C across the chest to the opposite shoulder.
 */
function milly(b: number, f: DanceFrame) {
  const c = b % 4;
  const dir = c < 2 ? 1 : -1;
  const u = frac(c);
  const k = smooth(u);
  const W = 0.1;
  // Root travels with the feet; each foot's offset is measured from square.
  if (c < 1) {
    step([0, 0, 0], [W, 0, 0], k, 0.04, f.footR);
    f.x = W * 0.5 * k;
  } else if (c < 2) {
    set(f.footR, W, 0, 0);
    step([0, 0, 0], [-W, 0, 0], k, 0.04, f.footL);
    f.x = W * (0.5 + 0.5 * k);
  } else if (c < 3) {
    step([-W, 0, 0], [0, 0, 0], k, 0.04, f.footL);
    set(f.footR, W, 0, 0);
    f.x = W * (1 - 0.5 * k);
  } else {
    step([W, 0, 0], [0, 0, 0], k, 0.04, f.footR);
    f.x = W * 0.5 * (1 - k);
  }
  const meeting = c % 2 >= 1;
  const a = Math.PI * 2 * b * 2;
  const rollAt = (s: number, out: Vec3) =>
    set(out, s * 0.07 + Math.cos(a + (s > 0 ? Math.PI : 0)) * 0.07, 0.14 + Math.sin(a + (s > 0 ? Math.PI : 0)) * 0.07, 0.34);
  rollAt(-1, f.l);
  rollAt(1, f.r);
  if (meeting) {
    const swipe = hand(f, dir);
    arc([dir * 0.4, 0.4, 0.1], [dir * 0.34, 0.42, 0.42], [-dir * 0.14, 0.14, 0.32], smooth(u / 0.8), swipe);
    f.yaw = -dir * 0.3 * smooth(u / 0.8);
  } else {
    f.yaw = dir * 0.12 * k;
  }
  f.y = -0.05 - bob(b * 2) * 0.025;
  f.tilt = -dir * 0.05;
  f.look = dir * 0.25;
  f.pitch = 0.06;
  f.nod = 0.04;
  f.mouth = 1.2;
}

/**
 * Nae Nae: a deep wide stance, knees out. One open hand up above the
 * shoulder, waving; the other arm hangs low. The hips sway side to side
 * under it. Swaps hands every eight.
 */
function naenae(b: number, f: DanceFrame) {
  const s = side(b, 8);
  const sway = Math.sin(Math.PI * b);
  set(hand(f, s), s * (0.3 + sway * 0.08), 0.6, 0.08);
  set(hand(f, -s), -s * 0.26, -0.08 + Math.abs(sway) * 0.04, 0.14);
  set(f.footL, 0.1, 0, 0);
  set(f.footR, 0.1, 0, 0);
  f.kneeL = f.kneeR = -0.25;
  f.y = -0.1 + Math.abs(sway) * 0.02;
  f.x = sway * 0.05;
  f.roll = -sway * 0.08;
  f.tilt = sway * 0.1;
  f.yaw = sway * 0.12;
  f.pitch = 0.06;
  f.nod = -0.08;
  f.look = -sway * 0.15;
  f.cock = sway * 0.14;
  f.mouth = 1.4;
}

/**
 * Griddy: on every half beat one heel taps out in front, toes up, while the
 * other knee bends and lifts; arms pump opposite. Every other bar the hands
 * come up round the eyes like goggles.
 */
function griddy(b: number, f: DanceFrame) {
  const tap = side(b * 2, 1);
  const u = frac(b * 2);
  const out = Math.sin(Math.PI * u);
  set(foot(f, tap), 0, 0.03 * out, 0.16 * out);
  set(foot(f, -tap), 0, 0.06 * Math.max(0, Math.sin(Math.PI * 2 * u)), -0.03);
  if (tap > 0) f.toeR = 0.6 * out;
  else f.toeL = 0.6 * out;
  const goggles = Math.floor(b / 2) % 2 === 1;
  const g = goggles ? snap(frac(b / 2) * 2, 0.25) : 0;
  const pump = tap * out;
  mixV([-0.22, 0.08 - pump * 0.06, 0.18 - pump * 0.16], [-0.12, 0.44, 0.38], g, f.l);
  mixV([0.22, 0.08 + pump * 0.06, 0.18 + pump * 0.16], [0.12, 0.44, 0.38], g, f.r);
  f.y = -0.07 + out * 0.02;
  f.pitch = -0.06 + out * 0.05;
  f.yaw = -tap * out * 0.16;
  f.nod = goggles ? -0.05 : 0.04;
  f.look = goggles ? 0 : tap * 0.1;
  f.mouth = 1.5;
}

const MOVES: Record<Dance, (b: number, f: DanceFrame) => void> = {
  folks,
  whip,
  shoot,
  dougie,
  stanky,
  sprinkler,
  shmoney,
  dab,
  milly,
  naenae,
  griddy,
};

/** Longest hip-to-ankle the leg can make, with a hair of bend left in it. */
const REACH = THIGH + SHIN - 0.004;

/**
 * How high the root can sit with this foot still flat on the floor, or
 * Infinity if the foot is meant to be up.
 */
export function plantedCeiling(f: DanceFrame, s: -1 | 1): number {
  const ft = s > 0 ? f.footR : f.footL;
  if (ft[1] > 0.001) return Infinity;
  const dx = s * (ANKLE.x + ft[0]) - (s * HIP.x + f.x);
  const dz = ft[2] - (s < 0 ? HIP.z : -HIP.z);
  const lift = s * HIP.x * Math.sin(f.roll);
  const down = Math.sqrt(Math.max(0, REACH * REACH - dx * dx - dz * dz));
  return down - (HIP.y - ANKLE.y) - lift;
}

/** The dancer `t` seconds in. Writes into `out` so a frame loop allocates nothing. */
export function danceFrame(dance: Dance, t: number, out: DanceFrame = blankFrame()): DanceFrame {
  out.x = out.y = out.roll = out.turn = out.pitch = out.yaw = out.tilt = 0;
  out.nod = out.look = out.cock = 0;
  out.kneeL = out.kneeR = out.toeL = out.toeR = 0;
  out.mouth = 1;
  set(out.footL, 0, 0, 0);
  set(out.footR, 0, 0, 0);
  MOVES[dance](Math.max(0, t) / BEAT, out);
  // Anything the move asked for that would lift a planted foot sinks the hips instead.
  if (out.y <= 0) out.y = Math.min(out.y, plantedCeiling(out, -1), plantedCeiling(out, 1));
  return out;
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function danceFor(seed: string): Dance {
  return DANCES[hash(`dance|${seed}`) % DANCES.length];
}

/**
 * The second dance a fighter breaks into halfway down the aisle: never their
 * signature, so a walkout has two different moments. Seeded so the TV and
 * every phone agree.
 */
export function encoreFor(main: Dance, seed: string): Dance {
  const others = DANCES.filter((d) => d !== main);
  return others[hash(`encore|${seed}`) % others.length];
}
