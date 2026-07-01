<?php

namespace App\Http\Requests\Driver;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('driver'));
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'license_number' => ['sometimes', 'string', 'max:50', Rule::unique('drivers', 'license_number')->ignore($this->route('driver'))],
            'phone' => ['sometimes', 'string', 'max:20'],
            'status' => ['sometimes', Rule::in(['available', 'on_trip', 'unavailable'])],
            'score' => ['sometimes', 'numeric', 'min:0', 'max:5'],
        ];
    }
}
