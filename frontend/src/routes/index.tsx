import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import GuestRoute from '@/components/GuestRoute';
import RoleBasedRoute from '@/components/RoleBasedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import { ROUTES, ROUTE_ACCESS, ROUTE_HEADERS } from '@/routes/constants';
import { bindAppRouter } from '@/routes/navigation';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const VehiclesPage = lazy(() => import('@/pages/fleet/VehiclesPage'));
const DriversPage = lazy(() => import('@/pages/fleet/DriversPage'));
const TripsPage = lazy(() => import('@/pages/fleet/TripsPage'));
const MaintenancePage = lazy(() => import('@/pages/fleet/MaintenancePage'));
const AssignmentsPage = lazy(() => import('@/pages/fleet/AssignmentsPage'));
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const PricingPage = lazy(() => import('@/pages/pricing/PricingPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const AuditLogsPage = lazy(() => import('@/pages/audit/AuditLogsPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/errors/UnauthorizedPage'));

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
          { path: ROUTES.DASHBOARD, element: <DashboardPage />, handle: ROUTE_HEADERS[ROUTES.DASHBOARD] },
          { path: ROUTES.VEHICLES, element: <VehiclesPage />, handle: ROUTE_HEADERS[ROUTES.VEHICLES] },
          {
            path: ROUTES.DRIVERS,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.DRIVERS]?.roles}>
                <DriversPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.DRIVERS],
          },
          {
            path: ROUTES.TRIPS,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.TRIPS]?.roles}>
                <TripsPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.TRIPS],
          },
          {
            path: ROUTES.ASSIGNMENTS,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.ASSIGNMENTS]?.roles}>
                <AssignmentsPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.ASSIGNMENTS],
          },
          {
            path: ROUTES.MAINTENANCE,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.MAINTENANCE]?.roles}>
                <MaintenancePage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.MAINTENANCE],
          },
          {
            path: ROUTES.ANALYTICS,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.ANALYTICS]?.roles}>
                <AnalyticsPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.ANALYTICS],
          },
          {
            path: ROUTES.BILLING,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.BILLING]?.roles}>
                <BillingPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.BILLING],
          },
          {
            path: ROUTES.PRICING,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.PRICING]?.roles}>
                <PricingPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.PRICING],
          },
          { path: ROUTES.NOTIFICATIONS, element: <NotificationsPage />, handle: ROUTE_HEADERS[ROUTES.NOTIFICATIONS] },
          { path: ROUTES.PROFILE, element: <ProfilePage />, handle: ROUTE_HEADERS[ROUTES.PROFILE] },
          {
            path: ROUTES.AUDIT_LOGS,
            element: (
              <RoleBasedRoute roles={ROUTE_ACCESS[ROUTES.AUDIT_LOGS]?.roles}>
                <AuditLogsPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.AUDIT_LOGS],
          },
          {
            path: ROUTES.ADMIN,
            element: (
              <RoleBasedRoute superAdmin>
                <AdminPage />
              </RoleBasedRoute>
            ),
            handle: ROUTE_HEADERS[ROUTES.ADMIN],
          },
          { path: ROUTES.NOT_FOUND, element: <NotFoundPage />, handle: ROUTE_HEADERS[ROUTES.NOT_FOUND] },
          { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage />, handle: ROUTE_HEADERS[ROUTES.UNAUTHORIZED] },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

bindAppRouter(router);
