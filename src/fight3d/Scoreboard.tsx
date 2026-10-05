import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CANVAS_FONT, useCanvasFonts } from './canvasFont';

export interface ScoreboardData {
  roundLabel: string;
  aName: string;
  bName: string;
  aSong: string;
  bSong: string;
  votesA: number;
  votesB: number;
  healthA: number;
  healthB: number;
}

function roundBox(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Shrinks the font until `text` fits in `max` pixels. */
function fit(g: CanvasRenderingContext2D, text: string, max: number, px: number, weight = 900) {
  let size = px;
  do {
    g.font = `${weight} ${size}px ${CANVAS_FONT}`;
    if (g.measureText(text).width <= max) break;
    size -= 2;
  } while (size > 18);
  return text;
}

const W = 1536;
const H = 256;

/**
 * One line, TV-ticker style: each corner's name and votes against its own
 * edge, the round in the middle, health along the bottom.
 */
function paint(c: HTMLCanvasElement, data: ScoreboardData) {
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, W, H);
  roundBox(g, 0, 0, W, H, 34);
  g.fillStyle = '#120e18';
  g.fill();

  const mid = W / 2;
  const centerW = 300;
  const side = (s: 'a' | 'b') => {
    const left = s === 'a';
    const name = (left ? data.aName : data.bName).toUpperCase();
    const votes = String(left ? data.votesA : data.votesB);
    const health = Math.max(0, Math.min(1, (left ? data.healthA : data.healthB) / 100));
    const accent = left ? '#4ea8ff' : '#fd9c07';
    const deep = left ? '#1d4ed8' : '#ea580c';
    const x0 = left ? 0 : mid + centerW / 2;
    const w = mid - centerW / 2;

    const grad = g.createLinearGradient(left ? 0 : W, 0, left ? w : W - w, 0);
    grad.addColorStop(0, deep);
    grad.addColorStop(1, 'rgba(18,14,24,0)');
    g.save();
    roundBox(g, 0, 0, W, H, 34);
    g.clip();
    g.fillStyle = grad;
    g.fillRect(x0, 0, w, H);
    g.restore();

    const pad = 48;
    g.font = `900 132px ${CANVAS_FONT}`;
    const votesW = g.measureText(votes).width;
    g.fillStyle = accent;
    g.textBaseline = 'middle';
    g.textAlign = left ? 'right' : 'left';
    g.fillText(votes, left ? mid - centerW / 2 - 24 : mid + centerW / 2 + 24, 112);

    const nameMax = w - pad - votesW - 72;
    fit(g, name, nameMax, 72);
    g.fillStyle = '#fff8e8';
    g.textAlign = left ? 'left' : 'right';
    g.fillText(name, left ? pad : W - pad, 112);

    const barY = 196;
    const barH = 26;
    const barX = left ? pad : mid + centerW / 2 + 24;
    const barW = w - pad - 24;
    roundBox(g, barX, barY, barW, barH, 13);
    g.fillStyle = '#2a2434';
    g.fill();
    const fillW = Math.max(barH, barW * health);
    roundBox(g, left ? barX : barX + barW - fillW, barY, fillW, barH, 13);
    g.fillStyle = accent;
    g.fill();
  };
  side('a');
  side('b');

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#d4af37';
  fit(g, data.roundLabel.toUpperCase(), centerW - 40, 44, 800);
  g.fillText(data.roundLabel.toUpperCase(), mid, 84);
  g.fillStyle = 'rgba(255,248,232,0.6)';
  g.font = `800 34px ${CANVAS_FONT}`;
  g.fillText('VOTES', mid, 150);
  g.textBaseline = 'alphabetic';
}

/**
 * Jumbotron over the far ropes. Votes and health redraw whenever the bout
 * ticks, so the canvas itself is the live scoreboard.
 */
/** Hung past the far ropes, in the strip of view above the fighters' nametags. */
const BOARD_W = 2.6;
const BOARD_Y = 2.66;
const BOARD_Z = -3.4;

export default function RingScoreboard(data: ScoreboardData) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  const fonts = useCanvasFonts();
  useLayoutEffect(() => {
    paint(tex.image as HTMLCanvasElement, data);
    tex.needsUpdate = true;
  }, [tex, fonts, data.roundLabel, data.aName, data.bName, data.aSong, data.bSong, data.votesA, data.votesB, data.healthA, data.healthB]);

  return (
    <group position={[0, BOARD_Y, BOARD_Z]} rotation={[0.04, 0, 0]}>
      <mesh position={[0, 0, -0.04]} castShadow>
        <boxGeometry args={[BOARD_W + 0.1, BOARD_W / (W / H) + 0.1, 0.06]} />
        <meshStandardMaterial color="#1a1520" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh>
        <planeGeometry args={[BOARD_W, BOARD_W / (W / H)]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
