import { Truck } from 'lucide-react';
import { cn } from '@/utils';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  showTagline?: boolean;
  variant?: 'default' | 'glass' | 'on-dark';
}

const sizeConfig = {
  sm: {
    wrap: 'gap-2.5',
    icon: 'h-9 w-9 rounded-xl',
    truck: 'h-4 w-4',
    title: 'text-lg',
    tagline: 'text-[10px]',
  },
  md: {
    wrap: 'gap-3',
    icon: 'h-11 w-11 rounded-2xl',
    truck: 'h-5 w-5',
    title: 'text-xl',
    tagline: 'text-xs',
  },
  lg: {
    wrap: 'gap-4',
    icon: 'h-14 w-14 rounded-[1.125rem]',
    truck: 'h-7 w-7',
    title: 'text-2xl',
    tagline: 'text-sm',
  },
} as const;

export default function BrandLogo({
  size = 'md',
  className,
  showTagline = false,
  variant = 'default',
}: BrandLogoProps) {
  const s = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center',
        variant === 'glass' && 'auth-brand-glass rounded-2xl border border-white/50 bg-white/45 px-4 py-3 backdrop-blur-xl',
        variant === 'on-dark' && 'rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md',
        s.wrap,
        className,
      )}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-lg shadow-primary-600/30 ring-1 ring-white/40',
          s.icon,
        )}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/10 to-white/20" aria-hidden="true" />
        <Truck className={cn('relative text-white drop-shadow-sm', s.truck)} strokeWidth={2.25} />
      </div>

      <div className="min-w-0">
        <p className={cn('font-bold tracking-[-0.03em] text-slate-900', s.title)}>
          Fleet<span className="text-primary-600">Pro</span>
        </p>
        {showTagline ? (
          <p className={cn('font-medium uppercase tracking-[0.18em] text-slate-500', s.tagline)}>
            Fleet management
          </p>
        ) : null}
      </div>
    </div>
  );
}
