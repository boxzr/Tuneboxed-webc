import { useEffect, useRef } from 'react';

function pointerFxAllowed() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Pulls an element a few pixels toward the cursor while it hovers nearby, so
 * the main call to action leans in to meet the pointer.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.3, maxShift = 10) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !pointerFxAllowed()) return;

    el.style.transition = 'transform 250ms cubic-bezier(0.22, 1.2, 0.36, 1)';
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength;
      const dy = (e.clientY - (r.top + r.height / 2)) * strength;
      const clamp = (v: number) => Math.max(-maxShift, Math.min(maxShift, v));
      el.style.transform = `translate(${clamp(dx)}px, ${clamp(dy)}px)`;
    };
    const leave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      leave();
    };
  }, [strength, maxShift]);

  return ref;
}

/**
 * Tilts a card toward the cursor in 3D and moves a soft highlight with it.
 * Sets `--tilt-x` / `--tilt-y` (percent) for a CSS glare layer.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 6) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !pointerFxAllowed()) return;

    el.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * maxDeg}deg) rotateY(${(px - 0.5) * maxDeg}deg)`;
      el.style.setProperty('--tilt-x', `${px * 100}%`);
      el.style.setProperty('--tilt-y', `${py * 100}%`);
    };
    const leave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      leave();
    };
  }, [maxDeg]);

  return ref;
}
