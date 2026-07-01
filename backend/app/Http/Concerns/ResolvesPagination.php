<?php

namespace App\Http\Concerns;

use Illuminate\Http\Request;

trait ResolvesPagination
{
    protected function resolvePerPage(Request $request, int $default = 15, int $max = 100): int
    {
        return min(max((int) $request->get('per_page', $default), 1), $max);
    }

    protected function resolveFilters(Request $request, array $keys): array
    {
        return array_filter(
            $request->only($keys),
            fn ($value) => $value !== null && $value !== ''
        );
    }
}
