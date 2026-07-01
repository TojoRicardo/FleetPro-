import { cn } from '@/utils';
import type { ReactNode } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'right' | 'top';
  /** When false, children render inside the same wrapper without showing a tooltip. */
  disabled?: boolean;
}

export default function Tooltip({ label, children, side = 'right', disabled = false }: TooltipProps) {
  return (
    <div
      className={cn(
        'group/tooltip relative w-full',
        !disabled && 'flex items-center justify-center',
      )}
    >
      {children}
      {!disabled && (
        <span
          className={cn(
            'pointer-events-none absolute z-[100] whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] opacity-0 shadow-lg transition-all duration-300',
            'group-hover/tooltip:opacity-100',
            side === 'right' && 'left-full ml-2 top-1/2 -translate-y-1/2 translate-x-1 group-hover/tooltip:translate-x-0',
            side === 'top' && 'bottom-full mb-2 left-1/2 -translate-x-1/2 translate-y-1 group-hover/tooltip:translate-y-0'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
