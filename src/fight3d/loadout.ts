/**
 * A fighter's look.
 *
 * Stored as a short string on `battle_players.avatar_seed` so it rides the
 * existing realtime channel without a new column. A player who never opens
 * the locker still gets a distinct boxer, hashed from their display name.
 */

export const HAIR_STYLES = ['buzz', 'fade', 'afro', 'long', 'mohawk', 'none'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const BODY_TYPES = ['light', 'mid', 'heavy'] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export interface FighterLoadout {
  skin: number;
  hair: HairStyle;
  hairColor: number;
  trunks: number;
  gloves: number;
  boots: number;
  body: BodyType;
}

/** Mascot body paints. Orange and blue are the TuneBoxed notes. */
export const SKIN_HEX = ['#fd7a1a', '#3b9eff', '#f4efe6', '#ef4444', '#22c55e', '#a855f7'] as const;
/** Note-flag paints. Index 0 matches the body when hair is "none". */
export const HAIR_HEX = ['#fd7a1a', '#3b9eff', '#111827', '#f8fafc', '#eab308', '#7c3aed'] as const;
export const CLOTH_HEX = [
  '#1d4ed8',
  '#ea580c',
  '#b91c1c',
  '#15803d',
  '#7c3aed',
  '#0f172a',
  '#f8fafc',
  '#eab308',
] as const;

const PREFIX = 'tb1';

function wrap(n: number, len: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n) % len;
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable random kit from a name, so two players never spawn identical. */
export function defaultLoadout(seed: string): FighterLoadout {
  const h = hash(seed || 'tuneboxed');
  return {
    skin: h % SKIN_HEX.length,
    hair: HAIR_STYLES[Math.floor(h / 7) % HAIR_STYLES.length],
    hairColor: Math.floor(h / 13) % HAIR_HEX.length,
    trunks: Math.floor(h / 17) % CLOTH_HEX.length,
    gloves: Math.floor(h / 19) % CLOTH_HEX.length,
    boots: Math.floor(h / 23) % CLOTH_HEX.length,
    body: BODY_TYPES[Math.floor(h / 29) % BODY_TYPES.length],
  };
}

export function encodeLoadout(loadout: FighterLoadout): string {
  const hair = HAIR_STYLES.indexOf(loadout.hair);
  const body = BODY_TYPES.indexOf(loadout.body);
  return [
    PREFIX,
    wrap(loadout.skin, SKIN_HEX.length),
    hair < 0 ? 0 : hair,
    wrap(loadout.hairColor, HAIR_HEX.length),
    wrap(loadout.trunks, CLOTH_HEX.length),
    wrap(loadout.gloves, CLOTH_HEX.length),
    wrap(loadout.boots, CLOTH_HEX.length),
    body < 0 ? 1 : body,
  ].join('.');
}

export function parseLoadout(raw: string | null | undefined, seed: string): FighterLoadout {
  const fallback = defaultLoadout(seed);
  if (!raw || !raw.startsWith(`${PREFIX}.`)) return fallback;
  const parts = raw.split('.').slice(1).map((p) => Number(p));
  if (parts.length < 7 || parts.some((n) => !Number.isFinite(n))) return fallback;
  return {
    skin: wrap(parts[0], SKIN_HEX.length),
    hair: HAIR_STYLES[wrap(parts[1], HAIR_STYLES.length)],
    hairColor: wrap(parts[2], HAIR_HEX.length),
    trunks: wrap(parts[3], CLOTH_HEX.length),
    gloves: wrap(parts[4], CLOTH_HEX.length),
    boots: wrap(parts[5], CLOTH_HEX.length),
    body: BODY_TYPES[wrap(parts[6], BODY_TYPES.length)],
  };
}

export function loadoutFromPlayer(player: {
  display_name: string;
  avatar_seed?: string | null;
}): FighterLoadout {
  return parseLoadout(player.avatar_seed, player.display_name);
}

const LOCAL_KEY = 'tuneboxed.fighter.loadout';

export function readLocalLoadout(): FighterLoadout | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return parseLoadout(raw, 'local');
  } catch {
    return null;
  }
}

export function writeLocalLoadout(loadout: FighterLoadout): void {
  try {
    localStorage.setItem(LOCAL_KEY, encodeLoadout(loadout));
  } catch {
    /* private mode */
  }
}

export function hexOf(list: readonly string[], index: number): string {
  return list[wrap(index, list.length)];
}
