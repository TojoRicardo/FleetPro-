import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const PORTAL_ROOT_ID = 'fleetpro-portal-root';

function getPortalRoot(): HTMLElement {
  const existing = document.getElementById(PORTAL_ROOT_ID);
  if (existing) return existing;

  const root = document.createElement('div');
  root.id = PORTAL_ROOT_ID;
  document.body.appendChild(root);
  return root;
}

interface PortalProps {
  children: ReactNode;
}

/** Stable portal target — avoids removeChild errors from direct body mounting. */
export default function Portal({ children }: PortalProps) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(getPortalRoot());
  }, []);

  if (!root) return null;
  return createPortal(children, root);
}
