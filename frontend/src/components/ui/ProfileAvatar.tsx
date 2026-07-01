import { useEffect, useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { cn, resolveMediaUrl } from '@/utils';

interface ProfileAvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  imgClassName?: string;
}

const sizeClasses = {
  xs: '!h-8 !w-8 !rounded-lg !text-xs',
  sm: '!h-10 !w-10 !rounded-xl !text-sm',
  md: '!h-16 !w-16 !rounded-2xl !text-xl',
  lg: '!h-24 !w-24 !rounded-2xl !text-2xl',
  xl: '!h-28 !w-28 !rounded-2xl !text-3xl',
};

export default function ProfileAvatar({
  name,
  src,
  size = 'md',
  className,
  imgClassName,
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveMediaUrl(src);
  const showImage = Boolean(resolved) && !broken;

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!showImage) {
    return (
      <Avatar
        name={name}
        size={size === 'xl' ? 'lg' : size === 'xs' || size === 'sm' ? 'sm' : 'lg'}
        className={cn(sizeClasses[size], className)}
      />
    );
  }

  return (
    <img
      src={resolved!}
      alt={name ? `Photo de profil de ${name}` : 'Photo de profil'}
      className={cn(
        'shrink-0 object-cover ring-2 ring-[var(--border)]',
        size === 'xs' && 'h-8 w-8 rounded-lg ring-0',
        size === 'sm' && 'h-10 w-10 rounded-xl',
        size === 'md' && 'h-16 w-16 rounded-2xl',
        size === 'lg' && 'h-24 w-24 rounded-2xl ring-4 ring-[var(--card)] shadow-md',
        size === 'xl' && 'h-28 w-28 rounded-2xl ring-4 ring-[var(--card)] shadow-md',
        imgClassName,
        className,
      )}
      onError={() => setBroken(true)}
    />
  );
}
