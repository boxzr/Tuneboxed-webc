import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import BoxerRig from './BoxerRig';
import { PLAN, walkPlan, type WalkStyle } from './walkStyles';
import type { Dance } from './dances';
import MascotCrowd, { Risers, standSeats, type Seat } from './MascotCrowd';
import RingScene, { RING_HALF } from './RingScene';
import type { FighterLoadout } from './loadout';
import type { BoxerPose } from './punchDirector';

export interface Walker {
  side: 'a' | 'b';
  name: string;
  loadout: FighterLoadout;
  songTitle?: string;
  songArtist?: string;
  artworkUrl?: string | null;
  style?: WalkStyle;
  /** Signature dance, on stage and at the apron. */
  dance?: Dance;
  /** The second dance, mid-aisle. */
  encore?: Dance;
}

export const SIDE_ACCENT = { a: '#3b9eff', b: '#fd7a1a' } as const;

const STAGE_Z = -13;
const APRON_Z = -(RING_HALF + 2.3);
/** Camera stays on the aisle side of the back ropes. */
const CAM_MAX_Z = -(RING_HALF + 0.2);
const AISLE_HALF = 1.0;
const WALK_FOV = 38;
const WALK_FOV_CLOSE = 52;
const WALK_FOG: [number, number] = [8, 24];
const RAMP_Y = 0.32;
const { stageEnd: STAGE_END, pauseStart: PAUSE_START, pauseEnd: PAUSE_END, arrive: ARRIVE } = PLAN;

function aisleSeats(): Seat[] {
  const out: Seat[] = [];
  for (const s of [-1, 1]) {
    for (let r = 0; r < 5; r++) {
      const x = s * (AISLE_HALF + 0.72 + r * 0.5);
      for (let z = STAGE_Z + 1.8 + (r % 2) * 0.2; z < -(RING_HALF + 0.8); z += 0.4) {
        out.push({ x, y: r * 0.3 + 0.12, z, yaw: Math.atan2(-x, 0.6) });
      }
    }
  }
  return out;
}

/** Cover art, or a record sleeve in the corner's colour when there is none. */
function drawCover(g: CanvasRenderingContext2D, x: number, y: number, size: number, art: HTMLImageElement | null, accent: string) {
  if (art) {
    g.drawImage(art, x, y, size, size);
    return;
  }
  g.fillStyle = '#0b0910';
  g.fillRect(x, y, size, size);
  const cx = x + size / 2;
  const cy = y + size / 2;
  g.fillStyle = '#16131c';
  g.beginPath();
  g.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let r = size * 0.18; r < size * 0.42; r += 6) {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = accent;
  g.beginPath();
  g.arc(cx, cy, size * 0.14, 0, Math.PI * 2);
  g.fill();
}

/**
 * The titantron shows the walker's cover and nothing else. Their name and
 * song are already on the lower third; printing them again up here is what
 * made the entrance read as two competing title cards.
 */
function paintTron(c: HTMLCanvasElement, accent: string, art: HTMLImageElement | null) {
  const g = c.getContext('2d')!;
  const W = c.width;
  const H = c.height;
  g.fillStyle = '#05040a';
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.6);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, 'rgba(5,4,10,0)');
  g.globalAlpha = 0.32;
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;

  const size = H * 0.8;
  g.shadowColor = accent;
  g.shadowBlur = 60;
  drawCover(g, (W - size) / 2, (H - size) / 2, size, art, accent);
  g.shadowBlur = 0;

  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 5) g.fillRect(0, y, W, 2);
}

/** Titantron texture, repainted once the cover art arrives. */
function useTitantron(artworkUrl: string | null | undefined, accent: string) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 560;
    paintTron(canvas, accent, null);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return { canvas, map };
  }, [accent]);

  useEffect(() => {
    if (!artworkUrl) return;
    let live = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!live) return;
      paintTron(tex.canvas, accent, img);
      tex.map.needsUpdate = true;
    };
    img.src = artworkUrl.replace(/\/\d+x\d+bb\./, '/600x600bb.');
    return () => {
      live = false;
    };
  }, [tex, accent, artworkUrl]);

  useEffect(() => () => tex.map.dispose(), [tex]);
  return tex.map;
}

