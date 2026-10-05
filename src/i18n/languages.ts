export const LANGS = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'pt', name: 'Português', flag: 'br' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'ja', name: '日本語', flag: 'jp' },
  { code: 'ko', name: '한국어', flag: 'kr' },
  { code: 'zh', name: '中文', flag: 'cn' },
] as const;

export type Lang = (typeof LANGS)[number]['code'];
export type FlagCode = (typeof LANGS)[number]['flag'];

/** BCP 47 tag for `<html lang>` and number/date formatting. */
export const LOCALE: Record<Lang, string> = {
  en: 'en',
  es: 'es',
  pt: 'pt-BR',
  fr: 'fr',
  de: 'de',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-Hans',
};

export function isLang(value: string | null | undefined): value is Lang {
  return LANGS.some((l) => l.code === value);
}

/** First supported language in the browser's preference list, by primary subtag. */
export function detectLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLang(primary)) return primary;
  }
  return 'en';
}
