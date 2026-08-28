/**
 * The playing phase centrepiece: artwork in a disc with a ring closing around
 * it as the clip runs down.
 *
 * A ring rather than a bar because this is the one screen everybody is looking
 * at together, often on a stream at the far side of a room, and a circle
 * closing is legible at a glance where a thin bar is not.
 */
export default function NowPlaying({
  title,
  artist,
  pickedBy,
  artworkUrl,
  progress,
  size = 208,
}: {
  title: string;
  artist: string;
  pickedBy: string;
  artworkUrl: string | null;
  /** 0 at the start of the clip, 1 at the end. */
  progress: number;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div className="bt-now">
      <div className="bt-now__disc" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle
            className="bt-now__track"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            className="bt-now__arc"
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

        {artworkUrl ? (
          <img className="bt-now__art" src={artworkUrl} alt="" />
        ) : (
          <div className="bt-now__art bt-now__art--empty" aria-hidden="true">
            ♪
          </div>
        )}
      </div>

      <h2 className="bt-now__title">{title}</h2>
      <p className="bt-now__artist">{artist}</p>
      <span className="bt-now__by">Picked by {pickedBy}</span>
    </div>
  );
}
