import { useEffect, useState } from 'react';
import BoxingMatch from './BoxingMatch';

/**
 * A bout playing itself, for the marketing page.
 *
 * This is the real BoxingMatch with invented vote tallies rather than a
 * screenshot or a mockup, so what a visitor watches on the front page is
 * literally what lands on the stream. It also cannot drift from the product:
 * change the fight and this changes with it.
 *
 * The whole pitch is that votes are punches, and that does not survive being
 * described in a paragraph. It has to be seen happening, so the tally climbs
 * on a timer, the health drains, and somebody goes down.
 */

interface Bout {
  aName: string;
  aTitle: string;
  aArtist: string;
  bName: string;
  bTitle: string;
  bArtist: string;
  /** Where the vote ends up. A zero is a knockout. */
  aVotes: number;
  bVotes: number;
}

/**
 * Three bouts on a loop.
 *
 * The middle one is a shutout so a visitor who watches for half a minute sees
 * a knockout rather than only decisions, and the last is nearly level so the
 * bars are visibly fighting each other rather than one running away with it.
 */
const BOUTS: readonly Bout[] = [
  {
    aName: 'Ashley',
    aTitle: 'Ms. Jackson',
    aArtist: 'Outkast',
    bName: 'Marcus',
    bTitle: 'Hey Ya!',
    bArtist: 'Outkast',
    aVotes: 128,
    bVotes: 74,
  },
  {
    aName: 'Devon',
    aTitle: 'Mr. Brightside',
    aArtist: 'The Killers',
    bName: 'Priya',
    bTitle: 'Never Gonna Give You Up',
    bArtist: 'Rick Astley',
    aVotes: 96,
    bVotes: 0,
  },
  {
    aName: 'Jules',
    aTitle: 'HUMBLE.',
    aArtist: 'Kendrick Lamar',
    bName: 'Sam',
    bTitle: 'Sicko Mode',
    bArtist: 'Travis Scott',
    aVotes: 61,
    bVotes: 58,
  },
];

const TICK_MS = 420;
/** Ticks spent taking votes, then holding the result, then the whole loop. */
const VOTING_TICKS = 20;
const RESULT_TICKS = 9;
const BOUT_TICKS = VOTING_TICKS + RESULT_TICKS;

export default function FightDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Paused for anyone who has asked for less motion. They get the opening
    // position of the first bout, which is still a readable fight card.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const bout = BOUTS[Math.floor(tick / BOUT_TICKS) % BOUTS.length];
  const step = tick % BOUT_TICKS;
  const voting = step < VOTING_TICKS;

  // Eased so the flurry is heaviest early and the last few votes trickle,
  // which is how a real poll behaves and stops the bars moving like a loader.
  const through = Math.min(1, step / VOTING_TICKS);
  const eased = 1 - Math.pow(1 - through, 2);

  const votesFor = (final: number) => Math.round(final * eased);

  return (
    <BoxingMatch
      a={{
        name: bout.aName,
        songTitle: bout.aTitle,
        songArtist: bout.aArtist,
        artworkUrl: null,
        votes: votesFor(bout.aVotes),
        ballotNumber: 1,
      }}
      b={{
        name: bout.bName,
        songTitle: bout.bTitle,
        songArtist: bout.bArtist,
        artworkUrl: null,
        votes: votesFor(bout.bVotes),
        ballotNumber: 2,
      }}
      phase={voting ? 'judging' : 'revealed'}
      winner={voting ? null : bout.aVotes >= bout.bVotes ? 'a' : 'b'}
      nowPlaying={null}
      chatChannel="yourchannel"
      roundLabel="Quarter final"
    />
  );
}
