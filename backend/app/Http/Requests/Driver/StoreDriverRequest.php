<?php

namespace App\Http\Requests\Driver;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Driver::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'license_number' => ['required', 'string', 'max:50', 'unique:drivers,license_number'],
            'phone' => ['required', 'string', 'max:20'],
            'status' => ['sometimes', Rule::in(['available', 'on_trip', 'unavailable'])],
            'score' => ['sometimes', 'numeric', 'min:0', 'max:5'],
        ];
    }
}
