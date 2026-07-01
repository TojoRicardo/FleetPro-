import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/theme/useTheme';
import { cn } from '@/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'menu-item';
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--color-surface-secondary)] transition-colors duration-300',
          className
        )}
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4 text-amber-400" />
            Mode Clair
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-indigo-400" />
            Mode Sombre
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode Clair' : 'Mode Sombre'}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-xl',
        'text-[var(--color-text-secondary)] transition-colors duration-300 hover:bg-[var(--color-surface-secondary)] hover:text-[var(--text)] focus-ring',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] text-amber-400" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-indigo-500" />
      )}
    </button>
  );
}
