<?php

namespace App\Support;

use Illuminate\Http\Request;

class ApiExceptionRenderer
{
    public static function json(string $message, int $status, ApiErrorCode $code, mixed $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'code' => $code->value,
            'errors' => $errors,
        ], $status);
    }

    public static function shouldRenderApi(Request $request): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }
}
