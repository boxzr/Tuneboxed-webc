import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import { useBattleRound } from '../battle/useBattleRound';
import { secondsUntil, syncClock } from '../battle/clock';
import { BoxerSprite, Gloves, Monogram } from '../battle/ui/primitives';
import { CheckIcon, CrownIcon, TrophyIcon } from '../battle/ui/icons';
import type { BattleMatch, BattlePlayer, BattleSubmission } from '../types/battle';
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
 * It takes no session token and calls no mutation, so putting it on a stream
 * cannot occupy a player slot or cast a vote.
 */
export default function BattleTV() {
  const { code = '' } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const demo = params.get('demo') === '1';

  const [roomId, setRoomId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

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

  const liveRoom = useBattleRoom(roomId, null);
  const liveRound = useBattleRound(liveRoom.room);

  // ?demo=1 renders a sample battle. Sizing and positioning a board has to
  // happen before going live, and an empty lobby gives nobody anything to aim
  // at. Judging with chat votes is the busiest the board ever gets, so that is
  // the state worth checking against.
  const { room, players, matches } = demo ? DEMO : liveRoom;
  const { round, submissions, votes } = demo ? DEMO : liveRound;

  if (missing) {
    return (
      <Board>
        <div className="tv-idle">
          <Gloves size={220} />
          <h1 className="tv-idle__title">No room with that code</h1>
        </div>
      </Board>
    );
  }

  if (!room) {
    return (
      <Board>
        <div className="tv-idle">
          <Gloves size={220} />
          <h1 className="tv-idle__title">Connecting…</h1>
        </div>
      </Board>
    );
  }

  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.display_name ?? 'Player';

  const championId =
    matches.find((m) => m.next_match_id === null && m.winner_player_id)?.winner_player_id ?? null;

  if (championId) {
    return (
      <Board>
        <div className="tv-champion">
          <span className="tv-champion__trophy">
            <TrophyIcon size={96} />
          </span>
          <span className="tv-eyebrow">Champion</span>
          <h1 className="tv-champion__name">{nameOf(championId)}</h1>
          <p className="tv-champion__sub">Winner of the whole bracket</p>
        </div>
      </Board>
    );
  }

  if (!round) {
    return (
      <Board host={room.host_twitch_login} avatar={room.host_avatar_url}>
        <Lobby code={room.code} players={players} max={room.max_players} />
      </Board>
    );
  }

  const currentMatch = matches.find((m) => m.id === room.current_match_id) ?? null;
  const seconds = round.phase_deadline_at ? secondsUntil(round.phase_deadline_at) : null;

  return (
    <Board host={room.host_twitch_login} avatar={room.host_avatar_url}>
      <div className="tv-live">
        <header className="tv-head">
          <div className="tv-head__left">
            <span className="tv-eyebrow">Room code</span>
            <span className="tv-code">{room.code}</span>
          </div>

          <div className="tv-head__mid">
            <span className="tv-eyebrow">This round&rsquo;s vibe</span>
            <h1 className="tv-genre">{round.genre}</h1>
          </div>

          <div className="tv-head__right">
            {seconds !== null && (
              <span className={`tv-timer${seconds <= 10 ? ' tv-timer--urgent' : ''}`}>
                {seconds}
              </span>
            )}
          </div>
        </header>

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

        {round.phase === 'playing' && <Playing submissions={submissions} nameOf={nameOf} />}

        {round.phase === 'judging' && (
          <Ballot
            submissions={submissions}
            tally={round.chat_tally ?? {}}
            inRoomVotes={votes.length}
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
    max_players: 16,
    current_match_id: 'm1',
    host_twitch_login: 'yourchannel',
    host_avatar_url: null,
  },
  players: [
    { id: '1', display_name: 'Ashley' },
    { id: '2', display_name: 'Marcus' },
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
    genre: 'Divorced Dad Rock',
    phase_deadline_at: null,
    winner_submission_id: null,
    chat_tally: { s1: 128, s2: 74 },
  },
  submissions: [
    { id: 's1', player_id: '1', song_title: 'Ms. Jackson', song_artist: 'Outkast' },
    { id: 's2', player_id: '2', song_title: 'Hey Ya!', song_artist: 'Outkast' },
  ],
  votes: [],
} as unknown as ReturnType<typeof useBattleRoom> & ReturnType<typeof useBattleRound>;

function Board({
  children,
  host,
  avatar,
}: {
  children: React.ReactNode;
  host?: string | null;
  avatar?: string | null;
}) {
  return (
    <div className="tv">
      {host && (
        <div className="tv-host">
          {avatar && <img className="tv-host__avatar" src={avatar} alt="" />}
          <span>{host}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function Lobby({
  code,
  players,
  max,
}: {
  code: string;
  players: BattlePlayer[];
  max: number;
}) {
  return (
    <div className="tv-lobby">
      <Gloves size={180} />
      <span className="tv-eyebrow">Join at tuneboxed.com</span>
      <div className="tv-lobby__code">{code}</div>
      <p className="tv-lobby__sub">
        {players.length} of {max} in the room
      </p>

      <div className="tv-chips">
        {players.map((p) => (
          <span key={p.id} className="tv-chip">
            <Monogram name={p.display_name} size={28} />
            {p.display_name}
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
    <div className="tv-matchup">
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
      <BoxerSprite side={side} size={190} dimmed={lost} />
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

function Playing({
  submissions,
  nameOf,
}: {
  submissions: BattleSubmission[];
  nameOf: (id: string | null) => string;
}) {
  return (
    <div className="tv-status">
      <span className="tv-pill tv-pill--wide">Both tracks are playing</span>
      <div className="tv-tracks">
        {submissions.map((s) => (
          <span key={s.id} className="tv-track">
            {nameOf(s.player_id)}
          </span>
        ))}
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
  tally,
  inRoomVotes,
  chatChannel,
}: {
  submissions: BattleSubmission[];
  tally: Record<string, number>;
  inRoomVotes: number;
  chatChannel: string | null;
}) {
  const total = Object.values(tally).reduce((a, b) => a + b, 0);

  return (
    <div className="tv-ballot">
      {submissions.map((s, i) => {
        const count = tally[s.id] ?? 0;
        const share = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={s.id} className="tv-option">
            <div className="tv-option__bar" style={{ width: `${share}%` }} />
            <span className="tv-option__num">{i + 1}</span>
            <span className="tv-option__text">
              <strong>{s.song_title}</strong>
              <span>{s.song_artist}</span>
            </span>
            {chatChannel && <span className="tv-option__count">{count}</span>}
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
            {inRoomVotes} {inRoomVotes === 1 ? 'vote' : 'votes'} in
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
    <div className="tv-reveal">
      <span className="tv-eyebrow">Takes the round</span>
      <h2 className="tv-reveal__name">{nameOf(winner.player_id)}</h2>
      <p className="tv-reveal__song">
        {winner.song_title} · {winner.song_artist}
      </p>
    </div>
  );
}
