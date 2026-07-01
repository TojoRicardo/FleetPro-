import { cn } from '@/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export default function Card({ children, className, hover, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'card-surface',
        hover && 'transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
