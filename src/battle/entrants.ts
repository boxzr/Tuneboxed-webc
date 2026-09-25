import type { BattlePlayer, BattleRoom } from '../types/battle';

// Who and what is in a Classic lobby. Kept apart from playStyle.ts, which
// pulls in the genre list, so the test runner can load these on their own.

/** Whether this player has locked a Classic lobby song. */
export function hasEntry(player: BattlePlayer): boolean {
  return Boolean(player.entry_song_title);
}

/** How many songs are ready in the lobby. Pass entrants, not people. */
export function entryCount(players: readonly BattlePlayer[]): number {
  return players.filter(hasEntry).length;
}

/** The person a row belongs to: itself, or the player who added this song. */
export function ownerId(player: Pick<BattlePlayer, 'id' | 'owner_player_id'>): string {
  return player.owner_player_id ?? player.id;
}

/**
 * People in the room, without the extra-song rows. The roster, presence and
 * seat counts all want this; a player with three songs is still one player.
 */
export function people(rows: readonly BattlePlayer[]): BattlePlayer[] {
  return rows.filter((p) => !p.owner_player_id);
}

/**
 * Every row, with each extra song labelled by its owner's name instead of the
 * "Ava #2" the database needs to keep names unique. This is what the bracket,
 * the fight and anything else that names a match player should read.
 */
export function withOwnerNames(rows: readonly BattlePlayer[]): BattlePlayer[] {
  const byId = new Map(rows.map((p) => [p.id, p]));
  return rows.map((p) => {
    const owner = p.owner_player_id ? byId.get(p.owner_player_id) : null;
    return owner ? { ...p, display_name: owner.display_name } : p;
  });
}

/** A person's songs in the lobby, their own row first. */
export function songsOf(rows: readonly BattlePlayer[], personId: string): BattlePlayer[] {
  return rows
    .filter((p) => ownerId(p) === personId && hasEntry(p))
    .sort((a, b) => Number(Boolean(a.owner_player_id)) - Number(Boolean(b.owner_player_id)));
}

/** Songs each player may bring. Only brackets take more than one. */
export function songsPerPlayer(room: Pick<BattleRoom, 'format' | 'songs_per_player'>): number {
  if (room.format !== 'bracket') return 1;
  return Math.min(5, Math.max(1, room.songs_per_player ?? 1));
}

/** Whether the host sits out of the bracket and picks every winner. */
export function hostJudges(room: Pick<BattleRoom, 'format' | 'host_judges'>): boolean {
  return room.format === 'bracket' && Boolean(room.host_judges);
}

/**
 * Whether Classic is allowed to leave the lobby.
 *
 * Needs a vibe and enough locked-in songs. Connected count does not matter:
 * a viewer who never picked is an audience, not a missing player.
 */
export function classicReady(room: BattleRoom, entrants: readonly BattlePlayer[]): boolean {
  return Boolean(room.theme?.trim()) && entryCount(bracketEntrants(room, entrants)) >= room.min_players;
}

/** The songs that will be seeded: everyone's, less the host's while they judge. */
export function bracketEntrants(room: BattleRoom, entrants: readonly BattlePlayer[]): BattlePlayer[] {
  if (!hostJudges(room) || !room.host_player_id) return [...entrants];
  return entrants.filter((p) => ownerId(p) !== room.host_player_id);
}
