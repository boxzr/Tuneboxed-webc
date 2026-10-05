import { useEffect, useState } from 'react';
import BoxingMatch from './BoxingMatch';
import DemoChat, { NAME_COLORS, type ChatLine } from './DemoChat';

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
  aArt: string;
  bName: string;
  bTitle: string;
  bArtist: string;
  bArt: string;
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
const ART = 'https://is1-ssl.mzstatic.com/image/thumb/';

const BOUTS: readonly Bout[] = [
  {
    aName: 'Ashley',
    aTitle: 'Mr. Brightside',
    aArtist: 'The Killers',
    aArt: `${ART}Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/300x300bb.jpg`,
    bName: 'Marcus',
    bTitle: 'Dancing Queen',
    bArtist: 'ABBA',
    bArt: `${ART}Music115/v4/60/f8/a6/60f8a6bc-e875-238d-f2f8-f34a6034e6d2/14UMGIM07615.rgb.jpg/300x300bb.jpg`,
    aVotes: 128,
    bVotes: 74,
  },
  {
    aName: 'Devon',
    aTitle: "Sweet Child O' Mine",
    aArtist: "Guns N' Roses",
    aArt: `${ART}Music125/v4/56/47/b7/5647b700-6b9d-9e72-ec9f-51140b6d4492/00602567673781.rgb.jpg/300x300bb.jpg`,
    bName: 'Priya',
    bTitle: 'Baby Shark',
    bArtist: 'Pinkfong',
    bArt: `${ART}Music125/v4/e0/4d/1f/e04d1f27-c8f5-bc8e-e936-294ad15a77cb/859721673396_cover.jpg/300x300bb.jpg`,
    aVotes: 96,
    bVotes: 0,
  },
  {
    aName: 'Jules',
    aTitle: 'Blinding Lights',
    aArtist: 'The Weeknd',
    aArt: `${ART}Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/300x300bb.jpg`,
    bName: 'Sam',
    bTitle: 'Uptown Funk',
    bArtist: 'Mark Ronson',
    bArt: `${ART}Music115/v4/7e/30/c5/7e30c572-aa47-5f7b-c6fd-42d50cd2c56d/886444959797.jpg/300x300bb.jpg`,
    aVotes: 61,
    bVotes: 58,
  },
];

const TICK_MS = 700;
/** Each corner's walkout, then the bell, then votes, then the card. */
const WALK_TICKS = 11;
const BELL_TICKS = 5;
const INTRO_TICKS = WALK_TICKS * 2 + BELL_TICKS;
const VOTING_TICKS = 20;
const RESULT_TICKS = 9;
const BOUT_TICKS = INTRO_TICKS + VOTING_TICKS + RESULT_TICKS;
const WALK_SECONDS = (WALK_TICKS * TICK_MS) / 1000;

/** 24 names, stepped through 7 at a time (coprime), so nobody posts twice within 24 lines. */
const CHATTERS = [
  'bpm_bandit', 'lofi_lena', 'ko_kaito', 'basshead99', 'vinylvic', 'mixtape_mo',
  'DJ_Rook', 'synthsam', 'hookqueen', 'tempo_tay', 'grooveguru', 'snarekid',
  'cadence_cj', 'riffraff', 'echo_em', 'kickdrum_k', 'melodymax', 'b4rz',
  'auxcord_al', 'subwoofer_sue', 'chorus_cat', 'trackstar', 'falsetto_fin', 'reverb_rae',
];
const CHATTER_STEP = 7;
/**
 * Lines are taken in order, never at random, and each pool is longer than the
 * chat can show of its phase, so a line never appears twice on screen. No line
 * appears in two pools.
 */
