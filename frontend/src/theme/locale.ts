export type AppLocale = 'fr' | 'en';

export const LOCALE_STORAGE_KEY = 'fleetpro-locale';

export function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'fr';
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'fr';
}

export function setStoredLocale(locale: AppLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: 'Français',
  en: 'English',
};
