/**
 * URLs other people have to open.
 *
 * Hosting from the Vite preview used to copy `http://localhost:3000/...`
 * into the address bar, the join link, and the board. Friends cannot reach
 * that. Shareable links always point at the live site. Local preview still
 * works for the host; after they create a room we send them to tuneboxed.com
 * with a one-time session handoff.
 */

export const PUBLIC_ORIGIN = 'https://tuneboxed.com';

export function isLocalPreview(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function publicOrigin(): string {
  if (typeof window === 'undefined' || isLocalPreview()) return PUBLIC_ORIGIN;
  return window.location.origin;
}

export function publicUrl(path: string): string {
  const next = path.startsWith('/') ? path : `/${path}`;
  return `${publicOrigin()}${next}`;
}

export function liveRoomUrl(code: string): string {
  return publicUrl(`/battle/${code.toUpperCase()}`);
}

export function liveJoinUrl(code: string): string {
  return publicUrl(`/join/${code.toUpperCase()}`);
}

export function liveBoardUrl(code: string): string {
  return publicUrl(`/tv/${code.toUpperCase()}`);
}
