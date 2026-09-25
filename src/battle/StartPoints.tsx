import StartPointSlider from './StartPointSlider';
import type { BattleSubmission } from '../types/battle';

/**
 * The host's start sliders for this round's YouTube and SoundCloud picks.
 *
 * Those play the whole song, so where it starts is a real choice: the chorus,
 * the verse that matters, past a long intro. Audio previews are only thirty
 * seconds and have the room-wide clip start in settings instead.
 */
export default function StartPoints({
  token,
  picks,
  liveId,
  durations,
}: {
  token: string;
  picks: BattleSubmission[];
  liveId: string | null;
  durations: Record<string, number>;
}) {
  return (
    <div className="bt-startpoints">
      <p className="bt-sub" style={{ margin: '16px 0 8px' }}>
        Full songs. Drag to choose where each one starts. Everyone jumps there.
      </p>
      <ul className="bt-mix">
        {picks.map((s) => (
          <li key={s.id} className={`bt-mix__row${s.id === liveId ? ' bt-mix__row--live' : ''}`}>
            <span className="bt-mix__name">{s.song_title}</span>
            <StartPointSlider token={token} submission={s} duration={durations[s.id] ?? null} />
          </li>
        ))}
      </ul>
    </div>
  );
}
