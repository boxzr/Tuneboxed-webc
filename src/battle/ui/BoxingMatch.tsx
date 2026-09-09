import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BoxerSprite } from './primitives';
import { CrownIcon } from './icons';
import { type FightScore, fightScore, fightVerdict } from '../fight';
import type { BattleRoundPhase } from '../../types/battle';
import './fight.css';

/**
 * A bracket matchup, fought.
 *
 * Both competitors' songs get a corner, a health bar and a boxer, and the
 * vote tally drives all three. Every vote that lands throws a punch, so a
 * stream watching the board can see the fight turning without reading a
 * single number, and a chat that piles onto one song knocks the other out.
 *
 * The same component covers playback, voting and the reveal rather than
 * three screens swapping in and out, because the fight is the continuity: the
 * boxers are already squared up while the songs play, they trade while chat
 * votes, and one of them goes down at the reveal.
 */

export interface Fighter {
  name: string;
  songTitle: string;
  songArtist: string;
  artworkUrl: string | null;
  votes: number;
  /**
   * The digit chat types to vote for this song.
   *
   * Comes from the submission's position, not from which corner it is in:
   * useChatVotes resolves a typed digit against the submissions array, so a
   * corner that displayed its own index would send half the chat's votes to
   * the other song.
   */
  ballotNumber: number;
}

export default function BoxingMatch({
  a,
  b,
  phase,
  winner,
  nowPlaying,
  chatChannel,
  roundLabel,
}: {
  a: Fighter;
  b: Fighter;
  phase: BattleRoundPhase;
  /** Set once the round is decided. Null while it is still being fought. */
  winner: 'a' | 'b' | null;
  /** Whose song is sounding, so a viewer knows what they are hearing. */
  nowPlaying: 'a' | 'b' | null;
  /** Twitch channel taking votes, when the room is tied to one. */
  chatChannel: string | null;
  roundLabel: string;
}) {
  const score = fightScore(a.votes, b.votes);
  const swinging = useSwing(a.votes, b.votes);
  const decided = winner !== null;

  // A decision leaves the loser standing. Only a shutout puts them on the
  // canvas, which is what keeps a knockout worth seeing.
  const floored = decided && score.knockout;
  const loser = winner === 'a' ? 'b' : winner === 'b' ? 'a' : null;

  const stateFor = (side: 'a' | 'b') => {
    if (decided) {
      if (side === winner) return 'won';
      return floored ? 'down' : 'lost';
    }
    if (swinging === side) return 'punch';
    if (swinging !== null) return 'hurt';
    return 'idle';
  };

  const total = a.votes + b.votes;

  return (
    <div className={`fight${decided ? ' fight--decided' : ''}`}>
      <FightHud
        a={a}
        b={b}
        score={score}
        roundLabel={roundLabel}
        winner={winner}
        nowPlaying={nowPlaying}
      />

      <div className="fight__ring">
        <div className="fight__ropes" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <Corner side="a" fighter={a} state={stateFor('a')} />

        <div className="fight__centre" aria-hidden="true">
          {decided ? (
            <span className="fight__verdict">{fightVerdict(score)}</span>
          ) : (
            <span className="fight__vs">VS</span>
          )}
          {swinging !== null && !decided && (
            <span key={total} className={`fight__spark fight__spark--${swinging}`} />
          )}
        </div>

        <Corner side="b" fighter={b} state={stateFor('b')} />
      </div>

      <FightCall
        phase={phase}
        chatChannel={chatChannel}
        total={total}
        decided={decided}
        winnerName={winner ? (winner === 'a' ? a : b).name : null}
        winnerVotes={winner ? (winner === 'a' ? a : b).votes : 0}
        loserFloored={floored}
        loserName={loser ? (loser === 'a' ? a : b).name : null}
        loserVotes={loser ? (loser === 'a' ? a : b).votes : 0}
      />
    </div>
  );
}

/**
 * Names, artwork and the two health bars.
 *
 * Laid out like a fighting game rather than a poll, so the bars read as damage
 * taken instead of progress made: they start full and drain inward toward the
 * middle of the screen.
 */
function FightHud({
  a,
  b,
  score,
  roundLabel,
  winner,
  nowPlaying,
}: {
  a: Fighter;
  b: Fighter;
  score: FightScore;
  roundLabel: string;
  winner: 'a' | 'b' | null;
  nowPlaying: 'a' | 'b' | null;
}) {
  return (
    <div className="fight__hud">
      <HealthBar
        side="a"
        fighter={a}
        health={score.healthA}
        won={winner === 'a'}
        playing={nowPlaying === 'a'}
      />
      <span className="fight__round">{roundLabel}</span>
      <HealthBar
        side="b"
        fighter={b}
        health={score.healthB}
        won={winner === 'b'}
        playing={nowPlaying === 'b'}
      />
    </div>
  );
}

