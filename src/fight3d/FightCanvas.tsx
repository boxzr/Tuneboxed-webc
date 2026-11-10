import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import BoxerRig, { headWorldY } from './BoxerRig';
import RingScene from './RingScene';
import Referee, { type RefCall } from './Referee';
import Nametag from './Nametag';
import RingScoreboard, { type ScoreboardData } from './Scoreboard';
import ArenaCrowd, { houseFans, type CrowdPerson } from './ArenaCrowd';
import type { FighterLoadout } from './loadout';
import { isKnockdown, type BoxerPose } from './punchDirector';
import { comboContacts, contactAt, weightOf, type MotionPunch } from './motion';
import Walkout, { type Walker } from './Walkout';
import type { Dance } from './dances';
import './fight3d.css';

export interface RingFighter {
  name: string;
  loadout: FighterLoadout;
  pose: BoxerPose;
  /** Bumps on every punch, so a second jab in a row replays instead of freezing. */
  beat?: number;
  /** Punches in the combo, when the pose is `combo`. */
  hits?: number;
  songTitle?: string;
  votes?: number;
  /** Danced whenever the pose is `taunt`, and as the victory celebration. */
  dance?: Dance | null;
}

type RingMode = 'bout' | 'locker' | 'parade' | 'walkout';

export interface Shot {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

/**
 * The TV camera: low, just outside the near ropes. Far enough back that both
 * boxers are in frame from their boots to the note on their heads; any closer
 * and the picture is two cropped torsos rather than a fight.
 */
const CAMERA: Record<RingMode, Shot> = {
  bout: { position: [0.06, 1.2, 2.85], lookAt: [0, 0.94, 0], fov: 40 },
  locker: { position: [0, 1.0, 3.7], lookAt: [0, 0.74, 0], fov: 36 },
  parade: { position: [0, 1.9, 7.1], lookAt: [0, 0.95, 0.2], fov: 34 },
  walkout: { position: [0, 2, -6], lookAt: [0, 1.4, -13], fov: 42 },
};

/** Before the bell: a wider, higher establishing shot that dollies in to the bout framing. */
const INTRO_SHOT: Shot = { position: [1.25, 1.75, 3.7], lookAt: [0, 0.95, 0], fov: 42 };
/**
 * After the bell on a decision: a slow drift toward the middle of the ring,
 * aimed low so both boxers stand in the upper part of the picture and the
 * winner's lower third has the canvas to itself.
 */
const RESULT_SHOT: Shot = { position: [0, 1.32, 2.95], lookAt: [0, 0.78, 0], fov: 40 };
/** Half-width, in metres, the bout shot keeps in frame so a narrow ring still shows both corners. */
const BOUT_HALF_WIDTH = 1.25;
/**
 * Fraction of the frame the walkout picture is shifted up, so the boxer stands
 * clear of the lower third along the bottom edge.
 */
const WALKOUT_LIFT = 0.13;
/** Real seconds the world freezes when a heavy punch lands. */
const HIT_STOP_S = 0.075;
/** Real seconds of slow motion as the loser hits the canvas. */
const KO_SLOW_S = 1.8;

/** World X of each corner. Close enough that a full extension meets the chin. */
const CORNER_X = 0.55;

function asPunch(pose?: BoxerPose): MotionPunch | undefined {
  if (
    pose === 'jab' ||
    pose === 'cross' ||
    pose === 'hook' ||
    pose === 'body' ||
    pose === 'uppercut' ||
    pose === 'flurry'
  )
    return pose;
}

function wearFrom(self?: number, other?: number): number {
  const a = Math.max(0, self ?? 0);
  const b = Math.max(0, other ?? 0);
  const total = a + b;
  if (total <= 0) return 0;
  return Math.min(1, b / total);
}

const EMPTY_FANS: CrowdPerson[] = [];

function punchWeight(kind: MotionPunch): number {
  if (kind === 'flurry') return 1.12;
  if (kind === 'uppercut') return 0.95;
  if (kind === 'hook') return 0.72;
  if (kind === 'cross') return 0.6;
  if (kind === 'body') return 0.62;
  return 0.48;
}

interface Contact {
  level: number;
  /** World position of the head that got hit. */
  x: number;
  y: number;
  key: number;
}

/**
 * Impact fires when the glove arrives, not when the punch is thrown, so the
 * flash, shake and the other corner's reaction all line up with contact.
 */
/** Every glove arrival from this boxer's current move, in seconds, with how hard it lands. */
function contactsOf(attacker?: RingFighter): { at: number; kind: MotionPunch; level: number }[] {
  if (!attacker) return [];
  const speed = weightOf(attacker.loadout.body).speed;
  if (attacker.pose === 'combo') {
    const list = comboContacts(attacker.hits ?? 3);
    return list.map((c, i) => ({
      at: c.at / speed,
      kind: c.kind,
      level: i === list.length - 1 ? 1.2 + list.length * 0.08 : 0.55 + i * 0.12,
    }));
  }
  const kind = asPunch(attacker.pose);
  return kind ? [{ at: contactAt(kind) / speed, kind, level: punchWeight(kind) }] : [];
}

function useContact(a?: RingFighter, b?: RingFighter, live = true): Contact {
  const [hit, setHit] = useState<Contact>({ level: 0, x: 0, y: 1.5, key: 0 });
  const moveA = a?.pose;
  const moveB = b?.pose;
  const ko = isKnockdown(a?.pose ?? 'idle') || isKnockdown(b?.pose ?? 'idle');

  useEffect(() => {
    if (!live || !a || !b) return;
    const timers: number[] = [];
    const land = (attacker: RingFighter, defender: RingFighter, x: number) => {
      const list = contactsOf(attacker);
      list.forEach((c) => {
        const at = c.at * 1000;
        timers.push(
          window.setTimeout(
            () =>
              setHit((h) => ({
                level: c.level,
                x,
                y: headWorldY(defender.loadout) - (c.kind === 'body' ? 0.42 : 0),
                key: h.key + 1,
              })),
            at
          )
        );
        timers.push(window.setTimeout(() => setHit((h) => ({ ...h, level: 0 })), at + (list.length > 1 ? 170 : 260)));
      });
    };
    land(a, b, CORNER_X - 0.08);
    land(b, a, -CORNER_X + 0.08);
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveA, moveB, a?.beat, live]);

  useEffect(() => {
    if (ko && live) setHit((h) => ({ ...h, level: 1.35, key: h.key + 1 }));
  }, [ko, live]);

  return hit;
}

function CameraAim({
  mode,
  impact,
  ko,
  call,
  reduced,
  still,
}: {
  mode: RingMode;
  /** Replaces the locker or parade framing. */
  still?: Shot;
  impact: number;
  /** The corner on the canvas, if anyone is. */
  ko: 'a' | 'b' | null;
  call: RefCall;
  /** Cut straight to each shot, no shake. */
  reduced: boolean;
}) {
  const { camera, size } = useThree();
  const shake = useRef(0);
  const zoom = useRef(0);
  const prevImpact = useRef(0);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const fov = useRef(CAMERA[mode].fov);
  const snap = useRef(true);
  const want = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    if (!persp.isPerspectiveCamera) return;
    // The offset is given in real pixels: three.js sets the camera's aspect to
    // fullWidth / fullHeight here, so a 1 x 1 "frame" squashed every walkout
    // to a square picture stretched across a wide canvas.
    if (mode === 'walkout') {
      persp.setViewOffset(size.width, size.height, 0, WALKOUT_LIFT * size.height, size.width, size.height);
    } else {
      persp.clearViewOffset();
      persp.aspect = size.width / Math.max(1, size.height);
      persp.updateProjectionMatrix();
    }
    snap.current = true;
  }, [camera, mode, size.width, size.height]);

  useFrame(({ clock }, dt) => {
    if (mode === 'walkout') return;
    const step = Math.min(0.05, Math.max(0.001, dt || 0.016));
    if (impact > prevImpact.current + 0.08) {
      shake.current = Math.min(0.85, impact * 0.55);
      zoom.current = Math.min(1.6, 0.3 + impact * 0.8);
    }
    prevImpact.current = impact;
    shake.current *= Math.pow(0.06, step);
    zoom.current *= Math.pow(0.12, step);

    const t = clock.elapsedTime;
    const shot =
      mode === 'bout' && call === 'intro'
        ? INTRO_SHOT
        : mode === 'bout' && call === 'over' && !ko
          ? RESULT_SHOT
          : mode !== 'bout' && still
            ? still
            : CAMERA[mode];
    want.pos.set(...shot.position);
    want.look.set(...shot.lookAt);
    let wantFov = shot.fov;
    let rate = 0.12;
    if (mode === 'bout' && ko) {
      // Low, on the loser, who falls away from the other corner; drifting slowly across them.
      const s = ko === 'a' ? -1 : 1;
      want.pos.set(s * 0.45 + Math.sin(t * 0.3) * 0.2, 1.0, 2.55);
      want.look.set(s * (CORNER_X + 0.3), 0.4, 0);
      wantFov = 40;
      rate = 0.35;
    } else if (mode === 'bout' && call === 'intro') {
      rate = 0.4;
    }
    if (mode === 'bout') {
      const aspect = size.width / Math.max(1, size.height);
      const dist = want.pos.distanceTo(want.look);
      const fit = THREE.MathUtils.radToDeg(2 * Math.atan(BOUT_HALF_WIDTH / (dist * aspect)));
      if (!ko) wantFov = Math.max(wantFov, Math.min(68, fit));
    }
    const k = snap.current || reduced ? 1 : 1 - Math.pow(rate, step);
    snap.current = false;
    pos.current.lerp(want.pos, k);
    look.current.lerp(want.look, k);
    fov.current += (wantFov - fov.current) * k;
    if (reduced) shake.current = zoom.current = 0;

    const j = shake.current * 0.04;
    camera.position.set(
      pos.current.x + Math.sin(t * 72) * j,
      pos.current.y + Math.cos(t * 55) * j * 0.4,
      pos.current.z - zoom.current * 0.04
    );
    camera.lookAt(look.current);
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      persp.fov = fov.current - zoom.current;
      persp.updateProjectionMatrix();
    }
  });
  return null;
}

