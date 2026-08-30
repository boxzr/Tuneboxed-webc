import type { BattleFormat, BattlePlayStyle, BattlePlayer, BattleRoom } from '../types/battle';
import { nextGenre } from './genres';

/**
 * How a room asks for songs.
 *
 * Classic is the songbattle.io shape: one vibe for the whole game, songs in
 * before anything starts, no pick clock. TuneBoxed is the live game: a fresh
 * random prompt each round and 45 seconds on the clock.
 *
 * A room that predates the column, or an iOS room that never set one, reads
 * as TuneBoxed so those games keep the behaviour they already have.
 */
export function isClassic(room: Pick<BattleRoom, 'play_style'> | null | undefined): boolean {
  return room?.play_style === 'classic';
}

/** What a newly created room of this format should open as. */
export function defaultPlayStyle(format: BattleFormat): BattlePlayStyle {
  return format === 'bracket' ? 'classic' : 'tuneboxed';
}

/** Whether this player has locked a Classic lobby song. */
export function hasEntry(player: BattlePlayer): boolean {
  return Boolean(player.entry_song_title);
}

/** The prompt a new round should use. Classic never rolls a new one. */
export function genreForRound(room: BattleRoom, used: readonly string[]): string {
  if (isClassic(room) && room.theme) return room.theme;
  return nextGenre(used);
}

/** How many people have a song ready in the lobby. */
export function entryCount(players: readonly BattlePlayer[]): number {
  return players.filter(hasEntry).length;
}

/**
 * Whether Classic is allowed to leave the lobby.
 *
 * Needs a vibe and enough locked-in songs. Connected count does not matter:
 * a viewer who never picked is an audience, not a missing player.
 */
export function classicReady(room: BattleRoom, players: readonly BattlePlayer[]): boolean {
  return Boolean(room.theme?.trim()) && entryCount(players) >= room.min_players;
}
