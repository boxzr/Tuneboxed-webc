import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface Seat {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

type Tint = 'body' | 'shirt' | 'eye' | 'ink';

interface Part {
  geo: THREE.BufferGeometry;
  tint: Tint;
  /** Local transform for a fan at rest. Hands get re-posed every frame. */
  pos: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number];
  hand?: 1 | -1;
}

const GEO = {
  head: new THREE.SphereGeometry(0.2, 12, 9),
  shirt: new THREE.CylinderGeometry(0.15, 0.19, 0.42, 10),
  stem: new THREE.CapsuleGeometry(0.03, 0.12, 3, 6),
  flag: new THREE.CapsuleGeometry(0.038, 0.12, 3, 6),
  eye: new THREE.SphereGeometry(0.032, 8, 6),
  pupil: new THREE.SphereGeometry(0.018, 6, 5),
  hand: new THREE.SphereGeometry(0.055, 8, 6),
};

const PARTS: Part[] = [
  { geo: GEO.shirt, tint: 'shirt', pos: [0, 0.5, 0], scale: [1, 1, 0.82] },
  { geo: GEO.head, tint: 'body', pos: [0, 0.88, 0.02] },
  { geo: GEO.stem, tint: 'body', pos: [0.07, 1.1, -0.06] },
  { geo: GEO.flag, tint: 'body', pos: [0.07, 1.16, -0.14], rot: [Math.PI / 2 + 0.5, 0, 0], scale: [1, 1, 0.6] },
  { geo: GEO.eye, tint: 'eye', pos: [-0.06, 0.91, 0.18], scale: [0.9, 1.15, 0.6] },
  { geo: GEO.eye, tint: 'eye', pos: [0.06, 0.91, 0.18], scale: [0.9, 1.15, 0.6] },
  { geo: GEO.pupil, tint: 'ink', pos: [-0.058, 0.905, 0.198], scale: [1, 1.2, 0.6] },
  { geo: GEO.pupil, tint: 'ink', pos: [0.058, 0.905, 0.198], scale: [1, 1.2, 0.6] },
  { geo: GEO.hand, tint: 'body', pos: [-0.17, 0.42, 0.1], hand: -1 },
  { geo: GEO.hand, tint: 'body', pos: [0.17, 0.42, 0.1], hand: 1 },
];

/** Muted note paints. A crowd reads as a mass, not as confetti. */
const BODY = ['#a8673a', '#3f6c9c', '#b9ad98', '#8c5a52', '#6d7f73', '#7b6a5c', '#5a5f78'];
/** Mostly dark street clothes, with a few people wearing a corner's colors. */
const SHIRT = ['#1b1a22', '#26232e', '#2f2b36', '#3a3440', '#24282f', '#3b2f2a', '#4a4550', '#2b3340'];
const TEAM = ['#2a5aa8', '#b45a1c'];

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const _fan = new THREE.Matrix4();
const _local = new THREE.Matrix4();
const _out = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/**
 * Stands full of TuneBoxed note fans in one draw call per body part.
 * Back rows fall off into the dark. `hype` (0..1+) gets more of them on
 * their feet with hands up.
 */