/** Pyro fountain. Fires while `active`, particles fall out on their own. */
function Sparks({ at, color, active }: { at: [number, number, number]; color: string; active: boolean }) {
  const COUNT = 160;
  const state = useMemo(
    () => ({
      pos: new Float32Array(COUNT * 3),
      vel: new Float32Array(COUNT * 3),
      life: new Float32Array(COUNT).fill(0),
      next: 0,
    }),
    []
  );
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(state.pos, 3));
    return g;
  }, [state]);

  useFrame((_, dt) => {
    const step = Math.min(0.05, dt || 0.016);
    if (active) {
      for (let k = 0; k < 6; k++) {
        const i = state.next;
        state.next = (state.next + 1) % COUNT;
        state.pos.set([0, 0, 0], i * 3);
        state.vel.set([(Math.random() - 0.5) * 1.4, 4 + Math.random() * 2.5, (Math.random() - 0.5) * 1.4], i * 3);
        state.life[i] = 1;
      }
    }
    for (let i = 0; i < COUNT; i++) {
      if (state.life[i] <= 0) {
        state.pos[i * 3 + 1] = -100;
        continue;
      }
      state.life[i] -= step * 0.9;
      state.vel[i * 3 + 1] -= 9 * step;
      state.pos[i * 3] += state.vel[i * 3] * step;
      state.pos[i * 3 + 1] += state.vel[i * 3 + 1] * step;
      state.pos[i * 3 + 2] += state.vel[i * 3 + 2] * step;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points position={at} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        color={color}
        size={0.07}
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function Spot({
  from,
  color,
  target,
  sweep = 0,
}: {
  from: [number, number, number];
  color: string;
  target: THREE.Object3D;
  sweep?: number;
}) {
  const light = useRef<THREE.SpotLight>(null);
  const aim = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (light.current) light.current.target = sweep ? aim : target;
  }, [target, aim, sweep]);
  useFrame(({ clock }) => {
    if (!sweep) return;
    const t = clock.elapsedTime;
    aim.position.set(Math.sin(t * 0.9 + sweep) * 2.2, 0, target.position.z + Math.cos(t * 0.7 + sweep) * 2);
    aim.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={aim} />
      <spotLight ref={light} position={from} angle={0.2} penumbra={0.6} intensity={60} distance={30} color={color} />
    </>
  );
}

type Shot = 'stage' | 'lead' | 'crowd' | 'side' | 'apron';

function shotFor(p: number): Shot {
  if (p < STAGE_END) return 'stage';
  if (p < PAUSE_START) return 'lead';
  if (p < PAUSE_END) return 'crowd';
  if (p < ARRIVE) return 'side';
  return 'apron';
}

/**
 * Entrance in the spirit of the WWE 2K14 walkouts: the fighter dances on
 * stage under the titantron (their cover art), walks the ramp,
 * stops halfway to break into a second dance for the crowd, and dances again
 * at the apron as the clip runs out, while the director cuts between angles.
 *
 * Driven by the song's clock: `offset` is seconds into the preview and
 * `duration` its length, so a board that joins late lands mid-walk.
 */
export default function Walkout({
  walker,
  duration,
  offset,
}: {
  walker: Walker;
  duration: number;
  offset: number;
}) {
  const { camera } = useThree();
  const accent = SIDE_ACCENT[walker.side];
  const body = useRef<THREE.Group>(null);
  const frame = useRef<THREE.MeshStandardMaterial>(null);
  const clock = useRef({ offset, at: performance.now() });
  const poseRef = useRef<BoxerPose>('taunt');
  const shotRef = useRef<Shot | null>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const camPos = useRef(new THREE.Vector3(0, 3, STAGE_Z + 9));
  const camLook = useRef(new THREE.Vector3(0, 2, STAGE_Z));
  const aim = useMemo(() => ({ want: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  const [pose, setPose] = useState<BoxerPose>('taunt');
  const danceRef = useRef<'main' | 'encore'>('main');
  const [move, setMove] = useState<'main' | 'encore'>('main');
  const [pyro, setPyro] = useState<'stage' | 'aisle' | 'ring' | null>('stage');

  useEffect(() => {
    const now = performance.now();
    const guess = clock.current.offset + (now - clock.current.at) / 1000;
    if (Math.abs(guess - offset) > 0.75) clock.current = { offset, at: now };
  }, [offset]);

  const aisle = useMemo(aisleSeats, []);
  const stands = useMemo(() => standSeats({ inner: RING_HALF + 1.7, rows: 10, sides: ['left', 'right', 'front'] }), []);
  const tron = useTitantron(walker.artworkUrl, accent);

  useFrame(({ clock: three }, dt) => {
    const t = three.elapsedTime;
    const elapsed = clock.current.offset + (performance.now() - clock.current.at) / 1000;
    const p = Math.min(1.05, Math.max(0, elapsed / Math.max(1, duration)));
    const plan = walkPlan(p);
    const z = THREE.MathUtils.lerp(STAGE_Z + 0.2, APRON_Z, plan.along);
    const onRamp = z > APRON_Z - 0.6 ? 0 : RAMP_Y;

    const nextPose: BoxerPose = plan.move === 'dance' ? 'taunt' : 'walk';
    if (nextPose !== poseRef.current) {
      poseRef.current = nextPose;
      setPose(nextPose);
    }
    if (plan.dance !== danceRef.current) {
      danceRef.current = plan.dance;
      setMove(plan.dance);
    }
    const nextPyro =
      p < STAGE_END * 0.85
        ? 'stage'
        : p > PAUSE_START && p < PAUSE_START + 0.05
          ? 'aisle'
          : p > ARRIVE && p < ARRIVE + 0.08
            ? 'ring'
            : null;
    setPyro((cur) => (cur === nextPyro ? cur : nextPyro));

    if (body.current) {
      body.current.position.z = z;
      body.current.position.y = THREE.MathUtils.lerp(body.current.position.y, onRamp, 0.1);
    }
    target.position.set(0, 0.6, z);
    target.updateMatrixWorld();

    const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.05)), 6);
    if (frame.current) frame.current.emissiveIntensity = 0.6 + beat * 0.7;

    const shot = shotFor(p);
    const cut = shot !== shotRef.current;
    shotRef.current = shot;
    const { want, look } = aim;
    look.set(0, 1.0 + onRamp, z);
    if (shot === 'stage') {
      // Crane down off the titantron and push in on the dance.
      const k = THREE.MathUtils.smoothstep(p / STAGE_END, 0, 1);
      want.set(THREE.MathUtils.lerp(-1.1, 0.7, k), THREE.MathUtils.lerp(2.5, 1.5, k), z + THREE.MathUtils.lerp(6.8, 4.2, k));
      look.set(0, THREE.MathUtils.lerp(2.2, 1.2, k), z - 0.3);
    } else if (shot === 'lead') {
      // Dolly backing down the aisle ahead of the walker, closing in and drifting across.
      const k = (p - STAGE_END) / (PAUSE_START - STAGE_END);
      want.set(THREE.MathUtils.lerp(-0.5, 0.5, k), 1.0 + onRamp, z + THREE.MathUtils.lerp(3.8, 2.8, k));
      look.y = 1.05 + onRamp;
    } else if (shot === 'crowd') {
      // Low and in front, drifting across, so the dance reads full-length with fans behind.
      const k = (p - PAUSE_START) / (PAUSE_END - PAUSE_START);
      // Kept inside the aisle barriers, which otherwise end up between the lens and the walker.
      const drift = AISLE_HALF * 0.75;
      want.set(THREE.MathUtils.lerp(-drift, drift, k), 0.75 + onRamp, z + 2.9);
      look.y = 0.95 + onRamp;
    } else if (shot === 'side') {
      want.set(0.85, 1.25 + onRamp, Math.min(z + 2.4, CAM_MAX_Z));
    } else {
      const a = Math.min(1, (p - ARRIVE) * 5);
      want.set(-0.6 + a * 1.3, 1.45 + a * 0.3, Math.min(z + 1.9, CAM_MAX_Z));
    }
    if (cut) {
      camPos.current.copy(want);
      camLook.current.copy(look);
    } else {
      const step = Math.min(0.05, Math.max(0.001, dt || 0.016));
      camPos.current.lerp(want, 1 - Math.pow(0.08, step));
      camLook.current.lerp(look, 1 - Math.pow(0.02, step));
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
    const persp = camera as THREE.PerspectiveCamera;
    // The ropes stop the camera backing off at the apron, so those shots widen instead.
    const fov = shot === 'side' || shot === 'apron' ? WALK_FOV_CLOSE : WALK_FOV;
    if (persp.isPerspectiveCamera && persp.fov !== fov) {
      persp.fov = cut ? fov : THREE.MathUtils.lerp(persp.fov, fov, 0.1);
      if (Math.abs(persp.fov - fov) < 0.05) persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  });

  const rampLen = APRON_Z - STAGE_Z - 0.6;
  const rampMid = (STAGE_Z + APRON_Z - 0.6) / 2;

  return (
    <>
      <RingScene fog={WALK_FOG} />
      <primitive object={target} />
      <Spot from={[-3, 7, STAGE_Z + 6]} color="#ffffff" target={target} />
      <Spot from={[3, 7, STAGE_Z + 3]} color={accent} target={target} />
      <Spot from={[-4, 8, STAGE_Z - 1]} color={accent} target={target} sweep={1} />
      <Spot from={[4, 8, STAGE_Z - 1]} color={accent} target={target} sweep={2.6} />

      <mesh position={[0, RAMP_Y / 2, rampMid]} receiveShadow castShadow>
        <boxGeometry args={[AISLE_HALF * 2, RAMP_Y, rampLen]} />
        <meshStandardMaterial color="#1a1524" roughness={0.42} metalness={0.18} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const z = STAGE_Z + 1.2 + ((i + 0.5) / 14) * (rampLen - 1.6);
        return (
          <mesh key={`led${i}`} position={[0, RAMP_Y + 0.012, z]}>
            <boxGeometry args={[AISLE_HALF * 1.7, 0.01, 0.08]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        );
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const h = RAMP_Y - (i + 1) * 0.07;
        return (
          <mesh key={`step${i}`} position={[0, h / 2, APRON_Z - 0.54 + i * 0.13]} receiveShadow>
            <boxGeometry args={[AISLE_HALF * 2, h, 0.13]} />
            <meshStandardMaterial color="#221a2e" roughness={0.5} metalness={0.12} />
          </mesh>
        );
      })}
      <mesh position={[0, 7.2, rampMid]}>
        <boxGeometry args={[6.4, 0.12, rampLen + 1.4]} />
        <meshStandardMaterial color="#121018" metalness={0.55} roughness={0.4} />
      </mesh>
      {([-2.8, -1.4, 0, 1.4, 2.8] as const).map((x) => (
        <mesh key={`truss${x}`} position={[x, 6.4, rampMid]}>
          <boxGeometry args={[0.08, 1.5, 0.08]} />
          <meshStandardMaterial color="#2a2433" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <mesh position={[s * (AISLE_HALF - 0.02), RAMP_Y + 0.01, rampMid]}>
            <boxGeometry args={[0.05, 0.02, rampLen]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.4} toneMapped={false} />
          </mesh>
          <mesh position={[s * (AISLE_HALF + 0.01), RAMP_Y / 2, rampMid]}>
            <boxGeometry args={[0.02, RAMP_Y * 0.4, rampLen]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => {
            const z = STAGE_Z + 1.4 + (i / 7) * (rampLen - 2);
            return (
              <mesh key={i} position={[s * (AISLE_HALF + 0.28), 0.55, z]} castShadow>
                <boxGeometry args={[0.07, 1.1, 0.07]} />
                <meshStandardMaterial color="#2a2436" metalness={0.45} roughness={0.4} />
              </mesh>
            );
          })}
          <mesh position={[s * (AISLE_HALF + 0.28), 1.12, rampMid]} castShadow>
            <boxGeometry args={[0.05, 0.05, rampLen - 1.6]} />
            <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[s * (AISLE_HALF + 0.42), 0.7, rampMid]} rotation={[0, 0, s * 0.08]} castShadow>
            <boxGeometry args={[0.04, 0.9, rampLen - 1.8]} />
            <meshStandardMaterial color="#14101c" roughness={0.55} transparent opacity={0.55} />
          </mesh>
          <mesh position={[s * (AISLE_HALF + 0.55), 0.85, rampMid]} rotation={[0, -s * 0.12, 0]}>
            <planeGeometry args={[0.7, 1.4]} />
            <meshStandardMaterial color={s < 0 ? '#1d4ed8' : '#ea580c'} emissive={s < 0 ? '#1d4ed8' : '#ea580c'} emissiveIntensity={0.35} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0, STAGE_Z - 1.2]}>
        <mesh position={[0, RAMP_Y / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[7.4, RAMP_Y, 3]} />
          <meshStandardMaterial color="#17121f" roughness={0.6} />
        </mesh>
        <mesh position={[0, RAMP_Y + 0.01, 1.5]}>
          <boxGeometry args={[7.4, 0.04, 0.05]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>

        <mesh position={[0, 3.3, -1.32]}>
          <planeGeometry args={[7, 3.06]} />
          <meshBasicMaterial map={tron} toneMapped={false} fog={false} />
        </mesh>
        <mesh position={[0, 3.3, -1.36]}>
          <planeGeometry args={[7.12, 3.18]} />
          <meshStandardMaterial ref={frame} color={accent} emissive={accent} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 5.1, -1.3]}>
          <boxGeometry args={[12.6, 0.18, 0.2]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      </group>

      <Sparks at={[3.4, RAMP_Y, STAGE_Z - 0.2]} color={accent} active={pyro === 'stage'} />
      <Sparks at={[-3.4, RAMP_Y, STAGE_Z - 0.2]} color={accent} active={pyro === 'stage'} />
      <Sparks at={[AISLE_HALF + 0.3, 0.9, (STAGE_Z + APRON_Z) / 2]} color="#ffffff" active={pyro === 'aisle'} />
      <Sparks at={[-AISLE_HALF - 0.3, 0.9, (STAGE_Z + APRON_Z) / 2]} color="#ffffff" active={pyro === 'aisle'} />
      <Sparks at={[RING_HALF, 1.85, -RING_HALF]} color="#ffd36b" active={pyro === 'ring'} />
      <Sparks at={[-RING_HALF, 1.85, -RING_HALF]} color="#ffd36b" active={pyro === 'ring'} />

      <MascotCrowd seats={aisle} hype={0.8} dim={0.7} />
      <Risers inner={RING_HALF + 1.7} rows={10} sides={['left', 'right', 'front']} accent={accent} glow={0.6} />
      <MascotCrowd seats={stands} hype={0.5} dim={0.55} />

      <group ref={body} position={[0, RAMP_Y, STAGE_Z + 0.2]}>
        <BoxerRig
          loadout={walker.loadout}
          pose={pose}
          facing={1}
          faceCamera
          walkStyle={walker.style}
          dance={(move === 'encore' ? walker.encore : walker.dance) ?? walker.loadout.dance}
        />
      </group>
    </>
  );
}
