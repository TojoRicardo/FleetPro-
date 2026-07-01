import { useState } from 'react';
import { Plus, Calendar, Wrench, List } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { EditActionButton, DeleteActionButton } from '@/components/ui/ActionButton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/FormFields';
import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useMaintenance, useMaintenanceMutations, useLookups } from '@/hooks/useQueries';
import { DEFAULT_PAGE_SIZE, formatCurrency, formatDate, getPaginatedMeta, getPaginatedRows } from '@/utils';
import type { Maintenance } from '@/types';

type MaintenanceForm = {
  vehicle_id: number;
  type: string;
  description: string;
  cost: number;
  maintenance_date: string;
  status: Maintenance['status'];
};

const emptyForm: MaintenanceForm = { vehicle_id: 0, type: '', description: '', cost: 0, maintenance_date: '', status: 'planned' };

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'mechanic');
  const canDelete = hasRole('admin', 'super_admin');

  const { data, isLoading } = useMaintenance({ page, per_page: DEFAULT_PAGE_SIZE });
  const { vehicles } = useLookups();
  const { create, update, remove } = useMaintenanceMutations();
  const { confirm, dialogProps } = useConfirmDialog();

  const items = getPaginatedRows(data);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (m: Maintenance) => {
    setEditing(m);
    setForm({ vehicle_id: m.vehicle_id, type: m.type, description: m.description, cost: m.cost, maintenance_date: m.maintenance_date?.slice(0, 10) ?? '', status: m.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await update.mutateAsync({ id: editing.id, data: form });
    else {
      await create.mutateAsync(form);
      setPage(1);
    }
    setModalOpen(false);
  };

  const columns = [
    { key: 'type', label: 'Type' },
    { key: 'vehicle', label: 'Vehicle', render: (r: Maintenance) => r.vehicle?.plate_number ?? `#${r.vehicle_id}` },
    { key: 'maintenance_date', label: 'Date', render: (r: Maintenance) => formatDate(r.maintenance_date) },
    { key: 'cost', label: 'Cost', render: (r: Maintenance) => formatCurrency(r.cost) },
    { key: 'status', label: 'Status', render: (r: Maintenance) => <Badge variant={r.status}>{r.status}</Badge> },
    ...(canWrite || canDelete ? [{
      key: 'actions', label: '', render: (r: Maintenance) => (
        <div className="flex flex-wrap gap-2">
          {canWrite && <EditActionButton onClick={() => openEdit(r)} />}
          {canDelete && (
            <DeleteActionButton
              onClick={() => confirm({
                title: 'Delete maintenance',
                description: `Delete ${r.type} record for ${r.vehicle?.plate_number ?? 'this vehicle'}? This action cannot be undone.`,
                confirmLabel: 'Delete',
                onConfirm: async () => { await remove.mutateAsync(r.id); },
              })}
            />
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={view === 'list' ? 'primary' : 'outline'}
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span>Liste</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'calendar' ? 'primary' : 'outline'}
              onClick={() => setView('calendar')}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Calendrier</span>
            </Button>
          </div>
          {canWrite && <Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" /><span>Planifier</span></Button>}
        </div>

        {view === 'list' ? (
          <>
            <DataTable columns={columns} data={items} loading={isLoading}
              emptyTitle="No maintenance scheduled"
              emptyDescription="Keep your fleet running smoothly by scheduling maintenance."
              emptyIcon={Wrench}
            />
            <Pagination meta={getPaginatedMeta(data)} page={page} onPageChange={setPage} />
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((m) => (
              <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{m.type}</p>
                    <p className="text-sm text-slate-500">{m.vehicle?.plate_number}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.status}>{m.status}</Badge>
                    {canWrite && <EditActionButton onClick={() => openEdit(m)} />}
                    {canDelete && (
                      <DeleteActionButton
                        onClick={() => confirm({
                          title: 'Delete maintenance',
                          description: `Delete ${m.type} record for ${m.vehicle?.plate_number ?? 'this vehicle'}? This action cannot be undone.`,
                          confirmLabel: 'Delete',
                          onConfirm: async () => { await remove.mutateAsync(m.id); },
                        })}
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  {formatDate(m.maintenance_date)}
                  <span className="ml-auto font-medium text-slate-700">{formatCurrency(m.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Maintenance' : 'Schedule Maintenance'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Vehicle" value={form.vehicle_id || ''} onChange={(e) => setForm({ ...form, vehicle_id: +e.target.value })} required>
            <option value="">Select vehicle</option>
            {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
          </Select>
          <Input label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.maintenance_date} onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })} required />
            <Input label="Cost ($)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} />
          </div>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Maintenance['status'] })}>
            <option value="planned">Planned</option><option value="done">Done</option><option value="cancelled">Cancelled</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button layout="horizontal" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button layout="horizontal" type="submit" loading={create.isPending || update.isPending}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
