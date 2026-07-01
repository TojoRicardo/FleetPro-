import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useAuthStore, useTenantStore, useToastStore } from '@/store';
import { useAdminTenants } from '@/hooks/useQueries';
import { cn, getPaginatedRows } from '@/utils';
import { TOPBAR_COPY } from '@/i18n/fr';

export default function TenantSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  const tenant = useTenantStore((s) => s.tenant);
  const selectTenant = useTenantStore((s) => s.selectTenant);
  const toast = useToastStore((s) => s.addToast);

  const { data: tenantsData } = useAdminTenants({ per_page: 50 }, isSuperAdmin);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!isSuperAdmin) {
    return (
      <div className="hidden max-w-[9.5rem] shrink-0 items-center gap-2 rounded-xl px-2 py-2 sm:flex lg:max-w-[11rem]" title={tenant?.name ?? undefined}>
        <Building2 className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text)]">
          {tenant?.name ?? TOPBAR_COPY.tenant.defaultName}
        </span>
      </div>
    );
  }

  const tenants = getPaginatedRows(tenantsData);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex max-w-[9.5rem] items-center gap-1.5 rounded-xl px-2 py-2 transition-all duration-300 lg:max-w-[11rem]',
          'hover:bg-[var(--color-surface-secondary)] focus-ring',
          open && 'bg-[var(--color-accent-muted)]',
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary-500" />
        <span
          className="hidden min-w-0 flex-1 truncate text-left text-sm font-medium text-[var(--text)] sm:inline"
          title={tenant?.name ?? undefined}
        >
          {tenant?.name ?? TOPBAR_COPY.tenant.allTenants}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-modal)] transition-colors duration-300">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{TOPBAR_COPY.tenant.switchWorkspace}</p>
            </div>
            <button
              type="button"
              onClick={() => { selectTenant(null); setOpen(false); toast('info', 'Viewing all tenants'); window.location.reload(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--text)] hover:bg-[var(--color-surface-secondary)] transition-colors duration-300"
            >
              <Building2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
              {TOPBAR_COPY.tenant.allTenantsGlobal}
            </button>
            <div className="my-1 border-t border-[var(--border)]" />
            {tenants.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  selectTenant(t.id);
                  setOpen(false);
                  toast('info', `Switched to ${t.name}`);
                  window.location.reload();
                }}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3 text-sm transition-colors duration-300 hover:bg-[var(--color-surface-secondary)]',
                  tenant?.id === t.id && 'bg-[var(--color-accent-muted)]'
                )}
              >
                <span className="truncate font-medium text-[var(--text)]">{t.name}</span>
                {tenant?.id === t.id && <Check className="h-4 w-4 text-primary-600" />}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
