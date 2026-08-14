import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { supabaseConfigured } from '../lib/supabase';
import logo from '../tuneboxed-logo.png';
import '../battle/battle.css';

/**
 * Entry point for both sides of a stream battle. Viewers arrive here from a
 * shared link with the code already in the URL, so the code field is
 * prefilled and they only have to pick a name.
 */
export default function BattleHome() {
  const navigate = useNavigate();
  const { code: codeFromUrl } = useParams<{ code: string }>();

  const [name, setName] = useState('');
  const [code, setCode] = useState((codeFromUrl ?? '').toUpperCase());
  const [busy, setBusy] = useState<'join' | 'create' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'join' | 'create') => {
    setError(null);
    setBusy(kind);
    try {
      const session =
        kind === 'create'
          ? await battle.createRoom({ displayName: name.trim() })
          : await battle.joinRoom(code.trim(), name.trim());
      navigate(`/battle/${session.room.code}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!supabaseConfigured) {
    return (
      <div className="battle">
        <div className="battle-shell">
          <div className="battle-card">
            <h1 className="battle-h1">Not configured yet</h1>
            <p className="battle-sub">
              Battle Mode needs Supabase credentials. Copy <code>.env.example</code> to{' '}
              <code>.env.local</code>, fill in the project URL and anon key, then restart the dev
              server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nameOk = name.trim().length > 0;

  return (
    <div className="battle">
      <div className="battle-shell">
        <img className="battle-logo" src={logo} alt="TuneBoxed" />

        <div className="battle-card">
          <h1 className="battle-h1">{codeFromUrl ? 'Join the battle' : 'Song battles, live'}</h1>
          <p className="battle-sub">
            {codeFromUrl
              ? 'Pick a name your chat will recognise and jump in. No app, no account.'
              : 'Host a battle for your stream, or drop in with a room code.'}
          </p>

          <div className="battle-field">
            <label className="battle-label" htmlFor="battle-name">
              Your name
            </label>
            <input
              id="battle-name"
              className="battle-input"
              value={name}
              maxLength={24}
              placeholder="e.g. ninja"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="battle-field">
            <label className="battle-label" htmlFor="battle-code">
              Room code
            </label>
            <input
              id="battle-code"
              className="battle-input battle-input--code"
              value={code}
              maxLength={5}
              placeholder="ABCDE"
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>

          <button
            className="battle-btn"
            disabled={!nameOk || code.trim().length !== 5 || busy !== null}
            onClick={() => void run('join')}
          >
            {busy === 'join' ? 'Joining…' : 'Join battle'}
          </button>

          <div className="battle-divider">or</div>

          <button
            className="battle-btn battle-btn--secondary"
            style={{ marginTop: 0 }}
            disabled={!nameOk || busy !== null}
            onClick={() => void run('create')}
          >
            {busy === 'create' ? 'Creating…' : 'Host a battle'}
          </button>

          {error && <div className="battle-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
