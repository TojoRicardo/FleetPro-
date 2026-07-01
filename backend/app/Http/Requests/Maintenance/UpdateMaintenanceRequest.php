<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaintenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('maintenance'));
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['sometimes', 'exists:vehicles,id'],
            'type' => ['sometimes', 'string', 'max:100'],
            'description' => ['sometimes', 'string'],
            'cost' => ['sometimes', 'numeric', 'min:0'],
            'maintenance_date' => ['sometimes', 'date'],
        ];
    }
}
