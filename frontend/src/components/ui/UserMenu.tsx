import { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/constants';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/utils';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import { TOPBAR_COPY } from '@/i18n/fr';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useCloseOnNavigate(setOpen);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const goToProfile = () => {
    setOpen(false);
    navigate(ROUTES.PROFILE);
  };

  const displayLabel = user?.role
    ? user.role.replace(/_/g, ' ')
    : user?.name?.split(' ')[0];

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex max-w-[10.5rem] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] py-1.5 pl-1.5 pr-2.5',
          'transition-all duration-300 hover:shadow-sm focus-ring lg:max-w-[12rem]',
        )}
      >
        <ProfileAvatar name={user?.name} src={user?.avatar_url} size="xs" className="shrink-0 shadow-sm" />
        <span
          className="hidden min-w-0 flex-1 truncate text-left text-sm font-medium capitalize text-[var(--text)] md:block"
          title={user?.name ?? undefined}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-modal)] transition-colors duration-300">
          <div className="border-b border-[var(--border)] px-4 py-4">
            <div className="flex items-center gap-3">
              <ProfileAvatar name={user?.name} src={user?.avatar_url} size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user?.email}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex max-w-full rounded-full bg-[var(--color-accent-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
              <span className="truncate capitalize">{user?.role?.replace(/_/g, ' ')}</span>
            </span>
          </div>
          <div className="p-1.5">
            <ThemeToggle variant="menu-item" className="sm:hidden" />
            <button
              type="button"
              onClick={goToProfile}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors duration-300"
            >
              <User className="h-4 w-4" /> {TOPBAR_COPY.userMenu.profile}
            </button>
            <div className="my-1 border-t border-[var(--border)]" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors duration-300"
            >
              <LogOut className="h-4 w-4" /> {TOPBAR_COPY.userMenu.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
