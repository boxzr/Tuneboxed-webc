import { supabase } from './supabase';
import type {
  BattleChampion,
  BattleFormat,
  BattleMatch,
  BattleMatchStatus,
  BattlePlayer,
  BattleRoom,
  BattleRound,
  BattleRoundPhase,
  BattleRoomStatus,
  BattleSession,
  BattleSubmission,
  BattleVote,
  BattleVotingMode,
  PublicStats,
} from '../types/battle';

// The RPCs raise bare codes so every client can phrase them for itself.
// Anything unmapped falls through to the raw message rather than being
// swallowed, so a new server-side code is visible instead of silent.
const MESSAGES: Record<string, string> = {
  BATTLE_AUTH_REQUIRED: 'You are not in this room anymore. Try rejoining.',
  BATTLE_INVALID_SESSION: 'Your session expired. Rejoin to keep playing.',
  BATTLE_HOST_ONLY: 'Only the host can do that.',
  BATTLE_ROOM_NOT_FOUND: "That room code doesn't exist. Double-check and try again.",
  BATTLE_ROOM_FULL: 'This room is full.',
  BATTLE_NAME_TAKEN:
    'Someone is in the room under that name right now. If it is you on another device, close it and try again in a moment.',
  BATTLE_NAME_REQUIRED: 'Pick a name first.',
  BATTLE_NAME_TOO_LONG: 'Keep your name to 24 characters or fewer.',
  BATTLE_NAME_BLOCKED: "That name isn't allowed. Pick another one.",
  BATTLE_SONG_BLOCKED: "That track isn't allowed in a battle. Pick another song.",
  BATTLE_SONG_TOO_LONG: 'That title is too long to put on the board.',
  BATTLE_PICKING_CLOSED: 'Song picking has closed for this round.',
  BATTLE_VOTING_CLOSED: 'Voting is not open right now.',
  BATTLE_NOT_JUDGE: 'Only the judge votes this round.',
  BATTLE_NOT_HOST: 'Only the host votes in this room.',
  BATTLE_NO_SELF_VOTE: 'You cannot crown your own song.',
  BATTLE_COMPETITOR_CANNOT_VOTE: 'You are in this matchup, so you sit this vote out.',
  BATTLE_ROUND_NOT_IN_ROOM: 'That round belongs to a different room.',
  BATTLE_SUBMISSION_NOT_IN_ROUND: 'That song is not in this round.',
  BATTLE_MATCH_NOT_IN_ROOM: 'That matchup belongs to a different room.',
  BATTLE_PHASE_NOT_ADVANCEABLE: 'Wait for the timer before skipping ahead.',
  BATTLE_FORMAT_LOCKED: 'The format can only change while you are still in the lobby.',
  BATTLE_HOST_STILL_ACTIVE: 'The host is still here.',
  BATTLE_CODE_EXHAUSTED: 'Could not create a room code. Try again.',
  BATTLE_BRACKET_TOO_SMALL: 'A bracket needs at least two players in the room.',
};

export class BattleError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'BattleError';
    this.code = code;
  }
}

function toBattleError(raw: string): BattleError {
  const match = raw.match(/BATTLE_[A-Z_]+/);
  const code = match ? match[0] : 'BATTLE_UNKNOWN';
  return new BattleError(code, MESSAGES[code] ?? raw);
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw toBattleError(error.message);
  return data as T;
}

// ---------------------------------------------------------------
// Session storage
//
// The token is the only proof a guest has that they are who they say, so
// losing it on refresh would drop them out of their own room. Scoped per
// room code so opening two rooms in two tabs does not clobber either.
// ---------------------------------------------------------------

const key = (code: string) => `tuneboxed.battle.${code.toUpperCase()}`;

export function saveSession(session: BattleSession): void {
  try {
    localStorage.setItem(
      key(session.room.code),
      JSON.stringify({ token: session.token, playerId: session.player.id })
    );
  } catch {
    // Safari private mode throws on write. A lost token just means the
    // player rejoins by name, so this is not worth surfacing.
  }
}

