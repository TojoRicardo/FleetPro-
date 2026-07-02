import { NavLink, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import {
  LayoutDashboard, Car, Users, Route, Wrench, Link2, ScrollText,
  CreditCard, Shield, BarChart3, Menu, X, ChevronLeft, Truck, Tag,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore, useTenantStore } from '@/store';
import { filterNavItems, NAV_ITEMS, type AppRoutePath } from '@/routes/constants';
import TenantSwitcher from '@/components/ui/TenantSwitcher';
import NotificationBell from '@/components/ui/NotificationBell';
import GlobalSearch from '@/components/ui/GlobalSearch';
import UserMenu from '@/components/ui/UserMenu';
import LiveBadge from '@/components/ui/LiveBadge';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Tooltip from '@/components/ui/Tooltip';
import PageLoader from '@/components/ui/PageLoader';
import SkipToContent from '@/components/ui/SkipToContent';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { useRouteHeader } from '@/hooks/useRouteHeader';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/utils';

const NAV_ICON_MAP: Record<AppRoutePath, typeof LayoutDashboard> = {
  '/login': LayoutDashboard,
  '/register': LayoutDashboard,
  '/dashboard': LayoutDashboard,
  '/vehicles': Car,
  '/drivers': Users,
  '/trips': Route,
  '/assignments': Link2,
  '/maintenance': Wrench,
  '/analytics': BarChart3,
  '/billing': CreditCard,
  '/pricing': Tag,
  '/notifications': LayoutDashboard,
  '/profile': LayoutDashboard,
  '/audit-logs': ScrollText,
  '/admin': Shield,
  '/404': LayoutDashboard,
  '/unauthorized': Shield,
};

type NavItem = {
  to: AppRoutePath;
  icon: typeof LayoutDashboard;
  label: string;
};

const NAV_ICON_CLASS = 'h-[18px] w-[18px] shrink-0';
const NAV_ICON_SLOT = 'flex h-[18px] w-[18px] shrink-0 items-center justify-center';

function NavItemLink({
  to,
  icon: Icon,
  label,
  sidebarCollapsed,
  onNavigate,
}: NavItem & { sidebarCollapsed: boolean; onNavigate: () => void }) {
  return (
    <Tooltip label={label} side="right" disabled={!sidebarCollapsed}>
      <NavLink
        to={to}
        onClick={onNavigate}
        className={({ isActive }) => cn(
          'group relative flex w-full min-w-0 items-center rounded-xl py-2 text-sm font-medium transition-all duration-200',
          sidebarCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3',
          isActive
            ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text)]'
            : 'text-[var(--color-sidebar-icon)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text)]',
        )}
      >
        <span className={NAV_ICON_SLOT}>
          <Icon
            className={cn(
              NAV_ICON_CLASS,
              'text-[var(--color-sidebar-icon)] group-aria-[current=page]:text-primary-600',
            )}
          />
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left text-[var(--color-sidebar-text)] group-aria-[current=page]:font-semibold group-aria-[current=page]:text-primary-700',
            sidebarCollapsed && 'sr-only',
          )}
        >
          {label}
        </span>
      </NavLink>
    </Tooltip>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { hasRole, isSuperAdmin } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const tenant = useTenantStore((s) => s.tenant);

  const navGroups = useMemo(() => {
    const visibleItems = filterNavItems(NAV_ITEMS, hasRole, isSuperAdmin);
    const groups = new Map<string, NavItem[]>();

    visibleItems.forEach((item) => {
      const navItem: NavItem = {
        to: item.path,
        icon: NAV_ICON_MAP[item.path],
        label: item.label,
      };
      const existing = groups.get(item.group) ?? [];
      existing.push(navItem);
      groups.set(item.group, existing);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [hasRole, isSuperAdmin]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 text-[var(--text)] shadow-[var(--shadow-card)] backdrop-blur-sm lg:hidden transition-colors duration-300"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden transition-colors duration-300"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        <div className={cn('flex items-center gap-3 px-4 py-5', sidebarCollapsed && 'justify-center px-2')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div className={cn('min-w-0', sidebarCollapsed && 'sr-only')}>
            <h1 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">FleetPro</h1>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">{tenant?.name ?? 'Fleet SaaS'}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p
                  className={cn(
                    'px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]',
                    sidebarCollapsed && 'sr-only',
                  )}
                >
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavItemLink key={item.to} {...item} sidebarCollapsed={sidebarCollapsed} onNavigate={closeMobile} />
                  ))}
                </div>
              </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-[72px] h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--color-text-secondary)] shadow-sm hover:text-[var(--text)] transition-colors duration-300"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-300', sidebarCollapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  );
}

interface TopbarProps {
  title: string;
  subtitle?: string;
  showLive?: boolean;
}

export function Topbar({ title, subtitle, showLive }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--color-navbar-bg)]/95 shadow-[var(--shadow-navbar)] backdrop-blur-xl transition-colors duration-300">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3.5 lg:pl-5">
        <div className="min-w-0 flex-1 overflow-hidden pl-10 sm:max-w-[min(100%,32rem)] lg:pl-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="min-w-0 truncate text-xl font-bold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-[1.375rem] lg:text-2xl">
              {title}
            </h1>
            {showLive ? <LiveBadge /> : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-[0.8125rem]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-end sm:gap-2 sm:self-auto">
          <div className="flex items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-1 shadow-sm backdrop-blur-sm sm:gap-1.5">
            <GlobalSearch />
            <div className="hidden h-5 w-px bg-[var(--color-border-subtle)] sm:block" />
            <TenantSwitcher />
            <NotificationBell />
            <ThemeToggle className="hidden sm:flex" />
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  useRealtime();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const header = useRouteHeader();

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <SkipToContent />
      <OnboardingWizard />
      <Sidebar />
      <main id="main-content" className={cn('w-full min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]', sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]')}>
        <Topbar title={header.title} subtitle={header.subtitle} showLive={header.showLive} />
        <div className="w-full">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
