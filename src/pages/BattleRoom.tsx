import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import { useBattleRound } from '../battle/useBattleRound';
import { useSyncedPlayback } from '../battle/useSyncedPlayback';
import { secondsUntil, syncClock } from '../battle/clock';
import SongPicker from '../battle/SongPicker';
import type { BattlePlayer, BattleSubmission } from '../types/battle';
import logo from '../tuneboxed-logo.png';
import '../battle/battle.css';

export default function BattleRoom() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const stored = useMemo(() => battle.loadSession(code), [code]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void syncClock();
  }, []);

  useEffect(() => {
    let cancelled = false;
    battle
      .getRoomByCode(code)
      .then((room) => {
        if (cancelled) return;
        if (!room) setLookupError("That room code doesn't exist.");
        else setRoomId(room.id);
      })
      .catch((e) => !cancelled && setLookupError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [code]);

  const { room, players, loading } = useBattleRoom(roomId, stored?.token ?? null);
  const { round, submissions, votes } = useBattleRound(room);

  const me = players.find((p) => p.id === stored?.playerId) ?? null;
  const isHost = Boolean(room && me && room.host_player_id === me.id);
  const token = stored?.token ?? null;

  const phase = round?.phase ?? null;
  const playing = phase === 'playing';
  const playback = useSyncedPlayback(round, submissions, playing);

  useEffect(() => {
    if (!loading && roomId && !stored) navigate(`/join/${code.toUpperCase()}`, { replace: true });
  }, [loading, roomId, stored, code, navigate]);

  const guard = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (lookupError) {
    return (
      <Shell>
        <div className="battle-card">
          <h1 className="battle-h1">Can't open this room</h1>
          <p className="battle-sub">{lookupError}</p>
          <button className="battle-btn" onClick={() => navigate('/battle')}>
            Back
          </button>
        </div>
      </Shell>
    );
  }

  if (loading || !room) {
    return (
      <Shell>
        <div className="battle-card">
          <p className="battle-sub" style={{ margin: 0 }}>
            Loading room…
          </p>
        </div>
      </Shell>
    );
  }

  const connected = players.filter((p) => p.is_connected);
  const joinUrl = `${window.location.origin}/join/${room.code}`;
  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.display_name ?? 'Someone';

  const myVote = votes.find((v) => v.voter_player_id === me?.id) ?? null;
  const mySubmission = submissions.find((s) => s.player_id === me?.id) ?? null;

  return (
    <Shell>
      <RoomHeader
        code={room.code}
        joinUrl={joinUrl}
        copied={copied}
        onCopy={async () => {
          try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setActionError('Could not copy. Select the link and copy it manually.');
          }
        }}
        roundLabel={
          round ? `Round ${round.round_number} · ${round.genre}` : `${connected.length} in the room`
        }
      />

      {/* ---------- Lobby ---------- */}
      {!round && (
        <div className="battle-card">
          <h2 className="battle-h2">Players</h2>
          <Roster players={players} hostId={room.host_player_id} meId={me?.id ?? null} />

          {isHost ? (
            <>
              {connected.length < room.min_players ? (
                <p className="battle-sub" style={{ marginTop: 16, marginBottom: 0 }}>
                  Waiting for {room.min_players - connected.length} more to start.
                </p>
              ) : (
                <button
                  className="battle-btn"
                  disabled={busy}
                  onClick={() =>
                    void guard(async () => {
                      const judgeId = room.voting_mode === 'judge' ? await battle.pickNextJudge(token!) : null;
                      await battle.startRound(token!, {
                        roundNumber: 1,
                        genre: 'Anything goes',
                        judgePlayerId: judgeId,
                        pickSeconds: 90,
                      });
                    })
                  }
                >
                  Start round 1
                </button>
              )}
            </>
          ) : (
            <p className="battle-sub" style={{ marginTop: 16, marginBottom: 0 }}>
              Waiting for {nameOf(room.host_player_id)} to start the battle.
            </p>
          )}
        </div>
      )}

      {/* ---------- Picking ---------- */}
      {phase === 'picking' && (
        <div className="battle-card">
          <PhaseHeading
            title={mySubmission ? 'Locked in' : 'Pick your song'}
            deadline={round?.phase_deadline_at ?? null}
          />

          {mySubmission ? (
            <SubmissionRow submission={mySubmission} subtitle="Your pick" />
          ) : (
            <SongPicker
              disabled={busy}
              onPick={(song) =>
                guard(() =>
                  battle.submitSong(token!, round!.id, {
                    title: song.title,
                    artist: song.artist,
                    artworkUrl: song.artworkUrl,
                    previewUrl: song.previewUrl,
                    externalId: song.externalId,
                    source: 'itunes',
                  })
                )
              }
            />
          )}

          <p className="battle-sub" style={{ marginTop: 16, marginBottom: 0 }}>
            {submissions.length} of {connected.length} locked in.
          </p>

          {isHost && submissions.length >= 2 && (
            <button
              className="battle-btn battle-btn--secondary"
              disabled={busy}
              onClick={() =>
                void guard(() =>
                  battle.startPlayback(
                    token!,
                    round!.id,
                    submissions.map((s) => s.id),
                    30
                  )
                )
              }
            >
              Play the songs now
            </button>
          )}
        </div>
      )}

      {/* ---------- Playing ---------- */}
      {playing && (
        <div className="battle-card">
          <PhaseHeading
            title={`Now playing ${Math.min(playback.index + 1, playback.total)} of ${playback.total}`}
            deadline={round?.phase_deadline_at ?? null}
          />

          {playback.blocked && (
            <button className="battle-btn" onClick={playback.unblock}>
              Tap to hear the battle
            </button>
          )}

          {playback.current ? (
            <SubmissionRow
              submission={playback.current}
              subtitle={`Picked by ${nameOf(playback.current.player_id)}`}
            />
          ) : (
            <p className="battle-sub" style={{ margin: 0 }}>
              Getting the first track ready…
            </p>
          )}
        </div>
      )}

      {/* ---------- Judging ---------- */}
      {phase === 'judging' && (
        <div className="battle-card">
          <PhaseHeading title="Crown a winner" deadline={round?.phase_deadline_at ?? null} />

          <p className="battle-sub">
            {room.voting_mode === 'judge' && `${nameOf(round?.judge_player_id ?? null)} is judging.`}
            {room.voting_mode === 'host' && `${nameOf(room.host_player_id)} is deciding.`}
            {room.voting_mode === 'everyone' && 'Everyone votes, but not for their own song.'}
          </p>

          <ul className="battle-results">
            {submissions.map((s) => {
              const mine = s.player_id === me?.id;
              const chosen = myVote?.submission_id === s.id;
              return (
                <li key={s.id}>
                  <button
                    className={`battle-result${chosen ? ' battle-result--chosen' : ''}`}
                    disabled={busy || mine || Boolean(myVote)}
                    onClick={() => void guard(() => battle.castVote(token!, round!.id, s.id))}
                  >
                    {s.artwork_url ? (
                      <img src={s.artwork_url} alt="" className="battle-art" />
                    ) : (
                      <div className="battle-art battle-art--empty" />
                    )}
                    <span className="battle-result__text">
                      <strong>{s.song_title}</strong>
                      <span>
                        {s.song_artist} · {nameOf(s.player_id)}
                      </span>
                    </span>
                    <span className="battle-result__cta">
                      {chosen ? 'Crowned' : mine ? 'Yours' : 'Crown'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="battle-sub" style={{ marginTop: 16, marginBottom: 0 }}>
            {votes.length} {votes.length === 1 ? 'vote' : 'votes'} in.
          </p>

          {isHost && votes.length > 0 && (
            <button
              className="battle-btn"
              disabled={busy}
              onClick={() =>
                void guard(async () => {
                  const winner = await battle.tallyVotes(round!.id);
                  if (winner) await battle.setRoundWinner(token!, round!.id, winner);
                })
              }
            >
              Reveal the winner
            </button>
          )}
        </div>
      )}

      {/* ---------- Revealed ---------- */}
      {phase === 'revealed' && (
        <div className="battle-card">
          <h2 className="battle-h2">Round {round?.round_number} winner</h2>
          {(() => {
            const winner = submissions.find((s) => s.id === round?.winner_submission_id);
            return winner ? (
              <SubmissionRow
                submission={winner}
                subtitle={`${nameOf(winner.player_id)} takes the crown`}
              />
            ) : (
              <p className="battle-sub" style={{ margin: 0 }}>
                No winner recorded for this round.
              </p>
            );
          })()}

          {isHost && (
            <button
              className="battle-btn"
              disabled={busy}
              onClick={() =>
                void guard(async () => {
                  const next = (round?.round_number ?? 0) + 1;
                  const judgeId =
                    room.voting_mode === 'judge' ? await battle.pickNextJudge(token!) : null;
                  await battle.startRound(token!, {
                    roundNumber: next,
                    genre: 'Anything goes',
                    judgePlayerId: judgeId,
                    pickSeconds: 90,
                  });
                })
              }
            >
              Next round
            </button>
          )}
        </div>
      )}

      <div className="battle-card">
        <Roster players={players} hostId={room.host_player_id} meId={me?.id ?? null} compact />
        <button
          className="battle-btn battle-btn--secondary"
          onClick={() =>
            void guard(async () => {
              if (token) await battle.leaveRoom(token).catch(() => {});
              battle.clearSession(code);
              navigate('/battle');
            })
          }
        >
          Leave room
        </button>
      </div>

      {actionError && <div className="battle-error">{actionError}</div>}
    </Shell>
  );
}

// ---------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="battle">
      <div className="battle-shell">
        <img className="battle-logo" src={logo} alt="TuneBoxed" />
        {children}
      </div>
    </div>
  );
}

function RoomHeader({
  code,
  joinUrl,
  copied,
  onCopy,
  roundLabel,
}: {
  code: string;
  joinUrl: string;
  copied: boolean;
  onCopy: () => void;
  roundLabel: string;
}) {
  return (
    <div className="battle-card">
      <div className="battle-code-display">
        <span className="battle-label">Room code</span>
        <div className="battle-code-display__code">{code}</div>
        <button className="battle-btn battle-btn--secondary" style={{ marginTop: 0 }} onClick={onCopy}>
          {copied ? 'Link copied' : 'Copy join link'}
        </button>
      </div>
      <p className="battle-sub" style={{ margin: '16px 0 0', textAlign: 'center' }}>
        {roundLabel}
      </p>
      <p className="battle-sub" style={{ margin: '4px 0 0', textAlign: 'center', fontSize: '0.8rem' }}>
        {joinUrl}
      </p>
    </div>
  );
}

function PhaseHeading({ title, deadline }: { title: string; deadline: string | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

  const left = secondsUntil(deadline);

  return (
    <div className="battle-phase">
      <h2 className="battle-h2" style={{ margin: 0 }}>
        {title}
      </h2>
      {deadline && <span className="battle-timer">{left}s</span>}
    </div>
  );
}

function SubmissionRow({
  submission,
  subtitle,
}: {
  submission: BattleSubmission;
  subtitle: string;
}) {
  return (
    <div className="battle-result battle-result--static">
      {submission.artwork_url ? (
        <img src={submission.artwork_url} alt="" className="battle-art" />
      ) : (
        <div className="battle-art battle-art--empty" />
      )}
      <span className="battle-result__text">
        <strong>{submission.song_title}</strong>
        <span>
          {submission.song_artist} · {subtitle}
        </span>
      </span>
    </div>
  );
}

function Roster({
  players,
  hostId,
  meId,
  compact,
}: {
  players: BattlePlayer[];
  hostId: string | null;
  meId: string | null;
  compact?: boolean;
}) {
  return (
    <ul className="battle-roster">
      {players.map((p) => (
        <li key={p.id}>
          <span className={`battle-dot${p.is_connected ? '' : ' battle-dot--away'}`} />
          <span className="battle-name">{p.display_name}</span>
          {hostId === p.id && <span className="battle-tag">Host</span>}
          {p.id === meId && hostId !== p.id && !compact && (
            <span className="battle-tag" style={{ background: 'var(--ink-soft)' }}>
              You
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
