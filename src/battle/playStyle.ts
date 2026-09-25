import type { BattleFormat, BattlePlayStyle, BattleRoom } from '../types/battle';
import { nextGenre } from './genres';

export * from './entrants';

/**
 * How a room asks for songs.
 *
 * Classic is the songbattle.io shape: one vibe for the whole game, songs in
 * before anything starts, no pick clock. TuneBoxed is the live game: a fresh
 * random prompt each round and a pick clock the host can set.
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

/** The prompt a new round should use. Classic never rolls a new one. */
export function genreForRound(room: BattleRoom, used: readonly string[]): string {
  if (isClassic(room) && room.theme) return room.theme;
  return nextGenre(used);
}
