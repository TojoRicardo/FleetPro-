import { Lightbulb, X } from 'lucide-react';
import { useUIStore } from '@/store';

interface OnboardingTipProps {
  id: string;
  title: string;
  description: string;
}

export default function OnboardingTip({ id, title, description }: OnboardingTipProps) {
  const dismissed = useUIStore((s) => s.dismissedTips.includes(id));
  const dismissTip = useUIStore((s) => s.dismissTip);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
      <Lightbulb className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{title}</p>
        <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">{description}</p>
      </div>
      <button type="button" onClick={() => dismissTip(id)} className="rounded-lg p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/20">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
