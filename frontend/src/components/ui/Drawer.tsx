import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import Portal from '@/components/ui/Portal';
import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: 'md' | 'lg';
}

export default function Drawer({ open, onClose, title, subtitle, children, width = 'md' }: DrawerProps) {
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <Portal>
      {open ? (
        <div role="presentation" className="fixed inset-0 z-[var(--z-modal,100)] flex justify-end">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 modal-overlay cursor-default"
            onClick={onClose}
          />
          <aside
            className={`relative flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl transition-colors duration-300 ${width === 'lg' ? 'max-w-xl' : 'max-w-md'}`}
          >
            <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--text)] transition-colors duration-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </aside>
        </div>
      ) : null}
    </Portal>
  );
}
