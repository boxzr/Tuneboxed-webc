import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { CrownIcon } from "./icons";
import PixelFX from "../../components/PixelFX";
import { type FightScore, fightScore } from "../fight";
import type { BattleRoundPhase } from "../../types/battle";
import { COMBO_EVERY, HEAT_MAX } from "../../fight3d/punchDirector";
import { usePunchDirector } from "../../fight3d/usePunchDirector";
import { pickWalkStyles } from "../../fight3d/walkStyles";
import { encoreFor } from "../../fight3d/dances";
import { cornerLoadout, type FighterLoadout } from "../../fight3d/loadout";
import type { RefCall } from "../../fight3d/Referee";
import "./fight.css";

// three.js is most of the site's weight. Splitting it out lets the scoreboard,
// chat and the rest of the page paint first; the download starts as soon as
// this module loads, so the ring is not waiting on a render to ask for it.
const loadFightCanvas = () => import("../../fight3d/FightCanvas");
void loadFightCanvas();
const FightCanvas = lazy(loadFightCanvas);

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
  loadout?: FighterLoadout;
}

/** `round` is the tale-of-the-tape card, `lets` the "Fight" call after it. */
type BellCall = "round" | "lets" | null;

/** The A-vs-B card holds this long, then "Fight" until the total. */
const BELL_ROUND_MS = 1400;
const BELL_TOTAL_MS = 2200;

