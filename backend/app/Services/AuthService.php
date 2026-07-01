<?php

namespace App\Services;

use App\Domain\Tenant\TenantService;
use App\Enums\UserRole;
use App\Models\LoginAttempt;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private TenantService $tenantService,
        private TenantContext $tenantContext,
        private RefreshTokenService $refreshTokenService,
    ) {}

    public function register(array $data): array
    {
        if ($this->userRepository->findByEmail($data['email'])) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        return DB::transaction(function () use ($data) {
            $user = $this->userRepository->create([
                'name' => $data['name'],
                'email' => strtolower(trim($data['email'])),
                'password' => $data['password'],
                'role' => UserRole::Admin->value,
            ]);

            $tenant = $this->tenantService->create([
                'company_name' => $data['company_name'] ?? ($data['name']."'s Fleet"),
                'name' => $data['company_name'] ?? ($data['name']."'s Fleet"),
            ], $user);

            $this->tenantContext->set($tenant);

            $user = $user->fresh(['tenant.subscription.plan']);
            $token = $user->createAuthToken();

            $result = [
                'user' => $user,
                'tenant' => $tenant,
                'token' => $token->plainTextToken,
                'expires_at' => $token->accessToken->expires_at?->toIso8601String(),
            ];

            if (config('fleetpro.auth.refresh_token_enabled')) {
                $result = array_merge($result, $this->refreshTokenService->issue($user, request()));
            }

            return $result;
        });
    }

    public function login(array $credentials, ?Request $request = null): array
    {
        $email = strtolower(trim($credentials['email']));
        $user = $this->userRepository->findByEmail($email);

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            $this->logLoginAttempt($email, $request, false, 'invalid_credentials');

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $this->logLoginAttempt($email, $request, true);

        if ($user->tenant_id && ! $user->is_super_admin) {
            $tenant = $user->tenant;
            if ($tenant && $tenant->status === 'suspended') {
                throw ValidationException::withMessages([
                    'email' => ['Your organization has been suspended. Please contact support.'],
                ]);
            }
            if ($tenant) {
                $this->tenantContext->set($tenant);
            }
        }

        $user->revokeAllTokens();
        $this->refreshTokenService->revokeAllForUser($user);
        $user->update(['last_login_at' => now()]);
        event(new \App\Events\UserLoggedIn($user));
        $token = $user->createAuthToken();

        $result = [
            'user' => $user->load(['tenant.subscription.plan']),
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at?->toIso8601String(),
        ];

        if (config('fleetpro.auth.refresh_token_enabled')) {
            $result = array_merge($result, $this->refreshTokenService->issue($user, $request));
        }

        return $result;
    }

    public function refresh(string $refreshToken, ?Request $request = null): array
    {
        return $this->refreshTokenService->rotate($refreshToken, $request);
    }

    private function logLoginAttempt(string $email, ?Request $request, bool $success, ?string $reason = null): void
    {
        LoginAttempt::create([
            'email' => $email,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'success' => $success,
            'failure_reason' => $reason,
            'created_at' => now(),
        ]);
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        $this->refreshTokenService->revokeAllForUser($user);
    }

    public function logoutAllDevices(User $user): void
    {
        $user->revokeAllTokens();
        $this->refreshTokenService->revokeAllForUser($user);
    }
}
