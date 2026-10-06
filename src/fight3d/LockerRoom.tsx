import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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
  type FighterLoadout,
} from './loadout';
import { DANCES, DANCE_NAMES } from './dances';
import type { BoxerPose } from './punchDirector';
import { weightOf } from './motion';

type Category = 'body' | 'head' | 'flag' | 'trunks' | 'gloves' | 'boots' | 'build' | 'dance';

interface Option {
  key: string;
  label: string;
  color?: string;
}

const HEAD_NAMES: Record<FighterLoadout['hair'], string> = {
  buzz: 'Sixteenth',
  fade: 'Short stem',
  afro: 'Double flag',
  long: 'Long flag',
  mohawk: 'Tall stem',
  none: 'Classic',
};

const BUILD_NAMES: Record<FighterLoadout['body'], string> = {
  light: 'Lightweight',
  mid: 'Middleweight',
  heavy: 'Heavyweight',
};

const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: 'body', label: 'Colour', hint: 'The paint on your note.' },
  { id: 'head', label: 'Head', hint: 'How your note is drawn.' },
  { id: 'flag', label: 'Flag colour', hint: 'The flag on top of your head.' },
  { id: 'trunks', label: 'Trunks', hint: 'Your colours in the ring.' },
  { id: 'gloves', label: 'Gloves', hint: 'What lands on the other song.' },
  { id: 'boots', label: 'Boots', hint: 'High-tops, laced for the walkout.' },
  { id: 'build', label: 'Build', hint: 'Light is quick, heavy hits harder.' },
  { id: 'dance', label: 'Walkout dance', hint: 'What you break into on the way to the ring.' },
];

const swatches = (list: readonly string[]): Option[] => list.map((hex, i) => ({ key: String(i), label: hex, color: hex }));

function optionsFor(cat: Category): Option[] {
  switch (cat) {
    case 'body':
      return swatches(SKIN_HEX);
    case 'flag':
      return swatches(HAIR_HEX);
    case 'trunks':
    case 'gloves':
    case 'boots':
      return swatches(CLOTH_HEX);
    case 'head':
      return HAIR_STYLES.map((h) => ({ key: h, label: HEAD_NAMES[h] }));
    case 'build':
      return BODY_TYPES.map((b) => ({ key: b, label: BUILD_NAMES[b] }));
    case 'dance':
      return DANCES.map((d) => ({ key: d, label: DANCE_NAMES[d] }));
  }
}

function valueOf(cat: Category, l: FighterLoadout): string {
  switch (cat) {
    case 'body':
      return String(l.skin);
    case 'flag':
      return String(l.hairColor);
    case 'trunks':
      return String(l.trunks);
    case 'gloves':
      return String(l.gloves);
    case 'boots':
      return String(l.boots);
    case 'head':
      return l.hair;
    case 'build':
      return l.body;
    case 'dance':
      return l.dance;
  }
}

function withValue(cat: Category, l: FighterLoadout, key: string): FighterLoadout {
  switch (cat) {
    case 'body':
      return { ...l, skin: Number(key) };
    case 'flag':
      return { ...l, hairColor: Number(key) };
    case 'trunks':
      return { ...l, trunks: Number(key) };
    case 'gloves':
      return { ...l, gloves: Number(key) };
    case 'boots':
      return { ...l, boots: Number(key) };
    case 'head':
      return { ...l, hair: key as FighterLoadout['hair'] };
    case 'build':
      return { ...l, body: key as FighterLoadout['body'] };
    case 'dance':
      return { ...l, dance: key as FighterLoadout['dance'] };
  }
}

function randomLoadout(): FighterLoadout {
  return defaultLoadout(`${Date.now()}-${Math.random()}`);
}

/**
 * Create-a-fighter: a turntable preview beside one category at a time.
 *
 * Every change writes locally straight away and, through `onChange`, to the
 * player's seat so the board and the rest of the room see it. Arrow keys
 * move through categories and options, the way a pad would.
 */
