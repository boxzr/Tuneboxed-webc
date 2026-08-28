import { useEffect, useRef, useState } from 'react';
import * as battle from '../lib/battleClient';
import { connectToChat, parseVote } from './twitchChat';
import { uniqueLeader } from './voteLeader';
import type { BattleRound, BattleSubmission } from '../types/battle';

/** How often the accumulated tally is pushed up. */
const REPORT_MS = 2000;

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
 */
export function useChatVotes({
  enabled,
  channel,
  round,
  submissions,
  token,
}: {
  enabled: boolean;
  channel: string | null;
  round: BattleRound | null;
  submissions: BattleSubmission[];
  token: string | null;
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
    if (!active || !channel) return;
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    const conn = connectToChat(
      channel,
      (msg) => {
        const choice = parseVote(msg.text, ids.length);
        if (choice === null) return;
        ballots.current.set(msg.user, ids[choice - 1]);
      },
      setConnected
    );

    const flush = setInterval(() => {
      const tallied: Record<string, number> = {};
      for (const id of ids) tallied[id] = 0;
      for (const submissionId of ballots.current.values()) {
        tallied[submissionId] = (tallied[submissionId] ?? 0) + 1;
      }
      setCounts(tallied);
      // Best effort. The next tick resends the whole tally, so a failure here
      // costs a couple of seconds of staleness rather than losing votes.
      if (token && roundId) {
        void battle.reportChatTally(token, roundId, tallied).catch(() => {});
      }
    }, REPORT_MS);

    return () => {
      conn.close();
      clearInterval(flush);
      setConnected(false);
    };
  }, [active, channel, idsKey, roundId, token]);

  /** Submission id with a strict lead, or null if chat has not decided. */
  const leader = uniqueLeader(counts);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return { counts, connected, leader, total };
}
