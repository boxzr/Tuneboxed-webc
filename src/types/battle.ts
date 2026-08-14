// Mirrors the battle tables in supabase/migrations. Field names are the raw
// column names, since these objects come straight back from PostgREST.

export type BattleMode = 'group' | 'bar_for_bar';
export type BattleFormat = 'rounds' | 'bracket';
export type BattleVotingMode = 'judge' | 'host' | 'everyone';
export type BattleRoomStatus = 'lobby' | 'in_round' | 'judging' | 'results' | 'complete';
export type BattleRoundPhase = 'picking' | 'playing' | 'judging' | 'revealed';
export type BattleMatchStatus = 'pending' | 'active' | 'complete';

export interface BattleRoom {
  id: string;
  code: string;
  mode: BattleMode;
  status: BattleRoomStatus;
  host_player_id: string | null;
  judge_player_id: string | null;
  judge_history: string[];
  round_number: number;
  min_players: number;
  max_players: number;
  format: BattleFormat;
  voting_mode: BattleVotingMode;
  host_speaker_enabled: boolean | null;
  current_match_id: string | null;
  bracket_size: number | null;
  /** Set when a signed-in streamer hosts from the web. Null for iOS rooms. */
  host_twitch_login: string | null;
  host_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BattlePlayer {
  id: string;
  room_id: string;
  display_name: string;
  avatar_seed: string | null;
  is_guest: boolean;
  is_connected: boolean;
  last_seen_at: string;
  joined_at: string;
}

export interface BattleRound {
  id: string;
  room_id: string;
  round_number: number;
  genre: string;
  is_premium_genre: boolean;
  phase: BattleRoundPhase;
  phase_deadline_at: string | null;
  judge_player_id: string | null;
  winner_submission_id: string | null;
  playback_started_at: string | null;
  playback_order: string[] | null;
  seconds_per_song: number;
  match_id: string | null;
  created_at: string;
}

export interface BattleSubmission {
  id: string;
  room_id: string;
  round_id: string;
  player_id: string;
  song_title: string;
  song_artist: string;
  artwork_url: string | null;
  preview_url: string | null;
  external_id: string | null;
  source: string | null;
  submitted_at: string;
}

export interface BattleVote {
  id: string;
  room_id: string;
  round_id: string;
  voter_player_id: string;
  submission_id: string;
  voted_at: string;
}

export interface BattleMatch {
  id: string;
  room_id: string;
  bracket_round: number;
  match_index: number;
  player_a_id: string | null;
  player_b_id: string | null;
  winner_player_id: string | null;
  next_match_id: string | null;
  next_slot: 'a' | 'b' | null;
  status: BattleMatchStatus;
  round_id: string | null;
  created_at: string;
}

/** What `battle_create_room` and `battle_join_room` hand back. */
export interface BattleSession {
  room: BattleRoom;
  player: BattlePlayer;
  token: string;
}
