import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { CLOTH_HEX, SKIN_HEX, hexOf, type FighterLoadout } from './loadout';
import type { BoxerPose } from './punchDirector';
import {
  hitReaction,
  idleMotion,
  knockdownY,
  punchOut,
  punchPhaseAt,
  stepIn,
  weightOf,
  type MotionPunch,
} from './motion';

export const BOXER_GLB = '/fight3d/boxer.glb';
export const BOXER_F_GLB = '/fight3d/boxer-f.glb';
export const BOXER_H_GLB = '/fight3d/boxer-h.glb';
export const RING_GLB = '/fight3d/ring.glb';
export const BAG_GLB = '/fight3d/bag.glb';
export const CROWD_GLB = '/fight3d/crowd.glb';
export const CROWD_SPRITE = '/fight3d/concept/crowd.png';

export function boxerUrlFor(loadout: FighterLoadout, available: Record<string, boolean>): string {
  if (loadout.body === 'heavy' && available[BOXER_H_GLB]) return BOXER_H_GLB;
  if (loadout.body === 'light' && available[BOXER_F_GLB]) return BOXER_F_GLB;
  return BOXER_GLB;
}

function tintScene(root: THREE.Object3D, loadout: FighterLoadout) {
  const skin = new THREE.Color(hexOf(SKIN_HEX, loadout.skin));
  const trunks = new THREE.Color(hexOf(CLOTH_HEX, loadout.trunks));
  const gloves = new THREE.Color(hexOf(CLOTH_HEX, loadout.gloves));
  const boots = new THREE.Color(hexOf(CLOTH_HEX, loadout.boots));
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const raw of mats) {
      const m = raw as THREE.MeshStandardMaterial;
      if (!m.color) continue;
      const hsl = { h: 0, s: 0, l: 0 };
      m.color.getHSL(hsl);
      if (hsl.h > 0.75 && hsl.h < 0.95 && hsl.s > 0.25) m.color.copy(gloves);
      else if (hsl.h > 0.55 && hsl.h < 0.78 && hsl.s > 0.2) m.color.copy(gloves);
      else if ((hsl.h < 0.06 || hsl.h > 0.94) && hsl.s > 0.25) m.color.copy(trunks);
      else if (hsl.h > 0.4 && hsl.h < 0.55 && hsl.s > 0.25) m.color.copy(trunks);
      else if (hsl.h > 0.08 && hsl.h < 0.2 && hsl.l < 0.35 && hsl.s > 0.2) m.color.copy(boots);
      else if (hsl.h > 0.02 && hsl.h < 0.15 && hsl.s > 0.15 && hsl.l > 0.25) m.color.copy(skin);
    }
  });
}

function cloneSkinned(scene: THREE.Object3D) {
  const clone = SkeletonUtils.clone(scene);
  clone.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m) => m.clone());
    else if (mesh.material) mesh.material = mesh.material.clone();
  });
  return clone;
}

function fitHeight(obj: THREE.Object3D, height: number) {
  const parent = obj.parent;
  if (parent) parent.remove(obj);

  obj.traverse((node) => {
    node.scale.x = Math.abs(node.scale.x) || 1;
    node.scale.y = Math.abs(node.scale.y) || 1;
    node.scale.z = Math.abs(node.scale.z) || 1;
  });
  obj.scale.setScalar(1);
  obj.rotation.set(0, 0, 0);
  obj.position.set(0, 0, 0);
  obj.updateMatrixWorld(true);

  const hips = obj.getObjectByName('Hips');
  const head = obj.getObjectByName('Head');
  const hd = new THREE.Vector3();
  const hp = new THREE.Vector3();
  if (head) head.getWorldPosition(hd);
  if (hips) hips.getWorldPosition(hp);

  let box = new THREE.Box3().setFromObject(obj);
  const midY = (box.min.y + box.max.y) / 2;
  if (head && hd.y < midY) {
    obj.rotation.x += Math.PI;
    obj.userData.flippedX = true;
    obj.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(obj);
  } else if (hips && head && hd.y < hp.y) {
    obj.rotation.x += Math.PI;
    obj.userData.flippedX = true;
    obj.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(obj);
  } else {
    obj.userData.flippedX = false;
  }

  const size = new THREE.Vector3();
  box.getSize(size);
  obj.scale.setScalar(height / Math.max(size.y, 0.01));
  obj.updateMatrixWorld(true);
  if (hips) hips.getWorldPosition(hp);
  if (head) head.getWorldPosition(hd);
  const fitted = new THREE.Box3().setFromObject(obj);
  obj.position.x -= hips ? hp.x : (fitted.min.x + fitted.max.x) / 2;
  const foot = obj.getObjectByName('LeftFoot') ?? obj.getObjectByName('LeftToeBase');
  if (foot) {
    const fp = new THREE.Vector3();
    foot.getWorldPosition(fp);
    obj.position.y -= fp.y;
  } else {
    obj.position.y -= fitted.min.y;
  }
  obj.position.z -= hips ? hp.z : (fitted.min.z + fitted.max.z) / 2;
  obj.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const raw of mats) {
      const m = raw as THREE.MeshStandardMaterial;
      if (m) m.side = THREE.DoubleSide;
    }
  });

  if (parent) parent.add(obj);
}

