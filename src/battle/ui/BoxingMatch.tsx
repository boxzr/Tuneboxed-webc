import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CrownIcon } from "./icons";
import { type FightScore, fightScore } from "../fight";
import type { BattleRoundPhase } from "../../types/battle";
import FightCanvas from "../../fight3d/FightCanvas";
import { COMBO_EVERY, HEAT_MAX } from "../../fight3d/punchDirector";
import { usePunchDirector } from "../../fight3d/usePunchDirector";
import { pickWalkStyles } from "../../fight3d/walkStyles";
import { defaultLoadout, type FighterLoadout } from "../../fight3d/loadout";
import type { RefCall } from "../../fight3d/Referee";
import "./fight.css";

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

type BellCall = "round" | "lets" | "over" | null;

function bellRoundText(label: string) {
  const trimmed = label.trim();
  if (/^round\b/i.test(trimmed)) return trimmed.toUpperCase();
  return trimmed.toUpperCase();
}

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
    if (boutKey === "over") {
      setBell("over");
      return;
    }
    if (boutKey === "fight") {
      setBell("round");
      const t1 = window.setTimeout(() => setBell("lets"), 1500);
      const t2 = window.setTimeout(() => setBell(null), 3200);
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
}) {
  const judged = judgeName !== null;
  const score = fightScore(a.votes, b.votes);
  const decided = winner !== null;
  const floored = decided && score.knockout;
  const loser = winner === "a" ? "b" : winner === "b" ? "a" : null;
  const lastWalker = useRef<"a" | "b">("a");
  if (nowPlaying) lastWalker.current = nowPlaying;
  const walkoutSide =
    !decided && phase === "playing" ? (nowPlaying ?? lastWalker.current) : null;
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
  } = usePunchDirector(a.votes, b.votes, winner, score.knockout);
  const poseA = bell === "round" ? "idle" : rawA;
  const poseB = bell === "round" ? "idle" : rawB;
  const total = a.votes + b.votes;
  const loadA = a.loadout ?? defaultLoadout(a.name);
  const loadB = b.loadout ?? defaultLoadout(b.name);
  const walker = walkoutSide === "b" ? b : a;
  const styles = useMemo(
    () =>
      pickWalkStyles(
        `${fightKey}|${a.name}|${a.songTitle ?? ""}|${b.name}|${b.songTitle ?? ""}`,
      ),
    [fightKey, a.name, a.songTitle, b.name, b.songTitle],
  );
  const call: RefCall = intro ? "intro" : bell === "over" ? "over" : "fight";
  const bellCopy =
    bell === "round"
      ? bellRoundText(roundLabel)
      : bell === "lets"
        ? "LET'S FIGHT!"
        : bell === "over"
          ? score.knockout
            ? "KNOCKOUT"
            : "ROUND OVER"
          : null;

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
        />

      <div className="fight__ring">
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
          }}
          a={{
            name: a.name,
            loadout: loadA,
            pose: poseA,
            beat,
            hits,
            songTitle: a.songTitle,
            votes: a.votes,
          }}
          b={{
            name: b.name,
            loadout: loadB,
            pose: poseB,
            beat,
            hits,
            songTitle: b.songTitle,
            votes: b.votes,
          }}
        />
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
        {combo && !walkoutSide && !decided && !bellCopy && (
          <div
            key={combo.key}
            className={`fight__combo fight__combo--${combo.side}`}
            aria-live="polite"
          >
            <span className="fight__combo-hits">{combo.hits} HIT</span>
            <span className="fight__combo-label">{combo.label}!</span>
            <span className="fight__combo-sub">
              {combo.boost > 1
                ? `${combo.run} ${combo.run === 1 ? "vote" : "votes"} ×${combo.boost} for ${(combo.side === "a" ? a : b).name}`
                : `${combo.streak} in a row for ${(combo.side === "a" ? a : b).name}`}
            </span>
          </div>
        )}
        {bellCopy && (
          <div className="fight__bell" aria-live="polite">
            <span
              className={`fight__bell-copy${
                bell === "lets"
                  ? " fight__bell-copy--lets"
                  : bell === "over"
                    ? " fight__bell-copy--over"
                    : ""
              }`}
            >
              {bellCopy}
            </span>
          </div>
        )}
        {onPick && !decided && !walkoutSide && (
          <div className="fight__crowns">
            <button
              type="button"
              className="fight__crown-btn"
              onClick={() => onPick("a")}
            >
              Crown {a.name}
            </button>
            <button
              type="button"
              className="fight__crown-btn"
              onClick={() => onPick("b")}
            >
              Crown {b.name}
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
        />
    </div>
  );
}

function Heat({ side, value }: { side: "a" | "b"; value: number }) {
  const letters = ["H", "E", "A", "T", "!", "!"];
  return (
    <div
      className={`heat heat--${side}`}
      aria-label={`${side === "a" ? "Blue" : "Orange"} corner heat`}
    >
      {letters.slice(0, HEAT_MAX).map((ch, i) => (
        <span key={i} className={i < value ? "is-on" : ""}>
          {ch}
        </span>
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
            {won && <CrownIcon size={18} />}
            {playing ? "Now playing" : fighter.name}
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
        {!judged && <span className="fight__bar-votes">{fighter.votes}</span>}
      </div>
      <Heat side={side} value={heat} />
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
        ) : (
          <>
            <strong>{winnerName}</strong> takes it {winnerVotes}&ndash;
            {loserVotes} on votes
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

/** TV-style entrance card: cover art, song, and how long until the bell. */
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
      <span className="fight__entrance-bar" />
      {fighter.artworkUrl ? (
        <img className="fight__entrance-art" src={fighter.artworkUrl} alt="" />
      ) : (
        <span
          className="fight__entrance-art fight__entrance-art--blank"
          aria-hidden="true"
        >
          ♪
        </span>
      )}
      <div className="fight__entrance-body">
        <span className="fight__entrance-kicker">
          NOW ENTERING · {side === "a" ? "BLUE" : "ORANGE"} CORNER
        </span>
        <span className="fight__entrance-name">
          {fighter.name.toUpperCase()}
        </span>
        <span className="fight__entrance-song">
          <strong>{fighter.songTitle}</strong> — {fighter.songArtist}
        </span>
        <span className="fight__entrance-clock">
          <span className="fight__entrance-track">
            <span style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="fight__entrance-left">
            {second ? `Fight in ${left}s` : `${left}s · then the other corner`}
          </span>
        </span>
      </div>
    </div>
  );
}
