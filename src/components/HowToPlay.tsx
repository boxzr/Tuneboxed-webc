import { type CSSProperties, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BoxingMatch from '../battle/ui/BoxingMatch';
import DemoChat, { NAME_COLORS, type ChatLine } from '../battle/ui/DemoChat';
import { fightScore } from '../battle/fight';
import { cornerLoadout, defaultLoadout, type FighterLoadout } from '../fight3d/loadout';
import type { RingFighter, Shot } from '../fight3d/FightCanvas';
import type { BattleRoundPhase } from '../types/battle';
import { useCopy } from '../i18n/LanguageContext';
import './howToPlay.css';

/**
 * The walkthrough: five steps and a round the visitor fights themselves.
 *
 * Every picture is the game's own 3D ring. The lobby and the locker are the
 * canvas the room uses, and the walkout, the punches and the finish are the
 * real BoxingMatch fed a scripted tally, so the lesson cannot show something
 * the game does not do.
 */

// Same chunk BoxingMatch asks for, so the lobby and the fight share one download.
const FightCanvas = lazy(() => import('../fight3d/FightCanvas'));

type Side = 'a' | 'b';
type Ending = 'ko' | 'decision';

const ART = 'https://is1-ssl.mzstatic.com/image/thumb/';
const SONGS = [
  {
    title: 'Mr. Brightside',
    artist: 'The Killers',
    art: `${ART}Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/300x300bb.jpg`,
  },
  {
    title: 'Dancing Queen',
    artist: 'ABBA',
    art: `${ART}Music115/v4/60/f8/a6/60f8a6bc-e875-238d-f2f8-f34a6034e6d2/14UMGIM07615.rgb.jpg/300x300bb.jpg`,
  },
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    art: `${ART}Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/300x300bb.jpg`,
  },
] as const;

const BLUE: FighterLoadout = { ...cornerLoadout('a', 'Ashley'), dance: 'folks' };
const ORANGE: FighterLoadout = { ...cornerLoadout('b', 'Marcus'), dance: 'whip' };

/** Real room codes are five letters. */
const ROOM_CODE = 'BOXED';

/** Who is standing in the lobby when the host reads the code out. */
const LOBBY: RingFighter[] = [
  { name: 'Ashley', loadout: BLUE, pose: 'idle' },
  { name: 'Marcus', loadout: ORANGE, pose: 'idle' },
  { name: 'Devon', loadout: defaultLoadout('Devon'), pose: 'idle' },
];

/**
 * Three boxers, not a full room, so the line-up is shot from between the near
 * ropes: close enough to read each kit, with no rope across anyone's face.
 */
const LOBBY_SHOT: Shot = { position: [0, 1.2, 2.95], lookAt: [0, 0.95, 0.4], fov: 50 };
/** One boxer filling the frame, boots to the note on their head. */
const LOCKER_SHOT: Shot = { position: [0, 1.0, 3.8], lookAt: [0, 0.8, 0.35], fov: 36 };

/** Kits the locker step turns through. */
const LOOKS: FighterLoadout[] = [
  BLUE,
  defaultLoadout('Priya'),
  ORANGE,
  defaultLoadout('Devon'),
  defaultLoadout('Jules'),
  defaultLoadout('Sam'),
];

const CHATTERS = [
  'bpm_bandit', 'lofi_lena', 'ko_kaito', 'basshead99', 'vinylvic', 'mixtape_mo',
  'DJ_Rook', 'synthsam', 'hookqueen', 'tempo_tay', 'grooveguru', 'snarekid',
];

const STEP = { room: 0, pick: 1, walk: 2, votes: 3, finish: 4, play: 5 } as const;
const STEP_COUNT = 6;

/* ---------- Scripts ----------
   Each fight step is a function of a tick count, so a moment can be replayed
   and the same tick always shows the same picture. */

const WALK_TICK_MS = 700;
const WALK_TICKS = 11;
const WALK_SECONDS = (WALK_TICKS * WALK_TICK_MS) / 1000;

/**
 * Long enough for the tale of the tape and "Fight" to clear, and for the
 * camera to finish pushing in through the ropes, before the first punch.
 */
const BELL_MS = 3000;

const VOTE_TICK_MS = 600;
const VOTE_LEAD = Math.ceil(BELL_MS / VOTE_TICK_MS);
/** Three for blue is a combo, then orange answers with one of its own. */
const VOTE_SEQ = '11121222112111';
const VOTE_HOLD = 5;
const VOTE_CYCLE = VOTE_LEAD + VOTE_SEQ.length + VOTE_HOLD;