function bone(root: THREE.Object3D, name: string) {
  return root.getObjectByName(name) ?? null;
}

const _euler = new THREE.Euler();
const _extra = new THREE.Quaternion();
const _target = new THREE.Quaternion();

type BoneKeys = { x: number; y: number; z: number };

/** Mixamo T-pose overlay: drop the arms into a peek-a-boo. Bone +Y is along the limb. */
const GUARD_L: BoneKeys = { x: 1.25, y: 0.55, z: 1.35 };
const GUARD_R: BoneKeys = { x: 1.25, y: -0.55, z: -1.35 };
const GUARD_LF: BoneKeys = { x: 0.18, y: 0.32, z: 1.42 };
const GUARD_RF: BoneKeys = { x: 0.18, y: -0.32, z: -1.42 };

function captureRest(root: THREE.Object3D, rest: Map<string, THREE.Quaternion>) {
  rest.clear();
  root.traverse((node) => {
    const sk = node as THREE.SkinnedMesh;
    if (sk.isSkinnedMesh && sk.skeleton) sk.skeleton.pose();
  });
  const names = [
    'Spine',
    'Spine01',
    'Spine02',
    'Head',
    'LeftArm',
    'RightArm',
    'LeftForeArm',
    'RightForeArm',
    'LeftShoulder',
    'RightShoulder',
    'LeftUpLeg',
    'RightUpLeg',
  ];
  for (const n of names) {
    const o = root.getObjectByName(n);
    if (o) rest.set(o.uuid, o.quaternion.clone());
  }
}

function overlay(
  obj: THREE.Object3D | null,
  rest: Map<string, THREE.Quaternion>,
  pose: BoneKeys,
  alpha: number
) {
  if (!obj) return;
  let bind = rest.get(obj.uuid);
  if (!bind) {
    bind = obj.quaternion.clone();
    rest.set(obj.uuid, bind);
  }
  _euler.set(pose.x, pose.y, pose.z, 'XYZ');
  _extra.setFromEuler(_euler);
  _target.copy(bind).multiply(_extra);
  obj.quaternion.slerp(_target, alpha);
}

function asPunch(pose: BoxerPose): MotionPunch | null {
  if (pose === 'jab' || pose === 'hook' || pose === 'uppercut' || pose === 'flurry') return pose;
  return null;
}

/**
 * Higgsfield / Meshy boxer. Bind pose is a Mixamo T-pose, so votes drive
 * jab / hook / uppercut / KO as overlays on those rest quaternions — never
 * by replacing the Euler (that spaghetti'd the arms).
 */
