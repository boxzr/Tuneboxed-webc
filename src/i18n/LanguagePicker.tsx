import { useEffect, useRef, useState } from 'react';
import Flag from './Flag';
import { useCopy, useLanguage } from './LanguageContext';
import { LANGS } from './languages';
import './languagePicker.css';

export default function LanguagePicker() {
  const { lang, setLang } = useLanguage();
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="lang-picker" ref={root}>
      <button
        type="button"
        className="lang-picker__button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${copy.nav.language}: ${current.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Flag code={current.flag} className="lang-picker__flag" />
        <span className="lang-picker__code">{current.code.toUpperCase()}</span>
        <svg className="lang-picker__caret" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {open && (
        <ul className="lang-picker__menu" aria-label={copy.nav.language}>
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                lang={l.code}
                className={`lang-picker__option${l.code === lang ? ' lang-picker__option--on' : ''}`}
                aria-current={l.code === lang ? 'true' : undefined}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
              >
                <Flag code={l.flag} className="lang-picker__flag" />
                <span>{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
