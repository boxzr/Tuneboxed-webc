import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BoxingMatch from '../battle/ui/BoxingMatch';
import { CrownIcon } from '../battle/ui/icons';
import PixelFX from '../components/PixelFX';
import RollingNumber from '../components/RollingNumber';
import { defaultLoadout } from '../fight3d/loadout';
import {
  type DailyBout,
  type DailyFightCard,
  type DailyFighter,
  ROUND_NAMES,
  bracketFor,
  fetchDailyFight,
  isBye,
} from '../lib/dailyFight';
import { supabaseConfigured } from '../lib/supabase';
import './dailyFight.css';

/**
 * The app's nightly fight as a room a streamer opens and starts.
 *
 * Phones publish the card during the fight window; this page replays it.
 * Likes already decided every bout, so there is no voting here: each corner
 * walks out to its song, the likes count up as punches, and the result lands.
 */

const TICK_MS = 500;
/** Each corner walks out to 12 seconds of its song. */
const WALK_TICKS = 24;
const BELL_TICKS = 4;
const FIGHT_TICKS = 16;
const RESULT_TICKS = 10;
const INTRO_TICKS = WALK_TICKS * 2 + BELL_TICKS;
const BOUT_TICKS = INTRO_TICKS + FIGHT_TICKS + RESULT_TICKS;
const WALK_SECONDS = (WALK_TICKS * TICK_MS) / 1000;

type Screen = 'loading' | 'empty' | 'error' | 'bracket' | 'fight' | 'champion';

const boutKey = (b: DailyBout) => `${b.round}-${b.index}`;

