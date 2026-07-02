import type { UserRole } from '@/types';

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  TRIPS: '/trips',
  ASSIGNMENTS: '/assignments',
  MAINTENANCE: '/maintenance',
  ANALYTICS: '/analytics',
  BILLING: '/billing',
  PRICING: '/pricing',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  AUDIT_LOGS: '/audit-logs',
  ADMIN: '/admin',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
} as const;

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export interface RouteHandle {
  title: string;
  subtitle?: string;
  showLive?: boolean;
}

export interface RouteAccess {
  roles?: UserRole[];
  superAdmin?: boolean;
}

export const ROUTE_HEADERS: Record<string, RouteHandle> = {
  [ROUTES.DASHBOARD]: { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre flotte', showLive: true },
  [ROUTES.VEHICLES]: { title: 'Véhicules', subtitle: 'Gérez votre flotte de véhicules' },
  [ROUTES.DRIVERS]: { title: 'Conducteurs', subtitle: 'Gérez vos conducteurs et leurs performances' },
  [ROUTES.TRIPS]: { title: 'Trajets', subtitle: 'Gérez et suivez les trajets de la flotte' },
  [ROUTES.ASSIGNMENTS]: { title: 'Affectations', subtitle: 'Affectez les conducteurs aux véhicules' },
  [ROUTES.MAINTENANCE]: { title: 'Entretien', subtitle: 'Planifiez et suivez l\'entretien des véhicules' },
  [ROUTES.ANALYTICS]: { title: 'Analytique', subtitle: 'Indicateurs de performance de votre organisation' },
  [ROUTES.BILLING]: { title: 'Facturation', subtitle: 'Factures, paiements et suivi des revenus' },
  [ROUTES.PRICING]: { title: 'Tarifs', subtitle: 'Plans FleetPro et calculateur de prix en temps réel' },
  [ROUTES.NOTIFICATIONS]: { title: 'Notifications', subtitle: 'Toutes les notifications système' },
  [ROUTES.PROFILE]: { title: 'Profil', subtitle: 'Informations personnelles, préférences et sécurité' },
  [ROUTES.AUDIT_LOGS]: { title: 'Journal d\'audit', subtitle: 'Traçabilité complète des actions · niveau entreprise', showLive: true },
  [ROUTES.ADMIN]: { title: 'Administration plateforme', subtitle: 'Gérez les locataires et les métriques de la plateforme' },
  [ROUTES.NOT_FOUND]: { title: 'Page introuvable', subtitle: 'La page demandée n\'existe pas' },
  [ROUTES.UNAUTHORIZED]: { title: 'Accès refusé', subtitle: 'Vous n\'avez pas les permissions nécessaires' },
};

export const ROUTE_ACCESS = {
  [ROUTES.DRIVERS]: { roles: ['admin', 'manager', 'super_admin'] as UserRole[] },
  [ROUTES.TRIPS]: { roles: ['admin', 'manager', 'super_admin'] as UserRole[] },
  [ROUTES.ASSIGNMENTS]: { roles: ['admin', 'super_admin'] as UserRole[] },
  [ROUTES.MAINTENANCE]: { roles: ['admin', 'mechanic', 'super_admin'] as UserRole[] },
  [ROUTES.ANALYTICS]: { roles: ['admin', 'manager', 'super_admin'] as UserRole[] },
  [ROUTES.BILLING]: { roles: ['admin', 'manager', 'super_admin'] as UserRole[] },
  [ROUTES.PRICING]: { roles: ['admin', 'manager', 'super_admin'] as UserRole[] },
  [ROUTES.AUDIT_LOGS]: { roles: ['admin', 'manager', 'super_admin'] as UserRole[] },
  [ROUTES.ADMIN]: { superAdmin: true },
} satisfies Partial<Record<AppRoutePath, RouteAccess>>;

export interface NavRouteItem {
  path: AppRoutePath;
  label: string;
  group: string;
  roles?: UserRole[];
  superAdmin?: boolean;
}

export const NAV_ITEMS: NavRouteItem[] = [
  { path: ROUTES.DASHBOARD, label: 'Tableau de bord', group: 'Aperçu' },
  { path: ROUTES.VEHICLES, label: 'Véhicules', group: 'Flotte' },
  { path: ROUTES.DRIVERS, label: 'Conducteurs', group: 'Flotte', roles: ROUTE_ACCESS[ROUTES.DRIVERS]?.roles },
  { path: ROUTES.ASSIGNMENTS, label: 'Affectations', group: 'Flotte', roles: ROUTE_ACCESS[ROUTES.ASSIGNMENTS]?.roles },
  { path: ROUTES.TRIPS, label: 'Trajets', group: 'Opérations', roles: ROUTE_ACCESS[ROUTES.TRIPS]?.roles },
  { path: ROUTES.MAINTENANCE, label: 'Maintenance', group: 'Opérations', roles: ROUTE_ACCESS[ROUTES.MAINTENANCE]?.roles },
  { path: ROUTES.ANALYTICS, label: 'Analytique', group: 'Entreprise', roles: ROUTE_ACCESS[ROUTES.ANALYTICS]?.roles },
  { path: ROUTES.PRICING, label: 'Tarifs', group: 'Entreprise', roles: ROUTE_ACCESS[ROUTES.PRICING]?.roles },
  { path: ROUTES.BILLING, label: 'Facturation', group: 'Entreprise', roles: ROUTE_ACCESS[ROUTES.BILLING]?.roles },
  { path: ROUTES.AUDIT_LOGS, label: 'Journaux d\'audit', group: 'Entreprise', roles: ROUTE_ACCESS[ROUTES.AUDIT_LOGS]?.roles },
  { path: ROUTES.ADMIN, label: 'Admin plateforme', group: 'Administration', superAdmin: true },
];

export interface SearchRouteItem {
  path: AppRoutePath;
  label: string;
  hint?: string;
  roles?: UserRole[];
  superAdmin?: boolean;
}

export const SEARCH_ROUTES: SearchRouteItem[] = [
  { path: ROUTES.DASHBOARD, label: 'Tableau de bord', hint: 'Vue d\'ensemble' },
  { path: ROUTES.VEHICLES, label: 'Véhicules', hint: 'Flotte' },
  { path: ROUTES.DRIVERS, label: 'Conducteurs', hint: 'Équipe', roles: ROUTE_ACCESS[ROUTES.DRIVERS]?.roles },
  { path: ROUTES.TRIPS, label: 'Trajets', hint: 'Opérations', roles: ROUTE_ACCESS[ROUTES.TRIPS]?.roles },
  { path: ROUTES.MAINTENANCE, label: 'Maintenance', hint: 'Entretien', roles: ROUTE_ACCESS[ROUTES.MAINTENANCE]?.roles },
  { path: ROUTES.ANALYTICS, label: 'Analytique', hint: 'Indicateurs', roles: ROUTE_ACCESS[ROUTES.ANALYTICS]?.roles },
  { path: ROUTES.PRICING, label: 'Tarifs', hint: 'Plans & calculateur', roles: ROUTE_ACCESS[ROUTES.PRICING]?.roles },
  { path: ROUTES.BILLING, label: 'Facturation', hint: 'Factures & paiements', roles: ROUTE_ACCESS[ROUTES.BILLING]?.roles },
  { path: ROUTES.NOTIFICATIONS, label: 'Notifications', hint: 'Alertes' },
  { path: ROUTES.PROFILE, label: 'Profil', hint: 'Compte & préférences' },
];

export const GUEST_PATHS = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

export function filterNavItems(
  items: NavRouteItem[],
  hasRole: (...roles: string[]) => boolean,
  isSuperAdmin: () => boolean,
): NavRouteItem[] {
  return items.filter((item) => {
    if (item.superAdmin) return isSuperAdmin();
    if (item.roles) return item.roles.some((role) => hasRole(role));
    return true;
  });
}

export function filterSearchRoutes(
  items: SearchRouteItem[],
  hasRole: (...roles: string[]) => boolean,
  isSuperAdmin: () => boolean,
): SearchRouteItem[] {
  return items.filter((item) => {
    if (item.superAdmin) return isSuperAdmin();
    if (item.roles) return item.roles.some((role) => hasRole(role));
    return true;
  });
}
