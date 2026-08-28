import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BattleEntry from '../battle/BattleEntry';
import * as battle from '../lib/battleClient';
import logo from '../assets/tuneboxed-battle-logo.png';
import '../battle/battle.css';

/**
 * Standalone entry point for a stream battle. Viewers arrive here from a
 * shared link with the code already in the URL, so the code field is
 * prefilled and they only have to pick a name.
 */
export default function BattleHome() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = code ? 'Join a battle | TuneBoxed' : 'Play | TuneBoxed';
  }, [code]);

  /*
   * Somebody who is already in this room gets taken back to it.
   *
   * Reopening the invite link is how most people come back after closing the
   * tab, and asking them for a name at that point put them behind their own
   * seat: the name was taken, by them. Checking the stored session first
   * turns the link into a way back in rather than a locked door.
   */
  const [checking, setChecking] = useState(Boolean(code));
  useEffect(() => {
    if (!code) return;
    let live = true;
    void battle.resumeRoom(code).then((ok) => {
      if (!live) return;
      if (ok) navigate(`/battle/${code.toUpperCase()}`, { replace: true });
      else setChecking(false);
    });
    return () => {
      live = false;
    };
  }, [code, navigate]);

  return (
    <div className="battle">
      <div className="battle-shell">
        <img className="battle-logo" src={logo} alt="TuneBoxed" />
        {checking ? (
          <div className="battle-card">
            <p className="battle-sub" style={{ margin: 0 }}>
              Looking for your seat…
            </p>
          </div>
        ) : (
          <BattleEntry initialCode={code ?? ''} invited={Boolean(code)} />
        )}
      </div>
    </div>
  );
}
