import { Sparkles, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Button from './Button';
import { ROUTES } from '@/routes/constants';

interface UpgradeBannerProps {
  message: string;
  cta?: string;
  to?: string;
  dismissKey?: string;
}

export default function UpgradeBanner({ message, cta = 'Upgrade plan', to = ROUTES.BILLING, dismissKey }: UpgradeBannerProps) {
  const storageKey = dismissKey ? `fleetpro-dismiss-${dismissKey}` : null;
  const [dismissed, setDismissed] = useState(() => storageKey ? localStorage.getItem(storageKey) === '1' : false);

  const dismiss = () => {
    setDismissed(true);
    if (storageKey) localStorage.setItem(storageKey, '1');
  };

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-r from-primary-50 via-indigo-50/80 to-purple-50/60 p-4 dark:border-primary-500/20 dark:from-primary-500/10 dark:via-indigo-500/5 dark:to-purple-500/5">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)]">{message}</p>
        </div>
        <Link to={to}>
          <Button size="sm">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>{cta}</span>
          </Button>
        </Link>
        <button type="button" onClick={dismiss} className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--card)]/60 transition-colors duration-300">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
