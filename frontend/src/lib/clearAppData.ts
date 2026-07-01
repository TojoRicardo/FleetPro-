import { LOCALE_STORAGE_KEY } from '@/theme/locale';
import { THEME_STORAGE_KEY } from '@/theme/theme';

const ZUSTAND_PREFIX = 'fleetpro-';
const DISMISS_PREFIX = 'fleetpro-dismiss-';
const LEGACY_KEYS = ['token', 'selectedTenantId'] as const;

/** Remove all FleetPro client-side persisted data (auth, tenant, UI prefs, theme). */
export function clearAppData(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith(ZUSTAND_PREFIX) ||
      key.startsWith(DISMISS_PREFIX) ||
      key === THEME_STORAGE_KEY ||
      key === LOCALE_STORAGE_KEY ||
      (LEGACY_KEYS as readonly string[]).includes(key)
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
