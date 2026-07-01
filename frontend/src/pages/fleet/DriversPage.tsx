import { useState } from 'react';
import { Plus, Star, Users } from 'lucide-react';
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
import { useDrivers, useDriverMutations } from '@/hooks/useQueries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_PAGE_SIZE, getPaginatedMeta, getPaginatedRows } from '@/utils';
import type { Driver } from '@/types';

type DriverForm = {
  name: string;
  license_number: string;
  phone: string;
  status: Driver['status'];
  score: number;
};

const emptyForm: DriverForm = { name: '', license_number: '', phone: '', status: 'available', score: 5.0 };

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const debouncedSearch = useDebouncedValue(filters.search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'manager');
  const canDelete = hasRole('admin', 'super_admin');

  const { data, isLoading } = useDrivers({ page, per_page: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: filters.status });
  const { create, update, remove } = useDriverMutations();
  const { confirm, dialogProps } = useConfirmDialog();

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (d: Driver) => { setEditing(d); setForm({ name: d.name, license_number: d.license_number, phone: d.phone, status: d.status, score: d.score }); setModalOpen(true); };

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
    { key: 'name', label: 'Name' },
    { key: 'license_number', label: 'License' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (r: Driver) => <Badge variant={r.status}>{r.status.replace('_', ' ')}</Badge> },
    { key: 'score', label: 'Score', render: (r: Driver) => (
      <span className="inline-flex items-center gap-1 font-medium text-amber-600">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {Number(r.score).toFixed(1)}
      </span>
    )},
    ...(canWrite || canDelete ? [{
      key: 'actions', label: 'Actions',
      render: (r: Driver) => (
        <div className="flex flex-wrap gap-2">
          {canWrite && <EditActionButton onClick={() => openEdit(r)} />}
          {canDelete && (
            <DeleteActionButton
              onClick={() => confirm({
                title: 'Delete driver',
                description: `Are you sure you want to delete ${r.name}? This action cannot be undone.`,
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
        {canWrite && <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" /><span>Ajouter</span></Button></div>}
        <DataTable columns={columns} data={getPaginatedRows(data)} loading={isLoading}
          emptyTitle="No drivers yet"
          emptyDescription="Add drivers to assign trips and track performance."
          emptyIcon={Users}
          filters={[
            { key: 'search', type: 'search', placeholder: 'Search drivers...', value: filters.search },
            { key: 'status', type: 'select', placeholder: 'All statuses', value: filters.status, options: [
              { value: 'available', label: 'Available' }, { value: 'on_trip', label: 'On Trip' }, { value: 'unavailable', label: 'Unavailable' },
            ]},
          ]}
          onFilterChange={(k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); }}
        />
        <Pagination meta={getPaginatedMeta(data)} page={page} onPageChange={setPage} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="License Number" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Driver['status'] })}>
            <option value="available">Available</option><option value="on_trip">On Trip</option><option value="unavailable">Unavailable</option>
          </Select>
          <Input label="Performance Score (0-5)" type="number" min="0" max="5" step="0.1" value={form.score} onChange={(e) => setForm({ ...form, score: +e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button layout="horizontal" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button layout="horizontal" type="submit" loading={create.isPending || update.isPending}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
