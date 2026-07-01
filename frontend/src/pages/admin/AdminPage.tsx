import { useState } from 'react';
import { Ban, CheckCircle, Building2, DollarSign, Car, Eye } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { usePlatformAnalytics, useAdminTenants } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';
import { useTenantStore, useToastStore } from '@/store';
import { adminApi } from '@/api/endpoints';
import { formatCurrency, getPaginatedRows } from '@/utils';
import type { Tenant } from '@/types';

export default function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const selectTenant = useTenantStore((s) => s.selectTenant);
  const toast = useToastStore((s) => s.addToast);

  const { data: analytics } = usePlatformAnalytics(isSuperAdmin());
  const { data: tenantsData, refetch } = useAdminTenants({ per_page: 50 }, isSuperAdmin());

  if (!isSuperAdmin()) {
    return (
      <div className="p-6 text-center text-slate-500">Super admin access required.</div>
    );
  }

  const tenants = getPaginatedRows(tenantsData);

  const handleAction = async (id: number, action: 'suspend' | 'activate') => {
    setActionLoading(id);
    try {
      if (action === 'suspend') await adminApi.suspendTenant(id);
      else await adminApi.activateTenant(id);
      toast('success', `Tenant ${action === 'suspend' ? 'suspended' : 'activated'}.`);
      refetch();
    } catch {
      toast('error', 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Tenants" value={analytics?.total_tenants ?? 0} icon={Building2} color="primary" />
          <StatCard title="Active Subscriptions" value={analytics?.active_subscriptions ?? 0} icon={CheckCircle} color="green" />
          <StatCard title="MRR" value={formatCurrency(analytics?.mrr ?? 0)} icon={DollarSign} color="purple" />
          <StatCard title="Total Vehicles" value={analytics?.total_vehicles ?? 0} icon={Car} color="amber" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">All Tenants</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors duration-300">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Organization</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Users</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Vehicles</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t: Tenant & { users_count?: number; vehicles_count?: number }) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant={t.status}>{t.status}</Badge></td>
                    <td className="px-4 py-3">{t.users_count ?? 0}</td>
                    <td className="px-4 py-3">{t.vehicles_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { selectTenant(t.id); toast('info', `Switched to ${t.name}`); window.location.reload(); }}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span>Voir</span>
                        </Button>
                        {t.status === 'suspended' ? (
                          <Button size="sm" loading={actionLoading === t.id} onClick={() => handleAction(t.id, 'activate')}>
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                            <span>Activer</span>
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" loading={actionLoading === t.id} onClick={() => handleAction(t.id, 'suspend')}>
                            <Ban className="h-4 w-4" aria-hidden="true" />
                            <span>Suspendre</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
