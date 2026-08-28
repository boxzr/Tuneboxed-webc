import { BoxerSprite, Card, SectionLabel } from './primitives';
import { CrownIcon } from './icons';

/**
 * The head to head header for a bracket matchup, ported from
 * BattleMatchupCard in BattleUIComponents.swift.
 *
 * Two boxers square up either side of a pulsing VS badge. Once a side has won,
 * its boxer keeps its colour and gains a crown while the loser dims, which is
 * what makes the result readable from across a room on a stream.
 */
export default function MatchupCard({
  title,
  left,
  right,
  winnerSide,
  note,
}: {
  /** "Quarter final", "Semi final", "Final". Rendered uppercase. */
  title: string;
  left: Competitor;
  right: Competitor;
  /** Set once the round is revealed. */
  winnerSide?: 'left' | 'right' | null;
  /** Optional line under the fighters, e.g. who is deciding this one. */
  note?: string;
}) {
  return (
    <Card className="bt-matchup">
      <div className="bt-matchup__title">
        <SectionLabel tone="orange">{title}</SectionLabel>
      </div>

      <div className="bt-matchup__ring">
        <Fighter side="blue" competitor={left} won={winnerSide === 'left'} lost={winnerSide === 'right'} />

        <div className="bt-vs" aria-hidden="true">
          <span className="bt-vs__halo" />
          <span className="bt-vs__badge">VS</span>
        </div>

        <Fighter side="orange" competitor={right} won={winnerSide === 'right'} lost={winnerSide === 'left'} />
      </div>

      {note && <p className="bt-matchup__note">{note}</p>}
    </Card>
  );
}

export type Competitor = {
  name: string;
  /** Shown once voting has produced a number worth showing. */
  votes?: number | null;
};

function Fighter({
  side,
  competitor,
  won,
  lost,
}: {
  side: 'blue' | 'orange';
  competitor: Competitor;
  won: boolean;
  lost: boolean;
}) {
  return (
    <div className={`bt-fighter${won ? ' bt-fighter--won' : ''}`}>
      {won && (
        <span className="bt-fighter__crown">
          <CrownIcon size={17} />
        </span>
      )}

      <BoxerSprite side={side} size={84} dimmed={lost} />

      <span className="bt-fighter__name">{competitor.name}</span>

      {competitor.votes != null && (
        <span className="bt-fighter__votes">
          {competitor.votes} {competitor.votes === 1 ? 'vote' : 'votes'}
        </span>
      )}
    </div>
  );
}