const WALK_HYPE = [
  'this song slaps', 'WALKOUT MUSIC 🔥', 'here we gooo', 'ENTRANCE OF THE YEAR', 'oh this is a banger',
  'look at the drip', 'the gloves are clean', 'turn it UP', 'aura is crazy', 'who picked this 😂',
  'goosebumps fr', 'main character energy', 'this intro tho', 'already a W',
];
const BELL_HYPE = ['DING DING', 'LETS GOOO', 'spam 1 or 2!!', 'here we go', 'fight fight fight', 'gloves up'];
const FIGHT_HYPE = [
  'COMBO!!', 'OMG', 'hes cooked', 'BODY SHOT', 'keep spamming', 'its so close', 'UPPERCUT',
  'dont let up', 'chat is locked in', 'that one hurt',
];
const KO_HYPE = ['KO KO KO', 'NOT EVEN CLOSE', 'down goes the song 💀', 'shutout lmao', 'stay down', 'call the ref'];
const DECISION_HYPE = ['GG', 'robbery?? 😭', 'close one', 'deserved', 'rematch!!', 'judges got it right'];

type ChatPhase = 'walk' | 'bell' | 'fight' | 'result';
const RESULT_CHAT_TICKS = 4;

/** Repeatable 0..1 noise, so a tick always produces the same chat. */
function noise(...seed: number[]): number {
  let h = 2166136261;
  for (const n of seed) h = Math.imul(h ^ (n + 0x9e3779b9), 16777619);
  h ^= h >>> 13;
  return ((Math.imul(h, 0x5bd1e995) >>> 0) % 10000) / 10000;
}

function votesAt(final: number, step: number): number {
  const through = Math.min(1, Math.max(0, (step - INTRO_TICKS) / VOTING_TICKS));
  return Math.round(final * (1 - Math.pow(1 - through, 2)));
}

function phaseOf(step: number): ChatPhase | null {
  if (step < WALK_TICKS * 2) return 'walk';
  if (step < INTRO_TICKS) return 'bell';
  if (step < INTRO_TICKS + VOTING_TICKS) return 'fight';
  if (step < INTRO_TICKS + VOTING_TICKS + RESULT_CHAT_TICKS) return 'result';
  return null;
}

const HYPE_ODDS: Record<ChatPhase, number> = { walk: 0.55, bell: 0.7, fight: 0.25, result: 1 };

function boutAt(tick: number): Bout {
  return BOUTS[Math.floor(tick / BOUT_TICKS) % BOUTS.length];
}

function hasHype(tick: number): boolean {
  const phase = phaseOf(tick % BOUT_TICKS);
  return phase !== null && noise(tick, 1) < HYPE_ODDS[phase];
}

/** Chat votes this tick: one line per new vote, capped so a flurry doesn't flood the column. */
function votesIn(tick: number): string[] {
  const step = tick % BOUT_TICKS;
  if (phaseOf(step) !== 'fight') return [];
  const bout = boutAt(tick);
  const ones = Math.min(4, votesAt(bout.aVotes, step) - votesAt(bout.aVotes, step - 1));
  const twos = Math.min(4, votesAt(bout.bVotes, step) - votesAt(bout.bVotes, step - 1));
  return [...Array<string>(ones).fill('1'), ...Array<string>(twos).fill('2')]
    .map((text, i) => ({ text, order: noise(tick, 20 + i) }))
    .sort((x, y) => x.order - y.order)
    .map((v) => v.text);
}

function lineCount(tick: number): number {
  return votesIn(tick).length + (hasHype(tick) ? 1 : 0);
}

/** Lines posted before each bout, from the first tick. Grows one bout at a time. */
const linesBeforeBout: number[] = [0];

function linesBefore(tick: number): number {
  const fight = Math.floor(tick / BOUT_TICKS);
  while (linesBeforeBout.length <= fight) {
    const b = linesBeforeBout.length - 1;
    let n = 0;
    for (let t = b * BOUT_TICKS; t < (b + 1) * BOUT_TICKS; t++) n += lineCount(t);
    linesBeforeBout.push(linesBeforeBout[b] + n);
  }
  let n = linesBeforeBout[fight];
  for (let t = fight * BOUT_TICKS; t < tick; t++) n += lineCount(t);
  return n;
}

