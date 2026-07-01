import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store';
import { cn } from '@/utils';

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const styles = {
  success: 'border-emerald-200/80 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  error: 'border-red-200/80 bg-red-50/95 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
  info: 'border-primary-200/80 bg-primary-50/95 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/15 dark:text-primary-300',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(({ id, type, message }) => {
        const Icon = icons[type];
        return (
          <div
            key={id}
            className={cn(
              'toast-enter pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-[var(--shadow-modal)] backdrop-blur-sm min-w-[300px] max-w-sm',
              styles[type]
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button type="button" onClick={() => removeToast(id)} className="rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
