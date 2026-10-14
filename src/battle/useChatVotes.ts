import { useEffect, useRef, useState } from 'react';
import * as battle from '../lib/battleClient';
import { connectToChat, parseVote } from './twitchChat';
import { uniqueLeader } from './voteLeader';
import { addPunch, mergePunches, punchesAllowed } from './chatPunches';
import type { BattleRound, BattleSubmission } from '../types/battle';

/** How often the accumulated tally is pushed up. */
const REPORT_MS = 2000;
/** How often a counting board tells the room tab it has taken over. */
const CLAIM_MS = 1000;
/** How long the room tab waits after the last claim before counting again. */
const CLAIM_TTL_MS = 3500;

type HandoffMessage =
  | { type: 'claim' }
  | { type: 'counts'; counts: Record<string, number> }
  | { type: 'ballots'; entries: [string, string][] };

/**
 * Turns Twitch chat into punches for the current matchup.
 *
 * Only runs for the host, and only while judging. Viewers type the number of
 * the song they want: 1 or 2 in a bracket matchup, or its place in the list
 * in a party round. Each valid 1 or 2 is a punch — spam adds more.
 *
 * Counts live in a ref. Chat can be fast, and the ring reads the running
 * tally immediately so a burst of 1s lands as a burst of punches rather
 * than one ballot that moves every couple of seconds.
 *
 * The host can have both the room tab and the board open, and a streamer
 * watches the board while the room tab sits in the background, where the
 * browser throttles its timers. A board passes `prefer` to take the count
 * over: it claims the round on a BroadcastChannel, the room tab hands its
 * counts across and stops reporting, and picks the count back up if the
 * board closes.
 */
export function useChatVotes({
  enabled,
  channel,
  round,
  submissions,
  token,
  prefer = false,
}: {
  enabled: boolean;
  channel: string | null;
  round: BattleRound | null;
  submissions: BattleSubmission[];
  token: string | null;
  prefer?: boolean;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [connected, setConnected] = useState(false);

  const punches = useRef<Record<string, number>>({});
  const rate = useRef(new Map<string, number[]>());

  const judging = round?.phase === 'judging';
  const active = enabled && judging && Boolean(channel) && Boolean(token);
  const roundId = round?.id ?? null;

  // Ordering has to match what viewers see on the overlay, since they are
  // voting by position. submissions arrives already ordered.
  const idsKey = submissions.map((s) => s.id).join(',');

  useEffect(() => {
    punches.current = {};
    rate.current.clear();
    setCounts({});
  }, [roundId]);

  useEffect(() => {
    if (!active || !channel || !roundId) return;
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    let lastReport = 0;
    let claimedAt = 0;
    const yielding = () => !prefer && Date.now() - claimedAt < CLAIM_TTL_MS;

    const tallied = () => {
      const next: Record<string, number> = {};
      for (const id of ids) next[id] = punches.current[id] ?? 0;
      return next;
    };

    const flush = () => {
      lastReport = Date.now();
      const next = tallied();
      setCounts(next);
      if (yielding()) return;
      // Best effort. The next flush resends the whole tally, so a failure
      // here costs a couple of seconds of staleness rather than losing punches.
      if (token) void battle.reportChatTally(token, roundId, next).catch(() => {});
    };

    const handoff =
      typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(`tb-chat-votes:${roundId}`);
    if (handoff) {
      handoff.onmessage = (e: MessageEvent<HandoffMessage>) => {
        const msg = e.data;
        if (msg?.type === 'claim' && !prefer) {
          if (!yielding()) handoff.postMessage({ type: 'counts', counts: { ...punches.current } });
          claimedAt = Date.now();
        } else if (msg?.type === 'counts' && prefer) {
          punches.current = mergePunches(punches.current, msg.counts);
          flush();
        } else if (msg?.type === 'ballots' && prefer) {
          const incoming: Record<string, number> = {};
          for (const [, submissionId] of msg.entries) {
            incoming[submissionId] = (incoming[submissionId] ?? 0) + 1;
          }
          punches.current = mergePunches(punches.current, incoming);
          flush();
        }
      };
    }
    const claim = prefer && handoff ? setInterval(() => handoff.postMessage({ type: 'claim' }), CLAIM_MS) : null;
    if (prefer) handoff?.postMessage({ type: 'claim' });

    const conn = connectToChat(
      channel,
      (msg) => {
        const choice = parseVote(msg.text, ids.length);
        if (choice === null) return;
        const gate = punchesAllowed(rate.current.get(msg.user) ?? [], Date.now());
        rate.current.set(msg.user, gate.recent);
        if (!gate.ok) return;
        punches.current = addPunch(punches.current, ids[choice - 1]);
        setCounts(tallied());
        if (Date.now() - lastReport >= REPORT_MS) flush();
      },
      setConnected
    );

    const timer = setInterval(flush, REPORT_MS);

    return () => {
      conn.close();
      clearInterval(timer);
      if (claim) clearInterval(claim);
      handoff?.close();
      setConnected(false);
    };
  }, [active, channel, idsKey, roundId, token, prefer]);

  /** Submission id with a strict lead, or null if chat has not decided. */
  const leader = uniqueLeader(counts);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return { counts, connected, leader, total };
}
