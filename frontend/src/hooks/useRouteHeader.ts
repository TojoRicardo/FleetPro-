import { useMatches } from 'react-router-dom';
import type { RouteHandle } from '@/routes/handles';

export function useRouteHeader(): RouteHandle {
  const matches = useMatches();
  const match = [...matches].reverse().find((m) => {
    const handle = m.handle as RouteHandle | undefined;
    return handle?.title;
  });
  const handle = match?.handle as RouteHandle | undefined;
  return {
    title: handle?.title ?? 'FleetPro',
    subtitle: handle?.subtitle,
    showLive: handle?.showLive,
  };
}