export default function MascotCrowd({ seats, hype = 0 }: { seats: Seat[]; hype?: number }) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const hypeRef = useRef(hype);
  const smoothHype = useRef(0);
  hypeRef.current = hype;

  const fans = useMemo(() => {
    const top = Math.max(0.5, ...seats.map((s) => s.y));
    return seats.map((seat, i) => {
      const shade = 0.95 - (seat.y / top) * 0.45 - hash(i + 13) * 0.12;
      const team = hash(i + 5) < 0.12;
      return {
        seat,
        shade,
        scale: 0.86 + hash(i + 7) * 0.16,
        phase: hash(i) * Math.PI * 2,
        tempo: 3.4 + hash(i + 3) * 1.6,
        eager: hash(i + 11),
        colors: {
          body: BODY[Math.floor(hash(i + 1) * BODY.length)],
          shirt: team
            ? TEAM[Math.floor(hash(i + 9) * TEAM.length)]
            : SHIRT[Math.floor(hash(i + 9) * SHIRT.length)],
          eye: '#d9d4ca',
          ink: '#0d0c12',
        } as Record<Tint, string>,
      };
    });
  }, [seats]);

  const restLocals = useMemo(
    () =>
      PARTS.map((p) => {
        _e.set(...(p.rot ?? [0, 0, 0]));
        _q.setFromEuler(_e);
        return new THREE.Matrix4().compose(
          new THREE.Vector3(...p.pos),
          _q.clone(),
          new THREE.Vector3(...(p.scale ?? [1, 1, 1]))
        );
      }),
    []
  );

  useLayoutEffect(() => {
    PARTS.forEach((p, pi) => {
      const mesh = refs.current[pi];
      if (!mesh) return;
      fans.forEach((f, i) => {
        mesh.setColorAt(i, _c.set(f.colors[p.tint]).multiplyScalar(p.tint === 'ink' ? 1 : f.shade));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [fans]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    smoothHype.current = THREE.MathUtils.lerp(smoothHype.current, hypeRef.current, 1 - Math.pow(0.05, dt || 0.016));
    const h = smoothHype.current;
    fans.forEach((f, i) => {
      const up = f.eager < 0.08 + h * 0.4;
      const bob = Math.sin(t * f.tempo + f.phase);
      const lift = up ? Math.max(0, bob) * 0.05 : bob * 0.006;
      _q.setFromAxisAngle(_p.set(0, 1, 0), f.seat.yaw + Math.sin(t * 0.5 + f.phase) * 0.06);
      _fan.compose(_p.set(f.seat.x, f.seat.y + lift, f.seat.z), _q, _s.setScalar(f.scale));
      PARTS.forEach((p, pi) => {
        const mesh = refs.current[pi];
        if (!mesh) return;
        if (p.hand) {
          const raise = up ? 0.55 + Math.max(0, Math.sin(t * f.tempo + f.phase + p.hand)) * 0.12 : 0;
          _local.makeTranslation(p.hand * (0.17 + raise * 0.08), 0.42 + raise, 0.1 + raise * 0.05);
          mesh.setMatrixAt(i, _out.multiplyMatrices(_fan, _local));
        } else {
          mesh.setMatrixAt(i, _out.multiplyMatrices(_fan, restLocals[pi]));
        }
      });
    });
    refs.current.forEach((m) => {
      if (m) m.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      {PARTS.map((p, pi) => (
        <instancedMesh
          key={`${pi}-${fans.length}`}
          ref={(m) => {
            refs.current[pi] = m;
          }}
          args={[p.geo, undefined, fans.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial roughness={p.tint === 'eye' ? 0.35 : 0.75} metalness={0} />
        </instancedMesh>
      ))}
    </group>
  );
}

/** Seats on tiered risers around a square, facing `look`. */
export function standSeats({
  inner,
  rows,
  rowDepth = 0.62,
  rise = 0.34,
  spacing = 0.46,
  sides = ['back', 'left', 'right'],
  look = [0, 0],
}: {
  inner: number;
  rows: number;
  rowDepth?: number;
  rise?: number;
  spacing?: number;
  sides?: ('back' | 'left' | 'right' | 'front')[];
  look?: [number, number];
}): Seat[] {
  const out: Seat[] = [];
  for (const side of sides) {
    for (let r = 0; r < rows; r++) {
      const d = inner + r * rowDepth;
      const half = d - 0.2;
      const n = Math.floor((half * 2) / spacing);
      for (let k = 0; k <= n; k++) {
        const u = -half + k * spacing + (r % 2 ? spacing / 2 : 0);
        if (u > half) continue;
        const jitter = (hash(out.length + 41) - 0.5) * 0.08;
        let x = 0;
        let z = 0;
        if (side === 'back') [x, z] = [u + jitter, -d];
        if (side === 'front') [x, z] = [u + jitter, d];
        if (side === 'left') [x, z] = [-d, u + jitter];
        if (side === 'right') [x, z] = [d, u + jitter];
        out.push({ x, y: r * rise + 0.12, z, yaw: Math.atan2(look[0] - x, look[1] - z) });
      }
    }
  }
  return out;
}

/** Risers under `standSeats`, so the fans are sitting on something. */
export function Risers({
  inner,
  rows,
  rowDepth = 0.62,
  rise = 0.34,
  sides = ['back', 'left', 'right'],
  accent = '#3b9eff',
}: {
  inner: number;
  rows: number;
  rowDepth?: number;
  rise?: number;
  sides?: ('back' | 'left' | 'right' | 'front')[];
  accent?: string;
}) {
  const items: { pos: [number, number, number]; size: [number, number, number] }[] = [];
  for (const side of sides) {
    for (let r = 0; r < rows; r++) {
      const d = inner + r * rowDepth;
      const len = d * 2 + rowDepth;
      const h = r * rise + 0.12;
      const horizontal = side === 'back' || side === 'front';
      const sign = side === 'back' || side === 'left' ? -1 : 1;
      const center = sign * (d + rowDepth * 0.2);
      items.push({
        pos: horizontal ? [0, h / 2, center] : [center, h / 2, 0],
        size: horizontal ? [len, h, rowDepth] : [rowDepth, h, len],
      });
    }
  }
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos} receiveShadow>
          <boxGeometry args={it.size} />
          <meshStandardMaterial color={i % 2 ? '#1b1626' : '#221b30'} roughness={0.9} />
        </mesh>
      ))}
      {sides.map((side) => {
        const horizontal = side === 'back' || side === 'front';
        const sign = side === 'back' || side === 'left' ? -1 : 1;
        const at = sign * (inner - 0.42);
        return (
          <mesh key={side} position={horizontal ? [0, 0.42, at] : [at, 0.42, 0]}>
            <boxGeometry args={horizontal ? [inner * 2, 0.16, 0.06] : [0.06, 0.16, inner * 2]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}
