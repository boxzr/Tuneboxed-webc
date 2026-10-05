import type { BattleMatch, BattlePlayer, BattleSubmission } from '../types/battle';
import { defaultLoadout, loadoutFromPlayer, type FighterLoadout } from '../fight3d/loadout';

export { loadoutFromPlayer };
import { ownerId } from './playStyle';
import type { Fighter } from './ui/BoxingMatch';

/** The human who owns a bracket slot, which may itself be an extra song row. */
export function personOf(players: BattlePlayer[], id: string | null | undefined): BattlePlayer | null {
  if (!id) return null;
  const row = players.find((p) => p.id === id);
  if (!row) return null;
  if (!row.owner_player_id) return row;
  return players.find((p) => p.id === row.owner_player_id) ?? row;
}

export function loadoutOf(players: BattlePlayer[], id: string | null | undefined): FighterLoadout {
  const person = personOf(players, id);
  return person ? loadoutFromPlayer(person) : defaultLoadout(id ?? 'tuneboxed');
}

/** Anyone in the room who is not currently boxed in a corner. */
export function spectators(
  players: BattlePlayer[],
  aName: string,
  bName: string
): { name: string; loadout: FighterLoadout }[] {
  const skip = new Set([aName.toLowerCase(), bName.toLowerCase()]);
  const seen = new Set<string>();
  const out: { name: string; loadout: FighterLoadout }[] = [];
  for (const p of players) {
    if (p.owner_player_id) continue;
    const name = p.display_name;
    const key = name.toLowerCase();
    if (skip.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push({ name, loadout: loadoutFromPlayer(p) });
  }
  return out;
}

function asFighter(
  pick: BattleSubmission,
  index: number,
  counts: Record<string, number>,
  name: string,
  loadout: FighterLoadout
): Fighter {
  return {
    name,
    songTitle: pick.song_title,
    songArtist: pick.song_artist,
    artworkUrl: pick.artwork_url,
    votes: counts[pick.id] ?? 0,
    ballotNumber: index + 1,
    loadout,
  };
}

/**
 * Two songs, two corners. Used for Classic party rounds and any bout that is
 * not a seeded bracket matchup.
 */
export function pairFighters(
  submissions: BattleSubmission[],
  counts: Record<string, number>,
  players: BattlePlayer[],
  nameOf: (id: string | null) => string
): { a: Fighter; b: Fighter } | null {
  if (submissions.length !== 2) return null;
  const [sa, sb] = submissions;
  return {
    a: asFighter(sa, 0, counts, nameOf(sa.player_id), loadoutOf(players, sa.player_id)),
    b: asFighter(sb, 1, counts, nameOf(sb.player_id), loadoutOf(players, sb.player_id)),
  };
}

/** Bracket corners follow the match, not submission order. */
export function bracketFighters(
  match: BattleMatch | null,
  submissions: BattleSubmission[],
  counts: Record<string, number>,
  players: BattlePlayer[],
  nameOf: (id: string | null) => string
): { a: Fighter; b: Fighter } | null {
  if (!match) return null;
  const corner = (playerId: string | null): Fighter | null => {
    if (!playerId) return null;
    const at = submissions.findIndex((s) => s.player_id === playerId);
    if (at === -1) return null;
    return asFighter(
      submissions[at],
      at,
      counts,
      nameOf(playerId),
      loadoutOf(players, playerId)
    );
  };
  const a = corner(match.player_a_id);
  const b = corner(match.player_b_id);
  return a && b ? { a, b } : null;
}
