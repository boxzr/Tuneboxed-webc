import { supabase } from './supabase';

/**
 * The app's nightly 16-song fight, as published by phones during the fight
 * window. Mirrors DailyFight.swift: likes decide every bout and a tie goes to
 * the better seed, so the site replays the same result the app shows.
 */
export interface DailyFighter {
  seed: number;
  title: string;
  artist: string;
  by: string;
  likes: number;
  artworkUrl: string | null;
  previewUrl: string | null;
}

export interface DailyFightCard {
  day: string;
  genre: string;
  fighters: DailyFighter[];
  updatedAt: string;
}

export interface DailyBout {
  round: number;
  index: number;
  red: DailyFighter | null;
  blue: DailyFighter | null;
  winner: DailyFighter | null;
}

export const ROUND_NAMES = ['Round of 16', 'Quarterfinals', 'Semifinals', 'Championship'];

/** Standard bracket order so seeds 1 and 2 can only meet in the final. */
const SEED_ORDER = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];

function winnerOf(red: DailyFighter | null, blue: DailyFighter | null): DailyFighter | null {
  if (!red) return blue;
  if (!blue) return red;
  if (red.likes !== blue.likes) return red.likes > blue.likes ? red : blue;
  return red.seed < blue.seed ? red : blue;
}

export function bracketFor(fighters: DailyFighter[]): DailyBout[][] {
  const bySeed = new Map(fighters.map((f) => [f.seed, f]));
  let round: DailyBout[] = [];
  for (let i = 0; i < SEED_ORDER.length; i += 2) {
    const red = bySeed.get(SEED_ORDER[i]) ?? null;
    const blue = bySeed.get(SEED_ORDER[i + 1]) ?? null;
    round.push({ round: 0, index: i / 2, red, blue, winner: winnerOf(red, blue) });
  }
  const rounds = [round];
  while (round.length > 1) {
    const prev = round;
    const r = rounds.length;
    round = Array.from({ length: prev.length / 2 }, (_, i) => {
      const red = prev[i * 2].winner;
      const blue = prev[i * 2 + 1].winner;
      return { round: r, index: i, red, blue, winner: winnerOf(red, blue) };
    });
    rounds.push(round);
  }
  return rounds;
}

export const isBye = (bout: DailyBout) => !bout.red || !bout.blue;

/** Tonight's card, or last night's until a new one is published. */
export async function fetchDailyFight(day?: string): Promise<DailyFightCard | null> {
  const { data, error } = await supabase.rpc('get_daily_fight', { p_day: day ?? null });
  if (error) throw new Error(error.message);
  return (data as DailyFightCard | null) ?? null;
}
