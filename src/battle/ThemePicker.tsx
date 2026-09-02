import { useEffect, useState } from 'react';
import { GENRES } from './genres';

/**
 * The host-picked vibe for a Classic game.
 *
 * The list is a suggestion, not a limit. songbattle.io lets a host type
 * "one-hit wonders" or "songs that defined your childhood", and a locked
 * dropdown would block the prompts that get chat talking.
 *
 * Writes on blur and Enter rather than every key, because this is saved to
 * the room and a letter-by-letter RPC would fight the host as they type.
 */
export default function ThemePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (theme: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const next = draft.trim();
    if (next === value.trim()) return;
    onChange(next);
  };

  return (
    <form
      className="bt-theme"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        commit();
      }}
    >
      <input
        className="bt-theme__input"
        list="bt-theme-list"
        value={draft}
        disabled={disabled}
        maxLength={48}
        placeholder="Sunset, 2016 Rap, one-hit wonders…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          e.stopPropagation();
          commit();
        }}
      />
      <datalist id="bt-theme-list">
        {GENRES.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </form>
  );
}
