import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en, type Copy } from './content/en';
import { LOCALE, detectLang, isLang, type Lang } from './languages';

const STORAGE_KEY = 'tuneboxed-lang';

const loaders = import.meta.glob<{ default: Copy }>(['./content/*.ts', '!./content/en.ts']);

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage blocked: fall through to the browser's languages */
  }
  return detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

interface LanguageState {
  lang: Lang;
  locale: string;
  copy: Copy;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageState>({
  lang: 'en',
  locale: 'en',
  copy: en,
  setLang: () => undefined,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [loaded, setLoaded] = useState<Partial<Record<Lang, Copy>>>({ en });

  useEffect(() => {
    document.documentElement.lang = LOCALE[lang];
    if (loaded[lang]) return;
    const load = loaders[`./content/${lang}.ts`];
    if (!load) return;
    let alive = true;
    void load().then((mod) => {
      if (alive) setLoaded((cur) => ({ ...cur, [lang]: mod.default }));
    });
    return () => {
      alive = false;
    };
  }, [lang, loaded]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice still holds for this visit */
    }
  }, []);

  const value = useMemo(
    () => ({ lang, locale: LOCALE[lang], copy: loaded[lang] ?? en, setLang }),
    [lang, loaded, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useCopy(): Copy {
  return useContext(LanguageContext).copy;
}

/** Fills `{name}` placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