export function loadSession(code: string): { token: string; playerId: string } | null {
  try {
    const raw = localStorage.getItem(key(code));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(code: string): void {
  try {
    localStorage.removeItem(key(code));
  } catch {
    /* see saveSession */
  }
}

/**
 * The last name this browser played under.
 *
 * Kept apart from the per-room session because it is what gets someone back
 * into a room whose token they no longer have: typing the same name reclaims
 * the seat, and most people would rather not type it at all.
 */
const NAME_KEY = 'tuneboxed.battle.name';

export function rememberName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* see saveSession */
  }
}

export function lastName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------
// Joining
// ---------------------------------------------------------------

export async function createRoom(opts: {
  displayName: string;
  mode?: 'group' | 'bar_for_bar';
  format?: BattleFormat;
  votingMode?: BattleVotingMode;
  /** Set when a signed-in streamer hosts, so the room and overlay show them. */
  twitchLogin?: string | null;
  twitchAvatarUrl?: string | null;
}): Promise<BattleSession> {
  const session = await rpc<BattleSession>('battle_create_room', {
    p_mode: opts.mode ?? 'group',
    p_host_display_name: opts.displayName,
    p_host_is_guest: true,
    p_format: opts.format ?? 'rounds',
    p_voting_mode: opts.votingMode ?? 'judge',
    p_host_twitch_login: opts.twitchLogin ?? null,
    p_host_avatar_url: opts.twitchAvatarUrl ?? null,
  });
  saveSession(session);
  rememberName(session.player.display_name);
  return session;
}

/**
 * Push the current Twitch chat tally for a round. Host only, and the whole
 * tally goes up each time rather than a delta, so a dropped call self-corrects
 * on the next one instead of leaving the count short.
 */
export async function reportChatTally(
  token: string,
  roundId: string,
  tally: Record<string, number>
): Promise<void> {
  await rpc<void>('battle_report_chat_tally', {
    p_token: token,
    p_round_id: roundId,
    p_tally: tally,
  });
}

export async function joinRoom(code: string, displayName: string): Promise<BattleSession> {
  const existing = loadSession(code);
  const session = await rpc<BattleSession>('battle_join_room', {
    p_code: code,
    p_display_name: displayName,
    p_is_guest: true,
    p_token: existing?.token ?? null,
  });
  saveSession(session);
  rememberName(session.player.display_name);
  return session;
}

/**
 * Whether the session this browser has stored still gets into the room.
 *
 * Asked before the join form is shown, so somebody reopening the invite link
 * lands back in the game rather than being asked to introduce themselves to a
 * room they are already sitting in. A heartbeat is the probe because it fails
 * on a dead token and, when it works, marks them present again.
 */
export async function resumeRoom(code: string): Promise<boolean> {
  const existing = loadSession(code);
  if (!existing) return false;
  try {
    await heartbeat(existing.token);
    return true;
  } catch (e) {
    // Only a seat that is genuinely gone is worth forgetting. A flaky
    // connection is not, and throwing the token away over one would lock
    // somebody out of a room they are still sitting in.
    const reason = e instanceof BattleError ? e.code : '';
    if (reason === 'BATTLE_INVALID_SESSION' || reason === 'BATTLE_AUTH_REQUIRED') {
      clearSession(code);
    }
    return false;
  }
}

// ---------------------------------------------------------------
// Reads
//
// These stay as plain selects: the tables are readable by design, since a
// room is meant to be watchable. Only writes go through RPCs.
// ---------------------------------------------------------------

export async function getRoomByCode(code: string): Promise<BattleRoom | null> {
  const { data, error } = await supabase
    .from('battle_rooms')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw toBattleError(error.message);
  return data;
}

export async function getRoom(id: string): Promise<BattleRoom | null> {
  const { data, error } = await supabase.from('battle_rooms').select('*').eq('id', id).maybeSingle();
  if (error) throw toBattleError(error.message);
  return data;
}

