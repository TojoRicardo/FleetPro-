import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Car, Users, Route, LayoutDashboard, X, Command,
  Plus, CreditCard, BarChart3, Wrench, Bell, ArrowRight, User,
  Tag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi, driversApi, billingApi } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { filterSearchRoutes, ROUTES, SEARCH_ROUTES } from '@/routes/constants';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import Portal from '@/components/ui/Portal';
import { cn, getPaginatedRows } from '@/utils';
import { TOPBAR_COPY } from '@/i18n/fr';

type CmdItem = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Car;
  action: () => void;
  group: 'pages' | 'actions' | 'vehicles' | 'drivers' | 'invoices';
};

const quickActions = [
  { label: 'Ajouter un véhicule', to: ROUTES.VEHICLES, icon: Plus, hint: 'Nouveau véhicule' },
  { label: 'Créer un trajet', to: ROUTES.TRIPS, icon: Route, hint: 'Planifier un trajet', roles: ['admin', 'manager', 'super_admin'] as const },
  { label: 'Ajouter un conducteur', to: ROUTES.DRIVERS, icon: Users, hint: 'Nouveau conducteur', roles: ['admin', 'manager', 'super_admin'] as const },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { hasRole, isSuperAdmin } = useAuth();

  const pages = useMemo(
    () => filterSearchRoutes(SEARCH_ROUTES, hasRole, isSuperAdmin),
    [hasRole, isSuperAdmin],
  );

  const actions = useMemo(
    () => quickActions.filter((action) => {
      if (!action.roles) return true;
      return action.roles.some((role) => hasRole(role));
    }),
    [hasRole],
  );

  useCloseOnNavigate(setOpen);

  const searchEnabled = open && query.trim().length >= 2;

  const { data: vehicleResults } = useQuery({
    queryKey: ['cmd-search', 'vehicles', query],
    queryFn: () => vehiclesApi.getAll({ search: query, per_page: 5 }),
    enabled: searchEnabled,
    staleTime: 30000,
  });

  const { data: driverResults } = useQuery({
    queryKey: ['cmd-search', 'drivers', query],
    queryFn: () => driversApi.getAll({ search: query, per_page: 5 }),
    enabled: searchEnabled,
    staleTime: 30000,
  });

  const { data: invoiceResults } = useQuery({
    queryKey: ['cmd-search', 'invoices', query],
    queryFn: () => billingApi.getInvoices({ per_page: 20 }),
    enabled: searchEnabled,
    staleTime: 30000,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setActiveIndex(0); }
  }, [open]);

  useScrollLock(open);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list: CmdItem[] = [];

    pages.filter((p) => !q || p.label.toLowerCase().includes(q)).forEach((p) => {
      list.push({
        id: `page-${p.path}`,
        label: p.label,
        hint: p.hint,
        icon: p.path === ROUTES.DASHBOARD ? LayoutDashboard
          : p.path === ROUTES.VEHICLES ? Car
          : p.path === ROUTES.DRIVERS ? Users
          : p.path === ROUTES.TRIPS ? Route
          : p.path === ROUTES.MAINTENANCE ? Wrench
          : p.path === ROUTES.ANALYTICS ? BarChart3
          : p.path === ROUTES.PRICING ? Tag
          : p.path === ROUTES.BILLING ? CreditCard
          : p.path === ROUTES.NOTIFICATIONS ? Bell
          : User,
        group: 'pages',
        action: () => go(p.path),
      });
    });

    actions.filter((a) => !q || a.label.toLowerCase().includes(q)).forEach((a) => {
      list.push({ id: `action-${a.to}`, label: a.label, hint: a.hint, icon: a.icon, group: 'actions', action: () => go(a.to) });
    });

    getPaginatedRows(vehicleResults).forEach((v) => {
      list.push({
        id: `vehicle-${v.id}`,
        label: `${v.plate_number} — ${v.brand} ${v.model}`,
        hint: 'Vehicle',
        icon: Car,
        group: 'vehicles',
        action: () => go(ROUTES.VEHICLES),
      });
    });

    getPaginatedRows(driverResults).forEach((d) => {
      list.push({
        id: `driver-${d.id}`,
        label: d.name,
        hint: d.license_number,
        icon: Users,
        group: 'drivers',
        action: () => go(ROUTES.DRIVERS),
      });
    });

    getPaginatedRows(invoiceResults)
      .filter((inv) => !q || String(inv.number ?? inv.id).toLowerCase().includes(q) || String(inv.status).includes(q))
      .slice(0, 5)
      .forEach((inv) => {
      list.push({
        id: `invoice-${inv.id}`,
        label: inv.number ?? `Facture #${inv.id}`,
        hint: `${inv.status} — ${inv.amount}`,
        icon: CreditCard,
        group: 'invoices',
        action: () => go(ROUTES.BILLING),
      });
      });

    return list;
  }, [query, vehicleResults, driverResults, invoiceResults, pages, actions]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && items[activeIndex]) { e.preventDefault(); items[activeIndex].action(); }
    if (e.key === 'Escape') setOpen(false);
  };

  const groups = [
    { key: 'pages', label: TOPBAR_COPY.search.groups.pages },
    { key: 'actions', label: TOPBAR_COPY.search.groups.actions },
    { key: 'vehicles', label: TOPBAR_COPY.search.groups.vehicles },
    { key: 'drivers', label: TOPBAR_COPY.search.groups.drivers },
  ] as const;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex items-center gap-2 rounded-xl border-0 bg-transparent px-2.5 py-2 text-sm text-[var(--color-text-secondary)]',
          'transition-all duration-300 hover:bg-[var(--color-surface-secondary)] hover:text-[var(--text)] w-44 lg:w-52 focus-ring'
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{TOPBAR_COPY.search.placeholder}</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <button type="button" onClick={() => setOpen(true)} className="md:hidden rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] focus-ring transition-colors duration-300" aria-label={TOPBAR_COPY.search.ariaMobile}>
        <Search className="h-5 w-5" />
      </button>

      <Portal>
        {open ? (
        <div className="fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 modal-overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-1/2 top-[12%] z-[201] w-full max-w-xl -translate-x-1/2 px-4">
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 shadow-[var(--shadow-modal)] backdrop-blur-xl transition-colors duration-300">
                <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
                  <Search className="h-5 w-5 text-primary-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={TOPBAR_COPY.search.placeholderModal}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent py-4 text-sm text-[var(--text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
                  />
                  <kbd className="hidden sm:inline rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)]">ESC</kbd>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"><X className="h-4 w-4" /></button>
                </div>
                <div className="max-h-[min(400px,50vh)] overflow-y-auto p-2">
                  {items.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-[var(--color-text-secondary)]">{TOPBAR_COPY.search.noResults} &ldquo;{query}&rdquo;</p>
                  ) : (
                    groups.map(({ key, label }) => {
                      const groupItems = items.filter((i) => i.group === key);
                      if (groupItems.length === 0) return null;
                      return (
                        <div key={key} className="mb-2">
                          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">{label}</p>
                          {groupItems.map((item) => {
                            const idx = items.indexOf(item);
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={item.action}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-300',
                                  idx === activeIndex ? 'bg-[var(--color-accent-muted)]' : 'hover:bg-[var(--color-surface-secondary)]'
                                )}
                              >
                                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', idx === activeIndex ? 'bg-[var(--color-accent-light)]' : 'bg-[var(--color-surface-secondary)]')}>
                                  <Icon className={cn('h-4 w-4', idx === activeIndex ? 'text-primary-600' : 'text-[var(--color-text-secondary)]')} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[var(--text)] truncate">{item.label}</p>
                                  {item.hint && <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.hint}</p>}
                                </div>
                                {idx === activeIndex && <ArrowRight className="h-4 w-4 text-primary-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--color-text-secondary)]">
                  <span><kbd className="rounded border px-1">↑↓</kbd> {TOPBAR_COPY.search.hints.navigate}</span>
                  <span><kbd className="rounded border px-1">↵</kbd> {TOPBAR_COPY.search.hints.select}</span>
                  <span><kbd className="rounded border px-1">esc</kbd> {TOPBAR_COPY.search.hints.close}</span>
                </div>
              </div>
          </div>
        </div>
        ) : null}
      </Portal>
    </>
  );
}
