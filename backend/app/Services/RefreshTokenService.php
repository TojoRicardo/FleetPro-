<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RefreshTokenService
{
    public function issue(User $user, ?Request $request = null): array
    {
        $plainToken = Str::random(64);

        $record = RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays((int) config('fleetpro.auth.refresh_token_ttl_days', 30)),
            'user_agent' => $request?->userAgent(),
            'ip_address' => $request?->ip(),
        ]);

        return [
            'refresh_token' => $plainToken,
            'refresh_token_expires_at' => $record->expires_at->toIso8601String(),
        ];
    }

    public function rotate(string $plainToken, ?Request $request = null): array
    {
        $hash = hash('sha256', $plainToken);
        $existing = RefreshToken::where('token_hash', $hash)->first();

        if (! $existing || ! $existing->isValid()) {
            throw new \Illuminate\Auth\AuthenticationException('Invalid or expired refresh token.');
        }

        $existing->update(['revoked_at' => now()]);

        $user = $existing->user;
        $user->revokeAllTokens();
        $accessToken = $user->createAuthToken('refreshed-token');
        $refresh = $this->issue($user, $request);

        RefreshToken::where('token_hash', hash('sha256', $refresh['refresh_token']))
            ->update(['replaced_by_id' => $existing->id]);

        return [
            'user' => $user->load(['tenant.subscription.plan']),
            'token' => $accessToken->plainTextToken,
            'expires_at' => $accessToken->accessToken->expires_at?->toIso8601String(),
            ...$refresh,
        ];
    }

    public function revokeAllForUser(User $user): void
    {
        RefreshToken::where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }
}
