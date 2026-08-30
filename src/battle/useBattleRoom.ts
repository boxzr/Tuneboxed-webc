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

const SESH_MS = 15_000;
// Realtime carries the room normally; this only covers a dropped socket.
const POLL_MS = 8_000;

/**
 * Keeps a room in sync over realtime, with polling as a safety net and a
 * regular check-in so presence and host handover stay accurate.
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
    void battle.sesh(token).catch(() => {});
    const t = setInterval(() => void battle.sesh(token).catch(() => {}), SESH_MS);

    // A closing tab gets one last best-effort "I'm gone" so the roster does
    // not show ghosts until the seat goes stale on its own.
    //
    // Only on pagehide, never on a tab merely going background. A host running
    // a stream keeps the board open in a second tab, and marking them away the
    // moment they look at it emptied their seat and put the room a handover
    // away from taking the host badge off them.
    const onLeave = () => void battle.sesh(token, false).catch(() => {});
    window.addEventListener('pagehide', onLeave);

    // Background tabs get their timers throttled well past the point a seat
    // goes stale, so coming back to the foreground checks in immediately.
    const onShow = () => {
      if (document.visibilityState === 'visible') void battle.sesh(token, true).catch(() => {});
    };
    document.addEventListener('visibilitychange', onShow);

    return () => {
      clearInterval(t);
      window.removeEventListener('pagehide', onLeave);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [token]);

  return { ...state, refresh };
}
