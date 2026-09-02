import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import { useBattleRound } from '../battle/useBattleRound';
import { useRoundAutopilot } from '../battle/useRoundAutopilot';
import { useSyncedPlayback } from '../battle/useSyncedPlayback';
import { useUsedGenres } from '../battle/useUsedGenres';
import { secondsUntil, syncClock } from '../battle/clock';
import { PARTY_ROUNDS } from '../battle/rules';
import { type HostContext, nextHostAction } from '../battle/hostActions';
import { classicReady, hasEntry, isClassic } from '../battle/playStyle';
import GenreScene from '../battle/GenreScene';
import { uniqueLeader } from '../battle/voteLeader';
import { BoxerSprite, Gloves, Monogram, PromptLabel } from '../battle/ui/primitives';
import { CheckIcon, CrownIcon, TrophyIcon } from '../battle/ui/icons';
import type { BattleMatch, BattlePlayer, BattleRoundPhase, BattleSubmission } from '../types/battle';
import '../battle/ui/ui.css';
import './tv.css';

/**
 * The board an audience watches, and the web counterpart to BattleTVView on an
 * AirPlay screen.
 *
 * This replaces the transparent OBS overlay. A transparent strip only works
 * for people who already run broadcasting software and already have a scene to
 * put it over, and it looked nothing like the game. An opaque board can simply
 * be shared as a browser tab, which works on every platform and needs nothing
 * installed, and it still drops into a Browser Source for anyone who wants
 * that.
 *
 * A host who opens it in their own browser also gets the controls, because
 * they have a session for this room in that browser. Anyone else, including an
 * OBS Browser Source with its own empty storage, gets exactly what it always
 * was: a screen that reads the room and can write nothing to it.
 */
