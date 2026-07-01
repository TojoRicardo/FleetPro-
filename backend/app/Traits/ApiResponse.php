<?php

namespace App\Traits;

use App\Support\ApiErrorCode;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'Success', int $httpCode = 200, ApiErrorCode|string $code = ApiErrorCode::Success)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'code' => $code instanceof ApiErrorCode ? $code->value : $code,
            'data' => $data,
        ], $httpCode);
    }

    protected function paginated(LengthAwarePaginator $paginator, string $message = 'Success')
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'code' => ApiErrorCode::Success->value,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    protected function error(
        string $message = 'Error',
        int $httpCode = 400,
        mixed $errors = null,
        ApiErrorCode|string $code = ApiErrorCode::InternalError,
    ) {
        return response()->json([
            'success' => false,
            'message' => $message,
            'code' => $code instanceof ApiErrorCode ? $code->value : $code,
            'errors' => $errors,
        ], $httpCode);
    }
}
