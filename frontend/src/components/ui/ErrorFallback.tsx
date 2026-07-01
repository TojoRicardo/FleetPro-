import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorFallback({
  title = 'Something went wrong',
  message = 'We couldn\'t load this data. Please try again.',
  onRetry,
  compact,
}: ErrorFallbackProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">{title}</p>
          <p className="text-xs text-red-600/80">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Réessayer</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-xs">{message}</p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>Réessayer</span>
        </Button>
      )}
    </Card>
  );
}
