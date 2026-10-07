import { useEffect, useRef, useState } from 'react';
import * as battle from '../lib/battleClient';
import { connectToChat, parseVote } from './twitchChat';
import { uniqueLeader } from './voteLeader';
import type { BattleRound, BattleSubmission } from '../types/battle';

/** How often the accumulated tally is pushed up. */
const REPORT_MS = 2000;
/** How often a counting board tells the room tab it has taken over. */
const CLAIM_MS = 1000;
/** How long the room tab waits after the last claim before counting again. */
const CLAIM_TTL_MS = 3500;

type HandoffMessage =
  | { type: 'claim' }
  | { type: 'ballots'; entries: [string, string][] };

/**
 * Turns Twitch chat into votes for the current matchup.
 *
 * Only runs for the host, and only while judging. Viewers type the number of
 * the song they want, which works because the web rooms are brackets and a
 * matchup is always two songs.
 *
 * Votes are kept in a ref rather than state. Chat can be fast, and a
 * re-render per message would be wasteful when the display only needs to move
 * at the reporting interval.
 *
 * The host can have both the room tab and the board open, and a streamer
 * watches the board while the room tab sits in the background, where the
 * browser throttles its timers to as little as once a minute. So a report
 * also goes out as chat arrives, since socket messages are not throttled, and
 * a board passes `prefer` to take the count over: it claims the round on a
 * BroadcastChannel, the room tab hands its ballots across and stops reporting,
 * and picks the count back up if the board closes.
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

  // Which submission each chat user picked, so a viewer changing their mind
  // moves their vote instead of adding a second one.
  const ballots = useRef(new Map<string, string>());

  const judging = round?.phase === 'judging';
  const active = enabled && judging && Boolean(channel) && Boolean(token);
  const roundId = round?.id ?? null;

  // Ordering has to match what viewers see on the overlay, since they are
  // voting by position. submissions arrives already ordered.
  const idsKey = submissions.map((s) => s.id).join(',');

  useEffect(() => {
    ballots.current.clear();
    setCounts({});
  }, [roundId]);

  useEffect(() => {
    if (!active || !channel || !roundId) return;
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    let lastReport = 0;
    let claimedAt = 0;
    const yielding = () => !prefer && Date.now() - claimedAt < CLAIM_TTL_MS;

    const flush = () => {
      lastReport = Date.now();
      const tallied: Record<string, number> = {};
      for (const id of ids) tallied[id] = 0;
      for (const submissionId of ballots.current.values()) {
        if (submissionId in tallied) tallied[submissionId] += 1;
      }
      setCounts(tallied);
      if (yielding()) return;
      // Best effort. The next flush resends the whole tally, so a failure
      // here costs a couple of seconds of staleness rather than losing votes.
      if (token) void battle.reportChatTally(token, roundId, tallied).catch(() => {});
    };

    const handoff =
      typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(`tb-chat-votes:${roundId}`);
    if (handoff) {
      handoff.onmessage = (e: MessageEvent<HandoffMessage>) => {
        const msg = e.data;
        if (msg?.type === 'claim' && !prefer) {
          if (!yielding()) handoff.postMessage({ type: 'ballots', entries: [...ballots.current] });
          claimedAt = Date.now();
        } else if (msg?.type === 'ballots' && prefer) {
          for (const [user, submissionId] of msg.entries) {
            if (!ballots.current.has(user)) ballots.current.set(user, submissionId);
          }
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
        ballots.current.set(msg.user, ids[choice - 1]);
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
