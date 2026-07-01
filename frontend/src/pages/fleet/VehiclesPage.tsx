import { useState } from 'react';
import { Plus, Car } from 'lucide-react';
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
import { useVehicles, useVehicleMutations } from '@/hooks/useQueries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_PAGE_SIZE, getApiValidationErrors, getPaginatedMeta, getPaginatedRows } from '@/utils';
import { trackApiError } from '@/api/errorHandler';
import {
  getMaxVehicleYear,
  toVehiclePayload,
  validateVehicleForm,
  vehicleToForm,
  type VehicleFormState,
} from '@/utils/vehicleForm';
import type { Vehicle } from '@/types';

const emptyForm: VehicleFormState = {
  plate_number: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  mileage: 0,
  status: 'active',
};

export default function VehiclesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const debouncedSearch = useDebouncedValue(filters.search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'manager');
  const canDelete = hasRole('admin', 'super_admin');

  const { data, isLoading } = useVehicles({ page, per_page: DEFAULT_PAGE_SIZE, search: debouncedSearch, status: filters.status });
  const { create, update, remove } = useVehicleMutations();
  const { confirm, dialogProps } = useConfirmDialog();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm(vehicleToForm(v));
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clientErrors = validateVehicleForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    const payload = toVehiclePayload(form);

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload });
      } else {
        setPage(1);
        setFilters({ search: '', status: '' });
        await create.mutateAsync(payload);
      }
      setModalOpen(false);
      setFieldErrors({});
    } catch (error) {
      trackApiError(error, 'vehicles/save');
      const apiErrors = getApiValidationErrors(error);
      if (apiErrors) setFieldErrors(apiErrors);
    }
  };

  const columns = [
    { key: 'plate_number', label: 'Plate' },
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'year', label: 'Year' },
    { key: 'mileage', label: 'Mileage', render: (r: Vehicle) => `${r.mileage.toLocaleString()} km` },
    { key: 'status', label: 'Status', render: (r: Vehicle) => <Badge variant={r.status}>{r.status}</Badge> },
    ...(canWrite || canDelete ? [{
      key: 'actions', label: 'Actions',
      render: (r: Vehicle) => (
        <div className="flex flex-wrap gap-2">
          {canWrite && <EditActionButton onClick={() => openEdit(r)} />}
          {canDelete && (
            <DeleteActionButton
              onClick={() => confirm({
                title: 'Delete vehicle',
                description: `Are you sure you want to delete ${r.plate_number}? This action cannot be undone.`,
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
        {canWrite && (
          <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" /><span>Ajouter</span></Button></div>
        )}
        <DataTable
          columns={columns}
          data={getPaginatedRows(data)}
          loading={isLoading}
          emptyTitle="No vehicles yet"
          emptyDescription="Add your first vehicle to start managing your fleet."
          emptyIcon={Car}
          selectable={canDelete}
          onBulkDelete={(ids) => {
            confirm({
              title: `Delete ${ids.length} vehicle${ids.length > 1 ? 's' : ''}`,
              description: 'Selected vehicles will be permanently removed from your fleet. This action cannot be undone.',
              confirmLabel: 'Delete all',
              onConfirm: async () => { await Promise.all(ids.map((id) => remove.mutateAsync(id as number))); },
            });
          }}
          filters={[
            { key: 'search', type: 'search', placeholder: 'Search vehicles...', value: filters.search },
            { key: 'status', type: 'select', placeholder: 'All statuses', value: filters.status, options: [
              { value: 'active', label: 'Active' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'inactive', label: 'Inactive' },
            ]},
          ]}
          onFilterChange={(k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); }}
        />
        <Pagination meta={getPaginatedMeta(data)} page={page} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Plate Number"
            value={form.plate_number}
            onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
            error={fieldErrors.plate_number}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              error={fieldErrors.brand}
              required
            />
            <Input
              label="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              error={fieldErrors.model}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Year"
              type="number"
              min={1990}
              max={getMaxVehicleYear()}
              value={form.year}
              onChange={(e) => {
                const raw = e.target.value;
                setForm({ ...form, year: raw === '' ? '' : parseInt(raw, 10) });
              }}
              error={fieldErrors.year}
              required
            />
            <Input
              label="Mileage"
              type="number"
              min={0}
              step={1}
              value={form.mileage}
              onChange={(e) => {
                const raw = e.target.value;
                setForm({ ...form, mileage: raw === '' ? '' : parseInt(raw, 10) });
              }}
              error={fieldErrors.mileage}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}
            error={fieldErrors.status}
          >
            <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option>
          </Select>
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
