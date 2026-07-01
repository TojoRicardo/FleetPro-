import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Close overlays when the route changes to avoid DOM reconciliation conflicts. */
export function useCloseOnNavigate(setOpen: (open: boolean) => void) {
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);
}
