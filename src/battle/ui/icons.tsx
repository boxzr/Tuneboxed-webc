/**
 * The handful of glyphs the battle UI needs.
 *
 * The app draws these with SF Symbols, which the web has no equivalent of, and
 * pulling in an icon library to use eight shapes would cost more than the rest
 * of the room does. They are inline SVG on a 24 grid, filled with currentColor
 * so a glyph takes the colour of whatever it sits in.
 */

type IconProps = {
  size?: number;
  className?: string;
};

function Glyph({
  size = 20,
  className,
  path,
}: IconProps & { path: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      // Decorative in every current use: each one sits beside a text label
      // that already says the same thing.
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}

export const CrownIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M3.2 8.4a1.1 1.1 0 0 1 1.72-.9l3.4 2.36 2.7-4.74a1.1 1.1 0 0 1 1.92 0l2.7 4.74 3.4-2.36a1.1 1.1 0 0 1 1.71.9l-1.2 7.5A1.6 1.6 0 0 1 17.97 17H6.03a1.6 1.6 0 0 1-1.58-1.1L3.2 8.4Z"
  />
);

export const LockIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M8 9V7a4 4 0 1 1 8 0v2h.5A2.5 2.5 0 0 1 19 11.5v7A2.5 2.5 0 0 1 16.5 21h-9A2.5 2.5 0 0 1 5 18.5v-7A2.5 2.5 0 0 1 7.5 9H8Zm2 0h4V7a2 2 0 1 0-4 0v2Z"
  />
);

export const CheckIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.78 7.7-5.66 5.66a1 1 0 0 1-1.42 0L7.22 12.9a1 1 0 1 1 1.42-1.42l1.77 1.78 4.95-4.95a1 1 0 1 1 1.42 1.42Z"
  />
);

export const PlayIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z"
  />
);

export const SparkleIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M12 2.5l1.65 5.85L19.5 10l-5.85 1.65L12 17.5l-1.65-5.85L4.5 10l5.85-1.65L12 2.5Z"
  />
);

export const TrophyIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M7 3h10v1.5h3.2V7a4.2 4.2 0 0 1-3.9 4.19A5.5 5.5 0 0 1 13 14.36V18h3.2v2.5H7.8V18H11v-3.64a5.5 5.5 0 0 1-3.3-3.17A4.2 4.2 0 0 1 3.8 7V4.5H7V3Zm0 3.2H5.6V7c0 .9.55 1.68 1.4 2V6.2Zm10 0V9c.85-.32 1.4-1.1 1.4-2v-.8H17Z"
  />
);

export const UsersIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M9 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 1.6c-3.36 0-6.2 1.86-6.2 4.15V20h12.4v-2.75c0-2.29-2.84-4.15-6.2-4.15ZM17.2 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm.6 1.7h-1.5a6.7 6.7 0 0 1 1.5 3.7V20h4.1v-2.4c0-2.2-1.9-3.9-4.1-3.9Z"
  />
);

export const CopyIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M9 2h9a3 3 0 0 1 3 3v9h-2.2V5a.8.8 0 0 0-.8-.8H9V2ZM6 6.5h8A2.5 2.5 0 0 1 16.5 9v10A2.5 2.5 0 0 1 14 21.5H6A2.5 2.5 0 0 1 3.5 19V9A2.5 2.5 0 0 1 6 6.5Z"
  />
);

export const ScreenIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M4.5 3.5h15A2.5 2.5 0 0 1 22 6v9.5a2.5 2.5 0 0 1-2.5 2.5H13.2v2.1h3.05v2H7.75v-2H10.8V18H4.5A2.5 2.5 0 0 1 2 15.5V6a2.5 2.5 0 0 1 2.5-2.5Z"
  />
);

export const EyeIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M12 5c-5 0-8.9 3.66-10 7 1.1 3.34 5 7 10 7s8.9-3.66 10-7c-1.1-3.34-5-7-10-7Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Zm0-2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
  />
);

export const SlidersIcon = (p: IconProps) => (
  <Glyph
    {...p}
    path="M4 6.5h7.15a2.5 2.5 0 0 0 4.7 0H20v-2h-4.15a2.5 2.5 0 0 0-4.7 0H4v2Zm0 13h4.15a2.5 2.5 0 0 0 4.7 0H20v-2h-7.15a2.5 2.5 0 0 0-4.7 0H4v2Zm16-6.5v-2h-4.15a2.5 2.5 0 0 0-4.7 0H4v2h7.15a2.5 2.5 0 0 0 4.7 0H20Z"
  />
);