function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DailyFightRoom() {
  const [card, setCard] = useState<DailyFightCard | null>(null);
  const [screen, setScreen] = useState<Screen>('loading');
  const [boutIndex, setBoutIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const audio = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setScreen('loading');
    try {
      const next = await fetchDailyFight();
      setCard(next);
      setScreen(next && next.fighters.length >= 2 ? 'bracket' : 'empty');
    } catch {
      setScreen('error');
    }
  }, []);

  useEffect(() => {
    document.title = 'Daily Fight | TuneBoxed';
    if (supabaseConfigured) void load();
    else setScreen('error');
  }, [load]);

  const rounds = useMemo(() => (card ? bracketFor(card.fighters) : []), [card]);
  const playOrder = useMemo(() => rounds.flat().filter((b) => !isBye(b)), [rounds]);
  const champion = rounds.length ? rounds[rounds.length - 1][0].winner : null;
  const bout = playOrder[boutIndex] ?? null;

  const reveal = useCallback((b: DailyBout) => {
    setRevealed((prev) => new Set(prev).add(boutKey(b)));
  }, []);

  const finishBout = useCallback(() => {
    if (bout) reveal(bout);
    if (boutIndex + 1 < playOrder.length) {
      setBoutIndex((i) => i + 1);
      setStep(0);
    } else {
      setScreen('champion');
    }
  }, [bout, boutIndex, playOrder.length, reveal]);

  useEffect(() => {
    if (screen !== 'fight' || paused) return;
    const timer = window.setInterval(() => setStep((s) => s + 1), TICK_MS);
    return () => window.clearInterval(timer);
  }, [screen, paused]);

  useEffect(() => {
    if (screen === 'fight' && step >= BOUT_TICKS) finishBout();
  }, [screen, step, finishBout]);

  const walking = screen === 'fight' && step < WALK_TICKS * 2;
  const walker: 'a' | 'b' = step < WALK_TICKS ? 'a' : 'b';
  const walkingFighter = bout ? (walker === 'a' ? bout.red : bout.blue) : null;

  // The walkout plays the corner's song. Starting the room is a click, which
  // is what lets the browser play audio without asking again.
  useEffect(() => {
    if (!audio.current) audio.current = new Audio();
    const player = audio.current;
    const src = walking ? walkingFighter?.previewUrl ?? null : null;
    if (!src || paused) {
      player.pause();
      return;
    }
    if (player.src !== src) {
      player.src = src;
      player.currentTime = 0;
    }
    void player.play().catch(() => undefined);
  }, [walking, walkingFighter, paused]);

  useEffect(() => () => audio.current?.pause(), []);

  const start = () => {
    setRevealed(new Set());
    setBoutIndex(0);
    setStep(0);
    setPaused(false);
    setScreen('fight');
  };

  const skipBout = () => finishBout();

  const skipToChampion = () => {
    playOrder.forEach(reveal);
    audio.current?.pause();
    setScreen('champion');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'fight') return;
      if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === 'ArrowRight') {
        finishBout();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, finishBout]);

  if (screen === 'loading') {
    return (
      <main className="df-room df-room--center">
        <p className="df-muted">Loading tonight's fight…</p>
      </main>
    );
  }

  if (screen === 'empty' || screen === 'error' || !card) {
    return (
      <main className="df-room df-room--center">
        <h1 className="df-title">Daily Fight</h1>
        <p className="df-muted">
          {screen === 'error'
            ? "Couldn't reach the fight. Check your connection and try again."
            : "Tonight's card shows up here once the fight opens in the app at 10 PM Central."}
        </p>
        <button className="df-btn" onClick={() => void load()}>
          Check again
        </button>
      </main>
    );
  }

  if (screen === 'champion' && champion) {
    return (
      <main className="df-room df-room--center">
        <PixelFX effect="confetti" loop scale={5} className="df-champ__confetti" />
        <div className="df-champ">
          <div className="df-champ__label">
            <CrownIcon /> {card.genre} champion
          </div>
          <div className="tb-fx-anchor">
            <PixelFX effect="levelUp" scale={4} className="tb-fx" />
            {champion.artworkUrl && <img className="df-champ__art" src={champion.artworkUrl} alt="" />}
          </div>
          <h1 className="df-champ__title">{champion.title}</h1>
          <p className="df-champ__artist">{champion.artist}</p>
          <p className="df-muted">
            Picked by @{champion.by} · <RollingNumber value={champion.likes} countUpOnView /> likes
          </p>
          <div className="df-row">
            <button className="df-btn" onClick={() => setScreen('bracket')}>
              See the bracket
            </button>
            <button className="df-btn df-btn--ghost" onClick={start}>
              Play it again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === 'fight' && bout && bout.red && bout.blue) {
    const intro = step < INTRO_TICKS;
    const fighting = step >= INTRO_TICKS && step < INTRO_TICKS + FIGHT_TICKS;
    const through = intro ? 0 : Math.min(1, (step - INTRO_TICKS + 1) / FIGHT_TICKS);
    const eased = 1 - Math.pow(1 - through, 2);
    const corner = (f: DailyFighter, ballot: number) => ({
      name: `@${f.by || 'tuneboxed'}`,
      loadout: defaultLoadout(f.by || f.title),
      songTitle: f.title,
      songArtist: f.artist,
      artworkUrl: f.artworkUrl,
      votes: Math.round(f.likes * eased),
      ballotNumber: ballot,
    });
    const decided = !intro && !fighting;
    return (
      <main className="df-room df-room--fight">
        <BoxingMatch
          a={corner(bout.red, 1)}
          b={corner(bout.blue, 2)}
          phase={walking ? 'playing' : decided ? 'revealed' : 'judging'}
          winner={decided ? (bout.winner === bout.red ? 'a' : 'b') : null}
          nowPlaying={walking ? walker : null}
          walkSeconds={WALK_SECONDS}
          walkOffset={walking ? ((step % WALK_TICKS) * TICK_MS) / 1000 : 0}
          fightKey={`${card.day}-${boutKey(bout)}`}
          chatChannel={null}
          roundLabel={ROUND_NAMES[bout.round]}
          scoreUnit="likes"
        />
        <div className="df-controls" role="toolbar" aria-label="Fight controls">
          <span className="df-controls__count">
            Fight {boutIndex + 1} of {playOrder.length}
          </span>
          <button onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
          <button onClick={skipBout}>Next fight</button>
          <button onClick={skipToChampion}>Skip to champion</button>
          <button
            onClick={() => {
              audio.current?.pause();
              setScreen('bracket');
            }}
          >
            Bracket
          </button>
        </div>
      </main>
    );
  }

  const started = revealed.size > 0 && revealed.size < playOrder.length;
  const feederDone = (r: number, i: number) => {
    const feeder = rounds[r - 1][i];
    return isBye(feeder) || revealed.has(boutKey(feeder));
  };
  return (
    <main className="df-room">
      <header className="df-head">
        <div>
          <p className="df-kicker">TuneBoxed Daily Fight · {formatDay(card.day)}</p>
          <h1 className="df-title">{card.genre}</h1>
          <p className="df-muted">
            Tonight's top {card.fighters.length} songs from the app. Likes already picked every
            winner, so press start and let it play out.
          </p>
        </div>
        <div className="df-row">
          {started && (
            <button className="df-btn" onClick={() => setScreen('fight')}>
              Keep going
            </button>
          )}
          <button className={started ? 'df-btn df-btn--ghost' : 'df-btn'} onClick={start}>
            {started ? 'Start over' : 'Start'}
          </button>
        </div>
      </header>

      <div className="df-bracket">
        {rounds.map((round, r) => (
          <section key={r} className="df-round">
            <h2 className="df-round__name">{ROUND_NAMES[r]}</h2>
            <div className="df-round__bouts">
              {round.map((b) => {
                const shown = revealed.has(boutKey(b)) || (r === 0 && isBye(b));
                return (
                  <div key={boutKey(b)} className="df-bout">
                    {[b.red, b.blue]
                      .map((f, i) => (r === 0 || feederDone(r, b.index * 2 + i) ? f : null))
                      .map((f, i) => (
                      <div
                        key={i}
                        className={`df-slot${shown && f && f === b.winner ? ' df-slot--won' : ''}${
                          shown && f && f !== b.winner ? ' df-slot--lost' : ''
                        }`}
                      >
                        {f ? (
                          <>
                            <span className="df-slot__seed">{f.seed}</span>
                            <span className="df-slot__text">
                              <span className="df-slot__title">{f.title}</span>
                              <span className="df-slot__artist">{f.artist}</span>
                            </span>
                          </>
                        ) : (
                          <span className="df-slot__text df-muted">{r === 0 ? 'Bye' : '—'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
