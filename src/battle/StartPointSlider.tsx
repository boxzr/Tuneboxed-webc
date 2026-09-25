import { useEffect, useRef, useState } from 'react';
import * as battle from '../lib/battleClient';
import { clockLabel, embedStart } from './embeds';
import type { BattleSubmission } from '../types/battle';

/** When the player has not reported a length yet, the slider still covers most songs. */
const FALLBACK_LENGTH = 300;

/**
 * Host control for where a YouTube or SoundCloud pick starts.
 *
 * Saved to the submission so every device in the room lands on the same spot;
 * moving it while the song plays moves everybody. Writes wait for the drag to
 * settle, so scrubbing does not fire a request per pixel.
 */
export default function StartPointSlider({
  token,
  submission,
  duration,
  className = 'bt-slider',
  labelClassName,
}: {
  token: string;
  submission: BattleSubmission;
  /** Track length from the provider player, when it has said. */
  duration: number | null;
  className?: string;
  labelClassName?: string;
}) {
  const saved = embedStart(submission);
  const [value, setValue] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const dragging = useRef(false);

  // Follow the saved value when it changes from elsewhere, but not mid-drag.
  useEffect(() => {
    if (!dragging.current) setValue(saved);
  }, [saved]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const max = Math.max(10, Math.floor(duration ?? FALLBACK_LENGTH) - 5);

  const commit = (seconds: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      dragging.current = false;
      battle
        .setSubmissionStart(token, submission.id, seconds)
        .then(() => setError(null))
        .catch((e: Error) => setError(e.message));
    }, 350);
  };

  return (
    <div className="bt-startpoint">
      <input
        className={className}
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(value, max)}
        aria-label={`Start ${submission.song_title} at`}
        onChange={(e) => {
          dragging.current = true;
          const next = Number(e.currentTarget.value);
          setValue(next);
          commit(next);
        }}
      />
      <span className={labelClassName ?? 'bt-startpoint__label'}>
        Starts at {clockLabel(value)}
        {duration ? ` of ${clockLabel(duration)}` : ''}
      </span>
      {error && <span className="bt-startpoint__error">{error}</span>}
    </div>
  );
}