export default function BattleTV() {
  const { code = '' } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const demo = params.get('demo') === '1';
  // For a host who captures this tab directly rather than through a Browser
  // Source, where their own controls would otherwise go out on the stream.
  const controlsAllowed = params.get('controls') !== '0';

  const stored = useMemo(() => {
    if (demo) return null;
    battle.takeHandoff(code);
    return battle.loadSession(code);
  }, [code, demo]);
  const token = stored?.token ?? null;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Loads on its own rather than through the room page, so it syncs its own
  // clock or every countdown would run against the local one.
  useEffect(() => {
    void syncClock();
  }, []);

  // The marketing site paints the page white and constrains it; a board is a
  // full-bleed surface. Scoped to a class on the document so the rule cannot
  // leak into the rest of the bundle.
  useEffect(() => {
    document.documentElement.classList.add('tv-active');
    return () => document.documentElement.classList.remove('tv-active');
  }, []);

  // Keeps the countdown moving. An interval rather than animation frames,
  // because a browser source renders offscreen where frames are throttled.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!code || demo) return;
    let live = true;
    battle
      .getRoomByCode(code)
      .then((r) => {
        if (!live) return;
        if (r) setRoomId(r.id);
        else setMissing(true);
      })
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
    };
  }, [code, demo]);

  const liveRoom = useBattleRoom(roomId, token);
  const liveRound = useBattleRound(liveRoom.room);

  // ?demo=1 renders a sample battle. Sizing and positioning a board has to
  // happen before going live, and an empty lobby gives nobody anything to aim
  // at. Judging with chat votes is the busiest the board ever gets, so that is
  // the state worth checking against.
  const { room, players, matches } = demo ? DEMO : liveRoom;
  const { round, submissions, votes } = demo ? DEMO : liveRound;

  const isHost = Boolean(room && stored && room.host_player_id === stored.playerId);
  const usedGenres = useUsedGenres(roomId, round?.id ?? null);

  // Read purely to know when the clips have run out. The board never sounds:
  // the songs come out of the host's room tab or their speakers, and a second
  // copy playing half a second behind would be worse than silence.
  const playback = useSyncedPlayback(round, submissions, false);

  // The host drives the game from whichever tab they are looking at, so the
  // parts of a round that run themselves have to run here too.
  const { empty: pickedNothing } = useRoundAutopilot({
    token,
    isHost,
    round,
    submissions,
    playbackFinished: playback.finished,
  });

  const pointerActive = usePointerActivity();

  if (missing) {
    return (
      <Board genre={null}>
        <div className="tv-idle">
          <Gloves size={220} />
          <h1 className="tv-idle__title">No room with that code</h1>
        </div>
      </Board>
    );
  }

  if (!room) {
    return (
      <Board genre={null}>
        <div className="tv-idle">
          <Gloves size={220} />
          <h1 className="tv-idle__title">Connecting…</h1>
        </div>
      </Board>
    );
  }

  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.display_name ?? 'Player';

  const isBracket = room.format === 'bracket';
  const classic = isClassic(room);
  const currentMatch = matches.find((m) => m.id === room.current_match_id) ?? null;
  const connected = players.filter((p) => p.is_connected);

  const championId =
    matches.find((m) => m.next_match_id === null && m.winner_player_id)?.winner_player_id ?? null;

  // Chat decides in a room tied to a Twitch channel. The board is never the
  // client reading chat, so it shows whatever the host last published.
  const chatTally = room.host_twitch_login ? round?.chat_tally ?? {} : null;

  const isCompetitor = (p: BattlePlayer) =>
    Boolean(currentMatch && (p.id === currentMatch.player_a_id || p.id === currentMatch.player_b_id));

  const needsAiJudge =
    isBracket && !chatTally && connected.length > 0 && connected.every(isCompetitor);

  const ballotCounts: Record<string, number> = {};
  for (const s of submissions) {
    ballotCounts[s.id] = chatTally
      ? chatTally[s.id] ?? 0
      : votes.filter((v) => v.submission_id === s.id).length;
  }
  const voteLeader = uniqueLeader(ballotCounts);

  const hostCtx: HostContext | null =
    token && isHost
      ? { token, room, matches, round, submissions, voteLeader, usedGenres, refresh: liveRoom.refresh }
      : null;

  const action = hostCtx
    ? nextHostAction(hostCtx, {
        ready: classic ? classicReady(room, players) : connected.length >= room.min_players,
        needsAiJudge,
        empty: pickedNothing,
        finished: championId !== null,
      })
    : null;

  // Saving the vibe can enable Start on this tab. Do not treat that as a click.
  const startArmedAt = useRef(0);
  const lastTheme = useRef(room.theme);
  if (room.theme !== lastTheme.current) {
    if (room.theme?.trim()) startArmedAt.current = Date.now() + 1200;
    lastTheme.current = room.theme;
  }

  const controls =
    isHost && controlsAllowed ? (
      <HostBar
        action={action}
        busy={busy}
        error={actionError}
        visible={pointerActive}
        onRun={() => {
          if (!action) return;
          if (action.id === 'start' && Date.now() < startArmedAt.current) return;
          setActionError(null);
          setBusy(true);
          action
            .run()
            .catch((e: Error) => setActionError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    ) : null;

  if (championId) {
    return (
      <Board genre={round?.genre ?? null} controls={controls}>
        <div className="tv-champion tv-hero">
          <span className="tv-champion__trophy">
            <TrophyIcon size={96} />
          </span>
          <PromptLabel>Champion</PromptLabel>
          <h1 className="tv-champion__name">{nameOf(championId)}</h1>
          <p className="tv-champion__sub">Winner of the whole bracket</p>
        </div>
      </Board>
    );
  }

  if (!round) {
    return (
      <Board
        genre={classic ? room.theme : null}
        host={room.host_twitch_login}
        avatar={room.host_avatar_url}
        controls={controls}
      >
        <Lobby
          code={room.code}
          players={players}
          max={room.max_players}
          theme={classic ? room.theme : null}
        />
      </Board>
    );
  }

  const seconds = round.phase_deadline_at ? secondsUntil(round.phase_deadline_at) : null;

  return (
    <Board
      genre={round.genre}
      host={room.host_twitch_login}
      avatar={room.host_avatar_url}
      controls={controls}
    >
      <div className="tv-live">
        <header className="tv-head">
          <div className="tv-head__bar">
            <span className="tv-head__cell">
              <span className="tv-eyebrow">Room code</span>
              <span className="tv-code">{room.code}</span>
            </span>

            {seconds !== null ? (
              <span className={`tv-timer${seconds <= 10 ? ' tv-timer--urgent' : ''}`}>
                {seconds}
              </span>
            ) : (
              <span className="tv-round">
                {isBracket
                  ? `Round ${room.round_number}`
                  : `Round ${room.round_number} of ${PARTY_ROUNDS}`}
              </span>
            )}
          </div>
        </header>

        <div className="tv-hero">
          <PromptLabel>{classic ? "This game's vibe" : 'Genre prompt'}</PromptLabel>
          <h1 className="tv-genre" data-len={lengthClass(round.genre)}>
            {round.genre}
          </h1>
          <p className="tv-hero__sub">
            {phaseLine(round.phase, seconds, room.host_twitch_login)}
          </p>
        </div>

        {currentMatch && (
          <Matchup
            match={currentMatch}
            nameOf={nameOf}
            winnerId={
              submissions.find((s) => s.id === round.winner_submission_id)?.player_id ??
              currentMatch.winner_player_id
            }
          />
        )}

        {round.phase === 'picking' && (
          <Picking players={players} match={currentMatch} submissions={submissions} />
        )}

        {round.phase === 'playing' && (
          <Playing now={playback.current} total={playback.total} index={playback.index} nameOf={nameOf} />
        )}

        {round.phase === 'judging' && (
          <Ballot
            submissions={submissions}
            counts={ballotCounts}
            chatChannel={room.host_twitch_login}
          />
        )}

        {round.phase === 'revealed' && (
          <Revealed
            winner={submissions.find((s) => s.id === round.winner_submission_id) ?? null}
            nameOf={nameOf}
          />
        )}
      </div>
    </Board>
  );
}

// ---------------------------------------------------------------

/**
 * Stand-in battle for ?demo=1.
 *
 * Only the fields this view reads are filled in, and the assertion is what
 * keeps the sample small: spelling out every column of five tables would mean
 * updating a fake row every time the schema moves.
 */
const DEMO = {
  room: {
    id: 'demo',
    code: 'DEMO1',
    status: 'in_round',
    format: 'bracket',
    min_players: 2,
    max_players: 16,
    round_number: 1,
    current_match_id: 'm1',
    host_player_id: null,
    host_twitch_login: 'yourchannel',
    host_avatar_url: null,
  },
  players: [
    { id: '1', display_name: 'Ashley', is_connected: true },
    { id: '2', display_name: 'Marcus', is_connected: true },
  ],
  matches: [
    {
      id: 'm1',
      bracket_round: 1,
      match_index: 0,
      player_a_id: '1',
      player_b_id: '2',
      winner_player_id: null,
      next_match_id: null,
      status: 'active',
    },
  ],
  round: {
    id: 'r1',
    phase: 'judging',
    genre: 'Feels Like Stranger Things',
    phase_deadline_at: null,
    winner_submission_id: null,
    chat_tally: { s1: 128, s2: 74 },
  },
  submissions: [
    { id: 's1', player_id: '1', song_title: 'Ms. Jackson', song_artist: 'Outkast', artwork_url: null },
    { id: 's2', player_id: '2', song_title: 'Hey Ya!', song_artist: 'Outkast', artwork_url: null },
  ],
  votes: [],
} as unknown as ReturnType<typeof useBattleRoom> & ReturnType<typeof useBattleRound>;

/**
 * Long prompts get a smaller type ramp rather than a clipped one. "Feels Like
 * Stranger Things" and "70's Rock" cannot share a size and both look right.
 */
function lengthClass(genre: string): 'short' | 'medium' | 'long' {
  if (genre.length <= 12) return 'short';
  if (genre.length <= 22) return 'medium';
  return 'long';
}

/**
 * Whether anyone is at the keyboard.
 *
 * The host controls ride on this, so they fade off a board that is being
 * captured and are one mouse twitch away on the one the host is driving.
 */
function usePointerActivity(idleMs = 2500): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let timer = window.setTimeout(() => setActive(false), idleMs);
    const wake = () => {
      setActive(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(false), idleMs);
    };
    window.addEventListener('pointermove', wake);
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [idleMs]);

  return active;
}

