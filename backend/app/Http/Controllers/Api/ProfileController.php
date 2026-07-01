<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UploadAvatarRequest;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Services\AuditLogEntityResolver;
use App\Support\AvatarUrl;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request)
    {
        return $this->success($request->user()->load('tenant'));
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());

        return $this->success($user->fresh()->load('tenant'), 'Profil mis à jour.');
    }

    public function uploadAvatar(UploadAvatarRequest $request)
    {
        $user = $request->user();
        $this->deleteStoredAvatar($user->avatar_url);

        $path = $request->file('avatar')->store('avatars', 'public');
        $url = AvatarUrl::fromUploadedPath($path);

        $user->update(['avatar_url' => $url]);

        return $this->success($user->fresh()->load('tenant'), 'Photo de profil mise à jour.');
    }

    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        $this->deleteStoredAvatar($user->avatar_url);

        $user->update(['avatar_url' => null]);

        return $this->success($user->fresh()->load('tenant'), 'Photo de profil supprimée.');
    }

    private function deleteStoredAvatar(?string $avatarUrl): void
    {
        $relative = AvatarUrl::diskPath($avatarUrl);
        if (! $relative) {
            return;
        }

        Storage::disk('public')->delete($relative);
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return $this->error('Mot de passe actuel incorrect.', 422, [
                'current_password' => ['Mot de passe actuel incorrect.'],
            ]);
        }

        $user->update(['password' => $request->input('password')]);

        return $this->success(null, 'Mot de passe mis à jour.');
    }

    public function sessions(Request $request)
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        $sessions = $request->user()->tokens()
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'is_current' => $token->id === $currentTokenId,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
            ]);

        return $this->success($sessions);
    }

    public function revokeSession(Request $request, int $tokenId)
    {
        $token = $request->user()->tokens()->where('id', $tokenId)->first();

        if (! $token) {
            return $this->error('Session introuvable.', 404);
        }

        if ($token->id === $request->user()->currentAccessToken()?->id) {
            return $this->error('Impossible de révoquer la session active.', 422);
        }

        $token->delete();

        return $this->success(null, 'Session révoquée.');
    }

    public function activity(Request $request)
    {
        $logs = AuditLog::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(8)
            ->get();

        $resolver = new AuditLogEntityResolver;

        $data = $logs->map(
            fn (AuditLog $log) => (new AuditLogResource($log, $resolver))->resolve()
        )->values();

        return $this->success($data);
    }
}
