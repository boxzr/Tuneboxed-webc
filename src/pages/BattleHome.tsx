import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BattleEntry from '../battle/BattleEntry';
import logo from '../assets/tuneboxed-battle-logo.png';
import '../battle/battle.css';

/**
 * Standalone entry point for a stream battle. Viewers arrive here from a
 * shared link with the code already in the URL, so the code field is
 * prefilled and they only have to pick a name.
 */
export default function BattleHome() {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    document.title = code ? 'Join a battle | TuneBoxed' : 'Play | TuneBoxed';
  }, [code]);

  return (
    <div className="battle">
      <div className="battle-shell">
        <img className="battle-logo" src={logo} alt="TuneBoxed" />
        <BattleEntry initialCode={code ?? ''} invited={Boolean(code)} />
      </div>
    </div>
  );
}