function phaseLine(
  phase: BattleRoundPhase,
  seconds: number | null,
  chatChannel: string | null
): string {
  switch (phase) {
    case 'picking':
      return seconds !== null ? `${seconds} seconds left to pick` : 'Pick the song that fits the vibe';
    case 'playing':
      return 'Songs are playing…';
    case 'judging':
      return chatChannel ? 'Chat is voting' : 'The room is voting';
    case 'revealed':
      return 'Winner of the round';
    default:
      return '';
  }
}

function Board({
  children,
  genre,
  host,
  avatar,
  controls,
}: {
  children: React.ReactNode;
  genre: string | null;
  host?: string | null;
  avatar?: string | null;
  controls?: React.ReactNode;
}) {
  return (
    <div className="tv">
      <GenreScene genre={genre} />

      {host && (
        <div className="tv-host">
          {avatar && <img className="tv-host__avatar" src={avatar} alt="" />}
          <span>{host}</span>
        </div>
      )}

      <div className="tv-stage">{children}</div>
      {controls}
    </div>
  );
}

/**
 * The host's controls, on the board itself.
 *
 * Running a stream off two tabs meant clicking back to the room for every
 * reveal, which put the game's own UI on camera for a second each time. The
 * one thing there is to press now sits under the board it belongs to, and
 * fades out whenever the mouse stops so a captured tab shows a clean screen.
 */
