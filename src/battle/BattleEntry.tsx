import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { supabaseConfigured } from '../lib/supabase';
import { signInWithTwitch, signOut, useTwitchIdentity } from '../lib/twitchAuth';

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
  const { identity } = useTwitchIdentity();

  /**
   * Hosting is the default because that is who arrives here by typing the
   * address. Viewers almost always come through a share link, which sets
   * `invited` and puts the code in for them, so asking everyone for a code up
   * front only ever blocked the person who does not have one yet.
   */
  const [mode, setMode] = useState<'host' | 'join'>(invited ? 'join' : 'host');
  const codeRef = useRef<HTMLInputElement>(null);

  // Choosing to join is a request to type a code, so the cursor goes there
  // rather than making them reach for the field they just asked for. Skipped
  // when invited, where the code is already filled in and the name is blank.
  useEffect(() => {
    if (mode === 'join' && !invited) codeRef.current?.focus();
  }, [mode, invited]);

  // Signing in fills the name in, but does not pin it. A streamer may want to
  // appear under something other than their channel name, so this only writes
  // into an empty field and never overwrites what they typed.
  useEffect(() => {
    if (identity) setName((current) => current || identity.displayName);
  }, [identity]);

  const run = async (kind: 'join' | 'create') => {
    setError(null);
    setBusy(kind);
    try {
      const session =
        kind === 'create'
          ? await battle.createRoom({
              displayName: name.trim(),
              // Web rooms are always brackets. Head to head means chat only
              // ever picks between two songs, which is what makes voting by
              // typing a number work.
              format: 'bracket',
              twitchLogin: identity?.login ?? null,
              twitchAvatarUrl: identity?.avatarUrl ?? null,
            })
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
          <h1 className="battle-h1">
            {invited ? 'Join the battle' : 'The Kahoot of song battles'}
          </h1>
          <p className="battle-sub">
            {invited
              ? 'Pick a name the room will recognise and jump in. No app, no account.'
              : 'Start a bracket for your room, or drop in with a code.'}
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

      {mode === 'join' && (
        <div className="battle-field">
          <label className="battle-label" htmlFor="battle-code">
            Room code
          </label>
          <input
            id="battle-code"
            ref={codeRef}
            className="battle-input battle-input--code"
            value={code}
            maxLength={5}
            placeholder="ABCDE"
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
      )}

      {mode === 'host' ? (
        <button
          className="battle-btn"
          disabled={!nameOk || busy !== null}
          onClick={() => void run('create')}
        >
          {busy === 'create' ? 'Creating…' : 'Host a battle'}
        </button>
      ) : (
        <button
          className="battle-btn"
          disabled={!nameOk || code.trim().length !== 5 || busy !== null}
          onClick={() => void run('join')}
        >
          {busy === 'join' ? 'Joining…' : 'Join battle'}
        </button>
      )}

      {/* A viewer who followed a share link is being let into one room, so
          offering to host would only lead them away from it. */}
      {!invited && (
        <button
          className="battle-switch"
          disabled={busy !== null}
          onClick={() => {
            setError(null);
            setMode((m) => (m === 'host' ? 'join' : 'host'));
          }}
        >
          {mode === 'host' ? 'Have a code? Join a room' : 'Host a battle instead'}
        </button>
      )}

      {/* Only offered to hosts. A viewer following a share link has no use for
          it, and asking them to authorise an app to join a game would cost
          more of them than it gains. */}
      {!invited &&
        (identity ? (
          <div className="battle-twitch battle-twitch--on">
            {identity.avatarUrl && (
              <img className="battle-twitch-avatar" src={identity.avatarUrl} alt="" />
            )}
            <span className="battle-twitch-name">{identity.login}</span>
            <button className="battle-twitch-signout" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <button
              className="battle-twitch-btn"
              onClick={() => void signInWithTwitch().catch((e) => setError(e.message))}
            >
              Sign in with Twitch
            </button>
            {/* Without this the button reads as a requirement, and most people
                hosting a battle are not streaming it. */}
            <p className="battle-twitch-hint">
              Optional. Lets your chat vote by typing in Twitch.
            </p>
          </>
        ))}

      {error && <div className="battle-error">{error}</div>}
    </div>
  );
}