export function GlbBoxer({
  url = BOXER_GLB,
  loadout,
  pose,
  facing,
  faceCamera = false,
  hitBy,
  wear = 0,
}: {
  url?: string;
  loadout: FighterLoadout;
  pose: BoxerPose;
  facing: 1 | -1;
  faceCamera?: boolean;
  hitBy?: MotionPunch;
  wear?: number;
}) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => cloneSkinned(scene), [scene]);
  const root = useRef<THREE.Group>(null);
  const poseAt = useRef(-1);
  const lastPose = useRef<BoxerPose>(pose);
  const fitted = useRef(false);
  const rest = useRef(new Map<string, THREE.Quaternion>());
  const spring = useRef({ z: 0, y: 0, vz: 0, vy: 0 });
  const [flipped, setFlipped] = useState(false);
  const scale = loadout.body === 'heavy' ? 1.08 : loadout.body === 'light' ? 0.94 : 1;

  useLayoutEffect(() => {
    rest.current.clear();
    fitted.current = false;
    fitHeight(clone, 1.82);
    captureRest(clone, rest.current);
    fitted.current = true;
    tintScene(clone, loadout);
    setFlipped(Boolean(clone.userData.flippedX));
  }, [clone, loadout]);

  useFrame(({ clock }, dt) => {
    const dtClamped = Math.min(0.05, Math.max(0.001, dt || 0.016));
    if (poseAt.current < 0) poseAt.current = clock.elapsedTime;
    if (lastPose.current !== pose) {
      lastPose.current = pose;
      poseAt.current = clock.elapsedTime;
      const wt = weightOf(loadout.body);
      if (pose === 'hurt') {
        const hr = hitReaction(hitBy ?? 'jab');
        spring.current.vz = -2.4 * wt.knock * hr.knock;
        spring.current.vy = 2.2 * wt.knock * hr.lift;
      }
      if (pose === 'down') {
        spring.current.vz = -1.4;
        spring.current.vy = 2.4;
      }
    }
    const t = clock.elapsedTime;
    const age = t - poseAt.current;
    const wt = weightOf(loadout.body);
    const punch = asPunch(pose);
    const out = punch ? punchOut(age * wt.speed, punch) : 0;
    const phase = punch ? punchPhaseAt(age * wt.speed, punch) : 'done';
    const idle = pose === 'idle' || pose === 'lost' ? idleMotion(t, wt.bounce) : { y: 0, x: 0, weave: 0 };
    const hr = pose === 'hurt' ? hitReaction(hitBy ?? 'jab') : null;
    const ext = Math.max(0, out);
    const wind = Math.min(0, out);
    const blend = punch ? (phase === 'rec' ? 0.4 : 0.72) : pose === 'hurt' ? 0.5 : 0.28;

    if (root.current) {
      const s = spring.current;
      if (pose === 'hurt' || pose === 'down') {
        s.vy -= 12 * dtClamped;
        s.vz *= Math.pow(0.05, dtClamped);
        s.z += s.vz * dtClamped;
        const floor = pose === 'down' ? 0.04 : 0;
        s.y = Math.max(floor, s.y + s.vy * dtClamped);
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
      const lunge = punch ? stepIn(age * wt.speed, punch) * wt.lunge : 0;
      const hop = pose === 'won' ? Math.abs(Math.sin(t * 8)) * 0.1 : 0;
      root.current.position.y = pose === 'down' ? knockdownY(age) : idle.y * 0.55 + s.y + hop;
      root.current.position.z = lunge + s.z;
      root.current.position.x = pose === 'idle' ? idle.x * 0.6 : THREE.MathUtils.lerp(root.current.position.x, 0, 0.25);
      root.current.rotation.z = THREE.MathUtils.lerp(
        root.current.rotation.z,
        pose === 'down' ? facing * 0.55 : pose === 'hurt' && hr ? facing * -0.12 * hr.twist : idle.weave * 0.12,
        0.18
      );
      root.current.rotation.x = THREE.MathUtils.lerp(
        root.current.rotation.x,
        pose === 'down' ? 1.05 : pose === 'hurt' && hr ? 0.1 + hr.lift * 0.16 : pose === 'lost' ? 0.14 : 0,
        pose === 'down' ? 0.14 : 0.18
      );
      root.current.rotation.y = THREE.MathUtils.lerp(
        root.current.rotation.y,
        pose === 'hook' ? -0.35 * ext : pose === 'hurt' && hr ? hr.twist * 0.28 : 0,
        0.22
      );
    }

    const spine = bone(clone, 'Spine02') ?? bone(clone, 'Spine01') ?? bone(clone, 'Spine');
    const head = bone(clone, 'Head');
    const lArm = bone(clone, 'LeftArm');
    const rArm = bone(clone, 'RightArm');
    const lFore = bone(clone, 'LeftForeArm');
    const rFore = bone(clone, 'RightForeArm');
    const lUp = bone(clone, 'LeftUpLeg');
    const rUp = bone(clone, 'RightUpLeg');

    let l: BoneKeys = { ...GUARD_L, x: GUARD_L.x + idle.y * 1.4 };
    let r: BoneKeys = { ...GUARD_R, x: GUARD_R.x + idle.y * 1.4 };
    let lf: BoneKeys = { ...GUARD_LF };
    let rf: BoneKeys = { ...GUARD_RF };

    if (pose === 'jab') {
      l = { x: 1.55 + ext * 0.35, y: 0.08 + wind * 0.2, z: 0.18 - ext * 0.05 };
      lf = { x: 0.08, y: 0.05, z: 0.18 - ext * 1.05 };
      r = { ...GUARD_R, y: GUARD_R.y - 0.12 };
    } else if (pose === 'hook') {
      r = { x: 0.85 + ext * 0.25, y: -0.45 - ext * 1.05, z: -0.45 - ext * 0.35 };
      rf = { x: 0.18, y: -0.35 * ext, z: -0.55 - ext * 0.4 };
      l = { ...GUARD_L, y: GUARD_L.y + 0.18 };
    } else if (pose === 'uppercut') {
      l = { x: 0.15 + ext * 1.55, y: 0.12, z: 0.35 };
      lf = { x: -0.25 + ext * 0.85, y: 0.05, z: 0.2 };
      r = { ...GUARD_R };
    } else if (pose === 'flurry') {
      const beat = Math.sin(age * 24);
      l = { x: 1.45 + beat * 0.28, y: 0.12, z: 0.22 - beat * 0.12 };
      r = { x: 1.45 - beat * 0.28, y: -0.12, z: -0.22 + beat * 0.12 };
      lf = { x: 0.1, y: 0, z: 0.15 + beat * 0.2 };
      rf = { x: 0.1, y: 0, z: -0.15 - beat * 0.2 };
    } else if (pose === 'hurt') {
      const cover = hr?.cover ? 1 : 0.45;
      l = { x: 1.25, y: 0.7 + cover * 0.15, z: 1.05 };
      r = { x: 1.25, y: -0.7 - cover * 0.15, z: -1.05 };
      lf = { x: 0.2, y: 0.2, z: 1.15 };
      rf = { x: 0.2, y: -0.2, z: -1.15 };
    } else if (pose === 'won') {
      l = { x: -0.2, y: 0.15, z: 2.4 };
      r = { x: -0.2, y: -0.15, z: -2.4 };
      lf = { x: 0, y: 0, z: 0.15 };
      rf = { x: 0, y: 0, z: -0.15 };
    } else if (pose === 'down') {
      l = { x: 0.35, y: 0.12, z: 0.35 };
      r = { x: 0.35, y: -0.12, z: -0.35 };
      lf = { x: 0.2, y: 0, z: 0.4 };
      rf = { x: 0.2, y: 0, z: -0.4 };
    } else if (pose === 'lost') {
      l = { x: 0.45, y: 0.2, z: 0.7 };
      r = { x: 0.45, y: -0.2, z: -0.7 };
    }

    overlay(lArm, rest.current, l, blend);
    overlay(rArm, rest.current, r, blend);
    overlay(lFore, rest.current, lf, blend);
    overlay(rFore, rest.current, rf, blend);
    overlay(
      spine,
      rest.current,
      {
        x: pose === 'hurt' && hr ? 0.28 : punch ? -0.16 - ext * 0.12 : pose === 'won' ? -0.12 : idle.weave * 0.08,
        y: pose === 'hook' ? -0.45 * ext : 0,
        z: 0,
      },
      blend
    );
    overlay(
      head,
      rest.current,
      {
        x: pose === 'hurt' && hr ? 0.35 + hr.head * 0.3 : punch ? -0.08 : pose === 'won' ? -0.2 : 0,
        y: 0,
        z: pose === 'hurt' ? facing * -0.18 : 0,
      },
      pose === 'hurt' ? 0.5 : 0.22
    );

    const step = pose === 'idle' ? Math.sin(t * 6.1) * 0.08 * wt.bounce : punch ? 0.12 : 0;
    overlay(lUp, rest.current, { x: step, y: 0, z: 0 }, 0.22);
    overlay(rUp, rest.current, { x: -step, y: 0, z: 0 }, 0.22);

    const glow = pose === 'flurry' ? 0.35 + Math.sin(t * 20) * 0.1 : 0;
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const raw of mats) {
        const m = raw as THREE.MeshStandardMaterial;
        if (!m.emissive) continue;
        if (glow > 0.05) {
          m.emissive.set('#ff9a3c');
          m.emissiveIntensity = glow;
        } else if (pose === 'hurt' || wear > 0.35) {
          m.emissive.set('#5b2436');
          m.emissiveIntensity = pose === 'hurt' ? 0.22 : wear * 0.12;
        } else {
          m.emissive.set('#000000');
          m.emissiveIntensity = 0;
        }
      }
    });
  });

  const yaw = faceCamera
    ? flipped
      ? Math.PI
      : 0
    : (facing > 0 ? Math.PI / 2 : -Math.PI / 2) * (flipped ? -1 : 1);

  return (
    <group ref={root} scale={scale} rotation={[0, yaw, 0]}>
      <primitive object={clone} />
    </group>
  );
}