function HostBar({
  action,
  busy,
  error,
  visible,
  onRun,
}: {
  action: { label: string; disabled: boolean } | null;
  busy: boolean;
  error: string | null;
  visible: boolean;
  onRun: () => void;
}) {
  return (
    <div className={`tv-controls${visible ? ' tv-controls--on' : ''}`}>
      {error && <span className="tv-controls__error">{error}</span>}

      {action ? (
        <button
          type="button"
          className="tv-controls__go"
          disabled={busy || action.disabled}
          onClick={onRun}
        >
          {busy ? 'Working…' : action.label}
        </button>
      ) : (
        <span className="tv-controls__idle">Nothing to press yet</span>
      )}

      <span className="tv-controls__hint">Only you can see this</span>
    </div>
  );
}

function Lobby({
  code,
  players,
  max,
  theme,
}: {
  code: string;
  players: BattlePlayer[];
  max: number;
  theme: string | null;
}) {
  const locked = players.filter(hasEntry);

  return (
    <div className="tv-lobby">
      <Gloves size={180} />
      <span className="tv-eyebrow">Join at tuneboxed.com</span>
      <div className="tv-lobby__code">{code}</div>
      {theme ? (
        <div className="tv-hero">
          <PromptLabel>This game&rsquo;s vibe</PromptLabel>
          <h1 className="tv-genre" data-len={lengthClass(theme)}>
            {theme}
          </h1>
        </div>
      ) : null}
      <p className="tv-lobby__sub">
        {theme
          ? `${locked.length} of ${max} songs in`
          : `${players.length} of ${max} in the room`}
      </p>

      <div className="tv-chips">
        {players.map((p) => (
          <span key={p.id} className={`tv-chip${hasEntry(p) ? ' tv-chip--on' : ''}`}>
            <Monogram name={p.display_name} size={28} />
            {p.display_name}
            {hasEntry(p) ? ` · ${p.entry_song_title}` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Matchup({
  match,
  nameOf,
  winnerId,
}: {
  match: BattleMatch;
  nameOf: (id: string | null) => string;
  winnerId: string | null | undefined;
}) {
  return (
    <div className="tv-matchup tv-card">
      <Corner
        side="blue"
        name={nameOf(match.player_a_id)}
        won={Boolean(winnerId) && winnerId === match.player_a_id}
        lost={Boolean(winnerId) && winnerId !== match.player_a_id}
      />
      <span className="tv-vs">VS</span>
      <Corner
        side="orange"
        name={nameOf(match.player_b_id)}
        won={Boolean(winnerId) && winnerId === match.player_b_id}
        lost={Boolean(winnerId) && winnerId !== match.player_b_id}
      />
    </div>
  );
}

function Corner({
  side,
  name,
  won,
  lost,
}: {
  side: 'blue' | 'orange';
  name: string;
  won: boolean;
  lost: boolean;
}) {
  return (
    <div className={`tv-corner${won ? ' tv-corner--won' : ''}`}>
      {won && (
        <span className="tv-corner__crown">
          <CrownIcon size={40} />
        </span>
      )}
      <BoxerSprite side={side} size={96} dimmed={lost} />
      <span className="tv-corner__name">{name}</span>
    </div>
  );
}

/**
 * Who still has to pick. Titles are deliberately absent: this is on a stream,
 * and showing a pick before it plays hands the room the answer early.
 */
function Picking({
  players,
  match,
  submissions,
}: {
  players: BattlePlayer[];
  match: BattleMatch | null;
  submissions: BattleSubmission[];
}) {
  const inMatch = match
    ? players.filter((p) => p.id === match.player_a_id || p.id === match.player_b_id)
    : players;
  const locked = new Set(submissions.map((s) => s.player_id));

  return (
    <div className="tv-status">
      {inMatch.map((p) => (
        <span key={p.id} className={`tv-pill${locked.has(p.id) ? ' tv-pill--on' : ''}`}>
          {locked.has(p.id) && <CheckIcon size={22} />}
          {p.display_name} {locked.has(p.id) ? 'locked in' : 'is picking'}
        </span>
      ))}
    </div>
  );
}

/**
 * The track that is sounding right now. Naming it is safe here and useful:
 * the room can already hear it, and a viewer who just tuned in cannot.
 */
function Playing({
  now,
  index,
  total,
  nameOf,
}: {
  now: BattleSubmission | null;
  index: number;
  total: number;
  nameOf: (id: string | null) => string;
}) {
  if (!now) {
    return (
      <div className="tv-status">
        <span className="tv-pill tv-pill--wide">Getting the first track ready…</span>
      </div>
    );
  }

  return (
    <div className="tv-now tv-card">
      {now.artwork_url && <img className="tv-now__art" src={now.artwork_url} alt="" />}
      <div className="tv-now__text">
        <span className="tv-eyebrow">
          Now playing · {Math.min(index + 1, total)} of {total}
        </span>
        <strong className="tv-now__title">{now.song_title}</strong>
        <span className="tv-now__artist">{now.song_artist}</span>
        <span className="tv-now__by">Picked by {nameOf(now.player_id)}</span>
      </div>
    </div>
  );
}

/**
 * The ballot chat votes against.
 *
 * Titles appear here even though picking hides them, because by now everyone
 * has heard both songs and nobody can choose between two bare numbers.
 */
function Ballot({
  submissions,
  counts,
  chatChannel,
}: {
  submissions: BattleSubmission[];
  counts: Record<string, number>;
  chatChannel: string | null;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="tv-ballot">
      {submissions.map((s, i) => {
        const count = counts[s.id] ?? 0;
        const share = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={s.id} className="tv-option">
            <div className="tv-option__bar" style={{ width: `${share}%` }} />
            <span className="tv-option__num">{i + 1}</span>
            <span className="tv-option__text">
              <strong>{s.song_title}</strong>
              <span>{s.song_artist}</span>
            </span>
            <span className="tv-option__count">{count}</span>
          </div>
        );
      })}

      <p className="tv-foot">
        {chatChannel ? (
          <>
            Type <strong>1</strong> or <strong>2</strong> in chat · {total}{' '}
            {total === 1 ? 'vote' : 'votes'}
          </>
        ) : (
          <>
            {total} {total === 1 ? 'vote' : 'votes'} in
          </>
        )}
      </p>
    </div>
  );
}

function Revealed({
  winner,
  nameOf,
}: {
  winner: BattleSubmission | null;
  nameOf: (id: string | null) => string;
}) {
  if (!winner) return <div className="tv-status">No winner recorded</div>;

  return (
    <div className="tv-reveal tv-hero">
      <span className="tv-eyebrow">Takes the round</span>
      <h2 className="tv-reveal__name">{nameOf(winner.player_id)}</h2>
      <p className="tv-reveal__song">
        {winner.song_title} · {winner.song_artist}
      </p>
    </div>
  );
}
