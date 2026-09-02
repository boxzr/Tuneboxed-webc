import * as battle from '../lib/battleClient';
import { resolvedVoting } from './GameSettings';
import { genreForRound, isClassic } from './playStyle';
import { CLIP_SECONDS, PARTY_ROUNDS, PICK_SECONDS, VOTE_SECONDS } from './rules';
import type { BattleMatch, BattleRoom, BattleRound, BattleSubmission } from '../types/battle';

/**
 * Everything the host can do to move a battle along.
 *
 * This used to live inside the room page as a pile of inline click handlers,
 * which meant the board at /tv could only ever watch. A host running a stream
 * has the board on the capture screen and the room on a second monitor, and
 * was having to click back to the room for every reveal. Both surfaces now
 * call the same functions, so neither can quietly grow a different idea of
 * what "next" means.
 */

export interface HostContext {
  token: string;
  room: BattleRoom;
  matches: BattleMatch[];
  round: BattleRound | null;
  submissions: BattleSubmission[];
  /** Submission with a clear lead, or null for a tie or an empty ballot. */
  voteLeader: string | null;
  /** Prompts already used this room, so a bracket never repeats one. */
  usedGenres: readonly string[];
  refresh: () => Promise<void>;
}

const matchOf = (ctx: HostContext): BattleMatch | null =>
  ctx.matches.find((m) => m.id === ctx.room.current_match_id) ?? null;

/**
 * Classic already has the songs. Copy them onto the round and start playing
 * so nobody sits on a pick clock they already beat in the lobby.
 */
async function playClassicRound(ctx: HostContext, roundId: string): Promise<void> {
  await battle.seedRoundFromEntries(ctx.token, roundId);
  const seeded = await battle.getSubmissions(roundId);
  if (seeded.length >= 2) {
    await battle.startPlayback(
      ctx.token,
      roundId,
      seeded.map((s) => s.id),
      CLIP_SECONDS
    );
  }
  await ctx.refresh();
}

/** Opens a fresh picking round scoped to one head-to-head matchup. */
export async function startMatchRound(
  ctx: HostContext,
  match: BattleMatch,
  roomRoundNumber: number
): Promise<void> {
  const classic = isClassic(ctx.room);
  const created = await battle.startRound(ctx.token, {
    roundNumber: roomRoundNumber + 1,
    genre: genreForRound(ctx.room, ctx.usedGenres),
    pickSeconds: classic ? 0 : PICK_SECONDS,
    matchId: match.id,
  });
  await battle.setMatchRound(ctx.token, match.id, created.id, 'active');
  if (classic) await playClassicRound(ctx, created.id);
  else await ctx.refresh();
}

/** Opens the next party round: everyone picks, a rotating judge crowns. */
export async function startPartyRound(
  ctx: HostContext,
  roomRoundNumber: number
): Promise<void> {
  const classic = isClassic(ctx.room);
  const wantsJudge = ctx.room.format !== 'bracket' && resolvedVoting(ctx.room) === 'judge';
  const judgePlayerId = wantsJudge ? await battle.pickNextJudge(ctx.token) : null;
  const created = await battle.startRound(ctx.token, {
    roundNumber: roomRoundNumber + 1,
    genre: genreForRound(ctx.room, ctx.usedGenres),
    pickSeconds: classic ? 0 : PICK_SECONDS,
    judgePlayerId,
  });
  // First Classic party round uses the lobby songs. Later rounds pick again,
  // still with no clock, because a best-of-three is not the same track thrice.
  if (classic && roomRoundNumber === 0) await playClassicRound(ctx, created.id);
  else await ctx.refresh();
}

/** Seeds the bracket if there is one, then opens the first round. */
export async function startGame(ctx: HostContext): Promise<void> {
  if (ctx.room.status !== 'lobby') return;

  if (ctx.room.format !== 'bracket') {
    await startPartyRound(ctx, ctx.room.round_number);
    return;
  }

  await battle.generateBracket(ctx.token);
  const fresh = await battle.getRoom(ctx.room.id);
  const seeded = await battle.getMatches(ctx.room.id);
  const first =
    seeded.find((m) => m.id === fresh?.current_match_id) ??
    seeded.find((m) => m.status === 'pending' && m.player_a_id && m.player_b_id);
  if (!first) throw new Error('Could not build a bracket from this room.');
  await startMatchRound(ctx, first, fresh?.round_number ?? 0);
}

/** Starts the songs before the pick clock runs out. */
export async function playNow(ctx: HostContext): Promise<void> {
  if (!ctx.round) return;
  await battle.startPlayback(
    ctx.token,
    ctx.round.id,
    ctx.submissions.map((s) => s.id),
    CLIP_SECONDS
  );
}

/** Reopens the pick clock after it expired with nothing in. */
export async function extendPicking(ctx: HostContext): Promise<void> {
  if (!ctx.round) return;
  await battle.advancePhase(ctx.token, ctx.round.id, 'picking', PICK_SECONDS);
}

