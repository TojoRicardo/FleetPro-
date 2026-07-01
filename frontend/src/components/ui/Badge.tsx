import { cn, STATUS_COLORS } from '@/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: string;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export default function Badge({ variant = 'active', children, className, dot }: BadgeProps) {
  const key = String(children).replace(/\s/g, '_').toLowerCase();
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
      STATUS_COLORS[variant] ?? STATUS_COLORS[key] ?? 'bg-slate-100 text-slate-600',
      className
    )}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