export async function getPlayers(roomId: string): Promise<BattlePlayer[]> {
  const { data, error } = await supabase
    .from('battle_players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

export async function getRound(roomId: string, roundNumber: number): Promise<BattleRound | null> {
  const { data, error } = await supabase
    .from('battle_rounds')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)
    .maybeSingle();
  if (error) throw toBattleError(error.message);
  return data;
}

export async function getRounds(roomId: string): Promise<BattleRound[]> {
  const { data, error } = await supabase
    .from('battle_rounds')
    .select('*')
    .eq('room_id', roomId)
    .order('round_number', { ascending: true });
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

export async function getRoomSubmissions(roomId: string): Promise<BattleSubmission[]> {
  const { data, error } = await supabase
    .from('battle_submissions')
    .select('*')
    .eq('room_id', roomId);
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

export async function getSubmissions(roundId: string): Promise<BattleSubmission[]> {
  const { data, error } = await supabase
    .from('battle_submissions')
    .select('*')
    .eq('round_id', roundId)
    .order('submitted_at', { ascending: true });
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

export async function getVotes(roundId: string): Promise<BattleVote[]> {
  const { data, error } = await supabase.from('battle_votes').select('*').eq('round_id', roundId);
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

export async function getMatches(roomId: string): Promise<BattleMatch[]> {
  const { data, error } = await supabase
    .from('battle_matches')
    .select('*')
    .eq('room_id', roomId)
    .order('bracket_round', { ascending: true })
    .order('match_index', { ascending: true });
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

/**
 * Recent published champions for the winners page.
 *
 * Only battles a host chose to publish appear here, and the winner's name is
 * present only when they also opted into that.
 */
export async function getChampions(limit = 30): Promise<BattleChampion[]> {
  const { data, error } = await supabase
    .from('battle_champions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw toBattleError(error.message);
  return data ?? [];
}

/** Cumulative counters for the marketing site. */
export const getPublicStats = () => rpc<PublicStats>('battle_public_stats', {});

// ---------------------------------------------------------------
// Writes, all token-validated server-side
// ---------------------------------------------------------------

/** Put a finished bracket on the public winners board. Host only. */
export const publishChampion = (token: string, includeWinnerName: boolean) =>
  rpc<BattleChampion>('battle_publish_champion', {
    p_token: token,
    p_include_winner_name: includeWinnerName,
  });

/** Tells the room this player is still here, and proves the token still works. */
export const heartbeat = (token: string, isConnected = true) =>
  rpc<void>('battle_sesh', { p_token: token, p_is_connected: isConnected });

export const leaveRoom = (token: string) => rpc<void>('battle_leave_room', { p_token: token });

export const claimHost = (token: string) => rpc<void>('battle_claim_host', { p_token: token });

export const submitSong = (
  token: string,
  roundId: string,
  song: {
    title: string;
    artist: string;
    artworkUrl?: string | null;
    previewUrl?: string | null;
    externalId?: string | null;
    source?: string | null;
  }
) =>
  rpc<BattleSubmission>('battle_submit_song', {
    p_token: token,
    p_round_id: roundId,
    p_song_title: song.title,
    p_song_artist: song.artist,
    p_artwork_url: song.artworkUrl ?? null,
    p_preview_url: song.previewUrl ?? null,
    p_external_id: song.externalId ?? null,
    p_source: song.source ?? null,
  });

export const castVote = (token: string, roundId: string, submissionId: string) =>
  rpc<void>('battle_cast_vote', {
    p_token: token,
    p_round_id: roundId,
    p_submission_id: submissionId,
  });

export const advancePhase = (
  token: string,
  roundId: string,
  phase: BattleRoundPhase,
  deadlineSeconds: number | null = null
) =>
  rpc<void>('battle_advance_phase', {
    p_token: token,
    p_round_id: roundId,
    p_phase: phase,
    p_deadline_seconds: deadlineSeconds,
  });

export const startPlayback = (
  token: string,
  roundId: string,
  order: string[],
  secondsPerSong = 30
) =>
  rpc<string | null>('battle_start_playback', {
    p_token: token,
    p_round_id: roundId,
    p_order: order,
    p_seconds_per_song: secondsPerSong,
  });

export const updateRoomSettings = (
  token: string,
  settings: {
    hostSpeakerEnabled?: boolean;
    votingMode?: BattleVotingMode;
    format?: BattleFormat;
    maxPlayers?: number;
  }
) =>
  rpc<BattleRoom>('battle_update_room_settings', {
    p_token: token,
    p_host_speaker_enabled: settings.hostSpeakerEnabled ?? null,
    p_voting_mode: settings.votingMode ?? null,
    p_format: settings.format ?? null,
    p_max_players: settings.maxPlayers ?? null,
  });

export const setRoomStatus = (token: string, status: BattleRoomStatus) =>
  rpc<void>('battle_set_room_status', { p_token: token, p_status: status });

export const startRound = (
  token: string,
  opts: {
    roundNumber: number;
    genre: string;
    isPremiumGenre?: boolean;
    judgePlayerId?: string | null;
    pickSeconds?: number;
    matchId?: string | null;
  }
) =>
  rpc<BattleRound>('battle_start_round', {
    p_token: token,
    p_round_number: opts.roundNumber,
    p_genre: opts.genre,
    p_is_premium_genre: opts.isPremiumGenre ?? false,
    p_judge_player_id: opts.judgePlayerId ?? null,
    p_pick_seconds: opts.pickSeconds ?? 60,
    p_match_id: opts.matchId ?? null,
  });

/**
 * What the room does when the pick clock hits zero.
 *
 * `walkover` means one person got their song in and takes the round,
 * `playing` means the songs have started, `empty` means nobody picked and it
 * is up to the caller, and `closed` means somebody beat us to it.
 */
export const closePicking = (token: string, roundId: string, secondsPerSong: number) =>
  rpc<'walkover' | 'playing' | 'empty' | 'closed'>('battle_close_picking', {
    p_token: token,
    p_round_id: roundId,
    p_seconds_per_song: secondsPerSong,
  });

export const setRoundWinner = (token: string, roundId: string, submissionId: string) =>
  rpc<void>('battle_set_round_winner', {
    p_token: token,
    p_round_id: roundId,
    p_submission_id: submissionId,
  });

export const pickNextJudge = (token: string) =>
  rpc<string | null>('battle_pick_next_judge', { p_token: token });

export const generateBracket = (token: string) =>
  rpc<number>('battle_generate_bracket', { p_token: token });

export const reportMatchWinner = (token: string, matchId: string, winnerPlayerId: string) =>
  rpc<string | null>('battle_report_match_winner', {
    p_token: token,
    p_match_id: matchId,
    p_winner_player_id: winnerPlayerId,
  });

export const setCurrentMatch = (token: string, matchId: string | null) =>
  rpc<void>('battle_set_current_match', { p_token: token, p_match_id: matchId });

/** Ties a matchup to the round being played for it, and marks it live. */
export const setMatchRound = (
  token: string,
  matchId: string,
  roundId: string,
  status: BattleMatchStatus = 'active'
) =>
  rpc<void>('battle_set_match_round', {
    p_token: token,
    p_match_id: matchId,
    p_round_id: roundId,
    p_status: status,
  });

export const resetForRematch = (token: string) =>
  rpc<void>('battle_reset_for_rematch', { p_token: token });

/**
 * Decides a round with nobody left to decide it, and hands back the winning
 * submission. A two player bracket is the case that needs this: both players
 * are in the matchup, neither may vote on their own song, and without chat
 * there is no third party in the room at all.
 */
export const pickAiRoundWinner = (token: string, roundId: string) =>
  rpc<string | null>('battle_pick_ai_round_winner', {
    p_token: token,
    p_round_id: roundId,
  });

export const tallyVotes = (roundId: string) =>
  rpc<string | null>('tally_battle_round_votes', { p_round_id: roundId });

export const serverNow = () => rpc<string>('battle_server_now', {});
