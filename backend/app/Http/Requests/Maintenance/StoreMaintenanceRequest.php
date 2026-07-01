<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaintenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Maintenance::class);
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'type' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'cost' => ['required', 'numeric', 'min:0'],
            'maintenance_date' => ['required', 'date'],
        ];
    }
}
