import { cn } from '@/utils';
import { getInitials } from '@/utils/auditLog';

interface AvatarProps {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 font-semibold text-white shadow-sm ring-2 ring-[var(--card)]',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