function hypeLine(tick: number): string {
  const fight = Math.floor(tick / BOUT_TICKS);
  const step = tick % BOUT_TICKS;
  const phase = phaseOf(step) as ChatPhase;
  const bout = boutAt(tick);
  const pool =
    phase === 'walk'
      ? WALK_HYPE
      : phase === 'bell'
        ? BELL_HYPE
        : phase === 'fight'
          ? FIGHT_HYPE
          : bout.aVotes === 0 || bout.bVotes === 0
            ? KO_HYPE
            : DECISION_HYPE;
  let used = 0;
  for (let s = step - 1; s >= 0 && phaseOf(s) === phase; s--) {
    if (hasHype(fight * BOUT_TICKS + s)) used += 1;
  }
  return pool[(used + fight * 3) % pool.length];
}

function chatAt(tick: number): ChatLine[] {
  const texts = votesIn(tick);
  if (hasHype(tick)) texts.splice(Math.floor(noise(tick, 4) * (texts.length + 1)), 0, hypeLine(tick));
  const first = linesBefore(tick);
  return texts.map((text, i) => {
    const who = ((first + i) * CHATTER_STEP) % CHATTERS.length;
    return { key: `${tick}-${i}`, user: CHATTERS[who], color: NAME_COLORS[who % NAME_COLORS.length], text };
  });
}

/** The last few ticks of chat, so a line scrolls up and out rather than vanishing. */
function chatUpTo(tick: number): ChatLine[] {
  const lines: ChatLine[] = [];
  for (let t = Math.max(0, tick - 10); t <= tick; t++) lines.push(...chatAt(t));
  return lines.slice(-16);
}

export default function FightDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Paused for anyone who has asked for less motion. They get the opening
    // position of the first bout, which is still a readable fight card.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const fight = Math.floor(tick / BOUT_TICKS);
  const bout = BOUTS[fight % BOUTS.length];
  const step = tick % BOUT_TICKS;
  const walking = step < WALK_TICKS * 2;
  const walker = step < WALK_TICKS ? 'a' : 'b';
  const intro = step < INTRO_TICKS;
  const voting = step >= INTRO_TICKS && step < INTRO_TICKS + VOTING_TICKS;

  // Eased so the flurry is heaviest early and the last few votes trickle,
  // which is how a real poll behaves and stops the bars moving like a loader.
  const through = intro ? 0 : Math.min(1, (step - INTRO_TICKS) / VOTING_TICKS);
  const eased = 1 - Math.pow(1 - through, 2);

  const votesFor = (final: number) => Math.round(final * eased);

  return (
    <div className="fight-demo">
    <BoxingMatch
      a={{
        name: bout.aName,
        songTitle: bout.aTitle,
        songArtist: bout.aArtist,
        artworkUrl: bout.aArt,
        votes: votesFor(bout.aVotes),
        ballotNumber: 1,
      }}
      b={{
        name: bout.bName,
        songTitle: bout.bTitle,
        songArtist: bout.bArtist,
        artworkUrl: bout.bArt,
        votes: votesFor(bout.bVotes),
        ballotNumber: 2,
      }}
      phase={walking ? 'playing' : intro || voting ? 'judging' : 'revealed'}
      winner={voting || intro ? null : bout.aVotes >= bout.bVotes ? 'a' : 'b'}
      nowPlaying={walking ? walker : null}
      walkSeconds={WALK_SECONDS}
      walkOffset={walking ? ((step % WALK_TICKS) * TICK_MS) / 1000 : 0}
      fightKey={`demo-${fight}`}
      chatChannel="yourchannel"
      roundLabel="Quarter final"
    />
      <DemoChat channel="yourchannel" lines={chatUpTo(tick)} />
    </div>
  );
}
