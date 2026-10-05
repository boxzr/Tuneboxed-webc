import { useMemo } from 'react';
import * as THREE from 'three';

/** Half-width of the post centers. Camera sits just inside the near ropes. */
export const RING_HALF = 2.58;
const POSTS: [number, number][] = [
  [-RING_HALF, -RING_HALF],
  [RING_HALF, -RING_HALF],
  [RING_HALF, RING_HALF],
  [-RING_HALF, RING_HALF],
];
const ROPE_Y = [0.5, 0.96, 1.42] as const;
const ROPE_COLOR = ['#009ffd', '#fd9c07', '#f4efe6'] as const;

function canvasTex() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c4b49a';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(40, 24, 12, 0.2)';
  g.lineWidth = 3;
  g.strokeRect(10, 10, 236, 236);
  g.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.rect(18 + i * 18, 18 + i * 18, 220 - i * 36, 220 - i * 36);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function RopeSpan({
  from,
  to,
  y,
  radius,
  color,
}: {
  from: [number, number];
  to: [number, number];
  y: number;
  radius: number;
  color: string;
}) {
  const start = new THREE.Vector3(from[0], y, from[1]);
  const end = new THREE.Vector3(to[0], y, to[1]);
  const dir = end.clone().sub(start);
  const len = dir.length();
  const pos = start.clone().add(end).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 8]} />
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.08} />
    </mesh>
  );
}

function Post({ x, z, pad }: { x: number; z: number; pad: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 1.84, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.1, 0.16, 8]} />
        <meshStandardMaterial color={pad} roughness={0.45} />
      </mesh>
      {ROPE_Y.map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.16, 0.1, 0.16]} />
          <meshStandardMaterial color="#1a1520" metalness={0.35} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function ProceduralRing() {
  const floor = useMemo(() => canvasTex(), []);
  const span = RING_HALF * 2;
  const sides: [[number, number], [number, number]][] = [
    [POSTS[0], POSTS[1]],
    [POSTS[1], POSTS[2]],
    [POSTS[2], POSTS[3]],
    [POSTS[3], POSTS[0]],
  ];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[span + 1.35, span + 1.35]} />
        <meshStandardMaterial color="#3a2416" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[span - 0.12, span - 0.12]} />
        <meshStandardMaterial map={floor} roughness={0.82} metalness={0.04} />
      </mesh>

      <Post x={-RING_HALF} z={-RING_HALF} pad="#1d4ed8" />
      <Post x={RING_HALF} z={-RING_HALF} pad="#ea580c" />
      <Post x={RING_HALF} z={RING_HALF} pad="#ea580c" />
      <Post x={-RING_HALF} z={RING_HALF} pad="#1d4ed8" />

      {sides.flatMap((edge, i) =>
        ROPE_Y.map((y, ri) => (
          <RopeSpan
            key={`r${i}${ri}`}
            from={edge[0]}
            to={edge[1]}
            y={y}
            radius={0.032}
            color={ROPE_COLOR[ri]}
          />
        ))
      )}
    </group>
  );
}

/**
 * Lights, fog and the square canvas. Crowd and the jumbotron sit in FightCanvas
 * so a locker session does not pay for an arena.
 */
export default function RingScene({
  proceduralRing = true,
}: {
  proceduralRing?: boolean;
}) {
  return (
    <group>
      <color attach="background" args={['#07050c']} />
      <fog attach="fog" args={['#07050c', 14, 28]} />

      <hemisphereLight args={['#6b5a8a', '#1a1020', 0.3]} />
      <ambientLight intensity={0.14} />
      <spotLight position={[0, 7.5, 1.2]} angle={0.52} penumbra={0.45} intensity={55} distance={16} color="#fff4e0" />
      <directionalLight
        position={[4, 8, 4]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-4, 7, 2]} angle={0.45} intensity={16} color="#4ea8ff" penumbra={0.5} />
      <spotLight position={[4, 7, 2]} angle={0.45} intensity={16} color="#ff9a3c" penumbra={0.5} />
      <pointLight position={[0, 4.2, -2]} intensity={12} color="#f4efe6" distance={14} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <circleGeometry args={[11, 32]} />
        <meshStandardMaterial color="#100c14" roughness={1} />
      </mesh>

      {proceduralRing && <ProceduralRing />}
    </group>
  );
}

export function PunchingBag() {
  return (
    <group position={[0, 1.15, -1.35]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.28, 0.85, 6, 12]} />
        <meshStandardMaterial color="#7a1f1f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
