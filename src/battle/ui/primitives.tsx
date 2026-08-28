import type { ReactNode } from 'react';
import gloves from '../../assets/battle-gloves.png';
import boxerBlue from '../../assets/boxer-blue.png';
import boxerOrange from '../../assets/boxer-orange.png';

/**
 * The building blocks of the battle UI, ported from BattleUIComponents.swift.
 *
 * These exist so the room and the TV board cannot drift apart, and so neither
 * can drift from the app. Anywhere the web needs a card, a call to action or a
 * countdown, it comes from here rather than from a one-off class.
 */

// ---------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------

export function Card({
  children,
  className = '',
  tone,
}: {
  children: ReactNode;
  className?: string;
  /** Tints the whole card, used for spectator and locked-in states. */
  tone?: 'orange' | 'blue' | 'green';
}) {
  return (
    <div className={`tb-card bt-card${tone ? ` bt-card--${tone}` : ''} ${className}`}>
      {children}
    </div>
  );
}

/**
 * The tracked-out uppercase label above a section. The app leans on these
 * heavily and they are most of what makes a screen read as organised rather
 * than as a stack of paragraphs.
 */
export function SectionLabel({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'orange' | 'blue';
}) {
  return <span className={`bt-eyebrow bt-eyebrow--${tone}`}>{children}</span>;
}

/** The genre prompt header: sparkle, tracked label, sparkle. */
export function PromptLabel({ children }: { children: ReactNode }) {
  return (
    <div className="bt-prompt-label">
      <Sparkle />
      <span>{children}</span>
      <Sparkle />
    </div>
  );
}

function Sparkle() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l1.65 5.85L19.5 10l-5.85 1.65L12 17.5l-1.65-5.85L4.5 10l5.85-1.65L12 2.5Z" />
    </svg>
  );
}

// ---------------------------------------------------------------
// Controls
// ---------------------------------------------------------------

export function VividButton({
  children,
  onClick,
  disabled,
  tone = 'orange',
  variant = 'filled',
  icon,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'orange' | 'blue';
  variant?: 'filled' | 'outline';
  icon?: ReactNode;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`bt-btn bt-btn--${variant} bt-btn--${tone}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="bt-btn__icon">{icon}</span>}
      {children}
    </button>
  );
}

/** Quiet text button for the secondary road out of a screen. */
export function TextButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="bt-textbtn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------
// Mascots
// ---------------------------------------------------------------

/** Gloves touching. Branding for the lobby, the entry card and the TV board. */
export function Gloves({ size = 132, className = '' }: { size?: number; className?: string }) {
  return <img className={`bt-gloves ${className}`} src={gloves} alt="" style={{ width: size }} />;
}

/**
 * A boxer squaring up. The idle bob is what stops a bracket matchup from
 * looking like two stickers pasted either side of a badge; the two sides use
 * slightly different periods so they never bob in lockstep.
 */
export function BoxerSprite({
  side,
  size = 84,
  dimmed,
}: {
  side: 'blue' | 'orange';
  size?: number;
  dimmed?: boolean;
}) {
  return (
    <img
      className={`bt-boxer bt-boxer--${side}${dimmed ? ' bt-boxer--dim' : ''}`}
      src={side === 'blue' ? boxerBlue : boxerOrange}
      alt=""
      style={{ height: size }}
    />
  );
}

// ---------------------------------------------------------------
// Round furniture
// ---------------------------------------------------------------

/**
 * The 108px countdown ring from the picking phase.
 *
 * Drawn as a stroked circle rotated a quarter turn so it empties from twelve
 * o'clock. `progress` is how much time is left, from 1 down to 0, which keeps
 * the caller from having to know the circumference.
 */
export function CountdownRing({
  seconds,
  progress,
  size = 108,
  stroke = 7,
}: {
  seconds: number | null;
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div className="bt-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          className="bt-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="bt-ring__arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="bt-ring__value">{seconds === null ? '—' : `${seconds}s`}</span>
    </div>
  );
}

/** One of the three tiles that sit under the genre prompt. */
export function StatTile({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="bt-tile">
      <span className="bt-tile__icon">{icon}</span>
      <span className="bt-tile__value">{value}</span>
      <span className="bt-tile__label">{label}</span>
    </div>
  );
}

/**
 * Circular monogram standing in for a player. The app derives the same thing
 * from the display name rather than storing an avatar, since guests never
 * upload one.
 */
export function Monogram({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className="bt-monogram"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
