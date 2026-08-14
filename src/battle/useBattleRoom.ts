import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as battle from '../lib/battleClient';
import type { BattleMatch, BattlePlayer, BattleRoom } from '../types/battle';

interface State {
  room: BattleRoom | null;
  players: BattlePlayer[];
  matches: BattleMatch[];
  loading: boolean;
  error: string | null;
}

const HEARTBEAT_MS = 15_000;
// Realtime carries the room normally; this only covers a dropped socket.
const POLL_MS = 8_000;

/**
 * Keeps a room in sync over realtime, with polling as a safety net and a
 * heartbeat so presence and host handover stay accurate.
 */
export function useBattleRoom(roomId: string | null, token: string | null) {
  const [state, setState] = useState<State>({
    room: null,
    players: [],
    matches: [],
    loading: true,
    error: null,
  });

  // Held in a ref so the polling and realtime effects do not need to be torn
  // down and rebuilt every time the room object changes identity.
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  const refresh = useCallback(async () => {
    const id = roomIdRef.current;
    if (!id) return;
    try {
      const [room, players] = await Promise.all([battle.getRoom(id), battle.getPlayers(id)]);
      const matches = room?.format === 'bracket' ? await battle.getMatches(id) : [];
      setState({ room, players, matches, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    setState((s) => ({ ...s, loading: true }));
    void refresh();
  }, [roomId, refresh]);

  // Realtime
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`battle:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_rooms', filter: `id=eq.${roomId}` },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_players', filter: `room_id=eq.${roomId}` },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_matches', filter: `room_id=eq.${roomId}` },
        () => void refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  // Polling fallback
  useEffect(() => {
    if (!roomId) return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [roomId, refresh]);

  // Presence
  useEffect(() => {
    if (!token) return;
    void battle.heartbeat(token).catch(() => {});
    const t = setInterval(() => void battle.heartbeat(token).catch(() => {}), HEARTBEAT_MS);

    // A closing tab gets one last best-effort "I'm gone" so the roster does
    // not show ghosts until the heartbeat times out.
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        void battle.heartbeat(token, false).catch(() => {});
      } else {
        void battle.heartbeat(token, true).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [token]);

  return { ...state, refresh };
}