function useFightBell(
  phase: BattleRoundPhase,
  decided: boolean,
  walking: boolean,
): BellCall {
  const [bell, setBell] = useState<BellCall>(null);
  const boutKey = decided
    ? "over"
    : walking
      ? "walk"
      : phase === "playing" || phase === "judging"
        ? "fight"
        : "idle";

  useEffect(() => {
    if (boutKey === "fight") {
      setBell("round");
      const t1 = window.setTimeout(() => setBell("lets"), BELL_ROUND_MS);
      const t2 = window.setTimeout(() => setBell(null), BELL_TOTAL_MS);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    setBell(null);
  }, [boutKey]);

  return bell;
}

export default function BoxingMatch({
  a,
  b,
  phase,
  winner,
  nowPlaying,
  chatChannel,
  roundLabel,
  judgeName = null,
  onPick,
  fans = [],
  walkSeconds = 30,
  walkOffset = 0,
  fightKey = "",
  scoreUnit = "votes",
  voteBoost = true,
}: {
  a: Fighter;
  b: Fighter;
  phase: BattleRoundPhase;
  winner: "a" | "b" | null;
  nowPlaying: "a" | "b" | null;
  chatChannel: string | null;
  roundLabel: string;
  judgeName?: string | null;
  /** Host-judge: tap a corner to crown it. */
  onPick?: (side: "a" | "b") => void;
  /** People in the room who are not in a corner. */
  fans?: { name: string; loadout: FighterLoadout }[];
  /** Length of each song preview, which is how long each walkout lasts. */
  walkSeconds?: number;
  /** Seconds into the song that is playing now, off the room's clock. */
  walkOffset?: number;
  /** Changes every fight; picks each corner's walkout. */
  fightKey?: string;
  /** What the tallies count. The daily fight replays likes, not chat votes. */
  scoreUnit?: "votes" | "likes";
  /**
   * A quiet room makes each vote hit harder. The tutorial turns that off, so
   * one vote reads as one punch and three in a row as the combo.
   */
  voteBoost?: boolean;
}) {
  const judged = judgeName !== null;
  const score = fightScore(a.votes, b.votes);
  const decided = winner !== null;
  const floored = decided && score.knockout;
  const loser = winner === "a" ? "b" : winner === "b" ? "a" : null;
  const lastWalker = useRef<"a" | "b">("a");
  if (nowPlaying) lastWalker.current = nowPlaying;
  // Once somebody has walked out and nothing is playing, the walkouts are over:
  // ring the bell now instead of holding the last walkout until the server
  // round-trips the switch to voting.
  const walked = useRef(false);
  if (phase !== "playing" || decided) walked.current = false;
  else if (nowPlaying) walked.current = true;
  const walkoutSide =
    !decided && phase === "playing"
      ? (nowPlaying ?? (walked.current ? null : lastWalker.current))
      : null;
  const firstWalker = useRef<"a" | "b" | null>(null);
  if (!walkoutSide) firstWalker.current = null;
  else if (!firstWalker.current) firstWalker.current = walkoutSide;
  const bell = useFightBell(phase, decided, walkoutSide !== null);
  const intro = bell === "round" || bell === "lets";
  const {
    poseA: rawA,
    poseB: rawB,
    heatA,
    heatB,
    beat,
    hits,
    combo,
    streakA,
    streakB,
    runA,
    runB,
    boost,
  } = usePunchDirector(a.votes, b.votes, winner, score.knockout, voteBoost);
  const poseA = bell === "round" ? "idle" : rawA;
  const poseB = bell === "round" ? "idle" : rawB;
  const total = a.votes + b.votes;
  const loadA = a.loadout ?? cornerLoadout("a", a.name);
  const loadB = b.loadout ?? cornerLoadout("b", b.name);
  const walker = walkoutSide === "b" ? b : a;
  const styles = useMemo(
    () =>
      pickWalkStyles(
        `${fightKey}|${a.name}|${a.songTitle ?? ""}|${b.name}|${b.songTitle ?? ""}`,
      ),
    [fightKey, a.name, a.songTitle, b.name, b.songTitle],
  );
  const call: RefCall = intro ? "intro" : decided ? "over" : "fight";

  return (
    <div
      className={`fight${decided ? " fight--decided" : ""}`}
    >
      <FightHud
          a={a}
          b={b}
          score={score}
          roundLabel={roundLabel}
          winner={winner}
          nowPlaying={nowPlaying}
          judged={judged}
          heatA={heatA}
          heatB={heatB}
          streakA={phase === "judging" && !decided ? streakA : null}
          streakB={phase === "judging" && !decided ? streakB : null}
          runA={runA}
          runB={runB}
          unit={scoreUnit}
        />

      <div className="fight__ring">
        <Suspense fallback={null}>
        <FightCanvas
          mode={walkoutSide ? "walkout" : "bout"}
          walkSeconds={walkSeconds}
          walkOffset={walkOffset}
          walker={
            walkoutSide
              ? {
                  side: walkoutSide,
                  name: walker.name,
                  loadout: walkoutSide === "a" ? loadA : loadB,
                  songTitle: walker.songTitle,
                  songArtist: walker.songArtist,
                  artworkUrl: walker.artworkUrl,
                  style: styles[walkoutSide],
                  dance: (walkoutSide === "a" ? loadA : loadB).dance,
                  encore: encoreFor(
                    (walkoutSide === "a" ? loadA : loadB).dance,
                    `${fightKey}|${walkoutSide}|${walker.name}`,
                  ),
                }
              : undefined
          }
          call={call}
          fans={fans}
          board={{
            roundLabel,
            aName: a.name,
            bName: b.name,
            aSong: a.songTitle,
            bSong: b.songTitle,
            votesA: a.votes,
            votesB: b.votes,
            healthA: score.healthA,
            healthB: score.healthB,
            unit: scoreUnit,
          }}
          a={{
            name: a.name,
            loadout: loadA,
            dance: loadA.dance,
            pose: poseA,
            beat,
            hits,
            songTitle: a.songTitle,
            votes: a.votes,
          }}
          b={{
            name: b.name,
            loadout: loadB,
            dance: loadB.dance,
            pose: poseB,
            beat,
            hits,
            songTitle: b.songTitle,
            votes: b.votes,
          }}
        />
        </Suspense>
        {combo && !walkoutSide && !decided && (
          <PixelFX
            effect={combo.boost > 1 ? "crit" : "hitSpark"}
            trigger={combo.key}
            scale={3}
            className={`fight__fx fight__fx--${combo.side === "a" ? "b" : "a"}`}
          />
        )}
        {decided && loser && (
          <>
            <PixelFX
              key={`ko-${fightKey}`}
              effect={floored ? "crit" : "pow"}
              scale={3}
              className={`fight__fx fight__fx--${loser}`}
            />
            <PixelFX
              key={`confetti-${fightKey}`}
              effect="confetti"
              scale={3}
              className="fight__fx fight__fx--top"
            />
          </>
        )}
        {walkoutSide && (
          <Entrance
            key={walkoutSide}
            side={walkoutSide}
            fighter={walker}
            seconds={walkSeconds}
            offset={walkOffset}
            second={walkoutSide !== firstWalker.current}
          />
        )}
        {combo && !walkoutSide && !decided && !bell && (
          <div
            key={combo.key}
            className={`fight__combo fight__combo--${combo.side}`}
            aria-live="polite"
          >
            <span className="fight__combo-label">
              {combo.hits}-hit {combo.label.toLowerCase()}
            </span>
            <span className="fight__combo-sub">
              {combo.boost > 1
                ? `${combo.run} ${combo.run === 1 ? scoreUnit.slice(0, -1) : scoreUnit} ×${combo.boost} · ${(combo.side === "a" ? a : b).name}`
                : `${combo.streak} in a row · ${(combo.side === "a" ? a : b).name}`}
            </span>
          </div>
        )}
        {bell === "round" && (
          <Versus a={a} b={b} roundLabel={roundLabel} />
        )}
        {bell === "lets" && (
          <div className="fight__bell" aria-live="polite">
            <span className="fight__bell-copy">Fight</span>
          </div>
        )}
        {decided && winner && (
          <Result
            key={`result-${fightKey}`}
            side={winner}
            fighter={winner === "a" ? a : b}
            knockout={floored}
            judgeName={judgeName}
            score={
              judged
                ? null
                : {
                    won: (winner === "a" ? a : b).votes,
                    lost: (winner === "a" ? b : a).votes,
                    unit: scoreUnit,
                  }
            }
          />
        )}
        {onPick && !decided && !walkoutSide && (
          <div className="fight__crowns">
            <button
              type="button"
              className="fight__crown-btn fight__crown-btn--a"
              onClick={() => onPick("a")}
            >
              <CrownIcon size={18} />
              <span>
                Crown {a.name}
                {a.songTitle && <small>{a.songTitle}</small>}
              </span>
            </button>
            <button
              type="button"
              className="fight__crown-btn fight__crown-btn--b"
              onClick={() => onPick("b")}
            >
              <CrownIcon size={18} />
              <span>
                Crown {b.name}
                {b.songTitle && <small>{b.songTitle}</small>}
              </span>
            </button>
          </div>
        )}
      </div>

      <FightCall
          phase={phase}
          chatChannel={chatChannel}
          total={total}
          boost={boost}
          decided={decided}
          winnerName={winner ? (winner === "a" ? a : b).name : null}
          winnerVotes={winner ? (winner === "a" ? a : b).votes : 0}
          loserFloored={floored}
          loserName={loser ? (loser === "a" ? a : b).name : null}
          loserVotes={loser ? (loser === "a" ? a : b).votes : 0}
          judgeName={judgeName}
          scoreUnit={scoreUnit}
        />
    </div>
  );
}

/** Cover art, or a record label in the corner's colour when a song has none. */
function Cover({ url, className }: { url: string | null; className: string }) {
  return url ? (
    <img className={className} src={url} alt="" />
  ) : (
    <span className={`${className} fight__cover-blank`} aria-hidden="true">
      ♪
    </span>
  );
}

/** Momentum toward a finisher: one segment per point of heat. */
function Momentum({ side, value }: { side: "a" | "b"; value: number }) {
  return (
    <div
      className={`fight__heat${value >= HEAT_MAX ? " is-full" : ""}`}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={HEAT_MAX}
      aria-label={`${side === "a" ? "Blue" : "Orange"} corner momentum`}
    >
      {Array.from({ length: HEAT_MAX }, (_, i) => (
        <span key={i} className={i < value ? "is-on" : ""} />
      ))}
    </div>
  );
}

function FightHud({
  a,
  b,
  score,
  roundLabel,
  winner,
  nowPlaying,
  judged,
  heatA,
  heatB,
  streakA,
  streakB,
  runA,
  runB,
  unit,
}: {
  a: Fighter;
  b: Fighter;
  score: FightScore;
  roundLabel: string;
  winner: "a" | "b" | null;
  nowPlaying: "a" | "b" | null;
  judged: boolean;
  heatA: number;
  heatB: number;
  streakA: number | null;
  streakB: number | null;
  runA: number;
  runB: number;
  unit: "votes" | "likes";
}) {
  return (
    <div className="fight__hud">
      <HealthBar
        side="a"
        fighter={a}
        health={score.healthA}
        won={winner === "a"}
        playing={nowPlaying === "a"}
        judged={judged}
        heat={heatA}
        streak={streakA}
        run={runA}
        unit={unit}
      />
      <span className="fight__round">{roundLabel}</span>
      <HealthBar
        side="b"
        fighter={b}
        health={score.healthB}
        won={winner === "b"}
        playing={nowPlaying === "b"}
        judged={judged}
        heat={heatB}
        streak={streakB}
        run={runB}
        unit={unit}
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
  judged,
  heat,
  streak,
  run,
  unit,
}: {
  side: "a" | "b";
  fighter: Fighter;
  health: number;
  won: boolean;
  playing: boolean;
  judged: boolean;
  heat: number;
  streak: number | null;
  run: number;
  unit: "votes" | "likes";
}) {
  return (
    <div
      className={`fight__seat fight__seat--${side}${won ? " fight__seat--won" : ""}${
        playing ? " fight__seat--playing" : ""
      }`}
    >
      <div className="fight__seat-top">
        {!judged && (
          <span className="fight__num" aria-hidden="true">
            {fighter.ballotNumber}
          </span>
        )}
        {fighter.artworkUrl && (
          <img className="fight__art" src={fighter.artworkUrl} alt="" />
        )}
        <div className="fight__label">
          <span className="fight__player">
            {won && <CrownIcon size={14} />}
            <span className="fight__player-name">{fighter.name}</span>
            {playing && (
              <span className="fight__live">
                ♪<span className="fight__sr"> now playing</span>
              </span>
            )}
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
        style={{ "--health": health } as CSSProperties}
      >
        <span className="fight__bar-hurt" />
        <span className="fight__bar-fill" />
      </div>
      <div className="fight__meta">
        <Momentum side={side} value={heat} />
        {heat >= HEAT_MAX && <span className="fight__finisher">Finisher</span>}
        {!judged && (
          <span className="fight__count">
            {fighter.votes}
            <small> {fighter.votes === 1 ? unit.slice(0, -1) : unit}</small>
          </span>
        )}
      </div>
      {streak != null && (
        <Streak
          side={side}
          ballot={fighter.ballotNumber}
          streak={streak}
          run={run}
        />
      )}
    </div>
  );
}

/** Tale of the tape, before the bell: both covers, both names, one "vs". */
function Versus({
  a,
  b,
  roundLabel,
}: {
  a: Fighter;
  b: Fighter;
  roundLabel: string;
}) {
  return (
    <div className="fight__versus" aria-live="polite">
      <span className="fight__versus-round">{roundLabel}</span>
      <div className="fight__versus-row">
        {(["a", "b"] as const).map((side) => {
          const f = side === "a" ? a : b;
          return (
            <div
              key={side}
              className={`fight__versus-side fight__versus-side--${side}`}
            >
              <Cover url={f.artworkUrl} className="fight__versus-art" />
              <span className="fight__versus-name">{f.name}</span>
              <span className="fight__versus-song">{f.songTitle}</span>
            </div>
          );
        })}
        <span className="fight__versus-vs">vs</span>
      </div>
    </div>
  );
}

/**
 * The win, called like a broadcast: "K.O." across the picture on a knockout,
 * then a lower third that names the winner along the bottom of the ring.
 */
function Result({
  side,
  fighter,
  knockout,
  judgeName,
  score,
}: {
  side: "a" | "b";
  fighter: Fighter;
  knockout: boolean;
  judgeName: string | null;
  score: { won: number; lost: number; unit: string } | null;
}) {
  return (
    <div
      className={`fight__result fight__result--${side} fight__result--${knockout ? "ko" : "decision"}`}
      role="status"
    >
      {knockout && (
        <span className="fight__result-stamp" aria-hidden="true">
          K.O.
        </span>
      )}
      <div className="fight__result-bar">
        <Cover url={fighter.artworkUrl} className="fight__result-art" />
        <div className="fight__result-body">
          <span className="fight__result-kind">
            <span className="fight__result-tag">
              <CrownIcon size={14} />
              Winner
            </span>
            {knockout
              ? "by knockout"
              : judgeName
                ? "judge’s decision"
                : "by decision"}
          </span>
          <span className="fight__result-name">{fighter.name}</span>
          {fighter.songTitle && (
            <span className="fight__result-song">
              <strong>{fighter.songTitle}</strong>
              {fighter.songArtist ? ` · ${fighter.songArtist}` : ""}
            </span>
          )}
        </div>
        {score && (
          <div className="fight__result-score">
            <b>
              {score.won}
              <i>–</i>
              {score.lost}
            </b>
            <small>{score.unit}</small>
          </div>
        )}
      </div>
    </div>
  );
}

function FightCall({
  phase,
  chatChannel,
  total,
  boost,
  decided,
  winnerName,
  winnerVotes,
  loserFloored,
  loserName,
  loserVotes,
  judgeName,
  scoreUnit,
}: {
  phase: BattleRoundPhase;
  chatChannel: string | null;
  total: number;
  /** What each vote is worth right now. */
  boost: number;
  decided: boolean;
  winnerName: string | null;
  winnerVotes: number;
  loserFloored: boolean;
  loserName: string | null;
  loserVotes: number;
  judgeName: string | null;
  scoreUnit: "votes" | "likes";
}) {
  if (judgeName !== null) {
    if (decided && winnerName) {
      return (
        <p className="fight__call fight__call--won">
          <strong>{judgeName}</strong> gives it to <strong>{winnerName}</strong>
        </p>
      );
    }
    if (phase === "playing") {
      return (
        <p className="fight__call">
          Both songs are playing. {judgeName} is listening.
        </p>
      );
    }
    if (phase === "judging") {
      return (
        <p className="fight__call">
          <strong>{judgeName}</strong> is judging this one
        </p>
      );
    }
    return <p className="fight__call">Squaring up…</p>;
  }

  if (decided && winnerName) {
    return (
      <p className="fight__call fight__call--won">
        {loserFloored && loserName ? (
          <>
            <strong>{winnerName}</strong> knocks <strong>{loserName}</strong>{" "}
            out
          </>
        ) : winnerVotes === loserVotes ? (
          <>
            <strong>{winnerName}</strong> takes it on{" "}
            {scoreUnit === "likes" ? "the better seed" : <>the AI judge&rsquo;s call</>}{" "}
            after a {winnerVotes}&ndash;{loserVotes} tie
          </>
        ) : (
          <>
            <strong>{winnerName}</strong> takes it {winnerVotes}&ndash;
            {loserVotes} on {scoreUnit}
          </>
        )}
      </p>
    );
  }

  if (phase === "playing") {
    return (
      <p className="fight__call">
        Walkouts. The fight starts when both songs finish
        {chatChannel ? " — then type 1 or 2 in chat to throw punches" : ""}
      </p>
    );
  }

  if (phase === "judging") {
    return (
      <p className={`fight__call${chatChannel ? " fight__call--vote" : ""}`}>
        {chatChannel ? (
          <>
            Type <strong>1</strong> or <strong>2</strong> in chat to throw a
            punch
          </>
        ) : (
          <>Vote for the song that should win</>
        )}
        {total > 0 && (
          <span className="fight__tally">
            {" · "}
            {total} {total === 1 ? "punch" : "punches"} thrown
          </span>
        )}
        {chatChannel && boost > 1 && (
          <span className="fight__boost">
            {boost >= 3 ? "Quiet chat" : "Small chat"} · every vote hits ×
            {boost}
          </span>
        )}
      </p>
    );
  }

  return <p className="fight__call">Squaring up…</p>;
}

/** Chat's run for this corner: three in a row is a combo, six is huge, nine is mega. */
function Streak({
  side,
  ballot,
  streak,
  run,
}: {
  side: "a" | "b";
  ballot: number;
  streak: number;
  run: number;
}) {
  const into = streak % COMBO_EVERY;
  const pips = streak > 0 && into === 0 ? COMBO_EVERY : into;
  return (
    <div
      className={`streak streak--${side}${streak >= COMBO_EVERY ? " streak--hot" : ""}`}
    >
      {Array.from({ length: COMBO_EVERY }, (_, i) => (
        <span key={i} className={i < pips ? "is-on" : ""}>
          {ballot}
        </span>
      ))}
      <em>{run >= 2 ? `${run} in a row` : "combo"}</em>
    </div>
  );
}

/** Entrance lower third: cover, name, song, and how long until the next cut. */
function Entrance({
  side,
  fighter,
  seconds,
  offset,
  second,
}: {
  side: "a" | "b";
  fighter: Fighter;
  seconds: number;
  offset: number;
  second: boolean;
}) {
  const left = Math.max(0, Math.ceil(seconds - offset));
  const progress = Math.min(1, Math.max(0, offset / Math.max(1, seconds)));
  return (
    <div className={`fight__entrance fight__entrance--${side}`}>
      <Cover url={fighter.artworkUrl} className="fight__entrance-art" />
      <div className="fight__entrance-body">
        <span className="fight__entrance-name">
          <span className="fight__entrance-who">{fighter.name}</span>
          <span className="fight__entrance-corner">
            {side === "a" ? "Blue corner" : "Orange corner"}
          </span>
        </span>
        <span className="fight__entrance-song">
          <strong>{fighter.songTitle}</strong>
          {fighter.songArtist ? ` – ${fighter.songArtist}` : ""}
        </span>
      </div>
      <span className="fight__entrance-left">
        {second ? "Bell" : "Next"} {left}s
      </span>
      <span className="fight__entrance-track" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </span>
    </div>
  );
}
