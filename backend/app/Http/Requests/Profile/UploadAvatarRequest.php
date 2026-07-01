<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048', 'dimensions:max_width=4096,max_height=4096'],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => 'Veuillez sélectionner une image.',
            'avatar.image' => 'Le fichier doit être une image.',
            'avatar.mimes' => 'Formats acceptés : JPEG, PNG, WebP ou GIF.',
            'avatar.max' => 'L\'image ne doit pas dépasser 2 Mo.',
        ];
    }
}
