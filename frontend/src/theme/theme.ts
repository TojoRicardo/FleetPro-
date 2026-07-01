export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const themeTokens = {
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    border: '#E2E8F0',
    primary: '#2563EB',
    surfaceSecondary: '#F1F5F9',
    borderTable: '#E5E7EB',
    textSecondary: '#64748B',
    textTable: '#111827',
    accentHover: '#1D4ED8',
    accentLight: '#DBEAFE',
    accentMuted: '#EFF6FF',
    success: '#22C55E',
    successBg: '#DCFCE7',
    successText: '#15803D',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    warningText: '#B45309',
    danger: '#EF4444',
    dangerBg: '#FEE2E2',
    dangerText: '#B91C1C',
    info: '#2563EB',
    infoBg: '#DBEAFE',
    infoText: '#1D4ED8',
    sidebarBg: '#FFFFFF',
    sidebarHover: '#F8FAFC',
    sidebarActive: '#DBEAFE',
    sidebarIcon: '#334155',
    sidebarText: '#0F172A',
    sidebarBorder: '#E2E8F0',
    navbarBg: 'rgba(255, 255, 255, 0.95)',
    tableHeader: '#F8FAFC',
    tableRow: '#FFFFFF',
    tableHover: '#EFF6FF',
    overlay: 'rgba(15, 23, 42, 0.2)',
    skeletonFrom: 'rgb(226 232 240 / 0.6)',
    skeletonMid: 'rgb(241 245 249 / 0.9)',
    scrollbar: 'rgb(203 213 225 / 0.8)',
    scrollbarHover: 'rgb(148 163 184 / 0.9)',
    shadowCard: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    shadowNavbar: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    shadowModal: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    authGradient: `
      radial-gradient(ellipse 80% 50% at 20% 40%, rgb(37 99 235 / 0.08), transparent),
      radial-gradient(ellipse 60% 40% at 80% 60%, rgb(59 130 246 / 0.06), transparent),
      linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f1f5f9 100%)
    `,
  },
  dark: {
    bg: '#020617',
    card: '#0F172A',
    text: '#F8FAFC',
    border: '#1E293B',
    primary: '#3B82F6',
    surfaceSecondary: '#1E293B',
    borderTable: '#334155',
    textSecondary: '#94A3B8',
    textTable: '#E2E8F0',
    accentHover: '#2563EB',
    accentLight: '#1E3A5F',
    accentMuted: '#172554',
    success: '#22C55E',
    successBg: '#14532D',
    successText: '#86EFAC',
    warning: '#F59E0B',
    warningBg: '#78350F',
    warningText: '#FCD34D',
    danger: '#EF4444',
    dangerBg: '#7F1D1D',
    dangerText: '#FCA5A5',
    info: '#3B82F6',
    infoBg: '#1E3A5F',
    infoText: '#93C5FD',
    sidebarBg: '#0F172A',
    sidebarHover: '#1E293B',
    sidebarActive: '#1E3A5F',
    sidebarIcon: '#94A3B8',
    sidebarText: '#F8FAFC',
    sidebarBorder: '#1E293B',
    navbarBg: 'rgba(15, 23, 42, 0.95)',
    tableHeader: '#0F172A',
    tableRow: '#0F172A',
    tableHover: '#1E293B',
    overlay: 'rgba(0, 0, 0, 0.5)',
    skeletonFrom: 'rgb(30 41 59 / 0.6)',
    skeletonMid: 'rgb(51 65 85 / 0.9)',
    scrollbar: 'rgb(51 65 85 / 0.8)',
    scrollbarHover: 'rgb(71 85 105 / 0.9)',
    shadowCard: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    shadowNavbar: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
    shadowModal: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    authGradient: `
      radial-gradient(ellipse 80% 50% at 20% 40%, rgb(59 130 246 / 0.12), transparent),
      radial-gradient(ellipse 60% 40% at 80% 60%, rgb(37 99 235 / 0.08), transparent),
      linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)
    `,
  },
} as const;

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

/** Priority: localStorage → system preference */
export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  const t = themeTokens[theme];
  return {
    '--bg': t.bg,
    '--card': t.card,
    '--text': t.text,
    '--border': t.border,
    '--primary': t.primary,
    '--color-bg': t.bg,
    '--color-card': t.card,
    '--color-surface': t.card,
    '--color-surface-raised': t.card,
    '--color-surface-muted': t.bg,
    '--color-surface-secondary': t.surfaceSecondary,
    '--color-border-subtle': t.border,
    '--color-border': t.border,
    '--color-border-table': t.borderTable,
    '--color-text-primary': t.text,
    '--color-text-secondary': t.textSecondary,
    '--color-text-table': t.textTable,
    '--color-accent': t.primary,
    '--color-accent-hover': t.accentHover,
    '--color-accent-light': t.accentLight,
    '--color-accent-muted': t.accentMuted,
    '--color-success': t.success,
    '--color-success-bg': t.successBg,
    '--color-success-text': t.successText,
    '--color-warning': t.warning,
    '--color-warning-bg': t.warningBg,
    '--color-warning-text': t.warningText,
    '--color-danger': t.danger,
    '--color-danger-bg': t.dangerBg,
    '--color-danger-text': t.dangerText,
    '--color-error': t.danger,
    '--color-error-bg': t.dangerBg,
    '--color-error-text': t.dangerText,
    '--color-info': t.info,
    '--color-info-bg': t.infoBg,
    '--color-info-text': t.infoText,
    '--color-sidebar-bg': t.sidebarBg,
    '--color-sidebar-hover': t.sidebarHover,
    '--color-sidebar-active': t.sidebarActive,
    '--color-sidebar-icon': t.sidebarIcon,
    '--color-sidebar-text': t.sidebarText,
    '--color-sidebar-border': t.sidebarBorder,
    '--color-navbar-bg': t.navbarBg,
    '--color-table-header': t.tableHeader,
    '--color-table-row': t.tableRow,
    '--color-table-hover': t.tableHover,
    '--color-overlay': t.overlay,
    '--shadow-card': t.shadowCard,
    '--shadow-navbar': t.shadowNavbar,
    '--shadow-modal': t.shadowModal,
    '--auth-gradient': t.authGradient.trim(),
  };
}
