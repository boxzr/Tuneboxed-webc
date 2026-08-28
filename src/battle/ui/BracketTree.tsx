import { Card, SectionLabel } from './primitives';
import { CrownIcon } from './icons';
import type { BattleMatch, BattlePlayer } from '../../types/battle';

/**
 * The whole bracket at a glance, ported from BattleBracketTree.
 *
 * Rounds are columns and scroll sideways, because a sixteen player bracket is
 * four columns deep and squeezing that into a phone width would make every
 * name unreadable. The live matchup pulses so a viewer arriving mid-stream can
 * find it without being told.
 */
export default function BracketTree({
  matches,
  players,
  currentMatchId,
}: {
  matches: BattleMatch[];
  players: BattlePlayer[];
  currentMatchId: string | null;
}) {
  if (matches.length === 0) return null;

  const rounds = groupByRound(matches);
  const finalRound = Math.max(...rounds.keys());
  const nameOf = (id: string | null) =>
    id ? players.find((p) => p.id === id)?.display_name ?? 'Player' : null;

  const currentRound = matches.find((m) => m.id === currentMatchId)?.bracket_round ?? null;

  return (
    <Card className="bt-bracket">
      <SectionLabel tone="orange">Bracket</SectionLabel>

      <div className="bt-bracket__scroll">
        {[...rounds.keys()]
          .sort((a, b) => a - b)
          .map((roundNumber) => (
            <div className="bt-bracket__col" key={roundNumber}>
              <span
                className={`bt-bracket__round${
                  roundNumber === currentRound ? ' bt-bracket__round--on' : ''
                }`}
              >
                {roundLabel(roundNumber, finalRound)}
              </span>

              {rounds.get(roundNumber)!.map((match) => {
                const live = match.id === currentMatchId;
                return (
                  <div
                    key={match.id}
                    className={[
                      'bt-slot',
                      live ? 'bt-slot--live' : '',
                      match.status === 'complete' && !live ? 'bt-slot--done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Seat
                      name={nameOf(match.player_a_id)}
                      won={
                        match.winner_player_id != null &&
                        match.winner_player_id === match.player_a_id
                      }
                    />
                    <span className="bt-slot__vs">VS</span>
                    <Seat
                      name={nameOf(match.player_b_id)}
                      won={
                        match.winner_player_id != null &&
                        match.winner_player_id === match.player_b_id
                      }
                    />
                  </div>
                );
              })}
            </div>
          ))}
      </div>
    </Card>
  );
}

function Seat({ name, won }: { name: string | null; won: boolean }) {
  return (
    <span className={`bt-seat${won ? ' bt-seat--won' : ''}${name ? '' : ' bt-seat--tbd'}`}>
      {won && <CrownIcon size={10} />}
      {name ?? 'TBD'}
    </span>
  );
}

function groupByRound(matches: BattleMatch[]): Map<number, BattleMatch[]> {
  const rounds = new Map<number, BattleMatch[]>();
  for (const match of matches) {
    const bucket = rounds.get(match.bracket_round);
    if (bucket) bucket.push(match);
    else rounds.set(match.bracket_round, [match]);
  }
  for (const bucket of rounds.values()) {
    bucket.sort((a, b) => a.match_index - b.match_index);
  }
  return rounds;
}

/**
 * Bracket rounds are named backwards from the end, which is how people
 * actually talk about them. Anything earlier than the quarters is numbered,
 * since "round of 32" means little in a room of friends.
 */
function roundLabel(round: number, finalRound: number): string {
  const fromEnd = finalRound - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semis';
  if (fromEnd === 2) return 'Quarters';
  return `Round ${round}`;
}
