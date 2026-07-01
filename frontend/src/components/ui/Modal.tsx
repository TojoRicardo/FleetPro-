import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { useScrollLock } from '@/hooks/useScrollLock';
import Portal from '@/components/ui/Portal';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  overlayClassName?: string;
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  overlayClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const timer = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button:not([tabindex="-1"])',
      );
      first?.focus();
    }, 100);
    return () => {
      document.removeEventListener('keydown', handler);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  return (
    <Portal>
      {open ? (
        <div
          role="presentation"
          className={cn(
            'fixed inset-0 z-[var(--z-modal,100)] flex items-center justify-center p-4',
            overlayClassName,
          )}
        >
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 modal-overlay cursor-default"
            onClick={onClose}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={cn(
              'relative w-full rounded-2xl bg-[var(--card)] shadow-[var(--shadow-modal)] transition-colors duration-300',
              sizes[size],
            )}
          >
            <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2 id="modal-title" className="text-lg font-semibold text-[var(--text)]">
                  {title}
                </h2>
                <p
                  className={cn(
                    'mt-0.5 text-sm text-[var(--color-text-secondary)]',
                    !description && 'invisible',
                  )}
                  aria-hidden={!description}
                >
                  {description ?? '\u00A0'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[var(--color-text-secondary)] transition-colors duration-300 hover:bg-[var(--color-surface-secondary)] hover:text-[var(--text)] focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </div>
        </div>
      ) : null}
    </Portal>
  );
}