function HealthBar({
  side,
  fighter,
  health,
  won,
  playing,
}: {
  side: 'a' | 'b';
  fighter: Fighter;
  health: number;
  won: boolean;
  playing: boolean;
}) {
  return (
    <div
      className={`fight__seat fight__seat--${side}${won ? ' fight__seat--won' : ''}${
        playing ? ' fight__seat--playing' : ''
      }`}
    >
      <div className="fight__seat-top">
        {/* The digit chat types, on the corner it actually belongs to. */}
        <span className="fight__num" aria-hidden="true">
          {fighter.ballotNumber}
        </span>
        {fighter.artworkUrl && (
          <img className="fight__art" src={fighter.artworkUrl} alt="" />
        )}
        <div className="fight__label">
          <span className="fight__player">
            {won && <CrownIcon size={18} />}
            {playing ? 'Now playing' : fighter.name}
          </span>
          <strong className="fight__song">{fighter.songTitle}</strong>
          <span className="fight__artist">{fighter.songArtist}</span>
        </div>
      </div>

      <div
        className="fight__bar"
        role="meter"
        aria-valuenow={health}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${fighter.name} health`}
        style={{ '--health': health } as CSSProperties}
      >
        {/* Width is a scale on a full-size layer, not `right` plus a
            percentage. iOS Safari draws that second pair wrong: the orange
            fill starts from the left, overflows the pill, or disappears. */}
        <span className="fight__bar-hurt" />
        <span className="fight__bar-fill" />
        <span className="fight__bar-votes">{fighter.votes}</span>
      </div>
    </div>
  );
}

function Corner({
  side,
  fighter,
  state,
}: {
  side: 'a' | 'b';
  fighter: Fighter;
  state: string;
}) {
  return (
    <div className={`fight__corner fight__corner--${side} is-${state}`}>
      <BoxerSprite side={side === 'a' ? 'blue' : 'orange'} size={200} />
    </div>
  );
}

/** The line under the ring, in the register of a ringside announcer. */
function FightCall({
  phase,
  chatChannel,
  total,
  decided,
  winnerName,
  winnerVotes,
  loserFloored,
  loserName,
  loserVotes,
}: {
  phase: BattleRoundPhase;
  chatChannel: string | null;
  total: number;
  decided: boolean;
  winnerName: string | null;
  winnerVotes: number;
  loserFloored: boolean;
  loserName: string | null;
  loserVotes: number;
}) {
  if (decided && winnerName) {
    return (
      <p className="fight__call fight__call--won">
        {loserFloored && loserName ? (
          <>
            <strong>{winnerName}</strong> knocks <strong>{loserName}</strong> out
          </>
        ) : (
          // Votes rather than health. Health is a reading of the vote gap and
          // the two rarely match, so quoting it here contradicts the counts
          // sitting on the bars a few pixels above.
          <>
            <strong>{winnerName}</strong> takes it {winnerVotes}&ndash;{loserVotes} on votes
          </>
        )}
      </p>
    );
  }

  if (phase === 'playing') {
    return <p className="fight__call">Both songs are playing. Judge them back to back.</p>;
  }

  if (phase === 'judging') {
    return (
      <p className={`fight__call${chatChannel ? ' fight__call--vote' : ''}`}>
        {chatChannel ? (
          <>
            Type <strong>1</strong> or <strong>2</strong> in chat to throw a punch
          </>
        ) : (
          <>Vote for the song that should win</>
        )}
        {total > 0 && (
          <span className="fight__tally">
            {' · '}
            {total} {total === 1 ? 'punch' : 'punches'} thrown
          </span>
        )}
      </p>
    );
  }

  return <p className="fight__call">Squaring up…</p>;
}

/**
 * Which side just landed one.
 *
 * Votes arrive as a whole tally rather than as events, so a punch is inferred
 * from the count going up. Only the most recent side is reported: when a busy
 * chat votes for both songs inside the same poll the board should show the
 * last hit rather than trying to animate both at once.
 */
function useSwing(votesA: number, votesB: number, holdMs = 420): 'a' | 'b' | null {
  const [swinging, setSwinging] = useState<'a' | 'b' | null>(null);
  const previous = useRef<{ a: number; b: number } | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = { a: votesA, b: votesB };

    // First tally through is the starting position, not a flurry of punches.
    if (!before) return;

    const gainedA = votesA - before.a;
    const gainedB = votesB - before.b;
    if (gainedA <= 0 && gainedB <= 0) return;

    setSwinging(gainedA >= gainedB ? 'a' : 'b');
    const timer = setTimeout(() => setSwinging(null), holdMs);
    return () => clearTimeout(timer);
  }, [votesA, votesB, holdMs]);

  return swinging;
}
