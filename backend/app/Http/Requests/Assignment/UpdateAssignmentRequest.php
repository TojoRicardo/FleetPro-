<?php

namespace App\Http\Requests\Assignment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('assignment'));
    }

    public function rules(): array
    {
        return [
            'driver_id' => ['sometimes', 'exists:drivers,id'],
            'assigned_at' => ['sometimes', 'date'],
            'unassigned_at' => ['nullable', 'date'],
        ];
    }
}
