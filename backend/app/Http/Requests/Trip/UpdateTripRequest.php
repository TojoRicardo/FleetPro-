<?php

namespace App\Http\Requests\Trip;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('trip'));
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['sometimes', 'exists:vehicles,id'],
            'driver_id' => ['sometimes', 'exists:drivers,id'],
            'start_location' => ['sometimes', 'string', 'max:255'],
            'end_location' => ['sometimes', 'string', 'max:255'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['nullable', 'date', 'after:start_time'],
            'distance' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['scheduled', 'ongoing', 'completed', 'cancelled'])],
        ];
    }
}