/**
 * Crowns the round.
 *
 * A clear lead from chat or the room stands. Anything else (nobody voted, or
 * a tie) goes to the AI judge, and a coin flip backs that up so a round can
 * never wedge on a dead endpoint.
 */
export async function revealWinner(ctx: HostContext): Promise<void> {
  if (!ctx.round) return;
  if (ctx.voteLeader) {
    await battle.setRoundWinner(ctx.token, ctx.round.id, ctx.voteLeader);
    return;
  }
  try {
    await battle.pickAiRoundWinner(ctx.token, ctx.round.id);
  } catch {
    const pick = ctx.submissions[Math.floor(Math.random() * ctx.submissions.length)];
    if (pick) await battle.setRoundWinner(ctx.token, ctx.round.id, pick.id);
  }
}

/** Moves past a revealed round: next matchup, next round, or the trophy. */
export async function advance(ctx: HostContext): Promise<void> {
  const round = ctx.round;
  if (!round) return;
  const winning = ctx.submissions.find((s) => s.id === round.winner_submission_id);
  if (!winning) return;

  if (ctx.room.format !== 'bracket') {
    if (ctx.room.round_number >= PARTY_ROUNDS) {
      await battle.setRoomStatus(ctx.token, 'complete');
      await ctx.refresh();
    } else {
      await startPartyRound(ctx, ctx.room.round_number);
    }
    return;
  }

  const current = matchOf(ctx);
  if (!current) return;

  const nextId = await battle.reportMatchWinner(ctx.token, current.id, winning.player_id);
  const seeded = await battle.getMatches(ctx.room.id);
  const next = nextId ? seeded.find((m) => m.id === nextId) : null;

  if (next) await startMatchRound(ctx, next, ctx.room.round_number);
  else {
    await battle.setRoomStatus(ctx.token, 'complete');
    await ctx.refresh();
  }
}

/** Clears the bracket and puts everyone back in the lobby. */
export async function rematch(ctx: HostContext): Promise<void> {
  await battle.resetForRematch(ctx.token);
  await ctx.refresh();
}

/** Closes the playing phase and opens voting. */
export const openVoting = (token: string, roundId: string) =>
  battle.advancePhase(token, roundId, 'judging', VOTE_SECONDS);

// ---------------------------------------------------------------

export type HostActionId = 'start' | 'play' | 'extend' | 'reveal' | 'next' | 'rematch';

export interface HostAction {
  id: HostActionId;
  label: string;
  disabled: boolean;
  run: () => Promise<void>;
}

export interface HostActionOptions {
  /** Enough people in the room to start. */
  ready: boolean;
  /** Nobody in the room is eligible to vote, so the AI has to call it. */
  needsAiJudge: boolean;
  /** The pick clock expired with no songs in. */
  empty: boolean;
  /** The bracket or the best-of-three is over. */
  finished: boolean;
}

/**
 * The single thing the host should press right now, or null while the game is
 * running itself. The room page lays these out per phase and the board puts
 * whichever one is live into one bar, so the streamer never has to work out
 * which tab a button lives in.
 */
export function nextHostAction(
  ctx: HostContext,
  { ready, needsAiJudge, empty, finished }: HostActionOptions
): HostAction | null {
  const { room, round, submissions } = ctx;

  if (finished) {
    return { id: 'rematch', label: 'Run it back', disabled: false, run: () => rematch(ctx) };
  }

  if (!round) {
    const classic = isClassic(room);
    return {
      id: 'start',
      label: !ready && classic && !room.theme?.trim()
        ? 'Pick a vibe first'
        : room.format === 'bracket'
          ? 'Start the bracket'
          : 'Start the battle',
      disabled: !ready,
      run: () => startGame(ctx),
    };
  }

  switch (round.phase) {
    case 'picking':
      if (submissions.length >= 2) {
        return { id: 'play', label: 'Play them now', disabled: false, run: () => playNow(ctx) };
      }
      if (empty) {
        return {
          id: 'extend',
          label: `Give them another ${PICK_SECONDS} seconds`,
          disabled: false,
          run: () => extendPicking(ctx),
        };
      }
      return null;

    case 'judging':
      return {
        id: 'reveal',
        label: ctx.voteLeader || needsAiJudge ? 'Reveal the winner' : 'Let the AI judge call it',
        disabled: submissions.length === 0,
        run: () => revealWinner(ctx),
      };

    case 'revealed': {
      if (room.status === 'complete') return null;
      const current = matchOf(ctx);
      const label =
        room.format === 'bracket'
          ? current?.next_match_id
            ? 'Next matchup'
            : 'Crown the champion'
          : room.round_number >= PARTY_ROUNDS
            ? 'See who won'
            : 'Next round';
      return { id: 'next', label, disabled: false, run: () => advance(ctx) };
    }

    default:
      return null;
  }
}
