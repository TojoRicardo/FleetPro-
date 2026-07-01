<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private AuthService $authService) {}

    public function register(RegisterRequest $request)
    {
        $result = $this->authService->register($request->validated());

        return $this->success($result, 'Registration successful.', 201);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated(), $request);

        return $this->success($result, 'Login successful.');
    }

    public function refresh(Request $request)
    {
        $request->validate(['refresh_token' => ['required', 'string']]);

        $result = $this->authService->refresh($request->input('refresh_token'), $request);

        return $this->success($result, 'Token refreshed successfully.');
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return $this->success(null, 'Logged out successfully.');
    }

    public function logoutAll(Request $request)
    {
        $this->authService->logoutAllDevices($request->user());

        return $this->success(null, 'Logged out from all devices.');
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['tenant.subscription.plan']);

        return $this->success([
            'user' => $user,
            'tenant' => $user->tenant,
            'subscription' => $user->tenant?->subscription,
            'plan' => $user->tenant?->subscription?->plan,
        ]);
    }
}
