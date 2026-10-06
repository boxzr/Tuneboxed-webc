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
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c9b089';
  g.fillRect(0, 0, 512, 512);
  // Worn canvas grain.
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.fillStyle = `rgba(70, 42, 18, ${0.04 + Math.random() * 0.06})`;
    g.fillRect(x, y, 1 + Math.random() * 2, 1);
  }
  g.strokeStyle = 'rgba(50, 28, 12, 0.28)';
  g.lineWidth = 10;
  g.strokeRect(18, 18, 476, 476);
  g.lineWidth = 3;
  g.strokeRect(42, 42, 428, 428);
  // Centre ring mark.
  g.save();
  g.translate(256, 256);
  g.strokeStyle = 'rgba(40, 22, 10, 0.35)';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(0, 0, 88, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(40, 22, 10, 0.18)';
  g.font = '900 54px Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('TB', 0, 4);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
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

      {sides.map((edge, i) => {
        const midX = (edge[0][0] + edge[1][0]) / 2;
        const midZ = (edge[0][1] + edge[1][1]) / 2;
        const horizontal = Math.abs(edge[0][1] - edge[1][1]) < 0.01;
        return (
          <group key={`skirt${i}`}>
            <mesh position={[midX, -0.28, midZ]} rotation={horizontal ? [0, 0, 0] : [0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[span + 0.2, 0.56, 0.18]} />
              <meshStandardMaterial color={i % 2 ? '#1a2744' : '#4a2410'} roughness={0.55} />
            </mesh>
            <mesh position={[midX, -0.02, midZ]} rotation={horizontal ? [0, 0, 0] : [0, Math.PI / 2, 0]}>
              <boxGeometry args={[span + 0.22, 0.04, 0.2]} />
              <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
            </mesh>
            <pointLight position={[midX, 0.12, midZ]} intensity={4} distance={3.2} color="#ffd36b" />
          </group>
        );
      })}
    </group>
  );
}

/**
 * Lights, fog and the square canvas. Crowd and the jumbotron sit in FightCanvas
 * so a locker session does not pay for an arena.
 */
export default function RingScene({
  proceduralRing = true,
  studio = false,
}: {
  proceduralRing?: boolean;
  /** Create-a-fighter: a lit studio floor, no ropes cutting the silhouette. */
  studio?: boolean;
}) {
  if (studio) {
    return (
      <group>
        <color attach="background" args={['#0c0a12']} />
        <hemisphereLight args={['#8a7aa8', '#1a1020', 0.42]} />
        <ambientLight intensity={0.28} />
        <spotLight position={[0, 5.4, 2.4]} angle={0.42} penumbra={0.55} intensity={70} distance={12} color="#fff4e0" />
        <spotLight position={[-2.4, 3.2, 1.6]} angle={0.5} penumbra={0.7} intensity={22} distance={8} color="#4ea8ff" />
        <spotLight position={[2.4, 3.2, 1.6]} angle={0.5} penumbra={0.7} intensity={22} distance={8} color="#ff9a3c" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <circleGeometry args={[3.4, 48]} />
          <meshStandardMaterial color="#16121c" roughness={0.72} metalness={0.08} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[1.05, 1.12, 48]} />
          <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.35} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.6, -2.4]}>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial color="#100c16" roughness={1} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <color attach="background" args={['#07050c']} />
      <fog attach="fog" args={['#07050c', 12, 26]} />

      <hemisphereLight args={['#6b5a8a', '#1a1020', 0.34]} />
      <ambientLight intensity={0.18} />
      <spotLight position={[0, 7.5, 1.2]} angle={0.52} penumbra={0.45} intensity={62} distance={16} color="#fff4e0" />
      <directionalLight
        position={[4, 8, 4]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight position={[-3.2, 5.2, -4.6]} angle={0.5} penumbra={0.7} intensity={38} distance={14} color="#9cc9ff" />
      <spotLight position={[3.2, 5.2, -4.6]} angle={0.5} penumbra={0.7} intensity={38} distance={14} color="#ffc48a" />
      <spotLight position={[-4, 7, 2]} angle={0.45} intensity={18} color="#4ea8ff" penumbra={0.5} />
      <spotLight position={[4, 7, 2]} angle={0.45} intensity={18} color="#ff9a3c" penumbra={0.5} />
      <pointLight position={[0, 4.2, -2]} intensity={14} color="#f4efe6" distance={14} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <circleGeometry args={[14, 48]} />
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
