import { useEffect, useState } from 'react';
import * as battle from '../lib/battleClient';

/**
 * Prompts this room has already been given.
 *
 * Read from the rounds table rather than remembered in the page, because the
 * host can now start a round from the board as easily as from the room, and a
 * tab that opened halfway through a bracket has no idea what has been asked.
 * A rematch deletes the rounds, so the pool reopens on its own.
 */
export function useUsedGenres(roomId: string | null, roundId: string | null): string[] {
  const [used, setUsed] = useState<string[]>([]);

  useEffect(() => {
    if (!roomId) return;
    let live = true;
    void battle
      .getRounds(roomId)
      .then((rounds) => live && setUsed(rounds.map((r) => r.genre).filter(Boolean)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [roomId, roundId]);

  return used;
}
