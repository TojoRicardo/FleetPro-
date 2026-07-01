<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $users = DB::table('users')
            ->whereNotNull('avatar_url')
            ->get(['id', 'avatar_url']);

        foreach ($users as $user) {
            $url = $user->avatar_url;
            if (! is_string($url) || ! str_starts_with($url, 'http')) {
                continue;
            }

            $path = parse_url($url, PHP_URL_PATH);
            if (! is_string($path) || ! str_starts_with($path, '/storage/')) {
                continue;
            }

            DB::table('users')->where('id', $user->id)->update(['avatar_url' => $path]);
        }
    }

    public function down(): void
    {
        // Legacy absolute URLs are not restored.
    }
};