export default function LockerRoom({
  name,
  seed,
  onChange,
  onDone,
  keyboard = false,
}: {
  name: string;
  seed: string | null | undefined;
  onChange: (loadout: FighterLoadout) => void;
  /** Shows a Ready button, for the creator opened from the lobby. */
  onDone?: () => void;
  /** Arrow keys drive the menu. Only for the full-screen creator. */
  keyboard?: boolean;
}) {
  const initial = useMemo(
    () => readLocalLoadout() ?? parseLoadout(seed, name) ?? defaultLoadout(name),
    [name, seed]
  );
  const [loadout, setLoadout] = useState<FighterLoadout>(initial);
  const [cat, setCat] = useState<Category>('body');
  const [jab, setJab] = useState(0);
  const [yaw, setYaw] = useState(0);
  const drag = useRef<{ x: number; yaw: number } | null>(null);

  useEffect(() => {
    writeLocalLoadout(loadout);
    onChange(loadout);
  }, [loadout, onChange]);

  useEffect(() => {
    if (!jab) return;
    const t = window.setTimeout(() => setJab(0), 620);
    return () => window.clearTimeout(t);
  }, [jab]);

  const options = optionsFor(cat);
  const current = valueOf(cat, loadout);
  const pick = useCallback((key: string) => setLoadout((l) => withValue(cat, l, key)), [cat]);

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const ci = CATEGORIES.findIndex((c) => c.id === cat);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = (ci + (e.key === 'ArrowDown' ? 1 : -1) + CATEGORIES.length) % CATEGORIES.length;
        setCat(CATEGORIES[next].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const list = optionsFor(cat);
        const oi = list.findIndex((o) => o.key === valueOf(cat, loadout));
        const next = (oi + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
        pick(list[next].key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, cat, loadout, pick]);

  const pose: BoxerPose = jab ? 'jab' : cat === 'dance' ? 'taunt' : 'idle';
  const catInfo = CATEGORIES.find((c) => c.id === cat)!;

  return (
    <div className="creator">
      <div
        className="creator__stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, yaw };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.012);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <FightCanvas mode="locker" lockerYaw={yaw} a={{ name, loadout, pose, beat: jab, dance: loadout.dance }} />
        <div className="creator__plate">
          <span className="creator__plate-name">{name}</span>
          <span className="creator__plate-meta">
            {BUILD_NAMES[loadout.body]} · {DANCE_NAMES[loadout.dance]}
          </span>
        </div>
        <div className="creator__turn">
          <button type="button" aria-label="Turn left" onClick={() => setYaw((y) => y - Math.PI / 4)}>
            ‹
          </button>
          <span>Drag to turn</span>
          <button type="button" aria-label="Turn right" onClick={() => setYaw((y) => y + Math.PI / 4)}>
            ›
          </button>
        </div>
      </div>

      <div className="creator__panel">
        <div className="creator__tabs" role="tablist" aria-label="Customise">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === cat}
              className={`creator__tab${c.id === cat ? ' is-on' : ''}`}
              onClick={() => setCat(c.id)}
            >
              <span className="creator__tab-label">{c.label}</span>
              <span className="creator__tab-value" aria-hidden="true">
                {tabPreview(c.id, loadout)}
              </span>
            </button>
          ))}
        </div>

        <div className="creator__options" role="tabpanel" aria-label={catInfo.label}>
          <p className="creator__hint">{catInfo.hint}</p>
          <div key={cat} className={`creator__grid${options[0]?.color ? ' creator__grid--swatch' : ''}`} role="radiogroup">
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={o.key === current}
                aria-label={o.color ? `${catInfo.label} ${o.label}` : o.label}
                className={`creator__opt${o.key === current ? ' is-on' : ''}${o.color ? ' creator__opt--swatch' : ''}`}
                style={o.color ? ({ '--swatch': o.color } as CSSProperties) : undefined}
                onClick={() => pick(o.key)}
              >
                {!o.color && o.label}
              </button>
            ))}
          </div>
        </div>

        <TaleOfTheTape body={loadout.body} />

        <div className="creator__actions">
          <button type="button" className="creator__ghost" onClick={() => setLoadout(randomLoadout())}>
            Randomise
          </button>
          <button type="button" className="creator__ghost" onClick={() => setJab((n) => n + 1)}>
            Throw a jab
          </button>
          {onDone && (
            <button type="button" className="creator__ready" onClick={onDone}>
              Ready
            </button>
          )}
        </div>
        <span className="creator__code" title="Share this look">
          {encodeLoadout(loadout)}
        </span>
      </div>
    </div>
  );
}

