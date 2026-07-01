import type { createBrowserRouter } from 'react-router-dom';
import { GUEST_PATHS, ROUTES } from '@/routes/constants';

type AppRouter = ReturnType<typeof createBrowserRouter>;

let appRouter: AppRouter | null = null;

export function bindAppRouter(router: AppRouter) {
  appRouter = router;
}

export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (appRouter) {
    void appRouter.navigate(path, { replace: options?.replace ?? false });
    return;
  }

  if (options?.replace) {
    window.location.replace(path);
  } else {
    window.location.assign(path);
  }
}

export function isGuestPath(pathname: string): boolean {
  return GUEST_PATHS.some((path) => pathname.startsWith(path));
}

export function getPostAuthRedirect(state: unknown): string {
  const from = (state as { from?: { pathname?: string } } | null)?.from?.pathname;
  if (from && !isGuestPath(from) && from !== ROUTES.NOT_FOUND && from !== ROUTES.UNAUTHORIZED) {
    return from;
  }
  return ROUTES.DASHBOARD;
}
