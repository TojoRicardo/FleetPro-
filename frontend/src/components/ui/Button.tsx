import { Children, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
  loading?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-[var(--card)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--color-surface-secondary)] active:scale-[0.98]',
  ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] active:scale-[0.98]',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:scale-[0.98]',
  outline: 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--color-surface-secondary)] active:scale-[0.98]',
};

const sizes = {
  vertical: {
    sm: 'min-w-[4.5rem] px-3 py-2 rounded-2xl text-[11px] leading-tight [&_svg]:h-4 [&_svg]:w-4',
    md: 'min-w-[5.25rem] px-4 py-2.5 rounded-2xl text-xs leading-tight [&_svg]:h-[18px] [&_svg]:w-[18px]',
    lg: 'min-w-[6.5rem] px-5 py-3 rounded-2xl text-sm leading-tight [&_svg]:h-5 [&_svg]:w-5',
  },
  horizontal: {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl [&_svg]:h-3.5 [&_svg]:w-3.5',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl [&_svg]:h-4 [&_svg]:w-4',
    lg: 'px-6 py-3 text-base gap-2 rounded-xl [&_svg]:h-5 [&_svg]:w-5',
  },
};

function getLabel(children: ReactNode): ReactNode {
  const items = Children.toArray(children);
  const text = items.find((child) => typeof child === 'string' || (isValidElement(child) && child.type === 'span'));
  if (text) return text;
  return items.find((child) => typeof child === 'string' || typeof child === 'number') ?? null;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  layout = 'vertical',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isVertical = layout === 'vertical';
  const label = getLabel(children);

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-ring',
        isVertical ? 'flex-col gap-1' : 'flex-row',
        variants[variant],
        sizes[layout][size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            className={cn(
              'shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
              isVertical ? 'h-4 w-4' : 'h-4 w-4',
            )}
            aria-hidden="true"
          />
          {isVertical && label ? <span>{label}</span> : !isVertical ? label : null}
        </>
      ) : isVertical ? (
        Children.map(children, (child, i) => (
          <span key={i} className={cn(typeof child === 'string' && 'text-center')}>
            {child}
          </span>
        ))
      ) : (
        children
      )}
    </button>
  );
}
