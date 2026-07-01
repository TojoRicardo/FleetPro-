<?php

namespace App\Domain\Feature;

use App\Models\FeatureFlag;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Cache;

class FeatureFlagService
{
    public function __construct(private TenantContext $tenantContext) {}

    public function isEnabled(string $featureName, ?int $tenantId = null): bool
    {
        $tenantId = $tenantId ?? $this->tenantContext->id();

        if (! $tenantId) {
            return false;
        }

        return Cache::remember("feature:{$tenantId}:{$featureName}", 300, function () use ($tenantId, $featureName) {
            return FeatureFlag::where('tenant_id', $tenantId)
                ->where('feature_name', $featureName)
                ->value('is_enabled') ?? false;
        });
    }

    public function enable(string $featureName, ?int $tenantId = null): FeatureFlag
    {
        $tenantId = $tenantId ?? $this->tenantContext->id();
        Cache::forget("feature:{$tenantId}:{$featureName}");

        return FeatureFlag::updateOrCreate(
            ['tenant_id' => $tenantId, 'feature_name' => $featureName],
            ['is_enabled' => true]
        );
    }

    public function disable(string $featureName, ?int $tenantId = null): FeatureFlag
    {
        $tenantId = $tenantId ?? $this->tenantContext->id();
        Cache::forget("feature:{$tenantId}:{$featureName}");

        return FeatureFlag::updateOrCreate(
            ['tenant_id' => $tenantId, 'feature_name' => $featureName],
            ['is_enabled' => false]
        );
    }

    public function seedDefaults(int $tenantId): void
    {
        $defaults = [
            'import_export' => true,
            'documents' => true,
            'analytics' => true,
            'real_time_dashboard' => true,
        ];

        foreach ($defaults as $feature => $enabled) {
            FeatureFlag::updateOrCreate(
                ['tenant_id' => $tenantId, 'feature_name' => $feature],
                ['is_enabled' => $enabled]
            );
        }
    }
}