/** The build's numbers as the fight uses them, scaled against the best build at each. */
function TaleOfTheTape({ body }: { body: FighterLoadout['body'] }) {
  const stat = (pick: (b: FighterLoadout['body']) => number) =>
    Math.round((pick(body) / Math.max(...BODY_TYPES.map(pick))) * 100);
  const rows = [
    { label: 'Speed', value: stat((b) => weightOf(b).speed) },
    { label: 'Power', value: stat((b) => weightOf(b).lunge) },
    { label: 'Chin', value: stat((b) => 1 / weightOf(b).knock) },
  ];
  return (
    <div className="creator__tape" aria-label={`${BUILD_NAMES[body]} stats`}>
      <span className="creator__tape-title">Tale of the tape · {BUILD_NAMES[body]}</span>
      {rows.map((r) => (
        <div key={r.label} className="creator__stat">
          <span>{r.label}</span>
          <i>
            <b style={{ width: `${r.value}%` }} />
          </i>
        </div>
      ))}
    </div>
  );
}

function tabPreview(cat: Category, l: FighterLoadout) {
  const dot = (hex: string) => <i className="creator__dot" style={{ background: hex }} />;
  switch (cat) {
    case 'body':
      return dot(hexOf(SKIN_HEX, l.skin));
    case 'flag':
      return dot(l.hair === 'none' ? hexOf(SKIN_HEX, l.skin) : hexOf(HAIR_HEX, l.hairColor));
    case 'trunks':
      return dot(hexOf(CLOTH_HEX, l.trunks));
    case 'gloves':
      return dot(hexOf(CLOTH_HEX, l.gloves));
    case 'boots':
      return dot(hexOf(CLOTH_HEX, l.boots));
    case 'head':
      return HEAD_NAMES[l.hair];
    case 'build':
      return BUILD_NAMES[l.body];
    case 'dance':
      return DANCE_NAMES[l.dance];
  }
}

/** The lobby's way in: one button right under the song picker. */
export function CreateBoxerButton({ name, seed, onChange }: { name: string; seed: string | null | undefined; onChange: (loadout: FighterLoadout) => void }) {
  const [open, setOpen] = useState(false);
  const kit = useMemo(() => readLocalLoadout() ?? parseLoadout(seed, name), [seed, name, open]);

  return (
    <>
      <button type="button" className="create-boxer" onClick={() => setOpen(true)}>
        <span className="create-boxer__kit" aria-hidden="true">
          <i style={{ background: hexOf(SKIN_HEX, kit.skin) }} />
          <i style={{ background: hexOf(CLOTH_HEX, kit.trunks) }} />
          <i style={{ background: hexOf(CLOTH_HEX, kit.gloves) }} />
        </span>
        <span className="create-boxer__text">
          <strong>Create your boxer</strong>
          <span>
            {BUILD_NAMES[kit.body]} · walks out to the {DANCE_NAMES[kit.dance]}
          </span>
        </span>
        <span className="create-boxer__chev" aria-hidden="true">
          ›
        </span>
      </button>
      {open && <BoxerCreator name={name} seed={seed} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

function BoxerCreator({
  name,
  seed,
  onChange,
  onClose,
}: {
  name: string;
  seed: string | null | undefined;
  onChange: (loadout: FighterLoadout) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="creator-overlay" role="dialog" aria-modal="true" aria-label="Create your boxer">
      <div className="creator-shell">
        <header className="creator-shell__head">
          <span className="creator-shell__kicker">Fighter select</span>
          <h2 className="creator-shell__title">Create your boxer</h2>
          <button type="button" className="creator-shell__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <LockerRoom name={name} seed={seed} onChange={onChange} onDone={onClose} keyboard />
      </div>
    </div>,
    document.body
  );
}
