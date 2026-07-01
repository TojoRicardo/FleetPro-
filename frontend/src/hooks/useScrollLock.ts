import { useEffect } from 'react';

let lockCount = 0;

function lockScroll() {
  lockCount += 1;
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return undefined;
    lockScroll();
    return () => unlockScroll();
  }, [active]);
}
