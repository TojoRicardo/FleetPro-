import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/constants';
import type { UserRole } from '@/types';

interface RoleBasedRouteProps {
  roles?: UserRole[];
  superAdmin?: boolean;
  children: React.ReactNode;
  redirectTo?: typeof ROUTES.UNAUTHORIZED | typeof ROUTES.DASHBOARD;
}

export default function RoleBasedRoute({
  roles,
  superAdmin,
  children,
  redirectTo = ROUTES.UNAUTHORIZED,
}: RoleBasedRouteProps) {
  const { isLoading, hasRole, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (superAdmin && !isSuperAdmin()) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !roles.some((role) => hasRole(role))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