/**
 * Hit-stop and the knockout slow motion. Everything in the ring animates off
 * the shared clock, so slowing that clock slows the whole fight at once
 * without a postprocessing pass. Runs before every other frame callback.
 */
function TimeWarp({ hit, ko }: { hit: Contact; ko: boolean }) {
  const hold = useRef(0);
  const slow = useRef(0);
  useEffect(() => {
    if (hit.level >= 0.9) hold.current = HIT_STOP_S;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hit.key]);
  useEffect(() => {
    if (ko) slow.current = KO_SLOW_S;
  }, [ko]);
  useFrame(({ clock }, dt) => {
    const step = Math.min(0.05, Math.max(0, dt || 0));
    let scale = 1;
    if (hold.current > 0) {
      hold.current -= step;
      scale = 0.05;
    } else if (slow.current > 0) {
      slow.current = Math.max(0, slow.current - step);
      const p = 1 - slow.current / KO_SLOW_S;
      scale = 0.28 + 0.72 * p * p;
    }
    if (scale < 1) clock.elapsedTime -= step * (1 - scale);
  }, -1);
  return null;
}

function ImpactBurst({ hit }: { hit: Contact }) {
  const active = hit.level > 0;
  const heavy = hit.level >= 0.9;
  const mesh = useRef<THREE.Mesh>(null);
  const star = useRef<THREE.Group>(null);
  const age = useRef(1);
  const was = useRef(false);
  useFrame((_, dt) => {
    if (active && !was.current) age.current = 0;
    was.current = active;
    if (age.current < 1) age.current = Math.min(1, age.current + dt * (heavy ? 3.8 : 5.4));
    const p = age.current;
    if (mesh.current) {
      mesh.current.scale.setScalar(0.12 + p * (heavy ? 0.7 : 0.5));
      (mesh.current.material as THREE.MeshBasicMaterial).opacity = active || p < 1 ? (1 - p) * 0.85 : 0;
    }
    if (star.current) {
      star.current.rotation.z = p * 2.2;
      star.current.scale.setScalar(0.22 + p * 0.55);
      star.current.visible = p < 0.85;
    }
  });
  return (
    <group position={[hit.x, hit.y, 0.02]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial color="#fff3b0" transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={star}>
        <mesh rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.05, 0.38, 0.05]} />
          <meshBasicMaterial color="#ffe566" transparent opacity={0.9} depthWrite={false} />
        </mesh>
        <mesh rotation={[0, 0, -0.7]}>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshBasicMaterial color="#fff8e8" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** The creator's stage: a lit plinth the fighter turns on. */
function Turntable({ yaw, children }: { yaw: number; children: React.ReactNode }) {
  const spin = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const footShadow = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => footShadow.dispose(), [footShadow]);
  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = THREE.MathUtils.lerp(spin.current.rotation.y, yaw, 0.12);
    if (ring.current) ring.current.emissiveIntensity = 1.6 + Math.sin(clock.elapsedTime * 2.2) * 0.5;
  });
  return (
    <group position={[0, 0, 0.35]}>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.62, 0.68, 0.06, 64]} />
        <meshStandardMaterial color="#17121f" roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.012, 8, 96]} />
        <meshStandardMaterial ref={ring} color="#fd9c07" emissive="#fd9c07" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.064, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshBasicMaterial map={footShadow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* The soles' underside is ~1 cm above the rig's origin, so the rig sits that much below the deck. */}
      <group ref={spin} position={[0, 0.05, 0]}>
        {children}
      </group>
    </group>
  );
}

