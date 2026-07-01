import { useState } from 'react';
import { Plus, Link2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { EditActionButton, DeleteActionButton, UnlinkActionButton } from '@/components/ui/ActionButton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Select } from '@/components/ui/FormFields';
import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAssignments, useAssignmentMutations, useLookups } from '@/hooks/useQueries';
import { DEFAULT_PAGE_SIZE, formatDateTime, getPaginatedMeta, getPaginatedRows } from '@/utils';
import type { Assignment } from '@/types';

export default function AssignmentsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ vehicle_id: 0, driver_id: 0 });

  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'super_admin');
  const canDelete = hasRole('admin', 'super_admin');

  const { data, isLoading } = useAssignments({ page, per_page: DEFAULT_PAGE_SIZE });
  const { vehicles, drivers } = useLookups();
  const { create, update, unassign, remove } = useAssignmentMutations();
  const { confirm, dialogProps } = useConfirmDialog();

  const openCreate = () => {
    setEditing(null);
    setForm({ vehicle_id: 0, driver_id: 0 });
    setModalOpen(true);
  };

  const openEdit = (assignment: Assignment) => {
    setEditing(assignment);
    setForm({ vehicle_id: assignment.vehicle_id, driver_id: assignment.driver_id });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: { driver_id: form.driver_id } });
    } else {
      await create.mutateAsync(form);
      setPage(1);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const columns = [
    { key: 'vehicle', label: 'Vehicle', render: (r: Assignment) => r.vehicle?.plate_number ?? `#${r.vehicle_id}` },
    { key: 'driver', label: 'Driver', render: (r: Assignment) => r.driver?.name ?? `#${r.driver_id}` },
    { key: 'assigned_at', label: 'Assigned', render: (r: Assignment) => formatDateTime(r.assigned_at) },
    { key: 'status', label: 'Status', render: (r: Assignment) => <Badge variant={r.status}>{r.status}</Badge> },
    ...(canWrite || canDelete ? [{
      key: 'actions', label: 'Actions',
      render: (r: Assignment) => (
        <div className="flex flex-wrap gap-2">
          {canWrite && r.status === 'active' && (
            <>
              <EditActionButton label="Réassigner" onClick={() => openEdit(r)} />
              <UnlinkActionButton onClick={() => unassign.mutate(r.id)} />
            </>
          )}
          {canDelete && (
            <DeleteActionButton
              onClick={() => confirm({
                title: 'Delete assignment',
                description: `Remove assignment for ${r.vehicle?.plate_number ?? 'vehicle'} / ${r.driver?.name ?? 'driver'}? This action cannot be undone.`,
                confirmLabel: 'Delete',
                onConfirm: async () => { await remove.mutateAsync(r.id); },
              })}
            />
          )}
        </div>
      ),
    }] : []),
  ];

  const isPending = create.isPending || update.isPending;

  return (
    <>
      <div className="p-6 space-y-4">
        {canWrite && (
          <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" /><span>Assigner</span></Button></div>
        )}
        <DataTable columns={columns} data={getPaginatedRows(data)} loading={isLoading}
          emptyTitle="No assignments yet"
          emptyDescription="Assign drivers to vehicles to manage your fleet operations."
          emptyIcon={Link2}
        />
        <Pagination meta={getPaginatedMeta(data)} page={page} onPageChange={setPage} />
      </div>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Reassign Driver' : 'Assign Driver to Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && (
            <Select label="Vehicle" value={form.vehicle_id || ''} onChange={(e) => setForm({ ...form, vehicle_id: +e.target.value })} required>
              <option value="">Select vehicle</option>
              {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
            </Select>
          )}
          {editing && (
            <p className="text-sm text-slate-600">
              Vehicle: <span className="font-medium text-slate-900">{editing.vehicle?.plate_number ?? `#${editing.vehicle_id}`}</span>
            </p>
          )}
          <Select label="Driver" value={form.driver_id || ''} onChange={(e) => setForm({ ...form, driver_id: +e.target.value })} required>
            <option value="">Select driver</option>
            {(drivers.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button layout="horizontal" variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>Annuler</Button>
            <Button layout="horizontal" type="submit" loading={isPending}>{editing ? 'Enregistrer' : 'Assigner'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
