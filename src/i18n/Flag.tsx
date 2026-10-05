import type { FlagCode } from './languages';

/** Five-point star centred on (cx, cy), point up, rotated by `turn` radians. */
function star(cx: number, cy: number, r: number, turn = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = turn - Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.382 : r;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function Bars({ cx, cy, angle, broken }: { cx: number; cy: number; angle: number; broken: boolean[] }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`} fill="#000">
      {broken.map((gap, i) =>
        gap ? (
          <g key={i}>
            <rect x={-2} y={-1.6 + i * 1.2} width={1.7} height={0.8} />
            <rect x={0.3} y={-1.6 + i * 1.2} width={1.7} height={0.8} />
          </g>
        ) : (
          <rect key={i} x={-2} y={-1.6 + i * 1.2} width={4} height={0.8} />
        )
      )}
    </g>
  );
}

const DRAW: Record<FlagCode, () => React.ReactNode> = {
  us: () => (
    <>
      <rect width="30" height="20" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={(i * 2 * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
      ))}
      <rect width="12" height={(7 * 20) / 13} fill="#3c3b6e" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={1.5 + (i % 4) * 3} cy={1.5 + Math.floor(i / 4) * 3.4} r="0.55" fill="#fff" />
      ))}
    </>
  ),
  es: () => (
    <>
      <rect width="30" height="20" fill="#aa151b" />
      <rect y="5" width="30" height="10" fill="#f1bf00" />
    </>
  ),
  br: () => (
    <>
      <rect width="30" height="20" fill="#009c3b" />
      <polygon points="3,10 15,2.2 27,10 15,17.8" fill="#ffdf00" />
      <circle cx="15" cy="10" r="4.6" fill="#002776" />
      <path d="M10.6 9.1 Q15 8 19.5 10.6" stroke="#fff" strokeWidth="0.8" fill="none" />
    </>
  ),
  fr: () => (
    <>
      <rect width="10" height="20" fill="#0055a4" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ef4135" />
    </>
  ),
  de: () => (
    <>
      <rect width="30" height="6.67" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#dd0000" />
      <rect y="13.33" width="30" height="6.67" fill="#ffce00" />
    </>
  ),
  it: () => (
    <>
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ce2b37" />
    </>
  ),
  jp: () => (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#bc002d" />
    </>
  ),
  kr: () => (
    <>
      <rect width="30" height="20" fill="#fff" />
      <g transform="rotate(33.7 15 10)">
        <path d="M10 10 A5 5 0 0 1 20 10 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 10 10Z" fill="#cd2e3a" />
        <path d="M10 10 A5 5 0 0 0 20 10 A2.5 2.5 0 0 0 15 10 A2.5 2.5 0 0 1 10 10Z" fill="#0047a0" />
      </g>
      <Bars cx={6.2} cy={4.6} angle={-56.3} broken={[false, false, false]} />
      <Bars cx={23.8} cy={15.4} angle={-56.3} broken={[true, true, true]} />
      <Bars cx={23.8} cy={4.6} angle={56.3} broken={[true, false, true]} />
      <Bars cx={6.2} cy={15.4} angle={56.3} broken={[false, true, false]} />
    </>
  ),
  cn: () => (
    <>
      <rect width="30" height="20" fill="#de2910" />
      <polygon points={star(5, 5, 3)} fill="#ffde00" />
      <polygon points={star(10, 2, 1, 0.9)} fill="#ffde00" />
      <polygon points={star(12, 4, 1, 1.3)} fill="#ffde00" />
      <polygon points={star(12, 7, 1, 1.8)} fill="#ffde00" />
      <polygon points={star(10, 9, 1, 2.2)} fill="#ffde00" />
    </>
  ),
};

/** Drawn rather than emoji: Windows renders flag emoji as two letters. */
export default function Flag({ code, className }: { code: FlagCode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 20" width="22" height="15" aria-hidden="true" focusable="false">
      {DRAW[code]()}
    </svg>
  );
}
