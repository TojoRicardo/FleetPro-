<?php

namespace App\Http\Requests\Trip;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Trip::class);
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'driver_id' => ['required', 'exists:drivers,id'],
            'start_location' => ['required', 'string', 'max:255'],
            'end_location' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date'],
            'end_time' => ['nullable', 'date', 'after:start_time'],
            'distance' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['scheduled', 'ongoing', 'completed', 'cancelled'])],
        ];
    }
}
