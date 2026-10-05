import { useEffect, useRef, useState } from 'react';
import {
  comboTier,
  emptyDirector,
  posesFor,
  tickDirector,
  PUNCH_HOLD_MS,
  type BoxerPose,
  type DirectorState,
  type PunchEvent,
  type PunchKind,
  type Side,
} from './punchDirector';
import { comboDuration } from './motion';

export interface ComboCall {
  side: Side;
  hits: number;
  streak: number;
  /** Actual votes behind it. */
  run: number;
  /** What each vote was worth. */
  boost: number;
  label: string;
  /** Bumps per combo so the banner replays. */
  key: number;
}

interface Live {
  a: BoxerPose;
  b: BoxerPose;
  beat: number;
  hits: number;
}

function holdFor(event: PunchEvent): number {
  if (event.kind === 'combo') return comboDuration(event.hits ?? 3) * 1000 + 350;
  return PUNCH_HOLD_MS[event.kind as PunchKind];
}

/** Keeps every earned combo; ordinary punches only keep the latest. */
function enqueue(queue: PunchEvent[], event: PunchEvent): PunchEvent[] {
  if (event.kind === 'combo') return [...queue.filter((e) => e.kind === 'combo'), event].slice(-3);
  return [...queue.filter((e) => e.kind === 'combo'), event];
}

/**
 * Votes become punches. A punch is allowed to finish before the next one
 * starts — cutting the clip every time the tally ticks made it look like
 * nobody was throwing.
 */
export function usePunchDirector(
  votesA: number,
  votesB: number,
  winner: Side | null,
  knockout: boolean
): {
  poseA: BoxerPose;
  poseB: BoxerPose;
  heatA: number;
  heatB: number;
  beat: number;
  hits: number;
  combo: ComboCall | null;
  streakA: number;
  streakB: number;
  /** Actual votes in each corner's current run. */
  runA: number;
  runB: number;
  /** What each vote is worth right now: more when chat is quiet. */
  boost: number;
} {
  const prev = useRef<DirectorState | null>(null);
  const busy = useRef(false);
  const queue = useRef<PunchEvent[]>([]);
  const timer = useRef(0);
  const comboTimer = useRef(0);
  const [heatA, setHeatA] = useState(0);
  const [heatB, setHeatB] = useState(0);
  const [streaks, setStreaks] = useState({ a: 0, b: 0, runA: 0, runB: 0 });
  const [boost, setBoost] = useState(1);
  const [combo, setCombo] = useState<ComboCall | null>(null);
  const [live, setLive] = useState<Live>({ a: 'idle', b: 'idle', beat: 0, hits: 0 });

  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(comboTimer.current);
    };
  }, []);

  useEffect(() => {
    const play = (event: PunchEvent) => {
      busy.current = true;
      setLive((cur) => ({ ...posesFor(event, null, false), beat: cur.beat + 1, hits: event.hits ?? 0 }));
      if (event.kind === 'combo') {
        const tier = comboTier(event.streak ?? 3);
        setCombo((cur) => ({
          side: event.side,
          hits: tier.hits,
          streak: event.streak ?? 3,
          run: event.run ?? event.streak ?? 3,
          boost: event.boost ?? 1,
          label: tier.label,
          key: (cur?.key ?? 0) + 1,
        }));
        window.clearTimeout(comboTimer.current);
        comboTimer.current = window.setTimeout(() => setCombo(null), holdFor(event) + 900);
      }
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const next = queue.current.shift();
        if (next) play(next);
        else {
          busy.current = false;
          setLive((cur) => ({ a: 'idle', b: 'idle', beat: cur.beat, hits: 0 }));
        }
      }, holdFor(event));
    };

    if (winner) {
      window.clearTimeout(timer.current);
      busy.current = false;
      queue.current = [];
      setLive((cur) => ({ ...posesFor(null, winner, knockout), beat: cur.beat + 1, hits: 0 }));
      return;
    }

    const before = prev.current;
    if (!before) {
      prev.current = { ...emptyDirector(), votesA, votesB };
      return;
    }

    const { state, event } = tickDirector(before, votesA, votesB, performance.now());
    prev.current = state;
    setHeatA(state.heatA);
    setHeatB(state.heatB);
    setStreaks({ a: state.streakA ?? 0, b: state.streakB ?? 0, runA: state.runA ?? 0, runB: state.runB ?? 0 });
    setBoost(state.boost ?? 1);

    if (!event) return;
    if (busy.current) queue.current = enqueue(queue.current, event);
    else play(event);
  }, [votesA, votesB, winner, knockout]);

  return {
    poseA: live.a,
    poseB: live.b,
    heatA,
    heatB,
    beat: live.beat,
    hits: live.hits,
    combo,
    streakA: streaks.a,
    streakB: streaks.b,
    runA: streaks.runA,
    runB: streaks.runB,
    boost,
  };
}
