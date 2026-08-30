import { useEffect, useRef, useState } from 'react';
import * as battle from '../lib/battleClient';
import { secondsSince } from './clock';
import { openVoting } from './hostActions';
import { CLIP_SECONDS } from './rules';
import type { BattleRound, BattleSubmission } from '../types/battle';

interface Options {
  token: string | null;
  isHost: boolean;
  round: BattleRound | null;
  submissions: BattleSubmission[];
  /** Every clip in the round has finished playing. */
  playbackFinished: boolean;
}

/**
 * The parts of a round that run themselves.
 *
 * A phase that only ever moves when somebody clicks is a phase that strands
 * the room the moment the host tabs away, and a streamer now has two tabs open
 * by design. Both the room and the board run this; the server ignores whichever
 * call arrives second.
 *
 * Returns whether the pick clock expired with nothing in it, which is the one
 * case that cannot resolve itself and needs the host to add time.
 */
export function useRoundAutopilot({
  token,
  isHost,
  round,
  submissions,
  playbackFinished,
}: Options): { empty: boolean } {
  const phase = round?.phase ?? null;

  // Drives the deadline check; a timestamp on its own never re-renders.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== 'picking') return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  /*
   * Close the playing phase once the last clip has run out.
   *
   * Nothing else does this. The songs would finish, the room would sit on a
   * silent now-playing card, and the only way out would be a reload. The ref
   * makes sure a re-render during the call does not fire it twice.
   */
  const advancedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isHost || !token || phase !== 'playing' || !playbackFinished) return;
    const roundId = round?.id;
    if (!roundId || advancedRef.current === roundId) return;
    advancedRef.current = roundId;
    void openVoting(token, roundId).catch(() => {
      // Let the next tick retry rather than stranding the room.
      advancedRef.current = null;
    });
  }, [isHost, token, phase, playbackFinished, round?.id]);

  /*
   * Close the picking phase the moment the clock runs out.
   *
   * Whoever got their song in wins a round nobody else entered, which is the
   * point of a deadline: turning up beats not turning up. Two or more picks
   * and the songs simply start. Nobody at all leaves the round open, and the
   * host is offered more time rather than a dead end.
   *
   * The host acts first and everyone else backs them up a few seconds later,
   * so a host on a sleeping tab cannot strand the room.
   */
  const closedRef = useRef<string | null>(null);
  const [emptyKey, setEmptyKey] = useState<string | null>(null);
  const deadlineKey = round ? `${round.id}|${round.phase_deadline_at}` : null;

  useEffect(() => {
    if (!token || phase !== 'picking' || !round?.phase_deadline_at || !deadlineKey) return;
    if (secondsSince(round.phase_deadline_at) < (isHost ? 0 : 3)) return;
    // Keyed on the deadline as well as the round, so extending the clock arms
    // this again instead of leaving it spent.
    if (closedRef.current === deadlineKey) return;

    closedRef.current = deadlineKey;
    const roundId = round.id;
    const locked = submissions;

    void battle
      .closePicking(token, roundId, CLIP_SECONDS)
      .then((outcome) => {
        if (outcome === 'empty') setEmptyKey(deadlineKey);
      })
      .catch(() => {
        // Reach the same end with the calls that have always been there,
        // rather than leaving the room on a spent clock. Deliberately not
        // rearmed: if this fails too, the host still has the buttons.
        if (!isHost) return;
        if (locked.length === 1) {
          void battle.setRoundWinner(token, roundId, locked[0].id).catch(() => {});
        } else if (locked.length >= 2) {
          void battle
            .startPlayback(token, roundId, locked.map((s) => s.id), CLIP_SECONDS)
            .catch(() => {});
        } else {
          setEmptyKey(deadlineKey);
        }
      });
  }, [token, isHost, phase, round?.id, round?.phase_deadline_at, deadlineKey, submissions, tick]);

  return { empty: emptyKey !== null && emptyKey === deadlineKey && submissions.length === 0 };
}
