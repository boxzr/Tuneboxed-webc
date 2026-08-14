import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import logo from '../tuneboxed-logo.png';
import '../battle/battle.css';

export default function BattleLobby() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const stored = useMemo(() => battle.loadSession(code), [code]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The URL carries the code; the room id has to be resolved from it before
  // the realtime subscription can be set up.
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

  const { room, players, loading, error } = useBattleRoom(roomId, stored?.token ?? null);

  const me = players.find((p) => p.id === stored?.playerId) ?? null;
  const isHost = Boolean(room && me && room.host_player_id === me.id);
  const connected = players.filter((p) => p.is_connected);
  const joinUrl = `${window.location.origin}/join/${code.toUpperCase()}`;

  // Someone who has never joined this room has no token, so send them
  // through the join screen rather than showing a lobby they are not in.
  useEffect(() => {
    if (!loading && roomId && !stored) navigate(`/join/${code.toUpperCase()}`, { replace: true });
  }, [loading, roomId, stored, code, navigate]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setActionError('Could not copy. Select the link and copy it manually.');
    }
  };

  const leave = async () => {
    if (stored) await battle.leaveRoom(stored.token).catch(() => {});
    battle.clearSession(code);
    navigate('/battle');
  };

  if (lookupError) {
    return (
      <Shell>
        <div className="battle-card">
          <h1 className="battle-h1">Room not found</h1>
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

  return (
    <Shell>
      <div className="battle-card">
        <div className="battle-code-display">
          <span className="battle-label">Room code</span>
          <div className="battle-code-display__code">{room.code}</div>
          <button className="battle-btn battle-btn--secondary" style={{ marginTop: 0 }} onClick={() => void copyLink()}>
            {copied ? 'Link copied' : 'Copy join link'}
          </button>
        </div>

        {isHost && (
          <p className="battle-sub" style={{ marginTop: 16, marginBottom: 0 }}>
            Put the code on stream. Viewers join at <strong>{joinUrl}</strong> with no app and no
            account.
          </p>
        )}
      </div>

      <div className="battle-card">
        <h2 className="battle-h1" style={{ fontSize: '1.15rem' }}>
          Players
          <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>
            {' '}
            {connected.length}/{room.max_players}
          </span>
        </h2>

        <ul className="battle-roster">
          {players.map((p) => (
            <li key={p.id}>
              <span className={`battle-dot${p.is_connected ? '' : ' battle-dot--away'}`} />
              <span className="battle-name">{p.display_name}</span>
              {room.host_player_id === p.id && <span className="battle-tag">Host</span>}
              {p.id === me?.id && room.host_player_id !== p.id && (
                <span className="battle-tag" style={{ background: 'var(--ink-soft)' }}>
                  You
                </span>
              )}
            </li>
          ))}
        </ul>

        {connected.length < room.min_players && (
          <p className="battle-sub" style={{ marginTop: 16, marginBottom: 0 }}>
            Waiting for {room.min_players - connected.length} more{' '}
            {room.min_players - connected.length === 1 ? 'player' : 'players'} to start.
          </p>
        )}
      </div>

      <div className="battle-card">
        <div className="battle-notice">
          The round and bracket screens are still being built. Everything up to here is live:
          creating a room, sharing the link, and viewers joining from a browser.
        </div>
        <button className="battle-btn battle-btn--secondary" onClick={() => void leave()}>
          Leave room
        </button>
      </div>

      {(error || actionError) && <div className="battle-error">{error ?? actionError}</div>}
    </Shell>
  );
}

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
