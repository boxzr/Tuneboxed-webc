import { useEffect, useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { CANVAS_FONT, useCanvasFonts } from './canvasFont';

function paint(name: string, accent: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 512, 128);
  g.fillStyle = 'rgba(8, 6, 14, 0.88)';
  g.beginPath();
  const r = 22;
  g.moveTo(24 + r, 22);
  g.arcTo(488, 22, 488, 106, r);
  g.arcTo(488, 106, 24, 106, r);
  g.arcTo(24, 106, 24, 22, r);
  g.arcTo(24, 22, 488, 22, r);
  g.closePath();
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = accent;
  g.stroke();
  g.fillStyle = '#fff8e8';
  g.font = `700 48px ${CANVAS_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const label = name.length > 16 ? `${name.slice(0, 15).toUpperCase()}…` : name.toUpperCase();
  g.fillText(label, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Billboarded name over a fighter or a fan in the stands. */
export default function Nametag({
  name,
  accent = '#d4af37',
  y = 1.9,
  width = 1.05,
}: {
  name: string;
  accent?: string;
  y?: number;
  width?: number;
}) {
  const fonts = useCanvasFonts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tex = useMemo(() => paint(name, accent), [name, accent, fonts]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <Billboard position={[0, y, 0.32]} follow>
      <mesh>
        <planeGeometry args={[width, width * 0.25]} />
        <meshBasicMaterial map={tex} transparent depthTest={false} />
      </mesh>
    </Billboard>
  );
}
