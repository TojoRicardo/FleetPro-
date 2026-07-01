import type { Vehicle } from '@/types';

const MIN_YEAR = 1990;

export type VehicleFormState = {
  plate_number: string;
  brand: string;
  model: string;
  year: number | '';
  mileage: number | '';
  status: Vehicle['status'];
};

export type VehiclePayload = {
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  status: Vehicle['status'];
};

export function getMaxVehicleYear(): number {
  return new Date().getFullYear() + 1;
}

export function validateVehicleForm(form: VehicleFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const maxYear = getMaxVehicleYear();

  const plate = form.plate_number.trim();
  if (!plate) errors.plate_number = 'Plate number is required.';
  else if (plate.length > 20) errors.plate_number = 'Plate number must be at most 20 characters.';

  if (!form.brand.trim()) errors.brand = 'Brand is required.';
  if (!form.model.trim()) errors.model = 'Model is required.';

  const year = form.year === '' ? NaN : Number(form.year);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > maxYear) {
    errors.year = `Year must be between ${MIN_YEAR} and ${maxYear}.`;
  }

  const mileage = form.mileage === '' ? 0 : Number(form.mileage);
  if (!Number.isInteger(mileage) || mileage < 0) {
    errors.mileage = 'Mileage must be a whole number greater than or equal to 0.';
  }

  return errors;
}

export function toVehiclePayload(form: VehicleFormState): VehiclePayload {
  return {
    plate_number: form.plate_number.trim(),
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    mileage: form.mileage === '' ? 0 : Number(form.mileage),
    status: form.status,
  };
}

export function vehicleToForm(vehicle: Vehicle): VehicleFormState {
  return {
    plate_number: vehicle.plate_number,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.mileage,
    status: vehicle.status,
  };
}
