<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthService;
use App\Services\RefreshTokenService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GovernanceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private AuthService $authService,
        private RefreshTokenService $refreshTokenService,
    ) {}

    public function exportData(Request $request)
    {
        $user = $request->user()->load(['tenant', 'auditLogs']);

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'profile' => $user->only(['id', 'name', 'email', 'phone', 'job_title', 'department', 'role', 'created_at']),
            'tenant' => $user->tenant?->only(['id', 'name', 'slug', 'status']),
            'activity' => $user->auditLogs()->latest()->limit(500)->get(['action', 'entity_type', 'entity_id', 'created_at']),
        ];

        return $this->success($payload, 'User data export generated.');
    }

    public function deleteAccount(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
            'confirmation' => ['required', 'in:DELETE'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return $this->error('Password confirmation failed.', 422, ['password' => ['Invalid password.']]);
        }

        if ($user->is_super_admin) {
            return $this->error('Super admin accounts cannot be self-deleted.', 403);
        }

        DB::transaction(function () use ($user) {
            $this->authService->logoutAllDevices($user);
            $this->refreshTokenService->revokeAllForUser($user);

            if ($user->avatar_url && ! str_starts_with($user->avatar_url, 'http')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', parse_url($user->avatar_url, PHP_URL_PATH) ?? ''));
            }

            $user->update([
                'name' => 'Deleted User',
                'email' => 'deleted_'.$user->id.'@anonymized.local',
                'phone' => null,
                'job_title' => null,
                'department' => null,
                'avatar_url' => null,
                'status' => 'inactive',
                'password' => Str::random(64),
            ]);
        });

        return $this->success(null, 'Account anonymized successfully.');
    }
}
