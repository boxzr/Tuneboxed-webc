import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as battle from '../lib/battleClient';
import type { BattleRoom, BattleRound, BattleSubmission, BattleVote } from '../types/battle';

interface State {
  round: BattleRound | null;
  submissions: BattleSubmission[];
  votes: BattleVote[];
  loading: boolean;
}

/**
 * Tracks the room's current round and everything attached to it. Split from
 * useBattleRoom because the round changes identity every round while the
 * room does not, and resubscribing the whole room each time would churn the
 * realtime channel during a live battle.
 */
export function useBattleRound(room: BattleRoom | null) {
  const [state, setState] = useState<State>({
    round: null,
    submissions: [],
    votes: [],
    loading: true,
  });

  const roomId = room?.id ?? null;
  const roundNumber = room?.round_number ?? 0;

  const roundIdRef = useRef<string | null>(null);
  roundIdRef.current = state.round?.id ?? null;

  const refresh = useCallback(async () => {
    if (!roomId || roundNumber < 1) {
      setState({ round: null, submissions: [], votes: [], loading: false });
      return;
    }
    try {
      const round = await battle.getRound(roomId, roundNumber);
      if (!round) {
        setState({ round: null, submissions: [], votes: [], loading: false });
        return;
      }
      const [submissions, votes] = await Promise.all([
        battle.getSubmissions(round.id),
        battle.getVotes(round.id),
      ]);
      setState({ round, submissions, votes, loading: false });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [roomId, roundNumber]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`battle-round:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_rounds', filter: `room_id=eq.${roomId}` },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_submissions', filter: `room_id=eq.${roomId}` },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_votes', filter: `room_id=eq.${roomId}` },
        () => void refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  // Realtime covers the normal case; this catches a dropped socket, which
  // during a live stream is the difference between a stalled room and a
  // slightly late update.
  useEffect(() => {
    const t = setInterval(() => void refresh(), 6000);
    return () => clearInterval(t);
  }, [refresh]);

  return { ...state, refresh };
}
