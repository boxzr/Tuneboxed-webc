import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import { useBattleRound } from '../battle/useBattleRound';
import { secondsUntil, syncClock } from '../battle/clock';
import type {
  BattlePlayer,
  BattleRound,
  BattleSubmission,
  BattleVote,
  BattleRoom as BattleRoomType,
} from '../types/battle';
import '../battle/overlay.css';

/**
 * Read-only scoreboard for an OBS Browser Source, the web counterpart to the
 * app's BattleTVView on an AirPlay screen.
 *
 * Nothing here joins the room. It takes no session token and calls no
 * mutation, so adding it in OBS cannot occupy a player slot or vote, and the
 * streamer plays from their normal browser tab alongside it.
 *
 * Background is transparent by default so it composites over gameplay. Pass
 * ?bg=dark for a solid panel, which is what a full-screen scene wants.
 */
export default function BattleOverlay() {
  const { code } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const solid = params.get('bg') === 'dark';
  const demo = params.get('demo') === '1';

  const [roomId, setRoomId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  // Loads on its own inside OBS rather than through the room page, so it has
  // to sync its own clock or the timer would run against the local one.
  useEffect(() => {
    void syncClock();
  }, []);

  // App.css paints an opaque background on body, which OBS would render as a
  // white rectangle over the whole stream instead of compositing. The class
  // goes on the document rather than in overlay.css directly because Vite
  // bundles every stylesheet together, so an unscoped rule here would strip
  // the background off the marketing site too.
  useEffect(() => {
    document.documentElement.classList.add('ov-active');
    return () => document.documentElement.classList.remove('ov-active');
  }, []);

  // Re-render on a tick so the countdown moves. OBS renders this offscreen,
  // where requestAnimationFrame is throttled, so an interval is the reliable
  // way to keep a visible second hand.
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

  const live = useBattleRoom(roomId, null);
  const liveRound = useBattleRound(live.room);

  // Sample data on ?demo=1. A streamer has to size and position the source in
  // OBS before going live, and an empty room gives them nothing to aim at.
  const { room, players } = demo ? DEMO : live;
  const { round, submissions, votes } = demo ? DEMO : liveRound;
  const remaining = demo
    ? 24
    : round?.phase_deadline_at
      ? secondsUntil(round.phase_deadline_at)
      : null;

  // OBS keeps the page loaded between scenes, so a room that ends should not
  // leave a stale final score sitting in the corner of the stream.
  if (!demo && (missing || (room && room.status === 'complete' && !round))) {
    return <div className={shellClass(solid)} />;
  }

  if (!room) {
    return (
      <div className={shellClass(solid)}>
        <div className="ov-card ov-card--waiting">
          <span className="ov-code-label">Connecting</span>
        </div>
      </div>
    );
  }

  const lockedIn = new Set(submissions.map((s) => s.player_id));
  const inLobby = room.status === 'lobby' || !round;

  return (
    <div className={shellClass(solid)}>
      <div className="ov-card">
        <header className="ov-head">
          {room.host_avatar_url && (
            <img className="ov-avatar" src={room.host_avatar_url} alt="" />
          )}
          <div className="ov-head-text">
            {room.host_twitch_login && (
              <div className="ov-host">{room.host_twitch_login}</div>
            )}
            <div className="ov-title">{inLobby ? 'Waiting for players' : round?.genre}</div>
          </div>
          {!inLobby && remaining !== null && (
            <div className={`ov-timer${remaining <= 10 ? ' ov-timer--urgent' : ''}`}>
              {remaining}
            </div>
          )}
        </header>

        {inLobby ? (
          <Lobby code={room.code} players={players} />
        ) : (
          <Roster
            players={players}
            lockedIn={lockedIn}
            phase={round!.phase}
            submissions={submissions}
            voteCount={votes.length}
          />
        )}
      </div>
    </div>
  );
}

const shellClass = (solid: boolean) => `ov${solid ? ' ov--solid' : ''}`;

/**
 * Stand-in room for ?demo=1. Only the fields this view reads are filled in,
 * cast rather than fully constructed so the shape of the tables can change
 * without dragging a fake row along behind them.
 */
const DEMO: {
  room: BattleRoomType;
  players: BattlePlayer[];
  round: BattleRound;
  submissions: BattleSubmission[];
  votes: BattleVote[];
} = {
  room: {
    code: 'DEMO1',
    status: 'in_round',
    host_twitch_login: 'yourchannel',
    host_avatar_url: null,
  },
  players: [
    { id: '1', display_name: 'Ashley' },
    { id: '2', display_name: 'Marcus' },
    { id: '3', display_name: 'Priya' },
    { id: '4', display_name: 'Dev' },
  ],
  round: { phase: 'picking', genre: '2000s Hip-Hop', phase_deadline_at: null },
  submissions: [{ player_id: '1' }, { player_id: '3' }],
  votes: [],
  // Only the fields this view reads are present, so the assertion is what
  // lets the sample stay small instead of tracking every column.
} as unknown as {
  room: BattleRoomType;
  players: BattlePlayer[];
  round: BattleRound;
  submissions: BattleSubmission[];
  votes: BattleVote[];
};

function Lobby({ code, players }: { code: string; players: BattlePlayer[] }) {
  return (
    <>
      <div className="ov-join">
        <span className="ov-code-label">Join at tuneboxed.com</span>
        <span className="ov-code">{code}</span>
      </div>
      <div className="ov-players">
        {players.map((p) => (
          <span key={p.id} className="ov-chip">
            {p.display_name}
          </span>
        ))}
      </div>
    </>
  );
}

function Roster({
  players,
  lockedIn,
  phase,
  submissions,
  voteCount,
}: {
  players: BattlePlayer[];
  lockedIn: Set<string>;
  phase: string;
  submissions: BattleSubmission[];
  voteCount: number;
}) {
  // Titles stay hidden until the reveal. The overlay is on stream, so showing
  // them during picking or voting would leak every pick to the whole chat.
  const revealed = phase === 'revealed';
  const byPlayer = new Map(submissions.map((s) => [s.player_id, s]));

  return (
    <>
      <div className="ov-rows">
        {players.map((p) => {
          const sub = byPlayer.get(p.id);
          return (
            <div key={p.id} className="ov-row">
              <span className={`ov-dot${lockedIn.has(p.id) ? ' ov-dot--on' : ''}`} />
              <span className="ov-name">{p.display_name}</span>
              {revealed && sub ? (
                <span className="ov-song">
                  {sub.song_title}
                  <span className="ov-artist"> · {sub.song_artist}</span>
                </span>
              ) : (
                <span className="ov-state">{lockedIn.has(p.id) ? 'Locked in' : 'Picking'}</span>
              )}
            </div>
          );
        })}
      </div>
      {phase === 'judging' && (
        <footer className="ov-foot">
          {voteCount} {voteCount === 1 ? 'vote' : 'votes'} in
        </footer>
      )}
    </>
  );
}
