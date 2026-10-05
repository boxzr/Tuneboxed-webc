import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type RefCall = 'intro' | 'fight' | 'over';

const STAND: Record<RefCall, [number, number, number]> = {
  intro: [0, 0, -0.32],
  fight: [1.5, 0, -1.2],
  over: [0, 0, -0.5],
};

function gloss(color: string, rough = 0.35, map?: THREE.Texture) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 0.5, clearcoatRoughness: 0.3, map });
}

function stripeTex() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#141018' : '#f6f3ec';
    g.fillRect(i * 16, 0, 16, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Open hand: palm, four fingers as one pad, thumb. Built hanging along -Y. */
function Hand({ s, mat }: { s: 1 | -1; mat: THREE.Material }) {
  return (
    <group position={[0, -0.2, 0]}>
      <mesh scale={[1, 1.1, 0.55]} material={mat} castShadow>
        <sphereGeometry args={[0.06, 12, 10]} />
      </mesh>
      <mesh position={[0, -0.065, 0]} scale={[1, 1, 0.5]} material={mat} castShadow>
        <capsuleGeometry args={[0.05, 0.04, 6, 10]} />
      </mesh>
      <mesh position={[-0.055 * s, -0.01, 0.02]} rotation={[0, 0, 0.6 * s]} material={mat} castShadow>
        <capsuleGeometry args={[0.02, 0.04, 4, 8]} />
      </mesh>
    </group>
  );
}

/**
 * Referee as a cream TuneBoxed note: striped shirt, bow tie, whistle, open
 * hands. Arms swing up for ROUND, chop down for LET'S FIGHT, raise at the end.
 */
export default function Referee({ call }: { call: RefCall }) {
  const root = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const callAt = useRef({ call, t: -1 });

  const mats = useMemo(() => {
    const stripes = stripeTex();
    return {
      body: gloss('#f4e8d2', 0.32),
      shirt: gloss('#ffffff', 0.55, stripes),
      pants: gloss('#16121c', 0.5),
      shoe: gloss('#0f0d14', 0.3),
      sole: gloss('#f8fafc', 0.5),
      bow: gloss('#b3121c', 0.35),
      flag: gloss('#111018', 0.25),
      whistle: new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8, roughness: 0.25 }),
      eye: gloss('#ffffff', 0.15),
      ink: new THREE.MeshStandardMaterial({ color: '#0f0d14', roughness: 0.5 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#4a0d16', roughness: 0.6 }),
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (callAt.current.call !== call || callAt.current.t < 0) callAt.current = { call, t };
    const age = t - callAt.current.t;
    const target = STAND[call];
    if (!root.current) return;
    const dx = target[0] - root.current.position.x;
    const dz = target[2] - root.current.position.z;
    const moving = Math.hypot(dx, dz) > 0.05;
    root.current.position.x += dx * 0.06;
    root.current.position.z += dz * 0.06;
    const stride = moving ? Math.sin(t * 9) : 0;
    root.current.position.y = moving ? Math.abs(stride) * 0.03 : Math.sin(t * 3.2) * 0.008;
    const yaw = moving ? Math.atan2(dx, dz) : call === 'fight' ? -0.75 : 0;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, yaw, 0.12);

    if (legL.current && legR.current) {
      legL.current.rotation.x = stride * 0.5;
      legR.current.rotation.x = -stride * 0.5;
    }

    let lx = -0.2;
    let lz = 0.18;
    let le = -0.25;
    let rx = -0.2;
    let rz = -0.18;
    let re = -0.25;
    if (call === 'intro') {
      lx = -1.5;
      lz = 0.5;
      le = -0.2;
      rx = -1.5;
      rz = -0.5;
      re = -0.2;
    } else if (call === 'fight') {
      const chop = age < 1.6 ? Math.min(1, age / 0.25) : 1;
      rx = THREE.MathUtils.lerp(-2.7, -1.2, chop);
      rz = -0.15;
      re = -0.1;
      lx = -0.35 + stride * 0.4;
      lz = 0.2;
    } else if (call === 'over') {
      lx = -0.3;
      rx = -2.9 + Math.sin(t * 6) * 0.08;
      rz = -0.25;
      re = 0;
    }
    if (moving && call !== 'fight') {
      lx = stride * 0.5;
      rx = -stride * 0.5;
    }
    const k = 0.16;
    if (armL.current) {
      armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, lx, k);
      armL.current.rotation.z = THREE.MathUtils.lerp(armL.current.rotation.z, -lz, k);
    }
    if (armR.current) {
      armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, rx, k);
      armR.current.rotation.z = THREE.MathUtils.lerp(armR.current.rotation.z, -rz, k);
    }
    if (elbowL.current) elbowL.current.rotation.x = THREE.MathUtils.lerp(elbowL.current.rotation.x, le, k);
    if (elbowR.current) elbowR.current.rotation.x = THREE.MathUtils.lerp(elbowR.current.rotation.x, re, k);
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, call === 'over' ? -0.15 : 0.04, 0.1);
      head.current.rotation.y = call === 'fight' && !moving ? Math.sin(t * 0.8) * 0.35 : 0;
    }
  });

  const arm = (s: 1 | -1, shoulder: React.RefObject<THREE.Group>, elbow: React.RefObject<THREE.Group>) => (
    <group ref={shoulder} position={[0.2 * s, 0.86, 0]}>
      <mesh material={mats.shirt} castShadow>
        <sphereGeometry args={[0.065, 12, 10]} />
      </mesh>
      <mesh position={[0, -0.09, 0]} material={mats.shirt} castShadow>
        <capsuleGeometry args={[0.055, 0.1, 6, 10]} />
      </mesh>
      <group ref={elbow} position={[0, -0.19, 0]}>
        <mesh position={[0, -0.08, 0]} material={mats.body} castShadow>
          <capsuleGeometry args={[0.045, 0.1, 6, 10]} />
        </mesh>
        <Hand s={s} mat={mats.body} />
      </group>
    </group>
  );

  return (
    <group ref={root} position={STAND.intro} scale={0.94}>
      {([-1, 1] as const).map((s) => (
        <group key={s} ref={s < 0 ? legL : legR} position={[0.1 * s, 0.44, 0]}>
          <mesh position={[0, -0.17, 0]} material={mats.pants} castShadow>
            <capsuleGeometry args={[0.07, 0.24, 6, 10]} />
          </mesh>
          <group position={[0, -0.39, 0.04]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]} material={mats.shoe} castShadow>
              <capsuleGeometry args={[0.065, 0.11, 6, 12]} />
            </mesh>
            <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 1, 0.25]} material={mats.sole}>
              <capsuleGeometry args={[0.068, 0.12, 6, 12]} />
            </mesh>
          </group>
        </group>
      ))}
      <mesh position={[0, 0.5, 0]} material={mats.pants} castShadow>
        <cylinderGeometry args={[0.17, 0.18, 0.16, 16]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.88]} material={mats.shirt} castShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.34, 20, 1]} />
      </mesh>
      <mesh position={[0, 0.89, 0]} scale={[1, 0.4, 0.88]} material={mats.shirt} castShadow>
        <sphereGeometry args={[0.2, 16, 10]} />
      </mesh>
      <group position={[0, 0.9, 0.16]}>
        <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.bow}>
          <coneGeometry args={[0.035, 0.07, 4]} />
        </mesh>
        <mesh position={[0.04, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={mats.bow}>
          <coneGeometry args={[0.035, 0.07, 4]} />
        </mesh>
      </group>
      <mesh position={[0.06, 0.8, 0.17]} rotation={[0.2, 0, 0]} material={mats.whistle}>
        <cylinderGeometry args={[0.018, 0.018, 0.05, 10]} />
      </mesh>

      {arm(-1, armL, elbowL)}
      {arm(1, armR, elbowR)}

      <group ref={head} position={[0, 1.13, 0.02]}>
        <mesh material={mats.body} castShadow>
          <sphereGeometry args={[0.23, 24, 18]} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[0.075 * s, 0.03, 0.2]} rotation={[0, 0.3 * s, 0]}>
            <mesh scale={[0.9, 1.1, 0.5]} material={mats.eye}>
              <sphereGeometry args={[0.046, 12, 10]} />
            </mesh>
            <mesh position={[0, -0.004, 0.02]} scale={[1, 1.2, 0.6]} material={mats.ink}>
              <sphereGeometry args={[0.024, 10, 8]} />
            </mesh>
          </group>
        ))}
        {([-1, 1] as const).map((s) => (
          <mesh key={s} position={[0.075 * s, 0.1, 0.205]} rotation={[0.3, 0.3 * s, -0.15 * s]} material={mats.ink}>
            <capsuleGeometry args={[0.013, 0.06, 4, 8]} />
          </mesh>
        ))}
        <mesh position={[0, -0.08, 0.205]} rotation={[0.3, 0, Math.PI / 2]} material={mats.mouth}>
          <capsuleGeometry args={[0.012, 0.06, 4, 8]} />
        </mesh>
        <group position={[0.09, 0.15, -0.05]}>
          <mesh position={[0, 0.15, 0]} material={mats.flag} castShadow>
            <capsuleGeometry args={[0.038, 0.3, 6, 10]} />
          </mesh>
          <group position={[0, 0.3, 0]} rotation={[-0.45, 0, 0]}>
            <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]} material={mats.flag} castShadow>
              <capsuleGeometry args={[0.05, 0.22, 6, 10]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
