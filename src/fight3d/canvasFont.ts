import { useEffect, useState } from 'react';

/**
 * Text drawn into 3D textures. Fontsource registers Inter as "Inter Variable",
 * and a canvas never triggers a webfont download on its own, so it has to be
 * named exactly and loaded before painting or every OS draws its own default.
 */
export const CANVAS_FONT = "'Inter Variable', Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

let loaded = false;
let pending: Promise<void> | null = null;

function loadCanvasFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve();
  pending ??= Promise.all(
    [700, 800, 900].map((w) => document.fonts.load(`${w} 48px 'Inter Variable'`))
  )
    .then(() => {
      loaded = true;
    })
    .catch(() => {
      loaded = true;
    });
  return pending;
}

/** False until the canvas font is ready; put it in paint deps to repaint once it lands. */
export function useCanvasFonts(): boolean {
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    if (ready) return;
    let live = true;
    loadCanvasFonts().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [ready]);
  return ready;
}
