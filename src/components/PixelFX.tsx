import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { clearFrame, composite, createFrame, createFx } from 'pixelfx';

/**
 * One pixelfx effect on a canvas, scaled up with crisp pixels.
 *
 * Effects load on demand so a page only downloads the ones it plays. A
 * one-shot plays once each time `trigger` changes (and on mount unless
 * `trigger` starts as null); loops run until unmounted.
 */

const EFFECTS = {
  confetti: () => import('pixelfx/fx/ui/confetti'),
  coin: () => import('pixelfx/fx/ui/coin-collect'),
  levelUp: () => import('pixelfx/fx/ui/level-up'),
  achievement: () => import('pixelfx/fx/ui/achievement'),
  collect: () => import('pixelfx/fx/pickups/collect-burst'),
  star: () => import('pixelfx/fx/pickups/power-star'),
  heart: () => import('pixelfx/fx/pickups/heart-pickup'),
  halo: () => import('pixelfx/fx/holy/halo'),
  pow: () => import('pixelfx/fx/explosions/cartoon-pow'),
  firework: () => import('pixelfx/fx/explosions/firework-burst'),
  hitSpark: () => import('pixelfx/fx/impacts/hit-spark'),
  crit: () => import('pixelfx/fx/impacts/crit-hit'),
} as const;

export type PixelEffectName = keyof typeof EFFECTS;

type FxModule = { meta?: { size?: [number, number]; origin?: [number, number]; loop?: boolean } };

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PixelFX({
  effect,
  scale = 3,
  loop,
  trigger,
  className,
  style,
}: {
  effect: PixelEffectName;
  /** Screen pixels per art pixel. */
  scale?: number;
  /** Defaults to the effect's own setting. */
  loop?: boolean;
  /** Replays a one-shot whenever this changes. Null waits for the first change. */
  trigger?: unknown;
  className?: string;
  style?: CSSProperties;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mod, setMod] = useState<FxModule | null>(null);
  const first = useRef(true);

  useEffect(() => {
    let live = true;
    void EFFECTS[effect]().then((m) => live && setMod(m as FxModule));
    return () => {
      live = false;
    };
  }, [effect]);

  useEffect(() => {
    const el = canvas.current;
    if (!mod || !el || reducedMotion()) return;
    const waiting = first.current && trigger === null;
    first.current = false;
    if (waiting) return;

    const [w, h] = mod.meta?.size ?? [64, 64];
    const [ox, oy] = mod.meta?.origin ?? [w / 2, h / 2];
    el.width = w;
    el.height = h;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const frame = createFrame(w, h);
    const img = new ImageData(w, h);
    const make = () => createFx(mod, { x: ox, y: oy });
    let fx = make();
    const loops = loop ?? mod.meta?.loop ?? false;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (loops && fx.done()) fx = make();
      fx.update(Math.min(0.05, (now - last) / 1000));
      last = now;
      clearFrame(frame);
      fx.draw(frame);
      img.data.fill(0);
      composite(frame, img.data);
      ctx.putImageData(img, 0, 0);
      if (loops || !fx.done()) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mod, trigger, loop]);

  const [w, h] = mod?.meta?.size ?? [0, 0];
  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={className}
      style={{
        width: w * scale,
        height: h * scale,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
