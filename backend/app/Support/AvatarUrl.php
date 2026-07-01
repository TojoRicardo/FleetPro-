<?php

namespace App\Support;

class AvatarUrl
{
    /** Store and return a relative public path, e.g. /storage/avatars/file.jpg */
    public static function fromUploadedPath(string $storedPath): string
    {
        return '/storage/'.ltrim($storedPath, '/');
    }

    /** Normalize legacy absolute or relative values to a /storage/... path. */
    public static function normalize(?string $value): ?string
    {
        if (! $value || str_starts_with($value, 'data:')) {
            return $value;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            $path = parse_url($value, PHP_URL_PATH);
            if (is_string($path) && str_contains($path, '/storage/')) {
                return $path;
            }

            return $value;
        }

        if (str_starts_with($value, '/storage/')) {
            return $value;
        }

        return '/storage/'.ltrim($value, '/');
    }

    /** Resolve disk-relative path (avatars/file.jpg) from a stored URL/path. */
    public static function diskPath(?string $value): ?string
    {
        $normalized = self::normalize($value);
        if (! $normalized || ! str_contains($normalized, '/storage/')) {
            return null;
        }

        return ltrim(str_replace('/storage/', '', $normalized), '/');
    }
}
