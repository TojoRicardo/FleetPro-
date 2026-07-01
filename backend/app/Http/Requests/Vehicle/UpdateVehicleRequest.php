<?php

namespace App\Http\Requests\Vehicle;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('vehicle'));
    }

    public function rules(): array
    {
        $vehicleId = $this->route('vehicle')?->id ?? $this->route('vehicle');
        $tenantId = app(TenantContext::class)->id() ?? $this->user()->tenant_id;

        return [
            'plate_number' => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('vehicles', 'plate_number')
                    ->ignore($vehicleId)
                    ->where('tenant_id', $tenantId),
            ],
            'brand' => ['sometimes', 'string', 'max:100'],
            'model' => ['sometimes', 'string', 'max:100'],
            'year' => ['sometimes', 'integer', 'min:1990', 'max:'.(date('Y') + 1)],
            'mileage' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['active', 'maintenance', 'inactive'])],
        ];
    }
}
