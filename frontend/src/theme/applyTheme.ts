import { type Theme, themeToCssVars, THEME_STORAGE_KEY } from './theme';

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;

  Object.entries(themeToCssVars(theme)).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private browsing */
  }
}