const END_TICK_MS = 500;
const END_LEAD = Math.ceil(BELL_MS / END_TICK_MS);
/** A shutout is a knockout; five to four goes to the cards. */
const END_SEQ: Record<Ending, string> = { ko: '111111', decision: '121121221' };
/** The last punch lands before the result is called. */
const END_GAP = 2;
const END_HOLD = 14;
const endLength = (e: Ending) => END_LEAD + END_SEQ[e].length + END_GAP + END_HOLD;

/** Votes the visitor gets in their own round. Odd, so it cannot end level. */
const VOTE_BUDGET = 9;
const RESULT_DELAY_MS = 1100;

interface FightView {
  votesA: number;
  votesB: number;
  phase: BattleRoundPhase;
  winner: Side | null;
  nowPlaying: Side | null;
  walkOffset: number;
  fightKey: string;
  chatChannel: string | null;
}

function tally(seq: string, count: number): { a: number; b: number } {
  const cast = seq.slice(0, Math.max(0, count));
  const a = cast.split('1').length - 1;
  return { a, b: cast.length - a };
}

function walkView(tick: number): FightView {
  return {
    votesA: 0,
    votesB: 0,
    phase: 'playing',
    winner: null,
    nowPlaying: Math.floor(tick / WALK_TICKS) % 2 === 0 ? 'a' : 'b',
    walkOffset: ((tick % WALK_TICKS) * WALK_TICK_MS) / 1000,
    fightKey: 'htp-walk',
    chatChannel: null,
  };
}

function votesView(tick: number): FightView {
  const cast = tick % VOTE_CYCLE - VOTE_LEAD + 1;
  const { a, b } = tally(VOTE_SEQ, cast);
  return {
    votesA: a,
    votesB: b,
    phase: 'judging',
    winner: null,
    nowPlaying: null,
    walkOffset: 0,
    fightKey: 'htp-votes',
    chatChannel: 'yourchannel',
  };
}

/** One sample viewer per vote, so the digit in chat and the punch in the ring read as one event. */
function votesChat(tick: number): ChatLine[] {
  const cycle = Math.floor(tick / VOTE_CYCLE);
  const cast = Math.min(VOTE_SEQ.length, Math.max(0, (tick % VOTE_CYCLE) - VOTE_LEAD + 1));
  const lines: ChatLine[] = [];
  for (let i = 0; i < cast; i++) {
    const who = (cycle * 5 + i * 7) % CHATTERS.length;
    lines.push({
      key: `${cycle}-${i}`,
      user: CHATTERS[who],
      color: NAME_COLORS[who % NAME_COLORS.length],
      text: VOTE_SEQ[i],
    });
  }
  return lines.slice(-9);
}

/** Both endings back to back, starting with whichever the visitor asked for. */
function finishView(tick: number, first: Ending): FightView & { ending: Ending } {
  const second: Ending = first === 'ko' ? 'decision' : 'ko';
  const both = endLength(first) + endLength(second);
  const at = tick % both;
  const ending = at < endLength(first) ? first : second;
  const local = ending === first ? at : at - endLength(first);
  const seq = END_SEQ[ending];
  const { a, b } = tally(seq, local - END_LEAD + 1);
  const decided = local >= END_LEAD + seq.length + END_GAP;
  return {
    ending,
    votesA: a,
    votesB: b,
    phase: decided ? 'revealed' : 'judging',
    winner: decided ? 'a' : null,
    nowPlaying: null,
    walkOffset: 0,
    fightKey: `htp-${ending}-${Math.floor(tick / both)}`,
    chatChannel: null,
  };
}

/** Where each script stands still for a visitor who has asked for less motion. */
const POSTER = {
  walk: 5,
  votes: VOTE_LEAD + 8,
  finish: END_LEAD + END_SEQ.ko.length + END_GAP,
};

/** Counts up from zero every `ms` while `running`, and starts over whenever `key` changes. */
function useTick(key: string, ms: number, running: boolean): number {
  const [state, setState] = useState({ key, n: 0 });
  if (state.key !== key) setState({ key, n: 0 });
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setState((s) => (s.key === key ? { key, n: s.n + 1 } : s)),
      ms,
    );
    return () => window.clearInterval(timer);
  }, [key, ms, running]);
  return state.key === key ? state.n : 0;
}

interface Round {
  a: number;
  b: number;
  /** Every vote is in, or somebody has been shut out. */
  over: boolean;
  winner: Side | null;
  /** Counts rematches, so each one gets its own result card. */
  round: number;
}

