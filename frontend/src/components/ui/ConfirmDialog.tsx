import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils';
import { useScrollLock } from '@/hooks/useScrollLock';
import Portal from '@/components/ui/Portal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  useScrollLock(open);

  useEffect(() => {
    if (!open || loading) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, loading]);

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  const iconStyles = variant === 'danger'
    ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
    : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400';

  return (
    <Portal>
      {open ? (
        <div role="presentation" className="fixed inset-0 z-[var(--z-modal,100)] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 modal-overlay cursor-default"
            onClick={loading ? undefined : onClose}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? 'confirm-dialog-description' : undefined}
            className="relative w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-[var(--shadow-modal)] transition-colors duration-300"
          >
            <div className="flex gap-4">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconStyles)}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--text)]">
                  {title}
                </h2>
                {description && (
                  <p id="confirm-dialog-description" className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button layout="horizontal" variant="secondary" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button layout="horizontal" variant="danger" autoFocus onClick={handleConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Portal>
  );
}
