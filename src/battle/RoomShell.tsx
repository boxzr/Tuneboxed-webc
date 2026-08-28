import { useState, type ReactNode } from 'react';
import logo from '../assets/tuneboxed-battle-logo.png';
import { CopyIcon } from './ui/icons';

/** The canvas and single column every battle screen sits in. */
export default function RoomShell({ children }: { children: ReactNode }) {
  return (
    <div className="battle bt-room">
      <div className="bt-room__col">{children}</div>
    </div>
  );
}

/**
 * The room's identity, which changes shape once play starts.
 *
 * In the lobby the code is the whole point, because the host is reading it out
 * and viewers are typing it in, so it gets the full treatment. Once a match is
 * running nobody needs it at that size and the screen is better spent on the
 * game, so it collapses to a chip.
 */
export function RoomHeader({
  code,
  stage,
  compact,
}: {
  code: string;
  stage: string;
  compact: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join/${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard can be blocked; the link is on screen to copy by hand */
    }
  };

  if (compact) {
    return (
      <div className="bt-topbar">
        <img className="bt-topbar__logo" src={logo} alt="TuneBoxed" />
        <span className="bt-topbar__code">{code}</span>
        <span className="bt-topbar__stage">{stage}</span>
      </div>
    );
  }

  return (
    <div className="bt-idcard">
      <img className="bt-idcard__logo" src={logo} alt="TuneBoxed" />
      <span className="bt-eyebrow bt-eyebrow--muted">Room code</span>
      <div className="bt-idcard__code">{code}</div>
      <button className="bt-copy" onClick={() => void copy()}>
        <CopyIcon size={15} />
        {copied ? 'Link copied' : 'Copy join link'}
      </button>
      <p className="bt-idcard__stage">{stage}</p>
    </div>
  );
}
