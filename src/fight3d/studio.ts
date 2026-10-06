import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const envs = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

/**
 * A soft studio reflection for the fighters' lacquered plastic.
 *
 * Applied per material rather than as the scene environment, so the boxers
 * pick up highlights while the arena around them stays dark. One per
 * renderer, since every rig in a canvas can share it.
 */
export function studioEnv(gl: THREE.WebGLRenderer): THREE.Texture {
  let env = envs.get(gl);
  if (!env) {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    env = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    envs.set(gl, env);
  }
  return env;
}

/**
 * Fresnel rim on a lit material: the silhouette catches the arena lights the
 * way a hero model does, which keeps a fighter readable against a dark crowd.
 */
export function withRim<T extends THREE.MeshStandardMaterial>(mat: T, color = '#ffe9c7', strength = 0.3, power = 2.6): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.rimColor = { value: new THREE.Color(color) };
    shader.uniforms.rimStrength = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
          totalEmissiveRadiance += rimColor * rimStrength * pow(rim, ${power.toFixed(2)});
        }`
      );
  };
  mat.customProgramCacheKey = () => `tb-rim-${power.toFixed(2)}`;
  return mat;
}
