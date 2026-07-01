import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="page-enter flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-primary-100/50 blur-2xl dark:bg-primary-500/10" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] transition-colors duration-300">
          <Icon className="h-9 w-9 text-primary-500" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      )}
    </div>
  );
}
