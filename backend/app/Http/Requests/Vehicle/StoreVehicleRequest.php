<?php

namespace App\Http\Requests\Vehicle;

use App\Services\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Vehicle::class);
    }

    public function rules(): array
    {
        $tenantId = app(TenantContext::class)->id() ?? $this->user()->tenant_id;

        return [
            'plate_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('vehicles', 'plate_number')->where('tenant_id', $tenantId),
            ],
            'brand' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1990', 'max:'.(date('Y') + 1)],
            'mileage' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['active', 'maintenance', 'inactive'])],
        ];
    }
}
