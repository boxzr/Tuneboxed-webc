import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CLOTH_HEX, HAIR_HEX, SKIN_HEX, hexOf, type FighterLoadout } from './loadout';
import type { BoxerPose } from './punchDirector';
import { GAIT, type WalkStyle } from './walkStyles';
import { ANKLE, HIP, blankFrame, danceFrame, type Dance } from './dances';
import { SHIN, THIGH, solveLeg } from './legIK';
import { studioEnv, withRim } from './studio';
import {
  COMBO_SEG,
  comboMove,
  hitReaction,
  idleMotion,
  knockdownTilt,
  knockdownY,
  punchOut,
  punchPhaseAt,
  stepIn,
  weightOf,
  type MotionPunch,
} from './motion';

/** Root-local height of the torso group. */
const TORSO_Y = 0.74;
/** Torso-local head center and radius. */
const HEAD: [number, number, number] = [0, 0.4, 0.02];
const HEAD_R = 0.27;
const UPPER = 0.22;
/** Elbow to glove center. */
const FORE = 0.28;
const GLOVE_R = 0.12;
/**
 * Closest two boxers' roots may come on a step-in: both heads (the widest
 * part, a heavyweight's included) plus the forward lean of a body shot.
 */
const BODY_GAP = 0.74;
/**
 * Head yaw toward the TV camera so faces read in profile. Only the head:
 * turning the body put the other boxer out of arm's reach.
 */
const FACE_CHEAT = 0.5;

export function bodyScale(loadout: FighterLoadout) {
  if (loadout.body === 'heavy') return { x: 1.14, y: 0.96, z: 1.12 };
  if (loadout.body === 'light') return { x: 0.9, y: 1.04, z: 0.9 };
  return { x: 1, y: 1, z: 1 };
}

/** World height of the head center, so the other corner knows where to aim. */
export function headWorldY(loadout: FighterLoadout): number {
  return (TORSO_Y + HEAD[1]) * bodyScale(loadout).y;
}

/** Lacquered vinyl, like a collectible figure: clearcoat over a soft base, with a rim. */
function gloss(color: string, opts?: { rough?: number; coat?: number; rim?: number }) {
  return withRim(
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: opts?.rough ?? 0.3,
      metalness: 0.02,
      clearcoat: opts?.coat ?? 0.8,
      clearcoatRoughness: 0.12,
      sheen: 0.1,
      sheenColor: new THREE.Color('#ffffff'),
    }),
    '#ffe9c7',
    opts?.rim ?? 0.32
  );
}

function matte(color: string, rough = 0.6) {
  return withRim(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 }), '#ffe9c7', 0.18);
}

function metal(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.22, metalness: 0.95 });
}