function Scene({
  mode,
  a,
  b,
  parade,
  call,
  hit,
  fans,
  board,
  walker,
  walkSeconds,
  walkOffset,
  lockerYaw,
}: {
  mode: RingMode;
  a?: RingFighter;
  b?: RingFighter;
  parade?: RingFighter[];
  call: RefCall;
  hit: Contact;
  fans: CrowdPerson[];
  board: ScoreboardData | null;
  walker?: Walker;
  walkSeconds: number;
  walkOffset: number;
  lockerYaw: number;
}) {
  const crowd = useMemo(() => {
    const taken = new Set(
      [a?.name, b?.name, ...fans.map((f) => f.name)].filter((n): n is string => Boolean(n)).map((n) => n.toLowerCase())
    );
    const extras = houseFans([...taken]).filter((f) => !taken.has(f.name.toLowerCase()));
    return [...fans.map((f) => ({ ...f, named: true })), ...extras].slice(0, 8);
  }, [a?.name, b?.name, fans]);

  if (mode === 'walkout') {
    return walker ? (
      <Suspense fallback={null}>
        <Walkout key={`${walker.side}-${walker.name}`} walker={walker} duration={walkSeconds} offset={walkOffset} />
      </Suspense>
    ) : null;
  }

  const headA = a ? headWorldY(a.loadout) : 1.15;
  const headB = b ? headWorldY(b.loadout) : 1.15;
  const timesFrom = (attacker?: RingFighter) => {
    const list = contactsOf(attacker);
    return list.length ? list.map(({ at, kind }) => ({ at, kind })) : undefined;
  };

  return (
    <>
      <RingScene studio={mode === 'locker'} proceduralRing={mode !== 'locker'} />
      {mode === 'bout' && (
        <Suspense fallback={null}>
          <ArenaCrowd people={crowd} hype={Math.min(1.2, hit.level + 0.15)} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        {mode === 'locker' && a && (
          <Turntable yaw={lockerYaw}>
            <BoxerRig loadout={a.loadout} pose={a.pose} beat={a.beat} facing={1} faceCamera dance={a.dance} />
          </Turntable>
        )}
        {mode === 'bout' && a && b && (
          <>
            <group position={[-CORNER_X, 0, 0]}>
              <BoxerRig
                loadout={a.loadout}
                pose={a.pose}
                beat={a.beat}
                facing={1}
                dance={a.dance}
                hits={a.hits}
                hitTimes={timesFrom(b)}
                foe={[CORNER_X, headB, 0]}
                wear={wearFrom(a.votes, b.votes)}
              />
            </group>
            <group position={[CORNER_X, 0, 0]}>
              <BoxerRig
                loadout={b.loadout}
                pose={b.pose}
                beat={b.beat}
                facing={-1}
                dance={b.dance}
                hits={b.hits}
                hitTimes={timesFrom(a)}
                foe={[-CORNER_X, headA, 0]}
                wear={wearFrom(b.votes, a.votes)}
              />
            </group>
            <Referee call={call} />
            <ImpactBurst hit={hit} />
            {board && <RingScoreboard {...board} />}
          </>
        )}
        {mode === 'parade' &&
          (parade ?? []).slice(0, 8).map((f, i, all) => {
            const span = Math.min(all.length, 8);
            const x = span === 1 ? 0 : (i - (span - 1) / 2) * 1.15;
            return (
              <group key={`${f.name}-${i}`} position={[x, 0, 0.4]}>
                <BoxerRig loadout={f.loadout} pose={f.pose} facing={1} faceCamera />
                <Nametag name={f.name} y={1.85} width={0.9} />
              </group>
            );
          })}
      </Suspense>
    </>
  );
}

/**
 * One WebGL ring, reused by the homepage demo, the lobby locker, the room
 * and the stream board.
 */
export default function FightCanvas({
  mode,
  a,
  b,
  parade,
  className = '',
  call = 'fight',
  fans = EMPTY_FANS,
  board = null,
  walker,
  walkSeconds = 30,
  walkOffset = 0,
  lockerYaw = 0,
  shot,
}: {
  mode: RingMode;
  a?: RingFighter;
  b?: RingFighter;
  parade?: RingFighter[];
  className?: string;
  call?: RefCall;
  fans?: CrowdPerson[];
  board?: ScoreboardData | null;
  /** Who is entering, in walkout mode. */
  walker?: Walker;
  walkSeconds?: number;
  /** Seconds into the walker's song. */
  walkOffset?: number;
  /** Turntable angle in locker mode, radians. */
  lockerYaw?: number;
  /**
   * A closer framing for the locker or the line-up, for a page that shows a
   * boxer or two rather than a full room. The stock shots stay as they are.
   */
  shot?: Shot;
}) {
  const [live, setLive] = useState(true);
  // Fixed for the life of the canvas. New options make R3F swap in a fresh
  // camera without sizing it, which stretched the ring after every walkout;
  // CameraAim and Walkout move this one every frame instead.
  const [cameraOptions] = useState(() => ({
    position: CAMERA[mode].position,
    fov: CAMERA[mode].fov,
    near: 0.12,
    far: 40,
  }));
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hit = useContact(a, b, mode === 'bout');
  const impact = mode === 'bout' ? hit.level : 0;
  const ko: 'a' | 'b' | null =
    mode !== 'bout' ? null : isKnockdown(a?.pose ?? 'idle') ? 'a' : isKnockdown(b?.pose ?? 'idle') ? 'b' : null;

  useEffect(() => {
    const onVis = () => setLive(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div className={`ring3d ring3d--${mode} ${className}`.trim()}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={live && !reduced ? 'always' : 'demand'}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={cameraOptions}
      >
        <CameraAim mode={mode} impact={impact} ko={ko} call={call} reduced={reduced} still={shot} />
        {mode === 'bout' && !reduced && <TimeWarp hit={hit} ko={ko !== null} />}
        <Scene
          mode={mode}
          a={a}
          b={b}
          parade={parade}
          call={call}
          hit={hit}
          fans={fans}
          board={board}
          walker={walker}
          walkSeconds={walkSeconds}
          walkOffset={walkOffset}
          lockerYaw={lockerYaw}
        />
      </Canvas>
    </div>
  );
}
