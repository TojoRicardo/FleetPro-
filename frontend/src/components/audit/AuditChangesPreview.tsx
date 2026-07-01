import Button from '@/components/ui/Button';
import type { AuditLog } from '@/types';
import { formatFieldLabel, formatFieldValue, getChangedFields } from '@/utils/auditLog';

interface AuditChangesPreviewProps {
  log: AuditLog;
  onViewDetails: () => void;
}

export default function AuditChangesPreview({ log, onViewDetails }: AuditChangesPreviewProps) {
  const count = log.changed_fields_count ?? getChangedFields(log).length;
  const preview = log.changed_fields_preview;

  if (count === 0 && log.action !== 'create' && log.action !== 'delete') {
    return <span className="text-slate-400">—</span>;
  }

  if (log.action === 'create') {
    return (
      <div className="space-y-1">
        <p className="text-xs text-emerald-600">Nouvelle ressource créée</p>
        <Button variant="ghost" size="sm" layout="horizontal" className="!px-0 !py-0 h-auto min-w-0 rounded-none text-primary-600" onClick={onViewDetails}>
          Voir détails
        </Button>
      </div>
    );
  }

  if (log.action === 'delete') {
    return (
      <div className="space-y-1">
        <p className="text-xs text-red-600">Ressource supprimée</p>
        <Button variant="ghost" size="sm" layout="horizontal" className="!px-0 !py-0 h-auto min-w-0 rounded-none text-primary-600" onClick={onViewDetails}>
          Voir détails
        </Button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="space-y-1 text-xs">
        <p className="font-medium text-slate-500">{preview.label} :</p>
        <p><span className="text-red-500 line-through">{formatFieldValue(preview.before)}</span></p>
        <p><span className="text-emerald-600">{formatFieldValue(preview.after)}</span></p>
        {count > 1 && <p className="text-slate-400">{count} champs modifiés</p>}
        <Button variant="ghost" size="sm" layout="horizontal" className="!px-0 !py-0 h-auto min-w-0 rounded-none text-primary-600" onClick={onViewDetails}>
          Voir détails
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-600">{count} champ{count > 1 ? 's' : ''} modifié{count > 1 ? 's' : ''}</p>
      <Button variant="ghost" size="sm" layout="horizontal" className="!px-0 !py-0 h-auto min-w-0 rounded-none text-primary-600" onClick={onViewDetails}>
        Voir détails
      </Button>
    </div>
  );
}

export function AuditDiffPanel({ log }: { log: AuditLog }) {
  const before = log.before_value ?? {};
  const after = log.after_value ?? log.metadata ?? {};
  const keys = getChangedFields(log);

  if (keys.length === 0) {
    return <p className="text-sm text-slate-500">Aucun changement enregistré.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-red-600">Avant</h4>
        <dl className="space-y-2">
          {keys.map((key) => (
            <div key={key}>
              <dt className="text-xs font-medium text-slate-500">{formatFieldLabel(key)}</dt>
              <dd className="text-sm text-slate-800">{formatFieldValue(before[key])}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-600">Après</h4>
        <dl className="space-y-2">
          {keys.map((key) => (
            <div key={key}>
              <dt className="text-xs font-medium text-slate-500">{formatFieldLabel(key)}</dt>
              <dd className="text-sm text-slate-800">{formatFieldValue(after[key])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