/** A darker, richer version of a paint, for trim that has to read against it. */
function shade(hex: string, k: number) {
  return `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
}

function asPunch(pose: BoxerPose): MotionPunch | null {
  if (
    pose === 'jab' ||
    pose === 'cross' ||
    pose === 'hook' ||
    pose === 'body' ||
    pose === 'uppercut' ||
    pose === 'flurry'
  )
    return pose;
  return null;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const DOWN = V(0, -1, 0);
const FWD = V(0, 0, 1);
const _dir = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _elbow = new THREE.Vector3();
const _hand = new THREE.Vector3();
const _bx = new THREE.Vector3();
const _by = new THREE.Vector3();
const _bz = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _foe = new THREE.Vector3();
const _hit = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _ankle = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _rootInv = new THREE.Matrix4();
const { x: HIP_X, y: HIP_Y } = HIP;
const { x: ANKLE_X, y: ANKLE_Y } = ANKLE;

/** Point a bone (mesh built along -Y) down `dir`, keeping its +X toward `side`. */
function orient(obj: THREE.Object3D, dir: THREE.Vector3, side: THREE.Vector3) {
  _by.copy(dir).multiplyScalar(-1);
  // A bone lying along the shoulder line would spin the glove; lean the reference forward.
  const along = Math.abs(side.dot(_by));
  _bx.copy(side);
  if (along > 0.6) _bx.addScaledVector(FWD, (along - 0.6) * 2.5);
  _bx.addScaledVector(_by, -_bx.dot(_by));
  if (_bx.lengthSq() < 1e-4) _bx.set(0, 0, 1).addScaledVector(_by, -_by.z);
  _bx.normalize();
  _bz.crossVectors(_bx, _by).normalize();
  _basis.makeBasis(_bx, _by, _bz);
  obj.quaternion.setFromRotationMatrix(_basis);
}

/** Two-bone arm: shoulder fixed, glove center on `target`, elbow toward `pole`. */
function solveArm(
  shoulder: THREE.Vector3,
  target: THREE.Vector3,
  pole: THREE.Vector3,
  side: THREE.Vector3,
  upper: THREE.Object3D,
  fore: THREE.Object3D
) {
  _dir.copy(target).sub(shoulder);
  const dist = THREE.MathUtils.clamp(_dir.length(), Math.abs(UPPER - FORE) + 0.03, UPPER + FORE - 0.002);
  _dir.normalize();
  const cosA = (UPPER * UPPER + dist * dist - FORE * FORE) / (2 * UPPER * dist);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  _perp.copy(pole).addScaledVector(_dir, -pole.dot(_dir));
  if (_perp.lengthSq() < 1e-5) _perp.set(0, -1, 0);
  _perp.normalize();
  _elbow.copy(shoulder).addScaledVector(_dir, cosA * UPPER).addScaledVector(_perp, sinA * UPPER);
  _hand.copy(shoulder).addScaledVector(_dir, dist);

  upper.position.copy(shoulder);
  _tmp.copy(_elbow).sub(shoulder).normalize();
  orient(upper, _tmp, side);
  fore.position.copy(_elbow);
  _tmp.copy(_hand).sub(_elbow).normalize();
  orient(fore, _tmp, side);
}

/** A full turn every few seconds, for the showboat. */
function showboatSpin(t: number) {
  const k = (t % 3.4) / 3.4;
  if (k < 0.78) return 0;
  const u = (k - 0.78) / 0.22;
  return u * u * (3 - 2 * u) * Math.PI * 2;
}

/** Punches thrown at the air: which hand, and how far out. */
function shadowPunch(t: number, posing: boolean): { side: 1 | -1; ext: number } {
  const period = posing ? 0.24 : 0.42;
  const n = Math.floor(t / period);
  const k = (t / period) % 1;
  const ext = !posing && n % 3 === 2 ? 0 : Math.pow(Math.sin(k * Math.PI), 2);
  return { side: n % 2 ? 1 : -1, ext };
}

/** Hand target for an entrance, in torso space. Elbows stay bent; no arm goes up straight. */
function strutArm(
  style: WalkStyle,
  s: 1 | -1,
  t: number,
  walking: boolean,
  shadow: { side: 1 | -1; ext: number } | null,
  out: THREE.Vector3
) {
  const swing = Math.sin(t * GAIT[style].cadence + (s > 0 ? Math.PI : 0));
  switch (style) {
    case 'swagger':
      if (walking) return out.set(0.26 * s, -0.02, 0.1 + swing * 0.18);
      // Arms folded across the chest, then a pair of glove taps.
      if (Math.floor(t / 2) % 2 === 0) return out.set(-0.09 * s, s > 0 ? 0.0 : -0.04, 0.26);
      return out.set((0.15 - Math.max(0, Math.sin(t * 9)) * 0.03) * s, 0.2, 0.42);
    case 'shadowbox': {
      out.set(0.13 * s, 0.3, 0.38);
      if (shadow && shadow.side === s) out.lerp(_tmp.set(0.06 * s, 0.32, 0.56), shadow.ext);
      return out;
    }
    case 'hype': {
      if (walking) {
        const pump = Math.abs(Math.sin(t * GAIT.hype.cadence * 0.5));
        return out.set(0.38 * s, 0.36 + pump * 0.12, 0.12);
      }
      // Double biceps flex.
      return out.set(0.36 * s, 0.4 + Math.sin(t * 6) * 0.03, 0.02);
    }
    case 'stomp': {
      if (walking) {
        const pound = Math.abs(Math.sin(t * GAIT.stomp.cadence));
        return out.set((0.13 - pound * 0.03) * s, 0.18 + pound * 0.06, 0.4);
      }
      // Beats the chest, one glove then the other.
      const hit = Math.floor(t * 3) % 2 === (s > 0 ? 0 : 1);
      return hit ? out.set(0.1 * s, -0.02, 0.24) : out.set(0.24 * s, 0.12, 0.38);
    }
    case 'showboat': {
      if (walking) return out.set(0.2 * s, 0.05 + Math.sin(t * 9 + (s > 0 ? Math.PI : 0)) * 0.05, 0.3);
      // Dusts the gloves off in front of the trunks.
      return out.set((0.09 + Math.sin(t * 10) * 0.03 * s) * s, 0.04, 0.34);
    }
  }
}

const HEAD_C = new THREE.Vector3(...HEAD);
const HEAD_CLEAR = HEAD_R + GLOVE_R * 0.9;
const STRUT_REACH = UPPER + FORE - 0.05;

/** Keep a glove out of its own head and short of a locked-straight arm. */
function keepClear(target: THREE.Vector3, shoulder: THREE.Vector3) {
  _tmp.copy(target).sub(HEAD_C);
  const d = _tmp.length();
  if (d < HEAD_CLEAR) target.copy(HEAD_C).addScaledVector(_tmp, HEAD_CLEAR / Math.max(d, 1e-3));
  _tmp.copy(target).sub(shoulder);
  if (_tmp.length() > STRUT_REACH) target.copy(shoulder).addScaledVector(_tmp.normalize(), STRUT_REACH);
  return target;
}

function bezier(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z
  );
  return out;
}

type ArmSet = {
  shoulder: THREE.Vector3;
  pole: THREE.Vector3;
  side: THREE.Vector3;
  target: THREE.Vector3;
  smooth: THREE.Vector3;
};

function makeArm(s: 1 | -1): ArmSet {
  return {
    shoulder: V(0.19 * s, 0.13, 0),
    pole: V(0.75 * s, -1, -0.25),
    side: V(s, 0, 0),
    target: V(0.13 * s, 0.3, 0.32),
    smooth: V(0.13 * s, 0.3, 0.32),
  };
}

/**
 * Boxing glove built along -Y: cuff, laced wrist, padded mitt, curled-finger bulb, thumb.
 * `orient` points +X outward on both arms, which flips Z: the back of the hand is +Z·s, the palm -Z·s.
 */
function Glove({ s, glove, cuff }: { s: 1 | -1; glove: THREE.Material; cuff: THREE.Material }) {
  return (
    <group position={[0, -FORE, 0]}>
      <mesh position={[0, 0.135, 0]} material={cuff} castShadow>
        <cylinderGeometry args={[0.074, 0.07, 0.07, 18]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} material={glove} castShadow>
        <cylinderGeometry args={[0.084, 0.076, 0.06, 18]} />
      </mesh>
      <mesh position={[0, 0.085, -0.081 * s]} material={cuff}>
        <boxGeometry args={[0.03, 0.07, 0.012]} />
      </mesh>
      <mesh position={[0, -0.005, 0.012 * s]} scale={[0.96, 1.08, 1]} material={glove} castShadow>
        <sphereGeometry args={[GLOVE_R, 36, 26]} />
      </mesh>
      <mesh position={[0, -0.07, -0.022 * s]} scale={[0.98, 0.82, 1.02]} material={glove} castShadow>
        <sphereGeometry args={[0.104, 36, 26]} />
      </mesh>
      <mesh position={[-0.078, -0.012, -0.05 * s]} rotation={[0.35 * s, 0, -0.32]} material={glove} castShadow>
        <capsuleGeometry args={[0.04, 0.075, 8, 14]} />
      </mesh>
      {[0.03, 0.0, -0.03].map((y) => (
        <mesh key={y} position={[0, y, 0.124 * s]} rotation={[0, 0, 0]} material={cuff}>
          <boxGeometry args={[0.06, 0.008, 0.01]} />
        </mesh>
      ))}
      <mesh position={[0, 0.0, 0.122 * s]} material={cuff}>
        <boxGeometry args={[0.008, 0.075, 0.008]} />
      </mesh>
    </group>
  );
}

/** Eighth-note flag. Style changes the note: sixteenth, tall, short, long. */
function NoteFlag({ style, mat }: { style: FighterLoadout['hair']; mat: THREE.Material }) {
  const stem = style === 'mohawk' ? 0.46 : style === 'fade' ? 0.28 : 0.36;
  const flagLen = style === 'long' ? 0.34 : style === 'fade' ? 0.2 : 0.27;
  const flags = style === 'afro' ? 2 : 1;
  return (
    <group position={[0.11, 0.17, -0.06]}>
      <mesh position={[0, stem / 2, 0]} material={mat} castShadow>
        <capsuleGeometry args={[0.045, stem, 6, 12]} />
      </mesh>
      {Array.from({ length: flags }, (_, i) => (
        <group key={i} position={[0, stem - i * 0.13, 0]} rotation={[-0.45, 0, 0]}>
          <mesh position={[0, 0, -flagLen / 2]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]} material={mat} castShadow>
            <capsuleGeometry args={[0.06, flagLen, 6, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * The high-top's shaft, laces and cuff. Worn on the shin, not the foot, so it
 * leans with a bent knee while the sole below stays flat.
 */
function BootShaft({ shoe, sole, stripe }: { shoe: THREE.Material; sole: THREE.Material; stripe: THREE.Material }) {
  return (
    <group position={[0, 0, 0.005]}>
      <mesh position={[0, 0.1, 0]} material={shoe} castShadow>
        <cylinderGeometry args={[0.07, 0.074, 0.15, 20]} />
      </mesh>
      {/* Fills the ankle as the shaft and the flat foot angle apart. */}
      <mesh position={[0, 0.03, 0.01]} scale={[1, 0.9, 1.05]} material={shoe} castShadow>
        <sphereGeometry args={[0.074, 18, 14]} />
      </mesh>
      <mesh position={[0, 0.182, 0]} material={sole}>
        <torusGeometry args={[0.068, 0.012, 8, 24]} />
      </mesh>
      {[0.05, 0.085, 0.12].map((y) => (
        <mesh key={y} position={[0, y, 0.071]} material={stripe}>
          <boxGeometry args={[0.07, 0.008, 0.008]} />
        </mesh>
      ))}
    </group>
  );
}

/** High-top boxing boot's foot: coloured upper, white sole, side stripes. */
function Sneaker({ shoe, sole, stripe }: { shoe: THREE.Material; sole: THREE.Material; stripe: THREE.Material }) {
  return (
    <group position={[0, 0, 0.04]}>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.78]} material={shoe} castShadow>
        <capsuleGeometry args={[0.075, 0.13, 10, 18]} />
      </mesh>
      <mesh position={[0, -0.035, 0.005]} rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 1, 0.3]} material={sole} castShadow>
        <capsuleGeometry args={[0.078, 0.14, 6, 14]} />
      </mesh>
      <mesh position={[0.07, 0.02, -0.01]} rotation={[0, 0, 0.1]} material={stripe}>
        <boxGeometry args={[0.012, 0.03, 0.12]} />
      </mesh>
      <mesh position={[-0.07, 0.02, -0.01]} rotation={[0, 0, -0.1]} material={stripe}>
        <boxGeometry args={[0.012, 0.03, 0.12]} />
      </mesh>
    </group>
  );
}

/**
 * TuneBoxed mascot boxer. Note head, glossy body, laced gloves, sneakers.
 * Arms are two-bone IK: in a bout each punch is aimed at `foe` (the other
 * head's world position), so a landed punch lands on the face.
 */
export default function BoxerRig({
  loadout,
  pose,
  facing,
  faceCamera = false,
  beat = 0,
  hits = 3,
  hitBy,
  hitDelay = 0,
  hitTimes,
  foe,
  wear = 0,
  walkStyle = 'swagger',
  dance = null,
}: {
  loadout: FighterLoadout;
  pose: BoxerPose;
  /** Changes on every punch; restarts the move even when the pose repeats. */
  beat?: number;
  facing: 1 | -1;
  faceCamera?: boolean;
  hitBy?: MotionPunch;
  /** Seconds until the other corner's glove arrives. Reaction waits for it. */
  hitDelay?: number;
  /** Punches in this boxer's combo, when the pose is `combo`. */
  hits?: number;
  /** Every glove arrival, for a combo coming in. Overrides `hitBy`/`hitDelay`. */
  hitTimes?: { at: number; kind: MotionPunch }[];
  /** World position of the other boxer's head center. */
  foe?: [number, number, number];
  wear?: number;
  /** How they carry themselves on the walkout. */
  walkStyle?: WalkStyle;
  /** Danced instead of the walk style's pose whenever the pose is `taunt`. */
  dance?: Dance | null;
}) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const upL = useRef<THREE.Group>(null);
  const upR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const hipL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const shinL = useRef<THREE.Group>(null);
  const shinR = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  const legAngles = useMemo(() => ({ splay: 0, pitch: 0, knee: 0, reached: true }), []);
  const mouth = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const poseAt = useRef(-1);
  const lastPose = useRef<BoxerPose>(pose);
  const lastBeat = useRef(beat);
  const lastDance = useRef(dance);
  const moves = useMemo(blankFrame, []);
  const landedHits = useRef(0);
  const spring = useRef({ z: 0, y: 0, vz: 0, vy: 0 });
  const arms = useMemo(() => ({ l: makeArm(-1), r: makeArm(1) }), []);

  const body = hexOf(SKIN_HEX, loadout.skin);
  const flag = loadout.hair === 'none' ? body : hexOf(HAIR_HEX, loadout.hairColor);
  const trunks = hexOf(CLOTH_HEX, loadout.trunks);
  const gloves = hexOf(CLOTH_HEX, loadout.gloves);
  const shoes = hexOf(CLOTH_HEX, loadout.boots);
  const scale = bodyScale(loadout);

  const mats = useMemo(
    () => ({
      body: gloss(body),
      flag: gloss(flag),
      trunks: Object.assign(gloss(trunks, { rough: 0.3, coat: 0.9 }), { side: THREE.DoubleSide }),
      gloves: gloss(gloves, { rough: 0.28, coat: 0.9 }),
      cuff: matte('#f4f1ea', 0.75),
      shoe: gloss(shoes, { rough: 0.32, coat: 0.6 }),
      sole: matte('#f1f1ee', 0.5),
      stripe: gloss('#ffffff', { rough: 0.4, coat: 0.3 }),
      band: Object.assign(gloss(shade(trunks, 0.55), { rough: 0.35, coat: 0.9 }), { side: THREE.DoubleSide }),
      gold: metal('#e2b443'),
      lid: gloss(shade(body, 0.82)),
      guard: gloss(trunks, { rough: 0.2, coat: 1 }),
      wrap: matte('#f8fafc', 0.82),
      eyeWhite: gloss('#ffffff', { rough: 0.15, coat: 1 }),
      ink: matte('#0f0d14', 0.5),
      mouth: matte('#4a0d16', 0.6),
      teeth: gloss('#ffffff', { rough: 0.2, coat: 1, rim: 0.1 }),
      bruise: matte('#5b2436', 0.8),
    }),
    [body, flag, trunks, gloves, shoes]
  );

  const { gl } = useThree();
  useEffect(() => {
    const env = studioEnv(gl);
    const list = Object.values(mats) as THREE.MeshStandardMaterial[];
    for (const m of list) {
      m.envMap = env;
      m.envMapIntensity = m.metalness > 0.5 ? 1.35 : 0.55;
      m.needsUpdate = true;
    }
    return () => list.forEach((m) => m.dispose());
  }, [gl, mats]);

  useFrame(({ clock }, dt) => {
    const step = Math.min(0.05, Math.max(0.001, dt || 0.016));
    const t = clock.elapsedTime;
    if (poseAt.current < 0) poseAt.current = t;
    if (lastPose.current !== pose || lastBeat.current !== beat || lastDance.current !== dance) {
      lastPose.current = pose;
      lastBeat.current = beat;
      lastDance.current = dance;
      poseAt.current = t;
      landedHits.current = 0;
      if (pose === 'down') {
        spring.current.vz = -1.4;
        spring.current.vy = 2.4;
      }
    }
    const age = t - poseAt.current;
    const wt = weightOf(loadout.body);
    const combo = pose === 'combo' ? comboMove(age * wt.speed, hits) : null;
    const punch = combo ? combo.kind : asPunch(pose);
    const pAge = combo ? combo.age : age * wt.speed;
    const move: BoxerPose = punch ?? pose;
    const out = punch ? punchOut(pAge, punch) : 0;
    const phase = punch ? punchPhaseAt(pAge, punch) : 'done';
    const ext = Math.max(0, out);
    const wind = Math.max(0, -out / 0.38);

    const schedule = hitTimes ?? [{ at: hitDelay, kind: hitBy ?? 'jab' }];
    let arrived = 0;
    if (pose === 'hurt') while (arrived < schedule.length && age >= schedule[arrived].at) arrived++;
    const struck = arrived > 0;
    while (landedHits.current < arrived) {
      const i = landedHits.current++;
      const r = hitReaction(schedule[i].kind);
      const last = i === schedule.length - 1;
      // A combo pins them in range until the last shot, which sends them.
      const boost = schedule.length > 1 ? (last ? 1.5 : 0.45) : 1;
      spring.current.vz = -2.4 * wt.knock * r.knock * boost;
      spring.current.vy = 2.2 * wt.knock * r.lift * boost;
    }
    const lastHit = struck ? schedule[arrived - 1].kind : null;
    const hr = lastHit ? hitReaction(lastHit) : null;
    const idle =
      pose === 'idle' || pose === 'lost' || (pose === 'hurt' && !struck)
        ? idleMotion(t, wt.bounce)
        : { y: 0, x: 0, weave: 0 };
    const walking = pose === 'walk';
    const celebrating = pose === 'won' && dance != null;
    const dancing = (pose === 'taunt' || celebrating) && dance ? danceFrame(dance, age, moves) : null;
    // In the ring they stand side-on to the camera; a victory dance turns to face it.
    const toCrowd = celebrating && !faceCamera ? -facing * (Math.PI / 2) : 0;
    const posing = pose === 'taunt' && !dancing;
    const gait = GAIT[walkStyle];
    const stride = walking ? Math.sin(t * gait.cadence) : 0;
    const spin = walkStyle === 'showboat' && (walking || posing) ? showboatSpin(t) : 0;
    const shadow = walkStyle === 'shadowbox' && (walking || posing) ? shadowPunch(t, posing) : null;
    const shimmy = walkStyle === 'showboat' && (walking || posing) ? Math.sin(t * 2.7) * 0.06 : 0;
    const poseHop = !posing
      ? 0
      : walkStyle === 'hype'
        ? Math.abs(Math.sin(t * 7)) * 0.12
        : walkStyle === 'shadowbox'
          ? Math.abs(Math.sin(t * 6.1)) * 0.05
          : walkStyle === 'stomp'
            ? 0
            : Math.abs(Math.sin(t * 4)) * 0.03;

    if (root.current) {
      const s = spring.current;
      if (struck || pose === 'down') {
        s.vy -= 12 * step;
        s.vz *= Math.pow(0.05, step);
        s.z += s.vz * step;
        const floor = pose === 'down' ? 0.04 : 0;
        s.y = Math.max(floor, s.y + s.vy * step);
        if (s.y <= floor && s.vy < 0) {
          s.y = floor;
          s.vy *= pose === 'down' ? -0.4 : -0.12;
        }
      } else {
        s.z = THREE.MathUtils.lerp(s.z, 0, 0.22);
        s.y = THREE.MathUtils.lerp(s.y, 0, 0.22);
        s.vz = 0;
        s.vy = 0;
      }
      const comboEnd = hits * COMBO_SEG;
      const press =
        pose === 'combo'
          ? Math.min(1, age * wt.speed * 6) * THREE.MathUtils.clamp((comboEnd + 0.3 - age * wt.speed) / 0.3, 0, 1)
          : 0;
      const advance =
        pose === 'combo' ? press * 0.34 * wt.lunge * 1.2 : punch ? stepIn(pAge, punch) * wt.lunge * 1.2 : 0;
      let room = Infinity;
      if (foe && root.current.parent) {
        root.current.parent.getWorldPosition(_tmp);
        room = Math.hypot(foe[0] - _tmp.x, foe[2] - _tmp.z) - BODY_GAP;
      }
      const lunge = Math.min(advance, Math.max(0, room));
      const hop = pose === 'won' ? Math.abs(Math.sin(t * 8)) * 0.1 : poseHop;
      const walkBob = walking ? Math.abs(stride) * (gait.bob + gait.hop) : 0;
      root.current.position.y = pose === 'down' ? knockdownY(age) : Math.max(0, idle.y) * 0.55 + s.y + hop + walkBob;
      root.current.position.z = lunge + s.z;
      root.current.position.x = pose === 'idle' ? idle.x * 0.6 : THREE.MathUtils.lerp(root.current.position.x, shimmy, 0.25);
      root.current.rotation.z = THREE.MathUtils.lerp(
        root.current.rotation.z,
        pose === 'down' ? facing * 0.25 : hr
            ? facing * -0.12 * hr.twist
            : walking
              ? stride * gait.roll
              : posing && walkStyle === 'showboat'
                ? Math.sin(t * 5.4) * 0.1
                : idle.weave * 0.12,
        0.18
      );
      root.current.rotation.x =
        pose === 'down'
          ? knockdownTilt(age)
          : THREE.MathUtils.lerp(root.current.rotation.x, hr ? -0.1 - hr.lift * 0.16 : pose === 'lost' ? 0.14 : 0, 0.18);
      if (spin > 0) {
        root.current.rotation.y = spin;
      } else {
        const ry = root.current.rotation.y;
        root.current.rotation.y = THREE.MathUtils.lerp(
          Math.atan2(Math.sin(ry), Math.cos(ry)),
          hr ? hr.twist * 0.28 : walking ? stride * 0.1 : 0,
          0.22
        );
      }
      if (dancing) {
        root.current.position.y = dancing.y;
        root.current.position.x = THREE.MathUtils.lerp(root.current.position.x, dancing.x, 0.35);
        root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, dancing.roll, 0.4);
        root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, dancing.turn + toCrowd, celebrating ? 0.12 : 0.4);
      }
    }

    const blend = punch ? (phase === 'rec' ? 0.35 : 0.6) : struck ? 0.45 : 0.22;
    if (torso.current) {
      torso.current.rotation.x = THREE.MathUtils.lerp(
        torso.current.rotation.x,
        move === 'body'
          ? 0.12 + ext * 0.34
          : punch
            ? 0.1 + ext * 0.16
            : hr
              ? lastHit === 'body'
                ? 0.38
                : -0.24
              : pose === 'lost'
                ? 0.2
                : pose === 'won'
                  ? -0.1
                  : walking
                    ? 0.06 + gait.lean
                    : posing && walkStyle === 'stomp'
                      ? 0.22
                      : posing && walkStyle === 'swagger'
                        ? -0.1
                        : 0.06,
        blend
      );
      torso.current.rotation.y = THREE.MathUtils.lerp(
        torso.current.rotation.y,
        move === 'jab'
          ? 0.28 * ext
          : move === 'cross'
            ? 0.12 * wind - 0.48 * ext
            : move === 'body'
              ? 0.3 * ext
              : move === 'hook'
            ? 0.35 * wind - 0.55 * ext
            : move === 'uppercut'
              ? 0.3 * ext
              : hr
                ? hr.twist * 0.3
                : shadow
                  ? -shadow.side * 0.32 * shadow.ext - stride * gait.twist
                  : walking
                    ? -stride * gait.twist
                    : idle.weave * 0.5,
        blend
      );
      torso.current.position.y =
        TORSO_Y + (move === 'uppercut' ? -0.06 * wind : move === 'body' ? -0.07 * Math.max(wind, ext) : 0);
      if (dancing) {
        torso.current.rotation.x = THREE.MathUtils.lerp(torso.current.rotation.x, dancing.pitch, 0.4);
        torso.current.rotation.y = THREE.MathUtils.lerp(torso.current.rotation.y, dancing.yaw, 0.4);
      }
      torso.current.rotation.z = THREE.MathUtils.lerp(torso.current.rotation.z, dancing ? dancing.tilt : 0, 0.3);
    }

    if (head.current) {
      const whip = hr ? hr.head : 0;
      head.current.rotation.x = THREE.MathUtils.lerp(
        head.current.rotation.x,
        hr
          ? lastHit === 'body'
            ? 0.3
            : -0.3 - whip * 0.35
          : punch
            ? 0.06
            : pose === 'lost'
              ? 0.28
              : pose === 'won'
                ? -0.15
                : walking && walkStyle === 'swagger'
                  ? Math.sin(t * gait.cadence * 2) * 0.07
                  : posing && (walkStyle === 'hype' || walkStyle === 'stomp')
                    ? -0.22
                    : 0,
        hr ? 0.5 : 0.22
      );
      head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, hr ? -0.28 * hr.twist : 0, 0.3);
      const toCamera = faceCamera ? 0 : -facing * FACE_CHEAT * (punch ? 0.4 : 1);
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, toCamera, 0.2);
      if (dancing) {
        head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, dancing.nod, 0.35);
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, dancing.look, 0.35);
        head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, dancing.cock, 0.35);
      }
    }
    if (mouth.current) {
      const shout = posing && (walkStyle === 'hype' || walkStyle === 'stomp');
      const open = dancing ? dancing.mouth : hr || shout ? 1.9 : pose === 'won' || posing ? 1.5 : punch ? 1.25 : 1;
      mouth.current.scale.y = THREE.MathUtils.lerp(mouth.current.scale.y, open, 0.35);
    }
    if (eyes.current) {
      const blink = (pose === 'idle' || walking) && Math.sin(t * 0.9) > 0.985 ? 0.1 : 1;
      eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, hr ? 0.35 : blink, 0.45);
    }

    const glow = move === 'flurry' ? 0.45 + Math.sin(t * 20) * 0.12 : 0;
    mats.gloves.emissive.set(glow > 0.05 ? '#ff9a3c' : '#000000');
    mats.gloves.emissiveIntensity = glow;

    if (!torso.current || !upL.current || !upR.current || !foreL.current || !foreR.current) return;

    torso.current.updateWorldMatrix(true, false);
    if (foe) {
      _foe.set(foe[0], foe[1], foe[2]);
      torso.current.worldToLocal(_foe);
    } else {
      _foe.set(0, HEAD[1] + 0.02, 1.25);
    }

    const aimAt = (arm: ArmSet, lift: number, lateral: number, out: THREE.Vector3) => {
      _hit.set(_foe.x + lateral, _foe.y + lift, _foe.z);
      _tmp.copy(_hit).sub(arm.shoulder).normalize();
      return out.copy(_hit).addScaledVector(_tmp, -(HEAD_R * 0.92 + GLOVE_R * 0.7));
    };

    const aimBody = (arm: ArmSet, lateral: number, out: THREE.Vector3) => {
      _hit.set(_foe.x + lateral, _foe.y - (HEAD[1] - 0.06), _foe.z);
      _tmp.copy(_hit).sub(arm.shoulder).normalize();
      return out.copy(_hit).addScaledVector(_tmp, -(0.19 + GLOVE_R * 0.6));
    };

    const guard = (arm: ArmSet, s: number) => arm.target.set(0.13 * s, 0.3 + idle.y * 0.6, 0.38);
    const contact = V(0, 0, 0);
    const ctrl = V(0, 0, 0);
    const start = V(0, 0, 0);

    for (const key of ['l', 'r'] as const) {
      const arm = arms[key];
      const s = key === 'l' ? -1 : 1;
      guard(arm, s);
      if (move === 'jab' && key === 'l') {
        start.copy(arm.target).add(_tmp.set(0, -0.02, -0.07).multiplyScalar(wind));
        aimAt(arm, -0.02, 0.02, contact);
        arm.target.copy(start).lerp(contact, ext);
      } else if (move === 'cross' && key === 'r') {
        start.copy(arm.target).add(_tmp.set(0.03, -0.02, -0.1).multiplyScalar(wind));
        aimAt(arm, -0.01, -0.02, contact);
        arm.target.copy(start).lerp(contact, ext);
      } else if (move === 'body' && key === 'l') {
        start.copy(arm.target).add(_tmp.set(-0.1, -0.16, -0.08).multiplyScalar(wind));
        aimBody(arm, 0.03, contact);
        ctrl.set(-0.42, -0.08, Math.max(0.2, contact.z * 0.5));
        bezier(start, ctrl, contact, ext, arm.target);
      } else if (move === 'hook' && key === 'r') {
        start.copy(arm.target).add(_tmp.set(0.16, -0.02, -0.12).multiplyScalar(wind));
        aimAt(arm, 0.02, 0.19, contact);
        ctrl.set(0.62, 0.3, Math.max(0.2, contact.z * 0.55));
        bezier(start, ctrl, contact, ext, arm.target);
      } else if (move === 'uppercut' && key === 'l') {
        start.copy(arm.target).add(_tmp.set(0.02, -0.3, -0.04).multiplyScalar(wind));
        aimAt(arm, -0.11, 0, contact);
        ctrl.set(-0.08, -0.05, Math.max(0.25, contact.z * 0.7));
        bezier(start, ctrl, contact, ext, arm.target);
      } else if (move === 'flurry') {
        const beat = Math.max(0, Math.sin(age * 22 + (key === 'l' ? 0 : Math.PI)));
        aimAt(arm, Math.sin(age * 13 + s) * 0.07, s * 0.06, contact);
        arm.target.lerp(contact, beat * 0.95);
      } else if (punch) {
        arm.target.set(0.11 * s, 0.32, 0.3);
      } else if (pose === 'hurt') {
        if (struck) arm.target.set(0.1 * s, 0.42, 0.3);
        else arm.target.set(0.2 * s, 0.2, 0.28);
      } else if (pose === 'won' && !dancing) {
        // A V the arm can actually reach; past full extension the solver locks it into a rod.
        arm.target.set(0.34 * s, 0.56 + Math.sin(t * 8 + s) * 0.04, 0.14);
        keepClear(arm.target, arm.shoulder);
      } else if (pose === 'lost') {
        arm.target.set(0.27 * s, -0.14, 0.08);
      } else if (pose === 'down') {
        arm.target.set(0.4 * s, 0.05, -0.04);
      } else if (dancing) {
        const hand = key === 'l' ? dancing.l : dancing.r;
        keepClear(arm.target.set(hand[0], hand[1], hand[2]), arm.shoulder);
      } else if (walking || posing) {
        strutArm(walkStyle, s, t, walking, shadow, arm.target);
        if (!shadow) keepClear(arm.target, arm.shoulder);
      }
      const follow = punch || struck || shadow ? 0.55 : dancing ? 0.42 : 0.25;
      arm.smooth.lerp(arm.target, follow);
      if ((walking || posing || dancing || pose === 'won') && !shadow) keepClear(arm.smooth, arm.shoulder);
      solveArm(
        arm.shoulder,
        arm.smooth,
        arm.pole,
        arm.side,
        key === 'l' ? upL.current : upR.current,
        key === 'l' ? foreL.current : foreR.current
      );
    }

    const bounce = pose === 'idle' ? Math.sin(t * 6.1) * 0.08 * wt.bounce : 0;
    const wide = posing && walkStyle === 'stomp' ? 0.12 : 0;
    if (dancing && root.current) {
      root.current.updateMatrix();
      _rootInv.copy(root.current.matrix).invert();
    }
    for (const s of [-1, 1] as const) {
      const hip = (s < 0 ? hipL : hipR).current;
      const leg = (s < 0 ? legL : legR).current;
      const shin = (s < 0 ? shinL : shinR).current;
      const foot = (s < 0 ? footL : footR).current;
      if (!hip || !leg || !shin || !foot) continue;
      const lerp = THREE.MathUtils.lerp;
      if (dancing && root.current) {
        const f = s < 0 ? dancing.footL : dancing.footR;
        // Feet are placed on the floor under the rig, turning with the body but
        // not riding its sway or crouch, so the knees take up the difference.
        _ankle
          .set(s * (ANKLE_X + f[0]), ANKLE_Y + f[1], f[2])
          .applyAxisAngle(_up, root.current.rotation.y)
          .applyMatrix4(_rootInv)
          .sub(hip.position);
        const twist = -s * (s < 0 ? dancing.kneeL : dancing.kneeR);
        _ankle.applyAxisAngle(_up, -twist);
        solveLeg([0, 0, 0], [_ankle.x, _ankle.y, _ankle.z], legAngles);
        const k = 0.5;
        hip.rotation.y = lerp(hip.rotation.y, twist, k);
        leg.rotation.z = lerp(leg.rotation.z, legAngles.splay, k);
        leg.rotation.x = lerp(leg.rotation.x, legAngles.pitch, k);
        shin.rotation.x = lerp(shin.rotation.x, legAngles.knee, k);
        const toe = s < 0 ? dancing.toeL : dancing.toeR;
        foot.rotation.x = lerp(foot.rotation.x, -(legAngles.pitch + legAngles.knee) - toe, k);
        foot.rotation.z = lerp(foot.rotation.z, -legAngles.splay, k);
        foot.rotation.y = lerp(foot.rotation.y, -twist * 0.6, k);
      } else {
        const swing =
          s < 0
            ? walking ? stride * gait.stride : punch ? 0.18 : pose === 'down' ? 0.55 : bounce + 0.12 + wide
            : walking ? -stride * gait.stride : punch ? -0.22 : pose === 'down' ? 0.3 : -bounce - 0.14 - wide;
        hip.rotation.y = lerp(hip.rotation.y, 0, 0.3);
        leg.rotation.x = lerp(leg.rotation.x, -swing, 0.22);
        leg.rotation.z = lerp(leg.rotation.z, -0.1 * s, 0.35);
        shin.rotation.x = lerp(shin.rotation.x, 0, 0.3);
        foot.rotation.set(lerp(foot.rotation.x, 0, 0.3), lerp(foot.rotation.y, 0, 0.3), lerp(foot.rotation.z, 0, 0.3));
      }    }
  });

  const bruise = Math.min(1, Math.max(0, wear));
  const heavy = loadout.body === 'heavy';
  // A heavyweight wears them higher and wider, so the gut sits in the waistband.
  const waist = heavy
    ? { r: 0.24, flare: -0.02, trunksY: 0.485, trunksH: 0.31, bandY: 0.665 }
    : { r: 0.2, flare: 0.024, trunksY: 0.465, trunksH: 0.27, bandY: 0.63 };

  const arm = (side: 1 | -1, up: React.RefObject<THREE.Group>, fore: React.RefObject<THREE.Group>) => (
    <>
      <group ref={up}>
        <mesh material={mats.body} castShadow>
          <sphereGeometry args={[0.092, 16, 12]} />
        </mesh>
        <mesh position={[0, -UPPER / 2, 0]} scale={[1.05, 1, 1]} material={mats.body} castShadow>
          <capsuleGeometry args={[0.078, UPPER - 0.1, 8, 14]} />
        </mesh>
      </group>
      <group ref={fore}>
        <mesh material={mats.body} castShadow>
          <sphereGeometry args={[0.074, 14, 12]} />
        </mesh>
        <mesh position={[0, -(FORE - 0.13) / 2, 0]} material={mats.body} castShadow>
          <capsuleGeometry args={[0.07, FORE - 0.2, 8, 14]} />
        </mesh>
        <Glove s={side} glove={mats.gloves} cuff={mats.cuff} />
      </group>
    </>
  );

  return (
    <group
      rotation={[0, faceCamera ? 0 : facing * (Math.PI / 2), 0]}
      scale={[scale.x, scale.y, scale.z]}
    >
      <group ref={root}>
        {([-1, 1] as const).map((s) => (
          <group key={s} ref={s < 0 ? hipL : hipR} position={[HIP_X * s, HIP_Y, s < 0 ? HIP.z : -HIP.z]}>
            <group ref={s < 0 ? legL : legR} rotation={[0, 0, -0.1 * s, 'ZXY']}>
              <mesh position={[0, -0.1, 0]} material={mats.body} castShadow>
                <capsuleGeometry args={[0.066, THIGH - 0.1, 6, 12]} />
              </mesh>
              <group ref={s < 0 ? shinL : shinR} position={[0, -THIGH, 0]}>
                <mesh material={mats.body} castShadow>
                  <sphereGeometry args={[0.064, 14, 10]} />
                </mesh>
                <mesh position={[0, -SHIN / 2, 0]} material={mats.body} castShadow>
                  <capsuleGeometry args={[0.06, SHIN - 0.08, 6, 12]} />
                </mesh>
                <group position={[0, -SHIN, 0]}>
                  <BootShaft shoe={mats.shoe} sole={mats.sole} stripe={mats.stripe} />
                </group>
                <group ref={s < 0 ? footL : footR} position={[0, -SHIN, 0]} rotation={[0, 0, 0, 'XZY']}>
                  <Sneaker shoe={mats.shoe} sole={mats.sole} stripe={mats.stripe} />
                </group>
              </group>
            </group>
          </group>
        ))}

        {/* One loose piece, open at the hem, so a lifted knee comes out from under it. */}
        <mesh position={[0, waist.trunksY, 0]} material={mats.trunks} castShadow>
          <cylinderGeometry args={[waist.r, waist.r + waist.flare, waist.trunksH, 40, 1, true]} />
        </mesh>
        <mesh position={[0, waist.trunksY - waist.trunksH / 2 + 0.012, 0]} material={mats.band}>
          <cylinderGeometry args={[waist.r + waist.flare + 0.004, waist.r + waist.flare + 0.006, 0.024, 40, 1, true]} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <mesh
            key={s}
            position={[(waist.r + waist.flare / 2 + 0.002) * s, waist.trunksY + 0.005, 0]}
            rotation={[0, 0, Math.atan2(waist.flare, waist.trunksH) * s]}
            material={mats.wrap}
          >
            <boxGeometry args={[0.014, waist.trunksH - 0.035, 0.05]} />
          </mesh>
        ))}
        <mesh position={[0, waist.bandY, 0]} material={mats.band} castShadow>
          <cylinderGeometry args={[waist.r + 0.008, waist.r + 0.003, 0.085, 32]} />
        </mesh>
        {[-0.03, 0.03].map((dy) => (
          <mesh key={dy} position={[0, waist.bandY + dy, 0]} material={mats.gold}>
            <torusGeometry args={[waist.r + 0.007, 0.006, 6, 40]} />
          </mesh>
        ))}
        <group position={[0, waist.bandY, waist.r + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={mats.gold} castShadow>
            <cylinderGeometry args={[0.052, 0.052, 0.02, 28]} />
          </mesh>
          <mesh position={[0, -0.011, 0]} material={mats.band}>
            <cylinderGeometry args={[0.034, 0.034, 0.004, 24]} />
          </mesh>
        </group>
        {heavy && (
          // One round gut that runs into the chest and tucks into the waistband.
          // At the band its front stays inside the band; just above, it rolls
          // out past it, so the overhang reads without the surfaces flickering.
          <mesh position={[0, 0.8, 0.05]} scale={[1.05, 0.9, 1]} material={mats.body} castShadow>
            <sphereGeometry args={[0.22, 40, 30]} />
          </mesh>
        )}

        <group ref={torso} position={[0, TORSO_Y, 0]}>
          <mesh position={[0, 0.08, 0]} scale={[1, 0.82, 0.82]} material={mats.body} castShadow>
            <sphereGeometry args={[0.21, 36, 26]} />
          </mesh>
          {!heavy && (
            <mesh position={[0, -0.03, 0]} material={mats.wrap}>
              <cylinderGeometry args={[0.2, 0.205, 0.06, 18]} />
            </mesh>
          )}

          {arm(-1, upL, foreL)}
          {arm(1, upR, foreR)}

          <group ref={head} position={HEAD}>
            <mesh material={mats.body} castShadow>
              <sphereGeometry args={[HEAD_R, 48, 36]} />
            </mesh>
            <group ref={eyes} position={[0, 0.04, 0]}>
              {([-1, 1] as const).map((s) => (
                <group key={s} position={[0.085 * s, 0, 0.235]} rotation={[0, 0.3 * s, 0]}>
                  <mesh scale={[0.9, 1.15, 0.5]} material={mats.eyeWhite}>
                    <sphereGeometry args={[0.056, 24, 18]} />
                  </mesh>
                  <mesh position={[-0.01 * s, -0.006, 0.022]} scale={[1, 1.2, 0.6]} material={mats.ink}>
                    <sphereGeometry args={[0.034, 20, 16]} />
                  </mesh>
                  <mesh position={[-0.02 * s, 0.014, 0.043]} material={mats.eyeWhite}>
                    <sphereGeometry args={[0.011, 10, 8]} />
                  </mesh>
                  <mesh position={[0.002 * s, -0.018, 0.04]} material={mats.eyeWhite}>
                    <sphereGeometry args={[0.005, 8, 6]} />
                  </mesh>
                  {/* Upper lid, tipped in toward the nose: the fighter's scowl. */}
                  <mesh
                    position={[0, 0.012, 0.004]}
                    rotation={[-0.2, 0, 0.32 * s]}
                    scale={[0.98, 1.2, 0.56]}
                    material={mats.lid}
                  >
                    <sphereGeometry args={[0.059, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
                  </mesh>
                </group>
              ))}
            </group>
            {([-1, 1] as const).map((s) => (
              <mesh key={s} position={[0.088 * s, 0.128, 0.228]} rotation={[0.3, 0.3 * s, 0.42 * s]} scale={[1, 1, 0.7]} material={mats.ink}>
                <capsuleGeometry args={[0.02, 0.08, 6, 12]} />
              </mesh>
            ))}
            <group ref={mouth} position={[0, -0.085, 0.245]} rotation={[0.35, 0, 0]}>
              <mesh scale={[1, 0.45, 0.4]} material={mats.mouth}>
                <sphereGeometry args={[0.06, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              </mesh>
              <mesh position={[0, -0.002, 0.004]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.5]} material={mats.guard}>
                <capsuleGeometry args={[0.011, 0.075, 6, 12]} />
              </mesh>
              <mesh position={[0, 0.004, 0.01]} scale={[1, 1, 0.5]} material={mats.teeth}>
                <boxGeometry args={[0.05, 0.006, 0.01]} />
              </mesh>
            </group>
            {bruise > 0.15 && (
              <mesh position={[-0.13, 0.0, 0.21]} scale={0.5 + bruise * 0.8} material={mats.bruise}>
                <sphereGeometry args={[0.045, 10, 8]} />
              </mesh>
            )}
            <NoteFlag style={loadout.hair} mat={mats.flag} />
          </group>
        </group>
      </group>
    </group>
  );
}
