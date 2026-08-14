import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { supabaseConfigured } from '../lib/supabase';

type Props = {
  /** Prefilled when a viewer follows a share link that already names the room. */
  initialCode?: string;
  /**
   * A viewer who arrived from a share link is being invited into one specific
   * room, so the copy commits to that rather than offering to host.
   */
  invited?: boolean;
  /**
   * The home page hero already makes the pitch above the card, so it turns
   * this off rather than saying the same thing twice.
   */
  showIntro?: boolean;
};

/**
 * The create-or-join card. Lives apart from the page around it because it is
 * the hero of the marketing home page as well as the whole of /battle, and
 * those two want different framing above it.
 */
export default function BattleEntry({
  initialCode = '',
  invited = false,
  showIntro = true,
}: Props) {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode.toUpperCase());
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
      <div className="battle-card">
        <h1 className="battle-h1">Not configured yet</h1>
        <p className="battle-sub">
          Battle Mode needs Supabase credentials. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, fill in the project URL and anon key, then restart the dev
          server.
        </p>
      </div>
    );
  }

  const nameOk = name.trim().length > 0;

  return (
    <div className="battle-card">
      {showIntro && (
        <>
          <h1 className="battle-h1">{invited ? 'Join the battle' : 'Song battles, live'}</h1>
          <p className="battle-sub">
            {invited
              ? 'Pick a name your chat will recognise and jump in. No app, no account.'
              : 'Host a battle for your stream, or drop in with a room code.'}
          </p>
        </>
      )}

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
  );
}
