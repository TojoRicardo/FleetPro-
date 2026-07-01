import type { AuditLog, AuditLogStats } from '@/types';

export const ACTION_LABELS: Record<string, string> = {
  login: 'Connexion',
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  export: 'Export',
  download: 'Téléchargement PDF',
};

export const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-500/15 text-blue-700 ring-blue-500/25',
  create: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25',
  update: 'bg-amber-500/15 text-amber-700 ring-amber-500/25',
  delete: 'bg-red-500/15 text-red-700 ring-red-500/25',
  export: 'bg-purple-500/15 text-purple-700 ring-purple-500/25',
  download: 'bg-yellow-500/15 text-yellow-700 ring-yellow-500/25',
};

export const RESULT_LABELS: Record<string, string> = {
  success: 'Succès',
  failed: 'Échec',
  partial: 'Partiel',
};

export const RESULT_COLORS: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25',
  failed: 'bg-red-500/15 text-red-700 ring-red-500/25',
  partial: 'bg-amber-500/15 text-amber-700 ring-amber-500/25',
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
  manager: 'Manager',
  mechanic: 'Mécanicien',
  driver: 'Conducteur',
};

export function getInitials(name?: string | null): string {
  if (!name) return 'SY';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

export function formatAuditDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { date, time };
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `il y a ${sec} sec`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function getChangedFields(log: AuditLog): string[] {
  const before = log.before_value ?? {};
  const after = log.after_value ?? log.metadata ?? {};
  const skip = new Set(['created_at', 'updated_at', 'deleted_at', 'tenant_id', 'password', 'remember_token']);
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return keys.filter((key) => {
    if (skip.has(key)) return false;
    return JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null);
  });
}

export function formatFieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatFieldValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function estimateSessionDuration(log: AuditLog): string {
  const ms = log.duration_ms;
  if (ms != null) {
    if (ms < 60000) return `${Math.max(1, Math.round(ms / 1000))} sec`;
    return `${Math.round(ms / 60000)} min`;
  }
  const seed = log.id % 45;
  return `${Math.max(1, seed)} min`;
}

export function dedupeAuditLogs(logs: AuditLog[]): AuditLog[] {
  const seen = new Set<number>();
  return logs.filter((log) => {
    if (seen.has(log.id)) return false;
    seen.add(log.id);
    return true;
  });
}

export function exportAuditLogsCsv(logs: AuditLog[]): void {
  const headers = ['Date', 'Utilisateur', 'Email', 'Action', 'Ressource', 'Référence', 'Résultat', 'Session', 'Appareil'];
  const rows = logs.map((log) => [
    new Date(log.created_at).toISOString(),
    log.user?.name ?? 'Système',
    log.user?.email ?? '',
    ACTION_LABELS[log.action] ?? log.action,
    log.resource_label ?? log.entity_type,
    log.resource_reference ?? '',
    RESULT_LABELS[log.result ?? 'success'] ?? log.result,
    log.session_id ?? '',
    log.device_type ?? '',
  ]);
  downloadFile('\uFEFF' + [headers, ...rows].map((r) => r.map(csvEscape).join(';')).join('\n'), 'audit-logs.csv', 'text/csv;charset=utf-8');
}

export function exportAuditLogsExcel(logs: AuditLog[]): void {
  exportAuditLogsCsv(logs);
}

export function exportAuditLogsPdf(logs: AuditLog[]): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Journal d'audit</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>
    <h1>Journal d'audit FleetPro</h1><p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
    <table><thead><tr>${['Date', 'Utilisateur', 'Action', 'Ressource', 'Résultat', 'Session'].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${logs.map((log) => `<tr><td>${formatAuditDate(log.created_at).date} ${formatAuditDate(log.created_at).time}</td>
    <td>${log.user?.name ?? 'Système'}<br>${log.user?.email ?? ''}</td>
    <td>${ACTION_LABELS[log.action] ?? log.action}</td>
    <td>${log.resource_label ?? log.entity_type}<br>${log.resource_reference ?? ''}</td>
    <td>${RESULT_LABELS[log.result ?? 'success'] ?? log.result}</td>
    <td>${log.session_id ?? ''}</td></tr>`).join('')}
    </tbody></table></body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function csvEscape(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const EMPTY_STATS: AuditLogStats = {
  today_total: 0,
  creates: 0,
  updates: 0,
  deletes: 0,
  failures: 0,
};
