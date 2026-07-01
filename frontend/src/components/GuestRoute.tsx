import { Navigate, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageLoader from '@/components/ui/PageLoader';
import { getPostAuthRedirect } from '@/routes/navigation';

export default function GuestRoute() {
  const { isAuthenticated, isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && token) {
    return <Navigate to={getPostAuthRedirect(null)} replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}
