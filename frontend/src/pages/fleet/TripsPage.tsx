import { useState } from 'react';
import { Plus, Circle, Route } from 'lucide-react';
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
import { useTrips, useTripMutations, useLookups } from '@/hooks/useQueries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRealtime } from '@/hooks/useRealtime';
import { DEFAULT_PAGE_SIZE, formatCurrency, getPaginatedMeta, getPaginatedRows } from '@/utils';
import { cn } from '@/utils';
import type { Trip } from '@/types';

const STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'] as const;
type TripForm = {
  vehicle_id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  start_time: string;
  distance: number;
  cost_estimation: number;
  status: Trip['status'];
};

const emptyForm: TripForm = { vehicle_id: 0, driver_id: 0, start_location: '', end_location: '', start_time: '', distance: 0, cost_estimation: 0, status: 'scheduled' };

function TripTimeline({ status }: { status: Trip['status'] }) {
  const steps = ['scheduled', 'ongoing', 'completed'];
  const idx = steps.indexOf(status === 'cancelled' ? 'scheduled' : status);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <Circle className={cn('h-2.5 w-2.5', i <= idx ? 'fill-primary-500 text-primary-500' : 'fill-slate-200 text-slate-200')} />
          {i < steps.length - 1 && <div className={cn('h-0.5 w-4', i < idx ? 'bg-primary-500' : 'bg-slate-200')} />}
        </div>
      ))}
      {status === 'cancelled' && <Badge variant="cancelled">cancelled</Badge>}
    </div>
  );
}

export default function TripsPage() {
  useRealtime();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const debouncedSearch = useDebouncedValue(filters.search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'manager');
  const canDelete = hasRole('admin', 'super_admin');

  const { data, isLoading } = useTrips({ page, per_page: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: filters.status });
  const { vehicles, drivers } = useLookups();
  const { create, update, remove } = useTripMutations();
  const { confirm, dialogProps } = useConfirmDialog();

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t: Trip) => {
    setEditing(t);
    setForm({ vehicle_id: t.vehicle_id, driver_id: t.driver_id, start_location: t.start_location, end_location: t.end_location, start_time: t.start_time?.slice(0, 16) ?? '', distance: t.distance, cost_estimation: t.cost_estimation ?? 0, status: t.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, start_time: new Date(form.start_time).toISOString() };
    if (editing) await update.mutateAsync({ id: editing.id, data: payload });
    else {
      await create.mutateAsync(payload);
      setPage(1);
    }
    setModalOpen(false);
  };

  const columns = [
    { key: 'start_location', label: 'From' },
    { key: 'end_location', label: 'To' },
    { key: 'vehicle', label: 'Vehicle', render: (r: Trip) => r.vehicle?.plate_number ?? `#${r.vehicle_id}` },
    { key: 'driver', label: 'Driver', render: (r: Trip) => r.driver?.name ?? `#${r.driver_id}` },
    { key: 'status', label: 'Status', render: (r: Trip) => <Badge variant={r.status}>{r.status}</Badge> },
    { key: 'timeline', label: 'Progress', render: (r: Trip) => <TripTimeline status={r.status} /> },
    { key: 'cost', label: 'Est. Cost', render: (r: Trip) => r.cost_estimation ? formatCurrency(r.cost_estimation) : '—' },
    ...(canWrite || canDelete ? [{
      key: 'actions', label: '', render: (r: Trip) => (
        <div className="flex flex-wrap gap-2">
          {canWrite && <EditActionButton onClick={() => openEdit(r)} />}
          {canDelete && (
            <DeleteActionButton
              onClick={() => confirm({
                title: 'Delete trip',
                description: `Delete trip from ${r.start_location} to ${r.end_location}? This action cannot be undone.`,
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
        {canWrite && <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" /><span>Nouveau</span></Button></div>}
        <DataTable columns={columns} data={getPaginatedRows(data)} loading={isLoading}
          emptyTitle="No trips scheduled"
          emptyDescription="Create a trip to assign vehicles and drivers."
          emptyIcon={Route}
          filters={[
            { key: 'search', type: 'search', placeholder: 'Search trips...', value: filters.search },
            { key: 'status', type: 'select', placeholder: 'All statuses', value: filters.status, options: STATUSES.map((s) => ({ value: s, label: s })) },
          ]}
          onFilterChange={(k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); }}
        />
        <Pagination meta={getPaginatedMeta(data)} page={page} onPageChange={setPage} />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Trip' : 'Create Trip'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Vehicle" value={form.vehicle_id || ''} onChange={(e) => setForm({ ...form, vehicle_id: +e.target.value })} required>
              <option value="">Select vehicle</option>
              {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.plate_number} – {v.brand}</option>)}
            </Select>
            <Select label="Driver" value={form.driver_id || ''} onChange={(e) => setForm({ ...form, driver_id: +e.target.value })} required>
              <option value="">Select driver</option>
              {(drivers.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <Input label="Start Location" value={form.start_location} onChange={(e) => setForm({ ...form, start_location: e.target.value })} required />
          <Input label="End Location" value={form.end_location} onChange={(e) => setForm({ ...form, end_location: e.target.value })} required />
          <Input label="Start Time" type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Distance (km)" type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: +e.target.value })} />
            <Input label="Est. Cost ($)" type="number" value={form.cost_estimation} onChange={(e) => setForm({ ...form, cost_estimation: +e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Trip['status'] })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
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