const newRound = (round: number): Round => ({ a: 0, b: 0, over: false, winner: null, round });

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg className="htp__arrow" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d={back ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HowToPlay() {
  const t = useCopy().tutorial;
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [step, setStep] = useState<number>(STEP.room);
  /** Bumps on every step change, so a script starts from its first frame each visit. */
  const [visit, setVisit] = useState(0);

  // The locker.
  const [song, setSong] = useState(0);
  const [look, setLook] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [dance, setDance] = useState(0);
  const [dancing, setDancing] = useState(false);

  // The finish.
  const [firstEnding, setFirstEnding] = useState<Ending>('ko');

  // The visitor's own round.
  const [round, setRound] = useState<Round>(() => newRound(0));

  const titles = [...t.slides.map((s) => s.title), t.demoTitle];
  const title = titles[step];
  const body = step === STEP.play ? t.demoGoal : t.slides[step].body;

  const go = useCallback((to: number) => {
    const next = Math.min(STEP_COUNT - 1, Math.max(0, to));
    setStep(next);
    setVisit((v) => v + 1);
    if (next === STEP.play) setRound((r) => newRound(r.round + 1));
  }, []);

  const tickMs = step === STEP.walk ? WALK_TICK_MS : step === STEP.votes ? VOTE_TICK_MS : END_TICK_MS;
  const scripted = step === STEP.walk || step === STEP.votes || step === STEP.finish;
  const liveTick = useTick(`${step}-${visit}-${firstEnding}`, tickMs, scripted && !reduced);
  const tick = !reduced
    ? liveTick
    : step === STEP.walk
      ? POSTER.walk
      : step === STEP.votes
        ? POSTER.votes
        : POSTER.finish;

  const finish = step === STEP.finish ? finishView(tick, firstEnding) : null;
  const fight: FightView | null =
    step === STEP.walk
      ? walkView(tick)
      : step === STEP.votes
        ? votesView(tick)
        : finish
          ? finish
          : step === STEP.play
            ? {
                votesA: round.a,
                votesB: round.b,
                phase: round.winner ? 'revealed' : 'judging',
                winner: round.winner,
                nowPlaying: null,
                walkOffset: 0,
                fightKey: `htp-play-${round.round}`,
                chatChannel: null,
              }
            : null;

  const pickSong = (i: number) => {
    setSong(i);
    setDance((n) => n + 1);
    setDancing(true);
  };

  // A picked song gets a few bars of the boxer's dance, then back to the stance.
  useEffect(() => {
    if (!dancing) return;
    const timer = window.setTimeout(() => setDancing(false), 3400);
    return () => window.clearTimeout(timer);
  }, [dancing, dance]);

  const changeLook = () => {
    setLook((n) => (n + 1) % LOOKS.length);
    // One full turn, so the new kit is shown from every side.
    setYaw((y) => y + Math.PI * 2);
  };

  const vote = useCallback((side: Side) => {
    setRound((r) => {
      if (r.over) return r;
      const a = r.a + (side === 'a' ? 1 : 0);
      const b = r.b + (side === 'b' ? 1 : 0);
      return { ...r, a, b, over: a + b >= VOTE_BUDGET || fightScore(a, b).knockout };
    });
  }, []);

  // The result is called a beat after the last vote, so its punch lands first.
  useEffect(() => {
    if (!round.over || round.winner) return;
    const timer = window.setTimeout(
      () => setRound((r) => (r.over ? { ...r, winner: r.a >= r.b ? 'a' : 'b' } : r)),
      RESULT_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [round.over, round.winner, round.round]);

  useEffect(() => {
    if (step !== STEP.play) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === '1') vote('a');
      else if (e.key === '2') vote('b');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, vote]);

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = Math.min(STEP_COUNT - 1, Math.max(0, step + (e.key === 'ArrowRight' ? 1 : -1)));
    go(next);
    document.getElementById(`htp-tab-${next}`)?.focus();
  };

  const lookNow = LOOKS[look];
  const votesLeft = VOTE_BUDGET - round.a - round.b;

  return (
    <section className="htp">
      <header className="htp__head">
        <span className="htp__kicker">{t.kicker}</span>
        <h1 className="htp__title">{t.title}</h1>

        <div
          className="htp__steps"
          role="tablist"
          aria-label={t.kicker}
          onKeyDown={onTabKey}
          style={{ '--done': step / (STEP_COUNT - 1) } as CSSProperties}
        >
          {titles.map((name, i) => (
            <button
              key={name}
              id={`htp-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-controls="htp-stage"
              aria-label={`${t.step} ${i + 1}: ${name}`}
              tabIndex={i === step ? 0 : -1}
              className={`htp__pip${i === step ? ' is-active' : i < step ? ' is-done' : ''}`}
              onClick={() => go(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </header>

      <div className="htp__caption" key={step}>
        <span className="htp__count">
          {step + 1} / {STEP_COUNT}
        </span>
        <h2 className="htp__name">{title}</h2>
        <p className="htp__body">{body}</p>
      </div>

      <div className="htp__stage" id="htp-stage" role="tabpanel" aria-labelledby={`htp-tab-${step}`}>
        {step <= STEP.pick && (
          <div className="fight htp-card">
            {step === STEP.room ? (
              <div className="htp-card__top">
                <div className="htp-code">
                  <span className="htp-code__label">{t.roomCode}</span>
                  <strong className="htp-code__value">{ROOM_CODE}</strong>
                </div>
                <span className="htp-code__link">tuneboxed.com/join/{ROOM_CODE}</span>
              </div>
            ) : (
              <div className="htp-card__top htp-songs" role="group" aria-label={title}>
                {SONGS.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    className={`htp-song${i === song ? ' is-picked' : ''}`}
                    aria-pressed={i === song}
                    onClick={() => pickSong(i)}
                  >
                    <img src={s.art} alt="" />
                    <span className="htp-song__text">
                      <strong>{s.title}</strong>
                      <small>{s.artist}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="fight__ring htp-card__ring">
              <Suspense fallback={null}>
                {step === STEP.room ? (
                  <FightCanvas mode="parade" parade={LOBBY} shot={LOBBY_SHOT} />
                ) : (
                  <FightCanvas
                    mode="locker"
                    shot={LOCKER_SHOT}
                    lockerYaw={yaw}
                    a={{
                      name: 'Ashley',
                      loadout: lookNow,
                      pose: dancing ? 'taunt' : 'idle',
                      beat: dance,
                      dance: lookNow.dance,
                    }}
                  />
                )}
              </Suspense>
            </div>
            <p className="fight__call">
              {step === STEP.room ? (
                LOBBY.map((f) => f.name).join(' · ')
              ) : (
                <>
                  <strong>{SONGS[song].title}</strong> – {SONGS[song].artist}
                </>
              )}
            </p>
          </div>
        )}

        {fight && (
          <BoxingMatch
            a={{
              name: 'Ashley',
              loadout: BLUE,
              songTitle: SONGS[0].title,
              songArtist: SONGS[0].artist,
              artworkUrl: SONGS[0].art,
              votes: fight.votesA,
              ballotNumber: 1,
            }}
            b={{
              name: 'Marcus',
              loadout: ORANGE,
              songTitle: SONGS[1].title,
              songArtist: SONGS[1].artist,
              artworkUrl: SONGS[1].art,
              votes: fight.votesB,
              ballotNumber: 2,
            }}
            phase={fight.phase}
            winner={fight.winner}
            nowPlaying={fight.nowPlaying}
            walkSeconds={WALK_SECONDS}
            walkOffset={fight.walkOffset}
            fightKey={fight.fightKey}
            chatChannel={fight.chatChannel}
            roundLabel="Round 1"
            voteBoost={false}
          />
        )}
      </div>

      <div className="htp__foot">
        {step === STEP.pick && (
          <button type="button" className="htp__ghost" onClick={changeLook}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M15.5 8A6 6 0 0 0 4.6 6.4M4.5 12a6 6 0 0 0 10.9 1.6M15.5 3.5V8H11M4.5 16.5V12H9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.look}
          </button>
        )}

        {step === STEP.votes && (
          <div className="htp__chat">
            <DemoChat channel="yourchannel" lines={votesChat(tick)} />
          </div>
        )}

        {finish && (
          <div className="htp-seg" role="group" aria-label={title}>
            {(['ko', 'decision'] as const).map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={finish.ending === e}
                onClick={() => {
                  setFirstEnding(e);
                  setVisit((v) => v + 1);
                }}
              >
                {e === 'ko' ? t.endKo : t.endDecision}
              </button>
            ))}
          </div>
        )}

        {step === STEP.play && (
          <div className="htp-play">
            <div className="htp-play__votes">
              {(['a', 'b'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`htp-vote htp-vote--${side}`}
                  disabled={round.over}
                  onClick={() => vote(side)}
                >
                  <span className="htp-vote__num">{side === 'a' ? 1 : 2}</span>
                  <span className="htp-vote__song">{SONGS[side === 'a' ? 0 : 1].title}</span>
                </button>
              ))}
            </div>
            {round.winner ? (
              <button type="button" className="htp__ghost" onClick={() => setRound((r) => newRound(r.round + 1))}>
                {t.again}
              </button>
            ) : (
              <p className="htp-play__hint">
                <strong aria-live="polite">{t.votesLeft.replace('{n}', String(votesLeft))}</strong>
                {t.demoHint}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="htp__nav">
        <button
          type="button"
          className="htp__prev"
          aria-label={t.prev}
          disabled={step === 0}
          onClick={() => go(step - 1)}
        >
          <Arrow back />
        </button>
        {step < STEP_COUNT - 1 ? (
          <button type="button" className="htp__next" onClick={() => go(step + 1)}>
            {t.next}
            <Arrow />
          </button>
        ) : (
          <Link to="/battle" className="htp__next">
            {t.cta}
            <Arrow />
          </Link>
        )}
      </div>
    </section>
  );
}