export function GlbRing() {
  const { scene } = useGLTF(RING_GLB);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useLayoutEffect(() => {
    clone.scale.setScalar(1);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const span = Math.max(size.x, size.z);
    clone.scale.setScalar(6.35 / Math.max(span, 0.01));
    const fitted = new THREE.Box3().setFromObject(clone);
    clone.position.set(
      -(fitted.min.x + fitted.max.x) / 2,
      -fitted.min.y,
      -(fitted.min.z + fitted.max.z) / 2
    );
  }, [clone]);
  return <primitive object={clone} />;
}

export function GlbBag() {
  const { scene } = useGLTF(BAG_GLB);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useLayoutEffect(() => {
    fitHeight(clone, 1.55);
  }, [clone]);
  return <primitive object={clone} position={[0, 0, -1.45]} />;
}

export function GlbCrowd() {
  const { scene } = useGLTF(CROWD_GLB);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useLayoutEffect(() => {
    clone.scale.setScalar(1);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    clone.scale.setScalar(3.4 / Math.max(size.x, 0.01));
    const fitted = new THREE.Box3().setFromObject(clone);
    clone.position.y -= fitted.min.y;
  }, [clone]);
  const seats = useMemo(() => {
    const out: { p: [number, number, number]; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.18;
      out.push({ p: [Math.cos(a) * 7.8, 0.15, Math.sin(a) * 7.8], y: -a + Math.PI });
    }
    return out;
  }, []);
  return (
    <group>
      {seats.map((s, i) => (
        <primitive key={i} object={i === 0 ? clone : clone.clone(true)} position={s.p} rotation={[0, s.y, 0]} />
      ))}
    </group>
  );
}

/** Higgsfield crowd strip, billboarded around the ring when the 3D crowd is not ready. */
export function CrowdSprites() {
  const tex = useTexture(CROWD_SPRITE);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.12,
      }),
    [tex]
  );
  const seats = useMemo(() => {
    const out: { p: [number, number, number]; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.12;
      out.push({ p: [Math.cos(a) * 7.7, 1.28, Math.sin(a) * 7.7], y: -a + Math.PI });
    }
    return out;
  }, []);
  return (
    <group>
      {seats.map((s, i) => (
        <mesh key={i} position={s.p} rotation={[0, s.y, 0]} material={mat}>
          <planeGeometry args={[3.5, 1.65]} />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload(BOXER_GLB);
useGLTF.preload(BOXER_F_GLB);
useGLTF.preload(BOXER_H_GLB);
