import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import FightCanvas from './FightCanvas';
import {
  BODY_TYPES,
  CLOTH_HEX,
  HAIR_HEX,
  HAIR_STYLES,
  SKIN_HEX,
  defaultLoadout,
  encodeLoadout,
  hexOf,
  parseLoadout,
  readLocalLoadout,
  writeLocalLoadout,
  type BodyType,
  type FighterLoadout,
  type HairStyle,
} from './loadout';
import type { BoxerPose } from './punchDirector';

function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`locker__chip${active ? ' is-on' : ''}`}
      style={color ? ({ '--chip': color } as CSSProperties) : undefined}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

/**
 * Customise a fighter while the lobby waits for songs.
 *
 * Changes write locally immediately and, when a token is present, to the
 * player's `avatar_seed` so the board and the rest of the room see them.
 */
export default function LockerRoom({
  name,
  seed,
  onChange,
}: {
  name: string;
  seed: string | null | undefined;
  onChange: (loadout: FighterLoadout) => void;
}) {
  const initial = useMemo(
    () => readLocalLoadout() ?? parseLoadout(seed, name) ?? defaultLoadout(name),
    [name, seed]
  );
  const [loadout, setLoadout] = useState<FighterLoadout>(initial);
  const [pose, setPose] = useState<BoxerPose>('idle');

  useEffect(() => {
    writeLocalLoadout(loadout);
    onChange(loadout);
  }, [loadout, onChange]);

  const patch = (partial: Partial<FighterLoadout>) =>
    setLoadout((cur) => ({ ...cur, ...partial }));

  const jab = () => {
    setPose('jab');
    window.setTimeout(() => setPose('idle'), 560);
  };

  return (
    <div className="locker">
      <FightCanvas
        mode="locker"
        a={{ name, loadout, pose }}
      />
      <div className="locker__panel">
        <div className="locker__row">
          <span className="locker__label">Body</span>
          <div className="locker__chips">
            {SKIN_HEX.map((hex, i) => (
              <Chip key={hex} label="" color={hex} active={loadout.skin === i} onClick={() => patch({ skin: i })} />
            ))}
          </div>
        </div>
        <div className="locker__row">
          <span className="locker__label">Note</span>
          <div className="locker__chips">
            {HAIR_STYLES.map((h) => (
              <Chip
                key={h}
                label={h === 'none' ? 'match' : h}
                active={loadout.hair === h}
                onClick={() => patch({ hair: h as HairStyle })}
              />
            ))}
          </div>
        </div>
        <div className="locker__row">
          <span className="locker__label">Flag</span>
          <div className="locker__chips">
            {HAIR_HEX.map((hex, i) => (
              <Chip key={hex} label="" color={hex} active={loadout.hairColor === i} onClick={() => patch({ hairColor: i })} />
            ))}
          </div>
        </div>
        <div className="locker__row">
          <span className="locker__label">Trunks</span>
          <div className="locker__chips">
            {CLOTH_HEX.map((hex, i) => (
              <Chip key={hex} label="" color={hex} active={loadout.trunks === i} onClick={() => patch({ trunks: i })} />
            ))}
          </div>
        </div>
        <div className="locker__row">
          <span className="locker__label">Gloves</span>
          <div className="locker__chips">
            {CLOTH_HEX.map((hex, i) => (
              <Chip key={hex} label="" color={hex} active={loadout.gloves === i} onClick={() => patch({ gloves: i })} />
            ))}
          </div>
        </div>
        <div className="locker__row">
          <span className="locker__label">Sneakers</span>
          <div className="locker__chips">
            {CLOTH_HEX.map((hex, i) => (
              <Chip key={`boot-${hex}`} label="" color={hex} active={loadout.boots === i} onClick={() => patch({ boots: i })} />
            ))}
          </div>
        </div>
        <div className="locker__row">
          <span className="locker__label">Build</span>
          <div className="locker__chips">
            {BODY_TYPES.map((b) => (
              <Chip
                key={b}
                label={b}
                active={loadout.body === b}
                onClick={() => patch({ body: b as BodyType })}
              />
            ))}
          </div>
        </div>
        <div className="locker__actions">
          <button type="button" className="locker__jab" onClick={jab}>
            Throw a jab
          </button>
          <span className="locker__code" title="Share this look">
            {encodeLoadout(loadout)}
          </span>
        </div>
      </div>
    </div>
  );
}
