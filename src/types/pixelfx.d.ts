declare module 'pixelfx' {
  export interface PixelFrame {
    w: number;
    h: number;
    color: Uint32Array;
    light: Uint32Array;
  }
  export interface PixelFxInstance {
    readonly t: number;
    update(dt: number): void;
    draw(frame: PixelFrame, layer?: 'back' | 'front'): void;
    stop(): void;
    done(): boolean;
  }
  export function createFrame(w: number, h: number, ox?: number, oy?: number): PixelFrame;
  export function clearFrame(frame: PixelFrame): PixelFrame;
  export function createFx(mod: unknown, options?: Record<string, unknown>): PixelFxInstance;
  export function composite(frame: PixelFrame, out: Uint8ClampedArray, bg?: number | Uint32Array | null, lightK?: number): void;
}

declare module 'pixelfx/fx/*' {
  export const meta: {
    name: string;
    size?: [number, number];
    origin?: [number, number];
    duration?: number;
    loop?: boolean;
    fps?: number;
  };
}
